import useCountdown from '../useCountdown.js';
import ResultCards from './ResultCards.jsx';

export default function Result({ state }) {
  const secs = useCountdown(state.remainingMs);
  const isLast = state.round >= state.totalRounds;

  return (
    <div className="screen final">
      <h1 className="title left">Round {state.round} results</h1>
      <p className="muted left">{isLast ? 'Final results' : 'Next round'} in {secs}s</p>

      <ResultCards state={state} />

      <p className="muted">Top-left: target · bottom-right: guess</p>
    </div>
  );
}
