/**
 * letterCascade — split text into words, stagger each word 0.08s with slight rotation.
 * Each block-level line (h2, p, li, etc.) cascades independently so multi-line
 * blocks animate line-by-line rather than as one flat sequence.
 */
import type { AnimOpts } from "../registry";
import { wrapTextNodes } from "./wrapTextNodes";

const letterCascade = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.6, delay = 0, easing = "power3.out" } = opts ?? {};

  const groups = wrapTextNodes(el, "word");
  if (!groups.length) return;

  // Scale stagger based on total word count so preview completes in ~2.5s
  const totalWords = groups.reduce((sum, g) => sum + g.length, 0);
  const baseStagger = 0.08;
  const targetPreviewTime = 2.5; // seconds
  const stagger =
    totalWords > 15
      ? Math.max(0.005, targetPreviewTime / totalWords)
      : baseStagger;

  const tl = gsap.timeline({ delay });
  for (const spans of groups) {
    tl.fromTo(
      spans,
      { opacity: 0, y: 24, rotateZ: 4 },
      {
        opacity: 1,
        y: 0,
        rotateZ: 0,
        duration,
        ease: easing,
        stagger,
      },
      groups.length > 1 ? "-=40%" : 0,
    );
  }
};

export default letterCascade;
