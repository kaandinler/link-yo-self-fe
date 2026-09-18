import type { MetadataRoute } from "next";
import { notFound } from "next/navigation";
import { listPublicProfiles } from "@/services/api/services/public-profile";
import { fallbackLanguage } from "@/services/i18n/config";
import { PARCA_BOYU, parcaSayisi } from "@/services/sitemap-shards";
import { SITE_URL, profileUrl } from "@/services/site-url";

/**
 * sitemap.xml.
 *
 * NEDEN GEREKLI: profiller birbirine bagli degil ve uygulamanin icinden
 * onlara giden herkese acik bir baglanti yok. Sitemap olmadan bir profil
 * ancak disaridan birisi ona baglanti verirse kesfediliyor -- yani tam
 * olarak yeni kullanicinin sahip olmadigi sey.
 */

/** Bir istekte alinan satir sayisi; backend en fazla 5000'e izin veriyor. */
const SAYFA = 1000;

export const revalidate = 3600;

/**
 * Kac parca uretilecek; Next bunu `/sitemap/0.xml`, `/sitemap/1.xml` ...
 * adreslerine ceviriyor.
 *
 * Sayi ve boyut ortak modulden (sitemap-shards.ts): indeks de ayni
 * kaynaktan okuyor, ikisi ayrisamiyor.
 *
 * DIKKAT: generateSitemaps kullanilinca `/sitemap.xml` uretilmiyor ve
 * uygulamanin 404 sayfasini HTTP 200 ile donuyor. Kaziyicilar
 * `/sitemap-index.xml` adresine yonlendiriliyor (robots.txt).
 */
export async function generateSitemaps() {
  return Array.from({ length: await parcaSayisi() }, (_, id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // DIKKAT - Number(): tip imzasi number diyor ama Next `id`i adresteki
  // segmentten, yani DIZGE olarak veriyor. `id === 0` bu yuzden hep
  // false donuyordu ve ana sayfa hicbir parcaya girmiyordu -- sitemap
  // gecerli gorundugu, parcalar dogru dilimleri verdigi ve tip kontrolu
  // temiz gectigi icin yalnizca uretilen XML'e bakinca goruldu.
  // Carpma isleminde JS dizgeyi kendiliginden cevirdigi icin
  // dilimlerin dogru olmasi tesadufdu.
  const parca = Number(id);

  // ARALIK DISI ID 404. Next bu yolu her id icin calistiriyor, yani
  // /sitemap/99.xml gibi olmayan bir parca da 200 ve bos bir <urlset>
  // donuyordu: yanlis bir adres sessizce gecerli gorunuyor, kaziyici
  // bos is yapiyor ve bir yazim hatasi hicbir yerde hata vermiyordu.
  //
  // NEDEN dynamicParams = false DEGIL: o da olmayan id'leri 404
  // yapardi ama parca listesi derleme aninda sabitlenirdi. Profil
  // sayisi bir parca sinirini gectiginde indeks -- istek aninda
  // hesaplandigi icin -- yeni parcayi ilan ederken o adres 404
  // donerdi. Canli sayima bakmak ikisini tutarli tutuyor.
  const sayi = await parcaSayisi();
  if (!Number.isInteger(parca) || parca < 0 || parca >= sayi) {
    notFound();
  }

  const girisler: MetadataRoute.Sitemap = [];

  // Ana sayfa yalnizca ilk parcada: her parcaya konsaydi ayni adres
  // birden fazla dosyada bildirilirdi.
  if (parca === 0) {
    girisler.push({
      url: `${SITE_URL}/${fallbackLanguage}`,
      changeFrequency: "weekly",
      priority: 1,
    });
  }

  const parcaBasi = parca * PARCA_BOYU;

  for (let okunan = 0; okunan < PARCA_BOYU; okunan += SAYFA) {
    const istenen = Math.min(SAYFA, PARCA_BOYU - okunan);
    const sayfa = await listPublicProfiles(istenen, parcaBasi + okunan);

    // null: backend'e ulasilamadi. Sitemap'i yarim vermek, derlemeyi ya da
    // istegi dusurmekten iyi -- eldeki adresler yine de bildiriliyor.
    if (!sayfa) break;

    for (const profil of sayfa) {
      girisler.push({
        url: profileUrl(fallbackLanguage, profil.username),
        lastModified: new Date(profil.last_modified),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // Istenen kadar satir gelmediyse liste bitti.
    if (sayfa.length < istenen) break;
  }

  return girisler;
}
