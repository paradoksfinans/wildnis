// ═══════════════ UI-GRUNDLAGEN ═══════════════
let TAB = 'act', SUB = { craft: 'items', craftSt: 'alle', bag: 'alle', journal: 'ziele' }, mapSel = null;
function toast(icon, title, text, kind = '') {
  const box = $('toasts'); if (!box) return;
  while (box.children.length >= 2) box.firstChild.remove();
  const t = document.createElement('div'); t.className = 'toast ' + kind;
  t.innerHTML = '<div class="ti">' + icon + '</div><div><div class="tt">' + esc(title) + '</div>' + (text ? '<div class="tx">' + esc(text) + '</div>' : '') + '</div>';
  t.addEventListener('click', () => t.remove());
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, kind === 'gold' || kind === 'blue' ? 3800 : 2800);
}
function floater(text, color = '#c8ff80', xPct, yPct) {
  const f = $('floaters'); if (!f) return;
  const d = document.createElement('div'); d.className = 'floater'; d.textContent = text; d.style.color = color;
  d.style.left = (xPct !== undefined ? xPct : 24 + Math.random() * 18) + '%'; d.style.top = (yPct !== undefined ? yPct : 42 + Math.random() * 16) + '%';
  f.appendChild(d); setTimeout(() => d.remove(), 1700);
}
// ─── Modal mit Warteschlange ───
const MQ = []; let modalOpen = false, modalChoices = [];
function showModal(o) { if (modalOpen) { MQ.push(o); return; } openModal(o); }
function openModal(o) {
  modalOpen = true; modalChoices = o.choices || [{ t: 'OK' }];
  const b = $('mbox'); b.className = 'mbox ' + (o.cls || '');
  let h = '<div class="mt">' + o.title + '</div>';
  if (o.text) h += '<div class="mx ' + (o.textCls || '') + '">' + esc(o.text) + '</div>';
  if (o.html) h += o.html;
  h += '<div class="mchoices">' + modalChoices.map((c, i) => '<button class="btn ' + (c.cls || '') + '" data-a="mchoice" data-i="' + i + '"' + (c.dis ? ' disabled' : '') + '>' + c.t + '</button>').join('') + '</div>';
  b.innerHTML = h; $('modal').classList.add('show');
  if (o.onOpen) o.onOpen(b);
  if (o.type && o.textCls) typeText(b.querySelector('.mx'));
}
function closeModal() {
  $('modal').classList.remove('show'); modalOpen = false; modalChoices = [];
  if (MQ.length) setTimeout(() => { if (!modalOpen && MQ.length) openModal(MQ.shift()); }, 120);
}
function typeText(el) {
  if (!el) return; const full = el.textContent; el.textContent = ''; let i = 0;
  const iv = setInterval(() => { if (!document.body.contains(el)) { clearInterval(iv); return; } i += 2; el.textContent = full.slice(0, i); if (i % 6 === 0) SFX.play('type'); if (i >= full.length) clearInterval(iv); }, 22);
  el.addEventListener('click', () => { clearInterval(iv); el.textContent = full; }, { once: true });
}
const LVQ = [];
function queueLevelUp(lv, sk) {
  SFX.play('levelup'); vibrate([40, 40, 80]);
  toast('⭐', 'LEVEL ' + lv + '!', '+3 Attributpunkte' + (sk.length ? ' · Neu: ' + sk.map(s => SKILLS[s].n).join(', ') : ''), 'gold');
  addLog('⭐ Level ' + lv + ' erreicht!', 'disc');
  const dot = document.querySelector('[data-id="hero"] .dot'); if (dot) dot.classList.add('show');
}
// ─── HUD ───
function setBar(id, v, max, invert) {
  const el = $(id); if (!el) return; const p = clamp(v / max * 100, 0, 100);
  const col = p > 60 ? (id === 'st-hp' ? '#7ae05a' : id === 'st-en' ? '#5fe1ff' : id === 'st-wa' ? '#ff9a3c' : id === 'st-du' ? '#4aa8ff' : '#e0b050') : p > 25 ? '#e0a030' : '#ff4040';
  const f = el.querySelector('.sf'); f.style.width = p + '%'; f.style.background = 'linear-gradient(90deg,' + shade(col, -0.3) + ',' + col + ')';
  el.querySelector('.sv').textContent = Math.floor(v); el.querySelector('.sv').style.color = col;
  el.classList.toggle('crit', p < 20);
}
function updateHUD() {
  if (!G) return;
  const mh = maxHP();
  setBar('st-hp', G.hp, mh); setBar('st-en', G.en, 100); setBar('st-hu', G.hu, 100); setBar('st-du', G.du, 100); setBar('st-wa', G.wa, 100);
  $('hudlv').textContent = G.lv; $('hudname').textContent = G.name + (G.hardcore ? ' ☠' : '');
  $('xpfill').style.width = (G.lv >= 50 ? 100 : G.xp / xpNeed(G.lv) * 100) + '%';
  const W = WEATHER[G.weather], s = season();
  $('hudclock').textContent = 'TAG ' + G.day + ' · ' + fmtTime(G.min);
  $('hudseason').textContent = s.i + ' ' + s.n + ' · ' + W.i;
  $('hudcoins').textContent = '🪙 ' + fmt(G.coins);
  const hx = HEXES[G.hex];
  $('sceneinfo').innerHTML = '<b>' + esc(hx.n.toUpperCase()) + '</b><br>' + '★'.repeat(Math.min(5, Math.ceil(hx.lv / 4))) + (atCamp() ? ' · 🏕 LAGER' : '') + (G.sick > 0 ? ' · 🤢 KRANK' : '');
  $('scenetemp').innerHTML = W.i + ' ' + W.n + '<br>🌡 ' + temperature() + '°C' + (feltTemp() !== temperature() ? ' (gefühlt ' + feltTemp() + '°)' : '');
  const fb = $('firebar'); if (atCamp() && G.bld.lagerfeuer) { fb.classList.add('show'); $('firefill').style.width = clamp(G.fire / 900 * 100, 0, 100) + '%'; } else fb.classList.remove('show');
  const q = curQuest();
  if (q) { const [c, m] = q.g(G); $('objtext').textContent = q.d; $('objprog').textContent = m > 1 ? Math.min(c, m) + '/' + m : ''; }
  else { $('objtext').textContent = G.ended ? 'Experiment abgeschlossen. Überlebe weiter – oder starte Zyklus ' + (G.cycle + 2) + '.' : 'Erkunde die Wildnis.'; $('objprog').textContent = ''; }
  const ab = $('actbar');
  if (G.busy) { ab.classList.add('show'); $('actname').textContent = G.busy.label; $('acttime').textContent = Math.max(0, Math.ceil(G.busy.max - G.busy.t)) + 's'; $('actfill').style.width = clamp(G.busy.t / G.busy.max * 100, 0, 100) + '%'; }
  else ab.classList.remove('show');
  const heroDot = document.querySelector('[data-id="hero"] .dot'); if (heroDot) heroDot.classList.toggle('show', G.pts > 0);
}
// ─── Hilfsbausteine ───
function costPills(req, mult = 1) { return Object.keys(req).map(k => { const n = req[k] * mult, h = G.inv[k] || 0, it = ITEMS[k]; return '<span class="pill ' + (h >= n ? 'ok' : 'no') + '">' + (it ? it.i : '') + ' ' + h + '/' + n + '</span>'; }).join(''); }
function itemName(k) { const it = ITEMS[k] || GEAR[k]; return it ? it.i + ' ' + it.n : k; }
function stars(n) { return '<span style="color:var(--a)">' + '★'.repeat(n) + '</span><span style="color:#2a332a">' + '★'.repeat(Math.max(0, 5 - n)) + '</span>'; }
function gearStats(g) {
  const p = []; if (g.atk) p.push('⚔ ' + g.atk); if (g.def) p.push('🛡 ' + g.def); if (g.spd) p.push('💨 ' + (g.spd > 0 ? '+' : '') + g.spd); if (g.crit) p.push('🎯 ' + g.crit + '%');
  if (g.dodge) p.push('🌀 ' + g.dodge + '%'); if (g.hp) p.push('❤ +' + g.hp); if (g.wa) p.push('🔥 +' + g.wa); if (g.xp) p.push('✨ +' + g.xp + '% XP'); if (g.luck) p.push('🍀 +' + g.luck + '%'); if (g.cls) p.push(CLS_N[g.cls]);
  return p.join(' · ');
}
// ═══════════════ RENDER ═══════════════
function render() {
  DIRTY = false; if (!G) return;
  const el = $('content'); const st = el.scrollTop;
  const f = { act: renderAct, map: renderMap, craft: renderCraft, bag: renderBag, hero: renderHero, journal: renderJournal }[TAB];
  el.innerHTML = f ? f() : '';
  if (TAB === 'map') drawMap();
  if (TAB === 'journal' && SUB.journal === 'beast') drawBeastThumbs();
  if (TAB === 'hero') drawHeroPortrait();
  el.scrollTop = st;
  document.querySelectorAll('.nb').forEach(b => b.classList.toggle('on', b.dataset.id === TAB));
  tutorialHighlight();
}
function tutorialHighlight() {
  const q = curQuest(); if (!q || G.q > 6) return;
  const sel = { q_aeste: '[data-id="aeste"]', q_steine: '[data-id="steine"]', q_waffe: TAB === 'craft' ? '[data-id="knueppel"]' : '[data-a="tab"][data-id="craft"]', q_lager: TAB === 'craft' ? (SUB.craft === 'bld' ? '[data-id="unterschlupf"]' : '[data-a="sub"][data-id="bld"]') : '[data-a="tab"][data-id="craft"]', q_feuer: TAB === 'craft' ? (SUB.craft === 'bld' ? '[data-id="lagerfeuer"]' : '[data-a="sub"][data-id="bld"]') : '[data-a="tab"][data-id="craft"]', q_wasser: G.hex === 1 ? (TAB === 'act' ? '[data-id="wasser"]' : '[data-a="tab"][data-id="act"]') : TAB === 'map' ? '#travelbtn' : '[data-a="tab"][data-id="map"]', q_kampf: '[data-id="jagen"]' }[q.id];
  if (!sel) return;
  if (q.id === 'q_waffe' && G.gear.length && !G.equip.waffe) return;
  const e = document.querySelector(sel); if (e) e.classList.add('hl');
}
// ─── AKTION ───
function renderAct() {
  const hx = HEXES[G.hex], b = BIOMES[hx.b], busy = !!G.busy;
  let h = '<div class="card" style="cursor:default;margin-bottom:8px"><div class="ct"><div><div class="cn" style="font-family:var(--pix);font-size:13px">' + esc(hx.n) + '</div><div class="cm">' + esc(hx.d) + '</div></div><div style="text-align:right;font-size:10px;white-space:nowrap">Gefahr<br>' + stars(Math.min(5, Math.ceil(hx.lv / 4))) + '</div></div></div>';
  if (hx.boss && !G.bossDown[hx.boss] && (!hx.hidden || G.seen.includes(hx.id))) {
    const E = ENEMIES[hx.boss];
    h += '<div class="card boss" data-a="boss" data-id="' + hx.boss + '"><div class="ct"><div><div class="cn" style="color:#ff8080">☠ BOSS: ' + E.n + '</div><div class="cm">' + E.title + ' · Empfohlen: Level ' + E.lv + '</div></div><span class="big">⚔️</span></div><div class="cm" style="color:#c08080">' + (G.lv < E.lv - 2 ? '⚠ Zu stark für dich! Trainiere weiter.' : 'Tippen zum Herausfordern') + '</div></div>';
  }
  if (hx.trader) h += '<div class="card hot" data-a="trade" style="margin-top:7px"><div class="ct"><div><div class="cn" style="color:var(--a)">🧕 Händlerin Mira</div><div class="cm">Kaufe Vorräte, verkaufe Beute. Neues Angebot jeden Tag.</div></div><span class="big">🪙</span></div></div>';
  if (atCamp()) h += renderCampPanel();
  else if (G.camp === null) h += '<div class="card hot" data-a="tab" data-id="craft" data-sub="bld" style="margin-top:7px"><div class="cn">🏕 Noch kein Lager</div><div class="cm">Baue einen Unterschlupf (BAUEN → Gebäude), um hier dein Lager aufzuschlagen.</div></div>';
  else h += '<div class="sub" style="margin-top:8px">🏕 Dein Lager: ' + esc(HEXES[G.camp].n) + '</div>';
  h += '<div class="sec">Aktionen</div><div class="grid2">';
  b.gather.forEach(id => {
    const a = GATHER[id]; const need = a.need && !has(a.need); const noEn = a.en > 0 && G.en < a.en; const nowater = id === 'wasser' && !b.water;
    const water = id === 'wasser' ? (b.water === 'dirty' ? ' (trüb)' : '') : '';
    const dis = busy || need || noEn || (hx.safe && a.hunt);
    const t = actTime(a);
    h += '<div class="card' + (dis ? ' dis' : '') + (busy && G.busy.id === id ? ' on' : '') + '" data-a="gather" data-id="' + id + '"><div class="ct"><span class="cn">' + a.i + ' ' + a.n + water + '</span></div>' +
      '<div class="cm">' + (need ? '🔒 Benötigt ' + ITEMS[a.need].i + ' ' + ITEMS[a.need].n : a.hunt ? 'Kampf gegen Wildtiere' : a.rest ? '+' + (-a.en) + ' Energie' : (a.en ? '⚡ ' + a.en + ' · ' : '') + '⏱ ' + t + 's') + '</div></div>';
  });
  h += '</div>';
  const foods = Object.keys(G.inv).filter(k => { const it = ITEMS[k]; return it && G.inv[k] > 0 && (it.eat || (it.c === 'med' && (it.heal || it.en))); });
  if (foods.length) {
    h += '<div class="sec">Schnell verbrauchen</div><div style="display:flex;flex-wrap:wrap;gap:5px">';
    foods.slice(0, 10).forEach(k => { h += '<button class="mini g" data-a="use" data-id="' + k + '">' + ITEMS[k].i + ' ' + ITEMS[k].n + ' ×' + G.inv[k] + '</button>'; });
    h += '</div>';
  }
  return h;
}
function actTime(a) { return Math.max(2, Math.round(a.t * (1 - Math.min(0.3, G.attr.agi * 0.01)) * (G.en < 10 ? 1.5 : 1))); }
function renderCampPanel() {
  let h = '<div class="sec">🏕 Lager</div>';
  if (G.bld.lagerfeuer) {
    const lit = G.fire > 0, mins = Math.ceil(G.fire / 60);
    h += '<div class="row"><span class="big">' + (lit ? '🔥' : '🪨') + '</span><div class="rn"><div class="t">Lagerfeuer ' + (lit ? '· brennt (' + mins + ' min)' : '· erloschen') + '</div><div class="d">' + (lit ? 'Wärme, Licht, Kochen. Hält Raubtiere fern.' : 'Entfachen: 3 Äste + Feuerstein') + '</div></div></div>';
    h += '<div style="display:flex;gap:5px;flex-wrap:wrap;margin:-1px 0 6px">';
    if (lit) { h += '<button class="mini g" data-a="fuel" data-id="aeste"' + (has('aeste', 3) ? '' : ' disabled') + '>🌿 3 Äste (+1,5m)</button><button class="mini g" data-a="fuel" data-id="holz"' + (has('holz') ? '' : ' disabled') + '>🪵 Holz (+2,5m)</button><button class="mini g" data-a="fuel" data-id="kohle"' + (has('kohle') ? '' : ' disabled') + '>⚫ Kohle (+3,5m)</button>'; }
    else h += '<button class="mini g" data-a="ignite"' + (has('aeste', 3) && has('feuerstein') ? '' : ' disabled') + '>🔥 Feuer entfachen</button>';
    h += '</div>';
  }
  const prods = Object.keys(BUILD).filter(k => BUILD[k].prod && G.bld[k]);
  if (prods.length) {
    h += '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">';
    prods.forEach(k => { const st = Math.floor((G.prod[k] || {}).stock || 0); const p = BUILD[k].prod; h += '<button class="mini' + (st > 0 ? ' g' : '') + '" data-a="harvest" data-id="' + k + '"' + (st > 0 ? '' : ' disabled') + '>' + BUILD[k].i + ' ' + ITEMS[p.it].n + ' ' + st + '/' + (p.cap * (k === 'fallen' ? G.bld.fallen : 1)) + '</button>'; });
    h += '</div>';
  }
  const canSleep = G.min >= 1140 || G.min < DAY_START;
  h += '<div class="btnrow" style="margin-top:2px"><button class="btn ghost" data-a="sleep"' + (canSleep && !G.busy ? '' : ' disabled') + '>🌙 Schlafen ' + (canSleep ? '' : '(ab 19:00)') + '</button>' + (G.bld.trainingsplatz ? '<button class="btn ghost" data-a="tab" data-id="hero">🎯 Training</button>' : '') + (G.bld.funkgeraet ? '<button class="btn blue" data-a="radio_use">📡 Funk</button>' : '') + '</div>';
  return h;
}
// ─── KARTE ───
let MAPGEO = null;
function renderMap() {
  const sel = mapSel !== null ? HEXES[mapSel] : HEXES[G.hex];
  let h = '<canvas id="mapcv" width="480" height="500"></canvas><div class="hexinfo">';
  const known = G.seen.includes(sel.id), adj = hexNeighbors(G.hex).includes(sel.id), here = sel.id === G.hex;
  const locked = sel.hidden && !(G.inv.raketenteil1 && G.inv.raketenteil2 && G.inv.raketenteil3);
  if (sel.hidden && !known && !adj && !(G.radio >= 3)) { h += '<div class="empty">Tippe auf eine Wabe, um Details zu sehen.</div></div>'; return h; }
  h += '<div class="card" style="cursor:default"><div class="ct"><div><div class="cn" style="font-family:var(--pix)">' + (known ? esc(sel.n) : '??? Unbekanntes Gebiet') + '</div>';
  h += '<div class="cm">' + (known ? esc(sel.d) : 'Unerforscht. Erkunden dauert länger und ist gefährlicher.') + '</div></div><div style="text-align:right;font-size:10px">' + stars(Math.min(5, Math.ceil(sel.lv / 4))) + '<br><span class="kbd">LV ' + sel.lv + '</span></div></div>';
  if (known) {
    const b = BIOMES[sel.b]; const tags = [];
    tags.push(b.water ? (b.water === 'clean' ? '💧 Sauberes Wasser' : '🫗 Trübes Wasser') : '🚱 Kein Wasser');
    if (sel.trader) tags.push('🧕 Händlerin'); if (sel.boss) tags.push(G.bossDown[sel.boss] ? '✅ Boss besiegt' : '☠ ' + ENEMIES[sel.boss].n);
    if (sel.secret) tags.push(G.secrets.includes(sel.secret) ? '🔎 Geheimnis gefunden' : '❓ Geheimnis');
    if (G.camp === sel.id) tags.push('🏕 Dein Lager');
    tags.push('🌡 ' + (b.temp >= 0 ? '+' : '') + b.temp + '°');
    h += '<div class="cost">' + tags.map(t => '<span class="pill">' + t + '</span>').join('') + '</div>';
    h += '<div class="cm" style="margin-top:6px">Ressourcen: ' + b.gather.filter(g => !['jagen', 'rasten'].includes(g)).map(g => GATHER[g].i).join(' ') + '</div>';
  }
  h += '</div>';
  if (here) h += '<div class="sub" style="margin-top:7px;text-align:center">📍 Du bist hier.</div>';
  else if (adj) {
    const t = travelTime(sel.id);
    if (locked) h += '<button class="btn red" disabled style="margin-top:8px">🔒 ZUGANG VERWEIGERT · 3 Raketenteile nötig</button>';
    else h += '<button class="btn" id="travelbtn" data-a="travel" data-id="' + sel.id + '"' + (G.busy ? ' disabled' : '') + ' style="margin-top:8px">' + (known ? '🚶 Reisen' : '🔍 Erkunden') + ' · ' + t + 's · ⚡' + travelEn(sel.id) + '</button>';
  } else h += '<div class="sub" style="margin-top:7px;text-align:center">Nicht angrenzend. Reise Wabe für Wabe.</div>';
  h += '</div><div class="sub" style="margin-top:10px">Entdeckt: ' + G.seen.filter(i => i < 19).length + '/19 · Raketenteile: ' + ['raketenteil1', 'raketenteil2', 'raketenteil3'].map(k => G.inv[k] ? '🚀' : '▫️').join('') + '</div>';
  return h;
}
function travelTime(id) { const known = G.seen.includes(id); let t = known ? 8 : 14; if (G.inv.kompass) t *= 0.7; if (G.en < 10) t *= 1.4; return Math.round(t); }
function travelEn(id) { return G.seen.includes(id) ? 4 : 7; }
const BIOME_COL = { wald: '#1e3a22', lichtung: '#3a6a2a', bach: '#24506a', fels: '#4a4a48', feld: '#7a6a2a', sumpf: '#2a3a26', dorf: '#5a4a32', berg: '#5a6068', hoehle: '#2a2420', see: '#2a5a7a', eis: '#a8c0d4', ruinen: '#4a4a44', kueste: '#a8986a', stadt: '#2a2e36', urwald: '#1a5a2a', labor: '#3a1a1a' };
const BIOME_ICON = { wald: '🌲', lichtung: '🌼', bach: '🏞️', fels: '🪨', feld: '🌾', sumpf: '🐸', dorf: '🏚️', berg: '🏔️', hoehle: '🕳️', see: '🌊', eis: '🧊', ruinen: '🏛️', kueste: '🏖️', stadt: '🏙️', urwald: '🌴', labor: '☢️' };
function drawMap() {
  const c = $('mapcv'); if (!c) return; const x = c.getContext('2d'), W = c.width, H = c.height;
  const size = 50, cxm = W / 2, cym = H / 2 + 40;
  const pos = h => [cxm + size * Math.sqrt(3) * (h.q + h.r / 2), cym + size * 1.5 * h.r];
  MAPGEO = { size, pos };
  x.fillStyle = '#030504'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#0b120c'; for (let i = 0; i < W; i += 24) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (let i = 0; i < H; i += 24) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
  const t = performance.now() / 1000, nb = hexNeighbors(G.hex);
  const vis = id => G.seen.includes(id) || G.seen.some(s => hexNeighbors(s).includes(id));
  HEXES.forEach(h => {
    if (!vis(h.id)) return;
    if (h.hidden && !G.seen.includes(h.id) && !(G.radio >= 3 || (G.inv.raketenteil1 && G.inv.raketenteil2 && G.inv.raketenteil3))) return;
    const [px, py] = pos(h), known = G.seen.includes(h.id);
    x.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); x.lineTo(px + (size - 2) * Math.cos(a), py + (size - 2) * Math.sin(a)); } x.closePath();
    if (known) { const g = x.createRadialGradient(px, py - 10, 4, px, py, size); g.addColorStop(0, shade(BIOME_COL[h.b], 0.25)); g.addColorStop(1, shade(BIOME_COL[h.b], -0.35)); x.fillStyle = g; }
    else x.fillStyle = '#0a0d0b';
    x.fill();
    const sel = mapSel === h.id, here = h.id === G.hex;
    x.lineWidth = here ? 3 : sel ? 2.5 : 1.2;
    x.strokeStyle = here ? '#c8ff80' : sel ? '#ffc44d' : nb.includes(h.id) ? '#4a7a3a' : known ? '#1e2e20' : '#151a16';
    if (here) { x.shadowColor = '#c8ff80'; x.shadowBlur = 10 + Math.sin(t * 3) * 4; }
    x.stroke(); x.shadowBlur = 0;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if (known) {
      x.font = '24px serif'; x.fillText(BIOME_ICON[h.b], px, py - 9);
      x.font = '11px "Share Tech Mono",monospace'; x.fillStyle = '#e8f8e0'; x.shadowColor = '#000'; x.shadowBlur = 3;
      const nm = h.n.length > 12 ? h.n.slice(0, 11) + '.' : h.n; x.fillText(nm, px, py + 15); x.shadowBlur = 0;
      if (h.boss && !G.bossDown[h.boss]) { x.font = '13px serif'; x.fillText('☠️', px + 22, py - 22); }
      if (h.boss && G.bossDown[h.boss]) { x.font = '11px serif'; x.fillText('✅', px + 22, py - 22); }
      if (G.camp === h.id) { x.font = '13px serif'; x.fillText('⛺', px - 22, py - 22); }
      if (h.trader) { x.font = '12px serif'; x.fillText('🪙', px - 22, py + 22); }
      if (h.secret && !G.secrets.includes(h.secret)) { x.font = 'bold 11px monospace'; x.fillStyle = '#ffc44d'; x.fillText('?', px + 22, py + 22); }
    } else { x.font = 'bold 16px "Silkscreen",monospace'; x.fillStyle = '#2a3a2a'; x.fillText('?', px, py); x.font = '8px monospace'; x.fillStyle = '#3a4a3a'; x.fillText('LV ' + h.lv, px, py + 16); }
    if (here) { const bob = Math.sin(t * 4) * 2; x.fillStyle = '#c8ff80'; x.beginPath(); x.moveTo(px, py - 26 + bob); x.lineTo(px - 6, py - 36 + bob); x.lineTo(px + 6, py - 36 + bob); x.fill(); }
  });
  x.font = '9px monospace'; x.fillStyle = '#3a5a34'; x.textAlign = 'left'; x.fillText('⛺ Lager  ☠️ Boss  🪙 Händler  ? Geheimnis', 10, H - 10);
  x.textAlign = 'right'; x.fillText('N ↑', W - 10, 16);
}
function mapClick(ev) {
  const c = $('mapcv'); if (!c || !MAPGEO) return; const r = c.getBoundingClientRect();
  const mx = (ev.clientX - r.left) * c.width / r.width, my = (ev.clientY - r.top) * c.height / r.height;
  let best = null, bd = 1e9;
  HEXES.forEach(h => { const [px, py] = MAPGEO.pos(h); const d = Math.hypot(px - mx, py - my); if (d < bd) { bd = d; best = h; } });
  if (best && bd < MAPGEO.size) { mapSel = best.id; SFX.play('click'); render(); }
}
// ─── BAUEN ───
function stationOk(st) {
  if (st === 'hand') return true;
  if (!atCamp()) return false;
  if (st === 'feuer') return fireOn();
  return !!G.bld[st === 'gestell' ? 'trockengestell' : st];
}
function stationReason(st) { if (st === 'hand') return ''; if (!atCamp()) return 'Nur im Lager'; if (st === 'feuer') return G.bld.lagerfeuer ? 'Feuer muss brennen' : 'Lagerfeuer bauen'; return ST_N[st] + ' bauen'; }
function renderCraft() {
  let h = '<div class="subtabs"><button class="stab' + (SUB.craft === 'items' ? ' on' : '') + '" data-a="sub" data-id="items">🔨 HERSTELLEN</button><button class="stab' + (SUB.craft === 'bld' ? ' on' : '') + '" data-a="sub" data-id="bld">🏗️ GEBÄUDE</button></div>';
  if (SUB.craft === 'bld') return h + renderBuildings();
  const sts = ['alle', 'hand', 'feuer', 'werkbank', 'schmiede', 'alchemie', 'gestell'];
  h += '<div class="subtabs">' + sts.map(s => '<button class="stab' + (SUB.craftSt === s ? ' on' : '') + '" data-a="subst" data-id="' + s + '" style="min-width:auto">' + (s === 'alle' ? 'ALLE' : ST_N[s].split(' ')[0]) + '</button>').join('') + '</div>';
  const list = RECIPES.filter(r => (SUB.craftSt === 'alle' || r.st === SUB.craftSt) && (!r.bp || G.bp.includes(r.bp)));
  const sorted = list.map(r => ({ r, ok: stationOk(r.st) && hasAll(r.in) })).sort((a, b) => (b.ok - a.ok));
  h += '<div class="grid2">';
  sorted.forEach(({ r, ok }) => {
    const out = r.g ? GEAR[r.g] : ITEMS[r.o]; const stOk = stationOk(r.st);
    const rar = out.r || 0; const owned = r.g ? G.gear.filter(x => x.id === r.g).length : (G.inv[r.o] || 0);
    h += '<div class="card bord' + rar + (ok ? '' : ' dis') + '" data-a="craft" data-id="' + r.id + '" style="' + (ok ? '' : 'opacity:.6') + '"><div class="ct"><span class="cn rar' + rar + '">' + out.i + ' ' + out.n + (r.n > 1 ? ' ×' + r.n : '') + '</span>' + (owned ? '<span class="cbadge">' + owned + '</span>' : '') + '</div>';
    if (r.g) h += '<div class="cm">' + gearStats(out) + '</div>';
    h += '<div class="cost">' + costPills(r.in) + '</div>';
    h += '<div class="cm">' + ST_N[r.st] + (stOk ? '' : ' · <span style="color:#e07070">' + stationReason(r.st) + '</span>') + ' · ⏱' + r.t + 's' + (r.bp ? ' · 📜' : '') + '</div></div>';
  });
  h += '</div>';
  if (!list.length) h += '<div class="empty">Keine Rezepte.</div>';
  return h;
}
function renderBuildings() {
  let h = '';
  if (G.camp === null) h += '<div class="card hot" style="cursor:default;margin-bottom:8px"><div class="cn">🏕 Lager aufschlagen</div><div class="cm">Dein erster Unterschlupf bestimmt, wo dein Lager steht: <b>' + esc(HEXES[G.hex].n) + '</b> (' + SHELTER_N[BIOMES[HEXES[G.hex].b].shelter] + ', Schutz ' + SHELTER_PROT[BIOMES[HEXES[G.hex].b].shelter] + '%). Höhlen und Felsen schützen am besten.</div></div>';
  else if (!atCamp()) h += '<div class="card" style="cursor:default;margin-bottom:8px;border-color:#5a3a1a"><div class="cn">🏕 Lager: ' + esc(HEXES[G.camp].n) + '</div><div class="cm">Gebäude können nur im Lager gebaut werden. Reise zurück!</div></div>';
  else h += '<div class="sub">🏕 ' + esc(SHELTER_N[G.shelter]) + ' · Schutz ' + shelterProt() + '% · Palisade ' + PALISADE_DEF[G.bld.palisade || 0] + '%</div>';
  Object.keys(BUILD).forEach(k => {
    const B = BUILD[k], lv = G.bld[k] || 0, max = lv >= B.max;
    const reqOk = !B.req || B.req.every(r => G.bld[r]);
    const where = k === 'unterschlupf' && G.camp === null ? true : atCamp();
    const cost = max ? null : B.lv[lv]; const ok = !max && reqOk && where && hasAll(cost);
    h += '<div class="card' + (max ? ' on' : ok ? '' : '') + '" data-a="build" data-id="' + k + '" style="margin-bottom:6px' + (!reqOk || (!where && !max) ? ';opacity:.5' : '') + '"><div class="ct"><div><div class="cn">' + B.i + ' ' + B.n + (B.max > 1 ? ' <span class="kbd">STUFE ' + lv + '/' + B.max + '</span>' : lv ? ' <span class="kbd">✓ GEBAUT</span>' : '') + '</div><div class="cm">' + B.d + '</div></div></div>';
    if (!max) { h += '<div class="cost">' + costPills(cost) + '</div>'; if (!reqOk) h += '<div class="cm" style="color:#e07070">Benötigt: ' + B.req.map(r => BUILD[r].n).join(', ') + '</div>'; }
    h += '</div>';
  });
  return h;
}
// ─── TASCHE ───
function renderBag() {
  const w = invWeight(), cap = invCap();
  let h = '<div class="row" style="cursor:default"><span>🎒</span><div class="rn"><div class="t">Tragkraft ' + w + ' / ' + cap + '</div><div class="bar" style="margin-top:4px"><i style="width:' + clamp(w / cap * 100, 0, 100) + '%;background:' + (w / cap > 0.9 ? '#ff5050' : w / cap > 0.7 ? '#e0a030' : '#7ae05a') + '"></i></div></div><span class="rv">🪙 ' + fmt(G.coins) + '</span></div>';
  const cats = [['alle', 'ALLE'], ['gear', '⚔ AUSRÜSTUNG'], ['mat', 'MATERIAL'], ['food', 'NAHRUNG'], ['med', 'MEDIZIN'], ['tool', 'WERKZEUG']];
  if (atCamp() && G.bld.vorratskiste) cats.push(['store', '📦 KISTE']);
  h += '<div class="subtabs" style="margin-top:8px">' + cats.map(([k, n]) => '<button class="stab' + (SUB.bag === k ? ' on' : '') + '" data-a="subbag" data-id="' + k + '" style="min-width:auto">' + n + '</button>').join('') + '</div>';
  if (SUB.bag === 'gear') return h + renderGear();
  if (SUB.bag === 'store') return h + renderStore();
  if (SUB.bag === 'alle') h += renderEquipSlots();
  const keys = Object.keys(G.inv).filter(k => G.inv[k] > 0 && ITEMS[k] && (SUB.bag === 'alle' || ITEMS[k].c === SUB.bag || (SUB.bag === 'med' && ['throw', 'ammo'].includes(ITEMS[k].c)) || (SUB.bag === 'tool' && ITEMS[k].c === 'quest')));
  const order = ['quest', 'tool', 'med', 'throw', 'food', 'ammo', 'mat'];
  keys.sort((a, b) => order.indexOf(ITEMS[a].c) - order.indexOf(ITEMS[b].c) || ITEMS[b].r - ITEMS[a].r);
  if (!keys.length) h += '<div class="empty">Nichts hier.</div>';
  keys.forEach(k => {
    const it = ITEMS[k]; const usable = it.eat || (it.c === 'med' && (it.heal || it.en));
    h += '<div class="row bord' + it.r + '" data-a="item" data-id="' + k + '" style="cursor:pointer"><span style="font-size:18px">' + it.i + '</span><div class="rn"><div class="t rar' + it.r + '">' + it.n + '</div><div class="d">' + CAT_N[it.c] + (it.w ? ' · ' + it.w + ' kg' : '') + '</div></div><span class="rv">×' + G.inv[k] + '</span>' +
      (usable ? '<button class="mini g" data-a="use" data-id="' + k + '">' + (it.c === 'food' ? 'ESSEN' : 'NUTZEN') + '</button>' : '') + (it.c !== 'quest' ? '<button class="mini r" data-a="drop" data-id="' + k + '">🗑</button>' : '') + '</div>';
  });
  return h;
}
function renderEquipSlots() {
  let h = '<div class="grid2" style="grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:8px">';
  ['waffe', 'koerper', 'kopf', 'amulett'].forEach(s => {
    const g = gearOf(s);
    h += '<div class="slot' + (g ? ' bord' + g.r : '') + '" data-a="subbag" data-id="gear"><div class="sl">' + SLOT_N[s] + '</div>' + (g ? '<div style="font-size:20px">' + g.i + '</div><div class="sn rar' + g.r + '">' + g.n + '</div>' + (g.dur ? '<div class="durbar"><i style="width:' + (g.cur / g.dur * 100) + '%;background:' + (g.cur / g.dur > 0.3 ? '#7ae05a' : '#ff5050') + '"></i></div>' : '') : '<div style="font-size:18px;opacity:.25">＋</div>') + '</div>';
  });
  return h + '</div>';
}
function renderGear() {
  let h = renderEquipSlots();
  if (!G.gear.length) return h + '<div class="empty">Keine Ausrüstung. Stelle Waffen und Rüstungen her!</div>';
  const canRepair = atCamp() && G.bld.werkbank;
  [...G.gear].sort((a, b) => GEAR[b.id].r - GEAR[a.id].r).forEach(o => {
    const g = GEAR[o.id], eq = G.equip[g.slot] === o.uid;
    h += '<div class="row bord' + g.r + '"' + (eq ? ' style="box-shadow:0 0 0 1px #c8ff8044 inset"' : '') + '><span style="font-size:20px">' + g.i + '</span><div class="rn"><div class="t rar' + g.r + '">' + g.n + (eq ? ' <span class="kbd" style="color:var(--g)">● AUSGERÜSTET</span>' : '') + '</div><div class="d">' + SLOT_N[g.slot] + ' · ' + gearStats(g) + '</div>' +
      (g.dur ? '<div class="durbar" style="width:100%;margin-top:4px"><i style="width:' + (o.dur / g.dur * 100) + '%;background:' + (o.dur / g.dur > 0.3 ? '#7ae05a' : '#ff5050') + '"></i></div><div class="d">Haltbarkeit ' + o.dur + '/' + g.dur + (o.dur <= 0 ? ' · ZERBROCHEN' : '') + '</div>' : '') + (g.d ? '<div class="d" style="color:#b8a878">' + g.d + '</div>' : '') + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:4px">' + (eq ? '<button class="mini" data-a="unequip" data-id="' + o.uid + '">ABLEGEN</button>' : '<button class="mini g" data-a="equip" data-id="' + o.uid + '">ANLEGEN</button>') +
      (g.dur && o.dur < g.dur && canRepair ? '<button class="mini" data-a="repair" data-id="' + o.uid + '">🔧 ' + repairCost(o).txt + '</button>' : '') +
      (!eq ? '<button class="mini r" data-a="scrap" data-id="' + o.uid + '">ZERLEGEN</button>' : '') + '</div></div>';
  });
  if (!canRepair) h += '<div class="sub" style="margin-top:6px">🔧 Reparieren: an der Werkbank im Lager.</div>';
  return h;
}
function repairCost(o) {
  const g = GEAR[o.id], miss = (g.dur - o.dur) / g.dur; const base = g.r >= 3 ? 'stahl' : g.r >= 2 ? 'eisen' : g.slot === 'koerper' || g.slot === 'kopf' ? 'fell' : 'aeste';
  const n = Math.max(1, Math.ceil(miss * (g.r >= 2 ? 2 : 4))); return { req: { [base]: n }, txt: n + ITEMS[base].i };
}
function renderStore() {
  let h = '<div class="sub">📦 Vorratskiste: ' + storeCount() + ' / ' + storeCap() + ' · Tippe auf ein Item, um es zu verschieben.</div>';
  h += '<div class="btnrow" style="margin-bottom:8px"><button class="btn ghost" data-a="storeall">⬇ Alle Materialien einlagern</button></div>';
  const keys = Object.keys(G.store).filter(k => G.store[k] > 0);
  if (!keys.length) h += '<div class="empty">Die Kiste ist leer.</div>';
  keys.forEach(k => { const it = ITEMS[k]; h += '<div class="row"><span style="font-size:18px">' + it.i + '</span><div class="rn"><div class="t">' + it.n + '</div></div><span class="rv">×' + G.store[k] + '</span><button class="mini g" data-a="unstore" data-id="' + k + '">ENTNEHMEN</button></div>'; });
  return h;
}
// ─── HELD ───
function renderHero() {
  const s = ST();
  let h = '<div class="card" style="cursor:default;display:flex;gap:12px;align-items:center"><canvas id="heroport" width="72" height="96" style="width:72px;height:96px;image-rendering:pixelated;background:radial-gradient(#1a2a1a,#050805);border-radius:8px;border:1px solid var(--line2)"></canvas><div style="flex:1">';
  h += '<div class="cn" style="font-family:var(--pix);font-size:15px">' + esc(G.name) + '</div><div class="cm">Subjekt #247 · Level ' + G.lv + (G.cycle ? ' · Zyklus ' + (G.cycle + 1) : '') + (G.hardcore ? ' · ☠ HARDCORE' : '') + '</div>';
  h += '<div class="bar" style="margin-top:6px"><i style="width:' + (G.lv >= 50 ? 100 : G.xp / xpNeed(G.lv) * 100) + '%;background:linear-gradient(90deg,#5fe1ff,#c8ff80)"></i></div><div class="cm">' + (G.lv >= 50 ? 'MAX LEVEL' : fmt(G.xp) + ' / ' + fmt(xpNeed(G.lv)) + ' XP') + '</div></div></div>';
  h += '<div class="sec">Attribute ' + (G.pts ? '<span style="color:var(--a)">· ' + G.pts + ' Punkte frei!</span>' : '') + '</div>';
  [['str', 'STR', '#ff7a5a', 'Angriff +2, Tragkraft +2'], ['vit', 'VIT', '#7ae05a', 'Leben +9, Verteidigung +1'], ['agi', 'GES', '#5fe1ff', 'Tempo, Krit, Ausweichen, schnelleres Sammeln'], ['int', 'INT', '#c58cff', 'Heilwirkung, Ausdauer im Kampf, XP']].forEach(([k, n, c, d]) => {
    const tr = G.train[k] || 0;
    h += '<div class="attr"><span class="an" style="color:' + c + '">' + n + '</span><div class="ad">' + d + (G.bld.trainingsplatz ? '<div class="bar" style="margin-top:3px;height:4px"><i style="width:' + (tr / 5 * 100) + '%;background:' + c + '"></i></div>' : '') + '</div><span class="av">' + G.attr[k] + '</span><button class="plus" data-a="attr" data-id="' + k + '"' + (G.pts ? '' : ' disabled') + '>+</button></div>';
  });
  h += '<div class="sec">Kampfwerte</div><div class="statgrid">';
  [['❤ LEBEN', s.hp], ['⚔ ANGRIFF', s.atk], ['🛡 VERTEIDIGUNG', s.def], ['💨 TEMPO', s.spd], ['🎯 KRITISCH', Math.round(s.crit) + '%'], ['🌀 AUSWEICHEN', Math.round(s.dodge) + '%'], ['🔋 AUSDAUER', s.ap], ['🧪 HEILKRAFT', Math.round(s.pot * 100) + '%']].forEach(([k, v]) => { h += '<div class="statbox"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; });
  h += '</div><div class="sub" style="margin-top:6px">Grundangriff: <b style="color:var(--g)">' + BASIC[s.cls].n + '</b> (' + CLS_N[s.cls] + ')</div>';
  h += '<div class="sec">Fähigkeiten · ' + G.eqSkills.length + '/3 aktiv</div>';
  Object.keys(SKILLS).forEach(k => {
    const sk = SKILLS[k], learned = G.lv >= sk.lv, on = G.eqSkills.includes(k);
    h += '<div class="row' + (on ? ' bord1' : '') + '" style="' + (learned ? 'cursor:pointer' : 'opacity:.35') + '"' + (learned ? ' data-a="skill" data-id="' + k + '"' : '') + '><span style="font-family:var(--pix);font-size:9px;color:var(--dim);width:30px">LV' + sk.lv + '</span><div class="rn"><div class="t">' + (on ? '● ' : '') + sk.n + ' <span class="kbd" style="color:var(--c)">' + (sk.ap ? sk.ap + ' AP' : 'GRATIS') + '</span></div><div class="d">' + sk.d + '</div></div>' + (learned ? '<span class="mini' + (on ? ' g' : '') + '">' + (on ? 'AKTIV' : 'WÄHLEN') + '</span>' : '<span>🔒</span>') + '</div>';
  });
  h += '<div class="sec">🎯 Training</div>';
  if (!G.bld.trainingsplatz) h += '<div class="empty">Baue einen Trainingsplatz im Lager, um gezielt Attribute zu steigern.</div>';
  else {
    h += '<div class="sub">Je 5 Trainingseinheiten = +1 Attribut dauerhaft. Kostet ⚡20 Energie und 🍖6 Hunger.</div><div class="grid2">';
    [['str', '🪓 Holzhacken', 'Stärke'], ['vit', '🏃 Dauerlauf', 'Vitalität'], ['agi', '🎯 Zielwerfen', 'Geschick'], ['int', '📖 Fährtenlesen', 'Verstand']].forEach(([k, n, a]) => {
      const dis = !atCamp() || G.en < 20 || G.hu < 8 || G.busy;
      h += '<div class="card' + (dis ? ' dis' : '') + '" data-a="train" data-id="' + k + '"><div class="cn">' + n + '</div><div class="cm">' + a + ' · ' + (G.train[k] || 0) + '/5 · ⏱ 10s</div></div>';
    });
    h += '</div>'; if (!atCamp()) h += '<div class="sub" style="margin-top:6px">Nur im Lager möglich.</div>';
  }
  return h;
}
function drawHeroPortrait() {
  const c = $('heroport'); if (!c || !imgOk('held')) return; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, 72, 96); x.fillStyle = 'rgba(0,0,0,0.4)'; x.beginPath(); x.ellipse(36, 88, 22, 5, 0, 0, 7); x.fill();
  x.drawImage(IMG.held, 0, 0, 36, 52, 4, 2, 64, 92);
}
// ─── JOURNAL ───
function renderJournal() {
  const tabs = [['ziele', '🎯 ZIELE'], ['daily', '📋 AUFTRÄGE'], ['beast', '📖 BESTIARIUM'], ['ach', '🏆 ERFOLGE'], ['notes', '📓 NOTIZEN'], ['log', '📜 LOG']];
  let h = '<div class="subtabs">' + tabs.map(([k, n]) => '<button class="stab' + (SUB.journal === k ? ' on' : '') + '" data-a="subj" data-id="' + k + '" style="min-width:auto">' + n + '</button>').join('') + '</div>';
  const j = SUB.journal;
  if (j === 'ziele') {
    QUESTS.forEach((q, i) => {
      if (i > G.q + 1) return; const done = i < G.q, cur = i === G.q; const [c, m] = q.g(G);
      h += '<div class="row' + (cur ? ' bord4' : '') + '" style="' + (done ? 'opacity:.5' : i > G.q ? 'opacity:.3' : '') + '"><span style="font-size:16px">' + (done ? '✅' : cur ? '▶️' : '🔒') + '</span><div class="rn"><div class="t">' + q.t + '</div><div class="d">' + q.d + (cur ? '<br><span style="color:var(--a)">💡 ' + q.hint + '</span>' : '') + '</div></div>' + (cur && m > 1 ? '<span class="rv">' + Math.min(c, m) + '/' + m + '</span>' : '') + '</div>';
    });
    if (!curQuest()) h += '<div class="empty">Alle Hauptziele erfüllt. Du bist eine Legende.</div>';
  } else if (j === 'daily') {
    h += '<div class="sub">Neue Aufträge jeden Morgen. Belohnung: XP + Münzen. Alle 3 erledigt = Bonus!</div>';
    (G.daily.list || []).forEach(e => { const d = DAILY.find(x => x.id === e.id); const p = dailyProg(e); h += '<div class="row' + (e.done ? ' bord1' : '') + '"><span style="font-size:16px">' + (e.done ? '✅' : '📋') + '</span><div class="rn"><div class="t">' + d.t.replace('{n}', e.need) + '</div><div class="bar" style="margin-top:4px"><i style="width:' + (p / e.need * 100) + '%;background:var(--a)"></i></div></div><span class="rv">' + p + '/' + e.need + '</span></div>'; });
  } else if (j === 'beast') {
    const ids = Object.keys(ENEMIES); const n = ids.filter(id => M.beast[id]).length;
    h += '<div class="sub">Entdeckt: ' + n + '/' + ids.length + ' · Tippe für Details.</div><div class="beast">';
    ids.forEach(id => { const b = M.beast[id], E = ENEMIES[id]; h += '<div class="b' + (b ? '' : ' unk') + (E.boss ? ' bord4' : '') + '" data-a="beast" data-id="' + id + '"><canvas data-beast="' + id + '" width="64" height="64"></canvas><div class="bn">' + (b ? E.n : '???') + '</div><div class="kbd">' + (b ? '☠ ' + b.kills : '') + '</div></div>'; });
    h += '</div>';
  } else if (j === 'ach') {
    const n = ACH.filter(a => M.ach[a.id]).length;
    h += '<div class="sub">Freigeschaltet: ' + n + '/' + ACH.length + ' · Bleiben über alle Spielstände erhalten.</div>';
    ACH.forEach(a => { const u = M.ach[a.id]; h += '<div class="ach' + (u ? '' : ' lock') + '"><span class="ai">' + a.i + '</span><div><div class="at">' + a.n + '</div><div class="ad">' + a.d + '</div></div></div>'; });
  } else if (j === 'notes') {
    if (!G.secrets.length && !G.radio) h += '<div class="empty">Noch keine Hinweise gefunden. Erkunde die Waben – manche verbergen Geheimnisse.</div>';
    G.secrets.forEach(s => { const S = SECRETS[s]; h += '<div class="row" data-a="note" data-id="' + s + '" style="cursor:pointer"><span>' + (S.k === 'note' ? '📓' : S.k === 'arkon' ? '📡' : '🔎') + '</span><div class="rn"><div class="t">' + S.t + '</div><div class="d">' + esc(S.x.slice(0, 60)) + '…</div></div></div>'; });
    for (let i = 0; i < G.radio; i++) h += '<div class="row" data-a="radio" data-id="' + i + '" style="cursor:pointer"><span>📻</span><div class="rn"><div class="t">' + RADIO[i].t + '</div></div></div>';
  } else {
    G.log.slice(0, 80).forEach(l => { h += '<div class="logl ' + l.k + '"><span class="kbd">T' + l.d + ' ' + fmtTime(l.m) + '</span> ' + esc(l.t) + '</div>'; });
  }
  return h;
}
function drawBeastThumbs() {
  document.querySelectorAll('canvas[data-beast]').forEach(c => {
    const id = c.dataset.beast, s = getEnemySprite(id); const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 64, 64);
    const w = s.naturalWidth || s.width, h = s.naturalHeight || s.height, sc = Math.min(60 / w, 60 / h); x.drawImage(s, (64 - w * sc) / 2, (64 - h * sc) / 2, w * sc, h * sc);
  });
}
