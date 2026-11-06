export const SIZE = 4;
export const createEmptyBoard = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
export const cloneBoard = (b) => b.map((r) => [...r]);
export const boardsEqual = (a, b) => a.every((row, r) => row.every((v, c) => v === b[r][c]));
export const emptyCells = (b) => {
  const out = [];
  b.forEach((row, r) => row.forEach((v, c) => v === 0 && out.push([r, c])));
  return out;
};
export const maxTile = (b) => Math.max(...b.flat());

// Get line i in "movement order" (index 0 = the wall tiles slide toward).
export const getLine = (b, dir, i) => {
  const idx = [...Array(SIZE).keys()];
  switch (dir) {
    case 'left': return idx.map((c) => b[i][c]);
    case 'right': return idx.map((c) => b[i][SIZE - 1 - c]);
    case 'up': return idx.map((r) => b[r][i]);
    default: return idx.map((r) => b[SIZE - 1 - r][i]);
  }
};
// Convert (line i, position p) back to board coordinates.
export const toCoord = (dir, i, p) => {
  switch (dir) {
    case 'left': return [i, p];
    case 'right': return [i, SIZE - 1 - p];
    case 'up': return [p, i];
    default: return [SIZE - 1 - p, i];
  }
};
