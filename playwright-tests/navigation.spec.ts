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
     * ya da bos donerse duser.
     *
     * BASLIK NEDEN ROL DEGIL TESTID ILE: ilk halinde
     * getByRole("heading", { level: 1 }) yaziliyordu ve CI'da
     * "strict mode violation ... resolved to 2 elements" ile dustu.
     * Sayfada gercekten iki <h1> var: buradaki tanitim basligi ve
     * app-bar'daki "LinkYoSelf" logosu. App-bar istemcide
     * ciziliyor, yani ikinci h1 sonradan geliyor -- sorgu ondan
     * once kosarsa tek oge buluyor ve geciyor, sonra kosarsa iki
     * oge bulup duser. Yani zamanlamaya bagli bir testti; sabit
     * bir kanca bu belirsizligi kaldiriyor.
     */
    await expect(page.getByTestId("landing-hero")).toBeVisible();
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
