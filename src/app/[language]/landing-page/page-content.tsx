"use client";

/**
 * Karsilama sayfasi.
 *
 * NEDEN BASTAN YAZILDI:
 *   - "Join thousands of creators" iki ayri yerde geciyordu. Kac
 *     kullanici oldugunu bilmiyoruz; canli sayfada duran bir iddiaydi.
 *   - Metnin tamami sabit Ingilizce'ydi, i18n'in disindaydi. Dil
 *     dugmesi urunun geri kalanini cevirirken burasi Ingilizce
 *     kaliyordu.
 *   - Footer'da /terms'e bir baglanti vardi; O SAYFA YOK, yani
 *     baglanti 404'e gidiyordu.
 *
 * OZELLIK LISTESI KODDAN CIKARILDI. Her madde uruncte bugun mevcut
 * olan bir sey anlatiyor; "unlimited" gibi olculemeyen bir soz
 * verilmedi.
 */

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useTranslation } from "@/services/i18n/client";

const OZELLIKLER = [
  { anahtar: "links", Simge: LinkIcon },
  { anahtar: "social", Simge: Users },
  { anahtar: "design", Simge: Palette },
  { anahtar: "analytics", Simge: BarChart3 },
  { anahtar: "preview", Simge: ImageIcon },
  { anahtar: "adult", Simge: ShieldAlert },
] as const;

export default function LandingPage() {
  const { t } = useTranslation("landing-page");

  return (
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page">
      <section className="relative px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-surface/50 px-4 py-2 backdrop-blur-sm">
            <LinkIcon className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-ink-soft">{t("hero.eyebrow")}</span>
          </div>

          <h1 className="mb-6 text-4xl font-black leading-tight text-ink md:text-6xl lg:text-7xl">
            {t("hero.heading")}
          </h1>

          <p className="mb-8 text-xl leading-relaxed text-ink-soft md:text-2xl">
            {t("hero.body")}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/sign-up">
              <button className="flex min-h-[44px] w-full items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-bold text-white shadow-2xl transition-all duration-200 hover:from-purple-700 hover:to-pink-700 sm:w-auto">
                {t("hero.primary")}
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <Link href="/about">
              <button className="min-h-[44px] w-full rounded-xl border border-line-strong bg-surface-raised px-8 py-4 text-lg font-semibold text-ink transition-all duration-200 hover:bg-field sm:w-auto">
                {t("hero.secondary")}
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl font-black text-ink md:text-5xl">
              {t("features.heading")}
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-ink-soft">
              {t("features.body")}
            </p>
          </div>

          <div
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            data-testid="landing-features"
          >
            {OZELLIKLER.map(({ anahtar, Simge }) => (
              <div
                key={anahtar}
                className="rounded-2xl border border-line bg-surface/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <Simge className="h-8 w-8 text-ink" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-ink">
                  {t(`features.${anahtar}.title`)}
                </h3>
                <p className="leading-relaxed text-ink-soft">
                  {t(`features.${anahtar}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl border border-line bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-12 shadow-2xl backdrop-blur-sm">
            <h2 className="mb-6 text-3xl font-black text-ink md:text-5xl">
              {t("cta.heading")}
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-ink-soft">
              {t("cta.body")}
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/sign-up">
                <button className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-bold text-white shadow-2xl transition-all duration-200 hover:from-purple-700 hover:to-pink-700 sm:w-auto">
                  {t("cta.primary")}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="min-h-[44px] w-full rounded-xl border border-line-strong bg-surface-raised px-8 py-4 text-lg font-semibold text-ink transition-all duration-200 hover:bg-field sm:w-auto">
                  {t("cta.secondary")}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-line px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <LinkIcon className="h-5 w-5 text-ink" />
              </div>
              <span className="text-xl font-bold text-ink">{t("title")}</span>
            </div>

            {/*
              /terms KALDIRILDI: o sayfa yok, yani baglanti 404'e
              gidiyordu. Sayfa yazilinca geri eklenebilir.
            */}
            <div className="flex items-center gap-8">
              <Link
                href="/about"
                className="inline-flex min-h-[44px] items-center text-ink-muted transition-colors hover:text-ink"
              >
                {t("footer.about")}
              </Link>
              <Link
                href="/privacy-policy"
                className="inline-flex min-h-[44px] items-center text-ink-muted transition-colors hover:text-ink"
              >
                {t("footer.privacy")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
