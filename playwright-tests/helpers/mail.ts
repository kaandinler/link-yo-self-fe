import fs from "node:fs/promises";

/**
 * Backend'in gonderdigi e-postalari okur.
 *
 * SMTP yapilandirilmadiginda EmailSender postayi gondermek yerine icerigi
 * log'a yaziyor (bkz. core/email/sender.py). E2E ortaminda SMTP'yi hic
 * yapilandirmiyoruz; boylece dogrulama ve sifre sifirlama akislarini gercek
 * token'larla, sahte bir IMAP hesabina ihtiyac duymadan test edebiliyoruz.
 *
 * E2E_BACKEND_LOG, uvicorn'un ciktisini yazdigi dosyayi gosterir.
 */
const logPath = process.env.E2E_BACKEND_LOG;

export type MailKind = "confirm-email" | "password-change";

/** Log'un tamami; dosya henuz yoksa bos string. */
async function readLog(): Promise<string> {
  if (!logPath) {
    throw new Error(
      "E2E_BACKEND_LOG tanimli degil; e-posta iceren testler backend log'unu okuyamaz."
    );
  }
  try {
    return await fs.readFile(logPath, "utf8");
  } catch {
    return "";
  }
}

/**
 * Log'daki son e-postadan token'i cikarir.
 *
 * Log kaydi su bicimde: "... Alici: <adres> | Konu: <konu>" ve ardindan govde.
 * Adrese gore bolup son eslesmeyi aliyoruz: ayni kullaniciya birden fazla
 * baglanti gonderilmisse gecerli olan sonuncusudur.
 */
function extractToken(
  log: string,
  email: string,
  kind: MailKind
): string | null {
  const parcalar = log.split("Alici: ").slice(1);
  let sonuncu: string | null = null;

  for (const parca of parcalar) {
    if (!parca.startsWith(`${email} `)) continue;
    const eslesme = parca.match(
      new RegExp(`/${kind}\\?token=([A-Za-z0-9_-]+)`)
    );
    if (eslesme) sonuncu = eslesme[1];
  }

  return sonuncu;
}

/**
 * Adrese gonderilen token gelene kadar bekler.
 *
 * `sonra` verilirse yalnizca o noktadan sonraki kayitlara bakilir; adres
 * degistirme gibi ayni kullaniciya ikinci bir posta gonderen akislarda
 * eskisini yakalamamak icin gerekli.
 */
export async function waitForMailToken(
  email: string,
  kind: MailKind,
  options: { sonra?: number } = {}
): Promise<string> {
  const bitis = Date.now() + 20_000;
  const baslangic = options.sonra ?? 0;

  for (;;) {
    const log = (await readLog()).slice(baslangic);
    const token = extractToken(log, email, kind);
    if (token) return token;

    if (Date.now() > bitis) {
      throw new Error(
        `${email} adresine ${kind} postasi 20 saniyede gelmedi. ` +
          `Backend log'u: ${logPath}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

/** Log'un su anki uzunlugu; waitForMailToken'in `sonra` parametresi icin. */
export async function mailLogOffset(): Promise<number> {
  return (await readLog()).length;
}
