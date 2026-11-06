'use strict';
/* UI, storage, sound. Game rules and AI live in logic.js */
const $ = (s) => document.querySelector(s);
const AI_DELAY = 500;
const DIFF_INFO = {
  easy:   ['Easy',   'Random moves'],
  medium: ['Medium', 'Wins & blocks'],
  hard:   ['Hard',   'Minimax, unbeatable'],
};

/* ---------- storage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* unavailable */ } },
};
const freshScores = () => ({
  solo: { playerWins: 0, aiWins: 0, draws: 0, streak: 0, bestStreak: 0 },
  duo:  { player1Wins: 0, player2Wins: 0, draws: 0, streak: 0, bestStreak: 0, streakWho: null },
});
let scores = (() => { const s = store.get('ttt:scores', null); return s && s.solo && s.duo ? s : freshScores(); })();
const prefs = { dark: true, sound: true, difficulty: 'medium', p1: '', p2: '', ...store.get('ttt:prefs', {}) };
if (!DIFF_INFO[prefs.difficulty]) prefs.difficulty = 'medium';
const savePrefs = () => store.set('ttt:prefs', prefs);
const saveScores = () => store.set('ttt:scores', scores);

/* ---------- sound ---------- */
let ac;
function tone(f, d, type = 'triangle', g = .08, delay = 0) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime + delay, o = ac.createOscillator(), n = ac.createGain();
    o.type = type; o.frequency.value = f;
    n.gain.setValueAtTime(g, t); n.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(n).connect(ac.destination); o.start(t); o.stop(t + d);
  } catch { /* audio unavailable */ }
}
function sfx(name) {
  if (!prefs.sound) return;
  if (name === 'x') tone(600, .08);
  if (name === 'o') tone(400, .08);
  if (name === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'sine', .09, i * .11));
  if (name === 'lose') [330, 262, 196].forEach((f, i) => tone(f, .25, 'sawtooth', .04, i * .13));
  if (name === 'draw') { tone(300, .2, 'sine'); tone(300, .2, 'sine', .08, .18); }
}

/* ---------- game state ---------- */
const G = {
  mode: 'solo', difficulty: prefs.difficulty, board: emptyBoard(), current: 'X',
  status: 'ready', winner: null, line: [], isThinking: false, names: { X: 'You', O: 'Computer' },
  aiTimer: null, modalTimer: null,
};
const humanTurn = () => G.status === 'playing' && !G.isThinking && (G.mode === 'duo' || G.current === 'X');

function startGame(mode) {
  G.mode = mode;
  if (mode === 'solo') { G.difficulty = prefs.difficulty; G.names = { X: 'You', O: 'Computer' }; }
  else { G.names = { X: prefs.p1.trim() || 'Player 1', O: prefs.p2.trim() || 'Player 2' }; }
  show('game'); newRound();
}
function newRound() {
  clearTimeout(G.aiTimer); clearTimeout(G.modalTimer);
  Object.assign(G, { board: emptyBoard(), current: 'X', status: 'playing', winner: null, line: [], isThinking: false });
  buildBoard(); hideLine(); render();
}

/* ---------- board ---------- */
const X_SVG = '<svg viewBox="0 0 100 100" class="gx-s" aria-hidden="true"><path d="M12 12L88 88" pathLength="100"/><path d="M88 12L12 88" pathLength="100" style="animation-delay:.14s"/></svg>';
const O_SVG = '<svg viewBox="0 0 100 100" class="go-s" aria-hidden="true"><circle cx="50" cy="50" r="38" pathLength="100"/></svg>';
function buildBoard() {
  const board = $('#board'); board.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const b = document.createElement('button');
    b.className = 'cell'; b.dataset.i = i; b.setAttribute('role', 'gridcell');
    b.setAttribute('aria-label', `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}, empty`);
    b.addEventListener('click', () => playerMove(i));
    board.append(b);
  }
}
const cellEl = (i) => $(`.cell[data-i="${i}"]`);
function placeSymbol(i, s) {
  G.board[i] = s;
  const el = cellEl(i);
  el.innerHTML = s === 'X' ? X_SVG : O_SVG;
  el.setAttribute('aria-label', `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}, ${s}`);
  sfx(s === 'X' ? 'x' : 'o');
}
function showLine(line) {
  const c = (i) => [(i % 3) + .5, Math.floor(i / 3) + .5];
  const [x1, y1] = c(line[0]), [x2, y2] = c(line[2]), el = $('#winLineEl');
  el.setAttribute('x1', x1); el.setAttribute('y1', y1); el.setAttribute('x2', x2); el.setAttribute('y2', y2);
  const svg = $('#winLine'); svg.classList.remove('on'); void svg.getBoundingClientRect(); svg.classList.add('on');
}
function hideLine() { $('#winLine').classList.remove('on'); }

/* ---------- moves ---------- */
function playerMove(i) {
  if (!humanTurn() || G.board[i] !== null) return;
  applyMove(i);
}
function applyMove(i) {
  placeSymbol(i, G.current);
  const w = getWinner(G.board);
  if (w) return finish(w);
  if (isDraw(G.board)) return finish(null);
  G.current = G.current === 'X' ? 'O' : 'X';
  render();
  if (G.mode === 'solo' && G.current === 'O') {
    G.isThinking = true; render();
    G.aiTimer = setTimeout(() => {
      G.isThinking = false;
      if (G.status !== 'playing') return;
      applyMove(AI[G.difficulty](G.board, 'O', 'X'));
    }, AI_DELAY);
  }
}

/* ---------- finish + scoring ---------- */
function finish(w) {
  G.status = w ? 'won' : 'draw'; G.winner = w ? w.symbol : null; G.line = w ? w.line : [];
  recordResult(G.winner);
  if (w) { w.line.forEach((i) => cellEl(i).classList.add('win')); showLine(w.line); }
  render();
  const humanWon = G.mode === 'duo' ? !!w : w && w.symbol === 'X';
  sfx(!w ? 'draw' : humanWon ? 'win' : 'lose');
  G.modalTimer = setTimeout(showResult, 900);
}
function recordResult(winner) { // only called for completed games
  const s = scores[G.mode];
  s.streak = s.streak || 0;
  if (G.mode === 'solo') {
    if (winner === 'X') { s.playerWins++; s.streak++; } else { winner ? s.aiWins++ : s.draws++; s.streak = 0; }
  } else if (!winner) { s.draws++; s.streak = 0; s.streakWho = null; }
  else {
    winner === 'X' ? s.player1Wins++ : s.player2Wins++;
    s.streak = s.streakWho === winner ? s.streak + 1 : 1; s.streakWho = winner;
  }
  s.bestStreak = Math.max(s.bestStreak || 0, s.streak);
  saveScores();
}
const tally = (mode) => {
  const s = scores[mode];
  return mode === 'solo' ? { x: s.playerWins, o: s.aiWins, d: s.draws } : { x: s.player1Wins, o: s.player2Wins, d: s.draws };
};

/* ---------- rendering ---------- */
function render() {
  $('#nameX').textContent = G.names.X; $('#nameO').textContent = G.names.O;
  $('#plX').classList.toggle('active', G.status === 'playing' && G.current === 'X');
  $('#plO').classList.toggle('active', G.status === 'playing' && G.current === 'O');
  let msg;
  if (G.status === 'won') msg = G.mode === 'solo' ? (G.winner === 'X' ? 'You win!' : 'Computer wins') : `${G.names[G.winner]} wins!`;
  else if (G.status === 'draw') msg = "It's a draw";
  else if (G.isThinking) msg = 'Computer is thinking…';
  else msg = G.mode === 'solo' ? 'Your turn (X)' : `${G.names[G.current]}'s turn (${G.current})`;
  $('#turn').textContent = msg;
  document.querySelectorAll('.cell').forEach((el) => { el.disabled = !(humanTurn() && G.board[+el.dataset.i] === null); });
  const t = tally(G.mode);
  $('#score').innerHTML = [[G.names.X, t.x], ['Draws', t.d], [G.names.O, t.o]]
    .map(([l, n]) => `<div class="sc"><span>${esc(l)}</span><b>${n}</b></div>`).join('');
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function show(id) {
  ['home', 'soloSetup', 'duoSetup', 'game'].forEach((s) => ($('#' + s).hidden = s !== id));
  if (id === 'home') { clearTimeout(G.aiTimer); clearTimeout(G.modalTimer); G.status = 'ready'; G.isThinking = false; }
}

/* ---------- modals ---------- */
let returnFocus = null;
function openModal(title, html, actions) {
  returnFocus = document.activeElement;
  $('#mTitle').textContent = title; $('#mBody').innerHTML = html;
  const box = $('#mActions'); box.innerHTML = '';
  actions.forEach(([label, fn, cls]) => {
    const b = document.createElement('button');
    b.className = 'btn ' + (cls || ''); b.textContent = label;
    b.onclick = () => { closeModal(false); fn(); };
    box.append(b);
  });
  $('#overlay').hidden = false; box.querySelector('button').focus();
}
function closeModal(restoreFocus = true) { $('#overlay').hidden = true; if (restoreFocus) returnFocus?.focus?.(); }
function showResult() {
  const solo = G.mode === 'solo', t = tally(G.mode), s = scores[G.mode];
  const title = G.status === 'draw' ? "It's a draw" : solo ? (G.winner === 'X' ? 'You win! 🎉' : 'Computer wins') : `${G.names[G.winner]} wins! 🎉`;
  const body = `<p>${esc(G.names.X)} <b>${t.x}</b> · Draws <b>${t.d}</b> · ${esc(G.names.O)} <b>${t.o}</b></p>
    <p>Current streak: <b>${s.streak}</b> · Best: <b>${s.bestStreak}</b></p>`;
  openModal(title, body, [['Play Again', newRound, 'primary'], ['Back to Home', () => show('home')]]);
}
function statBlock(mode) {
  const s = scores[mode], t = tally(mode), total = t.x + t.o + t.d;
  const cells = [['X Wins', t.x], ['O Wins', t.o], ['Draws', t.d], ['Total Games', total], ['Win Streak', s.streak || 0], ['Best Streak', s.bestStreak || 0]];
  return `<div class="stat-block"><h3>${mode === 'solo' ? 'Solo (You vs Computer)' : 'Duo (Player 1 vs Player 2)'}</h3>
    <div class="stat-grid">${cells.map(([l, n]) => `<div><b>${n}</b>${l}</div>`).join('')}</div></div>`;
}
function showStats() {
  openModal('Statistics', statBlock('solo') + statBlock('duo'),
    [['Reset Scores', confirmReset, 'danger'], ['Close', () => {}, 'primary']]);
}
function confirmReset() {
  openModal('Reset all scores?', '<p>Solo and Duo scores and streaks will be cleared. This cannot be undone.</p>',
    [['Reset Scores', () => { scores = freshScores(); saveScores(); if (!$('#game').hidden) render(); }, 'danger'], ['Cancel', showStats, 'primary']]);
}
function showHow() {
  openModal('How to play', `<ol><li>X always goes first. Tap an empty cell to place your symbol.</li>
    <li>Get three of your symbols in a row, column or diagonal to win.</li>
    <li>If all nine cells fill up with no winner, it's a draw.</li>
    <li><b>Solo:</b> you are X against the computer (Easy, Medium or Hard).</li>
    <li><b>Duo:</b> two players take turns on the same device.</li></ol>`, [['Got it', () => {}, 'primary']]);
}

/* ---------- setup screens ---------- */
function renderDiff() {
  const box = $('#diffChoices'); box.innerHTML = '';
  Object.entries(DIFF_INFO).forEach(([k, [label, sub]]) => {
    const b = document.createElement('button');
    b.className = 'choice'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', prefs.difficulty === k);
    b.innerHTML = `${label}<small>${sub}</small>`;
    b.onclick = () => { prefs.difficulty = k; savePrefs(); renderDiff(); };
    box.append(b);
  });
}
function applyPrefs() {
  document.documentElement.dataset.theme = prefs.dark ? 'dark' : 'light';
  $('#themeBtn').textContent = prefs.dark ? '☀️' : '🌙';
  $('#themeBtn').setAttribute('aria-label', prefs.dark ? 'Switch to light theme' : 'Switch to dark theme');
  $('#soundBtn').textContent = prefs.sound ? '🔊' : '🔇';
  $('#soundBtn').setAttribute('aria-label', prefs.sound ? 'Mute sound' : 'Unmute sound');
  $('#soundBtn').setAttribute('aria-pressed', String(!prefs.sound));
}

/* ---------- events ---------- */
$('#soloBtn').onclick = () => { renderDiff(); show('soloSetup'); };
$('#duoBtn').onclick = () => { $('#p1Name').value = prefs.p1; $('#p2Name').value = prefs.p2; show('duoSetup'); };
$('#statsBtn').onclick = showStats;
$('#howBtn').onclick = showHow;
$('#soloStart').onclick = () => startGame('solo');
$('#duoStart').onclick = () => { prefs.p1 = $('#p1Name').value; prefs.p2 = $('#p2Name').value; savePrefs(); startGame('duo'); };
document.querySelectorAll('[data-home]').forEach((b) => (b.onclick = () => show('home')));
$('#restartBtn').onclick = newRound;   // restarting never changes scores
$('#homeBtn').onclick = () => show('home');
$('#themeBtn').onclick = () => { prefs.dark = !prefs.dark; savePrefs(); applyPrefs(); };
$('#soundBtn').onclick = () => { prefs.sound = !prefs.sound; savePrefs(); applyPrefs(); };
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#overlay').hidden) closeModal(); });
applyPrefs();
