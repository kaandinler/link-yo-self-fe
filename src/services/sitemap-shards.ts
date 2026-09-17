// Sitemap parcalarinin sayisi ve adresleri.
//
// TEK KAYNAK: hem parcalari ureten app/sitemap.ts hem de onlari listeleyen
// indeks (app/sitemap-index.xml) bu modulu kullaniyor. Ayri ayri
// hesaplasalardi indeks var olmayan bir parcayi gosterebilir ya da uretilen
// bir parcayi atlayabilirdi -- ve bu yalnizca profil sayisi bir parca
// sinirini gectiginde, yani ilerde bir gun ortaya cikardi.

import { countPublicProfiles } from "@/services/api/services/public-profile";
import { SITE_URL } from "@/services/site-url";

/**
 * Bir parcadaki en fazla URL.
 *
 * Sitemap standardinin tek dosya icin siniri 50.000 URL ve 50 MB. 10.000
 * bunun epey altinda: dosyalar kucuk kaliyor ve sinira carpmadan once
 * genis bir pay var.
 *
 * Ortamdan degistirilebiliyor. Asil sebebi testler: gercek bir parca
 * sinirini on binlerce profil yaratmadan sinamanin baska yolu yok.
 * Isletme tarafinda da daha kucuk dosyalar istenebilir.
 */
export const PARCA_BOYU = Math.max(
  1,
  Number(process.env.SITEMAP_SHARD_SIZE) || 10_000
);

/**
 * Kac parca uretilecek.
 *
 * Sayiyi tek bir istekle ogreniyoruz; listeyi sayarak bulmak her parca
 * icin butun listeyi cekmek demekti.
 *
 * Backend'e ulasilamazsa tek parca: eksik bir sitemap, hic sitemap
 * olmamasindan iyi.
 */
export async function parcaSayisi(): Promise<number> {
  const toplam = await countPublicProfiles();
  if (toplam === null) return 1;
  return Math.max(1, Math.ceil(toplam / PARCA_BOYU));
}

/** Next'in parcalar icin urettigi adres. */
export function parcaAdresi(id: number): string {
  return `${SITE_URL}/sitemap/${id}.xml`;
}
