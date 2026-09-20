"use client";

/**
 * Istemciden yapilan butun API cagrilarinin ONEKI.
 *
 * DIKKAT, ARTIK BACKEND'IN ADRESI DEGIL. Token HttpOnly bir cerezde
 * (bkz. services/auth/session-cookie.ts), yani tarayicidaki JavaScript
 * onu okuyup `Authorization` basligini kuramiyor. Cagrilar kendi
 * origin'imizdeki vekile gidiyor; vekil cerezden token'i okuyup
 * FastAPI'ye iletiyor (bkz. app/api/proxy/[...yol]/route.ts).
 *
 * Yollar degismedi: `${API_URL}/v1/links` artik /api/proxy/v1/links
 * demek ve vekil onu backend'in /v1/links ucuna cevriyor.
 *
 * Backend'in gercek adresi yalnizca sunucuda kullaniliyor:
 * NEXT_PUBLIC_API_URL'i vekil ile public-profile servisi okuyor.
 */
export const API_URL = "/api/proxy";

/**
 * Oturum acma/kapatma. Vekilin disinda, cunku bu ucun yaniti token
 * iceriyor ve token'in tarayiciya inmemesi gerekiyor.
 */
export const AUTH_SESSION_URL = "/api/auth/session";

export const AUTH_ME_URL = API_URL + "/v1/users/me";

// Custom FastAPI endpoints
export const CUSTOM_AUTH_ME_URL = AUTH_ME_URL;
