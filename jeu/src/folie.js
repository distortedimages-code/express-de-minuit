/* =====================================================================
   Quand la raison lâche : les répliques qui se dérèglent, les délires proposés en conversation,
   la fin par la folie (« Cesser de lutter »), et les soins (l'aliéniste, le bromure).
   Les visions éclair, elles, sont dessinées par art.js (Art.VISIONS, dans photos_v2.js).
   ===================================================================== */
(function (G) {
  'use strict';
  var CH = G.CHAPTERS; if (!CH) return;
  var J = 1440;
  function hour(m) { return Math.floor((m % J) / 60); }
  function day(m) { return Math.floor(m / J); }
  function pick(api, l) { return l[Math.floor(api.rand() * l.length)]; }

  // ---------------------------------------------------------------- 1. les répliques qui se dérèglent
  // un mot vu de travers, barré puis corrigé (⟦dents|yeux⟧) : l'information reste lisible
  var MOTS = [['yeux', 'dents'], ['mains', 'nageoires'], ['main', 'bouche'], ['visage', 'masque'], ['sourire', 'rictus'], ['voix', 'clapotis'],
    ['regard', 'gueule'], ['bouche', 'ouïe'], ['doigts', 'vers'], ['cheveux', 'algues'], ['peau', 'écailles'], ['lèvres', 'ventouses'], ['tête', 'coquille']];
  var INCISES = ['Ses dents transpirent.', 'Un sourire, avec beaucoup trop de dents.', 'Sa voix arrive avec une seconde de retard sur ses lèvres.',
    'Quelque chose bouge sous la peau de sa joue, puis plus rien.', 'Un instant, ses yeux sont des dents. Puis des yeux.', 'Ses lèvres ne bougent pas. Les mots arrivent quand même.',
    'Ses paupières se ferment de bas en haut.', 'Derrière, son ombre ne fait pas le même geste.', 'De l’eau noire perle au coin de sa bouche, et personne ne l’essuie.',
    'Votre prénom passe au milieu de la phrase, sans raison.', 'Ses dents claquent doucement entre les mots, comme un télégraphe.', 'Ses ongles sont trop longs. Ils l’étaient tout à l’heure, non ?',
    'Ses mots sentent la vase.', 'Il y a deux voix dans la sienne, et l’autre rit.'];
  var GLOSSE = ['ph’nglui', 'fhtagn', 'mglw’nafh', 'iä', 'wgah’nagl', 'y’ha-nthlei'];
  var VILLE = ['Les pavés respirent, très lentement.', 'Vous comptez les fenêtres. Il en manque une. Il en manque toujours une.', 'Quelqu’un a écrit votre nom dans la buée. Personne n’est entré.',
    'L’air a le goût de sel.', 'Toutes les horloges, autour de vous, battent un peu trop lentement.', 'Le sol penche vers l’eau. Il a toujours penché vers l’eau.',
    'Une seconde, tous les visages autour de vous se sont tournés vers vous. Puis plus aucun.'];
  function dereglement(api, x, e) {
    var st = api.sanState(); if (st < 2 || typeof x !== 'string' || !x) return x;
    if (e && e.t === 'npc') {
      if (api.rand() < (st >= 3 ? 0.45 : 0.15)) {
        var fait = false;
        MOTS.some(function (m) {
          var re = new RegExp('(^|[^A-Za-zÀ-ÿ’])(' + m[0] + ')(?=[^A-Za-zÀ-ÿ]|$)');
          if (!re.test(x)) return false;
          x = x.replace(re, function (all, a, w) { return a + '⟦' + m[1] + '|' + w + '⟧'; }); fait = true; return true;
        });
        if (!fait || api.rand() < 0.5) x += ' ' + pick(api, INCISES);
      }
      if (st >= 3 && api.rand() < 0.18 && x.indexOf(' »') > 0) { var gl = pick(api, GLOSSE); x = x.replace(/[.!?…]*\s»/, function () { return '… ' + gl + '… »'; }); }
      return x;
    }
    if (e && e.t === 'narr' && st >= 3 && api.rand() < 0.12 && x.length > 60) x += ' ' + pick(api, VILLE);
    return x;
  }
  Object.keys(CH).forEach(function (k) {
    var sc = CH[k], base = sc.perceive;
    sc.perceive = function (api, x, e) { return dereglement(api, base ? base(api, x, e) : x, e); };
  });

  // ---------------------------------------------------------------- 2. ce qu'on propose de dire, quand on n'est plus soi
  var MUETS = /^(morts|ravel|brule|stanley|alexis)$/;
  var FEM = { veuve: 1, atkins: 1, pike: 1, vane: 1, brevin: 1, rogniat: 1 };
  var POLICE = /^(fleming|rigby|planton|sergent|agentsj)$/;
  function nomDe(api, id) { var n = (api.s && CH[api.s.chapter] && CH[api.s.chapter].npcs[id]) || {}; return n.short || n.name || 'On'; }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function reaction(api, n, lignes, patience) {
    api.npc(n.id, pick(api, lignes).replace(/\{qui\}/g, cap(nomDe(api, n.id))));
    try { api.calm(n.id, -(patience || 1)); } catch (e) {}
  }
  function delires(api, n) {
    var f = FEM[n.id];
    var langue = ['Ph’nglui mglw’nafh…', 'Iä ! Iä !', 'Fhtagn. Fhtagn.', 'Y’ha-nthlei…'].map(function (m, i) {
      return { label: '« ' + m + ' »', mal: 'rlyeh' + i, dit: '« ' + m + ' »', run: function (api, n) {
        reaction(api, n, ['« Pardon ? » {qui} recule d’un pas.', '{qui} vous dévisage, puis regarde ailleurs, très vite.', '« Je… je ne parle pas cette langue. » La voix tremble un peu.',
          '{qui} se signe, sans même s’en rendre compte.'], 2);
        if (POLICE.test(n.id)) api.say('Un carnet s’ouvre. On note quelque chose, longuement, sans vous quitter des yeux.');
      } };
    });
    var insultes = (f ? ['Pimbêche !', 'Vous êtes une vieille baderne !', 'Mégère !', 'Fripouille !'] : ['Malotru !', 'Faquin !', 'Pignouf !', 'Vous êtes une vieille baderne !', 'Bougre d’âne !', 'Gredin !'])
      .map(function (m) { return { label: m, say: m.replace('Mégère', 'Espèce de mégère') }; });
    var visions = [
      ['Lui dire qu’il a des dents à la place des yeux', '« Vous avez des dents à la place des yeux. Vous le savez, au moins ? »'],
      ['Lui faire remarquer que ses dents transpirent', '« Vos dents transpirent. Essuyez-les. Essuyez-les ! »'],
      ['Lui demander qui se tient derrière lui', '« Qui est-ce, derrière vous ? Il a votre visage. »'],
      ['Lui demander s’il entend l’eau monter', '« Vous l’entendez, vous aussi ? L’eau. Elle monte. »'],
      ['Lui demander pourquoi son ombre ne bouge pas', '« Pourquoi votre ombre ne bouge-t-elle pas avec vous ? »'],
      ['Compter ses doigts à voix haute', '« Un, deux, trois, quatre, cinq, six… six. Six doigts. »']
    ].map(function (v, i) {
      return { label: f ? v[0].replace(/\bqu’il\b/, 'qu’elle').replace(/\bderrière lui\b/, 'derrière elle') : v[0], mal: 'vision' + i, dit: v[1], run: function (api, n) {
        reaction(api, n, ['« Vous êtes souffrant, {m} ? » {qui} vous regarde comme on regarde un malade.', '{qui} se tait. Puis, très doucement : « Vous devriez voir un médecin. Un aliéniste. »',
          '{qui} recule jusqu’au mur, la main sur le cœur.', '« Je vais… je vais vous chercher un verre d’eau. » Personne ne bouge.'], 1);
      } };
    });
    return { langue: langue, insultes: insultes, visions: visions };
  }
  Object.keys(CH).forEach(function (k) {
    var sc = CH[k], base = sc.paroles;
    sc.paroles = function (api, npc) {
      var r = base ? base(api, npc) : { banal: [], maladresse: [] };
      var st = api.sanState();
      if (st < 2 || !npc || MUETS.test(npc.id)) return r;
      var dl = delires(api, npc);
      if (st >= 3) return { banal: dl.visions, maladresse: dl.langue.concat(dl.insultes) };
      return { banal: r.banal.concat(dl.visions.slice(0, 2)), maladresse: r.maladresse.concat(dl.insultes.slice(0, 1), dl.langue.slice(0, 1)) };
    };
  });

  // ---------------------------------------------------------------- 3. cesser de lutter : la fin par la folie
  var FIN_FOLIE = {
    londres: { title: 'Fin : Bethlem', text: 'On vous retrouve au matin sur un banc de l’Embankment, tranquille, les mains couvertes de spirales tracées à l’encre. Vous parlez une langue que personne ne comprend. On vous conduit à l’hôpital de Bethlem, où un interne note votre nom avec un point d’interrogation. Le professeur Smith attendra. Vous, vous écoutez l’eau.' },
    paris: { title: 'Fin : Charenton', text: 'On vous ramasse à l’aube sur un quai de la Seine, très calme, les mains pleines de spirales. Le soir même, on vous installe à Charenton, au quartier des agités, dans la chambre voisine de celle de Guimart. La nuit, à travers le mur, vous vous répondez, dans une langue que personne d’autre ne parle.' }
  };
  var I = G.RPG && G.RPG.Idees;
  ['londres', 'paris'].forEach(function (k) {
    var sc = CH[k]; if (!sc || !I) return;
    var m = I.moteur(k);
    m.idee('*', { id: 'fo_ceder_' + k, kind: 'folie', fragile: 3, idea: 'Cesser de lutter', time: 30,
      cond: function (api) { return !/^(wagon1|wagon2|retour|campagne|cave)$/.test(api.s.loc) && !api.flag('combat'); },
      txt: 'Vous cessez de lutter. C’est très simple, finalement : il suffit de ne plus répondre aux questions du monde. Vous vous asseyez quelque part, le dos contre un mur, et vous écoutez l’eau. Elle parle de plus en plus clairement. Vous comprenez presque tout.',
      suite: function (api) { api.flag('fin', 'folie'); api.end(); } });
    var avant = sc.endingFor;
    sc.endingFor = function (s) { if (s.flags && s.flags.fin === 'folie') return FIN_FOLIE[k]; return avant ? avant(s) : null; };
  });

  // ---------------------------------------------------------------- 4. se soigner
  // D'après les règles, la santé mentale se reconquiert lentement : la psychothérapie d'un aliéniste (1D3 par séance réussie),
  // les calmants qui stabilisent sans guérir. Ici, une séance par jour au plus, et un cachet de bromure par jour.
  var SOINS = {
    londres: { ou: 'à Harley Street', de: 'de Harley Street', prix: 1.05, prixTxt: 'une guinée', pharma: 0.1, docteur: 'Le docteur Elkins, aliéniste, Harley Street' },
    paris: { ou: 'boulevard Saint-Germain', de: 'du boulevard Saint-Germain', prix: 0.4, prixTxt: 'trente francs', pharma: 0.05, docteur: 'Le docteur Varenne, aliéniste, boulevard Saint-Germain' }
  };
  var BROMURE = 'Un flacon de bromure';
  function ouvert(api) { var h = hour(api.s.min), wd = (4 + day(api.s.min)) % 7; return h >= 9 && h < 18 && wd !== 6; }
  function enVille(api) { return !/^(wagon1|wagon2|retour|campagne|cave|gare)$/.test(api.s.loc) && !/^(po|oe)_/.test(api.s.loc) && !api.flag('combat') && !api.s.talk; }
  ['londres', 'paris'].forEach(function (k) {
    var sc = CH[k], S = SOINS[k]; if (!sc) return;
    sc.globalActions = sc.globalActions || [];
    sc.globalActions.push({
      id: 'soin_alieniste', label: 'Consulter un aliéniste', idea: 'Consulter un aliéniste, ' + S.ou, verbs: ['PARLER', 'VISITER', 'ALLER', 'UTILISER'], nouns: ['DOCTEUR'], time: 15,
      cond: enVille, ideaCond: function (api) { return api.sanState() >= 2 && ouvert(api) && api.flag('soinJour') !== day(api.s.min); },
      run: function (api) {
        if (!ouvert(api)) { api.say('Les cabinets ' + S.de + ' sont fermés à cette heure, et le dimanche. Il faudra y aller en semaine, dans la journée.'); return; }
        if (api.flag('soinJour') === day(api.s.min)) { api.say('Vous avez déjà vu l’aliéniste aujourd’hui. « Une séance par jour, pas davantage. L’esprit cicatrise comme la peau : lentement. »'); return; }
        if (!api.pay(S.prix)) { api.say('La séance coûte ' + S.prixTxt + '. Vous ne les avez pas.'); return; }
        api.flag('soinJour', day(api.s.min)); api.time(120);
        api.say(S.docteur + ' : un cabinet tendu de vert, un divan, une pendule qu’on n’entend pas. Il vous écoute pendant une heure sans vous interrompre, en prenant des notes.');
        if (api.rand() < 0.6) {
          var g = 1 + Math.floor(api.rand() * 3); api.gain(g);
          api.say('Il ne vous croit pas, et c’est un soulagement immense : dans sa bouche, tout cela devient de la fatigue, du chagrin, un deuil mal fait. Vous ressortez en marchant plus droit.');
        } else api.say('Il vous écoute, il hoche la tête, il ne comprend rien. Vous ressortez avec une ordonnance et le sentiment d’avoir parlé à un mur capitonné.');
        if (!api.item(BROMURE)) { api.take(BROMURE); api.flag('bromure', 6); api.say('Il vous remet une ordonnance de bromure : un cachet par jour, pas plus. Le pharmacien d’en face vous prépare le flacon.'); }
      } });
    sc.globalActions.push({
      id: 'soin_pharmacie', label: 'Acheter du bromure à la pharmacie', idea: 'Acheter un calmant à la pharmacie', verbs: ['PRENDRE', 'COMMANDER'], nouns: ['DOCTEUR'], time: 20,
      cond: function (api) { return enVille(api) && !api.item(BROMURE); }, ideaCond: function (api) { return api.sanState() >= 1 && ouvert(api); },
      run: function (api) {
        if (!ouvert(api)) { api.say('Les pharmacies ont tiré leurs grilles.'); return; }
        if (!api.pay(S.pharma)) { api.say('Le pharmacien attend que vous payiez. Vous n’avez pas de quoi.'); return; }
        api.take(BROMURE); api.flag('bromure', 6);
        api.say((api.pc.profession === 'medecin' || api.pc.key === 'pemberton') ? 'Vous vous rédigez vous-même l’ordonnance, sur votre papier à en-tête. Le pharmacien ne pose pas de question à un confrère : un flacon de bromure, un cachet par jour.' : 'Un flacon de bromure de potassium, que le pharmacien vous tend en vous regardant un peu trop longtemps. « Un cachet par jour, pas davantage. Et dormez. »');
      } });
    sc.globalActions.push({
      id: 'soin_cachet', label: 'Prendre un cachet de bromure', idea: 'Prendre un cachet de bromure', verbs: ['PRENDRE', 'UTILISER', 'BOIRE'], nouns: ['DOCTEUR'], time: 10, repeatable: true,
      cond: function (api) { return api.item(BROMURE) && !api.flag('combat'); }, ideaCond: function (api) { return api.sanState() >= 1 && api.flag('cachetJour') !== day(api.s.min); },
      run: function (api) {
        if (api.flag('cachetJour') === day(api.s.min)) { api.say('Un par jour : le pharmacien a été formel, et l’étiquette aussi. Vous rangez le flacon.'); return; }
        var n = (api.flag('bromure') || 0) - 1; api.flag('bromure', n); api.flag('cachetJour', day(api.s.min));
        api.say('Le cachet a un goût de sel et de craie. Une demi-heure plus tard, le monde s’arrondit sur les bords ; l’eau se tait, ou du moins elle parle plus bas.');
        api.gain(1); api.time(45);
        if (n <= 0) { api.drop(BROMURE); api.say('C’était le dernier. Le flacon vide sonne creux dans votre poche, et vous le jetez.'); }
      } });
  });
})(typeof window !== 'undefined' ? window : globalThis);
