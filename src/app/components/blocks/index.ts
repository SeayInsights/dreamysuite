import { HomeHeroBlock } from './HomeHeroBlock'
import { HeaderBlock } from './HeaderBlock'
import { MultiTextBlock } from './MultiTextBlock'
import { CountdownBlock } from './CountdownBlock'
import { ImagesBlock } from './ImagesBlock'
import { YoutubeBlock } from './YoutubeBlock'
import { SpacerBlock } from './SpacerBlock'
import { VenueMapBlock } from './VenueMapBlock'
// Consolidated (Task 18)
import { MediaVideoBlock } from './MediaVideoBlock'
import { GalleryBlock } from './GalleryBlock'
import { InfoCardBlock } from './InfoCardBlock'
// New (Task 19)
import { RsvpFormBlock } from './RsvpFormBlock'
import { StoryTimelineBlock } from './StoryTimelineBlock'
import { GuestBookBlock } from './GuestBookBlock'
// New (Task 3)
import { ScheduleBlock } from './ScheduleBlock'
import { ContentCardBlock } from './ContentCardBlock'
import { RegistryBlock } from './RegistryBlock'

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
  HomeHeroBlock,
  HeaderBlock,
  MultiTextBlock,
  CountdownBlock,
  ImagesBlock,
  YoutubeBlock,
  SpacerBlock,
  VenueMapBlock,
  MediaVideoBlock,
  GalleryBlock,
  InfoCardBlock,
  RsvpFormBlock,
  StoryTimelineBlock,
  GuestBookBlock,
  ScheduleBlock,
  ContentCardBlock,
  RegistryBlock,
}
