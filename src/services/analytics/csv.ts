// src/services/analytics/csv.ts
//
// Analitik verisini tarayicida CSV olarak indirir. Backend'e istek atmaz;
// yalnizca ekranda zaten yuklu olan veriyi metin olarak uretir.
//
// RFC4180: virgul, çift tırnak veya satır sonu içeren hücreler çift tırnakla
// sarılır, içteki çift tırnaklar ikiye katlanır. Excel uyumu için dosya
// UTF-8 BOM ile başlar.
//
// Formül enjeksiyonu: hücre =,+,-,@ ile başlıyorsa Excel/LibreOffice onu
// formül sanıp çalıştırır. Link başlıkları kullanıcı girdisi olduğu için
// bu karakterle başlayan hücrelere ' öneki eklenir (Excel bunu metin olarak
// gösterir, öneki gizler).

/** Bir hücreyi RFC4180'e göre kaçışlar ve formül enjeksiyonuna karşı etkisizleştirir. */
export function csvHucre(
  deger: string | number | boolean | null | undefined
): string {
  let metin = deger === null || deger === undefined ? "" : String(deger);
  if (/^[=+\-@]/.test(metin)) {
    metin = `'${metin}`;
  }
  if (/[",\r\n]/.test(metin)) {
    metin = `"${metin.replace(/"/g, '""')}"`;
  }
  return metin;
}

/** Satırları CSV metnine çevirir (BOM hariç). */
export function csvSatirlari(
  satirlar: (string | number | boolean | null | undefined)[][]
): string {
  return satirlar.map((satir) => satir.map(csvHucre).join(",")).join("\r\n");
}

/**
 * Metni UTF-8 BOM ile başlayan bir Blob'a sarar ve tarayıcıda indirir.
 * Geçici <a download> öğesi hemen kaldırılır ve object URL serbest bırakılır.
 */
export function csvIndir(dosyaAdi: string, metin: string): void {
  const blob = new Blob(["\uFEFF" + metin], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
