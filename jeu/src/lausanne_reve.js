/* Chapitre 3 — Lausanne, en songe : la ville du Prince, ses présages, et le procès d'Edgar Wellington.
   On y entre en buvant la fiole verte (là où l'on s'endort) ou en ouvrant la porte sculptée de la rue du Pré.
   Le procès est une scène de parole : trois accusations, et la défense que le joueur écrit lui-même. */
(function (G) {
  'use strict';
  var P = G.CHAPTERS && G.CHAPTERS.lausanne, L = G.CHAPTERS && G.CHAPTERS.londres;
  if (!P || !P._h || !L || !L._h) return;
  var X = P._h, H = L._h, T = H.T, D = 1440;
  var day = X.day, hour = X.hour;
  function mn(api) { return api.s.min % D; }
  var FIOLE = X.FIOLE, ROULEAU = X.ROULEAU, TRAD = X.TRAD, FAUX = X.FAUX;
  function reve(api) { return /^re_/.test(api.s.loc); }
  function origine(api) { return api.flag('reve') || 'ville'; }
  function etape(api) { return api.flag('proces') || null; }
  function procesEnCours(api) { var e = etape(api); return !!e && e !== 'fini'; }

  // ================================================================ entrer dans le rêve
  P.boireFiole = function (api) {
    if (api.flag('reveFait')) {
      api.say('Vous buvez ce qui reste de la fiole. Le même goût de flaque. Vous dormez une heure, d’un sommeil lourd et sans images, et vous vous réveillez la bouche sèche. La porte de l’autre ville s’est refermée.');
      api.drop(FIOLE); api.time(60); return;
    }
    if (api.s.talk) api.endTalk(false);
    var o = /^tr_/.test(api.s.loc) ? 'train' : api.s.loc === 'la_etage' || api.s.loc === 'la_boutique' ? 'boutique' : 'ville';
    api.flag('reve', o); api.flag('reveFait', true); api.flag('reveDebut', api.s.min); api.flag('reveLieu', api.s.loc); api.flag('reveTours', 0);
    if (!api.has('JOURNALE')) api.say('Vous ne savez pas ce que c’est, et c’est peut-être pour cela que vous le faites.');
    api.say('Une gorgée. Ça a le goût de l’eau de pluie qui a croupi dans une gouttière. « C’est affreux », dites-vous, et vous souriez, parce que tout est soudain très calme, très doux, et qu’il n’y a plus aucune raison de s’inquiéter. Le monde s’incline lentement sur le côté.');
    api.fx('blackout');
    if (o === 'train') {
      api.say('Vous vous réveillez dans votre compartiment, à la même place. La lampe est éteinte, le store baissé. Sur ses bords, une lumière blanche et dure filtre, qui ne ressemble à aucun jour. Le train roule, très lentement.');
      api.go('re_train', true);
    } else if (o === 'boutique') {
      api.say('Vous vous réveillez à l’étage des Wellington. Ce n’est pas l’étage des Wellington. Les murs sont de pierre nue ; l’escalier, de bois brut, descend vers une lueur de torches.');
      api.go('re_boutique', true); P.locations.re_boutique.enter(api, !api.s.visited.re_boutique);
    } else {
      api.say('Vous vous réveillez là où vous vous êtes endormi{e}. Ce n’est plus tout à fait là. Les murs sont de pierre nue, le plafond plus bas, et une torche brûle dans un anneau de fer, à la place de la lampe.');
      api.go('re_chambre', true);
    }
    api.clue('REVE');
  };
  // la porte sculptée de la rue du Pré : on passe en chair et en os, et l'on reviendra par elle
  P.porteReve = function (api) {
    if (api.flag('reveFait') && api.flag('reve') !== 'porte') { api.say('La porte ne s’ouvre plus. Le bois est froid, maintenant, et muet.'); return; }
    api.flag('reve', 'porte'); api.flag('reveFait', true); api.flag('reveDebut', api.s.min); api.flag('reveTours', 0);
    api.say('La serrure n’a pas de clé, et la porte s’ouvre quand même, sous votre main, comme si elle n’avait attendu que cela. Vous passez. Quelque chose vous traverse au passage, une fatigue énorme, comme si l’on vous avait pris une partie de vos forces.');
    api.say('De l’autre côté, la même pièce vide, la même chaise longue, la même poussière. La porte s’est ouverte sur elle-même. Vous n’êtes allé{e} nulle part. Puis vous regardez par la fente d’un volet, et la rue n’est plus la rue.');
    api.lose(1);
    api.go('re_pre', true);
    api.clue('REVE');
  };
  Object.assign(P.clues, {
    REVE: { title: 'L’autre Lausanne', text: 'Une Lausanne de cauchemar, sous un ciel violet de crépuscule éternel. Les gens sont vêtus comme sur les vitraux, et trop pressés pour vous répondre. Des gibets aux carrefours. On y comprend toutes les langues, et l’on n’en reconnaît aucune.' },
    PRINCE: { title: 'Le Prince', text: 'Dans la Lausanne du rêve, le duc des Esseintes règne en prince. Sous sa robe, son corps est fait de morceaux de peau cousus. Il a fait juger Edgar Wellington sur la place de la Palud, pour avoir caché le rouleau.' },
    PRESAGES: { title: 'Ce que la ville a montré', text: 'Un vent glacé sorti d’une fente, une procession de masques en larmes, une rue sans ombres semée d’ail, une vieille et son chaudron, un magicien qui perd ses membres dans un chapeau, une partie d’échecs au couteau, une statue de fil qui chante. Des choses qui ne sont pas encore arrivées.' }
  });

  // ================================================================ les présages : ce que la ville montre en chemin
  var VISIONS = [
    { id: 'bora', x: 'Une crevasse fend le milieu d’une rue vide, d’un trottoir à l’autre. Il en sort un vent glacé, qui gémit en remontant la pente, si fort que vous ne pouvez pas faire un pas de plus. Les volets claquent tous ensemble. Vous rebroussez chemin, les larmes gelées au coin des yeux.' },
    { id: 'procession', x: 'Une procession passe, masquée et encapuchonnée : la Mort, un Ange, un Soldat, un Lion, un Turc, un Assassin, une Paysanne et son Paysan. Ce sont des flagellants. Ils pleurent des larmes de sang par des yeux de porcelaine bleue, sans expression, et chantent en latin dans une odeur d’encens. Des cloches, au loin, de plus en plus fort. Au plus fort des cloches, le Lion déploie des ailes et s’envole ; le Soldat s’élance à sa poursuite. Leurs larmes vous tombent dessus, et elles brûlent.', check: 'hist_lion' },
    { id: 'ail', x: 'Une rue jonchée de fleurs et de bulbes à l’odeur forte et propre : de l’ail, partout, tressé aux fenêtres, écrasé sur les pavés. Les passants ne s’y attardent pas. Quelque chose cloche dans la lumière de cette rue, et vous mettez un moment à comprendre quoi.', check: 'toc_ombres' },
    { id: 'chaudron', x: 'Une vieille femme remue un énorme chaudron noir, sur un feu de charbon. Elle vous sourit de ses trois dents et vous offre à dîner. Vous vous penchez. Le chaudron est plein de membres humains, écorchés, qui remuent encore, dans une vapeur légère.', check: 'san_chaudron' },
    { id: 'magicien', x: 'Un bateleur, sur une place, montre un chapeau vide à la foule. Il y glisse son bras droit, et le chapeau le prend : le bras n’est plus là. Puis le gauche. Puis la jambe droite, la jambe gauche. Il s’effondre sur le pavé, riant aux larmes, et demande quelqu’un dans l’assistance pour aller rechercher ses membres dans le chapeau. Personne ne bouge. Le chapeau, retourné, est vide.' },
    { id: 'echecs', x: 'À un carrefour étrangement silencieux, un échiquier géant est serti dans les pavés. De chaque côté, une statue immobile : l’une noire, l’autre blanche, sans visage et sans sexe. Ce sont les joueurs. Les pièces sont des gens, et chacun tient un couteau. La partie commence. Quand une pièce en prend une autre, elle lui tranche la gorge.', check: 'san_echecs' },
    { id: 'fil', x: 'Au milieu d’une place déserte, une autre statue, deux fois plus haute qu’un homme, faite de fil de fer tressé en forme humaine. Des chiffons pendent aux barbelés. De près, ce ne sont pas des chiffons : ce sont des lambeaux de chair, pris aux crochets. Et de la tête sort le chant le plus pur que vous ayez jamais entendu, une voix d’ange d’une clarté parfaite.', check: 'san_fil' }
  ];
  Object.assign(P.checks, {
    hist_lion: { skill: 'Histoire', why: 'reconnaître le lion ailé',
      resolve: function (api, r) { api.say(r.success ? 'Un lion ailé. C’est l’emblème de Venise, la ville qui s’est rendue à un soldat, à Bonaparte, en 1797. Pourquoi Venise, ici ?' : 'Un lion ailé, un soldat. Cela vous dit quelque chose, et la chose s’en va.'); } },
    toc_ombres: { skill: 'Trouver Objet Caché', why: 'voir ce qui cloche',
      resolve: function (api, r) { api.say(r.success ? 'Il n’y a pas d’ombres dans cette rue. Ni sous les passants, ni sous les auvents, ni sous vous. Une rue entière où rien ne fait d’ombre, et de l’ail à toutes les fenêtres.' : 'La lumière est étrange, voilà tout. Vous passez.'); } },
    san_chaudron: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'reculer devant le chaudron',
      resolve: function (api, r) { api.say(r.success ? 'Vous déclinez poliment. La vieille hausse les épaules et sert quelqu’un d’autre.' : 'Vous reculez si vite que vous tombez. La vieille rit, et rit, et touille.'); } },
    san_echecs: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'regarder la partie jusqu’au bout',
      resolve: function (api, r) {
        api.say('La partie s’accélère jusqu’à une vitesse que l’œil ne suit plus. Bientôt l’échiquier est jonché de corps. Les noirs gagnent. Au dernier coup, la statue blanche se fend avec un craquement sec et tombe en morceaux ; la statue noire tourne la tête, dans un grincement de meule, et vous regarde.');
        api.say(r.success ? 'Vous soutenez son regard, ou ce qui en tient lieu. Puis vous partez, sans courir.' : 'Vous partez en courant, et vous entendez longtemps la meule tourner derrière vous.');
      } },
    san_fil: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d3'], why: 'rester devant la statue qui chante',
      resolve: function (api, r) { api.say(r.success ? 'Vous vous arrachez au chant avant que votre cœur ne se brise. Vous pleurez en vous éloignant, et vous ne savez pas sur quoi.' : 'Vous fuyez la place en pleurant, comme tous ceux qui l’ont entendue avant vous, avant que votre cœur ne se brise. Il s’est fendu un peu, quand même.'); } },
    san_peau: { skill: 'SAN', label: 'Santé mentale', loss: ['2', '1d6+1'], why: 'regarder ce que la foule apporte',
      resolve: function (api, r) { api.say(r.success ? 'Vous regardez. Vous vous obligez à regarder, parce qu’il faudra plaider devant ça.' : 'Vous ne regardez plus. Vous entendez seulement le bruit mouillé de la peau qu’on pose sur le bronze, et ce bruit-là, vous l’entendrez encore dans des années.'); } },
    psy_prince: { skill: 'Psychologie', why: 'lire le visage du Prince',
      resolve: function (api, r) { api.say(r.success ? 'Il sourit, mais une veine bat à sa tempe. Il est furieux qu’on se mette en travers de sa justice. Il ne s’y attendait pas.' : 'Il sourit, l’air de s’en moquer complètement.'); } },
    pr_persuasion: { skill: 'Persuasion', why: 'emporter la conviction du juge',
      resolve: function (api, r) { if (r.success) { api.flag('procesScore', (api.flag('procesScore') || 0) + 1); api.say('Votre voix porte. Pendant une seconde, la place entière se tait pour vous écouter, et la statue, il vous semble, respire moins fort.'); } else api.say('Vos mots vous semblent tomber dans la foule comme des pierres dans un puits.'); repliquePrince(api); } }
  });
  function vision(api) {
    var vus = api.flag('visions') || [], reste = VISIONS.filter(function (v) { return vus.indexOf(v.id) < 0; });
    if (!reste.length) { api.say(api.fresh('villeVide', ['La ville n’a plus rien à vous montrer. Elle vous laisse passer, indifférente, comme on laisse passer un chien.', 'Des rues, encore des rues, et des gens trop pressés.'])); return false; }
    var v = reste[Math.floor(api.rand() * reste.length)];
    vus = vus.concat([v.id]); api.flag('visions', vus);
    api.say(v.x);
    if (vus.length >= 3) api.clue('PRESAGES');
    if (v.check) api.check(v.check);
    return true;
  }

  // ================================================================ les lieux du rêve
  function lookAct(id, texts) { return { id: id, label: 'Regarder autour de vous', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE'], bare: true, run: function (api) { api.say(api.fresh(id, typeof texts === 'function' ? texts(api) : texts)); } }; }
  Object.assign(P.locations, {
    re_train: { name: 'Le train aux stores baissés', art: 're_train',
      enter: function () {},
      things: [{ label: 'les stores baissés', ids: ['FENETRE', 'STORES'] }, { label: 'la porte clouée', ids: ['PORTECLOUEE', 'PORTE'] }, { label: null, ids: ['SALLE', 'COMPARTIMENT', 'TRAIN', 'COULOIR'] }],
      ambient: ['Le train roule au pas, sans un bruit de roues.', 'La lumière blanche bouge sur les bords des stores, comme une eau.'],
      actions: [
        lookAct('rt_look', ['Le couloir. Tous les stores sont baissés, tout du long. Toutes les portes des compartiments sont ouvertes, et vides, sauf une.', 'Le velours, le cuivre, la marqueterie : tout est là, et tout a l’air plus ancien, comme une photographie du train.']),
        { id: 'rt_store', label: 'Lever le store', verbs: ['OUVRIR', 'PRENDRE', 'EXAMINER'], nouns: ['FENETRE', 'STORES'],
          run: function (api) { api.say('Vous tirez, vous poussez, vous forcez. Le store ne bouge pas d’un millimètre. La lumière, sur ses bords, a l’air de rire.'); } },
        { id: 'rt_porte', label: 'S’approcher de la porte clouée', idea: true, verbs: ['EXAMINER', 'OUVRIR', 'FRAPPER', 'ECOUTER', 'SENTIR'], nouns: ['PORTECLOUEE', 'PORTE'],
          run: function (api) { api.flag('porteClouee', true); api.say('Une porte de compartiment condamnée par des planches, clouées en croix, avec de gros clous de charpentier. Il en sort une odeur de viande pourrie, épaisse, sucrée. Vous posez la main sur une planche : rien ne bouge, rien ne cède. Et, au moment où vous la touchez, le train s’arrête.'); api.say('Au bout de la voiture, la porte s’ouvre d’elle-même, et une lumière éblouissante entre à flots.'); if (api.has('GUETTEUR') || ((X.passe(api) || {}).indices || []).indexOf('GUETTEUR') >= 0) api.say('Vous pensez, sans savoir pourquoi, à l’homme trop maigre sous le réverbère de la rue de Richelieu.'); } },
        { id: 'rt_sortir', label: 'Descendre du train', idea: true, verbs: ['ALLER', 'SORTIR', 'DESCENDRE'], nouns: ['PORTE', 'TRAIN'], bare: true,
          run: function (api) { if (!api.flag('porteClouee')) api.say('Le train s’arrête de lui-même. Au bout de la voiture, la porte s’ouvre, et une lumière éblouissante entre à flots.'); api.say('Vous descendez.'); api.go('re_plaine'); } }
      ] },
    re_plaine: { name: 'La plaine de cendre', art: 're_plaine',
      enter: function (api, first) {
        if (api.flag('proces') === 'fuite') return;
        if (first) api.say('Une plaine sans limite, de la couleur de la cendre, sous un ciel blanc qui éclaire de partout et de nulle part. L’air a un goût amer, métallique. On n’entend que son propre souffle. À une trentaine de mètres du train, debout toute seule au milieu de rien, une porte. Elle vous rappelle quelque chose. Elle est ouverte.');
      },
      things: [{ label: 'la porte, au milieu de la plaine', ids: ['PORTE'] }, { label: 'le train', ids: ['TRAIN'] }, { label: null, ids: ['SALLE', 'PLAINE'] }],
      ambient: ['La poussière se soulève à chaque pas, et vous fait éternuer à vous en faire mal.', 'Le silence est si complet qu’il bourdonne.'],
      actions: [
        lookAct('rp_look', ['De la cendre, à perte de vue. Pas un relief, pas une trace, sauf les vôtres, et celles, plus anciennes, de quelqu’un qui est passé par ici avant vous et n’est pas revenu.']),
        { id: 'rp_porte', label: 'Franchir la porte', idea: true, verbs: ['ALLER', 'OUVRIR', 'VISITER'], nouns: ['PORTE'], bare: true,
          cond: function (api) { return api.flag('proces') !== 'fuite'; },
          run: function (api) { api.say('Vous marchez vers la porte, dans la poussière qui pique. Vous la reconnaissez au dernier moment : la porte de derrière de la boutique Wellington. Vous la franchissez.'); api.go('re_boutique'); } },
        { id: 'rp_courir', label: 'Courir jusqu’au train', idea: true, verbs: ['ALLER', 'FUIR', 'SAUTER'], nouns: ['TRAIN'], bare: true,
          cond: function (api) { return api.flag('proces') === 'fuite'; },
          run: function (api) { P.finFuite(api); } },
        { id: 'rp_train', label: 'Remonter dans le train', verbs: ['ALLER', 'PRENDRE'], nouns: ['TRAIN', 'COMPARTIMENT'],
          cond: function (api) { return api.flag('proces') !== 'fuite'; },
          run: function (api) { api.say('Le train est là, immobile, toutes portes ouvertes. Vous y remontez. Rien ne se passe. Il ne repartira pas sans vous ; il ne repartira pas avec vous non plus, tant que vous n’aurez pas fait ce que vous êtes venu{e} faire.'); } }
      ] },
    re_chambre: { name: 'La même pièce, autrement', art: 're_chambre',
      enter: function () {},
      things: [{ label: 'la torche', ids: ['LAMPE'] }, { label: null, ids: ['SALLE', 'PORTE', 'FENETRE', 'CHAMBRE'] }],
      ambient: ['La torche crépite.', 'Dehors, des cloches, très loin.'],
      actions: [
        lookAct('rc_look', ['Les meubles sont là, mais taillés à la hache, comme des copies faites de mémoire par quelqu’un qui ne les aurait vus qu’une fois. Par la fenêtre, un ciel violet.']),
        { id: 'rc_sortir', label: 'Sortir dans la rue', idea: true, verbs: ['ALLER', 'SORTIR', 'OUVRIR'], nouns: ['PORTE', 'SALLE'], bare: true,
          run: function (api) { api.go('re_ville'); } }
      ] },
    re_boutique: { name: 'La boutique, dans l’autre ville', art: 're_boutique',
      enter: function (api, first) {
        if (api.flag('proces') === 'fuite') return;
        if (first) api.say('C’est la boutique Wellington, rassurante et familière, et ce n’est pas elle. Tout y est plus fruste : à la place de l’électricité, des torches brûlent dans des anneaux de fer. Les bêtes empaillées ont été si grossièrement préparées que beaucoup pourrissent sur leur socle ; il en tombe des touffes de poils. L’ours de l’escalier est là, plus grand que dans votre souvenir, les pattes levées.');
        else api.say(api.fresh('rbR', ['La boutique du rêve, ses torches, ses bêtes qui pourrissent.', 'L’ours vous attend au pied de l’escalier.']));
      },
      things: [{ label: 'l’ours de l’escalier', ids: ['OURS'] }, { label: 'l’escalier', ids: ['ESCALIER', 'ETAGE'] }, { label: 'la porte de la rue', ids: ['PORTE'] }, { label: null, ids: ['SALLE', 'BOUTIQUE', 'LAMPE', 'FENETRE'] }],
      ambient: ['Une torche siffle. Une goutte de graisse tombe.', 'Une tête de cerf perd un œil de verre, qui roule sur le plancher jusqu’à vos pieds.'],
      actions: [
        lookAct('rb_look', ['Un renard qui courtise une poule, comme en bas, mais le renard n’a plus de peau sur le museau. La chouette en robe de baptême a les yeux crevés. Ici, rien n’est drôle du tout.']),
        { id: 'rb_ours', label: 'Examiner l’ours', idea: true, ideaCond: function (api) { return !api.flag('oursOuvert'); }, verbs: ['EXAMINER', 'FOUILLER', 'OUVRIR', 'COUPER'], nouns: ['OURS'],
          run: function (api) { P.ours(api); } },
        { id: 'rb_monter', label: 'Monter à l’étage', verbs: ['ALLER', 'OUVRIR'], nouns: ['ESCALIER', 'ETAGE'],
          run: function (api) { api.say('En haut de l’escalier, la porte de l’étage est fermée. Pas à clé : elle ne bouge pas, voilà tout, comme une porte peinte sur un mur.'); } },
        { id: 'rb_rue', label: 'Sortir dans la rue', idea: true, verbs: ['ALLER', 'SORTIR', 'OUVRIR'], nouns: ['PORTE', 'SALLE'], bare: true,
          cond: function (api) { return api.flag('proces') !== 'fuite'; },
          run: function (api) { api.go('re_ville'); } },
        { id: 'rb_fuir', label: 'Fuir par la porte de derrière', idea: true, verbs: ['FUIR', 'ALLER', 'SORTIR'], nouns: ['PORTE', 'ATELIER'], bare: true,
          cond: function (api) { return api.flag('proces') === 'fuite' && !!api.flag('oursOuvert'); },
          run: function (api) { P.fuirArriere(api); } }
      ] },
    re_ville: { name: 'Lausanne, en songe', art: 're_ville',
      enter: function (api, first) {
        if (first) api.say('Dehors, tout est familier et tout est autre. Lausanne est devenue un cauchemar gothique d’elle-même. Les gens courent en tous sens, en costumes de vitraux, et ils ont toujours trop à faire pour vous parler. Le ciel est d’un violet profond, comme un crépuscule qui ne finirait jamais. À certains carrefours, des gibets ; à beaucoup d’entre eux, quelqu’un. Vous comprenez parfaitement ce qui est écrit sur les enseignes, et vous ne sauriez dire dans quelle langue.');
        else api.say(api.fresh('rvR', ['Les rues violettes, les gibets, les gens pressés.', 'L’autre Lausanne. Elle n’a pas bougé, et tout y a bougé.']));
      },
      things: [{ label: 'les passants', ids: ['FOULE', 'QUELQUUN'] }, { label: 'les gibets', ids: ['GIBET'] }, { label: null, ids: ['SALLE', 'CATHEDRALE', 'PALUD', 'BOUTIQUE', 'EDGAR'] }],
      ambient: ['Une charrette passe, chargée de quelque chose sous une bâche, et personne ne la regarde.', 'Un pendu tourne lentement au bout de sa corde, et vous suit des yeux.', 'Des cloches, partout, qui ne sonnent pas l’heure.'],
      actions: [
        lookAct('rv_look', ['La cathédrale est là-haut, mais elle a quatre tours au lieu d’une, et la quatrième penche. Les rues montent et descendent selon une logique qui n’est pas la vôtre.', 'Sur un mur, une affiche : le portrait d’un homme en robe, au visage poudré, au sourire bienveillant. « LE PRINCE VEILLE. »']),
        { id: 'rv_errer', label: 'Errer dans les rues', idea: true, verbs: ['ALLER', 'VISITER', 'MARCHER', 'EXAMINER'], nouns: ['SALLE', 'CATHEDRALE'], bare: true, repeatable: true,
          run: function (api) { P.errer(api); } },
        { id: 'rv_edgar', label: 'Chercher Edgar Wellington', idea: true, ideaCond: function (api) { return !api.flag('cloche'); }, verbs: ['FOUILLER', 'CHERCHER', 'APPELER', 'SONNER', 'ALLER'], nouns: ['EDGAR'], repeatable: true,
          run: function (api) { P.chercherEdgar(api); } },
        { id: 'rv_passants', label: 'Parler aux passants', verbs: ['PARLER', 'POLI', 'ARRETER'], nouns: ['FOULE', 'QUELQUUN'], repeatable: true,
          run: function (api) { api.say(api.fresh('passantsR', ['Une femme en hennin passe sans vous voir. Un moine vous écarte du coude. Un homme à collerette s’arrête, vous regarde, et repart, comme si vous étiez une question qu’on ne lui avait pas posée.', 'Ils ont tous trop à faire. Ils ont tous trop peur d’être en retard. En retard pour quoi ?'])); if (api.flag('meurtre') && !api.flag('cloche')) api.say('Vous attrapez enfin un garçon par la manche. Il se dégage, terrifié. « Lâchez-moi ! On juge l’étranger, ce soir, sur la Palud ! Le Prince veut tout le monde ! »'); } },
        { id: 'rv_boutique', label: 'Retourner à la boutique', verbs: ['ALLER', 'VISITER'], nouns: ['BOUTIQUE', 'OURS'], repeatable: true,
          cond: function (api) { return !procesEnCours(api) || api.flag('proces') === 'fuite'; },
          run: function (api) { api.say('Vous retrouvez la rue Saint-Étienne, plus étroite, plus tordue, et la boutique au fond de sa cour.'); api.go('re_boutique'); } },
        { id: 'rv_palud', label: 'Aller sur la place de la Palud', verbs: ['ALLER', 'VISITER'], nouns: ['PALUD'], repeatable: true,
          cond: function (api) { return !!api.flag('meurtre') && !api.flag('proces'); },
          run: function (api) { P.cloche(api); } },
        { id: 'rv_maison', label: 'Retourner à la maison de la rue du Pré', verbs: ['ALLER', 'VISITER'], nouns: ['MAISONDUC', 'PORTEREN'], repeatable: true,
          cond: function (api) { return api.flag('reve') === 'porte'; },
          run: function (api) { api.go('re_pre'); } }
      ] },
    re_pre: { name: 'La maison du Prince', art: 're_pre',
      enter: function (api, first) { if (!first) api.say('La maison vide, la chaise longue, la porte sculptée qui mène chez vous.'); },
      things: [{ label: 'la porte sculptée', ids: ['PORTEREN', 'PORTE'] }, { label: null, ids: ['SALLE', 'MAISONDUC'] }],
      ambient: ['Quelque part dans la maison, un rire d’homme, haut et bref. Il n’y a personne.'],
      actions: [
        lookAct('rpr_look', ['Les mêmes pièces vides. Mais ici, les murs sont tendus d’un cuir clair, très fin, cousu à petits points. Vous ne le touchez pas.']),
        { id: 'rpr_sortir', label: 'Sortir dans la rue', idea: true, verbs: ['ALLER', 'SORTIR'], nouns: ['SALLE', 'FENETRE'], bare: true,
          cond: function (api) { return api.flag('proces') !== 'fuite'; },
          run: function (api) { api.go('re_ville'); } },
        { id: 'rpr_porte', label: 'Repasser la porte sculptée', idea: true, verbs: ['OUVRIR', 'ALLER', 'FUIR'], nouns: ['PORTEREN', 'PORTE'], needVerb: true,
          run: function (api) { P.reveil(api, 'porte'); } }
      ] },
    re_palud: { name: 'La place de la Palud, en songe', art: 're_palud',
      enter: function () {},
      things: [{ label: 'l’estrade', ids: ['PROCES', 'TABLE'] }, { label: 'le Prince', ids: ['PRINCE', 'DUC'] }, { label: 'le juge de bronze', ids: ['GISANT', 'JUGE'] }, { label: 'Edgar, enchaîné', ids: ['EDGAR'] }, { label: 'la foule', ids: ['FOULE', 'QUELQUUN'] }, { label: null, ids: ['SALLE', 'PALUD'] }],
      ambient: ['La foule respire comme une seule bête.', 'Le juge de bronze siffle, asthmatique.', 'Quelqu’un, dans la foule, crache dans votre direction.'],
      actions: [
        lookAct('rpa_look', ['La place est pleine à craquer, jusqu’aux toits. Sur l’estrade, le Prince, le juge, Edgar. Tous les visages sont tournés vers vous, et aucun n’est bienveillant.']),
        { id: 'pr_defendre', label: 'Prendre la défense d’Edgar', idea: true, verbs: ['AIDER', 'PARLER', 'ALLER'], nouns: ['EDGAR', 'PROCES'], needVerb: true,
          cond: function (api) { return etape(api) === 'appel'; }, run: function (api) { volontaire(api); } },
        { id: 'pr_taire', label: 'Se taire', verbs: ['ATTENDRE'], nouns: [], needVerb: true,
          cond: function (api) { return etape(api) === 'appel' || /^c[123]$/.test(etape(api) || ''); },
          run: function (api) { if (etape(api) === 'appel') silence(api); else plaider(api, '', 0, true); } },
        { id: 'pr_psy', label: 'Observer le Prince', verbs: ['EXAMINER', 'PSY'], nouns: ['PRINCE', 'DUC'],
          cond: function (api) { return procesEnCours(api) && !api.flag('psyPrince') && etape(api) !== 'fuite'; },
          run: function (api) { api.flag('psyPrince', true); api.check('psy_prince'); } },
        { id: 'pr_edgar', label: 'Parler à Edgar', idea: true, verbs: ['PARLER', 'POLI', 'EXAMINER'], nouns: ['EDGAR'],
          cond: function (api) { return etape(api) === 'entretien'; }, run: function (api) { entretien(api); } },
        { id: 'pr_commencer', label: 'Commencer le procès', idea: true, verbs: ['ATTENDRE'], nouns: ['PROCES'], needVerb: true,
          cond: function (api) { return etape(api) === 'entretien'; }, run: function (api) { accusation(api, 1); } },
        { id: 'pr_courir', label: 'Courir à la boutique', idea: true, verbs: ['FUIR', 'ALLER', 'SUIVRE'], nouns: ['BOUTIQUE', 'EDGAR'], bare: true,
          cond: function (api) { return etape(api) === 'fuite'; }, run: function (api) { P.courirBoutique(api); } }
      ] }
  });

  // ---------------------------------------------------------------- errer, chercher, la cloche
  P.errer = function (api) {
    var n = (api.flag('errances') || 0) + 1; api.flag('errances', n); api.time(20);
    // Edgar est là-bas : à la troisième errance, la cloche sonne pour son procès
    if (api.flag('meurtre') && !api.flag('proces') && n >= 3) { P.cloche(api); return; }
    var montre = vision(api);
    if (api.s.pending) return;
    if (!api.flag('meurtre') && (n >= 6 || !montre) && api.flag('reve') !== 'porte') { P.reveil(api, 'sommeil'); }
  };
  P.chercherEdgar = function (api) {
    api.time(20);
    if (!api.flag('meurtre')) { api.say('Vous l’appelez par son nom, dans des rues qui ne répondent pas. Edgar n’est pas là. Peut-être n’est-il pas encore venu. Peut-être ne vient-il qu’en dormant.'); if (api.flag('reve') !== 'porte' && (api.flag('errances') || 0) >= 3) P.reveil(api, 'sommeil'); return; }
    var n = (api.flag('cherche') || 0) + 1; api.flag('cherche', n);
    if (n === 1) { api.say('Vous l’appelez, vous décrivez à des visages qui se détournent un Anglais chauve, aux yeux cernés. Une marchande d’oublies vous regarde enfin. Elle fait le signe de croix, et désigne le bas de la ville, la Palud. « L’étranger ? On l’a pris cette nuit. Le Prince va le juger. »'); return; }
    P.cloche(api);
  };
  P.cloche = function (api) {
    if (api.flag('cloche')) { if (!api.flag('proces')) ouverture(api); return; }
    api.flag('cloche', true);
    if (api.s.pending) return;
    api.say('Une cloche se met à sonner au centre de la ville. Une seule, lente, grave. Tout le monde s’arrête. Puis tout le monde se met à courir dans la même direction, et le flot vous emporte, de rue en rue, jusqu’à la place de la Palud, qu’il remplit jusqu’aux toits.');
    ouverture(api);
  };

  // ================================================================ le procès
  function ouverture(api) {
    api.flag('proces', 'appel'); api.flag('procesScore', 0); api.flag('appelN', 0);
    api.go('re_palud', true);
    api.say('Au milieu de la place, une grande estrade de bois. Trois figures s’y tiennent. Une statue de bronze : le chevalier de la cathédrale, debout, ses avant-bras sans mains le long du corps. Une silhouette encapuchonnée, en robe. Et Edgar Wellington, les mains liées de chaînes.');
    api.say('La silhouette lève les bras. La foule se tait d’un coup. Une voix d’homme s’élève, et vous la reconnaissez avant d’avoir compris les mots.');
    api.npc('prince', '« Devant nous se tient un homme accusé de crimes graves. En nous refusant ce qui nous est dû, il s’est fait notre ennemi ; aussi doit-il être jugé devant nous. »');
    api.say('La silhouette rejette son capuchon. C’est le duc des Esseintes. Le visage est le même, poudré, aimable, parfait. Mais le cou, sous la robe entrouverte, est fait de morceaux de peau de couleurs différentes, cousus ensemble à grands points boursouflés, comme un patchwork.');
    api.npc('prince', '« En ma qualité de Prince et de protecteur de ce royaume, je me désigne représentant judiciaire du peuple de Lausanne. » Il glousse. « Et je veillerai à ce que ce coquin ait ce qu’il mérite. »');
    api.say('La foule devient folle. Elle acclame le Prince, elle maudit Wellington, elle trépigne. Le Prince la laisse faire, puis l’arrête d’un doigt.');
    api.npc('prince', '« Quelqu’un veut-il prendre la défense du criminel ? »');
    api.say('Un silence de mort tombe sur la place.');
    api.clue('PRINCE');
    api.sys('C’est à vous. Dites si vous défendez Edgar (« je le défends »), ou taisez-vous.');
    api.chips([{ label: 'Prendre la défense d’Edgar', action: 'pr_defendre' }, { label: 'Se taire', action: 'pr_taire' }]);
  }
  function volontaire(api) {
    api.flag('proces', 'peau');
    api.say('Vous fendez la foule jusqu’à l’estrade, sous les regards et les sifflets. Quelqu’un vous crache dessus. Vous montez les marches. Le Prince hausse les sourcils, vous adresse un petit signe de tête, l’air de s’en moquer.');
    api.npc('prince', 'Il se tourne vers la foule. « Y a-t-il parmi vous quelqu’un qui veuille s’offrir à la justice ? »');
    api.say('Les premiers rangs deviennent fous. Ils se battent pour attirer son attention, ils lèvent les mains, ils crient leur nom. Il en désigne un d’un geste, un jeune homme en pourpoint, qui sourit de bonheur. La foule se jette sur lui.');
    api.say('Des bruits affreux, sous la masse qui houle. Puis quelqu’un sort de la cohue et monte sur l’estrade, les bras pleins de quelque chose de rouge et de mou : la peau de l’élu, entière, qui pend comme un manteau mouillé.');
    api.check('san_peau');
  }
  function apresPeau(api) {
    api.say('Le Prince prend la peau avec un sourire, et la drape sur la statue en murmurant des mots que vous ne comprenez pas. La peau s’affaisse sur le bronze, épouse ses formes, s’y fond. La statue se met à respirer. Ses yeux s’ouvrent, et regardent droit devant eux, vitreux.');
    api.npc('prince', '« Tu es le juge. Tu décideras de la culpabilité ou de l’innocence de l’accusé, à la fin des débats. »');
    api.say('La statue ne répond pas. Elle respire, avec un sifflement d’asthmatique. De ses poignets sans mains, un liquide clair goutte sur les planches.');
    api.npc('prince', 'Magnanime, le Prince vous fait signe. « La défense peut s’entretenir avec son client. Brièvement. »');
    api.flag('proces', 'entretien');
    api.chips([{ label: 'Parler à Edgar', action: 'pr_edgar' }, { label: 'Commencer le procès', action: 'pr_commencer' }]);
  }
  function silence(api) {
    api.flag('proces', 'fini'); api.flag('procesPerdu', true);
    api.say('Vous ne bougez pas. Personne ne bouge. Le Prince attend, savoure, puis écarte les bras. « Personne ? Alors la justice sera prompte. »');
    verdictPerdu(api, true);
  }
  function entretien(api) {
    var n = (api.flag('entretienN') || 0) + 1; api.flag('entretienN', n);
    if (n === 1) {
      api.say('Edgar n’a pas dit un mot. Il fixe les planches, et il tremble. De près, ses poignets sont à vif sous les chaînes.');
      api.npc('edgar', '« Je suis arrivé il y a quelques heures. Pour chercher le rouleau, que j’avais caché ici. Je me reposais dans ma chambre, à la boutique, quand ses hommes ont enfoncé la porte. Ils m’ont traîné dehors. » Il lève les yeux vers le Prince. « Je ne sais même pas de quoi on m’accuse. C’est mon ami. C’était mon ami. »');
      api.npc('edgar', 'Il vous agrippe la manche. « Sauvez-moi. Je vous donnerai le rouleau, je vous le jure. Il a dit qu’il me ferait torturer, que je le lui donne ou non. »');
      api.chips([{ label: 'Lui dire qu’il est mort', action: 'pr_edgar' }, { label: 'Commencer le procès', action: 'pr_commencer' }]);
      return;
    }
    if (n === 2) {
      api.npc('edgar', '« Mort ? » Il rit, d’un rire qui s’étrangle. « Je dors, voilà tout. Je me réveillerai dans mon lit, avec le rouleau dans les mains, et William m’apportera le thé. » Il ne vous croit pas. Il ne peut pas vous croire.');
      return;
    }
    api.npc('prince', '« Assez ! » La foule se tait. Le Prince s’éclaircit la gorge.');
    accusation(api, 1);
  }
  // ---------------------------------------------------------------- les trois accusations
  var CHARGES = {
    1: { texte: '« Peuple de Lausanne ! Ce traître a refusé de se soumettre aux officiers dûment désignés du royaume. Sommé de comparaître devant le tribunal du peuple, il a rué, hurlé, protesté de toutes ses forces, et causé dans la rue un tumulte qui a beaucoup gêné les officiers chargés de l’amener. » Il glousse. « Une telle conduite sape mon autorité, et défie la loi de ma volonté. Innocent, il eût été docile. Docile, il eût été relâché… en temps voulu. Je demande au juge de le déclarer coupable. »',
      args: [
        { re: /\b(dorm\w*|sommeil|endormi\w*|reveill\w*|lit\b|arrach\w*|tire du lit|en pleine nuit|surpris)\b/, x: 'il dormait' },
        { re: /\b(ne savait pas|sans savoir|ne sait pas|ignorait|pas su|sans (motif|raison|explication|mandat|accusation|jugement)|aucun (motif|mandat|ordre|chef)|pourquoi on l|on ne lui a (rien )?dit|on ne lui a pas dit|ne comprenait|incompr\w*)\b/, x: 'il ne savait pas pourquoi' },
        { re: /\b(peur|terrifi\w*|effray\w*|panique|instinct\w*|n importe qui|tout homme|naturel\w*|normal|se defendre|reflexe|humain|vous aussi|moi aussi)\b/, x: 'n’importe qui se serait débattu' },
        { re: /\b(brutal\w*|violen\w*|force|traine\w*|frapp\w*|battu|vos hommes|ses hommes|les officiers|enfonce\w*|defonce\w*|porte)\b/, x: 'la brutalité des gardes' },
        { re: /\b(innocent\w* (peut|aussi|a le droit)|docile|douceur|ne prouve rien|pas une preuve|pas un aveu|absurde|raisonnement|logique|cercle|tordu|sophisme|contradiction)\b/, x: 'le raisonnement du Prince est absurde' }
      ],
      chips: [
        { id: 'c1a', label: '« Il dormait. On l’a arraché de son lit sans lui dire pourquoi. Qui ne se débattrait pas ? »', score: 2 },
        { id: 'c1b', label: '« Il a eu peur, voilà tout. »', score: 1 },
        { id: 'c1c', label: '« Il aurait dû obéir, c’est vrai, mais pardonnez-lui. »', score: 0 }
      ],
      reponse: { fort: 'Le Prince fait la moue, comme devant un plat trop salé. « Le peuple appréciera. » Le peuple n’apprécie rien du tout : il se tait.', moyen: 'Le Prince agite la main. « Bien, bien. La défense a parlé. »', faible: 'Le Prince éclate de rire, et la foule rit avec lui, d’un rire énorme qui fait trembler l’estrade.' } },
    2: { texte: '« Peuple de Lausanne ! L’accusé est un étranger, et cela, ses ardents défenseurs ne peuvent le nier. Le voilà, l’Anglais, témoignage vivant de sa culpabilité ! Nous autres, Lausannois, sommes fiers de la pureté de notre sang ; c’est notre force et notre gloire, car elle nous unit tous sous la volonté qui est la mienne. Sa présence parmi nous est un cancer, qui attire d’autres corps étrangers… » Il vous désigne d’un geste large. « …qu’il faudra extirper ! »',
      args: [
        { re: /\b((vous|toi|le prince|prince)\b.{0,30}\b(etranger|francais|venu d ailleurs|pas d ici|de paris))|\bvous etes francais\b|\bvous n etes pas d ici\b|\bun duc francais\b/, x: 'le Prince est étranger lui-même' },
        { re: /\b(romain\w*|celte\w*|helvet\w*|burgond\w*|empire|siecles?|de tout temps|depuis toujours|histoire|ancetres|aieux|savoyards?|bernois)\b/, x: 'l’histoire de la ville' },
        { re: /\b(purete|pur\b|sang\b|race|cancer|ridicule|absurde|folie|haine|mensonge)\b/, x: 'la pureté du sang est une absurdité' },
        { re: /\b(accueil\w*|hospital\w*|cosmopolite|refuge|visiteurs|voyageurs|conference|nations|commerce|neutr\w*|asile|sanatorium|clinique|soigner son frere)\b/, x: 'Lausanne accueille les étrangers' },
        { re: /\b(pas un crime|n est pas un crime|aucune loi|quel crime|ou est le crime|naissance|ne choisit pas|pas choisi|ne fait (de )?mal|n a fait (aucun )?mal|ne nuit|n a nui|innocent)\b/, x: 'être né ailleurs n’est pas un crime' },
        { re: /\b(homme comme|meme chair|meme peau|meme sang|humain\w*|freres?|egaux|tous des hommes|tous les hommes)\b/, x: 'la même humanité' }
      ],
      chips: [
        { id: 'c2a', label: '« Vous-même, Prince, vous êtes français. Et cette ville a été celte, romaine, burgonde : tout le monde y est venu d’ailleurs. »', score: 2 },
        { id: 'c2b', label: '« Être étranger n’est pas un crime. »', score: 1 },
        { id: 'c2c', label: '« Il repartira bientôt chez lui, si vous le laissez aller. »', score: 0 }
      ],
      reponse: { fort: 'Le Prince sourit d’un seul côté de la bouche. « J’ai toujours vécu ici. Toujours. » Mais la foule a entendu, et elle regarde son prince autrement, une seconde.', moyen: '« Sophismes d’étranger », dit le Prince à la foule, qui hoche la tête sans conviction.', faible: '« Vous voyez ? Ils ne savent même pas se défendre ! » La foule hurle de joie.' } },
    3: { texte: '« Peuple de Lausanne ! Nous accusons le traître que voici de détenir un savoir interdit. Qui sait quels secrets cache un étranger ? Et pourtant il les cache ! Cet homme, qui ne cherche qu’à nous tromper, qu’à servir son avantage et non celui de son Prince et de son peuple, est entré dans notre royaume sacré en possession de ce que moi seul, en souverain, puisse obtenir. Que complote-t-il ? Pourquoi tant de mystère ? Il a caché le rouleau quelque part dans ce royaume, comme une mine sous nos fondations ! » Sa voix monte. « S’il le produisait, j’aurais quelque raison d’être clément. Mais il persiste ! Il méprise ma volonté souveraine ! Je demande au juge de le déclarer coupable ! »',
      args: [
        { re: /\b(savoir (n est|ne peut|n a jamais|ne fait)|la connaissance|connaitre n est|lire n est|penser n est|ce n est pas un crime de|le savoir|un savoir|apprendre|etudier|curiosite|un livre|des livres)\b/, x: 'savoir n’est pas un crime' },
        { re: /\b(usage|s en servir|s en est servi|ce qu on en fait|l acte|agir|pas utilise|jamais servi|n a rien fait|aucun mal|ne l a pas employe)\b/, x: 'seul l’usage d’un savoir peut nuire' },
        { re: /\b(liberte|libre\w*|droit de|censure|pensee|conscience|opinion)\b/, x: 'la liberté de penser' },
        { re: /\b(a lui|lui appartient|sa propriete|son bien|il l a achete|son droit|vol\b|voler|volez|c est a lui|pas a vous|n est pas a vous|ne vous appartient)\b/, x: 'le rouleau lui appartient' },
        { re: /\b(vous (le )?voulez|vous voulez le rouleau|vous (le )?convoitez|vous avouez|clemen\w*|chantage|extorsion|rancon|convoitise|pour vous l approprier|vous le cherchez|votre interet|vous seul|c est vous qui|le vrai coupable|vous l avez tue|assassin|vous l avez empoisonne|morphine)\b/, x: 'le Prince ne veut que le rouleau' },
        { re: /\b(cacher n est|garder un secret|chacun a ses secrets|prudence|se proteger|par peur|il avait peur de vous|il se mefiait)\b/, x: 'cacher n’est pas un crime' }
      ],
      chips: [
        { id: 'c3a', label: '« Savoir n’est pas un crime : seul l’usage qu’on en fait peut l’être. Et ce rouleau est à lui. Vous ne l’accusez que parce que vous le voulez. »', score: 2 },
        { id: 'c3b', label: '« Il a le droit d’avoir des secrets. »', score: 1 },
        { id: 'c3c', label: '« S’il vous rend le rouleau, serez-vous clément ? »', score: 0 }
      ],
      reponse: { fort: 'Pour la première fois, le Prince ne sourit plus. Il vous regarde, et ses yeux d’eau pâle ont la couleur de la glace.', moyen: 'Le Prince hausse les épaules. « Belles paroles. La défense est éloquente. Elle sera pendue éloquemment. »', faible: 'Le Prince a l’air content de lui, et il a de quoi l’être.' } }
  };
  var GENERIQUES = [
    { re: /\b(pitie|souffr\w*|malade|la guerre|son frere|william|blesse\w*|morphine|pauvre|misericord\w*|grace|insomnie|ne dort)\b/, x: 'la pitié' },
    { re: /\b(preuve\w*|temoin\w*|juste|justice|equitable|proces|impartial|loi\b|lois\b|droit\b)\b/, x: 'la justice' },
    { re: /\b(peuple de lausanne|lausannois|vous tous|citoyens|habitants|bonnes gens|mes amis)\b/, x: 'la foule prise à témoin' }
  ];
  var CONCEDE = /\b(il est coupable|vous avez raison|c est vrai qu il|je reconnais|je l avoue|il merite|condamnez le|pendez le)\b/;
  function noter(n, texte) {
    var t = ' ' + G.RPG.normalize(texte || '') + ' ', mots = t.trim().split(/\s+/).filter(Boolean).length;
    if (mots < 3) return { score: 0, args: [], court: true };
    if (CONCEDE.test(t)) return { score: 0, args: ['une concession'] };
    var C = CHARGES[n], args = [];
    C.args.forEach(function (a) { if (a.re.test(t)) args.push(a.x); });
    var gen = GENERIQUES.filter(function (a) { return a.re.test(t); })[0];
    if (gen) args.push(gen.x);
    return { score: Math.min(4, 1 + args.length), args: args };
  }
  P._noter = noter; P._charges = CHARGES;
  function accusation(api, n) {
    api.flag('proces', 'c' + n); api.flag('relance', 0);
    if (n === 1) api.say('Le Prince s’éclaircit la gorge. Le procès commence.');
    api.npc('prince', CHARGES[n].texte);
    api.say('Le juge ne répond rien. Il continue de respirer, avec son sifflement d’asthmatique. Le Prince vous fait signe de la main : la défense a la parole.');
    api.sys('Plaidez : écrivez ce que vous dites pour la défense d’Edgar, avec vos propres mots. Ou choisissez un argument.');
    api.chips(CHARGES[n].chips.map(function (c) { return { label: c.label, action: 'pr_' + c.id }; }));
  }
  function plaider(api, texte, fixe, tait) {
    var n = +(etape(api) || 'c1').slice(1), note = tait ? { score: 0, args: [] } : fixe !== undefined ? { score: fixe, args: [] } : noter(n, texte);
    if (!tait && fixe === undefined && note.court && !api.flag('relance')) {
      api.flag('relance', 1);
      api.npc('prince', api.fresh('relance', ['« C’est tout ? » Il se penche vers vous, gourmand. « La défense est bien timide. Le peuple attend. »', '« Plaît-il ? Parlez plus fort, et plus longtemps. Le juge n’entend que les plaidoiries. »']));
      return;
    }
    if (tait) api.say('Vous vous taisez. Edgar ferme les yeux.');
    api.flag('dernierScore', note.score);
    api.flag('procesScore', (api.flag('procesScore') || 0) + note.score);
    var notes = api.flag('procesNotes') || []; notes.push(note.score); api.flag('procesNotes', notes);
    if (G.RPG_PROCES) G.RPG_PROCES.push({ charge: n, texte: texte, score: note.score, args: note.args });
    if (tait || note.score === 0) { repliquePrince(api); return; }
    // un jet de Persuasion après chaque plaidoirie : l'éloquence ajoute un point, quoi qu'on ait dit
    api.check('pr_persuasion');
  }
  function repliquePrince(api) {
    var n = +(etape(api) || 'c1').slice(1), sc = api.flag('dernierScore') || 0, R = CHARGES[n].reponse;
    api.npc('prince', sc >= 3 ? R.fort : sc >= 2 ? R.moyen : R.faible);
    if (n < 3) accusation(api, n + 1); else verdict(api);
  }
  function verdict(api) {
    var sc = api.flag('procesScore') || 0;
    api.flag('proces', 'verdict');
    api.say('Toutes les plaidoiries sont dites. Le juge reste là, debout, à respirer. Une minute. Deux. La foule retient son souffle avec lui.');
    if (sc >= 7) {
      api.flag('procesGagne', true);
      api.say('Puis, avec un grincement de bronze, la statue lève le bras, et pointe son moignon vers vous. Un liquide clair coule le long du métal.');
      api.say('Les chaînes d’Edgar tombent d’elles-mêmes sur les planches, avec un bruit de vaisselle. La foule ne dit rien. Le Prince trépigne sur l’estrade, une fois, deux fois, comme un enfant à qui l’on a pris son jouet. Puis il se calme d’un coup, et c’est pire.');
      api.say('La foule s’écarte pour vous laisser passer, en silence, comme assommée. Vous descendez de l’estrade avec Edgar, qui s’appuie sur vous. Vous êtes à l’entrée d’une rue quand la voix du Prince s’élève derrière vous.');
      api.npc('prince', '« Aujourd’hui, justice n’a été qu’à moitié rendue. Et les étrangers qui ont défendu le criminel ? Et leur complot ? Trouvez-les ! Amenez-les-moi ! »');
      api.say('La foule rugit. Courez. Toute la ville est à vos trousses.');
      api.npc('edgar', '« Le rouleau ! Il est à la boutique ! Venez ! »');
      api.flag('proces', 'fuite');
      api.chips([{ label: 'Courir à la boutique', action: 'pr_courir' }]);
      return;
    }
    api.flag('procesPerdu', true); api.flag('proces', 'fini');
    api.say('Puis, avec un grincement de bronze, la statue lève le bras, et pointe son moignon vers le Prince.');
    verdictPerdu(api, false);
  }
  function verdictPerdu(api, sansDefense) {
    api.say('Le Prince rit, il danse sur l’estrade, il bat des mains comme un enfant. « J’ai gagné ! J’ai gagné ! » La foule devient folle. Il se tourne vers Edgar, et sa voix change complètement.');
    api.npc('prince', '« Où est-il, espèce de petite crotte larmoyante ? »');
    api.npc('edgar', 'Edgar ne vous regarde pas. « Je l’ai caché », dit-il.');
    api.say('La place, la foule, le ciel violet se mettent à pâlir, comme une image qu’on laisse au soleil. Vous ne sentez plus vos pieds sur les planches. La dernière chose que vous voyez, c’est le Prince qui se penche vers Edgar, très doucement, comme on se penche sur un berceau.');
    var perte = G.RPG.rollExpr('1d6', api.rand);
    api.lose(perte);
    P.reveil(api, sansDefense ? 'silence' : 'perdu');
  }
  // ---------------------------------------------------------------- la fuite : la boutique, l'ours, la porte de derrière
  P.ours = function (api) {
    if (api.flag('oursOuvert')) { api.say('L’ours est éventré, son crin répandu sur le plancher. Il continue de bénir le vide.'); return; }
    var sait = api.has('JOURNALE') || api.flag('proces') === 'fuite';
    if (!sait && !api.flag('oursTate')) { api.flag('oursTate', true); api.say('L’ours a la poitrine cousue à grands points, d’un fil noir tout neuf, qui ne ressemble pas au travail parfait de William. Quelqu’un l’a ouvert, puis refermé, très vite, il n’y a pas longtemps.'); return; }
    prendreRouleau(api, false);
  };
  function prendreRouleau(api, parEdgar) {
    api.flag('oursOuvert', true);
    if (parEdgar) api.say('Edgar se jette sur l’ours, lui ouvre la poitrine avec un couteau de la boutique, et arrache à pleines mains des paquets de crin. Dehors, la rue se remplit ; des poings cognent contre la porte. Du ventre de l’ours, Edgar tire un rouleau de parchemin brun, noué d’un cordon de soie, avec, roulés à l’intérieur, des feuillets dactylographiés.');
    else api.say('Vous défaites les points noirs avec les ongles, puis avec un couteau trouvé sur l’établi. Le crin vient par paquets. Au fond du ventre de l’ours, il y a un rouleau de parchemin brun, noué d’un cordon de soie, avec, roulés à l’intérieur, des feuillets dactylographiés.');
    api.take(ROULEAU); api.take(TRAD); api.flag('rouleau', 'vrai'); api.flag('rouleauPris', true);
    api.clue('ROULEAU');
  }
  P.courirBoutique = function (api) {
    api.say('Vous courez. Edgar court à côté de vous, il trébuche, vous le relevez. Les rues violettes défilent ; derrière vous, le grondement de la foule, des torches, des cris. La rue Saint-Étienne. La cour. La boutique.');
    api.go('re_boutique', true);
    if (api.flag('rouleauPris')) {
      api.say('Edgar se jette sur l’ours, le trouve éventré, vide, et se retourne vers vous, blanc comme un linge. Vous lui montrez le rouleau. Il éclate en sanglots, et vous serre contre lui, à vous étouffer.');
      api.flag('oursOuvert', true);
    } else prendreRouleau(api, true);
    api.say('La porte de la rue tremble sous les coups. Les gonds commencent à céder. Edgar serre le rouleau contre sa poitrine, et vous montre l’arrière-boutique.');
    api.chips([{ label: 'Fuir par la porte de derrière', action: 'rb_fuir' }]);
  };
  P.fuirArriere = function (api) {
    var o = origine(api);
    api.say('Vous traversez l’atelier en courant. Derrière vous, la porte de la rue cède avec un craquement de bois mort, et la foule entre dans la boutique en hurlant.');
    if (o === 'train') {
      api.say('La porte de derrière s’ouvre sur la plaine de cendre. Le train est là, mais il s’est retourné : il part dans l’autre sens, il prend lentement de la vitesse.');
      api.go('re_plaine', true);
      api.chips([{ label: 'Courir jusqu’au train', action: 'rp_courir' }]);
      return;
    }
    if (o === 'porte') {
      api.say('La porte de derrière donne sur une ruelle, et la ruelle, par un chemin que vous ne cherchez pas à comprendre, sur la rue du Pré. La maison du Prince. Sa porte est ouverte.');
      api.go('re_pre', true);
      api.chips([{ label: 'Repasser la porte sculptée', action: 'rpr_porte' }]);
      return;
    }
    api.say('La porte de derrière s’ouvre sur du noir, un noir épais, qui n’est pas la nuit. Vous y entrez en tenant Edgar par la main. Les cris s’éloignent, comme si on fermait des portes, une à une, derrière vous.');
    P.reveil(api, 'gagne');
  };
  P.finFuite = function (api) {
    api.say('Vous courez dans la cendre, Edgar sur vos talons. Le train gagne de la vitesse. Derrière vous, la foule jaillit de la porte, aveuglée par la lumière, et se lance à votre poursuite. Elle gagne du terrain. Elle en gagne encore. Vous attrapez la barre de la dernière voiture, vous hissez Edgar, vous vous hissez.');
    api.say('La foule court encore un moment le long de la voie, les bras tendus, puis elle reste en arrière, à quelques mètres, à un mètre, et le train s’en va. À bord, une fatigue irrésistible vous ramène à votre compartiment, et Edgar au sien. Vous vous asseyez. Vous fermez les yeux.');
    P.reveil(api, 'gagne');
  };

  // ================================================================ le réveil
  P.reveil = function (api, comment) {
    var o = origine(api), debut = api.flag('reveDebut') || api.s.min, gagne = comment === 'gagne' && api.flag('procesGagne');
    if (api.flag('proces') === 'fuite') api.flag('proces', 'fini');
    api.flag('reveFini', true);
    if (o === 'porte') {
      if (gagne) {
        api.say('Vous franchissez la porte. Vous êtes dans la maison vide de la rue du Pré, la vraie, dans sa poussière. Edgar vous suit. Sur le seuil, il s’arrête net : sa main, sur le chambranle, est devenue transparente. Il vous regarde, il regarde le rouleau dans vos mains, et il comprend enfin.');
        api.say('Il ne dit rien. Il s’efface, de la tête aux pieds, comme une buée sur une vitre, et il n’y a plus que la porte, et vous.');
        api.check('san_efface');
      } else api.say('Vous repassez la porte, et vous voilà dans la maison vide de la rue du Pré, la vraie. La poussière, la chaise longue. Il est plus tard que vous ne pensiez.');
      api.time(30);
      api.go('la_preint', true);
      return;
    }
    // le sommeil dure à peu près quatre heures ; à Lausanne, on se réveille à temps pour le train de l'aube
    var fin = debut + 240, m = fin % D, j = Math.floor(fin / D);
    if (o !== 'train' && (m > 6 * 60 + 15 && m < 9 * 60) && Math.floor(debut / D) < j) fin = j * D + 6 * 60 + 15;
    if (api.s.min < fin) { api.s.min = fin; api.s.tick = 0; }
    var lieu = o === 'train' ? 'tr_compartiment' : api.flag('reveLieu') || 'la_hotel';
    api.go(lieu, true);
    if (gagne) {
      api.flag('fantome', true);
      api.say(o === 'train' ? 'Vous vous réveillez sur la banquette de votre compartiment, le cou raide, la bouche sèche. Le store est levé ; dehors, de la neige. Par terre, entre vos pieds, un rouleau de parchemin brun et une liasse de feuillets dactylographiés. Ils sont tenus par deux mains. Edgar Wellington est assis par terre, adossé à la porte, et il vous sourit.' : 'Vous vous réveillez là où vous vous étiez endormi{e}. Dans vos mains, un rouleau de parchemin brun et une liasse de feuillets. Edgar Wellington est assis par terre, adossé au mur, et il vous sourit.');
      api.npc('edgar', '« Nous sommes rentrés. » Il a l’air très fatigué, et très heureux. « Il faudra que je dise à William. Il ne me croira pas. »');
      api.say('Vous avez dormi près de quatre heures. Vous avez faim et soif comme jamais.');
    } else {
      api.say(o === 'train' ? 'Vous vous réveillez sur la banquette de votre compartiment, le cou raide, la bouche sèche, les mains vides. Le store est levé ; dehors, de la neige. Vous avez dormi près de quatre heures.' : 'Vous vous réveillez là où vous vous étiez endormi{e}, les mains vides, le cœur battant. La torche est redevenue une lampe.');
      if (comment === 'sommeil') api.say('Vous n’avez pas trouvé Edgar, là-bas. Ou il n’y était pas, ou il était déjà ailleurs.');
    }
  };
  // Edgar n'est plus qu'un rêve : il s'efface la première fois qu'on le laisse
  P.fantomeEdgar = function (api, quand) {
    if (!api.flag('fantome') || api.flag('efface')) return;
    if (quand === 'entree') return;
    api.flag('efface', true);
    api.say('Vous vous levez. Edgar se lève aussi, pour vous suivre, et il pose la main sur la poignée. Sa main passe à travers. Il la regarde, puis il vous regarde. « Qu’est-ce qui m’arrive ? » Sa voix baisse à chaque mot, comme une lampe qu’on éteint. « Qu’est-ce qui m’arrive ? »');
    api.say('Il s’efface pendant que vous le regardez, de la tête aux pieds, comme une buée sur une vitre. Il n’y a plus personne.');
    api.check('san_efface');
  };
  // quitter le lieu du réveil, à Lausanne, efface Edgar aussi
  var goAvant = null;

  // ================================================================ ce que le joueur dit pendant le procès
  P.capture = function (api, raw, p, mode) {
    if (api.s.loc !== 're_palud') return false;
    var e = etape(api), t = ' ' + G.RPG.normalize(raw) + ' ';
    if (/^\s*(je )?(reflechi\w*|reflechir|rassemble mes idees)\b/.test(t)) return false;
    if (e === 'appel') {
      if (/\b(moi|je (le |la )?(defend\w*|defendrai)|je me porte|volontaire|je plaide|son avocat|je prends sa defense|je vais le defendre|j accepte|oui|me voici|present|je m avance|je monte)\b/.test(t)) { volontaire(api); return true; }
      if (/\b(non|rien|je me tais|silence|personne|je ne dis rien|je reste|j attends)\b/.test(t)) { silence(api); return true; }
      var k = (api.flag('appelN') || 0) + 1; api.flag('appelN', k);
      if (k >= 3) { silence(api); return true; }
      api.npc('prince', api.fresh('appelR', ['« Plaît-il ? » Le Prince met une main en cornet. « Je demande si quelqu’un défend cet homme. Oui, ou non ? »', '« Allons. Personne ? »']));
      return true;
    }
    if (e === 'entretien') {
      if (/\b(mort|morte|decede|tue|assassine|ton corps|votre corps|vous etes mort|il est mort|ne vous reveillerez)\b/.test(t)) { api.flag('entretienN', 1); entretien(api); return true; }
      if (/\b(commenc\w*|allons y|procedons|je suis pret|pret)\b/.test(t)) { accusation(api, 1); return true; }
      entretien(api); return true;
    }
    if (/^c[123]$/.test(e || '')) { plaider(api, raw); return true; }
    if (e === 'verdict') { api.say('Le juge respire. Personne ne vous écoute plus.'); return true; }
    return false;
  };
  // les arguments tout faits, pour qui ne veut pas écrire
  [1, 2, 3].forEach(function (n) {
    CHARGES[n].chips.forEach(function (c) {
      P.locations.re_palud.actions.push({ id: 'pr_' + c.id, label: c.label, verbs: [], nouns: [],
        cond: function (api) { return etape(api) === 'c' + n; },
        run: function (api) { plaider(api, c.label, c.score); } });
    });
  });
  // la peau sur le juge : après le jet, la suite
  var sanPeau = P.checks.san_peau.resolve;
  P.checks.san_peau.resolve = function (api, r) { sanPeau(api, r); apresPeau(api); };

  // ================================================================ le Prince, Edgar dans le rêve
  P.npcs.prince = H.npc({ id: 'prince', name: 'Le Prince', short: 'Le Prince', patience: 30, cooldown: 0, selfKeys: ['PRINCE'], lieux: ['re_palud'],
    greet: function (api) { api.npc('prince', '« La défense a la parole. »'); },
    bye: '« Nous verrons. »', deflect: ['« Plaît-il ? »'], topics: [] });
  P.people.prince = 'Le Prince, dans la Lausanne du rêve';
  P.fiches.prince = { groupe: 'occultiste', reg: 'soutenu', tics: [], moi: {}, sait: {} };
  // Edgar, dans le rêve : sur l'estrade, puis dans la fuite
  var edgarLa = P.edgarLa;
  P.edgarLa = function (api) { return edgarLa(api) || (api.s.loc === 're_palud' && procesEnCours(api)) || (api.flag('fantome') && !api.flag('efface')); };

  // ================================================================ les mots du rêve
  var lexAvant = P.lexicon;
  P.lexicon = function (Lx) {
    Lx.add('PRINCE', 'n', 'prince, encapuchonne, homme en capuchon, silhouette', { label: 'le Prince', npc: true });
    Lx.add('JUGE', 'n', 'juge, statue de bronze, bronze, statue', { label: 'le juge de bronze' });
    Lx.add('PROCES', 'x', 'proces, plaider, plaidoirie, defense, defendre, avocat, accusation, accusations, verdict, tribunal, estrade', { label: 'le procès' });
    Lx.add('FOULE', 'n', 'foule, peuple, gens, badauds, passants, cohue, populace', { label: 'la foule' });
    Lx.add('GIBET', 'n', 'gibet, gibets, pendus, potence, potences', { label: 'les gibets' });
    Lx.add('PLAINE', 'n', 'plaine, cendre, cendres, desert', { label: 'la plaine' });
    Lx.add('STORES', 'n', 'store, stores', { label: 'les stores' });
    Lx.add('PORTECLOUEE', 'n', 'porte clouee, clous, planches, odeur de viande', { label: 'la porte clouée' });
    Lx.add('CHERCHER', 'v', 'chercher edgar, appeler edgar', { label: 'chercher' });
    Lx.add('MARCHER', 'v', 'errer, flaner, deambuler, marcher, me promener, vagabonder', { label: 'errer' });
    Lx.add('ARRETER', 'v', 'arreter, interpeller, aborder, accoster', { label: 'aborder' });
    lexAvant(Lx);
  };

  // ================================================================ Réfléchir, pendant le rêve
  P.conseilReve = function (api) {
    if (!reve(api)) return null;
    var e = etape(api);
    if (e === 'appel') return 'Edgar ne peut pas se défendre seul. Si personne ne parle pour lui, le Prince aura ce qu’il veut.';
    if (e === 'c1') return 'Edgar dormait quand on est venu le prendre. On ne résiste pas à une arrestation qu’on ne comprend pas, et le raisonnement du Prince tourne en rond : l’innocent n’aurait été relâché que s’il était docile, et docile que s’il était innocent.';
    if (e === 'c2') return 'Étranger ? Le Prince est français. Et Lausanne a été celte, romaine, burgonde, savoyarde, bernoise ; aujourd’hui encore, la ville vit des étrangers qu’elle accueille. Ce n’est pas un crime d’être né ailleurs.';
    if (e === 'c3') return 'Savoir n’est pas un crime ; seul l’usage d’un savoir peut l’être. Le rouleau appartient à Edgar. Et le Prince l’a dit lui-même : il serait clément si on le lui donnait. C’est le rouleau qu’il veut, pas la justice.';
    if (e === 'entretien') return 'Edgar ne sait pas de quoi on l’accuse. Le procès va commencer : trois accusations, et le juge, s’il est juste, n’écoutera que les arguments.';
    if (e === 'fuite') return 'La foule arrive. La boutique, l’ours, et la porte de derrière.';
    if (api.s.loc === 're_train') return 'Ce train ne va nulle part. Il faut en descendre.';
    if (api.s.loc === 're_plaine') return 'La porte, au milieu de la plaine. Elle mène quelque part que vous connaissez.';
    if (api.s.loc === 're_boutique' && !api.flag('oursOuvert')) return api.has('JOURNALE') ? '« Dans le premier que nous avons fait. » L’ours de l’escalier.' : 'Edgar a caché quelque chose ici. Dans une boutique pleine de bêtes empaillées, où cache-t-on une chose qu’on ne veut pas qu’on trouve ?';
    if (api.flag('meurtre') && !api.flag('cloche')) return 'Edgar est quelque part dans cette ville. Les passants ne parlent pas, mais ils courent tous vers le même endroit.';
    if (api.flag('reve') === 'porte') return 'La porte sculptée, rue du Pré, vous ramènera chez vous. Ne la perdez pas.';
    return 'Dans ce rêve, rien n’a d’importance que ce qui vous ramènera éveillé{e}.';
  };
  P.tourReve = function (api) { return false; };
})(typeof window !== 'undefined' ? window : globalThis);

// =============================================================================
// Le Simplon, le lendemain : la neige, Brigue, et le déjeuner du duc
// =============================================================================
(function (G) {
  'use strict';
  var P = G.CHAPTERS && G.CHAPTERS.lausanne; if (!P || !P._h) return;
  var X = P._h, D = 1440, ROULEAU = X.ROULEAU, TRAD = X.TRAD, FAUX = X.FAUX;
  function mn(api) { return api.s.min % D; }
  P.tourTrain = function (api) {
    var m = mn(api);
    if (!api.flag('brigue') && m >= 9 * 60 + 20) {
      api.flag('brigue', true);
      api.say('À Brigue, au pied du Simplon, le train s’arrête et ne repart pas. Il neige si fort qu’on ne voit plus la gare. Des hommes en pèlerine courent le long des voies avec des pelles ; le conducteur passe dans le couloir en répétant que la Compagnie est désolée. Une heure et demie plus tard, une secousse, et le tunnel : vingt kilomètres de nuit sous la montagne.');
      api.time(5); return true;
    }
    if (!api.flag('faim') && m >= 11 * 60 + 40 && api.s.loc === 'tr_compartiment') {
      api.flag('faim', true);
      api.say('Le conducteur annonce le premier service, de porte en porte. Vous avez faim, une faim de loup, une faim de quelqu’un qui a passé la nuit dehors.');
      api.chips([{ label: 'Aller au wagon-restaurant', action: 'tc_restaurant' }]);
      return true;
    }
    if (!api.flag('ducTrain') && m >= 11 * 60 + 45 && api.s.loc === 'tr_restaurant') { P.dejeunerDuc(api); return true; }
    // le duc ne laisse pas passer l'heure : s'il le faut, il vient frapper au compartiment
    if (!api.flag('ducTrain') && m >= 12 * 60 + 30 && api.s.loc === 'tr_compartiment') {
      api.say('On frappe à la porte du compartiment. Trois petits coups, polis.');
      P.dejeunerDuc(api, true); return true;
    }
    return false;
  };
  // ---------------------------------------------------------------- le déjeuner
  function aLeVrai(api) { return api.item(ROULEAU); }
  function ducALeVrai(api) { return !aLeVrai(api) && !api.flag('vraiDonne') && api.flag('meurtre') && !api.flag('edgarSauve'); }
  P.dejeunerDuc = function (api, compartiment) {
    if (api.flag('ducTrain')) return;
    if (mn(api) < 11 * 60 + 30 && !compartiment) return;
    api.flag('ducTrain', true); api.flag('ducAssis', true); api.flag('ducVu', true);
    if (P.fantomeEdgar) P.fantomeEdgar(api, 'sortie');
    if (!compartiment) api.say('Pendant que vous attendez votre potage, vous entendez la conversation de la table voisine. « Monsieur dînera seul, aujourd’hui ? » demande le serveur. Et une voix que vous connaissez bien : « Non. Je crois que je vais déjeuner avec quelqu’un que je connais. »');
    api.say(compartiment ? 'C’est le duc des Esseintes. Il entre sans attendre qu’on l’y invite, rabat le strapontin et s’assied en face de vous, avec un sourire chaleureux. Il pose une petite valise de cuir à ses pieds.' : 'Le duc des Esseintes s’assied en face de vous, avec un sourire chaleureux. Il pose une petite valise de cuir à ses pieds.');
    if (ducALeVrai(api)) {
      api.npc('duc', '« Je tenais à vous remercier, très {cher} ami{e}. Sans vous, je n’aurais jamais su qu’Edgar avait des secrets. » Il caresse sa valise. « Il me les a dits, à la fin. Tout le monde finit par me les dire. »');
      depart(api); return;
    }
    api.npc('duc', '« Pardonnez la brusquerie, mais je viens au fait. Je veux le rouleau. Vous allez me le donner, ou je vous détruirai. Votre réponse, vite, je vous prie : j’ai peu de temps. »');
    api.flag('ducDemande', 1);
    choix(api);
  };
  function choix(api) {
    var c = [];
    if (api.item(FAUX)) c.push({ label: 'Lui donner le rouleau scellé', action: 'trr_faux' });
    if (aLeVrai(api)) c.push({ label: 'Lui donner le vrai rouleau', action: 'trr_vrai' });
    c.push({ label: 'Refuser', action: 'trr_refuser' });
    api.chips(c);
  }
  function depart(api) {
    api.say('Il jette un coup d’œil à l’indicateur de la Compagnie, ouvert près de son assiette. « Bien. Nous serons bientôt hors de portée. Il faut que je vous quitte. »');
    api.say('Il ouvre sa valise et en tire une corde de crin tressé, tout à fait ordinaire, sinon qu’elle est tressée sur elle-même en une boucle sans fin, large de plus d’un mètre. Il murmure quelques mots, reprend sa valise, fait tournoyer la boucle au-dessus de sa tête d’un geste curieux, et la laisse retomber sur lui.');
    api.say(api.s.loc === 'tr_restaurant' ? 'Elle tombe. Il disparaît, avec la chaise qu’elle a entourée.' : 'Elle tombe. Il disparaît, avec le strapontin qu’elle a entouré.');
    api.say('Cela s’est passé si vite que la plupart des convives n’ont rien vu. Le serveur, lui, a tout vu. Son aplomb ne se fissure pas.');
    if (api.s.loc === 'tr_restaurant') api.npc('maitre', '« ' + (api.pc.sex === 'f' ? 'Madame' : 'Monsieur') + ', dit-il d’un ton de reproche, qu’a-t-il fait de notre chaise ? »');
    else { api.arrive('morand'); api.npc('morand', 'Le conducteur, qui passait dans le couloir, s’arrête net devant la porte ouverte. « ' + (api.pc.sex === 'f' ? 'Madame' : 'Monsieur') + ', dit-il d’un ton de reproche, qu’a-t-il fait de notre strapontin ? »'); }
    api.flag('chaise', true); api.flag('ducAssis', false); api.clue('CHAISE');
    api.chips(api.s.loc === 'tr_restaurant' ? [{ label: 'Déjeuner', action: 'trr_manger' }] : [{ label: 'Aller au wagon-restaurant', action: 'tc_restaurant' }]);
  }
  Object.assign(P.checks, {
    trr_force: { skill: 'Esquive', why: 'éviter la main du duc',
      resolve: function (api, r) {
        if (r.success) { api.say('Vous retirez votre main juste à temps. Ses doigts se referment sur la nappe, qui jaunit et se racornit sous eux comme une feuille morte.'); return; }
        api.say('Il pose deux doigts sur le dos de votre main, très légèrement. La peau se plisse, se dessèche, jaunit comme celle d’un vieillard, les veines saillent. La douleur vient après, en retard, terrible.');
        api.hp(-2); api.check('san_fletri');
      } }
  });
  P.globalActions.push(
    { id: 'trr_faux', label: 'Lui donner le rouleau scellé', verbs: ['DONNER'], nouns: ['FAUX'],
      cond: function (api) { return !!api.flag('ducAssis') && api.item(FAUX); },
      run: function (api) {
        api.drop(FAUX); api.flag('fauxDonne', true); api.flag('ducAssis', false);
        api.say('Vous posez sur la nappe le rouleau scellé de cire rouge. Le duc le prend sans même le regarder de près : il a la bonne couleur, le bon poids, il est noué et scellé. Il le glisse dans sa valise avec un soupir d’aise.');
        api.npc('duc', '« Voilà qui est raisonnable. J’aime les gens raisonnables. Ils sont si rares, et ils vivent si longtemps. »');
        depart(api);
      } },
    { id: 'trr_vrai', label: 'Lui donner le vrai rouleau', verbs: ['DONNER'], nouns: ['ROULEAU'],
      cond: function (api) { return !!api.flag('ducAssis') && api.item(ROULEAU); },
      run: function (api) {
        api.drop(ROULEAU); api.flag('vraiDonne', true); api.flag('rouleau', 'donne'); api.flag('ducAssis', false);
        api.say('Vous posez sur la nappe le rouleau de parchemin brun, noué de soie. Le duc le prend sans un regard. Il le glisse dans sa valise.' + (api.item(TRAD) ? ' Il ne vous demande pas les feuillets dactylographiés : il ne sait pas qu’ils existent. Vous les gardez contre vous, sous votre veston.' : ''));
        api.npc('duc', '« Voilà qui est raisonnable. »');
        depart(api);
      } },
    { id: 'trr_refuser', label: 'Refuser', verbs: ['AUREVOIR'], nouns: [],
      cond: function (api) { return !!api.flag('ducAssis'); },
      run: function (api) { P.refuserDuc(api); } }
  );
  P.refuserDuc = function (api) {
    var n = (api.flag('refus') || 0) + 1; api.flag('refus', n);
    if (n === 1) {
      api.npc('duc', '« Vraiment ? » Il ne se départ pas de son sourire. « Alors écoutez-moi bien. À Domodossola, deux policiers suisses monteront dans ce train. Ils cherchent les assassins des frères Wellington. Ils ont un témoin, ce cher Max, qui vous a vus traîner rue Saint-Étienne, et qui parlera à qui le paiera. Et ils ont ma parole. Ma parole vaut cher, dans ce pays. »');
      choix(api); return;
    }
    if (n === 2) {
      api.npc('duc', '« Je vois. » Il soupire, comme devant un enfant têtu, et tend la main par-dessus la table.');
      api.check('trr_force');
      choix(api); return;
    }
    api.flag('ducAssis', false);
    if (api.flag('deposition')) {
      api.npc('duc', 'Il vous regarde longuement. « Le commissaire Rochat a votre déposition, n’est-ce pas ? Vous êtes plus prévoyant que vous n’en avez l’air. » Il se lève. « Gardez-le, alors. Pour l’instant. Nous nous reverrons, et vous me le rendrez avec les intérêts. »');
      depart(api); return;
    }
    api.npc('duc', '« Comme vous voudrez. » Il se lève, s’incline, et s’en va vers les voitures de tête.');
    api.say('À Domodossola, deux hommes en civil montent dans le train, accompagnés d’un carabinier italien. Ils vont droit à votre compartiment. Ils ont votre signalement, le nom de M. von Wurtheim, et une lettre à en-tête d’un duc.');
    api.flag('fin', 'prison'); api.end();
  };
  // ---------------------------------------------------------------- la lecture du rouleau
  P.lireRouleau = function (api) {
    if (api.flag('lu')) { api.say('Vous en avez lu assez pour le moment. La lecture complète demandera des heures, et une âme bien accrochée.'); return; }
    api.flag('lu', true); api.time(60);
    api.say('Des pages et des pages d’un fou, traduites dans un anglais d’employé de banque par quelqu’un qui n’en a rien compris. Le texte va et vient sans ordre, revient sur ses pas, se contredit. Ce qu’il décrit avec le plus de soin, c’est la façon de torturer et d’écorcher un homme.');
    api.doc('LE ROULEAU DE LA TÊTE (extrait de la traduction) — J’ai vu les puissances qui marchent la nuit, et j’ai connu Celui qui n’a pas de peau. Il m’a parlé dans le secret de mon cœur. Je L’ai vue d’abord en rêve, marchant au-dessus des villes en ruine, plus haute que les tours, et les rois se couchaient devant Elle. Quand je L’ai tenue enfin, Elle était froide et lisse comme la nacre. Elle s’est éveillée la nuit où j’ai dépouillé vivant le voleur qui voulait me La prendre. J’ai fait les dix-sept dévotions, et je L’ai ouverte. Dedans, Elle était douce, douce comme la peau d’un nouveau-né. Elle a été faite à ma taille. J’ose écrire qu’Elle a été faite à mon image. Je La garde pure. Rien d’impur ne doit La toucher, car Sa couleur est celle de la pureté. — Je sais que je La perdrai. On me L’arrachera, et on La dispersera. Alors j’écris ceci, le premier de cinq rouleaux : ma tête. Le ventre dira le culte. Les jambes diront les œuvres de la chair. Le bras droit dira le rite qui L’éveille. Le bras gauche, celui qui La tient en équilibre.', 'Sedefkar · traduction anonyme');
    api.clue('ROULEAU');
    api.mythos(2);
    api.check('san_lecture');
  };
  // ---------------------------------------------------------------- Milan
  P.arriveeMilan = function (api) {
    if (api.flag('milan')) return;
    api.flag('milan', true);
    var m = mn(api), h = Math.max(13 * 60, m + 30);
    api.s.min = Math.floor(api.s.min / D) * D + h; api.s.tick = 0;
    api.flag('milanH', Math.floor(h / 60) === 13 ? 'treize heures passées' : 'quatorze heures');
    // ce que la nuit a coûté, et ce qu'elle a rendu
    if (api.item(ROULEAU)) { var g = G.RPG.rollExpr('1d6', api.rand); api.gain(g); api.say('Vous posez la main sur la valise où dort le rouleau. Vous l’avez arraché au Prince, et à son rêve. Quelque chose, en vous, se remet d’aplomb.'); }
    if (api.flag('sauveW') || api.flag('edgarSauve')) { var g2 = G.RPG.rollExpr('1d4', api.rand); api.gain(g2); api.say(api.flag('edgarSauve') ? 'Vous pensez aux frères Wellington, en route pour le Hampshire. Il y a au moins cela.' : 'Vous pensez à William, vivant, quelque part dans un lit d’hôpital de Lausanne, son carnet sur les genoux. Il y a au moins cela.'); }
    api.say('La plaine lombarde, des peupliers dans la brume, des cheminées d’usine. Le train entre en gare de Milan avec plus d’une heure de retard, sous une pluie fine.');
    api.end();
  };
  // sans déjeuner, l'arrivée finit le chapitre aussi
  var tourT = P.tourTrain;
  P.tourTrain = function (api) {
    if (tourT(api)) return true;
    if (api.flag('chaise') && !api.flag('milan') && mn(api) >= 13 * 60 + 30) { P.arriveeMilan(api); return true; }
    return false;
  };
})(typeof window !== 'undefined' ? window : globalThis);
