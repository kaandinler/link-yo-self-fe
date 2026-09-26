import type { Metadata } from "next";
import Link from "next/link";
import { getServerTranslation } from "@/services/i18n";

/**
 * Hakkinda.
 *
 * NEDEN BASTAN YAZILDI: sayfa uydurma sayilar yayinliyordu --
 * "10,000+ Active Users" ve "1M+ Links Shared". Ikisi de hicbir yerden
 * olculmuyordu; canli sayfada duran birer iddiaydilar.
 *
 * YERINE SAYI KONMADI. Dogru sayiyi bilmiyorum ve tahmin etmek ayni
 * hatayi tekrarlamak olurdu. Sayfa artik olculebilir seylerden
 * bahsediyor: urunun NE YAPTIGI (hepsi kodda mevcut) ve sayilarin
 * nasil sayildigi.
 *
 * Bir bolum de bilincli olarak "ne DEGIL" diyor. Pazarlama sayfalari
 * genelde bunu atlar; atlamak, urunu deneyip yanlis beklentiyle
 * ayrilan kullanicilar uretiyor.
 *
 * EKSIK KALAN: sirket hikayesi, ekip, kurulus -- bunlari bilmiyorum
 * ve uydurmadim. Sahibinden gelmesi gerekiyor.
 */

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "about");

  return { title: t("title") };
}

export default async function AboutPage(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "about");

  const neYapiyor = ["item1", "item2", "item3", "item4", "item5"];
  const sayilar = ["item1", "item2", "item3"];

  return (
    <div className="min-h-screen bg-page">
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-4xl font-black text-ink md:text-5xl">
            {t("intro.heading")}
          </h1>
          <p className="text-xl text-ink-soft">{t("intro.body")}</p>

          <section className="mt-14">
            <h2 className="mb-4 text-2xl font-bold text-ink">
              {t("what.heading")}
            </h2>
            <p className="mb-4 text-ink-soft">{t("what.body")}</p>
            <ul className="list-disc space-y-2 pl-6 text-ink-soft">
              {neYapiyor.map((anahtar) => (
                <li key={anahtar}>{t(`what.${anahtar}`)}</li>
              ))}
            </ul>
          </section>

          <section className="mt-14">
            <h2 className="mb-4 text-2xl font-bold text-ink">
              {t("measurement.heading")}
            </h2>
            <p className="mb-4 text-ink-soft">{t("measurement.body")}</p>
            <ul
              className="list-disc space-y-2 pl-6 text-ink-soft"
              data-testid="about-measurement"
            >
              {sayilar.map((anahtar) => (
                <li key={anahtar}>{t(`measurement.${anahtar}`)}</li>
              ))}
            </ul>
          </section>

          <section className="mt-14">
            <h2 className="mb-4 text-2xl font-bold text-ink">
              {t("notYet.heading")}
            </h2>
            <p className="text-ink-soft" data-testid="about-not-yet">
              {t("notYet.body")}
            </p>
          </section>

          <section className="mt-14">
            <h2 className="mb-4 text-2xl font-bold text-ink">
              {t("contact.heading")}
            </h2>
            <p className="mb-2 text-ink-soft">{t("contact.body")}</p>
            <Link
              href="/contact"
              className="inline-flex min-h-[44px] items-center font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              {t("contact.heading")}
            </Link>
          </section>
        </div>
      </section>
    </div>
  );
}
