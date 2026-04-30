/**
 * envelopeUnfold — 3D rotateX flip from -90deg to 0deg, 0.8s with back ease
 */
import type { AnimOpts } from "../registry";

const envelopeUnfold = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 0.8, delay = 0, easing = "back.out(1.4)" } = opts ?? {};
  gsap.fromTo(
    el,
    { rotateX: -90, opacity: 0, transformOrigin: "top center" },
    {
      rotateX: 0,
      opacity: 1,
      transformOrigin: "top center",
      duration,
      delay,
      ease: easing,
    }
  );
};

export default envelopeUnfold;
