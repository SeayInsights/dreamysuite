/**
 * blurIn — fade in from blur(10px) to sharp, 0.7s ease-out
 */
const blurIn = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  gsap.fromTo(
    el,
    { opacity: 0, filter: "blur(10px)" },
    { opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power2.out" }
  );
};

export default blurIn;
