import { Locator, Page, expect } from "@playwright/test";

/**
 * Elemanin React tarafindan hydrate edilmesini bekler.
 *
 * NEDEN GEREKLI: Next.js sayfayi once sunucuda uretilmis HTML olarak
 * gonderiyor. React hydrate olana kadar input'larin onChange'i bagli degil;
 * o araliktaki fill() DOM'a yaziyor ama React state'i bos kaliyor. Deger
 * ekranda duruyor, form gonderildiginde ise bos gidiyor -- teshis etmesi zor
 * bir yanlis negatif. Hydrate olmus elemanlarda React kendi fiber/props
 * alanlarini DOM dugumune ekliyor; onlari bekliyoruz.
 */
export async function waitForHydration(page: Page, selector: string) {
  await page.waitForFunction(
    (sec) => {
      const el = document.querySelector(sec);
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps$"));
    },
    selector,
    { timeout: 30_000 }
  );
}

/** Hydrate olmayi bekleyip alani doldurur. */
export async function fillField(
  page: Page,
  selector: string,
  value: string
): Promise<Locator> {
  await waitForHydration(page, selector);
  const alan = page.locator(selector);
  await alan.fill(value);
  await expect(alan).toHaveValue(value);
  return alan;
}

/** Hydrate olmayi bekleyip kontrollu onay kutusunu isaretler. */
export async function checkBox(page: Page, selector: string) {
  await waitForHydration(page, selector);
  const kutu = page.locator(selector);
  // Kutunun uzerinde onu ortan gorsel bir katman var (input sr-only).
  await kutu.check({ force: true });
  await expect(kutu).toBeChecked();
}

/** Hydrate olmayi bekleyip tiklar; sayfa acilir acilmaz tiklanan butonlar icin. */
export async function clickWhenReady(page: Page, selector: string) {
  await waitForHydration(page, selector);
  await page.locator(selector).click();
}
