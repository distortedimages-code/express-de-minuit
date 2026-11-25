// Le censeur, en grand : des centaines de parties par chapitre, jouées surtout en suivant les suggestions,
// comme un vrai joueur, avec du texte libre au hasard et des phrases pièges. Trois contrôles :
//   1. aucune fuite : rien d'affiché ne trahit un savoir que le personnage n'a pas encore (censeur_lib.js) ;
//   2. aucune phrase piège (« je suis mort de faim ») n'ouvre un sujet d'intrigue, même quand on sait l'affaire ;
//   3. le registre est complet : chaque sujet déclare ce qu'il exige (sait) ou se dit libre, chaque savoir cité existe,
//      et chaque savoir s'apprend au moins une fois quelque part.
// node test/censeur.js [chapitre] [--parties N] [--gestes] [--souple]
'use strict';
global.window = global; global.RPG_ABSENTS = []; global.RPG_PROCES = []; global.RPG_SUJETS = [];
// les mêmes pièces, dans le même ordre que le jeu (build.py)
for (const f of ['engine', 'scene', 'londres', 'londres_circuits', 'londres_combat', 'mots', 'dico', 'mj', 'humeur', 'parole', 'fiches', 'jets', 'londres_seance', 'londres_impro', 'londres_objets', 'paris', 'poissy', 'lausanne', 'lausanne_reve', 'objets', 'idees', 'folie']) require('../src/' + f + '.js');
const C = require('./censeur_lib.js'), fs0 = require('fs');
const args = process.argv.slice(2), seul = args.find(a => !a.startsWith('--') && !/^\d+$/.test(a));
const NB = +(args[args.indexOf('--parties') + 1] || 0) || 40, souple = args.includes('--souple');
const J = 1440;

const PIEGES = ['je suis mort de faim', 'je meurs de soif', 'mort de rire !', 'vous me tuez avec vos histoires', 'c’est un crime de servir un thé pareil',
  'quel silence de mort', 'je suis crevé', 'ce brouillard me tue', 'je suis mort de fatigue', 'j’ai eu une peur bleue', 'il fait un froid de canard',
  'je meurs d’envie d’un bon café', 'à mourir d’ennui, ce dîner'];
const STD = /^(poli|aurevoir|toimeme|etat|insulte|embrasser|danser|chanter|manger|meta|heure|psy|flatter|baratin|menacer|persuader|argent|boisson|merci|bonjour)$/;

// les mots tapés au hasard : ceux des tests de hasard (fuzz*.js, ou test_fuzz_*.js dans le dépôt), sinon le lexique du chapitre
function mots(...fs) {
  for (const f of fs) { try { const t = require('fs').readFileSync(__dirname + '/' + f, 'utf8').match(/const words = '([^']*)'/); if (t) return t[1].split(' '); } catch (e) { /* ailleurs */ } }
  return [];
}
function motsDe(g, D) {
  if (D.mots.length) return D.mots;
  D.mots = Object.values(g.lex.concepts).map(c => (c.words || [])[0]).filter(w => w && /^[a-z]+$/.test(w)).concat(['je', 'parle', 'examine', 'prends', 'vais', 'dors', 'pourquoi', 'aide']);
  return D.mots;
}
const CHAPITRES = {
  prologue: { scene: () => global.SCENE, mots: mots('fuzz.js'), pc: () => undefined },
  londres: { scene: () => CHAPTERS.londres, mots: mots('fuzzl.js'), pc: (i) => JSON.parse(JSON.stringify(CHAPTERS.londres.pregens[i % 3])) },
  paris: { scene: () => CHAPTERS.paris, mots: mots('fuzzp.js', 'test_fuzz_paris.js').concat(mots('fuzzpo.js', 'test_fuzz_poissy.js')), pc: (i) => JSON.parse(JSON.stringify(CHAPTERS.paris.pregens[i % 3])) },
  lausanne: { scene: () => CHAPTERS.lausanne, mots: mots('fuzzla.js', 'test_fuzz_lausanne.js'), pc: (i) => { const pc = JSON.parse(JSON.stringify(CHAPTERS.lausanne.pregens[i % 3])); pc.passe = { paris: { titre: 'Paris', fin: 'ok', min: 10 * J + 400, indices: ['LETTRE'], drapeaux: { lettre: true } } }; pc.inv = ['Le Bras gauche du Simulacre']; return pc; } }
};

let seed = 11; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const piegesRates = [], erreurs = [];

function jouer(nom, i) {
  const D = CHAPITRES[nom], scene = D.scene(); if (!scene) return;
  const pc = D.pc(i), g = RPG.createGame(scene, null, pc ? { rng, pc } : { rng }), s = g.state;
  C.surveiller(g, nom + '#' + i); motsDe(g, D);
  for (let k = 0; k < 260 && !s.ended; k++) {
    try {
      if (s.pending) { g.roll(); continue; }
      if (s.pendingPush) { rng() < 0.5 ? g.push() : g.declinePush(); continue; }
      const r = rng();
      if (s.talk && r < 0.07) {
        // une phrase piège : elle ne doit ouvrir aucun sujet d'intrigue
        const ph = PIEGES[Math.floor(rng() * PIEGES.length)], avant = RPG_SUJETS.length, qui = s.talk;
        g.step(ph, 'dire');
        RPG_SUJETS.slice(avant).filter(x => x.intrigue).forEach(x => piegesRates.push({ chapitre: nom, phrase: ph, qui, sujet: x.sujet }));
        continue;
      }
      if (r < 0.62) {
        const l = s.talk ? g.suggestionsParole(5, 'normal') : g.ideas(4);
        const c = l && l.length ? l[Math.floor(rng() * l.length)] : null;
        if (c) {
          if (c.cult) g.choose({ label: c.label, say: c.say, cult: c.cult });
          else if (c.say) g.step(c.say, 'dire');
          else if (c.mal) g.choose({ label: c.label, mal: c.mal });
          else g.choose(c);
          continue;
        }
      }
      if (r < 0.7 && s.talk) { g.api.endTalk(false); continue; }
      const n = 1 + Math.floor(rng() * 4), cmd = Array.from({ length: n }, () => D.mots[Math.floor(rng() * D.mots.length)]).join(' ');
      g.step(cmd, rng() < 0.4 ? 'dire' : undefined);
    } catch (e) { erreurs.push(nom + ' : ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
}

function registre(nom) {
  const scene = CHAPITRES[nom].scene(); if (!scene) return { manque: [], inconnus: [] };
  const S = scene.savoirs || {}, connus = id => !!(S[id] || (scene.clues && scene.clues[id]));
  const manque = [], inconnus = [];
  function refs(x, ou) {
    ['sait', 'apprend'].forEach(k => {
      const v = x && x[k]; if (!v || typeof v === 'function') return;
      [].concat(v).forEach(e => String(e).split('|').forEach(id => { if (!connus(id)) inconnus.push(ou + ' › ' + k + ' ' + id); }));
    });
  }
  Object.keys(S).forEach(id => (S[id].par || []).forEach(p => { if (!connus(p)) inconnus.push('savoir ' + id + ' › par ' + p); }));
  (scene._declInconnues || []).forEach(k => inconnus.push('déclaration sans cible : ' + k));
  Object.keys(scene.npcs || {}).forEach(q => (scene.npcs[q].topics || []).forEach(t => {
    refs(t, q + '/' + t.id);
    if (!STD.test(t.id) && t.sait === undefined && !t.libre) manque.push(q + '/' + t.id + (t.chip ? ' (« ' + t.chip + ' »)' : ''));
  }));
  const acts = (scene.globalActions || []).concat(...Object.values(scene.locations || {}).map(l => l.actions || []));
  acts.forEach(a => refs(a, 'action ' + a.id));
  (Object.keys(scene.fils || {})).forEach(q => (scene.fils[q] || []).forEach((f, i) => refs(f, 'fil ' + q + '#' + i)));
  return { manque, inconnus, savoirs: Object.keys(S) };
}

// les parties écrites d'avance (test/*.txt) : elles vont loin dans l'intrigue, là où le hasard n'arrive pas
const SCRIPTS = { prologue: /^(portes\d|conv2)\.txt$/, paris: /^p\d\.txt$/, londres: /^(full|partie_londres|base2?|eau\d|absurde1|l\d+b?|c\d+|conv[134]|seance\d|objets\d|impro2|jets1)\.txt$/ };
function scripts(nom) {
  if (!SCRIPTS[nom]) return;
  const fs = require('fs');
  fs.readdirSync(__dirname).filter(f => SCRIPTS[nom].test(f)).sort().forEach((f, i) => {
    const D = CHAPITRES[nom], pc = D.pc(i), g = RPG.createGame(D.scene(), null, pc ? { rng, pc } : { rng }), s = g.state;
    C.surveiller(g, f);
    fs.readFileSync(__dirname + '/' + f, 'utf8').split('\n').filter(Boolean).forEach(c => {
      if (s.ended || c.startsWith('#')) return;
      try {
        if (c.startsWith('!go ')) { if (s.talk) g.api.endTalk(false); g.api.go(c.slice(4)); }
        else if (c.startsWith('!chip ')) g.choose({ label: c.slice(6), action: c.slice(6) });
        else if (c.startsWith('!topic ')) g.choose({ label: c.slice(7), topic: c.slice(7) });
        else if (c.startsWith('!js ')) eval(c.slice(4));
        else g.step(c);
        let n = 0; while (s.pending && n++ < 6) g.roll();
      } catch (e) { erreurs.push(f + ' : ' + e.stack.split('\n').slice(0, 2).join(' | ')); }
    });
  });
}
// les parcours complets (test/parcours_*.js) : chaque partie qu'ils créent passe sous le censeur
function parcours(nom) {
  // (dans le dépôt, les tests s'appellent test_parcours_*.js)
  const f = ({ paris: ['parcours_paris.js', 'test_parcours_paris.js'], lausanne: ['parcours_lausanne.js', 'test_parcours_lausanne.js'] }[nom] || []).find(x => fs0.existsSync(__dirname + '/' + x)); if (!f) return;
  const cg = RPG.createGame, ex = process.exit, log = console.log;
  RPG.createGame = function () { const g = cg.apply(this, arguments); C.surveiller(g, f); return g; };
  process.exit = () => { throw new Error('__fin__'); }; console.log = () => {};
  try { require('./' + f); } catch (e) { if (e.message !== '__fin__') erreurs.push(f + ' : ' + e.message); }
  finally { RPG.createGame = cg; process.exit = ex; console.log = log; process.exitCode = 0; }
}
// le hasard, mais à partir d'un point avancé de la partie écrite : on rejoue le début de full.txt (ou p1.txt…),
// puis on joue au hasard. C'est là qu'on vérifie les savoirs de la fin du chapitre.
const AVANCE = { londres: ['full.txt', 'partie_londres.txt'], paris: ['p1.txt'], prologue: ['portes1.txt'] };
function depuis(nom, i) {
  const f = (AVANCE[nom] || []).find(x => fs0.existsSync(__dirname + '/' + x)); if (!f) return;
  const lignes = require('fs').readFileSync(__dirname + '/' + f, 'utf8').split('\n').filter(l => l && !l.startsWith('#'));
  const D = CHAPITRES[nom], pc = D.pc(i), g = RPG.createGame(D.scene(), null, pc ? { rng, pc } : { rng }), s = g.state;
  const coupe = Math.floor(rng() * lignes.length);
  lignes.slice(0, coupe).forEach(c => {
    if (s.ended) return;
    try {
      if (c.startsWith('!go ')) { if (s.talk) g.api.endTalk(false); g.api.go(c.slice(4)); }
      else if (c.startsWith('!chip ')) g.choose({ label: c.slice(6), action: c.slice(6) });
      else if (c.startsWith('!topic ')) g.choose({ label: c.slice(7), topic: c.slice(7) });
      else if (c.startsWith('!js ')) eval(c.slice(4));
      else g.step(c);
      let n = 0; while (s.pending && n++ < 6) g.roll();
    } catch (e) { /* le début d'une partie écrite */ }
  });
  C.surveiller(g, f + ' jusqu’à la ligne ' + coupe + ', puis au hasard'); motsDe(g, D);
  for (let k = 0; k < 160 && !s.ended; k++) {
    try {
      if (s.pending) { g.roll(); continue; }
      if (s.pendingPush) { g.declinePush(); continue; }
      const l = s.talk ? g.suggestionsParole(5, 'normal') : g.ideas(4), c = l && l.length && rng() < 0.75 ? l[Math.floor(rng() * l.length)] : null;
      if (c) { if (c.cult) g.choose({ label: c.label, say: c.say, cult: c.cult }); else if (c.say) g.step(c.say, 'dire'); else if (c.mal) g.choose({ label: c.label, mal: c.mal }); else g.choose(c); continue; }
      if (s.talk && rng() < 0.3) { g.api.endTalk(false); continue; }
      const n = 1 + Math.floor(rng() * 3), cmd = Array.from({ length: n }, () => D.mots[Math.floor(rng() * D.mots.length)]).join(' ');
      g.step(cmd, rng() < 0.4 ? 'dire' : undefined);
    } catch (e) { erreurs.push(nom + ' (avancé) : ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
}
const noms = seul ? [seul] : Object.keys(CHAPITRES);
noms.forEach(nom => { scripts(nom); parcours(nom); for (let i = 0; i < NB; i++) { jouer(nom, i); depuis(nom, i); } });

console.log('Censeur : ' + C.parties + ' parties (' + noms.join(', ') + ').');
const fuites = C.rapport({ gestes: args.includes('--gestes'), max: +(args[args.indexOf('--max') + 1] || 0) || 60 });
let manques = 0, inconnus = 0;
noms.forEach(nom => {
  const R = registre(nom);
  manques += R.manque.length; inconnus += R.inconnus.length;
  R.inconnus.forEach(x => console.log('SAVOIR INCONNU ' + nom + ' : ' + x));
  if (R.manque.length) console.log('NON DÉCLARÉS ' + nom + ' : ' + R.manque.length + (args.includes('--liste') ? '\n   ' + R.manque.join('\n   ') : ''));
  const jamais = (R.savoirs || []).filter(id => !C.APPRIS[nom + ':' + id]);
  if (jamais.length) console.log('JAMAIS APPRIS ' + nom + ' : ' + jamais.join(', '));
});
piegesRates.slice(0, 20).forEach(p => console.log('PIÈGE ' + p.chapitre + ' : « ' + p.phrase + ' » a ouvert ' + p.qui + '/' + p.sujet));
[...new Set(erreurs)].slice(0, 12).forEach(e => console.log('ERREUR ' + e));
console.log('Fuites : ' + fuites.length + ' · pièges ratés : ' + piegesRates.length + ' · sujets non déclarés : ' + manques + ' · savoirs inconnus : ' + inconnus + ' · erreurs : ' + erreurs.length);
if (fuites.length || piegesRates.length || inconnus || erreurs.length || (manques && !souple)) process.exitCode = 1;
