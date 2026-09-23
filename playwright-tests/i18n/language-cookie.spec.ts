import { expect, test, type APIResponse } from "@playwright/test";

/**
 * Dil cerezini middleware'in nasil yazdigi.
 *
 * NEDEN AYRI VE TARAYICISIZ: turkish.spec.ts'teki "secilen dil sonraki
 * ziyarette korunuyor" testi ara sira dusuyordu. Sebebi olculdu: dil
 * cerezi istegin REFERER'indan yaziliyordu ve Next'in arka plan
 * on-yuklemeleri de cereze yaziyordu. Dugme "tr" yaziyor, havadaki bir
 * Ingilizce istek onu "en"e geri ceviriyordu; kimin son geldigi
 * siraya bagliydi.
 *
 * O test yarisi YAKALAMAK icin sansa muhtac. Buradaki testler yarisin
 * PARCALARINI tek tek, sirasiz ve kesin olarak olcuyor: her biri tek
 * bir istek ve tek bir Set-Cookie.
 */

/** Yanitin dil cerezine yazdigi deger; yazmadiysa null. */
function yazilanDil(yanit: APIResponse): string | null {
  const basliklar = yanit
    .headersArray()
    .filter((b) => b.name.toLowerCase() === "set-cookie")
    .map((b) => b.value);
  for (const b of basliklar) {
    const m = b.match(/(?:^|\s)i18next=([^;]*)/);
    if (m) return m[1];
  }
  return null;
}

test.describe("Dil cerezi", () => {
  test("cerez, referer'in degil GIDILEN sayfanin dilinden yaziliyor", async ({
    request,
  }) => {
    /**
     * /en/settings'ten /tr/settings'e bir SAYFA YUKLEMESI. Eski hali
     * referer'a bakip "en" yaziyordu -- kullanici Turkce sayfadayken.
     */
    const yanit = await request.get("/tr/settings", {
      headers: {
        Referer: "http://localhost:3000/en/settings",
        "Sec-Fetch-Dest": "document",
      },
      maxRedirects: 0,
    });

    expect(yazilanDil(yanit)).toBe("tr");
  });

  test("on-yukleme cereze dokunmuyor", async ({ request }) => {
    /**
     * Next, menudeki baglantilari arka planda on-yukluyor. Kullanici
     * oraya GITMEDI; cereze yazmak, az once sectigi dili sessizce
     * geri almak demekti.
     *
     * Basliklar tarayicida olculen on-yukleme isteginin aynisi.
     * Sec-Fetch-Dest "empty": fetch() ile yapilan her istek boyle.
     * (Next-Router-Prefetch de gonderiliyor ama Next onu middleware'den
     * gizliyor; test ona guvenseydi yanlis seyi olcerdi.)
     */
    const yanit = await request.get("/en/dashboard", {
      headers: {
        Cookie: "i18next=tr",
        Referer: "http://localhost:3000/en/settings",
        RSC: "1",
        "Next-Router-Prefetch": "1",
        "Sec-Fetch-Dest": "empty",
      },
      maxRedirects: 0,
    });

    expect(yazilanDil(yanit)).toBeNull();
  });

  test("cerez zaten dogruysa yeniden yazilmiyor", async ({ request }) => {
    const yanit = await request.get("/tr/settings", {
      headers: { Cookie: "i18next=tr", "Sec-Fetch-Dest": "document" },
      maxRedirects: 0,
    });

    expect(yazilanDil(yanit)).toBeNull();
  });

  for (const ad of ["trendy", "entry"]) {
    test(`oneksiz /${ad} profile yonlendiriliyor, tanitim sayfasina degil`, async ({
      request,
    }) => {
      /**
       * Onceki kontrol startsWith("/tr") idi: "/trendy" "dili var"
       * sayiliyor, yonlendirilmiyor ve tanitim sayfasi aciliyordu.
       * Adi "en"/"tr" ile baslayan her kullanicinin oneksiz baglantisi
       * yanlis sayfaya gidiyordu.
       */
      const yanit = await request.get(`/${ad}`, {
        headers: { Cookie: "i18next=en" },
        maxRedirects: 0,
      });

      expect(yanit.status()).toBe(307);
      expect(yanit.headers()["location"]).toMatch(new RegExp(`/en/${ad}$`));
    });
  }

  test("dil onekinin kendisi hala taniniyor", async ({ request }) => {
    // Tam segment eslesmesi "/tr" ve "/tr/..." yollarini bozmamali.
    for (const yol of ["/tr", "/tr/about", "/en"]) {
      const yanit = await request.get(yol, { maxRedirects: 0 });
      expect(yanit.status(), yol).toBe(200);
    }
  });
});
