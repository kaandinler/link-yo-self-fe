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

    await expect(
      page.getByRole("heading", { name: /Connect with your/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Get Started for Free/ })
    ).toBeVisible();
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
