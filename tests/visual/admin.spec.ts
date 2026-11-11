import { test, expect, Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

// Keep screenshots out of git by living under docs/screenshots (gitignored
// via the broader .gitignore `/.next` style — we add a dedicated entry
// before committing). Each project drops files prefixed with its name.
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

async function loginAsAdmin(page: Page) {
  // Use the BFF so we get real HttpOnly cookies.
  const resp = await page.request.post("/api/auth/login", {
    data: { username: "admin", password: "Test1234" },
  });
  expect(resp.ok(), "admin login failed").toBeTruthy();
}

const PUBLIC_PAGES = [
  "/",
  "/casino",
  "/sports",
  "/live-casino",
  "/slots",
  "/promotion",
  "/login",
  "/signup",
  "/about",
  "/contact",
  "/blog",
  "/faq",
  "/privacy",
  "/terms",
];

const ADMIN_PAGES = [
  "/admin",
  "/admin/users",
  "/admin/games",
  "/admin/promotions",
  "/admin/sports",
  "/admin/support",
  "/admin/audit-logs",
  "/admin/transactions",
  "/admin/reports",
];

function slug(path: string) {
  if (path === "/") return "home";
  return path.replace(/^\//, "").replace(/\//g, "-");
}

test.describe("Public pages — responsive capture + smoke", () => {
  for (const p of PUBLIC_PAGES) {
    test(`public ${p}`, async ({ page }, info) => {
      const label = slug(p);
      const resp = await page.goto(p);
      expect(resp?.ok(), `${p} should return 2xx`).toBeTruthy();
      // Wait for any client hydration to settle without flaky network wait.
      await page.waitForLoadState("domcontentloaded");
      await page.screenshot({
        path: `${OUT}/${info.project.name}-public-${label}.png`,
        fullPage: true,
      });
    });
  }
});

test.describe("Admin pages — responsive capture + smoke (admin role)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const p of ADMIN_PAGES) {
    test(`admin ${p}`, async ({ page }, info) => {
      const label = slug(p);
      const resp = await page.goto(p);
      expect(resp?.ok(), `${p} should return 2xx (got ${resp?.status()})`).toBeTruthy();
      await page.waitForLoadState("domcontentloaded");
      // Give any client-side auth hydration a moment.
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `${OUT}/${info.project.name}-${label}.png`,
        fullPage: true,
      });
    });
  }
});

test("console errors are absent on the homepage", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  // Deprecation warnings we don't control (third-party lib noise).
  const relevant = errors.filter((e) => !/favicon|next-dev-overlay|DevTools/.test(e));
  expect(relevant, `unexpected console errors:\n${relevant.join("\n")}`).toHaveLength(0);
});
