"use client";

// Link basina gunluk tiklama egrisi (sparkline) ve okunabilir tablo karsiligi.
//
// RENK: tek seri, bu yuzden gosterge kutusu yok -- satirin kendi basligi neyi
// cizdigini zaten soyluyor. Renk, ana grafikteki "Link clicks" serisiyle ayni
// mavi: sayfa boyunca mavi = tiklama demek, renk linkin sirasina gore
// degismiyor.
//
// Ipucu kutusu degerleri "acan" degil "kolaylastiran" bir katman: ayni
// sayilar ButunLinklerTablosu'ndan fareye hic dokunmadan okunabiliyor.

import React, { useCallback, useRef, useState } from "react";
import type { LinkTimeseries } from "@/services/api/services/analytics";
import { CHART } from "./palette";

/** Ana grafikteki tiklama serisiyle ayni renk. */
const CLICK_COLOR = CHART.clicks;
const PLOT_SURFACE = CHART.surface;

const WIDTH = 140;
const HEIGHT = 36;
const PADDING = 5;

export function gunEtiketi(iso: string): string {
  const [yil, ay, gun] = iso.split("-").map(Number);
  return new Date(Date.UTC(yil, ay - 1, gun)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type Props = {
  link: LinkTimeseries;
  /**
   * Butun egrilerin paylastigi tavan.
   *
   * ONEMLI: Her egri kendi en buyuk degerine gore olceklenirse, gunde bir kez
   * tiklanan link ile bes kez tiklanan link ayni sekilde gorunur ve liste
   * yanindaki sayiyla celisir. Tek bir tavan kullaniyoruz ki egrilerin
   * yuksekligi de siralamayi anlatsin.
   */
  tavan: number;
};

export default function LinkSparkline({ link, tavan }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [seciliIndeks, setSeciliIndeks] = useState<number | null>(null);

  const noktalar = link.points;

  const x = (indeks: number) =>
    PADDING +
    (noktalar.length <= 1
      ? (WIDTH - 2 * PADDING) / 2
      : (indeks / (noktalar.length - 1)) * (WIDTH - 2 * PADDING));

  const y = (deger: number) =>
    HEIGHT - PADDING - (deger / tavan) * (HEIGHT - 2 * PADDING);

  const yol = noktalar
    .map(
      (nokta, indeks) =>
        `${indeks === 0 ? "M" : "L"} ${x(indeks)} ${y(nokta.clicks)}`
    )
    .join(" ");

  const isaretle = useCallback(
    (olayX: number, kutu: DOMRect) => {
      if (noktalar.length === 0) return;
      const oran = (olayX - kutu.left - PADDING) / (WIDTH - 2 * PADDING);
      const indeks = Math.round(oran * (noktalar.length - 1));
      setSeciliIndeks(Math.min(Math.max(indeks, 0), noktalar.length - 1));
    },
    [noktalar.length]
  );

  const klavye = (olay: React.KeyboardEvent<SVGSVGElement>) => {
    if (noktalar.length === 0) return;
    const simdiki = seciliIndeks ?? noktalar.length - 1;

    if (olay.key === "ArrowLeft") {
      olay.preventDefault();
      setSeciliIndeks(Math.max(simdiki - 1, 0));
    } else if (olay.key === "ArrowRight") {
      olay.preventDefault();
      setSeciliIndeks(Math.min(simdiki + 1, noktalar.length - 1));
    } else if (olay.key === "Escape") {
      setSeciliIndeks(null);
    }
  };

  const secili = seciliIndeks === null ? null : noktalar[seciliIndeks];
  const sonNokta = noktalar[noktalar.length - 1];

  return (
    <div className="relative shrink-0">
      <svg
        ref={svgRef}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        tabIndex={0}
        aria-label={`${link.title}: ${link.total_clicks} clicks in this range. Use arrow keys to read each day.`}
        className="outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
        onPointerMove={(olay) =>
          isaretle(olay.clientX, olay.currentTarget.getBoundingClientRect())
        }
        onPointerLeave={() => setSeciliIndeks(null)}
        onKeyDown={klavye}
        onBlur={() => setSeciliIndeks(null)}
      >
        {seciliIndeks !== null && (
          <line
            x1={x(seciliIndeks)}
            x2={x(seciliIndeks)}
            y1={0}
            y2={HEIGHT}
            stroke={CHART.crosshair}
            strokeWidth={1}
          />
        )}

        <path
          d={yol}
          fill="none"
          stroke={CLICK_COLOR}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {sonNokta && (
          <circle
            cx={x(noktalar.length - 1)}
            cy={y(sonNokta.clicks)}
            r={4}
            fill={CLICK_COLOR}
            stroke={PLOT_SURFACE}
            strokeWidth={2}
          />
        )}

        {secili && seciliIndeks !== null && (
          <circle
            cx={x(seciliIndeks)}
            cy={y(secili.clicks)}
            r={4}
            fill={CLICK_COLOR}
            stroke={PLOT_SURFACE}
            strokeWidth={2}
          />
        )}
      </svg>

      {secili && (
        <div
          data-testid="sparkline-tooltip"
          className="pointer-events-none absolute -top-9 right-0 z-10 whitespace-nowrap rounded-lg border border-line-strong bg-overlay/95 px-2 py-1 text-xs shadow-lg"
        >
          <span className="text-ink-muted">{gunEtiketi(secili.date)}</span>{" "}
          <span className="font-semibold text-ink">{secili.clicks}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Butun linklerin gunluk sayilari, tek tabloda.
 *
 * Grafiklerin ustune gelmeden de okunabilmeleri icin var. Link sayisi
 * arttikca tablo genisliyor; kapsayici yatay kayiyor, sayfa degil.
 */
export function ButunLinklerTablosu({ links }: { links: LinkTimeseries[] }) {
  const gunler = links[0]?.points ?? [];

  return (
    <table data-testid="link-table" className="min-w-full text-sm">
      <thead>
        <tr className="text-left text-ink-muted">
          <th className="py-2 pr-4 font-medium">Day</th>
          {links.map((link) => (
            <th key={link.id} className="py-2 pr-4 font-medium text-right">
              {link.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-ink-soft">
        {gunler.map((gun, indeks) => (
          <tr key={gun.date} className="border-t border-line">
            <td className="py-2 pr-4 whitespace-nowrap">
              {gunEtiketi(gun.date)}
            </td>
            {links.map((link) => (
              <td
                key={link.id}
                className="py-2 pr-4 text-right tabular-nums whitespace-nowrap"
              >
                {link.points[indeks]?.clicks ?? 0}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Butun linklerin en yuksek gunluk degeri; egriler bunu paylasiyor. */
export function ortakTavan(links: LinkTimeseries[]): number {
  return Math.max(
    1,
    ...links.flatMap((link) => link.points.map((nokta) => nokta.clicks))
  );
}
