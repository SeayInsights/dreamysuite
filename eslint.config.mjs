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
		// WebGL effect files are adapted third-party code using @ts-nocheck,
		// split let/assignment patterns, and untyped shader variables.
		// These rules are intentionally off for this directory only.
		files: ["src/lib/effects/**"],
		rules: {
			"prefer-const": "off",
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
];

export default eslintConfig;
