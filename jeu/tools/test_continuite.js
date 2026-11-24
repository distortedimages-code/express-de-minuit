// La suite d'un chapitre à l'autre : l'arrivée à Paris dépend de ce que l'investigateur a vécu à Londres.
// On fabrique le « passé » comme le fait l'interface à la fin de Londres (pc.passe.londres), puis on lance Paris.
global.window = global;
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
const L = CHAPTERS.londres, P = CHAPTERS.paris, J = 1440;
let rates = 0;
function paris(nom, passe, pcIndex) {
  const pc = JSON.parse(JSON.stringify(L.pregens[pcIndex || 0])); pc.inv = ['Une valise de billets']; pc.money = 900; pc.san = 38;
  pc.passe = { londres: Object.assign({ titre: 'Londres', fin: 'ok', indices: ['QUETE', 'PISTES'], carnet: [], docs: [], gens: [], drapeaux: { discours: true } }, passe) };
  let seed = 3; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const g = RPG.createGame(P, null, { rng, pc });
  return g;
}
function verif(nom, ok, detail) { if (!ok) rates++; console.log((ok ? 'ok   ' : 'RATÉ ') + nom + (detail ? ' — ' + detail : '')); }
const texte = g => g.state.log.filter(e => typeof e.x === 'string').map(e => e.x).join(' ');
// 1. départ de Victoria lundi 8 à 11 h : arrivée lundi 18 h 40, avant l'entrée dans la Ruhr
let g = paris('lundi', { min: 3 * J + 11 * 60, drapeaux: { discours: true } });
verif('arrivée le jour du départ, 7 h 40 plus tard', g.clock() === 'Lun 8 · 18 h 40', g.clock());
verif('la date de l’intro suit', /^Lundi 8 janvier 1923/.test(g.state.log.find(e => e.t === 'narr').x));
g.api.go('hotel'); g.choose({ label: 'j', action: 'ph_journal' });
verif('lundi 8 : la Ruhr n’est pas encore occupée', /menace d’envoyer l’armée dans la Ruhr/.test(texte(g)));
// 2. départ vendredi 12 à 10 h : la Ruhr est occupée depuis jeudi
g = paris('vendredi', { min: 7 * J + 10 * 60 });
g.api.go('hotel'); g.choose({ label: 'j', action: 'ph_journal' });
verif('vendredi 12 : la Ruhr occupée depuis jeudi', /entrées dans la Ruhr jeudi/.test(texte(g)), g.clock());
// 3. l'imposteur démasqué à Cheapside : la liste vient des cendres
g = paris('démasqué', { min: 4 * J + 600, drapeaux: { demasque: true } });
verif('démasqué : la liste ramassée dans les cendres', /cendres d’un lit/.test(texte(g)) && !/vous a dictée/.test(texte(g)));
// 4. le vrai Beddows retrouvé au British Museum
g = paris('Beddows', { min: 4 * J + 600, indices: ['QUETE', 'PISTES', 'BEDDOWS', 'BIBLIO'] });
verif('Beddows écorché : le doute sur Cheapside', /celui qui se faisait appeler Smith/.test(texte(g)) && /qui donc vous a ouvert la porte/.test(texte(g)));
verif('la piste du British Museum vers la Nationale', /dorment à la Bibliothèque nationale/.test(texte(g)));
// 5. parti en fugitif : la première arrestation à Paris est la dernière
g = paris('fugitif', { min: 4 * J + 600, fin: 'fugitif', drapeaux: { discours: true, fin: 'fugitif' } });
verif('fugitif : prévenu à l’arrivée', /Scotland Yard a votre signalement/.test(texte(g)) && !/Personne, que vous sachiez, ne vous suit/.test(texte(g)));
g.api.go('hotel'); g.choose({ label: 'p', action: 'ph_gerant' }); g.step('je le frappe');
verif('fugitif arrêté à Paris : rendu à Londres', g.state.ended && g.state.flags.fin === 'extrade', 'fin ' + g.state.flags.fin);
// 6. sans fugitif, la même bagarre : une nuit au poste
g = paris('sage', { min: 4 * J + 600 });
g.api.go('hotel'); g.choose({ label: 'p', action: 'ph_gerant' }); g.step('je le frappe');
verif('sans passé judiciaire : une nuit au poste', !g.state.ended && g.state.flags.arrestations === 1);
// 7. l'investigateur garde tout : santé mentale, argent, possessions, souvenirs
g = paris('garde', { min: 4 * J + 600, drapeaux: { maquetteDetruite: true } });
verif('santé, argent, possessions', g.state.pc.san === 38 && g.state.money === 900 && g.state.inv.indexOf('Une valise de billets') >= 0);
verif('Stanley abandonné revient en rêve', /Henry Stanley, qui hurle sans bruit/.test(texte(g)));
// 8. arrivée de nuit
g = paris('nuit', { min: 7 * J + 18 * 60 });
verif('départ à 18 h : arrivée en pleine nuit', g.clock() === 'Sam 13 · 01 h 40' && /en pleine nuit/.test(texte(g)), g.clock());
console.log('continuité : ' + (rates ? rates + ' ratés' : 'tout est bon'));
