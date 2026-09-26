"use client";

// Acik/koyu tema dugmesi.
//
// MUI'nin useColorScheme'ini kullaniyor cunku semayi <html>'in class'ina
// yazan ve secimi hatirlayan mekanizma o. Tailwind ayni sinifi okuyor
// (tailwind.config.js -> darkMode: "class"), dolayisiyla bu tek dugme hem
// MUI ile yazilmis sayfalari hem de Tailwind sayfalarini birlikte ceviriyor.
//
// Gorunum MUI IconButton degil, cevresindeki Tailwind dugmeleriyle ayni:
// dugme uygulama cubugunda duruyor ve oradaki "Preview" dugmesiyle ayni
// dilde olmasi gerekiyor.

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useColorScheme } from "@mui/material/styles";

type Props = {
  /** Mobil menude tam genislikte, metinli bir satir olarak cizilsin mi? */
  genis?: boolean;
};

const ThemeSwitchButton = ({ genis = false }: Props) => {
  const { mode, setMode } = useColorScheme();

  // Sunucuda hangi temanin secili oldugu bilinmiyor (secim tarayicida
  // saklaniyor), bu yuzden ilk render'da ikon cizilmiyor. Aksi halde
  // sunucunun cizdigi ikon ile istemcininki ayrisip hidrasyon uyarisi
  // veriyor ve ikon bir an yanlis gorunuyor.
  const [binildi, setBinildi] = useState(false);
  useEffect(() => setBinildi(true), []);

  const koyu = mode === "dark";
  const hedef = koyu ? "light" : "dark";
  const etiket = koyu ? "Switch to light theme" : "Switch to dark theme";

  const ortakSinif =
    "flex items-center gap-2 rounded-lg border border-line-strong " +
    "bg-surface-raised text-ink transition-colors hover:bg-field " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400";

  return (
    <button
      type="button"
      data-testid="theme-switch"
      aria-label={etiket}
      title={etiket}
      onClick={() => setMode(hedef)}
      className={
        genis
          ? `${ortakSinif} w-full justify-center px-4 py-2`
          : `${ortakSinif} justify-center p-2`
      }
    >
      {/* binildi false iken ikonun yerini bos birakiyoruz: dugmenin boyu
          sabit kaliyor, sayfa oynamiyor. */}
      <span className="h-5 w-5">
        {binildi ? (
          koyu ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )
        ) : null}
      </span>
      {genis ? <span>{koyu ? "Light theme" : "Dark theme"}</span> : null}
    </button>
  );
};

export default ThemeSwitchButton;
