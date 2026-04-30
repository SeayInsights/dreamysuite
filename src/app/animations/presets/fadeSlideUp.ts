/**
 * fadeSlideUp — fade in + slide up 32px, 0.6s ease-out
 */
import type { AnimOpts } from "../registry";

const fadeSlideUp = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.6, delay = 0, easing = "power2.out" } = opts ?? {};
  gsap.fromTo(
    el,
    { opacity: 0, y: 32 },
    { opacity: 1, y: 0, duration, delay, ease: easing }
  );
};

export default fadeSlideUp;
