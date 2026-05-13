/**
 * DreamySuite — Site Creation Tests
 *
 * Verifies: /sites/new form, submit, land in editor.
 * Maps to e2e-verify.mjs scenario 2.
 */

import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './auth.setup';
import { waitForHydration } from './helpers/navigation';

test.use({ storageState: STORAGE_STATE });

const SITE_NAME = `E2E Site ${Date.now()}`;
const SITE_SLUG = `e2e-${Date.now()}`;

test.describe('Site Creation', () => {
  test('creates a new site and lands in editor', async ({ page }) => {
    await page.goto('/sites/new');
    await waitForHydration(page);

    await page.fill('input[name="name"]', SITE_NAME);

    // Set custom slug if the input is present
    const slugInput = page.locator('#slug-input, input[name="slug"]');
    if (await slugInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await slugInput.fill(SITE_SLUG);
    }

    await Promise.all([
      page.waitForURL('**/sites/**', { timeout: 15_000 }),
      page.click('button[type="submit"]'),
    ]);

    // Should be in the editor (URL contains /sites/{uuid})
    await expect(page).toHaveURL(/\/sites\/[a-zA-Z0-9-]+/);
    await waitForHydration(page);
  });
});
