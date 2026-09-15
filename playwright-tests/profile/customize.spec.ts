import { Page, expect, test } from "@playwright/test";
import { apiCreateLink, apiPublicProfile } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { fillField } from "../helpers/ui";

/**
 * Sayfayi acar ve profilin yuklenmesini bekler.
 *
 * Form alanlari profil geldiginde bir useEffect ile kayitli degerlere
 * cekiliyor; once yazarsak yazdigimiz deger uzerine yazilir.
 */
async function customizeAc(page: Page) {
  await page.goto("/en/profile/customize");
  await expect(
    page.getByRole("link", { name: "View public page" })
  ).toBeVisible();
}

const TEMA = "#ff0066";
const ARKA_PLAN = "#101020";

test.describe("Gorunum ayarlari", () => {
  test("secilen renkler kaydedilip herkese acik sayfaya yansiyor", async ({
    page,
  }) => {
    const { user, token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Tema linki",
      url: "https://ornek.test/tema",
    });

    await customizeAc(page);
    await fillField(page, 'input[name="themeColorHex"]', TEMA);
    await fillField(page, 'input[name="backgroundColorHex"]', ARKA_PLAN);
    await page.getByTestId("save-appearance").click();

    await expect(
      page.getByText("Your page appearance has been saved.")
    ).toBeVisible();

    // Backend gercekten kaydetmis mi?
    const profil = await apiPublicProfile(user.username);
    expect(profil.theme_color).toBe(TEMA);
    expect(profil.background_type).toBe("color");
    expect(profil.background_value).toBe(ARKA_PLAN);

    // Ayni degerler herkese acik sayfada uygulaniyor mu?
    await page.goto(`/en/${user.username}`);
    const link = page.getByRole("link", { name: "Tema linki" });
    await expect(link).toHaveCSS("background-color", "rgb(255, 0, 102)");
  });

  test("gradient secildiginde arka plan tipi de kaydediliyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);

    await customizeAc(page);
    await fillField(page, 'input[name="themeColorHex"]', TEMA);
    await page.getByRole("button", { name: "Gradient" }).click();
    await page.getByTestId("save-appearance").click();

    await expect(
      page.getByText("Your page appearance has been saved.")
    ).toBeVisible();

    const profil = await apiPublicProfile(user.username);
    expect(profil.background_type).toBe("gradient");
  });

  test("gecersiz hex kodu kaydedilmiyor", async ({ page }) => {
    await signInAsNewUser(page);

    await customizeAc(page);
    await fillField(page, 'input[name="themeColorHex"]', "mor");
    await page.getByTestId("save-appearance").click();

    await expect(
      page.getByText(/hex code like #1383eb|hex code like/i)
    ).toBeVisible();
    await expect(
      page.getByText("Your page appearance has been saved.")
    ).toHaveCount(0);
  });

  test("onizleme yazarken guncelleniyor", async ({ page }) => {
    await signInAsNewUser(page);

    await customizeAc(page);
    await fillField(page, 'input[name="backgroundColorHex"]', ARKA_PLAN);

    await expect(page.getByTestId("theme-preview")).toHaveCSS(
      "background-color",
      "rgb(16, 16, 32)"
    );
  });
});
