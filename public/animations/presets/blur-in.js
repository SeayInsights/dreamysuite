export default function blurIn(el) {
  gsap.fromTo(el, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power2.out" });
}
