/**
 * stickyDate — sticky header that scales down on scroll (for date/header blocks)
 */
const stickyDate = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  const htmlEl = el as HTMLElement;
  htmlEl.style.position = "sticky";
  htmlEl.style.top = "0";
  htmlEl.style.zIndex = "10";

  gsap.fromTo(
    el,
    { scale: 1, transformOrigin: "top center" },
    {
      scale: 0.85,
      transformOrigin: "top center",
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "+=200",
        scrub: true,
      },
    }
  );
};

export default stickyDate;
