/* Campagne de l'Orient-Express — Chapitre « Londres : danseurs dans le brouillard ».
   Adaptation libre pour usage privé : tout le texte est réécrit, rien n'est recopié du livre. */
(function (G) {
  'use strict';
  var BASE = G.CHAPTERS.prologue;
  var VALISE = 'La valise de Beddows (1 000 £ en billets neufs)';
  var CARTE = 'La carte de visite de Smith, au cachet de sa chevalière';
  var BILLETS = 'Des billets de première classe pour Paris';
  var MAQ = 'La maquette des Alexis, dans sa caisse';
  var D = 1440; // minutes par jour
  var JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function day(min) { return Math.floor(min / D); }
  // le jour du journal le plus récent : l'édition du matin sort des presses vers cinq heures ;
  // avant, la nuit, on n'a encore que celle de la veille. Tout ce que « disent les journaux » se règle là-dessus.
  function presse(min) { return Math.floor((min - 5 * 60) / D); }
  function hour(min) { return Math.floor((min % D) / 60); }
  function at(d, h, m) { return d * D + h * 60 + (m || 0); }

  // ---------------------------------------------------------------- utilitaires de déplacement
  var PLACES = {
    hotel: { label: 'votre hôtel, à Bloomsbury', concept: 'HOTEL', also: [] },
    institut: { label: 'l’Institut impérial', concept: 'INSTITUT', also: [] },
    cheapside: { label: 'la chambre de Cheapside', concept: 'CHEAPSIDE', also: ['BEDDOWS', 'BRULE', 'CARTEVISITE'] },
    chelsea: { label: 'l’hôtel Chelsea Arms', concept: 'CHELSEA', also: ['MEURTRES'] },
    yard: { label: 'Scotland Yard', concept: 'YARD', also: ['FLEMING', 'RIGBY', 'POLICE'] },
    ambassade: { label: 'l’ambassade de Turquie', concept: 'AMBASSADE', also: ['MUSTAPHA', 'TURCS'], hours: [9, 18], jours: ['samedi', 'dimanche'], fermeJour: 'Les grilles de l’ambassade de Turquie sont closes : les bureaux ne rouvrent que lundi, à 9 h.', closed: 'À cette heure, l’ambassade de Turquie est fermée. Ses bureaux ouvrent à 9 h.' },
    islington: { label: 'la boutique de Brophy Lane, à Islington', concept: 'ISLINGTON', also: ['VOISIN', 'MAKRYAT', 'REGISTRE'] },
    musee: { label: 'la salle de lecture du British Museum', concept: 'MUSEE', also: ['BIBLIOTHECAIRE', 'LIVRE'], hours: [9, 20], jours: ['dimanche'], fermeJour: 'Le dimanche, la salle de lecture du British Museum reste fermée. Les lecteurs, comme les livres, se reposent jusqu’à lundi.', closed: 'La salle de lecture du British Museum ouvre de 9 h à 20 h. À cette heure, ses grilles sont fermées.' },
    stoke: { label: 'la pension de Stoke Newington', concept: 'STOKE', also: ['ATKINS', 'STANLEY', 'SERGENT'], hours: [7, 22], closed: 'À cette heure, la pension de Stoke Newington dort, volets clos. On ne tire pas une logeuse de son lit sans une très bonne raison.' },
    camberwell: { label: 'la maison d’Arthur Butter, à Camberwell', concept: 'CAMBERWELL', also: ['BUTTER', 'MAQUETTE', 'ASSOCIATION'], hours: [8, 24], closed: 'À cette heure, la maison de M. Butter est éteinte. On ne sonne pas chez les gens en pleine nuit.' },
    victoria: { label: 'la gare Victoria', concept: 'VICTORIA', also: ['VOYAGE', 'TRAIN'] }
  };
  var ZONE = { boutique: 'islington', chambre_stanley: 'stoke', cave: 'camberwell' };
  function zone(loc) { return ZONE[loc] || loc; }
  function known(api, id) { return id === 'hotel' || id === 'victoria' || id === 'musee' || id === 'stjohn' || id === 'archives' || !!api.flag('known:' + id); }
  function learn(api, id) {
    if (api.flag('known:' + id)) return;
    api.flag('known:' + id, true);
    api.sys('Nouveau lieu : ' + PLACES[id].label + '. Écrivez « aller à… » ou touchez « Où aller ? ».');
  }
  // ---------------------------------------------------------------- pourquoi y aller
  // Un lieu ne se propose que si le personnage a une raison d'y aller, tirée de ce qu'il a vu ou entendu ; la raison
  // s'affiche sous le bouton (« Fleming y enquête sur les trois morts du Chelsea Arms »). La première qui vaut l'emporte.
  // Sans raison, le lieu ne se propose pas, mais on peut toujours y aller en l'écrivant.
  var POURQUOI = {
    hotel: [[function () { return true; }, 'Votre chambre, le concierge, le courrier.']],
    cheapside: [[function (api) { return api.has('BILLET') && !api.flag('cheapsideFini'); }, 'Le billet de Smith vous y donne rendez-vous.'],
      [function (api) { return api.has('FUYARD'); }, 'Là où le cocher a déposé « Beddows » et son fardeau.']],
    chelsea: [[function (api) { return api.sait('MEURTRES'); }, 'Les trois morts y ont été trouvés, chambre 14.'],
      [function (api) { return api.has('CLE14'); }, 'La clé tombée de la poche du moustachu vient de là : chambre 14.']],
    yard: [[function (api) { return api.sait('MEURTRES'); }, 'L’inspecteur Fleming y enquête sur les trois morts du Chelsea Arms.'],
      [function (api) { return api.sait('INCENDIE'); }, 'La police enquête sur l’incendie chez Smith.'],
      [function () { return true; }, 'La police, si vous avez quelque chose à signaler.']],
    ambassade: [[function (api) { return api.sait('MAKRYAT'); }, 'Les morts du Chelsea Arms avaient des passeports turcs au nom de Makryat.']],
    islington: [[function (api) { return api.has('ADRESSE') || api.sait('ADRESSE'); }, 'La boutique de Makryat, l’antiquaire.']],
    musee: [[function (api) { return api.has('QUETE'); }, 'Ses livres, pour en savoir plus sur le simulacre et sur Fenalik.'],
      [function (api) { return api.has('TRAIN') || api.has('ALEXIS'); }, 'Ses registres, pour remonter la piste du train miniature.'],
      [function (api) { return api.sait('MEURTRES'); }, 'Ses journaux et ses livres, pour en savoir plus sur Makryat.']],
    stoke: [[function (api) { return api.has('TRAIN') || api.has('STANLEY'); }, 'Henry Stanley y logeait, l’homme qui a acheté le train miniature.'],
      [function (api) { return api.sait('VOLATILISE'); }, 'Le journal parle d’un homme parti en fumée, là-bas.']],
    camberwell: [[function () { return true; }, 'Arthur Butter y habite : il connaît le train et l’homme qui l’a acheté.']],
    victoria: [[function (api) { return api.has('QUETE'); }, 'Le train de Douvres, quand vous serez prêt à partir pour le continent.']],
    stjohn: [[function (api) { return api.sait('INCENDIE'); }, 'Ce qui reste de la maison de Smith, après l’incendie.']],
    archives: [[function (api) { return api.has('TRAIN') || api.has('ALEXIS') || api.has('MAQUETTE'); }, 'Les vieux journaux, pour l’histoire du train et de ses propriétaires.'],
      [function (api) { return api.sait('VOLATILISE'); }, 'Les vieux journaux, pour l’homme parti en fumée.'],
      [function (api) { return api.sait('MEURTRES'); }, 'Les vieux journaux, pour le passé de Makryat.']],
    vane: [[function (api) { return api.has('VOIX'); }, 'La médium chez qui une voix vous a parlé.'],
      [function () { return true; }, 'Le salon de la médium que Smith avait démasquée.']],
    pub: [[function () { return true; }, 'Une pinte et un coin de banquette, en face du British Museum.']],
    eglise: [[function () { return true; }, 'Un moment de calme, à l’abri du brouillard.']],
    quais: [[function () { return true; }, 'Marcher au bord de la Tamise, et réfléchir.']]
  };
  function pourquoi(api, id) {
    var l = POURQUOI[id] || [];
    for (var i = 0; i < l.length; i++) { try { if (l[i][0](api)) return l[i][1]; } catch (e) { /* rien */ } }
    return null;
  }
  function destChips(api) {
    return Object.keys(PLACES).filter(function (k) { return k !== zone(api.s.loc) && known(api, k) && k !== 'institut' && pourquoi(api, k); })
      .map(function (k) { return { label: 'Aller : ' + PLACES[k].label, action: 'go_' + k, pourquoi: pourquoi(api, k) }; });
  }
  function taxi(api, dest) {
    var lines = [
      'Un taxi vous emporte à travers le brouillard. Les réverbères passent comme des lunes malades.',
      'Le taxi se faufile entre les omnibus et les charrettes. Londres n’est qu’une suite de halos jaunes dans le gris.',
      'Vous prenez le métro, puis un omnibus. Le brouillard s’est glissé jusque dans les couloirs du souterrain.',
      'Le chauffeur roule au pas : on ne voit pas à dix mètres. Quelque part, une corne de brume répond à une autre.'
    ];
    if (hour(api.s.min) >= 22 || hour(api.s.min) < 6) lines = ['Vous trouvez un taxi de nuit, le chauffeur à moitié endormi. Les rues sont vides, luisantes.', 'Londres dort sous son brouillard. Vos pas, puis le moteur du taxi, sont les seuls bruits de la ville.'];
    api.say(api.fresh('taxi', lines));
    api.time(40);
    api.go(dest);
  }

  // ---------------------------------------------------------------- PNJ : valeurs par défaut
  function npc(def) {
    var base = {
      patience: 6, cooldown: 30,
      repeat: [
        ['« Je vous l’ai déjà dit, {m}. »', '« Comme je vous le disais… »', '« Vous m’avez déjà posé la question, {m}. »'],
        ['Un soupir, à peine poli.', '« Encore ? »', '« Je ne vois pas ce que je pourrais ajouter, {m}. »'],
        ['Pas de réponse. Un regard vers la porte.', 'Un silence épais.', 'On vous regarde comme on regarde la pluie.']
      ],
      deflect: ['« Pardon ? »', '« Je ne suis pas sûr de vous suivre, {m}. »', 'Un haussement de sourcils poli.'],
      deflect2: ['« Je crains de ne pas comprendre. »', '« Où voulez-vous en venir ? »'],
      deflect3: ['On ne vous répond plus vraiment.', '« Hm. »'],
      close: ['« Si vous voulez bien m’excuser, {m}. » La conversation est terminée.'],
      refuse: ['« Pas maintenant, {m}. »', 'On fait mine de ne pas vous voir.', 'Rien. Pour l’instant, on ne vous parlera plus.'],
      reopen: '« Oui ? »',
      greetAlt: ['« Oui ? »', '« {M} ? »'],
      byeAlt: ['« {M}. »', 'Un signe de tête.'],
      noMore: ['« C’est tout ce que je sais. »', '« Je n’ai rien d’autre, {m}. »']
    };
    for (var k in base) if (def[k] === undefined) def[k] = base[k];
    def.topics.push({ id: 'poli', keys: ['POLI'], run: function (api) { api.npc(def.id, api.fresh('poli:' + def.id, ['« Je vous en prie. »', '« Il n’y a pas de quoi. »'])); } });
    def.topics.push({ id: 'aurevoir', keys: ['AUREVOIR'], chip: 'Prendre congé', run: function (api) { api.endTalk(); } });
    return def;
  }
  function T(id, keys, lines, extra) { var t = { id: id, keys: keys }; if (typeof lines === 'function') t.run = lines; else t.lines = lines; if (extra) for (var k in extra) t[k] = extra[k]; return t; }

  // ---------------------------------------------------------------- le discours de « Smith »
  function speech(api) {
    if (api.flag('discours')) return;
    api.flag('discours', true);
    api.npc('brule', '« Dieu merci, vous êtes venus. » La voix n’est qu’un souffle râpeux. « Je ne pourrai pas parler longtemps. Écoutez-moi, et Beddows répondra pour moi. »');
    api.npc('brule', '« Je suivais la trace d’un objet… le simulacre de Sedefkar. Une statue très ancienne, d’une puissance mauvaise. On l’a démontée à la fin du siècle des Lumières, et ses morceaux se sont dispersés à travers l’Europe. Je voulais les retrouver, et la détruire. »');
    var dd = day(api.s.min) - 1, quand = dd <= 0 ? 'Cette nuit' : dd === 1 ? 'Hier soir' : 'Samedi soir';
    api.npc('brule', '« ' + quand + ', des Turcs ont attaqué ma maison. Ils cherchent la statue, eux aussi, pour s’en servir. Nous nous sommes barricadés, ils ont mis le feu. Nous avons fui. Mes notes ont brûlé, à moins qu’ils ne les aient prises. Il faut que vous la trouviez avant eux. »');
    api.npc('brule', 'Il reprend son souffle, longtemps. « Voici ce dont je me souviens. C’est à Paris qu’on l’a démembrée : elle appartenait à un comte Fenalik, qui l’a perdue juste avant la Révolution. Un morceau est peut-être resté en France. Les soldats de Bonaparte en ont emporté un à Venise, vendu à un certain Alvise de Gremanci. Un autre est parti vers Trieste à la même époque : cherchez le nom de Winckelmann, au musée de la ville. »');
    api.npc('brule', '« Il y en a peut-être un en Serbie : voyez le docteur Milovan Todorovic, conservateur du musée de Belgrade. Un autre a été caché près de Sofia, pendant la guerre de 1875, enterré peut-être. Le dernier circulait à Paris juste après la Grande Guerre, et quelqu’un de Milan l’a acheté. Je ne sais pas qui. »');
    api.npc('brule', '« Quand vous l’aurez entière… il n’y a qu’un moyen sûr. La rapporter là où elle est née, à Constantinople, dans un lieu qu’on appelle la Mosquée Maudite. Il y a des niches, où elle reposait. Le rituel qui la détruira se trouve dans des documents qu’on nomme les rouleaux de Sedefkar. Je n’ai jamais pu les consulter. » Sa voix se brise. « Je suis désolé, mes amis. Allez. Allez vite. Que Dieu vous garde. »');
    api.say('Il tousse. Beddows lui tend un verre, dont il boit une gorgée, puis il retombe sur l’oreiller, les yeux fermés. Il ne parlera plus ce soir.');
    api.clue('QUETE'); api.clue('PISTES');
    api.say('Beddows garde les yeux baissés. Sans un mot, il ouvre un placard et en sort une valise. À l’intérieur, des liasses de billets neufs de la Banque d’Angleterre : mille livres.');
    api.npc('beddows', '« Mon maître vit chichement par prudence, pour échapper à ces hommes. Il tient à contribuer à votre voyage, sans rien exiger en retour. Avant cette horreur, il comptait prendre le Simplon-Orient-Express. Le plus rapide, le plus sûr, le plus confortable du continent. Et mon maître a l’habitude de son confort. »');
    api.take(VALISE); api.s.money += 1000;
  }
  // si l'investigateur force la main de l'imposteur
  function unmask(api) {
    if (api.flag('demasque') || api.flag('cheapsideFini')) return;
    api.flag('demasque', true);
    api.endTalk(false);
    api.fx('flicker');
    api.say('À l’instant où vous tendez la main, l’air de la chambre devient brûlant. Une lueur bleue danse au-dessus du lit, puis une flamme sans mèche ni combustible se jette sur la silhouette couchée. La figure brûlée hurle : « Ils m’ont retrouvé ! » Le drap s’embrase. Une fumée épaisse et suffocante remplit la pièce.');
    api.say('Vous êtes rejeté{e} contre le mur. Quelqu’un crie, une chaise tombe, la fenêtre claque. Quand la fumée se dissipe enfin, le lit n’est plus qu’un tas de cendres tièdes, et Beddows gît près de la porte, immobile, les yeux encore ouverts sur quelque chose qu’il n’a pas compris.');
    api.check('san_vampire');
  }

  var L = {
    id: 'londres',
    title: 'L’Express de minuit',
    chapter: 'Londres · Danseurs dans le brouillard',
    tick: 5, talkTick: 2,
    sanLabels: BASE.sanLabels,
    perceive: BASE.perceive,
    money: function (n) {
      var l = Math.floor(n + 1e-9), sh = Math.round((n - l) * 20), d = 0;
      if (sh === 20) { l += 1; sh = 0; }
      return l.toLocaleString('fr-FR') + ' £' + (sh ? ' ' + sh + ' shillings' : '');
    },
    beforeAction: function (api, a) {
      if (api.sanState() < 3 || /^wagon|^retour/.test(api.s.loc) || /^g_etat|^g_meta|^go_/.test(a.id)) return false;
      if (api.rand() > 0.12) return false;
      var what = a.label.charAt(0).toLowerCase() + a.label.slice(1);
      api.say(api.cycle('involontaire', [
        'Vous vouliez ' + what + '. Vous vous retrouvez devant une vitre, à étudier votre reflet, du bout des doigts sur la joue, pour vérifier que la peau tient. Une minute a passé. Peut-être deux.',
        'Vous alliez agir. Puis vous avez compté les visages autour de vous, un par un, en vous demandant lesquels étaient vrais. Vous ne savez plus ce que vous vouliez faire.',
        'Vos mains frottent vos poignets, longtemps, comme pour en ôter quelque chose. Quand vous vous arrêtez, la peau est rouge, et vous avez oublié ce que vous vouliez faire.'
      ]));
      api.time(5);
      return true;
    },
    onMadness: function (api) {
      api.fx('madness');
      api.event('Quelque chose cède. Pendant un long moment, vous n’êtes plus sûr{e} que le visage que vous portez soit le vôtre. Quand vous reprenez vos esprits, vous êtes assis{e} par terre, et vos ongles ont laissé des marques rouges sur vos joues.');
    },
    start: { loc: 'institut', min: at(0, 20, 15), money: 40, inv: [] },
    investigator: null,

    clock: function (min) {
      var d = day(min), wd = JOURS[(4 + d) % 7];
      return wd.charAt(0).toUpperCase() + wd.slice(1, 3) + ' ' + (5 + d) + ' · ' + pad(hour(min)) + ' h ' + pad(min % 60);
    },
    where: function (min) {
      var h = hour(min), mom = h < 6 ? 'nuit' : h < 12 ? 'matin' : h < 18 ? 'après-midi' : h < 22 ? 'soir' : 'nuit';
      return 'Londres · ' + (5 + day(min)) + ' janvier 1923 · ' + mom;
    },

    // -------------------------------------------------------------- vocabulaire propre à Londres
    phrases: [
      [/\b(la |une )?valise (dans|du|qui roule dans) (le )?couloir\b|\bla valise qui roule\b/g, ' couloir '],
      [/\b(la |une )?(dame|voisine|cliente|vieille dame) du (deuxieme|2e|second)( etage)?\b|\bpas au plafond\b|\bdeuxieme etage\b/g, ' damedeuxieme '],
      [/\bscotland yard\b|\bnew scotland yard\b/g, ' yard '],
      [/\b(porte\w*|porter|depose\w*|deposer|retire\w*|retirer) (t il |t elle )?(pas |jamais |plus )?(une |de |sa |la )?plainte\b/g, ' plainte '],
      [/\b(l |un |cet |ce |le )?(homme|monsieur|type|inconnu|individu) (brun|aux cheveux noirs|aux cheveux bruns|qui (m |nous )?(observait|regardait|epiait|fixait|surveillait))\b|\b(le |un )?grand brun\b/g, ' moustachu '],
      [/\bchelsea arms\b/g, ' chelsea '],
      [/\bbritish museum\b|\bsalle de lecture\b|\breading room\b/g, ' musee '],
      [/\bstoke newington\b/g, ' stoke '],
      [/\bbrophy lane\b/g, ' islington '],
      [/\binstitut imperial\b|\bimperial institute\b/g, ' institut '],
      [/\bgare victoria\b|\bvictoria station\b|\bgare de victoria\b/g, ' victoria '],
      [/\bhomme (brule|sur le lit|dans le lit|blesse|couche)\b|\bgrand brule\b|\b(le|du|au|ce) (blesse|malade)\b/g, ' brule '],
      [/\b(m |s |me |se |vous )?(approche[rz]?|penche[rz]?) (du|de|de la|vers le|sur le) (lit|brule)\b/g, ' examiner brule '],
      [/\b(mehmet )?makryat\b/g, ' makryat '],
      [/\bsimulacre( de sedefkar)?\b|\bstatue de sedefkar\b/g, ' simulacre '],
      [/\brouleaux( de sedefkar)?\b/g, ' rouleaux '],
      [/\bmosquee maudite\b/g, ' mosquee '],
      [/\borient express\b|\bsimplon orient( express)?\b/g, ' orientexpress '],
      [/\btrain fantome\b|\bdoom train\b/g, ' fantome '],
      [/\b(me |se |nous )?(documente[rz]?|renseigne[rz]?|informe[rz]?)\b/g, ' rechercher '],
      [/\b(qu est ce qui|que|qu|ce qui) (vous|t|lui|leur|nous) (est|es|a|sont) (il |elle |ils )?arrive\w*\b|\b(que|qu est ce qui) s est (il )?passe\b|\bce qui s est passe\b/g, ' histoire '],
      [/\b(retourne[rz]?|soulev\w*) (les |des |un |le |la )?(wagons?|voitures?|locomotive)\b|\b(dessous|sous) (des |les )?(wagons|voitures)\b|\b(les |des )?(wagons|voitures) de pres\b/g, ' examiner symboles '],
      [/\btrain (miniature|electrique|jouet|modele)\b|\bmaquette( de train)?\b|\btrain set\b|\bpetit train\b/g, ' maquette '],
      [/\bsignal d alarme\b/g, ' alarme '],
      [/\b(faire|fais|fait|faites|je fais) (tourner|rouler|circuler|marcher)\b|\bmettre en marche\b|\bmets en marche\b|\bbranche[rz]?\b|\bdemarre[rz]?\b/g, ' actionner '],
      [/\bmrs atkins\b|\bmadame atkins\b|\bmme atkins\b/g, ' atkins '],
      [/\barthur butter\b|\bm butter\b|\bmonsieur butter\b|\bmr butter\b/g, ' butter '],
      [/\bhenry stanley\b/g, ' stanley '],
      [/\brandolph alexis\b|\balbert alexis\b/g, ' alexis '],
      [/\bmustapha( koprulu)?\b/g, ' mustapha '],
      [/\binspecteur( fleming)?\b/g, ' fleming '],
      [/\bsergent rigby\b/g, ' rigby '],
      [/\bcarte de visite\b|\bcarte (de|du) (smith|professeur)\b/g, ' cartevisite '],
      [/\bcarte de lecteur\b|\bcarte d admission\b/g, ' carte '],
      [/\b(livre|livres|registre|registres) de comptes?\b|\bgrand livre\b|\blivres? de compte\b/g, ' registre '],
      [/\bou aller\b|\bplan de londres\b|\bcarte de londres\b|\blieux connus\b/g, ' destinations '],
      [/\bbillets? de train\b|\bbillets? pour paris\b|\bwagons? lits\b/g, ' billets '],
      [/\bbillets? de banque\b|\bmille livres\b/g, ' billetsdebanque '],
      [/\bpapier peint\b/g, ' papierpeint '],
      [/\bfaits divers\b/g, ' faitsdivers '],
      [/\bsous sol\b/g, ' soussol '],
      [/\bau dela\b/g, ' audela '],
      [/\btrente neuf\b|\b39 ans\b/g, ' trenteneuf '],
      [/\b(son|l|leur) age\b|\bquel age (avait|a|aurait|a t) (il|t il|makryat|le turc)\b|\bage (de|du) (makryat|turc|vrai)\b|\bdate de naissance\b/g, ' naissance '],
      [/\b(un |l |cet )?article\b|\bgazettes?\b|\bla presse\b|\bles quotidiens\b/g, ' journal '],
      [/\b(vous|tu) n (etes|es) pas (smith|le professeur|lui)\b|\bimposteur\b|\bvous mentez tous\b|\bce n est pas (smith|lui|le professeur)\b/g, ' demasquer '],
      [/\b(ouvrir|tirer|ecarter|ouvre|tire|ecarte) (les )?rideaux\b|\ballumer (la )?(lampe|lumiere)\b|\ballume (la )?(lampe|lumiere)\b/g, ' eclairer '],
      [/\b(arracher|retirer|enlever|defaire|arrache|retire|enleve|defais) (les |ses )?(bandages|pansements)\b/g, ' demasquer bandages ']
    ],
    lexicon: function (Lx) {
      // lieux et objets génériques de Londres
      Lx.add('SALLE', 'n', 'salle, piece, alentours, autour, endroit, lieu, lieux, decor, ambiance, environs, hall, galerie, interieur, rue, ruelle, quartier', { label: 'les lieux' });
      Lx.add('CHAMBRE', 'n', 'chambre, chambres, armoire, armoires', { label: 'la chambre' });
      Lx.add('COULOIR', 'n', 'couloir, corridor, ascenseur, couloirs', { label: 'le couloir' });
      Lx.add('DAMEDEUX', 'n', 'damedeuxieme, gresham', { label: 'la dame du deuxième' });
      Lx.add('TABLE', 'n', 'table, tables, nappe, bureau, pupitre, pupitres, chaise, chaises, fauteuil, fauteuils', { label: 'la table' });
      Lx.add('BOISSON', 'n', 'cafe, the, boisson, boissons, biere, vin, champagne, whisky, gin, porto, sherry, coupe, coupes, verre, verres, cognac, alcool, grog, cocktail', { label: 'une boisson' });
      Lx.add('LAMPE', 'n', 'lampe, lampes, lumiere, lumieres, eclairage, bougie, bougies, ampoule, reverbere, reverberes, lustre, lustres, chandelle', { label: 'la lumière' });
      Lx.add('FENETRE', 'n', 'fenetre, fenetres, vitre, vitres, carreau, carreaux, dehors, exterieur, brouillard, rideau, rideaux, vitrine, volets, persiennes, guillotine', { label: 'la fenêtre' });
      Lx.add('PORTE', 'n', 'porte, portes, issue, sortie, serrure, verrou, palier, seuil, entree, portiere', { label: 'la porte' });
      Lx.add('NOTE', 'n', 'note, mot, message, lettre, missive, pli', { label: 'la note' });
      Lx.add('LIVRE', 'n', 'livre, livres, ouvrage, ouvrages, catalogue, catalogues, revue, revues, magazines, bouquin, bouquins, volumes, traite, horaires', { label: 'les livres' });
      Lx.add('TRAIN', 'n', 'train, trains, locomotive, locomotives, ferroviaire, wagon, wagons, voiture, voitures, rails, vapeur, express, convoi', { label: 'le train' });
      Lx.add('COMPARTIMENT', 'n', 'compartiment, compartiments, cabine, banquette, banquettes', { label: 'le compartiment' });
      Lx.add('TAXI', 'n', 'taxi, taxis, fiacre, omnibus, metro, autobus, tramway, cab', { label: 'un taxi' });
      Lx.add('CLE', 'x', 'cle, cles, clef, trousseau', { label: 'la clé' });
      Lx.add('POLICE', 'x', 'agent, agents, bobby, bobbies, constable, constables');
      // lieux de l'enquête
      Lx.add('HOTEL', 'n', 'hotel, bloomsbury, groom, portier, chasseur', { label: 'votre hôtel' });
      Lx.add('RECEPTION', 'n', 'reception, receptionniste, concierge, pratt, accueil, gerant, liftier', { label: 'la réception', npc: true });
      Lx.add('INSTITUT', 'n', 'institut, kensington, challenger, fondation, banquet', { label: 'l’Institut impérial' });
      Lx.add('CONFERENCE', 'x', 'conference, expose, discours, sujet, theme, causerie, intervention', { label: 'la conférence' });
      Lx.add('HANTISE', 'x', 'hantise, hantises, hante, hantee, apparition, apparitions, phenomene, phenomenes, paranormal, surnaturel, spiritisme, medium, mediums, voyante, voyantes, tricheur, tricheurs', { label: 'les hantises' });
      Lx.add('CHEAPSIDE', 'n', 'cheapside, garni, meuble, city', { label: 'Cheapside' });
      Lx.add('CHELSEA', 'n', 'chelsea', { label: 'le Chelsea Arms' });
      Lx.add('YARD', 'n', 'yard, commissariat, poste', { label: 'Scotland Yard' });
      Lx.add('AMBASSADE', 'n', 'ambassade, consulat, turquie, belgravia, diplomate, diplomates', { label: 'l’ambassade de Turquie' });
      Lx.add('ISLINGTON', 'n', 'islington, boutique, magasin, echoppe, antiquites', { label: 'la boutique d’Islington' });
      Lx.add('MUSEE', 'n', 'musee, bibliotheque, archives, coupole, documentation', { label: 'le British Museum' });
      Lx.add('STOKE', 'n', 'stoke, newington, pension', { label: 'Stoke Newington' });
      Lx.add('CAMBERWELL', 'n', 'camberwell', { label: 'Camberwell' });
      Lx.add('ASSOCIATION', 'x', 'association, club, membres, membre, amateurs, passionnes, reunion', { label: 'l’Association' });
      Lx.add('VICTORIA', 'n', 'victoria, quai, quais, ferry, douvres, calais, continent', { label: 'la gare Victoria' });
      Lx.add('DESTINATIONS', 'x', 'destinations, itineraire, adresses', { label: 'les lieux connus' });
      Lx.add('CAVE', 'n', 'cave, soussol, cellier, soupirail', { label: 'la cave' });
      // personnages
      Lx.add('SMITH', 'n', 'smith, julius, professeur, prof, conferencier, orateur', { label: 'le professeur Smith', npc: true });
      Lx.add('BEDDOWS', 'n', 'beddows, valet, majordome, domestique, james, serviteur', { label: 'Beddows', npc: true });
      Lx.add('BRULE', 'n', 'brule, bandages, pansements, brulures, brulure, visage, grabat, silhouette, homme alite, alite', { label: 'l’homme sur le lit', npc: true });
      Lx.add('FLEMING', 'n', 'fleming', { label: 'l’inspecteur Fleming', npc: true });
      Lx.add('RIGBY', 'n', 'rigby, pompiers, rouquin', { label: 'le sergent Rigby', npc: true });
      Lx.add('SERGENT', 'n', 'sergent, brigadier, hobbs, planton', { label: 'le sergent', npc: true });
      Lx.add('MUSTAPHA', 'n', 'mustapha, koprulu, attache, fonctionnaire, secretaire', { label: 'l’attaché', npc: true });
      Lx.add('VOISIN', 'n', 'voisin, voisins, buraliste, commercant, commercants, tabac, marchand', { label: 'le buraliste', npc: true });
      Lx.add('ATKINS', 'n', 'atkins, constance, logeuse, proprietaire, bigoudis', { label: 'Mrs Atkins', npc: true });
      Lx.add('BUTTER', 'n', 'butter, president', { label: 'Arthur Butter', npc: true });
      Lx.add('ALEXIS', 'n', 'alexis, randolph, albert, occultiste, chauve', { label: 'Randolph Alexis', npc: true });
      Lx.add('STANLEY', 'n', 'stanley, henry', { label: 'Henry Stanley', npc: true });
      Lx.add('BIBLIOTHECAIRE', 'n', 'bibliothecaire, conservateur, gardien, lorgnon', { label: 'le conservateur', npc: true });
      Lx.add('PASSAGERSMORTS', 'n', 'morts, defunts, spectres, revenants, cadavres, cadavre, zombies', { label: 'les passagers morts' });
      Lx.add('PLAINTE', 'x', 'plainte, plaintes, poursuites, inculpation, inculpe, accusation, chefs d accusation', { label: 'la plainte' });
      Lx.add('MOUSTACHU', 'n', 'moustachu, moustache, moustaches, observateur, espion, guetteur', { label: 'l’homme à la moustache' });
      // sujets de l'enquête
      Lx.add('MAKRYAT', 'n', 'makryat, mehmet', { label: 'Makryat' });
      Lx.add('MEURTRES', 'x', 'meurtres, meurtre, assassinat, assassinats, crime, crimes, victimes, victime, poignardes, poignarde, homicide, tueur, assassin', { label: 'les meurtres' });
      Lx.add('ECORCHES', 'x', 'ecorches, ecorche, ecorcher, peau, peaux, depece, depeces, depouille', { label: 'les corps' });
      Lx.add('TURCS', 'x', 'turc, turcs, turque, turques, ottoman, ottomans', { label: 'les Turcs' });
      Lx.add('PASSEPORT', 'x', 'passeport, passeports, papiers, visa, dossier, dossiers, registre d etat civil', { label: 'les passeports' });
      Lx.add('AGE', 'x', 'vieux, vieillard, barbe, voute, annees, naissance, trenteneuf', { label: 'son âge' });
      Lx.add('INCENDIE', 'x', 'incendie, incendies, flammes, sinistre, essence, cendres, wood', { label: 'l’incendie' });
      Lx.add('SIMULACRE', 'n', 'simulacre, sedefkar, segments, fragments, statue, statuette, idole', { label: 'le simulacre de Sedefkar' });
      Lx.add('ROULEAUX', 'n', 'rouleaux, manuscrits, parchemins, topkapi', { label: 'les rouleaux de Sedefkar' });
      Lx.add('MOSQUEE', 'n', 'mosquee, constantinople, istanbul, stamboul', { label: 'la Mosquée Maudite' });
      Lx.add('PISTE', 'n', 'fenalik, gremanci, venise, trieste, winckelmann, belgrade, todorovic, sofia, milan, pistes, piste', { label: 'les pistes de Smith' });
      Lx.add('OCCULTE', 'x', 'occulte, occultisme, esoterisme, sorcellerie, demon, demons, mysticisme, audela', { label: 'l’occultisme' });
      Lx.add('VOYAGE', 'x', 'orientexpress, simplon, voyager, voyage, trajet, balkans', { label: 'le voyage' });
      Lx.add('JOURNAL', 'n', 'journal, journaux, times, scoop, quotidien, une, entrefilet, faitsdivers', { label: 'le journal' });
      Lx.add('CARTEVISITE', 'n', 'cartevisite, enveloppe, cachet, chevaliere, cire, sceau', { label: 'la carte de Smith' });
      Lx.add('CARTE', 'n', 'carte, lecteur, admission, inscription, laissezpasser', { label: 'la carte de lecteur' });
      Lx.add('VALISE', 'n', 'valise, liasses, billetsdebanque', { label: 'la valise' });
      Lx.add('BILLETS', 'n', 'billets, billet, reservation, reserver, cook, wagonslits, guichet', { label: 'les billets' });
      Lx.add('ANNUAIRE', 'n', 'annuaire, bottin, guide, telephone', { label: 'l’annuaire' });
      Lx.add('REGISTRE', 'n', 'registre, registres, factures, comptabilite, comptes, ventes, achats, colonnes', { label: 'les registres' });
      Lx.add('ETAGE', 'n', 'etage, escalier, appartement, logement, commode, tiroirs, tiroir', { label: 'l’étage' });
      Lx.add('MAQUETTE', 'n', 'maquette, modele, miniature, jouet, circuit, voie, tender, wrightson, pile', { label: 'la maquette' });
      Lx.add('MOUCHOIR', 'n', 'mouchoir, initiales, dessous, planche, socle', { label: 'le dessous de la planche' });
      Lx.add('SYMBOLES', 'n', 'symboles, signes, gravures, essieux, chassis', { label: 'les dessous des wagons' });
      Lx.add('FANTOME', 'n', 'fantome', { label: 'le train fantôme' });
      Lx.add('SUIE', 'n', 'suie, fumee, papierpeint, plafond, marques, trainees, trainee, cloques, cloque, salissures', { label: 'les traces de suie' });
      Lx.add('TRACES', 'n', 'traces, trace, empreintes, tapis, sol, plancher, moquette, parquet, taches, tache, ecartement', { label: 'les traces' });
      Lx.add('COEUR', 'n', 'coeur, motif, figure, huit, dessin, entrailles, abats, rampes, rampe, relief, hauteur, cales, pentes, pente, niveaux, boyaux', { label: 'le motif au sol' });
      Lx.add('LEVIER', 'n', 'levier, leviers, machiniste, mecanicien, manettes, foyer, chaudiere, cabine de la locomotive, cabine de conduite, poste de conduite', { label: 'la cabine de la locomotive' });
      Lx.add('OS', 'n', 'os, ossements, squelette, restes, lambeaux, breloque', { label: 'les ossements' });
      Lx.add('PROJECTEUR', 'n', 'projecteur, diapositives, plaques, ecran, projection, projections, photographies, photos, cliches', { label: 'les projections' });
      Lx.add('FILS', 'x', 'fils, heritier, rejeton', { label: 'son fils' });
      Lx.add('RETOUR', 'x', 'retour, terre, ramener, echapper, evasion, evader, fuir, fuite, liberte', { label: 'le retour' });
      // gestes propres au chapitre
      Lx.add('DONNER', 'v', 'proposer, propose, proposons, suggerer, suggere');
      Lx.add('ATTAQUE', 'x', 'attaque, attaques, attaquer, attaquee, attaques, agression, agresseurs, assaillants, attaquants, cambrioleurs, cambriolage, incendiaires', { label: 'l’attaque' });
      Lx.add('PLAN', 'x', 'plan, plans, projet, intention, intentions, solution, moyen, strategie', { label: 'le plan' });
      Lx.add('HISTOIRE', 'x', 'histoire, recit, mesaventure', { label: 'son histoire' });
      Lx.add('IMPOSTEUR', 's', 'demasquer, imposture, usurpateur, mascarade, comedie, simulateur');
      Lx.add('LUMIERE', 'v', 'eclairer, illuminer');
      Lx.add('EMPRUNTER', 'v', 'emprunter, empruntez, confier, confiez');
      Lx.add('CREDIT', 's', 'references, recommandation, relations, reputation, influence, credit');
    },

    // -------------------------------------------------------------- indices
    clues: {
      CONFERENCE: { title: 'La conférence de Smith', text: 'Les hantises seraient des tentatives de retour, depuis un ailleurs, à travers les « rideaux de la perception ».' },
      OBSERVATEUR: { title: 'L’homme à la moustache', text: 'Au banquet, un homme brun d’une quarantaine d’années vous observait. Surpris, il s’est excusé d’un geste et a disparu.' },
      MEURTRES: { title: 'Trois fois le même mort', text: 'Trois hommes poignardés au Chelsea Arms, tous porteurs de papiers au nom de Mehmet Makryat, antiquaire turc.' },
      INCENDIE: { title: 'La maison de Smith a brûlé', text: 'Smith a disparu. On a vu un homme ressemblant à Beddows s’enfuir juste avant l’incendie.' },
      BILLET: { title: 'Le billet de Smith', text: '« Venez sans tarder. Il me reste peu de temps. Que personne ne vous suive. » Une adresse à Cheapside.' },
      QUETE: { title: 'Le simulacre de Sedefkar', text: 'Une statue démembrée, dispersée en Europe. La réunir, puis la détruire dans la Mosquée Maudite de Constantinople grâce aux rouleaux de Sedefkar.' },
      PISTES: { title: 'Les pistes de Smith', text: 'Paris (le comte Fenalik), Venise (Alvise de Gremanci), Trieste (Winckelmann, au musée), Belgrade (Dr Todorovic), Sofia (cachée en 1875), Milan (un acheteur d’après-guerre).' },
      BRULURES: { title: 'Des brûlures qui n’en sont pas', text: 'Des bords trop nets, aucune cloque, et une peau lâche à la lisière des bandages, comme un vêtement trop grand.' },
      VISAGE: { title: 'Un visage qui ne va pas', text: 'Les favoris et la moustache de Smith ont disparu. Brûlés, sans doute. C’est pour ça qu’il paraît si différent. Sans doute.' },
      TELEGRAMME: { title: 'Le télégramme de Paris', text: 'Chacun des trois morts avait reçu le même télégramme : « Venez à Londres immédiatement. Urgent. M. »' },
      ECORCHES: { title: 'Ce que la presse ignore', text: 'Les trois corps étaient en partie écorchés : l’un le torse, l’autre les bras, le dernier les jambes.' },
      ADRESSE: { title: 'La boutique de Makryat', text: '3, Brophy Lane, à Islington. La police l’a fouillée sans rien trouver.' },
      AGE: { title: 'Un vieillard de trente-neuf ans', text: 'Le vrai Makryat est né il y a trente-neuf ans. À Islington, tout le monde connaissait un vieil homme.' },
      DOSSIERS: { title: 'Des dossiers envolés', text: 'À l’ambassade, toutes les pièces avec photographie de Makryat ont disparu.' },
      DEPART: { title: 'Un départ préparé', text: 'Pas de livres, pas de bagages, des tiroirs à moitié vides : Makryat a quitté Brophy Lane de son plein gré.' },
      TRAIN: { title: 'Une vente incongrue', text: 'Un train miniature fait sur commande, acheté à la succession de Randolph Alexis, revendu une livre à Henry Stanley, de Stoke Newington.' },
      STANLEY: { title: 'Disparu dans la fumée', text: 'Henry Stanley s’est volatilisé dans sa chambre fermée de l’intérieur, pleine d’une fumée sans feu.' },
      RAILS: { title: 'Des rails dans la chambre', text: 'Deux traînées de suie parallèles traversent la pièce en diagonale, écartées exactement comme des rails.' },
      MAQUETTE: { title: 'Un modèle de mauvais goût', text: 'La maquette reproduit l’express de Liverpool de 1897, dont la moitié avant n’a jamais été retrouvée.' },
      ALEXIS: { title: 'Les Alexis, père et fils', text: 'Randolph Alexis, occultiste, mort dans le déraillement de 1897. Son fils Albert, disparu chez lui en 1917, dans une pièce pleine de fumée.' },
      BIBLIO: { title: 'Une trace à Paris', text: 'Sur le simulacre, des documents existent à la Bibliothèque nationale de Paris.' },
      ROULEAUX: { title: 'Les rouleaux de Sedefkar', text: 'Juste avant la guerre, ils étaient conservés au musée de Topkapı, à Constantinople.' },
      BEDDOWS: { title: 'Beddows est mort', text: 'Le cadavre écorché du British Museum était celui de James Beddows. Qui donc était couché dans le lit de Cheapside ?' },
      PEAU: { title: 'Le message sur la peau', text: '« Celui-qui-n’a-pas-de-peau ne se laisse pas refuser. » Écrit en turc, sur une peau humaine.' }
    },

    // -------------------------------------------------------------- jets
    checks: {
      toc_observateur: { skill: 'Trouver Objet Caché', why: 'remarquer ce qui se passe autour de vous',
        resolve: function (api, r) {
          if (r.success) { api.say('Pendant que vous félicitez Smith, vous sentez un regard. Un homme brun, la quarantaine, une moustache épaisse, vous observe par-dessus une coupe de champagne. Quand vos yeux croisent les siens, il esquisse un geste d’excuse et se fond dans la foule.'); api.clue('OBSERVATEUR'); }
          else api.say('Les félicitations pleuvent, les coupes tintent. Vous ne remarquez rien de particulier, sinon que la soirée est réussie.');
        } },
      toc_journal: { skill: 'Trouver Objet Caché', why: 'repérer un entrefilet en page intérieure',
        resolve: function (api, r) {
          if (r.success) { api.say('Page sept, un entrefilet : la maison du professeur Julius Arthur Smith, à St John’s Wood, a brûlé dans des circonstances mystérieuses. On le recherche, ainsi que son domestique, James Beddows, qu’un témoin aurait vu s’enfuir juste avant le début de l’incendie. Le sergent Rigby, de la brigade des incendies de Scotland Yard, demande à toute personne informée de se manifester.'); api.clue('INCENDIE'); learn(api, 'yard'); }
          else api.say('Vous parcourez le reste du journal : la Ruhr, le mark qui s’effondre, une exposition de chrysanthèmes. Rien qui vous retienne.');
        } },
      san_brule: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d3'], why: 'soutenir la vue de ces brûlures',
        resolve: function (api, r) {
          api.say(r.success ? 'Vous vous forcez à ne pas détourner les yeux. C’est votre ami. C’est seulement de la chair abîmée.' : 'Vous reculez malgré vous. La peau semble avoir coulé, puis s’être figée en plis que la chair ne devrait pas savoir faire.');
          if (!api.flag('ideeFavoris')) { api.flag('ideeFavoris', true); api.check('idee_favoris'); }
        } },
      idee_favoris: { skill: 'INT', why: 'comprendre ce qui vous dérange dans ce visage',
        resolve: function (api, r) {
          if (r.success) { api.say('Vous comprenez ce qui vous gêne : les favoris légendaires de Smith, sa moustache de morse, ont disparu. Brûlés, évidemment. C’est pour ça qu’il paraît si différent.'); api.clue('VISAGE'); }
          else api.say('Quelque chose vous dérange dans ce visage, sans que vous puissiez dire quoi. Les brûlures, sans doute.');
        } },
      medecine_brule: { skill: 'Médecine', why: 'juger ces brûlures en médecin',
        resolve: function (api, r) {
          if (r.success) { api.say('Vous en avez vu, des brûlés, à l’hôpital de campagne. Ceux-là ne ressemblent à rien de connu : pas de cloques, pas de suintement, des bords trop nets. Et la peau, à la lisière des bandages, est souple, presque lâche, comme celle d’un vêtement trop grand. Vous chassez cette idée absurde. Sans doute.'); api.clue('BRULURES'); }
          else api.say('De vilaines brûlures, mal soignées. Il faudrait l’hôpital, et vite. Mais Beddows ne vous laissera pas faire.');
        } },
      psy_beddows: { skill: 'Psychologie', why: 'lire ce que ressent Beddows',
        resolve: function (api, r) {
          api.say(r.success ? 'Beddows est terrifié. Ses mains tremblent, il évite votre regard et surveille sans cesse le lit. Rien d’étonnant, après ce qu’ils ont vécu.' : 'Beddows est nerveux, mais qui ne le serait pas ?');
        } },
      san_vampire: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d6'], why: 'garder la raison',
        resolve: function (api) {
          api.say('Dans les cendres, à côté de la valise de Beddows, une feuille arrachée a échappé aux flammes : une liste de lieux et de noms, de l’écriture pointue de Smith.');
          if (!api.item(VALISE)) { api.take(VALISE); api.s.money += 1000; }
          api.clue('QUETE'); api.clue('PISTES');
          api.event('Des portes s’ouvrent dans l’escalier, quelqu’un appelle la police. Il ne faut pas rester ici.');
        } },
      baratin_yard: { skill: 'Baratin', why: 'glaner une information auprès des agents',
        resolve: function (api, r) {
          if (!r.success) { api.say('Les agents se méfient des curieux aujourd’hui. On vous raccompagne poliment vers la sortie. Vous pourrez retenter votre chance demain.'); return; }
          if (!api.sait('MEURTRES')) {
            api.say('Un jeune agent, flatté qu’on l’écoute, baisse la voix : l’affaire du jour, c’est le Chelsea Arms. Trois hommes poignardés dans la même chambre, et tous les trois avec des papiers au nom d’un certain Makryat. « L’inspecteur Fleming n’en dort plus. »');
            api.clue('MEURTRES'); learn(api, 'chelsea'); learn(api, 'ambassade'); return;
          }
          var order = ['TELEGRAMME', 'ECORCHES', 'ADRESSE'].filter(function (c) { return !api.has(c); });
          var c = order[0];
          if (c === 'TELEGRAMME') api.say('Un jeune agent, flatté qu’on l’écoute, baisse la voix : chacun des trois morts avait dans sa poche le même télégramme, envoyé de Paris. « Venez à Londres immédiatement. Urgent. » Signé d’une seule lettre : M.');
          else if (c === 'ECORCHES') api.say('Un brigadier qui sent la pipe vous prend à part, mal à l’aise : la presse ne sait pas tout. Les trois corps étaient en partie écorchés. Le torse pour l’un, les bras pour l’autre, les jambes pour le troisième. « Proprement, comme un boucher. Je n’en dors plus. »');
          else if (c === 'ADRESSE') api.say('Un employé du greffe vous glisse l’adresse que tout le monde cite au bureau : la boutique de Makryat, 3, Brophy Lane, à Islington. « On a tout retourné. Rien. Pas même un livre. »');
          if (c) { api.clue(c); if (c === 'ADRESSE') learn(api, 'islington'); }
          else api.say('Vous avez déjà tiré des agents tout ce qu’ils savaient.');
        } },
      persuasion_mustapha: { skill: 'Persuasion', why: 'qu’il accepte de vous répondre',
        resolve: function (api, r) {
          if (r.success) { api.npc('mustapha', 'Il soupire et ouvre un registre. « Mehmet Makryat, né à Constantinople… il y a trente-neuf ans. Domicilié 3, Brophy Lane, Islington. Passeport renouvelé l’an dernier. » Il referme le registre. « Les autres passeports sont des faux, pas des duplicata. C’est un problème britannique. »'); api.clue('AGE'); learn(api, 'islington'); api.clue('ADRESSE'); }
          else api.npc('mustapha', '« Je regrette, {m}. L’ambassade ne commente pas cette affaire. Les journaux anglais nous ont assez insultés. »');
        } },
      charme_mustapha: { skill: 'Charme', why: 'gagner sa sympathie',
        resolve: function (api, r) {
          if (r.success) { api.npc('mustapha', 'Il jette un coup d’œil vers le bureau de l’ambassadeur, puis se penche. « Je ne devrais pas vous dire ça. Toutes les pièces du dossier Makryat qui portaient une photographie, ou un signalement, ont disparu. Toutes. Personne ne sait comment. L’ambassadeur ne l’admettra jamais. »'); api.clue('DOSSIERS'); }
          else api.npc('mustapha', 'Il sourit poliment, mais son sourire ne monte pas jusqu’aux yeux. « Vous êtes aimable, {m}. »');
        } },
      crochetage_boutique: { skill: 'Crochetage', why: 'ouvrir la porte sans la briser',
        push: 'Vous pourriez vous acharner sur la serrure, au risque d’attirer l’attention.',
        resolve: function (api, r) { boutiqueRes(api, r, 'La serrure cède avec un petit déclic. Vous vous glissez dans la boutique.', 'La serrure résiste. Vos doigts sont trop gourds dans ce froid.'); } },
      for_boutique: { skill: 'FOR', why: 'enfoncer la porte d’un coup d’épaule',
        push: 'Vous pourriez prendre de l’élan et recommencer, plus fort, quitte à réveiller la rue.',
        resolve: function (api, r) {
          if (!r.success && r.pushed) api.hp(-1);
          boutiqueRes(api, r, 'Le vieux bois cède dans un craquement sec. Vous entrez vite, en refermant derrière vous.', 'La porte tient bon. Votre épaule, beaucoup moins.');
        } },
      idee_depart: { skill: 'INT', why: 'remarquer ce qui manque',
        resolve: function (api, r) {
          if (r.success) { api.say('Ce qui frappe, c’est ce qui manque. Pas de malle, pas de valise, seulement une vieille sacoche de cuir à la poignée cassée. Les tiroirs de la commode sont à moitié vides. Makryat n’a pas été enlevé : il est parti, et il a fait ses bagages.'); api.clue('DEPART'); }
          else api.say('Une chambre d’homme seul, propre, presque vide. Rien ne vous saute aux yeux.');
        } },
      compta_registre: { skill: 'Comptabilité', why: 'repérer ce qui détonne dans les comptes',
        push: 'Vous pourriez reprendre les registres page à page, au risque d’y passer la nuit.',
        resolve: function (api, r) {
          if (r.success) { api.say('Une ligne détonne au milieu des cuivres et des tapis : « Un train miniature Wrightson, commande spéciale, acquis à la succession de Randolph Alexis. » Et dans le livre des ventes, la dernière entrée : le même train, vendu une livre à un certain Henry Stanley, de Stoke Newington. Nulle part ailleurs il n’est question de jouets.'); api.clue('TRAIN'); learn(api, 'stoke'); }
          else if (r.pushed) { api.time(240); api.say('Vous y passez des heures, et la nuit tombe sans que les colonnes vous aient rien appris. Une ligne vous a peut-être échappé.'); }
          else api.say('Des colonnes de chiffres, des noms de fournisseurs à Smyrne et à Alep, des ventes aux enchères. Vous n’y voyez rien d’anormal.');
        } },
      credit_musee: { skill: 'Crédit', why: 'obtenir une carte de lecteur',
        resolve: function (api, r) {
          if (r.success) { api.say('Votre nom et vos relations font leur effet : le conservateur signe votre carte de lecteur pour demain matin.'); api.flag('carteMusee', day(api.s.min) + 1); }
          else { api.say('« Il faudra des références universitaires et une lettre précisant vos recherches, {m}. Comptez une semaine. » Vous laissez votre demande. Elle sera examinée dans trois jours.'); api.flag('carteMusee', day(api.s.min) + 3); }
        } },
      biblio_simulacre: { skill: 'Bibliothèque', why: 'trouver une trace du simulacre',
        resolve: function (api, r) {
          if (r.success) api.say('Vous trouvez des allusions éparses à une « statue de Sedefkar » dans des catalogues de collections, mais rien de précis.');
          else api.say('Les catalogues ne mentionnent rien de ce nom. Des heures pour rien, ou presque.');
          api.check('int_simulacre', r.success ? null : { diff: 'difficile' });
        } },
      int_simulacre: { skill: 'INT', why: 'tirer une conclusion de ces bribes',
        resolve: function (api, r) {
          if (r.success) { api.say('En recoupant les notes de bas de page, vous comprenez que toutes ces allusions renvoient au même fonds : des documents conservés à la Bibliothèque nationale, à Paris.'); api.clue('BIBLIO'); }
          else api.say('Les bribes ne s’assemblent pas. Il faudrait chercher ailleurs, ou mieux.');
        } },
      biblio_rouleaux: { skill: 'Bibliothèque', why: 'retrouver la trace des rouleaux',
        resolve: function (api, r) {
          if (r.success) { api.say('Un inventaire d’avant-guerre mentionne des « rouleaux de Sedefkar ». Encore faut-il retrouver la note qui dit où.'); api.check('pou_rouleaux'); }
          else api.say('Aucune trace. Les rouleaux de Sedefkar sont peut-être une légende.');
        } },
      pou_rouleaux: { skill: 'POU', why: 'tenir bon jusqu’à la bonne page',
        resolve: function (api, r) {
          if (r.success) { api.say('Vous tenez bon, et la note est là, au bas d’une page jaunie : les rouleaux étaient conservés au musée de Topkapı, à Constantinople, juste avant la guerre.'); api.clue('ROULEAUX'); }
          else api.say('La lassitude l’emporte. La note existe peut-être, mais pas pour vous aujourd’hui.');
        } },
      occ_alexis: { skill: 'Occultisme', why: 'situer ce nom',
        resolve: function (api, r) {
          if (r.success) { api.say('Le nom vous revient : Randolph Alexis, occultiste de sinistre réputation, lié à des loges hermétiques au tournant du siècle. Un ouvrage récent sur les occultistes anglais précise la suite : mort dans le déraillement de l’express de Liverpool en 1897. Son fils Albert, qui partageait ses lubies, a disparu chez lui en 1917. Quelques gouttes de sang, une pièce pleine de fumée, et rien d’autre.'); api.clue('ALEXIS'); }
          else api.say('Le nom ne vous dit rien, et les fiches ne vous aident guère.');
        } },
      san_cadavre: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d6'], why: 'ne pas crier',
        resolve: function (api, r) {
          api.say(r.success ? 'Vous parvenez à rester debout, une main sur le dossier d’une chaise. Autour de vous, quelqu’un vomit.' : 'Vous ne vous souvenez pas d’avoir crié. On vous le dira plus tard. Vous vous souvenez seulement de la couleur.');
          api.say('Épinglé au revers du manteau, un carré de cuir pâle couvert d’une écriture fine, en turc moderne. Ce n’est pas du cuir.');
          if (api.skill('Langue (turc)') >= 20) { api.say('Vous lisez, et vous regrettez aussitôt de savoir lire : « Celui-qui-n’a-pas-de-peau ne se laisse pas refuser. »'); api.clue('PEAU'); }
          else api.say('Vous ne lisez pas le turc. Le message, recopié par la police, sera traduit dans les journaux du lendemain. Vous le noterez alors.');
          api.say('Le scandale ferme la salle de lecture pour la journée. On vous pousse dehors, sous la pluie. Vous rentrez à pied, sans savoir par quelles rues.');
          api.flag('peauDemain', day(api.s.min) + 1);
          api.go('hotel');
        } },
      san_beddows: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d3'], why: 'chasser cette pensée',
        resolve: function (api, r) { api.say(r.success ? 'Vous repliez le journal, très lentement. Vous ne pouvez rien y faire, pas d’ici.' : 'Vous vous surprenez à toucher votre propre visage, longtemps, pour vérifier qu’il est bien à vous.'); } },
      credit_sergent: { skill: 'Crédit', why: 'qu’il vous parle d’égal à égal',
        resolve: function (api, r) {
          if (r.success) api.npc('sergent', '« Entre nous, {m} : pas un os, pas une goutte de sang, pas une trace de lutte. Un homme ne brûle pas sans laisser de cendres. Il a filé par la fenêtre, voilà tout. »');
          else api.npc('sergent', '« Je ne peux pas en dire davantage, {m}. »');
          api.npc('sergent', '« Le train miniature ? On l’a fait vérifier : aucune panne électrique. On l’a confié à l’Association des amateurs de trains, chez leur président, M. Arthur Butter, à Camberwell. Je vous donne l’adresse, si vous y tenez. »');
          learn(api, 'camberwell');
        } },
      persuasion_sergent: { skill: 'Persuasion', why: 'obtenir un entretien avec le sergent chargé de l’affaire',
        resolve: function (api, r) {
          if (r.success) { api.flag('sergentVu', true); api.say('Le planton finit par aller chercher le sergent chargé de l’affaire Stanley, un grand gaillard aux joues rouges.'); api.talk('sergent'); }
          else { api.flag('sergentRefus', day(api.s.min)); api.npc('planton', '« Le sergent est très occupé, {m}. Tout ce qui est public est dans les journaux. Revenez demain, si vous y tenez. »'); }
        } },
      toc_tapis: { skill: 'Trouver Objet Caché', why: 'voir ce que le tapis sombre cache',
        resolve: function (api, r) {
          if (r.success) { api.say('Sur le tapis à fleurs sombres, deux longues traînées noires, parfaitement parallèles, courent du coin nord-ouest au coin sud-est, dans le même sens que les traces du plafond.'); api.check('idee_rails'); }
          else api.say('Le tapis est sombre et usé. Vous n’y voyez que des fleurs fanées.');
        } },
      idee_rails: { skill: 'INT', why: 'comprendre ce que dessinent ces traces',
        resolve: function (api, r) {
          if (r.success) { api.say('L’écartement vous frappe : exactement celui d’une voie de chemin de fer. Quelque chose de la taille d’un train a traversé cette pièce, de part en part, et l’a remplie de fumée.'); api.clue('RAILS'); }
          else api.say('Deux traînées parallèles. Un meuble qu’on aurait traîné ? Vous n’en tirez rien.');
        } },
      credit_butter: { skill: 'Crédit', why: 'qu’il vous confie la maquette',
        resolve: function (api, r) {
          if (r.success) { api.npc('butter', '« Ma foi, vous avez l’air de gens sérieux. Emportez-la, si ça peut aider. Moi, je serai soulagé quand la police viendra la reprendre. » Il vous aide à la caler dans une caisse de bois.'); api.flag('maquettePretee', true); api.take(MAQ); }
          else api.npc('butter', '« Je ne peux pas la laisser sortir de la maison, vous comprenez. Mais descendez la voir à la cave, si vous voulez. »');
        } },
      san_fantome: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d6'], why: 'ne pas fuir',
        resolve: function (api, r) {
          api.say(r.success ? 'Vous restez là. Vous ne savez pas pourquoi vos jambes vous obéissent encore.' : 'Votre esprit refuse ce qu’il voit et le voit quand même, en entier, sans pouvoir détourner les yeux.');
          api.say('Les passagers descendent. Des hommes en redingote, des femmes en tournure, des enfants en col marin, tous vêtus comme en 1897. Ils glissent sur le sol comme sur un quai et vous posent des questions dont ils n’écoutent pas la réponse.');
          api.arrive('morts'); // les passagers de 1897 descendent du train
          api.npc('morts', api.fresh('mortsQ', ['« À quelle heure arrivons-nous à Liverpool ? »', '« Où est le contrôleur ? »']));
          api.npc('morts', '« Pourquoi ce retard ? Pourquoi fait-il si sombre ? Un autre train nous suit-il ? Mon mari devait le prendre. »');
          api.say('Puis ils se resserrent autour de vous, comme l’eau autour d’une bonde, et parlent d’une seule voix : « Venez avec nous. Venez avec nous. »');
          api.say('Vous n’avez pas bougé. Personne ne vous a touché{e}. Et pourtant vous êtes assis{e} dans une voiture de première classe qui sent le bois mouillé, vêtu{e} de vêtements d’un autre siècle. Par la vitre du wagon suivant, un visage s’écrase contre le verre et hurle sans bruit : Henry Stanley.');
          api.go('wagon1');
        } },
      esquive_morts: { skill: 'Esquive', why: 'vous faufiler entre leurs mains',
        resolve: function (api, r) {
          if (r.success) { api.say('Vous plongez entre deux corps qui se referment trop lentement. Une main froide glisse sur votre nuque, puis plus rien : la porte est là.'); passerPorte(api); }
          else { api.say('Des doigts bleuis se referment sur votre bras. La prise est molle, sans force, et pourtant elle ne lâche pas.'); api.check('for_morts'); }
        } },
      for_morts: { skill: 'FOR', why: 'vous arracher à leur étreinte',
        resolve: function (api, r) {
          if (r.success) { api.say('Vous vous arrachez à l’étreinte et franchissez les derniers mètres en titubant.'); passerPorte(api); }
          else { api.say('Une femme en tournure approche son visage du vôtre. Ses lèvres sont livides, entrouvertes. Elle inspire.'); api.check('chance_baiser'); }
        } },
      chance_baiser: { skill: 'CHANCE', why: 'échapper au baiser',
        resolve: function (api, r) {
          if (!r.success) { api.say('Ses lèvres touchent les vôtres. Quelque chose vous quitte, aspiré comme une flamme de bougie. Vous ne saurez jamais quoi. Puis une poigne tiède vous tire en arrière.'); api.lose(1 + Math.floor(api.rand() * 6)); api.hp(-2); }
          else api.say('Au dernier instant, la voiture fait une embardée, et le visage livide passe à côté du vôtre. Une poigne tiède vous tire en arrière.');
          passerPorte(api);
        } },
      psy_alexis: { skill: 'Psychologie', why: 'cerner ce petit homme',
        resolve: function (api, r) {
          api.say(r.success ? 'Vous en êtes sûr{e} : Randolph Alexis est fou, et dangereux. Sans vous, Stanley aurait fini comme le contenu du premier compartiment.' : 'Un vieil homme épuisé, excentrique, qui a beaucoup souffert. Rien de plus, croyez-vous.');
          if (r.success) api.flag('alexisFou', true);
        } },
      idee_relief: { skill: 'INT', why: 'trouver ce qui cloche dans le motif',
        resolve: function (api, r) {
          if (r.success) reliefTrouve(api);
          else api.say('Vous comparez le motif au souvenir de la maquette, sans voir la différence. Quelque chose, pourtant.');
        } },
      dex_coeur: { skill: 'DEX', why: 'faire un tour complet malgré l’assaut',
        resolve: function (api, r) {
          var left = api.flag('toursRestants') || 0;
          if (r.success) { left -= 1; api.flag('toursRestants', left); api.say(left > 0 ? api.fresh('tourOk', ['Un tour de plus. Les morts griffent les vitres au-dessus de vous.', 'Le tour est bouclé. Stanley sanglote en retenant une porte.', 'Encore un. Alexis compte à voix haute, de plus en plus vite.']) + ' Il en reste ' + left + '.' : 'Le dernier tour se referme sur lui-même.'); }
          else { api.say(api.fresh('tourKo', ['Une main vous agrippe la manche et le tour est perdu.', 'Vous trébuchez sur un os. Le tour ne compte pas.', 'Un passager s’abat dans le compartiment et vous fait lâcher prise.'])); if (api.rand() < 0.5 && api.s.pc.pv > 2) { api.say('Des ongles bleuis vous labourent le bras.'); api.hp(-1); } }
          if (left <= 0) retourTerre(api);
        } },
      ecouter_sifflet: { skill: 'Écouter', why: 'entendre ce qui arrive',
        resolve: function (api, r) {
          api.say(r.success ? 'Loin devant, des coups de sifflet désespérés, encore et encore. Un train de charbon se traîne sur la même voie, et quelqu’un, là-bas, a compris ce qui fonçait sur lui.' : 'Un coup de sifflet, tout proche, déchirant. Devant, sur la même voie, les lanternes rouges d’un convoi de charbon grossissent à vue d’œil.');
          api.say('La collision est inévitable. Les morts se sont tus. Alexis se tourne vers vous avec un sourire d’enfant.');
        } },
      saut: { skill: 'Sauter', label: 'Sauter', why: 'retomber sans vous briser',
        resolve: function (api, r) {
          var dmg = r.success ? 1 + Math.floor(api.rand() * 3) : 1 + Math.floor(api.rand() * 6);
          api.say(r.success ? 'Vous roulez dans la boue glacée d’un champ, le souffle coupé, vivant{e}.' : 'Vous heurtez le sol de plein fouet, roulez dans un fossé, et restez là, le goût du sang dans la bouche.');
          api.hp(-dmg);
          collision(api, false);
        } },
      chance_levier: { skill: 'CHANCE', why: 'trouver le bon levier à temps',
        resolve: function (api, r) {
          if (r.success) { api.say('Vous tirez de toutes vos forces sur le premier levier venu. Les freins hurlent, des gerbes d’étincelles jaillissent des roues, et le train fantôme s’immobilise à quelques mètres du dernier wagon de charbon, dans un nuage de vapeur.'); collision(api, true); }
          else { api.say('Les leviers ne répondent pas, ou répondent mal. Au dernier moment, vous vous jetez hors de la cabine.'); api.hp(-(3 + Math.floor(api.rand() * 5))); collision(api, false); }
        } }
    }
  };

  function passerPorte(api) {
    if (api.flag('porteFranchie')) return;
    api.flag('porteFranchie', true);
    api.say('La porte claque derrière vous. Dehors, les morts gémissent, mais ils ne franchissent pas les signes tracés sur le battant, dont un ankh renversé.');
    api.arrive('alexis'); // il vous attend derrière la porte
    api.npc('alexis', 'Un petit homme chauve en costume élimé reprend son souffle, les yeux brillants de fièvre. « Bienvenue à bord de l’express de 9 h 15 pour Liverpool. Nous avons, hum, un léger retard. Randolph Alexis, pour vous servir. »');
    api.go('wagon2');
  }
  function reliefTrouve(api) {
    if (api.flag('relief')) return;
    api.flag('relief', true);
    api.say('Bien sûr : la maquette d’Albert avait des rampes, des montées, des descentes. Le huit n’est pas plat, il est tordu dans l’espace. Alexis pousse un cri de joie et se met à caler le motif avec des os et des choses que vous préférez ne pas regarder.');
    api.npc('alexis', '« Maintenant, il nous faut un train. » Il vous tend, enveloppé dans un mouchoir taché, quelque chose de lourd et de mou qui palpite encore faiblement. « Faites-le circuler. Autant de tours qu’il faudra. »');
    api.flag('toursRestants', 0);
  }
  function retourTerre(api) {
    if (api.flag('retour')) return;
    api.flag('retour', true);
    var dd = day(api.s.min) + (hour(api.s.min) >= 7 ? 1 : 0);
    api.s.min = dd * D + 7 * 60 + 40; api.s.tick = 0;
    api.say('Sous vos pieds, d’un coup, le battement régulier des roues sur des rails. De vrais rails, de vraies traverses. Par les fenêtres, une campagne anglaise grise sous l’aube d’hiver. Les morts se recroquevillent, certains s’effondrent sur les banquettes, comme si le mouvement les avait quittés. Alexis s’adosse à la vitre, soudain vieux et voûté.');
    api.go('retour');
  }
  function collision(api, arret) {
    if (api.flag('collision')) return;
    api.flag('collision', true);
    if (!arret) api.say('Derrière vous, dans un fracas de fin du monde, la locomotive de 1897 percute les wagons de charbon. La chaudière éclate. Les voitures se plient comme du carton et s’embrasent. Les morts, enfin, ne bougent plus.');
    else api.say('Les voitures fantômes se mettent à fumer doucement, puis à se défaire, planche après planche, comme un rêve qu’on oublie au réveil. Les morts, assis à leurs places, ferment les yeux.');
    api.say('Henry Stanley a sauté, et Randolph Alexis aussi. Ils sont là, couverts de boue. Stanley pleure de joie. Alexis regarde le ciel gris en clignant des yeux comme un enfant.');
    api.sys('Vous avez ramené Henry Stanley parmi les vivants.');
    api.gain(1 + Math.floor(api.rand() * 6));
    api.flag('stanleySauve', true);
    api.go('campagne');
  }

  // ---------------------------------------------------------------- personnages
  L.npcs = {
    morts: { id: 'morts', name: 'Les passagers', topics: [], deflect: ['…'], lieux: ['wagon1', 'wagon2', 'retour'] },
    planton: { id: 'planton', name: 'Le planton', topics: [], deflect: ['…'], lieux: ['stoke', 'yard'] },
    brule: { id: 'brule', name: 'L’homme sur le lit', topics: [], deflect: ['…'] },
    smith: npc({ id: 'smith', name: 'Le professeur Smith', patience: 9, cooldown: 20, selfKeys: ['SMITH'],
      greet: function (api, first) {
        if (api.flag('conference')) api.npc('smith', first ? 'Smith vous serre la main à vous broyer les phalanges. « Alors ? Je les ai un peu secoués, hein ? » Ses moustaches de morse frémissent de plaisir.' : api.fresh('smithG', ['« Ah, vous voilà ! »', 'Il rallume sa pipe infecte. « Oui, oui ? »']));
        else api.npc('smith', first ? 'Smith vous accueille d’un rire qui fait se retourner les tables voisines. « Mon cher {ami} ! Vous êtes venu{e} ! Asseyez-vous près de moi, que j’aie au moins un visage amical dans cette fosse aux lions. »' : '« Bientôt, bientôt ! Laissez-moi relire mes notes. »');
      },
      bye: '« Filez, filez. Nous dînerons ensemble dès que ma maison sera en état. »',
      byeAlt: ['« À bientôt, mon {ami} ! »', 'Il agite sa pipe en guise d’au revoir.', '« Allez, allez, profitez du champagne. »'],
      greetAlt: ['« Encore vous ? Tant mieux ! »', 'Il vous fait de la place à côté de lui.', '« Mon {ami} ! »'],
      noMore: ['« Je n’en sais pas davantage, mon {ami}. »', 'Il hausse les épaules en souriant.', '« Vous voulez une conférence privée ? Prenez rendez-vous ! »'],
      deflect: ['« Hm ? Pardonnez-moi, je n’ai pas saisi. »', 'Il tire sur sa pipe, songeur. « Développez, développez. »', '« Voilà une question que je ne m’attendais pas à entendre ce soir. »'],
      repeat: [['« Je crois vous l’avoir dit, mon {ami}. »', '« Vieillissez-vous plus vite que moi ? »'], ['Il rit, un peu moins fort. « Encore ? »', '« Vous me faites passer un examen ? »'], ['Il se tourne vers un autre invité, avec un clin d’œil désolé.']],
      close: ['« On me réclame, pardonnez-moi ! » Il s’éloigne vers un groupe d’académiciens qui l’attendent.'],
      topics: [
        T('sujet', ['CONFERENCE', 'PROJECTEUR', ['INSTITUT', 0.8]], function (api, n) {
          if (!api.flag('conference')) { api.npc('smith', n === 0 ? '« Le sujet ? Secret absolu, mon {ami} ! Vous le saurez en même temps que ces vieux messieurs. Disons seulement que je vais leur parler de ce qu’ils ne croient pas. »' : '« Patience ! Le meilleur moment d’une conférence, c’est juste avant. »'); return; }
          api.npc('smith', n === 0 ? '« Les hantises, voyez-vous, ne sont pas des fantômes. Ce sont des retours. Des choses, des gens, des lieux qui ont été retirés de notre monde, et qui essaient d’y revenir à travers ce que j’appelle les rideaux de la perception. Et qui échouent, la plupart du temps. »' : '« Si nous étions moins sots, nous pourrions un jour passer de l’autre côté. Ou en faire revenir quelque chose. La question est de savoir quoi. »');
          api.clue('CONFERENCE');
        }, { chip: 'Sa conférence', more: ['« Le fiacre, par exemple. La jument chasse les mouches avec sa queue, tranquillement. Mais tout se passe deux fois plus lentement que chez nous. Comme si elle venait d’un endroit où le temps est plus épais. »', '« Et rien ou presque ne remonte au-delà de cinq ou six siècles. Comme si quelque chose, de l’autre côté, s’usait. »'] }),
        T('hantises', ['PASSAGERSMORTS', 'HANTISE'], function (api, n) {
          api.npc('smith', n === 0 ? '« Un bateau de pêche breton, une Norvégienne dans son escalier, un fiacre de Londres. Photographiés chacun depuis trois angles. Tous à moitié transparents, tous légèrement lumineux, tous au ralenti. »' : '« Je n’en ai jamais vu de solide, hélas. On pourrait attendre plusieurs vies pour cela. »');
        }, { chip: 'Les hantises' }),
        T('visite', [['STJOHN', 0.9], ['ACCOMPAGNER', 0.6]], ['« Chez moi ? Venez quand vous voudrez, {ami}… » Il s’interrompt, le regard ailleurs. « Pas ce week-end, peut-être. J’ai du travail. Beaucoup de travail. Je vous écrirai. »', '« Je vous écrirai, je vous dis. » Il sourit, mais ses doigts tremblent un peu sur sa coupe.'], { cond: function (api) { return api.s.loc === 'institut'; } }),
        T('beddows', ['BEDDOWS'], ['« Beddows ? Mon ombre, mon cuisinier, ma conscience. Il cire mes chaussures et censure mes lettres. Je ne sais pas ce que je ferais sans lui. »', '« Il désapprouve mon tabac depuis vingt ans. Une constance admirable. »'], { chip: 'Beddows' }),
        T('maison', ['HOTEL', ['TOIMEME', 0.7]], ['« Ma maison de St John’s Wood ? Éventrée ! Les ouvriers agrandissent ma bibliothèque. D’où votre hôtel, et toutes mes excuses. Dès que ce sera fini, je vous invite à dîner. Beddows fera son pâté en croûte. »'], { more: ['« Ma femme aurait détesté ces travaux. Margaret est morte en 1919. La grippe. » Il tire sur sa pipe et change de sujet.'] }),
        T('moustachu', ['MOUSTACHU', ['QUELQUUN', 0.8]], function (api, n, p) {
          if (!api.has('OBSERVATEUR')) {
            var regard = /observ|regard|epi|fix|surveill|guett|espion/.test(G.RPG.normalize((p && p.raw) || ''));
            api.npc('smith', regard ? '« Un homme qui nous observe ? Mon {ami}, tout le monde nous observe : je viens de dire à l’Empire britannique que ses fantômes sont réels. »' : '« Un homme à moustache ? » Il balaie la salle d’un geste. « Mon {ami}, ce soir, c’est la moitié de l’Empire. Moi compris. »');
            return;
          }
          api.npc('smith', 'Il plisse les yeux vers la foule. « Brun, une moustache ? Je ne vois pas. Un admirateur. Ou un sceptique. Les deux me suivent partout, comme des corbeaux. »');
        }),
        T('continent', ['VOYAGE', 'TRAIN', 'PISTE'], ['« Le continent ! J’y ai passé ma jeunesse. Vienne, Venise, Constantinople… Je compte y retourner au printemps, si mes vieux os le permettent. »']),
        T('occulte', ['SIMULACRE', 'OCCULTE', 'MAGIE'], ['« La magie ? Un vocabulaire, mon {ami}. Un mauvais vocabulaire pour une physique que nous ne comprenons pas encore. »']),
        T('etat', ['ETAT'], ['« Vous êtes pâle, mon {ami}. C’est le champagne de l’Institut : il est tiède et il ment sur son âge. »'])
      ] }),

    beddows: npc({ id: 'beddows', name: 'Beddows', patience: 5, cooldown: 25, selfKeys: ['BEDDOWS'],
      greet: function (api, first) {
        if (api.s.loc === 'institut') { api.npc('beddows', first ? 'Le vieux domestique s’incline, impeccable. « {M}. Monsieur le professeur est ravi que vous soyez venu{e}. Il ne le dira pas, bien sûr. »' : '« {M} ? »'); return; }
        api.npc('beddows', first ? 'Beddows parle à voix basse, les yeux sans cesse tournés vers le lit. « {M}. Il faut qu’il se repose. Posez-moi vos questions, je répondrai pour lui. »' : api.fresh('bedG', ['« {M} ? »', 'Il se tord les mains. « Oui, {m} ? »']));
      },
      bye: '« Que Dieu vous garde, {m}. Et faites vite. »',
      deflect: ['« Je… je ne comprends pas, {m}. »', 'Il jette un regard affolé vers le lit. « Pardon ? »', '« Je ne suis qu’un domestique, {m}. »'],
      deflect2: ['« Je vous en prie, {m}, il faut partir. »', 'Il ne répond pas, les mains crispées sur un torchon.'],
      repeat: [['« Je vous l’ai dit, {m}. »', '« Comme je vous le disais, {m}… »'], ['« Je vous en supplie, {m}, chaque minute compte. »', 'Il se tord les mains sans répondre.'], ['Il ne répond plus. Il regarde le lit, et vous, et la porte.']],
      close: ['« Je ne peux plus rien vous dire, {m}. Partez, maintenant. Pour lui. » Il vous tourne le dos et s’affaire près du lit.'],
      topics: [
        T('psy', ['PSY'], function (api) { if (api.flag('psyBed')) { api.say('Vous l’avez déjà jaugé : terrifié, mais comment ne pas l’être.'); return; } api.flag('psyBed', true); api.check('psy_beddows'); }, { chip: 'Observer Beddows (Psychologie)', chipCond: function (api) { return api.s.loc === 'cheapside' && !api.flag('psyBed'); } }),
        T('imposteur', ['IMPOSTEUR'], function (api, n) {
          if (n === 0) { api.npc('beddows', 'Beddows blêmit. « Taisez-vous ! Pour l’amour du ciel, {m}… Il a tant souffert. Vous ne voyez pas ce qu’ils lui ont fait ? »'); return; }
          api.npc('beddows', '« Non ! Non, je vous en prie… » Il recule vers le lit, les bras écartés, comme pour le protéger. Ou pour vous protéger de lui.');
          unmask(api);
        }, { cond: function (api) { return api.s.loc === 'cheapside'; } }),
        T('maitre', ['SMITH', 'BRULE', ['ETAT', 0.7]], function (api, n) {
          if (api.s.loc === 'institut') { api.npc('beddows', '« Monsieur a travaillé trois mois sur cette conférence. Il a refait ses plaques deux fois. Je n’ai pas dormi davantage que lui. »'); return; }
          api.npc('beddows', n === 0 ? '« Il est brûlé au visage et aux mains, {m}. Il souffre beaucoup. Il ne peut presque plus parler. »' : '« Pas de médecin, {m} ! Ils le trouveraient. Ils trouvent tout. »');
        }, { chip: 'Le professeur' }),
        T('attaque', ['MAKRYAT', 'ATTAQUE', 'HISTOIRE', ['INCENDIE', 1], ['QUELQUUN', 0.8], ['TURCS', 1]], ['« Des Turcs, {m}. Trois, quatre, je ne sais pas. Ils ont frappé à la porte en pleine nuit. Monsieur a compris tout de suite. Nous nous sommes barricadés dans la bibliothèque, et ils ont mis le feu. »', '« Nous sommes sortis par le jardin. Je… je n’ai pas vu leurs visages. »'], { chip: 'L’attaque', cond: function (api) { return api.s.loc === 'cheapside'; } }),
        T('police', ['YARD', 'POLICE', 'RIGBY', 'FLEMING'], ['« La police me croit coupable, {m}. On m’a vu courir. Si je me montre, on m’arrête, et Monsieur reste seul. »'], { cond: function (api) { return api.s.loc === 'cheapside'; } }),
        T('plan', ['PLAN', 'SUITE', ['ACCOMPAGNER', 1]], ['« J’ai un plan pour le mettre à l’abri, {m}. Moins vous en saurez, mieux cela vaudra. Pour vous comme pour nous. »'], { cond: function (api) { return api.s.loc === 'cheapside'; } }),
        T('voyage', ['VOYAGE', 'BILLETS', 'VICTORIA', 'VALISE', 'ARGENT'], ['« Le Simplon-Orient-Express, {m}. Monsieur ne jure que par lui. On réserve chez Cook ou à la Compagnie des wagons-lits. Avec ce que Monsieur vous a confié, vous voyagerez comme des princes. Partez vite. »'], { chip: 'Le voyage', cond: function (api) { return api.flag('discours'); } }),
        T('simulacre', ['SIMULACRE', 'PISTE', 'MOSQUEE', 'ROULEAUX'], ['« Je ne sais rien de ces choses, {m}. Monsieur ne m’en parlait jamais. Je cire ses chaussures, je ne lis pas ses livres. »'], { cond: function (api) { return api.s.loc === 'cheapside'; } }),
        T('notes', ['NOTE', 'CARNET', 'JOURNAL'], ['« Ses notes ont brûlé, {m}. Toutes. À moins que ces hommes ne les aient emportées. »'], { cond: function (api) { return api.s.loc === 'cheapside'; } }),
        T('cheapside', ['CHEAPSIDE', 'SALLE'], ['« C’est la chambre d’une cousine, {m}. Personne n’irait chercher Monsieur ici. C’est pour cela que nous y sommes. »'], { cond: function (api) { return api.s.loc === 'cheapside'; } }),
        T('lui', ['TOIMEME'], ['« Trente et un ans au service de Monsieur, {m}. Et de Madame, quand elle vivait. »'])
      ] }),

    fleming: npc({ id: 'fleming', name: 'L’inspecteur Fleming', patience: 3, cooldown: 120, selfKeys: ['FLEMING'],
      greet: function (api, first) { api.npc('fleming', first ? 'Un homme maigre aux yeux cernés lève à peine le nez de ses dossiers. « Fleming. Vous avez cinq minutes, et je suis généreux. »' : '« Encore vous. »'); },
      bye: '« Bonne journée. Et laissez la police faire son travail. »',
      deflect: ['« Venez-en au fait. »', '« Je n’ai pas de temps pour ça. »', 'Il tourne une page de son dossier, ostensiblement.'],
      close: ['« Sergent ! Raccompagnez ces messieurs-dames. » L’entretien est terminé.'],
      topics: [
        T('meurtres', ['MAKRYAT', 'CHELSEA', 'MEURTRES', 'TURCS', 'PASSEPORT'], ['« Trois hommes poignardés en plein cœur, trois passeports au même nom. Les Turcs jurent que ce sont des faux. Le vrai Makryat, s’il existe, n’a pas jugé bon de se présenter. Voilà ce que je peux dire, et c’est déjà dans le Times. »', '« Si vous savez quelque chose, dites-le. Sinon, je ne vous retiens pas. »'], { chip: 'Les meurtres du Chelsea Arms' }),
        T('smith', ['SMITH', 'INCENDIE', 'BEDDOWS'], function (api, n, p) {
          // avant l'incendie (samedi, 23 h), il n'y a pas d'incendie dont parler
          if (api.s.min < at(1, 23, 0)) {
            if (p && p.c && p.c.INCENDIE !== undefined && p.c.SMITH === undefined) { api.npc('fleming', api.fresh('flemQuelFeu', ['« Quel incendie ? » Il fronce les sourcils. « Vous savez quelque chose que j’ignore, {m} ? »', '« Aucun incendie sur mon bureau, {m}. Et je préfère. »'])); return; }
            if (api.flag('agresse') === 'smith') { api.npc('fleming', n === 0 ? '« Le professeur ne porte pas plainte. Il dit que vous n’étiez pas vous-même, ce soir-là. C’est la seule raison pour laquelle vous dormirez dans votre lit. »' : '« Ne m’obligez pas à rouvrir ce dossier, {m}. »'); return; }
            api.npc('fleming', n === 0 ? '« Le professeur Smith ? Il nous a aidés, en dix-neuf, contre de faux médiums. Un homme sérieux. Je n’ai rien d’autre à son nom, {m}, et j’aimerais que ça dure. »' : '« Je vous l’ai dit : rien à son nom. »');
            return;
          }
          api.npc('fleming', '« L’incendie de St John’s Wood ? Pas mon affaire. Voyez le sergent Rigby, aux incendies, deuxième étage. »');
        }, { chip: 'Le professeur Smith' }),
        T('aide', ['PERSUADER', 'BARATIN', 'ARGENT'], ['« Vous voulez m’aider ? Alors apportez-moi un fait. Pas une impression, pas une rumeur : un fait. »'])
      ] }),

    rigby: npc({ id: 'rigby', name: 'Le sergent Rigby', patience: 5, cooldown: 60, selfKeys: ['RIGBY'],
      greet: function (api, first) { api.npc('rigby', first ? 'Un rouquin trapu, les doigts jaunis par le tabac. « Rigby, brigade des incendies. Vous connaissez le professeur Smith ? Asseyez-vous. »' : '« Du nouveau ? »'); },
      bye: '« Si vous voyez Beddows, vous me prévenez. Pour son bien aussi. »',
      deflect: ['« Pardon ? »', '« Restons-en aux faits, voulez-vous. »'],
      topics: [
        T('incendie', ['INCENDIE', 'SMITH', 'HOTEL'], ['« Le feu est parti de l’intérieur, dans la bibliothèque. De l’essence, beaucoup. Pas de corps, Dieu merci. Mais pas de professeur non plus. »', '« Les ouvriers étaient partis à six heures. À onze heures, la maison flambait. »'], { chip: 'L’incendie' }),
        T('beddows', ['BEDDOWS', 'QUELQUUN'], ['« Un voisin a vu un homme de la carrure de Beddows sortir en courant par le jardin, juste avant les flammes. Trente ans de service, et on met le feu chez son maître ? Je n’y crois qu’à moitié. Mais je n’ai rien d’autre. »'], { chip: 'Beddows' }),
        T('makryat', ['MAKRYAT', 'CHELSEA', 'MEURTRES', 'TURCS'], ['« Les trois Turcs ? L’affaire de Fleming. Si vous voyez un lien, vous êtes plus malin que nous deux. »'])
      ] }),

    chelseaclerk: npc({ id: 'chelseaclerk', name: 'Le réceptionniste du Chelsea Arms', patience: 4, cooldown: 60, selfKeys: ['RECEPTION'],
      greet: function (api, first) { api.npc('chelseaclerk', first ? 'Un réceptionniste au col dur, livide d’avoir trop répété la même histoire. « Si c’est pour la chambre 14, {m}, la police a tout emporté. »' : '« {M} ? »'); },
      bye: '« Bonne journée, {m}. »',
      topics: [
        T('meurtres', ['MAKRYAT', 'CHAMBRE', 'MEURTRES', 'CHELSEA', 'TURCS', 'ECORCHES'], ['« Les femmes de chambre les ont trouvés au matin. Trois messieurs, dans une chambre réservée pour un seul. Nous n’avions rien entendu. Rien. Adressez-vous à Scotland Yard, à l’inspecteur Fleming. »', '« Je ne peux rien dire de plus, {m}. Ordres de la police. »'], { chip: 'La chambre des trois morts' }),
        T('femme', ['FLATTER', 'ARGENT', 'PERSUADER'], function (api, n) {
          if (n > 0) { api.npc('chelseaclerk', '« Je vous ai déjà trop dit, {m}. »'); return; }
          api.npc('chelseaclerk', 'Il baisse la voix. « La petite Mary, celle qui les a trouvés, dit que ça sentait la boucherie. Pas le sang, {m}. La boucherie. Elle n’a pas voulu remonter depuis. »');
        }),
        // la plaque de clé que l'homme à la moustache a laissé tomber : la clé qui manquait
        T('cle', [['CLE', 1.3], ['PROJECTEUR', 0.6], ['CHAMBRE', 0.5]], function (api, n) {
          var aLaCle = (api.s.inv || []).some(function (x) { return /Chelsea Arms, 14/.test(x); });
          if (!aLaCle) { api.npc('chelseaclerk', '« La clé de la 14 ? La police en a une. L’autre est partie avec le locataire, et personne ne l’a revue. »'); return; }
          if (n > 0) { api.npc('chelseaclerk', '« Rangez ça, {m}. Je ne l’ai pas vue. »'); return; }
          api.npc('chelseaclerk', 'Il regarde la plaque de cuivre, puis vous, et son col dur a l’air soudain trop serré. « Où avez-vous trouvé ça ? C’est la nôtre. Celle qui manquait. » Il jette un œil vers l’agent, au pied de l’escalier. « Rangez-la, {m}. S’il la voit, il vous la prend, et vous avec. »');
        }, { chip: 'Lui montrer la clé', cond: function (api) { return (api.s.inv || []).some(function (x) { return /Chelsea Arms, 14/.test(x); }); } })
      ] }),

    mustapha: npc({ id: 'mustapha', name: 'Mustapha Köprülü', patience: 6, cooldown: 60, selfKeys: ['MUSTAPHA'],
      greet: function (api, first) { api.npc('mustapha', first ? 'Un jeune homme élégant, moustache fine, costume de Savile Row, vous reçoit dans un bureau qui sent le café et la cire. « Mustapha Köprülü, attaché. ' + (api.sait('MEURTRES') ? 'Si c’est pour l’affaire du Chelsea Arms, {m}, l’ambassade n’a rien à déclarer. »' : 'Que puis-je pour vous, {m} ? »') : api.fresh('musG', ['« Encore vous, {m}. »', 'Il sourit, un peu las. « {M} ? »'])); },
      bye: '« Bonne journée. Et méfiez-vous de vos journaux. »',
      deflect: ['« Je ne vois pas le rapport, {m}. »', '« Vous parlez comme un journaliste. Ce n’est pas un compliment. »'],
      topics: [
        T('makryat', ['MAKRYAT', 'PASSEPORT', 'AGE', 'MEURTRES', ['TURCS', 0.8], ['CHELSEA', 0.8]], function (api, n) {
          if (api.has('AGE')) { api.npc('mustapha', '« Je vous ai dit ce que dit le registre, {m}. Trente-neuf ans, Brophy Lane, un passeport en règle. Le reste est l’affaire de votre police. »'); return; }
          if (n === 0) { api.npc('mustapha', '« Les passeports de ces trois malheureux sont des faux, {m}. Des faux, pas des duplicata. Vos journaux insinuent que l’administration turque est corrompue. C’est un problème britannique. »'); return; }
          if (api.flag('persMus') === day(api.s.min)) { api.npc('mustapha', api.fresh('musNon', ['« Je vous ai répondu, {m}. L’ambassade n’a rien à ajouter aujourd’hui. »', '« Revenez un autre jour, {m}. Ou ne revenez pas. »'])); return; }
          api.flag('persMus', day(api.s.min));
          api.say('Vous insistez, poliment, en faisant valoir que le vrai Makryat est peut-être en danger.');
          api.check('persuasion_mustapha');
        }, { chip: 'Le dossier Makryat' }),
        T('presse', ['JOURNAL', 'TURCS'], ['« Vos journaux écrivent que la Turquie vend ses passeports comme des cigarettes. Pendant ce temps, on se bat chez nous, on fait une république. Personne n’écrit là-dessus. »']),
        T('cafe', ['BOISSON', 'MANGER', 'FLATTER', ['TOIMEME', 0.7]], function (api) {
          if (api.flag('charmeMus')) { api.npc('mustapha', '« Vous êtes aimable, {m}, mais j’ai du travail. »'); return; }
          api.flag('charmeMus', true);
          api.say('Vous parlez de Constantinople, du Bosphore, de la pluie anglaise. Il se détend un peu, propose un café.');
          api.check('charme_mustapha');
        }, { chip: 'Gagner sa sympathie' }),
        T('mosquee', ['MOSQUEE', 'SIMULACRE', 'ROULEAUX'], ['Son sourire s’efface. « La Mosquée Maudite ? Une histoire pour faire peur aux enfants de Stamboul, {m}. On dit qu’il n’y a plus de muezzin depuis quatre cents ans, et que les chiens n’y entrent pas. » Il remet de l’ordre dans ses papiers. « Une histoire. »']),
        T('persuader', ['PERSUADER', 'BARATIN', 'POLICE', 'INSISTER'], function (api) { if (api.has('AGE') || api.flag('persMus') === day(api.s.min)) { api.npc('mustapha', api.fresh('musNon2', ['« Je vous ai répondu, {m}. »', '« Ma réponse ne changera pas d’ici ce soir, {m}. »'])); return; } api.flag('persMus', day(api.s.min)); api.check('persuasion_mustapha'); })
      ] }),

    voisin: npc({ id: 'voisin', name: 'Le buraliste', patience: 5, cooldown: 30, selfKeys: ['VOISIN'],
      greet: function (api, first) { api.npc('voisin', first ? 'Le buraliste d’à côté, un petit homme en gilet de laine, vous dévisage derrière ses bocaux de tabac. « Vous êtes de la police, vous aussi ? »' : '« Encore vous ? »'); },
      bye: '« Bonne journée. Et fermez la porte, ça fait du froid. »',
      topics: [
        T('vieux', ['MAKRYAT', 'ISLINGTON', 'AGE', 'TURCS', 'QUELQUUN', 'TOIMEME', 'OUESTIL'], ['« Le Turc ? Un vieux, voûté, avec une barbe blanche. Il ne disait jamais plus de trois mots. Bonjour, merci, au revoir. Il a fermé boutique il y a quatre ou cinq jours, et on ne l’a plus revu. »', '« Il recevait parfois des visites le soir. Des hommes bruns, plus jeunes. Je n’ai pas demandé. »'], { chip: 'Le vieux Turc' }),
        T('photos', ['ECORCHES', 'MEURTRES', 'JOURNAL'], ['« Les trois morts des journaux ? La police m’a montré leurs photos. Ce n’était pas lui. Aucun des trois. Lui, c’était un vieillard. »']),
        T('cle', ['OUVRIR', 'PORTE', 'CLE'], ['« La clé ? Il ne m’a jamais confié sa clé, à moi. Il ne confiait rien à personne. »'])
      ] }),

    atkins: npc({ id: 'atkins', name: 'Mrs Atkins', patience: 10, cooldown: 30, selfKeys: ['ATKINS'],
      greet: function (api, first) { api.npc('atkins', first ? 'Une femme robuste, en peignoir et bigoudis en plein jour, vous ouvre avant que vous ayez frappé. « Vous venez pour la chambre de la mort ? Six pence, mon chou. Pour voir, hein, pas pour louer. Quoique, elle est à louer aussi. »' : '« Revoilà mes curieux ! »'); },
      bye: '« Revenez quand vous voulez ! Et parlez de moi à vos amis ! »',
      byeAlt: ['« À la revoyure, mon chou ! »', 'Elle vous fait un petit signe avec son plumeau.', '« Et dites à vos amis : six pence seulement ! »'],
      greetAlt: ['« Encore vous, mon chou ? »', 'Elle rajuste un bigoudi. « Oui ? »', '« Vous avez oublié quelque chose ? »'],
      deflect: ['« Bizarre, hein ? Ça, c’était bizarre. »', '« Ah, ça, je ne saurais pas dire, mon chou. »', '« Mon défunt mari était comme ça, lui aussi. Toujours des questions. »'],
      repeat: [['« Je vous l’ai dit, mon chou, et je vous le redirai, j’aime bien raconter. Mais quand même. »', '« Comme je disais… »'], ['« Vous me faites tourner la tête, avec vos questions. »', 'Elle reprend son souffle, pour une fois.'], ['Elle se met à épousseter la rampe d’escalier en fredonnant, très fort.']],
      topics: [
        T('soir', ['STANLEY', 'SUITE', 'FANTOME', 'OUESTIL', 'HISTOIRE'], ['« Il est rentré à six heures, pour le thé, tout excité : il venait d’acheter un nouveau train ! À son âge, je vous jure. Il est monté à sept heures. Moi, j’étais dans le salon avec mon magazine, il n’aurait pas pu sortir sans passer devant moi. »', '« Un peu plus tard, je l’entends crier, et puis une espèce de grondement. Je frappe, rien. J’ouvre : la chambre pleine de fumée, et plus de M. Stanley. La fenêtre fermée au verrou, de l’intérieur ! »', '« Moi je dis qu’il a brûlé tout entier. Ça arrive, c’était dans le journal. Où il est passé, après, ça… »'], { chip: 'Le soir de la disparition' }),
        T('lui', ['TOIMEME', 'QUELQUUN'], ['« Un gentil garçon, tranquille, pas fumeur, pas buveur. Des trains, des trains, des trains. Tenez, voilà sa photo, je garde celles de tous mes locataires. » Elle vous montre un homme maigre au sourire timide.']),
        T('maquette', ['MAQUETTE', 'TRAIN', 'ISLINGTON', 'ASSOCIATION'], function (api, n) {
          if (n === 0) { api.npc('atkins', '« Le train ? La police l’a emporté. C’était électrique, vous comprenez, ils ont cru que ça avait mis le feu. Moi je dis que ça n’a rien à voir. »'); return; }
          api.npc('atkins', '« Ils l’ont confié à son club, je crois, des messieurs qui collectionnent les trains. Leur président est passé hier soir, tout retourné. Un M. Butter, de Camberwell. Très poli. Il n’a pas voulu voir la chambre, remarquez. »');
          learn(api, 'camberwell');
        }, { chip: 'Le train miniature' }),
        T('police', ['POLICE', 'YARD', 'SERGENT'], ['« La police ? Ils sont venus, ils ont regardé, ils sont repartis. Le poste est au coin de la rue, si vous voulez leur parler. Ils ne vous diront rien, ils ne m’ont rien dit à moi. »'], { chip: 'La police' }),
        T('payer', ['ARGENT', 'DONNER', 'VISITER', 'CHAMBRE'], function (api) {
          if (api.flag('chambrePayee')) { api.npc('atkins', '« Vous avez déjà payé, mon chou, montez donc. »'); return; }
          if (!api.pay(0.025)) { api.npc('atkins', '« Pas un penny ? Alors pas de chambre. »'); return; }
          api.flag('chambrePayee', true);
          api.npc('atkins', 'Elle empoche votre pièce avec un sourire radieux. « Premier étage, au fond. Et ne prenez rien, hein ! »');
        }, { chip: 'Payer six pence pour voir la chambre', chipCond: function (api) { return !api.flag('chambrePayee'); } })
      ] }),

    sergent: npc({ id: 'sergent', name: 'Le sergent de Stoke Newington', lieux: ['stoke'], patience: 4, cooldown: 60, selfKeys: ['SERGENT'],
      greet: function (api, first) { api.npc('sergent', first ? '« Sergent Hobbs. On me dit que vous vous intéressez à M. Stanley. Entre nous, {m}, il n’y a pas de mystère. Ce monsieur a organisé sa disparition. On saura bientôt pourquoi. »' : '« {M} ? »'); },
      bye: '« Bonne journée, {m}. Ce genre d’affaire finit toujours par s’arranger. »',
      topics: [
        T('stanley', ['STANLEY', 'FANTOME', 'OUESTIL'], ['« Il est sorti par la fenêtre, voilà tout. Dettes, femme, que sais-je. Ça arrive plus souvent qu’on ne croit. »'], { chip: 'Henry Stanley' }),
        T('credit', ['PERSUADER', 'BARATIN', 'CREDIT', 'MAQUETTE'], function (api) { if (api.flag('creditSerg')) { api.npc('sergent', '« Je vous ai dit ce que je savais, {m}. Voyez M. Butter, à Camberwell. »'); learn(api, 'camberwell'); return; } api.flag('creditSerg', true); api.check('credit_sergent'); }, { chip: 'Le train et les restes' })
      ] }),

    butter: npc({ id: 'butter', name: 'Arthur Butter', patience: 8, cooldown: 30, selfKeys: ['BUTTER'],
      greet: function (api, first) { api.npc('butter', first ? 'Un quinquagénaire jovial, cravate de travers, vous ouvre la porte d’une maison remplie de gravures de locomotives. « Vous venez pour ce pauvre Stanley ? Entrez, entrez. Arthur Butter, président de l’Association des amateurs de trains de Londres. »' : '« Ah, revoilà nos enquêteurs ! »'); },
      bye: '« Revenez quand vous voulez. Et pensez à Stanley. »',
      byeAlt: ['« À bientôt, j’espère ! »', 'Il vous serre la main avec chaleur.', '« Bonne route ! »'],
      greetAlt: ['« Ah, revoilà nos enquêteurs ! »', '« Entrez, entrez ! »', 'Il rallume sa pipe. « Oui ? »'],
      topics: [
        T('stanley', ['STANLEY', 'QUELQUUN'], ['« Henry ? Un garçon discret, gentil, membre depuis douze ans. Il avait l’œil pour l’authentique, mais pas beaucoup de mémoire pour l’histoire, si vous voyez ce que je veux dire. Je prie pour qu’il revienne. »'], { chip: 'Henry Stanley' }),
        T('maquette', ['MAQUETTE', 'TRAIN', 'FANTOME'], function (api, n) {
          if (n === 0) { api.npc('butter', 'Il fait la grimace. « La maquette ? Je l’ai fait tourner une fois, pour la police. Elle est magnifique. Mais, voyez-vous… elle est de mauvais goût. Elle reproduit un vrai train, l’express de Liverpool de 97, celui qui a déraillé. Plus de cent morts. Je ne crois pas que Stanley le savait. »'); api.clue('MAQUETTE'); return; }
          api.npc('butter', '« Elle est à la cave, contre le mur. Une belle pièce, pour une livre. Un vrai crime. »');
        }, { chip: 'La maquette', more: ['« L’express de 97 ? La machine, le tender et les deux premières voitures n’ont jamais été repêchés. Le reste s’est fracassé dans la rivière. Les plongeurs n’ont rien trouvé. Soixante-dix tonnes de fonte, et pas une trace. On a parlé d’anarchistes. » Il se tait, mal à l’aise.'] }),
        T('emprunt', ['PRENDRE', 'EMPRUNTER', 'ACCOMPAGNER'], function (api) { if (api.flag('demandeButter')) { api.npc('butter', api.flag('maquettePretee') ? '« Elle est à vous pour l’instant. Prenez-en soin. »' : '« Je vous ai dit : la cave vous est ouverte. »'); return; } api.flag('demandeButter', true); api.check('credit_butter'); }, { chip: 'Emprunter la maquette' }),
        T('voyage', ['VOYAGE', 'VICTORIA', 'BILLETS'], function (api, n) {
          if (!api.has('QUETE') && !api.item(BILLETS)) { api.npc('butter', '« L’Orient-Express ? Le rêve de toute une vie, {m}. Si jamais vous le prenez, dites-le-moi, que je vous envie comme il faut. »'); api.flag('parlerVoyage', true); return; }
          if (api.flag('diner')) { api.npc('butter', '« Vous avez de la chance, vous savez. Une chance folle. »'); return; }
          api.npc('butter', 'Son visage s’illumine. « Vous partez sur le Simplon-Orient ? Mon Dieu. Mon Dieu ! » Il vous serre les mains. « L’Association dîne ce soir. Vous viendrez, j’insiste. Il y aura mille choses à apprendre. Et prenez la maquette, prenez-la, je vous en prie. »');
          api.flag('maquettePretee', true); api.flag('inviteDiner', true); api.take(MAQ);
        }, { chip: 'L’Orient-Express' }),
        T('diner', ['MANGER', 'ASSOCIATION'], function (api) {
          if (!api.flag('inviteDiner')) { api.npc('butter', '« Notre dîner mensuel ? Réservé aux membres, hélas. Sauf circonstance exceptionnelle. »'); return; }
          if (api.flag('diner')) { api.npc('butter', '« Ah, quelle soirée, n’est-ce pas ? »'); return; }
          diner(api);
        }, { chip: 'Le dîner de l’Association', chipCond: function (api) { return api.flag('inviteDiner') && !api.flag('diner'); } })
      ] }),

    alexis: npc({ id: 'alexis', name: 'Randolph Alexis', patience: 7, cooldown: 10, selfKeys: ['ALEXIS'],
      greet: function (api, first) { api.npc('alexis', first ? 'Alexis vous dévisage avec une avidité qui n’a rien d’amical. « De la compagnie. Enfin. »' : api.fresh('alexG', ['« Oui ? »', 'Il tapote le plafond couvert de traits. « Une question ? »'])); },
      bye: 'Il retourne à son motif en marmonnant des chiffres.',
      byeAlt: ['Il vous tourne le dos, déjà ailleurs.', 'Il hoche la tête sans vous regarder.'],
      greetAlt: ['« Oui ? »', 'Ses yeux brillants se posent sur vous.'],
      deflect: ['« Hm ? » Il ne vous écoutait pas.', 'Il rit, d’un rire nasal et sec. « Vous êtes drôle. »', '« Le temps, ici, voyez-vous, n’a pas la même texture. »'],
      topics: [
        T('lui', ['ALEXIS', 'TOIMEME', 'TRAIN', 'HISTOIRE'], ['« J’ai voulu fuir mes ennemis en 1897, en ouvrant une porte dans la cloison de mon compartiment. Le sort a mal tourné. L’avant du train est venu avec moi. L’arrière est resté dans la rivière. »', '« Une erreur de calcul. Une seule. On me l’a fait payer assez cher. »'], { chip: 'Son histoire' }),
        T('temps', ['HEURE'], ['Il montre le plafond couvert de milliers de petits traits. « Mon registre. Tant de longs sommeils… J’en déduis que nous sommes à la fin de 1911. » Vous n’osez pas le corriger.']),
        T('albert', ['STANLEY', 'QUELQUUN', 'OS', 'FILS'], function (api, n) {
          if (api.flag('montre')) { api.npc('alexis', n === 0 ? 'Il regarde la montre dans votre main sans la reconnaître. Ou en la reconnaissant trop bien. « Un homme doit manger », dit-il simplement.' : 'Il ne répond pas. Il compte les traits du plafond.'); return; }
          api.npc('alexis', '« Nous avons eu de la visite, de temps à autre. Les visites ne durent pas. » Il hausse les épaules.');
        }),
        T('plan', ['PLAN', 'COEUR', 'SUITE', 'VICTORIA', 'RETOUR'], function (api) {
          if (api.flag('relief')) { api.npc('alexis', '« Faites tourner ! Faites tourner ! »'); return; }
          api.npc('alexis', '« J’essaie de ramener le train sur terre. Il me manque ma bibliothèque, et quelque chose cloche dans le motif. Il devrait marcher. Albert, lui, a réussi à faire venir le train. Il faut bien qu’il ait réussi quelque chose, ce garçon. »');
        }, { chip: 'Son plan' }),
        T('morts', ['PASSAGERSMORTS'], ['« Ils sont stupides, voyez-vous. Persistants, mais stupides. Comme des mouches. On les chasse, ils reviennent. Ils veulent ce que vous avez. »']),
        T('psy', ['PSY'], function (api) { if (api.flag('psyAlexis')) { api.say(api.flag('alexisFou') ? 'Vous savez ce qu’il est. Vous ne lui tournez plus le dos.' : 'Vous l’avez déjà observé.'); return; } api.flag('psyAlexis', true); api.check('psy_alexis'); }, { chip: 'L’observer (Psychologie)' })
      ] }),

    stanley: npc({ id: 'stanley', name: 'Henry Stanley', patience: 5, cooldown: 10, selfKeys: ['STANLEY'],
      greet: function (api, first) { api.npc('stanley', first ? 'Stanley vous agrippe les mains, en larmes. « Des vivants ! Des vrais vivants ! Oh, mon Dieu, merci, merci… »' : '« Vous restez avec moi, hein ? Vous restez ? »'); },
      bye: '« Ne me laissez pas seul avec lui. »',
      byeAlt: ['Il se recroqueville sur la banquette.', '« Restez près de moi. »'],
      greetAlt: ['« Oui ? Oui ? »', 'Il sursaute.'],
      deflect: ['« Je… je ne sais pas. »', 'Il tremble sans répondre.', '« Je veux rentrer. Je veux juste rentrer. »'],
      topics: [
        T('histoire', ['HISTOIRE', 'STANLEY', 'MAQUETTE', 'TOIMEME', 'OUESTIL'], ['« J’ai fait tourner le train dans ma chambre. Encore et encore, il était si beau. Et puis la fumée, le bruit, et ils m’ont pris. Ils m’ont pris ! »'], { chip: 'Ce qui lui est arrivé' }),
        T('alexis', ['ALEXIS'], ['Il baisse la voix. « Il me regarde quand il croit que je dors. Il me regarde comme on regarde un gigot. »']),
        T('trains', ['TRAIN', 'VOYAGE'], ['« Les trains ? Je ne veux plus jamais en voir un. Jamais. »'])
      ] }),

    bibliothecaire: npc({ id: 'bibliothecaire', name: 'Le conservateur', patience: 4, cooldown: 60, selfKeys: ['BIBLIOTHECAIRE'],
      greet: function (api) { api.npc('bibliothecaire', '« Chut. » Un homme à lorgnon vous fixe par-dessus son comptoir. « Vous avez une carte de lecteur ? »'); },
      bye: '« Chut. »',
      topics: [T('carte', ['CARTE', 'MUSEE', 'PERSUADER', 'CREDIT'], function (api) { carteMusee(api); }, { chip: 'Demander une carte de lecteur' })] })
  };

  function carteMusee(api) {
    var c = api.flag('carteMusee');
    if (c !== undefined && c !== false) { api.npc('bibliothecaire', day(api.s.min) >= c ? '« Votre carte est prête. Places 1 à 400. Chut. »' : (c - day(api.s.min) > 1 ? '« Votre demande est en cours. Revenez dans ' + (c - day(api.s.min)) + ' jours. »' : '« Votre carte sera prête demain matin. Chut. »')); return; }
    if (api.pc.academic) { api.npc('bibliothecaire', 'Il reconnaît votre nom. « Ah. {M}. Votre carte sera prête demain matin. »'); api.flag('carteMusee', day(api.s.min) + 1); return; }
    api.check('credit_musee');
  }
  function diner(api) {
    api.flag('diner', true);
    api.endTalk(false);
    if (hour(api.s.min) < 19) { api.say('Vous passez l’après-midi à attendre le soir, puis Butter vous emmène, tout fier, au premier étage d’une taverne de Camberwell.'); api.s.min = day(api.s.min) * D + 19 * 60 + 30; }
    api.time(180);
    api.say('Le dîner réunit une trentaine d’hommes timides dans des costumes trop grands. Avant le potage, Butter demande une minute de silence pour le retour de leur ami Henry Stanley. Six plats, du porto, des cigares, et des heures de conversation sur les bielles, les chaudières et la disposition des essieux.');
    api.say('Dans ce flot technique, vous retenez quelques perles. Le personnel de l’Orient-Express est le meilleur du monde et s’occupe des formalités aux frontières. La gare de Milan est en travaux. Des bandits ont déjà attaqué le train en Bulgarie, et la neige peut le bloquer dans les Balkans. Le tunnel du Simplon fait plus de vingt kilomètres, et il a coûté des dizaines de vies.');
    api.say('À Constantinople, les porteurs de la gare de Sirkeci perdent les bagages avec un talent rare. Un petit pourboire facilite certaines frontières, mais surtout pas en France. Et un membre absent ce soir, Walter Partridge, toussoteux, compte justement prendre le Simplon-Orient cette saison.');
  }
  function lirePresse(api) {
    var jp = presse(api.s.min);
    // avant lundi, les journaux ne savent rien des meurtres : la conférence le samedi, l'incendie le dimanche
    if (!api.flag('presse1') && jp < 3) {
      if (jp === 1 && !api.flag('presseSam')) {
        api.flag('presseSam', true);
        api.doc('LE PROFESSEUR ET LES FANTÔMES EN RELIEF — Hier soir, à l’Institut impérial, le professeur Julius Smith, l’homme qui a démasqué plus de médiums que Scotland Yard de pickpockets, a stupéfié la Fondation Challenger en soutenant que les hantises seraient des « tentatives de retour ». Un administrateur, sous couvert d’anonymat : « Nous attendions un sceptique. Nous avons eu un prophète. »', 'The Times · samedi 6 janvier 1923');
        if (!api.has('CONFERENCE')) api.clue('CONFERENCE');
        return;
      }
      if (jp === 2 && !api.flag('presseDim')) {
        api.flag('presseDim', true);
        api.doc('ST JOHN’S WOOD : LA MAISON D’UN SAVANT EN FLAMMES — La villa du professeur Julius Arthur Smith a été détruite par le feu dans la nuit de samedi. Le professeur demeure introuvable, de même que son domestique, James Beddows, qu’un voisin dit avoir vu s’éloigner de la maison peu avant le sinistre, chargé d’un lourd fardeau. Le sergent Rigby, de la brigade des incendies de Scotland Yard, prie toute personne informée de se manifester.', 'The Observer · dimanche 7 janvier 1923');
        api.clue('INCENDIE'); learn(api, 'yard');
        return;
      }
      if (hour(api.s.min) < 5) { api.say(api.fresh('presseNuit', ['Ce sont encore les journaux d’hier. L’édition du matin ne sortira des presses qu’à l’aube.', 'Vous relisez les journaux de la veille, faute de mieux. Les nouvelles du jour ne seront imprimées qu’au petit matin.'])); return; }
      api.say(api.fresh('presse0', ['Les journaux du jour : la Ruhr, le mark qui s’effondre, un match de rugby à Twickenham. Rien de plus sur vos affaires.', 'Vous feuilletez la presse. Le brouillard fait la une, et la Ruhr, et un pasteur scandalisé par le charleston.']));
      return;
    }
    if (!api.flag('presse1')) {
      api.flag('presse1', true);
      if (jp > 3) api.say('Dans la pile de journaux de la réception, un numéro de lundi attire votre œil.');
      api.doc('TROIS FOIS LE MÊME MORT — Trois hommes ont été découverts hier, poignardés en plein cœur, dans une chambre de l’hôtel Chelsea Arms. Tous trois portaient des papiers en règle au nom de M. Mehmet Makryat, antiquaire turc établi à Islington, à qui la chambre était également louée. Arrivés séparément à Londres il y a trois jours, ils avaient voyagé chacun de leur côté à travers le monde. Le vrai M. Makryat demeure introuvable. Scotland Yard l’invite à se présenter.', 'The Times · lundi 8 janvier 1923');
      api.clue('MEURTRES'); learn(api, 'chelsea'); learn(api, 'yard'); learn(api, 'ambassade');
      if (api.has('OBSERVATEUR') && !api.flag('reconnu')) { api.flag('reconnu', true); api.say('Sous l’article, trois croquis d’audience. Le deuxième visage vous glace : la moustache épaisse, le regard d’excuse. L’homme qui vous observait au banquet de l’Institut. Il était déjà mort, ou presque, quand vous l’avez vu.'); if (api.has('INCENDIE')) api.check('san_reconnu'); else api.flag('aReconnaitre', true); }
      if (!api.has('INCENDIE')) api.check('toc_journal');
      return;
    }
    if (api.flag('stanleyDispo') && !api.flag('presse2') && api.has('BILLET')) {
      api.flag('presse2', true);
      if (jp > 4) api.say('Dans un numéro de mardi oublié sur une banquette, un titre vous arrête.');
      api.doc('VOLATILISÉ DANS UN NUAGE DE FUMÉE — M. Henry Stanley, 41 ans, de Stoke Newington, a disparu lundi soir. Sa logeuse, Mrs Constance Atkins, l’a entendu crier vers huit heures, puis a trouvé sa chambre pleine de fumée et vide. Célibataire, passionné de chemins de fer, M. Stanley venait d’acheter un train miniature… dans la boutique de M. Mehmet Makryat. Combustion humaine spontanée ? La police ne commente pas.', 'The Scoop · mardi 9 janvier 1923');
      api.clue('STANLEY'); learn(api, 'stoke');
      return;
    }
    if (api.flag('peauDemain') && jp >= api.flag('peauDemain') && !api.flag('presse3')) {
      api.flag('presse3', true);
      api.doc('LE CADAVRE DU BRITISH MUSEUM — Un lecteur retrouvé sans vie dans la salle de lecture, dépouillé de sa peau de la tête aux pieds. Un message en turc, épinglé à ses vêtements, a été traduit par la police : « Celui-qui-n’a-pas-de-peau ne se laisse pas refuser. »' + (api.flag('demasque') ? ' La victime n’a pas été identifiée.' : ' Grâce aux chaussures de la victime, ressemelées la semaine dernière chez un cordonnier de St John’s Wood, le coroner l’a identifiée : il s’agit de James Beddows, le domestique du professeur Smith, recherché depuis l’incendie.'), 'The Times');
      api.clue('PEAU');
      if (!api.flag('demasque')) { api.clue('BEDDOWS'); api.say('Beddows. Vous revoyez ses mains tremblantes, à Cheapside, son regard sans cesse tourné vers le lit. Et vous vous demandez, pour la première fois, qui était couché dans ce lit.'); api.check('san_beddows'); }
      return;
    }
    if (hour(api.s.min) < 5) { api.say(api.fresh('presseNuit', ['Ce sont encore les journaux d’hier. L’édition du matin ne sortira des presses qu’à l’aube.', 'Vous relisez les journaux de la veille, faute de mieux. Les nouvelles du jour ne seront imprimées qu’au petit matin.'])); return; }
    api.say(api.fresh('presseX', ['Les journaux du jour : la Ruhr, le mark qui s’effondre, un chanteur de music-hall fiancé pour la troisième fois. Rien sur vos affaires.', 'Vous feuilletez la presse. La police « suit plusieurs pistes ». Autrement dit, aucune.', 'Rien de neuf dans les journaux. Le brouillard, lui, fait la une : on n’a jamais vu ça depuis 1880.']));
  }

  // ---------------------------------------------------------------- lieux
  function goAct(id) {
    var p = PLACES[id];
    return { id: 'go_' + id, label: 'Aller : ' + p.label, repeatable: true, verbs: ['ALLER', 'VISITER'], nouns: [p.concept].concat(p.also), extraVerbs: ['PRENDRE', 'PARLER'], boost: 0.1,
      cond: function (api) { return zone(api.s.loc) !== id && !/^wagon|^retour|^campagne|^institut/.test(api.s.loc); },
      sait: function (api) { return id === 'institut' || known(api, id); },
      pourquoi: function (api) { return pourquoi(api, id); }, ideaCond: function (api) { return !!pourquoi(api, id); },
      run: function (api, pa) {
        if (id === 'institut') { api.say(api.fresh('instFini', ['L’Institut impérial ? Le banquet est terminé depuis longtemps. Les salons sont fermés, les chaises empilées ; il n’y a plus rien à y apprendre.', 'Vous pensez à l’Institut impérial, à ses lustres et à son champagne tiède. Le banquet est fini : ce qui compte, maintenant, se passe ailleurs dans Londres.'])); return; }
        if (!known(api, id)) { api.say('Vous ne savez pas encore où aller pour ça. Il faudrait d’abord une adresse, ou une raison.'); return; }
        var h = hour(api.s.min);
        // les jours de fermeture (le dimanche au British Museum, le week-end à l'ambassade)
        if (p.jours && p.jours.indexOf(JOURS[(4 + day(api.s.min)) % 7]) >= 0) { api.say(p.fermeJour || p.closed); return; }
        if (p.hours && h >= p.hours[1]) { api.say(p.closed + ' Il faudra y retourner demain.'); return; }
        if (p.hours && h < p.hours[0] - 1) {
          // un lieu qui n'ouvre que le soir : on attend le soir, si c'est ce qu'on a dit
          if (p.hours[0] >= 17 && h >= 6) {
            // la phrase telle qu'elle a été tapée : la lecture normalisée retire le but (« … pour attendre l'ouverture »)
            var brutV = String((pa && pa.raw) || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            var soir = pa && (/\b(soir|soiree|attend\w*|tard|nuit|\d+ ?h|heures?|ouverture|seance)\b/.test(brutV) || pa.jusqua);
            if (!soir) { api.say(p.closed + ' Il est ' + h + ' h : revenez ce soir, ou écrivez « attendre le soir ».'); return; }
            api.say(api.fresh('tuerTemps', ['Vous tuez le temps jusqu’au soir : un thé, les journaux, une promenade dans le brouillard qui s’épaissit avec la nuit.', 'L’après-midi s’étire. Vous dînez tôt, seul{e} à une table, en regardant les réverbères s’allumer un à un.']));
            api.s.min = day(api.s.min) * D + p.hours[0] * 60 - 40;
          } else { api.say(p.closed + ' Mieux vaut attendre le matin.'); return; }
        } else if (p.hours && h < p.hours[0]) { api.say('Vous prenez votre temps : un thé, un œuf à la coque, les nouvelles. On n’ouvre qu’à ' + p.hours[0] + ' h.'); api.s.min = day(api.s.min) * D + p.hours[0] * 60 - 40; }
        if (id === 'cheapside' && api.flag('cheapsideFini')) { api.say('Vous retournez à Cheapside.'); }
        taxi(api, id);
      } };
  }

  L.locations = {
    institut: {
      name: 'L’Institut impérial', art: 'institut',
      enter: function () {},
      things: [
        { label: 'le professeur Smith', ids: ['SMITH'], cond: function (api) { return !api.flag('smithParti'); } }, { label: 'Beddows', ids: ['BEDDOWS'], cond: function (api) { return !api.flag('smithParti'); } },
        { label: null, ids: ['SMITH', 'BEDDOWS'], cond: function (api) { return !!api.flag('smithParti'); } },
        { label: 'les invités', ids: ['QUELQUUN', 'PASSAGERS'] }, { label: 'l’écran de projection', ids: ['PROJECTEUR'] },
        { label: null, ids: ['SALLE', 'INSTITUT', 'TABLE', 'BOISSON', 'LAMPE', 'MOUSTACHU', 'CONFERENCE'] }
      ],
      nudges: [
        { at: 3, cond: function (api) { return !api.flag('conference'); }, run: function (api) { api.event('Un maître de cérémonie fait tinter son verre. « Mesdames, messieurs, le professeur Julius Smith. » Les conversations s’éteignent.'); conference(api); } },
        { at: 6, cond: function (api) { return api.flag('conference'); }, run: function (api) { api.event('La salle se vide peu à peu. Les fiacres et les taxis attendent dans le brouillard de Kensington. Il est temps de rentrer.'); api.chips([{ label: 'Rentrer à l’hôtel', action: 'i_rentrer' }]); } }
      ],
      ambient: ['Un officier de marine raconte Jutland pour la troisième fois.', 'La fumée des cigares monte vers les lustres et s’y accroche comme un brouillard d’intérieur.', 'Une duchesse rit trop fort. Smith, à sa table, lui répond par un clin d’œil.'],
      actions: [
        { id: 'i_look', label: 'Regarder la salle', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'INSTITUT', 'QUELQUUN', 'PASSAGERS'], bare: true,
          run: function (api) { api.say('La grande galerie de l’Institut impérial a été vidée de ses vitrines d’échantillons commerciaux. À la place : des smokings, des robes du soir, des uniformes chamarrés, des sabres qui brillent et des moustaches cirées. Au fond, un écran blanc et un projecteur, sous une housse. À la table d’honneur, Smith relit ses notes en tirant sur une pipe qui empeste. Derrière lui, impassible, Beddows.'); } },
        { id: 'i_smith', label: 'Parler au professeur Smith', idea: true, talkTo: 'smith', cond: function (api) { return !api.flag('smithParti'); }, verbs: ['PARLER', 'ALLER', 'VISITER', 'FLATTER', 'POLI', 'PSY', 'INSISTER'], nouns: ['SMITH'], extra: ['CONFERENCE', 'PROJECTEUR', 'BEDDOWS', 'HOTEL', 'MOUSTACHU', 'VOYAGE', 'TRAIN', 'PISTE', 'SIMULACRE', 'ETAT', 'TOIMEME', 'QUELQUUN', 'PASSAGERSMORTS', 'INSTITUT', 'MAGIE'],
          run: function (api, p) { api.talk('smith', p); } },
        { id: 'i_beddows', label: 'Parler à Beddows', talkTo: 'beddows', cond: function (api) { return !api.flag('smithParti'); }, verbs: ['PARLER', 'ALLER', 'VISITER', 'POLI'], nouns: ['BEDDOWS'], extra: ['SMITH', 'TOIMEME'],
          run: function (api, p) { api.talk('beddows', p); } },
        { id: 'i_conf', label: 'Écouter la conférence', idea: true, ideaCond: function (api) { return !api.flag('conference'); }, verbs: ['ECOUTER', 'ATTENDRE', 'ASSEOIR', 'EXAMINER'], nouns: ['CONFERENCE', 'PROJECTEUR', 'SMITH'], bare: true, extraVerbs: ['EXAMINER'],
          run: function (api, p) { if (api.flag('conference')) { if (p && p.c.SMITH !== undefined && p.c.ECOUTER === undefined) { api.exec('i_smith'); return; } api.say(api.fresh('apres', ['La conférence est terminée. On se presse autour de Smith pour le féliciter.', 'L’écran est éteint. Les discussions vont bon train.'])); return; } conference(api); } },
        { id: 'i_boire', label: 'Prendre une coupe de champagne', obj: 'le champagne', verbs: ['BOIRE', 'COMMANDER', 'PRENDRE'], nouns: ['BOISSON'], bare: true,
          run: function (api) { api.say(api.fresh('champ', ['Le champagne est tiède et un peu trop sucré. Un serveur en gants blancs remplit déjà votre coupe.', 'Une deuxième coupe. Les lustres se mettent à briller un peu plus fort.', 'Vous déclinez la troisième. Il faut garder les idées claires, sans savoir encore pourquoi.'])); } },
        { id: 'i_moustachu', label: 'Chercher l’homme à la moustache', verbs: ['FOUILLER', 'EXAMINER', 'PARLER'], nouns: ['MOUSTACHU'], cond: function (api) { return api.has('OBSERVATEUR'); },
          run: function (api) { api.say(api.fresh('moust', ['Vous fendez la foule jusqu’à l’endroit où il se tenait. Personne. Un serveur jure qu’il n’a vu aucun monsieur de ce genre.', 'Vous faites le tour de la galerie. Des moustaches, il y en a cent. Pas la sienne.'])); } },
        { id: 'i_suivre', label: 'Raccompagner Smith et Beddows', verbs: ['SUIVRE', 'ALLER', 'ACCOMPAGNER'], nouns: ['BEDDOWS', 'SMITH', 'STJOHN'], repeatable: true,
          run: function (api) {
            if (!api.flag('conference')) { api.say('Smith n’a pas encore parlé. Il ne partira pas avant d’avoir eu sa salle, et vous non plus.'); return; }
            if (api.flag('smithParti')) { api.say('Leur fiacre a disparu depuis longtemps dans le brouillard de Kensington.'); api.chips([{ label: 'Rentrer à l’hôtel', action: 'i_rentrer' }]); return; }
            api.say('Vous rattrapez Beddows au vestiaire. Il aide le professeur à enfiler son pardessus, et vous arrête d’un regard très poli.');
            api.npc('beddows', '« Monsieur rentre se reposer, {m}. Il a beaucoup parlé ce soir. Il vous écrira. »');
            api.say('Smith vous fait un petit signe de la main, sans vraiment vous voir. Leur fiacre s’éloigne vers le nord, vers St John’s Wood, et le brouillard le reprend au bout de vingt mètres.');
            api.flag('smithParti', true);
            api.chips([{ label: 'Rentrer à l’hôtel', action: 'i_rentrer' }]);
          } },
        { id: 'i_partis', label: 'Chercher Smith', verbs: ['PARLER', 'VISITER', 'EXAMINER', 'FOUILLER'], nouns: ['SMITH', 'BEDDOWS'], repeatable: true, cond: function (api) { return !!api.flag('smithParti'); },
          run: function (api) { api.say(api.fresh('smithParti', ['Smith et Beddows sont partis. Il ne reste d’eux qu’une coupe à moitié pleine sur le bord de l’estrade.', 'Leur fiacre est loin, maintenant. Le professeur vous écrira, a dit Beddows.'])); api.chips([{ label: 'Rentrer à l’hôtel', action: 'i_rentrer' }]); } },
        { id: 'i_rentrer', label: 'Rentrer à l’hôtel', idea: true, ideaCond: function (api) { return api.flag('conference'); }, repeatable: true, verbs: ['ALLER', 'DORMIR'], nouns: ['HOTEL'], bare: true,
          run: function (api) {
            if (!api.flag('conference')) { api.say('Partir avant la conférence de votre ami ? Smith ne vous le pardonnerait jamais.'); return; }
            api.say('Vous rentrez à votre hôtel de Bloomsbury dans un taxi qui avance au pas. Le brouillard a avalé Londres. Dans le hall, l’horloge marque onze heures passées.');
            api.s.min = at(0, 23, 20); api.flag('weekend', true);
            api.go('hotel');
            api.sys('Le week-end commence. Vous pouvez le vivre heure par heure, ou le laisser filer jusqu’à lundi.');
            api.chips([{ label: 'Laisser passer le week-end', action: 'h_weekend' }, { label: 'Dormir jusqu’au matin', action: 'h_dormir' }]);
          } }
      ]
    },

    hotel: {
      name: 'Votre hôtel, à Bloomsbury', art: 'hotel',
      enter: function (api, first) {
        if (first) { api.say(hour(api.s.min) >= 20 || hour(api.s.min) < 6 ? 'Votre chambre, au troisième étage d’un hôtel discret de Bloomsbury. Le radiateur cogne, le lit est trop mou. Dehors, le brouillard est si épais qu’on ne voit pas l’autre côté de la rue.' : 'Votre chambre, au troisième étage d’un hôtel discret de Bloomsbury. Le garçon d’étage a glissé les journaux du matin sous la porte. Dehors, le brouillard est si épais qu’on ne voit pas l’autre côté de la rue.'); return; }
        if (api.flag('billetAttend') && !api.has('BILLET')) { api.flag('billetAttend', false); billet(api); return; }
        api.say(api.fresh('hotelR', ['Vous retrouvez votre chambre, son papier peint fané et son radiateur qui cogne.', 'L’hôtel. Le portier vous salue d’un « Sale temps, {m} » qui ne demande pas de réponse.', 'Votre chambre vous attend, immobile, comme une salle d’attente.']));
        if (api.flag('stanleyDispo') && !api.flag('presse2')) api.say('Les journaux du jour vous attendent sur le lit.');
      },
      things: [
        { label: 'les journaux', ids: ['JOURNAL'] }, { label: 'la fenêtre', ids: ['FENETRE'] }, { label: 'le téléphone de la réception', ids: ['ANNUAIRE', 'HOTEL'] },
        { label: null, ids: ['SALLE', 'CARTEVISITE', 'BILLETS', 'VALISE', 'DESTINATIONS', 'LAMPE', 'PORTE', 'CHAMBRE', 'TABLE', 'COULOIR', 'DAMEDEUX'] }
      ],
      nudges: [
        { at: 4, cond: function (api) { return !api.flag('presse1') && presse(api.s.min) >= 3; }, run: function (api) { api.event('Le garçon d’étage frappe. « Les journaux de {m}, sous la porte. Une sale histoire en première page, si je puis me permettre. »'); } },
        { at: 8, cond: function (api) { return api.has('QUETE') && !api.item(BILLETS); }, run: function (api) { api.event('Vous repensez à la voix brisée de Smith : « Allez vite. » La réception peut réserver vos billets chez Cook.'); } },
        { at: 3, cond: function (api) { return api.has('QUETE') && !api.flag('carteMusee'); }, run: function (api) { api.event('Le simulacre, les rouleaux, Fenalik, Gremanci… La salle de lecture du British Museum n’est qu’à dix minutes à pied. S’il existe une trace écrite de tout cela, c’est là.'); } }
      ],
      ambient: ['Le radiateur cogne trois fois, puis se tait.', 'Dans le couloir, une valise roule sur le tapis.', 'Une corne de brume, très loin, sur la Tamise.'],
      actions: [
        { id: 'h_look', label: 'Regarder la chambre', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'HOTEL'], bare: true,
          run: function (api) { api.say('Un lit trop mou, un bureau, une armoire qui grince, un portrait du roi George. Les journaux attendent sur la table. Par la fenêtre, une mer grise où flottent quelques cheminées.'); } },
        { id: 'h_fouille', label: 'Fouiller la chambre', verbs: ['FOUILLER', 'EXAMINER'], nouns: ['CHAMBRE', 'TABLE'], repeatable: true,
          run: function (api) {
            if (api.once('hFouille')) { api.time(15); api.say('Vous fouillez la chambre pour de bon : le bureau et ses tiroirs vides, l’armoire, sous le lit, derrière le portrait du roi. Vos affaires sont telles que vous les avez laissées. Personne n’est entré ici. Pas encore.'); return; }
            api.say(api.fresh('hFouille2', ['Rien de plus que la première fois : vos affaires, et l’odeur de poussière chaude du radiateur.', 'Vous rouvrez les tiroirs, par acquit de conscience. Toujours vides.']));
          } },
        { id: 'h_couloir', label: 'Jeter un œil dans le couloir', verbs: ['EXAMINER', 'OUVRIR', 'ALLER', 'ECOUTER', 'FOUILLER'], nouns: ['COULOIR'], repeatable: true,
          run: function (api) {
            api.say(api.fresh('hCouloir', ['Vous entrouvrez la porte. Le couloir est vide, et le tapis rouge avale les bruits. Au bout, l’ascenseur descend en grinçant : un groom, une valise, un client qui part. Rien de plus.', 'Le couloir, désert. Une porte se referme doucement, quelque part vers l’escalier. Vous restez un moment sur le seuil, puis vous rentrez.', 'Personne dans le couloir. Seulement l’odeur d’un cigare éteint, et le cliquetis lointain de l’ascenseur.']));
          } },
        { id: 'h_deuxieme', label: 'Descendre au deuxième étage', verbs: ['ALLER', 'FRAPPER', 'VISITER', 'PARLER', 'EXAMINER'], nouns: ['DAMEDEUX'], repeatable: true,
          run: function (api) {
            api.time(15);
            if (!api.once('mrsGresham')) { api.say(api.fresh('gresham2', ['Vous redescendez au deuxième. Le 21 ne rouvre pas. Derrière la porte, une radio grésille, très bas.', 'Le couloir du deuxième, désert. Au 21, une lumière sous la porte, puis plus rien quand vous approchez.'])); return; }
            api.say('Vous descendez au deuxième. Au numéro 21, une vieille dame en robe de chambre entrouvre sa porte sur la chaînette. « Vous aussi, vous les entendez ? Les pas. Au-dessus de moi, tous les soirs. » Elle lève les yeux au plafond. Au-dessus du 21, d’après le groom, il n’y a que le grenier, condamné depuis la guerre.');
            api.say('La porte se referme. Vous remontez, en vous surprenant à écouter le plafond.');
          } },
        { id: 'h_journal', label: 'Lire les journaux', idea: true, verbs: ['EXAMINER', 'PRENDRE', 'FOUILLER', 'UTILISER'], nouns: ['JOURNAL'], repeatable: true,
          run: function (api) { lirePresse(api); } },
        { id: 'h_fenetre', label: 'Regarder par la fenêtre', verbs: ['EXAMINER', 'OUVRIR'], nouns: ['FENETRE'],
          run: function (api) { api.say(api.fresh('hfen', ['Le brouillard est jaune, presque solide. Un réverbère, en bas, brûle dans un halo qui ne touche pas le sol.', 'Une silhouette immobile sur le trottoir d’en face. Quand vous revenez à la fenêtre, elle n’y est plus.', 'Rien que du gris. La ville a disparu, et vous avec elle.'])); } },
        { id: 'h_annuaire', label: 'Consulter l’annuaire', verbs: ['EXAMINER', 'FOUILLER', 'UTILISER', 'PRENDRE'], nouns: ['ANNUAIRE'],
          run: function (api) {
            if (!api.has('MEURTRES')) { api.say('Vous feuilletez l’annuaire sans savoir quoi y chercher.'); return; }
            api.say('À la lettre M, entre un marchand de cycles et un chapelier : « Makryat, M., antiquités orientales, 3, Brophy Lane, Islington. » Le Guide de l’acheteur d’antiquités donne la même adresse.');
            api.clue('ADRESSE'); learn(api, 'islington');
          } },
        { id: 'h_billets', label: 'Réserver les billets pour l’Orient-Express', idea: true, ideaCond: function (api) { return api.has('QUETE') && !api.item(BILLETS); }, verbs: ['PRENDRE', 'COMMANDER', 'UTILISER', 'DONNER', 'PARLER'], nouns: ['BILLETS', 'VOYAGE'],
          run: function (api) { reserver(api); } },
        { id: 'h_carte', label: 'Examiner la carte de visite', verbs: ['EXAMINER', 'UTILISER'], nouns: ['CARTEVISITE'], cond: function (api) { return api.item(CARTE); },
          run: function (api) { api.say('Au dos, d’une écriture tremblée : « Venez sans tarder. Il me reste peu de temps. Que personne ne vous suive. J. A. Smith. » Au recto, une adresse à Cheapside. Le cachet de cire porte l’empreinte de la chevalière de Smith.'); } },
        { id: 'h_attendre', label: 'Attendre des nouvelles de Smith', idea: true, ideaCond: function (api) { return api.flag('presse1') && !api.has('BILLET') && day(api.s.min) === 3; }, verbs: ['ATTENDRE'], nouns: ['SMITH', 'NOTE', 'HEURE'], bare: true, repeatable: true,
          run: function (api) {
            if (day(api.s.min) === 3 && !api.has('BILLET') && hour(api.s.min) < 18) {
              api.say(api.fresh('hatt', ['Vous passez la journée à tourner en rond dans votre chambre, à relire les journaux, à guetter le pas du garçon d’étage. Le brouillard ne se lève pas. Le soir tombe sans qu’on s’en aperçoive.', 'Les heures passent. Vous écrivez une lettre à Smith, la déchirez, en écrivez une autre. Dehors, les réverbères s’allument en plein après-midi.']));
              api.s.min = at(3, 18, 25); api.s.tick = 5; return;
            }
            api.say(api.fresh('hatt2', ['Vous attendez. Le radiateur cogne, la pendule de l’entrée sonne la demie.', 'Le temps passe, lentement. Rien ne vient.', 'Vous regardez le brouillard, longtemps. Il vous regarde aussi.']));
            api.time(30);
          } },
        { id: 'h_maquette', label: 'Faire tourner la maquette', verbs: ['OUVRIR', 'UTILISER', 'JOUER', 'LANCER', 'EXAMINER'], nouns: ['MAQUETTE', 'TRAIN'], cond: function (api) { return api.item(MAQ); }, time: 10, repeatable: true,
          run: function (api) { tourner(api); } },
        { id: 'h_dormir', label: 'Dormir jusqu’au matin', verbs: ['DORMIR'], nouns: ['HOTEL', 'CHAMBRE'], bare: true, repeatable: true,
          run: function (api) { dormir(api); } }
      ]
    },

    cheapside: {
      name: 'Cheapside, une chambre meublée', art: 'garni',
      enter: function (api, first) {
        if (api.flag('cheapsideFini') || api.flag('demasque')) {
          api.say(api.flag('demasque') ? 'Les scellés de la police barrent la porte noircie. Une odeur de suie flotte encore dans l’escalier.' : 'Une famille irlandaise a pris la chambre. La mère, un bébé sur la hanche, n’a jamais entendu parler d’un monsieur brûlé ni de son domestique. Ni de personne.');
          return;
        }
        if (first) {
          api.flag('cheapsideVu', true);
          if (!api.has('BILLET')) api.say('Une rue sans nom, des façades noires de suie, un escalier qui sent le chou et le pétrole. Il vous faut frapper à trois portes avant la bonne. Au deuxième étage, la porte s’entrouvre sur le visage gris de Beddows, qui recule comme devant un revenant. « Vous ? Comment avez-vous… » Une voix râpe, derrière lui : « Fais-les entrer. » Il obéit, et referme à clé.');
          else api.say('Une rue sans nom, des façades noires de suie, un escalier qui sent le chou et le pétrole. Au deuxième étage, vous frappez. Un long silence, puis la porte s’entrouvre sur le visage gris de Beddows. Il vous fait entrer vite et referme à clé.');
          api.say('Les rideaux sont tirés. Une seule bougie. Sur le lit, une silhouette bouge sous les draps, et une voix de soufflet crevé murmure votre nom.');
          speech(api);
        }
      },
      things: [
        { label: 'l’homme sur le lit', ids: ['BRULE', 'SMITH'], cond: function (api) { return !api.flag('demasque'); } }, { label: 'Beddows', ids: ['BEDDOWS'], cond: function (api) { return !api.flag('demasque'); } },
        { label: 'les rideaux tirés', ids: ['FENETRE', 'LUMIERE'], cond: function (api) { return !api.flag('demasque'); } },
        { label: 'les cendres du lit', ids: ['BRULE', 'SMITH', 'INCENDIE'], cond: function (api) { return !!api.flag('demasque'); } }, { label: 'le corps de Beddows', ids: ['BEDDOWS'], cond: function (api) { return !!api.flag('demasque'); } },
        { label: 'la fenêtre ouverte', ids: ['FENETRE'], cond: function (api) { return !!api.flag('demasque'); } },
        { label: null, ids: ['SALLE', 'CHEAPSIDE', 'VALISE', 'LAMPE', 'PORTE'] }
      ],
      ambient: ['La bougie crépite. Sur le lit, la respiration siffle.', 'Quelque part dans l’immeuble, un enfant pleure, puis se tait.', 'Beddows regarde la porte, encore.'],
      actions: [
        { id: 'c_look', label: 'Regarder la chambre', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'CHEAPSIDE'], bare: true, cond: function (api) { return !api.flag('cheapsideFini') && !api.flag('demasque'); },
          run: function (api) { api.say('Une chambre meublée minable : un lit de fer, une table, un placard, un broc fêlé. Pas un livre, pas une note, rien qui ressemble à Smith. Seulement l’odeur, une odeur de chair roussie et de pommade.'); } },
        { id: 'c_brule', label: 'S’approcher du lit', idea: true, verbs: ['EXAMINER', 'ALLER', 'VISITER', 'UTILISER'], nouns: ['BRULE', 'SMITH'], cond: function (api) { return !api.flag('cheapsideFini') && !api.flag('demasque'); },
          run: function (api) {
            if (!api.flag('vuBrule')) { api.flag('vuBrule', true); api.say('Vous vous penchez au-dessus du lit. Le visage de Smith n’est plus qu’une plaie luisante. Les joues ont fondu et se sont reformées en plis absurdes ; les paupières ne se ferment plus tout à fait.'); api.check('san_brule'); return; }
            api.say(api.fresh('bruleR', ['Il respire avec peine. Ses yeux suivent vos mouvements, sans un mot.', 'Une main bandée remue sur le drap, puis retombe. La chevalière de Smith brille à son doigt.', 'Il dort, ou fait semblant. Beddows vous fait signe de le laisser en paix.']));
          } },
        { id: 'c_parler', label: 'Parler au professeur', verbs: ['PARLER', 'INSISTER', 'PSY'], nouns: ['BRULE', 'SMITH'], cond: function (api) { return !api.flag('cheapsideFini') && !api.flag('demasque'); },
          run: function (api) { if (!api.flag('discours')) { speech(api); return; } if (!api.flag('vuBrule')) { api.exec('c_brule'); return; } api.say(api.fresh('bruleP', ['Il ouvre la bouche. Rien ne sort qu’un râle. Il désigne Beddows d’un doigt bandé.', 'Beddows s’interpose doucement. « Il ne peut plus, {m}. Demandez-moi. »', 'Un souffle, un mot peut-être : « Allez. » Puis plus rien.'])); } },
        { id: 'c_beddows', label: 'Parler à Beddows', idea: true, talkTo: 'beddows', verbs: ['PARLER', 'ALLER', 'VISITER', 'PSY', 'INSISTER', 'PERSUADER', 'MENACER', 'POLI', 'IMPOSTEUR', 'BARATIN'], nouns: ['BEDDOWS'], cond: function (api) { return !api.flag('cheapsideFini') && !api.flag('demasque'); },
          extra: ['SMITH', 'BRULE', 'MAKRYAT', 'POLICE', 'YARD', 'VOYAGE', 'BILLETS', 'VICTORIA', 'VALISE', 'ARGENT', 'SIMULACRE', 'PISTE', 'MOSQUEE', 'ROULEAUX', 'NOTE', 'JOURNAL', 'CHEAPSIDE', 'TOIMEME', 'QUELQUUN', 'SUITE', 'ETAT', 'INCENDIE'],
          run: function (api, p) { api.talk('beddows', p); } },
        { id: 'c_soigner', label: 'Proposer de soigner ses brûlures', obj: 'ses brûlures', verbs: ['UTILISER', 'EXAMINER', 'PERSUADER', 'DONNER', 'PRENDRE'], nouns: ['DOCTEUR'], extra: ['BRULE', 'SMITH'], cond: function (api) { return !api.flag('cheapsideFini') && !api.flag('demasque'); },
          run: function (api) {
            if (api.flag('soinPropose')) { api.npc('beddows', api.fresh('bedSoin', ['« Je vous en supplie, {m}. Pas de soins, pas de médecin. »', 'Beddows se place entre vous et le lit, sans un mot.'])); return; }
            api.flag('soinPropose', true);
            api.npc('beddows', 'Beddows se raidit. « Non, {m}. Il ne veut voir personne. Il ne supporte même plus qu’on le touche. »');
            if (api.skill('Médecine') >= 40) { api.say('Mais vous avez eu le temps de jeter un coup d’œil de praticien.'); api.check('medecine_brule'); }
          } },
        { id: 'c_lumiere', label: 'Ouvrir les rideaux', verbs: ['LUMIERE', 'OUVRIR'], nouns: ['FENETRE', 'LUMIERE', 'LAMPE'], bare: true, cond: function (api) { return !api.flag('cheapsideFini') && !api.flag('demasque'); },
          run: function (api) {
            if (!api.flag('lumiere1')) { api.flag('lumiere1', true); api.npc('beddows', 'Beddows vous saisit le poignet, avec une force surprenante. « Non ! La lumière lui fait mal, {m}. Je vous en prie. »'); return; }
            unmask(api);
          } },
        { id: 'c_imposteur', label: 'Arracher les bandages', verbs: ['IMPOSTEUR', 'MENACER', 'PRENDRE'], nouns: ['BRULE', 'SMITH'], also: [], needVerb: true, cond: function (api) { return !api.flag('cheapsideFini') && !api.flag('demasque'); },
          run: function (api, p) {
            if (p && p.c.PRENDRE !== undefined && p.c.IMPOSTEUR === undefined && p.c.MENACER === undefined) { api.say('Vous prenez sa main bandée dans la vôtre. Elle est brûlante, et étrangement souple. La chevalière de Smith est bien là.'); return; }
            if (!api.flag('soupcon')) { api.flag('soupcon', true); api.npc('beddows', 'Beddows se jette entre vous et le lit. « Qu’est-ce que vous faites ? Il a déjà assez souffert ! »'); return; }
            unmask(api);
          } },
        { id: 'c_cendres', label: 'Examiner les cendres', verbs: ['EXAMINER', 'FOUILLER', 'PRENDRE'], nouns: ['BRULE', 'SMITH', 'SALLE', 'INCENDIE'], cond: function (api) { return !!api.flag('demasque') && !api.flag('cheapsideVide'); },
          run: function (api) { api.say(api.fresh('cendres', ['Des cendres grises, encore tièdes, et l’armature du lit tordue par la chaleur. Pas d’os. Pas une dent. Rien de ce que laisserait un homme qui brûle.', 'Vous fouillez les cendres du bout du pied. Rien. Celui qui était couché là n’a pas brûlé : il est parti.'])); } },
        { id: 'c_corps', label: 'Examiner Beddows', verbs: ['EXAMINER', 'FOUILLER', 'PARLER', 'UTILISER'], nouns: ['BEDDOWS', 'DOCTEUR'], cond: function (api) { return !!api.flag('demasque') && !api.flag('cheapsideVide'); },
          run: function (api) {
            if (api.once('corpsBed')) { api.say('Beddows est mort. Une seule entaille, nette, au cou, faite par quelqu’un qui savait. Dans la fumée, personne n’a rien vu. Ses yeux ouverts fixent encore le lit.'); api.lose(1); return; }
            api.say('Vous ne pouvez plus rien pour lui. Les pas se rapprochent dans l’escalier.');
          } },
        { id: 'c_partir', label: 'Partir', idea: true, ideaCond: function (api) { return api.flag('discours'); }, repeatable: true, verbs: ['ALLER', 'AUREVOIR'], nouns: ['HOTEL', 'PORTE'], bare: true,
          run: function (api) {
            if (!api.flag('discours') && !api.flag('demasque')) { api.say('Vous ne pouvez pas partir sans avoir entendu ce que Smith a à dire.'); return; }
            if (api.flag('demasque') && !api.flag('cheapsideFini')) { api.flag('cheapsideFini', true); api.say('Vous dévalez l’escalier au milieu des voisins en chemise de nuit. Dans la rue, un sifflet de police déchire le brouillard. Vous ne vous retournez pas.'); }
            if (!api.flag('cheapsideFini')) { api.flag('cheapsideFini', true); api.say('Beddows vous raccompagne jusqu’au palier et referme aussitôt. Dans l’escalier, vous entendez le verrou, puis un deuxième. Si vous vous retournez dans la rue, la fenêtre reste noire.'); }
            taxi(api, 'hotel');
          } }
      ]
    },

    chelsea: {
      name: 'L’hôtel Chelsea Arms', art: 'bureau',
      enter: function (api, first) { if (first) api.say('Un hôtel de second ordre aux tapis râpés. Un agent en uniforme fait les cent pas devant l’escalier. Les clients parlent à voix basse, comme dans une église.'); else api.say('Le Chelsea Arms, ses tapis râpés, son silence d’église.'); },
      things: [{ label: 'le réceptionniste', ids: ['RECEPTION', 'HOTEL'] }, { label: 'l’escalier gardé', ids: ['ETAGE', 'PORTE'] }, { label: null, ids: ['SALLE', 'CHELSEA', 'MAKRYAT'] }],
      actions: [
        { id: 'ch_look', label: 'Regarder le hall', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE', 'CHELSEA'], bare: true,
          run: function (api) { api.say('Des palmiers en pot, des fauteuils de cuir craquelé, une odeur de cire et de chou. Derrière son comptoir, un réceptionniste au col dur vous regarde approcher avec l’air de quelqu’un qui a trop parlé à trop de monde.'); } },
        { id: 'ch_clerk', label: 'Parler au réceptionniste', idea: true, talkTo: 'chelseaclerk', verbs: ['PARLER', 'ALLER', 'VISITER', 'FLATTER', 'DONNER', 'PERSUADER', 'BARATIN', 'POLI'], nouns: ['RECEPTION', 'HOTEL', 'MAKRYAT'],
          run: function (api, p) { api.talk('chelseaclerk', p); } },
        { id: 'ch_monter', label: 'Monter à la chambre 14', verbs: ['ALLER', 'OUVRIR', 'FOUILLER'], nouns: ['ETAGE', 'PORTE', 'CHAMBRE'],
          run: function (api) { api.say(api.fresh('chm', ['L’agent vous barre l’escalier. « Personne ne monte, {m}. Ordre de l’inspecteur Fleming. »', 'L’agent ne bouge pas d’un pouce. « Scotland Yard, {m}. Voyez l’inspecteur Fleming. »'])); } }
      ]
    },

    yard: {
      name: 'New Scotland Yard', art: 'bureau',
      enter: function (api, first) { if (first) api.say('Les briques rouges et blanches de New Scotland Yard, au bord de la Tamise. Un hall bruyant, des agents qui courent, des bancs où attendent des gens qui ont perdu quelque chose : un chien, un mari, une montre.'); else api.say(api.fresh('yardR', ['Scotland Yard, de nouveau. Le planton vous reconnaît et soupire.', 'Le hall de Scotland Yard sent le tabac froid et le papier humide.'])); },
      things: [{ label: 'l’inspecteur Fleming', ids: ['FLEMING'] }, { label: 'le sergent Rigby, aux incendies', ids: ['RIGBY'], cond: function (api) { return api.s.min >= at(1, 23, 0); } }, { label: 'les agents du hall', ids: ['POLICE', 'QUELQUUN'] }, { label: null, ids: ['SALLE', 'YARD'] }],
      actions: [
        { id: 'y_fleming', label: 'Demander à voir l’inspecteur Fleming', ideaAnon: 'Demander à parler à un inspecteur', obj: 'l’inspecteur Fleming', idea: true, talkTo: 'fleming', verbs: ['PARLER', 'ALLER', 'VISITER', 'PERSUADER', 'BARATIN', 'POLI'], nouns: ['FLEMING', 'MAKRYAT'], extra: ['SMITH', 'INCENDIE', 'BEDDOWS', 'CHELSEA', 'ARGENT'],
          run: function (api, p) { api.talk('fleming', p); } },
        { id: 'y_rigby', label: 'Voir le sergent Rigby, aux incendies', ideaAnon: 'Voir le sergent chargé des incendies', idea: true, ideaCond: function (api) { return api.has('INCENDIE'); }, cond: function (api) { return api.s.min >= at(1, 23, 0); }, talkTo: 'rigby', verbs: ['PARLER', 'ALLER', 'VISITER', 'POLI'], nouns: ['RIGBY', 'INCENDIE', 'SMITH'], extra: ['BEDDOWS', 'HOTEL', 'MAKRYAT', 'QUELQUUN'],
          run: function (api, p) { api.talk('rigby', p); } },
        { id: 'y_glaner', label: 'Glaner des informations auprès des agents', obj: 'les agents du hall', idea: true, verbs: ['BARATIN', 'ECOUTER', 'PARLER', 'FOUILLER', 'PSY'], nouns: ['POLICE', 'QUELQUUN', 'MAKRYAT'], bare: true,
          run: function (api) {
            if (api.flag('glane') === day(api.s.min)) { api.say('Vous avez déjà assez traîné dans les couloirs aujourd’hui. On commence à vous regarder de travers. Revenez demain.'); return; }
            if (api.has('TELEGRAMME') && api.has('ECORCHES') && api.has('ADRESSE')) { api.say('Les agents n’ont plus rien à vous apprendre.'); return; }
            api.flag('glane', day(api.s.min));
            api.say('Vous traînez près de la machine à thé, un mot pour l’un, une cigarette pour l’autre.');
            api.check('baratin_yard');
          } }
      ]
    },

    ambassade: {
      name: 'L’ambassade de Turquie', art: 'bureau',
      enter: function (api, first) { if (first) api.say('Une maison de Belgravia aux volets clos, un drapeau rouge mouillé qui pend comme un linge. Un huissier vous fait patienter longtemps sous un portrait poussiéreux, puis vous conduit au bureau d’un jeune attaché.'); else api.say('L’ambassade, son huissier, son portrait poussiéreux, son café trop fort.'); },
      things: [{ label: 'le jeune attaché', ids: ['MUSTAPHA'] }, { label: null, ids: ['SALLE', 'AMBASSADE'] }],
      actions: [
        { id: 'a_look', label: 'Regarder le bureau', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE', 'AMBASSADE'], bare: true,
          run: function (api) { api.say('Des tapis superposés, une carte de l’Anatolie où des épingles rouges reculent, un samovar de cuivre, des piles de journaux anglais soulignés au crayon bleu.'); } },
        { id: 'a_mustapha', label: 'Parler à l’attaché', idea: true, talkTo: 'mustapha', verbs: ['PARLER', 'ALLER', 'VISITER', 'PERSUADER', 'BARATIN', 'FLATTER', 'POLI', 'COMMANDER'], nouns: ['MUSTAPHA', 'MAKRYAT'], extra: ['PASSEPORT', 'AGE', 'JOURNAL', 'BOISSON', 'MOSQUEE', 'SIMULACRE', 'ROULEAUX', 'POLICE', 'TOIMEME'],
          run: function (api, p) { api.talk('mustapha', p); } }
      ]
    },

    islington: {
      name: 'Brophy Lane, Islington', art: 'rue',
      enter: function (api, first) { if (first) api.say('Une ruelle pavée d’Islington, des boutiques aux vitrines embuées. Au numéro 3, une façade de brique à deux étages et un petit écriteau « Fermé » derrière la vitre. À côté, un bureau de tabac encore ouvert.'); else api.say(L.disponible && L.disponible(api, 'voisin') ? 'Brophy Lane, sa boutique fermée, et le bureau de tabac, rideau baissé.' : 'Brophy Lane, sa boutique fermée, son buraliste qui vous guette derrière ses bocaux.'); },
      things: [{ label: 'la boutique fermée', ids: ['ISLINGTON', 'PORTE', 'FENETRE'] }, { label: 'le buraliste', ids: ['VOISIN'] }, { label: null, ids: ['SALLE', 'MAKRYAT'] }],
      actions: [
        { id: 'is_look', label: 'Examiner la vitrine', idea: true, verbs: ['EXAMINER'], nouns: ['ISLINGTON', 'FENETRE', 'SALLE'], bare: true,
          run: function (api) { api.say('Derrière la vitre sale, des plateaux de cuivre, des lampes ajourées, des tapis roulés. L’écriteau « Fermé » pend de travers. La serrure est ancienne.'); } },
        { id: 'is_voisin', label: 'Parler au buraliste', idea: true, talkTo: 'voisin', verbs: ['PARLER', 'ALLER', 'VISITER', 'POLI', 'PERSUADER'], nouns: ['VOISIN'], extra: ['MAKRYAT', 'ISLINGTON', 'QUELQUUN', 'JOURNAL', 'PORTE'],
          run: function (api, p) { api.talk('voisin', p); } },
        { id: 'is_entrer', label: 'Entrer dans la boutique', idea: true, verbs: ['OUVRIR', 'ALLER', 'CASSER', 'FOUILLER', 'FRAPPER', 'VISITER'], nouns: ['ISLINGTON', 'PORTE'], obj: 'la porte de la boutique',
          run: function (api, p) {
            if (api.flag('boutiqueOuverte')) { api.say('La porte cède sous votre main, comme vous l’avez laissée.'); api.go('boutique'); return; }
            if (api.flag('islingtonBloque') === day(api.s.min)) { api.say('Un agent fait maintenant les cent pas dans Brophy Lane, et le buraliste vous surveille derrière ses bocaux. Pas aujourd’hui.'); return; }
            if (p && p.c.FRAPPER !== undefined && p.c.CASSER === undefined) { api.say(api.fresh('frapBout', ['Vous frappez. Personne ne répond. Le buraliste, à côté, vous observe par-dessus ses bocaux.', 'Vos coups résonnent dans la boutique vide. Rien ne bouge.'])); return; }
            var lockpick = api.skill('Crochetage') >= 20;
            var brute = p && (p.c.CASSER !== undefined || /epaule|enfonc|defonc/.test(p.text || ''));
            api.say('Vous attendez que la rue soit vide, puis vous vous approchez de la porte.');
            api.check(lockpick && !brute ? 'crochetage_boutique' : 'for_boutique');
          } },
        { id: 'is_arriere', label: 'Chercher une autre entrée', verbs: ['FOUILLER', 'EXAMINER', 'ALLER'], nouns: ['FENETRE', 'SALLE'], extra: ['ISLINGTON'], obj: 'l’arrière de la boutique',
          run: function (api) { api.say(api.fresh('arriere', ['Une impasse longe l’arrière de la maison : un mur de brique, une fenêtre à barreaux, une porte de cave condamnée. Il faudra passer par devant.', 'Vous faites le tour du pâté de maisons. Pas d’autre entrée praticable. Seulement la porte de la rue.'])); } }
      ]
    },

    boutique: {
      name: 'La boutique de Makryat', art: 'boutique',
      enter: function (api, first) { if (first) api.say('Une odeur de poussière, de cuivre et d’encens éteint. Dans la pénombre, des lampes ajourées pendent du plafond comme des cages vides. Des tapis roulés, des aiguières, des carreaux de céramique. Un comptoir. Au fond, un escalier étroit.'); else api.say('La boutique, ses lampes-cages, son odeur d’encens froid.'); },
      things: [{ label: 'les marchandises', ids: ['SALLE', 'ISLINGTON', 'LAMPE'] }, { label: 'le comptoir et ses registres', ids: ['REGISTRE', 'TABLE'] }, { label: 'l’escalier vers l’étage', ids: ['ETAGE'] }, { label: null, ids: ['MAKRYAT', 'PORTE'] }],
      actions: [
        { id: 'b_look', label: 'Examiner les marchandises', idea: true, verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'ISLINGTON', 'LAMPE'], bare: true,
          run: function (api) { api.say(api.skill('Évaluation') >= 40 || api.skill('Histoire') >= 50 ? 'Votre œil d’expert fait vite le tri : du cuivre égyptien, des tapis persans honnêtes, et beaucoup de reproductions vendues pour de l’ancien. La boutique d’un marchand ordinaire. Trop ordinaire, peut-être.' : 'Des cuivres égyptiens, des tapis persans, des céramiques arabes. Certaines pièces sont visiblement des copies. Rien d’extraordinaire.'); } },
        { id: 'b_registre', label: 'Examiner les registres', idea: true, verbs: ['EXAMINER', 'FOUILLER', 'UTILISER', 'PRENDRE'], nouns: ['REGISTRE', 'TABLE'],
          run: function (api) { if (api.has('TRAIN')) { api.say('Vous relisez la ligne : un train miniature Wrightson, acquis à la succession Alexis, revendu une livre à Henry Stanley, Stoke Newington.'); return; } if (api.flag('registreLu')) { api.say('Vous avez déjà épluché ces colonnes sans succès.'); return; } api.flag('registreLu', true); api.say('Sous le comptoir, des registres d’achats et de ventes tenus d’une main régulière. Les marchandises viennent de Turquie, du Levant, ou des salles des ventes londoniennes.'); api.check('compta_registre'); } },
        { id: 'b_etage', label: 'Monter à l’étage', idea: true, verbs: ['ALLER', 'EXAMINER', 'FOUILLER'], nouns: ['ETAGE'],
          run: function (api) {
            if (api.flag('etageVu')) { api.say(api.has('DEPART') ? 'La chambre vide, la sacoche à la poignée cassée, les tiroirs à moitié vides. Il est parti.' : 'La chambre d’un homme seul, sans un livre.'); return; }
            api.flag('etageVu', true);
            api.say('Un logement pour un homme seul, aux habitudes modestes : un lit étroit, une commode, une table, un réchaud. Tout est propre. Et pas un seul livre, nulle part, à part les registres d’en bas.');
            api.check('idee_depart');
          } },
        { id: 'b_sortir', label: 'Ressortir dans la rue', repeatable: true, verbs: ['ALLER', 'OUVRIR'], nouns: ['PORTE', 'ISLINGTON'], bare: true,
          run: function (api) { api.say('Vous refermez la porte derrière vous. La rue est déserte. Presque.'); api.go('islington'); } }
      ]
    },

    musee: {
      name: 'La salle de lecture du British Museum', art: 'lecture',
      enter: function (api, first) { if (first) api.say('Sous l’immense coupole, des centaines de lecteurs penchés sur des pupitres disposés en rayons autour du comptoir central. Le silence a une texture, comme du feutre. La pluie tambourine très haut sur la verrière.'); else api.say(api.fresh('musR', ['La coupole, le silence feutré, l’odeur de papier et de colle.', 'Vous retrouvez la salle de lecture. Il pleut, et les pupitres sont à moitié vides.'])); },
      things: [{ label: 'le comptoir du conservateur', ids: ['BIBLIOTHECAIRE', 'CARTE'] }, { label: 'les catalogues', ids: ['MUSEE', 'LIVRE'] }, { label: null, ids: ['SALLE', 'SIMULACRE', 'ROULEAUX', 'ALEXIS', 'VOYAGE', 'MAKRYAT', 'FANTOME'] }],
      actions: [
        { id: 'm_carte', label: 'Demander une carte de lecteur', obj: 'le conservateur', idea: true, ideaCond: function (api) { return !api.flag('carteMusee'); }, talkTo: 'bibliothecaire', verbs: ['PARLER', 'ALLER', 'PERSUADER', 'DONNER', 'UTILISER'], nouns: ['BIBLIOTHECAIRE', 'CARTE'],
          run: function (api) { carteMusee(api); } },
        { id: 'm_simulacre', label: 'Chercher le simulacre de Sedefkar', idea: true, ideaCond: function (api) { return admis(api) && api.has('QUETE') && !api.has('BIBLIO') && api.flag('rechSim') !== day(api.s.min); }, verbs: ['FOUILLER', 'EXAMINER'], nouns: ['SIMULACRE'], time: 180,
          run: function (api) { if (!admis(api)) { refus(api); return; } if (portent(api)) return; if (api.flag('rechSim') === day(api.s.min) || (api.flag('rechSim') !== undefined && api.has('BIBLIO'))) { api.s.tick = 3; api.say(api.has('BIBLIO') ? 'Vous savez déjà où chercher : à la Bibliothèque nationale, à Paris.' : 'Vous avez assez épluché les catalogues pour aujourd’hui. Demain, avec des yeux neufs, peut-être.'); return; } api.flag('rechSim', day(api.s.min)); api.check('biblio_simulacre'); } },
        { id: 'm_rouleaux', label: 'Chercher les rouleaux de Sedefkar', idea: true, ideaCond: function (api) { return admis(api) && api.has('QUETE') && !api.has('ROULEAUX') && api.flag('rechRou') !== day(api.s.min); }, verbs: ['FOUILLER', 'EXAMINER'], nouns: ['ROULEAUX', 'MOSQUEE'], time: 180,
          run: function (api) { if (!admis(api)) { refus(api); return; } if (portent(api)) return; if (api.flag('rechRou') === day(api.s.min) || (api.flag('rechRou') !== undefined && api.has('ROULEAUX'))) { api.s.tick = 3; api.say(api.has('ROULEAUX') ? 'Topkapı, à Constantinople. Vous ne trouverez pas mieux ici.' : 'Vous avez cherché toute la journée, en vain. Demain, peut-être.'); return; } api.flag('rechRou', day(api.s.min)); api.check('biblio_rouleaux'); } },
        { id: 'm_alexis', label: 'Chercher le nom d’Alexis', idea: true, ideaCond: function (api) { return admis(api) && api.has('TRAIN') && !api.has('ALEXIS'); }, verbs: ['FOUILLER', 'EXAMINER'], nouns: ['ALEXIS', 'FANTOME', 'MAQUETTE'], time: 120,
          run: function (api) { if (!admis(api)) { refus(api); return; } if (portent(api)) return; if (api.flag('rechAlexis') === day(api.s.min) || (api.flag('rechAlexis') !== undefined && api.has('ALEXIS'))) { api.s.tick = 3; api.say(api.has('ALEXIS') ? 'Vous savez ce qu’il y a à savoir sur les Alexis.' : 'Les fiches restent muettes aujourd’hui.'); return; } api.flag('rechAlexis', day(api.s.min)); api.check('occ_alexis'); } },
        { id: 'm_voyage', label: 'Se documenter sur l’Orient-Express', obj: 'l’Orient-Express', verbs: ['FOUILLER', 'EXAMINER'], nouns: ['VOYAGE', 'TRAIN', 'VICTORIA', 'PISTE'], time: 90,
          run: function (api) { if (!admis(api)) { refus(api); return; } if (portent(api)) return; api.say(api.fresh('docVoy', ['Les guides abondent : le Simplon-Orient part de Paris, passe sous les Alpes par le tunnel du Simplon, traverse l’Italie, la Yougoslavie et la Bulgarie jusqu’à Constantinople. Quatre jours, quatre nuits.', 'Vous parcourez la presse sur la Yougoslavie : un royaume tout neuf, des frontières encore fraîches, des bandits dans les montagnes. Rassurant.', 'Un vieil article sur le tunnel du Simplon : vingt kilomètres sous la montagne, une chaleur d’étuve pendant les travaux, des dizaines de morts.'])); } },
        { id: 'm_makryat', label: 'Chercher Makryat', verbs: ['FOUILLER', 'EXAMINER'], nouns: ['MAKRYAT'], time: 90,
          run: function (api) { if (!admis(api)) { refus(api); return; } if (portent(api)) return; api.say('Aucun ouvrage, aucun article, aucune notice. Mehmet Makryat n’a laissé aucune trace écrite. Comme s’il avait pris soin de n’en laisser aucune.'); } },
        { id: 'm_look', label: 'Observer la salle', verbs: ['EXAMINER'], nouns: ['SALLE', 'MUSEE'], bare: true,
          run: function (api) { api.say(api.flag('portentPret') && !api.flag('portent') ? 'Peu de monde aujourd’hui, à cause de la pluie. Deux rangées plus loin, un lecteur s’est endormi sur ses livres, le chapeau encore sur la tête. Étrange qu’on le laisse faire.' : 'Des étudiants, des vieux savants, une suffragette qui recopie un traité de droit. Un gardien fait sa ronde sans faire craquer le parquet.'); } }
      ]
    },

    stoke: {
      name: 'Stoke Newington', art: 'rue',
      enter: function (api, first) { if (first) api.say('Une rue de petites maisons ouvrières, toutes pareilles. Devant l’une d’elles, à la craie sur le trottoir : « VOYEZ LA CHAMBRE DE LA MORT — 6 PENCE ». À la fenêtre, un carton écrit à la main : « Chambre à louer ».'); else api.say('Stoke Newington. L’inscription à la craie a été repassée pour mieux se voir.'); },
      things: [{ label: 'Mrs Atkins', ids: ['ATKINS'] }, { label: 'la chambre de Stanley', ids: ['CHAMBRE', 'ETAGE', 'STANLEY', 'SUIE'] }, { label: 'le poste de police du coin', ids: ['POLICE', 'YARD'] }, { label: null, ids: ['SALLE', 'STOKE'] }],
      actions: [
        { id: 's_atkins', label: 'Parler à Mrs Atkins', ideaAnon: 'Parler à la logeuse de Stanley', idea: true, talkTo: 'atkins', verbs: ['PARLER', 'ALLER', 'VISITER', 'FRAPPER', 'DONNER', 'POLI'], nouns: ['ATKINS', 'STOKE'], extra: ['STANLEY', 'MAQUETTE', 'POLICE', 'ARGENT', 'CHAMBRE', 'TOIMEME', 'SUITE', 'FANTOME', 'QUELQUUN'],
          run: function (api, p) { api.talk('atkins', p); } },
        { id: 's_chambre', label: 'Visiter la chambre de Stanley', idea: true, verbs: ['ALLER', 'VISITER', 'EXAMINER', 'FOUILLER', 'OUVRIR'], nouns: ['CHAMBRE', 'ETAGE', 'STANLEY', 'SUIE'],
          run: function (api) { if (!api.flag('chambrePayee')) { api.npc('atkins', 'Mrs Atkins vous barre l’escalier, la main tendue. « Six pence, mon chou. C’est le tarif. »'); return; } api.go('chambre_stanley'); } },
        { id: 's_police', label: 'Aller au poste de police', obj: 'le poste de police', idea: true, verbs: ['ALLER', 'PARLER', 'VISITER'], nouns: ['POLICE', 'YARD', 'SERGENT'], boost: 0.3,
          run: function (api) {
            if (api.flag('sergentVu')) { api.say('Le planton vous reconnaît et va chercher le sergent sans se faire prier.'); api.talk('sergent'); return; }
            if (api.flag('sergentRefus') === day(api.s.min)) { api.npc('planton', api.fresh('plantonNon', ['« Le sergent est sorti, {m}. Revenez demain. »', '« Toujours occupé, {m}. Demain, peut-être. »'])); return; }
            api.say('Au poste du coin, le planton vous répète ce que disent les journaux, mot pour mot, avec un plaisir évident. « Pour le reste, c’est l’affaire de ceux qui en savent plus que moi, {m}. »');
            api.check('persuasion_sergent');
          } }
      ]
    },

    chambre_stanley: {
      name: 'La chambre de Henry Stanley', art: 'chambre',
      enter: function (api, first) { api.say(first ? 'Une chambre meublée à eau froide, comme il y en a des milliers à Londres pour les hommes seuls. Mais celle-ci est tapissée de trains : gravures de locomotives, plans de gares, piles de revues, horaires de 1890 reliés en cuir.' : 'La chambre aux trains. Elle sent encore la fumée.'); },
      things: [{ label: 'les gravures et les livres', ids: ['LIVRE', 'TRAIN', 'SALLE'] }, { label: 'le plafond taché', ids: ['SUIE'] }, { label: 'la fenêtre verrouillée', ids: ['FENETRE'] }, { label: null, ids: ['STANLEY', 'CHAMBRE', 'PORTE'] }],
      actions: [
        { id: 'cs_look', label: 'Examiner la pièce', idea: true, verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'CHAMBRE', 'LIVRE', 'TRAIN'], bare: true,
          run: function (api) { api.say('En y regardant de plus près : une fine couche de suie noire sur le dessus des cadres et des piles de livres. De longues traînées sombres en travers du plafond, du coin nord-ouest au coin sud-est. Et des cloques sous le papier peint, comme si on l’avait passé à la vapeur. Mrs Atkins jure pourtant que M. Stanley ne fumait pas.'); } },
        { id: 'cs_tapis', label: 'Examiner le tapis', idea: true, verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SUIE', 'TRACES'],
          run: function (api) {
            if (api.flag('tapisVu')) {
              if (!api.has('RAILS') && !api.flag('tapis2')) { api.flag('tapis2', true); api.say('Vous vous mettez à quatre pattes, le nez sur les fleurs fanées.'); api.check('toc_tapis'); return; }
              api.say(api.has('RAILS') ? 'Les deux traînées parallèles, écartées comme des rails. Vous ne pouvez plus les voir autrement.' : 'Un tapis sombre et usé.'); return;
            }
            api.flag('tapisVu', true); api.check('toc_tapis');
          } },
        { id: 'cs_fenetre', label: 'Examiner la fenêtre', verbs: ['EXAMINER', 'OUVRIR'], nouns: ['FENETRE'],
          run: function (api) { api.say('Une fenêtre à guillotine, verrouillée de l’intérieur, le verrou encrassé de peinture. Personne ne l’a ouverte depuis des mois.'); } },
        { id: 'cs_sortir', label: 'Redescendre', repeatable: true, verbs: ['ALLER'], nouns: ['PORTE', 'ATKINS', 'STOKE'], bare: true,
          run: function (api) { api.say('Vous redescendez. Mrs Atkins vous attend en bas des marches. « Alors ? Ça fait froid dans le dos, hein ? »'); api.go('stoke'); } }
      ]
    },

    camberwell: {
      name: 'Chez Arthur Butter, à Camberwell', art: 'bureau',
      enter: function (api, first) { if (first) api.say('Une maison mitoyenne de Camberwell dont le salon tient du musée ferroviaire : gravures, lampes de chef de gare, une cloche de locomotive sur la cheminée.'); else api.say('Le salon-musée d’Arthur Butter, et son odeur de tabac à la cerise.'); },
      things: [{ label: 'Arthur Butter', ids: ['BUTTER'] }, { label: 'la porte de la cave', ids: ['CAVE', 'MAQUETTE'] }, { label: null, ids: ['SALLE', 'CAMBERWELL', 'TRAIN'] }],
      actions: [
        { id: 'cb_butter', label: 'Parler à Arthur Butter', idea: true, talkTo: 'butter', verbs: ['PARLER', 'ALLER', 'VISITER', 'POLI', 'PERSUADER', 'DONNER', 'PRENDRE'], nouns: ['BUTTER', 'CAMBERWELL'], extra: ['STANLEY', 'MAQUETTE', 'TRAIN', 'VOYAGE', 'VICTORIA', 'BILLETS', 'MANGER', 'QUELQUUN', 'FANTOME'],
          run: function (api, p) { api.talk('butter', p); } },
        { id: 'cb_cave', label: 'Descendre voir la maquette', obj: 'la maquette', idea: true, verbs: ['ALLER', 'EXAMINER', 'VISITER', 'OUVRIR'], nouns: ['CAVE', 'MAQUETTE'],
          run: function (api) { if (!api.npcs('butter').met) { api.say('Vous n’allez pas descendre dans la cave d’un inconnu sans lui avoir parlé.'); return; } api.say(api.fresh('cave', ['Butter vous ouvre la porte de la cave et allume l’ampoule. « Je vous laisse. Ça me rend triste. »', 'Vous redescendez à la cave. L’ampoule se balance au bout de son fil.'])); api.go('cave'); } }
      ]
    },

    cave: {
      name: 'La cave d’Arthur Butter', art: 'cave',
      enter: function (api, first) { if (first) api.say('Une cave humide, une seule ampoule. Contre le mur, une grande planche de bois dur, si lourde qu’il faudrait plusieurs hommes pour la porter. Dessus, une voie en huit étrangement tordu, avec des rampes qui montent et descendent. Un petit train brun et noir, à l’ancienne : une locomotive massive, un tender, deux voitures.'); },
      things: [{ label: 'la maquette', ids: ['MAQUETTE', 'TRAIN'] }, { label: 'le dessous de la planche', ids: ['MOUCHOIR'] }, { label: 'les wagons', ids: ['SYMBOLES'] }, { label: null, ids: ['SALLE', 'CAVE', 'LAMPE'] }],
      ambient: ['L’ampoule grésille.', 'Au-dessus, Butter fait les cent pas. Le plancher grince.', 'Une goutte tombe quelque part, régulière comme un balancier.'],
      actions: [
        { id: 'cv_look', label: 'Examiner la maquette', idea: true, verbs: ['EXAMINER'], nouns: ['MAQUETTE', 'SALLE', 'CAVE'], bare: true,
          run: function (api) { api.say('Un travail superbe, à l’échelle, dans le style des années 1890. Chaque voiture porte un numéro de série différent. Pas de décor : seulement la voie, ses rampes, et une grosse pile neuve pour l’alimenter. Le huit est tordu d’une manière qui fatigue les yeux quand on le suit trop longtemps.'); api.clue('MAQUETTE'); } },
        { id: 'cv_mouchoir', label: 'Regarder sous la planche', obj: 'le dessous de la planche', idea: true, verbs: ['EXAMINER', 'FOUILLER', 'PRENDRE'], nouns: ['MOUCHOIR'],
          run: function (api) { api.say('Épinglé sous la planche, un mouchoir d’homme, en fil fin, sans doute pour protéger la surface sur laquelle on la pose. Dans un coin, brodées : les initiales R. A.'); api.flag('mouchoirVu', true); } },
        { id: 'cv_wagons', label: 'Examiner les wagons de près', obj: 'les wagons', verbs: ['EXAMINER', 'FOUILLER', 'PRENDRE'], nouns: ['SYMBOLES', 'TRAIN'],
          run: function (api) { api.say('Vous retournez les voitures une à une. Sous chaque châssis, des symboles ont été gravés à la pointe : des signes que vous ne connaissez pas, et que vos yeux n’aiment pas suivre.' + (api.skill('Occultisme') >= 40 ? ' Votre culture occulte en reconnaît la famille : des signes de passage. Des clés.' : '')); } },
        { id: 'cv_tourner', label: 'Faire tourner le train', idea: true, verbs: ['UTILISER', 'OUVRIR', 'ALLER', 'ATTENDRE', 'JOUER', 'LANCER'], nouns: ['MAQUETTE', 'TRAIN'], time: 10, repeatable: true,
          run: function (api) { tourner(api); } },
        { id: 'cv_remonter', label: 'Remonter', repeatable: true, verbs: ['ALLER'], nouns: ['BUTTER', 'PORTE'], bare: true, cond: function (api) { return !api.flag('fantomeVenu'); },
          run: function (api) { api.go('camberwell'); } }
      ]
    },

    wagon1: {
      name: 'Le train fantôme, première voiture', art: 'fantome',
      enter: function () {},
      things: [{ label: 'les passagers morts', ids: ['PASSAGERSMORTS', 'PASSAGERS', 'QUELQUUN'] }, { label: 'la porte du fond', ids: ['PORTE'] }, { label: null, ids: ['SALLE', 'FENETRE', 'FANTOME', 'TRAIN', 'COMPARTIMENT'] }],
      nudges: [{ at: 1, run: function (api) { api.event('Au bout du couloir, une porte à rideau s’ouvre à la volée. Un homme crie : « Par ici ! Vite ! »'); api.flag('porteOuverte', true); } }],
      actions: [
        { id: 'w1_look', label: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE', 'PASSAGERSMORTS', 'PASSAGERS', 'QUELQUUN', 'FENETRE', 'TRAIN', 'FANTOME'], bare: true,
          run: function (api) { api.say('Les visages fades se sont assombris. Leurs yeux roulent jusqu’à ne plus montrer que du blanc. Peau bleuâtre, cheveux collés, lèvres et ongles livides. Ils sentent le vieux bois mouillé. Leurs vêtements se frôlent avec un bruit de papillons de nuit. Ils s’approchent, lentement, avec l’assurance de ceux qui ont tout leur temps.'); } },
        { id: 'w1_fuir', label: 'Foncer vers la porte du fond', idea: true, verbs: ['ALLER', 'OUVRIR', 'CACHER', 'SAUTER'], nouns: ['PORTE'], bare: true,
          run: function (api) { api.say('Vous vous jetez dans le couloir, entre les corps qui se referment.'); api.check('esquive_morts'); } },
        { id: 'w1_frapper', label: 'Frapper les morts', verbs: ['MENACER', 'FRAPPER', 'CASSER'], nouns: ['PASSAGERSMORTS', 'PASSAGERS', 'QUELQUUN'], bare: true,
          run: function (api) { api.say(api.fresh('frapMorts', ['Votre poing s’enfonce dans une joue froide comme de la pâte. Le mort recule, sourit, et revient.', 'Vous en repoussez un. Deux autres prennent sa place. Ils ne se fatiguent pas, et vous si.'])); } },
        { id: 'w1_parler', label: 'Parler aux morts', obj: 'les morts', verbs: ['PARLER', 'PERSUADER', 'PRIER'], nouns: ['PASSAGERSMORTS', 'PASSAGERS', 'QUELQUUN'], bare: true,
          run: function (api) { api.npc('morts', api.fresh('mortsP', ['« Venez avec nous. »', '« Le contrôleur arrive bientôt. Restez. Restez donc. »', 'Ils soupirent tous ensemble, avec gourmandise.'])); } }
      ]
    },

    wagon2: {
      name: 'Le train fantôme, deuxième voiture', art: 'fantome',
      enter: function () {},
      things: [{ label: 'Randolph Alexis', ids: ['ALEXIS'] }, { label: 'Henry Stanley', ids: ['STANLEY'] }, { label: 'le premier compartiment', ids: ['COMPARTIMENT', 'OS'] }, { label: 'le motif au sol, dans le dernier compartiment', ids: ['COEUR'] }, { label: 'la fenêtre', ids: ['FENETRE'] }, { label: null, ids: ['SALLE', 'HEURE', 'PORTE', 'TRAIN', 'FANTOME', 'PASSAGERSMORTS'] }],
      nudges: [{ at: 8, cond: function (api) { return !api.flag('relief'); }, run: function (api) { api.event('Alexis tourne autour de son motif en marmonnant. « Albert a réussi. Il a réussi. Qu’est-ce qu’il avait que je n’ai pas ? » Vous repensez à la maquette, à ses rampes.'); } }],
      actions: [
        { id: 'w2_look', label: 'Regarder la voiture', idea: true, verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'TRAIN', 'FANTOME'], bare: true,
          run: function (api) { api.say('Une voiture déserte, poussiéreuse, silencieuse. Les compartiments sont vides, sauf les trois derniers. Au plafond, des milliers de petits traits tracés à intervalles réguliers. Votre montre s’est arrêtée.'); } },
        { id: 'w2_fenetre', label: 'Regarder par la fenêtre', idea: true, verbs: ['EXAMINER', 'OUVRIR'], nouns: ['FENETRE'],
          run: function (api) { if (api.once('vide')) { api.say('Dehors, un univers gris comme une plaque photographique voilée. À travers les vapeurs courent d’innombrables traînées d’un noir bleuté : les trajets du train fantôme, enroulés les uns autour des autres comme un serpent gigantesque, à perte de vue. À chaque à-coup, le train ajoute un anneau à la bête.'); api.lose(1); return; } api.say('Le gris. Les anneaux. Vous ne regardez pas longtemps.'); } },
        { id: 'w2_os', label: 'Examiner le premier compartiment', idea: true, verbs: ['EXAMINER', 'FOUILLER', 'OUVRIR'], nouns: ['COMPARTIMENT', 'OS'],
          run: function (api) { if (api.flag('montre')) { api.say('Vous ne rouvrirez pas ce compartiment.'); return; } api.flag('montre', true); api.say('Des vêtements en lambeaux, et des os éparpillés, rongés. Alexis hausse les épaules derrière vous. « Un homme doit manger. » Dans les lambeaux, une breloque de montre gravée : A. A.'); api.lose(1 + Math.floor(api.rand() * 2)); } },
        { id: 'w2_alexis', label: 'Parler à Alexis', idea: true, talkTo: 'alexis', verbs: ['PARLER', 'ALLER', 'VISITER', 'PSY', 'POLI', 'PERSUADER'], nouns: ['ALEXIS'], extra: ['TOIMEME', 'TRAIN', 'HEURE', 'STANLEY', 'QUELQUUN', 'PASSAGERSMORTS', 'COEUR', 'SUITE', 'OS'],
          run: function (api, p) { api.talk('alexis', p); } },
        { id: 'w2_stanley', label: 'Parler à Henry Stanley', idea: true, talkTo: 'stanley', verbs: ['PARLER', 'ALLER', 'VISITER', 'POLI', 'PERSUADER'], nouns: ['STANLEY'], extra: ['MAQUETTE', 'TOIMEME', 'ALEXIS', 'TRAIN', 'VOYAGE'],
          run: function (api, p) { api.talk('stanley', p); } },
        { id: 'w2_motif', label: 'Examiner le motif au sol', idea: true, verbs: ['EXAMINER', 'FOUILLER', 'UTILISER'], nouns: ['COEUR'],
          run: function (api, p) {
            if (p && /rampe|relief|hauteur|trois dimensions|cale|pente|niveau|monte/.test(p.text || '')) { reliefTrouve(api); return; }
            if (api.flag('relief')) { api.say('Le motif tient maintenant debout, tordu dans l’espace comme la voie de la maquette. Il attend qu’on le parcoure.'); return; }
            if (!api.flag('motifVu')) { api.flag('motifVu', true); api.say('Dans le dernier compartiment, étalé sur le plancher, un grand huit tordu, fait de choses longues et molles que vous refusez d’identifier. Le dessin est exactement celui de la voie de la maquette. Mais à plat.'); api.lose(api.rand() < 0.5 ? 1 : 2); api.check('idee_relief'); return; }
            if (api.count('motifRelu') >= 1) { api.say('Vous fermez les yeux et revoyez la voie de la maquette, dans la cave de Butter : les rampes qui montent, les pentes qui plongent. Le huit n’était pas plat.'); reliefTrouve(api); return; }
            api.say('À plat. Le motif est à plat. Et la maquette ?');
          } },
        { id: 'w2_tour', label: 'Faire circuler le cœur sur le motif', idea: true, ideaCond: function (api) { return api.flag('relief'); }, verbs: ['UTILISER', 'PRENDRE', 'ALLER', 'JOUER', 'LANCER', 'OUVRIR', 'DONNER'], nouns: ['COEUR', 'MAQUETTE', 'TRAIN'], cond: function (api) { return api.flag('relief'); }, repeatable: true,
          run: function (api) {
            var left = api.flag('toursRestants');
            if (!api.flag('assaut')) {
              api.flag('assaut', true); api.flag('toursRestants', 2 + Math.floor(api.rand() * 4));
              api.say('Vous commencez. La chose fait le tour du huit, monte, descend, et le train frémit. Au troisième tour, des pas sur le toit. Une silhouette glisse et tombe dans le gris, en traçant sa propre traînée de bras et de jambes. Puis les vitres éclatent : les morts arrivent par-dessus.');
              api.say('Il reste ' + api.flag('toursRestants') + ' tours à faire, sous l’assaut.');
              return;
            }
            api.check('dex_coeur');
          } }
      ]
    },

    retour: {
      name: 'Le train fantôme, en Angleterre', art: 'fantome',
      enter: function (api) { api.check('ecouter_sifflet'); },
      things: [{ label: 'la portière', ids: ['PORTE', 'FENETRE'] }, { label: 'la locomotive, à l’avant', ids: ['LEVIER'] }, { label: null, ids: ['SALLE', 'ALEXIS', 'STANLEY', 'TRAIN', 'FANTOME', 'PASSAGERSMORTS'] }],
      actions: [
        { id: 'r_sauter', label: 'Sauter du train', obj: 'la portière', idea: true, verbs: ['SAUTER', 'ALLER', 'OUVRIR'], nouns: ['PORTE', 'FENETRE'], extra: ['TRAIN'], bare: true,
          run: function (api) { api.say('Vous ouvrez la portière. Le ballast défile en une bouillie grise. Vous sautez.'); api.check('saut'); } },
        { id: 'r_levier', label: 'Courir jusqu’à la locomotive', obj: 'la locomotive', idea: true, verbs: ['ALLER', 'UTILISER', 'OUVRIR', 'ALARME', 'PRENDRE'], nouns: ['LEVIER', 'TRAIN'],
          run: function (api) { api.say('Vous traversez les voitures en courant, escaladez le tender, et tombez dans la cabine vide. Pas de mécanicien, pas de chauffeur. Le foyer brûle encore du charbon pelleté en 1897. Des leviers partout.'); api.check('chance_levier'); } },
        { id: 'r_alarme', label: 'Tirer le signal d’alarme', verbs: ['ALARME'], bare: true,
          run: function (api) { api.say('Vous tirez la poignée de toutes vos forces. Rien. Il n’y a plus personne aux commandes depuis vingt-cinq ans pour obéir au signal.'); } },
        { id: 'r_rester', label: 'Rester à bord', obj: 'le train', verbs: ['ATTENDRE', 'ASSEOIR', 'PRIER'], bare: true,
          run: function (api) { api.say('Vous vous agrippez à une banquette. Le choc est inimaginable.'); var d = 4 + Math.floor(api.rand() * 18); var pv = api.s.pc.pv; api.hp(-Math.min(d, pv - 1)); if (d >= pv) api.say('Vous survivez, on ne sait comment, au milieu de la ferraille en flammes. Les médecins parleront de miracle.'); collision(api, false); } }
      ]
    },

    campagne: {
      name: 'Un champ, au nord-ouest de Londres', art: 'campagne',
      enter: function () {},
      things: [{ label: 'l’épave', ids: ['FANTOME', 'TRAIN'] }, { label: 'Stanley', ids: ['STANLEY'] }, { label: 'Alexis', ids: ['ALEXIS'] }, { label: null, ids: ['SALLE'] }],
      actions: [
        { id: 'cp_look', label: 'Regarder autour de vous', idea: true, verbs: ['EXAMINER'], nouns: ['SALLE', 'FANTOME', 'TRAIN'], bare: true,
          run: function (api) { api.say('Une aube grise sur des champs détrempés. De la vapeur monte encore de la voie. Des cheminots courent le long du ballast en criant. Au loin, le clocher d’un village et l’enseigne d’une auberge.'); } },
        { id: 'cp_alexis', label: 'Parler à Alexis', verbs: ['PARLER', 'ALLER'], nouns: ['ALEXIS'],
          run: function (api) { if (api.flag('alexisParti')) { api.say('Alexis a disparu à travers champs. Personne ne l’a vu partir. Personne ne le cherchera.'); return; } api.flag('alexisParti', true); api.npc('alexis', '« 1911, avais-je dit ? » Il regarde les cheminots, leurs casquettes, un aéroplane qui passe très haut. « Je me suis trompé de quelques années, peut-être. » Il rit, longuement, et s’éloigne à travers champs sans se retourner.'); } },
        { id: 'cp_stanley', label: 'Parler à Stanley', verbs: ['PARLER', 'ALLER'], nouns: ['STANLEY'],
          run: function (api) { api.npc('stanley', '« Je vais rentrer chez Mrs Atkins. Je vais brûler mes revues. Je vais collectionner les timbres. Les timbres, ça ne vient chercher personne. »'); } },
        { id: 'cp_rentrer', label: 'Rentrer à Londres', idea: true, repeatable: true, verbs: ['ALLER', 'DORMIR'], nouns: ['HOTEL', 'TRAIN'], bare: true,
          run: function (api) { api.say('Vous passez deux jours à l’auberge du village, le temps de répondre aux questions de la compagnie des chemins de fer sans rien dire de vrai. Puis un train ordinaire, terriblement ordinaire, vous ramène à Londres.'); api.s.min = (day(api.s.min) + 2) * D + 17 * 60; api.go('hotel'); } }
      ]
    },

    victoria: {
      name: 'La gare Victoria', art: 'gare',
      enter: function (api, first) { if (first) api.say('Sous la grande verrière noircie, la vapeur des locomotives se mêle au brouillard. Des porteurs, des malles, des adieux. Sur le quai 8, le train du ferry pour Douvres attend, ses voitures bleues marquées « Continental ».'); else api.say('Victoria, sa vapeur, ses adieux.'); },
      things: [{ label: 'le train du ferry', ids: ['TRAIN', 'VICTORIA', 'VOYAGE'] }, { label: 'le guichet des wagons-lits', ids: ['BILLETS'] }, { label: null, ids: ['SALLE', 'QUELQUUN'] }],
      actions: [
        { id: 'v_look', label: 'Regarder la gare', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE'], bare: true,
          run: function (api) { api.say(api.fresh('vic', ['Une horloge géante, des pigeons, des marchands de journaux qui crient les nouvelles du jour. Une femme en deuil embrasse un jeune homme en uniforme.', 'Un porteur vous propose ses services. Plus loin, un homme brun à moustache lit le journal. Quand vous regardez de nouveau, ce n’est qu’un retraité qui dort.'])); } },
        { id: 'v_billets', label: 'Acheter les billets au guichet', idea: true, ideaCond: function (api) { return !api.item(BILLETS); }, verbs: ['PRENDRE', 'COMMANDER', 'DONNER', 'UTILISER', 'PARLER'], nouns: ['BILLETS'],
          run: function (api) { reserver(api); } },
        { id: 'v_partir', label: 'Monter dans le train pour Douvres', idea: true, repeatable: true, verbs: ['ALLER', 'UTILISER'], nouns: ['TRAIN', 'VICTORIA', 'VOYAGE'], bare: true,
          run: function (api) {
            if (!api.has('QUETE')) { api.say('Partir ? Pour où, et pourquoi ? Rien ne vous appelle encore sur le continent.'); return; }
            if (!api.item(BILLETS)) { api.say('Il vous faut d’abord vos billets. Le guichet de la Compagnie des wagons-lits est juste là.'); return; }
            depart(api);
          } },
        { id: 'v_rentrer', label: 'Retourner à l’hôtel', repeatable: true, verbs: ['ALLER'], nouns: ['HOTEL'],
          run: function (api) { taxi(api, 'hotel'); } }
      ]
    }
  };

  function boutiqueRes(api, r, ok, ko) {
    if (r.success) { api.flag('boutiqueOuverte', true); api.say(ok); if (r.pushed) api.flag('vuIslington', true); api.go('boutique'); return; }
    if (!r.pushed) { api.say(ko); return; }
    api.flag('islingtonBloque', day(api.s.min));
    api.say('Une fenêtre s’allume en face. Quelqu’un crie « Police ! » dans le brouillard, puis un sifflet répond, pas si loin. Vous filez avant que l’agent n’arrive. Mieux vaut revenir un autre jour.');
  }
  function tourner(api) {
    if (api.flag('fantomeVenu')) { api.say('La maquette est inerte. Elle a fait ce qu’elle avait à faire.'); return; }
    if (api.flag('maquetteDetruite')) { api.say('Il n’en reste que des débris.'); return; }
    var need = api.flag('toursNeeded'); if (!need) { need = 1 + Math.floor(api.rand() * 50); api.flag('toursNeeded', need); }
    var done = (api.flag('tours') || 0) + 10 + Math.floor(api.rand() * 11); api.flag('tours', done);
    if (done < need) {
      api.say(api.fresh('tourner', ['Vous branchez la pile. Le petit train s’ébranle, gravit la rampe, plonge, remonte. Un tour, deux, dix. Le bruit est hypnotique.', 'Le train tourne, et tourne encore. Vous ne savez plus combien de tours. La lumière semble plus faible.', 'Encore des tours. Il fait plus froid, ou plus humide. Vous croyez sentir une odeur de charbon.', 'Le train continue sa course. Sur la voie, une buée légère, comme une haleine.']));
      return;
    }
    api.flag('fantomeVenu', true);
    api.drop(MAQ);
    api.fx('flicker');
    api.say('La voie se met à scintiller. Une vapeur épaisse monte du sol, et avec elle un grondement énorme, impossible : le halètement d’une vraie locomotive. Une machine noire de soixante-dix tonnes surgit du mur, traverse la pièce sans rien renverser, suivie de son tender, et disparaît dans le mur d’en face. Puis une voiture de première classe s’immobilise devant vous, portières ouvertes, dans une odeur de bois mouillé.');
    api.check('san_fantome');
  }
  function admis(api) { var c = api.flag('carteMusee'); return c !== undefined && c !== false && day(api.s.min) >= c; }
  function refus(api) {
    api.s.tick = 3;
    api.npc('bibliothecaire', api.flag('carteMusee') ? api.fresh('refus1', ['« Votre carte n’est pas encore prête. Chut. »', 'Le conservateur secoue la tête et tapote son registre : pas encore.']) : api.fresh('refus2', ['« Une carte de lecteur, d’abord. Chut. »', 'Le conservateur pointe du doigt le panneau : « Lecteurs munis d’une carte uniquement ».']));
    if (!api.flag('carteMusee')) api.chips([{ label: 'Demander une carte de lecteur', action: 'm_carte' }]);
  }
  function portent(api) {
    if (api.flag('portent')) return false;
    var first = api.flag('jourRecherche');
    if (first === undefined) { api.flag('jourRecherche', day(api.s.min)); return false; }
    if (day(api.s.min) <= first) { api.flag('portentPret', true); return false; }
    api.flag('portent', true);
    api.say('Il pleut à verse, la salle est presque vide. Deux rangées plus loin, un lecteur dort sur ses livres, le chapeau encore sur la tête. Au bout d’un moment, il glisse lentement de sa chaise et s’affaisse sur le parquet, sans un bruit.');
    api.say('Un gardien accourt, soulève le chapeau. Sous le chapeau, sous le manteau, dans les chaussures, il n’y a plus de peau. Seulement ce qu’il y a dessous, luisant, d’une couleur que vous n’oublierez pas.');
    api.check('san_cadavre');
    return true;
  }
  function billet(api) {
    api.flag('billetRecu', true);
    api.event('Le soir, un bruit léger contre la porte. Une enveloppe vient d’être glissée dessous. Dans le couloir, personne.');
    api.say('À l’intérieur, une carte de visite du professeur Smith. Au dos, d’une écriture tremblée : « Venez sans tarder. Il me reste peu de temps. Pour l’amour de Dieu, que personne ne vous suive. J. A. Smith. » Le rabat est scellé d’une goutte de cire marquée de sa chevalière. Au recto, une adresse à Cheapside, un quartier où Smith n’aurait jamais mis les pieds.');
    api.take(CARTE); api.clue('BILLET'); learn(api, 'cheapside');
  }
  function reserver(api) {
    if (api.item(BILLETS)) { api.say('Vos billets sont déjà dans votre portefeuille, avec la réservation des wagons-lits.'); return; }
    if (!api.has('QUETE')) { api.say('Réserver un voyage ? Rien ne vous y pousse encore.'); return; }
    if (api.s.money < 12) { api.say('Il vous faudrait une douzaine de livres pour le premier tronçon jusqu’à Paris. Vous ne les avez pas.'); return; }
    var hb = hour(api.s.min), jb = JOURS[(4 + day(api.s.min)) % 7];
    if (jb === 'dimanche' || hb < 9 || hb >= 19) {
      // une première fois, on apprend les horaires ; si l'on insiste, on attend l'ouverture
      if (!api.flag('guichetFerme')) { api.flag('guichetFerme', true); api.say((jb === 'dimanche' ? 'Un dimanche ? Les bureaux de la Compagnie des wagons-lits et de Cook sont fermés. On réserve à partir de lundi, 9 h.' : 'À cette heure, les bureaux de la Compagnie des wagons-lits sont fermés. On réserve de 9 h à 19 h.') + ' Vous pouvez revenir, ou attendre l’ouverture.'); return; }
      var dj = day(api.s.min) + (hb >= 9 ? 1 : 0); if (JOURS[(4 + dj) % 7] === 'dimanche') dj++;
      api.s.min = dj * D + 9 * 60 + 5; api.s.tick = 0; api.flag('guichetFerme', false);
      api.say('Vous attendez l’ouverture. Une nuit trop courte, un thé brûlant, et vous êtes le premier client devant le rideau qui se lève.');
    }
    api.s.money -= 12; api.take(BILLETS);
    api.say(api.s.loc === 'victoria' ? 'Au guichet de la Compagnie internationale des wagons-lits, un employé à manchettes établit vos billets : train du ferry, traversée Douvres-Calais, voiture directe pour Paris, puis le Simplon-Orient. Douze livres pour le premier tronçon, le reste sera réglé en route.' : 'Le réceptionniste téléphone à l’agence Cook. Une heure plus tard, un coursier apporte vos billets : train du ferry depuis Victoria, traversée Douvres-Calais, voiture directe pour Paris, réservation sur le Simplon-Orient. Douze livres pour le premier tronçon.');
  }
  function dormir(api) {
    var d = day(api.s.min) + (hour(api.s.min) >= 6 ? 1 : 0);
    api.s.min = d * D + 8 * 60;
    api.s.tick = 0;
    if (api.flag('maquetteDetruite') && !api.flag('stanleySauve')) {
      api.say('Vous rêvez d’un train qui roule dans le gris, sans fin, et d’un visage écrasé contre une vitre : Henry Stanley, qui hurle sans bruit. Vous vous réveillez trempé{e} de sueur.');
      api.lose(1);
    } else api.say(api.fresh('nuit', ['Vous dormez mal. Le radiateur cogne, la ville tousse dans son brouillard.', 'Un sommeil sans rêves, ou presque. Au matin, vous ne vous souvenez que d’une odeur de cuir brûlé.', 'Vous vous réveillez à l’aube, persuadé{e} que quelqu’un se tenait au pied de votre lit.']));
    if (day(api.s.min) >= 4) api.flag('stanleyDispo', true);
  }
  function depart(api) {
    api.say('Le train s’ébranle dans un nuage de vapeur. Londres glisse derrière les vitres, puis le Kent, les vergers nus, les marais de Romney où le brouillard s’attarde. Moins de deux heures plus tard, Douvres, ses falaises blanches, et le ferry qui se balance sur une mer couleur d’ardoise.');
    api.say('La traversée est rude. À Calais, on vous installe dans une voiture bleue et or de la Compagnie des wagons-lits, qui sera accrochée au Simplon-Orient-Express. Quelque part derrière vous, en Angleterre, un homme sans visage relève peut-être la tête.');
    api.end();
  }
  L.ending = { title: 'Fin du chapitre : Londres', text: 'Le Simplon-Orient-Express vous attend à Paris. La suite de la campagne n’est pas encore écrite.' };
  function conference(api) {
    if (api.flag('conference')) return;
    api.flag('conference', true);
    api.endTalk(false);
    api.say('Smith monte à la tribune sous les applaudissements. Pendant une demi-heure, il fait rire la salle aux larmes en racontant comment il a démasqué médiums, voyantes et faiseurs de miracles. La plupart des tricheurs, explique-t-il, ne cherchent pas l’argent, mais l’attention, la foi, le réconfort.');
    api.say('Puis sa voix change. Il existe, dit-il, des phénomènes qui résistent à toute explication : les esprits frappeurs, les voyageurs soudain transportés à mille lieues ou à mille ans de chez eux, et les hantises. C’est de celles-ci qu’il veut parler.');
    api.say('La lumière baisse. Le projecteur s’allume. Sur l’écran, un bateau de pêche breton, une femme dans un escalier norvégien, un fiacre londonien, chacun photographié depuis trois positions à la fois. Smith montre que ces apparitions ne naissent pas d’un point, mais émergent d’un coup, comme à travers un rideau invisible. Qu’elles sont à demi transparentes : une vague traverse le bateau sans écume. Qu’elles luisent faiblement. Et qu’elles bougent deux fois moins vite que le monde autour d’elles.');
    api.say('« Je crois, conclut-il, que ces hantises sont des tentatives, maladroites, de retour dans notre temps et notre espace, de la part de choses qui en ont été retirées. Les murs de ce que nous appelons la normalité sont plus souples que nous ne le pensons. Ce qui attend de l’autre côté est-il lumière, ténèbres, ou simplement autre chose ? Chacun, pour l’instant, doit répondre seul. »');
    api.say('Un silence, puis une ovation. On se lève, on se presse autour de lui.');
    api.clue('CONFERENCE');
    api.check('toc_observateur');
  }

  L.globalActions = [
    goAct('hotel'), goAct('institut'), goAct('cheapside'), goAct('chelsea'), goAct('yard'), goAct('ambassade'), goAct('islington'), goAct('musee'), goAct('stoke'), goAct('camberwell'), goAct('victoria'),
    { id: 'g_ici', label: 'Rester ici', verbs: ['ALLER', 'VISITER'], nouns: Object.keys(PLACES).map(function (k) { return PLACES[k].concept; }), boost: -0.2, repeatable: true,
      run: function (api, p) {
        var here = PLACES[zone(api.s.loc)];
        if (here && p && p.c[here.concept] !== undefined) { api.say(api.fresh('ici', ['Vous y êtes déjà.', 'C’est ici même.', 'Vous y êtes. Regardez autour de vous.'])); return; }
        api.say(L.generic.verbs.ALLER(api));
      } },
    { id: 'g_lieux', label: 'Où aller ?', verbs: ['ALLER', 'EXAMINER', 'PRENDRE', 'COMMANDER'], nouns: ['DESTINATIONS', 'TAXI'], repeatable: true,
      cond: function (api) { return !/^wagon|^retour|^institut|^campagne/.test(api.s.loc); },
      run: function (api) { var c = destChips(api); if (!c.length) { api.say('Rien ne vous appelle ailleurs pour l’instant. Vous pouvez toujours écrire « aller à… ».'); return; } api.say(c.length > 1 ? 'Plusieurs adresses vous appellent :' : 'Une adresse vous appelle :'); api.chips(c); } },
    { id: 'g_journal', label: 'Acheter un journal', verbs: ['PRENDRE', 'EXAMINER', 'COMMANDER', 'DONNER'], nouns: ['JOURNAL'], repeatable: true, cond: function (api) { return /^(islington|stoke|victoria|yard|chelsea|musee|camberwell)$/.test(api.s.loc); },
      run: function (api) {
        var hj = hour(api.s.min);
        if (hj >= 22 || hj < 5) { api.say(api.fresh('pasDeCrieur', ['À cette heure, plus un crieur dans les rues. Les éditions du matin ne sortiront des presses qu’à l’aube.', 'Les kiosques sont fermés, les crieurs couchés. Il faudra attendre le matin pour un journal.'])); return; }
        var where = { yard: ['Un exemplaire du jour traîne sur un banc du hall.', 'Vous empruntez le journal d’un agent qui somnole.'], chelsea: ['Les journaux du jour sont empilés sur le comptoir de la réception.', 'Vous prenez un journal sur la pile, sous l’œil las du réceptionniste.'], musee: ['Vous empruntez le journal du jour sur le présentoir des périodiques.', 'Le présentoir des périodiques vous fournit un journal du jour.'], camberwell: ['Butter vous tend son journal, plié à la page des chemins de fer.', 'Vous reprenez le journal de Butter, toujours plié aux chemins de fer.'] }[api.s.loc] || ['Vous achetez un journal à un crieur qui hurle les titres dans le brouillard.', 'Un gamin vous vend un journal encore humide d’encre.'];
        api.say(api.fresh('crieur:' + api.s.loc, where)); lirePresse(api);
      } },
    { id: 'g_carte', label: 'Relire la carte de Smith', verbs: ['EXAMINER', 'UTILISER'], nouns: ['CARTEVISITE'], cond: function (api) { return api.item(CARTE) && api.s.loc !== 'hotel'; },
      run: function (api) { api.say('« Venez sans tarder. Il me reste peu de temps. Que personne ne vous suive. » Et l’adresse de Cheapside.'); } },
    { id: 'g_pistes', label: 'Repenser aux pistes de Smith', obj: 'les pistes de Smith', verbs: ['EXAMINER', 'ATTENDRE'], nouns: ['PISTE', 'SIMULACRE', 'MOSQUEE'], cond: function (api) { return api.has('PISTES'); },
      run: function (api) { api.say('Paris et le comte Fenalik. Venise et Alvise de Gremanci. Trieste et Winckelmann. Belgrade et le docteur Todorovic. Sofia et ce qui fut caché en 1875. Milan, et un acheteur sans nom. Puis Constantinople, et la Mosquée Maudite.'); } },
    { id: 'g_etat', label: 'Faire le point sur vous-même', obj: 'vous-même', verbs: ['EXAMINER', 'ATTENDRE', 'CONTEMPLER'], nouns: ['ETAT'],
      run: function (api) { api.say(['Vous allez bien. Fatigué{e}, inquiet{e} pour Smith, mais lucide.', 'Vous dormez mal. Le visage brûlé revient quand vous fermez les yeux.', 'Vous vous surprenez à toucher votre propre visage, pour vérifier que la peau tient toujours.', 'Vous ne savez plus très bien qui vous êtes sous votre peau. Vous répétez votre nom : {Nom}. {Nom}.'][api.sanState()]); } },
    { id: 'cv_detruire', label: 'Détruire la maquette', verbs: ['CASSER', 'BRULER'], nouns: ['MAQUETTE', 'TRAIN'], needVerb: true,
          cond: function (api) { return api.s.loc === 'cave' || (api.s.loc === 'hotel' && api.item(MAQ)); },
          run: function (api) {
            if (api.flag('maquetteDetruite') || api.flag('fantomeVenu')) { api.say('Trop tard pour ça.'); return; }
            api.drop(MAQ);
            api.flag('maquetteDetruite', true);
            api.say(api.s.loc === 'cave' ? 'Vous soulevez la planche et la laissez retomber, encore et encore, jusqu’à ce que la voie se torde et que les petites voitures éclatent. Butter, en haut, pousse un cri. Vous vous sentez mieux. Pour l’instant.' : 'Vous brisez la voie à coups de talon, puis vous écrasez les petites voitures une à une. Le vernis craque comme du bois mouillé. Une odeur de charbon flotte un moment dans la chambre. Vous vous sentez mieux. Pour l’instant.');
          } },
    { id: 'g_meta', label: 'Question sur le jeu', nouns: ['META'],
      run: function (api) { api.sys('Ce chapitre est entièrement scripté, adapté librement du scénario. Décrivez ce que fait votre investigateur, comme à une table de jeu.'); } },
    { id: 'g_dormir', label: 'Dormir', verbs: ['DORMIR'], bare: true, repeatable: true, cond: function (api) { return api.s.loc !== 'hotel'; },
      run: function (api) { api.say(/^wagon|^retour/.test(api.s.loc) ? api.fresh('dormW', ['Dormir ici ? Alexis vous regarde comme on regarde un gigot.', 'Vous fermez les yeux une seconde. Quelque chose gratte à la porte. Vous les rouvrez.']) : api.fresh('dorm', ['Pas ici. Rentrez d’abord à votre hôtel.', 'Vous bâillez. Votre lit, à Bloomsbury, vous attend.', 'Dormir ? Plus tard, à l’hôtel.'])); api.chips([{ label: 'Aller : votre hôtel, à Bloomsbury', action: 'go_hotel' }]); } },
    { id: 'g_billets', label: 'Réserver les billets', verbs: ['PRENDRE', 'COMMANDER', 'UTILISER', 'DONNER'], nouns: ['BILLETS', 'VOYAGE'], cond: function (api) { return api.s.loc !== 'hotel' && api.s.loc !== 'victoria' && !/^wagon|^retour|^institut/.test(api.s.loc); },
      run: function (api) {
        if (api.item(BILLETS)) { api.say('Vos billets sont déjà dans votre portefeuille.'); return; }
        api.say(api.fresh('gbil', ['Le plus simple : la réception de votre hôtel téléphonera chez Cook. Ou bien le guichet des wagons-lits, à la gare Victoria.', 'Les billets se prennent à la gare Victoria, ou par téléphone depuis votre hôtel.']));
        api.chips([{ label: 'Aller : votre hôtel, à Bloomsbury', action: 'go_hotel' }, { label: 'Aller : la gare Victoria', action: 'go_victoria' }]);
      } },
    { id: 'g_police', label: 'Prévenir la police', verbs: ['PARLER', 'CRIER'], nouns: ['POLICE'], cond: function (api) { return api.s.loc !== 'yard' && api.s.loc !== 'stoke'; },
      run: function (api) { learn(api, 'yard'); var qui = [api.sait('MEURTRES') ? 'l’inspecteur Fleming s’occupe des meurtres du Chelsea Arms' : '', api.sait('INCENDIE') ? 'le sergent Rigby de l’incendie de Smith' : ''].filter(Boolean); api.say('Scotland Yard est à vingt minutes en taxi.' + (qui.length ? ' D’après les journaux, ' + qui.join(', ') + '.' : ' On vous y écoutera, si vous avez quelque chose à dire.')); } }
  ];

  L.generic = {
    absent: ['Vous ne voyez pas {x} ici.', 'Vous cherchez {x} des yeux, en vain.', '{X} ? Pas ici.'],
    verbs: {
      EXAMINER: ['Rien de particulier. Votre regard s’arrête sur : {things}.', 'Vous regardez, sans rien remarquer de neuf. Autour de vous : {things}.', 'Rien ne retient vraiment votre attention. Restent {things}.'],
      FOUILLER: ['Vous cherchez un peu au hasard, sans résultat. Mieux vaut viser quelque chose de précis : {things}.', 'Fouiller, oui, mais quoi ? Il y a {things}.', 'Vos mains cherchent dans le vide. Choisissez : {things}.'],
      PRENDRE: ['Vous n’allez pas emporter ça.', 'Ça ne se prend pas, ou ça ne vous servirait à rien.', 'Vous tendez la main, puis vous vous ravisez.'],
      SENTIR: ['Le brouillard, la suie, le crottin, la pluie. Londres.', 'Une odeur de charbon mouillé, partout, jusque dans vos vêtements.', 'Sous les autres odeurs, très faible, une note de cuir roussi. Vous l’imaginez, sans doute.'],
      BOIRE: ['Il n’y a rien à boire ici.', 'Rien à boire. Vous auriez pourtant besoin d’un remontant.', 'Pas de quoi boire. Pas ici.'],
      ECOUTER: ['La ville gronde sourdement sous son brouillard.', 'Des sabots, des moteurs, une corne de brume sur la Tamise.', 'Vous tendez l’oreille. Des pas, quelque part. Ils s’arrêtent quand vous vous arrêtez.'],
      PARLER: ['À qui voulez-vous parler ? Ici, il y a : {things}.', 'Parler, oui, mais à qui ? Il y a {things}.', 'Il faudrait savoir à qui vous adresser. Ici : {things}.'],
      VISITER: ['Aller voir quoi, ou qui ? Ici, il y a : {things}.', 'Voir quoi ? Il y a {things}.'],
      ALLER: function (api) {
      if (/^wagon/.test(api.s.loc)) return api.fresh('allerW', ['Aller où ? Derrière la porte, les morts. Derrière les vitres, le gris. Il n’y a que ce wagon.', 'Il n’y a nulle part où aller. Le train roule dans le vide, et le vide n’a pas de quai.']);
      if (api.s.loc === 'retour') return 'Le train file vers le convoi de charbon. Sauter, courir à la locomotive, ou rester : il faut choisir.';
      var c = destChips(api); return c.length ? 'Pour aller où ? Vous connaissez : ' + c.map(function (x) { return x.label.replace('Aller : ', ''); }).join(', ') + '.' : 'Pour aller où ? Vous n’avez encore aucune adresse utile.'; },
      OUVRIR: ['Ça ne s’ouvre pas, ou pas de cette façon.', 'Rien ne cède.', 'Vous essayez. Ça ne bouge pas.'],
      FRAPPER: ['Vous frappez. Le bois sonne creux. Rien ne se passe.', 'Toc, toc. Personne.', 'Le bruit se perd dans le brouillard.'],
      ASSEOIR: ['Vous vous asseyez un instant. Vos jambes vous remercient. Votre enquête, moins.', 'Pas le temps de vous asseoir.', 'Vous resterez debout.'],
      COMMANDER: ['Personne ne prend de commande ici.', 'Commander ? À qui ?', 'Il n’y a rien à commander ici.'],
      DONNER: ['Donner quoi, et à qui ?', 'Il n’y a personne à qui donner quoi que ce soit.', 'Votre main reste tendue vers personne.'],
      ATTENDRE: ['Vous attendez. Le brouillard ne bouge pas.', 'Les minutes passent, lourdes.', 'Vous attendez. Une horloge, quelque part, sonne le quart.'],
      UTILISER: ['Vous ne voyez pas comment vous en servir ici.', 'Ça ne servirait à rien ici.', 'Pas ici, pas comme ça.'],
      MENACER: ['Vos poings se serrent, mais il n’y a personne à menacer.', 'Contre qui, exactement ?'],
      FLATTER: ['Vous souriez dans le vide. Ça ne mène à rien.', 'Il n’y a personne pour apprécier.'],
      PERSUADER: ['Vous plaidez votre cause devant personne.', 'Convaincre qui ?'],
      BARATIN: ['Mentir, oui. Mais à qui ?', 'Pas de public pour vos mensonges.'],
      PSY: ['Vous scrutez les visages, mais personne ne vous parle.', 'Il n’y a personne à jauger ici.'],
      INSISTER: ['Insister sur quoi ?', 'Il n’y a rien sur quoi insister pour l’instant.'],
      AUREVOIR: ['Vous ne parlez à personne.', 'Vous saluez le brouillard.'],
      POLI: ['Personne ne vous répond.', 'Votre politesse se perd dans le brouillard.'],
      LANCER: ['Lancer quoi, et sur qui ? Vous avez les mains vides.', 'Votre bras se lève, puis retombe.'],
      CRIER: ['Votre cri se perd dans le brouillard. Quelques têtes se tournent, puis se détournent.', 'Vous criez. Londres en a vu d’autres.'],
      FUMER: ['Vous allumez une cigarette. La fumée se mêle au brouillard, et on ne sait plus où finit l’une et où commence l’autre.', 'Une cigarette, le temps de remettre vos idées en ordre.'],
      DORMIR: ['Pas ici. Rentrez d’abord à votre hôtel.', 'Dormir ? Plus tard, à l’hôtel.'],
      PRIER: ['Vous priez, à voix basse. Le brouillard ne répond pas. Vous vous sentez un peu moins seul{e}.', 'Une prière, apprise enfant. Les mots reviennent dans le désordre.'],
      MAGIE: ['Vous ne connaissez aucun sortilège. Et Smith passait sa vie à démasquer ceux qui prétendaient en connaître.', 'Rien ne se passe. Heureusement, peut-être.'],
      CHANTER: ['Vous fredonnez un air de music-hall. Une passante vous regarde de travers.', 'Vous chantonnez pour vous donner du courage. Votre voix sonne faux dans le brouillard.'],
      DANSER: ['Quelques pas de charleston, seul{e}, dans le brouillard. Ça ne fait avancer personne, mais ça réchauffe.', 'Vous esquissez un pas de danse. Personne ne vous regarde. Presque personne.'],
      CASSER: ['Vous n’allez pas tout casser. Pas encore.', 'Il n’y a rien ici qui mérite d’être brisé.'],
      BRULER: ['Mettre le feu ? Vous repensez à la maison de Smith, et vous rangez vos allumettes.', 'Non. Il y a eu assez de feu dans cette histoire.'],
      SAUTER: ['Vous sautez sur place. Ça réchauffe, au moins.', 'Sauter ? D’où, et pour aller où ?'],
      CACHER: ['Vous vous effacez dans l’ombre d’une porte cochère. Personne ne vous cherche. Pour l’instant.', 'Le brouillard vous cache mieux que n’importe quelle cachette.'],
      JOUER: ['Ce n’est pas le moment de jouer.', 'Plus tard, les cartes et les paris.'],
      CONTEMPLER: ['Vous fixez le brouillard jusqu’à ce qu’il prenne des formes. Des visages, toujours des visages.', 'Vous restez immobile, longtemps. Le monde ne vous attend pas.'],
      MANGER: ['Vous avalez un petit pain acheté à un étal. Il a le goût du brouillard.', 'Vous n’avez pas faim. Pas après Cheapside.'],
      EMBRASSER: ['Personne ici ne mérite un baiser, ni ne l’attend.', 'Ce n’est pas le moment.'],
      DESHABILLER: ['Par ce froid ? Vous gardez votre manteau.', 'Un agent vous observe déjà. Restez habillé{e}.'],
      ALARME: ['Il n’y a pas de signal d’alarme ici.', 'Aucune sonnette à tirer.'],
      INSULTE: ['Vous jurez entre vos dents. Ça soulage un peu.', 'Votre juron se perd dans le brouillard.']
    },
    again: ['Vous revenez vers {x}. Rien n’a changé depuis tout à l’heure. Sauf peut-être vous.', '{X}, encore. Vous en connaissez chaque détail, maintenant.', 'Vous regardez de nouveau {x}. Les mêmes détails, et cette impression tenace que quelque chose vous échappe.', 'Rien de neuf du côté de {x}. Il faudrait essayer autre chose.'],
    againBare: ['Rien de neuf.', 'Comme tout à l’heure. Rien de plus.', 'Vous recommencez, sans rien apprendre de nouveau.', 'Rien ne change. Vous, peut-être.'],
    againPrefix: ['Vous y revenez. ', 'Une fois encore. ', 'Vous recommencez, plus lentement. ', 'Encore une fois, en détail. '],
    againMad: ['Vous regardez encore {x}. Était-ce déjà comme ça la première fois ? Vous n’en êtes plus sûr{e}.', '{X}. Vous l’avez déjà vu. Vous l’avez toujours vu. Vous le reverrez.', 'Vous revenez à {x}, et pendant une seconde, vous avez l’impression que la chose porte un visage.'],
    loop: ['Vous tournez en rond. Londres, elle, ne vous attend pas.', 'Il y a sûrement autre chose à tenter.', 'Il faudrait changer d’approche. Ou d’endroit.'],
    dup: ['Même résultat qu’à l’instant.', 'Rien de plus que la dernière fois.', 'Vous insistez. Le monde, lui, ne change pas d’avis.', 'Toujours la même chose. Peut-être faut-il essayer autre chose.'],
    nounOnly: ['{x} ? Que voulez-vous en faire, exactement ?', '{x}, oui. Mais encore ? Examiner, fouiller, prendre, parler… ?'],
    thinkOnly: ['Vous réfléchissez à {x}, sans avancer. Il faudrait poser la question à quelqu’un.', 'Vous notez « {x} » dans votre carnet, avec un point d’interrogation. Quelqu’un, quelque part, doit savoir.'],
    lost: ['Le brouillard vous embrouille les idées. Smith, Beddows, Cheapside : par quel bout reprendre ?', 'Vous hésitez. La ville, elle, n’hésite pas : elle continue sans vous.', 'Une seconde, vous ne savez plus très bien ce que vous étiez venu{e} faire ici.'],
    clarify: ['Vous voulez dire :', 'Plus précisément ?']
  };
  L.intrusions = {
    1: ['Vous vous surprenez à frotter le dos de votre main, comme pour vérifier que la peau ne glisse pas.', 'Un instant, l’odeur de chair roussie de Cheapside revient, ici, sans raison.', 'Dans une vitrine, votre reflet semble avoir les traits légèrement flous.', 'Quelqu’un, dans le brouillard, a prononcé votre nom. Ou un nom qui y ressemblait.'],
    2: ['Les passants ont tous la même moustache. Vous clignez des yeux : non.', 'Votre peau vous démange, partout, comme un vêtement trop petit.', 'Vous croyez entendre, très loin, le halètement d’une locomotive qui n’existe pas.', 'La voix brisée de Smith vous revient. Elle ne ressemble plus du tout à la sienne.'],
    3: ['Vous savez, sans savoir comment, que quelqu’un porte en ce moment le visage d’un autre, quelque part dans cette ville.', 'Vous comptez les visages dans la rue. Combien sont vrais ?', 'Votre propre voix vous paraît étrangère, comme empruntée.', 'Le brouillard a une texture de peau. Vous évitez de le toucher.']
  };

  L.timeEvents = [
    { id: 'billet', at: at(3, 18, 30), cond: function (api) { return !api.has('BILLET') && !api.flag('cheapsideVu'); },
      run: function (api) { if (api.s.loc === 'hotel') billet(api); else { api.flag('billetAttend', true); api.event('Quelque part en ville, à cette heure, vous ne le savez pas encore, quelqu’un glisse une enveloppe sous la porte de votre chambre d’hôtel.'); } } },
    { id: 'stanley', at: at(4, 7, 0), run: function (api) { api.flag('stanleyDispo', true); api.apprendre('VOLATILISE'); if (api.s.loc === 'hotel') api.event('Le garçon d’étage glisse les journaux du jour sous votre porte. On entend, dans le couloir, quelqu’un lire à voix haute un titre sur un « homme volatilisé ».'); } },
    { id: 'presse', at: at(6, 9, 0), cond: function (api) { return !api.has('QUETE'); }, run: function (api) { api.event('Le temps passe. Le souvenir de la carte de Smith, de son « il me reste peu de temps », vous brûle les doigts.'); } },
    { id: 'presse2', at: at(8, 9, 0), cond: function (api) { return api.has('QUETE') && !api.item(BILLETS); }, run: function (api) { api.event('Une semaine déjà depuis Cheapside. Smith vous a demandé de faire vite. Les billets se réservent à l’hôtel ou à la gare Victoria.'); } }
  ];

  L.help = function (api) {
    api.sys('Écrivez ce que fait votre investigateur : « je lis le journal », « je vais à Scotland Yard », « je parle à Beddows », « j’examine les registres ». Pour vous déplacer dans Londres, écrivez « aller à… » ou demandez « où aller ? ». Mots utiles : inventaire, fiche, carnet, aide.');
  };

  // ---------------------------------------------------------------- le registre des savoirs
  // Ce que le personnage peut savoir de l'intrigue, comment on le reconnaît dans un texte (mots, pour le censeur),
  // quels mots du joueur restent sourds tant qu'il ne le sait pas (concepts), et d'où il peut le tenir (par).
  // Un indice du carnet est un savoir de plein droit : MEURTRES s'apprend en lisant le Times (api.clue).
  L.savoirs = {
    HANTISES: { label: 'La théorie des hantises de Smith', par: ['CONFERENCE'], mots: /\bhantises?\b|rideaux de la perception|tentatives? (maladroites? )?de retour/, sourds: ['hantise', 'hantises'] },
    MEURTRES: { label: 'Les trois morts du Chelsea Arms', mots: /triple meurtre|(?<!(vingt|trente|quarante|cinquante|soixante|cent|mille) )trois (hommes|morts|turcs|messieurs|cadavres|corps|victimes|passeports)\b|poignardes?|meme mort|chambre des trois|trois fois le meme mort|meurtres? (du|au) chelsea/, evoque: /\bmorts?\b|cadavres?|\btues?\b|assassin|\bcrimes?\b/, sourds: ['meurtre', 'meurtres', 'assassinat', 'assassinats', 'poignarde', 'poignardes', 'triple'] },
    CHELSEA: { label: 'L’hôtel Chelsea Arms', par: ['MEURTRES', 'CLE14'], quand: function (api) { return !!api.flag('known:chelsea'); }, mots: /\bchelsea\b/, concepts: ['CHELSEA'] },
    MAKRYAT: { label: 'Le nom de Makryat', par: ['MEURTRES', 'LETTRE', 'ADRESSE'], mots: /makryat/, concepts: ['MAKRYAT'] },
    INCENDIE: { label: 'L’incendie chez Smith', par: ['FUYARD', 'LETTRE'], mots: /incendie (chez|de|a) (smith|st john|la maison)|maison (de smith |du professeur |du savant )?(a )?(brule|flambe|en flammes)|en flammes|ruines de st john|(smith|le professeur) (a )?disparu|(professeur|smith) (demeure )?introuvable/ },
    FUYARD: { label: 'Le fardeau de « Beddows »', par: ['INCENDIE'], mots: /lourd (ballot|fardeau)|ballot sur l epaule|charge d un lourd|roule dans une couverture/ },
    ECORCHES: { label: 'Les corps écorchés', par: ['BEDDOWS', 'PEAU'], mots: /ecorch|depec/, sourds: ['ecorche', 'ecorches', 'ecorchee', 'ecorchees', 'ecorcher', 'depece', 'depeces', 'depecer'] },
    TELEGRAMME: { label: 'Le télégramme de Paris', mots: /venez a londres immediatement|meme telegramme/ },
    SIMULACRE: { label: 'Le simulacre de Sedefkar', par: ['QUETE', 'PISTES', 'ROULEAUX'], mots: /simulacre|sedefkar/, sourds: ['simulacre', 'sedefkar'] },
    ROULEAUX: { label: 'Les rouleaux de Topkapı', par: ['QUETE'], mots: /topkap/, sourds: ['topkapi'] },
    MOSQUEE: { label: 'La Mosquée Maudite', par: ['QUETE'], mots: /mosquee maudite/ },
    PISTES: { label: 'Les pistes de Smith', mots: /fenalik|gremanci|winckelmann|todorovic/, sourds: ['fenalik', 'gremanci', 'winckelmann', 'todorovic'] },
    BEDDOWS: { label: 'La mort de Beddows', mots: /beddows (est )?mort|cadavre de beddows|corps de beddows|ecorche du british/ },
    ADRESSE: { label: 'La boutique de Brophy Lane', par: ['LETTRE'], quand: function (api) { return !!api.flag('known:islington'); }, mots: /brophy/ },
    AGE: { label: 'Le vrai âge de Makryat', mots: /trente neuf ans|vieillard de trente/ },
    STOKE: { label: 'La pension de Stoke Newington', par: ['TRAIN', 'STANLEY'], quand: function (api) { return !!api.flag('known:stoke'); }, mots: /stoke newington/, sourds: ['stoke', 'newington'] },
    VOLATILISE: { label: 'Un homme volatilisé (les journaux)', par: ['STANLEY'], mots: /volatilise|parti en fumee|part en fumee/ },
    STANLEY: { label: 'La disparition d’Henry Stanley', par: ['TRAIN'], mots: /henry stanley/, sourds: ['stanley'] },
    ALEXIS: { label: 'Les Alexis', par: ['TRAIN', 'MAQUETTE', 'VOIX'], mots: /randolph/, sourds: ['randolph', 'alexis'] },
    VANE: { label: 'Mrs Vane', par: ['VOIX', 'TRUQUEE'], quand: function (api) { return !!api.flag('known:vane'); }, mots: /hortense|mrs vane|gordon square/, concepts: ['VANE'] }
  };
  // ce que chaque sujet exige : un savoir (on n'en parle pas avant d'en avoir eu vent), ou rien (« libre » : la
  // personne, le lieu, ce qu'on a sous les yeux). Le censeur refuse tout sujet qui n'est pas ici.
  var apres = function (min) { return function (api) { return api.s.min >= min; }; };
  L.declarations = {
    'smith/sujet': 'libre', 'smith/hantises': ['HANTISES'], 'smith/visite': 'libre', 'smith/beddows': 'libre', 'smith/maison': 'libre',
    'smith/moustachu': 'libre', 'smith/continent': 'libre', 'smith/occulte': 'libre',
    'beddows/imposteur': 'libre', 'beddows/maitre': 'libre', 'beddows/attaque': { libre: true, apprend: ['INCENDIE'] }, 'beddows/police': 'libre',
    'beddows/plan': 'libre', 'beddows/voyage': 'libre', 'beddows/simulacre': 'libre', 'beddows/notes': 'libre', 'beddows/cheapside': 'libre', 'beddows/lui': 'libre',
    'fleming/meurtres': ['MEURTRES'], 'fleming/smith': 'libre', 'fleming/aide': 'libre',
    'rigby/incendie': ['INCENDIE'], 'rigby/beddows': ['INCENDIE'], 'rigby/makryat': ['MEURTRES'], 'rigby/cocher': 'libre',
    'chelseaclerk/quoi': { libre: true, apprend: ['MEURTRES'] }, 'chelseaclerk/meurtres': ['MEURTRES'], 'chelseaclerk/femme': ['MEURTRES'], 'chelseaclerk/cle': 'libre',
    'mustapha/makryat': ['MAKRYAT'], 'mustapha/presse': ['MEURTRES'], 'mustapha/cafe': 'libre', 'mustapha/mosquee': ['MOSQUEE'],
    'voisin/vieux': 'libre', 'voisin/photos': ['MEURTRES'], 'voisin/cle': 'libre', 'voisin/client': { libre: true, apprend: ['STOKE'] },
    'atkins/soir': 'libre', 'atkins/lui': 'libre', 'atkins/maquette': 'libre', 'atkins/police': 'libre', 'atkins/payer': 'libre', 'atkins/vane': 'libre',
    'sergent/stanley': 'libre', 'sergent/credit': 'libre',
    'butter/stanley': 'libre', 'butter/maquette': 'libre', 'butter/emprunt': 'libre', 'butter/voyage': 'libre', 'butter/diner': 'libre',
    'alexis/lui': 'libre', 'alexis/temps': 'libre', 'alexis/albert': 'libre', 'alexis/plan': 'libre', 'alexis/morts': 'libre',
    'stanley/histoire': 'libre', 'stanley/alexis': 'libre', 'stanley/trains': 'libre',
    'bibliothecaire/carte': 'libre',
    'concierge/courrier': 'libre', 'concierge/smith': { libre: true, apprend: function (api) { return api.s.min >= at(2, 6, 0) ? ['INCENDIE'] : null; } },
    'concierge/telegramme': 'libre', 'concierge/telParis': ['MEURTRES'], 'concierge/telStamboul': ['QUETE'], 'concierge/telAmi': 'libre',
    'concierge/annonce': 'libre', 'concierge/adSmith': 'libre', 'concierge/adMak': ['MAKRYAT'], 'concierge/adTrain': 'libre',
    'concierge/lieux': 'libre', 'concierge/dame': 'libre', 'concierge/billets': 'libre',
    'concierge/ragots': { libre: true, apprend: function (api) { return day(api.s.min) >= 3 ? ['MEURTRES'] : null; } }, 'concierge/vane': 'libre',
    'agentsj/feu': 'libre', 'agentsj/fouiller': 'libre', 'agentsj/beddows': 'libre',
    'laitier/vu': 'libre', 'laitier/visage': 'libre',
    'pike/alexis': 'libre', 'pike/makryat': ['MAKRYAT'], 'pike/stanley': ['STOKE'], 'pike/smith': 'libre', 'pike/aide': 'libre', 'pike/vane': 'libre',
    'vane/seance': 'libre', 'vane/smith': 'libre', 'vane/trucs': 'libre', 'vane/albert': 'libre', 'vane/atkins': 'libre',
    'patron/ragots': 'libre', 'patron/smith': 'libre', 'hollis/smith': 'libre', 'hollis/mal': 'libre', 'hollis/vane': ['VANE'],
    // les actions qui supposent qu'on sait de quoi il retourne
    'action:m_simulacre': ['SIMULACRE'], 'action:m_rouleaux': ['ROULEAUX|SIMULACRE'], 'action:m_alexis': ['ALEXIS'], 'action:m_makryat': ['MAKRYAT'],
    'action:y_rigby': { sait: apres(at(1, 23, 0)) },
    // être sur place, c'est savoir où l'on est ; rencontrer quelqu'un, c'est savoir qui il est
    'lieu:vane': { apprend: ['VANE'] }, 'lieu:chelsea': { apprend: ['CHELSEA'] }, 'lieu:islington': { apprend: ['ADRESSE'] }, 'lieu:boutique': { apprend: ['ADRESSE'] },
    'lieu:stoke': { apprend: ['STOKE'] }, 'lieu:chambre_stanley': { apprend: ['STOKE'] }, 'pnj:alexis': { apprend: ['ALEXIS'] }
  };
  // au Chelsea Arms, on peut demander ce qui s'est passé sans avoir lu le journal : c'est lui qui l'apprend
  L.npcs.chelseaclerk.topics.unshift(T('quoi', ['HISTOIRE', 'POLICE', ['ETAGE', 0.8], ['QUELQUUN', 0.8], ['SALLE', 0.7]],
    ['Il soupire, comme quelqu’un qui récite. « Trois messieurs, {m}, trouvés au matin dans la même chambre, poignardés. Tous les trois avec des papiers au nom de M. Makryat, qui avait loué la 14. La police a tout bouclé. Adressez-vous à Scotland Yard, à l’inspecteur Fleming. »'],
    { chip: 'Ce qui s’est passé ici', cond: function (api) { return !api.sait('MEURTRES'); } }));

  L.intro = function (api) {
    api.title('L’Express de minuit', 'Londres · Danseurs dans le brouillard');
    api.say('Vendredi 5 janvier 1923. Londres disparaît sous un brouillard comme on n’en a pas vu depuis des années.');
    api.say('Votre vieil ami, le professeur Julius Arthur Smith, vous a invité{e} au banquet de la Fondation Challenger, à l’Institut impérial de Kensington. Une fois par an, les administrateurs y convient un orateur capable de les étonner : Marie Curie, Marconi, Edison s’y sont succédé. Ce soir, c’est Smith, le grand pourfendeur de médiums. Il a refusé de vous dire un mot de son sujet.');
    api.say('Sous les lustres, l’Empire en habit de soirée. À la table d’honneur, Smith relit ses notes, ses énormes favoris frémissant au-dessus d’une pipe qui empeste. Derrière lui, droit comme un I, son fidèle Beddows.');
    api.sys('Vous incarnez ' + api.pc.name + ', ' + api.pc.occupation.charAt(0).toLowerCase() + api.pc.occupation.slice(1) + '. Écrivez ce que vous faites, comme à une table de jeu. Les fautes ne gênent pas.');
  };

  // ---------------------------------------------------------------- trois investigateurs prêts à jouer
  L.pregens = [
    { key: 'pemberton', name: 'Arthur Pemberton', first: 'Arthur', last: 'Pemberton', title: 'Dr', sex: 'm', age: 52, origin: 'Londres', academic: true, profession: 'medecin',
      occupation: 'Médecin à Harley Street', bio: 'Ancien chirurgien de guerre, médecin des beaux quartiers. Smith lui doit la vie depuis une fièvre attrapée à Vienne. Sang-froid, rigueur, et des cauchemars de la Somme qu’il ne raconte à personne.',
      carac: { FOR: 50, CON: 60, TAI: 65, DEX: 55, APP: 60, INT: 80, POU: 55, EDU: 85 },
      pv: 12, pvMax: 12, pm: 11, pmMax: 11, san: 55, sanMax: 99, chance: 50, mvt: 7,
      skills: { 'Médecine': 70, 'Premiers soins': 70, 'Psychologie': 60, 'Sciences (biologie)': 50, 'Langue (latin)': 50, 'Langue (français)': 45, 'Crédit': 60, 'Bibliothèque': 55, 'Persuasion': 45, 'Trouver Objet Caché': 45, 'Écouter': 40, 'Esquive': 27, 'Intimidation': 30, 'Histoire': 30, 'Occultisme': 15, 'Droit': 15, 'Comptabilité': 10, 'Baratin': 15, 'Charme': 30, 'Sauter': 20, 'Mythe de Cthulhu': 0 },
      inv: ['Une trousse de médecin', 'Une montre de gousset', 'Un carnet relié de cuir'], money: 60 },
    { key: 'doyle', name: 'Margaret Doyle', first: 'Maggie', last: 'Doyle', title: 'Miss', sex: 'f', age: 31, origin: 'Dublin', profession: 'journaliste',
      occupation: 'Reporter au Daily Courier', bio: 'Irlandaise, insolente avec les puissants. Elle a couvert un démasquage de médium par Smith et ne l’a plus lâché depuis. Curieuse jusqu’à l’imprudence, rapide, impossible à faire taire.',
      carac: { FOR: 45, CON: 55, TAI: 50, DEX: 70, APP: 65, INT: 75, POU: 65, EDU: 70 },
      pv: 10, pvMax: 10, pm: 13, pmMax: 13, san: 65, sanMax: 99, chance: 60, mvt: 9,
      skills: { 'Baratin': 60, 'Persuasion': 50, 'Psychologie': 50, 'Trouver Objet Caché': 60, 'Écouter': 50, 'Bibliothèque': 50, 'Photographie': 45, 'Discrétion': 45, 'Esquive': 45, 'Charme': 45, 'Crochetage': 30, 'Langue (français)': 35, 'Histoire': 25, 'Droit': 20, 'Crédit': 30, 'Occultisme': 15, 'Intimidation': 25, 'Comptabilité': 15, 'Premiers soins': 30, 'Sauter': 40, 'Mythe de Cthulhu': 0 },
      inv: ['Un appareil photo Kodak pliant', 'Un carnet de sténo', 'Une épingle à chapeau'], money: 25 },
    { key: 'ashby', name: 'Julian Ashby', first: 'Julian', last: 'Ashby', title: 'Mr', sex: 'm', age: 39, origin: 'Oxford', academic: true, profession: 'antiquaire',
      occupation: 'Antiquaire à Museum Street', bio: 'Ancien élève de Smith, il tient une boutique d’antiquités près du British Museum. Il connaît les objets, leurs prix et leurs légendes, lit le turc, et croit à moitié aux légendes, ce qui l’inquiète.',
      carac: { FOR: 40, CON: 50, TAI: 55, DEX: 60, APP: 55, INT: 80, POU: 70, EDU: 80 },
      pv: 10, pvMax: 10, pm: 14, pmMax: 14, san: 70, sanMax: 99, chance: 45, mvt: 8,
      skills: { 'Histoire': 60, 'Occultisme': 55, 'Évaluation': 60, 'Bibliothèque': 60, 'Langue (latin)': 50, 'Langue (turc)': 35, 'Langue (français)': 50, 'Comptabilité': 45, 'Archéologie': 45, 'Crédit': 45, 'Persuasion': 40, 'Psychologie': 35, 'Trouver Objet Caché': 45, 'Écouter': 35, 'Charme': 35, 'Baratin': 30, 'Discrétion': 30, 'Esquive': 30, 'Crochetage': 10, 'Droit': 10, 'Premiers soins': 30, 'Sauter': 20, 'Mythe de Cthulhu': 0 },
      inv: ['Une loupe d’horloger', 'Un catalogue de vente annoté', 'Une canne à pommeau d’argent'], money: 45 }
  ];

  L.investigator = L.pregens[0];
  L.short = 'Londres';
  L.examples = '« je lis le journal », « je vais à Scotland Yard », « je parle à Beddows », « j’examine les registres », « où aller ? »';
  L.people = {
    smith: 'Le professeur Julius Arthur Smith, votre vieil ami. Pourfendeur de médiums, conférencier tonitruant, fumeur de pipe infecte.',
    beddows: 'James Beddows, le domestique de Smith depuis trente et un ans. Impeccable, discret, terrifié.',
    fleming: 'L’inspecteur Fleming, de Scotland Yard, chargé des meurtres du Chelsea Arms. Pressé, sec, pas idiot.',
    rigby: 'Le sergent Rigby, de la brigade des incendies. Enquête sur la maison de Smith et doute de la culpabilité de Beddows.',
    chelseaclerk: 'Le réceptionniste du Chelsea Arms, qui a trop raconté la même histoire.',
    mustapha: 'Mustapha Köprülü, attaché à l’ambassade de Turquie. Élégant, susceptible, moins fermé qu’il n’en a l’air.',
    voisin: 'Le buraliste de Brophy Lane, voisin de Makryat. Se souvient d’un vieil homme voûté.',
    atkins: 'Mrs Constance Atkins, logeuse d’Henry Stanley à Stoke Newington. Fait visiter « la chambre de la mort » pour six pence.',
    sergent: 'Le sergent Hobbs, du poste de Stoke Newington. Persuadé que Stanley a organisé sa disparition.',
    butter: 'Arthur Butter, président de l’Association des amateurs de trains de Londres. Jovial, et mal à l’aise avec la maquette.',
    bibliothecaire: 'Le conservateur de la salle de lecture du British Museum. Chut.',
    alexis: 'Randolph Alexis, occultiste, censé être mort en 1897. Prisonnier du train fantôme. Pas digne de confiance.',
    stanley: 'Henry Stanley, collectionneur de trains, disparu de sa chambre dans un nuage de fumée.'
  };
  // ---------------------------------------------------------------- qui est là, à quelle heure
  // Les gens ont des heures : un inspecteur rentre chez lui, un buraliste baisse son rideau, un laitier ne passe qu'à l'aube.
  var DISPO = {
    fleming: { h: [8, 20], x: 'Le planton de nuit lève à peine les yeux. « L’inspecteur Fleming ? Rentré chez lui, {m}. Les bureaux rouvrent à huit heures. »' },
    rigby: { h: [8, 20], x: 'Le planton de nuit lève à peine les yeux. « Le sergent Rigby ? Parti depuis longtemps, {m}. Revenez à huit heures. »' },
    sergent: { h: [8, 20], x: 'Au poste du coin, un agent de nuit somnole derrière son guichet. « Le sergent ? Demain, huit heures. »' },
    voisin: { h: [7, 20], repos: 'dimanche', x: 'Le bureau de tabac a baissé son rideau de fer. Une pancarte jaunie : « Ouvert de 7 h à 20 h ».', xRepos: 'Rideau baissé, pancarte : « Fermé le dimanche ». Le buraliste respecte le jour du Seigneur, ou sa grasse matinée.' },
    atkins: { h: [7, 22], x: 'Mrs Atkins est montée se coucher. La maison dort. Il faudra revenir après sept heures.' },
    butter: { h: [8, 24], x: 'M. Butter dort, sans doute au milieu de ses catalogues. Il faudra revenir au matin.' },
    laitier: { h: [5, 12], x: 'Le laitier a fini sa tournée depuis longtemps : il ne passe qu’à l’aube. Sa carriole n’est plus là.' }
  };
  L.disponible = function (api, id) {
    var d = DISPO[id]; if (!d) return null;
    if (L.pnjIci && L.pnjIci(api, id)) return null;
    if (api.flag('combat') || /^(wagon|retour|campagne|cave)/.test(api.s.loc)) return null;
    var h = hour(api.s.min);
    if (d.repos && JOURS[(4 + day(api.s.min)) % 7] === d.repos) return d.xRepos || d.x;
    return (h < d.h[0] || h >= d.h[1]) ? d.x : null;
  };
  L.boutiquesOuvertes = function (api) { var h = hour(api.s.min); return h >= 8 && h < 20 && JOURS[(4 + day(api.s.min)) % 7] !== 'dimanche'; };

    // des noms que l'investigateur n'a pas besoin d'avoir lus pour y penser (voir le garde-fou des noms, engine.js)
  L.nomsCommuns = { Enfer: 1, Harley: 1, Street: 1 };
L._h = { depart: depart, PLACES: PLACES, pourquoi: pourquoi, ZONE: ZONE, zone: zone, known: known, learn: learn, destChips: destChips, taxi: taxi, npc: npc, T: T, day: day, hour: hour, at: at, D: D, lirePresse: lirePresse, presse: presse, billet: billet, reserver: reserver, dormir: dormir, goAct: goAct, CARTE: CARTE, BILLETS: BILLETS, MAQ: MAQ, VALISE: VALISE };
  G.CHAPTERS.londres = L;
})(typeof window !== 'undefined' ? window : globalThis);
