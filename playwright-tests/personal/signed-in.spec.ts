import { expect, test } from "@playwright/test";
import { mockApi, mockSignedInUser } from "../helpers/mock-session";

// Giris gerektiren bir sayfanin backend olmadan nasil test edildiginin
// ornegi. Yeni bir kabul testi yazarken bu kalibi kopyala: once oturum,
// sonra sayfanin okudugu her uc, en son page.goto.

const ARALIK = { days: 7, start_date: "2026-01-01", end_date: "2026-01-07" };

const LINK = {
  id: 1,
  title: "Portfolyo",
  url: "https://ornek.test/a",
  is_active: true,
};

test.beforeEach(async ({ page }) => {
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
    points: [{ date: "2026-01-07", clicks: 3, profile_views: 5 }],
  });
  await mockApi(page, "/v1/analytics/timeseries/by-link", {
    ...ARALIK,
    links: [
      {
        ...LINK,
        total_clicks: 3,
        points: [{ date: "2026-01-07", clicks: 3 }],
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
});

test("signed-in user sees the analytics page with mocked data", async ({
  page,
}) => {
  await page.goto("/tr/analytics");

  // Oturum taklidi calismasaydi sayfa /tr/sign-in'e yonlenirdi.
  await expect(page).toHaveURL(/\/tr\/analytics$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Portfolyo").first()).toBeVisible();
  await expect(page.getByTestId("range-custom")).toBeVisible();
});
