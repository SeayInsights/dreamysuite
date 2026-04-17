export default function fadeSlideUp(el) {
  gsap.fromTo(el, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
}
