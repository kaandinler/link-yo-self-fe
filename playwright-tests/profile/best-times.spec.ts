import { expect, test, type Page } from "@playwright/test";
import { apiClickLink, apiCreateLink } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { waitForHydration } from "../helpers/ui";

/**
 * "When your links get clicked" bolumu.
 *
 * Uc iki kenar dagilimi donduruyor (7 gun, 24 saat) ve saat dilimini
 * istekten aliyor. Buradaki testler ucun kendisini degil, arayuzun onu
 * dogru kullanmasini olcuyor: tarayicinin saat dilimi gercekten gidiyor
 * mu, az veriyle bir iddiada bulunuluyor mu.
 */

/** Sunucu esiginin (MIN_CLICKS_FOR_PEAK) ustune cikmaya yeten sayi. */
const YETERLI_TIKLAMA = 25;

async function hazirla(page: Page, tiklama: number) {
  const { token } = await signInAsNewUser(page);
  const link = await apiCreateLink(token, {
    title: "Portfolyo",
    url: "https://ornek.test/a",
  });
  for (let i = 0; i < tiklama; i++) await apiClickLink(link.id);
  return token;
}

function bolum(page: Page) {
  return page
    .locator("div.rounded-2xl")
    .filter({ hasText: "When your links get clicked" });
}

test.describe("Tiklama zamanlari", () => {
  test("hic tiklama yokken bos durumu anlatiyor", async ({ page }) => {
    await hazirla(page, 0);
    await page.goto("/en/analytics");

    await expect(
      page.getByRole("heading", { name: "When your links get clicked" })
    ).toBeVisible();
    await expect(page.getByTestId("weekday-bars")).toHaveCount(0);
    await expect(
      page.getByText("No clicks in this range yet", { exact: false })
    ).toBeVisible();
  });

  test("az veriyle zirve bir iddia olarak sunulmuyor", async ({ page }) => {
    await hazirla(page, 3);
    await page.goto("/en/analytics");
    await expect(page.getByTestId("weekday-bars")).toBeVisible();

    // Cubuklar ciziliyor ama "en cok su gun gelir" denmiyor.
    await expect(
      bolum(page).getByText("Not enough clicks yet", { exact: false })
    ).toBeVisible();
    await expect(
      bolum(page).getByText("Most clicks come in on", { exact: false })
    ).toHaveCount(0);
  });

  test("yeterli veriyle zirve cumlesi cikiyor", async ({ page }) => {
    await hazirla(page, YETERLI_TIKLAMA);
    await page.goto("/en/analytics");

    await expect(
      bolum(page).getByText("Most clicks come in on", { exact: false })
    ).toBeVisible();
    await expect(
      bolum(page).getByText("Not enough clicks yet", { exact: false })
    ).toHaveCount(0);
  });

  test("sayilar tabloyu acmadan da okunuyor", async ({ page }) => {
    await hazirla(page, 4);
    await page.goto("/en/analytics");

    // Gun cubuklarinin ustunde sayi yaziyor: bugune 4 tiklama dustu.
    await expect(page.getByTestId("weekday-bars")).toContainText("4");

    // Saat dagiliminda 24 sayi sigmiyor; degerler tabloda.
    await page.getByTestId("hour-table-toggle").click();
    const tablo = page.getByTestId("hour-table");
    await expect(tablo).toBeVisible();
    await expect(tablo.locator("tbody tr")).toHaveCount(24);
  });

  test("kisa aralikta gun kiyasinin anlamsizligi soyleniyor", async ({
    page,
  }) => {
    await hazirla(page, YETERLI_TIKLAMA);
    await page.goto("/en/analytics");

    // Varsayilan 7 gun: her haftaguno bir kez geciyor.
    await expect(
      bolum(page).getByText("Each weekday happens only once", { exact: false })
    ).toBeVisible();

    await waitForHydration(page, '[role="group"][aria-label="Date range"]');
    await page.getByRole("button", { name: "Last 30 days" }).click();

    await expect(
      bolum(page).getByText("Each weekday happens only once", { exact: false })
    ).toHaveCount(0);
  });
});

/**
 * Saat dilimi tarayicidan gidiyor mu?
 *
 * Bolumun basligi sunucunun geri yolladigi dilimi yaziyor, yani bu test
 * butun zinciri kapsiyor: Intl -> sorgu parametresi -> sunucu -> yanit.
 * Sabit "UTC" gonderilseydi burasi duserdi.
 */
test.describe("Saat dilimi", () => {
  test.use({ timezoneId: "Asia/Tokyo" });

  test("tarayicinin saat dilimi sunucuya gidiyor", async ({ page }) => {
    await hazirla(page, 5);
    await page.goto("/en/analytics");

    await expect(
      bolum(page).getByText("Asia/Tokyo", { exact: false })
    ).toBeVisible();
  });
});
