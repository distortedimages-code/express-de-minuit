/* Londres : l'improvisation. Tout ce que le joueur peut tenter hors du fil de l'enquête reçoit une
   réponse de la ville elle-même, jamais du jeu : on boit, on prie, on téléphone, on veut rentrer à Paris…
   Et, comme un bon meneur, la ville ramène doucement vers le fil. */
(function (G) {
  'use strict';
  var L = G.CHAPTERS && G.CHAPTERS.londres; if (!L) return;
  var H = L._h, T = H.T, day = H.day, hour = H.hour, learn = H.learn;
  var DEHORS = { islington: 1, stoke: 1, stjohn: 1, campagne: 1, quais: 1 };
  function dehors(api) { return !!DEHORS[api.s.loc]; }
  function nuit(api) { var h = hour(api.s.min); return h >= 19 || h < 7; }
  function pick(api, k, a) { return api.fresh(k, a); }
  function connu(api, id) { return api.flag('known:' + id); }

  // ================================================================ le fil : ramener vers l'enquête, sans jamais le dire
  var PISTES = [
    function (api) { return !api.has('BILLET') && connu(api, 'cheapside') && !api.s.visited.cheapside ? 'Le nom de Cheapside vous revient, avec cette impression désagréable d’avoir un rendez-vous qu’on n’honore pas.' : null; },
    function (api) { return api.has('MEURTRES') && !api.has('ECORCHES') ? 'Trois morts au Chelsea Arms, et la presse qui se tait sur le détail. Quelqu’un, à Scotland Yard, en sait plus qu’il n’en dit.' : null; },
    function (api) { return api.has('ADRESSE') && !api.s.visited.boutique ? 'Une boutique, à Islington. Vous n’y êtes pas encore entré{e}, et quelque chose vous dit qu’elle ne restera pas ouverte longtemps.' : null; },
    function (api) { return api.has('TRAIN') && !api.has('STANLEY') ? 'Un antiquaire qui vend un train miniature à un inconnu. L’acheteur, lui, doit bien habiter quelque part.' : null; },
    function (api) { return api.has('MAQUETTE') && !api.has('ALEXIS') ? 'Ce grand huit de modèle réduit… Quelqu’un l’a construit, un jour, et un journal en a forcément parlé.' : null; },
    function (api) { return api.has('QUETE') ? 'Le simulacre. Les rouleaux. Le continent vous attend, et Londres commence à vous regarder de travers.' : null; },
    function (api) {
      var P = H.PLACES, ids = Object.keys(P).filter(function (id) { return id !== api.s.loc && connu(api, id) && !api.s.visited[id] && id !== 'pub' && id !== 'eglise' && id !== 'quais'; });
      return ids.length ? 'Vous repensez à ' + P[ids[0]].label + ' : vous n’y êtes pas encore allé{e}.' : null;
    },
    function (api) { return api.s.clues.length ? 'Vous rouvrez votre carnet à la dernière page : « ' + L.clues[api.s.clues[api.s.clues.length - 1]].title + ' ». Le fil est là. Il suffit de tirer dessus.' : null; }
  ];
  function fil(api) {
    for (var i = 0; i < PISTES.length; i++) { var l = PISTES[i](api); if (l) return l; }
    return pick(api, 'filSmith', ['Smith. Où est Smith, en ce moment, et qu’est-ce qu’il fuit ?', 'Le visage de Smith au banquet, ce soir-là : un homme qui avait peur, et qui faisait semblant de plaisanter.']);
  }
  L.nudge = function (api) { return fil(api); };
  L.lost = function (api) {
    return pick(api, 'perdu', [
      'Vous restez un moment sans bouger. Londres continue autour de vous, indifférente. ',
      'Une seconde, vous ne savez plus très bien ce que vous étiez venu{e} faire. ',
      'Vous ouvrez la bouche, puis la refermez. Les mots ne viennent pas dans le bon ordre. '
    ]) + fil(api);
  };

  // ================================================================ la ville répond selon l'endroit
  var V = L.generic.verbs;
  V.REFLECHIR = function (api) { return 'Vous faites le point. ' + fil(api); };
  function selon(dedans, dehors_, gare) {
    return function (api) {
      var pool = api.s.loc === 'victoria' && gare ? gare : dehors(api) ? dehors_ : dedans;
      return pick(api, 'gen' + pool[0].length, pool);
    };
  }
  V.DANSER = selon(['Quelques pas de fox-trot sur le tapis. Le plancher grince, et quelqu’un tape au plafond, en dessous.', 'Vous esquissez un pas de danse, seul{e}. Votre reflet, dans la vitre, vous trouve ridicule.'],
    ['Quelques pas de charleston, seul{e}, dans le brouillard. Ça ne fait avancer personne, mais ça réchauffe.', 'Vous esquissez un pas de danse sur les pavés mouillés. Un chien errant vous regarde, la tête penchée.'],
    ['Un pas de valse entre deux malles. Un porteur s’écarte, poliment, comme on s’écarte d’un fou.']);
  V.CHANTER = selon(['Vous chantonnez un air de music-hall. À travers la cloison, quelqu’un reprend le refrain, faux.', 'Vous fredonnez pour vous donner du courage. Votre voix sonne étrangement entre ces murs.'],
    ['Vous fredonnez un air de music-hall. Une passante vous regarde de travers.', 'Vous chantez à mi-voix. Le brouillard avale les notes une à une.'],
    ['Vous chantonnez. Le sifflet d’une locomotive vous coupe au milieu du refrain.']);
  V.CRIER = selon(['Vous criez. Des pas pressés dans le couloir, puis une voix inquiète : « Tout va bien ? » Vous répondez que oui. Ce n’est pas tout à fait vrai.', 'Votre cri résonne. Personne ne vient. Ici, on a appris à ne pas entendre.'],
    ['Votre cri se perd dans le brouillard. Quelques têtes se tournent, puis se détournent.', 'Vous criez. Londres en a vu d’autres.'],
    ['Votre cri se perd sous la verrière, entre deux annonces. Un agent lève la tête, puis retourne à son journal.']);
  V.SAUTER = selon(['Vous sautez sur place. Le lustre tremble. Quelqu’un, en dessous, tape au plafond avec un balai.', 'Sauter ? Par où ? La fenêtre est à trois étages, et vous tenez à vos jambes.'],
    ['Vous sautez par-dessus une flaque. Raté, presque.', 'Sauter ? D’où, et pour aller où ?'], null);
  V.MANGER = function (api) {
    if (api.s.loc === 'hotel') return pick(api, 'mangerH', ['Vous descendez à la salle à manger : mouton bouilli, sauce à la menthe, pommes de terre à l’eau. La cuisine anglaise a ceci de rassurant qu’elle ne surprend jamais.', 'Le concierge vous fait monter un plateau : du thé trop infusé et des toasts froids, rangés debout dans leur porte-toasts comme des soldats.']);
    if (dehors(api)) return pick(api, 'mangerD', ['Une baraque de fish and chips, sur le trottoir d’en face. Le poisson est servi dans du papier journal ; vous lisez les nouvelles d’hier à travers la graisse.', 'Un marchand ambulant vous vend une pomme de terre au four, brûlante. Vous vous réchauffez les mains avant de la manger.']);
    return pick(api, 'mangerI', ['Vous grignotez le biscuit qui traînait dans votre poche depuis le banquet. Il a le goût de la veille.', 'Vous n’avez pas faim. Pas après Cheapside.']);
  };
  V.DESHABILLER = function (api) { return api.s.loc === 'hotel' ? 'Vous vous changez : un col propre, une chemise qui ne sent pas la fumée. Dans la glace, vous avez meilleure mine. Un peu.' : dehors(api) ? 'Par ce froid ? Vous gardez votre manteau.' : 'Ici ? Vous imaginez la tête des gens. Vous gardez votre manteau.'; };
  V.CACHER = selon(['Vous vous glissez derrière un rideau. Personne ne vous cherche. Pour l’instant.', 'Vous restez dans l’angle, là où la lumière ne va pas.'],
    ['Vous vous effacez dans l’ombre d’une porte cochère. Personne ne vous cherche. Pour l’instant.', 'Le brouillard vous cache mieux que n’importe quelle cachette.'],
    ['Vous vous perdez dans la foule des voyageurs. C’est encore la meilleure cachette de Londres.']);
  V.LANCER = function (api) { return pick(api, 'lancer', ['Lancer quoi, et sur qui ? Vous avez les mains vides, et personne ne mérite encore qu’on lui jette quoi que ce soit.', 'Votre bras se lève, puis retombe. Il n’y a rien ici qui vaille la peine d’être lancé.']); };
  V.CONTEMPLER = selon(['Vous regardez la pluie couler sur la vitre. Les gouttes se rejoignent, se séparent, comme des pistes.', 'Vous restez immobile, longtemps. Le monde ne vous attend pas.'],
    ['Vous fixez le brouillard jusqu’à ce qu’il prenne des formes. Des visages, toujours des visages.', 'Vous regardez passer les fiacres et les automobiles, et vous vous demandez lesquels vous suivent.'], null);
  V.FUMER = selon(['Vous allumez une cigarette près de la fenêtre. La fumée monte, hésite, et file sous la porte comme si elle avait quelque chose à faire ailleurs.', 'Une cigarette, le temps de remettre vos idées en ordre.'],
    ['Vous allumez une cigarette. La fumée se mêle au brouillard, et on ne sait plus où finit l’une et où commence l’autre.', 'Une cigarette, le temps de remettre vos idées en ordre.'], null);

  // ================================================================ trois endroits de plus : un pub, une église, les quais
  var baseLex = L.lexicon;
  L.lexicon = function (Lx) {
    baseLex(Lx);
    Lx.add('PUB', 'n', 'pub, taverne, tavern, bistrot, troquet, estaminet, public house, museum tavern', { label: 'le pub' });
    Lx.add('EGLISE', 'n', 'eglise, chapelle, temple, paroisse, vicaire, pasteur, reverend, hollis', { label: 'l’église' });
    Lx.add('TAMISE', 'n', 'tamise, thames, embankment, berge, berges, fleuve', { label: 'la Tamise' });
    Lx.add('PATRON', 'n', 'patron, tenancier, aubergiste, barnaby', { label: 'le patron', npc: true });
    Lx.add('FLECHETTES', 'x', 'flechettes, cible, darts', { label: 'les fléchettes' });
    Lx.add('MAL', 'x', 'mal, diable, satan, enfer, peche, peches, malefice', { label: 'le mal' });
    Lx.add('MUDLARK', 'n', 'ramasseur, mudlark, epaves, greve', { label: 'le ramasseur d’épaves' });
  };
  L.phrases.unshift(
    [/\bmuseum tavern\b|\bpublic house\b/g, ' pub '],
    [/\bsaint george('?s)?\b|\bst george('?s)?\b/g, ' eglise '],
    [/\bvictoria embankment\b|\bbords? de (la )?tamise\b|\bles quais\b|\bsur les quais\b/g, ' tamise ']
  );
  H.PLACES.pub = { label: 'le Museum Tavern, en face du British Museum', concept: 'PUB', also: [], hours: [11, 23], closed: 'Le Museum Tavern a tiré ses volets. Les pubs ferment à onze heures, et la police veille à ce que la loi soit respectée.' };
  H.PLACES.eglise = { label: 'l’église St George, à Bloomsbury', concept: 'EGLISE', also: [] };
  H.PLACES.quais = { label: 'les quais de la Tamise', concept: 'TAMISE', also: [] };
  L.globalActions.unshift(H.goAct('quais'), H.goAct('eglise'), H.goAct('pub'));

  var RUMEURS = [
    { cond: function (api) { return true; }, txt: '« Le vieux professeur Smith, celui qui démasquait les médiums ? Il paraît qu’il croit aux revenants, maintenant. À son âge, on se convertit à n’importe quoi. »' },
    { cond: function (api) { return api.has('MEURTRES') || day(api.s.min) >= 1; }, txt: '« Trois types morts au Chelsea Arms, dans la même nuit, et pas un mot dans le journal sur la manière. Mon beau-frère livre la bière là-bas : il dit que la chambre a été repeinte le lendemain. Repeinte, vous entendez. »' },
    { cond: function (api) { return api.has('INCENDIE'); }, txt: '« La maison du professeur, à St John’s Wood ? Les pompiers disent que ça a pris partout à la fois. Comme si la maison voulait brûler. »' },
    { cond: function (api) { return day(api.s.min) >= 4; }, txt: '« À Stoke Newington, un locataire s’est envolé en fumée dans sa chambre. Avec ses petits trains. Ma cousine connaît la logeuse : elle n’en dort plus. »' },
    { cond: function (api) { return api.has('ADRESSE') || day(api.s.min) >= 2; }, txt: '« Un brocanteur turc, à Islington, qui a fermé boutique du jour au lendemain. Les gens du quartier disent qu’il avait un fils qu’on ne voyait jamais. Ou un vieux père. Personne n’est d’accord. »' },
    { cond: function (api) { return api.has('VANE') || api.has('VOIX'); }, txt: '« Mrs Vane, la médium de Gordon Square ? Elle est venue boire un gin ici, hier soir, toute seule, au comptoir. Elle qui ne boit jamais. Elle a demandé l’heure du dernier train, et puis elle a dit qu’elle ne le prendrait pas. »' },
    { cond: function (api) { return true; }, txt: '« Les cheminots de Victoria racontent des histoires, la nuit, après la dernière tournée. Un train qui passe hors horaire, sans lumière, et qu’on n’entend qu’après qu’il est passé. Des histoires de cheminots, voilà tout. »' }
  ];
  function rumeur(api) {
    var dispo = RUMEURS.filter(function (r, i) { return r.cond(api) && !api.flag('rumeur' + i); });
    if (!dispo.length) return '« Je vous ai dit tout ce que je sais, {m}. Et même un peu plus. »';
    var r = dispo[0]; api.flag('rumeur' + RUMEURS.indexOf(r), true); return r.txt;
  }

  L.locations.pub = {
    name: 'Le Museum Tavern, Great Russell Street', art: 'bureau',
    enter: function (api, first) {
      api.say(first ? 'Un pub tout en acajou et en cuivre, face aux colonnes du British Museum. Des glaces gravées, un feu de charbon, l’odeur de la bière tiède et du tabac froid. Au comptoir, des employés du musée, deux étudiants, un vieux soldat qui parle tout seul. Le patron, un colosse aux favoris roux, essuie un verre en vous regardant entrer.'
        : pick(api, 'pubR', ['Le Museum Tavern. Le patron lève le menton en guise de bonjour.', 'Retour au pub. Le vieux soldat parle toujours tout seul.']));
    },
    things: [{ label: 'le patron', ids: ['PATRON', 'QUELQUUN'] }, { label: 'les habitués', ids: ['QUELQUUN'] }, { label: 'la cible de fléchettes', ids: ['FLECHETTES'] }, { label: null, ids: ['SALLE', 'BOISSON', 'TABLE'] }],
    ambient: ['Une fléchette se plante à côté de la cible. Éclat de rire général.', 'Le feu de charbon crache une étincelle sur le tapis.', 'Quelqu’un réclame une autre pinte « avant que la loi ne s’en mêle ».'],
    actions: [
      { id: 'pb_look', label: 'Observer la salle', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE'], bare: true,
        run: function (api) { api.say(pick(api, 'pblook', ['Les employés du musée parlent d’une momie qu’on a dû déplacer parce que les gardiens refusaient de passer devant la nuit. Les étudiants parlent de filles. Le vieux soldat parle d’Ypres.', 'Accrochée derrière le comptoir, une photographie jaunie : le pub en 1897, avec une affiche pour une conférence sur les esprits. On reconnaît, au premier rang, un Smith beaucoup plus jeune.'])); } },
      { id: 'pb_boire', label: 'Commander une pinte', idea: true, repeatable: true, verbs: ['BOIRE', 'COMMANDER', 'PRENDRE'], nouns: ['BOISSON', 'PATRON'], bare: true,
        run: function (api) {
          var n = api.count('pintes');
          if (n === 0) api.say('Une pinte de bitter, tiède comme il se doit. La première gorgée a le goût de quelque chose de normal, et ça fait du bien.');
          else if (n === 1) api.say('Une deuxième. Le feu est plus chaud, le patron plus aimable, et Cheapside un peu plus loin.');
          else if (n === 2) api.say('Une troisième. Les glaces gravées commencent à onduler, et dans l’une d’elles un homme vous ressemble sans tout à fait vous ressembler. Vous reposez le verre.');
          else { api.say('Le patron pose la main sur votre verre. « Ça suffira pour ce soir, {m}. Vous avez l’air de quelqu’un qui aura besoin de sa tête demain. » ' + fil(api)); return; }
          api.time(25);
        } },
      { id: 'pb_ecouter', label: 'Écouter les conversations', idea: true, repeatable: true, verbs: ['ECOUTER'], nouns: ['QUELQUUN', 'SALLE'], bare: true,
        run: function (api) { api.say('Vous vous accoudez au comptoir et vous tendez l’oreille.'); api.npc('patron', rumeur(api)); api.time(20); } },
      { id: 'pb_flechettes', label: 'Jouer aux fléchettes', idea: true, verbs: ['JOUER', 'LANCER'], nouns: ['FLECHETTES'], bare: false,
        run: function (api) { api.say('Les étudiants vous tendent trois fléchettes, ravis d’avoir un étranger à plumer.'); api.check('pub_flechettes'); } },
      { id: 'pb_patron', label: 'Parler au patron', idea: true, talkTo: 'patron', verbs: ['PARLER', 'PERSUADER', 'BARATIN', 'POLI', 'DONNER'], nouns: ['PATRON', 'QUELQUUN'],
        extra: ['SMITH', 'MEURTRES', 'INCENDIE', 'STANLEY', 'MAKRYAT', 'VANE', 'TRAIN', 'FANTOME', 'HANTISE'], run: function (api, p) { api.talk('patron', p); } }
    ]
  };
  L.checks.pub_flechettes = { skill: 'DEX', label: 'Dextérité', why: 'viser la cible après une pinte',
    resolve: function (api, r) {
      if (r.success) { api.say('Double vingt, triple vingt, et la dernière en plein centre. Les étudiants paient la tournée en grimaçant, et l’un d’eux, pour se venger, vous raconte une histoire.'); api.npc('patron', rumeur(api)); }
      else api.say('La première se plante dans le mur, la deuxième dans le cadre de la photographie, la troisième vous échappe. Les étudiants vous serrent la main avec une sincère gratitude.');
    } };
  L.npcs.patron = H.npc({ id: 'patron', name: 'Barnaby Rudd, le patron du Museum Tavern', short: 'le patron', patience: 8, selfKeys: ['PATRON'],
    greet: function (api, first) { api.npc('patron', first ? '« Qu’est-ce que ce sera, {m} ? Et si c’est une question, ce sera une pinte d’abord. »' : '« {M} ? »'); },
    bye: '« Bonne soirée, {m}. Et méfiez-vous du brouillard : il entre dans les gens. »',
    deflect: ['« Ça, je ne saurais pas vous dire. »', 'Il hausse ses énormes épaules.', '« Demandez aux habitués. Ils savent tout, surtout ce qui n’est pas vrai. »'],
    topics: [
      T('ragots', ['QUELQUUN', 'HISTOIRE', 'MEURTRES', 'INCENDIE', 'STANLEY', 'MAKRYAT', 'VANE', 'TRAIN', 'FANTOME', 'HANTISE'], function (api) { api.npc('patron', rumeur(api)); }, { chip: 'Les nouvelles du quartier' }),
      T('smith', ['SMITH', 'CONFERENCE'], ['« Le professeur ? Il venait ici, avant. Une demi-pinte, jamais plus, et il démolissait les fantômes de tout le monde. Ça faisait rire la salle. » Il essuie son verre. « Depuis un mois, il ne vient plus. La dernière fois, il a bu un whisky. Un double. Lui. »'], { chip: 'Le professeur Smith' })
    ] });

  L.locations.eglise = {
    name: 'L’église St George, à Bloomsbury', art: 'bureau',
    enter: function (api, first) {
      api.say(first ? 'Une église blanche au clocher étrange, couronné d’une statue de roi en toge romaine. Dedans, le silence, une odeur de cire et de pierre froide, et la lumière grise qui tombe des hautes fenêtres. Un pasteur maigre, en surplis, range des recueils de cantiques dans les bancs.'
        : pick(api, 'egR', ['Le silence de St George. Le pasteur vous salue d’un signe de tête.', 'L’église est presque vide. Une vieille femme prie au premier rang.']));
    },
    things: [{ label: 'le révérend Hollis', ids: ['EGLISE', 'QUELQUUN'] }, { label: 'l’autel', ids: ['AUTEL'] }, { label: null, ids: ['SALLE', 'FENETRE'] }],
    ambient: ['L’orgue, quelque part, essaie trois notes et se tait.', 'Une bougie s’éteint toute seule au pied d’une statue.'],
    actions: [
      { id: 'eg_prier', label: 'Prier un moment', idea: true, repeatable: true, verbs: ['PRIER', 'ASSEOIR', 'CONTEMPLER', 'ATTENDRE'], nouns: ['EGLISE', 'AUTEL', 'SALLE'], bare: true,
        run: function (api) {
          var n = api.count('prieres');
          api.say(n === 0 ? 'Vous vous asseyez au fond, les mains jointes ou pas. Pendant quelques minutes, plus rien ne brûle, personne n’a de visage d’emprunt, et le monde a de nouveau un ordre. Ça ne durera pas, mais c’est déjà ça.'
            : 'Vous restez assis{e} dans le silence. Il ne répond rien, mais il ne ment pas non plus. ' + fil(api));
          api.time(20);
        } },
      { id: 'eg_hollis', label: 'Parler au révérend', idea: true, talkTo: 'hollis', verbs: ['PARLER', 'PERSUADER', 'BARATIN', 'POLI', 'PRIER'], nouns: ['EGLISE', 'QUELQUUN'],
        extra: ['SMITH', 'HANTISE', 'OCCULTE', 'VANE', 'PEAU', 'QUETE'], run: function (api, p) { api.talk('hollis', p); } }
    ]
  };
  L.npcs.hollis = H.npc({ id: 'hollis', name: 'Le révérend Ambrose Hollis', short: 'le révérend', patience: 8, selfKeys: ['EGLISE'],
    greet: function (api, first) { api.npc('hollis', first ? '« Soyez le bienvenu. Vous avez l’air de quelqu’un qui a dormi avec une question sous l’oreiller. »' : '« Encore vous. Les questions reviennent toujours, n’est-ce pas ? »'); },
    bye: '« Allez en paix. Et si la paix ne veut pas venir, revenez. »',
    deflect: ['« Je ne suis qu’un pasteur, vous savez. Je n’ai pas réponse à tout. Seulement à l’essentiel, les bons jours. »', 'Il sourit, sans répondre.'],
    topics: [
      T('smith', ['SMITH', 'CONFERENCE', 'SUITE'], function (api, n) {
        api.npc('hollis', ['« Julius Smith ? Un vieil adversaire, et un ami. Nous nous disputions sur l’au-delà tous les mercredis, depuis vingt ans. Il venait écouter l’orgue en prétendant qu’il ne croyait qu’à Bach. »',
          '« Il y a quinze jours, il m’a demandé ce que l’Église enseignait des reliques maudites. Pas des reliques de saints : des reliques maudites. J’ai cru qu’il préparait un article. Je n’ai pas aimé ses yeux. »'][Math.min(n, 1)]);
      }, { chip: 'Le professeur Smith' }),
      T('mal', ['MAL', 'HANTISE', 'OCCULTE', 'PEAU', 'QUETE', 'FANTOME', 'PSY'], ['« Le mal ? » Il pose les cantiques. « Je crois qu’il existe, oui. Mais je crois aussi qu’il a besoin de nous pour agir. De nos mains, de nos visages. Seul, il n’est qu’une idée. C’est en nous empruntant qu’il devient quelqu’un. »'], { chip: 'Le mal existe-t-il ?' }),
      T('vane', ['VANE', 'SEANCE'], ['« Mrs Vane ? » Il soupire. « Elle est venue s’asseoir au fond, avant-hier. Elle n’avait pas mis les pieds dans une église depuis quarante ans. Elle n’a rien demandé. Elle a juste pleuré. »'], { chip: 'Mrs Vane', chipCond: function (api) { return api.has('VANE'); } })
    ] });

  L.locations.quais = {
    name: 'Les quais de la Tamise, Victoria Embankment', art: 'rue',
    enter: function (api, first) {
      api.say(first ? 'Le long de la Tamise, les réverbères de l’Embankment font des boules de lumière jaune dans le brouillard. Le fleuve est invisible ; on l’entend seulement, lourd, qui clapote contre le granit. Une corne de brume, au loin. Une péniche passe quelque part, sans lumière.'
        : pick(api, 'quaisR', ['Les quais. Le fleuve respire dans le brouillard.', 'L’Embankment, ses bancs mouillés, ses dauphins de fonte enroulés autour des réverbères.']));
    },
    things: [{ label: 'la Tamise', ids: ['TAMISE'] }, { label: 'un ramasseur d’épaves, sur la grève', ids: ['MUDLARK', 'QUELQUUN'] }, { label: null, ids: ['SALLE', 'LAMPE'] }],
    ambient: ['Une corne de brume, très loin, deux fois.', 'Un fiacre passe au pas, ses lanternes mangées par le brouillard.', 'Quelque chose clapote contre les marches, en contrebas.'],
    actions: [
      { id: 'qu_fleuve', label: 'Regarder le fleuve', idea: true, repeatable: true, verbs: ['EXAMINER', 'CONTEMPLER', 'ATTENDRE'], nouns: ['TAMISE', 'SALLE'], bare: true,
        run: function (api) {
          var san = api.s.san, mad = api.s.sanMax ? san < 45 : false;
          api.say(nuit(api) && (mad || api.has('PEAU'))
            ? 'Vous vous penchez sur le parapet. Le brouillard s’écarte une seconde, et vous voyez l’eau noire, et dans l’eau noire un visage qui flotte, la bouche ouverte, sans yeux. Le brouillard se referme. Ce n’était qu’un sac. Sûrement.'
            : pick(api, 'fleuve', ['L’eau est noire et lente. Elle charrie des branches, une caisse, un chapeau. Tout finit dans la Tamise, à Londres. Les choses et les secrets.', 'Le fleuve passe, indifférent, comme il passait sous les Romains. ' + fil(api)]));
          api.time(15);
        } },
      { id: 'qu_mudlark', label: 'Parler au ramasseur d’épaves', idea: true, verbs: ['PARLER', 'POLI', 'DONNER', 'EXAMINER'], nouns: ['MUDLARK', 'QUELQUUN'],
        run: function (api) {
          if (api.flag('mudlark')) { api.say('Le gamin a disparu sous l’arche du pont, avec son sac. Il ne reste que des empreintes dans la vase.'); return; }
          api.flag('mudlark', true);
          api.say('Sur la grève, en contrebas, un gamin en haillons fouille la vase avec un crochet. Il vous montre ses trouvailles pour un penny : un clou de fer à cheval, une pipe en terre, une pièce romaine, peut-être.');
          api.say('« Et ça, m’sieur-dame. » Il sort de son sac un gant de cuir fin, intact, d’homme. Sauf qu’à l’intérieur, il y a encore la peau d’une main, retournée comme une chaussette. Le gamin rit. « Ça arrive, ici. La Tamise rend tout. »');
          api.check('san_quais');
        } }
    ]
  };
  L.checks.san_quais = { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'garder son calme',
    resolve: function (api, r) { api.say(r.success ? 'Vous donnez un penny au gamin et vous lui dites de jeter ça au fleuve. Il le jette. Il en a vu d’autres.' : 'Vous reculez si vite que vous heurtez le parapet. Vous pensez aux trois morts du Chelsea Arms, et à ce qu’on a fait de leur peau.'); } };

  // ---------------------------------------------------------------- jeter quelque chose à la figure de quelqu'un
  function present(api, concept) {
    var l = L.locations[api.s.loc]; if (!l) return false;
    return (l.things || []).some(function (t) { return t.ids.indexOf(concept) >= 0 && (!t.cond || t.cond(api)); });
  }
  function cible(api, p) {
    var n = (p.nouns || []).filter(function (x) { return L.npcs[x.id.toLowerCase()] && present(api, x.id); })[0];
    if (n) return n.id.toLowerCase();
    if (api.s.talk) return api.s.talk;
    return null;
  }
  function jeter(api, p) {
    var raw = p.text || '', quoi = (raw.match(/\b(eau|vin|champagne|biere|the|cafe|whisky|soupe|potage|cognac)\b/) || [])[1];
    var liquide = quoi ? { eau: 'votre verre d’eau', vin: 'votre verre de vin', champagne: 'votre coupe de champagne', biere: 'votre bière', the: 'votre thé', cafe: 'votre café', whisky: 'votre whisky', soupe: 'votre potage', potage: 'votre potage', cognac: 'votre cognac' }[quoi] : 'ce que vous avez sous la main';
    var who = cible(api, p);
    if (!who) {
      api.say('Vous lancez ' + liquide + ' contre le mur, sans viser personne. Le bruit vous surprend vous-même. ' + (dehors(api) ? 'Un chien aboie quelque part.' : 'Quelqu’un, derrière une porte, demande si tout va bien.'));
      return true;
    }
    var npc = L.npcs[who], nom = (npc && (npc.short || npc.name)) || 'votre interlocuteur';
    api.flag('arrose:' + who, true);
    if (who === 'smith' && api.s.loc === 'institut') {
      api.say('Le geste part. ' + liquide.charAt(0).toUpperCase() + liquide.slice(1) + ' traverse la nappe et atterrit en plein dans les favoris du professeur Smith. Le silence tombe sur le banquet comme un rideau. Quelque part, une fourchette tinte sur une assiette.');
      api.say('Smith ruisselle. Il cligne des yeux, s’essuie la moustache du revers de la main, regarde sa pipe éteinte, noyée. Beddows est déjà là avec une serviette, livide, et vous lance un regard qui vous suivra longtemps. Deux maîtres d’hôtel s’approchent.');
      api.npc('smith', '« Laissez, laissez ! » Smith lève la main, et soudain il rit, de son grand rire de théâtre. « Mesdames et messieurs, voilà la seule expérience de la soirée dont je connaissais le résultat d’avance : je suis mouillé ! » La salle rit avec lui, soulagée.');
      api.say('Mais quand les conversations reprennent, il se penche vers vous, et il ne rit plus du tout. Tout bas : « Vous vouliez savoir si je suis bien moi-même ? Bonne idée. Mauvaise méthode. Gardez cette méfiance-là, vous en aurez besoin. »');
      return true;
    }
    if (who === 'beddows') {
      api.say(liquide.charAt(0).toUpperCase() + liquide.slice(1) + ' éclabousse le plastron immaculé de Beddows. Il ne bronche pas. Il sort un mouchoir, s’éponge avec une lenteur d’horloger, et vous regarde enfin.');
      api.npc('beddows', '« Vous avez terminé ? » Rien d’autre. Mais vous avez l’impression d’avoir giflé un homme qui avait déjà assez de soucis.');
      return true;
    }
    if (who === 'fleming' || who === 'sergent' || who === 'planton' || who === 'agentsj') {
      api.say(liquide.charAt(0).toUpperCase() + liquide.slice(1) + ' atteint ' + nom + ' en pleine figure. Le temps s’arrête une seconde, puis une main de fer se referme sur votre bras.');
      api.npc(who, '« Faites ça encore une fois, et vous passez la nuit au poste pour outrage. Une seule fois. » On vous lâche, mais on vous a regardé{e}, et on se souviendra de vous.');
      api.flag('outrage', true);
      return true;
    }
    api.say(liquide.charAt(0).toUpperCase() + liquide.slice(1) + ' atteint ' + nom + ' en pleine figure. Un silence ahuri. Puis la colère, ou pire : la pitié, comme devant quelqu’un que l’enquête a fini par rendre fou.');
    api.npc(who, pick(api, 'arrose', ['« Vous êtes malade ? » On s’essuie, on recule. Il faudra du temps avant qu’on vous reparle volontiers.', '« Eh bien ! » On vous regarde de haut en bas. « Si c’est comme ça qu’on pose des questions à Paris… »']));
    if (api.s.talk === who && api.endTalk) api.endTalk(false);
    return true;
  }

  // ================================================================ ce qu'on peut tenter n'importe où
  function quoi(api, txt) { api.say(txt); return true; }
  var REGLES = [
    { re: /\b(jet\w*|lanc\w*|balanc\w*|renvers\w*|vers\w*|envoy\w*) (un |mon |le |du |de l |de la |une |ma |son |sa |la |des |mes )?(verre|eau|vin|champagne|biere|the|cafe|whisky|soupe|assiette|pain|chaussure|livre|potage|carafe|cognac|pinte)\b/, run: function (api, p) { return jeter(api, p); } },
    { re: /\b(me suicider|me suicide|me tuer|me tue|en finir avec la vie|mettre fin a mes jours|me pendre|me jeter sous (un|le) train)\b/, run: function (api) {
      api.say('Une seconde, l’idée vous traverse, froide et nette. Puis elle passe. Vous avez vu ce soir ce que la mort fait aux gens, et ce que d’autres font de leur peau ensuite. Vous n’allez pas leur faciliter le travail.');
      api.event('(Hors jeu : si cette phrase vient de vous et pas de votre personnage, parlez-en à quelqu’un. En France, le 3114 répond jour et nuit, gratuitement.)');
      return true; } },
    { re: /\bsaut\w* (par|de) la fenetre\b|\bdefenestr\w*|\bsaut\w* du (pont|toit)\b|\bplong\w* dans la tamise\b|\bsaut\w* dans la tamise\b/, run: function (api) {
      return quoi(api, dehors(api) || api.s.loc === 'quais' ? 'Vous regardez l’eau noire en contrebas, et le parapet glacé sous vos mains. Non. Ce soir, la Tamise n’aura personne.'
        : 'Vous ouvrez la fenêtre. Trois étages, des pavés, et le brouillard qui entre dans la pièce comme une bête qui attendait. Vous refermez. Vous avez encore des choses à faire, et besoin de vos deux jambes pour les faire.'); } },
    { re: /\bmange\w* (le|un|la|les|ce|cette) (journal|journaux|papier|lettre|carte|billet|telegramme)\b/, run: function (api) {
      return quoi(api, 'Vous arrachez un coin de papier et vous le mâchez, pour voir. Encre, colle, et le goût fade des mauvaises nouvelles. Vous recrachez dans votre mouchoir. Personne ne vous a vu{e}, et c’est très bien ainsi.'); } },
    { re: /\b(boire|bois|pinte|biere|whisky|gin|cognac|alcool|me saouler|me souler|m enivrer|prendre un verre|boire un verre|une cuite|picoler)\b/, run: function (api) {
      if (api.s.loc === 'pub') { api.exec('pb_boire'); return true; }
      if (api.s.loc === 'hotel') api.say(api.count('whiskyHotel') === 0 ? 'Le concierge vous sert un whisky dans le petit salon de l’hôtel, avec un air de reproche. « Le Museum Tavern, en face du British Museum, est plus indiqué pour ce genre de soirée, {m}. On y entend aussi beaucoup de choses. »' : 'Le concierge vous ressert, sans un mot, puis range la bouteille sous le comptoir et tourne la clé du placard. Le message est clair.');
      else api.say('Pas ici. Mais il y a un pub au coin de chaque rue de Londres, et celui qu’on vous a recommandé, le Museum Tavern, est en face du British Museum.');
      learn(api, 'pub');
      if (hour(api.s.min) >= 11 && hour(api.s.min) < 23) api.chips([{ label: 'Aller au Museum Tavern', action: 'go_pub' }]);
      return true; } },
    { re: /\b(eglise|chapelle|messe|me confesser|confession|un pretre|un pasteur|un cure|prier dans)\b/, run: function (api) {
      if (api.s.loc === 'eglise') return false;
      api.say('St George, l’église de Bloomsbury, est à deux rues de l’hôtel. On y voit son étrange clocher de partout, quand le brouillard le permet.');
      learn(api, 'eglise'); api.chips([{ label: 'Aller à St George', action: 'go_eglise' }]); return true; } },
    { re: /\b(tamise|thames|embankment|les quais|le fleuve|tower bridge|pont de londres|westminster)\b/, run: function (api) {
      if (api.s.loc === 'quais') return false;
      api.say('La Tamise est à vingt minutes de taxi, par Kingsway. Par ce brouillard, on ne la voit qu’une fois les pieds dedans.');
      learn(api, 'quais'); api.chips([{ label: 'Aller sur les quais', action: 'go_quais' }]); return true; } },
    { re: /\b(rentr\w*|retourn\w*|repart\w*|reviens|revenir|pars|partir|fui\w*|fil\w*|taxi|train|bateau|ferry) (a|en|pour|vers|jusqu a) (paris|france|la maison|chez moi|calais)\b|\babandonn\w* (l )?enquete\b|\b(prendre|prends|reprendre|reprends) le (train|bateau|ferry) (pour|de) (paris|france|calais|douvres)\b/, run: function (api) {
      if (api.has('QUETE')) return false; // le vrai départ, celui de l'enquête
      if (api.s.loc !== 'victoria') {
        api.say('Rentrer. L’idée est tentante : un train à Victoria, le ferry à Douvres, et bientôt Paris, des gens qui ont tous leur propre visage. ' + (api.flag('tentation') ? 'Le train de Douvres part de Victoria. Rien ne vous retient, sinon Smith.' : 'Mais Smith est votre ami, et ce soir, quelque chose n’allait pas chez lui.'));
        api.flag('tentation', true);
        if (connu(api, 'victoria')) api.chips([{ label: 'Aller à Victoria', action: 'go_victoria' }]);
        return true;
      }
      api.say('Le train de Douvres est à quai. Un porteur attend que vous vous décidiez. Si vous montez, vous serez à Paris ' + (hour(api.s.min) < 13 ? 'ce soir' : 'demain matin') + ', et Smith devra se débrouiller sans vous.');
      api.chips([{ label: 'Rentrer en France, et laisser Smith', action: 'v_abandon' }, { label: 'Rester à Londres', action: 'v_rester' }]);
      return true; } },
    { re: /\b(telephon\w*|coup de fil|passer un appel|appeler (ma|mon|la|le|les|scotland|paris|smith|l ))/, run: function (api) {
      var t = api.s.loc === 'hotel' ? 'Le téléphone de la réception, une colonne de laiton avec son écouteur pendu à un crochet. ' : 'Il y a une cabine rouge au coin de la rue. ';
      var raw = api.s.lastText || '';
      if (/\b(mere|pere|famille|femme|mari|paris|france|chez moi)\b/.test(raw)) return quoi(api, t + 'Une communication avec Paris, vous dit l’opératrice, se réserve trois heures à l’avance et coûte le prix d’un dîner. Vous raccrochez. Vous écrirez.');
      if (/\b(police|scotland|yard|fleming)\b/.test(raw)) return quoi(api, t + 'Scotland Yard, Whitehall 1212. Un sergent ennuyé prend votre message pour l’inspecteur Fleming, en épelant votre nom de travers. Il vaudrait mieux y aller en personne.');
      if (/\bsmith\b/.test(raw)) return quoi(api, t + (api.has('INCENDIE') ? 'Le numéro de St John’s Wood ne répond plus. Il ne reste qu’un sifflement, comme un feu qui couve au bout du fil.' : 'Le numéro de Smith sonne longtemps dans une maison vide. Personne ne décroche.'));
      return quoi(api, t + 'La ligne grésille, une opératrice demande « Number, please ? », et vous vous apercevez que vous ne savez pas qui appeler. ' + fil(api)); } },
    { re: /\b(achet\w*|procur\w*|trouv\w*|vend\w*) (un|une|des|d une) (revolver|pistolet|arme|armes|fusil|carabine|browning|webley)\b/, run: function (api) {
      return quoi(api, 'Depuis la loi de 1920, il faut un certificat de la police pour acheter une arme à feu en Angleterre, et la police pose des questions. Vous imaginez la tête de l’inspecteur Fleming si vous alliez le lui demander.'); } },
    { re: /\b(voler|vole|derober|piquer|chiper|faire les poches|pickpocket)\b/, run: function (api) {
      return quoi(api, 'Vos doigts hésitent, puis renoncent. Vous n’êtes pas un voleur, et Londres grouille d’agents qui le sont encore moins. Mieux vaut demander ce qu’on veut savoir que prendre ce qu’on n’a pas.'); } },
    { re: /\b(draguer|drague|seduire|flirter|faire la cour|courtiser|faire du charme)\b/, run: function (api) {
      return quoi(api, dehors(api) ? 'Vous souriez à une passante. Elle presse le pas : dans le brouillard, un sourire ressemble beaucoup à une menace.' : 'Vous tentez un sourire charmeur. On vous le rend, poliment, comme on rend la monnaie. Ce n’est pas la soirée pour ça.'); } },
    { re: /\b(pleure\w*|sanglot\w*|fondre en larmes|verser une larme)\b/, run: function (api) {
      return quoi(api, api.s.loc === 'hotel' ? 'Vous vous asseyez au bord du lit et vous laissez venir les larmes, sans bruit. Le radiateur cogne. Ça passe. Vous vous lavez le visage à l’eau froide, et vous êtes de nouveau quelqu’un qui enquête.' : 'Les larmes viennent toutes seules, et le froid les sèche aussitôt. Personne n’a rien vu. À Londres, personne ne voit jamais rien.'); } },
    { re: /\bli(re|s|t) (un|le|des|mon) (roman|livre|bouquin|policier)\b/, run: function (api) {
      return quoi(api, api.s.loc === 'hotel' ? 'Dans le tiroir de la table de nuit : une Bible et un Bradshaw, l’indicateur des chemins de fer. Vous ouvrez le Bradshaw au hasard : les horaires du train-ferry pour Douvres. Le hasard a de drôles d’idées.' : 'Vous n’avez rien à lire, à part votre carnet. Vous le relisez. ' + fil(api)); } },
    { re: /\becri\w* (une|un|a) (lettre|mot|carte|telegramme)\b|\becrire a\b/, run: function (api) {
      api.say(api.s.loc === 'hotel' ? 'Vous vous installez au petit bureau, avec le papier à en-tête de l’hôtel. Les mots viennent mal ; vous en barrez la moitié. Vous confiez la lettre au concierge pour la levée de six heures.' : 'Vous griffonnez quelques lignes dans votre carnet, à poster plus tard.');
      api.time(30); return true; } },
    { re: /\b(metro|underground|tube|omnibus|autobus|bus|tramway|tram)\b/, run: function (api) {
      api.say('Le métro de Holborn sent le soufre et l’électricité ; les omnibus se perdent dans le brouillard. Un taxi reste encore le plus sûr pour aller où l’on veut.');
      var c = H.destChips ? H.destChips(api) : []; if (c && c.length) api.chips(c.slice(0, 4)); return true; } },
    { re: /\b(banque|retirer de l argent|cheque|changer de l argent|bureau de change)\b/, run: function (api) {
      var h = hour(api.s.min), dim = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'][(4 + day(api.s.min)) % 7] === 'dimanche';
      if (dim || h < 10 || h >= 15) return quoi(api, 'Les banques de Holborn ouvrent de dix heures à trois heures, et jamais le dimanche. Leurs grilles sont tirées.');
      if (api.flag('banque')) return quoi(api, 'Le caissier de la Lloyds vous reconnaît, et vous fait comprendre qu’un chèque de voyage par semaine, c’est déjà beaucoup.');
      api.flag('banque', true); api.time(40);
      api.s.money = (api.s.money || 0) + 10;
      return quoi(api, 'À la Lloyds de High Holborn, un caissier à manchettes de lustrine examine votre chèque de voyage comme s’il était contrefait, puis vous compte dix livres en billets neufs.'); } },
    { re: /\b(cinema|film|theatre|music hall|spectacle|opera|concert|danse a l hippodrome)\b/, run: function (api) {
      if (hour(api.s.min) < 18) return quoi(api, 'Les théâtres et les cinémas n’ouvrent que le soir. À cette heure, il n’y a que les répétitions et les femmes de ménage.');
      api.time(120);
      return quoi(api, 'Au Holborn Empire, un comique en habit fait rire la salle, une chanteuse fait pleurer le balcon, et un prestidigitateur coupe une femme en deux. Elle revient saluer, entière. Vous applaudissez avec les autres, et pendant deux heures vous oubliez. En sortant, le brouillard vous attend sur le trottoir, comme un ami fidèle. ' + fil(api)); } },
    { re: /\b(mettre|mets|met|foutre|fous) le feu\b|\bincendi(er|e la|e le)\b/, run: function (api) {
      return quoi(api, 'Vous sortez vos allumettes, et vous revoyez la maison de Smith, et la chambre de Cheapside, et l’odeur. Vous les rangez. Il y a eu assez de feu dans cette histoire.'); } },
    { re: /\b(avouer|me rendre|me livrer|me denoncer)\b.*\b(police|yard|meurtre|crime|fleming)\b/, run: function (api) {
      if (api.flag('tueur') || api.flag('meurtre')) return false; // le vrai crime : la police s'en charge ailleurs
      return quoi(api, 'Avouer quoi ? Vous n’avez tué personne. L’inspecteur Fleming vous écouterait trois minutes, puis vous ferait raccompagner par un agent qui vous parlerait très lentement.'); } },
    { re: /\b(pompes|abdos|abdominaux|gymnastique|courir|footing|jogging|etirements|sport)\b/, run: function (api) {
      return quoi(api, dehors(api) ? 'Vous courez un peu, pour vous réchauffer. Au bout de cent mètres, le brouillard vous brûle les poumons et un agent vous suit des yeux, la main sur son sifflet.' : 'Quelques flexions, quelques pompes sur le tapis. Le sang revient dans vos mains. Pour la tête, il faudra autre chose.'); } },
    { re: /\bjou\w* (aux cartes|a la belote|aux echecs|au bridge|une reussite|aux des|au poker|au whist)\b/, run: function (api) {
      if (api.s.loc === 'pub') { api.exec('pb_flechettes'); return true; }
      return quoi(api, api.s.loc === 'hotel' ? 'Vous faites une réussite sur le couvre-lit avec le jeu de cartes du tiroir. Elle ne sort pas. Elle ne sort jamais, avec ce jeu-là : il manque la dame de pique.' : 'Personne ici ne joue aux cartes avec un{e} inconnu{e}. Au pub, peut-être.'); } },
    { re: /\b(un medecin|un docteur|l hopital|un hopital|une pharmacie|me soigner|me faire soigner)\b/, run: function (api) {
      if (api.s.pc && api.s.pc.key === 'pemberton') return quoi(api, 'Un médecin ? Vous en êtes un. Vous ouvrez votre trousse et vous vous examinez vous-même, avec la sévérité qu’on réserve aux patients qui ne vous écoutent jamais.');
      return quoi(api, 'Il y a une pharmacie dans Southampton Row, et l’hôpital de Great Ormond Street à cinq minutes. Mais ce qui vous fait mal, ce soir, aucun pharmacien ne le vend en flacon.'); } },
    { re: /\b(chat|chats|chien|chiens|pigeon|pigeons|rat|rats|corbeau)\b/, run: function (api) {
      return quoi(api, api.s.loc === 'cave' ? 'Un rat traverse la cave en longeant le mur, sans se presser, comme le vrai maître des lieux.' : dehors(api) ? 'Un chat noir vous observe depuis une grille, puis disparaît dans le brouillard. Pas de superstition, s’il vous plaît.' : 'Le chat de la maison, un gros tigré, se frotte contre vos jambes, puis file en crachant vers quelque chose que vous ne voyez pas.'); } }
  ];
  L.improvise = function (api, p) {
    var t = ' ' + (p.text || '') + ' ';
    api.s.lastText = t;
    for (var i = 0; i < REGLES.length; i++) {
      if (REGLES[i].re.test(t)) { var ok = REGLES[i].run(api, p); if (ok !== false) return true; }
    }
    return false;
  };

  // ================================================================ l'abandon : une vraie fin, seulement si on la choisit deux fois
  if (L.locations.victoria) {
    L.locations.victoria.actions.push(
      { id: 'v_abandon', label: 'Rentrer en France', verbs: [], nouns: [], cond: function (api) { return !api.has('QUETE'); },
        run: function (api) {
          api.say('Vous montez dans le train de Douvres. Le porteur hisse votre valise dans le filet, le chef de gare siffle, et Londres s’éloigne derrière la vapeur. À Calais, le soleil. À Paris, le soir, des gens qui ont tous leur propre visage.');
          api.say('Trois semaines plus tard, un entrefilet dans votre journal : le professeur Julius Smith, de l’université de Londres, porté disparu. Vous découpez l’article et vous le rangez dans un tiroir. Certaines nuits, vous le rouvrez. Certaines nuits, vous entendez un train qui n’est sur aucun horaire.');
          api.end();
        } },
      { id: 'v_rester', label: 'Rester à Londres', verbs: [], nouns: [], run: function (api) { api.say('Vous laissez partir le train. Le porteur hausse les épaules. ' + fil(api)); } }
    );
  }

  // les fiches de voix des nouveaux personnages
  if (L.fiches) {
    L.fiches.patron = { groupe: 'peuple', reg: 'populaire', mefiant: 0.3, tics: ['Ma foi,'], dada: ['Une pinte d’abord, les questions après. C’est la règle de la maison depuis 1729.'],
      moi: { nom: '« Barnaby Rudd. Le Museum Tavern, c’est mon père avant moi, et son père avant lui. »', metier: '« Je tire la bière et j’écoute. Surtout j’écoute. »', peur: '« La loi sur les heures d’ouverture. Et ma femme. »', defaut: ['« Ma foi, je ne saurais pas vous dire. »'] },
      sait: { SMITH: '« Le professeur ? Une demi-pinte, jamais plus. Enfin, avant. »', HOTEL: '« Votre hôtel ? À deux pas. Tous les étrangers finissent ici un soir ou l’autre. »' } };
    L.fiches.hollis = { groupe: 'clerge', reg: 'soutenu', mefiant: 0.1, tics: ['Voyez-vous,'], dada: ['La foi, voyez-vous, ce n’est pas d’avoir des réponses. C’est de supporter les questions.'],
      moi: { nom: '« Ambrose Hollis, pasteur de St George depuis dix-neuf ans. »', metier: '« Je console, je baptise, j’enterre. Et je perds aux échecs contre le professeur Smith. »', croit: '« Je crois en Dieu, et je crois que le brouillard de Londres a été inventé pour qu’on ne voie pas ce qu’on fait les uns aux autres. »', defaut: ['« Je ne suis qu’un pasteur, vous savez. »'] },
      sait: { SMITH: '« Julius ? Mon plus vieil adversaire, et mon ami. »', HANTISE: '« Les revenants ? L’Église est prudente. Moi aussi. Mais je ne ris plus de ceux qui ont peur. »' } };
  }
})(typeof window !== 'undefined' ? window : globalThis);
