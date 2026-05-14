import { describe, expect, it } from "vitest";
import { buildMessageListenerScript } from "./scripts";

type SiteSettingsMessage = {
  origin: string;
  data: {
    type: "site_settings_update";
    delta: Record<string, unknown>;
  };
};

function makeElement(computedBackgroundImage = "none") {
  const style: Record<
    string,
    string | ((name: string, value?: string) => void)
  > = {
    setProperty(name: string, value = "") {
      style[name] = value;
    },
    removeProperty(name: string) {
      delete style[name];
    },
  };
  return {
    computedBackgroundImage,
    style,
  };
}

function installListener(options?: {
  overlayDisplay?: string;
  bodyBackground?: string;
  contentBackground?: string;
}) {
  const listeners: Record<string, (event: SiteSettingsMessage) => void> = {};
  const root = makeElement();
  const body = makeElement(options?.bodyBackground ?? "none");
  const overlay = makeElement();
  const siteContent = makeElement(options?.contentBackground ?? "none");
  overlay.style.display = options?.overlayDisplay ?? "";
  overlay.style.backgroundImage = "url('bg.jpg')";

  const document = {
    documentElement: root,
    body,
    getElementById(id: string) {
      if (id === "bg-overlay") return overlay;
      if (id === "site-content") return siteContent;
      return null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const window = {
    addEventListener(
      name: string,
      callback: (event: SiteSettingsMessage) => void,
    ) {
      listeners[name] = callback;
    },
  };
  const location = { origin: "https://example.com" };
  const getComputedStyle = (element: ReturnType<typeof makeElement>) => ({
    backgroundImage: element.computedBackgroundImage,
    getPropertyValue: () => "",
  });

  const script = buildMessageListenerScript()
    .replace(/^<script>\s*/, "")
    .replace(/\s*<\/script>$/, "");
  new Function("window", "document", "location", "getComputedStyle", script)(
    window,
    document,
    location,
    getComputedStyle,
  );

  return {
    root,
    body,
    overlay,
    siteContent,
    send(delta: Record<string, unknown>) {
      listeners.message({
        origin: location.origin,
        data: { type: "site_settings_update", delta },
      });
    },
  };
}

describe("buildMessageListenerScript background image live updates", () => {
  it("updates public site CSS variable names for live theme changes", () => {
    const { root, send } = installListener();

    send({
      accentColor: "#123456",
      bodyColor: "#654321",
      siteTextColor: "#abcdef",
    });

    expect(root.style["--site-accent"]).toBe("#123456");
    expect(root.style["--body-color"]).toBe("#654321");
    expect(root.style["--site-muted"]).toBe("#654321");
    expect(root.style["--site-text"]).toBe("#abcdef");
    expect(root.style["--text"]).toBe("#abcdef");
    expect(root.style["--accent"]).toBeUndefined();
    expect(root.style["--muted"]).toBeUndefined();
  });

  it("preserves overlay zoom and position behavior", () => {
    const { overlay, send } = installListener({ overlayDisplay: "" });

    send({ bgImageZoom: 125, bgImagePositionX: 35, bgImagePositionY: 65 });

    expect(overlay.style.backgroundSize).toBe("125%");
    expect(overlay.style.backgroundPosition).toBe("35% 65%");
    expect(overlay.style.backgroundRepeat).toBe("no-repeat");
  });

  it("applies full-page non-overlay zoom and position updates to body", () => {
    const { body, send } = installListener({
      overlayDisplay: "none",
      bodyBackground: "url('bg.jpg')",
    });

    send({ bgImageZoom: 90, bgImagePositionX: 20, bgImagePositionY: 70 });

    expect(body.style.backgroundSize).toBe("90%");
    expect(body.style.backgroundPosition).toBe("20% 70%");
    expect(body.style.backgroundRepeat).toBe("no-repeat");
  });

  it("applies content-only non-overlay zoom and position updates to site content", () => {
    const { siteContent, send } = installListener({
      overlayDisplay: "none",
      contentBackground: "url('bg.jpg')",
    });

    send({ bgImageZoom: 80, bgImagePositionX: 10, bgImagePositionY: 55 });

    expect(siteContent.style.backgroundSize).toBe("80%");
    expect(siteContent.style.backgroundPosition).toBe("10% 55%");
    expect(siteContent.style.backgroundRepeat).toBe("no-repeat");
  });

  it("uses sane fallbacks when live zoom and position values are missing", () => {
    const { body, send } = installListener({
      overlayDisplay: "none",
      bodyBackground: "url('bg.jpg')",
    });

    send({ bgImageZoom: null, bgImagePositionX: null, bgImagePositionY: null });

    expect(body.style.backgroundSize).toBe("100%");
    expect(body.style.backgroundPosition).toBe("50% 50%");
    expect(body.style.backgroundSize).not.toContain("undefined");
    expect(body.style.backgroundPosition).not.toContain("undefined");
  });
});
