import { getPreset } from "./registry";
import type { AnimOpts } from "./registry";

const activeByBlock = new Map<string, () => void>();

function findBlockElement(
  blockId: string,
  contentDoc?: Document | null,
): HTMLElement | null {
  const sel = `[data-block-id="${blockId}"]`;
  if (contentDoc) {
    const el = contentDoc.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  return document.querySelector<HTMLElement>(sel);
}

export function runPreviewAnimation(
  blockId: string,
  presetId: string,
  opts?: AnimOpts,
  contentDoc?: Document | null,
): void {
  activeByBlock.get(blockId)?.();
  activeByBlock.delete(blockId);

  const el = findBlockElement(blockId, contentDoc);
  if (!el || !el.parentElement) return;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-block-id");
  clone.style.pointerEvents = "none";
  clone.style.visibility = "";
  clone.style.overflow = "visible";
  clone.style.zIndex = "9999";
  el.parentElement.insertBefore(clone, el);
  el.style.visibility = "hidden";

  let cancelled = false;

  const restore = () => {
    if (cancelled) return;
    cancelled = true;
    activeByBlock.delete(blockId);
    el.style.visibility = "";
    import("gsap")
      .then(({ gsap }) => {
        gsap.killTweensOf(clone);
        import("gsap/ScrollTrigger")
          .then(({ ScrollTrigger }) => {
            ScrollTrigger.getAll()
              .filter((t) => t.trigger === clone)
              .forEach((t) => t.kill());
          })
          .catch(() => {});
        clone.remove();
      })
      .catch(() => {
        clone.remove();
      });
  };

  activeByBlock.set(blockId, restore);

  const fallback = setTimeout(restore, 2000);

  const loader = getPreset(presetId);
  if (!loader) {
    clearTimeout(fallback);
    restore();
    return;
  }

  loader()
    .then((fn) => {
      if (cancelled) return;
      try {
        fn(clone, opts);
      } catch {
        clearTimeout(fallback);
        restore();
        return;
      }
      clearTimeout(fallback);
      setTimeout(restore, 1500);
    })
    .catch(() => {
      clearTimeout(fallback);
      restore();
    });
}
