/**
 * DreamySuite Auth Setup
 *
 * Logs in once and saves the browser session to .auth/user.json.
 * All spec files that need authentication reuse this stored state,
 * so login only happens once per test run.
 *
 * Set env vars to use a persistent test account:
 *   E2E_EMAIL=test@dreamysuite.com  E2E_PASSWORD=... npx playwright test
 *
 * Without env vars, generates a timestamped throwaway account via signup.
 */

import { createAuthSetup } from '../../../testing/fixtures/auth';

export const STORAGE_STATE = './e2e/.auth/user.json';

createAuthSetup({
  loginURL: '/login',
  credentials: {
    email: process.env.E2E_EMAIL ?? `e2e-test-${Date.now()}@dreamysuite-test.com`,
    password: process.env.E2E_PASSWORD ?? 'TestPass123!',
  },
  selectors: {
    email: 'input[name="email"]',
    password: 'input[name="password"]',
    submit: 'button[type="submit"]',
  },
  successIndicator: { urlContains: '/' },
  storageStatePath: STORAGE_STATE,
});
