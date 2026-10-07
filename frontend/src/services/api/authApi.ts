import axiosInstance from '../axios';
import { TokenResponse } from '../../types';

export const authApi = {
  register: async (payload: Record<string, unknown>): Promise<TokenResponse> => {
    const response = await axiosInstance.post<TokenResponse>('/auth/register', payload);
    return response.data;
  },

  login: async (payload: Record<string, unknown>): Promise<TokenResponse> => {
    const response = await axiosInstance.post<TokenResponse>('/auth/login', payload);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/auth/logout');
    return response.data;
  },
};
