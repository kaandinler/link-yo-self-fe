import { expect, test } from "@playwright/test";
import { signInAsAdmin, signInAsNewUser } from "../helpers/auth";
import { waitForHydration } from "../helpers/ui";

/**
 * Platform yonetimi.
 *
 * ONCEDEN YOKTU: 20 platform bir seed migration'iyla gelmisti ve yeni
 * bir platform eklemek yeni bir migration yazip dagitim yapmak
 * demekti.
 *
 * Olculen sey sayfanin gorunmesi degil, ISE YARAMASI: eklenen
 * platformun kullanicinin secim listesine gercekten girmesi.
 */

/** Her kosuda benzersiz: platformlar kalici ve suit tekrar tekrar kosuyor. */
function benzersizAd(): string {
  return `e2e${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

test.describe("Platform yonetimi", () => {
  test("siradan kullanici sayfaya giremiyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/admin-panel/platforms");

    // withPageRequiredAuth admin olmayani disari atiyor.
    await expect(page).not.toHaveURL(/admin-panel\/platforms/);
  });

  test("eklenen platform kullanicinin secim listesine giriyor", async ({
    page,
  }) => {
    /**
     * ASIL TEST. Sayfanin "eklendi" demesi yetmez -- maddenin amaci
     * yeni platformun KULLANILABILIR olmasi.
     */
    const ad = benzersizAd();
    await signInAsAdmin(page);
    await page.goto("/en/admin-panel/platforms");
    await waitForHydration(page, '[data-testid="platform-submit"]');

    await page.getByTestId("platform-name").fill(ad);
    await page.getByTestId("platform-display-name").fill("E2E Platform");
    await page.getByTestId("platform-submit").click();

    await expect(page.getByTestId(`platform-row-${ad}`)).toBeVisible();

    // Kullanici tarafi: secim listesi ayri bir uctan geliyor.
    const secim = await page.request.get(
      "/api/proxy/v1/social-accounts/platforms",
      { headers: { Origin: page.url().replace(/(https?:\/\/[^/]+).*/, "$1") } }
    );
    expect(secim.status()).toBe(200);
    expect(await secim.text()).toContain(ad);
  });

  test("emekliye ayrilan platform listeden cikiyor ama satirda kaliyor", async ({
    page,
  }) => {
    const ad = benzersizAd();
    await signInAsAdmin(page);
    await page.goto("/en/admin-panel/platforms");
    await waitForHydration(page, '[data-testid="platform-submit"]');

    await page.getByTestId("platform-name").fill(ad);
    await page.getByTestId("platform-submit").click();
    await expect(page.getByTestId(`platform-row-${ad}`)).toBeVisible();

    await page.getByTestId(`platform-retire-${ad}`).click();
    // Onay penceresi: metin ne olacagini soylemeli.
    await expect(page.getByText(/nothing is deleted/i)).toBeVisible();
    await page.getByRole("button", { name: "Retire", exact: true }).click();

    // Yonetim listesinde kaliyor -- geri getirilebilsin diye.
    await expect(page.getByTestId(`platform-restore-${ad}`)).toBeVisible();

    // ...ama kullanicinin secim listesinden cikti.
    const secim = await page.request.get(
      "/api/proxy/v1/social-accounts/platforms",
      { headers: { Origin: page.url().replace(/(https?:\/\/[^/]+).*/, "$1") } }
    );
    expect(await secim.text()).not.toContain(ad);
  });
});

test.describe("Admin kullanici listesi", () => {
  test("liste gercekten doluyor", async ({ page }) => {
    /**
     * NEDEN BU TEST VAR: token HttpOnly cereze tasindiginda API_URL
     * mutlak bir adres olmaktan cikip vekilin yoluna ("/api/proxy")
     * dondu. Bu servis adresi `new URL(...)` ile kuruyordu ve goreli
     * bir dizge "Invalid URL" firlatiyor -- yani liste SESSIZCE
     * yuklenmez oldu.
     *
     * Suitte sayfa zaten aciliyordu (form-touch-targets.spec.ts) ama
     * yalnizca dokunma hedeflerinin boyutuna bakiliyordu; hicbir sey
     * listenin dolup dolmadigini olcmuyordu.
     */
    await signInAsAdmin(page);

    await page.goto("/en/admin-panel/users");

    /**
     * TABLO SATIRI SAYILIYOR, METIN ARANMIYOR.
     *
     * Ilk hali `page.getByText(user.email)` idi ve hatayi GERI
     * KOYDUGUNDA DA GECTI -- olculdu. Sebebi: giris yapmis
     * kullanicinin e-postasi sayfanin baska bir yerinde de
     * gorunuyor, yani liste hic yuklenmese bile eslesme buluyordu.
     *
     * Belirli bir kullaniciyi aramak da ise yaramiyor: liste
     * sayfalanmis (ilk 10) ve suit yuzlerce kullanici biriktirmis,
     * yani admin'in ilk sayfada olacaginin garantisi yok. Olculen
     * sey listenin DOLU olmasi; hatali halde sifir satir cikiyor.
     */
    const veriSatirlari = page.locator("table tbody tr");
    await expect.poll(async () => veriSatirlari.count()).toBeGreaterThan(0);
  });
});
