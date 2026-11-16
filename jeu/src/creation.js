/* =====================================================================
   La création d'investigateur : le Gardien pose ses questions, une tuile à la fois.
   Les règles suivent celles de L'Appel de Cthulhu (7e édition) : caractéristiques aux dés,
   âge, chance, points de compétences de profession et d'intérêt personnel. Les textes sont
   écrits pour ce jeu. La photographie est choisie d'après le genre, la profession et
   l'Apparence (APP 50 et plus : la version charismatique).
   ===================================================================== */
(function () {
  'use strict';
  var PKEY = 'express-minuit-persos';
  function d(n) { return 1 + Math.floor(Math.random() * n); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------------------------------------------------------------- les règles
  var CARAC = [
    { k: 'FOR', nom: 'Force', f: '3D6 × 5', n: 3, plus: 0, dit: 'les muscles, ce que vous soulevez, ce que vous encaissez' },
    { k: 'CON', nom: 'Constitution', f: '3D6 × 5', n: 3, plus: 0, dit: 'la santé, l’endurance, la résistance aux poisons' },
    { k: 'TAI', nom: 'Taille', f: '(2D6 + 6) × 5', n: 2, plus: 6, dit: 'la stature et le poids' },
    { k: 'DEX', nom: 'Dextérité', f: '3D6 × 5', n: 3, plus: 0, dit: 'l’agilité, la vivacité des mains' },
    { k: 'APP', nom: 'Apparence', f: '3D6 × 5', n: 3, plus: 0, dit: 'la présence, le charme ; elle se verra sur votre photographie' },
    { k: 'INT', nom: 'Intelligence', f: '(2D6 + 6) × 5', n: 2, plus: 6, dit: 'la vivacité d’esprit ; elle décide de vos idées' },
    { k: 'POU', nom: 'Pouvoir', f: '3D6 × 5', n: 3, plus: 0, dit: 'la volonté ; c’est aussi votre santé mentale de départ' },
    { k: 'EDU', nom: 'Éducation', f: '(2D6 + 6) × 5', n: 2, plus: 6, dit: 'ce que l’école, les livres et la vie vous ont appris' }
  ];
  function lancer(c) { var r = []; for (var i = 0; i < c.n; i++) r.push(d(6)); var t = r.reduce(function (a, b) { return a + b; }, 0) + c.plus; return { des: r, v: t * 5 }; }

  // les compétences et leur base (Esquive : DEX / 2 ; la langue maternelle : ÉDU)
  var BASE = {
    'Anthropologie': 1, 'Archéologie': 1, 'Armes de poing': 20, 'Armes d’épaule': 25, 'Art (littérature)': 5, 'Baratin': 5, 'Bibliothèque': 20,
    'Charme': 15, 'Comptabilité': 5, 'Conduite': 20, 'Corps à corps': 25, 'Crédit': 0, 'Crochetage': 1, 'Déguisement': 5, 'Discrétion': 20,
    'Droit': 5, 'Écouter': 20, 'Électricité': 10, 'Équitation': 5, 'Esquive': 0, 'Évaluation': 5, 'Grimper': 20, 'Histoire': 5, 'Intimidation': 15,
    'Lancer': 20, 'Langue (allemand)': 1, 'Langue (anglais)': 0, 'Langue (français)': 1, 'Langue (latin)': 1, 'Langue (turc)': 1, 'Mécanique': 10,
    'Médecine': 1, 'Monde naturel': 10, 'Nager': 20, 'Occultisme': 5, 'Orientation': 10, 'Persuasion': 10, 'Photographie': 5, 'Premiers soins': 30,
    'Psychanalyse': 1, 'Psychologie': 10, 'Sauter': 20, 'Sciences (biologie)': 1, 'Sciences (chimie)': 1, 'Sciences (pharmacie)': 1, 'Trouver Objet Caché': 25
  };
  function base(nom, p) { if (nom === 'Esquive') return Math.floor(p.carac.DEX / 2); if (nom === 'Langue (anglais)') return p.carac.EDU; return BASE[nom] || 0; }
  var SOC = ['Charme', 'Baratin', 'Intimidation', 'Persuasion'];
  var LANG = ['Langue (français)', 'Langue (latin)', 'Langue (allemand)', 'Langue (turc)'];

  // les professions, d'après la liste du livre de règles ; les listes de compétences y sont fidèles, les textes sont d'ici
  var METIERS = [
    { id: 'antiquaire', nom: 'Antiquaire', points: 'EDU4', credit: [30, 70], academic: true,
      dit: 'Vous achetez et revendez les vieilles choses. Vous savez ce qu’elles valent, d’où elles viennent, et ce qu’on raconte sur elles.',
      comp: ['Évaluation', 'Histoire', 'Bibliothèque', 'Trouver Objet Caché', 'Comptabilité', { t: 'Une langue étrangère', c: LANG }, { t: 'Pour traiter avec la clientèle', c: SOC }, { t: 'Votre marotte', c: ['Occultisme', 'Art (littérature)', 'Crochetage'] }],
      inv: ['Une loupe d’horloger', 'Un catalogue de vente annoté', 'Une canne à pommeau d’argent'] },
    { id: 'archeologue', nom: 'Archéologue', points: 'EDU4', credit: [10, 40], academic: true,
      dit: 'Vous avez creusé en Égypte, en Mésopotamie ou dans le Wiltshire. Vous lisez la terre comme d’autres lisent un journal.',
      comp: ['Archéologie', 'Évaluation', 'Histoire', 'Bibliothèque', 'Trouver Objet Caché', 'Mécanique', { t: 'Une langue étrangère', c: LANG }, { t: 'Sur le terrain', c: ['Orientation', 'Grimper', 'Sciences (chimie)'] }],
      inv: ['Une truelle et un pinceau', 'Un carnet de croquis', 'Une lampe tempête'] },
    { id: 'avocat', nom: 'Avocat', nomF: 'Avocate', points: 'EDU4', credit: [30, 80],
      dit: 'Vous plaidez au Temple ou à Lincoln’s Inn. Vous savez faire parler un témoin, et vous taire quand il le faut.',
      comp: ['Droit', 'Comptabilité', 'Bibliothèque', 'Psychologie', { t: 'Votre manière à l’audience', c: SOC }, { t: 'Votre manière avec les clients', c: SOC }, { t: 'Ce que vous savez d’autre', c: ['Histoire', 'Langue (français)', 'Langue (latin)'] }, { t: 'Votre œil', c: ['Trouver Objet Caché', 'Écouter', 'Occultisme'] }],
      inv: ['Un porte-documents de cuir', 'Un stylo à plume', 'Un code pénal annoté'] },
    { id: 'detective', nom: 'Détective privé', nomF: 'Détective privée', points: 'EDU2DEXFOR2', credit: [9, 30],
      dit: 'Des maris infidèles, des bijoux volés, des disparus que personne ne cherche plus. On vous paie pour trouver ce qu’on vous cache.',
      comp: ['Photographie', 'Déguisement', 'Droit', 'Bibliothèque', 'Psychologie', 'Trouver Objet Caché', { t: 'Pour délier les langues', c: SOC }, { t: 'Votre spécialité', c: ['Crochetage', 'Discrétion', 'Armes de poing'] }],
      inv: ['Un carnet à élastique', 'Une lampe de poche', 'Une loupe'] },
    { id: 'dilettante', nom: 'Dilettante', points: 'EDU2APP2', credit: [50, 99],
      dit: 'Une fortune de famille, beaucoup de loisirs, et une curiosité que l’argent ne rassasie pas. Vous avez tout essayé, sauf l’ennui.',
      comp: ['Armes d’épaule', 'Équitation', { t: 'Votre art', c: ['Photographie', 'Art (littérature)'] }, { t: 'Une langue étrangère', c: LANG }, { t: 'Dans le monde', c: SOC }, { t: 'Votre passe-temps', c: ['Histoire', 'Occultisme', 'Conduite'] }, { t: 'Un autre passe-temps', c: ['Nager', 'Psychologie', 'Évaluation'] }, { t: 'Et un troisième', c: ['Écouter', 'Lancer', 'Sauter'] }],
      inv: ['Un étui à cigarettes en argent', 'Un carnet de chèques', 'Une flasque gravée'] },
    { id: 'ecrivain', nom: 'Écrivain', nomF: 'Écrivaine', points: 'EDU4', credit: [9, 30],
      dit: 'Des romans à quatre sous ou des essais que personne ne lit : vous écrivez, et pour écrire, vous regardez les gens de très près.',
      comp: ['Art (littérature)', 'Histoire', 'Bibliothèque', 'Psychologie', 'Écouter', { t: 'Une langue étrangère', c: LANG }, { t: 'Votre sujet de prédilection', c: ['Occultisme', 'Monde naturel'] }, { t: 'Ce que la vie vous a appris', c: ['Baratin', 'Trouver Objet Caché', 'Discrétion'] }],
      inv: ['Un stylo à plume', 'Un manuscrit inachevé', 'Un paquet de cigarettes turques'] },
    { id: 'journaliste', nom: 'Journaliste', points: 'EDU4', credit: [9, 30],
      dit: 'Vous écrivez pour un quotidien de Fleet Street. Vous allez là où l’on ne vous attend pas, et vous repartez avec ce qu’on voulait taire.',
      comp: ['Photographie', 'Histoire', 'Bibliothèque', 'Psychologie', 'Trouver Objet Caché', { t: 'Pour obtenir un entretien', c: SOC }, { t: 'Votre manière de travailler', c: ['Discrétion', 'Écouter', 'Baratin'] }, { t: 'Votre rubrique', c: ['Droit', 'Occultisme', 'Langue (français)'] }],
      inv: ['Un carnet de sténo', 'Un appareil photo pliant', 'Une carte de presse'] },
    { id: 'medecin', nom: 'Médecin', points: 'EDU4', credit: [30, 80], academic: true, titre: 'Dr',
      dit: 'Vous soignez les corps, ce qui vous a appris beaucoup sur les âmes. Vous avez peut-être opéré au front ; vous n’en parlez pas.',
      comp: ['Médecine', 'Premiers soins', 'Langue (latin)', 'Psychologie', 'Sciences (biologie)', 'Sciences (pharmacie)', { t: 'Votre spécialité', c: ['Psychanalyse', 'Trouver Objet Caché', 'Écouter'] }, { t: 'Avec vos patients', c: SOC }],
      inv: ['Une trousse de médecin', 'Une montre de gousset', 'Un carnet relié de cuir'] },
    { id: 'parapsychologue', nom: 'Parapsychologue', points: 'EDU4', credit: [9, 30],
      dit: 'Vous étudiez les maisons hantées, les médiums et les tables tournantes, avec un appareil photo et un galvanomètre. Vous voulez savoir. Vraiment.',
      comp: ['Occultisme', 'Photographie', 'Histoire', 'Bibliothèque', 'Anthropologie', 'Psychologie', { t: 'Une langue étrangère', c: LANG }, { t: 'Vos instruments', c: ['Électricité', 'Écouter', 'Trouver Objet Caché'] }],
      inv: ['Un appareil photo à plaques', 'Une boussole', 'Un carnet d’observations'] },
    { id: 'professeur', nom: 'Professeur', points: 'EDU4', credit: [20, 70], academic: true,
      dit: 'Vous enseignez à Oxford, à Cambridge ou à l’University College. Vous savez où chercher, et vous avez la patience de lire.',
      comp: ['Bibliothèque', 'Psychologie', 'Persuasion', { t: 'Une langue étrangère', c: LANG }, { t: 'Votre chaire', c: ['Histoire', 'Archéologie', 'Anthropologie', 'Sciences (chimie)'] }, { t: 'Votre seconde discipline', c: ['Occultisme', 'Droit', 'Sciences (biologie)', 'Histoire'] }, { t: 'Ce que vous lisez le soir', c: ['Art (littérature)', 'Occultisme', 'Monde naturel'] }, { t: 'Une autre langue', c: LANG }],
      inv: ['Un cartable de cuir', 'Une pipe de bruyère', 'Un exemplaire annoté de Frazer'] }
  ];
  var LIENS = [
    { id: 'eleve', label: 'Vous avez été son élève', bio: 'Ancien élève de Smith, vous ne l’avez jamais tout à fait quitté : il vous écrit encore, et vous lui répondez toujours.' },
    { id: 'dette', label: 'Il vous a tiré d’un mauvais pas', bio: 'Smith vous a sorti d’un très mauvais pas, il y a des années. Vous ne l’avez jamais oublié, et lui non plus.' },
    { id: 'voyage', label: 'Un compagnon de voyage', bio: 'Vous avez rencontré Smith dans un train de nuit entre Vienne et Trieste. Vous ne vous êtes plus quittés.' },
    { id: 'medium', label: 'Un médium démasqué ensemble', bio: 'Un soir, vous avez aidé Smith à confondre un médium en pleine séance. Depuis, il vous appelle quand quelque chose cloche.' }
  ];
  var ORIGINES = ['Londres', 'Oxford', 'Édimbourg', 'Dublin', 'Manchester', 'Bristol'];
  var PRENOMS = { m: ['Arthur', 'Edward', 'Henry', 'Thomas', 'Walter', 'Charles', 'Frederick', 'Hugh', 'Lionel', 'Percy', 'Cecil', 'Rupert'],
    f: ['Edith', 'Violet', 'Florence', 'Agnes', 'Beatrice', 'Dorothy', 'Winifred', 'Harriet', 'Mabel', 'Clara', 'Evelyn', 'Iris'] };
  var NOMS = ['Ashcombe', 'Bellamy', 'Crane', 'Dunmore', 'Fairfax', 'Garrick', 'Hale', 'Lockwood', 'Marsh', 'Pryce', 'Royston', 'Selwyn', 'Thorne', 'Whitlock', 'Yardley', 'Kemble'];
  var AGES = [
    { id: 'jeune', label: '20 à 39 ans', age: [24, 39], phys: 0, app: 0, edu: 1, mvt: 0, dit: 'Un jet d’amélioration d’Éducation.' },
    { id: 'mur', label: '40 à 49 ans', age: [40, 49], phys: 5, app: 5, edu: 2, mvt: 1, dit: 'Deux jets d’amélioration d’Éducation. Vous retirez 5 points entre Force, Constitution et Dextérité, et 5 points d’Apparence.' },
    { id: 'age', label: '50 à 59 ans', age: [50, 59], phys: 10, app: 10, edu: 3, mvt: 2, dit: 'Trois jets d’amélioration d’Éducation. Vous retirez 10 points entre Force, Constitution et Dextérité, et 10 points d’Apparence.' }
  ];
  // l'intérêt personnel : les compétences qui servent dans ce jeu, dans l'ordre où on les propose
  var LOISIRS = ['Trouver Objet Caché', 'Écouter', 'Psychologie', 'Discrétion', 'Esquive', 'Persuasion', 'Charme', 'Baratin', 'Bibliothèque', 'Histoire',
    'Occultisme', 'Premiers soins', 'Grimper', 'Sauter', 'Intimidation', 'Crochetage', 'Langue (français)', 'Langue (turc)', 'Droit', 'Mécanique', 'Lancer', 'Corps à corps', 'Évaluation', 'Médecine', 'Photographie', 'Comptabilité'];
  var MAXI = 80;

  function metier(id) { return METIERS.filter(function (m) { return m.id === id; })[0]; }
  function nomMetier(m, sexe) { return sexe === 'f' && m.nomF ? m.nomF : m.nom; }
  function pointsMetier(p) {
    var m = metier(p.metier), c = p.carac;
    if (m.points === 'EDU2APP2') return c.EDU * 2 + c.APP * 2;
    if (m.points === 'EDU2DEXFOR2') return c.EDU * 2 + Math.max(c.DEX, c.FOR) * 2;
    return c.EDU * 4;
  }
  function formule(m) { return m.points === 'EDU2APP2' ? 'ÉDU × 2 + APP × 2' : m.points === 'EDU2DEXFOR2' ? 'ÉDU × 2 + DEX ou FOR × 2' : 'ÉDU × 4'; }
  // la liste des compétences de profession, les choix faits
  // les choix « au choix » qui manquent : la première option libre, groupe après groupe
  function defauts(p) {
    var m = metier(p.metier), fixes = m.comp.filter(function (c) { return typeof c === 'string'; }), pris = [];
    m.comp.forEach(function (c, i) { if (typeof c !== 'string' && p.choix[i]) pris.push(p.choix[i]); });
    m.comp.forEach(function (c, i) {
      if (typeof c === 'string' || p.choix[i]) return;
      var o = c.c.filter(function (x) { return fixes.indexOf(x) < 0 && pris.indexOf(x) < 0; })[0] || c.c[0];
      p.choix[i] = o; pris.push(o);
    });
  }
  function compsMetier(p) {
    var m = metier(p.metier), out = [];
    defauts(p);
    m.comp.forEach(function (c, i) { var n = typeof c === 'string' ? c : p.choix[i]; if (out.indexOf(n) < 0) out.push(n); });
    return out;
  }
  function photo(p) { return 'img/creation/' + p.metier + '_' + (p.sexe === 'f' ? 'f' : 'h') + '_' + (p.carac.APP >= 50 ? 'charme' : 'terne') + '.webp'; }

  // la fiche que le jeu attend, à partir des réponses
  function fiche(p) {
    var m = metier(p.metier), c = p.carac, A = AGES.filter(function (a) { return a.id === p.age; })[0] || AGES[0];
    var skills = {};
    // sur la fiche : ce qu'on a appris, et les compétences dont ce jeu se sert
    Object.keys(BASE).forEach(function (k) { var mis = (p.ptsM[k] || 0) + (p.ptsL[k] || 0), v = base(k, p) + mis; if (mis || k === 'Crédit' || k === 'Langue (anglais)' || LOISIRS.indexOf(k) >= 0) skills[k] = Math.min(99, v); });
    skills['Mythe de Cthulhu'] = 0;
    var mvt = (c.DEX < c.TAI && c.FOR < c.TAI) ? 7 : (c.DEX > c.TAI && c.FOR > c.TAI) ? 9 : 8;
    var pv = Math.floor((c.CON + c.TAI) / 10), pm = Math.floor(c.POU / 5);
    var titre = m.titre || (p.sexe === 'f' ? (p.madame ? 'Mrs' : 'Miss') : 'Mr');
    var lien = LIENS.filter(function (l) { return l.id === p.lien; })[0] || LIENS[0];
    var nm = nomMetier(m, p.sexe);
    var occ = nm + (p.origine ? (/^[AEIOUÉÈÊ]/.test(p.origine) ? ' d’' : ' de ') + p.origine : '');
    return {
      key: p.key, cree: true, name: p.prenom + ' ' + p.nom, first: p.prenom, last: p.nom, title: titre, sex: p.sexe === 'f' ? 'f' : 'm', age: p.ageExact,
      origin: p.origine, academic: !!m.academic, profession: m.id, occupation: occ,
      bio: m.dit + ' ' + lien.bio,
      carac: { FOR: c.FOR, CON: c.CON, TAI: c.TAI, DEX: c.DEX, APP: c.APP, INT: c.INT, POU: c.POU, EDU: c.EDU },
      pv: pv, pvMax: pv, pm: pm, pmMax: pm, san: c.POU, sanMax: 99, chance: p.chance, mvt: mvt - A.mvt,
      skills: skills, inv: m.inv.slice(), money: Math.max(5, Math.round((skills['Crédit'] || 0) * 0.9)), portrait: photo(p)
    };
  }

  // ---------------------------------------------------------------- le carnet des investigateurs créés
  function persos() { try { var o = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; return Object.keys(o).map(function (k) { return o[k]; }).sort(function (a, b) { return (b.creeLe || 0) - (a.creeLe || 0); }); } catch (e) { return []; } }
  function perso(key) { return persos().filter(function (p) { return p.key === key; })[0] || null; }
  function garder(pc) {
    try {
      var o = JSON.parse(localStorage.getItem(PKEY) || '{}') || {};
      o[pc.key] = pc;
      var ks = Object.keys(o).sort(function (a, b) { return (o[b].creeLe || 0) - (o[a].creeLe || 0); });
      ks.slice(8).forEach(function (k) { delete o[k]; });
      localStorage.setItem(PKEY, JSON.stringify(o));
    } catch (e) {}
  }
  function oublier(key) { try { var o = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; delete o[key]; localStorage.setItem(PKEY, JSON.stringify(o)); } catch (e) {} }

  // ---------------------------------------------------------------- les tuiles
  var hooks = {}, box, track, pasEl, p, pile = [], relance = false, anim = false;
  function neuf() {
    return { sexe: null, madame: false, prenom: '', nom: '', origine: null, metier: null, lien: null, choix: {}, carac: null, carac0: null, age: null, ageExact: 30,
      usure: { FOR: 0, CON: 0, DEX: 0 }, eduJets: [], eduGain: 0, chance: null, ptsM: {}, ptsL: {}, key: null };
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function bouton(txt, cls, fn) { var b = el('button', cls || 'ghost', txt); b.type = 'button'; b.addEventListener('click', function () { if (!anim) fn(b); }); return b; }

  var ETAPES = ['accueil', 'genre', 'nom', 'origine', 'metier', 'lien', 'carac', 'age', 'usure', 'edu', 'chance', 'specialite', 'pointsMetier', 'loisirs', 'portrait'];
  function sauteEtape(e) {
    if (e === 'usure') { var A = AGES.filter(function (a) { return a.id === p.age; })[0]; return !A || !A.phys; }
    if (e === 'specialite') { var m = metier(p.metier); return !m || !m.comp.some(function (c) { return typeof c !== 'string'; }); }
    return false;
  }
  function visibles() { return ETAPES.filter(function (e) { return !sauteEtape(e); }); }

  function tuile(nom) {
    var t = el('section', 'cr-tuile'), F = TUILES[nom];
    var rendu = F();
    t.appendChild(el('div', 'cr-mj', 'Le Gardien'));
    t.appendChild(el('h3', 'cr-q', rendu.q));
    if (rendu.dit) t.appendChild(el('p', 'cr-dit', rendu.dit));
    var corps = el('div', 'cr-corps'); if (rendu.corps) rendu.corps(corps); t.appendChild(corps);
    if (rendu.bas) { var bas = el('div', 'cr-bas'); rendu.bas(bas); t.appendChild(bas); }
    t.setAttribute('data-etape', nom);
    return t;
  }
  function afficher(nom, sens) {
    var ancienne = track.querySelector('.cr-tuile.ici'), t = tuile(nom);
    var v = visibles(), i = v.indexOf(nom);
    pasEl.innerHTML = i > 0 ? 'Question ' + i + '<i style="width:' + Math.round(100 * ETAPES.indexOf(nom) / (ETAPES.length - 1)) + '%"></i>' : '';
    var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!ancienne || reduit) { if (ancienne) ancienne.remove(); t.classList.add('ici'); track.appendChild(t); focus(t); return; }
    anim = true;
    t.classList.add(sens < 0 ? 'avant' : 'apres'); track.appendChild(t);
    void t.offsetWidth;
    t.classList.remove('avant', 'apres'); t.classList.add('ici');
    ancienne.classList.remove('ici'); ancienne.classList.add(sens < 0 ? 'apres' : 'avant');
    setTimeout(function () { ancienne.remove(); anim = false; focus(t); }, 460);
  }
  function focus(t) { var f = t.querySelector('input, .cr-choix button, .cr-bas .act'); if (f && !(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) f.focus(); track.scrollTop = 0; t.scrollTop = 0; }
  function suivant() {
    var v = visibles(), i = v.indexOf(pile[pile.length - 1]);
    var n = v[i + 1]; if (!n) return;
    pile.push(n); afficher(n, 1);
  }
  function precedent() {
    if (anim) return;
    if (pile.length <= 1) { fermer(); if (hooks.retour) hooks.retour(); return; }
    pile.pop(); afficher(pile[pile.length - 1], -1);
  }
  function rafraichir() { var t = track.querySelector('.cr-tuile.ici'); if (!t) return; var n = tuile(t.getAttribute('data-etape')); n.classList.add('ici'); var y = t.scrollTop; t.replaceWith(n); n.scrollTop = y; }

  // une grille de choix ; un toucher choisit et passe à la suite
  function choix(corps, liste, actuel, fn, cls) {
    var g = el('div', 'cr-choix' + (cls ? ' ' + cls : ''));
    liste.forEach(function (o) {
      var b = bouton('<span class="l">' + esc(o.label) + '</span>' + (o.sous ? '<span class="s">' + esc(o.sous) + '</span>' : ''), 'cr-opt', function () { fn(o.id); });
      if (actuel === o.id) b.classList.add('pris');
      g.appendChild(b);
    });
    corps.appendChild(g);
  }
  // une rangée de compétences à répartir
  function repartition(corps, noms, pts, total, opts) {
    var reste = total - noms.reduce(function (a, n) { return a + (pts[n] || 0); }, 0);
    var tete = el('div', 'cr-reste', '<span>Points à répartir</span><b>' + reste + '</b><small>sur ' + total + '</small>');
    corps.appendChild(tete);
    var l = el('div', 'cr-comps');
    noms.forEach(function (n) {
      var b0 = base(n, p) + (opts.autres ? (opts.autres[n] || 0) : 0), v = b0 + (pts[n] || 0);
      var mini = opts.min && opts.min[n] !== undefined ? opts.min[n] : b0, maxi = opts.max && opts.max[n] !== undefined ? opts.max[n] : MAXI;
      var r = el('div', 'cr-comp' + (pts[n] ? ' mis' : ''));
      r.appendChild(el('span', 'n', esc(n) + (opts.notes && opts.notes[n] ? '<small>' + esc(opts.notes[n]) + '</small>' : '')));
      var moins = bouton('−', 'cr-pm', function () { var pas = Math.min(5, v - mini, pts[n] || 0); if (pas <= 0) return; pts[n] = (pts[n] || 0) - pas; if (!pts[n]) delete pts[n]; rafraichir(); });
      var plus = bouton('+', 'cr-pm', function () { var pas = Math.min(5, reste, maxi - v); if (pas <= 0) return; pts[n] = (pts[n] || 0) + pas; rafraichir(); });
      moins.disabled = v <= mini || !(pts[n] > 0); plus.disabled = reste <= 0 || v >= maxi;
      moins.setAttribute('aria-label', 'Retirer des points à ' + n); plus.setAttribute('aria-label', 'Ajouter des points à ' + n);
      r.appendChild(moins); r.appendChild(el('span', 'v', '<b>' + v + '</b>' + (pts[n] ? '<small>' + b0 + ' + ' + pts[n] + '</small>' : '<small>base</small>'))); r.appendChild(plus);
      l.appendChild(r);
    });
    corps.appendChild(l);
    return reste;
  }
  function repartirAuto(noms, pts, total, opts) {
    noms.forEach(function (n) { if (!(opts.min && opts.min[n] !== undefined)) delete pts[n]; });
    var reste = total - noms.reduce(function (a, n) { return a + (pts[n] || 0); }, 0), tour = 0;
    var vise = opts.vise || 70;
    while (reste > 0 && tour++ < 60) {
      var avance = false;
      noms.forEach(function (n) {
        if (reste <= 0) return;
        var b0 = base(n, p) + (opts.autres ? (opts.autres[n] || 0) : 0), v = b0 + (pts[n] || 0), maxi = Math.min(opts.max && opts.max[n] !== undefined ? opts.max[n] : MAXI, tour > 20 ? MAXI : vise);
        if (v >= maxi) return;
        var pas = Math.min(5, reste, maxi - v); pts[n] = (pts[n] || 0) + pas; reste -= pas; avance = true;
      });
      if (!avance && tour > 20) break;
    }
  }

  var TUILES = {
    accueil: function () { return {
      q: 'Asseyez-vous.', dit: 'Avant que le brouillard ne tombe sur Londres, il me faut savoir qui vous êtes. Je vais vous poser quelques questions, et les dés répondront aux autres.',
      bas: function (b) { b.appendChild(bouton('Commencer', 'act', suivant)); } }; },
    genre: function () { return {
      q: 'Un homme, ou une femme ?',
      corps: function (c) { choix(c, [{ id: 'm', label: 'Un homme' }, { id: 'f', label: 'Une femme' }], p.sexe, function (v) { p.sexe = v; if (!p.prenom || PRENOMS[v === 'f' ? 'm' : 'f'].indexOf(p.prenom) >= 0) p.prenom = ''; suivant(); }, 'deux'); } }; },
    nom: function () { return {
      q: 'Votre nom ?', dit: p.sexe === 'f' ? 'Et dites-moi si l’on vous appelle Miss ou Mrs.' : 'Celui qu’on lira sur votre carte de visite.',
      corps: function (c) {
        var f = el('div', 'cr-nom');
        var a = el('input'); a.type = 'text'; a.placeholder = 'Prénom'; a.value = p.prenom; a.maxLength = 24; a.autocomplete = 'off'; a.setAttribute('aria-label', 'Prénom');
        var b = el('input'); b.type = 'text'; b.placeholder = 'Nom'; b.value = p.nom; b.maxLength = 24; b.autocomplete = 'off'; b.setAttribute('aria-label', 'Nom');
        var maj = function () { p.prenom = a.value.trim(); p.nom = b.value.trim(); var ok = track.querySelector('.cr-tuile.ici .cr-bas .act'); if (ok) ok.disabled = !(p.prenom && p.nom); };
        a.addEventListener('input', maj); b.addEventListener('input', maj);
        b.addEventListener('keydown', function (e) { if (e.key === 'Enter' && p.prenom && p.nom) suivant(); });
        f.appendChild(a); f.appendChild(b); c.appendChild(f);
        if (p.sexe === 'f') {
          var g = el('div', 'cr-choix deux petit');
          [['Miss', false], ['Mrs', true]].forEach(function (x) { var o = bouton(x[0], 'cr-opt', function () { p.madame = x[1]; rafraichir(); }); if (p.madame === x[1]) o.classList.add('pris'); g.appendChild(o); });
          c.appendChild(g);
        }
      },
      bas: function (b) {
        b.appendChild(bouton('Un nom au hasard', 'ghost', function () { var l = PRENOMS[p.sexe === 'f' ? 'f' : 'm']; p.prenom = l[d(l.length) - 1]; p.nom = NOMS[d(NOMS.length) - 1]; rafraichir(); }));
        var ok = bouton('Suivant', 'act', function () { if (p.prenom && p.nom) suivant(); }); ok.disabled = !(p.prenom && p.nom); b.appendChild(ok);
      } }; },
    origine: function () { return {
      q: 'D’où venez-vous ?',
      corps: function (c) { choix(c, ORIGINES.map(function (o) { return { id: o, label: o }; }), p.origine, function (v) { p.origine = v; suivant(); }, 'trois'); } }; },
    metier: function () { return {
      q: 'Que faites-vous dans la vie ?', dit: 'Votre métier décide de ce que vous savez faire, et de l’argent que vous avez en poche.',
      corps: function (c) {
        choix(c, METIERS.map(function (m) { return { id: m.id, label: nomMetier(m, p.sexe), sous: m.dit }; }), p.metier, function (v) {
          if (p.metier !== v) { p.choix = {}; p.ptsM = {}; } p.metier = v; suivant();
        }, 'liste');
      } }; },
    lien: function () { return {
      q: 'Comment avez-vous connu le professeur Smith ?', dit: 'Votre vieil ami, celui qui vous invite ce soir à l’Institut impérial.',
      corps: function (c) { choix(c, LIENS.map(function (l) { return { id: l.id, label: l.label, sous: l.bio }; }), p.lien, function (v) { p.lien = v; suivant(); }, 'liste'); } }; },
    carac: function () { return {
      q: p.carac ? 'Voilà ce que disent les dés.' : 'Lançons les dés.', dit: p.carac ? (relance ? 'Vous avez déjà relancé : ces valeurs sont les vôtres.' : 'Vous pouvez les garder, ou tout relancer, une seule fois.') : 'Huit caractéristiques, comme dans les règles : trois dés à six faces pour la plupart, deux plus six pour la taille, l’intelligence et l’éducation. Le tout multiplié par cinq.',
      corps: function (c) {
        var g = el('div', 'cr-caracs');
        CARAC.forEach(function (k) {
          var v = p.carac ? p.carac[k.k] : null, r = p.jets ? p.jets[k.k] : null;
          g.appendChild(el('div', 'cr-car' + (v ? ' fait' : ''), '<span class="k">' + k.k.replace('EDU', 'ÉDU') + '</span><span class="n">' + esc(k.nom) + '<small>' + esc(k.dit) + '</small></span><span class="f">' + esc(k.f) + (r ? '<small>' + r.des.join(' + ') + (k.plus ? ' + 6' : '') + '</small>' : '') + '</span><span class="v" data-k="' + k.k + '">' + (v || '—') + '</span>'));
        });
        c.appendChild(g);
      },
      bas: function (b) {
        if (!p.carac) { b.appendChild(bouton('Lancer les dés', 'act', function () { tirerCarac(); })); return; }
        if (!relance) b.appendChild(bouton('Tout relancer', 'ghost', function () { relance = true; tirerCarac(); }));
        b.appendChild(bouton('Garder ces valeurs', 'act', function () { suivant(); }));
      } }; },
    age: function () { return {
      q: 'Quel âge avez-vous ?', dit: 'L’âge apporte du savoir, et retire de la vigueur. Les règles le disent ainsi.',
      corps: function (c) { choix(c, AGES.map(function (a) { return { id: a.id, label: a.label, sous: a.dit }; }), p.age, function (v) {
        p.age = v; var A = AGES.filter(function (a) { return a.id === v; })[0];
        p.ageExact = A.age[0] + d(A.age[1] - A.age[0] + 1) - 1;
        p.usure = { FOR: 0, CON: 0, DEX: 0 }; p.eduJets = []; p.eduGain = 0; appliquerAge(); suivant();
      }, 'liste'); } }; },
    usure: function () {
      var A = AGES.filter(function (a) { return a.id === p.age; })[0], tot = A.phys, mis = p.usure.FOR + p.usure.CON + p.usure.DEX, reste = tot - mis;
      return {
        q: 'Les années pèsent.', dit: 'Retirez ' + tot + ' points en tout, comme vous voulez, entre Force, Constitution et Dextérité. Votre Apparence perd aussi ' + A.app + ' points.',
        corps: function (c) {
          c.appendChild(el('div', 'cr-reste', '<span>Points à retirer</span><b>' + reste + '</b><small>sur ' + tot + '</small>'));
          var l = el('div', 'cr-comps');
          ['FOR', 'CON', 'DEX'].forEach(function (k) {
            var v0 = p.carac0[k], v = v0 - p.usure[k];
            var r = el('div', 'cr-comp' + (p.usure[k] ? ' mis' : ''));
            r.appendChild(el('span', 'n', esc(CARAC.filter(function (x) { return x.k === k; })[0].nom)));
            var moins = bouton('−', 'cr-pm', function () { if (reste <= 0 || v <= 15) return; p.usure[k]++; appliquerAge(); rafraichir(); });
            var plus = bouton('+', 'cr-pm', function () { if (!p.usure[k]) return; p.usure[k]--; appliquerAge(); rafraichir(); });
            moins.disabled = reste <= 0 || v <= 15; plus.disabled = !p.usure[k];
            r.appendChild(moins); r.appendChild(el('span', 'v', '<b>' + v + '</b><small>' + (p.usure[k] ? v0 + ' − ' + p.usure[k] : 'intacte') + '</small>')); r.appendChild(plus);
            l.appendChild(r);
          });
          c.appendChild(l);
        },
        bas: function (b) {
          b.appendChild(bouton('Répartir pour moi', 'ghost', function () { p.usure = { FOR: 0, CON: 0, DEX: 0 }; var ks = ['FOR', 'CON', 'DEX'], i = 0; for (var n = 0; n < tot; n++) { var k = ks.slice().sort(function (x, y) { return (p.carac0[y] - p.usure[y]) - (p.carac0[x] - p.usure[x]); })[0]; p.usure[k]++; i++; } appliquerAge(); rafraichir(); }));
          var ok = bouton('Suivant', 'act', suivant); ok.disabled = reste > 0; b.appendChild(ok);
        } };
    },
    edu: function () {
      var A = AGES.filter(function (a) { return a.id === p.age; })[0], faits = p.eduJets.length;
      return {
        q: 'Ce que les années vous ont appris.', dit: 'Pour chaque jet, un dé de cent : s’il dépasse votre Éducation, elle gagne un dé de dix. ' + (A.app ? 'Votre Apparence a perdu ' + A.app + ' points.' : ''),
        corps: function (c) {
          c.appendChild(el('div', 'cr-gros', '<span>Éducation</span><b data-k="EDU">' + p.carac.EDU + '</b>'));
          var l = el('div', 'cr-jets');
          p.eduJets.forEach(function (j, i) { l.appendChild(el('div', 'cr-jet', 'Jet ' + (i + 1) + ' : <b>' + j.r + '</b> ' + (j.gain ? '&gt; ' + j.avant + ', l’Éducation gagne <b>' + j.gain + '</b>' : '≤ ' + j.avant + ', rien de plus'))); });
          c.appendChild(l);
        },
        bas: function (b) {
          if (faits < A.edu) b.appendChild(bouton('Jet d’amélioration ' + (faits + 1) + ' sur ' + A.edu, 'act', function () {
            var r = d(100), avant = p.carac.EDU, gain = r > avant ? d(10) : 0;
            p.eduGain += gain; p.eduJets.push({ r: r, avant: avant, gain: gain }); appliquerAge();
            rafraichir(); var t = track.querySelector('.cr-tuile.ici .cr-gros b'); if (t) roule(t, p.carac.EDU);
          }));
          else b.appendChild(bouton('Suivant', 'act', suivant));
        } };
    },
    chance: function () { return {
      q: 'Et la chance ?', dit: 'Trois dés à six faces, fois cinq. On la dépense parfois sans le savoir.',
      corps: function (c) { c.appendChild(el('div', 'cr-gros', '<span>Chance</span><b>' + (p.chance || '—') + '</b>' + (p.chanceDes ? '<small>' + p.chanceDes.join(' + ') + ', fois cinq</small>' : ''))); },
      bas: function (b) {
        if (!p.chance) b.appendChild(bouton('Lancer les dés', 'act', function () { var r = [d(6), d(6), d(6)]; p.chanceDes = r; p.chance = (r[0] + r[1] + r[2]) * 5; rafraichir(); var t = track.querySelector('.cr-tuile.ici .cr-gros b'); if (t) roule(t, p.chance); }));
        else b.appendChild(bouton('Suivant', 'act', suivant));
      } }; },
    specialite: function () { var m = metier(p.metier); return {
      q: 'Précisez votre métier.', dit: nomMetier(m, p.sexe) + ' : quelques compétences sont à votre choix. Celles en rouge sont prises.',
      corps: function (c) {
        defauts(p);
        m.comp.forEach(function (x, i) {
          if (typeof x === 'string') return;
          c.appendChild(el('div', 'cr-sous', esc(x.t)));
          var g = el('div', 'cr-choix puces');
          x.c.forEach(function (o) {
            var autre = Object.keys(p.choix).some(function (j) { return +j !== i && p.choix[j] === o; }) || m.comp.indexOf(o) >= 0;
            var b = bouton(esc(o), 'cr-opt', function () { if (autre) return; p.choix[i] = o; p.ptsM = {}; rafraichir(); });
            if (p.choix[i] === o) b.classList.add('pris'); if (autre) b.disabled = true;
            g.appendChild(b);
          });
          c.appendChild(g);
        });
      },
      bas: function (b) { b.appendChild(bouton('Suivant', 'act', suivant)); } }; },
    pointsMetier: function () {
      var m = metier(p.metier), noms = compsMetier(p).concat(['Crédit']), total = pointsMetier(p);
      if (p.ptsM['Crédit'] === undefined) p.ptsM['Crédit'] = m.credit[0];
      var opts = { min: { 'Crédit': m.credit[0] }, max: { 'Crédit': m.credit[1] }, notes: { 'Crédit': 'votre rang et votre fortune, de ' + m.credit[0] + ' à ' + m.credit[1] } };
      var reste = total - noms.reduce(function (a, n) { return a + (p.ptsM[n] || 0); }, 0);
      return {
        q: 'Ce que votre métier vous a appris.', dit: total + ' points (' + formule(m) + '), à répartir entre vos compétences de profession. Le Crédit dit votre aisance : il en coûte au moins ' + m.credit[0] + '.',
        corps: function (c) { repartition(c, noms, p.ptsM, total, opts); },
        bas: function (b) {
          b.appendChild(bouton('Répartir pour moi', 'ghost', function () { p.ptsM['Crédit'] = Math.min(m.credit[1], Math.max(m.credit[0], Math.round((m.credit[0] + m.credit[1]) / 2 / 5) * 5)); repartirAuto(noms.filter(function (n) { return n !== 'Crédit'; }), p.ptsM, total - p.ptsM['Crédit'], { vise: 70 }); rafraichir(); }));
          var ok = bouton(reste > 0 ? 'Encore ' + reste + ' points' : 'Suivant', 'act', suivant); ok.disabled = reste > 0; b.appendChild(ok);
        } };
    },
    loisirs: function () {
      var total = p.carac.INT * 2, noms = LOISIRS.slice(), deja = {};
      Object.keys(p.ptsM).forEach(function (k) { if (k !== 'Crédit') deja[k] = p.ptsM[k]; });
      var reste = total - noms.reduce(function (a, n) { return a + (p.ptsL[n] || 0); }, 0);
      return {
        q: 'Et ce que vous avez appris par vous-même.', dit: total + ' points (INT × 2), pour n’importe quelle compétence : ce que vous lisez le soir, ce que la vie vous a appris.',
        corps: function (c) { repartition(c, noms, p.ptsL, total, { autres: deja }); },
        bas: function (b) {
          b.appendChild(bouton('Répartir pour moi', 'ghost', function () {
            p.ptsL = {}; var cibles = noms.filter(function (n) { return base(n, p) + (deja[n] || 0) < 45; }).slice(0, 6);
            repartirAuto(cibles, p.ptsL, total, { autres: deja, vise: 55 }); rafraichir();
          }));
          var ok = bouton(reste > 0 ? 'Encore ' + reste + ' points' : 'Suivant', 'act', suivant); ok.disabled = reste > 0; b.appendChild(ok);
        } };
    },
    portrait: function () {
      if (!p.key) p.key = 'x' + (p.nom || 'pj').toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 10) + Date.now().toString(36).replace(/[0-9]/g, function (c) { return 'abcdefghij'[+c]; });
      var pc = fiche(p), m = metier(p.metier);
      return {
        q: 'Voici votre photographie.', dit: pc.carac.APP >= 50 ? 'On vous regarde quand vous entrez quelque part. Vous le savez, et vous en jouez.' : 'On vous oublie facilement. C’est parfois un avantage, dans votre situation.',
        corps: function (c) {
          var ph = el('div', 'cr-photo'); var img = new Image();
          img.onload = function () { ph.style.backgroundImage = 'url(' + pc.portrait + ')'; ph.classList.add('ok'); };
          img.onerror = function () { ph.classList.add('vide'); ph.innerHTML = '<span>La photographie est encore au développement.</span>'; };
          img.src = pc.portrait;
          c.appendChild(ph);
          var top = Object.keys(pc.skills).filter(function (k) { return k !== 'Mythe de Cthulhu' && k !== 'Langue (anglais)'; }).sort(function (a, b) { return pc.skills[b] - pc.skills[a]; }).slice(0, 6);
          c.appendChild(el('div', 'cr-fiche',
            '<div class="pn">' + esc((pc.title === 'Dr' ? 'Dr ' : '') + pc.name) + '</div>' +
            '<div class="po">' + esc(pc.occupation) + ' · ' + pc.age + ' ans</div>' +
            '<p class="pb">' + esc(pc.bio) + '</p>' +
            '<div class="cr-mini">' + CARAC.map(function (k) { return '<span>' + k.k.replace('EDU', 'ÉDU') + ' <b>' + pc.carac[k.k] + '</b></span>'; }).join('') + '</div>' +
            '<div class="cr-mini">' + '<span>PV <b>' + pc.pv + '</b></span><span>SAN <b>' + pc.san + '</b></span><span>Magie <b>' + pc.pm + '</b></span><span>Chance <b>' + pc.chance + '</b></span><span>Argent <b>' + pc.money + ' £</b></span></div>' +
            '<div class="cr-mini">' + top.map(function (k) { return '<span>' + esc(k) + ' <b>' + pc.skills[k] + '</b></span>'; }).join('') + '</div>' +
            '<div class="cr-mini inv">' + m.inv.map(esc).join(' · ') + '</div>'));
        },
        bas: function (b) {
          b.appendChild(bouton('Partir pour Londres', 'act', function () { pc.creeLe = Date.now(); garder(pc); fermer(); if (hooks.lancer) hooks.lancer(JSON.parse(JSON.stringify(pc))); }));
        } };
    }
  };

  // les dés qui roulent, puis s'arrêtent sur la valeur
  function roule(elt, v, duree) {
    var t0 = Date.now(); duree = duree || 520;
    (function f() { var k = Date.now() - t0; if (k >= duree) { elt.textContent = v; elt.classList.add('pose'); return; } elt.textContent = 5 * (3 + Math.floor(Math.random() * 16)); requestAnimationFrame(f); })();
  }
  function tirerCarac() {
    var c = {}, j = {};
    CARAC.forEach(function (k) { var r = lancer(k); c[k.k] = r.v; j[k.k] = r; });
    p.carac = c; p.carac0 = JSON.parse(JSON.stringify(c)); p.jets = j; p.age = null; p.eduJets = []; p.eduGain = 0; p.usure = { FOR: 0, CON: 0, DEX: 0 }; p.ptsM = {}; p.ptsL = {};
    rafraichir();
    var t = track.querySelector('.cr-tuile.ici');
    CARAC.forEach(function (k, i) { var e = t.querySelector('.v[data-k="' + k.k + '"]'); if (e) { e.textContent = '…'; setTimeout(function () { roule(e, c[k.k], 420); }, i * 160); } });
  }
  function appliquerAge() {
    var A = AGES.filter(function (a) { return a.id === p.age; })[0] || AGES[0];
    var c = JSON.parse(JSON.stringify(p.carac0));
    c.FOR -= p.usure.FOR; c.CON -= p.usure.CON; c.DEX -= p.usure.DEX; c.APP = Math.max(5, c.APP - A.app); c.EDU = Math.min(99, c.EDU + (p.eduGain || 0));
    p.carac = c; p.ptsM = {}; p.ptsL = {};
  }

  // ---------------------------------------------------------------- ouvrir, fermer
  function fermer() { if (box) box.hidden = true; }
  function ouvrir() {
    box = document.getElementById('tcreate'); if (!box) return;
    box.innerHTML = '';
    var top = el('div', 'cr-top');
    top.appendChild(bouton('Retour', 'ghost', precedent));
    pasEl = el('div', 'cr-pas'); top.appendChild(pasEl);
    top.appendChild(bouton('Quitter', 'ghost', function () { fermer(); if (hooks.retour) hooks.retour(); }));
    box.appendChild(top);
    track = el('div', 'cr-track'); box.appendChild(track);
    p = neuf(); pile = ['accueil']; relance = false; anim = false;
    box.hidden = false;
    afficher('accueil', 1);
  }

  window.Creation = {
    init: function (h) { hooks = h || {}; },
    ouvrir: ouvrir, persos: persos, perso: perso, oublier: oublier,
    // pour les tests : les règles seules
    _regles: { CARAC: CARAC, METIERS: METIERS, AGES: AGES, LOISIRS: LOISIRS, BASE: BASE, fiche: fiche, pointsMetier: pointsMetier, compsMetier: compsMetier, photo: photo, lancer: lancer, neuf: neuf }
  };
})();
