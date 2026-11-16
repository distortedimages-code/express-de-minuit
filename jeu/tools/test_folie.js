// quand la raison lâche : répliques déréglées, délires en conversation, fin par la folie, soins
global.window = global; global.RPG_ABSENTS = []; global.RPG_FAITS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','idees','folie']) require('../src/' + f + '.js');
const MAUVAIS = /undefined|NaN|\[object|\{[A-Za-z]{1,8}\}|\bnull\b|«\s*»/;
let ko = 0, n = 0, dereg = 0, total = 0; const notes = [];
function partie(ch, san, seed) {
  let s = seed || 9; const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const sc = CHAPTERS[ch], pc = JSON.parse(JSON.stringify((sc.pregens || CHAPTERS.londres.pregens)[0]));
  const g = RPG.createGame(sc, null, { rng, pc }); g.state.pc.sanStart = pc.san; g.state.pc.san = san;
  if (ch === 'londres') g.state.min = 3 * 1440 + 600; if (ch === 'paris') g.state.min = 6 * 1440 + 630;
  Object.keys(sc.locations).forEach(k => { g.api.flag('known:' + k, true); g.api.flag('connu:' + k, true); });
  return g;
}
function lire(g, b, ctx) { g.state.log.filter(e => e.n > b && typeof e.x === 'string').forEach(e => { total++; if (/⟦|Ses dents|ph’nglui|fhtagn|iä|Les pavés|trop de dents|Il y a deux voix/.test(e.x)) dereg++; if (!e.x.trim() || MAUVAIS.test(e.x)) { ko++; notes.push(ctx + ' → ' + e.x.slice(0, 120)); } }); }
for (const ch of ['londres', 'paris']) {
  const sc = CHAPTERS[ch];
  // au bord du gouffre : chaque personnage, ses sujets, puis chaque délire proposé
  for (const id of Object.keys(sc.npcs)) {
    const ta = Object.keys(sc.locations).map(k => [k, (sc.locations[k].actions || []).find(a => a.talkTo === id)]).find(x => x[1]); if (!ta) continue;
    const g = partie(ch, 20, 7 + n); try { if (g.state.loc !== ta[0]) g.api.go(ta[0]); } catch (e) { continue; }
    g.state.talk = id; g.api.npcs(id).met = true;
    let b = g.state.seq;
    for (const t of (sc.npcs[id].topics || []).slice(0, 4)) { if (g.state.talk !== id) break; try { g.choose({ label: t.chip || t.id, topic: t.id }); if (g.state.pending) g.roll(); } catch (e) { ko++; notes.push('PLANTAGE sujet ' + id + ' ' + e.message); } }
    lire(g, b, ch + ' ' + id + ' sujets');
    const sug = g.suggestionsParole(6, 'normal');
    for (const x of sug) {
      const h = partie(ch, 20, 11 + n++); try { if (h.state.loc !== ta[0]) h.api.go(ta[0]); } catch (e) { continue; }
      h.state.talk = id; h.api.npcs(id).met = true; b = h.state.seq;
      try { if (x.mal) h.choose({ label: x.label, mal: x.mal }); else if (x.say) h.step(x.say, 'dire'); else h.choose({ label: x.label, topic: x.topic }); while (h.state.pending) h.roll(); } catch (e) { ko++; notes.push('PLANTAGE délire ' + id + ' ' + x.label + ' ' + e.message); }
      lire(h, b, ch + ' ' + id + ' « ' + x.label + ' »');
    }
  }
  // la fin par la folie, et les soins
  const g = partie(ch, 20); g.api.go(ch === 'londres' ? 'hotel' : 'hotel'); const ids = g.ideas(6, 'normal').map(x => x.label);
  const fin = partie(ch, 20); fin.api.go('hotel'); fin.choose({ label: 'Cesser de lutter', action: 'fo_ceder_' + ch });
  const E = sc.endingFor(fin.state);
  console.log(ch, '| idées au bord du gouffre :', ids.join(' · '));
  console.log(ch, '| fin :', fin.state.ended, E && E.title);
  const s = partie(ch, 40); s.api.go('hotel'); const avant = s.state.pc.san;
  for (const a of ['soin_pharmacie', 'soin_cachet', 'soin_cachet', 'soin_alieniste', 'soin_alieniste']) { const b = s.state.seq; s.choose({ label: a, action: a }); lire(s, b, ch + ' ' + a); }
  console.log(ch, '| soins : SAN', avant, '→', s.state.pc.san, '| bromure', s.api.flag('bromure'), '| argent', s.api.money());
}
notes.slice(0, 15).forEach(x => console.log(x));
console.log('textes lus ' + total + ' | déréglés ' + dereg + ' | problèmes ' + ko);
