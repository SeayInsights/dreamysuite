const springIn = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  gsap.fromTo(
    el,
    { opacity: 0, y: 24, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.4)" }
  );
};

export default springIn;
