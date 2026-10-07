import axiosInstance from '../axios';
import { Report, ReportGenerateRequest } from '../../types';

export const reportApi = {
  generateReport: async (payload: ReportGenerateRequest): Promise<Report> => {
    const response = await axiosInstance.post<Report>('/reports/generate', payload);
    return response.data;
  },

  listReports: async (skip = 0, limit = 20): Promise<{ total: number; reports: Report[] }> => {
    const response = await axiosInstance.get<{ total: number; reports: Report[] }>('/reports/', {
      params: { skip, limit },
    });
    return response.data;
  },

  downloadReportBlob: async (reportId: number): Promise<Blob> => {
    const response = await axiosInstance.get(`/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return new Blob([response.data], { type: 'application/pdf' });
  },

  listAllReportsAdmin: async (skip = 0, limit = 50): Promise<{ total: number; reports: Report[] }> => {
    const response = await axiosInstance.get<{ total: number; reports: Report[] }>('/admin/reports', {
      params: { skip, limit },
    });
    return response.data;
  },
};
