"use client";

import { useCallback } from "react";
import { FetchInputType, FetchInitType } from "./types/fetch-params";
import useLanguage from "../i18n/use-language";

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

/*
 * PROFIL ONBELLEGI BURADA TEMIZLENMIYOR -- ARTIK VEKILDE.
 *
 * Eskiden bu hook her basarili mutasyondan sonra /api/revalidate-profile'i
 * ayrica cagiriyordu (DELETE'te bir kez de ONCE). O ikinci istek ancak
 * kaydetme yaniti tarayiciya ulastiktan sonra atilabiliyordu; kullanici
 * o arada sayfayi yenilerse ya da sekmeyi kapatirsa hic atilmiyor ve
 * herkese acik sayfa 60 sn eski kaliyordu. Olculdu (uretim derlemesi,
 * 12 kosu): 9 bayat / 3 taze; `keepalive: true` ile 8 / 4.
 *
 * Butun mutasyonlar /api/proxy'den gectigi icin temizlik oraya, AYNI
 * istegin icine tasindi: 12 / 12 taze. Buradaki cagri kaldirildi --
 * vekil zaten yapmis oluyor ve her kaydetmeyi iki istege cikariyordu.
 * Bkz. app/api/proxy/[...yol]/route.ts.
 */

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

      return fetch(input, {
        ...init,
        headers: {
          ...headers,
          ...init?.headers,
        },
      });
    },
    [language]
  );
}

export default useFetch;
