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

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  kartEtiketi,
  profilEtiketi,
} from "@/services/api/services/public-profile";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export async function POST(request: Request) {
  if (!API_URL) {
    return NextResponse.json({ error: "API_URL yok" }, { status: 500 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Token gerekli" }, { status: 401 });
  }

  // Kullaniciyi backend'e soruyoruz: token'i burada cozmek, imza
  // dogrulamasini ikinci bir yerde tekrarlamak olurdu.
  const yanit = await fetch(`${API_URL}/v1/users/me`, {
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  if (!yanit.ok) {
    return NextResponse.json({ error: "Token gecersiz" }, { status: 401 });
  }

  const govde = await yanit.json();
  const cagiran: string | undefined = govde?.data?.username;
  if (!cagiran) {
    return NextResponse.json({ error: "Kullanici adi yok" }, { status: 400 });
  }

  // Admin baska bir kullanicinin onbellegini temizleyebiliyor: panelden
  // hesap kapatinca o kisinin sayfasi da hemen kapanmali. Govdede
  // kullanici adi gelmesi tek basina yetmiyor; yetkiyi yine backend
  // soyluyor.
  const istenen = await istenenKullanici(request);
  if (istenen && istenen !== cagiran && govde?.data?.is_admin !== true) {
    return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  }

  const username = istenen ?? cagiran;

  // Sayfa ve kart ayri onbellek kayitlari: kart ayni ucu
  // `?count_view=false` ile cagiriyor, yani Next icin baska bir adres.
  // Yalnizca sayfa temizlenirken kart duzenlemeden sonra bayt bayt
  // ayni donuyordu -- olculdu.
  revalidateTag(profilEtiketi(username));
  revalidateTag(kartEtiketi(username));
  return NextResponse.json({ revalidated: username });
}
