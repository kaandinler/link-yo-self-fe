import { expect, test } from "@playwright/test";
import { apiLoginStatus, apiRegisterAndLogin } from "../helpers/api";
import { signInAsAdmin, signInAsNewUser } from "../helpers/auth";
import { fillField } from "../helpers/ui";

test.describe("Hesap kapatma", () => {
  test("kullanici kendi hesabini kapatabiliyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);

    // ONCE ZIYARET: sayfa bir dakikalik pencereyle onbellege aliniyor.
    // Bu satir olmadan kapatmadan sonraki istek zaten onbellege hic
    // girmemis bir sayfayi getiriyor ve test onbellegi hic olcmuyor.
    // Olculdu: bu satirla birlikte, kapatilan hesabin sayfasi hala 200
    // donup silinen profilin adini gosteriyordu.
    await expect(page.goto(`/en/${user.username}`)).resolves.toBeTruthy();

    await page.goto("/en/settings");
    await fillField(page, "#delete-account-password", user.password);
    await page.getByRole("button", { name: "Close my account" }).click();
    await page.getByRole("button", { name: "Close account" }).click();

    // Cikis yapilip giris ekranina donuluyor.
    await expect(page).toHaveURL(/\/sign-in|\/en$|\/en\/$/);

    // Hesap gercekten kapandi: giris yapilamiyor, profil sayfasi 404.
    expect(await apiLoginStatus(user)).not.toBe(200);
    const profil = await page.goto(`/en/${user.username}`);
    expect(profil?.status()).toBe(404);
  });

  test("yanlis sifreyle hesap kapanmiyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/settings");
    await fillField(page, "#delete-account-password", "BaskaSifre123");
    await page.getByRole("button", { name: "Close my account" }).click();
    await page.getByRole("button", { name: "Close account" }).click();

    await expect(
      page.getByText(/could not be closed|incorrect|invalid/i)
    ).toBeVisible();
    expect(await apiLoginStatus(user)).toBe(200);
  });

  test("sifre girilmeden onay diyalogu acilmiyor", async ({ page }) => {
    await signInAsNewUser(page);

    await page.goto("/en/settings");
    await page.getByRole("button", { name: "Close my account" }).click();

    await expect(
      page.getByText("Enter your password to confirm.")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close account" })
    ).toHaveCount(0);
  });

  test("giris yapmamis ziyaretci ayarlara giremiyor", async ({ page }) => {
    await page.goto("/en/settings");

    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe("Kapatilan hesabin sayfasi onbellekte kalmiyor", () => {
  test("admin bir hesabi kapatinca o kisinin sayfasi hemen kapaniyor", async ({
    page,
    request,
  }) => {
    /**
     * Sayfa bir dakikalik pencereyle onbellege aliniyor. use-fetch'teki
     * kendiliginden temizlik CAGIRANIN profilini temizliyor, yani
     * panelden silerken admin'inkini; silinen kisininki acikta
     * kalirdi. Uc bu yuzden admin'den kullanici adi kabul ediyor.
     */
    const { user } = await apiRegisterAndLogin();

    // Once ziyaret: onbellek dolsun.
    expect((await request.get(`/en/${user.username}`)).status()).toBe(200);

    const { token: adminToken } = await signInAsAdmin(page);
    const temizlik = await request.post("/api/revalidate-profile", {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { username: user.username },
    });
    expect(temizlik.status(), await temizlik.text()).toBe(200);
  });

  test("admin olmayan baskasinin onbellegini temizleyemiyor", async ({
    page,
    request,
  }) => {
    // Uc kullanici adini govdeden aldigi icin, yetki kontrolu olmasa
    // herkes baskasinin sayfasini istedigi kadar backend'e gonderirdi.
    const { user: kurban } = await apiRegisterAndLogin();
    const { token } = await signInAsNewUser(page);

    const yanit = await request.post("/api/revalidate-profile", {
      headers: { Authorization: `Bearer ${token}` },
      data: { username: kurban.username },
    });

    expect(yanit.status()).toBe(403);
  });

  test("tokensiz temizlik reddediliyor", async ({ request }) => {
    expect((await request.post("/api/revalidate-profile")).status()).toBe(401);
  });
});
