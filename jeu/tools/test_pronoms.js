// « je regarde la vieille dame », puis « je lui parle » : le jeu se souvient de qui l'on parle
global.window = global;
const R = '../src/';
['engine', 'scene', 'londres', 'londres_circuits', 'londres_combat', 'parole', 'fiches', 'jets', 'londres_seance', 'londres_impro', 'londres_objets'].forEach(f => require(R + f + '.js'));
let seed = 3; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const CAS = [
  ['prologue', ['je regarde la vieille dame', 'je lui parle'], g => g.state.talk === 'veuve'],
  ['prologue', ['j’observe la vieille dame', 'je m’approche d’elle'], g => g.state.talk === 'veuve'],
  ['prologue', ['je regarde le serveur', 'je vais le voir'], g => g.state.talk === 'serveur'],
  ['prologue', ['je regarde le serveur', 'parle-lui'], g => g.state.talk === 'serveur'],
  ['prologue', ['j’examine la table de Ravel', 'je la fouille'], g => (g.state.done.r_table || 0) >= 1 && !g.state.talk],
  ['prologue', ['je regarde la vieille dame', 'j’examine la table de Ravel', 'je lui parle'], g => g.state.talk === 'veuve'],
  ['prologue', ['je me rends dans les wagons lits'], g => g.state.loc === 'couloir'],
  ['londres', ['je parle au professeur', 'au revoir', 'je lui parle'], g => g.state.talk === 'smith']
];
let ok = 0;
CAS.forEach(([ch, cmds, test]) => {
  const sc = CHAPTERS[ch], g = RPG.createGame(sc, null, sc.pregens ? { rng, pc: sc.pregens[0] } : { rng });
  cmds.forEach(c => { g.step(c); let n = 0; while (g.state.pending && n++ < 4) g.roll(); });
  const r = test(g); if (r) ok++; else console.log('ÉCHEC', ch, cmds.join(' / '), '→ talk', g.state.talk, 'loc', g.state.loc);
});
console.log('pronoms', ok + '/' + CAS.length);
