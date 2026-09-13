// FastAPI error handling types and utilities

// Pydantic validation error structure
export interface ValidationErrorDetail {
  type: string;
  loc: (string | number)[];
  msg: string;
  input: unknown;
}

// FastAPI error response when validation fails
export interface FastAPIValidationError {
  detail: ValidationErrorDetail[];
}

// General FastAPI error response
export interface FastAPIError {
  detail: string | ValidationErrorDetail[];
  message?: string;
}

// API Error with possible message
export interface ApiErrorWithMessage {
  message: string;
  [key: string]: unknown;
}

// API Error with detail field
export interface ApiErrorWithDetail {
  detail: string | ValidationErrorDetail[];
  [key: string]: unknown;
}

// API Error with data containing message
export interface ApiErrorWithData {
  data: {
    message: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Union type for all possible API error formats
export type ApiErrorResponse =
  | ApiErrorWithMessage
  | ApiErrorWithDetail
  | ApiErrorWithData
  | Record<string, unknown>;

// Processed error for UI consumption
export interface ProcessedApiError {
  type: "validation" | "general" | "network";
  message: string;
  fieldErrors?: Record<string, string>; // Field name -> error message
  originalError?: unknown;
}

// Field name mapping for translation
const FIELD_NAME_MAP: Record<string, string> = {
  username: "Kullanıcı adı",
  password: "Şifre",
  email: "E-posta",
  firstName: "Ad",
  lastName: "Soyad",
  confirmPassword: "Şifre tekrarı",
};

// Error message translation
const ERROR_MESSAGE_MAP: Record<string, string> = {
  "Field required": "Bu alan zorunludur",
  "field required": "Bu alan zorunludur",
  "String too short": "Bu alan çok kısa",
  "String too long": "Bu alan çok uzun",
  "Input should be a valid email": "Geçerli bir e-posta adresi giriniz",
  "Value error, passwords do not match": "Şifreler eşleşmiyor",
  "Value error, password too weak": "Şifre çok zayıf",
};

/**
 * FastAPI error response'unu kullanıcı dostu formata çevirir
 */
export function parseAPIError(
  error: unknown,
  response?: Response
): ProcessedApiError {
  // API hatası tipi olarak kullanmak için dönüştürme
  const errorData = error as ApiErrorResponse;

  // Network hatası
  if (!response || error instanceof TypeError) {
    return {
      type: "network",
      message: "Something went wrong. Please try again later.",
      originalError: error,
    };
  }

  // Backend'den gelen message'ı öncelikle kontrol et
  if (
    errorData &&
    typeof errorData === "object" &&
    "message" in errorData &&
    typeof errorData.message === "string"
  ) {
    return {
      type: "general",
      message: errorData.message,
      originalError: error,
    };
  }
  // Response status kontrolü
  if (
    response.status === 422 &&
    errorData &&
    typeof errorData === "object" &&
    "detail" in errorData &&
    Array.isArray(errorData.detail)
  ) {
    // Validation errors
    const fieldErrors: Record<string, string> = {};
    const generalMessage =
      errorData &&
      typeof errorData === "object" &&
      "message" in errorData &&
      typeof errorData.message === "string"
        ? errorData.message
        : "Girdiğiniz bilgilerde hatalar var:";

    (errorData.detail as ValidationErrorDetail[]).forEach(
      (validationError: ValidationErrorDetail) => {
        const fieldPath = validationError.loc.slice(1); // Remove 'body' from path
        const fieldName = fieldPath[fieldPath.length - 1] as string;

        // Translate field name
        const translatedFieldName = FIELD_NAME_MAP[fieldName] || fieldName;

        // Translate error message
        const translatedMessage =
          ERROR_MESSAGE_MAP[validationError.msg] || validationError.msg;

        // Store field-specific error
        fieldErrors[fieldName] = translatedMessage;
      }
    );

    return {
      type: "validation",
      message: generalMessage,
      fieldErrors,
      originalError: error,
    };
  }
  // General API error - Backend'den gelen message'ı öncelikle kullan
  if (errorData && typeof errorData === "object" && "detail" in errorData) {
    // Önce message alanını kontrol et
    if ("message" in errorData && typeof errorData.message === "string") {
      return {
        type: "general",
        message: errorData.message,
        originalError: error,
      };
    }

    // Eğer message yoksa detail'i kullan
    const message =
      typeof errorData.detail === "string"
        ? errorData.detail
        : "Bir hata oluştu. Lütfen tekrar deneyin.";

    return {
      type: "general",
      message,
      originalError: error,
    };
  }

  // HTTP status based errors - Sadece backend'den message gelmediği durumlarda
  const statusErrors: Record<number, string> = {
    400: "Geçersiz istek. Lütfen bilgilerinizi kontrol edin.",
    401: "Giriş yapmanız gerekiyor.",
    403: "Bu işlem için yetkiniz bulunmuyor.",
    404: "İstenen kaynak bulunamadı.",
    409: "Bu bilgiler zaten kullanımda.",
    429: "Çok fazla istek gönderdiniz. Lütfen bekleyin.",
    500: "Sunucu hatası oluştu. Lütfen tekrar deneyin.",
    502: "Sunucu geçici olarak kullanılamıyor.",
    503: "Hizmet geçici olarak kullanılamıyor.",
  };

  const message =
    statusErrors[response.status] || `Bilinmeyen hata (${response.status})`;

  return {
    type: "general",
    message,
    originalError: error,
  };
}

/**
 * API response'unu güvenli şekilde parse eder
 */
export async function safeParseApiResponse(
  response: Response
): Promise<unknown> {
  try {
    const text = await response.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  } catch {
    return { detail: "Sunucudan geçersiz yanıt alındı" };
  }
}

/**
 * Backend'den gelen message'ı önceleyerek error message'ı döndürür
 * Snackbar'da gösterilmek üzere optimize edilmiştir
 */
export function getBackendErrorMessage(
  error: unknown,
  response?: Response
): string {
  // API hatası tipi olarak kullanmak için dönüştürme
  const errorData = error as Record<string, unknown>;

  // Önce message alanını kontrol et (en yüksek öncelik)
  if (
    errorData &&
    typeof errorData === "object" &&
    "message" in errorData &&
    typeof errorData.message === "string" &&
    errorData.message.trim() !== ""
  ) {
    return errorData.message;
  }

  // BaseResponseModel formatında message varsa
  if (
    errorData &&
    typeof errorData === "object" &&
    "data" in errorData &&
    errorData.data &&
    typeof errorData.data === "object" &&
    "message" in errorData.data &&
    typeof errorData.data.message === "string"
  ) {
    return errorData.data.message;
  }

  // Detail string ise kullan
  if (
    errorData &&
    typeof errorData === "object" &&
    "detail" in errorData &&
    typeof errorData.detail === "string"
  ) {
    return errorData.detail;
  }

  // HTTP status'e göre fallback
  if (response) {
    const statusMessages: Record<number, string> = {
      400: "Geçersiz istek",
      401: "Yetkisiz erişim",
      403: "Erişim engellendi",
      404: "Bulunamadı",
      409: "Çakışma hatası",
      422: "Doğrulama hatası",
      429: "Çok fazla istek",
      500: "Sunucu hatası",
      502: "Ağ geçidi hatası",
      503: "Hizmet kullanılamıyor",
    };

    return statusMessages[response.status] || `HTTP ${response.status} hatası`;
  }

  return "Bilinmeyen hata oluştu";
}
