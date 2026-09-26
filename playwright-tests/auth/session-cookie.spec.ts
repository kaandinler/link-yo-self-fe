import { expect, test } from "@playwright/test";
import { apiCreateLink, uniqueUser } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";

/**
 * Oturum token'i tarayicidaki JavaScript'ten gizli.
 *
 * NEDEN BU DOSYA VAR: token onceden `auth-token-data` adli, js-cookie
 * ile kurulan siradan bir cerezteydi. `document.cookie` ile
 * okunabiliyordu, yani sayfaya sizan tek satirlik bir betik hem access
 * hem refresh token'i disari tasiyabilirdi. Artik cerez HttpOnly ve
 * token'i yalnizca Next sunucusu goruyor.
 *
 * Bu gerilemenin sessiz olacagini not etmek gerek: token'i yeniden
 * okunabilir bir cereze tasiyan bir degisiklik urunu hicbir yerinden
 * bozmaz -- butun akislar calismaya devam eder. Yalnizca bu testler
 * duser.
 */

const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3000";

/** Baska bir sitenin origin'i; CSRF testlerinde kullaniliyor. */
const YABANCI_ORIGIN = "https://kotu-site.ornek";

test.describe("Oturum cerezi", () => {
  test("token document.cookie'de gorunmuyor", async ({ page }) => {
    const { user } = await signInAsNewUser(page);
    await page.goto("/en/links");

    const jsCerezleri = await page.evaluate(() => document.cookie);

    // Once girisin gercekten olduğunu dogrula: bos bir oturumda bu
    // test bos yere gecerdi.
    await expect(page).not.toHaveURL(/\/sign-in/);

    expect(jsCerezleri).not.toContain("ly_session");
    // JWT'ler "eyJ" ile basliyor; hangi ad altinda olursa olsun bir
    // token cerezde duruyorsa burada yakalanir.
    expect(jsCerezleri).not.toContain("eyJ");
    expect(user.email).toBeTruthy();
  });

  test("oturum cerezi HttpOnly, isaret cerezi token tasimiyor", async ({
    page,
  }) => {
    await signInAsNewUser(page);

    const cerezler = await page.context().cookies(appUrl);

    const oturum = cerezler.find((c) => c.name === "ly_session");
    expect(oturum, "ly_session cerezi kurulmus olmali").toBeDefined();
    expect(oturum?.httpOnly).toBe(true);
    expect(oturum?.sameSite).toBe("Lax");

    const isaret = cerezler.find((c) => c.name === "ly_auth");
    expect(isaret, "istemci icin ipuc cerezi kurulmus olmali").toBeDefined();
    // Isaret cerezi bilincli olarak HttpOnly DEGIL -- ama token da
    // tasimiyor, degeri yalnizca "1".
    expect(isaret?.value).toBe("1");
  });

  test("eski okunabilir cerez giriste siliniyor", async ({ page }) => {
    /**
     * Onceki surumden kalan `auth-token-data` cerezi kullanicinin
     * tarayicisinda okunabilir bir token olarak durmaya devam ederdi.
     * Oturum kurulurken siliniyor.
     */
    await page
      .context()
      .addCookies([
        { name: "auth-token-data", value: "eski-token", url: appUrl },
      ]);

    await signInAsNewUser(page);

    const cerezler = await page.context().cookies(appUrl);
    expect(cerezler.find((c) => c.name === "auth-token-data")).toBeUndefined();
  });

  test("cikista oturum ve isaret cerezleri siliniyor", async ({ page }) => {
    await signInAsNewUser(page);
    await page.goto("/en/links");

    const yanit = await page.request.delete(`${appUrl}/api/auth/session`, {
      headers: { Origin: appUrl },
    });
    expect(yanit.status()).toBe(200);

    const cerezler = await page.context().cookies(appUrl);
    expect(cerezler.find((c) => c.name === "ly_session")).toBeUndefined();
    expect(cerezler.find((c) => c.name === "ly_auth")).toBeUndefined();
  });
});

test.describe("Vekil", () => {
  test("token donduren uclar vekilden gecmiyor", async ({ page }) => {
    /**
     * Vekil yaniti oldugu gibi istemciye donuyor. Bu uclarin yaniti
     * token iceriyor; acik birakilsalardi tarayici token'i yine
     * gorurdu ve cerezi HttpOnly yapmanin anlami kalmazdi.
     */
    await signInAsNewUser(page);

    /**
     * ONCE VEKILIN VAR OLDUGUNU DOGRULA.
     *
     * Bu olmadan test yanlis sebeple gecerdi: vekil hic yokken
     * /api/proxy/... zaten 404 doner. Olculdu -- duzeltme olmadan
     * kosturuldugunda bu test (tek basina) gecen iki testten biriydi.
     */
    const saglikli = await page.request.get(`${appUrl}/api/proxy/v1/users/me`, {
      headers: { Origin: appUrl },
    });
    expect(saglikli.status(), "vekil calisiyor olmali").toBe(200);

    for (const uc of ["v1/auth/token", "v1/auth/refresh", "v1/auth/logout"]) {
      const yanit = await page.request.post(`${appUrl}/api/proxy/${uc}`, {
        headers: { Origin: appUrl, "Content-Type": "application/json" },
        data: {},
      });
      expect(yanit.status(), `${uc} vekilden gecmemeli`).toBe(404);
      expect(await yanit.text()).not.toContain("access_token");
    }
  });

  test("yabanci origin'den gelen degisiklik reddediliyor", async ({ page }) => {
    /**
     * CSRF. Cerez SameSite=Lax oldugu icin tarayici onu siteler arasi
     * bir POST'a zaten eklemiyor; bu kontrol onun uzerine ikinci kat.
     * Olculen sey yalnizca durum kodu degil, ISTEGIN GERCEKLESMEMESI.
     */
    const { token } = await signInAsNewUser(page);

    const yanit = await page.request.post(`${appUrl}/api/proxy/v1/links/`, {
      headers: { Origin: YABANCI_ORIGIN, "Content-Type": "application/json" },
      data: { title: "CSRF ile eklendi", url: "https://kotu.ornek" },
    });
    expect(yanit.status()).toBe(403);

    // Link gercekten olusmamis olmali.
    const liste = await page.request.get(`${appUrl}/api/proxy/v1/links/`, {
      headers: { Origin: appUrl },
    });
    expect(await liste.text()).not.toContain("CSRF ile eklendi");
    expect(token).toBeTruthy();
  });

  test("okuma istegi yabanci origin'le de gecebiliyor ama veri sizmiyor", async ({
    page,
  }) => {
    /**
     * GET'te Origin kontrolu yok: siteler arasi bir GET'in yanitini
     * saldirgan zaten okuyamaz (CORS). Kontrolu GET'e de koymak,
     * hicbir sey kazandirmadan normal gezinmeyi kirardi.
     */
    await signInAsNewUser(page);

    const yanit = await page.request.get(`${appUrl}/api/proxy/v1/users/me`, {
      headers: { Origin: YABANCI_ORIGIN },
    });

    expect(yanit.status()).toBe(200);
    // Yanit kullanicinin kendi bilgisi; token ICERMIYOR.
    expect(await yanit.text()).not.toContain("access_token");
  });

  test("oturumsuz cagri 401 doner ve token sizdirmaz", async ({ request }) => {
    const yanit = await request.post(`${appUrl}/api/proxy/v1/links/`, {
      headers: { Origin: appUrl, "Content-Type": "application/json" },
      data: { title: "x", url: "https://ornek.test" },
    });

    expect(yanit.status()).toBe(401);
  });
});

test.describe("Sifre degistirme", () => {
  test("yeni token gövdede donmuyor ama oturum devam ediyor", async ({
    page,
  }) => {
    /**
     * Backend sifre degisince diger oturumlari kapatip bu oturum icin
     * yeni bir token cifti donuyor. Eskiden bu cift istemcide okunup
     * cereze yaziliyordu; artik vekil onu yanittan alip HttpOnly
     * cereze yaziyor ve GOVDEDEN CIKARIYOR.
     *
     * Iki sey birlikte olculuyor, cunku biri digeri olmadan
     * yaniltici: token govdede gorunmemeli VE kullanici oturumdan
     * dusmemeli. Vekil token'i yalnizca silseydi ilk iddia gecer,
     * ikincisi duserdi.
     */
    const kullanici = uniqueUser();
    await signInAsNewUser(page, { user: kullanici });
    await page.goto("/en/links");

    const yeniSifre = "Yeni.Parola123";
    const yanit = await page.request.post(
      `${appUrl}/api/proxy/v1/auth/change-password`,
      {
        headers: { Origin: appUrl, "Content-Type": "application/json" },
        data: {
          current_password: kullanici.password,
          new_password: yeniSifre,
        },
      }
    );

    expect(yanit.status(), await yanit.text()).toBe(200);
    const govde = await yanit.text();
    expect(govde).not.toContain("access_token");
    expect(govde).not.toContain("refresh_token");
    expect(govde).not.toContain("eyJ");

    // Oturum hala gecerli: yeni token cereze yazilmis olmali.
    const ben = await page.request.get(`${appUrl}/api/proxy/v1/users/me`, {
      headers: { Origin: appUrl },
    });
    expect(ben.status(), "sifre degisikligi oturumu dusurmemeli").toBe(200);
  });
});

test.describe("Anonim ziyaretci", () => {
  test("herkese acik profilde kimlik ucu hic cagrilmiyor", async ({
    page,
    browser,
  }) => {
    /**
     * NEDEN OLCULUYOR: AuthProvider kok layout'ta, yani herkese acik
     * profil sayfalarini da sariyor -- urunun en cok trafik alan
     * sayfasi. Eskiden token cerezini okuyup "cerez yoksa hic sorma"
     * diyebiliyordu. HttpOnly cerez okunamadigi icin bu karar
     * ipuc cerezine (ly_auth) tasindi; ipuc olmasaydi her ziyarette
     * 401 ile donen bir /users/me cagrisi olurdu.
     */
    const { user, token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Portfolyo",
      url: "https://ornek.test/p",
    });

    // Temiz bir tarayici: hicbir cerez yok.
    const anonim = await browser.newContext();
    const anonimSayfa = await anonim.newPage();

    const kimlikCagrilari: string[] = [];
    anonimSayfa.on("request", (r) => {
      if (r.url().includes("/v1/users/me")) kimlikCagrilari.push(r.url());
    });

    await anonimSayfa.goto(`${appUrl}/en/${user.username}`);
    await expect(anonimSayfa.getByText("Portfolyo")).toBeVisible();

    expect(
      kimlikCagrilari,
      "anonim ziyaretci kimlik ucuna hic gitmemeli"
    ).toEqual([]);

    await anonim.close();
  });
});
