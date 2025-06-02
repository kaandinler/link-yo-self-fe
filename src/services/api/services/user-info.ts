import { useCallback } from "react";
import { User } from "../types/user";
import { BaseResponseModel } from "../types/base-response";
import { makeFastAPIRequestWithAuth } from "../fastapi-utils";

/**
 * FastAPI user info endpoint service
 *
 * Bu servis login sonrası kullanıcı bilgilerini almak için kullanılır.
 * FastAPI token response'larında genellikle user data bulunmadığı için
 * ayrı bir endpoint'e istek gönderilmesi gerekir.
 */
export function useAuthMeWithFastAPIService() {
  return useCallback(
    async (accessToken: string): Promise<BaseResponseModel<User>> => {
      return makeFastAPIRequestWithAuth<User>("/v1/auth/me", accessToken, {
        method: "GET",
      });
    },
    []
  );
}

/**
 * Generic user profile fetching service
 * Herhangi bir kullanıcının profilini almak için kullanılabilir
 */
export function useUserProfileWithFastAPIService() {
  return useCallback(
    async (
      userId: string,
      accessToken: string
    ): Promise<BaseResponseModel<User>> => {
      return makeFastAPIRequestWithAuth<User>(
        `/v1/users/${userId}`,
        accessToken,
        {
          method: "GET",
        }
      );
    },
    []
  );
}

/**
 * Update user profile with FastAPI
 */
export type UserUpdateRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
  // Add other fields as needed
};

export function useUpdateUserProfileWithFastAPIService() {
  return useCallback(
    async (
      userId: string,
      userData: UserUpdateRequest,
      accessToken: string
    ): Promise<BaseResponseModel<User>> => {
      return makeFastAPIRequestWithAuth<User>(
        `/v1/users/${userId}`,
        accessToken,
        {
          method: "PATCH",
          body: userData,
        }
      );
    },
    []
  );
}

/**
 * Change password with FastAPI
 */
export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export function useChangePasswordWithFastAPIService() {
  return useCallback(
    async (
      passwordData: ChangePasswordRequest,
      accessToken: string
    ): Promise<BaseResponseModel<void>> => {
      return makeFastAPIRequestWithAuth<void>(
        "/v1/auth/change-password",
        accessToken,
        {
          method: "POST",
          body: passwordData,
        }
      );
    },
    []
  );
}
