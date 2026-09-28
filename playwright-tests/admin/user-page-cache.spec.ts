import { Page, expect, test } from "@playwright/test";
import { apiGetMe, apiRegisterAndLogin, uniqueUser } from "../helpers/api";
import { signInAsAdmin } from "../helpers/auth";
import { fillField, waitForHydration } from "../helpers/ui";

/**
 * Admin BASKA bir kullaniciyi kapatinca ya da yeniden adlandirinca o
 * kisinin herkese acik sayfasi onbellekte kalmamali.
 *
 * NEDEN AYRI BIR DOSYA: vekil basarili her mutasyonda CAGIRANIN
 * sayfasini temizliyor (bkz. profile/save-then-leave.spec.ts). Admin
 * islemlerinde degisen sayfa cagiranin degil adresteki kullanicinin
 * (`/v1/users/{id}`). Eskiden:
 *   - silme: panel, silme yaniti geldikten SONRA ayri bir
 *     /api/revalidate-profile cagrisi yapiyordu; admin yanit gelmeden
 *     sayfadan ayrilirsa hic atilmiyordu.
 *   - duzenleme: hic temizlik yoktu; kullanici adi degisince eski
 *     adres 60 sn boyunca eski profili gostermeye devam ediyordu.
 *
 * Iki test de mutasyon yanitini SAYFAYA HIC ULASTIRMIYOR: istek
 * sunucuya eksiksiz gidiyor (route.fetch), sayfaya ag hatasi donuyor.
 * Gercek admin'in yaniti beklemeden ayrilmasi da bu. Yarisa bagli
 * degil: temizlik istemcideyken iki test de HER KOSUDA duser.
 */

/**
 * `/api/proxy/v1/users/{id}` uzerindeki `method` isteginin yanitini
 * sayfadan saklar. Donen fonksiyon backend'in durum kodunu verir.
 */
async function yanitiSakla(page: Page, method: string) {
  let durum = 0;
  await page.route(/\/api\/proxy\/v1\/users\/\d+$/, async (route) => {
    if (route.request().method() !== method) return route.continue();
    durum = (await route.fetch()).status();
    await route.abort();
  });
  const kesildi = page.waitForEvent(
    "requestfailed",
    (r) =>
      /\/api\/proxy\/v1\/users\/\d+$/.test(r.url()) && r.method() === method
  );
  return { kesildi, durum: () => durum };
}

/** Yenileme / sekmeyi kapatma; sonra temizligin etkisini bekleme payi. */
async function hemenAyril(page: Page) {
  await page.goto("about:blank");
  await page.waitForTimeout(1500);
}

test.describe("Admin islemlerinden sonra kullanicinin sayfasi", () => {
  test("panelden kapatilan hesabin sayfasi, admin hemen ayrilsa da kapaniyor", async ({
    page,
    request,
  }) => {
    const { user } = await apiRegisterAndLogin();

    // Onbellegi isit.
    expect((await request.get(`/en/${user.username}`)).status()).toBe(200);

    await signInAsAdmin(page);

    // Liste sayfalanmis ve suit yuzlerce kullanici biriktiriyor; hedef
    // arama filtresiyle tek satira indiriliyor.
    const filtre = encodeURIComponent(
      JSON.stringify({ search: user.username })
    );
    await page.goto(`/en/admin-panel/users?filter=${filtre}`);
    const satir = page.locator("table tbody tr", { hasText: user.username });
    await expect(satir).toHaveCount(1);

    await waitForHydration(page, '[aria-label="select merge strategy"]');
    await satir.getByRole("button", { name: "select merge strategy" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    const silme = await yanitiSakla(page, "DELETE");
    await page.getByRole("button", { name: "Yes" }).click();
    await silme.kesildi;

    // On kosul: hesap backend'de gercekten kapandi. Kapanmasaydi
    // sayfanin acik olmasi dogru davranis olurdu.
    expect(silme.durum(), "silme basarisiz; olcum gecersiz").toBe(204);

    await hemenAyril(page);

    // TEK getirme, yoklama yok: yoklama 60 sn'lik tavanin bitmesini
    // bekleyerek bayat sayfayi da gecirebilirdi.
    expect(
      (await request.get(`/en/${user.username}`)).status(),
      "kapatilan hesabin sayfasi onbellekten hala aciliyor"
    ).toBe(404);
  });

  test("yeniden adlandirilan kullanicinin eski adresi hemen kapaniyor, yenisi aciliyor", async ({
    page,
    request,
  }) => {
    const { user, token } = await apiRegisterAndLogin();
    const { id } = await apiGetMe(token);
    const yeniAd = uniqueUser("ad").username;

    // Iki adres de isitiliyor: eskisi 200, yenisi (henuz yok) 404.
    // Yeni adresin 404'u onbellege girdiyse o da temizlenmeli.
    expect((await request.get(`/en/${user.username}`)).status()).toBe(200);
    expect((await request.get(`/en/${yeniAd}`)).status()).toBe(404);

    await signInAsAdmin(page);
    await page.goto(`/en/admin-panel/users/edit/${id}`);

    // Form sunucudaki degerle dolmadan yazmak, gelen degerin yazilani
    // ezmesi yarisini yaratirdi.
    await expect(page.locator('input[name="username"]')).toHaveValue(
      user.username
    );
    await fillField(page, 'input[name="username"]', yeniAd);

    const duzenleme = await yanitiSakla(page, "PATCH");
    await page
      .locator("form", { has: page.locator('input[name="username"]') })
      .locator('button[type="submit"]')
      .click();
    await duzenleme.kesildi;
    expect(duzenleme.durum(), "duzenleme basarisiz; olcum gecersiz").toBe(200);

    await hemenAyril(page);

    expect(
      (await request.get(`/en/${user.username}`)).status(),
      "eski adres onbellekten hala eski profili gosteriyor"
    ).toBe(404);
    expect(
      (await request.get(`/en/${yeniAd}`)).status(),
      "yeni adres hala 404"
    ).toBe(200);
  });
});
