import axiosInstance from '../axios';
import { Prediction } from '../../types';

export const predictionApi = {
  predictSimple: async (payload: Record<string, unknown>): Promise<Prediction> => {
    const response = await axiosInstance.post<Prediction>('/predict', payload);
    return response.data;
  },

  predictFull: async (payload: Record<string, unknown>): Promise<Prediction> => {
    const response = await axiosInstance.post<Prediction>('/predict/full', payload);
    return response.data;
  },

  listPredictions: async (skip = 0, limit = 50): Promise<{ total: number; predictions: Prediction[] }> => {
    const response = await axiosInstance.get<{ total: number; predictions: Prediction[] }>('/admin/predictions', {
      params: { skip, limit },
    });
    return response.data;
  },

  listUserPredictions: async (skip = 0, limit = 50): Promise<Prediction[]> => {
    const response = await axiosInstance.get<Prediction[]>('/predictions', {
      params: { skip, limit },
    });
    return response.data;
  },

  getCountries: async (): Promise<{ code: string; name: string }[]> => {
    const response = await axiosInstance.get<{ code: string; name: string }[]>('/prediction/countries');
    return response.data;
  },

  getSourceTypes: async (): Promise<string[]> => {
    const response = await axiosInstance.get<string[]>('/prediction/source-types');
    return response.data;
  },

  getSectors: async (): Promise<string[]> => {
    const response = await axiosInstance.get<string[]>('/prediction/sectors');
    return response.data;
  },

  getSubsectors: async (): Promise<string[]> => {
    const response = await axiosInstance.get<string[]>('/prediction/subsectors');
    return response.data;
  },

  getGases: async (): Promise<string[]> => {
    const response = await axiosInstance.get<string[]>('/prediction/gases');
    return response.data;
  },

  getFacilities: async (): Promise<{
    source_id: number;
    source_name: string;
    iso3_country: string;
    country_name: string;
    source_type: string;
    sector: string;
    subsector: string;
    lat: number;
    lon: number;
  }[]> => {
    const response = await axiosInstance.get<any[]>('/prediction/facilities');
    return response.data;
  },

  getPublicStats: async (): Promise<{
    total_facilities: number;
    total_countries: number;
    total_emissions_tracked: number;
    total_credits_issued: number;
    total_predictions: number;
  }> => {
    const response = await axiosInstance.get('/public/stats');
    return response.data;
  },
};

