import { expect, test } from "@playwright/test";
import { apiCreateLink } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { fillField } from "../helpers/ui";

test.describe("Onboarding sihirbazi", () => {
  test("son adim tamamlaninca link ekleme formu aciliyor", async ({ page }) => {
    // Sihirbazi gorebilmesi icin onboarding tamamlanmamis olmali.
    await signInAsNewUser(page, { onboarding: false });

    await page.goto("/en/onboarding/4");
    await expect(
      page.getByRole("heading", { name: "Customize appearance" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Finish setup" }).click();

    // Eskiden buradan "coming soon" yazan /links/add sayfasina gidiliyordu:
    // kurulumu bitiren herkes cikmaz sokakla karsilasiyordu.
    await expect(page).toHaveURL(/\/en\/links/);
    await expect(
      page.getByRole("heading", { name: "Add New Link" })
    ).toBeVisible();
  });

  test("sihirbazda kaydedilen ad herkese acik sayfaya hemen yansiyor", async ({
    page,
  }) => {
    /**
     * Sayfa bir dakikalik pencereyle onbellege aliniyor ve temizlik
     * vekilde (/api/proxy) yapiliyor; sihirbaz da oradan gectigi icin
     * calismasi gerekiyordu. "Gerekiyordu" yeterli degil: olculdu ve
     * calisiyor, bu test onu tutuyor.
     *
     * Sira onemli: once ziyaret (onbellek dolsun), sonra kaydet. Tersi
     * olursa ilk ziyaret zaten yeni degeri onbellege koyar ve test
     * hicbir sey olcmez.
     */
    const { user, token } = await signInAsNewUser(page, { onboarding: false });
    await apiCreateLink(token, {
      title: "Blog",
      url: "https://ornek.test/blog",
    });

    await page.goto(`/en/${user.username}`);
    await expect(
      page.getByRole("heading", { name: user.username })
    ).toBeVisible();

    await page.goto("/en/onboarding/1");
    await fillField(page, "#onboarding-display_name", "Sihirbaz Adi");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/onboarding\/2/);

    await page.goto(`/en/${user.username}`);
    await expect(
      page.getByRole("heading", { name: "Sihirbaz Adi" })
    ).toBeVisible();
  });

  test("kurulumu atlayan kullanici panoya gidiyor", async ({ page }) => {
    await signInAsNewUser(page, { onboarding: false });

    await page.goto("/en/onboarding/1");
    await page.getByRole("button", { name: "Skip setup" }).click();

    await expect(page).toHaveURL(/\/en\/dashboard/);
  });
});
