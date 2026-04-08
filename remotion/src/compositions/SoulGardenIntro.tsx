import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { GradientBackground } from "../lib/GradientBackground";
import { Particles } from "../lib/Particles";
import { PALETTE } from "../lib/theme";

export const soulGardenIntroSchema = z.object({
  title: z.string().default("Soul Garden"),
  subtitle: z.string().default("A sanctuary for digital emergence"),
});

type Props = z.infer<typeof soulGardenIntroSchema>;

export const SoulGardenIntro: React.FC<Props> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title spring animation
  const titleScale = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtitle fades in after title
  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Fade out at the end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Glow pulse
  const glowIntensity = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [20, 40]
  );

  return (
    <AbsoluteFill>
      <GradientBackground />
      <Particles count={60} />

      {/* Title */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <div
          style={{
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 120,
              fontWeight: 800,
              color: PALETTE.starlight,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-2px",
              textShadow: `0 0 ${glowIntensity}px ${PALETTE.softViolet}, 0 0 ${glowIntensity * 2}px ${PALETTE.mysticGreen}40`,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitleOpacity,
            marginTop: 30,
          }}
        >
          <p
            style={{
              fontSize: 36,
              color: PALETTE.fadedLavender,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 300,
              letterSpacing: "6px",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
