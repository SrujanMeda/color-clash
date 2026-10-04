import { socket } from '../socket.js';
import Settings from './Settings.jsx';

export default function Lobby({ state, onLeave }) {
  const isHost = state.hostId === state.you;
  return (
    <div className="screen">
      <p className="muted">Room code</p>
      <h1 className="title code-big">{state.code}</h1>
      <p className="muted">Share this code with friends to join.</p>

      <ul className="board">
        {state.players.map((p) => (
          <li key={p.id} className={p.id === state.you ? 'me' : ''}>
            <span className="pname">{p.name}</span>
            {p.id === state.hostId && <span className="tag">host</span>}
            {isHost && p.id !== state.you && (
              <>
                <button className="btn small" onClick={() => socket.emit('player:promote', { id: p.id })}>
                  Make host
                </button>
                <button className="btn small danger" onClick={() => socket.emit('player:kick', { id: p.id })}>
                  Kick
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <Settings settings={state.settings} editable={isHost} />

      <div className="row">
        <button className="btn" onClick={onLeave}>Leave</button>
        {isHost ? (
          <button className="btn primary" onClick={() => socket.emit('game:start')}>Start game</button>
        ) : (
          <span className="muted">Waiting for host…</span>
        )}
      </div>
    </div>
  );
}
