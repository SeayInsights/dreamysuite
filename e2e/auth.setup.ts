/**
 * DreamySuite auth setup for Playwright.
 *
 * Runs as the `setup` project (before the browser projects). Logs in with a
 * test account (E2E_EMAIL / E2E_PASSWORD from the environment — never committed)
 * and saves the authenticated storage state to STORAGE_STATE, which the browser
 * projects reuse via `test.use({ storageState })`.
 *
 * Credentials and target URL come from env so nothing sensitive lives in the repo:
 *   E2E_BASE_URL   deployed preview to test against (also set in playwright.config)
 *   E2E_EMAIL      test-account email
 *   E2E_PASSWORD   test-account password
 */

import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { STORAGE_STATE } from "./auth-state";

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  // Manual-login path: if a storage state was captured by hand (headed login)
  // and no scripted credentials are provided, reuse it as-is.
  if (fs.existsSync(STORAGE_STATE) && (!email || !password)) {
    setup.skip(true, "Reusing pre-captured storage state (manual login).");
    return;
  }
  if (!email || !password) {
    throw new Error(
      "Set E2E_EMAIL/E2E_PASSWORD for scripted login, or capture e2e/.auth/user.json via a headed login.",
    );
  }

  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);

  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
    page.click('button[type="submit"]'),
  ]);
  expect(
    resp.ok(),
    "sign-in request failed — check E2E_EMAIL / E2E_PASSWORD",
  ).toBeTruthy();

  // Confirm the session is live: the dashboard must not bounce us to /login.
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/login/);

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
