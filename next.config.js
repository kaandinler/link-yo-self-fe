/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker imaji (Dockerfile) NEXT_OUTPUT=standalone ile derliyor: cikti
  // yalnizca calisma aninda gereken dosyalari tasiyor ve imaj
  // node_modules'un tamamini (storybook, playwright...) icermiyor.
  //
  // NEDEN HER ZAMAN DEGIL: standalone ciktisi `node server.js` ile
  // calisiyor; `next start` onunla uyari basiyor. e2e (CI) ve yerel
  // gelistirme `next start` / `next dev` kullaniyor, onlar degismesin.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  eslint: {
    dirs: ["src", "playwright-tests"],
    // next build kendi ESLint cagrisinda hala eski (eslintrc) API'yi
    // kullaniyor ve flat config ile "Unknown options: useEslintrc,
    // extensions" hatasi basiyor. Lint zaten ayri bir CI job'inda
    // (.github/workflows/lint.yml) calistigi icin build sirasinda atlaniyor.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
