import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface GameGridProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Accessible name for the grid. */
  ariaLabel: string;
  /** Column count per breakpoint. Default: 2 on phones, 5 on desktop (reference: Featured Games). */
  columns?: string;
  /** Stagger entrance animation on grid items. */
  stagger?: boolean;
  className?: string;
}

/**
 * GameGrid — static grid for game tiles. Desktop Featured Games uses 2 rows × 5 columns.
 */
export function GameGrid<T>({
  items,
  getKey,
  renderItem,
  ariaLabel,
  columns = "grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  stagger = false,
  className,
}: GameGridProps<T>) {
  return (
    <ul aria-label={ariaLabel} className={cn("grid gap-3", columns, className)}>
      {items.map((item, i) => (
        <li
          key={getKey(item)}
          className={stagger ? "animate-stagger" : undefined}
          style={stagger ? ({ "--stagger-i": Math.min(i, 14) } as React.CSSProperties) : undefined}
        >
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}
