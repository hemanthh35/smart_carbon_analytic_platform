import axiosInstance from '../axios';
import { CarbonCredit, CarbonCreditRequest, CarbonCreditDetails } from '../../types';

export const carbonCreditApi = {
  computeCredits: async (payload: CarbonCreditRequest): Promise<CarbonCredit> => {
    const response = await axiosInstance.post<CarbonCredit>('/carbon-credit', payload);
    return response.data;
  },

  listCredits: async (): Promise<CarbonCreditDetails[]> => {
    const response = await axiosInstance.get<CarbonCreditDetails[]>('/carbon-credits');
    return response.data;
  },
};

