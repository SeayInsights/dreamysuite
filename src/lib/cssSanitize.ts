const BLOCKED_AT_RULES = /@import\b|@charset\b|@namespace\b/gi;
const BLOCKED_FUNCTIONS =
	/expression\s*\(|javascript\s*:|(?:^|[;\s])-moz-binding\s*:/gi;
const BLOCKED_URL =
	/url\s*\(\s*(?:['"]?\s*(?:https?:|\/\/|data:(?!image\/)))/gi;

export interface SanitizeResult {
	css: string;
	errors: string[];
}

export function sanitizeCss(raw: string): SanitizeResult {
	const errors: string[] = [];
	let css = raw;

	if (BLOCKED_AT_RULES.test(css)) {
		errors.push("@import, @charset, and @namespace are not allowed");
		css = css.replace(BLOCKED_AT_RULES, "/* blocked */");
	}

	if (BLOCKED_FUNCTIONS.test(css)) {
		errors.push("JavaScript expressions are not allowed in CSS");
		css = css.replace(BLOCKED_FUNCTIONS, "/* blocked */");
	}

	if (BLOCKED_URL.test(css)) {
		errors.push("url() with external origins is not allowed");
		css = css.replace(BLOCKED_URL, "/* blocked-url */(");
	}

	return { css, errors };
}
