import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import acceptLanguage from "accept-language";
import {
  fallbackLanguage,
  languages,
  cookieName,
} from "./services/i18n/config";

acceptLanguage.languages([...languages]);

const PUBLIC_FILE = /\.(.*)$/;

/**
 * Yolun dil oneki, yoksa undefined.
 *
 * TAM SEGMENT eslesmesi. Onceki kontrol `startsWith("/tr")` idi ve
 * "/trendy" ya da "/entry" gibi yollari da "dili var" sayiyordu. Olculdu:
 *
 *   /kaan    -> 307 /en/kaan   (dogru)
 *   /trendy  -> 200, TANITIM SAYFASI   (dogrusu /en/trendy)
 *   /entry   -> 200, TANITIM SAYFASI
 *
 * Yani adi "en" ya da "tr" ile baslayan her kullanicinin (trevor,
 * entry, english...) oneksiz profil baglantisi, profil yerine tanitim
 * sayfasini aciyordu.
 */
function yolunDili(yol: string): string | undefined {
  return languages.find(
    (dil) => yol === `/${dil}` || yol.startsWith(`/${dil}/`)
  );
}

export function middleware(req: NextRequest) {
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.includes("/api/") ||
    PUBLIC_FILE.test(req.nextUrl.pathname)
  ) {
    return NextResponse.next();
  }

  let language;
  if (req.cookies.has(cookieName))
    language = acceptLanguage.get(req.cookies.get(cookieName)?.value);
  if (!language)
    language = acceptLanguage.get(req.headers.get("Accept-Language"));
  if (!language) language = fallbackLanguage;

  const dil = yolunDili(req.nextUrl.pathname);

  // Yolda dil yoksa tercih edilen dile yonlendir.
  if (!dil) {
    return NextResponse.redirect(
      new URL(
        `/${language}${req.nextUrl.pathname}${req.nextUrl.search}`,
        req.url
      )
    );
  }

  /*
   * Dil cerezi: kullanicinin GERCEKTEN ACTIGI sayfanin dili.
   *
   * Onceden cerez HER istekte, istegin REFERER'indaki dilden
   * yaziliyordu. Bu, dil dugmesiyle dogrudan catisiyordu. Olculdu,
   * /en/settings'te dugmeye tek bir tiklamada sunucunun cereze
   * yazdiklari:
   *
   *   en <- /tr/settings   (referer /en/settings)   x2
   *   en <- /en/dashboard, /en/links, ...  (Next'in on-yuklemeleri)
   *   tr <- /tr/dashboard, /tr/links, ...  (Next'in on-yuklemeleri)
   *
   * Dugme cerezi "tr" yapiyor, sunucu hemen "en"e geri ceviriyordu.
   * Son deger "tr" cikiyordu, ama yalnizca Turkce sayfanin
   * on-yuklemeleri SONA KALDIGI icin; havadaki bir Ingilizce istek
   * sonra donerse secim sessizce geri aliniyordu. turkish.spec.ts'teki
   * "secilen dil sonraki ziyarette korunuyor" testinin ara sira
   * dusmesinin sebebi buydu -- ve gercek kullanicida da ayni sey olur.
   *
   * Iki kural:
   *   1) Dil referer'dan degil ISTENEN yoldan okunuyor.
   *   2) Yalnizca gercek sayfa yuklemesinde yaziliyor
   *      (Sec-Fetch-Dest: document). Arka plan istekleri -- on-yukleme
   *      ve istemci ici gezinme -- tarayicida "empty" geliyor ve cereze
   *      dokunmuyor. Istemci ici gezinmede cerezi dil dugmesi zaten
   *      kendisi yaziyor.
   *
   * NEDEN Next'in kendi basligi degil: on-yuklemeyi isaretleyen
   * `Next-Router-Prefetch` (ve `RSC`) middleware'e HIC ULASMIYOR --
   * Next onlari middleware'in gordugu istekten bilerek siliyor
   * (next/dist/server/web/adapter.js, FLIGHT_HEADERS). Ilk deneme onu
   * kullandi ve olcum on-yuklemenin hala "en" yazdigini gosterdi.
   * Sec-Fetch-Dest tarayicinin standart basligi, Next ona dokunmuyor.
   */
  const response = NextResponse.next();
  const sayfaYuklemesi = req.headers.get("sec-fetch-dest") === "document";
  if (sayfaYuklemesi && req.cookies.get(cookieName)?.value !== dil) {
    response.cookies.set(cookieName, dil);
  }
  return response;
}
