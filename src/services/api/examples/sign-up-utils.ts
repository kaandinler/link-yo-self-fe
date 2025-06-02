// Sign-up işlemi için gelişmiş utility fonksiyonları
// Bu dosya sign-up page'inde kullanılmak üzere oluşturulmuştur

import { BaseResponseModel, API_STATUS } from "../types/base-response";
import {
  isSuccessResponse,
  isErrorResponse,
  getResponseData,
  getResponseErrorMessage,
  getResponseFieldErrors,
} from "../fastapi-utils";

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  policy: boolean;
}

export interface SignUpParseResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Sign-up response'unu parse eder ve form için uygun format döndürür
 */
export function parseSignUpResponse(response: unknown): SignUpParseResult {
  // Tip güvenliği için response'u kontrol et
  const typedResponse = response as BaseResponseModel<unknown>;

  if (
    typedResponse &&
    typeof typedResponse === "object" &&
    "status" in typedResponse
  ) {
    if (isSuccessResponse(typedResponse)) {
      return {
        success: true,
        message:
          typedResponse.message ||
          "Account created successfully! Please check your email for verification.",
      };
    }

    if (isErrorResponse(typedResponse)) {
      const fieldErrors = getResponseFieldErrors(typedResponse);
      const errorMessage = getResponseErrorMessage(typedResponse);

      return {
        success: false,
        fieldErrors,
        message: errorMessage || "Registration failed. Please try again.",
      };
    }
  }

  // Bilinmeyen response type
  return {
    success: false,
    message: "Unknown response format",
  };
}

/**
 * Field errors'ları form field errors'a dönüştürür
 */
export function convertFieldErrorsToFormErrors(
  response: BaseResponseModel<unknown>
): Record<string, { type: string; message: string }> {
  const fieldErrors = getResponseFieldErrors(response);
  const formErrors: Record<string, { type: string; message: string }> = {};
  // Convert to React Hook Form format
  Object.entries(fieldErrors).forEach(([field, message]) => {
    formErrors[field] = {
      type: "manual",
      message: String(message),
    };
  });
  return formErrors;
}

/**
 * Backend field names'lerini form field names'lere dönüştürür
 */
export function mapBackendFieldsToFormFields(
  fieldErrors: Record<string, string>
): Record<string, string> {
  const mappedErrors: Record<string, string> = {};

  Object.entries(fieldErrors).forEach(([key, value]) => {
    // Backend to form field mapping
    const formField =
      key === "first_name"
        ? "firstName"
        : key === "last_name"
          ? "lastName"
          : key;

    mappedErrors[formField] = value;
  });

  return mappedErrors;
}

/**
 * Sign-up işlemi için user-friendly error messages
 */
export function getSignUpErrorMessage(
  response: BaseResponseModel<unknown>
): string {
  if (!isErrorResponse(response)) {
    return "";
  }

  const backendMessage = getResponseErrorMessage(response);

  // Eğer backend'den anlamlı bir message geliyorsa onu kullan
  if (backendMessage && backendMessage.trim() !== "") {
    return backendMessage;
  }

  // Fallback: Common sign-up error message translations
  const errorTranslations: Record<string, string> = {
    "Email already registered": "This email address is already registered",
    "Username already taken": "This username is already taken",
    "Invalid email format": "Invalid email format",
    "Password too weak": "Password is too weak",
    "Username contains invalid characters":
      "Username contains invalid characters",
    "Email domain not allowed": "Email domain not allowed for registration",
    "Registration temporarily disabled": "Registration is temporarily disabled",
  };

  return (
    errorTranslations[backendMessage] ||
    backendMessage ||
    "Registration failed. Please try again."
  );
}

/**
 * Sign-up için comprehensive logging
 */
export function logSignUpAttempt(email: string, response: unknown): void {
  const timestamp = new Date().toISOString();
  const typedResponse = response as BaseResponseModel<unknown>;

  if (
    typedResponse &&
    typeof typedResponse === "object" &&
    "status" in typedResponse
  ) {
    if (isSuccessResponse(typedResponse)) {
      console.log(`✅ [${timestamp}] Sign-up successful for: ${email}`);
    } else if (isErrorResponse(typedResponse)) {
      const errorMessage = getResponseErrorMessage(typedResponse);
      const fieldErrors = getResponseFieldErrors(typedResponse);
      console.error(`❌ [${timestamp}] Sign-up failed for: ${email}`, {
        message: errorMessage,
        fieldErrors: Object.keys(fieldErrors),
        hasFieldErrors: Object.keys(fieldErrors).length > 0,
      });
    } else {
      console.warn(
        `⚠️ [${timestamp}] Unknown sign-up response for: ${email}`,
        response
      );
    }
  } else {
    console.warn(
      `⚠️ [${timestamp}] Invalid sign-up response format for: ${email}`,
      response
    );
  }
}
