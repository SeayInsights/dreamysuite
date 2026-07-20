/**
 * DreamySuite — RSVP Tests
 *
 * Verifies: add guest via authenticated API, submit RSVP as public visitor,
 * verify guest status updated in DB.
 * Maps to e2e-verify.mjs scenarios 11, 12.
 */

import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from './auth-state';
import { waitForHydration } from './helpers/navigation';

test.use({ storageState: STORAGE_STATE });

/** Get siteId and slug of the first available site. */
async function getSiteInfo(page: import('@playwright/test').Page) {
  await page.goto('/');
  await waitForHydration(page);

  const siteLink = page.locator('a[href^="/sites/"]').first();
  const href = await siteLink.getAttribute('href');
  const siteId = href?.match(/\/sites\/([^/?#]+)/)?.[1] ?? null;

  let slug: string | null = null;
  if (siteId) {
    const res = await page.request.get(`/api/sites/${siteId}/settings`);
    const data = await res.json().catch(() => ({}));
    slug = (data as Record<string, unknown>)?.slug as string ?? null;
  }

  return { siteId, slug };
}

test.describe('RSVP Flow', () => {
  test('add guest via authenticated API', async ({ page, request }) => {
    const { siteId } = await getSiteInfo(page);
    test.skip(!siteId, 'No site available');

    const res = await request.post(`/api/sites/${siteId}/guests`, {
      data: {
        firstName: 'Test',
        lastName: 'Guest',
        party: 'E2E Test Party',
      },
    });

    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect((body as Record<string, unknown>)?.guest).toBeTruthy();
  });

  test('submit RSVP as unauthenticated visitor', async ({ page, browser }) => {
    const { siteId, slug } = await getSiteInfo(page);
    test.skip(!siteId || !slug, 'No site/slug available');

    // Make sure site is published for public RSVP
    await page.request.put(`/api/sites/${siteId}/settings`, {
      data: { isLive: 1 },
    }).catch(() => {});

    // Use a fresh context — no auth cookies
    const publicCtx = await browser.newContext();
    const publicPage = await publicCtx.newPage();

    const rsvpRes = await publicPage.request.post(`/api/public/${slug}/rsvp`, {
      data: {
        firstName: 'Test',
        lastName: 'Guest',
        attending: 'yes',
        notes: 'E2E test RSVP submission',
      },
    });

    const rsvpBody = await rsvpRes.json().catch(() => ({}));
    // The API returns { ok: true } on success
    expect((rsvpBody as Record<string, unknown>)?.ok).toBe(true);

    await publicCtx.close();
  });

  test('guest RSVP status updated in database', async ({ page, request }) => {
    const { siteId } = await getSiteInfo(page);
    test.skip(!siteId, 'No site available');

    const res = await request.get(`/api/sites/${siteId}/guests?status=yes`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    const guests = (body as Record<string, unknown[]>)?.guests ?? [];
    const testGuest = guests.find(
      (g: unknown) =>
        (g as Record<string, string>).firstName === 'Test' &&
        (g as Record<string, string>).lastName === 'Guest',
    );

    expect(testGuest).toBeTruthy();
  });
});
