import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldCheck, FileText } from "lucide-react";
import { getServerTranslation } from "@/services/i18n";

/**
 * Iletisim.
 *
 * NEDEN BASTAN YAZILDI -- SAYFA UYDURMA BILGI YAYINLIYORDU:
 *   - Uc fiziksel ofis, sokak adresleriyle: "123 Innovation Drive,
 *     San Francisco CA 94105" (merkez), "456 Business Avenue, New
 *     York", "789 Tech Street, London". Hicbiri yok.
 *   - Telefon destegi: "Monday - Friday, 9AM - 6PM EST".
 *   - Canli sohbet: "Available 9AM - 6PM EST".
 *   - Yanit suresi sozu: "within 24 hours", "typically respond within
 *     2-4 hours".
 *
 * Bunlar yanlis sirket adindan daha agir: biri bir ofise gitmeye
 * kalkabilir ya da telefonla aramayi bekleyebilir.
 *
 * FORM DA KALDIRILDI. <form> etiketinin onSubmit'i YOKTU, yani
 * yazilan mesaj hicbir yere gitmiyordu ve gonder'e basmak sayfayi
 * yeniliyordu. Sessizce yutan bir form, formsuz olmaktan kotu.
 *
 * Geriye dogrulanabilir tek kanal kaldi: e-posta. Adres gizlilik
 * politikasindakiyle ayni; iki sayfa farkli adres gosterirse
 * hangisinin dogru oldugu belirsiz kalir.
 */

const CONTACT_EMAIL = "support@linkyoself.com";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "contact");

  return { title: t("title") };
}

export default async function ContactPage(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "contact");

  return (
    <div className="min-h-screen bg-page">
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-4xl font-black text-ink md:text-5xl">
            {t("intro.heading")}
          </h1>
          <p className="text-xl text-ink-soft">{t("intro.body")}</p>

          <div className="mt-12 space-y-8">
            <section className="rounded-2xl border border-line bg-surface/50 p-8">
              <div className="mb-3 flex items-center gap-3">
                <Mail className="h-6 w-6 text-ink-soft" />
                <h2 className="text-xl font-bold text-ink">
                  {t("email.heading")}
                </h2>
              </div>
              <p className="mb-4 text-ink-soft">{t("email.body")}</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex min-h-[44px] items-center font-medium text-blue-400 transition-colors hover:text-blue-300"
              >
                {CONTACT_EMAIL}
              </a>
            </section>

            <section className="rounded-2xl border border-line bg-surface/50 p-8">
              <div className="mb-3 flex items-center gap-3">
                <FileText className="h-6 w-6 text-ink-soft" />
                <h2 className="text-xl font-bold text-ink">
                  {t("privacy.heading")}
                </h2>
              </div>
              <p className="mb-4 text-ink-soft">{t("privacy.body")}</p>
              <Link
                href="/privacy-policy"
                className="inline-flex min-h-[44px] items-center font-medium text-blue-400 transition-colors hover:text-blue-300"
              >
                {t("privacy.link")}
              </Link>
            </section>

            <section className="rounded-2xl border border-line bg-surface/50 p-8">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-ink-soft" />
                <h2 className="text-xl font-bold text-ink">
                  {t("security.heading")}
                </h2>
              </div>
              <p className="text-ink-soft">{t("security.body")}</p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
