import { Page, expect, test } from "@playwright/test";
import { apiPublicProfile } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

async function customizeAc(page: Page) {
  await page.goto("/en/profile/customize");
  await expect(
    page.getByRole("link", { name: "View public page" })
  ).toBeVisible();
}

test.describe("Theme presets", () => {
  test("at least 5 preset buttons are visible with localized names", async ({
    page,
  }) => {
    await signInAsNewUser(page);
    await customizeAc(page);

    const presetButtons = page.locator("[data-testid^='theme-preset-']");
    await expect(presetButtons).toHaveCount(6);

    // Each preset has a name (not empty)
    for (let i = 0; i < 6; i++) {
      const name = await presetButtons.nth(i).textContent();
      expect(name?.trim()).not.toBe("");
    }
  });

  test("selecting a preset updates form fields and preview", async ({
    page,
  }) => {
    await signInAsNewUser(page);
    await customizeAc(page);

    // Select "ocean" preset (themeColor: #0ea5e9, gradient, #f0f9ff)
    await page.getByTestId("theme-preset-ocean").click();

    // Theme color hex field should update
    const themeHex = page.locator('input[name="themeColorHex"]');
    await expect(themeHex).toHaveValue("#0ea5e9");

    // Background type should be gradient
    await expect(page.getByRole("button", { name: "Gradient" })).toHaveClass(
      /bg-purple-600/
    );

    // Preview should update. A gradient is drawn as a background IMAGE, so
    // backgroundColor stays transparent; the gradient itself is what to check.
    const preview = page.getByTestId("theme-preview");
    await expect
      .poll(() =>
        preview.evaluate((el) => window.getComputedStyle(el).backgroundImage)
      )
      .toContain("linear-gradient");
  });

  test("selected preset is visually marked with aria-pressed", async ({
    page,
  }) => {
    await signInAsNewUser(page);
    await customizeAc(page);

    // Initially no preset selected (default values don't match any preset)
    const ocean = page.getByTestId("theme-preset-ocean");
    await expect(ocean).toHaveAttribute("aria-pressed", "false");

    // Select ocean
    await ocean.click();
    await expect(ocean).toHaveAttribute("aria-pressed", "true");

    // Select forest - ocean should become unselected
    const forest = page.getByTestId("theme-preset-forest");
    await forest.click();
    await expect(ocean).toHaveAttribute("aria-pressed", "false");
    await expect(forest).toHaveAttribute("aria-pressed", "true");
  });

  test("preset selection persists after save and reload", async ({ page }) => {
    const { user } = await signInAsNewUser(page);
    await customizeAc(page);

    // Select sunset preset (themeColor: #f97316, gradient, #fff7ed)
    await page.getByTestId("theme-preset-sunset").click();
    await page.getByTestId("save-appearance").click();

    await expect(
      page.getByText("Your page appearance has been saved.")
    ).toBeVisible();

    // Verify via API
    const profil = await apiPublicProfile(user.username);
    expect(profil.theme_color).toBe("#f97316");
    expect(profil.background_type).toBe("gradient");
    expect(profil.background_value).toBe("#fff7ed");

    // Reload page - preset should be marked as selected
    await page.reload();
    await expect(
      page.getByRole("link", { name: "View public page" })
    ).toBeVisible();
    await expect(page.getByTestId("theme-preset-sunset")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("manual color controls still work after preset selection", async ({
    page,
  }) => {
    await signInAsNewUser(page);
    await customizeAc(page);

    // Select a preset
    await page.getByTestId("theme-preset-berry").click();
    await expect(page.locator('input[name="themeColorHex"]')).toHaveValue(
      "#9333ea"
    );

    // Then manually change the color
    await page.locator('input[name="themeColorHex"]').fill("#ff0000");
    await expect(page.locator('input[name="themeColorHex"]')).toHaveValue(
      "#ff0000"
    );

    // No preset should be selected now
    for (const id of [
      "ocean",
      "forest",
      "sunset",
      "berry",
      "midnight",
      "paper",
    ]) {
      await expect(page.getByTestId(`theme-preset-${id}`)).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    }
  });

  test("preset buttons have minimum touch target height", async ({ page }) => {
    await signInAsNewUser(page);
    await customizeAc(page);

    const ocean = page.getByTestId("theme-preset-ocean");
    const box = await ocean.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
