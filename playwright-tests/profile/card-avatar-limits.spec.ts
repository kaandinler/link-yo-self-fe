import { expect, test } from "@playwright/test";
import http from "node:http";
import type { AddressInfo } from "node:net";
import zlib from "node:zlib";
import { apiCreateLink, apiUpdateProfile } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Paylasim kartinin avatar indirirken koydugu iki sinir.
 *
 * Avatar adresi kullanicinin yazdigi rastgele bir DIS adres, yani
 * kartin uretimi tanimadigimiz bir sunucuya bagli. opengraph-image.tsx
 * bu yuzden iki koruma koyuyor: 3 saniyelik zaman asimi ve 4 MB'lik
 * boyut tavani. Ikisi de kodda yaziliydi ama hicbir test onlara
 * ulasmiyordu -- mevcut test yalnizca HEMEN basarisiz olan bir adresi
 * deniyordu, ki o korumalarin hicbirini calistirmaz.
 *
 * Yardimci sunucu testin kendi icinde: CI'da ayri bir servis kurmaya
 * gerek kalmasin diye.
 */

/** Gercek bir PNG uretir; sikistirilamasin diye pikseller rastgele. */
function pngUret(kenar: number): Buffer {
  const ham = Buffer.concat(
    Array.from({ length: kenar }, () =>
      Buffer.concat([Buffer.alloc(1), randomBytes(kenar * 3)])
    )
  );
  const parca = (tur: string, veri: Buffer) => {
    const govde = Buffer.concat([Buffer.from(tur), veri]);
    const uzunluk = Buffer.alloc(4);
    uzunluk.writeUInt32BE(veri.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(govde) >>> 0);
    return Buffer.concat([uzunluk, govde, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(kenar, 0);
  ihdr.writeUInt32BE(kenar, 4);
  ihdr[8] = 8; // bit derinligi
  ihdr[9] = 2; // renk tipi: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    parca("IHDR", ihdr),
    parca("IDAT", zlib.deflateSync(ham, { level: 1 })),
    parca("IEND", Buffer.alloc(0)),
  ]);
}

function randomBytes(n: number): Buffer {
  const b = Buffer.alloc(n);
  for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
  return b;
}

let sunucu: http.Server;
let adres: string;
/** Kartin 3 saniyelik zaman asimindan belirgin sekilde uzun. */
const YAVAS_MS = 12_000;

test.beforeAll(async () => {
  const buyuk = pngUret(1400); // ~5 MB, 4 MB tavaninin ustunde
  expect(
    buyuk.length,
    `buyuk avatar 4 MB'i gecmeli, ${buyuk.length} bayt uretildi`
  ).toBeGreaterThan(4 * 1024 * 1024);

  sunucu = http.createServer((istek, yanit) => {
    if (istek.url === "/buyuk.png") {
      yanit.writeHead(200, { "content-type": "image/png" });
      yanit.end(buyuk);
      return;
    }
    // /yavas.png: baglanti aciliyor ama yanit gecikiyor. Zaman asimi
    // olmasaydi kart bu sureyi beklerdi.
    setTimeout(() => {
      yanit.writeHead(200, { "content-type": "image/png" });
      yanit.end(pngUret(8));
    }, YAVAS_MS).unref();
  });

  await new Promise<void>((coz) => sunucu.listen(0, "127.0.0.1", coz));
  adres = `http://127.0.0.1:${(sunucu.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((coz) => sunucu.close(() => coz()));
});

/**
 * Avatari verilen adrese kurup kartin baytlarini doner.
 *
 * Her cagri profili guncelledigi icin kart onbellegi de temizleniyor
 * (apiUpdateProfile -> /api/revalidate-profile), yani olculen sey her
 * seferinde yeniden cizilmis kart.
 */
async function kartBaytlari(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
  username: string,
  token: string,
  avatar: string | null
) {
  await apiUpdateProfile(token, { profile_image_url: avatar });
  const yanit = await request.get(`/en/${username}/opengraph-image`);
  expect(yanit.status()).toBe(200);
  expect(yanit.headers()["content-type"]).toContain("image/png");
  return yanit.body();
}

test.describe("Kart avatar sinirlari", () => {
  test("4 MB'i gecen avatar karta gomulmuyor", async ({ page, request }) => {
    /**
     * OLCU: avatarsiz kartla BAYT BAYT ayni olmasi. Ikisi de bas
     * harflere dusuyorsa cizim birebir ayni olur; gorsel gomulseydi
     * kart bambaska olurdu. Yani "ayni baytlar" dogrudan "gomulmedi"
     * demek -- PNG'nin icini okumadan.
     */
    const { user, token } = await signInAsNewUser(page);
    await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/b" });
    await apiUpdateProfile(token, { display_name: "Katherine Johnson" });

    const buyukAvatarli = await kartBaytlari(
      page,
      request,
      user.username,
      token,
      `${adres}/buyuk.png`
    );
    const avatarsiz = await kartBaytlari(
      page,
      request,
      user.username,
      token,
      null
    );

    expect(
      buyukAvatarli.equals(avatarsiz),
      `buyuk avatar karta gomulmus: ${buyukAvatarli.length} vs ${avatarsiz.length} bayt`
    ).toBe(true);
  });

  test("yavas avatar sunucusu karti bekletmiyor", async ({ page, request }) => {
    /**
     * OLCU: sure. Sunucu 12 saniye sonra cevap veriyor; kart 3
     * saniyelik zaman asimi sayesinde cok daha once donmeli. Zaman
     * asimi kaldirilirsa bu test sureye takilir.
     *
     * Esik 8 saniye: 3 saniyelik asimi ile 12 saniyelik gecikmenin
     * arasinda, ikisine de yakin degil, yavas bir makinede bosuna
     * kirilmayacak kadar genis.
     */
    const { user, token } = await signInAsNewUser(page);
    await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/b" });
    await apiUpdateProfile(token, { display_name: "Katherine Johnson" });

    const baslangic = Date.now();
    const yavasAvatarli = await kartBaytlari(
      page,
      request,
      user.username,
      token,
      `${adres}/yavas.png`
    );
    const sure = Date.now() - baslangic;

    expect(sure, `kart ${sure} ms surdu`).toBeLessThan(8_000);

    // Ve zaman asimina ugrayan avatar gomulmemis olmali.
    const avatarsiz = await kartBaytlari(
      page,
      request,
      user.username,
      token,
      null
    );
    expect(
      yavasAvatarli.equals(avatarsiz),
      "zaman asimina ugrayan avatar yine de gomulmus"
    ).toBe(true);
  });
});
