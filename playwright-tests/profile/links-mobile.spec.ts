import { devices, expect, test } from "@playwright/test";
import { apiCreateLink, apiListLinks } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { waitForHydration } from "../helpers/ui";

/**
 * Links sayfasi telefon genisliginde.
 *
 * Sayfa 1280 pikselde yazilmisti ve telefonda iki ayri sey bozuktu:
 * baslik tek harfe iniyordu ("P...") ve siralama hic degistirilemiyordu.
 * Ikincisi bir goruntu sorunu degil: HTML5 surukle-birak dokunmatik
 * girdide olay uretmiyor, yani "Drag to reorder" yazan sayfada dokunarak
 * siralama yapmak mumkun degildi.
 */

// Dosya seviyesinde: cihaz emulasyonu describe icinden ayarlanamiyor.
test.use({ ...devices["Pixel 5"] });

async function ucLinkliSayfa(page: import("@playwright/test").Page) {
  const { token } = await signInAsNewUser(page);
  await apiCreateLink(token, {
    title: "Portfolyo sitem ve butun yazilarim burada",
    url: "https://ornek.test/cok/uzun/bir/adres/olsun",
  });
  await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/b" });
  await apiCreateLink(token, {
    title: "Newsletter",
    url: "https://ornek.test/c",
  });

  await page.goto("/en/links");
  await waitForHydration(page, '[aria-label="Add new link"]');
  return token;
}

test.describe("Links telefonda", () => {
  test("baslik okunabilir genislikte", async ({ page }) => {
    await ucLinkliSayfa(page);

    const baslik = page.getByRole("heading", {
      name: /Portfolyo sitem/,
      level: 3,
    });
    await expect(baslik).toBeVisible();

    const [kutu, ekran] = await Promise.all([
      baslik.boundingBox(),
      page.evaluate(() => document.documentElement.clientWidth),
    ]);

    // Once yedi kontrol ayni satirdaydi ve basliga ~100 piksel kaliyordu:
    // "P...". Ekranin en az yarisi kalmali.
    expect(kutu!.width).toBeGreaterThan(ekran * 0.5);
  });

  test("siralama oklarla degistirilebiliyor", async ({ page }) => {
    const token = await ucLinkliSayfa(page);

    const ilkSira = (await apiListLinks(token)).map(
      (link: { title: string }) => link.title
    );
    expect(ilkSira[0]).toBe("Portfolyo sitem ve butun yazilarim burada");

    // Ikinci linki yukari tasi.
    await page.getByRole("button", { name: "Move Blog up" }).click();
    await expect
      .poll(async () =>
        (await apiListLinks(token)).map((link: { title: string }) => link.title)
      )
      .toEqual([
        "Blog",
        "Portfolyo sitem ve butun yazilarim burada",
        "Newsletter",
      ]);
  });

  test("bastaki linkin yukari oku, sondakinin asagi oku kapali", async ({
    page,
  }) => {
    await ucLinkliSayfa(page);

    await expect(
      page.getByRole("button", {
        name: "Move Portfolyo sitem ve butun yazilarim burada up",
      })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Move Newsletter down" })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Move Blog up" })
    ).toBeEnabled();
  });

  test("sayfa yatayda tasmiyor", async ({ page }) => {
    await ucLinkliSayfa(page);

    const { kaydirma, gorunen } = await page.evaluate(() => ({
      kaydirma: document.documentElement.scrollWidth,
      gorunen: document.documentElement.clientWidth,
    }));
    expect(kaydirma).toBeLessThanOrEqual(gorunen);
  });
});

test.describe("Link penceresi telefonda", () => {
  test("kaydet dugmesi kaydirmadan gorunuyor", async ({ page }) => {
    await ucLinkliSayfa(page);

    await page
      .getByRole("button", { name: /Edit link/i })
      .first()
      .click();
    const kaydet = page.getByRole("button", { name: "Update Link" });
    await expect(kaydet).toBeVisible();

    // toBeVisible() ekranda olmayi garanti etmiyor -- kayan bir kutunun
    // icinde, gorunur alanin altinda da "visible" sayilir. Onceki hali tam
    // olarak boyleydi: dugme vardi ama kullanici asagi kaydirmadan
    // goremiyordu.
    const [kutu, yukseklik] = await Promise.all([
      kaydet.boundingBox(),
      page.evaluate(() => window.innerHeight),
    ]);
    expect(kutu!.y + kutu!.height).toBeLessThanOrEqual(yukseklik);
    expect(kutu!.y).toBeGreaterThan(0);
  });

  test("uzun formda alanlar kaydirilabiliyor ama dugmeler sabit", async ({
    page,
  }) => {
    await ucLinkliSayfa(page);
    await page
      .getByRole("button", { name: /Edit link/i })
      .first()
      .click();

    const kaydet = page.getByRole("button", { name: "Update Link" });
    const once = (await kaydet.boundingBox())!.y;

    // Alanlari sonuna kadar kaydir ve gercekten kaydigini dogrula. Bu
    // olmadan test eski duzende de gecerdi: orada kaydirilacak ayri bir
    // kutu yok, dolayisiyla dugme de yerinden oynamiyor.
    const alanlar = page.locator("form > div").first();
    const kaydi = await alanlar.evaluate((el) => {
      el.scrollTo(0, el.scrollHeight);
      return el.scrollTop;
    });
    expect(kaydi, "alanlar kutusu kaymadi").toBeGreaterThan(0);
    await page.waitForTimeout(300);

    expect((await kaydet.boundingBox())!.y).toBeCloseTo(once, 0);
  });
});
