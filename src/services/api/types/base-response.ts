// API yanıt durumları
export type ResponseStatus = "success" | "error" | "warning" | "info";

// API yanıtı için durum enumu
export const API_STATUS = {
  SUCCESS: "success" as const,
  ERROR: "error" as const,
  WARNING: "warning" as const,
  INFO: "info" as const,
} as const;

// Tüm API yanıtları için temel model
export interface BaseResponseModel<T = any> {
  status: ResponseStatus;
  message?: string;
  data?: T;
  errors?: Record<string, string>; // Field-specific errors for form validation
}

// Token response structure from FastAPI backend
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string; // "bearer"
}

// Legacy auth response types (for backwards compatibility)
export interface AuthLoginResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: any; // User tipini gerçek user modeline göre güncelleyin
}

export interface AuthSignUpResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: any;
}
