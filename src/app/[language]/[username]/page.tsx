import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerTranslation } from "@/services/i18n";
import { getPublicProfile } from "@/services/api/services/public-profile";
import PublicProfilePage from "./page-content";

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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: profile.profile_image_url
        ? [profile.profile_image_url]
        : undefined,
    },
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const profile = await getPublicProfile(params.username);

  // Olmayan kullanici, silinmis hesap veya backend'e ulasilamamasi: 404.
  if (!profile) notFound();

  return <PublicProfilePage profile={profile} />;
}
