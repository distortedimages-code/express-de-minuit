/* Le Gardien reformule : quand le joueur choisit une idée ou une suggestion, on n'affiche pas le mot-clé
   (« Examiner la table de Ravel »), mais ce que le Gardien raconterait à la table : « Vous examinez la table de Ravel de plus près. »
   En conversation, un sujet (« L’homme en gris ») devient : « Vous interrogez Mme Vasseur sur l’homme en gris. » */
(function (G) {
  'use strict';
  function N(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function low(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function voy(s) { return /^[aeiouyhàâéèêëîïôûœ]/i.test(s); }
  // « de » + groupe nominal : du, des, d'
  function de(o) {
    if (/^le /i.test(o)) return 'du ' + o.slice(3);
    if (/^les /i.test(o)) return 'des ' + o.slice(4);
    return voy(o) ? 'd’' + o : 'de ' + o;
  }
  var PREP = /^(a|à|au|aux|vers|dans|sous|sur|parmi|derriere|derrière|autour|chez|en|jusqu’|jusqu'|de|du|des|pour|par|voir|parler)\b/i;
  // « au poste de police » → « le poste de police » ; « vers les voitures-lits » → « les voitures-lits »
  function sansPrep(o) {
    if (/^au /i.test(o)) return 'le ' + o.slice(3);
    if (/^aux /i.test(o)) return 'les ' + o.slice(4);
    return o.replace(/^(vers|à|a|jusqu’à|jusqu'à|en direction de) /i, '');
  }
  // « à » + groupe nominal : au, aux
  function a(o) { if (/^le /i.test(o)) return 'au ' + o.slice(3); if (/^les /i.test(o)) return 'aux ' + o.slice(4); return 'à ' + o; }
  // l'infinitif à la deuxième personne du pluriel
  var IRR = { aller: 'allez', partir: 'partez', sortir: 'sortez', ressortir: 'ressortez', dormir: 'dormez', courir: 'courez', ouvrir: 'ouvrez', offrir: 'offrez', tenir: 'tenez', venir: 'venez', revenir: 'revenez', sentir: 'sentez', servir: 'servez', mentir: 'mentez',
    prendre: 'prenez', reprendre: 'reprenez', apprendre: 'apprenez', comprendre: 'comprenez', lire: 'lisez', relire: 'relisez', dire: 'dites', faire: 'faites', boire: 'buvez', croire: 'croyez', mettre: 'mettez', suivre: 'suivez', ecrire: 'écrivez', detruire: 'détruisez',
    voir: 'voyez', revoir: 'revoyez', asseoir: 'asseyez', convaincre: 'convainquez', rejoindre: 'rejoignez', joindre: 'joignez', eteindre: 'éteignez' };
  function conj(v) {
    var n = N(v);
    if (IRR[n]) return IRR[n];
    if (/er$/.test(v)) return v.slice(0, -2) + 'ez';
    if (/ir$/.test(v)) return v.slice(0, -2) + 'issez';
    if (/dre$/.test(v)) return v.slice(0, -2) + 'ez';
    return null;
  }
  // ce qu'un Gardien dirait, pour les gestes les plus courants ; {o} : le complément, tel quel
  var T = {
    examiner: ['Vous examinez {o} de plus près.', 'Vous prenez le temps d’examiner {o}.', 'Vous vous approchez pour examiner {o}.'],
    regarder: ['Vous regardez {o}.', 'Vous prenez un moment pour regarder {o}.'],
    observer: ['Vous observez {o}, sans en avoir l’air.', 'Discrètement, vous observez {o}.'],
    parler: ['Vous vous adressez {o}.', 'Vous allez parler {o}.'],
    aller: ['Vous partez {o}.', 'Vous prenez la direction {dir}.'],
    fouiller: ['Vous fouillez {o}, méthodiquement.', 'Vous entreprenez de fouiller {o}.'],
    chercher: ['Vous cherchez {o}.', 'Vous partez à la recherche {de}.'],
    ecouter: ['Vous écoutez {o}, sans bouger.', 'Vous prêtez l’oreille {a}.'],
    penser: ['Vous pensez {o}.', 'Vos pensées reviennent {o}.'],
    repenser: ['Vous repensez {o}.', 'Vos pensées reviennent {o}.'],
    lire: ['Vous lisez {o}.', 'Vous parcourez {o}.'],
    consulter: ['Vous consultez {o}.'],
    gouter: ['Vous goûtez {o}, du bout des lèvres.'],
    reveiller: ['Vous réveillez {o}.', 'Vous secouez doucement {o}.'],
    frapper: ['Vous frappez {o}.', 'Vous frappez {o}, du plat de la main.'],
    attendre: ['Vous attendez {o}.', 'Vous décidez d’attendre {o}.'],
    suivre: ['Vous suivez {o}.', 'Vous emboîtez le pas : vous suivez {o}.'],
    ouvrir: ['Vous ouvrez {o}.'],
    prendre: ['Vous prenez {o}.'],
    retourner: ['Vous retournez {o}.', 'Vous revenez sur vos pas : vous retournez {o}.'],
    entrer: ['Vous entrez {o}.'],
    passer: ['Vous passez {o}.'],
    rentrer: ['Vous rentrez {o}.'],
    monter: ['Vous montez {o}.'],
    descendre: ['Vous descendez {o}.'],
    commander: ['Vous commandez {o}.', 'D’un signe, vous commandez {o}.'],
    relire: ['Vous relisez {o}.', 'Vous reprenez {o}, et vous relisez.'],
    convaincre: ['Vous tentez de convaincre {o}.'],
    gagner: ['Vous tentez de gagner {o}.']
  };
  var SEUL = {
    'regarder autour de vous': ['Vous prenez le temps de regarder autour de vous.', 'Vous laissez votre regard faire le tour des lieux.', 'Vous vous arrêtez, et vous regardez autour de vous.'],
    reflechir: ['Vous prenez un moment pour rassembler vos idées.', 'Vous faites le point, en silence.'],
    attendre: ['Vous décidez d’attendre.', 'Vous attendez, sans bouger.'],
    ecouter: ['Vous tendez l’oreille.', 'Vous restez immobile, à l’écoute.'],
    'tendre l’oreille': ['Vous tendez l’oreille.', 'Vous restez immobile, à l’écoute.'],
    'prendre conge': ['Vous prenez congé.', 'Vous prenez congé, poliment.'],
    'humer l’air': ['Vous humez l’air.', 'Vous respirez lentement, en cherchant l’odeur.']
  };
  var PRON = /^(le|la|les|lui|leur|l’|l')\s*/i;
  // un libellé d'action ? « Examiner la table », « Lui montrer la serviette », « S’asseoir à la table »
  function decoupe(label) {
    var l = String(label || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (!l || /[?«»]/.test(l)) return null;
    var m = l.match(/^(se |s’|s')?((?:le|la|les|lui|leur) |l’|l')?([A-Za-zÀ-ÿœ’']+)(.*)$/i);
    if (!m) return null;
    var verbe = m[3], n = N(verbe), refl = !!m[1], pron = m[2] || '';
    if (!/(er|ir|re|oir)$/.test(n)) return null;
    // « Le dîner de l’Association » : un article, pas un pronom
    if (pron && !IRR[n] && !T[n] && !/^(montrer|demander|laisser|observer|interroger|convaincre|tirer|offrir|dire|donner|payer|suivre|reveiller|rendre|parler|ecouter)$/.test(n)) return null;
    return { brut: l, refl: refl, pron: pron, verbe: verbe, n: n, o: m[4].trim() };
  }
  function infinitif(d) {
    var x = (d.refl ? 'vous ' : '') + (d.pron ? low(d.pron) : '') + low(d.verbe) + (d.o ? ' ' + d.o : '');
    return x;
  }
  var MJ = {
    // une action du monde choisie parmi les idées ou les suggestions
    action: function (label, pick) {
      var dest = String(label || '').match(/^Aller\s*:\s*(.+)$/);
      if (dest) return pick('mj:dest', ['Vous partez pour ' + dest[1] + '.', 'Vous prenez la direction ' + de(dest[1]) + '.']);
      var d = decoupe(label); if (!d) return null;
      var key = N(d.brut);
      if (/ de près$/.test(d.o)) d.o = d.o.replace(/ de près$/, '');
      if (SEUL[key]) return pick('mj:' + key, SEUL[key]);
      if (!d.o && SEUL[d.n]) return pick('mj:' + d.n, SEUL[d.n]);
      if (!d.refl && !d.pron && d.o && T[d.n]) {
        // les gabarits qui ajoutent une préposition ne vont qu'aux compléments qui n'en ont pas
        var prep = PREP.test(d.o), pool = T[d.n].filter(function (x) { return !(prep && /\{(de|a)\}/.test(x)) && !(/\{dir\}/.test(x) && !/^(au|aux|vers|à) /i.test(d.o)); });
        return pick('mj:' + d.n + (prep ? 'p' : ''), pool.length ? pool : ['Vous ' + (conj(low(d.verbe)) || 'faites') + ' {o}.'])
          .replace(/\{o\}/g, d.o).replace(/\{de\}/g, de(d.o)).replace(/\{a\}/g, a(d.o)).replace(/\{dir\}/g, de(sansPrep(d.o)));
      }
      // sinon : « Vous décidez de vous asseoir à la table de Ravel. »
      var i = infinitif(d);
      return pick('mj:dec', ['Vous décidez ' + (voy(i) ? 'd’' : 'de ') + i + '.', 'Vous choisissez ' + (voy(i) ? 'd’' : 'de ') + i + '.']);
    },
    // un sujet de conversation : un geste, une phrase, ou une question sur quelqu'un
    topic: function (label, pick, qui) {
      var l = String(label || '').trim();
      if (/«/.test(l)) return { x: l.replace(/^«\s*|\s*»$/g, ''), said: true };
      if (/\?\s*$/.test(l)) return { x: l, said: true };
      var d = decoupe(l);
      if (d) {
        var key = N(d.brut);
        if (SEUL[key]) return { x: pick('mj:' + key, SEUL[key]) };
        if (/^(convaincre|gagner|persuader)$/.test(d.n)) return { x: 'Vous tentez ' + (voy(infinitif(d)) ? 'd’' : 'de ') + infinitif(d) + '.' };
        if (d.n === 'observer' && /^(s’il|s'il|si) /i.test(d.o)) return { x: 'Vous l’observez attentivement, pour savoir ' + d.o + '.' };
        if (d.n === 'observer' && !d.pron && d.o) return { x: pick('mj:observer', T.observer).replace(/\{o\}/g, d.o) };
        if (d.n === 'observer') return { x: 'Vous ' + (d.pron ? low(d.pron) : '') + 'observez attentivement.' };
        var c = conj(low(d.verbe));
        if (c && d.n !== 'demander') return { x: 'Vous ' + (d.refl ? 'vous ' : '') + (d.pron ? low(d.pron) : '') + c + (d.o ? ' ' + d.o : '') + '.' };
        var i = infinitif(d);
        return { x: 'Vous décidez ' + (voy(i) ? 'd’' : 'de ') + i + '.' };
      }
      // une phrase du point de vue du joueur (« Ce que vous avez vu », « Vos trucages ») : il la dit lui-même
      if (/\b(vous|votre|vos)\b/i.test(l)) return { x: l + ' ?', said: true };
      // un nom : on l'interroge là-dessus
      var o = l;
      if (/^(le|la|les|l’|l'|un|une|des|son|sa|ses|leur|leurs|ce|cet|cette|ces|elle|lui|vos)\b/i.test(o)) o = low(o);
      // qui : « Bastien, le serveur » → « Bastien » ; « Le professeur Smith » → « le professeur Smith », « au professeur Smith »
      var q = qui ? String(qui).split(',')[0].trim() : null;
      if (q && /^(le|la|les|l’|l')\b/i.test(q)) q = low(q);
      var aq = q ? (/^le /.test(q) ? 'au ' + q.slice(3) : /^les /.test(q) ? 'aux ' + q.slice(4) : 'à ' + q) : null;
      var simple = !/[,]| et |-même$/.test(o);
      var sur = q ? ['Vous interrogez ' + q + ' sur ' + o + '.', simple ? 'Vous parlez ' + de(o) + ' ' + aq + '.' : 'Vous questionnez ' + q + ' sur ' + o + '.', simple ? 'Vous amenez la conversation sur ' + o + '.' : 'Vous interrogez ' + q + ' sur ' + o + '.'] : ['Vous l’interrogez sur ' + o + '.', 'Vous amenez la conversation sur ' + o + '.'];
      return { x: pick('mj:sujet', sur) };
    }
  };
  G.RPG = G.RPG || {};
  G.RPG.MJ = MJ;
})(typeof window !== 'undefined' ? window : globalThis);
