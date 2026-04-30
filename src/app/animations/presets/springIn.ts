import type { AnimOpts } from "../registry";

const springIn = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.8, delay = 0, easing = "elastic.out(1, 0.4)" } = opts ?? {};
  gsap.fromTo(
    el,
    { opacity: 0, y: 24, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration, delay, ease: easing }
  );
};

export default springIn;
