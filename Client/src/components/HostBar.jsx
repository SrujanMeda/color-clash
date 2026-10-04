import { socket } from '../socket.js';

export default function HostBar() {
  const end = () => {
    if (window.confirm('End the game and return everyone to the lobby?')) socket.emit('game:end');
  };
  return (
    <div className="hostbar">
      <button className="btn small danger" onClick={end}>End game</button>
    </div>
  );
}
