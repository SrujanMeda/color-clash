export function hsbToCss({ h, s, b }) {
  const S = s / 100;
  const V = b / 100;
  const l = V * (1 - S / 2);
  const sl = l === 0 || l === 1 ? 0 : (V - l) / Math.min(l, 1 - l);
  return `hsl(${h} ${(sl * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;
}

export function hsbToHex({ h, s, b }) {
  const S = s / 100;
  const V = b / 100;
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return V - V * S * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

export function hexToHsb(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return {
    h: Math.round((h * 60 + 360) % 360),
    s: Math.round(max ? (d / max) * 100 : 0),
    b: Math.round(max * 100),
  };
}
