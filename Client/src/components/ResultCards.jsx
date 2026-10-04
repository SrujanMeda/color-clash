import { hsbToCss } from '../colors.js';

export const fmt = (n) => n.toFixed(2);

// Dark label on light swatches, light label on dark ones.
const labelColor = ({ s, b }) => (b * (1 - s / 200) > 62 ? '#111' : '#fff');

export default function ResultCards({ state, showWinner }) {
  const { totalRounds, targets, you, hostId } = state;
  const max = totalRounds * 10;
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  const top = sorted[0].score;

  return sorted.map((p, i) => (
    <section key={p.id} className="panel">
      <div className="result-head">
        <span className="pname">{i + 1}. {p.name}</span>
        {showWinner && p.score === top && <span className="pill">winner</span>}
        {p.id === you && <span className="pill">you</span>}
        {p.id === hostId && <span className="pill">host</span>}
        <span className="total">{fmt(p.score)}<small>/{max}</small></span>
      </div>
      <div className="tiles">
        {p.rounds.map((r, j) => (
          <div
            key={j}
            className={`tile${!showWinner && j === p.rounds.length - 1 ? ' latest' : ''}`}
            style={{
              background: `linear-gradient(to bottom right, ${hsbToCss(targets[j])} 50%, ${hsbToCss(r.guess)} 50%)`,
              color: labelColor(targets[j]),
            }}
          >
            {fmt(r.score)}
          </div>
        ))}
      </div>
    </section>
  ));
}
