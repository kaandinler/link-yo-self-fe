// src/services/api/services/onboarding.ts
//
// Backend'in /v1/profile/* ucları: onboarding adimlari, profil okuma ve
// toplu profil guncelleme.
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/services/api/config";
import useFetch from "@/services/api/use-fetch";
import { User } from "@/services/api/types/user";

/** Backend: GET /v1/profile/onboarding-status */
export interface OnboardingStatus {
  step: number;
  completed_steps: number[];
  profile_completion_percentage: number;
  next_step_title?: string | null;
  can_skip: boolean;
}

export interface Step1Data {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
}

export interface Step2Data {
  page_title?: string;
  page_description?: string;
  website?: string;
}

export interface Step3Data {
  twitter_username?: string;
  instagram_username?: string;
  linkedin_username?: string;
}

export interface Step4Data {
  theme_color?: string;
  background_type?: string;
  background_value?: string;
}

export type StepData = Step1Data | Step2Data | Step3Data | Step4Data;

/** PUT /v1/profile/update - tum alanlar opsiyonel, kismi guncelleme. */
export type ProfileUpdateData = Step1Data & Step2Data & Step3Data & Step4Data;

/** Sihirbazdaki toplam adim sayisi; backend'de complete-step-1..4 mevcut. */
export const TOTAL_STEPS = 4;

interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
}

/**
 * Hata mesajini backend'in ortak zarfindan cikarir.
 *
 * Dogrulama hatalarinda FastAPI 422 ile {detail: [...]} donuyor, uygulama
 * hatalarinda ise {status, message, data} zarfi geliyor. Ikisini de ayni
 * sekilde ele aliyoruz ki kullaniciya anlamli bir sey gosterebilelim.
 */
async function readError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const body = await response.json();

    if (typeof body?.message === "string") return body.message;

    if (Array.isArray(body?.detail)) {
      const first = body.detail[0];
      if (typeof first?.msg === "string") {
        const field = Array.isArray(first.loc) ? first.loc.at(-1) : undefined;
        return field ? `${field}: ${first.msg}` : first.msg;
      }
    }

    if (typeof body?.detail === "string") return body.detail;
  } catch {
    // govde okunamadi; asagidaki varsayilan mesaj kullanilir
  }

  return fallback;
}

function useOnboardingAPI() {
  const fetch = useFetch();

  return {
    getStatus: async (): Promise<OnboardingStatus> => {
      const response = await fetch(`${API_URL}/v1/profile/onboarding-status`);

      if (!response.ok) {
        throw new Error(
          await readError(response, "Failed to load onboarding status")
        );
      }

      const result: ApiResponse<OnboardingStatus> = await response.json();
      return result.data;
    },

    completeStep: async (step: number, data: StepData): Promise<User> => {
      const response = await fetch(
        `${API_URL}/v1/profile/complete-step-${step}`,
        { method: "POST", body: JSON.stringify(data) }
      );

      if (!response.ok) {
        throw new Error(await readError(response, "Failed to save this step"));
      }

      const result: ApiResponse<User> = await response.json();
      return result.data;
    },

    completeOnboarding: async (): Promise<User> => {
      const response = await fetch(
        `${API_URL}/v1/profile/complete-onboarding`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(
          await readError(response, "Failed to complete onboarding")
        );
      }

      const result: ApiResponse<User> = await response.json();
      return result.data;
    },

    skipOnboarding: async (): Promise<User> => {
      const response = await fetch(`${API_URL}/v1/profile/skip-onboarding`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Failed to skip onboarding"));
      }

      const result: ApiResponse<User> = await response.json();
      return result.data;
    },

    updateProfile: async (data: ProfileUpdateData): Promise<User> => {
      const response = await fetch(`${API_URL}/v1/profile/update`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Failed to update profile"));
      }

      const result: ApiResponse<User> = await response.json();
      return result.data;
    },

    getProfile: async (): Promise<User> => {
      const response = await fetch(`${API_URL}/v1/profile/me`);

      if (!response.ok) {
        throw new Error(await readError(response, "Failed to load profile"));
      }

      const result: ApiResponse<User> = await response.json();
      return result.data;
    },
  };
}

export const ONBOARDING_QUERY_KEY = ["onboarding-status"];
export const PROFILE_QUERY_KEY = ["profile", "me"];

export const useOnboardingStatus = () => {
  const api = useOnboardingAPI();

  return useQuery({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: api.getStatus,
  });
};

/** Sihirbazdaki alanlarin mevcut degerlerle dolu baslamasi icin. */
export const useProfile = () => {
  const api = useOnboardingAPI();

  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: api.getProfile,
  });
};

export const useCompleteStep = () => {
  const api = useOnboardingAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ step, data }: { step: number; data: StepData }) =>
      api.completeStep(step, data),
    onSuccess: () => {
      // Adim kaydedildikten sonra ilerleme yuzdesi ve tamamlanan adimlar
      // degisiyor; her ikisi de bu iki sorgudan okunuyor.
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
};

export const useCompleteOnboarding = () => {
  const api = useOnboardingAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
};

export const useSkipOnboarding = () => {
  const api = useOnboardingAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.skipOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
};

/**
 * Profili topluca gunceller (PUT /v1/profile/update).
 *
 * profile/edit sayfasi daha once PATCH /v1/users/me cagiriyordu; backend'de o
 * yolda yalnizca GET var, yani kaydetme hicbir zaman calismiyordu.
 */
export const useUpdateProfile = () => {
  const api = useOnboardingAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
};
