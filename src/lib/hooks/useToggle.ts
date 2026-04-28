/**
 * Toggle Hook - Single Source of Truth
 *
 * Simplifies boolean state toggles with a cleaner API than useState.
 *
 * ## Architecture Decision
 *
 * This hook provides a more ergonomic API for boolean toggles compared
 * to raw useState. It provides:
 * - Single function to toggle state
 * - Explicit setTrue/setFalse helpers
 * - Optional onChange callback
 * - Cleaner than `setState(!state)` pattern
 *
 * ## Why This Pattern?
 *
 * **Before:** Every boolean toggle used verbose useState
 * - `const [isOpen, setIsOpen] = useState(false)`
 * - `onClick={() => setIsOpen(!isOpen)}` - easy to typo
 * - `onClick={() => setIsOpen(true)}` - verbose
 * - No onChange callbacks
 *
 * **After:** Cleaner API for toggles
 * - `const [isOpen, toggle, setOpen] = useToggle()`
 * - `onClick={toggle}` - clean and simple
 * - `onClick={() => setOpen(true)}` - explicit helpers
 * - Built-in onChange support
 *
 * ## Usage Guidelines
 *
 * ### Basic Toggle
 * ```typescript
 * import { useToggle } from "@/lib/hooks";
 *
 * function Accordion() {
 *   const [isExpanded, toggle] = useToggle(false);
 *
 *   return (
 *     <div>
 *       <button onClick={toggle}>
 *         {isExpanded ? "Collapse" : "Expand"}
 *       </button>
 *       {isExpanded && <div>Content</div>}
 *     </div>
 *   );
 * }
 * ```
 *
 * ### With Explicit Setters
 * ```typescript
 * function Modal() {
 *   const [isOpen, toggle, setIsOpen] = useToggle(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Open</button>
 *       {isOpen && (
 *         <div>
 *           <button onClick={() => setIsOpen(false)}>Close</button>
 *         </div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 *
 * ### With onChange Callback
 * ```typescript
 * const [isDark, toggleTheme] = useToggle(false, {
 *   onChange: (isDark) => {
 *     document.body.classList.toggle("dark", isDark);
 *   },
 * });
 * ```
 *
 * ## Adding New Features
 *
 * 1. Add new option to `ToggleOptions` interface
 * 2. Handle in toggle/set functions
 * 3. Update JSDoc examples
 *
 * ## Refactor Status
 *
 * - [x] Core hook implementation
 * - [x] Toggle function
 * - [x] Explicit setters
 * - [x] onChange callback
 * - [ ] Migrate modal/drawer toggles
 * - [ ] Migrate accordion toggles
 * - [ ] Migrate visibility toggles
 *
 * @module lib/hooks/useToggle
 */

import { useState, useCallback } from "react";

export interface ToggleOptions {
	/**
	 * Callback fired when state changes
	 */
	onChange?: (value: boolean) => void;
}

export type ToggleResult = [
	/**
	 * Current boolean state
	 */
	boolean,
	/**
	 * Toggle state (true ↔ false)
	 */
	() => void,
	/**
	 * Set state with helpers { on: () => void, off: () => void, set: (value: boolean) => void }
	 */
	{
		on: () => void;
		off: () => void;
		set: (value: boolean) => void;
	}
];

/**
 * Boolean toggle hook with explicit setters
 */
export function useToggle(initialValue = false, options: ToggleOptions = {}): ToggleResult {
	const { onChange } = options;

	const [value, setValue] = useState(initialValue);

	const toggle = useCallback(() => {
		setValue((prev) => {
			const next = !prev;
			if (onChange) onChange(next);
			return next;
		});
	}, [onChange]);

	const setTrue = useCallback(() => {
		setValue((prev) => {
			if (prev === true) return prev; // No-op if already true
			if (onChange) onChange(true);
			return true;
		});
	}, [onChange]);

	const setFalse = useCallback(() => {
		setValue((prev) => {
			if (prev === false) return prev; // No-op if already false
			if (onChange) onChange(false);
			return false;
		});
	}, [onChange]);

	const set = useCallback(
		(newValue: boolean) => {
			setValue((prev) => {
				if (prev === newValue) return prev; // No-op if same
				if (onChange) onChange(newValue);
				return newValue;
			});
		},
		[onChange]
	);

	return [value, toggle, { on: setTrue, off: setFalse, set }];
}
