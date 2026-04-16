/**
 * DreamySuite — Playwright Config
 *
 * Thin wrapper over the studio base config. All shared settings
 * (retries, reporters, screenshot policy) come from testing/.
 * defineConfig + devices are resolved from this build's node_modules.
 */

import { defineConfig, devices } from '@playwright/test';
import { createConfig } from '../../testing/playwright.base';
import path from 'node:path';

export default defineConfig(
  createConfig(
    {
      baseURL: 'http://localhost:3000',
      testDir: './e2e',
      buildRoot: path.resolve(__dirname),
      webServer: {
        command: 'npm run dev',
        port: 3000,
        timeout: 60_000, // Next.js cold start can be slow
      },
      mobile: true, // DreamySuite targets wedding guests on phones
    },
    devices,
  ),
);
