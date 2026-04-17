"use client";

import "@/styles/site-blocks.css";
import { EditorShell, type EditorV2Site, type EditorV2User } from "./EditorShell";

export { EditorShell };
export type { EditorV2Site, EditorV2User };

interface Props {
	site: EditorV2Site;
	user: EditorV2User;
}

export function SiteEditorV2({ site, user }: Props) {
	return <EditorShell site={site} user={user} />;
}
