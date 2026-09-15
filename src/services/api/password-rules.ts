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

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 50;

/** Backend'in kullanici adi deseni: harf, rakam, alt cizgi, nokta, tire. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export type PasswordRule = {
  key: "lowercase" | "uppercase" | "number" | "length";
  /** Kayit formundaki canli kontrol listesinde gorunen kisa etiket. */
  label: string;
  test: (password: string) => boolean;
  /** Kural saglanmadiginda gosterilecek tam mesaj. */
  message: string;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    key: "lowercase",
    label: "Lowercase",
    test: (password) => /[a-z]/.test(password),
    message: "Password must contain at least one lowercase letter",
  },
  {
    key: "uppercase",
    label: "Uppercase",
    test: (password) => /[A-Z]/.test(password),
    message: "Password must contain at least one uppercase letter",
  },
  {
    key: "number",
    label: "Number",
    test: (password) => /\d/.test(password),
    message: "Password must contain at least one number",
  },
  {
    key: "length",
    label: `${PASSWORD_MIN_LENGTH}+ chars`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  },
];

/** Ilk saglanmayan kuralin mesaji; hepsi saglaniyorsa null. */
export function getPasswordError(password: string): string | null {
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`;
  }

  return PASSWORD_RULES.find((rule) => !rule.test(password))?.message ?? null;
}
