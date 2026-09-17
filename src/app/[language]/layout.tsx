import { languages } from "@/services/i18n/config";
import { getServerTranslation } from "@/services/i18n";
import { SITE_URL } from "@/services/site-url";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "common");

  return {
    // Alt sayfalarin goreli adreslerini (canonical, uretilen kart gorseli)
    // mutlaklastiran taban. Tanimli olmazsa Next uyari basip localhost
    // varsayiyor, yani yayindaki kart gorseli yanlis adresi gosterirdi.
    metadataBase: new URL(SITE_URL),
    title: t("title"),
  };
}

export function generateStaticParams() {
  return languages.map((language) => ({ language }));
}

/**
 * Dil segmentinin layout'u.
 *
 * <html>/<body> ve provider'lar artik src/app/layout.tsx'te; kok layout'un
 * dinamik bir segmentin altinda olmasi notFound()'un dogru 404 durum kodu
 * dondurmesini engelliyordu. Burada yalnizca dile bagli metadata ve
 * generateStaticParams kaliyor.
 */
export default function LanguageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
