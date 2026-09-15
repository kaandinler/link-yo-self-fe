import { expect, test } from "@playwright/test";
import { apiLoginStatus } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { fillField } from "../helpers/ui";

test.describe("Hesap kapatma", () => {
  test("kullanici kendi hesabini kapatabiliyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/settings");
    await fillField(page, "#delete-account-password", user.password);
    await page.getByRole("button", { name: "Close my account" }).click();
    await page.getByRole("button", { name: "Close account" }).click();

    // Cikis yapilip giris ekranina donuluyor.
    await expect(page).toHaveURL(/\/sign-in|\/en$|\/en\/$/);

    // Hesap gercekten kapandi: giris yapilamiyor, profil sayfasi 404.
    expect(await apiLoginStatus(user)).not.toBe(200);
    const profil = await page.goto(`/en/${user.username}`);
    expect(profil?.status()).toBe(404);
  });

  test("yanlis sifreyle hesap kapanmiyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/settings");
    await fillField(page, "#delete-account-password", "BaskaSifre123");
    await page.getByRole("button", { name: "Close my account" }).click();
    await page.getByRole("button", { name: "Close account" }).click();

    await expect(
      page.getByText(/could not be closed|incorrect|invalid/i)
    ).toBeVisible();
    expect(await apiLoginStatus(user)).toBe(200);
  });

  test("sifre girilmeden onay diyalogu acilmiyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/settings");
    await page.getByRole("button", { name: "Close my account" }).click();

    await expect(
      page.getByText("Enter your password to confirm.")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close account" })
    ).toHaveCount(0);
  });

  test("giris yapmamis ziyaretci ayarlara giremiyor", async ({ page }) => {
    await page.goto("/en/settings");

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
