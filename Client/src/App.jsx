import { useEffect, useState } from 'react';
import { socket } from './socket.js';
import Home from './components/Home.jsx';
import Lobby from './components/Lobby.jsx';
import Memorize from './components/Memorize.jsx';
import Guess from './components/Guess.jsx';
import Result from './components/Result.jsx';
import Final from './components/Final.jsx';
import HostBar from './components/HostBar.jsx';

export default function App() {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const onState = (s) => {
      setNotice('');
      setState(s);
    };
    const onKicked = () => {
      setState(null);
      setNotice('You were kicked from the room');
    };
    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      setState(null);
    };
    socket.on('state', onState);
    socket.on('kicked', onKicked);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('state', onState);
      socket.off('kicked', onKicked);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const leave = () => {
    socket.emit('room:leave');
    setState(null);
  };

  if (!connected) return <div className="center">Connecting…</div>;
  if (!state) return <Home notice={notice} />;

  // key forces a fresh component per round so local picker state resets
  const key = `${state.phase}-${state.round}`;
  const inGame = ['memorize', 'guess', 'result'].includes(state.phase);
  return (
    <>
      {inGame && state.hostId === state.you && <HostBar />}
      {renderPhase(state, key, leave)}
    </>
  );
}

function renderPhase(state, key, leave) {
  switch (state.phase) {
    case 'lobby':
      return <Lobby state={state} onLeave={leave} />;
    case 'memorize':
      return <Memorize key={key} state={state} />;
    case 'guess':
      return <Guess key={key} state={state} />;
    case 'result':
      return <Result key={key} state={state} />;
    case 'final':
      return <Final state={state} onLeave={leave} />;
    default:
      return null;
  }
}
