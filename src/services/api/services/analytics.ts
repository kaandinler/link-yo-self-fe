// src/services/api/services/analytics.ts
//
// Backend: GET /v1/analytics/summary, /timeseries, /timeseries/by-link ve
// /referrers
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

/** Bir gunun toplamlari. */
export interface AnalyticsDayPoint {
  /** ISO tarih, orn. "2026-09-15". */
  date: string;
  clicks: number;
  profile_views: number;
}

export interface AnalyticsTimeseries {
  days: number;
  start_date: string;
  end_date: string;
  /** DIKKAT: yalnizca secili araligi kapsiyor, ozetteki toplamlar hesabin tamamini. */
  total_clicks: number;
  total_profile_views: number;
  /** Olaysiz gunler de sifir degerlerle geliyor; bosluk doldurmak gerekmiyor. */
  points: AnalyticsDayPoint[];
}

/** Grafikte secilebilen araliklar. */
export const TIMESERIES_RANGES = [7, 30, 90] as const;
export type TimeseriesRange = (typeof TIMESERIES_RANGES)[number];

export const timeseriesQueryKey = (days: number) => [
  "analytics",
  "timeseries",
  days,
];

export const useAnalyticsTimeseries = (days: TimeseriesRange) => {
  const fetch = useFetch();

  return useQuery({
    queryKey: timeseriesQueryKey(days),
    queryFn: async (): Promise<AnalyticsTimeseries> => {
      const response = await fetch(
        `${API_URL}/v1/analytics/timeseries?days=${days}`
      );

      if (!response.ok) {
        throw new Error("Failed to load analytics timeseries");
      }

      const result: ApiResponse<AnalyticsTimeseries> = await response.json();
      return result.data;
    },
    // Aralik degisince eski seri bir an icin kaybolmasin: grafik onceki
    // render'ini tutup solgunlasiyor (bkz. ActivityChart).
    placeholderData: (previous) => previous,
  });
};

/** Bir linkin bir gunku tiklanma sayisi. */
export interface LinkDayPoint {
  date: string;
  clicks: number;
}

export interface LinkTimeseries {
  id: number;
  title: string;
  url: string;
  is_active: boolean;
  /** Yalnizca secili araligi kapsiyor; ozetteki click_count linkin tum gecmisini. */
  total_clicks: number;
  points: LinkDayPoint[];
}

export interface LinkTimeseriesResponse {
  days: number;
  start_date: string;
  end_date: string;
  /** Aralikta tiklanmayan linkler de sifir degerlerle geliyor. */
  links: LinkTimeseries[];
}

export const linkTimeseriesQueryKey = (days: number) => [
  "analytics",
  "timeseries",
  "by-link",
  days,
];

export const useLinkTimeseries = (days: TimeseriesRange) => {
  const fetch = useFetch();

  return useQuery({
    queryKey: linkTimeseriesQueryKey(days),
    queryFn: async (): Promise<LinkTimeseriesResponse> => {
      const response = await fetch(
        `${API_URL}/v1/analytics/timeseries/by-link?days=${days}`
      );

      if (!response.ok) {
        throw new Error("Failed to load link timeseries");
      }

      const result: ApiResponse<LinkTimeseriesResponse> = await response.json();
      return result.data;
    },
    placeholderData: (previous) => previous,
  });
};

/**
 * Bir trafik kaynagi.
 *
 * `kind` uc degerden biri:
 * - "host"   : gercek bir dis site; `host` dolu ("instagram.com")
 * - "direct" : dis bir referrer yok (adres cubuguna yazilmis, referrer'i
 *              gizleyen bir uygulamadan gelinmis ya da site ici gezinme)
 * - "other"  : listeye sigmayan kaynaklarin toplami
 */
export interface ReferrerSource {
  kind: "host" | "direct" | "other";
  host: string | null;
  clicks: number;
}

export interface ReferrerBreakdown {
  days: number;
  start_date: string;
  end_date: string;
  /** Yalnizca secili araligi kapsiyor. */
  total_clicks: number;
  /** Tiklamaya gore azalan; "other" varsa her zaman sonda. */
  sources: ReferrerSource[];
}

export const referrersQueryKey = (days: number) => [
  "analytics",
  "referrers",
  days,
];

export const useReferrers = (days: TimeseriesRange) => {
  const fetch = useFetch();

  return useQuery({
    queryKey: referrersQueryKey(days),
    queryFn: async (): Promise<ReferrerBreakdown> => {
      const response = await fetch(
        `${API_URL}/v1/analytics/referrers?days=${days}`
      );

      if (!response.ok) {
        throw new Error("Failed to load referrers");
      }

      const result: ApiResponse<ReferrerBreakdown> = await response.json();
      return result.data;
    },
    placeholderData: (previous) => previous,
  });
};
