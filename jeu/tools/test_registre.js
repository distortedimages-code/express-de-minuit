// Le registre des savoirs, vérifié sans jouer (rapide, lancé par build.py) :
//   - chaque sujet de conversation déclare ce qu'il exige (sait) ou se dit libre ;
//   - chaque savoir cité (sait, apprend, par) existe dans le chapitre ;
//   - chaque déclaration vise un sujet, une action, un lieu ou un personnage qui existe ;
//   - chaque mot verrouillé (concepts) est un mot du lexique.
// node test/registre.js [--carte] : --carte écrit en plus la carte des savoirs (savoirs.md).
'use strict';
global.window = global; global.RPG_ABSENTS = []; global.RPG_PROCES = [];
for (const f of ['engine', 'scene', 'londres', 'londres_circuits', 'londres_combat', 'mots', 'dico', 'mj', 'humeur', 'parole', 'fiches', 'jets', 'londres_seance', 'londres_impro', 'londres_objets', 'paris', 'poissy', 'lausanne', 'lausanne_reve', 'objets', 'idees', 'folie']) require('../src/' + f + '.js');
const STD = /^(poli|aurevoir|toimeme|etat|insulte|embrasser|danser|chanter|manger|meta|heure|psy|flatter|baratin|menacer|persuader|argent|boisson|merci|bonjour)$/;
const CH = { prologue: global.SCENE, londres: CHAPTERS.londres, paris: CHAPTERS.paris, lausanne: CHAPTERS.lausanne };
let fautes = 0; const carte = [];
for (const [nom, scene] of Object.entries(CH)) {
  if (!scene) continue;
  const g = RPG.createGame(scene, null, scene.pregens ? { pc: JSON.parse(JSON.stringify(scene.pregens[0])) } : {});
  const S = scene.savoirs || {}, existe = id => !!(S[id] || (scene.clues && scene.clues[id]));
  const err = m => { fautes++; console.log('REGISTRE ' + nom + ' : ' + m); };
  if (!scene.savoirs) err('pas de registre (scene.savoirs)');
  (scene._declInconnues || []).forEach(k => err('déclaration sans cible : ' + k));
  Object.keys(S).forEach(id => {
    (S[id].par || []).forEach(p => { if (!existe(p)) err('savoir ' + id + ' : par ' + p + ' inconnu'); });
    (S[id].concepts || []).forEach(c => { if (!g.concept(c)) err('savoir ' + id + ' : le mot ' + c + ' n’est pas au lexique'); });
    if (S[id].mots && !(S[id].mots instanceof RegExp)) err('savoir ' + id + ' : mots doit être une expression');
  });
  const refs = (x, ou) => ['sait', 'apprend', 'chipSait'].forEach(k => {
    const v = x && x[k]; if (!v || typeof v === 'function') return;
    [].concat(v).forEach(e => String(e).split('|').forEach(id => { if (!existe(id)) err(ou + ' › ' + k + ' ' + id + ' inconnu'); }));
  });
  const ouvre = {};
  Object.keys(scene.npcs || {}).forEach(q => (scene.npcs[q].topics || []).forEach(t => {
    refs(t, q + '/' + t.id);
    if (!STD.test(t.id) && t.sait === undefined && !t.libre) err('sujet non déclaré : ' + q + '/' + t.id + (t.chip ? ' (« ' + t.chip + ' »)' : ''));
    if (Array.isArray(t.sait)) t.sait.forEach(k => String(k).split('|').forEach(id => (ouvre[id] = ouvre[id] || []).push((scene.npcs[q].name || q) + (t.chip ? ' : « ' + t.chip + ' »' : ' : ' + t.id))));
  }));
  const acts = (scene.globalActions || []).concat(...Object.values(scene.locations || {}).map(l => l.actions || []));
  acts.forEach(a => { refs(a, 'action ' + a.id); if (Array.isArray(a.sait)) a.sait.forEach(k => String(k).split('|').forEach(id => (ouvre[id] = ouvre[id] || []).push('« ' + a.label + ' »'))); });
  Object.keys(scene.locations || {}).forEach(l => refs(scene.locations[l], 'lieu ' + l));
  Object.keys(scene.npcs || {}).forEach(q => refs(scene.npcs[q], 'pnj ' + q));
  carte.push('## ' + nom.charAt(0).toUpperCase() + nom.slice(1) + '\n');
  Object.keys(S).forEach(id => {
    const d = S[id], de = [].concat(d.par || []).map(p => (scene.clues[p] ? 'l’indice « ' + scene.clues[p].title + ' »' : p));
    if (scene.clues[id]) de.unshift('l’indice « ' + scene.clues[id].title + ' »');
    carte.push('- **' + d.label + '** (' + id + ')' + (de.length ? ' — s’apprend par ' + de.join(', ') : '') + (d.quand ? (de.length ? ' ; ' : ' — ') + 'ou sur place, ou par ceux qui en parlent' : '') +
      (ouvre[id] ? '\n  - ouvre : ' + [...new Set(ouvre[id])].join(' ; ') : ''));
  });
  carte.push('');
}
if (process.argv.includes('--carte')) require('fs').writeFileSync(__dirname + '/../savoirs.md', '# La carte des savoirs\n\nCe que le personnage peut apprendre, et ce que chaque savoir ouvre. Fabriqué par `node test/registre.js --carte`.\n\n' + carte.join('\n') + '\n');
console.log(fautes ? fautes + ' faute(s) dans le registre des savoirs.' : 'Registre des savoirs : complet.');
process.exitCode = fautes ? 1 : 0;
