import { hsbToCss } from '../colors.js';
import useCountdown from '../useCountdown.js';
import Leaderboard from './Leaderboard.jsx';

export default function Result({ state }) {
  const secs = useCountdown(state.remainingMs);
  const me = state.players.find((p) => p.id === state.you);
  const isLast = state.round >= state.totalRounds;

  return (
    <div className="screen">
      <p className="muted">
        Round {state.round}/{state.totalRounds} · {isLast ? 'Final results' : 'Next round'} in {secs}s
      </p>

      <div className="compare">
        <div>
          <div className="swatch" style={{ background: hsbToCss(state.target) }} />
          <p>Target</p>
        </div>
        <div>
          <div className="swatch" style={{ background: hsbToCss(me.guess) }} />
          <p>You · +{me.roundScore}</p>
        </div>
      </div>

      <div className="guesses">
        {state.players.map((p) => (
          <div key={p.id} className="chip">
            <span className="dot" style={{ background: hsbToCss(p.guess) }} />
            {p.name}
          </div>
        ))}
      </div>

      <Leaderboard players={state.players} you={state.you} showRound />
    </div>
  );
}
