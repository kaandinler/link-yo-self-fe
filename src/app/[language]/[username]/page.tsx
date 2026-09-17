import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerTranslation } from "@/services/i18n";
import { getPublicProfile } from "@/services/api/services/public-profile";
import type { PublicProfile } from "@/services/api/services/public-profile";
import { profileUrl } from "@/services/site-url";
import { sameAs } from "@/services/social-links";
import PublicProfilePage from "./page-content";
import ClickTrackerScript from "./click-tracker-script";

type Props = {
  params: Promise<{ language: string; username: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "common");
  const profile = await getPublicProfile(params.username);

  // Profil yoksa metadata uretmeye gerek yok; notFound() burada da
  // cagriliyor ki eksik profil icin baslik hesaplanmasin.
  if (!profile) notFound();

  const title =
    profile.page_title ?? `${profile.display_name} - ${t("app-name")}`;
  const description = profile.page_description ?? profile.bio ?? undefined;
  const url = profileUrl(params.language, profile.username);

  return {
    title,
    description,
    // Sayfanin tek dogru adresi. Ayni profile baska bir yoldan gelinirse
    // arama motoru iki ayri sayfa saymasin diye.
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      // Arama sonucunda kucuk bir kupur yerine buyuk gorsel cikabilsin.
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
      title,
      description,
      // og:url olmadan kaziyici sayfayi paylasilan adrese gore cozuyor;
      // takip parametreli bir baglanti kendi basina ayri bir sayfa gibi
      // gorunebiliyor.
      url,
      siteName: t("app-name"),
      type: "profile",
      username: profile.username,
      // images YOK: kart gorseli opengraph-image.tsx'ten geliyor. Ikisi
      // birden tanimlansaydi sayfa iki og:image bildirirdi.
    },
  };
}

/**
 * Arama motorlari icin yapisal veri.
 *
 * Bir "link in bio" sayfasinin arama motoru acisindan anlami, bir kisiyi
 * baska yerlerdeki hesaplariyla birlestirmesi. sameAs tam olarak bunu
 * soyluyor; metinden cikarilmasi beklenemez.
 */
function yapisalVeri(profile: PublicProfile, language: string, url: string) {
  const kisi = {
    "@type": "Person",
    name: profile.display_name,
    alternateName: `@${profile.username}`,
    ...(profile.bio ? { description: profile.bio } : {}),
    ...(profile.profile_image_url ? { image: profile.profile_image_url } : {}),
    ...(profile.website ? { url: profile.website } : {}),
    ...(sameAs(profile).length > 0 ? { sameAs: sameAs(profile) } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": url,
    url,
    inLanguage: language,
    mainEntity: kisi,
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const profile = await getPublicProfile(params.username);

  // Olmayan kullanici, silinmis hesap veya backend'e ulasilamamasi: 404.
  if (!profile) notFound();

  const url = profileUrl(params.language, profile.username);

  return (
    <>
      {/* Sayfa iceriginden once: tiklama kaydi React'i beklemeden hazir
          olmali (bkz. click-tracker-script.tsx). */}
      <ClickTrackerScript />
      <script
        type="application/ld+json"
        // JSON.stringify cikisinda "<" kacisliyor: kullanicidan gelen bir
        // deger icinde </script> gecerse betik erken kapanirdi.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            yapisalVeri(profile, params.language, url)
          ).replace(/</g, "\\u003c"),
        }}
      />
      <PublicProfilePage profile={profile} />
    </>
  );
}
