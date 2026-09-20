// FastAPI'ye giden butun cagrilarin gectigi vekil.
//
// NEDEN VAR: token artik HttpOnly bir cerezde (bkz. session-cookie.ts),
// yani tarayicidaki JavaScript onu okuyamiyor -- dolayisiyla
// `Authorization: Bearer` basligini da kuramiyor. Onu burada, sunucuda
// kuruyoruz: istemci kendi origin'indeki /api/proxy/... adresine
// cagiriyor, cerez isteğe otomatik ekleniyor, biz cerezden token'i
// okuyup FastAPI'ye iletiyoruz.
//
// YAN FAYDA: istemciden FastAPI'ye artik hic dogrudan istek gitmiyor,
// yani CORS bu akistan tamamen cikti.
//
// TOKEN YENILEME DE BURADA: eskiden istemci use-fetch icinde suresi
// dolmak uzere olan token'i kendisi yeniliyordu. Yenileme artik
// sunucuda ve seffaf: istemci token'in varligindan bile haberdar degil.

import { NextRequest, NextResponse } from "next/server";
import {
  Oturum,
  csrfGecerli,
  oturumOku,
  oturumSil,
  oturumYaz,
} from "@/services/auth/session-cookie";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

/**
 * Vekil uzerinden GECILEMEYECEK uclar.
 *
 * NEDEN: bu uclarin yaniti token ICERIYOR. Vekil yanitı oldugu gibi
 * istemciye dondugu icin, acik birakilsalardi tarayici token'i yine
 * gorurdu ve cerezi HttpOnly yapmanin bir anlami kalmazdi. Oturum
 * acma/kapatma tek kapidan geciyor: /api/auth/session.
 */
const YASAK_UCLAR = ["v1/auth/token", "v1/auth/refresh", "v1/auth/logout"];

/** Backend'in access_token_expire_minutes ayarinin aynasi (settings.py). */
const TOKEN_OMRU_MS = 30 * 60 * 1000;

/** Bu kadar kalmissa yenile; istek sirasinda dolmasin. */
const YENILEME_PAYI_MS = 60 * 1000;

async function tokenYenile(oturum: Oturum): Promise<Oturum | null> {
  if (!oturum.refreshToken) return null;

  try {
    const yanit = await fetch(`${API_URL}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: oturum.refreshToken }),
    });

    if (!yanit.ok) return null;

    const govde = await yanit.json();
    const yeniToken = govde?.data?.access_token;
    if (typeof yeniToken !== "string" || !yeniToken) return null;

    return {
      token: yeniToken,
      // Backend yenilemede yeni bir refresh token dondurmuyor; eldeki
      // gecerli olmaya devam ediyor.
      refreshToken: govde?.data?.refresh_token ?? oturum.refreshToken,
      tokenExpires: Date.now() + TOKEN_OMRU_MS,
    };
  } catch {
    return null;
  }
}

function suresiDolmakUzere(oturum: Oturum): boolean {
  if (oturum.tokenExpires === null) return false;
  return oturum.tokenExpires - YENILEME_PAYI_MS <= Date.now();
}

/**
 * Yanit govdesinde token varsa onu cereze alir ve govdeden CIKARIR.
 *
 * NEDEN GEREKLI: /v1/auth/change-password basarili olunca yeni bir
 * token cifti donuyor -- backend diger cihazlardaki oturumlari
 * kapattigi icin, bu oturumun devam edebilmesi ona bagli. Govdeyi
 * oldugu gibi gecirseydik token yine tarayiciya inerdi.
 */
function tokenTasiyanYanit(
  govde: unknown
): { access_token: string; refresh_token?: string | null } | null {
  if (typeof govde !== "object" || govde === null) return null;
  const veri = (govde as { data?: unknown }).data;
  if (typeof veri !== "object" || veri === null) return null;

  const token = (veri as { access_token?: unknown }).access_token;
  if (typeof token !== "string" || !token) return null;

  const refresh = (veri as { refresh_token?: unknown }).refresh_token;
  return {
    access_token: token,
    refresh_token: typeof refresh === "string" ? refresh : null,
  };
}

async function vekilEt(
  request: NextRequest,
  params: Promise<{ yol: string[] }>
): Promise<NextResponse> {
  if (!API_URL) {
    return NextResponse.json(
      { status: "error", message: "API adresi yapilandirilmamis" },
      { status: 500 }
    );
  }

  const { yol } = await params;
  const hedefYol = yol.join("/");

  if (YASAK_UCLAR.includes(hedefYol)) {
    return NextResponse.json(
      { status: "error", message: "Bu uc vekil uzerinden cagrilamaz" },
      { status: 404 }
    );
  }

  if (!csrfGecerli(request)) {
    return NextResponse.json(
      { status: "error", message: "Origin dogrulanamadi" },
      { status: 403 }
    );
  }

  let oturum = oturumOku(request);
  let cerezYenilensin = false;

  if (oturum && suresiDolmakUzere(oturum)) {
    const yeni = await tokenYenile(oturum);
    if (yeni) {
      oturum = yeni;
      cerezYenilensin = true;
    }
  }

  const basliklar = new Headers();
  const dil = request.headers.get("x-custom-lang");
  if (dil) basliklar.set("x-custom-lang", dil);
  if (oturum) basliklar.set("authorization", `Bearer ${oturum.token}`);

  /**
   * Govde metin olarak okunuyor, ArrayBuffer olarak degil.
   *
   * NEDEN: arrayBuffer()'in dondurdugu tamponu dogrudan fetch'e
   * vermek "Cannot perform ArrayBuffer.prototype.slice on a detached
   * ArrayBuffer" ile patliyordu -- undici tamponun sahipligini
   * devraliyor. Olculdu: link ekleme ve profil kaydetme dahil butun
   * POST/PUT cagrilari dusuyordu.
   *
   * multipart ayri ele aliniyor: formData'yi yeniden kodlarken
   * undici kendi sinir dizgisini (boundary) uretiyor, yani gelen
   * content-type'i AYNEN iletmek bozuk bir istek olusturur. O yuzden
   * content-type yalnizca multipart DISINDA iletiliyor.
   */
  const contentType = request.headers.get("content-type") ?? "";
  const multipart = contentType.includes("multipart/form-data");
  const govdesiz = request.method === "GET" || request.method === "HEAD";

  let govde: string | FormData | undefined;
  if (!govdesiz) {
    if (multipart) {
      govde = await request.formData();
    } else {
      const metin = await request.text();
      govde = metin.length > 0 ? metin : undefined;
      if (contentType) basliklar.set("content-type", contentType);
    }
  } else if (contentType) {
    basliklar.set("content-type", contentType);
  }

  const hedef = `${API_URL}/${hedefYol}${request.nextUrl.search}`;
  const backendYaniti = await fetch(hedef, {
    method: request.method,
    headers: basliklar,
    body: govde,
    // Vekil kendi basina bir istemci; Next'in onbellegine girmesin.
    cache: "no-store",
  });

  const ham = await backendYaniti.text();
  let cozulmus: unknown = null;
  try {
    cozulmus = ham ? JSON.parse(ham) : null;
  } catch {
    // JSON olmayan yanit (bos govde, hata sayfasi) oldugu gibi gecer.
  }

  const tasinan = cozulmus ? tokenTasiyanYanit(cozulmus) : null;
  let ciktiGovdesi = ham;

  if (tasinan) {
    oturum = {
      token: tasinan.access_token,
      refreshToken: tasinan.refresh_token ?? oturum?.refreshToken ?? null,
      tokenExpires: Date.now() + TOKEN_OMRU_MS,
    };
    cerezYenilensin = true;

    // Token'lar govdeden cikariliyor; istemcinin onlara isi yok.
    const temiz = cozulmus as { data?: Record<string, unknown> };
    const { access_token: _a, refresh_token: _r, ...kalan } = temiz.data ?? {};
    ciktiGovdesi = JSON.stringify({ ...temiz, data: kalan });
  }

  const yanit = new NextResponse(ciktiGovdesi || null, {
    status: backendYaniti.status,
    headers: {
      "content-type":
        backendYaniti.headers.get("content-type") ?? "application/json",
    },
  });

  if (cerezYenilensin && oturum) {
    oturumYaz(yanit, request, oturum);
  }

  // Backend token'i reddettiyse elimizdeki cerez ise yaramiyor.
  if (backendYaniti.status === 401) {
    oturumSil(yanit);
  }

  return yanit;
}

type Baglam = { params: Promise<{ yol: string[] }> };

export async function GET(request: NextRequest, { params }: Baglam) {
  return vekilEt(request, params);
}

export async function POST(request: NextRequest, { params }: Baglam) {
  return vekilEt(request, params);
}

export async function PUT(request: NextRequest, { params }: Baglam) {
  return vekilEt(request, params);
}

export async function PATCH(request: NextRequest, { params }: Baglam) {
  return vekilEt(request, params);
}

export async function DELETE(request: NextRequest, { params }: Baglam) {
  return vekilEt(request, params);
}
