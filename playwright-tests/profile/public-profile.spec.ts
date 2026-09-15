import { expect, test } from "@playwright/test";
import {
  apiAnalyticsSummary,
  apiCreateLink,
  apiRegisterAndLogin,
  apiUpdateProfile,
} from "../helpers/api";

test.describe("Herkese acik profil", () => {
  test("profil adi, bio ve linkler goruntuleniyor", async ({ page }) => {
    const { user, token } = await apiRegisterAndLogin();
    await apiUpdateProfile(token, {
      display_name: "Gorunen Ad",
      bio: "Kisa tanitim yazisi",
    });
    await apiCreateLink(token, {
      title: "Kisisel site",
      url: "https://ornek.test/site",
    });
    await apiCreateLink(token, {
      title: "Blog",
      url: "https://ornek.test/blog",
    });

    await page.goto(`/en/${user.username}`);

    await expect(
      page.getByRole("heading", { name: "Gorunen Ad" })
    ).toBeVisible();
    await expect(page.getByText("Kisa tanitim yazisi")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Kisisel site" })
    ).toHaveAttribute("href", "https://ornek.test/site");
    await expect(page.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "href",
      "https://ornek.test/blog"
    );
  });

  test("display_name yoksa kullanici adi gosteriliyor", async ({ page }) => {
    const { user } = await apiRegisterAndLogin();

    await page.goto(`/en/${user.username}`);

    await expect(
      page.getByRole("heading", { name: user.username })
    ).toBeVisible();
  });

  test("olmayan kullanici 404 veriyor", async ({ page }) => {
    const response = await page.goto("/en/boyle-bir-kullanici-yok-12345");

    expect(response?.status()).toBe(404);
  });

  test("ziyaretler profil goruntulenme sayacini artiriyor", async ({
    page,
  }) => {
    const { user, token } = await apiRegisterAndLogin();

    const oncesi = await apiAnalyticsSummary(token);
    await page.goto(`/en/${user.username}`);
    await expect(
      page.getByRole("heading", { name: user.username })
    ).toBeVisible();

    await expect
      .poll(async () => (await apiAnalyticsSummary(token)).profile_view_count)
      .toBeGreaterThan(oncesi.profile_view_count);
  });
});
