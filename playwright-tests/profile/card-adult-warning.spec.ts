import { expect, test } from "@playwright/test";
import {
  apiDeleteAvatar,
  apiUpdatePageSettings,
  apiUpdateProfile,
  apiUploadAvatar,
  uniqueUser,
} from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * +18 uyarisi acikken paylasim kartinin ne gosterdigi.
 *
 * NEDEN KART AYRI BIR DURUM: sayfanin ara ekrani ziyaretciden onay
 * istiyor, ama kart o ekrani hic gormuyor -- onizleme sohbet
 * penceresinde ya da akista kendiliginden aciliyor. Uyari acikken kart
 * avatari (sahibinin yukledigi gorsel) ve bio'yu (yine sahibinin
 * yazdigi serbest metin) disarida birakiyor.
 *
 * OLCU HER YERDE AYNI: kartin BAYTLARI. Bir sey karta girdiyse cizim
 * degisir, girmediyse bayt bayt ayni kalir. PNG'nin icini okumaya gerek
 * kalmiyor.
 *
 * HER TESTIN BIR KONTROLU VAR: "uyari acikken girmiyor" tek basina,
 * o sey HICBIR ZAMAN girmiyorsa da gecerdi. Bu yuzden her iddianin
 * yaninda "uyari kapaliyken giriyor" olcumu duruyor.
 *
 * Avatar gercekten yukleniyor (apiUploadAvatar): kart yalnizca bizim
 * medya kokumuzdeki gorselleri indiriyor (bkz. services/media-url.ts).
 * Kontrol testi bu yuzden ayni zamanda yukle -> depola -> karta gom
 * zincirinin uctan uca calistigini olcuyor.
 */

async function kartBaytlari(
  request: import("@playwright/test").APIRequestContext,
  username: string
) {
  const yanit = await request.get(`/en/${username}/opengraph-image`);
  expect(yanit.status()).toBe(200);
  expect(yanit.headers()["content-type"]).toContain("image/png");
  return yanit.body();
}

/**
 * Her test kendi kullanicisini kuruyor.
 *
 * apiUpdateProfile ve apiUpdatePageSettings kaydettikten sonra onbellegi
 * temizliyor, yani olculen sey her seferinde yeniden cizilmis kart.
 */
async function profilKur(page: import("@playwright/test").Page) {
  const { user, token } = await signInAsNewUser(page, { user: uniqueUser() });
  await apiUpdateProfile(token, { display_name: "Katherine Johnson" });
  return { user, token };
}

test.describe("Kart ve +18 uyarisi", () => {
  test("uyari kapaliyken avatar karta giriyor (kontrol)", async ({
    page,
    request,
  }) => {
    const { user, token } = await profilKur(page);

    await apiDeleteAvatar(token);
    const avatarsiz = await kartBaytlari(request, user.username);

    await apiUploadAvatar(token);
    const avatarli = await kartBaytlari(request, user.username);

    // Bu gecmezse asagidaki test anlamsiz olurdu: avatar hicbir zaman
    // girmiyorsa "uyari acikken girmiyor" kendiliginden dogru olur.
    expect(
      avatarli.equals(avatarsiz),
      "avatar karta hic girmiyor; asagidaki olcum bir sey kanitlamaz"
    ).toBe(false);
  });

  test("uyari acikken avatar karta girmiyor", async ({ page, request }) => {
    const { user, token } = await profilKur(page);
    await apiUpdatePageSettings(token, { adult_warning_enabled: true });

    await apiDeleteAvatar(token);
    const avatarsiz = await kartBaytlari(request, user.username);

    await apiUploadAvatar(token);
    const avatarli = await kartBaytlari(request, user.username);

    expect(
      avatarli.equals(avatarsiz),
      `avatar uyariya ragmen karta gomulmus: ${avatarli.length} vs ${avatarsiz.length} bayt`
    ).toBe(true);
  });

  test("uyari kapaliyken bio karta giriyor (kontrol)", async ({
    page,
    request,
  }) => {
    const { user, token } = await profilKur(page);

    await apiUpdateProfile(token, { bio: "" });
    const biosuz = await kartBaytlari(request, user.username);

    await apiUpdateProfile(token, { bio: "Uzun ve ayrintili bir tanitim" });
    const biolu = await kartBaytlari(request, user.username);

    expect(
      biolu.equals(biosuz),
      "bio karta hic girmiyor; asagidaki olcum bir sey kanitlamaz"
    ).toBe(false);
  });

  test("uyari acikken bio karta girmiyor", async ({ page, request }) => {
    const { user, token } = await profilKur(page);
    await apiUpdatePageSettings(token, { adult_warning_enabled: true });

    await apiUpdateProfile(token, { bio: "" });
    const biosuz = await kartBaytlari(request, user.username);

    await apiUpdateProfile(token, { bio: "Uzun ve ayrintili bir tanitim" });
    const biolu = await kartBaytlari(request, user.username);

    expect(
      biolu.equals(biosuz),
      `bio uyariya ragmen karta girmis: ${biolu.length} vs ${biosuz.length} bayt`
    ).toBe(true);
  });

  test("ayari acmak kartin kendisini degistiriyor", async ({
    page,
    request,
  }) => {
    /**
     * BURADA OLCULEN SEY ONBELLEK.
     *
     * Kart bir saat boyunca yeniden uretilmeden servis edilebiliyor
     * (opengraph-image.tsx, KART_ONBELLEK_SANIYE). Ayar degistiginde
     * temizlik kart etiketine de ulasmasaydi, sahibi uyariyi acsa bile
     * eski kart bir saat daha paylasilmaya devam ederdi.
     */
    const { user, token } = await profilKur(page);
    await apiUploadAvatar(token);

    const once = await kartBaytlari(request, user.username);

    await apiUpdatePageSettings(token, { adult_warning_enabled: true });
    const sonra = await kartBaytlari(request, user.username);

    expect(
      sonra.equals(once),
      "ayar degisti ama kart ayni kaldi: temizlik kart etiketine ulasmiyor"
    ).toBe(false);
  });
});
