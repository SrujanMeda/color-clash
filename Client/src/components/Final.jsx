import { socket } from '../socket.js';
import Leaderboard from './Leaderboard.jsx';

export default function Final({ state, onLeave }) {
  const isHost = state.hostId === state.you;
  const max = state.totalRounds * 100;
  const sorted = [...state.players].sort((a, b) => b.score - a.score);

  return (
    <div className="screen">
      <h1 className="title">{sorted[0].name} wins!</h1>
      <p className="muted">Scores out of {max}</p>
      <Leaderboard players={state.players} you={state.you} />
      <div className="row">
        <button className="btn" onClick={onLeave}>Leave</button>
        {isHost ? (
          <button className="btn primary" onClick={() => socket.emit('game:restart')}>Play again</button>
        ) : (
          <span className="muted">Waiting for host…</span>
        )}
      </div>
    </div>
  );
}
