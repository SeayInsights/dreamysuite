import { registerPreset } from "../registry";

registerPreset("fade-slide-up", () => import("./fadeSlideUp").then((m) => m.default));
registerPreset("split-text", () => import("./splitText").then((m) => m.default));
registerPreset("mask-wipe", () => import("./maskWipe").then((m) => m.default));
registerPreset("parallax-monogram", () => import("./parallaxMonogram").then((m) => m.default));
registerPreset("ken-burns", () => import("./kenBurns").then((m) => m.default));
registerPreset("scroll-pinned-story", () => import("./scrollPinnedStory").then((m) => m.default));
registerPreset("sticky-date", () => import("./stickyDate").then((m) => m.default));
registerPreset("blur-in", () => import("./blurIn").then((m) => m.default));
registerPreset("envelope-unfold", () => import("./envelopeUnfold").then((m) => m.default));
registerPreset("letter-cascade", () => import("./letterCascade").then((m) => m.default));
