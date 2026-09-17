import Link from "next/link";
import { getServerTranslation } from "@/services/i18n";
import { fallbackLanguage } from "@/services/i18n/config";

/**
 * Uygulamanin 404 sayfasi.
 *
 * Bu dosyanin calisabilmesi icin kok layout'un src/app/layout.tsx'e tasinmasi
 * gerekti; daha once kok layout [language] segmentinin altindaydi ve
 * app/not-found.tsx "doesn't have a root layout" hatasi veriyordu. Onceki
 * durumda Next kendi sade 404 ekranini gosteriyordu.
 *
 * not-found.tsx params almadigi icin ceviriler varsayilan dil ile yukleniyor.
 */
export default async function NotFound() {
  const { t } = await getServerTranslation(fallbackLanguage, "common");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-ink-soft">404</p>
      <h1 className="mt-4 text-xl font-semibold">{t("error.notFound")}</h1>
      <Link
        href={`/${fallbackLanguage}`}
        className="mt-6 text-sm underline underline-offset-4"
      >
        {t("navigation.home")}
      </Link>
    </main>
  );
}
