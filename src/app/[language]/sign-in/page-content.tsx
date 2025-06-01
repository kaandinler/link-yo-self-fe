"use client";
import Button from "@mui/material/Button";
import withPageRequiredGuest from "@/services/auth/with-page-required-guest";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import { useAuthLoginService, useAuthLoginWithFastAPIService } from "@/services/api/services/auth";
import { useCustomAuthLoginService } from "@/services/api/services/custom-auth";
import { useAuthMeWithFastAPIService } from "@/services/api/services/user-info";
import useAuthActions from "@/services/auth/use-auth-actions";
import useAuthTokens from "@/services/auth/use-auth-tokens";
import Typography from "@mui/material/Typography";
import FormTextInput from "@/components/form/text-input/form-text-input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "@/components/link";
import Box from "@mui/material/Box";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import SocialAuth from "@/services/social-auth/social-auth";
import Divider from "@mui/material/Divider";
import { isGoogleAuthEnabled } from "@/services/social-auth/google/google-config";
import { isFacebookAuthEnabled } from "@/services/social-auth/facebook/facebook-config";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { useSnackbar } from "@/hooks/use-snackbar";
import { BaseResponseModel, API_STATUS } from "@/services/api/types/base-response";
import { 
  isSuccessResponse, 
  isErrorResponse, 
  getResponseData, 
  getResponseErrorMessage, 
  getResponseFieldErrors 
} from "@/services/api/fastapi-utils";
import { 
  parseLoginResponse,
  parseUserInfoResponse,
  handleLoginSuccess,
  logLoginAttempt,
  getLoginErrorMessage
} from "@/services/api/examples/login-utils";
import { getBackendErrorMessage } from "@/services/api/types/fastapi-errors";

type SignInFormData = {
  email: string;
  password: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("sign-in");

  return yup.object().shape({
    email: yup
      .string()
      .email(t("sign-in:inputs.email.validation.invalid"))
      .required(t("sign-in:inputs.email.validation.required")),
    password: yup
      .string()
      .min(6, t("sign-in:inputs.password.validation.min"))
      .required(t("sign-in:inputs.password.validation.required")),
  });
};

function FormActions() {
  const { t } = useTranslation("sign-in");
  const { isSubmitting } = useFormState();

  return (
    <Button
      variant="contained"
      type="submit"
      disabled={isSubmitting}
      data-testid="sign-in-submit"
      sx={{
        backgroundColor: "#1383eb",
        color: "white",
        textTransform: "none",
        borderRadius: "8px",
        padding: "12px 24px",
        fontWeight: "600",
        fontSize: "16px",
        width: "100%",
        "&:hover": {
          backgroundColor: "#0e6ac7",
        },
        "&:disabled": {
          backgroundColor: "#3b4854",
          color: "#9dabb9",
        }
      }}
    >
      {t("sign-in:actions.submit")}
    </Button>
  );
}

function Form() {
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const fetchAuthLogin = useAuthLoginService(); // Legacy service
  const fetchAuthLoginFastAPI = useAuthLoginWithFastAPIService(); // New FastAPI service
  const fetchCustomAuthLogin = useCustomAuthLoginService();
  const fetchAuthMe = useAuthMeWithFastAPIService(); // User info service
  const { t } = useTranslation("sign-in");
  const validationSchema = useValidationSchema();
  const { showFetchResponse, showApiResponse, enqueueSnackbar } = useSnackbar();

  const methods = useForm<SignInFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      // Use the new FastAPI service that returns BaseResponseModel
      const response = await fetchAuthLoginFastAPI({
        username: formData.email, // FastAPI expects 'username' field
        password: formData.password,
      });

      // Log login attempt for debugging
      logLoginAttempt(formData.email, response);

      // Parse login response using utility functions
      const loginResult = parseLoginResponse(response);

      // Backend'den gelen message'ı önceleyerek snackbar'da göster
      const errorMessage = isErrorResponse(response) 
        ? getResponseErrorMessage(response) // Backend'den gelen message'ı direkt kullan
        : undefined;

      // Show API response using improved error messages
      showApiResponse(response, {
        onlyShowOnError: false,
        autoHideDuration: 5000,
        customMessage: loginResult.success 
          ? "Login successful! Welcome back." 
          : errorMessage, // Backend'den gelen message'ı kullan
      });

      // Handle successful login
      if (loginResult.success && loginResult.tokenData) {
        // Handle token saving
        handleLoginSuccess(loginResult.tokenData, {
          saveTokens: (tokens) => setTokensInfo(tokens),
          setUser: setUser,
        });
        
        // Fetch user data using the access token
        await handleUserInfoFetch(loginResult.tokenData.access_token, formData.email);
      } else if (loginResult.fieldErrors) {
        // Set field-specific errors using parsed results
        Object.entries(loginResult.fieldErrors).forEach(([fieldName, errorInfo]) => {
          setError(fieldName as keyof SignInFormData, errorInfo);
        });
      }
    } catch (error) {
      // Network error or unexpected error
      console.error("❌ Login network error:", error);
      enqueueSnackbar("Error occurred during login. Please try again.", {
        variant: "error",
        autoHideDuration: 5000,
      });
    }
  });

  // Helper function to handle user info fetching with improved error handling
  const handleUserInfoFetch = async (accessToken: string, email: string) => {
    try {
      const userResponse = await fetchAuthMe(accessToken);
      const userResult = parseUserInfoResponse(userResponse, email);
      
      if (userResult.success && userResult.userData) {
        setUser(userResult.userData);
        console.log("✅ User info fetched successfully");
      } else {
        // Use fallback user and log warning
        console.warn("⚠️ Using fallback user:", userResult.message);
        if (userResult.fallbackUser) {
          setUser(userResult.fallbackUser);
        }
      }
    } catch (userError) {
      // Fallback: create minimal user object if user info fetch fails
      console.error("❌ Error fetching user info:", userError);
      setUser({
        id: "temp-id",
        email: email,
        firstName: "",
        lastName: "",
      });
    }
  };

  return (
    <div
      className="relative flex w-full min-h-screen flex-col bg-[#111518] overflow-x-hidden"
      style={{ fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif' }}
    >
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center items-center py-10 px-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                  <path
                    d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                    fill="white"
                  />
                </svg>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "-0.015em",
                    color: "white",
                    fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif',
                  }}
                >
                  LinkYoSelf
                </Typography>
              </div>
            </div>

            {/* Sign In Card */}
            <div className="rounded-xl border border-[#3b4854] bg-[#1c2127] p-8">
              <div className="text-center mb-6">
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "white",
                    mb: 1,
                    fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif',
                  }}
                >
                  {t("sign-in:title")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#9dabb9",
                    fontFamily: '"Plus Jakarta Sans", "Noto Sans", sans-serif',
                  }}
                >
                  Welcome back! Please sign in to your account.
                </Typography>
              </div>

              <FormProvider {...methods}>
                <form onSubmit={onSubmit} className="space-y-6">
                  <div>
                    <FormTextInput<SignInFormData>
                      name="email"
                      label={t("sign-in:inputs.email.label")}
                      type="email"
                      testId="email"
                      autoFocus
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#283139",
                          border: "1px solid #3b4854",
                          borderRadius: "8px",
                          "& fieldset": {
                            border: "none",
                          },
                          "&:hover": {
                            border: "1px solid #60a5fa",
                          },
                          "&.Mui-focused": {
                            border: "1px solid #1383eb",
                          },
                          "& input": {
                            color: "white",
                            padding: "14px 16px",
                          }
                        },
                        "& .MuiInputLabel-root": {
                          color: "#9dabb9",
                          position: "static",
                          transform: "none",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "500",
                          "&.Mui-focused": {
                            color: "#1383eb",
                          }
                        }
                      }}
                    />
                  </div>

                  <div>
                    <FormTextInput<SignInFormData>
                      name="password"
                      label={t("sign-in:inputs.password.label")}
                      type="password"
                      testId="password"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#283139",
                          border: "1px solid #3b4854",
                          borderRadius: "8px",
                          "& fieldset": {
                            border: "none",
                          },
                          "&:hover": {
                            border: "1px solid #60a5fa",
                          },
                          "&.Mui-focused": {
                            border: "1px solid #1383eb",
                          },
                          "& input": {
                            color: "white",
                            padding: "14px 16px",
                          }
                        },
                        "& .MuiInputLabel-root": {
                          color: "#9dabb9",
                          position: "static",
                          transform: "none",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "500",
                          "&.Mui-focused": {
                            color: "#1383eb",
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      data-testid="forgot-password"
                      className="text-[#1383eb] hover:text-blue-400 transition-colors text-sm font-medium"
                    >
                      {t("sign-in:actions.forgotPassword")}
                    </Link>
                  </div>

                  <FormActions />

                  {IS_SIGN_UP_ENABLED && (
                    <div className="text-center">
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#9dabb9",
                          mb: 2,
                        }}
                      >
                        Don't have an account?{" "}
                        <Link
                          href="/sign-up"
                          data-testid="create-account"
                          className="text-[#1383eb] hover:text-blue-400 transition-colors font-medium"
                        >
                          {t("sign-in:actions.createAccount")}
                        </Link>
                      </Typography>
                    </div>
                  )}

                  {[isGoogleAuthEnabled, isFacebookAuthEnabled].some(Boolean) && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[#3b4854]" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-[#1c2127] text-[#9dabb9]">
                            {t("sign-in:or")}
                          </span>
                        </div>
                      </div>

                      <SocialAuth />
                    </>
                  )}
                </form>
              </FormProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignIn() {
  return <Form />;
}

export default withPageRequiredGuest(SignIn);
