/**
 * letterCascade — split text into words, stagger each word 0.08s with slight rotation.
 * Uses TreeWalker to handle rich text with inline formatting (bold, italic, spans).
 */
import type { AnimOpts } from "../registry";
import { wrapTextNodes } from "./wrapTextNodes";

const letterCascade = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.6, delay = 0, easing = "power3.out" } = opts ?? {};

  const allSpans = wrapTextNodes(el, "word");
  if (!allSpans.length) return;

  gsap.fromTo(
    allSpans,
    { opacity: 0, y: 24, rotateZ: 4 },
    {
      opacity: 1,
      y: 0,
      rotateZ: 0,
      duration,
      delay,
      ease: easing,
      stagger: 0.08,
    },
  );
};

export default letterCascade;
