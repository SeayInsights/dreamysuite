export interface BlockInspectorConfig {
  showBackground: boolean;
  showPadding: boolean;
  showVisibility: boolean;
  showMotion: boolean;
  showTiming: boolean;
}

const ALL_ON: BlockInspectorConfig = {
  showBackground: true,
  showPadding: true,
  showVisibility: true,
  showMotion: true,
  showTiming: true,
};

export const BLOCK_INSPECTOR_CONFIG: Record<string, BlockInspectorConfig> = {
  "home-hero": ALL_ON,
  header: ALL_ON,
  "multi-text": ALL_ON,
  video: ALL_ON,
  countdown: ALL_ON,
  images: ALL_ON,
  youtube: ALL_ON,
  spacer: {
    showBackground: false,
    showPadding: false,
    showVisibility: false,
    showMotion: false,
    showTiming: false,
  },
  "registry-card": ALL_ON,
  "hotel-card": ALL_ON,
  "venue-map": ALL_ON,
  "photo-split": ALL_ON,
  rsvp: ALL_ON,
  "media-video": ALL_ON,
  gallery: ALL_ON,
  "info-card": ALL_ON,
  "rsvp-form": ALL_ON,
  "story-timeline": ALL_ON,
  "guest-book": ALL_ON,
  faq: ALL_ON,
  schedule: ALL_ON,
  "fun-facts": ALL_ON,
  travel: ALL_ON,
  "content-card": ALL_ON,
  registry: ALL_ON,
};

export const DEFAULT_INSPECTOR_CONFIG: BlockInspectorConfig = {
  showBackground: true,
  showPadding: true,
  showVisibility: true,
  showMotion: true,
  showTiming: false,
};

export function getInspectorConfig(blockType: string): BlockInspectorConfig {
  return BLOCK_INSPECTOR_CONFIG[blockType] ?? DEFAULT_INSPECTOR_CONFIG;
}

interface AnimationFlags {
  allowText: boolean;
  allowImage: boolean;
}

const TEXT_ONLY: AnimationFlags = { allowText: true, allowImage: false };
const IMAGE_ONLY: AnimationFlags = { allowText: false, allowImage: true };
const BOTH: AnimationFlags = { allowText: true, allowImage: true };

const ANIMATION_BLOCK_FLAGS: Record<string, AnimationFlags> = {
  header: TEXT_ONLY,
  "multi-text": TEXT_ONLY,
  "info-card": BOTH,
  "content-card": BOTH,
  "guest-book": TEXT_ONLY,
  faq: TEXT_ONLY,
  "fun-facts": TEXT_ONLY,
  "story-timeline": TEXT_ONLY,
  schedule: TEXT_ONLY,
  travel: TEXT_ONLY,
  "home-hero": BOTH,
  images: IMAGE_ONLY,
  gallery: IMAGE_ONLY,
  "photo-split": BOTH,
  video: IMAGE_ONLY,
  "media-video": IMAGE_ONLY,
  youtube: IMAGE_ONLY,
  countdown: BOTH,
  rsvp: BOTH,
  "rsvp-form": BOTH,
  registry: BOTH,
  "registry-card": BOTH,
  "hotel-card": BOTH,
  "venue-map": IMAGE_ONLY,
};

const DEFAULT_ANIMATION_FLAGS: AnimationFlags = {
  allowText: true,
  allowImage: true,
};

export function getAnimationPresetFilter(blockType: string): AnimationFlags {
  return ANIMATION_BLOCK_FLAGS[blockType] ?? DEFAULT_ANIMATION_FLAGS;
}
