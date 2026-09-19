import { devices, expect, test, type Page } from "@playwright/test";
import { apiCreateLink, apiUpdateProfile } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Herkese acik profil sayfasi: urunun ziyaretciye donuk yuzu.
 *
 * KONTRAST TESTI NEDEN VAR: Bu sayfanin metin renkleri profil sahibinin
 * sectigi arka plana gore *sinif adi olarak* uretiliyor
 * (profile-theme.ts -> "text-gray-900" / "text-white"). O dosya bir sure
 * Tailwind'in taradigi yollarin disinda kaldi ve siniflar yalnizca baska
 * sayfalar ayni tonu kullandigi surece, yani kazara uretildi. Sayfalar
 * anlamsal token'lara gecince son kullanim da kalkti ve isim, kullanici
 * adi ve bio beyaz zemine beyaz yazildi -- derleme, lint ve butun testler
 * temiz geciyordu.
 *
 * Bu yuzden test rengin adina degil, olculen kontrast oranina bakiyor.
 */

// Dosya seviyesinde: cihaz emulasyonu describe icinden ayarlanamiyor.
test.use({ ...devices["Pixel 5"] });

/** "rgb(17, 24, 39)" -> WCAG bagil parlakligi. */
function bagilParlaklik(renk: string): number {
  const [r, g, b] = (renk.match(/\d+/g) ?? ["0", "0", "0"])
    .slice(0, 3)
    .map((sayi) => {
      const oran = Number(sayi) / 255;
      return oran <= 0.03928 ? oran / 12.92 : ((oran + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function kontrast(on: string, arka: string): number {
  const [buyuk, kucuk] = [bagilParlaklik(on), bagilParlaklik(arka)].sort(
    (a, b) => b - a
  );
  return (buyuk + 0.05) / (kucuk + 0.05);
}

async function profilKur(
  page: Page,
  tema: Record<string, unknown> = {}
): Promise<string> {
  const { user, token } = await signInAsNewUser(page);
  await apiUpdateProfile(token, {
    display_name: "Kaan Dinler",
    bio: "Yazilim gelistirici. Backend'de FastAPI, frontend'de Next.js yaziyorum.",
    website: "https://kaandinler.example.com",
    twitter_username: "kaandinler",
    instagram_username: "kaandinler",
    linkedin_username: "kaandinler",
    ...tema,
  });
  await apiCreateLink(token, {
    title: "Portfolyo sitem ve butun yazilarim burada",
    url: "https://ornek.test/portfolyo",
  });
  await apiCreateLink(token, { title: "Blog", url: "https://ornek.test/blog" });
  return user.username;
}

/** Sayfanin metin rengi ile zemini arasindaki olculen kontrast. */
async function metinKontrasti(page: Page, secici: string): Promise<number> {
  const [on, arka] = await page.evaluate((s) => {
    const el = document.querySelector(s)!;
    const ana = document.querySelector("main")!;
    return [getComputedStyle(el).color, getComputedStyle(ana).backgroundColor];
  }, secici);
  return kontrast(on, arka);
}

test.describe("Herkese acik profil telefonda", () => {
  test("acik zeminde isim ve bio okunuyor", async ({ page }) => {
    const kullanici = await profilKur(page);
    await page.goto(`/en/${kullanici}`);

    await expect(
      page.locator("main").getByRole("heading", { level: 1 })
    ).toHaveText("Kaan Dinler");

    // WCAG AA, normal metin: 4.5:1. Beyaz uzerine beyazda bu 1.0 olur.
    expect(await metinKontrasti(page, "main h1")).toBeGreaterThan(4.5);
    // Bio ikincil renkte; ayni esik.
    expect(
      await metinKontrasti(page, "main p.whitespace-pre-line")
    ).toBeGreaterThan(4.5);
  });

  test("koyu zeminde de isim ve bio okunuyor", async ({ page }) => {
    const kullanici = await profilKur(page, {
      background_type: "color",
      background_value: "#111827",
      theme_color: "#e11d48",
    });
    await page.goto(`/en/${kullanici}`);

    await expect(
      page.locator("main").getByRole("heading", { level: 1 })
    ).toBeVisible();
    expect(await metinKontrasti(page, "main h1")).toBeGreaterThan(4.5);
    expect(
      await metinKontrasti(page, "main p.whitespace-pre-line")
    ).toBeGreaterThan(4.5);
  });

  test("sayfa yatayda tasmiyor", async ({ page }) => {
    const kullanici = await profilKur(page);
    await page.goto(`/en/${kullanici}`);
    await expect(
      page.locator("main").getByRole("heading", { level: 1 })
    ).toBeVisible();

    const { kaydirma, gorunen } = await page.evaluate(() => ({
      kaydirma: document.documentElement.scrollWidth,
      gorunen: document.documentElement.clientWidth,
    }));
    expect(kaydirma).toBeLessThanOrEqual(gorunen);
  });

  test("sosyal ikonlar parmak icin yeterince buyuk", async ({ page }) => {
    // Ikonlar 20x20 baglantilardi: gorsel olarak duzgun ama parmakla
    // isabet ettirilemiyordu. Ikonun kendisi hala 20 piksel; tiklanabilir
    // alan dolguyla buyudu.
    const kullanici = await profilKur(page);
    await page.goto(`/en/${kullanici}`);

    const ikonlar = page.locator("main nav a");
    await expect(ikonlar).toHaveCount(4);

    const sayi = await ikonlar.count();
    for (let i = 0; i < sayi; i++) {
      const kutu = (await ikonlar.nth(i).boundingBox())!;
      expect(
        Math.min(kutu.width, kutu.height),
        `${i}. sosyal ikon cok kucuk`
      ).toBeGreaterThanOrEqual(44);
    }
  });

  test("link dugmeleri parmak icin yeterince buyuk", async ({ page }) => {
    const kullanici = await profilKur(page);
    await page.goto(`/en/${kullanici}`);

    const dugme = page.getByRole("link", { name: /^Portfolyo sitem/ });
    const kutu = (await dugme.boundingBox())!;
    expect(kutu.height).toBeGreaterThanOrEqual(44);
  });
});
