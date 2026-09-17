import { expect, test, type Page } from "@playwright/test";
import { apiCreateLink } from "./helpers/api";
import { signInAsNewUser } from "./helpers/auth";
import { waitForHydration } from "./helpers/ui";

/** "rgb(18, 18, 18)" -> parlaklik (0-255). */
function parlaklik(renk: string): number {
  const [r, g, b] = (renk.match(/\d+/g) ?? ["255", "255", "255"]).map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Sayfanin govde zemininin parlakligi.
 *
 * MUI sayfalari zemini <body>'ye ciziyor; Tailwind sayfalari kendi kok
 * div'ine bir gradient koyuyor ve gradient'te backgroundColor saydam
 * kaliyor. Bu yuzden once kok div'in hesaplanan degiskeni, yoksa body
 * okunuyor.
 */
async function zeminParlakligi(page: Page): Promise<number> {
  return page.evaluate(() => {
    function parlak(renk: string): number {
      const [r, g, b] = (renk.match(/\d+/g) ?? ["255", "255", "255"]).map(
        Number
      );
      return 0.299 * r + 0.587 * g + 0.114 * b;
    }
    // --page, Tailwind sayfalarinin gradient ucu; "17 24 39" gibi geliyor.
    const sayfa = getComputedStyle(document.documentElement)
      .getPropertyValue("--page")
      .trim();
    if (sayfa) {
      const [r, g, b] = sayfa.split(/\s+/).map(Number);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    }
    return parlak(getComputedStyle(document.body).backgroundColor);
  });
}

/** Tema dugmesine basar ve <html> sinifinin degismesini bekler. */
async function temayiCevir(page: Page, hedef: "light" | "dark") {
  // Dugme sunucuda da render ediliyor, yani React baglanmadan once de
  // tiklanabiliyor -- ama onClick calismiyor ve tema degismiyor.
  await waitForHydration(page, '[data-testid="theme-switch"]');
  await page.getByTestId("theme-switch").first().click();
  await expect(page.locator("html")).toHaveClass(new RegExp(hedef));
}

test.describe("Tema", () => {
  test("varsayilan koyu", async ({ page }) => {
    await page.goto("/en/forgot-password");

    // colorSchemeSelector: "class" -> MUI semayi <html>'in class'ina yaziyor.
    // Varsayilan "system" degil "dark": isletim sistemi acik temadayken
    // uygulamanin habersiz beyaza donmesi istenmiyor.
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("MUI ile yazilmis sayfalarin zemini temaya uyuyor", async ({ page }) => {
    // Bu sayfalar kendi arka planini cizmiyor, CssBaseline'inkini kullaniyor.
    await signInAsNewUser(page);
    await page.goto("/en/profile/edit");
    // getByText degil: "Edit Profile" ayni zamanda sayfanin <title>'i ve o
    // gorunmez bir dugum. Basligi rolunden yakalamak tek bir gorunur
    // elemani hedefliyor.
    await expect(
      page.getByRole("heading", { name: "Edit Profile" })
    ).toBeVisible();

    const koyu = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(parlaklik(koyu)).toBeLessThan(60);

    await temayiCevir(page, "light");

    const acik = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(parlaklik(acik)).toBeGreaterThan(200);
  });

  test("Tailwind sayfalari da ayni dugmeyle ceviriliyor", async ({ page }) => {
    // Asil mesele bu: MUI sayfalari ile Tailwind sayfalari tek bir sinifi
    // okumazsa uygulama yarisi acik yarisi koyu kalir.
    await signInAsNewUser(page);
    await page.goto("/en/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    expect(await zeminParlakligi(page)).toBeLessThan(60);

    await temayiCevir(page, "light");

    expect(await zeminParlakligi(page)).toBeGreaterThan(200);
  });

  test("secim sayfa degisince ve yeniden yuklenince korunuyor", async ({
    page,
  }) => {
    await signInAsNewUser(page);
    await page.goto("/en/dashboard");
    await temayiCevir(page, "light");

    // Baska bir sayfa
    await page.goto("/en/analytics");
    await expect(page.locator("html")).toHaveClass(/light/);

    // Yeniden yukleme: secim tarayicida saklaniyor, ilk boyamada da acik
    // gelmeli -- aksi halde sayfa bir an koyu boyanip beyaza doner.
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/light/);
    expect(await zeminParlakligi(page)).toBeGreaterThan(200);

    // Geri koyuya
    await temayiCevir(page, "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("public profil ziyaretcinin temasindan etkilenmiyor", async ({
    page,
  }) => {
    // Bu sayfanin renkleri profil sahibinin sectigi temadan geliyor.
    // Ziyaretcinin acik/koyu tercihi baskasinin sayfasini degistirmemeli.
    const { user, token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Portfolyo",
      url: "https://ornek.test/a",
    });

    const zeminiOku = () =>
      page
        .locator("main")
        .first()
        .evaluate((el) => {
          const stil = getComputedStyle(el);
          return `${stil.backgroundColor}|${stil.backgroundImage}`;
        });

    await page.goto(`/en/${user.username}`);
    const koyuTemadayken = await zeminiOku();

    await page.goto("/en/dashboard");
    await temayiCevir(page, "light");

    await page.goto(`/en/${user.username}`);
    await expect(page.locator("html")).toHaveClass(/light/);

    // Ayni deger: ziyaretcinin tercihi baskasinin sayfasini degistirmiyor.
    // Sabit bir renk beklemiyoruz -- varsayilan profil zemini bugun beyaz,
    // yarin degisebilir; onemli olan iki okumanin esit olmasi.
    expect(await zeminiOku()).toBe(koyuTemadayken);
  });
});
