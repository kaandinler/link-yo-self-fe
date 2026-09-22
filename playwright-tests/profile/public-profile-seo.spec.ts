import { expect, test, type Page } from "@playwright/test";
import {
  apiAnalyticsSummary,
  apiCreateLink,
  apiUpdateProfile,
} from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Herkese acik profilin paylasim ve arama motoru cikisi.
 *
 * NEDEN KAYNAK KODA DEGIL CIKTIYA BAKILIYOR: bu etiketleri okuyan sey
 * tarayici degil, Google ve Slack gibi kaziyicilar. Onlarin gordugu tek
 * sey sunucudan donen HTML; bir React bileseninin dogru prop aldigini
 * dogrulamak bu etiketlerin gercekten basildigini soylemez.
 *
 * NEDEN KAZIYICI KIMLIGIYLE ISTEK: dosya yukaridaki cumleyi yaziyordu
 * ama olctugu sey TARAYICININ DOM'uydu (page.locator("head meta...")).
 * Ikisi ayni sey degil ve aradaki fark bu dosyayi kirilgan yapiyordu.
 *
 * Next 15 metadata'yi AKITIYOR: `generateMetadata` backend'i beklerken
 * sayfa kabugu once gonderiliyor, etiketler sonra geliyor ve ham
 * HTML'de <body> icinde kaliyor. Tarayicida React onlari calisma
 * aninda <head>'e tasiyor -- bu yuzden DOM'a bakan test cogu zaman
 * geciyordu; kabuk ile etiketlerin arasindaki araliga denk geldiginde
 * dusuyordu.
 *
 * Olculdu -- her biri o profile yapilan ILK istek, 9 tekrar:
 *
 *   Nasil okundugu                       og:image ham HTML'de nerede?
 *   -----------------------------------  ----------------------------
 *   page.goto, tarayici kimligi          3/9 BODY   <- yarisin kaynagi
 *   dogrudan istek, tarayici kimligi     3/9 BODY
 *   dogrudan istek, KAZIYICI kimligi     0/9 BODY  (18/18 HEAD)
 *
 * Bu bir urun kusuru DEGIL, Next'in bilincli davranisi: JS
 * calistirmayan kaziyicilar icin (`htmlLimitedBots`) kabuk, metadata
 * hazir olana kadar BEKLETILIYOR; digerleri icin akitiliyor, cunku
 * onlar JS calistirip tasinmis etiketleri zaten goruyor.
 *
 * Testin olcmesi gereken sey ucuncu satir: JS calistirmayan bir
 * kaziyicinin aldigi HTML'de etiketler <head>'de mi? Istek artik o
 * kimlikle yapiliyor ve yanit govdesi okunuyor. Test boylece hem
 * iddia ettigi seyi olcuyor hem de tarayici DOM'unun zamanlamasina
 * hic bagli degil.
 *
 * NOT: eski hali CI'da hep yesildi, yerelde duzenli dusuyordu. Sebebi
 * de olculdu: CI `npm run start` (uretim derlemesi), yerel `npm run
 * dev` kosuyor. Uretim derlemesinde ayni dosya 54/54 yesildi. Yani
 * yesil CI, testin saglam oldugunu degil, yarisi daha seyrek
 * kaybettigini gosteriyordu.
 */

/**
 * JS calistirmayan bir paylasim kaziyicisi.
 *
 * Next'in `htmlLimitedBots` listesinde; bu kimlikle gelen istekte
 * metadata akitilmiyor, kabuk hazir olana kadar bekletiliyor.
 */
const KAZIYICI = "facebookexternalhit/1.1";

/** Kaziyicinin gordugu ham HTML. */
async function kaynak(page: Page, yol: string): Promise<string> {
  const yanit = await page.request.get(yol, {
    headers: { "User-Agent": KAZIYICI },
  });
  expect(yanit.status(), `${yol} yuklenemedi`).toBe(200);
  return yanit.text();
}

/**
 * Ham HTML'deki bir etiketin ozniteligi.
 *
 * Duzenli ifadeyle degil, gercek bir HTML ayristiricisiyla: oznitelik
 * sirasi ve tirnak bicimi Next'in uretimine bagli, duzenli ifade
 * sessizce kayardi. DOMParser betik calistirmiyor, yalnizca
 * ayristiriyor -- ve <head>/<body> ayrimini KORUYOR, ki olculmek
 * istenen sey tam olarak bu.
 */
async function oznitelik(
  page: Page,
  html: string,
  secici: string,
  ad = "content"
): Promise<string | null> {
  return page.evaluate(
    ([h, s, a]) =>
      new DOMParser()
        .parseFromString(h, "text/html")
        .querySelector(s)
        ?.getAttribute(a) ?? null,
    [html, secici, ad]
  );
}

/** <head>'teki bir meta etiketinin degeri. */
async function meta(
  page: Page,
  html: string,
  secici: string
): Promise<string | null> {
  return oznitelik(page, html, `head ${secici}`);
}

async function jsonLd(page: Page, html: string) {
  const ham = await page.evaluate(
    (h) =>
      new DOMParser()
        .parseFromString(h, "text/html")
        .querySelector('script[type="application/ld+json"]')?.textContent ??
      "{}",
    html
  );
  return JSON.parse(ham);
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

    const html = await kaynak(page, `/en/${user.username}`);

    const adres = new RegExp(`/en/${user.username}$`);

    // canonical ve og:url: ayni profile baska bir yoldan gelindiginde
    // arama motoru iki ayri sayfa saymasin.
    expect(
      await oznitelik(page, html, 'head link[rel="canonical"]', "href")
    ).toMatch(adres);
    expect(await meta(page, html, 'meta[property="og:url"]')).toMatch(adres);

    expect(await meta(page, html, 'meta[property="og:title"]')).toContain(
      "Ada Lovelace"
    );
    expect(await meta(page, html, 'meta[property="og:description"]')).toBe(
      "Analitik makine uzerine notlar."
    );
    expect(
      await meta(page, html, 'meta[property="og:site_name"]')
    ).toBeTruthy();
    expect(await meta(page, html, 'meta[property="og:type"]')).toBe("profile");
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

    const html = await kaynak(page, `/en/${user.username}`);

    expect(await meta(page, html, 'meta[name="twitter:card"]')).toBe(
      "summary_large_image"
    );
    expect(await meta(page, html, 'meta[property="og:image:width"]')).toBe(
      "1200"
    );
    expect(await meta(page, html, 'meta[property="og:image:height"]')).toBe(
      "630"
    );

    const gorsel = await meta(page, html, 'meta[property="og:image"]');
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

    const html = await kaynak(page, `/en/${user.username}`);
    const gorsel = await meta(page, html, 'meta[property="og:image"]');

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

    const html = await kaynak(page, `/en/${user.username}`);
    const veri = await jsonLd(page, html);

    // Ikonlar cizilmis sayfadan okunuyor (asagida); sayfa ayrica
    // aciliyor. Etiketler icin kaziyici kimligi, ikonlar icin tarayici:
    // ikisi ayri soru.
    await page.goto(`/en/${user.username}`);

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
    const html = await kaynak(page, `/en/${user.username}`);

    const gorsel = await meta(page, html, 'meta[property="og:image"]');
    const yanit = await request.get(gorsel!);

    const basligi = yanit.headers()["cache-control"] ?? "";
    expect(basligi).toContain("public");
    expect(basligi).not.toContain("no-store");
  });

  test("kart duzenlemeden sonra guncelleniyor", async ({ page, request }) => {
    /**
     * NEDEN OLCU BAYTLAR: kart bir PNG, icindeki yaziyi okuyamiyoruz.
     * Ama gorunen ad belirgin sekilde degisirse cizim de degisir, yani
     * "ayni baytlar" dogrudan "eski kart" demek.
     *
     * NEDEN BU AKIS: kart bir saatlik pencereyle onbellege aliniyor ve
     * sayfadan AYRI bir kayit -- ayni ucu `?count_view=false` ile
     * cagiriyor. Sayfanin etiketi temizlenirken kartinki durdugu icin
     * avatarini ya da adini degistiren kullanicinin paylastigi
     * baglanti bir saat eski karti gosteriyordu: olculdu, duzenlemeden
     * sonra kart bayt bayt aynisiydi.
     *
     * Sira onemli: once kart istenmeli ki onbellek dolsun.
     */
    const { user, token } = await signInAsNewUser(page);
    const html = await kaynak(page, `/en/${user.username}`);
    const gorsel = (await meta(page, html, 'meta[property="og:image"]'))!;

    const ilk = await request.get(gorsel);
    expect(ilk.status()).toBe(200);
    expect(ilk.headers()["content-type"]).toContain("image/png");
    const ilkBaytlar = await ilk.body();

    await apiUpdateProfile(token, {
      display_name: "Cok Daha Uzun Bir Gorunen Ad",
    });

    const ikinciBaytlar = await (await request.get(gorsel)).body();

    expect(
      ikinciBaytlar.equals(ilkBaytlar),
      `kart degismedi: ${ilkBaytlar.length} -> ${ikinciBaytlar.length} bayt`
    ).toBe(false);
  });

  test("kart istegi goruntulenme sayilmiyor", async ({ page, request }) => {
    const { user, token } = await signInAsNewUser(page);
    const html = await kaynak(page, `/en/${user.username}`);
    const gorsel = (await meta(page, html, 'meta[property="og:image"]'))!;

    // Kart ayni ucu cagiriyor ama `count_view=false` ile: okumasi bir
    // ziyaret degil. Bayraksiz halde her kart istegi sayaci bir
    // artiriyordu, yani kimsenin gormedigi bir sayfa goruntulenme
    // uretiyordu.
    //
    // Sayfa ziyaretinin kendi artisi oturmadan olcmeye baslamayalim.
    await expect
      .poll(async () => (await apiAnalyticsSummary(token)).profile_view_count)
      .toBeGreaterThan(0);
    const oncesi = (await apiAnalyticsSummary(token)).profile_view_count;

    for (let i = 0; i < 3; i++) {
      const y = await request.get(gorsel);
      expect(y.status()).toBe(200);
    }

    // Sayac artis gorecekse gorsun diye biraz bekleniyor: "artmadi"
    // sonucunu erken okumak istemiyoruz.
    await page.waitForTimeout(1500);
    const sonrasi = (await apiAnalyticsSummary(token)).profile_view_count;

    // Hic artmamali: ne onbellekten gelen istekler, ne de onbellegi
    // dolduran ilk istek ziyaret sayiliyor.
    expect(
      sonrasi - oncesi,
      `uc kart istegi ${sonrasi - oncesi} goruntulenme uretti`
    ).toBe(0);
  });
});
