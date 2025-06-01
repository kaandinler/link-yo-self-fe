"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;
// Original endpoints
export const AUTH_REFRESH_URL = API_URL + "/v1/auth/refresh";
export const AUTH_ME_URL = API_URL + "/v1/auth/me";
export const AUTH_LOGOUT_URL = API_URL + "/v1/auth/logout";

// Custom FastAPI endpoints
export const CUSTOM_AUTH_LOGIN_URL = API_URL + "/v1/auth/token";
export const CUSTOM_AUTH_ME_URL = API_URL + "/v1/auth/me";
export const CUSTOM_AUTH_LOGOUT_URL = API_URL + "/v1/auth/logout";
