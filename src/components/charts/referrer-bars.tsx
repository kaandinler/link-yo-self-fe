// Tiklamalarin kaynak dagilimi: her satirda bir kaynak, yatay bir cubuk ve
// sayinin kendisi.
//
// NEDEN PAYA GORE OLCEKLENIYOR: Cubugun uzunlugu "toplamin yuzde kaci"
// demek, "en buyuk kaynagin yuzde kaci" degil. Ikincisi satirin yanindaki
// yuzdeyle celisirdi -- %90'lik bir kaynak ile %9'luk bir kaynagin cubuklari
// esit uzunlukta cizilirdi. Tek bir olcek kullaniyoruz ki cubuklarin boyu da
// yuzdeyi anlatsin.
//
// ERISILEBILIRLIK: Cubuklar aria-hidden. Sayinin ve yuzdenin kendisi zaten
// her satirda metin olarak yaziyor, yani ekran okuyucu icin ayri bir tablo
// gerekmiyor; cubuk yalnizca ayni bilgiyi goze tekrar ediyor.

import React from "react";
import type { ReferrerSource } from "@/services/api/services/analytics";

/** Ana grafikteki "Link clicks" serisiyle ayni mavi. */
const KAYNAK_RENGI = "#3987e5";

/**
 * "Direct" ve "Other" icin daha sonuk bir gri.
 *
 * Ikisi de gercek bir trafik kaynagi degil: biri kaynagin bilinmedigini,
 * digeri listeye sigmayanlarin toplamini anlatiyor. Renk tek basina bunu
 * tasimiyor -- satirin etiketi zaten acikca soyluyor; gri yalnizca goze
 * ayni ayrimi tekrar ediyor.
 */
const BILINMEYEN_RENGI = "#737a88";

function etiket(kaynak: ReferrerSource): string {
  if (kaynak.kind === "host" && kaynak.host) return kaynak.host;
  if (kaynak.kind === "other") return "Other sources";
  return "Direct or unknown";
}

function anahtar(kaynak: ReferrerSource): string {
  return kaynak.kind === "host" ? `host:${kaynak.host}` : kaynak.kind;
}

export default function ReferrerBars({
  sources,
  totalClicks,
}: {
  sources: ReferrerSource[];
  totalClicks: number;
}) {
  if (sources.length === 0) {
    return (
      <p className="text-gray-400">
        No clicks in this range, so there are no traffic sources to show yet.
      </p>
    );
  }

  return (
    <ul data-testid="referrer-list" className="space-y-3">
      {sources.map((kaynak) => {
        const pay = totalClicks > 0 ? kaynak.clicks / totalClicks : 0;
        const yuzde = Math.round(pay * 100);
        const bilinmeyen = kaynak.kind !== "host";

        return (
          <li key={anahtar(kaynak)}>
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={`truncate ${
                  bilinmeyen ? "text-gray-400" : "text-white font-medium"
                }`}
              >
                {etiket(kaynak)}
              </span>
              <span className="shrink-0 text-sm text-gray-300 tabular-nums">
                <span className="text-white font-semibold">
                  {kaynak.clicks.toLocaleString()}
                </span>{" "}
                · {yuzde}%
              </span>
            </div>

            <div
              aria-hidden="true"
              className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]"
            >
              <div
                className="h-full rounded-full"
                style={{
                  // Cok kucuk paylar tamamen kaybolmasin: bir tiklama da
                  // gorunur olmali, yoksa satir "sifir" gibi okunuyor.
                  width: `max(3px, ${(pay * 100).toFixed(2)}%)`,
                  backgroundColor: bilinmeyen ? BILINMEYEN_RENGI : KAYNAK_RENGI,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
