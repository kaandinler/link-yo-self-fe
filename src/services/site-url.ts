// Sayfanin herkese acik adresi.
//
// NEDEN GEREKLI: canonical, og:url ve uretilen kart gorselinin adresi mutlak
// olmali -- tarayici degil, Google ve Slack gibi kaziyicilar okuyor ve
// goreli bir yolu cozecek bir baglamlari yok.
//
// Deger derleme aninda gomuluyor (NEXT_PUBLIC_*), yani her ortam kendi
// adresiyle derleniyor. Tanimli degilse yerel adres kullaniliyor: boylece
// gelistirirken ve testte de mutlak adres uretiliyor, yalnizca alan adi
// farkli oluyor.
const VARSAYILAN = "http://localhost:3000";

/** Sondaki egik cizgi atiliyor; adresler `${SITE_URL}/en/...` diye kuruluyor. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? VARSAYILAN
).replace(/\/+$/, "");

/** Bir kullanicinin herkese acik profil adresi. */
export function profileUrl(language: string, username: string): string {
  return `${SITE_URL}/${language}/${encodeURIComponent(username)}`;
}
