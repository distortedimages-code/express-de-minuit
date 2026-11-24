// Réfléchir (le jet d'Idée) doit toujours souffler une piste concrète, à chaque étape de Paris et de Poissy :
// on fait avancer l'enquête drapeau par drapeau, et le conseil doit changer en route, sans jamais manquer.
global.window = global;
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
const P = CHAPTERS.paris;
const g = RPG.createGame(P, null, { rng: () => 0.5, pc: P.pregens[0] }), A = g.api;
const etapes = [
  ['départ', () => {}],
  ['carte', () => A.flag('carteBN', true)],
  ['Rémi rencontré', () => { A.npcs('remi').met = true; }],
  ['Rémi engagé', () => A.flag('remiJour', 1)],
  ['Arsenal connu', () => A.flag('connu:arsenal', true)],
  ['Malon', () => { A.clue('MALON'); A.flag('connu:poissy', true); }],
  ['Rigault', () => { A.clue('RIGAULT'); A.flag('connu:charenton', true); }],
  ['Delplace', () => A.clue('DELPLACE')],
  ['Charenton vu', () => { g.state.visited.charenton = true; }],
  ['registres', () => { A.flag('registresOuverts', true); A.clue('REGISTRE'); }],
  ['Mandrin', () => A.clue('MANDRIN')],
  ['Lorien connu', () => A.flag('connu:lorien', true)],
  ['Lorien vu', () => A.flag('lorienVu', true)],
  ['fouille permise', () => A.flag('fouilleOK', true)],
  ['le bras', () => g.state.inv.push('Le Bras gauche du Simulacre')]
];
let ko = 0, avant = null; const vus = new Set();
for (const [nom, faire] of etapes) {
  faire();
  const c = P.jets && P.jets.idee ? P.jets.idee(A) : null;
  if (!c || !c.x) { ko++; console.log('SANS CONSEIL à l’étape « ' + nom + ' »'); continue; }
  vus.add(c.x);
  if (c.x === avant && !/Rémi rencontré|Charenton vu/.test(nom)) console.log('   (même conseil qu’avant à « ' + nom + ' »)');
  avant = c.x;
}
if (vus.size < 10) { ko++; console.log('trop peu de conseils différents : ' + vus.size); }
console.log('conseils de Paris : ' + vus.size + ' différents sur ' + etapes.length + ' étapes | problèmes ' + ko);
process.exitCode = ko ? 1 : 0;
