// Backend hata yanitlarini forma/uyariya cevirmek icin ortak yardimcilar.
//
// Backend iki farkli hata govdesi donuyor:
//   - Dogrulama (422): FastAPI'nin {detail: [{loc, msg, ...}]} yapisi
//   - Uygulama hatalari (400/403/404/409): ortak zarf {status, message, data}
// Formlarin her sayfada bu ayrimi tekrar cozmesi gerekmesin diye burada.

import { ApiErrorBody } from "./types/validation-errors";
import { ValidationErrorDetail } from "./types/fastapi-errors";

/**
 * Backend alan adlari snake_case, formlardaki alan adlari camelCase.
 * setError'in dogru input'u isaretlemesi icin cevrilmeleri gerekiyor.
 */
const API_TO_FORM_FIELD: Record<string, string> = {
  first_name: "firstName",
  last_name: "lastName",
  is_admin: "isAdmin",
};

/**
 * Yanit govdesini hata govdesi olarak yorumlar.
 *
 * Servis katmani govdeyi basari tipiyle (hatta bazen void ile) tipledigi icin
 * hata dalinda elimize `unknown` geciyor; daralmayi tek yerde yapiyoruz.
 */
function asErrorBody(response: unknown): ApiErrorBody | undefined {
  if (!response || typeof response !== "object") return undefined;
  return response as ApiErrorBody;
}

/**
 * 422 govdesindeki alan hatalarini {formAlani: mesaj} olarak doner.
 * Dogrulama hatasi yoksa bos nesne doner.
 */
export function getFieldErrors(response: unknown): Record<string, string> {
  const body = asErrorBody(response);
  if (!body || !Array.isArray(body.detail)) return {};

  return (body.detail as ValidationErrorDetail[]).reduce<
    Record<string, string>
  >((acc, item) => {
    // loc genelde ["body", "alan"] seklinde; son eleman alan adi.
    const apiField = item.loc?.[item.loc.length - 1];
    if (typeof apiField !== "string") return acc;

    const formField = API_TO_FORM_FIELD[apiField] ?? apiField;
    // Ayni alanda birden fazla hata varsa ilki yeterli.
    if (!acc[formField]) acc[formField] = item.msg;
    return acc;
  }, {});
}

/** Kullaniciya gosterilecek hata mesajini secer. */
export function getErrorMessage(response: unknown, fallback: string): string {
  const body = asErrorBody(response);
  if (!body) return fallback;

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }

  if (typeof body.detail === "string" && body.detail.trim()) {
    return body.detail;
  }

  if (Array.isArray(body.detail) && body.detail.length > 0) {
    const ilk = body.detail[0] as ValidationErrorDetail;
    const apiField = ilk.loc?.[ilk.loc.length - 1];
    return apiField ? `${apiField}: ${ilk.msg}` : ilk.msg;
  }

  return fallback;
}
