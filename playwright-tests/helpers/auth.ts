import { Page, expect } from "@playwright/test";
import { checkBox, fillField } from "./ui";
import {
  TestUser,
  apiCompleteOnboarding,
  apiRegisterAndLogin,
  uniqueUser,
} from "./api";

/** js-cookie'nin auth token'i sakladigi cerez adi (src/services/auth/config.ts). */
const AUTH_COOKIE = "auth-token-data";

const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

/**
 * Tarayiciyi giris yapmis duruma getirir.
 *
 * AuthProvider acilista cerezdeki token ile /v1/users/me cagirip kullaniciyi
 * yukluyor; dolayisiyla cerezi yazmak arayuzden giris yapmakla ayni sonucu
 * veriyor. Giris ekraninin kendisi sign-in testinde ayrica dogrulaniyor, bu
 * yuzden diger testler her seferinde o formdan gecmiyor.
 */
export async function setAuthCookie(page: Page, token: string) {
  await page.context().addCookies([
    {
      name: AUTH_COOKIE,
      // js-cookie okurken decodeURIComponent uyguluyor.
      value: encodeURIComponent(
        JSON.stringify({ token, refreshToken: null, tokenExpires: null })
      ),
      url: appUrl,
    },
  ]);
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
  await setAuthCookie(page, token);
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
