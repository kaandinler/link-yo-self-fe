// Profilin paylasim karti (1200x630).
//
// NEDEN URETILIYOR: kart gorseli olarak profil avatarini vermek iki
// sekilde yetersizdi. Avatari olmayan profil -- yani yeni acilan her
// profil -- hic gorsel uretmiyordu ve Twitter karti summary_large_image
// yerine kucuk summary'ye dusuyordu; avatari olan profilde ise kare bir
// gorsel 1200x630'luk bir alana sikistiriliyordu.
//
// Burada uretilen kart her iki durumu da cozuyor: profilin kendi temasi,
// adi, kullanici adi ve bio'su ile dogru en-boy oraninda bir gorsel.
//
// Dosya adi bir Next kurali: og:image, og:image:width/height ve
// og:image:alt etiketlerini Next bu dosyadan uretiyor. Bu yuzden
// page.tsx'teki openGraph.images alani kaldirildi -- ikisi birden
// olsaydi sayfa iki gorsel bildirirdi.
//
// +18 UYARISI OLAN PROFIL: kart, sayfanin ara ekranini gormeyen tek
// yer. Onizleme sohbet penceresinde ya da akista kendiliginden aciliyor
// ve ziyaretci hicbir sey onaylamis olmuyor. Bu yuzden uyari acikken
// kart iki seyi disarida birakiyor: avatar (sahibinin verdigi rastgele
// bir dis gorsel) ve bio (yine sahibinin yazdigi serbest metin). Ad ve
// kullanici adi kaliyor -- ikisi de zaten paylasilan adresin icinde.
// Yerine acik bir "18+" rozeti giriyor: onizleme sessizce siradan bir
// kart gostermek yerine uyariyi kendisi tasiyor.

import { ImageResponse } from "next/og";
import {
  getPublicProfileForCard,
  KART_ONBELLEK_SANIYE,
  ProfilGeciciHatasi,
  type PublicProfile,
} from "@/services/api/services/public-profile";
import {
  isLightColor,
  safeColor,
  DEFAULT_BACKGROUND,
  DEFAULT_THEME_COLOR,
} from "@/services/profile-theme";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Profile";

/**
 * Kart bir saat boyunca yeniden uretilmeden servis edilebilir.
 *
 * NEDEN ONBELLEK: sayfanin kendisi bilerek onbellege alinmiyor (profil
 * duzenlenince hemen guncel gorunmeli), ama kart oyle degil. Uretimi
 * pahali -- gorsel cizimi artı avatarin indirilmesi -- ve ayni baglanti
 * her paylasildiginda yeniden isteniyor. Sayfa "no-store" oldugu icin
 * Next bu yola da varsayilan olarak onbelleklenmez basligi koyuyordu.
 *
 * Bedeli: avatarini degistiren kullanicinin karti en fazla bir saat eski
 * kalabiliyor. Sayfanin kendisi aninda guncelleniyor.
 */
const ONBELLEK = {
  "cache-control": `public, max-age=${KART_ONBELLEK_SANIYE}, stale-while-revalidate=86400`,
};

/**
 * Profil gecici olarak alinamadiginda verilen genel kartin basligi.
 *
 * ONBELLEGE GIRMEMELI. Onceden bu durumda da ONBELLEK basligi
 * kullaniliyordu; olculdu -- backend kapaliyken var olan bir profilin
 * karti genel gorselle ve "public, max-age=3600,
 * stale-while-revalidate=86400" ile donuyordu. Kaziyici (Slack,
 * Facebook) o yanlis karti saklayip gunlerce gosterebilir; kesinti bir
 * dakika surse bile.
 *
 * Genel gorsel yine donuyor: bozuk bir gorsel adresi birakmaktan iyi.
 * Ama "bunu sakla" demiyor.
 */
const SAKLAMA = { "cache-control": "no-store" };

type Props = {
  params: Promise<{ language: string; username: string }>;
};

/** Ada gore bas harfler; avatar yoksa onun yerine yaziliyor. */
function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Avatari data URI'ye cevirir; basarisiz olursa null.
 *
 * NEDEN ONCEDEN INDIRILIYOR: gorsel adresini dogrudan <img src> olarak
 * vermek, adres ulasilamaz oldugunda butun kartin uretimini dusuruyor --
 * ve adres kullanicinin yazdigi rastgele bir dis adres. Burada indirme
 * basarisiz olursa kart bas harflerle ciziliyor, yani kart her halukarda
 * uretiliyor.
 *
 * Zaman asimi var: yavas bir sunucu paylasim kartini bekletmemeli.
 */
async function avatarDataUri(url: string | null | undefined) {
  if (!url || !/^https?:\/\//i.test(url)) return null;

  try {
    const yanit = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      // Kartin tazelik penceresiyle ayni: gorsel her istekte yeniden
      // indirilmesin. Olcum (art arda dort kart istegi): indirme 4 -> 1.
      //
      // 2 MB'tan buyuk gorseller Next'in veri onbellegine girmiyor;
      // olculdu, 2,32 MB'lik bir avatar dort istekte dort kez indi ve
      // hicbir uyari cikmadi. Yani buyuk avatar icin davranis
      // degismiyor, kucuk olanlar icin kazaniliyor.
      next: { revalidate: KART_ONBELLEK_SANIYE },
    });
    if (!yanit.ok) return null;

    const tur = yanit.headers.get("content-type") ?? "";
    if (!tur.startsWith("image/")) return null;

    const veri = await yanit.arrayBuffer();
    // 4 MB ustu gorseller karta gomulmuyor: uretim yavaslar ve cikti buyur.
    if (veri.byteLength > 4 * 1024 * 1024) return null;

    return `data:${tur};base64,${Buffer.from(veri).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image(props: Props) {
  const params = await props.params;
  // "Yok" ile "bilinmiyor" ayri: yoksa genel kart onbelleklenebilir,
  // bilinmiyorsa genel kart ama saklanmaz (bkz. SAKLAMA).
  let profile: PublicProfile | null;
  let basliklar = ONBELLEK;
  try {
    profile = await getPublicProfileForCard(params.username);
  } catch (hata) {
    if (!(hata instanceof ProfilGeciciHatasi)) throw hata;
    profile = null;
    basliklar = SAKLAMA;
  }

  // Profil yoksa da bir gorsel donmeli: burada throw etmek kaziyiciya
  // bozuk bir gorsel adresi birakirdi.
  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#111827",
            color: "#ffffff",
            fontSize: 48,
          }}
        >
          Link Yo Self
        </div>
      ),
      { ...size, headers: basliklar }
    );
  }

  const themeColor = safeColor(profile.theme_color, DEFAULT_THEME_COLOR);
  const backgroundColor = safeColor(
    profile.background_value,
    DEFAULT_BACKGROUND
  );

  // Zemin gorseli olan profilde duz renge dusuluyor: kartta ikinci bir dis
  // gorseli indirmek uretimi hem yavaslatir hem kirilganlastirir.
  const background =
    profile.background_type === "gradient"
      ? `linear-gradient(160deg, ${backgroundColor}, ${themeColor})`
      : backgroundColor;

  // Metin rengini ziyaretcinin degil profil sahibinin zemini belirliyor;
  // sayfanin kendisiyle ayni kural (bkz. profile-theme.ts).
  const acikZemin =
    profile.background_type === "image" ? false : isLightColor(backgroundColor);
  const metin = acikZemin ? "#111827" : "#ffffff";
  const sonuk = acikZemin ? "#4b5563" : "#e5e7eb";

  const uyariVar = profile.adult_warning_enabled;

  // Uyari acikken avatar CIZILMIYOR degil, HIC INDIRILMIYOR: indirip
  // atmak, uc saniyeye kadar bekleyip sonucu cope atmak olurdu.
  const avatar = uyariVar
    ? null
    : await avatarDataUri(profile.profile_image_url);
  const bio = uyariVar ? "" : (profile.page_description ?? profile.bio ?? "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          background,
          color: metin,
        }}
      >
        {avatar ? (
          // <img> + objectFit DEGIL: Satori objectFit'i uygulamiyor ve
          // kare olmayan bir avatar cembere kirpilmak yerine icine
          // sigdiriliyordu -- yanlarda beyaz bantlarla. backgroundSize
          // "cover" ise calisiyor (gorselle dogrulandi).
          <div
            style={{
              display: "flex",
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundImage: `url(${avatar})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: 90,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: themeColor,
              color: "#ffffff",
              fontSize: 72,
              fontWeight: 700,
            }}
          >
            {initials(profile.display_name)}
          </div>
        )}

        {/* DIKKAT - display: flex: Satori, birden fazla cocugu olan her
            div'de acik bir display istiyor ve aksi halde butun gorseli
            uretmeyi reddediyor. Ayni sebeple kullanici adi tek bir dizge
            olarak veriliyor: JSX'te "@{ad}" iki ayri cocuk dugum demek ve
            kart 500 donuyordu. */}
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          {profile.display_name}
        </div>

        <div
          style={{ display: "flex", marginTop: 8, fontSize: 32, color: sonuk }}
        >
          {`@${profile.username}`}
        </div>

        {uyariVar ? (
          // Renkler temadan DEGIL sabit: uyari rozeti, sahibinin sectigi
          // zeminde okunaksiz kalabilecegi bir yerde duramaz.
          <div
            style={{
              display: "flex",
              marginTop: 24,
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 999,
              backgroundColor: "#111827",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            18+ content warning
          </div>
        ) : null}

        {bio ? (
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 28,
              color: sonuk,
              textAlign: "center",
              // Satori'de satir kirpma yok; uzun bio'yu kendimiz kisaltiyoruz.
              maxWidth: 900,
            }}
          >
            {bio.length > 120 ? `${bio.slice(0, 117)}...` : bio}
          </div>
        ) : null}
      </div>
    ),
    { ...size, headers: ONBELLEK }
  );
}
