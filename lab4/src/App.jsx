import { useState } from 'react';
import useGame from './hooks/useGame.js';
import GameBoard from './components/GameBoard.jsx';
import ScoreBoard from './components/ScoreBoard.jsx';
import GameControls from './components/GameControls.jsx';
import GameModal from './components/GameModal.jsx';
import Instructions from './components/Instructions.jsx';

export default function App() {
  const g = useGame();
  const { game } = g;
  const [confirming, setConfirming] = useState(false);

  const requestNew = () => (game.moveCount > 0 && game.gameStatus === 'playing' ? setConfirming(true) : g.restart());

  return (
    <main className="app">
      <header className="header">
        <h1>2048</h1>
        <ScoreBoard score={game.score} best={g.bestScore} gain={game.gain} gainKey={game.gainKey} />
      </header>
      <p className="subtitle">Join the tiles, get to <strong>2048</strong>.</p>
      <GameControls
        canUndo={!!game.previousState} onUndo={g.undo} onNew={requestNew}
        theme={g.prefs.theme} onTheme={g.toggleTheme}
        sound={g.prefs.soundEnabled} onSound={g.toggleSound}
      />
      <GameBoard board={game.board} merged={game.merged} spawned={game.spawned} moveCount={game.moveCount} />
      <Instructions />

      {g.showWin && (
        <GameModal title="You reached 2048!" actions={[
          { label: 'Keep going', primary: true, onClick: g.continuePlaying },
          { label: 'New Game', onClick: g.restart },
        ]}>Score {game.score} in {game.moveCount} moves.</GameModal>
      )}
      {game.gameStatus === 'gameover' && (
        <GameModal title="Game over" actions={[
          { label: 'New Game', primary: true, onClick: g.restart },
          ...(game.previousState ? [{ label: 'Undo', onClick: g.undo }] : []),
        ]}>No moves left. Final score: {game.score}.</GameModal>
      )}
      {confirming && (
        <GameModal title="Start a new game?" actions={[
          { label: 'New Game', primary: true, onClick: () => { setConfirming(false); g.restart(); } },
          { label: 'Cancel', onClick: () => setConfirming(false) },
        ]}>Your current game will be lost. Your best score is kept.</GameModal>
      )}
    </main>
  );
}
