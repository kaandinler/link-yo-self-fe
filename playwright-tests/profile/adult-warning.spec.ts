import { expect, test } from "@playwright/test";
import {
  apiCreateLink,
  apiRegisterAndLogin,
  apiUpdatePageSettings,
  uniqueUser,
} from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { clickWhenReady, waitForHydration } from "../helpers/ui";

/**
 * Herkese acik sayfadaki +18 ara ekrani.
 *
 * Ayar backend'de users tablosunda degil, user_page_settings'te
 * (PageSettings). Perde tamamen istemcide karar veriliyor: "bu ziyaretci
 * onayladi mi" bilgisi ziyaretciye ait, sayfa ise herkes icin ayni
 * sekilde onbellege aliniyor.
 */

const PERDE = '[role="dialog"][aria-labelledby="adult-warning-title"]';
const ONAY_DUGMESI = '[data-testid="adult-warning-confirm"]';
const LINK_BASLIGI = "Gizli link";

/**
 * Onaya, React dugmeyi devraldiktan SONRA tiklar.
 *
 * NEDEN: perdenin "gorunur" olmasi tiklanabilir olmasi demek degil.
 * Sayfa sunucuda uretiliyor; gelen HTML'de dugme tam olarak son halinde
 * duruyor ama onClick'i bagli degil. O aralikta atilan tiklama hicbir
 * sey yapmiyor ve Playwright de basarili sayiyor -- perde yerinde
 * kaliyor, sonraki beklenti 20 saniye bosuna yokluyor.
 *
 * Olculdu (5 kosu): perde gorunur oldugu anda dugme HER SEFERINDE ham
 * HTML; hydrate 115-163 ms sonra geliyor. Yani tiklama her kosuda ~150
 * ms'lik bir bosluga giriyor ve yalnizca Playwright'in kendi
 * hazirlik kontrolleri bu sureyi doldurdugu icin genelde isabet
 * ediyor. Makine mesgulken isabet etmiyor: bu dosyanin uc testi
 * (tiklayan uc test) yerelde tam olarak boyle dusuyordu, CI'da
 * geciyordu.
 *
 * Depoda bunun icin zaten bir yardimci var; eksik olan, burada
 * kullanilmamasiydi.
 */
async function onayla(page: Parameters<typeof clickWhenReady>[0]) {
  await clickWhenReady(page, ONAY_DUGMESI);
}

async function uyarisiAcikProfil() {
  const { user, token } = await apiRegisterAndLogin(uniqueUser());
  await apiCreateLink(token, {
    title: LINK_BASLIGI,
    url: "https://ornek.test/gizli",
  });
  await apiUpdatePageSettings(token, { adult_warning_enabled: true });
  return { user, token };
}

test.describe("+18 uyarisi", () => {
  test("ayar kapaliyken perde hic cikmiyor", async ({ page }) => {
    /**
     * Varsayilan davranis degismemeli: ayara dokunmamis butun
     * profiller bu testten once oldugu gibi acilmali.
     */
    const { user, token } = await apiRegisterAndLogin(uniqueUser());
    await apiCreateLink(token, {
      title: LINK_BASLIGI,
      url: "https://ornek.test/gizli",
    });

    await page.goto(`/en/${user.username}`);

    await expect(page.locator(PERDE)).toHaveCount(0);
    await expect(page.getByRole("link", { name: LINK_BASLIGI })).toBeVisible();
  });

  test("acikken perde cikiyor ve linkler ulasilamiyor", async ({ page }) => {
    const { user } = await uyarisiAcikProfil();

    await page.goto(`/en/${user.username}`);

    await expect(page.locator(PERDE)).toBeVisible();

    /**
     * ICERIK YALNIZCA GORUNMEZ DEGIL, ULASILAMAZ OLMALI.
     *
     * Perde ustte durdugu icin link gozle gorunmuyor; ama `inert`
     * olmasaydi sekme tusu ve ekran okuyucu ona yine ulasirdi -- uyari
     * gozle var, islevsiz olurdu.
     *
     * IKI AYRI SORU, IKI AYRI SECICI:
     *  (1) CSS ile: link DOM'da var mi? Sayfa sunucuda render ediliyor,
     *      icerik uretilmis olmali -- yoksa test "icerik hic
     *      olusturulmamis" halinde de gecerdi.
     *  (2) Rol ile: erisilebilirlik agacinda YOK mu? inert + aria-hidden
     *      ogeyi agactan tamamen cikariyor, rol sorgusu onu hic
     *      gormuyor. Olculen koruma tam olarak bu.
     *
     * Not: yalnizca toBeHidden() yazmak yetmezdi -- o, bulunamayan oge
     * icin de geciyor, yani yanlis bir seciciyle de gecerdi.
     */
    await expect(
      page.locator(`a[data-link-id]:has-text("${LINK_BASLIGI}")`)
    ).toHaveCount(1);
    await expect(page.getByRole("link", { name: LINK_BASLIGI })).toHaveCount(0);
  });

  test("onaylayinca icerik aciliyor", async ({ page }) => {
    const { user } = await uyarisiAcikProfil();
    await page.goto(`/en/${user.username}`);
    await expect(page.locator(PERDE)).toBeVisible();

    await onayla(page);

    await expect(page.locator(PERDE)).toHaveCount(0);
    await expect(page.getByRole("link", { name: LINK_BASLIGI })).toBeVisible();
  });

  test("onay hatirlaniyor, ikinci ziyarette perde yok", async ({ page }) => {
    const { user } = await uyarisiAcikProfil();
    await page.goto(`/en/${user.username}`);
    await onayla(page);
    await expect(page.locator(PERDE)).toHaveCount(0);

    await page.goto(`/en/${user.username}`);

    // Perde ilk karede gorunup useEffect ile kalkiyor; toHaveCount(0)
    // yoklayarak bekledigi icin o kisa ani beklemek gerekmiyor.
    await expect(page.locator(PERDE)).toHaveCount(0);
    await expect(page.getByRole("link", { name: LINK_BASLIGI })).toBeVisible();
  });

  test("onay profil basina; baska profilde perde yine cikiyor", async ({
    page,
  }) => {
    const ilk = await uyarisiAcikProfil();
    const ikinci = await uyarisiAcikProfil();

    await page.goto(`/en/${ilk.user.username}`);
    await onayla(page);
    await expect(page.locator(PERDE)).toHaveCount(0);

    await page.goto(`/en/${ikinci.user.username}`);

    // Onay anahtari kullanici adiyla saklaniyor; tek onay butun
    // profilleri acsaydi bu test duserdi.
    await expect(page.locator(PERDE)).toBeVisible();
  });

  test("customize sayfasindan acilinca herkese acik sayfaya yansiyor", async ({
    page,
  }) => {
    /**
     * Uctan uca: ayar arayuzden kaydediliyor, API'den degil. Kaydetme
     * sonrasi onbellek temizligi use-fetch.ts'te yapiliyor ve bu ayar
     * da oradan geciyor -- temizlik olmasaydi sayfa bir dakika bayat
     * kalir ve perde gorunmezdi.
     */
    const { user, token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: LINK_BASLIGI,
      url: "https://ornek.test/gizli",
    });

    await page.goto("/en/profile/customize");
    await waitForHydration(page, '[data-testid="save-page-settings"]');

    // Kutu, ayarlar gelene kadar disabled. Beklemeden isaretlemek
    // "sunucudan gelen deger secimi eziyor" yarisini yaratiyordu.
    const kutu = page.getByLabel(/18\+ warning/i);
    await expect(kutu).toBeEnabled();
    await kutu.check();
    await page.getByTestId("save-page-settings").click();

    await expect
      .poll(async () => {
        await page.goto(`/en/${user.username}`);
        return page.locator(PERDE).count();
      })
      .toBe(1);
  });
});
