// Herkese acik profil onbelleginin temizligi. YALNIZCA SUNUCUDA.
//
// IKI YERDEN CAGRILIYOR:
//  - /api/proxy: her basarili mutasyonun ICINDE, yaniti dondurmeden
//    once. Asil yol bu.
//  - /api/revalidate-profile: istemcinin ve admin panelinin acik
//    temizlik cagrisi.
//
// Kimlik cozumu ve onbellegi burada tek yerde duruyor: iki uc ayni
// token icin backend'e ayri ayri "kim bu" diye sormasin.

import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import {
  kartEtiketi,
  profilEtiketi,
} from "@/services/api/services/public-profile";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

/**
 * Token -> kimlik, kisa omurlu.
 *
 * NEDEN: her temizlik cagrisi backend'e bir /v1/users/me sorusu
 * demekti. Olculdu: tek istemciden saniyede ~60 temizlik, backend'e
 * 61 kimlik sorgusu. Kaydetme seyrek oldugu icin bu sayilara ancak
 * bilerek yuklenerek ulasilir, ama ulasilabiliyordu.
 *
 * Vekil her mutasyonda kimlik cozdugu icin bu onbellek artik orada da
 * ise yariyor: art arda kaydetmeler (link siralama gibi) tek bir
 * kimlik sorusuyla geciyor.
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

export type Kimlik = { username: string; isAdmin: boolean };

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

/**
 * Token'in sahibi ve nereden geldigi; gecersizse null.
 *
 * NEDEN JWT'NIN ICINE BAKILMIYOR: token'in `sub` alani kullanici adi,
 * ama oturum cerezi imzasiz bir JSON (bkz. session-cookie.ts) --
 * icine istedigi token'i yazan biri, imzayi dogrulamadan okunan bir
 * `sub` ile baskasinin sayfasinin onbellegini dusurebilirdi. Imzayi
 * burada dogrulamak da gizli anahtari ikinci bir yere tasimak olurdu.
 * Sahibini backend soyluyor.
 */
export async function kimlikCoz(
  authorization: string
): Promise<{ kimlik: Kimlik; kaynak: "onbellek" | "backend" } | null> {
  const anahtar = tokenOzeti(authorization);
  const onbellekten = kimlikOku(anahtar);
  if (onbellekten) return { kimlik: onbellekten, kaynak: "onbellek" };

  if (!API_URL) return null;

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

/**
 * Bir kullanicinin sayfa ve kart onbellegini temizler.
 *
 * Sayfa ve kart ayri onbellek kayitlari: kart ayni ucu
 * `?count_view=false` ile cagiriyor, yani Next icin baska bir adres.
 * Yalnizca sayfa temizlenirken kart duzenlemeden sonra bayt bayt
 * ayni donuyordu -- olculdu.
 */
export function profilOnbelleginiTemizle(username: string): void {
  revalidateTag(profilEtiketi(username));
  revalidateTag(kartEtiketi(username));
}
