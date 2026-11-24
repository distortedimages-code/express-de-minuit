// garde-fou des noms : le carnet et les sujets de conversation ne citent jamais un nom que le joueur n'a pas lu
// (Makryat à la salle de lecture du British Museum, le samedi, avant l'article du lundi)
global.window = global; global.RPG_ABSENTS = []; global.RPG_FAITS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
const sc = CHAPTERS.londres, H = sc._h; let ko = 0;
function ok(c, m) { if (!c) { ko++; console.log('ÉCHEC', m); } }
const pc = JSON.parse(JSON.stringify(sc.pregens[1]));
const g = RPG.createGame(sc, null, { rng: () => 0.3, pc });
g.state.flags.conference = true; g.state.flags.carteMusee = 0; g.state.min = H.at(1, 10, 15); g.state.loc = 'musee';
const labels = () => g.ideas(40, 'normal').map(x => x.label);
ok(!labels().some(l => /Makryat/.test(l)), 'samedi : le carnet parle de Makryat : ' + labels().join(' / '));
// le lundi, l'article nomme Makryat : l'idée devient possible
g.state.min = H.at(3, 9, 0); g.state.loc = 'hotel'; g.step('lire les journaux');
ok(g.state.noms && g.state.noms.Makryat, 'Makryat lu dans le journal, mais pas noté');
g.state.loc = 'musee';
ok(labels().some(l => /Makryat/.test(l)), 'lundi : l’idée Makryat ne revient pas : ' + labels().join(' / '));
// une version anonyme quand le nom n'est pas connu : « Parler au gérant » plutôt que « Parler à M. Blain »
const P = CHAPTERS.paris, g2 = RPG.createGame(P, null, { rng: () => 0.3, pc: JSON.parse(JSON.stringify(sc.pregens[0])) });
g2.state.noms = {}; g2.state.loc = 'hotel';
const l2 = g2.ideas(40, 'normal').map(x => x.label);
ok(!l2.some(l => /Blain/.test(l)), 'Paris : le gérant nommé avant d’être présenté : ' + l2.join(' / '));
// une ancienne sauvegarde sans s.noms : on reconstruit à partir du journal
const sauve = JSON.parse(JSON.stringify(g.state)); delete sauve.noms;
const g3 = RPG.createGame(sc, sauve, { rng: () => 0.3, pc: sauve.pc });
ok(g3.ideas(40, 'normal').map(x => x.label).some(l => /Makryat/.test(l)), 'sauvegarde rechargée : Makryat oublié');
console.log('problèmes', ko);
