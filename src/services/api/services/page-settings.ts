// src/services/api/services/page-settings.ts
//
// Backend: GET/PUT /v1/profile/page-settings
//
// NEDEN AYRI SERVIS: sayfa gorunumunun cogu (tema rengi, arka plan,
// profil fotografi) users tablosunda ve PUT /v1/profile/update ile
// yonetiliyor (bkz. onboarding.ts). Burasi yalnizca orada KARSILIGI
// OLMAYAN ayarlar icin. Ikisi bilincli olarak ayri: ayni gorunumu iki
// ayri uctan degistirilebilir yapmak, hangisinin kazandigini cagri
// sirasina birakirdi.
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/services/api/config";
import useFetch from "@/services/api/use-fetch";

export interface PageSettings {
  user_id: number;
  adult_warning_enabled: boolean;
  /** Semasi olmayan ek ayarlar; herkese acik profile dahil DEGIL. */
  extra_settings?: Record<string, unknown> | null;
}

export type PageSettingsUpdate = Partial<
  Pick<PageSettings, "adult_warning_enabled" | "extra_settings">
>;

interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
}

async function readError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const body = await response.json();

    if (typeof body?.message === "string") return body.message;

    if (Array.isArray(body?.detail)) {
      const first = body.detail[0];
      if (typeof first?.msg === "string") return first.msg;
    }

    if (typeof body?.detail === "string") return body.detail;
  } catch {
    // govde okunamadi; asagidaki varsayilan mesaj kullanilir
  }

  return fallback;
}

export const PAGE_SETTINGS_QUERY_KEY = ["page-settings"];

function usePageSettingsAPI() {
  const fetch = useFetch();

  return {
    get: async (): Promise<PageSettings> => {
      const response = await fetch(`${API_URL}/v1/profile/page-settings`);

      if (!response.ok) {
        throw new Error(await readError(response, "Failed to load settings"));
      }

      const result: ApiResponse<PageSettings> = await response.json();
      return result.data;
    },

    update: async (data: PageSettingsUpdate): Promise<PageSettings> => {
      const response = await fetch(`${API_URL}/v1/profile/page-settings`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Failed to save settings"));
      }

      const result: ApiResponse<PageSettings> = await response.json();
      return result.data;
    },
  };
}

export const usePageSettings = () => {
  const api = usePageSettingsAPI();

  return useQuery({
    queryKey: PAGE_SETTINGS_QUERY_KEY,
    queryFn: api.get,
  });
};

export const useUpdatePageSettings = () => {
  const api = usePageSettingsAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.update,
    onSuccess: (guncel) => {
      // Yaniti dogrudan yaziyoruz: PUT zaten guncel satiri donuyor,
      // yeniden istek atmaya gerek yok.
      queryClient.setQueryData(PAGE_SETTINGS_QUERY_KEY, guncel);
    },
  });
};
