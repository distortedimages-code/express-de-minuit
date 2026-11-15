// les horaires : la nuit et le dimanche, les lieux et les gens ne sont pas toujours là
global.window = global;
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets']) require('../src/' + f + '.js');
const L = CHAPTERS.londres;
function essai(titre, min, loc, cmds, prep) {
  let seed = 9; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const g = RPG.createGame(L, null, { rng, pc: L.pregens[0] });
  g.api.flag('conference', true); ['yard','islington','stoke','camberwell','ambassade','chelsea','cheapside','vane'].forEach(k => g.api.flag('known:' + k, true));
  g.state.min = min; if (prep) prep(g); g.api.go(loc);
  console.log('== ' + titre + ' (' + g.clock() + ')');
  for (const c of cmds) { const b = g.state.seq; g.step(c); const o = g.state.log.filter(e => e.n > b && (e.t === 'narr' || e.t === 'npc' || e.t === 'loc')).map(e => e.t === 'loc' ? '[→ ' + e.name + ']' : e.x).join(' | '); console.log('  > ' + c + '\n      ' + o.slice(0, 200)); }
}
const J = 1440;
essai('Samedi soir, tard', 1 * J + 23 * 60 + 10, 'hotel', ['je vais acheter des fournitures', 'je vais au British Museum', 'je vais à Stoke Newington', 'je vais à Scotland Yard', 'je veux voir l’inspecteur Fleming', 'j’achète un journal']);
essai('Dimanche après-midi', 2 * J + 15 * 60, 'hotel', ['j’achète une lampe et une corde', 'je vais au British Museum', 'je vais à l’ambassade de Turquie', 'je vais à Islington', 'je parle au buraliste']);
essai('Lundi matin', 3 * J + 10 * 60, 'hotel', ['j’achète une lampe et une corde', 'je vais à Scotland Yard', 'je veux voir l’inspecteur Fleming']);
essai('Dimanche soir à St John’s Wood', 2 * J + 21 * 60, 'stjohn', ['je parle au laitier', 'je parle à l’agent']);
