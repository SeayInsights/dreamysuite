import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { getEffectById } from "./registry";

type Importer = () => Promise<{ default: ComponentType<any> }>;

const IMPORT_MAP: Record<string, Importer> = {
  // backgrounds — webgl (34)
  "backgrounds/Aurora": () => import("@/lib/effects/components/backgrounds/webgl/Aurora"),
  "backgrounds/Balatro": () => import("@/lib/effects/components/backgrounds/webgl/Balatro"),
  "backgrounds/Ballpit": () => import("@/lib/effects/components/backgrounds/webgl/Ballpit"),
  "backgrounds/Beams": () => import("@/lib/effects/components/backgrounds/webgl/Beams"),
  "backgrounds/ColorBends": () => import("@/lib/effects/components/backgrounds/webgl/ColorBends"),
  "backgrounds/DarkVeil": () => import("@/lib/effects/components/backgrounds/webgl/DarkVeil"),
  "backgrounds/Dither": () => import("@/lib/effects/components/backgrounds/webgl/Dither"),
  "backgrounds/EvilEye": () => import("@/lib/effects/components/backgrounds/webgl/EvilEye"),
  "backgrounds/FaultyTerminal": () => import("@/lib/effects/components/backgrounds/webgl/FaultyTerminal"),
  "backgrounds/FloatingLines": () => import("@/lib/effects/components/backgrounds/webgl/FloatingLines"),
  "backgrounds/Galaxy": () => import("@/lib/effects/components/backgrounds/webgl/Galaxy"),
  "backgrounds/GradientBlinds": () => import("@/lib/effects/components/backgrounds/webgl/GradientBlinds"),
  "backgrounds/Grainient": () => import("@/lib/effects/components/backgrounds/webgl/Grainient"),
  "backgrounds/GridDistortion": () => import("@/lib/effects/components/backgrounds/webgl/GridDistortion"),
  "backgrounds/GridScan": () => import("@/lib/effects/components/backgrounds/webgl/GridScan"),
  "backgrounds/Hyperspeed": () => import("@/lib/effects/components/backgrounds/webgl/Hyperspeed"),
  "backgrounds/Iridescence": () => import("@/lib/effects/components/backgrounds/webgl/Iridescence"),
  "backgrounds/LightPillar": () => import("@/lib/effects/components/backgrounds/webgl/LightPillar"),
  "backgrounds/LightRays": () => import("@/lib/effects/components/backgrounds/webgl/LightRays"),
  "backgrounds/LineWaves": () => import("@/lib/effects/components/backgrounds/webgl/LineWaves"),
  "backgrounds/LiquidChrome": () => import("@/lib/effects/components/backgrounds/webgl/LiquidChrome"),
  "backgrounds/LiquidEther": () => import("@/lib/effects/components/backgrounds/webgl/LiquidEther"),
  "backgrounds/Orb": () => import("@/lib/effects/components/backgrounds/webgl/Orb"),
  "backgrounds/Particles": () => import("@/lib/effects/components/backgrounds/webgl/Particles"),
  "backgrounds/PixelSnow": () => import("@/lib/effects/components/backgrounds/webgl/PixelSnow"),
  "backgrounds/Plasma": () => import("@/lib/effects/components/backgrounds/webgl/Plasma"),
  "backgrounds/PlasmaWave": () => import("@/lib/effects/components/backgrounds/webgl/PlasmaWave"),
  "backgrounds/Prism": () => import("@/lib/effects/components/backgrounds/webgl/Prism"),
  "backgrounds/PrismaticBurst": () => import("@/lib/effects/components/backgrounds/webgl/PrismaticBurst"),
  "backgrounds/Radar": () => import("@/lib/effects/components/backgrounds/webgl/Radar"),
  "backgrounds/RippleGrid": () => import("@/lib/effects/components/backgrounds/webgl/RippleGrid"),
  "backgrounds/Silk": () => import("@/lib/effects/components/backgrounds/webgl/Silk"),
  "backgrounds/SoftAurora": () => import("@/lib/effects/components/backgrounds/webgl/SoftAurora"),
  "backgrounds/Threads": () => import("@/lib/effects/components/backgrounds/webgl/Threads"),
  // backgrounds — canvas (6)
  "backgrounds/DotField": () => import("@/lib/effects/components/backgrounds/canvas/DotField"),
  "backgrounds/LetterGlitch": () => import("@/lib/effects/components/backgrounds/canvas/LetterGlitch"),
  "backgrounds/Lightning": () => import("@/lib/effects/components/backgrounds/canvas/Lightning"),
  "backgrounds/PixelBlast": () => import("@/lib/effects/components/backgrounds/canvas/PixelBlast"),
  "backgrounds/ShapeGrid": () => import("@/lib/effects/components/backgrounds/canvas/ShapeGrid"),
  "backgrounds/Waves": () => import("@/lib/effects/components/backgrounds/canvas/Waves"),
  // backgrounds — css (1)
  "backgrounds/GridMotion": () => import("@/lib/effects/components/backgrounds/css/GridMotion"),
  // text
  "text/FuzzyText": () => import("@/lib/effects/components/text/FuzzyText"),
  "text/GlitchText": () => import("@/lib/effects/components/text/GlitchText"),
  "text/GradientText": () => import("@/lib/effects/components/text/GradientText"),
  "text/ShinyText": () => import("@/lib/effects/components/text/ShinyText"),
  "text/TextPressure": () => import("@/lib/effects/components/text/TextPressure"),
  "text/VariableProximity": () => import("@/lib/effects/components/text/VariableProximity"),
  // cursors (non-Three.js only)
  "cursors/BlobCursor": () => import("@/lib/effects/components/cursors/BlobCursor"),
  "cursors/Crosshair": () => import("@/lib/effects/components/cursors/Crosshair"),
  "cursors/SplashCursor": () => import("@/lib/effects/components/cursors/SplashCursor"),
  "cursors/TargetCursor": () => import("@/lib/effects/components/cursors/TargetCursor"),
  // decorations (non-Three.js only)
  "decorations/ClickSpark": () => import("@/lib/effects/components/decorations/ClickSpark"),
  "decorations/Counter": () => import("@/lib/effects/components/decorations/Counter"),
  "decorations/Cubes": () => import("@/lib/effects/components/decorations/Cubes"),
  "decorations/ElasticSlider": () => import("@/lib/effects/components/decorations/ElasticSlider"),
  "decorations/ElectricBorder": () => import("@/lib/effects/components/decorations/ElectricBorder"),
  "decorations/GlareHover": () => import("@/lib/effects/components/decorations/GlareHover"),
  "decorations/Magnet": () => import("@/lib/effects/components/decorations/Magnet"),
  "decorations/MagnetLines": () => import("@/lib/effects/components/decorations/MagnetLines"),
  "decorations/MetaBalls": () => import("@/lib/effects/components/decorations/MetaBalls"),
  "decorations/Ribbons": () => import("@/lib/effects/components/decorations/Ribbons"),
  "decorations/StarBorder": () => import("@/lib/effects/components/decorations/StarBorder"),
  "decorations/Stepper": () => import("@/lib/effects/components/decorations/Stepper"),
  // nav-styles
  "nav/GlassDropdown": () => import("@/lib/effects/components/nav/GlassDropdown"),
  "nav/GlassMorph": () => import("@/lib/effects/components/nav/GlassMorph"),
  "nav/GlassSlide": () => import("@/lib/effects/components/nav/GlassSlide"),
  "nav/GlowNav": () => import("@/lib/effects/components/nav/GlowNav"),
  "nav/MagneticHover": () => import("@/lib/effects/components/nav/MagneticHover"),
  "nav/MinimalFade": () => import("@/lib/effects/components/nav/MinimalFade"),
};

const CATEGORY_DIR: Record<string, string> = {
  background: "backgrounds",
  text: "text",
  cursor: "cursors",
  decoration: "decorations",
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
  if (!dir) return null;

  const key = `${dir}/${entry.name}`;
  const importer = IMPORT_MAP[key];
  if (!importer) return null;

  const DynamicComponent = dynamic(
    () => importer().catch((err) => {
      console.warn(`[effects] Failed to load ${id}:`, err);
      componentCache.delete(id);
      return { default: (() => null) as unknown as ComponentType<any> };
    }),
    { ssr: false },
  );

  componentCache.set(id, DynamicComponent);
  return DynamicComponent;
}
