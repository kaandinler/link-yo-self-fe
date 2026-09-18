// Kaydeden kullanicinin herkese acik sayfasinin onbellegini temizler.
//
// NEDEN VAR: sayfa artik bir dakikalik pencereyle onbellege aliniyor
// (olcum: ayni profile bes ziyaret, backend cagrisi 5 -> 1). Tek basina
// bu, profilini duzenleyen kullaniciya bir dakika boyunca eski sayfayi
// gosterirdi -- olculdu, gosteriyordu. Bu uc o pencereyi kaydetme
// aninda kapatiyor.
//
// NEDEN GOVDEDE KULLANICI ADI YOK: istemci hangi profilin
// temizlenecegini soylemiyor, token'indan cikariliyor. Aksi halde
// herkes baskasinin sayfasinin onbellegini istedigi kadar
// dusurebilirdi.

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  kartEtiketi,
  profilEtiketi,
} from "@/services/api/services/public-profile";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const username: string | undefined = govde?.data?.username;
  if (!username) {
    return NextResponse.json({ error: "Kullanici adi yok" }, { status: 400 });
  }

  // Sayfa ve kart ayri onbellek kayitlari: kart ayni ucu
  // `?count_view=false` ile cagiriyor, yani Next icin baska bir adres.
  // Yalnizca sayfa temizlenirken kart duzenlemeden sonra bayt bayt
  // ayni donuyordu -- olculdu.
  revalidateTag(profilEtiketi(username));
  revalidateTag(kartEtiketi(username));
  return NextResponse.json({ revalidated: username });
}
