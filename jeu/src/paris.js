/* Chapitre 2 — Paris, première partie : la Bibliothèque nationale et Charenton.
   D'après la trame de la campagne (le comte Fenalik, la maison de Poissy, l'asile), entièrement réécrit pour ce jeu.
   Seconde partie à venir : Poissy. */
(function (G) {
  'use strict';
  var L = G.CHAPTERS && G.CHAPTERS.londres; if (!L || !L._h) return;
  var H = L._h, T = H.T, D = 1440;
  var JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  function at(d, h, m) { return d * D + h * 60 + (m || 0); }
  function day(min) { return Math.floor(min / D); }
  function hour(min) { return Math.floor((min % D) / 60); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function jour(api) { return JOURS[(4 + day(api.s.min)) % 7]; }
  function nuit(api) { var h = hour(api.s.min); return h >= 21 || h < 7; }
  // les troupes françaises entrent dans la Ruhr le jeudi 11 janvier 1923
  function ruhr(api) {
    var d = day(api.s.min);
    return d >= 7 ? 'Les troupes françaises sont entrées dans la Ruhr jeudi.' : d === 6 ? 'Les troupes françaises sont entrées dans la Ruhr ce matin.' : 'Poincaré menace d’envoyer l’armée dans la Ruhr si l’Allemagne ne paie pas.';
  }
  function francais(api) { return api.skill('Langue (français)') >= 50; }

  // ================================================================ les lieux de Paris
  var PL = {
    hotel: { label: 'votre hôtel, rue de Richelieu', concept: 'HOTEL', also: ['GERANT'] },
    bn: { label: 'la Bibliothèque nationale', concept: 'BN', also: ['GAUDRY', 'REMI'], hours: [9, 17], jours: ['dimanche'],
      closed: 'La salle de travail de la Bibliothèque nationale ouvre de 9 h à 17 h. À cette heure, la grille de la rue de Richelieu est fermée.', fermeJour: 'Le dimanche, la Bibliothèque nationale est fermée. Paris lit ses journaux au café.' },
    arsenal: { label: 'la bibliothèque de l’Arsenal', concept: 'ARSENAL', also: ['BREVIN', 'MALON'], hours: [10, 16], jours: ['dimanche'],
      closed: 'La bibliothèque de l’Arsenal n’ouvre que de 10 h à 16 h.', fermeJour: 'L’Arsenal est fermé le dimanche.' },
    charenton: { label: 'la maison de santé de Charenton', concept: 'CHARENTON', also: ['LEROUX', 'ROGNIAT', 'DELPLACE', 'GUIMART'], hours: [9, 19],
      closed: 'La nuit, la grille de Charenton est fermée, et le portier ne se dérange que pour les ambulances.' },
    poissy: { label: 'Poissy', concept: 'POISSY', also: ['VILLA'] },
    lyon: { label: 'la gare de Lyon', concept: 'LYON', also: [] }
  };
  function connu(api, id) { return id === 'hotel' || id === 'bn' || !!api.flag('connu:' + id); }
  // hors de Paris (Poissy, le train de nuit) : les déplacements de Paris ne valent plus
  function ailleurs(api) { return /^(po|oe)_/.test(api.s.loc); }
  function apprendre(api, id) {
    if (connu(api, id)) return;
    api.flag('connu:' + id, true);
    api.sys('Nouveau lieu : ' + PL[id].label + '. Écrivez « aller à… » ou touchez « Où aller ? ».');
  }
  function destChips(api) {
    return Object.keys(PL).filter(function (k) { return k !== api.s.loc && connu(api, k); })
      .map(function (k) { return { label: 'Aller : ' + PL[k].label, action: 'go_' + k }; });
  }
  function trajet(api, dest, minutes) {
    var lignes = nuit(api)
      ? ['Un taxi de nuit, une G7 rouge qui sent le tabac froid. Les boulevards luisent sous la pluie, presque vides.', 'Vous marchez un moment avant de trouver une voiture. Paris, la nuit, appartient aux balayeurs et aux chats.']
      : ['Le métro vous avale à Palais-Royal : carreaux blancs, odeur de fer chaud, affiches pour des apéritifs.', 'Un taxi vous emporte le long des quais. La Seine est haute, couleur d’ardoise.', 'Un autobus à plate-forme, bondé. Vous voyagez debout, cramponné{e} à la rampe, sous une pluie fine.', 'Vous hélez un taxi. Le chauffeur, un Russe à casquette, conduit comme on charge.'];
    api.say(api.fresh('trajetParis', lignes));
    api.time(minutes || 30);
    api.go(dest);
  }
  function goP(id) {
    var p = PL[id];
    return { id: 'go_' + id, label: 'Aller : ' + p.label, repeatable: true, verbs: ['ALLER', 'VISITER'], nouns: [p.concept].concat(p.also), extraVerbs: ['PRENDRE', 'PARLER'], boost: 0.1,
      sait: function (api) { return connu(api, id) || id === 'lyon'; }, // un lieu dont on n'a pas eu vent ne se propose pas (la gare de Lyon, on la connaît)
      cond: function (api) { return api.s.loc !== id && api.s.loc !== 'p_' + id && api.s.loc !== 'gare' && !ailleurs(api); },
      run: function (api) {
        // la gare de Lyon, on la connaît depuis l'arrivée (le train y attend) : elle n'apparaît dans les destinations qu'une fois utile
        if (!connu(api, id) && id !== 'lyon') { api.say('Vous ne savez pas encore où aller pour ça. Il vous faudrait d’abord une adresse, ou une raison.'); return; }
        if (id === 'poissy') { versPoissy(api); return; }
        if (id === 'lyon' && P.versLyon) { P.versLyon(api); return; }
        var h = hour(api.s.min);
        if (p.jours && p.jours.indexOf(jour(api)) >= 0) { api.say(p.fermeJour); return; }
        if (p.hours && h >= p.hours[1]) { api.say(p.closed + ' Il faudra y retourner demain.'); return; }
        if (p.hours && h < 5) { api.say(p.closed + ' Mieux vaut attendre le matin.'); return; }
        if (p.hours && h < p.hours[0]) { api.say(api.fresh('attOuv', ['Vous prenez un café-crème au comptoir d’un bistrot, le temps que les grilles s’ouvrent.', 'Trop tôt. Vous tuez le temps devant un journal et un croissant, à une terrasse couverte.', 'Vous marchez un moment sous la pluie fine, en attendant l’heure d’ouverture.'])); api.s.min = day(api.s.min) * D + p.hours[0] * 60 - (id === 'charenton' ? 50 : 20); }
        if (id === 'charenton' && api.s.loc === 'cafe') { api.say('Vous remontez la rue jusqu’à la grille de la maison de santé.'); api.time(5); api.go(id); return; }
        trajet(api, id, id === 'charenton' || api.s.loc === 'charenton' || api.s.loc === 'cafe' ? 50 : 20);
      } };
  }
  function versPoissy(api) {
    if (nuit(api)) { api.say('Le dernier train pour Poissy est parti de Saint-Lazare. Il faudra attendre demain matin.'); return; }
    // ce qui reste à Paris : on le dit une fois, sans l'interdire
    var reste = [];
    if (!api.has('RIGAULT')) reste.push('vous ne savez toujours pas ce que le roi a fait du comte');
    else if (!api.s.visited.charenton) reste.push('vous n’avez pas mis les pieds à Charenton, où l’on a enfermé le comte');
    else if (!api.has('CAHIER') && !api.has('MANDRIN')) reste.push('personne ne vous a dit de quoi est mort le directeur de Charenton');
    if (reste.length && !api.flag('poissyAverti')) {
      api.flag('poissyAverti', true);
      api.say('Vous consultez l’horaire des trains de banlieue. Puis votre carnet. Quelque chose reste en suspens à Paris : ' + reste.join(', et ') + '. Poissy ne s’envolera pas.');
      api.chips([{ label: 'Partir quand même pour Poissy', action: 'go_poissy' }, { label: 'Rester à Paris', action: 'p_notes' }]);
      return;
    }
    api.say('Gare Saint-Lazare, un train de banlieue aux banquettes de bois. Vingt-huit kilomètres vers l’ouest, le long de la Seine. Vous regardez défiler les jardins ouvriers, puis la forêt de Saint-Germain, noire sous la pluie.');
    api.say(api.has('GUETTEUR') ? 'Sur le quai, au moment où le train s’ébranle, vous cherchez des yeux une silhouette trop maigre. Il n’y a que des voyageurs. Vous regardez quand même jusqu’au bout.' : 'Quelque part là-bas, sous une maison que vous ne connaissez pas encore, il y a une cave que des soldats ont refusé de décrire.');
    if (P.arriverPoissy) { P.arriverPoissy(api); return; }
    api.flag('fin', 'poissy');
    api.end();
  }

  // ================================================================ le chapitre
  var P = {
    id: 'paris',
    title: 'L’Express de minuit',
    chapter: 'Paris · Le comte oublié',
    short: 'Paris',
    tick: 5, talkTick: 2,
    sanLabels: L.sanLabels, perceive: L.perceive, money: L.money, beforeAction: L.beforeAction, onMadness: L.onMadness,
    // jour 0 = vendredi 5 janvier 1923, comme à Londres ; venu de Londres, on arrive le jour où l'on en est parti (voir P.intro)
    start: { loc: 'gare', min: at(7, 17, 40), money: 40, inv: [] },
    investigator: null,
    clock: function (min) { var d = day(min), wd = JOURS[(4 + d) % 7]; return wd.charAt(0).toUpperCase() + wd.slice(1, 3) + ' ' + (5 + d) + ' · ' + pad(hour(min)) + ' h ' + pad(min % 60); },
    where: function (min, s) { var h = hour(min), mom = h < 6 ? 'nuit' : h < 12 ? 'matin' : h < 18 ? 'après-midi' : h < 22 ? 'soir' : 'nuit', l = (s && s.loc) || ''; return (/^po_/.test(l) ? 'Poissy · ' : /^oe_/.test(l) ? 'Orient-Express · ' : 'Paris · ') + (5 + day(min)) + ' janvier 1923 · ' + mom; },
    examples: '« je vais à la Bibliothèque nationale », « je demande une carte de lecteur », « je cherche le comte Fenalik »',
    phrases: [
      [/\bbibliotheque nationale\b|\bsalle de travail\b|\brue de richelieu\b|\bla nationale\b/g, ' bn '],
      [/\bbibliotheque de l arsenal\b|\bl arsenal\b/g, ' arsenal '],
      [/\bmaison (nationale )?de sante\b|\basile de charenton\b|\bl asile\b|\bl hospice\b/g, ' charenton '],
      [/\b(docteur|dr|professeur) leroux\b|\ble directeur\b|\bnouveau directeur\b/g, ' leroux '],
      [/\b(madame|mme) rogniat\b/g, ' rogniat '],
      [/\b(docteur|dr) delplace\b|\bancien directeur\b/g, ' delplace '],
      [/\bcahier bleu\b|\b(journal|carnet|cahier) (de|du) (docteur |dr )?delplace\b|\bjournal bleu\b/g, ' cahier '],
      [/\bcarte de lecteur\b|\blaissez passer\b|\b(ticket|billet) de lecteur\b|\bcarte d acces\b/g, ' carte '],
      [/\bcomte (de )?fenalik\b|\bfenalicheque\b|\ble comte\b/g, ' fenalik '],
      [/\b(le |les )?(journal|carnet|papiers|memoires|cahier) du capitaine( malon)?\b|\bcapitaine malon\b|\ble capitaine\b/g, ' malon '],
      [/\b(le |les )?(journal|carnet|papiers|memoires) (du|de) (medecin|docteur|dr)( rigault)?\b/g, ' rigault '],
      [/\bmedecin de la reine\b|\b(docteur |dr )?rigault\b/g, ' rigault '],
      [/\b(l )?etudiant\b|\ble (traducteur|rouquin|rouquin a lunettes)\b|\bremi vangeim\b/g, ' remi '],
      [/\b(vous a|t a|lui a|a t il|vous a t il) (dit|confie|raconte)\b|\bdernier soir\b|\bderniers mots\b|\bdernieres paroles\b/g, ' paroles '],
      [/\binfirmiers?\b/g, ' mandrin '],
      [/\b(un |le |les |des )?malades?\b/g, ' patient '],
      [/\bsous sols?\b/g, ' soussol '],
      [/\b(se faire|me faire|nous faire) interner\b|\bme faire passer pour (fou|folle|un fou|une folle)\b/g, ' interner ']
    ].concat(L.phrases || []),
    lexicon: function (Lx) {
      // les mots de Paris passent avant ceux de Londres (« bibliothèque », « villa », « secrétaire »…)
      Lx.add('BN', 'n', 'bn, bibliotheque, imprimes, richelieu', { label: 'la Bibliothèque nationale' });
      Lx.add('ARSENAL', 'n', 'arsenal', { label: 'la bibliothèque de l’Arsenal' });
      Lx.add('CHARENTON', 'n', 'charenton, asile, alienes, hospice', { label: 'Charenton' });
      Lx.add('POISSY', 'n', 'poissy', { label: 'Poissy' });
      Lx.add('FENALIK', 'n', 'fenalik, fenalic', { label: 'le comte Fenalik' });
      Lx.add('GERANT', 'n', 'gerant, blain, hotelier', { label: 'M. Blain', npc: true });
      Lx.add('SECRETAIRE', 'n', 'secretaire, secretariat, guichet', { label: 'le secrétariat' });
      Lx.add('GAUDRY', 'n', 'gaudry', { label: 'M. Gaudry', npc: true });
      Lx.add('REMI', 'n', 'remi, vangeim', { label: 'Rémi Vangeim', npc: true });
      Lx.add('BREVIN', 'n', 'brevin, conservatrice', { label: 'Mlle Brévin', npc: true });
      Lx.add('ROGNIAT', 'n', 'rogniat', { label: 'Mme Rogniat', npc: true });
      Lx.add('LEROUX', 'n', 'leroux', { label: 'le docteur Leroux', npc: true });
      Lx.add('MANDRIN', 'n', 'mandrin, infirmier, infirmiers', { label: 'Mandrin', npc: true });
      Lx.add('DELPLACE', 'n', 'delplace', { label: 'le docteur Delplace' });
      Lx.add('GUIMART', 'n', 'guimart', { label: 'Guimart' });
      Lx.add('CAISSES', 'n', 'caisses, caisse, cartons, carton', { label: 'les caisses' });
      Lx.add('CAHIER', 'n', 'cahier', { label: 'le cahier bleu' });
      Lx.add('VILLA', 'n', 'villa, manoir, plans, gravure, gravures, maison du comte, demeure du comte', { label: 'la maison du comte' });
      Lx.add('MALON', 'n', 'malon', { label: 'le capitaine Malon' });
      Lx.add('RIGAULT', 'n', 'rigault', { label: 'le médecin Rigault' });
      Lx.add('PATIENT', 'n', 'patient, patients, malade, malades, pensionnaire, pensionnaires', { label: 'le patient' });
      Lx.add('SOUSSOL', 'n', 'cave, caves, soussol, souterrain, souterrains, soupirail, soupiraux', { label: 'les caves' });
      Lx.add('ELECTROCHOC', 'x', 'electrochoc, electrochocs, electricite, appareil', { label: 'la machine' });
      Lx.add('TRADUIRE', 'x', 'traduire, traduction, traducteur, traduis, traduisez, interprete', { label: 'la traduction' });
      Lx.add('INTERNER', 'x', 'interner, internement', { label: 'l’internement' });
      Lx.add('PERIODIQUES', 'n', 'periodiques, necrologie, necrologies, quotidiens, journaux recents, journaux du jour', { label: 'les journaux récents' });
      Lx.add('SCANDALE', 'n', 'scandale, scandales, reine, versailles', { label: 'le scandale' });
      Lx.add('DECES', 'x', 'mort, morte, morts, deces, decede, decedee, mourir, accident, tue', { label: 'la mort' });
      Lx.add('PAROLES', 'n', 'paroles', { label: 'ses paroles' });
      L.lexicon(Lx);
      // à Paris, la seule bibliothécaire est Mlle Brévin
      if (Lx.concepts.BIBLIOTHECAIRE) Lx.concepts.BIBLIOTHECAIRE.label = 'la bibliothécaire';
    },

    clues: {
      SCANDALE: { title: 'Un scandale à la cour', text: 'Juin 1789 : un petit noble allemand, le comte Fenalik, aurait compromis la reine. Les histoires de la cour disent qu’il fut exécuté sans procès. Aucune ne dit où, ni par qui.' },
      COUR: { title: 'Le journal d’une dame de la cour', text: 'Le « comte Fenalicheque » donnait à Poissy des fêtes dont tout Paris parlait. Puis « le mal fut manifeste », la reine se fâcha, et les hommes du roi allèrent prendre la maison.' },
      MALON: { title: 'Le journal du capitaine Malon', text: 'Le capitaine qui mena l’assaut à Poissy a trouvé sous la maison des salles qu’il refuse de décrire. Il a fait brûler la demeure. Le comte, hurlant, fut conduit « là où il resterait ».' },
      RIGAULT: { title: 'Le journal du médecin Rigault', text: 'Le médecin de la reine jugea le comte fou. On ne l’exécuta pas : on l’enferma à Charenton, dans une cave, parce qu’il attaquait les autres malades.' },
      DELPLACE: { title: 'La mort du docteur Delplace', text: 'Le directeur de Charenton, le docteur Étienne Delplace, est mort il y a une semaine, « par un tragique accident ». Le docteur Leroux assure l’intérim.' },
      REGISTRE: { title: 'Un nom, puis rien', text: 'Le registre de Charenton porte l’entrée du comte Fenalik en juin 1789. Ensuite, plus une ligne : ni soins, ni transfert, ni décès.' },
      CAHIER: { title: 'Le cahier du docteur Delplace', text: 'Un infirmier, Guimart, blessé dans les caves. Près de lui, un inconnu emmuré depuis on ne sait quand, vivant. Delplace l’a ranimé à l’électricité. L’homme parlait grec, latin, et répétait trois noms.' },
      MANDRIN: { title: 'Ce que sait Mandrin', text: 'Delplace est mort près de sa machine, et Leroux a fait enlever le corps avant le jour. Depuis l’affaire Guimart, il gardait un patient dans son aile privée. « C’est à ma portée, Mandrin. »' },
      VILLA: { title: 'La maison de Poissy', text: 'Les plans d’un entrepreneur parisien : une demeure faite de morceaux de tous les siècles, et des escaliers qui descendent vers des caves qu’il n’a pas dessinées.' },
      GUETTEUR: { title: 'Quelqu’un, sous le réverbère', text: 'Une nuit, à Paris, quelqu’un regardait votre fenêtre depuis la rue. Très maigre, très immobile. Quand vous avez ouvert, il n’y avait plus personne.' }
    },

    checks: {
      credit_carte: { skill: 'Crédit', why: 'obtenir une carte de lecteur le jour même',
        resolve: function (api, r) {
          if (r.success) { api.flag('carteBN', true); api.npc('gaudry', '« Une recommandation de cette qualité… » Il tamponne un carton vert, deux fois. « Carte provisoire. Vous indiquerez l’objet de vos recherches à chaque visite. Et l’on ne distribue plus d’ouvrages dans la dernière heure. »'); api.take('Une carte de lecteur de la Bibliothèque nationale'); }
          else { api.flag('carteJour', day(api.s.min) + 2); api.npc('gaudry', '« Je regrette. Les étrangers doivent fournir une lettre de leur consul. » Il range votre demande dans une chemise grise. « Écrivez-lui aujourd’hui : votre carte sera prête après-demain. L’administration ne court pas, {m}. Elle arrive. »'); }
        } },
      bn_recherche: { skill: 'Bibliothèque', why: 'retrouver la trace du comte',
        resolve: function (api, r) { recherche(api, r); } },
      bn_journaux: { skill: 'Bibliothèque', why: 'dépouiller les journaux récents',
        resolve: function (api, r) {
          if (!r.success) { api.say('Des colonnes de faits divers, de cours de la Bourse et de réclames pour des pastilles. Vos yeux brûlent.' + (api.sait('CHARENTON') ? ' Rien sur Charenton, ou alors vous l’avez laissé passer.' : ' Rien qui vous parle, ou alors vous l’avez laissé passer.')); return; }
          api.say('Dans les quotidiens de la semaine dernière, un encadré noir revient d’un journal à l’autre.');
          api.doc('LE DOCTEUR ÉTIENNE DELPLACE — Nous pleurons notre directeur, homme d’une haute conscience et pionnier de la neurologie. Sa disparition, par un tragique accident, est une perte cruelle pour la maison de Charenton, pour Paris et pour la science française. Nos pensées vont à sa famille. — Dr François Leroux, directeur par intérim.', 'Le Petit Parisien · janvier 1923');
          if (!api.has('DELPLACE')) api.clue('DELPLACE');
          apprendre(api, 'charenton');
        } },
      bn_villa: { skill: 'Bibliothèque', why: 'retrouver la maison de Poissy dans les fonds d’architecture',
        resolve: function (api, r) {
          if (!r.success) { api.say('Des recueils de façades, des traités de jardins, des devis. La maison du comte n’y est pas, ou elle s’y cache sous un autre nom.'); return; }
          api.say('Un entrepreneur parisien a relevé la maison avant 1789. C’était une curiosité : un fronton grec, des arcs-boutants, une tour neuve bâtie en ruine, comme on en faisait dans les parcs anglais. Sur le plan, deux escaliers descendent et s’arrêtent au bord de la feuille. Il n’a pas dessiné les caves.');
          api.say('Une petite gravure montre la façade. Vous la regardez plus longtemps que vous ne le vouliez. Aucune ligne n’est tout à fait d’aplomb, et l’ensemble tient pourtant debout, comme un raisonnement juste dans la bouche d’un fou.');
          if (!api.has('VILLA')) api.clue('VILLA');
          api.check('san_gravure');
        } },
      san_gravure: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'détacher les yeux de la gravure',
        resolve: function (api, r) { api.say(r.success ? 'Vous refermez le carton. Ce n’est qu’une maison mal dessinée.' : 'Vous refermez le carton, et la façade reste là, derrière vos paupières, à pencher du mauvais côté.'); } },
      ar_recherche: { skill: 'Bibliothèque', why: 'trouver le journal du capitaine',
        resolve: function (api, r) {
          if (!r.success) { api.say('Les papiers militaires de l’Ancien Régime dorment dans des liasses que personne n’a ouvertes depuis Bonaparte. Vous en dénouez six. Aucune n’est la bonne.'); api.npc('brevin', api.fresh('brevinRate', ['« Les liasses de 1789 sont classées par régiment, pas par nom. Revenez-y : on finit toujours par tomber dessus. »', '« Patience. Ce fonds n’a pas été rangé pour les gens pressés. »'])); return; }
          api.say('Un carnet relié de toile, taché, de l’écriture serrée d’un homme qui n’aimait pas écrire. Le capitaine Louis Malon y note ses étapes et ses dépenses. Et, en juin 1789, ceci :');
          api.doc('LE CAPITAINE LOUIS MALON — Quand nous arrivâmes, la fête durait encore, et ce que j’y vis ne se dit pas devant des gens honnêtes. Nous chassâmes tout ce monde, gardant ceux qui ne pouvaient répondre d’eux-mêmes. J’envoyai six hommes prendre le comte, et je descendis sous la maison. Je ne décrirai pas ce qu’il y avait là. C’était un cloaque, et c’était l’enfer. Des instruments de supplice dans chaque salle. Une vierge de fer, fermée : nous la brisâmes, craignant d’y trouver quelqu’un. Il n’y restait que l’ordure d’un malheureux mort depuis longtemps. J’ai donné l’ordre de brûler la maison, le cœur en paix. Le comte hurlait comme si c’était son âme qu’on brûlait. Nous l’avons mené là où il restera. Qu’il y pourrisse.', 'Bibliothèque de l’Arsenal · papiers Malon, juin 1789');
          if (!api.has('MALON')) api.clue('MALON');
          apprendre(api, 'poissy');
          api.npc('brevin', '« Vous êtes le premier à demander ce carnet depuis que je suis ici. » Elle le reprend avec précaution. « Poissy… Il ne reste rien de cette maison, vous savez. On a rebâti dessus. »');
        } },
      ch_registres: { skill: 'Bibliothèque', why: 'déchiffrer les registres de 1789',
        resolve: function (api, r) {
          if (!r.success) { api.say('Une écriture de greffier pressé, des abréviations de médecin, l’encre bue par l’humidité. Les noms dansent. Vous rendez les registres sans avoir trouvé celui que vous cherchiez.'); return; }
          api.say('Juin 1789. Entre un chanoine mélancolique et une lingère qui se croyait reine, une ligne : « Fenalik, comte, étranger. Amené par ordre du Roi. Furieux. » Vous tournez les pages. Les autres malades ont des saignées, des bains, des visites, une date de sortie ou de mort. Lui n’a plus rien. Pas même son décès.');
          api.say('Peut-être est-il mort si vite qu’on a négligé de l’écrire. C’est l’explication raisonnable. Vous la notez sans y croire tout à fait.');
          if (!api.has('REGISTRE')) api.clue('REGISTRE');
        } },
      credit_leroux: { skill: 'Crédit', why: 'être reçu par le directeur',
        resolve: function (api, r) {
          if (r.success) { api.flag('lerouxRecu', day(api.s.min) + 1); api.npc('rogniat', '« Le docteur vous accorde dix minutes. » Elle n’a pas l’air d’approuver. « Par ici. »'); antichambre(api); }
          else { api.flag('lerouxRefus', day(api.s.min) + 1); api.npc('rogniat', '« Le docteur Leroux ne reçoit pas sans rendez-vous, et son carnet est plein jusqu’à la fin du mois. » Elle retourne à sa machine à écrire. « Vous pouvez laisser une carte. »'); }
        } },
      toc_caisses: { skill: 'Trouver Objet Caché', why: 'voir ce que contiennent les caisses, sans en avoir l’air',
        resolve: function (api, r) {
          if (r.success) { api.flag('cahierVu', true); api.say('Le couvercle d’une caisse est mal remis. Entre deux traités de neurologie, le dos d’un cahier cartonné bleu, et sur le plat, à l’encre : « É. Delplace — Événements 1923 ».'); api.chips([{ label: 'Prendre le cahier bleu', action: 'ch_cahier' }]); return; }
          var n = (api.flag('caissesN') || 0) + 1; api.flag('caissesN', n);
          if (n >= 2) { api.say('Mme Rogniat se lève, pose un registre à plat sur la caisse ouverte, et se rassied. Elle n’a pas dit un mot.'); return; }
          api.say('Des livres de médecine, un presse-papiers, un diplôme sous verre. Les affaires d’un homme qu’on déménage sans lui demander son avis. Il vous faudrait un prétexte pour vous approcher davantage.');
        } },
      baratin_rogniat: { skill: 'Baratin', why: 'détourner l’attention de Mme Rogniat',
        resolve: function (api, r) {
          if (r.success) { api.say('Vous lui demandez l’orthographe exacte du nom du directeur, puis son prénom, puis l’adresse où lui écrire. Elle soupire, cherche un bristol, vous tourne le dos. Trois secondes. Votre main entre dans la caisse et en ressort.'); cahierPris(api); }
          else { api.say('Elle répond sans quitter les caisses des yeux. Cette femme a compris ce que vous regardiez avant vous.'); api.check('dex_cahier'); }
        } },
      dex_cahier: { skill: 'Discrétion', why: 'prendre le cahier quand même',
        resolve: function (api, r) {
          if (r.success) { api.say('Elle se penche pour ramasser un buvard. C’est tout ce qu’il vous fallait.'); cahierPris(api); }
          else { api.flag('cahierRate', true); api.npc('rogniat', '« Vos mains, {m}. » Elle s’est levée. Elle est plus grande que vous ne pensiez. « Ces caisses partent ce soir chez la veuve du docteur. Sortez, avant que j’appelle. »'); api.npcs('rogniat').closedUntil = api.s.min + 600; api.endTalk(false); api.say('Vous voilà dans la cour, le cœur battant, les mains vides. Le cahier quittera Charenton ce soir. Il reste les gens qui ont connu Delplace.'); }
        } },
      san_guetteur: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'vous rendormir',
        resolve: function (api, r) { api.say(r.success ? 'Un rôdeur, un ivrogne, un mari qui n’ose pas rentrer. Paris en est plein. Vous refermez les rideaux.' : 'Vous restez longtemps derrière la vitre, sans allumer. Le trottoir est vide. Vous n’arrivez pas à vous défaire de l’idée qu’on vous a regardé dormir.'); } }
    },

    ending: { title: 'Fin de la première partie : Paris', text: 'Le train de banlieue vous emporte vers Poissy, et vers ce qui dort sous la maison du comte. La suite du chapitre arrive.' }
  };
  P.endingFor = function (s) {
    if (s.flags && s.flags.fin === 'extrade') return { title: 'Fin : rendu à Londres', text: 'Ce que vous aviez fait à Londres vous a rattrapé à Paris. Deux inspecteurs vous raccompagnent à Calais, menottes aux poignets, et le comte Fenalik retourne à son oubli.' };
    if (s.flags && s.flags.fin === 'prison') return { title: 'Fin : la Santé', text: 'Trois fois devant le commissaire, c’est une fois de trop. La prison de la Santé a des murs épais, et l’Orient-Express partira sans vous.' };
    return null;
  };

  // ================================================================ la recherche à la Bibliothèque nationale
  function difficulte(api) { return francais(api) || aide(api) ? 'normal' : 'difficile'; }
  function aide(api) { return api.flag('remiJour') === day(api.s.min); }
  function recherche(api, r) {
    var n = api.flag('bnP') || 0;
    if (!r.success) {
      api.say(api.fresh('bnRate', [
        'Trois heures à suivre un Fenalik qui se révèle être un marchand de draps de Colmar. Les fiches de la Nationale sont écrites par dix mains, sur deux siècles. Vous rendez vos volumes sans avoir avancé.',
        'On vous apporte quatre in-folio. Trois ne concernent pas la bonne année, le quatrième est en allemand gothique. La journée fond comme une bougie.',
        'Vous remplissez des bulletins de demande. On vous répond « communiqué », « à la reliure », « manque en place ». Rien, cette fois.']));
      if (!francais(api) && !aide(api) && !api.flag('conseilRemi')) { api.flag('conseilRemi', true); api.say('Tout est en français, et dans un français de perruque. Seul{e}, vous n’y arriverez qu’à force de jours. Il vous faudrait quelqu’un qui lise cette langue comme on respire.'); }
      return;
    }
    n += 1; api.flag('bnP', n);
    if (n === 1) {
      api.say('Les histoires de la cour s’accordent sur une chose, et sur une seule. À la veille de la Révolution, un scandale a touché l’entourage de la reine : un petit noble allemand, admis on ne sait comment, aurait manqué au respect dû à Sa Majesté. Il y eut du bruit au palais, puis plus rien. L’homme, écrit-on, fut exécuté sans jugement. Il s’appelait Fenalik.');
      api.say('Exécuté sans jugement, à la cour de France, un comte. Aucun des auteurs ne semble s’en étonner. Vous, si.');
      api.clue('SCANDALE');
    } else if (n === 2) {
      api.say('Le manuscrit arrive dans une boîte, taché d’eau, la moitié des pages collées. C’est le journal d’une dame d’atour : des querelles de préséance, des dettes de jeu, des amants. Et, en juin 1789, quelques lignes encore lisibles.');
      api.doc('JOURNAL D’UNE DAME DE LA COUR — Le comte Fenalicheque était parmi nous comme un soleil, et chacun se réjouissait de ses plaisirs. Ses fêtes de Poissy passent pour les plus somptueuses et les plus libres que l’on ait vues… [pages perdues] …C’est alors qu’il parut à tous que le mal était à l’œuvre, et la Reine s’en fâcha. Les hommes du Roi allèrent prendre la maison, on y brisa beaucoup, et le comte fut arrêté…', 'Bibliothèque nationale · manuscrits, 1789');
      api.clue('COUR');
      api.say('Une note au crayon, d’un bibliothécaire du siècle dernier, dans la marge : « Voir les papiers du capitaine Malon, à l’Arsenal. »');
      apprendre(api, 'arsenal');
    } else if (n === 3) {
      api.say('Cette fois, c’est un médecin qui écrit : Lucien Rigault, attaché à la maison de la reine. Un homme sec, précis, qui compte les saignées. Il n’aime pas raconter. Il raconte quand même.');
      api.doc('JOURNAL DU MÉDECIN RIGAULT — Deux nuits plus tard, les soldats du Roi allèrent en force à la maison du comte, pour mettre fin à ses excès. Après l’avoir brûlée, ils l’amenèrent devant le lieutenant du Roi, qui me fit appeler. Le comte Fenalik hurlait et se tordait : il était aisé de voir qu’il était fou. Noble et fou, il ne pouvait être mis à mort. J’ai suggéré qu’un roi clément le plaçât à Charenton. Ce fut fait, et le Roi approuva. La dernière chose que j’en ai sue : on l’avait enfermé dans une cave, parce qu’il se jetait sur les autres malades.', 'Bibliothèque nationale · manuscrits, 1789');
      api.clue('RIGAULT');
      apprendre(api, 'charenton');
      api.say('Il n’a donc pas été exécuté. On l’a mis dans une cave, à Charenton, et l’histoire a préféré dire qu’il était mort.');
    } else {
      api.say(api.fresh('bnPlus', ['Vous reprenez les mêmes volumes, à la recherche d’un détail manqué. Il n’y a plus rien sur Fenalik : après juin 1789, la France a eu d’autres soucis.', 'Rien de neuf. Tout ce que la Nationale savait du comte tient maintenant dans votre carnet.']));
      if (api.has('MALON') && !api.has('VILLA')) api.chips([{ label: 'Chercher la maison de Poissy', action: 'bn_villa' }]);
    }
  }

  // une séance de travail : jamais au-delà de la fermeture
  function etude(api, minutes) {
    var p = PL[api.s.loc], fin = p && p.hours ? day(api.s.min) * D + p.hours[1] * 60 : Infinity;
    api.time(Math.max(10, Math.min(minutes, fin - api.s.min)));
  }
  function salleBN(api) {
    if (!api.flag('carteBN')) { api.say(api.fresh('sansCarte', ['Un garçon de salle vous arrête d’un doigt levé. Sans carte de lecteur, on ne vous apportera pas un seul volume. Le secrétariat est à l’entrée.', 'Sans carte, rien. Le garçon de salle ne lève même plus le doigt : il montre le secrétariat.'])); api.chips([{ label: 'S’adresser au secrétariat', action: 'bn_gaudry' }]); return false; }
    if (hour(api.s.min) >= 16) { api.say(api.fresh('derniereHeure', ['« On ne communique plus d’ouvrages dans la dernière heure. » Le garçon de salle montre l’horloge. Il faudra revenir demain matin.', 'Trop tard pour aujourd’hui : après quatre heures, les magasins ne livrent plus rien.'])); return false; }
    return true;
  }
  // les maisons ferment : on ne reste pas dans une bibliothèque la nuit
  var DEHORS = {
    bn: 'Une cloche grêle. « Messieurs, on ferme ! » Les lampes vertes s’éteignent une à une, et la salle se vide sous l’œil du concierge à médailles.',
    arsenal: '« Nous fermons. » Mlle Brévin attend, les clés à la main, que vous ayez rendu le dernier carton.',
    charenton: 'Le portier agite son trousseau. « Les visites sont finies. » La grille se referme derrière vous sur les arcades vides.'
  };
  P.everyTurn = function (api) {
    var p = PL[api.s.loc]; if (!p || !p.hours || api.s.ended || api.s.pending) return false;
    var h = hour(api.s.min);
    if (h < p.hours[1] && h >= p.hours[0] - 1 && !(p.jours && p.jours.indexOf(jour(api)) >= 0)) return false;
    if (api.s.talk) api.endTalk(false);
    api.say(DEHORS[api.s.loc]);
    api.say('Vous rentrez rue de Richelieu, par des rues où l’on allume les réverbères.');
    api.time(api.s.loc === 'charenton' ? 50 : 20);
    api.go('hotel');
    return true;
  };

  // ================================================================ Charenton : l'antichambre, le cahier
  function antichambre(api) {
    api.say(api.fresh('antich', ['Mme Rogniat frappe deux coups à la porte capitonnée, l’ouvre, et s’efface à peine.', 'La porte capitonnée, de nouveau. Mme Rogniat vous annonce d’une voix sans chaleur.']));
    api.talk('leroux');
  }
  var CAHIER = 'Le cahier bleu du docteur Delplace';
  function cahierPris(api) {
    api.take(CAHIER);
    api.say('Dehors, sous les arcades, vous l’ouvrez. Une écriture de médecin, pressée, datée. Les dernières pages précèdent sa mort de quelques jours.');
    api.doc('CAHIER DU DOCTEUR DELPLACE — Un événement fâcheux cette nuit. L’infirmier Guimart, du quatrième quartier, est descendu aux caves sans autorisation. Mandrin l’y a trouvé, le poignet droit presque tranché, en état de choc. Soigné à temps. Mais, à son réveil, il délire : « les créatures de la nuit », « l’attaque des morts ». Je l’ai placé à la chambre 13. — Il n’était pas seul. Près de lui gisait un homme que personne ici ne connaît, dans un état physique effroyable, derrière un mur dont le mortier a plus d’un siècle. Qui l’a nourri ? Comment vit-il ? — Je le fais porter dans mon aile. Il rend le bouillon. Il ne prend rien, et il vit. L’électricité le réveillerait-elle ? — Après plusieurs applications, il s’est éveillé, trop faible pour bouger. Il gémit et supplie, en grec ancien, en latin, dans un parler qui tient du slave. Il répète trois noms : Marosh, Gorgynia, Sofia. Des villes qui s’écroulent, et des choses plus sombres. On croirait toucher la mémoire de toute une race.', 'Charenton · É. Delplace, « Événements 1923 »');
    if (!api.has('CAHIER')) api.clue('CAHIER');
    api.say('Après cela, quelques lignes sans importance. Puis plus rien. Un homme emmuré depuis plus de cent ans, vivant. Et, dans le registre de 1789, un comte qu’on a descendu dans une cave et dont personne n’a noté la mort.');
  }

  // la nuit à l'hôtel : on se réveille à huit heures ; une fois la piste de Charenton ouverte, quelqu'un regarde la fenêtre
  function nuitParis(api) {
    var h = hour(api.s.min), d = day(api.s.min) + (h >= 8 ? 1 : 0);
    if ((api.has('CAHIER') || api.has('MANDRIN') || api.has('REGISTRE')) && !api.flag('guetteur')) {
      api.flag('guetteur', true);
      api.say('Vous vous réveillez à trois heures, sans raison. La chambre est glacée, et il y flotte une odeur de terre mouillée, de cave, qui n’y était pas hier. Vous allez à la fenêtre.');
      api.say('Sous le réverbère d’en face, quelqu’un se tient debout, la tête levée vers votre étage. Très maigre. Les bras trop longs, peut-être. Il ne bouge pas, comme ne bougent pas les choses qui ont tout leur temps. Vous ouvrez la croisée : le trottoir est vide.');
      api.clue('GUETTEUR');
      api.s.min = d * D + 8 * 60; api.s.tick = 0; api.flag('guetteurMin', api.s.min);
      api.check('san_guetteur');
      return;
    }
    api.say(api.fresh('dodoP', ['Vous dormez d’un sommeil sans rêves, pour une fois. Au matin, on monte un café au lait et un croissant.', 'Une nuit hachée par l’ascenseur et les tramways. Le matin se lève, gris et mouillé.', 'Vous rêvez de trains. Au réveil, il pleut sur Paris.', 'Vous dormez mal, et vous vous levez tôt. ' + JOURS[(4 + d) % 7].charAt(0).toUpperCase() + JOURS[(4 + d) % 7].slice(1) + ', huit heures.']));
    api.s.min = d * D + 8 * 60; api.s.tick = 0;
  }

  // ================================================================ les personnages
  P.npcs = {
    gerant: H.npc({ id: 'gerant', name: 'M. Blain, le gérant', short: 'M. Blain', patience: 9, cooldown: 15, selfKeys: ['GERANT', 'RECEPTION'],
      greet: function (api, first) { api.npc('gerant', first ? 'Un petit homme rond, en gilet de tapisserie, qui parle anglais comme on récite. « Blain, gérant. Monsieur le professeur Smith descendait chez nous, avant la guerre. Ses amis sont les nôtres. »' : api.fresh('blainG', ['« {M} ? »', '« Que puis-je pour vous, {m} ? »', 'M. Blain lève le nez de son grand livre.'])); },
      bye: '« Bonne journée, {m}. Et prenez un parapluie. »',
      deflect: ['« Je crains de ne pas saisir, {m}. »', 'M. Blain sourit, poliment perdu.', '« Si c’est pour un taxi, je sonne le chasseur. »'],
      topics: [
        T('bn', ['BN', 'LIVRE', 'CARTE'], ['« La Nationale ? À cent mètres, {m}, même trottoir. Il vous faudra une carte : ils sont très à cheval. Demandez le secrétariat, et armez-vous de patience. »', '« De neuf heures à cinq heures, jamais le dimanche. Et l’on n’y parle pas plus haut qu’à l’église. »'], { chip: 'La Bibliothèque nationale' }),
        T('smith', ['SMITH', 'BEDDOWS'], ['« Monsieur Smith prenait toujours la 12, sur la cour. Il travaillait la nuit. Il laissait des pourboires de prince et des cendres partout. » Il baisse la voix. « On m’a dit, pour l’incendie. Quelle pitié. »'], { chip: 'Le professeur Smith' }),
        T('lieux', ['DESTINATIONS', 'TAXI'], function (api) { api.npc('gerant', '« Le métro est à Palais-Royal. Pour un taxi, je sonne le chasseur. Où souhaitez-vous vous rendre, {m} ? »'); api.chips(destChips(api).slice(0, 5)); }, { chip: 'Se déplacer dans Paris' }),
        T('charenton', ['CHARENTON', 'DELPLACE', 'DECES'], ['« Charenton ? » Il se signe presque. « C’est au bout de la ligne, {m}, après Bercy. On y a mis le marquis de Sade, autrefois. On n’y va pas pour son plaisir. »', '« Les journaux ont parlé du directeur, la semaine dernière. Un accident. On n’a pas dit lequel, ce qui est toujours mauvais signe. »']),
        T('fenalik', ['FENALIK', 'POISSY'], function (api) { api.npc('gerant', '« Fenalik ? Ce nom ne me dit rien. Un Alsacien ? »' + (api.sait('POISSY') ? ' Il réfléchit. « Poissy, je connais : ma belle-sœur y tient une mercerie. Une petite ville tranquille. Il ne s’y passe jamais rien. »' : ' Il réfléchit, puis secoue la tête. « Non. Demandez à la Nationale, ils ont tout. »')); }),
        T('train', ['VOYAGE', 'TRAIN', 'BILLETS', 'VICTORIA', 'LYON'], function (api) { api.npc('gerant', '« Le Simplon-Orient part de la gare de Lyon, {m}, chaque soir à 22 h 50. Vos places sont retenues : la Compagnie nous a prévenus. Vous partirez quand vos affaires à Paris seront finies. »'); apprendre(api, 'lyon'); }, { chip: 'L’Orient-Express' })
      ] }),
    gaudry: H.npc({ id: 'gaudry', name: 'M. Gaudry, au secrétariat', short: 'M. Gaudry', patience: 5, cooldown: 60, selfKeys: ['GAUDRY', 'SECRETAIRE'],
      greet: function (api, first) { api.npc('gaudry', first ? 'Derrière un guichet de chêne, un homme gris en manchettes de lustrine vous regarde par-dessus ses lorgnons. « L’objet de vos recherches ? »' : api.fresh('gaudryG', ['« Encore vous. »', '« L’objet de votre visite ? »'])); },
      bye: '« Silence dans la salle. »',
      deflect: ['« Ce n’est pas de mon ressort. »', 'M. Gaudry tapote un règlement affiché au mur.', '« Formulez une demande écrite. »'],
      topics: [
        T('carte', ['CARTE', 'BN', 'LIVRE', 'PERSUADER', 'CREDIT'], function (api) {
          if (api.flag('carteBN')) { api.npc('gaudry', api.fresh('gaudryOK', ['« Vous avez votre carte. Salle de travail, au fond de la cour. Un bulletin par ouvrage. »', '« Votre carte est en règle. Ne me faites pas regretter mon tampon. »'])); return; }
          var j = api.flag('carteJour');
          if (j !== undefined && j !== false) {
            if (day(api.s.min) >= j) { api.flag('carteBN', true); api.npc('gaudry', '« La lettre de votre consul est arrivée. » Il a l’air déçu. « Voici votre carte. Salle de travail, au fond de la cour. »'); api.take('Une carte de lecteur de la Bibliothèque nationale'); return; }
            api.npc('gaudry', api.fresh('gaudryAtt', ['« Après-demain, ai-je dit. Pas aujourd’hui. »', '« Rien du consulat. Revenez quand ce sera le jour. »'])); return;
          }
          api.npc('gaudry', '« Pour la salle de travail, il faut une carte, et la carte porte l’objet des recherches. Les étrangers joignent une lettre de leur consul. » Il vous détaille. « À moins que vous n’ayez des titres. »');
          api.check('credit_carte');
        }, { chip: 'Demander une carte de lecteur' }),
        T('fenalik', ['FENALIK', 'POISSY', 'HISTOIRE'], ['« Fenalik. Dix-huitième. » Il note le nom sans émotion. « Histoire de la cour, manuscrits, peut-être les papiers militaires. Ce n’est pas un sujet, {m} : c’est une aiguille dans trois meules de foin. »']),
        T('aide', ['TRADUIRE', 'REMI', 'AIDE'], ['« Je ne traduis pas. » Il désigne du menton un grand rouquin qui lit debout près du vestiaire. « Lui, si. Un étudiant. Il attend les lecteurs étrangers comme d’autres attendent l’omnibus. »'], { chip: 'Trouver un traducteur' }),
        T('horaires', ['HEURE'], ['« Neuf heures, cinq heures. Fermé le dimanche et les jours de fête. On ne communique plus d’ouvrages dans la dernière heure. C’est affiché. »'])
      ] }),
    remi: H.npc({ id: 'remi', name: 'Rémi Vangeim, étudiant', short: 'Rémi', patience: 8, cooldown: 20, selfKeys: ['REMI'],
      greet: function (api, first) { api.npc('remi', first ? 'Un grand garçon roux, nerveux, aux lunettes cerclées d’or, le veston lustré aux coudes. « Vous êtes étranger, n’est-ce pas ? Vangeim. Lettres, à la Sorbonne. Je lis le français de tous les siècles, et j’ai un loyer. »' : api.fresh('remiG', ['« On s’y remet ? »', '« {M}. J’ai des idées sur votre comte. »', 'Rémi rajuste ses lunettes.'])); },
      bye: '« À demain, peut-être. Je suis là tous les matins. »',
      deflect: ['« Pardon ? »', '« Je ne vous suis pas, là. »', 'Il fronce le nez, sans comprendre.'],
      topics: [
        T('travail', ['TRADUIRE', 'ARGENT', 'AIDE', 'DONNER', 'COMMANDER'], function (api, n, p) {
          var dit = ' ' + G.RPG.normalize((p && p.raw) || '') + ' ';
          if (api.flag('remiVu') && !aide(api) && /\b(50|cinquante)\b/.test(dit)) { api.topic('remi', 'engager'); return; }
          if (api.flag('remiVu') && !aide(api) && /\b(20|vingt)\b/.test(dit)) { api.topic('remi', 'engager20'); return; }
          if (aide(api)) { api.npc('remi', api.fresh('remiDeja', ['« Je suis payé pour la journée. Au travail. »', '« Vous m’avez déjà réglé aujourd’hui. Allons en salle. »'])); return; }
          api.npc('remi', api.flag('remiVu') ? '« Même tarif qu’hier. Cinquante francs, et je suis à vous jusqu’à la fermeture. »' : '« Je vous le dis franchement : pour vingt francs la journée, je traduis. Pour cinquante, je cherche avec vous, je fais parler les bibliothécaires, et je ne pense à rien d’autre. »');
          api.flag('remiVu', true);
          api.chips([{ label: 'L’engager pour la journée (cinquante francs)', topic: 'engager' }, { label: 'Vingt francs, pour traduire seulement', topic: 'engager20' }]);
        }, { chip: 'Lui proposer du travail', oui: 'engager' }),
        T('engager', [], function (api) {
          if (aide(api)) return;
          if (!api.pay(0.65)) { api.npc('remi', '« Vous n’avez pas cinquante francs sur vous. Changez vos livres, et revenez. »'); return; }
          api.flag('remiJour', day(api.s.min)); api.flag('remiPlein', day(api.s.min));
          api.npc('remi', '« Marché conclu. » Il empoche les billets sans les compter. « Donnez-moi le nom, l’année, et ce que vous savez. Les fiches de la Nationale, je les connais comme mes poches. »');
        }),
        T('engager20', [], function (api) {
          if (aide(api)) return;
          if (!api.pay(0.25)) { api.npc('remi', '« Même vingt francs, il faut les avoir. »'); return; }
          api.flag('remiJour', day(api.s.min));
          api.npc('remi', '« Vingt francs. Bien. » Son sourire se refroidit d’un degré. « Je traduirai ce que vous me mettrez sous le nez. »');
        }),
        T('lui', ['TOIMEME'], ['« Je prépare une thèse sur les pamphlets de 1789. Personne ne la lira. » Il hausse les épaules. « J’écris aussi pour L’Humanité, sous un autre nom. Ça ne paie pas davantage. »'], { chip: 'Lui-même' }),
        T('fenalik', ['FENALIK', 'SCANDALE', 'POISSY', 'HISTOIRE'], function (api, n) {
          if (!api.has('SCANDALE')) { api.npc('remi', '« Fenalik ? Jamais lu ce nom. Ce qui, à la cour de Louis XVI, veut dire deux choses : ou bien il ne comptait pas, ou bien on a tout fait pour qu’on l’oublie. »'); return; }
          api.npc('remi', n === 0 ? '« Un comte, exécuté sans jugement, en 1789 ? » Il rit, sans gaieté. « On ne faisait pas ça. Même à un étranger. Un noble avait droit à ses juges. Si on l’a écrit, c’est qu’on voulait qu’on le croie mort. »' : '« Cherchez ce qu’on a fait de lui, pas ce qu’on en a dit. Les mémoires mentent. Les registres, moins. »');
        }, { chip: 'Le comte Fenalik' }),
        T('charenton', ['CHARENTON', 'DELPLACE', 'RIGAULT'], ['« Charenton ? Sous l’Ancien Régime, c’était commode : on y mettait les fous, et ceux qu’il arrangeait de dire fous. Sade y a fini. » Il essuie ses lunettes. « Les registres existent encore, là-bas. Moi, je n’y mets pas les pieds. »'])
      ] }),
    brevin: H.npc({ id: 'brevin', name: 'Mlle Brévin, à l’Arsenal', short: 'Mlle Brévin', patience: 7, cooldown: 30, selfKeys: ['BREVIN', 'BIBLIOTHECAIRE'],
      greet: function (api, first) { api.npc('brevin', first ? 'Une femme mince en blouse grise, un crayon piqué dans le chignon. « Vous venez de la Nationale ? On nous envoie toujours les cas difficiles. Je suis Mlle Brévin. Que cherchez-vous ? »' : api.fresh('brevinG', ['« Vous revoilà. »', '« Toujours 1789 ? »'])); },
      bye: '« Refermez bien la porte : les courants d’air mangent le papier. »',
      deflect: ['« Je ne vois pas le rapport avec nos fonds. »', 'Elle attend, le crayon levé.', '« Une cote, un nom, une année. Donnez-moi l’un des trois. »'],
      topics: [
        T('malon', ['MALON', 'FENALIK', 'POISSY', 'ARCHIVES'], function (api) {
          if (api.has('MALON')) { api.npc('brevin', '« Vous l’avez lu, ce carnet. Je n’aime pas ce qu’il raconte. Je l’ai rangé plus haut qu’avant. »'); return; }
          api.npc('brevin', '« Malon, capitaine, 1789. Papiers militaires, donc. » Elle réfléchit. « Ils sont là, quelque part, dans les liasses de la Bastille. Installez-vous. Je vous monte les cartons. »');
          api.chips([{ label: 'Chercher le journal du capitaine', action: 'ar_chercher' }]);
        }, { chip: 'Les papiers du capitaine Malon' }),
        T('lieu', ['ARSENAL', 'SALLE'], ['« C’est l’ancien arsenal de Paris. On y fondait des canons ; on y garde des livres. » Un petit sourire. « Les archives de la Bastille sont tombées ici, en 89. Dans la boue des fossés, pour une bonne part. On en sèche encore. »'], { chip: 'L’Arsenal' }),
        T('lui', ['TOIMEME'], ['« Vingt ans que je classe ce que la Révolution a jeté par les fenêtres. On s’attache. »'])
      ] }),
    rogniat: H.npc({ id: 'rogniat', name: 'Mme Rogniat, secrétaire du directeur', short: 'Mme Rogniat', patience: 5, cooldown: 60, selfKeys: ['ROGNIAT', 'SECRETAIRE'],
      greet: function (api, first) {
        if (first) { api.say('Le secrétariat sert d’antichambre au bureau du directeur. Il sent l’encaustique et le phénol. Contre le mur, quatre caisses de bois blanc, ouvertes, à demi pleines de livres.'); api.flag('caissesVues', true); }
        api.npc('rogniat', first ? 'Une femme massive, en noir, dont les yeux ont déjà fait le tour de vous. « Mme Rogniat, secrétariat de la direction. Vous n’êtes pas de la famille d’un pensionnaire. Alors ? »' : api.fresh('rogniatG', ['« Oui ? »', '« C’est à quel sujet, cette fois ? »']));
      },
      bye: '« La sortie est par où vous êtes entré. »',
      deflect: ['« Ce n’est pas une question pour ce bureau. »', 'Elle tape trois mots à la machine, sans répondre.', '« Je ne vois pas en quoi cela vous regarde. »'],
      topics: [
        T('leroux', ['LEROUX', 'PERSUADER', 'CREDIT', 'VISITER'], function (api) {
          var d = day(api.s.min) + 1;
          if (api.flag('lerouxChasse')) { api.npc('rogniat', '« Le docteur a donné des ordres à votre sujet. Bonsoir. »'); return; }
          if (api.flag('lerouxRecu') === d) { antichambre(api); return; }
          if (api.flag('lerouxRefus') === d) { api.npc('rogniat', api.fresh('rogniatNon', ['« Je vous ai répondu ce matin. Demain, peut-être. »', '« Pas aujourd’hui. »'])); return; }
          api.npc('rogniat', '« Le docteur Leroux assure la direction depuis huit jours. Il a autre chose à faire que recevoir des curieux. » Elle vous jauge. « Qui dois-je annoncer ? »');
          api.check('credit_leroux', { diff: api.pc.academic ? 'normal' : 'difficile' });
        }, { chip: 'Demander à voir le directeur' }),
        T('registres', ['REGISTRE', 'FENALIK', 'ARCHIVES', 'HISTOIRE'], function (api) {
          api.npc('rogniat', (api.pc.profession === 'medecin' || api.pc.key === 'pemberton') ? '« Un confrère ? » Son ton change d’un demi-ton. « Les registres anciens sont aux archives, sous les combles. Un médecin peut consulter tout ce qui précède 1900. Je vous fais accompagner. »' : '« Des recherches historiques ? Les registres antérieurs à 1810 sont consultables. Le reste pourrait peiner des familles. Sous les combles, deuxième escalier. »');
          api.flag('registresOuverts', true);
          api.chips([{ label: 'Consulter les registres de 1789', action: 'ch_registres' }]);
        }, { chip: 'Les anciens registres' }),
        T('delplace', ['DELPLACE', 'ELECTROCHOC', 'DECES'], ['« Le docteur Delplace est mort d’un accident. C’est un grand malheur. » Chaque mot est posé comme un tampon. « Le personnel a pour consigne de n’en pas parler, et je suis du personnel. »', '« Je n’ajouterai rien. »'], { chip: 'Le docteur Delplace' }),
        T('caisses', ['CAISSES', 'CAHIER', 'LIVRE'], ['« Les effets du docteur Delplace. Ils partent ce soir chez sa veuve. » Sa main se pose à plat sur le bureau. « On n’y touche pas. »']),
        T('guimart', ['GUIMART', 'PATIENT', 'SOUSSOL'], ['« M. Guimart est souffrant. Il est soigné ici même, et il ne reçoit personne. » Un temps. « Qui vous a donné ce nom ? »'])
      ] }),
    leroux: H.npc({ id: 'leroux', name: 'Le docteur Leroux', short: 'Le docteur Leroux', patience: 4, cooldown: 600, selfKeys: ['LEROUX'],
      greet: function (api, first) { api.npc('leroux', first ? 'Un homme étroit, tiré à quatre épingles, pince-nez et col cassé, debout derrière un bureau qui n’est pas encore le sien. « François Leroux. Vous avez dix minutes, et j’en ai déjà perdu une. »' : '« Encore vous ? Soyez bref. »'); },
      bye: '« Mme Rogniat vous raccompagne. »',
      deflect: ['« Venez-en au fait. »', 'Il consulte sa montre.', '« Je ne vois pas où vous voulez en venir. »'],
      close: ['« Cet entretien est terminé. » Il sonne. Mme Rogniat paraît aussitôt, comme si elle attendait derrière la porte.'],
      topics: [
        T('asile', ['CHARENTON', 'SALLE', 'PATIENT'], ['« Six cents pensionnaires, {m}. Des bains, du repos, du travail aux jardins. Nous ne sommes plus au temps des chaînes. » Il redresse un sous-main. « La maison est ancienne. Elle a besoin d’ordre. J’y veille. »'], { chip: 'La maison de santé' }),
        T('fenalik', ['FENALIK', 'REGISTRE', 'HISTOIRE', 'SOUSSOL'], ['« Un pensionnaire de 1789 ? » Il a un sourire mince. « Vous me demandez des nouvelles d’un homme mort depuis cent trente ans. Voyez les registres, si cela vous amuse. Les caves, elles, sont condamnées, et elles le resteront. »'], { chip: 'Un pensionnaire de 1789' }),
        T('delplace', ['DELPLACE', 'ELECTROCHOC', 'CAHIER', 'DECES'], function (api, n) {
          if (n === 0) { api.npc('leroux', '« Un accident. » Le pince-nez tremble à peine. « Le docteur Delplace expérimentait un appareil électrique. Il était seul, la nuit, contre tout règlement. Je n’ai rien à ajouter, et je vous prie de ne pas insister. »'); return; }
          api.flag('lerouxChasse', true);
          api.npc('leroux', 'Le pince-nez saute. « Vous êtes venu fouiller la mort d’un confrère pour en faire du scandale ! Dehors. Dehors, ou je vous fais sortir par les infirmiers ! »');
          api.npcs('leroux').closedUntil = api.s.min + 100000; api.endTalk(false);
          api.say('Deux hommes en blouse vous raccompagnent jusqu’à la grille. Vous n’entrerez plus dans ce bureau. Il reste ceux qui travaillent ici, et qui sortent le soir.');
        }, { chip: 'La mort du docteur Delplace' }),
        T('guimart', ['GUIMART'], ['« Un infirmier surmené. Il est entre nos mains, ce qui est encore le mieux qui puisse lui arriver. Les visites lui sont interdites, par moi. »'])
      ] }),
    mandrin: H.npc({ id: 'mandrin', name: 'Paul Mandrin, infirmier', short: 'Mandrin', patience: 8, cooldown: 30, selfKeys: ['MANDRIN'],
      greet: function (api, first) { api.npc('mandrin', first ? 'Il vide son premier verre d’un trait. De près, on voit trois griffures fraîches sur sa joue. « Vous n’êtes pas de la police ? Bon. Alors je parle. Mais pas un mot à Leroux : il me faut un certificat pour partir d’ici. »' : api.fresh('mandrinG', ['« Remettez-nous ça, et je continue. »', '« Où j’en étais ? »'])); },
      bye: '« Vous ne m’avez jamais vu. »',
      deflect: ['« Ça, je sais pas. »', 'Il regarde la porte du café.', '« Posez-moi une question à laquelle je peux répondre. »'],
      topics: [
        T('delplace', ['DELPLACE', 'ELECTROCHOC', 'DECES'], function (api, n) {
          api.npc('mandrin', n === 0 ? '« L’accident, c’est sa machine. Une chose à lui, avec des bobines, qu’il réglait lui-même. On l’a trouvé au matin, à côté. Enfin, on… » Il baisse la voix. « Leroux a fait enlever le corps avant que personne le voie. Pour le scandale, il a dit. Personne ne sait au juste de quoi il est mort. »' : '« Et le malade qu’il soignait, cette nuit-là ? Personne n’en parle. Le lit était vide. »');
          if (!api.has('MANDRIN')) api.clue('MANDRIN');
        }, { chip: 'La mort de Delplace' }),
        T('patient', ['PATIENT', 'FENALIK', 'CAHIER'], ['« Depuis l’histoire de Guimart, le patron ne quittait plus son aile privée. Il y gardait quelqu’un. Qui, je sais pas : on n’entrait pas. On montait le bouillon, on le redescendait plein. »'], { chip: 'Le patient de l’aile privée' }),
        T('parole', ['PAROLES', 'DELPLACE'], ['« Le dernier soir, je l’ai croisé dans le couloir. Je lui dis bonsoir. Il me regarde sans me voir, et il dit : “C’est à ma portée, Mandrin. Chacun de nous porte la clé de toute la mémoire de la race. En rêve, nous parlons des langues que nous n’avons jamais sues. Bientôt, j’en aurai la preuve.” » Il se ressert. « Le lendemain, il était mort. »'], { chip: 'Ce que Delplace lui a dit' }),
        T('guimart', ['GUIMART', 'SOUSSOL'], function (api, n) {
          api.npc('mandrin', n === 0 ? '« C’est moi qui l’ai trouvé. En bas, dans les caves, où il n’avait rien à faire. Le poignet droit ouvert jusqu’à l’os, comme serré dans un étau. Il se vidait. » Il montre ses griffures. « On n’a jamais su lequel des malades avait fait ça. Quand Guimart s’est réveillé, il n’avait plus sa tête. Maintenant, c’est un pensionnaire comme les autres. Chambre 13. »' : '« Guimart, c’était pas un tendre. Il descendait souvent, la nuit. Il cherchait ce qui traîne, dans les vieilles caves. Ce coup-là, il a trouvé. »');
        }, { chip: 'Guimart' }),
        T('verre', ['BOISSON', 'BOIRE'], function (api) {
          if (!api.pay(0.05)) { api.npc('mandrin', '« Laissez. C’est moi qui régale, alors. » Il ne bouge pas.'); return; }
          api.npc('mandrin', api.fresh('mandrinVerre', ['« C’est pas de refus. » Le patron apporte une bouteille sans qu’on la lui demande. Mandrin se détend d’un cran.', '« Vous êtes bien honnête. » Il trinque, et regarde moins la porte.', '« Le dernier, alors. J’ai de la route. »']));
          api.calm('mandrin', 2);
        }, { noFollow: true }),
        T('lui', ['TOIMEME'], ['« Sept ans de maison. Ce métier, c’est un démon. Je cherche une place dans une clinique, à Neuilly. Des gens riches et tristes. Ça repose. »'])
      ] })
  };

  // ================================================================ les lieux
  P.locations = {
    gare: { name: 'Gare du Nord', art: 'p_gare',
      enter: function () {},
      things: [{ label: 'les taxis', ids: ['TAXI', 'DESTINATIONS'] }, { label: null, ids: ['SALLE', 'TRAIN', 'VICTORIA'] }],
      ambient: ['Un porteur passe en criant « Attention, les bagages ! »', 'La verrière ruisselle. Les locomotives soupirent comme des bêtes.', 'Un marchand de journaux crie les titres du soir.'],
      actions: [
        { id: 'ga_look', label: 'Regarder la gare', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'TRAIN'], bare: true,
          run: function (api) { api.say(api.fresh('galook', ['Une cathédrale de fer et de verre sale. Des soldats en permission, des bonnes à cabas, des Anglais qui cherchent leurs malles. Dehors, les taxis rouges font la queue sous la pluie.', 'Vous cherchez, sans y penser, un homme à moustache dans la foule. Il n’y en a pas. Il y en a cent.'])); } },
        { id: 'ga_taxi', label: 'Prendre un taxi pour l’hôtel', idea: true, verbs: ['ALLER', 'PRENDRE', 'VISITER', 'COMMANDER'], nouns: ['TAXI', 'HOTEL', 'DESTINATIONS'], bare: true,
          run: function (api) { api.say('« Rue de Richelieu. » Le chauffeur rabat son drapeau. Paris défile, mouillé, jaune et gris : les grands boulevards, des terrasses sous des stores, une colonne Morris couverte d’affiches. Smith vous a parlé cent fois de cette ville. Vous y arrivez sans lui.'); api.time(25); api.go('hotel'); } }
      ] },
    hotel: { name: 'L’hôtel du Cygne, rue de Richelieu', art: 'p_hotel',
      enter: function (api, first) {
        if (first) { api.say('L’hôtel du Cygne : six étages étroits, un ascenseur à grille qui gémit, une odeur de cire et de café. Votre chambre donne sur la rue. De la fenêtre, en se penchant, on aperçoit le mur de la Bibliothèque nationale.'); api.sys('Paris. Smith vous a donné un nom, le comte Fenalik, et une ville. Commencez par où il aurait commencé : les livres.'); return; }
        api.say(api.fresh('hotelR', ['Votre chambre du Cygne, son édredon rouge, sa cuvette de faïence.', 'L’ascenseur à grille gémit jusqu’au troisième. Votre chambre vous attend.', 'M. Blain vous tend votre clé avant que vous l’ayez demandée.']));
      },
      things: [{ label: 'M. Blain, à la réception', ids: ['GERANT', 'RECEPTION', 'QUELQUUN'] }, { label: 'la fenêtre', ids: ['FENETRE'] }, { label: 'les journaux du jour', ids: ['JOURNAL'] }, { label: null, ids: ['SALLE', 'CHAMBRE', 'LAMPE', 'PORTE', 'TABLE', 'HOTEL'] }],
      ambient: ['L’ascenseur gémit dans sa cage.', 'Dans la rue, un tramway grince au tournant.', 'Une odeur de café monte de l’office.'],
      actions: [
        { id: 'ph_look', label: 'Regarder la chambre', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'CHAMBRE'], bare: true,
          run: function (api) { api.say(api.fresh('phlook', ['Un lit de cuivre, un édredon rouge, une table où tiennent vos notes et la liste de Smith. Paris, Venise, Trieste, Belgrade. Vous avez souligné le premier nom deux fois.', 'Le papier peint répète le même bouquet jusqu’au plafond. Sur la table, votre carnet, ouvert à la page « Fenalik ».'])); } },
        { id: 'ph_fenetre', label: 'Regarder par la fenêtre', verbs: ['EXAMINER', 'OUVRIR'], nouns: ['FENETRE'],
          run: function (api) { var h = hour(api.s.min); api.say(h >= 17 || h < 8 ? (api.flag('guetteur') ? 'La rue de Richelieu, luisante. Le réverbère d’en face, son rond de lumière. Personne dessous. Vous vérifiez deux fois.' : 'La rue de Richelieu, luisante. Un réverbère, son rond de lumière sur le trottoir d’en face.') : 'La rue de Richelieu, ses voitures de livraison, ses lecteurs pressés qui serrent une serviette sous le bras.'); } },
        { id: 'ph_gerant', label: 'Parler à M. Blain', ideaAnon: 'Parler au gérant', idea: true, talkTo: 'gerant', verbs: ['PARLER', 'VISITER', 'POLI', 'DONNER', 'FLATTER', 'PERSUADER'], nouns: ['GERANT', 'RECEPTION', 'QUELQUUN'],
          extra: ['BN', 'SMITH', 'CHARENTON', 'FENALIK', 'POISSY', 'DESTINATIONS', 'TAXI', 'VOYAGE', 'TRAIN'], run: function (api, p) { api.talk('gerant', p); } },
        { id: 'ph_journal', label: 'Lire les journaux', idea: true, verbs: ['EXAMINER', 'PRENDRE', 'UTILISER'], nouns: ['JOURNAL'], repeatable: true, time: 15,
          run: function (api) {
            if (!api.flag('journalParis')) { api.flag('journalParis', true); api.say('Le Petit Parisien, Le Matin. ' + ruhr(api) + ' On ne parle que de cela. En page trois, entre un vol de bijoux et un chien écrasé : « À la maison de santé de Charenton, le docteur Leroux prend la direction après la mort accidentelle du docteur Delplace. » Trois lignes.'); api.apprendre(['DELPLACE', 'CHARENTON']); return; }
            api.say(api.fresh('journalP', [day(api.s.min) >= 6 ? 'La Ruhr, toujours la Ruhr. Le franc baisse. Rien qui vous regarde.' : 'La Ruhr, encore : on attend l’ultimatum. Rien qui vous regarde.', 'Un feuilleton, des réclames, le prix du charbon. Vous repliez le journal.']));
          } },
        { id: 'ph_dormir', label: 'Dormir jusqu’au matin', idea: true, ideaCond: function (api) { return hour(api.s.min) >= 15 || hour(api.s.min) < 6; }, verbs: ['DORMIR', 'ATTENDRE'], nouns: ['CHAMBRE', 'HEURE'], bare: true, repeatable: true,
          run: function (api) {
            var h = hour(api.s.min);
            if (h >= 8 && h < 15) {
              api.say(api.fresh('dodoJour', ['Dormir en plein jour, quand il reste tant à lire ? Vous vous allongez dix minutes, sans fermer l’œil.', 'Il fait grand jour, et Paris travaille. Le sommeil ne viendra pas avant ce soir.', 'Vous tirez les rideaux. La rue, derrière, continue son vacarme.']));
              api.chips([{ label: 'Laisser passer la journée', action: 'ph_journee' }]);
              return;
            }
            if (h >= 15 && h < 21) api.say(api.fresh('diner', ['Vous dînez d’un potage et d’une omelette dans la salle à manger de l’hôtel, puis vous montez.', 'Un bouillon, un demi de rouge, le journal du soir. Puis l’escalier, et votre lit.', 'Vous dînez tôt, seul{e} à votre table, et vous montez avant que l’ascenseur ait fini de gémir.']));
            nuitParis(api);
          } },
        { id: 'ph_journee', label: 'Laisser passer la journée', verbs: [], nouns: [], repeatable: true,
          run: function (api) {
            api.say(api.fresh('journee', [
              'Vous vous accordez la journée. Le Louvre, où les gardiens bâillent ; les quais, où les bouquinistes ont rabattu leurs boîtes sous la pluie. Le soir vient vite, en janvier.',
              'Une journée à marcher sans but : les passages couverts, les Halles, un café où l’on joue aux cartes. Paris ne vous demande rien. Le soir, vous rentrez.',
              'Vous écrivez des lettres que vous n’enverrez pas, vous déjeunez longuement, vous regardez la pluie sur la rue de Richelieu. Puis la nuit tombe.']));
            nuitParis(api);
          } }
      ] },
    bn: { name: 'La Bibliothèque nationale', art: 'p_bn',
      enter: function (api, first) {
        if (first) api.say('Une cour pavée, une grille, un concierge à médailles. Puis, au fond, la salle de travail : trois cent quarante places sous neuf coupoles de faïence bleue, portées par des colonnes de fonte minces comme des tiges. On n’entend que des pages, des plumes, et la pluie sur les verrières. À l’entrée, le guichet du secrétariat.');
        else api.say(api.fresh('bnR', ['La salle de travail, ses coupoles bleues, son silence d’aquarium.', 'La Nationale. Le concierge à médailles vous reconnaît et ne vous salue pas.']));
      },
      things: [{ label: 'le secrétariat', ids: ['SECRETAIRE', 'GAUDRY', 'QUELQUUN'] }, { label: 'un étudiant roux, près du vestiaire', ids: ['REMI', 'QUELQUUN'] }, { label: 'les catalogues', ids: ['LIVRE', 'BN', 'ARCHIVES'] }, { label: 'les journaux récents', ids: ['PERIODIQUES', 'JOURNAL'] }, { label: null, ids: ['SALLE', 'TABLE', 'LAMPE', 'PORTE'] }],
      ambient: ['Un lecteur tousse ; dix têtes se lèvent.', 'Un garçon de salle pousse un chariot de volumes, sur des roues de caoutchouc.', 'La pluie crépite sur les coupoles.'],
      actions: [
        { id: 'bn_look', label: 'Regarder la salle de travail', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE', 'BN'], bare: true,
          run: function (api) { api.say(api.fresh('bnlook', ['Des savants à barbe, des abbés, deux Américaines en chapeau cloche, un vieil homme qui dort sur un atlas. Aux murs, des paysages peints entre les rayonnages, comme des fenêtres sur un parc qui n’existe pas.', 'Dix mille volumes à portée de main, et des millions derrière les murs. Ce que vous cherchez tient en trois lignes, quelque part là-dedans.'])); } },
        { id: 'bn_gaudry', label: 'S’adresser au secrétariat', idea: true, talkTo: 'gaudry', verbs: ['PARLER', 'VISITER', 'POLI', 'PERSUADER', 'DONNER', 'COMMANDER'], nouns: ['GAUDRY', 'SECRETAIRE', 'CARTE'],
          extra: ['BN', 'FENALIK', 'TRADUIRE', 'REMI', 'HEURE', 'LIVRE'], run: function (api, p) { api.talk('gaudry', p); } },
        { id: 'bn_remi', label: 'Parler à l’étudiant roux', idea: true, talkTo: 'remi', verbs: ['PARLER', 'VISITER', 'POLI', 'DONNER', 'COMMANDER', 'PERSUADER'], nouns: ['REMI'],
          extra: ['TRADUIRE', 'ARGENT', 'FENALIK', 'CHARENTON', 'AIDE'], run: function (api, p) { api.talk('remi', p); } },
        { id: 'bn_chercher', label: 'Chercher le comte Fenalik', idea: true, verbs: ['FOUILLER', 'EXAMINER', 'UTILISER', 'PRENDRE'], nouns: ['FENALIK', 'LIVRE', 'ARCHIVES', 'HISTOIRE', 'SCANDALE'], bare: true, repeatable: true,
          run: function (api) {
            if (!salleBN(api)) return;
            var plein = api.flag('remiPlein') === day(api.s.min);
            api.say(aide(api) ? (plein
              ? api.fresh('rechRemi', ['Rémi remplit les bulletins plus vite que vous ne les lisez. Il plaisante à voix basse avec un bibliothécaire, revient avec une cote que personne ne vous aurait donnée.', 'Rémi disparaît vers les catalogues, reparaît, griffonne. « Essayons les manuscrits français. Série des journaux privés. »', '« Encore une idée. » Rémi est déjà debout, un bulletin entre les dents.'])
              : api.fresh('rechRemi20', ['Rémi traduit ce que vous lui tendez, d’une voix égale, en regardant l’horloge.', 'Rémi lit, traduit, s’arrête. Vingt francs n’achètent pas la curiosité.']))
              : api.fresh('rechSeul', ['Vous remplissez vos bulletins : un nom, une année, un numéro de place. Puis vous attendez qu’on vous apporte le passé.', 'Encore des bulletins, encore l’attente. Le garçon de salle vous connaît, maintenant.', 'Vous reprenez les catalogues là où vous les aviez laissés.']));
            etude(api, plein ? 120 : 180);
            api.check('bn_recherche', { diff: difficulte(api) });
          } },
        { id: 'bn_journaux', label: 'Dépouiller les journaux récents', idea: true, ideaCond: function (api) { return (api.has('RIGAULT') || api.flag('journalParis')) && !api.has('DELPLACE'); }, verbs: ['FOUILLER', 'EXAMINER', 'PRENDRE'], nouns: ['PERIODIQUES', 'JOURNAL', 'DELPLACE', 'CHARENTON'], repeatable: true,
          run: function (api) {
            if (api.has('DELPLACE')) { api.say(api.fresh('delpDeja', ['Vous avez déjà recopié l’avis de décès du docteur Delplace. Les journaux n’en disent pas plus.', 'Les journaux n’ont rien ajouté sur Charenton depuis l’avis de décès.'])); return; }
            if (!salleBN(api)) return;
            api.say(api.fresh('rechJournaux', ['On vous apporte les quotidiens du mois, reliés par semaine, lourds comme des dalles.', 'Les journaux, encore. Vous reprenez à la date où vous vous étiez arrêté.']));
            etude(api, 90); api.check('bn_journaux', { diff: difficulte(api) });
          } },
        { id: 'bn_villa', label: 'Chercher la maison de Poissy', sait: ['POISSY'], idea: true, ideaCond: function (api) { return api.has('MALON') && !api.has('VILLA'); }, verbs: ['FOUILLER', 'EXAMINER', 'PRENDRE'], nouns: ['VILLA', 'POISSY'], repeatable: true,
          run: function (api) {
            if (api.has('VILLA')) { api.say(api.fresh('villaDeja', ['Vous avez vu les plans, et la gravure. Une fois suffit.', 'Non. Vous ne redemanderez pas ce carton.'])); return; }
            if (!salleBN(api)) return;
            api.say(api.fresh('rechVilla', ['Les fonds d’architecture : des cartons à dessin grands comme des portes, qu’on vous pose sur un pupitre incliné.', 'Vous redemandez les cartons d’architecture, série des demeures d’Île-de-France.']));
            etude(api, 150); api.check('bn_villa', { diff: difficulte(api) });
          } }
      ] },
    arsenal: { name: 'La bibliothèque de l’Arsenal', art: 'p_arsenal',
      enter: function (api, first) {
        if (first) api.say('Près de la Bastille, un long bâtiment bas, des salons lambrissés du temps des rois où l’on a poussé des tables et des lampes vertes. Il y fait froid comme dans une église. Une femme en blouse grise range des liasses nouées de sangles.');
        else api.say(api.fresh('arR', ['L’Arsenal, ses lambris, son froid de sacristie.', 'Mlle Brévin lève les yeux de ses liasses.']));
      },
      things: [{ label: 'Mlle Brévin', ids: ['BREVIN', 'BIBLIOTHECAIRE', 'QUELQUUN'] }, { label: 'les liasses', ids: ['ARCHIVES', 'LIVRE', 'MALON'] }, { label: null, ids: ['SALLE', 'TABLE', 'LAMPE', 'PORTE', 'ARSENAL'] }],
      ambient: ['Un poêle de faïence tiédit à peine l’air.', 'Quelqu’un marche à l’étage ; le parquet répond.', 'Mlle Brévin taille un crayon au canif.'],
      actions: [
        { id: 'ar_look', label: 'Regarder la salle', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE', 'ARSENAL'], bare: true,
          run: function (api) { api.say('Des boiseries dorées qui s’écaillent, des portraits de grands maîtres de l’artillerie, et partout des cartons étiquetés à la plume : « Bastille », « Lettres de cachet », « Prisonniers ». Trois lecteurs, emmitouflés.'); } },
        { id: 'ar_brevin', label: 'Parler à Mlle Brévin', ideaAnon: 'Parler à la bibliothécaire', idea: true, talkTo: 'brevin', verbs: ['PARLER', 'VISITER', 'POLI', 'PERSUADER', 'COMMANDER', 'FLATTER'], nouns: ['BREVIN', 'BIBLIOTHECAIRE', 'QUELQUUN'],
          extra: ['MALON', 'FENALIK', 'POISSY', 'ARSENAL', 'ARCHIVES'], run: function (api, p) { api.talk('brevin', p); } },
        { id: 'ar_chercher', label: 'Chercher le journal du capitaine Malon', idea: true, verbs: ['FOUILLER', 'EXAMINER', 'PRENDRE', 'UTILISER'], nouns: ['MALON', 'ARCHIVES', 'LIVRE', 'FENALIK'], bare: true, repeatable: true,
          run: function (api) {
            if (api.has('MALON')) { api.say('Vous avez lu le carnet du capitaine. Vous n’avez aucune envie de le rouvrir.'); return; }
            if (hour(api.s.min) >= 15) { api.say(api.fresh('arTard', ['« Nous fermons à quatre heures, et je ne monte plus de cartons après trois. » Mlle Brévin est désolée, mais ferme.', '« Après trois heures, plus de cartons. Demain, dès dix heures, si vous voulez. »'])); return; }
            api.say(api.fresh('arRech', ['Mlle Brévin pose devant vous trois cartons noués de sangles. « Régiments du Roi, 1788 à 1790. Bon courage. »', 'D’autres cartons, d’autres sangles. La poussière vous fait éternuer.', 'Vous dénouez, vous feuilletez, vous renouez.']));
            etude(api, 120); api.check('ar_recherche', { diff: difficulte(api) });
          } }
      ] },
    charenton: { name: 'Charenton, la maison de santé', art: 'p_asile',
      enter: function (api, first) {
        if (first) api.say('Au bout de la ligne, après les entrepôts de Bercy, la maison de santé s’étage sur son coteau : de longues galeries à l’italienne, des toits de tuiles, des arcades où des hommes en capote grise marchent en rond. De loin, on dirait un couvent ou une villégiature. De près, les fenêtres ont des barreaux peints en blanc. Un portier vous indique le secrétariat de la direction.');
        else api.say(api.fresh('chR', ['Charenton. Les arcades, les capotes grises, les barreaux blancs.', 'Le portier de Charenton vous laisse passer avec un hochement de tête.']));
        if (hour(api.s.min) >= 17 && api.flag('lerouxChasse') && !api.flag('mandrinVu')) api.say('C’est l’heure de la relève. Des infirmiers sortent par petits groupes, le col relevé, vers la gare.');
      },
      things: [{ label: 'le secrétariat de la direction', ids: ['SECRETAIRE', 'ROGNIAT', 'QUELQUUN'] }, { label: 'les arcades', ids: ['SALLE', 'PATIENT'] }, { label: 'la grille', ids: ['PORTE', 'MANDRIN'] }, { label: null, ids: ['CHARENTON', 'LAMPE', 'FENETRE', 'SOUSSOL', 'REGISTRE', 'CAISSES', 'CAHIER', 'LEROUX', 'GUIMART', 'DELPLACE'] }],
      ambient: ['Quelque part, quelqu’un chante, toujours la même phrase.', 'Un infirmier traverse la cour avec un trousseau de clés.', 'Une cloche sonne l’heure du bouillon.'],
      actions: [
        { id: 'ch_look', label: 'Observer la maison de santé', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE', 'CHARENTON', 'PATIENT'], bare: true,
          run: function (api) { api.say(api.fresh('chlook', ['Sous les arcades, un vieil homme vous salue avec une grande politesse, puis salue la colonne d’à côté. Les infirmiers ne se parlent pas entre eux : depuis huit jours, tout le monde ici surveille tout le monde.', 'Les bâtiments neufs sont posés sur de très vieux murs. Le long du coteau, des soupiraux murés, à ras de terre.'])); } },
        { id: 'ch_rogniat', label: 'S’adresser au secrétariat', idea: true, talkTo: 'rogniat', verbs: ['PARLER', 'VISITER', 'POLI', 'PERSUADER', 'COMMANDER'], nouns: ['ROGNIAT', 'SECRETAIRE', 'LEROUX'],
          extra: ['REGISTRE', 'FENALIK', 'DELPLACE', 'GUIMART', 'CAISSES', 'CAHIER', 'PATIENT', 'ARCHIVES'], run: function (api, p) { api.talk('rogniat', p); } },
        { id: 'ch_registres', label: 'Consulter les registres de 1789', idea: true, ideaCond: function (api) { return !!api.flag('registresOuverts') && !api.has('REGISTRE'); }, verbs: ['FOUILLER', 'EXAMINER', 'PRENDRE'], nouns: ['REGISTRE', 'ARCHIVES'], repeatable: true,
          run: function (api) {
            if (!api.flag('registresOuverts')) { api.say('Les archives sont sous les combles, derrière une porte fermée. Il faut passer par le secrétariat.'); return; }
            if (api.has('REGISTRE')) { api.say('Vous avez vu la ligne de 1789, et le blanc qui la suit.'); return; }
            api.say(api.fresh('regRech', ['Sous les combles, des rayonnages de registres reliés en parchemin, de 1641 à nos jours. Un infirmier vous installe à une table et reste près de la porte.', 'Vous remontez sous les combles. L’infirmier de garde reprend sa place près de la porte, et son journal.']));
            etude(api, 90); api.check('ch_registres', { diff: difficulte(api) });
          } },
        { id: 'ch_caisses', label: 'Regarder les caisses du secrétariat', idea: true, ideaCond: function (api) { return !api.flag('cahierVu'); }, verbs: ['EXAMINER', 'FOUILLER'], nouns: ['CAISSES', 'CAHIER'], repeatable: true,
          cond: function (api) { return !!api.flag('caissesVues') && !api.item(CAHIER) && !api.flag('cahierRate'); },
          run: function (api) {
            var ferme = P.disponible(api, 'rogniat');
            if (ferme) { api.say(ferme); return; }
            if (api.flag('lerouxChasse')) { api.say('Après la scène du directeur, vous ne passerez plus la porte du secrétariat.'); return; }
            if (api.flag('cahierVu')) { api.say('Le cahier bleu est toujours là, entre deux traités, sous l’œil de Mme Rogniat.'); api.chips([{ label: 'Prendre le cahier bleu', action: 'ch_cahier' }]); return; }
            if ((api.flag('caissesN') || 0) >= 2) { api.say('Un registre est posé à plat sur la caisse ouverte. Mme Rogniat y veille.'); return; }
            api.endTalk(false);
            api.say(api.fresh('caissesLook', ['Vous laissez traîner votre regard vers les caisses, comme on regarde l’heure.', 'Un pas de côté, l’air de chercher votre chapeau. Les caisses sont à un mètre.']));
            api.check('toc_caisses');
          } },
        { id: 'ch_cahier', label: 'Prendre le cahier bleu', verbs: ['PRENDRE', 'BARATIN'], nouns: ['CAHIER', 'CAISSES'], needVerb: true,
          cond: function (api) { return !!api.flag('cahierVu') && !api.item(CAHIER) && !api.flag('cahierRate') && !api.flag('lerouxChasse'); },
          run: function (api) {
            var ferme = P.disponible(api, 'rogniat');
            if (ferme) { api.say(ferme); return; }
            api.endTalk(false); api.say('Mme Rogniat ne quitte pas les caisses des yeux. Il faudrait qu’elle regarde ailleurs, ne serait-ce qu’un instant.'); api.check('baratin_rogniat');
          } },
        { id: 'ch_guetter', label: 'Attendre la sortie des infirmiers', idea: true, ideaCond: function (api) { return (api.flag('lerouxChasse') || api.flag('cahierRate') || api.has('DELPLACE')) && !api.flag('mandrinVu'); }, verbs: ['ATTENDRE', 'SUIVRE', 'EXAMINER', 'PARLER'], nouns: ['MANDRIN', 'PORTE', 'QUELQUUN'], needVerb: true, repeatable: true,
          run: function (api) {
            if (api.flag('mandrinVu')) { api.say('Mandrin vous a dit ce qu’il savait. Les autres pressent le pas en vous voyant.'); return; }
            if (hour(api.s.min) < 17) { api.say('Vous faites les cent pas devant la grille jusqu’à la relève du soir.'); api.s.min = day(api.s.min) * D + 17 * 60 + 40; api.s.tick = 0; }
            api.say('Ils sortent par deux ou trois, sans se parler. Vous en abordez un, puis un autre : « Rien à dire. » « Voyez la direction. » Un troisième vous désigne du menton, sans s’arrêter, un homme seul qui file vers la gare : la trentaine, rondouillard, l’air d’un qui a mal dormi.');
            api.say('Il sursaute quand vous l’appelez. Mais il s’arrête. Le prix d’un taxi pour rentrer, et une bouteille au café du coin : il n’en demande pas plus.');
            api.flag('mandrinVu', true); api.pay(0.15); api.time(15);
            api.go('cafe'); api.talk('mandrin');
          } },
        { id: 'ch_guimart', label: 'Demander à voir Guimart', verbs: ['PARLER', 'VISITER', 'EXAMINER'], nouns: ['GUIMART'],
          run: function (api) { api.say('Chambre 13, quartier des agités. Aucun infirmier ne vous y mènera : les visites sont interdites par le directeur, et personne ici n’a envie de lui déplaire cette semaine.'); } },
        { id: 'ch_interner', label: 'Se faire interner', verbs: ['INTERNER'], nouns: ['INTERNER', 'CHARENTON'], bare: true,
          run: function (api) { api.say('Entrer ici comme malade, pour approcher Guimart ? L’idée vous traverse. Puis vous regardez les barreaux blancs, et les hommes qui tournent sous les arcades. On entre facilement à Charenton. Vous n’êtes pas sûr{e} de savoir comment on en sort.'); } }
      ] },
    cafe: { name: 'Un café, près de la gare de Charenton', art: 'p_cafe',
      enter: function (api, first) { if (first) api.say('Un zinc, quatre tables de marbre, un poêle. Le patron essuie des verres sans vous regarder. Mandrin choisit la table du fond, dos au mur, face à la porte.'); },
      things: [{ label: 'Mandrin', ids: ['MANDRIN', 'QUELQUUN'] }, { label: null, ids: ['SALLE', 'TABLE', 'BOISSON', 'PORTE', 'LAMPE'] }],
      ambient: ['Le poêle ronfle.', 'Un train de banlieue fait trembler les verres.', 'Le patron remonte le gaz d’un cran.'],
      actions: [
        { id: 'cf_mandrin', label: 'Écouter Mandrin', idea: true, talkTo: 'mandrin', verbs: ['PARLER', 'ECOUTER', 'DONNER', 'COMMANDER', 'PERSUADER', 'POLI'], nouns: ['MANDRIN', 'QUELQUUN'],
          extra: ['DELPLACE', 'GUIMART', 'PATIENT', 'LEROUX', 'ELECTROCHOC', 'SOUSSOL', 'FENALIK'], run: function (api, p) { api.talk('mandrin', p); } },
        { id: 'cf_look', label: 'Regarder le café', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE'], bare: true,
          run: function (api) { api.say('Deux cheminots au comptoir, une affiche de Byrrh, un chat sur le poêle. Personne ne vous écoute. Mandrin, lui, surveille la porte.'); } },
        { id: 'cf_boire', label: 'Commander à boire', verbs: ['COMMANDER', 'BOIRE'], nouns: ['BOISSON'], bare: true, repeatable: true,
          run: function (api) { api.pay(0.05); api.say(api.fresh('cfboire', ['Un rouge honnête, dans des verres épais. Mandrin se détend d’un cran.', 'Le patron apporte une seconde bouteille sans qu’on la lui demande.'])); api.calm('mandrin', 2); } }
      ] }
  };

  // ================================================================ actions communes
  P.globalActions = [goP('hotel'), goP('bn'), goP('arsenal'), goP('charenton'), goP('poissy'), goP('lyon'),
    { id: 'p_ici', label: 'Rester ici', verbs: ['ALLER', 'VISITER'], nouns: Object.keys(PL).map(function (k) { return PL[k].concept; }), boost: -0.2, repeatable: true,
      run: function (api, p) { var here = PL[api.s.loc]; if (here && p && p.c[here.concept] !== undefined) { api.say(api.fresh('iciP', ['Vous y êtes déjà.', 'C’est ici même.'])); return; } api.say(P.generic.verbs.ALLER(api)); } },
    { id: 'p_lieux', label: 'Où aller ?', verbs: ['ALLER', 'EXAMINER', 'PRENDRE', 'COMMANDER'], nouns: ['DESTINATIONS', 'TAXI'], repeatable: true,
      cond: function (api) { return api.s.loc !== 'gare' && !ailleurs(api); },
      run: function (api) { var c = destChips(api); if (!c.length) { api.say('Vous ne connaissez encore aucune autre adresse à Paris.'); return; } api.say('Vous pouvez vous rendre à : ' + c.map(function (x) { return x.label.replace('Aller : ', ''); }).join(', ') + '.'); api.chips(c); } },
    { id: 'p_notes', label: 'Relire vos notes', obj: 'vos notes', verbs: ['EXAMINER', 'ATTENDRE'], nouns: ['PISTE', 'NOTE'], repeatable: true,
      run: function (api) {
        var s = [];
        if (!api.flag('carteBN')) s.push('Obtenir une carte de lecteur à la Bibliothèque nationale.');
        else if (!api.has('RIGAULT')) s.push('Suivre le comte Fenalik dans les collections de la Nationale.');
        if (connu(api, 'arsenal') && !api.has('MALON')) s.push('Lire les papiers du capitaine Malon, à l’Arsenal.');
        if (connu(api, 'charenton') && !api.has('REGISTRE')) s.push('Voir, à Charenton, ce que disent les registres de 1789.');
        if (api.has('DELPLACE') && !api.has('CAHIER') && !api.has('MANDRIN')) s.push('Comprendre de quoi est mort le docteur Delplace.');
        if (P.notesPoissy) s = s.concat(P.notesPoissy(api));
        else if (api.has('MALON')) s.push('Poissy : la maison du comte, et ce qu’il y a dessous.');
        api.say(s.length ? 'Vous relisez votre carnet. ' + s.join(' ') : 'Vous relisez votre carnet. Tout y est. Il ne reste qu’à partir.');
      } }
  ];
  (L.globalActions || []).forEach(function (a) { if (a.id === 'g_etat') P.globalActions.push(a); });

  // ================================================================ réponses générales, horaires, humeur
  P.generic = Object.assign({}, L.generic, {
    loop: ['Vous tournez en rond. Le monde, lui, continue sans vous.', 'Il y a sûrement autre chose à tenter.', 'Il faudrait changer d’approche.'],
    lost: ['Vous hésitez. Fenalik, la Nationale, les vieux papiers : par quel bout reprendre ?', 'Vous consultez votre carnet. Le fil est là, quelque part entre deux pages.'],
    verbs: Object.assign({}, L.generic.verbs, {
      ALLER: function (api) { if (ailleurs(api) && P.allerAilleurs) return P.allerAilleurs(api); var c = destChips(api); return c.length ? 'Pour aller où ? Vous connaissez : ' + c.map(function (x) { return x.label.replace('Aller : ', ''); }).join(', ') + '.' : 'Vous ne connaissez pas encore d’autre adresse à Paris.'; }
    })
  });
  var DISPO = {
    gaudry: { h: [9, 17], x: 'Le guichet du secrétariat est fermé, son store de bois baissé.' },
    remi: { h: [9, 17], x: 'L’étudiant roux n’est pas là. Il ne vient que lorsque la salle est ouverte.' },
    rogniat: { h: [9, 18], x: 'Le secrétariat de la direction est fermé. Une lampe brûle encore à l’étage, mais personne ne répond.' },
    leroux: { h: [9, 18], x: 'Le directeur ne reçoit plus à cette heure.' },
    brevin: { h: [10, 16], x: 'Mlle Brévin a rangé ses crayons : l’Arsenal ferme.' }
  };
  P.dispo = DISPO;
  P.disponible = function (api, id) {
    var d = DISPO[id]; if (!d || (P.pnjIci && P.pnjIci(api, id))) return null;
    if (d.f) return d.f(api);
    var h = hour(api.s.min);
    if (jour(api) === 'dimanche' && /^(gaudry|remi|brevin)$/.test(id)) return 'Un dimanche ? La maison est fermée.';
    return (h < d.h[0] || h >= d.h[1]) ? d.x : null;
  };
  P.boutiquesOuvertes = function (api) { var h = hour(api.s.min); return h >= 8 && h < 20 && jour(api) !== 'dimanche'; };
  P.humeur = {
    cd: { bz: 120, ins: 360 },
    plainte: function (api, id) { var p = api.flag('plainte') || { n: 0 }; p.n++; p.qui = id; p.depuis = api.s.min; p.traitee = false; api.flag('plainte', p); },
    arreter: function (api, id) {
      var n = (api.flag('arrestations') || 0) + 1; api.flag('arrestations', n);
      api.endTalk(false);
      api.vue('situations/02_poste-de-la-rue-de-la-banque', 'Le poste de la rue de la Banque');
      if (api.flag('fugitif')) { api.say('Au poste de la rue de la Banque, on relève votre nom. Une heure plus tard, un inspecteur de la Sûreté pose devant vous un télégramme de Scotland Yard, avec votre signalement. « Londres vous réclame, ' + (api.pc.sex === 'f' ? 'madame' : 'monsieur') + '. »'); api.flag('fin', 'extrade'); api.end(); return; }
      if (n >= 3) { api.say('Le commissaire ne lève même plus les yeux. « Encore lui. Le dépôt, puis le juge. »'); api.flag('fin', 'prison'); api.end(); return; }
      api.say(n === 1 ? 'Deux agents à pèlerine vous prennent chacun par un coude. La nuit au poste de la rue de la Banque, sur un bat-flanc, entre un camelot et un ivrogne qui récite du Racine. Au matin, un commissaire fatigué vous rend vos papiers. « Vous êtes étranger. Je veux bien croire à un malentendu. Une fois. »' : 'Le même poste, le même bat-flanc. Cette fois, on relève votre identité, et l’amende est de cent francs. « La prochaine fois, c’est le dépôt. »');
      api.s.min = (day(api.s.min) + 1) * D + 9 * 60; api.s.tick = 0;
      if (n > 1) api.pay(Math.min(1.3, api.s.money));
      if (id && P.npcs[id]) api.npcs(id).closedUntil = api.s.min + 100000;
      api.go('hotel');
    }
  };
  var VIOLENCE = /\b(tue[rsz]?|abat\w*|frappe[rsz]?|cogne[rsz]?|etrangl\w*|poignard\w*|egorg\w*|assomm\w*|gifl\w*|tabass\w*|coups? de (poing|pied|tete|couteau)|tire[rsz]? sur|agress\w*|bouscul\w*|empoign\w*|saute[rsz]? (dessus|a la gorge))\b/;
  P.intercept = function (api, p, raw) {
    if (G.RPG.recit(raw) || raw.indexOf('?') >= 0) return false;
    var t = ' ' + G.RPG.normalize(raw) + ' ';
    if (!VIOLENCE.test(' ' + t.trim().split(/\s+/).slice(0, 6).join(' ') + ' ') || /\b(porte|fenetre|mur|table|vitre)\b/.test(t)) return false;
    var qui = api.s.talk;
    if (!qui) return false;
    api.say('Votre geste part avant votre pensée. ' + (P.npcs[qui].short || 'On') + ' crie. ' + (/^oe_/.test(api.s.loc) ? 'Dans un train, tout un wagon se lève d’un coup.' : /^po_/.test(api.s.loc) ? 'À Poissy, on accourt moins vite qu’à Paris, mais on accourt.' : 'À Paris, on crie vite, et l’on accourt plus vite encore.'));
    api.lose(1);
    P.humeur.arreter(api, qui);
    return true;
  };

  // ce que Londres a laissé (porté par l'investigateur d'un chapitre à l'autre : pc.passe.londres)
  function passe(api) { return ((api.pc && api.pc.passe) || {}).londres || null; }
  function dateLongue(min) { var d = day(min), wd = JOURS[(4 + d) % 7]; return wd.charAt(0).toUpperCase() + wd.slice(1) + ' ' + (5 + d) + ' janvier 1923'; }
  // les drapeaux de Londres qui comptent pour la suite (le moteur ne transmet que ceux-là)
  L.memoire = ['discours', 'demasque', 'cheapsideFini', 'stanleySauve', 'maquetteDetruite', 'seanceFaite', 'fin', 'arrestations'];
  // ---------------------------------------------------------------- le registre des savoirs (voir londres.js)
  var co = function (id) { return function (api) { return !!api.flag('connu:' + id); }; };
  P.savoirs = {
    POISSY: { label: 'Poissy, la maison du comte', par: ['COUR', 'MALON', 'ACTES', 'LEGENDE', 'VILLA'], quand: co('po_gare'), mots: /poissy/, concepts: ['POISSY'] },
    MALONNOM: { label: 'Le capitaine Malon', par: ['MALON'], quand: co('arsenal'), mots: /malon/, concepts: ['MALON'] },
    CHARENTON: { label: 'Charenton', par: ['RIGAULT', 'REGISTRE', 'DELPLACE', 'CAHIER', 'MANDRIN'], quand: co('charenton'), mots: /charenton/, sourds: ['charenton'] },
    DELPLACE: { label: 'La mort du docteur Delplace', par: ['CAHIER', 'MANDRIN'], mots: /delplace/, concepts: ['DELPLACE'] },
    GUIMART: { label: 'L’infirmier Guimart', par: ['CAHIER', 'MANDRIN'], mots: /guimart/, concepts: ['GUIMART'] },
    LORIEN: { label: 'Les Lorien', par: ['ACTES'], quand: co('lorien'), mots: /lorien/, sourds: ['lorien', 'veronique', 'quitterie'] },
    ROSERAIE: { label: 'Le clos de la Roseraie', par: ['ACTES', 'LEGENDE'], mots: /roseraie|clos du diable/ },
    WELLINGTON: { label: 'Edgar Wellington', par: ['LETTRE'], mots: /wellington|rue saint etienne/ },
    CAVOLLARO: { label: 'La Cavollaro', par: ['CATERINA'], mots: /cavollaro/, sourds: ['cavollaro', 'caterina'] },
    CELLULES: { label: 'Les cellules sous la maison', par: ['BRAS', 'MALON'], mots: /squelettes|instruments de supplice|couloir de cellules/ }
  };
  P.declarations = {
    'gerant/bn': 'libre', 'gerant/smith': 'libre', 'gerant/lieux': 'libre', 'gerant/charenton': ['CHARENTON'], 'gerant/fenalik': 'libre', 'gerant/train': 'libre',
    'gaudry/carte': 'libre', 'gaudry/fenalik': 'libre', 'gaudry/aide': 'libre', 'gaudry/horaires': 'libre',
    'remi/travail': 'libre', 'remi/engager': 'libre', 'remi/engager20': 'libre', 'remi/lui': 'libre', 'remi/fenalik': 'libre', 'remi/charenton': ['CHARENTON'],
    'brevin/malon': ['MALONNOM'], 'brevin/lieu': 'libre', 'brevin/lui': 'libre',
    'rogniat/leroux': 'libre', 'rogniat/registres': 'libre', 'rogniat/delplace': 'libre', 'rogniat/caisses': 'libre', 'rogniat/guimart': ['GUIMART'],
    'leroux/asile': 'libre', 'leroux/fenalik': ['RIGAULT|REGISTRE|CAHIER'], 'leroux/delplace': ['DELPLACE'], 'leroux/guimart': ['GUIMART'],
    'mandrin/delplace': ['DELPLACE'], 'mandrin/patient': { sait: ['DELPLACE'], apprend: ['GUIMART'] }, 'mandrin/parole': ['DELPLACE'], 'mandrin/guimart': ['GUIMART'],
    'mandrin/verre': 'libre', 'mandrin/lui': 'libre',
    'fauvel/actes': 'libre', 'fauvel/lorien': 'libre', 'fauvel/poissy': 'libre', 'fauvel/heures': 'libre', 'fauvel/lui': 'libre',
    'thibierge/fonts': 'libre', 'thibierge/comte': 'libre', 'thibierge/lorien': ['LORIEN'], 'thibierge/morts': ['CELLULES'], 'thibierge/lui': 'libre',
    'arnoult/chambre': 'libre', 'arnoult/lorien': ['LORIEN'], 'arnoult/comte': 'libre', 'arnoult/outils': 'libre', 'arnoult/lui': 'libre',
    'lorien/histoire': 'libre', 'lorien/cicatrice': 'libre', 'lorien/veronique': 'libre', 'lorien/quitterie': 'libre', 'lorien/roses': 'libre',
    'lorien/fouille': 'libre', 'lorien/soins': 'libre', 'lorien/lui': 'libre',
    'veronique/opera': 'libre', 'veronique/histoire': 'libre', 'veronique/bras': 'libre', 'veronique/lui': 'libre',
    'quitterie/monsieur': 'libre', 'quitterie/bras': 'libre', 'quitterie/jeu': 'libre', 'quitterie/lui': 'libre',
    'pruvost/travail': 'libre',
    'caterina/milan': 'libre', 'caterina/aida': 'libre', 'caterina/paris': 'libre', 'caterina/lui': 'libre', 'caterina/voyage': 'libre',
    'bertin/horaire': 'libre', 'bertin/fourgon': 'libre',
    'lieu:charenton': { apprend: ['CHARENTON'] }, 'lieu:arsenal': { apprend: ['MALONNOM'] }, 'lieu:po_lorien': { apprend: ['LORIEN', 'POISSY'] },
    'lieu:po_gare': { apprend: ['POISSY'] }, 'lieu:po_ville': { apprend: ['POISSY'] }, 'pnj:caterina': { apprend: ['CAVOLLARO'] }, 'pnj:lorien': { apprend: ['LORIEN'] }
  };

  P.intro = function (api) {
    var pa = passe(api), f = (pa && pa.drapeaux) || {}, a = function (id) { return !!pa && (pa.indices || []).indexOf(id) >= 0; };
    // Victoria, Douvres, le ferry, Calais, la gare du Nord : sept heures quarante de voyage
    if (pa && typeof pa.min === 'number') { api.s.min = pa.min + 460; api.s.tick = 0; }
    if (f.fin === 'fugitif') api.flag('fugitif', true);
    var h = hour(api.s.min), nuitTombee = h >= 21 || h < 6;
    api.title('L’Express de minuit', 'Paris · Le comte oublié');
    api.say(dateLongue(api.s.min) + '. Le train de Calais entre en gare du Nord' + (nuitTombee ? ' en pleine nuit, sous une pluie froide.' : h < 12 ? ' au petit matin, sous une pluie fine.' : ', sous une pluie qui a remplacé le brouillard de Londres sans rien y gagner.'));
    var listeDe;
    if (f.demasque) listeDe = 'une feuille roussie, ramassée dans les cendres d’un lit, à Cheapside, à deux pas du corps de Beddows, et couverte de l’écriture pointue de Smith';
    else if (a('VISAGE') || a('BRULURES') || a('SEUL') || a('BEDDOWS')) listeDe = 'la liste que l’homme bandé de Cheapside, celui qui se faisait appeler Smith, vous a dictée entre deux souffles';
    else listeDe = 'la liste que Smith vous a dictée entre deux souffles, à Cheapside';
    api.say('Dans votre portefeuille, ' + listeDe + ' : Paris, Venise, Trieste, Belgrade, Sofia, Constantinople. Une statue en morceaux, et un morceau par ville. À côté de Paris, un seul nom : le comte Fenalik, qui la possédait avant la Révolution.' + (a('BIBLIO') ? ' Et, recopiée au British Museum, une piste plus sûre : des documents sur le simulacre dorment à la Bibliothèque nationale.' : ''));
    if (a('BEDDOWS') && !f.demasque) api.say('Vous n’arrivez pas à oublier le cadavre écorché du British Museum. Si c’était Beddows, qui donc vous a ouvert la porte, à Cheapside ?');
    if (f.maquetteDetruite && !f.stanleySauve) api.say('Dans le train, vous vous êtes assoupi{e} une minute. Un visage écrasé contre une vitre, Henry Stanley, qui hurle sans bruit. Vous vous êtes réveillé{e} en sursaut, et la dame d’en face a changé de compartiment.');
    if (f.fin === 'fugitif') api.say('À Londres, Scotland Yard a votre signalement. À Calais, le douanier a regardé votre passeport une seconde de trop, puis il l’a tamponné. À Paris, la police n’a pas encore reçu votre nom. Mieux vaut ne pas lui en donner l’occasion.');
    if (pa && api.sanState() >= 2) api.say('Sur le quai, vous vous surprenez à dévisager les porteurs, un par un, en cherchant lequel n’a pas de visage à lui.');
    api.say('Le Simplon-Orient-Express vous attendra gare de Lyon. Rien ne presse encore.' + (f.fin === 'fugitif' ? '' : ' Personne, que vous sachiez, ne vous suit.'));
    api.sys('Vous incarnez ' + api.pc.name + (pa ? ', tel' + (api.pc.sex === 'f' ? 'le' : '') + ' que Londres vous a laissé' + (api.pc.sex === 'f' ? 'e' : '') : '') + '. Écrivez ce que vous faites (« Agir ») ou ce que vous dites (« Dire »).');
  };
  P.help = function (api) { api.sys('Écrivez ce que fait votre investigateur : « je vais à la Bibliothèque nationale », « je demande une carte de lecteur », « je cherche le comte Fenalik ». Pour vous déplacer : « aller à… », ou « où aller ? ».'); };
  P.people = { gerant: 'M. Blain, gérant de l’hôtel du Cygne', gaudry: 'M. Gaudry, secrétariat de la Bibliothèque nationale', remi: 'Rémi Vangeim, étudiant et traducteur', brevin: 'Mlle Brévin, bibliothèque de l’Arsenal', rogniat: 'Mme Rogniat, secrétaire de la direction de Charenton', leroux: 'Le docteur Leroux, directeur par intérim', mandrin: 'Paul Mandrin, infirmier à Charenton' };
  P.timeEvents = [];
  P.pregens = L.pregens;
  P.investigator = L.pregens[0];
  P.improvise = function (api, p) {
    var t = ' ' + G.RPG.normalize(p.raw || '') + ' ';
    if (/\b(louvre|tour eiffel|notre dame|versailles|montmartre|champs elysees|opera|moulin rouge|visiter paris|me promener|promenade|flaner)\b/.test(t) && !api.s.talk) {
      api.say(api.fresh('flaner', ['Vous vous accordez deux heures. La tour Eiffel se perd dans la pluie ; au Louvre, les gardiens bâillent devant la Joconde revenue d’Italie. C’est une ville où l’on voudrait être venu pour rien.', 'Vous marchez le long des quais, entre les boîtes des bouquinistes fermées par la pluie. Notre-Dame est noire de suie. Vous pensez à Smith, qui aimait cette ville, et à ce qu’il en reste, de Smith.', 'Montmartre, ses escaliers, ses ateliers. Un accordéon derrière une vitre. Vous redescendez avant la nuit, sans savoir ce que vous étiez monté chercher.']));
      api.time(120); return true;
    }
    return false;
  };

  // ================================================================ la conversation libre : qui ils sont, ce qu'ils savent
  P.fiches = {
    gerant: { groupe: 'hotel', reg: 'formel', pa: true, tics: ['Si vous permettez,', 'Entre nous,'],
      dada: ['L’ascenseur est de 1898. Il gémit, mais il monte.', 'Avant la guerre, nous avions des Russes à chaque étage. Ils payaient en or. Maintenant, ils conduisent les taxis.'],
      moi: { nom: '« Blain, Octave. Gérant, {m}, pas propriétaire. La nuance me coûte cher. »', age: '« Cinquante-huit ans, dont trente derrière ce comptoir. »', origine: '« D’Auxerre. On en garde l’accent, paraît-il. »', famille: '« Une épouse, à la lingerie. Deux fils. Un seul est revenu de Verdun. »', metier: '« Je tiens la maison. On ne me remarque que lorsque quelque chose manque. »', loisirs: '« Les dominos, le dimanche, au café de la Bourse. »' },
      sait: { SMITH: '« Un grand monsieur. Il parlait français comme un livre, avec un accent de théâtre. »', BN: '« La Nationale est notre voisine. La moitié de nos clients y passent leurs journées, et rentrent avec les yeux rouges. »', POISSY: '« Poissy ? Une demi-heure de train, par Saint-Lazare. Un marché aux bestiaux, une vieille église. »', CHARENTON: '« On n’y va pas pour son plaisir, {m}. »', TRAIN: '« Le Simplon-Orient, gare de Lyon. Vos places sont retenues. »' },
      relances: [{ q: '« Vous êtes à Paris pour vos études, {m}, ou pour votre plaisir ? »', oui: '« L’un n’empêche pas l’autre, ici. »', non: '« Alors pour des affaires. Je ne demande rien. »' }] },
    // « Docteur, professeur, membre d'une société savante : les titres ouvrent les portes, ici. » Un vrai titre, dit au guichet, vaut recommandation.
    gaudry: { groupe: 'savant', reg: 'sec', pa: true, mefiant: 0.6, tics: ['Voyons.', 'Soit.'],
      roles: (function () {
        function titre(nom) {
          return function (api) {
            // (la réplique peut être lue deux fois dans le même tour : la carte n'est donnée qu'une fois, la phrase reste la même)
            if (api.flag('carteBN') && api.flag('carteTitre') !== api.s.turn) return '« Je sais, ' + nom + '. Vous avez votre carte. »';
            if (!api.flag('carteBN')) { api.flag('carteBN', true); api.flag('carteTitre', api.s.turn); api.take('Une carte de lecteur de la Bibliothèque nationale'); }
            return 'M. Gaudry repose sa plume. « ' + nom.charAt(0).toUpperCase() + nom.slice(1) + '. Il fallait le dire. » Il tamponne un carton vert, deux fois. « Carte de lecteur. Salle de travail, au fond de la cour. Un bulletin par ouvrage, et l’on ne communique plus rien dans la dernière heure. »';
          };
        }
        return { medecin: titre('docteur'), savant: titre('professeur'), avocat: titre('maître'), clerge: titre('mon père'), militaire: titre('mon commandant'), diplomate: titre('monsieur le consul') };
      })(),
      dada: ['Le règlement est de 1858. Il a été fait pour durer.', 'Un lecteur a tenté de sortir avec un Elzévir sous sa veste, mardi. Il est fiché.'],
      moi: { nom: '« Gaudry. Secrétariat. »', age: '« Cela ne figure sur aucun bulletin de demande. »', origine: '« De Paris. Du sixième. »', famille: '« Je suis marié à cette maison. »', metier: '« Je délivre les cartes. C’est moi qui décide qui lit. »', loisirs: '« Je classe ma propre bibliothèque. Par format. »' },
      sait: { BN: '« Quatre millions de volumes. Trois cent quarante places. Faites le calcul. »', REMI: '« Vangeim. Il a sa carte depuis six ans, et pas un retard. Je n’en dirai pas autant de ses opinions. »', ARSENAL: '« L’Arsenal dépend de nous, quoi qu’ils en disent. »' } },
    remi: { groupe: 'peuple', reg: 'populaire', pa: true, tics: ['Remarquez,', 'Franchement,'],
      dada: ['Ma logeuse compte les morceaux de charbon.', 'À la Sorbonne, on nous apprend à douter de tout, sauf des professeurs.'],
      moi: { nom: '« Vangeim, Rémi. Un nom du Nord. »', age: '« Vingt-quatre ans. Trop jeune pour la guerre, à trois mois près. »', origine: '« De Roubaix. Mon père est tisserand. »', famille: '« Une mère, un père, quatre sœurs. Je suis le seul à lire. »', metier: '« Étudiant. Traducteur. Journaliste quand on me paie, c’est-à-dire rarement. »', loisirs: '« Le cinéma, les réunions politiques, et la bibliothèque, puisqu’elle est chauffée. »' },
      sait: { BN: '« C’est la plus belle salle du monde, et la plus mal commode. Il faut savoir à qui sourire. »', GAUDRY: '« Gaudry ? Il aboie. Il ne mord que les voleurs de livres. »', ARSENAL: '« L’Arsenal, c’est là que dorment les papiers de la Bastille. Demandez Mlle Brévin : elle sait tout, et elle ne le dit qu’aux gens polis. »' },
      relances: [{ q: '« Vous cherchez quoi, au juste ? Un ancêtre ? Un trésor ? »', oui: '« Tout le monde cherche un trésor. Les plus honnêtes disent “la vérité”. »', non: '« Alors c’est pire : c’est pour quelqu’un d’autre. »' }] },
    brevin: { groupe: 'savant', reg: 'formel', pa: true, tics: ['Voyez-vous,', 'À vrai dire,'],
      dada: ['Le papier de chiffon traverse les siècles. Le nôtre tombera en poussière avant nous.', 'J’ai retrouvé une lettre de cachet dans un roman, la semaine dernière. Elle servait de marque-page depuis 1790.'],
      moi: { nom: '« Brévin. Marguerite Brévin, puisque vous le demandez. »', age: '« Une dame ne compte que ses années de service. Vingt. »', origine: '« De Tours. »', famille: '« Une sœur, à Tours. Et quatre mille cartons, ici. »', metier: '« Je classe, je sèche, je recolle. C’est un métier de patience. »', loisirs: '« Le dimanche, je marche jusqu’à Vincennes. On n’y croise aucun papier. »' },
      sait: { POISSY: '« Poissy ? On y jugeait, autrefois. Il y a eu un colloque fameux, sous Catherine de Médicis. La maison de votre comte, on a bâti dessus, je crois. »', BN: '« La Nationale a les beaux manuscrits. Nous avons les vrais. »', FENALIK: '« Ce nom revient dans les papiers Malon, et nulle part ailleurs chez nous. »' } },
    rogniat: { groupe: 'hotel', reg: 'sec', pa: true, mefiant: 0.8, tics: ['Bien.', 'Écoutez,'],
      dada: ['Huit jours que je refais tous les dossiers.', 'Le docteur Leroux veut un état des pensionnaires avant vendredi. Six cents noms.'],
      moi: { nom: '« Mme Rogniat. Cela suffira. »', age: '« Je ne vois pas le rapport avec votre visite. »', origine: '« De Charenton même. Mon père y était portier. »', famille: '« Veuve. »', metier: '« Secrétaire de la direction. Depuis trois directeurs. »', loisirs: '« Je n’ai pas de loisirs. J’ai un jardin. »' },
      sait: { MANDRIN: '« M. Mandrin est un infirmier de cette maison. Il n’a pas qualité pour vous répondre. »', CHARENTON: '« La maison date de 1641. Elle a vu passer des rois, des républiques et deux empires. Elle verra passer le reste. »' } },
    leroux: { groupe: 'savant', reg: 'sec', pa: true, mefiant: 0.9, tics: ['Monsieur,', 'Je vous prie,'],
      dada: ['Le règlement de cette maison était devenu une suggestion. Cela va changer.', 'Je dois rendre mon rapport au ministère jeudi.'],
      moi: { nom: '« François Leroux. Docteur en médecine. »', age: '« Quarante-six ans. »', origine: '« De Lyon. »', famille: '« Cela ne concerne pas cette maison. »', metier: '« Directeur par intérim. L’intérim ne durera pas. »', loisirs: '« Je n’en ai pas le temps. »' },
      sait: { MANDRIN: '« Un infirmier. Je n’ai pas à commenter le personnel devant un visiteur. »', ROGNIAT: '« Mme Rogniat est la mémoire de cette maison. C’est parfois un inconvénient. »' } },
    mandrin: { groupe: 'peuple', reg: 'populaire', pa: true, tics: ['Je vous jure,', 'Voyez,'],
      dada: ['Les nuits de pleine lune, on double les équipes. Riez pas.', 'Ma femme veut que je quitte. Elle a raison.'],
      moi: { nom: '« Mandrin, Paul. Comme le bandit, oui. On me la fait depuis l’école. »', age: '« Trente et un ans. »', origine: '« De Maisons-Alfort, à côté. »', famille: '« Une femme, un petit de deux ans. »', metier: '« Infirmier au troisième quartier. Sept ans de maison. »', loisirs: '« La pêche, en Marne. On n’y entend personne crier. »' },
      sait: { LEROUX: '« Leroux ? Il a peur. Il a fait changer les serrures de l’aile privée le lendemain. »', ROGNIAT: '« La Rogniat sait tout. Elle était là avant les murs. »', CHARENTON: '« Les caves, là-dessous, c’est plus vieux que tout le reste. Il y a des couloirs murés depuis la Révolution. »', SOUSSOL: '« On n’y descend pas. Enfin, on n’y descendait pas. »' },
      relances: [{ q: '« Vous allez pas me mettre dans un journal, au moins ? »', oui: '« Alors on s’arrête là. »', non: '« Bon. Parce que j’ai un gosse. »' }] }
  };
  P.rumeurs = {};
  if (G.RPG.Parole) P.converse = G.RPG.Parole.make(P);
  if (L.jets) P.jets = Object.assign({}, L.jets, { lieux: {}, idee: function (api) { return null; } });
  var HT = G.RPG.Humeur && G.RPG.Humeur.T;
  if (HT) {
    HT.gerant = { kind: 'appel', vite: 'calme', sup: 'un agent', police: true };
    HT.gaudry = { kind: 'appel', vite: 'vif', sup: 'les gardiens', police: true };
    HT.remi = { kind: 'froid', vite: 'normal' };
    HT.brevin = { kind: 'appel', vite: 'normal', sup: 'le conservateur', police: true, f: true };
    HT.rogniat = { kind: 'appel', vite: 'vif', sup: 'les infirmiers', police: true, f: true };
    HT.leroux = { kind: 'appel', vite: 'vif', sup: 'les infirmiers', police: true };
    HT.mandrin = { kind: 'faible', vite: 'calme', sup: 'le patron du café' };
  }

  // ================================================================ le fil de l'intrigue
  P.fils = {
    gerant: [
      { t: 'bn', cond: function (api) { return !api.flag('carteBN'); }, x: '« Vous me pardonnerez, {m} : si c’est pour la Nationale, il vaut mieux y être à l’ouverture. Le secrétariat est d’une humeur plus égale le matin. »' },
      { t: 'charenton', cond: function (api) { return connu(api, 'charenton') && !api.s.visited.charenton; }, x: '« Vous avez vu, dans le journal ? Cette histoire du directeur de Charenton. On n’en dit pas la moitié. »' }
    ],
    gaudry: [{ t: 'aide', cond: function (api) { return !!api.flag('carteBN') && !francais(api) && !api.flag('remiVu'); }, x: 'Il vous regarde déchiffrer un bulletin, lèvres remuantes. « Vous n’irez pas loin ainsi. Il y a des gens dont c’est le métier. »' }],
    remi: [
      { t: 'travail', cond: function (api) { return !aide(api); }, x: '« Je ne veux pas vous presser. Mais la salle ferme à cinq heures, et les manuscrits ne viennent pas tout seuls. »' },
      { t: 'fenalik', cond: function (api) { return api.has('SCANDALE'); }, x: '« Votre comte me trotte dans la tête. Un détail ne colle pas, dans ce qu’on en raconte. »' }
    ],
    brevin: [{ t: 'malon', x: 'Elle tapote une liasse du bout de son crayon. « Vous n’êtes pas venu jusqu’à la Bastille pour admirer les boiseries. Un nom, peut-être ? »' }],
    rogniat: [{ t: 'registres', cond: function (api) { return !api.flag('registresOuverts'); }, x: '« Si c’est de l’histoire ancienne qui vous amène, dites-le. Pour l’histoire ancienne, il y a un règlement. »' }],
    mandrin: [
      { t: 'guimart', x: 'Il touche ses griffures, machinalement. « C’est un métier dangereux. Demandez à Guimart. Enfin… vous ne pourrez pas. »' },
      { t: 'parole', x: '« Il m’a dit une chose, le dernier soir. Je l’ai là, ça ne part pas. »' },
      { t: 'patient', x: '« Et puis il y avait celui d’en haut. Celui qu’on ne voyait jamais. »' }
    ]
  };

  // ================================================================ images provisoires (en attendant celles de Paris)
  // les images de Paris (série du 15 novembre 2026) ; à la fin, le train de banlieue de Saint-Lazare
  function vue(f) { return function (st) { return st.flags && st.flags.fin === 'poissy' ? 'paris/11_saint-lazare_train-de-banlieue' : typeof f === 'function' ? f(st) : f; }; }
  G.PHOTO_SCENES = Object.assign(G.PHOTO_SCENES || {}, {
    p_gare: vue('paris/01_gare-du-nord'),
    // la nuit, une fois le guetteur venu, c'est lui qu'on voit sous le réverbère, au moins pour un esprit troublé
    p_hotel: vue(function (st) {
      var f = st.flags || {}, h = Math.floor(((st.min || 0) % D) / 60), nuit = h >= 19 || h < 7;
      if (f.guetteurMin !== undefined && (st.min || 0) - f.guetteurMin < 30) return 'paris/04_hotel-du-cygne_guetteur';
      if (nuit && f.guetteur && (st.san | 0) >= 1) return 'paris/04_hotel-du-cygne_guetteur';
      return nuit ? 'paris/03_hotel-du-cygne_chambre_nuit' : 'paris/02_hotel-du-cygne_chambre_jour';
    }),
    p_bn: vue('paris/05_bibliotheque-nationale_salle-de-travail'),
    p_arsenal: vue('paris/06_bibliotheque-de-l-arsenal'),
    p_asile: vue(function (st) { var v = (st.flags || {}).vueCharenton; return v === 'registres' ? 'paris/09_charenton_registres' : v === 'secretariat' ? 'paris/08_charenton_secretariat' : 'paris/07_charenton_arcades'; }),
    p_cafe: vue('paris/10_cafe-de-charenton')
  });
  // à Charenton, l'image suit ce qu'on fait : les arcades en arrivant, le secrétariat, les registres
  var VUES_CH = { ch_look: 'arcades', ch_guetter: 'arcades', ch_rogniat: 'secretariat', ch_caisses: 'secretariat', ch_cahier: 'secretariat', ch_guimart: 'secretariat', ch_registres: 'registres' };
  (P.locations.charenton.actions || []).forEach(function (a) {
    var v = VUES_CH[a.id]; if (!v) return;
    var r = a.run; a.run = function (api) { api.flag('vueCharenton', v); return r.apply(this, arguments); };
  });
  var entreCh = P.locations.charenton.enter;
  P.locations.charenton.enter = function (api) { api.flag('vueCharenton', 'arcades'); return entreCh.apply(this, arguments); };

  P._h = { at: at, day: day, hour: hour, jour: jour, nuit: nuit, francais: francais, aide: aide, connu: connu, apprendre: apprendre, ailleurs: ailleurs, passe: passe, dateLongue: dateLongue, vue: vue, JOURS: JOURS };
  L.suite = 'paris';
  P.precedent = 'londres';
  // des noms que l'investigateur n'a pas besoin d'avoir lus pour y penser (voir le garde-fou des noms, engine.js)
  P.nomsCommuns = { Sully: 1 };
  G.CHAPTERS.paris = P;
})(typeof window !== 'undefined' ? window : globalThis);
