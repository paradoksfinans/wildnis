// ═══════════════ SPIELLOGIK ═══════════════
let inCombat = false, warned = {};
function startBusy(kind, id, label, secs, done) {
  if (G.busy || inCombat || G.night) return false;
  G.busy = { kind, id, label, t: 0, max: secs }; G._done = done; markDirty(); updateHUD(); return true;
}
function finishBusy() { const d = G._done; G.busy = null; G._done = null; markDirty(); if (d) d(); }
function rollLoot(table, luck = 0) {
  const got = {};
  table.forEach(([k, a, b, c]) => { if (Math.random() < Math.min(1, c * (1 + luck))) got[k] = (got[k] || 0) + rint(a, b); });
  return got;
}
function giveLoot(got, src) {
  const parts = [];
  for (const k in got) {
    const n = k === 'coins' ? got[k] : addItem(k, got[k], true);
    if (n > 0) { parts.push((k === 'coins' ? '🪙' : ITEMS[k].i) + ' +' + n); if (k !== 'coins') G.stats.gathered += n; }
  }
  if (parts.length) { floater(parts.slice(0, 3).join('  '), '#c8ff80'); addLog((src ? src + ': ' : '') + parts.join(', '), 'good'); }
  const over = Object.keys(got).some(k => k !== 'coins' && ITEMS[k].w > 0 && invWeight() + ITEMS[k].w > invCap());
  if (over) toast('🎒', 'TASCHE FAST VOLL', 'Wirf etwas weg oder lagere Vorräte ein.', 'bad');
  return parts;
}
// ─── Sammeln ───
function doGather(id) {
  const hx = HEXES[G.hex], b = BIOMES[hx.b], a = GATHER[id];
  if (!a || !b.gather.includes(id) || G.busy) return;
  if (a.need && !has(a.need)) { toast('🔒', 'WERKZEUG FEHLT', 'Benötigt: ' + ITEMS[a.need].n, 'bad'); SFX.play('bad'); return; }
  if (a.en > 0 && G.en < a.en) { toast('⚡', 'ZU ERSCHÖPFT', 'Ruh dich aus oder schlafe.', 'bad'); SFX.play('bad'); return; }
  if (a.hunt && hx.safe) { toast('🕊️', 'FRIEDLICH', 'Hier gibt es nichts zu jagen.'); return; }
  SFX.play('click');
  startBusy('gather', id, a.i + ' ' + a.n.toUpperCase(), actTime(a), () => {
    G.en = clamp(G.en - a.en, 0, 100);
    if (a.rest) { G.hp = Math.min(maxHP(), G.hp + maxHP() * 0.05); floater('+' + (-a.en) + ' ⚡', '#5fe1ff'); addLog('Du ruhst dich aus.', ''); G.min += 30; return; }
    if (a.hunt) { const e = pickEnemy(G.hex); if (e) startCombat(e.id, { lv: e.lv }); return; }
    SFX.play(a.sfx || 'gather');
    let got;
    if (a.loot === 'water') { got = { [b.water === 'clean' ? 'wasser' : 'schmutzwasser']: 2 }; G.stats.got_wasser = (G.stats.got_wasser || 0) + 1; }
    else if (a.loot === 'loot') got = rollLoot(LOOT_TABLES[b.loot || 'dorf'], ST().luck);
    else { got = rollLoot(a.loot, ST().luck); if (id === 'aeste' && has('steinaxt')) got.aeste = (got.aeste || 0) + 1; }
    if (hx.b === 'eis' && id === 'steine' && chance(0.2)) got.kristall = 1;
    if (hx.b === 'hoehle' && id === 'pilze') got.pilze = (got.pilze || 0) + 1;
    if (!Object.keys(got).length) { floater('Nichts gefunden…', '#8a9a80'); addLog(a.n + ': nichts gefunden.', ''); }
    else giveLoot(got);
    gainXP(a.xp + Math.floor(hx.lv / 3), true);
    // Zufallsbegegnung
    let enc = hx.safe ? 0 : 0.035 + hx.lv * 0.006 + (isNight() ? 0.06 : 0) - (G.inv.fackel && isNight() ? 0.04 : 0) - (atCamp() && G.bld.palisade ? 0.03 : 0);
    if (G.day <= 1 && G.min < 900) enc *= 0.3;
    if (chance(enc)) { const e = pickEnemy(G.hex); if (e) setTimeout(() => startCombat(e.id, { lv: e.lv, ambush: true }), 350); }
  });
}
function pickEnemy(hexId) {
  const hx = HEXES[hexId], b = BIOMES[hx.b];
  const lvBase = hx.lv + Math.floor((G.day - 1) / 5);
  const opts = b.enemies.filter(([id]) => (EMIN[id] || 1) <= Math.max(lvBase, G.lv));
  if (!opts.length) return null;
  const id = wpick(opts); const lv = clamp(lvBase + rint(-1, 1), 1, 60);
  return { id, lv: Math.max(1, Math.min(lv, G.lv + 3 + Math.floor(hx.lv / 4))) };
}
// ─── Herstellen ───
function doCraft(rid) {
  const r = RECIPES.find(x => x.id === rid); if (!r || G.busy) return;
  if (r.bp && !G.bp.includes(r.bp)) return;
  if (!stationOk(r.st)) { toast('🔒', 'STATION FEHLT', stationReason(r.st), 'bad'); SFX.play('bad'); return; }
  if (!hasAll(r.in)) { const miss = Object.keys(r.in).filter(k => (G.inv[k] || 0) < r.in[k]).map(k => ITEMS[k].n + ' ' + (G.inv[k] || 0) + '/' + r.in[k]); toast('📦', 'MATERIAL FEHLT', miss.join(', '), 'bad'); SFX.play('bad'); return; }
  const out = r.g ? GEAR[r.g] : ITEMS[r.o];
  take(r.in); SFX.play('click');
  startBusy('craft', rid, '🔨 ' + out.n.toUpperCase(), Math.max(2, Math.round(r.t * (1 - G.attr.int * 0.008))), () => {
    SFX.play(r.st === 'feuer' ? 'fire' : 'craft');
    G.stats.crafted++; G.stats['craft_' + (r.o || r.g)] = (G.stats['craft_' + (r.o || r.g)] || 0) + 1;
    if ((r.st === 'feuer' || r.st === 'gestell') && ITEMS[r.o] && ITEMS[r.o].c === 'food') G.stats.cooked++;
    if (r.g) { addGear(r.g); }
    else {
      let n = r.n || 1; const bonus = ITEMS[r.o].c !== 'tool' && chance(G.attr.int * 0.012);
      if (bonus) n += Math.max(1, Math.floor(n / 2));
      const got = addItem(r.o, n, true); floater(out.i + ' +' + got + (bonus ? ' ✨' : ''), bonus ? '#ffc44d' : '#c8ff80');
      addLog('Hergestellt: ' + out.n + ' ×' + got + (bonus ? ' (Bonus durch Verstand!)' : ''), 'good');
    }
    gainXP(3 + (out.r || 0) * 4 + Math.floor(r.t / 3), true);
  });
}
// ─── Bauen ───
function doBuild(k) {
  const B = BUILD[k], lv = G.bld[k] || 0; if (lv >= B.max || G.busy) return;
  if (B.req && !B.req.every(r => G.bld[r])) { toast('🔒', 'VORAUSSETZUNG', 'Benötigt: ' + B.req.map(r => BUILD[r].n).join(', '), 'bad'); return; }
  const first = k === 'unterschlupf' && G.camp === null;
  if (!first && !atCamp()) { toast('🏕', 'NICHT IM LAGER', 'Reise zu deinem Lager: ' + HEXES[G.camp].n, 'bad'); return; }
  const cost = B.lv[lv];
  if (!hasAll(cost)) { const miss = Object.keys(cost).filter(c => (G.inv[c] || 0) < cost[c]).map(c => ITEMS[c].n + ' ' + (G.inv[c] || 0) + '/' + cost[c]); toast('📦', 'MATERIAL FEHLT', miss.join(', '), 'bad'); SFX.play('bad'); return; }
  const go = () => {
    take(cost);
    startBusy('build', k, '🏗️ ' + B.n.toUpperCase(), 6 + lv * 3, () => {
      if (first) { G.camp = G.hex; G.shelter = BIOMES[HEXES[G.hex].b].shelter; addLog('🏕 Lager aufgeschlagen: ' + HEXES[G.hex].n, 'disc'); }
      G.bld[k] = lv + 1; SFX.play('build'); vibrate(60);
      if (k === 'lagerfeuer') { G.fire = 360; SFX.play('fire'); }
      if (BUILD[k].prod && !G.prod[k]) G.prod[k] = { acc: 0, stock: 0 };
      toast(B.i, B.n.toUpperCase() + (B.max > 1 ? ' STUFE ' + (lv + 1) : ' GEBAUT'), B.d, 'gold');
      addLog('🏗️ ' + B.n + (B.max > 1 ? ' Stufe ' + (lv + 1) : '') + ' gebaut.', 'disc');
      gainXP(12 + lv * 10 + Object.keys(G.bld).length * 2, true);
      if (k === 'funkgeraet') setTimeout(radioDecode, 900);
    });
  };
  if (first) showModal({ title: '🏕 LAGER HIER AUFSCHLAGEN?', text: 'Dein Lager wird in „' + HEXES[G.hex].n + '" stehen (' + SHELTER_N[BIOMES[HEXES[G.hex].b].shelter] + ').\n\nAlle Gebäude werden hier errichtet. Der Ort kann später nicht verlegt werden.', choices: [{ t: '✓ HIER BAUEN', fn: go }, { t: 'ABBRECHEN', cls: 'ghost' }] });
  else go();
}
function doFuel(k) {
  if (!atCamp() || !G.bld.lagerfeuer || G.fire <= 0) return;
  const add = { aeste: [3, 90], holz: [1, 150], kohle: [1, 210] }[k]; if (!add || !has(k, add[0])) return;
  take({ [k]: add[0] }); G.fire = Math.min(900, G.fire + add[1]); SFX.play('fire'); floater('🔥 +' + Math.round(add[1] / 60 * 10) / 10 + ' min', '#ff9a3c'); markDirty();
}
function doIgnite() {
  if (!atCamp() || !G.bld.lagerfeuer || G.fire > 0) return;
  if (!has('aeste', 3) || !has('feuerstein')) { toast('🔥', 'NICHT MÖGLICH', '3 Äste + Feuerstein nötig.', 'bad'); return; }
  take({ aeste: 3 }); if (chance(0.35)) { take({ feuerstein: 1 }); addLog('Der Feuerstein ist abgenutzt.', 'bad'); }
  G.fire = 240; SFX.play('fire'); toast('🔥', 'FEUER BRENNT', 'Halte es mit Holz am Leben.'); markDirty();
}
function doHarvest(k) {
  const p = G.prod[k], B = BUILD[k]; if (!p || !atCamp()) return; const n = Math.floor(p.stock); if (n <= 0) return;
  const got = { [B.prod.it]: n }; if (B.prod.extra) { let e = 0; for (let i = 0; i < n; i++) if (chance(0.5)) e++; if (e) got[B.prod.extra] = e; }
  if (k === 'fallen' && chance(0.2)) got.knochen = 1;
  p.stock -= n; giveLoot(got, B.n); SFX.play('gather'); markDirty();
}
// ─── Reisen ───
function doTravel(id) {
  if (G.busy) return; const to = HEXES[id]; if (!hexNeighbors(G.hex).includes(id)) return;
  if (to.hidden && !(G.inv.raketenteil1 && G.inv.raketenteil2 && G.inv.raketenteil3)) { toast('🔒', 'ZUGANG VERWEIGERT', 'ARKON-Sicherheitstor. 3 Raketenteile nötig.', 'bad'); return; }
  const en = travelEn(id); if (G.en < en) { toast('⚡', 'ZU ERSCHÖPFT', 'Ruh dich erst aus.', 'bad'); return; }
  const known = G.seen.includes(id);
  if (!known && to.lv > G.lv + 4 && !G._warnTravel) { G._warnTravel = id; showModal({ title: '⚠ GEFÄHRLICHES GEBIET', cls: 'danger', text: to.n.startsWith('ARKON') ? 'Hier endet alles.' : 'Dieses Gebiet ist sehr gefährlich (Level ' + to.lv + '). Bist du sicher?', choices: [{ t: 'TROTZDEM GEHEN', cls: 'red', fn: () => doTravel(id) }, { t: 'LIEBER NICHT', cls: 'ghost', fn: () => { G._warnTravel = null; } }] }); return; }
  G._warnTravel = null;
  SFX.play('step');
  startBusy('travel', id, (known ? '🚶 REISE: ' : '🔍 ERKUNDE: ') + (known ? to.n.toUpperCase() : '???'), travelTime(id), () => {
    G.en = clamp(G.en - en, 0, 100); G.hex = id; G.stats.travels++; mapSel = null; G.min += known ? 20 : 45;
    if (!known) {
      G.seen.push(id); SFX.play('discover'); vibrate(40);
      toast('🗺️', 'NEUES GEBIET: ' + to.n.toUpperCase(), to.d, 'gold'); addLog('🗺️ Entdeckt: ' + to.n, 'disc');
      gainXP(15 + to.lv * 4, true);
      if (to.secret && !G.secrets.includes(to.secret)) setTimeout(() => revealSecret(to.secret), 1200);
      if (to.trader) setTimeout(() => showModal({ title: '🧕 EINE MENSCHENSTIMME!', text: '„Na sieh mal einer an. Noch ein Verirrter."\n\nEine alte Frau mit wachen Augen mustert dich.\n\n„Ich bin Mira. Ich handle mit allem, was der Wald hergibt. Komm wieder, wenn du was zu tauschen hast."', textCls: 'note', type: 1 }), 2200);
      if (to.boss && !G.bossDown[to.boss]) setTimeout(() => toast('☠️', 'GEFAHR', 'Hier haust ' + ENEMIES[to.boss].n + '…', 'bad'), 1800);
    } else addLog('Angekommen: ' + to.n, '');
    if (G.hex === G.camp) addLog('🏕 Zurück im Lager.', 'good');
    let amb = to.safe ? 0 : 0.1 + to.lv * 0.008 + (isNight() ? 0.1 : 0) - (G.inv.kompass ? 0.06 : 0) - (G.inv.fackel && isNight() ? 0.05 : 0);
    if (G.day <= 1) amb *= 0.3;
    if (chance(amb)) { const e = pickEnemy(id); if (e) setTimeout(() => startCombat(e.id, { lv: e.lv, ambush: true }), 700); }
    if (to.boss === 'prometheus' && !G.bossDown.prometheus) setTimeout(() => startBossIntro('prometheus'), 1500);
  });
}
function revealSecret(s) {
  if (G.secrets.includes(s)) return; G.secrets.push(s); const S = SECRETS[s];
  SFX.play(S.k === 'arkon' ? 'arkon' : 'discover'); gainXP(20, true); addLog('🔎 ' + S.t, S.k === 'arkon' ? 'arkon' : 'disc');
  showModal({ title: (S.k === 'note' ? '📓 ' : S.k === 'arkon' ? '📡 ' : '🔎 ') + S.t, text: S.x, textCls: S.k === 'arkon' ? 'arkon' : 'note', type: 1, choices: [{ t: 'WEITER' }] });
  markDirty();
}
function radioDecode() {
  if (!G.bld.funkgeraet) return;
  const need = G.radio === 0 ? true : G.radio === 1 ? G.bossDown.grimmzahn || G.lv >= 12 : G.bossDown.w7;
  if (G.radio >= 3) { showModal({ title: '📡 FUNKGERÄT', text: 'Nur noch Rauschen. Alle Signale sind entschlüsselt.', textCls: 'arkon' }); return; }
  if (!need) { showModal({ title: '📡 FUNKGERÄT', text: '[RAUSCHEN]\n\nDas nächste Signal ist zu schwach. Vielleicht später… wenn du tiefer in ARKONs Gebiet vorgedrungen bist.', textCls: 'arkon' }); return; }
  const r = RADIO[G.radio]; G.radio++; SFX.play('arkon'); gainXP(40, true);
  showModal({ title: '📡 ' + r.t, text: r.x, textCls: 'arkon', type: 1 }); markDirty();
}
// ─── Verbrauchen ───
function doUse(k) {
  const it = ITEMS[k]; if (!it || !has(k)) return;
  if (it.c === 'food' && it.eat) {
    const e = it.eat; take({ [k]: 1 });
    if (e.hu) G.hu = clamp(G.hu + e.hu, 0, 100); if (e.du) G.du = clamp(G.du + e.du, 0, 100); if (e.hp) G.hp = Math.min(maxHP(), G.hp + e.hp * ST().pot); if (e.en) G.en = clamp(G.en + e.en, 0, 100); if (e.wa) G.wa = clamp(G.wa + e.wa, 0, 100);
    G.stats.ate++; SFX.play(k.includes('wasser') || k === 'tee' ? 'water' : 'eat');
    floater(it.i + ' ' + [e.hu && '🍖+' + e.hu, e.du && '💧+' + e.du, e.hp && '❤+' + e.hp].filter(Boolean).join(' '), '#c8ff80');
    if (it.risk && chance(it.risk * (1 - G.attr.int * 0.02))) { G.sick = 90; G.stats.sick++; toast('🤢', 'DIR WIRD ÜBEL', it.n + ' war keine gute Idee. Du bist krank! (Tee oder Gegengift helfen)', 'bad'); addLog('🤢 Krank durch ' + it.n, 'bad'); SFX.play('hurt'); }
    if (k === 'tee' && G.sick > 0) G.sick = Math.max(0, G.sick - 45);
  } else if (it.c === 'med') {
    if (!it.heal && !it.en && !it.cure) { toast('⚔️', 'NUR IM KAMPF', it.n + ' wirkt nur im Kampf.'); return; }
    take({ [k]: 1 });
    if (it.heal) { const h = Math.round(it.heal * ST().pot); G.hp = Math.min(maxHP(), G.hp + h); floater('❤ +' + h, '#7ae05a'); }
    if (it.en) G.en = clamp(G.en + it.en, 0, 100);
    if (it.cure && it.cure.includes('krank')) G.sick = 0;
    SFX.play('heal');
  } else return;
  markDirty(); updateHUD();
}
function askQty(title, max, cb, label = 'BESTÄTIGEN') {
  showModal({
    title, html: '<div class="qty"><button class="mini" data-q="-10">-10</button><button class="mini" data-q="-1">−</button><input id="qtyin" type="number" min="1" max="' + max + '" value="1"><button class="mini" data-q="1">+</button><button class="mini" data-q="10">+10</button></div><div class="btnrow" style="margin-top:0;margin-bottom:10px"><button class="mini" data-q="set1" style="flex:1">1</button><button class="mini" data-q="half" style="flex:1">HÄLFTE</button><button class="mini" data-q="max" style="flex:1">ALLE (' + max + ')</button></div>',
    choices: [{ t: label, cls: 'red', fn: () => { const v = clamp(parseInt($('qtyin').value) || 0, 0, max); if (v > 0) cb(v); } }, { t: 'ABBRECHEN', cls: 'ghost' }],
    onOpen: b => { b.querySelectorAll('[data-q]').forEach(btn => btn.addEventListener('click', ev => { ev.stopPropagation(); const i = $('qtyin'); let v = parseInt(i.value) || 0; const q = btn.dataset.q; v = q === 'max' ? max : q === 'half' ? Math.ceil(max / 2) : q === 'set1' ? 1 : v + parseInt(q); i.value = clamp(v, 1, max); SFX.play('click'); })); }
  });
}
function doDrop(k) { const n = G.inv[k] || 0; if (!n) return; askQty('🗑 ' + ITEMS[k].i + ' ' + ITEMS[k].n + ' WEGWERFEN', n, v => { take({ [k]: v }); addLog('🗑 ' + v + '× ' + ITEMS[k].n + ' weggeworfen.', ''); toast('🗑', 'WEGGEWORFEN', v + '× ' + ITEMS[k].n); }, '🗑 WEGWERFEN'); }
function itemDetail(k) {
  const it = ITEMS[k]; if (!it) return; const ch = [];
  if (it.eat || (it.c === 'med' && (it.heal || it.en))) ch.push({ t: it.c === 'food' ? '🍽 ESSEN / TRINKEN' : '💊 BENUTZEN', fn: () => doUse(k) });
  if (atCamp() && G.bld.vorratskiste && it.c !== 'quest' && it.c !== 'tool') ch.push({ t: '📦 EINLAGERN', cls: 'blue', fn: () => askQty('📦 EINLAGERN', G.inv[k], v => storeIn(k, v), 'EINLAGERN') });
  if (it.c !== 'quest') ch.push({ t: '🗑 WEGWERFEN', cls: 'red', fn: () => doDrop(k) });
  ch.push({ t: 'SCHLIESSEN', cls: 'ghost' });
  const fx = []; if (it.eat) { const e = it.eat; if (e.hu) fx.push('🍖 +' + e.hu); if (e.du) fx.push('💧 +' + e.du); if (e.hp) fx.push('❤ +' + e.hp); if (e.en) fx.push('⚡ +' + e.en); if (e.wa) fx.push('🔥 +' + e.wa); if (it.risk) fx.push('⚠ ' + Math.round(it.risk * 100) + '% Übelkeit'); }
  if (it.heal) fx.push('❤ +' + it.heal); if (it.dmg) fx.push('💥 ' + it.dmg + ' Schaden'); if (it.cap) fx.push('🎒 +' + it.cap);
  showModal({ title: it.i + ' <span class="rar' + it.r + '">' + it.n + '</span>', html: '<div class="mx">' + esc(it.d) + '</div><div class="cost" style="margin:-4px 0 12px">' + [CAT_N[it.c], RAR_N[it.r], 'Wert ' + it.v + '🪙', 'Besitz ×' + (G.inv[k] || 0)].concat(fx).map(t => '<span class="pill">' + t + '</span>').join('') + '</div>', choices: ch });
}
function storeIn(k, v) {
  const free = storeCap() - storeCount(); v = Math.min(v, free, G.inv[k] || 0); if (v <= 0) { toast('📦', 'KISTE VOLL', '', 'bad'); return; }
  take({ [k]: v }); G.store[k] = (G.store[k] || 0) + v; markDirty();
}
function storeAll() { let n = 0; Object.keys(G.inv).forEach(k => { const it = ITEMS[k]; if (it && it.c === 'mat') { const free = storeCap() - storeCount(); const v = Math.min(G.inv[k], free); if (v > 0) { take({ [k]: v }); G.store[k] = (G.store[k] || 0) + v; n += v; } } }); toast('📦', 'EINGELAGERT', n + ' Materialien'); markDirty(); }
function unstore(k) { const n = G.store[k] || 0; if (!n) return; askQty('📦 ENTNEHMEN: ' + ITEMS[k].n, n, v => { const got = addItem(k, v); G.store[k] -= got; if (G.store[k] <= 0) delete G.store[k]; markDirty(); }, 'ENTNEHMEN'); }
// ─── Ausrüstung ───
function doEquip(uid) { const o = G.gear.find(x => x.uid === +uid); if (!o) return; const g = GEAR[o.id]; G.equip[g.slot] = o.uid; SFX.play('craft'); if (G.hp > maxHP()) G.hp = maxHP(); markDirty(); }
function doUnequip(uid) { for (const s in G.equip) if (G.equip[s] === +uid) G.equip[s] = null; if (G.hp > maxHP()) G.hp = maxHP(); SFX.play('click'); markDirty(); }
function doRepair(uid) {
  const o = G.gear.find(x => x.uid === +uid); if (!o || !atCamp() || !G.bld.werkbank) return; const c = repairCost(o);
  if (!hasAll(c.req)) { toast('🔧', 'MATERIAL FEHLT', 'Benötigt: ' + c.txt, 'bad'); return; }
  take(c.req); o.dur = GEAR[o.id].dur; SFX.play('craft'); toast('🔧', 'REPARIERT', GEAR[o.id].n); markDirty();
}
function doScrap(uid) {
  const o = G.gear.find(x => x.uid === +uid); if (!o) return; const g = GEAR[o.id];
  showModal({ title: '♻ ' + g.n + ' ZERLEGEN?', text: 'Du erhältst einen Teil der Materialien zurück.', choices: [{ t: '♻ ZERLEGEN', cls: 'red', fn: () => {
    const r = RECIPES.find(x => x.g === o.id); G.gear = G.gear.filter(x => x.uid !== o.uid);
    if (r) { const got = {}; for (const k in r.in) { const n = Math.floor(r.in[k] * 0.5); if (n > 0) got[k] = n; } giveLoot(got, 'Zerlegt'); } else { addItem('coins', Math.round(g.v / 3)); }
    markDirty();
  } }, { t: 'ABBRECHEN', cls: 'ghost' }] });
}
function doAttr(k) { if (G.pts <= 0) return; G.pts--; G.attr[k]++; if (k === 'vit') G.hp += 9; SFX.play('buff'); markDirty(); }
function doSkill(k) {
  if (G.lv < SKILLS[k].lv) return; const i = G.eqSkills.indexOf(k);
  if (i >= 0) { if (G.eqSkills.length > 1) G.eqSkills.splice(i, 1); }
  else { if (G.eqSkills.length >= 3) G.eqSkills.shift(); G.eqSkills.push(k); }
  SFX.play('click'); markDirty();
}
function doTrain(k) {
  if (!G.bld.trainingsplatz || !atCamp() || G.busy) return;
  if (G.en < 20 || G.hu < 8) { toast('⚡', 'ZU ERSCHÖPFT', 'Training braucht ⚡20 Energie und etwas im Magen.', 'bad'); return; }
  startBusy('train', k, '🎯 TRAINING', 10, () => {
    G.en -= 20; G.hu -= 6; G.train[k] = (G.train[k] || 0) + 1; G.stats.trained++; G.min += 40;
    gainXP(8 + G.lv * 2); SFX.play('buff');
    if (G.train[k] >= 5) { G.train[k] = 0; G.attr[k]++; toast('💪', 'ATTRIBUT GESTEIGERT', { str: 'Stärke', vit: 'Vitalität', agi: 'Geschick', int: 'Verstand' }[k] + ' +1!', 'gold'); SFX.play('levelup'); }
  });
}
// ─── Handel ───
function refreshTrader() {
  if (G.trader.day === G.day) return;
  const pool = [...TRADE_POOL].sort(() => Math.random() - 0.5).slice(0, 10);
  const gearPool = TRADE_GEAR.filter((g, i) => i < 4 + Math.floor(G.lv / 4));
  G.trader = { day: G.day, stock: pool.map(([k, p, n]) => ({ k, p: Math.round(p * (1 + G.day * 0.01)), n })), gear: [pick(gearPool), pick(gearPool)].filter((v, i, a) => a.indexOf(v) === i).map(id => ({ id, p: Math.round(GEAR[id].v * 1.4) })) };
}
let tradeTab = 'buy';
function openTrade() { refreshTrader(); tradeTab = 'buy'; showModal({ title: '🧕 MIRAS LADEN', cls: 'gold', html: '<div id="tradebox"></div>', choices: [{ t: 'AUF WIEDERSEHEN', cls: 'ghost' }], onOpen: () => renderTrade() }); }
function renderTrade() {
  const box = $('tradebox'); if (!box) return;
  let h = '<div class="sub">„Was darf\'s sein?" · Du hast <b style="color:var(--a)">🪙 ' + fmt(G.coins) + '</b></div><div class="subtabs"><button class="stab' + (tradeTab === 'buy' ? ' on' : '') + '" data-a="ttab" data-id="buy">KAUFEN</button><button class="stab' + (tradeTab === 'sell' ? ' on' : '') + '" data-a="ttab" data-id="sell">VERKAUFEN</button></div>';
  if (tradeTab === 'buy') {
    G.trader.stock.forEach((s, i) => { const it = ITEMS[s.k]; h += '<div class="row"><span style="font-size:18px">' + it.i + '</span><div class="rn"><div class="t rar' + it.r + '">' + it.n + '</div><div class="d">Vorrat ' + s.n + '</div></div><button class="mini g" data-a="buy" data-id="' + i + '"' + (s.n > 0 && G.coins >= s.p ? '' : ' disabled') + '>🪙 ' + s.p + '</button></div>'; });
    G.trader.gear.forEach((s, i) => { const g = GEAR[s.id]; h += '<div class="row bord' + g.r + '"><span style="font-size:18px">' + g.i + '</span><div class="rn"><div class="t rar' + g.r + '">' + g.n + '</div><div class="d">' + gearStats(g) + '</div></div><button class="mini g" data-a="buyg" data-id="' + i + '"' + (s.p && G.coins >= s.p ? '' : ' disabled') + '>' + (s.p ? '🪙 ' + s.p : 'VERKAUFT') + '</button></div>'; });
  } else {
    const keys = Object.keys(G.inv).filter(k => G.inv[k] > 0 && ITEMS[k] && ITEMS[k].c !== 'quest' && ITEMS[k].v > 0);
    if (!keys.length) h += '<div class="empty">Nichts zu verkaufen.</div>';
    keys.forEach(k => { const it = ITEMS[k], p = Math.max(1, Math.floor(it.v * 0.5)); h += '<div class="row"><span style="font-size:18px">' + it.i + '</span><div class="rn"><div class="t">' + it.n + ' ×' + G.inv[k] + '</div></div><button class="mini" data-a="sell" data-id="' + k + '">+🪙 ' + p + '</button><button class="mini" data-a="sellall" data-id="' + k + '">ALLE</button></div>'; });
    G.gear.filter(o => !Object.values(G.equip).includes(o.uid)).forEach(o => { const g = GEAR[o.id]; h += '<div class="row bord' + g.r + '"><span style="font-size:18px">' + g.i + '</span><div class="rn"><div class="t rar' + g.r + '">' + g.n + '</div></div><button class="mini" data-a="sellg" data-id="' + o.uid + '">+🪙 ' + Math.floor(g.v * 0.5) + '</button></div>'; });
  }
  box.innerHTML = h;
}
function tradeAct(a, id) {
  if (a === 'ttab') tradeTab = id;
  if (a === 'buy') { const s = G.trader.stock[+id]; if (s && s.n > 0 && G.coins >= s.p) { if (addItem(s.k, 1, true)) { G.coins -= s.p; s.n--; SFX.play('coin'); } else toast('🎒', 'TASCHE VOLL', '', 'bad'); } }
  if (a === 'buyg') { const s = G.trader.gear[+id]; if (s && s.p && G.coins >= s.p) { G.coins -= s.p; addGear(s.id); s.p = 0; SFX.play('coin'); } }
  if (a === 'sell' || a === 'sellall') { const it = ITEMS[id]; const n = a === 'sell' ? 1 : G.inv[id]; if (it && has(id, n)) { take({ [id]: n }); G.coins += Math.max(1, Math.floor(it.v * 0.5)) * n; SFX.play('coin'); } }
  if (a === 'sellg') { const o = G.gear.find(x => x.uid === +id); if (o) { G.gear = G.gear.filter(x => x !== o); G.coins += Math.floor(GEAR[o.id].v * 0.5); SFX.play('coin'); } }
  renderTrade(); markDirty();
}
// ═══════════════ TICK ═══════════════
let tickAcc = 0, saveAcc = 0, chkAcc = 0;
function rollWeather() {
  const si = seasonIdx(); const hx = HEXES[G.hex];
  const W = [[['klar', 3], ['wolkig', 3], ['regen', 3], ['gewitter', 1], ['nebel', 2]], [['klar', 6], ['wolkig', 2], ['regen', 1], ['gewitter', 2], ['nebel', 0.5]], [['klar', 2], ['wolkig', 3], ['regen', 4], ['gewitter', 1], ['nebel', 3]], [['klar', 2], ['wolkig', 3], ['schnee', 5], ['nebel', 2]]][si];
  let w = wpick(W); if (hx.b === 'eis' && chance(0.6)) w = 'schnee'; if (hx.b === 'hoehle') w = 'klar';
  if (w !== G.weather) { G.weather = w; addLog('Wetter: ' + WEATHER[w].i + ' ' + WEATHER[w].n, ''); if (w === 'gewitter') toast('⛈️', 'GEWITTER', 'Das Feuer brennt schneller ab!', 'bad'); }
  G.wTimer = rint(120, 260);
}
function tick(dt) {
  if (!G || G.dead || G.night || inCombat) return;
  G.played += dt;
  if (G.busy) { G.busy.t += dt; if (G.busy.t >= G.busy.max) finishBusy(); }
  if (!G || G.dead || G.night || inCombat) return;
  G.min += MIN_PER_SEC * dt;
  if (G.min >= NIGHT_AT) { if (!G.busy) { startNight(false); return; } }
  if (G.min >= 1200 && !warned['dusk' + G.day] && !atCamp()) { warned['dusk' + G.day] = 1; toast('🌆', 'ES WIRD DUNKEL', 'In einer Stunde bricht die Nacht herein. Kehre zum Lager zurück!', 'bad'); SFX.play('danger'); }
  const mh = maxHP(), si = seasonIdx(), W = WEATHER[G.weather];
  const sickM = G.sick > 0 ? 1.6 : 1;
  G.hu = clamp(G.hu - 0.05 * dt * sickM, 0, 100);
  G.du = clamp(G.du - 0.075 * dt * sickM * (si === 1 ? 1.3 : 1) * (HEXES[G.hex].b === 'eis' ? 0.8 : 1), 0, 100);
  G.en = clamp(G.en - 0.012 * dt, 0, 100);
  const ft = feltTemp();
  if (ft >= 14) G.wa = clamp(G.wa + Math.min(0.4, (ft - 14) * 0.03 + 0.1) * dt, 0, 100);
  else G.wa = clamp(G.wa - (14 - ft) * 0.011 * dt * (W.rain && !atCamp() ? 1.3 : 1), 0, 100);
  let dmg = 0;
  if (G.hu <= 0) dmg += mh * 0.0016; if (G.du <= 0) dmg += mh * 0.0024; if (G.wa < 20) dmg += mh * 0.0012 * (20 - G.wa) / 8; if (G.sick > 0) dmg += mh * 0.0006;
  if (dmg) G.hp -= dmg * dt;
  else if (G.hu > 30 && G.du > 30 && G.wa > 30) G.hp = Math.min(mh, G.hp + mh * (atCamp() && G.bld.unterschlupf ? 0.0028 : 0.0014) * dt);
  if (G.sick > 0) { G.sick -= dt; if (G.sick <= 0) { G.sick = 0; toast('😌', 'GENESEN', 'Dir geht es wieder besser.'); } }
  if (G.bld.lagerfeuer && G.fire > 0) { G.fire -= dt * (W.rain > 1 ? 2.4 : W.rain ? 1.7 : 1); if (G.fire <= 0) { G.fire = 0; if (atCamp()) { toast('🔥', 'FEUER ERLOSCHEN', 'Entfache es neu!', 'bad'); SFX.play('bad'); } addLog('🔥 Das Lagerfeuer ist erloschen.', 'bad'); markDirty(); } }
  for (const k in G.prod) { const P = BUILD[k].prod; const p = G.prod[k]; const cap = P.cap * (k === 'fallen' ? G.bld.fallen : 1); const every = (k === 'regenfaenger' && W.rain ? P.rain : P.every) / (k === 'fallen' ? G.bld.fallen : 1); p.acc += dt; if (p.acc >= every) { p.acc -= every; if (p.stock < cap) { p.stock++; if (atCamp() && TAB === 'act') markDirty(); } } }
  G.wTimer -= dt; if (G.wTimer <= 0) rollWeather();
  [['hu', '🍖', 'HUNGER'], ['du', '💧', 'DURST'], ['wa', '🥶', 'KÄLTE']].forEach(([k, i, n]) => { const key = 'low_' + k; const v = G[k]; if (v < 18 && !warned[key]) { warned[key] = 1; toast(i, n + '!', k === 'wa' ? 'Du frierst. Feuer, Kleidung oder Unterschlupf!' : 'Kritisch niedrig. ' + (k === 'du' ? 'Trink Wasser!' : 'Iss etwas!'), 'bad'); SFX.play('danger'); vibrate([30, 60, 30]); } if (v > 35) warned[key] = 0; });
  if (G.hp <= 0) { const c = G.du <= 0 ? 'durst' : G.hu <= 0 ? 'hunger' : G.wa < 20 ? 'kaelte' : 'krank'; die(c); return; }
  chkAcc += dt; if (chkAcc >= 2) { chkAcc = 0; checkQuest(); checkDaily(); checkAch(); }
  saveAcc += dt; if (saveAcc >= 12) { saveAcc = 0; saveGame(); }
}
// ═══════════════ NACHT ═══════════════
function startNight(manual) {
  if (G.night || G.dead) return;
  G.night = true; G.busy = null; G._done = null; markDirty();
  const mh = maxHP(), camp = atCamp(), lv = G.bld.unterschlupf || 0, hx = HEXES[G.hex];
  const lines = [];
  const outside = !camp || !lv;
  lines.push([outside ? '🌌 Du schläfst unter freiem Himmel in ' + hx.n + '.' : '⛺ Du schläfst in deinem ' + SHELTER_N[G.shelter] + '.', 'info']);
  G.hu = clamp(G.hu - 14, 0, 100); G.du = clamp(G.du - 16, 0, 100); lines.push(['🍖 Hunger −14 · 💧 Durst −16', 'warn']);
  // Feuer
  let fireNight = false;
  if (G.bld.lagerfeuer) { if (G.fire > 420) { G.fire -= 420; fireNight = camp; lines.push(['🔥 Das Feuer brannte die ganze Nacht.', 'good']); } else if (G.fire > 0) { G.fire = 0; lines.push(['🔥 Das Feuer erlosch mitten in der Nacht.', 'bad']); } }
  // Kälte
  const nt = season().t - 7 + BIOMES[hx.b].temp + WEATHER[G.weather].t; let felt = nt + ST().ins / 4 + (fireNight ? 10 : 0) + (camp && lv ? 2 + lv * 2 : 0);
  if (felt < 8) { const k = Math.round((8 - felt) * 1.6); G.wa = clamp(G.wa - k * 2, 0, 100); G.hp -= mh * k / 100; lines.push(['🥶 Bittere Kälte (' + Math.round(nt) + '°C): −' + Math.round(mh * k / 100) + ' Leben', 'bad']); }
  else { G.wa = clamp(G.wa + 20, 0, 100); lines.push(['🌡 Angenehm warm geschlafen.', 'good']); }
  // Erholung
  if (G.hu > 10 && G.du > 10) { const h = Math.round(mh * (outside ? 0.08 : 0.22 + lv * 0.06)); G.hp = Math.min(mh, G.hp + h); lines.push(['❤ Erholung: +' + h + ' Leben', 'good']); }
  else lines.push(['❤ Zu hungrig und durstig, um dich zu erholen.', 'bad']);
  G.en = outside ? 65 : 100; lines.push(['⚡ Energie: ' + G.en + '%', 'info']);
  if (G.sick > 0) { G.sick = Math.max(0, G.sick - 60); lines.push([G.sick ? '🤢 Immer noch krank…' : '😌 Die Übelkeit ist vorbei.', G.sick ? 'bad' : 'good']); }
  if (G.prod.fallen) { const c = rint(0, G.bld.fallen); G.prod.fallen.stock = Math.min(BUILD.fallen.prod.cap * G.bld.fallen, G.prod.fallen.stock + c); if (c) lines.push(['🪤 Die Fallen haben ' + c + ' Tier(e) gefangen.', 'good']); }
  // Überfall
  let raid = null;
  const rc = clamp(0.06 + G.day * 0.012 + hx.lv * 0.008 + (outside ? 0.18 : 0) - (fireNight ? 0.08 : 0), 0, 0.55);
  if (!hx.safe && G.day > 1 && chance(rc)) {
    const def = (outside ? 0 : PALISADE_DEF[G.bld.palisade || 0] + shelterProt() * 0.4) + (fireNight ? 15 : 0);
    if (rint(1, 100) <= def) { lines.push(['🛡 Etwas schlich ums Lager – deine Verteidigung hielt stand!', 'good']); gainXP(10, true); }
    else { const pool = G.day > 4 ? [['wolf', 3], ['bandit', 2], ['baer', G.day > 8 ? 1 : 0.01]] : [['wolf', 3], ['ratte', 2]]; raid = { id: wpick(pool), lv: clamp(hx.lv + Math.floor(G.day / 3), 1, G.lv + 3) }; lines.push(['⚠ ÜBERFALL! ' + ENEMIES[raid.id].n + ' greift an!', 'bad']); }
  } else lines.push(['🌙 Eine ruhige Nacht.', 'info']);
  const ov = $('night'); $('ntitle').textContent = 'TAG ' + G.day + ' → TAG ' + (G.day + 1); $('nmoon').textContent = raid ? '⚠️' : '🌙';
  const logEl = $('nightlog'); logEl.innerHTML = ''; ov.classList.add('show'); $('nightbtn').style.display = 'none';
  SFX.setMood('calm', 98);
  let i = 0; const next = () => {
    if (i < lines.length) { const d = document.createElement('div'); d.className = 'nl ' + lines[i][1]; d.textContent = lines[i][0]; logEl.appendChild(d); SFX.play(lines[i][1] === 'bad' ? 'bad' : 'type'); i++; setTimeout(next, 520); return; }
    const b = $('nightbtn'); b.style.display = 'block';
    if (raid) { b.textContent = '⚔️ VERTEIDIGE DICH!'; b.className = 'btn red'; b.dataset.raid = JSON.stringify(raid); }
    else { b.textContent = '☀️ AUFWACHEN · TAG ' + (G.day + 1); b.className = 'btn'; delete b.dataset.raid; }
    if (G.hp <= 0) { b.style.display = 'none'; setTimeout(() => { ov.classList.remove('show'); G.night = false; die('kaelte'); }, 1200); }
  };
  setTimeout(next, 700);
}
function wakeUp() {
  const b = $('nightbtn');
  if (b.dataset.raid) { const r = JSON.parse(b.dataset.raid); delete b.dataset.raid; $('night').classList.remove('show'); startCombat(r.id, { lv: r.lv, raid: true, onEnd: () => { G.night = true; finishWake(); } }); return; }
  finishWake();
}
function finishWake() {
  $('night').classList.remove('show');
  const oldSeason = seasonIdx();
  G.day++; G.min = DAY_START; G.night = false; warned = {};
  if (G.dead) return;
  const ns = seasonIdx();
  if (ns !== oldSeason) { const s = season(); toast(s.i, s.n + ' BEGINNT', ns === 3 ? 'Der Winter ist hart. Sorge für Feuer, Fell und Vorräte!' : ns === 1 ? 'Heiße Tage. Du wirst schneller durstig.' : ns === 2 ? 'Die Tage werden kälter.' : 'Die Natur erwacht.', ns === 3 ? 'bad' : 'gold'); if (oldSeason === 3) G.stats.winters++; }
  rollWeather(); newDaily(); refreshTrader();
  addLog('☀️ Tag ' + G.day + ' beginnt.', 'good');
  toast('☀️', 'TAG ' + G.day, '3 neue Tagesaufträge im Journal.', '');
  checkAch(); saveGame(); saveDawn(); markDirty();
}
function saveDawn() { if (G.hardcore) return; try { localStorage.setItem('wildnis3_dawn', JSON.stringify(G)); } catch (e) { } }
// ═══════════════ TOD ═══════════════
const DEATH = {
  hunger: ['VERHUNGERT', 'Dein Körper hat aufgegeben. Der Wald nimmt sich, was übrig bleibt.', 'Beeren, Pilze und gebratenes Fleisch halten dich am Leben. Baue Fallen!', 'a_death_hunger'],
  durst: ['VERDURSTET', 'Ohne Wasser hält niemand lange durch.', 'Der Klarbach liegt direkt östlich vom Wald. Ein Regenfänger hilft im Lager.', 'a_death_thirst'],
  kaelte: ['ERFROREN', 'Die Kälte kroch langsam in deine Knochen.', 'Halte das Lagerfeuer am Brennen und trage Fell. Nachts ist es am kältesten!', 'a_death_cold'],
  krank: ['DAHINGERAFFT', 'Krankheit und Schwäche waren zu viel.', 'Koche Fleisch und Wasser ab. Kräutertee heilt Übelkeit.', null],
  kampf: ['GETÖTET', 'Du hast deinen letzten Kampf verloren.', 'Verteidige dich, wenn Gegner zum großen Schlag ansetzen. Level aufsteigen hilft!', null],
};
function die(cause) {
  if (G.dead) return; G.dead = true; G.busy = null; inCombat = false; $('combat').classList.remove('show');
  const D = DEATH[cause] || DEATH.kampf; if (D[3]) unlockAch(D[3]);
  const sc = score(); const best = sc > (M.best.score || 0); if (best) M.best = { score: sc, day: G.day }; saveMeta();
  G.stats.deaths++; SFX.play('lose'); vibrate([100, 50, 200]); SFX.setMood('tense', 82);
  const hasDawn = !G.hardcore && (() => { try { return !!localStorage.getItem('wildnis3_dawn'); } catch (e) { return false; } })();
  if (G.hardcore) wipeSave(); else saveGame();
  const el = $('death');
  el.innerHTML = '<div style="font-size:50px">💀</div><div class="dt">' + D[0] + '</div><div class="dc">' + esc(G.name) + ' · ' + D[1] + '</div>' +
    '<div class="dstats">' + [['TAGE ÜBERLEBT', G.day], ['LEVEL', G.lv], ['KÄMPFE GEWONNEN', G.stats.wins], ['BOSSE', Object.keys(G.bossDown).length + '/7'], ['WABEN', G.seen.length + '/20'], ['GEHEIMNISSE', G.secrets.length]].map(([k, v]) => '<div class="dstat"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>').join('') + '</div>' +
    '<div class="dscore">' + (best ? '🏆 NEUER REKORD! ' : '') + 'PUNKTE: ' + fmt(sc) + '</div><div class="tip">💡 ' + D[2] + '</div>' +
    '<button class="btn gold" data-a="share" data-id="death">📤 ERGEBNIS TEILEN</button>' +
    (hasDawn ? '<button class="btn" data-a="loaddawn">☀️ LETZTEN MORGEN LADEN</button>' : '') +
    '<button class="btn ' + (hasDawn ? 'ghost' : 'red') + '" data-a="newgame">↻ NEUES SPIEL</button>';
  el.classList.add('show'); G._cause = cause;
}
