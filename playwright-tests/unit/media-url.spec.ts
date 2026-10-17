import { expect, test } from "@playwright/test";
import {
  kartIcinAvatarAdresi,
  medyaKokleri,
  type MedyaKokleri,
} from "@/services/media-url";

/**
 * Paylasim kartinin hangi avatari SUNUCUDA indirebilecegi.
 *
 * NEDEN BIRIM TESTI: korumanin karsiladigi durum -- veritabaninda kalmis
 * eski bir DIS avatar adresi -- artik API'den kurulamiyor (backend
 * profile_image_url'i yalnizca yuklemeyle dolduruyor). Uctan uca bir
 * test o durumu uretemez; karar verilen yer burasi, burada olculuyor.
 * Gercek yukleme -> karta gomme zinciri card-adult-warning.spec.ts'te.
 */

const YEREL: MedyaKokleri = {
  acik: "http://localhost:8000/media",
  ic: "http://api:8000/media",
};

test.describe("Kart avatar adresi", () => {
  test("kendi medya kokumuzdeki avatar ic adresten indiriliyor", () => {
    expect(
      kartIcinAvatarAdresi(
        "http://localhost:8000/media/avatars/7/abc.jpg",
        YEREL
      )
    ).toBe("http://api:8000/media/avatars/7/abc.jpg");
  });

  for (const [neden, adres] of [
    ["dis bir site", "https://ornek.test/avatar.png"],
    ["ic ag (backend)", "http://api:8000/api/v1/users/me"],
    ["bulut metadata", "http://169.254.169.254/latest/meta-data/"],
    ["ayni host, medya disi yol", "http://localhost:8000/api/v1/users/me"],
    ["ayni host, baska port", "http://localhost:8001/media/avatars/7/a.jpg"],
    ["onek benzeri yol", "http://localhost:8000/mediax/avatars/7/a.jpg"],
    ["../ ile kokten cikma", "http://localhost:8000/media/../api/v1/x"],
    ["sema disi", "file:///etc/passwd"],
    ["bozuk adres", "not a url"],
  ] as const) {
    test(`indirilmiyor: ${neden}`, () => {
      expect(kartIcinAvatarAdresi(adres, YEREL)).toBeNull();
    });
  }

  test("sorgu ve parca atiliyor", () => {
    expect(
      kartIcinAvatarAdresi(
        "http://localhost:8000/media/avatars/7/a.jpg?x=1#y",
        YEREL
      )
    ).toBe("http://api:8000/media/avatars/7/a.jpg");
  });

  test("medya koku bilinmiyorsa hicbir sey indirilmiyor", () => {
    expect(
      kartIcinAvatarAdresi("http://localhost:8000/media/a.jpg", null)
    ).toBeNull();
  });
});

test.describe("Medya kokleri", () => {
  test("yerel depo: API adreslerinden turetiliyor", () => {
    expect(
      medyaKokleri({
        NEXT_PUBLIC_API_URL: "http://localhost:8000/api",
        API_URL: "http://api:8000/api",
      })
    ).toEqual(YEREL);
  });

  test("yerel depo, API_URL yok: ic kok acik kokle ayni", () => {
    expect(
      medyaKokleri({ NEXT_PUBLIC_API_URL: "https://api.linkyoself.com/api" })
    ).toEqual({
      acik: "https://api.linkyoself.com/media",
      ic: "https://api.linkyoself.com/media",
    });
  });

  test("S3/CDN: NEXT_PUBLIC_MEDIA_URL kullaniliyor, API_URL'den turetilmiyor", () => {
    expect(
      medyaKokleri({
        NEXT_PUBLIC_MEDIA_URL: "https://cdn.linkyoself.com/",
        NEXT_PUBLIC_API_URL: "http://localhost:8000/api",
        API_URL: "http://api:8000/api",
      })
    ).toEqual({
      acik: "https://cdn.linkyoself.com",
      ic: "https://cdn.linkyoself.com",
    });
  });

  test("bos dizge verilmemis sayiliyor (compose bos build arg'i)", () => {
    expect(
      medyaKokleri({
        NEXT_PUBLIC_MEDIA_URL: "",
        NEXT_PUBLIC_API_URL: "http://localhost:8000/api",
      })?.acik
    ).toBe("http://localhost:8000/media");
  });

  test("hicbir adres yoksa null", () => {
    expect(medyaKokleri({})).toBeNull();
  });
});
