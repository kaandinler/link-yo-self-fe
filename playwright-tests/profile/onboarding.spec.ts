import { expect, test } from "@playwright/test";
import { signInAsNewUser } from "../helpers/auth";

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

  test("kurulumu atlayan kullanici panoya gidiyor", async ({ page }) => {
    await signInAsNewUser(page, { onboarding: false });

    await page.goto("/en/onboarding/1");
    await page.getByRole("button", { name: "Skip setup" }).click();

    await expect(page).toHaveURL(/\/en\/dashboard/);
  });
});
