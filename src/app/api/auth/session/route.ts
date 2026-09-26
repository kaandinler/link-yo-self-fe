// Oturum acma ve kapatma. Token'in tarayiciya hic inmedigi tek kapi.
//
// NEDEN VEKILIN DISINDA: /api/proxy yaniti oldugu gibi istemciye
// donuyor. /v1/auth/token yanitinda token var; vekilden gecseydi
// tarayici onu yine gorurdu. Burada token yanittan aliniyor, HttpOnly
// cereze yaziliyor ve govdeden cikariliyor -- istemciye yalnizca
// "oldu/olmadi" ve kullanici bilgisi donuyor.

import { NextRequest, NextResponse } from "next/server";
import {
  csrfGecerli,
  oturumSil,
  oturumOku,
  oturumYaz,
} from "@/services/auth/session-cookie";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

/** Backend'in access_token_expire_minutes ayarinin aynasi (settings.py). */
const TOKEN_OMRU_MS = 30 * 60 * 1000;

function origineHayir() {
  return NextResponse.json(
    { status: "error", message: "Origin dogrulanamadi" },
    { status: 403 }
  );
}

/** Giris. Govde: { username, password } */
export async function POST(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json(
      { status: "error", message: "API adresi yapilandirilmamis" },
      { status: 500 }
    );
  }
  if (!csrfGecerli(request)) return origineHayir();

  let govde: { username?: unknown; password?: unknown };
  try {
    govde = await request.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Gecersiz istek govdesi" },
      { status: 400 }
    );
  }

  if (
    typeof govde.username !== "string" ||
    typeof govde.password !== "string"
  ) {
    return NextResponse.json(
      { status: "error", message: "Kullanici adi ve sifre gerekli" },
      { status: 400 }
    );
  }

  // Backend OAuth2PasswordRequestForm bekliyor, JSON degil.
  const form = new FormData();
  form.append("username", govde.username);
  form.append("password", govde.password);

  const girisYaniti = await fetch(`${API_URL}/v1/auth/token`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  const girisGovdesi = await girisYaniti.json().catch(() => null);
  const token = girisGovdesi?.data?.access_token;

  if (!girisYaniti.ok || typeof token !== "string" || !token) {
    // Backend'in hata govdesi oldugu gibi geciyor: form alan
    // hatalarini istemci zaten cozumleyebiliyor.
    return NextResponse.json(girisGovdesi ?? { status: "error" }, {
      status: girisYaniti.status === 200 ? 401 : girisYaniti.status,
    });
  }

  // Kullaniciyi da burada okuyoruz: istemcinin elinde token olmadigi
  // icin bunu kendisi yapamaz, ve giris ekraninin kullaniciya gore
  // yonlendirme yapabilmesi gerekiyor.
  const kullaniciYaniti = await fetch(`${API_URL}/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const kullanici = (await kullaniciYaniti.json().catch(() => null))?.data;

  const yanit = NextResponse.json({
    status: "success",
    message: girisGovdesi?.message ?? "Successfully logged in",
    data: kullanici ?? null,
  });

  oturumYaz(yanit, request, {
    token,
    refreshToken: girisGovdesi?.data?.refresh_token ?? null,
    tokenExpires: Date.now() + TOKEN_OMRU_MS,
  });

  return yanit;
}

/**
 * Cikis.
 *
 * Backend'e haber verilemese bile cerez HER DURUMDA siliniyor: aksi
 * halde backend'e ulasilamadigi bir anda "cikis yaptim" diyen
 * kullanici hala giris yapmis kalirdi.
 */
export async function DELETE(request: NextRequest) {
  if (!csrfGecerli(request)) return origineHayir();

  const oturum = oturumOku(request);

  if (API_URL && oturum) {
    try {
      await fetch(`${API_URL}/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${oturum.token}` },
        cache: "no-store",
      });
    } catch {
      // Yutuluyor; cerez asagida yine siliniyor.
    }
  }

  const yanit = NextResponse.json({ status: "success" });
  oturumSil(yanit);
  return yanit;
}
