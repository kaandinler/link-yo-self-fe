import { parcaAdresi, parcaSayisi } from "@/services/sitemap-shards";

/**
 * Sitemap indeksi.
 *
 * NEDEN ELLE YAZILIYOR: generateSitemaps kullanildiginda Next yalnizca
 * `/sitemap/0.xml`, `/sitemap/1.xml` ... uretiyor; bir indeks uretmiyor
 * ve `/sitemap.xml` uygulamanin 404 sayfasini HTTP 200 ile donuyor.
 * robots.txt oraya isaret etseydi kaziyici sitemap yerine bir HTML
 * sayfasi alirdi ve bu hicbir yerde hata olarak gorunmezdi -- olculdu.
 *
 * Bu yuzden robots.txt bu adresi gosteriyor.
 */

export const revalidate = 3600;

export async function GET() {
  const sayi = await parcaSayisi();

  const satirlar = Array.from(
    { length: sayi },
    (_, id) => `  <sitemap><loc>${parcaAdresi(id)}</loc></sitemap>`
  ).join("\n");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${satirlar}\n` +
    "</sitemapindex>\n";

  return new Response(xml, {
    headers: {
      "content-type": "application/xml",
      "cache-control": "public, max-age=3600",
    },
  });
}
