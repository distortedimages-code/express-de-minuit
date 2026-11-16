// « Demander à l'accueil s'ils ont vu l'homme… », « sortir pour trouver l'homme… » : une question indirecte n'est pas
// un récit du passé, et le but d'un déplacement nu est le vrai geste. Cas vécus au banquet et à l'hôtel de Londres.
global.window = global; global.RPG_ABSENTS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','idees','folie']) require('../src/' + f + '.js');
const L = CHAPTERS.londres; let ko = 0;
function partie() { const g = RPG.createGame(L, null, { rng: () => 0.1, pc: JSON.parse(JSON.stringify(L.pregens[0])) }); g.choose({ label: 'Écouter la conférence', action: 'i_conf' }); while (g.state.pending) g.roll(); return g; }
function dit(g, cmd) { const n = g.state.log.length; g.step(cmd); while (g.state.pending) g.roll(); return g.state.log.slice(n).filter(e => typeof e.x === 'string').map(e => e.x).join(' '); }
const cas = [
  ['institut', 'Demander à l’accueil si ils ont vu l’homme à la moustache', g => g.state.flags.moustachuSuivi && g.state.loc === 'institut', 'la filature'],
  ['institut', 'Sortir pour trouver l’homme à la moustache', g => g.state.flags.moustachuSuivi && g.state.loc === 'institut', 'la filature, sans quitter le banquet'],
  ['institut', 'je demande au portier s’il a vu un homme à moustache', g => g.state.flags.moustachuSuivi, 'la filature'],
  ['hotel', 'Demander à l’accueil si ils ont vu l’homme à la moustache', (g, t) => g.state.talk === 'concierge' && /moustache/.test(t), 'le concierge répond sur l’homme'],
  ['hotel', 'Sortir pour trouver l’homme à la moustache', (g, t) => /piste/.test(t) && g.state.loc === 'hotel', 'il faut une piste'],
  ['institut', 'j’ai déjà parlé à Smith tout à l’heure', (g, t) => /fait est fait|repensez|passé ne se rejoue/i.test(t), 'un vrai récit du passé reste un récit']
];
for (const [ou, cmd, ok, attendu] of cas) {
  const g = partie(); if (ou === 'hotel') dit(g, 'Rentrer à l’hôtel');
  const t = dit(g, cmd);
  if (!ok(g, t)) { ko++; console.log('RATÉ', ou, JSON.stringify(cmd), '— attendu :', attendu, '\n   →', t.slice(0, 200)); }
}
console.log('questions indirectes : cas', cas.length, '| ratés', ko);
