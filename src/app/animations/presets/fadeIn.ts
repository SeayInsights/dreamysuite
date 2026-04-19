const fadeIn = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  gsap.fromTo(
    el,
    { opacity: 0 },
    { opacity: 1, duration: 0.6, ease: "power2.out" }
  );
};

export default fadeIn;
