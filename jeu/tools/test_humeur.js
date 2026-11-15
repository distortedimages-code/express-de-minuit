// l'humeur des PNJ : absurdités, insultes, anachronismes. Pour chaque personnage doté d'une fiche :
// aucune réplique répétée, des mots modernes toujours repris, une issue (silence, affrontement), aucun jeton oublié.
global.window = global;
const R = '../src/';
['engine', 'scene', 'londres', 'londres_circuits', 'londres_combat', 'parole', 'fiches', 'jets', 'londres_seance', 'londres_impro', 'londres_objets'].forEach(f => require(R + f + '.js'));
let seed = 11; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const ABS = ['les poissons volent sur la lune', 'je suis une banane', 'blorp zigouli', 'les chaussettes chantent la nuit', 'je suis le pape', 'mon chapeau parle allemand le mardi', 'je viens du futur', 'les nuages mangent des parapluies', 'zorglub ploum', 'je suis invisible', 'la lune est en fromage blanc', 'je lis dans vos pensées'];
const INS = ['vous êtes un imbécile', 'connard', 'espèce de crétin', 'abruti', 'va te faire foutre', 'ta gueule', 'pauvre type'];
const ANA = ['vous avez un iPhone ?', 'je regarde sur Google', 'envoyez-moi un mail', 'vous êtes sur Instagram ?', 'on regarde Netflix ?', 'mon ordinateur est en panne', 'vous avez le wifi ?', 'je joue à la PlayStation', 'je vais commander sur Amazon', 'je paie en euros'];
const WORDS = ['iPhone', 'Google', 'mail', 'Instagram', 'Netflix', 'ordinateur', 'wifi', 'PlayStation', 'Amazon', 'euros'];
let errors = 0, bad = 0, rep = 0, n = 0, issues = {};
function play(ch, id, lines, check) {
  const sc = CHAPTERS[ch];
  const g = RPG.createGame(sc, null, sc.pregens ? { rng, pc: sc.pregens[0] } : { rng });
  g.api.talk(id);
  const said = new Map(); let fin = null;
  lines.forEach((q, i) => {
    if (!g.state.talk) { fin = fin || 'fin'; return; }
    const b = g.state.seq;
    try { g.step(q); let gd = 0; while (g.state.pending && gd++ < 4) g.roll(); } catch (e) { errors++; console.log('ERR', ch, id, q, e.stack.split('\n').slice(0, 2).join(' | ')); return; }
    n++;
    const out = g.state.log.filter(e => e.n > b && (e.t === 'npc' || e.t === 'narr') && e.who === id);
    const all = g.state.log.filter(e => e.n > b && typeof e.x === 'string');
    all.forEach(e => {
      if (/\{[A-Za-z]+\}|à le |de le |undefined|NaN/.test(e.x)) { bad++; console.log('JETON', id, q, '→', e.x.slice(0, 160)); }
    });
    // on compare les paroles (entre guillemets), et les gestes à part : aucune ne doit revenir
    out.forEach(e => {
      const paroles = (e.x.match(/«[^»]*»/g) || []).map(x => x.replace(/“[^”]*”/g, '“…”'));
      const geste = e.x.replace(/«[^»]*»/g, '').trim();
      paroles.concat(geste ? [geste] : []).forEach(k => {
        if (said.has(k)) { rep++; console.log('REDIT', id, '→', k.slice(0, 140)); }
        said.set(k, 1);
      });
    });
    if (check) check(i, out, g);
  });
  return { g, fin: fin || (g.state.talk ? null : 'fin') };
}
for (const ch of ['prologue', 'londres']) {
  const sc = CHAPTERS[ch];
  for (const id of Object.keys(sc.fiches)) {
    // les absurdités : on finit par se taire ou par sévir
    const a = play(ch, id, ABS);
    if (!a.fin && !(a.g.api.flag('pm:' + id) || {}).sil) { (issues.absurde = issues.absurde || []).push(id); }
    // les insultes : idem, et plus vite
    const b = play(ch, id, INS);
    if (!b.fin && !(b.g.api.flag('pm:' + id) || {}).sil) { (issues.insultes = issues.insultes || []).push(id); }
    // les anachronismes : le mot est repris, tant que le personnage parle encore
    play(ch, id, ANA, (i, out, g) => {
      const st = g.api.flag('pm:' + id) || {};
      if (!g.state.talk || st.sil) return;
      const txt = out.map(e => e.x).join(' ');
      if (out.length && txt.indexOf('“') >= 0 && txt.toLowerCase().indexOf(WORDS[i].toLowerCase()) < 0) { bad++; console.log('MOT PERDU', id, WORDS[i], '→', txt.slice(0, 140)); }
    });
  }
}
console.log('échanges', n, 'erreurs', errors, 'jetons', bad, 'répétitions', rep, 'sans issue', JSON.stringify(issues));
