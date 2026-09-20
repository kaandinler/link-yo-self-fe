import { expect, test } from "@playwright/test";
import { apiCreateLink } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { waitForHydration } from "../helpers/ui";

/**
 * Turkce dil destegi.
 *
 * Burada olculen sey ceviri dosyalarinin VARLIGI degil -- onu
 * locale-keys.spec.ts zaten yapiyor. Buradaki sorular tarayicinin
 * gordugu sonuca dair: /tr adresi gercekten Turkce mi basiyor, dil
 * dugmesi aradaki gecisi yapiyor mu, secim korunuyor mu.
 */

test.describe("Turkce", () => {
  test("/tr adresi Turkce basiyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/tr/settings");

    await expect(
      page.getByRole("heading", { name: "Ayarlar", level: 1 })
    ).toBeVisible();
    await expect(
      page.getByText("Hesabınızı ve profilinizi yönetin")
    ).toBeVisible();
  });

  test("sunucuda uretilen baslik da Turkce", async ({ page }) => {
    /**
     * Metadata sunucuda uretiliyor ve ayri bir i18next ornegi
     * kullaniyor (getServerTranslation). Istemci cevirisi calisirken
     * bunun ayrisabilecegi bir yer -- nitekim ayrismisti: baslik
     * `Settings - ${t("app-name")}` seklinde yazilmisti ve "Settings"
     * sabitti, yani /tr'de bile Ingilizce cikiyordu.
     */
    await signInAsNewUser(page);

    await page.goto("/tr/settings");

    await expect(page).toHaveTitle(/^Ayarlar/);
  });

  test("dil dugmesi ayni sayfada kalarak dili degistiriyor", async ({
    page,
  }) => {
    await signInAsNewUser(page);
    await page.goto("/en/settings");
    await waitForHydration(page, '[data-testid="language-switch"]');

    await page.getByTestId("language-switch").click();

    // AYNI SAYFA: dil degistirmek kullaniciyi ana sayfaya atmamali.
    await expect(page).toHaveURL(/\/tr\/settings$/);
    await expect(
      page.getByRole("heading", { name: "Ayarlar", level: 1 })
    ).toBeVisible();
  });

  test("secilen dil sonraki ziyarette korunuyor", async ({ page }) => {
    /**
     * Middleware dilsiz bir adresten yonlendirirken once cereze
     * bakiyor. Dugme yalnizca adresi degistirseydi bu test duserdi.
     */
    await signInAsNewUser(page);
    await page.goto("/en/settings");
    await waitForHydration(page, '[data-testid="language-switch"]');
    await page.getByTestId("language-switch").click();
    await expect(page).toHaveURL(/\/tr\/settings$/);

    // Dilsiz adres: karari middleware veriyor.
    await page.goto("/settings");

    await expect(page).toHaveURL(/\/tr\/settings$/);
  });

  test("Ingilizce bozulmadi", async ({ page }) => {
    /** Turkce eklemek mevcut dili degistirmemeli. */
    await signInAsNewUser(page);

    await page.goto("/en/settings");

    await expect(
      page.getByRole("heading", { name: "Settings", level: 1 })
    ).toBeVisible();
    await expect(page).toHaveTitle(/^Settings/);
  });

  test("veri degil, yalnizca arayuz ceviriliyor", async ({ page }) => {
    /**
     * Kullanicinin kendi yazdigi metin cevrilmemeli. Basit gibi
     * gorunuyor ama ceviri anahtarlarini veriye uygulayan bir hata
     * tam olarak burada gorunurdu.
     */
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "My English Link Title",
      url: "https://ornek.test/a",
    });

    await page.goto("/tr/links");
    await waitForHydration(page, '[aria-label="Yeni bağlantı ekle"]');

    // Arayuz Turkce...
    await expect(
      page.getByRole("heading", { name: "Bağlantılarım", level: 1 })
    ).toBeVisible();
    // ...ama kullanicinin verisi oldugu gibi.
    await expect(page.getByText("My English Link Title")).toBeVisible();
  });
});
