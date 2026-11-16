// le carnet d'idées : chaque fausse piste, tentation et folie, réussie et ratée ; chaque maladresse en conversation
global.window = global; global.RPG_ABSENTS = []; global.RPG_FAITS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','idees','folie']) require('../src/' + f + '.js');
const MAUVAIS = /undefined|NaN|\[object|\{[A-Za-z]{1,8}\}|\bnull\b|  +«|«\s*»/;
let n = 0, ko = 0, jets = 0, mal = 0, banal = 0; const notes = [];
function partie(ch, sort) {
  let v = sort; const rng = () => v; const sc = CHAPTERS[ch];
  const g = RPG.createGame(sc, null, { rng, pc: JSON.parse(JSON.stringify((sc.pregens || CHAPTERS.londres.pregens)[0])) });
  if (ch === 'londres') g.state.min = 1440 + 20 * 60; if (ch === 'paris') g.state.min = 6 * 1440 + 11 * 60;
  Object.keys(sc.locations).forEach(k => { g.api.flag('known:' + k, true); g.api.flag('connu:' + k, true); });
  g.api.flag('carteMusee', 0); g.api.flag('carteBN', true);
  return g;
}
function lire(g, b, ctx) { g.state.log.filter(e => e.n > b && typeof e.x === 'string').forEach(e => { if (!e.x.trim() || MAUVAIS.test(e.x)) { ko++; notes.push(ctx + ' → ' + e.x.slice(0, 120)); } }); }
for (const ch of ['prologue', 'londres', 'paris']) {
  const sc = CHAPTERS[ch];
  const toutes = []; Object.keys(sc.locations).forEach(l => (sc.locations[l].actions || []).forEach(a => { if (/^(fausse|risque|folie)$/.test(a.ideaKind || '')) toutes.push([l, a]); }));
  (sc.globalActions || []).forEach(a => { if (/^(fausse|risque|folie)$/.test(a.ideaKind || '')) toutes.push([null, a]); });
  for (const [l, a] of toutes) for (const sort of [0.01, 0.99]) {
    const g = partie(ch, sort); const loc = l || (ch === 'prologue' ? 'restaurant' : 'hotel');
    try { if (g.state.loc !== loc) g.api.go(loc); } catch (e) { ko++; notes.push('arrivée ' + loc + ' ' + e.message); continue; }
    if (a.cond && !a.cond(g.api)) { g.api.s.min += 0; }
    const b = g.state.seq;
    try { g.choose({ label: a.idea, action: a.id }); n++; if (g.state.pending) { jets++; g.roll(); } } catch (e) { ko++; notes.push('PLANTAGE ' + ch + ' ' + a.id + ' ' + e.message); continue; }
    lire(g, b, ch + ' ' + a.id + ' ' + sort);
  }
  // les maladresses et les banalités, personnage par personnage
  for (const id of Object.keys(sc.npcs)) {
    const npc = sc.npcs[id]; const ex = sc.paroles && sc.paroles(partie(ch, 0.5).api, npc); if (!ex) continue;
    for (const m of ex.maladresse.concat(ex.banal)) {
      const g = partie(ch, 0.5);
      const ta = Object.keys(sc.locations).map(k => [k, (sc.locations[k].actions || []).find(a => a.talkTo === id)]).find(x => x[1]);
      if (!ta) continue;
      try { if (g.state.loc !== ta[0]) g.api.go(ta[0]); g.state.pending = null; g.state.talk = id; g.api.npcs(id).met = true; } catch (e) { continue; }
      const b = g.state.seq;
      try { if (m.mal) { g.choose({ label: m.label, mal: m.mal }); mal++; } else if (m.cult) { g.choose({ label: m.label, say: m.say, cult: m.cult }); banal++; } else { g.step(m.say, 'dire'); m.say && (ex.banal.indexOf(m) >= 0 ? banal++ : mal++); } } catch (e) { ko++; notes.push('PLANTAGE parole ' + ch + ' ' + id + ' ' + m.label + ' ' + e.message); continue; }
      lire(g, b, ch + ' ' + id + ' « ' + m.label + ' »');
      const rep = g.state.log.filter(e => e.n > b && (e.t === 'npc' || e.t === 'narr' || e.t === 'event')).length;
      if (!rep) { ko++; notes.push('SANS RÉPONSE ' + ch + ' ' + id + ' « ' + m.label + ' »'); }
    }
  }
}
notes.slice(0, 30).forEach(x => console.log(x));
console.log('idées jouées ' + n + ' (dont ' + jets + ' jets) | maladresses ' + mal + ' | banalités ' + banal + ' | problèmes ' + ko);
