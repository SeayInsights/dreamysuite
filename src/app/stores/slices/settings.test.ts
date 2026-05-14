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

describe("SettingsSlice - save behavior", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends only the changed settings patch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);
    const store = makeStore();

    store.getState().updateSettings({ bgImageZoom: 125, bgImagePositionX: 35 });
    await store.getState().saveSettings("site-1");

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      bgImageZoom: 125,
      bgImagePositionX: 35,
    });
    expect(store.getState().settingsDirty).toBe(false);
    expect(store.getState().settingsPendingPatch).toEqual({});
  });

  it("keeps failed saves dirty so the editor can retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "missing column",
      }),
    );
    const store = makeStore();

    store.getState().updateSettings({ bgImageZoom: 125 });
    await store.getState().saveSettings("site-1");

    expect(store.getState().settingsDirty).toBe(true);
    expect(store.getState().settingsPendingPatch).toEqual({
      bgImageZoom: 125,
    });
  });

  it("retries newer slider values changed during an in-flight save", async () => {
    let resolveFirst!: (value: unknown) => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue({
        ok: true,
        text: async () => "",
      });
    vi.stubGlobal("fetch", fetchMock);
    const store = makeStore();

    store.getState().updateSettings({ bgImageZoom: 110 });
    const savePromise = store.getState().saveSettings("site-1");
    store.getState().updateSettings({ bgImageZoom: 140 });
    resolveFirst({
      ok: true,
      text: async () => "",
    });
    await savePromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const secondRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(firstRequest.body))).toEqual({
      bgImageZoom: 110,
    });
    expect(JSON.parse(String(secondRequest.body))).toEqual({
      bgImageZoom: 140,
    });
    expect(store.getState().settingsDirty).toBe(false);
    expect(store.getState().settingsPendingPatch).toEqual({});
  });
});
