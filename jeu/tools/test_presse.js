// les journaux ne savent rien avant l'édition du matin : la conférence (vendredi soir) n'est dans la presse
// que le samedi à l'aube, l'incendie (samedi soir) le dimanche, les meurtres le lundi
global.window = global; global.RPG_ABSENTS = []; global.RPG_FAITS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
const sc = CHAPTERS.londres, H = sc._h; let ko = 0;
function partie(min, flags) {
  const g = RPG.createGame(sc, null, { rng: () => 0.3, pc: JSON.parse(JSON.stringify(sc.pregens[0])) });
  g.state.min = min; Object.assign(g.state.flags, flags || {}); g.state.loc = 'hotel';
  return g;
}
function lire(g) { const n = g.state.log.length; g.step('lire les journaux'); return g.state.log.slice(n).map(e => typeof e.x === 'string' ? e.x : (e.d || e.text || JSON.stringify(e))).join(' '); }
function ok(cond, msg) { if (!cond) { ko++; console.log('ÉCHEC', msg); } }
const at = H.at;
// le soir de la conférence, et la nuit qui suit : rien
for (const [j, h, m] of [[0, 23, 25], [1, 0, 30], [1, 4, 50]]) {
  const t = lire(partie(at(j, h, m), { conference: true }));
  ok(!/Institut|hantises|PROFESSEUR ET LES FANTÔMES/.test(t), `${j} ${h}:${m} la presse parle déjà de la conférence : ${t.slice(0, 120)}`);
}
// samedi matin : le compte rendu
{ const t = lire(partie(at(1, 7, 0), { conference: true })); ok(/FANTÔMES/.test(t), 'samedi matin : pas de compte rendu : ' + t.slice(0, 120)); }
// samedi soir, après l'incendie : pas encore dans le journal ; dimanche matin, oui
{ const g = partie(at(1, 23, 30), { conference: true, presseSam: true }); const t = lire(g); ok(!/FLAMMES/.test(t), 'samedi soir : l’incendie déjà imprimé'); }
{ const g = partie(at(2, 2, 0), { conference: true, presseSam: true }); const t = lire(g); ok(!/FLAMMES/.test(t), 'dimanche 2 h : l’incendie déjà imprimé'); }
{ const g = partie(at(2, 8, 0), { conference: true, presseSam: true }); const t = lire(g); ok(/FLAMMES/.test(t), 'dimanche matin : pas d’incendie'); }
// les meurtres : pas dimanche soir, oui lundi matin
{ const g = partie(at(2, 23, 50), { conference: true, presseSam: true, presseDim: true }); const t = lire(g); ok(!/TROIS FOIS/.test(t), 'dimanche soir : meurtres déjà imprimés'); }
{ const g = partie(at(3, 8, 30), { conference: true, presseSam: true, presseDim: true }); const t = lire(g); ok(/TROIS FOIS/.test(t), 'lundi matin : pas de meurtres'); }
// les rumeurs des personnages suivent la même règle
const R = sc.rumeurs, f = { groupe: 'hotel' };
for (const [cle, avant, apres] of [['CONFERENCE', at(1, 0, 30), at(1, 9, 0)], ['INCENDIE', at(1, 23, 30), at(2, 9, 0)], ['MEURTRES', at(3, 1, 0), at(3, 9, 0)], ['STANLEY', at(4, 2, 0), at(4, 9, 0)]]) {
  ok(!R[cle]({ s: { min: avant }, has: () => false, flag: () => null }, f), cle + ' : la rumeur court avant le journal');
  ok(!!R[cle]({ s: { min: apres }, has: () => false, flag: () => null }, f), cle + ' : la rumeur manque après le journal');
}
console.log('problèmes', ko);
