"use client";

import { useCallback } from "react";
import { AUTH_REFRESH_URL } from "./config";
import { FetchInputType, FetchInitType } from "./types/fetch-params";
import useLanguage from "../i18n/use-language";
import { getTokensInfo, setTokensInfo } from "../auth/auth-tokens-info";

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

async function temizlikCagir(authorization: string) {
  try {
    await fetch(TEMIZLIK_YOLU, {
      method: "POST",
      headers: { Authorization: authorization },
    });
  } catch {
    // Sessiz: asil islem basarili oldu.
  }
}

async function profilOnbelleginiTemizle(
  method: string | undefined,
  yanit: Response,
  headers: HeadersInit
) {
  const yontem = (method ?? "GET").toUpperCase();
  if (yontem === "GET" || yontem === "HEAD") return;
  if (!yanit.ok) return;

  const authorization = (headers as Record<string, string>).Authorization;
  // Token yoksa temizlenecek bir profil de yok (giris, kayit, sifre
  // sifirlama). Uc zaten 401 donerdi.
  if (!authorization) return;

  await temizlikCagir(authorization);
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
async function silmedenOnceTemizle(
  method: string | undefined,
  headers: HeadersInit
) {
  if ((method ?? "GET").toUpperCase() !== "DELETE") return;

  const authorization = (headers as Record<string, string>).Authorization;
  if (!authorization) return;

  await temizlikCagir(authorization);
}

function useFetch() {
  const language = useLanguage();

  return useCallback(
    async (input: FetchInputType, init?: FetchInitType) => {
      const tokens = getTokensInfo();

      let headers: HeadersInit = {
        "x-custom-lang": language,
      };

      if (!(init?.body instanceof FormData)) {
        headers = {
          ...headers,
          "Content-Type": "application/json",
        };
      }

      if (tokens?.token) {
        headers = {
          ...headers,
          Authorization: `Bearer ${tokens.token}`,
        };
      }

      if (tokens?.tokenExpires && tokens.tokenExpires - 60000 <= Date.now()) {
        const newTokens = await fetch(AUTH_REFRESH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.refreshToken}`,
          },
        }).then((res) => res.json());

        if (newTokens.token) {
          setTokensInfo({
            token: newTokens.token,
            refreshToken: newTokens.refreshToken,
            tokenExpires: newTokens.tokenExpires,
          });

          headers = {
            ...headers,
            Authorization: `Bearer ${newTokens.token}`,
          };
        }
      }

      // Temizlik ucunun kendisi yeni bir temizlik tetiklemesin.
      const temizlikUcu = String(input).includes(TEMIZLIK_YOLU);

      if (!temizlikUcu) {
        await silmedenOnceTemizle(init?.method, headers);
      }

      const yanit = await fetch(input, {
        ...init,
        headers: {
          ...headers,
          ...init?.headers,
        },
      });

      if (!temizlikUcu) {
        await profilOnbelleginiTemizle(init?.method, yanit, headers);
      }

      return yanit;
    },
    [language]
  );
}

export default useFetch;
