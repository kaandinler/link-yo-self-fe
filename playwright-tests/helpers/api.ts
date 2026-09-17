import { APIRequestContext, expect, request } from "@playwright/test";

/**
 * Testler backend'in gercek uclarini kullaniyor. Her test kendi kullanicisini
 * yaratiyor: suite parallel calisiyor ve paylasilan kullanici testleri
 * birbirine baglar.
 */
// Not: baseURL yerine tam URL kuruyoruz. Playwright'in baseURL'i "/v1/..."
// gibi mutlak yollari origin'e gore cozuyor ve "/api" onekini dusuruyor.
const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

export type TestUser = {
  username: string;
  email: string;
  password: string;
};

let sayac = 0;

/** Ayni anda calisan worker'lar carpismasin diye benzersiz ad uretir. */
export function uniqueUser(prefix = "e2e"): TestUser {
  sayac += 1;
  const id = `${Date.now().toString(36)}${sayac}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  return {
    // Backend kurali: 3-30 karakter, harf/rakam/nokta/tire/alt cizgi.
    username: `${prefix}${id}`.slice(0, 30),
    email: `${prefix}${id}@example.com`,
    // Sifre kurali: 8+ karakter, kucuk/buyuk harf ve rakam.
    password: "E2ePassw0rd",
  };
}

async function ctx(): Promise<APIRequestContext> {
  return request.newContext();
}

/** POST /v1/auth/register */
export async function apiRegister(user: TestUser = uniqueUser()) {
  const api = await ctx();
  const response = await api.post(`${apiUrl}/v1/auth/register`, { data: user });
  expect(response.status(), `kayit basarisiz: ${await response.text()}`).toBe(
    201
  );
  await api.dispose();
  return user;
}

/** POST /v1/auth/token — access token doner. */
export async function apiLogin(user: TestUser): Promise<string> {
  const api = await ctx();
  const response = await api.post(`${apiUrl}/v1/auth/token`, {
    form: { username: user.email, password: user.password },
  });
  expect(response.status(), `giris basarisiz: ${await response.text()}`).toBe(
    200
  );
  const body = await response.json();
  await api.dispose();
  return body.data.access_token;
}

/** Kayit + giris; testlerin cogu bu ikisine birden ihtiyac duyuyor. */
export async function apiRegisterAndLogin(user: TestUser = uniqueUser()) {
  await apiRegister(user);
  return { user, token: await apiLogin(user) };
}

/** POST /v1/links/ */
export async function apiCreateLink(
  token: string,
  data: { title: string; url: string }
) {
  const api = await ctx();
  const response = await api.post(`${apiUrl}/v1/links/`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(
    response.status(),
    `link olusturulamadi: ${await response.text()}`
  ).toBe(201);
  const body = await response.json();
  await api.dispose();
  return body.data;
}

/**
 * Onboarding'i tamamlar.
 *
 * Yeni kayitli kullanicinin onboarding_completed alani false; ana sayfa onu
 * sihirbaza yolluyor. Sihirbazla ilgilenmeyen testler bu adimi atlayabilsin
 * diye API'den tamamliyoruz.
 */
export async function apiCompleteOnboarding(token: string) {
  const api = await ctx();
  const response = await api.post(`${apiUrl}/v1/profile/complete-onboarding`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);
  await api.dispose();
}

/** PUT /v1/profile/update — profil alanlarini gunceller. */
export async function apiUpdateProfile(
  token: string,
  data: Record<string, unknown>
) {
  const api = await ctx();
  const response = await api.put(`${apiUrl}/v1/profile/update`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(
    response.status(),
    `profil guncellenemedi: ${await response.text()}`
  ).toBe(200);
  const body = await response.json();
  await api.dispose();
  return body.data;
}

/** GET /v1/analytics/summary */
export async function apiAnalyticsSummary(token: string) {
  const api = await ctx();
  const response = await api.get(`${apiUrl}/v1/analytics/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  await api.dispose();
  return body.data;
}

/** GET /v1/p/{username} — herkese acik profil (token gerektirmiyor). */
export async function apiPublicProfile(username: string) {
  const api = await ctx();
  const response = await api.get(`${apiUrl}/v1/p/${username}`);
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  await api.dispose();
  return body.data;
}

/** POST /v1/auth/token — yalnizca HTTP durumunu doner; hata beklenen testler icin. */
export async function apiLoginStatus(user: TestUser): Promise<number> {
  const api = await ctx();
  const response = await api.post(`${apiUrl}/v1/auth/token`, {
    form: { username: user.email, password: user.password },
  });
  await api.dispose();
  return response.status();
}

/** POST /v1/links/{id}/click — herkese acik, token istemiyor. */
export async function apiClickLink(linkId: number) {
  const api = await ctx();
  const response = await api.post(`${apiUrl}/v1/links/${linkId}/click`);
  expect(response.status(), await response.text()).toBe(200);
  await api.dispose();
}

/** GET /v1/analytics/timeseries */
export async function apiTimeseries(token: string, days = 7) {
  const api = await ctx();
  const response = await api.get(
    `${apiUrl}/v1/analytics/timeseries?days=${days}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  await api.dispose();
  return body.data;
}

/** GET /v1/analytics/timeseries/by-link */
export async function apiLinkTimeseries(token: string, days = 7) {
  const api = await ctx();
  const response = await api.get(
    `${apiUrl}/v1/analytics/timeseries/by-link?days=${days}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  await api.dispose();
  return body.data;
}

/** GET /v1/analytics/referrers */
export async function apiReferrers(token: string, days = 7) {
  const api = await ctx();
  const response = await api.get(
    `${apiUrl}/v1/analytics/referrers?days=${days}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  await api.dispose();
  return body.data;
}
