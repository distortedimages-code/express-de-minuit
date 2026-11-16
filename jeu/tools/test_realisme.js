// des phrases pièges : le personnage doit répondre à ce qu'on lui dit, pas à un mot pris pour un autre
global.window = global;
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','idees']) require('../src/' + f + '.js');
const CAS = [
  ['londres', 'institut', 'smith', null, 'J’adore vos moustaches', null, /observe|moustache \?/i],
  ['londres', 'institut', 'smith', null, 'quelles belles moustaches vous avez', null, /observe/i],
  ['londres', 'institut', 'smith', null, 'belle soirée, non ?', null, /flatt|aimable|enjôleur/i],
  ['londres', 'institut', 'smith', null, 'j’ai perdu mon chapeau', null, /observe|gris/i],
  ['londres', 'institut', 'smith', g => g.api.clue('OBSERVATEUR'), 'qui est l’homme à la moustache ?', /moustache|brun|admirateur/i, null],
  ['prologue', 'restaurant', 'veuve', null, 'j’adore votre chapeau', null, /gris|trempée/i],
  ['prologue', 'restaurant', 'veuve', null, 'vous avez de beaux yeux', null, /serviette|symbole/i],
  ['prologue', 'restaurant', 'veuve', null, 'un homme au chapeau est passé ?', /gris|grand/i, null],
  ['prologue', 'restaurant', 'serveur', null, 'vous avez une belle voix', null, /ravel|parti/i],
  ['prologue', 'restaurant', 'serveur', null, 'où est passé le monsieur de la table du fond ?', /parti|M\. Ravel|monsieur/i, /lac/i],
  ['londres', 'islington', 'voisin', g => { g.state.min = 3 * 1440 + 600; }, 'où est Camberwell ?', null, /Turc|voûté/i],
  ['londres', 'stjohn', 'laitier', g => { g.state.min = 2 * 1440 + 540; }, 'avez-vous trouvé quelque chose dans la bibliothèque ?', null, /British Museum/i],
  ['londres', 'stjohn', 'agentsj', g => { g.state.min = 2 * 1440 + 540; }, 'joli uniforme', null, /Yard|police, c’est/i],
  ['londres', 'yard', 'fleming', g => { g.state.min = 3 * 1440 + 600; }, 'j’ai essayé de l’étrangler', /Répétez|niez|l’heure/i, /Votre geste|se jette|Corps à corps/i],
  ['londres', 'yard', 'fleming', g => { g.state.min = 3 * 1440 + 600; }, 'il m’a frappé le premier', null, /Votre geste|chinois|rien compris/i],
  ['londres', 'institut', 'smith', null, 'si je vous frappais, que feriez-vous ?', null, /Votre geste|vous jetez/i],
  ['londres', 'institut', 'smith', null, 'je ne vais pas vous frapper', null, /Votre geste|vous jetez/i],
  ['prologue', 'restaurant', 'serveur', null, 'j’ai frappé un homme à Paris', null, /recule|menace|Intimidation/i],
  ['londres', 'yard', 'fleming', g => { g.state.min = 1440 + 540; g.api.flag('agresse', 'smith'); }, 'parlez-moi de Smith', /plainte/i, /incendie|Rigby/i],
  ['londres', 'yard', 'fleming', g => { g.state.min = 1440 + 540; g.api.flag('agresse', 'smith'); }, 'pourquoi ne porte-t-il pas plainte ?', /ami|plainte/i, /la porte|« porte »/i],
  ['londres', 'yard', 'fleming', g => { g.state.min = 1440 + 540; }, 'je l’ai vu hier soir', null, /incendie|Rigby/i],
  ['londres', 'yard', 'fleming', g => { g.state.min = 1440 + 540; }, 'et l’incendie ?', /Quel incendie|Aucun incendie/i, /Rigby/i],
  ['prologue', 'restaurant', 'veuve', null, 'Dire qu’on est de la police', null, /téléphone|gendarme/i],
  ['prologue', 'restaurant', 'serveur', null, 'je lui réponds que Ravel est mon ami', /Ravel|ami|monsieur/i, /téléphone/i],
  ['londres', 'hotel', 'concierge', g => { g.state.min = 1440 + 600; }, 'j’ai mal dormi', null, /courrier|Rien pour vous/i],
];
let bad = 0;
for (const [ch, loc, id, prep, q, doit, nedoitpas] of CAS) {
  const sc = CHAPTERS[ch]; let seed = 5; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const g = RPG.createGame(sc, null, sc.pregens ? { rng, pc: sc.pregens[0] } : { rng });
  if (prep) prep(g); if (g.state.loc !== loc) g.api.go(loc);
  g.api.talk(id);
  const b = g.state.seq; g.step(q); let guard = 0; while (g.state.pending && guard++ < 4) g.roll();
  const rep = g.state.log.filter(e => e.n > b && (e.t === 'npc' || e.t === 'narr')).map(e => e.x).join(' | ');
  const ok = (!doit || doit.test(rep)) && (!nedoitpas || !nedoitpas.test(rep));
  if (!ok) bad++;
  if (!ok || process.env.V) console.log((ok ? 'ok   ' : 'RATÉ ') + '[' + id + '] « ' + q + ' » → ' + rep.slice(0, 170));
}
console.log('phrases pièges ' + CAS.length + ' ratées ' + bad);
