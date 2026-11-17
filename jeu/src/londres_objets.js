/* Londres : ce qu'on porte. Pas de kilos, le bon sens d'un meneur de jeu :
   dans la poche (rien ne gêne), à la main (visible, pratique), encombrant (les mains prises : pas de bagarre,
   pas de cachette, des remarques). On dépose l'encombrant à l'hôtel, et on le reprend.
   Et quelques objets ordinaires qu'on peut ramasser, pour le plaisir des petits gestes. */
(function (G) {
  'use strict';
  var L = G.CHAPTERS && G.CHAPTERS.londres; if (!L) return;
  var H = L._h;

  var MAIN = [/trousse de m/i, /appareil photo/i, /canne/i];
  var ENCOMBRANT = [/valise de Beddows/i, /maquette des Alexis/i];
  function categorie(nom) {
    if (ENCOMBRANT.some(function (r) { return r.test(nom); })) return 'encombrant';
    if (MAIN.some(function (r) { return r.test(nom); })) return 'main';
    return 'poche';
  }
  function court(nom) { return /valise/i.test(nom) ? 'la valise de Beddows' : /maquette/i.test(nom) ? 'la caisse de la maquette' : nom.toLowerCase(); }
  function ou(api, nom) { return api.flag('ou:' + nom) || 'sur vous'; } // 'sur vous', 'hotel', ou l'endroit où on l'a lâché
  function charge(api) { return api.s.inv.filter(function (n) { return categorie(n) === 'encombrant' && ou(api, n) === 'sur vous'; }); }
  L.charge = charge;

  // la fiche : chaque possession dit où elle est et ce qu'elle pèse, sans chiffres
  L.invLabel = function (api, nom) {
    var c = categorie(nom), o = ou(api, nom);
    if (o === 'hotel') return nom + ' — déposée à l’hôtel';
    if (o !== 'sur vous') return nom + ' — laissée ' + ((H.PLACES[o] && 'à ' + H.PLACES[o].label.replace(/^(le|la|les|l’) /, function (m) { return { 'le ': 'au ', 'la ': 'la ', 'les ': 'aux ', 'l’': 'l’' }[m]; })) || 'quelque part');
    return nom + (c === 'encombrant' ? ' — encombrant, vous avez les mains prises' : c === 'main' ? ' — à la main' : '');
  };

  // ---------------------------------------------------------------- les mains prises : bagarre
  if (L._c && L._c.fight) {
    var fight0 = L._c.fight;
    L._c.fight = function (api, who, p, raw) {
      var lourd = charge(api);
      if (lourd.length) {
        lourd.forEach(function (n) { api.flag('ou:' + n, api.s.loc); });
        api.say('Vous lâchez ' + lourd.map(court).join(' et ') + ' pour avoir les mains libres. ' + (lourd.length > 1 ? 'Elles tombent' : 'Elle tombe') + ' lourdement sur le sol.');
      }
      return fight0.apply(this, arguments);
    };
  }

  // ---------------------------------------------------------------- les remarques, à l'arrivée
  var REMARQUES = {
    hotel: '« Laissez, {m}, je vous monte ça ! » Le concierge se précipite vers vous, les bras tendus.',
    yard: 'Le planton fronce les sourcils devant ce que vous portez. « Les colis, c’est à la consigne, {m}. Ici, c’est Scotland Yard. »',
    musee: 'Un gardien vous arrête à l’entrée de la salle de lecture : « Les bagages au vestiaire, {m}. Règlement. » Vous plaidez, il cède, en vous suivant des yeux.',
    pub: 'Le patron regarde ce que vous trimballez. « Vous déménagez, {m}, ou vous venez boire ? »',
    eglise: 'Le pasteur lève les yeux sur votre fardeau, et ne dit rien. Il a vu entrer des gens chargés de choses bien plus lourdes.',
    ambassade: 'Le secrétaire de l’ambassade considère votre chargement avec une politesse glaciale.',
    archives: 'Mrs Pike pince les lèvres. « Pas de colis entre les rayonnages. Posez ça dans l’entrée. » Vous le gardez à vos pieds.'
  };
  Object.keys(L.locations).forEach(function (id) {
    var l = L.locations[id]; if (!l.enter) return;
    var e0 = l.enter;
    l.enter = function (api, first) {
      var r = e0.apply(this, arguments);
      var lourd = charge(api);
      if (lourd.length && REMARQUES[id] && !api.flag('remarque:' + id + ':' + api.s.inv.length)) {
        api.flag('remarque:' + id + ':' + api.s.inv.length, true);
        api.say(REMARQUES[id]);
        if (id === 'hotel') api.chips([{ label: 'Déposer ' + court(lourd[0]) + ' à l’hôtel', action: 'obj_deposer' }]);
      }
      // ce qu'on avait lâché ici
      api.s.inv.forEach(function (n) { if (ou(api, n) === id) api.say(court(n).charAt(0).toUpperCase() + court(n).slice(1) + ' est toujours là, où vous l’avez laissée.'); });
      return r;
    };
  });

  // ce qu'on a laissé à l'hôtel n'est pas « ici »
  L.porte = function (api, nom) { return ou(api, nom) === 'sur vous'; };

  // ---------------------------------------------------------------- déposer, reprendre
  L.globalActions.push(
    { id: 'obj_valise', label: 'Ouvrir la valise de Beddows', repeatable: true, verbs: ['EXAMINER', 'FOUILLER', 'OUVRIR'], nouns: ['VALISE', 'ARGENT'],
      cond: function (api) { return api.s.inv.some(function (n) { return /valise de Beddows/i.test(n) && ou(api, n) === 'sur vous'; }); },
      run: function (api) {
        if (api.s.loc === 'yard') { api.say('Vous entrouvrez la valise sur vos genoux, à l’abri d’un pilier. Deux cents billets de cinq livres, neufs, aux numéros qui se suivent. Un agent passe ; vous refermez d’un coup sec. Mieux vaut ne pas expliquer ça ici.'); return; }
        api.say(api.fresh('valiseVue', ['Deux cents billets de cinq livres, neufs, aux numéros qui se suivent. Une fortune, donnée sans un reçu. Vous refermez la valise sans trop savoir quoi penser.', 'Les liasses sont toujours là, serrées par des bandes de papier de la Banque d’Angleterre. Elles sentent l’encre neuve. Vous refermez.']));
      } },
    { id: 'obj_deposer', label: 'Déposer ce qui vous encombre', repeatable: true, verbs: ['DONNER', 'DEPOSER'], nouns: ['VALISE', 'MAQUETTE'],
      cond: function (api) { return charge(api).length > 0; },
      run: function (api) {
        var lourd = charge(api);
        if (api.s.loc !== 'hotel') { api.say('Le laisser ici ? Dans ce Londres-là ? Vous resserrez votre prise. À l’hôtel, le concierge a un coffre et une réputation à tenir.'); return; }
        lourd.forEach(function (n) { api.flag('ou:' + n, 'hotel'); });
        api.say('Le concierge range ' + lourd.map(court).join(' et ') + ' dans le petit bureau derrière la réception, ferme à double tour, et vous tend un ticket de cuivre. Vous avez de nouveau les mains libres. Ça fait un bien fou.');
      } },
    { id: 'obj_reprendre', label: 'Reprendre ce que vous aviez laissé', repeatable: true, verbs: ['PRENDRE', 'DEPOSER'], nouns: ['VALISE', 'MAQUETTE'],
      cond: function (api) { return api.s.inv.some(function (n) { return ou(api, n) === api.s.loc || (api.s.loc === 'hotel' && ou(api, n) === 'hotel'); }); },
      run: function (api) {
        var ici = api.s.inv.filter(function (n) { return ou(api, n) === api.s.loc || (api.s.loc === 'hotel' && ou(api, n) === 'hotel'); });
        ici.forEach(function (n) { api.flag('ou:' + n, false); });
        api.say(api.s.loc === 'hotel' ? 'Le concierge vous rend ' + ici.map(court).join(' et ') + ' contre votre ticket de cuivre. Vos bras s’en souviennent aussitôt.' : 'Vous reprenez ' + ici.map(court).join(' et ') + '. Personne n’y a touché. Personne n’a osé, peut-être.');
      } }
  );

  // ---------------------------------------------------------------- les petits objets ordinaires
  var OBJETS = {
    allumettes: { nom: 'Une boîte d’allumettes de l’hôtel', ou: ['hotel'], prise: 'Vous empochez la boîte d’allumettes posée près du cendrier, au nom de l’hôtel. Ça peut toujours servir, à Londres, quand les lampes s’éteignent.' },
    journal: { nom: 'Le Times du jour', ou: ['hotel', 'victoria', 'pub'], prise: 'Vous pliez le Times en quatre et vous le glissez dans la poche de votre manteau.' },
    cierge: { nom: 'Un cierge de St George', ou: ['eglise'], prise: 'Vous prenez un cierge dans la boîte, et vous laissez un penny à la place. Le pasteur vous a vu{e}. « Gardez-le. Mais allumez-le pour quelqu’un. »' },
    sousbock: { nom: 'Un sous-bock du Museum Tavern', ou: ['pub'], prise: 'Vous glissez un sous-bock en carton dans votre poche. Le patron fait semblant de ne pas avoir vu ; il en perd vingt par soir.' }
  };
  var REFUS = { chope: ['pub', '« La chope reste ici, {m}. » Le patron vous la reprend des mains avec un sourire qui n’en est pas un.'], tasse: ['hotel', 'Vous imaginez la tête du concierge quand il comptera ses tasses. Vous la reposez.'] };
  function prendre(api, t) {
    var m = t.match(/\b(allumettes?|journal|times|cierges?|bougies?|sous ?bocks?|chope|tasse)\b/); if (!m) return false;
    var k = /allumette/.test(m[1]) ? 'allumettes' : /journal|times/.test(m[1]) ? 'journal' : /cierge|bougie/.test(m[1]) ? 'cierge' : /bock/.test(m[1]) ? 'sousbock' : m[1];
    if (REFUS[k]) { if (REFUS[k][0] !== api.s.loc) return false; api.say(REFUS[k][1]); return true; }
    var o = OBJETS[k]; if (!o) return false;
    if (api.item(o.nom)) { api.say('Vous l’avez déjà sur vous.'); return true; }
    if (o.ou.indexOf(api.s.loc) < 0) return false;
    api.take(o.nom); api.say(o.prise); return true;
  }
  function utiliser(api, t) {
    if (/\b(craqu\w*|allum\w*|frott\w*) (une )?allumettes?\b|\ballum\w* (le |un )?(cierge|bougie)\b/.test(t)) {
      var cierge = /cierge|bougie/.test(t);
      if (cierge && !api.item(OBJETS.cierge.nom)) { api.say('Vous n’avez pas de cierge sur vous.'); return true; }
      if (!api.item(OBJETS.allumettes.nom)) { api.say('Vous fouillez vos poches : pas une allumette. Il faudra en trouver, la prochaine fois que vous passerez à l’hôtel.'); return true; }
      if (cierge) { api.say(api.s.loc === 'eglise' ? 'Vous allumez le cierge et vous le plantez parmi les autres, devant la statue. Pour Smith. Pour Beddows. Pour les trois du Chelsea Arms, dont personne ne sait plus le nom.' : 'La flamme du cierge monte droite, puis se couche, comme si quelqu’un venait d’ouvrir une porte que vous ne voyez pas.'); return true; }
      api.say(api.s.loc === 'cave' ? 'L’allumette craque. Une seconde, la cave entière apparaît, les murs suintants, la maquette, et dans l’angle une forme qui n’est qu’un sac. Puis la flamme vous brûle les doigts.' : api.s.loc === 'chambre_stanley' ? 'L’allumette éclaire les gravures de locomotives. Dans la lueur qui tremble, elles ont l’air d’avancer vers vous.' : 'Une allumette craque, éclaire votre main, s’éteint. Vous aviez besoin de voir une flamme qui obéit.');
      return true;
    }
    if (/\bli(re|s|t) (le |mon )?(journal|times)\b/.test(t) && api.item(OBJETS.journal.nom) && api.s.loc !== 'hotel' && H.lirePresse) { H.lirePresse(api); return true; }
    return false;
  }
  var impro0 = L.improvise;
  var ACHAT = /\b(achet\w*|me procur\w*|faire (des|mes|quelques) (courses|achats|emplettes)|fais (des|mes|quelques) (courses|achats|emplettes)|cherche (une boutique|un magasin|une quincaillerie|une pharmacie|un tailleur|une armurerie)|vais (a la|dans une|chez (le|un)) (boutique|quincaillerie|pharmacie|droguerie|papeterie|epicerie|tailleur|armurier|marchand))\b/;
  var FOURNITURES = /\b(fournitures?|provisions|materiel|equipement|lampe|lanterne|torche|corde|bougies?|chandelles?|allumettes|couteau|canif|craie|ficelle|papier|encre|carnet|crayons?|pellicules?|piles?|boussole|carte de londres|plan de londres|parapluie|gants|echarpe|pansements?|bandages?|aspirine|laudanum|tabac|cigarettes|cigares|whisky|sandwich|provisions de bouche)\b/;
  L.improvise = function (api, p) {
    var t = ' ' + (p.text || '') + ' ';
    // les boutiques ont des heures : on n'achète rien à onze heures du soir, ni le dimanche
    var ta = ' ' + G.RPG.normalize(p.raw || '') + ' ';
    if (ACHAT.test(ta) && !/\b(journal|journaux|times|billets?)\b/.test(ta) && !/^(wagon|retour|campagne|cave|institut)/.test(api.s.loc) && !G.RPG.recit(p.raw || '')) {
      if (!L.boutiquesOuvertes(api)) {
        var dim = !(api.s.min % 1440 >= 20 * 60 || api.s.min % 1440 < 8 * 60);
        api.say(dim ? api.fresh('ferméDim', ['Un dimanche à Londres : rideaux baissés d’un bout à l’autre de la ville. Rien ne s’achète avant lundi matin.', 'Le dimanche, Londres ne vend rien, pas même une boîte d’allumettes. Il faudra attendre lundi.'])
          : api.fresh('ferméNuit', ['À cette heure, Londres a baissé ses rideaux de fer. Les boutiques rouvrent vers huit heures.', 'Vous longez des vitrines éteintes, des grilles cadenassées. Rien ne s’achète la nuit, dans ce quartier. Il faudra revenir demain.', 'Un allumeur de réverbères vous regarde secouer une poignée de porte. « Fermé, {m}. Tout est fermé. Revenez au matin. »']));
        api.s.tick = 2; return true;
      }
      if (FOURNITURES.test(ta)) {
        var ft = (ta.match(FOURNITURES) || [])[0];
        if (!api.pay(0.25)) { api.say('Vous comptez votre monnaie : pas de quoi, pour l’instant.'); return true; }
        api.say(api.fresh('achat', ['Une quincaillerie de Holborn, étroite comme un couloir, où l’on trouve de tout sauf de la place. Vous en ressortez avec ce qu’il vous fallait, pour cinq shillings.', 'Un marchand de Southampton Row vous sert sans un mot, enveloppe le tout dans du papier brun, et empoche vos cinq shillings.']));
        api.take('Des achats du jour (' + ft.trim() + ')'); api.time(30);
        return true;
      }
    }
    if (/\b(prend\w*|ramass\w*|empoch\w*|emport\w*|garde\w*|pique\w*|chipe\w*)\b/.test(t) && prendre(api, t)) return true;
    if (utiliser(api, t)) return true;
    if (/\b(pos\w*|depos\w*|laiss\w*|confi\w*|range\w*|lach\w*)\b.*\b(caisse|maquette|valise|colis|fardeau)\b/.test(t) && charge(api).length) { api.exec('obj_deposer'); return true; }
    if (/\b(repren\w*|recuper\w*|ramass\w*|reprendre)\b.*\b(caisse|maquette|valise|colis)\b/.test(t) && api.s.inv.some(function (n) { var o = ou(api, n); return o === api.s.loc || (api.s.loc === 'hotel' && o === 'hotel'); })) { api.exec('obj_reprendre'); return true; }
    if (/\b(cach\w*|planqu\w*|dissimul\w*|escalad\w*|grimp\w*|faufil\w*|discret\w*|sans bruit)\b/.test(t) && charge(api).length) {
      api.say('Avec ' + court(charge(api)[0]) + ' dans les bras ? Elle dépasse de partout, elle cogne, elle pèse. Il faudrait d’abord vous en débarrasser.');
      return true;
    }
    return impro0 ? impro0(api, p) : false;
  };

  var baseLex = L.lexicon;
  L.lexicon = function (Lx) { baseLex(Lx); Lx.add('DEPOSER', 'v', 'deposer, depose, poser, pose'); };
})(typeof window !== 'undefined' ? window : globalThis);

// =============================================================================
// Les suites des répliques de Londres : ce que chaque réplique met sur la table (voir « ce qui est sur la table »
// dans le moteur). Chaque suite a ses mots et ses réponses : prendre, demander, refuser.
// =============================================================================
(function (G) {
  'use strict';
  var L = G.CHAPTERS && G.CHAPTERS.londres; if (!L) return;
  function suites(npc, id, x) {
    var t = ((L.npcs[npc] || {}).topics || []).filter(function (y) { return y.id === id; })[0];
    if (t) t.suites = x; else if (G.console) G.console.warn('suites sans sujet', npc, id);
  }
  function sujet(id) { return { sujet: id }; }

  // ---------------------------------------------------------------- Smith, au banquet
  suites('smith', 'sujet', [{
    croient: { chip: 'Ce qu’ils ne croient pas ?', mots: 'ce qu ils ne croient pas, ne croient pas, croire, quoi donc', demander: ['« Aux revenants, mon ami ! Mais je ne dirai pas le mot avant d’être sur l’estrade. Le mot, c’est la moitié du scandale. »'] }
  }, null]);
  suites('smith', 'hantises', [{
    bateau: { mots: 'bateau, bateau de peche, breton, la bretagne', demander: ['« Un thonier de Douarnenez, perdu corps et biens en 1904. On le revoit chaque année, à la même date, au large de Sein. Trois photographes, trois plaques, trois fois le même bateau. »'] },
    norvegienne: { mots: 'norvegienne, la norvegienne, escalier, son escalier', demander: ['« Une institutrice de Bergen. Elle descend son escalier tous les soirs à dix heures. Elle est morte en 1888. L’escalier, lui, a été démoli en 1902. »'] },
    fiacre: { mots: 'fiacre, un fiacre, le fiacre, de londres', demander: ['« Un fiacre de Piccadilly, avec un cheval gris. On le voit passer dans le brouillard, sans bruit, à un mètre au-dessus du pavé. Le pavé a été abaissé en 1897, voyez-vous. Il roule sur l’ancien niveau. »'] },
    plaques: { chip: 'Les photographies ?', mots: 'photographies, photographie, plaques, les plaques, photographies', demander: ['« Vous les verrez dans un instant, sur l’écran. Douze plaques. J’en ai brûlé six autres, qui ne montraient rien de présentable. »'] }
  }, null]);
  suites('smith', 'visite', [{
    pourquoi: { mots: 'pourquoi, pas ce week end, du travail, quel travail', demander: ['« Des papiers à classer, de vieux papiers. » Il regarde vers la porte, puis vers vous. « Rien qui doive vous inquiéter, mon ami. »'] }
  }, null]);
  suites('smith', 'beddows', [{
    tabac: { mots: 'tabac, votre tabac, la pipe, fumer', demander: ['« Du Latakia, mon ami. Beddows dit que ça sent le cuir brûlé. Il a raison, c’est ce qui me plaît. »'] },
    lettres: { mots: 'lettres, censure, mes lettres, ses lettres', demander: ['« Il les lit avant moi, pour m’épargner les mauvaises nouvelles. Je fais semblant de ne pas le savoir. C’est notre arrangement. »'] }
  }, null]);
  suites('smith', 'maison', [{
    diner: { offre: true, chip: 'Accepter le dîner', mots: 'diner, avec plaisir, volontiers, j accepte, le diner', prendre: ['« Entendu ! Dès que les plâtriers seront partis. Beddows vous écrira. Il écrit mieux que moi, et il se souvient des dates. »'] },
    pate: { mots: 'pate en croute, pate, le pate', demander: ['« Une recette de sa mère, à Leeds. Il refuse de me la donner. Je le soupçonne d’y mettre du porto. »'] },
    bibliotheque: { mots: 'bibliotheque, ouvriers, agrandir, les travaux, eventree', demander: ['« Trente mille volumes, et pas un de trop. Il me faut un mur de plus. Peut-être deux. » Il rit, un peu trop fort.'] }
  }, null]);
  suites('smith', 'continent', {
    vienne: { mots: 'vienne', demander: ['« Vienne, mon ami : des cafés où l’on parle des morts comme d’une famille éloignée. J’y ai étudié deux ans. »'] },
    venise: { mots: 'venise', demander: ['« Venise, où les maisons ont les pieds dans l’eau et les secrets dans les murs. Un fabricant de poupées m’y a vendu un œil de verre, un jour. Je l’ai toujours. »'] },
    constantinople: { chip: 'Constantinople ?', mots: 'constantinople, stamboul, istanbul', demander: ['« Constantinople… » Il se tait un instant. « Une ville où l’on ne finit jamais d’arriver. J’y retournerai. Il le faudra bien. »'] }
  });
  suites('smith', 'occulte', {
    physique: { mots: 'physique, une physique, pas encore, comprendre', demander: ['« Le magnétisme était de la sorcellerie il y a deux cents ans, mon ami. Les ondes de Hertz aussi. Il y a des forces qui attendent leur nom. Je voudrais bien leur en donner un. »'] }
  });
  suites('smith', 'etat', {
    champagne: { mots: 'champagne, une coupe, un verre, a boire', prendre: ['Il vous tend une coupe prise au plateau qui passe. « Buvez-le vite, avant qu’il avoue son âge. »'], demander: ['« Un champagne de l’Institut : tiède, et plus vieux qu’il ne le dit. Comme les membres. »'] }
  });

  // ---------------------------------------------------------------- Beddows, à Cheapside
  suites('beddows', 'attaque', [{
    turcs: { mots: 'turcs, des turcs, trois quatre, combien', demander: ['« Des hommes bruns, docteur, avec des manteaux trop légers pour Londres. Ils parlaient entre eux une langue que je ne connais pas. Monsieur, lui, la connaissait. »'] },
    bibliotheque: { mots: 'bibliotheque, barricades, barricader', demander: ['« La bibliothèque, docteur. Les portes sont en chêne. Monsieur disait qu’elles arrêteraient une armée. Elles n’ont pas arrêté le feu. »'] },
    feu: { mots: 'le feu, feu, incendie, ils ont mis le feu', demander: ['« Par les fenêtres du jardin, docteur. Une odeur de pétrole, puis tout a pris d’un coup. Les livres brûlent si bien. »'] }
  }, null]);
  suites('beddows', 'police', {
    rendre: { chip: 'Vous rendre à la police', mots: 'vous rendre, rendez vous, aller voir la police, vous expliquer, vous innocenter', prendre: ['« Me rendre ? Et qui veillerait sur Monsieur ? Non, docteur. Pas tant qu’il aura besoin de moi. »'] }
  });
  suites('beddows', 'voyage', {
    cook: { chip: 'Chez Cook ?', mots: 'cook, thomas cook, la compagnie, wagons lits, reserver, ou reserver', demander: ['« Thomas Cook, à Ludgate Circus, ou la Compagnie des wagons-lits, à Piccadilly. Ils trouvent des places même en janvier, docteur, si on paie ce qu’il faut. »'] },
    princes: { mots: 'princes, comme des princes, l argent, ce que monsieur vous a confie', demander: ['« Mille livres, docteur. Toutes les économies de Monsieur. Il a dit que vous sauriez qu’en faire. » Il baisse les yeux.'] }
  });
  suites('beddows', 'cheapside', {
    cousine: { mots: 'cousine, une cousine, la chambre, qui habite ici', demander: ['« Ma cousine Edith, docteur. Elle est chez sa fille, à Margate, jusqu’à Pâques. Elle ne sait rien, et il vaut mieux qu’elle ne sache rien. »'] }
  });
  suites('beddows', 'lui', {
    madame: { mots: 'madame, sa femme, quand elle vivait', demander: ['« Madame est morte en 1909, docteur. La grippe. Monsieur a gardé sa chambre comme elle l’avait laissée. Il y entrait le dimanche. » Un temps. « Maintenant, il n’y a plus de chambre. »'] }
  });
  suites('beddows', 'maitre', {
    plaques: { mots: 'plaques, ses plaques, refait, conference, la conference', demander: ['« Ses plaques de verre, docteur, les photographies des revenants. Il les a refaites deux fois, parce que sur les premières… » Il s’arrête net. « Parce qu’elles étaient floues. »'] }
  });

  // ---------------------------------------------------------------- Scotland Yard, l'hôtel de Chelsea, l'ambassade
  suites('fleming', 'meurtres', [{
    times: { mots: 'times, le times, les journaux', demander: ['« Page sept, hier. Tout y est, sauf ce que je ne dis pas. Et ce que je ne dis pas, docteur, je ne vous le dirai pas non plus. »'] },
    passeports: { mots: 'passeports, faux, des faux, les passeports', demander: ['« De bons faux, docteur. Trop bons. Même papier, même encre, mêmes tampons que les vrais. Les Turcs disent qu’ils n’y sont pour rien. Je les crois à moitié. »'] }
  }, null]);
  suites('chelseaclerk', 'meurtres', [{
    chambre: { chip: 'Quelle chambre ?', mots: 'chambre, quelle chambre, la chambre, reservee pour un seul, pour un seul', demander: ['« Au deuxième, docteur. La police a gardé la clé. Enfin, l’une des deux : l’autre est partie avec le locataire, et personne ne l’a revue. »'] },
    rien: { mots: 'rien entendu, vous n avez rien entendu, rien, pas un bruit', demander: ['« Rien, docteur. Pas un cri. Trois hommes, et pas un cri. La femme de chambre dit que c’est ça le pire. »'] }
  }, null]);
  suites('chelseaclerk', 'femme', [{
    mary: { chip: 'Où est Mary ?', mots: 'mary, la petite mary, ou est elle, lui parler', demander: ['« Chez sa mère, à Fulham. Elle a rendu son tablier le jour même. Elle dit qu’elle ne veut plus jamais faire un lit. »'] },
    boucherie: { mots: 'boucherie, la boucherie, l odeur, ca sentait', demander: ['« Le suif et la viande froide, docteur. Comme chez le boucher de Sloane Street, le samedi soir. Elle a été élevée au-dessus d’une boucherie, Mary. Elle sait ce qu’elle dit. »'] }
  }, null]);
  suites('mustapha', 'cafe', {
    cafe: { offre: true, chip: 'Accepter le café', mots: 'cafe, un cafe, cafe turc, volontiers, avec plaisir', prendre: function (api) { api.time(10); api.npc('mustapha', 'Il le prépare lui-même, sur un petit réchaud de cuivre : épais, sucré, dans une tasse minuscule. « Le seul café qui mérite ce nom, docteur. » Il vous regarde boire avec une satisfaction de propriétaire, et parle plus volontiers après.'); api.calm('mustapha', 1); } },
    _refus: ['« Les Anglais préfèrent le thé, je sais. Personne n’est parfait. »']
  });
  suites('mustapha', 'presse', {
    republique: { mots: 'republique, une republique, on se bat, chez vous, la guerre', demander: ['« Un général d’Ankara a chassé le sultan, docteur. Nous aurons une république avant l’été. Vos journaux préfèrent parler de passeports. C’est plus facile à comprendre. »'] }
  });
  suites('mustapha', 'mosquee', {
    chiens: { mots: 'chiens, les chiens, muezzin, n y entrent pas', demander: ['« Les chiens de Stamboul entrent partout, docteur, même dans les cafés. Pas là. Ils s’arrêtent au coin de la rue et ils grondent. C’est une histoire, je vous dis. » Il ne sourit plus du tout.'] }
  });

  // ---------------------------------------------------------------- Stoke Newington, Camberwell
  suites('atkins', 'lui', {
    photo: { chip: 'Garder la photo', mots: 'photo, sa photo, la photo, la garder, je peux la prendre', prendre: ['« Gardez-la, mon chou. J’en ai une autre. Si vous le retrouvez, dites-lui que sa chambre l’attend. Payée jusqu’à la fin du mois. »'] }
  });
  suites('atkins', 'police', {
    poste: { mots: 'poste, le poste, au coin, leur parler', demander: ['« Au coin de Church Street, mon chou. Demandez le sergent, il est gentil. Bête, mais gentil. »'] }
  });
  suites('atkins', 'vane', {
    wagon: { chip: 'Un petit wagon ?', mots: 'wagon, un de ses petits wagons, petit wagon, wagons', demander: ['« Un petit wagon de troisième classe, peint à la main. Elle l’a posé sur sa table et elle a dit qu’il tremblait. Il tremblait, mon chou. Je l’ai vu. »'] }
  });
  suites('butter', 'stanley', {
    histoire: { mots: 'l histoire, pas de memoire, memoire, pour l histoire', demander: ['« Il achetait ce qui était beau, docteur, sans demander d’où ça venait. Un collectionneur doit toujours demander d’où ça vient. Toujours. »'] }
  });
  suites('butter', 'maquette', [{
    deraillement: { mots: 'deraillement, deraille, cent morts, liverpool, 97, l express de liverpool', demander: ['« Le 23 décembre 1897, docteur. L’express de Liverpool, quatorze voitures. On n’a jamais retrouvé la locomotive ni les six premières voitures. On a dragué la rivière pendant trois mois. »'] },
    gout: { mots: 'mauvais gout, de mauvais gout, pourquoi', demander: ['« Reproduire un train de morts, docteur, au détail près, jusqu’aux numéros des voitures ? C’est un deuil, ou c’est une invocation. Je n’aime ni l’un ni l’autre dans ma cave. »'] }
  }, null]);
  suites('butter', 'diner', [{
    exception: { chip: 'Une circonstance exceptionnelle ?', mots: 'circonstance exceptionnelle, exceptionnelle, sauf, comment', demander: ['« Rapportez-moi des nouvelles de Stanley, docteur, et vous dînerez à ma droite. C’est le mieux que je puisse offrir. »'] }
  }, null]);

  // ---------------------------------------------------------------- Le train fantôme
  suites('alexis', 'lui', [{
    ennemis: { mots: 'ennemis, vos ennemis, qui', demander: ['« Des hommes qui voulaient ce que j’avais trouvé. Ils doivent être morts, depuis. Tout le monde meurt, dehors. Ici, c’est plus économique. »'] },
    porte: { mots: 'porte, une porte, la cloison', demander: ['« Une porte entre deux endroits, docteur. Il suffit de tracer le bon motif et de le nourrir. Le motif était juste. La nourriture, moins. »'] }
  }, null]);
  suites('alexis', 'morts', {
    vouloir: { chip: 'Ce que j’ai ?', mots: 'ce que vous avez, ce que j ai, vouloir, ils veulent', demander: ['« Votre chaleur, votre poids, votre place dans le monde. Ils sont partis sans bagages, voyez-vous. Ils voudraient bien les vôtres. »'] }
  });
  suites('stanley', 'alexis', {
    gigot: { mots: 'gigot, comme un gigot, il vous regarde', demander: ['« Il compte, la nuit. Les passagers, les places, les rations. Il dit qu’il faut toujours prévoir. » Il frissonne. « Prévoir quoi ? »'] }
  });

  // ---------------------------------------------------------------- l'hôtel, St John's Wood, Fleet Street, Gordon Square, la taverne, l'église
  suites('concierge', 'smith', {
    ashworth: { chip: 'La voyante de Lady Ashworth ?', mots: 'lady ashworth, la voyante, ashworth, demasque, demasquee', demander: sujet('vane') }
  });
  suites('concierge', 'dame', [{
    gresham: { mots: 'mrs gresham, gresham, ses pas, la dame, le 21', demander: ['« Elle entend marcher au-dessus de chez elle, docteur. Toutes les nuits, d’un bout à l’autre. Comme quelqu’un qui fait les cent pas dans un couloir. Un couloir étroit. »'] },
    grenier: { mots: 'grenier, le grenier, au dessus', demander: sujet('dame') }
  }, null]);
  suites('concierge', 'ragots', [{
    pas: { chip: 'Des pas au plafond ?', mots: 'pas au plafond, des pas, plafond, la dame du deuxieme, la dame', demander: sujet('dame') }
  }, null]);
  suites('vane', 'smith', [{
    gaze: { mots: 'gaze, la gaze, votre gaze, tire', demander: ['« De la mousseline de Lyon, très cher, la plus fine. Il l’a brandie comme un drapeau. Les gens ont ri. Les gens rient toujours, quand on leur retire ce qu’ils aimaient. »'] }
  }, null]);
  suites('vane', 'albert', {
    somme: { mots: 'somme, tombes a la somme, trois albert, les veuves', demander: ['« Les veuves veulent des fils qui pardonnent, très cher. Je leur en donne. C’est un service, pas une escroquerie. Enfin, pas seulement. »'] }
  });
  suites('patron', 'smith', [{
    whisky: { chip: 'Un double, alors', mots: 'whisky, un double, un whisky, la meme chose, servez moi', prendre: ['« Un double, comme le professeur ? » Il vous sert sans vous quitter des yeux. « C’est pour la maison, docteur. Ce soir, je n’ai pas le cœur à compter. »'], demander: ['« Un double, docteur. Lui qui ne finissait jamais sa demi-pinte. Il a regardé le fond du verre comme s’il y avait quelqu’un dedans. »'] }
  }, null]);
  suites('hollis', 'smith', [{
    orgue: { mots: 'orgue, bach, ecouter l orgue', demander: ['« Je répète Bach le mercredi soir. Il s’asseyait au troisième rang et il fermait les yeux. Il disait que c’était la seule preuve de Dieu qu’il acceptait. »'] }
  }, null]);
  suites('hollis', 'mal', {
    emprunter: { chip: 'En nous empruntant ?', mots: 'empruntant, en nous empruntant, nos visages, nos mains, quelqu un', demander: ['« Un visage qu’on porte, une main qu’on dirige. Les vieux exorcistes disaient : le diable n’a pas de peau, il faut qu’il en trouve une. » Il vous regarde. « Je n’aime pas cette idée. Elle m’empêche de dormir. »'] }
  });
  suites('hollis', 'vane', [{
    pleure: { mots: 'pleure, elle a pleure, pourquoi', demander: ['« Je ne sais pas, et je ne le lui ai pas demandé. On ne demande pas pourquoi aux gens qui pleurent dans une église. Ils le savent, ou ils viennent pour l’apprendre. »'] }
  }, null]);
})(typeof window !== 'undefined' ? window : globalThis);
