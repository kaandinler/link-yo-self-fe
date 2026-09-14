"use client";
import { useRouter } from "next/navigation";
import useAuth from "./use-auth";
import React, { FunctionComponent, useEffect } from "react";
import useLanguage from "../i18n/use-language";

type PropsType = {
  params?: { [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
};

type OptionsType = {
  /** Sayfa yalnizca admin kullanicilara acik olsun mu? */
  requireAdmin?: boolean;
};

/**
 * Sayfayi giris yapmis kullaniciyla sinirlar.
 *
 * ONCEKI HALI BOZUKTU: boilerplate'ten geldigi icin `user.role.id` degerini
 * RoleEnum listesine karsi kontrol ediyordu. FastAPI backend'inin UserRead
 * modelinde rol alani yok, dolayisiyla kosul hicbir zaman saglanmiyor ve
 * giris yapmis kullanici bile sayfayi goremeden ana sayfaya atiliyordu.
 *
 * Artik yalnizca kullanicinin varligina, admin sayfalarinda ise backend'in
 * dondugu is_admin bayragina bakiliyor. Bu yalnizca arayuz katmani: asil
 * yetki kontrolu backend'de (deps.get_current_admin_user).
 */
function withPageRequiredAuth(
  Component: FunctionComponent<PropsType>,
  options?: OptionsType
) {
  const requireAdmin = options?.requireAdmin ?? false;

  return function WithPageRequiredAuth(props: PropsType) {
    const { user, isLoaded } = useAuth();
    const router = useRouter();
    const language = useLanguage();

    const isAllowed = Boolean(user) && (!requireAdmin || user?.is_admin);

    useEffect(() => {
      if (!isLoaded || isAllowed) return;

      // Giris yapmamissa sign-in'e, giris yapmis ama yetkisi yoksa ana sayfaya.
      if (!user) {
        const currentLocation = window.location.toString();
        const returnToPath =
          currentLocation.replace(new URL(currentLocation).origin, "") ||
          `/${language}`;
        const params = new URLSearchParams({ returnTo: returnToPath });

        router.replace(`/${language}/sign-in?${params.toString()}`);
        return;
      }

      router.replace(`/${language}`);
    }, [user, isLoaded, isAllowed, router, language]);

    return isAllowed ? <Component {...props} /> : null;
  };
}

export default withPageRequiredAuth;
