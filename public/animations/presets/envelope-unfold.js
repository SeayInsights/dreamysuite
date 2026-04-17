export default function envelopeUnfold(el) {
  gsap.fromTo(
    el,
    { rotateX: -90, opacity: 0, transformOrigin: "top center" },
    { rotateX: 0, opacity: 1, transformOrigin: "top center", duration: 0.8, ease: "back.out(1.4)" }
  );
}
