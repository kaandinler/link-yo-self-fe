// Public profil sayfasinin tema kurallari.
//
// TEK KAYNAK: hem yayindaki sayfa (app/[language]/[username]) hem de
// duzenleme ekranindaki onizleme (app/[language]/profile/customize) bu
// modulu kullaniyor. Ayri ayri yazilsalardi onizleme "dogru" gorunup
// yayindaki sayfa baska turlu cizebilirdi.

export const DEFAULT_THEME_COLOR = "#1383eb";
export const DEFAULT_BACKGROUND = "#ffffff";

/**
 * Metin renkleri.
 *
 * NEDEN SINIF ADI DEGIL DEGER: Bu modul bir sure "text-gray-900" gibi
 * Tailwind sinif adlari donduruyordu. Tailwind kullanilmayan siniflari
 * uretmiyor ve src/services taranan yollarda olmadigi icin o siniflar
 * yalnizca *baska* sayfalar da ayni tonu kullandigi surece, yani kazara
 * uretiliyordu. Sayfalar anlamsal token'lara gecip son kullanim kalkinca
 * siniflar CSS'ten dustu ve herkese acik profil sayfasinda isim, kullanici
 * adi ve bio beyaz zemine beyaz yazildi -- derleme, lint ve butun testler
 * temiz geciyordu.
 *
 * Deger dondurmek bu hata sinifini tamamen ortadan kaldiriyor: renk artik
 * Tailwind'in neyi taradigina ya da urettigine bagli degil.
 *
 * Degerler Tailwind'in gri paletinden, onceki gorunumun aynisi olsun diye.
 */
const KOYU_METIN = "#111827"; // gray-900
const KOYU_METIN_SONUK = "#4b5563"; // gray-600
const ACIK_METIN = "#ffffff";
const ACIK_METIN_SONUK = "#e5e7eb"; // gray-200

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/** Backend'in kabul ettigi arka plan tipleri (core/validators.py). */
export const BACKGROUND_TYPES = ["color", "gradient", "image"] as const;
export type BackgroundType = (typeof BACKGROUND_TYPES)[number];

/** Kullanici verisinden gelen rengi yalnizca gecerli hex ise kabul eder. */
export function safeColor(
  value: string | null | undefined,
  fallback: string
): string {
  return value && HEX_COLOR.test(value) ? value : fallback;
}

/**
 * Arka plan gorseli icin URL'i dogrular.
 *
 * Deger CSS'e `url(...)` icinde girdigi icin serbest birakilirsa stil
 * enjeksiyonuna acik olur; sadece http(s) adreslerine ve icinde tirnak veya
 * parantez olmayan degerlere izin veriyoruz. Backend de ayni kurali
 * uyguluyor (core.validators.validate_background_value).
 */
export function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return null;
  if (/["'()\\]/.test(value)) return null;
  return value;
}

/**
 * Arka plan acik mi koyu mu; metin renginin okunabilir kalmasi icin.
 * Kullanici herhangi bir renk secebildiginden sabit bir metin rengi
 * kullanilamiyor.
 */
export function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // ITU-R BT.601 luma
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

export type ThemeInput = {
  theme_color?: string | null;
  background_type?: string | null;
  background_value?: string | null;
};

export type ResolvedTheme = {
  themeColor: string;
  backgroundColor: string;
  pageStyle: React.CSSProperties;
  /** Zemin acik renkse metin koyu olmali. */
  onLightBackground: boolean;
  /** Birincil metin (isim, sosyal ikonlar). */
  textStyle: React.CSSProperties;
  /** Ikincil metin (kullanici adi, bio, altbilgi). */
  mutedTextStyle: React.CSSProperties;
};

/** Profil verisinden sayfanin gercekte kullandigi tema degerlerini uretir. */
export function resolveTheme(profile: ThemeInput): ResolvedTheme {
  const themeColor = safeColor(profile.theme_color, DEFAULT_THEME_COLOR);
  const backgroundColor = safeColor(
    profile.background_value,
    DEFAULT_BACKGROUND
  );
  const backgroundImage = safeImageUrl(profile.background_value);

  const pageStyle: React.CSSProperties = (() => {
    if (profile.background_type === "image" && backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    if (profile.background_type === "gradient") {
      return {
        backgroundImage: `linear-gradient(160deg, ${backgroundColor}, ${themeColor})`,
      };
    }
    return { backgroundColor };
  })();

  // Gorselin uzerindeki metin her zaman acik renk; duz/gradient zeminde
  // zeminin parlakligina gore karar veriyoruz.
  const onLightBackground =
    profile.background_type === "image" ? false : isLightColor(backgroundColor);

  return {
    themeColor,
    backgroundColor,
    pageStyle,
    onLightBackground,
    // SABIT DEGERLER, tema token'i degil: bu renkleri ziyaretcinin
    // acik/koyu tercihi degil, profil sahibinin sectigi arka plan
    // belirliyor (onLightBackground). Token kullanilsaydi koyu zeminli bir
    // profili acik temadaki bir ziyaretci koyu metinle, yani okunmaz
    // gorurdu.
    textStyle: { color: onLightBackground ? KOYU_METIN : ACIK_METIN },
    mutedTextStyle: {
      color: onLightBackground ? KOYU_METIN_SONUK : ACIK_METIN_SONUK,
    },
  };
}
