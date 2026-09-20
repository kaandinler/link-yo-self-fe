import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Ceviri dosyalarinin butunlugu.
 *
 * NEDEN TEST: i18next eksik bir anahtari bulamayinca hata vermiyor,
 * anahtarin KENDISINI basiyor -- ekranda "danger.submit" yaziyor ve
 * derleme, lint, tip kontrolu uc u de temiz geciyor. Yani bu hata
 * sinifi yalnizca birinin sayfaya bakmasiyla ortaya cikar.
 *
 * Bu dosya tarayici acmiyor; dosya sisteminden okuyor. Uc sey olculuyor:
 *  1. Her dilde ayni anahtar kumesi var (biri eklenip digeri unutulmasin).
 *  2. Kodda cagrilan her t("...") anahtari gercekten tanimli.
 *  3. Hicbir ceviri bos degil.
 */

/**
 * Bilincli olarak CEVRILMEYEN namespace'ler.
 *
 * privacy-policy: metin boilerplate'ten geliyor ve BASKA BIR SIRKETI
 * adlandiriyor -- company_description "refers to BC Boilerplates",
 * website_description "refers to Extensive React Boilerplate". Yani
 * canli sayfa kullanicilara verilerinin baska bir urun tarafindan
 * islendigini soyluyor. Bunu Turkceye cevirmek yanlis bir iddiayi
 * ikinci bir dile tasimak olurdu; once Ingilizcesi bu urun icin
 * yeniden yazilmali.
 *
 * Eksik namespace zarif dusuyor: i18next fallbackLng "en" oldugu icin
 * /tr/privacy-policy Ingilizce icerikle aciliyor, ham anahtar
 * basilmiyor (olculdu).
 *
 * Bu liste bir kapi: bir namespace'in cevrilmemis olmasi ancak burada
 * yaziliysa ve sebebi belliyse gecerli.
 */
const CEVRILMEYENLER = new Set(["privacy-policy"]);

const KOK = path.join(__dirname, "..", "..");
const LOCALES = path.join(KOK, "src", "services", "i18n", "locales");
const KAYNAK = path.join(KOK, "src");

/** JSON'u "a.b.c" duz anahtarlarina acar. */
function duzlestir(nesne: unknown, onek = ""): Map<string, unknown> {
  const sonuc = new Map<string, unknown>();
  if (typeof nesne !== "object" || nesne === null) return sonuc;

  for (const [anahtar, deger] of Object.entries(nesne)) {
    const tam = onek ? `${onek}.${anahtar}` : anahtar;
    if (typeof deger === "object" && deger !== null && !Array.isArray(deger)) {
      for (const [ic, icDeger] of Array.from(duzlestir(deger, tam))) {
        sonuc.set(ic, icDeger);
      }
    } else {
      sonuc.set(tam, deger);
    }
  }
  return sonuc;
}

function diller(): string[] {
  return fs
    .readdirSync(LOCALES, { withFileTypes: true })
    .filter((giris) => giris.isDirectory())
    .map((giris) => giris.name)
    .sort();
}

function namespaceler(dil: string): string[] {
  return fs
    .readdirSync(path.join(LOCALES, dil))
    .filter((ad) => ad.endsWith(".json"))
    .map((ad) => ad.replace(/\.json$/, ""))
    .sort();
}

function oku(dil: string, ns: string): Map<string, unknown> {
  const yol = path.join(LOCALES, dil, `${ns}.json`);
  return duzlestir(JSON.parse(fs.readFileSync(yol, "utf8")));
}

/** src altindaki butun .ts/.tsx dosyalari. */
function kaynakDosyalari(dizin = KAYNAK): string[] {
  const cikti: string[] = [];
  for (const giris of fs.readdirSync(dizin, { withFileTypes: true })) {
    const tam = path.join(dizin, giris.name);
    if (giris.isDirectory()) cikti.push(...kaynakDosyalari(tam));
    else if (/\.tsx?$/.test(giris.name)) cikti.push(tam);
  }
  return cikti;
}

test.describe("Ceviri dosyalari", () => {
  test("butun diller ayni anahtar kumesine sahip", () => {
    const [ilkDil, ...digerleri] = diller();

    for (const dil of digerleri) {
      const beklenenNs = namespaceler(ilkDil).filter(
        (ns) => !CEVRILMEYENLER.has(ns)
      );

      expect(
        namespaceler(dil),
        `${dil} ve ${ilkDil} ayni namespace'lere sahip olmali ` +
          `(CEVRILMEYENLER haric)`
      ).toEqual(beklenenNs);

      for (const ns of beklenenNs) {
        const beklenen = Array.from(oku(ilkDil, ns).keys()).sort();
        const gelen = Array.from(oku(dil, ns).keys()).sort();

        expect(
          gelen,
          `${dil}/${ns}.json anahtarlari ${ilkDil} ile ayrisiyor`
        ).toEqual(beklenen);
      }
    }
  });

  test("hicbir ceviri bos degil", () => {
    const bos: string[] = [];

    for (const dil of diller()) {
      for (const ns of namespaceler(dil)) {
        for (const [anahtar, deger] of Array.from(oku(dil, ns))) {
          if (typeof deger !== "string" || deger.trim() === "") {
            bos.push(`${dil}/${ns}.json -> ${anahtar}`);
          }
        }
      }
    }

    expect(bos, `bos ceviriler:\n${bos.join("\n")}`).toEqual([]);
  });

  test("kodda cagrilan her anahtar tanimli", () => {
    /**
     * Dosya basina tek namespace varsayiliyor: her bilesen
     * useTranslation("ns") ile tek bir namespace aciyor. Birden fazla
     * acan bir dosya cikarsa bu test onu atlar (asagida atlaniyor) --
     * yanlis bir uyari uretmektense olcmemek daha iyi.
     */
    const eksik: string[] = [];

    for (const dosya of kaynakDosyalari()) {
      const icerik = fs.readFileSync(dosya, "utf8");
      // Array.from: tsconfig hedefi iterator yayilimina izin vermiyor.
      const nsEslesme = Array.from(
        icerik.matchAll(
          /(?:useTranslation|getServerTranslation)\([^)]*?"([\w-]+)"\)/g
        )
      ).map((e) => e[1]);

      const benzersiz = Array.from(new Set(nsEslesme));
      if (benzersiz.length !== 1) continue;

      const ns = benzersiz[0];
      const yol = path.join(LOCALES, "en", `${ns}.json`);
      if (!fs.existsSync(yol)) continue;

      const tanimli = oku("en", ns);
      // Yalnizca sabit dizge anahtarlar: t(degisken) burada olculemez.
      for (const eslesme of Array.from(
        icerik.matchAll(/\bt\(\s*"([\w.-]+)"/g)
      )) {
        const anahtar = eslesme[1];
        if (!tanimli.has(anahtar)) {
          eksik.push(`${path.relative(KOK, dosya)} -> ${ns}:${anahtar}`);
        }
      }
    }

    expect(eksik, `tanimsiz anahtarlar:\n${eksik.join("\n")}`).toEqual([]);
  });
});
