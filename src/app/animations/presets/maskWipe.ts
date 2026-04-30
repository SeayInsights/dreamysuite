/**
 * maskWipe — clip-path wipe from left to right, 0.8s
 */
import type { AnimOpts } from "../registry";

const maskWipe = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.8, delay = 0, easing = "power2.inOut" } = opts ?? {};

  gsap.fromTo(
    el,
    { clipPath: "inset(0 100% 0 0)" },
    {
      clipPath: "inset(0 0% 0 0)",
      duration,
      delay,
      ease: easing,
    }
  );
};

export default maskWipe;
