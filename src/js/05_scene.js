// ═══════════════ SZENEN-RENDERER ═══════════════
const SW = 480, SH = 240, LW = 960, GY = 196;
const SKY_KEYS = [
  [0, '#04060f', '#0a1022', '#2c3560'], [300, '#04060f', '#0c1226', '#2c3560'], [360, '#2a2a4a', '#7a4a5a', '#9a8aa8'],
  [420, '#3a5a8a', '#e0906a', '#e8ccc0'], [510, '#5a8ac0', '#c4dcea', '#f4eee8'], [720, '#4a8ad2', '#c4e4f8', '#ffffff'],
  [1020, '#4a82c4', '#cce2ee', '#fff8f0'], [1140, '#3a4a80', '#f0a060', '#ffcaa0'], [1200, '#2a2a5a', '#c0604a', '#c88888'],
  [1260, '#0e1230', '#2a2040', '#4a4474'], [1440, '#04060f', '#0a1022', '#2c3560']];
function mixHex(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); }
function skyAt(min, weather) {
  let i = 0; while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1][0] <= min) i++;
  const a = SKY_KEYS[i], b = SKY_KEYS[i + 1], t = clamp((min - a[0]) / (b[0] - a[0]), 0, 1);
  let top = mixHex(a[1], b[1], t), bot = mixHex(a[2], b[2], t), mul = mixHex(a[3], b[3], t);
  const W = WEATHER[weather] || WEATHER.klar;
  if (W.rain) { top = mixHex(top, '#30363e', W.rain > 1 ? 0.75 : 0.55); bot = mixHex(bot, '#4a5058', 0.55); mul = mixHex(mul, '#7a8090', W.rain > 1 ? 0.45 : 0.3); }
  if (W.fog) { top = mixHex(top, '#8a9098', 0.5); bot = mixHex(bot, '#a0a8b0', 0.6); mul = mixHex(mul, '#c0c4c8', 0.2); }
  if (W.snow) { top = mixHex(top, '#9aa4b0', 0.45); bot = mixHex(bot, '#c8d0d8', 0.5); }
  if (weather === 'wolkig') { top = mixHex(top, '#5a6470', 0.35); mul = mixHex(mul, '#d0d4d8', 0.15); }
  return { top, bot, mul, light: hex2rgb(mul).reduce((s, v) => s + v, 0) / 765 };
}
// ─── Ebenen-Generator ───
const SCENE_P = {
  wald: { mt: '#1e2e3a', hill: '#16281e', ground: ['#2a3a1e', '#1a2814'], far: 'pine', farN: 50, near: [['pine', 9], ['bush', 6], ['rock', 2]], grass: '#3a5a26' },
  lichtung: { mt: '#2a3a48', hill: '#22402a', ground: ['#3a5a24', '#2a4418'], far: 'oak', farN: 18, near: [['oak', 5], ['bush', 8]], grass: '#5a8a30', flowers: 1 },
  bach: { mt: '#2a3a48', hill: '#1e3426', ground: ['#34482a', '#24341c'], far: 'pine', farN: 30, near: [['reed', 8], ['rock', 6], ['pine', 4]], grass: '#4a6a2a', river: 1 },
  fels: { mt: '#3a3c44', hill: '#3a3a36', ground: ['#4a4840', '#33322c'], far: 'rock', farN: 20, near: [['rock', 14], ['pine', 3]], grass: '#5a5a3a', peaks: 1 },
  feld: { mt: '#3a4a58', hill: '#4a5a2a', ground: ['#7a6a34', '#5a4c24'], far: 'oak', farN: 10, near: [['wheat', 40], ['bush', 3]], grass: '#9a8a40', house: 1 },
  sumpf: { mt: '#263230', hill: '#1e2a22', ground: ['#2a3424', '#1c2418'], far: 'dead', farN: 16, near: [['dead', 5], ['reed', 14], ['bush', 3]], grass: '#3a4a2a', pools: '#2a3a2a', fogAlways: 0.25 },
  dorf: { mt: '#2a3440', hill: '#24321e', ground: ['#3a3a26', '#2a2a1c'], far: 'house', farN: 6, near: [['house', 4], ['bush', 5], ['dead', 2]], grass: '#4a5a2a' },
  berg: { mt: '#4a5260', hill: '#3a3e44', ground: ['#5a5a58', '#3e3e3c'], far: 'snowpine', farN: 14, near: [['rock', 10], ['snowpine', 4]], grass: '#6a6a5a', peaks: 2 },
  hoehle: { cave: 1, ground: ['#2a2420', '#1a1612'], near: [['rock', 8], ['crystal', 7]], grass: null },
  see: { mt: '#2e3e4c', hill: '#1e3a2a', ground: ['#3a4a2a', '#2a3a1e'], far: 'pine', farN: 34, near: [['reed', 7], ['rock', 3]], grass: '#4a6a2a', lake: 1 },
  eis: { mt: '#8a9aac', hill: '#b0c0d0', ground: ['#d8e4ec', '#a8b8c8'], far: 'snowpine', farN: 16, near: [['icespike', 8], ['icerock', 6], ['snowpine', 3]], grass: null, peaks: 3, snowGround: 1 },
  ruinen: { mt: '#343a40', hill: '#2a3026', ground: ['#4a4a40', '#34342c'], far: 'column', farN: 12, near: [['column', 6], ['rock', 6], ['bush', 4]], grass: '#4a5a2a', sign: 1 },
  kueste: { mt: '#3a4a58', hill: '#4a4a3a', ground: ['#b8a878', '#8a7a54'], far: null, farN: 0, near: [['rock', 6], ['reed', 3]], grass: null, sea: 1 },
  stadt: { mt: '#1a1e24', hill: '#22262c', ground: ['#3a3c40', '#2a2c30'], far: 'tower', farN: 16, near: [['tower', 2], ['rock', 5], ['dead', 2]], grass: '#3a4030', city: 1 },
  urwald: { mt: '#1a3a2a', hill: '#14301e', ground: ['#24401e', '#162a12'], far: 'jungle', farN: 30, near: [['jungle', 8], ['fern', 10]], grass: '#2a6a24', vines: 1, fogAlways: 0.12 },
  labor: { mt: '#2a3038', hill: '#22282e', ground: ['#3a4048', '#2a3036'], far: 'tower', farN: 5, near: [['rock', 3]], grass: null, lab: 1 },
};
const LAYERS = {};
function wrapNoise(x, seed, freqs) { let v = 0; freqs.forEach(([f, a], i) => { v += Math.sin(x / LW * Math.PI * 2 * f + seed * (i + 1) * 1.7) * a; }); return v; }
function genLayers(hexId) {
  if (LAYERS[hexId]) return LAYERS[hexId];
  const hx = HEXES[hexId], P = SCENE_P[hx.b], seed = hexId * 977 + 13, R = srng(seed);
  const mk = () => { const c = document.createElement('canvas'); c.width = LW; c.height = SH; return c; };
  const far = mk(), mid = mk(), near = mk();
  const fx = far.getContext('2d'), mx = mid.getContext('2d'), nx = near.getContext('2d');
  if (P.cave) {
    // Höhlenwände
    fx.fillStyle = '#16120f'; fx.fillRect(0, 0, LW, SH);
    for (let i = 0; i < 40; i++) { fx.fillStyle = shade('#1e1a16', (R() - 0.5) * 0.3); fx.beginPath(); fx.ellipse(R() * LW, R() * SH * 0.8, 30 + R() * 60, 20 + R() * 40, 0, 0, Math.PI * 2); fx.fill(); }
    for (let x = 0; x < LW; x += 8 + R() * 14) { const s = treeSprite('stalactite', Math.floor(R() * 9)); mx.drawImage(s, x, -2); }
    mx.fillStyle = '#100c0a'; mx.beginPath(); mx.moveTo(0, 0); for (let x = 0; x <= LW; x += 16) mx.lineTo(x, 12 + wrapNoise(x, seed, [[3, 6], [7, 3]])); mx.lineTo(LW, 0); mx.fill();
  } else {
    // Berge
    const amp = P.peaks ? 30 + P.peaks * 12 : 22, base = P.peaks ? 150 : 165;
    fx.fillStyle = P.mt; fx.beginPath(); fx.moveTo(0, SH);
    for (let x = 0; x <= LW; x += 4) fx.lineTo(x, base - amp - wrapNoise(x, seed, [[2, amp * 0.6], [5, amp * 0.3], [11, amp * 0.15]]) - (P.peaks ? Math.abs(wrapNoise(x, seed + 3, [[4, amp * 0.6]])) : 0));
    fx.lineTo(LW, SH); fx.fill();
    if (P.peaks) { // Schneekappen
      fx.save(); fx.globalCompositeOperation = 'source-atop'; fx.fillStyle = P.peaks > 2 ? '#f0f6fa' : '#dde6ec';
      fx.fillRect(0, 0, LW, base - amp - 4); fx.restore();
    }
    if (P.city) for (let x = 0; x < LW; x += 20 + R() * 30) { const t = treeSprite('tower', Math.floor(R() * 12)); fx.globalAlpha = 0.6; fx.drawImage(t, x, 175 - t.height * 0.9); fx.globalAlpha = 1; }
    // Hügel + Baumlinie
    mx.fillStyle = P.hill; mx.beginPath(); mx.moveTo(0, SH);
    for (let x = 0; x <= LW; x += 4) mx.lineTo(x, 176 - wrapNoise(x, seed + 7, [[3, 8], [8, 4]]));
    mx.lineTo(LW, SH); mx.fill();
    if (P.far) for (let i = 0; i < P.farN; i++) {
      const s = treeSprite(P.far, Math.floor(R() * 12)); const x = R() * LW, sc = 0.45 + R() * 0.3;
      const y = 178 - wrapNoise(x, seed + 7, [[3, 8], [8, 4]]);
      mx.drawImage(s, x, y - s.height * sc, s.width * sc, s.height * sc);
      if (x + s.width * sc > LW) mx.drawImage(s, x - LW, y - s.height * sc, s.width * sc, s.height * sc);
    }
    if (P.house) { const h = treeSprite('house', 1); mx.drawImage(h, 600, 160, 30, 26); mx.drawImage(h, 120, 165, 24, 20); }
    if (P.lab) { const l = treeSprite('lab', 1); mx.drawImage(l, 300, 140); const rk = treeSprite('rocket', 1); mx.drawImage(rk, 360, 96); mx.drawImage(l, 800, 150, 50, 34); }
    // Fernnebel
    const fg = mx.createLinearGradient(0, 150, 0, 200); fg.addColorStop(0, 'rgba(160,180,200,0)'); fg.addColorStop(1, 'rgba(160,180,200,0.12)'); mx.fillStyle = fg; mx.fillRect(0, 150, LW, 50);
  }
  // Boden
  const g = nx.createLinearGradient(0, GY - 10, 0, SH); g.addColorStop(0, P.ground[0]); g.addColorStop(1, P.ground[1]);
  nx.fillStyle = g; nx.beginPath(); nx.moveTo(0, SH);
  for (let x = 0; x <= LW; x += 4) nx.lineTo(x, GY - 8 + wrapNoise(x, seed + 11, [[4, 2], [9, 1.5]]));
  nx.lineTo(LW, SH); nx.fill();
  for (let i = 0; i < 900; i++) { nx.fillStyle = shade(P.ground[1], (R() - 0.5) * 0.4); nx.fillRect(R() * LW, GY - 4 + R() * 48, 1 + (R() < 0.2 ? 1 : 0), 1); }
  if (P.river || P.lake || P.sea || P.pools) {
    nx.fillStyle = P.sea ? '#1e3a52' : P.pools ? P.pools : '#2a4a62';
    if (P.river) { nx.beginPath(); nx.moveTo(0, 214); for (let x = 0; x <= LW; x += 8) nx.lineTo(x, 212 + wrapNoise(x, seed, [[2, 4], [5, 2]])); for (let x = LW; x >= 0; x -= 8) nx.lineTo(x, 226 + wrapNoise(x, seed + 1, [[2, 4], [5, 2]])); nx.fill(); }
    if (P.lake) { nx.beginPath(); nx.ellipse(LW * 0.25, 186, 220, 14, 0, 0, Math.PI * 2); nx.ellipse(LW * 0.75, 186, 220, 14, 0, 0, Math.PI * 2); nx.fill(); }
    if (P.sea) { nx.fillRect(0, 180, LW, 18); nx.fillStyle = '#2a5070'; nx.fillRect(0, 180, LW, 3); }
    if (P.pools) for (let i = 0; i < 6; i++) { nx.beginPath(); nx.ellipse(R() * LW, 205 + R() * 25, 18 + R() * 20, 3 + R() * 3, 0, 0, Math.PI * 2); nx.fill(); }
  }
  if (P.grass) for (let i = 0; i < 260; i++) { const x = R() * LW, y = GY - 4 + R() * 40; nx.fillStyle = shade(P.grass, (R() - 0.5) * 0.5); nx.fillRect(x, y - 2, 1, 3); nx.fillRect(x + 1, y - 1, 1, 2); }
  if (P.flowers) for (let i = 0; i < 70; i++) { nx.fillStyle = pick(['#e0e060', '#e070a0', '#a0a0f0', '#fff']); nx.fillRect(R() * LW, GY + R() * 40, 1, 1); }
  if (P.snowGround) for (let i = 0; i < 200; i++) { nx.fillStyle = '#fff'; nx.fillRect(R() * LW, GY + R() * 44, 1, 1); }
  // Objekte (Mitte im ersten Bild frei lassen)
  (P.near || []).forEach(([kind, n]) => {
    for (let i = 0; i < n; i++) {
      let x = R() * LW; if (x > 95 && x < 390) x = R() < 0.5 ? R() * 95 : 390 + R() * 90;
      const s = treeSprite(kind, Math.floor(R() * 12)); const sc = kind === 'wheat' ? 1 : 0.9 + R() * 0.4;
      const y = GY + (kind === 'wheat' ? R() * 30 : R() * 14) - s.height * sc + 4;
      nx.drawImage(s, Math.round(x), Math.round(y), Math.round(s.width * sc), Math.round(s.height * sc));
    }
  });
  if (P.sign) { nx.fillStyle = '#1a2026'; nx.fillRect(400, 150, 54, 16); nx.fillStyle = '#5fe1ff'; nx.font = '8px monospace'; nx.fillText('ARKON', 410, 161); nx.fillStyle = '#2a3036'; nx.fillRect(425, 166, 3, 30); }
  if (P.vines) for (let i = 0; i < 14; i++) { nx.strokeStyle = '#1e4a1a'; nx.lineWidth = 1; nx.beginPath(); const x = R() * LW; nx.moveTo(x, 0); nx.quadraticCurveTo(x + 10, 40, x - 4, 40 + R() * 60); nx.stroke(); }
  LAYERS[hexId] = { far, mid, near, P };
  return LAYERS[hexId];
}
// ─── Partikel ───
const PARTS = [];
function addPart(p) { if (PARTS.length < 260) PARTS.push(p); }
let sceneT = 0, flash = 0, shakeT = 0, scroll = 0, lastFrame = performance.now();
function sceneShake(t = 0.3) { shakeT = Math.max(shakeT, t); }

function drawScene(cx, now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now; sceneT += dt;
  const hx = HEXES[G.hex], L = genLayers(G.hex), P = L.P;
  const sky = skyAt(G.min, G.weather), W = WEATHER[G.weather];
  const travel = G.busy && G.busy.kind === 'travel';
  if (travel) scroll += dt * 40; else scroll = lerp(scroll, Math.round(scroll / LW) * LW, 0.03);
  const sway = Math.sin(sceneT * 0.15) * 4;
  let sx = 0, sy = 0; if (shakeT > 0) { shakeT -= dt; sx = rnd(-3, 3); sy = rnd(-2, 2); }
  cx.save(); cx.translate(sx, sy);
  // Himmel
  if (!P.cave) {
    const g = cx.createLinearGradient(0, 0, 0, SH * 0.8); g.addColorStop(0, sky.top); g.addColorStop(1, sky.bot); cx.fillStyle = g; cx.fillRect(-4, -4, SW + 8, SH + 8);
    const nightA = clamp(1 - sky.light * 1.6, 0, 1) * (W.rain || W.fog ? 0.2 : 1);
    if (nightA > 0.05) { // Sterne
      const R = srng(7);
      for (let i = 0; i < 90; i++) { const x = R() * SW, y = R() * 130, tw = 0.5 + 0.5 * Math.sin(sceneT * (1 + R() * 3) + i); cx.fillStyle = 'rgba(255,255,240,' + (nightA * tw * (0.4 + R() * 0.6)).toFixed(2) + ')'; cx.fillRect(x, y, R() < 0.1 ? 2 : 1, 1); }
    }
    // Sonne / Mond
    const h = G.min / 60;
    if (h >= 5.5 && h <= 21.5 && !W.rain) { const t = (h - 5.5) / 16, x = 40 + t * 400, y = 150 - Math.sin(t * Math.PI) * 120; light(cx, x, y, 46, 'rgba(255,240,190,0.35)'); cx.fillStyle = t < 0.15 || t > 0.85 ? '#ffb070' : '#fff4c0'; cx.beginPath(); cx.arc(x, y, 8, 0, 7); cx.fill(); }
    if ((h >= 20 || h <= 6.5) && !W.rain) { const t = ((h + 4) % 24) / 10.5, x = 60 + t * 360, y = 140 - Math.sin(clamp(t, 0, 1) * Math.PI) * 105; cx.fillStyle = 'rgba(200,220,255,0.12)'; cx.beginPath(); cx.arc(x, y, 16, 0, 7); cx.fill(); cx.fillStyle = '#e8eef8'; cx.beginPath(); cx.arc(x, y, 7, 0, 7); cx.fill(); cx.fillStyle = sky.top; cx.beginPath(); cx.arc(x + 3, y - 2, 6, 0, 7); cx.fill(); }
  }
  // Ebenen mit Parallaxe
  const drawL = (c, f) => { const o = ((scroll * f + sway * f) % LW + LW) % LW; cx.drawImage(c, -o, 0); cx.drawImage(c, LW - o, 0); };
  const useBg = G.hex === 0 && !travel && imgOk('bg_wald');
  if (useBg) { cx.drawImage(IMG.bg_wald, -8 + sway * 0.5, -6, SW + 16, SH + 6); if (sky.light > 0.6) { cx.fillStyle = 'rgba(150,190,120,' + ((sky.light - 0.6) * 0.25).toFixed(3) + ')'; cx.globalCompositeOperation = 'screen'; cx.fillRect(0, 0, SW, SH); cx.globalCompositeOperation = 'source-over'; } }
  else { cx.globalAlpha = P.cave ? 1 : 0.5 + 0.5 * (1 - sky.light); drawL(L.far, 0.2); cx.globalAlpha = P.cave ? 1 : 0.82 + 0.18 * (1 - sky.light); drawL(L.mid, 0.5); cx.globalAlpha = 1; }
  // Wasser-Glitzern
  if (P.river || P.lake || P.sea) { for (let i = 0; i < 14; i++) { const x = (i * 37 + sceneT * (P.sea ? 8 : 20)) % SW, y = P.sea ? 182 + (i % 4) * 4 : P.lake ? 182 + (i % 3) * 3 : 214 + (i % 4) * 3; cx.fillStyle = 'rgba(220,240,255,' + (0.2 + 0.2 * Math.sin(sceneT * 3 + i)).toFixed(2) + ')'; cx.fillRect(x, y, 3 + (i % 3), 1); } }
  if (!useBg || travel) drawL(L.near, 1); else { const o = 0; cx.drawImage(L.near, 0, 0, SW, SH, 0, 0, SW, SH); }
  // Lager
  const camp = atCamp() && !travel;
  let fireX = 222, fireY = GY + 12;
  if (camp) drawCamp(cx);
  // Spieler
  const px = travel ? 200 : 150, py = GY + 14;
  drawHero(cx, px, py, travel);
  // Feuer
  if (camp && G.bld.lagerfeuer) drawFire(cx, fireX, fireY, G.fire > 0);
  // Gefahr: Augen in der Dunkelheit
  const night = sky.light < 0.42;
  if (night && !fireOn() && hx.lv >= 2 && !hx.safe && !P.cave) {
    const R = srng(Math.floor(sceneT / 4) + 3);
    for (let i = 0; i < Math.min(4, Math.floor(hx.lv / 3) + 1); i++) { const ex = R() < 0.5 ? 20 + R() * 70 : 380 + R() * 80, ey = 175 + R() * 20; if (Math.sin(sceneT * 2 + i * 3) > -0.6) { cx.fillStyle = '#ff2a1a'; cx.fillRect(ex, ey, 2, 1); cx.fillRect(ex + 5, ey, 2, 1); } }
  }
  // Wetter-Partikel
  updParticles(cx, dt, W, P, night);
  // Tönung (Tageszeit)
  cx.globalCompositeOperation = 'multiply';
  cx.fillStyle = P.cave ? '#8a7e74' : useBg && !travel ? mixHex(sky.mul, '#ffffff', 0.35) : sky.mul; cx.fillRect(-4, -4, SW + 8, SH + 8);
  cx.globalCompositeOperation = 'lighter';
  // Lichter
  if (camp && G.bld.lagerfeuer && G.fire > 0) { const f = 0.85 + 0.15 * Math.sin(sceneT * 9) * Math.sin(sceneT * 5.3); light(cx, fireX, fireY - 6, 110 * f, 'rgba(255,130,40,' + (0.5 * (1.2 - sky.light)).toFixed(2) + ')'); light(cx, fireX, fireY - 6, 34, 'rgba(255,200,120,0.5)'); }
  if (night && G.inv.fackel && !fireOn()) { const f = 0.9 + 0.1 * Math.sin(sceneT * 11); light(cx, px + 22, py - 40, 70 * f, 'rgba(255,150,60,0.32)'); }
  if (P.cave) { const R = srng(5); for (let i = 0; i < 6; i++) light(cx, R() * SW, 190 + R() * 30, 40, 'rgba(60,180,255,' + (0.2 + 0.08 * Math.sin(sceneT * 2 + i)).toFixed(2) + ')'); }
  if (P.city || P.lab) { for (let i = 0; i < 3; i++) if (Math.sin(sceneT * 1.3 + i * 2) > 0.2) light(cx, 80 + i * 150, 120, 30, 'rgba(95,225,255,0.12)'); }
  if (P.lab) { const a = sceneT * 0.6; cx.fillStyle = 'rgba(255,255,220,0.06)'; cx.beginPath(); cx.moveTo(330, 140); cx.lineTo(330 + Math.cos(a) * 300, 0); cx.lineTo(330 + Math.cos(a + 0.15) * 300, 0); cx.fill(); }
  cx.globalCompositeOperation = 'source-over';
  if (camp && G.bld.lagerfeuer && G.fire > 0) drawFlames(cx, fireX, fireY);
  // Nebel
  const fogA = (W.fog ? 0.35 : 0) + (P.fogAlways || 0);
  if (fogA > 0) for (let i = 0; i < 4; i++) { const y = 150 + i * 20, o = (sceneT * (6 + i * 3)) % SW; cx.fillStyle = 'rgba(190,200,210,' + (fogA * 0.4).toFixed(2) + ')'; for (let k = -1; k < 2; k++) { cx.beginPath(); cx.ellipse(o + k * SW, y, 200, 14, 0, 0, 7); cx.fill(); } }
  // Blitz
  if (G.weather === 'gewitter' && Math.random() < 0.0025) { flash = 1; setTimeout(() => SFX.play('thunder'), 300 + Math.random() * 600); }
  if (flash > 0) { cx.fillStyle = 'rgba(230,240,255,' + (flash * 0.7).toFixed(2) + ')'; cx.fillRect(-4, -4, SW + 8, SH + 8); flash -= dt * 4; }
  // Vignette
  const v = cx.createRadialGradient(SW / 2, SH / 2, SH * 0.35, SW / 2, SH / 2, SH * 0.95); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + (0.3 + 0.3 * (1 - sky.light)).toFixed(2) + ')'); cx.fillStyle = v; cx.fillRect(-4, -4, SW + 8, SH + 8);
  cx.restore();
}
function light(cx, x, y, r, col) { const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2); }
function drawCamp(cx) {
  const lv = G.bld.unterschlupf || 0;
  // Gebäude-Anordnung (hinten)
  const back = [['werkbank', 376, 2], ['schmiede', 404, -2], ['alchemie', 440, 2], ['funkgeraet', 458, -8], ['trainingsplatz', 30, -2], ['regenfaenger', 62, 0], ['trockengestell', 86, 2], ['bienenstock', 8, 4], ['vorratskiste', 248, 4], ['kraeuterbeet', 176, 16], ['fallen', 112, 20]];
  back.forEach(([k, x, dy]) => { if (G.bld[k]) { const s = bldSprite(k); cx.drawImage(s, x, GY + 6 + dy - s.height); } });
  if (lv > 0) {
    const t = G.shelter;
    let s = null;
    if (t === 'zelt') s = bldSprite('zelt' + (lv - 1));
    else if (imgOk(t + '_' + (lv - 1))) s = IMG[t + '_' + (lv - 1)];
    if (s) { const sc = t === 'zelt' ? 1.4 : 0.62; const w = s.width * sc, h = (s.naturalHeight || s.height) * sc; cx.fillStyle = 'rgba(0,0,0,0.35)'; cx.beginPath(); cx.ellipse(318, GY + 14, w * 0.45, 6, 0, 0, 7); cx.fill(); cx.drawImage(s, 318 - w / 2, GY + 16 - h, w, h); }
  }
  if (G.bld.palisade) { const p = G.bld.palisade; for (let x = 0; x < SW; x += 7) { if (x > 120 && x < 360) continue; const h = 14 + p * 5 + (x % 3); cx.fillStyle = p >= 3 ? '#5a5a60' : '#5a3e24'; cx.fillRect(x, GY + 30 - h, 5, h); cx.fillStyle = p >= 3 ? '#8a8a90' : '#7a5634'; cx.fillRect(x + 1, GY + 30 - h, 3, 2); cx.beginPath(); cx.moveTo(x, GY + 30 - h); cx.lineTo(x + 2.5, GY + 26 - h); cx.lineTo(x + 5, GY + 30 - h); cx.fill(); } }
}
function drawHero(cx, x, y, walking) {
  const busy = G.busy && G.busy.kind !== 'travel';
  const bob = walking ? Math.abs(Math.sin(sceneT * 8)) * 2 : busy ? Math.abs(Math.sin(sceneT * 6)) * 1.5 : Math.sin(sceneT * 2) * 0.6;
  cx.fillStyle = 'rgba(0,0,0,0.4)'; cx.beginPath(); cx.ellipse(x + 18, y, 14, 3.5, 0, 0, 7); cx.fill();
  if (imgOk('held')) { const im = IMG.held; cx.drawImage(im, Math.round(x), Math.round(y - im.height - bob)); }
  const w = gearOf('waffe');
  if (w) { const wx = x + 32, wy = y - 30 - bob; const col = { keule: '#7a5a3a', messer: '#c8c8d0', speer: '#8a6a40', axt: '#9a9aa0', schwert: '#d8dce0', bogen: '#7a5232', elektro: '#5fe1ff', eis: '#a8e0ff' }[w.cls] || '#888';
    const sw = busy ? Math.sin(sceneT * 10) * 6 : 0;
    cx.save(); cx.translate(wx, wy); cx.rotate((-20 + sw) * Math.PI / 180); cx.fillStyle = '#4a3020'; cx.fillRect(-1, 0, 3, 14); cx.fillStyle = col;
    if (w.cls === 'bogen') { cx.fillRect(-1, -12, 2, 24); } else if (w.cls === 'speer') { cx.fillRect(-1, -12, 2, 12); cx.fillStyle = '#c8c8d0'; cx.fillRect(-2, -16, 4, 5); } else if (w.cls === 'axt') { cx.fillRect(-1, -6, 2, 6); cx.fillRect(1, -8, 6, 7); } else cx.fillRect(-1, -10, 3, 11);
    cx.restore(); }
  if (busy && Math.random() < 0.15) addPart({ x: x + 30 + rnd(-4, 8), y: y - 6, vx: rnd(-20, 20), vy: rnd(-40, -10), life: 0.6, c: '#8aaa60', s: 1, g: 80 });
}
function drawFire(cx, x, y, lit) {
  cx.fillStyle = '#3a3a36'; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cx.fillRect(x + Math.cos(a) * 11 - 2, y + Math.sin(a) * 3 - 1, 4, 3); }
  cx.fillStyle = '#3a2210'; cx.fillRect(x - 9, y - 3, 18, 3); cx.fillRect(x - 4, y - 5, 8, 2);
  if (!lit) { cx.fillStyle = '#555'; cx.fillRect(x - 3, y - 6, 6, 2); if (Math.random() < 0.05) addPart({ x, y: y - 8, vx: rnd(-3, 3), vy: -12, life: 2, c: 'rgba(120,120,120,0.5)', s: 2, g: -2 }); }
}
function drawFlames(cx, x, y) {
  const t = sceneT;
  [[0, 22, '#ff4a10', 8], [0, 17, '#ff9a20', 6], [0, 11, '#ffe060', 3.5]].forEach(([o, h, c, w], i) => {
    const f = 0.85 + 0.15 * Math.sin(t * (9 + i * 3)) + 0.1 * Math.sin(t * 23 + i);
    cx.fillStyle = c; cx.beginPath(); cx.moveTo(x - w, y - 3); cx.quadraticCurveTo(x - w * 0.6 + Math.sin(t * 7) * 2, y - h * f * 0.6, x + Math.sin(t * 5 + i) * 2, y - h * f); cx.quadraticCurveTo(x + w * 0.6, y - h * f * 0.5, x + w, y - 3); cx.fill();
  });
  if (Math.random() < 0.4) addPart({ x: x + rnd(-5, 5), y: y - 10, vx: rnd(-6, 6), vy: rnd(-35, -15), life: rnd(0.6, 1.4), c: pick(['#ffb040', '#ff7020', '#ffe080']), s: 1, g: -10, glow: 1 });
}
function updParticles(cx, dt, W, P, night) {
  // Spawner
  if (W.rain) for (let i = 0; i < (W.rain > 1 ? 9 : 5); i++) addPart({ x: rnd(-20, SW + 40), y: -5, vx: -60, vy: 380, life: 0.8, rain: 1 });
  if (W.snow || (P.snowGround && Math.random() < 0.3)) for (let i = 0; i < 2; i++) addPart({ x: rnd(0, SW + 40), y: -4, vx: rnd(-20, -5), vy: rnd(18, 34), life: 9, c: '#fff', s: Math.random() < 0.3 ? 2 : 1, wob: rnd(0, 6) });
  const si = seasonIdx();
  if (si === 2 && !P.cave && Math.random() < 0.08) addPart({ x: rnd(0, SW), y: -4, vx: rnd(-15, 15), vy: rnd(14, 24), life: 9, c: pick(['#c86020', '#d8a030', '#a04020']), s: 2, wob: rnd(0, 6) });
  if (night && si === 1 && !W.rain && Math.random() < 0.05 && !P.cave) addPart({ x: rnd(0, SW), y: rnd(150, 220), vx: rnd(-8, 8), vy: rnd(-8, 8), life: 4, c: '#d8ff70', s: 1, glow: 1, ff: 1 });
  if ((P.city || P.ruins) && Math.random() < 0.05) addPart({ x: rnd(0, SW), y: rnd(100, 220), vx: rnd(4, 12), vy: rnd(-2, 2), life: 5, c: 'rgba(200,190,170,0.5)', s: 1 });
  if (P.cave && Math.random() < 0.04) addPart({ x: rnd(0, SW), y: rnd(10, 30), vx: 0, vy: 60, life: 2, c: '#5fa0d0', s: 1, drip: 1 });
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i]; p.life -= dt;
    if (p.life <= 0 || p.y > SH + 10) { PARTS.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; if (p.wob) p.x += Math.sin(sceneT * 2 + p.wob) * 0.3;
    if (p.ff) { p.vx += rnd(-20, 20) * dt; p.vy += rnd(-20, 20) * dt; }
    if (p.rain) { cx.strokeStyle = 'rgba(170,190,230,0.45)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x - 2, p.y + 9); cx.stroke(); if (p.y > GY + 10 && Math.random() < 0.3) { p.life = 0; } continue; }
    cx.globalAlpha = clamp(p.life * 2, 0, 1);
    if (p.glow) { cx.globalCompositeOperation = 'lighter'; light(cx, p.x, p.y, 4, p.c); cx.globalCompositeOperation = 'source-over'; }
    cx.fillStyle = p.c; cx.fillRect(Math.round(p.x), Math.round(p.y), p.s || 1, p.s || 1);
    cx.globalAlpha = 1;
  }
}
// ─── Titelbildschirm ───
let titleT = 0;
function drawTitle(cx, w, h, t) {
  titleT = t;
  const g = cx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#03040c'); g.addColorStop(0.6, '#0b1224'); g.addColorStop(1, '#05070a'); cx.fillStyle = g; cx.fillRect(0, 0, w, h);
  const R = srng(11); for (let i = 0; i < 140; i++) { const x = R() * w, y = R() * h * 0.36; cx.fillStyle = 'rgba(255,255,240,' + (0.3 + 0.5 * Math.abs(Math.sin(t * (0.5 + R() * 2) + i))).toFixed(2) + ')'; cx.fillRect(x, y, 1, 1); }
  cx.fillStyle = '#e8eef8'; cx.beginPath(); cx.arc(w * 0.74, h * 0.1, 12, 0, 7); cx.fill(); cx.fillStyle = '#03040c'; cx.beginPath(); cx.arc(w * 0.74 + 5, h * 0.1 - 3, 10, 0, 7); cx.fill();
  cx.fillStyle = '#0c1620'; cx.beginPath(); cx.moveTo(0, h); for (let x = 0; x <= w; x += 4) cx.lineTo(x, h * 0.33 - Math.sin(x / w * 7 + 1) * 14 - Math.sin(x / w * 17) * 6); cx.lineTo(w, h); cx.fill();
  for (let layer = 0; layer < 3; layer++) {
    const R2 = srng(30 + layer); const col = ['#0a1410', '#07100b', '#040906'][layer];
    for (let i = 0; i < 14; i++) { const x = R2() * w, th = (h * 0.12 + R2() * h * 0.12) * (1 + layer * 0.35), by = h * (0.4 + layer * 0.05); cx.fillStyle = col; for (let k = 0; k < 5; k++) { const tw = (th / 4) * (k + 1) / 5 + 4; cx.beginPath(); cx.moveTo(x, by - th + k * th / 6); cx.lineTo(x + tw, by - th + (k + 1) * th / 5 + 8); cx.lineTo(x - tw, by - th + (k + 1) * th / 5 + 8); cx.fill(); } }
  }
  cx.fillStyle = '#030604'; cx.fillRect(0, h * 0.5, w, h * 0.5);
  const fx = w * 0.56, fy = h * 0.5, f = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5);
  cx.globalCompositeOperation = 'lighter'; light(cx, fx, fy - 10, 120 * f, 'rgba(255,110,30,0.35)'); light(cx, fx, fy - 6, 30, 'rgba(255,200,120,0.5)'); cx.globalCompositeOperation = 'source-over';
  [[22, '#ff4a10', 9], [16, '#ff9a20', 6], [10, '#ffe060', 3.5]].forEach(([fh, c, fw], i) => { const ff = 0.85 + 0.15 * Math.sin(t * (9 + i * 3)); cx.fillStyle = c; cx.beginPath(); cx.moveTo(fx - fw, fy); cx.quadraticCurveTo(fx - fw * 0.5, fy - fh * ff * 0.6, fx + Math.sin(t * 5 + i) * 2, fy - fh * ff); cx.quadraticCurveTo(fx + fw * 0.6, fy - fh * 0.5, fx + fw, fy); cx.fill(); });
  if (imgOk('held')) { cx.globalAlpha = 0.95; cx.drawImage(IMG.held, fx - 48, fy - IMG.held.height + 2); cx.globalAlpha = 1; }
  const R3 = srng(Math.floor(t * 2)); for (let i = 0; i < 6; i++) { const ex = (R3() * w + t * 12 * (i + 1)) % w, ey = fy - 10 - ((t * 30 + i * 37) % 90); cx.fillStyle = 'rgba(255,170,60,' + (1 - ((t * 30 + i * 37) % 90) / 90).toFixed(2) + ')'; cx.fillRect(fx - 10 + Math.sin(t + i) * 14 + i * 3, ey, 1, 1); }
  for (let i = 0; i < 3; i++) if (Math.sin(t * 1.5 + i * 2.2) > -0.3) { const ex = [w * 0.1, w * 0.86, w * 0.26][i], ey = h * (0.45 + i * 0.015); cx.fillStyle = '#ff2a1a'; cx.fillRect(ex, ey, 2, 1); cx.fillRect(ex + 5, ey, 2, 1); }
  const v = cx.createRadialGradient(w / 2, h * 0.42, h * 0.15, w / 2, h * 0.42, h * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)'); cx.fillStyle = v; cx.fillRect(0, 0, w, h);
}
