/**
 * envelopeUnfold — 3D rotateX flip from -90deg to 0deg, 0.8s with back ease
 */
const envelopeUnfold = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  gsap.fromTo(
    el,
    { rotateX: -90, opacity: 0, transformOrigin: "top center" },
    {
      rotateX: 0,
      opacity: 1,
      transformOrigin: "top center",
      duration: 0.8,
      ease: "back.out(1.4)",
    }
  );
};

export default envelopeUnfold;
