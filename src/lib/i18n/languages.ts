/**
 * Canonical language table used across the site renderer, editor v1, and editor v2.
 *
 * Each entry has:
 *   code        — BCP-47 language tag
 *   label       — English display name (e.g. "Vietnamese")
 *   nativeLabel — Name in the language itself (e.g. "Tiếng Việt")
 *   flag        — Emoji flag
 */

export interface Language {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en",    label: "English",                    nativeLabel: "English",       flag: "🇺🇸" },
  { code: "vi",    label: "Vietnamese",                  nativeLabel: "Tiếng Việt",    flag: "🇻🇳" },
  { code: "es",    label: "Spanish",                     nativeLabel: "Español",       flag: "🇪🇸" },
  { code: "fr",    label: "French",                      nativeLabel: "Français",      flag: "🇫🇷" },
  { code: "zh-CN", label: "Chinese (Simplified)",        nativeLabel: "中文 (简体)",   flag: "🇨🇳" },
  { code: "zh-TW", label: "Chinese (Traditional)",       nativeLabel: "中文 (繁體)",   flag: "🇹🇼" },
  { code: "ko",    label: "Korean",                      nativeLabel: "한국어",         flag: "🇰🇷" },
  { code: "ja",    label: "Japanese",                    nativeLabel: "日本語",         flag: "🇯🇵" },
  { code: "de",    label: "German",                      nativeLabel: "Deutsch",       flag: "🇩🇪" },
  { code: "pt",    label: "Portuguese",                  nativeLabel: "Português",     flag: "🇧🇷" },
  { code: "it",    label: "Italian",                     nativeLabel: "Italiano",      flag: "🇮🇹" },
  { code: "th",    label: "Thai",                        nativeLabel: "ภาษาไทย",       flag: "🇹🇭" },
  { code: "tl",    label: "Filipino",                    nativeLabel: "Filipino",      flag: "🇵🇭" },
  { code: "hi",    label: "Hindi",                       nativeLabel: "हिन्दी",          flag: "🇮🇳" },
  { code: "ar",    label: "Arabic",                      nativeLabel: "العربية",        flag: "🇸🇦" },
];

/** Quick lookup maps derived from the canonical list. */
export const LANG_NATIVE: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.nativeLabel]),
);

export const LANG_FLAGS: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.flag]),
);
