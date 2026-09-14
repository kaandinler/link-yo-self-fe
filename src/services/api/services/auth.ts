import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import { isBaseResponseModel } from "../fastapi-utils";
import { User } from "../types/user";
import { Tokens } from "../types/tokens";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";
import { BaseResponseModel, TokenResponse } from "../types/base-response";
import {
  parseAPIError,
  safeParseApiResponse,
  ProcessedApiError as _ProcessedApiError,
} from "../types/fastapi-errors";

export type AuthLoginRequest = {
  username: string;
  password: string;
};

export type AuthLoginResponse = Tokens & {
  user: User;
};

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
        const result = (await safeParseApiResponse(response)) as Record<
          string,
          unknown
        >;

        // Başarılı yanıt kontrolü
        if (response.ok && result && !("detail" in result)) {
          // Normal BaseResponseModel formatı
          if ("status" in result && "data" in result) {
            // Tip güvenliği için iki adımda dönüştürme
            const typedResult =
              result as unknown as BaseResponseModel<TokenResponse>;
            return typedResult;
          }

          // Eğer doğrudan token data'sı geliyorsa BaseResponseModel'e çevir
          if ("access_token" in result) {
            return {
              status: "success",
              message: "Welcome back!",
              data: result as unknown as TokenResponse,
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

export type AuthFacebookLoginRequest = {
  accessToken: string;
};

export type AuthFacebookLoginResponse = Tokens & {
  user: User;
};

export type AuthSignUpRequest = {
  email: string;
  password: string;
  username: string;
};

export type AuthSignUpResponse = void;

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
        const result = (await safeParseApiResponse(response)) as Record<
          string,
          unknown
        >;
        console.log("🔑 Auth service: Sign-up parsed response:", result);

        // Başarılı yanıt kontrolü
        if (
          response.ok &&
          result &&
          typeof result === "object" &&
          !("detail" in result)
        ) {
          // Normal BaseResponseModel formatı
          if ("status" in result) {
            // Tip güvenliği için iki adımda dönüştürme
            const typedResult = result as unknown as BaseResponseModel<void>;
            return typedResult;
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

export type AuthConfirmNewEmailRequest = {
  hash: string;
};

export type AuthConfirmNewEmailResponse = void;

export type AuthForgotPasswordRequest = {
  email: string;
};

export type AuthForgotPasswordResponse = void;

export function useAuthForgotPasswordService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthForgotPasswordRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/forgot-password`, {
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
  /** E-postadaki baglantidaki tek kullanimlik token. */
  token: string;
};

export type AuthResetPasswordResponse = void;

export function useAuthResetPasswordService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthResetPasswordRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(API_URL + "/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthResetPasswordResponse>);
    },
    [fetchBase]
  );
}

/**
 * Giris yapmis kullanicinin kendi sifresini degistirmesi.
 *
 * Backend mevcut sifreyi dogruluyor, diger cihazlardaki oturumlari kapatiyor
 * ve bu oturumun devam edebilmesi icin yeni bir token cifti donuyor -- yani
 * yanit token'lari saklanmali, yoksa kullanici bir sonraki yenilemede
 * oturumdan duser.
 */
export type AuthChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

export type AuthChangePasswordResponse = {
  status: string;
  message?: string | null;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
};

export function useAuthChangePasswordService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthChangePasswordRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/change-password`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthChangePasswordResponse>);
    },
    [fetchBase]
  );
}

/** Sifre onayi ile e-posta degistirme; guncel kullaniciyi doner. */
export type AuthChangeEmailRequest = {
  password: string;
  new_email: string;
};

export type AuthChangeEmailResponse = {
  status: string;
  message?: string | null;
  data: User;
};

export function useAuthChangeEmailService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthChangeEmailRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/change-email`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthChangeEmailResponse>);
    },
    [fetchBase]
  );
}

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

        const result = (await safeParseApiResponse(response)) as Record<
          string,
          unknown
        >;

        // Başarılı yanıt kontrolü
        if (
          response.ok &&
          result &&
          typeof result === "object" &&
          !("detail" in result)
        ) {
          // Normal BaseResponseModel formatı
          if (isBaseResponseModel<void>(result)) {
            return result;
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

export type AuthGetMeResponse = User;
