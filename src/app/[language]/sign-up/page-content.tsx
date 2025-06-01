"use client";
import React, { useState } from 'react';
import { Eye, EyeOff, Link, User, Mail, Lock, Check, AlertCircle } from "lucide-react";
import { useAuthSignUpWithFastAPIService } from "@/services/api/services/auth";
import { API_STATUS } from "@/services/api/types/base-response";
import { 
  parseSignUpResponse, 
  mapBackendFieldsToFormFields,
  logSignUpAttempt,
  getSignUpErrorMessage
} from "@/services/api/examples/sign-up-utils";

// Types
type SignUpFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  policy: boolean;
};

// Validation function
const validateForm = (data: SignUpFormData) => {
  const errors: Partial<Record<keyof SignUpFormData, string>> = {};
  
  if (!data.firstName || data.firstName.length < 2) {
    errors.firstName = "First name must be at least 2 characters";
  }
  
  if (!data.lastName || data.lastName.length < 2) {
    errors.lastName = "Last name must be at least 2 characters";
  }
  
  if (!data.username || data.username.length < 3) {
    errors.username = "Username must be at least 3 characters";
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = "Username can only contain letters, numbers and underscores";
  }
  
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  
  if (!data.password || data.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (!/(?=.*[a-z])/.test(data.password)) {
    errors.password = "Password must contain at least one lowercase letter";
  } else if (!/(?=.*[A-Z])/.test(data.password)) {
    errors.password = "Password must contain at least one uppercase letter";
  } else if (!/(?=.*\d)/.test(data.password)) {
    errors.password = "Password must contain at least one number";
  }
  
  if (!data.policy) {
    errors.policy = "You must accept the terms and conditions";
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
  showPassword = false
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
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
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
            ${error 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-600 hover:border-gray-500'
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
function LinkYoSelfSignUpForm() {
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    username: "",
    policy: false,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const fetchAuthSignUpFastAPI = useAuthSignUpWithFastAPIService();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof SignUpFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));    }
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
    setSubmitSuccess("");
    
    try {
      // Prepare API payload
      const apiPayload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName
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
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          username: "",
          policy: false,
        });
      } else {
        // Hata durumunu işle
        if (signUpResult.fieldErrors) {
          // Backend field names'lerini form field names'lere dönüştür
          const mappedErrors = mapBackendFieldsToFormFields(signUpResult.fieldErrors);
          
          // Form field errors'ları setErrors ile ayarla
          const formFieldErrors: Partial<Record<keyof SignUpFormData, string>> = {};
          
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
          setSubmitError(signUpResult.message || "Registration failed. Please try again.");
        }
      }
      
    } catch (error) {
      // Network veya diğer hatalar
      setSubmitError("Network error occurred. Please check your connection and try again.");
      console.error("❌ Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileUrl = formData.username ? `linkyoself.com/${formData.username}` : "linkyoself.com/username";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Link className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Join LinkYoSelf
          </h2>
          <p className="text-gray-300">
            Build your personal brand, share your links
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="space-y-6">
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
                label="Username"
                icon={Link}
                value={formData.username}
                onChange={handleInputChange}
                error={errors.username}
                placeholder="username"
              />
              <p className="mt-1 text-sm text-gray-400">
                Your profile: <span className="font-medium text-purple-400">{profileUrl}</span>
              </p>
            </div>

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
              placeholder="At least 8 characters"
              showPasswordToggle={true}
              onTogglePassword={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
            />

            {/* Password Requirements */}
            <div className="text-xs text-gray-400 space-y-1">
              <p>Your password must include:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex items-center gap-1 ${/(?=.*[a-z])/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                  <Check className="h-3 w-3" />
                  <span>Lowercase</span>
                </div>
                <div className={`flex items-center gap-1 ${/(?=.*[A-Z])/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                  <Check className="h-3 w-3" />
                  <span>Uppercase</span>
                </div>
                <div className={`flex items-center gap-1 ${/(?=.*\d)/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                  <Check className="h-3 w-3" />
                  <span>Number</span>
                </div>
                <div className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-green-400' : 'text-gray-500'}`}>
                  <Check className="h-3 w-3" />
                  <span>8+ chars</span>
                </div>
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
                  <div className={`
                    w-5 h-5 border-2 rounded flex items-center justify-center
                    transition-colors duration-200
                    ${formData.policy 
                      ? 'bg-purple-600 border-purple-600' 
                      : 'border-gray-500 hover:border-gray-400'
                    }
                    ${errors.policy ? 'border-red-500' : ''}
                  `}>
                    {formData.policy && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-gray-300 leading-5">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-purple-400 hover:text-purple-300 font-medium underline">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="text-purple-400 hover:text-purple-300 font-medium underline">
                    Privacy Policy
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-white
                transition-all duration-200 transform
                ${isSubmitting 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                }
                focus:ring-4 focus:ring-purple-300 focus:outline-none
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <a 
                href="/sign-in" 
                className="text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200"
              >
                Already have an account? <span className="font-medium">Sign in</span>
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
            
            {submitSuccess && (
              <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <p className="text-sm text-green-300">{submitSuccess}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            Create your digital identity with LinkYoSelf ✨
          </p>
        </div>
      </div>
    </div>
  );
}

export default LinkYoSelfSignUpForm;