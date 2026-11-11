import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Step 10 visual verification.
 *
 * - Runs chromium only (what we installed).
 * - 5 viewport sizes total: mobile 375 / 390 / 430, desktop 1440 / 1920.
 * - No webServer: tests assume the dev stack is already up (backend on
 *   :3200, next on :3100). Keeps iteration fast.
 */
export default defineConfig({
  testDir: "./tests/visual",
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PW_BASE_URL ?? "http://localhost:3100",
    screenshot: "only-on-failure",
    trace: "off",
    video: "off",
    headless: true,
    // The matching headless-shell build isn't on disk yet; use the full
    // chromium binary we already installed (channel resolves to it).
    channel: "chromium",
  },
  projects: [
    // Mobile projects use chromium (not webkit) because that's what we
    // installed; devices["iPhone SE"] et al. would default to webkit, so
    // override browserName explicitly and keep just the viewport + ua hint.
    { name: "mobile-375",   use: { browserName: "chromium", channel: "chromium", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, userAgent: devices["iPhone SE"].userAgent } },
    { name: "mobile-390",   use: { browserName: "chromium", channel: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent } },
    { name: "mobile-430",   use: { browserName: "chromium", channel: "chromium", viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true, userAgent: devices["iPhone 14 Pro Max"].userAgent } },
    { name: "desktop-1440", use: { browserName: "chromium", channel: "chromium", viewport: { width: 1440, height: 900 } } },
    { name: "desktop-1920", use: { browserName: "chromium", channel: "chromium", viewport: { width: 1920, height: 1080 } } },
  ],
});
