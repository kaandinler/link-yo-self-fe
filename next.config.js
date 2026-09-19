/** @type {import('next').NextConfig} */
const nextConfig = {
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
