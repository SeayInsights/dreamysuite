import type { ThemeColors } from "@/app/stores/slices/theme";

function hexToHsl(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [0, 0, 100];
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, l + amount));
}

function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

function isDark(hex: string): boolean {
  const [, , l] = hexToHsl(hex);
  return l < 45;
}

export function themeSwatches(colors: ThemeColors): string[] {
  return [
    colors.background,
    lighten(colors.background, 5),
    lighten(colors.primary, 40),
    lighten(colors.accent, 35),
    colors.accent,
    colors.secondary,
    colors.primary,
    colors.text,
    darken(colors.primary, 15),
    darken(colors.accent, 15),
    darken(colors.secondary, 15),
    "#000000",
  ];
}

export function themeGradients(
  colors: ThemeColors,
): { label: string; value: string; dark?: boolean }[] {
  return [
    {
      label: "Primary → Accent",
      value: `linear-gradient(135deg,${colors.primary} 0%,${colors.accent} 100%)`,
      dark: isDark(colors.primary),
    },
    {
      label: "Accent → Secondary",
      value: `linear-gradient(135deg,${colors.accent} 0%,${colors.secondary} 100%)`,
      dark: isDark(colors.accent),
    },
    {
      label: "Background → Accent",
      value: `linear-gradient(135deg,${colors.background} 0%,${colors.accent} 100%)`,
    },
    {
      label: "Background → Primary",
      value: `linear-gradient(135deg,${colors.background} 0%,${colors.primary} 100%)`,
    },
    {
      label: "Light Primary",
      value: `linear-gradient(135deg,${lighten(colors.primary, 35)} 0%,${colors.primary} 100%)`,
      dark: isDark(colors.primary),
    },
    {
      label: "Light Accent",
      value: `linear-gradient(135deg,${lighten(colors.accent, 35)} 0%,${colors.accent} 100%)`,
      dark: isDark(colors.accent),
    },
    {
      label: "Deep Primary",
      value: `linear-gradient(135deg,${colors.primary} 0%,${darken(colors.primary, 20)} 100%)`,
      dark: true,
    },
    {
      label: "Deep Accent",
      value: `linear-gradient(135deg,${colors.accent} 0%,${darken(colors.accent, 20)} 100%)`,
      dark: true,
    },
  ];
}
