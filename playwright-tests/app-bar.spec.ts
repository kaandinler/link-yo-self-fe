import { expect, test } from "@playwright/test";
import { apiUpdateProfile } from "./helpers/api";
import { signInAsNewUser } from "./helpers/auth";

/**
 * Ust serit (app-bar).
 *
 * Bu dosyadaki dort test, ayni bilesende OLCULEN dort kusuru kapatiyor.
 * Hicbiri derlemeyi ya da mevcut testleri kirmiyordu; ust serit her
 * sayfada durdugu halde kimse ona dogrudan bakmiyordu.
 */
test.describe("Ust serit", () => {
  test("Onizle dugmesi kullanicinin kendi sayfasina gidiyor", async ({
    page,
  }) => {
    /**
     * Onceki hali /@kullanici uretiyordu; boyle bir rota yok. Olculdu:
     * /en/@kullanici -> 404, dogru adres /en/kullanici -> 200.
     */
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, { display_name: "Ada Lovelace" });
    await page.goto("/en/dashboard");

    const dugme = page.getByTestId("preview-profile");
    await expect(dugme).toHaveAttribute("href", `/en/${user.username}`);

    // Adresin dogru gorunmesi yetmez: gercekten o sayfayi acmali.
    const yanit = await page.request.get((await dugme.getAttribute("href"))!);
    expect(yanit.status()).toBe(200);
  });

  test("Turkce sayfada ust serit de Turkce", async ({ page }) => {
    /**
     * Metinler t() ile degil duz yaziliydi; /tr/dashboard'da "Dashboard,
     * Links, Analytics, Add Link, Preview" gorunuyordu. i18n koruma
     * testleri yalnizca t("...") cagrilarina baktigi icin bunu
     * goremiyordu.
     */
    await signInAsNewUser(page);
    await page.goto("/tr/dashboard");

    const serit = page.getByRole("banner");
    await expect(serit.getByTestId("preview-profile")).toBeVisible();

    const metin = await serit.innerText();
    for (const turkce of ["Panel", "Bağlantılar", "Analitik", "Önizle"]) {
      expect(metin, `ust seritte "${turkce}" yok`).toContain(turkce);
    }
    for (const ingilizce of ["Dashboard", "Analytics", "Add Link", "Preview"]) {
      expect(metin, `ust seritte hala "${ingilizce}" var`).not.toContain(
        ingilizce
      );
    }
  });

  test("bulunulan sayfa menude isaretli", async ({ page }) => {
    /**
     * usePathname() dil onekini de donduruyor ("/en/links"), menu
     * adresleri oneksiz ("/links"). Dogrudan karsilastirildigi icin
     * hicbir sayfada hicbir oge isaretlenmiyordu (olculdu: 0).
     *
     * aria-current ile olculuyor, renk sinifiyla degil: isaret ekran
     * okuyucuya da ulasmali, ve test gorunuse degil anlama baksin.
     */
    await signInAsNewUser(page);

    for (const [yol, ad] of [
      ["/en/links", "Links"],
      ["/en/analytics", "Analytics"],
    ] as const) {
      await page.goto(yol);
      const isaretli = page
        .getByRole("banner")
        .locator('nav a[aria-current="page"]');
      await expect(isaretli).toHaveCount(1);
      await expect(isaretli).toHaveText(ad);
    }
  });

  test("menude e-posta degil gorunen ad cikiyor", async ({ page }) => {
    /**
     * Onceden first_name || email okunuyordu. first_name bu urunde hic
     * doldurulmuyor, yani herkes menude kendi e-postasini goruyordu --
     * ekran paylasiminda da.
     */
    const { user, token } = await signInAsNewUser(page);
    await apiUpdateProfile(token, { display_name: "Ada Lovelace" });
    await page.goto("/en/dashboard");

    const serit = page.getByRole("banner");
    await expect(serit.getByText("Ada Lovelace")).toBeVisible();
    await expect(serit).not.toContainText(user.email);
  });
});
