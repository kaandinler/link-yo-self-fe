import { expect, test, type Page } from "@playwright/test";
import { apiCreateLink, apiUpdateProfile } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Her sayfada TAM OLARAK BIR <h1>.
 *
 * NEDEN: app-bar'daki "LinkYoSelf" logosu <h1> olarak yaziliydi ve
 * app-bar kok layout'ta, yani HER sayfada. Sonuc: her sayfada iki h1
 * ve belge sirasinda ONCE site adi geliyordu. Olculdu:
 *
 *   /en/<kullanici>   -> ["LinkYoSelf", "Ada Lovelace"]
 *   /en/about         -> ["LinkYoSelf", "A link-in-bio page, ..."]
 *   /en/privacy-policy-> ["LinkYoSelf", "Privacy Policy"]
 *
 * En cok herkese acik profilde canini yakiyordu: o sayfanin konusu
 * kisinin kendisi, ama hem kaziyicinin hem ekran okuyucunun gordugu
 * ilk baslik urunun adiydi -- her profilde ayni. Yapisal veri,
 * paylasim karti ve sitemap icin harcanan emegin tersine calisiyordu.
 *
 * Logo artik <span>. Ama olcumun asil gosterdigi sey bir digeri:
 * logo kaldirilinca DORT sayfa bassiz kaliyordu (sign-in, sign-up,
 * forgot-password, profile/edit) -- yani bugune kadar onlarin tek h1'i
 * baska bir sayfanin adiydi. Onlara kendi basliklari verildi.
 *
 * Bu test iki yonlu: sifir h1 da, iki h1 da kirmizi donuyor.
 */

/**
 * Sayfayi acar, OTURMASINI BEKLER ve basliklari doner.
 *
 * Bekleme sekli onemli. Ilk denemede yalnizca ust seridin gorunur
 * olmasi bekleniyordu ve test uc sayfada "0 adet h1" diye dustu --
 * oysa sayfalar duzgundu: ust serit sunucudan gelen kabukta hemen
 * var, sayfanin kendi icerigi ise istemcide ~500 ms sonra geliyor.
 * Yani olcum icerik gelmeden yapiliyordu.
 *
 * Simdi once en az bir baslik cikmasi bekleniyor (sayfa oturdu
 * demek), sonra kisa bir sure daha: gec gelen IKINCI bir baslik da
 * sayima girsin. Ikincisi kacarsa test asil yakalamasi gereken
 * durumu kacirir.
 */
async function basliklar(page: Page, yol: string): Promise<string[]> {
  await page.goto(yol);
  await expect(page.getByRole("banner")).toBeVisible();
  await expect
    .poll(() => page.locator("h1").count(), { timeout: 20_000 })
    .toBeGreaterThan(0);
  await page.waitForTimeout(1000);
  return page.locator("h1").allInnerTexts();
}

async function tekBaslikOlmali(page: Page, yol: string) {
  const bulunan = await basliklar(page, yol);
  expect(
    bulunan.length,
    `${yol} -> ${bulunan.length} adet h1: ${JSON.stringify(bulunan)}`
  ).toBe(1);
  expect(bulunan[0].trim(), `${yol} basligi bos`).not.toBe("");
}

const ACIK_SAYFALAR = [
  "/en/landing-page",
  "/en/about",
  "/en/contact",
  "/en/privacy-policy",
  "/en/terms",
  "/en/sign-in",
  "/en/sign-up",
  "/en/forgot-password",
  "/en/boyle-bir-sayfa-yok",
];

const GIRISLI_SAYFALAR = [
  "/en/dashboard",
  "/en/links",
  "/en/analytics",
  "/en/profile",
  "/en/profile/edit",
  "/en/profile/customize",
  "/en/settings",
];

test.describe("Baslik duzeni", () => {
  for (const yol of ACIK_SAYFALAR) {
    test(`${yol} tek h1 tasiyor`, async ({ page }) => {
      await tekBaslikOlmali(page, yol);
    });
  }

  test("giris gerektiren sayfalar tek h1 tasiyor", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAsNewUser(page);
    for (const yol of GIRISLI_SAYFALAR) {
      await tekBaslikOlmali(page, yol);
    }
  });

  test("herkese acik profilin h1'i KISININ ADI", async ({ page }) => {
    /**
     * Bu dosyadaki en onemli test. Profil sayfasinin tek basligi
     * urunun adi degil, profilin sahibi olmali: sayfanin konusu o.
     */
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, { display_name: "Ada Lovelace" });
    await apiCreateLink(token, { title: "Blog", url: "https://ada.test/b" });

    const bulunan = await basliklar(page, `/en/${user.username}`);

    expect(bulunan).toEqual(["Ada Lovelace"]);
  });
});
