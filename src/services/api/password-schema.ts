// Yup semalarinda kullanilan ortak sifre kurali.
import * as yup from "yup";

import {
  Ceviri,
  PASSWORD_MAX_LENGTH,
  getPasswordError,
} from "@/services/api/password-rules";

/**
 * Yup semalarinda sifre kurali. Kurallar backend'in aynasi
 * (src/services/api/password-rules.ts); son soz backend'in.
 *
 * `t` disaridan geliyor: yup mesajlari cozulmus dizge bekliyor, yani
 * ceviri burada yapilmali. Cagiran her bilesende `t` zaten var --
 * requiredMessage'i de oradan veriyorlar.
 */
export function passwordSchema(requiredMessage: string, t: Ceviri) {
  return yup
    .string()
    .required(requiredMessage)
    .max(
      PASSWORD_MAX_LENGTH,
      t("password.errors.max", { max: PASSWORD_MAX_LENGTH })
    )
    .test("password-rules", "", function (value) {
      const error = getPasswordError(value ?? "", t);
      return error ? this.createError({ message: error }) : true;
    });
}
