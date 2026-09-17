"use client";

// Gunluk tiklama ve profil goruntulenmesi grafigi.
//
// Kutuphane yok: tek bir SVG yetiyor ve paket agirligi eklemeye degmez.
//
// RENKLER: charts/palette.ts uzerinden, tema degiskenleriyle. Iki seri de
// kendi cizim yuzeyine karsi >= 3:1 ve renk korlugunde ayirt edilebilir --
// koyu ve acik tema icin ayri ayri secildi. Seriler ayrica hem gosterge
// (legend) hem de ucundaki etiketle isaretleniyor; kimlik hicbir zaman
// yalnizca renge birakilmiyor.
//
// TEK EKSEN: iki seri de "olay adedi" oldugu icin ayni olcekte cizilebiliyor.
// Ikinci bir y ekseni asla eklenmemeli; iki olcegin hizasi keyfi olur ve
// veride olmayan bir iliski uydurur.

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyticsDayPoint } from "@/services/api/services/analytics";
import { CHART } from "./palette";

const SERIES = [
  { key: "clicks", label: "Link clicks", color: CHART.clicks },
  { key: "profile_views", label: "Profile views", color: CHART.views },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

/** Cizim alaninin arkasina konan duz zemin. */
const PLOT_SURFACE = CHART.surface;
const GRID = CHART.grid;
const AXIS_TEXT = CHART.axis;

// Sagdaki bosluk uc etiketleri icin: etiket cizim alaninin icine konursa
// kendi cizgisinin uzerine biniyor.
const PADDING = { top: 16, right: 96, bottom: 28, left: 44 };
const HEIGHT = 260;
/** Ucundaki iki etiket bundan yakinsa ikisi de gizleniyor (ust uste binmesin). */
const LABEL_MIN_GAP = 16;

/** Eksende yuvarlak sayilar cikaran adim: 1, 2, 5, 10, 20, 50 ... */
function eksenAdimi(enBuyuk: number, hedefCizgi: number): number {
  const ham = enBuyuk / hedefCizgi;
  const buyukluk = Math.pow(10, Math.floor(Math.log10(Math.max(ham, 1))));
  for (const carpan of [1, 2, 5, 10]) {
    if (buyukluk * carpan >= ham) return buyukluk * carpan;
  }
  return buyukluk * 10;
}

function gunEtiketi(iso: string): string {
  // ISO tarihi yerel saate kaymasin diye parcalayarak okuyoruz.
  const [yil, ay, gun] = iso.split("-").map(Number);
  return new Date(Date.UTC(yil, ay - 1, gun)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Kapsayicinin genisligini olcer; cizgi kalinligi ve yazi boyu sabit kalsin. */
function useGenislik(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [genislik, setGenislik] = useState(720);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const olc = () => setGenislik(el.clientWidth || 720);
    olc();

    // ResizeObserver test ortamlarinda olmayabiliyor; o durumda ilk olcum kaliyor.
    if (typeof ResizeObserver === "undefined") return;
    const gozlemci = new ResizeObserver(olc);
    gozlemci.observe(el);
    return () => gozlemci.disconnect();
  }, []);

  return [ref, genislik];
}

type Props = {
  points: AnalyticsDayPoint[];
  /** Veri tazelenirken onceki render soluyor; iskelet gosterip zipla-yapmiyoruz. */
  soluk?: boolean;
};

export default function ActivityChart({ points, soluk = false }: Props) {
  const [kapsayici, genislik] = useGenislik();
  const [seciliIndeks, setSeciliIndeks] = useState<number | null>(null);

  const cizimGenisligi = Math.max(genislik - PADDING.left - PADDING.right, 120);
  const cizimYuksekligi = HEIGHT - PADDING.top - PADDING.bottom;

  const enBuyukDeger = Math.max(
    1,
    ...points.map((nokta) => Math.max(nokta.clicks, nokta.profile_views))
  );
  const adim = eksenAdimi(enBuyukDeger, 4);
  const tavan = Math.ceil(enBuyukDeger / adim) * adim;

  const x = useCallback(
    (indeks: number) =>
      PADDING.left +
      (points.length <= 1
        ? cizimGenisligi / 2
        : (indeks / (points.length - 1)) * cizimGenisligi),
    [cizimGenisligi, points.length]
  );
  const y = useCallback(
    (deger: number) =>
      PADDING.top + cizimYuksekligi - (deger / tavan) * cizimYuksekligi,
    [cizimYuksekligi, tavan]
  );

  const cizgiler: number[] = [];
  for (let deger = 0; deger <= tavan; deger += adim) cizgiler.push(deger);

  const yolOlustur = (anahtar: SeriesKey) =>
    points
      .map(
        (nokta, indeks) =>
          `${indeks === 0 ? "M" : "L"} ${x(indeks)} ${y(nokta[anahtar])}`
      )
      .join(" ");

  // Ucundaki etiketler birbirine girerse ikisini de gizleyip gostergeye
  // biraikiyoruz; dikey olarak itmek etiketi kendi cizgisinden kopariyor.
  const sonNokta = points[points.length - 1];
  const etiketleriGoster =
    !!sonNokta &&
    Math.abs(y(sonNokta.clicks) - y(sonNokta.profile_views)) >= LABEL_MIN_GAP;

  const isaretciyiGuncelle = useCallback(
    (olayX: number, kutu: DOMRect) => {
      if (points.length === 0) return;
      const yerel = olayX - kutu.left - PADDING.left;
      const oran = cizimGenisligi > 0 ? yerel / cizimGenisligi : 0;
      const indeks = Math.round(oran * (points.length - 1));
      setSeciliIndeks(Math.min(Math.max(indeks, 0), points.length - 1));
    },
    [cizimGenisligi, points.length]
  );

  const klavye = (olay: React.KeyboardEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const simdiki = seciliIndeks ?? points.length - 1;

    if (olay.key === "ArrowLeft") {
      olay.preventDefault();
      setSeciliIndeks(Math.max(simdiki - 1, 0));
    } else if (olay.key === "ArrowRight") {
      olay.preventDefault();
      setSeciliIndeks(Math.min(simdiki + 1, points.length - 1));
    } else if (olay.key === "Escape") {
      setSeciliIndeks(null);
    }
  };

  const secili = seciliIndeks === null ? null : points[seciliIndeks];

  // Uzun araliklarda her gunun etiketi sigmiyor; belirli araliklarla
  // gosteriyoruz. Ilk ve son gun her zaman var.
  const etiketAtlama = Math.max(1, Math.ceil(points.length / 7));

  return (
    <div
      ref={kapsayici}
      className={`relative transition-opacity ${soluk ? "opacity-50" : "opacity-100"}`}
    >
      <svg
        width={genislik}
        height={HEIGHT}
        role="img"
        tabIndex={0}
        aria-label="Daily link clicks and profile views. Use arrow keys to read each day."
        className="outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-xl"
        onPointerMove={(olay) =>
          isaretciyiGuncelle(
            olay.clientX,
            olay.currentTarget.getBoundingClientRect()
          )
        }
        onPointerLeave={() => setSeciliIndeks(null)}
        onKeyDown={klavye}
        onBlur={() => setSeciliIndeks(null)}
      >
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={cizimGenisligi}
          height={cizimYuksekligi}
          rx={8}
          fill={PLOT_SURFACE}
        />

        {/* Kilavuz cizgileri: sac teli kalinliginda, duz, geri planda. */}
        {cizgiler.map((deger) => (
          <g key={deger}>
            <line
              x1={PADDING.left}
              x2={PADDING.left + cizimGenisligi}
              y1={y(deger)}
              y2={y(deger)}
              stroke={GRID}
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={y(deger) + 4}
              textAnchor="end"
              fontSize={11}
              fill={AXIS_TEXT}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {deger.toLocaleString()}
            </text>
          </g>
        ))}

        {points.map((nokta, indeks) =>
          indeks % etiketAtlama === 0 || indeks === points.length - 1 ? (
            <text
              key={nokta.date}
              x={x(indeks)}
              y={HEIGHT - 8}
              textAnchor={
                indeks === 0
                  ? "start"
                  : indeks === points.length - 1
                    ? "end"
                    : "middle"
              }
              fontSize={11}
              fill={AXIS_TEXT}
            >
              {gunEtiketi(nokta.date)}
            </text>
          ) : null
        )}

        {/* Isaretci once ciziliyor ki cizgilerin ustune binmesin. */}
        {seciliIndeks !== null && (
          <line
            x1={x(seciliIndeks)}
            x2={x(seciliIndeks)}
            y1={PADDING.top}
            y2={PADDING.top + cizimYuksekligi}
            stroke={CHART.crosshair}
            strokeWidth={1}
          />
        )}

        {SERIES.map((seri) => (
          <path
            key={seri.key}
            d={yolOlustur(seri.key)}
            fill="none"
            stroke={seri.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Uc noktalar: 2px yuzey halkasiyla, birbirlerini kestiklerinde de okunur. */}
        {sonNokta &&
          SERIES.map((seri) => (
            <circle
              key={seri.key}
              cx={x(points.length - 1)}
              cy={y(sonNokta[seri.key])}
              r={4}
              fill={seri.color}
              stroke={PLOT_SURFACE}
              strokeWidth={2}
            />
          ))}

        {/* Secili gunun noktalari */}
        {secili !== null &&
          seciliIndeks !== null &&
          SERIES.map((seri) => (
            <circle
              key={seri.key}
              cx={x(seciliIndeks)}
              cy={y(secili[seri.key])}
              r={4}
              fill={seri.color}
              stroke={PLOT_SURFACE}
              strokeWidth={2}
            />
          ))}

        {/* Dogrudan etiketler: gosterge ile birlikte kimligi renkten
            bagimsiz hale getiriyor. Yazi seri rengini giymiyor.
            Cizim alaninin sagina konuyorlar; icine konsalar kendi
            cizgilerinin uzerine binerlerdi. */}
        {etiketleriGoster &&
          sonNokta &&
          SERIES.map((seri) => (
            <text
              key={seri.key}
              x={x(points.length - 1) + 10}
              y={y(sonNokta[seri.key]) + 4}
              textAnchor="start"
              fontSize={11}
              fill={CHART.axis}
            >
              {seri.label}
            </text>
          ))}
      </svg>

      {/* Okuma katmani: fare ve klavye ayni bilgiyi veriyor. */}
      <div aria-live="polite" className="sr-only">
        {secili
          ? `${gunEtiketi(secili.date)}: ${secili.clicks} clicks, ${secili.profile_views} profile views`
          : ""}
      </div>

      {secili && seciliIndeks !== null && (
        <div
          data-testid="activity-tooltip"
          className="pointer-events-none absolute top-2 rounded-lg border border-line-strong bg-overlay/95 px-3 py-2 shadow-lg"
          style={{
            left: Math.min(Math.max(x(seciliIndeks) - 70, 0), genislik - 150),
            width: 150,
          }}
        >
          <p className="text-xs text-ink-muted">{gunEtiketi(secili.date)}</p>
          {SERIES.map((seri) => (
            <p
              key={seri.key}
              className="mt-1 flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 text-xs text-ink-muted">
                <span
                  aria-hidden
                  className="inline-block h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: seri.color }}
                />
                {seri.label}
              </span>
              <span className="text-sm font-semibold text-ink">
                {secili[seri.key].toLocaleString()}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Iki seri var; gosterge her zaman duruyor. */
export function ActivityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {SERIES.map((seri) => (
        <span key={seri.key} className="flex items-center gap-2 text-sm">
          <span
            aria-hidden
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ backgroundColor: seri.color }}
          />
          <span className="text-ink-soft">{seri.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Grafigin verisi tabloyla da okunabiliyor; hover'a mahkum degil. */
export function ActivityTable({ points }: { points: AnalyticsDayPoint[] }) {
  return (
    <table data-testid="activity-table" className="w-full text-sm">
      <thead>
        <tr className="text-left text-ink-muted">
          <th className="py-2 font-medium">Day</th>
          <th className="py-2 font-medium text-right">Link clicks</th>
          <th className="py-2 font-medium text-right">Profile views</th>
        </tr>
      </thead>
      <tbody className="text-ink-soft">
        {points.map((nokta) => (
          <tr key={nokta.date} className="border-t border-line">
            <td className="py-2">{gunEtiketi(nokta.date)}</td>
            <td className="py-2 text-right tabular-nums">
              {nokta.clicks.toLocaleString()}
            </td>
            <td className="py-2 text-right tabular-nums">
              {nokta.profile_views.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
