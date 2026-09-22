import { expect, test } from "@playwright/test";

/**
 * Pazarlama sayfalari: /landing-page, /about, /contact.
 *
 * NEDEN: uc sayfa da boilerplate'ten gelmisti, i18n'in disindaydi ve
 * CANLIDA UYDURMA IS BILGISI YAYINLIYORDU:
 *   - Uc fiziksel ofis, sokak adresleriyle (San Francisco "123
 *     Innovation Drive", New York, Londra).
 *   - Telefon destegi "Monday - Friday, 9AM - 6PM EST" ve canli
 *     sohbet.
 *   - Yanit suresi sozu ("within 24 hours", "2-4 hours").
 *   - "10,000+ Active Users", "1M+ Links Shared".
 *   - Iki yerde "Join thousands of creators".
 *
 * Bunlar yanlis sirket adindan daha agir: biri bir ofise gitmeye
 * kalkabilir ya da telefonla aramayi bekleyebilir.
 *
 * Ayrica iletisim sayfasindaki <form> etiketinin onSubmit'i YOKTU --
 * yazilan mesaj hicbir yere gitmiyordu.
 */

/** Sayfalarda hicbirinde gorunmemesi gerekenler. */
const UYDURMA = [
  "Innovation Drive",
  "Business Avenue",
  "Tech Street",
  "9AM - 6PM",
  "10,000+",
  "1M+",
  "thousands of creators",
];

const SAYFALAR = ["/en/landing-page", "/en/about", "/en/contact"];

test.describe("Pazarlama sayfalari", () => {
  for (const yol of SAYFALAR) {
    test(`${yol} uydurma is bilgisi tasimiyor`, async ({ page }) => {
      await page.goto(yol);

      const metin = await page.locator("body").innerText();

      // Once sayfanin GERCEKTEN yuklendigini dogrula; bos bir sayfa da
      // butun "gecmiyor" iddialarini gecerdi.
      expect(metin.length).toBeGreaterThan(200);

      for (const iddia of UYDURMA) {
        expect(metin, `${yol} hala "${iddia}" iceriyor`).not.toContain(iddia);
      }
    });
  }

  test("iletisim sayfasinda calismayan form yok", async ({ page }) => {
    /**
     * Eski sayfada onSubmit'i olmayan bir <form> vardi: kullanici
     * mesajini yaziyor, gonder'e basiyor ve sayfa yeniliyordu --
     * mesaj hicbir yere gitmeden. Sessizce yutan bir form, formsuz
     * olmaktan kotu.
     */
    await page.goto("/en/contact");

    await expect(page.locator("form")).toHaveCount(0);
    // Geriye dogrulanabilir tek kanal kaldi.
    await expect(
      page.locator('a[href="mailto:support@linkyoself.com"]')
    ).toHaveCount(1);
  });

  test("footer'da olmayan sayfaya baglanti yok", async ({ page }) => {
    /**
     * Footer /terms'e baglaniyordu ve o sayfa yok -- baglanti 404'e
     * gidiyordu.
     */
    await page.goto("/en/landing-page");

    await expect(page.locator('a[href="/terms"]')).toHaveCount(0);
  });

  test("sayfalar Turkce de basiyor", async ({ page }) => {
    /**
     * Uc sayfa da i18n'in disindaydi: dil dugmesi urunun geri kalanini
     * cevirirken burasi Ingilizce kaliyordu.
     */
    await page.goto("/tr/about");
    await expect(page.getByText("Ne yapıyor")).toBeVisible();

    await page.goto("/tr/contact");
    await expect(page.getByText("Bize ulaşın")).toBeVisible();

    await page.goto("/tr/landing-page");
    await expect(page.getByText("Neler var")).toBeVisible();
  });

  test("about sayfasi urunun SINIRLARINI da soyluyor", async ({ page }) => {
    /**
     * Pazarlama sayfalari genelde bunu atlar; atlamak, urunu deneyip
     * yanlis beklentiyle ayrilan kullanicilar uretiyor. Bolumun
     * sessizce dusmesini engelliyor.
     */
    await page.goto("/en/about");

    await expect(page.getByTestId("about-not-yet")).toBeVisible();
    await expect(page.getByTestId("about-not-yet")).toContainText(
      "not a platform"
    );
  });
});
