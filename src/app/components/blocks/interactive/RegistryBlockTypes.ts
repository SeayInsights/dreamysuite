// Shared types and constants for RegistryBlock and its sub-components

export interface RegistryItem {
  id: string;
  type: "store" | "fund";
  store?: string;
  customName?: string;
  logoUrl?: string;
  url?: string;
  message?: string;
  fundTitle?: string;
  fundDescription?: string;
  fundGoal?: number;
  platform?: "paypal" | "venmo" | "zelle" | "cashapp" | "other";
  platformUrl?: string;
  platformHandle?: string;
}

export interface Block { id: string; type: string; [key: string]: unknown }

export type PopoverType = "url" | "fund" | "goal";
export interface PopoverState {
  type: PopoverType;
  itemId: string;
  rect: DOMRect;
}

// ── Preset store logos (inline SVG data URIs for reliability) ─────────────────

export const STORE_LOGOS: Record<string, string> = {
  "Amazon": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30'%3E%3Ctext x='50' y='22' text-anchor='middle' font-family='Arial,sans-serif' font-size='18' font-weight='bold' fill='%23232F3E'%3Eamazon%3C/text%3E%3Cpath d='M28 24c12-8 28-12 44-8' fill='none' stroke='%23FF9900' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E",
  "Target": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%23CC0000'/%3E%3Ccircle cx='20' cy='20' r='12' fill='white'/%3E%3Ccircle cx='20' cy='20' r='6' fill='%23CC0000'/%3E%3C/svg%3E",
  "Crate & Barrel": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 30'%3E%3Ctext x='60' y='20' text-anchor='middle' font-family='Georgia,serif' font-size='14' fill='%23333'%3ECrate %26 Barrel%3C/text%3E%3C/svg%3E",
  "Williams Sonoma": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 30'%3E%3Ctext x='70' y='20' text-anchor='middle' font-family='Georgia,serif' font-size='13' fill='%23333'%3EWilliams Sonoma%3C/text%3E%3C/svg%3E",
  "Bed Bath & Beyond": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 30'%3E%3Ctext x='75' y='20' text-anchor='middle' font-family='Arial,sans-serif' font-size='12' font-weight='bold' fill='%230055A6'%3EBed Bath %26 Beyond%3C/text%3E%3C/svg%3E",
  "Pottery Barn": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 30'%3E%3Ctext x='60' y='20' text-anchor='middle' font-family='Georgia,serif' font-size='14' fill='%23333'%3EPottery Barn%3C/text%3E%3C/svg%3E",
  "Sur La Table": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 30'%3E%3Ctext x='60' y='20' text-anchor='middle' font-family='Georgia,serif' font-size='14' fill='%23333'%3ESur La Table%3C/text%3E%3C/svg%3E",
  "Zola": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3Ctext x='30' y='22' text-anchor='middle' font-family='Arial,sans-serif' font-size='20' font-weight='bold' fill='%230B4F6C'%3EZola%3C/text%3E%3C/svg%3E",
  "MyRegistry": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30'%3E%3Ctext x='50' y='20' text-anchor='middle' font-family='Arial,sans-serif' font-size='14' font-weight='bold' fill='%23E8533F'%3EMyRegistry%3C/text%3E%3C/svg%3E",
  "Blueprint Registry": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 30'%3E%3Ctext x='70' y='20' text-anchor='middle' font-family='Arial,sans-serif' font-size='13' font-weight='bold' fill='%232B6CB0'%3EBlueprint Registry%3C/text%3E%3C/svg%3E",
  "Babylist": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 30'%3E%3Ctext x='40' y='20' text-anchor='middle' font-family='Arial,sans-serif' font-size='15' font-weight='bold' fill='%23F06595'%3EBabylist%3C/text%3E%3C/svg%3E",
  "REI": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 30'%3E%3Ctext x='25' y='22' text-anchor='middle' font-family='Arial,sans-serif' font-size='20' font-weight='bold' fill='%23333'%3EREI%3C/text%3E%3C/svg%3E",
};

export const PRESET_STORES = [
  "Amazon", "Target", "Crate & Barrel", "Williams Sonoma",
  "Bed Bath & Beyond", "Pottery Barn", "Sur La Table", "Zola",
  "MyRegistry", "Blueprint Registry", "Babylist", "REI",
] as const;

export const PLATFORM_LABELS: Record<string, string> = {
  paypal: "PayPal",
  venmo: "Venmo",
  zelle: "Zelle",
  cashapp: "Cash App",
  other: "Other",
};

export const PLATFORM_ICONS: Record<string, string> = {
  paypal: "$",
  venmo: "V",
  zelle: "Z",
  cashapp: "$",
  other: "...",
};
