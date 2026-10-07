import axiosInstance from '../axios';
import { DashboardOverview, EmissionTrendPoint, CreditTrendPoint, CountryAnalytic } from '../../types';

export const dashboardApi = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await axiosInstance.get<DashboardOverview>('/dashboard/overview');
    return response.data;
  },

  getEmissionsTrend: async (): Promise<EmissionTrendPoint[]> => {
    const response = await axiosInstance.get<EmissionTrendPoint[]>('/dashboard/emissions-trend');
    return response.data;
  },

  getCreditTrend: async (): Promise<CreditTrendPoint[]> => {
    const response = await axiosInstance.get<CreditTrendPoint[]>('/dashboard/credit-trend');
    return response.data;
  },

  getCountries: async (): Promise<CountryAnalytic[]> => {
    const response = await axiosInstance.get<CountryAnalytic[]>('/dashboard/countries');
    return response.data;
  },
};
