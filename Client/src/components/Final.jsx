import { useState } from 'react';
import { socket } from '../socket.js';
import ResultCards, { fmt } from './ResultCards.jsx';

export default function Final({ state, onLeave }) {
  const [copied, setCopied] = useState(false);
  const isHost = state.hostId === state.you;
  const { totalRounds, settings } = state;
  const max = totalRounds * 10;
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  const mode = `${settings.difficulty[0].toUpperCase()}${settings.difficulty.slice(1)} mode · ${totalRounds} rounds`;

  const share = async () => {
    const lines = sorted.map((p, i) => `${i + 1}. ${p.name} ${fmt(p.score)}/${max}`);
    await navigator.clipboard.writeText(`Color Clash — ${mode}\n${lines.join('\n')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="screen final">
      <h1 className="title left">Final results</h1>
      <p className="muted left">{mode}</p>

      <ResultCards state={state} showWinner />

      <p className="muted">Top-left: target · bottom-right: guess</p>

      <button className="link" onClick={share}>{copied ? 'Copied!' : 'Share results'}</button>
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
