export default function Leaderboard({ players, you, showRound }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <ol className="board">
      {sorted.map((p, i) => (
        <li key={p.id} className={p.id === you ? 'me' : ''}>
          <span className="rank">{i + 1}</span>
          <span className="pname">{p.name}</span>
          {showRound && <span className="gain">+{p.roundScore}</span>}
          <span className="pscore">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
