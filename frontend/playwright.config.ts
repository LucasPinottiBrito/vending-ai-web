import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  outputDir: "../../.local/playwright-results",
  reporter: [
    ["list"],
    ["json", { outputFile: "../../.local/playwright-report.json" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
