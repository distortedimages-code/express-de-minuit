// la création d'investigateur : les règles (dés, âge, points) et une partie lancée avec chaque fiche
global.window = global; global.RPG_ABSENTS = []; global.RPG_FAITS = [];
global.localStorage = { _: {}, getItem(k) { return this._[k] || null; }, setItem(k, v) { this._[k] = String(v); } };
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie','creation']) require('../src/' + f + '.js');
const R = Creation._regles; let ko = 0, n = 0; const notes = [], photos = new Set();
function hasard(l) { return l[Math.floor(Math.random() * l.length)]; }
for (let i = 0; i < 600; i++) {
  const p = R.neuf(); p.sexe = hasard(['m', 'f']); p.prenom = 'Test'; p.nom = 'Essai'; p.origine = 'Londres'; p.metier = hasard(R.METIERS).id; p.lien = 'eleve'; p.key = 'xtest' + i;
  p.carac = {}; R.CARAC.forEach(k => { const r = R.lancer(k); p.carac[k.k] = r.v; const mn = (k.n + k.plus) * 5, mx = (k.n * 6 + k.plus) * 5; if (r.v < mn || r.v > mx) { ko++; notes.push(k.k + ' hors bornes ' + r.v); } });
  p.carac0 = JSON.parse(JSON.stringify(p.carac)); p.chance = 50; p.age = 'jeune'; p.ageExact = 30;
  const m = R.METIERS.find(x => x.id === p.metier), total = R.pointsMetier(p), comps = R.compsMetier(p);
  if (comps.length !== 8) { ko++; notes.push(p.metier + ' : ' + comps.length + ' compétences de profession'); }
  // répartir comme le ferait un joueur pressé : le Crédit au minimum, le reste en parts égales
  p.ptsM = { 'Crédit': m.credit[0] }; let reste = total - m.credit[0];
  comps.forEach((c, j) => { const part = Math.min(reste, Math.floor((total - m.credit[0]) / comps.length)); p.ptsM[c] = (p.ptsM[c] || 0) + part; reste -= part; });
  p.ptsL = { 'Écouter': p.carac.INT * 2 };
  const pc = R.fiche(p); n++; photos.add(pc.portrait);
  const somme = Object.values(p.ptsM).reduce((a, b) => a + b, 0); if (somme > total) { ko++; notes.push('points de métier dépassés'); }
  if (!(pc.pv >= 5 && pc.san === p.carac.POU && pc.money >= 5 && pc.skills['Crédit'] >= m.credit[0])) { ko++; notes.push('fiche incohérente ' + JSON.stringify({ pv: pc.pv, san: pc.san, money: pc.money })); }
  if (i % 60 === 0) {
    let seed = 3 + i; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    try {
      const g = RPG.createGame(CHAPTERS.londres, null, { rng, pc: JSON.parse(JSON.stringify(pc)) });
      for (const c of ['regarder', 'je parle au professeur Smith', 'Bonsoir, professeur.', 'au revoir', 'je prends une coupe de champagne']) { g.step(c); if (g.state.pending) g.roll(); }
      const t = g.state.log.map(e => e.x || '').join(' ');
      if (/undefined|NaN|\{[a-zA-Z]+\}/.test(t)) { ko++; notes.push('texte abîmé ' + pc.occupation); }
    } catch (e) { ko++; notes.push('PLANTAGE ' + pc.occupation + ' ' + e.message); }
  }
}
// les âges : l'usure et l'Éducation
const p = R.neuf(); p.carac0 = { FOR: 50, CON: 50, TAI: 50, DEX: 50, APP: 50, INT: 50, POU: 50, EDU: 50 }; p.carac = JSON.parse(JSON.stringify(p.carac0));
notes.slice(0, 12).forEach(x => console.log(x));
console.log('fiches ' + n + ' | photographies possibles ' + photos.size + ' / 40 | problèmes ' + ko);
