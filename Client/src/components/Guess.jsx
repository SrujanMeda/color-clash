import { useState } from 'react';
import { socket } from '../socket.js';
import { hsbToCss } from '../colors.js';
import useCountdown from '../useCountdown.js';

const SLIDERS = [
  {
    key: 'h',
    label: 'Hue',
    max: 360,
    track: () =>
      `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((h) => `hsl(${h} 100% 50%)`).join(',')})`,
  },
  {
    key: 's',
    label: 'Saturation',
    max: 100,
    track: (c) => `linear-gradient(to right, ${hsbToCss({ ...c, s: 0 })}, ${hsbToCss({ ...c, s: 100 })})`,
  },
  {
    key: 'b',
    label: 'Brightness',
    max: 100,
    track: (c) => `linear-gradient(to right, ${hsbToCss({ ...c, b: 0 })}, ${hsbToCss({ ...c, b: 100 })})`,
  },
];

export default function Guess({ state }) {
  const secs = useCountdown(state.remainingMs);
  const [color, setColor] = useState({ h: 180, s: 50, b: 50 });
  const [locked, setLocked] = useState(false);

  const update = (key, value) => {
    const next = { ...color, [key]: value };
    setColor(next);
    socket.emit('guess:update', { color: next });
  };

  const lock = () => {
    setLocked(true);
    socket.emit('guess:update', { color, lock: true });
  };

  const lockedCount = state.players.filter((p) => p.locked).length;

  return (
    <div className="screen">
      <div className="topbar">
        <span>Round {state.round}/{state.totalRounds}</span>
        <span className="big">{secs}s</span>
        <span>{lockedCount}/{state.players.length} locked</span>
      </div>

      <div className="swatch" style={{ background: hsbToCss(color) }} />

      {SLIDERS.map((s) => (
        <label key={s.key} className="slider">
          <span>{s.label}</span>
          <input
            type="range"
            min="0"
            max={s.max}
            value={color[s.key]}
            disabled={locked}
            style={{ background: s.track(color) }}
            onChange={(e) => update(s.key, Number(e.target.value))}
          />
        </label>
      ))}

      <button className="btn primary" disabled={locked} onClick={lock}>
        {locked ? 'Locked in — waiting…' : 'Lock in'}
      </button>
    </div>
  );
}
