"use client";

import { useCallback } from "react";
import { FetchInputType, FetchInitType } from "./types/fetch-params";
import useLanguage from "../i18n/use-language";
import { oturumIsaretiVar } from "../auth/session-hint";

/**
 * API cagrilarinin ortak sarmalayicisi.
 *
 * TOKEN ARTIK BURADA YOK. Eskiden bu hook cerezden token'i okuyup
 * `Authorization` basligini kuruyor ve suresi dolmak uzereyse
 * yenilemeyi de kendisi yapiyordu. Token HttpOnly bir cereze tasindigi
 * icin ikisi de sunucuya gecti: cagrilar /api/proxy'ye gidiyor, cerezi
 * tarayici kendiliginden ekliyor, basligi ve yenilemeyi vekil
 * yapiyor (bkz. app/api/proxy/[...yol]/route.ts).
 */

/**
 * Bir sey degistiren her basarili istekten sonra, kullanicinin herkese
 * acik sayfasinin onbellegini temizler.
 *
 * NEDEN BURADA: sayfa bir dakikalik pencereyle onbellege aliniyor
 * (bkz. PROFIL_ONBELLEK_SANIYE). Temizligi tek tek kaydetme
 * noktalarina koymak, ileride eklenecek bir kaydetme noktasinin
 * unutulmasi demekti -- ve sonucu, kullanicinin kendi sayfasini eski
 * gormesi olurdu. Butun mutasyonlar bu tek fonksiyondan gectigi icin
 * buraya konuldu; unutulacak bir yer kalmiyor.
 *
 * `await` bilincli: kaydettikten hemen sonra "Preview Page"e tiklamak
 * sik bir hareket ve o an sayfanin guncel olmasi gerekiyor.
 *
 * Hata yutuluyor: temizlik yapilamazsa kullanicinin kaydi yine de
 * basarili. En kotu ihtimalle sayfa bir dakika eski kalir.
 */
const TEMIZLIK_YOLU = "/api/revalidate-profile";

async function temizlikCagir() {
  try {
    // Kimlik cerezden okunuyor; govde ve baslik gerekmiyor.
    await fetch(TEMIZLIK_YOLU, { method: "POST" });
  } catch {
    // Sessiz: asil islem basarili oldu.
  }
}

/**
 * Oturum yoksa temizlik cagrilmiyor.
 *
 * Eskiden bu karar "Authorization basligi var mi" ile veriliyordu;
 * baslik artik istemcide kurulmadigi icin ipuc cerezine bakiyoruz
 * (token tasimiyor, bkz. session-hint.ts). Yanlis pozitif zararsiz:
 * temizlik ucu 401 doner.
 */
function temizlenecekProfilYok(): boolean {
  return !oturumIsaretiVar();
}

async function profilOnbelleginiTemizle(
  method: string | undefined,
  yanit: Response
) {
  const yontem = (method ?? "GET").toUpperCase();
  if (yontem === "GET" || yontem === "HEAD") return;
  if (!yanit.ok) return;
  if (temizlenecekProfilYok()) return;

  await temizlikCagir();
}

/**
 * Silmeden ONCE de temizler.
 *
 * NEDEN: temizlik ucu "kim bu" sorusunu backend'e soruyor. Kullanici
 * kendi hesabini kapattiktan sonra token artik kimseye cozulmuyor,
 * yani sonradan yapilan temizlik 401 aliyor ve sayfa onbellekte
 * kaliyordu -- olculdu: hesap kapatildiktan sonra sayfa hala 200
 * donuyor ve silinen profilin adini gosteriyordu.
 *
 * Silmeden once cagrilinca token hala gecerli, temizlik calisiyor.
 * Sonrasindaki cagri da duruyor: baska turlu bir silmede (ornegin
 * bir linki silmek) asil ise yarayan o.
 */
async function silmedenOnceTemizle(method: string | undefined) {
  if ((method ?? "GET").toUpperCase() !== "DELETE") return;
  if (temizlenecekProfilYok()) return;

  await temizlikCagir();
}

function useFetch() {
  const language = useLanguage();

  return useCallback(
    async (input: FetchInputType, init?: FetchInitType) => {
      let headers: HeadersInit = {
        "x-custom-lang": language,
      };

      if (!(init?.body instanceof FormData)) {
        headers = {
          ...headers,
          "Content-Type": "application/json",
        };
      }

      // Temizlik ucunun kendisi yeni bir temizlik tetiklemesin.
      const temizlikUcu = String(input).includes(TEMIZLIK_YOLU);

      if (!temizlikUcu) {
        await silmedenOnceTemizle(init?.method);
      }

      const yanit = await fetch(input, {
        ...init,
        headers: {
          ...headers,
          ...init?.headers,
        },
      });

      if (!temizlikUcu) {
        await profilOnbelleginiTemizle(init?.method, yanit);
      }

      return yanit;
    },
    [language]
  );
}

export default useFetch;
