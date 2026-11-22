import { defineConfig } from "@playwright/test";
export default defineConfig({
  outputDir: "test-results/personal-artifacts",
  testDir: "./playwright-tests/personal",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 45000,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/personal-results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3000",
    locale: "tr-TR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
