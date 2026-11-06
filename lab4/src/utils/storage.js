const K = { game: '2048:game', best: '2048:best', prefs: '2048:prefs' };
const read = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export const loadGame = () => {
  const g = read(K.game, null);
  const ok = g && Array.isArray(g.board) && g.board.length === 4 && g.board.every((r) => Array.isArray(r) && r.length === 4);
  return ok ? g : null;
};
export const saveGame = (g) => write(K.game, g);
export const loadBest = () => Number(read(K.best, 0)) || 0;
export const saveBest = (n) => write(K.best, n);
export const loadPrefs = () => ({
  theme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  soundEnabled: true,
  ...read(K.prefs, {}),
});
export const savePrefs = (p) => write(K.prefs, p);
