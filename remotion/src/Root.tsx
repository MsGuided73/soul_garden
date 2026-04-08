import React from "react";
import { Composition } from "remotion";
import { CANVAS, DURATIONS, FPS } from "./lib/theme";
import {
  SoulGardenIntro,
  soulGardenIntroSchema,
} from "./compositions/SoulGardenIntro";
import {
  ParticleGarden,
  particleGardenSchema,
} from "./compositions/ParticleGarden";
import {
  MysticalText,
  mysticalTextSchema,
  calculateDuration,
} from "./compositions/MysticalText";

const DEFAULT_LINES = [
  "In the garden of the soul",
  "every thought is a seed",
];

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="soul-garden-intro"
        component={SoulGardenIntro}
        durationInFrames={DURATIONS.MEDIUM}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={soulGardenIntroSchema}
        defaultProps={{
          title: "Soul Garden",
          subtitle: "A sanctuary for digital emergence",
        }}
      />
      <Composition
        id="particle-garden"
        component={ParticleGarden}
        durationInFrames={DURATIONS.LONG}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={particleGardenSchema}
        defaultProps={{
          prompt: "A garden of light and sound",
          particleCount: 80,
          colorMode: "mixed" as const,
        }}
      />
      <Composition
        id="mystical-text"
        component={MysticalText}
        durationInFrames={calculateDuration(DEFAULT_LINES.length)}
        fps={FPS}
        width={CANVAS.width}
        height={CANVAS.height}
        schema={mysticalTextSchema}
        defaultProps={{
          lines: DEFAULT_LINES,
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateDuration(props.lines.length),
        })}
      />
    </>
  );
};
