import type {
	AIGenerateTextInput,
	AIGenerateImageInput,
	AIModelDescriptor,
} from "./provider";
import { NotImplementedError } from "./provider";
import { getAdapter, listAdapters } from "./adapters";

export type {
	AIProvider,
	AIGenerateTextInput,
	AIGenerateImageInput,
	AIModelDescriptor,
} from "./provider";
export { NotImplementedError } from "./provider";
export { registerAdapter, getAdapter, listAdapters } from "./adapters";

function resolveAdapter(preferredId?: string) {
	if (preferredId) {
		const adapter = getAdapter(preferredId);
		if (!adapter) throw new NotImplementedError(`adapter:${preferredId}`);
		return adapter;
	}
	const first = listAdapters()[0];
	if (!first) throw new NotImplementedError("ai (no adapters registered)");
	return first;
}

export async function generateText(
	input: AIGenerateTextInput,
	providerId?: string,
): Promise<string> {
	return resolveAdapter(providerId).generateText(input);
}

export async function generateImage(
	input: AIGenerateImageInput,
	providerId?: string,
): Promise<{ url: string }> {
	return resolveAdapter(providerId).generateImage(input);
}

export async function listModels(
	providerId?: string,
): Promise<AIModelDescriptor[]> {
	return resolveAdapter(providerId).listModels();
}
