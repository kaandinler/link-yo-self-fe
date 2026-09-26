import { devices, expect, test } from "@playwright/test";
import { signInAsAdmin, signInAsNewUser } from "../helpers/auth";

/**
 * Kontrollerin telefonda parmakla kullanilabilir olmasi.
 *
 * Bu sayfalar masaustu genisliginde yazilmisti. Olculdugunde arka plan
 * tipi dugmeleri 36, profil duzenlemedeki Save ve Cancel 37, renk ve
 * sifre alanlari 42, gezinme dugmesi 40 pikseldi. Hicbiri tasma
 * yaratmiyordu, yani yalnizca yerlesime bakan bir test hepsini "gecti"
 * sayardi.
 *
 * Onboarding sihirbazinin dort adimi da acildi: dordunde de
 * "Skip setup" 20 pikseldi.
 *
 * Admin paneli de tarandi ve temiz cikti: MUI bilesenleri tema
 * uzerinden 44 pikselden buyuk. Tek "bulgu" Select'in gorunmez native
 * input'uydu, o da gercek bir hedef degil (asagiya bakin).
 *
 * Tarama once yalnizca dort form sayfasinda kosuyordu. Geri kalan
 * sayfalar acilinca marka baglantisi (40), dashboard'daki Preview Page
 * ve Add Link (42), Copy ve Share (40), View All (24), alt bilgi
 * baglantilari (24) ve sign-in'deki "Forgot your password?" (20)
 * cikti; yani taranmayan yerde kusur vardi.
 *
 * Esik 44 piksel (WCAG 2.5.5).
 */
test.use({ ...devices["Pixel 5"] });

const ESIK = 44;

/**
 * WCAG 2.5.5 "inline" istisnasi: bir cumlenin icinde gecen, boyutu
 * cevresindeki metnin satir yuksekligiyle sinirli olan baglantilar
 * kural disi. Onlari 44 piksele zorlamak tipografiyi bozar. Olcunun
 * karsiligi `display: inline`; dugme gibi duran baglantilar zaten
 * inline-flex, flex ya da block oluyor.
 */
const KUCUKLERI_BUL = `(() => {
  return Array.from(
    document.querySelectorAll("input, textarea, select, button, a[href]")
  )
    .map((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (!r.width || !r.height) return null;
      if (s.visibility === "hidden" || s.display === "none") return null;
      // Gorsel bir katmanla ortulen sr-only kutular: gercek dokunma
      // hedefi sarmalayici, kutunun kendisi degil.
      if (r.width <= 20 && r.height <= 20) return null;
      if (el.tagName === "A" && s.display === "inline") return null;
      // React Query devtools yalnizca "npm run dev" altinda render
      // ediliyor; uretim derlemesinde (CI'da kosan "npm run start")
      // yok. Uygulamanin arayuzu degil, olcunun disinda.
      if (el.closest(".tsqd-parent-container")) return null;
      // Dokunulamayan bir eleman dokunma hedefi degil. MUI'nin Select
      // bileseni gorunmez bir native input tutuyor: 361x23, opacity 0,
      // pointer-events none. Gercek hedef 56 piksellik sarmalayici --
      // olculdu. Boyut filtresi bunu yakalamiyordu cunku genisligi
      // buyuk; ayirt eden sey dokunulabilir olup olmadigi.
      if (s.pointerEvents === "none") return null;
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
    .filter((x) => x !== null && x.yukseklik < ${ESIK});
})()`;

type Kucuk = { ad: string; yukseklik: number };

async function kucukleriTopla(page: import("@playwright/test").Page) {
  return (await page.evaluate(KUCUKLERI_BUL)) as Kucuk[];
}

async function sayfayiOlc(page: import("@playwright/test").Page, yol: string) {
  await page.goto(yol);
  await page.waitForLoadState("networkidle");

  const kucukler = await kucukleriTopla(page);
  expect(
    kucukler,
    `${yol}: ${ESIK} pikselin altinda kontrol var: ${JSON.stringify(kucukler)}`
  ).toEqual([]);
}

// Giris gerektirmeyen sayfalar.
const GENEL_SAYFALAR = [
  "/en",
  "/en/sign-in",
  "/en/sign-up",
  "/en/forgot-password",
];

// Giris gerektiren sayfalar.
const GIRISLI_SAYFALAR = [
  "/en/dashboard",
  "/en/links",
  "/en/profile/edit",
  "/en/profile/customize",
  "/en/settings",
  "/en/analytics",
];

for (const yol of GENEL_SAYFALAR) {
  test(`${yol} kontrolleri en az ${ESIK} piksel`, async ({ page }) => {
    await sayfayiOlc(page, yol);
  });
}

for (const yol of GIRISLI_SAYFALAR) {
  test(`${yol} kontrolleri en az ${ESIK} piksel`, async ({ page }) => {
    await signInAsNewUser(page);
    await sayfayiOlc(page, yol);
  });
}

// Admin paneli ayri: kayit ucu admin acmiyor, hazir bir hesap gerekiyor
// (bkz. signInAsAdmin ve backend'in scripts/create_admin betigi).
const ADMIN_SAYFALARI = [
  "/en/admin-panel",
  "/en/admin-panel/users",
  "/en/admin-panel/users/create",
];

for (const yol of ADMIN_SAYFALARI) {
  test(`${yol} kontrolleri en az ${ESIK} piksel`, async ({ page }) => {
    await signInAsAdmin(page);
    await sayfayiOlc(page, yol);
  });
}

test(`/en/onboarding/welcome kontrolleri en az ${ESIK} piksel`, async ({
  page,
}) => {
  await signInAsNewUser(page, { onboarding: false });
  await sayfayiOlc(page, "/en/onboarding/welcome");
});

// Sihirbazin dort adimi: welcome taraniyordu ama adimlarin kendisi
// taranmiyordu. Tarandiginda dordunde de "Skip setup" 20 pikseldi.
for (const adim of [1, 2, 3, 4]) {
  test(`/en/onboarding/${adim} kontrolleri en az ${ESIK} piksel`, async ({
    page,
  }) => {
    await signInAsNewUser(page, { onboarding: false });
    await sayfayiOlc(page, `/en/onboarding/${adim}`);
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
