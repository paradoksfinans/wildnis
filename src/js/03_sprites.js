// ═══════════════ PIXEL-SPRITE-ENGINE ═══════════════
// Zeichnet Sprites mit Primitiven auf kleinen Canvas, dann: Alpha-Schwelle, Auto-Schattierung, Kontur.
const SPR = {};
function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function shade(h, f) { const [r, g, b] = hex2rgb(h); const m = v => clamp(Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)), 0, 255); return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')'; }
function makeSprite(w, h, draw, opt = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const B = {
    x, w, h,
    r(a, b, ww, hh, col) { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.round(ww), Math.round(hh)); },
    p(a, b, col) { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), 1, 1); },
    e(cx, cy, rx, ry, col, rot = 0) { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, Math.max(.5, rx), Math.max(.5, ry), rot, 0, Math.PI * 2); x.fill(); },
    poly(pts, col) { x.fillStyle = col; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); },
    l(a, b, c2, d, col, lw = 1) { x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke(); },
    q(pts, col, lw = 1) { x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); },
    glow(cx, cy, rad, col) { x.save(); x.globalCompositeOperation = 'source-over'; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); x.restore(); },
  };
  draw(B);
  if (!opt.raw) pixelPost(c, opt);
  return c;
}
function pixelPost(c, opt = {}) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  const id = x.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 110) { const a = d[i + 3] / 255; d[i] = Math.min(255, d[i] / a); d[i + 1] = Math.min(255, d[i + 1] / a); d[i + 2] = Math.min(255, d[i + 2] / a); d[i + 3] = 255; } else d[i + 3] = 0; }
  const src = new Uint8ClampedArray(d);
  const A = (xx, yy) => xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : src[(yy * w + xx) * 4 + 3];
  if (opt.shade !== false) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4; if (!src[i + 3]) continue;
      let f = 0;
      if (!A(xx, yy - 1)) f += 0.22; else if (!A(xx, yy - 2)) f += 0.08;
      if (!A(xx, yy + 1)) f -= 0.3; else if (!A(xx, yy + 2)) f -= 0.12;
      if (!A(xx - 1, yy)) f += 0.06;
      if (!A(xx + 1, yy)) f -= 0.1;
      if (f) for (let k = 0; k < 3; k++) d[i + k] = clamp(f > 0 ? d[i + k] + (255 - d[i + k]) * f : d[i + k] * (1 + f), 0, 255);
    }
  }
  if (opt.outline !== false) {
    const oc = hex2rgb(opt.oc || '#0b0a0c');
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4; if (src[i + 3]) continue;
      if (A(xx + 1, yy) || A(xx - 1, yy) || A(xx, yy + 1) || A(xx, yy - 1)) { d[i] = oc[0]; d[i + 1] = oc[1]; d[i + 2] = oc[2]; d[i + 3] = 255; }
    }
  }
  x.putImageData(id, 0, 0);
}
function tintSprite(img, mode) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.drawImage(img, 0, 0); const id = x.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue; const r = d[i], g = d[i + 1], b = d[i + 2], l = (r + g + b) / 3;
    const isEye = r > 150 && g < 90 && b < 90;
    if (mode === 'frost') { if (isEye) { d[i] = 120; d[i + 1] = 230; d[i + 2] = 255; } else { d[i] = clamp(l * 0.75 + 70, 0, 255); d[i + 1] = clamp(l * 0.85 + 85, 0, 255); d[i + 2] = clamp(l + 110, 0, 255); } }
    if (mode === 'shadow') { if (isEye) { d[i] = 255; d[i + 1] = 40; d[i + 2] = 30; } else { d[i] = l * 0.35 + 10; d[i + 1] = l * 0.3 + 8; d[i + 2] = l * 0.45 + 18; } }
    if (mode === 'white') { d[i] = d[i + 1] = d[i + 2] = 255; }
  }
  x.putImageData(id, 0, 0); return c;
}

// ─── Gegner ───
const ENEMY_DRAW = {
  ratte(B) {
    B.q([[30, 18], [36, 14], [40, 16], [43, 12]], '#b08080', 2);
    B.e(22, 17, 10, 6, '#6e6258'); B.e(14, 16, 6, 5, '#7a6c60'); B.poly([[4, 18], [10, 13], [12, 19]], '#857668');
    B.p(4, 18, '#e0a0a0'); B.e(15, 11, 2.5, 3, '#c89090'); B.p(10, 15, '#ff3030'); B.p(9, 15, '#ffb0b0');
    B.r(14, 21, 2, 3, '#5a5048'); B.r(25, 21, 2, 3, '#5a5048'); B.r(30, 20, 2, 3, '#5a5048');
    B.l(5, 17, 1, 15, '#999', 0.6); B.l(5, 18, 1, 19, '#999', 0.6);
  },
  kraehe(B) {
    [[12, 12, 1], [30, 9, 0.85], [24, 24, 1.1]].forEach(([cx, cy, s]) => {
      B.e(cx, cy, 6 * s, 4 * s, '#1c1c26'); B.e(cx - 5 * s, cy - 2 * s, 3 * s, 3 * s, '#22222e');
      B.poly([[cx - 8 * s, cy - 2 * s], [cx - 12 * s, cy - 1 * s], [cx - 8 * s, cy]], '#d8a030');
      B.p(cx - 6 * s, cy - 3 * s, '#ff4040');
      B.poly([[cx - 2, cy - 2], [cx + 8 * s, cy - 9 * s], [cx + 6 * s, cy + 1]], '#2a2a3a');
      B.poly([[cx + 5 * s, cy], [cx + 10 * s, cy + 2 * s], [cx + 5 * s, cy + 3 * s]], '#161620');
    });
  },
  keiler(B) {
    B.e(26, 17, 15, 10, '#4a3426'); B.e(12, 18, 8, 7, '#553c2c'); B.r(3, 17, 6, 5, '#6a4a36'); B.e(4, 19, 2, 2.5, '#2a1a14');
    B.poly([[6, 22], [3, 15], [8, 20]], '#efe6d0'); B.poly([[10, 22], [8, 16], [12, 21]], '#e6dcc0');
    B.p(11, 15, '#ff4a2a'); B.e(15, 11, 2, 3, '#3a2a20');
    for (let i = 0; i < 9; i++) B.l(16 + i * 2.6, 8 + Math.abs(i - 4) * 0.4, 17 + i * 2.6, 4 + Math.abs(i - 4) * 0.5, '#2a1c14', 1.2);
    [[14, 25], [20, 25], [32, 25], [37, 24]].forEach(([a, b]) => B.r(a, b, 3, 5, '#3a281c')); B.l(40, 15, 44, 18, '#3a281c', 1);
  },
  wolf(B) { },
  natter(B) {
    B.e(28, 23, 14, 4, '#3a6a2a'); B.e(30, 19, 11, 4, '#4a7a30'); B.e(28, 15, 8, 3.5, '#3a6a2a');
    B.q([[24, 14], [18, 10], [14, 6]], '#4a7a30', 5); B.e(11, 5, 5, 3.5, '#4a8034');
    for (let i = 0; i < 6; i++) { B.p(18 + i * 4, 23, '#d0c040'); B.p(22 + i * 3, 19, '#d0c040'); }
    B.p(9, 4, '#ffdd00'); B.p(10, 4, '#201000'); B.q([[6, 6], [3, 6], [1, 5]], '#e02020', 1); B.p(1, 7, '#e02020');
  },
  moorkriecher(B) {
    B.e(26, 15, 17, 6, '#4a5a32'); B.e(9, 14, 7, 5, '#55663a'); B.poly([[1, 15], [6, 11], [6, 17]], '#5c6e3e');
    B.q([[42, 15], [46, 18], [48, 17]], '#4a5a32', 3);
    for (let i = 0; i < 7; i++) B.e(15 + i * 4, 10, 2, 2, '#6a7a42');
    [[12, 19, -1], [20, 20, 1], [32, 20, -1], [38, 19, 1]].forEach(([a, b]) => { B.l(a, b, a - 2, b + 5, '#3a4a26', 2.5); B.l(a - 2, b + 5, a - 4, b + 5, '#2a3a1c', 1); });
    B.p(8, 12, '#ffd040'); B.p(8, 13, '#201000'); B.l(2, 16, 7, 17, '#2a3018', 0.8);
  },
  baer(B) {
    B.e(29, 24, 17, 13, '#5a3a24'); B.e(13, 18, 10, 9, '#634128'); B.e(5, 21, 5, 4, '#7a5234'); B.e(3, 20, 2, 2, '#1a0e08');
    B.e(12, 9, 3.5, 3.5, '#5a3a24'); B.e(20, 10, 3.5, 3.5, '#5a3a24'); B.e(12, 9, 1.5, 1.5, '#3a2416');
    B.p(10, 16, '#ffbb30'); B.p(11, 16, '#1a0a00'); B.l(5, 23, 9, 24, '#2a1810', 0.8);
    [[14, 32], [22, 34], [36, 33], [42, 31]].forEach(([a, b]) => { B.r(a, b, 6, 6, '#4a2e1c'); B.p(a, b + 6, '#ddd'); B.p(a + 2, b + 6, '#ddd'); B.p(a + 4, b + 6, '#ddd'); });
    B.e(30, 20, 10, 4, '#6a4630');
  },
  bandit(B) {
    B.r(12, 36, 4, 10, '#2a2a30'); B.r(18, 36, 4, 10, '#2a2a30'); B.r(11, 45, 6, 3, '#1a1410'); B.r(18, 45, 6, 3, '#1a1410');
    B.poly([[9, 18], [25, 18], [27, 38], [7, 38]], '#4a4030'); B.r(9, 30, 16, 2, '#3a2a1a'); B.r(15, 30, 3, 2, '#c8a040');
    B.e(17, 12, 6, 7, '#3a3424'); B.e(16, 13, 4, 4.5, '#d8a880'); B.r(11, 13, 11, 4, '#a02a2a'); B.p(14, 12, '#201010'); B.p(18, 12, '#201010');
    B.r(4, 22, 5, 12, '#4a4030'); B.r(25, 22, 5, 11, '#4a4030'); B.e(6, 34, 2.5, 2.5, '#d8a880');
    B.l(6, 34, 1, 26, '#c8c8d0', 2); B.r(5, 33, 3, 2, '#5a3a20');
  },
  spinne(B) {
    for (let i = 0; i < 4; i++) {
      const lx = 18 + i * 5; B.q([[lx, 16], [lx - 8 - i, 6 + i], [lx - 12 - i * 2, 26]], '#2a1a30', 1.6);
      B.q([[lx + 2, 16], [lx + 10 + i, 7 + i], [lx + 14 + i * 2, 27]], '#22142a', 1.6);
    }
    B.e(32, 15, 12, 9, '#3a2242'); B.e(16, 17, 7, 6, '#2c1a34'); for (let i = 0; i < 4; i++) B.e(28 + i * 2, 12 - (i % 2) * 2, 2, 1.5, '#b03a3a');
    B.p(12, 15, '#ff3030'); B.p(14, 14, '#ff3030'); B.p(11, 17, '#ff5050'); B.p(13, 17, '#ff5050');
    B.poly([[11, 20], [9, 24], [12, 21]], '#d0d0b0'); B.poly([[15, 20], [14, 24], [16, 21]], '#d0d0b0');
  },
  drohne(B) {
    B.l(8, 8, 2, 4, '#555', 1); B.l(36, 8, 42, 4, '#555', 1); B.r(0, 2, 8, 2, '#8a8a90'); B.r(36, 2, 8, 2, '#8a8a90');
    B.e(22, 18, 14, 10, '#6a7078'); B.e(22, 15, 11, 6, '#8a929a'); B.r(10, 20, 24, 4, '#4a5058');
    B.e(22, 19, 5, 5, '#200808'); B.e(22, 19, 3, 3, '#ff2020'); B.p(21, 18, '#ffb0b0');
    B.r(13, 27, 2, 7, '#4a5058'); B.r(29, 27, 2, 7, '#4a5058'); B.r(11, 33, 6, 2, '#3a4048'); B.r(27, 33, 6, 2, '#3a4048');
    B.r(16, 10, 2, 1, '#5fe1ff'); B.r(26, 10, 2, 1, '#5fe1ff'); B.r(19, 25, 6, 1, '#c8c020');
  },
  mutant(B) {
    B.q([[14, 12], [9, 4], [4, 3]], '#a0a8b0', 1.6); B.q([[9, 4], [8, 0]], '#a0a8b0', 1.2); B.q([[18, 12], [22, 3], [27, 1]], '#a0a8b0', 1.6); B.q([[22, 3], [20, -1]], '#a0a8b0', 1.2);
    B.e(28, 28, 14, 9, '#c89a8a'); B.e(16, 16, 6, 6, '#d0a090'); B.poly([[8, 20], [12, 14], [16, 22]], '#c09080');
    B.q([[18, 26], [36, 26]], '#7ac050', 1); B.q([[22, 30], [38, 30]], '#7ac050', 0.8); B.e(30, 27, 4, 3, '#a03a3a');
    B.p(13, 15, '#80ff40'); B.p(17, 15, '#80ff40');
    [[18, 35], [24, 36], [34, 36], [39, 34]].forEach(([a, b]) => { B.r(a, b, 3, 11, '#a87a6a'); B.r(a, b + 10, 3, 2, '#2a2020'); });
    B.r(30, 20, 3, 2, '#5fe1ff');
  },
  // ─── Bosse (größer) ───
  grimmzahn(B) {
    B.e(38, 34, 24, 18, '#4a2e1c'); B.e(17, 25, 14, 12, '#553420'); B.e(6, 29, 7, 5.5, '#6e4a30'); B.e(3, 28, 2.5, 2, '#100804');
    B.e(15, 12, 5, 5, '#4a2e1c'); B.e(27, 13, 5, 5, '#4a2e1c'); B.p(12, 22, '#ff3a10'); B.p(13, 22, '#ffd040'); B.p(19, 21, '#ff3a10');
    B.l(16, 19, 22, 27, '#d8c0a0', 1); B.l(30, 26, 40, 30, '#d8c0a0', 1); B.l(44, 22, 50, 32, '#d8c0a0', 1);
    B.r(17, 34, 18, 3, '#2a3a4a'); B.r(25, 34, 3, 3, '#5fe1ff');
    B.poly([[4, 32], [2, 36], [6, 33]], '#eee'); B.poly([[9, 33], [8, 37], [11, 34]], '#eee');
    [[18, 46], [28, 48], [46, 47], [54, 45]].forEach(([a, b]) => { B.r(a, b, 8, 9, '#3e2616'); for (let k = 0; k < 4; k++) B.p(a + k * 2, b + 9, '#f0e8d8'); });
    B.e(40, 26, 14, 5, '#5e3a24');
  },
  varga(B) {
    B.r(15, 46, 6, 14, '#22222a'); B.r(24, 46, 6, 14, '#22222a'); B.r(13, 58, 9, 4, '#120e0a'); B.r(24, 58, 9, 4, '#120e0a');
    B.poly([[8, 22], [36, 22], [40, 52], [4, 52]], '#5a2020'); B.poly([[16, 22], [28, 22], [26, 44], [18, 44]], '#3a3a40');
    B.r(8, 38, 28, 3, '#2a1a10'); B.r(19, 38, 6, 3, '#e8c050'); for (let i = 0; i < 4; i++) B.p(18 + i * 2, 26 + i * 4, '#e8c050');
    B.e(22, 14, 7, 8, '#d0a078'); B.r(14, 5, 16, 4, '#1a1a1a'); B.r(10, 8, 24, 2, '#1a1a1a'); B.r(14, 7, 16, 1, '#a02020');
    B.p(19, 13, '#101010'); B.p(25, 13, '#101010'); B.r(18, 18, 8, 2, '#3a2a1a'); B.l(26, 11, 28, 16, '#8a4a3a', 0.8);
    B.r(2, 25, 7, 16, '#5a2020'); B.r(36, 25, 7, 15, '#5a2020'); B.e(5, 42, 3, 3, '#d0a078'); B.e(39, 41, 3, 3, '#d0a078');
    B.l(5, 42, -2, 30, '#d8d8e0', 2.5); B.l(39, 41, 46, 30, '#d8d8e0', 2.5);
  },
  w7(B) {
    [[10, 44, -1], [22, 46, -1], [40, 46, 1], [52, 44, 1]].forEach(([a, b, s]) => { B.l(a + 8 * s * -1 + 6, 34, a, b, '#4a5058', 3); B.l(a, b, a - 2 * s, b + 8, '#3a4048', 2.5); B.r(a - 4, b + 7, 6, 2, '#2a3038'); });
    B.e(31, 28, 22, 12, '#5a626a'); B.e(31, 24, 19, 8, '#7a828a'); B.r(12, 30, 38, 4, '#3a4048');
    B.r(8, 14, 16, 10, '#5a626a'); B.r(10, 16, 12, 6, '#2a1010'); B.r(12, 18, 8, 2, '#ff2a2a'); B.glow(16, 19, 10, 'rgba(255,40,40,0.5)');
    B.r(36, 12, 3, 12, '#4a5058'); B.r(33, 10, 9, 3, '#6a7078'); B.r(44, 18, 10, 3, '#4a5058'); B.r(52, 17, 4, 5, '#2a3038');
    for (let i = 0; i < 5; i++) B.r(20 + i * 5, 26, 2, 2, i % 2 ? '#5fe1ff' : '#c8c020');
    B.r(26, 33, 12, 1, '#ff9a3c');
  },
  frostherz(B) {
    B.r(16, 50, 10, 14, '#c8d8e8'); B.r(34, 50, 10, 14, '#c8d8e8'); B.r(14, 62, 13, 4, '#8aa0b8'); B.r(33, 62, 13, 4, '#8aa0b8');
    B.e(30, 36, 20, 18, '#dde8f2'); B.e(30, 14, 11, 11, '#e6eef6'); B.e(28, 17, 7, 6, '#9ab0c8');
    B.p(25, 14, '#5fe1ff'); B.p(31, 14, '#5fe1ff'); B.r(25, 19, 6, 2, '#3a4a5a'); B.p(26, 21, '#fff'); B.p(29, 21, '#fff');
    B.e(8, 34, 7, 14, '#d2e0ec'); B.e(52, 34, 7, 14, '#d2e0ec'); B.e(6, 48, 7, 6, '#b8cce0'); B.e(54, 48, 7, 6, '#b8cce0');
    B.glow(30, 34, 12, 'rgba(95,225,255,0.9)'); B.e(30, 34, 4, 4, '#5fe1ff'); B.p(29, 33, '#e8ffff');
    for (let i = 0; i < 6; i++) B.poly([[16 + i * 6, 22], [19 + i * 6, 16], [22 + i * 6, 22]], '#f0f6fc');
  },
  subjekt246(B) {
    B.r(14, 40, 5, 16, '#2a3a44'); B.r(22, 40, 5, 16, '#2a3a44'); B.r(13, 55, 7, 3, '#101418'); B.r(22, 55, 7, 3, '#101418');
    B.poly([[10, 18], [30, 18], [32, 42], [8, 42]], '#c8d0d0'); B.r(10, 28, 22, 2, '#7a8a8a'); B.r(18, 20, 6, 2, '#5fe1ff');
    B.poly([[12, 32], [18, 38], [14, 42], [9, 38]], '#7a2020'); B.p(27, 24, '#7a2020'); B.p(28, 25, '#7a2020');
    B.e(20, 11, 6, 7, '#b8c0b0'); B.r(14, 4, 12, 4, '#3a3a3a'); B.p(17, 10, '#80ffe0'); B.p(22, 10, '#80ffe0'); B.glow(19, 10, 6, 'rgba(120,255,220,0.5)');
    B.r(18, 15, 5, 1, '#5a5a50'); B.r(4, 21, 6, 14, '#c8d0d0'); B.r(30, 21, 6, 12, '#c8d0d0');
    B.l(6, 35, -2, 52, '#e8eef0', 3); B.l(-2, 52, -4, 55, '#ff5050', 1); B.e(33, 34, 3, 3, '#b8c0b0');
    B.r(22, 30, 8, 3, '#1a1a1a'); B.p(24, 31, '#ff3030');
  },
  prometheus(B) {
    B.glow(40, 34, 30, 'rgba(95,225,255,0.35)');
    B.e(40, 34, 26, 26, '#2a3038'); B.e(40, 34, 22, 22, '#4a525a'); B.e(40, 34, 16, 16, '#2a3038');
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; B.r(40 + Math.cos(a) * 24 - 2, 34 + Math.sin(a) * 24 - 2, 4, 4, i % 2 ? '#5fe1ff' : '#ff3030'); }
    B.e(40, 34, 10, 10, '#300808'); B.e(40, 34, 7, 7, '#ff2020'); B.e(40, 34, 3, 3, '#ffd0d0'); B.glow(40, 34, 14, 'rgba(255,40,40,0.6)');
    B.l(14, 30, 2, 18, '#5a626a', 3); B.l(66, 30, 78, 18, '#5a626a', 3); B.r(0, 14, 6, 6, '#7a828a'); B.r(74, 14, 6, 6, '#7a828a');
    B.l(18, 52, 8, 66, '#5a626a', 3); B.l(62, 52, 72, 66, '#5a626a', 3); B.r(4, 64, 8, 4, '#3a4048'); B.r(68, 64, 8, 4, '#3a4048');
    B.r(32, 6, 16, 3, '#7a828a'); B.r(38, 0, 4, 7, '#7a828a'); B.p(39, 0, '#ff3030');
  },
};
const ENEMY_SIZE = { ratte: [44, 26], kraehe: [44, 34], keiler: [46, 32], natter: [44, 28], moorkriecher: [50, 26], baer: [50, 42], bandit: [32, 50], spinne: [50, 32], drohne: [44, 38], mutant: [44, 50], grimmzahn: [64, 58], varga: [48, 64], w7: [62, 58], frostherz: [62, 68], subjekt246: [40, 60], prometheus: [80, 70] };
function getEnemySprite(id) {
  const key = 'enemy_' + id; if (SPR[key]) return SPR[key];
  const E = ENEMIES[id];
  if (E.img && imgOk(E.img)) { SPR[key] = E.tint ? tintSprite(IMG[E.img], E.tint) : IMG[E.img]; return SPR[key]; }
  const sz = ENEMY_SIZE[id] || [40, 40]; const fn = ENEMY_DRAW[id] || ENEMY_DRAW.ratte;
  SPR[key] = makeSprite(sz[0], sz[1], fn); return SPR[key];
}
function enemyScale(id) { const E = ENEMIES[id]; if (id === 'alpha') return 1.5; if (E.img) return 1.15; return E.boss ? 2.4 : 2.6; }

// ─── Szenen-Objekte ───
function treeSprite(kind, seed) {
  const k = 'tree_' + kind + '_' + seed; if (SPR[k]) return SPR[k];
  const R = srng(seed * 7919 + kind.length);
  let c;
  if (kind === 'pine' || kind === 'darkpine' || kind === 'snowpine') {
    const h = 34 + Math.floor(R() * 26), w = 16 + Math.floor(h * 0.35);
    const base = kind === 'darkpine' ? '#0e2018' : kind === 'snowpine' ? '#2a4a40' : '#1a3a24';
    c = makeSprite(w, h + 6, B => {
      B.r(w / 2 - 1.5, h - 6, 3, 12, '#3a2618');
      const tiers = 4 + Math.floor(R() * 2);
      for (let i = 0; i < tiers; i++) {
        const ty = 2 + i * (h - 8) / tiers, tw = (w / 2 - 1) * (0.35 + 0.65 * (i + 1) / tiers);
        B.poly([[w / 2, ty], [w / 2 + tw, ty + (h - 6) / tiers + 4], [w / 2 - tw, ty + (h - 6) / tiers + 4]], shade(base, (R() - 0.5) * 0.15));
        if (kind === 'snowpine') B.poly([[w / 2, ty], [w / 2 + tw * 0.6, ty + 4], [w / 2 - tw * 0.6, ty + 4]], '#e8f0f4');
      }
    });
  } else if (kind === 'oak' || kind === 'jungle') {
    const w = 30 + Math.floor(R() * 14), h = 38 + Math.floor(R() * 14);
    const col = kind === 'jungle' ? '#1f5a26' : '#2e5a22';
    c = makeSprite(w, h, B => {
      B.r(w / 2 - 2, h * 0.5, 4, h * 0.5, '#4a3020'); B.l(w / 2, h * 0.65, w / 2 - 7, h * 0.45, '#4a3020', 2);
      for (let i = 0; i < 7; i++) B.e(w / 2 + (R() - 0.5) * w * 0.6, h * 0.32 + (R() - 0.5) * h * 0.3, 6 + R() * 6, 5 + R() * 5, shade(col, (R() - 0.4) * 0.3));
      if (kind === 'jungle') for (let i = 0; i < 4; i++) B.q([[w * R(), h * 0.4], [w * R(), h * 0.75]], '#2a6a20', 1);
    });
  } else if (kind === 'dead') {
    const w = 26, h = 40 + Math.floor(R() * 12);
    c = makeSprite(w, h, B => {
      B.l(13, h, 13, 8, '#3a3026', 3); B.l(13, 22, 4, 10, '#3a3026', 2); B.l(13, 16, 22, 6, '#3a3026', 2); B.l(8, 15, 5, 5, '#3a3026', 1); B.l(19, 10, 24, 12, '#3a3026', 1);
    });
  } else if (kind === 'rock' || kind === 'icerock') {
    const w = 14 + Math.floor(R() * 18), h = 8 + Math.floor(R() * 10);
    const col = kind === 'icerock' ? '#a8c0d0' : '#5a5e5a';
    c = makeSprite(w, h, B => { B.e(w / 2, h * 0.65, w / 2 - 1, h * 0.55, col); B.e(w * 0.4, h * 0.45, w * 0.25, h * 0.3, shade(col, 0.12)); });
  } else if (kind === 'bush') {
    const w = 18 + Math.floor(R() * 8), h = 10 + Math.floor(R() * 5);
    c = makeSprite(w, h, B => { for (let i = 0; i < 4; i++) B.e(4 + R() * (w - 8), h * 0.6, 4 + R() * 3, 4 + R() * 2, shade('#2a5020', (R() - 0.5) * 0.3)); if (R() < 0.5) for (let i = 0; i < 4; i++) B.p(3 + R() * (w - 6), 2 + R() * (h - 4), '#5a4ac0'); });
  } else if (kind === 'reed') {
    c = makeSprite(10, 18, B => { for (let i = 0; i < 4; i++) { B.l(2 + i * 2, 18, 1 + i * 2.5, 3 + R() * 4, '#5a6a30', 1); } B.r(2, 3, 2, 4, '#5a3a20'); });
  } else if (kind === 'house') {
    const w = 40, h = 34;
    c = makeSprite(w, h, B => { B.r(4, 14, 32, 20, '#4a3a2c'); B.poly([[0, 15], [20, 2], [40, 15]], '#3a2a22'); B.r(9, 20, 7, 7, '#0a0a0a'); B.r(24, 21, 7, 13, '#1a120c'); B.l(9, 20, 16, 27, '#5a4a3a', 1); B.poly([[26, 6], [30, 4], [34, 9], [30, 10]], '#0a0a0a'); });
  } else if (kind === 'tower') {
    const w = 22 + Math.floor(R() * 14), h = 70 + Math.floor(R() * 50);
    c = makeSprite(w, h, B => {
      B.r(0, 6, w, h - 6, '#1c2026'); B.poly([[0, 6], [w * 0.6, 0], [w, 4], [w, 10]], '#1c2026');
      for (let yy = 12; yy < h - 4; yy += 6) for (let xx = 3; xx < w - 3; xx += 5) if (R() < 0.75) B.r(xx, yy, 2, 3, R() < 0.06 ? '#5fe1ff' : R() < 0.05 ? '#ffd060' : '#0b0d10');
    }, { shade: false });
  } else if (kind === 'column') {
    const h = 30 + Math.floor(R() * 20);
    c = makeSprite(14, h, B => { B.r(2, 4, 10, h - 4, '#6a6a62'); B.r(0, h - 4, 14, 4, '#5a5a52'); B.r(0, 2, 14, 3, '#5a5a52'); B.poly([[2, 4], [7, 0], [12, 4]], '#5a5a52'); for (let i = 0; i < 3; i++) B.l(4 + i * 3, 8, 4 + i * 3, h - 6, '#58584f', 1); if (R() < 0.5) B.r(3, h * 0.5, 8, 3, '#5fe1ff'); });
  } else if (kind === 'icespike') {
    const h = 20 + Math.floor(R() * 24);
    c = makeSprite(14, h, B => { B.poly([[7, 0], [13, h], [1, h]], '#a8d8f0'); B.poly([[7, 0], [9, h], [5, h]], '#dff4ff'); });
  } else if (kind === 'crystal') {
    c = makeSprite(14, 16, B => { B.glow(7, 9, 8, 'rgba(95,225,255,0.5)'); B.poly([[5, 16], [3, 6], [6, 0], [8, 8]], '#5fe1ff'); B.poly([[8, 16], [10, 4], [13, 9], [12, 16]], '#3aa8d0'); }, { outline: false });
  } else if (kind === 'stalactite') {
    const h = 14 + Math.floor(R() * 20);
    c = makeSprite(10, h, B => { B.poly([[0, 0], [10, 0], [5, h]], '#2a2622'); });
  } else if (kind === 'fern') {
    c = makeSprite(26, 16, B => { for (let i = 0; i < 5; i++) B.q([[13, 16], [13 + (i - 2) * 5, 4 + Math.abs(i - 2) * 2], [13 + (i - 2) * 6, 6 + Math.abs(i - 2) * 3]], '#2a7a26', 2); });
  } else if (kind === 'wheat') {
    c = makeSprite(8, 16, B => { for (let i = 0; i < 3; i++) { B.l(1 + i * 3, 16, 1 + i * 3, 4, '#b89a40', 1); B.e(1 + i * 3, 4, 1, 2.5, '#d8b850'); } }, { outline: false });
  } else if (kind === 'lab') {
    c = makeSprite(70, 46, B => { B.r(0, 12, 70, 34, '#3a4048'); B.r(0, 10, 70, 3, '#5a626a'); for (let i = 0; i < 6; i++) B.r(5 + i * 11, 18, 7, 5, i === 2 ? '#ff3030' : '#5fe1ff'); B.r(28, 30, 14, 16, '#1a1e22'); B.r(4, 4, 3, 8, '#5a626a'); B.r(3, 2, 5, 2, '#ff3030'); });
  } else if (kind === 'rocket') {
    c = makeSprite(26, 90, B => { B.poly([[13, 0], [22, 20], [22, 74], [4, 74], [4, 20]], '#d8dce0'); B.r(4, 40, 18, 4, '#c03030'); B.e(13, 30, 4, 4, '#2a4a6a'); B.poly([[4, 60], [-2, 84], [4, 76]], '#a03030'); B.poly([[22, 60], [28, 84], [22, 76]], '#a03030'); B.r(8, 74, 10, 6, '#4a4a50'); });
  }
  SPR[k] = c; return c;
}
// Gebäude-Minisprites fürs Lager
const BLD_DRAW = {
  zelt0: B => { B.poly([[2, 26], [18, 4], [34, 26]], '#6a5a3a'); B.poly([[14, 26], [18, 12], [22, 26]], '#1a120c'); B.l(18, 4, 18, 0, '#4a3a2a', 1); },
  zelt1: B => { B.poly([[0, 28], [20, 2], [40, 28]], '#7a6a44'); B.poly([[15, 28], [20, 12], [25, 28]], '#1a120c'); B.l(4, 26, 36, 26, '#5a4a30', 1); B.r(34, 20, 6, 8, '#5a3a20'); },
  zelt2: B => { B.poly([[0, 30], [22, 0], [44, 30]], '#8a7a50'); B.poly([[16, 30], [22, 12], [28, 30]], '#1a120c'); B.r(0, 26, 44, 4, '#5a4a30'); for (let i = 0; i < 6; i++) B.poly([[i * 8, 30], [i * 8 + 3, 22], [i * 8 + 6, 30]], '#6a5030'); },
  werkbank: B => { B.r(1, 7, 22, 3, '#7a5432'); B.r(3, 10, 2, 8, '#5a3a22'); B.r(19, 10, 2, 8, '#5a3a22'); B.r(6, 3, 8, 4, '#9a9aa0'); B.r(13, 4, 4, 1, '#5a3a22'); B.r(16, 5, 3, 2, '#7a7a80'); },
  schmiede: B => { B.r(2, 6, 18, 16, '#6a6058'); B.r(5, 12, 12, 7, '#200a04'); B.r(6, 14, 10, 4, '#ff7a1a'); B.r(8, 0, 6, 7, '#5a524a'); B.r(22, 15, 10, 4, '#3a3a40'); B.r(25, 19, 4, 4, '#2a2a30'); },
  trainingsplatz: B => { B.r(9, 4, 4, 22, '#6a4a2a'); B.e(11, 6, 5, 5, '#c8a870'); B.r(4, 11, 14, 3, '#6a4a2a'); B.e(11, 15, 5, 6, '#b89860'); B.r(10, 14, 2, 2, '#a02020'); },
  trockengestell: B => { B.r(1, 3, 2, 18, '#5a3a22'); B.r(23, 3, 2, 18, '#5a3a22'); B.r(0, 3, 26, 2, '#6a4a2a'); for (let i = 0; i < 4; i++) B.r(4 + i * 5, 5, 3, 7, '#a04030'); },
  regenfaenger: B => { B.poly([[0, 2], [20, 2], [14, 10], [6, 10]], '#6a5a40'); B.r(5, 10, 10, 12, '#5a4028'); B.r(5, 13, 10, 1, '#3a2a18'); B.r(7, 11, 6, 2, '#4a90c0'); },
  kraeuterbeet: B => { B.r(0, 10, 26, 6, '#4a3020'); for (let i = 0; i < 6; i++) { B.l(3 + i * 4, 10, 2 + i * 4, 3, '#3a8a2a', 1.5); B.p(2 + i * 4, 3, '#7ae05a'); } },
  fallen: B => { B.r(0, 8, 14, 5, '#5a3a22'); B.l(2, 8, 7, 1, '#6a4a2a', 1); B.l(12, 8, 7, 1, '#6a4a2a', 1); B.r(5, 6, 4, 2, '#8a8a90'); },
  bienenstock: B => { B.r(9, 0, 2, 4, '#5a3a22'); B.e(10, 11, 8, 8, '#c89a40'); B.r(3, 8, 14, 1, '#8a6a2a'); B.r(3, 12, 14, 1, '#8a6a2a'); B.r(8, 14, 4, 3, '#2a1a0a'); B.r(9, 20, 2, 6, '#5a3a22'); },
  vorratskiste: B => { B.r(0, 4, 22, 14, '#7a5a34'); B.r(0, 4, 22, 3, '#8a6a40'); B.r(0, 10, 22, 1, '#5a3a22'); B.r(9, 8, 4, 4, '#a0a0a8'); },
  alchemie: B => { B.r(1, 9, 22, 3, '#6a4a2a'); B.r(3, 12, 2, 8, '#5a3a22'); B.r(19, 12, 2, 8, '#5a3a22'); B.e(7, 6, 3, 3, '#5ae07a'); B.r(6, 1, 2, 3, '#a0c0c0'); B.e(16, 6, 3, 3, '#c05ae0'); B.r(15, 0, 2, 4, '#a0c0c0'); },
  funkgeraet: B => { B.r(4, 16, 14, 10, '#4a5058'); B.r(6, 18, 6, 4, '#5fe1ff'); B.r(14, 18, 2, 2, '#ff3030'); B.l(11, 16, 11, 0, '#6a7078', 1); B.l(11, 2, 5, 6, '#6a7078', 1); B.l(11, 2, 17, 6, '#6a7078', 1); },
};
function bldSprite(k) {
  if (SPR['b_' + k]) return SPR['b_' + k];
  const sizes = { zelt0: [36, 28], zelt1: [42, 30], zelt2: [46, 32], werkbank: [24, 19], schmiede: [34, 24], trainingsplatz: [22, 27], trockengestell: [26, 22], regenfaenger: [20, 23], kraeuterbeet: [26, 17], fallen: [14, 14], bienenstock: [20, 27], vorratskiste: [22, 19], alchemie: [24, 21], funkgeraet: [22, 27] };
  const s = sizes[k] || [20, 20]; SPR['b_' + k] = makeSprite(s[0], s[1], BLD_DRAW[k]); return SPR['b_' + k];
}
