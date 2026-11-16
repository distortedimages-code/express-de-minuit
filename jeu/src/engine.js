/* Moteur de jeu de rôle textuel scripté — analyseur tolérant aux fautes, dés d100, dialogues, horloge. */
(function (G) {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Normalisation du texte
  // ---------------------------------------------------------------------------
  var BASE_PHRASES = [
    // « je me rends à… », « je me dirige vers… » : on y va (et pas « prendre »)
    [/\b(je me|nous nous|on se|je m) (rends|rend|rendons|rendrai|rendrons|dirige|dirigeons|dirigerai)\b/g, ' je vais'],
    [/\b(me|nous|se) (rendre|diriger)\b/g, ' aller '],
    // « les gens dont la vieille dame m'a parlé » : celle qui en a parlé n'est pas celle qu'on cherche
    [/\b(dont|que|qu)\s+((?:[a-z]+\s+){0,3})(m\s+a|m\s+avait|nous\s+a|nous\s+avait|vient\s+de|venait\s+de)\s+(parle|parlee|decrit|decrite|decrits|decrites|mentionne|mentionnee|mentionnes|cite|cites|evoque|evoques|dit|montre|montres|signale|signales)\b/g, ' '],
    [/\bdont\s+(parlait|parlaient|a\s+parle|ont\s+parle)\s+((mme|madame|monsieur|mr|mrs|le|la|l)\s+)?[a-z]+\b/g, ' '],
    // « j'adore vos moustaches », « joli chapeau », « mon manteau » : l'allure de quelqu'un (la vôtre ou la sienne),
    // jamais un personnage ou un indice qui porterait le même mot (l'homme à la moustache, l'homme au chapeau…)
    [/\b(vos|votre|ton|ta|tes|mon|ma|mes|notre|nos) ((?:tres |si |bien )?(?:beaux?|belles?|jolie?s?|magnifiques?|superbes?|splendides?|grosses?|gros|grande?s?|petite?s?|longues?|longs?|vieux|vieille?s?|nouveaux?|nouvelles?|enormes?|fameuses?|fameux|elegante?s?|drole de|etranges?|curieuse?s?|curieux|propres?) )?(moustaches?|favoris|rouflaquettes|bacchantes|barbe|barbiche|bouc|cheveux|coiffure|chignon|yeux|regard|sourire|visage|figure|tete|mains?|doigts|voix|accent|chapeau|casquette|kepi|melon|feutre|bonnet|voilette|robe|jupe|costume|habit|smoking|veste|veston|manteau|pardessus|impermeable|gilet|cravate|noeud papillon|chemise|col|uniforme|tenue|bijoux|collier|bague|alliance|broche|parfum|lunettes|monocle|canne|chaussures|souliers|bottes|bottines|chale|eventail|pipe|gants|nez|oreilles|dents|teint|mine|allure|elegance|tablier|pelerine|casque|echarpe|foulard|montre)\b/g, function (m, qui) { return /^(mon|ma|mes|notre|nos)$/.test(qui) ? ' mon allure ' : ' votre allure '; }],
    [/\b(quelles?|quels?|jolie?s?|beaux?|belles?|magnifiques?|superbes?|splendides?) (moustaches?|favoris|rouflaquettes|bacchantes|barbe|barbiche|cheveux|coiffure|chignon|yeux|sourire|chapeau|casquette|robe|costume|habit|veste|manteau|gilet|cravate|uniforme|tenue|bijoux|collier|bague|lunettes|monocle|canne|chale|eventail|voix)\b/g, ' belle allure '],
    // « je prends mon chapeau et suis Beddows » : le geste accessoire ne compte pas
    [/\b(?:je )?(?:prends|prend|reprends|recupere|enfile|remets|mets|attrape|saisis|ramasse) (?:mon|ma|mes|son|sa|ses|le|la|les) (?:chapeau|manteau|pardessus|impermeable|canne|parapluie|gants|echarpe|veste|cape|pelerine|melon|feutre|bonnet|casquette|cache nez)\s+(?:et|puis)\s+(?:je )?/g, ' je '],
    // « je quitte la maison et cherche le professeur » : on y va
    [/\b(je )?(quitte|quittons|sors de|sors du|sors des|sortir de|sortir du)\s+(?:[a-z]+\s+){1,5}?(et|puis)\s+(je )?(cherche|chercher|retrouve|retrouver|rejoins|rejoindre|vais voir|va voir)\b/g, ' aller chez '],
    // « je quitte les archives et retourne chez Smith » : on garde la destination
    [/\b(je )?(quitte|quittons|quitter|sors de|sors du|sors des|sortir de|sortir du)\s+(?:[a-z]+\s+){1,5}?(et|puis|pour)\s+/g, ' '],
    [/\b(me|nous) (rends|rend|rendons|rendrai|rendrons|dirige|dirigeons|dirigerai)\b/g, ' aller '],
    // « je descends l'escalier jusqu'à la rue » : on sort
    [/\b(?:descend\w*|redescend\w*|devale\w*|sors|ressors|gagne|rejoins)\s+(?:[a-z]+\s+){0,4}?(?:dans la|vers la|a la|jusqu a la|jusque dans la|sur la)\s+rue\b/g, ' sortir '],
    // « je prends un taxi pour St John's Wood » : on y va ; « en taxi » ne change rien
    [/\b(?:je |nous )?(?:prends|prendre|prenons|hele|heler|appelle|appeler|siffle|siffler|attrape|attraper|saute dans|monte dans) (?:un |le |mon |dans un )?(?:taxi|fiacre|omnibus|metro|bus|tramway|tram|cab)\s+(?:pour|jusqu a|jusqu au|jusqu aux|vers|direction|en direction de|en direction du|et (?:je )?(?:vais|file|fonce|rentre|retourne))\s+/g, ' aller a '],
    [/\ben (taxi|fiacre|omnibus|metro|bus|tram|tramway)\b/g, ' '],
    // « je vais au British Museum pour chercher les rouleaux » : le but ne change pas le geste
    [/\b(pour|afin de|afin d)\s+(?!aller|rejoindre|rentrer|retourner|rendre|gagner)[a-z]+(er|ir|re|oir)\b.*$/g, ' '],
    // « je m'approche d'elle » : on y va
    [/\b(m|nous|s|t)\s+approch\w*\b/g, ' aller '],
    // « je vais le voir », « je vais la trouver » : on va lui parler
    [/\b(vais|va|allons|allez|aller|vas|retourne|retournons)\s+(le|la|l|les)\s+(voir|trouver|rejoindre|retrouver)\b/g, ' $2 aborder '],
    // prendre congé, faire le point
    [/\b(prendre|prends|prenez|prenons) conge\b/g, ' aurevoir '],
    [/\b(reflechi\w*|faire le point|fais le point)\b/g, ' faitlepoint '],
    [/\bs il (vous|te) plait\b/g, ' '],
    [/\bsvp\b|\bstp\b/g, ' '],
    [/\b(qu est ce que|qu est ce qu|est ce que|est ce qu)\b/g, ' '],
    [/\b(lance[rz]?|jete[rz]?|jette|tire[rz]?|roule[rz]?) (les |le )?(des|de|dee|dez)\b/g, ' lancer '],
    [/\bles des\b/g, ' lancer '],
    [/\b(jeter|jette|jete|jetez) (un )?(petit )?(coup d )?oeil\b/g, ' examiner '],
    [/\bcoup d oeil\b/g, ' examiner '],
    [/\btendre l oreille\b|\btends l oreille\b|\btend l oreille\b/g, ' ecouter '],
    [/\bpasser au peigne fin\b/g, ' fouiller '],
    [/\b(aller|vais|va|allons|allez|vas) (voir|trouver|rejoindre)\b/g, ' visiter '],
    // « voir le sergent Rigby », « demander à voir l'inspecteur » : on va lui parler, pas regarder
    [/\b(?:demander a |demande a |veux |voudrais |dois |souhaite |aimerais )?voir (?=(?:le |la |l |les |mon |ma )?(?:inspecteur|sergent|professeur|docteur|mr|mrs|miss|madame|monsieur|mme|mlle|lady|lord|agent|concierge|commissaire|capitaine|directeur|patron|chef)\b)/g, ' visiter '],
    [/\b(m |s |me |se |vous )?approcher\b|\bm approche\b|\bs approche\b/g, ' visiter '],
    [/\b(je vais|on va|vais|allons|allez|va|vas) (dans|au|aux|a|vers|chez|jusqu|en|par|de l autre)\b/g, ' aller $2 '],
    [/\bje (le |la |les )?suis (les |la |le |l |ces |cette )?(traces?|empreintes?|piste|pas)\b/g, ' suivre traces '],
    [/\b(lisez|lis|lire|tirez|tire|tirer|faites|fais|faire|dites|dis|predisez) (moi )?(les |mes |vos |mon |l )?(cartes|tarot|avenir|horoscope|destin)\b/g, ' mescartes '],
    [/\bau revoir\b|\ba plus tard\b|\ba bientot\b|\bbonne (nuit|soiree)\b/g, ' aurevoir '],
    [/\b(ne )?rien faire\b|\bne fais rien\b|\bje fais rien\b/g, ' attendre '],
    [/\b(il|elle|vous|tu|ils) (ment|mentez|mens|mentes|mentent|mentiez)\b/g, ' psymensonge '],
    [/\b(est il|est elle|etes vous|es tu) (sincere|honnete|franc)\b/g, ' psymensonge '],
    [/\bdire la verite\b|\bla verite\b/g, ' verite '],
    [/\bqui (etes|es) (vous|tu)\b|\b(vous|toi) meme\b|\bparle[rz]? moi de (vous|toi)\b/g, ' toimeme '],
    [/\bquelle heure\b|\bl heure\b/g, ' heure '],
    [/\bou (est|etait|sont|serait|se trouve|est parti|est alle|va|allait)\b/g, ' ouestil '],
    [/\bquelqu un\b/g, ' quelquun '],
    [/\b(\d+)(e|eme|ieme|er|ere)\b/g, ' $1 '],
    [/\bje suis (de la |un |une |l )?(police|policier|policiere|inspecteur|commissaire|detective|flic|gendarme|agent|surete)\b/g, ' bluffpolice '],
    [/\b(venez|viens|venir|accompagnez|accompagne) (avec )?(moi|nous)\b/g, ' accompagner '],
    [/\bmaison dieu\b/g, ' maisondieu '],
    [/\b(lance|lancer|jette|jeter|jete|faire) (un )?(sort|sortilege|maléfice|malefice|charme magique)\b/g, ' magie '],
    [/\b(c est a dire|comment ca|et alors|et apres|et ensuite|et puis|quoi d autre|autre chose|rien d autre|c est tout|vous etes sur|vous etes certain|tu es sur|ah bon|ah oui|et donc)\b/g, ' cestadire '],
    [/\b(je me regarde|je m examine|m examiner|me regarder|moi meme|mon etat|mon reflet|mes mains|comment je me sens|je me sens|faire le point|examiner lucien|qui suis je|ou en suis je)\b/g, ' etatlucien '],
    [/\b(a poil|tout nu|toute nue)\b/g, ' apoil '],
    [/\b(signal d alarme|sonnette d alarme|frein d urgence|tirer la sonnette|arreter le train)\b/g, ' alarme '],
    [/\b(me cacher|se cacher|je me cache|cachez moi)\b/g, ' planquer '],
    [/\b(vos cartes|mes cartes|mon avenir|lire mon avenir|tirer les cartes|me tirer les cartes|lisez mes cartes|predire)\b/g, ' mescartes ']
  ];

  var NUMWORDS = { deux: '2', trois: '3', quatre: '4', cinq: '5', six: '6', sept: '7', huit: '8', septieme: '7', troisieme: '3', premier: '1', premiere: '1' };

  var STOP = new Set(('le la les l un une des du de d au aux a o ce cet cette ces c ca cela ceci mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs ' +
    'je j tu il elle on nous vous ils elles me m te t se s lui y en et ou mais donc or ni car que qu qui quoi dont est sont suis es sommes etes etait etaient ' +
    'ai as avons avez ont avais avait vais vas va allons allez vont veux veut voudrais voudrait voulons voulez peux peut pouvons pouvez puis pourrais pourriez ' +
    'essaie essaye essayer essaies tente tenter tentes alors ensuite bien tres trop plus moins encore aussi juste peu ici la voila voici sur dans avec pour par ' +
    'vers chez entre moi toi soi ok oui non hein euh bon ben bah bof tout tous toute toutes comme si ne pas jamais faire fais fait monsieur mr m mme mlle ' +
    'quel quelle quels quelles cela quand meme deja donc hop allez allons bien fois chose truc un peu leurs eux celle celui ceux cette sa ses ' +
    'doucement lentement discretement rapidement vite attentivement prudemment calmement tranquillement soigneusement').split(/\s+/));

  function stripAccents(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function normalize(raw, extraPhrases) {
    var s = ' ' + String(raw || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae') + ' ';
    s = stripAccents(s);
    s = s.replace(/['’`´]/g, ' ').replace(/[^a-z0-9]+/g, ' ');
    s = s.replace(/([a-z])\1{2,}/g, '$1$1');
    s = ' ' + s.replace(/\s+/g, ' ').trim() + ' ';
    var all = (extraPhrases || []).concat(BASE_PHRASES);
    for (var i = 0; i < all.length; i++) s = s.replace(all[i][0], all[i][1]);
    return s.replace(/\s+/g, ' ').trim();
  }

  // Racinisation légère (terminaisons verbales et plurielles du français)
  var ENDINGS = ['eraient', 'erions', 'eriez', 'assent', 'ements', 'ement', 'erait', 'erais', 'erons', 'eront', 'erez', 'aient', 'ation',
    'ions', 'iez', 'ait', 'ais', 'ant', 'ent', 'ees', 'ons', 'ez', 'er', 'es', 'ee', 'ir', 'is', 'it', 'e', 's', 'x', 't'];
  function stem(w) {
    for (var i = 0; i < ENDINGS.length; i++) {
      var e = ENDINGS[i];
      if (w.length - e.length >= 3 && w.slice(-e.length) === e) return w.slice(0, -e.length);
    }
    return w;
  }

  // Clé phonétique simplifiée pour le français (fouiller ≈ fouyer, serviette ≈ servyete…)
  function phon(w) {
    var s = w;
    s = s.replace(/ph/g, 'f').replace(/qu/g, 'k').replace(/gu([eiy])/g, 'g$1').replace(/ge([aou])/g, 'j$1')
      .replace(/c([eiy])/g, 's$1').replace(/ck/g, 'k').replace(/c/g, 'k').replace(/q/g, 'k')
      .replace(/([aeiou])ill/g, '$1y').replace(/ill/g, 'iy')
      .replace(/eau/g, 'o').replace(/au/g, 'o').replace(/ai|ei/g, 'e').replace(/oi/g, 'wa').replace(/ou/g, 'u')
      .replace(/[ae][nm](?![aeiouy])/g, 'an').replace(/o[nm](?![aeiouy])/g, 'on').replace(/(ai|ei)n(?![aeiouy])/g, 'in').replace(/[iyu][nm](?![aeiouy])/g, 'in')
      .replace(/y/g, 'i').replace(/h/g, '').replace(/w/g, 'v').replace(/z/g, 's')
      .replace(/([aeiou])s([aeiou])/g, '$1z$2')
      .replace(/(.)\1+/g, '$1')
      .replace(/(er|ez|et|es|ent|e|s|t|x|d|p)$/, '')
      .replace(/e$/, '');
    return s;
  }

  // Distance de Damerau-Levenshtein (alignement optimal)
  function osa(a, b) {
    var m = a.length, n = b.length, i, j;
    if (!m) return n; if (!n) return m;
    var d = [];
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        var v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1);
        d[i][j] = v;
      }
    }
    return d[m][n];
  }

  function tokenScore(tok, entry) {
    if (tok === entry.form) return 1;
    if (tok.length <= 2 || entry.form.length <= 2) return 0;
    var ts = stem(tok);
    if (ts === entry.stem && ts.length >= 3) return 0.95;
    var tp = phon(tok);
    if (tp.length >= 3 && tp === entry.phon) return 0.9;
    var L = Math.max(ts.length, entry.stem.length);
    var allowed = L <= 3 ? 0 : L <= 5 ? 1 : L <= 8 ? 2 : 3;
    if (allowed) {
      var dist = osa(ts, entry.stem);
      if (dist <= allowed) return 0.88 - 0.08 * dist;
      var dp = tp.length >= 4 ? osa(tp, entry.phon) : 9;
      if (dp === 1 && L >= 5) return 0.74;
    }
    if (ts.length >= 5 && entry.stem.length > ts.length && entry.stem.indexOf(ts) === 0) return 0.7;
    return 0;
  }

  // ---------------------------------------------------------------------------
  // 2. Lexique : concepts (verbes, noms, sujets) et leurs formes
  // ---------------------------------------------------------------------------
  function Lexicon() {
    this.concepts = {};
    this.entries = [];
    this.exact = {};
  }
  Lexicon.prototype.add = function (id, type, words, info) {
    var c = this.concepts[id] || (this.concepts[id] = { id: id, type: type, words: [] });
    if (info) for (var k in info) c[k] = info[k];
    var self = this;
    words.split(/\s*,\s*/).forEach(function (w) {
      w = normalize(w).replace(/\s+/g, '');
      if (!w) return;
      if (self.exact[w] && self.exact[w] !== id) {
        if (G.LEXICON_WARN) G.LEXICON_WARN(w, self.exact[w], id);
        return;
      }
      self.exact[w] = id;
      c.words.push(w);
      self.entries.push({ form: w, stem: stem(w), phon: phon(w), id: id });
    });
    return this;
  };
  // reprend des mots à un autre concept (un chapitre qui affine le sens d'un verbe)
  Lexicon.prototype.take = function (id, type, words, info) {
    var self = this;
    words.split(/\s*,\s*/).forEach(function (w) {
      var n = normalize(w).replace(/\s+/g, ''), old = self.exact[n];
      if (!old || old === id) return;
      delete self.exact[n];
      var oc = self.concepts[old]; if (oc) oc.words = oc.words.filter(function (x) { return x !== n; });
      self.entries = self.entries.filter(function (e) { return e.form !== n; });
    });
    return this.add(id, type, words, info);
  };
  // les vrais mots français qui ne sont pas ceux du jeu (mots.js) : jamais de rapprochement approximatif
  var GARDE = null;
  function garde() {
    if (GARDE === null) {
      if (!G.RPG_MOTS && typeof require === 'function') { try { require('./mots.js'); } catch (e) {} }
      GARDE = G.RPG_MOTS || {};
    }
    return GARDE;
  }
  Lexicon.prototype.best = function (tok) {
    if (this.exact[tok]) return { id: this.exact[tok], score: 1 };
    if (garde()[tok]) return null;
    var best = null;
    for (var i = 0; i < this.entries.length; i++) {
      var sc = tokenScore(tok, this.entries[i]);
      if (sc > 0 && (!best || sc > best.score)) best = { id: this.entries[i].id, score: sc };
    }
    return best && best.score >= 0.64 ? best : null;
  };

  function coreLexicon(L) {
    // Verbes d'action
    L.add('EXAMINER', 'v', 'examiner, examine, regarder, regarde, observer, inspecter, voir, vois, scruter, etudier, analyser, detailler, lorgner, mater, zieuter, guetter, lire, decrire, admirer, verifier, consulter, montrer moi');
    L.add('FOUILLER', 'v', 'fouiller, chercher, explorer, farfouiller, tater, palper, trier, fureter, debusquer, rechercher, inventorier');
    L.add('PRENDRE', 'v', 'prendre, prends, ramasser, saisir, recuperer, empocher, garder, emporter, voler, piquer, chiper, attraper, subtiliser, choper, emparer, embarquer, chourer');
    L.add('SENTIR', 'v', 'sentir, renifler, humer, flairer, odeur, odeurs, parfum');
    L.add('BOIRE', 'v', 'boire, bois, gouter, avaler, siroter, lecher, deguster, trinquer');
    L.add('ECOUTER', 'v', 'ecouter, entendre, espionner, epier, ouie, bruit, bruits, son, sons');
    L.add('PARLER', 'v', 'parler, discuter, interroger, questionner, demander, aborder, saluer, causer, adresser, interpeller, appeler, bonjour, bonsoir, salut, hello, excuser, converser, dire, raconter, repondre, apostropher, hey, he, ho, hep, psst');
    L.add('VISITER', 'v', 'visiter, rendre visite');
    L.add('ALLER', 'v', 'aller, entrer, sortir, rejoindre, marcher, avancer, file, filez, filons, retourner, traverser, passer, partir, quitter, monter, rendre, diriger, filer, revenir, rentrer, suivre, courir, continuer, gagner, poursuivre, deplacer, direction, go, avance, recule, reculer, foncer, precipiter, pars, partons, partez, sors, sortons, sortez, quitte, quittons, allons, allez, rentre, rentrons, descendre, descends, redescendre, redescends, remonter, remonte, ressortir, ressors, retourne, retournons, franchir, franchis, franchit, franchissons, franchissez, enjamber, enjambe');
    L.add('ALLURE', 'x', 'allure', { label: 'l’allure' });
    L.add('OUVRIR', 'v', 'ouvrir, ouvre, pousser, tirer, forcer, actionner, entrouvrir, crocheter, defoncer, enfoncer, deverrouiller, tourner, poignee');
    L.add('FRAPPER', 'v', 'frapper, toquer, cogner, tambouriner');
    L.add('ASSEOIR', 'v', 'asseoir, assoir, assieds, assied, installer, assis, attabler, siege');
    L.add('COMMANDER', 'v', 'commander, reclamer, servir, sers, servez, consommer, serve');
    L.add('DONNER', 'v', 'donner, offrir, tendre, glisser, payer, soudoyer, corrompre, acheter, tenez, tiens, verser, remettre, preter');
    L.add('REFLECHIR', 'v', 'faitlepoint, cogiter');
    L.add('ATTENDRE', 'v', 'attendre, patienter, rester, penser, guetter le temps, souffler, respirer');
    L.add('UTILISER', 'v', 'utiliser, montrer, presenter, exhiber, brandir, agiter, sortir de ma poche');
    L.add('FUMER', 'v', 'fumer, allumer, cigarette, cigarettes, clope, pipe, cigare, briquet, allumette');
    L.add('CRIER', 'v', 'crier, hurler, gueuler, siffler, applaudir, pleurer, rire, jurer, sangloter, gemir');
    L.add('DORMIR', 'v', 'dormir, coucher, sieste, somnoler, roupiller, reposer');
    L.add('REVEILLER', 'v', 'reveiller, secouer, bousculer, tirer du sommeil');
    L.add('LANCER', 'v', 'lancer, lance, jet, roll, rouler');
    // Gestes sociaux
    L.add('MENACER', 's', 'menacer, intimider, brutaliser, tabasser, empoigner, agripper, colleter, gifler, frapper au visage, tuer, etrangler, cogne, menace');
    L.add('FLATTER', 's', 'flatter, complimenter, charmer, seduire, sourire, draguer, compliment, compliments, charmant, charmante, ravissante, elegant, elegante, beaute, belle, galant');
    L.add('PERSUADER', 's', 'convaincre, persuader, expliquer, raisonner, supplier, implorer, aidez, aider, danger, urgent, urgence, important, grave, sauver, rassurer, journaliste, presse, article, gazette, confiance');
    L.add('BARATIN', 's', 'mentir, baratiner, bluffer, pretendre, bluffpolice, mandat, imposteur, deguiser, faux papiers');
    L.add('PSY', 's', 'psymensonge, sincere, honnete, mensonge, menteur, psychologie, jauger, cerner, sonder, suspect, louche, nerveux, nervosite');
    L.add('INSISTER', 's', 'insister, presser, cuisiner, reessayer, recommencer, encore une fois, verite, avouer, avouez, dites, cacher, cachez, cache, sais, savez, forcer le jet');
    L.add('AUREVOIR', 's', 'aurevoir, adieu, bye, ciao, salutations, laisser, laisse, congedier, fin de la conversation, terminer, arreter');
    L.add('POLI', 's', 'merci, pardon, desole, desolee, remercier, enchante, enchantee');
    L.add('ARGENT', 'n', 'argent, pourboire, francs, franc, pieces, monnaie, fric, thune, liasse, pognon, rembourser, recompense, prix, potdevin', { label: 'de l’argent' });
    // Questions générales
    L.add('HEURE', 'x', 'heure, horaire, montre, pendule, horloge, temps, longtemps, depuis, moment, minuit, tard', { label: 'l’heure' });
    L.add('TOIMEME', 'x', 'toimeme, nom, prenom, metier, travail, carriere, famille, mari, vie privee, age, origine, presentez', { label: 'lui-même' });
    L.add('OUESTIL', 'x', 'ouestil, parti, partis, disparu, disparition, absent, envole, evapore', { label: 'où il est' });
    L.add('VU', 'x', 'vu, vue, apercu, remarque, croise', { label: 'ce qu’il a vu' });
    L.add('QUELQUUN', 'x', 'quelquun, personne, quiconque, inconnu, inconnue, etranger, etrangere', { label: 'quelqu’un' });
    // Relances de conversation
    L.add('SUITE', 'x', 'pourquoi, raison, comment, expliquez, explique, precisez, precise, ensuite, apres, alors, continuez, continue, autrechose, vraiment, serieux, serieusement, certain, certaine, sur, sure, sures, croyez, details, detail, plus, quoi encore, cestadire, ecoutez', { label: 'la suite' });
    L.add('INSULTE', 's', 'insulter, injurier, connard, idiot, imbecile, cretin, salaud, merde, putain, abruti, cretine, conne, con, enfoire, ordure, minable, vieux schnock, mechant, stupide, debile');
    L.add('EMBRASSER', 's', 'embrasser, bisou, bise, baiser, enlacer, caliner, serrer dans mes bras, etreindre, epouser, mariage, marier, amour');
    L.add('DANSER', 'v', 'danser, valser, gigoter, foxtrot, charleston, tango, tourner sur moi meme');
    L.add('CHANTER', 'v', 'chanter, fredonner, siffloter, chantonner, entonner, marseillaise');
    L.add('MANGER', 'v', 'manger, croquer, devorer, macher, diner, souper, grignoter, avaler tout rond, mastiquer, bouffer, faim');
    L.add('DESHABILLER', 'v', 'deshabiller, nu, nue, apoil, enlever mes vetements, devetir, strip');
    L.add('SAUTER', 'v', 'sauter, bondir, defenestrer, plonger, jeter par la fenetre');
    L.add('ALARME', 'v', 'alarme, sonnette, frein, freiner, arreter le train, stopper, signal');
    L.add('CASSER', 'v', 'casser, briser, fracasser, detruire, renverser, exploser, eclater, demolir, saccager');
    L.add('BRULER', 'v', 'bruler, incendier, enflammer, flamber, feu, embraser, consumer');
    L.add('PRIER', 'v', 'prier, priere, dieu, seigneur, signe de croix, chapelet, benir, jesus, marie, ave, notre pere');
    L.add('MAGIE', 'v', 'magie, sortilege, incantation, telepathie, invoquer, conjurer, exorciser, exorcisme, rituel, pouvoir, pouvoirs, voler dans les airs, teleporter, abracadabra');
    L.add('ARME', 'n', 'pistolet, revolver, arme, armes, couteau, fusil, poignard, lame, canne epee, dague', { label: 'une arme' });
    L.add('CACHER', 'v', 'planquer, dissimuler, terrer, tapir, accroupir, eclipser');
    L.add('JOUER', 'v', 'jouer, partie, bataille, belote, poker, pari, parier, miser');
    L.add('CONTEMPLER', 'v', 'contempler, fixer, mediter, concentrer, hypnotiser, absorber, envouter, perdre dans');
    L.add('POLICE', 'x', 'police, policier, policiers, inspecteur, commissaire, gendarme, gendarmes, flic, flics, surete, prefecture, autorites', { label: 'la police' });
    L.add('PASSAGERS', 'x', 'passagers, passager, voyageurs, gens, monde, occupants, liste', { label: 'les passagers' });
    L.add('GUERRE', 'x', 'guerre, front, verdun, tranchees, tranchee, poilu, poilus, armistice, soldat, armee, isonzo, combats, bataille de', { label: 'la guerre' });
    L.add('DOCTEUR', 'x', 'docteur, medecin, malade, blesse, soigner, soins, infirmier, medicament', { label: 'un médecin' });
    L.add('OURS', 'x', 'ours, archiduc, ministre, ministres, dompteur', { label: 'l’ours' });
    L.add('ACCOMPAGNER', 'x', 'accompagner, escorter, aidez moi a', { label: 'm’accompagner' });
    L.add('CLOCHE', 'x', 'cloche, cloches, fonderie, fonderies, carillon, clocher', { label: 'les cloches' });
    L.add('SOEUR', 'x', 'soeur, montreux, heritage, mere', { label: 'sa sœur' });
    L.add('MESCARTES', 'x', 'mescartes, horoscope, destin, avenir, prediction', { label: 'votre avenir' });
    L.add('META', 'x', 'ia, intelligence artificielle, ordinateur, programme, jeu video, chatgpt, claude, robot, machine, bug, beug, developpeur', { label: 'le jeu' });
    L.add('ETAT', 'n', 'etatlucien, lucien, arnaud, moimeme, sante mentale, folie, fou, folle, esprit, nerfs, angoisse, peur, frissons, cauchemar, hallucination, hallucinations, visions, deraisonne, perds la tete', { label: 'vous-même' });
    // Méta
    L.add('AIDE', 'm', 'aide, help, comment jouer, instructions, regles, commandes, tutoriel');
    L.add('INVENTAIRE', 'm', 'inventaire, inv, poches, poche, sac, affaires, possessions, objets, equipement, fouiller mes poches');
    L.add('FICHE', 'm', 'fiche, perso, personnage, stats, statistiques, caracteristiques, competences, sante, etat');
    L.add('CARNET', 'm', 'carnet, indices, notes, resume, recapitulatif, bilan');
  }

  // ---------------------------------------------------------------------------
  // 3. Analyse d'une phrase du joueur
  // ---------------------------------------------------------------------------
  // ----- le discours rapporté -----
  // « dire qu'on est de la police », « je lui réponds que je ne sais rien », « me faire passer pour un médecin » :
  // ce qui suit « que » est ce que le personnage dit. On le joue comme une parole, pas comme un geste sur un mot.
  var DIRE = /^\s*(?:alors\s+|puis\s+|et\s+)?(?:(?:je|j['’]|on|nous)\s*(?:lui\s+|leur\s+|vais\s+(?:lui\s+|leur\s+)?)?(?:dis|dit|disons|dire|réponds|reponds|répondre|repondre|affirme|affirmer|prétends|pretends|prétendre|pretendre|annonce|annoncer|déclare|declare|déclarer|declarer|explique|expliquer|jure|jurer|assure|assurer|crie|crier|hurle|hurler|murmure|murmurer|chuchote|chuchoter|raconte|raconter|fais\s+croire|faire\s+croire)|(?:lui\s+|leur\s+)?(?:dire|répondre|repondre|affirmer|prétendre|pretendre|annoncer|déclarer|declarer|expliquer|jurer|assurer|crier|hurler|murmurer|chuchoter|raconter|faire\s+croire))\s+(?:(?:à|a|au|aux)\s+[^,]{2,30}?\s+)?(?:que\s+|qu['’]\s*)(.+)$/i;
  var PASSER_POUR = /^\s*(?:je\s+)?(?:me\s+fais\s+passer|me\s+faire\s+passer|se\s+faire\s+passer|prétends\s+être|pretends\s+etre|prétendre\s+être|pretendre\s+etre|je\s+me\s+présente\s+comme|me\s+présenter\s+comme|je\s+me\s+presente\s+comme|me\s+presenter\s+comme)\s+(?:pour\s+)?(.+)$/i;
  function discoursRapporte(raw) {
    var m = String(raw).match(DIRE), dit = null;
    if (m) dit = m[1].trim().replace(/^on\s+est\b/i, 'je suis').replace(/^on\s+a\b/i, 'j’ai').replace(/^on\s+(?=[a-zà-ÿ])/i, 'nous ').replace(/^nous\s+sommes\b/i, 'je suis');
    else if ((m = String(raw).match(PASSER_POUR))) dit = 'je suis ' + m[1].trim();
    if (!dit || dit.split(/\s+/).length < 2) return null;
    return dit.charAt(0).toUpperCase() + dit.slice(1);
  }

  // ----- le récit -----
  // « j'ai essayé de l'étrangler », « si je le frappais », « je ne vais pas vous tuer », « il m'a menacé » :
  // on raconte, on suppose, on nie. Ce n'est pas un geste fait maintenant, et rien ne doit le jouer comme tel.
  var R_PASSE = /\b(j (ai|avais|aurais) (?!une?\b|des\b|les?\b|la\b|l\b|du\b|de\b|d\b|besoin|envie|faim|soif|peur|froid|chaud|mal\b|raison|tort|rendez|quelque|mon\b|ma\b|mes\b|votre|vos\b|rien\b|pas\b|trop|assez|\d)(\w+ ){0,2}?\w*(e|i|u|is|it|ert|int|ait|uit|ous)\b|je (l |lui |les |leur |vous |t |m |n )+(ai|avais|aurais)|(il|elle|on|qui|quelqu un|personne) (ne |n )?(l |lui |m |vous |nous |les |t )*(a|avait|aurait)|(nous|vous|ils|elles) (ne |n )?(l |lui |les |m |vous )*(avons|avez|ont|avions|aviez|avaient)|tu (l |m |lui )*(as|avais))\b/;
  var R_IMPARFAIT = /\b(je|j|il|elle|on) (ne |n )?(l |lui |les |vous |me |m |t )*(voulais|voulait|essayais|essayait|tentais|tentait|pensais|pensait|comptais|allais|allait|devais|devait|pouvais|pouvait|etais|etait|venais|venait)\b/;
  var R_HYPOTHESE = /\b(si je|si j|si on|si quelqu un|si nous|et si|imaginons|admettons|supposons|a supposer|j aurais pu|j aurais du|j aurais voulu|j aurais aime|on pourrait croire|loin de moi)\b/;
  var R_NEGATION = /\b(je ne (vais|veux|compte|voulais|peux|pourrais) (pas|plus|jamais|nullement)|je n ai (pas|aucune|nulle) (l intention|envie)|je ne (vous|te|le|la|les|lui) (\w+) (pas|jamais|plus)|sans vouloir|n ayez (pas|crainte)|je ne ferai(s)? (rien|pas))\b/;
  var R_TIERS = /^(il|elle|ils|elles|quelqu un|personne) (ne |n )?(m |l |lui |nous |vous |les |t )*(veut|veulent|va|vont|voulait|allait|risque|pourrait|cherche a|essaie d|essaye d|tente d|menace d|menacait)\b/;
  function recit(texte) {
    var t = ' ' + normalize(texte) + ' ';
    return R_PASSE.test(t) || R_IMPARFAIT.test(t) || R_HYPOTHESE.test(t) || R_NEGATION.test(t) || R_TIERS.test(t.trim());
  }
  var ATTRIBUTS = new Set(('moustache moustaches favoris barbe barbiche cheveux coiffure chignon yeux regard visage figure mains main voix accent chapeau casquette kepi melon feutre bonnet robe costume habit ' +
    'veste manteau pardessus gilet cravate uniforme tenue bijoux collier bague lunettes monocle canne chaussures bottes chale eventail gants pelerine tablier echarpe foulard').split(' '));
  var DEFINI = /^(le|la|les|l|au|aux|son|sa|ses|ce|cet|cette|ces|du|leur|leurs|en)$/;
  // des mots qui sont à la fois un nom et un verbe conjugué
  var VERBE_NOM = new Set('porte portes portent note notes notent garde gardes gardent montre montres montrent livre livres livrent place places marche marches marchent ferme fermes ferment signe signes signent compte comptes comptent demande demandes demandent visite visites visitent couche couches tire tires tirent cause causes causent sonne sonnent presse pressent serre serrent tente tentent trouble troublent plante plantent peste reste restent'.split(' '));
  var SUJET = /^(ne|n|je|j|tu|il|elle|on|ils|elles|qui)$/;
  function parse(lex, raw, phrases) {
    var text = normalize(raw, phrases);
    var toks = text ? text.split(' ') : [];
    var p = { raw: raw, text: text, c: {}, verbs: [], nouns: [], metas: [], numbers: [], unknown: [], all: [] };
    var seen = {};
    toks.forEach(function (t, i) {
      if (NUMWORDS[t]) t = NUMWORDS[t];
      if (/^\d+$/.test(t)) {
        p.numbers.push(parseInt(t, 10));
        if (lex.exact['n' + t]) push(lex.exact['n' + t], 1, i);
        return;
      }
      if (STOP.has(t)) return;
      var m = lex.best(t);
      // « un chapeau », « des moustaches » : un vêtement ou un trait quelconque. Seule une référence définie
      // (« l'homme au chapeau », « le chapeau », « son visage ») désigne le personnage qu'on reconnaît à ce détail.
      if (m && ATTRIBUTS.has(t) && lex.concepts[m.id].type === 'n' && !DEFINI.test(toks[i - 1] || '') && !DEFINI.test(toks[i - 2] || '')) return;
      // « ne porte-t-il pas plainte », « je note », « il garde » : un verbe conjugué, pas la porte, la note ou le garde
      if (m && /^[nx]$/.test(lex.concepts[m.id].type) && m.score >= 1 && VERBE_NOM.has(t) && (SUJET.test(toks[i - 1] || '') || (toks[i + 1] === 't' && /^(il|elle|on|ils|elles)$/.test(toks[i + 2] || '')) || /^(je|tu|il|elle|on|nous|vous|ils|elles)$/.test(toks[i + 1] || '') && !DEFINI.test(toks[i - 1] || ''))) return;
      if (m) push(m.id, m.score, i); else if (t.length > 1) p.unknown.push(t);
    });
    function push(id, score, pos) {
      if (seen[id] !== undefined) {
        var e = p.all[seen[id]];
        if (score > e.score) { e.score = score; p.c[id] = score; }
        return;
      }
      var concept = lex.concepts[id];
      var item = { id: id, score: score, pos: pos, type: concept.type };
      seen[id] = p.all.length;
      p.all.push(item);
      p.c[id] = score;
    }
    p.all.forEach(function (it) {
      if (it.type === 'v' || it.type === 's') p.verbs.push(it);
      else if (it.type === 'n' || it.type === 'x') p.nouns.push(it);
      else if (it.type === 'm') p.metas.push(it);
    });
    p.nouns.forEach(function (n, i) { n.rank = i; });
    return p;
  }

  function cloneParse(p) { return JSON.parse(JSON.stringify(p)); }

  // Réécritures d'intention : « aller voir la dame » = lui parler, « frapper le serveur » = le menacer…
  function rewrite(lex, p) {
    var firstNoun = p.nouns[0];
    var npcNoun = firstNoun && lex.concepts[firstNoun.id].npc;
    function swap(from, to) {
      var v = p.verbs.find(function (x) { return x.id === from; });
      if (!v) return;
      delete p.c[from];
      if (p.c[to] === undefined || p.c[to] < v.score) p.c[to] = v.score;
      var existing = p.verbs.find(function (x) { return x.id === to; });
      if (existing) { existing.score = Math.max(existing.score, v.score); p.verbs.splice(p.verbs.indexOf(v), 1); }
      else { v.id = to; v.type = lex.concepts[to].type; }
    }
    // on garde la trace du déplacement : « aller voir Butter » peut aussi vouloir dire s'y rendre
    if (p.c.VISITER !== undefined) { if (npcNoun) p.moved = p.c.VISITER; swap('VISITER', npcNoun ? 'PARLER' : 'EXAMINER'); }
    if (npcNoun && p.c.ALLER !== undefined && p.nouns.length === 1) { p.moved = p.c.ALLER; swap('ALLER', 'PARLER'); }
    // « voir le sergent Rigby » : on veut lui parler
    if (npcNoun && p.c.EXAMINER !== undefined && /^(?:(?:je|j)\s+)?(?:veux\s+|voudrais\s+|dois\s+|demande a\s+|demander a\s+|souhaite\s+|aimerais\s+)?voir\b/.test(p.text)) swap('EXAMINER', 'PARLER');
    if (npcNoun && p.c.FRAPPER !== undefined) swap('FRAPPER', 'MENACER');
    if (npcNoun && p.c.REVEILLER !== undefined && !lex.concepts[firstNoun.id].sleeper) swap('REVEILLER', 'MENACER');
    if (p.c.BOISSON !== undefined && (p.c.PRENDRE !== undefined || p.c.BOIRE !== undefined)) { swap('PRENDRE', 'COMMANDER'); swap('BOIRE', 'COMMANDER'); }
    return p;
  }

  // ---------------------------------------------------------------------------
  // 4. Dés
  // ---------------------------------------------------------------------------
  var LEVELS = ['Échec critique', 'Échec', 'Réussite', 'Réussite majeure', 'Réussite extrême', 'Réussite critique'];
  var NEED = { normal: 2, difficile: 3, extreme: 4 };
  function levelOf(r, t) {
    if (r === 1) return 5;
    if (r <= Math.floor(t / 5)) return 4;
    if (r <= Math.floor(t / 2)) return 3;
    if (r <= t) return 2;
    if ((t < 50 && r >= 96) || r === 100) return 0;
    return 1;
  }
  function rollExpr(expr, rng, max) {
    var m = /^(\d+)?d(\d+)([+-]\d+)?$/i.exec(String(expr).trim());
    if (!m) return parseInt(expr, 10) || 0;
    var n = parseInt(m[1] || '1', 10), f = parseInt(m[2], 10), add = parseInt(m[3] || '0', 10), tot = 0;
    for (var i = 0; i < n; i++) tot += max ? f : 1 + Math.floor(rng() * f);
    return tot + add;
  }

  // ---------------------------------------------------------------------------
  // 5. Partie
  // ---------------------------------------------------------------------------
  var ESCAPE_VERBS = { FOUILLER: 1, PRENDRE: 1, ALLER: 1, OUVRIR: 1, FRAPPER: 1, ASSEOIR: 1, FUMER: 1, SENTIR: 1, ECOUTER: 1, BOIRE: 1 };
  var THRESHOLD = 1.45, SOFT = 1.0;

  function createGame(scene, saved, opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    var lex = new Lexicon();
    coreLexicon(lex);
    scene.lexicon(lex);
    var pcx = (saved && saved.pc) || opts.pc || scene.investigator;
    if (pcx && pcx.last) lex.add('ETAT', 'n', [pcx.last, pcx.key].filter(Boolean).join(', '));

    var s = saved ? saved : freshState();
    function freshState() {
      var pc = JSON.parse(JSON.stringify(opts.pc || scene.investigator));
      pc.sanStart = pc.sanStart || pc.san;
      return {
        v: 1, chapter: scene.id || 'prologue', loc: scene.start.loc, min: scene.start.min, turn: 0, idle: 0,
        flags: {}, clues: [], inv: (opts.pc && opts.pc.inv ? opts.pc.inv : scene.start.inv).slice(), money: opts.pc && opts.pc.money !== undefined ? opts.pc.money : scene.start.money,
        pc: pc,
        npcs: {}, talk: null, pending: null, pendingPush: null,
        visited: {}, done: {}, counters: {}, nudged: {}, ambient: {}, log: [], ended: false, seq: 0
      };
    }

    function tokens(x) {
      if (typeof x !== 'string' || x.indexOf('{') < 0) return x;
      var f = s.pc && s.pc.sex === 'f';
      return x.replace(/\{(M|m|Mr|e|nom|prenom|Nom|il|Il|le|ami|Ami|eux|x|cher|Cher)\}/g, function (all, k, pos) {
        // à la troisième personne (« Monsieur désire ? », « Madame est bien bonne »), on ne dit pas « Docteur désire »
        if ((k === 'M' || k === 'm') && s.pc.title === 'Dr' && /^ [a-zéèêàâîôûç]/.test(x.slice(pos + all.length, pos + all.length + 2))) return k === 'M' ? (f ? 'Madame' : 'Monsieur') : (f ? 'madame' : 'monsieur');
        switch (k) {
          case 'M': return s.pc.title === 'Dr' ? 'Docteur' : s.pc.title === 'Miss' ? 'Mademoiselle' : f ? 'Madame' : 'Monsieur';
          case 'm': return s.pc.title === 'Dr' ? 'docteur' : s.pc.title === 'Miss' ? 'mademoiselle' : f ? 'madame' : 'monsieur';
          case 'Mr': return f ? (s.pc.title || 'Mrs') : (s.pc.title || 'Mr');
          case 'e': return f ? 'e' : '';
          case 'nom': return s.pc.last || s.pc.name;
          case 'prenom': return s.pc.first || s.pc.name;
          case 'Nom': return s.pc.name;
          case 'il': return f ? 'elle' : 'il';
          case 'Il': return f ? 'Elle' : 'Il';
          case 'le': return f ? 'la' : 'le';
          case 'ami': return f ? 'amie' : 'ami';
          case 'Ami': return f ? 'Amie' : 'Ami';
          case 'eux': return f ? 'elle' : 'lui';
          case 'cher': return f ? 'chère' : 'cher';
          case 'Cher': return f ? 'Chère' : 'Cher';
          case 'x': return f ? 'se' : 'x';
        }
        return all;
      });
    }
    function log(e) {
      if (typeof e.x === 'string') e.x = tokens(e.x);
      if ((e.t === 'narr' || e.t === 'event') && scene.generic && scene.generic.dup && !inExec) {
        for (var q = s.log.length - 1, seenN = 0; q >= 0 && seenN < 6; q--) {
          var prev = s.log[q];
          if (prev.t === 'player' || prev.t === 'ask' || prev.t === 'chips') continue;
          seenN++;
          if ((prev.t === 'narr' || prev.t === 'event') && prev.src === e.x) { e.x = fresh('dup', scene.generic.dup); break; }
        }
        e.src = e.src || e.x;
      }
      if (scene.perceive && (e.t === 'narr' || e.t === 'npc' || e.t === 'event') && typeof e.x === 'string') e.x = scene.perceive(api, e.x, e);
      e.n = ++s.seq; e.san = sanState(); s.log.push(e);
      if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
      return e;
    }
    function sanState() {
      if (!s.pc) return 0;
      var d = (s.pc.sanStart || s.pc.san) - s.pc.san;
      var st = d >= 12 ? 3 : d >= 7 ? 2 : d >= 3 ? 1 : 0;
      if (s.pc.san <= 20) st = 3;
      return st;
    }
    function npcState(id) {
      var st = s.npcs[id];
      if (!st) {
        var npc = scene.npcs[id] || {};
        st = s.npcs[id] = { met: false, asked: {}, att: 0, shut: false, deflect: 0, patience: npc.patience || 6, said: [], closedUntil: -1, refuse: 0 };
      }
      if (st.said === undefined) { st.said = []; st.patience = (scene.npcs[id] || {}).patience || 6; st.closedUntil = -1; st.refuse = 0; }
      return st;
    }
    // Choisit dans une liste sans jamais redonner l'élément précédent
    function fresh(key, pool) {
      if (!pool || !pool.length) return '';
      if (pool.length === 1) return pool[0];
      var last = s.counters['fresh:' + key];
      var i = last === undefined ? 0 : (last + 1) % pool.length;
      s.counters['fresh:' + key] = i;
      return pool[i];
    }
    var talkMode = null, inExec = false, filEnCours = null, sujetEnCours = null;
    function patienceTier(npc, st) { var max = npc.patience || 6; return st.patience > max * 0.5 ? 0 : st.patience > 1 ? 1 : 2; }
    function closeTalk(npc) {
      var st = npcState(npc.id);
      talkMode = 'raw';
      api.npc(npc.id, fresh('close:' + npc.id, npc.close || [npc.bye]));
      talkMode = null;
      st.closedUntil = s.min + (npc.cooldown || 8);
      st.patience = 0; st.refuse = 0;
      s.talk = null;
    }
    function escalate(npc, st) {
      st.patience -= 1;
      var tier = patienceTier(npc, st);
      var pool = (npc.repeat && npc.repeat[tier]) || ['…'];
      var line = fresh('rep' + tier + ':' + npc.id, pool);
      if (st.patience <= 0) { talkMode = 'raw'; logNpc(npc.id, line); talkMode = null; closeTalk(npc); return null; }
      return line;
    }
    function logNpc(who, x) {
      // une humeur à faire entendre avant la réponse (« Bon. Je vous réponds, mais changez de ton. »)
      if (s.prefix && s.prefix.who === who && typeof x === 'string') {
        var pre = s.prefix.x, suite = x.slice(2); s.prefix = null;
        // après deux points, la phrase continue en minuscule (« Alors : les femmes de chambre… »), sauf un nom propre
        if (/:$/.test(pre) && /^(Le|La|Les|L’|Un|Une|Il|Elle|Ils|Elles|Je|J’|On|Nous|Vous|Ce|C’|Ça|Cela|Mon|Ma|Mes|Son|Sa|Ses|Oui|Non|Si|Quand|Depuis|Personne|Rien|Pas|Ah|Oh|Bon|Ben|Des|Du|De|Dans|Au|Aux|Tout|Tous|Trois|Deux)\b/.test(suite)) suite = suite.charAt(0).toLowerCase() + suite.slice(1);
        x = /^« /.test(x) ? '« ' + pre + ' ' + suite : '« ' + pre + ' » ' + x;
      }
      x = echoJuste(who, x);
      var npc = scene.npcs[who];
      var name = npc ? npc.name : who;
      // verrou des faits : personne ne parle d'un événement qui n'a pas encore eu lieu (scene.faits)
      var fi = npc && faitInconnu(x);
      if (fi) {
        if (G.RPG_FAITS) G.RPG_FAITS.push({ who: who, fait: fi, x: String(x).slice(0, 100) });
        // le joueur en parle lui-même : on s'étonne (« Quel incendie ? ») ; sinon, on répond à côté, sans rien révéler
        var F = scene.faits[fi], evoque = paroleJoueur && F.re.test(String(paroleJoueur.raw || ''));
        var dz = (evoque && F.nie) || npc.deflect || ['…'];
        x = tokens(dz[(s.seq + s.turn) % dz.length]);
        if (faitInconnu(x)) return;
      }
      // verrou : un personnage qui n'est pas là ne parle jamais (ni à sa place, ni dans le dos d'un autre)
      // (une réplique écrite dans le geste en cours — « Beddows paraît à la porte » — est voulue par le scénario)
      if (npc && !inExec && !pnjIci(who)) {
        if (G.RPG_ABSENTS) G.RPG_ABSENTS.push({ who: who, loc: s.loc, talk: s.talk, x: String(x).slice(0, 90) });
        return;
      }
      noterReplique(who, x);
      // la question en suspens : ce personnage vient-il de demander quelque chose ? (voir reponseBreve)
      if (npc && s.talk === who) {
        var sq = npcState(who);
        sq.question = /\?\s*»?\s*$/.test(String(x)) ? { turn: s.turn, fil: filEnCours, sujet: talkMode === 'topic' ? sujetEnCours : null, ouverte: questionOuverte(String(x)) } : null;
        sq.parle = s.turn;
      }
      // les répliques sans guillemets sont des gestes : narration
      log({ t: 'npc', who: who, name: name, x: x });
    }
    // ----- les faits -----
    // scene.faits = { nom: { re: /mots qui en parlent/, existe: function (api) } } : tant que le fait n'existe pas
    // (l'incendie avant samedi 23 h), aucune réplique ne peut le mentionner, d'où qu'elle vienne.
    function faitInconnu(x) {
      var F = scene.faits; if (!F || typeof x !== 'string') return null;
      if (/^« (Quel|Quelle|Quels|Quelles|Aucun|Aucune|Un|Une) [^»?]{0,40}\?/.test(x)) return null; // il s'étonne, il ne confirme rien
      for (var k in F) { if (F[k].re.test(x) && !F[k].existe(api)) return k; }
      return null;
    }
    // ----- l'écho juste -----
    // Une réplique écrite qui commence par reprendre la question (« Un homme qui nous observe ? Mon ami… ») suppose
    // que le joueur a dit ces mots-là. S'il ne les a pas dits, l'écho tombe : on garde la réponse, pas la fausse reprise.
    var paroleJoueur = null; // la phrase du joueur à laquelle on répond (null : un choix dans la liste, un événement)
    var ECHO = /^« ((?:Le|La|Les|L’|Un|Une|Des|Du|Mon|Ma|Mes|Votre|Vos|Ce|Cet|Cette|Ces|Quel|Quelle)\b[^?!.…»]{2,60})\? +(?=\S)/;
    var SUITE_DEP = /^(Il|Elle|Ils|Elles|Lui|Eux|Celui|Celle|Ceux|C’|Ce |Ça|Cela|Y |En |On l|Je l|J’en|Je le|Je la|Je les|Connais|Jamais|Envol|Parti|Mort|Disparu|Aucun|Rien|Pas |Non|Oui|Si |Et |Mais |Ou |Tout le monde conna|Personne ne)/;
    function echoJuste(who, x) {
      var p = paroleJoueur;
      if (!p || typeof x !== 'string' || talkMode !== 'topic') return x; // les reformulations voulues (« Le jazz ? » → « La musique ? ») ne sont pas touchées
      var m = x.match(ECHO); if (!m) return x;
      var dits = {}; p.text.split(' ').forEach(function (w) { dits[w] = 1; dits[stem(w)] = 1; });
      var mots = normalize(m[1], scene.phrases).split(' ').filter(function (w) { return w.length > 2 && !STOP.has(w); });
      if (!mots.length) return x;
      var appuye = mots.some(function (w) {
        if (dits[w] || dits[stem(w)]) return true;
        var c = lex.best(w); return !!(c && c.score >= 0.9 && (p.c[c.id] !== undefined || p.pronom === c.id));
      });
      // « lui », « elle », « il » dans la phrase du joueur : on parle déjà de quelqu'un, l'écho le nomme
      if (appuye || /\b(il|elle|lui|ils|elles|eux|celui la|celle la|cet homme|cette femme)\b/.test(p.text) && mots.some(function (w) { var c = lex.best(w); return c && lex.concepts[c.id].npc; })) return x;
      var reste = x.slice(m[0].length);
      if (G.RPG_ECHOS) G.RPG_ECHOS.push({ who: who, dit: p.raw, echo: m[1], x: x.slice(0, 110) });
      // une reprise qui cite toute une phrase (« Un homme qui nous observe ? ») tombe, si la suite tient debout seule ;
      // un simple nom (« Le train ? ») devient une pensée à voix haute (« Le train… »)
      if (/ (qui|que|qu|dont|ou) /.test(' ' + normalize(m[1]) + ' ') && !SUITE_DEP.test(reste) && /^[A-ZÀ-Ý]/.test(reste)) return '« ' + reste;
      return '« ' + m[1].replace(/\s+$/, '') + '… ' + reste;
    }
    function loc() { return scene.locations[s.loc]; }
    // un personnage est là si on lui parle, si on peut lui parler ici, s'il fait partie du décor, ou si le chapitre le dit
    var pnjVenus = {};
    function pnjIci(id) {
      if (s.talk === id || pnjVenus[id] === s.turn) return true;
      var lx = scene.npcs[id] && scene.npcs[id].lieux; // les lieux où il se tient, déclarés avec le personnage
      if (lx && lx.indexOf(s.loc) >= 0) return true;
      if (availableActions().some(function (a) { return a.talkTo === id; })) return true;
      var c = conceptDuPnj(id);
      if (c && thingsHere().some(function (t) { return (t.ids || []).indexOf(c) >= 0; })) return true;
      return !!(scene.pnjIci && scene.pnjIci(api, id));
    }
    function skillValue(name) {
      if (name === 'SAN') return s.pc.san;
      if (name === 'CHANCE') return s.pc.chance;
      if (s.pc.skills[name] !== undefined) return s.pc.skills[name];
      if (s.pc.carac[name] !== undefined) return s.pc.carac[name];
      if (name === 'Esquive') return Math.floor(s.pc.carac.DEX / 2);
      var base = { 'Comptabilité': 5, 'Crochetage': 1, 'Droit': 5, 'Histoire': 5, 'Occultisme': 5, 'Médecine': 1, 'Mécanique': 10, 'Discrétion': 20, 'Bibliothèque': 20, 'Crédit': 0, 'Écouter': 20, 'Psychologie': 10, 'Persuasion': 10, 'Charme': 15, 'Baratin': 5, 'Intimidation': 15, 'Trouver Objet Caché': 25, 'Premiers soins': 30, 'Sauter': 20, 'Grimper': 20, 'Photographie': 5, 'Langue (turc)': 1, 'Corps à corps': 25, 'Lancer': 20 };
      return base[name] !== undefined ? base[name] : 5;
    }
    function money(n) { return scene.money ? scene.money(n) : Math.round(n * 100) / 100 + ' francs'; }
    function labelOf(id) { var c = lex.concepts[id]; return (c && c.label) || id.toLowerCase(); }

    var api = {
      get s() { return s; },
      get pc() { return s.pc; },
      g: function (m, f) { return s.pc && s.pc.sex === 'f' ? f : m; },
      skill: function (name) { return skillValue(name); },
      rng: rng,
      say: function (x) { log({ t: 'narr', x: x }); },
      npc: function (who, x) {
        var npc = scene.npcs[who];
        if (!npc || !npc.topics || !npc.topics.length || talkMode === 'raw') { logNpc(who, x); return; }
        var st = npcState(who);
        if (st.said.indexOf(x) >= 0) {
          if (talkMode === 'greet') x = fresh('greetAlt:' + who, npc.greetAlt || [x]);
          else if (talkMode === 'bye') x = fresh('byeAlt:' + who, npc.byeAlt || [x]);
          else { x = escalate(npc, st); if (x === null) return; }
        } else {
          st.said.push(x); if (st.said.length > 300) st.said.shift();
        }
        var last = s.log[s.log.length - 1];
        if (last && last.t === 'npc' && last.who === who && last.x === x) return;
        logNpc(who, x);
      },
      close: function (who) { var n = scene.npcs[who]; if (n && s.talk === who) closeTalk(n); },
      calm: function (who, n) { var st = npcState(who), max = (scene.npcs[who] || {}).patience || 6; st.patience = Math.min(max, st.patience + n); },
      fresh: function (key, pool) { return fresh(key, pool); },
      sys: function (x) { log({ t: 'sys', x: x }); },
      event: function (x) { log({ t: 'event', x: x }); },
      doc: function (x, title) { log({ t: 'doc', x: x, title: title || '' }); var D = s.docs || (s.docs = []); if (!D.some(function (d) { return d.x === x; })) D.push({ x: x, title: title || '' }); },
      title: function (x, sub) { log({ t: 'title', x: x, sub: sub || '' }); },
      // une image posée dans le fil, pour un moment qui n'est pas un lieu (la cellule, une vision)
      vue: function (key, nom) { log({ t: 'vue', img: key, nom: nom || '' }); },
      things: function () { return listThings(); },
      where: function () { return scene.where ? scene.where(s.min) : ''; },
      clock: function () { return fmtTime(s.min); },
      ask: function () { log({ t: 'ask', x: s.talk ? 'Que dites-vous ?' : 'Que faites-vous ?' }); },
      chips: function (list) { log({ t: 'chips', list: list }); },
      fx: function (name) { log({ t: 'fx', fx: name }); },
      prefix: function (who, x) { s.prefix = x ? { who: who, x: x } : null; },
      ui: function (open) { log({ t: 'ui', open: open }); },
      clue: function (id) {
        if (s.clues.indexOf(id) >= 0) return false;
        s.clues.push(id); s.idle = 0;
        var c = scene.clues[id];
        log({ t: 'clue', id: id, title: c.title, x: c.text });
        return true;
      },
      has: function (id) { return s.clues.indexOf(id) >= 0; },
      flag: function (k, v) { if (v === undefined) return s.flags[k]; s.flags[k] = v; return v; },
      once: function (k) { if (s.flags['once:' + k]) return false; s.flags['once:' + k] = true; return true; },
      count: function (k) { var v = s.counters[k] || 0; s.counters[k] = v + 1; return v; },
      pick: function (k, arr) { var i = api.count(k); return arr[Math.min(i, arr.length - 1)]; },
      cycle: function (k, arr) { var i = api.count(k); return arr[i % arr.length]; },
      time: function (n) { s.tick = (s.tick || 0) + n; },
      item: function (name) { return s.inv.indexOf(name) >= 0; },
      take: function (name) { if (s.inv.indexOf(name) < 0) { s.inv.push(name); log({ t: 'item', x: name }); } },
      drop: function (name) { var i = s.inv.indexOf(name); if (i >= 0) s.inv.splice(i, 1); },
      pay: function (n) { if (s.money < n) return false; s.money -= n; return true; },
      hp: function (d) { s.pc.pv = Math.max(0, Math.min(s.pc.pvMax, s.pc.pv + d)); log({ t: 'stat', stat: 'PV', d: d, v: s.pc.pv }); },
      go: function (id, quiet) {
        var first = !s.visited[id];
        s.loc = id; s.visited[id] = (s.visited[id] || 0) + 1;
        if (first) s.idle = 0;
        // on change de lieu : l'interlocuteur resté derrière ne répond plus
        if (s.talk && !pnjIci(s.talk)) s.talk = null;
        log({ t: 'loc', loc: id, name: scene.locations[id].name });
        if (!quiet) scene.locations[id].enter(api, first);
      },
      check: function (id, o) {
        var chk = scene.checks[id] || defJet(id);
        if (!chk) { log({ t: 'sys', x: 'Ce jet n’existe plus dans cette version du jeu : on passe.' }); return; }
        s.pending = { id: id, diff: (o && o.diff) || 'normal', pushed: !!(o && o.pushed) };
        var hum = s.talk && SOCIAL[chk.skill] ? s.flags['humeur:' + s.talk] : 0;
        if (hum > 0) s.pending.bonus = true; else if (hum < 0) s.pending.malus = true;
        var CL = { INT: 'Idée (INT)', POU: 'Volonté (POU)', DEX: 'Dextérité', FOR: 'Force', CON: 'Constitution', EDU: 'Connaissance (ÉDU)', CHANCE: 'Chance', APP: 'Apparence' };
        log({ t: 'check', id: id, skill: chk.label || CL[chk.skill] || chk.skill, target: skillValue(chk.skill), diff: s.pending.diff, pushed: s.pending.pushed, why: (chk.why || '') + (s.pending.bonus ? ' (dé bonus : on vous a à la bonne)' : s.pending.malus ? ' (dé de malus : on vous en veut)' : '') });
      },
      talk: function (npcId, p) { startTalk(npcId, p); },
      topic: function (npcId, topicId, p) { runTopic(scene.npcs[npcId], topicId, p || parse(lex, '', scene.phrases)); },
      // un personnage entre en scène le temps d'une réplique (un événement, une intrusion)
      arrive: function (who) { pnjVenus[who] = s.turn; },
      endTalk: function (line) {
        if (!s.talk) return; var id = s.talk; s.talk = null; pnjVenus[id] = s.turn; // il est encore là pour saluer
        if (line !== false) { var npc = scene.npcs[id]; talkMode = 'bye'; api.npc(id, typeof npc.bye === 'function' ? npc.bye(api) : npc.bye); talkMode = null; }
      },
      npcs: npcState,
      label: labelOf,
      sanState: function () { return sanState(); },
      sanLabel: function () { return (scene.sanLabels || ['Lucide', 'Troublé', 'Fragile', 'Au bord du gouffre'])[sanState()]; },
      mythos: function (n) {
        var k = 'Mythe de Cthulhu';
        s.pc.skills[k] = (s.pc.skills[k] || 0) + n;
        s.pc.sanMax = 99 - s.pc.skills[k];
        log({ t: 'stat', stat: 'Mythe', d: n, v: s.pc.skills[k] });
      },
      gain: function (n) {
        if (n <= 0) return;
        s.pc.san = Math.min(s.pc.sanMax || 99, s.pc.san + n);
        log({ t: 'san', d: n, v: s.pc.san });
      },
      lose: function (n) {
        if (n <= 0) return;
        s.pc.san = Math.max(0, s.pc.san - n);
        log({ t: 'san', d: -n, v: s.pc.san });
        log({ t: 'fx', fx: 'shudder' });
        if (n >= 5 && scene.onMadness) scene.onMadness(api, n);
      },
      rand: function () { return rng(); },
      money: function (n) { return money(n === undefined ? s.money : n); },
      lastTopic: function (npcId) { return npcState(npcId).last; },
      end: function () { s.ended = true; log({ t: 'end' }); },
      exec: function (actionId) { var a = findAction(actionId); if (a) exec(a, parse(lex, a.label || '', scene.phrases)); }
    };

    // ----- actions du monde -----
    function availableActions() {
      var l = loc();
      return (l.actions || []).concat(scene.globalActions || []).filter(function (a) { return !a.cond || a.cond(api); });
    }
    function findAction(id) {
      var all = [];
      Object.keys(scene.locations).forEach(function (k) { all = all.concat(scene.locations[k].actions || []); });
      all = all.concat(scene.globalActions || []);
      return all.find(function (a) { return a.id === id; });
    }
    function defaultVerb(nounId) { var c = lex.concepts[nounId]; return c && c.npc ? 'PARLER' : 'EXAMINER'; }

    function scoreAction(a, p) {
      var vIn = p.verbs, nIn = p.nouns, vs = 0, ns = 0, i;
      if (a.also) for (i = 0; i < a.also.length; i++) if (p.c[a.also[i]] === undefined) return 0;
      if (a.needVerb && !a.verbs.some(function (v) { return p.c[v] !== undefined; })) return 0;
      if (a.verbs) for (i = 0; i < vIn.length; i++) if (a.verbs.indexOf(vIn[i].id) >= 0) vs = Math.max(vs, vIn[i].score);
      if (p.moved && a.verbs && a.verbs.indexOf('ALLER') >= 0) vs = Math.max(vs, p.moved);
      var nounMatched = null;
      if (a.nouns) for (i = 0; i < nIn.length; i++) if (a.nouns.indexOf(nIn[i].id) >= 0) {
        var w = nIn[i].score * (nIn[i].rank === 0 ? 1 : 0.9);
        if (w > ns) { ns = w; nounMatched = nIn[i]; }
      }
      var hasV = vIn.length > 0, hasN = nIn.length > 0, sc = 0;
      if (a.verbs && a.nouns) {
        if (vs && ns) sc = vs + ns;
        else if (ns && !hasV) sc = ns + (a.verbs.indexOf(defaultVerb(nounMatched.id)) >= 0 ? 0.7 : 0.25);
        else if (ns) sc = ns * 0.6;
        else if (vs && a.bare && !hasN) sc = vs + 0.6;
        else if (vs && a.bare) sc = vs + 0.6;
        else if (vs) sc = vs * 0.5;
      } else if (a.verbs) { if (vs) sc = vs + 0.6; }
      else if (a.nouns) { if (ns) sc = ns + 0.6; }
      if (!sc) return 0;
      var handledN = (a.nouns || []).concat(a.also || [], a.extra || []);
      var extraN = nIn.filter(function (n) { return handledN.indexOf(n.id) < 0; }).length;
      if (extraN) sc -= 0.45 + 0.15 * (extraN - 1);
      if (a.verbs && vs) {
        var handledV = a.verbs.concat(a.extraVerbs || []);
        var extraV = vIn.filter(function (v) { return handledV.indexOf(v.id) < 0; }).length;
        sc -= 0.25 * extraV;
      }
      if (a.boost) sc += a.boost;
      return sc;
    }
    // ----- la mémoire des référents : « je regarde la vieille dame », puis « je lui parle » -----
    // le lien entre un personnage et le mot qui le désigne, d'après les actions « parler à »
    var npcConcept = null, conceptNpc = null;
    function liens() {
      if (npcConcept) return;
      npcConcept = {}; conceptNpc = {};
      var all = (scene.globalActions || []).slice();
      Object.keys(scene.locations || {}).forEach(function (l) { all = all.concat(scene.locations[l].actions || []); });
      all.forEach(function (a) {
        if (!a.talkTo) return;
        (a.nouns || []).forEach(function (n) { var c = lex.concepts[n]; if (c && c.npc && conceptNpc[n] === undefined) conceptNpc[n] = a.talkTo; });
        var n0 = (a.nouns || []).filter(function (n) { return lex.concepts[n] && lex.concepts[n].npc; })[0];
        if (n0 && !npcConcept[a.talkTo]) npcConcept[a.talkTo] = n0;
      });
      Object.keys(lex.concepts).forEach(function (k) { var c = lex.concepts[k], id = k.toLowerCase(); if (c.npc && conceptNpc[k] === undefined && scene.npcs[id]) { conceptNpc[k] = id; if (!npcConcept[id]) npcConcept[id] = k; } });
    }
    function conceptDuPnj(npcId) { liens(); return npcConcept[npcId]; }
    function pnjDuConcept(cid) { liens(); return conceptNpc[cid]; }
    function genreDe(id) {
      var c = lex.concepts[id] || {}, H = G.RPG && G.RPG.Humeur, T = H && c.npc && H.T[c.npc];
      if (T && T.f !== undefined) return T.f ? 'f' : 'm';
      if (c.npc) return /^(Mme|Mrs|Miss|Madame|La )/.test(((scene.npcs[c.npc] || {}).name) || '') ? 'f' : 'm';
      var lb = String(c.label || '');
      if (/^(la |une |sa |cette )/i.test(lb)) return 'f';
      if (/^(le |un |son |ce |cet )/i.test(lb)) return 'm';
      if (/^(les |des |ses |ces )/i.test(lb)) return 'p';
      return '?';
    }
    function retenir(id) {
      var c = id && lex.concepts[id]; if (!c || c.type !== 'n') return;
      s.refs = (s.refs || []).filter(function (r) { return r.id !== id; });
      s.refs.unshift({ id: id, g: genreDe(id), t: s.turn });
      if (s.refs.length > 4) s.refs.length = 4;
    }
    // un pronom qui renvoie à quelqu'un ou à quelque chose : la, le, l', les, lui, leur, elle, il
    function pronomDe(p) {
      var t = ' ' + p.text + ' ', m;
      if ((m = t.match(/\b(?:je|j|on|nous|tu|vous|pour|de|d|a|vais|veux|dois|peux|pourrais|voudrais|aller|tente|essaie|essaye|puis)\s+(?:ne\s+)?(la|le|l|les|lui|leur)\s+[a-z]/))) return m[1];
      if ((m = t.match(/\b(?:avec|vers|pres d|aupres d|de|d|a|sur|pour|chez|contre|derriere|devant|apres|sans)\s+(elle|lui|eux|elles)\b/))) return m[1] === 'elle' ? 'elle' : m[1] === 'elles' || m[1] === 'eux' ? 'les' : 'lui';
      if ((m = t.match(/\b[a-z]{3,}\s+(la|le|lui|les|leur)\s*$/))) return m[1];
      if ((m = t.match(/^\s*(elle|il)\s+[a-z]/))) return m[1] === 'elle' ? 'la' : 'le';
      return null;
    }
    function resoudre(p) {
      if (!s.refs || !s.refs.length) return;
      if (p.nouns.some(function (n) { return n.type === 'n'; })) return;
      var pr = pronomDe(p); if (!pr) return;
      var veut = pr === 'la' || pr === 'elle' ? 'f' : pr === 'le' ? 'm' : pr === 'les' ? 'p' : null;
      // « lui », « leur », « avec elle » : c'est presque toujours une personne
      var personne = pr === 'lui' || pr === 'leur' || pr === 'elle' || ['PARLER', 'MENACER', 'FLATTER', 'PERSUADER', 'BARATIN', 'INSULTE', 'EMBRASSER', 'REVEILLER', 'SUIVRE', 'PSY', 'INSISTER', 'FRAPPER', 'DONNER'].some(function (v) { return p.c[v] !== undefined; });
      var recents = s.refs.filter(function (r) { return s.turn - r.t <= 8; });
      var ok = function (x) { return (!veut || x.g === veut || x.g === '?') && (!personne || lex.concepts[x.id].npc); };
      var r = recents.filter(ok)[0] || (personne ? recents.filter(function (x) { return lex.concepts[x.id].npc; })[0] : (veut === 'p' ? null : recents[0]));
      if (!r || p.c[r.id] !== undefined) return;
      var item = { id: r.id, score: 0.95, pos: -1, type: 'n' };
      p.all.push(item); p.nouns.push(item); p.c[r.id] = 0.95; p.pronom = r.id;
    }
    // ----- à qui parle-t-on ? « Beddows, … », « je demande à Pratt si… », « j'interroge le laitier sur… » -----
    var ADRESSE = /\b(?:demande\w*|redemande\w*|interroge\w*|questionne\w*|dis|dit|parle|adresse|m adresse|appelle|interpelle)\s+(?:a\s+|au\s+|aux\s+)?(?!(?:de|du|des|d)\s)((?:[a-z]+\s*){1,4})/;
    // « je vais voir l'agent et lui demande… », « je m'approche du laitier », « je me tourne vers Beddows »
    var APPROCHE = /\b(?:visiter|aborder|aborde|rejoins|rejoindre|aller (?:vers|de|aupres d|aupres de|aupres du)|(?:me |m )?tourne\w* vers|retourne\w* (?:vers|aupres d\w*))\s+((?:[a-z]+\s*){1,4})/;
    // ce qui précède le verbe : le joueur parle de lui (« je lui demande »), pas d'un autre (« avez-vous parlé au sergent »)
    var AVANT_ADRESSE = /^(?:\s*\b(?:je|j|nous|on|puis|alors|bon|bien|et|maintenant|ensuite|donc|lui|leur|me|m|vais|veux|voudrais|dois|tente|essaie|ose|aller|enfin)\b)*\s*$/;
    function premierPnj(texte) {
      var toks = texte.trim().split(/\s+/);
      for (var i = 0; i < toks.length; i++) {
        if (STOP.has(toks[i])) continue;
        var m = lex.best(toks[i]);
        if (m && m.score >= 0.9) {
          // le personnage présent que ce mot désigne (« la réception » : le concierge ici, le réceptionniste à Chelsea ; « l'agent » : l'agent de faction)
          var ici = availableActions().filter(function (a) { return a.talkTo && (a.nouns || []).indexOf(m.id) >= 0; })[0];
          if (ici) return ici.talkTo;
          if (lex.concepts[m.id].npc && pnjDuConcept(m.id)) return pnjDuConcept(m.id);
        }
        if (i >= 1) break; // le nom doit venir tout de suite
      }
      return null;
    }
    function destinataire(p) {
      var raw = String(p.raw || ''), voc = raw.match(/^\s*([^,:;?!.]{2,40})\s*[,:]/), id = null, reste = raw;
      if (voc) { id = premierPnj(normalize(voc[1])); if (id) reste = raw.slice(voc[0].length); }
      var t = ' ' + p.text + ' ';
      if (!id) {
        var m = t.match(ADRESSE);
        if (m && AVANT_ADRESSE.test(t.slice(0, m.index))) { id = premierPnj(m[1]); if (id) reste = raw.replace(/^.*?\b(demand|redemand|interrog|questionn|dis|dit|parl|adress|appell|interpell)\S*\s+(?:(?:à|a|au|aux)\s+)?/i, '').replace(/^\S+(\s+(de|d’|d')\s*\S+)?\s*/, ''); }
      }
      if (!id) {
        var m2 = t.match(APPROCHE);
        if (m2 && AVANT_ADRESSE.test(t.slice(0, m2.index))) {
          id = premierPnj(m2[1]);
          if (id) { var k = raw.search(/\s(et|puis)\s/i); reste = k >= 0 ? raw.slice(k).replace(/^\s*(et|puis)\s+(je\s+|j[’'])?\s*(lui\s+|leur\s+)?(demande\w*|redemande\w*|dis\b|dit\b|pose\w*(\s+la question)?|interroge\w*|questionne\w*)?\s*/i, '') : ''; }
        }
      }
      reste = reste.trim();
      // « je demande à l'agent s'il a fouillé » : ce qui suit est une question
      if (id && /^(si|s[’']ils?|s[’']elle|où|ou|ce qu|ce que|quand|comment|pourquoi|qui|quel|quelle|quels|quelles|combien|de quoi|à quoi|a quoi|depuis quand)\b/i.test(reste) && !/\?\s*$/.test(reste)) reste = reste.replace(/[.!…]*$/, '') + ' ?';
      return id ? { id: id, reste: reste } : null;
    }
    function pnjPresent(id) { return availableActions().some(function (a) { return a.talkTo === id; }); }
    // un geste à la première personne, en pleine conversation : on la quitte pour agir
    var GESTE = /^(?:(?:je|j)\s+(?:vais\s+|me\s+|m\s+)?(?:examine|fouille|ouvre|prends|monte|descends|retourne|sors|pars|quitte|lis|relis|consulte|cherche|frappe|sonne|ecoute|attends|entre|rentre|file|inspecte|scrute|observe|regarde|fais le tour|m eloigne|eloigne|approche|suis la|suis le|suis les|vais|franchis|traverse|pousse|rejoins|gagne|enjambe)|(?:(?:je|j|nous|on|alors|bon|bien|maintenant|ensuite|enfin)\s+)*(?:aller|visiter|sortir|partir|suivre|franchir|traverser|pousser))\b/;
    function rankActions(p) {
      return availableActions().map(function (a) { return { a: a, score: scoreAction(a, p) }; })
        .filter(function (x) { return x.score > 0; })
        .sort(function (x, y) { return y.score - x.score; });
    }

    function exec(a, p, forced) {
      s.tick = a.time !== undefined ? a.time : (scene.tick || 1);
      if (!forced && scene.beforeAction && scene.beforeAction(api, a, p) === true) return;
      s.done[a.id] = (s.done[a.id] || 0) + 1;
      var visee = p && p.nouns ? p.nouns.filter(function (n) { return n.type === 'n' && (!a.nouns || a.nouns.indexOf(n.id) >= 0); }).sort(function (x, y) { return y.score - x.score; })[0] : null;
      if (visee) retenir(visee.id); else if (a.talkTo) retenir(conceptDuPnj(a.talkTo)); else if (a.nouns && a.nouns.length === 1) retenir(a.nouns[0]);
      var startSeq = s.seq; // le journal est plafonné : on repère les nouvelles entrées par leur numéro
      inExec = !a.repeatable;
      try { a.run(api, p); } finally { inExec = false; }
      if (a.repeatable || s.talk || s.pending) return;
      // Même action, même texte qu'avant : on varie au lieu de répéter
      var produced = s.log.filter(function (e) { return e.n > startSeq && e.t === 'narr'; });
      if (!produced.length) return;
      var sig = produced.map(function (e) { return e.x; }).join('|');
      s.actTexts = s.actTexts || {}; s.actRep = s.actRep || {};
      var seen = s.actTexts[a.id] || (s.actTexts[a.id] = []);
      if (seen.indexOf(sig) < 0) { seen.push(sig); return; }
      var k = s.actRep[a.id] = (s.actRep[a.id] || 0) + 1;
      var g = scene.generic;
      var obj = a.obj || ((a.label || '').indexOf(' ') > 0 ? a.label.replace(/^\S+\s+/, '').replace(/^(par|à|au|aux|dans|sur|vers|avec|de)\s+/i, '') : '');
      obj = obj.charAt(0).toLowerCase() + obj.slice(1);
      var cap = function (t) { return t.charAt(0).toUpperCase() + t.slice(1); };
      var MJr = mjModule(), deja = MJr && MJr.deja ? MJr.deja(a.label || '', obj) : null;
      if (k === 1 && deja) {
        // « Vous avez déjà examiné la table de Ravel. » + l'essentiel de ce qu'on avait vu, en une ou deux phrases
        var tout = produced.map(function (e) { return e.x; }).join(' '), phr = tout.match(/[^.!?…]+[.!?…]+(\s*»)?/g) || [tout], res = '';
        for (var pi = 0; pi < phr.length && (res + phr[pi]).length < 170; pi++) res += phr[pi];
        produced[0].x = deja + ' ' + (res.trim() || phr[0].trim()) + ' ' + fresh('rienNeuf', ['Rien n’a changé.', 'Rien de neuf.', 'Tout est comme tout à l’heure.']);
        for (var pj = 1; pj < produced.length; pj++) { var ix = s.log.indexOf(produced[pj]); if (ix >= 0) s.log.splice(ix, 1); }
      } else if (k === 1 && g.againPrefix) {
        produced[0].x = fresh('againPre', g.againPrefix) + produced[0].x;
      } else {
        var pool = !obj && g.againBare ? g.againBare : sanState() >= 2 && g.againMad ? g.againMad : g.again;
        var line = cap(fresh(obj ? 'again' : 'againBare', pool).replace(/\{x\}/g, obj).replace(/\{X\}/g, cap(obj)))
          .replace(/(^|\s)à le /g, '$1au ').replace(/(^|\s)à les /g, '$1aux ').replace(/(^|\s)de le /g, '$1du ').replace(/(^|\s)de les /g, '$1des ');
        produced[0].x = line;
        for (var i = 1; i < produced.length; i++) { var idx = s.log.indexOf(produced[i]); if (idx >= 0) s.log.splice(idx, 1); }
        if (k >= 3 && g.loop) {
          api.event(scene.nudge ? scene.nudge(api) : fresh('loop', g.loop));
          var hasChips = s.log.some(function (e) { return e.n > startSeq && e.t === 'chips'; });
          if (!hasChips) { var ch = ideas(3); if (ch.length) api.chips(ch); }
        }
      }
    }

    function thingsHere() {
      var l = loc();
      return (l.things || []).filter(function (t) { return !t.cond || t.cond(api); });
    }
    function listThings() {
      var t = thingsHere().filter(function (x) { return x.label; }).map(function (x) { return x.label; });
      if (!t.length) return '';
      return t.length === 1 ? t[0] : t.slice(0, -1).join(', ') + ' et ' + t[t.length - 1];
    }
    // ce qu'on porte sur soi est toujours « ici » : « la valise » désigne la valise qu'on tient
    function porte(id) {
      return (s.inv || []).some(function (nom) {
        if (scene.porte && !scene.porte(api, nom)) return false;
        var toks = normalize(nom).split(' ');
        for (var i = 0; i < toks.length && i < 4; i++) {
          if (STOP.has(toks[i])) continue;
          var m = lex.best(toks[i]);
          return !!(m && m.score >= 0.9 && m.id === id);
        }
        return false;
      });
    }
    function nounHere(id) {
      return thingsHere().some(function (t) { return t.ids.indexOf(id) >= 0; }) || porte(id);
    }

    // ----- le carnet d'idées -----
    // Quatre suggestions, tirées de cinq familles, jamais signalées à l'écran :
    //   base   : les gestes de tout le monde (regarder, parler à quelqu'un, dormir) ;
    //   piste  : ce qui fait avancer l'enquête (les actions marquées idea dans les chapitres) ;
    //   fausse : cohérent, mais inutile ; coûte du temps ou de l'argent (idees.js) ;
    //   risque : la tentation ; santé mentale, blessure, arrestation, porte fermée, parfois un indice au prix fort ;
    //   folie  : ce que propose un esprit fragile (santé mentale « Fragile » et pire).
    // Le nombre de pistes suit l'intelligence (INT 40 : une ; 75 : deux ; 90 : deux ou trois) ; le mode « guide »
    // en ajoute une et retire les tentations. La liste ne bouge pas tant que la situation ne change pas.
    function natureIdee(a) {
      if (a.ideaKind) return a.ideaKind;
      if (a.talkTo || /_look$/.test(a.id) || a.idea === 'Regarder autour de vous') return 'base';
      return 'piste';
    }
    function signatureIdees() { return [s.loc, s.talk || '', s.clues.length, Object.keys(s.done).length, Math.floor(s.min / 240), sanState(), s.inv.length].join('|'); }
    function alea(cle) {
      var h = 2166136261; for (var i = 0; i < cle.length; i++) { h ^= cle.charCodeAt(i); h = Math.imul(h, 16777619); }
      return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    function melanger(l, r) { for (var i = l.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = l[i]; l[i] = l[j]; l[j] = x; } return l; }
    function nbPistes(r, mode) {
      var INT = (s.pc.carac && s.pc.carac.INT) || 60, attendu = 1 + Math.max(0, INT - 40) / 35;
      return Math.floor(attendu) + (r() < attendu % 1 ? 1 : 0) + (mode === 'guide' ? 1 : 0);
    }
    function etiquette(a) { return a.idea === true ? a.label : a.idea; }
    function ideas(n, mode) {
      n = n || 4; mode = mode || 'normal';
      var acts = availableActions().filter(function (a) { return a.idea && (!a.ideaCond || a.ideaCond(api)); });
      var r = alea(signatureIdees()), F = { base: [], piste: [], fausse: [], risque: [], folie: [] };
      acts.forEach(function (a) { (F[natureIdee(a)] || F.piste).push(a); });
      var neuf = function (l) { return l.filter(function (a) { return !s.done[a.id]; }); };
      ['fausse', 'risque', 'folie'].forEach(function (k) { F[k] = melanger(neuf(F[k]), r); });
      var out = [], pris = {};
      function prend(a, lab) { if (!a || pris[a.id] || out.length >= n) return; pris[a.id] = 1; out.push({ label: lab || etiquette(a), action: a.id }); }
      // les bonnes idées : les pistes, dans l'ordre du scénario, puis les gens qu'on n'a pas encore entendus
      var parler = F.base.filter(function (a) { return a.talkTo; }), regard = F.base.filter(function (a) { return !a.talkTo; });
      var bons = neuf(F.piste).concat(neuf(parler));
      // ce qui a déjà servi : d'abord ce qu'on refait volontiers (changer de voiture, attendre, relire), puis les gens déjà vus
      var faits = F.piste.filter(function (a) { return s.done[a.id]; });
      var refaire = faits.filter(function (a) { return a.repeatable; }).sort(function (x, y) { return s.done[x.id] - s.done[y.id]; });
      var revus = parler.filter(function (a) { return s.done[a.id]; }), restes = faits.filter(function (a) { return !a.repeatable; });
      if (!bons.length) bons = refaire.concat(revus);
      // l'idée qu'un jet d'Idée réussi a fait venir, tant qu'elle n'est pas faite
      var ec = s.flags.eclair, eca = ec && ec.loc === s.loc && acts.filter(function (a) { return a.id === ec.id && !s.done[a.id]; })[0];
      var tete = eca ? { label: 'Idée : ' + etiquette(eca), action: eca.id } : null;
      if (eca) pris[eca.id] = 1;
      var etat = sanState(), k = nbPistes(r, mode) - (eca ? 1 : 0);
      // quand le lieu n'a plus rien à dire, l'idée la plus juste est d'aller ailleurs
      var partir = availableActions().filter(function (a) { return /_lieux$/.test(a.id); })[0];
      if (partir && !neuf(F.piste).length) { prend(partir, 'Aller ailleurs'); k--; }
      bons.slice(0, Math.max(0, k)).forEach(function (a) { prend(a); });
      prend(neuf(regard)[0]);
      // le reste : ce qu'un esprit troublé propose, la tentation, les fausses pistes
      var folies = etat >= 3 ? 2 : etat >= 2 ? 1 : 0;
      F.folie.slice(0, folies).forEach(function (a) { prend(a); });
      if (mode !== 'guide' || etat >= 2) prend(F.risque[0]);
      (mode === 'guide' ? F.fausse.slice(0, 1) : F.fausse).forEach(function (a) { prend(a); });
      if (mode !== 'guide') F.risque.slice(1).forEach(function (a) { prend(a); });
      bons.forEach(function (a) { prend(a); });
      if (partir) prend(partir, 'Aller ailleurs');
      refaire.concat(revus, restes, regard).forEach(function (a) { prend(a); });
      if (tete) out.length = Math.min(out.length, n - 1);
      melanger(out, r);
      return tete ? [tete].concat(out) : out;
    }
    // les pistes seules, dans l'ordre du scénario : ce que fait venir un jet d'Idée réussi
    function pistes(n) {
      return availableActions().filter(function (a) { return a.idea && (!a.ideaCond || a.ideaCond(api)) && natureIdee(a) === 'piste' && !s.done[a.id]; })
        .slice(0, n).map(function (a) { return { label: etiquette(a), action: a.id }; });
    }
    // une suggestion recopiée au clavier vaut la suggestion touchée
    function ideeTapee(raw) {
      var t = normalize(raw).replace(/^(je |j )/, ''), mots = t.split(/\s+/).filter(function (m) { return m.length > 3; });
      if (!mots.length) return null;
      return availableActions().filter(function (a) { return /^(fausse|risque|folie)$/.test(a.ideaKind || '') && (!a.ideaCond || a.ideaCond(api)); }).filter(function (a) {
        var l = normalize(etiquette(a)).split(/\s+/).filter(function (m) { return m.length > 3; });
        var communs = l.filter(function (m) { return t.indexOf(m.slice(0, Math.max(4, m.length - 2))) >= 0; }).length;
        return l.length && communs / l.length >= 0.75 && mots.length <= l.length + 3;
      })[0] || null;
    }
    // ----- en conversation : de bonnes questions, des banalités, des maladresses -----
    function suggestionsParole(n, mode) {
      var npc = scene.npcs[s.talk]; if (!npc) return [];
      n = n || 5; mode = mode || 'normal';
      var st = npcState(npc.id), r = alea(signatureIdees() + '|' + Object.keys(st.asked).length + '|' + s.turn);
      var sujets = topicChips(npc).map(function (t) { return { label: t.label, topic: t.topic, asked: t.asked }; });
      var ex = scene.paroles ? scene.paroles(api, npc) : null, banal = melanger(((ex && ex.banal) || []).slice(), r), mal = melanger(((ex && ex.maladresse) || []).slice(), r);
      var out = [], vus = {};
      function prend(c) { if (!c || vus[c.label] || out.length >= n) return; vus[c.label] = 1; out.push(c); }
      var k = Math.max(1, nbPistes(r, mode));
      sujets.filter(function (t) { return !t.asked; }).slice(0, k).forEach(prend);
      prend(banal[0]);
      if (mode !== 'guide' || sanState() >= 2) prend(mal[0]);
      sujets.forEach(prend);
      banal.slice(1).forEach(prend);
      return melanger(out, r);
    }
    function fallback(p, cands) {
      var near = cands.filter(function (c) { return c.score >= 0.75; }).slice(0, 3);
      var noun = p.nouns[0], verb = p.verbs[0];
      var generic = scene.generic;
      if (noun && !nounHere(noun.id) && !(lex.concepts[noun.id].type === 'x')) {
        var lab = labelOf(noun.id);
        api.say(fresh('absent', generic.absent).replace('{x}', lab).replace('{X}', lab.charAt(0).toUpperCase() + lab.slice(1)) + ' ' + (listThings() ? 'Ici, vous remarquez : ' + listThings() + '.' : ''));
      } else if (verb && generic.verbs[verb.id]) {
        var g = generic.verbs[verb.id];
        var txt = typeof g === 'function' ? g(api, p, noun) : Array.isArray(g) ? fresh('gen:' + verb.id, g) : g;
        api.say(txt.replace('{things}', listThings()).replace('{x}', noun ? labelOf(noun.id) : 'cela'));
      } else if (noun) {
        var pool = lex.concepts[noun.id].type === 'x' && generic.thinkOnly ? generic.thinkOnly : generic.nounOnly;
        var line = fresh('nounonly', pool).replace('{x}', labelOf(noun.id));
        api.say(line.charAt(0).toUpperCase() + line.slice(1));
      } else {
        api.say(scene.lost ? scene.lost(api, p) : fresh('lost', generic.lost));
      }
      var chips = near.length ? near.map(function (c) { return { label: c.a.label, action: c.a.id }; }) : ideas(3);
      if (chips.length) api.chips(chips);
    }

    // combien de vrais mots de la phrase portent l'action choisie ? Une longue phrase ne s'interprète pas sur un seul mot.
    var MOTS_VIDES = new Set('decide decidons commence commencons continue continuons souhaite souhaitons compte comptons entreprends mets prends temps moment instant peu beaucoup grand grande petit petite vieux vieille bon bonne tout toute meme autre chose facon maniere air'.split(' '));
    function tropPeuCompris(a, p) {
      var mots = p.text.split(' ').filter(function (w) { return w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w) && !/ment$/.test(w) && !MOTS_VIDES.has(w); });
      if (mots.length < 4) return false;
      var cles = {}; [a.verbs, a.nouns, a.extra, a.extraVerbs, a.also].forEach(function (l) { (l || []).forEach(function (k) { cles[k] = 1; }); });
      var appui = p.all.filter(function (x) { return x.score >= 0.8 && cles[x.id]; }).length;
      return appui < 2;
    }
    function low1(x) { x = String(x); return /^(Le|La|Les|L’) /.test(x) || /^L’/.test(x) ? x.charAt(0).toLowerCase() + x.slice(1) : x; }
    function cap1(x) { x = String(x); return x.charAt(0).toUpperCase() + x.slice(1); }
    function handleWorld(p) {
      paroleJoueur = p;
      // « je demande à Pratt si… » : on va lui parler, et on lui pose la question
      var dest = destinataire(p);
      if (dest && pnjPresent(dest.id)) {
        var ta = availableActions().filter(function (a) { return a.talkTo === dest.id; })[0];
        var reste = rewrite(lex, parse(lex, dest.reste, scene.phrases));
        exec(ta, rewrite(lex, parse(lex, '', scene.phrases)));
        if (s.talk === dest.id && !s.pending && dest.reste.split(/\s+/).length >= 2) handleDialogue(reste);
        return;
      }
      // « j'ai essayé de l'étrangler », dit à personne : c'est du passé, on ne le rejoue pas
      if (R_PASSE.test(' ' + normalize(p.raw) + ' ') && !/\?\s*$/.test(p.raw) && !/\b(decide|choisi|fini|termine|compris|change d avis)\b/.test(normalize(p.raw))) {
        api.say(fresh('recitSeul', ['Ce qui est fait est fait. Reste à savoir ce que vous faites maintenant.', 'Vous y repensez un instant. Mais personne, ici, ne vous a rien demandé. Que faites-vous ?', 'Le passé ne se rejoue pas. Et maintenant ?']));
        s.tick = 0; return;
      }
      if (scene.improvise && scene.improvise(api, p)) return;
      var cands = rankActions(p);
      var best = cands[0], second = cands[1];
      // un personnage nommé qui n'est pas là : on le dit, plutôt que de faire autre chose
      var n0 = p.nouns[0];
      if (best && n0 && lex.concepts[n0.id].type === 'n' && !nounHere(n0.id)) {
        var handles = (best.a.nouns || []).concat(best.a.extra || [], best.a.also || []);
        if (handles.indexOf(n0.id) < 0 && !p.nouns.some(function (n) { return n.id !== n0.id && handles.indexOf(n.id) >= 0 && lex.concepts[n.id].type === 'n'; })) { fallback(p, []); return; }
      }
      if (best) {
        var margin = second ? best.score - second.score : 9;
        if ((best.score >= THRESHOLD && margin >= 0.05) || (best.score >= SOFT && margin >= 0.15) || best.score >= THRESHOLD + 0.4) {
          // une longue phrase dont un seul mot est compris : on ne devine pas, on demande
          if (tropPeuCompris(best.a, p)) {
            api.say(fresh('peuCompris', ['Votre phrase peut vouloir dire plusieurs choses, et un seul mot m’y accroche. Que faites-vous, au juste ?', 'Je ne suis pas sûr de vous suivre. Dites-le plus simplement, ou choisissez :', 'Trop de mots m’échappent dans cette phrase pour que je devine. Vous voulez :']));
            api.chips(cands.filter(function (c) { return c.score >= best.score - 0.6; }).slice(0, 3).map(function (c) { return { label: c.a.label, action: c.a.id }; }));
            s.tick = 0; return;
          }
          exec(best.a, p); return;
        }
      }
      var vb = p.verbs[0], room = p.nouns.every(function (n) { return /^(SALLE|PIECE|LIEU|ICI|CHAMBRE|PORTE|MUR)$/.test(n.id) || !nounHere(n.id); });
      if (vb && vb.score >= 0.9 && room && (!best || best.score < SOFT)) {
        var nt = normalize(p.raw);
        if (vb.id === 'FOUILLER' || (vb.id === 'EXAMINER' && /\b(attentivement|minutieusement|indices?|en detail|de pres|partout|recoins?|soigneusement)\b/.test(nt))) { doJet({ skill: 'Trouver Objet Caché' }, p); return; }
        if (vb.id === 'ECOUTER') { doJet({ skill: 'Écouter' }, p); return; }
      }
      if (best && best.score >= SOFT) {
        api.say(fresh('clarify', scene.generic.clarify));
        api.chips(cands.filter(function (c) { return c.score >= best.score - 0.3; }).slice(0, 3).map(function (c) { return { label: c.a.label, action: c.a.id }; }));
        s.tick = 0;
        return;
      }
      fallback(p, cands);
    }

    // ----- dialogues -----
    function topicScore(t, p) {
      var best = 0;
      (t.keys || []).forEach(function (k) {
        var id = typeof k === 'string' ? k : k[0], w = typeof k === 'string' ? 1 : k[1];
        if (p.c[id] !== undefined) best = Math.max(best, p.c[id] * w);
      });
      return best;
    }
    function rankTopics(npc, p) {
      return (npc.topics || []).filter(function (t) { return !t.cond || t.cond(api); })
        .map(function (t, i) { return { t: t, i: i, score: topicScore(t, p) }; })
        .filter(function (x) { return x.score > 0; })
        .sort(function (a, b) { return (b.score - a.score) || (nounScore(b.t, p) - nounScore(a.t, p)) || (premierMot(a.t, p) - premierMot(b.t, p)) || (a.i - b.i); });
    }
    // ----- ce qui a été abordé avec chaque personnage -----
    // Une suggestion de sujet ne sort que si on en a déjà parlé avec lui (le joueur ou lui-même l'a nommé),
    // ou si la chose est là, sous les yeux. Sinon la suggestion trahirait ce que le personnage ne sait pas encore.
    var SUJETS_LIBRES = { TOIMEME: 1, AUREVOIR: 1, ARGENT: 1, HEURE: 1, POLI: 1, PSY: 1, FLATTER: 1, PERSUADER: 1, BARATIN: 1, MENACER: 1, INSISTER: 1, COMMANDER: 1, BOISSON: 1, DONNER: 1, SUITE: 1 };
    var GENERIQUES = { QUELQUUN: 1, AUTREX: 1, SALLE: 1, PORTE: 1, LAMPE: 1, TABLE: 1, ICI: 1 };
    function abordes(id) { s.abordes = s.abordes || {}; return s.abordes[id] || (s.abordes[id] = {}); }
    function noterAborde(id, p) {
      if (!id || !p) return;
      var a = abordes(id);
      (p.all || []).forEach(function (x) { var c = lex.concepts[x.id]; if (c && c.type !== 'v' && x.score >= 0.9) a[x.id] = 1; });
      if (p.pronom) a[p.pronom] = 1;
    }
    function noterReplique(id, x) {
      if (!id || typeof x !== 'string' || !scene.npcs || !scene.npcs[id]) return;
      var a = abordes(id);
      normalize(x, scene.phrases).split(' ').forEach(function (w) {
        if (w.length < 3 || STOP.has(w)) return;
        var c = lex.exact[w]; if (c && lex.concepts[c] && lex.concepts[c].type !== 'v') a[c] = 1;
      });
    }
    function sujetOuvert(npc, t, st) {
      if (st.asked[t.id] || t.chipAlways) return true;
      var a = abordes(npc.id), self = npc.selfKeys || [], sujets = 0, ouvert = false;
      (t.keys || []).forEach(function (k) {
        var id = typeof k === 'string' ? k : k[0], w = typeof k === 'string' ? 1 : k[1], c = lex.concepts[id];
        if (!c || c.type === 'v' || SUJETS_LIBRES[id] || self.indexOf(id) >= 0) return; // un geste, ou lui-même : toujours proposable
        sujets++;
        if (w < 0.9) return;
        if (a[id] || (w >= 1 && !GENERIQUES[id] && nounHere(id))) ouvert = true;
      });
      return ouvert || sujets === 0;
    }
    function topicChips(npc) {
      var st = npcState(npc.id);
      var list = (npc.topics || []).filter(function (t) { return t.chip && (!t.cond || t.cond(api)) && (!t.chipCond || t.chipCond(api)) && sujetOuvert(npc, t, st); })
        .map(function (t) { return { label: t.chip, topic: t.id, asked: !!st.asked[t.id] }; });
      list.sort(function (a, b) { return (a.asked ? 1 : 0) - (b.asked ? 1 : 0); });
      return list.slice(0, 6);
    }
    function runTopic(npc, topicId, p) {
      var t = npc.topics.find(function (x) { return x.id === topicId; });
      if (!t) return;
      var st = npcState(npc.id);
      var n = st.asked[topicId] || 0;
      st.asked[topicId] = n + 1;
      if (!t.noFollow) { st.last = topicId; st.more = 0; }
      st.dernierSujet = { id: topicId, turn: s.turn };
      if (!/^(poli|aurevoir|toimeme|etat|insulte|embrasser|danser|chanter|manger|meta|heure)$/.test(topicId)) st.ecart = 0;
      s.tick = scene.talkTick || 1;
      talkMode = 'topic'; sujetEnCours = topicId;
      try {
        if (t.run) t.run(api, n, p);
        else api.npc(npc.id, t.lines[Math.min(n, t.lines.length - 1)]);
      } finally { talkMode = null; sujetEnCours = null; }
    }
    // ----- la question en suspens -----
    // Un personnage qui vient de poser une question doit pouvoir entendre « oui », « non » ou « je ne sais pas ».
    // Une amorce du fil (« Vous avez vu, n'est-ce pas ? ») : la réponse ouvre le sujet qu'il voulait aborder.
    // Une réplique écrite : « oui » fait venir la suite du même sujet. Sinon, il prend acte, dans son ton.
    // Et sans question posée, un « oui » tout seul l'étonne (« À quoi répondez-vous ? ») : jamais « je n'ai pas saisi ».
    var BREF_OUI = /^(oui|ouais|ouaip|si|bien sur|bien entendu|evidemment|naturellement|certes|absolument|exactement|tout a fait|en effet|affirmatif|d accord|ok|entendu|volontiers|avec plaisir|ca marche|marche conclu|pourquoi pas|allons y|c est vrai|c est exact|c est ca|c est cela|je crois|je pense|je le crois|je le pense|helas oui|un peu|plutot|en quelque sorte|il me semble|j ai vu|je les ai vues?|je l ai vue?)\b/;
    var BREF_NON = /^(non|nan|nenni|jamais|pas du tout|nullement|aucunement|pas vraiment|pas encore|pas que je sache|helas non|je ne crois pas|je ne pense pas|je crains que non|surement pas|certainement pas|personne|rien|aucun|aucune)\b/;
    var BREF_VAGUE = /^(peut etre|sans doute|probablement|je ne sais pas|je sais pas|je l ignore|aucune idee|difficile a dire|ca depend|cela depend|qui sait|bof|mouais|hum|euh)\b/;
    var BREF_RESTE = /\b(monsieur|madame|mademoiselle|professeur|docteur|inspecteur|sergent|mon ami|mon cher|ma chere|merci|vraiment|bien sur|helas|je crois|je pense|en effet|tout a fait|pas du tout|du tout|absolument|certainement|malheureusement|oui|non|si|je|j|l|les|le|la|ai|vu|vue|vues|vus|que|ne|pas|sais|c|est|ca|cela|vrai|exact|et|mais|ma foi|eh bien|ah|oh|bah|ben|n|m|en|y|rien|suis|sur|sure|certain|certaine|crois|pense|tout|bien|avec|plaisir|marche|conclu|pourquoi|allons|d|accord|entendu|volontiers|ok)\b/g;
    // « Que puis-je pour vous ? », « de sa part, ou contre lui ? » : on n'y répond pas par oui ou par non
    function questionOuverte(x) {
      var ph = ((x.replace(/[»«]/g, ' ').match(/[^.!?…]+[.!?…]+/g) || []).filter(function (y) { return /\?\s*$/.test(y); }).pop() || '').trim();
      return /^(Que|Qu’|Qu'|Qui|Où|Quand|Comment|Pourquoi|Quels?|Quelles?|Combien|À quoi|De quoi|De qui|À qui|Pour qui|Lequel|Laquelle|L’objet|Et (vous|alors))\b/.test(ph)
        || /\bou (bien |plutôt |contre |pour )|, ou /.test(ph)
        || /^(Oui|Alors|Pardon|Hm|Hein|Plaît-il|Vous disiez|C’est-à-dire|Mais encore|Encore|Eh bien|Monsieur|Madame|Mademoiselle|Docteur|Professeur|Miss|Sir|Inspecteur|Mon ami|Mon cher|Ma chère)\s*\?$/.test(ph);
    }
    function reponseBreve(p, npc) {
      var t = normalize(p.raw || '').trim();
      if (!t || /\?/.test(p.raw || '') || t.split(/\s+/).length > 6) return null;
      var k = BREF_VAGUE.test(t) ? 'vague' : BREF_OUI.test(t) ? 'oui' : BREF_NON.test(t) ? 'non' : null;
      if (!k) return null;
      // rien d'autre dans la phrase : « oui, professeur » est une réponse ; « oui, les photographies » parle d'un sujet
      if (t.replace(k === 'vague' ? BREF_VAGUE : k === 'oui' ? BREF_OUI : BREF_NON, ' ').replace(BREF_RESTE, ' ').replace(/\s+/g, '')) return null;
      return k;
    }
    // cas : 'q' il avait posé une question fermée ; 'o' une question ouverte (« oui » n'y répond pas) ;
    //       'd' il venait de dire quelque chose (on acquiesce, on doute) ; 's' personne n'avait rien demandé
    function prendreActe(npc, st, k, cas) {
      var dit = false, libre = cas === 'q' || cas === 'd';
      talkMode = 'raw';
      try { dit = !!(scene.converse && scene.converse.bref && scene.converse.bref(api, npc, k, cas)); } catch (err) { dit = false; }
      if (!dit) {
        var G0 = cas === 'q' ? { oui: ['« Bien. »', '« Je m’en doutais. »', '« Bon. »'], non: ['« Non ? Ah. »', '« Tant pis. »', '« Soit. »'], vague: ['« Vous n’en êtes pas sûr. »', '« Ni oui ni non, donc. »'] }[k]
          : cas === 'd' ? (k === 'oui' ? ['« Voilà. »', '« Comme je vous le dis. »', '« Eh oui. »'] : ['« C’est pourtant ainsi. »', '« Croyez ce que vous voulez. »'])
          : cas === 'o' ? ['« Mais encore ? »', '« Ce n’est pas une réponse. »', '« C’est-à-dire ? »']
          : ['« Pardon ? À quoi répondez-vous ? »', '« Vous disiez ? »', '« Je ne vous avais rien demandé, je crois. »'];
        api.npc(npc.id, fresh('bref:' + k + ':' + cas + ':' + npc.id, G0));
      }
      talkMode = null;
      st.question = null;
      s.tick = scene.talkTick || 1;
      if (!libre) { st.ecart = (st.ecart || 0) + 1; st.brefs = (st.brefs || 0) + 1; if (st.brefs % 3 === 0) st.patience -= 1; if (st.patience <= 0) { closeTalk(npc); return; } }
      if (s.talk === npc.id && filIntrigue(npc, st)) return;
      if (!libre && s.talk === npc.id) { var chips = topicChips(npc); if (chips.length) api.chips(chips.map(function (c) { return { label: c.label, topic: c.topic }; })); }
    }
    function repondreBref(npc, st, k, p) {
      var q = st.question && s.turn - st.question.turn <= 1 ? st.question : null;
      st.question = null;
      if (G.RPG_BREFS) G.RPG_BREFS.push({ who: npc.id, k: k, q: q });
      var dispo = function (id) { var t = id && (npc.topics || []).filter(function (x) { return x.id === id; })[0]; return t && (!t.cond || t.cond(api)) ? t : null; };
      // une offre écrite (« cinquante francs la journée ») à laquelle on répond « d'accord » : le sujet dit quoi faire (t.oui, t.non)
      var d = st.dernierSujet && s.turn - st.dernierSujet.turn <= 1 ? dispo(st.dernierSujet.id) : null, suite = d && k !== 'vague' && d[k];
      if (suite) {
        if (typeof suite === 'function') { talkMode = 'topic'; try { suite(api, p); } finally { talkMode = null; } s.tick = scene.talkTick || 1; return; }
        if (dispo(suite)) { runTopic(npc, suite, p); return; }
      }
      // il voulait en venir là : on y vient
      if (q && q.fil && dispo(q.fil)) { runTopic(npc, q.fil, p); return; }
      var vientDeParler = st.parle !== undefined && s.turn - st.parle <= 1;
      if (q && q.ouverte) { prendreActe(npc, st, k, 'o'); return; }
      // « oui » à une réplique écrite (question ou non) : la suite du même sujet, s'il en reste
      var sj = (q && q.sujet) || (!q && vientDeParler && st.dernierSujet && s.turn - st.dernierSujet.turn <= 1 && st.dernierSujet.id);
      if (sj && k === 'oui') {
        var t = dispo(sj), n = st.asked[sj] || 0;
        if (t && !t.run && t.lines && n < t.lines.length) { runTopic(npc, sj, p); return; }
        var more = t && (typeof t.more === 'function' ? t.more(api) : t.more);
        if (t && more && more.length && (st.more || 0) < more.length && st.last === sj) { followUp(npc); return; }
      }
      prendreActe(npc, st, k, q ? 'q' : vientDeParler ? 'd' : 's');
    }
    function followUp(npc) {
      var st = npcState(npc.id);
      var t = st.last && npc.topics.find(function (x) { return x.id === st.last; });
      var more = t && t.more;
      if (typeof more === 'function') more = more(api);
      talkMode = 'topic';
      if (more && more.length && (st.more || 0) < more.length) {
        api.npc(npc.id, more[st.more || 0]);
        st.more = (st.more || 0) + 1;
      } else {
        st.patience -= 1;
        if (st.patience <= 0) { talkMode = null; closeTalk(npc); s.tick = scene.talkTick || 1; return; }
        talkMode = 'raw';
        api.npc(npc.id, fresh('nomore:' + npc.id, npc.noMore || ['…']));
      }
      talkMode = null;
      s.tick = scene.talkTick || 1;
    }
    function startTalk(npcId, p) {
      // les gens ont des heures : la nuit, le dimanche, certains ne sont pas là (scene.disponible)
      if (scene.disponible) { var absent = scene.disponible(api, npcId); if (absent) { api.say(absent); return; } }
      retenir(conceptDuPnj(npcId));
      var npc = scene.npcs[npcId];
      var st = npcState(npcId);
      if (st.closedUntil > s.min) {
        // le PNJ refuse : réactions de plus en plus fermées
        var pool = npc.refuse || ['…'];
        var line = st.refuse < pool.length ? pool[st.refuse] : fresh('refuse:' + npcId, pool.slice(-2));
        st.refuse++;
        talkMode = 'raw';
        if (/«/.test(line)) logNpc(npcId, line); else api.say(line);
        talkMode = null;
        return;
      }
      s.talk = npcId;
      var first = !st.met;
      st.met = true;
      if (st.closedUntil >= 0 && st.patience <= 0) {
        st.patience = Math.ceil((npc.patience || 6) / 2);
        st.closedUntil = -1;
        talkMode = 'raw';
        logNpc(npcId, npc.reopen || '…');
        talkMode = null;
      } else {
        talkMode = 'greet';
        if (typeof npc.greet === 'function') npc.greet(api, first);
        else api.npc(npcId, first ? npc.greet[0] : npc.greet[1]);
        talkMode = null;
      }
      if (p && s.talk === npcId) {
        // « je l'ai vu » : « l' » ne désigne quelqu'un, pour ce personnage, que si on en a déjà parlé avec lui
        var horsTerrain = p.pronom && !abordes(npcId)[p.pronom] ? p.pronom : null;
        noterAborde(npcId, p);
        paroleJoueur = p;
        var q = cloneParse(p);
        if (horsTerrain) { delete q.c[horsTerrain]; q.nouns = q.nouns.filter(function (n) { return n.id !== horsTerrain; }); q.all = q.all.filter(function (n) { return n.id !== horsTerrain; }); }
        (npc.selfKeys || []).forEach(function (k) { delete q.c[k]; });
        delete q.c.PARLER; delete q.c.ALLER;
        // la phrase qui ouvre la conversation passe par les mêmes garde-fous que les suivantes :
        // un récit (« j'ai essayé de l'étrangler ») est écouté, pas pris pour une question sur quelqu'un
        if (recit(p.raw)) { handleDialogue(q); return; }
        var tops = rankTopics(npc, q).filter(function (x) { return !horsSujet(x.t, q, npc); });
        if (tops[0] && tops[0].score >= 0.64) runTopic(npc, tops[0].t.id, q);
      }
    }
    // la part d'un sujet qui tient à un nom (une personne, un lieu, une chose), et non à un mot vague
    // à égalité, le sujet nommé le premier (« depuis quand Beddows servait-il Smith ? » : Beddows)
    function premierMot(t, p) {
      var best = 999;
      (t.keys || []).forEach(function (k) {
        var id = typeof k === 'string' ? k : k[0];
        (p.all || []).forEach(function (x) { if (x.id === id && x.pos >= 0 && x.pos < best) best = x.pos; });
      });
      return best;
    }
    function nounScore(t, p) {
      var best = 0;
      (t.keys || []).forEach(function (k) {
        var id = typeof k === 'string' ? k : k[0], w = typeof k === 'string' ? 1 : k[1], c = lex.concepts[id];
        if (p.c[id] !== undefined && c && c.type === 'n') best = Math.max(best, p.c[id] * w);
      });
      return best;
    }
    // un sujet écrit qu'on est sûr d'avoir reconnu : un nom bien identifié, ou un geste précis (menacer, payer, flatter…)
    var VAGUE = { SUITE: 1, INSISTER: 1, PARLER: 1, ATTENDRE: 1 };
    function sureScore(t, p, A, nounsOnly) {
      var best = 0, ents = (A && A.a && A.a.ents) || [];
      (t.keys || []).forEach(function (k) {
        var id = typeof k === 'string' ? k : k[0], w = typeof k === 'string' ? 1 : k[1], c = lex.concepts[id];
        if (p.c[id] === undefined) return;
        var sc = p.c[id] * w;
        if (c && c.type === 'n') { if (ents.indexOf(id) >= 0) best = Math.max(best, sc); }
        else if (!nounsOnly && !VAGUE[id] && p.c[id] >= 0.9) best = Math.max(best, sc);
      });
      return best;
    }
    // ----- le fil de l'intrigue -----
    // Quand la conversation s'égare, un personnage important y revient de lui-même, à sa façon : une remarque
    // en passant, un regard, jamais une consigne. scene.fils[pnj] = [{ t: sujet écrit, cond, x: réplique(s) }].
    // Une amorce par sujet, jamais deux de suite, et seulement si le sujet n'a pas encore été abordé.
    function filIntrigue(npc, st) {
      var fils = scene.fils && scene.fils[npc.id];
      if (!fils || s.pending || s.ended || s.talk !== npc.id || (st.ecart || 0) < 2 || s.turn - (st.filTour === undefined ? -9 : st.filTour) < 4) return false;
      // il vient de poser une question : on ne parle pas par-dessus
      var last = s.log[s.log.length - 1];
      if (last && last.t === 'npc' && /\?\s*»?\s*$/.test(last.x)) return false;
      st.fil = st.fil || {};
      for (var i = 0; i < fils.length; i++) {
        var f = fils[i];
        if (st.fil[i]) continue;
        if (f.cond && !f.cond(api)) continue;
        if (f.t) {
          if (st.asked[f.t]) { st.fil[i] = 1; continue; }
          var top = (npc.topics || []).filter(function (x) { return x.id === f.t; })[0];
          if (!top || (top.cond && !top.cond(api))) continue;
        }
        st.fil[i] = 1; st.filTour = s.turn; st.ecart = 0;
        var x = Array.isArray(f.x) ? fresh('fil:' + npc.id + ':' + i, f.x) : f.x;
        talkMode = 'raw'; filEnCours = f.t || null; logNpc(npc.id, x); filEnCours = null; talkMode = null;
        // une amorce attend toujours qu'on la suive, même quand elle ne finit pas sur un point d'interrogation
        if (f.t && s.talk === npc.id) st.question = { turn: s.turn, fil: f.t, sujet: null, ouverte: false };
        if (G.RPG_FILS) G.RPG_FILS.push({ who: npc.id, t: f.t, x: x });
        return true;
      }
      return false;
    }
    function afterConverse(npc, st) {
      st.offs = (st.offs || 0) + 1;
      st.ecart = (st.ecart || 0) + 1;
      if (st.offs % 5 === 0) st.patience -= 1;
      s.tick = scene.talkTick || 1;
      if (st.patience <= 0) { closeTalk(npc); return; }
      if (filIntrigue(npc, st)) return;
      // sans fil écrit pour lui, le personnage laisse voir de quoi il peut parler
      if (!(scene.fils && scene.fils[npc.id]) && st.offs % 3 === 0 && !s.pending) { var chips = topicChips(npc); if (chips.length) api.chips(chips.map(function (c) { return { label: c.label, topic: c.topic }; })); }
    }
    // un sujet écrit doit porter sur ce dont parle la phrase : « où est Camberwell ? » nomme Camberwell,
    // et ne déclenche pas « le Turc » sous prétexte qu'on a dit « où est »
    function horsSujet(t, p, npc) {
      var self = npc.selfKeys || [], f = (scene.fiches || {})[npc.id] || {};
      // un vrai sujet : quelqu'un, ou une chose sur laquelle ce personnage (ou tout le monde) a quelque chose à dire
      var parlant = function (id) {
        if (lex.concepts[id].npc || (f.sait && f.sait[id]) || (f.avis && f.avis[id]) || (scene.rumeurs && scene.rumeurs[id])) return true;
        return (npc.topics || []).some(function (x) { return x !== t && (x.keys || []).some(function (k) { return (typeof k === 'string' ? k : k[0]) === id; }); });
      };
      var sujets = p.nouns.filter(function (n) { var c = lex.concepts[n.id]; return c && c.type === 'n' && n.score >= 0.9 && self.indexOf(n.id) < 0 && !GENERIQUES[n.id] && parlant(n.id); });
      if (!sujets.length) return false;
      var cles = (t.keys || []).map(function (k) { return typeof k === 'string' ? k : k[0]; });
      return !sujets.some(function (n) { return cles.indexOf(n.id) >= 0; });
    }
    function handleDialogue(p) {
      // un récit (« j'ai essayé de l'étrangler ») : on en parle, on ne le refait pas. Les verbes ne déclenchent rien.
      if (recit(p.raw)) {
        p = cloneParse(p); p.recit = true;
        p.all = p.all.filter(function (x) { return x.type !== 'v' && x.type !== 's'; });
        p.verbs = []; p.c = {}; p.all.forEach(function (x) { p.c[x.id] = x.score; });
      }
      paroleJoueur = p;
      var npc = scene.npcs[s.talk];
      noterAborde(s.talk, p);
      var st = npcState(npc.id);
      var tops = rankTopics(npc, p).filter(function (x) { return !horsSujet(x.t, p, npc); });
      var tb = tops[0];
      var cands = rankActions(p);
      var best = cands[0];
      var worldVerb = p.verbs.some(function (v) { return ESCAPE_VERBS[v.id]; });
      var selfOnly = best && best.a.talkTo === npc.id;
      var A = null;
      try { A = scene.converse && scene.converse.peek ? scene.converse.peek(api, npc, p) : null; } catch (err) { A = null; }
      function talkBack() {
        var said0 = s.seq, ok = false;
        try { ok = scene.converse(api, npc, p); } catch (err) { if (G.console) G.console.error(err); ok = s.seq > said0; }
        if (ok) afterConverse(npc, st);
        return ok;
      }
      // on s'adresse à quelqu'un d'autre que son interlocuteur
      var dest = destinataire(p);
      // (quelqu'un qui n'est pas là : c'est de lui qu'on parle, l'interlocuteur répond)
      if (dest && dest.id !== npc.id && pnjPresent(dest.id)) {
        api.endTalk(false);
        startTalk(dest.id);
        if (s.talk === dest.id && dest.reste.split(/\s+/).length >= 2) handleDialogue(rewrite(lex, parse(lex, dest.reste, scene.phrases)));
        return;
      }
      // un geste (« j'examine le projecteur », « je retourne dans le couloir ») : on quitte la conversation pour agir
      // en mode « Dire », les mots restent des mots : seul « je m'en vais », dit tout haut, met fin à la conversation
      if (p.dit && /^(bon |bien |allez |alors |eh bien |sur ce |excusez moi |pardon )*(je (m en vais|pars|sors|file|vous laisse|te laisse|vous quitte|dois (y aller|partir|filer|vous laisser))|il faut que j y aille|a bientot|a plus tard|a demain|bonne (nuit|soiree|journee))\b/.test(normalize(p.raw))) { api.endTalk(); return; }
      if (!p.dit && !p.recit && GESTE.test(p.text) && !/\?\s*$/.test(p.raw) && !(A && A.a && (A.a.insulte || A.a.menace || A.a.anaW || A.a.absurde))) {
        var seul = rankActions(p)[0];
        if (!(seul && seul.a.talkTo === npc.id)) { api.endTalk(false); handleWorld(p); return; }
      }
      // l'humeur passe avant tout : on ne répond pas sagement à une insulte, à une absurdité, à un mot d'un autre siècle
      if (scene.converse && scene.converse.avant) {
        var menaceTopic = p.c.MENACER !== undefined && (npc.topics || []).some(function (x) { return (x.keys || []).some(function (k) { return (typeof k === 'string' ? k : k[0]) === 'MENACER'; }); });
        var pris = false;
        try { pris = scene.converse.avant(api, npc, p, { topic: !!(tb && tb.score >= 0.64), menaceTopic: menaceTopic }); } catch (err) { if (G.console) G.console.error(err); }
        if (pris) { s.tick = scene.talkTick || 1; return; }
        if (s.talk !== npc.id) return;
      }
      // « parlez-moi de cet homme », « et lui ? » : on revient sur le dernier sujet, pas sur sa dernière question
      if (!p.nouns.length && st.last && /\b(cet homme|ce monsieur|ce type|ce gars|cet individu|cette femme|cette dame|celui la|celle la|ce personnage|de lui|d elle|sur lui|sur elle)\b/.test(p.text) && npc.topics.some(function (x) { return x.id === st.last && (!x.cond || x.cond(api)); })) { runTopic(npc, st.last, p); return; }
      // une réponse à la question que le PNJ vient de poser
      if (A && A.answer && talkBack()) return;
      var bref = reponseBreve(p, npc);
      if (bref) { repondreBref(npc, st, bref, p); return; }
      if (A && A.mine && talkBack()) return;
      if (A && A.a && A.a.ents.length && scene.converse.note) scene.converse.note(api, npc, A.a.ents[0]);
      var addressed = A && A.addressed;
      if (!p.dit && !selfOnly && worldVerb && !addressed && !/\?\s*$/.test(p.raw) && best && best.score >= THRESHOLD && (!tb || tb.score < 0.9 || best.score - tb.score > 0.9)) {
        api.endTalk(false);
        exec(best.a, p); return;
      }
      // « je l'observe », « je le jauge » : sans sujet écrit pour ça, c'est un jet de Psychologie
      if (!p.dit && /^(je|j) (l |le |la )?(observe|jauge|scrute|sonde|devisage|etudie son visage|cerne|examine son visage|lis dans son regard)/.test(normalize(p.raw)) && !tops.some(function (x) { return (x.t.keys || []).indexOf('PSY') >= 0; })) { doJet({ skill: 'Psychologie' }, p); return; }
      // une question sur lui, une insulte, une machine, un nom : le personnage d'abord, sauf si un sujet écrit vise précisément la chose
      if (A && A.prior && A.a.claim) {
        // une scène écrite pour ce mensonge-là (un jet de Baratin prévu) passe avant la règle générale
        var lieTop = tops.filter(function (x) { return (x.t.keys || []).some(function (k) { var id = typeof k === 'string' ? k : k[0]; return id === 'BARATIN' || id === 'IMPOSTEUR'; }) && skillsOf('t:' + npc.id + ':' + x.t.id, x.t.run).length; })[0];
        if (lieTop) { runTopic(npc, lieTop.t.id, p); return; }
      }
      if (A && A.prior && (A.a.claim || A.a.nom || A.a.quisuisje || A.a.insulte || A.a.meta || A.a.ana) && talkBack()) return;
      if (A && A.prior) {
        var nounTop = tops.filter(function (x) { return sureScore(x.t, p, A, true) >= 0.64; })[0];
        if (nounTop) { runTopic(npc, nounTop.t.id, p); return; }
        if (talkBack()) return;
      }
      // un sujet que le personnage connaît (« l'homme à moustache ») passe avant un sujet écrit qui n'accroche que par un verbe (« passé »)
      if (A && A.connu && tb && sureScore(tb.t, p, A, true) < 0.64 && talkBack()) return;
      if (tb && tb.score >= 0.64 && (!A || A.short || sureScore(tb.t, p, A) >= 0.64)) { runTopic(npc, tb.t.id, p); return; }
      var sureTop = A && tops.filter(function (x) { return sureScore(x.t, p, A) >= 0.64; })[0];
      if (sureTop) { runTopic(npc, sureTop.t.id, p); return; }
      if (p.c.SUITE !== undefined && (!A || A.short)) { followUp(npc); return; }
      if (!p.dit && !p.recit && !selfOnly && !addressed && best && best.score >= THRESHOLD) {
        api.endTalk(false);
        exec(best.a, p); return;
      }
      // pas de sujet écrit d'avance : le PNJ répond de lui-même, avec ce qu'il est et ce qu'il sait
      if (A && talkBack()) return;
      if (tb && tb.score >= 0.64) { runTopic(npc, tb.t.id, p); return; }
      if (p.c.SUITE !== undefined) { followUp(npc); return; }
      if (!p.dit && !selfOnly && best && best.score >= THRESHOLD) {
        api.endTalk(false);
        exec(best.a, p); return;
      }
      // Aucun sujet reconnu : le PNJ réagit dans son propre ton, de moins en moins patient
      st.patience -= 1;
      if (st.patience <= 0) { closeTalk(npc); s.tick = scene.talkTick || 1; return; }
      var tier = patienceTier(npc, st);
      var dpool = tier === 0 ? npc.deflect : tier === 1 ? (npc.deflect2 || npc.deflect) : (npc.deflect3 || npc.deflect2 || npc.deflect);
      talkMode = 'raw';
      api.npc(npc.id, fresh('defl' + tier + ':' + npc.id, dpool));
      talkMode = null;
      st.ecart = (st.ecart || 0) + 1;
      if (s.talk === npc.id && filIntrigue(npc, st)) { s.tick = scene.talkTick || 1; return; }
      var chips = topicChips(npc);
      if (chips.length) api.chips(chips.map(function (c) { return { label: c.label, topic: c.topic }; }));
      s.tick = scene.talkTick || 1;
    }

    // ----- les jets demandés par le joueur -----
    // Comme à la table : le joueur propose une compétence, le Gardien juge s'il y a matière à lancer.
    var SKILLS = [
      ['SAN', /\b(san|sante mentale|ma raison)\b/], ['CHANCE', /\b(chance|hasard)\b/],
      ['Trouver Objet Caché', /\b(perception|percevoir|toc|trouver objets? caches?|objets? caches?|observation|vigilance|spot hidden)\b/],
      ['Écouter', /\b(ecoute|ecouter|ouie|entendre|oreille)\b/],
      ['Psychologie', /\b(psychologie|psycho|jauger|sonder|cerner)\b/],
      ['Bibliothèque', /\b(bibliotheque|biblio|documentation|recherches? documentaires?)\b/],
      ['Occultisme', /\b(occultisme|occulte|esoterisme)\b/], ['Archéologie', /\barcheologie\b/], ['Histoire', /\bhistoire\b/],
      ['Évaluation', /\b(evaluation|evaluer|estimer|expertise|expertiser)\b/], ['Médecine', /\b(medecine|medical|medicale|diagnostic|autopsie)\b/],
      ['Premiers soins', /\b(premiers soins|secourisme|secours)\b/], ['Sciences (biologie)', /\b(biologie|sciences?)\b/],
      ['Mécanique', /\bmecanique\b/], ['Crochetage', /\b(crochetage|crocheter|serrurerie)\b/], ['Discrétion', /\b(discretion|furtivite|discret|discrete)\b/],
      ['Persuasion', /\b(persuasion|persuader|convaincre)\b/], ['Baratin', /\b(baratin|baratiner|bluff|bluffer)\b/], ['Charme', /\b(charme|charmer|seduction|seduire)\b/],
      ['Intimidation', /\b(intimidation|intimider)\b/], ['Crédit', /\b(credit|statut social|rang social|reputation)\b/],
      ['Comptabilité', /\b(comptabilite)\b/], ['Droit', /\b(droit|juridique)\b/], ['Photographie', /\bphoto(graphie)?\b/],
      ['Langue (turc)', /\bturc\b/], ['Langue (latin)', /\blatin\b/], ['Langue (français)', /\bfrancais\b/],
      ['Sauter', /\b(sauter|saut)\b/], ['Grimper', /\b(grimper|escalade)\b/], ['Esquive', /\b(esquive|esquiver)\b/],
      ['COMBAT', /\b(corps a corps|combat|bagarre|armes? a feu|tir|tirer|pistolet|revolver|coup de poing)\b/],
      ['Trouver Objet Caché', /\b(reperer|reperage|fouille|fouiller|chercher|regarder|observer)\b/],
      ['INT', /\b(idee|intelligence|int|intuition|deduction)\b/], ['EDU', /\b(edu|education|connaissances?|culture generale)\b/],
      ['POU', /\b(pou|pouvoir|volonte)\b/], ['FOR', /\b(for|force)\b/], ['DEX', /\b(dex|dexterite|agilite)\b/], ['CON', /\b(con|constitution|endurance)\b/], ['APP', /\b(app|apparence)\b/]
    ];
    var JET_MARK = /\b(jet|jets|test de|test d|tester ma|tester mon|roll|utilise ma competence|utiliser ma competence|d100|les des|lancer les des|lance les des)\b/;
    var JET_BARE = /^(psychologie|perception|toc|trouver objet cache|occultisme|jet)$/;
    function jetRequest(raw) {
      var t = normalize(raw);
      if (/^(je )?(lancer|jet|jets|roll)( (un|le|les|mes) (d100|des|de|jet))?$/.test(t)) return { skill: null };
      if (!JET_MARK.test(' ' + t + ' ') && !JET_BARE.test(t)) return null;
      for (var i = 0; i < SKILLS.length; i++) if (SKILLS[i][1].test(t)) return { skill: SKILLS[i][0] };
      return /\b(jet|jets|d100|des)\b/.test(t) ? { skill: null } : null;
    }
    var SOCIAL = { 'Persuasion': 1, 'Baratin': 1, 'Charme': 1, 'Intimidation': 1, 'Crédit': 1 };
    var TOPIC_SKILL = { PSY: 'Psychologie', PERSUADER: 'Persuasion', BARATIN: 'Baratin', FLATTER: 'Charme', MENACER: 'Intimidation', CREDIT: 'Crédit' };
    var srcCache = {};
    function skillsOf(key, fn) {
      if (srcCache[key]) return srcCache[key];
      var out = [], src = String(fn || ''), re = /check\('([a-z_0-9]+)'/g, m;
      while ((m = re.exec(src))) { var c = scene.checks[m[1]]; if (c && out.indexOf(c.skill) < 0) out.push(c.skill); }
      return (srcCache[key] = out);
    }
    // les jets que le scénario a prévus, ici et maintenant, pour cette compétence
    function scriptedFor(sk, p) {
      var found = [];
      if (s.talk) {
        var npc = scene.npcs[s.talk];
        (npc.topics || []).forEach(function (t) {
          if (t.cond && !t.cond(api)) return;
          if (skillsOf('t:' + npc.id + ':' + t.id, t.run).indexOf(sk) >= 0) found.push({ topic: t, npc: npc });
        });
      }
      availableActions().forEach(function (a) {
        if (a.talkTo || (s.done[a.id] && !a.repeatable)) return;
        if (skillsOf('a:' + a.id, a.run).indexOf(sk) >= 0) found.push({ a: a, score: scoreAction(a, p) });
      });
      return found;
    }
    function jetText(k, dflt) { var J = scene.jets || {}; return (J.text && J.text[k]) || dflt; }
    function dayOf() { return Math.floor(s.min / 1440); }
    function doJet(rq, p) {
      var sk = rq.skill;
      s.tick = 1;
      if (!sk) {
        api.say(fresh('jetQuoi', jetText('quoi', ['Aucun jet n’attend les dés. Pour en proposer un au Gardien, dites la compétence : « jet de Trouver Objet Caché », « jet d’Écouter », « jet de Psychologie », « jet d’Idée »…'])));
        return;
      }
      if (sk === 'SAN') { api.say(fresh('jetSan', jetText('san', ['La santé mentale ne se lance pas à volonté. C’est le Gardien qui vous la fait jeter, quand le monde se fissure.']))); return; }
      if (sk === 'CHANCE') { api.say(fresh('jetChance', jetText('chance', ['La chance ne se provoque pas. Le Gardien vous la fera jeter quand le hasard devra trancher.']))); return; }
      if (sk === 'COMBAT') { api.say(fresh('jetCombat', jetText('combat', ['Pour vous battre, dites qui vous frappez, et avec quoi. Les dés suivront.']))); return; }
      var found = scriptedFor(sk, p);
      if (found.length) {
        var topic = found.filter(function (f) { return f.topic; })[0];
        if (topic) { runTopic(topic.npc, topic.topic.id, p); return; }
        found.sort(function (x, y) { return y.score - x.score; });
        if (found.length > 1 && !(found[0].score > 0 && found[0].score > found[1].score)) {
          api.say(fresh('jetChoix', jetText('choix', ['Sur quoi, exactement ?', 'Plusieurs choses s’y prêtent, ici. Laquelle ?'])));
          api.chips(found.slice(0, 4).map(function (f) { return { label: f.a.label, action: f.a.id }; }));
          s.tick = 0; return;
        }
        if (s.talk) api.endTalk(false);
        exec(found[0].a, p); return;
      }
      if (sk === 'Psychologie') return jetPsy();
      if (SOCIAL[sk]) return jetSocial(sk);
      if (sk === 'Trouver Objet Caché' || sk === 'Écouter') return jetLieu(sk);
      if (sk === 'INT') return jetIdee();
      var lbl = { INT: 'Idée', EDU: 'Connaissance', POU: 'Volonté', FOR: 'Force', DEX: 'Dextérité', CON: 'Constitution', APP: 'Apparence' }[sk] || sk;
      api.say(fresh('jetRien', jetText('rien', ['Le Gardien ne fait pas lancer les dés pour rien : ici, rien ne demande votre {s}. Pas encore.', '{S} ? Rien ici ne s’y prête pour l’instant. Quand quelque chose vous intriguera, redemandez.'])).replace(/\{s\}/g, lbl).replace(/\{S\}/g, lbl));
    }
    // les jets improvisés (« jet:lieu:Écouter », « jet:idee:INT »…) n'existent pas dans le scénario : on les fabrique
    // à la demande, et on sait les refaire d'après leur nom, après un rechargement de partie
    function defJet(id, why) {
      var m = /^jet:([a-z]+):(.+)$/.exec(id || ''); if (!m) return null;
      var kind = m[1], sk = m[2];
      if (!scene.checks[id]) scene.checks[id] = { skill: sk, why: why || '', push: kind === 'lieu' ? 'Fouiller encore, plus à fond (jet forcé)' : kind === 'social' ? 'Insister (jet forcé)' : kind === 'idee' ? 'Se concentrer encore (jet forcé)' : null, resolve: function (api2, r) { jetResolve(kind, sk, r); } };
      return scene.checks[id];
    }
    function jetCheck(sk, why, kind, extra) {
      var id = 'jet:' + kind + ':' + sk;
      defJet(id, why);
      scene.checks[id].why = why;
      s.jetCtx = Object.assign({ kind: kind, sk: sk, loc: s.loc, npc: s.talk }, extra || {});
      api.check(id);
    }
    // Psychologie : le Gardien la lance en secret, on ne sait jamais si l'impression est juste
    function jetPsy() {
      if (!s.talk) { api.say(fresh('jetPsyQui', jetText('psyQui', ['Jauger qui ? Adressez-vous d’abord à quelqu’un.']))); return; }
      var id = s.talk, k = 'jpsy:' + id, f = (scene.fiches || {})[id] || {};
      if (s.flags[k] && s.flags[k].d === dayOf()) { api.say(jetText('psyDeja', 'Vous l’avez déjà jaugé, et votre impression n’a pas bougé : ') + s.flags[k].x); return; }
      var target = skillValue('Psychologie'), r = 1 + Math.floor(rng() * 100), lv = levelOf(r, target);
      log({ t: 'sys', x: 'Le Gardien lance votre Psychologie en secret. Vous ne saurez pas si votre impression est juste.' });
      var x;
      if (lv >= 2) { x = typeof f.psy === 'function' ? f.psy(api) : f.psy; if (Array.isArray(x)) x = fresh('psy:' + id, x); }
      if (!x) x = fresh('psyFaux', (lv >= 2 ? null : f.psyFaux) || jetText('psyFaux', ['Rien de particulier : on vous paraît sincère, peut-être un peu las.', 'Une nervosité diffuse, mais qui ne l’est pas, ces jours-ci ?', 'Vous croyez deviner de l’hostilité. À moins que ce ne soit de la timidité.', 'Un visage fermé, impossible à lire. Ou alors, il n’y a rien à lire.']));
      if (Array.isArray(x)) x = fresh('psyx:' + id, x);
      api.say(x);
      if (lv === 0) { npcState(id).patience -= 1; api.say(jetText('psyVu', 'Votre regard insistant n’est pas passé inaperçu.')); }
      s.flags[k] = { d: dayOf(), x: x };
      s.tick = 2;
    }
    function jetSocial(sk) {
      if (!s.talk) { api.say(fresh('jetSocQui', jetText('socialQui', ['Sur qui ? Adressez-vous d’abord à quelqu’un.']))); return; }
      var k = 'jsoc:' + s.talk + ':' + sk;
      if (s.flags[k] === dayOf()) { api.say(fresh('jetSocDeja', jetText('socialDeja', ['Vous avez déjà tenté votre chance de cette façon aujourd’hui. Insister maintenant n’arrangerait rien.']))); return; }
      s.flags[k] = dayOf();
      var npc = scene.npcs[s.talk], whys = { 'Persuasion': 'le convaincre de se confier', 'Baratin': 'lui faire avaler votre histoire', 'Charme': 'gagner sa sympathie', 'Intimidation': 'lui faire assez peur pour qu’il parle', 'Crédit': 'qu’il vous traite en personne de qualité' };
      jetCheck(sk, whys[sk] + ' (' + npc.name + ')', 'social');
    }
    function jetLieu(sk) {
      var k = 'jlieu:' + s.loc + ':' + sk;
      if (s.flags[k] === dayOf()) {
        api.say(fresh('jetLieuDeja' + sk, sk === 'Écouter' ? jetText('ecouterDeja', ['Vous avez déjà tendu l’oreille ici aujourd’hui. Rien n’a changé.']) : jetText('tocDeja', ['Vous avez déjà fouillé ici aujourd’hui. Un nouveau jet n’y changerait rien.', 'Vous connaissez ce lieu par cœur, maintenant. Le fouiller encore ne vous apprendrait rien.'])));
        return;
      }
      s.flags[k] = dayOf();
      if (s.talk) api.endTalk(false);
      api.say(fresh('jetLieuGo' + sk, sk === 'Écouter' ? jetText('ecouterGo', ['Vous vous taisez et tendez l’oreille.', 'Vous fermez les yeux un instant, pour mieux entendre.']) : jetText('tocGo', ['Vous prenez le temps de tout regarder, lentement, méthodiquement.', 'Vous passez les lieux au peigne fin.'])));
      jetCheck(sk, sk === 'Écouter' ? 'saisir ce que les bruits d’ici ont à dire' : 'repérer ce qui aurait pu vous échapper', 'lieu');
    }
    function jetIdee() {
      var last = s.flags.jidee;
      if (last !== undefined && s.min - last < 180) { api.say(fresh('jetIdeeDeja', jetText('ideeDeja', ['Vous avez déjà retourné la question dans tous les sens il y a peu. Laissez-la mûrir.']))); return; }
      s.flags.jidee = s.min;
      jetCheck('INT', 'qu’une idée vous vienne', 'idee');
    }
    function jetResolve(kind, sk, r) {
      var ctx = s.jetCtx || {}, J = scene.jets || {};
      if (kind === 'lieu') {
        s.tick = sk === 'Écouter' ? 5 : 15;
        if (r.success) {
          var pl = (J.lieux && J.lieux[ctx.loc]) || {}, pool = pl[sk === 'Écouter' ? 'ecouter' : 'toc'];
          if (typeof pool === 'function') pool = pool(api);
          var used = s.flags['jl:' + ctx.loc + ':' + sk] || 0;
          if (pool && pool.length) { api.say(pool[used % pool.length]); s.flags['jl:' + ctx.loc + ':' + sk] = used + 1; }
          api.say(fresh('jetSur' + sk, sk === 'Écouter' ? jetText('ecouterSur', ['Rien d’autre : vous en êtes certain{e}.']) : jetText('tocSur', ['Vous en êtes certain{e} : rien d’autre ne se cache ici. Pas pour l’instant.', 'Rien ne vous a échappé. S’il y avait quelque chose à trouver ici, vous l’auriez trouvé.'])));
        } else if (r.pushed) {
          s.tick = 40;
          api.say(fresh('jetLieuForce', jetText('lieuForce', ['Vous retournez tout, à genoux, les mains sales. Rien. Et vous avez perdu la notion du temps.', 'Vous cherchez trop longtemps. Quand vous relevez la tête, on vous observe : vous ne savez pas depuis quand.'])));
          if (sanState() >= 1) api.say(fresh('jetLieuFou', jetText('lieuFou', ['Sous vos doigts, un instant, quelque chose de froid et d’humide. Puis plus rien. Avez-vous rêvé ?'])));
        } else {
          api.say(fresh('jetRate' + sk, sk === 'Écouter' ? jetText('ecouterRate', ['Le bruit de fond couvre tout. Vous n’entendez rien. Mais il y avait peut-être quelque chose.']) : jetText('tocRate', ['Rien. Mais avez-vous bien regardé ? Vous n’en êtes pas sûr{e}.', 'Vous ne trouvez rien. Ce qui ne veut pas dire qu’il n’y a rien.'])));
        }
        return;
      }
      if (kind === 'social') {
        var id = ctx.npc, npc = scene.npcs[id], f = (scene.fiches || {})[id] || {}, st = npcState(id);
        if (!npc || s.talk !== id) return;
        if (r.success) {
          if (sk === 'Intimidation') st.patience -= 1; else api.calm(id, 2);
          var said = s.flags['jconf:' + id] || 0, conf = f.confie;
          if (typeof conf === 'function') conf = conf(api);
          if (conf && !Array.isArray(conf)) conf = [conf];
          if (sk === 'Baratin') { var pm = s.flags['pm:' + id] || { n: {} }; pm.cru = true; s.flags['pm:' + id] = pm; }
          api.say(fresh('socOk' + sk, (J.social && J.social[sk] && J.social[sk].ok) || ['Le ton juste. En face de vous, quelque chose se relâche.']));
          if (conf && said < conf.length) { talkMode = 'raw'; logNpc(id, tokens(conf[said])); talkMode = null; s.flags['jconf:' + id] = said + 1; }
          else if (f.moi && f.moi.secret) { var sx = typeof f.moi.secret === 'function' ? f.moi.secret(api) : f.moi.secret; talkMode = 'raw'; logNpc(id, tokens(Array.isArray(sx) ? sx[0] : sx)); talkMode = null; }
        } else {
          st.patience -= r.pushed ? 9 : 2;
          api.say(fresh('socKo' + sk, (J.social && J.social[sk] && J.social[sk].ko) || ['Ça ne prend pas. On vous regarde autrement, maintenant.']));
          if (r.level === 0 || r.pushed || st.patience <= 0) closeTalk(npc);
        }
        return;
      }
      if (kind === 'idee') {
        if (r.success) {
          var hint = J.idee ? J.idee(api) : null;
          if (hint && hint.x) { api.say(jetText('ideeOk', 'Une idée vous vient. ') + hint.x); if (hint.chips) api.chips(hint.chips); }
          else { var ch = pistes(2); api.say(jetText('ideeLoc', 'Une idée vous vient : ici même, il reste des choses à tenter.')); if (ch.length) api.chips(ch); }
          var meilleure = pistes(1)[0]; if (meilleure) s.flags.eclair = { loc: s.loc, id: meilleure.action };
        } else if (r.pushed) { s.tick = 60; api.say(fresh('ideeForce', jetText('ideeForce', ['Une heure à ruminer, à tourner en rond dans votre tête. Rien. Juste une migraine.']))); }
        else api.say(fresh('ideeRate', jetText('ideeRate', ['Rien ne vient. Les pièces du puzzle refusent de s’assembler.', 'Vous tournez la question dans tous les sens, sans rien en tirer.'])));
      }
    }

    // ----- méta -----
    function handleMeta(p) {
      var m = p.metas[0];
      if (!m) return false;
      if (/\b(vos|votre|ses|son|sa|leurs?|ces|ce|un|une)\s+(notes|carnet|indices|bilan)\b|\b(notes|carnet)\s+(de|du|d)\s/.test(p.text)) return false;
      if (p.nouns.length > 1 || p.verbs.some(function (v) { return v.id !== 'EXAMINER' && v.id !== 'FOUILLER'; })) return false;
      if (m.id === 'AIDE') scene.help(api);
      else if (m.id === 'INVENTAIRE') {
        api.sys('Dans vos poches : ' + s.inv.join(', ') + (s.money ? ', ' + money(s.money) : '') + '.');
      } else if (m.id === 'FICHE') api.ui('sheet');
      else if (m.id === 'CARNET') api.ui('notes');
      return true;
    }

    // ----- fin de tour : horloge, relances, ambiance -----
    function afterTurn(afterRoll) {
      var tick = s.tick === undefined ? 1 : s.tick;
      s.min += tick; s.tick = 0;
      if (s.ended) return;
      if (!afterRoll) s.idle += 1;
      var fired = false;
      (scene.timeEvents || []).forEach(function (ev) {
        if (!s.flags['time:' + ev.id] && s.min >= ev.at && (!ev.cond || ev.cond(api))) {
          s.flags['time:' + ev.id] = true; ev.run(api); fired = true;
        }
      });
      if (afterRoll) return;
      if (scene.everyTurn && !s.pending && scene.everyTurn(api, fired)) fired = true;
      var st = sanState();
      if (!fired && !s.pending && st > 0 && scene.intrusions && rng() < [0, 0.22, 0.32, 0.45][st]) {
        var pool = scene.intrusions[st] || [];
        if (pool.length) { var k2 = api.count('intr' + st); log({ t: 'intrusion', x: pool[k2 % pool.length] }); fired = true; }
      }
      if (!fired && !s.talk && !s.pending) {
        var l = loc();
        (l.nudges || []).some(function (nd, i) {
          var key = s.loc + ':' + i;
          if (s.nudged[key]) return false;
          if (s.idle >= nd.at && (!nd.cond || nd.cond(api))) { s.nudged[key] = true; nd.run(api); fired = true; return true; }
          return false;
        });
      }
      if (!fired && !s.talk && !s.pending && s.turn % 4 === 0 && loc().ambient) {
        var amb = loc().ambient, k = s.ambient[s.loc] || 0;
        s.ambient[s.loc] = k + 1;
        api.event(amb[k % amb.length]);
      }
    }

    function fmtTime(min) {
      if (scene.clock) return scene.clock(min);
      var t = 23 * 60 + min, h = Math.floor(t / 60) % 24, m = t % 60;
      return (h < 10 ? '0' : '') + h + ' h ' + (m < 10 ? '0' : '') + m;
    }
    function noDoubles() {
      // Filet de sécurité : jamais deux fois la même phrase d'affilée
      var prev = null;
      for (var i = 0; i < s.log.length; i++) {
        var e = s.log[i];
        if (e.t !== 'narr' && e.t !== 'npc' && e.t !== 'event' && e.t !== 'intrusion') continue;
        if (prev && prev.x === e.x && !e.dd && (e.t !== 'npc' || prev.t !== 'npc' || prev.who === e.who)) {
          if (e.t === 'npc' && scene.npcs[e.who] && scene.npcs[e.who].repeat) e.x = tokens(fresh('dd:' + e.who, scene.npcs[e.who].repeat[0]));
          else if (scene.generic && scene.generic.dup) e.x = tokens(fresh('dup', scene.generic.dup));
          e.dd = true;
        }
        prev = e;
      }
    }
    function finish() {
      s.prefix = null;
      noDoubles();
      if (s.ended || s.pending) return;
      var last = s.log[s.log.length - 1];
      if (last && last.t === 'ask') return;
      api.ask();
    }

    // ----- entrées publiques -----
    // mode : 'dire' = ce que le personnage dit, mot pour mot (aucun geste n'en sort) ;
    //        'agir' ou rien = ce qu'il fait (« j'examine la table », « je lui demande où est Ravel »)
    function step(input, mode) {
      if (s.ended) return;
      var raw = String(input || '').trim();
      if (!raw) return;
      var dire = mode === 'dire';
      log(dire ? { t: 'player', x: raw, said: true } : { t: 'player', x: raw });
      var p = rewrite(lex, parse(lex, raw, scene.phrases));
      if (s.pending) {
        if (p.c.LANCER !== undefined || p.c.INSISTER !== undefined) { roll(); return; }
        api.sys('Les dés d’abord : touchez « Lancer les dés » ou écrivez « lancer ».');
        return;
      }
      if (s.pendingPush) {
        if (p.c.INSISTER !== undefined || p.c.LANCER !== undefined) { push(); return; }
        s.pendingPush = null;
      }
      s.turn++;
      if (dire) { s.tick = scene.talkTick || 1; parler(raw, p); afterTurn(); finish(); return; }
      if (handleMeta(p)) { s.turn--; finish(); return; }
      s.tick = scene.talkTick || 1;
      var ia = !s.talk && ideeTapee(raw);
      if (ia) { exec(ia, p); afterTurn(); finish(); return; }
      // « dire qu'on est de la police » : c'est une parole. On la dit à son interlocuteur, ou à la seule personne présente.
      var dit = discoursRapporte(raw);
      if (dit) {
        var pd = rewrite(lex, parse(lex, dit, scene.phrases));
        if (!s.talk) {
          var gens = availableActions().filter(function (a) { return a.talkTo && !(scene.disponible && scene.disponible(api, a.talkTo)); });
          if (gens.length === 1) exec(gens[0], rewrite(lex, parse(lex, '', scene.phrases)));
          else {
            api.say(gens.length ? fresh('aQuiDire', ['À qui le dites-vous ?', 'Vous le dites, oui. Mais à qui ?']) : fresh('direSeul', ['Vous le dites à voix haute. Personne n’est là pour l’entendre.', 'Les mots restent en l’air. Il n’y a personne pour les recevoir.']));
            if (gens.length) api.chips(gens.slice(0, 4).map(function (a) { return { label: a.label, action: a.id }; }));
            s.tick = 0; finish(); return;
          }
        }
        if (s.talk && !s.pending && !s.ended) handleDialogue(pd);
        afterTurn(); finish(); return;
      }
      // « je dors jusqu'à l'aube, puis je prends un taxi » : deux gestes, l'un après l'autre
      var sq = suites(raw), apres = false;
      if (sq.length < 2) apres = unGeste(raw, p);
      else for (var qi = 0; qi < sq.length; qi++) {
        if (s.pending || s.ended) break;
        // la conversation s'est arrêtée en route : une question qui suit reste sans réponse
        if (qi > 0 && !s.talk && /\?\s*$/.test(sq[qi])) break;
        if (unGeste(sq[qi], rewrite(lex, parse(lex, sq[qi], scene.phrases)))) apres = true;
        s.prefix = null;
      }
      if (apres) afterTurn();
      finish();
    }
    // une parole : à son interlocuteur ; sinon à la personne qu'on nomme, ou à la seule présente
    function parler(raw, p) {
      var texte = raw;
      if (!s.talk) {
        var gens = availableActions().filter(function (a) { return a.talkTo && !(scene.disponible && scene.disponible(api, a.talkTo)); });
        var dst = destinataire(p);
        var cible = dst ? gens.filter(function (a) { return a.talkTo === dst.id; })[0] : (gens.length === 1 ? gens[0] : null);
        if (!cible) {
          api.say(gens.length ? fresh('aQuiParler', ['À qui parlez-vous ?', 'Vous parlez, oui. Mais à qui ?', 'Plusieurs têtes se tournent. À qui vous adressez-vous ?']) : fresh('parlerSeul', ['Vous parlez dans le vide. Personne n’est là pour vous entendre.', 'Votre voix se perd. Il n’y a personne.', 'Personne ne répond. Vous êtes seul{e} à vous entendre.']));
          if (gens.length) api.chips(gens.slice(0, 4).map(function (a) { return { label: a.label, action: a.id }; }));
          s.tick = 0; return;
        }
        exec(cible, rewrite(lex, parse(lex, '', scene.phrases)));
        if (dst && dst.reste && dst.reste.split(/\s+/).length >= 2) texte = dst.reste;
        else if (dst) return; // on l'a seulement interpellé
      }
      var segs = phrasesDe(texte);
      for (var i = 0; i < segs.length; i++) {
        if (!s.talk || s.pending || s.ended) break;
        var ps = rewrite(lex, parse(lex, segs[i], scene.phrases));
        ps.dit = true;
        handleDialogue(ps);
        s.prefix = null;
      }
    }
    // un geste ou une réplique ; renvoie vrai si le temps du monde doit passer ensuite
    function unGeste(raw, p) {
      if (!s.talk) resoudre(p);
      // « je demande à Pratt si… » : la question va à Pratt, avant toute autre interprétation (le téléphone, un jet…)
      if (!s.talk && !s.pending) {
        var dst = destinataire(p);
        if (dst && pnjPresent(dst.id)) { handleWorld(p); return true; }
      }
      // l'improvisation passe avant les jets demandés (« je me cache » avec une caisse dans les bras…)
      if (!s.talk && !s.pending && scene.improvise && scene.improvise(api, p)) return false;
      var jr = jetRequest(raw);
      if (jr) {
        // « jet de psychologie sur Fleming » : on s'adresse d'abord à lui s'il est là
        var who = p.nouns.filter(function (n) { var c = lex.concepts[n.id]; return c && c.npc && n.score >= 0.9; })[0];
        if (who && !s.talk && (SOCIAL[jr.skill] || jr.skill === 'Psychologie')) { var ta = availableActions().filter(function (a) { return a.talkTo && (a.nouns || []).indexOf(who.id) >= 0; })[0]; if (ta) exec(ta, p); }
        if (!s.ended && !s.pending) doJet(jr, p);
        return true;
      }
      // le chapitre peut reprendre la main sur une improvisation (violence, pot-de-vin, effraction…)
      if (scene.intercept && scene.intercept(api, p, raw) === true) return true;
      if (s.talk) {
        var segs = phrasesDe(raw);
        if (segs.length < 2) handleDialogue(p);
        else for (var si = 0; si < segs.length; si++) {
          if (s.pending || s.ended) break;
          var psg = rewrite(lex, parse(lex, segs[si], scene.phrases));
          if (s.talk) handleDialogue(psg);
          // la conversation est finie : un geste qui suit se fait encore, une question reste sans réponse
          else if (!/\?\s*$/.test(segs[si]) && GESTE.test(psg.text)) { resoudre(psg); handleWorld(psg); }
          else break;
          s.prefix = null;
        }
      } else handleWorld(p);
      return true;
    }
    // « …, puis je… », « … et ensuite … » : une suite de gestes
    function suites(raw) {
      var parts = String(raw).split(/\s*[,;]\s*(?:et\s+)?(?:puis|ensuite|apr[eè]s quoi)\s+|\s+et\s+(?:puis|ensuite)\s+|\s+puis\s+(?=(?:je|j[’']|nous|on|vais|me|m[’']|retourne|rentre|prends|pars|sors|file|monte|descends|reviens|repars|aller|retourner|rentrer)\b)/i)
        .map(function (x) { return x.trim(); }).filter(Boolean);
      if (parts.length < 2 || parts.length > 4 || parts.some(function (x) { return x.split(/\s+/).length < 2; })) return [raw];
      return parts;
    }
    // « T’es con ou quoi ? Où est passé le barman ? » : deux phrases, deux réponses, dans l'ordre
    function phrasesDe(raw) {
      // « M. Ravel », « Dr. Smith » : le point d'une abréviation ne finit pas la phrase
      var prot = String(raw).replace(/\b(M|Mr|Mrs|Mme|Mlle|Dr|St|Ste|Pr|Me|cf|etc)\.(?=\s+\S)/g, '$1\u2024');
      var parts = (prot.match(/[^?!.;…]+[?!.;…]*/g) || [prot]).map(function (x) { return x.trim().replace(/\u2024/g, '.'); }).filter(Boolean);
      // un mot seul (« Euh… », « Bon. ») s'accroche à la phrase suivante ; « Connard ! » ou « Pardon ? » se suffisent
      var out = [], buf = '';
      var FILLER = /^(euh|heu|hum|hm|bon|bien|alors|ah|oh|eh|ben|bref|enfin|voila|voilà|ok|tiens|dites|écoutez|ecoutez|attendez|voyons|allons|bref|donc|et)[.…,;!]*$/i;
      parts.forEach(function (x) { buf = buf ? buf + ' ' + x : x; if (buf.split(/\s+/).length >= 2 || !FILLER.test(buf)) { out.push(buf); buf = ''; } });
      if (buf) { if (out.length) out[out.length - 1] += ' ' + buf; else out.push(buf); }
      if (out.length > 4) return [raw];
      var out2 = [];
      out.forEach(function (x) { suites(x).forEach(function (y) { out2.push(y); }); });
      return out2.length > 4 ? out : out2;
    }
    // le Gardien reformule le choix du joueur (mj.js), plutôt que d'afficher le mot-clé
    function mjModule() { if (!(G.RPG && G.RPG.MJ) && typeof require === 'function') { try { require('./mj.js'); } catch (e) {} } return G.RPG && G.RPG.MJ; }
    function mjPick(k, arr) { return fresh(k, arr); }
    function choose(chip) {
      if (s.ended) return;
      paroleJoueur = null;
      var MJ = mjModule();
      if (chip.reflechir) {
        if (s.pending) return;
        log({ t: 'player', x: chip.label || 'Réfléchir' }); s.turn++; s.tick = 1;
        jetIdee(); afterTurn(); finish(); return;
      }
      // une banalité : la phrase du joueur, puis la réponse de la culture du temps, sans détour par les sujets
      if (chip.cult && s.talk) {
        var cn = scene.npcs[s.talk];
        log({ t: 'player', x: chip.say || chip.label, said: true }); s.turn++; s.tick = scene.talkTick || 1;
        var fait = false; try { fait = !!(scene.converse && scene.converse.causer && scene.converse.causer(api, cn, chip.cult)); } catch (err) { fait = false; }
        if (!fait) { s.turn--; s.log.pop(); step(chip.say || chip.label, 'dire'); return; }
        afterTurn(); finish(); return;
      }
      if (chip.mal && s.talk) {
        var mn = scene.npcs[s.talk], ml = scene.paroles && scene.paroles(api, mn), mx = ml && (ml.maladresse || []).concat(ml.banal || []).filter(function (m) { return m.mal === chip.mal; })[0];
        if (!mx || !mx.run) return;
        log({ t: 'player', x: mx.dit || chip.label, said: !!mx.dit }); s.turn++; s.tick = scene.talkTick || 1;
        talkMode = 'raw'; try { mx.run(api, mn); } finally { talkMode = null; }
        afterTurn(); finish(); return;
      }
      if (chip.act && scene.chipAct) {
        if (s.pending) return;
        log({ t: 'player', x: chip.label }); s.turn++; s.tick = 1;
        if (scene.chipAct(api, chip)) { afterTurn(); finish(); }
        return;
      }
      if (chip.action) {
        var a = findAction(chip.action);
        if (!a || (a.cond && !a.cond(api))) return;
        var refo = null; try { refo = MJ && MJ.action(chip.label, mjPick); } catch (e) { refo = null; }
        log({ t: 'player', x: refo || chip.label, mj: !!refo, chip: chip.label });
        s.turn++;
        if (s.talk) api.endTalk(false);
        exec(a, parse(lex, chip.label, scene.phrases));
        afterTurn();
        finish();
      } else if (chip.topic && s.talk) {
        var who = scene.npcs[s.talk] || {}, rt = null;
        try { rt = MJ && MJ.topic(chip.label, mjPick, who.short || who.name); } catch (e) { rt = null; }
        if (rt) log({ t: 'player', x: rt.x, said: !!rt.said, mj: !rt.said, chip: chip.label });
        else log({ t: 'player', x: chip.label, said: true });
        s.turn++;
        runTopic(scene.npcs[s.talk], chip.topic, parse(lex, chip.label, scene.phrases));
        afterTurn();
        finish();
      }
    }
    function roll() {
      var pd = s.pending; if (!pd) return null;
      var chk = scene.checks[pd.id] || defJet(pd.id);
      // une partie rechargée dont le jet n'existe plus : on le retire, plutôt que de laisser le bouton sans effet
      if (!chk) { s.pending = null; log({ t: 'sys', x: 'Ce jet n’existe plus dans cette version du jeu : on passe.' }); finish(); return null; }
      var target = skillValue(chk.skill);
      var r = 1 + Math.floor(rng() * 100);
      // dé bonus ou de malus : on lance une seconde dizaine et l'on garde la meilleure (ou la pire)
      if (pd.bonus || pd.malus) {
        var u = r % 10, t1 = Math.floor(r / 10) % 10, t2 = Math.floor(rng() * 10);
        var v1 = t1 * 10 + u || 100, v2 = t2 * 10 + u || 100;
        r = pd.bonus ? Math.min(v1, v2) : Math.max(v1, v2);
      }
      var level = levelOf(r, target);
      var success = level >= NEED[pd.diff || 'normal'];
      s.pending = null;
      var CL2 = { INT: 'Idée (INT)', POU: 'Volonté (POU)', DEX: 'Dextérité', FOR: 'Force', CON: 'Constitution', EDU: 'Connaissance (ÉDU)', CHANCE: 'Chance', APP: 'Apparence' };
      var entry = log({ t: 'roll', skill: chk.label || CL2[chk.skill] || chk.skill, target: target, diff: pd.diff, r: r, tens: r === 100 ? 0 : Math.floor(r / 10) * 10, units: r % 10, level: level, levelName: LEVELS[level], success: success, pushed: pd.pushed });
      var res = { success: success, level: level, pushed: pd.pushed, r: r };
      if (chk.skill === 'SAN') {
        var loss = rollExpr(success ? chk.loss[0] : chk.loss[1], rng, level === 0);
        if (loss > 0) api.lose(loss);
        else log({ t: 'san', d: 0, v: s.pc.san });
        res.loss = loss;
      }
      s.tick = 0;
      chk.resolve(api, res);
      if (!success && chk.push && !pd.pushed && level > 0 && !s.ended) {
        s.pendingPush = { id: pd.id, diff: pd.diff };
        log({ t: 'push', x: chk.push });
      }
      afterTurn(true);
      finish();
      return entry;
    }
    function push() {
      var pp = s.pendingPush; if (!pp) return;
      s.pendingPush = null;
      log({ t: 'sys', x: 'Vous insistez. Un jet forcé ne pardonne pas : en cas d’échec, les conséquences seront pires.' });
      api.check(pp.id, { diff: pp.diff, pushed: true });
    }
    function declinePush() {
      if (!s.pendingPush) return;
      s.pendingPush = null;
      log({ t: 'sys', x: 'Vous laissez tomber.' });
      finish();
    }

    if (!saved) {
      scene.intro(api);
      s.visited[s.loc] = 1;
      finish();
    }

    return {
      get state() { return s; },
      lex: lex,
      parse: function (raw) { return rewrite(lex, parse(lex, raw, scene.phrases)); },
      rank: function (raw) { return rankActions(rewrite(lex, parse(lex, raw, scene.phrases))); },
      step: step, choose: choose, roll: roll, push: push, declinePush: declinePush,
      ideas: ideas,
      pistes: pistes,
      suggestionsParole: function (n, mode) { return s.talk ? suggestionsParole(n, mode) : []; },
      reflexionPossible: function () { return !s.talk && !s.pending && !(s.flags.jidee !== undefined && s.min - s.flags.jidee < 180); },
      clock: function () { return fmtTime(s.min); },
      where: function () { return scene.where ? scene.where(s.min) : ''; },
      topicChips: function () { return s.talk ? topicChips(scene.npcs[s.talk]) : []; },
      skillValue: skillValue,
      levels: LEVELS,
      sanState: sanState,
      api: api
    };
  }

  G.RPG = { createGame: createGame, recit: recit, normalize: normalize, stem: stem, phon: phon, osa: osa, rollExpr: rollExpr, levelOf: levelOf };
})(typeof window !== 'undefined' ? window : globalThis);
