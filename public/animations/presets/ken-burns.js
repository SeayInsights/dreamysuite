export default function kenBurns(el) {
  var target = el.tagName === "IMG" ? el : el.querySelector("img") || el;
  if (target !== el) el.style.overflow = "hidden";
  gsap.fromTo(
    target,
    { scale: 1, x: 0, y: 0 },
    { scale: 1.08, x: "-1.5%", y: "-1.5%", duration: 6, ease: "power1.inOut", repeat: -1, yoyo: true }
  );
}
