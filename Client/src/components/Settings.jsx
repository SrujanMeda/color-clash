import { useState } from 'react';
import { socket } from '../socket.js';
import { hexToHsb, hsbToCss, hsbToHex } from '../colors.js';

const ROUND_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);
const MEMORIZE_OPTIONS = [2, 3, 5, 8, 10, 15];
const GUESS_OPTIONS = [10, 15, 20, 30, 45, 60];
const DIFFICULTIES = [
  { id: 'easy', hint: 'Vivid colors, lenient scoring' },
  { id: 'medium', hint: 'Balanced' },
  { id: 'hard', hint: 'Muted and dark colors, strict scoring' },
];

const update = (patch) => socket.emit('settings:update', patch);

function Select({ label, value, options, suffix = '', disabled, onChange }) {
  return (
    <label className="setting">
      <span>{label}</span>
      <select className="input" value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((o) => (
          <option key={o} value={o}>{o}{suffix}</option>
        ))}
      </select>
    </label>
  );
}

export default function Settings({ settings, editable }) {
  const [pending, setPending] = useState('#3b82f6');
  const { customColors } = settings;
  const canAdd = editable && customColors.length < settings.rounds;

  return (
    <div className="panel">
      <h3>Settings</h3>

      <div className="grid3">
        <Select label="Rounds" value={settings.rounds} options={ROUND_OPTIONS} disabled={!editable}
          onChange={(rounds) => update({ rounds })} />
        <Select label="Memorize" value={settings.memorizeSec} options={MEMORIZE_OPTIONS} suffix="s" disabled={!editable}
          onChange={(memorizeSec) => update({ memorizeSec })} />
        <Select label="Guess" value={settings.guessSec} options={GUESS_OPTIONS} suffix="s" disabled={!editable}
          onChange={(guessSec) => update({ guessSec })} />
      </div>

      <div className="setting">
        <span>Difficulty</span>
        <div className="seg">
          {DIFFICULTIES.map((d) => (
            <button key={d.id} type="button" title={d.hint} disabled={!editable}
              className={settings.difficulty === d.id ? 'active' : ''}
              onClick={() => update({ difficulty: d.id })}>
              {d.id}
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <span>Custom colors ({customColors.length}/{settings.rounds}) — used in order, remaining rounds are random</span>
        <div className="custom">
          {customColors.map((c, i) => (
            <button key={i} type="button" className="cswatch" style={{ background: hsbToCss(c) }}
              title={editable ? 'Remove' : hsbToHex(c)} disabled={!editable}
              onClick={() => update({ customColors: customColors.filter((_, j) => j !== i) })}>
              {editable && '×'}
            </button>
          ))}
          {canAdd && (
            <>
              <input type="color" value={pending} onChange={(e) => setPending(e.target.value)} />
              <button type="button" className="btn small"
                onClick={() => update({ customColors: [...customColors, hexToHsb(pending)] })}>
                Add
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
