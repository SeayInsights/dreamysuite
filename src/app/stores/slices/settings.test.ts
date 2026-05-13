import { afterEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { createSettingsSlice, type SettingsSlice } from "./settings";
import { createThemeSlice, type ThemeSlice } from "./theme";

type TestStore = SettingsSlice & ThemeSlice;

function makeStore() {
  return create<TestStore>()((...a) => ({
    ...createSettingsSlice(...a),
    ...createThemeSlice(...a),
  }));
}

describe("SettingsSlice - database row coercion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps background image zoom and position fields numeric after load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          settings: {
            accentColor: 123,
            bgImageZoom: 125,
            bgImagePositionX: 42,
            bgImagePositionY: 61,
          },
        }),
      }),
    );

    const store = makeStore();

    await store.getState().loadSettings("site-1");

    const { settings } = store.getState();
    expect(settings.bgImageZoom).toBe(125);
    expect(settings.bgImagePositionX).toBe(42);
    expect(settings.bgImagePositionY).toBe(61);
    expect(typeof settings.bgImageZoom).toBe("number");
    expect(typeof settings.bgImagePositionX).toBe("number");
    expect(typeof settings.bgImagePositionY).toBe("number");
    expect(settings.accentColor).toBe("123");
  });
});
