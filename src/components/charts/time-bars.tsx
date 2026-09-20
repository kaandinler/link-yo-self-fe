"use client";

// Tiklamalarin haftaguno ve saate dagilimi: iki ayri cubuk dizisi.
//
// NEDEN ISI HARITASI DEGIL: Uc iki *kenar dagilimi* donduruyor (7 gun,
// 24 saat), 7x24'luk bir matris degil. Isi haritasi cizmek, elimizde
// olmayan "sali saat 21" gibi bir kesisimi varmis gibi gostermek olurdu.
// Iki dagilim ayri ayri dogru, birlikte carpilamaz.
//
// TEK OLCU, TEK RENK: Cizilen sey yalnizca tiklama sayisi. Renk bir
// kategori tasimadigi icin butun cubuklar ayni; zirve, rengin tonuyla
// degil yazidaki cumleyle isaretleniyor -- renk tek basina hicbir zaman
// tek kanal olmamali.
//
// ERISILEBILIRLIK: Her cubugun degeri, ustundeki metinde ve acilir veri
// tablosunda yaziyor. Cubuklar aria-hidden; ekran okuyucu tabloyu
// okuyor.

import React from "react";
import { CHART } from "./palette";
import { useTranslation } from "@/services/i18n/client";

/** 0 = Pazartesi; sunucu datetime.weekday() ile ayni siralamayi kullaniyor. */
/**
 * Gun adlari ceviriden geliyor (analytics:weekdays.N).
 *
 * Burada sabit dizge tutulsaydi grafigin eksenleri ve tablosu hicbir
 * zaman cevrilemezdi. Indeks backend'in weekday degeriyle ayni: 0 =
 * Pazartesi.
 */
export const GUN_SAYISI = 7;

/** "14" -> "2 PM". Eksende 24 etiketin hepsi sigmadigi icin kisa tutuluyor. */
export function saatEtiketi(saat: number): string {
  const oglen = saat % 12 === 0 ? 12 : saat % 12;
  return `${oglen}${saat < 12 ? "am" : "pm"}`;
}

type Kutu = {
  /** Eksende gorunen kisa ad. */
  etiket: string;
  /** Tabloda ve ipucunda gorunen tam ad. */
  tamAd: string;
  clicks: number;
};

/**
 * Cubuk dizisi.
 *
 * Yukseklikler en buyuk kutuya gore olcekleniyor: burada soru "toplamin
 * yuzde kaci" degil, "hangi kutu digerlerinden yuksek". Kaynak
 * dagilimindan (ReferrerBars) farkli olmasinin sebebi bu -- orada paylar
 * toplanip 100 ediyor, burada kiyas yapiliyor.
 */
function Cubuklar({
  kutular,
  testId,
  etiketAtla = 1,
  degerleriYaz = false,
}: {
  kutular: Kutu[];
  testId: string;
  /** Kacta bir eksen etiketi yazilacak; 24 saatin hepsi sigmiyor. */
  etiketAtla?: number;
  /** Sayilar cubuklarin ustunde yazilsin mi? Yalnizca az kutu varken. */
  degerleriYaz?: boolean;
}) {
  const tavan = Math.max(1, ...kutular.map((kutu) => kutu.clicks));

  return (
    <div data-testid={testId} className="flex items-end gap-1">
      {kutular.map((kutu, indeks) => (
        <div key={kutu.tamAd} className="flex min-w-0 flex-1 flex-col gap-1">
          {degerleriYaz && (
            <span className="text-center text-xs tabular-nums text-ink-soft">
              {kutu.clicks}
            </span>
          )}
          <div
            aria-hidden="true"
            title={`${kutu.tamAd}: ${kutu.clicks}`}
            className="flex h-24 items-end"
          >
            <div
              className="w-full rounded-t"
              style={{
                // Sifir gercekten sifir gorunmeli: bos bir kutuya cubuk
                // cizmek "az da olsa var" demek olurdu.
                height:
                  kutu.clicks === 0 ? 0 : `${(kutu.clicks / tavan) * 100}%`,
                minHeight: kutu.clicks === 0 ? 0 : 2,
                backgroundColor: CHART.clicks,
              }}
            />
          </div>
          {/* truncate degil: telefonda bir sutun ~16 piksel ve "12am"
              "1." diye kirpiliyordu. min-w-0 sayesinde sutun genislemiyor,
              yazi tasiyor -- yalnizca her etiketAtla'da bir etiket
              cizildigi icin komsusuna girmiyor. */}
          <span className="whitespace-nowrap text-center text-[10px] text-ink-muted">
            {indeks % etiketAtla === 0 ? kutu.etiket : " "}
          </span>
        </div>
      ))}
    </div>
  );
}

function Tablo({ kutular, testId }: { kutular: Kutu[]; testId: string }) {
  const { t } = useTranslation("analytics");
  return (
    <table data-testid={testId} className="min-w-full text-sm">
      <thead>
        <tr className="text-left text-ink-muted">
          <th className="py-2 pr-4 font-medium">{t("chart.when")}</th>
          <th className="py-2 pr-4 text-right font-medium">
            {t("chart.clicks")}
          </th>
        </tr>
      </thead>
      <tbody className="text-ink-soft">
        {kutular.map((kutu) => (
          <tr key={kutu.tamAd} className="border-t border-line">
            <td className="whitespace-nowrap py-2 pr-4">{kutu.tamAd}</td>
            <td className="py-2 pr-4 text-right tabular-nums">{kutu.clicks}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function WeekdayBars({
  buckets,
}: {
  buckets: { weekday: number; clicks: number }[];
}) {
  const { t } = useTranslation("analytics");

  // Eksende kisa ad, tabloda tam ad. Kisaltma ilk uc harf: Ingilizcede
  // "Mon", Turkcede "Paz" gibi. Bazi dillerde bu yeterli olmayabilir;
  // o zaman ayri bir kisa-ad anahtari gerekir.
  const gunAdi = (weekday: number) =>
    weekday >= 0 && weekday < GUN_SAYISI
      ? t(`weekdays.${weekday}`)
      : String(weekday);

  const kutular: Kutu[] = buckets.map((kutu) => ({
    etiket: gunAdi(kutu.weekday).slice(0, 3),
    tamAd: gunAdi(kutu.weekday),
    clicks: kutu.clicks,
  }));

  return (
    <div className="space-y-3">
      {/* Yedi kutu: sayilar cubuklarin ustune sigiyor, tabloyu acmaya
          gerek kalmiyor. */}
      <Cubuklar kutular={kutular} testId="weekday-bars" degerleriYaz />
      <details>
        <summary
          data-testid="weekday-table-toggle"
          className="cursor-pointer text-sm text-ink-muted hover:text-ink-soft"
        >
          {t("showDataTable")}
        </summary>
        <div className="mt-3 overflow-x-auto">
          <Tablo kutular={kutular} testId="weekday-table" />
        </div>
      </details>
    </div>
  );
}

export function HourBars({
  buckets,
}: {
  buckets: { hour: number; clicks: number }[];
}) {
  const { t } = useTranslation("analytics");

  const kutular: Kutu[] = buckets.map((kutu) => ({
    etiket: saatEtiketi(kutu.hour),
    tamAd: saatEtiketi(kutu.hour),
    clicks: kutu.clicks,
  }));

  return (
    <div className="space-y-3">
      {/* 24 etiketin hepsi telefonda sigmiyor; alti saatte bir yaziliyor.
          Sayilar da yazilmiyor: 24 sayi yan yana okunmuyor, ust uste
          biniyor. Degerler acilir tabloda. */}
      <Cubuklar kutular={kutular} testId="hour-bars" etiketAtla={6} />
      <details>
        <summary
          data-testid="hour-table-toggle"
          className="cursor-pointer text-sm text-ink-muted hover:text-ink-soft"
        >
          {t("showDataTable")}
        </summary>
        <div className="mt-3 overflow-x-auto">
          <Tablo kutular={kutular} testId="hour-table" />
        </div>
      </details>
    </div>
  );
}
