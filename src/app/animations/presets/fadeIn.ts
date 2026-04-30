import type { AnimOpts } from "../registry";

const fadeIn = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.6, delay = 0, easing = "power2.out" } = opts ?? {};
  gsap.fromTo(
    el,
    { opacity: 0 },
    { opacity: 1, duration, delay, ease: easing }
  );
};

export default fadeIn;
