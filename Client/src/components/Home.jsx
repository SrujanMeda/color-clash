import { useState } from 'react';
import { socket } from '../socket.js';

export default function Home({ notice }) {
  const [name, setName] = useState(() => localStorage.getItem('cc-name') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const remember = () => localStorage.setItem('cc-name', name.trim());

  const create = (solo) => {
    remember();
    socket.emit('room:create', { name }, (res) => {
      if (res?.ok && solo) socket.emit('game:start');
    });
  };

  const join = (e) => {
    e.preventDefault();
    remember();
    socket.emit('room:join', { name, code }, (res) => {
      if (!res?.ok) setError(res?.error || 'Could not join');
    });
  };

  return (
    <div className="screen">
      <h1 className="title">Color Clash</h1>
      <p className="muted">Memorize five colors. Recreate them from memory. Beat your friends.</p>

      <input
        className="input"
        placeholder="Your name"
        maxLength={16}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="row">
        <button className="btn" onClick={() => create(true)}>Play solo</button>
        <button className="btn primary" onClick={() => create(false)}>Create room</button>
      </div>

      <form className="row" onSubmit={join}>
        <input
          className="input code"
          placeholder="CODE"
          maxLength={4}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
        />
        <button className="btn" disabled={code.length !== 4}>Join</button>
      </form>
      {error && <p className="error">{error}</p>}
      {notice && <p className="error">{notice}</p>}
    </div>
  );
}
