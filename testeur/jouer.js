#!/usr/bin/env node
/* Testeur IA de L'Express de Minuit : ChatGPT joue des parties entières, sans écran, jusqu'au bout de la campagne.
   Le jeu tourne ici même (Node). À chaque tour, le modèle lit ce que le jeu vient d'écrire et ce qu'il y a à l'écran
   (boutons, carnet), puis tape son action (« Agir ») ou sa réplique (« Dire »), ou touche un bouton, comme un vrai joueur.
   Un chapitre fini enchaîne sur le suivant avec le même investigateur (Londres puis Paris et Poissy).
   Les transcriptions, le rapport et les données sont écrits dans testeur/sortie/. Aucun appel à OpenAI en simulation.

   node testeur/jouer.js --simulation --parties 3
   OPENAI_API_KEY=… node testeur/jouer.js --parties 4 --depart londres --tours 500 --modele gpt-5.6-luna --plafond 4
*/
'use strict';
const fs = require('fs'), path = require('path');
const ICI = __dirname, SRC = path.join(ICI, '..', 'jeu', 'src'), SORTIE = path.join(ICI, 'sortie');

// ---------------------------------------------------------------- options
const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true); };
const SIMULATION = !!opt('simulation', false), PARTIES = +opt('parties', 3), TOURS = +opt('tours', 500);
const PROFIL = String(opt('profil', 'tous')), PERSO = String(opt('personnage', 'tous')), DEPART = String(opt('depart', 'londres'));
const MODELE = String(opt('modele', 'gpt-5.6-luna')), PLAFOND = +opt('plafond', 3), CRITIQUE = opt('critique', 'oui') !== 'non';
const BLOCAGE = +opt('blocage', 40); // tours sans aucun progrès avant de parler de blocage
const PARALLELES = Math.max(1, +opt('paralleles', 3)); // parties jouées en même temps (le jeu avance d'un bloc entre deux appels : pas de mélange)
// les réponses génériques qui veulent dire « je n'ai pas compris » (absent ou verbe connu sans objet sont de vraies réponses)
const INCOMPRIS = /^(perdu|nom|pnj|pnj-part|clarifier)$/;
// tarifs en dollars par million de jetons (entrée, sortie), d'après la grille officielle d'OpenAI de novembre 2026
const TARIFS = { 'gpt-5.6-luna': [0.20, 1.20], 'gpt-5.6-terra': [2.00, 12.00], 'gpt-5.6-sol': [4.00, 20.00] };
const TARIF = TARIFS[MODELE] || [2.00, 12.00];

// ---------------------------------------------------------------- le jeu, sans écran, avec tous ses chapitres
global.window = global;
global.RPG_REPLIS = []; global.RPG_ABSENTS = []; global.RPG_ECHOS = [];
['engine', 'scene', 'londres', 'londres_circuits', 'londres_combat', 'parole', 'fiches', 'jets', 'londres_seance', 'londres_impro', 'londres_objets', 'paris', 'poissy', 'idees', 'folie']
  .forEach(f => require(path.join(SRC, f + '.js')));

const PROFILS = {
  methodique: 'Tu es un joueur méthodique : tu examines chaque lieu, tu fouilles, tu relis ton carnet, tu interroges chaque personnage sur chaque piste, tu suis les indices dans l’ordre.',
  bavard: 'Tu es un joueur très bavard : tu parles longuement aux personnages, tu leur poses des questions personnelles, sur leur vie, leurs opinions, l’actualité de 1923, tu rebondis sur ce qu’ils viennent de dire et tu acceptes ce qu’on te propose.',
  absurde: 'Tu es un joueur qui teste les limites : de temps en temps tu fais des choses absurdes ou inattendues (danser, jeter un verre, insulter, chanter, vouloir rentrer chez toi, manger un objet), puis tu reprends l’enquête sérieusement.',
  menteur: 'Tu es un joueur rusé : tu mens sur ton identité, tu te fais passer pour un policier, un journaliste ou un parent, tu bluffes, tu marchandes, tu demandes des jets de Baratin ou de Persuasion.',
  presse: 'Tu es un joueur pressé : tu vas droit au but, phrases très courtes, tu enchaînes les déplacements et tu cherches la fin le plus vite possible.',
  fautes: 'Tu tapes vite sur un téléphone : fautes de frappe, pas d’accents, abréviations, phrases mal construites, mais tu joues sérieusement l’enquête.'
};
const PERSOS = { pemberton: 0, doyle: 1, ashby: 2, prologue: null };
const listeProfils = PROFIL === 'tous' ? Object.keys(PROFILS) : [PROFIL];
const listePersos = PERSO === 'tous' ? ['pemberton', 'doyle', 'ashby'] : [PERSO];
if (!listeProfils.every(p => PROFILS[p]) || !listePersos.every(p => p in PERSOS) || !/^(londres|paris|prologue)$/.test(DEPART)) { console.error('Profil, personnage ou départ inconnu.'); process.exit(1); }

function ligne(e) {
  switch (e.t) {
    case 'npc': return (e.name || e.who || 'PNJ') + ' : ' + e.x;
    case 'narr': case 'event': return e.x;
    case 'doc': return '[document] ' + e.x;
    case 'clue': return '[indice noté dans le carnet] ' + (e.x || e.title || '');
    case 'item': return '[objet] ' + e.x;
    case 'loc': return '[lieu] ' + (e.name || e.loc || '');
    case 'check': return '[jet demandé] ' + e.skill + ' ' + e.target + ' %';
    case 'roll': return '[dés] ' + e.skill + ' : ' + e.r + '/' + e.target + ' — ' + e.levelName;
    case 'chips': return '[boutons] ' + (e.list || []).map(x => x.label).join(' | ');
    case 'sys': return '[système] ' + e.x;
    case 'end': return '[FIN DU CHAPITRE]';
    case 'title': return '== ' + e.x + ' ==';
    default: return null;
  }
}

// ---------------------------------------------------------------- ce que l'écran montre, et ce qu'un toucher y fait (comme ui.js)
function boutons(g) {
  const s = g.state;
  if (s.ended || s.pending) return [];
  if (s.pendingPush) return [{ label: 'Insister (jet forcé)', push: true }, { label: 'Laisser tomber', decline: true }];
  const liste = [];
  // les boutons posés dans le fil depuis la dernière action du joueur (« Voulez-vous… », les choix d'une scène)
  for (let i = s.log.length - 1; i >= 0; i--) { const e = s.log[i]; if (e.t === 'player') break; if (e.t === 'chips') { liste.push(...e.list.map(c => Object.assign({ fil: true }, c))); break; } }
  if (s.talk) g.suggestionsParole(4, 'normal').forEach(t => liste.push(Object.assign({ parole: true }, t)));
  else {
    if (g.reflexionPossible()) liste.push({ label: 'Réfléchir', reflechir: true });
    g.ideas(4, 'normal').forEach(i => liste.push(i));
  }
  return liste;
}
function toucher(g, b) {
  if (b.push) return g.push();
  if (b.decline) return g.declinePush();
  if (b.fil) { const c = Object.assign({}, b); delete c.fil; return g.choose(c); }
  if (b.parole) {
    if (b.cult) return g.choose({ label: b.label, say: b.say, cult: b.cult });
    if (b.say) return g.step(b.say, 'dire');
    if (b.mal) return g.choose({ label: b.label, mal: b.mal });
    return g.choose({ label: b.label, topic: b.topic });
  }
  return g.choose(b);
}
const titreIndice = (SC, id) => (SC.clues[id] && SC.clues[id].title) || id;
function ecran(g, SC, bs) {
  const s = g.state, l = [];
  l.push(`[écran] ${SC.short || s.chapter} · ${g.where()} · ${g.clock()}` + (s.talk ? ` · en conversation avec ${(SC.people && SC.people[s.talk] && SC.people[s.talk].name) || s.talk}` : ''));
  l.push(`[carnet] ${s.clues.length ? s.clues.map(id => titreIndice(SC, id)).join(' ; ') : 'vide'}`);
  if (s.inv.length) l.push(`[sur vous] ${s.inv.join(' ; ')}`);
  l.push(bs.length ? '[boutons] ' + bs.map((b, i) => `${i + 1}. ${b.label}`).join('  ') : '[boutons] aucun');
  return l.join('\n');
}

// ---------------------------------------------------------------- l'appel au modèle (API Responses), côté serveur seulement
let depense = 0, sansRaisonnement = false;
async function demander(instructions, entree, maxSortie) {
  const corps = { model: MODELE, instructions, input: entree, max_output_tokens: maxSortie };
  if (!sansRaisonnement) corps.reasoning = { effort: 'low' }; // réfléchir peu : on veut une action de joueur, pas une dissertation
  let r, j;
  for (let essai = 0; essai < 3; essai++) {
    r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
      body: JSON.stringify(corps)
    });
    j = await r.json().catch(() => ({}));
    if (r.status === 429 || r.status >= 500) { await new Promise(f => setTimeout(f, 4000 * (essai + 1))); continue; }
    break;
  }
  if (!r.ok && r.status === 400 && !sansRaisonnement && /reasoning/i.test(JSON.stringify(j.error || ''))) { sansRaisonnement = true; return demander(instructions, entree, maxSortie); }
  if (!r.ok) throw new Error('API OpenAI ' + r.status + ' : ' + String((j.error && j.error.message) || '').slice(0, 200));
  const u = j.usage || {}; depense += ((u.input_tokens || 0) * TARIF[0] + (u.output_tokens || 0) * TARIF[1]) / 1e6;
  let texte = j.output_text || '';
  if (!texte && Array.isArray(j.output)) texte = j.output.flatMap(o => (o.content || []).map(c => c.text || '')).join('').trim();
  return texte.trim();
}

// en simulation, un joueur au hasard : il tape des phrases toutes faites ou touche un bouton
const SIMUL = {
  agir: ['regarder autour de moi', 'je fouille la pièce', 'je lis le journal', 'je sors', 'je vais à l hôtel', 'je dors', 'examiner la porte', 'je danse', 'jet de psychologie', 'je prends un taxi', 'je relis mon carnet', 'je vais à la gare'],
  dire: ['bonjour', 'qui êtes-vous ?', 'que savez-vous de lui ?', 'je prends', 'non merci', 'oui', 'au revoir', 'je suis inspecteur de police', 'pouvez-vous m’aider ?', 'parlez-moi de votre travail', 'et ensuite ?', 'combien ?']
};
async function actionSuivante(profil, historique, vue, bs, enConv) {
  if (SIMULATION) {
    if (bs.length && Math.random() < 0.45) return { bouton: 1 + Math.floor(Math.random() * bs.length) };
    const pool = enConv && Math.random() < 0.75 ? SIMUL.dire : SIMUL.agir;
    return { mode: enConv && pool === SIMUL.dire ? 'dire' : 'agir', texte: pool[Math.floor(Math.random() * pool.length)] };
  }
  const instr = `Tu joues à un jeu de rôle textuel en français, dans l'esprit de L'Appel de Cthulhu, en 1923. ${PROFILS[profil]}
Tu ne connais pas le scénario : tu le découvres en jouant, et tu veux aller au bout de l'enquête. Le jeu a deux façons d'écrire : « Agir » pour ce que fait ton personnage, « Dire » pour ses paroles exactes quand il parle à quelqu'un. Il y a aussi des boutons à l'écran.
Réponds UNIQUEMENT par une seule ligne, sous l'une de ces formes :
AGIR : je fouille le bureau
DIRE : Où étiez-vous hier soir ?
BOUTON 2
Écris toi-même le plus souvent, comme un joueur humain, en une phrase courte ; touche un bouton quand c'est vraiment le plus naturel ou que tu ne sais plus quoi faire. Pas de guillemets, pas de commentaire.`;
  const texte = await demander(instr, historique.slice(-14000) + '\n\n' + vue + '\nÀ toi :', 700);
  const l = texte.split('\n').map(x => x.trim()).filter(Boolean)[0] || '';
  const m = l.match(/^\**\s*(AGIR|DIRE|BOUTON)\s*\**\s*[:\-–]?\s*(.*)$/i);
  if (m && /^bouton$/i.test(m[1])) { const n = parseInt(m[2], 10); if (n >= 1 && n <= bs.length) return { bouton: n }; }
  const brut = (m ? m[2] : l).replace(/^["«“\s]+|["»”\s]+$/g, '').slice(0, 220) || 'regarder autour de moi';
  return { mode: m ? m[1].toLowerCase() : (enConv ? 'dire' : 'agir'), texte: brut };
}

async function critique(morceau, entete) {
  if (SIMULATION || !CRITIQUE) return [];
  const instr = `Tu relis un extrait de la transcription d'une partie de jeu de rôle textuel en français (1923, L'Appel de Cthulhu). Chaque tour commence par « > (numéro) AGIR/DIRE/BOUTON : ce que le joueur a fait ». Relève UNIQUEMENT les vrais problèmes :
- réponse à côté de ce que le joueur a dit ou fait, action ou réplique raisonnable mal comprise ;
- incohérence : contradiction de faits, de lieux, d'heures ou de chronologie, personnage présent ou absent à tort, objet ou indice qui n'existe pas encore, quelqu'un qui sait ce qu'il ne devrait pas savoir ;
- blocage : le joueur tourne en rond sans que le jeu lui laisse une issue, une piste attendue qui ne mène nulle part, une conversation qui se ferme sans raison ;
- personnage qui sort de son rôle ou change de caractère, phrase qui trahit un programme ;
- texte répété mot pour mot, faute de français ou d'accord (masculin/féminin).
Ne signale pas les fautes du joueur, ni les jets ratés, ni ce qui est seulement inhabituel. Réponds en JSON : {"problemes":[{"tour":numéro,"commande":"ce que le joueur a fait à ce tour, recopié","reponse":"extrait court de la réponse du jeu","probleme":"…","type":"incomprehension|incoherence|blocage|role|repetition|langue","gravite":"faible|moyenne|forte"}]}. Si tout va bien : {"problemes":[]}.`;
  const t = await demander(instr, entete + '\n\n' + morceau, 8000);
  try { return (JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)).problemes) || []; } catch (e) { return [{ tour: 0, probleme: 'réponse de critique illisible', type: 'autre', gravite: 'faible' }]; }
}

// ---------------------------------------------------------------- d'un chapitre à l'autre (comme investigateurSuivant dans ui.js)
function suiteOuverte(SC, s) { const fin = s.flags && s.flags.fin; return !!(SC.suite && CHAPTERS[SC.suite] && s.ended && (!fin || fin === 'fugitif')); }
function investigateurSuivant(g, SC) {
  const s = g.state, pc = JSON.parse(JSON.stringify(s.pc)), f = s.flags || {}, drapeaux = {};
  (SC.memoire || []).forEach(k => { if (f[k] !== undefined && f[k] !== null && typeof f[k] !== 'object') drapeaux[k] = f[k]; });
  const carnet = s.clues.map(id => { let c = SC.clues[id]; if (!c) return null; if (SC.clueView) c = SC.clueView(s, id, c); return { id, title: c.title, text: c.text }; }).filter(Boolean);
  const docs = (s.docs || []).slice(), vus = {}; docs.forEach(d => { vus[d.x] = 1; });
  s.log.forEach(e => { if (e.t === 'doc' && !vus[e.x]) { vus[e.x] = 1; docs.push({ x: e.x, title: e.title || '' }); } });
  const P = SC.people || {}, gens = Object.keys(s.npcs).filter(k => s.npcs[k].met && P[k]).map(k => P[k]);
  pc.inv = s.inv.slice(); pc.money = s.money;
  pc.passe = Object.assign({}, pc.passe || {});
  pc.passe[s.chapter] = { titre: SC.short || s.chapter, fin: f.fin || 'ok', min: s.min, quand: g.clock(), indices: s.clues.slice(), carnet, docs, gens, drapeaux };
  return pc;
}

// ---------------------------------------------------------------- une partie : un investigateur, d'un chapitre au suivant
const progres = (g) => { const s = g.state; return s.chapter + '|' + s.clues.length + '|' + Object.keys(s.visited || {}).length + '|' + Object.keys(s.flags || {}).length + '|' + s.inv.length; };
async function partie(n, perso, profil) {
  let ch = DEPART, SC = CHAPTERS[ch];
  const pi = PERSOS[perso];
  let pc = DEPART === 'prologue' || pi === null ? undefined : JSON.parse(JSON.stringify(SC.pregens[pi]));
  let g = RPG.createGame(SC, null, pc ? { pc } : {});
  const chapitres = [], tours = [], texte = [], auto = [];
  let vu = 0, historique = '', t = 0, calme = 0, dernierProgres = progres(g), signale = false;
  const lire = () => { const n0 = g.state.log.filter(e => e.n > vu && e.t !== 'player' && e.t !== 'ask').map(ligne).filter(Boolean); vu = g.state.seq; return n0; };
  const ouvrir = () => { const d = lire(); const b = `\n## ${SC.chapter || ch}\n` + d.join('\n'); texte.push(b); historique += b + '\n'; chapitres.push({ ch, debut: t + 1 }); };
  ouvrir();
  while (t < TOURS) {
    if (!SIMULATION && depense >= PLAFOND) { texte.push('[arrêt : plafond de dépense atteint]'); break; }
    if (g.state.ended) {
      const fin = (g.state.flags && g.state.flags.fin) || 'ok', c = chapitres[chapitres.length - 1]; c.fin = fin; c.tours = t - c.debut + 1; c.indices = g.state.clues.length;
      if (!suiteOuverte(SC, g.state)) break;
      pc = investigateurSuivant(g, SC); ch = SC.suite; SC = CHAPTERS[ch];
      g = RPG.createGame(SC, null, { pc: JSON.parse(JSON.stringify(pc)) }); vu = 0; calme = 0; dernierProgres = progres(g); signale = false;
      historique = historique.slice(-3000) + `\n[le chapitre suivant commence : ${SC.chapter || ch}]\n`;
      ouvrir(); continue;
    }
    t++;
    const bs = boutons(g), enConv = !!g.state.talk && !g.state.pending;
    let a;
    try { a = await actionSuivante(profil, historique, ecran(g, SC, bs), bs, enConv); } catch (e) { texte.push('[erreur API] ' + e.message); break; }
    const avantTalk = g.state.talk, replis0 = RPG_REPLIS.length, absents0 = RPG_ABSENTS.length, echos0 = RPG_ECHOS.length;
    let libelle, plante = null;
    try {
      if (a.bouton) { const b = bs[a.bouton - 1]; libelle = `BOUTON : ${b.label}`; toucher(g, b); }
      else { libelle = `${a.mode.toUpperCase()} : ${a.texte}`; g.step(a.texte, a.mode); }
      let garde = 0; while (g.state.pending && garde++ < 8) g.roll();
    } catch (e) { plante = String(e && e.stack || e).split('\n').slice(0, 3).join(' | '); }
    const rep = lire();
    const replis = RPG_REPLIS.slice(replis0), absents = RPG_ABSENTS.slice(absents0), echos = RPG_ECHOS.slice(echos0);
    const x = { t, ch, cmd: libelle, rep, lieu: g.state.loc, heure: g.clock(), talk: g.state.talk || null, replis: replis.map(r => r.k + (r.who ? ':' + r.who : '')), incompris: replis.some(r => INCOMPRIS.test(r.k)), indices: g.state.clues.length };
    if (plante) { x.plante = plante; auto.push({ tour: t, commande: libelle, reponse: plante, probleme: 'le moteur a planté', type: 'plantage', gravite: 'forte' }); }
    if (avantTalk && !g.state.talk && !g.state.ended && !/\b(au revoir|adieu|bonne (journee|soiree|nuit)|merci,? au revoir|a bientot|je (m en vais|pars|sors|vous laisse)|je dois (y aller|partir))\b/i.test(libelle.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/’/g, ' ')) && !a.bouton) x.fermee = avantTalk;
    replis.forEach(r => { if (r.k === 'pnj-part') auto.push({ tour: t, commande: libelle, reponse: rep.join(' ').slice(0, 160), probleme: `${r.who} met fin à la conversation, à bout de patience (filtre automatique)`, type: 'blocage', gravite: 'moyenne' }); });
    absents.forEach(r => auto.push({ tour: t, commande: libelle, reponse: r.x, probleme: `${r.who} parle alors qu'il n'est pas là (filtre automatique)`, type: 'incoherence', gravite: 'forte' }));
    echos.forEach(r => auto.push({ tour: t, commande: libelle, reponse: r.x, probleme: `écho maladroit de la phrase du joueur (« ${r.echo} »)`, type: 'langue', gravite: 'faible' }));
    tours.push(x);
    const bloc = `\n> (${t}) ${libelle}    [${g.state.loc} · ${g.clock()}${x.incompris ? ' · non compris' : ''}]\n` + rep.join('\n');
    texte.push(bloc); historique += bloc + '\n';
    // un blocage : aucun progrès (indice, lieu, drapeau, objet) pendant longtemps
    const p = progres(g);
    if (p !== dernierProgres) { dernierProgres = p; calme = 0; signale = false; }
    else if (++calme >= BLOCAGE && !signale) {
      signale = true;
      const derniers = tours.slice(-BLOCAGE), comp = derniers.filter(y => y.incompris).length;
      auto.push({ tour: t, commande: derniers.slice(-5).map(y => y.cmd).join(' / '), reponse: `${BLOCAGE} tours sans progrès à ${g.state.loc} (${g.clock()}), dont ${comp} non compris`, probleme: 'le joueur tourne en rond (filtre automatique)', type: 'blocage', gravite: 'moyenne' });
    }
  }
  const c = chapitres[chapitres.length - 1]; if (!c.tours) { c.tours = t - c.debut + 1; c.indices = g.state.clues.length; c.fin = g.state.ended ? ((g.state.flags && g.state.flags.fin) || 'ok') : 'inachevé'; }
  const transcription = texte.join('\n');

  // la relecture par le modèle, par morceaux, pour couvrir toute la partie
  let problemes = [];
  const entete = `Partie : ${perso}, joueur ${profil}. Chapitres : ${chapitres.map(c => c.ch).join(' puis ')}.`;
  const morceaux = []; let cur = '';
  texte.forEach(b => { if (cur.length + b.length > 45000) { morceaux.push(cur); cur = ''; } cur += b + '\n'; }); if (cur) morceaux.push(cur);
  for (const m of morceaux) {
    if (!SIMULATION && depense >= PLAFOND + 0.5) break; // la relecture a une petite réserve au-delà du plafond de jeu
    try { problemes.push(...await critique(m, entete)); } catch (e) { problemes.push({ tour: 0, probleme: 'critique impossible : ' + e.message, gravite: 'faible' }); }
  }
  // les filtres automatiques, gratuits
  const META = /\b(action simple|formulez|essayez de|commande|programme|intelligence artificielle|chatgpt|syntaxe)\b/i;
  tours.forEach(x => x.rep.forEach(l => { if (META.test(l)) auto.push({ tour: x.t, commande: x.cmd, reponse: l.slice(0, 160), probleme: 'phrase qui sort du monde du jeu (filtre automatique)', type: 'role', gravite: 'moyenne' }); }));
  const vus = {};
  tours.forEach(x => { const r = x.rep.filter(l => !/^\[(boutons|dés|jet demandé)\]/.test(l)).join(' '); if (r.length < 40) return; (vus[r] = vus[r] || []).push(x.t); });
  Object.keys(vus).forEach(r => { if (vus[r].length >= 3) auto.push({ tour: vus[r][0], commande: tours.find(y => y.t === vus[r][0]).cmd, reponse: r.slice(0, 160), probleme: `même réponse ${vus[r].length} fois (tours ${vus[r].slice(0, 8).join(', ')})`, type: 'repetition', gravite: 'faible' }); });
  problemes = problemes.concat(auto);

  const nom = `partie_${String(n).padStart(2, '0')}_${perso}_${profil}`;
  const nonCompris = tours.filter(x => x.incompris).length;
  fs.writeFileSync(path.join(SORTIE, nom + '.md'), `# ${nom}\n\n${entete} ${tours.length} tours · non compris : ${nonCompris} · ` + chapitres.map(c => `${c.ch} : ${c.fin}, ${c.tours} tours, ${c.indices} indices`).join(' · ') + '\n\n' + transcription + '\n');
  fs.writeFileSync(path.join(SORTIE, nom + '.json'), JSON.stringify({ nom, perso, profil, chapitres, tours }, null, 0));
  return { nom, perso, profil, tours: tours.length, chapitres, nonCompris, fermees: tours.filter(x => x.fermee).length, problemes };
}

(async () => {
  if (!SIMULATION && !process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY absente : ajoutez le secret, ou lancez en simulation.'); process.exit(1); }
  fs.mkdirSync(SORTIE, { recursive: true });
  const plan = []; for (let i = 0; i < PARTIES; i++) plan.push([listePersos[i % listePersos.length], listeProfils[i % listeProfils.length]]); // personnages et façons de jouer varient ensemble
  const res = new Array(plan.length); let suivante = 0;
  async function ouvrier() {
    while (suivante < plan.length) {
      const i = suivante++;
      if (!SIMULATION && depense >= PLAFOND) { console.log('Plafond atteint : la partie ' + (i + 1) + ' ne commence pas'); continue; }
      console.log(`Partie ${i + 1}/${plan.length} : ${plan[i][0]}, profil ${plan[i][1]}, départ ${DEPART}`);
      const r = res[i] = await partie(i + 1, plan[i][0], plan[i][1]);
      console.log(`   partie ${i + 1} : ${r.tours} tours, ${r.chapitres.map(c => c.ch + ' ' + c.fin).join(' → ')}, ${r.nonCompris} non compris, ${r.problemes.length} problème(s), dépense totale ${depense.toFixed(3)} $`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALLELES, plan.length) }, ouvrier));
  res.splice(0, res.length, ...res.filter(Boolean));
  const lignes = [`# Testeur IA — ${SIMULATION ? 'SIMULATION (aucun appel à OpenAI)' : 'modèle ' + MODELE}`, '', `${res.length} partie(s), départ ${DEPART} · dépense ${depense.toFixed(2)} $ sur un plafond de ${PLAFOND} $`, ''];
  res.forEach(r => {
    lignes.push(`## ${r.nom} — ${r.tours} tours · ${r.chapitres.map(c => `${c.ch} : ${c.fin} (${c.tours} tours, ${c.indices} indices)`).join(' → ')} · non compris : ${r.nonCompris} · conversations fermées : ${r.fermees}`);
    if (!r.problemes.length) lignes.push('Rien à signaler.');
    r.problemes.sort((a, b) => (a.tour || 0) - (b.tour || 0)).forEach(p => { const cmd = p.commande || p.joueur, rep = p.reponse || p.jeu; lignes.push(`- [${p.gravite || '?'}${p.type ? ' · ' + p.type : ''}] tour ${p.tour} : ${p.probleme}${cmd ? ` — joueur : « ${cmd} »` : ''}${rep ? ` — jeu : « ${String(rep).slice(0, 160)} »` : ''}`); });
    lignes.push('');
  });
  fs.writeFileSync(path.join(SORTIE, 'rapport.md'), lignes.join('\n'));
  fs.writeFileSync(path.join(SORTIE, 'resultats.json'), JSON.stringify({ modele: MODELE, simulation: SIMULATION, depart: DEPART, depense, parties: res }, null, 1));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lignes.slice(0, 3 + res.length * 0).join('\n') + '\n' + res.map(r => `- ${r.nom} : ${r.tours} tours, ${r.chapitres.map(c => c.ch + ' ' + c.fin).join(' → ')}, ${r.problemes.length} problème(s)`).join('\n') + '\n');
  console.log(lignes.slice(0, 3).join('\n'));
})();
