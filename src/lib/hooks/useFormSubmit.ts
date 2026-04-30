/**
 * Form Submission Hook - Single Source of Truth
 *
 * Standardizes form submission across all forms with built-in status management,
 * error handling, and success callbacks.
 *
 * ## Architecture Decision
 *
 * This hook centralizes form submission logic that was duplicated across
 * GuestBookBlock, RsvpFormBlock, LoginForm, and other form components.
 * It provides:
 * - Automatic status tracking (idle → submitting → success/error)
 * - Consistent error extraction from API responses
 * - Success callbacks with optional auto-reset
 * - Type-safe request/response handling
 *
 * ## Why This Pattern?
 *
 * **Before:** Every form duplicated 30-50 lines of status/error logic
 * - Inconsistent error message extraction
 * - Duplicate status state management
 * - Manual success callback handling
 * - No standardized API response parsing
 *
 * **After:** One hook handles all submission patterns
 * - 5 lines of code vs 50
 * - Consistent UX across all forms
 * - Type-safe API calls
 * - Automatic error formatting
 *
 * ## Usage Guidelines
 *
 * ### Basic Form Submission
 * ```typescript
 * const { status, error, submit } = useFormSubmit({
 *   endpoint: `/api/sites/${siteId}/guestbook`,
 *   method: "POST",
 *   onSuccess: (data) => {
 *     console.log("Submitted:", data);
 *   },
 * });
 *
 * <form onSubmit={submit}>
 *   {error && <div className="error">{error}</div>}
 *   <button disabled={status === "submitting"}>
 *     {status === "submitting" ? "Sending..." : "Submit"}
 *   </button>
 * </form>
 * ```
 *
 * ### With Custom Validation
 * ```typescript
 * const { status, error, submit } = useFormSubmit({
 *   endpoint: `/api/sites/${siteId}/rsvp`,
 *   onSubmit: (formData) => {
 *     const data = Object.fromEntries(formData.entries());
 *     if (!data.firstName) throw new Error("First name required");
 *     return { ...data };
 *   },
 *   onSuccess: () => setShowThankYou(true),
 * });
 * ```
 *
 * ### With Success Auto-Reset
 * ```typescript
 * const { status, submit } = useFormSubmit({
 *   endpoint: `/api/sites/${siteId}/contact`,
 *   resetDelay: 3000, // Auto-reset to idle after 3s
 *   onSuccess: (data) => {
 *     toast.success("Message sent!");
 *   },
 * });
 * ```
 *
 * ## Adding New Features
 *
 * 1. Add new option to `FormSubmitOptions` interface
 * 2. Handle in `submit` function logic
 * 3. Update JSDoc examples
 * 4. Test with existing forms
 *
 * ## Refactor Status
 *
 * - [x] Core hook implementation
 * - [x] Error extraction from API responses
 * - [x] Success callback support
 * - [x] Auto-reset timer
 * - [ ] Migrate GuestBookBlock
 * - [ ] Migrate RsvpFormBlock
 * - [ ] Migrate LoginForm
 * - [ ] Add optimistic updates support
 * - [ ] Add retry logic for network errors
 *
 * @module lib/hooks/useFormSubmit
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { getErrorMessage } from "@/lib/errors";

export type FormStatus = "idle" | "submitting" | "success" | "error";

export interface FormSubmitOptions<TData = unknown, TResponse = unknown> {
	/**
	 * API endpoint URL
	 */
	endpoint: string;

	/**
	 * HTTP method (default: "POST")
	 */
	method?: "POST" | "PUT" | "PATCH" | "DELETE";

	/**
	 * Transform FormData before submission
	 * Can throw error for validation failures
	 */
	onSubmit?: (formData: FormData, form: HTMLFormElement) => TData;

	/**
	 * Success callback with response data
	 */
	onSuccess?: (data: TResponse) => void;

	/**
	 * Error callback
	 */
	onError?: (error: Error) => void;

	/**
	 * Auto-reset to idle after success (milliseconds)
	 * Set to 0 to disable auto-reset
	 */
	resetDelay?: number;

	/**
	 * Custom headers
	 */
	headers?: Record<string, string>;

	/**
	 * Reset form after successful submission
	 */
	resetForm?: boolean;
}

export interface FormSubmitResult {
	/**
	 * Current submission status
	 */
	status: FormStatus;

	/**
	 * Error message if status is "error"
	 */
	error: string | null;

	/**
	 * Form submit handler
	 */
	submit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;

	/**
	 * Manually reset to idle state
	 */
	reset: () => void;

	/**
	 * Whether form is currently submitting
	 */
	isSubmitting: boolean;

	/**
	 * Whether submission was successful
	 */
	isSuccess: boolean;

	/**
	 * Whether submission failed
	 */
	isError: boolean;
}

/**
 * Form submission hook with status management and error handling
 */
export function useFormSubmit<TData = unknown, TResponse = unknown>(
	options: FormSubmitOptions<TData, TResponse>
): FormSubmitResult {
	const {
		endpoint,
		method = "POST",
		onSubmit,
		onSuccess,
		onError,
		resetDelay = 0,
		headers = {},
		resetForm = false,
	} = options;

	const [status, setStatus] = useState<FormStatus>("idle");
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
		setStatus("idle");
		setError(null);
		if (resetTimerRef.current) {
			clearTimeout(resetTimerRef.current);
			resetTimerRef.current = null;
		}
	}, []);

	const submit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();

			// Clear any existing timer
			if (resetTimerRef.current) {
				clearTimeout(resetTimerRef.current);
				resetTimerRef.current = null;
			}

			setStatus("submitting");
			setError(null);

			const form = e.currentTarget;
			const formData = new FormData(form);

			try {
				// Transform form data if handler provided
				let body: string;
				if (onSubmit) {
					body = JSON.stringify(onSubmit(formData, form));
				} else {
					// Default: convert FormData to JSON object
					const data: Record<string, unknown> = {};
					for (const [key, value] of formData.entries()) {
						data[key] = value;
					}
					body = JSON.stringify(data);
				}

				// Make API request
				const res = await fetch(endpoint, {
					method,
					headers: {
						"Content-Type": "application/json",
						...headers,
					},
					body,
				});

				// Handle non-OK responses
				if (!res.ok) {
					const errorData = await res.json().catch(() => ({}));
					throw new Error(getErrorMessage(errorData));
				}

				// Parse response
				const responseData = (await res.json()) as TResponse;

				// Success!
				setStatus("success");

				// Reset form if requested
				if (resetForm) {
					form.reset();
				}

				// Call success callback
				if (onSuccess) {
					onSuccess(responseData);
				}

				// Auto-reset to idle if delay specified
				if (resetDelay > 0) {
					resetTimerRef.current = setTimeout(() => {
						setStatus("idle");
						resetTimerRef.current = null;
					}, resetDelay);
				}
			} catch (err) {
				const errorMessage = getErrorMessage(err);
				setError(errorMessage);
				setStatus("error");

				if (onError) {
					onError(err instanceof Error ? err : new Error(errorMessage));
				}
			}
		},
		[endpoint, method, onSubmit, onSuccess, onError, resetDelay, headers, resetForm]
	);

	return {
		status,
		error,
		submit,
		reset,
		isSubmitting: status === "submitting",
		isSuccess: status === "success",
		isError: status === "error",
	};
}
