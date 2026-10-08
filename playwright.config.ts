import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests", timeout: 30_000, fullyParallel: true, forbidOnly: Boolean(process.env.CI), retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://127.0.0.1:3101", trace: "retain-on-failure", screenshot: "only-on-failure", reducedMotion: "reduce" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} } },
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: { command: "npm run start -- --hostname 127.0.0.1 --port 3101", url: "http://127.0.0.1:3101", reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
