import { devices, expect, test } from "@playwright/test";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Form kontrollerinin telefonda parmakla kullanilabilir olmasi.
 *
 * Bu sayfalar masaustu genisliginde yazilmisti. Olculdugunde arka plan
 * tipi dugmeleri 36, profil duzenlemedeki Save ve Cancel 37, renk ve
 * sifre alanlari 42, gezinme dugmesi 40 pikseldi. Hicbiri tasma
 * yaratmiyordu, yani yalnizca yerlesime bakan bir test hepsini "gecti"
 * sayardi.
 *
 * Esik 44 piksel (WCAG 2.5.5).
 */
test.use({ ...devices["Pixel 5"] });

const ESIK = 44;

const SAYFALAR = [
  "/en/profile/edit",
  "/en/profile/customize",
  "/en/settings",
  "/en/analytics",
];

for (const yol of SAYFALAR) {
  test(`${yol} kontrolleri en az ${ESIK} piksel`, async ({ page }) => {
    await signInAsNewUser(page);
    await page.goto(yol);
    await page.waitForLoadState("networkidle");

    const kucukler = await page.evaluate((esik) => {
      return Array.from(
        document.querySelectorAll("input, textarea, select, button")
      )
        .map((el) => {
          const r = el.getBoundingClientRect();
          const stil = getComputedStyle(el);
          if (!r.width || !r.height) return null;
          if (stil.visibility === "hidden" || stil.display === "none")
            return null;
          // Gorsel bir katmanla ortulen sr-only kutular: gercek dokunma
          // hedefi sarmalayici, kutunun kendisi degil.
          if (r.width <= 20 && r.height <= 20) return null;
          return {
            ad:
              el.tagName.toLowerCase() +
              ":" +
              (el.getAttribute("name") ||
                el.getAttribute("aria-label") ||
                (el.textContent || "").trim().slice(0, 24) ||
                "?"),
            yukseklik: Math.round(r.height),
          };
        })
        .filter(
          (x): x is { ad: string; yukseklik: number } =>
            x !== null && x.yukseklik < esik
        );
    }, ESIK);

    expect(
      kucukler,
      `${ESIK} pikselin altinda kontrol var: ${JSON.stringify(kucukler)}`
    ).toEqual([]);
  });
}

test("telefon menusu dugmesi parmakla kullanilabilir", async ({ page }) => {
  await signInAsNewUser(page);
  await page.goto("/en/dashboard");

  const dugme = page.getByTestId("mobile-menu-toggle");
  await expect(dugme).toBeVisible();

  const kutu = (await dugme.boundingBox())!;
  expect(kutu.height).toBeGreaterThanOrEqual(ESIK);
  expect(kutu.width).toBeGreaterThanOrEqual(ESIK);
});
