import { expect, test, type Page } from "@playwright/test";
import {
  apiAnalyticsSummary,
  apiCreateLink,
  apiReferrers,
} from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Bu dosyanin degerli kismi, tiklamanin gercek bir tarayici zincirinden
 * gecmesi: baska bir siteden profil sayfasina gelinip linke tiklaniyor.
 *
 * Birim testleri referrer'i istek govdesine koyup dogruluyor; burada
 * document.referrer'in gercekten dolmasi, CORS on kontrolunun gecmesi ve
 * sunucunun host'u ayiklamasi birlikte sinaniyor. Zincirin herhangi bir
 * halkasi kirilirsa (or. baslik yerine govde beklenmesi) yalnizca bu test
 * yakalar.
 */

/** Ziyaretcinin "geldigi" sahte dis site. */
const KAYNAK_ORIGIN = "http://kaynak.test";

/** Sahte sitedeki baglanti mutlak olmali: goreli yol o origin'de kalirdi. */
const UYGULAMA_ORIGIN = "http://localhost:3000";

/**
 * Sahte bir dis siteyi ve tiklanan linkin hedefini servis eder.
 *
 * https degil http: tarayicinin varsayilan referrer politikasi
 * (strict-origin-when-cross-origin) https -> http gecisinde referrer'i hic
 * gondermiyor ve test gercekte olmayan bir sorunu raporlardi.
 */
async function sahteSiteyiKur(page: Page, profilUrl: string) {
  await page.route(`${KAYNAK_ORIGIN}/`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<!doctype html><meta charset="utf-8"><title>Kaynak</title>
             <a id="git" href="${profilUrl}">Profile</a>`,
    })
  );

  // Linkin hedefi yeni sekmede aciliyor; cozulemeyen bir adres testi
  // yavaslatmasin diye o da karsilaniyor.
  await page.route("http://hedef.test/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "ok" })
  );
}

/** Profil sayfasindaki ilk linke tiklar ve tiklama kaydini bekler. */
async function linkeTikla(page: Page) {
  const kayit = page.waitForResponse(
    (response) =>
      response.url().includes("/click") &&
      response.request().method() === "POST"
  );
  // Yeni sekme aciliyor (target=_blank); beklemezsek sekme testten sonra
  // kapanirken gurultu cikariyor.
  const yeniSekme = page.context().waitForEvent("page");
  await page.getByRole("link", { name: "Kaynak testi" }).click();
  await kayit;
  await (await yeniSekme).close();
}

test.describe("Trafik kaynaklari", () => {
  test("baska bir siteden gelen tiklama o sitenin adiyla kaydediliyor", async ({
    page,
  }) => {
    const { user, token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Kaynak testi",
      url: "http://hedef.test/a",
    });

    await sahteSiteyiKur(page, `${UYGULAMA_ORIGIN}/en/${user.username}`);

    // Dis siteden profile gelis: document.referrer boyle doluyor.
    await page.goto(`${KAYNAK_ORIGIN}/`);
    await page.click("#git");
    await expect(
      page.getByRole("link", { name: "Kaynak testi" })
    ).toBeVisible();

    await linkeTikla(page);

    // Once ucun kendisi: UI hatasi ile kayit hatasini ayirt edebilelim.
    const dagilim = await apiReferrers(token);
    expect(dagilim.sources).toEqual([
      { kind: "host", host: "kaynak.test", clicks: 1 },
    ]);

    await page.goto("/en/analytics");
    const liste = page.getByTestId("referrer-list");
    await expect(liste.locator("li")).toHaveCount(1);
    await expect(liste.locator("li").first()).toContainText("kaynak.test");
    await expect(liste.locator("li").first()).toContainText("100%");
  });

  test("dogrudan gelen ziyaret Direct satirinda", async ({ page }) => {
    const { user, token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Kaynak testi",
      url: "http://hedef.test/a",
    });
    await sahteSiteyiKur(page, `${UYGULAMA_ORIGIN}/en/${user.username}`);

    // Adres cubuguna yazilmis gibi: referrer yok.
    await page.goto(`/en/${user.username}`);
    await linkeTikla(page);

    await page.goto("/en/analytics");
    const liste = page.getByTestId("referrer-list");
    await expect(liste.locator("li")).toHaveCount(1);
    await expect(liste.locator("li").first()).toContainText(
      "Direct or unknown"
    );
  });

  test("hic tiklama yokken bolum bos durumunu anlatiyor", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Sessiz",
      url: "http://hedef.test/b",
    });

    await page.goto("/en/analytics");

    const bolum = page
      .locator("div.rounded-2xl")
      .filter({ hasText: "Traffic sources" });

    await expect(
      page.getByRole("heading", { name: "Traffic sources" })
    ).toBeVisible();
    await expect(page.getByTestId("referrer-list")).toHaveCount(0);
    // Locator bolume daraltildi: "No clicks in this range" cumlesi
    // asagidaki "When your links get clicked" bolumunde de geciyor ve
    // sayfa genelinde aranirsa iki elemanla eslesiyor.
    await expect(
      bolum.getByText("No clicks in this range", { exact: false })
    ).toBeVisible();
  });
});

/**
 * Hidrasyondan once yapilan tiklama.
 *
 * Baglanti sunucuda render ediliyor: ziyaretci, React sayfaya baglanmadan
 * once de gorup tiklayabiliyor. Tiklama kaydi React'in onClick'ine bagliysa
 * o tiklama sessizce kayboluyor -- hem sayac hem kaynak dagilimi eksik
 * kaliyor.
 *
 * Testi zamanlamaya birakmiyoruz: Next'in butun JS parcalari engelleniyor,
 * yani hidrasyon hic gerceklesmiyor. Boylece "bazen gecen" bir test yerine
 * ya calisan ya calismayan bir test oluyor.
 */
test("React hic yuklenmese bile tiklama kaydediliyor", async ({ page }) => {
  const { user, token } = await signInAsNewUser(page);
  const link = await apiCreateLink(token, {
    title: "Kaynak testi",
    url: "http://hedef.test/a",
  });

  await page.route("**/_next/static/**", (route) => route.abort());
  await page.route("http://hedef.test/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "ok" })
  );

  await page.goto(`/en/${user.username}`, { waitUntil: "domcontentloaded" });

  const kayit = page.waitForResponse(
    (response) =>
      response.url().includes("/click") &&
      response.request().method() === "POST"
  );
  const yeniSekme = page.context().waitForEvent("page");
  await page.getByRole("link", { name: "Kaynak testi" }).click();
  await kayit;
  await (await yeniSekme).close();

  const dagilim = await apiReferrers(token);
  expect(dagilim.total_clicks).toBe(1);

  const ozet = await apiAnalyticsSummary(token);
  expect(
    ozet.links.find((l: { id: number }) => l.id === link.id).click_count
  ).toBe(1);
});

/**
 * Orta tik (yeni sekmede ac) ve sag tik.
 *
 * Orta tik gercek bir ziyaret: ziyaretci linke gidiyor, yalnizca sayfayi
 * arkada aciyor. Tarayici bunun icin `click` degil `auxclick` uretiyor,
 * dolayisiyla yalnizca `click` dinleyen bir kaydedici bu tiklamalari
 * gormuyor.
 *
 * Sag tik de `auxclick` uretiyor ama bir ziyaret degil -- menuyu acmak
 * tiklama sayilmamali. Ikisi ayni olayla geldigi icin ayni testte.
 */
test("orta tik sayiliyor, sag tik sayilmiyor", async ({ page }) => {
  const { user, token } = await signInAsNewUser(page);
  const link = await apiCreateLink(token, {
    title: "Kaynak testi",
    url: "http://hedef.test/a",
  });

  await page.route("http://hedef.test/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "ok" })
  );
  await page.goto(`/en/${user.username}`);

  const baglanti = page.getByRole("link", { name: "Kaynak testi" });

  // Sag tik: hicbir sey kaydedilmemeli.
  await baglanti.click({ button: "right" });
  await page.waitForTimeout(1000);
  expect((await apiAnalyticsSummary(token)).total_clicks).toBe(0);

  // Orta tik: bir kez kaydedilmeli -- iki kez degil. Tarayici hem `click`
  // hem `auxclick` uretseydi sayi ikiye cikardi.
  const kayit = page.waitForResponse(
    (response) =>
      response.url().includes("/click") &&
      response.request().method() === "POST"
  );
  const yeniSekme = page.context().waitForEvent("page");
  await baglanti.click({ button: "middle" });
  await kayit;
  await (await yeniSekme).close();
  await page.waitForTimeout(1000);

  const ozet = await apiAnalyticsSummary(token);
  expect(ozet.total_clicks).toBe(1);
  expect(
    ozet.links.find((l: { id: number }) => l.id === link.id).click_count
  ).toBe(1);
});
