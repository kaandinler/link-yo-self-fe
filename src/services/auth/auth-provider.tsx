"use client";

import { User } from "@/services/api/types/user";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthActionsContext, AuthContext } from "./auth-context";
import useFetch from "@/services/api/use-fetch";
import { AUTH_ME_URL, AUTH_SESSION_URL } from "@/services/api/config";
import HTTP_CODES_ENUM from "../api/types/http-codes";
import { oturumIsaretiVar } from "./session-hint";

/**
 * Oturumu olan kullaniciyi yukler ve cikisi yonetir.
 *
 * TOKEN'A HIC DOKUNMUYOR. Token HttpOnly bir cerezde ve yalnizca Next
 * sunucusu goruyor; bu bilesen "oturum var mi" sorusunu token'dan
 * degil, ipuc cerezinden (session-hint.ts) ve backend'in yanitindan
 * ogreniyor.
 */
function AuthProvider(props: PropsWithChildren) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const fetchBase = useFetch();

  const logOut = useCallback(async () => {
    try {
      // Cerezi silen ve backend'e cikisi bildiren tek uc.
      await fetch(AUTH_SESSION_URL, { method: "DELETE" });
    } catch (error) {
      // Cerez silinememis olabilir ama kullaniciyi arayuzde giris
      // yapmis birakmak daha kotu olurdu.
      console.warn("Cikis istegi basarisiz:", error);
    }
    setUser(null);
  }, []);

  const loadData = useCallback(async () => {
    /**
     * Anonim ziyaretcide HIC istek yapilmiyor.
     *
     * NEDEN ONEMLI: bu saglayici kok layout'ta, yani herkese acik
     * profil sayfalarini da sariyor -- urunun en cok trafik alan
     * sayfasi. Isaret olmasaydi her ziyarette 401 ile donen bir
     * /users/me cagrisi olurdu.
     */
    if (!oturumIsaretiVar()) {
      setIsLoaded(true);
      return;
    }

    try {
      const response = await fetchBase(AUTH_ME_URL, { method: "GET" });

      if (response.status === HTTP_CODES_ENUM.UNAUTHORIZED) {
        // Vekil 401'de cerezi zaten siliyor; burada arayuzu esitliyoruz.
        setUser(null);
        return;
      }

      const govde = await response.json();
      setUser(govde?.data ?? null);
    } catch (error) {
      console.warn("Kullanici bilgisi okunamadi:", error);
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, [fetchBase]);

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

  return (
    <AuthContext.Provider value={contextValue}>
      <AuthActionsContext.Provider value={contextActionsValue}>
        {props.children}
      </AuthActionsContext.Provider>
    </AuthContext.Provider>
  );
}

export default AuthProvider;
