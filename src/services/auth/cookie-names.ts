// Cerez adlari. Hem sunucu (session-cookie.ts) hem istemci
// (session-hint.ts) tarafindan kullanildigi icin ayri bir dosyada:
// istemci paketi, yalnizca bir ad ogrenmek icin sunucu kodunu
// icine almasin.

/** Token'i tasiyan HttpOnly cerez. Istemci bunu okuyamaz. */
export const OTURUM_CEREZI = "ly_session";

/**
 * "Oturum var" isareti. HttpOnly DEGIL ama TOKEN DE TASIMIYOR --
 * degeri yalnizca "1". Sunucu buna hicbir zaman guvenmiyor.
 */
export const ISARET_CEREZI = "ly_auth";

/**
 * Eski, js-cookie ile kurulan ve JavaScript'in OKUYABILDIGI cerez.
 * Artik kurulmuyor; oturum acilirken ve kapanirken siliniyor ki
 * kullanicinin tarayicisinda okunabilir bir token kalmasin.
 */
export const ESKI_CEREZ = "auth-token-data";
