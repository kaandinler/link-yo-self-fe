// Sifre ve kullanici adi kurallari.
//
// TEK KAYNAK backend (core/validators.py); burasi onun aynasi. Amac
// kullaniciya sunucuya gitmeden geri bildirim vermek -- son soz her zaman
// backend'in.
//
// ONCEDEN AYRISMISTI: kayit formu 8 karakter + buyuk/kucuk harf + rakam
// isterken diger sifre alanlari (sifre sifirlama, profil, admin paneli) 6
// karakter yetiyor diyordu; backend de 6'da kaliyordu. Kullanici formda
// reddedilen bir sifreyi baska bir uctan sorunsuz belirleyebiliyordu.
//
// METINLER BURADA DEGIL, CEVIRIDE: kurallar yalnizca ANAHTAR tasiyor ve
// cagiran taraf kendi `t`'siyle cozuyor. Metinler burada sabit kalsaydi
// bes ayri bilesende gorunen bu mesajlar hicbir zaman cevrilemezdi.
// Anahtarlar common.json'da; i18next yapilandirmasinda fallbackNS
// "common" oldugu icin her bilesen kendi namespace'iyle de cozebiliyor.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 50;

/** Backend'in kullanici adi deseni: harf, rakam, alt cizgi, nokta, tire. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/**
 * Ceviri fonksiyonu.
 *
 * i18next'in `t`'si ile uyumlu en dar imza: bu modulun react-i18next'e
 * bagimli olmasina gerek yok, cagiran taraf kendi `t`'sini veriyor.
 */
export type Ceviri = (
  anahtar: string,
  secenekler?: Record<string, unknown>
) => string;

export type PasswordRule = {
  key: "lowercase" | "uppercase" | "number" | "length";
  /** Kayit formundaki canli kontrol listesinde gorunen kisa etiket. */
  labelKey: string;
  test: (password: string) => boolean;
  /** Kural saglanmadiginda gosterilecek tam mesajin anahtari. */
  messageKey: string;
  /** Anahtarin icindeki {{min}} gibi yer tutucular. */
  params?: Record<string, unknown>;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    key: "lowercase",
    labelKey: "password.labels.lowercase",
    test: (password) => /[a-z]/.test(password),
    messageKey: "password.errors.lowercase",
  },
  {
    key: "uppercase",
    labelKey: "password.labels.uppercase",
    test: (password) => /[A-Z]/.test(password),
    messageKey: "password.errors.uppercase",
  },
  {
    key: "number",
    labelKey: "password.labels.number",
    test: (password) => /\d/.test(password),
    messageKey: "password.errors.number",
  },
  {
    key: "length",
    labelKey: "password.labels.length",
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
    messageKey: "password.errors.length",
    params: { min: PASSWORD_MIN_LENGTH },
  },
];

/** Canli kontrol listesi icin cozulmus etiketler. */
export function passwordRuleLabels(t: Ceviri) {
  return PASSWORD_RULES.map((rule) => ({
    key: rule.key,
    label: t(rule.labelKey, rule.params),
    test: rule.test,
  }));
}

/** Ilk saglanmayan kuralin mesaji; hepsi saglaniyorsa null. */
export function getPasswordError(password: string, t: Ceviri): string | null {
  if (password.length > PASSWORD_MAX_LENGTH) {
    return t("password.errors.max", { max: PASSWORD_MAX_LENGTH });
  }

  const bozulan = PASSWORD_RULES.find((rule) => !rule.test(password));
  return bozulan ? t(bozulan.messageKey, bozulan.params) : null;
}
