// ═══════════════ START & STEUERUNG ═══════════════
let titleOn = true, titleDiff = 'normal', lastRender = 0;
function showTitle() {
  titleOn = true; $('title').style.display = 'flex'; $('death').classList.remove('show');
  const sv = loadGame();
  let h = '<div class="tclass">KLASSIFIZIERT // ZUGANG GEWÄHRT</div><div class="tlogo">WILDNIS</div><div class="tsub">PROTOKOLL 247</div>';
  if (sv && !sv.dead) h += '<button class="btn gold" data-a="continue">▶ WEITERSPIELEN · ' + esc(sv.name) + ' · TAG ' + sv.day + ' · LV ' + sv.lv + '</button>';
  h += '<input id="nameinp" maxlength="12" placeholder="DEIN NAME" autocomplete="off" spellcheck="false" value="' + esc(sv ? sv.name : '') + '">';
  h += '<div class="tdiff"><button class="stab' + (titleDiff === 'normal' ? ' on' : '') + '" data-a="diff" data-id="normal">🌲 NORMAL</button><button class="stab' + (titleDiff === 'hard' ? ' on' : '') + '" data-a="diff" data-id="hard">☠ HARDCORE</button></div>';
  h += '<div class="tfoot" style="margin-top:-2px">' + (titleDiff === 'hard' ? 'Permadeath. Stärkere Gegner. Kein Neustart vom Morgen.' : 'Bewusstlos statt tot im Kampf. Morgen-Speicherpunkt.') + '</div>';
  h += '<button class="btn" data-a="start">' + (sv && !sv.dead ? '↻ NEUES SPIEL' : '▶ ÜBERLEBEN STARTEN') + '</button>';
  const achN = Object.keys(M.ach).length;
  h += '<div class="tfoot">' + (M.best && M.best.score ? '🏆 REKORD ' + fmt(M.best.score) + ' · ' : '') + '🎖 ' + achN + '/' + ACH.length + ' ERFOLGE' + (M.cycle ? ' · ♾ ZYKLUS ' + (M.cycle + 1) : '') + '</div>';
  h += '<div class="tfoot">🔊 TON AN · AM BESTEN MIT KOPFHÖRERN</div>';
  $('titleui').innerHTML = h;
}
function afterStart(isNew) {
  titleOn = false; $('title').style.display = 'none'; $('death').classList.remove('show');
  TAB = 'act'; mapSel = null; inCombat = false; C = null; $('combat').classList.remove('show'); $('night').classList.remove('show');
  for (const k in LAYERS) delete LAYERS[k];
  SFX.init(); SFX.on = G.opt.sound; SFX.music = G.opt.music; SFX.setMood('calm', 110);
  refreshTrader(); markDirty(); render(); updateHUD(); saveGame();
  if (isNew) {
    saveDawn();
    showModal({ title: '// ÜBERLEBENSPROTOKOLL 247', textCls: 'arkon', type: 1, text: 'Du erwachst.\nWald. Kälte. Kopfschmerzen.\n\nDu weißt nicht, wie du hierhergekommen bist. Auf deinem Handgelenk: eine tätowierte Nummer.\n\n#247\n\nIrgendwo in der Ferne heult ein Wolf.', choices: [{ t: 'AUFSTEHEN', fn: () => showModal({ title: '💡 SO ÜBERLEBST DU', html: '<div class="mx">❤️ Leben · ⚡ Energie · 🍖 Hunger · 💧 Durst · 🔥 Wärme\n\nHalte alle Werte oben. Sammle Ressourcen, baue ein Lager mit Lagerfeuer, und schlafe nachts geschützt.\n\nFolge dem gelben <b style="color:var(--a)">ZIEL</b> oben – es führt dich durch alles.\n\nKämpfe sind rundenbasiert: Nutze BLOCK gegen starke Angriffe!</div>', choices: [{ t: "LOS GEHT'S" }] }) }] });
  }
}
function continueGame() {
  const sv = loadGame(); if (!sv) return; G = sv; G.busy = null; G._done = null; G.night = false;
  const away = clamp((Date.now() - (G.lastReal || Date.now())) / 1000, 0, 8 * 3600);
  const lines = [];
  if (away > 120) {
    for (const k in G.prod) { const P = BUILD[k].prod, p = G.prod[k]; const cap = P.cap * (k === 'fallen' ? G.bld.fallen : 1); const add = Math.floor(away / (P.every / (k === 'fallen' ? G.bld.fallen : 1))); const nw = Math.min(cap, p.stock + add); if (nw > p.stock) lines.push(BUILD[k].i + ' ' + BUILD[k].n + ': +' + Math.floor(nw - p.stock) + ' ' + ITEMS[P.it].n); p.stock = nw; }
    if (G.bld.lagerfeuer && G.fire > 0) { G.fire = Math.max(0, G.fire - away); if (!G.fire) lines.push('🔥 Dein Lagerfeuer ist ausgegangen.'); }
  }
  afterStart(false);
  if (lines.length) showModal({ title: '🌲 WILLKOMMEN ZURÜCK', text: 'Während du weg warst (' + Math.round(away / 60) + ' min):\n\n' + lines.join('\n') + '\n\nErnte im Lager unter AKTION.', choices: [{ t: 'WEITER' }] });
}
function settingsModal() {
  const o = G.opt;
  showModal({
    title: '⚙ EINSTELLUNGEN', html: '<div class="btnrow" style="margin-top:0"><button class="btn ' + (o.sound ? '' : 'ghost') + '" data-a="opt" data-id="sound">🔊 TON ' + (o.sound ? 'AN' : 'AUS') + '</button><button class="btn ' + (o.music ? '' : 'ghost') + '" data-a="opt" data-id="music">🎵 MUSIK ' + (o.music ? 'AN' : 'AUS') + '</button></div><div class="btnrow"><button class="btn ' + (o.vib ? '' : 'ghost') + '" data-a="opt" data-id="vib">📳 VIBRATION ' + (o.vib ? 'AN' : 'AUS') + '</button></div><div class="btnrow"><button class="btn gold" data-a="share" data-id="live">📤 FORTSCHRITT TEILEN</button></div><div class="btnrow"><button class="btn blue" data-a="export">💾 EXPORT</button><button class="btn blue" data-a="import">📥 IMPORT</button></div><div class="sub" style="margin-top:10px">Spielstand wird automatisch gespeichert. ' + (G.hardcore ? '☠ Hardcore-Modus.' : '') + '<br>Punkte: ' + fmt(score()) + ' · Spielzeit: ' + Math.floor(G.played / 60) + ' min</div>',
    choices: [{ t: '🏠 ZUM TITELBILDSCHIRM', cls: 'ghost', fn: () => { saveGame(); showTitle(); } }, { t: 'SCHLIESSEN' }]
  });
}
function exportSave() {
  saveGame(); const code = btoa(unescape(encodeURIComponent(JSON.stringify(G))));
  showModal({ title: '💾 SPIELSTAND-CODE', html: '<textarea id="savecode" style="width:100%;height:120px;background:#050805;color:var(--g);border:1px solid var(--line2);border-radius:6px;font-family:var(--mono);font-size:9px;padding:6px" readonly>' + code + '</textarea><div class="sub">Kopiere den Code, um deinen Spielstand auf ein anderes Gerät zu übertragen.</div>', choices: [{ t: '📋 KOPIEREN', fn: () => { try { navigator.clipboard.writeText(code).then(() => toast('📋', 'KOPIERT', '')).catch(() => { const t = $('savecode'); if (t) { t.select(); document.execCommand('copy'); } }); } catch (e) { } } }, { t: 'SCHLIESSEN', cls: 'ghost' }] });
}
function importSave() {
  showModal({ title: '📥 SPIELSTAND LADEN', html: '<textarea id="savein" style="width:100%;height:120px;background:#050805;color:var(--g);border:1px solid var(--line2);border-radius:6px;font-family:var(--mono);font-size:9px;padding:6px" placeholder="Code hier einfügen"></textarea>', choices: [{ t: 'LADEN', fn: () => { try { const g = JSON.parse(decodeURIComponent(escape(atob($('savein').value.trim())))); if (g.v !== 3) throw 0; G = g; saveGame(); continueGame(); toast('✅', 'GELADEN', G.name + ' · Tag ' + G.day); } catch (e) { toast('⚠', 'UNGÜLTIGER CODE', '', 'bad'); } } }, { t: 'ABBRECHEN', cls: 'ghost' }] });
}
function gameURL() { return /^https?:/.test(location.protocol) ? location.origin + location.pathname : 'https://wildnis.socialrewardcoin.com/v3.html'; }
function shareResult(kind) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 800; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  drawTitle(x, 600, 800, 3.3);
  x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(0, 0, 600, 800);
  x.textAlign = 'center'; x.fillStyle = '#c8ff80'; x.shadowColor = '#c8ff80'; x.shadowBlur = 24; x.font = 'bold 74px Silkscreen, monospace'; x.fillText('WILDNIS', 300, 120); x.shadowBlur = 0;
  x.font = '20px "Share Tech Mono", monospace'; x.fillStyle = '#5f8a45'; x.fillText('P R O T O K O L L   2 4 7', 300, 156);
  const dead = kind === 'death', win = kind === 'win';
  x.font = 'bold 34px Silkscreen, monospace'; x.fillStyle = dead ? '#ff5050' : win ? '#ffc44d' : '#e8ffd8';
  x.fillText(dead ? (DEATH[G._cause] || DEATH.kampf)[0] : win ? 'EXPERIMENT BEENDET' : 'NOCH AM LEBEN', 300, 250);
  x.font = '26px "Share Tech Mono", monospace'; x.fillStyle = '#fff'; x.fillText(G.name + ' überlebte', 300, 300);
  x.font = 'bold 110px Silkscreen, monospace'; x.fillStyle = '#c8ff80'; x.fillText(G.day, 300, 420); x.font = '28px Silkscreen, monospace'; x.fillText(G.day === 1 ? 'TAG' : 'TAGE', 300, 462);
  const rows = [['LEVEL', G.lv], ['SIEGE', G.stats.wins], ['BOSSE', Object.keys(G.bossDown).length + '/7'], ['PUNKTE', fmt(score())]];
  rows.forEach(([k, v], i) => { const bx = 60 + (i % 2) * 250, by = 510 + Math.floor(i / 2) * 90; x.fillStyle = 'rgba(20,30,18,0.85)'; x.fillRect(bx, by, 230, 74); x.strokeStyle = '#2a4a24'; x.strokeRect(bx, by, 230, 74); x.font = '16px "Share Tech Mono", monospace'; x.fillStyle = '#7a9a6a'; x.fillText(k, bx + 115, by + 26); x.font = 'bold 28px Silkscreen, monospace'; x.fillStyle = '#fff'; x.fillText(v, bx + 115, by + 60); });
  x.font = 'bold 22px "Share Tech Mono", monospace'; x.fillStyle = '#ffc44d'; x.fillText('Wie lange überlebst DU?', 300, 730);
  x.font = '17px "Share Tech Mono", monospace'; x.fillStyle = '#8aaa7a'; x.fillText(gameURL().replace(/^https?:\/\//, ''), 300, 762);
  const text = (dead ? '💀 ' + G.name + ' hat ' + G.day + ' Tage in WILDNIS überlebt' : win ? '🚀 Ich habe das ARKON-Experiment in ' + G.day + ' Tagen beendet' : '🌲 Tag ' + G.day + ' in WILDNIS') + ' (Level ' + G.lv + ', ' + Object.keys(G.bossDown).length + ' Bosse, ' + fmt(score()) + ' Punkte). Schaffst du mehr? ' + gameURL();
  c.toBlob(blob => {
    const file = blob ? new File([blob], 'wildnis-tag-' + G.day + '.png', { type: 'image/png' }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text, title: 'WILDNIS' }).catch(() => { }); return; }
    if (navigator.share) { navigator.share({ text, title: 'WILDNIS', url: gameURL() }).catch(() => { }); }
    try { navigator.clipboard.writeText(text).catch(() => { }); } catch (e) { }
    if (blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'wildnis-tag-' + G.day + '.png'; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500); }
    toast('📤', 'BILD ERSTELLT', 'Text kopiert – teile dein Ergebnis!', 'gold');
  }, 'image/png');
}
function beastModal(id) {
  const b = M.beast[id], E = ENEMIES[id]; if (!b) { toast('❓', 'UNBEKANNT', 'Begegne diesem Wesen, um es zu erforschen.'); return; }
  const es = enemyStats(id, E.boss ? E.lv : 5);
  showModal({ title: (E.boss ? '☠ ' : '📖 ') + E.n + (E.title ? ' · ' + E.title : ''), html: '<canvas id="beastbig" width="160" height="120" style="width:100%;max-width:240px;display:block;margin:0 auto 10px;image-rendering:pixelated"></canvas><div class="mx note">' + esc(E.lore) + '</div><div class="cost" style="margin:-4px 0 12px">' + ['☠ Besiegt: ' + b.kills, '❤ ' + es.max + (E.boss ? '' : ' (Lv5)'), '⚔ ' + es.atk, '🛡 ' + es.def, E.weak ? 'Schwach: ' + EL[E.weak].n : null, E.resist ? 'Resistent: ' + EL[E.resist].n : null].filter(Boolean).map(t => '<span class="pill">' + t + '</span>').join('') + '</div>',
    onOpen: () => { const c = $('beastbig'), x = c.getContext('2d'), s = getEnemySprite(id); x.imageSmoothingEnabled = false; const w = s.naturalWidth || s.width, h = s.naturalHeight || s.height, sc = Math.min(150 / w, 110 / h); x.drawImage(s, (160 - w * sc) / 2, (120 - h * sc) / 2, w * sc, h * sc); } });
}
// ─── Klick-Verteiler ───
const ACT = {
  tab: d => { TAB = d.id; if (d.sub) SUB.craft = d.sub; if (TAB !== 'map') mapSel = null; else if (mapSel === null && curQuest() && curQuest().id === 'q_wasser' && G.hex === 0) mapSel = 1; SFX.play('tab'); const dot = document.querySelector('.nb[data-id="' + d.id + '"] .dot'); if (dot && d.id !== 'hero') dot.classList.remove('show'); $('content').scrollTop = 0; render(); },
  sub: d => { SUB.craft = d.id; SFX.play('tab'); render(); },
  subst: d => { SUB.craftSt = d.id; SFX.play('click'); render(); },
  subbag: d => { SUB.bag = d.id; SFX.play('click'); if (TAB !== 'bag') TAB = 'bag'; render(); },
  subj: d => { SUB.journal = d.id; SFX.play('click'); render(); },
  gather: d => doGather(d.id), craft: d => doCraft(d.id), build: d => doBuild(d.id), fuel: d => doFuel(d.id), ignite: () => doIgnite(), harvest: d => doHarvest(d.id),
  sleep: () => { if (!G.busy) showModal({ title: '🌙 SCHLAFEN GEHEN?', text: 'Der Tag endet. Nachts verbrauchst du Nahrung und Wasser – und manchmal kommen ungebetene Gäste.', choices: [{ t: '🌙 SCHLAFEN', fn: () => startNight(true) }, { t: 'NOCH NICHT', cls: 'ghost' }] }); },
  wake: () => wakeUp(), travel: d => doTravel(+d.id), boss: d => startBossIntro(d.id), trade: () => openTrade(),
  ttab: d => tradeAct('ttab', d.id), buy: d => tradeAct('buy', d.id), buyg: d => tradeAct('buyg', d.id), sell: d => tradeAct('sell', d.id), sellall: d => tradeAct('sellall', d.id), sellg: d => tradeAct('sellg', d.id),
  use: d => doUse(d.id), drop: d => doDrop(d.id), item: d => itemDetail(d.id), equip: d => doEquip(d.id), unequip: d => doUnequip(d.id), repair: d => doRepair(d.id), scrap: d => doScrap(d.id),
  storeall: () => storeAll(), unstore: d => unstore(d.id), attr: d => doAttr(d.id), skill: d => doSkill(d.id), train: d => doTrain(d.id), radio_use: () => radioDecode(),
  beast: d => beastModal(d.id), note: d => { const S = SECRETS[d.id]; showModal({ title: S.t, text: S.x, textCls: S.k === 'arkon' ? 'arkon' : 'note' }); }, radio: d => { const r = RADIO[+d.id]; showModal({ title: r.t, text: r.x, textCls: 'arkon' }); },
  settings: () => { if (G && !titleOn) settingsModal(); }, opt: d => { G.opt[d.id] = !G.opt[d.id]; SFX.on = G.opt.sound; SFX.music = G.opt.music; closeModal(); saveGame(); settingsModal(); },
  export: () => { closeModal(); exportSave(); }, import: () => { closeModal(); importSave(); },
  share: d => shareResult(d.id),
  newgame: () => { $('death').classList.remove('show'); showTitle(); },
  loaddawn: () => { try { const g = JSON.parse(localStorage.getItem('wildnis3_dawn')); if (g) { G = g; G.dead = false; saveGame(); continueGame(); toast('☀️', 'NEUER VERSUCH', 'Zurück am Morgen von Tag ' + G.day); } } catch (e) { showTitle(); } },
  continue: () => { SFX.init(); continueGame(); },
  diff: d => { titleDiff = d.id === 'hard' ? 'hard' : 'normal'; SFX.init(); SFX.play('click'); const v = $('nameinp').value; showTitle(); $('nameinp').value = v; },
  start: () => {
    SFX.init(); const nm = ($('nameinp').value || '').trim();
    const go = () => { newGame(nm || 'NAMENLOS', titleDiff === 'hard'); afterStart(true); };
    if (loadGame() && !loadGame().dead) showModal({ title: '⚠ NEUES SPIEL?', cls: 'danger', text: 'Dein aktueller Spielstand wird überschrieben.', choices: [{ t: 'JA, NEU STARTEN', cls: 'red', fn: go }, { t: 'ABBRECHEN', cls: 'ghost' }] });
    else go();
  },
  mchoice: d => { const c = modalChoices[+d.i]; closeModal(); if (c && c.fn) c.fn(); },
  cb: d => cbAction('cb', d.id), cbm: d => cbAction('cbm', d.id), cbi: d => cbAction('cbi', d.id),
};
document.addEventListener('pointerdown', () => SFX.init(), { once: true });
document.addEventListener('click', ev => {
  if (ev.target.id === 'mapcv') { mapClick(ev); return; }
  if (ev.target.closest('#cbmsg') || ev.target.id === 'cbcv') { cbTap(); return; }
  const t = ev.target.closest('[data-a]'); if (!t) return;
  if (t.disabled) return;
  const a = t.dataset.a; if (!ACT[a]) return;
  if (!G && !['start', 'continue', 'diff', 'mchoice'].includes(a)) return;
  ev.stopPropagation();
  try { ACT[a](t.dataset); } catch (e) { console.error(e); }
});
$('modal').addEventListener('click', ev => { if (ev.target.id === 'modal' && modalChoices.length <= 1 && !modalChoices[0]?.fn) closeModal(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && titleOn && document.activeElement && document.activeElement.id === 'nameinp') ACT.start(); if (inCombat && (ev.key === ' ' || ev.key === 'Enter')) cbTap(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !titleOn) saveGame(); });
window.addEventListener('beforeunload', () => { if (G && !titleOn) saveGame(); });
// ─── Schleifen ───
const sceneCv = $('scene'), sceneCx = sceneCv.getContext('2d'), cbCv = $('cbcv'), cbCx = cbCv.getContext('2d'), tCv = $('titlecv'), tCx = tCv.getContext('2d');
sceneCx.imageSmoothingEnabled = false; cbCx.imageSmoothingEnabled = false;
function frame(now) {
  try {
    if (titleOn) drawTitle(tCx, tCv.width, tCv.height, now / 1000);
    else if (G) {
      if (inCombat) drawCombat(cbCx, now); else drawScene(sceneCx, now);
      if (DIRTY && now - lastRender > 140 && !inCombat) { lastRender = now; render(); }
    }
  } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
setInterval(() => {
  if (!G || titleOn) return;
  try {
    tick(0.25); updateHUD();
    if (TAB === 'map' && !inCombat) drawMap();
    SFX.ambient({ rain: !!WEATHER[G.weather].rain && HEXES[G.hex].b !== 'hoehle', storm: G.weather === 'gewitter', fire: fireOn(), wind: ['berg', 'eis', 'kueste'].includes(HEXES[G.hex].b), night: isNight(), cold: seasonIdx() === 3 });
  } catch (e) { console.error(e); }
}, 250);
function resizeTitle() { const r = $('app').getBoundingClientRect(); tCv.width = Math.round(r.width / 2); tCv.height = Math.round(r.height / 2); }
window.addEventListener('resize', resizeTitle);
loadMeta();
loadImages(() => { resizeTitle(); showTitle(); requestAnimationFrame(frame); });
window.W3 = { get G() { return G; }, set G(v) { G = v; }, M: () => M, tick, startCombat, doGather, doCraft, doBuild, doTravel, startNight, wakeUp, finishWake, gainXP, addItem, addGear, render, cbAction, getC: () => C, say, ACT, newGame, afterStart, showEnding, shareResult, die };
