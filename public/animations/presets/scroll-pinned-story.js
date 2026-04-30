export default function scrollPinnedStory(el, opts) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({ trigger: el, start: 'top top', end: '+=200vh', pin: true, pinSpacing: true });
}
