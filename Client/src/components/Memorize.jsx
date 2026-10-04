import { hsbToCss } from '../colors.js';
import useCountdown from '../useCountdown.js';

export default function Memorize({ state }) {
  const secs = useCountdown(state.remainingMs);
  return (
    <div className="fullcolor" style={{ background: hsbToCss(state.target) }}>
      <div className="overlay">
        <span>Round {state.round}/{state.totalRounds}</span>
        <span className="big">Memorize · {secs}</span>
      </div>
    </div>
  );
}
