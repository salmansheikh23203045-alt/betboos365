"use client";

import { useState } from "react";
import { POPULAR_CATEGORIES } from "@/data/mock";
import { cn } from "@/lib/cn";

/**
 * CategoryTabs — pill tabs for Popular Games (desktop only in the reference).
 * Active tab: gold fill, black text. Selection is visual only; filtering is wired in Step 06+.
 */
export function CategoryTabs({ className }: { className?: string }) {
  const [active, setActive] = useState<string>(POPULAR_CATEGORIES[0].id);

  return (
    <div role="tablist" aria-label="Game categories" className={cn("flex flex-wrap gap-2", className)}>
      {POPULAR_CATEGORIES.map((cat) => {
        const selected = cat.id === active;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => setActive(cat.id)}
            className={cn(
              "h-7 rounded-pill px-3 text-caption font-semibold transition-colors cursor-pointer",
              selected ? "bg-gold-gradient text-tcl-black" : "bg-tcl-surface-2 text-tcl-muted hover:text-tcl-white",
            )}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
