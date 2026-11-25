// Le censeur : rien de ce qui s'affiche ne doit trahir un savoir que le personnage n'a pas encore.
// surveiller(partie) enrobe step, choose, roll et push : après chaque geste, il relit tout ce qui vient de
// s'afficher (récit, répliques, documents, boutons) et les suggestions du moment. Une expression d'un savoir
// (scene.savoirs[id].mots) dans un texte, alors que le personnage ne sait pas encore la chose : c'est une fuite.
// Les phrases du joueur ne comptent pas : il a le droit de dire ce qu'il veut, c'est la réponse qui compte.
'use strict';
const FUITES = new Map(), APPRIS = {}, PIEGES = [];
let parties = 0;

function plat(x) {
  return ' ' + String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe')
    .replace(/[’'`´]/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
}
function textes(e) {
  if (!e || e.t === 'player' || e.t === 'ask' || e.t === 'fx' || e.t === 'ui' || e.reprise) return []; // une reprise ne fait que répéter les mots du joueur
  const out = [];
  if (typeof e.x === 'string') out.push(e.x);
  if (typeof e.title === 'string') out.push(e.title);
  if (typeof e.nom === 'string') out.push(e.nom);
  if (Array.isArray(e.list)) e.list.forEach(c => c && c.label && out.push(c.label));
  return out;
}

function surveiller(g, etiquette) {
  const s = g.state, A = g.api;
  parties++;
  let vu = s.seq, derniers = [];
  function controle(geste) {
    const S = (g.scene && g.scene.savoirs) || {}, ids = Object.keys(S).filter(k => S[k].mots);
    derniers.push(geste); if (derniers.length > 6) derniers.shift();
    const lus = [];
    s.log.filter(e => e.n > vu).forEach(e => textes(e).forEach(x => lus.push({ x, t: e.t })));
    vu = s.seq;
    // ce qui est proposé à l'écran en ce moment
    try {
      if (s.talk) (g.suggestionsParole(6, 'normal') || []).forEach(c => lus.push({ x: c.label, t: 'suggestion' }));
      else if (!s.ended) (g.ideas(4) || []).forEach(c => lus.push({ x: c.label, t: 'idée' }));
    } catch (e) { /* une partie finie */ }
    ids.forEach(id => { if (A.sait(id)) APPRIS[s.chapter + ':' + id] = (APPRIS[s.chapter + ':' + id] || 0) + 1; });
    lus.forEach(({ x, t }) => {
      const n = plat(x);
      ids.forEach(id => {
        const re = S[id].mots; re.lastIndex = 0;
        const m = n.match(re);
        if (!m || A.sait(id)) return;
        const k = s.chapter + '|' + id + '|' + x.slice(0, 90);
        const f = FUITES.get(k) || { chapitre: s.chapter, savoir: id, mot: m[0].trim(), type: t, texte: x, lieu: s.loc, qui: s.talk, n: 0, gestes: derniers.slice(), partie: etiquette || '' };
        f.n++; FUITES.set(k, f);
      });
    });
  }
  ['step', 'choose', 'roll', 'push', 'declinePush'].forEach(nom => {
    const f = g[nom]; if (typeof f !== 'function') return;
    g[nom] = function () {
      const a = arguments[0], geste = nom === 'step' ? '« ' + a + ' »' : nom === 'choose' ? '[' + (a && (a.label || a.action || a.topic)) + ']' : nom;
      const r = f.apply(this, arguments); controle(geste); return r;
    };
  });
  controle('début');
  return g;
}

function rapport(opts) {
  opts = opts || {};
  const l = [...FUITES.values()].sort((a, b) => a.chapitre.localeCompare(b.chapitre) || a.savoir.localeCompare(b.savoir) || b.n - a.n);
  const max = opts.max || 60;
  l.slice(0, max).forEach(f => {
    console.log('FUITE ' + f.chapitre + ' · ' + f.savoir + ' (« ' + f.mot + ' », ' + f.type + ', ' + f.n + ' fois) @' + f.lieu + (f.qui ? ' avec ' + f.qui : ''));
    console.log('   ' + f.texte.slice(0, 220));
    if (opts.gestes) console.log('   après : ' + f.gestes.join(' → ').slice(0, 220));
  });
  if (l.length > max) console.log('… et ' + (l.length - max) + ' autres.');
  return l;
}

module.exports = { surveiller, rapport, FUITES, APPRIS, PIEGES, plat, get parties() { return parties; } };
