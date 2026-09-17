import type { MetadataRoute } from "next";
import { listPublicProfiles } from "@/services/api/services/public-profile";
import { fallbackLanguage } from "@/services/i18n/config";
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

/**
 * Sitemap standardinin tek dosya icin siniri 50.000 URL. Bunun ustune
 * cikildiginda dosyayi bolmek gerekiyor (Next: generateSitemaps). Simdilik
 * sinira geldigimizde sessizce kirpmak yerine burada duruyoruz; sayinin
 * yaklastigi, uretilen dosyanin uzunlugundan gorulur.
 */
const EN_FAZLA = 50_000;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const girisler: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/${fallbackLanguage}`,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (let offset = 0; offset < EN_FAZLA; offset += SAYFA) {
    const sayfa = await listPublicProfiles(SAYFA, offset);

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
    if (sayfa.length < SAYFA) break;
  }

  return girisler;
}
