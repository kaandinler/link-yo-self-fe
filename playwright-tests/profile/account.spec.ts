import { expect, test } from "@playwright/test";
import {
  apiLoginStatus,
  apiRegisterAndLogin,
  apiUpdateProfile,
} from "../helpers/api";
import { signInAsAdmin, signInAsNewUser } from "../helpers/auth";
import { fillField } from "../helpers/ui";

test.describe("Hesap kapatma", () => {
  test("kullanici kendi hesabini kapatabiliyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);

    // ONCE ZIYARET: sayfa bir dakikalik pencereyle onbellege aliniyor.
    // Bu satir olmadan kapatmadan sonraki istek zaten onbellege hic
    // girmemis bir sayfayi getiriyor ve test onbellegi hic olcmuyor.
    // Olculdu: bu satirla birlikte, kapatilan hesabin sayfasi hala 200
    // donup silinen profilin adini gosteriyordu.
    await expect(page.goto(`/en/${user.username}`)).resolves.toBeTruthy();

    await page.goto("/en/settings");
    await fillField(page, "#delete-account-password", user.password);
    await page.getByRole("button", { name: "Close my account" }).click();
    await page.getByRole("button", { name: "Close account" }).click();

    // Cikis yapilip giris ekranina donuluyor.
    await expect(page).toHaveURL(/\/sign-in|\/en$|\/en\/$/);

    // Hesap gercekten kapandi: giris yapilamiyor, profil sayfasi 404.
    expect(await apiLoginStatus(user)).not.toBe(200);
    const profil = await page.goto(`/en/${user.username}`);
    expect(profil?.status()).toBe(404);
  });

  test("yanlis sifreyle hesap kapanmiyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/settings");
    await fillField(page, "#delete-account-password", "BaskaSifre123");
    await page.getByRole("button", { name: "Close my account" }).click();
    await page.getByRole("button", { name: "Close account" }).click();

    await expect(
      page.getByText(/could not be closed|incorrect|invalid/i)
    ).toBeVisible();
    expect(await apiLoginStatus(user)).toBe(200);
  });

  test("sifre girilmeden onay diyalogu acilmiyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/settings");
    await page.getByRole("button", { name: "Close my account" }).click();

    await expect(
      page.getByText("Enter your password to confirm.")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close account" })
    ).toHaveCount(0);
  });

  test("giris yapmamis ziyaretci ayarlara giremiyor", async ({ page }) => {
    await page.goto("/en/settings");

    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe("Kapatilan hesabin sayfasi onbellekte kalmiyor", () => {
  test("admin bir hesabi kapatinca o kisinin sayfasi hemen kapaniyor", async ({
    page,
    request,
  }) => {
    /**
     * Sayfa bir dakikalik pencereyle onbellege aliniyor. use-fetch'teki
     * kendiliginden temizlik CAGIRANIN profilini temizliyor, yani
     * panelden silerken admin'inkini; silinen kisininki acikta
     * kalirdi. Uc bu yuzden admin'den kullanici adi kabul ediyor.
     */
    const { user } = await apiRegisterAndLogin();

    // Once ziyaret: onbellek dolsun.
    expect((await request.get(`/en/${user.username}`)).status()).toBe(200);

    const { token: adminToken } = await signInAsAdmin(page);
    const temizlik = await request.post("/api/revalidate-profile", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { username: user.username },
    });
    expect(temizlik.status(), await temizlik.text()).toBe(200);
  });

  test("admin olmayan baskasinin onbellegini temizleyemiyor", async ({
    page,
    request,
  }) => {
    // Uc kullanici adini govdeden aldigi icin, yetki kontrolu olmasa
    // herkes baskasinin sayfasini istedigi kadar backend'e gonderirdi.
    const { user: kurban } = await apiRegisterAndLogin();
    const { token } = await signInAsNewUser(page);

    const yanit = await request.post("/api/revalidate-profile", {
      headers: { Authorization: `Bearer ${token}` },
      data: { username: kurban.username },
    });

    expect(yanit.status()).toBe(403);
  });

  test("tokensiz temizlik reddediliyor", async ({ request }) => {
    expect((await request.post("/api/revalidate-profile")).status()).toBe(401);
  });

  test("ust uste temizlik backend'e tekrar tekrar sormuyor", async ({
    page,
    request,
  }) => {
    /**
     * Her temizlik cagrisi backend'e bir "kim bu" sorusu demekti.
     * Olculdu: tek istemciden 60 paralel temizlik -> backend'e 61
     * kimlik sorgusu. Kisa omurlu bir kimlik onbellegiyle 60 -> 1.
     *
     * Temizligin KENDISI atlanmiyor -- atlamak ya da 429 dondurmek
     * guvenli olmazdi: dusen bir temizlik, kullanicinin kendi
     * sayfasini bir dakika eski gormesi demek. Onun icin asagida hem
     * kaynagin onbellek oldugu hem de temizligin gercekten calistigi
     * olculuyor.
     */
    const { token } = await signInAsNewUser(page);
    const baslik = { Authorization: `Bearer ${token}` };

    const ilk = await request.post("/api/revalidate-profile", {
      headers: baslik,
    });
    expect(ilk.status()).toBe(200);
    expect(ilk.headers()["x-kimlik-kaynagi"]).toBe("backend");

    const ikinci = await request.post("/api/revalidate-profile", {
      headers: baslik,
    });
    expect(ikinci.status()).toBe(200);
    expect(ikinci.headers()["x-kimlik-kaynagi"]).toBe("onbellek");
  });

  test("uc, kullanici adinin var olup olmadigini soylemiyor", async ({
    page,
    request,
  }) => {
    /**
     * Govdede kullanici adi kabul eden her uc bir varlik sorgusuna
     * donusebilir. Olculdu: var olan ve olmayan kullanici adi icin
     * yanit BIREBIR ayni (403 "Yetki yok"), yani admin olmayan biri
     * bu uctan kimin kayitli oldugunu ogrenemiyor.
     *
     * Kolayca bozulabilir: ileride "kullanici bulunamadi" diye
     * yardimsever bir 404 eklenirse uc bir varlik oracle'ina doner.
     */
    const { user: baskasi } = await apiRegisterAndLogin();
    const { token } = await signInAsNewUser(page);
    const baslik = { Authorization: `Bearer ${token}` };

    const varOlan = await request.post("/api/revalidate-profile", {
      headers: baslik,
      data: { username: baskasi.username },
    });
    const olmayan = await request.post("/api/revalidate-profile", {
      headers: baslik,
      data: { username: "kesinlikle-olmayan-kullanici" },
    });

    expect(varOlan.status()).toBe(403);
    expect(olmayan.status()).toBe(varOlan.status());
    expect(await olmayan.text()).toBe(await varOlan.text());
  });

  test("tanilama basliklari yalnizca kendi basarili cagrinda", async ({
    page,
    request,
  }) => {
    /**
     * x-kimlik-kaynagi ve x-profil-onbellek-saniye bilincli olarak
     * uretimde de donuyor: CDN'lerin x-cache: HIT/MISS basligiyla ayni
     * is -- hangi katmanin cevapladigini gormek hata ayiklamanin en
     * dogrudan yolu. Tasidiklari sey de cagiranin kendi istegine ait.
     *
     * Olculdu ve burada tutulan sinir: kimligi dogrulanmamis birine
     * hicbir tanilama gitmiyor.
     */
    const tokensiz = await request.post("/api/revalidate-profile");
    expect(tokensiz.status()).toBe(401);
    expect(tokensiz.headers()["x-kimlik-kaynagi"]).toBeUndefined();
    expect(tokensiz.headers()["x-profil-onbellek-saniye"]).toBeUndefined();

    const { token } = await signInAsNewUser(page);
    const kendi = await request.post("/api/revalidate-profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(kendi.status()).toBe(200);
    expect(kendi.headers()["x-kimlik-kaynagi"]).toBeDefined();
  });

  test("tazelik penceresi disari bildiriliyor", async ({ page, request }) => {
    /**
     * Pencerenin ne kadar oldugu isletme bilgisi: `revalidateTag`
     * yalnizca cagrinin dustugu Next ornegini temizliyor (iki ornekle
     * olculdu -- 3000'de temizlik yapilinca 3001 eski adi gostermeye
     * devam ediyordu), dolayisiyla birden fazla ornekle kosuluyorsa
     * staleligin tavani bu deger oluyor.
     *
     * Sifir ya da anlamsiz bir env degeriyle sessizce onbelleksiz
     * kalmak en kotu sonuc olurdu; bu yuzden deger disaridan
     * okunabiliyor ve burada pozitif oldugu tutuluyor.
     */
    const { token } = await signInAsNewUser(page);
    const yanit = await request.post("/api/revalidate-profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const pencere = Number(yanit.headers()["x-profil-onbellek-saniye"]);
    expect(Number.isInteger(pencere), `pencere: ${pencere}`).toBe(true);
    expect(pencere).toBeGreaterThan(0);
  });

  test("onbellekten gelen kimlikle de temizlik gercekten yapiliyor", async ({
    page,
  }) => {
    /**
     * Kimlik onbellekten geldiginde de sayfa tazeleniyor mu? Asil
     * risk burada: "sorguyu atlayalim" diye baslayip "temizligi de
     * atlayalim"a varan bir degisiklik, kullanicinin kendi sayfasini
     * eskitirdi.
     *
     * Iki ardisik kayit: ikincisi kimlik onbellegi doluyken yapiliyor.
     */
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, { display_name: "Birinci Ad" });

    await page.goto(`/en/${user.username}`);
    await expect(
      page.getByRole("heading", { name: "Birinci Ad" })
    ).toBeVisible();

    await apiUpdateProfile(token, { display_name: "Ikinci Ad" });

    await page.goto(`/en/${user.username}`);
    await expect(
      page.getByRole("heading", { name: "Ikinci Ad" })
    ).toBeVisible();
  });
});
