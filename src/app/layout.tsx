import ResponsiveAppBar from "@/components/app-bar";
import AuthProvider from "@/services/auth/auth-provider";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import CssBaseline from "@mui/material/CssBaseline";
import { dir } from "i18next";
import "@/services/i18n/config";
import { fallbackLanguage } from "@/services/i18n/config";
import SnackbarProvider from "@/components/snackbar-provider";
import StoreLanguageProvider from "@/services/i18n/store-language-provider";
import ThemeProvider from "@/components/theme/theme-provider";
import LeavePageProvider from "@/services/leave-page/leave-page-provider";
import QueryClientProvider from "@/services/react-query/query-client-provider";
import queryClient from "@/services/react-query/query-client";
import ReactQueryDevtools from "@/services/react-query/react-query-devtools";
import ConfirmDialogProvider from "@/components/confirm-dialog/confirm-dialog-provider";
import InitColorSchemeScript from "@/components/theme/init-color-scheme-script";

/**
 * Uygulamanin kok layout'u.
 *
 * Daha once kok layout src/app/[language]/layout.tsx idi. Kok layout'un
 * dinamik bir segmentin altinda olmasi notFound() davranisini bozuyordu:
 * Next segmentteki not-found.tsx'i kullanamiyor, kendi yerlesik 404 ekranini
 * HTTP 200 ile donuyordu (soft-404). Artik kok burada oldugu icin
 * src/app/not-found.tsx gecerli bir not-found sinirina sahip ve dogru 404
 * durum kodu donuyor.
 *
 * DIKKAT - <html lang>: kok layout params almadigi icin dil buradan
 * okunamiyor. Su an i18n yapilandirmasinda tek dil tanimli (languages =
 * ["en"]) ve fallbackLanguage her zaman dogru sonucu veriyor. Ikinci bir dil
 * eklendiginde bu deger middleware'in yazacagi bir header'dan (orn.
 * x-language) okunmali; bunun bedeli tum sayfalarin statik uretimden cikip
 * dinamik render'a gecmesidir.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={fallbackLanguage}
      dir={dir(fallbackLanguage)}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <InitColorSchemeScript />
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <ThemeProvider>
            <CssBaseline />

            <StoreLanguageProvider>
              <ConfirmDialogProvider>
                <AuthProvider>
                  <LeavePageProvider>
                    <ResponsiveAppBar />
                    {children}
                    <SnackbarProvider />
                  </LeavePageProvider>
                </AuthProvider>
              </ConfirmDialogProvider>
            </StoreLanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
