import { expect, test } from "@playwright/test";
import { apiRegister, uniqueUser } from "../helpers/api";
import { signUpThroughUi } from "../helpers/auth";
import { checkBox, fillField } from "../helpers/ui";

const ONAY_KARTI = /We sent a confirmation link/i;

test.describe("Kayit", () => {
  test("yeni kullanici kayit olabilir ve giris baglantisi gorur", async ({
    page,
  }) => {
    await signUpThroughUi(page, uniqueUser());

    // Basarili kayitta form yerine onay karti geliyor.
    await expect(page.getByText(ONAY_KARTI)).toBeVisible();
    // exact: true buyuk/kucuk harfe duyarli; ust menudeki "Sign In" degil,
    // karttaki "Sign in" baglantisi araniyor.
    await expect(
      page.getByRole("link", { name: "Sign in", exact: true })
    ).toBeVisible();
  });

  test("profil adresi kullanici adi yazildikca guncelleniyor", async ({
    page,
  }) => {
    await page.goto("/en/sign-up");
    await expect(page.getByText("linkyoself.com/username")).toBeVisible();

    await fillField(page, 'input[name="username"]', "onizleme");

    await expect(page.getByText("linkyoself.com/onizleme")).toBeVisible();
  });

  test("kural disi sifre istek gonderilmeden reddediliyor", async ({
    page,
  }) => {
    const user = uniqueUser();

    await page.goto("/en/sign-up");
    await fillField(page, 'input[name="username"]', user.username);
    await fillField(page, 'input[name="email"]', user.email);
    // Buyuk harf ve rakam yok; backend de ayni kurali uyguluyor
    // (bkz. src/services/api/password-rules.ts).
    await fillField(page, 'input[name="password"]', "yalnizkucuk");
    await checkBox(page, 'input[name="policy"]');
    await page.getByTestId("sign-up-submit").click();

    await expect(
      page.getByText("Password must contain at least one uppercase letter")
    ).toBeVisible();
    await expect(page.getByText(ONAY_KARTI)).toHaveCount(0);
  });

  test("sozlesme onaylanmadan kayit olunamiyor", async ({ page }) => {
    const user = uniqueUser();

    await page.goto("/en/sign-up");
    await fillField(page, 'input[name="username"]', user.username);
    await fillField(page, 'input[name="email"]', user.email);
    await fillField(page, 'input[name="password"]', user.password);
    await page.getByTestId("sign-up-submit").click();

    await expect(
      page.getByText("You must accept the terms and conditions")
    ).toBeVisible();
    await expect(page.getByText(ONAY_KARTI)).toHaveCount(0);
  });

  test("kullanilan kullanici adi backend hatasiyla bildiriliyor", async ({
    page,
  }) => {
    const user = await apiRegister(uniqueUser());

    await signUpThroughUi(page, user);

    await expect(page.getByText(/already exists/i)).toBeVisible();
    await expect(page.getByText(ONAY_KARTI)).toHaveCount(0);
  });
});
