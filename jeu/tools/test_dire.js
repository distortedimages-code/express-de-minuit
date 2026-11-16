// « Dire » et « Agir » : une parole ne déclenche jamais un geste ; un geste reste un geste
global.window = global;
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','idees','folie']) require('../src/' + f + '.js');
function jeu(ch, prep) { const sc = CHAPTERS[ch]; let seed = 4; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; const g = RPG.createGame(sc, null, sc.pregens ? { rng, pc: sc.pregens[0] } : { rng }); if (prep) prep(g); return g; }
let bad = 0;
function cas(titre, g, texte, mode, test) {
  const b = g.state.seq, loc0 = g.state.loc; g.step(texte, mode); let gd = 0; while (g.state.pending && gd++ < 4) g.roll();
  const out = g.state.log.filter(e => e.n > b && e.t !== 'player' && e.t !== 'ask' && e.t !== 'chips');
  const txt = out.map(e => (e.t === 'npc' ? '[' + e.who + '] ' : '') + (e.x || e.name || e.t)).join(' | ');
  const ok = test({ g, txt, out, loc0 }); if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'RATÉ ') + titre + ' — ' + mode + ' « ' + texte + ' » → ' + txt.slice(0, 150));
}
let g = jeu('londres'); g.api.talk('smith');
cas('menace dite : pas de bagarre', g, 'je vous étrangle', 'dire', r => !/Votre geste|vous jetez|Corps à corps/.test(r.txt) && r.g.state.loc === 'institut');
cas('geste dit : on reste en conversation', g, 'je fouille la salle', 'dire', r => r.g.state.talk === 'smith' || /smith/.test(r.txt));
cas('« je cherche… » dit : une question', g, 'je cherche Beddows', 'dire', r => /\[smith\]/.test(r.txt));
cas('partir, dit tout haut', g, 'bon, je dois y aller', 'dire', r => !r.g.state.talk);
g = jeu('londres'); g.api.talk('smith');
cas('geste fait : on quitte la conversation', g, 'je regarde la salle', 'agir', r => !r.g.state.talk);
g = jeu('londres'); g.api.talk('smith');
cas('violence faite', g, 'je l’étrangle', 'agir', r => /geste|agents|poste|Corps/.test(r.txt));
g = jeu('prologue');
cas('parler seul, plusieurs personnes', g, 'bonsoir tout le monde', 'dire', r => /qui/i.test(r.txt) && !r.g.state.talk);
cas('parler à quelqu’un qu’on nomme', g, 'Bastien, où est M. Ravel ?', 'dire', r => r.g.state.talk === 'serveur' && /Ravel|parti/.test(r.txt));
g = jeu('prologue');
cas('dire un mot du décor : rien ne bouge', g, 'la table', 'dire', r => r.g.state.loc === 'restaurant' && !/cognac intact|serviette/.test(r.txt));
cas('agir sur le décor', g, 'j’examine la table', 'agir', r => /table|verre|serviette|cognac/i.test(r.txt));
console.log('cas ' + 10 + ' ratés ' + bad);
