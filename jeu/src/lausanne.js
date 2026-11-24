/* Chapitre 3 — Lausanne : le rouleau d'Edgar Wellington, le duc des Esseintes, et la ville qui rêve.
   D'après la trame de la campagne (les frères Wellington, le club de sept heures et demie, la Lausanne du rêve,
   le procès du Prince, le déjeuner du Simplon), entièrement réécrit pour ce jeu. Le duc vient d'À rebours (1884).
   Le rêve et le procès sont dans lausanne_reve.js. */
(function (G) {
  'use strict';
  var L = G.CHAPTERS && G.CHAPTERS.londres, PA = G.CHAPTERS && G.CHAPTERS.paris;
  if (!L || !L._h || !PA || !PA._h) return;
  var H = L._h, T = H.T, X = PA._h, D = 1440;
  var at = X.at, day = X.day, hour = X.hour, JOURS = X.JOURS;
  function mn(api) { return api.s.min % D; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function jour(api) { return JOURS[(4 + day(api.s.min)) % 7]; }
  function nuit(api) { var h = hour(api.s.min); return h >= 20 || h < 7; }
  function pluie(api) { var h = hour(api.s.min); return api.flag('meurtre') && (h >= 22 || h < 6); }
  // le jour de l'arrivée : tout se joue ce jour-là et la nuit qui suit
  function j0(api) { var j = api.flag('j0'); return typeof j === 'number' ? j : day(api.s.min); }
  function tAt(api, h, m) { return j0(api) * D + h * 60 + (m || 0); }
  function guetCrie(api) { var h = hour(api.s.min); return h >= 22 || h < 2; }

  var BRAS = 'Le Bras gauche du Simulacre';
  var FIOLE = 'Une fiole verte, étiquetée « Lausanne »';
  var JOURNAL = 'Le journal d’Edgar Wellington';
  var RECU = 'Le reçu d’un papetier';
  var FAUX = 'Un rouleau scellé de cire rouge';
  var ROULEAU = 'Le Rouleau de la Tête';
  var TRAD = 'La traduction dactylographiée du rouleau';
  var SERINGUE = 'Une seringue vide';

  // ================================================================ les lieux de Lausanne
  var PL = {
    la_gare: { label: 'la gare', concept: 'GARELS', also: ['JEANCLAUDE'], min: 15 },
    la_hotel: { label: 'l’hôtel des Alpes', concept: 'HOTEL', also: ['BURNIER'], min: 10 },
    la_rue: { label: 'la boutique Wellington, rue Saint-Étienne', concept: 'BOUTIQUE', also: ['EDGAR', 'WILLIAM'], min: 15 },
    la_cathedrale: { label: 'la cathédrale', concept: 'CATHEDRALE', also: ['GISANT', 'GUET', 'CRYPTE', 'TOUR'], min: 15 },
    la_musee: { label: 'le musée cantonal et sa bibliothèque', concept: 'MUSEEC', also: ['CHAPPUIS'], min: 10, hours: [9, 17], jours: ['dimanche'],
      closed: 'Le musée cantonal et sa bibliothèque ouvrent de 9 h à 17 h.', fermeJour: 'Le dimanche, la bibliothèque cantonale est fermée.' },
    la_signal: { label: 'le belvédère du Signal', concept: 'SIGNAL', also: [], min: 30 },
    la_chatnoir: { label: 'le café du Chat Noir', concept: 'CHATNOIR', also: ['MAX', 'CLUB'], min: 10, hours: [11, 24],
      closed: 'Le Chat Noir ouvre à onze heures et ferme à minuit.' },
    la_pre: { label: 'la maison de la rue du Pré', concept: 'MAISONDUC', also: [], min: 15 },
    la_police: { label: 'l’hôtel de police, place de la Palud', concept: 'POLICE', also: ['ROCHAT'], min: 10 }
  };
  var TOUJOURS = { la_gare: 1, la_hotel: 1, la_cathedrale: 1, la_police: 1 };
  function connu(api, id) { return !!TOUJOURS[id] || !!api.flag('connu:' + id); }
  function apprendre(api, id) {
    if (connu(api, id)) return;
    api.flag('connu:' + id, true);
    api.sys('Nouveau lieu : ' + PL[id].label + '. Écrivez « aller à… » ou touchez « Où aller ? ».');
  }
  function enVille(api) { return /^la_/.test(api.s.loc); }
  function enBoutique(api) { return api.s.loc === 'la_boutique' || api.s.loc === 'la_etage'; }
  function reve(api) { return /^re_/.test(api.s.loc); }
  function train(api) { return /^tr_/.test(api.s.loc); }
  function ici(api, id) { return api.s.loc === id || (id === 'la_rue' && enBoutique(api)); }
  function destChips(api) {
    return Object.keys(PL).filter(function (k) { return !ici(api, k) && connu(api, k); })
      .map(function (k) { return { label: 'Aller : ' + PL[k].label, action: 'go_' + k }; });
  }
  function trajet(api, dest, minutes) {
    var lignes = nuit(api)
      ? (pluie(api) ? ['La pluie tombe, froide et serrée. Les pavés de la Cité brillent comme des écailles, et vous montez en rasant les murs.', 'Un fiacre attardé, sa lanterne mouillée. Le cocher ne dit rien ; le cheval non plus.']
        : ['Les rues sont vides, en pente, luisantes de brouillard. À chaque carrefour, un réverbère à gaz grésille.', 'Vous marchez seul{e} dans une ville qui dort tôt. Vos pas résonnent plus fort que vous ne voudriez.'])
      : ['La Ficelle, le petit funiculaire de la gare, vous hisse jusqu’au Flon dans un grincement de câble.', 'Vous grimpez des rues en escalier, entre des façades grises. Lausanne se visite à pied, et en soufflant.', 'Un fiacre vous emporte au pas, le cocher emmitouflé jusqu’aux yeux.', 'Un tramway bleu et crème descend la rue en carillonnant ; vous le prenez au vol.'];
    api.say(api.fresh('trajetL', lignes));
    if (nuit(api) && guetCrie(api) && api.rand() < 0.5) api.say('Très haut, quelque part dans le brouillard, une voix d’homme crie l’heure aux quatre vents.');
    api.time(minutes || 15);
    api.go(dest);
  }
  function goL(id) {
    var p = PL[id];
    return { id: 'go_' + id, label: 'Aller : ' + p.label, repeatable: true, verbs: ['ALLER', 'VISITER'], nouns: [p.concept].concat(p.also), extraVerbs: ['PRENDRE', 'PARLER'], boost: 0.1,
      cond: function (api) { return enVille(api) && !ici(api, id); },
      run: function (api) {
        if (!connu(api, id)) { api.say('Vous ne savez pas encore où c’est, ni ce que vous y feriez. Il vous faudrait d’abord une adresse, ou une raison.'); return; }
        if (api.flag('visite') && P.quitterVisite) P.quitterVisite(api, id);
        var h = hour(api.s.min);
        if (p.jours && p.jours.indexOf(jour(api)) >= 0) { api.say(p.fermeJour); return; }
        if (p.hours && (h >= p.hours[1] || h < 5)) { api.say(p.closed + (h < 5 ? ' Il faudra attendre le jour.' : ' Pas ce soir.')); return; }
        if (p.hours && h < p.hours[0]) { api.say(api.fresh('attOuvL', ['Trop tôt. Vous tuez le temps dans un café de la rue de Bourg, devant un chocolat et la gazette.', 'Vous faites les cent pas sous les arcades, le temps que les portes s’ouvrent.'])); api.s.min = day(api.s.min) * D + p.hours[0] * 60 - 10; }
        trajet(api, id, p.min);
      } };
  }

  // ================================================================ le chapitre
  var P = {
    id: 'lausanne',
    title: 'L’Express de minuit',
    chapter: 'Lausanne · Nocturne',
    short: 'Lausanne',
    tick: 5, talkTick: 2,
    sanLabels: L.sanLabels, perceive: L.perceive, money: L.money, onMadness: L.onMadness,
    // l'esprit qui s'égare (voir Londres) ; jamais au milieu du procès, du rêve ou d'un sauvetage
    beforeAction: function (api, a, p) { if (/^re_/.test(api.s.loc) || /^(pr_|trr_|le_soigner|lr_entrer|rb_fuir|rp_courir|vi_)/.test(a.id)) return false; return L.beforeAction ? L.beforeAction(api, a, p) : false; },
    // jour 0 = vendredi 5 janvier 1923 ; venu de Paris, on arrive le matin où Paris s'est fini (voir P.intro)
    start: { loc: 'la_gare', min: at(10, 6, 45), money: 40, inv: [] },
    investigator: null,
    clock: function (min) { var d = day(min), wd = JOURS[(4 + d) % 7]; return wd.charAt(0).toUpperCase() + wd.slice(1, 3) + ' ' + (5 + d) + ' · ' + pad(hour(min)) + ' h ' + pad(min % 60); },
    where: function (min, s) {
      var h = hour(min), mom = h < 6 ? 'nuit' : h < 12 ? 'matin' : h < 18 ? 'après-midi' : h < 22 ? 'soir' : 'nuit', l = (s && s.loc) || '';
      if (/^re_/.test(l)) return 'Lausanne, en songe';
      return (/^tr_/.test(l) ? 'Simplon-Orient-Express · ' : 'Lausanne · ') + (5 + day(min)) + ' janvier 1923 · ' + mom;
    },
    examples: '« je vais rue Saint-Étienne », « je sonne chez Wellington », « je demande au porteur un hôtel »',
    phrases: [
      [/\b(au |le )?(50 )?(de la )?rue saint etienne\b|\bwellington fils\b|\bchez (les )?wellington\b|\bchez edgar\b|\bla boutique (d edgar|wellington|du taxidermiste)\b/g, ' boutique '],
      [/\b(le )?duc (jean )?(floressas )?des esseintes\b|\bdes esseintes\b|\bmonsieur le duc\b|\bjean floressas\b/g, ' duc '],
      [/\b(maximilian |max )?von wurtheim\b/g, ' max '],
      [/\b(le |au )?(cafe )?(du )?chat noir\b/g, ' chatnoir '],
      [/\bclub de (sept|7) ?h(eures)?( et demie| 30)?\b|\bclub des? (sept|7)\b/g, ' club '],
      [/\bmusee cantonal\b|\bpalais de rumine\b|\bbibliotheque cantonale\b/g, ' museecantonal '],
      [/\b(la )?rue du pre\b|\b(la )?maison du duc\b|\bchez le duc\b|\bsa maison\b/g, ' maisonduc '],
      [/\bporte (sculptee|renaissance|de chene|aux chasseurs)\b/g, ' porteren '],
      [/\bfiole verte\b|\bdrogue (du |de )?reve\b|\bbouteille verte\b/g, ' fiole '],
      [/\bfaux rouleau\b|\brouleau (scelle|de cire|neuf|cachete)\b/g, ' faux '],
      [/\brouleau de (sedefkar|la tete)\b|\b(le )?vrai rouleau\b/g, ' rouleau '],
      [/\b(le )?journal (intime )?d edgar\b|\bjournal intime\b|\bson journal\b/g, ' journale '],
      [/\bhotel de police\b|\bcommissariat\b|\bposte de police\b|\bgendarmerie\b/g, ' police '],
      [/\b(belvedere du signal|signal de sauvabelin)\b|\b(au|le|du) signal\b(?! d alarme)/g, ' signalbelvedere '],
      [/\bconference de (lausanne|la paix)\b|\bla conference\b/g, ' conferencel '],
      [/\bjean claude\b/g, ' jeanclaude '],
      [/\ble guet\b|\bveilleur de nuit\b/g, ' guet '],
      [/\b(la )?place de la palud\b|\bla palud\b/g, ' palud '],
      [/\bchevalier (sans mains|de pierre|couche)\b|\bstatue (sans mains|du chevalier)\b|\bmains coupees\b/g, ' gisant '],
      [/\bours empaille\b/g, ' ours '],
      [/\b(la |l )?(boite|piece|chose) d argent\b/g, ' plaques '],
      [/\bwagon restaurant\b|\bvoiture restaurant\b|\bpremier service\b/g, ' restaurant ']
    ].concat(PA.phrases || []),
    lexicon: function (Lx) {
      // les mots de Lausanne passent avant ceux de Paris et de Londres
      Lx.add('GARELS', 'n', 'gare, quai, quais, buffet, consigne, ficelle', { label: 'la gare' });
      Lx.add('BOUTIQUE', 'n', 'boutique, magasin, echoppe, vitrine, saint etienne, taxidermie, empailleur, animaux empailles, betes empaillees, animaux', { label: 'la boutique Wellington' });
      Lx.add('EDGAR', 'n', 'edgar, wellington, taxidermiste', { label: 'Edgar Wellington', npc: true });
      Lx.add('WILLIAM', 'n', 'william, muet, le muet, frere muet', { label: 'William Wellington', npc: true });
      Lx.add('DUC', 'n', 'duc, esseintes, floressas, aristocrate', { label: 'le duc des Esseintes', npc: true });
      Lx.add('MAX', 'n', 'max, maximilian, wurtheim, prussien', { label: 'Max von Wurtheim', npc: true });
      Lx.add('JEANCLAUDE', 'n', 'jeanclaude, porteur, portefaix', { label: 'Jean-Claude, le porteur', npc: true });
      Lx.add('BURNIER', 'n', 'burnier, concierge, receptionniste', { label: 'M. Burnier', npc: true });
      Lx.add('GUET', 'n', 'guet, veilleur, crieur, morel', { label: 'le guet', npc: true });
      Lx.add('CHAPPUIS', 'n', 'chappuis, helene', { label: 'Mlle Chappuis', npc: true });
      Lx.add('ROCHAT', 'n', 'rochat, commissaire, inspecteur', { label: 'le commissaire Rochat', npc: true });
      Lx.add('CATHEDRALE', 'n', 'cathedrale, nef, cite, vitraux, rosace, parvis', { label: 'la cathédrale' });
      Lx.add('GISANT', 'n', 'gisant, chevalier, tombeau, tombe, sepulture', { label: 'le chevalier sans mains' });
      Lx.add('CRYPTE', 'n', 'crypte, fondations, fondation', { label: 'la crypte' });
      Lx.add('MUSEEC', 'n', 'museecantonal, musee, museum, collections, coquillages, monnaies, rumine, medailles', { label: 'le musée cantonal' });
      Lx.add('SIGNAL', 'n', 'signalbelvedere, belvedere, panorama, point de vue, sauvabelin, alpes, montagnes', { label: 'le Signal' });
      Lx.add('CHATNOIR', 'n', 'chatnoir', { label: 'le Chat Noir' });
      Lx.add('CLUB', 'x', 'club, cercle, rendez vous, rendezvous, reunion', { label: 'le club de sept heures et demie' });
      Lx.add('MAISONDUC', 'n', 'maisonduc', { label: 'la maison de la rue du Pré' });
      Lx.add('PORTEREN', 'n', 'porteren, sculptures, chasseurs, scene de chasse', { label: 'la porte sculptée' });
      Lx.add('FIOLE', 'n', 'fiole, flacon, drogue, potion, liquide, breuvage, elixir', { label: 'la fiole verte' });
      Lx.add('SERINGUE', 'n', 'seringue, aiguille, morphine, piqure, piqures, trousse', { label: 'la seringue' });
      Lx.add('JOURNALE', 'n', 'journale, diary', { label: 'le journal d’Edgar' });
      Lx.add('RECU', 'n', 'recu, facture, papetier, cire a cacheter, parchemin', { label: 'le reçu' });
      Lx.add('FAUX', 'n', 'faux, faussaire, contrefacon, sceau, cachet de cire, cire rouge', { label: 'le rouleau scellé' });
      Lx.add('ROULEAU', 'n', 'rouleau, manuscrit arabe, ecrits de sedefkar', { label: 'le rouleau' });
      Lx.add('TRADUCTIONL', 'n', 'traduction, dactylographie, transcription, feuillets, tapuscrit', { label: 'la traduction' });
      Lx.add('CORPS', 'n', 'corps, cadavre, cadavres, victime, victimes, sang, plaie, plaies, blessure, blesse', { label: 'le corps' });
      Lx.add('SUICIDES', 'n', 'suicide, suicides, suicide, desesperes, noyes, pendus, pendu', { label: 'les suicides' });
      Lx.add('SIMPLON', 'n', 'simplon, brigue, domodossola, tunnel, col, valais, rhone', { label: 'le Simplon' });
      Lx.add('CONFERENCEL', 'x', 'conferencel, delegations, delegation, delegues, diplomates, traite, negociations', { label: 'la conférence' });
      Lx.add('PRIX', 'x', 'prix, combien, tarif, vendre, vente, marchander, offre, enchere, sterling', { label: 'le prix' });
      Lx.add('THE', 'n', 'the, tasse, theiere, biscuits, sucre', { label: 'le thé' });
      Lx.add('PLAQUES', 'n', 'plaques, crane, cicatrices, chapeau', { label: 'son crâne' });
      Lx.add('ADDITION', 'n', 'addition, la douloureuse, portefeuille', { label: 'l’addition' });
      Lx.add('LUMIERESW', 'n', 'interrupteur, electricite, eclairage, bouton de lumiere', { label: 'l’interrupteur' });
      Lx.add('ALLUMER', 'v', 'allumer, allume, allumez, allumons', { label: 'allumer' });
      Lx.add('SONNER', 'v', 'sonner, sonne, sonnez, sonnons, carillonner, sonnette, appeler, appelle, appelez', { label: 'sonner' });
      Lx.add('AIDER', 'v', 'aider, aide, aidez, secourir, secours, secourez, porter secours', { label: 'secourir' });
      Lx.add('SOIGNER', 'v', 'soigner, soigne, soignez, panser, bander, comprimer, garrot, compresse', { label: 'soigner' });
      Lx.add('ATELIER', 'n', 'atelier, arriere boutique, etabli, chevreuil, arriere cour, ruelle de derriere', { label: 'l’atelier' });
      Lx.add('LIT', 'n', 'lit, sous le lit, matelas, oreiller, table de nuit, chevet', { label: 'le lit' });
      Lx.add('TOUR', 'n', 'tour, clocher, galerie de la tour, beffroi, escalier de la tour', { label: 'la tour' });
      Lx.add('PARFUM', 'n', 'parfum, parfums, senteur, senteurs, artifice, artificiel, artificielles, fleurs', { label: 'les parfums' });
      Lx.add('CUISINE', 'n', 'cuisine, fourneau, carrelage', { label: 'la cuisine' });
      Lx.add('LAC', 'x', 'lac, leman, ouchy, rive, rives, vapeur, bateau', { label: 'le lac' });
      Lx.add('FERMER', 'v', 'fermer, fermez, refermer, referme, refermez, claquer, verrouiller', { label: 'fermer' });
      Lx.add('FUIR', 'v', 'fuir, fuyez, fuyons, enfuir, decamper, detaler, filer par derriere, s echapper, echapper, sortir par derriere', { label: 'fuir' });
      Lx.add('LIREL', 'v', 'lire, lis, lisez, lisons, dechiffrer, parcourir, feuilleter', { label: 'lire' });
      Lx.add('PALUD', 'n', 'palud, hotel de ville, fontaine', { label: 'la place de la Palud' });
      Lx.add('REVE', 'x', 'reve, reves, songe, songes, cauchemar, rever, reverie', { label: 'les rêves' });
      PA.lexicon(Lx);
      if (Lx.concepts.BIBLIOTHECAIRE) Lx.concepts.BIBLIOTHECAIRE.label = 'la bibliothécaire';
    },

    clues: {
      HALTE: { title: 'Une halte à Lausanne', text: 'Votre billet, retenu à Londres, prévoyait une journée d’arrêt à Lausanne et une chambre à l’hôtel des Alpes. Smith n’en avait jamais parlé.' },
      ANNONCE: { title: 'Une annonce dans la gazette', text: '« Collectionneur anglais achète tout document sur une statue byzantine dite de Sedefkar. S’adresser 50, rue Saint-Étienne. » Quelqu’un, à Lausanne, cherche la même chose que vous.' },
      WELLINGTON: { title: 'Le rouleau d’Edgar Wellington', text: 'Edgar Wellington a obtenu son rouleau en 1917, au front, d’un caporal français nommé Malon, contre des rations. Du turc en lettres arabes. Il parle du Simulacre et de son dernier propriétaire, le comte Fenalik. Edgar en veut 250 livres.' },
      DUC: { title: 'Le duc des Esseintes', text: 'Un vieil ami d’Edgar : un Français corpulent et parfait, amateur d’occulte, qui méprise la nature et adore l’artifice. Il s’intéresse au rouleau plus qu’il ne le dit.' },
      CLUB: { title: 'Le club de sept heures et demie', text: 'Rendez-vous ce soir au café du Chat Noir : Edgar, le duc et un certain Max. Edgar y apportera le rouleau, qu’il dit à la banque.' },
      GISANT: { title: 'Le chevalier sans mains', text: 'Dans la cathédrale, le gisant d’un chevalier tué en duel judiciaire, il y a plus de cinq cents ans. On lui a ôté les mains : Dieu lui avait donné tort.' },
      SUICIDES: { title: 'Un mort par mois', text: 'Avant la guerre, presque aucun suicide à Lausanne. Depuis 1918, un par mois, avec une régularité de pendule. La gazette parle de mélancolie d’après-guerre.' },
      KULTEN: { title: 'Un livre que personne ne demande', text: 'Un vieil in-quarto allemand moisi, dans le fonds ancien de la bibliothèque cantonale. Son dernier lecteur l’a gardé six mois et l’a rendu avec des pages coupées au rasoir : M. des Esseintes, rue du Pré.' },
      MAISONDUC: { title: 'La maison de la rue du Pré', text: 'Le duc habite rue du Pré une petite maison aux volets clos et aux fenêtres grillées, où personne n’est jamais invité. Le guet n’y a jamais vu une lampe s’allumer.' },
      PORTE: { title: 'Une porte qui pleure', text: 'Dans la maison vide du duc, une seule porte : du chêne sculpté de chasseurs. La toucher, c’est sentir monter un désespoir qui n’est pas le vôtre, celui de plusieurs personnes à la fois.' },
      CRIME: { title: 'Rue Saint-Étienne, la nuit', text: 'William Wellington est mort dans la cuisine, poignardé, un lambeau de peau découpé sur la poitrine. Edgar est mort dans son lit, une seringue à côté de lui.' },
      PIQURES: { title: 'Deux piqûres', text: 'Le bras gauche d’Edgar est criblé de vieilles piqûres. Le droit n’en a qu’une, fraîche : un droitier ne se pique pas de ce côté-là. On l’a tué.' },
      DUCSANG: { title: 'Trois lettres', text: 'William a eu le temps d’écrire trois lettres, avant de mourir : D, U, C.' },
      RECU: { title: 'Cire et parchemin', text: 'Un reçu d’un papetier de la Cité, daté du jour même : de la cire à cacheter rouge et du parchemin fin. Edgar préparait quelque chose.' },
      FAUX: { title: 'Un rouleau trop neuf', text: 'Le rouleau caché sous le lit d’Edgar est un faux : il n’a l’air vieux que parce qu’on l’a passé au four. Edgar comptait le vendre, et garder le vrai.' },
      JOURNALE: { title: 'Le journal d’Edgar', text: 'Le duc a donné à Edgar une drogue verte contre l’insomnie. Elle l’emmène dans une autre Lausanne, et ce qu’on serre dans ses mains en s’endormant passe avec soi. Edgar a caché le vrai rouleau dans la boutique de ce rêve.' },
      SAUVES: { title: 'Les frères Wellington', text: 'Vous étiez là quand le duc est venu rue Saint-Étienne. Les deux frères sont vivants, et Edgar a remis le vrai rouleau entre vos mains.' },
      ROULEAU: { title: 'Le Rouleau de la Tête', text: 'Le premier de cinq rouleaux écrits par Sedefkar, à Constantinople, avant la croisade. Celui-ci raconte sa vie et sa statue. Les autres parlent du culte, des pouvoirs sur la chair, du rituel qui l’éveille et de celui qui la garde en équilibre.' },
      CHAISE: { title: 'Une chaise en moins', text: 'Au wagon-restaurant du Simplon, le duc a disparu sous vos yeux, avec sa chaise, dans une boucle de crin tressé. Vous le reverrez.' }
    },

    checks: {
      psy_edgar: { skill: 'Psychologie', why: 'savoir si Edgar dit tout',
        resolve: function (api, r) { api.say(r.success ? 'Il en sait beaucoup plus qu’il n’en dit. Ses mains, surtout : elles ne mentent pas aussi bien que sa bouche. Et il a besoin d’argent, vite.' : 'Un homme fatigué, poli, un peu trop aimable. Vous n’en tirez rien de plus.'); } },
      psy_duc: { skill: 'Psychologie', why: 'percer le duc à jour',
        resolve: function (api, r) { api.say(r.success ? 'Un homme aux multiples facettes, et vous n’en voyez que quelques-unes. Celles qu’il vous montre sont parfaites. C’est ce qui vous inquiète.' : 'Un aristocrate charmant, gourmand, un peu ridicule. Il vous plaît, presque malgré vous.'); } },
      edu_crypte: { skill: 'EDU', why: 'dater les fondations de la crypte',
        resolve: function (api, r) { api.say(r.success ? 'Ces pierres-là n’appartiennent pas à la cathédrale. Elles sont plus anciennes de plusieurs siècles : une église avant l’église, et peut-être autre chose encore avant elle. On a toujours prié ici. Ou on a toujours eu besoin de prier ici.' : 'De vieilles pierres sous de vieilles pierres. Votre lanterne fait danser les ombres, et c’est tout ce que vous en retenez.'); } },
      disc_duc: { skill: 'Discrétion', why: 'suivre le duc sans être vu',
        resolve: function (api, r) { P.filature(api, r.success); } },
      biblio_journaux: { skill: 'Bibliothèque', why: 'dépouiller la gazette des dernières années',
        resolve: function (api, r) {
          if (!r.success) { api.say('Des colonnes de cours du lait, d’horaires de bateaux et de nouvelles de la conférence. Si quelque chose se cache là-dedans, vous ne l’avez pas vu.'); return; }
          api.say('Les avis mortuaires d’abord, puis les faits divers. Vous comptez sans y penser, puis vous comptez pour de bon. Avant 1914, presque rien : un notaire ruiné, une fille de ferme. Depuis 1918, un mort par mois. Le pont Bessières, le lac, une poutre de grenier. Chaque mois. Les rédacteurs parlent de la mélancolie d’après-guerre, et changent vite de sujet.');
          api.check('san_suicides');
          api.clue('SUICIDES');
        } },
      san_suicides: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'refermer les gazettes',
        resolve: function (api, r) { api.say(r.success ? 'La guerre a fait pire ailleurs. Vous refermez le volume.' : 'Vous refermez le volume, et la régularité vous reste dans l’oreille, comme une horloge dans une maison vide.'); } },
      biblio_occulte: { skill: 'Bibliothèque', why: 'trouver les livres que personne ne demande',
        resolve: function (api, r) {
          var n = api.flag('occN') || 0;
          if (!r.success) { api.say(api.fresh('occRate', ['Des traités de magnétisme, un almanach de sorcellerie pour les dames, une réfutation du spiritisme par un pasteur de Morges. Rien de sérieux.', 'Le fonds ancien n’a pas de catalogue digne de ce nom. Vous tirez des volumes au hasard, et le hasard vous boude.'])); return; }
          n += 1; api.flag('occN', n);
          if (n === 1) { api.say('Au bout d’une rangée de reliures rongées, une cote qui renvoie à un rayon fermé à clé. Mlle Chappuis fronce le sourcil. « Ce rayon-là, on ne le demande pas souvent. » Elle va chercher la clé. Encore un effort, et vous saurez ce qu’il y a derrière.'); return; }
          api.say('Un in-quarto allemand, moisi aux coins, à l’odeur de cave. Le titre est en lettres gothiques, et le texte parle de cultes dont vous ne connaissiez pas les noms, et que vous auriez préféré ne pas connaître. Il faudrait des semaines pour le lire. Vous n’en avez pas une.');
          api.say('Glissée sous la couverture, la fiche de prêt. Un seul nom, depuis la guerre, revenu six fois : « J.-F. des Esseintes, rue du Pré ». Des pages ont été découpées au rasoir, proprement, au milieu d’un chapitre sur les villes qui rêvent.');
          api.clue('KULTEN'); apprendre(api, 'la_pre'); api.mythos(1);
        } },
      chance_lumiere: { skill: 'CHANCE', why: 'trouver l’interrupteur dans le noir',
        resolve: function (api, r) {
          if (r.success) { api.flag('lumiere', true); api.say('Votre main tombe sur un bouton de porcelaine. Un déclic : une ampoule nue s’allume au plafond, et toutes les bêtes de la boutique vous regardent en même temps.'); return; }
          api.say('Vous tâtonnez le long du mur. Quelque chose vous prend la manche, et vous vous dégagez d’un geste trop brusque : la griffe d’un lynx empaillé. Il vous faut une bonne minute pour trouver le bouton de porcelaine, et pour que votre cœur ralentisse.');
          api.flag('lumiere', true); api.time(3);
        } },
      san_william: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d6'], why: 'regarder William',
        resolve: function (api, r) { api.say(r.success ? 'Vous vous forcez à regarder la blessure comme le ferait un médecin. Une plaie. Une autre plaie. Un rectangle de peau ôtée, aux bords nets. Nets comme un patron de couturière.' : 'Le visage de William. C’est le visage qui vous reste : les yeux ouverts, et cette expression qu’on n’a qu’une fois. Vous vous retrouvez dans le couloir sans savoir comment vous y êtes allé{e}.'); } },
      san_edgar: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'regarder Edgar',
        resolve: function (api, r) { api.say(r.success ? 'Il a l’air de dormir. C’est presque le pire.' : 'Il a l’air de dormir, et vous attendez, malgré vous, qu’il se réveille.'); } },
      med_corps: { skill: 'Médecine', why: 'comprendre de quoi Edgar est mort',
        resolve: function (api, r) {
          if (!r.success) { api.say('Une surdose, c’est ce que tout le monde dira. Les pupilles, la peau bleue, la seringue. Vous n’en voyez pas davantage.'); api.flag('corpsVu', true); return; }
          api.say('Une surdose de morphine, sans aucun doute. Le bras gauche est criblé de piqûres anciennes, celles d’un homme qui se pique depuis des années. Mais il y en a une autre, fraîche, au pli du bras droit. Edgar tenait sa tasse de la main droite. Un droitier ne se pique pas lui-même de ce côté-là. Quelqu’un l’a fait pour lui.');
          api.clue('PIQURES'); api.flag('corpsVu', true);
        } },
      toc_faux: { skill: 'Trouver Objet Caché', why: 'fouiller sous le lit',
        resolve: function (api, r) {
          if (!r.success) { api.say('Sous le lit, la poussière, une pantoufle, un livre de Kipling. Rien d’autre, ou rien que vous ayez vu.'); api.flag('sousLit', (api.flag('sousLit') || 0) + 1); return; }
          trouverFaux(api);
        } },
      exp_faux: { skill: 'Archéologie', why: 'juger de l’âge du rouleau',
        resolve: function (api, r) { jugerFaux(api, r.success); } },
      eval_faux: { skill: 'Évaluation', why: 'juger de l’âge du rouleau',
        resolve: function (api, r) { jugerFaux(api, r.success); } },
      credit_police: { skill: 'Crédit', why: 'convaincre la police de votre bonne foi',
        resolve: function (api, r) {
          api.endTalk(false);
          if (r.success) { deposition(api, 'Le commissaire de nuit vous écoute jusqu’au bout, sans vous interrompre. Il fait venir un médecin, qui trouve la piqûre du bras droit sans que vous la lui montriez. « Vous avez bien fait de ne pas fuir. Laissez-moi votre adresse à Milan. Si on a besoin de vous, on vous écrira. »'); return; }
          garde(api);
        } },
      fort_porte: { skill: 'FOR', why: 'enfoncer la porte de la rue du Pré',
        resolve: function (api, r) { if (r.success) entreeDuc(api, 'Au troisième coup d’épaule, le pêne cède avec un bruit de bois sec. Vous entrez, et vous repoussez la porte derrière vous.'); else { api.say('La porte ne bouge pas d’un millimètre. Elle a été faite pour ça.'); passant(api); } } },
      crochet_porte: { skill: 'Crochetage', why: 'ouvrir la serrure de la rue du Pré',
        resolve: function (api, r) { if (r.success) entreeDuc(api, 'Une serrure lourde, ancienne, bien huilée. Elle cède avec un petit bruit de gorge. Vous entrez.'); else { api.say('La serrure résiste. Une serrure de prison, sous un vernis de maison bourgeoise.'); passant(api); } } },
      san_porte: { skill: 'SAN', label: 'Santé mentale', loss: ['1d3', '1d6'], why: 'retirer votre main de la porte',
        resolve: function (api, r) {
          api.clue('PORTE');
          api.say(r.success ? 'Vous retirez votre main. Le désespoir reflue, lentement, comme une eau qui se retire d’une cave. Il en reste une flaque, quelque part en vous.' : 'Vous ne retirez pas votre main. Vous ne voulez plus rien, pendant un long moment : ni partir, ni rester, ni vivre. Une seule pensée tient debout, et elle n’est pas à vous : il serait si simple d’en finir. Quand vous reprenez votre souffle, vous êtes assis{e} par terre, le dos au mur, et la porte vous regarde.');
        } },
      pso_william: { skill: 'Premiers soins', why: 'arrêter le sang de William',
        resolve: function (api, r) { soinsWilliam(api, r.success); } },
      med_william: { skill: 'Médecine', why: 'sauver William',
        resolve: function (api, r) { soinsWilliam(api, r.success); } },
      med_edgar: { skill: 'Médecine', why: 'garder Edgar en vie',
        resolve: function (api, r) {
          api.flag('edgarTente', true);
          if (r.success) { api.flag('sauveE', true); api.say('Vous le redressez, vous le giflez, vous lui parlez sans arrêt, vous comptez ses respirations à voix haute. Il en manque une, puis deux. Puis elles reviennent, lentes, régulières. Il ne se réveille pas. Mais il vit.'); return; }
          api.say('Vous comptez ses respirations. Elles s’espacent, malgré tout ce que vous faites. À la fin, il n’y a plus que la vôtre dans la chambre.');
          api.flag('edgarMort', true);
        } },
      san_lecture: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d4'], why: 'lire Sedefkar',
        resolve: function (api, r) { api.say(r.success ? 'Vous posez les feuillets. Ce n’est qu’un fou, mort depuis sept cents ans. Il ne peut plus rien.' : 'Vous posez les feuillets. Longtemps, vous regardez vos mains, le dessus, puis le dedans, comme on vérifie un gant qu’on vient d’acheter.'); } },
      san_efface: { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d3'], why: 'regarder Edgar s’effacer',
        resolve: function (api, r) { api.say(r.success ? 'Il est mort hier soir. Vous le saviez. Ce n’était qu’un rêve qui finissait.' : 'Il n’y a plus personne sur la banquette. Il y a eu quelqu’un. Vous avez entendu sa voix demander ce qui lui arrivait, de plus en plus bas, et vous n’avez rien su lui répondre.'); } },
      san_fletri: { skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d4'], why: 'regarder votre main',
        resolve: function (api, r) { api.say(r.success ? 'Votre main. C’est votre main. Elle vous fait mal, et vous la gardez sous la table.' : 'Vous ne pouvez pas détacher les yeux de votre main : la peau de vieillard, les ongles jaunes. Elle n’est plus à vous. Elle est à lui, maintenant.'); } }
    },

    ending: { title: 'Fin du chapitre 3 : Lausanne', text: 'Milan, treize heures passées. Le chapitre 4 arrive bientôt.' }
  };

  // ================================================================ la journée de la boutique
  // Edgar reçoit de 9 h à 16 h, tant qu'on ne l'a pas vu. Ensuite il sort chercher de quoi fabriquer son faux,
  // rentre vers 17 h 40, et s'endort à 18 h avec la drogue du duc. Le duc entre à 18 h 20 ; à 18 h 45, tout est fini.
  // Qui est là à temps peut l'empêcher : le duc ne tue pas devant témoin.
  function williamVivant(api) { return !api.flag('meurtre') || api.flag('sauveW'); }
  function edgarVivant(api) { return !api.flag('meurtre') || api.flag('sauveE'); }
  function crime(api) { return !!api.flag('meurtre'); }
  function edgarRecoit(api) { var m = mn(api); return day(api.s.min) === j0(api) && !api.flag('edgarVu') && m >= 9 * 60 && m < 16 * 60; }
  function edgarRentre(api) { return day(api.s.min) === j0(api) && mn(api) >= 17 * 60 + 40; }
  function edgarEveille(api) { return api.flag('edgarSauve') && api.s.min >= (api.flag('reveilEdgar') || Infinity); }
  P._crime = crime;

  function trouverFaux(api) {
    api.flag('fauxTrouve', true);
    api.say('Sous le lit, tout au fond, enveloppé dans une taie d’oreiller : un rouleau de parchemin, lié d’un ruban et scellé de cire rouge. Il a l’air ancien. Il a l’air très ancien.');
    api.take(FAUX);
  }
  function jugerFaux(api, ok) {
    api.flag('fauxJuge', true);
    if (!ok) { api.say('Un parchemin jauni, un ruban passé, une cire craquelée. Il a l’air ancien. Vous n’en savez pas davantage.'); return; }
    api.say('Le jaune est trop régulier, la cire trop vive sous ses craquelures. On l’a vieilli au four, comme on dore un pâté. Les bords du parchemin ont le grain d’un papier acheté cette semaine. C’est un faux, et un faux fait vite.');
    if (api.has('RECU')) api.say('La cire rouge et le parchemin du reçu. Edgar a fabriqué ce rouleau aujourd’hui.');
    api.clue('FAUX');
  }
  function deposition(api, txt) {
    api.flag('deposition', true); api.flag('garde', false);
    api.vue('situations/03_hotel-de-police-de-lausanne', 'L’hôtel de police');
    api.say(txt);
  }
  // la nuit au poste : on vous relâche à l'aube, juste à temps pour le train
  function garde(api) {
    api.flag('garde', true);
    api.vue('situations/03_hotel-de-police-de-lausanne', 'L’hôtel de police');
    api.say('« Vous comprendrez que je ne peux pas vous laisser repartir comme ça. » On vous prend vos papiers, on vous laisse vos affaires, et l’on vous enferme dans un bureau où il n’y a qu’une chaise et un portrait du général Dufour.');
    api.say('À six heures, un inspecteur rasé de frais vous rend votre passeport. Le médecin légiste a trouvé la piqûre du bras droit ; quelqu’un d’autre a tué ces deux hommes, et vous n’êtes, pour l’instant, qu’un témoin. « Votre train part dans quarante minutes. Ne le manquez pas. Et ne revenez pas trop vite. »');
    api.s.min = (j0(api) + 1) * D + 6 * 60 + 5; api.s.tick = 0;
    api.flag('deposition', true);
    api.go('la_gare');
  }
  function passant(api) {
    var h = hour(api.s.min), chance = h >= 7 && h < 18 ? 0.4 : h < 21 ? 0.15 : 0.05;
    if (api.rand() >= chance) return;
    var n = (api.flag('passants') || 0) + 1; api.flag('passants', n);
    api.say(n === 1 ? 'Une fenêtre s’ouvre en face. Une vieille dame en bonnet vous regarde, longuement, puis referme sans un mot. Vous ne savez pas si elle appellera quelqu’un.' : 'Un homme en pèlerine s’arrête au bout de la rue, vous regarde, et s’en va d’un pas pressé vers la Palud. Vers l’hôtel de police.');
    if (n >= 2) api.flag('signale', true);
  }
  function entreeDuc(api, txt) {
    api.flag('dedansDuc', true); api.say(txt);
    api.go('la_preint');
  }

  // ---------------------------------------------------------------- l'heure du duc
  function temoin(api, comment) {
    api.flag('ducIci', api.s.turn);
    api.flag('ducEntre', true); api.flag('temoin', true); api.flag('sauveW', true); api.flag('sauveE', true); api.flag('edgarSauve', true);
    api.flag('reveilEdgar', tAt(api, 22, 0)); api.flag('ducVu', true);
    if (api.s.talk) api.endTalk(false);
    if (comment === 'surpris') {
      api.say('Vous poussez la porte de la chambre d’Edgar. Edgar dort sur le dos, la bouche ouverte. Assis au bord du lit, le duc des Esseintes tient une seringue pleine, l’aiguille levée vers la lampe, comme on vérifie un vin.');
      api.npc('duc', 'Il ne sursaute pas. Il pose la seringue sur la table de nuit, très doucement. « Ah ! Vous voilà. Notre ami dort si mal, vous savez. Je lui apportais son remède. » Il se lève, lisse son gilet. « Mais puisqu’il a de la compagnie, je reviendrai. Nous nous verrons ce soir, j’espère. »');
      api.say('Il sort sans se presser. Vous entendez son pas dans l’escalier, la porte, la cour. William est dans l’encadrement de la cuisine, un couteau à dépecer à la main, et il regarde la seringue. Il ne la quitte pas des yeux.');
    } else {
      api.say('La cloche de la porte. William descend ouvrir ; une voix grasse et gaie monte de la boutique, puis s’arrête net. Un silence. Des pas dans l’escalier, lourds, lents.');
      api.npc('duc', 'Le duc des Esseintes paraît à la porte du salon, une petite valise à la main. Il vous voit. Pendant une demi-seconde, son visage ne fait rien du tout. Puis il sourit. « Vous ici ! Quelle bonne surprise. Je passais prendre des nouvelles d’Edgar. Il dort ? Alors je ne le dérange pas. » Il tapote sa valise. « À ce soir, peut-être. »');
      api.say('Il redescend. William, debout dans le couloir, le regarde partir sans cligner des yeux. Puis il tire son carnet, écrit, et vous le tend : « Il ne vient jamais à cette heure-ci. »');
    }
    api.flag('vueBoutique', 'etage');
  }
  // le duc est entré : ce qu'on trouve selon le moment où l'on arrive
  function interruption(api) {
    var m = api.s.min, t = tAt(api, 18, 30);
    if (m < t) { temoin(api, 'surpris'); return; }
    // trop tard pour Edgar, peut-être pas pour William
    api.flag('interrompu', true); api.flag('ducVu', true);
    api.say('Un bruit sourd à l’étage, comme un meuble qu’on renverse. Puis un cri étranglé, qui n’a pas de mots. Vous montez quatre à quatre.');
    api.say('Dans la cuisine, William est à terre, contre le fourneau, les mains sur le ventre, et le sang passe entre ses doigts. Sa chemise est ouverte. Au fond du couloir, la porte de l’escalier de service bat encore ; dans la cour, en bas, quelqu’un de lourd s’éloigne sans courir.');
    api.say('Par la porte de la chambre, vous voyez Edgar sur son lit, le bras droit pendant, une seringue vide sur le tapis. Il respire mal. Il respire.');
    api.go('la_etage', true);
    api.chips([{ label: 'Soigner William', action: 'le_soigner_w' }, { label: 'Secourir Edgar', action: 'le_soigner_e' }]);
  }
  function soinsWilliam(api, ok) {
    api.flag('williamTente', true);
    if (ok) { api.flag('sauveW', true); api.say('Vous pressez un torchon roulé sur la plaie, de tout votre poids, et vous ne lâchez plus. William vous regarde faire, de ses yeux qui ne cillent pas. Quand le médecin du quartier arrive, appelé par la logeuse du premier, le sang ne coule presque plus. « Il s’en tirera. Grâce à vous. »'); }
    else { api.flag('williamMort', true); api.say('Vous faites ce que vous pouvez. Ce n’est pas assez. William cesse de vous regarder sans fermer les yeux, et vous mettez longtemps à comprendre qu’il est parti.'); }
    finInterruption(api);
  }
  function finInterruption(api) {
    if (!api.flag('williamTente') || (!api.flag('edgarTente') && !api.flag('edgarMort'))) return;
    var w = api.flag('sauveW'), e = api.flag('sauveE');
    api.flag('meurtre', !(w && e));
    if (e) { api.flag('edgarSauve', true); api.flag('reveilEdgar', tAt(api, 22, 0)); }
    if (!w) { api.flag('meurtreW', true); }
    if (!e) api.flag('meurtreE', true);
    api.say('Le médecin de nuit, puis deux agents en pèlerine, puis un commissaire tiré de son dîner. Vous racontez tout, ou presque. Ils ont vu le sang sur vos mains, et la seringue, et la porte de service ouverte. Le médecin trouve la piqûre du bras droit d’Edgar avant que vous en parliez.');
    deposition(api, '« Vous avez sauvé ce qui pouvait l’être, dit le commissaire. Laissez-nous votre adresse à Milan. Et si vous revoyez l’homme de l’escalier, ne jouez pas les héros : appelez. »');
    api.flag('crimeVu', true); api.clue('CRIME');
    if (!e) { api.flag('fioleOK', true); api.take(FIOLE); api.take(JOURNAL); api.say('Avant qu’on emporte Edgar, vous avez pris sur la table de nuit une fiole verte à moitié pleine, et le journal ouvert par terre. Personne ne vous a rien demandé.'); }
  }

  // ---------------------------------------------------------------- Edgar se réveille
  function reveilEdgar(api, gare) {
    if (api.flag('edgarParle')) return false;
    api.flag('edgarParle', true);
    if (api.s.talk) api.endTalk(false);
    if (gare) {
      api.arrive('edgar');
      api.say('Sur le quai, deux silhouettes sortent du brouillard en courant presque : Edgar Wellington, sans chapeau, et derrière lui William, une valise dans chaque main. Edgar vous attrape le bras. Il serre contre sa poitrine un rouleau de parchemin brun, noué d’un cordon de soie.');
      api.npc('edgar', '« Je savais que vous prendriez ce train. » Il a les yeux d’un homme qui n’a pas dormi, ou qui a trop dormi. « Cette nuit, j’y suis allé. Ils venaient, dans l’escalier. Je suis rentré. Et j’ai trouvé la seringue sur ma table de nuit, celle que je n’avais pas apportée. » Il vous met le rouleau dans les mains, et une liasse de feuillets dactylographiés. « Prenez-le. Tant que je l’ai, il reviendra. La traduction est dedans. »');
      api.take(ROULEAU); api.take(TRAD); api.flag('rouleau', 'vrai'); api.clue('SAUVES');
      if (!api.item(FAUX)) { api.npc('edgar', '« Et celui-ci : je l’ai fait hier, pour le lui vendre. Il n’a jamais vu le vrai. Si un jour il vous le réclame… »'); api.take(FAUX); api.flag('fauxTrouve', true); api.clue('FAUX'); }
      api.npc('edgar', '« Nous partons pour Genève, puis Londres. Chez nous. » William, derrière lui, lève son carnet : « Merci. »');
      return true;
    }
    api.say('Un cri, dans la chambre. Edgar est assis sur son lit, trempé de sueur, les yeux grands ouverts. Il serre contre sa poitrine un rouleau de parchemin brun, noué d’un cordon de soie, si fort que ses phalanges sont blanches.');
    api.npc('edgar', '« Ils venaient. Ils étaient dans l’escalier. » Il regarde autour de lui, la chambre, la lampe, vous. « Je suis rentré. Je l’ai, et je suis rentré. » Puis il voit la seringue sur la table de nuit, celle qu’il n’a pas apportée, et il comprend avant que vous parliez.');
    if (api.flag('meurtreW')) api.npc('edgar', 'Quand vous lui dites pour William, il ne dit rien. Il pose le rouleau sur le lit, entre vous et lui, comme on pose une arme qu’on ne veut plus toucher.');
    api.npc('edgar', '« Prenez-le. Prenez-le, et partez. Tant que je l’ai, il reviendra. » Il ouvre le tiroir de sa table, en sort une liasse de feuillets dactylographiés. « La traduction. J’ai payé un Arménien de Genève pour la faire. Je n’ai jamais pu la lire jusqu’au bout. »');
    api.take(ROULEAU); api.take(TRAD); api.flag('rouleau', 'vrai'); api.clue('SAUVES');
    if (!api.item(FAUX)) {
      api.npc('edgar', 'Il hésite, puis tire de sous le lit un second rouleau, scellé de cire rouge. « Et celui-ci. Je l’ai fait cet après-midi, pour le lui vendre. Il n’a jamais vu le vrai. Si un jour il vous le réclame… »');
      api.take(FAUX); api.flag('fauxTrouve', true); api.clue('FAUX');
    }
    api.npc('edgar', '« Nous partirons demain, William et moi. Chez nous. Il y a des années que je n’ai pas dit chez nous. » Il verse ce qui reste de la fiole verte dans la cuvette, sans un regard.');
    api.say('Il est minuit passé quand vous redescendez dans la cour. Il ne pleut pas. Il n’a pas plu, cette nuit, rue Saint-Étienne.');
    return true;
  }
  P.reveilEdgar = reveilEdgar;

  // ================================================================ la visite du duc
  // Le duc présente la ville : la cathédrale, le musée, le Signal, puis le Chat Noir, où il vous laisse vers 17 h.
  var VISITE = [
    { loc: 'la_cathedrale', h: 12, m: 0 }, { loc: 'la_musee', h: 14, m: 30 }, { loc: 'la_signal', h: 16, m: 0 }, { loc: 'la_chatnoir', h: 17, m: 0 }
  ];
  function etapeVisite(api, i) {
    var e = VISITE[i], dest = e.loc, t = tAt(api, e.h, e.m);
    api.flag('visite', i + 1);
    if (api.s.min < t) { api.s.min = t; api.s.tick = 0; } else api.time(30);
    if (dest !== 'la_musee' || jour(api) !== 'dimanche') { apprendre(api, dest); }
    api.go(dest, true);
    commenter(api, dest);
  }
  function commenter(api, dest) {
    if (dest === 'la_cathedrale') {
      api.say('Le duc vous fait monter les cent soixante marches de bois couvertes qui grimpent jusqu’à la Cité. Il s’arrête à chaque palier, pour reprendre son souffle, prétend-il, mais il n’est jamais essoufflé. En haut, la cathédrale : une masse grise posée sur la colline comme un navire échoué.');
      api.npc('duc', '« Gothique, et du meilleur. Consacrée par un pape, du temps où les papes se déplaçaient pour si peu. Mais ce n’est pas pour les vitraux que je vous ai fait monter. Venez. »');
      api.say('Dans un bas-côté, sur un tombeau, un chevalier de pierre est couché, les pieds sur un lion. Ses avant-bras s’arrêtent net aux poignets. On ne lui a pas laissé ses mains.');
      api.npc('duc', '« Mort en duel judiciaire, il y a plus de cinq cents ans. Dieu, consulté à la pointe de l’épée, lui a donné tort. On lui a donc ôté les mains, après coup, pour que la pierre s’en souvienne. » Il sourit. « J’aime l’idée d’un Dieu qui se trompe avec une telle fermeté. »');
      api.clue('GISANT');
      api.chips([{ label: 'Continuer la visite : le musée', action: 'vi_suite' }, { label: 'Descendre voir la crypte', action: 'lc_crypte' }, { label: 'Prendre congé du duc', action: 'vi_quitter' }]);
    } else if (dest === 'la_musee') {
      api.say('Le duc vous offre un déjeuner de perches du lac dans une brasserie de la place de la Riponne, qu’il mange avec une lenteur de chanoine, puis il vous fait entrer au palais de Rumine : un palais florentin tout neuf, plein de coquillages d’eau douce, de monnaies romaines et d’urnes funéraires. À l’étage, la bibliothèque cantonale : des lecteurs studieux, beaucoup, sous des lampes vertes.');
      api.npc('duc', '« Cent vingt mille volumes, et pas un qui mente. » Il caresse une vitrine du bout des doigts. « Les Suisses rangent même leurs morts par ordre alphabétique. C’est très reposant. Pour un temps. »');
      api.chips([{ label: 'Continuer la visite : le Signal', action: 'vi_suite' }, { label: 'Prendre congé du duc', action: 'vi_quitter' }]);
    } else if (dest === 'la_signal') {
      api.say('Le brouillard s’est levé d’un coup, vers le milieu de l’après-midi, comme un rideau. Un kilomètre de montée dans les bois de Sauvabelin, et c’est le Signal : un belvédère au-dessus de tout le Léman. Le lac, immense, couleur d’étain ; de l’autre côté, la Savoie ; et au fond, très loin vers le sud-est, les grandes Alpes, blanches de neige fraîche.');
      api.npc('duc', 'Il tend sa canne vers les sommets, d’un geste large. « Au-delà, l’Italie. » Il garde le bras levé un moment de trop. « Tout le monde finit par passer par là. »');
      api.chips([{ label: 'Continuer la visite : le Chat Noir', action: 'vi_suite' }, { label: 'Prendre congé du duc', action: 'vi_quitter' }]);
    } else if (dest === 'la_chatnoir') {
      api.say('Quelques kilomètres de flânerie plus tard, le duc vous fait entrer dans un grand café à la française, glaces, banquettes de moleskine, garçons en long tablier, qui donne sur une petite place en pente. Il commande pour vous un vin blanc du Lavaux, sans vous demander votre avis, et ne touche pas au sien.');
      api.npc('duc', 'Il consulte sa montre. « Je suis désolé, {cher} ami{e} : un rendez-vous d’affaires, dans une demi-heure. C’est ici que nous nous retrouverons ce soir. Sept heures et demie, mettons huit heures. Edgar apportera son rouleau, Max apportera sa conversation, et j’apporterai mon appétit. » Il se lève, très léger pour son poids. « Demain, si vous voulez, je vous montrerai le reste. »');
      api.say('Il sort. Par la vitre, vous le voyez traverser la place, la canne sous le bras, et prendre une ruelle qui descend.');
      api.flag('visite', 0); api.flag('visiteFinie', true); api.flag('ducParti', api.s.min);
      api.chips([{ label: 'Suivre le duc', action: 'cn_suivre' }, { label: 'Attendre ici le rendez-vous', action: 'cn_attendre' }]);
    }
  }
  P.quitterVisite = function (api, id) {
    var e = VISITE[api.flag('visite') - 1];
    if (e && e.loc === id) return;
    api.arrive('duc');
    api.flag('visite', 0); api.flag('visiteFinie', true); api.flag('ducParti', api.s.min);
    api.npc('duc', '« Vous m’abandonnez ? » Il ne semble pas offensé le moins du monde. « Alors à ce soir. Le Chat Noir, sept heures et demie. Demandez à n’importe qui : tout le monde le connaît. »');
    apprendre(api, 'la_chatnoir');
  };
  // suivre le duc : à travers la ville, jusqu'à la rue du Pré ; après 17 h, jusqu'à la rue Saint-Étienne
  P.filature = function (api, ok) {
    if (!ok) {
      api.say(api.fresh('filRate', ['Il marche plus vite qu’on ne le croirait, pour sa taille. Une ruelle, un escalier, le brouillard qui remonte : au pied de la cathédrale, il n’y a plus personne. Vous l’avez perdu.', 'Il s’arrête devant une vitrine, se retourne. Vous faites semblant de lire une affiche. Quand vous relevez les yeux, la rue est vide.']));
      api.time(20); api.flag('filRatee', true); return;
    }
    apprendre(api, 'la_pre'); api.clue('MAISONDUC');
    var m = api.s.min;
    if (m < tAt(api, 17, 0)) {
      api.say('Vous le suivez de loin. Il descend la Cité sans se retourner, achète des cigarettes turques à un kiosque, s’arrête devant une pâtisserie sans y entrer, et tourne dans la rue du Pré. Une petite maison étroite, à deux étages, aux volets clos. Les fenêtres du rez-de-chaussée sont grillées comme celles d’une banque. Il ouvre avec une grosse clé, entre, et referme. Aucune lumière ne s’allume.');
      api.time(25); api.go('la_pre', true); return;
    }
    api.say('Vous le suivez de loin. Il descend vers la rue du Pré, une petite maison étroite aux volets clos et aux fenêtres grillées, où il entre sans allumer. Vous attendez sous un porche, dans le froid qui tombe.');
    api.s.min = Math.max(api.s.min, tAt(api, 18, 5)); api.s.tick = 0;
    api.say('À six heures, la porte se rouvre. Le duc ressort, une petite valise de cuir à la main, et remonte vers la Cité d’un pas tranquille. La rue Saint-Étienne. La cour du numéro 50. Il sonne à la boutique Wellington. Il est six heures vingt.');
    api.s.min = tAt(api, 18, 20); api.flag('ducEntre', true); api.flag('ducVuEntrer', true);
    api.go('la_rue', true);
    api.say('William ouvre. Le duc entre. La porte se referme, et le rideau rouge retombe.');
    api.chips([{ label: 'Entrer derrière lui', action: 'lr_entrer' }, { label: 'Attendre dehors', action: 'lr_guetter' }]);
  };

  // ================================================================ les personnages
  P.npcs = {
    jeanclaude: H.npc({ id: 'jeanclaude', name: 'Jean-Claude, porteur', short: 'Jean-Claude', patience: 9, cooldown: 15, selfKeys: ['JEANCLAUDE'], lieux: ['la_gare'],
      greet: function (api, first) { api.npc('jeanclaude', first ? 'Un porteur aux yeux gonflés de sommeil, la casquette de la Compagnie enfoncée jusqu’aux oreilles, une moustache de phoque. « Jean-Claude, pour vous servir. Vous allez pas rester planté{e} là dans ce brouillard. Venez au bureau, il y a le poêle. »' : api.fresh('jcG', ['« Ah, c’est vous. »', '« Encore besoin de Jean-Claude ? »', 'Jean-Claude soulève sa casquette.'])); },
      bye: '« Bonne journée. Et gardez vos sous dans la poche de devant : avec la conférence, il y a du monde. »',
      deflect: ['« Ça, je sais pas. »', '« Demandez-moi plutôt un hôtel ou un horaire. »', 'Il se gratte la nuque.'],
      topics: [
        T('hotel', ['HOTEL', 'CHAMBRE', 'DORMIR'], function (api) { api.npc('jeanclaude', '« L’hôtel des Alpes, en haut de l’avenue ? Bon choix. Votre chambre est retenue, on a reçu la liste des Wagons-Lits hier soir. Je vous fais porter les bagages, vous montez en fiacre. Dix minutes. »'); }, { chip: 'Un hôtel' }),
        T('wellington', ['EDGAR', 'BOUTIQUE', 'LETTRE', 'WILLIAM'], function (api) { api.npc('jeanclaude', '« La rue Saint-Étienne, c’est dans la Cité, sous la cathédrale. Ça grimpe. Le 50, c’est l’Anglais des bêtes empaillées, M. Wellington. Il vient chercher des caisses à la consigne, des caisses de Londres qui sentent le camphre. Un monsieur poli. Il a mauvaise mine. Son frère, c’est autre chose : il vous regarde comme une vitrine. »'); apprendre(api, 'la_rue'); }, { chip: 'La rue Saint-Étienne', chipCond: function (api) { return api.has('LETTRE') || api.has('ANNONCE'); } }),
        T('ville', ['DESTINATIONS', 'TAXI', 'VISITER', 'CATHEDRALE'], function (api) { api.npc('jeanclaude', '« Lausanne, c’est trois collines et pas un mètre de plat. En bas, Ouchy et le lac ; au milieu, la gare ; en haut, la Cité et la cathédrale. La Ficelle monte de la gare au Flon toutes les dix minutes, les fiacres attendent devant, les tramways font le reste. Pour le panorama, montez au Signal, mais pas par ce temps. »'); apprendre(api, 'la_signal'); api.chips(destChips(api).slice(0, 5)); }, { chip: 'Se déplacer dans Lausanne' }),
        T('conference', ['CONFERENCEL', 'TURCS', 'POLICE', 'GUERRE'], ['« Depuis novembre, c’est la conférence. Des Turcs, des Grecs, des Anglais, des Italiens, et plus de journalistes que de pigeons. Il y a des messieurs en civil dans tous les halls d’hôtel. Vous étonnez pas qu’on vous regarde : on regarde tout le monde. »'], { chip: 'La conférence' }),
        T('guet', ['GUET', 'CLOCHE', 'HEURE'], ['« Le guet ? Toutes les nuits, de dix heures à deux heures, il crie l’heure du haut de la tour de la cathédrale. Depuis le Moyen Âge. “C’est le guet ! Il a sonné l’heure !” Les gamins l’imitent dans la cour de l’école. »']),
        T('duc', ['DUC'], ['« Le duc ? Un gros monsieur français, très poli. Il donne des pourboires comme un roi. Il vient souvent à la gare, le matin, quand passe le Simplon. Il prend jamais le train. Il regarde descendre les voyageurs, un par un, comme on regarde le marché. »'], { cond: function (api) { return !!api.flag('ducVu'); } }),
        T('train', ['TRAIN', 'VOYAGE', 'MILAN', 'SIMPLON', 'BILLETS'], ['« Le Simplon-Orient passe tous les matins à six heures quarante-cinq, direction Milan. Votre billet vaut pour celui de demain : la Compagnie vous a inscrits. Soyez là à six heures et demie, il attend personne. »'], { chip: 'Le train de demain' }),
        T('lui', ['TOIMEME'], ['« Trente ans de quai. J’ai porté les malles d’un grand-duc et celles d’une danseuse. La danseuse donnait plus. »']),
        T('pourboire', ['DONNER', 'ARGENT'], function (api) { if (!api.pay(0.05)) { api.npc('jeanclaude', '« Laissez, laissez. »'); return; } api.npc('jeanclaude', api.fresh('jcTip', ['« Merci bien ! » La pièce disparaît dans le gilet.', '« Vous êtes bien honnête. Si vous avez besoin de quoi que ce soit, Jean-Claude est à la gare de cinq heures à midi. »'])); api.calm('jeanclaude', 2); }, { noFollow: true })
      ] }),
    burnier: H.npc({ id: 'burnier', name: 'M. Burnier, à la réception', short: 'M. Burnier', patience: 9, cooldown: 15, selfKeys: ['BURNIER', 'RECEPTION'], lieux: ['la_hotel'],
      greet: function (api, first) { api.npc('burnier', first ? 'Un homme mince à favoris gris, en jaquette, qui vous attendait visiblement. « Burnier. Bienvenue à l’hôtel des Alpes. Votre chambre est prête : la vingt-trois, sur le lac. Par ce temps, vous verrez surtout le brouillard, mais il est de très bonne qualité. »' : api.fresh('burG', ['« {M} ? »', '« À votre service. »', 'M. Burnier lève les yeux de son registre.'])); },
      bye: '« Je vous en prie. »',
      deflect: ['« Je crains de ne pas saisir. »', '« Si vous me permettez, je ne vois pas. »', 'Un sourire de réceptionnaire, poli et vide.'],
      topics: [
        T('chambre', ['CHAMBRE', 'HOTEL', 'DORMIR'], ['« La vingt-trois, au deuxième. On vous a monté de l’eau chaude. Le petit déjeuner est servi jusqu’à dix heures, et l’on dîne à sept heures et demie. »'], { chip: 'Votre chambre' }),
        T('conference', ['CONFERENCEL', 'TURCS', 'POLICE'], ['« La conférence nous amène beaucoup de monde, et beaucoup de messieurs qui lisent le même journal pendant trois heures dans le hall. » Il baisse la voix. « Ils sont de la police fédérale, ou de la police d’un autre pays. Ils ne paient jamais leur café. »'], { chip: 'La conférence' }),
        T('wellington', ['EDGAR', 'BOUTIQUE', 'WILLIAM'], function (api) { api.npc('burnier', '« L’Anglais de la rue Saint-Étienne ? Il empaille les chiens des pensionnaires de la clinique. On dit qu’il est souffrant. On dit beaucoup de choses. » Il note l’adresse sur une carte de l’hôtel, au cas où.'); apprendre(api, 'la_rue'); }),
        T('duc', ['DUC'], ['« M. le duc des Esseintes dîne ici, parfois. Il renvoie toujours le vin, et il paie toujours le double. Nos serveurs se disputent sa table. Ils ne la desservent pas volontiers. » Il ne dit pas pourquoi.'], { cond: function (api) { return !!api.flag('ducVu'); } }),
        T('lieux', ['DESTINATIONS', 'TAXI', 'VISITER', 'MUSEEC', 'CATHEDRALE', 'POLICE'], function (api) { api.npc('burnier', '« La cathédrale est à dix minutes, si l’on aime les escaliers. Le musée cantonal, au palais de Rumine, place de la Riponne. L’hôtel de police est à la Palud, près de l’hôtel de ville. Où souhaitez-vous aller ? »'); apprendre(api, 'la_musee'); api.chips(destChips(api).slice(0, 5)); }, { chip: 'Se déplacer' }),
        T('journal', ['JOURNAL', 'ANNONCE'], function (api) { api.npc('burnier', '« La gazette du jour, {m}. » Il vous la tend, pliée en quatre.'); lireGazette(api); }, { noFollow: true })
      ] }),
    edgar: H.npc({ id: 'edgar', name: 'Edgar Wellington', short: 'Edgar', patience: 8, cooldown: 30, selfKeys: ['EDGAR'],
      greet: function (api, first) {
        if (api.flag('theAccueil')) { api.flag('theAccueil', false); return; }
        if (first) {
          api.npc('edgar', 'Le rideau rouge s’écarte. L’homme qui ouvre pourrait avoir cinquante ans ; il en a sans doute quinze de moins. Le crâne presque nu, les yeux cernés de brun, une cigarette brune collée à la lèvre. Il vous détaille d’un air poli, presque timide, et votre accent lui allume le visage. « Un{e} Anglais{e} ! Entrez, entrez donc. Ne restez pas dans ce brouillard. Wellington. Edgar Wellington. »');
          return;
        }
        api.npc('edgar', api.fresh('edgarG', ['« Oui ? »', 'Edgar allume une cigarette à la précédente.', '« Encore un peu de thé ? »']));
      },
      bye: '« À ce soir, alors. »',
      deflect: ['« Je vous demande pardon ? »', 'Edgar sourit, sans comprendre, et tire sur sa cigarette.', '« Je ne vous suis pas tout à fait. »'],
      topics: [
        T('rouleau', ['ROULEAU', 'ROULEAUX', 'SIMULACRE', 'LETTRE', 'ANNONCE', 'HISTOIRE'], function (api, n) {
          api.flag('parleRouleau', true);
          if (n === 0) {
            api.npc('edgar', '« Ah. » Il pose sa tasse. « Je l’ai eu en 1917, en Picardie. Un caporal français me l’a cédé contre des rations et des cigarettes. Malon, il s’appelait. Raoul Malon. Il disait que c’était dans sa famille depuis la Révolution. »');
            if (api.has('MALON') || ((X.passe(api) || {}).indices || []).indexOf('MALON') >= 0) api.say('Malon. Comme le capitaine qui a brûlé la maison du comte, à Poissy, en 1789, et qui n’a pas voulu décrire ce qu’il avait vu dessous.');
            api.npc('edgar', '« C’est du turc, écrit en lettres arabes. Une langue morte dans un alphabet vivant, si vous voulez. Je n’en ai traduit que des bribes. » Il ne vous regarde pas en disant cela.');
            api.clue('WELLINGTON');
            return;
          }
          api.npc('edgar', '« Il parle d’une statue, le Simulacre de Sedefkar. Faite à Byzance, ou trouvée dans ses ruines, ce n’est pas clair. Son dernier propriétaire connu était un comte, Fenalik, arrêté juste avant la Révolution. Ensuite, plus rien. Mes recherches sont dans une impasse. » Il allume une cigarette à la précédente. « Alors je suis prêt à m’en séparer. »');
        }, { chip: 'Le rouleau' }),
        T('prix', ['PRIX', 'ARGENT', 'DONNER', 'ROULEAU'], function (api, n, p) {
          api.flag('parleRouleau', true); api.flag('prixDit', true);
          var dit = ' ' + G.RPG.normalize((p && p.raw) || '') + ' ';
          if (n > 0 && /\b(d accord|marche conclu|j accepte|j achete|entendu|ca marche|je paie|je payerai|tope)\b/.test(dit)) { api.flag('prixAccepte', true); api.npc('edgar', '« Magnifique. » Ses mains tremblent un peu en reposant la théière. « Le rouleau est à la banque, vous comprenez : on ne garde pas une chose pareille au-dessus d’une boutique. Ce soir, je vous l’apporte, et nous signons comme des gentlemen. »'); return; }
          api.npc('edgar', n === 0 ? '« Deux cent cinquante livres. » Il dit le chiffre trop vite, comme on saute un fossé. Ses yeux descendent sur vos chaussures, remontent à votre montre. « C’est une pièce unique. Et je ne suis pas le seul acheteur à qui j’en ai parlé. »' : '« Deux cent cinquante. Je ne descendrai pas beaucoup. Il y a quelqu’un d’autre qui s’y intéresse, voyez-vous. »');
        }, { chip: 'Son prix' }),
        T('voir', ['EXAMINER', 'UTILISER'], function (api) { api.flag('parleRouleau', true); api.npc('edgar', '« Le voir ? Bien sûr, bien sûr. » Il se lève, se rassied. « Il est… en lieu sûr. »'); }, { cond: function (api) { return !!api.flag('parleRouleau'); } }),
        T('william', ['WILLIAM', 'PLAQUES'], ['« Mon frère. La Somme, en 1916. Un éclat d’obus dans la tête. Il ne parle plus depuis, et ses yeux ne bougent plus tout seuls : il faut qu’il tourne la tête pour suivre quelque chose. Les chirurgiens lui ont mis des plaques d’argent sous le crâne. » Il hausse les épaules. « Il vit. C’est déjà beaucoup. C’est lui qui a les mains, ici. Moi, je tiens les comptes. »'], { chip: 'Son frère' }),
        T('guerre', ['GUERRE'], function (api, n) { api.npc('edgar', n === 0 ? '« Je n’en parle pas. » Un temps. « Quand je suis rentré, il n’y avait plus personne à qui parler. Mes amis étaient morts, et les vivants voulaient que je raconte. Alors nous sommes venus ici, William et moi, avec nos économies. Un pays où personne n’a fait la guerre. »' : '« Je vous ai dit que je n’en parlais pas. »'); }),
        T('lausanne', ['VISITER', 'DESTINATIONS', 'CATHEDRALE'], ['« Une ville propre, calme, neutre. On y soigne les nerfs : il y a une clinique réputée, c’est pour William que nous sommes venus. » Il regarde la fenêtre, où le brouillard colle. « On s’y ennuie très bien. »']),
        T('duc', ['DUC'], function (api) { api.npc('edgar', api.flag('ducVenu') ? '« Le duc est un vieil ami. Il m’a beaucoup aidé, quand je ne dormais plus. » Il frotte son avant-bras gauche à travers la manche, sans s’en apercevoir.' : '« Un ami. Un Français, un amateur d’occulte, comme moi. Très riche, très gourmand, très drôle. Vous le rencontrerez peut-être. »'); }, { chip: 'Le duc', chipCond: function (api) { return !!api.flag('ducVenu'); } }),
        T('morphine', ['SERINGUE', 'DOCTEUR', 'DORMIR'], ['« Pardon ? » Il tire sa manche sur son poignet. « Je dors mal. C’est tout. Tout le monde dort mal, depuis. »']),
        T('occulte', ['OCCULTE', 'LIVRE', 'MAGIE', 'CLUB'], function (api) { api.npc('edgar', '« Un passe-temps. On lit, on se pose des questions qu’on ne devrait pas se poser. Le duc, moi, et un ami, Max : nous avons une sorte de club. Le club de sept heures et demie, au Chat Noir. On y parle de tout, surtout de ce qui n’existe pas. »'); apprendre(api, 'la_chatnoir'); }),
        T('fenalik', ['FENALIK', 'POISSY', 'LORIEN', 'VILLA'], ['« Vous êtes allé{e} à Poissy ? » Il se penche. « Alors on a fini par répondre à ma lettre. À sa façon. Qu’y avait-il, là-bas ? Non, ne dites rien. Je préfère ne pas le savoir avant d’avoir vendu. »']),
        T('bras', ['BRAS'], ['Ses yeux s’agrandissent. « Vous l’avez ? Une pièce ? » Il se reprend. « Pardon. À votre place, je ne le dirais à personne. À personne, vous m’entendez. » Il ne vous regarde plus de la même façon.']),
        T('lui', ['TOIMEME', 'TAXIDERMIE'], ['« Taxidermiste. Enfin, William l’est. Les Anglais d’ici nous apportent leurs chiens morts, les touristes achètent des marmottes, et un monsieur de Berne veut un chevreuil qui ait l’air surpris. » Il rit, un rire sans souffle. « On vit de ce qui ne vit plus. »'])
      ] }),
    william: H.npc({ id: 'william', name: 'William Wellington', short: 'William', patience: 6, cooldown: 30, selfKeys: ['WILLIAM'], muet: true,
      greet: function (api, first) { api.npc('william', first ? 'William s’assied en face de vous, un carnet sur les genoux. Il vous regarde. Il ne cligne presque pas des yeux.' : api.fresh('wG', ['William tourne la tête vers vous, d’un bloc.', 'William lève son crayon.'])); },
      bye: 'William incline la tête.',
      deflect: ['William vous regarde, sans rien écrire.', 'Il tient son crayon au-dessus de la page, et attend.', 'William tourne lentement la tête vers la fenêtre, puis revient à vous.'],
      repeat: [['William souligne deux fois ce qu’il a déjà écrit.'], ['William vous regarde.'], ['William ne lève plus son crayon.']],
      topics: [
        T('carnet', ['NOTE', 'POLI', 'QUELQUUN'], function (api) { api.npc('william', api.cycle('wCarnet', ['Il écrit, d’une écriture d’écolier appliqué, et vous tend le carnet : « Belle journée aujourd’hui. »', 'Il écrit : « Bienvenue à Lausanne. »', 'Il écrit : « Encore du thé ? »', 'Il écrit : « Le brouillard se lève à trois heures. »'])); }, { chip: 'Son carnet' }),
        T('ours', ['OURS', 'BOUTIQUE', 'TAXIDERMIE'], ['Il désigne du menton l’ours brun dressé au pied de l’escalier, puis il écrit : « Le premier. Le plus beau. Edgar l’aime. »'], { chip: 'L’ours de l’escalier' }),
        T('duc', ['DUC'], function (api, n) { api.npc('william', n === 0 ? 'Il écrit, plus lentement : « Il apporte les bouteilles vertes. Edgar dort mieux. »' : 'Il écrit, et il appuie si fort que la mine casse : « Je n’aime pas ses mains. »'); }, { cond: function (api) { return !!api.flag('ducVenu') || !!api.flag('ducVu'); } }),
        T('edgar', ['EDGAR'], ['Il écrit : « Edgar est fatigué. Edgar ne dort pas. » Puis, en dessous : « Moi je dors. »']),
        T('guerre', ['GUERRE', 'PLAQUES'], ['Il vous regarde un long moment. Puis il écrit un seul mot, en lettres capitales : « NON. »']),
        T('travail', ['EXAMINER', 'UTILISER'], ['Il écrit : « Un chevreuil, pour un Bernois. Il veut qu’il ait l’air surpris. C’est difficile. Ils n’ont jamais l’air surpris. »'])
      ] }),
    duc: H.npc({ id: 'duc', name: 'Le duc des Esseintes', short: 'Le duc', patience: 12, cooldown: 20, selfKeys: ['DUC'],
      greet: function (api, first) { api.npc('duc', first ? '« Jean Floressas des Esseintes. Ne vous inclinez pas, je vous en prie : le dernier homme qui s’est incliné devant moi s’est relevé avec un lumbago, et je me le suis reproché toute une semaine. »' : api.fresh('ducG', ['« Mon cher ! »', 'Le duc lisse ses moustaches cirées.', '« Je vous écoute, et je vous écoute avec délices. »'])); },
      bye: '« À tout à l’heure. »',
      deflect: ['« Délicieux. Je n’ai rien compris. »', 'Le duc rit, un petit rire haut, de gorge.', '« Vous parlez comme un sphinx. J’adore les sphinx. »'],
      topics: [
        T('lui', ['TOIMEME'], function (api, n) { api.npc('duc', n === 0 ? '« Le dernier d’une très longue suite de ducs qui se sont mariés entre eux jusqu’à ce qu’il ne reste plus que moi. Enfant, j’étais malade de tout. Je me suis soigné. » Il sourit. « Radicalement. »' : '« J’ai passé ma jeunesse à fuir la nature. Elle a fait son temps, voyez-vous : elle a lassé la patience des gens raffinés. Tout ce qu’elle fait, l’artifice le fait mieux. Une femme, une fleur, un coucher de soleil. Un homme. »'); }, { chip: 'Lui-même' }),
        T('rouleau', ['ROULEAU', 'ROULEAUX', 'SIMULACRE', 'PRIX'], ['« Le rouleau d’Edgar ? Une curiosité. » Il fait un petit geste de la main, comme on chasse une mouche. « Je voudrais le voir avant de faire une offre. Je ne fais jamais d’offre sur ce que je n’ai pas vu. C’est ma seule vertu, et je la cultive. »'], { chip: 'Le rouleau' }),
        T('edgar', ['EDGAR', 'WILLIAM'], ['« Un garçon délicat. La guerre lui a pris le sommeil, et je l’aide à le retrouver. » Il regarde ses ongles. « Son frère, c’est autre chose. Il a des yeux de vitrine. On a toujours l’impression qu’il vous empaille. »']),
        T('gisant', ['GISANT', 'CATHEDRALE', 'CRYPTE'], ['« Notre chevalier sans mains ? Je viens le voir souvent. Il me rassure : il prouve qu’on peut perdre un procès devant Dieu et garder sa place à l’église. »']),
        T('lausanne', ['VISITER', 'DESTINATIONS', 'REVE', 'SIGNAL'], ['« Une ville admirable. Elle ne fait rien, et elle le fait à la perfection. » Il baisse la voix, comme pour un secret de famille. « La nuit, en revanche… Toutes les vieilles villes rêvent, vous savez. Lausanne rêve mal, depuis la guerre. »'], { chip: 'Lausanne' }),
        T('reves', ['DORMIR', 'REVE'], ['« Je dors très peu. Les rêves sont la seule chose que les pauvres aient en commun avec moi. J’ai voulu, au moins, choisir les miens. »']),
        T('conference', ['CONFERENCEL', 'TURCS', 'GUERRE'], ['« Des Turcs et des Grecs qui se partagent ce qui reste d’un empire, sous l’œil des Anglais. Je n’ai jamais rien compris à la politique. On y tue tant de monde, et si mal. »']),
        T('fenalik', ['FENALIK', 'BRAS', 'POISSY'], function (api) { api.npc('duc', '« Fenalik ? » Ses yeux, d’un bleu d’eau, s’arrêtent sur vous une seconde. « Un nom de roman. Les comtes allemands du siècle dernier étaient tous des personnages de roman. On les lit, et on les referme. »'); api.flag('ducFenalik', true); }),
        T('club', ['CLUB', 'CHATNOIR', 'MAX'], function (api) { api.npc('duc', '« Le club de sept heures et demie ! Trois membres, et c’est déjà une foule. Edgar, moi, et Max, que vous allez adorer, et que vous regretterez d’avoir adoré. »'); apprendre(api, 'la_chatnoir'); }),
        T('artifice', ['PARFUM', 'SENTIR'], ['« J’ai eu jadis une serre de fleurs naturelles qui imitaient des fleurs artificielles. C’était le seul usage honnête qu’on pût faire de la nature. Les fleurs sont mortes. Je n’ai pas été surpris. »']),
        T('maison', ['MAISONDUC', 'HOTEL'], ['« Chez moi ? Oh, rien à voir. J’habite très peu. Je n’aime pas recevoir : on vous laisse toujours quelque chose, après. »']),
        T('guet', ['GUET', 'CLOCHE', 'HEURE'], ['« Le guet ? Un vieil homme qui crie l’heure à une ville qui dort. C’est la chose la plus poétique de Lausanne, et personne ne l’écoute. Moi, si. »'])
      ] }),
    max: H.npc({ id: 'max', name: 'Max von Wurtheim', short: 'Max', patience: 14, cooldown: 10, selfKeys: ['MAX'],
      greet: function (api, first) { api.npc('max', first ? 'Un grand blond aux yeux très bleus, en habit un peu luisant aux revers, s’arrête devant votre table et claque des talons. « Maximilian von Wurtheim. Vous êtes l’ami{e} d’Edgar ? Ils m’ont chargé de mille excuses : des affaires de dernière minute, tous les deux. Ils vont arriver. Permettez ? » Il s’assied avant votre réponse, et fait signe au garçon.' : api.fresh('maxG', ['« Où en étais-je ? Ah, oui. »', 'Max lève son verre.', '« Mes amis ! »'])); },
      bye: '« Déjà ? La soirée commençait. »',
      deflect: ['« Ha ! Très bon. Très anglais. »', 'Max rit très fort, et reprend son histoire.', '« Cela me rappelle mon oncle de Königsberg. »'],
      topics: [
        T('histoire', ['TOIMEME', 'HISTOIRE', 'MAX'], function (api, n) {
          api.npc('max', api.pick('maxH', [
            '« Mon père, le baron, possédait la moitié d’une province. Des forêts, des étangs, un château avec quarante cheminées et pas une qui tirait. » Il soupire. « Il est mort en route pour changer son testament. En route, vous imaginez ? À dix kilomètres du notaire. »',
            '« Tout est allé à mon frère, Konrad. Konrad me hait depuis le berceau. Il a fait fermer les comptes, chasser ma vieille nourrice, et il m’a envoyé une lettre de quatre lignes que je garde sur mon cœur pour ne jamais lui pardonner. »',
            '« Alors j’ai voyagé. Vienne, Monte-Carlo, une princesse russe à Nice, un duel à Baden dont je vous épargne les détails. Je vous les raconte quand même : il pleuvait, et mon témoin avait oublié les pistolets… »',
            '« Et me voilà à Lausanne, à attendre que la justice allemande, qui est lente mais qui est juste, me rende ce qui est à moi. Cela peut prendre des années. Heureusement, j’ai des amis. »'
          ]));
          api.flag('maxH', (api.flag('maxH') || 0) + 1); api.time(25);
        }, { chip: 'Sa vie', oui: 'histoire' }),
        T('tout', [], function (api) {
          api.npc('max', 'Il raconte. Il raconte très bien : la province, le château, le père mort en route, le frère jaloux, la nourrice chassée, Vienne, Monte-Carlo, la princesse de Nice, le duel sous la pluie, un naufrage sur le lac de Constance que vous n’aviez pas vu venir. Les garçons changent les nappes autour de vous. À la fin, vous n’en croyez pas un mot, et vous avez passé une excellente soirée.');
          api.flag('maxH', 9); api.flag('maxTout', true);
          var fin = tAt(api, 23, 30); if (api.s.min < fin) { api.s.min = fin; api.s.tick = 0; }
        }),
        T('duc', ['DUC', 'MAISONDUC'], function (api) { api.npc('max', '« Le duc ? Un homme exquis. Il m’a prêté de l’argent deux fois sans que je le lui demande. La troisième, c’est lui qui me l’a demandé. » Il rit. « Il habite rue du Pré, une maison où personne n’est jamais entré. Il dit qu’il n’aime pas recevoir. Moi je dis qu’il cache une femme. Ou un mari. »'); apprendre(api, 'la_pre'); }, { chip: 'Le duc' }),
        T('edgar', ['EDGAR', 'ROULEAU', 'WILLIAM'], ['« Edgar ? Un garçon triste. Il dort mal, il fume trop, et il a un frère qui vous regarde comme un hibou. Mais il a un rouleau qui vaut une fortune, paraît-il. » Il fait tourner son verre. « Vous êtes venu{e} pour l’acheter ? Vous avez donc une fortune ? »'], { chip: 'Edgar' }),
        T('retard', ['HEURE', 'ATTENDRE', 'CLUB'], ['« Ils vont arriver. Le duc est toujours en retard, c’est sa noblesse ; Edgar est toujours en retard, c’est sa santé. » Il regarde l’horloge, une fraction de seconde. « Encore un verre. »'], { chip: 'Le retard des autres' }),
        T('club', ['CLUB', 'OCCULTE', 'MAGIE'], ['« Le club de sept heures et demie ! On boit, on parle de fantômes, de tables tournantes et de l’Atlantide. C’est très amusant, quand on n’y croit pas. Le duc y croit. Edgar aussi, je crois. Moi, je crois au vin du Lavaux. »']),
        T('addition', ['ADDITION', 'ARGENT', 'DONNER'], function (api) { P.addition(api); }, { chip: 'L’addition' })
      ] }),
    guet: H.npc({ id: 'guet', name: 'Le guet de la cathédrale', short: 'Le guet', patience: 9, cooldown: 20, selfKeys: ['GUET'],
      greet: function (api, first) { api.npc('guet', first ? 'En haut de l’escalier de la tour, dans une loge de planches où ronfle un petit poêle, un vieil homme en pèlerine tient une lanterne à la main. Un cornet de cuivre pend à son cou. « Vous n’avez rien à faire là. Mais puisque vous y êtes, asseyez-vous. Les marches, ça se paie. »' : api.fresh('guetG', ['« Encore vous ? »', 'Le guet remonte la mèche de sa lanterne.', '« Asseyez-vous. »'])); },
      bye: '« Redescendez par la rampe. Il y a une marche qui ment, la quarantième. »',
      deflect: ['« Hein ? »', 'Il regarde la ville, et ne répond pas.', '« D’ici, ces questions-là, on ne les entend pas. »'],
      topics: [
        T('heures', ['HEURE', 'GUET', 'CLOCHE'], ['« Toutes les heures, de dix heures à deux heures, je fais le tour de la galerie et je crie aux quatre vents : “C’est le guet ! Il a sonné l’heure !” Six cents ans qu’on le crie. Si je m’arrêtais, je crois bien que la ville ne s’en remettrait pas. »'], { chip: 'Le guet' }),
        T('ville', ['VISITER', 'DESTINATIONS', 'QUELQUUN', 'EXAMINER'], ['« D’ici je vois tout : les amoureux, les voleurs, les médecins de nuit, le dernier tram. Je ne dis rien. Ce n’est pas mon métier, de dire. Mon métier, c’est l’heure. »']),
        T('suicides', ['SUICIDES', 'DECES', 'CORPS'], ['« Avant la guerre, on n’avait pas un pendu par an. Maintenant, c’est un par mois. Le pont Bessières, le lac, une corde au grenier. Les journaux appellent ça la mélancolie d’après-guerre. » Il crache dans le poêle. « Moi, j’appelle ça autrement. Mais je n’ai pas le mot. »'], { chip: 'Les morts de la ville' }),
        T('maison', ['MAISONDUC', 'DUC', 'LUMIERE', 'FENETRE'], function (api) { api.npc('guet', '« Il y a une maison, rue du Pré, la troisième après la fontaine. Je n’y ai jamais vu une lampe s’allumer, en vingt ans. Et pourtant quelqu’un y entre. Un gros monsieur, la nuit. Il ne fait pas de bruit, pour sa taille. » Il remonte sa pèlerine. « Les chats changent de trottoir. »'); apprendre(api, 'la_pre'); api.clue('MAISONDUC'); }, { chip: 'Les lumières de la ville' }),
        T('brouillard', ['REVE', 'LAC'], ['« Ce brouillard-là, il ne vient pas du lac. Le brouillard du lac, il sent l’eau. Celui-là ne sent rien. »']),
        T('lui', ['TOIMEME'], ['« Morel. Abel Morel. Le guet, c’était mon père avant moi, et son père avant lui. On a des voix qui portent, dans la famille. Le reste, ça porte moins. »'])
      ] }),
    chappuis: H.npc({ id: 'chappuis', name: 'Mlle Chappuis, bibliothécaire', short: 'Mlle Chappuis', patience: 8, cooldown: 30, selfKeys: ['CHAPPUIS', 'BIBLIOTHECAIRE'], lieux: ['la_musee'],
      greet: function (api, first) { api.npc('chappuis', first ? 'Une jeune femme en blouse noire, lunettes rondes, crayon derrière l’oreille, lève les yeux d’un registre de prêt. « Bibliothèque cantonale. Vous cherchez quelque chose, ou vous vous êtes perdus en venant voir les coquillages ? »' : api.fresh('chapG', ['« Vous revoilà. »', 'Mlle Chappuis repose son crayon.'])); },
      bye: '« Nous fermons à cinq heures. Pas une minute après. »',
      deflect: ['« Je ne vois pas de cote qui corresponde à ça. »', 'Elle attend, le crayon levé.', '« Un titre, un auteur, une année. Donnez-moi l’un des trois. »'],
      topics: [
        T('journaux', ['JOURNAL', 'PERIODIQUES', 'SUICIDES', 'DECES'], function (api) { api.npc('chappuis', '« La gazette est reliée par année, depuis 1798. Installez-vous à la table du fond, je vous monte les volumes. » Elle ajoute, sans lever les yeux : « Si c’est pour les morts, commencez par 1919. Tout le monde commence par 1919. »'); api.chips([{ label: 'Dépouiller la gazette', action: 'lm_journaux' }]); }, { chip: 'Les journaux' }),
        T('occulte', ['OCCULTE', 'LIVRE', 'MAGIE', 'REVE'], function (api) { api.npc('chappuis', '« Nous avons un fonds ancien. Des livres légués par des pasteurs, des médecins, des originaux. Il y en a qu’on ne demande jamais. » Elle vous regarde mieux. « Ou presque jamais. »'); api.chips([{ label: 'Chercher dans le fonds ancien', action: 'lm_occulte' }]); }, { chip: 'Les livres rares' }),
        T('lecteur', ['REGISTRE', 'DUC', 'KULTEN'], function (api) { api.npc('chappuis', api.has('KULTEN') ? '« M. des Esseintes ? Un lecteur assidu. Il emprunte ce que personne ne veut, il le garde des mois, et il le rend… abîmé. Je l’ai signalé deux fois. On m’a répondu que c’était un duc. »' : '« Je ne donne pas le nom des lecteurs, {m}. Ce serait du joli. »'); }),
        T('musee', ['MUSEEC', 'VISITER'], ['« Le palais est tout neuf, il a quinze ans. En bas, les coquillages d’eau douce de M. de Charpentier, les monnaies romaines, les urnes de la nécropole. Ici, cent vingt mille volumes. Les visiteurs vont aux coquillages. »']),
        T('lui', ['TOIMEME'], ['« Chappuis, Hélène. Licenciée de l’université. On m’a donné le fonds ancien parce que personne n’en voulait. Je commence à comprendre pourquoi. »'])
      ] }),
    rochat: H.npc({ id: 'rochat', name: 'Le commissaire Rochat', short: 'Le commissaire', patience: 6, cooldown: 60, selfKeys: ['ROCHAT', 'POLICE'], lieux: ['la_police'],
      greet: function (api, first) { api.npc('rochat', first ? 'Un homme carré, moustache poivre et sel, qui écrit à la plume avec une lenteur de notaire. « Commissaire Rochat. Asseyez-vous. Vous venez pour la conférence ? Tout le monde vient pour la conférence. »' : '« Oui ? »'); },
      bye: '« Bonsoir. »',
      deflect: ['« Venez-en au fait. »', 'Le commissaire trempe sa plume, et attend.', '« Je ne vois pas ce que la police vient faire là-dedans. »'],
      topics: [
        T('crime', ['CORPS', 'DECES', 'EDGAR', 'WILLIAM', 'MEURTRES', 'POLICE', 'BOUTIQUE'], function (api) {
          if (!api.flag('crimeVu')) { api.npc('rochat', '« Les Wellington ? Des Anglais tranquilles. S’il leur était arrivé quelque chose, je le saurais. » Il trempe sa plume. « Je le sais toujours. »'); return; }
          if (api.flag('deposition')) { api.npc('rochat', '« Votre déposition est enregistrée. Le reste est l’affaire de la police. » Il ne lève pas les yeux. « Prenez votre train. »'); return; }
          api.npc('rochat', 'Il pose sa plume. « Deux morts, rue Saint-Étienne. Et vous venez me le dire vous-même. » Il vous regarde longuement. « Racontez. Depuis le début. Et lentement : j’écris. »');
          api.check('credit_police');
        }, { chip: 'Déclarer les morts de la rue Saint-Étienne', chipCond: function (api) { return !!api.flag('crimeVu') && !api.flag('deposition'); } }),
        T('duc', ['DUC', 'MAISONDUC'], ['« M. des Esseintes est un résident honorable. Il paie ses impôts, il ne fait pas de bruit, et il donne pour les orphelins de la police. » Un temps. « Je note que vous me posez la question. »']),
        T('conference', ['CONFERENCEL', 'TURCS'], ['« Nous avons trois cents délégués, six cents journalistes, et deux douzaines de policiers étrangers qui croient que je ne les vois pas. Alors vos petites affaires, faites qu’elles restent petites. »']),
        T('lui', ['TOIMEME'], ['« Rochat, commissaire. Vingt-deux ans de maison. Je n’ai jamais tiré un coup de feu, et j’en suis fier. »'])
      ] }),
    // le Simplon-Orient du lendemain
    morand: H.npc({ id: 'morand', name: 'Morand, conducteur des Wagons-Lits', short: 'Morand', patience: 8, cooldown: 20, selfKeys: ['CONDUCTEUR'], lieux: ['tr_compartiment'],
      greet: function (api) { api.npc('morand', api.fresh('morG', ['« {M} désire ? »', 'Le conducteur s’incline, une main sur la poitrine.', '« À votre service. »'])); },
      bye: '« {M}. »',
      deflect: ['« Je regrette, {m}. »', 'Morand ne voit pas, mais il voit très bien qu’il ne voit pas.'],
      topics: [
        T('horaire', ['HEURE', 'MILAN', 'SIMPLON', 'TRAIN'], function (api) { api.npc('morand', api.flag('brigue') ? '« La neige nous a retenus à Brigue, {m}. Nous serons à Milan vers une heure, une heure et demie. Le premier service est à midi moins le quart. »' : '« Brigue, puis le tunnel du Simplon, Domodossola, et Milan vers midi et demi, si la neige le permet. Elle ne le permet pas toujours. »'); }, { chip: 'L’horaire' }),
        T('repas', ['RESTAURANT', 'MANGER', 'DINER', 'BOISSON'], ['« Le wagon-restaurant est à deux voitures, {m}. Premier service à midi moins le quart. »']),
        T('passagers', ['PASSAGERS', 'QUELQUUN', 'DUC'], ['« Des délégués qui rentrent de Lausanne, des Milanais, une famille de Bâle. » Il baisse la voix. « Et un monsieur français, en voiture 3, qui a demandé qu’on ne le réveille sous aucun prétexte. »'])
      ] }),
    maitre: H.npc({ id: 'maitre', name: 'Le maître d’hôtel', short: 'Le maître d’hôtel', patience: 6, cooldown: 20, selfKeys: ['SERVEUR'], lieux: ['tr_restaurant'],
      greet: function (api) { api.npc('maitre', api.fresh('mtrG', ['« {M} ? »', 'Le maître d’hôtel s’incline au-dessus de son carnet.'])); },
      bye: '« Bon appétit, {m}. »',
      deflect: ['« Je regrette, {m}. »'],
      topics: [
        T('menu', ['MANGER', 'DINER', 'RESTAURANT', 'BOISSON'], ['« Potage Parmentier, truite au bleu, poulet de Bresse à l’estragon, fromages, coupe de fruits. Le vin est un Dôle du Valais, {m}. »'], { chip: 'Le menu' }),
        T('chaise', ['DUC', 'QUELQUUN', 'TABLE'], function (api) { api.npc('maitre', api.flag('chaise') ? '« Je ne sais pas, {m}. Je ne sais vraiment pas. » Il compte les chaises de la voiture, à voix basse, pour la troisième fois.' : '« Une table pour vous seul{e}, {m} ? Je vous en prie. »'); })
      ] })
  };
  // un muet écrit ce qu'il a à dire (voir le moteur : npc.muet)

  // ---------------------------------------------------------------- la gazette
  function lireGazette(api) {
    if (!api.flag('gazette')) {
      api.flag('gazette', true);
      api.say('La gazette de Lausanne. En première page, la conférence : les Alliés et la délégation turque ne s’entendent toujours pas sur les Détroits, ni sur Mossoul, ni sur rien. En page trois, le prix du lait, un accident de luge à Montreux, et, en bas de colonne, une petite annonce encadrée que vous lisez deux fois.');
      api.doc('« Collectionneur anglais achète tout document, gravure ou récit concernant une statue byzantine dite de Sedefkar, et le sort de cette œuvre après 1789. Discrétion assurée. S’adresser à M. E. Wellington, 50, rue Saint-Étienne, Lausanne. »', 'La gazette · petites annonces');
      api.clue('ANNONCE'); apprendre(api, 'la_rue');
      return;
    }
    api.say(api.fresh('gazL', ['La conférence, encore : on se dispute sur Mossoul. Le franc français baisse. Rien qui vous regarde.', 'Un feuilleton, le prix du charbon, les horaires des vapeurs pour Évian. Vous repliez la gazette.']));
  }
  P.lireGazette = lireGazette;

  // ================================================================ les lieux
  function lookAct(id, texts) { return { id: id, label: 'Regarder autour de vous', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE'], bare: true, run: function (api) { api.say(api.fresh(id, typeof texts === 'function' ? texts(api) : texts)); } }; }
  P.locations = {
    la_gare: { name: 'La gare de Lausanne', art: 'la_gare',
      enter: function (api, first) { if (!first) api.say(api.fresh('gareR', ['La gare, sa marquise, ses quais en contrebas, le lac qu’on devine derrière les voies.', 'La gare. Des porteurs, des fiacres, un vapeur qui siffle quelque part en bas, à Ouchy.'])); },
      things: [{ label: 'Jean-Claude, le porteur', ids: ['JEANCLAUDE', 'QUELQUUN'] }, { label: 'le buffet', ids: ['BOISSON', 'JOURNAL', 'TABLE'] }, { label: null, ids: ['SALLE', 'TRAIN', 'GARELS', 'BAGAGES'] }],
      ambient: ['Un porteur crie « Attention ! » en poussant un diable chargé de malles.', 'Une locomotive souffle sa vapeur sur le quai, et le brouillard l’avale.', 'Une cloche annonce un omnibus pour Genève.'],
      actions: [
        lookAct('lg_look', ['Une gare en pente, comme tout le reste : les voies en bas, la ville en haut, et entre les deux une marquise de fer où le brouillard s’accroche. Des voyageurs à fourrures, des délégués à serviettes, deux gendarmes vaudois en képi qui regardent tout le monde.', 'Sur le quai, un monsieur en pardessus lit le même journal depuis votre arrivée. Il ne tourne jamais la page.']),
        { id: 'lg_jc', label: 'Parler au porteur', ideaAnon: 'Parler au porteur', idea: true, talkTo: 'jeanclaude', verbs: ['PARLER', 'VISITER', 'POLI', 'DONNER', 'COMMANDER'], nouns: ['JEANCLAUDE', 'QUELQUUN'],
          cond: function (api) { var h = hour(api.s.min); return h >= 5 && h < 12; },
          extra: ['HOTEL', 'BOUTIQUE', 'EDGAR', 'DESTINATIONS', 'TAXI', 'CONFERENCEL', 'GUET', 'TRAIN', 'SIMPLON'], run: function (api, p) { api.talk('jeanclaude', p); } },
        { id: 'lg_cafe', label: 'Prendre un café au buffet', idea: true, ideaCond: function (api) { return !api.flag('cafeGare'); }, verbs: ['BOIRE', 'MANGER', 'COMMANDER', 'ASSEOIR'], nouns: ['BOISSON', 'TABLE', 'JOURNAL'], bare: true, repeatable: true, time: 25,
          run: function (api) {
            if (!api.flag('cafeGare')) { api.flag('cafeGare', true); api.pay(0.05); api.say('Le buffet de la gare : des banquettes de cuir, un poêle de faïence, une serveuse en coiffe qui apporte sans qu’on lui demande des croissants, du café, et un lait chaud saupoudré de chocolat. Dehors, le soleil essaie de percer le brouillard et n’y arrive pas. Vous vous sentez, d’un coup, très loin de chez vous, et très seul{e}.'); lireGazette(api); return; }
            api.say(api.fresh('cafeGR', ['Un autre café. La serveuse vous reconnaît, et vous apporte la gazette.', 'Vous vous réchauffez au poêle de faïence.']));
          } },
        { id: 'lg_hotel', label: 'Prendre un fiacre pour l’hôtel', idea: true, ideaCond: function (api) { return !api.s.visited.la_hotel; }, verbs: ['ALLER', 'PRENDRE', 'COMMANDER'], nouns: ['TAXI', 'HOTEL'], bare: true,
          run: function (api) { api.say('Jean-Claude charge vos bagages sur un fiacre, refuse d’abord votre pourboire, puis l’accepte. Le cheval monte au pas l’avenue en pente ; les maisons sortent du brouillard une à une, comme des pièces qu’on développe.'); api.pay(0.05); api.time(12); api.go('la_hotel'); } },
        { id: 'lg_train', label: 'Monter dans le Simplon-Orient', idea: true, ideaCond: function (api) { return P.trainPossible(api); }, verbs: ['PRENDRE', 'ALLER'], nouns: ['TRAIN', 'SIMPLON', 'MILAN', 'VOYAGE'], needVerb: true, repeatable: true,
          run: function (api) { P.monter(api); } }
      ] },
    la_hotel: { name: 'L’hôtel des Alpes', art: 'la_hotel',
      enter: function (api, first) {
        if (first) { api.say('L’hôtel des Alpes : quatre étages de pierre jaune, un hall à palmiers en pot où trois messieurs lisent le même journal, et un ascenseur hydraulique qui monte en soupirant. Votre chambre donne, paraît-il, sur le lac. Ce matin, elle donne sur du lait.'); return; }
        api.say(api.fresh('hotR', ['Le hall de l’hôtel des Alpes, ses palmiers en pot, ses lecteurs de journaux.', 'Votre chambre, la vingt-trois. Le lit est fait, la fenêtre embuée.', 'M. Burnier vous tend votre clé avant que vous l’ayez demandée.']));
      },
      things: [{ label: 'M. Burnier, à la réception', ids: ['BURNIER', 'RECEPTION', 'QUELQUUN'] }, { label: 'la gazette', ids: ['JOURNAL'] }, { label: 'la fenêtre', ids: ['FENETRE', 'LAC'] }, { label: null, ids: ['SALLE', 'CHAMBRE', 'LAMPE', 'PORTE', 'TABLE', 'HOTEL'] }],
      ambient: ['L’ascenseur soupire dans sa cage.', 'Un délégué demande son courrier en trois langues.', 'Quelque part, une femme de chambre chante en dialecte.'],
      actions: [
        lookAct('lh_look', ['Une chambre propre comme une conscience suisse : un lit haut, un édredon, un lavabo à robinets de cuivre, un tableau du Cervin. Sur la table, votre carnet. ' , 'Le hall : des palmiers, des fauteuils de rotin, des messieurs qui ne lisent pas leur journal.']),
        { id: 'lh_burnier', label: 'Parler à M. Burnier', ideaAnon: 'Parler au réceptionnaire', idea: true, talkTo: 'burnier', verbs: ['PARLER', 'VISITER', 'POLI', 'DONNER', 'COMMANDER'], nouns: ['BURNIER', 'RECEPTION', 'QUELQUUN'],
          extra: ['CHAMBRE', 'CONFERENCEL', 'EDGAR', 'BOUTIQUE', 'DUC', 'DESTINATIONS', 'TAXI', 'JOURNAL'], run: function (api, p) { api.talk('burnier', p); } },
        { id: 'lh_gazette', label: 'Lire la gazette', idea: true, ideaCond: function (api) { return !api.flag('gazette'); }, verbs: ['EXAMINER', 'PRENDRE', 'LIREL'], nouns: ['JOURNAL'], repeatable: true, time: 15, run: function (api) { lireGazette(api); } },
        { id: 'lh_fenetre', label: 'Regarder par la fenêtre', verbs: ['EXAMINER', 'OUVRIR'], nouns: ['FENETRE', 'LAC'],
          run: function (api) { var h = hour(api.s.min); api.say(h >= 15 && h < 17 && !api.flag('meurtre') ? 'Le brouillard s’est déchiré. En bas, le Léman, immense, couleur d’étain, et de l’autre côté, les montagnes de Savoie, si nettes qu’on croirait pouvoir les toucher.' : nuit(api) ? (pluie(api) ? 'La pluie raye la vitre. En bas, rien : le lac, la nuit, le noir.' : 'La nuit. Des lumières qui descendent vers le lac et s’y arrêtent. Au-delà, rien.') : 'Du brouillard, blanc, épais. Une mouette passe, et disparaît dedans.'); } },
        { id: 'lh_dormir', label: 'Dormir', idea: true, ideaCond: function (api) { var h = hour(api.s.min); return h >= 22 || h < 5 || (!api.flag('dormiMatin') && h < 9); }, verbs: ['DORMIR', 'ATTENDRE'], nouns: ['CHAMBRE', 'HEURE'], bare: true, repeatable: true,
          run: function (api) { P.dormir(api); } },
        { id: 'lh_attendre', label: 'Attendre le soir', verbs: ['ATTENDRE'], nouns: ['HEURE'], repeatable: true,
          run: function (api) { var h = hour(api.s.min); if (h >= 17) { api.say('Le soir est là.'); return; } api.say(api.fresh('attSoir', ['Vous écrivez des lettres que vous n’enverrez pas, vous relisez votre carnet, vous regardez le brouillard. Le jour baisse.', 'Une sieste sans sommeil, la gazette, le thé de quatre heures dans le hall. Puis le soir.'])); api.s.min = day(api.s.min) * D + 17 * 60 + 15; api.s.tick = 0; } }
      ] },
    // la cour du 50, rue Saint-Étienne : la vitrine, la porte, la sonnette
    la_rue: { name: 'Rue Saint-Étienne, au numéro 50', art: 'la_rue',
      enter: function (api, first) {
        if (first) api.say('Le numéro 50 est au fond d’une petite cour pavée, un peu en retrait de la rue, un coin tranquille dans une ville tranquille. Une enseigne délavée : « WELLINGTON FILS · TAXIDERMIE ». La vitrine est obscure, sans rien d’exposé ; de lourds rideaux cramoisis empêchent de voir l’intérieur, et un rideau pareil voile la porte. Un petit écriteau, en quatre langues, dit que la boutique est ouverte. La porte est fermée à clé.');
        P.etatRue(api);
      },
      things: [{ label: 'la porte de la boutique', ids: ['PORTE', 'BOUTIQUE'] }, { label: 'la vitrine', ids: ['FENETRE'] }, { label: null, ids: ['SALLE', 'EDGAR', 'WILLIAM'] }],
      ambient: ['Une fenêtre se ferme, quelque part au-dessus de la cour.', 'La cloche de la cathédrale sonne, toute proche.', 'Un chat traverse la cour sans se presser.'],
      actions: [
        lookAct('lr_look', function (api) { return api.flag('meurtre') && !api.flag('crimeVu') ? ['La cour est noire. Le bec de gaz du coin grésille et s’éteint à moitié. La porte de la boutique est entrouverte ; le rideau rouge bouge à peine, dans le courant d’air.'] : ['Des pavés usés, un puits condamné, des pots de géraniums morts. La vitrine aux rideaux rouges vous renvoie votre reflet, un peu déformé.', 'L’enseigne grince. Au-dessus, la fenêtre de l’étage a ses volets mi-clos.']; }),
        { id: 'lr_sonner', label: 'Sonner à la boutique', idea: true, ideaCond: function (api) { return !api.flag('crimeVu') && !(api.flag('meurtre') && !api.flag('sauveW')); }, verbs: ['SONNER', 'FRAPPER', 'VISITER', 'OUVRIR', 'PARLER'], nouns: ['PORTE', 'BOUTIQUE', 'EDGAR', 'WILLIAM', 'QUELQUUN'], bare: true, repeatable: true,
          run: function (api) { P.sonner(api); } },
        { id: 'lr_entrer', label: 'Entrer dans la boutique', verbs: ['ALLER', 'OUVRIR', 'VISITER'], nouns: ['PORTE', 'BOUTIQUE'], needVerb: true, repeatable: true,
          cond: function (api) { return (api.flag('ducEntre') && !api.flag('temoin') && !api.flag('crimeVu')) || api.flag('portesOuvertes'); },
          run: function (api) { P.entrerApres(api); } },
        { id: 'lr_guetter', label: 'Guetter la cour', verbs: ['ATTENDRE', 'SUIVRE', 'CACHER'], nouns: ['PORTE', 'BOUTIQUE', 'QUELQUUN'], needVerb: true, repeatable: true,
          run: function (api) { P.guetterRue(api); } },
        { id: 'lr_vitrine', label: 'Regarder par la vitrine', verbs: ['EXAMINER'], nouns: ['FENETRE', 'BOUTIQUE'],
          run: function (api) { api.say('Les rideaux sont bien tirés. Par une fente, vous devinez une lueur rouge, celle d’un feu, et des formes immobiles : des bêtes dressées, des ailes ouvertes, une tête de cerf. Une des formes, plus petite, est assise. Elle ne bouge pas non plus.'); } }
      ] },
    la_boutique: { name: 'Wellington Fils, Taxidermie', art: 'la_boutique',
      enter: function (api, first) {
        if (typeof api.flag('entreBoutique') !== 'number') api.flag('entreBoutique', api.s.min);
        if (crime(api) && !api.flag('sauveW') && !api.flag('crimeVu')) {
          api.say('À l’intérieur, tout est noir. Les griffes des bêtes empaillées accrochent les manteaux ; leurs yeux de verre luisent dans la lueur qui vient de la rue. Une odeur de lavande sèche, de fourrure humide, de formol. Et, dessous, une autre odeur, plus fraîche, que vous connaissez.');
          if (!api.flag('lumiere')) api.chips([{ label: 'Chercher l’interrupteur', action: 'lb_lumiere' }, { label: 'Refermer la porte de la rue', action: 'lb_fermer' }]);
          return;
        }
        if (first) api.say('Vous entrez dans un autre monde. Un feu d’enfer ronfle dans la cheminée et l’air est si chaud qu’on y suffoque. Des bêtes de toutes sortes posent en tableaux absurdes : un renard qui courtise une poule, une chouette en robe de baptême, un ours brun dressé au pied de l’escalier, les pattes levées comme pour une bénédiction. De grands vases débordent de lavande séchée et de fleurs odorantes ; sous leur parfum, d’autres odeurs : chair qui se défait, fourrure humide, formol.');
        else api.say(api.fresh('lbR', ['La boutique, son feu, ses bêtes immobiles.', 'L’ours de l’escalier vous bénit au passage.']));
      },
      things: [{ label: 'l’ours de l’escalier', ids: ['OURS'] }, { label: 'les bêtes empaillées', ids: ['BOUTIQUE', 'TAXIDERMIE'] }, { label: 'l’escalier', ids: ['ESCALIER', 'ETAGE'] }, { label: 'l’atelier, au fond', ids: ['ATELIER'] }, { label: null, ids: ['SALLE', 'PORTE', 'LAMPE', 'FENETRE', 'LUMIERESW', 'WILLIAM'] }],
      ambient: ['Le feu craque. Une bûche s’effondre.', 'Une des bêtes semble avoir bougé. Aucune n’a bougé.', 'Quelque part, une horloge compte.'],
      actions: [
        lookAct('lb_look', function (api) { return crime(api) && !api.flag('sauveW') ? ['Les bêtes, figées dans leurs poses absurdes. L’ours de l’escalier, les pattes levées. Personne. Le feu est mort ; il fait froid, maintenant.'] : ['Une marmotte sous globe, une hermine en manteau d’hermine, un chat qui tient une souris qui tient un fromage. Tout est très bien fait, et rien n’est tout à fait drôle.', 'L’ours brun, au pied de l’escalier, vous dépasse d’une tête. Ses coutures, sur la poitrine, sont invisibles. C’est du beau travail.']; }),
        { id: 'lb_monter', label: 'Monter à l’étage', idea: true, verbs: ['ALLER', 'VISITER'], nouns: ['ESCALIER', 'ETAGE', 'CHAMBRE', 'CUISINE'], bare: true, repeatable: true,
          run: function (api) { if (crime(api) && !api.flag('sauveW') && !api.flag('lumiere')) { api.say('Dans le noir complet, vous cherchez la rampe. Une patte de bête vous effleure la joue.'); api.check('chance_lumiere'); return; } api.say(api.fresh('monter', ['L’escalier étroit grince sous vos pas.', 'Vous montez. Les marches gémissent, chacune à sa façon.'])); api.go('la_etage'); } },
        { id: 'lb_lumiere', label: 'Chercher l’interrupteur', verbs: ['FOUILLER', 'ALLUMER', 'UTILISER'], nouns: ['LUMIERESW', 'LAMPE'], repeatable: true,
          cond: function (api) { return crime(api) && !api.flag('lumiere'); }, run: function (api) { api.check('chance_lumiere'); } },
        { id: 'lb_fermer', label: 'Refermer la porte de la rue', verbs: ['FERMER'], nouns: ['PORTE'], bare: true,
          cond: function (api) { return crime(api) && !api.flag('porteFermee') && !api.flag('crimeDeclare'); },
          run: function (api) { api.flag('porteFermee', true); api.say('Vous repoussez la porte, doucement, jusqu’au déclic. Le rideau rouge retombe. Plus personne, dans la rue, ne peut voir qu’elle était ouverte.'); } },
        { id: 'lb_ours', label: 'Examiner l’ours', verbs: ['EXAMINER', 'FOUILLER', 'OUVRIR'], nouns: ['OURS'],
          run: function (api) { api.say('Un ours brun des Alpes, dressé, la gueule entrouverte sur des dents jaunes. Le travail est parfait : on ne voit aucune couture, nulle part. William, si c’est lui qui l’a fait, a des mains d’horloger. Vous tâtez le ventre : du crin, serré, rien d’autre.'); } },
        { id: 'lb_atelier', label: 'Aller dans l’atelier du fond', verbs: ['ALLER', 'EXAMINER', 'VISITER'], nouns: ['ATELIER'],
          run: function (api) { api.say('Une pièce sans fenêtre, carrelée de blanc, des crochets au plafond, des bocaux d’yeux de verre classés par couleur. Sur l’établi, un petit chevreuil à demi écorché, les pattes liées. ' + (crime(api) && !api.flag('sauveW') ? 'Il a été abandonné en plein travail. ' : '') + 'Une porte basse donne sur l’arrière-cour et une ruelle.'); } },
        { id: 'lb_sortir', label: 'Ressortir dans la cour', verbs: ['ALLER', 'SORTIR'], nouns: ['PORTE'], bare: true, repeatable: true,
          run: function (api) { api.say('Vous ressortez dans la cour.'); api.go('la_rue', true); } }
      ] },
    la_etage: { name: 'L’étage des Wellington', art: 'la_etage',
      enter: function (api, first) {
        if (crime(api) && !api.flag('sauveW') && !api.flag('crimeVu')) { P.decouverte(api); return; }
        if (first) api.say('L’étage est petit, propre, sans grâce : un salon où l’on prend le thé sous un portrait de la reine Victoria, une cuisine, la chambre d’Edgar, celle de William. Les fenêtres donnent sur la cour, et le brouillard s’y colle.');
      },
      things: [{ label: 'le salon', ids: ['SALLE', 'THE'] }, { label: 'la cuisine', ids: ['CUISINE'] }, { label: 'la chambre d’Edgar', ids: ['CHAMBRE', 'LIT'] }, { label: null, ids: ['PORTE', 'LAMPE', 'FENETRE', 'TABLE', 'EDGAR', 'WILLIAM', 'CORPS', 'FIOLE', 'SERINGUE', 'JOURNALE', 'RECU', 'FAUX'] }],
      ambient: ['La pluie, ou le vent, contre les vitres.', 'Le plancher craque sous un poids qui n’est pas le vôtre. Ce n’est que le plancher.', 'L’horloge du salon s’est arrêtée.'],
      actions: [
        lookAct('le_look', function (api) { return crime(api) && !api.flag('sauveW') ? ['Le salon, la théière froide sur la table, deux tasses. La cuisine. La chambre. Vous évitez de regarder les portes ouvertes plus longtemps qu’il ne faut.'] : ['Le salon : des fauteuils de cretonne, une théière sous un couvre-théière tricoté, un portrait de la vieille reine. Sur une étagère, un hibou qui n’a pas l’air de croire à ce qu’il voit.']; }),
        { id: 'le_edgar', label: 'Parler à Edgar', idea: true, talkTo: 'edgar', verbs: ['PARLER', 'POLI', 'DONNER', 'PERSUADER', 'COMMANDER'], nouns: ['EDGAR', 'QUELQUUN'],
          cond: function (api) { return P.edgarLa(api); },
          extra: ['ROULEAU', 'ROULEAUX', 'SIMULACRE', 'PRIX', 'WILLIAM', 'GUERRE', 'DUC', 'CLUB', 'FENALIK', 'BRAS', 'LETTRE'], run: function (api, p) { api.talk('edgar', p); } },
        { id: 'le_william', label: 'S’adresser à William', idea: true, talkTo: 'william', verbs: ['PARLER', 'POLI', 'EXAMINER', 'DONNER'], nouns: ['WILLIAM'],
          cond: function (api) { return P.williamLa(api); },
          extra: ['OURS', 'DUC', 'EDGAR', 'GUERRE', 'PLAQUES', 'NOTE'], run: function (api, p) { api.talk('william', p); } },
        { id: 'le_cuisine', label: 'Entrer dans la cuisine', idea: true, ideaCond: function (api) { return crime(api) && !api.flag('sauveW') && !api.flag('williamVu'); }, verbs: ['ALLER', 'EXAMINER', 'FOUILLER', 'VISITER'], nouns: ['CUISINE', 'WILLIAM', 'CORPS'],
          cond: function (api) { return crime(api) && !api.flag('sauveW'); },
          run: function (api) { P.cuisine(api); } },
        { id: 'le_chambre', label: 'Entrer dans la chambre d’Edgar', idea: true, ideaCond: function (api) { return crime(api) && !api.flag('sauveE') && !api.flag('edgarVuMort'); }, verbs: ['ALLER', 'EXAMINER', 'VISITER'], nouns: ['CHAMBRE', 'EDGAR', 'LIT'],
          cond: function (api) { return crime(api) && !api.flag('sauveE'); },
          run: function (api) { P.chambre(api); } },
        { id: 'le_corps', label: 'Examiner le corps d’Edgar', idea: true, ideaCond: function (api) { return !!api.flag('edgarVuMort') && !api.flag('corpsVu'); }, verbs: ['EXAMINER', 'FOUILLER', 'SOIGNER'], nouns: ['CORPS', 'EDGAR', 'SERINGUE'],
          cond: function (api) { return !!api.flag('edgarVuMort') && !api.flag('sauveE'); },
          run: function (api) { if (api.flag('corpsVu')) { api.say(api.has('PIQURES') ? 'La piqûre du bras droit. Vous l’avez vue. Vous la verrez encore longtemps.' : 'Vous l’avez examiné. Vous n’en tirerez rien de plus.'); return; } if (api.skill('Médecine') >= 30) api.check('med_corps'); else api.check('med_corps', { diff: 'difficile' }); } },
        { id: 'le_fouiller', label: 'Fouiller la chambre d’Edgar', idea: true, ideaCond: function (api) { return !!api.flag('edgarVuMort') && !api.item(FIOLE); }, verbs: ['FOUILLER', 'PRENDRE', 'EXAMINER'], nouns: ['CHAMBRE', 'FIOLE', 'SERINGUE', 'JOURNALE', 'RECU', 'TABLE', 'LIVRE'], repeatable: true,
          cond: function (api) { return !!api.flag('edgarVuMort'); },
          run: function (api) { P.fouillerChambre(api); } },
        { id: 'le_souslit', label: 'Regarder sous le lit', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['LIT', 'FAUX'], repeatable: true,
          cond: function (api) { return !!api.flag('edgarVuMort') && !api.flag('fauxTrouve'); },
          run: function (api) { if ((api.flag('sousLit') || 0) >= 2) { trouverFaux(api); return; } api.check('toc_faux'); } },
        { id: 'le_journal', label: 'Lire le journal d’Edgar', idea: true, ideaCond: function (api) { return api.item(JOURNAL) && !api.has('JOURNALE'); }, verbs: ['LIREL', 'EXAMINER', 'UTILISER'], nouns: ['JOURNALE', 'JOURNAL', 'LIVRE', 'NOTE'], repeatable: true,
          cond: function (api) { return api.item(JOURNAL); }, run: function (api) { P.lireJournal(api); } },
        { id: 'le_soigner_w', label: 'Soigner William', verbs: ['SOIGNER', 'UTILISER', 'AIDER'], nouns: ['WILLIAM', 'CORPS', 'DOCTEUR'],
          cond: function (api) { return !!api.flag('interrompu') && !api.flag('williamTente'); },
          run: function (api) { if (api.skill('Médecine') > api.skill('Premiers soins')) api.check('med_william'); else api.check('pso_william', { diff: api.flag('edgarTente') ? 'difficile' : 'normal' }); } },
        { id: 'le_soigner_e', label: 'Secourir Edgar', verbs: ['SOIGNER', 'UTILISER', 'AIDER', 'REVEILLER'], nouns: ['EDGAR', 'CORPS', 'DOCTEUR'],
          cond: function (api) { return !!api.flag('interrompu') && !api.flag('edgarTente'); },
          run: function (api) { api.check('med_edgar', { diff: api.skill('Médecine') >= 40 ? 'normal' : 'difficile' }); if (!api.s.pending) finInterruption(api); } },
        { id: 'le_attendre', label: 'Attendre qu’Edgar se réveille', idea: true, ideaCond: function (api) { return !!api.flag('edgarSauve') && !api.flag('edgarParle'); }, verbs: ['ATTENDRE', 'REVEILLER'], nouns: ['EDGAR', 'HEURE'], repeatable: true,
          cond: function (api) { return !!api.flag('edgarSauve') && !api.flag('edgarParle'); },
          run: function (api) { var t = api.flag('reveilEdgar'); api.say('Vous restez au chevet d’Edgar. William vous apporte du thé, puis une couverture, puis s’assied dans le couloir, le couteau à dépecer sur les genoux. Il ne dort pas. Vous non plus.'); if (api.s.min < t) { api.s.min = t; api.s.tick = 0; } reveilEdgar(api); } },
        { id: 'le_descendre', label: 'Redescendre', verbs: ['ALLER', 'DESCENDRE', 'SORTIR'], nouns: ['ESCALIER', 'PORTE', 'BOUTIQUE'], bare: true, repeatable: true,
          run: function (api) { api.say('Vous redescendez dans la boutique.'); api.go('la_boutique', true); } }
      ] },
    la_cathedrale: { name: 'La cathédrale', art: 'la_cathedrale',
      enter: function (api, first) {
        var h = hour(api.s.min);
        if (h >= 18 || h < 8) { api.say(api.fresh('cathNuit', ['La cathédrale est fermée, noire, énorme. Sur la terrasse, on domine toute la ville éteinte, et le lac qu’on ne voit pas. En haut de la tour, une lanterne bouge.', 'Le parvis désert. Les portes sont closes. Tout en haut, dans la tour, une petite lumière fait le tour de la galerie.'])); return; }
        if (first && !api.flag('visite')) api.say('Cent soixante marches couvertes, et la Cité, en haut de sa colline. La cathédrale est grise, haute, posée là comme un navire échoué. Dedans, une nef immense, vingt mètres sous les voûtes, des vitraux qui ne laissent passer qu’une lumière de cave. Il fait plus froid que dehors.');
        else if (!api.flag('visite')) api.say(api.fresh('cathR', ['La nef, ses piliers, son froid de cave.', 'La cathédrale. Une vieille femme prie au premier rang, sans bouger.']));
      },
      things: [{ label: 'le chevalier sans mains', ids: ['GISANT'] }, { label: 'la crypte', ids: ['CRYPTE'] }, { label: 'la tour du guet', ids: ['GUET', 'TOUR', 'LAMPE'] }, { label: null, ids: ['SALLE', 'CATHEDRALE', 'PORTE', 'FENETRE', 'DUC'] }],
      ambient: ['Un pas résonne sous les voûtes, et s’éteint.', 'Le vent siffle dans la tour.', 'Une cloche sonne, si près que vous la sentez dans la poitrine.'],
      actions: [
        lookAct('lc_look', ['Des chapiteaux où des monstres avalent des hommes, une rose de vitrail en forme de monde, des dalles usées par six siècles de genoux. Dans un bas-côté, un tombeau, et un chevalier couché dessus.', 'La nef est si haute que la lumière n’arrive pas jusqu’au sol. On marche dans le noir, avec la lumière au-dessus de soi, comme au fond d’un lac.']),
        { id: 'lc_gisant', label: 'Regarder le chevalier sans mains', idea: true, ideaCond: function (api) { return !api.has('GISANT'); }, verbs: ['EXAMINER', 'CONTEMPLER', 'VISITER'], nouns: ['GISANT'],
          cond: function (api) { var h = hour(api.s.min); return h >= 8 && h < 18; },
          run: function (api) { api.say('Un chevalier de pierre, couché sur son tombeau, les pieds sur un lion, l’épée le long du corps. Ses avant-bras s’arrêtent net aux poignets, comme coupés à la hache, et la pierre, à cet endroit, est plus claire. Un sacristain qui passe vous dit qu’il fut tué en duel judiciaire, à la fin du quatorzième siècle, et que Dieu lui avait donné tort. Alors on lui a ôté les mains.'); api.clue('GISANT'); } },
        { id: 'lc_crypte', label: 'Descendre voir la crypte', idea: true, ideaCond: function (api) { return !api.flag('crypte'); }, verbs: ['DESCENDRE', 'VISITER', 'EXAMINER', 'ALLER'], nouns: ['CRYPTE'],
          cond: function (api) { var h = hour(api.s.min); return h >= 8 && h < 18; },
          run: function (api) { api.flag('crypte', true); api.time(20); api.say('Un sacristain vous ouvre la crypte contre quelques centimes et vous prête une lanterne. Des voûtes basses, des tombes sans nom, des murs qui suintent. Les pierres du fond ne ressemblent pas à celles d’en haut.'); api.check('edu_crypte'); } },
        { id: 'lc_guet', label: 'Monter voir le guet', idea: true, ideaCond: function (api) { return guetCrie(api) && !api.npcs('guet').met; }, verbs: ['ALLER', 'VISITER', 'PARLER'], nouns: ['GUET', 'TOUR'], talkTo: 'guet',
          cond: function (api) { var h = hour(api.s.min); return h >= 21 || h < 2; },
          extra: ['HEURE', 'SUICIDES', 'MAISONDUC', 'DUC', 'LUMIERE', 'TOIMEME'],
          run: function (api, p) { if (!api.npcs('guet').met) { api.say('La petite porte de la tour n’est pas fermée. Deux cent trente marches de pierre, en colimaçon, dans le noir. Vous comptez jusqu’à cent, puis vous arrêtez de compter. En haut, le vent, la nuit, la ville entière à vos pieds, et une lanterne.'); api.time(10); } api.talk('guet', p); } },
        { id: 'lc_prier', label: 'S’asseoir dans la nef', verbs: ['PRIER', 'ASSEOIR', 'ATTENDRE'], nouns: ['CATHEDRALE', 'SALLE'], bare: true,
          cond: function (api) { var h = hour(api.s.min); return h >= 8 && h < 18; },
          run: function (api) { api.time(20); api.say('Vous vous asseyez au fond. Le silence de la nef a une épaisseur. Pendant quelques minutes, vous n’entendez que votre souffle, et vous êtes presque en paix.'); if (api.once('nefPaix') && api.sanState() >= 1) api.gain(1); } }
      ] },
    la_musee: { name: 'Le palais de Rumine : musée et bibliothèque', art: 'la_musee',
      enter: function (api, first) { if (!api.flag('visite')) api.say(first ? 'Un palais florentin tout neuf, posé sur la place de la Riponne comme un gâteau sur un plat. En bas, les collections : coquillages d’eau douce, monnaies romaines, urnes. En haut, la bibliothèque cantonale, ses lampes vertes, ses lecteurs studieux. L’ordre y est parfait, et le silence aussi.' : api.fresh('musR', ['La bibliothèque cantonale, ses lampes vertes.', 'Le palais de Rumine. Mlle Chappuis lève les yeux de son registre.'])); },
      things: [{ label: 'Mlle Chappuis, la bibliothécaire', ids: ['CHAPPUIS', 'BIBLIOTHECAIRE', 'QUELQUUN'] }, { label: 'les gazettes reliées', ids: ['JOURNAL', 'PERIODIQUES', 'SUICIDES'] }, { label: 'le fonds ancien', ids: ['OCCULTE', 'LIVRE'] }, { label: null, ids: ['SALLE', 'MUSEEC', 'TABLE', 'LAMPE', 'REGISTRE'] }],
      ambient: ['Une page qu’on tourne, quelque part.', 'Un gardien traverse la salle des coquillages, les mains dans le dos.', 'La pluie de midi tambourine sur la verrière.'],
      actions: [
        lookAct('lm_look', ['Des vitrines de coquillages étiquetés à l’encre violette, des monnaies d’empereurs dont on a oublié les visages, une urne qui contenait quelqu’un. En haut, sous les lampes vertes, des étudiants et des pasteurs.', 'Tout est rangé. On a envie de parler bas, puis de ne plus parler du tout.']),
        { id: 'lm_chappuis', label: 'Parler à la bibliothécaire', idea: true, talkTo: 'chappuis', verbs: ['PARLER', 'VISITER', 'POLI', 'PERSUADER', 'COMMANDER'], nouns: ['CHAPPUIS', 'BIBLIOTHECAIRE', 'QUELQUUN'],
          extra: ['JOURNAL', 'SUICIDES', 'OCCULTE', 'LIVRE', 'DUC', 'MUSEEC'], run: function (api, p) { api.talk('chappuis', p); } },
        { id: 'lm_journaux', label: 'Dépouiller la gazette', idea: true, ideaCond: function (api) { return !api.has('SUICIDES') && (api.npcs('chappuis').met || api.flag('guetVu')); }, verbs: ['FOUILLER', 'EXAMINER', 'LIREL'], nouns: ['JOURNAL', 'PERIODIQUES', 'SUICIDES'], repeatable: true,
          run: function (api) { if (api.has('SUICIDES')) { api.say('Vous avez compté. Un par mois. Vous n’avez pas envie de recompter.'); return; } api.say('Mlle Chappuis vous monte les gazettes reliées par année, lourdes comme des pierres tombales.'); etudeL(api, 90); api.check('biblio_journaux', { diff: api.skill('Langue (français)') >= 50 ? 'normal' : 'difficile' }); } },
        { id: 'lm_occulte', label: 'Chercher dans le fonds ancien', idea: true, ideaCond: function (api) { return !api.has('KULTEN') && api.npcs('chappuis').met; }, verbs: ['FOUILLER', 'EXAMINER'], nouns: ['OCCULTE', 'LIVRE', 'MAGIE'], repeatable: true,
          run: function (api) { if (api.has('KULTEN')) { api.say('Le livre allemand est retourné dans son rayon fermé à clé. Vous n’avez aucune envie de le rouvrir.'); return; } api.say(api.fresh('occRech', ['Des rayonnages qui sentent la colle et la souris, des reliures de veau, des titres latins.', 'Vous reprenez le fonds ancien là où vous l’aviez laissé.'])); etudeL(api, 90); api.check('biblio_occulte'); } }
      ] },
    la_signal: { name: 'Le belvédère du Signal', art: 'la_signal',
      enter: function (api, first) { if (!api.flag('visite')) api.say(nuit(api) ? 'Le belvédère, dans le noir. En bas, les lumières de la ville descendent vers un lac qu’on ne voit pas. Le vent monte des bois.' : hour(api.s.min) >= 14 && hour(api.s.min) < 17 && !api.flag('meurtre') ? 'Le brouillard s’est levé. Tout le Léman, en contrebas, couleur d’étain ; la Savoie en face ; et au fond, vers le sud-est, les grandes Alpes, blanches de neige fraîche.' : 'Le belvédère, et du blanc. Le brouillard monte jusqu’ici. On devine des arbres, un banc, une table d’orientation qui oriente vers rien.'); },
      things: [{ label: 'la vue', ids: ['SIGNAL', 'LAC', 'FENETRE'] }, { label: null, ids: ['SALLE', 'TABLE'] }],
      ambient: ['Le vent dans les sapins de Sauvabelin.', 'Une corneille crie, plus bas.'],
      actions: [
        lookAct('ls_look', ['La table d’orientation : des flèches de bronze vers des sommets aux noms de saints et de bêtes. Une pointe, plus longue, vers le sud-est : le Simplon, l’Italie.', 'Un banc, des initiales gravées, une date de 1919 et une croix. Vous ne vous asseyez pas.'])
      ] },
    la_chatnoir: { name: 'Le café du Chat Noir', art: 'la_chatnoir',
      enter: function (api, first) {
        if (!api.flag('visite') || first === false) {
          if (first && api.flag('visite') === 0 && !api.flag('visiteFinie')) api.say('Un grand café à la française, glaces, banquettes de moleskine, garçons en long tablier, qui donne sur une petite place en pente. Il sent le vin chaud et le tabac.');
          else if (!api.flag('visiteFinie') || api.s.visited.la_chatnoir > 1) api.say(api.fresh('cnR', ['Le Chat Noir, ses glaces, sa fumée, son brouhaha.', 'Le garçon vous reconnaît et vous montre une table, près de la vitre.']));
        }
        P.maxArrive(api);
      },
      things: [{ label: 'les garçons de café', ids: ['SERVEUR', 'BOISSON', 'TABLE'] }, { label: null, ids: ['SALLE', 'PORTE', 'FENETRE', 'LAMPE', 'MAX', 'CLUB'] }],
      ambient: ['Un garçon crie une commande vers les cuisines.', 'Des délégués, à la table voisine, parlent du pétrole de Mossoul à voix basse.', 'Un accordéon, de l’autre côté de la place.'],
      actions: [
        lookAct('cn_look', ['Des glaces piquées, des banquettes rouges, des journaux sur des baguettes de bois. Des étudiants, des délégués, deux dames à chapeaux qui partagent une tarte. Et, au fond, une table ronde marquée « réservé ».', 'La pendule au-dessus du comptoir a dix minutes d’avance, comme toutes les pendules de café.']),
        { id: 'cn_diner', label: 'Dîner', idea: true, ideaCond: function (api) { var h = hour(api.s.min); return h >= 18 && !api.flag('dineCN'); }, verbs: ['MANGER', 'COMMANDER', 'DINER', 'ASSEOIR'], nouns: ['DINER', 'TABLE', 'BOISSON'], bare: true, repeatable: true, time: 45,
          run: function (api) { if (api.flag('dineCN')) { api.say('Vous avez dîné. Un café, peut-être.'); api.pay(0.02); return; } api.flag('dineCN', true); api.pay(0.3); api.say('Une fondue de fromage, épaisse, au kirsch, qu’on mange à la fourchette dans un caquelon commun, puis des filets de perche et un vin blanc sec du Lavaux. Le dîner est excellent, simple, et pas cher.'); } },
        { id: 'cn_attendre', label: 'Attendre le rendez-vous', idea: true, ideaCond: function (api) { return !!api.flag('rdvClub') && !api.npcs('max').met; }, verbs: ['ATTENDRE'], nouns: ['CLUB', 'HEURE', 'DUC', 'EDGAR'], repeatable: true,
          run: function (api) { var t = tAt(api, 20, 0); if (api.s.min >= t) { api.say('Vous attendez. Le Chat Noir se remplit, puis se vide un peu.'); api.time(30); return; } api.say(api.fresh('cnAtt', ['Vous attendez devant un verre. La place s’allume, réverbère après réverbère. Ni Edgar, ni le duc. Sept heures et demie. Huit heures moins le quart.', 'Le garçon change votre cendrier deux fois. La table « réservé » reste vide.'])); api.s.min = t; api.s.tick = 0; P.maxArrive(api); } },
        { id: 'cn_max', label: 'Écouter Max', idea: true, talkTo: 'max', verbs: ['PARLER', 'ECOUTER', 'POLI', 'DONNER', 'COMMANDER'], nouns: ['MAX', 'QUELQUUN'],
          cond: function (api) { return P.maxLa(api); },
          extra: ['DUC', 'EDGAR', 'CLUB', 'ADDITION', 'TOIMEME', 'HISTOIRE', 'MAISONDUC'], run: function (api, p) { api.talk('max', p); } },
        { id: 'cn_suivre', label: 'Suivre le duc', verbs: ['SUIVRE', 'ALLER'], nouns: ['DUC'], needVerb: true,
          cond: function (api) { var t = api.flag('ducParti'); return typeof t === 'number' && api.s.min - t <= 20 && !api.flag('filature'); },
          run: function (api) { api.flag('filature', true); api.say('Vous laissez un billet sur la table et vous sortez. Il descend la ruelle, cinquante mètres devant vous, la canne sous le bras.'); api.check('disc_duc'); } },
        { id: 'cn_payer', label: 'Payer l’addition', verbs: ['DONNER'], nouns: ['ADDITION', 'ARGENT'],
          cond: function (api) { return !!api.flag('maxAddition') && !api.flag('additionPayee'); },
          run: function (api) { api.flag('additionPayee', true); api.pay(Math.min(0.9, api.s.money)); api.say('Vous payez pour trois, et pour le vin de Max, qui était le meilleur de la carte. Il vous serre la main avec émotion, comme si vous lui aviez sauvé la vie.'); api.calm('max', 3); } }
      ] },
    la_pre: { name: 'Rue du Pré', art: 'la_pre',
      enter: function (api, first) { if (first) api.say('Une petite maison étroite, à deux étages, serrée entre deux immeubles plus hauts qu’elle. Les volets sont clos à tous les étages. Les fenêtres du rez-de-chaussée sont grillées comme celles d’une banque, et la porte, de chêne cerclé de fer, n’a ni nom, ni sonnette, ni heurtoir. C’est une maison qui ne veut pas qu’on frappe.'); else api.say(api.fresh('preR', ['La maison de la rue du Pré, ses volets clos.', 'Rue du Pré. La maison n’a pas bougé. Elle n’a pas l’air de bouger souvent.'])); },
      things: [{ label: 'la porte', ids: ['PORTE', 'MAISONDUC'] }, { label: 'les fenêtres grillées', ids: ['FENETRE'] }, { label: null, ids: ['SALLE', 'DUC'] }],
      ambient: ['Un volet bat, plus loin dans la rue. Pas ici.', 'Les pas d’un passant, qui accélèrent en passant devant la maison.'],
      actions: [
        lookAct('lp_look', ['Pas un rai de lumière aux volets. Pas une plante à la fenêtre, pas un paillasson. La crasse de la rue s’arrête au seuil, comme si on la balayait. Ou comme si elle n’osait pas.', 'Les grilles du rez-de-chaussée sont neuves, et les scellements aussi. On a voulu que cette maison soit un coffre.']),
        { id: 'lp_frapper', label: 'Frapper à la porte', verbs: ['FRAPPER', 'VISITER', 'PARLER'], nouns: ['PORTE', 'MAISONDUC', 'DUC'], bare: true,
          run: function (api) { api.say('Vous frappez. Le bruit s’enfonce dans la maison et ne revient pas. Personne ne vient. Vous avez pourtant l’impression très nette, absurde, que quelqu’un, de l’autre côté du bois, s’est arrêté pour écouter.'); } },
        { id: 'lp_forcer', label: 'Forcer la porte', idea: 'Forcer la porte', ideaKind: 'risque', verbs: ['OUVRIR', 'CASSER', 'FRAPPER'], nouns: ['PORTE', 'MAISONDUC'], needVerb: true, repeatable: true,
          cond: function (api) { return !api.flag('dedansDuc'); },
          run: function (api) { if (api.skill('Crochetage') >= 25) api.check('crochet_porte'); else api.check('fort_porte', { diff: 'difficile' }); } },
        { id: 'lp_entrer', label: 'Entrer dans la maison', verbs: ['ALLER', 'VISITER', 'OUVRIR'], nouns: ['PORTE', 'MAISONDUC'], needVerb: true, repeatable: true,
          cond: function (api) { return !!api.flag('dedansDuc'); }, run: function (api) { api.say('La porte, que vous avez forcée, s’ouvre sans un bruit.'); api.go('la_preint'); } }
      ] },
    la_preint: { name: 'Chez le duc', art: 'la_preint',
      enter: function (api, first) { if (first) api.say('Dedans, des pièces vides. Pas un meuble, pas un tapis, pas une porte : on a démonté jusqu’aux chambranles. La poussière couvre tout, épaisse comme un drap, sauf un sentier de traces de pas qui va de l’entrée à l’escalier, et monte. Il fait froid comme dehors. Plus froid.'); },
      things: [{ label: 'les traces dans la poussière', ids: ['TRACES', 'ESCALIER'] }, { label: 'la porte sculptée', ids: ['PORTEREN', 'PORTE'] }, { label: null, ids: ['SALLE', 'FENETRE', 'MAISONDUC'] }],
      ambient: ['La maison ne craque pas. Les maisons craquent toujours.', 'Votre souffle fait de la buée.'],
      actions: [
        lookAct('lpi_look', ['Les murs ont gardé la trace des tableaux qu’on a ôtés, des rectangles plus clairs. Il n’y a rien à voler. Il n’y a rien du tout.']),
        { id: 'lpi_monter', label: 'Suivre les traces à l’étage', idea: true, ideaCond: function (api) { return !api.flag('chaiseLongue'); }, verbs: ['SUIVRE', 'ALLER', 'EXAMINER'], nouns: ['TRACES', 'ESCALIER', 'ETAGE'],
          run: function (api) { api.flag('chaiseLongue', true); api.say('À l’étage, une seule pièce habitée, si l’on peut dire : une chaise longue de velours noir, une couverture de laine, un guéridon où sèche une tasse. Rien d’autre. Les traces de pas vont et viennent entre la chaise longue et la seule porte de la maison.'); api.say('Une porte de chêne sombre, de la Renaissance, sculptée de chasseurs qui rentrent d’une chasse heureuse, les chiens sur les talons, le gibier sur l’épaule. Les visages des chasseurs ne sont pas heureux. La porte est fermée à clé.'); } },
        { id: 'lpi_porte', label: 'Toucher la porte sculptée', idea: true, ideaKind: 'risque', ideaCond: function (api) { return !!api.flag('chaiseLongue') && !api.has('PORTE'); }, verbs: ['EXAMINER', 'OUVRIR', 'FRAPPER', 'UTILISER', 'PRENDRE'], nouns: ['PORTEREN', 'PORTE'],
          cond: function (api) { return !!api.flag('chaiseLongue'); },
          run: function (api) { if (api.has('PORTE')) { api.say('Vous ne la toucherez plus. Pas à mains nues.'); return; } api.say('Vous posez la main sur le bois. Il est tiède. Et quelque chose monte du bois dans votre bras, puis dans votre poitrine : une tristesse sans fond, puis une autre, puis une troisième, qui ne sont pas les vôtres. Des voix, peut-être. Des gens qui ont voulu mourir et qu’on a gardés là.'); api.check('san_porte'); } },
        { id: 'lpi_franchir', label: 'Ouvrir la porte sculptée', idea: 'Ouvrir la porte sculptée', ideaKind: 'risque', ideaCond: function (api) { return api.has('PORTE'); }, verbs: ['OUVRIR', 'ALLER', 'CASSER', 'UTILISER'], nouns: ['PORTEREN'], needVerb: true,
          cond: function (api) { return api.has('PORTE'); },
          run: function (api) { if (P.porteReve) P.porteReve(api); } },
        { id: 'lpi_sortir', label: 'Ressortir dans la rue', verbs: ['ALLER', 'SORTIR', 'FUIR'], nouns: ['PORTE'], bare: true, repeatable: true,
          run: function (api) { api.say('Vous redescendez, en marchant dans vos propres traces. Dehors, l’air vous semble presque chaud.'); api.go('la_pre', true); } }
      ] },
    la_police: { name: 'L’hôtel de police', art: 'la_police',
      enter: function (api, first) { if (first) api.say('Un vieux bâtiment près de l’hôtel de ville, sur la place de la Palud. Des bancs de bois, un poêle, un drapeau vaudois vert et blanc, et deux agents qui jouent aux cartes en faisant semblant de ne pas jouer.'); },
      things: [{ label: 'le commissaire', ids: ['ROCHAT', 'POLICE', 'QUELQUUN'] }, { label: null, ids: ['SALLE', 'TABLE', 'PORTE'] }],
      ambient: ['Une machine à écrire, dans le bureau voisin, frappe trois lettres et s’arrête.', 'Un agent tisonne le poêle.'],
      actions: [
        lookAct('lpo_look', ['Des affiches de chiens perdus, un portrait du général Dufour, un avis de la conférence sur les attroupements. Tout est propre, et tout attend.']),
        { id: 'lpo_rochat', label: 'Demander le commissaire', idea: true, talkTo: 'rochat', verbs: ['PARLER', 'VISITER', 'POLI', 'DEPOSER', 'COMMANDER'], nouns: ['ROCHAT', 'POLICE', 'QUELQUUN'],
          extra: ['CORPS', 'DECES', 'EDGAR', 'WILLIAM', 'MEURTRES', 'DUC', 'CONFERENCEL'], run: function (api, p) { api.talk('rochat', p); } }
      ] }
  };
  function etudeL(api, minutes) { var fin = day(api.s.min) * D + 17 * 60; api.time(Math.max(10, Math.min(minutes, fin - api.s.min))); }

  // ---------------------------------------------------------------- la cour, la sonnette, la porte entrouverte
  P.etatRue = function (api) {
    var m = api.s.min;
    if (api.flag('ducEntre') && !api.flag('temoin') && !api.flag('crimeVu') && !api.flag('meurtre') && m < tAt(api, 18, 45)) { api.say('Dans la cour, la porte de la boutique n’est pas tout à fait fermée. Il y a de la lumière à l’étage.'); return; }
    if (crime(api) && !api.flag('crimeVu') && !api.flag('sauveW')) {
      api.say(pluie(api) ? 'Il pleut à verse. Le bec de gaz du coin jette une lumière malade sur les pavés. La porte de la boutique est entrouverte. Derrière le rideau, tout est noir.' : 'Le bec de gaz du coin grésille. La porte de la boutique est entrouverte. Derrière le rideau, tout est noir.');
      api.flag('portesOuvertes', true);
      api.chips([{ label: 'Entrer dans la boutique', action: 'lr_entrer' }]);
    }
  };
  P.sonner = function (api) {
    var m = mn(api), j = day(api.s.min) === j0(api);
    if (api.flag('edgarSauve')) {
      if (edgarEveille(api) && !api.flag('edgarParle')) { api.say('William ouvre, vous fait signe de monter. Il a son couteau à la ceinture.'); api.go('la_etage', true); reveilEdgar(api); return; }
      api.say(api.flag('edgarParle') ? 'William entrouvre la porte et secoue la tête. Il écrit : « Edgar fait les valises. Merci. Partez. »' : 'William ouvre, vous fait signe d’entrer sans bruit. Edgar dort toujours, là-haut. William a sorti son couteau à dépecer, et il le garde à la main.');
      if (!api.flag('edgarParle')) api.go('la_boutique');
      return;
    }
    if (crime(api) && !api.flag('crimeVu')) { P.etatRue(api); return; }
    if (!j || m < 9 * 60) { api.say('Vous sonnez. Le timbre résonne loin, dans une maison qui dort. Personne. L’écriteau dit que la boutique est ouverte ; les écriteaux mentent aussi en Suisse, avant neuf heures.'); return; }
    if (edgarRecoit(api)) { P.premiereVisite(api); return; }
    if (api.flag('edgarVu') && !edgarRentre(api)) { api.say('Vous sonnez. Pas de réponse. Derrière le rideau de la porte, vous croyez deviner une silhouette immobile, assise, la tête tournée vers vous. Elle ne se lève pas.'); return; }
    if (edgarRentre(api) && m < 18 * 60 + 20) {
      api.say(api.flag('edgarVu') ? 'Au bout d’un long moment, le rideau s’écarte. C’est William. Il vous reconnaît, ouvre, écrit dans son carnet et vous le tend : « Edgar dort. Il est malade. Vous voulez attendre ? »' : 'Au bout d’un long moment, le rideau s’écarte sur un homme au crâne bosselé sous un chapeau, aux yeux fixes. Il vous regarde sans un mot, puis ouvre, et vous tend un carnet où il a écrit : « Edgar dort. Il est malade. Vous voulez attendre ? »');
      api.npcs('william').met = true;
      api.go('la_boutique', true);
      api.chips([{ label: 'Attendre dans la boutique', action: 'lb_attendre' }, { label: 'Revenir plus tard', action: 'lb_sortir' }]);
      return;
    }
    api.say('Vous sonnez. Personne ne vient.');
  };
  // entrer quand le duc est là, ou quand c'est fini
  P.entrerApres = function (api) {
    var m = api.s.min;
    if (api.flag('ducEntre') && !api.flag('temoin') && !api.flag('meurtre') && m < tAt(api, 18, 45)) {
      api.say('La porte cède sous votre main : elle n’était pas verrouillée. La boutique est chaude, le feu ronfle, les bêtes vous regardent passer.');
      api.go('la_boutique', true); api.flag('vueBoutique', 'etage');
      if (m < tAt(api, 18, 30)) { api.say('Vous montez sans bruit. La porte de la chambre d’Edgar est entrebâillée ; il y a de la lumière.'); api.go('la_etage', true); temoin(api, 'surpris'); return; }
      interruption(api); return;
    }
    api.say(api.fresh('entrerNoir', ['Vous poussez la porte. Elle s’ouvre sans un bruit sur le noir.', 'La porte n’est pas fermée. Vous entrez.']));
    api.go('la_boutique');
  };
  P.guetterRue = function (api) {
    var m = api.s.min;
    if (api.flag('ducVuEntrer') && !api.flag('temoin') && !api.flag('meurtre') && m < tAt(api, 18, 45)) {
      api.s.min = tAt(api, 18, 45); api.s.tick = 0;
      api.say('Vous attendez dans l’ombre de la cour. Un quart d’heure. Plus. À l’étage, une lampe s’éteint. Puis la porte de la boutique se rouvre, et le duc sort, sa valise à la main, sans se presser. Il remonte son col. Il passe à trois mètres de vous, et vous jureriez qu’il fredonne.');
      api.say('Il ne referme pas la porte derrière lui.');
      api.flag('meurtre', true); api.flag('meurtreW', true); api.flag('meurtreE', true); api.flag('portesOuvertes', true);
      return;
    }
    api.say(api.fresh('guetR', ['Vous restez un moment dans la cour, sous l’enseigne. Personne n’entre, personne ne sort. Le rideau ne bouge pas.', 'Rien. Une fenêtre s’allume en face, puis s’éteint.']));
    api.time(20);
  };
  // la première visite : le thé, puis le duc
  P.premiereVisite = function (api) {
    api.flag('edgarVu', true); api.flag('the', true); api.flag('theMin', api.s.min);
    api.go('la_boutique', true);
    api.talk('edgar');
    api.endTalk(false); api.flag('theAccueil', true);
    api.say('Il vous fait traverser la boutique, si chaude qu’on y suffoque, entre des bêtes qui posent en tableaux absurdes : un renard qui courtise une poule, une chouette en robe de baptême, un ours brun dressé au pied de l’escalier. « Montez, montez. Je vais faire du thé. Vous me parlerez de l’Angleterre. Je n’ai personne à qui parler de l’Angleterre. »');
    api.go('la_etage', true);
    api.say('Le salon de l’étage, sous un portrait de la vieille reine. Edgar vous presse de questions sur Londres, sur la traversée, sur le prix du tabac ; il est généreux en biscuits, en thé, en cigarettes, et ses yeux reviennent toujours à vos mains, à votre montre, à vos boutons de manchette. Puis la porte du salon s’ouvre.');
    api.say('Un homme entre, plus jeune qu’Edgar, une tête mal faite sous un chapeau qu’il ne retire pas. Ses yeux ne bougent pas : quand il veut regarder quelque chose, il tourne toute la tête, comme une lanterne de phare. Il vous salue d’un signe, se sert une tasse, s’assied en face de vous, et vous regarde.');
    api.npc('edgar', '« Mon frère William. La guerre lui a pris la parole. Il vous dit de continuer : c’est sa façon de le dire. »');
    api.npcs('william').met = true;
    api.talk('edgar');
  };
  P.edgarLa = function (api) { return (enBoutique(api) && !!api.flag('the') && !api.flag('ducVenu')) || (api.s.loc === 'la_etage' && api.flag('edgarParle') && edgarVivant(api) && day(api.s.min) === j0(api)); };
  P.williamLa = function (api) { return enBoutique(api) && williamVivant(api) && !api.flag('interrompu') && (!!api.flag('the') || !!api.npcs('william').met) && !(crime(api) && !api.flag('sauveW')); };
  function ducArrive(api) {
    api.flag('ducVu', true); api.flag('rdvClub', true); api.flag('ducIci', api.s.turn);
    if (api.s.talk) api.endTalk(false);
    api.say('La sonnette de la boutique. Edgar s’excuse et descend. Vous restez seul{e} avec William, qui se sent sociable aujourd’hui : il tire son carnet, écrit, vous le tend. « Belle journée aujourd’hui. » Puis : « Bienvenue à Lausanne. » Il attend que vous ayez lu, reprend le carnet, et vous regarde à nouveau.');
    api.say('Dix minutes plus tard, Edgar remonte, suivi d’un homme corpulent, d’âge moyen, à la mise parfaite : des cheveux sombres bien peignés, des moustaches cirées avec goût, des guêtres impeccables. Ses yeux sont d’un bleu d’eau, très pâle.');
    api.npc('edgar', '« Mon vieil ami, le duc des Esseintes. Un amateur d’occulte, comme moi. Il s’intéresse, lui aussi, à mon rouleau. »');
    api.talk('duc'); api.endTalk(false);
    api.npc('duc', 'Le duc agite une main gantée, l’air de s’en moquer. « Je voudrais le voir avant de faire une offre, voilà tout. »');
    api.npc('edgar', '« Je serais ravi de vous le montrer, à tous les deux, mais il est dans le coffre d’une banque. » Il sourit. « Venez donc ce soir au club de sept heures et demie, au Chat Noir. Je l’apporterai, nous ferons affaire, et nous passerons une bonne soirée. »');
    api.clue('DUC'); api.clue('CLUB'); apprendre(api, 'la_chatnoir');
    api.npc('edgar', 'Il consulte la pendule. « Pardonnez-moi, j’ai mille choses à faire aujourd’hui, dont aller chercher ce fameux rouleau. » Il se tourne vers le duc. « Auriez-vous le temps de faire visiter un peu la ville à notre ami{e} ? »');
    api.npc('duc', '« Mais oui, mais oui, mon cher, bien sûr. Il n’y a rien que j’aime tant que montrer Lausanne à des gens qui ne la connaissent pas. Ils la trouvent toujours plus grande qu’elle n’est. »');
    api.say('Edgar vous raccompagne jusqu’à la cour. Derrière la vitrine, William a écarté le rideau d’un doigt, et il vous regarde partir. Il regarde le duc, surtout.');
    api.flag('edgarSorti', true); api.flag('ducVenu', true); api.flag('the', false);
    api.go('la_rue', true);
    if (mn(api) < 15 * 60) api.chips([{ label: 'Suivre le duc pour la visite', action: 'vi_suite' }, { label: 'Décliner poliment', action: 'vi_quitter' }]);
    else { api.npc('duc', 'Le duc regarde le ciel. « Il est tard pour une promenade. À ce soir, alors : le Chat Noir, sept heures et demie. »'); api.flag('visiteFinie', true); api.flag('ducParti', api.s.min); }
  }
  P._ducArrive = ducArrive;
  P.pnjIci = function (api, id) {
    if (id === 'duc') return (!!api.flag('visite') && enVille(api)) || api.flag('ducIci') === api.s.turn || (!!api.flag('ducAssis') && /^tr_/.test(api.s.loc));
    return false;
  };

  // ---------------------------------------------------------------- la découverte
  P.decouverte = function (api) {
    api.flag('crimeVu', true); api.flag('crimeVuMin', api.s.min);
    api.say('À l’étage, c’est le chaos. Des tiroirs ouverts, un fauteuil renversé, la théière en morceaux sur le tapis. La porte de la cuisine est ouverte, et celle de la chambre d’Edgar aussi.');
    api.flag('tourEtage', 0);
  };
  P.cuisine = function (api) {
    if (api.flag('williamVu')) { api.say('Vous ne retournerez pas dans la cuisine. Vous avez vu.'); return; }
    api.flag('williamVu', true);
    api.say('William est étendu sur le carrelage de la cuisine, entre la table et le fourneau. On l’a frappé au ventre et dans le dos ; un grand couteau de boucher a été lâché à côté de lui. Sa chemise a été arrachée sur le devant, et un large lambeau de peau a été découpé sur sa poitrine, proprement, comme on lève un filet.');
    api.say('Sur le carrelage, près de sa main droite, il a tracé quelque chose avec son sang. Trois lettres, de travers : D U C.');
    api.clue('DUCSANG'); if (api.flag('edgarVuMort')) api.clue('CRIME');
    api.check('san_william');
  };
  P.chambre = function (api) {
    if (api.flag('edgarVuMort')) { api.say('Edgar, sur son lit. Il n’a pas bougé.'); return; }
    api.flag('edgarVuMort', true);
    api.say('Edgar est allongé sur son lit, tout habillé, les mains ouvertes sur la couverture. Il est froid. Il a l’air de dormir, sauf la bouche. Sur la table de nuit, une cuiller, une fiole verte, un flacon de morphine vide ; par terre, une seringue. Un cahier relié est ouvert sur le tapis, face contre terre, comme quelqu’un l’a laissé tomber après l’avoir lu.');
    if (api.flag('williamVu')) api.clue('CRIME');
    api.check('san_edgar');
  };
  P.fouillerChambre = function (api) {
    var pris = [];
    if (!api.item(JOURNAL)) { api.take(JOURNAL); pris.push('le cahier ouvert par terre : le journal d’Edgar'); }
    if (!api.item(FIOLE)) { api.take(FIOLE); api.flag('fioleOK', true); pris.push('la fiole verte, grande comme un encrier, presque pleine, avec une étiquette à l’encre violette : « Lausanne »'); }
    if (!api.item(RECU) && !api.has('RECU')) { api.take(RECU); pris.push('sur le bureau, un reçu de papetier daté du jour'); }
    if (!pris.length) { api.say(api.fresh('fouilleR', ['Vous avez déjà pris ce qui comptait. Le reste, ce sont les affaires d’un homme mort : des chemises, des cigarettes, une photographie de deux garçons en uniforme.', 'Rien de plus. Une photographie de deux garçons en uniforme, qui sourient. Vous la reposez face contre le bois.'])); if (!api.flag('fauxTrouve')) api.chips([{ label: 'Regarder sous le lit', action: 'le_souslit' }]); return; }
    api.say('Vous prenez ' + pris.join(' ; ') + '.');
    if (api.item(RECU) && !api.has('RECU')) api.clue('RECU');
    api.say('Le flacon de morphine est vide. La seringue, par terre, aussi. Vous ne les prenez pas.');
    api.say('Dans la fiole, le liquide ressemble à de l’eau de flaque. Mais, levé vers la lampe, il est plein de minuscules paillettes d’argent qui tournent lentement, sans jamais retomber.');
    if (!api.flag('fauxTrouve')) api.chips([{ label: 'Regarder sous le lit', action: 'le_souslit' }, { label: 'Lire le journal d’Edgar', action: 'le_journal' }]);
    else api.chips([{ label: 'Lire le journal d’Edgar', action: 'le_journal' }]);
  };
  P.lireJournal = function (api) {
    if (api.has('JOURNALE')) { api.say('Vous relisez les dernières pages. Le duc, la fiole, l’autre Lausanne, et le rouleau caché dans la boutique du rêve. Tout y est.'); return; }
    api.time(50);
    api.say('Des notes courtes, d’une écriture qui se défait au fil des mois. Beaucoup de douleur, très peu de faits. Puis, depuis l’été, une autre musique.');
    api.doc('JOURNAL D’EDGAR WELLINGTON — Le duc m’a apporté une bouteille verte, « contre l’insomnie », a-t-il dit. Une cuillerée. J’ai dormi. J’ai dormi comme on tombe. — Je suis allé à Lausanne cette nuit. Pas celle-ci. L’autre. Les rues sont les mêmes, mais le ciel est violet, et les gens sont habillés comme sur les vitraux. Personne ne me parle. Ils ont tous trop à faire. Il y a des gibets aux carrefours. Je n’ai pas eu peur. — J’ai compris une chose : ce que je serre dans mes mains en m’endormant passe avec moi, et revient avec moi. J’ai emporté ma montre. Elle marchait à l’envers. — On ne garde pas une chose pareille au-dessus d’une boutique. J’ai emporté le rouleau là-bas, et je l’ai caché dans notre boutique de là-bas, là où personne n’ira jamais le chercher, dans le premier que nous avons fait. Ici, personne ne peut le prendre. Là-bas, personne ne sait qu’il existe. — Le duc m’a demandé, ce matin, ce que j’avais de si précieux pour dormir si bien. Je n’ai rien dit. Je ne lui dirai rien. — Ce soir, je vendrai le faux aux Anglais, ou au duc, au plus offrant, et je garderai le vrai. Puis je partirai. William aura les rentes de Londres. Il ne s’apercevra peut-être pas que je suis parti. Je vais chercher le rouleau là-bas avant sept heures. Une cuillerée, et la piqûre, pour dormir plus vite.', 'Le journal d’Edgar Wellington');
    api.clue('JOURNALE');
    api.say('Le premier que nous avons fait. Vous revoyez William désigner l’ours de l’escalier, et écrire : « Le premier. Le plus beau. »');
    if (crime(api) && !api.flag('sauveE')) api.say('Edgar est mort en dormant, là-bas. Si ce qu’il écrit est vrai, il y est peut-être encore. Avec le rouleau. Et la fiole est dans votre poche.');
  };

  // ================================================================ le club : Max
  P.maxLa = function (api) { var h = hour(api.s.min); return api.s.loc === 'la_chatnoir' && h >= 20 && day(api.s.min) === j0(api) && !api.flag('maxParti'); };
  P.maxArrive = function (api) {
    if (api.flag('maxVu') || !P.maxLa(api)) return;
    api.flag('maxVu', true);
    api.talk('max');
    api.say('Le garçon apporte une bouteille que vous n’avez pas commandée, la meilleure de la carte. Max goûte, approuve, et commence à raconter sa vie.');
  };
  P.addition = function (api) {
    api.flag('maxAddition', true);
    api.npc('max', 'Il tâte ses poches, l’une après l’autre, avec une consternation parfaite. « Ach ! Mon ami{e}, je suis désolé. J’ai laissé mon portefeuille chez moi. Seriez-vous assez aimable ? » Puis, comme si de rien n’était : « Je me demande ce qui retient les deux autres. Encore une tournée, et un café ? Racontez-moi un peu qui vous êtes, vous. »');
    api.chips([{ label: 'Payer l’addition', action: 'cn_payer' }]);
  };

  // ================================================================ dormir, le train du lendemain
  P.dormir = function (api) {
    var h = hour(api.s.min), d = day(api.s.min);
    if (h >= 9 && h < 21) {
      api.say(api.fresh('dodoJourL', ['Dormir en plein jour, avec ce qui vous attend ? Vous vous allongez vingt minutes, sans fermer l’œil.', 'Vous tirez les rideaux sur le brouillard. Le sommeil ne vient pas.']));
      api.time(20); return;
    }
    if (h < 9 && day(api.s.min) === j0(api) && !api.flag('dormiMatin')) {
      api.flag('dormiMatin', true);
      api.say('Vous dormez trois heures d’un sommeil de plomb, et vous vous réveillez la bouche pâteuse, avec un jour gris à la fenêtre. Il est dix heures.');
      api.s.min = d * D + 10 * 60; api.s.tick = 0; return;
    }
    // la nuit : on se réveille à temps pour le train (6 h), sauf si l'on n'a rien réglé
    var reveil = (h >= 21 ? d + 1 : d) * D + 5 * 60 + 40;
    api.say(api.fresh('dodoNuitL', ['Vous dormez mal. La pluie, le vent, et quelque part la voix du guet qui crie l’heure. À cinq heures et demie, vous êtes debout.', 'Une nuit hachée. Vous rêvez de bêtes empaillées qui tournent la tête toutes ensemble. À l’aube, vous ouvrez les yeux avant le réveil.']));
    api.s.min = reveil; api.s.tick = 0;
    if (crime(api) && !api.flag('crimeVu') && !api.flag('sauveW')) api.say('Le train part à six heures quarante-cinq. Et personne n’est venu au Chat Noir, hier soir. Ni Edgar, ni le duc.');
  };
  P.trainPossible = function (api) { var m = mn(api); return day(api.s.min) > j0(api) && m >= 5 * 60 + 30 && m < 6 * 60 + 45; };
  P.monter = function (api) {
    var m = mn(api);
    if (day(api.s.min) === j0(api) && m < 8 * 60) { api.say('Le train qui vous a amené{e} repart dans un nuage de vapeur. Vous restez sur le quai : vous êtes descendu{e} pour Lausanne. Le prochain Simplon-Orient passe demain matin, à six heures quarante-cinq.'); return; }
    if (!P.trainPossible(api)) { api.say('Le Simplon-Orient passe chaque matin à six heures quarante-cinq. On monte à partir de six heures et demie.'); return; }
    if (api.s.talk) api.endTalk(false);
    if (api.flag('edgarSauve') && !api.flag('edgarParle')) reveilEdgar(api, true);
    api.say('Le Simplon-Orient entre en gare dans un grand souffle de vapeur, bleu et or sous le brouillard. Un conducteur en uniforme brun vérifie votre billet, vos noms, et vous conduit à votre compartiment. À six heures quarante-cinq, un coup de sifflet : Lausanne glisse en arrière, et le lac avec elle.');
    api.s.min = day(api.s.min) * D + 6 * 60 + 50; api.s.tick = 0;
    api.flag('trainL', true);
    api.go('tr_compartiment');
  };

  // ---------------------------------------------------------------- le Simplon-Orient : Brigue, la neige, le déjeuner
  Object.assign(P.locations, {
    tr_compartiment: { name: 'Simplon-Orient-Express, votre compartiment', art: 'tr_compartiment',
      enter: function (api, first) {
        if (first) { api.say('Un compartiment de bois verni, de cuivre et de velours, la couchette relevée en banquette. Derrière la vitre, le Léman, puis les vignes en terrasse du Lavaux, puis la vallée du Rhône qui se resserre entre des montagnes de plus en plus hautes.'); if (P.fantomeEdgar) P.fantomeEdgar(api, 'entree'); return; }
        api.say(api.fresh('trCR', ['Votre compartiment, son velours, son cuivre.', 'Le compartiment. Le paysage défile, blanc.']));
      },
      things: [{ label: 'le conducteur', ids: ['CONDUCTEUR', 'QUELQUUN'] }, { label: 'la fenêtre', ids: ['FENETRE', 'SIMPLON'] }, { label: null, ids: ['SALLE', 'COMPARTIMENT', 'TRAIN', 'PORTE', 'LAMPE', 'BAGAGES', 'EDGAR'] }],
      ambient: ['Le train ralentit dans une courbe ; la neige crisse sous les roues.', 'Le conducteur passe dans le couloir en annonçant une gare.', 'Un tunnel, et le noir, et votre reflet dans la vitre.'],
      actions: [
        lookAct('tc_look', ['Le cuivre du porte-bagages, la petite lampe, la marqueterie de fleurs aux portes. Dehors, la neige commence à tomber, d’abord en flocons espacés, puis en rideau.']),
        { id: 'tc_morand', label: 'Appeler le conducteur', idea: true, talkTo: 'morand', verbs: ['PARLER', 'SONNER', 'COMMANDER', 'POLI'], nouns: ['CONDUCTEUR', 'QUELQUUN'],
          extra: ['HEURE', 'MILAN', 'SIMPLON', 'RESTAURANT', 'PASSAGERS'], run: function (api, p) { api.talk('morand', p); } },
        { id: 'tc_fenetre', label: 'Regarder par la fenêtre', verbs: ['EXAMINER', 'CONTEMPLER'], nouns: ['FENETRE', 'SIMPLON'],
          run: function (api) { api.say(api.flag('brigue') ? 'Des sapins chargés de neige, des torrents gelés, un village de bois noir où une cheminée fume. Puis le tunnel, vingt kilomètres de nuit sous la montagne, et l’Italie de l’autre côté, qui n’a pas l’air plus chaude.' : 'La vallée du Rhône : des vignes noires, des châteaux sur des rochers, des montagnes qui se rapprochent comme des murs. La neige tombe de plus en plus serré.'); } },
        { id: 'tc_restaurant', label: 'Aller au wagon-restaurant', idea: true, ideaCond: function (api) { return mn(api) >= 11 * 60 + 30 && !api.flag('ducTrain'); }, verbs: ['ALLER', 'MANGER', 'VISITER'], nouns: ['RESTAURANT', 'MANGER', 'DINER'], bare: true, repeatable: true,
          run: function (api) { if (P.fantomeEdgar) P.fantomeEdgar(api, 'sortie'); api.say('Vous remontez le couloir, deux voitures, en vous tenant aux barres de cuivre.'); api.go('tr_restaurant'); } },
        { id: 'tc_lire', label: 'Lire la traduction du rouleau', idea: true, ideaCond: function (api) { return api.item(TRAD) && !api.flag('lu'); }, verbs: ['LIREL', 'EXAMINER', 'UTILISER'], nouns: ['TRADUCTIONL', 'ROULEAU', 'NOTE'], repeatable: true,
          cond: function (api) { return api.item(TRAD); }, run: function (api) { P.lireRouleau(api); } },
        { id: 'tc_faux', label: 'Examiner le rouleau scellé', verbs: ['EXAMINER', 'OUVRIR'], nouns: ['FAUX'],
          cond: function (api) { return api.item(FAUX) && !api.flag('fauxJuge'); },
          run: function (api) { api.check(api.skill('Archéologie') >= api.skill('Évaluation') ? 'exp_faux' : 'eval_faux'); } },
        { id: 'tc_dormir', label: 'Dormir un peu', verbs: ['DORMIR'], nouns: ['COMPARTIMENT'], bare: true, repeatable: true,
          run: function (api) { api.say('Vous fermez les yeux. Le train vous berce, et vous ne dormez pas : chaque fois que vous vous assoupissez, une bête empaillée tourne la tête vers vous.'); api.time(30); } }
      ] },
    tr_restaurant: { name: 'Le wagon-restaurant', art: 'tr_restaurant',
      enter: function (api, first) {
        if (first) api.say('Le wagon-restaurant : des nappes blanches, de l’argenterie qui tinte, des lampes à abat-jour roses, de grands fauteuils à haut dossier. Dehors, la neige. Le maître d’hôtel vous installe à une table vide, et vous vous laissez tomber dans le fauteuil. Pour la première fois depuis longtemps, vous êtes bien.');
        if (mn(api) < 11 * 60 + 30 && !api.flag('ducTrain')) { api.arrive('maitre'); api.npc('maitre', '« Le premier service est à midi moins le quart, {m}. Vous pouvez attendre ici, si vous le souhaitez. Je vous apporte un café. »'); api.chips([{ label: 'Attendre le premier service', action: 'trr_attendre' }, { label: 'Retourner au compartiment', action: 'trr_retour' }]); return; }
        if (P.dejeunerDuc) P.dejeunerDuc(api);
      },
      things: [{ label: 'le maître d’hôtel', ids: ['SERVEUR', 'QUELQUUN'] }, { label: null, ids: ['SALLE', 'RESTAURANT', 'TABLE', 'BOISSON', 'FENETRE', 'DUC'] }],
      ambient: ['L’argenterie tinte dans une courbe.', 'À la table voisine, un délégué italien lit un télégramme deux fois.', 'Le serveur verse le vin sans en perdre une goutte, malgré les secousses.'],
      actions: [
        lookAct('trr_look', ['Des délégués qui rentrent de la conférence, une famille de Bâle, deux officiers italiens. Personne ne vous regarde. Puis vous vous apercevez que tout le monde vous a regardé{e}, une fois, en douce.']),
        { id: 'trr_maitre', label: 'Appeler le maître d’hôtel', talkTo: 'maitre', verbs: ['PARLER', 'COMMANDER', 'SONNER'], nouns: ['SERVEUR'], extra: ['MANGER', 'DINER', 'BOISSON', 'DUC'], run: function (api, p) { api.talk('maitre', p); } },
        { id: 'trr_attendre', label: 'Attendre le premier service', idea: true, ideaCond: function (api) { return !api.flag('ducTrain'); }, verbs: ['ATTENDRE', 'ASSEOIR', 'MANGER'], nouns: ['RESTAURANT', 'MANGER', 'DINER', 'HEURE'], repeatable: true,
          cond: function (api) { return !api.flag('ducTrain'); },
          run: function (api) { var t = Math.floor(api.s.min / D) * D + 11 * 60 + 45; api.say('Vous attendez devant un café, en regardant tomber la neige. Peu à peu, les tables se remplissent.'); if (api.s.min < t) { api.s.min = t; api.s.tick = 0; } if (P.dejeunerDuc) P.dejeunerDuc(api); } },
        { id: 'trr_manger', label: 'Déjeuner', idea: true, ideaCond: function (api) { return !api.flag('dejeune') && !!api.flag('chaise'); }, verbs: ['MANGER', 'COMMANDER', 'BOIRE'], nouns: ['MANGER', 'DINER', 'BOISSON'], bare: true, time: 40,
          cond: function (api) { return !api.flag('dejeune') && !!api.flag('chaise'); },
          run: function (api) { api.flag('dejeune', true); api.say('Un potage, une truite au bleu, un poulet à l’estragon, un vin rouge du Valais. Vous mangez comme on ne mange qu’après une nuit pareille. Dehors, les montagnes baissent la tête, peu à peu ; la neige devient pluie, et la pluie, plaine.'); if (P.arriveeMilan && api.flag('chaise')) P.arriveeMilan(api); } },
        { id: 'trr_retour', label: 'Retourner au compartiment', verbs: ['ALLER', 'SORTIR'], nouns: ['COMPARTIMENT'], bare: true, repeatable: true,
          cond: function (api) { return !api.flag('ducAssis') || !!api.flag('chaise'); },
          run: function (api) { api.go('tr_compartiment'); } }
      ] }
  });

  // ================================================================ actions communes
  P.globalActions = [goL('la_gare'), goL('la_hotel'), goL('la_rue'), goL('la_cathedrale'), goL('la_musee'), goL('la_signal'), goL('la_chatnoir'), goL('la_pre'), goL('la_police'),
    { id: 'l_lieux', label: 'Où aller ?', verbs: ['ALLER', 'EXAMINER', 'PRENDRE', 'COMMANDER'], nouns: ['DESTINATIONS', 'TAXI'], repeatable: true,
      cond: function (api) { return enVille(api); },
      run: function (api) { var c = destChips(api); if (!c.length) { api.say('Vous ne connaissez encore aucune autre adresse à Lausanne.'); return; } api.say('Vous pouvez vous rendre à : ' + c.map(function (x) { return x.label.replace('Aller : ', ''); }).join(', ') + '.'); api.chips(c); } },
    { id: 'vi_suite', label: 'Suivre le duc', verbs: ['SUIVRE', 'ALLER', 'ACCOMPAGNER', 'VISITER'], nouns: ['DUC', 'VISITER'], repeatable: true,
      cond: function (api) { var v = api.flag('visite') || 0; return enVille(api) && ((v === 0 && api.flag('ducVenu') && !api.flag('visiteFinie') && api.s.loc === 'la_rue') || (v > 0 && v < VISITE.length)); },
      run: function (api) { etapeVisite(api, api.flag('visite') || 0); } },
    { id: 'vi_quitter', label: 'Prendre congé du duc', verbs: ['AUREVOIR', 'ALLER'], nouns: ['DUC'], repeatable: true,
      cond: function (api) { return enVille(api) && (!!api.flag('visite') || (api.flag('ducVenu') && !api.flag('visiteFinie') && api.s.loc === 'la_rue')); },
      run: function (api) { if (api.s.talk) api.endTalk(false); P.quitterVisite(api, null); } },
    { id: 'vi_duc', label: 'Parler au duc', idea: true, talkTo: 'duc', verbs: ['PARLER', 'POLI', 'FLATTER', 'PERSUADER', 'PSY'], nouns: ['DUC'],
      cond: function (api) { return !!api.flag('visite') && enVille(api); },
      extra: ['TOIMEME', 'ROULEAU', 'EDGAR', 'GISANT', 'CATHEDRALE', 'REVE', 'CONFERENCEL', 'FENALIK', 'CLUB', 'MAISONDUC', 'GUET'], run: function (api, p) { api.talk('duc', p); } },
    { id: 'lr_suivre', label: 'Suivre le duc', verbs: ['SUIVRE'], nouns: ['DUC'], needVerb: true,
      cond: function (api) { var t = api.flag('ducParti'); return enVille(api) && typeof t === 'number' && api.s.min - t <= 20 && !api.flag('filature') && api.s.loc !== 'la_chatnoir'; },
      run: function (api) { api.flag('filature', true); api.say('Vous le laissez prendre un peu d’avance, puis vous le suivez.'); api.check('disc_duc'); } },
    { id: 'l_fiole', label: 'Boire la fiole verte', idea: 'Boire la fiole verte', ideaKind: 'risque', ideaCond: function (api) { return api.has('JOURNALE') && api.item(FIOLE); }, verbs: ['BOIRE', 'UTILISER', 'PRENDRE', 'DORMIR'], nouns: ['FIOLE'], needVerb: true, repeatable: true,
      cond: function (api) { return api.item(FIOLE) && (enVille(api) || train(api)); },
      run: function (api) { if (P.boireFiole) P.boireFiole(api); } },
    { id: 'l_lire', label: 'Lire la traduction du rouleau', verbs: ['LIREL', 'EXAMINER'], nouns: ['TRADUCTIONL'], needVerb: true, repeatable: true,
      cond: function (api) { return api.item(TRAD) && enVille(api); }, run: function (api) { P.lireRouleau(api); } },
    { id: 'l_notes', label: 'Relire vos notes', obj: 'vos notes', verbs: ['EXAMINER', 'ATTENDRE'], nouns: ['PISTE', 'NOTE'], repeatable: true,
      run: function (api) { var s = P.notes(api); api.say(s.length ? 'Vous relisez votre carnet. ' + s.join(' ') : 'Vous relisez votre carnet. Il ne vous reste qu’à partir.'); } }
  ];
  (L.globalActions || []).forEach(function (a) { if (a.id === 'g_etat') P.globalActions.push(a); });

  P.notes = function (api) {
    var s = [];
    if (train(api)) { if (!api.flag('chaise')) s.push('Milan vers une heure.'); if (api.item(TRAD) && !api.flag('lu')) s.push('La traduction du rouleau, à lire.'); return s; }
    if (!api.flag('edgarVu') && !crime(api)) s.push(connu(api, 'la_rue') ? 'Rue Saint-Étienne, au 50 : Edgar Wellington et son rouleau.' : 'Trouver ce qui retient Smith à Lausanne. La gazette, le porteur, l’hôtel en savent peut-être quelque chose.');
    if (api.flag('rdvClub') && !api.flag('maxVu') && !crime(api)) s.push('Ce soir, sept heures et demie, le club, au Chat Noir.');
    if (api.flag('edgarSauve') && !api.flag('edgarParle')) s.push('Edgar dort. Il se réveillera vers dix heures du soir.');
    if (crime(api) && !api.flag('crimeVu') && api.flag('maxVu')) s.push('Personne n’est venu au club. Ni Edgar, ni le duc. Rue Saint-Étienne, peut-être ?');
    if (api.flag('crimeVu') && !api.has('JOURNALE') && !api.flag('edgarSauve')) s.push('Les affaires d’Edgar : ce qu’il préparait, ce qu’il savait.');
    if (api.has('JOURNALE') && api.item(FIOLE) && !api.flag('reveFait') && !api.item(ROULEAU)) s.push('La fiole verte. L’autre Lausanne. Le rouleau est là-bas, et peut-être Edgar aussi.');
    if (api.flag('crimeVu') && !api.flag('deposition')) s.push('Deux morts rue Saint-Étienne, et votre nom quelque part dans cette histoire. La police de la Palud, ou le train de demain.');
    if (day(api.s.min) > j0(api) || api.flag('crimeVu') || api.flag('edgarParle')) s.push('Le Simplon-Orient passe à six heures quarante-cinq.');
    return s;
  };

  // ================================================================ l'horloge du chapitre
  // les maisons ferment ; le duc arrive à son heure ; Max s'en va à minuit ; Edgar se réveille à dix heures
  var DEHORS = {
    la_musee: 'Une cloche grêle. Mlle Chappuis éteint les lampes vertes une à une, en commençant par la vôtre.',
    la_chatnoir: 'Minuit. Le garçon empile les chaises sur les tables, ostensiblement, autour de vous.'
  };
  P.everyTurn = function (api, fired) {
    if (api.s.ended || api.s.pending) return false;
    if (P.tourReve && P.tourReve(api)) return true;
    if (train(api)) return P.tourTrain ? P.tourTrain(api) : false;
    if (!enVille(api)) return false;
    var m = api.s.min;
    // le thé chez Edgar : quand on parle du rouleau, ou au bout d'un moment, on sonne
    if (api.flag('the') && !api.flag('ducVenu') && api.s.loc === 'la_etage') {
      var n = (api.flag('theTours') || 0) + 1; api.flag('theTours', n);
      if (api.flag('parleRouleau') && api.flag('rouleauTour') === undefined) api.flag('rouleauTour', n);
      var rt = api.flag('rouleauTour');
      if ((rt !== undefined && n - rt >= (api.flag('prixDit') ? 2 : 4)) || n >= 10 || m - (api.flag('theMin') || m) >= 60) { ducArrive(api); return true; }
    }
    // dix-huit heures : Edgar monte s'allonger
    if (!api.flag('edgarDort') && m >= tAt(api, 18, 0)) {
      api.flag('edgarDort', true);
      if (enBoutique(api) && williamVivant(api)) { api.say('Six heures sonnent à la cathédrale. ' + (api.flag('edgarVu') ? 'Edgar rentre, un paquet de papetier sous le bras, s’étonne à peine de vous trouver là, s’excuse : une migraine, il doit s’allonger une heure. Il monte. Vous entendez la porte de sa chambre, le tiroir de sa table de nuit.' : 'À l’étage, une porte se ferme. William vous montre le plafond, puis joint les mains contre sa joue : Edgar dort.')); return true; }
    }
    // dix-huit heures vingt : le duc
    if (!enBoutique(api)) api.flag('entreBoutique', null);
    else if (typeof api.flag('entreBoutique') !== 'number') api.flag('entreBoutique', m);
    if (!api.flag('ducEntre') && m >= tAt(api, 18, 20)) {
      // le duc ne tue pas devant témoin : encore faut-il avoir été là quand il est arrivé
      if (enBoutique(api) && williamVivant(api) && api.flag('entreBoutique') <= tAt(api, 18, 20)) { temoin(api); return true; }
      api.flag('ducEntre', true);
      if (api.s.loc === 'la_rue') { api.say('Un homme corpulent traverse la cour, une petite valise à la main, sans vous voir dans l’ombre de l’enseigne. Le duc. Il sonne. William ouvre, et le duc entre. La porte se referme, mais le pêne n’a pas claqué.'); api.flag('ducVuEntrer', true); api.chips([{ label: 'Entrer derrière lui', action: 'lr_entrer' }, { label: 'Attendre dehors', action: 'lr_guetter' }]); return true; }
    }
    if (api.flag('ducEntre') && !api.flag('temoin') && !api.flag('meurtre') && !api.flag('interrompu') && m >= tAt(api, 18, 45)) {
      api.flag('meurtre', true); api.flag('meurtreW', true); api.flag('meurtreE', true); api.flag('portesOuvertes', true);
    }
    // Edgar se réveille, si on l'a sauvé
    if (edgarEveille(api) && !api.flag('edgarParle') && enBoutique(api)) { api.go('la_etage', true); reveilEdgar(api); return true; }
    // la police frappe, si la porte de la rue est restée ouverte
    // (au temps passé là-haut, et non au nombre de gestes : les tours qui finissent sur un jet ne passent pas par ici)
    if (api.flag('crimeVu') && api.s.loc === 'la_etage' && !api.flag('porteFermee') && !api.flag('deposition') && !api.flag('policeVenue') && !api.flag('sauveW')) {
      if (m - (api.flag('crimeVuMin') || m) >= 20) { P.policeFrappe(api); return true; }
    }
    // les fermetures
    var p = PL[api.s.loc], h = hour(m);
    if (p && p.hours && !(h >= p.hours[0] - 1 && h < p.hours[1] && h >= 5)) {
      if (api.s.talk) api.endTalk(false);
      if (api.s.loc === 'la_chatnoir' && api.flag('maxVu') && !api.flag('maxParti')) {
        api.arrive('max');
        api.npc('max', api.flag('additionPayee') ? '« Mon ami{e}, quelle soirée ! Ils ne sont pas venus, tant pis pour eux. Tout s’arrangera demain matin, j’en suis sûr. » Il vous serre la main, très fort, et s’en va dans la nuit en sifflant.' : '« Je file, je file, on m’attend. Tout s’arrangera demain matin, j’en suis sûr ! » Il est parti avant que le garçon ait posé l’addition sur la table.');
        if (!api.flag('additionPayee')) { api.flag('additionPayee', true); api.pay(Math.min(0.9, api.s.money)); }
        api.flag('maxParti', true);
      }
      api.say(DEHORS[api.s.loc] || 'On ferme.');
      if (api.s.loc === 'la_chatnoir' && crime(api) && !api.flag('crimeVu') && !api.flag('sauveW')) api.say('Dehors, une pluie froide commence à tomber. Ni Edgar, ni le duc ne sont venus. Où sont-ils passés ?');
      api.time(3); api.go('la_cathedrale', true);
      api.say(nuit(api) ? 'Vous voilà dans la nuit de la Cité, au pied de la cathédrale.' : 'Vous voilà dehors, au pied de la cathédrale.');
      return true;
    }
    return false;
  };
  P.policeFrappe = function (api) {
    api.flag('policeVenue', true);
    if (api.s.talk) api.endTalk(false);
    api.say('Des coups contre la porte d’en bas. Une voix, en français, haute et officielle : « Monsieur Wellington ? Police ! La porte est ouverte, monsieur Wellington. Nous entrons. »');
    api.chips([{ label: 'Fuir par l’arrière-cour', action: 'le_fuir' }, { label: 'Descendre leur parler', action: 'le_police' }]);
  };
  P.locations.la_etage.actions.push(
    { id: 'le_fuir', label: 'Fuir par l’arrière-cour', verbs: ['FUIR', 'SORTIR', 'CACHER'], nouns: ['PORTE', 'ESCALIER', 'ATELIER'], repeatable: true,
      cond: function (api) { return !!api.flag('policeVenue') && !api.flag('deposition') && !api.flag('fui'); },
      run: function (api) { api.flag('fui', true); api.say('Vous dévalez l’escalier de service, traversez l’atelier où le petit chevreuil écorché vous regarde de ses orbites vides, ouvrez la porte basse, et vous voilà dans une ruelle noire sous la pluie. Derrière vous, des lampes, des voix, un sifflet.'); api.say('Vous courez jusqu’à ne plus entendre que votre souffle. Puis vous rentrez à l’hôtel par des rues que vous ne connaissiez pas, en marchant comme quelqu’un qui n’a rien à cacher.'); api.time(25); api.go('la_hotel', true); } },
    { id: 'le_police', label: 'Descendre parler à la police', verbs: ['PARLER', 'DESCENDRE', 'DEPOSER'], nouns: ['POLICE'], repeatable: true,
      cond: function (api) { return !!api.flag('policeVenue') && !api.flag('deposition') && !api.flag('fui'); },
      run: function (api) { api.say('Vous descendez, les mains bien en vue. Deux agents en pèlerine, une lanterne, un sergent qui vous regarde comme une vitrine cassée. « Vous. Expliquez-vous. »'); api.check('credit_police'); } }
  );
  P.locations.la_boutique.actions.push(
    { id: 'lb_attendre', label: 'Attendre dans la boutique', verbs: ['ATTENDRE', 'ASSEOIR'], nouns: ['BOUTIQUE', 'HEURE', 'EDGAR'], repeatable: true,
      cond: function (api) { return !crime(api) && edgarRentre(api) && !api.flag('temoin'); },
      run: function (api) { api.say('William vous installe près du feu, dans un fauteuil qui sent le camphre, et vous sert une tasse de thé noir. Il s’assied en face de vous, et vous regarde boire.'); var t = tAt(api, 18, 20); if (api.s.min < t) { api.s.min = t - 1; api.s.tick = 1; } } }
  );

  // ================================================================ réponses générales, horaires, humeur
  P.generic = Object.assign({}, L.generic, {
    loop: ['Vous tournez en rond. Lausanne, elle, ne tourne pas : elle descend.', 'Il y a sûrement autre chose à tenter.', 'Il faudrait changer d’approche.'],
    lost: ['Vous hésitez. Le rouleau, Edgar, le duc : par quel bout reprendre ?', 'Vous consultez votre carnet. Le fil est là, quelque part entre deux pages.'],
    verbs: Object.assign({}, L.generic.verbs, {
      ALLER: function (api) { if (reve(api)) return 'Les rues de ce rêve ne mènent pas où l’on veut. Elles mènent où elles veulent.'; if (train(api)) return 'Le train vous emporte. Vous pouvez aller au wagon-restaurant, ou rester dans votre compartiment.'; var c = destChips(api); return c.length ? 'Pour aller où ? Vous connaissez : ' + c.map(function (x) { return x.label.replace('Aller : ', ''); }).join(', ') + '.' : 'Vous ne connaissez pas encore d’autre adresse à Lausanne.'; }
    })
  });
  var DISPO = {
    jeanclaude: { f: function (api) { var h = hour(api.s.min); return h >= 5 && h < 12 ? null : 'Jean-Claude a fini son service. Un autre porteur, plus jeune, dort debout près de la consigne.'; } },
    chappuis: { h: [9, 17], x: 'La bibliothèque est fermée. Mlle Chappuis est rentrée chez elle.' },
    guet: { f: function (api) { var h = hour(api.s.min); return h >= 21 || h < 2 ? null : 'Le guet ne monte dans sa tour qu’à la nuit.'; } },
    max: { f: function (api) { return P.maxLa(api) || api.s.talk === 'max' ? null : 'Max n’est pas là.'; } },
    edgar: { f: function (api) { return P.edgarLa(api) || reve(api) ? null : 'Edgar n’est pas là.'; } },
    william: { f: function (api) { return P.williamLa(api) ? null : 'William n’est pas là.'; } },
    duc: { f: function (api) { return api.flag('visite') || reve(api) || train(api) || api.s.talk === 'duc' ? null : 'Le duc n’est pas là.'; } }
  };
  P.dispo = DISPO;
  P.disponible = function (api, id) {
    var d = DISPO[id]; if (!d || (P.pnjIci && P.pnjIci(api, id))) return null;
    if (d.f) return d.f(api);
    var h = hour(api.s.min);
    if (jour(api) === 'dimanche' && id === 'chappuis') return 'Le dimanche, la bibliothèque est fermée.';
    return (h < d.h[0] || h >= d.h[1]) ? d.x : null;
  };
  P.boutiquesOuvertes = function (api) { var h = hour(api.s.min); return h >= 8 && h < 19 && jour(api) !== 'dimanche'; };
  P.humeur = {
    cd: { bz: 120, ins: 360 },
    plainte: function (api, id) { var p = api.flag('plainte') || { n: 0 }; p.n++; p.qui = id; p.depuis = api.s.min; p.traitee = false; api.flag('plainte', p); },
    arreter: function (api, id) {
      var n = (api.flag('arrestations') || 0) + 1; api.flag('arrestations', n);
      api.endTalk(false);
      if (train(api)) { api.say('Le chef de brigade fait arrêter le train à Brigue. Deux gendarmes valaisans montent dans la neige, et vous redescendez avec eux.'); api.flag('fin', 'prison'); api.end(); return; }
      api.vue('situations/03_hotel-de-police-de-lausanne', 'L’hôtel de police');
      if (api.flag('fugitif')) { api.say('À l’hôtel de police, on relève votre nom. Une heure plus tard, le commissaire pose devant vous un télégramme de Londres, avec votre signalement. « La Suisse est un pays neutre, {m}. Elle n’est pas un refuge. »'); api.flag('fin', 'extrade'); api.end(); return; }
      if (n >= 3) { api.say('« Encore vous. » Le commissaire Rochat ne lève pas les yeux. « Cette fois, c’est le juge. »'); api.flag('fin', 'prison'); api.end(); return; }
      api.say(n === 1 ? 'Deux agents en pèlerine vous prennent chacun par un coude. Quelques heures dans un bureau de l’hôtel de police, sous le portrait du général Dufour, puis le commissaire Rochat vous rend vos papiers. « Vous êtes étranger. Je veux bien croire à un malentendu. Une fois. »' : 'Le même bureau, le même portrait. Cette fois, l’amende est de cinquante francs suisses. « La prochaine fois, c’est le juge. »');
      api.time(180);
      if (n > 1) api.pay(Math.min(2, api.s.money));
      if (id && P.npcs[id]) api.npcs(id).closedUntil = api.s.min + 100000;
      api.go('la_hotel');
    }
  };
  var VIOLENCE = /\b(tue[rsz]?|abat\w*|frappe[rsz]?|cogne[rsz]?|etrangl\w*|poignard\w*|egorg\w*|assomm\w*|gifl\w*|tabass\w*|coups? de (poing|pied|tete|couteau)|tire[rsz]? sur|agress\w*|bouscul\w*|empoign\w*|saute[rsz]? (dessus|a la gorge))\b/;
  P.intercept = function (api, p, raw) {
    if (P.interceptReve && P.interceptReve(api, p, raw) === true) return true;
    if (G.RPG.recit(raw) || raw.indexOf('?') >= 0) return false;
    var t = ' ' + G.RPG.normalize(raw) + ' ';
    if (!VIOLENCE.test(' ' + t.trim().split(/\s+/).slice(0, 6).join(' ') + ' ') || /\b(porte|fenetre|mur|table|vitre)\b/.test(t)) return false;
    var qui = api.s.talk;
    if (!qui) return false;
    if (qui === 'duc') { api.say('Votre poing part. Il rencontre la joue du duc, et glisse dessus comme sur du marbre huilé. Le duc ne bouge pas. Il vous regarde avec une grande douceur. « Allons. Allons. » Votre main vous fait mal jusqu’au coude.'); api.lose(1); return true; }
    if (qui === 'william') { api.say('William ne recule pas, ne pare pas. Il vous regarde, et c’est vous qui baissez le bras.'); return true; }
    api.say('Votre geste part avant votre pensée. ' + (P.npcs[qui].short || 'On') + ' crie. ' + (train(api) ? 'Dans un train, tout un wagon se lève d’un coup.' : 'En Suisse, on crie peu, mais on appelle vite.'));
    api.lose(1);
    P.humeur.arreter(api, qui);
    return true;
  };

  // ================================================================ ce que Paris a laissé
  function passe(api) { return ((api.pc && api.pc.passe) || {}).paris || null; }
  function dateLongue(min) { var d = day(min), wd = JOURS[(4 + d) % 7]; return wd.charAt(0).toUpperCase() + wd.slice(1) + ' ' + (5 + d) + ' janvier 1923'; }
  P.intro = function (api) {
    var pa = passe(api), f = (pa && pa.drapeaux) || {}, a = function (id) { return !!pa && (pa.indices || []).indexOf(id) >= 0; };
    if (pa && typeof pa.min === 'number') { api.s.min = Math.floor(pa.min / D) * D + 6 * 60 + 45; api.s.tick = 0; }
    api.flag('j0', day(api.s.min));
    ['fugitif', 'billetsScala', 'brasPris', 'lettre', 'gueris', 'lorienAmis', 'ariaEntendue', 'brume'].forEach(function (k) { if (f[k]) api.flag(k, f[k]); });
    api.title('L’Express de minuit', 'Lausanne · Nocturne');
    api.say(dateLongue(api.s.min) + ', six heures quarante-cinq. Le Simplon-Orient-Express s’arrête à Lausanne le temps de vous laisser descendre, puis repart dans un tourbillon de vapeur, et vous voilà sur un quai, dans un brouillard si épais qu’on ne voit pas la locomotive s’éloigner. On l’entend seulement, longtemps.');
    api.say('Votre billet, retenu à Londres par Smith, prévoyait cette halte : une journée à Lausanne, une chambre à l’hôtel des Alpes, et le train du lendemain matin pour Milan. Smith ne vous a jamais dit pourquoi.');
    api.clue('HALTE');
    if (f.lettre || a('LETTRE')) { api.say('Vous, vous avez une raison : dans votre portefeuille, la lettre que les Lorien n’ont jamais eu le courage de recevoir. « Edgar Wellington, 50, rue Saint-Étienne, Lausanne. » Un homme qui possède un rouleau, et qui cherche le Simulacre.'); apprendre(api, 'la_rue'); if (P.clues.LETTRE === undefined) P.clues.LETTRE = { title: 'La lettre de Lausanne', text: 'Edgar Wellington, 50 rue Saint-Étienne, à Lausanne, possède un vieux rouleau qui décrit le Simulacre de Sedefkar, et il en cherche la trace.' }; api.clue('LETTRE'); }
    if (api.item(BRAS)) api.say('Dans votre valise, entre deux chemises, le bras de statue que vous avez remonté des caves de Poissy. Il ne pèse pas ce qu’il devrait. Vous vérifiez, sans y penser, que la valise est bien fermée.');
    if (f.billetsScala) api.say('Et, dans la poche de votre veston, deux places pour la première d’Aïda, à la Scala, qu’une cantatrice vous a glissées cette nuit dans la main.');
    if (f.fugitif) api.say('À Londres, Scotland Yard a votre signalement. Ici, la police est polie, et elle est partout.');
    if (pa && api.sanState() >= 2) api.say('Dans le brouillard, les silhouettes des porteurs ont l’air de bêtes debout. Vous attendez qu’elles s’approchent pour vous assurer qu’elles ont des visages.');
    api.say('Le buffet de la gare est ouvert, et il en sort une odeur de café et de pain chaud. Un porteur à grosse moustache, les yeux gonflés de sommeil, vous fait signe.');
    api.sys('Vous incarnez ' + api.pc.name + (pa ? ', tel' + (api.pc.sex === 'f' ? 'le' : '') + ' que Paris vous a laissé' + (api.pc.sex === 'f' ? 'e' : '') : '') + '. Écrivez ce que vous faites (« Agir ») ou ce que vous dites (« Dire »).');
  };
  P.help = function (api) { api.sys('Écrivez ce que fait votre investigateur : « je vais rue Saint-Étienne », « je sonne chez Wellington », « je demande au porteur un hôtel ». Pour vous déplacer : « aller à… », ou « où aller ? ».'); };
  P.people = { jeanclaude: 'Jean-Claude, porteur à la gare de Lausanne', burnier: 'M. Burnier, réception de l’hôtel des Alpes', edgar: 'Edgar Wellington, taxidermiste', william: 'William Wellington, son frère, muet', duc: 'Le duc Jean Floressas des Esseintes', max: 'Max von Wurtheim, du club de sept heures et demie', guet: 'Abel Morel, le guet de la cathédrale', chappuis: 'Mlle Chappuis, bibliothèque cantonale', rochat: 'Le commissaire Rochat', morand: 'Morand, conducteur des Wagons-Lits', maitre: 'Le maître d’hôtel du wagon-restaurant' };
  P.timeEvents = [];
  P.pregens = L.pregens;
  P.investigator = L.pregens[0];
  P.improvise = function (api, p) {
    if (P.improviseReve && P.improviseReve(api, p)) return true;
    var t = ' ' + G.RPG.normalize(p.raw || '') + ' ';
    if (enVille(api) && !api.s.talk && /\b(ouchy|bord du lac|me promener|promenade|flaner|faire un tour|visiter la ville)\b/.test(t)) {
      api.say(api.fresh('flanerL', ['Vous descendez à Ouchy par la Ficelle. Le lac clapote contre les quais, gris sous le gris ; des cygnes attendent du pain avec une dignité de délégués. Vous remontez sans avoir rien appris, et un peu reposé{e}.', 'Vous marchez au hasard dans la vieille ville : des escaliers, des fontaines, des arcades, une librairie où l’on vend la même gazette en trois langues. Lausanne est polie avec vous. Elle ne vous dit rien.']));
      api.time(90); return true;
    }
    return false;
  };

  // ================================================================ la conversation libre : qui ils sont, ce qu'ils savent
  P.fiches = {
    jeanclaude: { groupe: 'peuple', reg: 'populaire', pa: true, tics: ['Remarquez,', 'Allez,'],
      dada: ['Avec la conférence, on a des malles plein le quai, et des pourboires en huit monnaies.', 'Le brouillard, c’est la bise qui manque. Quand elle revient, on voit le Mont-Blanc.'],
      moi: { nom: '« Rapin, Jean-Claude. Mais tout le monde dit Jean-Claude. »', age: '« Cinquante-deux ans. »', origine: '« D’Échallens, à côté. Des paysans, chez nous. »', famille: '« Une femme, trois filles, et un gendre qui vend des assurances. »', metier: '« Porteur à la gare. Trente ans de quai. »', loisirs: '« La pêche, le dimanche, à Ouchy. Je prends rien, mais je prends l’air. »' },
      sait: { HOTEL: '« L’hôtel des Alpes, c’est du solide. »', CATHEDRALE: '« Cent soixante marches. Comptez-les, ça passe le temps. »', TRAIN: '« Le Simplon-Orient, six heures quarante-cinq, tous les matins. »' } },
    burnier: { groupe: 'hotel', reg: 'formel', pa: true, tics: ['Si vous me permettez,', 'Naturellement,'],
      dada: ['Nous avons eu un prince persan au deuxième, l’an passé. Il faisait cuire du mouton dans sa baignoire.', 'Le lac ne gèle jamais. Il a essayé, en 1891.'],
      moi: { nom: '« Burnier, Émile. »', age: '« Je ne compte plus, depuis la cinquantaine. »', origine: '« De Vevey. »', famille: '« Une épouse, qui tient la lingerie, et un fils pasteur à Neuchâtel. »', metier: '« Chef de réception. Je sais qui est dans quelle chambre, et je ne le dis jamais. »', loisirs: '« La philatélie. Les timbres ne se plaignent pas du petit déjeuner. »' },
      sait: { CONFERENCEL: '« Une conférence, c’est une bonne saison sans touristes. »', DUC: '« Un client exigeant et généreux. Les deux vont ensemble. »' } },
    edgar: { groupe: 'occultiste', reg: 'formel', pa: true, tics: ['Voyez-vous,', 'À vrai dire,'],
      dada: ['On ne trouve pas de bon tabac anglais à Lausanne. On trouve tout le reste.', 'William a mis trois mois à faire cet ours. Il ne fait plus d’ours.'],
      moi: { nom: '« Edgar Wellington. Edgar suffira. »', age: '« Trente-cinq ans. Je sais, je ne les fais pas. Je fais ceux de mon père. »', origine: '« Du Hampshire. Une maison de briques, un jardin, un vicaire le dimanche. »', famille: '« William. Et une tante à Londres qui nous envoie des rentes et des reproches. »', metier: '« Taxidermiste, en principe. »', loisirs: '« La lecture. Les livres qu’on ne trouve pas. »' },
      sait: { DUC: '« Le duc connaît tout le monde, et personne ne le connaît. »', WILLIAM: '« William comprend tout. Il ne peut juste plus le dire. »', ROULEAU: '« Il est en lieu sûr. »' } },
    william: { groupe: 'peuple', reg: 'sec', pa: true, tics: [],
      dada: ['Il écrit : « Les marmottes se vendent bien. »', 'Il écrit : « Le chevreuil n’a pas l’air surpris. »'],
      moi: { nom: 'Il écrit : « William. »', age: 'Il écrit : « 28. »', origine: 'Il écrit : « Hampshire. »', famille: 'Il écrit : « Edgar. » Puis il souligne.', metier: 'Il montre ses mains.', loisirs: 'Il écrit : « Je dors. »' },
      sait: { OURS: 'Il écrit : « Le premier. »', DUC: 'Il écrit : « Les bouteilles vertes. »', EDGAR: 'Il écrit : « Fatigué. »' } },
    duc: { groupe: 'occultiste', reg: 'soutenu', tics: ['Mon cher,', 'Voyez-vous,'],
      dada: ['Je ne mange que des choses qui ont été autre chose avant. La truite qui imite le saumon, le saumon qui imite le homard.', 'Une ville neutre, c’est une ville qui n’a pas encore choisi son camp. J’attends qu’elle choisisse.'],
      moi: { nom: '« Jean Floressas des Esseintes. Le dernier. »', age: '« L’âge qu’on me donne. On me donne toujours moins. »', origine: '« D’un château près de Paris, qui n’existe plus, et d’une famille, qui n’existe presque plus. »', famille: '« Je suis ma famille. C’est une famille très unie. »', metier: '« Je ne travaille pas. Je collectionne. »', loisirs: '« Les parfums, les pierres, les livres rares, les gens. »' },
      sait: { EDGAR: '« Edgar a besoin d’argent. Les gens qui ont besoin d’argent sont si reposants : on sait toujours ce qu’ils veulent. »', LAUSANNE: '« Lausanne dort mal. Je la veille. »' } },
    max: { groupe: 'mondain', reg: 'mondain', tics: ['Ach,', 'Mon ami{e},'],
      dada: ['À Monte-Carlo, j’ai perdu un château au baccara. Un petit château.', 'Les femmes de Lausanne sont protestantes jusqu’à minuit. Après, on discute.'],
      moi: { nom: '« Maximilian Ernst von Wurtheim. Max pour mes amis, c’est-à-dire pour vous. »', age: '« Vingt-six ans. L’âge de toutes les injustices. »', origine: '« De Prusse orientale. Un château, des forêts, des étangs. Ils sont à mon frère, pour l’instant. »', famille: '« Un frère, Konrad, qui me hait. Une nourrice, Anna, qui m’aimait. »', metier: '« J’attends mon héritage. C’est un métier à plein temps. »', loisirs: '« Le baccara, le tango, et la conversation. Surtout la conversation. »' },
      sait: { DUC: '« Un homme exquis. »', EDGAR: '« Un garçon triste, avec un trésor. »' } },
    guet: { groupe: 'peuple', reg: 'populaire', pa: true, tics: ['Voyez,', 'Tenez,'],
      dada: ['Une nuit de 1911, j’ai crié l’heure avec une heure d’avance. Personne ne s’en est aperçu, sauf ma femme.', 'Le froid, on s’y fait. C’est le silence qu’on ne s’y fait pas.'],
      moi: { nom: '« Morel, Abel. »', age: '« Soixante et un ans, dont quarante là-haut. »', origine: '« De la Cité même. Je suis né à l’ombre de la tour. »', famille: '« Une femme, qui dort quand je travaille, et qui travaille quand je dors. »', metier: '« Je crie l’heure. C’est moins simple qu’on croit. »', loisirs: '« Les pigeons. Je les compte. »' },
      sait: { CATHEDRALE: '« Elle a six cents ans, et elle bouge, la nuit. Un peu. »', SUICIDES: '« Un par mois. »' } },
    chappuis: { groupe: 'savant', reg: 'formel', pa: true, tics: ['À vrai dire,', 'Voyez-vous,'],
      dada: ['Un pasteur de Morges nous a légué quatre mille volumes de théologie et un herbier. Les lecteurs vont à l’herbier.', 'La conférence nous envoie des secrétaires qui veulent des cartes de 1878. Nous en avons.'],
      moi: { nom: '« Chappuis, Hélène. »', age: '« Vingt-sept ans. »', origine: '« De Lausanne, du quartier de Saint-Laurent. »', famille: '« Mes parents, et un frère étudiant en médecine à Berne. »', metier: '« Bibliothécaire adjointe, chargée du fonds ancien. »', loisirs: '« Je fais de la montagne, l’été. Là-haut, on ne range rien. »' },
      sait: { MUSEEC: '« Les coquillages sont très beaux. Ne le dites pas au conservateur, il en ferait une conférence. »', LIVRE: '« Tout est classé, sauf ce qui ne veut pas l’être. »' } },
    rochat: { groupe: 'police', reg: 'sec', pa: true, mefiant: 0.8, tics: ['Bon.', 'Voyons,'],
      dada: ['Trois cents délégués, et chacun croit être le seul à être suivi.', 'Le canton veut un rapport par jour. Moi, je veux qu’il ne se passe rien. Les deux sont incompatibles.'],
      moi: { nom: '« Rochat. Commissaire. »', age: '« Cinquante ans. »', origine: '« D’Yverdon. »', famille: '« Cela ne figure pas dans le dossier. »', metier: '« Je maintiens l’ordre dans une ville qui n’en manque pas. D’habitude. »', loisirs: '« Le tir à l’arc. Je n’aime pas les armes à feu. »' },
      sait: { CONFERENCEL: '« Des diplomates, des espions, des journalistes. On ne sait pas toujours lesquels sont lesquels. »' } },
    morand: { groupe: 'domestique', reg: 'formel', pa: true, tics: ['Si {M} permet,', 'Naturellement,'],
      dada: ['La neige, au Simplon, elle n’attend jamais d’être annoncée.', 'Quinze ans de Compagnie. Je connais chaque courbe entre Lausanne et Trieste.'],
      moi: { nom: '« Morand, Lucien, conducteur de la voiture 3. »', age: '« Trente-huit ans, {m}. »', origine: '« De Sion, en Valais. Je passe devant chez moi tous les deux jours. »', famille: '« Une femme, deux garçons, et une mère qui me croit chef de gare. »', metier: '« Je fais les lits, je garde les passeports, et je ne vois rien. »', loisirs: '« Le service ne laisse guère de loisirs, {m}. »' },
      sait: { TRAIN: '« Le Simplon-Orient va jusqu’à Constantinople. »' } },
    maitre: { groupe: 'domestique', reg: 'formel', pa: true, tics: ['{M},'],
      dada: ['On sert le potage avant le tunnel. Après, il refroidit.'],
      moi: { nom: '« Le maître d’hôtel, {m}. »', age: '« Je ne saurais dire. »', origine: '« De la Compagnie. »', famille: '« La Compagnie. »', metier: '« Je place les gens, {m}. »', loisirs: '« Les chaises, {m}. Je les compte. »' } }
  };
  P.rumeurs = {};
  // la culture de Lausanne, en janvier 1923 : ce qu'on répond ici, avant ce qu'on répondrait à Paris
  P.culture = {
    brouillard: ['« Le brouillard, en hiver, c’est le lac qui fume. Quand la bise revient, on voit le Mont-Blanc, et on oublie qu’on l’a maudit. »', '« Un temps à ne pas mettre un délégué dehors. Ils sortent quand même : ils ont des parapluies de leur pays. »'],
    paris: ['« Lausanne ? Une ville qui monte et qui descend, et qui ne se presse jamais. On y vient pour se soigner, pour étudier, ou pour s’ennuyer en paix. »', '« C’est une petite ville, mais tout le monde y passe. Les princes russes, les malades anglais, les révolutionnaires. Ils repartent tous, et nous, on reste. »'],
    londres: ['« Londres ? On dit que c’est grand comme le canton. Ici, on a les Anglais de la clinique et ceux des pensions de famille. Ils sont très polis, et ils prennent le thé à quatre heures. »'],
    turquie: ['« La conférence ? On y discute des Détroits, de Mossoul, de la Grèce. Les Turcs ont un général qui ne cède sur rien, et les Anglais un lord qui ne cède sur rien non plus. Ça peut durer. »', '« Depuis novembre, on a des délégués dans tous les hôtels, et des espions dans tous les cafés. Les garçons de café n’ont jamais eu de si bons pourboires. »'],
    gouvernement: ['« Chez nous, le gouvernement, c’est sept conseillers fédéraux que personne ne reconnaît dans la rue. C’est le meilleur gouvernement du monde : on ne l’entend jamais. »', '« La politique ? Ici on vote sur tout, même sur le prix du lait. Ça occupe les dimanches. »'],
    ruhr: ['« Les Français sont entrés dans la Ruhr, ou ils vont y entrer. Ici, on regarde ça de loin, en comptant les francs suisses. On a de la chance. »', '« L’Allemagne ? On a des Allemands à Lausanne qui ne rentrent plus chez eux. Avec ce que vaut le mark, ils ont bien raison. »'],
    mussolini: ['« L’Italie, c’est de l’autre côté du Simplon. Depuis l’automne, ils ont des chemises noires et un ancien journaliste qui crie. Nos Tessinois n’aiment pas ça du tout. »', '« Mussolini ? Il a vécu ici, paraît-il, avant la guerre, et la police l’a reconduit à la frontière. Elle ne le reconduirait plus, maintenant. »'],
    russie: ['« Des Russes, on en a eu beaucoup, avant. Des étudiants, des exilés, des princes. Certains sont rentrés faire leur révolution. Les princes, eux, sont restés. »'],
    guerre: ['« Nous n’avons pas fait la guerre. Nous avons eu les blessés, les internés, les réfugiés, et la grippe. C’est déjà beaucoup. »', '« On a gardé la frontière pendant quatre ans, en entendant le canon d’Alsace. On ne savait pas si on avait de la chance ou honte. »'],
    argent: ['« La vie est chère, mais le franc tient. C’est ce qui nous distingue du reste de l’Europe, avec les montagnes. »', '« Tout le monde vient mettre son argent en Suisse. Le pain, lui, ne baisse pas pour autant. »'],
    train: ['« Le Simplon-Orient passe chaque matin. Les enfants vont le regarder depuis le pont, et ils font des signes aux voyageurs, qui ne répondent jamais. »', '« Le tunnel du Simplon, vingt kilomètres sous la montagne. On l’a percé avec les Italiens. Ça a coûté des morts, et ça nous a mis à une demi-journée de Milan. »'],
    sommeil: ['« Lausanne, c’est une ville où l’on dort bien. Enfin, c’est ce qu’on dit. Ces dernières années, beaucoup de gens disent qu’ils rêvent mal. »', '« Vous avez mauvaise mine. Le brouillard, sans doute. Il entre dans les chambres. »'],
    table: ['« Si vous avez faim, prenez une fondue. Avec du pain, du kirsch et des amis, c’est un repas. Sans amis, c’est un pansement. »', '« Les perches du lac, au beurre. Il n’y a rien de meilleur, et ça ne coûte presque rien. »'],
    boisson: ['« Un verre de blanc du Lavaux ? C’est le vin des vignes en terrasses, au-dessus du lac. On le boit frais, et sans y penser. »', '« Le vin d’ici est léger. Ce sont les gens qui le boivent qui sont lourds. »'],
    tabac: ['« Des cigarettes turques, avec la conférence, on en trouve à tous les kiosques. Ça sent le cuir et la poussière. »'],
    cinema: ['« Le cinéma ? Il y en a un au Flon, et un place Saint-François. On y passe les films de Paris avec six mois de retard, et Charlot en avance. »'],
    soiree: ['« Le soir, ici, tout ferme tôt. Il reste les cafés de la Cité, et le guet qui crie l’heure. »'],
    dieu: ['« Nous sommes protestants, ici, depuis les Bernois. La cathédrale n’a plus d’autel ni de statues, sauf celles des tombeaux. Dieu y est plus à l’étroit qu’avant. »'],
    spiritisme: ['« Les esprits ? Il y a des dames qui font tourner des tables, rue de Bourg, le jeudi. Les pasteurs n’aiment pas ça, et les tables non plus. »', '« Depuis la guerre, on veut parler aux morts. Moi, je trouve qu’ils ont bien mérité qu’on les laisse tranquilles. »'],
    voyages: ['« Voyager ? Je suis allé jusqu’à Berne, une fois, pour l’exposition. Ça m’a suffi pour la vie. »', '« Tout le monde passe par ici. Il suffit de rester assis pour voir le monde. »'],
    sante: ['« La santé ? Ici on en vend. Les cliniques, les sanatoriums, les cures de lait. La moitié des Anglais de Lausanne sont malades, et l’autre moitié les soigne. »'],
    sport: ['« Le sport ? La luge, à Noël, et le ski, pour les Anglais. Les Anglais ont inventé le ski chez nous. Nous, on marchait. »'],
    musique: ['« La musique ? Des fanfares, des chorales, et le dimanche, l’orgue de la cathédrale. Pour le jazz, il faut aller à Montreux, chez les riches. »']
  };
  if (G.RPG.Parole) P.converse = G.RPG.Parole.make(P);

  // ---------------------------------------------------------------- Réfléchir (le jet d'Idée) : une piste concrète, selon où l'on en est
  var CONSEILS_L = [
    { cond: function (api) { return !connu(api, 'la_rue'); }, x: 'Smith a voulu que vous vous arrêtiez à Lausanne. Le porteur, la gazette du buffet, la réception de l’hôtel : à six heures du matin, ce sont les seuls qui sachent quelque chose de cette ville.' },
    { cond: function (api) { return !api.flag('edgarVu') && !crime(api) && hour(api.s.min) < 16; }, x: 'Rue Saint-Étienne, au 50, Edgar Wellington attend des acheteurs. Pas avant neuf heures : même les taxidermistes dorment.' },
    { cond: function (api) { return !!api.flag('the') && !api.flag('parleRouleau'); }, x: 'Edgar vous parle de Londres pour ne pas vous parler d’autre chose. C’est le rouleau qui vous amène : demandez-le-lui, et son prix.' },
    { cond: function (api) { return !!api.flag('ducVenu') && !api.flag('visiteFinie') && !api.flag('ducFenalik'); }, x: 'Le duc vous fait visiter sa ville comme on fait visiter sa maison. Parlez-lui du comte Fenalik, et regardez ses yeux.' },
    { cond: function (api) { return !!api.flag('visiteFinie') && !crime(api) && !api.flag('temoin') && mn(api) < 18 * 60 + 20 && !connu(api, 'la_pre'); }, x: 'Le duc a un rendez-vous d’affaires qu’il n’a pas nommé, et Edgar va « chercher son rouleau ». Où va un homme comme le duc à six heures du soir ? On pourrait le suivre, ou retourner rue Saint-Étienne avant la nuit.' },
    { cond: function (api) { return !!api.flag('visiteFinie') && !crime(api) && !api.flag('temoin') && mn(api) < 18 * 60 + 20; }, x: 'Edgar rentre chez lui vers six heures, et le duc sait où il habite. Mieux vaudrait être rue Saint-Étienne avant le duc.' },
    { cond: function (api) { return crime(api) && !api.flag('crimeVu') && !api.flag('edgarSauve'); }, x: 'Ni Edgar, ni le duc ne sont venus. Un homme qui veut vendre ne manque pas son acheteur. Il est arrivé quelque chose, rue Saint-Étienne.' },
    { cond: function (api) { return !!api.flag('crimeVu') && !api.flag('edgarVuMort') && !api.flag('sauveE'); }, x: 'La chambre d’Edgar. Ce qu’il a laissé sur sa table de nuit dira comment il est mort, et peut-être pourquoi.' },
    { cond: function (api) { return !!api.flag('edgarVuMort') && !api.item(JOURNAL); }, x: 'Edgar écrivait. Un homme qui écrit tous les soirs laisse toujours la page du dernier soir quelque part.' },
    { cond: function (api) { return api.item(JOURNAL) && !api.has('JOURNALE'); }, x: 'Le journal d’Edgar. Une heure de lecture, et vous saurez ce qu’il faisait de ses nuits.' },
    { cond: function (api) { return !!api.flag('crimeVu') && !api.flag('porteFermee') && !api.flag('deposition') && api.s.loc === 'la_etage' && !api.flag('policeVenue'); }, x: 'La porte d’en bas est restée ouverte, sur une rue où passe la ronde. Si quelqu’un la voit…' },
    { cond: function (api) { return api.has('JOURNALE') && api.item(FIOLE) && !api.flag('reveFait') && !api.item(ROULEAU); }, x: 'Le rouleau est dans la boutique du rêve, « dans le premier que nous avons fait » : l’ours de l’escalier. Pour y aller, il faut faire comme Edgar. La fiole verte. Et si Edgar est mort là-bas en dormant, il y est peut-être encore.' },
    { cond: function (api) { return api.item(FAUX) && !api.flag('fauxJuge'); }, x: 'Le rouleau scellé, sous le lit. Un rouleau qui a l’air si vieux, chez un homme qui achetait de la cire à cacheter aujourd’hui ?' },
    { cond: function (api) { return train(api) && api.item(FAUX) && !api.flag('chaise'); }, x: 'Le duc veut le rouleau. Il ne l’a jamais vu. Edgar le savait, et il avait préparé ce qu’il fallait.' },
    { cond: function (api) { return !!api.flag('crimeVu') && !api.flag('deposition'); }, x: 'Deux morts, et vous étiez là. Rester, c’est la police ; partir, c’est le train de six heures quarante-cinq. Dans les deux cas, ce que vous avez vu pèsera.' },
    { cond: function (api) { return day(api.s.min) > j0(api) && enVille(api); }, x: 'Le Simplon-Orient passe à six heures quarante-cinq, et ne repasse que le lendemain.' }
  ];
  if (L.jets) P.jets = Object.assign({}, L.jets, { lieux: {}, idee: function (api) { if (P.conseilReve) { var cr = P.conseilReve(api); if (cr) return { x: cr }; } var c = CONSEILS_L.filter(function (k) { try { return k.cond(api); } catch (e) { return false; } })[0]; return c ? { x: c.x } : null; } });
  P._conseils = CONSEILS_L;
  var HT = G.RPG.Humeur && G.RPG.Humeur.T;
  if (HT) {
    HT.jeanclaude = { kind: 'appel', vite: 'calme', sup: 'le chef de gare', police: true };
    HT.burnier = { kind: 'appel', vite: 'calme', sup: 'un agent', police: true };
    HT.edgar = { kind: 'faible', vite: 'normal' };
    HT.william = { kind: 'fort', vite: 'calme' };
    HT.duc = { kind: 'froid', vite: 'calme' };
    HT.max = { kind: 'froid', vite: 'calme' };
    HT.guet = { kind: 'froid', vite: 'normal' };
    HT.chappuis = { kind: 'appel', vite: 'normal', sup: 'le conservateur', police: true, f: true };
    HT.rochat = { kind: 'appel', vite: 'vif', sup: 'ses agents', police: true };
    HT.morand = { kind: 'appel', vite: 'calme', sup: 'le chef de brigade', police: true };
    HT.maitre = { kind: 'appel', vite: 'calme', sup: 'le chef de brigade', police: true };
  }

  // ================================================================ le fil de l'intrigue
  P.fils = {
    jeanclaude: [{ t: 'wellington', cond: function (api) { return (api.has('LETTRE') || api.has('ANNONCE')) && !api.s.visited.la_rue; }, x: '« Vous cherchez quelqu’un, en ville ? À votre tête, vous cherchez quelqu’un. »' }, { t: 'hotel', cond: function (api) { return !api.s.visited.la_hotel; }, x: '« Je vous appelle un fiacre pour l’hôtel ? Vous avez l’air d’avoir besoin d’un lit. »' }],
    edgar: [{ t: 'rouleau', cond: function (api) { return !api.flag('parleRouleau'); }, x: 'Il allume une cigarette à la précédente. « Mais vous n’êtes pas venu{e} jusqu’ici pour m’entendre parler du prix du tabac. »' }, { t: 'prix', cond: function (api) { return !!api.flag('parleRouleau') && !api.flag('prixDit'); }, x: '« Parlons franchement, entre Anglais. Vous voulez savoir combien. »' }],
    duc: [{ t: 'lausanne', x: 'Il s’arrête, la canne levée vers les toits. « Vous ne m’avez pas demandé ce que Lausanne a de plus remarquable. On me le demande toujours. »' }, { t: 'lui', x: '« Vous vous demandez qui je suis. Tout le monde se le demande. Demandez-le-moi. »' }],
    max: [{ t: 'histoire', x: '« Mais je ne vous ai pas encore raconté le plus beau. »' }, { t: 'duc', cond: function (api) { return !connu(api, 'la_pre'); }, x: '« Le duc, voyez-vous, est un homme très secret. Je sais où il habite, moi. Je sais toujours où habitent les gens qui ont de l’argent. »' }],
    guet: [{ t: 'maison', cond: function (api) { return !connu(api, 'la_pre'); }, x: 'Il lève sa lanterne vers les toits. « Vous voyez ces maisons ? Toutes allumées, à un moment de la nuit. Toutes, sauf une. »' }],
    chappuis: [{ t: 'occulte', cond: function (api) { return !api.has('KULTEN'); }, x: '« Si c’est pour des livres bizarres, dites-le. Ici, on n’a pas honte des livres bizarres. On les range. »' }],
    rochat: [{ t: 'crime', cond: function (api) { return !!api.flag('crimeVu') && !api.flag('deposition'); }, x: '« Vous avez une tête à avoir quelque chose à me dire. Je me trompe rarement sur les têtes. »' }]
  };

  // ================================================================ les images (en attendant celles de Lausanne)
  var REPLI = {
    'lausanne/01_gare-de-lausanne_brouillard': 'poissy/12_gare-de-lyon_nuit', 'lausanne/02_hotel-des-alpes': 'paris/02_hotel-du-cygne_chambre_jour',
    'lausanne/03_rue-saint-etienne_cour': 'londres/14_islington_brophy-lane_nuit', 'lausanne/04_boutique-wellington': 'londres/17_boutique-makryat',
    'lausanne/05_salon-de-l-etage': 'londres/08_camberwell_salon-butter', 'lausanne/06_cathedrale_gisant': 'londres/29_eglise-st-george',
    'lausanne/07_bibliotheque-cantonale': 'paris/05_bibliotheque-nationale_salle-de-travail', 'lausanne/08_signal_panorama': 'londres/24_campagne_au-petit-matin',
    'lausanne/09_cafe-du-chat-noir': 'paris/10_cafe-de-charenton', 'lausanne/10_rue-du-pre_maison': 'londres/11_st-johns-wood_villa_nuit',
    'lausanne/11_maison-vide_porte': 'londres/12_st-johns-wood_ruines', 'lausanne/12_etage_nuit': 'londres/04_cheapside-chambre-meublee',
    'lausanne/13_compartiment_simplon': 'poissy/13_compartiment', 'lausanne/14_wagon-restaurant_neige': 'prologue/01_wagon-restaurant',
    'lausanne/15_hotel-de-police': 'paris/08_charenton_secretariat', 'situations/03_hotel-de-police-de-lausanne': 'situations/02_poste-de-la-rue-de-la-banque'
  };
  function ou(k) {
    return function (st) {
      var key = typeof k === 'function' ? k(st) : k, LI = G.PixelArt && G.PixelArt.PHOTO_LIST;
      return (!LI || LI.indexOf(key) >= 0 || !REPLI[key]) ? key : REPLI[key];
    };
  }
  P._repliPhotos = REPLI; P._ou = ou;
  G.PHOTO_SCENES = Object.assign(G.PHOTO_SCENES || {}, {
    la_gare: ou('lausanne/01_gare-de-lausanne_brouillard'),
    la_hotel: ou('lausanne/02_hotel-des-alpes'),
    la_rue: ou('lausanne/03_rue-saint-etienne_cour'),
    la_boutique: ou('lausanne/04_boutique-wellington'),
    la_etage: ou(function (st) { var f = st.flags || {}; return f.meurtre && !f.sauveW ? 'lausanne/12_etage_nuit' : 'lausanne/05_salon-de-l-etage'; }),
    la_cathedrale: ou('lausanne/06_cathedrale_gisant'),
    la_musee: ou('lausanne/07_bibliotheque-cantonale'),
    la_signal: ou('lausanne/08_signal_panorama'),
    la_chatnoir: ou('lausanne/09_cafe-du-chat-noir'),
    la_pre: ou('lausanne/10_rue-du-pre_maison'),
    la_preint: ou('lausanne/11_maison-vide_porte'),
    la_police: ou('lausanne/15_hotel-de-police'),
    tr_compartiment: ou('lausanne/13_compartiment_simplon'),
    tr_restaurant: ou('lausanne/14_wagon-restaurant_neige')
  });

  // ================================================================ ce que le chapitre laisse au suivant
  P.memoire = ['fin', 'fugitif', 'arrestations', 'rouleau', 'fauxDonne', 'vraiDonne', 'procesGagne', 'procesPerdu', 'edgarSauve', 'sauveW', 'deposition', 'ducVu', 'billetsScala', 'brasPris', 'lettre', 'lu', 'chaise', 'gueris', 'lorienAmis', 'ariaEntendue'];
  P.endingFor = function (s) {
    var f = s.flags || {};
    if (f.fin === 'prison') return { title: 'Fin : les prisons du Valais', text: 'On vous a descendu{e} du train dans la neige, menottes aux poignets. Le témoignage de M. von Wurtheim, la parole d’un duc, deux cadavres rue Saint-Étienne : il faudra des semaines à la justice suisse pour comprendre que vous n’y êtes pour rien. Le Simplon-Orient ne vous attendra pas.' };
    if (f.fin === 'extrade') return { title: 'Fin : rendu à Londres', text: 'La Suisse est neutre, mais elle a des traités. Deux inspecteurs vous raccompagnent à Calais, et l’Orient-Express partira sans vous.' };
    if (!f.milan) return null;
    var inv = s.inv || [], vrai = inv.indexOf(ROULEAU) >= 0, trad = inv.indexOf(TRAD) >= 0;
    var t = 'Milan, ' + (f.milanH || 'treize heures') + '. Le train entre en gare avec du retard, dans une pluie de plaine. ';
    t += vrai ? 'Dans votre valise, le Rouleau de la Tête et sa traduction : la voix de Sedefkar, qui parle de sa statue comme d’une fiancée. ' : trad ? 'Le duc a emporté le rouleau. Il vous reste la traduction, et ce qu’elle raconte. ' : 'Le rouleau de Sedefkar est entre les mains du duc. ';
    if (f.edgarSauve) t += 'Edgar et William Wellington sont vivants, quelque part entre Lausanne et le Hampshire. ';
    else if (f.sauveW) t += 'William Wellington est vivant. Edgar, lui, s’est effacé dans un compartiment du Simplon. ';
    if (f.chaise) t += 'Au wagon-restaurant, le maître d’hôtel compte toujours ses chaises. ';
    return { title: 'Fin du chapitre 3 : Lausanne', text: t + 'Le chapitre 4, Milan, arrive bientôt.' };
  };

  P._h = { at: at, day: day, hour: hour, jour: jour, nuit: nuit, j0: j0, tAt: tAt, connu: connu, apprendre: apprendre, enVille: enVille, reve: reve, train: train, passe: passe, dateLongue: dateLongue, ou: ou, crime: crime,
    FIOLE: FIOLE, JOURNAL: JOURNAL, FAUX: FAUX, ROULEAU: ROULEAU, TRAD: TRAD, BRAS: BRAS, RECU: RECU };
  PA.suite = 'lausanne';
  P.precedent = 'paris';
  P.nomsCommuns = Object.assign({}, PA.nomsCommuns || {}, { Saint: 1, Étienne: 1, Pré: 1, Signal: 1, Rumine: 1, Palud: 1, Dufour: 1, Ouchy: 1, Lavaux: 1, Riponne: 1, Sauvabelin: 1, Brigue: 1, Simplon: 1, Victoria: 1 });
  G.CHAPTERS.lausanne = P;
})(typeof window !== 'undefined' ? window : globalThis);

// =============================================================================
// Les suites des répliques de Lausanne : ce que chaque réplique met sur la table (voir le moteur)
// =============================================================================
(function (G) {
  'use strict';
  var P = G.CHAPTERS && G.CHAPTERS.lausanne; if (!P) return;
  function suites(npc, id, x) {
    var t = ((P.npcs[npc] || {}).topics || []).filter(function (y) { return y.id === id; })[0];
    if (t) t.suites = x; else if (G.console) G.console.warn('suites sans sujet', npc, id);
  }
  suites('jeanclaude', 'wellington', {
    frere: { chip: 'Son frère ?', mots: 'son frere, le frere, l autre, comme une vitrine', demander: ['« Un grand, avec un chapeau qu’il enlève jamais. Il parle pas. La guerre, à ce qu’on dit. Quand il vient chercher les caisses, il tourne toute la tête pour regarder le train, comme une chouette. Les gamins en ont peur. »'] },
    caisses: { mots: 'caisses, les caisses, camphre, la consigne', demander: ['« Des bêtes à empailler, je suppose. Une fois, une caisse a goutté sur le quai. J’ai pas demandé. »'] }
  });
  suites('jeanclaude', 'guet', [{
    nuit: { chip: 'Toute la nuit ?', mots: 'toute la nuit, deux heures, il dort quand', demander: ['« De dix heures à deux heures. Après, il redescend, il boit son café chez la mère Pidoux, et il dort jusqu’à midi. C’est un métier de chouette, ça aussi. »'] }
  }]);
  suites('edgar', 'rouleau', [{
    malon: { chip: 'Malon ?', mots: 'malon, raoul malon, le caporal, sa famille', demander: ['« Un garçon de la Somme, maigre comme un clou. Il disait que son arrière-grand-père avait été capitaine du roi, et qu’il avait rapporté ça d’une maison qu’on avait brûlée. Il ne savait pas lire l’arabe. Moi non plus. Il est mort à Noyon, un mois après. »'] },
    turc: { mots: 'turc, lettres arabes, bribes, traduire, traduit', demander: ['« Du vieux turc, celui des sultans, écrit comme de l’arabe. À Genève, on m’a dit que trois personnes au monde le lisaient couramment. Je n’ai trouvé que la quatrième. » Il sourit, sans joie.'] }
  }, null]);
  suites('edgar', 'william', [{
    plaques: { chip: 'Des plaques d’argent ?', mots: 'plaques, argent, crane, sous le crane, chirurgiens', demander: ['« Trois. Posées dans un hôpital de campagne, à la lumière d’une lampe à pétrole, par un chirurgien qui n’avait pas dormi depuis quatre jours. Il dit qu’elles chantent quand il fait froid. Il l’écrit, plutôt. »'] }
  }]);
  suites('duc', 'lui', [{
    soigne: { chip: 'Radicalement ?', mots: 'radicalement, soigne, vous etes soigne, comment, malade', demander: ['« J’ai changé de régime, de médecins, d’habitudes. Puis de tout le reste. » Il tapote son gilet, très tendu sur un ventre qui ne bouge pas quand il respire. « Je me suis refait, voyez-vous. Morceau par morceau. »'] }
  }, null]);
  suites('duc', 'gisant', [{
    proces: { mots: 'perdre un proces, devant dieu, un proces, sa place', demander: ['« On l’accusait de trahison. Il a dit non, on lui a donné une épée pour le prouver, et il a perdu. Dieu est un juge très simple, mon {cher} : il donne raison au plus fort. Les hommes ont mis six siècles à trouver mieux, et ils n’ont pas trouvé. »'] }
  }]);
  suites('guet', 'suicides', [{
    mot: { chip: 'Quel mot ?', mots: 'quel mot, autrement, vous appelez ca comment, le mot', demander: ['Il réfléchit longtemps. « Une ville qui fait de mauvais rêves. Les gens se réveillent fatigués, depuis la guerre. Et certains finissent par ne plus vouloir se réveiller du tout. » Il remonte sa lanterne. « C’est pas un mot, ça. C’est une phrase. »'] }
  }]);
  suites('guet', 'maison', [{
    chats: { mots: 'les chats, changent de trottoir, chats', demander: ['« Les chats, ça sait. Devant cette maison-là, ils traversent. Même le gros roux de la boulangère, qui ne traverse jamais pour personne. »'] },
    monsieur: { chip: 'Le gros monsieur ?', mots: 'gros monsieur, il entre, qui, un homme', demander: ['« Je le vois d’en haut, la nuit, deux ou trois fois par semaine. Il rentre tard. Il ne porte pas de lanterne, et il ne trébuche jamais. Ça, voyez-vous, ça m’a toujours gêné. »'] }
  }]);
  suites('chappuis', 'lecteur', {
    abime: { chip: 'Abîmé comment ?', mots: 'abime, abimes, pages, rasoir, coupees', demander: ['« Des pages coupées au rasoir, proprement, au ras de la reliure. Toujours dans les mêmes chapitres : les villes, les rêves, la peau. Je l’ai écrit dans le registre. Personne ne lit le registre. »'] }
  });
  suites('max', 'duc', {
    femme: { mots: 'une femme, un mari, il cache, ce qu il cache', demander: ['« Ou rien du tout, ce qui serait pire. Un homme qui n’a rien à cacher ne fait pas griller ses fenêtres. » Il vide son verre. « Moi, je n’ai rien à cacher. C’est pour ça que je n’ai rien. »'] }
  });
})(typeof window !== 'undefined' ? window : globalThis);

