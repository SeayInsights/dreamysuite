// Layout blocks
import { HomeHeroBlock } from './layout/HomeHeroBlock'
import { HeaderBlock } from './layout/HeaderBlock'
import { SpacerBlock } from './layout/SpacerBlock'

// Content blocks
import { MultiTextBlock } from './content/MultiTextBlock'
import { InfoCardBlock } from './content/InfoCardBlock'
import { ContentCardBlock } from './content/ContentCardBlock'

// Interactive blocks
import { CountdownBlock } from './interactive/CountdownBlock'
import { RsvpFormBlock } from './interactive/RsvpFormBlock'
import { GuestBookBlock } from './interactive/GuestBookBlock'
import { ScheduleBlock } from './interactive/ScheduleBlock'
import { RegistryBlock } from './interactive/RegistryBlock'

// Media blocks
import { ImagesBlock } from './media/ImagesBlock'
import { YoutubeBlock } from './media/YoutubeBlock'
import { VenueMapBlock } from './media/VenueMapBlock'
import { MediaVideoBlock } from './media/MediaVideoBlock'
import { GalleryBlock } from './media/GalleryBlock'
import { StoryTimelineBlock } from './media/StoryTimelineBlock'

interface Block {
  id: string
  type: string
  [key: string]: unknown
}

export const BLOCK_COMPONENTS: Record<string, React.ComponentType<{ block: Block }>> = {
  // Legacy (kept for un-migrated DB records)
  'home-hero':     HomeHeroBlock,
  'couple':        HomeHeroBlock,
  'header':        HeaderBlock,
  'multi-text':    MultiTextBlock,
  'video':         MediaVideoBlock,
  'countdown':     CountdownBlock,
  'images':        ImagesBlock,
  'youtube':       YoutubeBlock,
  'spacer':        SpacerBlock,
  'registry-card': InfoCardBlock,
  'hotel-card':    InfoCardBlock,
  'venue-map':     VenueMapBlock,
  'photo-split':   GalleryBlock,
  'rsvp':          RsvpFormBlock,
  // Consolidated
  'media-video':   MediaVideoBlock,
  'gallery':       GalleryBlock,
  'info-card':     InfoCardBlock,
  // New (Task 19)
  'rsvp-form':     RsvpFormBlock,
  'story-timeline': StoryTimelineBlock,
  'guest-book':    GuestBookBlock,
  // New (Task 3)
  'faq':           ContentCardBlock,
  'schedule':      ScheduleBlock,
  'fun-facts':     ContentCardBlock,
  'travel':        ContentCardBlock,
  'content-card':  ContentCardBlock,
  'registry':      RegistryBlock,
}

export {
  // Layout
  HomeHeroBlock,
  HeaderBlock,
  SpacerBlock,
  // Content
  MultiTextBlock,
  InfoCardBlock,
  ContentCardBlock,
  // Interactive
  CountdownBlock,
  RsvpFormBlock,
  GuestBookBlock,
  ScheduleBlock,
  RegistryBlock,
  // Media
  ImagesBlock,
  YoutubeBlock,
  VenueMapBlock,
  MediaVideoBlock,
  GalleryBlock,
  StoryTimelineBlock,
}
