export default function GameControls({ canUndo, onUndo, onNew, theme, onTheme, sound, onSound }) {
  return (
    <div className="controls">
      <button className="btn" onClick={onUndo} disabled={!canUndo} aria-label="Undo last move">Undo</button>
      <button className="btn primary" onClick={onNew} aria-label="Start a new game">New Game</button>
      <button className="btn icon" onClick={onTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
        {theme === 'dark' ? '☀' : '☾'}
      </button>
      <button className="btn icon" onClick={onSound} aria-label={sound ? 'Mute sound' : 'Unmute sound'} aria-pressed={!sound}>
        {sound ? '🔊' : '🔇'}
      </button>
    </div>
  );
}
