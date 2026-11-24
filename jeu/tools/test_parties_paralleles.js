// Deux parties dans le même programme, avec la même scène (comme « Rejouer le chapitre », le chapitre suivant ou le testeur IA) :
// les jets improvisés (Réfléchir, Écouter, Trouver Objet Caché sur place, jets sociaux) se résolvent dans la partie qui les lance.
global.window = global;
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
let ko = 0;
for (const ch of ['londres', 'paris']) {
  const SC = CHAPTERS[ch], A = RPG.createGame(SC, null, { rng: () => 0.05, pc: SC.pregens[0] }), B = RPG.createGame(SC, null, { rng: () => 0.05, pc: SC.pregens[1] });
  if (ch === 'paris') { A.choose({ label: 't', action: 'ga_taxi' }); B.choose({ label: 't', action: 'ga_taxi' }); }
  else { for (const g of [A, B]) { g.choose({ label: 'c', action: 'i_conf' }); while (g.state.pending) g.roll(); g.step('je rentre à l’hôtel'); } }
  const nA = A.state.seq, nB = B.state.seq;
  A.choose({ label: 'Réfléchir', reflechir: true }); while (A.state.pending) A.roll();   // A définit le jet improvisé
  B.choose({ label: 'Réfléchir', reflechir: true }); while (B.state.pending) B.roll();   // B le lance ensuite
  const tA = A.state.log.filter(e => e.n > nA && /Une idée vous vient/.test(e.x || '')).length, tB = B.state.log.filter(e => e.n > nB && /Une idée vous vient/.test(e.x || '')).length;
  const ok = tA === 1 && tB === 1;
  if (!ok) ko++;
  console.log((ok ? 'ok   ' : 'RATÉ ') + ch + ' : idées dans A ' + tA + ', dans B ' + tB);
}
console.log('parties en parallèle : problèmes ' + ko);
process.exitCode = ko ? 1 : 0;
