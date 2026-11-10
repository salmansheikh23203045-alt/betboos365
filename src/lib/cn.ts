import { clsx, type ClassValue } from "clsx";

/** Join conditional class names. Tailwind conflicts are avoided by keeping one source per style. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
