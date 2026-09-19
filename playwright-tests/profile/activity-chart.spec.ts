import { expect, test } from "@playwright/test";
import {
  apiClickLink,
  apiCreateLink,
  apiPublicProfile,
  apiTimeseries,
} from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

test.describe("Zaman serisi grafigi", () => {
  test("gunluk tiklama ve goruntulenmeler grafikte ve tabloda gorunuyor", async ({
    page,
  }) => {
    const { user, token } = await signInAsNewUser(page);
    const link = await apiCreateLink(token, {
      title: "Olculen",
      url: "https://ornek.test/olcum",
    });
    await apiClickLink(link.id);
    await apiClickLink(link.id);
    await apiPublicProfile(user.username);

    await page.goto("/en/analytics");

    await expect(
      page.getByRole("heading", { name: "Over time" })
    ).toBeVisible();
    // Gosterge her zaman duruyor: kimlik yalnizca renge birakilmiyor.
    await expect(page.getByText("Link clicks").first()).toBeVisible();
    await expect(page.getByText("Profile views").first()).toBeVisible();
    await expect(page.getByText(/2\s*clicks/)).toBeVisible();

    // Ayni degerler hover'a gerek kalmadan tablodan da okunabilmeli.
    // Sayfada link kiriliminin de tablosu var; bu ana grafigin tablosu.
    await page.getByTestId("activity-table-toggle").click();
    const bugun = page.getByTestId("activity-table").locator("tbody tr").last();
    await expect(bugun).toContainText("2");
  });

  test("aralik degistirilince yeni veri cekiliyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);

    await page.goto("/en/analytics");
    await expect(
      page.getByLabel(/Daily link clicks and profile views/)
    ).toBeVisible();

    await page.getByRole("button", { name: "Last 30 days" }).click();

    await expect(
      page.getByRole("button", { name: "Last 30 days" })
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("activity-table-toggle").click();
    await expect(
      page.getByTestId("activity-table").locator("tbody tr")
    ).toHaveCount(30);

    // Backend de ayni araligi doner.
    expect((await apiTimeseries(token, 30)).points).toHaveLength(30);
  });

  test("hareketsiz aralikta aciklayici mesaj cikiyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/analytics");

    // Bos grafik "hic olmadi" demiyor; gunluk kaydin ne zaman basladigini soyluyor.
    await expect(
      page.getByText(/No activity recorded in this range/)
    ).toBeVisible();
  });

  test("grafik klavyeyle de okunabiliyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    const link = await apiCreateLink(token, {
      title: "Klavye",
      url: "https://ornek.test/klavye",
    });
    await apiClickLink(link.id);

    await page.goto("/en/analytics");
    // Link kirilimindaki kucuk egriler de svg[role=img]; ana grafik bu.
    const grafik = page.getByLabel(/Daily link clicks and profile views/);
    await expect(grafik).toBeVisible();

    // Fare hic kullanilmiyor.
    await grafik.focus();
    await page.keyboard.press("ArrowLeft");

    // Fareyle ayni bilgi: secili gunun degerleri okunuyor.
    const ipucu = page.getByTestId("activity-tooltip");
    await expect(ipucu).toBeVisible();
    await expect(ipucu).toContainText("Link clicks");

    await page.keyboard.press("Escape");
    await expect(ipucu).toHaveCount(0);
  });
});
