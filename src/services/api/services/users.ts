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
      const requestUrl = new URL(`${API_URL}/v1/users/`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());

      // Backend duz sorgu parametreleri bekliyor. Onceki hali filters/sort'u
      // JSON string olarak gonderiyordu; boyle bir uc hicbir zaman olmadi.
      if (data.search) {
        requestUrl.searchParams.append("search", data.search);
      }
      if (data.isAdmin !== undefined) {
        requestUrl.searchParams.append("is_admin", String(data.isAdmin));
      }
      if (data.orderBy) {
        requestUrl.searchParams.append("order_by", data.orderBy);
      }
      if (data.order) {
        requestUrl.searchParams.append("order", data.order);
      }

      return fetch(requestUrl, {
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
