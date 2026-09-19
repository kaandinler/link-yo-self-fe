// Grafiklerin renk paleti.
//
// NEDEN DEGISKEN: Renkler daha once dosyalara sabit yazilmisti ve yalnizca
// koyu yuzeye karsi dogrulanmisti. Acik temada ayni mavi (#3987e5) beyaz
// zeminde 1.6:1'e dusuyor -- cizgi neredeyse gorunmez oluyor. Degerler
// globals.css'te iki tema icin ayri tanimli, burada yalnizca isimleri var.
//
// Deger dogrudan CSS'ten okundugu icin tema degisiminde grafigin yeniden
// render edilmesi gerekmiyor; tarayici degiskeni kendisi cozuyor.
//
// KONTRAST: Her iki temada da iki seri rengi kendi cizim yuzeyine karsi
// >= 3:1 (WCAG 1.4.11) ve birbirinden renk korlugunde ayirt edilebilir.
// Seriler ayrica gosterge ve uc etiketiyle isaretleniyor; kimlik hicbir
// zaman yalnizca renge birakilmiyor.
export const CHART = {
  /** Tiklama serisi. Sayfa boyunca "tiklama" bu renk. */
  clicks: "var(--chart-clicks)",
  /** Profil goruntulenme serisi. */
  views: "var(--chart-views)",
  /** Gercek bir kaynak olmayan satirlar ("Direct", "Other"). */
  muted: "var(--chart-muted)",
  /** Cizim alaninin arkasindaki duz zemin. */
  surface: "var(--chart-surface)",
  /** Izgara cizgileri ve cubuk yataklari. */
  grid: "var(--chart-grid)",
  /** Fareyle takip eden dikey cizgi. */
  crosshair: "var(--chart-crosshair)",
  /** Eksen yazilari ve uc etiketleri. */
  axis: "var(--chart-axis)",
} as const;
