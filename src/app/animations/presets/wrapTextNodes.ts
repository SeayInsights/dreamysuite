/**
 * Shared utility for text-splitting animation presets.
 * Uses TreeWalker to find all text nodes and wrap words or characters
 * in <span> elements while preserving the existing DOM structure.
 *
 * Returns spans grouped by block-level element (h1-h6, p, li, etc.) so
 * each visual "line" can cascade independently — the industry standard
 * behavior (Splitting.js, GSAP SplitText).
 */

type SplitMode = "word" | "char";

const LINE_SELECTOR =
  "h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption, dt, dd, td, th";

function wrapTextNodesIn(
  doc: Document,
  root: Element | Node,
  mode: SplitMode,
): HTMLElement[] {
  const spans: HTMLElement[] = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
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
          span.textContent = " ";
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

/**
 * Walk an element's DOM, group text by block-level containers, and wrap each
 * word or character in a span. Returns one group per visual "line" so the
 * caller can cascade each line independently.
 */
export function wrapTextNodes(
  container: Element,
  mode: SplitMode,
): HTMLElement[][] {
  const doc = container.ownerDocument ?? document;
  const lineEls = container.querySelectorAll(LINE_SELECTOR);

  if (!lineEls.length) {
    const spans = wrapTextNodesIn(doc, container, mode);
    return spans.length ? [spans] : [];
  }

  const groups: HTMLElement[][] = [];
  for (const lineEl of lineEls) {
    if (lineEl.querySelector(LINE_SELECTOR)) continue;
    const spans = wrapTextNodesIn(doc, lineEl, mode);
    if (spans.length) groups.push(spans);
  }
  return groups;
}
