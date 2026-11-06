'use strict';
/* ---------- config ---------- */
const DIFFS = {
  easy:   { label: 'Easy',   cols: 4, rows: 4, pairs: 8,  stars: [12, 18] },
  medium: { label: 'Medium', cols: 5, rows: 4, pairs: 10, stars: [16, 24] },
  hard:   { label: 'Hard',   cols: 6, rows: 4, pairs: 12, stars: [20, 30] },
};
const THEMES = {
  animals:  { label: 'Animals',  icon: '🐼', set: ['🐱','🐶','🐼','🦊','🦁','🐘','🐰','🐻','🐸','🐵','🐯','🐨'] },
  fruits:   { label: 'Fruits',   icon: '🍓', set: ['🍎','🍌','🍇','🍓','🍉','🍍','🥝','🍒','🍑','🍋','🥭','🍐'] },
  space:    { label: 'Space',    icon: '🚀', set: ['🚀','🌙','⭐','🪐','☄️','👽','🛸','🌍','☀️','🌠','🔭','🛰️'] },
  vehicles: { label: 'Vehicles', icon: '🚗', set: ['🚗','🚕','🚌','🚓','🚑','🚒','🚜','✈️','🚲','⛵','🚂','🏍️'] },
  nature:   { label: 'Nature',   icon: '🌻', set: ['🌻','🌲','🍄','🌵','🌷','🍀','🌈','🌊','🔥','❄️','🌴','🍁'] },
  food:     { label: 'Food',     icon: '🍕', set: ['🍕','🍔','🍟','🌮','🍩','🍪','🍦','🧁','🍣','🥐','🍿','🥨'] },
};
const MISMATCH_DELAY = 800;

/* ---------- storage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* unavailable */ } },
};
const prefs = {
  difficulty: 'easy', theme: 'animals', sound: true,
  dark: matchMedia('(prefers-color-scheme: dark)').matches,
  ...store.get('mm:prefs', {}),
};
if (!DIFFS[prefs.difficulty]) prefs.difficulty = 'easy';
if (!THEMES[prefs.theme]) prefs.theme = 'animals';
let records = store.get('mm:records', {});

/* ---------- helpers ---------- */
const $ = (s) => document.querySelector(s);
const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function shuffle(arr) { // Fisher–Yates
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function createDeck(diff, themeKey) {
  const imgs = shuffle(THEMES[themeKey].set).slice(0, DIFFS[diff].pairs);
  let id = 0;
  const cards = [];
  imgs.forEach((image) => { for (let k = 0; k < 2; k++) cards.push({ id: id++, pairId: image, image }); });
  return shuffle(cards);
}
const starCount = (diff, moves) => { const [three, two] = DIFFS[diff].stars; return moves <= three ? 3 : moves <= two ? 2 : 1; };

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
  if (name === 'flip') tone(520, .06);
  if (name === 'match') { tone(660, .12, 'sine'); tone(880, .15, 'sine', .08, .08); }
  if (name === 'miss') tone(180, .15, 'sawtooth', .04);
  if (name === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, 'sine', .09, i * .13));
}

/* ---------- game state ---------- */
const G = {
  cards: [], flipped: [], matched: new Set(), moves: 0, status: 'ready',
  difficulty: prefs.difficulty, isChecking: false,
  elapsed: 0, startedAt: 0, tickId: null, mismatchId: null,
};
const elapsed = () => G.elapsed + (G.status === 'playing' ? performance.now() - G.startedAt : 0);

function clearTimers() {
  clearTimeout(G.mismatchId); G.mismatchId = null;
  clearInterval(G.tickId); G.tickId = null;
}
function startGame(diff = G.difficulty) {
  clearTimers();
  Object.assign(G, {
    difficulty: diff, cards: createDeck(diff, prefs.theme), flipped: [], matched: new Set(),
    moves: 0, status: 'ready', isChecking: false, elapsed: 0, startedAt: 0,
  });
  prefs.difficulty = diff; store.set('mm:prefs', prefs);
  $('#home').hidden = true; $('#game').hidden = false; $('#pauseCover').hidden = true;
  $('#pauseBtn').textContent = 'Pause';
  buildBoard(); updateStats();
}
function buildBoard() {
  const d = DIFFS[G.difficulty], board = $('#board');
  board.style.setProperty('--cols', d.cols);
  board.dataset.cols = d.cols; board.dataset.rows = d.rows;
  board.innerHTML = '';
  G.cards.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'card'; b.dataset.id = c.id; b.setAttribute('role', 'gridcell');
    b.setAttribute('aria-label', 'Hidden card');
    b.innerHTML = '<span class="inner"><span class="face back">?</span><span class="face front" aria-hidden="true">' + c.image + '</span></span>';
    b.addEventListener('click', () => flipCard(c.id));
    board.append(b);
  });
  fitColumns();
}
// On narrow portrait screens, show the grid transposed (e.g. 4 columns x 6 rows) so cards stay tappable.
function fitColumns() {
  const d = DIFFS[G.difficulty];
  const narrow = innerWidth < 520 && innerHeight > innerWidth;
  $('#board').style.setProperty('--cols', narrow ? d.rows : d.cols);
}
addEventListener('resize', fitColumns);

function cardEl(id) { return $(`.card[data-id="${id}"]`); }
function setCardState(id, state) {
  const el = cardEl(id), c = G.cards[G.cards.findIndex((x) => x.id === id)];
  el.classList.toggle('flipped', state === 'flipped');
  el.classList.toggle('matched', state === 'matched');
  el.disabled = state === 'matched';
  el.setAttribute('aria-label', state === 'hidden' ? 'Hidden card' : `${c.pairId}${state === 'matched' ? ', matched' : ''}`);
}

function flipCard(id) {
  // Algorithm B: validate
  if (G.status !== 'ready' && G.status !== 'playing') return;
  if (G.isChecking || G.flipped.length >= 2) return;
  const card = G.cards.find((c) => c.id === id);
  if (G.matched.has(card.pairId) || G.flipped.includes(id)) return;

  if (G.status === 'ready') {            // timer starts on the first valid flip
    G.status = 'playing'; G.startedAt = performance.now();
    G.tickId = setInterval(updateTime, 250);
  }
  G.flipped.push(id); setCardState(id, 'flipped'); sfx('flip');
  if (G.flipped.length === 2) { G.moves++; checkPair(); }
  updateStats();
}
function checkPair() {
  const [a, b] = G.flipped.map((id) => G.cards.find((c) => c.id === id));
  if (a.pairId === b.pairId) {
    G.matched.add(a.pairId);
    G.flipped.forEach((id) => setCardState(id, 'matched'));
    G.flipped = []; sfx('match');
    $('#announce').textContent = `Match: ${a.pairId}`;
    if (G.matched.size === DIFFS[G.difficulty].pairs) win();
  } else {
    G.isChecking = true; sfx('miss');
    const mine = G.flipped.slice();
    G.mismatchId = setTimeout(() => {
      mine.forEach((id) => setCardState(id, 'hidden'));
      G.flipped = []; G.isChecking = false; G.mismatchId = null;
    }, MISMATCH_DELAY);
  }
}

/* ---------- stats, pause, win ---------- */
function updateTime() { $('#time').textContent = fmt(elapsed()); }
function bestText() {
  const r = records[G.difficulty];
  return r ? `${r.moves} · ${fmt(r.time)}` : '–';
}
function updateStats() {
  $('#moves').textContent = G.moves;
  $('#pairs').textContent = `${G.matched.size}/${DIFFS[G.difficulty].pairs}`;
  $('#best').textContent = bestText();
  updateTime();
}
function pause() {
  if (G.status !== 'playing') return;
  G.elapsed += performance.now() - G.startedAt; G.status = 'paused';
  clearInterval(G.tickId); G.tickId = null;
  $('#pauseCover').hidden = false; $('#pauseBtn').textContent = 'Resume'; updateTime();
  $('#resumeBtn').focus();
}
function resume() {
  if (G.status !== 'paused') return;
  G.status = 'playing'; G.startedAt = performance.now();
  G.tickId = setInterval(updateTime, 250);
  $('#pauseCover').hidden = true; $('#pauseBtn').textContent = 'Pause';
}
function win() {
  G.elapsed += performance.now() - G.startedAt; G.status = 'won';
  clearInterval(G.tickId); G.tickId = null; updateTime();
  const stars = starCount(G.difficulty, G.moves), time = G.elapsed, prev = records[G.difficulty];
  const bestMoves = !prev || G.moves < prev.moves, bestTime = !prev || time < prev.time;
  if (bestMoves || bestTime) {
    records[G.difficulty] = { moves: Math.min(G.moves, prev ? prev.moves : Infinity), time: Math.min(time, prev ? prev.time : Infinity) };
    store.set('mm:records', records);
  }
  updateStats(); sfx('win');
  setTimeout(() => {
    const rec = [bestMoves && 'fewest moves', bestTime && 'fastest time'].filter(Boolean);
    openModal('You did it! 🎉',
      `<div class="stars" aria-label="${stars} out of 3 stars">${[1, 2, 3].map((n) => `<span class="${n <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>
       <p><b>${G.moves}</b> moves · <b>${fmt(time)}</b></p>
       ${rec.length ? `<p class="record">New record: ${rec.join(' and ')}!</p>` : ''}`,
      [['Play Again', () => startGame(), true], ['Change Difficulty', goHome]]);
  }, 700);
}

/* ---------- modal & navigation ---------- */
let modalReturnFocus = null;
function openModal(title, html, actions) {
  modalReturnFocus = document.activeElement;
  $('#mTitle').textContent = title; $('#mBody').innerHTML = html;
  const box = $('#mActions'); box.innerHTML = '';
  actions.forEach(([label, fn, primary]) => {
    const b = document.createElement('button');
    b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
    b.onclick = () => { closeModal(); fn(); };
    box.append(b);
  });
  $('#overlay').hidden = false; box.querySelector('button').focus();
}
function closeModal() { $('#overlay').hidden = true; modalReturnFocus?.focus?.(); }
function goHome() { clearTimers(); G.status = 'ready'; $('#game').hidden = true; $('#home').hidden = false; renderHome(); }
function showHow() {
  openModal('How to play', `<ol><li>Flip one card.</li><li>Flip a second card.</li><li>Remember the images and find matching pairs.</li><li>Match every pair to complete the board.</li><li>Finish in fewer moves to improve your result.</li></ol>`, [['Got it', () => {}, true]]);
}
function confirmRestart() {
  if (G.status === 'playing' || G.status === 'paused') {
    const wasPlaying = G.status === 'playing'; pause();
    openModal('Restart game?', '<p>Your progress on this board will be lost.</p>',
      [['Restart', () => startGame(), true], ['Keep playing', () => { if (wasPlaying) resume(); }]]);
  } else startGame();
}

/* ---------- home rendering & prefs ---------- */
function choiceBtn(html, checked, onClick) {
  const b = document.createElement('button');
  b.className = 'choice'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', checked);
  b.innerHTML = html; b.onclick = onClick; return b;
}
function renderHome() {
  const dBox = $('#diffChoices'); dBox.innerHTML = '';
  Object.entries(DIFFS).forEach(([k, d]) => dBox.append(choiceBtn(
    `${d.label}<small>${d.cols} × ${d.rows} · ${d.pairs} pairs</small>`, prefs.difficulty === k,
    () => { prefs.difficulty = k; store.set('mm:prefs', prefs); renderHome(); })));
  const tBox = $('#themeChoices'); tBox.innerHTML = '';
  Object.entries(THEMES).forEach(([k, t]) => tBox.append(choiceBtn(
    `${t.icon}<small>${t.label}</small>`, prefs.theme === k,
    () => { prefs.theme = k; store.set('mm:prefs', prefs); renderHome(); })));
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
$('#playBtn').onclick = () => startGame(prefs.difficulty);
$('#howBtn').onclick = showHow;
$('#pauseBtn').onclick = () => (G.status === 'paused' ? resume() : pause());
$('#resumeBtn').onclick = resume;
$('#restartBtn').onclick = confirmRestart;
$('#menuBtn').onclick = goHome;
$('#themeBtn').onclick = () => { prefs.dark = !prefs.dark; store.set('mm:prefs', prefs); applyPrefs(); };
$('#soundBtn').onclick = () => { prefs.sound = !prefs.sound; store.set('mm:prefs', prefs); applyPrefs(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#overlay').hidden) closeModal(); });

applyPrefs(); renderHome();
