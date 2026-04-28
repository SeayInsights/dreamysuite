import { LucideIcon, Plus, FileText, Globe, Settings } from "lucide-react";

/**
 * Panel identifiers for sidebar content areas.
 * Each panel ID maps to an existing tray component.
 */
export type PanelId =
  | "elements"      // ElementsTray - text, images, buttons, etc.
  | "media"         // MediaTray - upload and manage media assets
  | "effects"       // EffectsTray - animations and transitions
  | "page-list"     // PageListTray - manage pages
  | "navigation"    // NavigationTray - menu structure
  | "layers"        // LayersTray - element hierarchy
  | "theme"         // ThemeTray - colors, fonts, spacing
  | "language"      // LanguageTray - i18n settings
  | "music"         // MusicTray - background audio
  | "site-settings"; // SiteSettingsTray - general site config

/**
 * Sidebar section definition.
 * Sections can have multiple nested panels or a single direct panel.
 */
export interface SidebarSection {
  id: string;
  label: string;
  icon: LucideIcon;
  panels?: PanelId[];  // For sections with nested sub-panels
  panel?: PanelId;     // For single-panel sections (e.g., Settings)
}

/**
 * New sidebar structure - 4 top-level sections with nested panels.
 *
 * Reduces cognitive load from 10 flat items to 4 logical groups.
 * Total panels remains 10, but organized by workflow:
 *
 * - **Add** (3 panels): Content creation tools
 * - **Pages** (3 panels): Structure and organization
 * - **Site** (3 panels): Global styling and features
 * - **Settings** (1 panel): Configuration
 *
 * This structure aligns with user mental models:
 * "I want to add something" vs "I want to configure the site"
 */
export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'add',
    label: 'Add',
    icon: Plus,
    panels: ['elements', 'media', 'effects']
  },
  {
    id: 'pages',
    label: 'Pages',
    icon: FileText,
    panels: ['page-list', 'navigation', 'layers']
  },
  {
    id: 'site',
    label: 'Site',
    icon: Globe,
    panels: ['theme', 'language', 'music']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    panel: 'site-settings' // Single panel, no nesting
  }
];
