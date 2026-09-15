// Public profil sayfasinin tema kurallari.
//
// TEK KAYNAK: hem yayindaki sayfa (app/[language]/[username]) hem de
// duzenleme ekranindaki onizleme (app/[language]/profile/customize) bu
// modulu kullaniyor. Ayri ayri yazilsalardi onizleme "dogru" gorunup
// yayindaki sayfa baska turlu cizebilirdi.

export const DEFAULT_THEME_COLOR = "#1383eb";
export const DEFAULT_BACKGROUND = "#ffffff";

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
  textColor: string;
  mutedTextColor: string;
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
    textColor: onLightBackground ? "text-gray-900" : "text-white",
    mutedTextColor: onLightBackground ? "text-gray-600" : "text-gray-200",
  };
}
