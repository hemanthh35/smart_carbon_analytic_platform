export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface PredictionInput {
  activity: number;
  capacity: number;
  capacity_factor: number;
  lat: number;
  lon: number;
  facility_name: string;
  country: string;
  baseline_emission?: number;
}

export interface Prediction {
  id: number;
  user_id: number;
  facility_name: string;
  country: string | null;
  predicted_emission: number;
  baseline_emission: number | null;
  created_at: string;
}

export interface CarbonCreditRequest {
  prediction_id: number;
  baseline_emission: number;
}

export interface CarbonCredit {
  id: number;
  prediction_id: number;
  baseline_emission: number;
  predicted_emission: number;
  reduction: number;
  carbon_credits: number;
  created_at: string;
}

export interface CarbonCreditDetails extends CarbonCredit {
  prediction: {
    facility_name: string;
    country: string | null;
  };
}


export interface Report {
  id: number;
  user_id: number;
  pdf_path: string;
  report_type: string;
  generated_at: string;
  pdf_url: string;
}

export interface ReportGenerateRequest {
  prediction_id: number;
  report_type: string;
}

export interface DashboardOverview {
  total_predictions: number;
  total_emissions_tco2: number;
  total_credits_generated: number;
  avg_reduction_percent: number;
}

export interface EmissionTrendPoint {
  month: string;
  emissions: number;
}

export interface CreditTrendPoint {
  month: string;
  credits: number;
}

export interface CountryAnalytic {
  country: string;
  facility_count: number;
  total_emissions: number;
  credits: number;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  ip_address: string | null;
  timestamp: string;
  user_name: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}

export interface ModelMetrics {
  rmse: number;
  r2: number;
  mae: number;
  accuracy: number;
}
