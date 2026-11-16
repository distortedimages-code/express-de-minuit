// Paris, de la gare du Nord au train de Poissy : un joueur méthodique, avec des dés ordinaires.
// On vérifie que le chapitre se termine toujours, en combien de jours, et avec quels indices.
global.window = global; global.RPG_ABSENTS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','idees']) require('../src/' + f + '.js');
const P = CHAPTERS.paris, J = 1440;
let ok = 0, ko = 0; const jours = [], indices = [], notes = [];
for (let seed0 = 1; seed0 <= 20; seed0++) for (let pi = 0; pi < 3; pi++) {
  let seed = seed0 * 7919 + pi; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const g = RPG.createGame(P, null, { rng, pc: P.pregens[pi] }), s = g.state, A = g.api;
  const roll = () => { let n = 0; while (s.pending && n++ < 8) g.roll(); };
  const act = id => { if (s.ended) return; g.choose({ label: id, action: id }); roll(); };
  const top = id => { if (s.ended || !s.talk) return; g.choose({ label: id, topic: id }); roll(); };
  const dire = x => { if (s.ended) return; g.step(x, 'dire'); roll(); };
  const fin = () => { if (s.talk) A.endTalk(false); };
  const h = () => Math.floor((s.min % J) / 60);
  const dodo = () => { fin(); if (s.loc !== 'hotel') act('go_hotel'); const d0 = Math.floor(s.min / J), h0 = h(); act('ph_dormir'); if (Math.floor(s.min / J) === d0 && h0 >= 8) act('ph_journee'); };
  let garde = 0;
  try {
    act('ga_taxi'); dodo();
    // la carte
    while (!A.flag('carteBN') && garde++ < 12) { if (s.loc !== 'bn') act('go_bn'); if (s.loc !== 'bn') { dodo(); continue; } act('bn_gaudry'); top('carte'); fin(); if (!A.flag('carteBN')) dodo(); }
    // la Nationale
    garde = 0;
    while (!A.has('RIGAULT') && garde++ < 40) {
      if (s.loc !== 'bn') act('go_bn'); if (s.loc !== 'bn' || h() >= 16) { dodo(); continue; }
      if (A.flag('remiJour') !== Math.floor(s.min / J)) { act('bn_remi'); top('travail'); dire('d’accord'); fin(); }
      act('bn_chercher');
    }
    garde = 0;
    while (!A.has('DELPLACE') && garde++ < 20) { if (s.loc !== 'bn') act('go_bn'); if (s.loc !== 'bn' || h() >= 16) { dodo(); continue; } act('bn_journaux'); }
    // l'Arsenal
    garde = 0;
    while (!A.has('MALON') && garde++ < 30) { if (s.loc !== 'arsenal') act('go_arsenal'); if (s.loc !== 'arsenal' || h() >= 15) { dodo(); continue; } act('ar_chercher'); }
    // Charenton
    garde = 0;
    while (!s.visited.charenton && garde++ < 6) { act('go_charenton'); if (s.loc !== 'charenton') dodo(); }
    act('ch_rogniat'); top('registres'); fin();
    garde = 0; while (!A.has('REGISTRE') && garde++ < 6 && s.loc === 'charenton') act('ch_registres');
    if (s.loc === 'charenton') { act('ch_rogniat'); top('leroux'); if (s.talk === 'leroux') { top('asile'); top('delplace'); top('delplace'); } fin(); }
    if (s.loc === 'charenton') act('ch_guetter');
    if (s.talk === 'mandrin') { top('delplace'); top('patient'); top('parole'); top('guimart'); fin(); }
    dodo();
    garde = 0; while (!s.ended && garde++ < 6) { act('go_poissy'); if (!s.ended) act('go_poissy'); if (!s.ended) dodo(); }
  } catch (e) { notes.push('PLANTAGE graine ' + seed0 + ' pj ' + pi + ' : ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  if (s.ended && s.flags.fin === 'poissy') { ok++; jours.push(Math.floor(s.min / J) - Math.floor(P.start.min / J)); indices.push(s.clues.length); }
  else { ko++; notes.push('NON TERMINÉ graine ' + seed0 + ' pj ' + pi + ' @' + s.loc + ' ' + g.clock() + ' indices ' + s.clues.join(',') + ' fin ' + s.flags.fin); }
}
notes.slice(0, 10).forEach(n => console.log(n));
const moy = a => (a.reduce((x, y) => x + y, 0) / (a.length || 1)).toFixed(1);
console.log('parcours Paris : terminés ' + ok + ' / ' + (ok + ko) + ' | jours passés : ' + Math.min(...jours) + ' à ' + Math.max(...jours) + ' (moyenne ' + moy(jours) + ') | indices : ' + Math.min(...indices) + ' à ' + Math.max(...indices) + ' (moyenne ' + moy(indices) + ') sur ' + Object.keys(P.clues).length + ' | absents ' + RPG_ABSENTS.length);
