import { expect, test } from "@playwright/test";
import { apiPublicProfile } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { fillField } from "../helpers/ui";

test.describe("Profil alanlari sonradan duzenlenebiliyor", () => {
  test("gorunen ad, bio ve profil gorseli kaydediliyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="firstName"]', "Deniz");
    await fillField(page, 'input[name="lastName"]', "Yilmaz");
    await fillField(page, 'input[name="displayName"]', "Deniz | Tasarim");
    await fillField(page, 'textarea[name="bio"]', "Urun tasarimcisi.");
    await fillField(
      page,
      'input[name="profileImageUrl"]',
      "https://ornek.test/avatar.png"
    );
    await page.getByTestId("save-profile").click();

    await expect(
      page.getByText("Profile has been updated successfully")
    ).toBeVisible();

    const profil = await apiPublicProfile(user.username);
    expect(profil.display_name).toBe("Deniz | Tasarim");
    expect(profil.bio).toBe("Urun tasarimcisi.");
    expect(profil.profile_image_url).toBe("https://ornek.test/avatar.png");
  });

  test("sayfa basligi, aciklamasi ve web sitesi kaydediliyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="pageTitle"]', "Deniz'in sayfasi");
    await fillField(
      page,
      'textarea[name="pageDescription"]',
      "Butun baglantilarim tek yerde."
    );
    // Sema bilerek yok: backend https:// eklemeli.
    await fillField(page, 'input[name="website"]', "ornek.test");
    await page.getByTestId("save-page").click();

    await expect(
      page.getByText("Your page details have been updated")
    ).toBeVisible();

    const profil = await apiPublicProfile(user.username);
    expect(profil.page_title).toBe("Deniz'in sayfasi");
    expect(profil.page_description).toBe("Butun baglantilarim tek yerde.");
    expect(profil.website).toBe("https://ornek.test");
    // Normalize edilen deger forma da geri yaziliyor.
    await expect(page.locator('input[name="website"]')).toHaveValue(
      "https://ornek.test"
    );
  });

  test("sosyal medya adlari kaydediliyor ve bastaki @ kirpiliyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="twitterUsername"]', "@deniz");
    await fillField(page, 'input[name="instagramUsername"]', "deniz.tasarim");
    await fillField(page, 'input[name="linkedinUsername"]', "deniz-yilmaz");
    await page.getByTestId("save-social").click();

    await expect(
      page.getByText("Your social links have been updated")
    ).toBeVisible();

    const profil = await apiPublicProfile(user.username);
    expect(profil.twitter_username).toBe("deniz");
    expect(profil.instagram_username).toBe("deniz.tasarim");
    expect(profil.linkedin_username).toBe("deniz-yilmaz");

    await expect(page.locator('input[name="twitterUsername"]')).toHaveValue(
      "deniz"
    );
  });

  test("kaydedilen degerler sayfa yeniden acildiginda formda duruyor", async ({
    page,
  }) => {
    await signInAsNewUser(page);

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="twitterUsername"]', "ilkdeger");
    await page.getByTestId("save-social").click();
    await expect(
      page.getByText("Your social links have been updated")
    ).toBeVisible();

    // Sihirbaz bir kez calisiyor; duzeltmenin kalici oldugunu dogruluyoruz.
    await page.goto("/en/profile/edit");
    await expect(page.locator('input[name="twitterUsername"]')).toHaveValue(
      "ilkdeger"
    );

    await fillField(page, 'input[name="twitterUsername"]', "duzeltilmis");
    await page.getByTestId("save-social").click();
    await expect(
      page.getByText("Your social links have been updated")
    ).toBeVisible();

    await page.goto("/en/profile/edit");
    await expect(page.locator('input[name="twitterUsername"]')).toHaveValue(
      "duzeltilmis"
    );
  });

  test("gecersiz profil gorseli adresi istek gonderilmeden reddediliyor", async ({
    page,
  }) => {
    await signInAsNewUser(page);

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="firstName"]', "Deniz");
    await fillField(page, 'input[name="lastName"]', "Yilmaz");
    await fillField(page, 'input[name="profileImageUrl"]', "avatar.png");
    await page.getByTestId("save-profile").click();

    await expect(
      page.getByText("Must start with http:// or https://")
    ).toBeVisible();
    await expect(
      page.getByText("Profile has been updated successfully")
    ).toHaveCount(0);
  });

  test("sosyal baglantilar herkese acik sayfada gorunuyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/profile/edit");
    await fillField(page, 'input[name="twitterUsername"]', "denizt");
    await page.getByTestId("save-social").click();
    await expect(
      page.getByText("Your social links have been updated")
    ).toBeVisible();

    await page.goto(`/en/${user.username}`);
    await expect(
      page.locator('a[href="https://twitter.com/denizt"]')
    ).toBeVisible();
  });
});
