/**
 * fadeSlideUp — fade in + slide up 32px, 0.6s ease-out
 */
const fadeSlideUp = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  gsap.fromTo(
    el,
    { opacity: 0, y: 32 },
    { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
  );
};

export default fadeSlideUp;
