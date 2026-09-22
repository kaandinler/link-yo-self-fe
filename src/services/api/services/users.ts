import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { User } from "../types/user";
import { SortEnum } from "../types/sort-type";
import { RequestConfigType } from "./types/request-config";

/**
 * Backend'in ortak yanit zarfi: {status, message, data}.
 * Sayfalanmis uclar ayrica meta dondurur.
 */
type ApiEnvelope<T> = {
  status: string;
  message?: string | null;
  data: T;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
};

export type UsersRequest = {
  page: number;
  limit: number;
  /** Kullanici adi, e-posta, ad veya soyadda arar. */
  search?: string;
  /** undefined: filtre yok, true: sadece adminler, false: sadece normaller. */
  isAdmin?: boolean;
  orderBy?: keyof User;
  order?: SortEnum;
};

export type UsersResponse = ApiEnvelope<User[]> & { meta: PaginationMeta };

export function useGetUsersService() {
  const fetch = useFetch();

  return useCallback(
    (data: UsersRequest, requestConfig?: RequestConfigType) => {
      // URLSearchParams, `new URL` DEGIL.
      //
      // NEDEN: API_URL artik mutlak bir adres degil, kendi
      // origin'imizdeki vekilin yolu ("/api/proxy"). `new URL` goreli
      // bir dizgeyle "Invalid URL" firlatiyor -- olculdu, node'da da
      // tarayicida da. Yani bu cagri, token HttpOnly cereze tasindiktan
      // sonra sessizce patlamaya basladi: admin kullanici listesi hic
      // yuklenmiyordu.
      //
      // Sessiz kalmasinin sebebi testte: E2E suiti /admin-panel/users
      // sayfasini aciyor ama yalnizca dokunma hedeflerinin boyutuna
      // bakiyordu. Bu PR listenin GERCEKTEN dolduğunu olcen bir test
      // ekliyor.
      const parametreler = new URLSearchParams({
        page: data.page.toString(),
        limit: data.limit.toString(),
      });

      // Backend duz sorgu parametreleri bekliyor. Onceki hali filters/sort'u
      // JSON string olarak gonderiyordu; boyle bir uc hicbir zaman olmadi.
      if (data.search) {
        parametreler.append("search", data.search);
      }
      if (data.isAdmin !== undefined) {
        parametreler.append("is_admin", String(data.isAdmin));
      }
      if (data.orderBy) {
        parametreler.append("order_by", data.orderBy);
      }
      if (data.order) {
        parametreler.append("order", data.order);
      }

      return fetch(`${API_URL}/v1/users/?${parametreler.toString()}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<UsersResponse>);
    },
    [fetch]
  );
}

export type UserRequest = {
  id: User["id"];
};

export type UserResponse = ApiEnvelope<User>;

export function useGetUserService() {
  const fetch = useFetch();

  return useCallback(
    (data: UserRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/users/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<UserResponse>);
    },
    [fetch]
  );
}

/**
 * Backend'in UserCreateAdmin modeli.
 *
 * username zorunlu: profil sayfasi /{username} adresinde yayinlaniyor ve
 * kolon UNIQUE NOT NULL. Onceki form bu alani hic sormuyordu.
 */
export type UserPostRequest = {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
};

export type UserPostResponse = ApiEnvelope<User>;

export function usePostUserService() {
  const fetch = useFetch();

  return useCallback(
    (data: UserPostRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/users/`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<UserPostResponse>);
    },
    [fetch]
  );
}

/**
 * Backend'in UserUpdateAdmin modeli; gonderilmeyen alan degistirilmez.
 * Bu yuzden degismeyen alanlari govdeye hic koymamak gerekiyor.
 */
export type UserPatchRequest = {
  id: User["id"];
  data: Partial<UserPostRequest>;
};

export type UserPatchResponse = ApiEnvelope<User>;

export function usePatchUserService() {
  const fetch = useFetch();

  return useCallback(
    (data: UserPatchRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/users/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<UserPatchResponse>);
    },
    [fetch]
  );
}

/**
 * Kullanicinin kendi hesabini kapatmasi: DELETE /v1/users/me
 *
 * Backend govdede mevcut sifreyi istiyor; geri alinamayan bir islem oldugu
 * icin acik birakilmis bir oturum tek basina hesabi kapatamamali.
 */
export type DeleteMyAccountRequest = {
  password: string;
};

export function useDeleteMyAccountService() {
  const fetch = useFetch();

  return useCallback(
    (data: DeleteMyAccountRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/users/me`, {
        method: "DELETE",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>);
    },
    [fetch]
  );
}

/**
 * Bir kullanicinin herkese acik sayfasinin onbellegini temizler.
 *
 * NEDEN AYRI BIR SERVIS: siradan mutasyonlarda temizlik kendiliginden
 * oluyor (use-fetch.ts) ama orada temizlenen sey her zaman CAGIRANIN
 * kendi profili. Admin panelinden baska birinin hesabi kapatilinca
 * temizlenmesi gereken o kisinin sayfasi; uc bunu yalnizca admin'den
 * kabul ediyor.
 *
 * Bu olmadan kapatilan hesabin sayfasi bir dakika daha aciktı --
 * olculdu.
 */
export function usePurgeProfileCacheService() {
  const fetch = useFetch();

  return useCallback(
    (username: string) =>
      fetch("/api/revalidate-profile", {
        method: "POST",
        body: JSON.stringify({ username }),
      }),
    [fetch]
  );
}

export type UsersDeleteRequest = {
  id: User["id"];
};

export type UsersDeleteResponse = undefined;

export function useDeleteUsersService() {
  const fetch = useFetch();

  return useCallback(
    (data: UsersDeleteRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/users/${data.id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<UsersDeleteResponse>);
    },
    [fetch]
  );
}
