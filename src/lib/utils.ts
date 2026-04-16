import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class strings, de-duplicating conflicting utilities.
 * Used by shadcn/ui components throughout the editor chrome.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
