import { expect, test } from "@playwright/test";
import { apiClickLink, apiCreateLink, apiLinkTimeseries } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

test.describe("Link basina tiklama kirilimi", () => {
  test("her link kendi sayisi ve egrisiyle listeleniyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    const cok = await apiCreateLink(token, {
      title: "Portfolyo",
      url: "https://ornek.test/a",
    });
    const az = await apiCreateLink(token, {
      title: "Blog",
      url: "https://ornek.test/b",
    });
    await apiClickLink(cok.id);
    await apiClickLink(cok.id);
    await apiClickLink(az.id);

    await page.goto("/en/analytics");

    const bolum = page
      .locator("div")
      .filter({ hasText: /^Clicks by link in this range/ })
      .last();
    await expect(bolum).toBeVisible();

    // En cok tiklanan basta.
    const satirlar = bolum.locator("ul > li");
    await expect(satirlar).toHaveCount(2);
    await expect(satirlar.first()).toContainText("Portfolyo");
    await expect(satirlar.first()).toContainText("2");
    await expect(satirlar.last()).toContainText("Blog");

    // Her satirin kendi egrisi var.
    await expect(bolum.locator("svg[role=img]")).toHaveCount(2);
  });

  test("hic tiklanmayan link de listede kaliyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Sessiz",
      url: "https://ornek.test/sessiz",
    });

    await page.goto("/en/analytics");

    const bolum = page
      .locator("div")
      .filter({ hasText: /^Clicks by link in this range/ })
      .last();
    await expect(bolum.locator("ul > li")).toHaveCount(1);
    await expect(bolum.locator("ul > li").first()).toContainText("Sessiz");
  });

  test("gunluk sayilar tabloda fareye dokunmadan okunabiliyor", async ({
    page,
  }) => {
    const { token } = await signInAsNewUser(page);
    const link = await apiCreateLink(token, {
      title: "Olculen",
      url: "https://ornek.test/olcum",
    });
    await apiClickLink(link.id);

    await page.goto("/en/analytics");

    await page.getByTestId("link-table-toggle").click();

    const tablo = page.getByTestId("link-table");
    await expect(tablo.locator("thead th")).toHaveText(["Day", "Olculen"]);
    // Son satir bugun.
    await expect(tablo.locator("tbody tr").last()).toContainText("1");
  });

  test("egrinin uzerine gelince o gunun sayisi cikiyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    const link = await apiCreateLink(token, {
      title: "Ipucu",
      url: "https://ornek.test/ipucu",
    });
    await apiClickLink(link.id);

    await page.goto("/en/analytics");

    const bolum = page
      .locator("div")
      .filter({ hasText: /^Clicks by link in this range/ })
      .last();
    const egri = bolum.locator("svg[role=img]").first();
    await expect(egri).toBeVisible();

    // Fare degil klavye: ayni bilgi iki yoldan da erisilebilir olmali.
    await egri.focus();
    await page.keyboard.press("ArrowLeft");

    await expect(page.getByTestId("sparkline-tooltip")).toBeVisible();
  });

  test("aralik degisince kirilim da yeni araligi gosteriyor", async ({
    page,
  }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Aralik",
      url: "https://ornek.test/aralik",
    });

    await page.goto("/en/analytics");
    await page.getByRole("button", { name: "Last 30 days" }).click();

    await page.getByTestId("link-table-toggle").click();
    await expect(
      page.getByTestId("link-table").locator("tbody tr")
    ).toHaveCount(30);

    expect((await apiLinkTimeseries(token, 30)).links[0].points).toHaveLength(
      30
    );
  });
});
