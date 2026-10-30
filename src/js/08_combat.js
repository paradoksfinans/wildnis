// ═══════════════ RUNDENKAMPF (Pokémon-Stil) ═══════════════
let C = null;
const CW = 480, CH = 300;
function enemyStats(id, lv) {
  const E = ENEMIES[id]; lv = E.boss ? E.lv : lv;
  const hm = 1 + 0.16 * (lv - 1), am = 1 + 0.11 * (lv - 1), atm = 1.35 * (1 + 0.11 * (lv - 1));
  const diff = (G.hardcore ? 1.15 : 1) * (1 + 0.3 * G.cycle);
  return { n: E.n, lv, max: Math.round(E.hp * (E.boss ? 1.75 : hm) * diff), atk: Math.round(E.atk * (E.boss ? 1.9 : atm) * (G.hardcore ? 1.2 : 1) * (1 + 0.25 * G.cycle)), def: Math.round(E.def * (E.boss ? 1 : am)), spd: Math.round(E.spd * (E.boss ? 1 : 1 + 0.03 * (lv - 1))), weak: E.weak, resist: E.resist };
}
function startCombat(id, opt = {}) {
  if (inCombat || !G || G.dead) return;
  if (modalOpen) closeModal();
  G.busy = null; G._done = null;
  const E = ENEMIES[id], es = enemyStats(id, opt.lv || 1);
  const s = ST();
  C = {
    id, E, opt, e: Object.assign(es, { hp: es.max, st: {}, charge: null, once: {}, uses: {}, lines: {} }),
    p: { st: {}, ap: Math.round(s.ap * 0.6), apMax: s.ap, once: {}, def: false }, turn: 0, lock: true, menu: 'main', taken: 0,
    a: { eX: 60, eA: 0, pX: -120, eShake: 0, pShake: 0, eFlash: 0, pFlash: 0, eLunge: 0, pLunge: 0, fade: 1, nums: [], parts: [], t: 0, dead: 0, shake: 0 },
  };
  inCombat = true; beastSeen(id, false);
  $('combat').classList.add('show'); $('cbmenu').innerHTML = ''; $('cbmsg').textContent = '';
  const wr = $('cbwrap').getBoundingClientRect(); if (wr.width > 0) { const cv = $('cbcv'); cv.width = CW; cv.height = clamp(Math.round(CW * wr.height / wr.width), 240, 800); cv.getContext('2d').imageSmoothingEnabled = false; }
  CBP.length = 0;
  SFX.setMood('tense', E.boss ? 73 : 98);
  renderCB();
  (async () => {
    if (E.boss) { SFX.play('boss'); vibrate([80, 40, 80, 40, 200]); $('cbiname').textContent = E.n.toUpperCase(); $('cbititle').textContent = E.title; $('cbintro').classList.add('show'); await wait(2300); $('cbintro').classList.remove('show'); if (E.intro) await say(E.intro); }
    else { SFX.play('encounter'); vibrate(60); }
    await say(opt.raid ? '⚠ NÄCHTLICHER ÜBERFALL! ' + E.n + ' (Lv ' + C.e.lv + ') dringt ins Lager ein!' : opt.ambush ? 'HINTERHALT! Ein wildes ' + E.n.toUpperCase() + ' (Lv ' + C.e.lv + ') springt hervor!' : E.boss ? E.n + ' stellt sich dir in den Weg!' : 'Ein wildes ' + E.n.toUpperCase() + ' (Lv ' + C.e.lv + ') erscheint!');
    if (!G.stats.firstFight) { G.stats.firstFight = 1; await say('💡 TIPP: Wenn ein Gegner zu einem großen Angriff ansetzt, nutze BLOCK – das halbiert den Schaden fast komplett!'); }
    if (opt.ambush && C.e.spd > ST().spd) { await say(E.n + ' ist schneller!'); await enemyTurn(); if (await checkEnd()) return; }
    playerMenu();
  })();
}
function startBossIntro(id) {
  if (G.bossDown[id] || inCombat) return; const E = ENEMIES[id];
  showModal({ title: '☠ ' + E.n.toUpperCase() + ' · ' + E.title, cls: 'danger', text: E.lore + '\n\nEmpfohlenes Level: ' + E.lv + ' · Dein Level: ' + G.lv + (E.weak ? '\nSchwäche: ' + EL[E.weak].n : ''), choices: [{ t: '⚔️ KAMPF BEGINNEN', cls: 'red', fn: () => startCombat(id, { boss: true }) }, { t: 'NOCH NICHT', cls: 'ghost' }] });
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let sayResolve = null, sayFast = false;
function say(text, hold) {
  return new Promise(res => {
    const el = $('cbmsg'); el.classList.remove('tap'); let i = 0; sayFast = false;
    const total = text.length; const iv = setInterval(() => {
      i += sayFast ? 6 : 2; el.textContent = text.slice(0, i); if (i % 8 === 0) SFX.play('type');
      if (i >= total) { clearInterval(iv); el.textContent = text; el.classList.add('tap'); const done = () => { sayResolve = null; el.classList.remove('tap'); res(); }; sayResolve = done; setTimeout(() => { if (sayResolve === done) done(); }, hold || Math.min(2200, 650 + total * 16)); }
    }, 18);
  });
}
function cbTap() { if (sayResolve) sayResolve(); else sayFast = true; }
// ─── UI ───
function stBadges(st) { return Object.keys(st).filter(k => st[k] > 0).map(k => '<span class="st" style="background:' + STATUS[k].c + '">' + STATUS[k].n + '</span>').join(''); }
function renderCB() {
  if (!C) return; const e = C.e, s = ST();
  const hpc = p => p > 0.5 ? '#3ac040' : p > 0.2 ? '#e0b020' : '#e03020';
  const ep = e.hp / e.max, pp = G.hp / s.hp;
  $('cbE').innerHTML = '<div class="cbn"><span>' + esc(e.n.toUpperCase()) + (C.E.boss ? ' ☠' : '') + '</span><span class="cbl">Lv' + e.lv + '</span></div><div class="hpw"><span class="hpl">KP</span><div class="hpb"><i style="width:' + ep * 100 + '%;background:' + hpc(ep) + '"></i></div></div><div class="sts">' + stBadges(e.st) + (e.charge ? '<span class="st" style="background:#c02020">⚠ LÄDT</span>' : '') + (M.beast[C.id] && M.beast[C.id].kills && C.E.weak ? '<span class="st" style="background:' + EL[C.E.weak].c + '">SCHWACH: ' + EL[C.E.weak].n + '</span>' : '') + '</div>';
  $('cbP').innerHTML = '<div class="cbn"><span>' + esc(G.name) + '</span><span class="cbl">Lv' + G.lv + '</span></div><div class="hpw"><span class="hpl">KP</span><div class="hpb"><i style="width:' + pp * 100 + '%;background:' + hpc(pp) + '"></i></div></div><div class="hpt">' + Math.max(0, Math.ceil(G.hp)) + ' / ' + s.hp + '</div><div class="sts">' + stBadges(C.p.st) + (C.p.def ? '<span class="st" style="background:#2a6a9a">BLOCK</span>' : '') + '</div>';
  $('apfill').style.width = (C.p.ap / C.p.apMax * 100) + '%'; $('aptxt').textContent = C.p.ap + '/' + C.p.apMax;
}
function playerMenu() { if (!C) return; C.lock = false; C.menu = 'main'; renderMenu(); $('cbmsg').textContent = 'Was wird ' + G.name + ' tun?'; $('cbmsg').classList.remove('tap'); }
function moveList() {
  const s = ST(); const b = BASIC[s.cls]; const arr = [{ id: 'basic', n: b.n, ap: 0, pow: b.pow, el: b.el || 'phys', d: CLS_N[s.cls] }];
  G.eqSkills.forEach(k => { const sk = SKILLS[k]; if (sk && G.lv >= sk.lv) arr.push({ id: k, n: sk.n, ap: sk.ap, pow: sk.pow, el: sk.el || (sk.pow ? 'phys' : null), d: sk.d, once: sk.once }); });
  return arr;
}
function combatItems() { return Object.keys(G.inv).filter(k => { const it = ITEMS[k]; return it && G.inv[k] > 0 && (it.c === 'med' || it.c === 'throw'); }); }
function renderMenu() {
  const m = $('cbmenu'); if (!C || C.lock) { m.innerHTML = ''; return; }
  let h = '';
  if (C.menu === 'main') {
    h = '<button class="cbtn fight" data-a="cb" data-id="fight">⚔ KAMPF</button><button class="cbtn bag" data-a="cb" data-id="bag">🎒 TASCHE <span class="cc">' + combatItems().reduce((s, k) => s + G.inv[k], 0) + '</span></button><button class="cbtn def" data-a="cb" data-id="def">🛡 BLOCK <span class="cc">+6 AP</span></button><button class="cbtn run" data-a="cb" data-id="run"' + (C.E.boss ? ' disabled' : '') + '>🏃 FLUCHT</button>';
  } else if (C.menu === 'fight') {
    moveList().forEach(mv => {
      const dis = C.p.ap < mv.ap || (mv.once && C.p.once[mv.id]);
      const elTag = mv.el ? '<span class="type" style="background:' + EL[mv.el].c + '">' + EL[mv.el].n + '</span>' : '<span class="type" style="background:#3a6a3a">BUFF</span>';
      h += '<button class="cbtn" data-a="cbm" data-id="' + mv.id + '"' + (dis ? ' disabled' : '') + '><span>' + mv.n + '<span class="mt2">' + (mv.pow ? 'Stärke ' + mv.pow + ' · ' : '') + (mv.ap ? mv.ap + ' AP' : 'Gratis') + '</span></span>' + elTag + '</button>';
    });
    if (moveList().length % 2) h += '<div></div>';
    h += '<button class="cbtn back" data-a="cb" data-id="back">◀ ZURÜCK</button>';
  } else if (C.menu === 'bag') {
    const its = combatItems();
    if (!its.length) h += '<div style="grid-column:1/3;color:#8a9a80;font-size:11px;text-align:center;padding:8px">Keine Tränke oder Wurfwaffen dabei.</div>';
    its.slice(0, 8).forEach(k => { const it = ITEMS[k]; h += '<button class="cbtn" data-a="cbi" data-id="' + k + '"><span>' + it.i + ' ' + it.n + '<span class="mt2">' + (it.heal ? '❤ +' + Math.round(it.heal * ST().pot) : it.dmg ? '💥 ' + it.dmg : it.ap ? '+' + it.ap + ' AP' : it.buff ? 'Buff' : '') + '</span></span><span class="cc">×' + G.inv[k] + '</span></button>'; });
    if (its.length % 2) h += '<div></div>';
    h += '<button class="cbtn back" data-a="cb" data-id="back">◀ ZURÜCK</button>';
  }
  m.innerHTML = h;
}
function cbAction(kind, id) {
  if (!C || C.lock) return;
  if (kind === 'cb') { SFX.play('click'); if (id === 'fight' || id === 'bag') { C.menu = id; renderMenu(); return; } if (id === 'back') { C.menu = 'main'; renderMenu(); return; } if (id === 'def') return doRound({ t: 'def' }); if (id === 'run') return doRound({ t: 'run' }); }
  if (kind === 'cbm') { const mv = moveList().find(m => m.id === id); if (!mv || C.p.ap < mv.ap) return; return doRound({ t: 'move', mv }); }
  if (kind === 'cbi') return doRound({ t: 'item', k: id });
}
// ─── Rundenablauf ───
async function doRound(act) {
  C.lock = true; renderMenu(); C.p.def = false; C.turn++;
  const s = ST(); let pSpd = s.spd * (C.p.st.verlangsamt ? 0.5 : 1), eSpd = C.e.spd * (C.e.st.verlangsamt ? 0.5 : 1);
  const priority = act.t !== 'move' || (s.cls === 'bogen' && act.mv.id === 'basic');
  const pFirst = priority || pSpd >= eSpd || (pSpd > eSpd * 0.8 && chance(0.3));
  if (act.t === 'def') { C.p.def = true; C.p.ap = Math.min(C.p.apMax, C.p.ap + 6); SFX.play('block'); renderCB(); await say(G.name + ' geht in Verteidigungshaltung!'); }
  if (act.t === 'run') {
    const ch = clamp(0.45 + (pSpd - eSpd) * 0.03, 0.15, 0.9) * (C.opt.raid ? 0.6 : 1);
    await say(G.name + ' versucht zu fliehen…');
    if (chance(ch)) { SFX.play('step'); await say('Entkommen!'); return endCombat('flee'); }
    await say('Flucht gescheitert!');
  }
  if (pFirst && act.t !== 'def' && act.t !== 'run') { await playerAct(act); if (await checkEnd()) return; }
  await enemyTurn(); if (await checkEnd()) return;
  if (!pFirst && act.t !== 'def' && act.t !== 'run') { await playerAct(act); if (await checkEnd()) return; }
  await endOfRound(); if (await checkEnd()) return;
  playerMenu();
}
function elMult(el, tgt) { if (!el || el === 'phys') return 1; if (tgt.weak === el) return 1.6; if (tgt.resist === el) return 0.5; return 1; }
function calcDmg(atk, pow, def, o = {}) {
  let d = atk * pow / 100 * (60 / (60 + def * (1 - (o.pierce || 0)))) * rnd(0.88, 1.12);
  if (o.crit) d *= 1.7; d *= o.el || 1; if (o.stark) d *= 1.35; if (o.schwach) d *= 0.7; if (o.panzer) d *= 0.6;
  return Math.max(1, Math.round(d));
}
async function playerAct(act) {
  const s = ST(), e = C.e;
  if (C.p.st.betaeubt) { await say(G.name + ' ist betäubt und kann sich nicht bewegen!'); return; }
  if (act.t === 'item') return useCombatItem(act.k);
  const mv = act.mv; const isBasic = mv.id === 'basic'; const def = isBasic ? BASIC[s.cls] : SKILLS[mv.id];
  C.p.ap -= mv.ap || 0; if (def.once) C.p.once[mv.id] = 1;
  if (isBasic && def.ammo && !has(def.ammo)) { await say('Keine Pfeile! ' + G.name + ' schlägt mit dem Bogen zu.'); return hitEnemy({ n: 'Bogenhieb', pow: 55 }, s); }
  if (isBasic && def.ammo) take({ [def.ammo]: 1 });
  await say(G.name + ' setzt ' + def.n.toUpperCase() + ' ein!');
  if (def.heal) { const h = Math.round(s.hp * def.heal * s.pot); G.hp = Math.min(s.hp, G.hp + h); C.a.nums.push({ x: 120, y: 160, t: '+' + h, c: '#7ae05a', life: 1.3 }); healFx(120, 200); SFX.play('heal'); if (def.cure) def.cure.forEach(c => delete C.p.st[c]); renderCB(); await say('+' + h + ' Lebenspunkte!'); }
  if (def.gainAp) { C.p.ap = Math.min(C.p.apMax, C.p.ap + def.gainAp); renderCB(); }
  if (def.self) { for (const k in def.self) C.p.st[k] = def.self[k]; SFX.play('buff'); buffFx(120, 200); renderCB(); if (!def.pow) await say(Object.keys(def.self).map(k => STATUS[k].n).join(' + ') + ' aktiv!'); }
  if (def.pow) await hitEnemy(def, s, isBasic);
}
async function hitEnemy(def, s, isBasic) {
  const e = C.e; const hits = def.hits || 1; let total = 0;
  for (let h = 0; h < hits; h++) {
    if (e.hp <= 0) break;
    const acc = (def.acc || 96) - (C.p.st.blind ? 30 : 0) - (e.spd > 15 ? 4 : 0);
    C.a.pLunge = 1; await wait(180);
    if (rint(1, 100) > acc) { SFX.play('miss'); C.a.nums.push({ x: 350, y: 90, t: 'DANEBEN', c: '#ccc', life: 1.2 }); await say('Daneben!'); continue; }
    const crit = !!C.p.st.fokus || chance((s.crit + (def.crit || 0)) / 100);
    if (C.p.st.fokus) delete C.p.st.fokus;
    let pow = def.pow; if (def.exec && e.hp / e.max < def.exec) pow *= 2.5;
    const em = elMult(def.el, e);
    const d = calcDmg(s.atk, pow, e.def, { pierce: def.pierce || (crit && def.exec ? 0.5 : 0), crit, el: em, stark: C.p.st.stark, schwach: C.p.st.geschwaecht, panzer: e.st.panzer });
    e.hp = Math.max(0, e.hp - d); total += d; G.stats.dmg += d; if (crit) G.stats.crits++; if (d > G.stats.maxhit) G.stats.maxhit = d;
    C.a.eShake = 0.4; C.a.eFlash = 0.25; C.a.shake = crit ? 0.35 : 0.12; SFX.play(crit ? 'crit' : def.el === 'feuer' ? 'fireatk' : def.el === 'elektro' ? 'zap' : 'hit'); vibrate(crit ? 50 : 20);
    C.a.nums.push({ x: 350 + rnd(-20, 20), y: 80, t: (crit ? 'KRIT! ' : '') + d, c: crit ? '#ffd040' : '#fff', big: crit, life: 1.3 });
    hitFx(350, 110, def.el || (s.cls === 'messer' || s.cls === 'schwert' ? 'slash' : 'phys'));
    renderCB();
    if (crit) await say('VOLLTREFFER!', 700); if (em > 1) await say('Sehr effektiv!', 800); if (em < 1) await say('Nicht sehr effektiv…', 800);
    if (def.fx) for (const k in def.fx) { const [c, t] = def.fx[k]; if (e.hp > 0 && chance(c) && !(k === 'betaeubt' && C.E.boss && chance(0.5))) { e.st[k] = Math.max(e.st[k] || 0, t); if (k === 'betaeubt') e.charge = null; renderCB(); await say(e.n + ': ' + STATUS[k].n + '!', 800); } }
  }
  if (isBasic) { const w = gearOf('waffe'); if (w && w.dur) { const o = G.gear.find(x => x.uid === w.uid); o.dur = Math.max(0, o.dur - 1); if (o.dur === 0) { await say('⚠ ' + w.n + ' ist zerbrochen!'); toast('💔', 'WAFFE ZERBROCHEN', w.n + ' – repariere sie an der Werkbank.', 'bad'); } } }
  if (def.recoil && total) { const r = Math.round(ST().hp * def.recoil); G.hp -= r; C.a.nums.push({ x: 120, y: 160, t: '-' + r, c: '#ff8080', life: 1.2 }); renderCB(); await say('Rückstoß! −' + r); }
  if (total && hits > 1) await say(hits + ' Treffer · ' + total + ' Schaden!', 800);
  if (C.E.lines) await bossLine();
}
async function useCombatItem(k) {
  const it = ITEMS[k], s = ST(); if (!has(k)) return; take({ [k]: 1 });
  await say(G.name + ' benutzt ' + it.n + '!');
  if (it.heal) { const h = Math.round(Math.min(it.heal * s.pot, s.hp)); G.hp = Math.min(s.hp, G.hp + h); C.a.nums.push({ x: 120, y: 160, t: '+' + h, c: '#7ae05a', life: 1.3 }); healFx(120, 200); SFX.play('heal'); }
  if (it.cure) it.cure.forEach(c => delete C.p.st[c]);
  if (it.ap) C.p.ap = Math.min(C.p.apMax, C.p.ap + it.ap);
  if (it.buff) { for (const b in it.buff) C.p.st[b] = it.buff[b]; SFX.play('buff'); buffFx(120, 200); }
  if (it.dmg) {
    const e = C.e, d = Math.round(it.dmg * (1 + G.lv * 0.06) * elMult(it.el, e)); e.hp = Math.max(0, e.hp - d); G.stats.dmg += d;
    C.a.eShake = 0.4; C.a.eFlash = 0.3; hitFx(350, 110, it.el || 'phys'); SFX.play(it.el === 'feuer' ? 'fireatk' : 'hit'); C.a.nums.push({ x: 350, y: 80, t: d, c: '#ffb040', life: 1.2 });
    if (it.fx) for (const f in it.fx) { e.st[f] = it.fx[f]; if (f === 'betaeubt') e.charge = null; }
  }
  renderCB(); await wait(400);
}
async function enemyTurn() {
  const e = C.e, E = C.E, s = ST();
  if (e.hp <= 0) return;
  if (e.st.betaeubt) { await say(e.n + ' ist betäubt!'); return; }
  let mvId;
  if (e.charge) { mvId = e.charge; e.charge = null; }
  else {
    const opts = E.moves.filter(([id]) => { const m = EMOVES[id]; if (m.once && e.once[id]) return false; if (m.uses && (e.uses[id] || 0) >= m.uses) return false; if (m.below && e.hp / e.max > m.below) return false; if (m.heal && e.hp / e.max > 0.7) return false; if (m.self && Object.keys(m.self).every(k => e.st[k] > 0)) return false; return true; });
    mvId = wpick(opts.length ? opts : [E.moves[0]]);
    const m = EMOVES[mvId];
    if (m.charge) { e.charge = mvId; SFX.play('roar'); C.a.eShake = 0.6; renderCB(); await say(e.n + ' ' + m.charge, 1600); return; }
  }
  const m = EMOVES[mvId]; if (m.once) e.once[mvId] = 1; if (m.uses) e.uses[mvId] = (e.uses[mvId] || 0) + 1;
  if (m.heal) { const h = Math.round(e.max * m.heal); e.hp = Math.min(e.max, e.hp + h); C.a.nums.push({ x: 350, y: 80, t: '+' + h, c: '#7ae05a', life: 1.2 }); SFX.play('heal'); renderCB(); }
  if (m.self) { for (const k in m.self) e.st[k] = m.self[k]; SFX.play(E.robot ? 'zap' : 'roar'); renderCB(); }
  if (m.msg) await say(e.n + ' ' + m.msg);
  if (!m.pow && m.fx) { for (const k in m.fx) { const [c, t] = m.fx[k]; if (chance(c)) C.p.st[k] = Math.max(C.p.st[k] || 0, t); } renderCB(); return; }
  if (!m.pow) return;
  if (!m.msg) await say(e.n + ' setzt ' + m.n.toUpperCase() + ' ein!');
  const hits = m.hits || 1;
  for (let h = 0; h < hits; h++) {
    C.a.eLunge = 1; await wait(200);
    const acc = (m.acc || 94) - (e.st.blind ? (C.E.boss ? 18 : 28) : 0);
    if (rint(1, 100) > acc || chance(s.dodge / 100)) { SFX.play('miss'); C.a.nums.push({ x: 120, y: 160, t: 'AUSGEWICHEN', c: '#5fe1ff', life: 1.2 }); await say(G.name + ' weicht aus!', 800); continue; }
    const crit = !!e.st.fokus || chance(0.05); if (e.st.fokus) delete e.st.fokus;
    let d = calcDmg(e.atk, m.pow, s.def, { crit, el: m.el === 'eis' && gearSum('wa') >= 50 ? 0.7 : 1, stark: e.st.stark, schwach: e.st.geschwaecht, panzer: C.p.st.panzer });
    let blockedBig = false;
    if (C.p.def) { d = Math.round(d * (m.pow >= 180 ? 0.25 : 0.5)); blockedBig = m.pow >= 180; SFX.play('block'); }
    if (C.p.st.konter) { d = Math.round(d * 0.5); }
    G.hp -= d; C.taken += d;
    C.a.pShake = 0.4; C.a.pFlash = 0.25; C.a.shake = m.pow >= 180 ? 0.5 : 0.15; if (!C.p.def) SFX.play('hurt'); vibrate(m.pow >= 180 ? [60, 30, 90] : 30);
    $('combat').classList.remove('flashR'); void $('combat').offsetWidth; $('combat').classList.add('flashR');
    C.a.nums.push({ x: 120 + rnd(-15, 15), y: 150, t: (crit ? 'KRIT! ' : '') + '-' + d, c: '#ff6060', big: crit || m.pow >= 180, life: 1.3 });
    hitFx(120, 190, m.el || 'phys'); renderCB();
    if (blockedBig) await say('Perfekt geblockt! Kaum Schaden!', 900);
    if (crit) await say('Ein kritischer Treffer!', 700);
    if (m.fx) for (const k in m.fx) { const [c, t] = m.fx[k]; if (G.hp > 0 && chance(c * (C.p.def ? 0.5 : 1))) { C.p.st[k] = Math.max(C.p.st[k] || 0, t); renderCB(); await say(G.name + ': ' + STATUS[k].n + '!', 800); } }
    if (C.p.st.konter && G.hp > 0) { delete C.p.st.konter; const cd = calcDmg(s.atk, 110, e.def, {}); e.hp = Math.max(0, e.hp - cd); C.a.eShake = 0.4; C.a.eFlash = 0.25; SFX.play('hit'); C.a.nums.push({ x: 350, y: 80, t: cd, c: '#5fe0c0', life: 1.2 }); renderCB(); await say('KONTER! ' + cd + ' Schaden zurück!'); }
    if (G.hp <= 0) break;
  }
}
async function endOfRound() {
  const tickSt = async (st, isP) => {
    for (const k of ['blutung', 'gift', 'brand']) if (st[k] > 0) {
      const max = isP ? ST().hp : C.e.max; const d = Math.max(1, Math.round(max * STATUS[k].dot * (isP ? 1 : (C.E.boss ? 0.6 : 1))));
      if (isP) G.hp -= d; else C.e.hp = Math.max(0, C.e.hp - d);
      C.a.nums.push({ x: isP ? 120 : 350, y: isP ? 160 : 80, t: '-' + d, c: STATUS[k].c, life: 1.1 }); renderCB();
      await say((isP ? G.name : C.e.n) + ' leidet unter ' + STATUS[k].n.toLowerCase() + '! −' + d, 900);
    }
    for (const k in st) { if (k === 'konter' || k === 'fokus') continue; st[k]--; if (st[k] <= 0) delete st[k]; }
  };
  await tickSt(C.p.st, true); if (G.hp <= 0) return; await tickSt(C.e.st, false);
  C.p.ap = Math.min(C.p.apMax, C.p.ap + 3); renderCB();
}
async function bossLine() {
  const L = C.E.lines; if (!L) return; const p = C.e.hp / C.e.max;
  for (const th of Object.keys(L).sort((a, b) => b - a)) { if (p <= +th && !C.e.lines[th]) { C.e.lines[th] = 1; await say(L[th], 2400); break; } }
}
async function checkEnd() {
  if (!C) return true;
  if (C.e.hp <= 0) { await victory(); return true; }
  if (G.hp <= 0) { await defeat(); return true; }
  return false;
}
async function victory() {
  const E = C.E, e = C.e; C.a.dead = 0.001; SFX.play('win'); vibrate([40, 30, 40, 30, 120]);
  await say(e.n + ' wurde besiegt!');
  const s = ST(); const xp = Math.round(E.xp * (E.boss ? 1 : 1.3 * (1 + 0.15 * (e.lv - 1))));
  const got = rollLoot(E.loot || [], s.luck); const co = rint(E.coins[0], E.coins[1]) + (E.boss ? 0 : Math.floor(e.lv / 2)); if (co) got.coins = co;
  G.stats.wins++; beastSeen(C.id, true); if (C.taken === 0 && e.lv >= 5) G.stats.flawless++;
  const lootTxt = giveLoot(got, 'Beute');
  (E.gear || []).forEach(g => addGear(g)); (E.items || []).forEach(i => addItem(i, 1));
  if (E.bp && !G.bp.includes(E.bp)) { G.bp.push(E.bp); toast('📜', 'BAUPLAN GEFUNDEN!', BLUEPRINTS[E.bp], 'gold'); }
  if (E.boss) { G.bossDown[C.id] = G.day; addLog('☠ BOSS BESIEGT: ' + E.n, 'disc'); }
  gainXP(xp, true);
  await say('+' + xp + ' XP' + (lootTxt.length ? ' · ' + lootTxt.join('  ') : '') + ((E.gear || []).length ? ' · ' + E.gear.map(g => GEAR[g].i + ' ' + GEAR[g].n).join(', ') : ''), 2400);
  if (C.id === 'grimmzahn') await say('Unter dem Bären: eine pulsierende TREIBSTOFFZELLE. Raketenteil 1/3!', 2400);
  if (C.id === 'w7') await say('Aus dem Wrack ragt ein ZÜNDMODUL. Raketenteil 2/3!', 2400);
  if (C.id === 'subjekt246') await say('Er lächelt. Zum ersten Mal. Dann wird er still. In seiner Hand: der STEUERKERN. Raketenteil 3/3!', 3200);
  endCombat('win');
}
async function defeat() {
  SFX.play('lose'); C.a.pShake = 1;
  await say(G.name + ' bricht zusammen…', 1600);
  if (G.hardcore) { endCombat('lose', true); die('kampf'); return; }
  G.stats.losses++;
  const lost = [];
  Object.keys(G.inv).forEach(k => { const it = ITEMS[k]; if (it && (it.c === 'mat' || it.c === 'food') && G.inv[k] > 0) { const n = Math.floor(G.inv[k] * 0.3); if (n > 0) { G.inv[k] -= n; lost.push(it.i + n); } } });
  G.hp = Math.round(maxHP() * 0.25); G.en = Math.max(10, G.en - 20);
  const toCamp = G.camp !== null && !C.opt.raid; const onEnd = C.opt.onEnd;
  endCombat('lose', true);
  if (toCamp) G.hex = G.camp;
  if (!G.night) G.min = Math.min(NIGHT_AT - 10, G.min + 120);
  showModal({ title: '😵 BEWUSSTLOS', cls: 'danger', text: 'Du erwachst Stunden später' + (toCamp ? ' in deinem Lager' : '') + '. Alles tut weh.\n\nVerloren: ' + (lost.length ? lost.join(' ') : 'nichts') + '\n\n💡 Tipp: ' + pick(['Nutze BLOCK, wenn der Gegner zu einem großen Angriff ansetzt.', 'Verteile Attributpunkte im HELD-Tab.', 'Heiltränke und Verbände retten Leben.', 'Bessere Waffen schmiedest du in der Schmiede.', 'Trainiere am Trainingsplatz.']), choices: [{ t: 'WEITER' }] });
  if (onEnd) onEnd();
}
function endCombat(res, silent) {
  const opt = C ? C.opt : {}; C = null; inCombat = false;
  setTimeout(() => { $('combat').classList.remove('show'); }, silent ? 0 : 200);
  SFX.setMood('calm', 110);
  if (G.hp > maxHP()) G.hp = maxHP(); if (G.hp <= 0 && res !== 'lose') G.hp = 1;
  markDirty(); updateHUD(); checkQuest(); checkAch(); saveGame();
  if (res === 'win' && G.bossDown.prometheus && !G.ended) setTimeout(showEnding, 900);
  if (opt.onEnd && res !== 'lose') opt.onEnd();
}
// ─── Kampf-Rendering ───
const CBP = [];
function hitFx(x, y, kind) {
  const col = { feuer: ['#ff7a20', '#ffd040'], eis: ['#a8e8ff', '#ffffff'], elektro: ['#fff060', '#5fe1ff'], slash: ['#ffffff', '#ffe0e0'], phys: ['#ffffff', '#d0d0d0'] }[kind] || ['#fff', '#ddd'];
  for (let i = 0; i < 16; i++) { const a = rnd(0, Math.PI * 2), v = rnd(40, 160); CBP.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rnd(0.3, 0.7), c: pick(col), s: rint(1, 3) }); }
  if (kind === 'slash') CBP.push({ slash: 1, x, y, life: 0.25 });
}
function healFx(x, y) { for (let i = 0; i < 14; i++) CBP.push({ x: x + rnd(-30, 30), y: y + rnd(-10, 30), vx: 0, vy: rnd(-60, -30), life: rnd(0.6, 1.1), c: pick(['#7ae05a', '#c8ff80', '#fff']), s: 2, plus: 1 }); }
function buffFx(x, y) { for (let i = 0; i < 12; i++) CBP.push({ x: x + rnd(-30, 30), y: y + 30, vx: 0, vy: rnd(-90, -50), life: 0.8, c: pick(['#ff7050', '#ffd040']), s: 2 }); }
let cbLast = 0;
function drawCombat(cx, now) {
  if (!C) return; const dt = Math.min(0.05, (now - (cbLast || now)) / 1000); cbLast = now; const A = C.a; A.t += dt;
  const CH = cx.canvas.height, tall = CH > 420, ePY = Math.round(Math.min(CH * 0.5, CH - 132)), pPY = CH - 22, dyE = ePY - 168, dyP = pPY - 278;
  const mapY = (y, z) => y + (z === 'e' ? dyE : dyP);
  const hx = HEXES[G.hex], L = genLayers(G.hex), P = L.P, sky = skyAt(G.night ? 1380 : G.min, G.weather);
  let sx = 0, sy = 0; if (A.shake > 0) { A.shake -= dt; sx = rnd(-5, 5); sy = rnd(-3, 3); }
  cx.save(); cx.translate(sx, sy);
  if (!P.cave) { const g = cx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, sky.top); g.addColorStop(1, sky.bot); cx.fillStyle = g; cx.fillRect(-6, -6, CW + 12, CH + 12); }
  if (P.cave) { cx.fillStyle = '#16120f'; cx.fillRect(-6, -6, CW + 12, CH + 12); }
  cx.drawImage(L.far, 0, 0, SW, SH, 0, dyE - 40, CW, SH); cx.drawImage(L.mid, 0, 0, SW, SH, 0, dyE - 36, CW, SH);
  const gy0 = dyE + 152; const gg = cx.createLinearGradient(0, gy0, 0, CH); gg.addColorStop(0, P.ground[0]); gg.addColorStop(1, P.ground[1]); cx.fillStyle = gg; cx.fillRect(-6, gy0, CW + 12, CH);
  const R = srng(G.hex + 99); for (let i = 0; i < 360; i++) { cx.fillStyle = shade(P.ground[1], (R() - 0.5) * 0.4); cx.fillRect(R() * CW, gy0 + R() * (CH - gy0), 2, 1); }
  // Plattformen
  const plat = (x, y, rx, ry) => { cx.fillStyle = shade(P.ground[1], -0.35); cx.beginPath(); cx.ellipse(x, y + 3, rx, ry, 0, 0, 7); cx.fill(); cx.fillStyle = shade(P.ground[0], 0.12); cx.beginPath(); cx.ellipse(x, y, rx, ry, 0, 0, 7); cx.fill(); cx.fillStyle = shade(P.ground[0], 0.25); cx.beginPath(); cx.ellipse(x - rx * 0.2, y - ry * 0.25, rx * 0.6, ry * 0.4, 0, 0, 7); cx.fill(); };
  plat(352, ePY, tall ? 104 : 92, tall ? 19 : 17); plat(128, pPY, tall ? 130 : 112, tall ? 23 : 20);
  // Gegner
  A.eX = lerp(A.eX, 0, 0.08); A.pX = lerp(A.pX, 0, 0.08);
  const spr = getEnemySprite(C.id), sc = enemyScale(C.id) * (tall ? 1.2 : 1), w = (spr.naturalWidth || spr.width) * sc, h = (spr.naturalHeight || spr.height) * sc;
  let ex = 352 - w / 2 + A.eX, ey = ePY + 2 - h + (C.E.id === 'prometheus' || C.id === 'prometheus' || C.id === 'drohne' || C.id === 'w7' ? -8 + Math.sin(A.t * 2) * 4 : 0);
  if (A.eShake > 0) { A.eShake -= dt; ex += Math.sin(A.t * 60) * 5; }
  if (A.eLunge > 0) { A.eLunge = Math.max(0, A.eLunge - dt * 3.5); ex -= Math.sin(A.eLunge * Math.PI) * 40; ey += Math.sin(A.eLunge * Math.PI) * 18; }
  const breathe = 1 + Math.sin(A.t * 2.4) * 0.02;
  if (A.dead > 0) { A.dead += dt; cx.globalAlpha = clamp(1 - A.dead * 1.4, 0, 1); ey += A.dead * 40; }
  cx.fillStyle = 'rgba(0,0,0,0.35)'; cx.beginPath(); cx.ellipse(352 + A.eX, ePY, w * 0.38, 7, 0, 0, 7); cx.fill();
  cx.imageSmoothingEnabled = false;
  cx.drawImage(spr, Math.round(ex), Math.round(ey + h * (1 - breathe)), Math.round(w), Math.round(h * breathe));
  if (A.eFlash > 0) { A.eFlash -= dt; const k = 'white_' + C.id; if (!SPR[k]) SPR[k] = tintSprite(spr, 'white'); cx.globalAlpha = clamp(A.eFlash * 4, 0, 0.9); cx.drawImage(SPR[k], Math.round(ex), Math.round(ey + h * (1 - breathe)), Math.round(w), Math.round(h * breathe)); }
  cx.globalAlpha = 1;
  if (C.e.charge) { cx.globalCompositeOperation = 'lighter'; light(cx, 352, ePY - h / 2, 70 + Math.sin(A.t * 12) * 10, 'rgba(255,40,20,0.35)'); cx.globalCompositeOperation = 'source-over'; }
  // Spieler
  let px = (tall ? 50 : 70) + A.pX, py = pPY + 10;
  if (A.pShake > 0) { A.pShake -= dt; px += Math.sin(A.t * 60) * 5; }
  if (A.pLunge > 0) { A.pLunge = Math.max(0, A.pLunge - dt * 3.5); px += Math.sin(A.pLunge * Math.PI) * 50; py -= Math.sin(A.pLunge * Math.PI) * 16; }
  if (imgOk('held')) {
    const im = IMG.held, ps = tall ? 3.3 : 2.5; const bob = Math.sin(A.t * 2.4) * 1.5;
    cx.fillStyle = 'rgba(0,0,0,0.35)'; cx.beginPath(); cx.ellipse(px + im.width * ps / 2, py - 4, 44, 8, 0, 0, 7); cx.fill();
    cx.drawImage(im, Math.round(px), Math.round(py - im.height * ps + bob), im.width * ps, im.height * ps);
    if (A.pFlash > 0) { A.pFlash -= dt; if (!SPR.heroWhite) SPR.heroWhite = tintSprite(im, 'white'); cx.globalAlpha = clamp(A.pFlash * 4, 0, 0.8); cx.drawImage(SPR.heroWhite, Math.round(px), Math.round(py - im.height * ps + bob), im.width * ps, im.height * ps); cx.globalAlpha = 1; }
    if (C.p.def) { cx.strokeStyle = 'rgba(95,225,255,' + (0.5 + 0.3 * Math.sin(A.t * 8)).toFixed(2) + ')'; cx.lineWidth = 3; cx.beginPath(); cx.arc(px + im.width * ps / 2, py - im.height * ps / 2, im.height * ps * 0.6, -1.2, 1.2); cx.stroke(); }
  }
  // Tönung
  cx.globalCompositeOperation = 'multiply'; cx.fillStyle = P.cave ? '#8a7e78' : mixHex(sky.mul, '#ffffff', 0.35); cx.fillRect(-6, -6, CW + 12, CH + 12); cx.globalCompositeOperation = 'source-over';
  // Partikel
  for (let i = CBP.length - 1; i >= 0; i--) {
    const p = CBP[i]; p.life -= dt; if (p.life <= 0) { CBP.splice(i, 1); continue; }
    if (p.slash) { const sy2 = mapY(p.y, 'e'); cx.strokeStyle = 'rgba(255,255,255,' + (p.life * 4).toFixed(2) + ')'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(p.x - 40, sy2 - 30); cx.lineTo(p.x + 40, sy2 + 30); cx.stroke(); cx.lineWidth = 2; cx.beginPath(); cx.moveTo(p.x - 30, sy2 - 36); cx.lineTo(p.x + 46, sy2 + 20); cx.stroke(); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt * (p.plus ? 0 : 1); const yy = mapY(p.y, p.x > 240 ? 'e' : 'p');
    cx.globalAlpha = clamp(p.life * 2.5, 0, 1); cx.fillStyle = p.c;
    if (p.plus) { cx.fillRect(p.x - 2, yy, 5, 1); cx.fillRect(p.x, yy - 2, 1, 5); } else cx.fillRect(Math.round(p.x), Math.round(yy), p.s, p.s);
    cx.globalAlpha = 1;
  }
  // Schadenszahlen
  for (let i = A.nums.length - 1; i >= 0; i--) {
    const n = A.nums[i]; n.life -= dt; if (n.life <= 0) { A.nums.splice(i, 1); continue; } n.y -= dt * 30;
    cx.font = (n.big ? '22px' : '16px') + ' Silkscreen, monospace'; cx.textAlign = 'center'; cx.lineWidth = 4; cx.strokeStyle = '#000'; cx.globalAlpha = clamp(n.life * 2, 0, 1);
    const sc2 = n.big ? 1 + Math.max(0, n.life - 1) * 1.5 : 1; cx.save(); cx.translate(n.x, mapY(n.y, n.x > 240 ? 'e' : 'p') - (n.x < 240 && tall ? 40 : 0)); cx.scale(sc2, sc2); cx.strokeText(n.t, 0, 0); cx.fillStyle = n.c; cx.fillText(n.t, 0, 0); cx.restore(); cx.globalAlpha = 1;
  }
  if (WEATHER[G.weather].rain && !P.cave) { cx.strokeStyle = 'rgba(170,190,230,0.35)'; for (let i = 0; i < 30; i++) { const x = (i * 53 + A.t * 300) % (CW + 40) - 20, y = (i * 97 + A.t * 600) % CH; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 3, y + 10); cx.stroke(); } }
  const v = cx.createRadialGradient(CW / 2, CH / 2, CH * 0.4, CW / 2, CH / 2, CH); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); cx.fillStyle = v; cx.fillRect(-6, -6, CW + 12, CH + 12);
  cx.restore();
}
// ═══════════════ ENDE ═══════════════
function showEnding() {
  if (G.ended) return;
  showModal({
    title: '🚀 DIE RAKETE', cls: 'gold', textCls: 'arkon', type: 1,
    text: 'PROMETHEUS verstummt. Das Labor flackert.\n\nIn der Mitte der Halle: die Rakete. Silbern. Riesig. Du setzt die drei Teile ein. Ein Knopf leuchtet rot.\n\nDr. Marsh tritt aus dem Schatten.\n„Wenn du ihn drückst, öffnet sich die Kuppel. Du wirst sehen, was draußen ist. Aber der Wald… stirbt mit dem Experiment."\n\nWas tust du?',
    choices: [{ t: '🔴 KNOPF DRÜCKEN', cls: 'red', fn: () => ending('knopf') }, { t: '🌲 NICHT DRÜCKEN', fn: () => ending('bleiben') }],
  });
}
function ending(k) {
  G.ended = true; if (!M.endings.includes(k)) M.endings.push(k); saveMeta(); checkAch(); SFX.play('discover');
  const txt = k === 'knopf'
    ? 'Ein Donnern. Feuer. Die Rakete steigt – und durchbricht den Himmel wie Glas.\n\nScherben aus Licht regnen herab. Dahinter: Sterne. ECHTE Sterne. Und eine Stadt, kilometerweit entfernt.\n\nDie Kuppel ist offen. Das Experiment ist vorbei.\n\nDu bist frei, Subjekt #247.\n\n— ENDE A: DURCH DIE TÜR —'
    : 'Du lässt die Hand sinken.\n\nDr. Marsh nickt langsam. „Dann schützen wir ihn. Zusammen. Vor Voss. Vor allen."\n\nDraußen singen die Vögel. Echte oder simulierte – es ist dir egal. Der Wald ist dein Zuhause.\n\n— ENDE B: HÜTER DES WALDES —';
  showModal({ title: k === 'knopf' ? '🌌 FREIHEIT' : '🌲 ZUHAUSE', cls: 'gold', text: txt, textCls: 'note', type: 1,
    html: '<div class="dstats" style="max-width:none">' + [['TAGE', G.day], ['LEVEL', G.lv], ['SIEGE', G.stats.wins], ['PUNKTE', fmt(score())]].map(([a, b]) => '<div class="dstat" style="background:#0f140a;border-color:#3a4a1a"><div class="k">' + a + '</div><div class="v" style="color:var(--a)">' + b + '</div></div>').join('') + '</div>',
    choices: [{ t: '📤 TEILEN', cls: 'gold', fn: () => shareResult('win') }, { t: '♾ NEUER ZYKLUS (NG+)', cls: 'blue', fn: () => { M.cycle = (M.cycle || 0) + 1; saveMeta(); const n = G.name, hc = G.hardcore; newGame(n, hc); afterStart(); } }, { t: '🌲 WEITERSPIELEN', cls: 'ghost' }] });
  const b = M.best; const sc = score(); if (sc > (b.score || 0)) M.best = { score: sc, day: G.day }; saveMeta();
}
