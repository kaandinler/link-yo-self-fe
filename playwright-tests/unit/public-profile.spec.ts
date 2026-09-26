import { expect, test } from "@playwright/test";
import {
  getPublicProfileForCard,
  ProfilGeciciHatasi,
} from "@/services/api/services/public-profile";

/**
 * Profil veri katmaninin "yok" ile "bilinmiyor" ayrimi.
 *
 * NEDEN TARAYICISIZ: profil istegi Next SUNUCUSUNDAN backend'e gidiyor;
 * Playwright onu yakalayamiyor. Kesintiyi uctan uca uretmek icin
 * backend'i durdurmak gerekiyor, o da paralel kosan diger testleri
 * dusurur. O yuzden siniflandirma burada, fetch taklit edilerek
 * olculuyor. Uctan uca davranis PR'da elle olculdu (backend kapali:
 * sayfa 404 -> 500, kart public 1 saat -> no-store).
 *
 * getPublicProfileForCard kullaniliyor, getPublicProfile degil: ikisi
 * ayni yardimciyi paylasiyor ama digeri React cache() ile sarili ve
 * sunucu disinda bir istek kapsami yok.
 */

const gercekFetch = globalThis.fetch;

function fetchTaklidi(davranis: () => Promise<Response>) {
  globalThis.fetch = (() => davranis()) as typeof fetch;
}

test.afterEach(() => {
  globalThis.fetch = gercekFetch;
});

test.describe("Profil veri katmani", () => {
  test("profil bulununca profili donuyor", async () => {
    fetchTaklidi(async () =>
      Response.json({ data: { username: "ada" }, status: "success" })
    );
    const profil = await getPublicProfileForCard("ada");
    expect(profil?.username).toBe("ada");
  });

  test("404 -> null (profil YOK, sayfa 404 verir)", async () => {
    fetchTaklidi(async () => new Response("{}", { status: 404 }));
    expect(await getPublicProfileForCard("yok")).toBeNull();
  });

  test("diger 4xx de YOK sayiliyor", async () => {
    // Gecersiz karakterli ad 422 donebilir; o da kalici olarak yok.
    fetchTaklidi(async () => new Response("{}", { status: 422 }));
    expect(await getPublicProfileForCard("x%y")).toBeNull();
  });

  test("backend 5xx -> ProfilGeciciHatasi (BILINMIYOR)", async () => {
    fetchTaklidi(async () => new Response("{}", { status: 503 }));
    await expect(getPublicProfileForCard("ada")).rejects.toBeInstanceOf(
      ProfilGeciciHatasi
    );
  });

  test("backend'e ulasilamiyor -> ProfilGeciciHatasi", async () => {
    // Olculen gercek durum: backend kapaliyken fetch ECONNREFUSED ile
    // reddediliyor. Onceki kod bunu null'a cevirip 404 veriyordu.
    fetchTaklidi(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(getPublicProfileForCard("ada")).rejects.toBeInstanceOf(
      ProfilGeciciHatasi
    );
  });
});
