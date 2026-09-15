import { expect, test } from "@playwright/test";
import { apiRegister, uniqueUser } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { waitForMailToken } from "../helpers/mail";

test.describe("E-posta dogrulama", () => {
  test("kayit sonrasi gelen baglanti adresi dogruluyor", async ({ page }) => {
    const user = await apiRegister(uniqueUser());
    const token = await waitForMailToken(user.email, "confirm-email");

    await page.goto(`/en/confirm-email?token=${token}`);

    await expect(page.getByText("Email confirmed")).toBeVisible();
  });

  test("gecersiz token hata gosteriyor", async ({ page }) => {
    await page.goto("/en/confirm-email?token=boyle-bir-token-yok");

    await expect(page.getByText("Could not confirm your email")).toBeVisible();
  });

  test("token'siz baglanti hata gosteriyor", async ({ page }) => {
    await page.goto("/en/confirm-email");

    await expect(page.getByText("Could not confirm your email")).toBeVisible();
    await expect(
      page.getByText("This link is missing its confirmation token.")
    ).toBeVisible();
  });

  test("ayarlar sayfasi dogrulanmamis adresi uyariyor, dogrulama sonrasi uyari kalkiyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/settings");
    await expect(page.getByText("Your email is not confirmed")).toBeVisible();

    const token = await waitForMailToken(user.email, "confirm-email");
    await page.goto(`/en/confirm-email?token=${token}`);
    await expect(page.getByText("Email confirmed")).toBeVisible();

    await page.goto("/en/settings");
    await expect(page.getByText("Your email is not confirmed")).toHaveCount(0);
    await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  });
});
