/**
 * parallaxMonogram — subtle vertical parallax on scroll (ScrollTrigger), 0.3x speed
 */
const parallaxMonogram = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  gsap.to(el, {
    yPercent: -30,
    ease: "none",
    scrollTrigger: {
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
};

export default parallaxMonogram;
