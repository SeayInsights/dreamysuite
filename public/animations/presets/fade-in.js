export default function fadeIn(el) {
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
}
