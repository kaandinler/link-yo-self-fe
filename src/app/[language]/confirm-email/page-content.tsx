"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useAuthVerifyEmailService } from "@/services/api/services/auth";
import { getErrorMessage } from "@/services/api/api-errors";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useAuthActions from "@/services/auth/use-auth-actions";
import { oturumIsaretiVar } from "@/services/auth/session-hint";
import { useTranslation } from "@/services/i18n/client";
import useLanguage from "@/services/i18n/use-language";

type Durum = "loading" | "success" | "error";

function ConfirmEmail() {
  const { t } = useTranslation("confirm-email");
  const language = useLanguage();
  const { setUser } = useAuthActions();
  const verifyEmail = useAuthVerifyEmailService();

  const [durum, setDurum] = useState<Durum>("loading");
  const [hata, setHata] = useState<string | null>(null);

  // React 18 strict mode geliştirme modunda efektleri iki kez calistiriyor;
  // token tek kullanimlik oldugu icin ikinci cagri "gecersiz token" derdi.
  const calisti = useRef(false);

  useEffect(() => {
    if (calisti.current) return;
    calisti.current = true;

    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setDurum("error");
      setHata(t("confirm-email:errors.missingToken"));
      return;
    }

    const dogrula = async () => {
      const { status, data } = await verifyEmail({ token });

      if (status === HTTP_CODES_ENUM.OK) {
        // Kullanici bu tarayicida giris yapmissa adres/dogrulama durumu
        // degisti; context'i guncelliyoruz. Giris yapmamis olabilir de --
        // baglantiya baska bir cihazdan tiklanmis olabilir.
        if (oturumIsaretiVar()) {
          setUser(data.data);
        }
        setDurum("success");
        return;
      }

      setDurum("error");
      setHata(getErrorMessage(data, t("confirm-email:errors.invalidToken")));
    };

    dogrula();
  }, [verifyEmail, setUser, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-surface/50 backdrop-blur-sm border border-line rounded-2xl p-8 text-center">
        {durum === "loading" && (
          <>
            <Loader2 className="h-10 w-10 text-accent mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold text-ink">
              {t("confirm-email:loading.title")}
            </h1>
          </>
        )}

        {durum === "success" && (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-ink mb-2">
              {t("confirm-email:success.title")}
            </h1>
            <p className="text-ink-soft mb-6">
              {t("confirm-email:success.message")}
            </p>
            <Link
              href={`/${language}/dashboard`}
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t("confirm-email:success.action")}
            </Link>
          </>
        )}

        {durum === "error" && (
          <>
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-ink mb-2">
              {t("confirm-email:error.title")}
            </h1>
            <p className="text-ink-soft mb-6">{hata}</p>
            <p className="text-ink-muted text-sm mb-6">
              {t("confirm-email:error.hint")}
            </p>
            <Link
              href={`/${language}/settings`}
              className="inline-block bg-field hover:bg-field-strong text-ink px-4 py-2 rounded-lg transition-colors"
            >
              {t("confirm-email:error.action")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default ConfirmEmail;
