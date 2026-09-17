import { devices, expect, test } from "@playwright/test";
import { apiClickLink, apiCreateLink } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Analytics sayfasi telefon genisliginde.
 *
 * Sayfa hep 1280 pikselde bakilarak yazilmisti ve telefonda iki sey
 * bozuluyordu: eksen tarihleri birbirinin ustune biniyordu
 * ("Sep 11Sep 13ep 18ep 15") ve link basliklari "Portfolyo s..." diye
 * kirpiliyordu. Ikisi de kirmizi bir test olmadan fark edilmemisti --
 * ekran goruntusune bakmadan gorunmuyorlar.
 */
// Dosya seviyesinde: cihaz emulasyonu (isMobile, hasTouch) describe
// icinden ayarlanamiyor.
test.use({ ...devices["Pixel 5"] });

test.describe("Analytics telefonda", () => {
  test("eksen tarihleri ust uste binmiyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    const link = await apiCreateLink(token, {
      title: "Portfolyo",
      url: "https://ornek.test/a",
    });
    await apiClickLink(link.id);

    await page.goto("/en/analytics");
    const etiketler = page.getByTestId("chart-x-label");
    await expect(etiketler.first()).toBeVisible();

    const kutular = await etiketler.evaluateAll((dugumler) =>
      dugumler
        .map((d) => d.getBoundingClientRect())
        .map((r) => ({ sol: r.left, sag: r.right }))
        .sort((a, b) => a.sol - b.sol)
    );

    expect(kutular.length).toBeGreaterThan(1);
    for (let i = 1; i < kutular.length; i++) {
      // Bitisik iki tarih arasinda en az bir parmak araligi kalmali.
      expect(
        kutular[i].sol,
        `${i}. tarih bir oncekinin uzerine biniyor`
      ).toBeGreaterThan(kutular[i - 1].sag + 4);
    }
  });

  test("link basligi ve adresi okunabilir genislikte", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    const link = await apiCreateLink(token, {
      title: "Portfolyo sitem ve yazilarim",
      url: "https://ornek.test/a",
    });
    await apiClickLink(link.id);

    await page.goto("/en/analytics");

    const bolum = page
      .locator("div")
      .filter({ hasText: /^Clicks by link in this range/ })
      .last();
    const baslik = bolum.locator("ul > li").first().locator("p").first();
    await expect(baslik).toBeVisible();

    const [kutu, ekran] = await Promise.all([
      baslik.boundingBox(),
      page.evaluate(() => document.documentElement.clientWidth),
    ]);

    // Basliga ekranin en az yarisi kalmali. Yan yana dizilirken 140
    // piksellik egri basliga ucte bir birakiyordu.
    expect(kutu!.width).toBeGreaterThan(ekran * 0.5);
  });

  test("sayfa yatayda tasmiyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    const link = await apiCreateLink(token, {
      title: "Portfolyo",
      url: "https://ornek.test/a",
    });
    await apiClickLink(link.id);

    await page.goto("/en/analytics");
    await expect(page.getByTestId("referrer-list")).toBeVisible();

    const { kaydirma, gorunen } = await page.evaluate(() => ({
      kaydirma: document.documentElement.scrollWidth,
      gorunen: document.documentElement.clientWidth,
    }));
    expect(kaydirma).toBeLessThanOrEqual(gorunen);
  });
});
