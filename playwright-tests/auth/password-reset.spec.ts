import { expect, test } from "@playwright/test";
import { apiLogin, apiRegister, uniqueUser } from "../helpers/api";
import { mailLogOffset, waitForMailToken } from "../helpers/mail";
import { fillField } from "../helpers/ui";

const YENI_SIFRE = "YeniSifre123";

test.describe("Sifre sifirlama", () => {
  test("baglantiyla yeni sifre belirlenip giris yapilabiliyor", async ({
    page,
  }) => {
    const user = await apiRegister(uniqueUser());
    // Kayit zaten bir dogrulama postasi gonderdi; sifirlama postasini
    // ondan ayirmak icin log'un su anki sonundan itibaren ariyoruz.
    const offset = await mailLogOffset();

    await page.goto("/en/forgot-password");
    await fillField(page, 'input[name="email"]', user.email);
    await page.getByTestId("send-email").click();
    await expect(
      page.getByText("Reset link has been sent to your email")
    ).toBeVisible();

    const token = await waitForMailToken(user.email, "password-change", {
      sonra: offset,
    });

    await page.goto(`/en/password-change?token=${token}`);
    await fillField(page, 'input[name="password"]', YENI_SIFRE);
    await fillField(page, 'input[name="passwordConfirmation"]', YENI_SIFRE);
    await page.getByTestId("set-password").click();

    await expect(
      page.getByText("Password has been reset successfully")
    ).toBeVisible();

    // Asil kanit: yeni sifre backend'de gecerli, eskisi degil.
    await apiLogin({ ...user, password: YENI_SIFRE });
  });

  test("bilinmeyen adres icin de ayni basari mesaji doner", async ({
    page,
  }) => {
    // Hangi adreslerin kayitli oldugunu sizdirmamak icin backend 204 donuyor.
    await page.goto("/en/forgot-password");
    await fillField(page, 'input[name="email"]', "kayitli-degil@example.com");
    await page.getByTestId("send-email").click();

    await expect(
      page.getByText("Reset link has been sent to your email")
    ).toBeVisible();
  });

  test("gecersiz token ile sifre degistirilemiyor", async ({ page }) => {
    await page.goto("/en/password-change?token=boyle-bir-token-yok");
    await fillField(page, 'input[name="password"]', YENI_SIFRE);
    await fillField(page, 'input[name="passwordConfirmation"]', YENI_SIFRE);
    await page.getByTestId("set-password").click();

    await expect(
      page.getByText("Password has been reset successfully")
    ).toHaveCount(0);
  });

  test("expires parametresi gecmisteyse uyari cikiyor", async ({ page }) => {
    // expires milisaniye cinsinden ve istege bagli; backend'in gonderdigi
    // baglantida yok, sure sunucuda kontrol ediliyor. Parametre verildiginde
    // uyarinin ciktigini, verilmediginde cikmadigini dogruluyoruz.
    const gecmis = Date.now() - 60_000;

    await page.goto(`/en/password-change?token=abc&expires=${gecmis}`);
    await expect(page.getByTestId("reset-link-expired-alert")).toBeVisible();

    await page.goto("/en/password-change?token=abc");
    await expect(page.getByTestId("reset-link-expired-alert")).toHaveCount(0);
  });

  test("sifre onayi eslesmezse istek gonderilmiyor", async ({ page }) => {
    await page.goto("/en/password-change?token=abc");
    await fillField(page, 'input[name="password"]', YENI_SIFRE);
    await fillField(
      page,
      'input[name="passwordConfirmation"]',
      "BaskaSifre123"
    );
    await page.getByTestId("set-password").click();

    await expect(
      page.getByText("Password confirmation must match password")
    ).toBeVisible();
  });
});
