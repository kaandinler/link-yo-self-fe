import { expect, test, type Page } from "@playwright/test";
import { apiCreateLink, apiUpdateProfile } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Herkese acik profilin paylasim ve arama motoru cikisi.
 *
 * NEDEN KAYNAK KODA DEGIL CIKTIYA BAKILIYOR: bu etiketleri okuyan sey
 * tarayici degil, Google ve Slack gibi kaziyicilar. Onlarin gordugu tek
 * sey sunucudan donen HTML; bir React bileseninin dogru prop aldigini
 * dogrulamak bu etiketlerin gercekten basildigini soylemez.
 */

/** <head>'teki bir meta etiketinin degeri. */
async function meta(page: Page, secici: string): Promise<string | null> {
  return page.locator(`head ${secici}`).first().getAttribute("content");
}

async function jsonLd(page: Page) {
  const ham = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  return JSON.parse(ham ?? "{}");
}

test.describe("Public profil SEO", () => {
  test("paylasim etiketleri sayfanin kendi adresini ve kartini gosteriyor", async ({
    page,
  }) => {
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, {
      display_name: "Ada Lovelace",
      bio: "Analitik makine uzerine notlar.",
    });

    await page.goto(`/en/${user.username}`);

    const adres = new RegExp(`/en/${user.username}$`);

    // canonical ve og:url: ayni profile baska bir yoldan gelindiginde
    // arama motoru iki ayri sayfa saymasin.
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      adres
    );
    expect(await meta(page, 'meta[property="og:url"]')).toMatch(adres);

    expect(await meta(page, 'meta[property="og:title"]')).toContain(
      "Ada Lovelace"
    );
    expect(await meta(page, 'meta[property="og:description"]')).toBe(
      "Analitik makine uzerine notlar."
    );
    expect(await meta(page, 'meta[property="og:site_name"]')).toBeTruthy();
    expect(await meta(page, 'meta[property="og:type"]')).toBe("profile");
  });

  /**
   * Bu test asil bosluk icin yazildi: avatari olmayan profil -- yani yeni
   * acilan her profil -- hic og:image uretmiyordu ve paylasildiginda
   * yalnizca duz yazi cikiyordu. Twitter karti da summary_large_image
   * yerine kucuk summary'ye dusuyordu.
   */
  test("avatari olmayan profilin de kart gorseli var", async ({
    page,
    request,
  }) => {
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, { display_name: "Grace Hopper" });

    await page.goto(`/en/${user.username}`);

    expect(await meta(page, 'meta[name="twitter:card"]')).toBe(
      "summary_large_image"
    );
    expect(await meta(page, 'meta[property="og:image:width"]')).toBe("1200");
    expect(await meta(page, 'meta[property="og:image:height"]')).toBe("630");

    const gorsel = await meta(page, 'meta[property="og:image"]');
    expect(gorsel, "og:image yok").toBeTruthy();

    // Etiketin varligi yetmez: adres gercekten bir gorsel dondurmeli.
    // Kaziyici da tam olarak bunu yapiyor.
    const yanit = await request.get(gorsel!);
    expect(yanit.status()).toBe(200);
    expect(yanit.headers()["content-type"]).toContain("image/png");
    expect((await yanit.body()).byteLength).toBeGreaterThan(1000);
  });

  /**
   * Avatar adresi kullanicinin yazdigi rastgele bir dis adres; ulasilamaz
   * oldugunda kart uretimi komple dusmemeli.
   */
  test("ulasilamayan avatar adresi karti bozmuyor", async ({
    page,
    request,
  }) => {
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, {
      display_name: "Katherine Johnson",
      profile_image_url: "https://ulasilamaz.test/yok.png",
    });

    await page.goto(`/en/${user.username}`);
    const gorsel = await meta(page, 'meta[property="og:image"]');

    const yanit = await request.get(gorsel!);
    expect(yanit.status(), "avatar indirilemeyince kart da dusuyor").toBe(200);
    expect(yanit.headers()["content-type"]).toContain("image/png");
  });

  test("yapisal veri kisiyi sosyal hesaplariyla birlestiriyor", async ({
    page,
  }) => {
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, {
      display_name: "Ada Lovelace",
      website: "https://ada.test",
      // Basindaki @ temizlenmeli: kullanici ikisini de yazabiliyor.
      twitter_username: "@adalovelace",
      instagram_username: "ada.lovelace",
    });
    await apiCreateLink(token, { title: "Blog", url: "https://ada.test/blog" });

    await page.goto(`/en/${user.username}`);
    const veri = await jsonLd(page);

    expect(veri["@type"]).toBe("ProfilePage");
    expect(veri.mainEntity["@type"]).toBe("Person");
    expect(veri.mainEntity.name).toBe("Ada Lovelace");

    // sameAs sayfadaki ikonlarla ayni adresleri vermeli; ikisi tek
    // modulden uretiliyor (src/services/social-links.ts).
    expect(veri.mainEntity.sameAs).toEqual([
      "https://twitter.com/adalovelace",
      "https://instagram.com/ada.lovelace",
      "https://ada.test",
    ]);

    const ikonAdresleri = await page
      .locator("main nav a")
      .evaluateAll((baglantilar) =>
        baglantilar.map((b) => (b as HTMLAnchorElement).href)
      );
    for (const adres of ["https://twitter.com/adalovelace"]) {
      expect(ikonAdresleri).toContain(adres);
    }
  });

  test("robots.txt profilleri tariyor, uygulama ekranlarini taramiyor", async ({
    request,
  }) => {
    const yanit = await request.get("/robots.txt");
    expect(yanit.status()).toBe(200);

    const metin = await yanit.text();
    expect(metin).toContain("Allow: /");
    // Giris gerektiren ekranlar kaziyiciya yalnizca bos bir kabuk
    // gosteriyor; dizine girerlerse profillerle yarisirlar.
    expect(metin).toContain("Disallow: /*/dashboard");
    expect(metin).toContain("Disallow: /*/settings");
  });
});
