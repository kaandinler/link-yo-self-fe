import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";

/**
 * Platform yonetimi -- yalnizca admin.
 *
 * Kullaniciya gosterilen secim listesi ayri bir uctan geliyor
 * (/v1/social-accounts/platforms) ve emekliye ayrilmislari filtreliyor.
 * Buradaki liste onlari da iceriyor: geri getirmek isteyen yoneticinin
 * once gorebilmesi gerekiyor.
 */

type Zarf<T> = {
  status: string;
  message?: string | null;
  data: T;
};

export type Platform = {
  id: number;
  name: string;
  display_name: string | null;
};

export type PlatformAdmin = Platform & {
  /** Emekliye ayrilmis mi; secim listesinde gorunmuyor demek. */
  is_retired: boolean;
  /** Kac kullanici bu platformu kullaniyor. Emekliye ayirmadan once bakilir. */
  account_count: number;
};

export function useGetPlatformsService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/platforms/`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Zarf<PlatformAdmin[]>>),
    [fetch]
  );
}

export type PlatformCreateRequest = {
  name: string;
  display_name?: string | null;
};

export function useCreatePlatformService() {
  const fetch = useFetch();

  return useCallback(
    (data: PlatformCreateRequest, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/platforms/`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Zarf<Platform>>),
    [fetch]
  );
}

export function useUpdatePlatformService() {
  const fetch = useFetch();

  return useCallback(
    (
      id: number,
      data: { display_name: string | null },
      requestConfig?: RequestConfigType
    ) =>
      fetch(`${API_URL}/v1/platforms/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Zarf<Platform>>),
    [fetch]
  );
}

/**
 * Platformu EMEKLIYE AYIRIR; satiri silmez.
 *
 * Backend'de sert silme yok ve bu bilincli: social_accounts.platform_id
 * FOREIGN KEY ve ondelete CASCADE, yani satiri gercekten silmek o
 * platformdaki butun kullanicilarin sosyal hesaplarini yok ederdi.
 */
export function useRetirePlatformService() {
  const fetch = useFetch();

  return useCallback(
    (id: number, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/platforms/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>),
    [fetch]
  );
}
