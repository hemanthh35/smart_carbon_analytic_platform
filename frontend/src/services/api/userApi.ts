import axiosInstance from '../axios';
import { User, AuditLog } from '../../types';

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get<User>('/users/me');
    return response.data;
  },

  updateMe: async (payload: { name?: string; email?: string }): Promise<User> => {
    const response = await axiosInstance.patch<User>('/users/me', payload);
    return response.data;
  },

  listUsers: async (skip = 0, limit = 50): Promise<{ total: number; users: User[] }> => {
    const response = await axiosInstance.get<{ total: number; users: User[] }>('/admin/users', {
      params: { skip, limit },
    });
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await axiosInstance.delete(`/admin/users/${userId}`);
  },

  getAuditLogs: async (skip = 0, limit = 50): Promise<{ total: number; logs: AuditLog[] }> => {
    const response = await axiosInstance.get<{ total: number; logs: AuditLog[] }>('/admin/logs', {
      params: { skip, limit },
    });
    return response.data;
  },
};
