// chaque mot français courant : le jeu le prend-il pour un autre ? (rapprochement approximatif vers un mot d'un autre lemme)
global.window = global;
const R = __dirname + '/../../src/';
['engine', 'scene', 'londres', 'londres_circuits', 'londres_combat', 'parole', 'fiches', 'jets', 'londres_seance', 'londres_impro', 'londres_objets'].forEach(f => require(R + f + '.js'));
const FR = require(__dirname + '/fr.json');
const res = { faux: [], memeLemme: 0, exact: 0, inconnu: 0 }, bons = {};
const score = require(__dirname + '/score.js');
const seen = {};
// les formes régulières d'un verbe du lexique (« file » est une forme de « filer », même si le dictionnaire y voit un nom)
const CJ = {};
function conjugue(f) {
  if (CJ[f]) return CJ[f];
  const out = new Set([f, f + 's', f + 'x', f + 'e', f + 'es']);
  let m;
  if ((m = f.match(/^(.+)er$/))) ['e', 'es', 'ent', 'ons', 'ez', 'ais', 'ait', 'aient', 'ions', 'iez', 'e', 'ee', 'es', 'ees', 'ant', 'a', 'as', 'ai', 'erai', 'eras', 'era', 'erons', 'erez', 'eront', 'erais', 'erait', 'erions', 'eriez', 'eraient', 'asse', 'at'].forEach(x => out.add(m[1] + x));
  if ((m = f.match(/^(.+)ir$/))) ['is', 'it', 'issons', 'issez', 'issent', 'issais', 'issait', 'issant', 'i', 'ie', 'ies', 'irai', 'ira', 'irez'].forEach(x => out.add(m[1] + x));
  if ((m = f.match(/^(.+)re$/))) ['s', 't', 'ons', 'ez', 'ent', 'ais', 'ait', 'ant', 'u', 'ue', 'us', 'rai', 'ra', 'rez'].forEach(x => out.add(m[1] + x));
  return (CJ[f] = out);
}
for (const ch of ['prologue', 'londres']) {
  const g = RPG.createGame(CHAPTERS[ch], null, { rng: Math.random });
  const lex = g.lex;
  // formes du lexique, avec leur lemme
  const forms = {}; lex.entries.forEach(e => { forms[e.form] = e; });
  for (const w in FR) {
    if (lex.exact[w]) { res.exact++; continue; }
    const b = lex.best(w);
    if (!b) { res.inconnu++; continue; }
    // quelle forme du lexique a gagné ?
    let win = null, ws = 0;
    for (const e of lex.entries) { if (e.id !== b.id) continue; const sc = score(w, e); if (sc > ws) { ws = sc; win = e; } }
    const lw = FR[w], lf = win ? (FR[win.form] || win.form) : '?';
    if (win && (lw === lf || lw === win.form || conjugue(win.form).has(w))) { res.memeLemme++; bons[w] = 1; continue; }
    const k = w + '>' + b.id;
    if (seen[k]) continue; seen[k] = 1;
    res.faux.push([w, b.id, win ? win.form : '?', b.score.toFixed(2), ch]);
  }
}
console.log('exacts', res.exact, 'même lemme', res.memeLemme, 'inconnus', res.inconnu, 'confusions', res.faux.length);
require('fs').writeFileSync(__dirname + '/faux.json', JSON.stringify(res.faux));
require('fs').writeFileSync(__dirname + '/bons.json', JSON.stringify(bons));
console.log(res.faux.slice(0, 80).map(x => x[0] + '→' + x[1] + '(' + x[2] + ')').join('  '));
