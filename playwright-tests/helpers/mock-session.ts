import { Page, test } from "@playwright/test";

/**
 * Backend OLMADAN giris yapmis kullanici.
 *
 * NEDEN GEREKLI: kabul ortaminda (playwright.personal.config.ts) yalnizca
 * Next.js uygulamasi ayakta; backend yok. helpers/api.ts ve helpers/auth.ts
 * gercek backend'e gidiyor ve orada ECONNREFUSED ile kaliyor. Giris
 * gerektiren bir sayfayi (pano, analitik, linkler ...) burada test etmenin
 * tek yolu oturumu ve API yanitlarini tarayicida taklit etmek.
 *
 * NASIL CALISIYOR: arayuz "oturum var mi" sorusunu iki seyden ogreniyor
 * (bkz. services/auth/auth-provider.tsx):
 *   1) ly_auth=1 isaret cerezi (yoksa /users/me hic cagrilmiyor),
 *   2) /api/proxy/v1/users/me yaniti.
 * Ikisini de burada veriyoruz. Token cerezi (ly_session) gerekmiyor:
 * onu yalnizca vekil okuyor ve vekile giden istekler tarayicidan
 * cikmadan yakalaniyor.
 *
 * KULLANIM:
 *   test("...", async ({ page }) => {
 *     await mockSignedInUser(page);
 *     await mockApi(page, "/v1/analytics/summary", { total_links: 1, ... });
 *     await page.goto("/tr/analytics");
 *   });
 *
 * SINIR: yalnizca TARAYICIDAN cikan istekler taklit edilebilir. Next
 * sunucusunun kendi yaptigi istekler (herkese acik profil sayfasi gibi)
 * burada yakalanamaz.
 */

/** Taklit edilen kullanici; backend'in UserRead modeliyle ayni alanlar. */
export const MOCK_USER = {
  id: 1,
  email: "test@example.com",
  first_name: "Test",
  last_name: "Kullanici",
  username: "testkullanici",
  display_name: "Test Kullanici",
  email_verified: true,
  is_admin: false,
  profile_completed: true,
  onboarding_completed: true,
  profile_completion_percentage: 100,
};

export type MockUser = typeof MOCK_USER;

/** Backend'in butun yanitlarini sardigi zarf: { data, message, status }. */
function zarf(data: unknown) {
  return { data, message: "ok", status: "success" };
}

/**
 * Sayfayi giris yapmis kullaniciyla acar. page.goto'dan ONCE cagir.
 *
 * Taklit edilmemis her /api/ istegi 404 doner ve donen listeye yazilir;
 * bir test beklenmedik bicimde dusuyorsa once o listeye bak.
 */
export async function mockSignedInUser(
  page: Page,
  user: Partial<MockUser> = {}
): Promise<{ user: MockUser; unmocked: string[] }> {
  const kullanici = { ...MOCK_USER, ...user };
  const unmocked: string[] = [];
  const taban = test.info().project.use.baseURL ?? "http://127.0.0.1:3000";

  await page
    .context()
    .addCookies([{ name: "ly_auth", value: "1", url: taban }]);

  // Once genel kural, sonra ozel olanlar: Playwright'ta SON eklenen
  // route once dener, yani asagidaki ve testin ekledigi kurallar bunu ezer.
  await page.route("**/api/**", (route) => {
    const istek = route.request();
    unmocked.push(`${istek.method()} ${new URL(istek.url()).pathname}`);
    return route.fulfill({
      status: 404,
      json: { detail: "Not mocked (synthetic test)" },
    });
  });
  await mockApi(page, "/v1/users/me", kullanici);

  return { user: kullanici, unmocked };
}

/**
 * Tek bir API ucunu taklit eder.
 *
 * `path` backend yolu ("/v1/analytics/summary"); sorgu dizgisi eslesmeye
 * katilmaz, yani "?days=7" ile "?days=30" ayni yaniti alir. `data`
 * zarfin icine konur: arayuz `yanit.data` okur.
 */
export async function mockApi(
  page: Page,
  path: string,
  data: unknown,
  status = 200
) {
  await page.route(
    (url) => url.pathname === `/api/proxy${path}`,
    (route) => route.fulfill({ status, json: zarf(data) })
  );
}
