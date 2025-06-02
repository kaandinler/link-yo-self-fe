// Generic FastAPI service utility
// Tüm API servisleri için kullanılabilecek genel utility fonksiyonları

import { BaseResponseModel, API_STATUS } from "./types/base-response";
import { parseAPIError, safeParseApiResponse } from "./types/fastapi-errors";
import { API_URL } from "./config";

/**
 * BaseResponseModel'i parse eder ve tip güvenliği sağlar
 */
export function parseBaseResponse<T>(response: any): BaseResponseModel<T> {
  // Eğer zaten BaseResponseModel formatındaysa direkt döndür
  if (response && typeof response === "object" && "status" in response) {
    return response as BaseResponseModel<T>;
  }

  // Eğer sadece data varsa BaseResponseModel'e çevir
  return {
    status: API_STATUS.SUCCESS,
    message: "İşlem başarılı",
    data: response as T,
  };
}

/**
 * API response'unu kontrol eder ve tip güvenliği sağlar
 */
export function isSuccessResponse<T>(
  response: BaseResponseModel<T>
): response is BaseResponseModel<T> & { status: "success" } {
  return response.status === API_STATUS.SUCCESS;
}

/**
 * Error response'unu kontrol eder
 */
export function isErrorResponse<T>(
  response: BaseResponseModel<T>
): response is BaseResponseModel<T> & { status: "error" } {
  return response.status === API_STATUS.ERROR;
}

/**
 * Response'dan data'yı güvenli şekilde alır
 */
export function getResponseData<T>(
  response: BaseResponseModel<T>
): T | undefined {
  return isSuccessResponse(response) ? response.data : undefined;
}

/**
 * Response'dan error mesajını alır
 */
export function getResponseErrorMessage<T>(
  response: BaseResponseModel<T>
): string {
  if (isErrorResponse(response)) {
    return response.message || "Bir hata oluştu";
  }
  return "";
}

/**
 * Response'dan field errors'ları alır
 */
export function getResponseFieldErrors<T>(
  response: BaseResponseModel<T>
): Record<string, string> {
  if (isErrorResponse(response) && response.errors) {
    return response.errors;
  }
  return {};
}

/**
 * Generic FastAPI request handler
 * Tüm FastAPI servislerinde kullanılabilir
 */
export async function makeFastAPIRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<BaseResponseModel<T>> {
  try {
    const { method = "GET", body, headers = {} } = options;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const result = await safeParseApiResponse(response);

    // Başarılı yanıt kontrolü
    if (response.ok && result && !result.detail) {
      // Normal BaseResponseModel formatı
      if (result.status && (result.data !== undefined || result.message)) {
        return result as BaseResponseModel<T>;
      }

      // Eğer doğrudan data geliyorsa BaseResponseModel'e çevir
      if (result && typeof result === "object" && !result.status) {
        return {
          status: "success",
          message: "İşlem başarılı",
          data: result as T,
        };
      }

      // Boş başarılı yanıt
      return {
        status: "success",
        message: "İşlem başarılı",
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
}

/**
 * Form submission helper
 * Form verilerini FastAPI'ye gönderir ve hataları otomatik olarak handle eder
 */
export async function submitFormToFastAPI<TRequest, TResponse>(
  endpoint: string,
  formData: TRequest,
  options?: {
    method?: "POST" | "PUT" | "PATCH";
    onSuccess?: (response: BaseResponseModel<TResponse>) => void;
    onError?: (response: BaseResponseModel<TResponse>) => void;
    onFieldErrors?: (errors: Record<string, string>) => void;
  }
): Promise<BaseResponseModel<TResponse>> {
  const { method = "POST", onSuccess, onError, onFieldErrors } = options || {};

  const response = await makeFastAPIRequest<TResponse>(endpoint, {
    method,
    body: formData,
  });

  // Callback'leri çağır
  if (response.status === "success") {
    onSuccess?.(response);
  } else if (response.status === "error") {
    onError?.(response);

    // Field errors varsa callback'i çağır
    if (response.errors) {
      onFieldErrors?.(response.errors);
    }
  }

  return response;
}

/**
 * Auth token ile istek gönderme
 */
export async function makeFastAPIRequestWithAuth<T>(
  endpoint: string,
  token: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
  } = {}
): Promise<BaseResponseModel<T>> {
  return makeFastAPIRequest<T>(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Example usage patterns:

/*
// 1. Simple API call
const response = await makeFastAPIRequest<UserData>('/users/me', {
  method: 'GET',
});

// 2. Form submission with error handling
const loginResponse = await submitFormToFastAPI<LoginRequest, TokenResponse>(
  '/auth/token',
  { username: 'user@example.com', password: 'password' },
  {
    onSuccess: (response) => {
      console.log('Login successful:', response.data);
    },
    onFieldErrors: (errors) => {
      Object.entries(errors).forEach(([field, message]) => {
        setError(field, { type: 'manual', message });
      });
    },
  }
);

// 3. Authenticated request
const userProfile = await makeFastAPIRequestWithAuth<UserProfile>(
  '/users/profile',
  accessToken,
  { method: 'GET' }
);
*/
