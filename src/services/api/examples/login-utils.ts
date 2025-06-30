// Login işlemi için gelişmiş utility fonksiyonları
// Bu dosya sign-in page'inde kullanılmak üzere oluşturulmuştur

import {
  BaseResponseModel,
  API_STATUS,
  TokenResponse,
} from '../types/base-response';
import { User } from '../types/user';
import {
  isSuccessResponse,
  isErrorResponse,
  getResponseData,
  getResponseErrorMessage,
  getResponseFieldErrors,
} from '../fastapi-utils';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginParseResult {
  success: boolean;
  message: string;
  tokenData?: TokenResponse;
  fieldErrors?: Record<string, { type: string; message: string }>;
}

export interface UserInfoParseResult {
  success: boolean;
  message: string;
  userData?: User;
  fallbackUser?: User;
}

export interface TokensInfo {
  token: string | null;
  refreshToken: string | null;
  tokenExpires: number | null;
}

/**
 * Login response'unu parse eder ve form için uygun format döndürür
 */
export function parseLoginResponse(
  response: BaseResponseModel<TokenResponse>
): LoginParseResult {
  if (isSuccessResponse(response)) {
    const tokenData = getResponseData(response);

    if (tokenData && tokenData.access_token) {
      return {
        success: true,
        message: response.message || 'Login successful',
        tokenData,
      };
    } else {
      return {
        success: false,
        message: 'Invalid token data received',
      };
    }
  }

  if (isErrorResponse(response)) {
    const fieldErrors = getResponseFieldErrors(response);
    const errorMessage = getResponseErrorMessage(response);

    // Convert field errors to React Hook Form format
    const formErrors: Record<string, { type: string; message: string }> = {};
    Object.entries(fieldErrors).forEach(([field, message]) => {
      // Map backend field names to frontend field names
      const formField = field === 'username' ? 'email' : field;
      formErrors[formField] = {
        type: 'manual',
        message: String(message),
      };
    });

    return {
      success: false,
      fieldErrors: formErrors,
      message: errorMessage || 'Login failed. Please check your credentials.',
    };
  }

  // Unknown response format
  return {
    success: false,
    message: 'Unknown response format',
  };
}

/**
 * User info response'unu parse eder
 */
export function parseUserInfoResponse(
  response: BaseResponseModel<User>,
  email: string
): UserInfoParseResult {
  if (isSuccessResponse(response)) {
    const userData = getResponseData(response);

    if (userData && userData.id) {
      return {
        success: true,
        message: 'User info fetched successfully',
        userData,
      };
    }
  }

  // Fallback user creation
  const fallbackUser: User = {
    id: 'temp-id',
    email: email,
    firstName: '',
    lastName: '',
  };

  return {
    success: false,
    message: 'Failed to fetch user info, using fallback',
    fallbackUser,
  };
}

/**
 * Login başarılı olduğunda token'ları kaydet ve kullanıcıyı ayarla
 */
export function handleLoginSuccess(
  tokenData: TokenResponse,
  callbacks: {
    saveTokens: (tokens: TokensInfo) => void;
    setUser: (user: User | null) => void;
  }
): void {
  // Calculate token expiration (default 30 minutes if not provided)
  const tokenExpires = Date.now() + 30 * 60 * 1000; // 30 minutes from now

  // Prepare tokens info
  const tokensInfo: TokensInfo = {
    token: tokenData.access_token,
    refreshToken: tokenData.refresh_token || null,
    tokenExpires: tokenExpires,
  };

  // Save tokens
  callbacks.saveTokens(tokensInfo);

  console.log('✅ Tokens saved successfully');
}

/**
 * Login için comprehensive logging
 */
export function logLoginAttempt(
  email: string,
  response: BaseResponseModel<TokenResponse>
): void {
  const timestamp = new Date().toISOString();

  if (isSuccessResponse(response)) {
    console.log(`✅ [${timestamp}] Login successful for: ${email}`);
  } else if (isErrorResponse(response)) {
    const errorMessage = getResponseErrorMessage(response);
    const fieldErrors = getResponseFieldErrors(response);

    console.error(`❌ [${timestamp}] Login failed for: ${email}`, {
      message: errorMessage,
      fieldErrors: Object.keys(fieldErrors),
      hasFieldErrors: Object.keys(fieldErrors).length > 0,
    });
  } else {
    console.warn(
      `⚠️ [${timestamp}] Unknown login response for: ${email}`,
      response
    );
  }
}

/**
 * Login işlemi için user-friendly error messages
 */
export function getLoginErrorMessage(
  response: BaseResponseModel<TokenResponse>
): string {
  if (!isErrorResponse(response)) {
    return '';
  }

  const backendMessage = getResponseErrorMessage(response);

  // Use backend message if available
  if (backendMessage && backendMessage.trim() !== '') {
    return backendMessage;
  }

  // Fallback: Common login error message translations
  const errorTranslations: Record<string, string> = {
    'Invalid credentials': 'Invalid email or password',
    'User not found': 'Account not found with this email',
    'Password incorrect': 'Incorrect password',
    'Account disabled': 'Your account has been disabled',
    'Account not verified': 'Please verify your email address',
    'Too many attempts': 'Too many login attempts. Please try again later.',
    'Session expired': 'Your session has expired. Please login again.',
  };

  return (
    errorTranslations[backendMessage] ||
    'Login failed. Please check your credentials and try again.'
  );
}

/**
 * Field errors'ları form field errors'a dönüştürür
 */
export function convertFieldErrorsToFormErrors(
  response: BaseResponseModel<TokenResponse>
): Record<string, { type: string; message: string }> {
  const fieldErrors = getResponseFieldErrors(response);
  const formErrors: Record<string, { type: string; message: string }> = {};

  // Convert to React Hook Form format
  Object.entries(fieldErrors).forEach(([field, message]) => {
    // Map backend field names to frontend field names
    const formField = field === 'username' ? 'email' : field;
    formErrors[formField] = {
      type: 'manual',
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
    // Backend to form field mapping for login
    const formField = key === 'username' ? 'email' : key;
    mappedErrors[formField] = value;
  });

  return mappedErrors;
}
