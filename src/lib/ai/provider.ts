/**
 * AI provider interface — architectural hook reserved per DreamySuite editor-overhaul spec.
 *
 * No AI functionality ships with the editor-overhaul sprint. This file defines the
 * provider contract so AI features can bolt on later without refactoring the editor.
 * See: .planning/dreamysuite-editor-overhaul.md (AI architectural hooks)
 */

export type AIGenerateTextInput = {
	prompt: string;
	model?: string;
	maxTokens?: number;
	temperature?: number;
	signal?: AbortSignal;
};

export type AIGenerateImageInput = {
	prompt: string;
	model?: string;
	size?: "square" | "portrait" | "landscape";
	signal?: AbortSignal;
};

export type AIModelDescriptor = {
	id: string;
	displayName: string;
	kind: "text" | "image";
};

export interface AIProvider {
	readonly id: string;
	readonly displayName: string;
	generateText(input: AIGenerateTextInput): Promise<string>;
	generateImage(input: AIGenerateImageInput): Promise<{ url: string }>;
	listModels(): Promise<AIModelDescriptor[]>;
}

export class NotImplementedError extends Error {
	constructor(method: string) {
		super(`AI provider method '${method}' is not implemented. AI features are deferred; this is a reserved architectural hook.`);
		this.name = "NotImplementedError";
	}
}
