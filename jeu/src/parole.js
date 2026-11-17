/* La parole : un moteur de conversation sans IA, qui en donne l'illusion.
   Il comprend le type de question, les sujets nommés, les mots qu'il ne connaît pas ;
   il se souvient de ce qu'on lui a dit, renvoie la balle, digresse, s'agace,
   et compose ses réponses à partir de la fiche du personnage et de la culture de 1923. */
(function (G) {
  'use strict';
  if (!(G.RPG && G.RPG.Humeur) && typeof require === 'function') { try { require('./humeur.js'); } catch (e) {} }
  function N(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, ' ').replace(/-/g, ' ').replace(/[^a-z0-9?! ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  var STOP = {}; ('a au aux avec ce ces cet cette dans de des du elle en et eux il ils je la le les leur lui ma me mes moi mon ne ni nos notre nous on ou par pas pour qu que qui sa se ses si son sur ta te tes toi ton tu un une vos votre vous y est sont etes suis es ai as avez avons ont etait etre avoir fait faire dit dire bien tres plus moins tout tous toute toutes alors donc mais car comme quoi quel quelle quels quelles dont ici la-bas cela ca ceci celui celle ceux sont sera serait peut peux pouvez veux voulez sais savez connais connaissez pense pensez crois croyez trouve trouvez aime aimez monsieur madame mademoiselle docteur oui non merci bonjour bonsoir hein bon ben euh voila vraiment jamais toujours encore deja rien quelque chose chose quand comment pourquoi combien depuis parlez parler dites racontez').split(' ').forEach(function (w) { STOP[w] = 1; });
  var COMMON = {}; ('monsieur madame temps chose choses jour jours annee annees homme hommes femme femmes gens monde fois heure heures nuit soir matin grand grande grands petit petite beaucoup assez aussi autre autres meme faut avait avaient etaient sont avez etes vous nous leur leurs dans pour avec sans sous chez entre depuis apres avant encore juste vrai vraie tout tous bien tres plus moins quelque quelques chaque votre notre cette celle celui ceux alors donc mais comme parce quand comment pourquoi combien quel quelle quels quelles savoir connais connaissez pense pensez croyez aimez aime faire dire voir venir aller prendre parler question questions reponse vraiment peut etre deja toujours jamais rien personne quelqu quelquun chose ceci cela voila voici pardon merci bonjour bonsoir salut avoir etre fait faites dites disent savez sais crois pensez trouvez trouve aimeriez voulez veux pouvez peux connu connue mieux moins trop tant').split(' ').forEach(function (w) { COMMON[w] = 1; });
  function pick(api, key, arr) { return api.fresh(key, arr); }
  function isLow(w) { return LOW.test(w) || /^(J|L|C|D|Qu|S|N|M)[’']/.test(w); }
  function lowFirst(s) { var w = (s.match(/^([A-Za-zÀ-ÿ’']+)/) || [])[1]; return w && isLow(w) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function de(label) {
    var l = String(label || '');
    if (/^le /.test(l)) return 'du ' + l.slice(3);
    if (/^les /.test(l)) return 'des ' + l.slice(4);
    if (/^(la |l’|l')/.test(l)) return 'de ' + l;
    if (/^[aeiouhéèêàâîôûAEIOUHÉ]/.test(l)) return 'd’' + l;
    return 'de ' + l;
  }

  // ---------------------------------------------------------------- l'analyse d'une phrase
  var RX = {
    qui: /\bqui\b/, ou: /\b(d ou|par ou|ou (est|sont|etes|es|habitez|habite|vivez|vit|allez|va|se trouve|trouver|travaillez|etiez|etait|aller|irait))\b|^ou\b|\bou ca\b/,
    quand: /\b(quand|depuis quand|a quelle heure|quel jour|quelle heure|quelle date|combien de temps)\b/, pourquoi: /\b(pourquoi|pour quelle raison|comment se fait il)\b/,
    comment: /\bcomment\b/, combien: /\bcombien\b/, quoi: /\b(quoi|qu est ce|que (faites|savez|voulez|pensez|cherchez|voyez|dites|cachez)|quel|quelle|quels|quelles)\b/,
    avis: /\b(pensez|penses|avis|opinion|croyez|crois|trouvez|aimez|aimes|detestez|preferez|que dites vous de)\b/,
    demande: /\b(pouvez vous|pourriez vous|voulez vous|voudriez vous|aidez|aidez moi|donnez moi|montrez moi|dites moi|racontez moi|expliquez|accompagnez|emmenez)\b/,
    insulte: /\b(idiot|imbecile|con|conne|connard|crétin|cretin|abruti|menteur|menteuse|salaud|salope|ordure|minable|vieux fou|vieille folle|incapable|nul|nulle|stupide|bete|ta gueule|ferme la|degage|crapule|vermine|pourriture|batard)\b/,
    compliment: /\b(merci|bravo|charmant|charmante|gentil|gentille|aimable|belle|beau|elegant|elegante|intelligent|intelligente|admirable|remarquable|formidable|genial|courageux|courageuse|adorable|magnifique|superbe|splendide|ravissant|ravissante|epatant|epatante|distingue|distinguee)\b|\bj (adore|admire) (vos|votre|ton|ta|tes)\b|\bj aime (beaucoup |bien )?(vos|votre|ton|ta|tes)\b|\b(quelles?|quels?) (belles?|beaux?|jolie?s?|magnifiques?|superbes?)\b/,
    ana: /\b(portable|smartphone|internet|ordinateur|ordi|television|tele|teleportation|avion a reaction|fusee|nucleaire|atomique|bombe atomique|covid|facebook|google|wifi|jeu video|jeux video|playstation|euros?|selfie|hitler|nazis?|seconde guerre|deuxieme guerre|frigo|micro ondes|antibiotique|penicilline|television|ovni|extraterrestre|tiktok|instagram|youtube|netflix|mail|email|e mail|sms|robotique)\b/,
    meta: /\b(ia|intelligence artificielle|chatgpt|chat gpt|claude|robot|bot|programme informatique|un programme|une machine|vous etes reel|tu es reel|etes vous reel|vous existez|tu existes|joueur|jeu video|un jeu|personnage)\b/,
    oui: /^(oui|ouais|bien sur|bien entendu|evidemment|naturellement|certes|absolument|exactement|tout a fait|en effet|affirmatif|volontiers|avec plaisir|ok|d accord|peut etre|sans doute|probablement|je crois que oui|c est vrai|c est exact|helas oui)\b/,
    ouiCourt: /^(si|un peu|assez|plutot|je crois|je pense|je le crois|je le pense|il me semble|quelques jours|quelque temps|pourquoi pas)\b/,
    non: /^(non|jamais|pas du tout|nullement|aucunement|certainement pas|pas vraiment|pas encore|pas le moins du monde|bof|nan|helas non|malheureusement|je ne crois pas|je ne pense pas|je crains que non|je ne sais pas|aucune idee|surement pas)\b/,
    jesuis: /\bje suis (un |une |le |la |l )?([a-z]{3,})\b/, jemappelle: /\bje m appelle ([a-z]{2,})\b|\bmon nom est ([a-z]{2,})\b/,
    quisuisje: /\bqui (suis je|je suis)\b|\bmon nom\b|\bvous savez qui je suis\b/,
    salut: /^(bonjour|bonsoir|salut|hello|coucou|bien le bonjour|good (morning|evening)|rebonjour|re bonjour)\b/
  };
  // les identités qu'on peut revendiquer, et ce qu'elles valent auprès des gens
  var CLAIMX = [
    [/\b(je suis|je travaille|je viens) (de|pour|a|au) (la police|scotland yard|yard|la surete|la brigade)\b|\bje suis du yard\b|\bje suis de la maison\b/, 'policier'],
    [/\b(je travaille|j ecris) (pour|dans) (le|un|une|la) (journal|gazette|times|courier|daily)\b|\bje suis de la presse\b/, 'journaliste'],
    [/\bje suis (le|la) (neveu|niece|cousin|cousine|fils|fille|frere|soeur) (du professeur|de smith|du defunt|de monsieur)\b/, 'neveu']
  ];
  var ROLES = [['police', /^(polic|inspect|agent|detecti|flic|constab|sergen|commiss|yard)/], ['presse', /^(journal|report|redact|pigist|chroniq)/], ['medecin', /^(medec|docteu|chirur|infirm|pratic)/],
    ['avocat', /^(avoca|notai|juge|magist)/], ['clerge', /^(pretr|pasteu|abbe|vicai|revere|moine|religi)/], ['famille', /^(neveu|niece|cousi|fils|fille|frere|soeur|herit)/],
    ['assureur', /^(assur|exper)/], ['antiquaire', /^(antiq|collec|marcha)/], ['savant', /^(profe|savan|cherch|univer|archeo|histor|egypt)/],
    ['militaire', /^(offic|capit|colon|major|soldat|milit|lieut)/], ['diplomate', /^(diplom|consul|ambass|attach)/]];
  function roleOf(w) { w = N(w || ''); for (var i = 0; i < ROLES.length; i++) if (ROLES[i][1].test(w)) return ROLES[i][0]; return null; }
  // les questions personnelles : à qui parle-t-on ?
  var PERSO = [
    ['nom', /\b(comment vous appelez|votre nom|qui etes vous|vous etes qui|vous vous appelez|comment tu t appelles|tu t appelles|ton nom|qui es tu|t es qui|tu es qui)\b/],
    ['age', /\b(quel age|votre age|ton age|vous avez quel age|t as quel age|(vous etes|t es|tu es) (bien |tres |trop |si )?(vieux|vieille|jeune)|vous etes ne en|vous etes nee en|ne en|nee en)\b/],
    ['origine', /\b(vous etes de [a-z]+|vous venez de [a-z]+|vous etes ne a|vous etes nee a|vous etes anglaise|vous etes francaise|d ou venez|d ou viens|tu viens d ou|t es d ou|tu es d ou|d ou etes|ou etes vous ne|vous etes d ou|ton pays|ton accent|votre pays|vous etes anglais|vous etes francais|vous etes italien|vous etes turc|votre accent|ou avez vous grandi)\b/],
    ['domicile', /\b(ou habitez|ou vivez|ou logez|votre maison|chez vous|ou dormez|ou habites|tu habites|ou vis tu|tu vis ou|ta maison|chez toi)\b/],
    ['famille', /\b(marie|mariee|epouse|votre femme|votre mari|enfants?|famille|fiance|fiancee|veuf|veuve|celibataire|parents|freres?|soeurs?|amoureux|amoureuse)\b/],
    ['metier', /\b(votre metier|votre travail|votre profession|ton metier|ton travail|que fais tu|tu fais quoi|tu travailles|que faites vous dans la vie|vous faites quoi|vous travaillez|depuis combien de temps vous|votre patron|votre poste)\b/],
    ['loisirs', /\b(loisirs?|passe temps|aimez faire|temps libre|dimanche|week end|hobby|passion)\b/],
    ['peur', /\b(peur|effraye|effrayee|crainte|craignez|angoisse|terrifie|terrifiee)\b/],
    ['croit', /\b(croyez aux|croyez vous aux|croyez en|croyant|musulman|musulmane|chretien|chretienne|catholique|protestant|protestante|juif|juive|anglican|anglicane|methodiste|athee|pratiquant|pratiquante|fantomes?|revenants?|esprits|surnaturel|au dela|dieu|religion|eglise|priez|croyant|croyante|diable|enfer|paradis)\b/],
    ['humeur', /\b(comment allez|ca va|vous allez bien|comment vas tu|tu vas bien|tu te sens|comment vous sentez|comment ca va|vous etes triste|vous etes fatigue|heureux|heureuse|malheureux)\b/],
    ['argent', /\b(combien gagnez|riche|salaire|paye|fortune|argent)\b/],
    ['guerre', /\b(la guerre|front|tranchees|soldat|somme|verdun|ypres|mobilise|blesse a la guerre)\b/],
    ['boire', /\b(boire|un verre|whisky|biere|gin|vin|alcool|cognac|the|cafe)\b/],
    ['secret', /\b(cachez|secret|mentez|mentir|vous me mentez|la verite|honnete)\b/],
    ['joueur', /\b(que pensez vous de moi|vous m aimez|vous me trouvez|je vous plais|vous me croyez|vous avez confiance)\b/],
    ['envie', /\b(que voulez vous|vous voulez quoi|que veux tu|tu veux quoi|votre reve|vous revez|souhaitez|desirez)\b/],
    ['sante', /\b(malade|sante|toussez|blessure|vous saignez|medecin)\b/]
  ];
  // retrouve un mot tel que le joueur l'a écrit (« iPhone », « jeux vidéo »), à partir de sa forme normalisée
  function span(raw, m) {
    var toks = String(raw).split(/[\s’'?!.,;:«»"()]+/).filter(Boolean), k = m.split(' ').length;
    for (var i = 0; i < toks.length; i++) for (var j = i; j < Math.min(toks.length, i + k + 1); j++) { var w = toks.slice(i, j + 1).join(' '); if (N(w) === m) return w; }
    return null;
  }
  function analyse(api, npc, p, mem, f, scene) {
    f = f || {}; scene = scene || {};
    var raw = p.raw || '', t = ' ' + N(raw) + ' ', tt = t.trim();
    var a = { raw: raw, t: t, words: tt.split(' ').length, q: /\?\s*$/.test(raw) || /^(est ce|qu |qui |quoi|ou |quand|pourquoi|comment|combien|quel|quelle|avez vous|etes vous|connaissez|savez|croyez|pensez|aimez|vous |tu )/.test(tt) };
    var toks = (G.RPG && G.RPG.normalize ? G.RPG.normalize(raw) : N(raw)).split(' ');
    // un nom reconnu à coup sûr : exact, ou approché sur un mot assez long pour que ce ne soit pas un hasard
    var soi = f.soi || [String(npc.id).toUpperCase()];
    var known = function (id) { return (f.sait && f.sait[id]) || (f.avis && f.avis[id]) || (scene.rumeurs && scene.rumeurs[id]); };
    var sure = p.nouns.filter(function (n) { var w = toks[n.pos] || ''; return (n.type === 'n' || known(n.id)) && (n.score >= 0.95 || (n.score >= 0.8 && w.length >= 5)); });
    a.soi = sure.some(function (n) { return soi.indexOf(n.id) >= 0; });
    a.ents = sure.filter(function (n) { return soi.indexOf(n.id) < 0; }).map(function (n) { return n.id; });
    var unkN = (p.unknown || []).map(N);
    a.content = tt.split(' ').filter(function (w) { return (w.length >= 5 || (w.length === 4 && unkN.indexOf(w) >= 0)) && !STOP[w] && !COMMON[w] && !/^(fais|fait|faites|vais|allez|suis|sommes|peux|peut|dois|doit|devez|veux|vois|voyez|sais|savez|crois|prends|prenez|mets|donne|donnez|cherche|cherchez|regarde|regardez|parle|parlez|demande|demandez|tente|essaie|essaye|lance|lancer|utilise|utiliser)$/.test(w) && !/^(jet|jets|test|competence)$/.test(w); });
    var vous = /\b(vous|votre|vos|toi|tu|ton|ta|tes|vous meme)\b/.test(t), je = /\b(je|j|moi|mon|ma|mes|m)\b/.test(t);
    a.vous = vous;
    a.tu = !/\bvous\b/.test(t) && /\b(tu|toi|ton|ta|tes|t es|t as|te|t appelles|t en)\b/.test(t);
    if (a.tu) vous = true;
    a.perso = null;
    if (vous || /^(quel age|comment vous|d ou)/.test(tt)) PERSO.some(function (pp) { if (pp[1].test(t)) { a.perso = pp[0]; return true; } return false; });
    // pronoms : « et lui ? », « elle était comment ? »
    var cultHit = CULT.some(function (c) { return c.re.test(t); });
    var tp = t.replace(/\b(il fait|fait il|il y a|y a t il|il faut|faut il|il est (\d+|tard|tot|l heure|temps)|quelle heure est il|il pleut|pleut il|il neige|s il vous plait|s il te plait|il parait|parait il|il me semble|il semble|il se peut|il reste|reste t il|il vaut mieux)\b/g, ' ');
    if (!a.ents.length && !a.perso && !cultHit && mem.last && (/\b(il|elle|lui|ils|elles|eux)\b/.test(tp) || /\b(vous|tu|je|j|on|nous) (le|la|les|l) /.test(tp) || /^et (lui|elle|eux|elles)\b/.test(tt))) { a.ents = [mem.last]; a.pron = true; }
    // mots inconnus, à faire répéter
    var orig = raw.split(/[\s’'?!.,;:«»"()]+/).filter(Boolean);
    var MOTS = G.RPG_MOTS || {};
    a.unk = (p.unknown || []).filter(function (w) { return w.length >= 4 && !STOP[w] && !/^\d+$/.test(w) && !MOTS[w]; }).map(function (w) { var o = orig.filter(function (x) { return N(x) === w; })[0]; return o || w; });
    var types = ['pourquoi', 'quand', 'combien', 'comment', 'ou', 'qui', 'avis', 'quoi', 'demande'];
    a.type = null; for (var i = 0; i < types.length; i++) if (RX[types[i]].test(t)) { a.type = types[i]; break; }
    if (!a.type && a.q) a.type = 'ouinon';
    if (!a.type) a.type = 'affirmation';
    var HU = G.RPG && G.RPG.Humeur;
    a.insulte = HU ? HU.RX.insulte.test(t) && (vous || !a.ents.length) : RX.insulte.test(t);
    a.compliment = RX.compliment.test(t) && !a.insulte && (vous || a.words <= 3 || /\b(merci|bravo|felicitations|allure)\b/.test(t) || /\ballure\b/.test(p.text || '')); // « belle soirée » n'est pas un compliment qu'on lui fait
    if (!a.insulte && (/\bbelle allure\b/.test(p.text || '') || (/\bvotre allure\b/.test(p.text || '') && /\b(adore|aime|admire|magnifique|superbe|jolie?s?|beaux?|belles?|vous va|vous vont|elegant|elegante|chic)\b/.test(t)))) a.compliment = true; a.ana = (t.match(RX.ana) || [])[1] || null; a.meta = RX.meta.test(t) && (vous || a.q);
    if (HU) {
      // l'humeur : jurons, menaces, excuses, absurdités, mots d'un autre siècle
      a.juron = !a.insulte && HU.RX.juron.test(t);
      a.menace = HU.RX.menace.test(t);
      // dit tout haut (« Dire »), « je vous étrangle » est une menace, pas un geste
      if (p.dit && /\b(je|j) (vous|te|t) (tue|etrangle|frappe|cogne|egorge|assomme|poignarde|gifle|casse|descends|bute|creve)\w*\b/.test(t)) a.menace = true;
      a.excuse = HU.RX.excuse.test(t);
      a.absurde = HU.RX.absurde.test(t);
      var am = t.match(HU.ANA), fm = am ? null : t.match(HU.FUTUR);
      if (am || fm) { var mw = (am || fm)[0].trim().replace(/^(un|mon|ton|votre|son|des|vos|mes|le|par|ses) /, ''); a.anaW = HU.CANON[mw] || span(raw, mw) || mw; a.futur = !am; }
    }
    a.oui = RX.oui.test(tt) || (a.words <= 4 && RX.ouiCourt.test(tt)); a.non = RX.non.test(tt);
    var cx = null; CLAIMX.some(function (c) { if (c[0].test(t)) { cx = c[1]; return true; } return false; });
    var m = t.match(RX.jesuis); a.claim = cx || (m && !/^(desole|navre|perdu|fatigue|fatiguee|sur|sure|pret|prete|venu|venue|ici|la|en|de|pas|tres|bien|malade|curieux|curieuse|seul|seule|ami|amie|presse|pressee|inquiet|inquiete|content|contente|au|pour|avec|du|des|une|un|le|desolee|navree|occupe|occupee|perdue|ravi|ravie|enchante|enchantee)$/.test(m[2]) ? m[2] : null);
    if (a.claim && HU && HU.RX.claimAbsurde.test(N(a.claim))) { a.absurde = true; a.claim = null; }
    // le mot tel qu'il a été tapé, avec ses accents (« Médecin ? Je vois. », pas « Medecin »)
    if (a.claim && !cx) { var origC = String(raw || '').split(/[\s’'?!.,;:«»"()]+/).filter(function (x) { return N(x) === a.claim; })[0]; if (origC) a.claim = origC.toLowerCase(); }
    // « je suis chargé d’enquêter », « je suis venu pour… », « je suis passé chez… » : un participe, pas un métier
    if (a.claim && !cx && m && /(e|es|ee|ees|i|is|u|us)$/.test(m[2]) && new RegExp('\\bje suis (?:un |une |le |la |l )?' + m[2] + ' (de|d|a|pour|par|chez|dans|en|sur|avec|ici|la|hier|ce)\\b').test(t)) a.claim = null;
    m = t.match(RX.jemappelle); a.nom = m ? cap(m[1] || m[2]) : null;
    a.quisuisje = RX.quisuisje.test(t);
    a.suite = a.words <= 5 && /^(et )?(pourquoi|comment ca|comment cela|c est a dire|racontez|racontez moi|expliquez|expliquez vous|et alors|et puis|et ensuite|ensuite|vraiment|ah bon|precisez|dites m en plus|dites moi en plus|en quoi|continuez|c est tout|quoi d autre|et apres)\b/.test(tt) && !a.ents.length;
    a.salut = RX.salut.test(tt) && a.words - (a.soi ? 1 : 0) <= 4 && !a.perso && !a.ents.length;
    return a;
  }

  // ---------------------------------------------------------------- les voix
  // chaque registre a sa manière de ne pas savoir, de s'étonner, de refuser
  var V = {
    formel: {
      ignore: ['« {X} ? Je crains de ne rien savoir à ce sujet, {m}. »', '« {X}… Non. Le nom ne me dit rien, je suis navré. »', '« Je n’ai pas l’honneur de connaître {x}, {m}. »'],
      mot: ['« “{W}” ? Je ne vois pas bien où vous voulez en venir, {m}. »', '« “{W}”… Je ne suis pas certain de saisir le sens de votre question. »', '« Pourquoi me parlez-vous de “{W}”, {m} ? »'],
      pourquoi: ['« Pourquoi ? Il ne m’appartient pas d’en juger, {m}. »', '« Les raisons des choses, {m}, sont rarement à ma portée. »'],
      comment: ['« Comment ? Je ne saurais vous le dire avec précision, {m}. »', '« De la manière habituelle, j’imagine. »'],
      quand: ['« Je ne saurais vous donner de date, {m}. »', '« Il y a quelque temps. Ma mémoire n’est pas un registre. »'],
      ou: ['« Je l’ignore, {m}. Peut-être pourriez-vous vous adresser ailleurs. »', '« Je ne suis pas en mesure de vous l’indiquer. »'],
      combien: ['« Je ne tiens pas ce genre de compte, {m}. »', '« Un certain nombre. Je ne saurais être plus précis. »'],
      quoi: ['« Je ne vois pas ce que je pourrais vous en dire, {m}. »', '« Voilà une question à laquelle je n’ai pas de réponse convenable. »'],
      qui: ['« Je ne saurais vous dire qui, {m}. »', '« Personne que je connaisse. »'],
      ouinon: ['« Je ne crois pas, {m}. »', '« Il est possible que oui. Il est possible que non. »', '« Certainement, {m}. Enfin… je le suppose. »'],
      avis: ['« Mon opinion importe peu, {m}. »', '« Je n’ai pas d’avis tranché sur la question. »'],
      demande: ['« Je ferai ce que je pourrai, {m}, dans les limites de ma fonction. »', '« Ce n’est guère de mon ressort, je le crains. »'],
      affirmation: ['« Vraiment ? »', '« Je prends note, {m}. »', '« Si vous le dites. »'],
      insulte: ['« Je vous demanderai de surveiller votre langage, {m}. »', 'Un silence glacé. « Je n’ai rien entendu. »'],
      compliment: ['« Vous êtes trop aimable, {m}. »', '« C’est très obligeant de votre part. »'],
      ana: ['« Un… “{A}” ? Je crains de ne pas connaître cette invention, {m}. »', '« “{A}” ? Est-ce américain ? »'],
      meta: ['« Une machine, moi ? » Il a un sourire pincé. « On me l’a déjà dit, mais jamais aussi franchement. »', '« Vous avez vu cette pièce tchèque, avec des hommes artificiels ? Je vous assure que je suis fait de chair, {m}. »'],
      deja: ['« Je vous l’ai dit tout à l’heure, {m} : ', '« Comme je vous le disais : ']
    },
    sec: {
      ignore: ['« {X} ? Connais pas. »', '« Jamais entendu parler. »', '« {X}. Non. Suivant. »'],
      mot: ['« “{W}” ? Et alors ? »', '« “{W}”. Je ne vois pas le rapport. »', '« Je ne comprends pas la question. Reformulez. »'],
      pourquoi: ['« Pourquoi. Toujours pourquoi. Je n’en sais rien. »', '« Si je le savais, l’affaire serait close. »'],
      comment: ['« Mal, en général. »', '« Je n’ai pas le détail. »'],
      quand: ['« Pas de date. »', '« Récemment. Ne me demandez pas plus. »'],
      ou: ['« Aucune idée. »', '« Pas ici, en tout cas. »'],
      combien: ['« Trop. »', '« Je n’ai pas compté. »'],
      quoi: ['« Rien que je puisse vous dire. »', '« Question suivante. »'],
      qui: ['« Personne. »', '« Si je le savais. »'],
      ouinon: ['« Non. »', '« Oui. »', '« Peut-être. Je n’ai pas que ça à faire. »'],
      avis: ['« Je n’ai pas d’avis. J’ai des faits, ou je n’ai rien. »', '« Mon avis ne vous servira à rien. »'],
      demande: ['« Non. »', '« Ce n’est pas mon travail. »'],
      affirmation: ['« Hm. »', '« Possible. »', '« Si vous le dites. »'],
      insulte: ['« Encore un mot comme ça et vous dormez au poste. »', 'Un regard qui vous jauge, puis vous classe.'],
      compliment: ['« Ça ne vous avancera à rien. »', '« Gardez vos politesses. »'],
      ana: ['« “{A}”. Encore un mot américain ? »', '« Je ne sais pas ce qu’est un “{A}”, et je n’ai pas envie de le savoir. »'],
      meta: ['« Une machine ? Si seulement. Je dormirais moins mal. »', '« Je suis aussi réel que le rapport que je dois écrire ce soir. »'],
      deja: ['« Je vous l’ai déjà dit : ', '« Deuxième fois : ']
    },
    populaire: {
      ignore: ['« {X} ? Connais pas, {m}. Faudrait demander à quelqu’un de plus instruit. »', '« Ça me dit rien, {x}. »', '« {X} ? Jamais vu, jamais entendu. »'],
      mot: ['« “{W}” ? Vous parlez comme dans les livres, {m}. »', '« “{W}” ? Pourquoi vous me demandez ça ? »', '« J’ai pas bien compris, {m}. “{W}”, vous dites ? »'],
      pourquoi: ['« Pourquoi ? Ah, ça… Les gens font des choses, voilà tout. »', '« Allez savoir. C’est pas à moi qu’on explique les choses. »'],
      comment: ['« Comme d’habitude, j’imagine. »', '« Comment ? Ben… Comme on peut. »'],
      quand: ['« Y a un moment, déjà. »', '« Je saurais pas dire le jour. Avec ce brouillard, tous les jours se ressemblent. »'],
      ou: ['« Par là-bas, quelque part. »', '« J’en sais trop rien, {m}. »'],
      combien: ['« Oh, un paquet. »', '« Combien ? Plus que ma paye, sûrement. »'],
      quoi: ['« Ça, j’en sais rien. »', '« Rien de spécial. »'],
      qui: ['« Personne que je connaisse. »', '« Un type. Comme il en passe cent par jour. »'],
      ouinon: ['« Ben… non. »', '« Ça oui ! »', '« Faut voir. »'],
      avis: ['« Moi, j’ai pas d’avis, {m}. On me demande jamais. »', '« Ce que j’en pense ? Que ça me regarde pas. »'],
      demande: ['« J’peux pas, {m}. Pas le droit. »', '« Faudrait voir. »'],
      affirmation: ['« Ah bon ? »', '« Ben ça alors. »', '« Si vous le dites, {m}. »'],
      insulte: ['« Hé ! On se calme, {m}. »', '« Vous pouvez parler autrement, quand même. »'],
      compliment: ['« Oh, ben, merci, {m}. » On rougit un peu.', '« Faut pas vous moquer. »'],
      ana: ['« Un quoi ? Un “{A}” ? Jamais vu ça, {m}. »', '« “{A}” ? C’est une marque de savon ? »'],
      meta: ['« Une machine ? Moi ? » Un rire gras. « Si j’étais une machine, je me fatiguerais pas tant. »', '« Je suis aussi vrai que mes cors aux pieds, {m}. »'],
      deja: ['« Je vous l’ai déjà dit, {m} : ', '« Comme je disais : ']
    },
    savant: {
      ignore: ['« {X} ? Le nom ne m’évoque rien, ce qui en soi est intéressant. »', '« Je n’ai rien lu sur {x}, je le confesse. »'],
      mot: ['« “{W}” ? Voilà une question singulière. À quel propos ? »', '« “{W}”… Précisez votre pensée, je vous prie. »'],
      pourquoi: ['« Pourquoi ? La question est légitime. La réponse, hélas, est rarement à la hauteur de la question. »', '« Il y a toujours une raison. Elle n’est pas toujours de ce monde. »'],
      comment: ['« Par des voies que nous ne comprenons qu’imparfaitement. »', '« Le comment est toujours plus simple que le pourquoi. »'],
      quand: ['« La chronologie est incertaine. »', '« Les dates mentent moins que les hommes, mais je n’ai pas celle-là. »'],
      ou: ['« Il faudrait consulter les sources. »', '« Je l’ignore. Le British Museum, peut-être ? »'],
      combien: ['« Je n’ai pas de chiffre fiable. »', '« Davantage qu’on ne le croit. C’est toujours davantage. »'],
      quoi: ['« Question vaste. Précisez, je vous prie. »', '« Voilà qui mériterait une conférence entière. »'],
      qui: ['« Je ne saurais le dire. »', '« Quelqu’un qui savait, sans doute. »'],
      ouinon: ['« Probablement. »', '« Je ne le pense pas. »', '« Ni oui ni non, malheureusement. »'],
      avis: ['« Mon avis ? Que nous en savons trop peu. »', '« J’ai un avis, mais il n’est pas encore publiable. »'],
      demande: ['« Je ferai de mon mieux. »', '« Hélas, je ne le peux pas. »'],
      affirmation: ['« Fascinant. »', '« Vous avez des preuves ? »', '« Intéressant. Très intéressant. »'],
      insulte: ['« L’invective n’est pas un argument. »', '« Je vous croyais plus raisonnable. »'],
      compliment: ['« Vous me flattez. »', '« C’est aimable. Inexact, mais aimable. »'],
      ana: ['« “{A}” ? Je ne connais pas ce mot. Un néologisme ? »', '« Un “{A}” ? Est-ce une théorie nouvelle ? »'],
      meta: ['« Un automate ? Voilà une hypothèse que je n’avais pas envisagée. Je ne crois pas, non. »', '« Si j’étais une machine, je me poserais moins de questions. »'],
      deja: ['« Je vous l’ai dit : ', '« Je me répète : ']
    },
    domestique: {
      ignore: ['« {X}, {m} ? Je ne connais pas. »', '« Je ne saurais dire, {m}. »'],
      mot: ['« Pardon, {m}, “{W}” ? »', '« Je ne suis pas sûr de comprendre, {m}. »'],
      pourquoi: ['« Ce n’est pas à moi de le savoir, {m}. »', '« On ne me dit pas ces choses-là. »'],
      comment: ['« Comme d’ordinaire, {m}. »', '« Je ne saurais dire. »'],
      quand: ['« Je ne me rappelle plus le jour, {m}. »', '« Il y a peu. »'],
      ou: ['« Je l’ignore, {m}. »', '« On ne me l’a pas dit. »'],
      combien: ['« Je n’ai pas compté, {m}. »', '« Beaucoup. »'],
      quoi: ['« Rien, {m}. »', '« Je ne sais pas, {m}. »'],
      qui: ['« Personne, {m}. »', '« Je ne sais pas qui, {m}. »'],
      ouinon: ['« Non, {m}. »', '« Oui, {m}. »', '« Je ne crois pas, {m}. »'],
      avis: ['« Je n’ai pas d’avis, {m}. On ne me demande pas le mien. »', '« Ce n’est pas ma place, {m}. »'],
      demande: ['« Je ne peux pas, {m}. »', '« Si je le peux, {m}. »'],
      affirmation: ['« Bien, {m}. »', '« Oui, {m}. »'],
      insulte: ['On baisse les yeux, sans répondre.', '« Comme vous voudrez, {m}. »'],
      compliment: ['« Merci, {m}. »', 'Un petit salut, gêné.'],
      ana: ['« Un “{A}”, {m} ? Je ne connais pas. »', '« Pardon, {m}… “{A}” ? »'],
      meta: ['« Une machine, {m} ? » On ne comprend pas la plaisanterie, mais on sourit par politesse.', '« Je suis de chair, {m}. Trop, parfois. »'],
      deja: ['« Je vous l’ai dit, {m} : ', '« Comme je disais, {m} : ']
    },
    mondain: {
      ignore: ['« {X} ? Ma foi, non. Je ne fréquente pas. »', '« Je ne crois pas connaître, et je ne crois pas le regretter. »'],
      mot: ['« “{W}” ? Quelle drôle de question. »', '« Vous parlez comme les jeunes gens d’aujourd’hui. “{W}”… et puis quoi encore ? »'],
      pourquoi: ['« Pourquoi ? Parce que le monde est ainsi fait, mon ami. »', '« On ne pose pas cette question-là, voyons. »'],
      comment: ['« Avec élégance, j’espère. »', '« Comment… Je n’en ai pas la moindre idée. »'],
      quand: ['« Oh, il y a un siècle. Ou la semaine dernière. »', '« Je ne compte plus les jours, à mon âge. »'],
      ou: ['« Ailleurs. Toujours ailleurs. »', '« Je n’en sais rien, et je m’en porte fort bien. »'],
      combien: ['« Trop, sans doute. Tout coûte trop. »', '« On ne parle pas de chiffres. »'],
      quoi: ['« Rien qui vaille d’être dit. »', '« Voilà une question bien vaste pour un si petit voyage. »'],
      qui: ['« Personne de convenable. »', '« Je ne sais pas, et je ne veux pas savoir. »'],
      ouinon: ['« Non, mon ami. »', '« Mais oui. »', '« Qui sait ? »'],
      avis: ['« Mon avis ? On ne me le demande plus depuis la mort de mon mari. »', '« J’ai un avis sur tout, mais je le garde. »'],
      demande: ['« Je ne crois pas, non. »', '« Si cela vous fait plaisir. »'],
      affirmation: ['« Vraiment ? »', '« Comme c’est étrange. »'],
      insulte: ['« Je vous ai mal jugé, visiblement. »', 'On détourne la tête avec une lenteur étudiée.'],
      compliment: ['« Flatteur. »', '« Vous êtes un enjôleur. Ou un menteur. Les deux, sans doute. »'],
      ana: ['« Un “{A}” ? Comme c’est moderne. Je n’y comprends rien. »', '« “{A}” ? Vous avez de drôles de lectures. »'],
      meta: ['« Une poupée mécanique ? Mon pauvre ami, on me l’a dit plus méchamment. »', '« Je suis trop vieille pour être une machine. »'],
      deja: ['« Je vous l’ai dit, mon ami : ', '« Vous radotez, ou c’est moi ? ']
    },
    fievreux: {
      ignore: ['« {X} ? {X}… Le nom sonne comme une gare où l’on ne s’arrête pas. »', '« Je ne connais plus personne. Ils sont tous descendus. »'],
      mot: ['« “{W}”… C’est le nom d’une station, n’est-ce pas ? »', '« Répétez. “{W}”. Oui. Le train l’a dit, cette nuit. »'],
      pourquoi: ['« Parce que la voie est circulaire. »', '« Pourquoi ? Il n’y a pas de pourquoi, ici. Il n’y a que la suite. »'],
      comment: ['« En roulant. Toujours en roulant. »', '« Comme on tombe. »'],
      quand: ['« Le temps ne passe pas ici. Il tourne. »', '« Hier. Dans vingt ans. »'],
      ou: ['« Là où mènent les rails. »', '« Plus loin. Toujours plus loin. »'],
      combien: ['« Quarante-trois. Il y en a toujours quarante-trois. »', '« Assez pour remplir un wagon. »'],
      quoi: ['« Le bruit. Vous ne l’entendez pas ? »', '« Rien. Tout. »'],
      qui: ['« Le conducteur. Personne ne l’a jamais vu. »', '« Nous tous. »'],
      ouinon: ['« Oui. Non. Le train décide. »', '« Peut-être, au prochain arrêt. »'],
      avis: ['« Je ne pense plus. Je compte les traverses. »', '« Penser est dangereux, ici. »'],
      demande: ['« Personne ne descend. »', '« Je ne peux pas. Mes mains sont cousues au siège. »'],
      affirmation: ['« Oui. Oui. Et alors ? »', '« Vous croyez ? »'],
      insulte: ['Un rire qui ne finit pas.', '« Ils disaient la même chose, les autres. »'],
      compliment: ['« Merci. » Le mot sonne faux dans sa bouche, comme une pièce étrangère.', '« Vous êtes gentil. Vous ne resterez pas gentil. »'],
      ana: ['« “{A}”… Oui. Ça viendra. Tout vient. »', '« Vous parlez comme quelqu’un qui n’est pas encore né. »'],
      meta: ['« Une machine ? Nous sommes tous dans la machine. »', '« Le train est une machine. Nous sommes ses pensées. »'],
      deja: ['« Encore. Encore. ', '« Vous l’avez déjà demandé. La voie est circulaire : ']
    }
  };
  V.etranger = V.populaire;
  // quand on n'a saisi que des bribes d'une longue phrase
  var FLOU = {
    formel: ['« Pardonnez-moi, {m} : vous me parlez de « {1} », et de « {2} » ? Je crains de ne pas saisir où vous voulez en venir. »'],
    sec: ['« « {1} », « {2} »… Posez une question claire, je vous répondrai. »'],
    populaire: ['« Attendez, j’ai pas tout suivi. « {1} », « {2} »… vous voulez savoir quoi, au juste ? »'],
    savant: ['« Hm. « {1} », « {2} »… Reformulez, mon cher, je ne vois pas le lien. »'],
    domestique: ['« Pardon, {m}… « {1} », « {2} » ? Je ne suis pas certain de comprendre ce que vous me demandez. »'],
    mondain: ['« Vous parlez trop vite, mon ami. « {1} », « {2} »… et alors ? »'],
    fievreux: ['« « {1} »… « {2} »… Les mots se mélangent, ici. Redites. Plus lentement. »']
  };
  // la réponse brève : il a demandé, on a dit oui ou non, il prend acte ; il n'a rien demandé, il s'étonne
  var BREF = {
    oui: {
      formel: ['« Bien. Je m’en doutais un peu. »', '« À la bonne heure. »', '« C’est ce qu’il me semblait. »', '« Fort bien, {m}. »'],
      sec: ['« Bien. »', '« Soit. »', '« C’est noté. »'],
      populaire: ['« Ah, vous voyez. »', '« Je me disais, aussi. »', '« Bon. »'],
      savant: ['« C’est bien ce que je pensais. »', '« Voilà qui est clair. »', '« Bien, bien. »'],
      domestique: ['« Bien, {m}. »', '« Très bien, {m}. »'],
      mondain: ['« Je l’aurais parié. »', '« Naturellement. »', '« Voyez-vous cela. »'],
      fievreux: ['« Oui. Oui, c’est ça. »', '« Vous aussi, alors. »']
    },
    non: {
      formel: ['« Non ? Tiens. J’aurais cru. »', '« Ah. Je me suis donc trompé. »', '« Vraiment ? Soit. »'],
      sec: ['« Non. Bien. »', '« Tant pis. »', '« Passons. »'],
      populaire: ['« Ah bon ? »', '« Non ? Bon, bon. »', '« Tant pis, alors. »'],
      savant: ['« Non ? Curieux. »', '« Tiens. J’aurais juré le contraire. »', '« Dommage. »'],
      domestique: ['« Comme {m} voudra. »', '« Bien, {m}. »'],
      mondain: ['« Non ? Quel dommage. »', '« Vous m’étonnez. »'],
      fievreux: ['« Non… Non, bien sûr. Personne. »', '« Alors il n’y a que moi. »']
    },
    vague: {
      formel: ['« Vous n’en êtes pas certain. Cela arrive. »', '« Prenez le temps d’y penser, {m}. »'],
      sec: ['« Ce n’est pas une réponse. »', '« Décidez-vous. »'],
      populaire: ['« Ni oui ni non, quoi. »', '« Faudrait savoir. »'],
      savant: ['« Le doute est une position honorable. »', '« Vous hésitez. C’est déjà une indication. »'],
      domestique: ['« Bien, {m}. »'],
      mondain: ['« Que de mystère. »', '« Vous ne vous mouillez pas. »'],
      fievreux: ['« On ne sait jamais, ici. »']
    },
    // il venait d'affirmer quelque chose : on acquiesce…
    suite: {
      formel: ['« Voilà. »', '« C’est ainsi, {m}. »', '« Comme je vous le dis. »'],
      sec: ['« Voilà. »', '« C’est tout. »', '« Donc. »'],
      populaire: ['« Eh oui. »', '« Comme je vous le dis. »', '« Voilà. »'],
      savant: ['« Précisément. »', '« Voilà. »', '« Vous me suivez. »'],
      domestique: ['« Oui, {m}. »', '« C’est cela, {m}. »'],
      mondain: ['« N’est-ce pas ? »', '« Vous voyez. »'],
      fievreux: ['« Oui. Vous voyez. »', '« Vous aussi, vous le savez. »']
    },
    // … ou l'on en doute
    contre: {
      formel: ['« Non ? Comme il vous plaira. »', '« Vous n’êtes pas tenu de me croire, {m}. »', '« C’est pourtant ainsi. »'],
      sec: ['« C’est pourtant ainsi. »', '« Croyez ce que vous voulez. »'],
      populaire: ['« Ben si. »', '« Croyez-moi ou pas, c’est pareil. »', '« C’est comme ça, pourtant. »'],
      savant: ['« Vous en doutez ? C’est votre droit. »', '« Les faits sont têtus. »'],
      domestique: ['« Si {m} le dit. »', '« Je ne fais que répéter, {m}. »'],
      mondain: ['« Vous me contredisez ? Charmant. »', '« Croyez ce qu’il vous plaira. »'],
      fievreux: ['« Si. Si, je vous dis. »']
    },
    // … ou l'on ne se prononce pas
    doute: {
      formel: ['« Peut-être, {m}. Je vous donne ce que j’ai. »', '« À vous d’en juger. »'],
      sec: ['« Pas peut-être. »', '« Je ne suppose pas. Je constate. »'],
      populaire: ['« Pas peut-être. Sûr. »', '« Moi, je vous dis ce que je sais. »'],
      savant: ['« Le doute vous honore. »', '« Peut-être. C’est le mot le plus honnête de la langue. »'],
      domestique: ['« Peut-être, {m}. »'],
      mondain: ['« Peut-être ! Que vous êtes prudent. »', '« Vous ne vous mouillez pas. »'],
      fievreux: ['« Pas peut-être. Je le sais. »']
    },
    // une question ouverte (« Que puis-je pour vous ? ») : oui ou non n'y répond pas
    ouvert: {
      formel: ['« Mais encore, {m} ? »', '« C’est-à-dire ? »', '« Je vous écoute. »'],
      sec: ['« Ce n’est pas une réponse. »', '« Mais encore ? »', '« Précisez. »'],
      populaire: ['« Oui, mais quoi ? »', '« C’est-à-dire ? »', '« Dites toujours. »'],
      savant: ['« Mais encore ? »', '« Développez, je vous prie. »'],
      domestique: ['« {M} désire ? »', '« Je vous écoute, {m}. »'],
      mondain: ['« Mais encore ? »', '« Vous êtes d’un laconisme ! »'],
      fievreux: ['« Dites. Dites vite. »']
    },
    seul: {
      formel: ['« Pardon ? À quoi répondez-vous, {m} ? »', '« Je ne vous avais rien demandé, je crois. »', '« Vous disiez ? »'],
      sec: ['« Je n’ai rien demandé. »', '« Plaît-il ? »', '« À quel sujet ? »'],
      populaire: ['« Hein ? À quoi vous répondez, là ? »', '« J’ai rien demandé, moi. »', '« Comment ça ? »'],
      savant: ['« Vous répondez à une question que je n’ai pas posée. »', '« Pardon ? De quoi parlons-nous ? »'],
      domestique: ['« {M} disait ? »', '« Je vous demande pardon, {m} ? »'],
      mondain: ['« Vous parlez tout seul, maintenant ? »', '« À qui dites-vous cela ? »'],
      fievreux: ['« Vous répondez à quelqu’un ? Il y a quelqu’un ? »']
    }
  };
  var SUITE = {
    formel: ['« Je n’en sais pas davantage, {m}. »', '« Je vous ai dit ce que je savais. »'], sec: ['« C’est tout. »', '« Rien à ajouter. »'],
    populaire: ['« Ben… c’est tout, {m}. J’en sais pas plus. »', '« Que voulez-vous que je vous dise de plus ? »'], savant: ['« Je n’ai pas d’autre élément, hélas. La science s’arrête où s’arrêtent les faits. »'],
    domestique: ['« Je n’en sais pas plus, {m}. »'], mondain: ['« Vous êtes bien curieux. Je ne sais rien de plus, et si je savais, je ne vous le dirais pas. »'],
    fievreux: ['« Pourquoi ? Il n’y a pas de pourquoi, ici. Il y a des gares. »']
  };
  // bonjour, bonsoir
  var SALUT = {
    formel: ['« {B}, {m}. »', '« {B}, {m}. Que puis-je pour vous ? »'],
    sec: ['« Oui ? »', '« {B}. Faites vite. »'],
    populaire: ['« {B}, {m} ! »', '« {B}. Qu’est-ce qui vous amène ? »'],
    savant: ['« Ah ! {B}, {m}, {B} ! »', '« {B}, mon cher. »'],
    domestique: ['« {B}, {m}. »', 'Une légère inclinaison de la tête. « {B}, {m}. »'],
    mondain: ['« {B}, mon ami. Asseyez-vous donc, vous me donnez le tournis. »'],
    fievreux: ['« {B}… C’est déjà le jour ? Ici, on ne sait jamais. »']
  };
  var RESALUT = {
    formel: ['« Nous nous sommes déjà salués, {m}. »'], sec: ['« Oui, {B}, on l’a déjà dit. Et ensuite ? »'], populaire: ['« Encore {B} ? Vous êtes poli, vous. »'],
    savant: ['« Vous me l’avez déjà souhaité, mon cher. Venons-en au fait. »'], domestique: ['« {B} encore, {m}. »'], mondain: ['« Vous l’avez déjà dit, jeune homme. Vous radotez. »'], fievreux: ['« {B}, {B}, {B}… comme les gares. Toutes les mêmes. »']
  };
  // quand un inconnu tutoie : en 1923, ça ne passe pas inaperçu
  var TU = {
    formel: ['« Je ne crois pas que nous ayons gardé les cochons ensemble, {m}. »', '« Nous nous tutoyons, à présent ? Je n’avais pas remarqué. »'],
    sec: ['« On se connaît ? Non. Alors c’est « vous ». »', '« Vous me tutoierez quand on aura bu ensemble. Ce n’est pas pour demain. »'],
    populaire: ['« Tiens, on se tutoie, maintenant ? Bon. Si ça vous chante. »', '« Hé, pas de familiarités, hein. Enfin… »'],
    savant: ['« Le tutoiement, {m} ? Voilà qui est bien familier. Passons. »'],
    domestique: ['Un léger temps d’arrêt devant cette familiarité, puis on vous répond comme si de rien n’était.'],
    mondain: ['« Vous me tutoyez ? Mon défunt mari lui-même ne s’y risquait pas. »'],
    fievreux: ['« Tu… Oui. Ici, tout le monde se tutoie. Les morts sont familiers. »']
  };

  // ---------------------------------------------------------------- la culture de janvier 1923, selon le milieu
  // h : savants, mondains, diplomates ; p : peuple, commerçants, domestiques ; o : police ; fr : les Français du prologue
  // la même conversation, à Paris en janvier 1923 (fiches marquées pa: true)
  var CULT_PA = {
    brouillard: ['« De la pluie depuis Noël. La Seine monte ; à Bercy, on surveille les caves. »', '« Un temps de janvier, {m}. Gris le matin, gris le soir, et mouillé entre les deux. »'],
    roi: ['« Des rois ? Nous avons réglé la question il y a un moment. » Un demi-sourire. « Cela dit, les vôtres ont de la tenue. »', '« Ici, on a un président. Personne ne se retourne sur son passage, et c’est très bien ainsi. »'],
    gouvernement: ['« Poincaré gouverne comme un notaire : tout est en règle, et rien n’est gai. »', '« La politique ? On change de ministère comme de chemise, et la chemise reste sale. »'],
    // les troupes françaises entrent dans la Ruhr le jeudi 11 janvier 1923 (jour 6, en comptant du vendredi 5)
    ruhr: function (api) { return Math.floor(api.s.min / 1440) >= 6
      ? ['« Nos soldats sont entrés dans la Ruhr cette semaine. On dit que l’Allemagne paiera. On le dit depuis quatre ans. »', '« La Ruhr ! Les journaux ne parlent que de ça. Du charbon pris à la baïonnette : je ne sais pas si ça chauffe mieux. »']
      : ['« Poincaré parle d’aller chercher le charbon dans la Ruhr, puisque l’Allemagne ne paie pas. Il le fera, croyez-moi. »', '« On dit que l’armée va entrer dans la Ruhr. Encore des garçons en uniforme sur les quais de gare. »']; },
    egypte: ['« Ce pharaon qu’un Anglais a déterré ? Les illustrés en sont pleins. De l’or jusqu’au plafond, paraît-il. On ferait mieux de laisser dormir les morts. »', '« Toutankhamon. Tout Paris sait le dire, maintenant. Personne ne sait l’écrire. »'],
    mussolini: ['« Les Italiens ont trouvé leur homme, à ce qu’on dit. Un ancien journaliste. Ça finit rarement bien, les journalistes au pouvoir. »', '« Des chemises noires qui marchent sur Rome… On a vu des carnavals plus drôles. »'],
    russie: ['« Paris est plein de Russes, {m}. Des princes qui conduisent des taxis, des colonels portiers. Ils attendent que ça passe. Ça ne passe pas. »', '« Les Soviets ? Demandez aux petits épargnants ce qu’ils pensent de l’emprunt russe. Mais pas à table. »'],
    turquie: ['« On négocie à Lausanne, il paraît. Les Turcs ont un général qui ne plie pas. Constantinople ne sera plus jamais ce qu’elle était. »', '« L’Orient ? C’est loin, et ça nous coûte toujours quelque chose. »'],
    irlande: ['« Les Irlandais ont leur État, et les voilà qui se battent entre eux. On connaît ça : nous avons eu la Commune. »', '« L’Irlande ? Une triste affaire, à ce qu’en disent les journaux. »'],
    guerre: ['« La guerre… » Un silence. « Chaque village a son monument, maintenant. On n’a pas fini de graver les noms. »', '« J’aime mieux ne pas en parler, {m}. On en a tous rapporté quelque chose, ou laissé quelqu’un. »'],
    tsf: ['« La T.S.F. ? La tour Eiffel envoie des concerts, le soir. Mon voisin a un poste à galène : il écoute avec un casque, l’air d’un scaphandrier. »', '« De la musique qui passe par l’air, sans fil. On s’y fera. On s’est bien fait au téléphone. »'],
    spiritisme: ['« Les tables tournantes ? Depuis la guerre, tant de mères voudraient entendre une voix… Les charlatans ont de beaux jours. »', '« Il y a un institut pour ça, avenue Niel, avec des savants très sérieux. Je ne sais pas ce qu’ils y pèsent. »'],
    einstein: ['« Einstein est venu parler au Collège de France, au printemps dernier. Tout Paris y était. Personne n’a compris, et tout le monde en parle encore. »', '« La science va plus vite que nous, {m}. Je me contente de l’électricité, quand elle marche. »'],
    cinema: ['« Le cinéma ? Le samedi, au Gaumont-Palace. Six mille places, un orgue, et Charlot. »', '« Abel Gance vient de sortir un film de locomotives qui dure une journée entière. Il paraît qu’on en sort changé, ou endormi. »'],
    musique: ['« Le jazz ! Il y en a partout, depuis les Américains. Au Bœuf sur le Toit, on ne s’entend plus penser, et c’est le but. »', '« On danse beaucoup, depuis l’armistice. Comme des gens qui ont eu peur. »'],
    femmes: ['« Le vote des femmes ? Les députés ont dit oui, les sénateurs ont dit non. En attendant, tout Paris lit « La Garçonne » en cachette. »', '« Ma foi… Pendant quatre ans, elles ont fait tourner les usines. Maintenant, on voudrait qu’elles l’oublient. »'],
    argent: ['« La vie chère, {m} ! Le pain, le charbon, les loyers. Le franc fond comme du beurre. »', '« Tout augmente, sauf les traitements. »'],
    amerique: ['« Les Américains ? Ils ont interdit le vin chez eux, alors ils viennent boire le nôtre. Montparnasse en est plein. »', '« Un pays où l’on ne peut pas boire un verre… Je ne comprendrai jamais. »'],
    sport: ['« Vous avez su, pour Carpentier ? Battu par Siki, en septembre. Paris ne s’en est pas remis. »', '« Le sport ? Le vélo, {m}. Le Tour de France, en juillet : c’est notre vraie fête nationale. »'],
    londres: ['« Londres ? Je n’y suis jamais allé. On dit que le brouillard s’y coupe au couteau, et qu’on y mange du mouton bouilli. »', '« Vous en arrivez ? Vous verrez : ici, il pleut autant, mais on se plaint mieux. »'],
    paris: ['« Paris ? C’est une ville où l’on travaille trop et où l’on prétend le contraire. »', '« Vous verrez, {m}. On peste contre Paris toute l’année, et on ne peut pas vivre ailleurs. »'],
    dieu: ['« La religion ? Chacun la sienne, {m}, et la République pour tout le monde. »', '« Je vais à la messe à Noël et aux enterrements. Ces dernières années, ça a fait beaucoup de messes. »'],
    mort: ['« On en a trop vu, de morts, pour en parler légèrement. »', '« La mort ? Elle a pris de l’avance sur nous tous, ces dernières années. »'],
    train: ['« L’Orient-Express ! Trois jours jusqu’à Constantinople, dans des draps brodés. Je n’ai jamais dépassé Fontainebleau. »', '« Les trains de luxe partent de la gare de Lyon, le soir. On va les regarder, comme on regardait les paquebots. »'],
    boisson: ['« Un verre ? Ici, {m}, on dit un ballon de rouge, et on le boit debout, au zinc. »', '« Le vin a encore augmenté. C’est là qu’on voit qu’un pays va mal. »'],
    soiree: ['« La soirée ? Paris ne se couche plus, depuis la guerre. Moi, si. »', '« Une soirée comme les autres, {m}. Longue. »'],
    sommeil: ['« Vous avez mauvaise mine, sans vous offenser. Paris ne laisse pas dormir les étrangers, les premières nuits. »', '« Le sommeil ? Avec les tramways dès cinq heures, c’est un luxe. »'],
    lecture: ['« Je lis le feuilleton du journal. Et Proust, quand je veux m’endormir. Il est mort en novembre, le pauvre homme, sans avoir fini. »', '« Lire ? Tout le monde lit, ici. C’est comprendre, qui est plus rare. »'],
    table: ['« Si vous avez faim, il y a un bouillon à deux pas. On y mange pour trois francs, coude à coude avec tout Paris. »', '« La cuisine ? Depuis la guerre, le beurre est hors de prix. On fait des miracles avec du saindoux. »'],
    voyages: ['« Voyager ? Je connais Paris, et un peu la Marne. Ça m’a suffi. »', '« Vous autres, Anglais, vous êtes toujours en route. Nous, on attend que le monde vienne. Il vient. »'],
    sante: ['« On fait aller, {m}. La grippe de 1918 a emporté les autres. »', '« La santé ? Tant qu’on est debout… »'],
    tabac: ['« Une Gauloise, si vous en avez. Le tabac de la Régie, c’est tout ce que l’État réussit. »', '« Je fume du gris, que je roule. Ça occupe les mains. »']
  };
  var CULT = [
    { k: 'brouillard', re: /\b(brouillard|temps qu il fait|quel temps|le temps est|il fait (beau|froid|chaud|mauvais|humide|doux)|fait il (beau|froid)|meteo|pluie|il pleut|froid|neige|fog|smog)\b/,
      h: ['« Ce brouillard est un scandale sanitaire. Le charbon, voilà le coupable. »', '« Londres en janvier. On s’y habitue, on ne s’y résigne pas. »'],
      p: ['« Une vraie purée de pois, {m}. Hier, un omnibus est entré dans une vitrine à Holborn. »', '« Ça vous colle aux poumons, ce brouillard. Ma mère dit que c’est les morts qui respirent. »'],
      o: ['« Le brouillard, c’est le meilleur ami des pickpockets. Et le pire des nôtres. »'],
      fr: ['« Ce froid, ce noir… Dehors, on ne voit même plus les gares. »', '« Le temps ? Mauvais. Comme toujours en janvier, sur cette ligne. »'] },
    { k: 'roi', re: /\b(roi|le roi|george v|reine|reine mary|prince de galles|famille royale|monarchie|couronne)\b/,
      h: ['« Sa Majesté se porte bien, dit-on. Le prince de Galles, lui, danse trop. »', '« Le roi George est un homme de devoir. C’est rare, et un peu ennuyeux. »'],
      p: ['« God save the King, {m}. Et qu’il nous sauve aussi, tant qu’il y est. »', '« Le prince de Galles ? Toutes les filles du quartier ont sa photo. »'],
      o: ['« Je ne discute pas de Sa Majesté en service. »'],
      fr: ['« Le roi d’Angleterre ? Un homme sérieux, paraît-il. Pas comme nos ministres. »'] },
    { k: 'gouvernement', re: /\b(premier ministre|gouvernement|bonar law|lloyd george|parlement|elections?|politique|ministre|poincare|millerand|chambre des deputes|conservateurs|travaillistes|socialistes?|communistes?)\b/,
      h: ['« Bonar Law ? Un homme malade à la tête d’un pays fatigué. »', '« La politique, {m}, c’est l’art d’arriver après les événements. »'],
      p: ['« Les ministres ? Ils ont des chaussures neuves, nous on a des trous dans les nôtres. »', '« Les travaillistes vont finir par gagner, vous verrez. »'],
      o: ['« Je ne fais pas de politique. Je fais des rapports. »'],
      fr: ['« Poincaré ? Il veut faire payer les Allemands, et il a bien raison. »', '« La politique, monsieur, ça ne m’a jamais rempli une assiette. »'] },
    { k: 'ruhr', re: /\b(ruhr|reparations|allemagne|allemands|boches|mark|inflation|berlin)\b/,
      h: function (api) { return ['« Les Français ' + (H.day(api) >= 6 ? 'sont entrés dans la Ruhr. Ils veulent leur charbon. Ils auront la haine.' : 'parlent d’occuper la Ruhr. S’ils le font, l’Europe recommencera à brûler.') + ' »', '« Le mark ne vaut plus rien. Une brouette de billets pour un pain, là-bas. »']; },
      p: ['« Les Allemands ? Qu’ils paient. Mon frère est resté à Ypres. »', '« On dit qu’à Berlin, on se chauffe avec des billets de banque. »'],
      o: ['« L’Allemagne, c’est le problème des Français, pas le mien. »'],
      fr: ['« La Ruhr ? Nos soldats y sont depuis janvier. Les Allemands font la grève, et le mark ne vaut plus le papier. »', '« On dit qu’à Berlin, un pain coûte un milliard. Un milliard, monsieur ! »'] },
    { k: 'egypte', re: /\b(toutankhamon|tutankhamun|carnarvon|carter|egypte|pharaon|tombeau|momie|louxor|vallee des rois)\b/,
      h: ['« Le tombeau de Toutankhamon ! Lord Carnarvon et Carter ont trouvé l’antichambre intacte en novembre. Tout Londres ne parle que de ça. »', '« De l’or, des chars, des lits funéraires. Et la chambre scellée n’est même pas encore ouverte. »'],
      p: ['« Le pharaon en or ? Ma belle-sœur s’est acheté un chapeau égyptien. Un chapeau ! »', '« Des trésors plein un trou dans le sable. Et nous, on gratte pour le charbon. »'],
      o: ['« Toutankhamon ? Si on m’apporte une momie volée, je saurai à qui la rendre. »'],
      fr: ['« L’Égypte ? Les Anglais y ont trouvé un roi en or. Toujours les Anglais. »'] },
    { k: 'mussolini', re: /\b(mussolini|fascistes?|chemises noires|marche sur rome|italie|rome)\b/,
      h: ['« Mussolini ? Un journaliste devenu dictateur. Les trains vont peut-être arriver à l’heure, en Italie. »', '« Les chemises noires m’inquiètent. Le Continent a la fièvre. »'],
      p: ['« Le gros Italien qui crie ? On le voit aux actualités, au cinéma. Il fait rire la salle. »'],
      o: ['« Les fascistes ? Qu’ils restent chez eux. »'],
      fr: ['« Mussolini ? Un braillard. Mais les Italiens l’aiment, alors… »'] },
    { k: 'russie', re: /\b(russie|russes|bolcheviques?|bolcheviks?|lenine|trotsky|soviets?|soviétique|revolution russe|tsar)\b/,
      h: ['« Les bolcheviks viennent de fonder leur union de républiques. Le tsar est mort, et le monde qui allait avec. »', '« Lénine est malade, dit-on. Après lui, je crains pire. »'],
      p: ['« Les rouges ? Y en a qui en parlent, aux docks. Moi je dis rien. »'],
      o: ['« Nous surveillons quelques Russes à Whitechapel. Ils parlent beaucoup, ils boivent beaucoup. »'],
      fr: ['« Les bolcheviks ? Ils ont tué le tsar et volé les emprunts russes de ma tante. »'] },
    { k: 'turquie', re: /\b(kemal|mustafa kemal|ataturk|lausanne|sultan|califat|ottomans?|empire ottoman|smyrne|angora|ankara|constantinople|stamboul)\b/,
      h: ['« À Lausanne, on négocie la paix avec Kemal. Le sultan est parti en exil sur un navire anglais. Un empire qui finit dans une valise. »', '« Smyrne a brûlé en septembre. Les Grecs, les Arméniens… On ne veut pas savoir. »'],
      p: ['« Les Turcs ? On s’est battu contre eux à Gallipoli. Mon cousin y est resté. »'],
      o: ['« Les Turcs, en ce moment, on les surveille. Trois sont morts à Chelsea, vous savez. »'],
      fr: ['« Constantinople ? C’est le terminus, monsieur. Mais depuis la guerre, on ne sait plus à qui elle est. »'] },
    { k: 'irlande', re: /\b(irlande|irlandais|irlandaise|dublin|ira|sinn fein|etat libre|fenians?)\b/,
      h: ['« L’État libre d’Irlande existe depuis décembre. Et les Irlandais s’y entretuent déjà. »'],
      p: ['« Les Irlandais ? Y en a plein le quartier. Des braves gens, quand ils sont pas soûls. »'],
      o: ['« L’Irlande, c’est la Special Branch. Moi, je m’occupe des morts de Londres. »'],
      fr: ['« L’Irlande ? Ils ont eu leur indépendance, comme nous la Lorraine. Enfin, presque. »'] },
    { k: 'guerre', re: /\b(la guerre|grande guerre|front|tranchees|armistice|verdun|ypres|la somme|gallipoli|gaz|poilus?|tommies?)\b/,
      h: ['« La guerre ? Nous avons perdu une génération et gagné des monuments. »', '« On n’en parle pas, {m}. C’est la règle tacite des survivants. »'],
      p: ['« La guerre ? J’y étais. J’en parle pas. »', '« Mon frère est revenu. Enfin, son corps est revenu. »'],
      o: ['« Quatre ans dans les tranchées. Ensuite on m’a donné un uniforme bleu à la place du kaki. »'],
      fr: ['« La guerre ? Vous avez vu les gueules cassées, dans le métro ? Voilà la guerre. »'] },
    { k: 'tsf', re: /\b(tsf|radio|bbc|wireless|poste a galene|emission|ondes)\b/,
      h: ['« La BBC émet depuis novembre. Des concerts dans l’air, invisibles. Vous trouvez ça rassurant ? Moi pas. »'],
      p: ['« La TSF ? Mon beau-frère s’est fabriqué un poste. On entend de la musique qui vient de nulle part. »'],
      o: ['« La radio ? Un jour, on diffusera les avis de recherche comme ça. »'],
      fr: ['« La TSF ? Il paraît qu’on entend Paris jusqu’en Suisse. »'] },
    { k: 'spiritisme', re: /\b(spiritisme|spirites?|medium|mediums|seance|seances|tables tournantes|conan doyle|ectoplasme|ouija|voyante|voyantes|houdini|occultisme|occulte)\b/,
      h: ['« Sir Arthur Conan Doyle croit dur comme fer aux esprits. Le créateur de Sherlock Holmes ! Il faut croire que la logique se fatigue. »', '« Houdini démasque les médiums un par un. Comme Smith. Ils sont amis, d’ailleurs, je crois. »'],
      p: ['« Les séances ? Ma voisine y va le jeudi. Elle parle à son fils mort à la guerre. Ça lui fait du bien, alors… »', '« Des tables qui tournent ? Dans mon pub, elles tournent aussi, à partir de onze heures. »'],
      o: ['« Les médiums, c’est l’escroquerie la plus rentable de Londres depuis la guerre. Toutes ces veuves… »'],
      fr: ['« Les tables tournantes ? Ma patronne y croyait. Elle a parlé à Napoléon, une fois. Il était aimable. »'] },
    { k: 'einstein', re: /\b(einstein|relativite|science|sciences|savants?|physique|atome|electricite)\b/,
      h: ['« Einstein a reçu le Nobel en novembre. On dit que l’espace se courbe. Je trouve que ça explique bien des choses. »'],
      p: ['« Les savants ? Ils ont inventé le gaz, aussi. »'],
      o: ['« La science, chez nous, c’est les empreintes digitales. Et ça suffit à remplir les prisons. »'],
      fr: ['« Les savants ? Madame Curie, voilà une femme. »'] },
    { k: 'cinema', re: /\b(cinema|film|films|chaplin|charlot|actualites|picture house|acteurs?|actrices?)\b/,
      h: ['« Le cinématographe ? Une distraction pour les foules. J’avoue un faible pour Chaplin. »'],
      p: ['« Charlot ! J’y vais le samedi, au Palladium. On rit, on oublie. »'],
      o: ['« Le cinéma, c’est là que les pickpockets travaillent le mieux. Dans le noir. »'],
      fr: ['« Au cinéma, j’ai vu Max Linder. On a ri. Puis il a fallu rentrer. »'] },
    { k: 'musique', re: /\b(jazz|danse|danser|dancing|foxtrot|tango|musique|orchestre|chanson)\b/,
      h: ['« Le jazz ? Des cuivres qui hurlent pour des jeunes filles qui fument. Enfin, c’est ce que dit ma sœur. Moi, j’aime assez. »', '« Il y a un orchestre américain au Savoy. On danse jusqu’à deux heures. La jeunesse rattrape la guerre. »'],
      p: ['« Le samedi, au dancing de Hammersmith, on danse le foxtrot jusqu’à minuit. »'],
      o: ['« La musique ? Les clubs de jazz de Soho, on les ferme une fois par mois. Ils rouvrent le lendemain. »'],
      fr: ['« Le jazz ? À Paris, les Américains en jouent partout. C’est gai, et un peu fou. »'] },
    { k: 'femmes', re: /\b(suffragettes?|vote des femmes|femmes? (qui )?votent|droit de vote|emancipation|garconne)\b/,
      h: ['« Les femmes votent depuis 1918, au-dessus de trente ans. Le pays ne s’est pas effondré. Pas encore. »'],
      p: ['« Les suffragettes ? Elles ont bien fait. Ma mère en était. »'],
      o: ['« J’en ai arrêté, des suffragettes, avant la guerre. Elles mordaient. »'],
      fr: ['« Chez nous, les femmes ne votent pas. Et on ne leur a pas demandé leur avis. »'] },
    { k: 'argent', re: /\b(prix|ca coute|cher|vie chere|chomage|chomeurs?|pauvres?|pauvrete|salaires?|greves?|loyer)\b/,
      h: ['« Tout coûte le double d’avant la guerre, et les chômeurs défilent sur l’Embankment. »'],
      p: ['« Une pinte, sept pence ! Avant la guerre, c’était trois. Et les gages, eux, n’ont pas doublé. »', '« Un million de chômeurs, qu’ils disent. Moi, je compte ceux de ma rue. »'],
      o: ['« Le chômage fait les voleurs. Les voleurs font mon travail. »'],
      fr: ['« La vie est chère, monsieur. Le franc ne vaut plus rien, et les pourboires non plus. »'] },
    { k: 'amerique', re: /\b(amerique|americains?|etats unis|new york|prohibition|harding|hollywood)\b/,
      h: ['« L’Amérique a interdit l’alcool. Le résultat est que tout le monde y boit davantage, et plus mal. »'],
      p: ['« L’Amérique ? Mon cousin y est parti. Il écrit qu’il est riche. Il ment, sûrement. »'],
      o: ['« La prohibition ? On en voit les effets jusqu’ici. Le whisky part en Amérique par bateaux entiers. »'],
      fr: ['« Les Américains ? Ils boivent en cachette et paient bien. Mes meilleurs clients. »'] },
    { k: 'sport', re: /\b(football|cricket|rugby|boxe|courses? de chevaux|derby|match|arsenal|chelsea football|tottenham|aviron)\b/,
      h: ['« Le cricket, {m}, est la seule chose qui tienne l’Empire ensemble. »'],
      p: ['« Arsenal ? Ils jouent comme des pieds, cette saison. »', '« La boxe, au Ring de Blackfriars. Le samedi soir. »'],
      o: ['« Le sport ? Le samedi, j’ai six bagarres à Highbury pour un match de football. Le cricket, au moins, ne se bat pas. »'],
      fr: ['« Le sport ? Georges Carpentier, voilà un boxeur. Enfin, avant qu’il perde. »'] },
    { k: 'londres', re: /\b(londres|london|la ville|la tamise|piccadilly|soho|whitechapel|east end|west end|city)\b/,
      h: ['« Londres est la plus grande ville du monde, et la plus seule. »'],
      p: ['« Londres ? On y naît, on y tousse, on y meurt. Je connais pas mieux. »'],
      o: ['« Huit millions d’âmes, et autant de raisons de mentir à la police. »'],
      fr: ['« Londres ? Grand, gris, et la cuisine… n’en parlons pas. »'] },
    { k: 'paris', re: /\b(paris|la france|francais|francaise|parisiens?)\b/,
      h: ['« Paris ? On y vit mieux et on y pense moins bien. »'],
      p: ['« Paris ? J’y suis jamais allé. Il paraît qu’on y boit du vin au petit déjeuner. »'],
      o: ['« La Sûreté parisienne ? Des gens compétents. Un peu bavards. »'],
      fr: ['« Paris ? C’est chez moi. On y rentre toujours. »'] },
    { k: 'dieu', re: /\b(dieu|eglise|bible|priere|prier|religion|pasteur|cure|messe|paradis|enfer|diable|satan)\b/,
      h: ['« Dieu ? Je L’ai cherché dans les textes anciens. J’ai trouvé d’autres noms, plus vieux que Lui. »', '« Je vais à l’église pour les mariages et les enterrements. Surtout les enterrements, ces temps-ci. »'],
      p: ['« Le bon Dieu ? Il a dû déménager pendant la guerre. »', '« Je vais à la messe le dimanche, quand mes jambes veulent bien. »'],
      o: ['« Dieu ne témoigne jamais. C’est bien dommage. »'],
      fr: ['« Dieu ? Je le prie quand le train déraille. Il m’a toujours écouté, jusqu’ici. »'] },
    { k: 'mort', re: /\b(la mort|mourir|mort|morts|cadavres?|tuer|assassinat|meurtre|tueur)\b/,
      h: ['« La mort est un sujet sérieux. Les journaux la traitent comme un feuilleton. »'],
      p: ['« Faut pas parler de ça, {m}. Ça porte malheur. »'],
      o: ['« La mort, c’est mon métier. Ce qui vient avant m’intéresse davantage. »'],
      fr: ['« La mort ? Sur cette ligne, on en a vu, monsieur. Des accidents. Et d’autres choses. »'] },
    { k: 'train', re: /\b(orient express|simplon|wagons? lits|compagnie internationale|chemin de fer|chemins de fer|locomotives?|gares?|voyager en train)\b/,
      h: ['« L’Orient-Express ? Trois jours de Londres à Constantinople, en dormant dans des draps brodés. La civilisation, sur des rails. »'],
      p: ['« Les grands trains de luxe ? J’en ai vu passer à Victoria. Les riches derrière les vitres, comme des poissons. »'],
      o: ['« Les trains de luxe, c’est là qu’on vole les bijoux. Et qu’on cache les fugitifs. »'],
      fr: ['« Le train ? C’est ma maison, monsieur. Plus que ma maison. »'] },
    { k: 'boisson', re: /\b(pub|pinte|biere|whisky|gin|cognac|vin|boire un verre|alcool|soif)\b/,
      h: ['« Un doigt de whisky, le soir. Pour le cœur, dit mon médecin. Il en prend deux. »'],
      p: ['« Une pinte, ça se refuse pas. Mais pas pendant le service, {m}. »'],
      o: ['« Je ne bois pas en service. Je bois après, et pas qu’un peu. »'],
      fr: ['« Un petit cognac ? C’est la maison qui offre. Enfin, la Compagnie. »'] },
    // la conversation de tous les jours : la soirée, le sommeil, les livres, la table, les voyages, la santé
    { k: 'soiree', re: /\b(belle soiree|bonne soiree|quelle soiree|drole de soiree|cette soiree|ce banquet|belle reception|beau monde|que de monde|quelle foule|belle nuit|quelle nuit|drole de nuit|belle journee|quelle journee)\b/,
      h: ['« Une soirée comme Londres sait en donner : trop de monde, trop peu d’air, et pas assez de vérité. »', '« On s’y fait. Regardez autour de vous : la moitié de ces gens voudrait être ailleurs, et l’autre moitié n’ose pas partir. »'],
      p: ['« Si vous le dites, {m}. Moi, j’attends surtout qu’elle finisse. »', '« On a vu pire. On a vu mieux aussi, remarquez. »'],
      o: ['« Pour nous, il n’y a pas de belle soirée, {m}. Il y a les soirs calmes, et les autres. »'],
      fr: ['« Une drôle de nuit, monsieur. Sur cette ligne, on finit par reconnaître celles qui ne se passeront pas comme les autres. »', '« La nuit sera longue. Elles le sont toutes, après Dijon. »'] },
    { k: 'sommeil', re: /\b(mal dormi|pas dormi|bien dormi|dormi|sommeil|insomnie|fatigue|fatiguee|epuise|epuisee|creve|crevee|cauchemars?|reves?|ereinte)\b/,
      h: ['« Le sommeil est un luxe que Londres ne m’accorde plus. Trois heures, les bonnes nuits. »', '« Vous avez mauvaise mine, en effet. Dormez. C’est le seul remède que je connaisse qui ne coûte rien. »'],
      p: ['« À qui le dites-vous. Avec ce brouillard, on ne sait même plus quand il fait nuit. »', '« Ma mère disait : qui dort mal a quelque chose sur la conscience. Elle dormait très bien, elle. »'],
      o: ['« Dormir ? J’ai essayé une fois, en 1919. »', '« On dort quand le dossier est clos, {m}. »'],
      fr: ['« On dort mal dans les trains, monsieur. Ceux qui dorment trop bien, je m’en méfie. »', '« À mon âge, on ne dort plus, on patiente. »'] },
    { k: 'lecture', re: /\b(vous lisez|lisez vous|tu lis|lis tu|aimez lire|la lecture|vos lectures|un bon livre|des romans|romans policiers|sherlock holmes|conan doyle|dickens|la litterature|poesie)\b/,
      h: ['« Je lis tout, et je crois peu. Les romans de M. Conan Doyle me reposent : au moins, là, les mystères ont une fin. »', '« Trop. Mes yeux ne me le pardonnent pas. »'],
      p: ['« Le journal, {m}, quand on me le laisse. Et encore, je commence par la fin. »', '« Lire ? Avec quelles heures ? »'],
      o: ['« Des rapports, {m}. Mal écrits, pour la plupart. »', '« Sherlock Holmes ? Dans les livres, les témoins disent la vérité. »'],
      fr: ['« Des feuilletons, monsieur, entre deux gares. Je ne connais jamais la fin : on me les vole. »', '« Je lis les cartes. C’est plus court, et ça finit toujours mal. »'] },
    { k: 'table', re: /\b(vous avez faim|j ai faim|bien mange|bon repas|la cuisine anglaise|la cuisine francaise|le diner|ce diner|le dejeuner|le menu|bonne table|bon restaurant)\b/,
      h: ['« La cuisine anglaise est une pénitence que nous nous infligeons par patriotisme. »', '« On dîne mal partout à Londres, sauf chez les gens qui ont un cuisinier français. »'],
      p: ['« Une tourte et une pinte, {m}. Le reste, c’est pour les messieurs. »', '« On mange ce qu’il y a. Depuis la guerre, il y a moins. »'],
      o: ['« Un sandwich au bureau. Celui d’hier, en général. »'],
      fr: ['« La carte du wagon-restaurant est la meilleure d’Europe, monsieur. Enfin, jusqu’à la frontière. »', '« Je picore. À mon âge, on ne dîne plus, on goûte. »'] },
    { k: 'voyages', re: /\b(vous voyagez|voyagez vous|aimez voyager|les voyages|deja voyage|a l etranger|pays lointains|bout du monde|vu du pays)\b/,
      h: ['« J’ai beaucoup voyagé, jeune. Maintenant, je fais venir le monde à moi, par la poste. »', '« Les voyages forment la jeunesse et ruinent les vieillards. »'],
      p: ['« Margate, une fois, {m}. Il a plu. »', '« Moi ? Jamais plus loin que le terminus de l’omnibus. »'],
      o: ['« Le service m’a emmené en France, de 1915 à 1918. Ça m’a suffi comme voyage. »'],
      fr: ['« Je ne fais que ça, monsieur. Toujours la même ligne, jamais le même train. »', '« J’ai fait trois fois le tour du monde. On y trouve partout les mêmes veuves. »'] },
    { k: 'sante', re: /\b(votre sante|la sante|vous portez bien|vous allez bien|comment vous sentez vous|vous avez l air (fatigue|fatiguee|malade|pale|soucieux|soucieuse|inquiet|inquiete|triste)|quelque chose ne va pas|ca ne va pas)\b/,
      h: ['« Je me porte comme un homme de mon âge qui a trop de choses en tête. Merci de le demander. »', '« Assez bien pour m’en plaindre, ce qui est bon signe. »'],
      p: ['« On fait aller, {m}. On fait aller. »', '« Tant qu’on tient debout, on ne se plaint pas. »'],
      o: ['« En état de marche. »', '« Je vais bien quand Londres va bien. Tirez-en vos conclusions. »'],
      fr: ['« On fait aller, monsieur. C’est gentil de demander : sur cette ligne, on ne nous demande que l’heure. »', '« Je vais comme une femme qui a enterré tout son monde. Très bien, donc. »'] },
    { k: 'tabac', re: /\b(cigarettes?|tabac|pipe|cigares?|fumer|fumez)\b/,
      h: ['« La pipe éclaircit les idées. Ou du moins les enfume agréablement. »'],
      p: ['« Une Woodbine ? J’en ai une, si vous voulez. La dernière. »'],
      o: ['« Une cigarette ? Volontiers. Ça m’empêche de dire ce que je pense. »'],
      fr: ['« Fumer ? Dans le wagon-restaurant, c’est permis après le café seulement. »'] }
  ];
  var H = { day: function (api) { return Math.floor((api.s.min || 0) / 1440); } };
  // ce qu'on répond à quelqu'un qui avoue une violence
  var AVEU_JE = /\b(j ai|j avais|je l ai|je lui ai|je les ai|je l avais|je voulais|j allais)\b/;
  var AVEU_ACTE = /\b(tue|tuer|etrangl\w*|frapp\w*|cogn\w*|assomm\w*|poignard\w*|gifl\w*|tabass\w*|agress\w*|battu|attaqu\w*|blesse\w*|egorg\w*|empoisonn\w*|coups? de (poing|couteau|pied|tete)|saute dessus|saute a la gorge|tire dessus)\b/;
  var AVEU = {
    o: ['« Répétez-moi ça. » Il a posé son crayon. « Lentement. Et pesez chaque mot : je note tout. »', '« Au moins, vous ne niez pas. » Il écrit une ligne dans votre dossier. « La franchise ne vous évitera pas le juge. Mais elle m’évite du travail. »', '« Vous le dites comme on donne l’heure. C’est ce qui m’inquiète le plus, chez vous. »'],
    h: ['Un silence. « Vous dites cela avec un calme qui ne me rassure pas. Pourquoi me le raconter, à moi ? »', '« J’aurais préféré ne pas l’entendre. » Une main cherche le dossier d’une chaise.', '« Et vous me le confiez comme une anecdote. Je ne sais pas ce qui m’effraie le plus : le geste, ou le ton. »'],
    p: ['« Vous… vous avez fait quoi ? » Un pas en arrière. « Faut pas me raconter ça à moi, {m}. »', '« Je veux pas le savoir. J’ai rien entendu, {m}. Rien du tout. »', '« Ben dites donc. Et vous êtes là, tranquille, à me le dire. »'],
    fr: ['« On ne plaisante pas avec ces choses-là, monsieur. Pas dans un train de nuit. »', '« Je n’ai rien entendu. Et vous feriez bien de ne pas le répéter. »', '« Monsieur… Ce sont des choses qu’on avoue à un prêtre, ou à un juge. Pas à moi. »']
  };
  var RECIT = {
    o: ['« C’est votre version. Je la note. On verra ce qu’en disent les autres. »', '« Tout le monde a une bonne raison, {m}. Les cellules en sont pleines. »', '« Continuez. Les gens qui racontent finissent toujours par en dire trop. »'],
    h: ['« Je vous écoute. Continuez, si cela vous soulage. »', '« Je vois. Et que voulez-vous que j’en fasse ? »', '« Voilà qui éclaire certaines choses. Pas toutes. »'],
    p: ['« Ah. Ben, si vous le dites, {m}. »', '« Ça, c’est vos affaires. Moi, j’y étais pas. »', '« Eh bien. On en apprend, à vous écouter. »'],
    fr: ['« Si vous le dites, monsieur. Je n’y étais pas. »', '« Je vous crois sur parole. C’est plus prudent. »', '« On entend de tout, dans un train de nuit. »']
  };
  function classe(f) { var g = f.groupe || 'peuple'; return f.fr ? 'fr' : /police/.test(g) ? 'o' : /savant|diplomate|mondain|occultiste|hotel|domestique/.test(g) ? 'h' : 'p'; }

  // ---------------------------------------------------------------- composer une réponse
  function mem(api, id) { var m = api.flag('pm:' + id); if (!m) { m = { n: {}, last: null }; } return m; }
  function saveMem(api, id, m) { api.flag('pm:' + id, m); }
  function val(api, v, k) { if (typeof v === 'function') v = v(api); if (Array.isArray(v)) return api.fresh(k, v); return v; }
  function voice(f) { var HU = G.RPG && G.RPG.Humeur; return V[f.reg] || V[HU && HU.REG[f.reg]] || V.populaire; }
  // ce mot vient-il d'être dit, par ce personnage ou par le récit, dans les dernières répliques ?
  function ditRecemment(api, id, nom) {
    var mots = N(nom).split(' ').filter(function (w) { return w.length >= 5; }).map(function (w) { return w.replace(/(es|s|x)$/, ''); });
    if (!mots.length) return false;
    var log = (api.s && api.s.log) || [], vus = 0;
    for (var i = log.length - 1; i >= 0 && vus < 14; i--) {
      var e = log[i]; if (e.t === 'player' || e.t === 'ask' || e.t === 'chips' || typeof e.x !== 'string') continue; vus++;
      if ((e.t === 'npc' && e.who === id) || e.t === 'narr' || e.t === 'event' || e.t === 'doc') {
        var t = ' ' + N(e.x) + ' ';
        if (mots.some(function (w) { return t.indexOf(' ' + w) >= 0; })) return true;
      }
    }
    return false;
  }
  function fill(s, a, X, W, Aw) {
    return String(s).replace(/\{X\}/g, cap(X || '')).replace(/\{x\}/g, X || '').replace(/\{de\}/g, de(X || '')).replace(/\{W\}/g, W || '').replace(/\{A\}/g, Aw || '');
  }
  // un tic en ouverture, une digression, une question renvoyée
  var LOW = /^(Je|J’|J'|Le|La|Les|L’|Un|Une|Il|Elle|Ils|Elles|Nous|Vous|On|Ce|C’|Ça|Cela|Mon|Ma|Mes|Votre|Vos|Notre|Pas|Trop|Assez|Toujours|Jamais|Rien|Personne|Tout|Tous|Depuis|Quand|Si|Mais|Et|Oh|Ah|De|Du|Des|Dans|En|Au|Aux|Pour|Moi|Lui|Quarante|Trente|Vingt|Cinquante|Soixante|Deux|Trois|Une)$/;
  function habille(api, f, id, line, a, offTopic) {
    var out = line;
    var w1 = (out.match(/^« ([A-Za-zÀ-ÿ’']+)/) || [])[1];
    if (f.tics && f.tics.length && w1 && isLow(w1) && api.rand() < 0.22) {
      var tic = api.fresh('tic:' + id, f.tics), core = tic.replace(/[,:.!]\s*$/, '').replace(/\{m\}/g, '');
      var ADDR = /(\{m\}|monsieur|madame|mon ami|mon cher|signore|docteur|mon petit)/i;
      // après « Voyons. » la phrase repart avec sa majuscule ; après « Remarquez, » elle continue en minuscule
      if (out.toLowerCase().indexOf(core.toLowerCase()) < 0 && !(ADDR.test(tic) && ADDR.test(out))) out = '« ' + tic + ' ' + (/[.!?…]\s*$/.test(tic) ? out.charAt(2) : out.charAt(2).toLowerCase()) + out.slice(3);
    }
    if (offTopic && f.dada && f.dada.length && api.rand() < 0.2) { var dd = api.fresh('dada:' + id, f.dada); out = / »$/.test(out) ? out.replace(/ »$/, ' ' + dd + ' »') : out + ' « ' + dd + ' »'; }
    return out;
  }
  function relance(api, f, id, m) {
    if (!f.relances || !f.relances.length || api.rand() > 0.28) return;
    var free = f.relances.filter(function (r, i) { return !m.n['rel' + i]; });
    if (!free.length) return;
    var r = free[Math.floor(api.rand() * free.length)], i = f.relances.indexOf(r);
    m.n['rel' + i] = 1; m.pending = i; m.pendingTour = api.s.turn;
    api.npc(id, r.q);
  }
  // cherche dans la fiche une réplique où revient un mot de la question
  function stemRe(w) { var s = w.length > 6 ? w.replace(/(es|s|x|e)$/, '') : w.replace(/(s|x)$/, ''); return new RegExp('\\b' + s.replace(/[^a-z0-9]/g, '') + '(s|x|e|es|ent|er)?\\b'); }
  function inFiche(api, f, words, unk) {
    if (!words || !words.length) return null;
    var cands = [];
    function add(k, v) { try { if (typeof v === 'function') v = v(api); } catch (e) { v = null; } if (!v) return; (Array.isArray(v) ? v : [v]).forEach(function (x) { if (typeof x === 'string') cands.push({ k: k, line: x, n: ' ' + N(x) + ' ' }); }); }
    Object.keys(f.moi || {}).forEach(function (k) { if (k !== 'defaut') add('moi:' + k, f.moi[k]); });
    Object.keys(f.sait || {}).forEach(function (k) { add('sait:' + k, f.sait[k]); });
    var best = null, unkN = (unk || []).map(N);
    cands.forEach(function (c) {
      var sc = 0;
      words.forEach(function (w) {
        var re = stemRe(w); if (!re.test(c.n)) return;
        var spread = cands.filter(function (o) { return re.test(o.n); }).length;
        sc += (spread <= 1 ? 1.5 : spread <= 3 ? 1 : 0.4) + (w.length >= 7 ? 0.5 : 0) + (unkN.indexOf(w) >= 0 ? 0.5 : 0);
      });
      if (sc > 0 && (!best || sc > best.score)) best = { k: c.k, line: c.line, score: sc };
    });
    return best && best.score >= 1 ? best : null;
  }
  // retrouve une entrée de fiche par sa clé (moi:x, sait:X, avis:X)
  function lookup(api, f, key) {
    var p = String(key).split(':'), v = p[0] === 'moi' ? f.moi && f.moi[p[1]] : p[0] === 'sait' ? f.sait && f.sait[p[1]] : f.avis && f.avis[p[1]];
    try { if (typeof v === 'function') v = v(api); } catch (e) { v = null; }
    return v;
  }
  // « Rigby ? Bon sergent. » → « bon sergent. » quand on l'enchaîne après « Quant à Rigby : »
  function quantA(l) { l = String(l); return /^le /.test(l) ? 'Quant au ' + l.slice(3) : /^les /.test(l) ? 'Quant aux ' + l.slice(4) : 'Quant à ' + l; }
  function stripName(s) { return String(s).replace(/^[^?»]{1,40}\? /, ''); }
  function make(scene) {
    function npcLine(api, id, x) { api.npc(id, x); }
    scene.checks = scene.checks || {};
    scene.checks.parole_baratin = { skill: 'Baratin', why: 'qu’on vous croie', push: 'Insister, en rajouter (jet forcé)', resolve: function (api, r) {
      var id = api.s.talk; if (!id) return;
      var f = (scene.fiches || {})[id] || {}, m = mem(api, id), st = api.npcs(id), lie = m.lie; if (!lie) return;
      var Vx = voice(f);
      if (r.success) {
        m.claim = lie.claim; m.cru = true;
        var rl = lie.role && f.roles && f.roles[lie.role];
        api.npc(id, val(api, rl || f.croire || ['« ' + cap(lie.claim) + ' ? Je ne l’aurais pas deviné. »', '« ' + cap(lie.claim) + '. Bien. Que puis-je pour vous ? »'], 'cru:' + id));
        if (!rl) api.calm(id, 1);
        if (lie.role === 'police' && !/police/.test(f.groupe)) api.flag('usurpe', { qui: scene.npcs[id] ? scene.npcs[id].name : id, min: api.s.min, cru: true });
      } else if (!r.pushed && r.level > 0 && scene.checks.parole_baratin.push) {
        // premier échec : on hésite, on vous regarde de travers ; vous pouvez encore en rajouter
        api.npc(id, val(api, ['« ' + cap(lie.claim) + ', vous dites ? » On vous dévisage, sans répondre tout de suite.', 'Un silence un peu trop long. On n’a pas l’air convaincu.'], 'doute:' + id));
        saveMem(api, id, m); return;
      } else {
        m.menteur = true; st.patience -= r.pushed ? 6 : 2;
        if (lie.role === 'police' && /police/.test(f.groupe)) { api.npc(id, '« ' + cap(lie.claim) + ' ? Alors montrez-moi votre carte. » Un temps. « C’est bien ce que je pensais. Usurper la qualité d’officier de police, c’est un délit. Ne refaites jamais ça. »'); api.flag('usurpeVu', true); }
        else api.npc(id, val(api, f.pasCru || ['« ' + cap(lie.claim) + ', vraiment ? » On vous regarde de haut en bas. On n’y croit pas une seconde.', '« Vous, ' + lie.claim + ' ? » Un petit rire sans joie. « Et moi, je suis la reine de Saba. »'], 'pascru:' + id));
      }
      m.lie = null; saveMem(api, id, m);
      if (st.patience <= 0 && api.close) api.close(id);
    } };

    // ---------------------------------------------------------------- l'humeur : ne pas comprendre, s'agacer, se taire, sévir
    // chaque personnage a son caractère (humeur.js) : il ne comprend pas, cherche une raison, conclut que vous perdez la tête,
    // s'agace, puis passe à l'acte ; les plus faibles se taisent, menacent de prévenir quelqu'un, et le font.
    var SEUIL = { calme: [0, 2, 4, 6, 8], normal: [0, 1, 3, 5, 6], vif: [0, 1, 2, 3, 4] }, RATE = { calme: 0.75, normal: 1, vif: 1.5 };
    function HUM() { return G.RPG && G.RPG.Humeur; }
    function caractere(id, f) {
      var T = (HUM().T || {})[id] || {}, k = T.kind || (/police/.test(f.groupe || '') ? 'police' : /domestique|fievreux/.test(f.reg) ? 'faible' : 'froid');
      return { id: id, kind: k, vite: T.vite || (k === 'police' || f.reg === 'sec' ? 'vif' : 'normal'), sup: T.sup || null, police: !!T.police, f: !!T.f, coup: T.coup || null, T: T };
    }
    function registre(f) { var Hm = HUM(); return Hm.L.bz[f.reg] ? f.reg : (Hm.REG[f.reg] || 'populaire'); }
    function pron(c, x) {
      var n = scene.npcs[c.id] || {}, nom = n.short || n.name || 'On';
      return String(x).replace(/\{PIl\}/g, c.f ? 'Elle' : 'Il').replace(/\{Pil\}/g, c.f ? 'elle' : 'il').replace(/\{Pe\}/g, c.f ? 'e' : '')
        .replace(/\{N\}/g, cap(nom)).replace(/\{sup\}/g, c.sup || 'quelqu’un')
        .replace(/(^|\s)à le /g, '$1au ').replace(/(^|\s)à les /g, '$1aux ').replace(/(^|\s)de le /g, '$1du ').replace(/(^|\s)de les /g, '$1des ');
    }
    // jamais deux fois la même réplique pour un même personnage ; on préfère aussi ce qu'aucun autre n'a dit récemment
    function hsh(x) { var h = 5381; for (var i = 0; i < x.length; i++) h = ((h << 5) + h + x.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
    function restant(m, tiers) { var used = m.u || []; return tiers.some(function (a) { return a && a.some(function (x) { return used.indexOf(hsh(x)) < 0; }); }); }
    function uniq(api, m, tiers, rienPlutot) {
      var used = m.u || (m.u = []), recent = api.flag('hu:recent') || [];
      for (var t = 0; t < tiers.length; t++) {
        var arr = tiers[t]; if (!arr || !arr.length) continue;
        var free = arr.filter(function (x) { return used.indexOf(hsh(x)) < 0; });
        if (!free.length) continue;
        var pool = free.filter(function (x) { return recent.indexOf(hsh(x)) < 0; }); if (!pool.length) pool = free;
        var x = pool[Math.floor(api.rand() * pool.length)], h = hsh(x);
        used.push(h); recent.push(h); if (recent.length > 40) recent.splice(0, recent.length - 40); api.flag('hu:recent', recent);
        return x;
      }
      // tout a été dit : on recommence, sans redire la toute dernière (ou l'on se tait, pour un geste)
      if (rienPlutot) return null;
      var all = []; tiers.forEach(function (a) { if (a) all = all.concat(a); }); if (!all.length) return '…';
      var lastH = used[used.length - 1], cand = all.filter(function (x) { return hsh(x) !== lastH; }); if (!cand.length) cand = all;
      var y = cand[Math.floor(api.rand() * cand.length)];
      all.forEach(function (x) { var i = used.indexOf(hsh(x)); if (i >= 0) used.splice(i, 1); }); used.push(hsh(y));
      return y;
    }
    function seuil(m, c, n) { var sl = SEUIL[c.vite] || SEUIL.normal; return sl[Math.min(n, sl.length - 1)] + 1 - ((m.ins || 0) > 0 ? 1 : 0); }
    function niveau(m, c) { var sl = SEUIL[c.vite] || SEUIL.normal, v = (m.bz || 0) - 1 + ((m.ins || 0) > 0 ? 1 : 0), n = 0; for (var i = 0; i < sl.length; i++) if (v >= sl[i]) n = i; return n; }
    function niveauIns(m, c) { var v = (m.ins || 0) + Math.floor((m.jur || 0) / 2) + ((m.bz || 0) >= 3 ? 1 : 0) - 1; return Math.max(0, Math.min(3, Math.floor(Math.max(0, v) * (RATE[c.vite] || 1)))); }
    function garder(st) { if (st.patience < 2) st.patience = 2; }
    function rafraichir(api, m) {
      var d = H.day(api);
      if (m.rompu && api.s.min >= m.rompu) { m.rompu = null; m.bz = 0; m.ins = Math.max(0, (m.ins || 0) - 2); m.jur = 0; m.sil = 0; m.nana = 0; m.supDit = 0; m.insN = undefined; }
      if (m.hj !== d) { if (m.hj !== undefined) { m.ins = Math.max(0, (m.ins || 0) - 1); m.bz = 0; m.jur = 0; m.insN = m.ins ? 0 : undefined; } m.hj = d; }
    }
    function delai(k) { var hm = scene.humeur || {}; return (hm.cd || {})[k] || ({ bz: 90, ins: 240 })[k]; }
    function rompre(api, id, m, st, mins, line) {
      if (line) npcLine(api, id, line);
      st.closedUntil = api.s.min + mins; st.patience = 0; st.refuse = 0;
      m.rompu = api.s.min + mins; m.sil = 0; saveMem(api, id, m);
      if (api.s.talk === id) api.endTalk(false);
    }
    // un coup de poing, avec une chance de l'esquiver
    function coup(api, id, c) {
      var k = c.coup || {}, pc = api.s.pc, esq = pc.skills && pc.skills['Esquive'] !== undefined ? pc.skills['Esquive'] : Math.floor(((pc.carac && pc.carac.DEX) || 50) / 2);
      var r = 1 + Math.floor(api.rand() * 100);
      npcLine(api, id, pron(c, k.txt || '{N} ne dit plus rien. Le poing part.'));
      if (r <= esq) { api.say('Vous esquivez de justesse (Esquive ' + esq + ' : ' + r + ', réussite).'); return; }
      var dmg = Math.min(Math.max(0, pc.pv - 1), 1 + Math.floor(api.rand() * (k.deg || 3)));
      api.say('Le coup vous atteint (Esquive ' + esq + ' : ' + r + ', échec).' + (dmg ? '' : ' Plus de peur que de mal.'));
      if (dmg) { api.hp(-dmg); if (api.fx) api.fx('shudder'); }
    }
    // au bout de la patience
    function fin(api, id, m, st, c, piste) {
      var Hm = HUM(), F = Hm.L.fin[c.kind] || Hm.L.fin.froid, own = (c.T.fin || {})[piste], hook = scene.humeur || {};
      if (c.kind === 'faible') {
        rompre(api, id, m, st, delai('ins'), pron(c, uniq(api, m, [own, c.sup ? F.sup : F.seul])));
        if (c.sup && hook.plainte) hook.plainte(api, id, c);
        return;
      }
      var line = pron(c, uniq(api, m, [own, F[piste] || F.bz]));
      if (piste === 'ins' && c.kind === 'police') { rompre(api, id, m, st, delai('ins'), line); if (hook.arreter) hook.arreter(api, id, c); return; }
      if (piste === 'ins' && c.kind === 'fort') { coup(api, id, c); if (api.s.ended) return; rompre(api, id, m, st, delai('ins'), line); return; }
      rompre(api, id, m, st, delai(piste), line);
      if (piste === 'ins' && c.kind === 'appel' && c.police && hook.plainte) hook.plainte(api, id, c);
    }
    // les faibles se taisent ; s'ils menacent de prévenir quelqu'un, c'est à la troisième fois ; à la cinquième, ils le font
    function silence(api, id, m, st, c, grave) {
      var Hm = HUM(); garder(st);
      if (!m.sil) { m.sil = 1; npcLine(api, id, pron(c, uniq(api, m, [Hm.L.silDebut]))); saveMem(api, id, m); return true; }
      if (grave) m.sil += grave === 2 && m.supDit ? 2 : 1;
      if (m.sil >= 5) { fin(api, id, m, st, c, 'ins'); return true; }
      if (m.sil >= 3 && c.sup && !m.supDit) { m.supDit = 1; npcLine(api, id, pron(c, uniq(api, m, [Hm.L.supMenace]))); saveMem(api, id, m); return true; }
      if (!restant(m, [Hm.L.ignore])) { fin(api, id, m, st, c, 'ins'); return true; }
      npcLine(api, id, pron(c, uniq(api, m, [Hm.L.ignore])));
      saveMem(api, id, m); return true;
    }
    // l'incompréhension, de plus en plus agacée
    function bizarre(api, id, f, a, m, st, c, kind, flou) {
      var Hm = HUM(), R = registre(f), Vx = voice(f);
      m.bz = (m.bz || 0) + 1; garder(st);
      if (m.sil) return silence(api, id, m, st, c, true);
      var n = niveau(m, c);
      // tout ce qu'on avait à dire à ce stade a été dit : l'agacement monte d'un cran, on ne se répète pas
      while (n < 4 && !restant(m, [c.T.bz && c.T.bz[n], Hm.L.bz[R][n]])) { n++; m.bz = Math.max(m.bz, seuil(m, c, n)); }
      if (c.kind === 'faible' && n >= 3) return silence(api, id, m, st, c, true);
      if (n >= 4) { fin(api, id, m, st, c, 'bz'); return true; }
      var parole;
      if (kind === 'mot' && n === 0 && a.unk[0] && restant(m, [Vx.mot])) parole = fill(uniq(api, m, [Vx.mot]), a, null, a.unk[0]);
      else if (kind === 'flou' && n <= 1 && flou) parole = flou;
      else parole = uniq(api, m, [c.T.bz && c.T.bz[n], Hm.L.bz[R][n]]);
      var g = null;
      if (n <= 2 && kind !== 'flou' && api.rand() < 0.6) g = uniq(api, m, [Hm.L.geste[Math.min(n, 1)]], true);
      else if (n === 3 && api.rand() < 0.5) g = uniq(api, m, [Hm.L.geste[2]], true);
      npcLine(api, id, pron(c, (g ? g + ' ' : '') + parole));
      saveMem(api, id, m); return true;
    }
    // les insultes, les jurons, les menaces : on calme le jeu, on avertit, on menace, on sévit
    function insulte(api, id, f, a, m, st, c) {
      var Hm = HUM(), R = registre(f), own = c.T.ins || [];
      if (a.menace) m.ins = (m.ins || 0) + (c.kind === 'police' ? 3 : 2); else if (a.insulte) m.ins = (m.ins || 0) + 1; else m.jur = (m.jur || 0) + 1;
      garder(st);
      // on ne saute pas d'étape : on calme, on avertit, on menace, puis on sévit (une vraie menace de mort va droit à la riposte)
      var n = Math.min(niveauIns(m, c), (m.insN === undefined ? -1 : m.insN) + 1), line;
      if (a.menace && /police|fort/.test(c.kind)) n = Math.max(n, 2);
      m.insN = n;
      if (c.kind === 'faible') {
        if (m.sil && n >= 3) { fin(api, id, m, st, c, 'ins'); return true; }
        if (m.sil || n >= 2) return silence(api, id, m, st, c, true);
        if (a.menace) line = uniq(api, m, [Hm.L.contre.faible]);
        else line = uniq(api, m, n === 0 ? [own[0], Hm.L.ins[R][0]] : [c.sup ? Hm.L.menace.faible : null, own[1], Hm.L.ins[R][1]]);
        if (n >= 1 && c.sup && !a.menace) m.supDit = 1;
        npcLine(api, id, pron(c, line)); saveMem(api, id, m); return true;
      }
      while (n < 3 && !a.menace && !restant(m, n === 2 ? [Hm.L.menace[c.kind] || Hm.L.menace.froid] : [own[n], Hm.L.ins[R][n]])) { n++; m.insN = n; }
      if (n >= 3) { fin(api, id, m, st, c, 'ins'); return true; }
      if (a.menace) line = uniq(api, m, [Hm.L.contre[c.kind] || Hm.L.contre.froid]);
      else if (n === 2) line = uniq(api, m, [Hm.L.menace[c.kind] || Hm.L.menace.froid]);
      else line = uniq(api, m, [own[n], Hm.L.ins[R][n]]);
      npcLine(api, id, pron(c, line)); saveMem(api, id, m); return true;
    }
    // un mot d'un autre siècle : on le répète, on s'en méfie, puis on vous croit fou
    function anachro(api, id, f, a, m, st, c) {
      var Hm = HUM(), R = registre(f);
      m.nana = (m.nana || 0) + 1; m.bz = (m.bz || 0) + 1; garder(st);
      if (m.sil) return silence(api, id, m, st, c, true);
      var n = niveau(m, c);
      if (c.kind === 'faible' && n >= 3) return silence(api, id, m, st, c, true);
      if (n >= 4) { fin(api, id, m, st, c, 'bz'); return true; }
      var line;
      if (a.futur) { var cl = f.reg === 'fievreux' ? 'f' : /formel|savant|mondain|soutenu/.test(f.reg) ? 'h' : 'p'; line = n >= 3 ? uniq(api, m, [Hm.L.bz[R][3]]) : uniq(api, m, [Hm.L.futur[cl]]); }
      else {
        var tier = Math.max(m.nana <= 1 ? 0 : m.nana === 2 ? 1 : 2, Math.min(n, 2)), A = Hm.L.ana[R], tiers = [c.T.ana && m.nana <= 2 ? c.T.ana : null], i;
        for (i = tier; i < 3; i++) tiers.push(A[i]);
        for (i = tier - 1; i >= 0; i--) tiers.push(A[i]);
        if (!restant(m, tiers)) return bizarre(api, id, f, a, m, st, c, 'ana');
        line = uniq(api, m, tiers);
      }
      var g0 = n <= 1 && api.rand() < 0.4 ? uniq(api, m, [Hm.L.geste[0]], true) : null, g = g0 ? g0 + ' ' : '';
      npcLine(api, id, pron(c, g + line).replace(/\{A\}/g, a.anaW));
      saveMem(api, id, m); return true;
    }
    // un compliment sincère peut gagner quelqu'un : jet de Charme ; réussi, il vous a à la bonne pour la journée (dé bonus aux jets sociaux)
    scene.checks.parole_charme = { skill: 'Charme', why: 'qu’on vous prenne en sympathie', resolve: function (api, r) {
      var id = api.s.talk; if (!id || !HUM()) return;
      var f = (scene.fiches || {})[id] || {}, m = mem(api, id), st = api.npcs(id), c = caractere(id, f), Hm = HUM(), R = registre(f);
      if (r.success) {
        m.charme = H.day(api); m.ins = 0; m.insN = undefined; m.jur = 0; m.bz = 0;
        st.patience = Math.min((scene.npcs[id] || {}).patience || 6, st.patience + 2);
        npcLine(api, id, pron(c, uniq(api, m, [f.charmeOk, Hm.L.charmeOk[R]])));
      } else npcLine(api, id, pron(c, uniq(api, m, [f.charmeKo, Hm.L.charmeKo[R]])));
      humeurDrapeau(api, id, m);
      saveMem(api, id, m);
    } };
    // l'humeur que le moteur lit pour les jets sociaux : +1 on vous a à la bonne, -1 on vous en veut
    function humeurDrapeau(api, id, m) { api.flag('humeur:' + id, (m.ins || 0) > 0 ? -1 : m.charme === H.day(api) ? 1 : 0); }
    function compliment(api, id, f, a, m, st, c) {
      var Hm = HUM(), R = registre(f), d = H.day(api);
      if ((m.ins || 0) > 0) { npcLine(api, id, uniq(api, m, [Hm.L.flatRancune[R]])); saveMem(api, id, m); return true; }
      if (m.charme === d) { npcLine(api, id, uniq(api, m, [Hm.L.charmeDeja[R]])); saveMem(api, id, m); return true; }
      if (m.flatJour === d) { m.bz = (m.bz || 0) + 1; npcLine(api, id, uniq(api, m, [Hm.L.flatTrop[R]])); saveMem(api, id, m); return true; }
      var ck = scene.checks.parole_charme;
      if (!ck || !api.check) return false;
      m.flatJour = d; saveMem(api, id, m);
      ck.why = 'qu’' + (c.f ? 'elle' : 'il') + ' vous prenne en sympathie';
      api.check('parole_charme', { diff: (f.mefiant || 0) >= 0.6 || /police/.test(f.groupe || '') ? 'difficile' : 'normal' });
      return true;
    }
    function converse(api, npc, p) {
      var f = (scene.fiches || {})[npc.id]; if (!f) return false;
      var id = npc.id, m = mem(api, id), a = analyse(api, npc, p, m, f, scene), Vx = voice(f), st = api.npcs(id);
      var label = function (cid) { return (f.noms && f.noms[cid]) || api.label(cid); };
      // le nom tel que le joueur l'a dit : s'il a écrit « la bibliothèque », on ne lui répond pas « le British Museum ? »
      var nomDit = function (cid) {
        var lb = label(cid), n = (p.nouns || []).filter(function (x) { return x.id === cid; })[0];
        var w = n && n.pos >= 0 ? (p.text || '').split(' ')[n.pos] : null;
        if (!w || w.length < 3 || (' ' + N(lb) + ' ').indexOf(w.slice(0, Math.max(4, w.length - 2))) >= 0) return lb;
        var mots = String(p.raw || '').match(/[A-Za-zÀ-ÿœŒ]+/g) || [], i = -1;
        for (var k = 0; k < mots.length; k++) if (N(mots[k]) === w) { i = k; break; }
        if (i < 0) return lb; // le mot vient d'une tournure (« scotland yard ») : le nom du jeu convient
        var mot = mots[i], det = i > 0 ? N(mots[i - 1]) : '';
        if (/^[A-ZÀ-Ý]/.test(mot) && i > 0) return mot; // un nom propre
        var D = { le: 'le ', la: 'la ', les: 'les ', l: 'l’', un: 'le ', une: 'la ', des: 'les ', du: 'le ', au: 'le ', aux: 'les ', ce: 'ce ', cet: 'cet ', cette: 'cette ', ces: 'ces ', mon: 'votre ', ma: 'votre ', mes: 'vos ', votre: null, vos: null };
        if (D[det] === null) return lb;
        if (D[det] && /^[aeiouyhàâéèêîôû]/i.test(mot) && /^(le |la )$/.test(D[det])) return 'l’' + mot.toLowerCase();
        return (D[det] || '') + mot.toLowerCase();
      };
      var said = false;
      function say(x, off) { npcLine(api, id, habille(api, f, id, x, a, off)); said = true; m.lastTurn = api.s.turn; }
      function count(k) { m.n[k] = (m.n[k] || 0) + 1; return m.n[k]; }
      // 1. l'état du joueur, une fois par jour : on remarque le sang, la folie, le déguisement
      var d = H.day(api);
      if (m.etatJour !== d) {
        var pc = api.s.pc, rem = null;
        if (pc.pv <= pc.pvMax / 2) rem = f.etat && f.etat.blesse || '« Vous saignez, {m}. Vous devriez voir un médecin. »';
        else if (api.sanState && api.sanState() >= 2) rem = f.etat && f.etat.fou || '« Vous avez une mine affreuse, {m}. Vous dormez, au moins ? »';
        else if (api.flag('deguise')) rem = f.etat && f.etat.deguise || '« Je ne vous avais pas reconnu, avec ce manteau. »';
        if (rem && api.rand() < 0.7) { m.etatJour = d; npcLine(api, id, rem); }
        else m.etatJour = d;
      }
      // la rumeur d'une usurpation remonte jusqu'à la police
      var us = api.flag('usurpe');
      if (us && /police/.test(f.groupe) && !api.flag('usurpeVu') && us.qui !== npc.name && api.s.min - us.min >= 60) {
        api.flag('usurpeVu', true); st.patience -= 2;
        npcLine(api, id, val(api, f.usurpe || ['« Avant toute chose. Quelqu’un se fait passer pour un policier auprès de mes témoins, ces jours-ci. Le signalement vous ressemble beaucoup. Si ça se reproduit, ce sera le poste, et pas pour un thé. »'], 'usurpe:' + id));
      }
      // le tutoiement, relevé une fois
      if (a.tu && !m.tu) { m.tu = 1; npcLine(api, id, val(api, f.tu || TU[f.reg] || TU.populaire, 'tu:' + id)); if (/formel|mondain|sec/.test(f.reg)) st.patience -= 1; }
      // 2. réponse à une question que le PNJ avait posée
      if (m.pending !== undefined && m.pending !== null && f.relances && f.relances[m.pending]) {
        var r = f.relances[m.pending]; m.pending = null;
        // seul un vrai oui ou un vrai non répond à sa question ; « j'ai mal dormi » parle d'autre chose
        if (a.words <= 10 && (a.oui || a.non)) {
          say(a.oui ? r.oui : r.non);
          saveMem(api, id, m); return true;
        }
        if (r.autre && a.type === 'affirmation' && a.words <= 5 && !a.ents.length) { say(r.autre); saveMem(api, id, m); return true; }
      }
      // les salutations : une fois, puis on s'étonne
      if (a.salut) {
        var hs = +((String(api.clock()).match(/(\d+) h/) || [])[1] || 12), B = (hs >= 18 || hs < 5) ? 'Bonsoir' : 'Bonjour';
        var ns = count('salut');
        say(String(ns > 1 ? val(api, f.resalut || RESALUT[f.reg] || RESALUT.populaire, 'resal:' + id) : val(api, f.salut || SALUT[f.reg] || SALUT.populaire, 'sal:' + id)).replace(/\{B\}/g, B));
        saveMem(api, id, m); return true;
      }
      // « pourquoi ? », « racontez », « et alors ? » juste après une réponse libre : on approfondit, ou on botte en touche
      if (a.suite && m.lastTurn === api.s.turn - 1) {
        var src0 = m.lastSrc && lookup(api, f, m.lastSrc), idx = (m.n['suite:' + m.lastSrc] || 0) + 1;
        if (Array.isArray(src0) && idx < src0.length) { m.n['suite:' + m.lastSrc] = idx; say(src0[idx]); }
        else { var ns2 = count('suiteVide'); say(val(api, f.suite || SUITE[f.reg] || SUITE.populaire, 'suite:' + id)); if (ns2 > 2) st.patience -= 1; }
        saveMem(api, id, m); return true;
      }
      // 3. ce que le joueur dit de lui-même
      if (a.nom) { m.nomJoueur = a.nom; say(val(api, f.enchante || ['« Enchanté, ' + a.nom + '. »', '« ' + a.nom + '. Je m’en souviendrai. »'], 'ench:' + id)); saveMem(api, id, m); return true; }
      if (a.quisuisje) { say(m.claim ? (m.menteur ? '« Vous m’avez dit être ' + m.claim + '. Je n’en crois pas un mot. »' : '« Vous m’avez dit être ' + m.claim + '. Je n’ai aucune raison d’en douter. Pas encore. »') : m.nomJoueur ? '« Vous m’avez dit vous appeler ' + m.nomJoueur + '. »' : '« Vous êtes {m}. C’est tout ce que je sais de vous. »'); saveMem(api, id, m); return true; }
      if (a.claim && !a.q) {
        var role = roleOf(a.claim), occ = N(api.s.pc.occupation || ''), vrai = occ.indexOf(N(a.claim).slice(0, 5)) >= 0 || (role && role === roleOf(occ.split(' ')[0]));
        var oldRole = m.claim && roleOf(m.claim);
        if (m.claim && N(m.claim) === N(a.claim)) { say('« Oui, vous me l’avez dit. ' + cap(a.claim) + '. »'); saveMem(api, id, m); return true; }
        if (m.claim && role !== oldRole && !m.claimVrai) { m.menteur = true; st.patience -= 1; say(val(api, f.contradiction || ['« Tout à l’heure, vous étiez ' + m.claim + '. Il faudrait savoir, {m}. »', '« ' + cap(a.claim) + ', maintenant ? Vous changez de métier comme de chemise. »'], 'contra:' + id)); saveMem(api, id, m); return true; }
        if (vrai) { m.claim = a.claim; m.claimVrai = true; m.cru = true; say(val(api, (role && f.roles && f.roles[role]) || f.croire || ['« ' + cap(a.claim) + ' ? Je vois. »', '« Ah. ' + cap(a.claim) + '. Ça se voit, maintenant que vous le dites. »'], 'claim:' + id)); saveMem(api, id, m); return true; }
        if (f.connait) { m.menteur = true; say(val(api, f.connaitLine || ['« Allons, {m}. Je vous connais. Qu’est-ce qui vous prend ? »'], 'connait:' + id)); saveMem(api, id, m); return true; }
        if (m.menteur) { say(val(api, f.plusCru || ['« Après ce que vous m’avez déjà raconté ? Non, {m}. »', 'Un regard las. On ne vous croit plus, quoi que vous disiez.'], 'pluscru:' + id)); saveMem(api, id, m); return true; }
        // un mensonge : Baratin, plus ou moins difficile selon la méfiance de celui qu'on veut berner
        var diff = role === 'police' && /police/.test(f.groupe) ? 'extreme' : (f.mefiant || 0) >= 0.6 ? 'difficile' : 'normal';
        m.lie = { claim: a.claim, role: role, npc: id };
        if (role === 'police') api.flag('usurpe', { qui: npc.name, min: api.s.min });
        saveMem(api, id, m);
        var ck = scene.checks && scene.checks.parole_baratin;
        if (ck && api.check) { ck.why = 'lui faire croire que vous êtes ' + a.claim + (diff !== 'normal' ? ' (on se méfie de vous)' : ''); ck.push = diff === 'extreme' ? null : 'Insister, en rajouter (jet forcé)'; api.check('parole_baratin', { diff: diff }); return true; }
        say('« ' + cap(a.claim) + ' ? Je ne l’aurais pas deviné. »'); return true;
      }
      // 4. insultes et compliments : l'humeur bouge
      if (a.insulte) { st.patience -= 2; say(val(api, f.insulte || Vx.insulte, 'ins:' + id)); saveMem(api, id, m); return true; }
      if (a.compliment && !a.ents.length && a.words <= 12) { st.patience = Math.min(st.patience + 1, npc.patience || 6); say(val(api, f.compliment || Vx.compliment, 'cpl:' + id)); saveMem(api, id, m); return true; }
      // 5. hors du temps : machines, anachronismes
      if (a.meta) { say(val(api, f.meta || Vx.meta, 'meta:' + id)); saveMem(api, id, m); return true; }
      if (a.ana) { st.patience -= 1; say(fill(val(api, Vx.ana, 'ana:' + id), a, null, null, a.ana)); saveMem(api, id, m); return true; }
      // 6. les questions sur lui-même
      if (a.perso) {
        var v = f.moi && f.moi[a.perso];
        var n = count('moi:' + a.perso);
        if (v) { var x = val(api, v, 'moi:' + id + ':' + a.perso); say(n > 1 && /^« /.test(x) ? val(api, Vx.deja, 'deja:' + id) + lowFirst(x.replace(/^« /, '')) : x); }
        else say(val(api, (f.moi && f.moi.defaut) || ['« Je ne vois pas en quoi ça vous regarde, {m}. »', '« Parlons d’autre chose, voulez-vous ? »'], 'moidef:' + id));
        if (n > 2) st.patience -= 1;
        relance(api, f, id, m); saveMem(api, id, m); return true;
      }
      // 7. un sujet nommé : ce qu'il en sait, ce qu'il en pense, sinon ce que tout le monde en dit
      var e = a.ents.filter(function (x) { return (f.sait && f.sait[x]) || (f.avis && f.avis[x]) || (scene.rumeurs && scene.rumeurs[x]); })[0] || a.ents[0];
      var cult = null; CULT.some(function (c) { if (c.re.test(a.t)) { cult = c; return true; } return false; });
      // « Paierai ? Connais pas » : un nom commun dont il n'a rien à dire n'est pas un nom propre inconnu ; on passe la main
      var sansRien = e && !(f.sait && f.sait[e]) && !(f.avis && f.avis[e]) && !(scene.rumeurs && scene.rumeurs[e]);
      if (sansRien && /^(le|la|les|l’|l'|un|une|des|du|de l’|de la|de l')\s?/i.test(label(e)) && !/^[A-ZÀ-Ý]/.test(nomDit(e))) e = null;
      if (e && !(cult && !(f.sait && f.sait[e]) && !(f.avis && f.avis[e]))) {
        m.last = e;
        var k = 'ent:' + e, nn = count(k), src = (a.type === 'avis' && f.avis && f.avis[e]) || (f.sait && f.sait[e]) || (f.avis && f.avis[e]);
        if (!src && scene.rumeurs && scene.rumeurs[e]) { var ru = scene.rumeurs[e](api, f); if (ru) src = ru; }
        var line = src ? val(api, src, 'sait:' + id + ':' + e) : null;
        if (!line && scene.rumeurs && scene.rumeurs[e]) { var ru2 = scene.rumeurs[e](api, f); if (ru2) line = val(api, ru2, 'ru:' + id + ':' + e); }
        if (line) {
          m.lastSrc = (f.sait && f.sait[e]) ? 'sait:' + e : (f.avis && f.avis[e]) ? 'avis:' + e : null;
          say(nn > 1 ? val(api, Vx.deja, 'deja:' + id) + lowFirst(line.replace(/^« /, '')) : line, false);
          if (nn > 2) st.patience -= 1;
          // deux sujets dans la même question : « et de Rigby ? » n'attend pas
          var e2 = a.ents.filter(function (x) { return x !== e && ((f.sait && f.sait[x]) || (f.avis && f.avis[x])); })[0];
          if (e2 && /^« /.test(line)) {
            var l2 = val(api, (f.sait && f.sait[e2]) || f.avis[e2], 'sait:' + id + ':' + e2);
            if (l2 && /^« /.test(l2)) { count('ent:' + e2); say('« ' + quantA(label(e2)) + ' : ' + lowFirst(stripName(l2.replace(/^« /, ''))), false); }
          }
        } else if (ditRecemment(api, id, nomDit(e))) {
          // on ne nie pas connaître ce qu'on vient soi-même de nommer (« les meurtres du Chelsea Arms ? connais pas »)
          say(fill(val(api, f.ignoreDit || ['« Je vous en ai dit ce que je sais, {m}. Pas davantage. »', '« Pour {x}, je n’en sais pas plus que ce que je viens de vous dire. »', '« {X}… Je vous l’ai dit : c’est tout ce que j’en sais. »'], 'ignDit:' + id), a, nomDit(e)), true);
        } else say(fill(val(api, f.ignore || Vx.ignore, 'ign:' + id), a, nomDit(e)), true);
        relance(api, f, id, m); saveMem(api, id, m); return true;
      }
      // 7 bis. un mot de la question qui figure dans sa propre histoire : il y revient de lui-même
      var hit = inFiche(api, f, a.content, a.unk);
      if (hit && hit.score < 2 && a.words >= 7) hit = null;
      if (hit) {
        m.lastSrc = hit.k;
        var nh = count('fi:' + hit.k);
        say(nh > 1 && /^« /.test(hit.line) ? val(api, Vx.deja, 'deja:' + id) + lowFirst(hit.line.replace(/^« /, '')) : hit.line, false);
        if (nh > 2) st.patience -= 1;
        relance(api, f, id, m); saveMem(api, id, m); return true;
      }
      // 8. la culture du temps
      if (cult) {
        var ov = f.avis && f.avis[cult.k];
        var pool = ov || (f.pa && CULT_PA[cult.k]) || (typeof cult[classe(f)] === 'function' ? cult[classe(f)](api) : cult[classe(f)]) || cult.p;
        count('cult:' + cult.k);
        say(val(api, pool, 'cult:' + id + ':' + cult.k), true);
        relance(api, f, id, m); saveMem(api, id, m); return true;
      }
      // 8 bis. une longue phrase dont on n'a saisi que des bribes : on vérifie, plutôt que de répondre à côté
      var bribes = a.unk.map(N).filter(function (w) { return w.length >= 4; }).concat(a.content.filter(function (w) { return w.length >= 5 && !/(ais|ait|ions|iez|aient|er|ir|re|ez|ons|ent)$/.test(w); }));
      bribes = bribes.filter(function (w, i) { return bribes.indexOf(w) === i; });
      if (a.words >= 7 && bribes.length >= 2 && m.flou !== api.s.turn - 1) {
        m.flou = api.s.turn;
        var origW = function (w) { var o = a.raw.split(/[\s’'?!.,;:«»"()]+/).filter(function (x) { return N(x) === w; })[0]; return o || w; };
        var fl = val(api, FLOU[f.reg] || FLOU.populaire, 'flou:' + id).replace(/\{1\}/g, origW(bribes[0])).replace(/\{2\}/g, origW(bribes[1]));
        if (HUM()) return bizarre(api, id, f, a, m, st, caractere(id, f), 'flou', fl);
        say(fl, false);
        saveMem(api, id, m); return true;
      }
      // 9. un mot qu'il ne connaît pas : il le répète, intrigué
      // un mot inconnu dans une affirmation : on s'agace ; dans une question, c'est peut-être nous qui ne connaissons pas le mot
      // dans une question, on ne fait répéter qu'un nom propre (« Zorglub ? ») : un mot ordinaire que l'on ne connaît pas n'a rien de bizarre
      var motInconnu = a.unk.length && a.unk[0].length >= 5 && (!a.q || /^[A-ZÀ-Ý]/.test(a.unk[0])) && api.rand() < 0.75;
      if (motInconnu && !a.q && HUM()) return bizarre(api, id, f, a, m, st, caractere(id, f), 'mot');
      if (motInconnu) { st.patience -= 1; say(fill(val(api, Vx.mot, 'mot:' + id), a, null, a.unk[0]), true); saveMem(api, id, m); return true; }
      // 10. le type de question, à défaut de mieux : la voix du personnage fait le reste
      var tp = a.type, pool2 = (f.types && f.types[tp]) || Vx[tp];
      if (pool2) {
        if (tp === 'affirmation' && a.words <= 2) return false;
        // on lui raconte quelque chose (« il m'a menacé le premier ») : il écoute, à sa façon
        if (p.recit && tp === 'affirmation') { say(val(api, RECIT[classe(f)] || RECIT.p, 'recit:' + id), true); relance(api, f, id, m); saveMem(api, id, m); return true; }
        if (tp === 'affirmation' && HUM() && a.content.length >= 2 && !a.ents.length) return bizarre(api, id, f, a, m, st, caractere(id, f), 'phrase');
        st.patience -= (tp === 'affirmation' ? 1 : 0);
        say(val(api, pool2, 'type:' + id + ':' + tp), true);
        if (tp !== 'affirmation') relance(api, f, id, m);
        saveMem(api, id, m); return true;
      }
      return false;
    }
    // le moteur signale le sujet d'une réplique écrite, pour que « et lui ? » s'y rapporte
    // « oui », « non », « je ne sais pas » : on prend acte dans son ton (question posée) ou l'on s'étonne (aucune question)
    converse.bref = function (api, npc, kind, cas) {
      var f = (scene.fiches || {})[npc.id]; if (!f) return false;
      var T = cas === 'q' ? BREF[kind] : cas === 'd' ? (kind === 'oui' ? BREF.suite : kind === 'non' ? BREF.contre : BREF.doute) : cas === 'o' ? BREF.ouvert : BREF.seul;
      var pool = T[f.reg] || T[registre(f)] || T.populaire;
      npcLine(api, npc.id, val(api, pool, 'bref:' + kind + ':' + cas + ':' + npc.id));
      return true;
    };
    // une banalité proposée par le carnet (« Quel brouillard ! ») : la réponse vient toujours de la culture du temps,
    // dans la voix du personnage, et jamais d'un sujet de l'enquête que les mots auraient frôlé (« nuit », « train »)
    converse.causer = function (api, npc, k) {
      var f = (scene.fiches || {})[npc.id]; if (!f) return false;
      var cult = CULT.filter(function (c) { return c.k === k; })[0]; if (!cult) return false;
      var pool = (f.avis && f.avis[k]) || (f.pa && CULT_PA[k]) || (typeof cult[classe(f)] === 'function' ? cult[classe(f)](api) : cult[classe(f)]) || cult.p;
      if (!pool) return false;
      npcLine(api, npc.id, val(api, pool, 'cult:' + npc.id + ':' + k));
      var m = mem(api, npc.id); relance(api, f, npc.id, m); saveMem(api, npc.id, m);
      return true;
    };
    converse.note = function (api, npc, id) { if (!(scene.fiches || {})[npc.id]) return; var m = mem(api, npc.id); m.last = id; saveMem(api, npc.id, m); };
    // ce que le moteur doit savoir avant de choisir qui répond
    converse.peek = function (api, npc, p) {
      var f = (scene.fiches || {})[npc.id]; if (!f) return null;
      var m = mem(api, npc.id);
      // sa question est restée sans réponse : on a parlé d'autre chose, elle ne tient plus
      if (m.pending !== undefined && m.pending !== null && m.pendingTour !== undefined && api.s.turn - m.pendingTour > 1) { m.pending = null; saveMem(api, npc.id, m); }
      var a = analyse(api, npc, p, m, f, scene), tt = a.t.trim();
      var cult = CULT.some(function (c) { return c.re.test(a.t); });
      return {
        answer: m.pending !== undefined && m.pending !== null && a.words <= 8 && (a.oui || a.non),
        addressed: a.q || (a.vous && !/^(je|j) /.test(tt)),
        prior: !!(a.perso || a.meta || a.ana || a.insulte || a.nom || a.quisuisje || (a.claim && !a.q) || (a.compliment && !a.ents.length && a.words <= 12)),
        short: !a.ents.length && !a.unk.length && !cult && a.words <= 4,
        mine: a.suite && m.lastTurn === api.s.turn - 1,
        connu: a.ents.some(function (x) { return (f.sait && f.sait[x]) || (f.avis && f.avis[x]); }),
        a: a
      };
    };

    // avant tout le reste : l'humeur du personnage (insultes, absurdités, anachronismes, silence)
    converse.avant = function (api, npc, p, ctx) {
      var f = (scene.fiches || {})[npc.id]; if (!f || !HUM()) return false;
      ctx = ctx || {};
      var Hm = HUM(), id = npc.id, m = mem(api, id), st = api.npcs(id), c = caractere(id, f), a = analyse(api, npc, p, m, f, scene);
      rafraichir(api, m);
      // une plainte contre vous est arrivée jusqu'à la police
      var pl = api.flag('plainte');
      if (pl && pl.n && /police/.test(f.groupe || '') && m.plainteVue !== pl.n) { m.plainteVue = pl.n; st.patience -= 1; garder(st); npcLine(api, id, uniq(api, m, [Hm.L.plaintePolice])); }
      // un aveu (« j'ai essayé de l'étrangler ») : on ne le rejoue pas, on y réagit
      if (p.recit && !a.q && AVEU_JE.test(a.t) && AVEU_ACTE.test(a.t)) {
        var poolA = AVEU[classe(f)] || AVEU.p;
        st.patience -= 1; garder(st);
        npcLine(api, id, uniq(api, m, [poolA]));
        saveMem(api, id, m); return true;
      }
      var grossier = (a.insulte || a.menace || (a.juron && !a.ents.length && !a.q)) && !(p.recit && !a.insulte);
      var bad = grossier || (a.absurde && !p.recit) || !!a.anaW; // un récit qu'on comprend mal n'est pas une absurdité
      // une menace qu'une scène écrite sait jouer (un jet d'Intimidation) passe par la scène
      if (a.menace && !a.insulte && ctx.menaceTopic && !m.sil) { saveMem(api, id, m); return false; }
      var ok = !bad && !!(ctx.topic || a.ents.length || a.perso || a.salut || a.compliment || a.nom || a.quisuisje || a.suite || (a.q && !a.unk.length) || (m.pending !== undefined && m.pending !== null && (a.oui || a.non)));
      if (m.sil) {
        if (a.excuse && !grossier) {
          m.sil = 0; m.supDit = 0; m.ins = Math.max(0, (m.ins || 0) - 1); m.bz = 0;
          npcLine(api, id, pron(c, uniq(api, m, [Hm.L.reprise])));
          npcLine(api, id, uniq(api, m, [Hm.L.excuse[registre(f)]]));
          saveMem(api, id, m); return true;
        }
        if (ok) { m.sil = 0; m.supDit = 0; m.bz = Math.max(0, (m.bz || 0) - 2); npcLine(api, id, pron(c, uniq(api, m, [Hm.L.reprise]))); saveMem(api, id, m); return false; }
        return silence(api, id, m, st, c, grossier ? 2 : bad);
      }
      if (a.excuse && !grossier && ((m.ins || 0) > 0 || (m.jur || 0) > 0 || (m.bz || 0) >= 2)) {
        m.ins = Math.max(0, (m.ins || 0) - 1); m.jur = 0; m.bz = Math.max(0, (m.bz || 0) - 2); if (m.insN !== undefined) m.insN = m.ins ? Math.max(-1, m.insN - 1) : undefined;
        st.patience = Math.min(npc.patience || 6, st.patience + 1); garder(st);
        npcLine(api, id, uniq(api, m, [Hm.L.excuse[registre(f)], Hm.L.excuseUsee]));
        humeurDrapeau(api, id, m); saveMem(api, id, m); return true;
      }
      if (grossier) { var r1 = insulte(api, id, f, a, m, st, c); humeurDrapeau(api, id, m); return r1; }
      if (a.anaW) return anachro(api, id, f, a, m, st, c);
      if (a.absurde) return bizarre(api, id, f, a, m, st, c, 'absurde');
      if (a.compliment && !/\?/.test(a.raw) && !a.ents.length && a.words <= 14 && compliment(api, id, f, a, m, st, c)) { humeurDrapeau(api, id, m); return true; }
      if (ok) { m.okN = (m.okN || 0) + 1; if (m.okN >= 2 && m.bz) { m.bz--; m.okN = 0; } } else if (bad) m.okN = 0;
      // la rancune : insulté, on répond du bout des lèvres ; trop insulté, on ne répond plus sans excuses
      if (ok && (m.ins || 0) > 0) {
        var ni = m.insN === undefined ? 0 : m.insN;
        if (ni >= 2 && c.kind !== 'faible') { npcLine(api, id, uniq(api, m, [Hm.L.refus[registre(f)]])); humeurDrapeau(api, id, m); saveMem(api, id, m); return true; }
        var pre = uniq(api, m, [Hm.L.rancune[registre(f)][Math.min(ni, 1)]], true);
        if (pre && api.prefix) api.prefix(id, pre);
        // trois échanges sensés de suite, et la colère retombe d'un cran
        m.okIns = (m.okIns || 0) + 1;
        if (m.okIns >= 3) { m.okIns = 0; m.ins = Math.max(0, m.ins - 1); m.insN = m.ins ? Math.max(-1, ni - 1) : undefined; }
      } else if (ok && m.charme === H.day(api) && api.rand() < 0.35) {
        var cpl = uniq(api, m, [Hm.L.complice[registre(f)]], true);
        if (cpl && api.prefix) api.prefix(id, cpl);
      }
      humeurDrapeau(api, id, m);
      saveMem(api, id, m); return false;
    };
    return converse;
  }
  G.RPG = G.RPG || {};
  G.RPG.Parole = { make: make, analyse: analyse, CULT: CULT, V: V };
})(typeof window !== 'undefined' ? window : globalThis);
