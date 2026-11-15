/* Londres : circuits de rechange. Quand le joueur improvise, le monde répond de façon crédible :
   d'autres chemins vers les mêmes vérités (règle des trois indices), des conséquences aux gestes
   brutaux, des relances qui viennent du monde (crieurs, courrier, Beddows qui vous cherche). */
(function (G) {
  'use strict';
  var L = G.CHAPTERS.londres, H = L._h, T = H.T, day = H.day, hour = H.hour, at = H.at, D = H.D, learn = H.learn, known = H.known;
  var FEU = at(1, 23, 0); // l'incendie de St John's Wood : samedi 6 janvier, 23 h
  var CLE = 'Une plaque de clé en cuivre : « Chelsea Arms, 14 »';
  var LETTRE = 'Une lettre roussie, à en-tête de M. Makryat';
  function brule(api) { return api.s.min >= FEU; }
  function loc(api) { return api.s.loc; }
  function norm(raw) { return String(raw || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`-]/g, ' '); }
  function outside(api) { return /^(stjohn|islington|stoke|victoria|yard|chelsea|camberwell|musee|ambassade|archives)$/.test(loc(api)); }
  function special(api) { return /^(wagon|retour|campagne|institut|cave|cheapside)/.test(loc(api)); }

  // ================================================================ lexique
  var baseLex = L.lexicon;
  L.lexicon = function (Lx) {
    baseLex(Lx);
    Lx.add('STJOHN', 'n', 'stjohn, villa, ruines, decombres, carcasse, grille', { label: 'la maison de Smith' });
    Lx.take('ARCHIVES', 'n', 'archives, morgue, hemeroteque, fleetstreet', { label: 'les archives des journaux' });
    Lx.add('ARCHIVISTE', 'n', 'archiviste, documentaliste, preposee, prepose', { label: 'l’archiviste' });
    Lx.add('TELEGRAMME', 'n', 'telegramme, telegrammes, telegraphe, telegraphier, cable, cabler, depeche, depeches', { label: 'un télégramme' });
    Lx.add('ANNONCE', 'n', 'annonce, annonces, encart, avis, petitesannonces', { label: 'une annonce' });
    Lx.take('SUIVRE', 'v', 'suivre, suivez, suivons, filer, filez, filons, pister, talonner, epier, filature, surveiller, guetter, poursuivre, poursuis, rattraper, rattrape');
    Lx.add('WEEKEND', 'x', 'weekend, lundi', { label: 'le week-end' });
    Lx.add('TEMOIN', 'n', 'temoin, temoins, laitier, badaud, badauds, cocher, livreur', { label: 'le témoin' });
    Lx.add('FUYARD', 'n', 'fuyard, fardeau, ballot, colis, signalement, description, fui, enfui, enfuit, enfuir', { label: 'la silhouette' });
    Lx.add('STATION', 'n', 'station, stations', { label: 'la station de fiacres' });
  };
  L.phrases.unshift(
    [/\bst john s wood\b|\bsaint john s wood\b|\bst johns wood\b|\b(?<=chez )(smith|le professeur|lui)\b|\b(la )?maison (de smith|du professeur)\b|\bdomicile (de smith|du professeur)\b/g, ' stjohn '],
    [/\bfleet street\b|\barchives? (du|des|d un) (journa\w*|times|courier)\b|\bmorgue (du|des) journa\w*\b|\bvieux journaux\b|\banciens? (numeros|journaux)\b/g, ' archives '],
    [/\bpetites? annonces?\b|\bpasser une annonce\b|\bmettre une annonce\b/g, ' annonce '],
    [/\b(suivre|suis|suivez|filer|file|poursui\w*|rattrape\w*|cours apres|courir apres) (la |cette |l |le |ce )?(silhouette|ombre|fuyard)\b/g, ' suivre fuyard '],
    [/\b(je )?suis (l |cet |ce |le |la )(homme|type|monsieur|domestique|beddows|smith|professeur)\b/g, ' suivre $3 '],
    [/\blaisse[rz]? (passer|filer|couler)\b/g, ' attendre '],
    [/\bsonne[rz]?\b|\bsonnette\b|\bcoup de sonnette\b|\btire[rz]? la sonnette\b/g, ' frapper '],
    [/\bweek end\b|\bjusqu (a|au) lundi\b/g, ' weekend '],
    [/\bprendre en filature\b|\bne pas (le |la )?lacher\b|\bsur ses talons\b|\ble prendre en chasse\b/g, ' filer '],
    [/\bpot de vin\b|\bgraisser la patte\b|\bdessous de table\b/g, ' potdevin '],
    [/\bstations? (de |des )?(fiacres?|taxis?|voitures?|cochers?)( de lord s| de lords| pres de lord s)?\b|\b(chez |a |au )?lord s\b|\blords\b/g, ' station '],
    [/\b(je )?suis beddows\b/g, ' suivre beddows ']
  );

  // ================================================================ indices nouveaux
  L.clues.LETTRE = { title: 'Une lettre roussie', text: 'Dans les ruines de St John’s Wood : Makryat proposait à Smith de lui montrer « une tête de statue, d’un travail très ancien ». En-tête : 3, Brophy Lane, Islington.' };
  L.clues.FUYARD = { title: 'Un fardeau dans le brouillard', text: 'Avant l’incendie, « Beddows » s’est enfui de la maison avec un lourd ballot sur l’épaule, de la taille d’un homme, et a pris un fiacre vers la City.' };
  L.clues.CLE14 = { title: 'La clé de la chambre 14', text: 'L’homme à la moustache a laissé tomber dans le brouillard une plaque de clé du Chelsea Arms : chambre 14.' };
  L.clues.SEUL = { title: 'Beddows, seul', text: 'Loin du lit, Beddows tremble : « Il ne mange plus. Il ne dort plus. Il connaît des choses que Monsieur ne savait pas. » Puis il s’est enfui.' };

  // ================================================================ nouveaux lieux
  H.PLACES.stjohn = { label: 'la maison de Smith, à St John’s Wood', concept: 'STJOHN', also: ['INCENDIE', 'TEMOIN'] };
  H.PLACES.archives = { label: 'les archives du Daily Courier, à Fleet Street', concept: 'ARCHIVES', also: ['ARCHIVISTE'], hours: [8, 23], closed: 'Les archives du Daily Courier ferment à 23 h et rouvrent à 8 h.' };
  L.globalActions.unshift(H.goAct('stjohn'), H.goAct('archives'));
  // « aller voir Smith » : chez lui tant qu'on ne sait rien d'autre, à Cheapside ensuite
  L.globalActions.unshift({ id: 'go_smith', label: 'Aller voir Smith', verbs: ['ALLER', 'VISITER'], nouns: ['SMITH'], boost: 0.05, repeatable: true,
    cond: function (api) { return !special(api) && loc(api) !== 'stjohn'; },
    run: function (api) {
      if (known(api, 'cheapside') && !api.flag('cheapsideFini') && !api.flag('demasque')) { api.exec('go_cheapside'); return; }
      api.exec('go_stjohn');
    } });
  // les crieurs vendent aussi le journal dans ces rues-là
  L.globalActions.forEach(function (a) {
    if (a.id === 'g_journal') { var c0 = a.cond; a.cond = function (api) { return c0(api) || /^(stjohn|archives|ambassade)$/.test(loc(api)); }; }
  });

  // ---------------------------------------------------------------- St John's Wood
  L.locations.stjohn = {
    name: 'St John’s Wood, la maison de Smith', art: 'rue',
    enter: function (api, first) {
      api.flag('stjohnVu', true);
      if (!brule(api)) {
        if (day(api.s.min) === 0) api.say('La villa de Smith, en brique sombre, au fond d’un jardin noyé de brouillard. Une seule fenêtre éclairée, au premier : le bureau. Derrière les rideaux, une ombre passe et repasse, sans fin.');
        else if (hour(api.s.min) < 17) api.say('Des échafaudages contre la façade de la villa : des ouvriers repeignent les fenêtres, et le brouillard étouffe leurs coups de marteau. Les volets du bureau sont clos, en plein jour.');
        else api.say('La villa est noire. Les ouvriers sont partis. Une odeur flotte dans le jardin, que vous n’arrivez pas à nommer tout de suite : de l’essence, peut-être, ou de la térébenthine des peintres.');
        return;
      }
      if (first || !api.flag('ruinesVues')) {
        api.flag('ruinesVues', true);
        api.say('Il ne reste de la maison de Smith qu’une carcasse noire, ouverte sur le ciel gris. Les poutres fument encore par endroits. Des pages calcinées collent aux grilles du jardin comme des feuilles mortes. Un agent en pèlerine fait les cent pas devant le portail, et un laitier, sa carriole arrêtée, raconte quelque chose à qui veut l’entendre.');
        if (!api.has('INCENDIE')) { api.clue('INCENDIE'); learn(api, 'yard'); }
        return;
      }
      api.say(api.fresh('ruinesR', ['Les ruines de la maison de Smith. L’agent vous reconnaît d’un hochement de tête.', 'Le brouillard a fini d’éteindre la maison de Smith. Il n’en reste que l’odeur, tenace.']));
    },
    things: [
      { label: 'la villa', ids: ['STJOHN', 'SALLE', 'FENETRE', 'PORTE'], cond: function (api) { return !brule(api); } },
      { label: 'les ruines', ids: ['STJOHN', 'SALLE', 'INCENDIE', 'PORTE'], cond: brule },
      { label: 'l’agent de faction', ids: ['POLICE'], cond: brule },
      { label: 'le laitier', ids: ['TEMOIN', 'VOISIN'], cond: brule },
      { label: null, ids: ['STATION', 'TAXI'], cond: brule },
      { label: null, ids: ['LAMPE', 'NOTE', 'LIVRE'] }
    ],
    ambient: ['Une corne de brume, quelque part vers la Tamise.', 'Un merle se pose sur la grille, puis repart.', 'Une voiture passe au pas, ses phares noyés dans le gris.'],
    actions: [
      { id: 'sj_look', label: 'Observer la maison', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['STJOHN', 'SALLE'], bare: true, cond: function (api) { return !brule(api); },
        run: function (api) { api.say(api.fresh('sjlook', ['Une maison de savant : des rayonnages jusqu’au plafond, que l’on devine derrière les vitres du bas. Sur le perron, deux bouteilles de lait que personne n’a rentrées.', 'Le jardin est mal tenu, la grille grince. Au premier, la fenêtre du bureau. Personne n’y passe plus, maintenant.'])); } },
      { id: 'sj_sonner', label: 'Sonner à la porte', idea: true, verbs: ['FRAPPER', 'OUVRIR', 'PARLER', 'VISITER', 'ALLER'], nouns: ['PORTE', 'STJOHN', 'SMITH', 'BEDDOWS'], bare: true, cond: function (api) { return !brule(api); },
        run: function (api) {
          var d = day(api.s.min), h = hour(api.s.min);
          api.arrive('beddows'); // Beddows paraît à la porte
          if (d === 0) { api.say('Longtemps après votre coup de sonnette, la porte s’entrouvre sur Beddows, en bras de chemise, livide.'); api.npc('beddows', '« Le professeur est épuisé, {m}. Il s’est enfermé dans son bureau. Il… il n’est pas lui-même, ce soir. Revenez demain, je vous en prie. » La porte se referme. Vous entendez la chaîne, puis un second verrou.'); return; }
          if (h < 17) { api.say('Un peintre en salopette vous répond du haut de son échelle : le professeur ne reçoit personne. Puis Beddows paraît à la porte, et vous fait signe de vous approcher.'); api.npc('beddows', '« Pardon, {m}. Monsieur travaille. Il n’a pas dormi. Il a fait condamner les volets du bureau et il… » Il s’arrête, regarde derrière lui. « Il a peur, {m}. Je ne l’avais jamais vu avoir peur. Revenez lundi. » Il vous ferme la porte au nez, très doucement.'); api.flag('beddowsPeur', true); return; }
          api.say(api.fresh('sjson', ['Personne ne répond. Pourtant, au premier, derrière les volets, il vous semble entendre marcher.', 'Vous sonnez encore. Rien. La maison retient son souffle.']));
        } },
      { id: 'sj_guetter', label: 'Guetter la maison', idea: true, ideaCond: function (api) { return hour(api.s.min) >= 17 || hour(api.s.min) < 6; }, verbs: ['SUIVRE', 'ATTENDRE', 'CACHER', 'EXAMINER'], nouns: ['STJOHN', 'FENETRE', 'PORTE', 'SALLE'], bare: true, needVerb: true, repeatable: true, cond: function (api) { return !brule(api); },
        run: function (api) {
          var h = hour(api.s.min), d = day(api.s.min);
          if (d === 1 && h >= 17) { api.say('Vous trouvez un renfoncement, de l’autre côté de la rue, sous un marronnier. Le froid vous monte dans les jambes. Les heures s’égrènent au clocher de St Mark. Rien ne bouge, sauf, une fois, un rai de lumière entre les volets du bureau, aussitôt éteint.'); api.s.min = Math.max(api.s.min, FEU); api.s.tick = 0; return; }
          if (d === 0) { api.say('Vous restez un moment dans le froid, face à la fenêtre éclairée. L’ombre passe et repasse. À minuit, la lampe s’éteint, et vous rentrez, gelé{e}, sans savoir ce que vous espériez voir.'); api.s.min += 60; return; }
          api.say(api.fresh('sjg', ['Vous faites les cent pas devant la grille. Les ouvriers vous regardent de travers. Au bout d’une heure, vous renoncez.', 'Une heure à guetter les volets clos. Personne n’entre, personne ne sort.'])); api.s.min += 60;
        } },
      { id: 'sj_fouiller', label: 'Fouiller les ruines', idea: true, ideaCond: function (api) { return !api.flag('ruinesFouillees'); }, verbs: ['FOUILLER', 'EXAMINER', 'PRENDRE', 'ALLER', 'OUVRIR'], nouns: ['STJOHN', 'SALLE', 'INCENDIE', 'NOTE', 'LIVRE', 'PORTE'], bare: true, cond: brule,
        run: function (api) {
          if (api.flag('ruinesFouillees')) { api.say(api.fresh('sjfx', ['Vous fouillez encore les décombres. Des cendres, des clous, la reliure d’un livre fondue sur elle-même.', 'Rien de plus dans les ruines, sinon cette odeur d’essence qui ne part pas.'])); return; }
          if (hour(api.s.min) >= 7 && hour(api.s.min) < 22 && !api.flag('agentLaisse')) { api.say('L’agent s’interpose. « On ne fouille pas, {m}. Ordre du sergent Rigby. » Il a l’air de quelqu’un qui s’ennuie, et qui aimerait bien qu’on le distraie.'); return; }
          api.flag('ruinesFouillees', true);
          api.say(hour(api.s.min) >= 22 || hour(api.s.min) < 7 ? 'L’agent s’est abrité sous un porche. Vous enjambez la grille.' : 'L’agent regarde ailleurs, ostensiblement.');
          api.check('toc_ruines');
        } },
      { id: 'sj_agent', label: 'Parler à l’agent', talkTo: 'agentsj', verbs: ['PARLER', 'PERSUADER', 'BARATIN', 'INSISTER', 'POLI', 'DONNER'], nouns: ['POLICE'], cond: brule,
        extra: ['INCENDIE', 'SMITH', 'BEDDOWS', 'RIGBY', 'YARD', 'ARGENT'], run: function (api, p) { api.talk('agentsj', p); } },
      { id: 'sj_temoin', label: 'Écouter le laitier', idea: true, talkTo: 'laitier', verbs: ['PARLER', 'ECOUTER', 'PERSUADER', 'INSISTER', 'POLI', 'DONNER'], nouns: ['TEMOIN', 'VOISIN'], cond: brule,
        extra: ['INCENDIE', 'SMITH', 'BEDDOWS', 'FUYARD', 'TAXI', 'ARGENT'], run: function (api, p) { api.talk('laitier', p); } },
      { id: 'sj_lords', label: 'Aller à la station de fiacres de Lord’s', verbs: ['ALLER', 'VISITER', 'PARLER', 'EXAMINER', 'PRENDRE'], nouns: ['STATION'], extra: ['TAXI', 'TEMOIN', 'FUYARD'], repeatable: true, time: 20,
        cond: function (api) { return brule(api) && !(api.flag('fuyardVu') && !api.flag('fuyardSuivi') && api.s.min < FEU + 60); },
        run: function (api) {
          if (api.flag('lordsVu')) { api.say(api.fresh('lordsR', ['Les cochers de Lord’s vous saluent du fouet. Le vieux Gaskell n’est toujours pas revenu.', 'Toujours les mêmes fiacres, les mêmes chevaux sous leurs couvertures. Rien de neuf à la station.'])); return; }
          api.flag('lordsVu', true);
          api.say('La station de Lord’s est à deux rues, contre le mur du terrain de cricket : trois fiacres, des chevaux sous leurs couvertures, des cochers qui battent la semelle autour d’un brasero. Le vieux au cheval borgne n’est pas là.');
          api.say('« Le père Gaskell ? » Un cocher crache dans le brasero. « Pas revenu depuis sa course de cette nuit. Il est repassé à l’aube faire boire sa bête, pâle comme un linge. Il a chargé un gars qui portait un paquet long comme ça, et il l’a déposé à Cheapside. Il disait que le paquet gémissait. Après, il n’a plus voulu en parler. »');
          if (!api.has('FUYARD')) api.clue('FUYARD');
          learn(api, 'cheapside');
        } },
      { id: 'sj_suivre', label: 'Suivre la silhouette', idea: true, ideaCond: function (api) { return api.flag('fuyardVu') && !api.flag('fuyardSuivi'); }, verbs: ['SUIVRE', 'ALLER', 'CRIER'], nouns: ['FUYARD', 'BEDDOWS', 'QUELQUUN', 'TAXI'], bare: true,
        cond: function (api) { return api.flag('fuyardVu') && !api.flag('fuyardSuivi') && api.s.min < FEU + 60; },
        run: function (api) {
          api.flag('fuyardSuivi', true);
          api.say('Vous courez. Le brouillard vous avale à dix pas de la grille. Vous ne voyez plus la silhouette, seulement le bruit : un pas lourd, inégal, celui d’un homme qui porte trop. Puis un sifflet de fiacre, au coin de Grove End Road.');
          api.say('Vous arrivez trop tard. La voiture s’éloigne déjà. Mais la voix du cocher, enrouée, porte loin dans la nuit : « Cheapside, vous dites ? À cette heure ? » Les sabots claquent, puis plus rien.');
          api.clue('FUYARD'); learn(api, 'cheapside'); api.time(20);
        } }
    ]
  };
  L.timeEvents.push({ id: 'feu', at: FEU, run: function (api) {
    if (loc(api) !== 'stjohn' || api.s.min > FEU + 40) return;
    api.fx('flicker');
    api.event('Un bruit de verre, au premier. Puis une lueur orange derrière les volets du bureau, qui grandit, grandit, et d’un coup la fenêtre éclate et la nuit s’emplit de flammes.');
    api.say('Dans la lumière du brasier, une silhouette sort par la porte de service. Le manteau de Beddows, sa démarche raide. Sur son épaule, un long ballot enveloppé dans une couverture, de la taille d’un homme. Il ne court pas. Il ne se retourne pas. Il s’enfonce dans le brouillard comme on rentre chez soi.');
    api.flag('fuyardVu', true); api.clue('INCENDIE'); learn(api, 'yard');
    api.check('san_feu');
    api.chips([{ label: 'Suivre la silhouette', action: 'sj_suivre' }]);
  } });

  // ---------------------------------------------------------------- Fleet Street : les archives du Daily Courier
  L.locations.archives = {
    name: 'Fleet Street, les archives du Daily Courier', art: 'bureau',
    enter: function (api, first) {
      if (first) api.say('Au sous-sol du Daily Courier, la « morgue » : des kilomètres de journaux reliés, une odeur d’encre et de colle, et une vieille dame en manchettes qui règne sur le tout depuis le jubilé de la reine Victoria.');
      else api.say(api.fresh('arR', ['La morgue du Daily Courier. Mrs Pike lève les yeux de ses fiches.', 'Retour parmi les journaux reliés. Les rotatives font trembler le plafond.']));
    },
    things: [{ label: 'Mrs Pike, l’archiviste', ids: ['ARCHIVISTE', 'QUELQUUN'] }, { label: 'les volumes reliés', ids: ['ARCHIVES', 'JOURNAL', 'LIVRE'] }, { label: null, ids: ['SALLE', 'TABLE', 'LAMPE'] }],
    ambient: ['Les rotatives, au-dessus, font vibrer les rayonnages.', 'Un coursier dévale l’escalier avec une épreuve encore humide.', 'Mrs Pike tamponne une fiche. Clac.'],
    actions: [
      { id: 'ar_pike', label: 'Parler à l’archiviste', idea: true, talkTo: 'pike', verbs: ['PARLER', 'PERSUADER', 'BARATIN', 'POLI', 'DONNER', 'FLATTER'], nouns: ['ARCHIVISTE', 'QUELQUUN'],
        extra: ['ARCHIVES', 'ALEXIS', 'MAKRYAT', 'STANLEY', 'SMITH', 'TRAIN', 'MAQUETTE', 'ARGENT', 'MEURTRES', 'INCENDIE', 'BEDDOWS'], run: function (api, p) { api.talk('pike', p); } },
      { id: 'ar_chercher', label: 'Chercher dans les journaux reliés', idea: true, verbs: ['FOUILLER', 'EXAMINER', 'PRENDRE', 'UTILISER'], nouns: ['ARCHIVES', 'JOURNAL', 'LIVRE'], bare: true, time: 60, repeatable: true,
        run: function (api) { api.talk('pike'); } }
    ]
  };

  // ================================================================ personnages nouveaux
  L.npcs.concierge = H.npc({ id: 'concierge', name: 'Mr Pratt, le concierge', short: 'Mr Pratt', patience: 10, cooldown: 10, selfKeys: ['RECEPTION', 'HOTEL'],
    greet: function (api, first) { api.npc('concierge', first ? 'Derrière son comptoir d’acajou, un homme rose et parfaitement coiffé s’incline d’un millimètre. « Pratt, {m}. Concierge. Un taxi, un télégramme, un journal, une petite annonce, une réservation ? Je suis là pour ça. »' : api.fresh('prattG', ['« {M} ? »', '« Que puis-je pour vous, {m} ? »', 'Mr Pratt lève les yeux de son registre.'])); },
    bye: '« À votre service, {m}. »',
    deflect: ['« Je crains de ne pas saisir, {m}. »', 'Mr Pratt incline la tête, poliment perplexe.', '« Un taxi, peut-être ? »'],
    topics: [
      T('courrier', ['NOTE', 'CARTEVISITE', 'SMITH', 'HEURE'], function (api) {
        if (api.flag('billetAttend') && !api.has('BILLET')) { api.npc('concierge', '« Ah ! Une enveloppe pour vous, {m}, glissée sous votre porte, que le groom a eu la présence d’esprit de redescendre. » Il vous la tend du bout des doigts, comme une chose qui sent mauvais.'); giveCard(api); return; }
        if (deliver(api, true)) return;
        api.npc('concierge', api.fresh('prattN', ['« Rien pour vous, {m}, hélas. »', '« Pas de courrier, {m}. Le brouillard ralentit tout, même la poste. »']));
      }, { chip: 'Du courrier ?' }),
      T('smith', ['SMITH', 'INCENDIE', 'STJOHN', 'BEDDOWS'], function (api) {
        if (!brule(api)) { api.npc('concierge', '« Le professeur Smith ? Un monsieur très connu. Il est venu prendre le thé ici, une fois. Il a démasqué la voyante de Lady Ashworth, vous vous souvenez ? »'); return; }
        api.npc('concierge', '« Quelle tragédie, {m}, la maison de St John’s Wood. On dit dans les cuisines que le domestique a filé juste avant le feu. Moi, je ne dis rien. Je n’ai jamais aimé les domestiques qui filent. »');
        if (!api.has('INCENDIE')) { api.clue('INCENDIE'); learn(api, 'yard'); }
      }, { chip: 'Le professeur Smith' }),
      T('telegramme', ['TELEGRAMME'], function (api) {
        api.npc('concierge', '« Un télégramme, {m} ? Le bureau de poste de Southampton Row est à deux pas, mais je m’en charge. Pour où ? »');
        var ch = [];
        if (api.has('MEURTRES') && !api.flag('telParis')) ch.push({ label: 'À la Sûreté de Paris, sur les télégrammes « M. »', topic: 'telParis' });
        if (api.has('QUETE') && !api.flag('telStamboul')) ch.push({ label: 'Au musée de Topkapı, à Constantinople', topic: 'telStamboul' });
        if (!api.flag('telAmi')) ch.push({ label: 'À un ami, pour qu’il s’inquiète si je disparais', topic: 'telAmi' });
        api.chips(ch);
      }, { chip: 'Envoyer un télégramme' }),
      T('telParis', [], function (api) { if (api.flag('telParis')) return; api.flag('telParis', true); api.pay(1); api.npc('concierge', '« Sûreté générale, Paris : “Trois hommes tués à Londres avaient reçu télégramme signé M., envoyé de Paris. Origine ?” Une livre, {m}. Réponse ici. »'); post(api, 'paris', 16 * 60); }),
      T('telStamboul', [], function (api) { if (api.flag('telStamboul')) return; api.flag('telStamboul', true); api.pay(2); api.npc('concierge', '« Constantinople… » Il écrit lentement, en tirant la langue. « Deux livres, {m}. Avec la situation là-bas, je ne promets rien. »'); post(api, 'stamboul', 2 * D); }),
      T('telAmi', [], function (api) { if (api.flag('telAmi')) return; api.flag('telAmi', true); api.npc('concierge', '« “Si sans nouvelles de moi d’ici un mois, ne me cherchez pas.” » Il relève la tête. « C’est… très romantique, {m}. »'); api.gain(1); }),
      T('annonce', ['ANNONCE', 'JOURNAL'], function (api) {
        api.npc('concierge', '« Une annonce dans le Times ? Rien de plus simple, {m} : je la dépose avant midi, elle paraît demain. Que doit-elle chercher ? »');
        var ch = [];
        if (!api.flag('adSmith')) ch.push({ label: 'Des nouvelles du professeur Smith', topic: 'adSmith' });
        if (api.has('MEURTRES') && !api.flag('adMak')) ch.push({ label: 'Quiconque a connu Mehmet Makryat', topic: 'adMak' });
        if ((api.has('TRAIN') || api.has('STANLEY') || api.has('MEURTRES')) && !api.flag('adTrain')) ch.push({ label: 'Un train miniature, vendu à Islington', topic: 'adTrain' });
        api.chips(ch);
      }, { chip: 'Passer une petite annonce' }),
      T('adSmith', [], function (api) { if (api.flag('adSmith')) return; api.flag('adSmith', true); api.pay(0.5); api.npc('concierge', '« “Ami du professeur J. A. Smith cherche nouvelles. Discrétion assurée. Écrire au Grand Hôtel de Russell Square.” Dix shillings, {m}. »'); post(api, 'adSmith', D); }),
      T('adMak', [], function (api) { if (api.flag('adMak')) return; api.flag('adMak', true); api.pay(0.5); api.npc('concierge', '« “Recherche toute personne ayant connu M. Mehmet Makryat, antiquaire. Récompense.” » Il hésite. « Vous êtes sûr de vouloir le mot “récompense”, {m} ? Ça attire une faune. »'); post(api, 'adMak', D); }),
      T('adTrain', [], function (api) { if (api.flag('adTrain')) return; api.flag('adTrain', true); api.pay(0.5); api.npc('concierge', '« “Collectionneur recherche renseignements sur train miniature ancien, provenance Islington.” Les amateurs de trains lisent tout, {m}. Absolument tout. »'); post(api, 'adTrain', D); }),
      T('lieux', ['DESTINATIONS', 'TAXI', 'ARCHIVES', 'ALLER'], function (api) {
        api.npc('concierge', '« Un taxi en dix minutes, {m}, brouillard ou pas. Et si vous cherchez des renseignements, je me permets : le British Museum, à cinq minutes, ou la morgue du Daily Courier, à Fleet Street. Ils ont tout gardé depuis Waterloo. »');
        api.chips(H.destChips(api).slice(0, 6));
      }, { chip: 'Où trouver des renseignements ?' }),
      T('dame', ['DAMEDEUX'], ['« Mrs Gresham, au 21, {m}. Une cliente fidèle. Elle ne reçoit personne, mais si vous montez, elle vous parlera de ses pas. Elle en parle à tout le monde. »', '« Au-dessus de Mrs Gresham, {m}, il n’y a que le grenier. Condamné depuis la guerre. Je préfère ne pas y penser. »']),
      T('billets', ['BILLETS', 'VOYAGE', 'VICTORIA'], function (api) { H.reserver(api); }, { chip: 'Réserver les billets', cond: function (api) { return api.has('QUETE') && !api.item(H.BILLETS); } }),
      T('ragots', ['MEURTRES', 'CHELSEA', 'MAKRYAT', 'TURCS', 'QUELQUUN'], function (api, n) {
        if (day(api.s.min) < 3) { api.npc('concierge', '« Des ragots, {m} ? Le brouillard, surtout. Et une dame du deuxième qui prétend entendre des pas au plafond. Il n’y a pas d’étage au-dessus du sien. »'); return; }
        api.npc('concierge', ['« Les trois Turcs du Chelsea Arms ? Un collègue de là-bas m’a dit qu’ils ne se parlaient pas, {m}. Arrivés séparément, chacun sa valise, et tous les trois demandaient la même chambre. »', '« On dit aussi que le Yard a trouvé dans leurs poches des télégrammes de Paris. Mais on dit tant de choses. »'][Math.min(n, 1)]);
      }, { chip: 'Les nouvelles du quartier' })
    ] });

  L.npcs.agentsj = H.npc({ id: 'agentsj', name: 'L’agent de faction', short: 'L’agent', patience: 4, cooldown: 60, selfKeys: ['POLICE'],
    greet: function (api, first) { api.npc('agentsj', first ? 'Un grand garçon aux joues rouges, la pèlerine trempée. « Circulez, {m}. Enfin… si vous connaissiez le propriétaire, je peux vous écouter deux minutes. »' : '« Encore vous, {m} ? »'); },
    bye: '« Et ne touchez à rien en partant. »',
    topics: [
      T('feu', ['INCENDIE', 'STJOHN', 'SMITH'], ['« Parti du bureau, à ce qu’ils disent. Ça sentait l’essence jusqu’à Abbey Road. Pas de corps, {m}. Ni le professeur, ni le domestique. »', '« Le sergent Rigby, de la brigade des incendies, s’en occupe. À Scotland Yard. C’est lui qu’il faut voir. »'], { chip: 'L’incendie' }),
      T('fouiller', ['FOUILLER', 'STJOHN', 'PERSUADER', 'BARATIN'], function (api, n) {
        if (api.flag('agentLaisse')) { api.npc('agentsj', '« Faites vite, {m}. Je n’ai rien vu. »'); return; }
        api.npc('agentsj', n ? '« Je ne peux pas, {m}. Le sergent me tuerait. »' : '« Fouiller ? Pas question, {m}. Le sergent Rigby veut que rien ne bouge. » Il se frotte les mains, transi. « Bon sang, ce qu’on donnerait pour un thé. »');
      }, { chip: 'Jeter un œil aux ruines' }),
      T('beddows', ['BEDDOWS', 'FUYARD', 'TRACES'], ['« Le domestique ? Envolé, {m}. Le sergent a donné son signalement à tous les postes. Des traces, moi, je n’ai vu que celles des pompiers : des bottes partout, dans la boue. »', '« Si je le vois, je siffle. C’est tout ce qu’on m’a dit de faire. Le laitier en sait plus que moi : il était là avant tout le monde. »'], { chip: 'Le domestique' })
    ] });

  L.npcs.laitier = H.npc({ id: 'laitier', name: 'Le laitier', short: 'Le laitier', patience: 6, cooldown: 30, selfKeys: ['TEMOIN'],
    greet: function (api, first) { api.npc('laitier', first ? 'Un petit homme à casquette, qui ne demandait que ça. « Moi, {m}, j’ai tout vu. Enfin, j’ai vu ce qu’il y avait à voir. »' : '« Je vous ai dit ce que j’ai vu, {m}. Mais je peux recommencer. »'); },
    bye: '« Faut que j’y aille, le lait n’attend pas. »',
    topics: [
      T('vu', ['INCENDIE', 'BEDDOWS', 'FUYARD', 'QUELQUUN', 'SMITH', 'HISTOIRE', ['EXAMINER', 0.8], ['TEMOIN', 0.7], 'VU'], function (api, n) {
        var l = ['« Je faisais ma tournée de nuit, rapport aux hôtels. Et je vois le domestique, M. Beddows, sortir par-derrière. Avec un truc sur l’épaule, long comme ça, roulé dans une couverture. Lourd, que ça avait l’air. Comme un homme, {m}, je vous jure, comme un homme. »',
          '« Et cinq minutes après, boum. Les fenêtres. Le feu partout. Lui, il ne s’est même pas retourné. Il a sifflé un fiacre au coin de Grove End Road. »',
          '« Le cocher ? Un vieux de la station de Lord’s, avec un cheval borgne. Il a dû le dire au sergent du Yard, ça. Moi, j’ai dit ce que je savais. »'];
        api.npc('laitier', l[Math.min(n, l.length - 1)]);
        if (n === 0) api.clue('FUYARD');
        if (n >= 2) api.flag('cocherConnu', true);
      }, { chip: 'Ce que vous avez vu', more: ['« Le cocher ? Un vieux de la station de Lord’s, avec un cheval borgne. Il a dû le dire au sergent du Yard, ça. »'] }),
      T('visage', ['SUITE', 'PSY', 'INSISTER'], ['« Son visage ? Il faisait noir, {m}. Mais il marchait drôlement. Comme quelqu’un qui a mis les souliers d’un autre. »'])
    ] });

  L.npcs.pike = H.npc({ id: 'pike', name: 'Mrs Pike, l’archiviste', short: 'Mrs Pike', patience: 7, cooldown: 30, selfKeys: ['ARCHIVISTE'],
    greet: function (api, first) {
      var doyle = api.pc.key === 'doyle';
      api.npc('pike', first ? (doyle ? '« Miss Doyle. Encore vous. Vous allez encore me défaire mes reliures. » Elle soupire, mais vous tend déjà le registre des fiches.' : 'Elle vous toise par-dessus ses lunettes. « Les archives ne sont pas ouvertes au public, {m}. Sauf pour les amis du journal. Ou pour ceux qui payent. Une demi-couronne la recherche. »') : api.fresh('pikeG', ['« Quoi encore ? »', '« Je vous écoute. Vite. »']));
    },
    bye: '« Remettez les volumes à leur place. À LEUR place. »',
    deflect: ['« Je classe, {m}. Je ne devine pas. »', '« Un nom, une date, un événement. Le reste ne m’intéresse pas. »'],
    topics: [
      T('alexis', ['ALEXIS', 'TRAIN', 'MAQUETTE', 'OCCULTE', 'FILS'], function (api) { search(api, 'alexis'); }, { chip: 'L’accident de 1897', cond: function (api) { return api.has('MAQUETTE') || api.has('TRAIN') || api.has('STANLEY') || api.has('RAILS'); } }),
      T('makryat', ['MAKRYAT', 'MEURTRES', 'TURCS', 'CHELSEA'], function (api) { search(api, 'makryat'); }, { chip: 'Makryat, l’antiquaire', cond: function (api) { return api.has('MEURTRES'); } }),
      T('stanley', ['STANLEY', 'STOKE', 'SUIE'], function (api) { search(api, 'stanley'); }, { chip: 'La disparition de Stoke Newington', cond: function (api) { return day(api.s.min) >= 4; } }),
      T('smith', ['SMITH', 'CONFERENCE', 'INCENDIE', 'BEDDOWS'], function (api) { search(api, 'smith'); }, { chip: 'Le professeur Smith' }),
      T('aide', ['AIDE', 'SUITE', 'ARCHIVES', 'JOURNAL', 'FOUILLER'], ['« Donnez-moi un nom ou un fait divers, {m}, et je vous trouve l’article. Les années, je les connais par cœur. Les gens, beaucoup moins. »'])
    ] });


  // ================================================================ courrier : télégrammes, annonces, réponses
  function giveCard(api) {
    api.say('Une carte de visite du professeur Smith, scellée à la cire de sa chevalière. Au dos, d’une écriture tremblée : « Venez sans tarder. Il me reste peu de temps. Pour l’amour de Dieu, que personne ne vous suive. J. A. Smith. » Au recto, une adresse à Cheapside, un quartier où Smith n’aurait jamais mis les pieds.');
    api.flag('billetRecu', true); api.flag('billetAttend', false); api.take(H.CARTE); api.clue('BILLET'); learn(api, 'cheapside');
  }
  function post(api, kind, delay) { var q = (api.flag('courrier') || []).slice(); q.push({ k: kind, due: api.s.min + delay }); api.flag('courrier', q); }
  function deliver(api, desk) {
    var q = api.flag('courrier') || [], due = q.filter(function (x) { return x.due <= api.s.min; });
    if (!due.length) return false;
    if (loc(api) !== 'hotel' && !desk) return false;
    api.flag('courrier', q.filter(function (x) { return x.due > api.s.min; }));
    due.forEach(function (x) {
      if (x.k === 'paris') {
        api.doc('SÛRETÉ GÉNÉRALE À ' + (api.pc.title === 'Miss' ? 'MISS ' : api.pc.title === 'Dr' ? 'DR ' : 'M. ') + api.pc.last.toUpperCase() + ' — TROIS TÉLÉGRAMMES SIGNÉS M. DÉPOSÉS BUREAU GARE DE LYON LE 2 JANVIER PAR HOMME ÂGÉ GANTÉ PAYANT EN OR TURC STOP EXPÉDITEUR INCONNU STOP SERVICE CONTINUE STOP', 'Télégramme de Paris');
        if (!api.has('TELEGRAMME')) api.clue('TELEGRAMME');
      } else if (x.k === 'stamboul') {
        api.doc('MUSÉE TOPKAPI À ' + (api.pc.title === 'Miss' ? 'MISS ' : api.pc.title === 'Dr' ? 'DR ' : 'M. ') + api.pc.last.toUpperCase() + ' — ROULEAUX SEDEFKAR CONSERVÉS ICI AVANT GUERRE STOP COLLECTIONS DÉPLACÉES DEPUIS STOP CONSERVATEUR NE PEUT CONFIRMER STOP', 'Télégramme de Constantinople');
        if (!api.has('ROULEAUX')) api.clue('ROULEAUX');
      } else if (x.k === 'adSmith') {
        if (!api.has('BILLET') && !api.flag('cheapsideVu')) { api.say('Parmi les réponses à votre annonce, des voyantes, un escroc, une veuve qui cherche un mari. Et une enveloppe sans timbre, apportée à la main.'); giveCard(api); }
        else api.say('Les réponses à votre annonce sur Smith : trois médiums qui prétendent lui parler dans l’au-delà, et une lettre anonyme, d’une écriture appliquée : « Laissez-le en paix. Il n’est plus celui que vous cherchez. »');
      } else if (x.k === 'adMak') {
        api.say('Une seule réponse à votre annonce sur Makryat, sur un papier quadrillé de cahier d’écolier : « Brophy Lane, au numéro 3. Il est parti. N’y allez pas après la nuit tombée, ce n’est plus un endroit pour les vivants. » Pas de signature, pas de récompense réclamée.');
        if (!api.has('ADRESSE')) api.clue('ADRESSE'); learn(api, 'islington');
      } else if (x.k === 'adTrain') {
        api.say('Une lettre à l’en-tête de l’Association des amateurs de modèles ferroviaires de Camberwell, d’une écriture ronde et enthousiaste.');
        api.doc('Cher Monsieur, chère Madame, votre annonce m’a fait bondir. Il se trouve que je détiens moi-même une pièce remarquable, qui m’a été confiée, et sur laquelle je serais ravi d’échanger avec un connaisseur. Passez donc me voir à Camberwell, à l’heure qui vous plaira. Votre dévoué, Arthur Butter, président.', 'Une lettre de Camberwell');
        learn(api, 'camberwell');
      }
    });
    return true;
  }

  // ================================================================ le monde relance : crieurs, Beddows, pensées
  var CRIEURS = [
    { d: 1, has: 'CONFERENCE', x: '« Le professeur Smith et les fantômes ! Demandez le Times ! »' },
    { d: 2, has: 'INCENDIE', x: '« Incendie à St John’s Wood ! La maison du savant en flammes ! Le domestique en fuite ! »' },
    { d: 3, has: 'MEURTRES', x: '« Triple meurtre au Chelsea Arms ! Trois morts, un seul nom ! »' },
    { d: 4, has: 'STANLEY', x: '« Volatilisé à Stoke Newington ! Un homme part en fumée ! Demandez le Scoop ! »', cond: function (api) { return api.has('BILLET'); } }
  ];
  var CONSEILS = [
    { k: 'smith', cond: function (api) { return day(api.s.min) >= 1 && !brule(api) && !api.flag('stjohnVu'); }, x: 'Depuis le banquet, pas un mot de Smith. Lui qui écrit d’ordinaire trois lettres par jour. Sa maison de St John’s Wood n’est qu’à une demi-heure.' },
    { k: 'ruines', cond: function (api) { return brule(api) && api.s.min < FEU + 1.4 * D && !api.has('INCENDIE'); }, x: 'Il y a eu un grand feu, cette nuit, quelque part au nord : on en parlait au petit déjeuner. Vous pensez à Smith, sans savoir pourquoi.' },
    { k: 'billet', cond: function (api) { return api.has('BILLET') && !api.flag('cheapsideVu'); }, x: 'La carte de Smith vous brûle la poche. « Il me reste peu de temps. »' },
    { k: 'adresse', cond: function (api) { return api.has('MEURTRES') && !api.has('ADRESSE'); }, x: 'Un antiquaire, ça a une boutique, et une boutique, ça a une adresse : l’annuaire de l’hôtel, la police, ou l’ambassade de Turquie la connaissent sûrement.' },
    { k: 'registres', cond: function (api) { return api.has('ADRESSE') && api.flag('known:islington') && !api.has('TRAIN') && !api.has('STANLEY') && day(api.s.min) >= 4; }, x: 'La boutique de Brophy Lane vous revient en mémoire. Un antiquaire tient des comptes. Qui a acheté quoi, avant qu’il ne disparaisse ?' },
    { k: 'butter', cond: function (api) { return (api.has('STANLEY') || api.has('RAILS')) && !known(api, 'camberwell'); }, x: 'Un homme qui collectionne les trains a forcément des amis qui collectionnent les trains. Sa logeuse, ou la police de Stoke Newington, doivent savoir lesquels.' },
    { k: 'alexis', cond: function (api) { return api.has('MAQUETTE') && !api.has('ALEXIS'); }, x: 'L’express de Liverpool de 1897, ce nom d’Alexis : ce genre d’histoire dort dans les vieux journaux. Le British Museum, ou la morgue d’un quotidien de Fleet Street.' },
    { k: 'quete', cond: function (api) { return api.has('QUETE') && !api.item(H.BILLETS) && day(api.s.min) >= 6; }, x: 'Smith vous a confié une tâche, et l’argent pour l’accomplir. Chaque jour à Londres est un jour de plus pour ceux qui cherchent la statue.' }
  ];
  L._conseils = CONSEILS;
  L.everyTurn = function (api, fired) {
    if (api.s.talk) return false;
    // le courrier qui attend à la réception
    var q0 = api.flag('courrier') || [], pret = q0.some(function (x) { return x.due <= api.s.min; });
    if (pret && loc(api) === 'hotel') { api.event('Le groom frappe : du courrier pour vous, à la réception. Il vous le monte sur un plateau.'); deliver(api, true); return true; }
    if (pret && api.flag('prattAmi') && !special(api) && !fired) { api.event('Un groom du Grand Hôtel, essoufflé, vous a retrouvé{e} : Mr Pratt vous fait porter votre courrier.'); deliver(api, true); return true; }
    if (fired || special(api)) return false;
    // les crieurs de journaux, dans les rues
    if (outside(api)) {
      var d = day(api.s.min);
      for (var i = 0; i < CRIEURS.length; i++) {
        var c = CRIEURS[i];
        if (c.d === d && !api.has(c.has) && !api.flag('crieur' + c.d) && (!c.cond || c.cond(api))) {
          api.flag('crieur' + c.d, true);
          api.event('Au coin de la rue, un gamin aux genoux nus agite une liasse de journaux : ' + c.x);
          api.chips([{ label: 'Acheter un journal', action: 'g_journal' }]);
          return true;
        }
      }
    }
    // une pensée qui revient, quand on tourne en rond depuis longtemps
    if (api.s.idle >= 9) {
      var last = api.flag('conseilAt') || -999;
      if (api.s.min - last < 180) return false;
      for (var j = 0; j < CONSEILS.length; j++) {
        var k = CONSEILS[j];
        if (!api.flag('conseil:' + k.k) && k.cond(api)) { api.flag('conseil:' + k.k, true); api.flag('conseilAt', api.s.min); api.event(k.x); return true; }
      }
    }
    return false;
  };
  // Beddows vient vous chercher si vous ne venez pas : l'imposteur a besoin de vous
  L.timeEvents.push({ id: 'billet2', at: at(4, 12, 0), cond: function (api) { return !api.has('BILLET') && !api.flag('cheapsideVu'); },
    run: function (api) {
      if (special(api)) { api.flag('billetAttend', true); return; }
      api.event('Quelqu’un vous touche le coude. Beddows, en manteau gris, mal rasé, les yeux rouges. Il a dû vous suivre depuis l’hôtel.');
      api.arrive('beddows');
      api.npc('beddows', '« Pardon, {m}. Mon maître vous a écrit, la lettre est restée sous votre porte. Il ne peut plus attendre. Je vous en prie. » Il vous glisse une enveloppe dans la main, et le brouillard le reprend avant que vous ayez pu répondre.');
      api.say('Dans l’enveloppe, une carte de visite du professeur Smith, scellée de sa chevalière. Au dos : « Venez sans tarder. Il me reste peu de temps. Que personne ne vous suive. » Et une adresse à Cheapside.');
      api.flag('billetAttend', false); api.take(H.CARTE); api.clue('BILLET'); learn(api, 'cheapside');
    } });

  // ================================================================ filatures
  L.locations.institut.actions.push(
    { id: 'f_moustachu', label: 'Suivre l’homme à la moustache', verbs: ['SUIVRE', 'ALLER', 'VISITER'], nouns: ['MOUSTACHU'], needVerb: true,
      cond: function (api) { return api.has('OBSERVATEUR') && !api.flag('moustachuSuivi'); },
      run: function (api) {
        api.flag('moustachuSuivi', true); api.endTalk(false);
        api.say('Vous vous excusez auprès de vos voisins de table et fendez la foule. L’homme vous a vu venir : il presse le pas vers le vestiaire, récupère un manteau sans attendre de ticket, et sort dans le brouillard.');
        api.say('Dehors, Exhibition Road n’existe plus. Des halos, des formes. Vous le suivez au bruit de ses pas, puis à rien. Au pied d’un réverbère, quelque chose brille sur le pavé mouillé : une plaque de clé en cuivre, encore tiède. « Chelsea Arms, 14. »');
        api.take(CLE); api.clue('CLE14'); learn(api, 'chelsea'); api.time(25);
      } },
    { id: 'f_smith', label: 'Suivre Smith et Beddows', verbs: ['SUIVRE'], nouns: ['SMITH', 'BEDDOWS'], needVerb: true, cond: function (api) { return api.flag('conference'); },
      run: function (api) { api.say('Vous les regardez partir. Beddows aide Smith à monter dans un taxi, lui pose une couverture sur les genoux comme à un vieillard. Le taxi prend la direction de St John’s Wood. Vous connaissez l’adresse : vous y avez dîné vingt fois.'); } }
  );
  L.locations.cheapside.actions.push(
    { id: 'f_beddows', label: 'Guetter Beddows dans la rue', verbs: ['SUIVRE', 'ATTENDRE', 'CACHER'], nouns: ['BEDDOWS', 'PORTE', 'CHEAPSIDE'], bare: true, needVerb: true,
      cond: function (api) { return api.flag('discours') && !api.flag('demasque') && !api.flag('beddowsSeul') && !api.flag('cheapsideFini'); },
      run: function (api) {
        api.flag('beddowsSeul', true); api.endTalk(false); api.time(120);
        api.say('Vous redescendez, et vous attendez sous un porche, en face, le col relevé. Une heure. Deux. Enfin la porte s’ouvre : Beddows sort seul, un cabas à la main, et file vers la seule pharmacie encore éclairée. Vous le rattrapez sous le réverbère.');
        api.say('Il sursaute si fort qu’il lâche son cabas. Des bandes, de la pommade, et trois flacons de laudanum roulent dans le caniveau.');
        api.check('persuasion_beddows_rue');
      } }
  );
  var tj0 = L.checks.toc_journal.resolve;
  L.checks.toc_journal.resolve = function (api, r) { tj0(api, r); if (api.flag('aReconnaitre')) { api.flag('aReconnaitre', false); api.check('san_reconnu'); } };
  L.checks.persuasion_beddows_rue = { skill: 'Persuasion', why: 'faire parler Beddows, loin du lit',
    resolve: function (api, r) {
      api.arrive('beddows'); // dans la rue, devant vous
      if (r.success) {
        api.npc('beddows', '« Je ne sais plus, {m}. Je ne sais plus. » Il ramasse ses flacons à genoux. « Il ne mange plus. Il ne dort plus. Il me parle de choses que Monsieur ne savait pas, en des langues que Monsieur ne parlait pas. Il connaît mon nom comme on connaît un nom qu’on a appris. » Il se relève. « Il a fait retirer mille livres à la banque. Mille livres, {m}. Pour vous. Pourquoi tient-il tant à ce que vous partiez ? »');
        api.say('Puis la peur revient sur son visage comme une marée. « S’il savait que je vous ai parlé… » Il s’enfuit vers la maison sans finir sa phrase.');
        api.clue('SEUL'); if (!api.has('VISAGE')) api.clue('VISAGE');
      } else api.npc('beddows', '« Laissez-moi ! » Il ramasse ses flacons, vous repousse, et court vers la maison. « Il saurait, {m}. Il sait toujours. »');
      api.flag('cheapsideFini', true);
      api.check('san_beddows_rue');
    } };
  L.checks.san_beddows_rue = { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'chasser l’idée qui vous vient', resolve: function (api, r) { api.say(r.success ? 'Un vieux domestique à bout de nerfs. Rien de plus.' : 'Vous levez les yeux vers la fenêtre noire du deuxième étage. Vous avez l’impression, absurde, qu’on vous regarde à travers les rideaux tirés.'); H.taxi(api, 'hotel'); } };
  L.checks.san_feu = { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'garder votre sang-froid devant le feu', resolve: function (api, r) { api.say(r.success ? 'Vous vous forcez à regarder. Les flammes, la silhouette. Tout se grave.' : 'Le ballot, sur l’épaule. La taille d’un homme. Vous ne pouvez pas vous empêcher de le penser : la taille de Smith.'); } };
  L.checks.san_reconnu = { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'chasser ce regard', resolve: function (api, r) { api.say(r.success ? 'Un homme traqué, qui savait peut-être ce qui l’attendait. Il ne vous voulait pas de mal.' : 'Ce geste d’excuse, au banquet. Vous vous demandez, une seconde, s’il s’excusait d’être mort.'); } };
  L.checks.toc_ruines = { skill: 'Trouver Objet Caché', why: 'trouver ce que le feu a épargné',
    resolve: function (api, r) {
      if (r.success) {
        api.say('Sous une poutre effondrée, le coffre-fort du bureau a protégé un fond de tiroir. Des factures, une photographie de Smith avec Houdini, et une lettre au papier roussi.');
        api.doc('Très honoré Professeur, un objet est entré en ma possession, une tête de statue d’un travail très ancien, que je crois liée à vos recherches. Je préférerais ne pas la garder sous mon toit plus longtemps qu’il ne faut. Votre serviteur, M. Makryat, antiquités orientales, 3, Brophy Lane, Islington.', 'Une lettre roussie');
        api.take(LETTRE); api.clue('LETTRE'); if (!api.has('ADRESSE')) api.clue('ADRESSE'); learn(api, 'islington');
      } else api.say('Des cendres, du verre fondu, l’armature tordue d’un fauteuil. Le feu a été méthodique : on dirait qu’il savait quoi chercher. Vous ressortez noir jusqu’aux coudes.');
    } };

  // Rigby peut compléter le témoignage : le cocher l'a conduit à Cheapside
  L.npcs.rigby.topics.push(T('cocher', ['TEMOIN', 'TAXI', 'FUYARD', 'BEDDOWS'], function (api) {
    if (!api.has('FUYARD') && !api.flag('cocherConnu')) { api.npc('rigby', '« Un témoin aurait vu Beddows filer avant le feu. Je cherche le cocher qui l’a pris. Si vous en savez plus, je suis preneur. »'); return; }
    if (day(api.s.min) < 2) { api.npc('rigby', '« Le cocher ? On le cherche. Les cochers de nuit, c’est une race qui dort le jour. Repassez demain. »'); return; }
    api.npc('rigby', '« Le cocher de Lord’s ? On l’a retrouvé, oui. Il a déposé son client dans une ruelle derrière Cheapside, avec son ballot. Mes hommes y sont passés : personne n’a rien vu, comme toujours dans ce quartier. » Il vous regarde. « Pourquoi ? Vous avez une idée ? »');
    learn(api, 'cheapside');
  }, { chip: 'Le cocher', cond: function (api) { return api.has('FUYARD') || api.flag('cocherConnu'); } }));
  // le buraliste a vu repartir le train
  L.npcs.voisin.topics.push(T('client', ['TRAIN', 'MAQUETTE', 'STANLEY', 'QUELQUUN'], function (api) {
    api.npc('voisin', '« Le dernier client de la boutique ? Un maigre, avec des lunettes, qui est reparti avec une grande caisse dans les bras. Un train, qu’il disait, un train miniature, comme un gosse. Il m’a demandé le chemin de l’omnibus de Stoke Newington. »');
    learn(api, 'stoke');
  }, { chip: 'Le dernier client', cond: function (api) { return day(api.s.min) >= 3; } }));
  // le week-end : le vivre, ou le laisser passer
  L.locations.hotel.actions.push({ id: 'h_weekend', label: 'Laisser passer le week-end', verbs: ['ATTENDRE', 'DORMIR'], nouns: ['WEEKEND', 'HEURE', 'SMITH'], repeatable: true,
    cond: function (api) { return day(api.s.min) < 3 && !api.has('BILLET') && !api.flag('cheapsideVu'); },
    run: function (api) {
      if (api.has('FUYARD')) api.say('Les jours suivants, vous ne tenez pas en place. Vous revoyez le ballot sur l’épaule, la démarche raide. La police ne vous rappelle pas.');
      else if (api.has('INCENDIE')) api.say('Les jours suivants passent dans l’odeur de la suie. Smith reste introuvable. Vous attendez un signe de lui, et rien ne vient.');
      else api.say('Les jours suivants passent comme passent les jours d’hiver. Smith devait vous inviter à dîner. Il ne vous fait pas signe. Vous mettez cela sur le compte de ses travaux.');
      api.s.min = at(3, 8, 30); api.s.tick = 0;
      api.title('Lundi 8 janvier 1923', 'Le week-end a passé');
      api.say('Le garçon d’étage a glissé les journaux du matin sous la porte. Dehors, le brouillard n’a pas bougé.');
    } });
  // l'hôtel : Mr Pratt, à la réception
  L.locations.hotel.things.push({ label: 'Mr Pratt, à la réception', ids: ['RECEPTION'] });
  L.locations.hotel.actions.push({ id: 'h_concierge', label: 'Descendre parler au concierge', idea: true, talkTo: 'concierge', verbs: ['PARLER', 'ALLER', 'DONNER', 'COMMANDER', 'UTILISER', 'POLI'], nouns: ['RECEPTION', 'TELEGRAMME', 'ANNONCE'],
    extra: ['NOTE', 'SMITH', 'INCENDIE', 'TAXI', 'ARCHIVES', 'BILLETS', 'MEURTRES', 'ARGENT'], run: function (api, p) { api.talk('concierge', p); } });
  // la clé du 14 ouvre l'escalier du Chelsea Arms, la nuit
  L.locations.chelsea.actions.forEach(function (a) {
    if (a.id !== 'ch_monter') return;
    var r0 = a.run;
    a.run = function (api, p) {
      var nuit = hour(api.s.min) >= 23 || hour(api.s.min) < 6;
      if (!api.item(CLE) || !nuit || api.flag('ch14Vue')) { if (api.item(CLE) && !nuit && !api.flag('ch14Vue')) api.say('Avec un agent dans l’escalier ? Il faudrait revenir quand l’hôtel dort.'); r0(api, p); return; }
      api.flag('ch14Vue', true); api.time(20);
      api.say('Passé minuit, l’agent a disparu et le veilleur ronfle. La clé tourne dans la serrure du 14, sous les scellés que vous décollez du bout de l’ongle.');
      api.say('Trois lits. Sur le plancher, trois taches brunes que le savon n’a pas fait partir, alignées comme les marches d’un escalier. Dans la corbeille que la police a oubliée, un talon de reçu du télégraphe, rédigé en français : « Gare de Lyon, 2 janvier. »');
      if (!api.has('TELEGRAMME')) api.clue('TELEGRAMME');
      api.check('san_ch14');
    };
  });
  L.checks.san_ch14 = { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'rester dans cette chambre', resolve: function (api, r) { api.say(r.success ? 'Vous refermez doucement. Personne ne vous a vu.' : 'En refermant, vous avez la certitude que les trois lits sont défaits. Ils ne l’étaient pas en entrant.'); } };

  // ================================================================ les recherches de Mrs Pike
  function search(api, what) {
    var doyle = api.pc.key === 'doyle';
    if (!doyle && !api.flag('pikePaye')) {
      if (!api.pay(0.125)) { api.npc('pike', '« Une demi-couronne, {m}. Pas un penny de moins. »'); return; }
      api.flag('pikePaye', true); api.say('Vous posez une demi-couronne sur le comptoir. Elle disparaît.');
    }
    api.time(60);
    if (what === 'alexis') {
      api.doc('DÉRAILLEMENT DE L’EXPRESS DE LIVERPOOL — Quarante-trois morts. Parmi eux, M. Randolph Alexis, de Hampstead, connu dans certains salons pour ses travaux d’occultisme. Fait inexpliqué : la moitié avant du convoi, locomotive comprise, n’a pas été retrouvée.', 'Daily Courier · 1897');
      api.doc('UNE PIÈCE PLEINE DE FUMÉE — M. Albert Alexis, fils du regretté Randolph Alexis, a disparu de sa bibliothèque fermée de l’intérieur. Les domestiques parlent d’une fumée âcre, sans flammes.', 'Daily Courier · 1917');
      if (!api.has('ALEXIS')) api.clue('ALEXIS');
      return;
    }
    if (what === 'makryat') {
      api.npc('pike', '« Makryat… Une seule mention, {m}, en 1911 : une vente aux enchères. » Elle vous tend le volume, ouvert sur une photographie de presse.');
      api.say('Un vieillard voûté, au visage creusé, à la barbe blanche, pose à côté d’un tapis de prière. « M. Mehmet Makryat, antiquaire, d’Islington. » En 1911, l’homme avait déjà soixante-dix ans au moins.');
      if (!api.has('ADRESSE')) { api.clue('ADRESSE'); learn(api, 'islington'); }
      api.flag('photoMakryat', true);
      return;
    }
    if (what === 'stanley') { api.npc('pike', '« L’homme parti en fumée ? C’est dans le Scoop de mardi, {m}. Nous ne le gardons que par charité. »'); var keep = api.flag('stanleyDispo'); api.flag('stanleyDispo', true); if (!api.has('STANLEY') && api.has('BILLET')) H.lirePresse(api); else if (!api.has('STANLEY')) { api.say('Un entrefilet : Henry Stanley, 41 ans, de Stoke Newington, passionné de chemins de fer, a disparu lundi soir dans une chambre pleine de fumée.'); api.clue('STANLEY'); learn(api, 'stoke'); } if (!keep) api.flag('stanleyDispo', keep); return; }
    api.npc('pike', api.fresh('pikeSmith', ['« Le professeur Smith ? Nous avons un dossier gros comme ça. » Des médiums démasqués, des procès gagnés, un portrait avec Houdini. ' + (brule(api) ? 'Rien qui explique un incendie.' : 'Rien qui explique pourquoi il s’est enfermé chez lui.'), '« Toujours rien de neuf sur votre professeur, {m}. Sauf ce que vous savez déjà. »']));
  }

  // ================================================================ improvisations : violence, pots-de-vin, effractions
  var VIOLENCE = /\b(tue[rsz]?|tuons|abat\w*|frappe[rsz]?|cogne[rsz]?|etrangl\w*|poignard\w*|egorg\w*|assomm\w*|gifl\w*|tabass\w*|bastonn\w*|coups? de (poing|pied|tete|couteau)|tire[rsz]? sur|agress\w*|bouscul\w*|empoign\w*|plaqu\w* (au|contre)|casse[rsz]? la (gueule|figure)|saute[rsz]? (dessus|a la gorge))\b/;
  var CORRUPTION = /\b(potdevin|soudoy\w*|corromp\w*|pourboire|bakchich|achet\w* (son|votre|ton) silence)\b/;
  var ARGENTX = /\b(livres?|shillings?|couronnes?|pence|billet de \w+|souverain\w*|guinees?)\b/;
  var EFFRACTION = /\b(effraction|cambriol\w*|crochet\w*|forcer? (la|une) (porte|serrure|fenetre)|forcez (la|une) (porte|serrure|fenetre)|entrer de nuit|(entrer|passer|grimper|monter|rentrer) par la fenetre|escalad\w*)\b/;
  var CIVIL = /^(hotel|yard|chelsea|ambassade|islington|boutique|musee|stoke|chambre_stanley|camberwell|archives|stjohn|victoria|institut)$/;
  var NPCMAP = { FLEMING: 'fleming', RIGBY: 'rigby', MUSTAPHA: 'mustapha', VOISIN: 'voisin', ATKINS: 'atkins', SERGENT: 'sergent', BUTTER: 'butter', BIBLIOTHECAIRE: 'bibliothecaire', ARCHIVISTE: 'pike', TEMOIN: 'laitier', SMITH: 'smith', BEDDOWS: 'beddows' };
  function npcFor(id, here) { if (id === 'RECEPTION') return here === 'hotel' ? 'concierge' : here === 'chelsea' ? 'chelseaclerk' : null; if (id === 'POLICE') return here === 'stjohn' ? 'agentsj' : null; return NPCMAP[id] || null; }
  // la personne visée : celle qu'on nomme, sinon la seule présente
  function target(api, p) {
    if (api.s.talk) return api.s.talk;
    var here = loc(api), named = null, any = [];
    (L.locations[here].things || []).forEach(function (t) {
      if (t.cond && !t.cond(api)) return;
      (t.ids || []).forEach(function (id) { var n = npcFor(id, here); if (!n) return; if (any.indexOf(n) < 0) any.push(n); if (p && p.c[id] !== undefined && !named) named = n; });
    });
    if (named) return named;
    // on a nommé quelqu'un ou quelque chose qui n'est pas là : on ne devine pas
    if (p && p.nouns && p.nouns.some(function (n) { var c = api.label ? null : null; return n && n.id && !/^(ARGENT|LIVRE|BILLETS|POLICE|QUELQUUN)$/.test(n.id); })) return null;
    return any.length === 1 ? any[0] : null;
  }
  function present(api) { if (api.s.talk) return api.s.talk; var found = null, here0 = loc(api); (L.locations[loc(api)].things || []).forEach(function (t) { (t.ids || []).forEach(function (id) { var map = { RECEPTION: here0 === 'hotel' ? 'concierge' : 'chelseaclerk', POLICE: here0 === 'stjohn' ? 'agentsj' : null, FLEMING: 'fleming', RIGBY: 'rigby', MUSTAPHA: 'mustapha', VOISIN: 'voisin', ATKINS: 'atkins', SERGENT: 'sergent', BUTTER: 'butter', BIBLIOTHECAIRE: 'bibliothecaire', ARCHIVISTE: 'pike', TEMOIN: 'laitier', SMITH: 'smith', BEDDOWS: 'beddows' }; if (!found && map[id] && (!t.cond || t.cond(api))) found = map[id]; }); }); return found; }
  L.intercept = function (api, p, raw) {
    var t = ' ' + norm(raw) + ' ';
    var here = loc(api);
    // ---- la violence a un prix
    var head = ' ' + t.trim().split(/\s+/).slice(0, 6).join(' ') + ' ';
    // « j'ai essayé de l'étrangler », « il m'a frappé », « si je le tuais » : un récit, pas un geste
    if (G.RPG.recit(raw)) return false;
    if (VIOLENCE.test(head) && raw.indexOf('?') < 0 && !/\b(qui|pourquoi|comment|quand|est ce|a ete|ont ete|a tue|ont tue|avait tue|le temps|porte|portes|fenetre|vitre|mur|table|comptoir|meurtres?|morts?)\b/.test(t) && CIVIL.test(here)) {
      var who = target(api, p);
      if (!who) return false;
      return L._c.fight ? L._c.fight(api, who, p, raw) : arrest(api, who);
    }
    // ---- les pots-de-vin
    if (CORRUPTION.test(t) || ((p.c.DONNER !== undefined || /\bglisse\w*\b/.test(t)) && (p.c.ARGENT !== undefined || ARGENTX.test(t)))) { var tg = target(api, p); if (tg) return bribe(api, tg); }
    // ---- les effractions
    if (!api.s.talk && EFFRACTION.test(t)) return breakIn(api, here);
    return false;
  };
  function arrest(api, who, quiet) {
    var n = (api.flag('arrestations') || 0) + 1;
    api.flag('arrestations', n);
    var name = who && L.npcs[who] ? (L.npcs[who].short || L.npcs[who].name) : 'quelqu’un';
    api.endTalk(false);
    if (who) { var st = api.npcs(who); st.closedUntil = api.s.min + 100000; st.patience = 0; }
    var scenes = {
      yard: 'Vous n’avez pas levé la main que trois agents vous plaquent contre le carrelage du hall. À Scotland Yard, ce n’est pas une bonne idée. C’est même la pire.',
      hotel: 'Mr Pratt pousse un petit cri. Deux grooms vous ceinturent, le portier siffle, et un agent surgit du brouillard comme s’il attendait derrière la porte.',
      musee: 'Des « chut » scandalisés, puis des cris. Les gardiens du British Museum vous traînent sous la coupole, devant quatre cents lecteurs ravis de la distraction.'
    };
    if (!quiet) api.say(scenes[api.s.loc] || 'Votre geste part avant votre pensée. ' + name.charAt(0).toUpperCase() + name.slice(1) + ' crie, des passants accourent, un sifflet de police perce le brouillard. Deux agents vous empoignent avant que vous ayez compris ce que vous venez de faire.');
    api.say(n === 1
      ? 'La nuit au poste de Bow Street, sur un banc de bois, entre un pickpocket et un marin qui chante. Au matin, on vous conduit dans le bureau d’un inspecteur aux yeux cernés.'
      : 'Encore le poste. Cette fois, on prend votre nom, vos empreintes, et deux nuits de votre temps. Le juge vous inflige cinq livres d’amende.');
    var d = day(api.s.min) + n;
    api.s.min = d * D + 9 * 60; api.s.tick = 0;
    if (n > 1) api.pay(5);
    api.go('yard');
    if (api.flag('mort:fleming')) api.say(n === 1 ? 'Un inspecteur que vous ne connaissez pas referme votre dossier. « Une fois. Pas deux. »' : 'Le même inspecteur, plus las encore. « La prochaine fois, c’est le juge d’instruction. »');
    else api.npc('fleming', n === 1 ? '« Fleming. On me dit que vous êtes un ami du professeur Smith. Alors je vais faire comme si cette nuit n’avait pas existé. » Il referme votre dossier. « Une fois. »' : '« Encore vous. La prochaine fois, c’est le juge d’instruction, et je ne lèverai pas le petit doigt. »');
    if (who === 'fleming') api.say('L’inspecteur ne vous adressera plus la parole. Ni aujourd’hui, ni plus tard.');
    api.lose(1);
    return true;
  }
  function bribe(api, who) {
    var once = api.once('pdv:' + who), cost = 1;
    var R = {
      chelseaclerk: function () { if (!api.pay(cost)) return '« Avec quoi, {m} ? »'; api.npc('chelseaclerk', '« Une livre… » Il la fait glisser sous son registre. « Ils sont arrivés séparément, chacun sa valise, à des heures différentes. Tous les trois ont demandé la chambre 14, et tous les trois ont demandé si un certain professeur Smith avait laissé un message. » Il se racle la gorge. « Je n’ai rien dit. »'); learn(api, 'stjohn'); return null; },
      voisin: function () { if (!api.pay(0.25)) return '« Gardez vos sous. »'; api.npc('voisin', '« Cinq shillings ? Pour ce prix-là, je vous dis même ce que je n’ai pas vu. » Il baisse la voix. « Un client est reparti avec une caisse, un train miniature. Il habitait Stoke Newington, il me l’a dit. »'); learn(api, 'stoke'); return null; },
      sergent: function () { if (!api.pay(cost)) return '« Pas de quoi, {m}. »'; api.npc('sergent', '« Pour l’orphelinat de la police, bien sûr. » Le billet disparaît dans sa tunique. « Le seul ami de Stanley, c’est un M. Butter, à Camberwell. Un fou de trains, lui aussi. »'); learn(api, 'camberwell'); return null; },
      agentsj: function () { if (!api.pay(0.25)) return '« Rangez ça, {m}. »'; api.flag('agentLaisse', true); api.npc('agentsj', '« Pour un thé, alors. » Il empoche les pièces et s’éloigne vers la grille d’en face. « J’en ai pour dix minutes, {m}. Dix. »'); api.chips([{ label: 'Fouiller les ruines', action: 'sj_fouiller' }]); return null; },
      concierge: function () { api.pay(0.25); api.npc('concierge', '« C’est trop aimable, {m}. » Les pièces disparaissent. « Si quelque chose arrive pour vous, je vous le ferai porter où que vous soyez. » Il se penche. « Et le groom dit qu’un homme en manteau gris a demandé votre numéro de chambre, samedi. Je ne le lui ai pas donné. »'); api.flag('prattAmi', true); return null; },
      pike: function () { api.pay(0.25); api.flag('pikePaye', true); api.npc('pike', '« Ça ne se fait pas, {m}. » Elle empoche quand même. « Les recherches sont gratuites, pour vous. Désormais. »'); return null; },
      laitier: function () { api.pay(0.1); api.npc('laitier', '« Merci bien, {m} ! » Il se gratte la tête. « Je vais vous dire une chose que j’ai pas dite à la police : le ballot, sur son épaule, il bougeait. Un peu. Ou alors c’est moi. »'); return null; },
      fleming: function () { api.npc('fleming', 'Fleming regarde votre main, puis vous. Longtemps. « Sortez. Avant que je me souvienne de ce que dit la loi sur la corruption d’un officier de police. »'); var st = api.npcs('fleming'); st.closedUntil = api.s.min + 100000; api.endTalk(false); return null; },
      mustapha: function () { api.npc('mustapha', 'L’attaché pâlit, puis rougit. « Monsieur, vous êtes dans une ambassade de la République turque, pas dans un bazar. » Il se lève. L’entretien est terminé.'); api.npcs('mustapha').closedUntil = api.s.min + 600; api.endTalk(false); return null; },
      bibliothecaire: function () { return '« Le British Museum ne se vend pas. Chut. »'; },
      atkins: function () { api.npc('atkins', '« Rangez ça tout de suite ! Je ne suis pas une de ces logeuses de Soho. » Mais elle vous ressert du thé, et sa voix s’adoucit. « Vous êtes un bon garçon de vouloir aider M. Stanley. Une bonne fille. Enfin. »'); api.calm('atkins', 3); return null; },
      butter: function () { return '« De l’argent ? Mais pour quoi faire, grands dieux ? Asseyez-vous plutôt, je vais vous montrer mes boggies. »'; },
      rigby: function () { return '« Remettez ça dans votre poche, {m}, et je ferai comme si je n’avais rien vu. »'; },
      smith: function () { return 'Pas un mot. La main bandée repousse la vôtre.'; },
      beddows: function () { return '« Mon maître a de l’argent, {m}. Il vous en a donné. » Il regarde le lit. « C’est le reste qui lui manque. »'; }
    };
    var f = R[who];
    if (!once && who !== 'fleming' && who !== 'mustapha') { api.npc(who, api.fresh('pdv2', ['« Vous m’avez déjà payé, {m}. Je n’ai rien de plus à vendre. »', 'On vous regarde comme on regarde quelqu’un qui insiste un peu trop.'])); return true; }
    var line = f ? f() : api.fresh('pdvX', ['« Je ne suis pas sûr de comprendre ce que vous me tendez, {m}. » On fait mine de ne rien voir.', 'Votre billet reste en l’air, puis vous le rangez, un peu honteux.']);
    if (line) api.npc(who, line);
    return true;
  }
  function breakIn(api, here) {
    var n = api.count('effr:' + here);
    var h = hour(api.s.min), nuit = h >= 22 || h < 6;
    if (here === 'stjohn' && brule(api)) { api.exec('sj_fouiller'); return true; }
    if (here === 'islington') { api.exec('is_arriere'); return true; }
    if (here === 'chelsea') { if (api.item(CLE)) api.exec('ch_monter'); else api.say('La chambre 14 est sous scellés, au troisième, et un agent garde l’escalier. Sans clé et sans nuit noire, inutile d’y penser.'); return true; }
    if (here === 'musee') {
      if (n === 0) { api.say('Vous regardez les grilles du British Museum, les gardiens en uniforme, les rondes qu’on devine. Ce n’est pas un musée, c’est une forteresse. Vous auriez plus de chances avec une carte de lecteur.'); return true; }
      api.say('Vous insistez. Un gardien vous regarde, puis un autre. On vous raccompagne fermement jusqu’à la grille. « Ne revenez pas aujourd’hui, {m}. »'); api.s.min += 60; api.go('hotel'); return true;
    }
    if (here === 'ambassade') { api.say('Forcer une ambassade ? Vous imaginez déjà la une du Times, et l’incident diplomatique. Mustapha Köprülü répond plus volontiers à une lettre de recommandation qu’à un pied-de-biche.'); return true; }
    if (here === 'yard') { api.say('Cambrioler Scotland Yard. Vous souriez malgré vous. Non.'); return true; }
    if (here === 'stoke' || here === 'chambre_stanley') { api.say(nuit ? 'Mrs Atkins dort, dit-on, avec un tisonnier sur la table de chevet. Elle vous ouvrira bien plus volontiers si vous sonnez demain matin.' : 'Mrs Atkins est là, et ne demande qu’à vous faire visiter. Inutile de crocheter quoi que ce soit.'); return true; }
    if (here === 'camberwell') { api.say('Butter ouvrirait sa cave au premier venu qui lui parle d’écartement des rails. Inutile de forcer quoi que ce soit.'); return true; }
    api.say(api.fresh('effrX', ['Il n’y a rien ici qui vaille une effraction.', 'Forcer quoi, au juste ? Ici, tout est ouvert, ou rien ne vaut la peine.']));
    return true;
  }

  L._c = { arrest: arrest, target: target, norm: norm, VIOLENCE: VIOLENCE, CIVIL: CIVIL, special: special };
  // ================================================================ verbes génériques
  L.generic.verbs.SUIVRE = ['Suivre qui ? Personne ici ne vous en donne envie.', 'Vous emboîtez le pas à un passant, par réflexe. Il entre dans un pub. Vous laissez tomber.', 'Pour filer quelqu’un, encore faut-il quelqu’un à filer.'];
  // l'aide mentionne les nouveaux gestes
  var help0 = L.help;
  L.help = function (api) { help0(api); api.sys('Vous pouvez aussi improviser : suivre quelqu’un, envoyer un télégramme ou passer une annonce depuis l’hôtel, fouiller les archives de Fleet Street, glisser un billet. Le monde réagit, parfois mal.'); };
})(typeof window !== 'undefined' ? window : globalThis);
