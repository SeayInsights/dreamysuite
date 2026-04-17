/**
 * splitText — split element text into spans, stagger each span 0.05s fade+slide up
 */
const splitText = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");

  // Grab the first text node or the element's own text
  const textContent = el.textContent ?? "";
  if (!textContent.trim()) return;

  // Replace text with individual character spans
  const chars = textContent.split("").map((ch) => {
    const span = document.createElement("span");
    span.textContent = ch === " " ? "\u00a0" : ch;
    span.style.display = "inline-block";
    return span;
  });

  el.textContent = "";
  chars.forEach((span) => el.appendChild(span));

  gsap.fromTo(
    chars,
    { opacity: 0, y: 18 },
    {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: "power2.out",
      stagger: 0.05,
    }
  );
};

export default splitText;
