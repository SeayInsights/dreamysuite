const BLOCKED_AT_RULES_SRC = /@import\b|@charset\b|@namespace\b/gi.source;
const BLOCKED_FUNCTIONS_SRC =
	/expression\s*\(|javascript\s*:|(?:^|[;\s])-moz-binding\s*:/gi.source;
const BLOCKED_URL_SRC =
	/url\s*\(\s*(?:['"]?\s*(?:https?:|\/\/|data:(?!image\/)))/gi.source;

export interface SanitizeResult {
	css: string;
	errors: string[];
}

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
