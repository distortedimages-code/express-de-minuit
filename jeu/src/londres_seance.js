/* Londres : la séance de Mrs Vane, à Gordon Square.
   Un embranchement facultatif, écrit pour ce jeu : une médium que Smith a jadis démasquée,
   une séance truquée où, ce soir-là, quelque chose de vrai passe par la table.
   C'est un troisième chemin vers l'histoire des Alexis et vers l'énigme du motif en relief. */
(function (G) {
  'use strict';
  var L = G.CHAPTERS.londres; if (!L) return;
  var H = L._h, T = H.T, day = H.day, hour = H.hour, D = H.D, learn = H.learn;
  var JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  function dimanche(api) { return JOURS[(4 + day(api.s.min)) % 7] === 'dimanche'; }
  function loc(api) { return api.s.loc; }

  // ================================================================ vocabulaire
  var baseLex = L.lexicon;
  L.lexicon = function (Lx) {
    baseLex(Lx);
    Lx.add('VANE', 'n', 'vane, hortense, gordon', { label: 'Mrs Vane', npc: true });
    Lx.add('SEANCE', 'x', 'seance, seances, ectoplasme, ectoplasmes, transe, ouija, planchette, tournantes', { label: 'la séance' });
    Lx.add('TRUCAGE', 'x', 'trucage, trucages, truque, truquee, clochette, gaze, mousseline, complice, compere, supercherie, fraude, fil de fer, triche, tricher, trichez, trichent, charlatan, charlatans, escroquerie', { label: 'les trucages' });
    Lx.add('ASSISTER', 'v', 'assister, participer, prendre part, prendre place');
  };
  L.phrases.unshift(
    [/\b(mrs|madame|mme|miss) vane\b|\bla medium\b|\bla voyante\b/g, ' vane '],
    [/\bgordon square\b/g, ' gordon '],
    [/\btables? tournantes?\b|\bfaire tourner (les |la )?tables?\b/g, ' seance '],
    [/\bgueridons?\b/g, ' table ']
  );

  // ================================================================ indices
  L.clues.VANE = { title: 'Une médium à Gordon Square', text: 'Mrs Hortense Vane, que Smith a démasquée chez Lady Ashworth, tient séance chaque soir à neuf heures, sauf le dimanche. À deux pas de votre hôtel.' };
  L.clues.VOIX = { title: 'La voix de la séance', text: 'Chez Mrs Vane, une voix de jeune homme a parlé à travers elle. Elle disait s’appeler Albert : « La voie n’est pas plate, papa. Il faut qu’elle monte et qu’elle descende. » Puis : « Il a faim. »' };
  L.clues.TRUQUEE = { title: 'Une séance truquée… presque', text: 'Le guéridon de Mrs Vane est truqué : une sonnette à fil, de la gaze dans un tiroir, un neveu derrière le rideau. Mais le froid et l’odeur de charbon, eux, ne figuraient pas au programme.' };

  // ================================================================ le lieu
  H.PLACES.vane = { label: 'le salon de Mrs Vane, à Gordon Square', concept: 'VANE', also: ['SEANCE'], hours: [19, 24],
    closed: 'Mrs Vane ne reçoit que le soir, à partir de 19 h. Ses rideaux de velours sont tirés sur Gordon Square.' };
  L.globalActions.unshift(H.goAct('vane'));

  function seanceOuverte(api) { return !dimanche(api) && hour(api.s.min) >= 19 && !api.flag('seanceFaite'); }

  L.locations.vane = {
    name: 'Gordon Square, le salon de Mrs Vane', art: 'bureau',
    enter: function (api, first) {
      if (api.flag('seanceFaite')) {
        api.say(api.fresh('vaneApres', ['La porte du 31, Gordon Square, s’ouvre de dix centimètres, la chaîne mise. Mrs Vane, sans fard, en robe de chambre, vous regarde à travers la fente. Derrière elle, le salon est éteint.', 'Les rideaux de Mrs Vane sont tirés. On a ôté la plaque de cuivre de la porte. Il reste quatre trous de vis.']));
        return;
      }
      if (first) {
        api.say('Au premier étage d’une maison de Gordon Square, un salon tendu de velours prune, si chauffé que les vitres pleurent. Une douzaine de chaises autour d’un guéridon nappé de noir. Des photographies d’ectoplasmes encadrées comme des portraits de famille. Et, dans un fauteuil à oreilles, une dame forte et poudrée, couverte de jais, qui vous sourit comme si elle vous attendait.');
        if (dimanche(api)) api.say('Une pancarte, sur le guéridon : « Le dimanche, les esprits se reposent. »');
        return;
      }
      api.say(api.fresh('vaneR', ['Le salon de velours prune. Mrs Vane vous salue d’un éventail.', 'Retour à Gordon Square. Les habitués chuchotent déjà autour du guéridon.']));
    },
    things: [
      { label: 'Mrs Vane', ids: ['VANE', 'QUELQUUN'] },
      { label: 'le guéridon', ids: ['SEANCE', 'TABLE', 'TRUCAGE'] },
      { label: 'les habitués', ids: ['QUELQUUN'] },
      { label: 'les rideaux de velours', ids: ['FENETRE'] },
      { label: null, ids: ['SALLE', 'LAMPE', 'PORTE'] }
    ],
    ambient: ['Une habituée tricote en attendant les esprits.', 'Le poêle ronfle. On étouffe.', 'Quelqu’un, derrière le rideau du fond, tousse et se tait aussitôt.'],
    actions: [
      { id: 'vn_look', label: 'Observer le salon', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'VANE'], bare: true,
        run: function (api) {
          if (api.flag('seanceFaite')) { api.say('Vous ne voyez rien d’autre qu’une porte entrouverte et une femme qui a peur.'); return; }
          api.say(api.fresh('vnlook', [
            'Les habitués : deux veuves de guerre, un colonel en retraite qui prend des notes, une jeune fille pâle qui ne quitte pas sa mère. Tout le monde a perdu quelqu’un. Tout le monde attend qu’on lui réponde.',
            'Le rideau du fond bouge, alors qu’aucune fenêtre n’est ouverte. Sous le guéridon, le tapis est usé en demi-cercle, du côté du fauteuil de Mrs Vane, comme si on y faisait souvent glisser un pied.'
          ]));
        } },
      { id: 'vn_vane', label: 'Parler à Mrs Vane', idea: true, talkTo: 'vane', verbs: ['PARLER', 'PERSUADER', 'BARATIN', 'POLI', 'DONNER', 'FLATTER', 'INSISTER'], nouns: ['VANE', 'QUELQUUN'],
        extra: ['SMITH', 'HANTISE', 'SEANCE', 'TRUCAGE', 'STANLEY', 'ATKINS', 'ALEXIS', 'TRAIN', 'FANTOME', 'ARGENT'], run: function (api, p) { api.talk('vane', p); } },
      { id: 'vn_seance', label: 'Assister à la séance', idea: true, ideaCond: seanceOuverte, verbs: ['ASSISTER', 'ATTENDRE', 'ALLER', 'ASSEOIR', 'MAGIE', 'UTILISER'], nouns: ['SEANCE', 'HANTISE', 'TABLE'], bare: true, needVerb: true,
        cond: function (api) { return !api.flag('seanceFaite'); },
        run: function (api) { seance(api); } },
      { id: 'vn_trucs', label: 'Chercher les trucages', idea: true, ideaCond: function (api) { return !api.flag('trucsCherches'); }, verbs: ['FOUILLER', 'EXAMINER', 'OUVRIR'], nouns: ['TRUCAGE', 'TABLE', 'SEANCE', 'FENETRE'], bare: true,
        cond: function (api) { return !api.flag('trucsCherches'); },
        run: function (api) {
          if (api.flag('seanceFaite') && api.flag('vaneFermee')) { api.say('La porte s’est refermée. Le salon vous est interdit.'); return; }
          api.flag('trucsCherches', true);
          api.say(api.flag('seanceFaite') ? 'Pendant que les habitués s’occupent de Mrs Vane, vous passez la main sous le guéridon.' : 'Pendant que Mrs Vane accueille une veuve en larmes, vous laissez tomber votre gant près du guéridon.');
          api.check('toc_vane');
        } }
    ]
  };

  // ---------------------------------------------------------------- la séance
  function seance(api) {
    if (dimanche(api)) { api.say('« Pas le dimanche, très {cher}. » Mrs Vane désigne la pancarte avec son éventail. « Même les morts ont droit au repos. Revenez demain, à neuf heures. »'); return; }
    var h = hour(api.s.min);
    if (h < 19) { api.say('Mrs Vane ne reçoit pas encore.'); return; }
    if (h < 21) {
      api.say('Vous prenez une chaise contre le mur et vous attendez. Les habitués arrivent un à un, se saluent à voix basse, posent leurs chapeaux sur leurs genoux. À neuf heures précises, Mrs Vane éteint les lampes une à une.');
      api.s.min = api.s.min - (api.s.min % D) + 21 * 60; api.s.tick = 0;
    } else if (h >= 23) { api.say('« Trop tard, très {cher}. Les esprits n’aiment pas les retardataires. Revenez demain, à neuf heures. »'); return; }
    api.flag('seanceFaite', true);
    api.pay(1);
    api.say('Une guinée dans la soucoupe, comme tout le monde. On se donne la main autour du guéridon. Il ne reste qu’une bougie, sous un globe de verre rouge.');
    api.say('Le spectacle commence. La table frappe un coup, puis deux. Une clochette tinte quelque part au plafond. Une forme blanche et vaporeuse se gonfle au-dessus de l’épaule de Mrs Vane, qui annonce d’une voix de tête « le petit Edward, tombé à Ypres », et une des veuves se met à sangloter. C’est bien fait. C’est très bien fait.');
    api.fx('flicker');
    api.say('Puis il fait froid. Pas frais : froid, d’un coup, comme une porte ouverte sur l’hiver. La bougie se couche sans s’éteindre. Une odeur monte, que tout le monde reconnaît, celle des quais de gare : charbon mouillé, vapeur, fer chaud. Très loin, un sifflet de locomotive. Mrs Vane s’est tue. Elle a les yeux ouverts, et elle ne joue plus.');
    var l = 'La voix qui sort de sa bouche n’est pas la sienne. Une voix d’homme jeune, essoufflée, qui parle trop vite : « Papa ? Papa, c’est Albert. Je l’ai fait venir, tu vois, j’ai compris. La voie n’est pas plate, papa. Il faut qu’elle monte et qu’elle descende, sinon il ne vient pas. »';
    api.say(l);
    if (api.has('STANLEY')) api.say('« Le monsieur des trains est avec nous, maintenant. Le monsieur de Stoke Newington. Il pleure tout le temps. Papa le regarde comme il me regardait. »');
    api.say('Un silence. Puis, tout bas, comme un enfant qui avoue : « Ne montez pas. Il a faim. Il a toujours faim. » La table se fend d’un craquement sec. Quelqu’un crie. Les lampes se rallument, et Mrs Vane glisse de sa chaise, évanouie, une mousse grise au coin des lèvres.');
    api.clue('VOIX');
    api.time(60);
    api.check('san_seance');
  }

  // ================================================================ jets
  L.checks.san_seance = { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d4'], why: 'garder la tête froide',
    resolve: function (api, r) {
      api.say(r.success ? 'Vous lâchez les mains de vos voisins. Elles étaient glacées. Les vôtres aussi.'
        : 'Pendant une longue minute, vous entendez encore le sifflet. Vous comptez les secondes entre deux coups, comme pour savoir à quelle distance il se trouve.');
      if (api.s.loc === 'vane' && !api.s.talk) { api.say('On allonge Mrs Vane sur le sofa. Quand elle rouvre les yeux, c’est vous qu’elle cherche du regard.'); api.talk('vane'); }
    } };
  L.checks.toc_vane = { skill: 'Trouver Objet Caché', why: 'repérer les trucages de la médium',
    resolve: function (api, r) {
      if (!r.success) { api.say('Sous le guéridon, du bois, de la poussière, et la chaussure d’une veuve qui vous regarde de travers. Si la table est truquée, c’est mieux fait que vous ne pensez.'); return; }
      api.say('Sous le plateau, un fil de fer très fin, qui court jusqu’au pied du fauteuil de Mrs Vane : c’est lui qui fait tinter la clochette. Dans le tiroir du guéridon, une longue écharpe de gaze, enduite de quelque chose qui luit faiblement. Et derrière le rideau du fond, un garçon maigre assis sur un tabouret, qui vous regarde avec des yeux de lapin.');
      if (api.flag('seanceFaite')) api.say('Tout est là : la clochette, le fantôme d’Edward, les coups dans la table. Tout, sauf le froid, l’odeur de charbon et la voix d’Albert. Le garçon derrière le rideau tremble encore plus que vous.');
      api.flag('truquee', true); api.clue('TRUQUEE');
    } };

  // ================================================================ Mrs Vane
  L.npcs.vane = H.npc({ id: 'vane', name: 'Mrs Hortense Vane, médium', short: 'Mrs Vane', patience: 7, cooldown: 30, selfKeys: ['VANE'],
    greet: function (api, first) {
      if (api.flag('seanceFaite')) { api.npc('vane', first ? 'Mrs Vane a perdu ses bijoux et sa voix de scène. « Vous étiez là. Vous l’avez entendu, vous aussi. »' : '« Encore vous. » Elle serre son châle. « Parlez vite. »'); return; }
      api.npc('vane', first ? '« Bienvenue, très {cher}. Je vous attendais. » Elle laisse passer un temps. « C’est ce que je dis à tout le monde, voyez-vous. Et tout le monde me croit. »' : api.fresh('vaneG', ['« Très cher ? »', '« Les esprits vous ont manqué ? »', 'Mrs Vane vous tend sa main baguée à baiser.']));
    },
    bye: '« Que vos morts vous gardent, très {cher}. »',
    deflect: ['« Les esprits ne m’ont rien dit là-dessus, très {cher}. »', 'Elle agite son éventail, comme pour chasser la question.', '« Posez-moi plutôt une question sur l’au-delà. C’est ma spécialité. »'],
    topics: [
      T('seance', ['SEANCE', 'HANTISE', 'ARGENT'], function (api) {
        if (api.flag('seanceFaite')) { api.npc('vane', '« Il n’y aura plus de séance, très {cher}. Ni ici ni ailleurs. Je vends le guéridon. »'); return; }
        api.npc('vane', dimanche(api) ? '« Demain soir, à neuf heures. Une guinée, et vous verrez ce que vous êtes venu voir. »' : '« À neuf heures, très {cher}. Une guinée dans la soucoupe. Et je ne promets rien : les esprits sont comme les chats, ils viennent quand ils veulent. »');
        if (seanceOuverte(api)) api.chips([{ label: 'Assister à la séance', action: 'vn_seance' }]);
      }, { chip: 'La séance de ce soir' }),
      T('smith', ['SMITH', 'CONFERENCE'], function (api, n) {
        var l = ['« Smith. » Le nom lui fait plisser la bouche. « En 1921, chez Lady Ashworth, il a rallumé les lampes au beau milieu d’une apparition et il a tiré sur ma gaze devant vingt personnes. J’ai perdu la moitié de ma clientèle en une soirée. »',
          '« Et maintenant, d’après les journaux, il croit aux revenants. » Elle a un petit rire sans joie. « Les hommes comme lui ne changent pas d’avis, très {cher}. Ou alors, ce n’est plus tout à fait le même homme. »'];
        api.npc('vane', l[Math.min(n, 1)]);
      }, { chip: 'Le professeur Smith' }),
      T('trucs', ['TRUCAGE', 'IMPOSTEUR'], function (api) {
        if (!api.flag('truquee')) { api.npc('vane', '« Des trucs ? » Elle porte la main à son cœur. « Très cher. Vous me blessez. »'); return; }
        api.npc('vane', api.flag('seanceFaite')
          ? '« Oui. Le fil, la gaze, Cyril derrière le rideau. Je fais ça depuis vingt ans. » Sa voix se brise. « Mais je n’ai jamais su faire froid. Je n’ai jamais su faire siffler un train. Et ce garçon, cet Albert, je ne l’avais jamais entendu de ma vie. Il m’a prise comme on prend un tramway. »'
          : '« Bon. » Elle referme son éventail d’un coup sec. « Les gens viennent pleurer, très {cher}. Je les fais pleurer mieux, voilà tout. Vous voulez votre guinée ? Gardez-la, et taisez-vous. »');
      }, { chip: 'Vos trucages', chipCond: function (api) { return api.flag('truquee'); } }),
      T('albert', ['ALEXIS', 'FILS', 'TRAIN', 'FANTOME', 'HISTOIRE', 'PSY', 'VU', ['EXAMINER', 0.7], 'SUITE'], function (api, n) {
        if (!api.flag('seanceFaite')) { api.npc('vane', '« Un Albert ? J’ai eu trois Albert ce mois-ci, très {cher}. Tombés à la Somme, tous les trois. Les veuves ne sont pas très inventives. »'); return; }
        var l = ['« Je ne le connais pas. Je vous le jure sur la tête de Cyril. » Elle frissonne. « Ce n’était pas un mort de la guerre. Il parlait comme on parlait quand j’étais jeune fille. Et il cherchait son père, comme s’il l’avait perdu dans une gare. »',
          '« Pendant qu’il parlait, j’ai vu, très {cher}. Moi qui ne vois jamais rien. Un wagon qui roulait dans le gris, sans rails, et un vieil homme qui tournait en rond par terre, à quatre pattes, autour d’un dessin. »',
          '« Je n’en sais pas plus. Et je ne veux pas en savoir plus. »'];
        api.npc('vane', l[Math.min(n, 2)]);
      }, { chip: 'La voix d’Albert', chipCond: function (api) { return api.flag('seanceFaite'); } }),
      T('atkins', ['ATKINS', 'STANLEY', 'STOKE'], function (api) {
        if (day(api.s.min) < 4) { api.npc('vane', '« Stoke Newington ? Je n’ai pas de clients si loin, très {cher}. »'); return; }
        api.npc('vane', '« Mrs Atkins ? Oui, une logeuse de Stoke Newington, venue mardi. Elle voulait des nouvelles de son locataire, celui qui s’est envolé en fumée. Je lui ai dit qu’il était heureux, de l’autre côté. On dit toujours ça. » Elle hésite. « Elle m’a laissé un petit wagon en fer-blanc, pour “établir le contact”. Je l’ai mis à la cave. Je n’aimais pas le bruit qu’il faisait, la nuit. »');
      }, { chip: 'Mrs Atkins', cond: function (api) { return day(api.s.min) >= 4 && (api.has('STANLEY') || api.flag('known:stoke')); } })
    ] });

  // ================================================================ sa fiche : sa voix, ce qu'elle sait, ce qu'elle cache
  if (L.fiches) {
    L.fiches.vane = { groupe: 'mondain', reg: 'mondain', mefiant: 0.4, tics: ['Très {cher},', 'Voyez-vous,'],
      dada: ['Les esprits sont comme les chats, très {cher} : ils viennent quand on ne les appelle pas.', 'J’ai fait pleurer une duchesse, une fois. Elle m’a envoyé des fleurs pendant dix ans.'],
      moi: { nom: '« Mrs Hortense Vane. “Madame Hortense”, pour les esprits. »', age: '« Une dame n’a pas d’âge, très {cher}. Les esprits non plus. »', origine: '« De Brighton. Mon père tenait une baraque de lanterne magique sur la jetée. »', famille: '« Mon neveu Cyril. Il m’aide. Il ne parle pas beaucoup, c’est une qualité. »', metier: '« Médium. Vingt ans de métier, deux princesses, et pas un seul procès. »', loisirs: '« Le whist. Et les romans de Mrs Radcliffe, quand j’ai besoin de m’effrayer un peu. »', peur: function (api) { return api.flag('seanceFaite') ? '« D’entendre siffler un train. Je ne prendrai plus jamais le train, très {cher}. »' : '« Les sceptiques. Et les courants d’air. »'; }, croit: function (api) { return api.flag('seanceFaite') ? '« Je croyais ne croire à rien. Je me trompais. »' : '« Je crois à la douleur des gens, très {cher}. Le reste, c’est de la mise en scène. »'; }, humeur: function (api) { return api.flag('seanceFaite') ? '« Mauvaise. Je ne dors plus. »' : '« Excellente. Les affaires vont bien : la guerre a fait beaucoup de veuves. »'; }, defaut: ['« Les esprits ne m’ont rien dit là-dessus, très {cher}. »'] },
      sait: { SMITH: '« Smith ? Le monsieur qui m’a ruinée chez Lady Ashworth. Je ne lui souhaite pas de mal. Pas beaucoup. »', HANTISE: '« Les fantômes ? Il y en a de vrais, très {cher}. Très peu. Je n’en avais jamais rencontré avant cette semaine. »', SEANCE: '« À neuf heures, une guinée. Je fournis le frisson, les clients fournissent les larmes. »', HOTEL: '« Votre hôtel ? À deux pas. Les étrangers de passage sont mes meilleurs clients : ils ne reviennent jamais se plaindre. »', TRAIN: '« Les trains ? Je n’aime pas les trains. Je ne les ai jamais aimés, et maintenant moins que jamais. »' } };
    var f = L.fiches.vane;
    f.psy = function (api) { return api.flag('seanceFaite') ? 'Elle a eu peur, vraiment peur, pour la première fois de sa vie de comédienne. Elle ne ment plus. Elle n’en a plus la force.' : 'Une comédienne habile, qui ne croit pas un mot de ce qu’elle raconte, mais qui aime sincèrement ses veuves. Elle ment pour consoler, jamais pour nuire.'; };
    f.confie = ['« Entre nous, très {cher} : la moitié de mes clients viennent pour se faire mentir, et l’autre moitié pour me prendre en faute. Les premiers paient mieux. »'];
    f.roles = { police: '« La police ? » Elle sourit. « Le commissaire de Bloomsbury vient ici tous les jeudis parler à sa mère. Asseyez-vous, très {cher}. »', presse: '« Un journaliste ? Parfait. Écrivez que Madame Hortense a reçu un esprit authentique. Pour une fois, ce sera vrai. »', medecin: '« Un médecin ! Alors vous saurez me dire pourquoi j’ai les mains glacées depuis trois jours. »' };
  }

  // ================================================================ qui en parle : le concierge, Mrs Pike, Mrs Atkins
  function ajouter(id, t) { if (L.npcs[id] && L.npcs[id].topics) L.npcs[id].topics.push(t); }
  ajouter('concierge', T('vane', ['HANTISE', 'VANE', 'SEANCE'], function (api) {
    api.npc('concierge', '« Une médium, {m} ? Mrs Vane, au 31, Gordon Square, à deux pas. Tous les soirs à neuf heures, sauf le dimanche. » Il baisse la voix. « C’est elle que le professeur Smith a démasquée chez Lady Ashworth. La dame du deuxième y va tous les soirs. Elle dit que c’est depuis qu’elle entend des pas au plafond. »');
    if (!api.has('VANE')) { api.clue('VANE'); learn(api, 'vane'); }
  }, { chip: 'Une médium dans le quartier ?' }));
  ajouter('pike', T('vane', ['VANE', 'HANTISE', 'SEANCE'], function (api) {
    api.npc('pike', '« Vane, Hortense. Dossier V-31. Médium, Gordon Square. Démasquée par Smith en 1921, chez Lady Ashworth : page trois, avec une photographie de la gaze. » Elle referme le tiroir. « Elle a toujours ses clients. Les gens préfèrent un beau mensonge à un article bien classé. »');
    if (!api.has('VANE')) { api.clue('VANE'); learn(api, 'vane'); }
  }, { chip: 'Les médiums démasqués par Smith' }));
  ajouter('atkins', T('vane', ['HANTISE', 'VANE', 'SEANCE'], function (api) {
    api.npc('atkins', '« Si j’ai consulté ? » Elle rougit. « Une médium, à Bloomsbury. Mrs Vane, Gordon Square. Elle m’a dit que Mr Stanley était heureux, de l’autre côté. Je lui ai laissé un de ses petits wagons, pour l’aider. Ça m’a coûté une guinée, et je ne dors pas mieux. »');
    if (!api.has('VANE')) { api.clue('VANE'); learn(api, 'vane'); }
  }, { chip: 'Avez-vous consulté quelqu’un ?', cond: function (api) { return api.has('STANLEY'); } }));

  // Mrs Pike ouvre aussi le dossier Alexis à qui a entendu Albert
  (L.npcs.pike && L.npcs.pike.topics || []).forEach(function (t) {
    if (t.id === 'alexis' && t.cond) { var c0 = t.cond; t.cond = function (api) { return c0(api) || api.has('VOIX'); }; }
  });

  // dans le train fantôme, la voix d'Albert revient à qui l'a entendue
  var w2 = L.locations.wagon2;
  (w2 && w2.actions || []).forEach(function (a) {
    if (a.id !== 'w2_motif') return;
    var r0 = a.run;
    a.run = function (api, p) {
      if (api.has('VOIX') && !api.flag('relief') && !api.flag('voixMotif')) {
        api.flag('voixMotif', true);
        api.say('Devant le grand huit étalé sur le plancher, une voix vous revient, essoufflée, sortie de la bouche d’une médium de Gordon Square : « La voie n’est pas plate, papa. Il faut qu’elle monte et qu’elle descende. »');
      }
      return r0.call(this, api, p);
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
