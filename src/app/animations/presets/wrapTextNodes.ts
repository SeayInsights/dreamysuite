/**
 * Shared utility for text-splitting animation presets.
 * Uses TreeWalker to find all text nodes and wrap words or characters
 * in <span> elements while preserving the existing DOM structure
 * (inline formatting, nested elements, etc.).
 *
 * Industry standard approach — same pattern as Splitting.js and GSAP SplitText.
 */

type SplitMode = "word" | "char";

export function wrapTextNodes(
  container: Element,
  mode: SplitMode,
): HTMLElement[] {
  const doc = container.ownerDocument ?? document;
  const spans: HTMLElement[] = [];

  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if ((node as Text).textContent?.trim()) textNodes.push(node as Text);
  }

  for (const textNode of textNodes) {
    const parent = textNode.parentNode;
    if (!parent) continue;

    const text = textNode.textContent ?? "";
    const frag = doc.createDocumentFragment();

    if (mode === "word") {
      const parts = text.split(/(\s+)/);
      for (const part of parts) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.appendChild(doc.createTextNode(part));
        } else {
          const span = doc.createElement("span");
          span.textContent = part;
          span.style.display = "inline-block";
          spans.push(span);
          frag.appendChild(span);
        }
      }
    } else {
      for (const ch of text) {
        if (/\s/.test(ch)) {
          const span = doc.createElement("span");
          span.textContent = " ";
          span.style.display = "inline-block";
          span.style.width = ch === "\n" ? "100%" : "";
          spans.push(span);
          frag.appendChild(span);
        } else {
          const span = doc.createElement("span");
          span.textContent = ch;
          span.style.display = "inline-block";
          spans.push(span);
          frag.appendChild(span);
        }
      }
    }

    parent.replaceChild(frag, textNode);
  }

  return spans;
}
