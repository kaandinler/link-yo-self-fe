import { expect, test } from "@playwright/test";
import { NextRequest } from "next/server";
import { csrfGecerli, guvenliMi } from "@/services/auth/session-cookie";

/**
 * CSRF ve Secure karari, istegin nextUrl'ine degil basliklarina bakiyor.
 *
 * NEDEN: standalone ciktida (Docker imaji) nextUrl'in host'u sunucunun
 * dinledigi adresten kuruluyor ("0.0.0.0:3000"), Host basligindan
 * degil. Konteynerde olculdu: her gercek giris 403 aliyordu. e2e suiti
 * `next start` ile kostugu icin bunu yakalayamiyor; bu yuzden burada,
 * nextUrl'i bilerek farkli kurarak sinaniyor.
 */

function istek(basliklar: Record<string, string>, method = "POST") {
  return new NextRequest("http://0.0.0.0:3000/api/auth/session", {
    method,
    headers: basliklar,
  });
}

test.describe("Oturum cerezi: CSRF", () => {
  test("Origin Host basligiyla ayniysa kabul (nextUrl farkli olsa da)", () => {
    expect(
      csrfGecerli(
        istek({ origin: "http://localhost:3000", host: "localhost:3000" })
      )
    ).toBe(true);
  });

  test("baska bir siteden gelen Origin reddediliyor", () => {
    expect(
      csrfGecerli(
        istek({ origin: "https://kotu.example", host: "localhost:3000" })
      )
    ).toBe(false);
  });

  test("ters vekil arkasinda X-Forwarded-Host esas aliniyor", () => {
    expect(
      csrfGecerli(
        istek({
          origin: "https://linkyoself.com",
          host: "web:3000",
          "x-forwarded-host": "linkyoself.com",
        })
      )
    ).toBe(true);
  });

  test("Origin yoksa reddediliyor", () => {
    expect(csrfGecerli(istek({ host: "localhost:3000" }))).toBe(false);
  });

  test("GET kontrol edilmiyor", () => {
    expect(csrfGecerli(istek({ host: "localhost:3000" }, "GET"))).toBe(true);
  });
});

test.describe("Oturum cerezi: Secure", () => {
  test("TLS'i sonlandiran vekil arkasinda Secure", () => {
    expect(guvenliMi(istek({ "x-forwarded-proto": "https" }))).toBe(true);
  });

  test("duz HTTP'de Secure degil (yerel e2e)", () => {
    expect(guvenliMi(istek({}))).toBe(false);
  });
});
