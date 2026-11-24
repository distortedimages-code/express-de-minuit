// des parties jouées uniquement avec les suggestions : idées, « Réfléchir », boutons proposés, et en conversation
// les suggestions de paroles. On compare l'intelligence du personnage et le mode du carnet.
// node test/suggestions.js [chapitre] [parties]
global.window = global; global.RPG_ABSENTS = []; global.RPG_FAITS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
const ch = process.argv[2] || 'paris', N = +(process.argv[3] || 30), sc = CHAPTERS[ch];
const MAX = ch === 'londres' ? 2600 : ch === 'paris' ? 2400 : 400;
function joue(INT, mode, graine) {
  let seed = graine; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const pc = JSON.parse(JSON.stringify((sc.pregens || CHAPTERS.londres.pregens)[graine % 3])); pc.carac.INT = INT;
  const g = RPG.createGame(sc, null, { rng, pc }), s = g.state;
  let pas = 0, enTalk = 0, mauvaises = 0, bonnes = 0;
  const kinds = {};
  Object.keys(sc.locations).forEach(l => (sc.locations[l].actions || []).forEach(a => kinds[a.id] = a.ideaKind || 'piste'));
  (sc.globalActions || []).forEach(a => kinds[a.id] = a.ideaKind || 'piste');
  while (!s.ended && pas++ < MAX) {
    if (s.pending) { g.roll(); continue; }
    if (s.pendingPush) { g.declinePush(); continue; }
    const dernier = s.log.map(e => e.t).lastIndexOf('player');
    const boutons = [].concat(...s.log.slice(dernier + 1).filter(e => e.t === 'chips').map(e => e.list || []));
    if (s.talk) {
      enTalk++;
      const c = g.suggestionsParole(5, mode);
      if (!c.length || enTalk > 7 || rng() < 0.12) { g.step('Au revoir.', 'dire'); enTalk = 0; continue; }
      const x = c[Math.floor(rng() * c.length)];
      if (x.mal) { mauvaises++; g.choose({ label: x.label, mal: x.mal }); }
      else if (x.cult) g.choose({ label: x.label, say: x.say, cult: x.cult });
      else if (x.say) g.step(x.say, 'dire');
      else g.choose({ label: x.label, topic: x.topic });
      continue;
    }
    enTalk = 0;
    const id = g.ideas(4, mode).map(x => Object.assign({ k: kinds[x.action] }, x));
    const opts = id.concat(boutons.filter(b => b.action || b.topic).map(b => Object.assign({ k: 'bouton' }, b)));
    if (g.reflexionPossible() && rng() < 0.08) { g.choose({ label: 'Réfléchir', reflechir: true }); continue; }
    if (!opts.length) { g.step('Où aller ?', 'agir'); continue; }
    const x = opts[Math.floor(rng() * opts.length)];
    if (/^(fausse|risque|folie)$/.test(x.k)) mauvaises++; else bonnes++;
    g.choose(x);
  }
  return { fin: s.ended ? (s.flags.fin || 'ok') : 'en cours', jours: Math.floor(s.min / 1440), indices: s.clues.length, san: s.pc.san, pv: s.pc.pv, arrest: s.flags.arrestations || 0, mauvaises, bonnes, loc: s.loc };
}
const stats = {};
for (const [INT, mode] of [[80, 'guide'], [80, 'normal'], [55, 'normal'], [40, 'normal']]) {
  const k = 'INT ' + INT + ' ' + mode, R = [];
  for (let i = 0; i < N; i++) { try { R.push(joue(INT, mode, 101 + i * 7)); } catch (e) { R.push({ fin: 'PLANTAGE ' + e.message.slice(0, 60) }); } }
  const fins = {}; R.forEach(r => fins[r.fin] = (fins[r.fin] || 0) + 1);
  const moy = f => (R.reduce((a, r) => a + (r[f] || 0), 0) / R.length).toFixed(1);
  console.log(k.padEnd(16) + ' fins ' + JSON.stringify(fins) + ' | indices ' + moy('indices') + ' | SAN ' + moy('san') + ' | PV ' + moy('pv') + ' | arrestations ' + moy('arrest') + ' | mauvaises/bonnes ' + moy('mauvaises') + '/' + moy('bonnes'));
  const coince = {}; R.filter(r => r.fin === 'en cours').forEach(r => coince[r.loc] = (coince[r.loc] || 0) + 1);
  if (Object.keys(coince).length) console.log('   en cours à : ' + JSON.stringify(coince));
}
