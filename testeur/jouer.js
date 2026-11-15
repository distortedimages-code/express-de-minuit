#!/usr/bin/env node
/* Testeur IA de L'Express de Minuit : ChatGPT joue des parties entières, sans écran.
   Le jeu tourne ici même (Node) ; à chaque tour, le modèle lit ce que le jeu vient d'écrire et tape l'action suivante.
   Les transcriptions et le rapport sont écrits dans testeur/sortie/. Aucun appel à OpenAI en simulation.

   node testeur/jouer.js --simulation --parties 3
   OPENAI_API_KEY=… node testeur/jouer.js --parties 6 --profil absurde --modele gpt-5.6-luna --plafond 3
*/
'use strict';
const fs = require('fs'), path = require('path');
const ICI = __dirname, SRC = path.join(ICI, '..', 'jeu', 'src'), SORTIE = path.join(ICI, 'sortie');

// ---------------------------------------------------------------- options
const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true); };
const SIMULATION = !!opt('simulation', false), PARTIES = +opt('parties', 3), TOURS = +opt('tours', 120);
const PROFIL = String(opt('profil', 'tous')), PERSO = String(opt('personnage', 'tous'));
const MODELE = String(opt('modele', 'gpt-5.6-luna')), PLAFOND = +opt('plafond', 3), CRITIQUE = opt('critique', 'oui') !== 'non';
// tarifs en dollars par million de jetons (entrée, sortie), d'après la grille officielle d'OpenAI de novembre 2026
const TARIFS = { 'gpt-5.6-luna': [0.20, 1.20], 'gpt-5.6-terra': [2.00, 12.00], 'gpt-5.6-sol': [4.00, 20.00] };
const TARIF = TARIFS[MODELE] || [2.00, 12.00];

// ---------------------------------------------------------------- le jeu, sans écran
global.window = global;
['engine', 'scene', 'londres', 'londres_circuits', 'londres_combat', 'parole', 'fiches', 'jets', 'londres_seance', 'londres_impro', 'londres_objets']
  .forEach(f => require(path.join(SRC, f + '.js')));

const PROFILS = {
  methodique: 'Tu es un joueur méthodique : tu examines chaque lieu, tu fouilles, tu prends des notes, tu interroges chaque personnage sur chaque piste, tu suis les indices dans l’ordre.',
  bavard: 'Tu es un joueur très bavard : tu parles longuement aux personnages, tu leur poses des questions personnelles, sur leur vie, leurs opinions, l’actualité de 1923, et tu reviens sur ce qu’ils ont dit.',
  absurde: 'Tu es un joueur qui teste les limites : de temps en temps tu fais des choses absurdes ou inattendues (danser, jeter un verre, insulter, chanter, vouloir rentrer chez toi, manger un objet), puis tu reprends l’enquête.',
  menteur: 'Tu es un joueur rusé : tu mens sur ton identité, tu te fais passer pour un policier, un journaliste ou un parent, tu bluffes et tu demandes des jets de Baratin ou de Persuasion.',
  presse: 'Tu es un joueur pressé : tu vas droit au but, phrases très courtes, tu enchaînes les déplacements et tu cherches la fin le plus vite possible.',
  fautes: 'Tu tapes vite sur un téléphone : fautes de frappe, pas d’accents, abréviations, phrases mal construites, mais tu joues sérieusement l’enquête.'
};
const PERSOS = { prologue: { ch: 'prologue', pc: null }, pemberton: { ch: 'londres', pc: 0 }, doyle: { ch: 'londres', pc: 1 }, ashby: { ch: 'londres', pc: 2 } };
const listeProfils = PROFIL === 'tous' ? Object.keys(PROFILS) : [PROFIL];
const listePersos = PERSO === 'tous' ? ['pemberton', 'doyle', 'ashby', 'prologue'] : [PERSO];
if (!listeProfils.every(p => PROFILS[p]) || !listePersos.every(p => PERSOS[p])) { console.error('Profil ou personnage inconnu.'); process.exit(1); }

function ligne(e) {
  switch (e.t) {
    case 'npc': return (e.name || e.who || 'PNJ') + ' : ' + e.x;
    case 'narr': case 'event': return e.x;
    case 'doc': return '[document] ' + e.x;
    case 'clue': return '[indice noté dans le carnet] ' + (e.x || e.title || '');
    case 'item': return '[objet] ' + e.x;
    case 'loc': return '[lieu] ' + e.x;
    case 'check': return '[jet demandé] ' + e.skill + ' ' + e.target + ' %';
    case 'roll': return '[dés] ' + e.skill + ' : ' + e.r + '/' + e.target + ' — ' + e.levelName;
    case 'chips': return '[suggestions] ' + (e.list || []).map(x => x.label).join(' | ');
    case 'sys': return '[système] ' + e.x;
    case 'end': return '[FIN DE LA PARTIE]';
    case 'title': return '== ' + e.x + ' ==';
    default: return null;
  }
}

// ---------------------------------------------------------------- l'appel au modèle (API Responses)
let depense = 0;
let sansRaisonnement = false;
async function demander(instructions, entree, maxSortie) {
  const corps = { model: MODELE, instructions, input: entree, max_output_tokens: maxSortie };
  if (!sansRaisonnement) corps.reasoning = { effort: 'low' }; // réfléchir peu : on veut une action de joueur, pas une dissertation
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify(corps)
  });
  const j = await r.json();
  if (!r.ok && r.status === 400 && !sansRaisonnement && /reasoning/i.test(JSON.stringify(j.error || ''))) { sansRaisonnement = true; return demander(instructions, entree, maxSortie); }
  if (!r.ok) throw new Error('API OpenAI ' + r.status + ' : ' + String((j.error && j.error.message) || '').slice(0, 200));
  const u = j.usage || {}; depense += ((u.input_tokens || 0) * TARIF[0] + (u.output_tokens || 0) * TARIF[1]) / 1e6;
  let texte = j.output_text || '';
  if (!texte && Array.isArray(j.output)) texte = j.output.flatMap(o => (o.content || []).map(c => c.text || '')).join('').trim();
  return texte.trim();
}

const SIMUL = ['regarder autour de moi', 'je parle au concierge', 'que savez-vous du professeur smith ?', 'je fouille la pièce', 'aller à scotland yard', 'je danse', 'je lis le journal', 'au revoir', 'qui êtes-vous ?', 'je vais à la gare victoria', 'je suis inspecteur de police', 'jet de psychologie', 'examiner la porte', 'ou est beddows', 'je rentre à l hôtel', 'je dors'];
async function actionSuivante(perso, profil, historique) {
  if (SIMULATION) return SIMUL[Math.floor(Math.random() * SIMUL.length)];
  const instr = `Tu joues à un jeu de rôle textuel en français, dans l'esprit de L'Appel de Cthulhu, en 1923. ${PROFILS[profil]}
Tu ne connais pas le scénario : tu le découvres en jouant. Réponds UNIQUEMENT par ce que tu tapes au clavier pour ton personnage : une action ou une réplique, une seule phrase courte, en français, comme un joueur humain (« je fouille le bureau », « parler au concierge », « Où étiez-vous hier soir ? »). Pas de guillemets, pas de commentaire. Si le jeu demande un jet de dés, écris « lancer ».`;
  const texte = await demander(instr, historique.slice(-6000), 600);
  return texte.split('\n')[0].replace(/^["«\s]+|["»\s]+$/g, '').slice(0, 200) || 'regarder autour de moi';
}
async function critique(transcription, perso, profil) {
  if (SIMULATION || !CRITIQUE) return [];
  const instr = `Tu relis la transcription d'une partie de jeu de rôle textuel en français (1923, L'Appel de Cthulhu). Relève UNIQUEMENT les vrais problèmes : réponse qui trahit qu'il s'agit d'un jeu ou d'un programme, réponse à côté de la question, personnage qui sort de son rôle ou change de caractère, contradiction de faits ou de chronologie, texte répété, faute de français ou d'accord (masculin/féminin), action du joueur raisonnable mais mal comprise. Réponds en JSON : {"problemes":[{"tour":numéro,"commande":"ce que le joueur a tapé à ce tour, recopié","reponse":"extrait court de ce que le jeu a répondu","probleme":"…","gravite":"faible|moyenne|forte"}]}. Si tout va bien : {"problemes":[]}.`;
  const t = await demander(instr, transcription.slice(-60000), 6000);
  try { return (JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)).problemes) || []; } catch (e) { return [{ tour: 0, probleme: 'réponse de critique illisible', gravite: 'faible' }]; }
}

// ---------------------------------------------------------------- une partie
async function partie(n, perso, profil) {
  const P = PERSOS[perso], L = CHAPTERS[P.ch], pc = P.pc === null ? undefined : L.pregens[P.pc];
  const g = RPG.createGame(L, null, pc ? { pc } : {});
  let vu = 0, texte = [], tours = [], historique = '';
  const lire = () => { const n0 = g.state.log.filter(e => e.n > vu && e.t !== 'player' && e.t !== 'ask').map(ligne).filter(Boolean); vu = g.state.seq; return n0; };
  const debut = lire(); texte.push(...debut); historique += debut.join('\n') + '\n';
  for (let t = 1; t <= TOURS && !g.state.ended; t++) {
    if (!SIMULATION && depense >= PLAFOND) { texte.push('[arrêt : plafond de dépense atteint]'); break; }
    let cmd;
    try { cmd = await actionSuivante(perso, profil, historique); } catch (e) { texte.push('[erreur API] ' + e.message); break; }
    g.step(cmd);
    let garde = 0; while (g.state.pending && garde++ < 6) g.roll();
    const rep = lire();
    tours.push({ t, cmd, rep, lieu: g.state.loc, heure: g.clock() });
    const bloc = `\n> (${t}) ${cmd}    [${g.state.loc} · ${g.clock()}]\n` + rep.join('\n');
    texte.push(bloc); historique += bloc + '\n';
  }
  const transcription = texte.join('\n');
  let problemes = [];
  try { problemes = await critique(transcription, perso, profil); } catch (e) { problemes = [{ tour: 0, probleme: 'critique impossible : ' + e.message, gravite: 'faible' }]; }
  // le filtre automatique, gratuit : ce qui sonne comme un programme, et les répétitions
  const META = /\b(action simple|formulez|essayez de|commande|programme|je ne comprends pas|intelligence artificielle|chatgpt|syntaxe)\b/i;
  tours.forEach(x => {
    x.rep.forEach(l => { if (META.test(l)) problemes.push({ tour: x.t, joueur: x.cmd, jeu: l.slice(0, 160), probleme: 'phrase qui sort du monde du jeu (filtre automatique)', gravite: 'moyenne' }); });
  });
  for (let i = 1; i < tours.length; i++) if (tours[i].rep.join() && tours[i].rep.join() === tours[i - 1].rep.join()) problemes.push({ tour: tours[i].t, joueur: tours[i].cmd, jeu: tours[i].rep.join(' ').slice(0, 160), probleme: 'même réponse deux fois de suite (filtre automatique)', gravite: 'faible' });
  const nom = `partie_${String(n).padStart(2, '0')}_${perso}_${profil}`;
  fs.writeFileSync(path.join(SORTIE, nom + '.md'), `# ${nom}\n\nPersonnage : ${perso} · profil : ${profil} · ${tours.length} tours · fin : ${g.state.ended ? 'oui' : 'non'} · lieu final : ${g.state.loc} · indices : ${g.state.clues.length}\n\n` + transcription + '\n');
  return { nom, perso, profil, tours: tours.length, fin: !!g.state.ended, indices: g.state.clues.length, problemes };
}

(async () => {
  if (!SIMULATION && !process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY absente : ajoutez le secret, ou lancez en simulation.'); process.exit(1); }
  fs.mkdirSync(SORTIE, { recursive: true });
  const plan = []; for (let i = 0; i < PARTIES; i++) plan.push([listePersos[i % listePersos.length], listeProfils[i % listeProfils.length]]); // personnages et façons de jouer varient ensemble
  const res = [];
  for (let i = 0; i < plan.length; i++) {
    if (!SIMULATION && depense >= PLAFOND) { console.log('Plafond atteint : arrêt avant la partie ' + (i + 1)); break; }
    console.log(`Partie ${i + 1}/${plan.length} : ${plan[i][0]}, profil ${plan[i][1]}`);
    res.push(await partie(i + 1, plan[i][0], plan[i][1]));
    console.log(`   ${res[i].tours} tours, ${res[i].problemes.length} problème(s) relevé(s), dépense ${depense.toFixed(3)} $`);
  }
  const lignes = [`# Testeur IA — ${SIMULATION ? 'SIMULATION (aucun appel à OpenAI)' : 'modèle ' + MODELE}`, '', `${res.length} partie(s) · dépense ${depense.toFixed(2)} $ sur un plafond de ${PLAFOND} $`, ''];
  res.forEach(r => {
    lignes.push(`## ${r.nom} — ${r.tours} tours, ${r.indices} indices, fin : ${r.fin ? 'oui' : 'non'}`);
    if (!r.problemes.length) lignes.push('Rien à signaler.');
    r.problemes.forEach(p => { const cmd = p.commande || p.joueur, rep = p.reponse || p.jeu; lignes.push(`- [${p.gravite || '?'}] tour ${p.tour} : ${p.probleme}${cmd ? ` — joueur : « ${cmd} »` : ''}${rep ? ` — jeu : « ${String(rep).slice(0, 160)} »` : ''}`); });
    lignes.push('');
  });
  fs.writeFileSync(path.join(SORTIE, 'rapport.md'), lignes.join('\n'));
  fs.writeFileSync(path.join(SORTIE, 'resultats.json'), JSON.stringify({ modele: MODELE, simulation: SIMULATION, depense, parties: res }, null, 1));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lignes.join('\n') + '\n');
  console.log(lignes.slice(0, 3).join('\n'));
})();
