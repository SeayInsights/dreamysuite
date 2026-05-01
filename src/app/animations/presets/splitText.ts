/**
 * splitText — split text into character spans, stagger each 0.05s fade+slide up.
 * Each block-level line (h2, p, li, etc.) cascades independently so multi-line
 * blocks animate line-by-line rather than as one flat sequence.
 */
import type { AnimOpts } from "../registry";
import { wrapTextNodes } from "./wrapTextNodes";

const splitText = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.45, delay = 0, easing = "power2.out" } = opts ?? {};

  const groups = wrapTextNodes(el, "char");
  if (!groups.length) return;

  // Scale stagger based on total character count so preview completes in ~2.5s
  const totalChars = groups.reduce((sum, g) => sum + g.length, 0);
  const baseStagger = 0.05;
  const targetPreviewTime = 2.5; // seconds
  const stagger =
    totalChars > 24
      ? Math.max(0.005, targetPreviewTime / totalChars)
      : baseStagger;

  const tl = gsap.timeline({ delay });
  for (const spans of groups) {
    tl.fromTo(
      spans,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration,
        ease: easing,
        stagger,
      },
      groups.length > 1 ? "-=40%" : 0,
    );
  }
};

export default splitText;
