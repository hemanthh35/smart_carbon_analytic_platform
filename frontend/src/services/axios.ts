import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '../app/store/store';
import { logout, setCredentials } from '../app/store/authSlice';

// Same-origin by default: FastAPI serves both the React app and /api in production.
// Set VITE_API_URL only when intentionally running the frontend against a separate API.
const API_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Refresh Token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    // Don't retry refresh requests or login requests
    if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<{ access_token: string; refresh_token: string }>(
          `${API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = response.data;
        
        // Update store and local storage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user) {
          store.dispatch(setCredentials({ user, accessToken: access_token, refreshToken: refresh_token }));
        }

        processQueue(null, access_token);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
