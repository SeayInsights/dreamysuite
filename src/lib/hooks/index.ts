/**
 * Custom Hooks - Barrel Export
 *
 * Centralized export for all custom React hooks.
 */

// Form handling
export { useFormSubmit } from "./useFormSubmit";
export type {
	FormStatus,
	FormSubmitOptions,
	FormSubmitResult,
} from "./useFormSubmit";

// Clipboard
export { useClipboard } from "./useClipboard";
export type { ClipboardOptions, ClipboardResult } from "./useClipboard";

// Toggle
export { useToggle } from "./useToggle";
export type { ToggleOptions, ToggleResult } from "./useToggle";
