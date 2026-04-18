/**
 * letterCascade — split text into words, stagger each word 0.08s with slight rotation.
 * Works per-text-element inside the block to avoid garbling multi-element layouts.
 */
const letterCascade = async (el: Element): Promise<void> => {
  if (!el) return;
  const { gsap } = await import("gsap");

  const textEls = el.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span:not(span span), a, li");
  const targets = textEls.length ? Array.from(textEls) : [el];

  const allSpans: HTMLElement[] = [];

  for (const textEl of targets) {
    if (textEl.children.length > 0 && textEl !== el) continue;
    const text = textEl.textContent ?? "";
    const words = text.split(" ").filter(Boolean);
    if (!words.length) continue;

    const spans = words.map((word, i) => {
      const span = document.createElement("span");
      span.textContent = (i > 0 ? " " : "") + word;
      span.style.display = "inline-block";
      return span;
    });

    textEl.textContent = "";
    spans.forEach((span) => textEl.appendChild(span));
    allSpans.push(...spans);
  }

  if (!allSpans.length) return;

  gsap.fromTo(
    allSpans,
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
