import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import { User } from "../types/user";
import { Tokens } from "../types/tokens";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";
import { BaseResponseModel, TokenResponse } from "../types/base-response";
import {
  parseAPIError,
  safeParseApiResponse,
  ProcessedApiError,
} from "../types/fastapi-errors";

export type AuthLoginRequest = {
  username: string;
  password: string;
};

export type AuthLoginResponse = Tokens & {
  user: User;
};

export function useAuthLoginService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthLoginRequest) => {
      return fetchBase(`${API_URL}/v1/auth/token`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then(wrapperFetchJsonResponse<AuthLoginResponse>);
    },
    [fetchBase]
  );
}

// New FastAPI-compatible login service that returns BaseResponseModel
export function useAuthLoginWithFastAPIService() {
  return useCallback(
    async (
      data: AuthLoginRequest
    ): Promise<BaseResponseModel<TokenResponse>> => {
      try {
        const formData = new FormData();
        formData.append("username", data.username); // OAuth2 'username' field'ını bekliyor
        formData.append("password", data.password);

        const response = await fetch(`${API_URL}/v1/auth/token`, {
          method: "POST",
          body: formData,
        });

        const result = await safeParseApiResponse(response);

        // Başarılı yanıt kontrolü
        if (response.ok && result && !result.detail) {
          // Normal BaseResponseModel formatı
          if (result.status && result.data) {
            return result as BaseResponseModel<TokenResponse>;
          }

          // Eğer doğrudan token data'sı geliyorsa BaseResponseModel'e çevir
          if (result.access_token) {
            return {
              status: "success",
              message: "Welcome back!",
              data: result as TokenResponse,
            };
          }
        }

        // Hata durumunu parse et
        const parsedError = parseAPIError(result, response);

        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
          errors: parsedError.fieldErrors,
        };
      } catch (error) {
        // Network hatası
        const parsedError = parseAPIError(error);
        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
        };
      }
    },
    []
  );
}

export type AuthGoogleLoginRequest = {
  idToken: string;
};

export type AuthGoogleLoginResponse = Tokens & {
  user: User;
};

export function useAuthGoogleLoginService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthGoogleLoginRequest) => {
      return fetchBase(`${API_URL}/v1/auth/google/login`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then(wrapperFetchJsonResponse<AuthGoogleLoginResponse>);
    },
    [fetchBase]
  );
}

export type AuthFacebookLoginRequest = {
  accessToken: string;
};

export type AuthFacebookLoginResponse = Tokens & {
  user: User;
};

export function useAuthFacebookLoginService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthFacebookLoginRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/facebook/login`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthFacebookLoginResponse>);
    },
    [fetchBase]
  );
}

export type AuthSignUpRequest = {
  email: string;
  password: string;
  username: string;
};

export type AuthSignUpResponse = void;

export function useAuthSignUpService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthSignUpRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/email/register`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthSignUpResponse>);
    },
    [fetchBase]
  );
}

// New FastAPI-compatible sign-up service that returns BaseResponseModel
export function useAuthSignUpWithFastAPIService() {
  return useCallback(
    async (data: AuthSignUpRequest): Promise<BaseResponseModel<void>> => {
      try {
        console.log("🔑 Auth service: Sending sign-up request to FastAPI", {
          url: `${API_URL}/v1/auth/register`,
          username: data.username,
          email: data.email,
        });

        const response = await fetch(`${API_URL}/v1/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        console.log(
          "🔑 Auth service: Sign-up response status:",
          response.status
        );

        const result = await safeParseApiResponse(response);
        console.log("🔑 Auth service: Sign-up parsed response:", result);

        // Başarılı yanıt kontrolü
        if (response.ok && result && !result.detail) {
          // Normal BaseResponseModel formatı
          if (result.status) {
            return result as BaseResponseModel<void>;
          }

          // Eğer sadece başarılı status kodu varsa BaseResponseModel'e çevir
          return {
            status: "success",
            message:
              "Account created successfully! Please check your email for verification.",
            data: undefined,
          };
        }

        // Hata durumunu parse et
        const parsedError = parseAPIError(result, response);
        console.log("🔑 Auth service: Sign-up error:", parsedError);

        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
          errors: parsedError.fieldErrors,
        };
      } catch (error) {
        // Network hatası
        console.error("🔑 Auth service: Sign-up network error:", error);
        const parsedError = parseAPIError(error);
        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
        };
      }
    },
    []
  );
}

export type AuthConfirmEmailRequest = {
  hash: string;
};

export type AuthConfirmEmailResponse = void;

export function useAuthConfirmEmailService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthConfirmEmailRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/email/confirm`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthConfirmEmailResponse>);
    },
    [fetchBase]
  );
}

export type AuthConfirmNewEmailRequest = {
  hash: string;
};

export type AuthConfirmNewEmailResponse = void;

export function useAuthConfirmNewEmailService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthConfirmNewEmailRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/email/confirm/new`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthConfirmNewEmailResponse>);
    },
    [fetchBase]
  );
}

export type AuthForgotPasswordRequest = {
  email: string;
};

export type AuthForgotPasswordResponse = void;

export function useAuthForgotPasswordService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthForgotPasswordRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/forgot/password`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthForgotPasswordResponse>);
    },
    [fetchBase]
  );
}

export type AuthResetPasswordRequest = {
  password: string;
  hash: string;
};

export type AuthResetPasswordResponse = void;

export function useAuthResetPasswordService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthResetPasswordRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(API_URL + "/v1/auth/password/reset", {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthResetPasswordResponse>);
    },
    [fetchBase]
  );
}

// New FastAPI-compatible forgot password service
export function useAuthForgotPasswordWithFastAPIService() {
  return useCallback(
    async (
      data: AuthForgotPasswordRequest
    ): Promise<BaseResponseModel<void>> => {
      try {
        const response = await fetch(`${API_URL}/v1/auth/forgot-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await safeParseApiResponse(response);

        // Başarılı yanıt kontrolü
        if (response.ok && result && !result.detail) {
          // Normal BaseResponseModel formatı
          if (result.status) {
            return result as BaseResponseModel<void>;
          }

          // Eğer sadece başarılı status kodu varsa BaseResponseModel'e çevir
          return {
            status: "success",
            message: "Şifre sıfırlama bağlantısı e-postanıza gönderildi.",
            data: undefined,
          };
        }

        // Hata durumunu parse et
        const parsedError = parseAPIError(result, response);

        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
          errors: parsedError.fieldErrors,
        };
      } catch (error) {
        // Network hatası
        const parsedError = parseAPIError(error);
        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
        };
      }
    },
    []
  );
}

// New FastAPI-compatible reset password service
export function useAuthResetPasswordWithFastAPIService() {
  return useCallback(
    async (
      data: AuthResetPasswordRequest
    ): Promise<BaseResponseModel<void>> => {
      try {
        const response = await fetch(`${API_URL}/v1/auth/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await safeParseApiResponse(response);

        // Başarılı yanıt kontrolü
        if (response.ok && result && !result.detail) {
          // Normal BaseResponseModel formatı
          if (result.status) {
            return result as BaseResponseModel<void>;
          }

          // Eğer sadece başarılı status kodu varsa BaseResponseModel'e çevir
          return {
            status: "success",
            message: "Şifreniz başarıyla sıfırlandı.",
            data: undefined,
          };
        }

        // Hata durumunu parse et
        const parsedError = parseAPIError(result, response);

        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
          errors: parsedError.fieldErrors,
        };
      } catch (error) {
        // Network hatası
        const parsedError = parseAPIError(error);
        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
        };
      }
    },
    []
  );
}

// New FastAPI-compatible email confirmation service
export function useAuthConfirmEmailWithFastAPIService() {
  return useCallback(
    async (data: AuthConfirmEmailRequest): Promise<BaseResponseModel<void>> => {
      try {
        const response = await fetch(`${API_URL}/v1/auth/email/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await safeParseApiResponse(response);

        // Başarılı yanıt kontrolü
        if (response.ok && result && !result.detail) {
          // Normal BaseResponseModel formatı
          if (result.status) {
            return result as BaseResponseModel<void>;
          }

          // Eğer sadece başarılı status kodu varsa BaseResponseModel'e çevir
          return {
            status: "success",
            message: "E-posta adresiniz başarıyla doğrulandı.",
            data: undefined,
          };
        }

        // Hata durumunu parse et
        const parsedError = parseAPIError(result, response);

        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
          errors: parsedError.fieldErrors,
        };
      } catch (error) {
        // Network hatası
        const parsedError = parseAPIError(error);
        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
        };
      }
    },
    []
  );
}

// New FastAPI-compatible logout service
export function useAuthLogoutWithFastAPIService() {
  return useCallback(
    async (accessToken: string): Promise<BaseResponseModel<void>> => {
      try {
        const response = await fetch(`${API_URL}/v1/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const result = await safeParseApiResponse(response);

        // Başarılı yanıt kontrolü
        if (response.ok && result && !result.detail) {
          // Normal BaseResponseModel formatı
          if (result.status) {
            return result as BaseResponseModel<void>;
          }

          // Eğer sadece başarılı status kodu varsa BaseResponseModel'e çevir
          return {
            status: "success",
            message: "Başarıyla çıkış yapıldı.",
            data: undefined,
          };
        }

        // Hata durumunu parse et
        const parsedError = parseAPIError(result, response);

        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
          errors: parsedError.fieldErrors,
        };
      } catch (error) {
        // Network hatası
        const parsedError = parseAPIError(error);
        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
        };
      }
    },
    []
  );
}

export type AuthPatchMeRequest =
  | Partial<Pick<User, "firstName" | "lastName" | "email">>
  | { password: string; oldPassword: string };

export type AuthPatchMeResponse = User;

export function useAuthPatchMeService() {
  const fetch = useFetch();

  return useCallback(
    (data: AuthPatchMeRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/users/me`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthPatchMeResponse>);
    },
    [fetch]
  );
}

export type AuthGetMeResponse = User;

export function useAuthGetMeService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/users/me`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthGetMeResponse>);
    },
    [fetch]
  );
}
