import { LucideIcon, Plus, FileText, Layers, Palette, Image, Globe, Settings } from "lucide-react";

/**
 * Panel identifiers for sidebar content areas.
 * Each panel ID maps to an existing tray component.
 */
export type PanelId =
  | "elements"      // ElementsTray - text, images, buttons, etc.
  | "photos"        // PhotosTray - upload and manage photos
  | "videos"        // VideosTray - upload and manage videos
  | "music"         // MusicTray - background audio
  | "effects"       // EffectsTray - animations and transitions
  | "page-list"     // PageListTray - manage pages
  | "navigation"    // NavigationTray - menu structure
  | "layers"        // LayersTray - element hierarchy
  | "theme"         // ThemeTray - colors, fonts, spacing
  | "language"      // LanguageTray - i18n settings
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
 * New sidebar structure - 7 top-level sections (Wix-style organization).
 *
 * Reduces cognitive load by promoting frequently-used panels to top level
 * while grouping related content into tabbed sections:
 *
 * - **Add** (direct): Content creation tools
 * - **Pages** (direct): Page management
 * - **Layers** (direct): Element hierarchy (promoted from nested)
 * - **Design/Theme** (3 tabs): Navigation, theme, effects
 * - **Media** (3 tabs): Photos, videos, music
 * - **Languages** (direct): i18n settings
 * - **Settings** (direct): Site configuration
 *
 * This structure balances quick access to core tools with logical grouping
 * of related features, matching user workflows in modern site builders.
 */
export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'add-elements',
    label: 'Add',
    icon: Plus,
    panel: 'elements'
  },
  {
    id: 'pages',
    label: 'Pages',
    icon: FileText,
    panel: 'page-list'
  },
  {
    id: 'layers',
    label: 'Layers',
    icon: Layers,
    panel: 'layers'
  },
  {
    id: 'design-theme',
    label: 'Design',
    icon: Palette,
    panels: ['navigation', 'theme', 'effects']
  },
  {
    id: 'media',
    label: 'Media',
    icon: Image,
    panels: ['photos', 'videos', 'music']
  },
  {
    id: 'languages',
    label: 'Languages',
    icon: Globe,
    panel: 'language'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    panel: 'site-settings'
  }
];
