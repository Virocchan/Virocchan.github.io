// Run with: node tests/logic.test.js
const assert = require('assert');
const L = require('../js/logic.js');

L.WIN_COMBOS.forEach((c) => { const b = L.emptyBoard(); c.forEach((i) => (b[i] = 'X')); assert.deepStrictEqual(L.getWinner(b).line, c); });
assert.strictEqual(L.getWinner(L.emptyBoard()), null);
assert.ok(L.isDraw(['X','O','X','X','O','O','O','X','X']));
assert.ok(!L.isDraw(['X','X','X','O','O',null,null,null,null]));

for (let n = 0; n < 200; n++) { const b = ['X','O',null,null,'X',null,'O',null,null]; assert.strictEqual(b[L.aiEasy(b)], null); }

assert.strictEqual(L.aiMedium(['O','O',null,'X','X',null,null,null,null]), 2); // takes the win
assert.strictEqual(L.aiMedium(['X','X',null,null,'O',null,null,null,null]), 2); // blocks
assert.strictEqual(L.aiMedium(L.emptyBoard()), 4);                              // centre first

// Hard AI never loses: try every possible human reply, with the human first and with the AI first.
function explore(b, turn, ai, human) {
  const w = L.getWinner(b);
  if (w) { assert.strictEqual(w.symbol, ai, 'Hard AI lost!'); return; }
  if (L.isDraw(b)) return;
  if (turn === ai) { const t = [...b]; t[L.aiHard(b, ai, human)] = ai; explore(t, human, ai, human); }
  else L.emptyCells(b).forEach((i) => { const t = [...b]; t[i] = human; explore(t, ai, ai, human); });
}
explore(L.emptyBoard(), 'X', 'O', 'X');
explore(L.emptyBoard(), 'O', 'O', 'X');
console.log('All tic-tac-toe logic tests passed');
