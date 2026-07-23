/**
 * DreamySuite — Editor (v2) Tests
 *
 * The v1 list-reorder editor (SortableJS, .bl-card-wrap/.drag-handle) was
 * removed and replaced by the v2 free-canvas editor: blocks render inside an
 * about:srcdoc iframe as `[data-block-id]` elements positioned by
 * blockOffsetX/Y, moved via pointer drag (grab-and-drag) with alignment
 * snapping. These tests exercise that model.
 *
 * Target site: E2E_EDITOR_SITE_ID (defaults to the persistent QA editor clone).
 * The editor lives at /sites/<id>. Auth comes from the shared storageState.
 */

import { test, expect, type Page, type Frame } from "@playwright/test";
import { STORAGE_STATE } from "./auth-state";

test.use({ storageState: STORAGE_STATE });

const EDITOR_SITE_ID =
  process.env.E2E_EDITOR_SITE_ID || "site_qa_editor_clone";

/**
 * Open the v2 editor for the target site and return the canvas frame.
 * Note: the full-screen editor renders `body` as effectively hidden, so we wait
 * on the canvas iframe rather than the generic body-visible hydration helper.
 */
async function openEditor(page: Page): Promise<Frame> {
  await page.goto(`/sites/${EDITOR_SITE_ID}`, { waitUntil: "load" });
  await page.waitForSelector("iframe", { timeout: 20_000 });
  const frame = await waitForCanvasFrame(page);
  await frame
    .waitForSelector("[data-block-id]", { timeout: 20_000 })
    .catch(() => {});
  return frame;
}

/** The canvas frame is the one that contains block elements. */
async function waitForCanvasFrame(page: Page): Promise<Frame> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    for (const f of page.frames()) {
      const has = await f
        .evaluate(() => document.querySelector("iframe, [data-block-id]") != null)
        .catch(() => false);
      if (has && f !== page.mainFrame()) return f;
    }
    // fall back to any child frame
    const child = page.frames().find((f) => f !== page.mainFrame());
    if (child) return child;
    await page.waitForTimeout(300);
  }
  const child = page.frames().find((f) => f !== page.mainFrame());
  if (!child) throw new Error("no canvas iframe found");
  return child;
}

function blockCount(frame: Frame): Promise<number> {
  return frame.evaluate(
    () => document.querySelectorAll("[data-block-id]").length,
  );
}

test.describe("Editor v2 — canvas", () => {
  test("loads the editor with blocks rendered in the canvas iframe", async ({
    page,
  }) => {
    const frame = await openEditor(page);
    expect(page.url()).toContain(`/sites/${EDITOR_SITE_ID}`);
    expect(await blockCount(frame)).toBeGreaterThanOrEqual(1);
  });

  test("adds a block from the Elements tray", async ({ page }) => {
    const frame = await openEditor(page);
    const before = await blockCount(frame);

    // Open the "Add" rail (SIDEBAR_SECTIONS: id add-elements, label "Add") which
    // reveals the Elements tray. Its tiles are titled `Add <label> block`.
    const tile = page.locator('button[title^="Add "]').first();
    if (!(await tile.isVisible({ timeout: 2000 }).catch(() => false))) {
      await page
        .locator('button[aria-label="Add"], button[title="Add"]')
        .first()
        .click({ timeout: 5000 })
        .catch(() => {});
      await page.waitForTimeout(600);
    }

    await expect(tile).toBeVisible({ timeout: 5000 });
    await tile.click();
    await expect
      .poll(() => blockCount(frame), { timeout: 10_000 })
      .toBeGreaterThan(before);
  });

  test("dragging a block changes its position (free-canvas move)", async ({
    page,
  }) => {
    const frame = await openEditor(page);
    test.skip(
      (await blockCount(frame)) < 1,
      "need a block to drag",
    );

    const beforeTop = await frame.evaluate(() => {
      const el = document.querySelector<HTMLElement>("[data-block-id]");
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });

    // Grab-and-drag: pointerdown on the block, move past threshold, drag down.
    await frame.evaluate(async () => {
      const el = document.querySelector<HTMLElement>("[data-block-id]");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + 20;
      const pe = (type: string, x: number, y: number) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            pointerId: 1,
            button: 0,
          }),
        );
      pe("pointerdown", cx, cy);
      for (let i = 1; i <= 10; i++) {
        pe("pointermove", cx, cy + i * 40);
        await new Promise((res) => setTimeout(res, 25));
      }
      pe("pointerup", cx, cy + 400);
    });
    await page.waitForTimeout(800);

    const afterTop = await frame.evaluate(() => {
      const el = document.querySelector<HTMLElement>("[data-block-id]");
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });

    expect(beforeTop).not.toBeNull();
    expect(afterTop).not.toBeNull();
    expect(afterTop!).toBeGreaterThan(beforeTop!);
  });

  test("blocks persist after a reload", async ({ page }) => {
    const frame = await openEditor(page);
    const before = await blockCount(frame);
    test.skip(before < 1, "no blocks to verify persistence");

    // Let the debounced save (1.5s) flush before reloading.
    await page.waitForTimeout(2500);
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("iframe", { timeout: 20_000 });
    const frame2 = await waitForCanvasFrame(page);
    await frame2
      .waitForSelector("[data-block-id]", { timeout: 20_000 })
      .catch(() => {});
    await expect
      .poll(() => blockCount(frame2), { timeout: 12_000 })
      .toBeGreaterThanOrEqual(1);
  });
});
