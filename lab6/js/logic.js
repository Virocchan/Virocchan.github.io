'use strict';
/* Pure game + AI logic (works in the browser and in Node for tests). */
const WIN_COMBOS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const emptyBoard = () => Array(9).fill(null);
const emptyCells = (b) => b.reduce((a, v, i) => (v === null ? [...a, i] : a), []);

function getWinner(b) {
  for (const [x, y, z] of WIN_COMBOS) if (b[x] && b[x] === b[y] && b[x] === b[z]) return { symbol: b[x], line: [x, y, z] };
  return null;
}
const isDraw = (b) => b.every((c) => c !== null) && !getWinner(b);

/* Easy: any empty cell */
function aiEasy(b, rand = Math.random) { const e = emptyCells(b); return e[Math.floor(rand() * e.length)]; }

/* Medium: win > block > centre > corner > edge */
function findWinningMove(b, s) {
  for (const i of emptyCells(b)) { const t = [...b]; t[i] = s; if (getWinner(t)) return i; }
  return -1;
}
function aiMedium(b, ai = 'O', human = 'X', rand = Math.random) {
  let m = findWinningMove(b, ai); if (m >= 0) return m;
  m = findWinningMove(b, human); if (m >= 0) return m;
  if (b[4] === null) return 4;
  for (const group of [[0, 2, 6, 8], [1, 3, 5, 7]]) {
    const free = group.filter((i) => b[i] === null);
    if (free.length) return free[Math.floor(rand() * free.length)];
  }
  return aiEasy(b, rand);
}

/* Hard: Minimax, depth-adjusted (10 - depth for a win, depth - 10 for a loss) */
function minimax(b, isAi, depth, ai, human) {
  const w = getWinner(b);
  if (w) return w.symbol === ai ? 10 - depth : depth - 10;
  if (b.every((c) => c !== null)) return 0;
  let best = isAi ? -Infinity : Infinity;
  for (const i of emptyCells(b)) {
    b[i] = isAi ? ai : human;
    const s = minimax(b, !isAi, depth + 1, ai, human);
    b[i] = null;
    best = isAi ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}
function aiHard(b, ai = 'O', human = 'X', rand = Math.random) {
  const board = [...b]; let bestScore = -Infinity, moves = [];
  for (const i of emptyCells(board)) {
    board[i] = ai;
    const s = minimax(board, false, 1, ai, human);
    board[i] = null;
    if (s > bestScore) { bestScore = s; moves = [i]; } else if (s === bestScore) moves.push(i);
  }
  return moves[Math.floor(rand() * moves.length)]; // random among equally strong moves
}
const AI = { easy: aiEasy, medium: aiMedium, hard: aiHard };

if (typeof module !== 'undefined') module.exports = { WIN_COMBOS, emptyBoard, emptyCells, getWinner, isDraw, aiEasy, aiMedium, aiHard, AI };
