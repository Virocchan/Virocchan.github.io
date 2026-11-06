// Tiny synthesized sound effects (no audio files needed).
let ctx;
const tone = (freq, dur, type = 'sine', gain = 0.08, delay = 0) => {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur);
  } catch { /* audio unavailable */ }
};
export const playSound = (name) => {
  if (name === 'move') tone(220, 0.07, 'triangle');
  if (name === 'merge') { tone(440, 0.1, 'triangle'); tone(660, 0.12, 'triangle', 0.08, 0.05); }
  if (name === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', 0.09, i * 0.12));
  if (name === 'over') [330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.05, i * 0.15));
};
