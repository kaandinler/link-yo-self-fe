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
        components: {
          // 44 piksel: parmakla isabet ettirilebilen en kucuk hedef
          // (WCAG 2.5.5). MUI'nin varsayilanlari bunun altinda kaliyor;
          // telefonda olculdu: profil duzenlemedeki Save ve Cancel 37,
          // sifre gorunurluk dugmesi 40 pikseldi.
          //
          // Tema seviyesinde: bu dugmeler dokuz ayri formda ve her
          // birine tek tek yazmak, yeni bir form eklendiginde sessizce
          // atlanacak bir kural demekti.
          MuiButton: { styleOverrides: { root: { minHeight: 44 } } },
          MuiIconButton: {
            styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
          },
        },
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
