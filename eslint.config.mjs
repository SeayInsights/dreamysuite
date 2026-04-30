import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	...nextCoreWebVitals,
	...nextTypescript,
	{
		// Adapted third-party WebGL/effect code — exempt from all lint rules
		files: ["src/lib/effects/**"],
		rules: {
			"prefer-const": "off",
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"@next/next/no-img-element": "off",
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
