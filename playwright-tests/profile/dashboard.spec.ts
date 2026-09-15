import { expect, test } from "@playwright/test";
import { apiCreateLink, apiUpdateProfile } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

test.describe("Pano ve analytics", () => {
  test("pano kullaniciyi adiyla karsilayip profil adresini gosteriyor", async ({
    page,
  }) => {
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, { display_name: "Pano Kullanicisi" });

    await page.goto("/en/dashboard");

    await expect(
      page.getByRole("heading", { name: /Welcome back, Pano Kullanicisi/ })
    ).toBeVisible();
    await expect(page.getByText(`/${user.username}`).first()).toBeVisible();
  });

  test("linki olmayan kullanici bos durumu goruyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/dashboard");

    await expect(
      page.getByText("You haven't added any links yet.")
    ).toBeVisible();
  });

  test("eklenen linkler panoda listeleniyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Panodaki link",
      url: "https://ornek.test/pano",
    });

    await page.goto("/en/dashboard");

    await expect(page.getByText("Panodaki link")).toBeVisible();
    await expect(page.getByText("https://ornek.test/pano")).toBeVisible();
  });

  test("analytics sayfasi ozet sayilari gosteriyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Olculen link",
      url: "https://ornek.test/olcum",
    });

    await page.goto("/en/analytics");

    await expect(
      page.getByRole("heading", { name: "Analytics" })
    ).toBeVisible();
    await expect(page.getByText("Total Clicks")).toBeVisible();
    // Link hem aralik kiriliminda hem "tum zamanlar" listesinde geciyor.
    await expect(page.getByText("Olculen link").first()).toBeVisible();
  });

  test("giris yapmamis ziyaretci panoya giremiyor", async ({ page }) => {
    await page.goto("/en/dashboard");

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
