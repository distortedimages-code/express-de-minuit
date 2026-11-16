/* Chapitre 2, seconde partie — Poissy, puis le train de nuit pour Lausanne.
   D'après la trame de la campagne (la maison du comte, les Lorien, le Bras gauche, la cantatrice du train),
   entièrement réécrit pour ce jeu. Ce module complète le chapitre de Paris (CHAPTERS.paris). */
(function (G) {
  'use strict';
  var P = G.CHAPTERS && G.CHAPTERS.paris, L = G.CHAPTERS && G.CHAPTERS.londres;
  if (!P || !P._h || !L || !L._h) return;
  var H = L._h, T = H.T, X = P._h, D = 1440;
  var at = X.at, day = X.day, hour = X.hour, jour = X.jour;
  function mn(api) { return api.s.min % D; }
  // en janvier, il fait jour de huit heures à cinq heures
  function jourLevant(api) { var m = mn(api); return m >= 8 * 60 && m < 17 * 60; }
  function crepuscule(api) { var m = mn(api); return m >= 16 * 60 + 45; }
  function francais(api) { return X.francais(api); }
  function remiLa(api) { return X.aide(api); }
  function lit(api) { return francais(api) || remiLa(api) || api.flag('veroniqueAide'); }
  var BRAS = 'Le Bras gauche du Simulacre';
  var OUTILS = 'Les outils du docteur (pelles, pioche, pied-de-biche, lanterne, sécateur)';
  var BILLETS = 'Deux places pour Aïda, à la Scala';

  // ================================================================ les lieux de Poissy
  var PZ = {
    po_ville: { label: 'la Grand-Rue', concept: 'VILLEPO', also: [] },
    po_mairie: { label: 'la mairie', concept: 'MAIRIE', also: ['ACTES', 'FAUVEL'] },
    po_eglise: { label: 'l’église Notre-Dame', concept: 'EGLISE', also: ['CURE', 'FONTS'] },
    po_auberge: { label: 'l’auberge du Lion d’or', concept: 'AUBERGE', also: ['ARNOULT'] },
    po_lorien: { label: 'la maison du docteur Lorien', concept: 'LORIEN', also: ['VERONIQUE', 'QUITTERIE'], loin: true },
    po_gare: { label: 'la gare de Poissy', concept: 'STATION', also: [] }
  };
  function connuPo(api, id) { return id !== 'po_lorien' || !!api.flag('connu:lorien'); }
  function apprendreLorien(api) {
    if (api.flag('connu:lorien')) return;
    api.flag('connu:lorien', true);
    api.sys('Nouveau lieu : la maison du docteur Lorien, route de Saint-Germain. Écrivez « aller chez le docteur » ou touchez « Où aller ? ».');
  }
  function aPoissy(api) { return /^po_/.test(api.s.loc); }
  function surLaPropriete(api) { return /^po_(jardin|caves|salle)$/.test(api.s.loc); }
  function destPo(api) {
    return Object.keys(PZ).filter(function (k) { return k !== api.s.loc && connuPo(api, k); })
      .map(function (k) { return { label: 'Aller : ' + PZ[k].label, action: 'go_' + k }; });
  }
  function minutes(de, a) {
    if (de === a) return 0;
    if (PZ[de] && PZ[de].loin || PZ[a] && PZ[a].loin) return (de === 'po_gare' || a === 'po_gare') ? 25 : 20;
    return (de === 'po_gare' || a === 'po_gare') ? 8 : 3;
  }
  // les destinations que le carnet souffle, selon l'avancée de l'enquête
  var IDEES_PO = {
    po_mairie: { idea: 'Chercher la maison du comte à la mairie', c: function (api) { return (!api.flag('connu:lorien') || (!api.flag('fouilleOK') && !api.has('VILLA') && !api.flag('plans') && !!api.flag('lettre'))) && !api.has('ACTES') && !P.disponible(api, 'fauvel'); } },
    po_eglise: { idea: 'Interroger le curé de Notre-Dame', c: function (api) { var h = hour(api.s.min); return h >= 7 && h < 19 && (!api.flag('connu:lorien') || (api.has('CELLULES') && !api.flag('corpsDeclares'))); } },
    po_lorien: { idea: 'Aller chez le docteur Lorien', c: function (api) { var h = hour(api.s.min); return !!api.flag('connu:lorien') && !api.item(BRAS) && !api.flag('lorienFerme') && h >= 8 && h < 21; } },
    po_auberge: { idea: 'Prendre une chambre au Lion d’or', c: function (api) { var h = hour(api.s.min); return (h >= 19 || h < 6) && !(api.flag('diner') && api.s.loc === 'po_lorien'); } },
    po_gare: { idea: 'Rentrer à Paris', c: function (api) { return api.item(BRAS) && mn(api) < 21 * 60 + 40 && mn(api) >= 6 * 60; } }
  };
  function goPo(id) {
    var p = PZ[id], I = IDEES_PO[id];
    return { id: 'go_' + id, label: 'Aller : ' + p.label, idea: I ? I.idea : undefined, ideaCond: I ? I.c : undefined, repeatable: true, verbs: ['ALLER', 'VISITER'], nouns: [p.concept].concat(p.also), extraVerbs: ['PRENDRE'], boost: 0.1,
      cond: function (api) { return aPoissy(api) && api.s.loc !== id && !/^po_(caves|salle)$/.test(api.s.loc); },
      run: function (api) {
        if (!connuPo(api, id)) { api.say('Vous ne savez pas encore où habite ce médecin. À la mairie, ou auprès du curé, on vous le dirait.'); return; }
        var t = minutes(api.s.loc, id);
        if (id === 'po_lorien') api.say(api.fresh('versClos', jourLevant(api)
          ? ['La route de Saint-Germain sort de la ville entre des murs de jardins. Vingt minutes à pied, sous un ciel bas.', 'Vous reprenez la route de Saint-Germain, le long des vergers nus.']
          : ['La route de Saint-Germain, sans un réverbère passé les dernières maisons. Vos pas sonnent sur le sol gelé.', 'Vous marchez dans le noir, vers la seule fenêtre allumée au bout de la route.']));
        else if (api.s.loc === 'po_lorien' || api.s.loc === 'po_jardin') api.say(api.fresh('versVille', ['Vous redescendez vers la ville, le clocher de Notre-Dame en point de mire.', 'La route de Saint-Germain, puis les premières maisons de Poissy.']));
        api.time(t); api.go(id);
      } };
  }

  // ================================================================ arriver à Poissy, en repartir
  P.arriverPoissy = function (api) {
    api.flag('connu:poissy', true);
    api.s.min += 55; api.s.tick = 0;
    api.go('po_gare');
  };
  // une sauvegarde de l'ancienne version : Paris finissait au départ du train de Poissy. On reprend là.
  P.reprise = function (api) {
    var s = api.s;
    if (!(s.ended && s.flags && s.flags.fin === 'poissy')) return;
    s.ended = false; delete s.flags.fin;
    s.log = s.log.filter(function (e) { return e.t !== 'end'; });
    api.sys('La suite du chapitre est arrivée : Poissy. Votre train de banlieue entre en gare.');
    P.arriverPoissy(api);
  };
  function versParis(api) {
    var m = mn(api);
    if (m >= 21 * 60 + 40 || m < 6 * 60) { api.say('Le dernier train pour Paris est parti à 21 h 40. Le prochain passe à six heures. L’auberge du Lion d’or a des chambres.'); return; }
    api.say(api.fresh('retourParis', ['Un train de banlieue, des banquettes de bois, des maraîchers qui dorment sur leurs paniers. Saint-Lazare, puis un taxi jusqu’à la rue de Richelieu.', 'Quarante minutes de train dans la buée des vitres, puis Paris, ses lumières, son vacarme. Vous rentrez au Cygne.']));
    if (api.item(BRAS)) api.say(api.fresh('brasTrain', ['Sur vos genoux, la valise. Vous ne la posez pas dans le filet.', 'Vous gardez la valise entre vos pieds tout le trajet. Elle est froide, à travers le cuir.']));
    api.time(70); api.go('hotel');
  }
  // la gare de Lyon : le Simplon-Orient part chaque soir à 22 h 50
  P.versLyon = function (api) {
    if (!api.item(BRAS) && !api.flag('lyonAverti')) {
      api.flag('lyonAverti', true);
      api.say('Vous consultez votre carnet avant de faire monter les bagages. ' + (api.flag('connu:poissy') ? 'À Poissy, ce qui dort sous la maison du comte y dort toujours.' : 'Poissy, et la maison du comte : vous n’y êtes pas allé{e}.') + ' Le train, lui, repassera demain soir, et tous les soirs.');
      api.chips([{ label: 'Partir quand même pour la gare de Lyon', action: 'go_lyon' }, { label: 'Relire vos notes', action: 'p_notes' }]);
      return;
    }
    api.say(api.fresh('versLyon', ['Un taxi, vos malles sanglées sur le toit. Les quais de la Seine, le pont d’Austerlitz, la grande tour de l’horloge.', 'Le chasseur du Cygne charge vos bagages dans un taxi. Vous traversez Paris d’ouest en est, sous la pluie.']));
    api.time(30); api.go('p_lyon');
  };
  P.allerAilleurs = function (api) {
    if (aPoissy(api)) { var c = destPo(api); return 'Pour aller où ? Vous connaissez : ' + c.map(function (x) { return x.label.replace('Aller : ', ''); }).join(', ') + '.'; }
    return 'Le train roule. Vous n’irez pas plus loin que la voiture-salon avant Lausanne.';
  };

  // ================================================================ ce que l'on apprend
  Object.assign(P.clues, {
    ACTES: { title: 'Les actes de 1789', text: 'Le terrier de Poissy place la maison du comte hors les murs, sur la route de Saint-Germain : le clos de la Roseraie. Vendu comme bien national en 1793, il appartient aujourd’hui au docteur Christian Lorien.' },
    LEGENDE: { title: 'Le clos du Diable', text: 'Les anciens de Poissy appelaient ainsi la propriété du comte. On y donnait des fêtes, on y entendait crier. Après l’incendie, il n’est resté debout que les rosiers.' },
    LETTRE: { title: 'Une lettre de Lausanne', text: 'Edgar Wellington, 50 rue Saint-Étienne, à Lausanne, cherche lui aussi le Simulacre de Sedefkar. Il possède un vieux rouleau qui le décrit, et sa piste l’a mené jusqu’à la maison des Lorien.' },
    SIGNES: { title: 'Trois bras gauches', text: 'La cicatrice du docteur, l’arthrite de sa femme, la brûlure de la petite : chez les Lorien, le mal frappe toujours le bras gauche.' },
    CAVOLLARO: { title: 'Une cantatrice', text: 'Caterina Cavollaro chantait hier soir à l’Opéra. Elle part pour Milan, où elle doit créer Aïda à la Scala.' },
    FENETRE: { title: 'Un visage à la fenêtre', text: 'La petite Lorien a vu quelqu’un à sa fenêtre, au premier étage, où personne ne peut grimper. Sur le givre de la vitre, côté dehors, la marque d’une main aux doigts trop longs.' },
    CELLULES: { title: 'Sous la maison', text: 'Un couloir de cellules, des squelettes, des instruments de supplice. Les fêtes du comte avaient une cave, et la cave n’était pas pour le vin.' },
    BRAS: { title: 'Le Bras gauche', text: 'Au fond des caves, au milieu de roses qui n’auraient pas dû fleurir, le bras gauche d’une statue, lisse comme de la porcelaine et froid comme elle. La première pièce du Simulacre.' },
    BRUME: { title: 'La brume', text: 'Au coucher du soleil, une brume froide s’est amassée dans la salle du bras. Quand vous l’avez soulevé, elle a tourbillonné, puis elle est remontée à l’air libre. Quelqu’un regardait.' },
    CATERINA: { title: 'La Cavollaro', text: 'Dans le train de nuit, Caterina Cavollaro vous a chanté l’air qu’elle créera à la Scala, offert deux places pour la première et promis des chambres dans la Galleria, à Milan.' }
  });

  // ================================================================ les jets
  Object.assign(P.checks, {
    persuader_fauvel: { skill: 'Persuasion', why: 'obtenir la consultation des actes de la Révolution',
      resolve: function (api, r) {
        if (r.success) { api.flag('actesOK', true); api.npc('fauvel', '« Bon. » Il soupire comme on tire un tiroir. « Les liasses de l’an II sont au grenier. Vous les consulterez ici, sous mes yeux, et vous ne recopierez rien sans me le dire. »'); api.chips([{ label: 'Consulter les actes de 1789', action: 'pm_actes' }]); }
        else { api.flag('fauvelNon', day(api.s.min)); api.npc('fauvel', '« Non. Il faut une demande écrite au maire, qui la transmettra à la préfecture, qui me la renverra. Comptez trois semaines. » Il se remet à ses écritures.'); }
      } },
    credit_fauvel: { skill: 'Crédit', why: 'faire valoir vos titres auprès du secrétaire de mairie',
      resolve: function (api, r) {
        if (r.success) { api.flag('actesOK', true); api.npc('fauvel', 'Il lit votre carte deux fois. « Ah. Dans ce cas… » Le ton change d’un étage. « Je vous installe à la table des archives. Vous serez mieux qu’à la préfecture. »'); api.chips([{ label: 'Consulter les actes de 1789', action: 'pm_actes' }]); }
        else { api.flag('fauvelNon', day(api.s.min)); api.npc('fauvel', '« Des titres, à Paris, tout le monde en a. Ici, il faut une autorisation. » Il vous rend votre carte du bout des doigts.'); }
      } },
    mairie_actes: { skill: 'Bibliothèque', why: 'retrouver la maison du comte dans les actes',
      resolve: function (api, r) {
        if (!r.success) { api.say(api.fresh('actesRate', ['Des ventes de biens nationaux, des procès de bornage, des inventaires d’abbaye. Une écriture de greffier, l’encre pâlie. Le nom du comte n’apparaît nulle part, ou bien il se cache sous un autre.', 'Trois heures dans la poussière du grenier. Vous trouvez un marchand de bois, deux curés, une veuve. Pas de comte.'])); api.say('M. Fauvel range les liasses à mesure, sans commentaire.'); return; }
        api.say('Le terrier de 1786, puis la vente de l’an II. Une parcelle hors les murs, route de Saint-Germain : « maison de plaisance, jardins, roseraie, dépendances », au nom d’un « sieur Fenalik, se disant comte ». En marge, d’une autre main : « bâtiments incendiés par ordre ». Vendu en 1793 à un marchand de vin, revendu, morcelé, oublié.');
        api.say('M. Fauvel se penche par-dessus votre épaule. « Le clos de la Roseraie ? Mais c’est chez le docteur Lorien. Il a fait bâtir là, après la guerre. »');
        api.clue('ACTES'); apprendreLorien(api);
        if (!api.has('VILLA')) { api.say('Dans la même liasse, pliée en quatre, une copie des plans levés pour la vente : la maison, ses jardins, et deux escaliers qui descendent sous terre. Vous en faites un calque.'); api.flag('plans', true); }
      } },
    toc_cicatrice: { skill: 'Trouver Objet Caché', why: 'remarquer quelque chose chez le docteur',
      resolve: function (api, r) {
        if (r.success) { api.flag('cicatriceVue', true); api.say('Pendant qu’il verse le café, sa manche remonte. Sur le dos de sa main gauche, une cicatrice mauvaise, boursouflée, qui disparaît sous la manchette.'); }
      } },
    persuader_lorien: { skill: 'Persuasion', why: 'obtenir la permission de creuser dans le jardin',
      resolve: function (api, r) {
        if (r.success) { permissionFouille(api); return; }
        api.npc('lorien', '« Creuser chez moi, sur la foi d’une vieille histoire ? » Il secoue la tête. « Pas ce soir. Revenez quand vous aurez mieux qu’une légende. Des plans, par exemple. »');
      } },
    toc_givre: { skill: 'Trouver Objet Caché', why: 'voir ce que la petite a vu',
      resolve: function (api, r) {
        if (!r.success) { api.say('La vitre, le noir, les rosiers taillés. Rien. Un cauchemar d’enfant, et un père qui a raison.'); return; }
        api.say('Sur le givre de la vitre, côté dehors, une trace. Une main posée à plat, comme pour voir à l’intérieur. Les doigts sont trop longs, et il y en a un de trop, ou bien c’est le givre qui a fondu en coulant.');
        api.clue('FENETRE'); api.check('san_fenetre');
      } },
    san_fenetre: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'regarder encore la vitre',
      resolve: function (api, r) { api.say(r.success ? 'Vous effacez la trace avec votre manche, pour l’enfant. Il n’y a rien dehors. Il n’y a rien dehors.' : 'Vous ne pouvez pas détacher les yeux de la vitre. Il fait noir, dehors, et ce noir vous regarde aussi.'); } },
    orient_marches: { skill: 'Orientation', why: 'retrouver l’escalier des caves d’après les plans',
      resolve: function (api, r) {
        if (r.success) { api.time(15); marchesTrouvees(api, 'En partant de l’ancienne entrée, sans grille depuis longtemps, vous comptez les pas du plan. Ici, au pied d’un gros chêne, la terre sonne creux sous le talon.'); return; }
        api.say('Le plan est juste, mais le jardin a changé : une serre, un potager, un chêne qui a poussé sur les ruines. Vous tournez en rond. Il faudra sonder le sol, au hasard, et de la patience.');
        api.time(60 * (1 + Math.floor(api.rand() * 4))); api.check('chance_marches');
      } },
    chance_marches: { skill: 'CHANCE', why: 'tomber sur l’escalier',
      resolve: function (api, r) {
        if (r.success) { marchesTrouvees(api, 'Une barre de fer enfoncée dans la terre heurte quelque chose de plat, de dur, de taillé. Une marche. Au pied du gros chêne, sous deux pieds de terre et de brique noircie.'); return; }
        api.say('Vous sondez, vous piochez, vous rebouchez. Des racines, des tessons, un fer à cheval. Pas d’escalier. Il faudra recommencer, ailleurs.');
      } },
    for_porte: { skill: 'FOR', label: 'Force', why: 'ouvrir la porte d’acier',
      resolve: function (api, r) {
        if (r.success) { porteOuverte(api, 'La porte cède d’un coup, dans un cri de métal, et vous manquez tomber dans le noir qu’elle retenait.'); return; }
        api.say('La porte ne bouge pas d’un cheveu. La rouille l’a soudée à son cadre, et des briques effondrées la coincent par en haut. Il faudrait un meilleur levier, ou d’autres bras.');
      } },
    san_cellules: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d3'], why: 'regarder ce qu’il y a derrière les judas',
      resolve: function (api, r) { api.say(r.success ? 'Ce sont des morts. Ils le sont depuis cent trente ans. Vous vous le répétez, et cela suffit, à peu près.' : 'Vous reculez jusqu’au mur d’en face. L’un d’eux a encore les doigts crispés sur les barreaux, et vous n’arrivez pas à oublier que c’était pour sortir.'); } },
    toc_racines: { skill: 'Trouver Objet Caché', why: 'regarder les racines de plus près',
      resolve: function (api, r) {
        if (!r.success) { api.say('Des racines, grosses comme des bras, qui forcent les joints et vous font baisser la tête. Rien d’autre.'); return; }
        api.say('Chaque racine qui perce la voûte se termine de la même façon : un nœud, et de ce nœud cinq radicelles qui s’écartent. Comme une main qui tâtonne dans le noir. Elles pointent toutes vers le fond du couloir.');
        api.check('san_racines');
      } },
    san_racines: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'ne pas y penser',
      resolve: function (api, r) { api.say(r.success ? 'Des racines. Les arbres cherchent l’eau. Voilà tout.' : 'Vous passez sous les racines en rentrant les épaules, pour qu’aucune de ces mains ne vous touche.'); } },
    san_bras: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d4'], why: 'soutenir la vue de la salle',
      resolve: function (api, r) { api.say(r.success ? 'Vous vous forcez à regarder les choses une par une : des roses, des ronces, des os, un bras de pierre. Une par une, elles sont supportables.' : 'Vous fermez les yeux. Le parfum, lui, entre quand même : sucré, épais, comme une chambre de malade où l’on a trop mis de fleurs.'); } },
    dex_epines: { skill: 'DEX', label: 'Dextérité', why: 'passer la main entre les épines',
      resolve: function (api, r) {
        if (r.success) { roncesDegagees(api, 'Vous glissez le bras entre deux tiges, en retenant votre souffle. Les épines frôlent votre manche sans la mordre. Vos doigts touchent le bras de pierre : il est froid.'); return; }
        api.say('Une épine vous mord le poignet, longue comme un hameçon, et une autre. La sève noire coule dans la plaie.');
        api.hp(-1); api.check('con_infection');
      } },
    con_infection: { skill: 'CON', label: 'Constitution', why: 'résister à ce qui est entré dans la plaie',
      resolve: function (api, r) {
        if (r.success) { api.say('La piqûre brûle, puis s’engourdit. Ce n’est qu’une écorchure.'); roncesDegagees(api, 'Vous avez la main sur le bras de pierre. Il ne reste qu’à le tirer.'); return; }
        api.flag('fievre', true);
        api.say('La brûlure monte jusqu’au coude en quelques minutes. Votre bras gauche vous paraît lourd, étranger, comme celui d’un autre. Vous avez de la fièvre avant d’avoir fini de penser au mot.');
        roncesDegagees(api, 'Vous avez la main sur le bras de pierre. Le vôtre tremble.');
      } },
    san_brume: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'garder votre sang-froid dans la brume',
      resolve: function (api, r) { api.say(r.success ? 'La brume s’en est allée. L’air redevient l’air d’une cave. Vous respirez.' : 'Longtemps après qu’elle s’est retirée, vous sentez encore sur votre nuque le froid de la brume, comme un regard qui s’est attardé.'); } }
  });
  function marchesTrouvees(api, txt) { api.flag('marches', true); api.say(txt); api.flag('vueJardin', 'fouille'); }
  function porteOuverte(api, txt) { api.flag('porte', true); api.say(txt); api.say('Un souffle d’air humide et frais monte de l’ouverture, qui sent la terre, la pierre, et, très loin, quelque chose de sucré.'); }
  function roncesDegagees(api, txt) { api.flag('ronces', true); api.say(txt); api.chips([{ label: 'Prendre le bras', action: 'ps_prendre' }]); }
  function permissionFouille(api) {
    api.flag('fouilleOK', true); api.flag('lorienAmis', true);
    if (!api.item(OUTILS)) api.take(OUTILS);
    api.npc('lorien', '« Ma foi… » Il regarde sa femme, qui hoche la tête. « Creusez. S’il y a quelque chose sous ma maison, je préfère le savoir. Il y a des pelles et une pioche dans la remise, un pied-de-biche, une lanterne. Je vous aiderai le soir, quand j’aurai fini mes visites. »');
  }

  // ================================================================ les personnages
  Object.assign(P.npcs, {
    fauvel: H.npc({ id: 'fauvel', name: 'M. Fauvel, secrétaire de mairie', short: 'M. Fauvel', patience: 5, cooldown: 60, selfKeys: ['FAUVEL', 'SECRETAIRE', 'MAIRIE'], lieux: ['po_mairie'],
      greet: function (api, first) {
        if (first && !lit(api)) { api.say('Il parle vite, sec, avec l’accent de Seine-et-Oise. Vous saisissez un mot sur trois.'); }
        api.npc('fauvel', first ? 'Un homme maigre en manchettes de lustrine, moustache cirée, derrière un comptoir qu’il défend comme une barricade. « Fauvel, secrétaire de mairie. Les actes de naissance, c’est le matin. Les réclamations, par écrit. Vous désirez ? »' : api.fresh('fauvelG', ['« Encore vous. »', '« Oui ? »', 'M. Fauvel lève les yeux de son registre et les rabaisse aussitôt.']));
      },
      bye: '« Fermez la porte, il y a du courant d’air. »',
      deflect: ['« Ce n’est pas du ressort de la mairie. »', 'Il trempe sa plume, sans répondre.', '« Faites une demande écrite. »'],
      topics: [
        T('actes', ['ACTES', 'ARCHIVES', 'REGISTRE', 'HISTOIRE', 'FENALIK', 'VILLA', 'PERSUADER', 'CREDIT'], function (api) {
          if (api.has('ACTES')) { api.npc('fauvel', '« Vous avez vu ce qu’il y avait à voir. Le clos de la Roseraie, chez le docteur Lorien. Je ne vais pas vous ressortir l’an II tous les jours. »'); return; }
          if (api.flag('actesOK')) { api.npc('fauvel', '« Les liasses vous attendent. Ne dérangez pas l’ordre. »'); api.chips([{ label: 'Consulter les actes de 1789', action: 'pm_actes' }]); return; }
          if (api.flag('fauvelNon') === day(api.s.min)) { api.npc('fauvel', '« Je vous ai répondu. Revenez demain, si vous y tenez, mais la réponse sera la même. »'); return; }
          api.npc('fauvel', '« Les actes de la Révolution ? » Il pose sa plume. « Ce n’est pas une bibliothèque, ici, c’est une mairie. Les archives anciennes ne sortent pas sans autorisation, et je ne vois pas d’autorisation. »');
          api.chips([{ label: 'Insister poliment', action: 'pm_persuader' }, { label: 'Faire valoir vos titres', action: 'pm_credit' }, { label: 'Glisser un billet de dix francs', action: 'pm_billet' }]);
        }, { chip: 'Les actes de 1789' }),
        T('lorien', ['LORIEN', 'VERONIQUE', 'QUITTERIE'], function (api) {
          if (!api.flag('connu:lorien')) { api.npc('fauvel', '« Un médecin ? Nous en avons deux. Lequel ? »'); return; }
          api.npc('fauvel', '« Le docteur Lorien ? Il a acheté le clos de la Roseraie en 1918, et il y a fait bâtir. Un homme sérieux. Il soigne les gens de la route sans les faire payer, ce qui ne plaît pas à tout le monde. »');
        }, { chip: 'Le docteur Lorien', chipCond: function (api) { return !!api.flag('connu:lorien'); } }),
        T('poissy', ['POISSY', 'VILLEPO', 'EGLISE'], ['« Poissy, c’est Saint Louis, le marché aux bestiaux, et la Seine qui déborde un hiver sur deux. Le reste, demandez au curé : il aime raconter. »']),
        T('heures', ['HEURE'], ['« La mairie ouvre de neuf heures à midi, et de deux heures à cinq. Le dimanche, elle est fermée, comme tout ce qui est respectable. »']),
        T('lui', ['TOIMEME'], ['« Vingt-six ans de mairie, trois maires, une guerre. Je suis toujours là. Les maires, non. »'])
      ] }),
    thibierge: H.npc({ id: 'thibierge', name: 'L’abbé Thibierge, curé de Notre-Dame', short: 'L’abbé Thibierge', patience: 9, cooldown: 20, selfKeys: ['CURE'], lieux: ['po_eglise'],
      greet: function (api, first) { api.npc('thibierge', first ? 'Un vieux prêtre au nez de boxeur, la soutane verdie aux genoux, qui sort de la sacristie en essuyant ses lunettes. « Thibierge, curé de cette paroisse. Vous n’êtes pas d’ici. Vous venez pour Saint Louis, comme les Anglais ? »' : api.fresh('cureG', ['« Vous revoilà, mon enfant. »', 'L’abbé Thibierge vous fait signe d’approcher.', '« Alors ? »'])); },
      bye: '« Allez en paix. Et couvrez-vous : cette église est une glacière. »',
      deflect: ['« Je ne suis qu’un curé de campagne, mon enfant. »', 'Il sourit, sans répondre.', '« Le bon Dieu le sait, sans doute. Moi, non. »'],
      topics: [
        T('fonts', ['FONTS', 'EGLISE', 'POISSY', 'HISTOIRE'], ['« Saint Louis a été baptisé ici, dans ces fonts. Les gens d’ici grattent la pierre, depuis sept siècles, et boivent la poussière dans un verre d’eau contre la fièvre. » Il hausse les épaules. « Je l’interdis en chaire. Je ferme les yeux le reste du temps. »'], { chip: 'Les fonts de Saint Louis' }),
        T('comte', ['FENALIK', 'VILLA', 'SCANDALE', 'SOUSSOL', 'MALON'], function (api) {
          api.npc('thibierge', '« Le comte ? » Il cesse d’essuyer ses lunettes. « Les vieux d’ici disaient le clos du Diable. Ma grand-mère le tenait de la sienne : des fêtes toute la nuit, des voitures de Paris, et des cris qu’on prenait pour des rires. Les soldats ont tout brûlé. Il n’est resté que les rosiers, et les rosiers n’ont jamais gelé, pas même en 1879. »');
          api.npc('thibierge', '« Le docteur Lorien a fait bâtir là-dessus, après la guerre. Route de Saint-Germain, au bout. Un bon médecin. Je prie pour sa petite, qui ne dort plus. »');
          if (!api.has('LEGENDE')) api.clue('LEGENDE');
          apprendreLorien(api);
        }, { chip: 'La maison du comte' }),
        T('lorien', ['LORIEN', 'VERONIQUE', 'QUITTERIE'], ['« Christian Lorien ? Un médecin des pauvres, qui ne met pas les pieds à la messe et que je confesserais volontiers. » Il baisse la voix. « Sa femme souffre d’un bras depuis l’automne, et la petite fait des cauchemars. Une maison où l’on ne dort pas, c’est une maison qui a besoin de prières. »'], { chip: 'La famille Lorien', chipCond: function (api) { return !!api.flag('connu:lorien'); } }),
        T('morts', ['CELLULES', 'OS', 'DECES', 'CAVE'], function (api) {
          if (!api.has('CELLULES')) { api.npc('thibierge', '« Des morts ? Nous avons un cimetière pour eux, mon enfant. Ils y sont bien. »'); return; }
          if (api.flag('corpsDeclares')) { api.npc('thibierge', '« J’ai écrit à l’évêché et prévenu la gendarmerie. Ils auront une messe, et une terre bénite. Ne vous inquiétez plus d’eux. »'); return; }
          api.flag('corpsDeclares', true);
          api.npc('thibierge', 'Il vous écoute jusqu’au bout sans vous interrompre, les mains jointes. Puis il se signe, lentement. « Cent trente ans sans prière. » Il remet sa barrette. « Je préviens la gendarmerie, et l’évêché. On les remontera, on leur donnera un nom quand on pourra, une messe dans tous les cas. Laissez-moi faire. Vous avez fait la part la plus dure. »');
          api.say('En sortant de l’église, vous vous apercevez que vous respirez mieux.');
          api.gain(1);
        }, { chip: 'Les morts du clos', chipCond: function (api) { return api.has('CELLULES'); } }),
        T('lui', ['TOIMEME'], ['« Quarante ans de sacerdoce, dont trente ici. J’ai enterré deux générations, et j’ai vu revenir celle de 1914 en moins grand nombre qu’elle n’était partie. »'])
      ] }),
    arnoult: H.npc({ id: 'arnoult', name: 'Mme Arnoult, patronne du Lion d’or', short: 'Mme Arnoult', patience: 9, cooldown: 20, selfKeys: ['ARNOULT', 'PATRON'], lieux: ['po_auberge'],
      greet: function (api, first) { api.npc('arnoult', first ? 'Une femme large, les manches retroussées, qui vous jauge en essuyant un verre. « Arnoult, la patronne. Une chambre, un repas, ou les deux ? À Poissy, on ne vient pas pour autre chose, en janvier. »' : api.fresh('arnoultG', ['« Ah, c’est vous. »', '« Qu’est-ce qu’il vous faut ? »', 'Mme Arnoult pose son torchon.'])); },
      bye: '« À ce soir, peut-être. »',
      deflect: ['« Ça, je saurais pas vous dire. »', '« Demandez au curé, il sait tout, lui. »', 'Elle hausse les épaules.'],
      topics: [
        T('chambre', ['CHAMBRE', 'DORMIR', 'ARGENT', 'AUBERGE'], function (api) {
          if (api.flag('chambrePo')) { api.npc('arnoult', '« Votre chambre est faite. La clé est au tableau. »'); return; }
          if (!api.pay(0.15)) { api.npc('arnoult', '« Dix francs la nuit, avec la soupe. Vous les avez pas ? Alors pas de chambre. »'); return; }
          api.flag('chambrePo', true);
          api.npc('arnoult', '« Dix francs, la soupe comprise. La chambre donne sur la cour : vous aurez pas le bruit des charrettes. » Elle décroche une grosse clé. « Le numéro trois. »');
        }, { chip: 'Prendre une chambre' }),
        T('lorien', ['LORIEN', 'VERONIQUE', 'QUITTERIE', 'ROSES'], ['« Le docteur ? Un brave homme. Il m’a sauvé mon garçon d’une pneumonie, et il a pas voulu d’argent. » Elle baisse la voix. « Mais chez lui, ça va pas. La dame a le bras tout tordu depuis l’automne, et la petite crie la nuit, que les voisins l’entendent. Et ses rosiers, alors : le facteur s’y est ouvert la main jusqu’à l’os. »'], { chip: 'Les Lorien', chipCond: function (api) { return !!api.flag('connu:lorien'); } }),
        T('comte', ['FENALIK', 'VILLA', 'HISTOIRE', 'SOUSSOL'], ['« Le comte ? Ma mère disait qu’il y avait des souterrains jusqu’à la Seine, et que les soirs de brouillard on entendait encore la musique. » Elle rit. « Ma mère disait beaucoup de choses. Demandez au curé, c’est son rayon. »']),
        T('outils', ['OUTILS', 'TERRASSIERS', 'CREUSER', 'AIDE'], function (api) {
          if (api.flag('terrassiers')) { api.npc('arnoult', '« Les Pruvost seront chez le docteur à l’heure dite. Ils boivent, mais ils viennent. »'); return; }
          api.npc('arnoult', '« Des bras pour creuser ? Les frères Pruvost. Ils font les tranchées pour la commune, et le reste du temps ils sont au comptoir. Vingt-cinq francs la journée pour les deux, et le litre à midi. »');
          api.chips([{ label: 'Engager les frères Pruvost (vingt-cinq francs)', action: 'pa_pruvost' }]);
        }, { chip: 'Trouver des terrassiers' }),
        T('lui', ['TOIMEME'], ['« Le Lion d’or est à ma famille depuis Louis-Philippe. Mon mari tient la cave, moi je tiens le reste, et surtout mon mari. »'])
      ] }),
    lorien: H.npc({ id: 'lorien', name: 'Le docteur Christian Lorien', short: 'Le docteur Lorien', patience: 9, cooldown: 20, selfKeys: ['LORIEN', 'DOCTEUR'], lieux: ['po_lorien', 'po_jardin'],
      greet: function (api, first) {
        if (first) { premiereVisite(api); return; }
        api.npc('lorien', api.fresh('lorienG', ['« Entrez, entrez. »', 'Christian Lorien s’essuie les mains à un torchon. « Alors ? »', '« Vous revoilà. Un café ? »']));
      },
      bye: '« À tout à l’heure. »',
      deflect: ['« Je ne suis pas sûr de comprendre. »', 'Il sourit poliment, attendant la suite.', '« Expliquez-moi ça autrement. »'],
      topics: [
        T('histoire', ['FENALIK', 'SIMULACRE', 'VILLA', 'HISTOIRE', 'ACTES', 'POISSY', 'SMITH', 'SCANDALE'], function (api) { lettreWellington(api); }, { chip: 'Lui raconter pourquoi vous êtes là' }),
        T('cicatrice', ['CICATRICE'], function (api) {
          if (!api.flag('cicatriceVue')) { api.npc('lorien', '« Une cicatrice ? » Il tire sur sa manche, machinalement. « Le métier, vous savez. »'); return; }
          api.npc('lorien', '« Ça ? » Il regarde sa main comme si elle appartenait à un patient. « Les rosiers, l’hiver dernier. En les taillant. Une épine, rien du tout, et la plaie s’est infectée. J’ai eu de la fièvre trois semaines. Moi, médecin. » Il rit sans conviction. « Depuis, la main est froide, le soir. »');
          signes(api);
        }, { chip: 'La cicatrice de sa main', chipCond: function (api) { return !!api.flag('cicatriceVue'); } }),
        T('veronique', ['VERONIQUE'], ['« Ma femme se repose là-haut. Une arthrite, au bras gauche, depuis l’automne. À trente ans. » Il soupire. « Je lui ai donné un calmant. Elle descendra pour le dîner, si elle peut. »'], { chip: 'Sa femme' }),
        T('quitterie', ['QUITTERIE'], ['« Trois ans, et déjà la maîtresse de maison. » Il caresse les cheveux de la petite. « Elle dort mal, ces temps-ci. Des cauchemars. C’est l’âge, sans doute. Je me le dis. »'], { chip: 'La petite' }),
        T('roses', ['ROSES', 'JARDIN'], ['« Les rosiers étaient là quand j’ai acheté. Plus vieux que tout le reste, plus vieux que le mur. Je les taille chaque hiver, et ils me le font payer. » Il montre la fenêtre. « Au printemps, c’est un mur de fleurs. On vient de Saint-Germain pour les voir. »'], { chip: 'Les rosiers' }),
        T('fouille', ['CREUSER', 'CAVE', 'SOUSSOL', 'PLAN', 'VILLA', 'OUTILS'], function (api) {
          if (api.flag('fouilleOK')) { api.npc('lorien', '« Les outils sont dans la remise. Prenez ce qu’il vous faut. »'); if (!api.item(OUTILS)) api.take(OUTILS); return; }
          if (api.flag('diner') && (api.has('VILLA') || api.flag('plans'))) { permissionFouille(api); return; }
          api.npc('lorien', '« Des caves, sous mon jardin ? » Il réfléchit. « Il faudrait le prouver avant que je laisse retourner mes plates-bandes. »');
          api.check('persuader_lorien', { diff: (api.has('VILLA') || api.flag('plans')) ? 'normal' : 'difficile' });
        }, { chip: 'Lui demander de creuser', chipCond: function (api) { return !api.flag('fouilleOK') && !!api.flag('lettre'); } }),
        T('soins', ['DOCTEUR', 'SOIGNER', 'BLESSE'], function (api) {
          if (api.flag('fievre')) { api.flag('fievre', false); api.npc('lorien', 'Il examine votre poignet, et son visage se ferme. « Les mêmes épines. » Il nettoie, il panse, il vous fait avaler quelque chose d’amer. « Vous ne garderez pas de cicatrice. Moi, si. »'); api.hp(1); return; }
          if (api.sanState() >= 1 && !api.item('Un flacon de bromure')) { api.take('Un flacon de bromure'); api.flag('bromure', 6); api.npc('lorien', 'Il vous regarde un moment, en médecin. « Vous ne dormez pas, vous non plus. » Il vous tend un petit flacon brun. « Du bromure. Un cachet le soir, pas plus. »'); return; }
          api.npc('lorien', '« Vous me semblez solide. Fatigué, mais solide. »');
        }, { chip: 'Lui demander un médecin', chipCond: function (api) { return !!api.flag('fievre') || api.sanState() >= 1; } }),
        T('lui', ['TOIMEME'], ['« Lorien, Christian. Trente-trois ans. Interne à Paris, puis médecin de campagne par choix, ce que mes maîtres n’ont jamais compris. J’aime qu’on sache mon nom, et les malades d’ici le savent. »'])
      ] }),
    veronique: H.npc({ id: 'veronique', name: 'Véronique Lorien', short: 'Véronique Lorien', patience: 8, cooldown: 20, selfKeys: ['VERONIQUE'],
      greet: function (api, first) { api.npc('veronique', first ? 'Une jeune femme pâle, en robe de laine grise, qui descend l’escalier en tenant la rampe de la main droite. La gauche, repliée contre elle, est tordue comme une racine. Elle sourit malgré tout. « Véronique. Christian m’a dit que nous avions des visiteurs de Londres. C’est un événement. »' : api.fresh('veroG', ['« Je vous écoute. »', 'Véronique ramène son châle sur son bras malade.'])); },
      bye: '« Bonne nuit, si nous ne nous revoyons pas. »',
      deflect: ['« Je ne sais pas. »', 'Elle regarde son mari, pour qu’il réponde.', '« Pardon, je suis un peu lasse. »'],
      topics: [
        T('opera', ['OPERA', 'CAVOLLARO', 'CHANTER', 'MILAN'], function (api) {
          api.npc('veronique', '« Vous aimez l’opéra ? Hier soir, Christian m’a emmenée entendre la Cavollaro, à l’Opéra. Je n’avais pas pu sortir depuis des semaines, et j’ai oublié mon bras pendant trois heures. » Ses yeux brillent. « Elle part pour Milan, paraît-il. Elle va créer Aïda à la Scala. Si vous passez par Milan, ne la manquez pas. »');
          if (!api.has('CAVOLLARO')) api.clue('CAVOLLARO');
        }, { chip: 'L’opéra' }),
        T('histoire', ['HISTOIRE', 'FENALIK', 'VILLA', 'PLAN', 'ACTES', 'SCANDALE'], function (api) {
          api.npc('veronique', '« J’ai fait de l’histoire à la Sorbonne, avant Christian, avant la petite. » Elle se penche sur vos papiers. « Ces plans… Mon Dieu. Christian, regarde : l’escalier part de l’ancienne entrée. La grille. Là où tu ne veux jamais que Quitterie joue. »');
          api.flag('veroniqueAide', true);
          if (api.flag('diner') && (api.has('VILLA') || api.flag('plans')) && !api.flag('fouilleOK')) permissionFouille(api);
        }, { chip: 'L’histoire de la maison' }),
        T('bras', ['CICATRICE'], function (api) { api.npc('veronique', '« Mon bras ? » Elle le regarde comme on regarde un chien qui a mordu. « Depuis l’automne. Christian dit arthrite. Les médecins de Paris disent arthrite. Moi, je dis que c’est comme si quelqu’un me le tenait, la nuit, et serrait. »'); signes(api); }, { chip: 'Son bras' }),
        T('lui', ['TOIMEME'], ['« Je voulais enseigner. J’ai eu Quitterie. Je ne regrette rien, sauf peut-être de ne plus avoir le temps de lire. »'])
      ] }),
    quitterie: H.npc({ id: 'quitterie', name: 'Quitterie', short: 'Quitterie', patience: 12, cooldown: 10, selfKeys: ['QUITTERIE'], lieux: ['po_lorien'],
      greet: function (api, first) { api.npc('quitterie', first ? 'Elle vous regarde par-dessous ses boucles, sérieuse comme un juge. Puis elle tend les bras pour qu’on la prenne.' : api.fresh('quitG', ['« Encore ! »', 'Elle tire sur votre manche.', 'Quitterie vous montre sa poupée, sans un mot.'])); },
      bye: 'Elle vous fait au revoir de toute la main, très longtemps.',
      deflect: ['Elle rit, sans comprendre.', '« Non. »', 'Elle suce son pouce et vous regarde.'],
      topics: [
        T('monsieur', ['FENETRE', 'QUELQUUN', 'FANTOME'], function (api) {
          if (!api.flag('cri')) { api.npc('quitterie', '« Y a personne à la fenêtre. » Elle a l’air très sûre d’elle. Puis, plus bas : « Pas maintenant. »'); return; }
          api.npc('quitterie', '« Le monsieur. » Elle écarte les doigts, très grand. « Il a des mains comme ça. Il dit rien. Il regarde ma maison. »');
        }, { chip: 'Le monsieur de la fenêtre', chipCond: function (api) { return !!api.flag('cri'); } }),
        T('bras', ['CICATRICE'], ['Elle cache son bras gauche derrière son dos. « Ça brûle. » Puis elle vous montre sa poupée, pour changer de sujet, comme font les grandes personnes.']),
        T('jeu', ['JOUER', 'DONNER', 'POLI'], function (api) { api.npc('quitterie', api.fresh('quitJeu', ['Vous faites marcher deux doigts sur la table jusqu’à son nez. Elle rit aux éclats, et vous demande de recommencer neuf fois.', 'Vous lui racontez l’histoire d’un ours qui prenait le train. Elle vous corrige sur tous les détails.', 'Elle vous coiffe avec une cuillère. Vous vous laissez faire.'])); api.calm('quitterie', 3); }, { chip: 'Jouer avec elle', noFollow: true }),
        T('lui', ['TOIMEME'], ['« J’ai trois ans. » Elle montre quatre doigts, puis en replie un, soigneusement.'])
      ] }),
    pruvost: H.npc({ id: 'pruvost', name: 'Les frères Pruvost', short: 'Les Pruvost', patience: 6, cooldown: 30, selfKeys: ['TERRASSIERS'], lieux: ['po_jardin'],
      greet: function (api) { api.npc('pruvost', api.fresh('pruvostG', ['L’aîné crache dans ses mains. « On creuse où, patron ? »', '« Ça avance, ça avance. »', 'Le cadet s’appuie sur sa pelle. « Y a du vin, à midi ? »'])); },
      bye: '« On reprend. »',
      deflect: ['« Nous, on creuse. »', 'Ils se regardent, et haussent les épaules ensemble.'],
      topics: [T('travail', ['CREUSER', 'AIDE', 'OUTILS'], ['« Deux pieds de terre et de la brique brûlée, c’est rien. C’est ce qu’il y a dessous qui m’inquiète. » L’aîné se signe, vite, comme s’il chassait une mouche.'])] }),
    caterina: H.npc({ id: 'caterina', name: 'Caterina Cavollaro', short: 'Caterina Cavollaro', patience: 12, cooldown: 15, selfKeys: ['CAVOLLARO'], lieux: ['oe_salon'],
      greet: function (api, first) {
        if (first) { api.npc('caterina', 'Une femme brune aux épaules nues sous une étole de renard, une coupe à la main, qui rit plus fort que tout le wagon. Elle vous voit, vous désigne de sa coupe. « Vous ! Vous avez l’air d’un homme qui a besoin de champagne. Asseyez-vous. Je suis Caterina, et ce soir tout le monde est mon ami. »'.replace('d’un homme', api.pc.sex === 'f' ? 'd’une femme' : 'd’un homme')); api.flag('caterinaVue', true); return; }
        api.npc('caterina', api.fresh('catG', ['« Ah, mon ami{e} anglais{e} ! »', 'Caterina vous fait une place sur la banquette.', '« Encore un peu de champagne ? »']));
      },
      bye: '« A domani ! »',
      deflect: ['Elle rit, et vous ressert.', '« Che importa ? Buvons. »', '« Vous êtes trop sérieux{x}, ce soir. »'],
      topics: [
        T('milan', ['MILAN', 'OPERA'], ['« Milan ! Vous ne connaissez pas Milan ? Le Duomo, la Galleria, la Cène de Léonard. » Elle vous saisit le poignet. « Vous me direz quand vous arrivez. Je vous retiens des chambres dans la Galleria, au centre de tout. C’est le plus bel hôtel du monde, et je ne mens jamais quand il s’agit d’hôtels. »'], { chip: 'Milan' }),
        T('aida', ['CHANTER', 'OPERA'], ['« Aïda. Dans trois jours, à la Scala. » Elle ferme les yeux. « J’y ai vu ma première Aïda à cinq ans. Ma grand-mère m’avait dit : si tu chantes avec la cantatrice, en pensant très fort à ton vœu, il s’exauce. J’étais entrée en voulant un cheval. En sortant, je voulais chanter. » Elle rit. « Le cheval, je l’attends encore. »'], { chip: 'Aïda' }),
        T('paris', ['BN'], ['« L’Opéra de Paris, ce soir : j’ai chanté Tosca, ils ont jeté des fleurs, j’ai pleuré, et me voilà dans un train. » Elle hausse ses belles épaules. « C’est toujours comme ça. On vous aime, et on vous met dans un train. »']),
        T('lui', ['TOIMEME'], ['« Moi ? Une fille de Lombardie qui chante. Le reste, ce sont les journaux qui l’inventent, et je les laisse faire : c’est plus joli. »']),
        T('voyage', ['VOYAGE', 'TRAIN', 'SIMULACRE', 'FENALIK'], ['« Vous voyagez pour quoi ? Les affaires ? L’amour ? » Elle vous regarde par-dessus sa coupe. « Non. Vous avez les yeux de quelqu’un qui cherche un objet perdu. Je connais ces yeux. Mon impresario a les mêmes quand il a égaré son contrat. »'])
      ] }),
    bertin: H.npc({ id: 'bertin', name: 'Joseph Bertin, conducteur des Wagons-Lits', short: 'Le conducteur', patience: 9, cooldown: 15, selfKeys: ['CONDUCTEUR'], lieux: ['oe_compartiment', 'p_lyon'],
      greet: function (api) { api.npc('bertin', api.fresh('bertinG', ['« {M} désire ? »', 'Le conducteur s’incline, une main sur la poitrine.', '« À votre service. »'])); },
      bye: '« Bonne nuit, {m}. »',
      deflect: ['« Je regrette, {m}, je ne saurais dire. »', 'Il incline la tête, poliment perdu.'],
      topics: [
        T('horaire', ['HEURE', 'TRAIN', 'VOYAGE'], ['« Dijon vers deux heures, Vallorbe à cinq, et Lausanne à six heures quarante-cinq, si la neige le permet. Je frapperai à votre porte une demi-heure avant. »'], { chip: 'L’horaire' }),
        T('fourgon', ['CERCUEIL', 'BAGAGES'], ['« Le cercueil ? » Il baisse la voix. « Un monsieur âgé, mort à Paris, que la famille fait rentrer chez lui. Nous en avons souvent, en hiver. Il voyage en fourgon, avec sa lettre de voiture. Il ne dérangera personne, {m}. »'], { chip: 'Le cercueil du fourgon', chipCond: function (api) { return !!api.flag('cercueilVu'); } })
      ] })
  });
  Object.assign(P.people, { fauvel: 'M. Fauvel, secrétaire de la mairie de Poissy', thibierge: 'L’abbé Thibierge, curé de Notre-Dame de Poissy', arnoult: 'Mme Arnoult, patronne du Lion d’or', lorien: 'Le docteur Christian Lorien, médecin à Poissy', veronique: 'Véronique Lorien, sa femme', quitterie: 'Quitterie Lorien, leur fille', caterina: 'Caterina Cavollaro, cantatrice', bertin: 'Joseph Bertin, conducteur des Wagons-Lits' });
  // qui est où, et quand
  Object.assign(P.dispo, {
    fauvel: { f: function (api) { var h = hour(api.s.min); if (jour(api) === 'dimanche') return 'La mairie est fermée le dimanche.'; return (h >= 9 && h < 12) || (h >= 14 && h < 17) ? null : 'Le guichet de la mairie est fermé. Une pancarte : « Ouvert de 9 h à 12 h et de 14 h à 17 h. »'; } },
    thibierge: { f: function (api) { var h = hour(api.s.min); return h >= 7 && h < 19 ? null : 'L’église est fermée, et le presbytère éteint.'; } },
    lorien: { f: function (api) { var h = hour(api.s.min); if (api.s.loc === 'po_jardin' && h >= 8 && h < 17 && !api.flag('diner')) return 'Le docteur est en visite chez ses malades. Il rentre à cinq heures.'; return h >= 14 && h < 17 && jour(api) !== 'dimanche' && !api.flag('lorienLa') ? 'Le docteur est en visite chez ses malades. La bonne dit qu’il rentre à cinq heures.' : null; } },
    veronique: { f: function (api) { return api.flag('diner') || api.flag('gueris') ? null : 'Mme Lorien se repose, là-haut. On ne la dérange pas.'; } },
    quitterie: { f: function (api) { var h = hour(api.s.min); return h >= 20 || h < 7 ? 'La petite dort. Pour une fois.' : null; } }
  });

  // ================================================================ chez les Lorien
  function premiereVisite(api) {
    api.say('Christian Lorien vous fait entrer dans une cuisine où tout est blanc, chaud et propre, et met de l’eau à bouillir pour le café. La trentaine, grand, des mains de médecin, un sourire qui hésite. Une petite fille en tablier est collée à ses jambes et vous examine.');
    api.npc('lorien', '« Des visiteurs de Londres, à Poissy, en janvier ? Asseyez-vous près du fourneau. Vous me raconterez ce qui vous amène pendant que l’eau chauffe. »');
    api.say('La petite fait le tour de la table, vous choisit, et grimpe sur vos genoux sans demander la permission. « C’est Quitterie, dit son père. Elle a décidé que vous étiez à elle. Je vous plains. »');
    api.flag('lorienVu', true); api.flag('vueLorien', 'cuisine');
    api.check('toc_cicatrice');
  }
  function lettreWellington(api) {
    if (api.flag('lettre')) { api.npc('lorien', '« Vous avez la lettre de ce M. Wellington. Je n’en sais pas davantage, je vous assure. »'); return; }
    api.flag('lettre', true);
    var franc = api.has('MALON') || api.has('ACTES') || api.has('LEGENDE');
    api.npc('lorien', franc ? '« Le comte… le clos du Diable… » Il pose la cafetière. « Vous n’êtes pas les premiers à vous intéresser à ce qu’il y avait ici. Attendez. Ma femme garde tout. »' : '« Une statue ? Un comte ? » Il fronce les sourcils. « Le nom me dit quelque chose. Attendez, ma femme garde tout. »');
    api.say('Il monte. Vous l’entendez parler bas, à l’étage, et une voix de femme lui répondre. Il redescend avec une enveloppe timbrée de Suisse.');
    api.doc('LETTRE D’EDGAR WELLINGTON — 50, rue Saint-Étienne, Lausanne. Aux occupants de la maison. Pardonnez la liberté d’un inconnu : cette lettre ne vous dira sans doute rien. Je m’appelle Edgar Wellington et je recherche l’histoire d’une statue qu’on nomme le Simulacre de Sedefkar. Un vieux rouleau, entré récemment en ma possession, la décrit d’une manière qui m’a intrigué, et j’essaie depuis d’en suivre la trace. Mes recherches me mènent à votre adresse : la dernière demeure connue de cette œuvre fut, à la fin du siècle dernier, la maison qui s’élevait sur votre terrain. C’était une pièce arabe, unique en son genre, perdue dans les désordres de 1789 ; son dernier propriétaire était un noble allemand. Si vous avez entendu dans le pays quelque récit à ce sujet, ou trouvé sur votre terrain des traces de l’ancienne maison, auriez-vous la bonté de me l’écrire ? Je vous prie d’excuser l’étrangeté de cette demande. Votre dévoué, Edgar Wellington.', 'Lettre reçue par les Lorien · juillet 1922');
    api.clue('LETTRE');
    api.npc('lorien', '« Elle est arrivée l’été dernier. Je n’ai jamais répondu. Je ne savais pas quoi lui dire, et puis la petite, mon bras… Copiez ce que vous voulez : elle n’est adressée à personne en particulier. »');
    // l'accident du café
    api.say('C’est à ce moment que Quitterie se tortille sur vos genoux et heurte votre bras. Le café vous inonde les cuisses et éclabousse le bras gauche de l’enfant. Il n’est pas bouillant. Elle hurle pourtant comme si on lui coupait le bras.');
    api.say('Son père l’emporte, la berce, lui passe une lotion qui sent la violette. Quand il la ramène, une longue traînée rouge court sur son bras gauche, du poignet au coude, bien plus longue que les gouttes ne l’étaient.');
    api.flag('cafe', true); signes(api);
    if (!api.flag('invite')) {
      api.flag('invite', true);
      api.npc('lorien', '« Je suis désolé. Elle est à vif, ces temps-ci. » Il hésite. « Restez dîner, voulez-vous ? Ma femme descendra, si elle peut. Nous voyons si peu de monde. Sept heures et demie. »');
    }
  }
  function signes(api) {
    var n = (api.flag('cicatriceVue') ? 1 : 0) + (api.flag('cafe') ? 1 : 0) + (api.flag('diner') || api.flag('veroniqueVue') ? 1 : 0);
    if (n >= 2 && !api.has('SIGNES')) { api.clue('SIGNES'); api.say('La main du père, le bras de la mère, le bras de l’enfant. Le gauche, chaque fois. Vous le notez, et vous n’aimez pas la forme que prend la phrase dans votre carnet.'); }
  }
  function diner(api) {
    api.flag('diner', true); api.flag('veroniqueVue', true); api.flag('lorienLa', true); api.flag('vueLorien', 'diner');
    var m = mn(api); if (m < 19 * 60 + 30) { api.s.min += 19 * 60 + 30 - m; api.s.tick = 0; }
    api.say('Christian Lorien cuisine lui-même, et bien : une soupe de poireaux, un lapin aux pruneaux, un vin de Touraine. On a mis la petite au lit de bonne heure. Véronique descend au moment de passer à table.');
    api.talk('veronique');
    api.endTalk(false);
    api.say('La conversation va de Londres à la guerre, de la guerre à la Sorbonne. Véronique veut tout savoir de vous ; elle rit, souvent, en serrant contre elle sa main gauche repliée.');
    if (!api.has('CAVOLLARO')) { api.say('« Vous aimez l’opéra ? demande-t-elle. Hier soir, Christian m’a emmenée entendre la Cavollaro. Elle part chanter Aïda à la Scala. Si vous passez par Milan… »'); api.clue('CAVOLLARO'); }
    signes(api);
    if (api.has('VILLA') || api.flag('plans')) {
      api.say('Au café, vous étalez les plans de la maison du comte sur la nappe. Véronique pousse un petit cri et pose son doigt valide sur l’escalier qui part de l’ancienne entrée. Christian se lève pour regarder par la fenêtre, vers les rosiers, et reste longtemps silencieux.');
      permissionFouille(api);
    }
    // le cri
    api.say('Un cri, à l’étage. Des pieds nus dans l’escalier : Quitterie se jette dans les jupes de sa mère, en larmes. « Le monsieur ! Le monsieur à la fenêtre ! »');
    api.npc('lorien', '« Un cauchemar. » Il la prend dans ses bras. « Personne ne peut grimper jusque-là, ma chérie. C’est le premier étage, et les rosiers sont dessous. Personne. »');
    api.say('Sur le bras gauche de l’enfant, la traînée rouge de l’après-midi est devenue violette.');
    api.flag('cri', true);
    api.chips([{ label: 'Monter voir la fenêtre de la petite', action: 'pl_fenetre' }, { label: 'Accepter la chambre d’amis', action: 'pl_dormir' }]);
    api.npc('lorien', '« Il est tard, et la route est noire. Nous avons une chambre d’amis. Restez, je vous en prie. Ça nous fera du bien, de ne pas être seuls cette nuit. »');
  }
  function nuitLorien(api) {
    var premiere = !api.flag('nuitLorien');
    api.flag('nuitLorien', true);
    var d = day(api.s.min) + (hour(api.s.min) >= 8 ? 1 : 0);
    if (premiere) {
      api.say('La chambre d’amis sent la lavande et le linge froid. Vous ne dormez pas tout de suite. Vers deux heures, il vous semble entendre quelqu’un marcher dans le jardin, sur la terre gelée, à pas très lents. Puis plus rien.');
      api.say('Le matin se lève clair, presque doux pour janvier. Une lumière pâle sur les rosiers taillés. Christian a déjà fait le café, et la petite a dormi.');
    } else api.say(api.fresh('nuitLorienR', ['La chambre d’amis, la lavande, le linge froid. Vous dormez d’un sommeil lourd, sans rêves.', 'Une nuit chez les Lorien. Au matin, l’odeur du café monte de la cuisine.']));
    api.s.min = d * D + 8 * 60; api.s.tick = 0; api.flag('vueLorien', 'cuisine');
    // la nuit a fait son œuvre : le père cède, même sans plans
    if (api.flag('cri') && api.flag('lettre') && !api.flag('fouilleOK') && !api.item(BRAS)) {
      api.say('Christian Lorien n’a pas dormi. Il a passé la nuit dans un fauteuil, devant la chambre de la petite, et il a des yeux de garde de nuit.');
      api.npc('lorien', '« Vers deux heures, j’ai entendu marcher sous la fenêtre de Quitterie. Ce matin, il y avait des traces dans le givre, et elles ne repartaient pas. » Il pose sa tasse. « Je ne crois pas à vos histoires. Mais je veux savoir ce qu’il y a sous ma maison. »');
      permissionFouille(api);
    }
  }
  // revenir à la maison après avoir pris le bras : les Lorien guérissent
  function guerison(api) {
    if (!api.item(BRAS) || api.flag('gueris')) return false;
    api.flag('gueris', true); api.flag('veroniqueVue', true);
    api.say('Dans la cuisine, Christian Lorien est assis, sa main gauche ouverte sur la table. Il la regarde. La cicatrice a pâli comme une vieille encre.');
    api.say('Véronique descend l’escalier sans tenir la rampe. Elle plie et déplie les doigts de sa main gauche, lentement, comme on essaie un gant neuf, et elle pleure sans s’en rendre compte. En haut, la petite dort, d’un sommeil d’enfant, enfin.');
    api.npc('lorien', '« Je ne sais pas ce que vous avez remonté de là-dessous. » Il ne regarde pas votre valise. « Je ne veux pas le savoir. Emportez-le loin d’ici. Et merci. »');
    api.flag('lorienAmis', true);
    return true;
  }

  // ================================================================ les lieux
  Object.assign(P.locations, {
    po_gare: { name: 'La gare de Poissy', art: 'po_gare',
      enter: function (api, first) {
        if (first) {
          api.say('Un quai, une marquise de fonte, un chef de gare qui tape des pieds dans le froid. Au bout de l’avenue, la ville : des toits d’ardoise, le clocher carré de Notre-Dame, et, en contrebas, la Seine grise entre ses peupliers. Ça sent la fumée de bois et le fumier des marchés.');
          api.sys('Poissy. Le capitaine Malon parlait d’une maison brûlée. Il faut d’abord savoir où elle était : à la mairie, sans doute, ou auprès des gens d’ici.');
          return;
        }
        api.say(api.fresh('pgR', ['La petite gare de Poissy, son poêle, ses horaires sous verre.', 'Le quai de Poissy. Un train de marchandises passe sans s’arrêter.']));
      },
      things: [{ label: 'le chef de gare', ids: ['QUELQUUN'] }, { label: 'les horaires', ids: ['HEURE', 'TRAIN'] }, { label: null, ids: ['STATION', 'SALLE', 'PORTE'] }],
      ambient: ['Un train de marchandises passe sans s’arrêter, interminable.', 'Le chef de gare souffle dans ses mains.', 'Une cloche électrique annonce un train qui ne vient pas.'],
      actions: [
        { id: 'pg_look', label: 'Regarder la gare', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['STATION', 'SALLE'], bare: true,
          run: function (api) { api.say(api.fresh('pglook', ['Une salle d’attente, un poêle rouge, une affiche de l’Exposition coloniale de Marseille qui se décolle. Sur le quai, deux maraîchers et leurs paniers.', 'D’ici, on voit toute la ville monter vers son église. Le reste est champs, peupliers, et la forêt de Saint-Germain, noire, à l’horizon.'])); } },
        { id: 'pg_ville', label: 'Monter vers la ville', idea: true, verbs: ['ALLER', 'VISITER'], nouns: ['VILLEPO', 'POISSY'], bare: true,
          run: function (api) { api.say('L’avenue de la gare, des platanes taillés en moignons, des maisons basses. Dix minutes à pied.'); api.time(8); api.go('po_ville'); } },
        { id: 'pg_chef', label: 'Demander votre chemin au chef de gare', verbs: ['PARLER'], nouns: ['QUELQUUN', 'DESTINATIONS'], repeatable: true,
          run: function (api) { api.say('« La mairie, l’église, le Lion d’or : tout en haut, sur la place. Vous pouvez pas les manquer. »' + (api.flag('connu:lorien') ? ' Il réfléchit. « Le docteur Lorien ? Route de Saint-Germain, la dernière maison, celle aux rosiers. »' : ' « Le reste, c’est des champs. »')); } },
        { id: 'pg_train', label: 'Prendre le train pour Paris', idea: true, ideaCond: function (api) { return api.item(BRAS) || hour(api.s.min) >= 18; }, verbs: ['PRENDRE', 'ALLER', 'RETOUR'], nouns: ['TRAIN', 'STATION'], repeatable: true,
          run: function (api) { versParis(api); } }
      ] },
    po_ville: { name: 'La Grand-Rue de Poissy', art: 'po_ville',
      enter: function (api, first) {
        if (first) { api.say('La Grand-Rue monte entre des maisons à pignons vers une place où tout se tient : l’église Notre-Dame, grise et trapue, son clocher roman ; la mairie, drapeau délavé ; et l’auberge du Lion d’or, dont l’enseigne de fer grince au vent. Des femmes en fichu font la queue chez le boulanger.'); return; }
        api.say(api.fresh('pvR', ['La place de l’église, ses pavés, son marronnier nu.', 'La Grand-Rue de Poissy. Un charreton de lait, un chien, deux gendarmes à bicyclette.']));
      },
      things: [{ label: 'l’église Notre-Dame', ids: ['EGLISE'] }, { label: 'la mairie', ids: ['MAIRIE'] }, { label: 'l’auberge du Lion d’or', ids: ['AUBERGE'] }, { label: 'les passants', ids: ['QUELQUUN'] }, { label: null, ids: ['VILLEPO', 'SALLE'] }],
      ambient: ['Les cloches de Notre-Dame sonnent la demie.', 'Un gendarme à bicyclette vous suit des yeux.', 'L’enseigne du Lion d’or grince au vent.'],
      actions: [
        { id: 'pv_look', label: 'Regarder la ville', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['VILLEPO', 'SALLE'], bare: true,
          run: function (api) { api.say(api.fresh('pvlook', ['Une petite ville qui a été grande : des maisons de pierre sculptées au-dessus de boutiques modestes, une tour de prieuré prise dans une grange. On a l’impression que l’histoire est passée par ici, s’est assise un moment, et ne s’est plus jamais relevée.', 'Sur la place, une plaque : « Ici naquit Saint Louis. » Le marchand de journaux, à côté, vend des cartes postales de la plaque.'])); } },
        { id: 'pv_passants', label: 'Interroger les passants sur la maison du comte', idea: true, ideaCond: function (api) { return !api.flag('connu:lorien'); }, verbs: ['PARLER'], nouns: ['QUELQUUN', 'FENALIK', 'VILLA'], needVerb: true, repeatable: true,
          run: function (api) {
            if (api.flag('connu:lorien')) { api.say('Vous savez déjà où était la maison du comte : chez le docteur Lorien.'); return; }
            api.say(api.fresh('passants', ['Un boulanger hausse les épaules : « Un comte ? Ici ? Y a eu un roi, ça oui. » Une vieille, derrière lui, se signe en entendant le mot, et presse le pas.', 'Les gens d’ici vous regardent comme on regarde un Parisien. « Demandez à la mairie. » « Demandez au curé. » Personne ne veut être celui qui sait.']));
            api.time(20);
          } }
      ] },
    po_mairie: { name: 'La mairie de Poissy', art: 'po_mairie',
      enter: function (api, first) {
        if (first) { api.say('Un escalier de pierre usé en son milieu, un couloir qui sent l’encre et le poêle à charbon. Au premier, derrière un comptoir de chêne, le secrétariat ; au-dessus, sous le toit, on devine les archives.'); return; }
        api.say(api.fresh('pmR', ['Le secrétariat de la mairie, son comptoir, son poêle.', 'La mairie. M. Fauvel lève les yeux et soupire.']));
      },
      things: [{ label: 'le secrétaire de mairie', ids: ['FAUVEL', 'SECRETAIRE', 'QUELQUUN'] }, { label: 'les archives', ids: ['ACTES', 'ARCHIVES', 'REGISTRE'] }, { label: null, ids: ['MAIRIE', 'SALLE', 'TABLE', 'LORIEN', 'POISSY'] }],
      ambient: ['Le poêle ronfle.', 'Une plume gratte, quelque part.', 'Un paysan attend son tour, la casquette à la main.'],
      actions: [
        { id: 'pm_look', label: 'Regarder le secrétariat', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['MAIRIE', 'SALLE'], bare: true,
          run: function (api) { api.say('Des avis d’imposition punaisés, une carte de la commune où quelqu’un a entouré les inondations de 1910 au crayon bleu, un buste de Marianne avec un chapeau oublié dessus.'); } },
        { id: 'pm_fauvel', label: 'Parler à M. Fauvel', ideaAnon: 'Parler au secrétaire de mairie', idea: true, talkTo: 'fauvel', verbs: ['PARLER', 'VISITER', 'POLI', 'PERSUADER'], nouns: ['FAUVEL', 'SECRETAIRE', 'QUELQUUN', 'MAIRIE'],
          extra: ['ACTES', 'ARCHIVES', 'FENALIK', 'VILLA', 'LORIEN', 'HEURE'], run: function (api, p) { api.talk('fauvel', p); } },
        { id: 'pm_persuader', label: 'Insister poliment', verbs: ['PERSUADER', 'INSISTER'], nouns: ['ACTES'], cond: function (api) { return !api.flag('actesOK') && api.flag('fauvelNon') !== day(api.s.min); },
          run: function (api) { var f = P.disponible(api, 'fauvel'); if (f) { api.say(f); return; } api.check('persuader_fauvel', { diff: lit(api) ? 'normal' : 'difficile' }); } },
        { id: 'pm_credit', label: 'Faire valoir vos titres', verbs: ['CREDIT'], nouns: ['ACTES'], cond: function (api) { return !api.flag('actesOK') && api.flag('fauvelNon') !== day(api.s.min); },
          run: function (api) { var f = P.disponible(api, 'fauvel'); if (f) { api.say(f); return; } api.check('credit_fauvel', { diff: api.pc.academic ? 'normal' : 'difficile' }); } },
        { id: 'pm_billet', label: 'Glisser un billet de dix francs', verbs: ['DONNER'], nouns: ['ARGENT', 'ACTES'], cond: function (api) { return !api.flag('actesOK'); },
          run: function (api) {
            var f = P.disponible(api, 'fauvel'); if (f) { api.say(f); return; }
            if (!api.pay(0.15)) { api.say('Vous n’avez pas dix francs sur vous.'); return; }
            api.flag('actesOK', true); api.flag('pourboireFauvel', true);
            api.npc('fauvel', 'Le billet disparaît sous un buvard. M. Fauvel ne vous regarde plus du tout. « Les archives sont au grenier. Je vous y conduis. Vous avez jusqu’à la fermeture, et vous n’avez rien vu de moi. »');
            api.chips([{ label: 'Consulter les actes de 1789', action: 'pm_actes' }]);
          } },
        { id: 'pm_actes', label: 'Consulter les actes de 1789', idea: true, ideaCond: function (api) { return !!api.flag('actesOK') && !api.has('ACTES'); }, verbs: ['FOUILLER', 'EXAMINER', 'PRENDRE', 'UTILISER'], nouns: ['ACTES', 'ARCHIVES', 'REGISTRE'], repeatable: true,
          run: function (api) {
            if (api.has('ACTES')) { api.say('Vous avez trouvé ce qu’il fallait : le clos de la Roseraie, chez le docteur Lorien.'); return; }
            if (!api.flag('actesOK')) { api.say('Les archives sont au grenier, et le secrétaire de mairie a la clé. Il faut d’abord le convaincre.'); return; }
            var f = P.disponible(api, 'fauvel'); if (f) { api.say(f); return; }
            api.say(api.fresh('actesRech', ['Sous le toit, des liasses ficelées, un œil-de-bœuf, un froid de cave. M. Fauvel vous pose une lampe et une chaise, et vous laisse avec 1789.', 'Vous reprenez les liasses là où vous les aviez laissées.']));
            var fin = day(api.s.min) * D + (hour(api.s.min) < 12 ? 12 : 17) * 60;
            api.time(Math.max(30, Math.min(180, fin - api.s.min)));
            api.check('mairie_actes', { diff: lit(api) ? 'normal' : 'difficile' });
          } }
      ] },
    po_eglise: { name: 'L’église Notre-Dame de Poissy', art: 'po_eglise',
      enter: function (api, first) {
        if (first) { api.say('Une nef romane, basse et sombre, où il fait plus froid que dehors. Des cierges, une odeur de pierre mouillée. Près de l’entrée, une cuve de pierre usée, creusée de mille entailles comme si des générations l’avaient grattée au couteau.'); return; }
        api.say(api.fresh('peR', ['La nef de Notre-Dame, ses cierges, son froid.', 'L’église. Une vieille prie au premier rang, sans bouger.']));
      },
      things: [{ label: 'les fonts baptismaux', ids: ['FONTS'] }, { label: 'le curé', ids: ['CURE', 'QUELQUUN'] }, { label: null, ids: ['EGLISE', 'SALLE', 'LAMPE', 'FENALIK', 'VILLA', 'LORIEN', 'CELLULES'] }],
      ambient: ['Une porte claque quelque part dans la sacristie.', 'Un cierge grésille.', 'Le vent siffle dans le clocher.'],
      actions: [
        { id: 'pe_look', label: 'Regarder l’église', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['EGLISE', 'SALLE'], bare: true,
          run: function (api) { api.say('Des piliers massifs, des chapiteaux où des monstres mangent des hommes, une Vierge peinte au visage écaillé. Une plaque de marbre : les morts de la paroisse, 1914-1918. Elle est longue.'); } },
        { id: 'pe_fonts', label: 'Examiner les fonts baptismaux', verbs: ['EXAMINER'], nouns: ['FONTS'],
          run: function (api) { api.say('La pierre est creusée de rayures fines, des milliers, comme si on l’avait grattée à l’ongle pendant des siècles. Les fonts où Saint Louis fut baptisé. Les gens d’ici en boivent la poussière contre la fièvre.' + (api.flag('fievre') ? ' Votre poignet vous lance. Vous y pensez une seconde de trop.' : '')); } },
        { id: 'pe_cure', label: 'Parler au curé', idea: true, talkTo: 'thibierge', verbs: ['PARLER', 'VISITER', 'POLI', 'PRIER'], nouns: ['CURE', 'QUELQUUN'],
          extra: ['FENALIK', 'VILLA', 'FONTS', 'LORIEN', 'CELLULES', 'OS', 'DECES', 'HISTOIRE'], run: function (api, p) { api.talk('thibierge', p); } }
      ] },
    po_auberge: { name: 'L’auberge du Lion d’or', art: 'po_auberge',
      enter: function (api, first) {
        if (first) { api.say('Une salle basse aux poutres noires, un comptoir de zinc, des tables cirées, une horloge comtoise. Trois rouliers jouent aux cartes près de la cheminée. La patronne essuie des verres en vous regardant entrer, avec l’air de calculer votre prix.'); return; }
        api.say(api.fresh('paR', ['La salle du Lion d’or, sa cheminée, ses rouliers.', 'Le Lion d’or. La comtoise sonne.']));
      },
      things: [{ label: 'la patronne', ids: ['ARNOULT', 'PATRON', 'QUELQUUN'] }, { label: null, ids: ['AUBERGE', 'SALLE', 'TABLE', 'BOISSON', 'CHAMBRE', 'OUTILS', 'TERRASSIERS', 'LORIEN', 'FENALIK'] }],
      ambient: ['Un roulier abat ses cartes en jurant.', 'La comtoise sonne l’heure, avec un temps de retard.', 'Une odeur de soupe aux choux sort de la cuisine.'],
      actions: [
        { id: 'pa_look', label: 'Regarder la salle', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['AUBERGE', 'SALLE'], bare: true,
          run: function (api) { api.say('Aux murs, une gravure de Saint Louis rendant la justice sous un chêne, un calendrier des Postes, un brochet empaillé. Les rouliers parlent du prix du fourrage et de la crue qui vient.'); } },
        { id: 'pa_arnoult', label: 'Parler à la patronne', idea: true, talkTo: 'arnoult', verbs: ['PARLER', 'VISITER', 'POLI', 'COMMANDER'], nouns: ['ARNOULT', 'PATRON', 'QUELQUUN'],
          extra: ['CHAMBRE', 'LORIEN', 'ROSES', 'FENALIK', 'OUTILS', 'TERRASSIERS', 'DORMIR'], run: function (api, p) { api.talk('arnoult', p); } },
        { id: 'pa_pruvost', label: 'Engager les frères Pruvost', verbs: ['DONNER', 'COMMANDER'], nouns: ['TERRASSIERS'], cond: function (api) { return !api.flag('terrassiers'); },
          run: function (api) {
            if (!api.pay(0.4)) { api.say('Vingt-cinq francs : vous ne les avez pas.'); return; }
            var h = hour(api.s.min), demain = h >= 10;
            api.flag('terrassiers', demain ? day(api.s.min) + 1 : day(api.s.min));
            api.npc('arnoult', '« Je vous les envoie. » Elle appelle vers le fond de la salle. Deux grands gaillards se lèvent, la casquette à la main. ' + (demain ? '« Demain, huit heures, chez le docteur. Et pas une goutte avant. »' : '« Allez-y tout de suite, chez le docteur, et pas une goutte avant midi. »'));
          } },
        { id: 'pa_diner', label: 'Dîner à l’auberge', verbs: ['MANGER', 'COMMANDER'], nouns: ['BOISSON', 'TABLE'], bare: true, repeatable: true,
          run: function (api) { api.pay(0.06); api.say(api.fresh('paDiner', ['Une soupe aux choux, une omelette, un fromage qui marche tout seul, un vin de pays. Les rouliers vous regardent manger avec bienveillance.', 'Le plat du jour : un lapin en gibelotte. La patronne vous ressert sans demander.'])); api.time(45); } },
        { id: 'pa_dormir', label: 'Dormir à l’auberge', idea: true, ideaCond: function (api) { return hour(api.s.min) >= 19 || hour(api.s.min) < 6; }, verbs: ['DORMIR', 'ATTENDRE'], nouns: ['CHAMBRE'], bare: true, repeatable: true,
          run: function (api) {
            var h = hour(api.s.min);
            if (h >= 8 && h < 18) { api.say('En plein jour ? La patronne vous regarde comme si vous étiez malade. « La chambre, c’est pour la nuit. »'); return; }
            if (!api.flag('chambrePo')) { if (!api.pay(0.15)) { api.say('Il faut dix francs pour une chambre, et vous ne les avez pas.'); return; } api.flag('chambrePo', true); api.say('Dix francs, la clé du numéro trois.'); }
            var d = day(api.s.min) + (h >= 8 ? 1 : 0);
            api.say(api.fresh('dodoPo', ['Une chambre sous les toits, un lit de plume où l’on s’enfonce, le vent dans les tuiles. Vous dormez d’un bloc.', 'Le lit grince, la cour sent le cheval, et un coq vous réveille avant le jour.']));
            api.s.min = d * D + 8 * 60; api.s.tick = 0;
            if (api.flag('lorienVu') && !api.flag('cri') && !api.flag('criAuberge')) {
              api.flag('criAuberge', true); api.flag('cri', true);
              api.say('Au petit déjeuner, la patronne pose devant vous le bol de café et, sans transition : « Paraît que la petite du docteur a encore crié cette nuit. Elle disait qu’un homme la regardait par la fenêtre. Au premier étage. » Elle s’essuie les mains. « Les enfants, ça voit des choses. »');
            }
          } }
      ] },
    po_lorien: { name: 'Chez les Lorien', art: 'po_lorien',
      enter: function (api, first) {
        if (first) {
          api.say('La dernière maison de la route de Saint-Germain se cache derrière un vieux mur de brique, plus vieux qu’elle, à demi effondré. Le mur tient debout grâce aux rosiers : des troncs gros comme le bras, taillés court pour l’hiver, noués, tordus, hérissés d’épines comme du fil de fer barbelé. L’ancienne entrée n’a plus de grille.');
          api.say('Derrière, une maison de brique à un étage, toute simple, toute neuve. La cheminée fume. Les fenêtres du bas sont jaunes et chaudes.');
        }
        if (guerison(api)) return;
        var h = hour(api.s.min);
        if (!api.flag('lorienVu') && h >= 14 && h < 17 && jour(api) !== 'dimanche') {
          api.say('Une bonne en tablier vous ouvre, une enfant sur la hanche. « Monsieur est en visite chez ses malades. Il rentre à cinq heures. » La petite vous fixe sans ciller.');
          api.chips([{ label: 'Attendre le docteur', action: 'pl_attendre' }]);
          return;
        }
        if (!first && api.flag('lorienVu')) api.say(api.fresh('plR', ['La cuisine blanche des Lorien, le fourneau, l’odeur du café.', 'Christian Lorien vous ouvre avant que vous ayez frappé.']));
        if (!api.flag('lorienVu')) api.talk('lorien');
      },
      things: [{ label: 'le docteur', ids: ['LORIEN', 'QUELQUUN'] }, { label: 'la petite', ids: ['QUITTERIE'] }, { label: 'les rosiers', ids: ['ROSES', 'JARDIN'] }, { label: null, ids: ['SALLE', 'TABLE', 'FENETRE', 'PORTE', 'VERONIQUE', 'LETTRE', 'CICATRICE', 'FENALIK', 'VILLA', 'SIMULACRE', 'OPERA', 'CAVOLLARO'] }],
      ambient: ['Le fourneau ronronne.', 'À l’étage, un plancher craque, puis se tait.', 'Quitterie chantonne une comptine, toujours la même.'],
      actions: [
        { id: 'pl_look', label: 'Regarder la maison', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE'], bare: true,
          run: function (api) { api.say(api.fresh('pllook', ['Une maison de médecin : des livres partout, une trousse sur une chaise, une gravure de Pasteur. Aux fenêtres, des rideaux de mousseline, et derrière, les rosiers taillés qui griffent les vitres quand le vent souffle.', 'Tout est neuf, net, honnête. Rien ne rappelle qu’on vit ici sur les ruines d’un autre siècle, sinon le mur, dehors, et les rosiers qui le tiennent.'])); } },
        { id: 'pl_attendre', label: 'Attendre le docteur', verbs: ['ATTENDRE'], nouns: ['LORIEN'], cond: function (api) { return !api.flag('lorienVu'); },
          run: function (api) { var m = mn(api); if (m < 17 * 60) { api.s.min += 17 * 60 - m; api.s.tick = 0; } api.say('La bonne vous fait asseoir dans la cuisine. À cinq heures passées, le cabriolet du docteur entre dans la cour.'); api.flag('lorienLa', true); api.talk('lorien'); } },
        { id: 'pl_christian', label: 'Parler au docteur Lorien', ideaAnon: 'Parler au médecin', idea: true, talkTo: 'lorien', verbs: ['PARLER', 'VISITER', 'POLI', 'PERSUADER', 'FRAPPER'], nouns: ['LORIEN', 'QUELQUUN', 'DOCTEUR'],
          extra: ['FENALIK', 'SIMULACRE', 'VILLA', 'HISTOIRE', 'CICATRICE', 'VERONIQUE', 'QUITTERIE', 'ROSES', 'CREUSER', 'CAVE', 'PLAN', 'OUTILS'], run: function (api, p) { var f = P.disponible(api, 'lorien'); if (f) { api.say(f); return; } api.talk('lorien', p); } },
        { id: 'pl_raconter', label: 'Raconter au docteur pourquoi vous êtes là', idea: 'Lui expliquer ce que vous cherchez', ideaCond: function (api) { return !!api.flag('lorienVu') && !api.flag('lettre'); }, verbs: ['PARLER'], nouns: ['FENALIK', 'SIMULACRE', 'HISTOIRE'], needVerb: true,
          run: function (api) { var f = P.disponible(api, 'lorien'); if (f) { api.say(f); return; } api.topic('lorien', 'histoire'); } },
        { id: 'pl_permission', label: 'Demander au docteur la permission de creuser', idea: true, ideaCond: function (api) { return !!api.flag('lettre') && !api.flag('fouilleOK') && !P.disponible(api, 'lorien'); }, verbs: ['PARLER', 'PERSUADER'], nouns: ['CREUSER', 'CAVE', 'SOUSSOL'], needVerb: true, cond: function (api) { return !!api.flag('lettre') && !api.flag('fouilleOK'); },
          run: function (api) { var f = P.disponible(api, 'lorien'); if (f) { api.say(f); return; } if (api.flag('permRefus') === day(api.s.min)) { api.npc('lorien', '« Je vous ai répondu tout à l’heure. Apportez-moi mieux qu’une légende, et nous verrons. »'); return; } api.flag('permRefus', day(api.s.min)); api.topic('lorien', 'fouille'); } },
        { id: 'pl_quitterie', label: 'Jouer avec la petite', talkTo: 'quitterie', verbs: ['PARLER', 'JOUER', 'POLI'], nouns: ['QUITTERIE'], extra: ['FENETRE', 'CICATRICE'],
          run: function (api, p) { var f = P.disponible(api, 'quitterie'); if (f) { api.say(f); return; } api.talk('quitterie', p); } },
        { id: 'pl_roses', label: 'Examiner les rosiers', idea: true, ideaCond: function (api) { return !api.flag('rosesVues'); }, verbs: ['EXAMINER', 'SENTIR'], nouns: ['ROSES', 'JARDIN'],
          run: function (api) {
            api.flag('rosesVues', true);
            api.say('De près, les rosiers sont plus anciens que vous ne l’aviez cru : des troncs ligneux, crevassés comme des ceps, qui sortent de terre au pied du vieux mur et s’y accrochent par des crampons. Les épines sont longues, recourbées, d’un brun presque noir. Là où le docteur a taillé, une sève sombre a coulé, et séché, comme du sang sur une coupure.');
            api.say('Ils sont plantés tout le long du mur, mais c’est près de l’ancienne entrée qu’ils sont les plus épais, comme s’ils avaient poussé vers quelque chose.');
          } },
        { id: 'pl_diner', label: 'Rester dîner', idea: true, ideaCond: function (api) { return !!api.flag('invite') && !api.flag('diner'); }, verbs: ['MANGER', 'ATTENDRE', 'ASSEOIR'], nouns: ['TABLE', 'DINER'], cond: function (api) { return !!api.flag('invite') && !api.flag('diner'); },
          run: function (api) {
            if (hour(api.s.min) < 12 && !api.flag('attendreSoir')) { api.flag('attendreSoir', true); api.say('Le dîner, c’est ce soir, à sept heures et demie. Le docteur a ses malades d’ici là.'); api.chips([{ label: 'Laisser passer la journée jusqu’au dîner', action: 'pl_diner' }]); return; }
            if (mn(api) < 18 * 60) api.say(api.fresh('apresMidi', ['Vous passez l’après-midi à marcher le long de la Seine, entre les peupliers et les barques tirées sur la berge. Le jour baisse vite. À sept heures et demie, vous revoilà à la porte des Lorien.', 'Une après-midi à Poissy : l’église, un café, la Seine qui monte. La nuit tombe à cinq heures. Vous revenez chez les Lorien à l’heure dite.']));
            diner(api);
          } },
        { id: 'pl_fenetre', label: 'Monter voir la fenêtre de la petite', idea: true, ideaCond: function (api) { return !!api.flag('cri') && !api.has('FENETRE') && !api.flag('fenetreVue'); }, verbs: ['EXAMINER', 'OUVRIR', 'ALLER'], nouns: ['FENETRE'], cond: function (api) { return !!api.flag('cri') && !api.flag('fenetreVue'); },
          run: function (api) {
            api.flag('fenetreVue', true); api.flag('vueLorien', 'chambre');
            api.say('Une chambre d’enfant, un lit-cage, une poupée tombée par terre. La fenêtre donne sur les rosiers, trois mètres plus bas. Pas une branche, pas une gouttière. Vous approchez la lampe de la vitre.');
            api.check('toc_givre');
          } },
        { id: 'pl_dormir', label: 'Accepter la chambre d’amis', idea: true, ideaCond: function (api) { var h = hour(api.s.min); return !!api.flag('diner') && !api.flag('lorienFerme') && (h >= 19 || h < 6); }, verbs: ['DORMIR', 'ATTENDRE'], nouns: ['CHAMBRE'], repeatable: true, cond: function (api) { return !!api.flag('diner') && !api.flag('lorienFerme'); },
          run: function (api) { if (hour(api.s.min) >= 8 && hour(api.s.min) < 18) { api.say('Il fait jour. Il y a mieux à faire que dormir.'); return; } nuitLorien(api); } },
        { id: 'pl_jardin', label: 'Sortir dans le jardin', idea: 'Chercher l’entrée des caves dans le jardin', ideaCond: function (api) { return !!api.flag('fouilleOK') && !api.item(BRAS); }, verbs: ['ALLER', 'CREUSER', 'FOUILLER'], nouns: ['JARDIN', 'CAVE', 'SOUSSOL', 'ESCALIER'], repeatable: true,
          run: function (api) {
            if (!api.flag('fouilleOK')) { api.say('Retourner le jardin d’un médecin sans sa permission ? Il vous faut d’abord son accord, et de bonnes raisons de le demander.'); return; }
            api.time(2); api.go('po_jardin');
          } }
      ] },
    po_jardin: { name: 'Le jardin des Lorien', art: 'po_jardin',
      enter: function (api, first) {
        if (first) api.say('Un potager endormi, une serre aux vitres embuées, un gros chêne près de l’ancienne entrée, et partout le long du mur les rosiers taillés. La terre est dure, mais pas gelée en profondeur.');
        if (api.flag('terrassiers') !== undefined && api.flag('terrassiers') !== false && day(api.s.min) >= api.flag('terrassiers') && hour(api.s.min) >= 8 && !api.flag('pruvostLa')) {
          api.flag('pruvostLa', true);
          api.say('Les frères Pruvost attendent à l’entrée, la pelle sur l’épaule, en battant la semelle.');
        }
      },
      things: [{ label: 'le gros chêne', ids: ['ESCALIER', 'JARDIN'] }, { label: 'les rosiers', ids: ['ROSES'] }, { label: null, ids: ['PORTE', 'CAVE', 'SOUSSOL', 'TERRASSIERS', 'OUTILS'] }],
      ambient: ['Un merle gratte la terre du potager.', 'Le vent fait cliqueter les vitres de la serre.', 'Dans la maison, Quitterie colle son nez à la fenêtre et vous regarde.'],
      actions: [
        { id: 'pj_look', label: 'Regarder le jardin', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['JARDIN', 'SALLE'], bare: true,
          run: function (api) {
            if (api.flag('porte')) { api.say('Au pied du chêne, la tranchée, les dix-huit marches, et en bas la porte d’acier ouverte sur le noir.'); return; }
            if (api.flag('fouilleH') >= 1) { api.say('Un trou qui s’allonge au pied du chêne, des marches de pierre qui apparaissent une à une sous la terre et la brique brûlée.'); return; }
            api.say('Le jardin ne garde rien de la maison du comte, en apparence. Puis l’œil s’habitue : un alignement de pierres sous le gazon, une butte trop régulière, un chêne qui a poussé là où il y avait sans doute une cour.');
          } },
        { id: 'pj_marches', label: 'Repérer l’escalier', idea: 'Chercher l’escalier des caves', ideaCond: function (api) { return !api.flag('marches') && jourLevant(api); }, verbs: ['FOUILLER', 'EXAMINER', 'UTILISER'], nouns: ['ESCALIER', 'PLAN', 'JARDIN', 'CAVE'], repeatable: true, cond: function (api) { return !api.flag('marches'); },
          run: function (api) {
            if (!jourLevant(api)) { api.say('Il fait nuit. Vous ne trouverez rien à la lanterne, sous les fenêtres d’une enfant qui dort mal. Demain matin.'); return; }
            if (api.has('VILLA') || api.flag('plans')) { api.say('Vous dépliez le plan sur le muret, le calez avec deux pierres, et partez de l’ancienne entrée.'); api.check('orient_marches'); return; }
            api.say('Sans plan, il faut sonder le sol, au hasard. Une barre de fer, et de la patience.');
            api.time(60 * (1 + Math.floor(api.rand() * 4))); api.check('chance_marches');
          } },
        { id: 'pj_creuser', label: 'Creuser', idea: 'Dégager l’escalier', ideaCond: function (api) { return !!api.flag('marches') && !api.flag('escalier') && jourLevant(api); }, verbs: ['CREUSER', 'FOUILLER', 'UTILISER', 'PRENDRE'], nouns: ['ESCALIER', 'JARDIN', 'OUTILS', 'CAVE'], repeatable: true, cond: function (api) { return !!api.flag('marches') && !api.flag('escalier'); },
          run: function (api) { creuser(api); } },
        { id: 'pj_porte', label: 'Forcer la porte d’acier', idea: true, ideaCond: function (api) { return !!api.flag('escalier') && !api.flag('porte'); }, verbs: ['OUVRIR', 'CASSER', 'UTILISER', 'FRAPPER'], nouns: ['PORTE', 'LEVIER', 'OUTILS'], repeatable: true, cond: function (api) { return !!api.flag('escalier') && !api.flag('porte'); },
          run: function (api) {
            if (api.flag('pruvostLa')) { porteOuverte(api, 'Les frères Pruvost passent une chaîne autour de la poignée, glissent le pied-de-biche, et tirent à deux en jurant. La porte cède dans un cri de métal.'); return; }
            api.say('Vous glissez le pied-de-biche dans la fente et pesez de tout votre poids.');
            api.time(10); api.check('for_porte', { diff: api.item(OUTILS) ? 'normal' : 'difficile' });
          } },
        { id: 'pj_descendre', label: 'Descendre dans les caves', idea: true, ideaCond: function (api) { return !!api.flag('porte') && !api.item(BRAS); }, verbs: ['ALLER', 'DESCENDRE', 'EXAMINER'], nouns: ['CAVE', 'SOUSSOL', 'PORTE', 'ESCALIER'], repeatable: true, cond: function (api) { return !!api.flag('porte'); },
          run: function (api) {
            if (!api.item(OUTILS)) { api.say('Dans ce noir, sans lanterne, vous ne feriez pas dix pas. Le docteur en a une, dans sa remise.'); return; }
            api.say('Vous allumez la lanterne et descendez les dix-huit marches, une main contre la paroi humide.');
            api.time(5); api.go('po_caves');
          } },
        { id: 'pj_maison', label: 'Rentrer dans la maison', verbs: ['ALLER'], nouns: ['SALLE', 'LORIEN'], repeatable: true,
          run: function (api) { api.time(2); api.go('po_lorien'); } },
        { id: 'pj_pruvost', label: 'Parler aux terrassiers', talkTo: 'pruvost', verbs: ['PARLER'], nouns: ['TERRASSIERS'], cond: function (api) { return !!api.flag('pruvostLa'); },
          run: function (api, p) { api.talk('pruvost', p); } }
      ] },
    po_caves: { name: 'Sous la maison', art: 'po_caves',
      enter: function (api, first) {
        if (!first) { api.say(api.fresh('pcR', ['Le couloir des cellules, ses racines, son silence.', 'Vous redescendez dans le couloir. La lanterne fait bouger les ombres derrière les judas.'])); return; }
        api.say('Le couloir file droit, sous la voûte, vers le mur d’enceinte. Les maçons du comte ont bien travaillé : rien ne s’est effondré, mais des racines ont crevé les joints et pendent de la voûte, grosses et pâles comme des serpents. Il faut baisser la tête.');
        api.say('De chaque côté, des portes basses, bardées de fer, percées d’un judas. Certaines sont fermées à clé. Vous levez la lanterne vers la première.');
        api.say('Derrière, un squelette, assis contre le mur, une chaîne à la cheville. Derrière la suivante, deux. Ce ne sont pas des caves. Ce sont des cellules. Plus loin, une salle plus grande : des cages, des instruments dont vous devinez l’usage et ne voulez pas le deviner.');
        api.clue('CELLULES');
        api.check('san_cellules');
      },
      things: [{ label: 'les cellules', ids: ['CELLULES', 'OS', 'DECES', 'PORTE'] }, { label: 'les racines', ids: ['RACINES'] }, { label: null, ids: ['CAVE', 'SOUSSOL', 'SALLE', 'LAMPE'] }],
      ambient: ['Une goutte tombe de la voûte, régulière comme une horloge.', 'Une racine frôle votre épaule.', 'Tout au fond, une lueur, très faible, qui n’est pas celle de votre lanterne.'],
      actions: [
        { id: 'pc_look', label: 'Regarder le couloir', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['CAVE', 'SOUSSOL', 'SALLE', 'CELLULES'], bare: true,
          run: function (api) { api.say('Onze portes. Des anneaux scellés dans les murs, des bancs de pierre, une rigole au milieu du sol. Tout au fond, là où le couloir passe sous l’ancienne entrée, une lueur pâle, verdâtre, qui ne vient pas de votre lanterne.'); } },
        { id: 'pc_racines', label: 'Examiner les racines', verbs: ['EXAMINER'], nouns: ['RACINES'], cond: function (api) { return !api.flag('racinesVues'); },
          run: function (api) { api.flag('racinesVues', true); api.check('toc_racines'); } },
        { id: 'pc_cellule', label: 'Ouvrir une cellule', verbs: ['OUVRIR'], nouns: ['CELLULES', 'PORTE'],
          run: function (api) { api.say('La serrure tombe en poussière rouge sous le pied-de-biche. Dans la cellule, le squelette n’a pas bougé depuis cent trente ans. À côté de lui, gravés dans la pierre avec un clou, des traits par groupes de cinq. Vous cessez de les compter à quatre cents.'); } },
        { id: 'pc_avancer', label: 'Avancer jusqu’à la lueur', idea: true, verbs: ['ALLER', 'SUIVRE'], nouns: ['LAMPE', 'SALLE', 'CAVE'], needVerb: true, repeatable: true,
          run: function (api) { api.say('Vous avancez vers la lueur. L’air devient plus doux, plus lourd, et ce parfum sucré que vous aviez senti en ouvrant la porte vous prend à la gorge. Des roses. Sous la terre, en janvier.'); api.time(5); api.go('po_salle'); } },
        { id: 'pc_remonter', label: 'Remonter au jardin', verbs: ['ALLER'], nouns: ['ESCALIER', 'JARDIN', 'PORTE'], repeatable: true,
          run: function (api) { api.time(5); api.go('po_jardin'); } }
      ] },
    po_salle: { name: 'La salle du bras', art: 'po_salle',
      enter: function (api, first) {
        if (!first) { api.say(api.item(BRAS) ? 'Les roses sont noires, maintenant, et tombent en poussière quand on les frôle.' : 'La salle des roses. Leur lumière fait des ombres qui ne bougent pas comme la vôtre.'); return; }
        api.say('La dernière salle est ronde, sous l’ancienne entrée. La lumière vient des roses.');
        api.say('Elles pendent de ronces épaisses comme des câbles, d’un noir huileux, qui couvrent les murs et la voûte : des roses de couleurs impossibles, aigue-marine, violettes, orange, vert d’herbe, qui brillent faiblement dans le noir. Une sève noire perle au bout des épines et tombe goutte à goutte.');
        api.say('Les ronces ont poussé à travers les squelettes de ceux qui sont morts ici. Elles les tiennent debout, tordus, comme pour qu’ils souffrent encore. Et à leurs pieds, au cœur du roncier, il y a un bras de statue. Un bras gauche, couché sur le côté. Il luit, lui aussi.');
        api.check('san_bras');
      },
      things: [{ label: 'le bras de statue', ids: ['BRAS', 'SIMULACRE'] }, { label: 'les roses', ids: ['ROSES'] }, { label: null, ids: ['OS', 'DECES', 'SALLE', 'CAVE', 'BRUME'] }],
      ambient: ['Une goutte de sève noire tombe sur la pierre avec un bruit mat.', 'Les roses frémissent, sans un souffle d’air.', 'Le parfum est si épais qu’il colle aux dents.'],
      actions: [
        { id: 'ps_look', label: 'Regarder la salle', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE', 'ROSES', 'OS'], bare: true,
          run: function (api) { api.say(api.item(BRAS) ? 'Les roses meurent sous vos yeux. Les pétales noircissent, se recroquevillent, tombent. Les ronces se ternissent. Les morts, eux, restent debout dans leur prison d’épines.' : 'Le bras est à deux mètres de vous, derrière un mur de ronces. Les épines sont longues comme des doigts. La sève qui en coule a laissé sur la pierre des flaques noires et brillantes.'); } },
        { id: 'ps_couper', label: 'Couper les ronces avec précaution', idea: true, ideaCond: function (api) { return !api.flag('ronces'); }, verbs: ['COUPER', 'CASSER', 'UTILISER'], nouns: ['ROSES', 'OUTILS', 'BRAS'], cond: function (api) { return !api.flag('ronces'); },
          run: function (api) {
            if (!api.item(OUTILS)) { api.say('À mains nues ? Ces épines vous ouvriraient jusqu’à l’os. Il vous faudrait un sécateur, une hachette, quelque chose.'); return; }
            api.say('Vous taillez au sécateur, branche après branche, en écartant chaque tige avec le manche de la pioche. Les ronces coupées saignent leur sève noire. Ça prend vingt minutes, et chacune vous semble durer une heure.');
            api.time(20);
            roncesDegagees(api, 'Le passage est ouvert. Le bras est là, à vos pieds, lisse, luisant, plus grand que nature.');
          } },
        { id: 'ps_arracher', label: 'Arracher le bras à travers les ronces', verbs: ['PRENDRE', 'OUVRIR'], nouns: ['BRAS', 'SIMULACRE'], needVerb: true, cond: function (api) { return !api.flag('ronces') && !api.item(BRAS); },
          run: function (api) { api.say('Pas le temps de tailler. Vous plongez le bras dans le roncier.'); api.check('dex_epines'); } },
        { id: 'ps_prendre', label: 'Prendre le bras', idea: true, ideaCond: function (api) { return !!api.flag('ronces') && !api.item(BRAS); }, verbs: ['PRENDRE'], nouns: ['BRAS', 'SIMULACRE'], cond: function (api) { return !api.item(BRAS); },
          run: function (api) {
            if (!api.flag('ronces')) { api.say('Le bras est au cœur du roncier. Il faut d’abord vous frayer un passage : couper les ronces, ou plonger la main au travers.'); return; }
            prendreBras(api);
          } },
        { id: 'ps_remonter', label: 'Remonter', idea: 'Remonter avec le bras', ideaCond: function (api) { return api.item(BRAS); }, verbs: ['ALLER'], nouns: ['ESCALIER', 'JARDIN', 'PORTE'], repeatable: true,
          run: function (api) { api.say('Vous remontez le couloir des cellules sans tourner la tête vers les judas, puis les dix-huit marches. Dehors, l’air froid vous paraît propre comme de l’eau.'); api.time(10); api.go('po_jardin'); } }
      ] },
    p_lyon: { name: 'La gare de Lyon', art: 'p_lyon',
      enter: function (api, first) {
        if (first) api.say('Sous la tour de l’horloge, un hall de fer et de verre où résonnent les annonces. Sur la voie du fond, le Simplon-Orient-Express attend : un fourgon, des voitures-lits aux armes de la Compagnie, un wagon-restaurant où l’on dresse déjà les tables. Des porteurs en blouse bleue, des messieurs en pelisse, des malles cerclées de cuivre.');
        else api.say(api.fresh('lyR', ['La gare de Lyon, son horloge, son vacarme.', 'Le hall de la gare de Lyon. L’Orient-Express attend sur la voie du fond.']));
        if (!api.flag('cercueilVu') && mn(api) >= 20 * 60) {
          api.flag('cercueilVu', true);
          api.say('Devant le fourgon, quatre hommes en noir chargent une longue caisse de chêne, cerclée de fer, avec des gestes de déménageurs prudents. Un cercueil. Le chef de quai coche une ligne sur sa liste. Personne ne l’accompagne.');
        }
      },
      things: [{ label: 'l’Orient-Express', ids: ['TRAIN', 'COMPARTIMENT', 'VOYAGE'] }, { label: 'le conducteur des Wagons-Lits', ids: ['CONDUCTEUR', 'QUELQUUN'] }, { label: null, ids: ['LYON', 'SALLE', 'CERCUEIL', 'BAGAGES', 'HEURE'] }],
      ambient: ['« Le Simplon-Orient-Express, voie L ! » crie un employé.', 'Un porteur passe avec une pyramide de cartons à chapeaux.', 'La grande horloge saute une minute, avec un bruit sec.'],
      actions: [
        { id: 'ly_look', label: 'Regarder la gare', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['LYON', 'SALLE', 'TRAIN'], bare: true,
          run: function (api) { api.say('Des affiches pour la Côte d’Azur, l’Italie, les Alpes. Des couples qui se quittent et d’autres qui partent ensemble. Un groupe bruyant entoure une femme en manteau de renard, qu’on accompagne au train avec des gerbes de fleurs : une célébrité, sans doute.'); } },
        { id: 'ly_buffet', label: 'Dîner au buffet de la gare', verbs: ['MANGER', 'COMMANDER', 'ATTENDRE'], nouns: ['TABLE', 'BOISSON'], bare: true,
          run: function (api) { api.pay(0.1); api.say('Le buffet de la gare : des lustres, des dorures, des fresques de paysages du Midi, et des maîtres d’hôtel qui vous servent un turbot comme on remet une décoration.'); var m = mn(api); if (m < 21 * 60 + 30 && m >= 12 * 60) { api.s.min += Math.min(120, 21 * 60 + 30 - m); api.s.tick = 0; } } },
        { id: 'ly_monter', label: 'Monter dans l’Orient-Express', idea: true, verbs: ['PRENDRE', 'ALLER'], nouns: ['TRAIN', 'COMPARTIMENT', 'VOYAGE'], repeatable: true,
          run: function (api) { monter(api); } },
        { id: 'ly_bertin', label: 'Parler au conducteur', talkTo: 'bertin', verbs: ['PARLER'], nouns: ['CONDUCTEUR', 'QUELQUUN'], extra: ['HEURE', 'CERCUEIL', 'TRAIN'],
          run: function (api, p) { api.talk('bertin', p); } }
      ] },
    oe_compartiment: { name: 'Votre compartiment', art: 'oe_compartiment',
      enter: function (api, first) {
        if (first) { api.say('Le conducteur, Joseph Bertin, vous précède dans le couloir et vous ouvre votre compartiment : marqueterie de bois blond, cuivres, une couchette déjà faite sous une couverture aux armes de la Compagnie, un lavabo qui se replie dans la cloison. Il vous souhaite le bonsoir en trois langues.'); return; }
        api.say(api.fresh('ocR', ['Votre compartiment, sa lampe voilée, le battement des rails.', 'Le compartiment. La couchette est faite, la lampe baissée.']));
      },
      things: [{ label: 'le conducteur', ids: ['CONDUCTEUR', 'QUELQUUN'] }, { label: null, ids: ['COMPARTIMENT', 'TRAIN', 'FENETRE', 'LAMPE', 'PORTE', 'CERCUEIL', 'HEURE'] }],
      ambient: ['Le train prend un aiguillage ; les verres tintent sur la tablette.', 'Une lumière de gare passe, s’étire, disparaît.', 'Des rires, au bout du couloir, du côté de la voiture-salon.'],
      actions: [
        { id: 'oc_look', label: 'Regarder le compartiment', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['COMPARTIMENT', 'FENETRE'], bare: true,
          run: function (api) { api.say('Dans la vitre noire, votre reflet, et derrière lui la nuit de Bourgogne qui défile. ' + (api.item(BRAS) ? 'Votre valise est dans le filet, juste au-dessus de votre tête. Vous la regardez plus souvent qu’il ne faudrait.' : 'Vos bagages sont dans le filet, et vous n’avez plus rien à garder.')); } },
        { id: 'oc_salon', label: 'Aller à la voiture-salon', idea: true, ideaCond: function (api) { return !api.flag('aria'); }, verbs: ['ALLER', 'VISITER'], nouns: ['SALLE', 'TRAIN', 'BOISSON'], repeatable: true,
          run: function (api) { api.say('Vous remontez le couloir, de rideau en rideau, jusqu’aux rires.'); api.time(3); api.go('oe_salon'); } },
        { id: 'oc_bertin', label: 'Parler au conducteur', talkTo: 'bertin', verbs: ['PARLER'], nouns: ['CONDUCTEUR', 'QUELQUUN'], extra: ['HEURE', 'CERCUEIL', 'TRAIN'],
          run: function (api, p) { api.talk('bertin', p); } },
        { id: 'oc_dormir', label: 'Dormir jusqu’à Lausanne', idea: true, ideaCond: function (api) { return !!api.flag('aria') || mn(api) >= 23 * 60 + 30 || mn(api) < 7 * 60; }, verbs: ['DORMIR', 'ATTENDRE'], nouns: ['COMPARTIMENT'], bare: true, repeatable: true,
          run: function (api) { arrivee(api); } }
      ] },
    oe_salon: { name: 'La voiture-salon', art: 'oe_salon',
      enter: function (api, first) {
        if (first) { api.say('Des fauteuils de cuir, des lampes à abat-jour de soie, un bar d’acajou, et un bruit de fête. Une dizaine de personnes en tenue de soirée entourent la femme au manteau de renard. Le champagne circule. Quelqu’un a ouvert un piano de voyage dans un coin.'); return; }
        api.say(api.flag('aria') ? 'La voiture-salon s’est vidée. Il ne reste qu’une partie de cartes, dans un coin, et des coupes vides.' : 'La voiture-salon, ses lampes de soie, ses rires.');
      },
      things: [{ label: 'la femme au manteau de renard', ids: ['CAVOLLARO', 'QUELQUUN'] }, { label: 'la partie de cartes', ids: ['TABLE'] }, { label: null, ids: ['SALLE', 'TRAIN', 'BOISSON', 'TABLE', 'MILAN', 'OPERA'] }],
      ambient: ['Un bouchon saute ; on applaudit.', 'Quelqu’un plaque trois accords au piano, puis renonce.', 'Le train se penche dans une courbe, et toutes les coupes avec lui.'],
      actions: [
        { id: 'os_look', label: 'Regarder la voiture-salon', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE'], bare: true,
          run: function (api) { api.say('Un banquier belge, deux actrices, un attaché d’ambassade, un vieux monsieur qui dort, et autour de la reine de la soirée, des admirateurs qui l’ont suivie de l’Opéra jusque dans le train. Tout le monde parle français, italien et anglais à la fois.'); } },
        { id: 'os_caterina', label: 'Parler à la cantatrice', ideaAnon: 'Parler à la femme au manteau de renard', idea: true, ideaCond: function (api) { return !api.flag('aria'); }, talkTo: 'caterina', verbs: ['PARLER', 'POLI', 'FLATTER', 'BOIRE'], nouns: ['CAVOLLARO', 'QUELQUUN'],
          extra: ['MILAN', 'OPERA', 'CHANTER', 'VOYAGE'], run: function (api, p) { if (api.flag('aria')) { api.say('Caterina est partie se coucher.'); return; } api.talk('caterina', p); } },
        { id: 'os_veiller', label: 'Rester jusqu’au bout de la nuit', idea: true, ideaCond: function (api) { return !api.flag('aria'); }, verbs: ['ATTENDRE', 'BOIRE', 'ASSEOIR'], nouns: ['SALLE', 'BOISSON'], needVerb: true, cond: function (api) { return !api.flag('aria'); },
          run: function (api) { aria(api); } },
        { id: 'os_cartes', label: 'Se joindre à la partie de cartes', verbs: ['JOUER'], nouns: ['JOUER', 'TABLE'], cond: function (api) { return !!api.flag('aria'); }, repeatable: true,
          run: function (api) {
            if (api.flag('cartesFait')) { api.say('Vous avez assez joué pour cette nuit.'); return; }
            api.flag('cartesFait', true); api.time(60);
            if (api.rand() < 0.5) { api.s.money += 0.3; api.say('Un poker à quatre, à des enjeux de grande remise. Vous gagnez sur un carré de dames, de quoi payer quelques nuits d’hôtel, et vous vous retirez avant que la chance tourne.'); }
            else { api.pay(Math.min(0.3, api.s.money)); api.say('Un poker à quatre, des enjeux de grande remise, et un banquier belge qui ne bluffe jamais quand on croit qu’il bluffe. Vous perdez de quoi payer quelques nuits d’hôtel.'); }
          } },
        { id: 'os_retour', label: 'Regagner votre compartiment', idea: 'Aller dormir', ideaCond: function (api) { return !!api.flag('aria'); }, verbs: ['ALLER', 'DORMIR'], nouns: ['COMPARTIMENT'], repeatable: true,
          run: function (api) { api.time(3); api.go('oe_compartiment'); } }
      ] }
  });

  // ================================================================ la fouille, le bras
  function creuser(api) {
    if (!api.item(OUTILS) && !api.flag('pruvostLa')) { api.say('Avec quoi ? Il vous faut des pelles et une pioche. Le docteur en a dans sa remise ; à l’auberge, on vous trouverait des bras.'); return; }
    if (!jourLevant(api)) { api.say('Il fait nuit. Creuser à la lanterne, sous la fenêtre de la petite ? Le docteur ne le voudrait pas, et vous non plus. Demain, au jour.'); return; }
    var aide = !!api.flag('pruvostLa'), besoin = aide ? 3 : 6, fait = api.flag('fouilleH') || 0;
    var reste = besoin - fait, finJour = day(api.s.min) * D + 17 * 60, dispo = Math.floor((finJour - api.s.min) / 60);
    var session = Math.max(1, Math.min(reste, 2, dispo));
    fait += session; api.flag('fouilleH', fait); api.time(session * 60);
    if (fait < besoin) {
      var nm = Math.max(1, Math.round(18 * fait / besoin));
      api.say((aide ? 'Les Pruvost creusent comme on boit : sans s’arrêter, sans parler. Vous évacuez la terre à la brouette. ' : 'Vous creusez. La terre est lourde, pleine de briques noircies, de clous, d’éclats de verre fondu. ') +
        (nm < 7 ? nm + ' marches dégagées. Vos mains se couvrent d’ampoules.' : nm < 13 ? nm + ' marches, et l’escalier descend toujours. Le soleil d’hiver tourne autour du chêne.' : nm + ' marches. Le trou est plus profond que vous n’êtes grand{e}, et l’air qui en monte est plus doux que celui du jardin.'));
      return;
    }
    api.flag('escalier', true);
    api.say('Le soleil est bas et un vent froid se lève quand la dernière pelletée découvre la dix-huitième marche. En bas, une porte d’acier, rouillée dans son cadre, coincée sous un éboulis de briques.');
  }
  function prendreBras(api) {
    api.say('Vous soulevez le bras. Il est lisse et presque sans détail, comme de la porcelaine, plus grand que nature, et il pèse moins lourd qu’il ne devrait. Il est froid. À peine l’avez-vous écarté des roses qu’il cesse de luire.');
    api.say('Autour de vous, les roses se fanent. Pas en une saison : en une minute. Les pétales noircissent, se recroquevillent, tombent en pluie sur les os.');
    api.piece('bras_gauche', BRAS); api.clue('BRAS'); api.flag('brasPris', true); api.flag('connu:lyon', true);
    api.sys('Le Simulacre pèse sur votre esprit : tant que vous en possédez une pièce, vos jets d’Idée, de Connaissance et de Chance perdent 5 %.');
    if (crepuscule(api)) {
      api.flag('brume', true);
      api.say('Vous ne l’aviez pas remarquée : une brume fine s’est amassée dans la salle, à hauteur de genou, plus froide que la cave. Quand vous relevez le bras, elle tourbillonne, vous enveloppe une seconde, vous aveugle. Puis elle s’écoule par le couloir, très vite, comme une eau qui remonterait une pente, et sort à l’air libre.');
      api.clue('BRUME'); api.check('san_brume');
    }
  }
  // ================================================================ le train de nuit
  function monter(api) {
    var m = mn(api);
    if (m >= 22 * 60 + 50 || m < 6 * 60) { api.say('Le Simplon-Orient est parti à 22 h 50. Le prochain, demain soir, à la même heure.'); api.chips([{ label: 'Rentrer à l’hôtel', action: 'go_hotel' }]); return; }
    if (m < 21 * 60) { api.say('Le Simplon-Orient part à 22 h 50, et l’on ne monte qu’une heure avant. Vous avez le temps de dîner, ou de rentrer.'); api.chips([{ label: 'Dîner au buffet de la gare', action: 'ly_buffet' }]); return; }
    api.say('Le conducteur vérifie votre billet, vos noms, et vous souhaite la bienvenue à bord. À 22 h 50, un coup de sifflet, une secousse : la gare de Lyon glisse en arrière.');
    if (api.item(BRAS)) api.say('Vous avez gardé la valise avec vous. Le porteur l’a trouvée bien légère pour une valise qu’on ne lâche pas.');
    api.flag('oeDepart', day(api.s.min) * D + 22 * 60 + 50);
    api.s.min += Math.max(0, 22 * 60 + 50 - m) + 10; api.s.tick = 0;
    api.flag('oe', true); api.flag('sanTrain', api.pc.san);
    api.go('oe_compartiment');
  }
  function aria(api) {
    if (api.flag('aria')) return;
    api.flag('aria', true); api.flag('ariaEntendue', true);
    var m = mn(api); if (m >= 6 * 60 || m < 2 * 60) { api.s.min = (day(api.s.min) + (m >= 6 * 60 ? 1 : 0)) * D + 2 * 60; api.s.tick = 0; }
    api.endTalk(false);
    api.say('Vers deux heures, Caterina se lève en vacillant un peu. « Je reviens. » Un quart d’heure plus tard, elle reparaît dans une robe d’argent, les yeux charbonnés, une croix ansée égyptienne au bout d’une chaîne. Les conversations s’éteignent d’elles-mêmes.');
    api.npc('caterina', '« Je vais vous chanter l’air que je créerai dans trois jours. C’est celui que j’ai entendu à cinq ans, à la Scala, le soir où j’ai su. Aïda aime un homme, et c’est l’ennemi de son père. Elle doit choisir, et elle ne peut pas. »');
    api.say('Elle chante. Le train, les rails, la nuit, tout recule. La voix monte, se brise volontairement, remonte plus haut encore ; elle va jusqu’au bord de ce qu’une voix humaine peut faire, et un peu au-delà. Des années plus tard, il vous arrivera de fredonner cette mélodie sans savoir d’où elle vous vient.');
    api.npc('caterina', 'Dans les applaudissements, elle vient à vous et vous glisse deux cartons dans la main. « Le premier rang, pour la première. Et je vous retiens des chambres dans la Galleria. Vous serez mes invités à Milan. Promettez-le. A domani ! »');
    api.take(BILLETS); api.flag('billetsScala', true); api.clue('CATERINA');
    api.say('Elle s’en va dormir. La fête continue sans elle, plus bas ; dans un coin, une partie de cartes s’organise, à des enjeux qui feraient pâlir un notaire.');
  }
  function arrivee(api) {
    if (!api.flag('billetsScala') && api.flag('caterinaVue')) {
      api.take(BILLETS); api.flag('billetsScala', true);
      api.say('Au réveil, le conducteur vous tend une enveloppe parfumée : « De la part de la signora Cavollaro. » Deux places au premier rang pour la première d’Aïda, à la Scala, et un mot : « Pour mes amis du salon. Je vous attends à Milan. C. »');
      if (!api.has('CATERINA')) api.clue('CATERINA');
    }
    api.say('Vers six heures, le conducteur frappe à votre porte : « Lausanne dans quarante minutes. » Derrière la vitre, un jour gris se lève sur des vignes en terrasses, et en bas, un lac couleur de plomb, si grand qu’on n’en voit pas l’autre rive.');
    if ((api.flag('sanTrain') || 0) <= api.pc.san) { api.gain(1); api.say('Une nuit de luxe et de musique. Pour quelques heures, vous avez oublié pourquoi vous voyagez.'); }
    var d = day(api.s.min) + (mn(api) >= 7 * 60 ? 1 : 0);
    api.s.min = d * D + 6 * 60 + 45; api.s.tick = 0;
    api.flag('arriveeLausanne', true);
    api.end();
  }

  // le train arrive à Lausanne à 6 h 45, qu'on dorme ou non ; la mairie ferme ses portes à l'heure
  var tourAvant = P.everyTurn;
  P.everyTurn = function (api) {
    if (api.s.ended || api.s.pending) return false;
    if (/^oe_/.test(api.s.loc)) {
      var dep = api.flag('oeDepart');
      if (typeof dep === 'number' && api.s.min >= dep + 7 * 60 + 40) { if (api.s.talk) api.endTalk(false); api.say('Le jour se lève derrière les vitres. Vous n’avez pas vu passer la nuit.'); arrivee(api); return true; }
      return false;
    }
    if (api.s.loc === 'po_mairie' && P.disponible(api, 'fauvel')) {
      if (api.s.talk) api.endTalk(false);
      api.say('M. Fauvel enfile son pardessus et décroche un trousseau. « On ferme. » La porte de la mairie se referme derrière vous.');
      api.time(2); api.go('po_ville'); return true;
    }
    return tourAvant ? tourAvant(api) : false;
  };

  // ================================================================ la fin du chapitre 2
  P.ending = { title: 'Fin du chapitre 2 : Paris et Poissy', text: 'Lausanne, 6 h 45. Le chapitre 3 arrive bientôt.' };
  var finAvant = P.endingFor;
  P.endingFor = function (s) {
    var r = finAvant && finAvant(s); if (r) return r;
    var f = s.flags || {};
    if (f.fin === 'debarque') return { title: 'Fin : débarqué à Dijon', text: 'Le chef de brigade a fait arrêter le train à Dijon. Deux gendarmes vous attendaient sur le quai. L’Orient-Express repart sans vous, et l’Europe se referme comme une porte.' };
    if (!f.arriveeLausanne) return null;
    var bras = (s.inv || []).indexOf(BRAS) >= 0;
    return { title: 'Fin du chapitre 2 : Paris et Poissy', text: 'Lausanne, 6 h 45. Le train s’arrête dans un brouillard de lait, au bord d’un lac qu’on devine sans le voir. ' +
      (bras ? 'Dans votre valise, entre deux chemises, un bras de statue qui ne pèse pas ce qu’il devrait. Il vous reste cinq pièces à trouver, et quelqu’un, quelque part derrière vous, qui attend que vous les trouviez. ' : 'Vous avez laissé à Poissy ce qui dormait sous les roses. Le comte, lui, ne l’oubliera pas. ') +
      (f.lettre ? 'Rue Saint-Étienne, un certain Edgar Wellington possède un rouleau. ' : '') + 'Le chapitre 3, Lausanne, arrive bientôt.' };
  };
  // ce que le chapitre laisse au suivant
  P.memoire = ['fin', 'fugitif', 'arrestations', 'brasPris', 'corpsDeclares', 'lorienAmis', 'gueris', 'lettre', 'ariaEntendue', 'billetsScala', 'brume', 'fievre', 'cri'];

  // ================================================================ les notes, les rumeurs, l'humeur
  P.notesPoissy = function (api) {
    var s = [];
    if (!api.flag('connu:poissy')) { if (api.has('MALON')) s.push('Poissy : la maison du comte, et ce qu’il y a dessous.'); return s; }
    if (!api.flag('connu:lorien')) s.push('À Poissy, retrouver où se tenait la maison du comte : la mairie a les actes, le curé a la mémoire.');
    else if (!api.flag('lorienVu')) s.push('Aller voir le docteur Lorien, qui habite sur les ruines de la maison du comte.');
    else if (!api.flag('fouilleOK')) s.push('Convaincre les Lorien de vous laisser chercher les caves. Des plans aideraient.');
    else if (!api.item(BRAS)) s.push(api.flag('porte') ? 'Descendre au fond des caves.' : api.flag('marches') ? 'Dégager l’escalier, puis ouvrir la porte du bas.' : 'Trouver l’escalier des caves, dans le jardin des Lorien.');
    if (api.has('CELLULES') && !api.flag('corpsDeclares')) s.push('Les morts des caves : le curé de Poissy saurait quoi faire.');
    if (api.item(BRAS)) s.push('Le Simplon-Orient-Express part chaque soir de la gare de Lyon, à 22 h 50.');
    if (api.flag('lettre')) s.push('Lausanne : Edgar Wellington, 50 rue Saint-Étienne, a un rouleau sur le Simulacre.');
    return s;
  };
  var HT = G.RPG.Humeur && G.RPG.Humeur.T;
  if (HT) {
    HT.fauvel = { kind: 'appel', vite: 'vif', sup: 'le garde champêtre', police: true };
    HT.thibierge = { kind: 'froid', vite: 'calme' };
    HT.arnoult = { kind: 'appel', vite: 'normal', sup: 'son mari', police: true, f: true };
    HT.lorien = { kind: 'appel', vite: 'normal', sup: 'les voisins', police: true };
    HT.veronique = { kind: 'appel', vite: 'vif', sup: 'son mari', police: true, f: true };
    HT.quitterie = { kind: 'faible', vite: 'vif', sup: 'son père', police: true, f: true };
    HT.pruvost = { kind: 'fort', vite: 'vif', sup: 'le cafetier' };
    HT.caterina = { kind: 'appel', vite: 'vif', sup: 'le chef de brigade', police: true, f: true };
    HT.bertin = { kind: 'appel', vite: 'calme', sup: 'le chef de brigade', police: true };
  }
  // la police hors de Paris : les gendarmes de Poissy, ou le chef de brigade du train
  var arreterParis = P.humeur.arreter;
  P.humeur.arreter = function (api, id) {
    if (/^oe_/.test(api.s.loc)) {
      api.endTalk(false);
      api.say('Le chef de brigade des Wagons-Lits ne discute pas. Le train s’arrête en pleine nuit à Dijon, et deux gendarmes montent vous chercher dans votre compartiment.');
      api.flag('fin', 'debarque'); api.end(); return;
    }
    if (/^po_/.test(api.s.loc)) {
      var n = (api.flag('arrestations') || 0) + 1; api.flag('arrestations', n);
      api.endTalk(false);
      if (api.flag('fugitif') || n >= 3) { arreterParis(api, id); return; }
      api.say('Les gendarmes de Poissy arrivent à bicyclette, sans se presser, et vous emmènent à la brigade. Une nuit sur un bat-flanc, un procès-verbal tapé à deux doigts, et au matin un brigadier qui vous rend vos papiers en vous conseillant de reprendre le premier train.');
      api.s.min = (day(api.s.min) + 1) * D + 8 * 60; api.s.tick = 0;
      if (id && P.npcs[id]) api.npcs(id).closedUntil = api.s.min + 100000;
      if (id === 'quitterie' || id === 'veronique' || id === 'lorien') { ['lorien', 'veronique', 'quitterie'].forEach(function (k) { api.npcs(k).closedUntil = api.s.min + 100000; }); api.flag('lorienFerme', true); }
      api.go('po_ville'); return;
    }
    arreterParis(api, id);
  };
  // le portrait de ceux qu'on rencontre ici, pour les conversations libres
  Object.assign(P.fiches, {
    fauvel: { groupe: 'hotel', reg: 'sec', pa: true, mefiant: 0.8, tics: ['Voyons.', 'Bon.'],
      dada: ['Le maire veut l’électricité dans toutes les rues avant les élections. Avec quel argent ?', 'La Seine monte. Elle monte tous les hivers, et chaque hiver on fait semblant d’être surpris.'],
      moi: { nom: '« Fauvel, Anatole. Secrétaire de mairie. »', age: '« Cinquante-quatre ans. »', origine: '« De Poissy. Mon père était déjà secrétaire de mairie. »', famille: '« Une femme, une fille mariée à Versailles. »', metier: '« Je tiens l’état civil, le cadastre et le maire. »', loisirs: '« La pêche à la ligne, en Seine, le dimanche. »' },
      sait: { POISSY: '« Saint Louis est né ici. On ne vous le dira jamais assez, ici. »', LORIEN: '« Un médecin qui ne fait pas payer les pauvres. Il ne fera pas fortune. »', EGLISE: '« Le curé vous racontera Saint Louis jusqu’à la nuit. »' } },
    thibierge: { groupe: 'clerge', reg: 'soutenu', mefiant: 0.1, tics: ['Mon enfant,', 'Voyez-vous,'],
      dada: ['Le toit du bas-côté prend l’eau, et l’évêché m’envoie des prières en guise de tuiles.', 'Les gens viennent gratter les fonts plus souvent que se confesser.'],
      moi: { nom: '« L’abbé Thibierge. Prosper, au baptême. »', age: '« Soixante-sept ans, dont quarante de sacerdoce. »', origine: '« Du Vexin. Un pays de pierres et de vent. »', famille: '« Une sœur, religieuse à Rouen. Et deux mille paroissiens. »', metier: '« Je baptise, je marie, j’enterre. Entre les trois, j’écoute. »', loisirs: '« Je lis Pascal, et je joue aux échecs contre le pharmacien, qui triche. »' },
      sait: { FENALIK: '« Le clos du Diable. On ne disait pas son nom, au pays. »', LORIEN: '« Une famille courageuse. Ils auraient besoin qu’on prie pour eux. »', POISSY: '« Saint Louis a été baptisé ici, et il signait “Louis de Poissy”. Cela nous suffit pour l’éternité. »' } },
    arnoult: { groupe: 'peuple', reg: 'populaire', pa: true, tics: ['Remarquez,', 'Allez,'],
      dada: ['Les rouliers me doivent trois semaines de soupe.', 'Mon mari dit que la cave est humide. C’est surtout lui qui est humide.'],
      moi: { nom: '« Arnoult. Germaine Arnoult. »', age: '« Assez pour savoir ce que vaut un homme à sa façon de commander. »', origine: '« De Poissy, et mes grands-parents avant moi. »', famille: '« Un mari, deux garçons, un chien qui vaut mieux que les trois. »', metier: '« Je tiens le Lion d’or. »', loisirs: '« Des loisirs ? Le dimanche, je compte la caisse. »' },
      sait: { LORIEN: '« Un saint, ce docteur. Avec une maison maudite. »', FENALIK: '« Le comte ? Ça faisait peur aux enfants, de mon temps. »', AUBERGE: '« Dix francs la chambre, avec la soupe. »' } },
    lorien: { groupe: 'savant', reg: 'formel', pa: true, tics: ['Voyez-vous,', 'Franchement,'],
      dada: ['La moitié de mes malades me paient en œufs. L’autre moitié ne me paie pas.', 'Il faudrait un dispensaire, ici. Je l’écris tous les ans au préfet.'],
      moi: { nom: '« Christian Lorien. »', age: '« Trente-trois ans. »', origine: '« D’Orléans. Interne à Paris, puis Poissy. »', famille: '« Véronique, ma femme, et Quitterie. »', metier: '« Médecin de campagne. Le plus beau métier du monde, à condition de ne pas dormir. »', loisirs: '« Les rosiers. Ce n’est pas un loisir, c’est une guerre. »' },
      sait: { ROSES: '« Ils étaient là avant la maison. On dit qu’ils ne gèlent jamais. »', POISSY: '« Une petite ville qui se souvient trop de son passé, et pas assez de ses égouts. »', VERONIQUE: '« Elle était la plus brillante de sa promotion. Elle l’est toujours. »' } },
    veronique: { groupe: 'savant', reg: 'formel', pa: true, tics: ['Voyez-vous,', 'Oh,'],
      dada: ['J’aimerais tant lire autre chose que des almanachs de jardinage.', 'Quitterie apprend ses lettres dans le catalogue de la Manufacture d’armes.'],
      moi: { nom: '« Véronique Lorien. Véronique Dumesnil, avant. »', age: '« Trente ans. Et un bras de quatre-vingts. »', origine: '« De Paris, du quartier latin. »', famille: '« Christian, Quitterie, et une mère qui trouve que j’ai épousé un médecin de campagne. »', metier: '« Licenciée d’histoire. Mère. Les deux à plein temps. »', loisirs: '« L’opéra, quand je peux. Je ne peux plus beaucoup. »' },
      sait: { OPERA: '« La Cavollaro, hier soir. Je n’ai jamais rien entendu de pareil. »', HISTOIRE: '« 1789, c’était ma spécialité. La cour, les scandales, les lettres de cachet. »' } },
    bertin: { groupe: 'domestique', reg: 'formel', pa: true, tics: ['Si {M} permet,', 'Naturellement,'],
      dada: ['Dix-neuf ans de Compagnie, et pas une plainte dans mon dossier.', 'La neige, à Vallorbe, elle n’attend jamais d’être annoncée.'],
      moi: { nom: '« Bertin, Joseph, conducteur de la voiture 4. »', age: '« Quarante-deux ans, {m}. »', origine: '« De Dijon. Je passe devant chez moi deux fois par semaine, sans m’arrêter. »', famille: '« Une épouse, qui me voit le dimanche, quand le service le permet. »', metier: '« Je fais les lits, je garde les passeports, je réveille les gens à l’heure. Et je ne vois rien de ce qu’il ne faut pas voir. »', loisirs: '« Le service ne laisse guère de loisirs, {m}. Les mots croisés. »' },
      sait: { TRAIN: '« Le Simplon-Orient va jusqu’à Constantinople, {m}. Trois jours et trois nuits, si les douaniers sont de bonne humeur. »', CERCUEIL: '« Nous en transportons souvent, l’hiver. On les met en fourgon, avec leurs papiers. »' } },
    pruvost: { groupe: 'peuple', reg: 'populaire', pa: true, tics: ['Ben,', 'Patron,'],
      dada: ['La commune nous paie les tranchées au mètre. Le docteur, lui, il paie à la journée. C’est mieux.', 'Le litre de midi, c’est sacré.'],
      moi: { nom: '« Pruvost, Émile, et lui c’est Gustave. »', age: '« On a trois ans d’écart, et on se ressemble pas. »', origine: '« De Poissy, et de nulle part ailleurs. »', famille: '« Nous deux, et la mère. »', metier: '« Terrassiers. On creuse, quoi. »', loisirs: '« Le Lion d’or. »' },
      sait: { POISSY: '« La terre d’ici, c’est du sable et de la brique. Du temps des rois, ça construisait partout. »' } },
    caterina: { groupe: 'mondain', reg: 'soutenu', tics: ['Caro,', 'Allora,'],
      dada: ['Les critiques de Paris m’adorent. Ceux de Milan m’attendent au tournant.', 'Je ne chante jamais avant midi. La voix dort, et il ne faut pas la réveiller.'],
      moi: { nom: '« Caterina Cavollaro. Les journaux disent la Cavollaro. Vous pouvez dire Caterina. »', age: '« On ne demande pas cela à une soprano, caro. »', origine: '« De Lombardie, d’un village au bord du lac de Côme. »', famille: '« Une grand-mère qui m’a appris à chanter, et une foule de cousins qui m’ont appris à payer. »', metier: '« Je chante. Le reste est de la poésie. »', loisirs: '« Les chevaux. Je n’en ai jamais eu. »' },
      sait: { MILAN: '« La Galleria, le Duomo, la Scala. Le reste de Milan est une usine, mais ces trois-là valent le voyage. »', OPERA: '« Aïda, dans trois jours. Vous viendrez. »' } }
  });
  P.fils = Object.assign(P.fils || {}, {
    fauvel: [{ t: 'actes', cond: function (api) { return !api.flag('actesOK'); }, x: '« Si c’est pour les archives, dites-le tout de suite. Je n’ai pas que ça à faire. »' }],
    thibierge: [{ t: 'comte', cond: function (api) { return !api.has('LEGENDE'); }, x: '« Vous n’êtes pas venus pour Saint Louis, n’est-ce pas ? Vous avez l’air de gens qui cherchent une maison qui n’existe plus. »' }],
    arnoult: [{ t: 'chambre', cond: function (api) { return !api.flag('chambrePo') && hour(api.s.min) >= 16; }, x: '« Vous rentrez à Paris ce soir, ou vous prenez une chambre ? Le dernier train est à neuf heures quarante. »' }],
    lorien: [
      { t: 'histoire', cond: function (api) { return !api.flag('lettre'); }, x: '« Mais je ne vous ai même pas demandé ce qui vous amène. Racontez-moi. »' },
      { t: 'fouille', cond: function (api) { return !!api.flag('lettre') && !api.flag('fouilleOK'); }, x: 'Il regarde par la fenêtre, vers l’ancienne entrée. « Vous pensez qu’il reste quelque chose, là-dessous ? »' }
    ],
    quitterie: [{ t: 'monsieur', cond: function (api) { return !!api.flag('cri'); }, x: 'Elle tire sur votre manche et chuchote : « Le monsieur, il revient ce soir ? »' }],
    caterina: [{ t: 'aida', x: '« Vous savez ce que je vais chanter, à Milan ? Demandez-le-moi. »' }]
  });
  // l'image d'un lieu suit ce qu'on y fait ; tant que l'illustration de Poissy n'est pas livrée
  // (absente de la liste des photos), le décor emprunte une image voisine des chapitres précédents
  var REPLI = {
    'poissy/01_gare-de-poissy': 'londres/24_campagne_au-petit-matin', 'poissy/02_grand-rue_eglise': 'londres/15_stoke-newington_jour',
    'poissy/03_mairie_archives': 'paris/09_charenton_registres', 'poissy/04_eglise_fonts': 'londres/29_eglise-st-george',
    'poissy/05_auberge-du-lion-d-or': 'londres/28_museum-tavern', 'poissy/06_maison-lorien_rosiers': 'londres/10_st-johns-wood_villa_jour',
    'poissy/07_cuisine-des-lorien': 'londres/08_camberwell_salon-butter', 'poissy/08_chambre-d-enfant_nuit': 'londres/02_hotel-chambre_nuit',
    'poissy/09_fouille_porte-d-acier': 'londres/12_st-johns-wood_ruines', 'poissy/10_caves_cellules': 'londres/20_cave-butter_maquette',
    'poissy/11_salle-du-bras': 'londres/20_cave-butter_maquette', 'poissy/12_gare-de-lyon_nuit': 'londres/25_gare-victoria',
    'poissy/13_compartiment': 'prologue/04_compartiment-7', 'poissy/14_voiture-salon': 'prologue/01_wagon-restaurant'
  };
  function ou(k) {
    return function (st) {
      var key = typeof k === 'function' ? k(st) : k, L = G.PixelArt && G.PixelArt.PHOTO_LIST;
      return (!L || L.indexOf(key) >= 0 || !REPLI[key]) ? key : REPLI[key];
    };
  }
  P._repliPhotos = REPLI;
  G.PHOTO_SCENES = Object.assign(G.PHOTO_SCENES || {}, {
    po_gare: ou('poissy/01_gare-de-poissy'),
    po_ville: ou('poissy/02_grand-rue_eglise'),
    po_mairie: ou('poissy/03_mairie_archives'),
    po_eglise: ou('poissy/04_eglise_fonts'),
    po_auberge: ou('poissy/05_auberge-du-lion-d-or'),
    po_lorien: ou(function (st) {
      var f = st.flags || {}, v = f.vueLorien;
      if (v === 'chambre') return 'poissy/08_chambre-d-enfant_nuit';
      if (v === 'cuisine' || v === 'diner') return 'poissy/07_cuisine-des-lorien';
      return 'poissy/06_maison-lorien_rosiers';
    }),
    po_jardin: ou(function (st) { var f = st.flags || {}; return f.escalier || f.porte ? 'poissy/09_fouille_porte-d-acier' : 'poissy/06_maison-lorien_rosiers'; }),
    po_caves: ou('poissy/10_caves_cellules'),
    po_salle: ou('poissy/11_salle-du-bras'),
    p_lyon: ou('poissy/12_gare-de-lyon_nuit'),
    oe_compartiment: ou('poissy/13_compartiment'),
    oe_salon: ou('poissy/14_voiture-salon')
  });
  // en entrant dans la maison, on retrouve la cuisine (ou la façade, la première fois)
  var entreeLorien = P.locations.po_lorien.enter;
  P.locations.po_lorien.enter = function (api, first) { if (!first && api.flag('vueLorien') === 'chambre') api.flag('vueLorien', 'cuisine'); return entreeLorien.apply(this, arguments); };

  // ================================================================ les actions communes à Poissy
  P.globalActions.push(goPo('po_ville'), goPo('po_mairie'), goPo('po_eglise'), goPo('po_auberge'), goPo('po_lorien'), goPo('po_gare'));
  // le bras dans la valise : le carnet rappelle le train du soir
  P.globalActions.push({ id: 'p_versLyon', label: 'Prendre l’Orient-Express, gare de Lyon', idea: true, verbs: ['PRENDRE'], nouns: ['LYON'], needVerb: true, repeatable: true,
    ideaCond: function (api) { return api.item(BRAS) && mn(api) >= 12 * 60 && mn(api) < 22 * 60 + 20; },
    cond: function (api) { return !X.ailleurs(api) && api.s.loc !== 'p_lyon' && api.s.loc !== 'gare'; },
    run: function (api) { P.versLyon(api); } });
  P.globalActions.push({ id: 'po_lieux', label: 'Où aller ?', verbs: ['ALLER', 'EXAMINER', 'PRENDRE'], nouns: ['DESTINATIONS'], repeatable: true,
    cond: function (api) { return aPoissy(api) && !/^po_(caves|salle)$/.test(api.s.loc); },
    run: function (api) { var c = destPo(api); api.say('Vous pouvez vous rendre à : ' + c.map(function (x) { return x.label.replace('Aller : ', ''); }).join(', ') + '.'); api.chips(c); } });

  // ================================================================ les mots de Poissy et du train
  var lexAvant = P.lexicon;
  P.lexicon = function (Lx) {
    Lx.add('MAIRIE', 'n', 'mairie, hotel de ville', { label: 'la mairie' });
    Lx.add('ACTES', 'n', 'actes, terrier, cadastre, titres de propriete, bornage, ventes, bien national, biens nationaux', { label: 'les actes de 1789' });
    Lx.add('FAUVEL', 'n', 'fauvel', { label: 'M. Fauvel', npc: true });
    Lx.add('CURE', 'n', 'cure, abbe, pretre, presbytere, thibierge, soutane', { label: 'le curé', npc: true });
    Lx.add('FONTS', 'n', 'fonts, baptismaux, cuve, saint louis', { label: 'les fonts baptismaux' });
    Lx.add('AUBERGE', 'n', 'auberge, lion d or, aubergiste, cabaret', { label: 'l’auberge du Lion d’or' });
    Lx.add('ARNOULT', 'n', 'arnoult, patronne, tenanciere', { label: 'Mme Arnoult', npc: true });
    Lx.add('VILLEPO', 'n', 'grand rue, place de l eglise, centre ville, le bourg', { label: 'la Grand-Rue' });
    Lx.add('LORIEN', 'n', 'lorien, christian, docteur lorien', { label: 'le docteur Lorien', npc: true });
    Lx.add('VERONIQUE', 'n', 'veronique, madame lorien, mme lorien, sa femme, son epouse', { label: 'Véronique Lorien', npc: true });
    Lx.add('QUITTERIE', 'n', 'quitterie, petite, fillette, enfant, gamine, la petite fille', { label: 'Quitterie', npc: true });
    Lx.add('ROSES', 'n', 'roses, rose, rosiers, rosier, epines, epine, ronces, ronce, roseraie, roncier, fleurs, sarments, tiges', { label: 'les rosiers' });
    Lx.add('JARDIN', 'n', 'jardin, potager, clos, terrain, pelouse, chene, serre', { label: 'le jardin' });
    Lx.add('ESCALIER', 'n', 'escalier, escaliers, marches, marche, degres, entree des caves', { label: 'l’escalier' });
    Lx.add('OUTILS', 'n', 'outils, outil, pelle, pelles, pioche, pioches, pied de biche, lanterne, secateur, hachette, chaine, brouette', { label: 'les outils' });
    Lx.add('TERRASSIERS', 'n', 'terrassiers, terrassier, ouvriers, pruvost, des bras', { label: 'les terrassiers' });
    Lx.add('CELLULES', 'n', 'cellules, cellule, cachots, cachot, judas, prisonniers', { label: 'les cellules' }); // les squelettes et les ossements restent à OS
    Lx.add('RACINES', 'n', 'racines, racine, radicelles', { label: 'les racines' });
    Lx.add('BRAS', 'n', 'bras, membre, bras de statue, bras gauche', { label: 'le bras de statue' });
    Lx.add('LETTRE', 'n', 'lettre, enveloppe, courrier, wellington, edgar, lausanne', { label: 'la lettre de Lausanne' });
    Lx.add('CAVOLLARO', 'n', 'cavollaro, caterina, cantatrice, soprano, diva, chanteuse', { label: 'Caterina Cavollaro', npc: true });
    Lx.add('OPERA', 'n', 'opera, aida, scala, opera garnier, air, aria, representation, premiere', { label: 'l’opéra' });
    Lx.add('MILAN', 'n', 'milan, milano, galleria, lombardie', { label: 'Milan' });
    Lx.add('BRUME', 'n', 'brume, vapeur froide, brouillard froid', { label: 'la brume' });
    Lx.add('DINER', 'n', 'diner, souper, repas, invitation', { label: 'le dîner' });
    Lx.add('CICATRICE', 'n', 'cicatrice, plaie, blessure, arthrite, brulure, sa main, son bras, main gauche', { label: 'la cicatrice' });
    Lx.add('LYON', 'n', 'gare de lyon', { label: 'la gare de Lyon' });
    Lx.add('CONDUCTEUR', 'n', 'conducteur, controleur, steward, bertin, wagons lits', { label: 'le conducteur', npc: true });
    Lx.add('CERCUEIL', 'n', 'cercueil, biere, caisse de chene, mort du fourgon, fourgon', { label: 'le cercueil' });
    Lx.add('BAGAGES', 'n', 'bagages, malles, malle, valise, valises', { label: 'les bagages' });
    Lx.add('CREUSER', 'v', 'creuser, creuse, creusez, creusons, deterrer, deblayer, pelleter, becher, degager', { label: 'creuser' });
    Lx.add('COUPER', 'v', 'couper, coupe, coupez, tailler, taille, trancher, cisailler, elaguer', { label: 'couper' });
    Lx.add('DESCENDRE', 'v', 'descendre, descends, descendez, descendons', { label: 'descendre' });
    lexAvant(Lx);
  };
  P.phrases.unshift(
    [/\b(le |la )?(secretaire|secretariat) de (la )?mairie\b/g, ' fauvel '],
    [/\b(monsieur le |m le )?cure\b|\bl abbe\b/g, ' cure '],
    [/\b(le |au )?docteur lorien\b|\bchez les lorien\b|\bchez le docteur\b|\bla maison du docteur\b/g, ' lorien '],
    [/\bmadame lorien\b|\bla femme du docteur\b/g, ' veronique '],
    [/\bfreres? pruvost\b/g, ' terrassiers '],
    [/\b(l )?orient express\b|\bsimplon orient( express)?\b/g, ' train '],
    [/\bvoiture salon\b|\bwagon salon\b/g, ' salle train '],
    [/\bporte d acier\b|\bporte de fer\b|\bporte rouillee\b/g, ' porte '],
    [/\bbras (de la |du )?statue\b|\bbras gauche\b|\bpremiere piece\b/g, ' bras ']
  );
  P.nomsCommuns = Object.assign(P.nomsCommuns || {}, { Saint: 1, Louis: 1, Germain: 1, Lyon: 1 });
})(typeof window !== 'undefined' ? window : globalThis);
