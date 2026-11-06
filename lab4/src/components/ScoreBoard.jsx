export default function ScoreBoard({ score, best, gain, gainKey }) {
  return (
    <div className="scores">
      <div className="score-box">
        <span className="score-label">Score</span>
        <span className="score-value" aria-live="polite">{score}</span>
        {gain > 0 && <span className="gain" key={gainKey}>+{gain}</span>}
      </div>
      <div className="score-box">
        <span className="score-label">Best</span>
        <span className="score-value">{best}</span>
      </div>
    </div>
  );
}
