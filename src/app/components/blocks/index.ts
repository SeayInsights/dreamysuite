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

interface Block {
  id: string
  type: string
  [key: string]: unknown
}

export const BLOCK_COMPONENTS: Record<string, React.ComponentType<{ block: Block }>> = {
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
}
