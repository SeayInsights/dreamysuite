import { HomeHeroBlock } from './HomeHeroBlock'
import { HeaderBlock } from './HeaderBlock'
import { MultiTextBlock } from './MultiTextBlock'
import { VideoBlock } from './VideoBlock'
import { CountdownBlock } from './CountdownBlock'
import { ImagesBlock } from './ImagesBlock'
import { YoutubeBlock } from './YoutubeBlock'
import { SpacerBlock } from './SpacerBlock'
import { RegistryCardBlock } from './RegistryCardBlock'
import { HotelCardBlock } from './HotelCardBlock'
import { VenueMapBlock } from './VenueMapBlock'
import { PhotoSplitBlock } from './PhotoSplitBlock'
// Consolidated (Task 18)
import { MediaVideoBlock } from './MediaVideoBlock'
import { GalleryBlock } from './GalleryBlock'
import { InfoCardBlock } from './InfoCardBlock'
// New (Task 19)
import { RsvpFormBlock } from './RsvpFormBlock'
import { StoryTimelineBlock } from './StoryTimelineBlock'
import { GuestBookBlock } from './GuestBookBlock'
// New (Task 3)
import { FaqBlock } from './FaqBlock'
import { ScheduleBlock } from './ScheduleBlock'
import { FunFactsBlock } from './FunFactsBlock'
import { TravelBlock } from './TravelBlock'

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
  'video':         VideoBlock,
  'countdown':     CountdownBlock,
  'images':        ImagesBlock,
  'youtube':       YoutubeBlock,
  'spacer':        SpacerBlock,
  'registry-card': RegistryCardBlock,
  'hotel-card':    HotelCardBlock,
  'venue-map':     VenueMapBlock,
  'photo-split':   PhotoSplitBlock,
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
  'faq':           FaqBlock,
  'schedule':      ScheduleBlock,
  'fun-facts':     FunFactsBlock,
  'travel':        TravelBlock,
}

export {
  HomeHeroBlock,
  HeaderBlock,
  MultiTextBlock,
  VideoBlock,
  CountdownBlock,
  ImagesBlock,
  YoutubeBlock,
  SpacerBlock,
  RegistryCardBlock,
  HotelCardBlock,
  VenueMapBlock,
  PhotoSplitBlock,
  MediaVideoBlock,
  GalleryBlock,
  InfoCardBlock,
  RsvpFormBlock,
  StoryTimelineBlock,
  GuestBookBlock,
  FaqBlock,
  ScheduleBlock,
  FunFactsBlock,
  TravelBlock,
}
