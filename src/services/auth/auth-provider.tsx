"use client";

import { User } from "@/services/api/types/user";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthActionsContext,
  AuthContext,
  AuthTokensContext,
  TokensInfo,
} from "./auth-context";
import useFetch from "@/services/api/use-fetch";
import { AUTH_LOGOUT_URL, AUTH_ME_URL } from "@/services/api/config";
import HTTP_CODES_ENUM from "../api/types/http-codes";
import {
  getTokensInfo,
  setTokensInfo as setTokensInfoToStorage,
} from "./auth-tokens-info";
import { useAuthLogoutWithFastAPIService } from "@/services/api/services/auth";
import { useAuthMeWithFastAPIService } from "@/services/api/services/user-info";

/**
 * Enhanced AuthProvider that supports both legacy and FastAPI backends
 *
 * Features:
 * - Automatic user data loading on app start
 * - Support for both legacy and FastAPI logout
 * - Support for both legacy and FastAPI user info fetching
 * - Graceful fallback between different API formats
 */

function AuthProvider(props: PropsWithChildren<{}>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const fetchBase = useFetch();
  const fetchAuthLogoutFastAPI = useAuthLogoutWithFastAPIService();
  const fetchAuthMeFastAPI = useAuthMeWithFastAPIService();

  const setTokensInfo = useCallback((tokensInfo: TokensInfo) => {
    setTokensInfoToStorage(tokensInfo);

    if (!tokensInfo) {
      setUser(null);
    }
  }, []);

  const logOut = useCallback(async () => {
    const tokens = getTokensInfo();

    if (tokens?.token) {
      try {
        // Try FastAPI logout first
        const fastAPIResponse = await fetchAuthLogoutFastAPI(tokens.token);

        if (fastAPIResponse.status !== "success") {
          // Fallback to legacy logout if FastAPI fails
          await fetchBase(AUTH_LOGOUT_URL, {
            method: "POST",
          });
        }
      } catch (error) {
        // Fallback to legacy logout if FastAPI fails
        try {
          await fetchBase(AUTH_LOGOUT_URL, {
            method: "POST",
          });
        } catch (legacyError) {
          console.warn("Both FastAPI and legacy logout failed:", {
            error,
            legacyError,
          });
        }
      }
    }
    setTokensInfo(null);
  }, [setTokensInfo, fetchBase, fetchAuthLogoutFastAPI]);

  const loadData = useCallback(async () => {
    const tokens = getTokensInfo();

    try {
      if (tokens?.token) {
        let userData = null;

        try {
          // Try FastAPI user info endpoint first
          const fastAPIResponse = await fetchAuthMeFastAPI(tokens.token);

          if (fastAPIResponse.status === "success" && fastAPIResponse.data) {
            userData = fastAPIResponse.data;
          }
        } catch (fastAPIError) {
          console.warn(
            "FastAPI user info failed, trying legacy:",
            fastAPIError
          );
        }

        // Fallback to legacy user info endpoint if FastAPI failed
        if (!userData) {
          try {
            const response = await fetchBase(AUTH_ME_URL, {
              method: "GET",
            });

            if (response.status === HTTP_CODES_ENUM.UNAUTHORIZED) {
              logOut();
              return;
            }

            userData = await response.json();
          } catch (legacyError) {
            console.warn("Legacy user info also failed:", legacyError);
            logOut();
            return;
          }
        }

        setUser(userData);
      }
    } finally {
      setIsLoaded(true);
    }
  }, [fetchBase, logOut, fetchAuthMeFastAPI]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const contextValue = useMemo(
    () => ({
      isLoaded,
      user,
    }),
    [isLoaded, user]
  );

  const contextActionsValue = useMemo(
    () => ({
      setUser,
      logOut,
    }),
    [logOut]
  );

  const contextTokensValue = useMemo(
    () => ({
      setTokensInfo,
    }),
    [setTokensInfo]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      <AuthActionsContext.Provider value={contextActionsValue}>
        <AuthTokensContext.Provider value={contextTokensValue}>
          {props.children}
        </AuthTokensContext.Provider>
      </AuthActionsContext.Provider>
    </AuthContext.Provider>
  );
}

export default AuthProvider;
