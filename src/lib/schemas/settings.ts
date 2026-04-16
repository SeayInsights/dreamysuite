import { z } from "zod";

/**
 * Single source of truth for site_setting shape.
 * - DEFAULTS derived from `.parse({})` — remove duplicate 54-field constant.
 * - ALLOWED_FIELDS derived from `Object.keys(shape)` — no manual whitelist.
 * - Booleans (`isLive`, `showNavBrand`) stored as 0/1 integers in D1 but accepted
 *   as boolean OR integer at the API boundary via `.transform`.
 */

const intBool = z.union([z.boolean(), z.number(), z.null()]).transform((v) => {
  if (v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v ? 1 : 0;
});

export const SettingsSchema = z.object({
  eventName: z.string().nullable().default(null),
  eventDate: z.string().nullable().default(null),
  eventLocation: z.string().nullable().default(null),
  greeting: z.string().nullable().default(null),
  musicUrl: z.string().nullable().default(null),
  mainLanguage: z.string().default("en"),
  secondLanguage: z.string().nullable().default(null),
  guestPassword: z.string().nullable().default(null),
  isLive: intBool.default(0),
  headingFont: z.string().default("Georgia"),
  bodyFont: z.string().default("Inter"),
  accentColor: z.string().default("#B8921A"),
  bgColor: z.string().default("#ffffff"),
  songPages: z.string().nullable().default(null),
  songResetPages: z.string().nullable().default(null),
  headingColor: z.string().nullable().default(null),
  bodyColor: z.string().nullable().default(null),
  siteTextColor: z.string().nullable().default(null),
  siteBorderColor: z.string().nullable().default(null),
  buttonStyle: z.string().default("filled"),
  buttonBorderWidth: z.string().default("1.5px"),
  headingFontVi: z.string().nullable().default(null),
  bodyFontVi: z.string().nullable().default(null),
  navBg: z.string().default("white"),
  showNavBrand: intBool.default(1),
  navPosition: z.string().default("fixed"),
  navBrandColor: z.string().default("#1C1917"),
  navLinkColor: z.string().default("#6B6560"),
  navHighlightColor: z.string().default("#B8921A"),
  navItemsConfig: z.string().nullable().default(null),
  animation: z.string().nullable().default(null),
  bgImage: z.string().nullable().default(null),
  envelopeColor: z.string().nullable().default(null),
  sealInitials: z.string().nullable().default(null),
  cardColor: z.string().nullable().default(null),
  cardImage: z.string().nullable().default(null),
  navShape: z.string().nullable().default(null),
  navLinkPadding: z.string().nullable().default(null),
  navUnderline: z.string().default("on"),
  popupEnabled: intBool.default(1),
  popupTitle: z.string().nullable().default(null),
  popupTicker: intBool.default(0),
  popupAfterAnimation: intBool.default(0),
  popupBundle: intBool.default(0),
  musicBtnBg: z.string().nullable().default(null),
  musicBtnColor: z.string().nullable().default(null),
  marginTop: z.string().nullable().default(null),
  marginRight: z.string().nullable().default(null),
  marginBottom: z.string().nullable().default(null),
  marginLeft: z.string().nullable().default(null),
  bgImageLayer: z.string().default("behind"),
  bgImageOpacity: z.number().default(1.0),
  siteMaxWidth: z.string().nullable().default(null),
});

/** All settings with defaults applied. Single source — no duplicate object. */
export const DEFAULTS = SettingsSchema.parse({});

/** Whitelist derived from schema. Adding a field → schema change only. */
export const ALLOWED_FIELDS = Object.keys(SettingsSchema.shape) as Array<
  keyof typeof DEFAULTS
>;

/** Partial schema for PATCH-like updates — only validates fields that are present. */
export const SettingsPatchSchema = SettingsSchema.partial();

export type Settings = z.infer<typeof SettingsSchema>;
export type SettingsPatch = z.infer<typeof SettingsPatchSchema>;
