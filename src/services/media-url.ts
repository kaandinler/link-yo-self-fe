/**
 * Avatarlarin sunuldugu adres ve paylasim kartinin hangi avatari
 * SUNUCUDA indirebilecegi.
 *
 * NEDEN SINIR VAR: kart (opengraph-image.tsx) avatari Next sunucusunda
 * indiriyor. profile_image_url eskiden kullanicinin yazdigi serbest bir
 * adresti ve tek kontrol "http(s):// ile basliyor mu" idi; yani biri
 * avatarina http://api:8000/... ya da bulut metadata adresini yazarak
 * sunucumuza ic aga istek attirabiliyordu (SSRF). Backend artik bu alani
 * yalnizca yuklemeyle dolduruyor, ama eski dis adresler veritabaninda
 * duruyor olabilir. Kart yalnizca bizim medya kokumuzdeki dosyalari
 * indiriyor; digerleri icin bas harflere dusuyor.
 */

export type MedyaKokleri = {
  /** Tarayicinin gordugu kok, orn. https://api.linkyoself.com/media */
  acik: string;
  /** Next sunucusunun ayni dosyalara ulastigi kok (Docker'da farkli). */
  ic: string;
};

function originArtiMedya(api: string | undefined): string | null {
  if (!api) return null;
  try {
    return `${new URL(api).origin}/media`;
  } catch {
    return null;
  }
}

/**
 * Ortam degiskenlerinden medya kokleri.
 *
 * NEXT_PUBLIC_MEDIA_URL verilmisse (S3/CDN) o kullaniliyor; Next
 * sunucusu da ayni adrese gidiyor, MEDIA_URL_INTERNAL ile degistirilebilir.
 *
 * Verilmemisse backend'in yerel deposu varsayiliyor: dosyalar API'nin
 * /media yolunda. Acik kok NEXT_PUBLIC_API_URL'den, ic kok API_URL'den
 * turetiliyor -- konteynerde "localhost:8000" Next'in kendisi, backend'e
 * yigin icinden (http://api:8000) gidiliyor.
 *
 * `||` bilerek: docker-compose bos build arg'i bos dizge olarak geciriyor.
 */
export function medyaKokleri(
  ortam: Record<string, string | undefined> = {
    NEXT_PUBLIC_MEDIA_URL: process.env.NEXT_PUBLIC_MEDIA_URL,
    MEDIA_URL_INTERNAL: process.env.MEDIA_URL_INTERNAL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    API_URL: process.env.API_URL,
  }
): MedyaKokleri | null {
  const sondakiEgikCizgisiz = (s: string) => s.replace(/\/+$/, "");

  if (ortam.NEXT_PUBLIC_MEDIA_URL) {
    const acik = sondakiEgikCizgisiz(ortam.NEXT_PUBLIC_MEDIA_URL);
    return {
      acik,
      ic: sondakiEgikCizgisiz(ortam.MEDIA_URL_INTERNAL || acik),
    };
  }

  const acik = originArtiMedya(ortam.NEXT_PUBLIC_API_URL);
  if (!acik) return null;
  return {
    acik,
    ic: sondakiEgikCizgisiz(
      ortam.MEDIA_URL_INTERNAL ||
        originArtiMedya(ortam.API_URL || ortam.NEXT_PUBLIC_API_URL) ||
        acik
    ),
  };
}

/**
 * Kartin indirecegi adres; avatar bizim medya kokumuzde degilse null.
 *
 * Karsilastirma metin oneki uzerinden DEGIL, cozulmus URL uzerinden:
 * "https://cdn.ornek/media/../api/x" metin olarak oneki tasiyor ama
 * cozuldugunde /api/x. Sorgu ve parca (#) atiliyor; dosyayi belirleyen
 * yalnizca yol.
 */
export function kartIcinAvatarAdresi(
  adres: string | null | undefined,
  kokler: MedyaKokleri | null = medyaKokleri()
): string | null {
  if (!adres || !kokler) return null;

  let hedef: URL;
  let acik: URL;
  try {
    hedef = new URL(adres);
    acik = new URL(kokler.acik);
  } catch {
    return null;
  }

  const onek = `${acik.pathname.replace(/\/+$/, "")}/`;
  if (hedef.origin !== acik.origin || !hedef.pathname.startsWith(onek)) {
    return null;
  }

  return `${kokler.ic}/${hedef.pathname.slice(onek.length)}`;
}
