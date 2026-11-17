// Les incompréhensions signalées en jeu, et celles de la même famille partout ailleurs.
// Règle de travail : chaque incompréhension corrigée devient (1) une règle générale du moteur, (2) un cas du CORPUS
// ci-dessous, joué tel quel et sous plusieurs variantes, et (3) si possible une SONDE qui cherche la même famille de
// problèmes dans tous les lieux de tous les chapitres, y compris ceux qui seront écrits plus tard.
// Usage : node jeu/tools/test_incomprehensions.js          (tout)    ·    … corpus | sondes | libelles | boutons
global.window = global; global.RPG_ABSENTS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','idees','folie']) require('../src/' + f + '.js');
const QUOI = process.argv[2] || 'tout';
const CHAPITRES = Object.assign({ prologue: window.SCENE }, window.CHAPTERS);
const RECIT = /Ce qui est fait est fait|Vous y repensez un instant|Le passé ne se rejoue pas/;
let ko = 0; const rapport = [];
function texte(g, n) { return g.state.log.slice(n).filter(e => typeof e.x === 'string' && e.t !== 'player').map(e => e.x).join(' '); }
function jouer(g, cmd, mode) { const n = g.state.log.length; g.step(cmd, mode || (g.state.talk ? 'dire' : undefined)); let k = 0; while (g.state.pending && k++ < 5) g.roll(); return texte(g, n); }
function partie(ch, prep) {
  const sc = CHAPITRES[ch];
  const g = RPG.createGame(sc, null, sc.pregens ? { rng: () => 0.1, pc: JSON.parse(JSON.stringify(sc.pregens[0])) } : { rng: () => 0.1 });
  if (prep) prep(g); g.state.pending = null; return g;
}
// les variantes d'une phrase : sans accents, apostrophes droites, minuscules, « je » ↔ infinitif pour quelques verbes
const CONJ = [['demander', 'je demande'], ['sortir', 'je sors'], ['chercher', 'je cherche'], ['aller', 'je vais'], ['examiner', 'j’examine'], ['regarder', 'je regarde']];
function variantes(ph) {
  const v = new Set([ph, ph.toLowerCase(), ph.normalize('NFD').replace(/[̀-ͯ]/g, ''), ph.replace(/[’]/g, "'")]);
  for (const [inf, je] of CONJ) {
    const re1 = new RegExp('^' + inf + '\\b', 'i'), re2 = new RegExp('^' + je + '\\b', 'i');
    if (re1.test(ph)) v.add(ph.replace(re1, je)); if (re2.test(ph)) v.add(ph.replace(re2, inf.charAt(0).toUpperCase() + inf.slice(1)));
  }
  return [...v];
}

// ---------------------------------------------------------------- A. le corpus : chaque cas signalé, avec sa règle
const banquet = g => { g.choose({ label: 'Écouter la conférence', action: 'i_conf' }); while (g.state.pending) g.roll(); };
const hotelLondres = g => { banquet(g); jouer(g, 'Rentrer à l’hôtel'); };
const poissy = loc => g => { g.api.flag('poissy', true); g.api.go(loc); };
const tarte = g => { jouer(g, 'je parle au serveur'); g.step('J’ai faim', 'dire'); let k = 0; while (g.state.pending && k++ < 5) g.roll(); };
const gerantSoir = g => { g.choose({ label: 'taxi', action: 'ga_taxi' }); g.choose({ label: 'gérant', action: 'ph_gerant' }); };
const CORPUS = [
  { date: '2026-11-16', ch: 'londres', prep: banquet, ph: 'Demander à l’accueil si ils ont vu l’homme à la moustache',
    ok: (g, t) => g.state.flags.moustachuSuivi && g.state.loc === 'institut', regle: 'une question indirecte n’est pas un récit du passé' },
  { date: '2026-11-16', ch: 'londres', prep: banquet, ph: 'Sortir pour trouver l’homme à la moustache',
    ok: (g, t) => g.state.flags.moustachuSuivi && g.state.loc === 'institut', regle: 'le but d’un déplacement sans destination est le geste' },
  { date: '2026-11-16', ch: 'londres', prep: banquet, ph: 'je demande au portier s’il a vu un homme à moustache',
    ok: (g, t) => g.state.flags.moustachuSuivi, regle: '« un homme à moustache » désigne quelqu’un' },
  { date: '2026-11-16', ch: 'londres', prep: hotelLondres, ph: 'Demander à l’accueil si ils ont vu l’homme à la moustache',
    ok: (g, t) => g.state.talk === 'concierge' && /moustache/.test(t), regle: 'question indirecte, posée au personnage présent' },
  { date: '2026-11-16', ch: 'londres', prep: hotelLondres, ph: 'Sortir pour trouver l’homme à la moustache',
    ok: (g, t) => /piste/.test(t) && g.state.loc === 'hotel', regle: 'chercher un absent : il faut une piste' },
  { date: '2026-11-16', ch: 'londres', prep: banquet, ph: 'j’ai déjà parlé à Smith tout à l’heure',
    ok: (g, t) => RECIT.test(t), regle: 'un vrai récit du passé reste un récit' },
  { date: '2026-11-16', ch: 'paris', prep: poissy('po_salle'), ph: 'j’examine les squelettes',
    ok: (g, t) => !/ne voyez pas/.test(t), regle: 'deux concepts ne se volent pas leurs mots (les squelettes restent des ossements)' },
  { date: '2026-11-16', ch: 'paris', prep: poissy('po_lorien'), ph: 'je vais à la gare de Lyon',
    ok: (g, t) => !/ne voyez pas|comprends pas/.test(t), regle: 'une entrée de plusieurs mots se lit dans la phrase' },
  // ce que la dernière réplique a mis sur la table : « je prends » se rapporte au dernier sujet abordé
  ...['Je prend', 'je prends', 'volontiers', 'je veux bien'].map(ph => ({ date: '2026-11-17', ch: 'prologue', prep: tarte, ph,
    ok: (g, t) => /terrine ou la tarte|Laquelle/.test(t) && g.state.talk === 'serveur', regle: 'une ellipse se rapporte au dernier sujet ; deux choses sur la table : il demande laquelle' })),
  ...['la tarte', 'va pour la tarte', 'je prends la tarte', 'une part de tarte'].map(ph => ({ date: '2026-11-17', ch: 'prologue', prep: tarte, ph,
    ok: (g, t) => /part de tarte/.test(t) && g.state.talk === 'serveur', regle: 'nommer une chose de la table la choisit' })),
  { date: '2026-11-17', ch: 'prologue', prep: tarte, ph: 'et la terrine ?', ok: (g, t) => /Terrine de campagne|porc/.test(t), regle: 'une question sur une chose de la table' },
  { date: '2026-11-17', ch: 'prologue', prep: tarte, ph: 'non merci', ok: (g, t) => /Comme monsieur voudra|Bien, monsieur/.test(t), regle: '« non merci » refuse l’offre, ce n’est pas un compliment' },
  { date: '2026-11-17', ch: 'prologue', prep: tarte, ph: 'les deux', ok: (g, t) => /les deux/.test(t), regle: '« les deux » prend tout' },
  { date: '2026-11-17', ch: 'prologue', prep: g => { tarte(g); jouer(g, 'je prends'); }, ph: 'la terrine', ok: (g, t) => /terrine de campagne/.test(t), regle: 'la réponse à « laquelle ? »' },
  // testeur IA, 17 novembre : un geste du monde tapé avec « Agir » pendant une conversation, et l'annonce dite en partant
  ...['je dors', 'dormir', 'je me couche', 'je vais dormir'].map(ph => ({ date: '2026-11-17', ch: 'paris', prep: gerantSoir, ph, mode: 'agir',
    ok: (g, t) => !g.state.talk && /dormez|sommeil/.test(t), regle: 'avec « Agir », une action forte du lieu quitte la conversation' })),
  ...['je lis le journal', 'lire les journaux'].map(ph => ({ date: '2026-11-17', ch: 'paris', prep: gerantSoir, ph, mode: 'agir',
    ok: (g, t) => !g.state.talk && /Petit Parisien|journaux/.test(t), regle: 'avec « Agir », une action forte du lieu quitte la conversation' })),
  ...['je vais me coucher', 'Bon, je monte me coucher', 'je vais dormir'].map(ph => ({ date: '2026-11-17', ch: 'paris', prep: gerantSoir, ph, mode: 'dire',
    ok: (g, t) => !g.state.talk && /dormez|sommeil/.test(t), regle: 'dit à quelqu’un, « je vais me coucher » prend congé, puis on le fait' })),
  { date: '2026-11-17', ch: 'paris', prep: gerantSoir, ph: 'je dors mal dans votre hôtel', mode: 'dire', ok: (g, t) => g.state.talk === 'gerant', regle: 'en « Dire », une plainte reste une parole' },
  // testeur IA, 17 novembre, deuxième lot : les déplacements, les attentes, les adresses
  { date: '2026-11-17', ch: 'londres', prep: g => { banquet(g); jouer(g, 'je cherche l’homme brun à la moustache dans la foule'); }, ph: 'je me rends au Chelsea Arms, à la chambre 14',
    ok: (g, t) => g.state.loc === 'institut' && /Pas d’ici|Pas tout de suite/.test(t) && /rentrer à l’hôtel/.test(t), regle: 'un lieu connu mais inaccessible d’ici : on le dit, avec la sortie' },
  ...['je vais au Chelsea Arms et je demande la chambre 14 à la réception en présentant la plaque de clé', 'je me rends au Chelsea Arms, décidé à découvrir qui occupe la chambre 14 et pourquoi'].map(ph => ({ date: '2026-11-17', ch: 'londres', prep: g => { banquet(g); jouer(g, 'je cherche l’homme brun à la moustache dans la foule'); jouer(g, 'je rentre à l’hôtel'); }, ph,
    ok: (g, t) => g.state.loc === 'chelsea', regle: 'un lieu nommé avec un verbe de mouvement : on y va, le reste dit pourquoi' })),
  { date: '2026-11-17', ch: 'londres', prep: g => { banquet(g); jouer(g, 'je cherche l’homme brun à la moustache dans la foule'); jouer(g, 'je rentre à l’hôtel'); }, ph: 'je vais au Chelsea Arms et je demande la chambre 14 à la réception',
    ok: (g, t) => g.state.loc === 'chelsea' && g.state.talk === 'chelseaclerk', regle: 'aller quelque part et y faire quelque chose : deux gestes ; « demander X à la réception » s’adresse à la réception' },
  ...['je dors jusqu’à huit heures', 'j’attends le matin', 'Je m’allonge sur le lit et dors jusqu’à huit heures', 'je dors jusqu’à l’ouverture des archives du Daily Courier à huit heures'].map(ph => ({ date: '2026-11-17', ch: 'londres', prep: hotelLondres, ph,
    ok: (g, t) => /dormez/.test(t) && Math.floor((g.state.min % 1440) / 60) === 8 && !/homme sur le lit|plusieurs choses/.test(t), regle: '« jusqu’à huit heures » est un moment : on dort jusqu’au matin' })),
  { date: '2026-11-17', ch: 'londres', prep: g => { hotelLondres(g); g.state.min = 1440 + 600; jouer(g, 'Descendre parler au concierge'); }, ph: 'Je prends congé du concierge et me rends au British Museum', mode: 'dire',
    ok: (g, t) => g.state.loc === 'musee', regle: 'prendre congé en annonçant où l’on va : on y va' },
  { date: '2026-11-17', ch: 'londres', prep: g => { g.api.go('islington'); g.state.min = 4 * 1440 + 21 * 60 + 41; }, ph: 'Que pouvez-vous me dire sur Brophy Lane ?', mode: 'dire',
    ok: (g, t) => !/dans le vide/.test(t) && /rideau/.test(t), regle: 'quelqu’un d’ici qu’on ne peut pas aborder maintenant : on dit pourquoi' },
  { date: '2026-11-17', ch: 'paris', prep: g => { g.choose({ label: 't', action: 'ga_taxi' }); g.api.go('charenton'); g.state.min = 5 * 1440 + 600; g.choose({ label: 'r', action: 'ch_rogniat' }); g.choose({ label: 'l', topic: 'leroux' }); },
    ph: 'Docteur Leroux, connaissiez-vous les recherches du docteur Delplace ?', mode: 'dire', ok: (g, t) => g.state.talk === 'leroux', regle: 'un titre suivi d’un nom : c’est le nom qui désigne (et le personnage même, avant ceux qui le citent)' },
  { date: '2026-11-17', ch: 'paris', prep: g => { g.choose({ label: 't', action: 'ga_taxi' }); g.api.go('bn'); g.state.min = 5 * 1440 + 600; }, ph: '1. Aller : votre hôtel, rue de Richelieu',
    ok: (g, t) => g.state.loc === 'hotel', regle: 'le libellé d’un bouton recopié avec son numéro' },
];
if (QUOI === 'tout' || QUOI === 'corpus') {
  let n = 0;
  for (const c of CORPUS) for (const ph of variantes(c.ph)) {
    const g = partie(c.ch, c.prep); let t; try { t = jouer(g, ph, c.mode); } catch (e) { t = 'PLANTAGE ' + e.message; }
    n++; if (!c.ok(g, t)) { ko++; rapport.push('CORPUS ' + c.date + ' « ' + ph + ' » — règle : ' + c.regle + '\n     → ' + t.slice(0, 160)); }
  }
  console.log('corpus : ' + CORPUS.length + ' cas, ' + n + ' phrases avec leurs variantes');
}

// ---------------------------------------------------------------- B. les sondes : la même famille, dans tous les lieux
if (QUOI === 'tout' || QUOI === 'sondes') {
  let n = 0; const pb = { recit: 0, dehors: 0, but: 0 };
  for (const [ch, sc] of Object.entries(CHAPITRES)) for (const loc of Object.keys(sc.locations)) {
    const neuf = () => partie(ch, g => { Object.keys(sc.locations).forEach(k => { g.api.flag('known:' + k, true); g.api.flag('connu:' + k, true); }); g.state.min = Math.floor(g.state.min / 1440) * 1440 + 11 * 60; try { if (g.state.loc !== loc) g.api.go(loc); } catch (e) {} });
    const g0 = neuf(), acts = g0.actionsIci();
    const pnjs = [...new Set(acts.filter(a => a.talkTo).map(a => a.talkTo))];
    const choses = [...new Set([].concat(...acts.map(a => (a.nouns || []).filter(id => { const c = g0.concept(id); return c && c.type === 'n' && !c.npc && c.label; }))))].slice(0, 6);
    // une question indirecte à quelqu'un d'ici n'est jamais prise pour un récit du passé
    for (const p of pnjs.slice(0, 3)) for (const c of choses.slice(0, 2)) {
      const fiche = sc.npcs[p]; if (!fiche) continue; const nom = fiche.short || fiche.name;
      for (const ph of ['je demande à ' + nom + ' s’il a vu ' + g0.libelle(c), 'demander à ' + nom + ' si quelqu’un a touché à ' + g0.libelle(c)]) {
        const g = neuf(); let t; try { t = jouer(g, ph); } catch (e) { t = 'PLANTAGE'; } n++;
        if (RECIT.test(t) || t === 'PLANTAGE') { pb.recit++; ko++; rapport.push('SONDE récit ' + ch + '/' + loc + ' : « ' + ph + ' »'); }
      }
    }
    // « dehors » après un verbe de mouvement : on sort, ce n'est pas la fenêtre
    for (const ph of ['je vais dehors', 'je sors dehors', 'sortir à l’extérieur']) { n++; if (g0.parse(ph).nouns.some(x => x.id === 'FENETRE')) { pb.dehors++; ko++; rapport.push('SONDE dehors ' + ch + '/' + loc + ' : « ' + ph + ' »'); } }
    // « sortir pour chercher X » : le but (chercher X) n'est jamais perdu
    for (const c of choses) for (const ph of ['sortir pour chercher ' + g0.libelle(c), 'je sors pour trouver ' + g0.libelle(c)]) {
      const p = g0.parse(ph); n++;
      if (!p.verbs.some(v => v.id === 'FOUILLER') || !p.nouns.length) { pb.but++; ko++; rapport.push('SONDE but ' + ch + '/' + loc + ' : « ' + ph + ' » → ' + JSON.stringify(p.verbs.map(v => v.id)) + ' ' + JSON.stringify(p.nouns.map(x => x.id))); }
    }
  }
  console.log('sondes : ' + n + ' phrases | récit à tort ' + pb.recit + ' | dehors pris pour la fenêtre ' + pb.dehors + ' | but perdu ' + pb.but);
  // pendant une conversation, l'action d'un bouton du lieu, tapée à l'infinitif (avec « Agir » ou avec Entrée, donc « Dire ») :
  // on quitte la conversation pour la faire, l'interlocuteur ne s'en offusque pas
  let m = 0, geste = 0; global.RPG_REPLIS = [];
  for (const [ch, sc] of Object.entries(CHAPITRES)) for (const loc of Object.keys(sc.locations)) {
    const neuf = () => partie(ch, g => { g.state.min = Math.floor(g.state.min / 1440) * 1440 + 18 * 60; try { if (g.state.loc !== loc) g.api.go(loc); } catch (e) {} });
    const g0 = neuf(); if (g0.state.loc !== loc) continue;
    const parler = g0.ideas(12, 'normal').filter(i => i.action && (g0.actionsIci().find(a => a.id === i.action) || {}).talkTo);
    const gestes = g0.ideas(12, 'normal').filter(i => i.action && !(g0.actionsIci().find(a => a.id === i.action) || {}).talkTo && /^[A-ZÉ][a-zéèêàâîôûç]+(er|ir|re)\b/.test(i.label));
    for (const p of parler.slice(0, 2)) for (const a of gestes.slice(0, 4)) for (const mode of ['agir', 'dire']) {
      const g = neuf(); g.choose(p); let k = 0; while (g.state.pending && k++ < 5) g.roll(); const qui = g.state.talk; if (!qui || !g.actionsIci().some(x => x.id === a.action)) continue;
      const r0 = RPG_REPLIS.length, d0 = g.state.done[a.action] || 0; let t; try { t = jouer(g, a.label, mode); } catch (e) { t = 'PLANTAGE'; } m++;
      const vexe = RPG_REPLIS.slice(r0).some(r => /^pnj/.test(r.k)), fait = (g.state.done[a.action] || 0) > d0;
      if (t === 'PLANTAGE' || vexe || !fait) { geste++; ko++; rapport.push('SONDE geste ' + ch + '/' + loc + ' avec ' + qui + ' (' + mode + ') : « ' + a.label + ' » → ' + t.slice(0, 120)); }
    }
  }
  console.log('sondes : ' + m + ' gestes tapés en conversation | restés dans la conversation ' + geste);
}

// ---------------------------------------------------------------- C. le lexique : chaque nom se relit, aucun mot volé sans le savoir
if (QUOI === 'tout' || QUOI === 'libelles') {
  // libellés qui, volontairement, ne désignent pas leur propre concept
  const VOULU = { 'prologue COMPARTIMENT': 1, 'prologue ETAT': 1, 'londres ETAT': 1, 'paris ETAT': 1, 'paris CAVE': 1 };
  let n = 0, conflits = 0;
  for (const [ch, sc] of Object.entries(CHAPITRES)) {
    const vols = []; window.LEXICON_WARN = (w, a, b) => vols.push(w + ' : ' + a + ' garde le mot (' + b + ' le voulait)');
    const g = partie(ch); window.LEXICON_WARN = null; conflits += vols.length;
    const ids = new Set(); for (const l of Object.values(sc.locations)) { for (const a of (l.actions || [])) [].concat(a.nouns || [], a.extra || []).forEach(id => ids.add(id)); for (const t of (l.things || [])) (t.ids || []).forEach(id => ids.add(id)); }
    for (const id of ids) {
      const c = g.concept(id); if (!c || c.type !== 'n' || !c.label) continue; n++;
      if (VOULU[ch + ' ' + id]) continue;
      const p = g.parse(c.label);
      if (!p.nouns.some(x => x.id === id)) { ko++; rapport.push('LIBELLÉ ' + ch + ' ' + id + ' « ' + c.label + ' » se lit ' + (p.nouns.map(x => x.id).join(', ') || 'rien')); }
    }
  }
  console.log('libellés : ' + n + ' noms relus | mots disputés entre concepts : ' + conflits + ' (voir LEXICON_WARN)');
}
// ---------------------------------------------------------------- D. chaque bouton se tape : son libellé, tapé tel quel, désigne son action
if (QUOI === 'tout' || QUOI === 'boutons') {
  let n = 0, mal = 0;
  for (const [ch, sc] of Object.entries(CHAPITRES)) for (const loc of Object.keys(sc.locations)) for (const h of [11, 18]) {
    const g = partie(ch, g => { g.state.min = Math.floor(g.state.min / 1440) * 1440 + h * 60; try { if (g.state.loc !== loc) g.api.go(loc); } catch (e) {} });
    if (g.state.loc !== loc) continue;
    for (const i of g.ideas(20, 'normal')) {
      if (!i.action) continue;
      for (const ph of variantes(i.label)) { n++; const r = g.rank(ph); if (!r.length || r[0].a.id !== i.action) { mal++; ko++; rapport.push('BOUTON ' + ch + '/' + loc + ' « ' + ph + ' » (' + i.action + ') → ' + (r[0] ? r[0].a.id : 'rien')); } }
    }
  }
  console.log('boutons : ' + n + ' libellés tapés, avec leurs variantes | mal relus ' + mal);
}
rapport.slice(0, 30).forEach(r => console.log(r));
console.log('incompréhensions : problèmes ' + ko);
process.exitCode = ko ? 1 : 0;
