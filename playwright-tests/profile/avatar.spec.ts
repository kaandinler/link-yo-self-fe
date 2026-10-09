import { expect, test, type Page } from "@playwright/test";
import zlib from "node:zlib";
import { apiPublicProfile, KUCUK_PNG } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Avatar yukleme arayuzu (components/avatar-upload.tsx).
 *
 * Istek gercekten /api/proxy uzerinden backend'e gidiyor: vekil
 * multipart govdeyi yeniden kodluyor ve Content-Length'i undici
 * hesapliyor. Backend uzunluksuz govdeyi 411 ile reddettigi icin, bu
 * zincirin calistigi ancak boyle olculebiliyor.
 */

/** Backend'in sakladigi dosyanin adres kalibi. */
const AVATAR_ADRESI = /\/media\/avatars\/\d+\/[0-9a-f]{32}\.(jpg|png)$/;

/** 64x64 duz renkli PNG. */
function png(kenar = 64): Buffer {
  const satir = Buffer.concat([
    Buffer.alloc(1),
    Buffer.alloc(kenar * 3, Buffer.from([200, 40, 90])),
  ]);
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
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    parca("IHDR", ihdr),
    parca(
      "IDAT",
      zlib.deflateSync(Buffer.concat(Array(kenar).fill(satir) as Buffer[]))
    ),
    parca("IEND", Buffer.alloc(0)),
  ]);
}

async function dosyaSec(page: Page, buffer: Buffer, mimeType = "image/png") {
  await page
    .getByTestId("avatar-input")
    .setInputFiles({ name: "avatar.png", mimeType, buffer });
}

/** Gorsel gercekten yuklendi mi (kirik resim degil mi)? */
async function yuklendi(page: Page, testId: string) {
  return page
    .getByTestId(testId)
    .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
}

test.describe("Avatar yukleme", () => {
  test("profil duzenlemede yuklenen avatar herkese acik sayfada gorunuyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);
    await page.goto("/en/profile/edit");

    await dosyaSec(page, png());

    const avatar = page.getByTestId("avatar-image");
    await expect(avatar).toHaveAttribute("src", AVATAR_ADRESI);
    await expect.poll(() => yuklendi(page, "avatar-image")).toBe(true);
    // Ayri bir "Kaydet" yok: avatar secilince kaydediliyor.
    const adres = await avatar.getAttribute("src");
    expect((await apiPublicProfile(user.username)).profile_image_url).toBe(
      adres
    );

    // Vekil kaydetme isteginin icinde onbellegi temizliyor; sayfa hemen
    // yeni avatari gostermeli.
    await page.goto(`/en/${user.username}`);
    const sayfadaki = page.locator(`img[src="${adres}"]`);
    await expect(sayfadaki).toBeVisible();
    expect(
      await sayfadaki.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
      )
    ).toBe(true);
  });

  test("avatar kaldirilinca bas harfler geri geliyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);
    await page.goto("/en/profile/edit");

    await dosyaSec(page, KUCUK_PNG);
    await expect(page.getByTestId("avatar-image")).toHaveAttribute(
      "src",
      AVATAR_ADRESI
    );

    await page.getByTestId("avatar-remove").click();

    await expect(page.getByTestId("avatar-image")).toHaveCount(0);
    await expect(page.getByTestId("avatar-remove")).toHaveCount(0);
    expect(
      (await apiPublicProfile(user.username)).profile_image_url
    ).toBeNull();
  });

  test("8 MB'tan buyuk dosya istek gonderilmeden reddediliyor", async ({
    page,
  }) => {
    await signInAsNewUser(page);
    await page.goto("/en/profile/edit");

    const istekler: string[] = [];
    page.on("request", (istek) => {
      if (istek.url().includes("/v1/profile/avatar"))
        istekler.push(istek.url());
    });

    await dosyaSec(page, Buffer.alloc(8 * 1024 * 1024 + 1));

    await expect(page.getByTestId("avatar-error")).toHaveText(
      "This image is larger than 8 MB."
    );
    expect(istekler).toEqual([]);
  });

  test("gorsel olmayan dosya sunucuda reddediliyor", async ({ page }) => {
    // Tur ve uzanti gorsel diyor; icerik degil. Tarayici turuyle
    // karar veriyor, gecirip sunucuya gonderiyor; sunucu icerige bakiyor.
    await signInAsNewUser(page);
    await page.goto("/en/profile/edit");

    await dosyaSec(page, Buffer.from("<html><script>alert(1)</script>"));

    await expect(page.getByTestId("avatar-error")).toHaveText(
      "This file isn't a supported image. Use JPEG, PNG, WebP or GIF."
    );
    await expect(page.getByTestId("avatar-image")).toHaveCount(0);
  });

  test("onboarding'in ilk adiminda yuklenebiliyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page, { onboarding: false });
    await page.goto("/en/onboarding/1");

    await dosyaSec(page, png());

    await expect(page.getByTestId("avatar-image")).toHaveAttribute(
      "src",
      AVATAR_ADRESI
    );
    expect((await apiPublicProfile(user.username)).profile_image_url).toMatch(
      AVATAR_ADRESI
    );
  });
});
