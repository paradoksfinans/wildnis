'use strict';
// ═══════════════ HELFER ═══════════════
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const chance = p => Math.random() < p;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function wpick(list) { // [{w:..}, ...] oder [[item,w],...]
  let tot = 0; for (const e of list) tot += (Array.isArray(e) ? e[1] : e.w);
  let r = Math.random() * tot;
  for (const e of list) { r -= (Array.isArray(e) ? e[1] : e.w); if (r <= 0) return Array.isArray(e) ? e[0] : e; }
  return Array.isArray(list[0]) ? list[0][0] : list[0];
}
// deterministischer Zufall (für Landschaften)
function srng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const fmt = n => Math.round(n).toLocaleString('de-DE');
function fmtTime(min) { const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }
const IMG = {};
function loadImages(cb) {
  const keys = Object.keys(ASSETS); let left = keys.length;
  if (!left) { cb(); return; }
  keys.forEach(k => { const im = new Image(); im.onload = im.onerror = () => { if (--left === 0) cb(); }; im.src = ASSETS[k]; IMG[k] = im; });
}
function imgOk(k) { const i = IMG[k]; return i && i.complete && i.naturalWidth > 0; }

// ═══════════════ AUDIO (prozedural, WebAudio) ═══════════════
const SFX = (() => {
  let ctx = null, master = null, musicGain = null, ambGain = null, noiseBuf = null, on = true, musicOn = true;
  let ambNodes = {}, musicTimer = null;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.22; musicGain.connect(master);
      ambGain = ctx.createGain(); ambGain.gain.value = 0.5; ambGain.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      startMusic();
    } catch (e) { ctx = null; }
  }
  function tone(f, dur, type = 'square', vol = 0.15, slide = 0, delay = 0, dest) {
    if (!ctx || !on) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol = 0.2, freq = 1200, q = 1, type = 'bandpass', delay = 0) {
    if (!ctx || !on) return;
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  const lib = {
    click: () => tone(880, 0.05, 'square', 0.05),
    tab: () => { tone(520, 0.04, 'square', 0.04); tone(780, 0.05, 'square', 0.04, 0, 0.03); },
    gather: () => { noise(0.12, 0.18, 2500, 2); tone(300, 0.08, 'triangle', 0.08, -100); },
    chop: () => { noise(0.08, 0.35, 900, 3); tone(140, 0.12, 'square', 0.12, -60); },
    stone: () => { noise(0.06, 0.3, 3200, 5); tone(1800, 0.04, 'square', 0.04); },
    water: () => { for (let i = 0; i < 4; i++) tone(rnd(600, 1300), 0.06, 'sine', 0.06, rnd(200, 500), i * 0.05); },
    eat: () => { noise(0.07, 0.2, 700, 1, 'lowpass'); noise(0.07, 0.2, 700, 1, 'lowpass', 0.12); },
    craft: () => { tone(330, 0.07, 'square', 0.07); tone(440, 0.07, 'square', 0.07, 0, 0.07); tone(660, 0.12, 'square', 0.07, 0, 0.14); },
    build: () => { noise(0.1, 0.3, 600, 2); noise(0.1, 0.3, 600, 2, 'bandpass', 0.18); tone(523, 0.2, 'triangle', 0.1, 0, 0.3); tone(784, 0.25, 'triangle', 0.1, 0, 0.42); },
    fire: () => { noise(0.5, 0.25, 500, 0.5, 'lowpass'); tone(180, 0.4, 'sawtooth', 0.04, 120); },
    hit: () => { noise(0.1, 0.45, 1400, 1); tone(160, 0.12, 'square', 0.14, -90); },
    crit: () => { noise(0.16, 0.55, 2200, 1); tone(900, 0.15, 'sawtooth', 0.12, -600); tone(120, 0.2, 'square', 0.15, -60, 0.03); },
    hurt: () => { tone(220, 0.18, 'sawtooth', 0.14, -140); noise(0.12, 0.3, 500, 1, 'lowpass'); },
    miss: () => noise(0.18, 0.15, 3000, 0.7, 'highpass'),
    block: () => { tone(1200, 0.06, 'square', 0.08); tone(600, 0.15, 'triangle', 0.1, -200, 0.02); },
    heal: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.15, 'sine', 0.09, 0, i * 0.06)); },
    buff: () => { [392, 523, 659].forEach((f, i) => tone(f, 0.12, 'triangle', 0.09, 60, i * 0.05)); },
    fireatk: () => { noise(0.4, 0.4, 700, 0.7, 'lowpass'); tone(300, 0.3, 'sawtooth', 0.06, -200); },
    zap: () => { for (let i = 0; i < 5; i++) tone(rnd(800, 2400), 0.04, 'square', 0.06, -400, i * 0.03); },
    roar: () => { tone(90, 0.7, 'sawtooth', 0.16, -40); noise(0.7, 0.25, 300, 0.6, 'lowpass'); },
    encounter: () => { [196, 0, 196, 233, 262].forEach((f, i) => f && tone(f, 0.1, 'square', 0.1, 0, i * 0.08)); tone(392, 0.3, 'square', 0.1, 0, 0.42); },
    boss: () => { tone(65, 1.4, 'sawtooth', 0.2, -10); tone(98, 1.4, 'sawtooth', 0.12, -10, 0.05); noise(1.2, 0.2, 200, 0.5, 'lowpass'); },
    win: () => { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.16, 'square', 0.08, 0, i * 0.1)); },
    lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, -20, i * 0.22)); },
    levelup: () => { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.18, 'square', 0.07, 0, i * 0.07)); tone(2093, 0.5, 'sine', 0.08, 0, 0.45); },
    coin: () => { tone(988, 0.06, 'square', 0.06); tone(1319, 0.18, 'square', 0.06, 0, 0.06); },
    achieve: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, 0, i * 0.09)); },
    discover: () => { [440, 554, 659, 880].forEach((f, i) => tone(f, 0.3, 'sine', 0.08, 0, i * 0.12)); },
    danger: () => { tone(110, 0.25, 'square', 0.1); tone(104, 0.25, 'square', 0.1, 0, 0.3); },
    arkon: () => { for (let i = 0; i < 8; i++) tone(rnd(1500, 3500), 0.03, 'square', 0.03, 0, i * 0.04); tone(220, 0.6, 'sine', 0.08, 0, 0.3); },
    bad: () => tone(160, 0.2, 'square', 0.08, -40),
    step: () => noise(0.05, 0.12, 400, 1, 'lowpass'),
    thunder: () => { noise(1.8, 0.5, 120, 0.4, 'lowpass'); noise(0.3, 0.3, 800, 0.4, 'lowpass'); },
    type: () => tone(rnd(1400, 1600), 0.015, 'square', 0.015),
  };
  function play(n) { if (!ctx || !on) return; try { lib[n] && lib[n](); } catch (e) { } }
  // Ambient-Schichten: Regen, Feuer, Wind, Grillen
  function ambLayer(key, want, build) {
    if (!ctx) return;
    if (want && !ambNodes[key] && on) { ambNodes[key] = build(); }
    else if ((!want || !on) && ambNodes[key]) {
      const n = ambNodes[key]; n.g.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      setTimeout(() => { try { n.stop(); } catch (e) { } }, 1500); delete ambNodes[key];
    }
  }
  function loopNoise(freq, q, type, vol, lfo) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = 0; g.gain.setTargetAtTime(vol, ctx.currentTime, 0.8);
    s.connect(f); f.connect(g); g.connect(ambGain); s.start();
    let lo = null;
    if (lfo) { lo = ctx.createOscillator(); const lg = ctx.createGain(); lo.frequency.value = lfo[0]; lg.gain.value = lfo[1]; lo.connect(lg); lg.connect(g.gain); lo.start(); }
    return { g, stop() { s.stop(); lo && lo.stop(); } };
  }
  function crickets() {
    const g = ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.03, ctx.currentTime, 1); g.connect(ambGain);
    const o = ctx.createOscillator(); o.frequency.value = 4400; o.type = 'sine';
    const am = ctx.createOscillator(); am.frequency.value = 22; const amg = ctx.createGain(); amg.gain.value = 1;
    const env = ctx.createGain(); env.gain.value = 0; am.connect(amg); amg.connect(env.gain); o.connect(env); env.connect(g);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.7; const lg = ctx.createGain(); lg.gain.value = 0.03; lfo.connect(lg); lg.connect(g.gain);
    o.start(); am.start(); lfo.start();
    return { g, stop() { o.stop(); am.stop(); lfo.stop(); } };
  }
  function ambient(st) {
    if (!ctx) return;
    ambLayer('rain', st.rain, () => loopNoise(1800, 0.4, 'lowpass', st.storm ? 0.32 : 0.2));
    ambLayer('fire', st.fire, () => loopNoise(380, 0.6, 'lowpass', 0.12, [6, 0.06]));
    ambLayer('wind', st.wind, () => loopNoise(420, 0.8, 'bandpass', 0.09, [0.15, 0.06]));
    ambLayer('crickets', st.night && !st.rain && !st.cold, crickets);
  }
  // generative Musik: dunkle Pentatonik
  const SCALES = { calm: [0, 3, 5, 7, 10], tense: [0, 1, 5, 7, 8], arkon: [0, 2, 3, 7, 9] };
  let mood = 'calm', root = 110;
  function startMusic() {
    if (musicTimer) return;
    let step = 0;
    musicTimer = setInterval(() => {
      if (!ctx || !on || !musicOn) return;
      step++;
      const sc = SCALES[mood] || SCALES.calm;
      if (step % 16 === 1) { tone(root / 2, 7, 'sine', 0.12, 0, 0, musicGain); tone(root / 2 * 1.5, 7, 'sine', 0.05, 0, 0.1, musicGain); }
      if (chance(mood === 'tense' ? 0.55 : 0.32)) {
        const n = sc[rint(0, sc.length - 1)] + 12 * rint(1, 2);
        tone(root * Math.pow(2, n / 12), rnd(0.8, 2), 'triangle', 0.05, 0, 0, musicGain);
      }
    }, mood === 'tense' ? 260 : 420);
  }
  function setMood(m, r) { mood = m; if (r) root = r; }
  return {
    init, play, ambient, setMood,
    get on() { return on; }, set on(v) { on = v; if (!v) Object.keys(ambNodes).forEach(k => ambLayer(k, false)); },
    get music() { return musicOn; }, set music(v) { musicOn = v; },
  };
})();
function vibrate(ms) { try { if (navigator.vibrate && G && G.opt && G.opt.vib) navigator.vibrate(ms); } catch (e) { } }
