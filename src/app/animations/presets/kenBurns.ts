/**
 * kenBurns — slow scale 1→1.08 + subtle translate, 6s loop on image elements
 */
import type { AnimOpts } from "../registry";

const kenBurns = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { duration = 6 } = opts ?? {};

  // Target the image inside the element, or the element itself if it is an image
  const target = el.tagName === "IMG" ? el : el.querySelector("img") ?? el;

  // Ensure overflow is hidden on the container so the scale doesn't spill
  if (target !== el) {
    (el as HTMLElement).style.overflow = "hidden";
  }

  gsap.fromTo(
    target,
    { scale: 1, x: 0, y: 0 },
    {
      scale: 1.08,
      x: "-1.5%",
      y: "-1.5%",
      duration,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
    }
  );
};

export default kenBurns;
