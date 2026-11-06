import { SIZE, createEmptyBoard, cloneBoard, boardsEqual, emptyCells, getLine, toCoord } from './boardUtils.js';

export const TARGET = 2048;

export function spawnTile(board, rand = Math.random) {
  const cells = emptyCells(board);
  if (!cells.length) return { board, cell: null };
  const [r, c] = cells[Math.floor(rand() * cells.length)];
  const next = cloneBoard(board);
  next[r][c] = rand() < 0.9 ? 2 : 4;
  return { board: next, cell: [r, c] };
}

export function newBoard(rand = Math.random) {
  return spawnTile(spawnTile(createEmptyBoard(), rand).board, rand).board;
}

// Slide + merge one line toward index 0. Each tile merges at most once.
export function slideLine(line) {
  const tiles = line.filter(Boolean);
  const out = [];
  const mergedAt = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i + 1]) {
      const v = tiles[i] * 2;
      out.push(v);
      mergedAt.push(out.length - 1);
      gained += v;
      i++;
    } else out.push(tiles[i]);
  }
  while (out.length < SIZE) out.push(0);
  return { line: out, gained, mergedAt };
}

export function move(board, dir) {
  const next = createEmptyBoard();
  let gained = 0;
  const merged = [];
  for (let i = 0; i < SIZE; i++) {
    const res = slideLine(getLine(board, dir, i));
    gained += res.gained;
    res.line.forEach((v, p) => {
      const [r, c] = toCoord(dir, i, p);
      next[r][c] = v;
    });
    res.mergedAt.forEach((p) => merged.push(toCoord(dir, i, p)));
  }
  return { board: next, gained, merged, moved: !boardsEqual(board, next) };
}

export function hasMoves(board) {
  if (emptyCells(board).length) return true;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  return false;
}

export const hasReachedTarget = (board) => board.flat().some((v) => v >= TARGET);
