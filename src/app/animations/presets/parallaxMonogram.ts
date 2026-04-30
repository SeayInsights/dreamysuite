/**
 * parallaxMonogram — subtle vertical parallax on scroll (ScrollTrigger), 0.3x speed.
 * Detects nearest scrollable ancestor so it works inside the editor's nested scroll container.
 */
import type { AnimOpts } from "../registry";

const parallaxMonogram = async (el: Element, opts?: AnimOpts): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  let scroller: Element | undefined;
  let ancestor = el.parentElement;
  while (ancestor) {
    const style = getComputedStyle(ancestor);
    if (/(auto|scroll)/.test(style.overflowY) && ancestor.scrollHeight > ancestor.clientHeight) {
      scroller = ancestor;
      break;
    }
    ancestor = ancestor.parentElement;
  }

  gsap.to(el, {
    yPercent: -30,
    ease: "none",
    scrollTrigger: {
      trigger: el,
      scroller: scroller || undefined,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
};

export default parallaxMonogram;
