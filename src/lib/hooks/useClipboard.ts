/**
 * Clipboard Hook - Single Source of Truth
 *
 * Centralizes copy-to-clipboard functionality with automatic feedback
 * and error handling.
 *
 * ## Architecture Decision
 *
 * This hook centralizes clipboard operations that were duplicated across
 * SettingsTray, ShareDialog, and other components with copy buttons.
 * It provides:
 * - Copy-to-clipboard with success feedback
 * - Auto-reset after configurable delay
 * - Error handling for clipboard API failures
 * - Fallback for unsupported browsers
 *
 * ## Why This Pattern?
 *
 * **Before:** Every copy button duplicated clipboard logic
 * - 10+ files with identical `navigator.clipboard.writeText` calls
 * - Inconsistent feedback timing (1s, 1.5s, 2s, 3s)
 * - No error handling for clipboard permission failures
 * - Manual timeout cleanup
 *
 * **After:** One hook for all clipboard operations
 * - Consistent 1.5s feedback across all copy actions
 * - Automatic cleanup of timers
 * - Graceful error handling
 * - Supports both modern and legacy APIs
 *
 * ## Usage Guidelines
 *
 * ### Basic Copy Button
 * ```typescript
 * import { useClipboard } from "@/lib/hooks";
 * import { Copy, Check } from "lucide-react";
 *
 * function ShareButton({ url }: { url: string }) {
 *   const { copied, copy } = useClipboard();
 *
 *   return (
 *     <button onClick={() => copy(url)}>
 *       {copied ? <Check /> : <Copy />}
 *       {copied ? "Copied!" : "Copy Link"}
 *     </button>
 *   );
 * }
 * ```
 *
 * ### With Custom Reset Delay
 * ```typescript
 * const { copied, copy, error } = useClipboard({ resetDelay: 3000 });
 *
 * <button onClick={() => copy(shareUrl)}>
 *   {copied && "Copied!"}
 *   {error && "Failed to copy"}
 * </button>
 * ```
 *
 * ### With Success Callback
 * ```typescript
 * const { copy } = useClipboard({
 *   onSuccess: () => toast.success("Link copied!"),
 *   onError: (err) => toast.error(err.message),
 * });
 * ```
 *
 * ## Adding New Features
 *
 * 1. Add new option to `ClipboardOptions` interface
 * 2. Handle in `copy` function
 * 3. Update JSDoc examples
 *
 * ## Refactor Status
 *
 * - [x] Core hook implementation
 * - [x] Auto-reset timer
 * - [x] Error handling
 * - [x] Legacy browser fallback
 * - [ ] Migrate SettingsTray domain panel
 * - [ ] Migrate ShareDialog components
 * - [ ] Add paste support
 * - [ ] Add clipboard permission check
 *
 * @module lib/hooks/useClipboard
 */

import { useState, useCallback, useRef, useEffect } from "react";

export interface ClipboardOptions {
	/**
	 * Auto-reset `copied` state after delay (milliseconds)
	 * @default 1500
	 */
	resetDelay?: number;

	/**
	 * Success callback
	 */
	onSuccess?: () => void;

	/**
	 * Error callback
	 */
	onError?: (error: Error) => void;
}

export interface ClipboardResult {
	/**
	 * Whether text was recently copied (auto-resets after resetDelay)
	 */
	copied: boolean;

	/**
	 * Copy text to clipboard
	 */
	copy: (text: string) => Promise<void>;

	/**
	 * Error message if copy failed
	 */
	error: string | null;

	/**
	 * Manually reset copied state
	 */
	reset: () => void;
}

/**
 * Copy to clipboard hook with automatic feedback reset
 */
export function useClipboard(options: ClipboardOptions = {}): ClipboardResult {
	const { resetDelay = 1500, onSuccess, onError } = options;

	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Clear timer on unmount
	useEffect(() => {
		return () => {
			if (resetTimerRef.current) {
				clearTimeout(resetTimerRef.current);
			}
		};
	}, []);

	const reset = useCallback(() => {
		setCopied(false);
		setError(null);
		if (resetTimerRef.current) {
			clearTimeout(resetTimerRef.current);
			resetTimerRef.current = null;
		}
	}, []);

	const copy = useCallback(
		async (text: string) => {
			// Clear any existing timer
			if (resetTimerRef.current) {
				clearTimeout(resetTimerRef.current);
				resetTimerRef.current = null;
			}

			setError(null);

			try {
				// Modern clipboard API
				if (navigator.clipboard && navigator.clipboard.writeText) {
					await navigator.clipboard.writeText(text);
				} else {
					// Fallback for older browsers
					const textArea = document.createElement("textarea");
					textArea.value = text;
					textArea.style.position = "fixed";
					textArea.style.left = "-999999px";
					textArea.style.top = "-999999px";
					document.body.appendChild(textArea);
					textArea.focus();
					textArea.select();

					try {
						const successful = document.execCommand("copy");
						if (!successful) {
							throw new Error("Copy command was unsuccessful");
						}
					} finally {
						document.body.removeChild(textArea);
					}
				}

				// Success!
				setCopied(true);

				if (onSuccess) {
					onSuccess();
				}

				// Auto-reset after delay
				resetTimerRef.current = setTimeout(() => {
					setCopied(false);
					resetTimerRef.current = null;
				}, resetDelay);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to copy to clipboard";
				setError(errorMessage);

				if (onError) {
					onError(err instanceof Error ? err : new Error(errorMessage));
				}
			}
		},
		[resetDelay, onSuccess, onError]
	);

	return {
		copied,
		copy,
		error,
		reset,
	};
}
