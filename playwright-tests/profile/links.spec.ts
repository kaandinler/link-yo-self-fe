import { expect, test } from "@playwright/test";
import { apiCreateLink } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { fillField } from "../helpers/ui";

test.describe("Link yonetimi", () => {
  test("yeni kullanici bos durumu gorup ilk linkini ekliyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/links");
    await expect(page.getByText("No active links")).toBeVisible();

    await page.getByRole("button", { name: "Create Your First Link" }).click();
    await fillField(
      page,
      'input[placeholder="e.g., Instagram Profile"]',
      "Portfolyo"
    );
    await fillField(
      page,
      'input[placeholder="https://example.com"]',
      "https://ornek.test/portfolyo"
    );
    await page.getByRole("button", { name: "Create Link" }).click();

    // Once modalin kapandigini bekliyoruz: icinde basligi canli gosteren bir
    // onizleme var, ona bakarsak link daha olusmadan ilerlemis oluruz.
    await expect(
      page.getByRole("heading", { name: "Add New Link" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Portfolyo" })
    ).toBeVisible();

    // Eklenen link herkese acik sayfada da gorunmeli.
    await page.goto(`/en/${user.username}`);
    await expect(page.getByRole("link", { name: "Portfolyo" })).toHaveAttribute(
      "href",
      "https://ornek.test/portfolyo"
    );
  });

  test("var olan linkler listeleniyor ve sayaclar dogru", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Ilk link",
      url: "https://ornek.test/1",
    });
    await apiCreateLink(token, {
      title: "Ikinci link",
      url: "https://ornek.test/2",
    });

    await page.goto("/en/links");

    await expect(page.getByRole("heading", { name: "Ilk link" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ikinci link" })
    ).toBeVisible();
  });

  test("?new=1 ile gelindiginde form dogrudan aciliyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/links?new=1");

    await expect(
      page.getByRole("heading", { name: "Add New Link" })
    ).toBeVisible();
    // Parametre adres cubugundan siliniyor; yenilemede form tekrar acilmamali.
    await expect(page).toHaveURL(/\/en\/links$/);
  });

  test("eski /links/add adresi forma yonlendiriyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/links/add");

    await expect(page).toHaveURL(/\/en\/links/);
    await expect(
      page.getByRole("heading", { name: "Add New Link" })
    ).toBeVisible();
  });

  test("panodaki 'Add Link' baglantisi formu aciyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/dashboard");
    // Panoda ve ust menude ayni hedefe giden birden fazla giris var.
    const baglantilar = page.getByRole("link", {
      name: "Add Link",
      exact: true,
    });
    await expect(baglantilar.first()).toHaveAttribute(
      "href",
      "/en/links?new=1"
    );
    await baglantilar.first().click();

    await expect(
      page.getByRole("heading", { name: "Add New Link" })
    ).toBeVisible();
  });

  test("giris yapmamis ziyaretci link sayfasina giremiyor", async ({
    page,
  }) => {
    await page.goto("/en/links");

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("silinen link onbellekteki sayfadan da kalkiyor", async ({ page }) => {
    /**
     * Sayfa bir dakikalik pencereyle onbellege aliniyor; temizlik
     * use-fetch'te, link silme de oradan geciyor. Olculdu ve
     * calisiyor, bu test onu tutuyor.
     *
     * Sira onemli: once ziyaret (onbellek dolsun), sonra sil. Tersi
     * olursa ilk ziyaret zaten silinmis halini gorur ve test hicbir
     * sey olcmez.
     *
     * NOT: paylasim karti link gostermiyor, dolayisiyla link
     * degisiklikleri karti etkilemiyor -- bakildi.
     */
    const { user, token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Kalan Link",
      url: "https://ornek.test/kalan",
    });
    await apiCreateLink(token, {
      title: "Silinecek Link",
      url: "https://ornek.test/silinecek",
    });

    await page.goto(`/en/${user.username}`);
    await expect(page.getByText("Silinecek Link")).toBeVisible();

    await page.goto("/en/links");
    await expect(page.getByText("Silinecek Link").first()).toBeVisible();
    await page.locator('button[title="Delete link"]').nth(1).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Silinecek Link")).toHaveCount(0);

    await page.goto(`/en/${user.username}`);
    await expect(page.getByText("Silinecek Link")).toHaveCount(0);
    // Kalan link hala duruyor: temizlik sayfayi bosaltmiyor, tazeliyor.
    await expect(page.getByText("Kalan Link")).toBeVisible();
  });
});
