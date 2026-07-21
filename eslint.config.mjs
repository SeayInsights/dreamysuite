import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	...nextCoreWebVitals,
	...nextTypescript,
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					varsIgnorePattern: "^_",
					argsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
				},
			],
			// Lock in the effects @ts-nocheck burndown: no blanket file-level
			// suppression. Use a scoped `@ts-expect-error <reason>` instead.
			"@typescript-eslint/ban-ts-comment": [
				"error",
				{
					"ts-nocheck": true,
					"ts-ignore": true,
					"ts-expect-error": "allow-with-description",
				},
			],
		},
	},
	{
		// Adapted third-party WebGL/effect code — exempt from all lint rules
		files: ["src/lib/effects/**"],
		rules: {
			"prefer-const": "off",
			// ban-ts-comment intentionally NOT disabled here anymore — the effects
			// tree is now @ts-nocheck-free and stays that way (see global rule above).
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"@next/next/no-img-element": "off",
			"jsx-a11y/alt-text": "off",
			"react-hooks/exhaustive-deps": "off",
			"react-hooks/refs": "off",
			"react-hooks/purity": "off",
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/static-components": "off",
			"react-hooks/immutability": "off",
			"react-hooks/preserve-manual-memoization": "off",
		},
	},
	{
		// New react-hooks v5 rules (React 19) — warn only until codebase is migrated
		ignores: ["src/lib/effects/**"],
		rules: {
			"react-hooks/refs": "warn",
			"react-hooks/purity": "warn",
			"react-hooks/set-state-in-effect": "warn",
			"react-hooks/static-components": "warn",
			"react-hooks/immutability": "warn",
			"react-hooks/preserve-manual-memoization": "warn",
		},
	},
];

export default eslintConfig;
