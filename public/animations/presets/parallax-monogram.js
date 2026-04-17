export default function parallaxMonogram(el) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.to(el, {
    yPercent: -30,
    ease: "none",
    scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
  });
}
