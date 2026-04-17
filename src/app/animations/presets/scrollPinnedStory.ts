/**
 * scrollPinnedStory — pin the element while scrolling through 200vh, then unpin
 */
const scrollPinnedStory = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: el,
    start: "top top",
    end: "+=200vh",
    pin: true,
    pinSpacing: true,
  });
};

export default scrollPinnedStory;
