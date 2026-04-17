/**
 * letterCascade — split text into words, stagger each word 0.08s with slight rotation
 */
const letterCascade = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");

  const words = (el.textContent ?? "").split(" ").filter(Boolean);
  if (!words.length) return;

  const spans = words.map((word, i) => {
    const span = document.createElement("span");
    span.textContent = (i > 0 ? " " : "") + word;
    span.style.display = "inline-block";
    return span;
  });

  el.textContent = "";
  spans.forEach((span) => el.appendChild(span));

  gsap.fromTo(
    spans,
    { opacity: 0, y: 24, rotateZ: 4 },
    {
      opacity: 1,
      y: 0,
      rotateZ: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.08,
    }
  );
};

export default letterCascade;
