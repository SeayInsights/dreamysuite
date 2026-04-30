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
  "header": ALL_ON,
  "multi-text": ALL_ON,
  "video": ALL_ON,
  "countdown": ALL_ON,
  "images": ALL_ON,
  "youtube": ALL_ON,
  "spacer": {
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
  "rsvp": ALL_ON,
  "media-video": ALL_ON,
  "gallery": ALL_ON,
  "info-card": ALL_ON,
  "rsvp-form": ALL_ON,
  "story-timeline": ALL_ON,
  "guest-book": ALL_ON,
  "faq": ALL_ON,
  "schedule": ALL_ON,
  "fun-facts": ALL_ON,
  "travel": ALL_ON,
  "content-card": ALL_ON,
  "registry": ALL_ON,
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

const ANIMATION_BLOCK_FLAGS: Record<string, AnimationFlags> = {
  "header":         { allowText: true,  allowImage: false },
  "multi-text":     { allowText: true,  allowImage: false },
  "info-card":      { allowText: true,  allowImage: false },
  "content-card":   { allowText: true,  allowImage: false },
  "guest-book":     { allowText: true,  allowImage: false },
  "faq":            { allowText: true,  allowImage: false },
  "fun-facts":      { allowText: true,  allowImage: false },
  "story-timeline": { allowText: true,  allowImage: false },
  "home-hero":      { allowText: false, allowImage: true  },
  "images":         { allowText: false, allowImage: true  },
  "gallery":        { allowText: false, allowImage: true  },
  "photo-split":    { allowText: true,  allowImage: true  },
};

export function getAnimationPresetFilter(blockType: string): AnimationFlags {
  return ANIMATION_BLOCK_FLAGS[blockType] ?? { allowText: false, allowImage: false };
}
