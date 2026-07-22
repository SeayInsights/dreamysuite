"use client";

/* eslint-disable react-hooks/immutability -- effects intentionally synchronize the iframe document DOM (an external mutable system). */

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
  onDocumentReady?: (doc: Document) => void;
}

export function IframeCanvas({
  children,
  breakpoint,
  themeStyles,
  background,
  googleFontsHref,
  onDocumentReady,
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
      "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{position:relative;overflow:hidden;line-height:1.5;-webkit-font-smoothing:antialiased}img,picture,video,canvas,svg{display:block;max-width:100%}input,button,textarea,select{font:inherit}p,h1,h2,h3,h4,h5,h6{overflow-wrap:break-word}";
    doc.head.appendChild(baseStyles);

    setIframeDoc(doc);
    onDocumentReady?.(doc);
  }, [onDocumentReady]);

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
    const { body } = iframeDoc;
    body.style.background = background ?? "";
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
