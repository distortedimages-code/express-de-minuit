// Les suites des répliques (« ce qui est sur la table ») : pour chaque sujet qui en porte, dans chaque chapitre,
// on joue le sujet puis chaque suite par ses mots ; la réponse doit venir de la table, sans plantage.
// Le rapport compte aussi les sujets sans suites, chapitre par chapitre (ce qu'il reste à écrire).
global.window = global; global.RPG_ABSENTS = []; global.RPG_TABLE = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
// ce test vérifie les suites, pas le registre : la partie sait déjà tout
const omni = (g, sc) => { g.api.apprendre(Object.keys(sc.savoirs || {})); Object.keys(sc.clues || {}).forEach(c => g.api.apprendre(c)); return g; };
const CH = { prologue: window.SCENE, londres: CHAPTERS.londres, paris: CHAPTERS.paris, lausanne: CHAPTERS.lausanne };
let ko = 0, n = 0; const couverture = {};
for (const [ch, sc] of Object.entries(CH)) {
  couverture[ch] = { avec: 0, sans: 0 };
  for (const [id, npc] of Object.entries(sc.npcs)) for (const t of npc.topics || []) {
    if (!t.suites) { couverture[ch].sans++; continue; }
    couverture[ch].avec++;
    for (let rep = 0; rep < 3; rep++) {
      const g0 = omni(RPG.createGame(sc, null, sc.pregens ? { rng: () => 0.4, pc: JSON.parse(JSON.stringify(sc.pregens[0])) } : { rng: () => 0.4 }), sc);
      g0.state.talk = id; const st0 = g0.api.npcs(id); st0.asked[t.id] = rep;
      const tab = typeof t.suites === 'function' ? t.suites(g0.api, rep) : Array.isArray(t.suites) ? t.suites[Math.min(rep, t.suites.length - 1)] : t.suites;
      if (!tab) continue;
      for (const k of Object.keys(tab).filter(x => x[0] !== '_')) {
        const e = tab[k];
        if (!e.prendre && !e.demander && !e.parler) { ko++; console.log('SUITE SANS RÉPONSE', ch, id, t.id, k); continue; }
        const mot = String(e.mots || k).split(',')[0].trim();
        const g = omni(RPG.createGame(sc, null, sc.pregens ? { rng: () => 0.4, pc: JSON.parse(JSON.stringify(sc.pregens[0])) } : { rng: () => 0.4 }), sc);
        try {
          if (npc.loc) g.api.go(npc.loc);
          g.state.talk = id; g.api.npcs(id).asked[t.id] = rep; g.state.pending = null;
          g.choose({ label: t.chip || t.id, topic: t.id }); while (g.state.pending) g.roll();
          if (g.state.talk !== id) continue; // la conversation s'est close (un jet, un départ) : rien à vérifier
          RPG_TABLE.length = 0; const avant = g.state.log.length;
          // la question (« et la terrine ? »), ou, pour ce qui ne se prend pas, la chose nommée seule (comme le bouton « Crie la nuit »)
          g.step(e.prendre ? mot : (rep === 1 ? mot : 'et ' + mot + ' ?'), 'dire'); while (g.state.pending) g.roll(); n++;
          const pris = RPG_TABLE.some(x => x.k === k);
          if (!pris) { ko++; console.log('SUITE NON PRISE', ch, id, t.id + '#' + rep, k, '«', mot, '» →', g.state.log.slice(avant).filter(x => typeof x.x === 'string' && x.t !== 'player').map(x => x.x).join(' ').slice(0, 120)); }
        } catch (err) { ko++; console.log('PLANTAGE', ch, id, t.id, k, err.message, (err.stack || '').split('\n').slice(1, 4).join(' | ')); }
      }
    }
  }
}
// les suggestions tirées de la table (« La 12 ? », « Thèse ? ») : touchées, elles sont toujours prises par la table
let sug = 0;
for (const [ch, sc] of Object.entries(CH)) for (const [id, npc] of Object.entries(sc.npcs)) for (const t of npc.topics || []) {
  if (!t.suites) continue;
  const mk = () => { const g = omni(RPG.createGame(sc, null, sc.pregens ? { rng: () => 0.4, pc: JSON.parse(JSON.stringify(sc.pregens[0])) } : { rng: () => 0.4 }), sc); if (npc.loc) g.api.go(npc.loc); g.state.talk = id; g.state.pending = null; g.choose({ label: t.chip || t.id, topic: t.id }); while (g.state.pending) g.roll(); return g; };
  let g0; try { g0 = mk(); } catch (e) { continue; } if (g0.state.talk !== id) continue;
  const tab = g0.api.npcs(id).table; if (!tab) continue;
  const lab = new Set(Object.keys(tab.suites).filter(k => k[0] !== '_').map(k => k));
  for (const x of g0.suggestionsParole(4, 'normal').filter(x => x.table)) {
    const g = mk(); if (g.state.talk !== id) continue; RPG_TABLE.length = 0; const avant = g.state.log.length;
    try { g.step(x.say, 'dire'); } catch (e) { ko++; console.log('PLANTAGE suggestion', ch, id, t.id, x.label, e.message); continue; }
    sug++;
    if (!RPG_TABLE.length) { ko++; console.log('SUGGESTION NON PRISE', ch, id, t.id, '«', x.label, '» →', g.state.log.slice(avant).filter(e => typeof e.x === 'string' && e.t !== 'player').map(e => e.x).join(' ').slice(0, 120)); }
  }
}
console.log('suggestions de la table touchées :', sug);
console.log('couverture :', JSON.stringify(couverture));
console.log('suites jouées', n, '| problèmes', ko);
