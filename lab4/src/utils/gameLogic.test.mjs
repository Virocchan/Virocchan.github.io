import assert from 'node:assert/strict';
import { slideLine, move, hasMoves, newBoard, spawnTile } from './gameLogic.js';

const L = (a) => slideLine(a).line;
assert.deepEqual(L([2, 2, 0, 0]), [4, 0, 0, 0]);
assert.deepEqual(L([2, 2, 2, 0]), [4, 2, 0, 0]);
assert.deepEqual(L([2, 2, 2, 2]), [4, 4, 0, 0]);
assert.deepEqual(L([4, 2, 2, 0]), [4, 4, 0, 0]);
assert.deepEqual(L([0, 0, 0, 2]), [2, 0, 0, 0]);
assert.equal(slideLine([4, 4, 8, 8]).gained, 24);

const b = [[2,0,0,2],[0,0,0,0],[0,0,0,0],[4,0,0,0]];
assert.deepEqual(move(b, 'right').board[0], [0,0,0,4]);
assert.deepEqual(move(b, 'left').board[3], [4,0,0,0]);
assert.deepEqual(move(b, 'up').board.map((r) => r[0]), [2,4,0,0]);
assert.deepEqual(move(b, 'down').board.map((r) => r[0]), [0,0,2,4]);
assert.equal(move([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]], 'left').moved, false);
assert.equal(hasMoves([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]]), false);
assert.equal(hasMoves([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,4]]), true);
assert.equal(newBoard().flat().filter(Boolean).length, 2);
assert.equal(spawnTile(newBoard()).board.flat().filter(Boolean).length, 3);
console.log('All game logic tests passed');
