/**
 * DreamySuite — Dashboard Tests
 *
 * Verifies: authenticated dashboard loads, site list or empty state,
 * "New Site" CTA present. Maps to e2e-verify.mjs scenario 1.
 */

import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './auth.setup';

test.use({ storageState: STORAGE_STATE });

test.describe('Dashboard', () => {
  test('loads and shows My Sites heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('My Sites');
  });

  test('New Site link is visible', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('a[href="/sites/new"]');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('New Site');
  });

  test('redirects to /login when unauthenticated', async ({ browser }) => {
    const ctx = await browser.newContext(); // fresh — no stored session
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });
});
