/**
 * Event Handler Utilities - Single Source of Truth
 *
 * Common event handling patterns and utilities.
 *
 * ## Architecture Decision
 *
 * This module centralizes event handler utilities that were scattered
 * across components. It provides:
 * - Event wrapper functions (preventDefault, stopPropagation)
 * - Form data extraction helpers
 * - Common handler patterns
 * - Type-safe event handling
 *
 * ## Why This Pattern?
 *
 * **Before:** Event handling boilerplate repeated everywhere
 * - Manual `e.preventDefault()` calls in every handler
 * - Duplicate FormData extraction logic
 * - No type safety for event handlers
 * - Verbose inline event handling
 *
 * **After:** Reusable event utilities
 * - Wrap handlers with preventDefault/stopPropagation
 * - Extract form data with one function
 * - Type-safe event handling
 * - Cleaner component code
 *
 * ## Usage Guidelines
 *
 * ### Prevent Default
 * ```typescript
 * import { preventDefault } from "@/lib/handlers";
 *
 * function saveData() {
 *   // ... save logic
 * }
 *
 * <form onSubmit={preventDefault(saveData)}>
 *   ...
 * </form>
 * ```
 *
 * ### Stop Propagation
 * ```typescript
 * import { stopPropagation } from "@/lib/handlers";
 *
 * <div onClick={parentHandler}>
 *   <button onClick={stopPropagation(childHandler)}>
 *     Click (won't bubble)
 *   </button>
 * </div>
 * ```
 *
 * ### Extract Form Data
 * ```typescript
 * import { extractFormData } from "@/lib/handlers";
 *
 * interface FormData {
 *   email: string;
 *   password: string;
 * }
 *
 * function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
 *   e.preventDefault();
 *   const data = extractFormData<FormData>(e.currentTarget);
 *   console.log(data.email, data.password);
 * }
 * ```
 *
 * ### Combine Utilities
 * ```typescript
 * import { preventDefault, extractFormData } from "@/lib/handlers";
 *
 * <form onSubmit={preventDefault((e) => {
 *   const data = extractFormData(e.currentTarget);
 *   submitToApi(data);
 * })}>
 * ```
 *
 * ## Adding New Utilities
 *
 * 1. Add new utility function
 * 2. Document with JSDoc
 * 3. Add usage example
 * 4. Export from this module
 * 5. Update lib/index.ts barrel export
 *
 * ## Refactor Status
 *
 * - [x] preventDefault wrapper
 * - [x] stopPropagation wrapper
 * - [x] extractFormData helper
 * - [x] Type definitions
 * - [ ] Migrate form components
 * - [ ] Add debounce handler creator
 * - [ ] Add throttle handler creator
 * - [ ] Add keyboard event helpers
 *
 * @module lib/handlers
 */

/**
 * Wrap an event handler to call preventDefault
 *
 * @example
 * ```typescript
 * <form onSubmit={preventDefault(handleSubmit)}>
 * ```
 */
export function preventDefault<T extends Event>(
	handler: (event: T) => void | Promise<void>
): (event: T) => void {
	return (event: T) => {
		event.preventDefault();
		handler(event);
	};
}

/**
 * Wrap an event handler to call stopPropagation
 *
 * @example
 * ```typescript
 * <button onClick={stopPropagation(handleClick)}>
 * ```
 */
export function stopPropagation<T extends Event>(
	handler: (event: T) => void | Promise<void>
): (event: T) => void {
	return (event: T) => {
		event.stopPropagation();
		handler(event);
	};
}

/**
 * Wrap an event handler to call both preventDefault and stopPropagation
 *
 * @example
 * ```typescript
 * <button onClick={stopEvent(handleClick)}>
 * ```
 */
export function stopEvent<T extends Event>(
	handler: (event: T) => void | Promise<void>
): (event: T) => void {
	return (event: T) => {
		event.preventDefault();
		event.stopPropagation();
		handler(event);
	};
}

/**
 * Extract form data as typed object
 *
 * @example
 * ```typescript
 * interface LoginData {
 *   email: string;
 *   password: string;
 * }
 *
 * function handleSubmit(e: FormEvent) {
 *   const data = extractFormData<LoginData>(e.currentTarget);
 *   // data is { email: string, password: string }
 * }
 * ```
 */
export function extractFormData<T extends Record<string, unknown>>(
	form: HTMLFormElement
): T {
	const formData = new FormData(form);
	const data: Record<string, unknown> = {};

	for (const [key, value] of formData.entries()) {
		// Handle multiple values for same key (e.g., checkboxes)
		if (key in data) {
			// Convert to array if not already
			if (!Array.isArray(data[key])) {
				data[key] = [data[key]];
			}
			data[key].push(value);
		} else {
			data[key] = value;
		}
	}

	return data as T;
}

/**
 * Extract form data with custom transformers
 *
 * @example
 * ```typescript
 * const data = extractFormDataWith(form, {
 *   age: (value) => parseInt(value as string, 10),
 *   isSubscribed: (value) => value === "on",
 * });
 * ```
 */
export function extractFormDataWith<T extends Record<string, unknown>>(
	form: HTMLFormElement,
	transformers: Partial<Record<keyof T, (value: FormDataEntryValue) => unknown>>
): T {
	const formData = new FormData(form);
	const data: Record<string, unknown> = {};

	for (const [key, value] of formData.entries()) {
		const transformer = transformers[key as keyof T];
		data[key] = transformer ? transformer(value) : value;
	}

	return data as T;
}

/**
 * Create a keyboard event handler for specific keys
 *
 * @example
 * ```typescript
 * <input onKeyDown={onKey("Enter", handleSubmit)} />
 * ```
 */
export function onKey<T extends KeyboardEvent>(
	key: string | string[],
	handler: (event: T) => void
): (event: T) => void {
	const keys = Array.isArray(key) ? key : [key];
	return (event: T) => {
		if (keys.includes(event.key)) {
			handler(event);
		}
	};
}

/**
 * Create a keyboard event handler that prevents default for specific keys
 *
 * @example
 * ```typescript
 * <input onKeyDown={onKeyPrevent("Enter", handleSubmit)} />
 * ```
 */
export function onKeyPrevent<T extends KeyboardEvent>(
	key: string | string[],
	handler: (event: T) => void
): (event: T) => void {
	const keys = Array.isArray(key) ? key : [key];
	return (event: T) => {
		if (keys.includes(event.key)) {
			event.preventDefault();
			handler(event);
		}
	};
}

/**
 * Combine multiple event handlers into one
 *
 * @example
 * ```typescript
 * <button onClick={combineHandlers(track, submit)}>
 * ```
 */
export function combineHandlers<T extends Event>(
	...handlers: Array<(event: T) => void>
): (event: T) => void {
	return (event: T) => {
		for (const handler of handlers) {
			handler(event);
		}
	};
}
