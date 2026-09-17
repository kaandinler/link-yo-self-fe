import { expect, test } from "@playwright/test";
import { signInAsNewUser } from "./helpers/auth";

/** "rgb(18, 18, 18)" -> parlaklik (0-255). */
function parlaklik(renk: string): number {
  const [r, g, b] = (renk.match(/\d+/g) ?? ["255", "255", "255"]).map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

test.describe("Tema", () => {
  test("MUI koyu temada aciliyor", async ({ page }) => {
    await page.goto("/en/forgot-password");

    // colorSchemeSelector: "class" -> MUI semayi <html>'in class'ina yaziyor.
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("MUI ile yazilmis sayfalarin zemini koyu", async ({ page }) => {
    // Bu sayfalar kendi arka planini cizmiyor, CssBaseline'inkini kullaniyor.
    // Varsayilan "system" modda acik kalip bembeyaz aciliyorlardi.
    await signInAsNewUser(page);
    await page.goto("/en/profile/edit");
    // getByText degil: "Edit Profile" ayni zamanda sayfanin <title>'i ve o
    // gorunmez bir dugum. Basligi rolunden yakalamak tek bir gorunur
    // elemani hedefliyor.
    await expect(
      page.getByRole("heading", { name: "Edit Profile" })
    ).toBeVisible();

    const zemin = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(parlaklik(zemin)).toBeLessThan(60);
  });

  test("Tailwind sayfalari kendi koyu zeminini korumaya devam ediyor", async ({
    page,
  }) => {
    await signInAsNewUser(page);
    await page.goto("/en/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    const zemin = await page
      .locator("body > div")
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    // Gradient'te backgroundColor saydam kalabiliyor; onemli olan beyaz
    // olmamasi.
    expect(zemin).not.toBe("rgb(255, 255, 255)");
  });
});
