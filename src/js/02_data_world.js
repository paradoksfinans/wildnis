// ═══════════════ SAMMEL-AKTIONEN ═══════════════
// loot: [item, min, max, chance] · need: Werkzeug · en: Energiekosten
const GATHER = {
  aeste: { n: 'Äste sammeln', i: '🌿', t: 4, en: 2, xp: 1, sfx: 'gather', loot: [['aeste', 2, 4, 1], ['fasern', 1, 2, 0.35], ['harz', 1, 1, 0.12]] },
  holz: { n: 'Holz fällen', i: '🪓', t: 6, en: 5, xp: 2, need: 'steinaxt', sfx: 'chop', loot: [['holz', 2, 3, 1], ['aeste', 1, 2, 0.6], ['harz', 1, 2, 0.3]] },
  steine: { n: 'Steine suchen', i: '🪨', t: 5, en: 3, xp: 1, sfx: 'stone', loot: [['steine', 2, 3, 1], ['feuerstein', 1, 1, 0.18], ['knochen', 1, 1, 0.08]] },
  erz: { n: 'Erz abbauen', i: '⛏️', t: 7, en: 6, xp: 3, need: 'spitzhacke', sfx: 'stone', loot: [['eisenerz', 1, 2, 0.75], ['kohle', 1, 2, 0.45], ['steine', 1, 2, 0.6], ['feuerstein', 1, 1, 0.15]] },
  beeren: { n: 'Beeren pflücken', i: '🫐', t: 4, en: 1, xp: 1, sfx: 'gather', loot: [['beeren', 2, 5, 0.85], ['feder', 1, 1, 0.18], ['honig', 1, 1, 0.07]] },
  pilze: { n: 'Pilze suchen', i: '🍄', t: 5, en: 1, xp: 1, sfx: 'gather', loot: [['pilze', 1, 3, 0.75], ['heilkraut', 1, 1, 0.1]] },
  kraeuter: { n: 'Kräuter suchen', i: '🌱', t: 5, en: 2, xp: 2, sfx: 'gather', loot: [['heilkraut', 1, 2, 0.7], ['fasern', 1, 2, 0.5], ['honig', 1, 1, 0.05]] },
  fasern: { n: 'Fasern rupfen', i: '🌾', t: 4, en: 2, xp: 1, sfx: 'gather', loot: [['fasern', 2, 4, 1], ['beeren', 1, 2, 0.2]] },
  lehm: { n: 'Lehm graben', i: '🧱', t: 5, en: 4, xp: 1, sfx: 'gather', loot: [['lehm', 1, 3, 1], ['steine', 1, 1, 0.3]] },
  wasser: { n: 'Wasser schöpfen', i: '💧', t: 3, en: 1, xp: 0, sfx: 'water', loot: 'water' },
  angeln: { n: 'Angeln', i: '🎣', t: 8, en: 3, xp: 3, need: 'angel', sfx: 'water', loot: [['fisch', 1, 2, 0.7], ['muschel', 1, 1, 0.15], ['stoff', 1, 1, 0.05]] },
  strand: { n: 'Strand absuchen', i: '🐚', t: 5, en: 2, xp: 2, sfx: 'gather', loot: [['muschel', 1, 3, 0.9], ['feder', 1, 2, 0.3], ['schrott', 1, 1, 0.22], ['stoff', 1, 2, 0.2], ['konserve', 1, 1, 0.05]] },
  eis: { n: 'Eis hacken', i: '💠', t: 7, en: 6, xp: 4, need: 'spitzhacke', sfx: 'stone', loot: [['kristall', 1, 1, 0.35], ['wasser', 1, 2, 0.8], ['eisenerz', 1, 2, 0.45]] },
  pluendern: { n: 'Durchsuchen', i: '🔍', t: 7, en: 4, xp: 3, sfx: 'gather', loot: 'loot' },
  jagen: { n: 'Auf die Jagd gehen', i: '🏹', t: 5, en: 6, xp: 0, sfx: 'step', hunt: true },
  rasten: { n: 'Ausruhen', i: '💤', t: 8, en: -28, xp: 0, rest: true },
};
const LOOT_TABLES = {
  dorf: [['stoff', 1, 2, 0.6], ['seil', 1, 1, 0.3], ['naegel', 2, 5, 0.35], ['schrott', 1, 2, 0.35], ['konserve', 1, 1, 0.14], ['coins', 2, 8, 0.6], ['verband', 1, 1, 0.1]],
  ruinen: [['schrott', 1, 3, 0.8], ['eisen', 1, 1, 0.2], ['chip', 1, 1, 0.09], ['naegel', 2, 6, 0.4], ['coins', 4, 12, 0.6], ['kohle', 1, 2, 0.3]],
  stadt: [['konserve', 1, 1, 0.28], ['stoff', 1, 3, 0.6], ['schrott', 1, 3, 0.6], ['chip', 1, 1, 0.14], ['naegel', 3, 8, 0.4], ['coins', 6, 18, 0.7], ['heiltrank', 1, 1, 0.08], ['wasser', 1, 2, 0.3]],
  labor: [['chip', 1, 2, 0.4], ['schrott', 2, 4, 0.7], ['stahl', 1, 1, 0.2], ['arkonserum', 1, 1, 0.05], ['coins', 10, 25, 0.6]],
};

// ═══════════════ BIOME ═══════════════
// temp: Temperatur-Offset · water: clean|dirty · shelter: Unterschlupf-Typ
const BIOMES = {
  wald: { n: 'Wald', temp: 0, gather: ['aeste', 'steine', 'holz', 'beeren', 'pilze', 'fasern', 'jagen', 'rasten'], water: null, shelter: 'baum', enemies: [['ratte', 3], ['wolf', 3], ['keiler', 2], ['baer', 0.6]] },
  lichtung: { n: 'Lichtung', temp: 1, gather: ['beeren', 'kraeuter', 'fasern', 'aeste', 'jagen', 'rasten'], water: null, shelter: 'baum', enemies: [['kraehe', 3], ['keiler', 2], ['wolf', 1.5]] },
  bach: { n: 'Bach', temp: -1, gather: ['wasser', 'angeln', 'steine', 'lehm', 'fasern', 'jagen', 'rasten'], water: 'clean', shelter: 'zelt', enemies: [['ratte', 2], ['natter', 1.5], ['wolf', 1.5]] },
  fels: { n: 'Felsen', temp: -2, gather: ['steine', 'erz', 'lehm', 'kraeuter', 'jagen', 'rasten'], water: null, shelter: 'fels', enemies: [['natter', 2], ['wolf', 2], ['baer', 0.8]] },
  feld: { n: 'Feld', temp: 2, gather: ['fasern', 'beeren', 'lehm', 'kraeuter', 'jagen', 'rasten'], water: null, shelter: 'zelt', enemies: [['kraehe', 3], ['keiler', 3], ['ratte', 1]] },
  sumpf: { n: 'Sumpf', temp: -1, gather: ['kraeuter', 'pilze', 'wasser', 'fasern', 'lehm', 'jagen', 'rasten'], water: 'dirty', shelter: 'zelt', enemies: [['natter', 3], ['moorkriecher', 2], ['ratte', 1]] },
  dorf: { n: 'Dorf', temp: 1, gather: ['pluendern', 'aeste', 'wasser', 'beeren', 'rasten'], water: 'dirty', shelter: 'zelt', loot: 'dorf', enemies: [['bandit', 3], ['ratte', 2], ['wolf', 1]] },
  berg: { n: 'Berg', temp: -7, gather: ['steine', 'erz', 'kraeuter', 'jagen', 'rasten'], water: null, shelter: 'fels', enemies: [['wolf', 2], ['baer', 2], ['kraehe', 1]] },
  hoehle: { n: 'Höhle', temp: -3, gather: ['erz', 'steine', 'pilze', 'wasser', 'jagen', 'rasten'], water: 'clean', shelter: 'hoehle', enemies: [['spinne', 3], ['ratte', 2], ['baer', 1]] },
  see: { n: 'See', temp: -1, gather: ['wasser', 'angeln', 'fasern', 'lehm', 'kraeuter', 'jagen', 'rasten'], water: 'clean', shelter: 'zelt', enemies: [['moorkriecher', 1.5], ['natter', 1.5], ['wolf', 1.5]] },
  eis: { n: 'Eis', temp: -18, gather: ['eis', 'erz', 'steine', 'jagen', 'rasten'], water: null, shelter: 'fels', enemies: [['frostwolf', 4], ['wolf', 1]] },
  ruinen: { n: 'Ruinen', temp: 0, gather: ['pluendern', 'steine', 'erz', 'jagen', 'rasten'], water: null, shelter: 'fels', loot: 'ruinen', enemies: [['drohne', 3], ['bandit', 2], ['mutant', 0.6]] },
  kueste: { n: 'Küste', temp: 0, gather: ['strand', 'angeln', 'wasser', 'fasern', 'jagen', 'rasten'], water: 'dirty', shelter: 'zelt', enemies: [['bandit', 3], ['kraehe', 2], ['moorkriecher', 1]] },
  stadt: { n: 'Stadt', temp: 1, gather: ['pluendern', 'wasser', 'jagen', 'rasten'], water: 'dirty', shelter: 'zelt', loot: 'stadt', enemies: [['mutant', 3], ['drohne', 2], ['bandit', 1.5]] },
  urwald: { n: 'Urwald', temp: 3, gather: ['holz', 'kraeuter', 'beeren', 'pilze', 'fasern', 'jagen', 'rasten'], water: 'dirty', shelter: 'baum', enemies: [['spinne', 3], ['natter', 2], ['baer', 1]] },
  labor: { n: 'Sperrzone', temp: 4, gather: ['pluendern', 'rasten'], water: null, shelter: 'zelt', loot: 'labor', enemies: [['drohne', 4], ['mutant', 2]] },
};

// ═══════════════ WELT: 20 WABEN ═══════════════
const HEXES = [
  { id: 0, q: 0, r: 0, n: 'Dichter Wald', b: 'wald', lv: 1, d: 'Hier bist du erwacht. Hohe Kiefern verschlucken das Licht.' },
  { id: 1, q: 1, r: -1, n: 'Klarbach', b: 'bach', lv: 1, d: 'Kristallklares Wasser rauscht über glatte Steine.', secret: 'kamera' },
  { id: 2, q: 1, r: 0, n: 'Sonnenlichtung', b: 'lichtung', lv: 2, d: 'Wildblumen, Heilkräuter und das Summen von Bienen.', secret: 'schuh' },
  { id: 3, q: 0, r: 1, n: 'Wildwiesen', b: 'feld', lv: 2, d: 'Hohes Gras wogt im Wind. Wildschweine wühlen im Boden.' },
  { id: 4, q: -1, r: 1, n: 'Faulsumpf', b: 'sumpf', lv: 3, d: 'Blubbernder Morast. Das Wasser hier ist trüb.', secret: 'rohr' },
  { id: 5, q: -1, r: 0, n: 'Graufels', b: 'fels', lv: 2, d: 'Zerklüftetes Gestein. Erzadern glitzern im Fels.' },
  { id: 6, q: 0, r: -1, n: 'Verlassenes Dorf', b: 'dorf', lv: 3, d: 'Leere Häuser. Türen hängen schief in den Angeln.', secret: 'notiz1' },
  { id: 7, q: 2, r: -2, n: 'Silbersee', b: 'see', lv: 4, d: 'Ein stiller See, glatt wie ein Spiegel.', secret: 'boje' },
  { id: 8, q: 2, r: -1, n: 'Urwald', b: 'urwald', lv: 6, d: 'Riesige Farne. Netze zwischen den Bäumen.', secret: 'kameraanlage' },
  { id: 9, q: 2, r: 0, n: 'Schattenwald', b: 'wald', dark: true, lv: 6, d: 'Kein Vogel singt hier. Nur Heulen.', boss: 'alpha' },
  { id: 10, q: 1, r: 1, n: 'Goldfelder', b: 'feld', lv: 4, d: 'Verwilderte Kornfelder einer vergessenen Farm.', secret: 'vogelscheuche' },
  { id: 11, q: 0, r: 2, n: 'Sturmküste', b: 'kueste', lv: 8, d: 'Salzige Gischt. Am Horizont: nichts. Nur Nebel.', boss: 'varga', secret: 'kiste' },
  { id: 12, q: -1, r: 2, n: 'Nebelmoor', b: 'sumpf', lv: 7, d: 'Dichter Nebel. Etwas bewegt sich unter der Oberfläche.', secret: 'notiz_moor' },
  { id: 13, q: -2, r: 2, n: 'Tiefe Höhle', b: 'hoehle', lv: 9, d: 'Kristalle leuchten in der Dunkelheit. Ein tiefes Grollen.', boss: 'grimmzahn', secret: 'bunker' },
  { id: 14, q: -2, r: 1, n: 'Wolfsgipfel', b: 'berg', lv: 8, d: 'Dünne Luft. Ein rostiger Sendeturm auf dem Gipfel.', secret: 'sender' },
  { id: 15, q: -2, r: 0, n: 'Eisgipfel', b: 'eis', lv: 12, d: 'Ewiges Eis. Gigantische Fußspuren im Schnee.', boss: 'frostherz', secret: 'notiz2' },
  { id: 16, q: -1, r: -1, n: 'Händlerdorf', b: 'dorf', safe: true, lv: 5, d: 'Rauch aus einem Schornstein! Hier lebt noch jemand.', trader: true, secret: 'hinweis' },
  { id: 17, q: 0, r: -2, n: 'Alte Ruinen', b: 'ruinen', lv: 12, d: 'Betonsäulen mit dem Logo: ARKON INSTITUTE.', boss: 'w7' },
  { id: 18, q: 1, r: -2, n: 'Tote Stadt', b: 'stadt', lv: 16, d: 'Leere Hochhäuser. Bildschirme flackern in den Fenstern.', boss: 'subjekt246', secret: 'notiz3' },
  { id: 19, q: 1, r: -3, n: 'ARKON-Sperrzone', b: 'labor', lv: 22, d: 'Stacheldraht. Warnschilder. Und dahinter: eine silberne Spitze.', boss: 'prometheus', hidden: true },
];
const HEX_BY_QR = {}; HEXES.forEach(h => HEX_BY_QR[h.q + ',' + h.r] = h);
const HEX_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
function hexNeighbors(id) { const h = HEXES[id]; return HEX_DIRS.map(([dq, dr]) => HEX_BY_QR[(h.q + dq) + ',' + (h.r + dr)]).filter(Boolean).map(x => x.id); }

// ═══════════════ STATUSEFFEKTE ═══════════════
const STATUS = {
  blutung: { n: 'BLUTET', c: '#c0302a', dot: 0.05 },
  gift: { n: 'GIFT', c: '#5a9a2a', dot: 0.045 },
  brand: { n: 'BRAND', c: '#e0701a', dot: 0.06 },
  betaeubt: { n: 'BETÄUBT', c: '#c8a020' },
  verlangsamt: { n: 'LANGSAM', c: '#3a7ac0' },
  blind: { n: 'BLIND', c: '#555' },
  geschwaecht: { n: 'SCHWACH', c: '#7a4a9a' },
  stark: { n: 'STARK', c: '#d04040' },
  panzer: { n: 'PANZER', c: '#4a7a9a' },
  konter: { n: 'KONTER', c: '#2a9a7a' },
  fokus: { n: 'FOKUS', c: '#c09a2a' },
};
const EL = { phys: { n: 'PHYS', c: '#7a7a6a' }, feuer: { n: 'FEUER', c: '#e0601a' }, eis: { n: 'EIS', c: '#4aa0d0' }, elektro: { n: 'VOLT', c: '#c0b020' } };

// ═══════════════ GEGNER ═══════════════
// Basiswerte für Lv1, skalieren mit Level. moves: [id, Gewicht] · loot: [item, min, max, chance]
const EMOVES = {
  biss: { n: 'Biss', pow: 100 },
  kratzen: { n: 'Kratzer', pow: 80, fx: { blutung: [0.25, 3] } },
  stoss: { n: 'Hauerstoß', pow: 100 },
  ansturm: { n: 'Ansturm', pow: 200, charge: 'scharrt mit den Hufen und senkt den Kopf…' },
  wolfsbiss: { n: 'Reißbiss', pow: 100, fx: { blutung: [0.25, 3] } },
  heulen: { n: 'Heulen', self: { stark: 2 }, msg: 'heult! Sein Angriff steigt.' },
  sprung: { n: 'Sprungangriff', pow: 130, acc: 85 },
  giftbiss: { n: 'Giftbiss', pow: 80, fx: { gift: [0.65, 4] } },
  zischen: { n: 'Zischen', fx: { geschwaecht: [1, 2] }, msg: 'zischt bedrohlich! Du fühlst dich schwächer.' },
  wuergen: { n: 'Würgegriff', pow: 115 },
  pranke: { n: 'Prankenhieb', pow: 115, fx: { blutung: [0.2, 3] } },
  bruellen: { n: 'Brüllen', self: { stark: 3 }, fx: { geschwaecht: [0.6, 2] }, msg: 'brüllt ohrenbetäubend!' },
  aufrichten: { n: 'Zerschmettern', pow: 230, charge: 'richtet sich zu voller Größe auf…' },
  schnitt: { n: 'Messerschnitt', pow: 100, fx: { blutung: [0.2, 3] } },
  sandwurf: { n: 'Sandwurf', pow: 20, fx: { blind: [0.9, 2] } },
  flicken: { n: 'Verband anlegen', heal: 0.25, once: true, msg: 'verbindet seine Wunden.' },
  messerwurf: { n: 'Messerwurf', pow: 90, acc: 98 },
  spinnbiss: { n: 'Giftklauen', pow: 100, fx: { gift: [0.4, 3] } },
  netz: { n: 'Netzschuss', pow: 10, acc: 75, fx: { betaeubt: [1, 1] } },
  picken: { n: 'Picken', pow: 70, hits: 2 },
  schwarm: { n: 'Schwarmangriff', pow: 90, fx: { blind: [0.3, 2] } },
  frostbiss: { n: 'Frostbiss', pow: 105, el: 'eis', fx: { verlangsamt: [0.35, 2] } },
  eisatem: { n: 'Eisatem', pow: 185, el: 'eis', charge: 'saugt eisige Luft ein… Frost bildet sich am Maul.' },
  laser: { n: 'Laserstrahl', pow: 110, el: 'feuer', fx: { brand: [0.25, 3] } },
  scan: { n: 'Zielerfassung', self: { fokus: 1 }, msg: 'erfasst dich. Ein roter Punkt auf deiner Brust.' },
  geweih: { n: 'Geweihstoß', pow: 120 },
  saeure: { n: 'Säurespucke', pow: 90, fx: { gift: [0.5, 3] } },
  raserei_e: { n: 'Raserei', self: { stark: 3 }, msg: 'gerät in Raserei!' },
  schlamm: { n: 'Schlammwurf', pow: 40, fx: { blind: [0.7, 2] } },
  panzern: { n: 'Einigeln', self: { panzer: 3 }, msg: 'zieht sich in seinen Panzer zurück.' },
  // Bosse
  schattenbiss: { n: 'Schattenbiss', pow: 110, fx: { blutung: [0.5, 3] } },
  rudelruf: { n: 'Rudelruf', heal: 0.15, self: { stark: 2 }, msg: 'ruft sein Rudel! Schatten huschen um dich herum.' },
  blutrausch: { n: 'Blutrausch', pow: 105, hits: 2, charge: 'fletscht die Zähne. Seine Augen glühen rot…' },
  erdbeben: { n: 'Erdbeben', pow: 240, fx: { betaeubt: [0.35, 1] }, charge: 'hebt beide Pranken über den Kopf… der Boden bebt!' },
  fressen: { n: 'Fressen', heal: 0.18, once: true, below: 0.45, msg: 'reißt ein Stück Aas und frisst gierig.' },
  doppelhieb: { n: 'Doppelhieb', pow: 75, hits: 2, fx: { blutung: [0.2, 2] } },
  rauchbombe: { n: 'Rauchbombe', fx: { blind: [1, 3] }, msg: 'wirft eine Rauchbombe!' },
  bande: { n: 'Steinhagel der Bande', pow: 45, hits: 3, msg: 'pfeift – seine Bande wirft Steine!' },
  siegeswille: { n: 'Siegeswille', heal: 0.2, once: true, below: 0.4, self: { stark: 2 }, msg: 'brüllt: „Niemand nimmt mir meine Küste!"' },
  messerhagel: { n: 'Messerhagel', pow: 200, charge: 'zieht ein Dutzend Wurfmesser aus dem Mantel…' },
  schild: { n: 'Energieschild', self: { panzer: 3 }, msg: 'aktiviert ein flimmerndes Energieschild.' },
  overload: { n: 'OVERLOAD', pow: 250, el: 'elektro', charge: 'lädt sich auf. SURREN. ÜBERLAST IN 1 ZUG.' },
  reparatur: { n: 'Nanoreparatur', heal: 0.14, uses: 2, below: 0.6, msg: 'repariert sich. Funken sprühen.' },
  eisfaust: { n: 'Eisfaust', pow: 120, el: 'eis', fx: { verlangsamt: [0.4, 2] } },
  blizzard: { n: 'Blizzard', pow: 210, el: 'eis', fx: { verlangsamt: [0.8, 3] }, charge: 'brüllt in den Himmel. Ein Schneesturm zieht auf…' },
  eispanzer: { n: 'Eispanzer', self: { panzer: 3 }, msg: 'überzieht sich mit Eis.' },
  klinge246: { n: 'Klingenhieb', pow: 120, fx: { blutung: [0.4, 3] } },
  erinnerung: { n: 'Erinnerungsflut', fx: { geschwaecht: [1, 2], blind: [0.6, 2] }, msg: 'flüstert deinen Namen. Bilder fluten deinen Kopf.' },
  adrenalin_e: { n: 'Adrenalin', heal: 0.2, once: true, below: 0.5, self: { stark: 3 }, msg: 'rammt sich eine Spritze in den Arm.' },
  todesstoss_e: { n: 'Todesstoß', pow: 280, charge: 'geht in die Hocke. Die Klinge zielt auf dein Herz…' },
  plasma: { n: 'Plasmastrahl', pow: 130, el: 'feuer', fx: { brand: [0.35, 3] } },
  drohnen: { n: 'Drohnenschwarm', pow: 60, hits: 3, msg: 'entsendet Drohnen!' },
  matrix: { n: 'Schildmatrix', self: { panzer: 3 }, msg: 'SCHILDMATRIX AKTIV.' },
  omega: { n: 'PROTOKOLL OMEGA', pow: 320, el: 'elektro', charge: 'PROTOKOLL OMEGA WIRD GELADEN. ALLE SYSTEME AUF DICH GERICHTET.' },
  nano: { n: 'Nanoreparatur', heal: 0.12, uses: 3, below: 0.55, msg: 'repariert sich mit Nanobots.' },
};
const ENEMIES = {
  ratte: { n: 'Riesenratte', hp: 22, atk: 6, def: 2, spd: 10, moves: [['biss', 3], ['kratzen', 2]], loot: [['fleisch', 1, 1, 0.5], ['fell', 1, 1, 0.3], ['knochen', 1, 1, 0.2]], xp: 7, coins: [0, 2], lore: 'Fett, frech, überall. Die Ratten hier sind größer, als Ratten sein sollten.' },
  kraehe: { n: 'Krähenschwarm', hp: 20, atk: 7, def: 1, spd: 18, weak: 'feuer', moves: [['picken', 3], ['schwarm', 2]], loot: [['feder', 1, 3, 0.9]], xp: 8, coins: [0, 1], lore: 'Sie beobachten. Immer. Manche sagen, ihre Augen glänzen wie Kameralinsen.' },
  keiler: { n: 'Wildschwein', hp: 46, atk: 9, def: 6, spd: 7, moves: [['stoss', 4], ['ansturm', 1.5]], loot: [['fleisch', 1, 3, 1], ['fell', 1, 1, 0.6], ['knochen', 1, 2, 0.5]], xp: 13, coins: [0, 2], lore: 'Hauer wie Dolche. Sein Ansturm bricht Knochen – verteidige dich, wenn es scharrt!' },
  wolf: { n: 'Grauwolf', img: 'wolf', hp: 38, atk: 11, def: 4, spd: 13, moves: [['wolfsbiss', 4], ['heulen', 1], ['sprung', 2]], loot: [['fleisch', 1, 2, 0.9], ['fell', 1, 1, 1], ['zahn', 1, 1, 0.35], ['knochen', 1, 1, 0.3]], xp: 15, coins: [0, 3], lore: 'Jagt nachts. Fürchtet das Feuer. Wo einer ist, sind andere.' },
  natter: { n: 'Giftnatter', hp: 28, atk: 9, def: 3, spd: 15, moves: [['giftbiss', 4], ['zischen', 1], ['wuergen', 2]], loot: [['gift', 1, 1, 0.6], ['fleisch', 1, 1, 0.3], ['leder', 1, 1, 0.12]], xp: 14, coins: [0, 2], lore: 'Ihr Gift wirkt langsam. Ohne Gegengift ist jeder Schritt eine Qual.' },
  moorkriecher: { n: 'Moorkriecher', hp: 62, atk: 13, def: 11, spd: 7, moves: [['biss', 3], ['schlamm', 2], ['panzern', 1]], loot: [['leder', 1, 1, 0.55], ['fleisch', 1, 2, 0.8], ['knochen', 1, 2, 0.4]], xp: 26, coins: [1, 4], lore: 'Eine gepanzerte Echse aus dem Schlamm. Ihre Schuppen trotzen jedem Messer.' },
  baer: { n: 'Braunbär', hp: 85, atk: 15, def: 9, spd: 6, moves: [['pranke', 4], ['bruellen', 1], ['aufrichten', 1.5]], loot: [['fleisch', 2, 4, 1], ['fell', 2, 2, 1], ['kralle', 1, 1, 0.25], ['knochen', 1, 2, 0.6], ['honig', 1, 1, 0.2]], xp: 32, coins: [1, 5], lore: 'Der König des Waldes. Wenn er sich aufrichtet: verteidigen oder sterben.' },
  bandit: { n: 'Bandit', hp: 50, atk: 12, def: 6, spd: 11, human: true, moves: [['schnitt', 4], ['sandwurf', 1.5], ['flicken', 1], ['messerwurf', 2]], loot: [['stoff', 1, 2, 0.6], ['seil', 1, 1, 0.4], ['konserve', 1, 1, 0.15], ['verband', 1, 1, 0.25], ['pfeile', 2, 5, 0.3]], xp: 24, coins: [3, 12], lore: 'Überlebende, die das Überleben anderer nicht interessiert. Tragen manchmal ARKON-Ausrüstung.' },
  spinne: { n: 'Riesenspinne', hp: 55, atk: 13, def: 7, spd: 12, weak: 'feuer', moves: [['spinnbiss', 4], ['netz', 1.5], ['sprung', 1.5]], loot: [['seide', 1, 2, 0.8], ['gift', 1, 1, 0.4]], xp: 27, coins: [0, 3], lore: 'Acht Augen. Acht Beine. Ihre Seide ist reißfester als Stahl.' },
  frostwolf: { n: 'Frostwolf', img: 'wolf', tint: 'frost', hp: 60, atk: 16, def: 8, spd: 14, weak: 'feuer', resist: 'eis', moves: [['frostbiss', 4], ['heulen', 1], ['eisatem', 1.3]], loot: [['fell', 2, 2, 1], ['zahn', 1, 1, 0.5], ['kristall', 1, 1, 0.25], ['fleisch', 1, 2, 0.7]], xp: 36, coins: [1, 5], lore: 'Sein Fell ist weiß wie Schnee, sein Atem gefriert Blut. Feuer ist seine Schwäche.' },
  drohne: { n: 'ARKON-Späher', hp: 52, atk: 16, def: 15, spd: 16, weak: 'elektro', robot: true, moves: [['laser', 4], ['scan', 1.5], ['schild', 1]], loot: [['schrott', 1, 3, 1], ['chip', 1, 1, 0.22], ['eisen', 1, 1, 0.3]], xp: 40, coins: [2, 8], lore: 'Seriennummer ARK-S. Beobachtet. Meldet. Eliminiert bei Bedarf.' },
  mutant: { n: 'Hirschmutant', hp: 95, atk: 19, def: 10, spd: 10, weak: 'feuer', moves: [['geweih', 4], ['raserei_e', 1], ['saeure', 2]], loot: [['fleisch', 2, 3, 0.9], ['knochen', 2, 3, 0.8], ['gift', 1, 1, 0.5], ['chip', 1, 1, 0.08]], xp: 50, coins: [2, 8], lore: 'Einst ein Hirsch. ARKON hat etwas mit ihm gemacht. Die Haut ist durchsichtig, das Geweih aus Metall.' },
  // ─── BOSSE ───
  alpha: { n: 'Schattenfell', title: 'ALPHA DES RUDELS', boss: true, img: 'wolf', tint: 'shadow', lv: 7, hp: 120, atk: 13, def: 7, spd: 17, moves: [['schattenbiss', 4], ['rudelruf', 1], ['blutrausch', 1.5]], loot: [['zahn', 3, 3, 1], ['fell', 4, 4, 1]], gear: ['wolfsdolch'], xp: 120, coins: [20, 30], lore: 'Der größte Wolf, den du je gesehen hast. Schwarzes Fell, ein Auge milchig weiß. Er führt das Rudel seit Jahren.', intro: 'Ein Schatten löst sich aus der Dunkelheit…' },
  grimmzahn: { n: 'Grimmzahn', title: 'DER HÖHLENBÄR', boss: true, lv: 11, hp: 290, atk: 23, def: 13, spd: 6, moves: [['pranke', 4], ['bruellen', 1], ['erdbeben', 1.5], ['fressen', 1]], loot: [['kralle', 2, 2, 1], ['fell', 5, 5, 1], ['raketenteil1', 1, 1, 1]], xp: 260, coins: [30, 45], lore: 'Er bewacht eine leuchtende Treibstoffzelle wie einen Schatz. Ein ARKON-Halsband steckt tief in seinem Fell.', intro: 'Die Kristalle flackern. Ein Grollen, tiefer als die Höhle selbst…' },
  varga: { n: 'Varga', title: 'KÖNIG DER KÜSTE', boss: true, human: true, lv: 13, hp: 240, atk: 27, def: 12, spd: 14, moves: [['doppelhieb', 4], ['rauchbombe', 1], ['bande', 1.5], ['siegeswille', 1], ['messerhagel', 1.2]], loot: [['konserve', 3, 3, 1], ['stoff', 4, 4, 1]], gear: [], items: ['militaerrucksack'], bp: 'arkonserum', xp: 300, coins: [80, 120], lore: 'Ehemaliger ARKON-Sicherheitschef. Jetzt herrscht er mit seiner Bande über die Küste.', intro: '„Noch ein Versuchskaninchen, das sich verlaufen hat?"' },
  w7: { n: 'Wächter W-7', title: 'ARKON-KAMPFEINHEIT', boss: true, robot: true, weak: 'elektro', lv: 16, hp: 330, atk: 30, def: 22, spd: 14, moves: [['laser', 4], ['schild', 1], ['scan', 1], ['overload', 1.3], ['reparatur', 1]], loot: [['chip', 3, 3, 1], ['schrott', 5, 5, 1], ['stahl', 2, 2, 1], ['raketenteil2', 1, 1, 1]], bp: 'schockstab', xp: 420, coins: [40, 60], lore: 'Eine Kampfmaschine auf vier Beinen. Ihr Auftrag: Subjekte von den Ruinen fernhalten.', intro: 'EINDRINGLING ERKANNT. SUBJEKT #247. PROTOKOLL: NEUTRALISIEREN.' },
  frostherz: { n: 'Frostherz', title: 'DER YETI', boss: true, weak: 'feuer', resist: 'eis', lv: 18, hp: 430, atk: 34, def: 18, spd: 9, moves: [['eisfaust', 4], ['blizzard', 1.4], ['eispanzer', 1], ['bruellen', 1]], loot: [['kristall', 4, 4, 1], ['fell', 6, 6, 1]], gear: ['frostklinge', 'frostherz'], xp: 520, coins: [40, 60], lore: 'Eine Legende. Drei Meter Muskeln und Eis. In seiner Brust pulsiert ein blaues Herz.', intro: 'Der Schnee hört auf zu fallen. Totenstille. Dann: Schritte, die den Berg erschüttern.' },
  subjekt246: { n: 'Subjekt #246', title: 'DER VERLORENE', boss: true, human: true, lv: 21, hp: 460, atk: 31, def: 20, spd: 18, moves: [['klinge246', 4], ['erinnerung', 1.2], ['adrenalin_e', 1], ['todesstoss_e', 1.3]], loot: [['raketenteil3', 1, 1, 1], ['heiltrank', 2, 2, 1]], gear: ['arkonmarke'], bp: 'arkonanzug', xp: 700, coins: [60, 90], lore: 'Er war vor dir hier. Er hat die Notizen geschrieben. Und irgendwann hat er aufgehört, ein Mensch zu sein.', intro: '„Du… du bist der Neue. #247. Sie haben dich geschickt, um mich zu ersetzen."',
    lines: { 0.7: '„Ich habe auch gekämpft. Jeden Tag. 300 Tage lang."', 0.4: '„Sie beobachten uns, verstehst du? Das hier ist kein Wald. Es ist ein Käfig."', 0.15: '„Nimm den Kern… und drück den Knopf NICHT…"' } },
  prometheus: { n: 'PROMETHEUS', title: 'ARKON-KERNSYSTEM', boss: true, robot: true, final: true, weak: 'elektro', lv: 26, hp: 650, atk: 36, def: 26, spd: 15, moves: [['plasma', 4], ['drohnen', 1.5], ['matrix', 1], ['omega', 1.3], ['nano', 1]], loot: [], xp: 1500, coins: [200, 300], lore: 'Die künstliche Intelligenz hinter dem Experiment. Dr. Voss nennt es „den Beobachter".', intro: 'DR. VOSS: „Beeindruckend, #247. Aber das Experiment endet, wenn ICH es sage."',
    lines: { 0.75: 'DR. VOSS: „Deine Werte sind… außergewöhnlich. Weiter so."', 0.5: 'PROMETHEUS: PHASE 2. KAMPFPARAMETER ERHÖHT.', 0.2: 'DR. MARSH (Funk): „Halte durch! Sein Kern überhitzt!"' } },
};
const BOSS_ORDER = ['alpha', 'grimmzahn', 'varga', 'w7', 'frostherz', 'subjekt246', 'prometheus'];

// ═══════════════ KAMPF-FÄHIGKEITEN ═══════════════
const BASIC = {
  faust: { n: 'Faustschlag', pow: 85 },
  keule: { n: 'Hieb', pow: 100, fx: { betaeubt: [0.12, 1] } },
  messer: { n: 'Schnitt', pow: 95, crit: 6, fx: { blutung: [0.28, 3] } },
  speer: { n: 'Stich', pow: 105, pierce: 0.35 },
  axt: { n: 'Spalter', pow: 118, acc: 92, fx: { betaeubt: [0.14, 1] } },
  schwert: { n: 'Klingenhieb', pow: 110, crit: 8 },
  bogen: { n: 'Pfeilschuss', pow: 108, crit: 6, ammo: 'pfeile' },
  elektro: { n: 'Schock', pow: 110, el: 'elektro', fx: { betaeubt: [0.2, 1] } },
  eis: { n: 'Frosthieb', pow: 118, el: 'eis', fx: { verlangsamt: [0.4, 2] } },
};
const SKILLS = {
  kraftschlag: { n: 'Kraftschlag', lv: 1, ap: 6, pow: 150, d: 'Wuchtiger Schlag. 150% Schaden.' },
  kriegsschrei: { n: 'Kriegsschrei', lv: 3, ap: 5, self: { stark: 3 }, d: '+35% Angriff für 3 Runden.' },
  sandwurf: { n: 'Sand in die Augen', lv: 5, ap: 4, pow: 30, fx: { blind: [1, 2] }, d: 'Gegner trifft 2 Runden schlechter.' },
  konter: { n: 'Konterhaltung', lv: 7, ap: 5, self: { konter: 1 }, d: 'Nächster Treffer halbiert & zurückgeschlagen.' },
  doppelschlag: { n: 'Doppelschlag', lv: 9, ap: 8, pow: 72, hits: 2, d: 'Zwei schnelle Treffer à 72%.' },
  fackelhieb: { n: 'Fackelhieb', lv: 12, ap: 8, pow: 115, el: 'feuer', fx: { brand: [0.7, 3] }, d: 'Feuerschaden + Brand. Stark gegen Eis & Insekten.' },
  ersthilfe: { n: 'Erste Hilfe', lv: 14, ap: 10, heal: 0.22, cure: ['blutung'], d: 'Heilt 22% (+INT) und stoppt Blutung.' },
  schwachstelle: { n: 'Schwachstelle', lv: 17, ap: 6, self: { fokus: 1 }, d: 'Nächster Angriff: garantierter Volltreffer.' },
  raserei: { n: 'Raserei', lv: 20, ap: 12, pow: 225, recoil: 0.08, d: '225% Schaden, kostet 8% eigene LP.' },
  adrenalin: { n: 'Adrenalinstoß', lv: 24, ap: 0, once: true, heal: 0.12, gainAp: 18, d: '1x pro Kampf: +18 Ausdauer, +12% LP.' },
  wirbelsturm: { n: 'Wirbelsturm', lv: 28, ap: 14, pow: 170, fx: { blutung: [0.6, 3] }, d: '170% + Blutung.' },
  todesstoss: { n: 'Todesstoß', lv: 33, ap: 15, pow: 120, exec: 0.35, d: 'Unter 35% LP des Gegners: 300% Schaden.' },
  urschrei: { n: 'Urschrei', lv: 40, ap: 16, heal: 0.15, self: { stark: 3, panzer: 3 }, d: 'Heilung + Stärke + Panzer.' },
};

// ═══════════════ GEHEIMNISSE & STORY ═══════════════
const SECRETS = {
  schuh: { t: 'Alte Schuhspur', x: 'Im weichen Boden: der Abdruck eines Stiefels. Profil: militärisch. Größe 44.\n\nJemand war hier vor dir.', k: 'info' },
  kamera: { t: 'Kamera entdeckt!', x: 'An einem Baum über dem Bach, getarnt mit Moos: eine Kamera.\n\nDas Objektiv folgt deinen Bewegungen.\nEin rotes Licht blinkt.\n\nWer beobachtet dich?', k: 'arkon' },
  rohr: { t: 'Metallrohr', x: 'Ein Metallrohr ragt aus dem Sumpf. Zu gleichmäßig, um natürlich zu sein. Es summt leise.\n\nDarunter ist etwas begraben. Etwas Großes.', k: 'info' },
  notiz1: { t: 'NOTIZBUCH #1', x: 'Handschrift. Zerknittert.\n\n„Tag 12. Ich glaube, ich werde beobachtet. Heute fand ich eine Kamera hinter dem großen Felsen.\n\nWer auch immer das liest:\nVertrau dem Wasser nicht.\nBau ein Feuer. Jeden Abend.\n\n— Subjekt #246"', k: 'note' },
  boje: { t: 'Messboje', x: 'Mitten auf dem See treibt eine Boje. Aufschrift:\n\nARKON · UMWELTSENSOR 07\nTEMPERATUR: KONTROLLIERT\nWETTER: SIMULATION AKTIV', k: 'arkon' },
  kameraanlage: { t: 'Kameraanlage', x: 'Zwischen den Farnen: ein ganzes Kamerasystem. Hochauflösend. Automatisch.\n\nAuf einem kleinen Display: DEIN GESICHT.\nDarunter: „SUBJEKT #247 · VITALWERTE STABIL"', k: 'arkon' },
  vogelscheuche: { t: 'Vogelscheuche', x: 'Eine Vogelscheuche in einem ARKON-Laborkittel. Im Kittel ein Ausweis:\n\n„Dr. Elena Marsh · Verhaltensforschung"\n\nDas Foto wurde zerkratzt.', k: 'info' },
  kiste: { t: 'Angespülte Kiste', x: 'Eine Metallkiste, an den Strand gespült. Graviertes Logo:\n\nARKON INSTITUTE\n„Survival is not luck. It\'s data."\n\nInnen: leer. Nur ein Zettel: „Lieferung #247 – Startausrüstung: KEINE"', k: 'arkon' },
  notiz_moor: { t: 'NOTIZBUCH · MOOR', x: '„Tag 89. Die Grenzen verschieben sich. Gestern war der Nebel hier, heute dort. Der Wald… lädt nach.\n\nIch habe einen Wächter gesehen. Vier Beine. Rote Augen. Er hat mich nicht angegriffen. Er hat mich GEZÄHLT."', k: 'note' },
  bunker: { t: 'Bunker-Eingang!', x: 'Hinter dem Lager des Bären: eine Stahltür. Sie ist offen.\n\nDrinnen: Bildschirme. Überall Bildschirme.\nSie zeigen dich. Deinen Schlafplatz. Deine Träume?\n\nEtikett: ARKON INSTITUTE · FELDPROTOKOLL 247', k: 'arkon' },
  sender: { t: 'Sendeturm', x: 'Ein rostiger Sendeturm auf dem Gipfel. Aktiv.\n\nEin Display zeigt: „UPLINK → ARKON ZENTRALE · 247 DATENPAKETE/SEK"\n\nJemand empfängt hier ALLES.', k: 'arkon' },
  notiz2: { t: 'NOTIZBUCH #2', x: 'Maschinenschrift. Offizielles Dokument, gefroren im Eis.\n\n„ARKON Institute — Feldprotokoll 7\nSubjekt #247 zeigt überdurchschnittliche Adaptionsfähigkeit.\nExperiment-Phase 2 wird eingeleitet.\nSchwierigkeitsgrad: ERHÖHT\n\nAnmerkung: Subjekt darf die Rakete unter keinen Umständen vor Abschluss finden."', k: 'note' },
  hinweis: { t: 'Die alte Händlerin', x: 'Mira, die Händlerin, flüstert:\n\n„Geh nicht in die tote Stadt. Sie warten dort auf dich.\n\nAber wenn du musst… sammle die drei Teile. Die Rakete ist echt.\nIch habe sie brennen sehen. Vor vielen Jahren. Und dann kam der Nebel zurück."', k: 'note' },
  notiz3: { t: 'NOTIZBUCH #3', x: 'Blutverschmiert. Letzte Seiten.\n\n„Sie wissen, dass ich die Wahrheit kenne. Die Rakete funktioniert. Aber sie fliegt nicht nach draußen. Sie öffnet eine TÜR.\n\nDrück den Knopf nicht. Oder doch. Ich weiß es nicht mehr.\n\n— Dr. Elena Marsh"', k: 'note' },
};
const RADIO = [
  { t: 'SIGNAL 1/3 · ENTSCHLÜSSELT', x: '[RAUSCHEN] …Phase 2 läuft. #247 hat die Werkbank gebaut, schneller als alle vor ihm. Voss ist zufrieden. Er will mehr Druck. Mehr Wölfe. Längere Winter. [RAUSCHEN]' },
  { t: 'SIGNAL 2/3 · ENTSCHLÜSSELT', x: '[RAUSCHEN] …hier spricht Dr. Elena Marsh. Wenn du das hörst, #247: Die Wächter sind nicht unbesiegbar. Elektrizität überlastet ihre Schaltkreise. Und der Yeti im Norden – Feuer. Immer Feuer. [RAUSCHEN]' },
  { t: 'SIGNAL 3/3 · ENTSCHLÜSSELT', x: '[RAUSCHEN] …Koordinaten der Sperrzone: nördlich der toten Stadt. Du brauchst alle drei Raketenteile, sonst lässt dich das Tor nicht durch. Ich warte auf dich. Beeil dich. Voss wird nervös. [SIGNAL VERLOREN]' },
];

// ═══════════════ HAUPTQUESTS ═══════════════
// g(G) -> [aktuell, ziel] · hint: Tipp · rw: Belohnung
const QUESTS = [
  { id: 'q_aeste', t: 'Erwachen', d: 'Sammle 6 Äste.', hint: 'Tippe auf „Äste sammeln".', tab: 'act', g: G => [G.stats.got_aeste || 0, 6], rw: { xp: 10 } },
  { id: 'q_steine', t: 'Steinzeit', d: 'Sammle 4 Steine.', hint: 'Tippe auf „Steine suchen". Mit Glück findest du Feuerstein.', tab: 'act', g: G => [G.stats.got_steine || 0, 4], rw: { xp: 10 } },
  { id: 'q_wasser', t: 'Durst', d: 'Erkunde den Klarbach und schöpfe Wasser.', hint: 'Im Wald gibt es kein Wasser! KARTE → Klarbach (östlich) antippen → Erkunden → Wasser schöpfen.', tab: 'map', g: G => [G.stats.got_wasser ? 1 : 0, 1], rw: { xp: 25 } },
  { id: 'q_waffe', t: 'Bewaffnet', d: 'Baue einen Knüppel und rüste ihn aus.', hint: 'BAUEN → Herstellen → Knüppel. Dann TASCHE → ausrüsten.', tab: 'craft', g: G => [G.equip.waffe ? 1 : 0, 1], rw: { xp: 15 } },
  { id: 'q_lager', t: 'Ein Dach über dem Kopf', d: 'Baue einen Unterschlupf.', hint: 'BAUEN → Gebäude → Unterschlupf. Wo du ihn baust, steht dein Lager – am Bach hast du Wasser, im Wald Holz.', tab: 'craft', g: G => [G.bld.unterschlupf ? 1 : 0, 1], rw: { xp: 20, items: { fasern: 4 } } },
  { id: 'q_feuer', t: 'Feuer!', d: 'Baue ein Lagerfeuer.', hint: 'Finde Feuerstein beim Steinesuchen, dann BAUEN → Lagerfeuer.', tab: 'craft', g: G => [G.bld.lagerfeuer ? 1 : 0, 1], rw: { xp: 25, items: { aeste: 6 } } },
  { id: 'q_kampf', t: 'Jäger', d: 'Gewinne 3 Kämpfe.', hint: 'AKTION → „Auf die Jagd gehen". Nutze VERTEIDIGEN, wenn ein Tier zum Angriff ansetzt!', tab: 'act', g: G => [G.stats.wins || 0, 3], rw: { xp: 40, items: { heilkraut: 2 } } },
  { id: 'q_werkbank', t: 'Handwerker', d: 'Baue eine Werkbank.', hint: 'Du brauchst eine Steinaxt für Holz. BAUEN → Werkbank.', tab: 'craft', g: G => [G.bld.werkbank ? 1 : 0, 1], rw: { xp: 50 } },
  { id: 'q_lv5', t: 'Überlebender', d: 'Erreiche Level 5.', hint: 'Kämpfe, sammle, baue. Verteile deine Attributpunkte im HELD-Tab!', tab: 'hero', g: G => [Math.min(G.lv, 5), 5], rw: { xp: 0, items: { heiltrank: 1 } } },
  { id: 'q_dorf', t: 'Spuren', d: 'Erkunde das Verlassene Dorf.', hint: 'KARTE → Verlassenes Dorf (nördlich vom Wald).', tab: 'map', g: G => [G.seen.includes(6) ? 1 : 0, 1], rw: { xp: 60 } },
  { id: 'q_haendler', t: 'Ein Lebenszeichen', d: 'Finde das Händlerdorf.', hint: 'Es liegt nordwestlich. Folge dem Rauch.', tab: 'map', g: G => [G.seen.includes(16) ? 1 : 0, 1], rw: { xp: 60, coins: 20 } },
  { id: 'q_schmiede', t: 'Eisenzeit', d: 'Baue eine Schmiede und schmiede einen Eisenbarren.', hint: 'Erz gibt es im Graufels (Spitzhacke nötig). Kohle auch aus Holz am Feuer.', tab: 'craft', g: G => [(G.bld.schmiede ? 1 : 0) + ((G.stats.craft_eisen || 0) > 0 ? 1 : 0), 2], rw: { xp: 100 } },
  { id: 'q_alpha', t: 'Der Alpha', d: 'Besiege Schattenfell im Schattenwald.', hint: 'Empfohlen: Level 7+. Bring Verbände gegen Blutung mit.', tab: 'map', g: G => [G.bossDown.alpha ? 1 : 0, 1], rw: { xp: 0 } },
  { id: 'q_teil1', t: 'Raketenteil 1', d: 'Besiege Grimmzahn in der Tiefen Höhle.', hint: 'Empfohlen: Level 11+. Verteidige dich, wenn er die Pranken hebt!', tab: 'map', g: G => [G.bossDown.grimmzahn ? 1 : 0, 1], rw: { xp: 0 } },
  { id: 'q_teil2', t: 'Raketenteil 2', d: 'Zerstöre Wächter W-7 in den Alten Ruinen.', hint: 'Empfohlen: Level 16+. Elektrizität überlastet ihn.', tab: 'map', g: G => [G.bossDown.w7 ? 1 : 0, 1], rw: { xp: 0 } },
  { id: 'q_teil3', t: 'Raketenteil 3', d: 'Stelle Subjekt #246 in der Toten Stadt.', hint: 'Empfohlen: Level 21+. Er ist wie du – nur verzweifelter.', tab: 'map', g: G => [G.bossDown.subjekt246 ? 1 : 0, 1], rw: { xp: 0 } },
  { id: 'q_final', t: 'Das Ende des Experiments', d: 'Dringe in die ARKON-Sperrzone ein und besiege PROMETHEUS.', hint: 'Die Sperrzone öffnet sich mit allen 3 Raketenteilen – nördlich der Toten Stadt.', tab: 'map', g: G => [G.bossDown.prometheus ? 1 : 0, 1], rw: { xp: 0 } },
];

// ═══════════════ TAGESAUFTRÄGE ═══════════════
const DAILY = [
  { id: 'd_gather', t: 'Sammle {n} Ressourcen', k: 'gathered', n: [15, 30], xp: 30 },
  { id: 'd_kills', t: 'Gewinne {n} Kämpfe', k: 'wins', n: [2, 4], xp: 45 },
  { id: 'd_craft', t: 'Stelle {n} Gegenstände her', k: 'crafted', n: [3, 6], xp: 30 },
  { id: 'd_cook', t: 'Koche {n} Mahlzeiten', k: 'cooked', n: [2, 4], xp: 30 },
  { id: 'd_travel', t: 'Reise {n}× zu anderen Waben', k: 'travels', n: [2, 4], xp: 30 },
  { id: 'd_eat', t: 'Iss {n} Mal', k: 'ate', n: [3, 6], xp: 20 },
  { id: 'd_crit', t: 'Lande {n} Volltreffer', k: 'crits', n: [2, 5], xp: 35 },
  { id: 'd_train', t: 'Trainiere {n}×', k: 'trained', n: [2, 3], xp: 35, req: G => G.bld.trainingsplatz },
  { id: 'd_fish', t: 'Fange {n} Fische', k: 'got_fisch', n: [2, 4], xp: 35, req: G => G.inv.angel > 0 },
  { id: 'd_dmg', t: 'Verursache {n} Schaden', k: 'dmg', n: [150, 400], xp: 40 },
];

// ═══════════════ ERFOLGE (bleiben über Spielstände erhalten) ═══════════════
const ACH = [
  { id: 'a_fire', i: '🔥', n: 'Prometheus\' Erbe', d: 'Entfache dein erstes Lagerfeuer.', c: G => G.bld.lagerfeuer },
  { id: 'a_kill1', i: '⚔️', n: 'Erstes Blut', d: 'Gewinne deinen ersten Kampf.', c: G => G.stats.wins >= 1 },
  { id: 'a_kill25', i: '🗡️', n: 'Jäger', d: 'Gewinne 25 Kämpfe.', c: G => G.stats.wins >= 25 },
  { id: 'a_kill100', i: '💀', n: 'Apex-Raubtier', d: 'Gewinne 100 Kämpfe.', c: G => G.stats.wins >= 100 },
  { id: 'a_day3', i: '🌙', n: 'Drei Nächte', d: 'Überlebe 3 Tage.', c: G => G.day >= 4 },
  { id: 'a_day7', i: '📅', n: 'Eine Woche Wildnis', d: 'Überlebe 7 Tage.', c: G => G.day >= 8 },
  { id: 'a_day14', i: '🏕️', n: 'Einheimisch', d: 'Überlebe 14 Tage.', c: G => G.day >= 15 },
  { id: 'a_day30', i: '👑', n: 'Legende der Wildnis', d: 'Überlebe 30 Tage.', c: G => G.day >= 31 },
  { id: 'a_winter', i: '❄️', n: 'Winterhart', d: 'Überlebe einen Winter.', c: G => G.stats.winters >= 1 },
  { id: 'a_lv10', i: '⭐', n: 'Abgehärtet', d: 'Erreiche Level 10.', c: G => G.lv >= 10 },
  { id: 'a_lv25', i: '🌟', n: 'Veteran', d: 'Erreiche Level 25.', c: G => G.lv >= 25 },
  { id: 'a_lv50', i: '💫', n: 'Übermensch', d: 'Erreiche Level 50.', c: G => G.lv >= 50 },
  { id: 'a_crit', i: '💥', n: 'Volltreffer!', d: 'Verursache 100+ Schaden mit einem Schlag.', c: G => G.stats.maxhit >= 100 },
  { id: 'a_crit2', i: '☄️', n: 'Vernichter', d: 'Verursache 300+ Schaden mit einem Schlag.', c: G => G.stats.maxhit >= 300 },
  { id: 'a_flawless', i: '✨', n: 'Unberührbar', d: 'Gewinne einen Kampf ohne Schaden zu nehmen (Lv 5+ Gegner).', c: G => G.stats.flawless >= 1 },
  { id: 'a_map', i: '🗺️', n: 'Kartograph', d: 'Entdecke alle 19 normalen Waben.', c: G => G.seen.filter(i => i < 19).length >= 19 },
  { id: 'a_steel', i: '🔷', n: 'Stahlzeit', d: 'Schmiede einen Stahlbarren.', c: G => (G.stats.craft_stahl || 0) >= 1 },
  { id: 'a_legend', i: '🟧', n: 'Legendär', d: 'Besitze einen legendären Gegenstand.', c: G => G.gear.some(x => GEAR[x.id].r >= 4) },
  { id: 'a_rich', i: '🪙', n: 'Händlerseele', d: 'Besitze 500 Münzen.', c: G => G.coins >= 500 },
  { id: 'a_chef', i: '🍲', n: 'Wildnis-Koch', d: 'Koche 25 Mahlzeiten.', c: G => G.stats.cooked >= 25 },
  { id: 'a_build', i: '🏗️', n: 'Baumeister', d: 'Errichte 10 verschiedene Gebäude.', c: G => Object.keys(G.bld).filter(k => G.bld[k] > 0).length >= 10 },
  { id: 'a_beast', i: '📖', n: 'Naturforscher', d: 'Fülle 12 Einträge im Bestiarium.', c: (G, M) => Object.keys(M.beast).length >= 12 },
  { id: 'a_secrets', i: '🔎', n: 'Die Wahrheit', d: 'Finde 10 Geheimnisse.', c: G => G.secrets.length >= 10 },
  { id: 'a_radio', i: '📡', n: 'Signal empfangen', d: 'Entschlüssle alle Funksignale.', c: G => G.radio >= 3 },
  { id: 'a_alpha', i: '🐺', n: 'Rudelführer', d: 'Besiege Schattenfell.', c: G => G.bossDown.alpha },
  { id: 'a_grimm', i: '🐻', n: 'Bärenbezwinger', d: 'Besiege Grimmzahn.', c: G => G.bossDown.grimmzahn },
  { id: 'a_varga', i: '🏴‍☠️', n: 'Neuer König', d: 'Besiege Varga.', c: G => G.bossDown.varga },
  { id: 'a_w7', i: '🤖', n: 'Maschinenstürmer', d: 'Zerstöre W-7.', c: G => G.bossDown.w7 },
  { id: 'a_yeti', i: '🧊', n: 'Herz aus Eis', d: 'Besiege Frostherz.', c: G => G.bossDown.frostherz },
  { id: 'a_246', i: '🧟', n: 'Erlösung', d: 'Besiege Subjekt #246.', c: G => G.bossDown.subjekt246 },
  { id: 'a_end1', i: '🚀', n: 'Durch die Tür', d: 'Drücke den Knopf.', c: (G, M) => M.endings.includes('knopf') },
  { id: 'a_end2', i: '🌲', n: 'Hüter des Waldes', d: 'Drücke den Knopf nicht.', c: (G, M) => M.endings.includes('bleiben') },
  { id: 'a_hardcore', i: '☠️', n: 'Hardcore-Legende', d: 'Besiege PROMETHEUS im Hardcore-Modus.', c: G => G.hardcore && G.bossDown.prometheus },
  { id: 'a_death_cold', i: '🥶', n: 'Eiskalt erwischt', d: 'Erfriere.', meta: true },
  { id: 'a_death_thirst', i: '🏜️', n: 'Staubtrocken', d: 'Verdurste.', meta: true },
  { id: 'a_death_hunger', i: '🦴', n: 'Haut und Knochen', d: 'Verhungere.', meta: true },
  { id: 'a_daily', i: '📋', n: 'Pflichtbewusst', d: 'Erledige 15 Tagesaufträge.', c: G => G.stats.dailies >= 15 },
  { id: 'a_trainer', i: '🏋️', n: 'Eiserner Wille', d: 'Trainiere 25 Mal.', c: G => G.stats.trained >= 25 },
  { id: 'a_mushroom', i: '🤢', n: 'Falscher Pilz', d: 'Vergifte dich an rohem Essen.', c: G => G.stats.sick >= 1 },
];

// ═══════════════ HÄNDLERIN MIRA ═══════════════
const TRADE_POOL = [
  ['wasser', 4, 3], ['braten', 10, 2], ['konserve', 18, 2], ['trockenfleisch', 12, 3], ['heilkraut', 6, 4], ['verband', 9, 3], ['heiltrank', 26, 2],
  ['gegengift', 22, 2], ['pfeile', 2, 12], ['seil', 6, 5], ['feuerstein', 9, 3], ['kohle', 6, 5], ['eisenerz', 9, 4], ['eisen', 20, 3], ['leder', 14, 3],
  ['harz', 6, 3], ['honig', 12, 2], ['brandbombe', 24, 2], ['kraftelixier', 45, 1], ['eisenhaut', 45, 1], ['naegel', 3, 10], ['stahl', 55, 1], ['chip', 120, 1],
  ['steinaxt', 18, 1], ['spitzhacke', 22, 1], ['angel', 18, 1], ['fackel', 12, 1], ['kompass', 60, 1], ['fellbeutel', 25, 1], ['rucksack', 70, 1],
];
const TRADE_GEAR = ['eisenmesser', 'eisenspeer', 'bogen', 'lederruestung', 'eisenhelm', 'eisenschwert', 'federamulett', 'zahnkette', 'stahlklinge', 'eisenruestung'];
const SEASONS = [{ n: 'FRÜHLING', i: '🌱', t: 12 }, { n: 'SOMMER', i: '☀️', t: 22 }, { n: 'HERBST', i: '🍂', t: 9 }, { n: 'WINTER', i: '❄️', t: -6 }];
const SEASON_LEN = 5;
const WEATHER = {
  klar: { n: 'Klar', i: '☀️', t: 2 }, wolkig: { n: 'Bewölkt', i: '☁️', t: 0 }, regen: { n: 'Regen', i: '🌧️', t: -3, rain: 1 },
  gewitter: { n: 'Gewitter', i: '⛈️', t: -4, rain: 2 }, nebel: { n: 'Nebel', i: '🌫️', t: -2, fog: 1 }, schnee: { n: 'Schnee', i: '🌨️', t: -6, snow: 1 },
};
