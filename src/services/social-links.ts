// Profildeki sosyal hesaplarin adresleri.
//
// TEK KAYNAK: hem sayfadaki ikonlar hem de yapisal veri (JSON-LD sameAs)
// bu listeden uretiliyor. Ayri yazilsalardi ikonlar bir adrese, arama
// motoruna verilen sameAs baska bir adrese isaret edebilirdi -- ve ikincisi
// sayfaya bakarak fark edilmez.

import type { PublicProfile } from "@/services/api/services/public-profile";

/**
 * Sosyal medya kullanici adindan bastaki @ isaretini temizler.
 *
 * Kullanici ikisini de yazabiliyor ve backend yalnizca onboarding'in
 * ucuncu adiminda temizliyor; /profile/update ucu degeri oldugu gibi
 * kaydediyor. Dolayisiyla temizlik burada da gerekli -- aksi halde
 * adres "twitter.com/@ad" olurdu.
 */
export function cleanHandle(value: string): string {
  return value.replace(/^@+/, "");
}

export type SocialKey = "twitter" | "instagram" | "linkedin";

const TABANLAR: Record<SocialKey, string> = {
  twitter: "https://twitter.com/",
  instagram: "https://instagram.com/",
  linkedin: "https://linkedin.com/in/",
};

export type SocialLink = {
  key: SocialKey;
  handle: string;
  href: string;
};

/** Profilde dolu olan sosyal hesaplari adresleriyle birlikte doner. */
export function socialLinks(profile: PublicProfile): SocialLink[] {
  const ham: Record<SocialKey, string | null | undefined> = {
    twitter: profile.twitter_username,
    instagram: profile.instagram_username,
    linkedin: profile.linkedin_username,
  };

  return (Object.keys(TABANLAR) as SocialKey[])
    .map((key) => {
      const handle = ham[key] ? cleanHandle(ham[key]!) : "";
      return { key, handle, href: `${TABANLAR[key]}${handle}` };
    })
    .filter((social) => social.handle.length > 0);
}

/**
 * Yapisal veride sameAs olarak verilecek adresler.
 *
 * Kisinin baska yerlerdeki varligini bu sayfaya bagliyor; bir "link in bio"
 * sayfasinin arama motoru icin asil anlami bu.
 */
export function sameAs(profile: PublicProfile): string[] {
  const adresler = socialLinks(profile).map((social) => social.href);
  if (profile.website) adresler.push(profile.website);
  return adresler;
}
