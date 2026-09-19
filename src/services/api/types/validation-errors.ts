import HTTP_CODES_ENUM from "./http-codes";
import { ValidationErrorDetail } from "./fastapi-errors";

/**
 * Backend'in hata govdesi.
 *
 * ONCEKI HALI BOZUKTU: boilerplate NestJS'in {errors: {alan: kod}} yapisini
 * tarif ediyordu. FastAPI dogrulama hatalarinda {detail: [...]}, uygulama
 * hatalarinda ise ortak zarfi ({status, message, data}) donuyor. Yani
 * `data.errors` her zaman undefined'di ve onu okuyan formlar
 * Object.keys(undefined) ile TypeError firlatiyordu.
 */
export type ApiErrorBody = {
  status?: string;
  message?: string | null;
  detail?: string | ValidationErrorDetail[];
};

/** 4xx yanitlari (500/503 govdesiz kabul ediliyor). */
export type ApiErrorResponse = {
  status:
    | HTTP_CODES_ENUM.BAD_REQUEST
    | HTTP_CODES_ENUM.UNAUTHORIZED
    | HTTP_CODES_ENUM.FORBIDDEN
    | HTTP_CODES_ENUM.NOT_FOUND
    | HTTP_CODES_ENUM.CONFLICT
    | HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY;
  data: ApiErrorBody;
};

/** Geriye donuk ad; eski adiyla import eden yerler icin. */
export type ValidationErrors = ApiErrorResponse;
