"use client";
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import withPageRequiredGuest from "@/services/auth/with-page-required-guest";
import { useAuthLoginWithFastAPIService } from "@/services/api/services/auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useTranslation } from "@/services/i18n/client";
import {
  isErrorResponse,
  getResponseErrorMessage,
} from "@/services/api/fastapi-utils";

// Types
type SignInFormData = {
  email: string;
  password: string;
};

// NOT: Burada ayni adla ikinci bir validateForm vardi ama hicbir yerden
// cagrilmiyordu; bilesen kendi kopyasini tanimliyor.

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
  // lucide-react ikon bileseni. `unknown` idi; JSX'te <Icon /> olarak
  // kullanildigi icin bileşen tipi olmali.
  icon?: React.ComponentType<{ className?: string }>;
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
      <label className="block text-sm font-medium text-ink-soft">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {Icon && <Icon className="h-5 w-5 text-ink-faint" />}
        </div>
        <input
          type={showPasswordToggle && showPassword ? "text" : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 py-3 border rounded-lg text-sm
            bg-surface-raised text-ink placeholder-ink-muted
            focus:ring-2 focus:ring-purple-500 focus:border-purple-500
            transition-colors duration-200
            ${
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-line-strong hover:border-line-stronger"
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
              <EyeOff className="h-5 w-5 text-ink-faint hover:text-ink-soft" />
            ) : (
              <Eye className="h-5 w-5 text-ink-faint hover:text-ink-soft" />
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
  const { t } = useTranslation("sign-in");
  const { setUser } = useAuthActions();
  const fetchAuthLoginFastAPI = useAuthLoginWithFastAPIService();
  const { showApiResponse } = useSnackbar();

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
      errors.email = t("validation.email");
    }

    if (!data.password || data.password.length < 6) {
      errors.password = t("validation.password");
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
      /**
       * Giris /api/auth/session'a gidiyor, FastAPI'ye degil.
       *
       * TOKEN BURAYA HIC GELMIYOR: o uc token'i alip HttpOnly cereze
       * yaziyor ve govdeden cikariyor. Eskiden yanittaki token burada
       * okunup bir cereze yaziliyordu -- yani sayfadaki herhangi bir
       * JavaScript onu gorebiliyordu. Ayrica kullanici bilgisi icin
       * ikinci bir /users/me cagrisi gerekiyordu; onu da artik uc
       * kendisi doldurup donuyor.
       */
      const response = await fetchAuthLoginFastAPI({
        username: formData.email, // FastAPI 'username' alanini bekliyor
        password: formData.password,
      });

      const basarili = response.status === "success";

      const errorMessage = isErrorResponse(response)
        ? getResponseErrorMessage(response)
        : undefined;

      showApiResponse(response, {
        onlyShowOnError: false,
        autoHideDuration: 5000,
        customMessage: basarili ? t("form.welcomeBack") : errorMessage,
      });

      if (basarili) {
        if (response.data) {
          setUser(response.data);
        } else {
          // Oturum kuruldu; kullanici bilgisi sayfa yenilendiginde
          // AuthProvider tarafindan cekilecek.
          console.warn("Giris basarili ama kullanici bilgisi gelmedi.");
        }
      } else if (response.errors) {
        // Set field-specific errors
        const formFieldErrors: Partial<Record<keyof SignInFormData, string>> =
          {};

        // errors: alan adi -> mesaj (bkz. types/fastapi-errors.ts).
        Object.entries(response.errors).forEach(([key, mesaj]) => {
          if (key in formData) {
            formFieldErrors[key as keyof SignInFormData] = mesaj;
          }
        });

        if (Object.keys(formFieldErrors).length > 0) {
          setErrors(formFieldErrors);
        } else {
          // No field-specific errors, display general error message
          setSubmitError(errorMessage || t("validation.loginFailed"));
        }
      } else {
        setSubmitError(errorMessage || t("validation.loginFailed"));
      }
    } catch (error) {
      // Network error or unexpected error
      setSubmitError(t("validation.network"));
      console.error("❌ Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <LogIn className="h-8 w-8 text-ink" />
          </div>
          {/*
            h2 degil h1: bu zaten sayfanin basligi. App-bar'daki logo
            h1 olmaktan cikinca bu sayfa bassiz kalirdi.
          */}
          <h1 className="text-3xl font-bold text-ink mb-2">
            {t("form.heading")}
          </h1>
          <p className="text-ink-soft">{t("form.subheading")}</p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-raised rounded-2xl shadow-2xl p-8 border border-line">
          <div className="space-y-6">
            {/* Email */}
            <FormInput
              name="email"
              label={t("inputs.email.label")}
              type="email"
              icon={Mail}
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder={t("form.emailPlaceholder")}
            />

            {/* Password */}
            <FormInput
              name="password"
              label={t("inputs.password.label")}
              type="password"
              icon={Lock}
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder={t("form.passwordPlaceholder")}
              showPasswordToggle={true}
              onTogglePassword={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
            />

            {/* Forgot Password */}
            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="inline-flex items-center min-h-[44px] text-sm text-accent hover:text-accent transition-colors duration-200 font-medium"
              >
                {t("form.forgotPassword")}
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              data-testid="sign-in-submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold
                transition-all duration-200 transform
                ${
                  isSubmitting
                    ? "bg-field-strong text-ink-muted cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                }
                focus:ring-4 focus:ring-purple-300 focus:outline-none
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {t("form.signingIn")}
                </div>
              ) : (
                t("actions.submit")
              )}
            </button>

            {/* Sign Up Link */}
            {IS_SIGN_UP_ENABLED && (
              <div className="text-center">
                <a
                  href="/sign-up"
                  className="text-sm text-ink-muted hover:text-accent transition-colors duration-200"
                >
                  {t("form.noAccount")}{" "}
                  <span className="font-medium">{t("form.createOne")}</span>
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
          <p className="text-sm text-ink-muted">{t("form.footer")}</p>
        </div>
      </div>
    </div>
  );
}

function SignIn() {
  return <LinkYoSelfSignInForm />;
}

export default withPageRequiredGuest(SignIn);
