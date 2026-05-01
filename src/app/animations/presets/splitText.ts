/**
 * splitText — split text into character spans, stagger each 0.05s fade+slide up.
 * Uses TreeWalker to handle rich text with inline formatting (bold, italic, spans).
 */
import type { AnimOpts } from "../registry";
import { wrapTextNodes } from "./wrapTextNodes";

const splitText = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.45, delay = 0, easing = "power2.out" } = opts ?? {};

  const allSpans = wrapTextNodes(el, "char");
  if (!allSpans.length) return;

  gsap.fromTo(
    allSpans,
    { opacity: 0, y: 18 },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: easing,
      stagger: 0.05,
    },
  );
};

export default splitText;
