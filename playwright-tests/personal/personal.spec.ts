import { test, expect } from "@playwright/test";
import { clickWhenReady, waitForHydration } from "../helpers/ui";

// Frontend-only acceptance. The existing real-backend e2e suites are preserved separately.
// Dil burada sabitleniyor: bu dosya hem kabul kapisinda (playwright.personal.config.ts) hem de tam
// e2e kosusunda (playwright.config.ts, dil ayari yok) calisiyor ve "/" yonlendirmesi tarayici diline bagli.
test.use({ locale: "tr-TR" });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      status: 401,
      json: { detail: "Not authenticated (synthetic test)" },
    })
  );
});

test("guest landing and locale redirect render on the actual app", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/tr$/);
  await expect(page.getByTestId("landing-hero")).toBeVisible();
  await expect(page.getByTestId("landing-features")).toBeVisible();
  await expect(
    page.locator('a[href="/tr/sign-up"]:visible').first()
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1
    )
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("landing.png"),
    fullPage: true,
  });
});

test("invalid sign-in is stopped before a server submission", async ({
  page,
}, info) => {
  let submissions = 0;
  await page.route("**/api/auth/session", (route) => {
    submissions++;
    return route.fulfill({
      status: 401,
      json: { detail: "Synthetic rejection" },
    });
  });
  await page.goto("/tr/sign-in");
  await expect(
    page.getByRole("heading", { name: "Tekrar Hoş Geldiniz", exact: true })
  ).toBeVisible();
  await clickWhenReady(page, '[data-testid="sign-in-submit"]');
  await expect(
    page.getByText("Lütfen geçerli bir e-posta adresi girin", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Şifre en az 6 karakter olmalı", { exact: true })
  ).toBeVisible();
  expect(submissions).toBe(0);
  await page.screenshot({
    path: info.outputPath("validation.png"),
    fullPage: true,
  });
});

test("guest theme choice survives a reload", async ({ page }) => {
  await page.goto("/en/forgot-password");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await waitForHydration(page, "header");
  const menu = page.getByRole("button", { name: /^(Menu|Menü)$/ });
  if (await menu.isVisible()) await menu.click();
  await page.locator('[data-testid="theme-switch"]:visible').first().click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);
});
