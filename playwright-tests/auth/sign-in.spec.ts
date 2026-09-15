import { expect, test } from "@playwright/test";
import {
  apiCompleteOnboarding,
  apiLogin,
  apiRegister,
  uniqueUser,
} from "../helpers/api";
import { signInAsNewUser, signInThroughUi } from "../helpers/auth";

test.describe("Giris", () => {
  test("yeni kullanici giris yapinca onboarding sihirbazina gidiyor", async ({
    page,
  }) => {
    const user = await apiRegister(uniqueUser());

    await signInThroughUi(page, user);

    // bkz. src/services/auth/user-routing-utils.ts
    await expect(page).toHaveURL(/\/en\/onboarding\/welcome/);
  });

  test("onboarding'i bitirmis kullanici panoya gidiyor", async ({ page }) => {
    const user = await apiRegister(uniqueUser());
    await apiCompleteOnboarding(await apiLogin(user));

    await signInThroughUi(page, user);

    await expect(page).toHaveURL(/\/en\/dashboard/);
  });

  test("yanlis sifre hata mesaji gosteriyor", async ({ page }) => {
    const user = await apiRegister(uniqueUser());

    await signInThroughUi(page, { ...user, password: "BaskaSifre123" });

    await expect(page.getByText(/incorrect|invalid/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("giris yapmis kullanici giris sayfasinda tutulmuyor", async ({
    page,
  }) => {
    await signInAsNewUser(page);

    await page.goto("/en/sign-in");

    await expect(page).not.toHaveURL(/\/sign-in/);
  });
});
