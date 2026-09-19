import { devices, expect, test } from "@playwright/test";
import { apiClickLink, apiCreateLink } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { waitForHydration } from "../helpers/ui";

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

  /**
   * Tarih araligi secici telefonda.
   *
   * Secici masaustu genisliginde yazilmisti. Telefonda uc sey bozuktu ve
   * ucu de yalnizca gercek bir viewport'ta olculunce gorundu:
   *
   * - Alanlar 32 piksel yuksekligindeydi; parmakla isabet ettirilebilen
   *   en kucuk hedef 44.
   * - 393 piksellik bir telefonda ikinci alanin sag kenari kullanilabilir
   *   alanin 0,1 pikseli kadar icinde kaliyordu -- bir karakter daha genis
   *   bir tarih bicimi tasirdi.
   * - 360 pikselde alanlar sarip hizasiz iki satira dusuyordu, cunku
   *   "From" ile "to" ayni genislikte degil.
   */
  test("tarih alanlari parmakla kullanilabilir ve hizali", async ({ page }) => {
    await signInAsNewUser(page);
    await page.goto("/en/analytics");

    await waitForHydration(page, '[data-testid="range-custom"]');
    await page.getByTestId("range-custom").click();

    const bas = page.getByTestId("range-start");
    const son = page.getByTestId("range-end");
    await expect(bas).toBeVisible();

    const bk = (await bas.boundingBox())!;
    const sk = (await son.boundingBox())!;

    // WCAG 2.5.5'in hedef boyutu; 32 pikselde kalmisti.
    expect(
      bk.height,
      "baslangic alani parmak icin kucuk"
    ).toBeGreaterThanOrEqual(44);
    expect(sk.height, "bitis alani parmak icin kucuk").toBeGreaterThanOrEqual(
      44
    );

    // Alt alta ve ayni yerden basliyorlar: etiketler ayni genislikte
    // olmadigi icin once hizasizdilar.
    expect(sk.y, "alanlar alt alta degil").toBeGreaterThan(
      bk.y + bk.height - 1
    );
    expect(sk.x, "alanlarin sol kenarlari hizali degil").toBeCloseTo(bk.x, 0);

    // Sag kenarda gercek bir pay kalmali; onceki duzende 0,1 piksel vardi.
    const genislik = page.viewportSize()!.width;
    expect(genislik - (bk.x + bk.width), "sag kenarda pay yok").toBeGreaterThan(
      8
    );
  });

  test("secici acikken sayfa yatayda tasmiyor", async ({ page }) => {
    await signInAsNewUser(page);
    await page.goto("/en/analytics");

    await waitForHydration(page, '[data-testid="range-custom"]');
    await page.getByTestId("range-custom").click();
    await expect(page.getByTestId("range-start")).toBeVisible();

    const olcu = await page.evaluate(() => ({
      belge: document.documentElement.scrollWidth,
      pencere: window.innerWidth,
    }));
    expect(olcu.belge, "yatay kaydirma var").toBeLessThanOrEqual(olcu.pencere);
  });
});
