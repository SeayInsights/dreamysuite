import type { AIProvider } from "../provider";

const adapters = new Map<string, AIProvider>();

export function registerAdapter(adapter: AIProvider): void {
	adapters.set(adapter.id, adapter);
}

export function getAdapter(id: string): AIProvider | undefined {
	return adapters.get(id);
}

export function listAdapters(): AIProvider[] {
	return Array.from(adapters.values());
}
