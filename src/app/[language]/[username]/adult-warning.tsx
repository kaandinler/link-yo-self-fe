"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/services/i18n/client";

/**
 * Profil sahibinin actigi +18 ara ekrani.
 *
 * NEDEN SUNUCUDA DEGIL DE ISTEMCIDE KARAR: "bu ziyaretci daha once
 * onayladi mi" bilgisi ziyaretciye ait ve sayfa herkes icin ayni sekilde
 * onbellege aliniyor (bkz. public-profile.ts, PROFIL_ONBELLEK_SANIYE).
 * Sunucuda karar verilseydi bir ziyaretcinin onayi onbellege girer ve
 * sonraki ziyaretciler uyariyi hic gormezdi.
 *
 * NEDEN KAPALI BASLIYOR: ilk durum "uyari gorunur". Sunucudan gelen HTML
 * de boyle basiyor, yani React yuklenene kadar gecen surede icerik aciga
 * cikmiyor. Daha once onaylamis biri icin useEffect ekrani kaldiriyor --
 * bedeli kisa bir yanip sonme, karsiligi iceriğin hic sizmamasi. Tersi
 * (acik baslayip sonra kapatmak) her ziyaretciye icerigi bir an
 * gosterirdi.
 *
 * SINIR: bu bir uyari, erisim denetimi degil. Icerik DOM'da duruyor,
 * yalnizca ustu ortuluyor. Gercekten engellemek sunucu tarafinda
 * ziyaretci basina karar vermeyi gerektirir ve sayfanin onbelleklenmesini
 * bozar.
 */

/** Onay ziyaretcinin tarayicisinda, profil basina saklaniyor. */
function anahtar(username: string): string {
  return `adult-ok:${username.toLowerCase()}`;
}

function onaylandiMi(username: string): boolean {
  try {
    return localStorage.getItem(anahtar(username)) === "1";
  } catch {
    // Gizli sekmede ya da site verisi engellenmisse erisim istisna
    // firlatiyor. Okunamiyorsa "onaylanmamis" sayiliyor: uyari fazladan
    // bir kez cikar, icerik sizmaz.
    return false;
  }
}

function onayiSakla(username: string): void {
  try {
    localStorage.setItem(anahtar(username), "1");
  } catch {
    // Saklanamazsa uyari her ziyarette cikar; calismaya engel degil.
  }
}

type Props = {
  username: string;
  /** Profil sahibi uyariyi acmadiysa bu bilesen hicbir sey ciziyor. */
  enabled: boolean;
  children: React.ReactNode;
};

const AdultWarning: React.FC<Props> = ({ username, enabled, children }) => {
  const { t } = useTranslation("public-profile");

  // Sunucu ve ilk istemci render'i ayni: enabled iken kapali.
  const [gecildi, setGecildi] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setGecildi(true);
      return;
    }

    if (onaylandiMi(username)) setGecildi(true);
  }, [enabled, username]);

  const onayla = () => {
    onayiSakla(username);
    setGecildi(true);
  };

  const geriDon = () => {
    // Ziyaretci baska bir sayfadan geldiyse oraya donsun; dogrudan bu
    // adrese girdiyse gidilecek bir "onceki" yok, ana sayfaya gidiliyor.
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "/";
  };

  if (gecildi) return <>{children}</>;

  return (
    <>
      {/*
        inert: ortulen icerik yalnizca gorunmez degil, ulasilamaz da
        olmali. Olmasaydi sekme tusu ve ekran okuyucu perdenin ardindaki
        baglantilara ulasirdi -- uyari gozle gorunur ama islevsiz olurdu.
        React 19 bu ozniteligi dogrudan destekliyor.
      */}
      <div inert aria-hidden="true">
        {children}
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adult-warning-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
      >
        <div className="w-full max-w-sm rounded-2xl bg-neutral-900 p-6 text-center text-white shadow-2xl">
          <h2 id="adult-warning-title" className="text-xl font-bold">
            {t("adultWarning.title")}
          </h2>
          <p className="mt-3 text-sm text-neutral-300">
            {t("adultWarning.body")}
          </p>

          <div className="mt-6 flex flex-col gap-2">
            {/*
              min-h-[44px]: parmakla isabet ettirilebilen en kucuk hedef
              (WCAG 2.5.5). Keyfi deger, min-h-11 degil -- sayisal min-h
              olcegi Tailwind 3.4'te geldi, bu proje 3.3'te ve "min-h-11"
              hic CSS uretmiyor.
            */}
            <button
              type="button"
              onClick={onayla}
              /*
                data-testid: E2E testi bu dugmeye tiklamadan once React'in
                hydrate oldugunu beklemek zorunda. Sunucudan gelen HTML'de
                dugme GORUNUYOR ama onClick bagli degil; o aralikta atilan
                tiklama sessizce kayboluyor. Olculdu: perde gorunur
                oldugu anda dugme 5/5 kosuda ham HTML, hydrate 115-163 ms
                sonra geliyor. Rol/metin seciciyle hydrate beklenemiyor,
                bu yuzden sabit bir kanca var (bkz. helpers/ui.ts,
                clickWhenReady).
              */
              data-testid="adult-warning-confirm"
              className="min-h-[44px] w-full rounded-lg bg-white px-4 font-semibold text-neutral-900 transition-opacity hover:opacity-90"
            >
              {t("adultWarning.confirm")}
            </button>
            <button
              type="button"
              onClick={geriDon}
              className="min-h-[44px] w-full rounded-lg border border-neutral-600 px-4 font-medium text-neutral-200 transition-colors hover:bg-neutral-800"
            >
              {t("adultWarning.leave")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdultWarning;
