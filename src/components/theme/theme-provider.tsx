"use client";

import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import { useMemo, PropsWithChildren } from "react";

function ThemeProvider(props: PropsWithChildren) {
  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: {
          colorSchemeSelector: "class",
        },
        colorSchemes: { light: true, dark: true },
      }),
    []
  );

  // defaultMode="dark": Uygulamanin govdesi koyu -- 14 sayfa Tailwind ile
  // koyu bir gradient ciziyor. MUI'nin varsayilani "system" ve isletim
  // sistemi acik temadaysa light'a dusuyordu; sonucta MUI ile yazilmis
  // sayfalar (profil duzenleme, admin paneli, sifre sifirlama, gizlilik
  // politikasi) bembeyaz aciliyordu.
  //
  // Acik tema silinmedi, colorSchemes'te duruyor. Gercek bir tema secici
  // eklenmeden once Tailwind sayfalarinin da temaya uymasi gerekir; aksi
  // halde uygulama yarisi acik yarisi koyu kalir. (Bugun secici yok:
  // ThemeSwitchButton hicbir yerde render edilmiyor.)
  return (
    <MuiThemeProvider theme={theme} defaultMode="dark">
      {props.children}
    </MuiThemeProvider>
  );
}

export default ThemeProvider;
