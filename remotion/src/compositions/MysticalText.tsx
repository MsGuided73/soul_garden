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

export const mysticalTextSchema = z.object({
  lines: z.array(z.string()).default(["In the garden of the soul", "every thought is a seed"]),
});

type Props = z.infer<typeof mysticalTextSchema>;

const FRAMES_PER_LINE = 90; // 3 seconds per line at 30fps
const INTRO_FRAMES = 30;
const OUTRO_FRAMES = 30;

export const calculateDuration = (lineCount: number): number => {
  return INTRO_FRAMES + lineCount * FRAMES_PER_LINE + OUTRO_FRAMES;
};

export const MysticalText: React.FC<Props> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Overall fade in/out
  const masterOpacity = interpolate(
    frame,
    [0, INTRO_FRAMES, durationInFrames - OUTRO_FRAMES, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity: masterOpacity }}>
      <GradientBackground
        colorA={PALETTE.midnight}
        colorB={PALETTE.deepPurple}
        colorC={PALETTE.darkViolet}
        speed={0.2}
      />
      <Particles count={30} colors={[PALETTE.mysticGreen, PALETTE.softViolet]} />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {lines.map((line, i) => {
          const lineStart = INTRO_FRAMES + i * FRAMES_PER_LINE;
          const lineEnd = lineStart + FRAMES_PER_LINE;

          // Each line: fade in, hold, fade out
          const opacity = interpolate(
            frame,
            [lineStart, lineStart + 20, lineEnd - 20, lineEnd],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Slight upward drift
          const translateY = interpolate(
            frame,
            [lineStart, lineEnd],
            [10, -10],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                opacity,
                transform: `translateY(${translateY}px)`,
                textAlign: "center",
                padding: "0 100px",
              }}
            >
              <p
                style={{
                  fontSize: 64,
                  color: PALETTE.starlight,
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 300,
                  fontStyle: "italic",
                  lineHeight: 1.4,
                  margin: 0,
                  textShadow: `0 0 30px ${PALETTE.softViolet}40`,
                }}
              >
                {line}
              </p>
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 50,
          fontSize: 18,
          color: `${PALETTE.fadedLavender}40`,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        Soul Garden
      </div>
    </AbsoluteFill>
  );
};
