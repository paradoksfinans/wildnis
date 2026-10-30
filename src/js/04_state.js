// ═══════════════ ZUSTAND ═══════════════
const SAVE_KEY = 'wildnis3_save', META_KEY = 'wildnis3_meta';
const MIN_PER_SEC = 2, DAY_START = 360, NIGHT_AT = 1320;
const EMIN = { baer: 6, bandit: 3, spinne: 4, moorkriecher: 4, frostwolf: 8, drohne: 10, mutant: 13, natter: 2, keiler: 2, wolf: 2 };
let G = null;
let M = { ach: {}, beast: {}, endings: [], best: { score: 0, day: 0 }, runs: 0, cycle: 0 };
let DIRTY = true;
function markDirty() { DIRTY = true; }

function newGame(name, hardcore) {
  const cyc = M.cycle || 0;
  G = {
    v: 3, name: (name || 'NAMENLOS').toUpperCase().slice(0, 12), hardcore: !!hardcore, cycle: cyc,
    day: 1, min: DAY_START, played: 0,
    hp: 100, en: 90, hu: 70, du: 65, wa: 70, sick: 0,
    lv: 1, xp: 0, pts: cyc * 3, attr: { str: 5, vit: 5, agi: 5, int: 5 }, train: { str: 0, vit: 0, agi: 0, int: 0 },
    inv: {}, store: {}, coins: 0,
    gear: [], equip: { waffe: null, koerper: null, kopf: null, amulett: null }, uid: 1,
    eqSkills: ['kraftschlag'],
    hex: 0, seen: [0], camp: null, shelter: null, bld: {}, prod: {}, fire: 0,
    weather: 'klar', wTimer: 150,
    stats: { wins: 0, gathered: 0, crafted: 0, cooked: 0, travels: 0, ate: 0, crits: 0, dmg: 0, trained: 0, maxhit: 0, flawless: 0, dailies: 0, winters: 0, sick: 0, deaths: 0, losses: 0 },
    secrets: [], radio: 0, bp: [], bossDown: {}, q: 0,
    daily: { day: 0, list: [] },
    trader: { day: 0, stock: [], gear: [] },
    log: [], busy: null, lastReal: Date.now(), tut: 0,
    opt: G && G.opt ? G.opt : { sound: true, music: true, vib: true },
    ended: false,
  };
  G.hp = maxHP(); G.inv = { wasser: 2, beeren: 3 };
  addLog('// PROTOKOLL 247 GESTARTET · ' + G.name, 'arkon');
  addLog('Du erwachst im dichten Wald. Dein Kopf dröhnt. Kein Gedächtnis.', 'bad');
  addLog('Sammle Äste. Finde Feuerstein. Überlebe die erste Nacht.', '');
  newDaily();
  M.runs = (M.runs || 0) + 1; saveMeta();
}
function saveGame() {
  if (!G || G.dead) return;
  G.lastReal = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { }
}
function loadGame() {
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; const g = JSON.parse(s); if (!g || g.v !== 3) return null; return g; } catch (e) { return null; }
}
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(M)); } catch (e) { } }
function loadMeta() { try { const s = localStorage.getItem(META_KEY); if (s) M = Object.assign(M, JSON.parse(s)); } catch (e) { } }
function wipeSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

// ─── Abgeleitete Werte ───
function gearOf(slot) { const u = G.equip[slot]; if (!u) return null; const g = G.gear.find(x => x.uid === u); return g ? Object.assign({}, GEAR[g.id], { uid: g.uid, id: g.id, cur: g.dur }) : null; }
function gearSum(key) { let s = 0; for (const sl in G.equip) { const g = gearOf(sl); if (g && g[key] && (g.cur === undefined || g.cur > 0 || !g.dur)) s += g[key]; } return s; }
function maxHP() { return Math.round(60 + G.attr.vit * 9 + G.lv * 5 + gearSum('hp')); }
function ST() {
  const w = gearOf('waffe'), wOk = w && (!w.dur || w.cur > 0);
  const tired = G.en < 10 ? 0.8 : 1;
  return {
    hp: maxHP(),
    atk: Math.round((G.attr.str * 2 + G.lv + (wOk ? w.atk : 2) + gearSum('atk') - (wOk ? w.atk : 0)) * tired),
    def: Math.round(G.attr.vit + Math.floor(G.lv / 2) + gearSum('def')),
    spd: Math.round(5 + G.attr.agi * 1.5 + gearSum('spd')),
    crit: Math.min(60, 4 + G.attr.agi * 0.6 + gearSum('crit')),
    dodge: Math.min(40, 2 + G.attr.agi * 0.5 + gearSum('dodge')),
    pot: 1 + G.attr.int * 0.05,
    ap: Math.round(20 + G.attr.int * 1.5),
    xp: 1 + G.attr.int * 0.005 + gearSum('xp') / 100 + G.cycle * 0.1,
    luck: gearSum('luck') / 100,
    ins: gearSum('wa'),
    cls: wOk ? w.cls : 'faust', weapon: wOk ? w : null,
  };
}
function xpNeed(l) { return Math.round(18 * Math.pow(l, 1.55) + 12); }
function invWeight() { let s = 0; for (const k in G.inv) { const it = ITEMS[k]; if (it && G.inv[k] > 0) s += it.w * G.inv[k]; } return Math.round(s * 10) / 10; }
function invCap() { let c = 40 + G.attr.str * 2; ['fellbeutel', 'rucksack', 'militaerrucksack'].forEach(b => { if (G.inv[b] > 0) c += ITEMS[b].cap; }); return c; }
function storeCap() { return [0, 150, 400][G.bld.vorratskiste || 0]; }
function storeCount() { let s = 0; for (const k in G.store) s += G.store[k] || 0; return s; }
function has(k, n = 1) { return (G.inv[k] || 0) >= n; }
function hasAll(req) { for (const k in req) if ((G.inv[k] || 0) < req[k]) return false; return true; }
function take(req) { for (const k in req) { G.inv[k] = (G.inv[k] || 0) - req[k]; if (G.inv[k] <= 0) delete G.inv[k]; } markDirty(); }
function addItem(k, n = 1, quiet) {
  if (k === 'coins') { G.coins += n; if (!quiet) SFX.play('coin'); markDirty(); return n; }
  const it = ITEMS[k]; if (!it || n <= 0) return 0;
  let add = n;
  if (it.w > 0) { const free = invCap() - invWeight(); add = Math.max(0, Math.min(n, Math.floor(free / it.w + 1e-6))); }
  if (add > 0) { G.inv[k] = (G.inv[k] || 0) + add; G.stats['got_' + k] = (G.stats['got_' + k] || 0) + add; }
  if (add < n && !quiet) toast('🎒', 'TASCHE VOLL', (n - add) + '× ' + it.n + ' zurückgelassen. Wirf etwas weg oder lagere ein.', 'bad');
  markDirty(); return add;
}
function addGear(id, quiet) {
  const g = GEAR[id]; if (!g) return null;
  const o = { uid: G.uid++, id, dur: g.dur || 0 }; G.gear.push(o);
  if (!quiet) toast(g.i, 'NEUE AUSRÜSTUNG', g.n + ' · ' + RAR_N[g.r], g.r >= 3 ? 'gold' : '');
  if (!G.equip[g.slot]) { G.equip[g.slot] = o.uid; }
  markDirty(); return o;
}
function addLog(t, k = '') { if (!G) return; G.log.unshift({ t, k, d: G.day, m: Math.floor(G.min) }); if (G.log.length > 120) G.log.length = 120; }
function gainXP(n, quiet) {
  if (G.lv >= 50) return;
  n = Math.max(1, Math.round(n * ST().xp)); G.xp += n;
  if (!quiet) floater('+' + n + ' XP', '#5fe1ff');
  let up = false;
  while (G.lv < 50 && G.xp >= xpNeed(G.lv)) {
    G.xp -= xpNeed(G.lv); G.lv++; G.pts += 3; up = true;
    const newSk = Object.keys(SKILLS).filter(s => SKILLS[s].lv === G.lv);
    newSk.forEach(s => { if (G.eqSkills.length < 3) G.eqSkills.push(s); });
    queueLevelUp(G.lv, newSk);
  }
  if (up) { G.hp = Math.min(maxHP(), G.hp + maxHP() * 0.3); }
  markDirty();
}
function season() { return SEASONS[Math.floor((G.day - 1) / SEASON_LEN) % 4]; }
function seasonIdx() { return Math.floor((G.day - 1) / SEASON_LEN) % 4; }
function isNight() { return G.min < 390 || G.min >= 1230; }
function dayPhase() { const m = G.min; if (m < 420) return 'dawn'; if (m < 1080) return 'day'; if (m < 1230) return 'dusk'; return 'night'; }
function atCamp() { return G.camp !== null && G.hex === G.camp; }
function fireOn() { return atCamp() && G.bld.lagerfeuer && G.fire > 0; }
function temperature() {
  const h = G.min / 60; const dayCurve = -Math.cos((h - 3) / 24 * Math.PI * 2) * 5;
  const hx = HEXES[G.hex], b = BIOMES[hx.b];
  return Math.round(season().t + WEATHER[G.weather].t + b.temp + dayCurve);
}
function feltTemp() {
  let t = temperature() + ST().ins / 4;
  if (fireOn()) t += 8;
  if (atCamp() && G.bld.unterschlupf) t += 1 + G.bld.unterschlupf;
  return Math.round(t);
}
function shelterProt() { if (!atCamp() || !G.bld.unterschlupf) return 0; return SHELTER_PROT[G.shelter] + G.bld.unterschlupf * 12; }
function score() { return G.day * 100 + G.lv * 60 + G.stats.wins * 15 + Object.keys(G.bossDown).length * 500 + G.secrets.length * 40; }
function curQuest() { return QUESTS[G.q] || null; }

// ─── Tagesaufträge ───
function newDaily() {
  const pool = DAILY.filter(d => !d.req || d.req(G));
  const list = []; const used = new Set();
  while (list.length < 3 && used.size < pool.length) {
    const d = pick(pool); if (used.has(d.id)) continue; used.add(d.id);
    const need = rint(d.n[0], d.n[1]) + Math.floor(G.day / 4) * (d.k === 'dmg' ? 40 : 0);
    list.push({ id: d.id, need, base: G.stats[d.k] || 0, done: false });
  }
  G.daily = { day: G.day, list };
}
function dailyProg(e) { const d = DAILY.find(x => x.id === e.id); return Math.min(e.need, (G.stats[d.k] || 0) - e.base); }
function checkDaily() {
  if (!G.daily) return;
  G.daily.list.forEach(e => {
    if (e.done) return; const d = DAILY.find(x => x.id === e.id);
    if (dailyProg(e) >= e.need) {
      e.done = true; G.stats.dailies++; const c = rint(8, 16) + G.day;
      gainXP(d.xp + G.lv * 3, true); G.coins += c;
      toast('📋', 'TAGESAUFTRAG ERLEDIGT', d.t.replace('{n}', e.need) + ' · +' + c + ' 🪙', 'gold'); SFX.play('coin');
      if (G.daily.list.every(x => x.done)) { const bonus = pick(['heiltrank', 'konserve', 'brandbombe', 'eisen', 'leder']); addItem(bonus, 1, true); toast('🎁', 'ALLE AUFTRÄGE!', 'Bonus: ' + ITEMS[bonus].n, 'gold'); }
      markDirty();
    }
  });
}
// ─── Quests ───
function checkQuest() {
  let q = curQuest(); let guard = 0;
  while (q && guard++ < 5) {
    const [c, m] = q.g(G);
    if (c < m) break;
    G.q++;
    if (q.rw.xp) gainXP(q.rw.xp, true);
    if (q.rw.items) for (const k in q.rw.items) addItem(k, q.rw.items[k], true);
    if (q.rw.coins) G.coins += q.rw.coins;
    toast('✅', 'ZIEL ERFÜLLT: ' + q.t.toUpperCase(), q.rw.xp ? '+' + q.rw.xp + ' XP' : 'Weiter so!', 'gold'); SFX.play('achieve');
    addLog('✅ Ziel erfüllt: ' + q.t, 'disc');
    q = curQuest(); markDirty();
  }
}
// ─── Erfolge ───
function unlockAch(id) {
  if (M.ach[id]) return; const a = ACH.find(x => x.id === id); if (!a) return;
  M.ach[id] = Date.now(); saveMeta();
  setTimeout(() => { toast(a.i, 'ERFOLG: ' + a.n.toUpperCase(), a.d, 'blue'); SFX.play('achieve'); }, 400);
}
function checkAch() { ACH.forEach(a => { if (!M.ach[a.id] && a.c) { try { if (a.c(G, M)) unlockAch(a.id); } catch (e) { } } }); }
function beastSeen(id, kill) { const b = M.beast[id] || (M.beast[id] = { kills: 0 }); if (kill) b.kills++; saveMeta(); }
