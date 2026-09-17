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
    // Kaziyici sitemap'i once burada ariyor. Adres indeks: sitemap
    // parcalara bolundugu icin Next `/sitemap.xml` uretmiyor
    // (bkz. sitemap-shards.spec.ts).
    expect(metin).toMatch(/Sitemap: \S+\/sitemap-index\.xml/);
  });

  /**
   * Sitemap olmadan bir profil ancak disaridan birisi ona baglanti
   * verirse kesfediliyor -- yani tam olarak yeni kullanicinin sahip
   * olmadigi sey. Profiller birbirine bagli degil.
   */
  test("sitemap linki olan profili listeliyor, bos profili listelemiyor", async ({
    page,
    request,
  }) => {
    const { user: linkli, token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Blog",
      url: "https://ornek.test/blog",
    });

    // Ayni anda acilan, hicbir sey eklenmemis hesap.
    const { user: bos } = await signInAsNewUser(page);

    // Parcalarin hepsi birlestirilip bakiliyor: bir profilin hangi
    // parcaya dustugu siralamaya bagli ve testin konusu o degil.
    const indeks = await (await request.get("/sitemap-index.xml")).text();
    const parcalar: string[] = [];
    const desen = /<loc>([^<]+)<\/loc>/g;
    let esleme = desen.exec(indeks);
    while (esleme) {
      parcalar.push(esleme[1]);
      esleme = desen.exec(indeks);
    }
    expect(parcalar.length).toBeGreaterThan(0);

    let xml = "";
    for (const parca of parcalar) {
      const yanit = await request.get(parca);
      expect(yanit.status()).toBe(200);
      expect(yanit.headers()["content-type"]).toContain("xml");
      xml += await yanit.text();
    }
    expect(xml).toContain(`/${linkli.username}<`);
    // Bos sayfayi arama motoruna onermek hem ziyaretciyi hem sitenin
    // genel degerlendirmesini asagi cekiyor.
    expect(xml, "linki olmayan profil sitemap'te").not.toContain(
      `/${bos.username}<`
    );

    // lastmod gercek bir tarih olmali; kaziyici tekrar ziyaret edip
    // etmeyecegine buna bakarak karar veriyor.
    const girdi = xml.split("<url>").find((p) => p.includes(linkli.username));
    const lastmod = girdi?.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    expect(lastmod, "lastmod yok").toBeTruthy();
    expect(Number.isNaN(Date.parse(lastmod!))).toBe(false);
  });

  /**
   * Kart uretimi pahali (gorsel cizimi + avatarin indirilmesi) ve ayni
   * baglanti her paylasildiginda yeniden isteniyor. Sayfa "no-store"
   * oldugu icin Next bu yola da onbelleklenmez basligi koyuyordu.
   */
  test("kart gorseli onbelleklenebilir donuyor", async ({ page, request }) => {
    const { user } = await signInAsNewUser(page);
    await page.goto(`/en/${user.username}`);

    const gorsel = await meta(page, 'meta[property="og:image"]');
    const yanit = await request.get(gorsel!);

    const basligi = yanit.headers()["cache-control"] ?? "";
    expect(basligi).toContain("public");
    expect(basligi).not.toContain("no-store");
  });
});
