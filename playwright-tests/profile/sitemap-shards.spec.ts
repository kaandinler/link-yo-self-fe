import { expect, test } from "@playwright/test";

/**
 * Sitemap parcalari ve indeksi.
 *
 * Sitemap standardinin tek dosya icin siniri 50.000 URL. Liste parcalara
 * bolunuyor ve kaziyici parcalari bir indeks uzerinden buluyor.
 *
 * NEDEN INDEKS: generateSitemaps kullanilinca Next `/sitemap.xml`
 * uretmiyor; o adres uygulamanin 404 sayfasini HTTP 200 ile donuyor.
 * robots.txt oraya isaret etseydi kaziyici sitemap yerine HTML alirdi ve
 * bu hicbir yerde hata olarak gorunmezdi -- durum kodu 200 cunku.
 */

test.describe("Sitemap parcalari", () => {
  test("robots.txt gercekten XML donen bir adresi gosteriyor", async ({
    request,
  }) => {
    const robots = await (await request.get("/robots.txt")).text();
    const adres = robots.match(/Sitemap:\s*(\S+)/)?.[1];
    expect(adres, "robots.txt sitemap satiri yok").toBeTruthy();

    const yanit = await request.get(adres!);
    expect(yanit.status()).toBe(200);
    // ASIL OLCUM: icerik tipi. HTML donerse durum kodu yine 200 olur ve
    // yalnizca buna bakan bir test bunu kacirirdi.
    expect(
      yanit.headers()["content-type"],
      "robots.txt'nin gosterdigi adres XML donmuyor"
    ).toContain("xml");
    expect(await yanit.text()).toContain("<sitemapindex");
  });

  test("indeks var olan parcalari gosteriyor", async ({ request }) => {
    const xml = await (await request.get("/sitemap-index.xml")).text();

    const parcalar: string[] = [];
    const desen = /<loc>([^<]+)<\/loc>/g;
    let esleme = desen.exec(xml);
    while (esleme) {
      parcalar.push(esleme[1]);
      esleme = desen.exec(xml);
    }
    expect(parcalar.length).toBeGreaterThan(0);

    // Indekste yazan her adres gercekten bir sitemap dondurmeli;
    // olmayan bir parcayi gostermek kaziyiciya bos is yaptirirdi.
    for (const parca of parcalar) {
      const yanit = await request.get(parca);
      expect(yanit.status(), `${parca} dusuyor`).toBe(200);
      expect(yanit.headers()["content-type"]).toContain("xml");
      expect(await yanit.text()).toContain("<urlset");
    }
  });

  /**
   * Next bu yolu her id icin calistiriyor. Aralik disi bir id de 200 ve
   * bos bir <urlset> donuyordu: yanlis bir adres sessizce gecerli
   * gorunuyor ve bir yazim hatasi hicbir yerde hata vermiyordu.
   */
  test("olmayan parca 404 donuyor", async ({ request }) => {
    const indeks = await (await request.get("/sitemap-index.xml")).text();
    const parcaSayisi = (indeks.match(/<loc>/g) ?? []).length;
    expect(parcaSayisi).toBeGreaterThan(0);

    // Var olan son parca calismali...
    const sonuncu = await request.get(`/sitemap/${parcaSayisi - 1}.xml`);
    expect(sonuncu.status()).toBe(200);

    // ...bir sonraki olmamali.
    const yok = await request.get(`/sitemap/${parcaSayisi}.xml`);
    expect(yok.status(), "aralik disi parca 404 donmuyor").toBe(404);

    const cokUzak = await request.get("/sitemap/9999.xml");
    expect(cokUzak.status()).toBe(404);
  });

  test("ilk parca profilleri ve ana sayfayi iceriyor", async ({ request }) => {
    const xml = await (await request.get("/sitemap/0.xml")).text();

    expect(xml).toContain("<urlset");
    // Ana sayfa yalnizca ilk parcada: her parcaya konsaydi ayni adres
    // birden fazla dosyada bildirilirdi.
    expect(xml).toMatch(/<loc>[^<]*\/en<\/loc>/);
    expect(xml).toContain("<lastmod>");
  });
});
