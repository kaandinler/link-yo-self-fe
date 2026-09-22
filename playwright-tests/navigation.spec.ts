import { expect, test } from "@playwright/test";
import { apiCompleteOnboarding } from "./helpers/api";
import { signInAsNewUser } from "./helpers/auth";

test.describe("Yonlendirme", () => {
  test("dilsiz adres dil onekine yonlendiriliyor", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/(en|tr)$/);
  });

  test("giris yapmamis ziyaretci tanitim sayfasini goruyor", async ({
    page,
  }) => {
    await page.goto("/en");

    /*
     * METNE DEGIL, YAPIYA BAKILIYOR. Onceki hali "Connect with your"
     * ve "Get Started for Free" dizgelerini ariyordu; tanitim
     * metni i18n'e tasinip yeniden yazilinca test kirildi -- oysa
     * olcmek istedigi sey degismemisti: giris yapmamis ziyaretci
     * yonlendirilmiyor, tanitim sayfasini goruyor.
     *
     * Bu uc kosul pazarlama metninden bagimsiz: sayfanin kendi
     * basligi, kayit cagrisi ve ozellik listesi. Metin yeniden
     * yazildiginda test yine gecer; sayfa yonlendirmeye baslarsa
     * ya da bos donerse dusier.
     */
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href="/sign-up"]').first()).toBeVisible();
    await expect(page.getByTestId("landing-features")).toBeVisible();
  });

  test("onboarding'i bitirmemis kullanici sihirbaza yonlendiriliyor", async ({
    page,
  }) => {
    await signInAsNewUser(page, { onboarding: false });

    await page.goto("/en");

    await expect(page).toHaveURL(/\/en\/onboarding\/welcome/);
  });

  test("onboarding'i bitirmis kullanici panoya yonlendiriliyor", async ({
    page,
  }) => {
    const { token } = await signInAsNewUser(page, { onboarding: false });
    await apiCompleteOnboarding(token);

    await page.goto("/en");

    await expect(page).toHaveURL(/\/en\/dashboard/);
  });
});
