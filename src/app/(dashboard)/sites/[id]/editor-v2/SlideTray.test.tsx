// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

// The trays are code-split via next/dynamic; stub them out so this test only
// exercises SlideTray's own shell + click-outside handler.
vi.mock("next/dynamic", () => ({ default: () => () => null }));

import { SlideTray } from "./SlideTray";
import { useEditorStore } from "@/app/stores/editorStore";

beforeEach(() => {
  // jsdom lacks matchMedia, which prefersReducedMotion() calls
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
  }) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  useEditorStore.setState({ openTray: null });
  document.body.innerHTML = "";
});

// Open the tray and wait for the click-outside listener (attached on a
// setTimeout(0) inside the effect) to be registered.
async function renderOpen() {
  useEditorStore.setState({ openTray: "settings" });
  render(<SlideTray />);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}

describe("SlideTray click-outside (regression for the Add-guest bug, #285)", () => {
  it("stays open when the click is inside a body-portaled panel ([data-tray-portal])", async () => {
    await renderOpen();
    const portal = document.createElement("div");
    portal.setAttribute("data-tray-portal", "");
    document.body.appendChild(portal);

    fireEvent.mouseDown(portal);

    // The Guests panel portals to document.body (outside the tray ref); before
    // the fix this closed the tray, breaking every interaction in it.
    expect(useEditorStore.getState().openTray).toBe("settings");
  });

  it("closes when the click is on a plain outside element", async () => {
    await renderOpen();
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    fireEvent.mouseDown(outside);

    expect(useEditorStore.getState().openTray).toBeNull();
  });
});
