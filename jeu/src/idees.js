// =====================================================================
//  Le carnet d'idées : les fausses pistes, les tentations et les folies
//  Ce module ajoute aux lieux des chapitres des idées qui ne font pas avancer l'enquête,
//  ou qui la font avancer à un prix que l'on ne voit pas venir. Le moteur (engine.js, ideas())
//  les mêle aux bonnes pistes sans jamais les signaler ; leur part dépend de l'intelligence
//  du personnage, du mode choisi dans le menu et de sa santé mentale.
//    fausse : cohérente avec la scène, mais inutile ; coûte du temps, parfois de l'argent ;
//    risque : la tentation ; santé mentale, blessure, plainte, arrestation, porte qui se ferme ;
//    folie  : ce que propose un esprit qui lâche (santé mentale « Fragile » et pire).
//  En conversation, scene.paroles(api, pnj) fournit des banalités (sans effet, ou presque)
//  et des maladresses (qui vexent, ferment une porte ou font venir la police).
// =====================================================================
(function (G) {
  'use strict';
  var CH = G.CHAPTERS;
  if (!CH) return;
  var J = 1440;
  function hour(m) { return Math.floor((m % J) / 60); }
  function day(m) { return Math.floor(m / J); }

  // ----- les dés : '2', '1d3', '1d6+1'
  function de(api, x) {
    var m = String(x).match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
    if (!m) return parseInt(x, 10) || 0;
    var t = 0; for (var i = 0; i < +m[1]; i++) t += 1 + Math.floor(api.rand() * +m[2]);
    return t + (+m[3] || 0);
  }
  function texte(api, t, cle) { if (typeof t === 'function') return t(api); if (Array.isArray(t)) return api.fresh(cle, t); return t; }

  // une blessure hors combat : on ne meurt pas d'une mauvaise idée, mais on y perd des heures
  function blessure(api, n) {
    if (n <= 0) return;
    var pv = api.s.pc.pv;
    if (n < pv) { api.hp(-n); api.fx('shudder'); return; }
    if (pv > 1) api.hp(-(pv - 1));
    api.fx('shudder');
    api.say('Le monde bascule. Quand vous revenez à vous, des heures ont passé, et quelqu’un vous a pansé{e} sans vous demander votre avis. Il vous reste une bosse, une migraine et une grande fatigue.');
    api.s.min += 300;
  }
  // un personnage froissé : il vous en veut (dé de malus), il perd patience, parfois il ne veut plus vous voir
  function vexer(api, id, minutes) {
    if (!id) return;
    try { api.flag('humeur:' + id, -1); api.calm(id, -2); if (minutes) api.npcs(id).closedUntil = Math.max(api.npcs(id).closedUntil || -1, api.s.min + minutes); } catch (e) {}
  }
  // jusqu'au lendemain matin (ou jusqu'à h heures du jour même, s'il est encore tôt)
  function matin(api, h) {
    h = h || 7;
    var d = day(api.s.min) + (hour(api.s.min) >= h ? 1 : 0);
    api.s.min = d * J + h * 60; api.s.tick = 0;
  }

  // ----- un petit langage d'effets, pour écrire les idées sans écrire de code
  //   txt, npc:[id, texte], temps (min), cout (livres), vol (livres), pv ('1d3'), san ('1d2'),
  //   vexe (id du personnage) + ferme (minutes), plainte (id), matin (heure), suite (fonction), arret (id ou true)
  function moteur(ch) {
    var sc = CH[ch];
    if (!sc) return null;
    sc.checks = sc.checks || {};
    function arreter(api, id, o) {
      var hum = sc.humeur;
      if (hum && hum.arreter) hum.arreter(api, id || null, o);
      else { api.say('On vous reconduit, sans douceur. La soirée est perdue.'); api.time(120); }
    }
    function applique(api, e, cle) {
      if (!e) return;
      if (typeof e === 'function') { e(api); return; }
      if (typeof e === 'string' || Array.isArray(e)) e = { txt: e };
      if (e.txt) api.say(texte(api, e.txt, cle));
      if (e.npc) api.npc(e.npc[0], texte(api, e.npc[1], cle + ':n'));
      if (e.temps) api.time(e.temps);
      if (e.cout) api.pay(Math.min(e.cout, api.s.money));
      if (e.vol) { var v = Math.min(e.vol, api.s.money); if (v > 0) { api.s.money -= v; api.sys('Vous avez perdu ' + api.money(v) + '.'); } }
      if (e.pv) blessure(api, de(api, e.pv));
      if (e.san) api.lose(de(api, e.san));
      if (e.vexe) vexer(api, e.vexe, e.ferme || 0);
      if (e.plainte && sc.humeur && sc.humeur.plainte) sc.humeur.plainte(api, e.plainte);
      if (e.matin) matin(api, e.matin);
      if (e.suite) e.suite(api);
      if (e.arret) arreter(api, typeof e.arret === 'string' ? e.arret : null, typeof e.arret === 'object' ? e.arret : null);
    }
    // une idée nouvelle, posée dans un lieu (ou partout, si loc vaut '*')
    function idee(loc, o) {
      var lieu = loc === '*' ? null : sc.locations[loc];
      if (loc !== '*' && !lieu) return;
      var a = {
        id: o.id, label: o.label || o.idea, idea: o.idea, ideaAnon: o.anon, ideaKind: o.kind, verbs: [], nouns: [], time: o.time || 10,
        cond: o.cond, obj: o.obj,
        ideaCond: o.kind === 'folie' ? function (api) { return api.sanState() >= (o.fragile || 2) && (!o.ideaCond || o.ideaCond(api)); } : o.ideaCond,
        run: function (api) {
          if ((api.s.done[o.id] || 0) > 1) { api.say(api.fresh('ideeDeja', ['Vous l’avez déjà fait. Une fois suffit.', 'Non. Pas une deuxième fois.', 'Vous y avez déjà perdu assez de temps.'])); return; }
          if (!o.jet) { applique(api, o, 'idee:' + o.id); return; }
          applique(api, o.avant, 'idee:' + o.id + ':a');
          api.check('ri_' + o.id, o.jet.diff ? { diff: o.jet.diff } : undefined);
        }
      };
      if (o.jet) {
        var j = o.jet;
        sc.checks['ri_' + o.id] = { skill: j.skill, label: j.label, why: j.why || '', loss: j.loss, push: j.push,
          resolve: function (api, r) { applique(api, r.level === 0 && j.fiasco ? j.fiasco : r.success ? j.ok : j.ko, 'idee:' + o.id + (r.success ? ':ok' : ':ko')); } };
      }
      if (lieu) (lieu.actions = lieu.actions || []).push(a);
      else (sc.globalActions = sc.globalActions || []).push(a);
    }
    // une action déjà écrite dans le chapitre, versée au carnet sous une étiquette
    function marque(loc, id, kind, label) {
      var l = sc.locations[loc]; if (!l) return;
      var a = (l.actions || []).filter(function (x) { return x.id === id; })[0];
      if (!a) return;
      a.idea = label || a.idea || true; a.ideaKind = kind;
    }
    return { idee: idee, marque: marque, applique: applique, sc: sc };
  }
  G.RPG = G.RPG || {};
  G.RPG.Idees = { moteur: moteur, vexer: vexer, blessure: blessure, matin: matin };

  // =================================================================
  //  PROLOGUE : l'Orient-Express, de nuit
  // =================================================================
  var P0 = moteur('prologue');
  if (P0) {
    P0.marque('restaurant', 'r_boire', 'fausse', 'Goûter le cognac de Ravel');
    P0.marque('restaurant', 'r_attendre', 'fausse', 'Attendre que Ravel revienne');
    P0.marque('restaurant', 'r_cuisine_go', 'fausse', 'Entrer dans l’office');
    P0.marque('restaurant', 'r_ouvrir_fenetre', 'fausse', 'Ouvrir la fenêtre');
    P0.marque('couloir', 'c_gouter', 'risque', 'Goûter l’eau des traces');
    P0.marque('couloir', 'c_attendre', 'fausse', 'Attendre dans le soufflet');
    P0.marque('lits', 'w_k3', 'fausse', 'Frapper au 3');
    P0.marque('lits', 'w_k6', 'fausse', 'Frapper au 6');
    P0.marque('lits', 'w_fenetre', 'risque', 'Effacer la spirale sur la vitre');

    P0.idee('restaurant', { id: 'i0_carte', kind: 'fausse', idea: 'Demander la carte des desserts', time: 10,
      txt: 'Le serveur vous apporte la carte avec un soulagement visible : enfin une question qu’il comprend. Crème caramel, poires Belle-Hélène, sorbet au kirsch. Vous commandez un café. Il arrive tiède, et Ravel ne revient pas.', cout: 0.05 });
    P0.idee('couloir', { id: 'i0_portiere', kind: 'risque', idea: 'Ouvrir la portière, côté voie', time: 5,
      avant: 'Vous tirez la poignée de la portière du vestibule. Le vent l’arrache presque de vos mains ; la pluie, la nuit et le fracas des rails s’engouffrent d’un coup.',
      jet: { skill: 'DEX', why: 'refermer la portière sans être aspiré{e} dehors',
        ok: 'Vous refermez d’un coup d’épaule. Dehors, il n’y avait rien : des sapins noirs, un talus, la pluie. Vous êtes trempé{e}, et le conducteur, quelque part, a dû sentir le courant d’air.',
        ko: { txt: 'Le battant vous rabat contre la paroi ; vous vous retenez à la barre, les pieds dans le vide une seconde, puis le train vous rend au plancher. Votre épaule a heurté le fer.', pv: '1d3' } } });
    P0.idee('lits', { id: 'i0_chaussures', kind: 'risque', idea: 'Fouiller les chaussures du conducteur', time: 3,
      cond: function (api) { return !api.npcs('conducteur').met; },
      avant: 'Vous vous accroupissez près du strapontin. Les chaussures du conducteur baignent dans l’eau.',
      jet: { skill: 'Discrétion', why: 'ne pas réveiller le conducteur',
        ok: 'Une paire de lacets, un ticket de tramway de Milan, une semelle de feutre. Et de l’eau, encore de l’eau, glacée, qui sent la vase. Le conducteur n’a pas bougé.',
        ko: { txt: 'Le conducteur ouvre un œil, puis deux. Il vous trouve à genoux, la main dans sa chaussure. Il ne dit rien. Il n’en a pas besoin.', vexe: 'conducteur', ferme: 10 } } });
    P0.idee('*', { id: 'i0_reflet', kind: 'folie', idea: 'Vérifier que votre reflet suit vos gestes', time: 5,
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'détourner les yeux de la vitre',
        ok: 'Vous levez la main ; dans la vitre noire, votre reflet la lève aussi. Bien sûr. Vous vous sentez un peu ridicule.',
        ko: 'Vous levez la main. Le reflet la lève aussi, avec, vous en êtes certain{e}, une demi-seconde de retard. Vous ne recommencez pas.' } });
    P0.idee('*', { id: 'i0_souffle', kind: 'folie', idea: 'Retenir votre souffle tant que l’eau ruisselle', time: 5, fragile: 2,
      jet: { skill: 'CON', why: 'tenir sans vous évanouir',
        ok: 'Vous tenez, longtemps, les joues en feu. L’eau ne s’arrête pas pour autant. Vous reprenez votre souffle, honteu{x}.',
        ko: { txt: 'Des étincelles, puis du noir. Vous vous retrouvez assis{e} par terre, la tête contre la boiserie, le cœur battant. Quelqu’un aurait pu vous voir.', pv: '1', temps: 10 } } });
  }

  // =================================================================
  //  LONDRES : du 5 au 12 janvier 1923
  // =================================================================
  var L = moteur('londres');
  if (L) {
    var FEU = J + 23 * 60; // l'incendie de St John's Wood, samedi 23 h (cf. londres_circuits.js)
    var special = /^(wagon1|wagon2|retour|campagne|cave)$/;
    var ville = function (api) { return !special.test(api.s.loc) && !api.flag('combat'); };

    // ----- l'Institut impérial, le premier soir
    L.marque('institut', 'i_boire', 'fausse', 'Prendre une coupe de champagne');
    L.marque('institut', 'i_moustachu', 'fausse', 'Chercher l’homme à la moustache dans la foule');
    L.idee('institut', { id: 'il_vestiaire', kind: 'risque', idea: 'Fouiller le pardessus de Smith au vestiaire', time: 10,
      cond: function (api) { return !api.flag('smithParti'); },
      avant: 'Vous vous glissez au vestiaire, où pendent cent pardessus à peu près pareils. Celui de Smith a un col d’astrakan râpé.',
      jet: { skill: 'Discrétion', why: 'fouiller les poches sans qu’on vous voie',
        ok: 'Un mouchoir, des pastilles à la violette, le programme de la soirée annoté au crayon d’une écriture minuscule : « trop long », « couper Konya ». Rien qui vous apprenne quoi que ce soit, sinon que Smith a le trac.',
        ko: { txt: 'Une main gantée se pose sur votre bras : le préposé du vestiaire. « Monsieur s’est trompé de manteau, sans doute. » Il le dit assez fort. Plus loin, Beddows a tourné la tête, et il ne vous quitte plus des yeux.', vexe: 'beddows', ferme: 0 } } });
    L.idee('institut', { id: 'il_buffet', kind: 'fausse', idea: 'Faire honneur au buffet', time: 20,
      cond: function (api) { return !api.flag('smithParti'); },
      txt: 'Des canapés au saumon, des bouchées à la reine, un pâté en croûte monumental. Un vieux colonel vous explique, la bouche pleine, ce qu’il pense des Turcs, des Grecs et des cuisiniers français. Quand vous vous retournez, la soirée a avancé sans vous.' });

    // ----- l'hôtel de Bloomsbury
    L.marque('hotel', 'h_fouille', 'fausse', 'Fouiller la chambre de fond en comble');
    L.marque('hotel', 'h_fenetre', 'fausse', 'Regarder par la fenêtre');
    L.idee('hotel', { id: 'il_bar', kind: 'fausse', idea: 'Prendre un remontant au bar de l’hôtel', time: 45,
      cond: function (api) { var h = hour(api.s.min); return h >= 11 || h < 1; },
      txt: ['Un whisky, puis un second. Le barman parle de cricket, de l’Australie, d’un neveu qui joue pour le Surrey. Il est très agréable. Il ne sait rien. Vous remontez avec une chaleur dans la poitrine et une heure de moins.'], cout: 0.15 });
    L.idee('hotel', { id: 'il_barricade', kind: 'folie', idea: 'Barricader la porte avec l’armoire', time: 30,
      avant: 'Vous poussez l’armoire de toutes vos forces vers la porte. Elle pèse le poids d’un piano.',
      jet: { skill: 'FOR', why: 'la traîner jusqu’à la porte sans vous faire mal',
        ok: { txt: 'L’armoire est contre la porte. Vous vous asseyez sur le lit, essoufflé{e}, et vous la regardez. Il faudra la remettre en place avant que la femme de chambre ne passe. Personne n’a essayé d’entrer.', san: '0' },
        ko: { txt: 'Quelque chose craque dans votre dos. Le garçon d’étage frappe : le client du dessous se plaint du vacarme. Vous lui parlez à travers la porte, plié{e} en deux, et il s’éloigne en marmonnant.', pv: '1' } } });

    // ----- Cheapside : Beddows et l'homme sur le lit
    var cheapsideOuvert = function (api) { return !api.flag('cheapsideFini') && !api.flag('demasque'); };
    L.idee('cheapside', { id: 'il_front', kind: 'risque', idea: 'Poser la main sur le front du malade', time: 3, cond: cheapsideOuvert,
      avant: 'Vous tendez la main vers le front bandé. Beddows esquisse un geste, puis renonce.',
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d3'], why: 'ne pas retirer la main trop vite',
        ok: 'Sous la gaze, la peau est brûlante, et curieusement souple, comme de la cire au soleil. Vous retirez la main sans hâte. Le malade n’a pas bronché.',
        ko: 'Sous la gaze, la peau cède sous vos doigts, comme de la cire chaude, et quelque chose dessous se déplace pour suivre votre main. Vous la retirez d’un coup. « Qu’y a-t-il ? » demande la voix râpeuse. Vous ne répondez pas.' } });
    L.idee('cheapside', { id: 'il_medecin', kind: 'fausse', idea: 'Aller chercher un médecin dans le quartier', time: 60, cond: cheapsideOuvert,
      txt: 'Le seul médecin de la rue est parti pour un accouchement à Shoreditch ; sa bonne ne sait pas quand il rentrera. Quand vous remontez l’escalier qui sent le chou, Beddows met longtemps à vous rouvrir. « Il ne veut pas de médecin, {m}. Il ne l’a jamais voulu. »' });

    // ----- le Chelsea Arms
    L.idee('chelsea', { id: 'il_agent', kind: 'risque', idea: 'Glisser un billet à l’agent de l’escalier', time: 5,
      avant: 'Vous approchez de l’agent, un billet d’une livre plié dans la paume.',
      jet: { skill: 'Baratin', why: 'faire passer le billet pour autre chose qu’une offre',
        ok: { txt: 'L’agent regarde le billet, puis vous. « Rangez ça, {m}, avant que je ne l’aie vu. » Il ne vous laisse pas monter. Mais il ne vous embarque pas non plus, et il fait semblant d’avoir oublié votre visage.' },
        ko: { txt: 'L’agent referme la main sur votre poignet, billet compris. « Tentative de corruption d’un agent de la force publique, {m}. Vous allez me suivre. »', arret: { motif: 'Tentative de corruption.', fleming: 'Un billet à un agent de faction ? À Londres, on n’achète pas un policier comme un ticket d’omnibus.' } } } });
    L.idee('chelsea', { id: 'il_clients', kind: 'fausse', idea: 'Interroger les clients du hall', time: 25,
      txt: 'Un commis voyageur, deux vieilles demoiselles, un Écossais sourd. Personne n’a rien vu, tout le monde a une théorie : les anarchistes, les Irlandais, les bolcheviks, une femme. Aucune ne tient debout, et toutes prennent du temps.' });

    // ----- New Scotland Yard
    L.idee('yard', { id: 'il_dossiers', kind: 'risque', idea: 'Lire les dossiers sur un bureau vide', time: 5,
      avant: 'Un bureau sans personne, une pile de chemises cartonnées. Vous vous penchez, l’air de rien.',
      jet: { skill: 'Discrétion', why: 'lire sans vous faire prendre',
        ok: 'Des vols de bicyclettes à Lambeth, des chiens empoisonnés à Hampstead, une plainte pour tapage contre un ténor. La police de Londres a ses misères. Aucune n’est la vôtre.',
        ko: { txt: 'Un sergent vous attrape par le col. « Les dossiers de la Police métropolitaine ne sont pas une bibliothèque de prêt, {m}. » On vous pose sur un banc, on vous fait attendre, et l’on fait savoir là-haut ce que vous avez tenté.', vexe: 'fleming', ferme: 240, temps: 60 } } });
    L.idee('yard', { id: 'il_trouves', kind: 'fausse', idea: 'Consulter le registre des objets trouvés', time: 30,
      txt: 'Le registre des objets trouvés est un roman de Londres : quatre cents parapluies, un dentier en or, un perroquet, un cercueil d’enfant, vide, « oublié dans un fiacre ». Rien qui ressemble à ce que vous cherchez. Vous en ressortez une demi-heure plus tard, étrangement mélancolique.' });

    // ----- l'ambassade de Turquie
    L.idee('ambassade', { id: 'il_visa', kind: 'fausse', idea: 'Demander un visa pour Constantinople', time: 40,
      txt: 'L’huissier vous remet quatre formulaires, en turc et en français, à remplir en trois exemplaires avec deux photographies. Le visa sera prêt dans trois semaines. Peut-être. « La situation est compliquée, à Lausanne », s’excuse-t-il, comme si c’était votre faute.' });
    L.idee('ambassade', { id: 'il_tiroir', kind: 'risque', idea: 'Ouvrir le tiroir du bureau quand l’attaché s’absente', time: 5,
      cond: function (api) { return api.npcs('mustapha').met; },
      avant: 'L’attaché s’excuse et sort un instant. Le tiroir de son bureau est entrouvert.',
      jet: { skill: 'Discrétion', why: 'refermer le tiroir avant son retour',
        ok: 'Des cartes de visite, un recueil de poèmes persans, des loukoums à la rose dans une boîte en fer. Rien sur Makryat, rien sur personne. Vous refermez au moment où la porte se rouvre.',
        ko: { txt: 'La porte se rouvre plus tôt que prévu. L’attaché vous regarde, la main dans son tiroir. Il ne crie pas. Il sonne l’huissier, très poliment, et l’on vous raccompagne jusqu’à la rue.', vexe: 'mustapha', ferme: J, suite: function (api) { api.endTalk(false); } } } });

    // ----- Brophy Lane, Islington
    L.marque('islington', 'is_arriere', 'fausse', 'Chercher une autre entrée');
    L.idee('islington', { id: 'il_vitre', kind: 'risque', idea: 'Briser la vitre de la boutique', time: 5,
      avant: 'Vous enveloppez votre poing dans votre écharpe et frappez la vitre, d’un coup sec.',
      jet: { skill: 'CHANCE', why: 'que personne ne regarde',
        ok: { txt: 'Le verre cède avec un bruit de fin du monde. Derrière, un grillage de fer, solidement vissé : on ne passe pas. Vous vous êtes ouvert la main pour rien, et vous filez avant que la rue ne se réveille.', pv: '1' },
        ko: { txt: 'Le verre cède, et derrière il y a un grillage de fer. Sur le pas de sa porte, le buraliste vous a vu, et il note quelque chose sur un bout de papier. Vous vous êtes ouvert la main.', pv: '1', plainte: 'voisin' } } });

    // ----- la boutique de Makryat
    L.idee('boutique', { id: 'il_aiguieres', kind: 'risque', idea: 'Ouvrir les aiguières scellées', time: 10,
      avant: 'Sur une étagère, trois aiguières de cuivre au bouchon scellé de cire noire. Vous faites sauter les cachets un à un.',
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'regarder ce qu’il y a dans la troisième',
        ok: 'De l’huile rance, des clous de girofle, et dans la troisième une petite chose sèche et recroquevillée. Une patte de singe, sans doute. Vous refermez.',
        ko: 'De l’huile rance, des clous de girofle. Et dans la troisième, une petite main sèche et recroquevillée, aux ongles longs, qui a eu un jour cinq doigts et une bague. Vous refermez, et vous ne cessez pas d’y penser.' } });
    L.idee('boutique', { id: 'il_tapis', kind: 'fausse', idea: 'Dérouler les tapis', time: 25,
      txt: 'Des tapis d’Anatolie, beaux et poussiéreux. Vous en déroulez cinq, à genoux, éternuant à chaque fois. Il n’y a rien dedans, sinon des mites, de la laine, et le temps qui passe.' });

    // ----- la salle de lecture du British Museum
    L.marque('musee', 'm_makryat', 'fausse', 'Chercher tout ce qu’on a écrit sur Makryat');
    L.marque('musee', 'm_voyage', 'fausse', 'Se documenter sur l’Orient-Express');
    L.idee('musee', { id: 'il_interdits', kind: 'risque', idea: 'Demander les traités d’occultisme de l’Enfer', time: 60,
      cond: function (api) { var c = api.flag('carteMusee'); return c !== undefined && c !== false && day(api.s.min) >= c; },
      avant: 'Vous demandez au comptoir les ouvrages que le Museum garde sous clé, ceux qu’on appelle l’Enfer. Le préposé hésite, puis vous les apporte, enveloppés de papier gris.',
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d3'], why: 'refermer le livre à temps',
        ok: 'Un traité allemand de 1702, des gravures de sabbat, des recettes de pommade. Beaucoup de vantardise et quelques pages vraiment malsaines. Rien sur Sedefkar que vous ne sachiez déjà.',
        ko: 'Un traité allemand de 1702, dont une gravure vous retient trop longtemps : un homme qu’on retourne comme un gant, et qui sourit. Vous refermez. Rien sur Sedefkar. Seulement cette image, qui ne vous quitte plus.' } });

    // ----- Stoke Newington : Mrs Atkins et la chambre de la mort
    L.idee('stoke', { id: 'il_voisins', kind: 'fausse', idea: 'Questionner les voisins de Mrs Atkins', anon: 'Questionner les voisins', time: 35,
      txt: 'Porte après porte, la même rue, les mêmes rideaux qui bougent. Tout le monde a une histoire sur Mr Stanley, et chacune contredit la précédente : il était communiste, il était prêtre, il était fou, il était charmant. Une dame vous offre du thé. Vous ressortez riche de rumeurs.' });
    L.idee('stoke', { id: 'il_louer', kind: 'risque', idea: 'Louer la chambre de Stanley pour la nuit', time: 10,
      cond: function (api) { var h = hour(api.s.min); return h >= 17 || h < 2; },
      avant: { txt: 'Mrs Atkins compte vos shillings deux fois. « La chambre de la mort, pour la nuit ? Vous êtes bien le premier. » Vous montez. Les locomotives vous regardent depuis les murs. Vous éteignez.', cout: 0.25 },
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d4'], why: 'dormir là où Stanley a brûlé',
        ok: { txt: 'Vous dormez mal, d’un sommeil plein de sifflets et de fumée. Au matin, la chambre est une chambre, et Mrs Atkins vous sert un œuf dur. Vous n’avez rien appris, sinon que vous êtes plus solide que vous ne pensiez.', matin: 7 },
        ko: { txt: 'À trois heures, un train traverse la chambre. Vous l’entendez venir de loin, puis le plancher tremble, la lampe danse, l’air sent le charbon, et cela passe à travers vous, interminable. Au matin, il n’y a rien. Pas une trace. Mrs Atkins vous trouve assis{e} sur le palier, tout{e} habillé{e}.', matin: 7 } } });
    L.marque('chambre_stanley', 'cs_fenetre', 'fausse', 'Examiner la fenêtre');
    L.idee('chambre_stanley', { id: 'il_lit', kind: 'risque', idea: 'Vous allonger sur le lit de Stanley', time: 10,
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'vous relever sans hâte',
        ok: 'Le matelas garde la forme d’un homme. Vous fixez le plafond, où une tache de suie dessine vaguement un tunnel. C’est tout. Vous vous relevez.',
        ko: 'Le matelas garde la forme d’un homme, et elle est encore tiède. Au plafond, la tache de suie s’ouvre comme un tunnel, et quelque chose y roule vers vous, très loin. Vous vous retrouvez debout, adossé{e} à la porte, sans savoir comment.' } });

    // ----- Camberwell : Arthur Butter
    L.idee('camberwell', { id: 'il_lampes', kind: 'fausse', idea: 'Admirer la collection de lampes de chef de gare', time: 50,
      txt: 'C’est une erreur. Arthur Butter vous présente chaque lampe, sa compagnie, sa ligne, la couleur exacte de son verre et l’homme qui l’a tenue. Il y en a trente-deux. Il est heureux. Vous, un peu moins, et l’heure a tourné.' });
    L.idee('camberwell', { id: 'il_cloche', kind: 'risque', idea: 'Sonner la cloche de locomotive', time: 5,
      txt: 'Le bronze vous emplit le crâne et fait trembler les gravures. Dans la cuisine, un plat se brise. Arthur Butter devient très rouge, puis très pâle. « On ne sonne pas la cloche de la 1102. On ne la sonne jamais. » Il vous montre la porte.', vexe: 'butter', ferme: 90 });

    // ----- la cave et le train de Butter
    L.idee('cave', { id: 'il_rampe', kind: 'risque', idea: 'Redresser une rampe de la voie', time: 10,
      cond: function (api) { return !api.flag('fantomeVenu'); },
      jet: { skill: 'Mécanique', why: 'ne pas fausser la voie',
        ok: 'Vous remettez la rampe à sa place, au millimètre. En vous redressant, vous avez l’impression que la locomotive a avancé d’un doigt. Sûrement pas.',
        ko: { txt: 'La rampe se tord sous vos doigts et vous entaille la paume. Vous la redressez tant bien que mal. Quand vous relevez les yeux, le petit train a reculé de deux centimètres, tout seul, et il est plus près de vous.', pv: '1', san: '1' } } });

    // ----- le train fantôme
    L.marque('retour', 'r_alarme', 'fausse', 'Tirer le signal d’alarme');
    L.marque('retour', 'r_rester', 'risque', 'Rester à bord jusqu’au bout');
    L.idee('wagon1', { id: 'il_visage', kind: 'risque', idea: 'Regarder un passager en face', time: 1,
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d4'], why: 'soutenir son regard',
        ok: 'Un visage gris, une moustache de 1897, des yeux trop clairs. Il vous sourit, et vous ne cédez pas. Il détourne les yeux le premier, vexé.',
        ko: 'Un visage gris, des yeux trop clairs, et derrière les yeux, rien, une eau qui bouge. Il vous sourit avec des dents qui ne sont pas les siennes. Vous reculez contre la vitre.' } });
    L.idee('wagon1', { id: 'il_asseoir', kind: 'folie', idea: 'Vous asseoir parmi eux, rien qu’un instant', time: 2,
      txt: 'Ils se poussent pour vous faire de la place, avec des soupirs d’aise. La banquette est froide. Quelqu’un vous tapote la main. C’est doux, et c’est atroce, et vous vous relevez d’un bond avant de vouloir rester.', san: '1d3' });
    L.idee('campagne', { id: 'il_ferme', kind: 'fausse', idea: 'Chercher une ferme pour demander de l’aide', time: 60,
      txt: 'Vous marchez longtemps dans les labours, jusqu’à une ferme où un chien vous accueille et un fermier vous congédie. Personne n’a vu de train. Il n’y a pas de voie, ici. Il n’y en a jamais eu.' });

    // ----- la gare Victoria
    L.idee('victoria', { id: 'il_baedeker', kind: 'fausse', idea: 'Acheter un guide de l’Europe centrale', time: 15, cout: 0.4,
      txt: 'Le kiosque vend un Baedeker de l’Europe du Sud-Est, édition 1914 : les frontières n’existent plus, deux des pays non plus. Vous l’achetez quand même. Il pèse lourd dans la poche.' });
    L.idee('victoria', { id: 'il_porteur', kind: 'risque', idea: 'Suivre le porteur qui vous a regardé de travers', time: 40,
      avant: 'Vous le suivez entre les malles et les adieux, jusqu’aux quais de marchandises.',
      jet: { skill: 'CHANCE', why: 'ne pas vous faire plumer',
        ok: 'Il retrouve sa femme à la consigne et lui donne un baiser. C’est tout. Vous revenez sous la verrière, un peu honteu{x}.',
        ko: { txt: 'Vous le perdez dans la vapeur. Quand vous revenez sous la verrière, votre portefeuille vous semble plus léger : on vous a fait les poches pendant que vous jouiez les détectives.', vol: 2 } } });

    // ----- St John's Wood, avant l'incendie
    var avantFeu = function (api) { return api.s.min < FEU; };
    L.idee('stjohn', { id: 'il_echafaudage', kind: 'risque', idea: 'Grimper à l’échafaudage jusqu’à une fenêtre', time: 15, cond: avantFeu,
      jet: { skill: 'Grimper', why: 'atteindre le premier étage sans tomber',
        ok: 'Vous atteignez le premier étage. La fenêtre est fermée, les volets clos de l’intérieur. Vous redescendez, les mains noires de peinture, sous le regard d’un ouvrier qui ne vous demande rien et n’en pense pas moins.',
        ko: { txt: 'Une planche bascule. Vous tombez de trois mètres dans un tas de sable et de seaux renversés. Les ouvriers accourent. On vous relève, on vous époussette, on vous regarde de travers.', pv: '1d4' } } });
    L.idee('stjohn', { id: 'il_ouvriers', kind: 'fausse', idea: 'Interroger les peintres des échafaudages', time: 20, cond: avantFeu,
      txt: 'Ils repeignent, ils sont payés à la fenêtre, et ils ne savent rien. Le vieux professeur ? Jamais vu. Le domestique ? Il leur apporte du thé, quand il y pense. Il n’y pense pas souvent.' });

    // ----- Fleet Street, les archives
    L.idee('archives', { id: 'il_faitsdivers', kind: 'fausse', idea: 'Feuilleter les faits divers de 1900', time: 60,
      txt: 'Un aéronaute disparu au-dessus de la Manche, un éléphant échappé à Battersea, un pasteur qui a vendu sa femme. 1900 était une année riche. Elle n’a rien à vous dire.' });
    L.idee('archives', { id: 'il_canif', kind: 'risque', idea: 'Découper un article au canif', time: 10,
      jet: { skill: 'Discrétion', why: 'que Mrs Pike ne voie rien',
        ok: 'Vous glissez dans votre poche une coupure sur un accident de chemin de fer en 1896. Elle ne vous servira à rien ; vous le savez en la pliant. Mrs Pike, au fond, tamponne des registres.',
        ko: { txt: 'Le canif crisse sur le papier. Mrs Pike est derrière vous, sans que vous l’ayez entendue venir. « Trente-quatre ans, {m}, que personne n’a découpé un journal dans cette salle. » Vous êtes prié{e} de partir, et de ne pas revenir de sitôt.', vexe: 'pike', ferme: J } } });

    // ----- le Museum Tavern
    L.idee('pub', { id: 'il_tournee', kind: 'fausse', idea: 'Offrir une tournée générale', time: 30, cout: 1,
      txt: 'Le pub entier lève son verre à votre santé. Le vieux soldat vous raconte Omdurman, les étudiants chantent, le patron essuie son comptoir avec une expression neuve, presque tendre. Une livre de moins, une heure de gaieté, et pas un renseignement.' });
    L.idee('pub', { id: 'il_pari', kind: 'risque', idea: 'Parier une livre aux fléchettes contre un docker', time: 20,
      jet: { skill: 'Lancer', why: 'battre le docker',
        ok: { txt: 'Double vingt, triple dix-neuf. Le docker paie, de mauvaise grâce, et la salle applaudit.', suite: function (api) { api.s.money += 1; } },
        ko: { txt: 'Le docker plante ses fléchettes comme des clous, sans même regarder. Vous payez. Il vous propose une revanche, avec un grand sourire. Vous déclinez.', cout: 1 } } });
    L.idee('pub', { id: 'il_soldat', kind: 'folie', idea: 'Demander au vieux soldat s’il entend l’eau, lui aussi', time: 10,
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'supporter sa réponse',
        ok: 'Le vieux soldat vous regarde longtemps. « Moi, c’est les obus, mon gars. Toutes les nuits. » Il vous tape sur l’épaule. Cela ne vous console pas, mais cela vous ramène sur terre.',
        ko: 'Le vieux soldat cesse de marmonner. « L’eau ? » Il se penche, et souffle : « Elle monte, hein ? Elle monte depuis Noël. » Puis il rit, et recommence à parler tout seul, et vous ne savez plus s’il a vraiment dit cela.' } });

    // ----- l'église St George
    L.idee('eglise', { id: 'il_plaques', kind: 'fausse', idea: 'Lire les plaques funéraires', time: 20,
      txt: 'Des marchands, des magistrats, un capitaine de la Compagnie des Indes « englouti avec son vaisseau ». Des vertus gravées dans le marbre, et la poussière dessus. Rien qui vous parle, sinon le capitaine, un peu.' });
    L.idee('eglise', { id: 'il_clocher', kind: 'folie', idea: 'Monter au clocher pour voir venir le train', time: 15,
      jet: { skill: 'Grimper', why: 'monter l’échelle du clocher sans tomber',
        ok: 'Du haut du clocher, Londres n’est qu’un brouillard jaune, des toits, des cheminées. Pas de train. Il n’y a pas de voie, ici. Vous redescendez lentement, en vous tenant à chaque barreau.',
        ko: { txt: 'Un barreau manque. Vous vous rattrapez de justesse, et vous redescendez en vous écorchant les mains. Le révérend vous attend en bas, les bras croisés.', pv: '1', vexe: 'hollis' } } });

    // ----- les quais
    L.idee('quais', { id: 'il_greve', kind: 'risque', idea: 'Descendre sur la grève à marée basse', time: 30,
      avant: 'Un escalier de granit, glissant d’algues, descend jusqu’à la vase.',
      jet: { skill: 'DEX', why: 'garder l’équilibre dans la vase',
        ok: 'Vous trouvez une pipe en terre, un dentier, une médaille de Waterloo, un fer à cheval. La Tamise rend tout, et rien d’utile. Vous remontez crotté{e} jusqu’aux genoux.',
        ko: { txt: 'Le pied vous manque. La vase vous avale jusqu’à la taille, glacée, qui sent la mort et l’égout. Il vous faut longtemps pour vous en tirer. Vous remontez tremblant{e}, et le froid ne vous quitte pas de la soirée.', pv: '1d2', temps: 30 } } });
    L.idee('quais', { id: 'il_ecouter', kind: 'folie', idea: 'Écouter ce que dit le fleuve', time: 20,
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d4'], why: 'cesser d’écouter',
        ok: 'Le fleuve clapote, et c’est tout. De l’eau, du granit, une corne de brume. Vous vous en voulez d’avoir espéré autre chose.',
        ko: 'Le fleuve clapote, et dans le clapotis il y a un rythme, et dans le rythme, votre nom, prononcé par une bouche pleine d’eau. Vous restez là jusqu’à ce qu’un agent vous demande si tout va bien.' } });

    // ----- le salon de Mrs Vane
    L.idee('vane', { id: 'il_consultation', kind: 'risque', idea: 'Demander une consultation privée', time: 30,
      avant: { txt: 'Deux guinées. Mrs Vane les fait disparaître dans son corsage, ferme les yeux, et prend vos mains dans les siennes.', cout: 2.1 },
      jet: { skill: 'Psychologie', why: 'voir clair dans son numéro',
        ok: 'Un numéro bien rodé : des généralités, des silences, des questions déguisées en visions. Elle vous dit ce que vous lui avez appris sans le savoir. Vous ressortez plus pauvre, et non sans admiration pour le métier.',
        ko: { txt: 'Elle vous parle d’un homme de feu qui n’est pas celui qu’il dit, d’un train qui roule sur l’eau, d’une porte au bout d’un très long voyage. Elle ouvre les yeux et vous demande, de sa voix ordinaire, si c’était bien. Vous ne savez pas quoi croire. C’est sans doute le but.', san: '1' } } });

    // ----- partout en ville : ce que souffle un esprit qui lâche
    L.idee('*', { id: 'il_pas', kind: 'folie', idea: 'Compter vos pas jusqu’à un nombre pair', time: 25, cond: ville,
      txt: 'Vous comptez vos pas. Quatre cent trois. Il faut un nombre pair, sinon quelque chose arrivera. Vous recommencez. Quand vous vous arrêtez enfin, il fait plus sombre, et vous ne savez plus très bien pourquoi c’était si important.' });
    L.idee('*', { id: 'il_mains', kind: 'folie', idea: 'Vous laver les mains jusqu’à ce que l’odeur de vase parte', time: 30, cond: ville,
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'vous arrêter de frotter',
        ok: 'Vous trouvez un lavabo, du savon, et vous frottez. L’odeur finit par partir. Peut-être n’était-elle jamais là.',
        ko: 'Vous frottez jusqu’au sang. L’odeur est toujours là. Elle n’est pas sur vos mains. Elle est dans votre nez, dans votre gorge, partout.' } });
    L.idee('*', { id: 'il_tamise', kind: 'folie', idea: 'Courir au fleuve vérifier qu’il coule dans le bon sens', time: 45, fragile: 3,
      cond: function (api) { return ville(api) && api.s.loc !== 'quais' && !!L.sc.locations.quais; },
      txt: 'Vous traversez Londres presque en courant, bousculant des passants, jusqu’à l’Embankment. Le fleuve coule. Vers la mer. Vous restez longtemps à le regarder, pour être sûr{e}.', san: '1', suite: function (api) { api.go('quais'); } });
  }

  // =================================================================
  //  PARIS : janvier 1923
  // =================================================================
  var Pa = moteur('paris');
  if (Pa) {
    var villeP = function (api) { return api.s.loc !== 'gare'; };
    Pa.marque('charenton', 'ch_guimart', 'fausse', 'Demander à voir Guimart');
    Pa.marque('charenton', 'ch_interner', 'fausse', 'Vous faire interner pour approcher Guimart');

    // ----- la gare du Nord
    Pa.idee('gare', { id: 'ip_change', kind: 'fausse', idea: 'Changer vos livres au bureau de change', time: 20, cout: 0.1,
      txt: 'Le changeur de la gare compte vos billets avec une lenteur d’horloger, et vous prend une commission digne d’un usurier. Vous ressortez avec une liasse de francs qui pèse plus lourd que ce qu’elle vaut.' });
    Pa.idee('gare', { id: 'ip_chapeau', kind: 'risque', idea: 'Suivre l’homme au chapeau qui vous a regardé descendre', time: 45,
      jet: { skill: 'Discrétion', why: 'le suivre sans qu’il vous voie',
        ok: 'Vous le suivez jusqu’au boulevard de Magenta, où il entre chez un marchand de cravates. Il en ressort avec une cravate. Vous revenez à la gare, et votre taxi vous attend encore, par miracle.',
        ko: { txt: 'Il se retourne au coin de la rue de Dunkerque, vous regarde bien en face, et disparaît dans la foule. Le temps de revenir, quelqu’un vous a délesté{e} d’un billet, à l’ancienne, dans la bousculade.', vol: 0.5 } } });

    // ----- l'hôtel du Cygne
    Pa.idee('hotel', { id: 'ip_bouillon', kind: 'fausse', idea: 'Dîner au bouillon du coin de la rue', time: 60, cout: 0.05,
      cond: function (api) { var h = hour(api.s.min); return h >= 11 && h < 22; },
      txt: 'Un bouillon Chartier, ses glaces, ses garçons en tablier, son vacarme. Un pot-au-feu, un quart de rouge, une addition griffonnée sur la nappe en papier. Votre voisin de table vous parle de la Ruhr. Vous en savez autant qu’avant, mais vous avez chaud.' });
    Pa.idee('hotel', { id: 'ip_voisine', kind: 'risque', idea: 'Fouiller la chambre d’à côté pendant le ménage', time: 10,
      cond: function (api) { var h = hour(api.s.min); return h >= 9 && h < 14; },
      jet: { skill: 'Discrétion', why: 'entrer et sortir avant le retour de la femme de chambre',
        ok: 'Un représentant en lingerie de Lyon : des échantillons, des factures, une lettre à sa mère. Rien, absolument rien. Vous ressortez en vous demandant ce que vous espériez.',
        ko: { txt: 'La femme de chambre revient avec ses draps et vous trouve au milieu de la chambre d’un autre. Elle pousse un cri qui monte jusqu’au sixième. M. Blain arrive, très pâle, et vous explique longuement ce qu’est un hôtel respectable.', vexe: 'gerant', ferme: 600 } } });
    Pa.idee('hotel', { id: 'ip_guet', kind: 'folie', idea: 'Guetter la rue derrière le rideau, toute la nuit', time: 30,
      cond: function (api) { var h = hour(api.s.min); return h >= 20 || h < 4; },
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'aller vous coucher',
        ok: { txt: 'Le réverbère, son rond de lumière, une voiture de laitier vers quatre heures. Vous finissez par dormir dans le fauteuil, mal, et peu.', matin: 8 },
        ko: { txt: 'Vous ne quittez pas la vitre. À chaque silhouette, votre cœur s’arrête. Le jour vous trouve debout, les yeux brûlants, et la rue est vide depuis des heures.', matin: 8, pv: '1' } } });

    // ----- la Bibliothèque nationale
    Pa.idee('bn', { id: 'ip_bottin', kind: 'fausse', idea: 'Chercher Fenalik dans le Bottin mondain', time: 30,
      txt: 'Le Bottin mondain de 1922 connaît quatre Fénelon, deux Fenouillet et un Fénal, pharmacien à Pontoise. Pas un seul Fenalik. Vous auriez pu vous en douter : ce genre d’homme ne figure pas dans les annuaires.' });
    Pa.idee('bn', { id: 'ip_reserve', kind: 'risque', idea: 'Passer dans la réserve des livres rares sans autorisation', time: 20,
      cond: function (api) { return !!api.flag('carteBN'); },
      avant: 'Une porte de service, entrouverte, derrière les rayonnages. On aperçoit des grilles et des reliures.',
      jet: { skill: 'Discrétion', why: 'entrer et sortir sans croiser un gardien',
        ok: 'Des kilomètres de reliures sous grillage, des cotes que vous ne savez pas lire, un gardien qui ronfle sur une chaise. Sans le catalogue, vous ne trouverez rien. Vous ressortez les mains vides, avant qu’on vous voie.',
        ko: { txt: 'Un gardien vous attrape par la manche entre deux grilles. « La Réserve ! Sans bulletin ! » On vous conduit au poste de la rue de la Banque, où l’on prend votre nom avec beaucoup de soin.', arret: true } } });

    // ----- l'Arsenal
    Pa.idee('arsenal', { id: 'ip_sully', kind: 'fausse', idea: 'Visiter les salons de Sully', time: 30,
      txt: 'Mlle Brévin vous ouvre, avec une fierté discrète, le cabinet doré du duc de Sully : des boiseries peintes, des plafonds à caissons, un silence de trois siècles. C’est très beau. Cela ne vous apprend rien sur personne, et la lumière baisse déjà.' });
    Pa.idee('arsenal', { id: 'ip_emporter', kind: 'risque', idea: 'Demander à emporter un dossier à l’hôtel', time: 5,
      txt: 'Mlle Brévin vous regarde comme si vous aviez proposé d’emporter une colonne du bâtiment. « Rien ne sort d’ici, {m}. Rien. Jamais. » Elle ne vous a plus tout à fait à la bonne.', vexe: 'brevin' });

    // ----- Charenton
    Pa.idee('charenton', { id: 'ip_parc', kind: 'fausse', idea: 'Faire le tour du parc avec les pensionnaires', time: 30,
      txt: 'Sous les arcades, un vieux monsieur vous prend le bras et vous explique, très poliment, qu’il est le duc d’Enghien et qu’on l’a fusillé par erreur. Un autre compte les colonnes. Vous faites trois tours avec eux. C’est paisible, et terrible, et inutile.' });
    Pa.idee('charenton', { id: 'ip_mur', kind: 'risque', idea: 'Escalader le mur du quartier des agités', time: 20,
      jet: { skill: 'Grimper', why: 'passer le mur sans être vu',
        ok: { txt: 'Du haut du mur, vous voyez une cour, des fenêtres grillagées, et derrière l’une d’elles un homme qui trace sur le mur, du doigt, toujours le même signe. Il s’arrête et se tourne vers vous. Vous redescendez très vite.', san: '1d2' },
        ko: { txt: 'Vous retombez dans la cour, sur les pavés. Deux infirmiers vous relèvent sans douceur. Le portier appelle les agents, qui ne sourient pas : à Charenton, on n’entre pas par les murs.', pv: '1d3', arret: true } } });
    Pa.idee('charenton', { id: 'ip_lit', kind: 'folie', idea: 'Demander au portier s’il reste un lit pour vous', time: 10,
      txt: 'Le portier vous regarde longtemps. Il a l’habitude. Il vous indique, très doucement, la sortie, et la gare, et il vous conseille de dormir. Vous ne savez pas pourquoi vous avez demandé cela.', san: '1' });

    // ----- le café de Charenton
    Pa.idee('cafe', { id: 'ip_patron', kind: 'fausse', idea: 'Faire la conversation au patron', time: 15,
      txt: 'Le patron parle du prix du charbon, de la Ruhr, de sa belle-sœur de Joinville. De la maison de santé, rien : « Les gens de là-haut boivent ici. Ils paient. Le reste ne me regarde pas. »' });

    // ----- partout dans Paris
    Pa.idee('*', { id: 'ip_seine', kind: 'folie', idea: 'Marcher le long de la Seine jusqu’à ce que l’eau se taise', time: 90, cond: villeP,
      jet: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'rentrer avant la nuit',
        ok: 'Les quais, les bouquinistes qui ferment leurs boîtes, les péniches. L’eau ne se tait pas, mais elle n’est que de l’eau. Vous rentrez, fourbu{e}, sans rien de plus.',
        ko: 'Vous marchez des heures, et l’eau vous suit, sous les ponts, dans les égouts, dans les caniveaux. Vous rentrez fourbu{e}, et vous l’entendez encore dans les tuyaux de l’hôtel.' } });
    Pa.idee('*', { id: 'ip_medaille', kind: 'folie', idea: 'Acheter une médaille bénite à Saint-Sulpice', time: 60, cond: villeP, cout: 0.08,
      txt: 'Un marchand d’objets pieux de la rue Saint-Sulpice vous vend une médaille de saint Christophe, patron des voyageurs, avec un regard plein de compassion. Vous la serrez dans votre poche. Elle ne protège de rien, et vous le savez.' });
  }

  // =================================================================
  //  EN CONVERSATION : banalités et maladresses
  // =================================================================
  var FEM = { veuve: 1, atkins: 1, pike: 1, vane: 1, brevin: 1, rogniat: 1, arnoult: 1, veronique: 1, quitterie: 1, caterina: 1 };
  // une enfant : pas de menaces ni d'insultes à lui souffler
  var ENFANTS = /^(quitterie)$/;
  var MUETS = /^(morts|ravel|brule|stanley|alexis)$/;
  var POLICE = /^(fleming|rigby|planton|sergent|agentsj)$/;
  var BANAL = {
    prologue: [
      { label: 'Parler du temps qu’il fait', say: 'Quel temps de chien, cette nuit.', cult: 'brouillard' },
      { label: 'Parler du train', say: 'C’est un beau train, l’Orient-Express.', cult: 'train' },
      { label: 'Parler de la guerre', say: 'Vous étiez où, pendant la guerre ?', cult: 'guerre' },
      { label: 'Demander s’il a pu dormir', say: 'Vous avez pu dormir un peu ?', cult: 'sommeil' }
    ],
    londres: [
      { label: 'Parler du brouillard', say: 'Quel brouillard, on n’y voit pas à dix pas.', cult: 'brouillard' },
      { label: 'Parler du tombeau de Toutankhamon', say: 'Vous avez lu ce qu’on a trouvé dans le tombeau de Toutankhamon ?', cult: 'egypte' },
      { label: 'Parler de sport', say: 'Vous suivez le sport ?', cult: 'sport' },
      { label: 'Parler de la TSF', say: 'Vous avez déjà écouté la TSF, la BBC ?', cult: 'tsf' },
      { label: 'Parler de la vie chère', say: 'Tout est si cher, en ce moment.', cult: 'argent' },
      { label: 'Parler du spiritisme', say: 'Vous croyez au spiritisme, vous ?', cult: 'spiritisme' }
    ],
    paris: [
      { label: 'Parler de la pluie', say: 'Quel temps, il pleut depuis des jours.', cult: 'brouillard' },
      { label: 'Parler de la Ruhr', say: 'Et la Ruhr, qu’est-ce que vous en pensez ?', cult: 'ruhr' },
      { label: 'Parler de Paris', say: 'Paris est une ville magnifique.', cult: 'paris' },
      { label: 'Parler du cinéma', say: 'Vous allez au cinéma, de temps en temps ?', cult: 'cinema' },
      { label: 'Parler des Russes de Paris', say: 'On dit qu’il y a beaucoup de Russes à Paris.', cult: 'russie' },
      { label: 'Parler de la vie chère', say: 'Tout est hors de prix, en ce moment.', cult: 'argent' }
    ]
  };
  function generiques(ch, npc) {
    if (ENFANTS.test(npc.id)) return [];
    var f = FEM[npc.id], l = [
      { label: f ? 'La traiter de menteuse' : 'Le traiter de menteur', say: f ? 'Vous êtes une menteuse.' : 'Vous êtes un menteur.' },
      { label: f ? 'La menacer' : 'Le menacer', say: 'Parlez, ou je vais vous casser la figure.' }
    ];
    if (!POLICE.test(npc.id)) l.push({ label: 'S’impatienter', say: f ? 'Vous me faites perdre mon temps, espèce d’incapable.' : 'Vous me faites perdre mon temps, espèce d’incapable.' });
    return l;
  }
  // les maladresses propres à certains personnages : le joueur dit « dit », et la scène en tire les conséquences
  function froisse(api, n, ligne, minutes, partir) {
    api.npc(n.id, ligne);
    vexer(api, n.id, minutes);
    if (partir) api.endTalk(false);
  }
  var PROPRES = {
    prologue: {
      serveur: [{ label: 'Lui reprocher la lenteur du service', mal: 'service', dit: 'Le service est d’une lenteur, dans ce train.',
        run: function (api, n) { froisse(api, n, 'Bastien se raidit. « Je suis seul pour tout le wagon, {m}. » Il s’éloigne vers l’office, très droit, et ne revient pas tout de suite.', 15, true); } }],
      veuve: [{ label: 'Lui dire que le tarot est une superstition', mal: 'tarot', dit: 'Vous croyez vraiment à ces cartes ? C’est de la superstition.',
        run: function (api, n) { froisse(api, n, 'Mme Vasseur retourne une carte, sans vous regarder. « La Tour. » Elle range son jeu. « Bonsoir, {m}. »', 20, true); } }],
      conducteur: [{ label: 'Le menacer de le signaler à la Compagnie', mal: 'compagnie', dit: 'Je vais signaler à la Compagnie que vous dormez pendant votre service.',
        run: function (api, n) { froisse(api, n, 'Paolo se lève d’un bond, la casquette de travers. « Signalez, signalez. » Il ne vous dira plus rien de lui-même.', 15, false); } }]
    },
    londres: {
      smith: [{ label: 'Lui demander s’il n’est pas trop vieux pour voyager', mal: 'age', dit: 'À votre âge, professeur, est-ce bien raisonnable de courir l’Europe ?',
        run: function (api, n) { froisse(api, n, 'Smith vous dévisage par-dessus ses lunettes. « À mon âge, on sait ce qu’on cherche. C’est un avantage que la jeunesse n’a pas. » Il se tourne vers quelqu’un d’autre.', 30, true); } }],
      beddows: [{ label: 'Lui demander combien le professeur le paie', mal: 'gages', dit: 'Il vous paie bien, le professeur, pour une telle dévotion ?',
        run: function (api, n) { froisse(api, n, 'Beddows blêmit. « Je sers le professeur depuis vingt-deux ans, {m}. » Il ne vous adressera plus la parole de la journée.', 600, true); } }],
      fleming: [{ label: 'Lui dire que Scotland Yard est dépassé', mal: 'yard', dit: 'Franchement, inspecteur, Scotland Yard est dépassé par cette affaire.',
        run: function (api, n) { froisse(api, n, 'Fleming referme son carnet, sans hâte. « Merci de votre avis. Sergent, raccompagnez-{le} jusqu’à la porte. Et ne {le} laissez pas remonter avant demain. »', J, true); } }],
      rigby: [{ label: 'Lui demander s’il a déjà vu un vrai incendie', mal: 'incendie', dit: 'Vous avez déjà vu un vrai incendie, sergent, ou seulement des rapports ?',
        run: function (api, n) { froisse(api, n, 'Rigby pose sa pipe. « Silvertown, 1917. Soixante-treize morts. J’ai sorti les enfants. » Il ne dit plus rien, et vous comprenez qu’il ne dira plus rien.', 240, true); } }],
      mustapha: [{ label: 'Lui parler de Gallipoli', mal: 'gallipoli', dit: 'Vous étiez à Gallipoli, vous aussi ? Quelle boucherie, de votre côté.',
        run: function (api, n) { froisse(api, n, 'L’attaché se lève. « Mon frère y est mort, de notre côté, comme vous dites. » Il vous tend la main, très correct. L’entretien est terminé.', J, true); } }],
      atkins: [{ label: 'Lui reprocher de faire payer la visite', mal: 'sixpence', dit: 'Six pence pour voir où un homme est mort, vous n’avez pas honte ?',
        run: function (api, n) { froisse(api, n, 'Mrs Atkins croise les bras. « La honte, ça ne paie pas le charbon. Et le loyer de cette chambre, qui me le paiera, maintenant ? » Elle ne vous aime plus.', 120, false); } }],
      butter: [{ label: 'Dire que sa maquette n’est qu’un jouet', mal: 'jouet', dit: 'Ce n’est qu’un jouet, votre train, monsieur Butter.',
        run: function (api, n) { froisse(api, n, 'Arthur Butter devient écarlate. « Un jouet. Trente ans de ma vie. Un jouet. » Il vous montre la porte, et sa main tremble.', 120, true); } }],
      vane: [{ label: 'Lui dire en face que c’est une escroquerie', mal: 'escroquerie', dit: 'Vos séances sont une escroquerie, madame, et vous le savez.',
        run: function (api, n) { froisse(api, n, 'Mrs Vane ne cesse pas de sourire. « Les esprits pardonnent beaucoup, très cher. Moi, moins. » Elle agite une clochette ; la bonne vous raccompagne.', J, true); } }],
      pike: [{ label: 'Lui demander depuis combien de temps elle est là', mal: 'age', dit: 'Vous devez être ici depuis la reine Victoria, non ?',
        run: function (api, n) { froisse(api, n, 'Mrs Pike pince les lèvres. « Depuis le jubilé de diamant, {m}. Et je compte bien vous survivre. » Elle retourne à ses registres, et vous n’existez plus.', 180, true); } }],
      patron: [{ label: 'Insinuer que sa bière est coupée d’eau', mal: 'biere', dit: 'Elle est coupée d’eau, votre bière, non ?',
        run: function (api, n) { froisse(api, n, 'Le patron pose son torchon. Le pub entier se tait. « Dehors. » Vous sortez, sous les rires.', J, true); } }],
      hollis: [{ label: 'Lui demander s’il croit vraiment en Dieu', mal: 'dieu', dit: 'Entre nous, révérend, vous y croyez encore, vous, à tout ça ?',
        run: function (api, n) { froisse(api, n, 'Le révérend vous regarde longtemps. « Tous les matins, je me pose la question. Et tous les matins, je réponds oui. Vous devriez essayer. » Il retourne à ses recueils.', 60, true); } }],
      concierge: [{ label: 'Lui reprocher le bruit de la nuit', mal: 'bruit', dit: 'On n’a pas fermé l’œil de la nuit, dans votre hôtel.',
        run: function (api, n) { froisse(api, n, 'Mr Pratt s’incline très bas. « Je ferai remonter une plainte à la direction, {m}. » Il ne fera rien du tout, et il vous sourira désormais d’un sourire glacé.', 0, false); } }]
    },
    paris: {
      gerant: [{ label: 'Lui demander une chambre moins chère', mal: 'prix', dit: 'Vous n’auriez pas une chambre moins chère ?',
        run: function (api, n) { froisse(api, n, 'M. Blain consulte son registre avec une lenteur ostentatoire. « Sous les toits, il y a la chambre de la bonne, {m}. Mais la bonne y est. »', 0, false); } }],
      gaudry: [{ label: 'Lui rappeler qui vous êtes', mal: 'rang', dit: 'Savez-vous à qui vous parlez ? Je ne suis pas n’importe qui.',
        run: function (api, n) { froisse(api, n, 'M. Gaudry lève les yeux, enfin. « Un lecteur, {m}. Comme les trois cent quarante autres. Asseyez-vous, je vous appellerai. » Il vous appelle une heure plus tard.', 0, false); api.time(60); } }],
      remi: [{ label: 'Se moquer de ses recherches', mal: 'moquer', dit: 'Vous passez vos journées sur des grimoires, à votre âge ?',
        run: function (api, n) { froisse(api, n, 'L’étudiant roux rougit jusqu’aux oreilles. « C’est ma thèse, {m}. » Il replonge dans son livre et ne relève plus la tête.', 240, true); } }],
      brevin: [{ label: 'Lui demander si elle est mariée', mal: 'mariee', dit: 'Une femme comme vous, mademoiselle, vous n’êtes pas mariée ?',
        run: function (api, n) { froisse(api, n, 'Mlle Brévin vous regarde comme une reliure mangée aux vers. « Je suis archiviste, {m}. » Elle tourne les talons.', 180, true); } }],
      rogniat: [{ label: 'Lui demander si elle couvre le directeur', mal: 'couvre', dit: 'Vous couvrez le docteur Leroux, n’est-ce pas ?',
        run: function (api, n) { froisse(api, n, 'Mme Rogniat pose les deux mains à plat sur son bureau. « Je couvre ce bureau, {m}. Personne n’y touche. » Elle ne vous quittera plus des yeux, ni les caisses.', 240, true); } }],
      leroux: [{ label: 'L’accuser d’avoir tué Delplace', mal: 'accuser', dit: 'C’est vous qui avez tué le docteur Delplace, n’est-ce pas ?',
        run: function (api, n) {
          api.npc('leroux', 'Le pince-nez saute. « Sortez. Sortez, ou je vous fais sortir par les infirmiers, et la police avec ! »');
          api.flag('lerouxChasse', true); api.npcs('leroux').closedUntil = api.s.min + 100000; api.endTalk(false);
          api.say('Deux hommes en blouse vous raccompagnent jusqu’à la grille. Vous n’entrerez plus dans ce bureau. Il reste ceux qui travaillent ici, et qui sortent le soir.');
        } }],
      mandrin: [{ label: 'Le menacer de le dénoncer à Leroux', mal: 'denoncer', dit: 'Si vous ne parlez pas, je dirai à Leroux que vous m’avez parlé.',
        run: function (api, n) { froisse(api, n, 'Mandrin blêmit, puis ricane. « Vous lui direz quoi ? Que j’ai bu un coup ? » Il se ressert, sans vous en proposer. « Ça va vous coûter une autre bouteille, de me reparler. »', 0, false); api.pay(Math.min(0.05, api.s.money)); } }]
      ,fauvel: [{ label: 'Lui dire que son règlement est ridicule', mal: 'reglement', dit: 'Votre règlement est ridicule. On n’est pas à la préfecture, ici.',
        run: function (api, n) { froisse(api, n, 'M. Fauvel repose sa plume avec une douceur inquiétante. « Ici, c’est moi, la préfecture. » Il rouvre son registre et ne vous voit plus.', 240, true); api.flag('fauvelNon', day(api.s.min)); } }],
      thibierge: [{ label: 'Lui dire que la religion est une superstition', mal: 'superstition', dit: 'Tout ça, les fonts, les reliques, c’est de la superstition, mon père.',
        run: function (api, n) { froisse(api, n, 'L’abbé Thibierge sourit, sans se fâcher. « Sans doute. Et c’est vous qui êtes venu me demander où dorment les morts. » Il retourne à sa sacristie.', 60, true); } }],
      arnoult: [{ label: 'Se plaindre de la soupe', mal: 'soupe', dit: 'Votre soupe est infecte, madame.',
        run: function (api, n) { froisse(api, n, 'Mme Arnoult pose les poings sur les hanches. « Elle nourrit trois rouliers et un curé depuis vingt ans, ma soupe. Allez manger à Paris. »', 120, true); } }],
      lorien: [{ label: 'Lui dire qu’il est un piètre médecin', mal: 'medecin', dit: 'Un médecin qui ne sait pas soigner sa propre famille, c’est un piètre médecin.',
        run: function (api, n) { froisse(api, n, 'Christian Lorien pâlit. Il ouvre la porte de la cuisine et attend, sans un mot, que vous passiez devant lui.', 600, true); } }],
      quitterie: [{ label: 'Lui dire que les monstres n’existent pas', mal: 'monstres', dit: 'Les monstres, ça n’existe pas, tu sais.',
        run: function (api, n) { api.npc('quitterie', 'Elle vous regarde longtemps, très sérieuse, comme on regarde quelqu’un qui ment pour être gentil. Puis elle retourne à sa poupée.'); } }],
      caterina: [{ label: 'Lui dire que l’opéra vous ennuie', mal: 'ennui', dit: 'L’opéra, franchement, ça m’ennuie.',
        run: function (api, n) { froisse(api, n, 'Caterina éclate de rire, un rire de scène, très beau et très froid. « Alors vous êtes dans le mauvais wagon, caro. » Elle se tourne vers quelqu’un d’autre.', 120, true); } }]
    }
  };
  // quelques avis propres, là où la culture du temps sonnerait faux dans leur bouche
  function avis(ch, id, k, l) { var f = CH[ch] && CH[ch].fiches && CH[ch].fiches[id]; if (!f) return; f.avis = f.avis || {}; if (!f.avis[k]) f.avis[k] = l; }
  avis('prologue', 'veuve', 'train', ['« Je le prends tous les mois, jeune homme, depuis vingt ans. Il a changé. Moi aussi. Tous les deux en mal. »']);
  avis('londres', 'vane', 'spiritisme', ['« Si j’y crois ? » Elle rit, d’un rire de gorge. « Très {cher}, ils sont ici même. Ils vous écoutent. L’un d’eux trouve votre chapeau épouvantable. »']);
  avis('londres', 'hollis', 'spiritisme', ['« Les tables tournantes ? » Il soupire. « Des veuves qui paient pour entendre leurs morts leur dire qu’ils vont bien. L’Église leur offre la même chose, gratuitement, et on la trouve ennuyeuse. »']);
  avis('londres', 'mustapha', 'sport', ['« Le cricket ? Je l’ai vu jouer à Lord’s. Cinq jours pour un match nul. Les Anglais appellent cela du suspense. »']);
  avis('londres', 'pike', 'sport', ['« Le sport ? Je classe les résultats depuis 1887, {m}. Je n’en ai jamais regardé un seul. »']);
  avis('londres', 'hollis', 'sport', ['« Le cricket, voyez-vous, est la seule liturgie que mes paroissiens suivent sans s’endormir. »']);
  Object.keys(BANAL).forEach(function (ch) {
    var sc = CH[ch]; if (!sc) return;
    sc.paroles = function (api, npc) {
      if (!npc || MUETS.test(npc.id)) return { banal: [], maladresse: [] };
      return { banal: sc.fiches && sc.fiches[npc.id] ? BANAL[ch].slice() : [], maladresse: generiques(ch, npc).concat((PROPRES[ch] || {})[npc.id] || []) };
    };
  });
})(typeof window !== 'undefined' ? window : globalThis);
