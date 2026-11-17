// Les suites des répliques (« ce qui est sur la table ») : pour chaque sujet qui en porte, dans chaque chapitre,
// on joue le sujet puis chaque suite par ses mots ; la réponse doit venir de la table, sans plantage.
// Le rapport compte aussi les sujets sans suites, chapitre par chapitre (ce qu'il reste à écrire).
global.window = global; global.RPG_ABSENTS = []; global.RPG_TABLE = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','idees','folie']) require('../src/' + f + '.js');
const CH = { prologue: window.SCENE, londres: CHAPTERS.londres, paris: CHAPTERS.paris };
let ko = 0, n = 0; const couverture = {};
for (const [ch, sc] of Object.entries(CH)) {
  couverture[ch] = { avec: 0, sans: 0 };
  for (const [id, npc] of Object.entries(sc.npcs)) for (const t of npc.topics || []) {
    if (!t.suites) { couverture[ch].sans++; continue; }
    couverture[ch].avec++;
    for (let rep = 0; rep < 3; rep++) {
      const g0 = RPG.createGame(sc, null, sc.pregens ? { rng: () => 0.4, pc: JSON.parse(JSON.stringify(sc.pregens[0])) } : { rng: () => 0.4 });
      g0.state.talk = id; const st0 = g0.api.npcs(id); st0.asked[t.id] = rep;
      const tab = typeof t.suites === 'function' ? t.suites(g0.api, rep) : Array.isArray(t.suites) ? t.suites[Math.min(rep, t.suites.length - 1)] : t.suites;
      if (!tab) continue;
      for (const k of Object.keys(tab).filter(x => x[0] !== '_')) {
        const e = tab[k];
        if (!e.prendre && !e.demander && !e.parler) { ko++; console.log('SUITE SANS RÉPONSE', ch, id, t.id, k); continue; }
        const mot = String(e.mots || k).split(',')[0].trim();
        const g = RPG.createGame(sc, null, sc.pregens ? { rng: () => 0.4, pc: JSON.parse(JSON.stringify(sc.pregens[0])) } : { rng: () => 0.4 });
        try {
          if (npc.loc) g.api.go(npc.loc);
          g.state.talk = id; g.api.npcs(id).asked[t.id] = rep; g.state.pending = null;
          g.choose({ label: t.chip || t.id, topic: t.id }); while (g.state.pending) g.roll();
          if (g.state.talk !== id) continue; // la conversation s'est close (un jet, un départ) : rien à vérifier
          RPG_TABLE.length = 0; const avant = g.state.log.length;
          g.step(e.prendre ? mot : 'et ' + mot + ' ?', 'dire'); while (g.state.pending) g.roll(); n++;
          const pris = RPG_TABLE.some(x => x.k === k);
          if (!pris) { ko++; console.log('SUITE NON PRISE', ch, id, t.id + '#' + rep, k, '«', mot, '» →', g.state.log.slice(avant).filter(x => typeof x.x === 'string' && x.t !== 'player').map(x => x.x).join(' ').slice(0, 120)); }
        } catch (err) { ko++; console.log('PLANTAGE', ch, id, t.id, k, err.message); }
      }
    }
  }
}
console.log('couverture :', JSON.stringify(couverture));
console.log('suites jouées', n, '| problèmes', ko);
