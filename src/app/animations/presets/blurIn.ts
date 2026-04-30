/**
 * blurIn — fade in from blur(10px) to sharp, 0.7s ease-out
 */
import type { AnimOpts } from "../registry";

const blurIn = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.7, delay = 0, easing = "power2.out" } = opts ?? {};
  gsap.fromTo(
    el,
    { opacity: 0, filter: "blur(10px)" },
    { opacity: 1, filter: "blur(0px)", duration, delay, ease: easing }
  );
};

export default blurIn;
