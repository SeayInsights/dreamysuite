import { expect, type Page } from '@playwright/test';

export async function waitForHydration(page: Page, timeout = 5000) {
  await page.waitForLoadState('domcontentloaded', { timeout });
  await expect(page.locator('body')).toBeVisible({ timeout });
}

export async function waitForSave(page: Page, timeout = 5000) {
  const saving = page.locator(
    'text=/saving|saved|all changes saved|changes saved/i',
  );
  await saving.first().waitFor({ state: 'visible', timeout }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
}
