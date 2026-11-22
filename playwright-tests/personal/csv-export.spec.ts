import { expect, test } from "@playwright/test";
import { mockApi, mockSignedInUser } from "../helpers/mock-session";

// Analitik CSV dışa aktarimi kabul testi. Backend yok; oturum ve API
// yanitlari taklit ediliyor. İndirme olayı yakalanıp dosya adı ve içerik
// başlığı doğrulanıyor.

const ARALIK = { days: 7, start_date: "2026-01-01", end_date: "2026-01-07" };

const LINK = {
  id: 1,
  title: "Portfolyo",
  url: "https://ornek.test/a",
  is_active: true,
};

function mockAll(page: any) {
  return (async () => {
    await mockSignedInUser(page);
    await mockApi(page, "/v1/analytics/summary", {
      username: "testkullanici",
      profile_url_path: "/testkullanici",
      total_links: 1,
      active_links: 1,
      total_clicks: 3,
      profile_view_count: 5,
      links: [{ ...LINK, click_count: 3 }],
    });
    await mockApi(page, "/v1/analytics/timeseries", {
      ...ARALIK,
      total_clicks: 3,
      total_profile_views: 5,
      points: [
        { date: "2026-01-06", clicks: 1, profile_views: 2 },
        { date: "2026-01-07", clicks: 2, profile_views: 3 },
      ],
    });
    await mockApi(page, "/v1/analytics/timeseries/by-link", {
      ...ARALIK,
      links: [
        {
          ...LINK,
          total_clicks: 3,
          points: [
            { date: "2026-01-06", clicks: 1 },
            { date: "2026-01-07", clicks: 2 },
          ],
        },
      ],
    });
    await mockApi(page, "/v1/analytics/referrers", {
      ...ARALIK,
      total_clicks: 3,
      sources: [{ kind: "direct", host: null, clicks: 3 }],
    });
    await mockApi(page, "/v1/analytics/best-times", {
      ...ARALIK,
      timezone: "UTC",
      total_clicks: 3,
      by_weekday: Array.from({ length: 7 }, (_, weekday) => ({
        weekday,
        clicks: weekday === 2 ? 3 : 0,
      })),
      by_hour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        clicks: hour === 14 ? 3 : 0,
      })),
      peak_weekday: 2,
      peak_hour: 14,
      enough_data: false,
    });
  })();
}

test.beforeEach(async ({ page }) => {
  await mockAll(page);
});

test("CSV indir butonu görünür, etkin ve indirmeyi tetikler", async ({
  page,
}) => {
  await page.goto("/tr/analytics");

  const buton = page.getByTestId("export-csv");
  await expect(buton).toBeVisible();
  await expect(buton).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    buton.click(),
  ]);

  expect(download.suggestedFilename()).toMatch(
    /^analytics-2026-01-01_2026-01-07\.csv$/
  );

  const tmp = await download.path();
  const fs = await import("fs");
  const buf = fs.readFileSync(tmp);
  // UTF-8 BOM
  expect(buf.subarray(0, 3).toString("hex")).toBe("efbbbf");
  const metin = buf.toString("utf-8");
  expect(metin).toContain("Tarih");
  expect(metin).toContain("Tıklama");
  expect(metin).toContain("Görüntülenme");
  expect(metin).toContain("2026-01-06");
  expect(metin).toContain("2026-01-07");
  expect(metin).toContain("Başlık");
  expect(metin).toContain("Portfolyo");
  expect(metin).toContain("https://ornek.test/a");
});

test("yükleme sırasında buton devre dışı", async ({ page }) => {
  await page.route("**/v1/analytics/timeseries**", async (route) => {
    await new Promise((r) => setTimeout(r, 500));
    await route.fulfill({
      status: 200,
      json: {
        data: {
          ...ARALIK,
          total_clicks: 3,
          total_profile_views: 5,
          points: [{ date: "2026-01-07", clicks: 3, profile_views: 5 }],
        },
        message: "ok",
        status: "success",
      },
    });
  });
  await page.goto("/tr/analytics");
  const buton = page.getByTestId("export-csv");
  await expect(buton).toBeDisabled();
  await expect(buton).toBeEnabled({ timeout: 10000 });
});

test("formül enjeksiyonuna karşı hücreler etkisizleştirilir", async ({
  page,
}) => {
  await page.route("**/v1/analytics/timeseries/by-link**", async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        data: {
          ...ARALIK,
          links: [
            {
              id: 9,
              title: '=HYPERLINK("http://evil")',
              url: "https://ornek.test/evil",
              is_active: true,
              total_clicks: 1,
              points: [{ date: "2026-01-07", clicks: 1 }],
            },
          ],
        },
        message: "ok",
        status: "success",
      },
    });
  });
  await page.goto("/tr/analytics");
  const buton = page.getByTestId("export-csv");
  await expect(buton).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    buton.click(),
  ]);
  const tmp = await download.path();
  const fs = await import("fs");
  const metin = fs.readFileSync(tmp, "utf-8");
  expect(metin).toContain("'=HYPERLINK");
});

test("mobil genişlikte buton taşma yapmaz ve dokunma hedefi >=44px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tr/analytics");
  const buton = page.getByTestId("export-csv");
  await expect(buton).toBeEnabled();
  const box = await buton.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  expect(overflow).toBe(false);
});

test("aralık değiştirilince CSV yeni aralığı yansıtır", async ({ page }) => {
  await page.goto("/tr/analytics");
  const buton = page.getByTestId("export-csv");
  await expect(buton).toBeEnabled();

  await page.getByTestId("range-custom").click();
  await page.getByTestId("range-start").fill("2026-01-02");
  await page.getByTestId("range-end").fill("2026-01-05");

  await expect(buton).toBeEnabled({ timeout: 10000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    buton.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^analytics-2026-01-02_2026-01-05\.csv$/
  );
});
