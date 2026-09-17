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

  // colorSchemeSelector: "class" -> MUI secili semayi <html>'in class'ina
  // yaziyor. Tailwind de ayni sinifi okuyor (tailwind.config.js ->
  // darkMode: "class"), yani MUI sayfalari ile Tailwind sayfalari tek bir
  // kaynaktan besleniyor ve uygulama yarisi acik yarisi koyu kalmiyor.
  // Secimi uygulama cubugundaki ThemeSwitchButton degistiriyor.
  //
  // defaultMode="dark": "system" degil. Uygulamanin kimligi koyu ve
  // bugune kadar herkes koyu temayla kullaniyordu; varsayilani isletim
  // sistemine baglamak, hicbir sey secmemis kullanicilarin yarisinin
  // ekranini habersiz degistirirdi. Secim yapan kullanicinin tercihi
  // saklaniyor ve oturumlar arasinda korunuyor.
  return (
    <MuiThemeProvider theme={theme} defaultMode="dark">
      {props.children}
    </MuiThemeProvider>
  );
}

export default ThemeProvider;
