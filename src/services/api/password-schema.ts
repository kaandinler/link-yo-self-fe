// Yup semalarinda kullanilan ortak sifre kurali.
import * as yup from "yup";

import {
  PASSWORD_MAX_LENGTH,
  getPasswordError,
} from "@/services/api/password-rules";

/**
 * Yup semalarinda sifre kurali. Kurallar backend'in aynasi
 * (src/services/api/password-rules.ts); son soz backend'in.
 */
export function passwordSchema(requiredMessage: string) {
  return yup
    .string()
    .required(requiredMessage)
    .max(
      PASSWORD_MAX_LENGTH,
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`
    )
    .test("password-rules", "", function (value) {
      const error = getPasswordError(value ?? "");
      return error ? this.createError({ message: error }) : true;
    });
}
