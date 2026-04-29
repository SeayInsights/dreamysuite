export default function springIn(el) {
  gsap.fromTo(el, { opacity: 0, y: 24, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.4)" });
}
