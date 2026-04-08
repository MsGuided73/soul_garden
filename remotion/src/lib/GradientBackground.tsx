import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PALETTE } from "./theme";

interface GradientBackgroundProps {
  colorA?: string;
  colorB?: string;
  colorC?: string;
  speed?: number;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  colorA = PALETTE.deepPurple,
  colorB = PALETTE.darkViolet,
  colorC = PALETTE.midnight,
  speed = 0.5,
}) => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame * speed, [0, 360], [0, 360]) % 360;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${colorA} 0%, ${colorB} 50%, ${colorC} 100%)`,
      }}
    />
  );
};
