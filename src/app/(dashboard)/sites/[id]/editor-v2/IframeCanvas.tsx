"use client";

import { createPortal } from "react-dom";
import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from "react";

interface Props {
  children: ReactNode;
  breakpoint: string;
  themeStyles: CSSProperties;
  background?: string;
  googleFontsHref?: string | null;
}

export function IframeCanvas({
  children,
  breakpoint,
  themeStyles,
  background,
  googleFontsHref,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null);

  const handleLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    for (const node of document.querySelectorAll(
      'style, link[rel="stylesheet"]',
    )) {
      if ((node as HTMLElement).id === "editor-gfonts") continue;
      doc.head.appendChild(node.cloneNode(true));
    }

    const baseStyles = doc.createElement("style");
    baseStyles.textContent =
      "html,body{height:100%;margin:0}body{position:relative;overflow:hidden}";
    doc.head.appendChild(baseStyles);

    setIframeDoc(doc);
  }, []);

  useEffect(() => {
    if (iframeDoc) iframeDoc.body.setAttribute("data-breakpoint", breakpoint);
  }, [iframeDoc, breakpoint]);

  useEffect(() => {
    if (!iframeDoc) return;
    const { body } = iframeDoc;
    for (const [key, val] of Object.entries(themeStyles)) {
      if (key.startsWith("--")) {
        body.style.setProperty(key, String(val));
      }
    }
  }, [iframeDoc, themeStyles]);

  useEffect(() => {
    if (!iframeDoc) return;
    iframeDoc.body.style.background = background ?? "";
  }, [iframeDoc, background]);

  useEffect(() => {
    if (!iframeDoc) return;
    const id = "iframe-gfonts";
    let link = iframeDoc.getElementById(id) as HTMLLinkElement | null;
    if (!googleFontsHref) {
      link?.remove();
      return;
    }
    if (link) {
      link.href = googleFontsHref;
    } else {
      link = iframeDoc.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = googleFontsHref;
      iframeDoc.head.appendChild(link);
    }
  }, [iframeDoc, googleFontsHref]);

  return (
    <>
      <iframe
        ref={iframeRef}
        style={{
          border: "none",
          width: "100%",
          height: "100%",
          display: "block",
        }}
        srcDoc="<!doctype html><html><head></head><body></body></html>"
        title="Site preview"
        onLoad={handleLoad}
      />
      {iframeDoc && createPortal(children, iframeDoc.body)}
    </>
  );
}
