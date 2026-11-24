// Une sauvegarde de l'ancienne version (Paris finissait au départ pour Poissy) doit reprendre à Poissy,
// et une sauvegarde prise en plein Poissy ou dans le train doit se recharger telle quelle.
global.window = global; global.RPG_ABSENTS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
const P = CHAPTERS.paris; let ko = 0;
const rng = () => 0.3;
// 1. ancienne fin « poissy »
let g = RPG.createGame(P, null, { rng, pc: JSON.parse(JSON.stringify(P.pregens[0])) });
['MALON', 'SCANDALE'].forEach(c => g.api.clue(c));
g.state.ended = true; g.state.flags.fin = 'poissy'; g.state.log.push({ n: 9999, t: 'end', x: 'Fin du chapitre' });
let sauve = JSON.parse(JSON.stringify(g.state));
let g2 = RPG.createGame(P, sauve, { rng, pc: sauve.pc });
if (g2.state.ended || g2.state.loc !== 'po_gare' || g2.state.log.some(e => e.t === 'end')) { ko++; console.log('ancienne fin : non reprise', g2.state.loc, g2.state.ended); }
try { g2.step('je vais à la mairie'); } catch (e) { ko++; console.log('PLANTAGE après reprise', e.message); }
// 2. sauvegarde en plein Poissy, puis dans le train
for (const [loc, h] of [['po_lorien', 15], ['po_jardin', 10], ['oe_compartiment', 23]]) {
  g = RPG.createGame(P, null, { rng, pc: JSON.parse(JSON.stringify(P.pregens[1])) });
  g.api.flag('poissy', true); P.arriverPoissy(g.api);
  if (loc === 'oe_compartiment') { g.api.piece('bras_gauche', 'Le Bras gauche du Simulacre'); g.api.flag('oeDepart', Math.floor(g.state.min / 1440) * 1440 + 22 * 60 + 50); g.api.flag('oe', true); }
  g.state.min = Math.floor(g.state.min / 1440) * 1440 + h * 60; g.api.go(loc);
  sauve = JSON.parse(JSON.stringify(g.state));
  g2 = RPG.createGame(P, sauve, { rng, pc: sauve.pc });
  if (g2.state.loc !== loc || g2.state.ended) { ko++; console.log('rechargement', loc, '→', g2.state.loc, g2.state.ended); }
  try { g2.step('je regarde autour de moi'); } catch (e) { ko++; console.log('PLANTAGE', loc, e.message); }
  if (loc === 'oe_compartiment' && (g2.state.pc.simulacre || []).length !== 1) { ko++; console.log('pièce du Simulacre perdue au rechargement'); }
}
console.log('reprise Poissy : problèmes', ko);
