// Kaydeden kullanicinin herkese acik sayfasinin onbellegini temizler.
//
// NEDEN VAR: sayfa artik bir dakikalik pencereyle onbellege aliniyor
// (olcum: ayni profile bes ziyaret, backend cagrisi 5 -> 1). Tek basina
// bu, profilini duzenleyen kullaniciya bir dakika boyunca eski sayfayi
// gosterirdi -- olculdu, gosteriyordu. Bu uc o pencereyi kaydetme
// aninda kapatiyor.
//
// NEDEN VARSAYILAN OLARAK GOVDESIZ: istemci hangi profilin
// temizlenecegini soylemiyor, token'indan cikariliyor. Aksi halde
// herkes baskasinin sayfasinin onbellegini istedigi kadar
// dusurebilirdi. Govdede kullanici adi yalnizca admin icin kabul
// ediliyor: panelden hesap kapatinca o kisinin sayfasi da hemen
// kapanmali.

import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { csrfGecerli, oturumOku } from "@/services/auth/session-cookie";
import {
  kartEtiketi,
  profilEtiketi,
  PROFIL_ONBELLEK_SANIYE,
} from "@/services/api/services/public-profile";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Token -> kimlik, kisa omurlu.
 *
 * NEDEN: her temizlik cagrisi backend'e bir /v1/users/me sorusu
 * demekti. Olculdu: tek istemciden saniyede ~60 temizlik, backend'e
 * 61 kimlik sorgusu. Kaydetme seyrek oldugu icin bu sayilara ancak
 * bilerek yuklenerek ulasilir, ama ulasilabiliyordu.
 *
 * Temizligin KENDISI her cagrida yapiliyor -- yalnizca kimlik sorusu
 * tekrarlanmiyor. Cagriyi atlamak ya da 429 dondurmek guvenli
 * olmazdi: dusen bir temizlik, kullanicinin kendi sayfasini bir
 * dakika eski gormesi demek.
 *
 * Token ham haliyle tutulmuyor, ozeti tutuluyor.
 *
 * Bellek sunucu surecinde ve ornek basina; tek amaci ust uste gelen
 * cagrilari birlestirmek, kalici bir kayit degil.
 */
const KIMLIK_OMRU_MS = 10_000;
const KIMLIK_TAVANI = 1000;

type Kimlik = { username: string; isAdmin: boolean };

const kimlikler = new Map<string, { kimlik: Kimlik; bitis: number }>();

function tokenOzeti(authorization: string): string {
  return createHash("sha256").update(authorization).digest("hex");
}

function kimlikOku(anahtar: string): Kimlik | undefined {
  const kayit = kimlikler.get(anahtar);
  if (!kayit) return undefined;
  if (kayit.bitis <= Date.now()) {
    kimlikler.delete(anahtar);
    return undefined;
  }
  return kayit.kimlik;
}

function kimlikYaz(anahtar: string, kimlik: Kimlik) {
  // Suresi gecenleri at; sonra hala tavandaysak en eskiyi at. Boylece
  // farkli token'larla yuklenen biri bellegi buyutemiyor.
  const simdi = Date.now();
  // Array.from: tsconfig hedefi Map uzerinde dogrudan donmeye izin
  // vermiyor ve silerken kopya uzerinde gezmek zaten daha guvenli.
  for (const [k, v] of Array.from(kimlikler.entries())) {
    if (v.bitis <= simdi) kimlikler.delete(k);
  }
  while (kimlikler.size >= KIMLIK_TAVANI) {
    const enEski = Array.from(kimlikler.keys())[0];
    if (enEski === undefined) break;
    kimlikler.delete(enEski);
  }
  kimlikler.set(anahtar, { kimlik, bitis: simdi + KIMLIK_OMRU_MS });
}

/** Token'in sahibi ve nereden geldigi; gecersizse null. */
async function kimlikCoz(
  authorization: string
): Promise<{ kimlik: Kimlik; kaynak: "onbellek" | "backend" } | null> {
  const anahtar = tokenOzeti(authorization);
  const onbellekten = kimlikOku(anahtar);
  if (onbellekten) return { kimlik: onbellekten, kaynak: "onbellek" };

  // Token'i burada cozmek, imza dogrulamasini ikinci bir yerde
  // tekrarlamak olurdu; sahibini backend soyluyor.
  const yanit = await fetch(`${API_URL}/v1/users/me`, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });
  if (!yanit.ok) return null;

  const govde = await yanit.json();
  const username: string | undefined = govde?.data?.username;
  if (!username) return null;

  const kimlik: Kimlik = {
    username,
    isAdmin: govde?.data?.is_admin === true,
  };
  kimlikYaz(anahtar, kimlik);
  return { kimlik, kaynak: "backend" };
}

/** Govdedeki kullanici adi; govde yoksa ya da bozuksa undefined. */
async function istenenKullanici(request: Request): Promise<string | undefined> {
  try {
    const govde = await request.json();
    const ad = govde?.username;
    return typeof ad === "string" && ad ? ad : undefined;
  } catch {
    // Govdesiz cagri olagan hal: "kendi profilimi temizle".
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json({ error: "API_URL yok" }, { status: 500 });
  }

  /**
   * Kimlik iki yoldan gelebiliyor ve CSRF kontrolu YALNIZCA BIRINE
   * uygulaniyor.
   *
   * Cerez ORTAM KIMLIGI: tarayici onu isteklere kendiliginden ekliyor,
   * yani kullaniciya baska bir siteden istek yaptirmak mumkun -- CSRF
   * tam olarak bu. O yuzden cerezle gelen istekte Origin bu siteyle
   * ayni olmali.
   *
   * Authorization basligi ACIK KIMLIK: tarayici onu kendiliginden
   * eklemiyor, basligi koyan taraf token'a zaten sahip. Boyle bir
   * istekte CSRF diye bir sey yok ve Origin aramak, token'i olan
   * sunucu-sunucu istemcileri (ornegin E2E yardimcilari) sebepsiz
   * disarida birakmak olurdu.
   *
   * Uc, sahip oldugu token'in verdiginden fazla yetki vermiyor: ne
   * yapilacagini yine backend'e sorulan kimlik belirliyor.
   */
  const baslikKimligi = request.headers.get("authorization");
  const oturum = oturumOku(request);

  // ONCE KIMLIK, SONRA ORIGIN. Hicbir kimlik sunmayan cagiriya
  // "Origin'in yanlis" demek yaniltici olurdu; dogru cevap "kimlik
  // yok".
  if (!baslikKimligi && !oturum) {
    return NextResponse.json({ error: "Token gerekli" }, { status: 401 });
  }

  if (!baslikKimligi && !csrfGecerli(request)) {
    return NextResponse.json(
      { error: "Origin dogrulanamadi" },
      { status: 403 }
    );
  }

  const authorization = baslikKimligi ?? `Bearer ${oturum!.token}`;

  const cozum = await kimlikCoz(authorization);
  if (!cozum) {
    return NextResponse.json({ error: "Token gecersiz" }, { status: 401 });
  }
  const { kimlik, kaynak } = cozum;

  // Admin baska bir kullanicinin onbellegini temizleyebiliyor: panelden
  // hesap kapatinca o kisinin sayfasi da hemen kapanmali. Govdede
  // kullanici adi gelmesi tek basina yetmiyor; yetkiyi yine backend
  // soyluyor.
  const istenen = await istenenKullanici(request);
  if (istenen && istenen !== kimlik.username && !kimlik.isAdmin) {
    return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  }

  const username = istenen ?? kimlik.username;

  // Sayfa ve kart ayri onbellek kayitlari: kart ayni ucu
  // `?count_view=false` ile cagiriyor, yani Next icin baska bir adres.
  // Yalnizca sayfa temizlenirken kart duzenlemeden sonra bayt bayt
  // ayni donuyordu -- olculdu.
  revalidateTag(profilEtiketi(username));
  revalidateTag(kartEtiketi(username));

  // Kimligin nereden geldigi disaridan olculebilsin diye basliga
  // yaziliyor. Gizli bir sey tasimiyor ve testin olctugu sey tam
  // olarak bu: temizlik her cagrida yapiliyor ama kimlik sorusu
  // tekrarlanmiyor.
  return NextResponse.json(
    { revalidated: username },
    {
      // TANILAMA BASLIKLARI, BILINCLI OLARAK URETIMDE DE.
      //
      // Testler icin eklendi ama yalnizca test icin degiller: hangi
      // katmanin cevapladigini gormek hata ayiklamanin en dogrudan
      // yolu -- CDN'lerin x-cache: HIT/MISS basligiyla ayni is.
      // Ortama gore kapatmak, uretimde sorun yasandiginda tam da
      // ihtiyac duyulan bilgiyi kapatmak olurdu.
      //
      // Sinir olculdu: bu basliklar yalnizca kimligi dogrulanmis
      // cagiranin KENDI 200 yanitinda donuyor; 401'de hicbiri yok.
      // Tasidiklari sey de cagiranin kendi istegine ait -- baska bir
      // kullanici hakkinda bir sey soylemiyorlar.
      headers: {
        // Kimlik backend'e mi soruldu, onbellekten mi geldi.
        "x-kimlik-kaynagi": kaynak,
        // Yururlukteki tazelik penceresi. Temizlik ETKI ETMEDIGINDE
        // -- ornegin cagri baska bir Next ornegine dustugunde --
        // sayfanin en fazla ne kadar eski kalabilecegi bu.
        "x-profil-onbellek-saniye": String(PROFIL_ONBELLEK_SANIYE),
      },
    }
  );
}
