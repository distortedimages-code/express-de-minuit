// chaque mot français courant : le jeu le prend-il pour un autre ? (rapprochement approximatif vers un mot d'un autre lemme)
global.window = global;
const R = __dirname + '/../../src/';
['engine', 'scene', 'londres', 'londres_circuits', 'londres_combat', 'parole', 'fiches', 'jets', 'londres_seance', 'londres_impro', 'londres_objets'].forEach(f => require(R + f + '.js'));
const FR = require(__dirname + '/fr.json');
const res = { faux: [], memeLemme: 0, exact: 0, inconnu: 0 }, bons = {};
const score = require(__dirname + '/score.js');
const seen = {};
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
    if (win && (lw === lf || lw === win.form)) { res.memeLemme++; bons[w] = 1; continue; }
    const k = w + '>' + b.id;
    if (seen[k]) continue; seen[k] = 1;
    res.faux.push([w, b.id, win ? win.form : '?', b.score.toFixed(2), ch]);
  }
}
console.log('exacts', res.exact, 'même lemme', res.memeLemme, 'inconnus', res.inconnu, 'confusions', res.faux.length);
require('fs').writeFileSync(__dirname + '/faux.json', JSON.stringify(res.faux));
require('fs').writeFileSync(__dirname + '/bons.json', JSON.stringify(bons));
console.log(res.faux.slice(0, 80).map(x => x[0] + '→' + x[1] + '(' + x[2] + ')').join('  '));
