export const PALETTE = {
  deepPurple: "#1a0a2e",
  midnight: "#05050f",
  mysticGreen: "#00ff88",
  softViolet: "#8b5cf6",
  gardenGlow: "#22c55e",
  starlight: "#e2e8f0",
  driftPink: "#ec4899",
  fadedLavender: "#a78bfa",
  darkViolet: "#4a3766",
} as const;

export const FPS = 30;

export const DURATIONS = {
  SHORT: 5 * FPS,   // 150 frames = 5s
  MEDIUM: 10 * FPS, // 300 frames = 10s
  LONG: 15 * FPS,   // 450 frames = 15s
} as const;

export const CANVAS = {
  width: 1920,
  height: 1080,
} as const;
