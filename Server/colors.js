const clamp = (v, min, max) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));

export function sanitizeHsb(c) {
  return {
    h: clamp(Number(c?.h), 0, 360),
    s: clamp(Number(c?.s), 0, 100),
    b: clamp(Number(c?.b), 0, 100),
  };
}

// s/b are the ranges targets are drawn from; decay is how fast score falls with distance.
export const DIFFICULTIES = {
  easy: { s: [60, 100], b: [60, 100], decay: 40 },
  medium: { s: [20, 100], b: [25, 100], decay: 30 },
  hard: { s: [8, 100], b: [12, 100], decay: 22 },
};

const between = ([lo, hi]) => Math.round(lo + Math.random() * (hi - lo));

export function randomColor(difficulty = 'medium') {
  const d = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
  return { h: Math.round(Math.random() * 360), s: between(d.s), b: between(d.b) };
}

function hsbToRgb({ h, s, b }) {
  const S = s / 100;
  const V = b / 100;
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return V - V * S * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)];
}

function rgbToLab([r, g, b]) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const fn = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [fn(x), fn(y), fn(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function colorDistance(a, b) {
  const [l1, a1, b1] = rgbToLab(hsbToRgb(a));
  const [l2, a2, b2] = rgbToLab(hsbToRgb(b));
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

// 100 for a perfect match, decaying with perceptual distance (CIE76 delta E).
export function scoreGuess(target, guess, difficulty = 'medium') {
  const { decay } = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
  const d = colorDistance(target, guess);
  return Math.round(100 * Math.exp(-d / decay) * 10) / 10;
}
