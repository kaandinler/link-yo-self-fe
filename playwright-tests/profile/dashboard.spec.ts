import { expect, test } from "@playwright/test";
import {
  apiClickLink,
  apiCreateLink,
  apiListLinks,
  apiUpdateProfile,
} from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

test.describe("Pano ve analytics", () => {
  test("pano kullaniciyi adiyla karsilayip profil adresini gosteriyor", async ({
    page,
  }) => {
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, { display_name: "Pano Kullanicisi" });

    await page.goto("/en/dashboard");

    await expect(
      page.getByRole("heading", { name: /Welcome back, Pano Kullanicisi/ })
    ).toBeVisible();
    await expect(page.getByText(`/${user.username}`).first()).toBeVisible();
  });

  test("linki olmayan kullanici bos durumu goruyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/dashboard");

    await expect(
      page.getByText("You haven't added any links yet.")
    ).toBeVisible();
  });

  test("eklenen linkler panoda listeleniyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Panodaki link",
      url: "https://ornek.test/pano",
    });

    await page.goto("/en/dashboard");

    await expect(page.getByText("Panodaki link")).toBeVisible();
    await expect(page.getByText("https://ornek.test/pano")).toBeVisible();
  });

  test("analytics sayfasi ozet sayilari gosteriyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Olculen link",
      url: "https://ornek.test/olcum",
    });

    await page.goto("/en/analytics");

    await expect(
      page.getByRole("heading", { name: "Analytics" })
    ).toBeVisible();
    await expect(page.getByText("Total Clicks")).toBeVisible();
    // Link hem aralik kiriliminda hem "tum zamanlar" listesinde geciyor.
    await expect(page.getByText("Olculen link").first()).toBeVisible();
  });

  test("ziyaretci tiklamasi gezinince panoya yansiyor", async ({ page }) => {
    /**
     * ANALYTICS TAZELIGI BILINCLI BIR SECIM, BU TEST ONU TUTUYOR.
     *
     * React Query'de `staleTime` ayarlanmamis (varsayilan 0), yani her
     * sayfa gecisinde veri arka planda yeniden cekiliyor. Bu bedava
     * degil: pano <-> analytics arasinda iki tur gezinme 14 istek
     * uretiyor; `staleTime: 30_000` ile 4'e dusuyordu -- olculdu.
     *
     * Ama bedeli urunun asil geri bildirim dongusu oluyor. Ziyaretci
     * tiklamasi uygulama ICINDEN gelen bir mutasyon degil, dolayisiyla
     * invalidateQueries calismiyor; tazeligi saglayan tek sey
     * staleTime'in sifir olmasi. Olculdu:
     *
     *   bugun (staleTime yok)   gezinme sonrasi tiklama sayisi 1
     *   staleTime: 30_000       gezinme sonrasi 0, ancak tam sayfa
     *                           yenilemesinden sonra 1
     *
     * Yani linkini paylasip panosuna bakan kullanici yarim dakika
     * boyunca sifir gorurdu. 14 -> 4 istek bunun icin verilmez.
     *
     * Bu test o kararin bekcisi: global bir staleTime eklenirse
     * kirilir ve neyin kaybedildigini soyler.
     */
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/b" });
    const link = (await apiListLinks(token))[0];

    await page.goto("/en/dashboard");
    await expect(page.getByText("Your Profile URL")).toBeVisible();

    const tiklamaSayisi = page
      .locator("p", { hasText: /^Total Clicks$/ })
      .locator("xpath=following-sibling::p[1]")
      .first();
    await expect(tiklamaSayisi).toHaveText("0");

    // Ziyaretci tikliyor: uygulamanin disindan gelen bir degisiklik.
    await apiClickLink(link.id);

    // TAM SAYFA YENILEMESI YOK, yalnizca uygulama ici gezinme.
    await page.getByRole("link", { name: "Analytics" }).first().click();
    await expect(
      page.getByLabel(/Daily link clicks and profile views/)
    ).toBeVisible();
    await page.getByRole("link", { name: "Dashboard" }).first().click();

    await expect(tiklamaSayisi).toHaveText("1");
  });

  test("giris yapmamis ziyaretci panoya giremiyor", async ({ page }) => {
    await page.goto("/en/dashboard");

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
