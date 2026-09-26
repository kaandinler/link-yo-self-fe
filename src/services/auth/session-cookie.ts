// Oturum cerezi. YALNIZCA SUNUCUDA okunur/yazilir.
//
// NEDEN VAR: token onceden `auth-token-data` adli, js-cookie ile
// kurulan siradan bir cerezteydi -- yani sayfada calisan herhangi bir
// JavaScript `document.cookie` ile okuyabiliyordu. Bir XSS, tek satirda
// hem access hem refresh token'i disari tasiyabilirdi. Artik cerez
// HttpOnly: tarayici onu isteklere ekliyor ama JS'e hic gostermiyor.
//
// Token'i kullanan tek yer Next sunucusu: /api/proxy altindaki vekil
// cerezi okuyup FastAPI'ye `Authorization: Bearer` olarak iletiyor.
// Tarayici hicbir zaman token gormuyor.

import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { ESKI_CEREZ, ISARET_CEREZI, OTURUM_CEREZI } from "./cookie-names";

export type Oturum = {
  token: string;
  refreshToken: string | null;
  /** Access token'in bittigi an (ms). Bilinmiyorsa null. */
  tokenExpires: number | null;
};

/**
 * Cerez `Secure` olsun mu -- ISTEGIN PROTOKOLUNE gore.
 *
 * NEDEN NODE_ENV DEGIL: E2E suiti CI'da `npm run start` ile kosuyor,
 * yani NODE_ENV=production, ama adres http://localhost:3000. Secure'u
 * NODE_ENV'e baglasaydik tarayici cerezi hic kurmazdi ve giris
 * gerektiren butun testler duserdi. Dogru olcut "bu baglanti HTTPS
 * mi", "bu derleme production mu" degil.
 */
export function guvenliMi(request: NextRequest): boolean {
  return request.nextUrl.protocol === "https:";
}

export function oturumOku(request: NextRequest): Oturum | null {
  const ham = request.cookies.get(OTURUM_CEREZI)?.value;
  if (!ham) return null;

  try {
    const cozulmus = JSON.parse(ham) as Partial<Oturum>;
    if (typeof cozulmus.token !== "string" || !cozulmus.token) return null;

    return {
      token: cozulmus.token,
      refreshToken: cozulmus.refreshToken ?? null,
      tokenExpires: cozulmus.tokenExpires ?? null,
    };
  } catch {
    // Bozuk cerez = oturum yok. Istisna firlatmak, elle kurcalanmis
    // bir cerezin butun sayfayi 500'e dusurmesi demekti.
    return null;
  }
}

export function oturumYaz(
  response: NextResponse,
  request: NextRequest,
  oturum: Oturum
): void {
  response.cookies.set(OTURUM_CEREZI, JSON.stringify(oturum), {
    httpOnly: true,
    // Lax: tarayici cerezi siteler arasi POST/PUT/DELETE isteklerine
    // EKLEMIYOR, yani klasik CSRF akisi burada calismiyor. Vekil ayrica
    // Origin kontrolu de yapiyor (bkz. proxy route).
    sameSite: "lax",
    secure: guvenliMi(request),
    path: "/",
  });
  response.cookies.set(ISARET_CEREZI, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: guvenliMi(request),
    path: "/",
  });
  eskiCereziSil(response);
}

export function oturumSil(response: NextResponse): void {
  response.cookies.delete(OTURUM_CEREZI);
  response.cookies.delete(ISARET_CEREZI);
  eskiCereziSil(response);
}

function eskiCereziSil(response: NextResponse): void {
  response.cookies.delete(ESKI_CEREZ);
}

const DEGISTIREN_METOTLAR = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF: durum degistiren isteklerde Origin bu siteyle ayni olmali.
 *
 * Cerez zaten SameSite=Lax, yani tarayici onu siteler arasi bir POST'a
 * eklemiyor. Bu kontrol onun uzerine ikinci bir kat: Lax'i varsayilan
 * yapmayan eski bir tarayicida ya da baska bir yoldan gelen istekte de
 * cerez ise yaramasin.
 *
 * Origin hic yoksa reddediliyor: tarayicilar durum degistiren
 * isteklerde Origin gonderiyor. Gondermeyen bir istemcinin cereze
 * dayanmasi da gerekmiyor -- elinde token olan sunucu-sunucu
 * istemciler dogrudan FastAPI'ye gidiyor.
 */
export function csrfGecerli(request: NextRequest): boolean {
  if (!DEGISTIREN_METOTLAR.has(request.method)) return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}
