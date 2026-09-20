export const fallbackLanguage = "en" as const;
export const languages = [fallbackLanguage] as const;
export const defaultNamespace = "common";
export const cookieName = "i18next";

export function getOptions(
  language: string = fallbackLanguage,
  namespace = defaultNamespace
) {
  return {
    debug: process.env.NODE_ENV === "development",
    supportedLngs: languages,
    fallbackLng: fallbackLanguage,
    lng: language,
    fallbackNS: defaultNamespace,
    defaultNS: defaultNamespace,
    ns: namespace,
    interpolation: {
      // NEDEN KAPALI: i18next enterpolasyon degerlerini varsayilan
      // olarak HTML-escape ediyor ve bu listede "/" de var. React zaten
      // metin dugumlerini kendisi kaciriyor, yani bu ikinci kaciris
      // gereksiz -- ve zararli: "Asia/Tokyo" ekrana "Asia&#x2F;Tokyo"
      // olarak basiliyordu (best-times.spec.ts yakaladi).
      //
      // Guvenli: cevirilerin ciktisi hicbir yerde
      // dangerouslySetInnerHTML'e verilmiyor; isaretleme gereken
      // cumleler <Trans> kullaniyor.
      escapeValue: false,
    },
  };
}
