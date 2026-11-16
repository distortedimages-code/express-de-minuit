// chaque phrase toute faite du carnet de conversation, devant chaque personnage : la réponse est-elle la bonne ?
// banalité → la culture du temps (aucun sujet de l'enquête, aucun indice) ; insulte, menace → l'humeur du personnage ;
// maladresse propre, délire → sa réplique écrite. node test/phrases.js [--voir] : --voir affiche chaque réponse.
global.window = global; global.RPG_ABSENTS = []; global.RPG_FAITS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','idees','folie']) require('../src/' + f + '.js');
const VOIR = process.argv.includes('--voir');
let n = 0, ko = 0; const notes = [], lignes = [];
function partie(ch, san) {
  let s = 13; const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const sc = CHAPTERS[ch], pc = JSON.parse(JSON.stringify((sc.pregens || CHAPTERS.londres.pregens)[0]));
  const g = RPG.createGame(sc, null, { rng, pc }); if (san) { g.state.pc.sanStart = pc.san; g.state.pc.san = san; }
  if (ch === 'londres') g.state.min = 3 * 1440 + 660; if (ch === 'paris') g.state.min = 8 * 1440 + 660;
  Object.keys(sc.locations).forEach(k => { g.api.flag('known:' + k, true); g.api.flag('connu:' + k, true); });
  return g;
}
const HUMEUR = /insult|menace|outrage|plainte|poste|police|Dehors|calmez|vous suivre|carnet|excuse|répét|retirez|pardon|comment osez|osez|mesurez|parlez autrement|insolent|grossier|ton|surveillez|je ne vous permets/i;
for (const ch of ['prologue', 'londres', 'paris']) {
  const sc = CHAPTERS[ch];
  for (const id of Object.keys(sc.npcs)) {
    const ta = Object.keys(sc.locations).map(k => [k, (sc.locations[k].actions || []).find(a => a.talkTo === id && (!a.cond || true))]).find(x => x[1]);
    if (!ta) continue;
    for (const san of [0, 20]) {
      const g0 = partie(ch, san); const ex = sc.paroles && sc.paroles(g0.api, sc.npcs[id]); if (!ex) continue;
      for (const x of ex.banal.concat(ex.maladresse)) {
        const g = partie(ch, san);
        try { if (g.state.loc !== ta[0]) g.api.go(ta[0]); g.choose({ label: ta[1].label, action: ta[1].id }); while (g.state.pending) g.roll(); } catch (e) { continue; }
        if (g.state.talk !== id) { g.state.talk = id; g.api.npcs(id).met = true; }
        const st = g.api.npcs(id), avant = JSON.stringify(st.asked), clues = g.state.clues.length, pat = st.patience, b = g.state.seq, ins0 = ((g.api.flag('pm:' + id) || {}).ins || 0), sil0 = (g.api.flag('pm:' + id) || {}).sil;
        try {
          if (x.mal) g.choose({ label: x.label, mal: x.mal });
          else if (x.cult) g.choose({ label: x.label, say: x.say, cult: x.cult });
          else g.step(x.say, 'dire');
          while (g.state.pending) g.roll();
        } catch (e) { ko++; notes.push('PLANTAGE ' + ch + ' ' + id + ' « ' + x.label + ' » ' + e.message); continue; }
        n++;
        const rep = g.state.log.filter(e => e.n > b && e.t !== 'player' && e.t !== 'ask' && typeof e.x === 'string').map(e => e.x).join(' ');
        const sujet = JSON.stringify(g.api.npcs(id).asked) !== avant, indice = g.state.clues.length > clues;
        let pb = null;
        if (!rep.trim()) pb = 'aucune réponse';
        else if (x.cult && (sujet || indice)) pb = 'la banalité a déclenché un sujet de l’enquête';
        else if (!x.cult && !x.mal && indice) pb = 'une insulte a donné un indice';
        else if (!x.cult && !x.mal && !((((g.api.flag('pm:' + id) || {}).ins || 0) > ins0) || (g.api.flag('pm:' + id) || {}).sil !== sil0 || g.api.npcs(id).patience < pat || g.state.talk !== id || g.state.ended)) pb = 'pas de réaction d’humeur';
        else if (!x.cult && !x.mal && sujet) pb = 'une insulte a déclenché un sujet';
        if (pb) { ko++; notes.push(ch + ' · ' + id + (san ? ' (au bord du gouffre)' : '') + ' · « ' + (x.say || x.dit || x.label) + ' » → ' + pb + ' : ' + rep.slice(0, 140)); }
        lignes.push(ch + ' · ' + id + (san ? '*' : '') + ' · « ' + (x.say || x.dit || x.label).slice(0, 60) + ' »\n      → ' + rep.slice(0, 220));
      }
    }
  }
}
if (VOIR) lignes.forEach(l => console.log(l));
notes.slice(0, 40).forEach(x => console.log('PROBLÈME ' + x));
console.log('phrases essayées ' + n + ' | problèmes ' + ko);
