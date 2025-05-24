import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { CustomLoginResponse } from "../types/custom-user";

// Login request type
export type CustomAuthLoginRequest = {
  email: string;
  password: string;
};

// Create a custom hook for login
export function useCustomAuthLoginService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: CustomAuthLoginRequest) => {
      // Update the endpoint to match your FastAPI endpoint
      return fetchBase(`${API_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then(wrapperFetchJsonResponse<CustomLoginResponse>);
    },
    [fetchBase]
  );
}

// Custom me endpoint
export function useCustomAuthMeService() {
  const fetchBase = useFetch();

  return useCallback(() => {
    // Update the endpoint to match your FastAPI endpoint for getting user info
    return fetchBase(`${API_URL}/auth/me`, {
      method: "GET",
    }).then(wrapperFetchJsonResponse);
  }, [fetchBase]);
}

// Custom logout endpoint
export function useCustomAuthLogoutService() {
  const fetchBase = useFetch();

  return useCallback(() => {
    // Update the endpoint to match your FastAPI logout endpoint
    return fetchBase(`${API_URL}/auth/logout`, {
      method: "POST",
    }).then(wrapperFetchJsonResponse);
  }, [fetchBase]);
}
