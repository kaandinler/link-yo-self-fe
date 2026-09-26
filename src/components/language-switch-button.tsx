"use client";

// Dil degistirme dugmesi.
//
// NEDEN ADRESI DEGISTIRIYOR, YALNIZCA CEREZI DEGIL: dil yolun ilk
// parcasinda (/en/..., /tr/...) ve sayfalar o parcaya gore sunucuda
// render ediliyor. Yalnizca cerezi yazsaydik, mevcut sayfa eski dilde
// kalir ve degisiklik ancak bir sonraki tam yuklemede gorunurdu.
//
// Cerez yine de yaziliyor: middleware kullaniciyi dilsiz bir adresten
// (/links gibi) yonlendirirken once cereze bakiyor, yani secim sonraki
// ziyaretlerde de korunuyor.

import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { languages } from "@/services/i18n/config";
import useLanguage from "@/services/i18n/use-language";
import useStoreLanguageActions from "@/services/i18n/use-store-language-actions";

/** Menude gorunen adlar; her dil kendi dilinde yaziliyor. */
const DIL_ADLARI: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
};

type Props = {
  /** Mobil menude tam genislikte, metinli bir satir olarak cizilsin mi? */
  genis?: boolean;
};

const LanguageSwitchButton = ({ genis = false }: Props) => {
  const simdikiDil = useLanguage();
  const yol = usePathname();
  const router = useRouter();
  const { setLanguage } = useStoreLanguageActions();

  // Iki dil var: dugme dogrudan digerine geciyor. Ucuncu bir dil
  // eklenirse burasi bir menuye donmeli.
  const digerDil = languages.find((dil) => dil !== simdikiDil) ?? languages[0];

  const gec = () => {
    setLanguage(digerDil);

    // Yolun ilk parcasi dil; onu degistirip ayni sayfada kaliyoruz.
    // Kullanici ayarlar sayfasindayken dili degistirince ana sayfaya
    // atilmamali.
    const parcalar = (yol ?? "/").split("/");
    parcalar[1] = digerDil;
    router.push(parcalar.join("/") || `/${digerDil}`);

    // Sunucuda render edilen metinler (metadata, sunucu bilesenleri)
    // yeni dille yeniden uretilmeli.
    router.refresh();
  };

  if (genis) {
    return (
      <button
        type="button"
        onClick={gec}
        data-testid="language-switch"
        aria-label={DIL_ADLARI[digerDil] ?? digerDil}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-ink-soft transition-colors hover:bg-field min-h-[44px]"
      >
        <Languages className="h-5 w-5" />
        <span>{DIL_ADLARI[digerDil] ?? digerDil}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={gec}
      data-testid="language-switch"
      // Etiket hedef dili soyluyor ("Türkçe"), mevcut dili degil: dugme
      // bir durum gostergesi degil, bir eylem.
      aria-label={DIL_ADLARI[digerDil] ?? digerDil}
      title={DIL_ADLARI[digerDil] ?? digerDil}
      className="flex items-center justify-center gap-1 rounded-lg text-ink-soft transition-colors hover:bg-field min-h-[44px] min-w-[44px] px-2"
    >
      <Languages className="h-5 w-5" />
      <span className="text-xs font-semibold uppercase">{digerDil}</span>
    </button>
  );
};

export default LanguageSwitchButton;
