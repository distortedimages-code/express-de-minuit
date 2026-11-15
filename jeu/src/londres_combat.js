/* Londres : la violence, à la façon de L'Appel de Cthulhu (7e éd.).
   Chaque PNJ se défend selon ce qu'il est : un sergent a sa matraque, le garde de l'ambassade
   son revolver, Mrs Atkins son tisonnier, Mrs Pike une épingle à chapeau. On peut mourir.
   On peut tuer ; si quelqu'un vous a vu, Scotland Yard vous cherche. */
(function (G) {
  'use strict';
  var L = G.CHAPTERS.londres, H = L._h, CX = L._c, day = H.day, hour = H.hour, D = H.D;

  // ---------------------------------------------------------------- dés
  function levelOf(r, t) { if (r === 1) return 5; if (r <= Math.floor(t / 5)) return 4; if (r <= Math.floor(t / 2)) return 3; if (r <= t) return 2; if ((t < 50 && r >= 96) || r === 100) return 0; return 1; }
  var NIV = ['échec critique', 'échec', 'réussite', 'réussite majeure', 'réussite extrême', 'réussite critique'];
  function d100(api) { return 1 + Math.floor(api.rand() * 100); }
  function dice(api, expr, max) {
    var tot = 0; String(expr || '0').replace(/\s/g, '').split(/(?=[+-])/).forEach(function (t) {
      var sg = t[0] === '-' ? -1 : 1, u = t.replace(/^[+-]/, ''), m = u.match(/^(\d*)d(\d+)$/);
      if (m) { var n = +(m[1] || 1); for (var i = 0; i < n; i++) tot += sg * (max ? +m[2] : 1 + Math.floor(api.rand() * +m[2])); }
      else tot += sg * (+u || 0);
    });
    return tot;
  }
  function rollTxt(skill, val, r) { var l = levelOf(r, val); return { r: r, l: l, txt: skill + ' ' + val + ' : ' + r + ', ' + NIV[l] }; }

  // ---------------------------------------------------------------- armes et profils
  var ARME = {
    poings: { nom: 'ses poings', deg: '1d3' },
    matraque: { nom: 'sa matraque', deg: '1d6' },
    gourdin: { nom: 'un gourdin sorti de sous le comptoir', deg: '1d6' },
    tisonnier: { nom: 'le tisonnier de la cheminée', deg: '1d6' },
    epingle: { nom: 'une longue épingle à chapeau', deg: '1d3' },
    revolver: { nom: 'son revolver', deg: '1d10', feu: true }
  };
  // cac : Corps à corps ; esq : Esquive ; imp : Impact ; style : riposte, esquive, fuite ou appel ; aide : qui accourt ; connu : sait qui vous êtes
  var PROF = {
    fleming: { cac: 55, esq: 45, pv: 12, imp: '0', arme: 'poings', style: 'riposte', aide: 'yard', connu: true },
    rigby: { cac: 65, esq: 30, pv: 15, imp: '1d4', arme: 'poings', style: 'riposte', aide: 'yard', connu: true },
    sergent: { cac: 55, esq: 30, pv: 14, imp: '1d4', arme: 'matraque', style: 'riposte', aide: 'sifflet', connu: true },
    agentsj: { cac: 45, esq: 35, pv: 13, imp: '0', arme: 'matraque', style: 'riposte', aide: 'sifflet' },
    mustapha: { cac: 40, esq: 50, pv: 11, imp: '0', arme: 'poings', style: 'esquive', aide: 'kavass', connu: true },
    chelseaclerk: { cac: 25, esq: 30, pv: 9, imp: '0', arme: 'poings', style: 'fuite', aide: 'agent' },
    voisin: { cac: 45, esq: 25, pv: 12, imp: '0', arme: 'gourdin', style: 'riposte', aide: 'passants' },
    atkins: { f: true, cac: 30, esq: 25, pv: 9, imp: '-1', arme: 'tisonnier', style: 'riposte', aide: 'voisins', connu: true, cri: '« Au secours ! À l’assassin ! »' },
    butter: { cac: 30, esq: 25, pv: 11, imp: '0', arme: 'poings', style: 'esquive', aide: null, connu: true, cri: '« Mais enfin ! Mais qu’est-ce qui vous prend ? »' },
    concierge: { cac: 25, esq: 30, pv: 10, imp: '0', arme: 'poings', style: 'appel', aide: 'grooms', connu: true, cri: '« Charles ! Edward ! À moi ! »' },
    pike: { f: true, cac: 20, esq: 25, pv: 8, imp: '-1', arme: 'epingle', style: 'riposte', aide: 'journal', connu: true, cri: '« Voyou ! Au secours ! »' },
    bibliothecaire: { cac: 20, esq: 30, pv: 9, imp: '-1', arme: 'poings', style: 'appel', aide: 'gardiens', connu: true, cri: '« Gardiens ! Gardiens ! »' },
    laitier: { cac: 40, esq: 35, pv: 11, imp: '0', arme: 'poings', style: 'fuite', aide: 'agentsj', cri: '« Hé là ! Au secours, m’sieur l’agent ! »' }
  };
  var AIDE = {
    yard: { tours: 0, police: true, cac: 50, arme: 'matraque', txt: 'Le hall entier vous tombe dessus : trois agents en uniforme, matraques levées.' },
    sifflet: { tours: 2, police: true, cac: 50, arme: 'matraque', txt: 'Le coup de sifflet a porté. Deux agents arrivent au pas de course, matraques levées.' },
    agent: { tours: 1, police: true, cac: 50, arme: 'matraque', txt: 'L’agent qui gardait l’escalier dévale les marches, matraque au poing.' },
    agentsj: { tours: 1, police: true, cac: 45, arme: 'matraque', txt: 'L’agent de faction accourt de la grille, matraque au poing.' },
    kavass: { tours: 1, feu: true, cac: 55, arme: 'revolver', txt: 'Une porte claque. Le garde de l’ambassade, un colosse moustachu, vous met en joue avec un revolver d’ordonnance. « Ne bougez plus ! »' },
    grooms: { tours: 1, tient: true, txt: 'Deux grooms et le portier vous ceinturent. Quelqu’un court chercher un agent dans le brouillard.' },
    voisins: { tours: 2, police: true, cac: 45, arme: 'matraque', txt: 'Les voisins ont entendu les cris. Des portes claquent dans l’escalier, et un agent monte, essoufflé.' },
    passants: { tours: 3, police: true, cac: 45, arme: 'matraque', txt: 'Des passants s’attroupent devant la vitrine. L’un d’eux revient avec un agent.' },
    journal: { tours: 1, tient: true, txt: 'Trois typographes en tablier dévalent l’escalier et vous plaquent contre les rayonnages.' },
    gardiens: { tours: 1, tient: true, txt: 'Les gardiens du British Museum accourent de toutes les galeries. Quatre cents lecteurs lèvent la tête.' }
  };
  function nom(who) { var n = L.npcs[who]; return n ? (n.short || n.name) : 'votre adversaire'; }
  function Nom(who) { var x = nom(who); return x.charAt(0).toUpperCase() + x.slice(1); }
  function C(api) { return api.flag('combat'); }
  function save(api, c) { api.flag('combat', c ? Object.assign({}, c) : null); }

  // ---------------------------------------------------------------- les fins
  var FINS = {
    mort: { title: 'Mort à Londres', text: 'Votre enquête s’arrête sur un plancher de Londres, sous une lumière jaune. Les journaux du lendemain vous consacrent trois lignes. Le simulacre de Sedefkar attendra d’autres mains.' },
    corde: { title: 'Pentonville', text: 'Le procès dure trois jours. Le jury délibère quarante minutes. Un matin de printemps, à huit heures, on vous conduit dans la cour de la prison de Pentonville. Personne ne saura jamais ce que vous cherchiez.' },
    prison: { title: 'Six mois à Wormwood Scrubs', text: 'Au troisième esclandre, le juge n’a plus voulu entendre parler du professeur Smith. Six mois de prison ferme. Quand vous sortez, en juillet, plus personne ne cherche la statue. Ou plutôt, plus personne que vous connaissiez.' },
    fugitif: { title: 'Fin du chapitre : Londres, en fugitif', text: 'Le Simplon-Orient-Express vous attend à Paris. Derrière vous, Scotland Yard a votre signalement. Ce que vous avez fait à Londres voyagera avec vous jusqu’au bout de la ligne.' }
  };
  L.endingFor = function (s) { return s.flags && s.flags.fin && FINS[s.flags.fin] ? FINS[s.flags.fin] : null; };
  function finir(api, k) { api.flag('fin', k); api.flag('combat', null); api.end(); }

  // ---------------------------------------------------------------- engager le combat
  L._c.fight = function (api, who, p, raw) {
    var P = PROF[who];
    if (!P) return CX.arrest(api, who);
    if (api.flag('mort:' + who)) { api.say(Nom(who) + ' ne se relèvera plus.'); return true; }
    if (api.flag('enfui:' + who) === api.s.loc + ':' + day(api.s.min)) { api.say(Nom(who) + ' n’est plus là. Il a fui, et personne ne vous dira où.'); return true; }
    api.endTalk(false);
    save(api, { npc: who, hp: P.pv, tour: 0, out: false, mort: false, aide: false, feu: false, loc: api.s.loc });
    api.say(api.fresh('engage', ['Votre geste part avant votre pensée. Vous vous jetez sur ' + nom(who) + '.', 'Quelque chose cède en vous. Vous frappez.', 'Vous empoignez ' + nom(who) + ' par le revers.']));
    api.check('cac_attaque');
    return true;
  };

  // un tour : votre coup, sa défense, sa riposte, les renforts
  L.checks.cac_attaque = { skill: 'Corps à corps', why: 'frapper',
    resolve: function (api, r) {
      var c = C(api); if (!c) return;
      var P = PROF[c.npc], who = c.npc;
      if (c.out) { achever(api, c); return; }
      var surprise = c.tour === 0, def = surprise ? 'esq' : (P.style === 'riposte' ? 'cac' : 'esq');
      var dv = def === 'cac' ? P.cac : P.esq, nr = rollTxt(def === 'cac' ? 'Corps à corps' : 'Esquive', dv, d100(api));
      var gagne = def === 'cac' ? (r.level > nr.l || (r.level === nr.l && r.success)) : (r.success && r.level > nr.l);
      var contre = false;
      if (gagne) {
        var dmg = Math.max(1, dice(api, '1d3', r.level >= 4) + dice(api, '0'));
        c.hp -= dmg;
        api.say((def === 'cac' ? Nom(who) + ' rend coup pour coup (' + nr.txt + '), mais vous êtes plus rapide.' : Nom(who) + ' tente de se dérober (' + nr.txt + '), trop tard.') + ' Votre poing porte : ' + dmg + ' point' + (dmg > 1 ? 's' : '') + ' de dégâts.');
        if (c.hp <= 0) { c.out = true; var fe = P.f ? 'e' : '', il = P.f ? 'Elle' : 'Il'; api.say(api.fresh('ko', [Nom(who) + ' s’effondre, inconscient' + fe + ', et ne bouge plus.', Nom(who) + ' heurte le sol. Les yeux révulsés. ' + il + ' respire encore, on dirait.'])); }
      } else if (def === 'cac' && nr.l >= 2) {
        contre = true;
        api.say(Nom(who) + ' pare et riposte (' + nr.txt + ').');
        coup(api, c, P.arme, P.imp, who);
      } else api.say(def === 'esq' ? Nom(who) + ' esquive (' + nr.txt + '). Votre poing ne rencontre que le vide.' : 'Vous vous empoignez sans résultat (' + nr.txt + ').');
      if (api.s.ended) return;
      if (!c.out && !contre) agir(api, c, P);
      if (api.s.ended || !C(api)) return;
      c.tour++;
      renforts(api, c, P);
      if (api.s.ended || !C(api)) return;
      save(api, c);
      offrir(api, c);
    } };

  // le PNJ agit à son tour
  function agir(api, c, P) {
    var who = c.npc;
    if (P.style === 'fuite' || (P.style !== 'riposte' && c.hp <= P.pv / 2)) {
      api.say(Nom(who) + ' recule, renverse une chaise et s’enfuit en criant. ' + (P.cri || ''));
      api.npcs(who).closedUntil = api.s.min + 100000; api.flag('enfui:' + who, api.s.loc + ':' + day(api.s.min));
      if (c.feu) { c.parti = true; api.say('Le garde, lui, ne bouge pas. Le canon de son revolver ne vous quitte pas.'); return; }
      temoin(api, who, false, true);
      api.flag('combat', null);
      return;
    }
    if (P.style === 'appel' || P.style === 'esquive') { api.say(api.fresh('cri:' + who, [P.cri ? Nom(who) + ' crie : ' + P.cri : Nom(who) + ' se protège le visage et appelle à l’aide.', Nom(who) + ' recule contre le mur, les bras devant le visage.', Nom(who) + ' cherche la porte des yeux, puis vous regarde, sans comprendre.', Nom(who) + ' vous supplie d’arrêter, d’une voix qui n’est plus la sienne.'])); c.cri = true; return; }
    if (c.tour === 0) { api.say(Nom(who) + ' encaisse la surprise, puis se met en garde.' + (P.arme !== 'poings' ? ' Dans sa main, ' + ARME[P.arme].nom + '.' : '')); return; }
    api.say(Nom(who) + ' passe à l’attaque.');
    coup(api, c, P.arme, P.imp, who, true);
  }
  // un coup porté contre vous : vous esquivez si vous pouvez
  function coup(api, c, arme, imp, who, attaque, cac) {
    var A = ARME[arme] || ARME.poings, P = PROF[who] || {};
    if (attaque) {
      var ar = rollTxt('Corps à corps', cac || P.cac || 50, d100(api));
      var esq = rollTxt('votre Esquive', skill(api, 'Esquive'), d100(api));
      if (ar.l < 2 || esq.l >= ar.l) { api.say('Le coup part (' + ar.txt + ') ; vous l’évitez (' + esq.txt + ').'); return; }
      api.say('Le coup part (' + ar.txt + ') et vous n’esquivez pas (' + esq.txt + ').');
    }
    var dmg = Math.max(1, dice(api, A.deg) + dice(api, imp || '0'));
    blesser(api, dmg, A, who);
  }
  function skill(api, name) { var s = api.s.pc; return s.skills[name] !== undefined ? s.skills[name] : name === 'Esquive' ? Math.floor(s.carac.DEX / 2) : 25; }
  function blesser(api, dmg, A, who) {
    var pc = api.s.pc, grave = dmg >= Math.ceil(pc.pvMax / 2);
    api.say(api.fresh('aie', ['Le choc vous traverse', 'Une douleur blanche', 'Vous sentez quelque chose céder']) + ' : ' + dmg + ' point' + (dmg > 1 ? 's' : '') + ' de vie perdu' + (dmg > 1 ? 's' : '') + (grave ? ', une blessure grave.' : '.'));
    api.hp(-dmg); api.fx('shudder');
    if (pc.pv > 0) return;
    if (grave || A.feu) {
      api.say(A.feu ? 'La détonation vous parvient après la balle. Vous êtes déjà par terre, et le plafond s’éloigne, très haut, très jaune.' : 'Vous tombez. Quelque chose ne va pas dans votre poitrine, quelque chose de chaud qui s’en va.');
      api.say('Des voix, au-dessus de vous. On appelle un médecin. On ne court plus.');
      finir(api, 'mort');
      return;
    }
    api.say('Le monde bascule. Vous perdez connaissance.');
    var c = C(api);
    if (c && (c.aide || (AIDE[PROF[who] && PROF[who].aide] || {}).police || CX.CIVIL.test(api.s.loc))) { api.s.pc.pv = 1; api.flag('combat', null); prise(api, who, false); return; }
    api.s.pc.pv = 1; api.s.min += 120; api.flag('combat', null);
    api.say('Vous revenez à vous longtemps après, seul, la bouche pleine de sang, les poches retournées.');
    api.s.money = Math.max(0, api.s.money - Math.min(api.s.money, 5));
  }

  // les renforts : la police vous prend, le garde tire, les grooms vous tiennent
  function renforts(api, c, P) {
    var A = AIDE[P.aide]; if (!A || c.aide) { if (c.feu) feu(api, c); return; }
    var t = A.tours - (c.cri ? 1 : 0);
    if (c.tour <= t) return;
    c.aide = true; api.say(A.txt);
    if (A.feu) { c.feu = true; return; }
    if (A.tient) { api.say('Vous ne pouvez plus bouger. Un agent arrive, puis deux.'); prise(api, c.npc, c.out); return; }
    if (A.police) {
      api.say('Les matraques s’abattent.');
      coup(api, c, A.arme, '0', c.npc, true, A.cac);
      if (api.s.ended) return;
      prise(api, c.npc, c.out);
    }
  }
  function feu(api, c) {
    api.say(api.fresh('tir', ['Le garde n’hésite pas. Il tire.', 'Le revolver tonne une seconde fois.', 'Une détonation, assourdissante dans le petit bureau.'])); 
    var tir = rollTxt('Armes de poing', 55, d100(api));
    if (tir.l < 2) { api.say(api.fresh('rate', ['La balle siffle à votre oreille et fait éclater une vitre', 'La balle s’enfonce dans le chambranle, à un pouce de votre tête', 'Le portrait du mur tressaute, troué en plein front']) + ' (' + tir.txt + ').'); return; }
    api.say('(' + tir.txt + ')');
    blesser(api, dice(api, '1d10', tir.l >= 4), ARME.revolver, c.npc);
  }
  // pris sur le fait
  function prise(api, who, horsCombat) {
    var c = C(api) || {};
    api.flag('combat', null);
    if (c.mort || api.flag('mort:' + who)) { api.say('On vous passe les menottes au-dessus du corps. Personne ne vous frappe plus : on vous regarde, simplement, comme on regarde une bête.'); finir(api, 'corde'); return; }
    var n = (api.flag('arrestations') || 0) + 1;
    if (n >= 3) { api.flag('arrestations', n); api.say('Le juge de Bow Street vous reconnaît. Il ne sourit pas.'); finir(api, 'prison'); return; }
    if (horsCombat) api.say('« Coups et blessures. Il ne s’en remettra peut-être pas. » Un sergent écrit sans lever les yeux.');
    CX.arrest(api, who, true);
    api.flag('recherche', null);
  }
  // achever un homme à terre
  function achever(api, c) {
    var who = c.npc;
    c.mort = true; api.flag('mort:' + who, true); api.npcs(who).closedUntil = api.s.min + 10000000;
    api.say('Vous frappez encore. Et encore. Ce qui était ' + nom(who) + ' ne réagit plus. Vous vous arrêtez quand vos mains refusent de continuer.');
    api.say('Le silence revient. Il a un poids que vous ne lui connaissiez pas.');
    save(api, c);
    api.check(endurci(api) ? 'san_meurtre_dur' : 'san_meurtre');
  }
  // ceux que la mort ne surprend plus : médecins, policiers, anciens soldats
  function endurci(api) { var pc = api.s.pc; return /m[ée]decin|chirurgien|police|inspecteur|soldat|militaire|infirmi|croque-mort|l[ée]giste/i.test((pc.occupation || '') + ' ' + (pc.bio || '')); }
  function apresMeurtre(api, r, dur) {
    var c = C(api), who = c ? c.npc : null;
    if (dur) api.say(r.success ? 'Vous avez vu mourir des hommes à la Somme, et sur des tables d’opération. Vos mains tremblent, puis s’arrêtent. Une partie de vous prend des notes, froidement. C’est peut-être le pire.' : 'La Somme ne vous avait pas préparé à ça. Là-bas, ce n’était pas vous. Ici, il n’y a personne d’autre.');
    else api.say(r.success ? 'Vous restez debout. Vous ne savez pas comment. Vous regardez vos mains comme deux objets étrangers.' : 'Vous ne reconnaissez pas vos mains. Vous ne reconnaissez pas le bruit de votre propre souffle. Quelqu’un gémit, longuement, et c’est vous.');
    // la folie passagère : une absence
    if (r.loss >= 5) {
      api.say('Puis plus rien. Un trou noir, comme une page arrachée.');
      api.flag('absence', true);
    }
    var force = r.success ? (dur ? 0 : 1) : (r.loss >= 5 ? 3 : 2);
    if (force > 0 && who) remords(api, who, force);
  }
  L.checks.san_meurtre_dur = { skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d4'], why: 'regarder ce que vous avez fait',
    resolve: function (api, r) { L.checks.san_meurtre.resolve(api, r, true); } };
  L.checks.san_meurtre = { skill: 'SAN', label: 'Santé mentale', loss: ['1d3', '1d10'], why: 'regarder ce que vous avez fait',
    resolve: function (api, r, dur) {
      apresMeurtre(api, r, !!dur);
      var c = C(api); if (!c) return;
      if (api.flag('absence')) {
        api.flag('absence', false);
        var lieux = ['hotel', 'victoria', 'musee'].concat(['stjohn', 'archives', 'yard', 'islington'].filter(function (l) { return api.flag('known:' + l) || l === 'stjohn' || l === 'archives'; }));
        var dest = lieux[Math.floor(api.rand() * lieux.length)];
        temoin(api, c.npc, true, false); api.flag('combat', null);
        api.s.min += 120 + Math.floor(api.rand() * 180);
        api.go(dest);
        api.say('Vous reprenez conscience ici, des heures plus tard, sans savoir comment vous y êtes venu{e}. Vos chaussures sont trempées. Votre manche est raide, et brune.');
        return;
      }
      c.tour++; renforts(api, c, PROF[c.npc]);
      if (api.s.ended || !C(api)) return;
      save(api, c); offrir(api, c);
    } };
  L.checks.soins_combat = { skill: 'Premiers soins', why: 'empêcher le pire',
    resolve: function (api, r) {
      var c = C(api); if (!c) return;
      var F = PROF[c.npc] && PROF[c.npc].f;
      if (r.success) { api.say(F ? 'Vous la tournez sur le côté, desserrez son col, épongez le sang. Elle gémit. Elle vivra.' : 'Vous le tournez sur le côté, desserrez son col, épongez le sang. Il gémit. Il vivra.'); c.soigne = true; }
      else api.say(F ? 'Vos gestes sont maladroits. Elle respire, mais mal.' : 'Vos gestes sont maladroits. Il respire, mais mal.');
      c.tour++; renforts(api, c, PROF[c.npc]);
      if (api.s.ended || !C(api)) return;
      save(api, c); offrir(api, c);
    } };
  function offrir(api, c) {
    if (c.mort) api.chips([{ label: 'Cacher le corps', act: 'cacher' }, { label: 'S’enfuir', act: 'fuir' }]);
    else if (c.out) api.chips([{ label: 'Lui porter secours', act: 'soins' }, { label: 'S’enfuir', act: 'fuir' }, { label: 'L’achever', act: 'achever' }]);
    else api.chips([{ label: 'Frapper encore', act: 'frapper' }, { label: 'S’enfuir', act: 'fuir' }, { label: 'Se rendre', act: 'rendre' }]);
  }

  // ---------------------------------------------------------------- les témoins, et la police qui vous cherche
  var PRIVE = /^(camberwell|cave|boutique|chambre_stanley)$/;
  // les lieux où l'on vous connaît : registres, cartes de lecteur, fiches de clients
  var FICHE = /^(hotel|ambassade|musee|archives|yard|institut)$/;
  function temoin(api, who, meurtre, vivant) {
    var P = PROF[who] || {}, here = api.s.loc, c = C(api) || {};
    var public_ = !PRIVE.test(here);
    // la victime vivante vous a vu ; sinon, des témoins dans un lieu public, ou des voisins qui ont entendu crier
    var vu = vivant || public_ || (c.cri && here !== 'cave');
    var connu = vivant ? !!P.connu : (public_ && FICHE.test(here));
    var rc = api.flag('recherche') || {};
    rc = { crime: meurtre ? 'meurtre' : (rc.crime === 'meurtre' ? 'meurtre' : 'agression'), victime: who, lieu: here, depuis: api.s.min,
      signalement: !!(vu || rc.signalement), connu: !!(connu || rc.connu), corps: meurtre ? (rc.corps || 'laisse') : rc.corps, decouverte: rc.decouverte || 0 };
    if (meurtre && !public_) rc.decouverte = api.s.min + (rc.corps === 'cache' ? 4 : 2) * D;
    if (meurtre && !public_ && vu) rc.vague = true;
    api.flag('recherche', rc);
  }
  // les commandes pendant un combat
  var ATT = /\b(frappe\w*|cogne\w*|tape\w*|attaqu\w*|encore|continue\w*|achev\w*|tue\w*|etrangl\w*|bats|battre|coups?|poing)\b/;
  var FUIR = /\b(fui\w*|fuy\w*|enfui\w*|enfuir|sauve\w*|cour[sir]\w*|file\w*|detal\w*|echapp\w*|pars|partir|quitte\w*|sors|sortir)\b/;
  var RENDRE = /\b(rends|rendre|rendez|arrete\w*|pardon|calme\w*|desole\w*|stop|lache\w*|leve les mains|mains en l air|abandonne\w*)\b/;
  var SOINS = /\b(soign\w*|soins|secour\w*|aide[rz]? (le|la|l)|premiers? soins|ranim\w*|reanim\w*)\b/;
  var CACHER = /\b(cache\w*|traine\w*|deplace\w*|dissimul\w*|recouvr\w*|enterr\w*)\b/;
  var ic0 = L.intercept;
  L.intercept = function (api, p, raw) {
    var c = C(api);
    if (!c) {
      // parler à un mort
      var t0 = ' ' + CX.norm(raw) + ' ';
      for (var k in PROF) if (api.flag('mort:' + k) && L.npcs[k] && (L.npcs[k].selfKeys || []).some(function (id) { return p.c[id] !== undefined; }) && /\b(parle\w*|demande\w*|salue\w*|interroge\w*|vois|voir)\b/.test(t0)) { api.say(Nom(k) + ' ne parlera plus jamais.'); return true; }
      return ic0(api, p, raw);
    }
    if (c.loc !== api.s.loc) { api.flag('combat', null); return ic0(api, p, raw); }
    var t = ' ' + CX.norm(raw) + ' ';
    var conte = G.RPG.recit(raw); // en plein combat, un récit ne porte pas de coup
    return act(api, c, FUIR.test(t) || p.c.ALLER !== undefined ? 'fuir' : RENDRE.test(t) ? 'rendre' : SOINS.test(t) ? 'soins' : (CACHER.test(t) && c.mort) ? 'cacher' : (ATT.test(t) && !conte) ? (c.out ? 'achever' : 'frapper') : 'autre', p);
  };
  function act(api, c, what, p) {
    var P = PROF[c.npc], who = c.npc;
    if (c.parti) {
      if (what === 'rendre') { api.say('Vous levez les mains, lentement. Le garde ne baisse pas son arme avant l’arrivée de la police.'); prise(api, who, false); return true; }
      if (what === 'fuir') { api.say('Vous plongez vers la porte.'); feu(api, c); if (api.s.ended) return true; temoin(api, who, false, true); api.flag('combat', null); api.say('Vous dévalez le perron et courez dans le brouillard de Belgravia jusqu’à ne plus sentir vos jambes.'); H.taxi(api, 'hotel'); return true; }
      api.say(Nom(who) + ' a fui. Il ne reste que le garde, et son revolver braqué sur vous.'); feu(api, c); if (!api.s.ended) { save(api, c); api.chips([{ label: 'Se rendre', act: 'rendre' }, { label: 'S’enfuir', act: 'fuir' }]); } return true;
    }
    if (what === 'frapper') { api.check('cac_attaque'); return true; }
    if (what === 'achever') { if (c.mort) { api.say('Il n’y a plus rien à frapper.'); return true; } achever(api, c); return true; }
    if (what === 'soins') { if (!c.out || c.mort) { api.say(c.mort ? 'Il est trop tard pour ça.' : (P.f ? 'Elle' : 'Il') + ' n’a pas besoin de vos soins : ' + (P.f ? 'elle' : 'il') + ' a besoin que vous arrêtiez.'); return true; } api.check('soins_combat'); return true; }
    if (what === 'rendre') {
      if (c.out || c.mort) { api.say('Vous restez là, les bras ballants, à attendre.'); c.tour = 99; renforts(api, c, P); if (!api.s.ended && C(api)) { api.say('Personne ne vient. Pas encore.'); c.tour = 0; save(api, c); offrir(api, c); } return true; }
      api.say('Vous levez les mains. ' + Nom(who) + ' recule, sans vous quitter des yeux.');
      prise(api, who, false); return true;
    }
    if (what === 'cacher') {
      if (!PRIVE.test(api.s.loc) || c.aide) { api.say('Cacher un corps, ici ? Il y a des yeux partout. Vous n’avez le temps que de fuir.'); offrir(api, c); return true; }
      api.say(api.s.loc === 'cave' || api.s.loc === 'camberwell' ? 'Vous le traînez derrière la grande planche, sous une bâche couverte de sciure. De loin, on dirait des sacs.' : 'Vous le traînez dans l’arrière-boutique et rabattez sur lui un tapis roulé. Votre cœur cogne si fort que vous n’entendez plus rien.');
      api.s.min += 30; var rc = api.flag('recherche') || {}; rc.corps = 'cache'; api.flag('recherche', rc); c.cache = true; save(api, c);
      api.chips([{ label: 'S’enfuir', act: 'fuir' }]);
      return true;
    }
    if (what === 'fuir') {
      if (c.feu) { api.say('Vous courez vers la porte.'); feu(api, c); if (api.s.ended) return true; }
      else if (c.aide && !c.out) { api.say('On vous rattrape par le col avant la porte.'); prise(api, who, c.out); return true; }
      else if (!c.out && !c.mort && P.style === 'riposte' && P.arme !== 'poings') { api.say('Vous tournez les talons. ' + Nom(who) + ' frappe dans votre dos.'); coup(api, c, P.arme, P.imp, who, true); if (api.s.ended) return true; }
      temoin(api, who, !!c.mort, !c.out && !c.mort);
      api.flag('combat', null);
      if (c.mort) api.say(c.cache ? 'Vous refermez la porte derrière vous, doucement, comme on sort d’une chambre de malade.' : 'Vous laissez le corps derrière vous.');
      api.say('Vous courez jusqu’à perdre haleine, tournez trois coins de rue, puis sautez dans un taxi en essayant d’avoir l’air de rien.');
      var dest = p && p.nouns && p.nouns.length ? null : 'hotel';
      if (dest) H.taxi(api, 'hotel'); else return false;
      return true;
    }
    // tout le reste : le combat ne s'arrête pas pour vous
    api.say(api.fresh('pasmoment', ['Ce n’est pas le moment.', 'Vos mots se perdent dans le fracas.', 'Le temps de parler est passé.']));
    if (!c.out && !c.mort) agir(api, c, P);
    if (api.s.ended || !C(api)) return true;
    c.tour++; renforts(api, c, P);
    if (api.s.ended || !C(api)) return true;
    save(api, c); offrir(api, c);
    return true;
  }
  // les puces de combat passent par le même chemin
  L.chipAct = function (api, chip) { var c = C(api); if (!c || !chip.act) return false; act(api, c, chip.act, null); return true; };

  // ---------------------------------------------------------------- la traque
  var ev0 = L.everyTurn;
  L.everyTurn = function (api, fired) {
    var rc = api.flag('recherche');
    if (rc && !api.flag('combat') && !api.s.ended) {
      var here = api.s.loc, d = day(api.s.min);
      // le corps est retrouvé
      if (rc.crime === 'meurtre' && rc.decouverte && api.s.min >= rc.decouverte && !rc.trouve) {
        rc.trouve = true; rc.trouveAt = api.s.min; api.flag('recherche', rc);
        api.event((here === 'hotel' ? 'Dans le hall, le groom lit le journal à voix haute pour les femmes de chambre : « Meurtre à ' : 'Un crieur, au coin de la rue : « Meurtre à ') + ({ cave: 'Camberwell', camberwell: 'Camberwell', boutique: 'Islington', chambre_stanley: 'Stoke Newington' }[rc.lieu] || 'Londres') + ' ! Le corps découvert ce matin ! Scotland Yard sur une piste ! »');
        if (api.flag('known:camberwell') && (rc.lieu === 'cave' || rc.lieu === 'camberwell') && (api.flag('adTrain') || api.flag('lettreButter'))) { rc.connu = true; rc.signalement = true; api.flag('recherche', rc); api.say('« Sur une piste. » Vous pensez à la lettre de Butter, à l’annonce que vous avez passée sous votre vrai nom.'); }
        return true;
      }
      if (!rc.signalement && !rc.connu) return ev0(api, fired);
      // tant que le corps n'est pas retrouvé, personne ne cherche personne
      if (rc.decouverte && !rc.trouve) return ev0(api, fired);
      // la presse publie votre signalement
      if (!rc.presse && api.s.min - (rc.trouveAt || rc.depuis) > 8 * 60) {
        rc.presse = true; api.flag('recherche', rc);
        api.event(rc.crime === 'meurtre' ? 'Dans le journal, en première page, sous un titre énorme : votre signalement. Votre manteau, votre chapeau, votre âge, à peu près. ' + (rc.connu ? 'Et votre nom.' : 'Pas votre nom. Pas encore.') : 'Un entrefilet, page quatre : « Agression à ' + ({ hotel: 'Bloomsbury', archives: 'Fleet Street', stjohn: 'St John’s Wood' }[rc.lieu] || 'Londres') + '. La police recherche un individu bien mis, d’allure respectable. »');
        return true;
      }
      // la police vous attend à l'hôtel
      if (rc.connu && here === 'hotel' && api.s.min - (rc.trouveAt || rc.depuis) > 90) { api.event('Dans le hall, deux hommes en civil se lèvent à votre entrée. L’un d’eux montre une carte de Scotland Yard. Mr Pratt regarde ses chaussures.'); recherche_prise(api, rc); return true; }
      // on vous reconnaît dans la rue
      var exterieur = /^(stjohn|islington|stoke|victoria|yard|chelsea|camberwell|musee|ambassade|archives|institut)$/.test(here);
      var jours = (api.s.min - rc.depuis) / D, p = (rc.crime === 'meurtre' ? 0.05 : 0.025) * (rc.connu ? 1.6 : 1) * (rc.vague && !rc.connu ? 0.4 : 1) * (api.flag('deguise') ? 0.4 : 1) * Math.max(0.2, 1 - jours / (rc.crime === 'meurtre' ? 14 : 4));
      if (here === 'yard') p = rc.crime === 'meurtre' ? 0.6 : 0.3;
      if (exterieur && api.rand() < p) { api.event('« Vous, là ! » Un agent vous dévisage, puis jette un œil à un papier plié dans sa main. Il porte son sifflet à la bouche.'); recherche_prise(api, rc); return true; }
      if (rc.crime === 'agression' && api.s.min - rc.depuis > 5 * D) { api.flag('recherche', null); }
    }
    return ev0(api, fired);
  };
  function recherche_prise(api, rc) {
    api.endTalk(false);
    if (rc.crime === 'meurtre') { api.say('On vous conduit à Scotland Yard. L’inspecteur Fleming entre dans la salle, s’assied en face de vous et pose sur la table une photographie du corps. Il ne dit rien. Il n’a pas besoin.'); finir(api, 'corde'); return; }
    var n = (api.flag('arrestations') || 0) + 1;
    if (n >= 3) { api.flag('arrestations', n); api.say('Le juge de Bow Street vous reconnaît. Il ne sourit pas.'); finir(api, 'prison'); return; }
    api.flag('recherche', null);
    CX.arrest(api, rc.victime, true);
  }
  // changer d'apparence
  L.globalActions.unshift({ id: 'g_deguise', label: 'Changer d’apparence', verbs: ['PRENDRE', 'UTILISER', 'CACHER'], nouns: ['DEGUISEMENT'], needVerb: true, repeatable: true,
    cond: function (api) { return !CX.special(api); },
    run: function (api) {
      if (api.flag('deguise')) { api.say('Vous avez déjà changé de manteau, de chapeau et de démarche. Il ne vous reste qu’à éviter les miroirs.'); return; }
      if (!api.pay(3)) { api.say('Un manteau, un chapeau, des lunettes : il faudrait trois livres.'); return; }
      api.flag('deguise', true); api.time(60);
      api.say('Chez un fripier de Petticoat Lane, vous échangez votre manteau contre un pardessus râpé, votre chapeau contre une casquette, et vous achetez des lunettes à verres neutres. Dans la vitrine, un inconnu fatigué vous regarde.');
    } });
  var lex0 = L.lexicon;
  L.lexicon = function (Lx) { lex0(Lx); Lx.add('DEGUISEMENT', 'n', 'deguisement, deguise, fripier, perruque, travestir, apparence', { label: 'un déguisement' }); };
  L.phrases.unshift([/\bchange[rz]? d (apparence|allure|tete)\b|\bme deguise\w*\b|\bse deguise\w*\b/g, ' deguisement '], [/\bje m enfuis\b|\bje fuis\b|\bje me sauve\b|\bje detale\b/g, ' je pars '], [/\b(je )?(rattrape|poursuis|cours apres) (mustapha|le turc|l attache)\b/g, ' suivre $3 ']);

  // la gare : partir quand on est recherché
  L.locations.victoria.actions.forEach(function (a) {
    if (a.id !== 'v_partir') return;
    var r0 = a.run;
    a.run = function (api, p) {
      var rc = api.flag('recherche');
      if (!rc || (!rc.signalement && !rc.connu) || !api.has('QUETE') || !api.item(H.BILLETS)) { r0(api, p); return; }
      api.say('Sur le quai numéro huit, deux agents en uniforme et un homme en civil regardent passer chaque voyageur. Celui en civil a un papier plié dans la main.');
      api.check(rc.crime === 'meurtre' ? 'discretion_quai' : 'chance_quai');
    };
  });
  L.checks.discretion_quai = { skill: 'Discrétion', why: 'passer sous leur nez',
    resolve: function (api, r) {
      if (r.success || (api.flag('deguise') && api.rand() < 0.3)) { api.say('Vous montez derrière une famille nombreuse, une valise devant le visage. Le regard de l’homme en civil glisse sur vous, s’arrête, repart.'); api.flag('fin', 'fugitif'); api.exec('v_partir_ok'); return; }
      api.say('L’homme en civil lève les yeux de son papier. Il vous regarde. Il replie le papier, lentement, comme on ferme un livre qu’on a fini.');
      recherche_prise(api, api.flag('recherche'));
    } };
  L.checks.chance_quai = { skill: 'CHANCE', label: 'Chance', why: 'qu’ils regardent ailleurs',
    resolve: function (api, r) {
      if (r.success) { api.say('Les agents sont occupés par un pickpocket qui détale. Vous montez.'); api.flag('recherche', null); api.exec('v_partir_ok'); return; }
      recherche_prise(api, api.flag('recherche'));
    } };
  L.locations.victoria.actions.push({ id: 'v_partir_ok', label: 'Monter dans le train', verbs: [], nouns: [], cond: function () { return false; }, run: function (api) { L._h.depart ? L._h.depart(api) : null; } });

  // les nuits soignent un peu
  var ev1 = L.everyTurn;
  L.everyTurn = function (api, fired) {
    var pc = api.s.pc, d = day(api.s.min);
    if (pc.pv < pc.pvMax && (api.flag('soinJour') || 0) < d && hour(api.s.min) >= 7) { api.flag('soinJour', d); api.hp(1); }
    return ev1(api, fired);
  };

  // ---------------------------------------------------------------- les remords
  var PENSEES = [
    'Vous revoyez {nom}, la main levée pour se protéger.',
    'Vos jointures vous font mal. Vous les regardez longtemps.',
    'Quelqu’un rit, dans la rue. Vous sursautez comme si on vous avait appelé{e} par votre nom.',
    'Vous vous surprenez à compter les coups. Vous ne savez plus combien. Vous recomptez.',
    'Un instant, le visage en face de vous devient celui de {nom}. Puis il redevient lui-même.',
    'Vous vous lavez les mains dans une fontaine glacée. Elles étaient propres. Vous recommencez.',
    'Ce n’était pas vous. C’était vous.',
    'Une odeur de cuivre vous suit, partout, tout le temps.',
    'Vous entendez votre propre souffle, celui de ce moment-là. Vous retenez votre respiration pour le faire taire.',
    'Vous avez oublié ce que vous faisiez ici. Il vous faut un long moment pour vous en souvenir.'
  ];
  var MARGES = ['{il} levait la main', 'je n’ai pas voulu', 'combien de coups ? combien ?', '{nom} {nom} {nom}', 'laver laver laver', 'personne n’a vu personne n’a vu', 'ce n’était pas moi', 'pourquoi {il} ne criait plus', '{il} me regarde quand je dors', 'je ne me souviens plus du mardi'];
  var REVES = ['Vous rêvez de {nom}, assis{v} au pied de votre lit. On ne dit rien. On attend que vous vous réveilliez, et vous ne vous réveillez pas.', 'Dans votre rêve, vous frappez encore, et chaque coup fait le bruit d’un train qui passe sur un aiguillage.', 'Vous vous réveillez en sursaut, les mains serrées. Vous mettez longtemps à les ouvrir.'];
  function remords(api, who, force) {
    var rm = api.flag('remords') || {};
    api.flag('remords', { victime: who, nom: nom(who), depuis: rm.depuis || api.s.min, force: Math.max(force, rm.force || 0), marges: rm.marges || 0, vu: rm.vu || 0 });
  }
  function perso(api, x) { var rm = api.flag('remords') || {}, f = PROF[rm.victime] && PROF[rm.victime].f; return elide(x.replace(/\{nom\}/g, rm.nom || 'lui').replace(/\{il\}/g, f ? 'elle' : 'il').replace(/\{v\}/g, f ? 'e' : '')); }
  function elide(x) { return x.replace(/\bde ([AEIOUÉÈ])/g, 'd’$1').replace(/\bque ([AEIOUÉÈ])/g, 'qu’$1'); }
  var ev2 = L.everyTurn;
  L.everyTurn = function (api, fired) {
    if (api.flag('combat')) return false;
    var rm = api.flag('remords');
    if (rm && !api.s.ended) {
      var jours = (api.s.min - rm.depuis) / D, fade = Math.max(0.35, 1 - jours / 12), d = day(api.s.min);
      // une ligne de plus griffonnée dans le carnet, deux fois par jour
      var m = Math.min(MARGES.length, 1 + Math.floor((api.s.min - rm.depuis) / 720) * rm.force);
      if (m > rm.marges) { rm.marges = m; api.flag('remords', rm); }
      // les cauchemars
      if ((api.flag('cauchemar') || 0) < d && hour(api.s.min) < 11 && api.s.loc === 'hotel' && d > day(rm.depuis)) {
        api.flag('cauchemar', d);
        api.event(perso(api, REVES[d % REVES.length]));
        if (api.rand() < 0.25 * rm.force) api.lose(1);
        return true;
      }
      // les pensées qui s'invitent, même en pleine conversation
      if (!fired && api.rand() < 0.05 * rm.force * fade * (api.s.talk ? 0.6 : 1)) {
        var x = perso(api, PENSEES[(rm.vu++) % PENSEES.length]); api.flag('remords', rm);
        if (api.s.talk) x = 'Pendant que ' + nom(api.s.talk) + ' parle, vous n’entendez plus rien. ' + x;
        api.event(x);
        return true;
      }
    }
    return ev2(api, fired);
  };
  // les trous de mémoire : l'adresse qui se dérobe
  L.globalActions.forEach(function (a) {
    if (!/^go_/.test(a.id)) return;
    var r0 = a.run;
    a.run = function (api, p) {
      var rm = api.flag('remords');
      if (rm && rm.force >= 2 && a.id !== 'go_hotel' && !api.flag('trou:' + a.id) && api.s.min - (api.flag('trouAt') || -9999) > 360 && api.rand() < 0.08 * rm.force) {
        api.flag('trou:' + a.id, true); api.flag('trouAt', api.s.min);
        api.say(perso(api, api.fresh('trou', ['Vous connaissez l’adresse. Vous la connaissez. Elle se dérobe, comme un mot sur le bout de la langue. Vous ouvrez votre carnet : la page est couverte de votre écriture, serrée, « {nom} », encore et encore. Il vous faut un long moment pour retrouver le chemin.', 'Vous donnez une adresse au chauffeur. Il se retourne : « Vous êtes sûr ? C’est à l’autre bout de Londres. » Vous n’êtes sûr de rien. Vous descendez, et vous marchez un long moment avant de vous souvenir.', 'Vous voilà dans une rue que vous ne reconnaissez pas, sans savoir depuis combien de temps vous marchez. Votre montre dit vingt minutes. Vos pieds disent davantage.'])));
        api.time(20);
        return;
      }
      r0(api, p);
    };
  });
  // le carnet : des mots effacés, des lignes en marge
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } h ^= h >>> 13; h = Math.imul(h, 2654435761) >>> 0; return (h ^ (h >>> 16)) >>> 0; }
  L.clueView = function (s, id, c) {
    var rm = s.flags && s.flags.remords; if (!rm) return c;
    var k = 0, taux = 0.06 * rm.force, txt = c.text.split(' ').map(function (w) { k++; return (hash(id + k) % 1000) / 1000 < taux && w.length > 3 ? '———' : w; }).join(' ');
    var h = hash(id) % 5;
    var f = PROF[rm.victime] && PROF[rm.victime].f, sub = function (x) { return elide(x.replace(/\{nom\}/g, rm.nom).replace(/\{il\}/g, f ? 'elle' : 'il')); };
    if (h < rm.force && rm.marges > 0) txt += ' — ' + sub(MARGES[(hash(id + 'm') % rm.marges)]);
    return { title: c.title, text: txt };
  };
  L.notesScrawl = function (s) {
    var rm = s.flags && s.flags.remords; if (!rm) return [];
    var f = PROF[rm.victime] && PROF[rm.victime].f;
    return MARGES.slice(0, rm.marges).map(function (x) { return elide(x.replace(/\{nom\}/g, rm.nom).replace(/\{il\}/g, f ? 'elle' : 'il')); });
  };
})(typeof window !== 'undefined' ? window : globalThis);
