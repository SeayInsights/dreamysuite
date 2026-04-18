/**
 * splitText — split text into character spans, stagger each 0.05s fade+slide up.
 * Works per-text-element inside the block to avoid destroying rich text structure.
 */
const splitText = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");

  const textEls = el.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span:not(span span), a, li");
  const targets = textEls.length ? Array.from(textEls) : [el];

  const allSpans: HTMLElement[] = [];

  for (const textEl of targets) {
    if (textEl.children.length > 0 && textEl !== el) continue;
    const text = textEl.textContent ?? "";
    if (!text.trim()) continue;

    const chars = text.split("").map((ch) => {
      const span = document.createElement("span");
      span.textContent = ch === " " ? "\u00a0" : ch;
      span.style.display = "inline-block";
      return span;
    });

    textEl.textContent = "";
    chars.forEach((span) => textEl.appendChild(span));
    allSpans.push(...chars);
  }

  if (!allSpans.length) return;

  gsap.fromTo(
    allSpans,
    { opacity: 0, y: 18 },
    {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: "power2.out",
      stagger: 0.05,
    },
  );
};

export default splitText;
