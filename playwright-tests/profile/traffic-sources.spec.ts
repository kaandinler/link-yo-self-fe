import { expect, test, type Page } from "@playwright/test";
import { apiCreateLink, apiReferrers } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { waitForHydration } from "../helpers/ui";

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
  // Baglanti sunucuda render ediliyor, yani React baglanmadan once de
  // gorunuyor ve tiklanabiliyor -- ama onClick calismiyor ve tiklama
  // sessizce kaydedilmiyor. Bu testin ilk halinde tam olarak bu oldu.
  await waitForHydration(page, 'a[target="_blank"]');

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

    await expect(
      page.getByRole("heading", { name: "Traffic sources" })
    ).toBeVisible();
    await expect(page.getByTestId("referrer-list")).toHaveCount(0);
    await expect(
      page.getByText("No clicks in this range", { exact: false })
    ).toBeVisible();
  });
});
