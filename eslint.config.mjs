import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends("next/core-web-vitals", "next/typescript"),
	{
		rules: {
			// Downgrade to warn — @ts-nocheck is used intentionally during active dev
			"@typescript-eslint/ban-ts-comment": "warn",
			// Downgrade to warn — `any` is acceptable until types are fully locked down
			"@typescript-eslint/no-explicit-any": "warn",
		},
	},
	{
		// WebGL effect files use split let/assignment patterns that can't safely
		// be converted to const by the linter (reference before assignment in closures)
		files: ["src/lib/effects/**"],
		rules: {
			"prefer-const": "off",
		},
	},
];

export default eslintConfig;
