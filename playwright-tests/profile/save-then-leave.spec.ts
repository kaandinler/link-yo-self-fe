import { expect, test } from "@playwright/test";
import { signInAsNewUser } from "../helpers/auth";
import { waitForHydration } from "../helpers/ui";

/**
 * Kaydedip HEMEN sayfadan ayrilan kullanicinin herkese acik sayfasi
 * guncel olmali.
 *
 * NEDEN AYRI BIR TEST: onbellek temizligi eskiden yalnizca istemcideydi
 * -- kaydetme yaniti tarayiciya ulastiktan SONRA atilan ikinci bir
 * istek (/api/revalidate-profile). Kullanici o yanit gelmeden sayfayi
 * yenilerse, sekmeyi kapatirsa ya da adres cubuguna bir sey yazarsa o
 * istek hic atilmiyordu ve sayfa onbellek tavanina (60 sn) kadar eski
 * kaliyordu. Olculdu (uretim derlemesi, 12 kosu): 9 bayat / 3 taze.
 * `keepalive: true` bunu cozmedi (8 / 4): cogu kosuda kaydetme yaniti
 * henuz gelmemis oluyor, yani temizlik istegi hic olusmuyor.
 *
 * Temizlik artik vekilde, kaydetmeyle AYNI istegin icinde yapiliyor
 * (bkz. app/api/proxy/[...yol]/route.ts). Bu test onu olcuyor:
 * istemcinin temizlik cagrisi kesildiginde de sayfa taze olmali.
 *
 * Adim adim, gorevdeki olcumun aynisi:
 *   onbellegi isit -> arayuzden kaydet -> hemen tam sayfa gecisi ->
 *   1,5 sn sonra sayfayi getir.
 */

const PERDE_KIMLIGI = "adult-warning-title";

test.describe("Kaydedip hemen ayrilinca sayfa bayat kalmiyor", () => {
  test("+18 ayari kaydedilir kaydedilmez ayrilinca sayfa yine guncel", async ({
    page,
    request,
  }) => {
    const { user } = await signInAsNewUser(page);

    // Onbellegi isit: ayar kapaliyken bir ziyaret, perde yok.
    const once = await request.get(`/en/${user.username}`);
    expect(once.status()).toBe(200);
    expect(await once.text()).not.toContain(PERDE_KIMLIGI);

    await page.goto("/en/profile/customize");
    await waitForHydration(page, '[data-testid="save-page-settings"]');

    const kutu = page.getByLabel(/18\+ warning/i);
    await expect(kutu).toBeEnabled();
    await kutu.check();

    /*
     * Kaydetme yaniti SAYFAYA HIC ULASMIYOR.
     *
     * Istek sunucuya eksiksiz gidiyor (route.fetch), yaniti bekleniyor
     * -- yani kayit ve vekilin isi kesin olarak bitmis oluyor -- ama
     * tarayiciya bir ag hatasi donuyor. Gercek kullanicida da olan bu:
     * yanit gelmeden tam sayfa gecisi, istemcinin temizlik cagrisini
     * hic olusturmuyor. Farki, burada bunun yarisa bagli olmamasi
     * (olcumde istemci 12'de 3 kez yetisiyordu).
     *
     * Temizlik yalnizca istemcideyken bu test HER KOSUDA duser.
     */
    let kayitDurumu = 0;
    await page.route("**/api/proxy/v1/profile/page-settings", async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      kayitDurumu = (await route.fetch()).status();
      await route.abort();
    });

    const kaydetme = page.waitForEvent("requestfailed", (r) =>
      r.url().includes("/api/proxy/v1/profile/page-settings")
    );
    await page.getByTestId("save-page-settings").click();
    await kaydetme;

    // On kosul: kayit backend'de basarili olmali. Olmasaydi sayfanin
    // eski olmasi dogru davranis olurdu ve test hicbir sey olcmezdi.
    expect(kayitDurumu, "kayit basarisiz; olcum gecersiz").toBe(200);

    // Yenileme / sekmeyi kapatma / adres cubuguna yazma.
    await page.goto("about:blank");

    await page.waitForTimeout(1500);

    // TEK getirme, yoklama yok: yoklama 60 sn'lik tavanin bitmesini
    // bekleyerek bayat sayfayi da gecirebilirdi.
    const sonra = await request.get(`/en/${user.username}`);
    expect(sonra.status()).toBe(200);
    expect(
      await sonra.text(),
      "sayfa onbellekten eski haliyle geldi"
    ).toContain(PERDE_KIMLIGI);
  });
});
