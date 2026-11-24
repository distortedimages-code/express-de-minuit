// Lausanne : des phrases au hasard, à toutes les étapes (le matin, la visite, le soir, la boutique, le rêve, le procès, le train),
// des « oui », des « non », des insultes. On cherche les plantages, les textes abîmés, les répliques d'absents.
global.window = global; global.RPG_ABSENTS = []; global.RPG_BREFS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
const P = CHAPTERS.lausanne, J = 1440, X = P._h;
const words = 'gare porteur hotel boutique wellington edgar william rouleau prix thé duc visite cathedrale chevalier mains crypte guet tour musee bibliotheque journaux suicides livre signal chat noir club max addition rue du pre porte force fiole boire journal recu faux lit seringue cadavre police commissaire train simplon restaurant dejeuner donner refuser oui non merci pourquoi moi je le defends il dormait etranger savoir crime liberte prince juge foule ours fuir courir sortir entrer monter attendre dormir lire regarder fouiller salaud imbecile'.split(' ');
const MAUVAIS = /undefined|NaN|\[object|\{[A-Za-z]{1,8}\}|\bnull\b|«\s*»/;
let seed = +(process.env.SEED || 7); const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
let errors = 0, steps = 0, ended = 0, abimes = 0; const locs = {}, fins = {}, vus = new Set();
for (let gi = 0; gi < 70; gi++) {
  const pc = JSON.parse(JSON.stringify(P.pregens[gi % 3]));
  pc.passe = { paris: { titre: 'Paris', fin: 'ok', min: 10 * J + 400, indices: ['LETTRE'], drapeaux: { lettre: true } } };
  const game = RPG.createGame(P, null, { rng, pc }), A = game.api, s = game.state, etape = gi % 7;
  if (etape >= 1) { A.flag('edgarVu', true); A.flag('ducVenu', true); A.flag('ducVu', true); A.flag('rdvClub', true); A.flag('connu:la_rue', true); A.flag('connu:la_chatnoir', true); s.min = 10 * J + 11 * 60; }
  if (etape === 1) { A.flag('visite', 1); A.go('la_cathedrale'); }
  if (etape >= 2) { s.min = 11 * J + 30; ['meurtre', 'meurtreW', 'meurtreE', 'ducEntre', 'portesOuvertes', 'visiteFinie'].forEach(f => A.flag(f, true)); A.go(etape === 2 ? 'la_rue' : 'la_etage'); }
  if (etape >= 4) { A.take(X.FIOLE); A.take(X.JOURNAL); A.take(X.FAUX); A.clue('JOURNALE'); A.flag('crimeVu', true); A.flag('edgarVuMort', true); A.flag('williamVu', true); }
  if (etape === 5) { s.min = 11 * J + 7 * 60; A.flag('trainL', true); A.go('tr_compartiment'); P.boireFiole(A); A.go('re_ville'); A.flag('errances', 2); }
  if (etape === 6) { s.min = 11 * J + 11 * 60 + 40; A.flag('trainL', true); A.take(X.ROULEAU); A.take(X.TRAD); A.go('tr_restaurant'); }
  for (let i = 0; i < 260 && !s.ended; i++) {
    const n = 1 + Math.floor(rng() * 4), cmd = Array.from({ length: n }, () => words[Math.floor(rng() * words.length)]).join(' ');
    const b = s.seq;
    try {
      if (s.pending) game.roll();
      else if (rng() < 0.3) { const l = game.ideas ? game.ideas(4) : []; if (l && l.length) game.choose(l[Math.floor(rng() * l.length)]); else game.step(cmd); }
      else game.step(cmd, rng() < 0.4 ? 'dire' : undefined);
    } catch (e) { errors++; if (errors < 6) console.log('ERREUR', JSON.stringify(cmd), '@' + s.loc, e.stack.split('\n').slice(0, 3).join(' | ')); }
    s.log.filter(e => e.n > b && typeof e.x === 'string').forEach(e => { if (MAUVAIS.test(e.x) && !vus.has(e.x.slice(0, 50))) { vus.add(e.x.slice(0, 50)); abimes++; console.log('TEXTE', e.x.slice(0, 150)); } });
    steps++; locs[s.loc] = (locs[s.loc] || 0) + 1;
  }
  if (s.ended) { ended++; fins[s.flags.fin || 'milan'] = (fins[s.flags.fin || 'milan'] || 0) + 1; }
}
console.log('lausanne : pas', steps, '| erreurs', errors, '| textes abîmés', abimes, '| absents', RPG_ABSENTS.length, '| finies', ended, JSON.stringify(fins));
console.log(JSON.stringify(locs));
if (RPG_ABSENTS.length) console.log(RPG_ABSENTS.slice(0, 5));
process.exit(errors || abimes ? 1 : 0);
