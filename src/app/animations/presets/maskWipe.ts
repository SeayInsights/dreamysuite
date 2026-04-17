/**
 * maskWipe — clip-path wipe from left to right, 0.8s
 */
const maskWipe = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");

  gsap.fromTo(
    el,
    { clipPath: "inset(0 100% 0 0)" },
    {
      clipPath: "inset(0 0% 0 0)",
      duration: 0.8,
      ease: "power2.inOut",
    }
  );
};

export default maskWipe;
