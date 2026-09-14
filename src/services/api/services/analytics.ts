// src/services/api/services/analytics.ts
//
// Backend: GET /v1/analytics/summary
//
// Pano, analytics sayfasi ve link yonetimi ekrani ayni ozeti okuyor.
// Onceki karsiligi links.ts icindeki useLinkAnalytics idi ve
// /v1/links/analytics/summary'ye gidiyordu; o uc kaldirildi (tipsiz dict
// donuyordu ve profil goruntulenmesi gibi link disi metrikleri tasiyamiyordu).
"use client";

import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/services/api/config";
import useFetch from "@/services/api/use-fetch";

export interface LinkClickStat {
  id: number;
  title: string;
  url: string;
  click_count: number;
  is_active: boolean;
}

export interface AnalyticsSummary {
  username: string;
  /** Public profil yolu, orn. "/kaan". Tam URL istemcide olusturuluyor. */
  profile_url_path: string;

  total_links: number;
  active_links: number;
  total_clicks: number;
  profile_view_count: number;

  /** Tiklanmaya gore azalan sirada. */
  links: LinkClickStat[];
}

interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
}

export const ANALYTICS_QUERY_KEY = ["analytics", "summary"];

export const useAnalyticsSummary = () => {
  const fetch = useFetch();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEY,
    queryFn: async (): Promise<AnalyticsSummary> => {
      const response = await fetch(`${API_URL}/v1/analytics/summary`);

      if (!response.ok) {
        throw new Error("Failed to load analytics");
      }

      const result: ApiResponse<AnalyticsSummary> = await response.json();
      return result.data;
    },
  });
};
