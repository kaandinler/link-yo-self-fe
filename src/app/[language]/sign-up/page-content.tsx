"use client";
import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Link,
  Mail,
  Lock,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAuthSignUpWithFastAPIService } from "@/services/api/services/auth";
import {
  parseSignUpResponse,
  mapBackendFieldsToFormFields,
  logSignUpAttempt,
} from "@/services/api/examples/sign-up-utils";
import {
  Ceviri,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  getPasswordError,
  passwordRuleLabels,
} from "@/services/api/password-rules";
import NextLink from "next/link";
import useLanguage from "@/services/i18n/use-language";
import { useTranslation } from "@/services/i18n/client";

// Types
type SignUpFormData = {
  email: string;
  password: string;
  username: string;
  policy: boolean;
};

// Validation function
const validateForm = (data: SignUpFormData, t: Ceviri) => {
  const errors: Partial<Record<keyof SignUpFormData, string>> = {};
  // Kullanici adi deseni backend ile ayni olmali; onceki hali nokta ve
  // tireyi reddediyordu, oysa backend bunlara izin veriyor.
  if (!data.username || data.username.length < USERNAME_MIN_LENGTH) {
    errors.username = t("validation.usernameMin", { min: USERNAME_MIN_LENGTH });
  } else if (data.username.length > USERNAME_MAX_LENGTH) {
    errors.username = t("validation.usernameMax", { max: USERNAME_MAX_LENGTH });
  } else if (!USERNAME_PATTERN.test(data.username)) {
    errors.username = t("validation.usernamePattern");
  }

  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = t("validation.email");
  }

  const passwordError = getPasswordError(data.password ?? "", t);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!data.policy) {
    errors.policy = t("validation.policy");
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
  icon?: React.ElementType;
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
function LinkYoSelfSignUpForm() {
  const { t } = useTranslation("sign-up");
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    username: "",
    policy: false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SignUpFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchAuthSignUpFastAPI = useAuthSignUpWithFastAPIService();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof SignUpFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      // Prepare API payload
      const apiPayload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      console.log("✅ API Payload:", apiPayload);

      // FastAPI servisini kullanarak kayıt isteği gönder
      const response = await fetchAuthSignUpFastAPI(apiPayload);

      // Enhanced logging with utility function
      logSignUpAttempt(formData.email, response);

      // Parse response with utility function
      const signUpResult = parseSignUpResponse(response);

      if (signUpResult.success) {
        // Başarılı kayıt işlemi
        setSubmitSuccess(signUpResult.message);

        // Formu sıfırla
        setFormData({
          email: "",
          password: "",
          username: "",
          policy: false,
        });
      } else {
        // Hata durumunu işle
        if (signUpResult.fieldErrors) {
          // Backend field names'lerini form field names'lere dönüştür
          const mappedErrors = mapBackendFieldsToFormFields(
            signUpResult.fieldErrors
          );

          // Form field errors'ları setErrors ile ayarla
          const formFieldErrors: Partial<Record<keyof SignUpFormData, string>> =
            {};

          Object.entries(mappedErrors).forEach(([key, value]) => {
            if (key in formData) {
              formFieldErrors[key as keyof SignUpFormData] = value;
            }
          });

          if (Object.keys(formFieldErrors).length > 0) {
            setErrors(formFieldErrors);
          } else {
            // No field-specific errors, display general error message
            setSubmitError(signUpResult.message);
          }
        } else {
          setSubmitError(signUpResult.message || t("validation.failed"));
        }
      }
    } catch (error) {
      // Network veya diğer hatalar
      setSubmitError(t("validation.network"));
      console.error("❌ Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const language = useLanguage();

  const profileUrl = formData.username
    ? `linkyoself.com/${formData.username}`
    : "linkyoself.com/username";

  return (
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Link className="h-8 w-8 text-ink" />
          </div>
          <h2 className="text-3xl font-bold text-ink mb-2">
            {t("form.heading")}
          </h2>
          <p className="text-ink-soft">{t("form.subheading")}</p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-raised rounded-2xl shadow-2xl p-8 border border-line">
          <div className="space-y-6">
            {submitSuccess ? (
              /* Kayit basarili: form yerine ne oldugunu ve sonraki adimi
                 gosteriyoruz. Onceki hali formu oldugu gibi birakip sadece
                 bir mesaj ekliyordu; kullanici aynı formun basinda kaliyor,
                 nereye gidecegini bilmiyordu. */
              <div className="space-y-4">
                <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-300">{submitSuccess}</p>
                      {/* Kayit dogrulama maili gonderiyor; sifre sifirlama
                          baglantisi bu adrese gidecegi icin soylenmeli. */}
                      <p className="text-sm text-green-300/80 mt-1">
                        {t("form.confirmationSent")}
                      </p>
                    </div>
                  </div>
                </div>

                <NextLink
                  href={`/${language}/sign-in`}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  {t("form.goSignIn")}
                </NextLink>
              </div>
            ) : (
              <>
                {/* Name Fields */}
                {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  name="firstName"
                  label="First Name"
                  icon={User}
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={errors.firstName}
                  placeholder="Your first name"
                />
                <FormInput
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={errors.lastName}
                  placeholder="Your last name"
                />
              </div> */}

                {/* Username */}
                <div>
                  <FormInput
                    name="username"
                    label={t("form.username")}
                    icon={Link}
                    value={formData.username}
                    onChange={handleInputChange}
                    error={errors.username}
                    placeholder={t("form.usernamePlaceholder")}
                  />
                  <p className="mt-1 text-sm text-ink-muted">
                    {t("form.profilePreview")}{" "}
                    <span className="font-medium text-accent">
                      {profileUrl}
                    </span>
                  </p>
                </div>

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
                  placeholder={t("form.passwordPlaceholder", {
                    min: PASSWORD_MIN_LENGTH,
                  })}
                  showPasswordToggle={true}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  showPassword={showPassword}
                />

                {/* Password Requirements */}
                <div className="text-xs text-ink-muted space-y-1">
                  <p>{t("form.passwordRequirements")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {passwordRuleLabels(t).map((rule) => (
                      <div
                        key={rule.key}
                        className={`flex items-center gap-1 ${
                          rule.test(formData.password)
                            ? "text-green-400"
                            : "text-ink-faint"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Policy Checkbox */}
                <div className="space-y-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        name="policy"
                        checked={formData.policy}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div
                        className={`
                      w-5 h-5 border-2 rounded flex items-center justify-center
                      transition-colors duration-200
                      ${
                        formData.policy
                          ? "bg-purple-600 border-purple-600"
                          : "border-line-stronger hover:border-line-stronger"
                      }
                      ${errors.policy ? "border-red-500" : ""}
                    `}
                      >
                        {formData.policy && (
                          <Check className="h-3 w-3 text-ink" />
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-ink-soft leading-5">
                      {t("form.policyAgree")}{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        className="text-accent hover:text-accent font-medium underline"
                      >
                        {t("form.termsOfService")}
                      </a>{" "}
                      {t("form.and")}{" "}
                      <a
                        href="/privacy"
                        target="_blank"
                        className="text-accent hover:text-accent font-medium underline"
                      >
                        {t("form.privacyPolicy")}
                      </a>
                    </span>
                  </label>
                  {errors.policy && (
                    <p className="text-sm text-red-400 flex items-center gap-1 ml-8">
                      <AlertCircle className="h-4 w-4" />
                      {errors.policy}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  data-testid="sign-up-submit"
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
                      {t("form.creating")}
                    </div>
                  ) : (
                    t("actions.submit")
                  )}
                </button>

                {/* Sign In Link */}
                <div className="text-center">
                  <a
                    href="/sign-in"
                    className="text-sm text-ink-muted hover:text-accent transition-colors duration-200"
                  >
                    {t("form.haveAccount")}{" "}
                    <span className="font-medium">{t("form.signIn")}</span>
                  </a>
                </div>

                {/* Error/Success Messages */}
                {submitError && (
                  <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <p className="text-sm text-red-300">{submitError}</p>
                    </div>
                  </div>
                )}
              </>
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

export default LinkYoSelfSignUpForm;
