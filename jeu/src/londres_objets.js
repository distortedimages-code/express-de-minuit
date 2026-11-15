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
  L.improvise = function (api, p) {
    var t = ' ' + (p.text || '') + ' ';
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
