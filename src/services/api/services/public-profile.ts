// src/services/api/services/public-profile.ts
//
// Public profil sayfasinin veri katmani.
//
// DIKKAT: Bu modulde bilerek "use client" yok ve useFetch kullanilmiyor.
// Backend'deki GET /v1/p/{username} ucu token istemiyor; sayfa sunucuda
// render edildigi icin (SEO + metadata) fetch'in her iki tarafta da
// calisabilmesi gerekiyor. useFetch token ekleyip 401'de yonlendirme
// yaptigindan burada uygun degil.

import { cache } from "react";

/**
 * Paylasim kartinin tazelik penceresi. Kartin `cache-control` basligi
 * da bu degeri kullaniyor; ikisi ayrismasin diye tek yerde duruyor.
 */
export const KART_ONBELLEK_SANIYE = 3600;

/** Varsayilan tazelik penceresi; env verilmezse bu kullaniliyor. */
const VARSAYILAN_PROFIL_ONBELLEK_SANIYE = 60;

/**
 * Herkese acik profil sayfasinin tazelik penceresi (saniye).
 *
 * Bu bir "bayat kalabilir" suresi degil, bir tavan: profilini
 * kaydeden istemci onbellegi hemen temizliyor, yani normalde sayfa
 * aninda guncelleniyor. Bu sure yalnizca o temizlik ETKI ETMEDIGINDE
 * ne kadar bekleneceğini soyluyor.
 *
 * NEDEN AYARLANABILIR: `revalidateTag` yalnizca cagrinin dustugu
 * Next ORNEGINI temizliyor. Iki ornek ayni derlemeden ayni diskle
 * kosarken olculdu -- 3000'de temizlik yapilinca 3000 yeni adi,
 * 3001 hala eskisini gosteriyordu. Tek ornekte sorun yok; birden
 * fazla ornekle kosulacaksa bu pencere staleligin tavani oluyor ve
 * kodu degistirmeden kisaltilabilmesi gerekiyor.
 *
 * Asil cozum ornekler arasinda paylasilan bir cache handler
 * (next.config `cacheHandler`); bu depoda oyle bir altyapi yok.
 * Bkz. docs/architecture.md.
 */
export const PROFIL_ONBELLEK_SANIYE = onbellekSaniyesiCoz(
  process.env.PROFILE_CACHE_SECONDS
);

/**
 * Env degerini saniyeye cevirir; anlamsizsa varsayilana duser.
 *
 * Sessizce 0'a dusmek en kotu sonuc olurdu: onbellek tamamen kapanir
 * ve bunu kimse fark etmez. Bu yuzden yalnizca pozitif tamsayi kabul
 * ediliyor.
 */
function onbellekSaniyesiCoz(ham: string | undefined): number {
  if (!ham) return VARSAYILAN_PROFIL_ONBELLEK_SANIYE;
  const sayi = Number(ham);
  if (!Number.isInteger(sayi) || sayi <= 0) {
    return VARSAYILAN_PROFIL_ONBELLEK_SANIYE;
  }
  return sayi;
}

/** Bir profilin onbellek etiketi; temizleyen taraf da ayni isimi uretiyor. */
export function profilEtiketi(username: string): string {
  return `profil:${username.toLowerCase()}`;
}

/**
 * Paylasim kartinin onbellek etiketi.
 *
 * NEDEN SAYFADAN AYRI: kart ayni ucu farkli bir adresle cagiriyor
 * (`?count_view=false`), yani Next icin bambaska bir onbellek kaydi.
 * Sayfanin etiketini temizlemek kartinkini temizlemiyordu -- olculdu,
 * duzenlemeden sonra kart bayt bayt aynisi donuyordu.
 *
 * Ayri isim olmasi ayrica ise yariyor: ikisinin suresi farkli (sayfa
 * 60 saniye, kart bir saat) ve ileride yalnizca birini temizlemek
 * gerekebilir.
 */
export function kartEtiketi(username: string): string {
  return `kart:${username.toLowerCase()}`;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface PublicLink {
  id: number;
  title: string;
  url: string;
  description?: string | null;
  icon_url?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  border_radius: number;
  order_index: number;
}

export interface PublicProfile {
  username: string;
  display_name: string;
  bio?: string | null;
  profile_image_url?: string | null;

  page_title?: string | null;
  page_description?: string | null;
  website?: string | null;

  twitter_username?: string | null;
  instagram_username?: string | null;
  linkedin_username?: string | null;

  theme_color?: string | null;
  background_type?: string | null;
  background_value?: string | null;

  links: PublicLink[];
}

interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
}

/**
 * Bir kullanicinin herkese acik profilini getirir.
 *
 * Kullanici yoksa (404) veya API'ye ulasilamiyorsa null doner; cagiran taraf
 * bunu notFound() ile 404 sayfasina cevirir.
 *
 * React cache() ile sarmalanmis: generateMetadata ve sayfa ayni istegi
 * yaptigi icin backend'e iki kez gidilmesini engelliyor.
 */
export const getPublicProfile = cache(async function getPublicProfile(
  username: string
): Promise<PublicProfile | null> {
  if (!API_URL) return null;

  try {
    const response = await fetch(
      `${API_URL}/v1/p/${encodeURIComponent(username)}`,
      // Duzenleme sonrasi sayfa hala ANINDA guncelleniyor: kaydeden
      // istemci /api/revalidate-profile'i cagirip bu etiketi temizliyor
      // (bkz. use-fetch.ts). Sure yalnizca o cagri kaybolursa devreye
      // giren tavan.
      //
      // Olcum (uretim derlemesi, ayni profile art arda bes ziyaret):
      // backend cagrisi 5 -> 1. Temizlikten sonraki ilk ziyaret yine
      // backend'e gidiyor.
      {
        next: {
          revalidate: PROFIL_ONBELLEK_SANIYE,
          tags: [profilEtiketi(username)],
        },
      }
    );

    if (!response.ok) return null;

    const result: ApiResponse<PublicProfile> = await response.json();
    return result.data ?? null;
  } catch {
    // Backend kapaliysa sayfa patlamak yerine 404 vermeli.
    return null;
  }
});

/**
 * Ayni profili paylasim karti icin getirir -- ama bir saatlik onbellekle.
 *
 * NEDEN AYRI BIR FONKSIYON: sayfanin kendisi bilerek "no-store"
 * (profil duzenlenince hemen guncel gorunmeli). Kart oyle degil: zaten
 * bir saatlik `cache-control` ile servis ediliyor, yani tazeligi bir
 * saatle sinirli olduguna coktan karar verilmis. Ayni fonksiyonu
 * paylassaydilar kartin her istegi backend'e bir cagri daha demekti.
 *
 * Olcum (ayni profile art arda dort kart istegi, uretim derlemesi):
 * backend cagrisi 4 -> 1.
 *
 * Ayrica `count_view=false` ile cagriliyor: kartin okumasi bir ziyaret
 * degil. Onbellek bu cagrilari seyrekletti, sayimdan cikaran bu bayrak.
 *
 * `cache()` burada ise yaramaz: o yalnizca tek bir render icindeki
 * ayni cagrilari birlestiriyor, istekler arasinda bir sey tutmuyor.
 *
 * Bir saat "bayat kalma suresi" degil, tavan: profilini kaydeden
 * istemci kart etiketini de temizliyor, yani kart da aninda
 * guncelleniyor. Sure yalnizca o cagri kaybolursa devreye giriyor.
 */
export async function getPublicProfileForCard(
  username: string
): Promise<PublicProfile | null> {
  if (!API_URL) return null;

  try {
    const response = await fetch(
      // count_view=false: bu okuma bir ziyaret degil. Uc varsayilan
      // olarak her cagriyi "profil goruntulenmesi" sayiyor; kart da ayni
      // ucu cagirdigi icin bir kaziyicinin kart istegi, kimsenin
      // gormedigi bir sayfa icin goruntulenme uretiyordu.
      `${API_URL}/v1/p/${encodeURIComponent(username)}?count_view=false`,
      {
        next: {
          revalidate: KART_ONBELLEK_SANIYE,
          tags: [kartEtiketi(username)],
        },
      }
    );
    if (!response.ok) return null;

    const result: ApiResponse<PublicProfile> = await response.json();
    return result.data ?? null;
  } catch {
    return null;
  }
}

/** Sitemap satiri: yalnizca adres ve son degisiklik. */
export interface PublicProfileRef {
  username: string;
  last_modified: string;
}

/**
 * Sitemap'e girecek profiller.
 *
 * Backend yalnizca en az bir gorunur linki olan profilleri donuyor; bos
 * bir sayfayi arama motoruna onermek istenmiyor (bkz. BE README).
 *
 * `limit`ten az satir donmesi listenin bittigini gosteriyor, bu yuzden
 * ayri bir sayim cagrisi yok. Hata durumunda null: sitemap'in eksik
 * uretilmesi, derlemenin ya da istegin patlamasindan iyi.
 */
export async function listPublicProfiles(
  limit: number,
  offset: number
): Promise<PublicProfileRef[] | null> {
  if (!API_URL) return null;

  try {
    const response = await fetch(
      `${API_URL}/v1/p/sitemap/profiles?limit=${limit}&offset=${offset}`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;

    const result: ApiResponse<PublicProfileRef[]> = await response.json();
    return result.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Sitemap'e girecek profil sayisi.
 *
 * Parcalama icin: kac parca gerektigi buradan ogreniliyor. Listeyi
 * bastan sona okuyup saymak, her parca icin butun listeyi cekmek
 * demekti.
 *
 * Hata durumunda null; cagiran taraf tek parcaya duserek yine de bir
 * sitemap uretiyor.
 */
export async function countPublicProfiles(): Promise<number | null> {
  if (!API_URL) return null;

  try {
    const response = await fetch(`${API_URL}/v1/p/sitemap/count`, {
      cache: "no-store",
    });
    if (!response.ok) return null;

    const result: ApiResponse<{ count: number }> = await response.json();
    return result.data?.count ?? null;
  } catch {
    return null;
  }
}
