import axiosInstance from '../axios';
import { ModelMetrics } from '../../types';

export interface UserGrowthPoint {
  year: number;
  month: number;
  new_users: number;
}

export interface PredictionStat {
  date: string;
  count: number;
  avg_emission: number;
}

export interface TopCountry {
  country: string;
  count: number;
  total_emissions: number;
}

export interface TopFacility {
  facility_name: string;
  count: number;
  total_emissions: number;
}

export interface ReportStats {
  total_reports: number;
  by_type: Record<string, number>;
}

export const analyticsApi = {
  getUserGrowth: async (): Promise<UserGrowthPoint[]> => {
    const response = await axiosInstance.get<UserGrowthPoint[]>('/admin/user-growth');
    return response.data;
  },

  getPredictionStats: async (): Promise<PredictionStat[]> => {
    const response = await axiosInstance.get<PredictionStat[]>('/admin/prediction-stats');
    return response.data;
  },

  getTopCountries: async (limit = 10): Promise<TopCountry[]> => {
    const response = await axiosInstance.get<TopCountry[]>('/admin/top-countries', {
      params: { limit },
    });
    return response.data;
  },

  getTopFacilities: async (limit = 10): Promise<TopFacility[]> => {
    const response = await axiosInstance.get<TopFacility[]>('/admin/top-facilities', {
      params: { limit },
    });
    return response.data;
  },

  getModelMetrics: async (): Promise<ModelMetrics> => {
    const response = await axiosInstance.get<ModelMetrics>('/admin/model-metrics');
    return response.data;
  },

  getReportStats: async (): Promise<ReportStats> => {
    const response = await axiosInstance.get<ReportStats>('/admin/report-stats');
    return response.data;
  },
};
