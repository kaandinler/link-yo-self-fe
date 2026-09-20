import { expect, test } from "@playwright/test";

/**
 * Gizlilik politikasi sayfasi.
 *
 * NEDEN TEST: bu sayfanin hatasi sessizdi. Metin boilerplate'ten
 * geldigi gibi kalmisti ve canlida kullanicilara verilerinin "BC
 * Boilerplates" tarafindan islendigini, iletisim icin brocoders'a
 * yazmalari gerektigini soyluyordu; ilk iki paragraf ise hic
 * doldurulmamis "This is the first description text." yer
 * tutucusuydu. Derleme, lint ve tip kontrolu ucu de temizdi.
 *
 * Buradaki testler tarayicinin gordugu metni olcuyor -- dosyada ne
 * yazdigini degil (onu locale-keys.spec.ts yapiyor).
 */

const BASKA_URUNLER = [
  "BC Boilerplates",
  "brocoders",
  "Extensive React Boilerplate",
  "react-boilerplate-coral",
];

test.describe("Gizlilik politikasi", () => {
  test("sayfa bu urunu anlatiyor, baska bir sirketi degil", async ({
    page,
  }) => {
    await page.goto("/en/privacy-policy");

    const metin = await page.locator("body").innerText();

    expect(metin).toContain("Link Yo Self");
    for (const baskasi of BASKA_URUNLER) {
      expect(
        metin.toLowerCase(),
        `sayfada hala "${baskasi}" geciyor`
      ).not.toContain(baskasi.toLowerCase());
    }

    // Boilerplate'in iletisim bolumu: baska bir sirketin e-postasi,
    // sitesi, GitHub tartismalari ve Discord kanali.
    await expect(page.locator('a[href*="brocoders"]')).toHaveCount(0);
    await expect(page.locator('a[href*="discord.com"]')).toHaveCount(0);
    await expect(
      page.locator('a[href="mailto:support@linkyoself.com"]')
    ).toHaveCount(1);
  });

  test("doldurulmamis yer tutucu kalmamis", async ({ page }) => {
    await page.goto("/en/privacy-policy");

    const metin = await page.locator("body").innerText();

    expect(metin).not.toContain("This is the first description text");
    expect(metin).not.toContain("This is the second description text");
    // i18next eksik anahtarda anahtarin kendisini basar; nokta iceren
    // bir anahtar ("intro.p1") ekranda boyle gorunurdu.
    expect(metin).not.toContain("intro.p1");
    expect(metin).not.toContain("summary.item1");
  });

  test("koddaki iki hassas gercek metinde de yaziyor", async ({ page }) => {
    /**
     * Politikanin degeri dogru olmasinda. Kodun soyledigi ama bir
     * boilerplate metninin asla soylemeyecegi iki sey:
     *
     *  1. analytics_events ziyaretciyi tanimlamiyor -- IP yok, kimlik
     *     yok, yalnizca referrer'in host'u (models.py).
     *  2. Hesap kapatma bir SOFT DELETE: kayit siliniyor degil, kapali
     *     isaretleniyor (user_repository.soft_delete_user).
     *
     * Ikisi de kullanicinin lehine olmayan ya da beklemedigi
     * ayrintilar; metinden sessizce dusurulurlerse sayfa yine "temiz"
     * gorunur. Test tam bu yuzden var.
     */
    await page.goto("/en/privacy-policy");

    const gizlenmeyen = page.getByTestId("privacy-policy-not-collected");
    await expect(gizlenmeyen).toBeVisible();
    await expect(gizlenmeyen).toContainText("does not store IP addresses");

    const kapatma = page.getByTestId("privacy-policy-account-closure");
    await expect(kapatma).toBeVisible();
    await expect(kapatma).toContainText("marked closed rather than erased");
  });

  test("/tr adresinde Turkce basiyor", async ({ page }) => {
    await page.goto("/tr/privacy-policy");

    await expect(page.getByTestId("privacy-policy-title")).toHaveText(
      "Gizlilik Politikası"
    );
    await expect(page).toHaveTitle(/Gizlilik Politikası/);
    await expect(page.getByText("Toplanmayanlar")).toBeVisible();
  });
});
