"use client";
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import withPageRequiredGuest from "@/services/auth/with-page-required-guest";
import { useAuthLoginWithFastAPIService } from "@/services/api/services/auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import useAuthTokens from "@/services/auth/use-auth-tokens";
import { useTranslation } from "@/services/i18n/client";
import { isGoogleAuthEnabled } from "@/services/social-auth/google/google-config";
import { isFacebookAuthEnabled } from "@/services/social-auth/facebook/facebook-config";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { useSnackbar } from "@/hooks/use-snackbar";
import {
  isSuccessResponse,
  isErrorResponse,
  getResponseErrorMessage,
} from "@/services/api/fastapi-utils";
import {
  parseLoginResponse,
  parseUserInfoResponse,
  handleLoginSuccess,
  logLoginAttempt,
} from "@/services/api/examples/login-utils";

// Types
type SignInFormData = {
  email: string;
  password: string;
};

// Validation function
const validateForm = (data: SignInFormData) => {
  const errors: Partial<Record<keyof SignInFormData, string>> = {};

  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.password || data.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
};

// Input Component
const FormInput = ({
  name,
  label,
  type = "text",
  icon: Icon,
  value,
  onChange,
  error,
  placeholder,
  showPasswordToggle = false,
  onTogglePassword,
  showPassword = false,
}: {
  name: string;
  label: string;
  type?: string;
  icon?: any;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  showPassword?: boolean;
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {Icon && <Icon className="h-5 w-5 text-gray-500" />}
        </div>
        <input
          type={showPasswordToggle && showPassword ? "text" : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 py-3 border rounded-lg text-sm
            bg-gray-800 text-white placeholder-gray-400
            focus:ring-2 focus:ring-purple-500 focus:border-purple-500
            transition-colors duration-200
            ${
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-600 hover:border-gray-500"
            }
          `}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-300" />
            ) : (
              <Eye className="h-5 w-5 text-gray-500 hover:text-gray-300" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
};

// Main Component
function LinkYoSelfSignInForm() {
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const fetchAuthLoginFastAPI = useAuthLoginWithFastAPIService();
  const { t } = useTranslation("sign-in");
  const { showApiResponse, enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SignInFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof SignInFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (data: SignInFormData) => {
    const errors: Partial<Record<keyof SignInFormData, string>> = {};

    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!data.password || data.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      console.log("✅ Login attempt for:", formData.email);

      // Use the FastAPI service
      const response = await fetchAuthLoginFastAPI({
        username: formData.email, // FastAPI expects 'username' field
        password: formData.password,
      });

      // Log login attempt for debugging
      logLoginAttempt(formData.email, response);

      // Parse login response using utility functions
      const loginResult = parseLoginResponse(response);

      // Get error message from backend
      const errorMessage = isErrorResponse(response)
        ? getResponseErrorMessage(response)
        : undefined;

      // Show API response
      showApiResponse(response, {
        onlyShowOnError: false,
        autoHideDuration: 5000,
        customMessage: loginResult.success ? "Welcome back!" : errorMessage,
      });

      // Handle successful login
      if (loginResult.success && loginResult.tokenData) {
        // Handle token saving
        handleLoginSuccess(loginResult.tokenData, {
          saveTokens: (tokens) => setTokensInfo(tokens),
          setUser: (user) => setUser(user as any), // Cast or adapt to match (user: User | null) => void
        });

        // Create a simple user object since we have the email
        setUser({
          id: "temp-id",
          email: formData.email,
          firstName: "",
          lastName: "",
        });

        console.log("✅ Login successful");
      } else if (loginResult.fieldErrors) {
        // Set field-specific errors
        const formFieldErrors: Partial<Record<keyof SignInFormData, string>> =
          {};

        Object.entries(loginResult.fieldErrors).forEach(([key, errorInfo]) => {
          if (key in formData) {
            formFieldErrors[key as keyof SignInFormData] = errorInfo.message;
          }
        });

        if (Object.keys(formFieldErrors).length > 0) {
          setErrors(formFieldErrors);
        } else {
          // No field-specific errors, display general error message
          setSubmitError(errorMessage || "Login failed. Please try again.");
        }
      } else {
        setSubmitError(errorMessage || "Login failed. Please try again.");
      }
    } catch (error) {
      // Network error or unexpected error
      setSubmitError(
        "Network error occurred. Please check your connection and try again."
      );
      console.error("❌ Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-300">Sign in to your LinkYoSelf account</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="space-y-6">
            {/* Email */}
            <FormInput
              name="email"
              label="Email"
              type="email"
              icon={Mail}
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="example@email.com"
            />

            {/* Password */}
            <FormInput
              name="password"
              label="Password"
              type="password"
              icon={Lock}
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder="Enter your password"
              showPasswordToggle={true}
              onTogglePassword={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
            />

            {/* Forgot Password */}
            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200 font-medium"
              >
                Forgot your password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-white
                transition-all duration-200 transform
                ${
                  isSubmitting
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                }
                focus:ring-4 focus:ring-purple-300 focus:outline-none
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Social Auth */}
            {[isGoogleAuthEnabled, isFacebookAuthEnabled].some(Boolean) && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">
                      or continue with
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Social login coming soon
                  </p>
                </div>
              </>
            )}

            {/* Sign Up Link */}
            {IS_SIGN_UP_ENABLED && (
              <div className="text-center">
                <a
                  href="/sign-up"
                  className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200"
                >
                  Don't have an account?{" "}
                  <span className="font-medium">Create one</span>
                </a>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-sm text-red-300">{submitError}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            Access your digital world with LinkYoSelf ✨
          </p>
        </div>
      </div>
    </div>
  );
}

function SignIn() {
  return <LinkYoSelfSignInForm />;
}

export default withPageRequiredGuest(SignIn);
