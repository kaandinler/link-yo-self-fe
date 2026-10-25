/**
 * Next sunucusundan backend'e, BIR KULLANICI ISTEGI ADINA giden cagrilar:
 * vekil (/api/proxy) ve oturum ucu (/api/auth/session).
 *
 * SORUN (olculdu, bkz. backend docs/ROADMAP.md "istemci-ip"): bu cagrilar
 * backend'e istemcinin degil Next konteynerinin adresiyle variyordu.
 * Backend'in hiz siniri IP basina sayiyor; yani butun site TEK bir IP gibi
 * gorunuyor ve sinirlar herkes icin ortak bir sayaca dusuyordu:
 *
 *   giris           15 dk'da 20 basarisiz   -> herkesin girisi kilitlenir
 *   kayit           saatte 5                -> butun site saatte 5 hesap
 *   sifre sifirlama saatte 5 e-posta        -> butun site icin
 *   e-posta dogrulama / sifirlama token'i saatte 10
 *
 * COZUM: bu cagrilar backend'e YIGIN ICINDEN (API_URL_INTERNAL, orn.
 * http://api:8000/api) gidiyor ve istemcinin adresini tasiyor.
 *
 *   tarayici -> Caddy -> Next -> api        (bu dosya)
 *   tarayici -> Caddy -> api                (tiklama sayaci, dogrudan)
 *
 * Caddy guvenmedigi bir istemciden gelen X-Forwarded-For'u ATIYOR ve
 * yerine gordugu adresi yaziyor; Next bu degeri oldugu gibi iletiyor.
 * Iki yolda da backend'in gordugu basligin sagdan 1. elemani istemcinin
 * adresi; backend'in TRUSTED_PROXY_COUNT=1'i ikisinde de dogru.
 *
 * NEDEN CADDY UZERINDEN DEGIL: Next Caddy'ye https://api.DOMAIN ile
 * gitseydi Caddy, Next'i de guvenilmeyen bir istemci sayip basligi Next'in
 * adresiyle ezerdi. Next'e guvenmesini soylemek (trusted_proxies) bu yolda
 * basligi iki elemanli yapar, dogrudan yolda tek elemanli birakir; backend
 * ikisini ayiramazdi.
 *
 * API_URL_INTERNAL verilmemisse (yerel gelistirme) davranis eskisi gibi:
 * API_URL kullaniliyor. Basligi iletmek orada da zararsiz; gelistirmede
 * backend'in TRUSTED_PROXY_COUNT'u 0 ve baslik hic okunmuyor.
 */

export const BACKEND_URL =
  process.env.API_URL_INTERNAL ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL;

/**
 * Yigin icinden (duz HTTP) mi gidiliyor?
 *
 * Oyleyse backend'e "asil baglanti https idi" demek gerekiyor: uretimde
 * HTTPSRedirectMiddleware duz HTTP istegini https://api:8000'e yonlendirir
 * ve o adres yok. Bu beyan dogru: Next'e gelen her istek Caddy'nin TLS'i
 * sonlandirdigi bir baglantidan geliyor (Caddy http'yi https'e
 * yonlendiriyor, Next'in portu disari kapali).
 */
const YIGIN_ICINDEN = Boolean(process.env.API_URL_INTERNAL);

/**
 * Backend'e iletilecek basliklar: istemcinin adresi ve protokol.
 *
 * Verilen `basliklar` nesnesine yaziyor ve onu donduruyor; Authorization,
 * dil gibi digerleri cagiranda kaliyor.
 */
export function istemciBasliklari(
  request: Request,
  basliklar: Headers = new Headers()
): Headers {
  const adres = request.headers.get("x-forwarded-for");
  if (adres) basliklar.set("x-forwarded-for", adres);

  if (YIGIN_ICINDEN) basliklar.set("x-forwarded-proto", "https");

  return basliklar;
}
