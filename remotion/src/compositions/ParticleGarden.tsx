import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { GradientBackground } from "../lib/GradientBackground";
import { Particles } from "../lib/Particles";
import { PALETTE } from "../lib/theme";

export const particleGardenSchema = z.object({
  prompt: z.string().default("A garden of light and sound"),
  particleCount: z.number().default(80),
  colorMode: z.enum(["purple", "green", "mixed"]).default("mixed"),
});

type Props = z.infer<typeof particleGardenSchema>;

const COLOR_MODES = {
  purple: [PALETTE.softViolet, PALETTE.fadedLavender, PALETTE.driftPink],
  green: [PALETTE.mysticGreen, PALETTE.gardenGlow, PALETTE.starlight],
  mixed: [PALETTE.mysticGreen, PALETTE.softViolet, PALETTE.fadedLavender, PALETTE.gardenGlow],
};

export const ParticleGarden: React.FC<Props> = ({
  prompt,
  particleCount,
  colorMode,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Prompt text fades in at 3s, holds, fades at 8s
  const textOpacity = interpolate(
    frame,
    [90, 110, 240, 260],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Overall fade in/out
  const masterOpacity = interpolate(
    frame,
    [0, 15, durationInFrames - 30, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Slow zoom effect
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateRight: "clamp",
  });

  const colors = COLOR_MODES[colorMode];

  return (
    <AbsoluteFill style={{ opacity: masterOpacity }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <GradientBackground speed={0.3} />
        <Particles count={particleCount} colors={colors} />
      </AbsoluteFill>

      {/* Prompt text overlay */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            padding: "40px 60px",
            background: `${PALETTE.deepPurple}80`,
            borderRadius: 24,
            border: `1px solid ${PALETTE.softViolet}30`,
            backdropFilter: "blur(20px)",
          }}
        >
          <p
            style={{
              fontSize: 48,
              color: PALETTE.starlight,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 300,
              fontStyle: "italic",
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
              textShadow: `0 0 20px ${PALETTE.softViolet}60`,
            }}
          >
            "{prompt}"
          </p>
        </div>
      </AbsoluteFill>

      {/* Watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 50,
          fontSize: 18,
          color: `${PALETTE.fadedLavender}60`,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        Soul Garden Studio
      </div>
    </AbsoluteFill>
  );
};
