/**
 * DreamySuite Playwright config.
 *
 * Keep this repo-local so e2e listing and browser verification do not depend
 * on a sibling testing package.
 *
 * Target: defaults to a local dev server (http://localhost:3000). Set
 * E2E_BASE_URL to run against a deployed preview instead — the local dev
 * webServer is then skipped. Auth state is created by the `setup` project
 * (see e2e/auth.setup.ts) using E2E_EMAIL / E2E_PASSWORD.
 */

import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./e2e/auth-state";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const IS_REMOTE = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // Only boot the local dev server when testing locally. Against a deployed
  // preview (E2E_BASE_URL set), test the running deployment directly.
  ...(IS_REMOTE
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
});
