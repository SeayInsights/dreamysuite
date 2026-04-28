/**
 * CSS Sanitization Utilities
 *
 * Functions for sanitizing user-provided CSS to prevent XSS and other attacks.
 */

const BLOCKED_AT_RULES_SRC = /@import\b|@charset\b|@namespace\b/gi.source;
const BLOCKED_FUNCTIONS_SRC =
	/expression\s*\(|javascript\s*:|(?:^|[;\s])-moz-binding\s*:/gi.source;
const BLOCKED_URL_SRC =
	/url\s*\(\s*(?:['"]?\s*(?:https?:|\/\/|data:(?!image\/)))/gi.source;

/**
 * Result of CSS sanitization
 */
export interface SanitizeResult {
	/** Sanitized CSS with dangerous patterns removed */
	css: string;
	/** List of security issues found and blocked */
	errors: string[];
}

/**
 * Sanitize user-provided CSS to prevent XSS attacks
 *
 * Blocks:
 * - At-rules: @import, @charset, @namespace
 * - JavaScript expressions: expression(), javascript:, -moz-binding
 * - External URLs: http://, https://, // (except data:image/)
 *
 * Blocked patterns are replaced with comment placeholders
 *
 * @param raw - Raw CSS string from user input
 * @returns Sanitized CSS and list of errors found
 *
 * @example
 * const userCss = '.safe { color: red; } @import url("evil.css");';
 * const result = sanitizeCss(userCss);
 *
 * // result.css contains sanitized CSS with blocked patterns removed
 * // result.errors lists security issues found
 */
export function sanitizeCss(raw: string): SanitizeResult {
	const errors: string[] = [];
	let css = raw;

	const atRules = new RegExp(BLOCKED_AT_RULES_SRC, "gi");
	if (atRules.test(css)) {
		errors.push("@import, @charset, and @namespace are not allowed");
		css = css.replace(new RegExp(BLOCKED_AT_RULES_SRC, "gi"), "/* blocked */");
	}

	const fns = new RegExp(BLOCKED_FUNCTIONS_SRC, "gi");
	if (fns.test(css)) {
		errors.push("JavaScript expressions are not allowed in CSS");
		css = css.replace(new RegExp(BLOCKED_FUNCTIONS_SRC, "gi"), "/* blocked */");
	}

	const urls = new RegExp(BLOCKED_URL_SRC, "gi");
	if (urls.test(css)) {
		errors.push("url() with external origins is not allowed");
		css = css.replace(new RegExp(BLOCKED_URL_SRC, "gi"), "/* blocked-url */(");
	}

	return { css, errors };
}
