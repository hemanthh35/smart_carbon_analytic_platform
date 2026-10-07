export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
};

export const ROUTES = {
  DASHBOARD: '/dashboard',
  PREDICT: '/predict',
  PREDICT_RESULT: '/predict/result',
  REPORTS: '/reports',
  ANALYTICS: '/analytics',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_LOGS: '/admin/logs',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
};
