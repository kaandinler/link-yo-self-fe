import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL, AUTH_SESSION_URL } from "../config";
import { User } from "../types/user";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";
import { BaseResponseModel } from "../types/base-response";
import {
  parseAPIError,
  safeParseApiResponse,
  ProcessedApiError as _ProcessedApiError,
} from "../types/fastapi-errors";

export type AuthLoginRequest = {
  username: string;
  password: string;
};

/**
 * Giris.
 *
 * ARTIK BACKEND'E DOGRUDAN GITMIYOR. Eskiden burada FastAPI'nin
 * /v1/auth/token ucu cagriliyor ve yanittaki token istemcide bir
 * cereze yaziliyordu -- yani token tarayicidaki JavaScript'in elinden
 * geciyordu. Cagri artik kendi sunucumuzdaki /api/auth/session ucuna
 * gidiyor; token'i o uc aliyor, HttpOnly cereze yaziyor ve govdeden
 * cikariyor. Buraya donen tek sey kullanici bilgisi.
 */
export function useAuthLoginWithFastAPIService() {
  return useCallback(
    async (data: AuthLoginRequest): Promise<BaseResponseModel<User>> => {
      try {
        const response = await fetch(AUTH_SESSION_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = (await safeParseApiResponse(response)) as Record<
          string,
          unknown
        >;

        if (response.ok && result && !("detail" in result)) {
          return result as unknown as BaseResponseModel<User>;
        }

        const parsedError = parseAPIError(result, response);

        return {
          status: "error",
          message: parsedError.message,
          data: undefined,
          errors: parsedError.fieldErrors,
        };
      } catch (error) {
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
 * Backend mevcut sifreyi dogruluyor, diger cihazlardaki oturumlari
 * kapatiyor ve bu oturumun devam edebilmesi icin yeni bir token cifti
 * donuyor. TOKEN'LARI ISTEMCI GORMUYOR: vekil onlari yanittan alip
 * HttpOnly cereze yaziyor ve govdeden cikariyor (bkz.
 * app/api/proxy/[...yol]/route.ts, tokenTasiyanYanit). Yani burada
 * yapilacak bir sey yok -- eskiden vardi ve unutulsaydi kullanici bir
 * sonraki yenilemede oturumdan duserdi.
 */
export type AuthChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

export type AuthChangePasswordResponse = {
  status: string;
  message?: string | null;
  /** Token alanlari vekil tarafindan cikarildi; geriye token_type kaliyor. */
  data: { token_type?: string };
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

/**
 * E-posta degistirme TALEBI.
 *
 * Adres hemen degismiyor: backend yeni adrese dogrulama baglantisi
 * gonderiyor ve degisiklik ancak kullanici o baglantiya tikladiginda
 * uygulaniyor (202 doner).
 */
export type AuthChangeEmailRequest = {
  password: string;
  new_email: string;
};

export type AuthPendingEmailResponse = {
  status: string;
  message?: string | null;
  data: { pending_email: string };
};

export type AuthChangeEmailResponse = AuthPendingEmailResponse;

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

/** E-postadaki dogrulama baglantisini isler; token istemez. */
export type AuthVerifyEmailRequest = {
  token: string;
};

export type AuthVerifyEmailResponse = {
  status: string;
  message?: string | null;
  data: User;
};

export function useAuthVerifyEmailService() {
  const fetchBase = useFetch();

  return useCallback(
    (data: AuthVerifyEmailRequest, requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/verify-email`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthVerifyEmailResponse>);
    },
    [fetchBase]
  );
}

/** Dogrulama baglantisini yeniden gonderir; gittigi adresi doner. */
export function useAuthResendVerificationService() {
  const fetchBase = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/auth/resend-verification`, {
        method: "POST",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AuthPendingEmailResponse>);
    },
    [fetchBase]
  );
}

export type AuthGetMeResponse = User;
