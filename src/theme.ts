// FLUX design tokens - 1:1 match with FLUX/qml/components/Theme.js

export const Theme = {
  // Brand (Discord Blurple)
  accent: "#5865F2",
  accentHover: "#4752C4",
  accentPressed: "#3C45A5",
  accentSoft: "rgba(88, 101, 242, 0.15)",
  accentRing: "rgba(88, 101, 242, 0.50)",

  // Surfaces (Discord Dark Theme)
  bg: "#1E1F22",
  bgRaised: "#2B2D31",
  surface: "#313338",
  surfaceHi: "#383A40",
  surfaceTop: "#404249",
  border: "#2B2D31",
  borderHi: "#4E5058",

  // Text
  text: "#F2F3F5",
  textDim: "#949BA4",
  textMute: "#80848E",

  // Status
  success: "#23A55A",
  warning: "#F0B232",
  danger: "#F23F43",

  // Typography
  fontFamily: '"Segoe UI", system-ui, sans-serif',
  monoFamily: 'Consolas, monospace',

  // 12 Poster palette [top, bottom] pairs
  posterPalette: [
    ["#8A1C2B", "#16070B"],
    ["#1F3A6E", "#070B16"],
    ["#4B2380", "#0C0716"],
    ["#0E5A57", "#041211"],
    ["#8A4B14", "#150B04"],
    ["#7A1F5C", "#14060F"],
    ["#1B5E86", "#06111A"],
    ["#6B6A12", "#121105"],
    ["#2C6B2A", "#08130A"],
    ["#8C2A3F", "#150810"],
    ["#3A3F9E", "#0A0B1A"],
    ["#A0521C", "#180B04"]
  ] as const
};

// Deterministic string hash (Java-style), always a non-negative integer.
export function hash(str: string): number {
  let h = 0;
  const s = str ? String(str) : "";
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function paletteIndex(key: string): number {
  return hash(key) % Theme.posterPalette.length;
}

export function posterTop(key: string): string {
  return Theme.posterPalette[paletteIndex(key)][0];
}

export function posterBottom(key: string): string {
  return Theme.posterPalette[paletteIndex(key)][1];
}

// Which of the 6 decorative poster compositions this title gets (stable per title)
export function posterStyle(key: string): number {
  return Math.floor(hash(String(key) + "#") / 7) % 6;
}

// milliseconds -> "m:ss" or "h:mm:ss"
export function formatTime(ms: number): string {
  if (!ms || ms < 0 || isNaN(ms)) ms = 0;
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = (m < 10 && h > 0 ? "0" : "") + m;
  const ss = (s < 10 ? "0" : "") + s;
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// Video dimensions -> badge label ("4K", "1080p", ...)
export function qualityLabel(w: number, h: number): string {
  if (!w || w <= 0) return "";
  if (w >= 3200 || h >= 2000) return "4K";
  if (w >= 2400 || h >= 1400) return "1440p";
  if (w >= 1800 || h >= 1000) return "1080p";
  if (w >= 1200 || h >= 700) return "720p";
  return "SD";
}
