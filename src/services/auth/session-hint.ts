"use client";

// Istemci tarafinda "oturum var mi" ipucu.
//
// Token'i OKUMUYOR -- okuyamaz da: token HttpOnly bir cerezde.
// Buradaki tek bilgi, oturum cereziyle birlikte kurulan ly_auth
// isaretinin var olup olmadigi (bkz. session-cookie.ts).
//
// NE ICIN: AuthProvider'in anonim ziyaretcide bosuna /users/me
// cagirmamasi. Yetki karari DEGIL; onu her zaman sunucu veriyor.

import Cookies from "js-cookie";
import { ISARET_CEREZI } from "./cookie-names";

export function oturumIsaretiVar(): boolean {
  return Cookies.get(ISARET_CEREZI) === "1";
}
