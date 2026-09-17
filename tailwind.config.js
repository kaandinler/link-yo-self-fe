/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  // MUI, secili semayi <html>'in class'ina yaziyor (colorSchemeSelector:
  // "class"). Tailwind ayni sinifi okusun ki iki taraf tek bir kaynaktan
  // beslensin; aksi halde MUI sayfalari ile Tailwind sayfalari farkli
  // temada kalirdi.
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans"', "sans-serif"],
      },
      // Anlamsal renkler. Degerleri globals.css'te; koyu tema :root'ta,
      // acik tema .light altinda.
      //
      // NEDEN SABIT TONLAR DEGIL: Onceden her sayfa text-gray-300,
      // bg-gray-800/50 gibi tonlari dogrudan yaziyordu ve tema
      // degistirilemiyordu. Her kullanima ayri bir `dark:` esi yazmak
      // 780 ayri karar demekti; anlamsal bir isim ise tek bir karari
      // tek yerde tutuyor.
      //
      // "rgb(... / <alpha-value>)" bicimi bilincli: sayfalarin zaten
      // kullandigi /50, /30, /95 gibi saydamlik ekleri calismaya devam
      // ediyor.
      colors: {
        // Metin
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",
        "ink-muted": "rgb(var(--ink-muted) / <alpha-value>)",
        "ink-faint": "rgb(var(--ink-faint) / <alpha-value>)",
        // Mor vurgu metni. Sabit purple-400 acik zeminde okunmuyordu.
        accent: "rgb(var(--accent) / <alpha-value>)",

        // Yuzeyler
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        field: "rgb(var(--field) / <alpha-value>)",
        "field-strong": "rgb(var(--field-strong) / <alpha-value>)",
        overlay: "rgb(var(--overlay) / <alpha-value>)",

        // Cizgiler
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        "line-stronger": "rgb(var(--line-stronger) / <alpha-value>)",

        // Sayfa zemini (gradient uclari)
        page: "rgb(var(--page) / <alpha-value>)",
        "page-accent": "rgb(var(--page-accent) / <alpha-value>)",
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@tailwindcss/container-queries"),
  ],
};
