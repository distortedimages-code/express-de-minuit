// Joue Londres jusqu'au train de Douvres (test/full.txt) et écrit la partie finie au format des sauvegardes du jeu.
// Usage : PC=0 node test/fin_londres.js sortie.json    — le fichier se recharge avec « Charger une sauvegarde ».
global.window = global;
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','idees']) require('../src/' + f + '.js');
const L = CHAPTERS.londres;
let seed = +(process.env.SEED || 1); const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const g = RPG.createGame(L, null, { rng, pc: L.pregens[+(process.env.PC || 0)] }), s = g.state;
const cmds = require('fs').readFileSync(__dirname + '/full.txt', 'utf8').split('\n').filter(Boolean);
for (const c of cmds) {
  if (s.ended) break;
  if (c.startsWith('#')) continue;
  if (c.startsWith('!go ')) { if (s.talk) g.api.endTalk(false); g.api.go(c.slice(4)); }
  else if (c.startsWith('!chip ')) g.choose({ label: c.slice(6), action: c.slice(6) });
  else if (c.startsWith('!topic ')) g.choose({ label: c.slice(7), topic: c.slice(7) });
  else if (c.startsWith('!js ')) eval(c.slice(4));
  else g.step(c);
  let n = 0; while (s.pending && n++ < 6) g.roll();
}
if (!s.ended) { console.error('la partie ne s’est pas terminée'); process.exit(1); }
const out = process.argv[2] || 'londres_fini.json';
require('fs').writeFileSync(out, JSON.stringify({ format: 'express-minuit', version: 1, enregistre: new Date().toISOString(), resume: 'Londres · ' + s.pc.name + ' · ' + g.clock() + ' (fin du chapitre)', state: s }));
console.log('écrit', out, '|', s.pc.name, '| fin', s.flags.fin || 'ok', '|', g.clock(), '| indices', s.clues.length, '| SAN', s.pc.san, '| argent', g.api.money(), '| drapeaux', L.memoire.filter(k => s.flags[k] !== undefined).map(k => k + '=' + s.flags[k]).join(' '));
