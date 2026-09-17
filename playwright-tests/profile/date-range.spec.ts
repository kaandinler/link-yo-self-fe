import { expect, test, type Page } from "@playwright/test";
import { apiCreateLink } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { waitForHydration } from "../helpers/ui";

/**
 * Analytics sayfasindaki serbest tarih araligi.
 *
 * Hazir araliklar ("son 7 gun") her gun kayiyor; belirli bir kampanyanin
 * penceresine bakmak icin sabit bir aralik gerekiyor.
 */

/** "2026-09-17" bicimi; <input type="date"> bunu bekliyor. */
function gunEkle(gun: number): string {
  const tarih = new Date();
  tarih.setUTCDate(tarih.getUTCDate() + gun);
  return tarih.toISOString().slice(0, 10);
}

async function serbestAraligaGec(page: Page, bas: string, son: string) {
  await waitForHydration(page, '[data-testid="range-custom"]');
  await page.getByTestId("range-custom").click();
  await page.getByTestId("range-start").fill(bas);
  await page.getByTestId("range-end").fill(son);
}

test.describe("Tarih araligi", () => {
  test("serbest aralik istegi start/end ile gidiyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/a" });

    await page.goto("/en/analytics");

    // Sorgu dizgisini istekten okuyoruz: ekrandaki sayilar dogru
    // gorunse bile uce yanlis aralik gidiyor olabilirdi.
    const istekler: string[] = [];
    page.on("request", (istek) => {
      if (istek.url().includes("/v1/analytics/timeseries?")) {
        istekler.push(istek.url());
      }
    });

    const bas = gunEkle(-20);
    const son = gunEkle(-10);
    const yanit = page.waitForResponse(
      (r) =>
        r.url().includes("/v1/analytics/timeseries?") &&
        r.url().includes(`start=${bas}`)
    );
    await serbestAraligaGec(page, bas, son);
    await yanit;

    const sonIstek = istekler[istekler.length - 1];
    expect(sonIstek).toContain(`start=${bas}`);
    expect(sonIstek).toContain(`end=${son}`);
    expect(sonIstek, "days hala gonderiliyor").not.toContain("days=");
  });

  test("sunucu secilen araligi aynen donduruyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/a" });

    await page.goto("/en/analytics");

    const bas = gunEkle(-20);
    const son = gunEkle(-10);
    const yanit = page.waitForResponse(
      (r) =>
        r.url().includes("/v1/analytics/timeseries?") &&
        r.url().includes(`start=${bas}`)
    );
    await serbestAraligaGec(page, bas, son);

    const govde = await (await yanit).json();
    expect(govde.data.start_date).toBe(bas);
    expect(govde.data.end_date).toBe(son);
    // 10 gun fark, iki ucu da dahil -> 11.
    expect(govde.data.days).toBe(11);
    expect(govde.data.points).toHaveLength(11);
  });

  test("ters aralik istek gondermeden uyariyor", async ({ page }) => {
    await signInAsNewUser(page);
    await page.goto("/en/analytics");

    const istekler: string[] = [];
    page.on("request", (istek) => {
      if (istek.url().includes("/v1/analytics/timeseries?start=")) {
        istekler.push(istek.url());
      }
    });

    // Bitis, baslangictan once.
    await serbestAraligaGec(page, gunEkle(-5), gunEkle(-20));

    await expect(page.getByTestId("range-error")).toBeVisible();
    await expect(page.getByTestId("range-error")).toContainText(/before/i);
    // Gecersiz aralik icin uce hic gidilmemeli; 422 beklemek yerine
    // kullaniciya aninda soyleniyor.
    expect(istekler, "gecersiz aralik icin istek gitti").toHaveLength(0);
  });

  test("90 gunden uzun aralik uyariyor", async ({ page }) => {
    await signInAsNewUser(page);
    await page.goto("/en/analytics");

    await serbestAraligaGec(page, gunEkle(-120), gunEkle(0));

    await expect(page.getByTestId("range-error")).toBeVisible();
    await expect(page.getByTestId("range-error")).toContainText("90");
  });

  test("hazir araliga donunce days'e geri geciliyor", async ({ page }) => {
    await signInAsNewUser(page);
    await page.goto("/en/analytics");

    await serbestAraligaGec(page, gunEkle(-20), gunEkle(-10));

    const yanit = page.waitForResponse(
      (r) =>
        r.url().includes("/v1/analytics/timeseries?") &&
        r.url().includes("days=30")
    );
    await page.getByRole("button", { name: "Last 30 days" }).click();
    const govde = await (await yanit).json();

    expect(govde.data.days).toBe(30);
    // Serbest alanlar kapanmali: acik kalirsa hangi araligin gecerli
    // oldugu ekranda iki turlu okunurdu.
    await expect(page.getByTestId("range-start")).toBeHidden();
  });
});
