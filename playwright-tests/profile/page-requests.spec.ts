import { expect, test, type Page } from "@playwright/test";
import { apiCreateLink } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Girisli sayfalarin backend'e kac istek attigi.
 *
 * NEDEN OLCULUYOR: analytics bes ayri soru soruyor (ozet, zaman
 * serisi, link kirilimi, trafik kaynaklari, en iyi saatler), pano uc.
 * Olculdugunde israf yoktu:
 *
 *   analytics soguk acilis   6 istek (biri kimlik), her uc bir kez
 *   pano soguk acilis        3 istek, her uc bir kez
 *   analytics -> pano        en fazla birer istek (staleTime 0
 *                            oldugu icin arka planda tazeleniyor)
 *
 * Bu dosyanin isi o sayilari bozulmadan tutmak. Klasik gerileme
 * gorunmez olani: iki bilesen ayni veriyi biraz farkli anahtarla
 * isteyince ya da bir useEffect kendini tetikleyince istek sayisi
 * sessizce katlanir. Sayfa yine dogru gorunur.
 */

/** Sayfanin backend'e attigi istekleri "METOD /v1/yol" olarak toplar. */
function istekKaydedici(page: Page) {
  const istekler: string[] = [];
  page.on("request", (r) => {
    const adres = r.url();
    if (!adres.includes("/v1/")) return;
    // Sorgu dizgisi atiliyor: burada ayni UCA kac kez gidildigi
    // onemli, hangi aralikla gidildigi degil.
    istekler.push(
      `${r.method()} ${adres.replace(/^.*\/v1\//, "/v1/").replace(/\?.*$/, "")}`
    );
  });
  return istekler;
}

function tekrarlar(istekler: string[]): string[] {
  const sayim = new Map<string, number>();
  for (const istek of istekler) {
    sayim.set(istek, (sayim.get(istek) ?? 0) + 1);
  }
  return Array.from(sayim.entries())
    .filter(([, adet]) => adet > 1)
    .map(([istek, adet]) => `${istek} x${adet}`);
}

test.describe("Sayfa istekleri", () => {
  test("panoda soguk acilista hicbir uca iki kez gidilmiyor", async ({
    page,
  }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/b" });

    const istekler = istekKaydedici(page);
    await page.goto("/en/dashboard");
    await page.waitForLoadState("networkidle");

    // Pano gercekten doldu mu: bos bir sayfada "istek yok" demek kolay.
    await expect(page.getByText("Your Profile URL")).toBeVisible();

    expect(
      tekrarlar(istekler),
      `ayni uca birden fazla gidildi: ${JSON.stringify(istekler)}`
    ).toEqual([]);
  });

  test("analytics'ten panoya gecerken hicbir uca iki kez gidilmiyor", async ({
    page,
  }) => {
    /**
     * DIKKAT, BURADA BIR OLCUM YANILGISI YASANDI: once "gecis hic
     * istek atmiyor" diye yazilmisti, cunku yerelde iki kez ust uste
     * oyle olculmustu. CI'da iki istek cikti (profile/me ve
     * analytics/summary) ve hakli olan CI'ydi.
     *
     * Sebep: queryClient'ta staleTime ayarlanmamis, yani varsayilan 0
     * -- veri aninda bayat sayiliyor ve bilesen mount olurken arka
     * planda yeniden cekiliyor. Yerelde gecis o kadar hizli oluyor ki
     * `networkidle` istekler baslamadan donebiliyor. Yani "sifir
     * istek" bir degismez degil, zamanlama kazasiydi.
     *
     * Degismez olan sey su: onbellek PAYLASILIYOR, dolayisiyla her uca
     * en fazla bir kez gidiliyor. Paylasilmasaydi ayni veri hem
     * analytics hem pano anahtarindan ayri ayri cekilirdi.
     */
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/b" });

    await page.goto("/en/analytics");
    await page.waitForLoadState("networkidle");

    const istekler = istekKaydedici(page);
    await page.getByRole("link", { name: "Dashboard" }).first().click();
    await expect(page.getByText("Your Profile URL")).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(
      tekrarlar(istekler),
      `ayni uca birden fazla gidildi: ${JSON.stringify(istekler)}`
    ).toEqual([]);
  });

  test("analytics soguk acilista hicbir uca iki kez gidilmiyor", async ({
    page,
  }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/b" });

    const istekler = istekKaydedici(page);
    await page.goto("/en/analytics");
    await page.waitForLoadState("networkidle");

    // Grafigin gercekten ciziltigini gorelim; bos bir sayfada "istek
    // yok" demek kolay.
    await expect(
      page.getByLabel(/Daily link clicks and profile views/)
    ).toBeVisible();

    expect(
      tekrarlar(istekler),
      `ayni uca birden fazla gidildi: ${JSON.stringify(istekler)}`
    ).toEqual([]);
  });

  test("aralik degisince aralikla ilgisi olmayan uclar yeniden cagrilmiyor", async ({
    page,
  }) => {
    /**
     * Ozet ve kimlik secilen araliga bagli degil. Aralik her
     * degistiginde onlar da yeniden cekilseydi, sayfayla oynayan
     * kullanici her tiklamada gereksiz iki istek daha uretirdi.
     */
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/b" });

    await page.goto("/en/analytics");
    await page.waitForLoadState("networkidle");

    const istekler = istekKaydedici(page);
    await page.getByRole("button", { name: "Last 30 days" }).click();
    await expect(
      page.getByRole("button", { name: "Last 30 days" })
    ).toHaveAttribute("aria-pressed", "true");
    await page.waitForLoadState("networkidle");

    expect(
      istekler.filter((istek) => istek.includes("/analytics/summary")),
      `ozet aralikla birlikte yeniden cekildi: ${JSON.stringify(istekler)}`
    ).toEqual([]);
    expect(
      istekler.filter((istek) => istek.includes("/users/me")),
      `kimlik aralikla birlikte yeniden cekildi: ${JSON.stringify(istekler)}`
    ).toEqual([]);

    // Araliga bagli olan uc ise gercekten yeniden cekilmeli; aksi
    // halde test "hicbir sey olmadi"yi da gecerdi.
    expect(
      istekler.filter((istek) => istek.includes("/analytics/timeseries")).length
    ).toBeGreaterThan(0);
  });
});
