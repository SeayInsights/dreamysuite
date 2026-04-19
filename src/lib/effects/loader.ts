import { lazy, type ComponentType } from "react";
import { getEffectById } from "./registry";

type Importer = () => Promise<{ default: ComponentType<any> }>;

const IMPORT_MAP: Record<string, Importer> = {
  // backgrounds
  "backgrounds/Aurora": () => import("@/lib/effects/components/backgrounds/Aurora"),
  "backgrounds/Balatro": () => import("@/lib/effects/components/backgrounds/Balatro"),
  "backgrounds/Ballpit": () => import("@/lib/effects/components/backgrounds/Ballpit"),
  "backgrounds/Beams": () => import("@/lib/effects/components/backgrounds/Beams"),
  "backgrounds/ColorBends": () => import("@/lib/effects/components/backgrounds/ColorBends"),
  "backgrounds/DarkVeil": () => import("@/lib/effects/components/backgrounds/DarkVeil"),
  "backgrounds/Dither": () => import("@/lib/effects/components/backgrounds/Dither"),
  "backgrounds/DotField": () => import("@/lib/effects/components/backgrounds/DotField"),
  "backgrounds/EvilEye": () => import("@/lib/effects/components/backgrounds/EvilEye"),
  "backgrounds/FaultyTerminal": () => import("@/lib/effects/components/backgrounds/FaultyTerminal"),
  "backgrounds/FloatingLines": () => import("@/lib/effects/components/backgrounds/FloatingLines"),
  "backgrounds/Galaxy": () => import("@/lib/effects/components/backgrounds/Galaxy"),
  "backgrounds/GradientBlinds": () => import("@/lib/effects/components/backgrounds/GradientBlinds"),
  "backgrounds/Grainient": () => import("@/lib/effects/components/backgrounds/Grainient"),
  "backgrounds/GridDistortion": () => import("@/lib/effects/components/backgrounds/GridDistortion"),
  "backgrounds/GridMotion": () => import("@/lib/effects/components/backgrounds/GridMotion"),
  "backgrounds/GridScan": () => import("@/lib/effects/components/backgrounds/GridScan"),
  "backgrounds/Hyperspeed": () => import("@/lib/effects/components/backgrounds/Hyperspeed"),
  "backgrounds/Iridescence": () => import("@/lib/effects/components/backgrounds/Iridescence"),
  "backgrounds/LetterGlitch": () => import("@/lib/effects/components/backgrounds/LetterGlitch"),
  "backgrounds/LightPillar": () => import("@/lib/effects/components/backgrounds/LightPillar"),
  "backgrounds/LightRays": () => import("@/lib/effects/components/backgrounds/LightRays"),
  "backgrounds/Lightning": () => import("@/lib/effects/components/backgrounds/Lightning"),
  "backgrounds/LineWaves": () => import("@/lib/effects/components/backgrounds/LineWaves"),
  "backgrounds/LiquidChrome": () => import("@/lib/effects/components/backgrounds/LiquidChrome"),
  "backgrounds/LiquidEther": () => import("@/lib/effects/components/backgrounds/LiquidEther"),
  "backgrounds/Orb": () => import("@/lib/effects/components/backgrounds/Orb"),
  "backgrounds/Particles": () => import("@/lib/effects/components/backgrounds/Particles"),
  "backgrounds/PixelBlast": () => import("@/lib/effects/components/backgrounds/PixelBlast"),
  "backgrounds/PixelSnow": () => import("@/lib/effects/components/backgrounds/PixelSnow"),
  "backgrounds/Plasma": () => import("@/lib/effects/components/backgrounds/Plasma"),
  "backgrounds/PlasmaWave": () => import("@/lib/effects/components/backgrounds/PlasmaWave"),
  "backgrounds/Prism": () => import("@/lib/effects/components/backgrounds/Prism"),
  "backgrounds/PrismaticBurst": () => import("@/lib/effects/components/backgrounds/PrismaticBurst"),
  "backgrounds/Radar": () => import("@/lib/effects/components/backgrounds/Radar"),
  "backgrounds/RippleGrid": () => import("@/lib/effects/components/backgrounds/RippleGrid"),
  "backgrounds/ShapeGrid": () => import("@/lib/effects/components/backgrounds/ShapeGrid"),
  "backgrounds/Silk": () => import("@/lib/effects/components/backgrounds/Silk"),
  "backgrounds/SoftAurora": () => import("@/lib/effects/components/backgrounds/SoftAurora"),
  "backgrounds/Threads": () => import("@/lib/effects/components/backgrounds/Threads"),
  "backgrounds/Waves": () => import("@/lib/effects/components/backgrounds/Waves"),
  // text
  "text/FuzzyText": () => import("@/lib/effects/components/text/FuzzyText"),
  "text/GlitchText": () => import("@/lib/effects/components/text/GlitchText"),
  "text/GradientText": () => import("@/lib/effects/components/text/GradientText"),
  "text/ShinyText": () => import("@/lib/effects/components/text/ShinyText"),
  "text/TextPressure": () => import("@/lib/effects/components/text/TextPressure"),
  "text/VariableProximity": () => import("@/lib/effects/components/text/VariableProximity"),
  // transitions
  "transitions/AnimatedContent": () => import("@/lib/effects/components/transitions/AnimatedContent"),
  "transitions/FadeContent": () => import("@/lib/effects/components/transitions/FadeContent"),
  "transitions/GradualBlur": () => import("@/lib/effects/components/transitions/GradualBlur"),
  "transitions/PixelTransition": () => import("@/lib/effects/components/transitions/PixelTransition"),
  "transitions/ShapeBlur": () => import("@/lib/effects/components/transitions/ShapeBlur"),
  "transitions/StickerPeel": () => import("@/lib/effects/components/transitions/StickerPeel"),
  // cursors
  "cursors/BlobCursor": () => import("@/lib/effects/components/cursors/BlobCursor"),
  "cursors/Crosshair": () => import("@/lib/effects/components/cursors/Crosshair"),
  "cursors/GhostCursor": () => import("@/lib/effects/components/cursors/GhostCursor"),
  "cursors/PixelTrail": () => import("@/lib/effects/components/cursors/PixelTrail"),
  "cursors/SplashCursor": () => import("@/lib/effects/components/cursors/SplashCursor"),
  "cursors/TargetCursor": () => import("@/lib/effects/components/cursors/TargetCursor"),
  // decorations
  "decorations/Antigravity": () => import("@/lib/effects/components/decorations/Antigravity"),
  "decorations/ClickSpark": () => import("@/lib/effects/components/decorations/ClickSpark"),
  "decorations/Counter": () => import("@/lib/effects/components/decorations/Counter"),
  "decorations/Cubes": () => import("@/lib/effects/components/decorations/Cubes"),
  "decorations/ElasticSlider": () => import("@/lib/effects/components/decorations/ElasticSlider"),
  "decorations/ElectricBorder": () => import("@/lib/effects/components/decorations/ElectricBorder"),
  "decorations/GlareHover": () => import("@/lib/effects/components/decorations/GlareHover"),
  "decorations/LaserFlow": () => import("@/lib/effects/components/decorations/LaserFlow"),
  "decorations/MagicRings": () => import("@/lib/effects/components/decorations/MagicRings"),
  "decorations/Magnet": () => import("@/lib/effects/components/decorations/Magnet"),
  "decorations/MagnetLines": () => import("@/lib/effects/components/decorations/MagnetLines"),
  "decorations/MetaBalls": () => import("@/lib/effects/components/decorations/MetaBalls"),
  "decorations/Ribbons": () => import("@/lib/effects/components/decorations/Ribbons"),
  "decorations/StarBorder": () => import("@/lib/effects/components/decorations/StarBorder"),
  "decorations/Stepper": () => import("@/lib/effects/components/decorations/Stepper"),
  // cards
  "cards/AnimatedList": () => import("@/lib/effects/components/cards/AnimatedList"),
  "cards/BorderGlow": () => import("@/lib/effects/components/cards/BorderGlow"),
  "cards/BounceCards": () => import("@/lib/effects/components/cards/BounceCards"),
  "cards/CardSwap": () => import("@/lib/effects/components/cards/CardSwap"),
  "cards/Carousel": () => import("@/lib/effects/components/cards/Carousel"),
  "cards/ChromaGrid": () => import("@/lib/effects/components/cards/ChromaGrid"),
  "cards/CircularGallery": () => import("@/lib/effects/components/cards/CircularGallery"),
  "cards/DecayCard": () => import("@/lib/effects/components/cards/DecayCard"),
  "cards/DomeGallery": () => import("@/lib/effects/components/cards/DomeGallery"),
  "cards/FluidGlass": () => import("@/lib/effects/components/cards/FluidGlass"),
  "cards/FlyingPosters": () => import("@/lib/effects/components/cards/FlyingPosters"),
  "cards/Folder": () => import("@/lib/effects/components/cards/Folder"),
  "cards/GlassSurface": () => import("@/lib/effects/components/cards/GlassSurface"),
  "cards/MagicBento": () => import("@/lib/effects/components/cards/MagicBento"),
  "cards/Masonry": () => import("@/lib/effects/components/cards/Masonry"),
  "cards/PixelCard": () => import("@/lib/effects/components/cards/PixelCard"),
  "cards/ProfileCard": () => import("@/lib/effects/components/cards/ProfileCard"),
  "cards/ReflectiveCard": () => import("@/lib/effects/components/cards/ReflectiveCard"),
  "cards/ScrollStack": () => import("@/lib/effects/components/cards/ScrollStack"),
  "cards/SpotlightCard": () => import("@/lib/effects/components/cards/SpotlightCard"),
  "cards/Stack": () => import("@/lib/effects/components/cards/Stack"),
  "cards/TiltedCard": () => import("@/lib/effects/components/cards/TiltedCard"),
  // nav
  "nav/GlassDropdown": () => import("@/lib/effects/components/nav/GlassDropdown"),
  "nav/GlassMorph": () => import("@/lib/effects/components/nav/GlassMorph"),
  "nav/GlassSlide": () => import("@/lib/effects/components/nav/GlassSlide"),
  "nav/GlowNav": () => import("@/lib/effects/components/nav/GlowNav"),
  "nav/Lanyard": () => import("@/lib/effects/components/nav/Lanyard"),
  "nav/MagneticHover": () => import("@/lib/effects/components/nav/MagneticHover"),
  "nav/MinimalFade": () => import("@/lib/effects/components/nav/MinimalFade"),
  "nav/ModelViewer": () => import("@/lib/effects/components/nav/ModelViewer"),
};

const CATEGORY_DIR: Record<string, string> = {
  background: "backgrounds",
  text: "text",
  transition: "transitions",
  cursor: "cursors",
  decoration: "decorations",
  card: "cards",
  nav: "nav",
  "nav-style": "nav",
};

const componentCache = new Map<string, ComponentType<any>>();

export function getEffectComponent(id: string): ComponentType<any> | null {
  const cached = componentCache.get(id);
  if (cached) return cached;

  const entry = getEffectById(id);
  if (!entry) return null;

  const dir = CATEGORY_DIR[entry.category];
  const key = `${dir}/${entry.name}`;
  const importer = IMPORT_MAP[key];
  if (!importer) return null;

  const LazyComponent = lazy(
    () => importer().catch((err) => {
      console.warn(`[effects] Failed to load ${id}:`, err);
      componentCache.delete(id);
      return { default: (() => null) as unknown as ComponentType<any> };
    }),
  );

  componentCache.set(id, LazyComponent);
  return LazyComponent;
}
