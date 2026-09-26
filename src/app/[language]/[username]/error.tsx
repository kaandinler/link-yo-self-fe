"use client";

/**
 * Herkese acik profil ACILAMADIGINDA gosterilen ekran.
 *
 * NEDEN VAR: onceden backend'e ulasilamayinca profil "yok" sayiliyor ve
 * 404 donuyordu. Artik bu durum ProfilGeciciHatasi olarak yukari
 * cikiyor ve bu sinir onu yakaliyor; yanitin durum kodu 5xx.
 *
 * Metin bilincli olarak "silinmedi" diyor: 404 sayfasini goren bir
 * ziyaretci profilin kaldirildigini dusunur; burada durum gecici.
 *
 * `reset` sayfayi yeniden cizmeyi deniyor; kesinti bittiyse profil
 * gelir.
 */

import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";

export default function ProfilAcilamadi({ reset }: { reset: () => void }) {
  const { t } = useTranslation("public-profile");

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-ink">{t("unavailable.title")}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{t("unavailable.body")}</p>
      <button
        type="button"
        onClick={reset}
        data-testid="profile-retry"
        className="mt-6 min-h-[44px] rounded-lg bg-purple-600 px-6 font-semibold text-white hover:bg-purple-700"
      >
        {t("unavailable.retry")}
      </button>
      {/* Profil rotasinda ust serit yok; bu sayfa cikmaz sokak olmasin. */}
      <Link
        href="/"
        className="mt-4 inline-flex min-h-[44px] items-center text-sm underline underline-offset-4"
      >
        {t("unavailable.home")}
      </Link>
    </main>
  );
}
