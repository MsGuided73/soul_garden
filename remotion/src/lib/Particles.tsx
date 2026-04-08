import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PALETTE } from "./theme";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  color: string;
  opacity: number;
}

interface ParticlesProps {
  count?: number;
  colors?: string[];
}

export const Particles: React.FC<ParticlesProps> = ({
  count = 40,
  colors = [PALETTE.mysticGreen, PALETTE.softViolet, PALETTE.fadedLavender, PALETTE.gardenGlow],
}) => {
  const frame = useCurrentFrame();

  const particles = useMemo<Particle[]>(() => {
    // Deterministic pseudo-random using simple seed math
    const seed = (i: number) => {
      const x = Math.sin(i * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    };

    return Array.from({ length: count }, (_, i) => ({
      x: seed(i) * 100,
      y: seed(i + 100) * 100,
      size: 2 + seed(i + 200) * 6,
      speed: 0.3 + seed(i + 300) * 0.7,
      phase: seed(i + 400) * Math.PI * 2,
      color: colors[Math.floor(seed(i + 500) * colors.length)],
      opacity: 0.2 + seed(i + 600) * 0.6,
    }));
  }, [count, colors]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {particles.map((p, i) => {
        const drift = Math.sin(frame * 0.02 * p.speed + p.phase) * 3;
        const rise = interpolate(
          frame,
          [0, 900],
          [0, -30 * p.speed],
          { extrapolateRight: "extend" }
        );
        const x = p.x + drift;
        const y = ((p.y + rise) % 110 + 110) % 110 - 5;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
