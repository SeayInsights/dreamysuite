"use client";

import { useState } from "react";
import Image from "next/image";
import {
  STOCK_CATEGORIES,
  STOCK_IMAGES,
  type StockCategory,
} from "@/lib/stock/library";

interface Props {
  /** Currently-selected URL (to highlight a stock image if it's the value). */
  value?: string | null;
  onSelect: (url: string) => void;
}

/**
 * Browsable grid of the curated, self-hosted stock image library, filtered by
 * category. Selecting an image passes its /stock URL to `onSelect` — the same
 * shape SitePhotoPicker uses for uploaded photos, so it drops into any image
 * field (hero, section/page background, image block, favicon).
 */
export function StockPicker({ value, onSelect }: Props) {
  const [category, setCategory] = useState<StockCategory | "all">("all");

  const images =
    category === "all"
      ? STOCK_IMAGES
      : STOCK_IMAGES.filter((img) => img.category === category);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={
            "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors " +
            (category === "all"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:text-foreground")
          }
        >
          All
        </button>
        {STOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={
              "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors " +
              (category === cat.id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground")
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {images.map((img) => {
          const isSelected = value === img.url;
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => onSelect(img.url)}
              aria-label={`Use ${img.label}`}
              title={img.label}
              className={
                "relative aspect-[4/3] overflow-hidden rounded-md ring-2 transition-all " +
                (isSelected
                  ? "ring-primary"
                  : "ring-transparent hover:ring-primary/40")
              }
            >
              <Image
                src={img.url}
                alt={img.label}
                fill
                unoptimized
                className="object-cover"
                sizes="90px"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
