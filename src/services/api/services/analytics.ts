// src/services/api/services/analytics.ts
//
// Backend: GET /v1/analytics/summary, /timeseries, /timeseries/by-link,
// /referrers ve /best-times
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

/** Hazir araliklar. */
export const TIMESERIES_RANGES = [7, 30, 90] as const;
export type TimeseriesRange = (typeof TIMESERIES_RANGES)[number];

/** Backend'in kabul ettigi en uzun aralik (MAX_DAYS). */
export const MAX_RANGE_DAYS = 90;

/**
 * Secili aralik.
 *
 * Hazir araliklar "son N gun" sorusunu soruyor; serbest aralik belirli
 * bir pencereye bakmak icin -- bir kampanyanin kendi gunlerine mesela.
 * Ikisi ayri bicimde sorulmali: "son 7 gun" her gun kayiyor, sabit bir
 * aralik kaymiyor.
 */
export type SelectedRange =
  | { kind: "days"; days: TimeseriesRange }
  | { kind: "custom"; start: string; end: string };

export const DEFAULT_RANGE: SelectedRange = { kind: "days", days: 7 };

/** Istege eklenecek sorgu dizgisi. */
export function rangeQuery(range: SelectedRange): string {
  return range.kind === "days"
    ? `days=${range.days}`
    : `start=${range.start}&end=${range.end}`;
}

/**
 * Query key parcasi.
 *
 * Sorgu dizgisinin kendisi kullaniliyor: ayri bir anahtar uretmek, iki
 * farkli araligin ayni anahtara dusmesi riskini tasirdi ve o durumda
 * ekranda baska bir araligin verisi gorunurdu.
 */
export const rangeKey = (range: SelectedRange) => rangeQuery(range);

/** "2026-09-17" farkiyla gun sayisi; iki ucu da dahil. */
export function rangeDayCount(range: SelectedRange): number {
  if (range.kind === "days") return range.days;
  const bas = Date.parse(`${range.start}T00:00:00Z`);
  const son = Date.parse(`${range.end}T00:00:00Z`);
  if (Number.isNaN(bas) || Number.isNaN(son)) return 0;
  return Math.floor((son - bas) / 86_400_000) + 1;
}

/**
 * Serbest araligin gecerli olup olmadigi; gecersizse sebebi.
 *
 * Istek gonderip 422 beklemek yerine burada kontrol ediliyor: kullanici
 * tarihi yazarken anlik geri bildirim aliyor ve yarim girilmis bir
 * aralik icin bosuna istek atilmiyor. Ayni kurallar backend'de de var
 * (aralik_kur) -- burasi kolaylik, orasi otorite.
 */
/**
 * Gecersiz araligin sebebi, CEVIRI ANAHTARI olarak.
 *
 * Metin degil anahtar donuyor: bu fonksiyon bir servis modulu, `t`'ye
 * erisimi yok ve olmamali. Cagiran taraf kendi `t`'siyle cozuyor.
 */
export type RangeErrorKey = {
  key: string;
  params?: Record<string, unknown>;
};

export function rangeError(start: string, end: string): RangeErrorKey | null {
  if (!start || !end) return { key: "range.errors.bothDates" };
  const gun = rangeDayCount({ kind: "custom", start, end });
  if (gun <= 0) return { key: "range.errors.order" };
  if (gun > MAX_RANGE_DAYS) {
    return { key: "range.errors.max", params: { days: MAX_RANGE_DAYS } };
  }
  return null;
}

export const timeseriesQueryKey = (range: SelectedRange) => [
  "analytics",
  "timeseries",
  rangeKey(range),
];

export const useAnalyticsTimeseries = (range: SelectedRange) => {
  const fetch = useFetch();

  return useQuery({
    queryKey: timeseriesQueryKey(range),
    queryFn: async (): Promise<AnalyticsTimeseries> => {
      const response = await fetch(
        `${API_URL}/v1/analytics/timeseries?${rangeQuery(range)}`
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

export const linkTimeseriesQueryKey = (range: SelectedRange) => [
  "analytics",
  "timeseries",
  "by-link",
  rangeKey(range),
];

export const useLinkTimeseries = (range: SelectedRange) => {
  const fetch = useFetch();

  return useQuery({
    queryKey: linkTimeseriesQueryKey(range),
    queryFn: async (): Promise<LinkTimeseriesResponse> => {
      const response = await fetch(
        `${API_URL}/v1/analytics/timeseries/by-link?${rangeQuery(range)}`
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

export const referrersQueryKey = (range: SelectedRange) => [
  "analytics",
  "referrers",
  rangeKey(range),
];

export const useReferrers = (range: SelectedRange) => {
  const fetch = useFetch();

  return useQuery({
    queryKey: referrersQueryKey(range),
    queryFn: async (): Promise<ReferrerBreakdown> => {
      const response = await fetch(
        `${API_URL}/v1/analytics/referrers?${rangeQuery(range)}`
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

/** Bir haftagununun toplam tiklamasi. 0 = Pazartesi. */
export interface WeekdayBucket {
  weekday: number;
  clicks: number;
}

/** Bir saatin toplam tiklamasi. 0-23, istekte verilen saat diliminde. */
export interface HourBucket {
  hour: number;
  clicks: number;
}

export interface BestTimes {
  days: number;
  start_date: string;
  end_date: string;
  /** Sunucunun gruplarken kullandigi IANA saat dilimi. */
  timezone: string;

  total_clicks: number;
  /** Her zaman 7 ve 24 eleman; bos kutular sifirla geliyor. */
  by_weekday: WeekdayBucket[];
  by_hour: HourBucket[];

  peak_weekday: number | null;
  peak_hour: number | null;
  /**
   * Zirveyi bir cikarim olarak sunmak icin yeterli tiklama var mi?
   *
   * false iken peak_* yalnizca en buyuk kutunun adi -- "en iyi gunun
   * sali" gibi bir iddiada bulunulmamali.
   */
  enough_data: boolean;
}

/**
 * Tarayicinin saat dilimi, orn. "Europe/Istanbul".
 *
 * NEDEN GEREKLI: Olaylar sunucuda UTC saklaniyor. "En cok tiklama saat
 * 14'te" bilgisi kullanicinin kendi saatine cevrilmeden bir sey
 * anlatmiyor. Cevrimi sunucu yapiyor, dilimi biz soyluyoruz.
 */
function tarayiciSaatDilimi(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export const bestTimesQueryKey = (range: SelectedRange, tz: string) => [
  "analytics",
  "best-times",
  rangeKey(range),
  tz,
];

export const useBestTimes = (range: SelectedRange) => {
  const fetch = useFetch();
  const tz = tarayiciSaatDilimi();

  return useQuery({
    queryKey: bestTimesQueryKey(range, tz),
    queryFn: async (): Promise<BestTimes> => {
      const response = await fetch(
        `${API_URL}/v1/analytics/best-times?${rangeQuery(range)}` +
          `&tz=${encodeURIComponent(tz)}`
      );

      if (!response.ok) {
        throw new Error("Failed to load best times");
      }

      const result: ApiResponse<BestTimes> = await response.json();
      return result.data;
    },
    placeholderData: (previous) => previous,
  });
};
