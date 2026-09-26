import { Page, expect } from "@playwright/test";
import { checkBox, fillField } from "./ui";
import {
  TestUser,
  apiCompleteOnboarding,
  apiLogin,
  apiLoginStatus,
  apiRegisterAndLogin,
  uniqueUser,
} from "./api";

const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

/**
 * Tarayiciyi giris yapmis duruma getirir.
 *
 * ESKIDEN CEREZI ELLE YAZIYORDUK. Token artik HttpOnly bir cerezde ve
 * onu yalnizca sunucu kuruyor; disaridan yazmak mumkun degil (zaten
 * olmamali -- testin kurdugu duzenek gercek akistan ayrisirsa test
 * dogruladigini sandigi seyi dogrulamaz).
 *
 * Bunun yerine gercek oturum ucu cagriliyor: /api/auth/session.
 * `page.request` tarayicinin cerez kabini uzerinden gittigi icin
 * yanittaki Set-Cookie dogrudan sayfaya isliyor.
 *
 * Origin basligi elle veriliyor: uc, durum degistiren isteklerde
 * Origin'i bu siteyle karsilastiriyor (CSRF). Tarayici disindan
 * yapilan istekte bu baslik kendiliginden gelmiyor.
 */
export async function signInThroughSessionEndpoint(page: Page, user: TestUser) {
  const yanit = await page.request.post(`${appUrl}/api/auth/session`, {
    headers: { "Content-Type": "application/json", Origin: appUrl },
    data: { username: user.email, password: user.password },
  });

  expect(
    yanit.status(),
    `Oturum acilamadi (${user.email}): ${await yanit.text()}`
  ).toBe(200);
}

/** Cerezleri temizler; /sign-in giris yapmis kullaniciyi disari atiyor. */
export async function signOut(page: Page) {
  await page.context().clearCookies();
}

/**
 * Yeni bir kullanici yaratip tarayiciyi onunla giris yapmis hale getirir.
 *
 * Varsayilan olarak onboarding tamamlanmis sayiliyor: aksi halde ana sayfa ve
 * korumali sayfalar kullaniciyi sihirbaza yolluyor ve testin asil konusu
 * gorunmuyor.
 */
export async function signInAsNewUser(
  page: Page,
  options: { onboarding?: boolean; user?: TestUser } = {}
) {
  const { user, token } = await apiRegisterAndLogin(
    options.user ?? uniqueUser()
  );
  if (options.onboarding !== false) {
    await apiCompleteOnboarding(token);
  }
  await signInThroughSessionEndpoint(page, user);
  return { user, token };
}

/**
 * Tarayiciyi admin olarak giris yapmis hale getirir.
 *
 * NEDEN HAZIR BIR HESAP: kayit ucu admin acmiyor ve bu bilincli --
 * `is_admin` orada olsaydi herkes kendini admin yapardi. Admin acmanin
 * yolu backend'in `scripts/create_admin` betigi; CI'da "Seed admin
 * user" adimi onu kosuyor, yerelde ayni komut elle calistiriliyor
 * (bkz. backend README, "Ilk admin").
 *
 * Hesap yoksa test atlanmiyor, anlasilir bir hatayla duruyor: sessizce
 * atlanan bir test, panelin hic taranmadigini gizlerdi.
 */
export async function signInAsAdmin(page: Page) {
  const user: TestUser = {
    username: process.env.E2E_ADMIN_USERNAME ?? "e2eadmin",
    email: process.env.E2E_ADMIN_EMAIL ?? "e2eadmin@example.com",
    password: process.env.E2E_ADMIN_PASSWORD ?? "E2eAdmin.Parola1",
  };

  const durum = await apiLoginStatus(user);
  expect(
    durum,
    `Admin hesabi yok ya da parolasi tutmuyor (${user.email}). ` +
      "Backend deposunda: python -m scripts.create_admin"
  ).toBe(200);

  const token = await apiLogin(user);
  await signInThroughSessionEndpoint(page, user);
  return { user, token };
}

/** Giris formunu arayuzden doldurup gonderir. */
export async function signInThroughUi(page: Page, user: TestUser) {
  await page.goto("/en/sign-in");
  await fillField(page, 'input[name="email"]', user.email);
  await fillField(page, 'input[name="password"]', user.password);
  await page.getByTestId("sign-in-submit").click();
}

/** Kayit formunu arayuzden doldurup gonderir. */
export async function signUpThroughUi(page: Page, user: TestUser) {
  await page.goto("/en/sign-up");
  await fillField(page, 'input[name="username"]', user.username);
  await fillField(page, 'input[name="email"]', user.email);
  await fillField(page, 'input[name="password"]', user.password);
  await checkBox(page, 'input[name="policy"]');
  await page.getByTestId("sign-up-submit").click();
}

/** Korumali sayfalarin giris ekranina atmadigini dogrular. */
export async function expectSignedIn(page: Page) {
  await expect(page).not.toHaveURL(/\/sign-in/);
}
