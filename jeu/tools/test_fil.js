// le fil de l'intrigue : on s'égare avec un personnage important, et on regarde comment il y revient
global.window = global; global.RPG_FILS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets']) require('../src/' + f + '.js');
const HORS = ['il fait froid ce soir', 'vous aimez la musique ?', 'quel temps de chien', 'vous avez des enfants ?', 'j’ai mal dormi', 'vous aimez Londres ?', 'belle soirée, non ?', 'vous lisez beaucoup ?', 'la vie est chère', 'vous voyagez souvent ?'];
const CAS = [['prologue', 'restaurant', 'serveur', null], ['prologue', 'restaurant', 'veuve', null], ['londres', 'institut', 'smith', null], ['londres', 'institut', 'smith', g => { g.api.flag('conference', true); g.api.clue('OBSERVATEUR'); }],
  ['londres', 'hotel', 'concierge', g => { g.state.min = 3 * 1440 + 600; }], ['londres', 'yard', 'fleming', g => { g.state.min = 3 * 1440 + 600; }], ['londres', 'vane', 'vane', g => { g.state.min = 1440 + 20 * 60; }], ['londres', 'archives', 'pike', g => { g.state.min = 1440 + 600; }]];
let seed = 7; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const verbose = process.env.V;
for (const [ch, loc, id, prep] of CAS) {
  const sc = CHAPTERS[ch], g = RPG.createGame(sc, null, sc.pregens ? { rng, pc: sc.pregens[0] } : { rng });
  if (prep) prep(g); if (g.state.loc !== loc) g.api.go(loc);
  g.api.talk(id);
  let n0 = RPG_FILS.length, tours = 0;
  console.log('== ' + id + ' (' + loc + ')');
  for (const q of HORS) {
    if (g.state.talk !== id) break;
    const b = g.state.seq; g.step(q); tours++;
    let guard = 0; while (g.state.pending && guard++ < 4) g.roll();
    const out = g.state.log.filter(e => e.n > b && e.t === 'npc');
    if (verbose) { console.log(' > ' + q); out.forEach(e => console.log('     ' + e.x.slice(0, 150))); }
    else out.filter(e => RPG_FILS.some(f => f.who === id && e.x.indexOf(f.x.replace(/\{.*?\}/g, '').slice(0, 20)) >= 0 || RPG_FILS.slice(n0).some(f => f.x.slice(0, 18) === e.x.slice(0, 18)))).forEach(e => console.log('   tour ' + tours + ' : ' + e.x.slice(0, 170)));
    if (g.state.log.some(e => e.n > b && e.t === 'chips')) console.log('   (suggestions affichées au tour ' + tours + ')');
  }
  console.log('   amorces : ' + (RPG_FILS.length - n0) + ' en ' + tours + ' répliques hors sujet' + (g.state.talk === id ? '' : ' (conversation close)'));
}
