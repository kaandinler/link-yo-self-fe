import { expect, test } from "@playwright/test";
import { apiLoginStatus, apiPublicProfile } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { mailLogOffset, waitForMailToken } from "../helpers/mail";
import { fillField } from "../helpers/ui";

const YENI_SIFRE = "GuncelSifre123";

test.describe("Profil duzenleme", () => {
  test("ad soyad kaydedilip herkese acik sayfaya yansiyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="firstName"]', "Deniz");
    await fillField(page, 'input[name="lastName"]', "Yilmaz");
    await page.getByTestId("save-profile").click();

    await expect(
      page.getByText("Profile has been updated successfully")
    ).toBeVisible();

    // display_name bos oldugunda backend ad soyadi kullaniyor.
    const profil = await apiPublicProfile(user.username);
    expect(profil.display_name).toBe("Deniz Yilmaz");
  });

  test("sifre degistirildikten sonra yeni sifre gecerli", async ({ page }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="oldPassword"]', user.password);
    await fillField(page, 'input[name="password"]', YENI_SIFRE);
    await fillField(page, 'input[name="passwordConfirmation"]', YENI_SIFRE);
    await page.getByTestId("save-password").click();

    await expect(
      page.getByText("Password has been updated successfully")
    ).toBeVisible();

    expect(await apiLoginStatus({ ...user, password: YENI_SIFRE })).toBe(200);
    expect(await apiLoginStatus(user)).not.toBe(200);
  });

  test("yanlis eski sifre reddediliyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="oldPassword"]', "BaskaSifre123");
    await fillField(page, 'input[name="password"]', YENI_SIFRE);
    await fillField(page, 'input[name="passwordConfirmation"]', YENI_SIFRE);
    await page.getByTestId("save-password").click();

    await expect(
      page.getByText("Password has been updated successfully")
    ).toHaveCount(0);
    expect(await apiLoginStatus(user)).toBe(200);
  });

  test("e-posta degisikligi once dogrulama baglantisi gonderiyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);
    const yeniAdres = `yeni-${user.email}`;
    const offset = await mailLogOffset();

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="email"]', yeniAdres);
    await fillField(page, 'input[name="emailConfirmation"]', yeniAdres);
    await fillField(page, 'input[name="currentPassword"]', user.password);
    await page.getByTestId("save-email").click();

    await expect(page.getByText(new RegExp(yeniAdres))).toBeVisible();

    // Adres ancak baglantiya tiklanınca degisiyor: eski adresle giris hala calisiyor.
    expect(await apiLoginStatus(user)).toBe(200);

    const token = await waitForMailToken(yeniAdres, "confirm-email", {
      sonra: offset,
    });
    await page.goto(`/en/confirm-email?token=${token}`);
    await expect(page.getByText("Email confirmed")).toBeVisible();

    expect(await apiLoginStatus({ ...user, email: yeniAdres })).toBe(200);
  });
});
