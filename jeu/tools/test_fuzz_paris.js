// Paris : des phrases au hasard, des « oui », des « non », des insultes, à toute heure. On cherche les plantages,
// les textes abîmés, les répliques d'absents et les parties bloquées.
global.window = global; global.RPG_ABSENTS = []; global.RPG_BREFS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris']) require('../src/' + f + '.js');
const P = CHAPTERS.paris;
const words = 'je examine fouille prends parle vais aller dors lis journal smith gerant bibliotheque nationale carte lecteur secretariat etudiant remi traduire cinquante francs fenalik comte cherche arsenal malon capitaine charenton asile directeur leroux rogniat registres caisses cahier bleu delplace mort infirmiers attends sortie mandrin guimart patient cave poissy villa maison plans oui non peut-etre merci bonjour au revoir pourquoi comment qui imbecile je vous frappe taxi hotel fenetre journaux recents police vampire louvre verre'.split(' ');
const MAUVAIS = /undefined|NaN|\[object|\{[A-Za-z]{1,8}\}|\bnull\b|«\s*»/;
let seed = +(process.env.SEED || 7); const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
let errors = 0, steps = 0, ended = 0, abimes = 0; const locs = {}, fins = {}, vus = new Set();
for (let gi = 0; gi < 60; gi++) {
  const game = RPG.createGame(P, null, { rng, pc: P.pregens[gi % 3] });
  if (gi % 2) { game.api.flag('carteBN', true); ['arsenal', 'charenton'].forEach(k => game.api.flag('connu:' + k, true)); }
  for (let i = 0; i < 240 && !game.state.ended; i++) {
    const n = 1 + Math.floor(rng() * 4), cmd = Array.from({ length: n }, () => words[Math.floor(rng() * words.length)]).join(' ');
    const b = game.state.seq;
    try {
      if (game.state.pending) game.roll();
      else if (rng() < 0.25) { const ch = (game.chips ? game.chips() : []); if (ch && ch.length) game.choose(ch[Math.floor(rng() * ch.length)]); else game.step(cmd); }
      else game.step(cmd, rng() < 0.4 ? 'dire' : undefined);
    } catch (e) { errors++; if (errors < 6) console.log('ERREUR', JSON.stringify(cmd), '@' + game.state.loc, e.stack.split('\n').slice(0, 3).join(' | ')); }
    game.state.log.filter(e => e.n > b && typeof e.x === 'string').forEach(e => { if (MAUVAIS.test(e.x) && !vus.has(e.x.slice(0, 50))) { vus.add(e.x.slice(0, 50)); abimes++; console.log('TEXTE', e.x.slice(0, 150)); } });
    steps++; locs[game.state.loc] = (locs[game.state.loc] || 0) + 1;
  }
  if (game.state.ended) { ended++; fins[game.state.flags.fin || '?'] = (fins[game.state.flags.fin || '?'] || 0) + 1; }
}
console.log('paris : pas', steps, '| erreurs', errors, '| textes abîmés', abimes, '| absents', RPG_ABSENTS.length, '| réponses brèves', RPG_BREFS.length, '| finies', ended, JSON.stringify(fins), JSON.stringify(locs));
if (RPG_ABSENTS.length) console.log(RPG_ABSENTS.slice(0, 5));
