import { expect, test } from "@playwright/test";

/**
 * Kullanim kosullari ve kayittaki onay kutusu.
 *
 * NEDEN: kayit formu "Kullanim Kosullari'ni ve Gizlilik Politikasi'ni
 * kabul ediyorum" kutusunun isaretlenmesini ZORUNLU tutuyordu, ama iki
 * baglanti da 404'tu -- /terms hic yoktu, /privacy ise yanlis adresti
 * (sayfa /privacy-policy). Her yeni kullanicidan acilmayan iki belgeyi
 * kabul etmesi isteniyordu.
 */

test.describe("Kullanim kosullari", () => {
  test("kayittaki iki onay baglantisi da aciliyor", async ({ page }) => {
    await page.goto("/en/sign-up");

    for (const [kimlik, beklenen] of [
      ["sign-up-terms-link", "/en/terms"],
      ["sign-up-privacy-link", "/en/privacy-policy"],
    ] as const) {
      const baglanti = page.getByTestId(kimlik);
      await expect(baglanti).toHaveAttribute("href", beklenen);

      // Adresin dogru gorunmesi yetmez: gercekten bir sayfa acmali.
      const yanit = await page.request.get(beklenen);
      expect(yanit.status(), beklenen).toBe(200);
    }
  });

  test("Turkce kayitta baglantilar Turkce sayfalara gidiyor", async ({
    page,
  }) => {
    await page.goto("/tr/sign-up");

    await expect(page.getByTestId("sign-up-terms-link")).toHaveAttribute(
      "href",
      "/tr/terms"
    );
    await expect(page.getByTestId("sign-up-privacy-link")).toHaveAttribute(
      "href",
      "/tr/privacy-policy"
    );
  });

  test("sayfa iki dilde de basiyor", async ({ page }) => {
    await page.goto("/en/terms");
    await expect(page.getByTestId("terms-title")).toHaveText("Terms of Use");
    await expect(page.getByTestId("terms-rules").locator("li")).toHaveCount(6);

    await page.goto("/tr/terms");
    await expect(page.getByTestId("terms-title")).toHaveText(
      "Kullanım Koşulları"
    );
  });

  test("sorumluluk ve uygulanacak hukuk bolumleri iki dilde de var", async ({
    page,
  }) => {
    // Iki dilin anahtarlari locale-keys testiyle esitleniyor; burada
    // sayfanin bolumleri gercekten CIZDIGI olculuyor.
    for (const [yol, basliklar, hukuk] of [
      [
        "/en/terms",
        ["Liability", "Governing law and disputes"],
        "laws of the Republic of Türkiye",
      ],
      [
        "/tr/terms",
        ["Sorumluluk", "Uygulanacak hukuk ve uyuşmazlıklar"],
        "Türkiye Cumhuriyeti hukuku",
      ],
    ] as const) {
      await page.goto(yol);
      for (const baslik of basliklar) {
        await expect(
          page.getByRole("heading", { level: 2, name: baslik, exact: true }),
          `${yol}: ${baslik}`
        ).toBeVisible();
      }
      await expect(page.getByText(hukuk)).toBeVisible();
    }
  });

  test("gizlilik politikasina dil onekiyle baglaniyor", async ({ page }) => {
    await page.goto("/tr/terms");

    const baglanti = page.locator('a[href="/tr/privacy-policy"]');
    await expect(baglanti).toHaveCount(1);
  });
});
