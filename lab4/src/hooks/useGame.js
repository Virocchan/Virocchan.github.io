import { useCallback, useEffect, useRef, useState } from 'react';
import { newBoard, spawnTile, move, hasMoves, hasReachedTarget } from '../utils/gameLogic.js';
import { loadGame, saveGame, loadBest, saveBest, loadPrefs, savePrefs } from '../utils/storage.js';
import { playSound } from '../utils/sound.js';

const fresh = () => ({
  board: newBoard(), score: 0, moveCount: 0, previousState: null,
  gameStatus: 'playing', hasWon: false, merged: [], spawned: null, gain: 0, gainKey: 0,
});
const initial = () => {
  const s = loadGame();
  return s ? { ...fresh(), ...s, merged: [], spawned: null, gain: 0 } : fresh();
};

export default function useGame() {
  const [game, setGame] = useState(initial);
  const [bestScore, setBestScore] = useState(loadBest);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [showWin, setShowWin] = useState(false);
  const sound = useRef(prefs.soundEnabled);
  sound.current = prefs.soundEnabled;
  const play = (n) => sound.current && playSound(n);

  useEffect(() => {
    const { board, score, moveCount, previousState, gameStatus, hasWon } = game;
    saveGame({ board, score, moveCount, previousState, gameStatus, hasWon });
  }, [game]);
  useEffect(() => {
    if (game.score > bestScore) { setBestScore(game.score); saveBest(game.score); }
  }, [game.score, bestScore]);
  useEffect(() => {
    savePrefs(prefs);
    document.documentElement.dataset.theme = prefs.theme;
  }, [prefs]);

  const act = useCallback((dir) => {
    setGame((g) => {
      if (g.gameStatus === 'gameover' || (g.gameStatus === 'won' && showWin)) return g;
      const res = move(g.board, dir);
      if (!res.moved) return g;
      const { board, cell } = spawnTile(res.board);
      const won = !g.hasWon && hasReachedTarget(board);
      const over = !hasMoves(board);
      play(won ? 'win' : over ? 'over' : res.merged.length ? 'merge' : 'move');
      if (won) setShowWin(true);
      return {
        board, score: g.score + res.gained, moveCount: g.moveCount + 1,
        previousState: { board: g.board, score: g.score, moveCount: g.moveCount, hasWon: g.hasWon },
        gameStatus: over ? 'gameover' : won ? 'won' : 'playing',
        hasWon: g.hasWon || won, merged: res.merged, spawned: cell,
        gain: res.gained, gainKey: g.gainKey + 1,
      };
    });
  }, [showWin]);

  const undo = useCallback(() => {
    setGame((g) => g.previousState ? {
      ...g, ...g.previousState, previousState: null, gameStatus: 'playing',
      merged: [], spawned: null, gain: 0,
    } : g);
    setShowWin(false);
  }, []);
  const restart = useCallback(() => { setGame(fresh()); setShowWin(false); }, []);
  const continuePlaying = useCallback(() => {
    setShowWin(false);
    setGame((g) => ({ ...g, gameStatus: 'playing' }));
  }, []);
  const toggleTheme = () => setPrefs((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }));
  const toggleSound = () => setPrefs((p) => ({ ...p, soundEnabled: !p.soundEnabled }));

  // Keyboard + swipe input
  useEffect(() => {
    const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('[role="dialog"]')) return;
      const dir = keys[e.key] || keys[e.key.toLowerCase?.()];
      if (dir) { e.preventDefault(); act(dir); }
    };
    let start = null;
    const onStart = (e) => { if (e.target.closest('.board')) start = [e.touches[0].clientX, e.touches[0].clientY]; };
    const onMove = (e) => { if (start && e.target.closest('.board')) e.preventDefault(); };
    const onEnd = (e) => {
      if (!start) return;
      const dx = e.changedTouches[0].clientX - start[0];
      const dy = e.changedTouches[0].clientY - start[1];
      start = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [act]);

  return { game, bestScore, prefs, showWin, act, undo, restart, continuePlaying, toggleTheme, toggleSound };
}
