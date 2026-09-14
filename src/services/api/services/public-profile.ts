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
      // Profil ve linkler sik degisebiliyor; duzenleme sonrasi sayfa
      // hemen guncel gorunsun diye onbellege alinmiyor.
      { cache: "no-store" }
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
 * Link tiklanmasini backend'e bildirir.
 *
 * Tarayici ayni anda linke gittigi icin istek beklenmez; `keepalive` sayfa
 * degisse bile isteğin gonderilmesini saglar. Sayac guncellenemezse
 * kullaniciya bir sey yansitmiyoruz, yonlendirme yine de gerceklesir.
 */
export function trackLinkClick(linkId: number): void {
  if (!API_URL) return;

  try {
    void fetch(`${API_URL}/v1/links/${linkId}/click`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  } catch {
    // yut: analytics kaydi kullanicinin linke gitmesini engellememeli
  }
}
