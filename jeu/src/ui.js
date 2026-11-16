/* Interface : rendu du récit, dés, fiches, sauvegarde, ambiance. */
(function () {
  'use strict';
  var KEY = 'express-minuit-v1', SKEY = 'express-minuit-son', PKEY = 'express-minuit-progression';
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Les documents : un support de papier (photographié, sans texte) et le texte composé par le jeu,
  // dans la typographie de son époque. Le texte est toujours exact : il ne vient jamais de l'image.
  function docKind(x) {
    if (/\bSTOP\b/.test(x)) return 'telegramme';
    if (/^Très honoré Professeur/.test(x)) return 'roussie';
    if (/^(Cher|Chère|Monsieur|Madame)\b/.test(x)) return 'lettre';
    if (/^[A-ZÀ-Ý0-9’'« »,.:!?-]{8,} — /.test(x)) return /DÉRAILLEMENT|PIÈCE PLEINE DE FUMÉE/.test(x) ? 'page' : 'journal';
    return 'note';
  }
  var DOC_IMG = { telegramme: '03_telegramme', roussie: '05_lettre-roussie', lettre: '04_lettre', journal: '01_coupure-journal', page: '02_page-reliee', note: '07_billet' };
  var DOC_TITRE = { telegramme: 'Télégramme', roussie: 'Lettre à demi brûlée', lettre: 'Lettre', journal: 'Coupure de presse', page: 'Archives du Daily Courier', note: 'Document' };
  function docHTML(e) {
    var k = docKind(e.x || ''), x = e.x || '', head = '', body = x;
    var m = x.match(/^(.+?) — ([\s\S]*)$/);
    if ((k === 'journal' || k === 'page' || k === 'telegramme') && m) { head = m[1]; body = m[2]; }
    var h = '<div class="d-img" style="background-image:url(img/documents/' + DOC_IMG[k] + '.webp)"></div><div class="d-paper">';
    h += '<div class="d-kind">' + esc(e.title || DOC_TITRE[k]) + '</div>';
    if (head) h += '<div class="d-head">' + (k === 'telegramme' ? 'Destinataire : ' : '') + esc(head) + '</div>';
    if (k === 'telegramme') h += '<div class="d-body">' + esc(body).split(/\s*\bSTOP\b\s*/).filter(Boolean).map(function (l) { return '<span>' + l + '</span>'; }).join('<span class="stop">STOP</span>') + '</div>';
    else h += '<div class="d-body">' + esc(body) + '</div>';
    return { cls: 'k-' + k, html: h + '</div>' };
  }
  window.__docHTML = docHTML;
  var game = null, art = null, titleArt = null, sound = new window.Sound();
  window.__sound = sound;
  var CH = window.CHAPTERS || { prologue: window.SCENE };
  var SC = window.SCENE; // le chapitre en cours
  var soundOn = true, lastKind = null, rendered = 0, queue = [], current = null, typingTimer = null, instant = false, busy = false, ideasOpen = false, lastCheck = null;
  var logEl = $('log');

  try { soundOn = localStorage.getItem(SKEY) !== 'off'; } catch (e) {}
  var musicOn = true;
  try { musicOn = localStorage.getItem(SKEY + ':music') !== 'off'; } catch (e) {}
  sound.musicOn = musicOn;

  // ---------------------------------------------------------------- utilitaires
  function save() { try { localStorage.setItem(KEY, JSON.stringify(game.state)); } catch (e) {} }
  function loadSave() { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  // ---------------------------------------------------------------- sauvegardes en fichier
  // Un fichier par partie : on le garde où l'on veut, on le recharge plus tard, sur cet appareil ou un autre.
  function nomFichier() {
    var s = game.state, pc = s.pc || {}, quand = String(game.clock() || '').toLowerCase().replace(/\s*·\s*/g, '-').replace(/\s+/g, '');
    var bout = ['express-minuit', s.chapter || 'prologue', (pc.key || pc.first || '').toString().toLowerCase(), quand].filter(Boolean).join('_');
    return bout.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_\-]/g, '') + '.json';
  }
  // dans la visionneuse de Claude, un fichier passe par sa propre fenêtre de confirmation (capacité « downloads »)
  var dlClaude = null;
  try { if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then(function (d) { dlClaude = d || null; }, function () {}); } catch (e) {}
  function telecharger(nom, texte, fin) {
    fin = fin || function () {};
    if (dlClaude) {
      dlClaude.save({ filename: nom, data: texte }).then(function () { fin('Fichier enregistré : ' + nom); }, function (e) {
        var c = e && e.code;
        if (c === 'declined') return fin('');
        if (c === 'rate_limited') return fin('Une fenêtre d’enregistrement est déjà ouverte.');
        fin('L’enregistrement de fichiers n’est pas disponible ici. Essayez la version en ligne sur GitHub.');
      });
      return;
    }
    var blob = new Blob([texte], { type: 'application/json' });
    function lien() {
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = nom; a.style.display = 'none'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
    }
    // iPhone, iPad : la feuille de partage propose « Enregistrer dans Fichiers »
    var tactile = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
    try {
      var f = new File([blob], nom, { type: 'application/json' });
      if (tactile && navigator.canShare && navigator.canShare({ files: [f] })) {
        navigator.share({ files: [f], title: nom }).then(function () { fin('Fichier enregistré : ' + nom); }, function (e) { if (!e || e.name !== 'AbortError') { lien(); fin('Fichier enregistré : ' + nom); } });
        return;
      }
    } catch (e) {}
    lien(); fin('Fichier enregistré : ' + nom);
  }
  function enregistrerFichier(fin) {
    if (!game) return;
    var s = game.state, pc = s.pc || {};
    var data = { format: 'express-minuit', version: 1, enregistre: new Date().toISOString(),
      resume: (CH[s.chapter || 'prologue'] || {}).short + ' · ' + (pc.name || '') + ' · ' + game.clock(), state: s };
    telecharger(nomFichier(), JSON.stringify(data), fin);
  }
  // lit un fichier de sauvegarde ; rappelle fin(etat, resume) ou fin(null, message d'erreur)
  function lireFichier(file, fin) {
    var r = new FileReader();
    r.onload = function () {
      var d = null; try { d = JSON.parse(r.result); } catch (e) {}
      var st = d && (d.state || d);
      if (!st || st.v !== 1 || !st.log || !CH[st.chapter || 'prologue'] || !(CH[st.chapter || 'prologue'].locations || {})[st.loc]) { fin(null, 'Ce fichier n’est pas une sauvegarde de L’Express de minuit.'); return; }
      fin(st, (d && d.resume) || '');
    };
    r.onerror = function () { fin(null, 'Le fichier n’a pas pu être lu.'); };
    r.readAsText(file);
  }
  var apresChoix = null;
  function choisirFichier(fin) {
    var inp = $('fichierSauvegarde'); apresChoix = fin; inp.value = ''; inp.click();
  }
  function chargerEtat(st, resume) {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    closePanels(); hideTitle(); mount(st);
    game.api.sys('Sauvegarde chargée' + (resume ? ' : ' + resume : '') + '.');
    render();
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function rich(s) {
    return esc(s).replace(/⟦([^|⟧]*)\|([^⟧]*)⟧/g, function (m, a, b) {
      return '<span class="hallu">' + a + '</span>' + (b ? ' <span class="real">' + b + '</span>' : '');
    });
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function scrollDown() { logEl.scrollTop = logEl.scrollHeight; }
  function btn(label, cls, onClick) {
    var b = document.createElement('button'); b.type = 'button'; b.className = (cls && /^(act|ghost)/.test(cls)) ? cls : 'chip' + (cls ? ' ' + cls : ''); b.innerHTML = label;
    b.addEventListener('click', onClick); return b;
  }
  function needFor(target, diff) { return diff === 'difficile' ? Math.floor(target / 2) : diff === 'extreme' ? Math.floor(target / 5) : target; }

  // ---------------------------------------------------------------- construction des entrées
  function build(e) {
    var d = document.createElement('div');
    d.className = 'e-' + e.t;
    switch (e.t) {
      case 'title': d.innerHTML = '<div class="t">' + esc(e.x) + '</div><div class="s">' + esc(e.sub) + '</div>'; break;
      case 'narr': case 'event': case 'intrusion': d.innerHTML = rich(e.x); break;
      case 'player': d.textContent = e.x; if (e.said) d.classList.add('said'); if (e.mj) { d.classList.add('mj'); d.title = e.chip || ''; } break;
      case 'npc': d.dataset.who = e.who; d.innerHTML = '<span class="who">' + esc(e.name) + '</span>' + rich(e.x); break;
      case 'sys': case 'push': case 'item': d.textContent = e.x; break;
      case 'ask': d.textContent = (e.san >= 3 && Math.random() < 0.25) ? 'Qu’avez-vous fait ?' : e.x; break;
      case 'loc': d.textContent = e.name; break;
      case 'doc': var dh = docHTML(e); d.classList.add(dh.cls); d.innerHTML = dh.html; break;
      case 'clue': d.innerHTML = '<div class="h">Nouvel indice · noté dans le carnet</div><div class="t">' + esc(e.title) + '</div><div class="x">' + esc(e.x) + '</div>'; break;
      case 'stat': d.textContent = (e.stat === 'Mythe' ? 'Mythe de Cthulhu' : e.stat) + ' ' + (e.d > 0 ? '+' : '') + e.d + ' → ' + e.v; if (e.stat === 'Mythe') d.className = 'e-san'; break;
      case 'san': d.textContent = e.d ? 'Santé mentale ' + (e.d > 0 ? '+' : '') + e.d + ' → ' + e.v : 'Santé mentale : aucune perte'; if (!e.d) d.classList.add('none'); if (e.d > 0) d.classList.add('gain'); break;
      case 'check':
        lastCheck = e;
        var need = needFor(e.target, e.diff);
        d.innerHTML = '<div class="h">Jet demandé' + (e.pushed ? ' · jet forcé' : '') + '</div><div class="sk">' + esc(e.skill) + (e.why ? ' : ' + esc(e.why) : '') + '</div>' +
          '<div class="th">Il faut faire <b>' + need + '</b> ou moins' + (e.diff !== 'normal' ? ' (' + esc(e.diff) + ')' : '') + ' · majeure ' + Math.floor(e.target / 2) + ' · extrême ' + Math.floor(e.target / 5) + '</div>';
        break;
      case 'roll':
        d.classList.add(e.success ? 'ok' : 'ko');
        var sub = esc(e.skill) + ' ' + e.target + ' %' + (e.diff !== 'normal' ? ' · ' + esc(e.diff) : '') + (e.pushed ? ' · forcé' : '') + (!e.success && e.level >= 2 ? ' · pas assez pour un jet ' + esc(e.diff) : '');
        d.innerHTML = '<div class="num">' + (e.r === 100 ? '100' : pad(e.r)) + '</div><div><div class="res">' + esc(e.levelName) + '</div><div class="sub">' + sub + '</div></div>';
        break;
      case 'chips':
        d.className = 'e-chips';
        e.list.forEach(function (c) { d.appendChild(btn(esc(c.label), '', function () { act(function () { game.choose(c); }); })); });
        break;
      case 'end': d.appendChild(endCard()); break;
      default: return null;
    }
    return d;
  }
  // ---------------------------------------------------------------- d'un chapitre à l'autre
  // La campagne se joue dans l'ordre, avec le même investigateur. Un chapitre fini laisse un « passé » (pc.passe) :
  // sa date de fin, ses indices, ses documents, les gens rencontrés et quelques faits que le chapitre suivant lira
  // (SC.memoire). Le chapitre suivant ne s'ouvre qu'avec un investigateur qui a fini le précédent.
  function suiteOuverte(s) {
    var suite = SC.suite && CH[SC.suite], fin = s.flags && s.flags.fin;
    return !!(suite && s.ended && (!fin || fin === 'fugitif'));
  }
  function investigateurSuivant(s) {
    var pc = JSON.parse(JSON.stringify(s.pc)), f = s.flags || {}, drapeaux = {};
    (SC.memoire || []).forEach(function (k) { if (f[k] !== undefined && f[k] !== null && typeof f[k] !== 'object') drapeaux[k] = f[k]; });
    var carnet = s.clues.map(function (id) { var c = SC.clues[id]; if (!c) return null; if (SC.clueView) c = SC.clueView(s, id, c); return { title: c.title, text: c.text }; }).filter(Boolean);
    var docs = (s.docs || []).slice(), vus = {}; docs.forEach(function (d) { vus[d.x] = 1; });
    s.log.forEach(function (e) { if (e.t === 'doc' && !vus[e.x]) { vus[e.x] = 1; docs.push({ x: e.x, title: e.title || '' }); } });
    var P = SC.people || {}, gens = Object.keys(s.npcs).filter(function (k) { return s.npcs[k].met && P[k]; }).map(function (k) { return P[k]; });
    pc.inv = s.inv.slice(); pc.money = s.money;
    pc.passe = Object.assign({}, pc.passe || {});
    pc.passe[s.chapter] = { titre: SC.short || s.chapter, fin: f.fin || 'ok', min: s.min, quand: game.clock(), indices: s.clues.slice(), carnet: carnet, docs: docs, gens: gens, drapeaux: drapeaux };
    return pc;
  }
  function lireProgression() { try { return JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { return {}; } }
  // on garde, par chapitre ouvert, chaque investigateur qui y est arrivé (le dernier passage l'emporte)
  function noterProgression(chap, pc) {
    var p = lireProgression(), k = pc.key || pc.name || 'pj';
    p[chap] = p[chap] || {}; p[chap][k] = pc;
    try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {}
  }
  function enAttente(chap) { var p = lireProgression()[chap] || {}; return Object.keys(p).map(function (k) { return p[k]; }); }
  function boutonSuite() {
    var s = game.state;
    if (!suiteOuverte(s)) return null;
    var suite = SC.suite, pc = investigateurSuivant(s);
    noterProgression(suite, pc);
    return btn('Continuer : ' + (CH[suite].short || 'la suite'), 'act', function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      closePanels(); mount(null, suite, JSON.parse(JSON.stringify(pc)));
    });
  }
  function endCard() {
    var s = game.state, wrap = document.createElement('div');
    var myth = s.pc.skills['Mythe de Cthulhu'] || 0;
    var E = (SC.endingFor && SC.endingFor(s)) || SC.ending || { title: 'Fin du chapitre', text: 'Ce prototype s’arrête ici. La suite attend à Lausanne, sur les rives du Léman.' };
    wrap.innerHTML = '<div class="t">' + esc(E.title) + '</div><dl>' +
      '<dt>Indices</dt><dd>' + s.clues.length + ' / ' + Object.keys(SC.clues).length + '</dd>' +
      '<dt>Santé mentale</dt><dd>' + s.pc.san + ' / ' + s.pc.sanStart + ' · ' + esc(game.api.sanLabel()) + '</dd>' +
      '<dt>Mythe de Cthulhu</dt><dd>' + myth + ' %</dd>' +
      '<dt>Heure</dt><dd>' + esc(game.clock()) + '</dd>' +
      '<dt>Tours</dt><dd>' + s.turn + '</dd></dl>' +
      '<div>' + esc(E.text) + '</div>';
    var bs = boutonSuite();
    if (bs) { bs.style.marginTop = '10px'; wrap.appendChild(bs); }
    var b = btn('Rejouer le chapitre', bs ? 'ghost' : 'act', function () { newGame(); });
    b.style.marginTop = '10px';
    wrap.appendChild(b);
    return wrap;
  }

  // ---------------------------------------------------------------- machine à écrire
  function typeIn(el, done) {
    var nodes = [];
    (function walk(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) nodes.push(c);
        else if (!(c.classList && c.classList.contains('who'))) walk(c);
      }
    })(el);
    var texts = nodes.map(function (n) { return n.nodeValue; });
    nodes.forEach(function (n) { n.nodeValue = ''; });
    var i = 0, count = 0;
    el._finish = function () { nodes.forEach(function (n, k) { n.nodeValue = texts[k]; }); };
    typingTimer = setInterval(function () {
      var budget = 6;
      while (budget > 0 && i < nodes.length) {
        var full = texts[i], cur = nodes[i].nodeValue.length, take = Math.min(budget, full.length - cur);
        nodes[i].nodeValue = full.slice(0, cur + take); budget -= take;
        if (nodes[i].nodeValue.length >= full.length) i++;
      }
      count += 6;
      if (count % 36 === 0) sound.blip('key');
      scrollDown();
      if (i >= nodes.length) { clearInterval(typingTimer); typingTimer = null; done(); }
    }, 16);
  }
  var TYPED = { narr: 1, npc: 1, event: 1, intrusion: 1, sys: 1, push: 1 };

  // ---------------------------------------------------------------- les illustrations dans le fil
  // Le décor quand on arrive quelque part, le portrait quand quelqu'un prend la parole : même le clavier ouvert,
  // même loin du haut de la page, on voit où l'on est et à qui l'on parle. La clé de l'image est notée sur l'entrée
  // du journal (e.img, e.pt) pour qu'une partie rechargée retrouve les mêmes images.
  var dernierPortrait = null;
  // L'image d'en-tête est-elle à l'écran ? (sur iPhone, le clavier ouvert la fait sortir de la partie visible)
  // Si oui, c'est elle qui change : pas de seconde image dans le fil.
  function enteteVisible() {
    // (offsetParent ne convient pas : il est nul pour l'image en fond, fixée à l'écran, sur l'iPad en paysage)
    var st = document.querySelector('.stage'); if (!st || !st.getClientRects().length || getComputedStyle(st).visibility === 'hidden') return false;
    var r = st.getBoundingClientRect(); if (r.height < 40) return false;
    var vv = window.visualViewport, haut = vv ? vv.offsetTop : 0, h = vv ? vv.height : window.innerHeight;
    return Math.min(r.bottom, haut + h) - Math.max(r.top, haut) >= r.height * 0.6;
  }
  function cleImage(scene, loc) {
    var s = game.state;
    try { return art.photoKey(scene, { san: 0, min: s.min, loc: loc, flags: s.flags || {} }) || ''; } catch (err) { return ''; }
  }
  function carteImage(key, nom, cls) {
    var d = document.createElement('div');
    d.className = 'e-vue ' + cls;
    var im = document.createElement('img');
    im.alt = 'Illustration : ' + nom; im.decoding = 'async'; im.src = (window.PHOTO_BASE || 'img/') + key + '.webp';
    im.onerror = function () { if (d.parentNode) d.parentNode.removeChild(d); };
    d.appendChild(im);
    return d;
  }
  function vueDe(e) {
    if (!art || !art.photoKey || art.photos === false) return null;
    if (e.t === 'loc' || e.t === 'title') {
      dernierPortrait = null;
      var lieu = e.t === 'loc' ? e.loc : game.state.loc, L = SC.locations[lieu] || {};
      // (une vieille sauvegarde, relue d'un coup : pas d'images pour tout l'historique)
      // l'en-tête montre ce décor (sauf si l'on parle déjà à quelqu'un : il montre alors son portrait)
      if (e.img === undefined) e.img = (instant || (!game.state.talk && enteteVisible())) ? '' : cleImage(L.art || lieu, lieu);
      return e.img ? carteImage(e.img, e.name || L.name || '', 'lieu') : null;
    }
    if (e.t === 'npc') {
      // l'en-tête montre le portrait de l'interlocuteur : un autre personnage qui intervient garde le sien dans le fil
      if (e.pt === undefined) e.pt = (instant || e.who === dernierPortrait || !art['pt_' + e.who] || (game.state.talk === e.who && enteteVisible())) ? '' : cleImage('pt_' + e.who, game.state.loc);
      dernierPortrait = e.who;
      return e.pt ? carteImage(e.pt, e.name || '', 'portrait') : null;
    }
    return null;
  }

  function pump() {
    if (current) return;
    var e = queue.shift();
    if (!e) { settle(); return; }
    if (e.t === 'fx') { doFx(e.fx); pump(); return; }
    if (e.t === 'ui') { openPanel(e.open === 'sheet' ? 'ovSheet' : 'ovNotes'); pump(); return; }
    if (e.t === 'loc') { var L = SC.locations[e.loc]; if (art && !game.state.talk) art.set(L.art || e.loc); sound.blip('door'); }
    if (e.t === 'player') { var old = logEl.querySelectorAll('.e-chips:not(.old)'); for (var k = 0; k < old.length; k++) old[k].classList.add('old'); }
    if (e.t === 'clue') sound.blip('clue');
    if (e.t === 'san' && e.d < 0) sound.blip('san');
    // le temps de réfléchir : avant la première réplique d'un personnage, trois points, comme quelqu'un qui cherche ses mots
    if (e.t === 'npc' && !instant && !reduce && !e._waited && /«/.test(e.x) && lastKind === 'player') {
      e._waited = true;
      var dots = document.createElement('div');
      dots.className = 'e-npc e-typing';
      dots.innerHTML = '<span class="who">' + esc(e.name) + '</span><span class="dots"><i></i><i></i><i></i></span>';
      logEl.appendChild(dots); scrollDown();
      var plain = String(e.x).replace(/<[^>]+>/g, ''), wait = 380 + Math.min(1000, plain.length * 4) + Math.floor(Math.random() * 260);
      current = dots;
      dots._finish = function () { if (dots.parentNode) dots.parentNode.removeChild(dots); queue.unshift(e); };
      typingTimer = setTimeout(function () { typingTimer = null; current = null; dots._finish(); pump(); }, wait);
      return;
    }
    lastKind = e.t === 'chips' || e.t === 'ask' ? lastKind : e.t;
    var el = build(e);
    if (!el) { pump(); return; }
    logEl.appendChild(el);
    // l'image dans le fil : après le nom du lieu, ou juste avant la première réplique de quelqu'un
    var vue = vueDe(e);
    if (vue) { if (e.t === 'npc') logEl.insertBefore(vue, el); else logEl.appendChild(vue); }
    scrollDown();
    if (TYPED[e.t] && !instant && !reduce) {
      current = el;
      typeIn(el, function () { current = null; pump(); });
    } else pump();
  }
  function skip() {
    if (!current && !queue.length) return;
    instant = true;
    if (current) { clearInterval(typingTimer); clearTimeout(typingTimer); typingTimer = null; var cf = current; current = null; if (cf._finish) cf._finish(); }
    pump();
    instant = false;
  }
  function render(silent) {
    var s = game.state;
    s.log.forEach(function (e) { if (e.n > rendered) { queue.push(e); rendered = e.n; } });
    if (silent) { instant = true; pump(); instant = false; } else pump();
    refresh();
  }
  function settle() { refresh(); scrollDown(); save(); }

  // ---------------------------------------------------------------- effets
  function doFx(name) {
    if (instant && queue.length > 30) return;
    var app = $('app');
    if (name === 'shudder') { app.classList.remove('shudder'); void app.offsetWidth; app.classList.add('shudder'); art.trigger('shudder', 0.8); setTimeout(function () { app.classList.remove('shudder'); }, 800); }
    else if (name === 'madness') { app.classList.add('madness'); art.trigger('madness', 1.8); setTimeout(function () { app.classList.remove('madness'); }, 1700); }
    else if (name === 'flicker') art.trigger('flicker', 1.6);
    else if (name === 'face') art.trigger('face', 1.3);
    else if (name === 'blackout') art.trigger('blackout', 3.2);
  }

  // ---------------------------------------------------------------- en-tête, jauges, barre d'actions
  function meter(id, v, max) {
    var m = $(id), on = Math.max(0, Math.min(10, Math.round(v / max * 10))), h = '';
    for (var i = 0; i < 10; i++) h += '<i class="' + (i < on ? 'on' : '') + '"></i>';
    m.innerHTML = h;
  }
  function refresh() {
    var s = game.state, pc = s.pc, L = SC.locations[s.loc];
    var st = game.sanState();
    document.body.dataset.san = st;
    $('locName').textContent = L.name;
    $('clock').textContent = game.clock();
    $('where').textContent = game.where();
    $('clueCount').textContent = s.clues.length + '/' + Object.keys(SC.clues).length;
    $('sPV').textContent = pc.pv + '/' + pc.pvMax; meter('mPV', pc.pv, pc.pvMax);
    $('sPM').textContent = pc.pm; meter('mPM', pc.pm, pc.pmMax);
    $('sSAN').textContent = pc.san; meter('mSAN', pc.san, pc.sanStart);
    $('sSanState').textContent = game.api.sanLabel();
    $('sCH').textContent = pc.chance; meter('mCH', pc.chance, 99);
    $('turnInfo').textContent = 'Tour ' + s.turn;
    if (art) {
      art.state = { san: st, min: s.min, loc: s.loc, flags: Object.assign({}, s.flags, { servietteTaken: s.inv.indexOf('La serviette de Ravel') >= 0 }) };
      // en conversation, le portrait du personnage ; sinon, le décor
      var want = (s.talk && art['pt_' + s.talk]) ? 'pt_' + s.talk : (L.art || s.loc);
      if (!s.ended && art.scene !== want) art.set(want);
    }
    sound.set(s.loc, st);
    var input = $('cmd');
    input.placeholder = s.ended ? 'Fin du chapitre' : s.pending ? 'Lancez les dés…' : s.talk ? 'Que dites-vous ?' : 'Que faites-vous ?';
    input.disabled = !!s.ended;
    $('go').disabled = !!s.ended; $('goDire').disabled = !!s.ended || !!s.pending;
    // le bouton mis en avant est celui de la touche Entrée
    var enDire = !!s.talk && !s.pending;
    $('goDire').className = (enDire ? 'act' : 'ghost') + ' dire'; $('go').className = enDire ? 'ghost' : 'act';
    input.setAttribute('enterkeyhint', 'send');
    actions();
  }
  function actions() {
    var s = game.state, bar = $('actions');
    bar.innerHTML = '';
    if (s.ended) { var bsu = boutonSuite(); if (bsu) bar.appendChild(bsu); bar.appendChild(btn('Rejouer le chapitre', bsu ? 'ghost' : 'hot', newGame)); return; }
    if (s.pending) {
      var c = lastCheck, need = c ? needFor(c.target, c.diff) : '';
      bar.appendChild(btn('Lancer les dés' + (c ? ' · <b>' + esc(c.skill) + ' ' + need + '</b>' : ''), 'hot', doRoll));
      return;
    }
    if (s.pendingPush) {
      bar.appendChild(btn('Insister (jet forcé)', 'hot', function () { act(function () { game.push(); }); }));
      bar.appendChild(btn('Laisser tomber', '', function () { act(function () { game.declinePush(); }); }));
      return;
    }
    if (s.talk) {
      // les sujets restent repliés : on parle librement, et on ne les déplie que si l'on sèche
      var tb = btn(ideasOpen ? 'Sujets ▾' : 'Sujets ▸', '', function () { ideasOpen = !ideasOpen; actions(); });
      tb.setAttribute('aria-pressed', ideasOpen ? 'true' : 'false');
      bar.appendChild(tb);
      if (ideasOpen) game.topicChips().forEach(function (t) { bar.appendChild(btn(esc(t.label), '', function () { act(function () { game.choose({ label: t.label, topic: t.topic }); }); })); });
      else { var h2 = document.createElement('span'); h2.className = 'label'; h2.textContent = '« Dire » : vos paroles · « Agir » : vos gestes'; bar.appendChild(h2); }
      return;
    }
    var ib = btn(ideasOpen ? 'Idées ▾' : 'Idées ▸', '', function () { ideasOpen = !ideasOpen; actions(); });
    ib.setAttribute('aria-pressed', ideasOpen ? 'true' : 'false');
    bar.appendChild(ib);
    if (ideasOpen) game.ideas(4).forEach(function (i) { bar.appendChild(btn(esc(i.label), '', function () { act(function () { game.choose(i); }); })); });
    else { var hint = document.createElement('span'); hint.className = 'label'; hint.textContent = '« Agir » : ce que vous faites · « Dire » : ce que vous dites'; bar.appendChild(hint); }
  }

  function act(fn) {
    if (busy) return;
    skip();
    ideasOpen = false;
    fn();
    render();
    if (window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) $('cmd').focus();
  }

  // ---------------------------------------------------------------- dés
  function doRoll() {
    if (busy || !game.state.pending) return;
    skip();
    busy = true;
    var c = lastCheck;
    var entry = game.roll();
    if (!entry) { busy = false; render(); return; }
    var ov = $('ovDice'), dT = $('dT'), dU = $('dU'), res = $('diceRes');
    $('diceSkill').textContent = (c ? c.skill + ' · il faut ' + needFor(c.target, c.diff) + ' ou moins' : '');
    res.textContent = ''; res.style.color = '';
    ov.hidden = false;
    sound.blip('dice');
    var spins = reduce ? 0 : 12, k = 0;
    dT.classList.toggle('spin', !reduce); dU.classList.toggle('spin', !reduce);
    var iv = setInterval(function () {
      if (k++ < spins) { dT.textContent = pad(Math.floor(Math.random() * 10) * 10); dU.textContent = String(Math.floor(Math.random() * 10)); return; }
      clearInterval(iv);
      dT.classList.remove('spin'); dU.classList.remove('spin');
      dT.textContent = pad(entry.tens); dU.textContent = String(entry.units);
      res.textContent = entry.r + ' · ' + entry.levelName;
      res.style.color = entry.success ? '#7dffb0' : '#ff5c4a';
      sound.blip(entry.success ? 'success' : 'fail');
      setTimeout(function () { ov.hidden = true; busy = false; render(); }, reduce ? 500 : 950);
    }, 60);
  }

  // ---------------------------------------------------------------- fenêtres
  function openPanel(id) {
    if (id === 'ovSheet') fillSheet();
    if (id === 'ovNotes') fillNotes();
    if (id === 'ovMenu') fillMenu();
    var ov = $(id); ov.hidden = false;
    var b = ov.querySelector('[data-close]'); if (b) b.focus();
  }
  function closePanels() { ['ovSheet', 'ovNotes', 'ovMenu'].forEach(function (id) { $(id).hidden = true; }); }
  function fillSheet() {
    var pc = game.state.pc, s = game.state;
    var pk = pc.key || (/Arnaud/.test(pc.name || '') ? 'arnaud' : '');
    var h = (pk ? '<div class="sheet-img" style="background-image:url(img/portraits/pj_' + pk + '.webp)"></div>' : '') + '<div class="sheet-head"><div class="n">' + esc(pc.name) + '</div><div class="o">' + esc(pc.occupation) + ' · ' + pc.age + ' ans · ' + esc(pc.origin) + '</div></div>';
    h += '<h3>Caractéristiques</h3><div class="carac">';
    Object.keys(pc.carac).forEach(function (k) { var v = pc.carac[k]; h += '<div><div class="k">' + k.replace('EDU', 'ÉDU') + '</div><div class="v">' + v + ' <small>' + Math.floor(v / 2) + '/' + Math.floor(v / 5) + '</small></div></div>'; });
    h += '</div><div class="derived">' +
      '<div><div class="k">Points de vie</div>' + pc.pv + ' / ' + pc.pvMax + '</div>' +
      '<div><div class="k">Points de magie</div>' + pc.pm + ' / ' + pc.pmMax + '</div>' +
      '<div><div class="k">Santé mentale</div>' + pc.san + ' / ' + pc.sanMax + '</div>' +
      '<div><div class="k">État</div>' + esc(game.api.sanLabel()) + '</div>' +
      '<div><div class="k">Chance</div>' + pc.chance + '</div>' +
      '<div><div class="k">Mouvement</div>' + pc.mvt + '</div></div>';
    h += '<h3>Compétences</h3><div class="skills">';
    Object.keys(pc.skills).sort(function (a, b) { return a.localeCompare(b, 'fr'); }).forEach(function (k) { var v = pc.skills[k]; h += '<span>' + esc(k) + '</span><span>' + v + ' % <small>' + Math.floor(v / 2) + '/' + Math.floor(v / 5) + '</small></span>'; });
    h += '</div><h3>Possessions</h3><div>' + s.inv.map(function (x) { return esc(SC && SC.invLabel ? SC.invLabel(game.api, x) : x); }).join('<br>') + '<br>' + esc(game.api.money()) + '</div>';
    $('sheetBody').innerHTML = h;
  }
  function fillNotes() {
    var s = game.state, h = '';
    // les papiers réunis : en tête du carnet, repliés, on les déplie pour relire
    var docs = (s.docs || []).slice(), vus = {};
    docs.forEach(function (d) { vus[d.x] = 1; });
    s.log.forEach(function (e) { if (e.t === 'doc' && !vus[e.x]) { vus[e.x] = 1; docs.push(e); } });
    var anciens = (s.pc && s.pc.passe) || {};
    Object.keys(anciens).forEach(function (ch) { (anciens[ch].docs || []).forEach(function (d) { if (!vus[d.x]) { vus[d.x] = 1; docs.push(d); } }); });
    if (docs.length) h += '<h3>Documents</h3><div class="docs">' + docs.map(function (e) {
      var dh = docHTML(e), k = dh.cls.slice(2), m = (e.x || '').match(/^([^—]{6,90}?) — /);
      var lib = (k === 'journal' || k === 'page') && m ? m[1] : (e.title || (k === 'roussie' ? 'Adressée à un professeur' : DOC_TITRE[k]));
      return '<details class="doc-fold"><summary><span class="dk">' + esc(DOC_TITRE[k]) + '</span><span class="dt">' + esc(lib === DOC_TITRE[k] ? 'Sans titre' : lib) + '</span></summary><div class="e-doc ' + dh.cls + '">' + dh.html + '</div></details>';
    }).join('') + '</div>';
    h += '<h3>Indices</h3><div class="clues">';
    Object.keys(SC.clues).forEach(function (id) {
      var c = SC.clues[id];
      if (SC.clueView && s.clues.indexOf(id) >= 0) c = SC.clueView(s, id, c);
      h += s.clues.indexOf(id) >= 0 ? '<div class="c"><div class="t">' + esc(c.title) + '</div><div class="x">' + esc(c.text) + '</div></div>' : '<div class="c unk">Indice non découvert</div>';
    });
    Object.keys(anciens).forEach(function (ch) {
      var a = anciens[ch]; if (!a.carnet || !a.carnet.length) return;
      h += '</div><h3>Indices · ' + esc(a.titre || ch) + '</h3><div class="clues">' + a.carnet.map(function (c) { return '<div class="c"><div class="t">' + esc(c.title) + '</div><div class="x">' + esc(c.text) + '</div></div>'; }).join('');
    });
    var scr = SC.notesScrawl ? SC.notesScrawl(s) : [];
    if (scr.length) h += '</div><h3>En marge, de votre écriture</h3><div class="scrawl">' + scr.map(esc).join('<br>');
    h += '</div><h3>Personnes rencontrées</h3><div class="people">';
    var PEOPLE = SC.people || {};
    var met = Object.keys(s.npcs).filter(function (k) { return s.npcs[k].met && PEOPLE[k]; });
    h += met.length ? met.map(function (k) { return '<div>' + esc(PEOPLE[k]) + '</div>'; }).join('') : '<div>Personne pour l’instant.</div>';
    Object.keys(anciens).forEach(function (ch) { var g = anciens[ch].gens || []; if (g.length) h += '<div class="ancien"><b>' + esc(anciens[ch].titre || ch) + ' :</b> ' + g.map(esc).join(' · ') + '</div>'; });
    h += '</div><h3>Heure</h3><div>' + esc(game.clock()) + ' · ' + esc(game.where()) + '</div>';
    $('notesBody').innerHTML = h;
  }
  function fillMenu() {
    var body = $('menuBody'); body.innerHTML = '';
    var list = document.createElement('div'); list.className = 'menu-list';
    list.appendChild(btn('Reprendre la partie', 'act', closePanels));
    var confirmNew = false;
    var nb = btn('Nouvelle partie', 'ghost', function () {
      if (!confirmNew) { confirmNew = true; nb.innerHTML = 'Confirmer : effacer la partie en cours'; return; }
      closePanels(); try { localStorage.removeItem(KEY); } catch (e) {} showTitle();
    });
    list.appendChild(nb);
    var msg = document.createElement('p'); msg.className = 'menu-msg'; msg.hidden = true;
    list.appendChild(btn('Enregistrer dans un fichier', 'ghost', function () {
      enregistrerFichier(function (t) { msg.textContent = t; msg.hidden = !t; msg.classList.toggle('ok', /^Fichier/.test(t)); });
    }));
    list.appendChild(btn('Charger un fichier de sauvegarde', 'ghost', function () {
      choisirFichier(function (st, info) { if (!st) { msg.textContent = info; msg.hidden = false; msg.classList.remove('ok'); return; } chargerEtat(st, info); });
    }));
    list.appendChild(msg);
    var sb = btn('Son : ' + (soundOn ? 'oui' : 'non'), 'ghost', function () { toggleSound(); sb.innerHTML = 'Son : ' + (soundOn ? 'oui' : 'non'); });
    list.appendChild(sb);
    var mb = btn('Musique : ' + (musicOn ? 'oui' : 'non'), 'ghost', function () { toggleMusic(); mb.innerHTML = 'Musique : ' + (musicOn ? 'oui' : 'non'); });
    list.appendChild(mb);
    if (pleinEcranPossible()) { var fb = btn('Plein écran : ' + (pleinEcranVoulu() ? 'oui' : 'non'), 'ghost', function () { fb.innerHTML = 'Plein écran : ' + (basculerPleinEcran() ? 'oui' : 'non'); }); list.appendChild(fb); }
    body.appendChild(list);
    var help = document.createElement('div'); help.className = 'help';
    help.innerHTML = '<h3>Comment jouer</h3><p>Écrivez ce que fait ' + esc(game.state.pc.name) + ', comme vous le diriez à un meneur de jeu : ' + esc(SC.examples || '« j’examine la table », « je parle au serveur »') + '. En conversation, parlez librement : « pourquoi ? », « et ensuite ? ». Les fautes de frappe sont tolérées.</p>' +
      '<p><b>Dire</b> envoie vos paroles, mot pour mot : le personnage les entend, et aucun geste n’en sort (« je vous étrangle », dit tout haut, n’est qu’une menace). <b>Agir</b> envoie ce que vous faites : « j’examine la table », « je sors », « je lui demande où est Ravel ». La touche Entrée utilise le bouton mis en avant : Dire en conversation, Agir le reste du temps.</p>' +
      '<p>Quand un jet est demandé, lancez les dés : il faut faire moins que la compétence. Une réussite majeure (moitié) ou extrême (cinquième) donne parfois plus. Après certains échecs, vous pouvez insister : c’est un jet forcé, et un nouvel échec coûte plus cher.</p>' +
      '<p>Surveillez votre santé mentale. Plus elle baisse, moins ce que vous lisez est sûr.</p>' +
      '<h3>À propos</h3><p>Prototype de jeu de rôle textuel entièrement scripté : analyseur de phrases tolérant aux fautes, dés d100, dialogues à sujets et relances, horloge, relances du meneur quand on s’égare, sauvegarde automatique dans ce navigateur. Aucune IA ne répond pendant la partie.</p>';
    body.appendChild(help);
  }
  function toggleMusic() {
    musicOn = !musicOn;
    try { localStorage.setItem(SKEY + ':music', musicOn ? 'on' : 'off'); } catch (e) {}
    sound.setMusic(musicOn);
    if (musicOn && soundOn && !sound.on) sound.start();
    $('btnMusic').textContent = 'Musique : ' + (musicOn ? 'oui' : 'non');
    $('btnMusic').setAttribute('aria-pressed', musicOn ? 'true' : 'false');
  }
  function toggleSound() {
    soundOn = !soundOn;
    try { localStorage.setItem(SKEY, soundOn ? 'on' : 'off'); } catch (e) {}
    if (soundOn) sound.start(); else sound.stop();
    $('btnSound').textContent = 'Son : ' + (soundOn ? 'oui' : 'non');
    $('btnSound').setAttribute('aria-pressed', soundOn ? 'true' : 'false');
  }

  // ---------------------------------------------------------------- partie
  function pregen(chap, key) {
    var c = CH[chap]; if (!c || !c.pregens) return null;
    return c.pregens.find(function (p) { return p.key === key; }) || null;
  }
  function mount(saved, chap, pc) {
    if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    logEl.innerHTML = ''; rendered = 0; queue = []; current = null; lastCheck = null; lastKind = null;
    chap = saved ? (saved.chapter || 'prologue') : (chap || 'prologue');
    SC = CH[chap] || window.SCENE;
    game = window.RPG.createGame(SC, saved || null, pc ? { pc: pc } : {});
    // l'investigateur tel qu'il est entré dans ce chapitre : « Rejouer le chapitre » repart de lui
    if (!saved && pc && SC.precedent) game.state.depart = JSON.parse(JSON.stringify(pc));
    window.__partie = game; // pour les tests automatiques
    var s = game.state;
    document.title = 'L’Express de minuit · ' + (SC.chapter || '');
    if (saved) {
      for (var i = s.log.length - 1; i >= 0; i--) if (s.log[i].t === 'check') { lastCheck = s.log[i]; break; }
      art.scene = SC.locations[s.loc].art; art.trans = 0;
      render(true);
    } else {
      art.set(SC.locations[SC.start.loc].art || SC.start.loc);
      render();
    }
  }
  // rejouer le même chapitre, avec le même investigateur
  function newGame() {
    var chap = game ? game.state.chapter : 'prologue', key = game && game.state.pc.key, dep = game && game.state.depart;
    try { localStorage.removeItem(KEY); } catch (e) {}
    closePanels(); mount(null, chap, dep ? JSON.parse(JSON.stringify(dep)) : pregen(chap, key));
  }
  // ---------------------------------------------------------------- plein écran
  // Le navigateur n'accorde le plein écran qu'après un geste du joueur : on le demande chaque fois qu'on quitte
  // l'écran-titre (préférence « Plein écran » du menu). Sur iPhone et iPad, Safari ne le permet pas pour une page
  // où l'on tape du texte : on y conseille d'installer le jeu sur l'écran d'accueil, d'où il s'ouvre sans barres.
  var FKEY = 'express-minuit-plein';
  // (« display-mode: fullscreen » vaut aussi pour une page mise en plein écran : ce n'est l'application installée que sans élément plein écran)
  function installe() { try { return !!(navigator.standalone || matchMedia('(display-mode: standalone)').matches || (matchMedia('(display-mode: fullscreen)').matches && !(document.fullscreenElement || document.webkitFullscreenElement))); } catch (e) { return false; } }
  function appareilApple() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function dansCadre() { try { return window.self !== window.top; } catch (e) { return true; } }
  function enPleinEcran() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function pleinEcranPossible() { return !installe() && !appareilApple() && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
  function pleinEcranVoulu() { try { return localStorage.getItem(FKEY) !== 'non'; } catch (e) { return true; } }
  function pleinEcran() {
    if (!pleinEcranPossible() || enPleinEcran() || !pleinEcranVoulu()) return;
    var el = document.documentElement;
    try { var r = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen && el.webkitRequestFullscreen(); if (r && r.catch) r.catch(function () {}); } catch (e) {}
  }
  function basculerPleinEcran() {
    var oui = !pleinEcranVoulu();
    try { localStorage.setItem(FKEY, oui ? 'oui' : 'non'); } catch (e) {}
    if (oui) pleinEcran();
    else if (enPleinEcran()) { try { var r = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen && document.webkitExitFullscreen(); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
    return oui;
  }
  function hideTitle() { $('title').hidden = true; pleinEcran(); if (soundOn) sound.start(); }
  function showTitle() {
    $('title').hidden = false; $('tpick').hidden = true; $('tmain').hidden = false;
    if ($('tinstall')) $('tinstall').hidden = !(appareilApple() && !installe() && !dansCadre());
    if ($('btnParis')) $('btnParis').hidden = !(CH.paris && enAttente('paris').length);
    var saved = loadSave();
    $('btnCont').hidden = !(saved && saved.v === 1);
    if (saved && saved.v === 1) $('btnCont').textContent = 'Continuer · ' + ((CH[saved.chapter || 'prologue'] || {}).short || 'partie en cours');
    var has = !!(saved && saved.v === 1);
    $('btnCont').className = has ? 'act' : 'ghost'; $('btnLondres').className = has ? 'ghost' : 'act';
    titleArt.trans = 0;
    if (sound.on) sound.set('title', 0);
  }
  function showPick(chap, suite) {
    var c = CH[chap], box = $('cards');
    box.innerHTML = '';
    (suite || c.pregens).forEach(function (p) {
      var card = document.createElement('div'); card.className = 'pcard';
      var top = Object.keys(p.skills).filter(function (k) { return p.skills[k] >= 45 && k !== 'Mythe de Cthulhu'; }).sort(function (a, b) { return p.skills[b] - p.skills[a]; }).slice(0, 5);
      var avant = suite && p.passe && p.passe[c.precedent];
      card.innerHTML = (p.key ? '<div class="pimg" style="background-image:url(img/portraits/pj_' + p.key + '.webp)"></div>' : '') + '<div class="pn">' + esc((p.title === 'Dr' ? 'Dr ' : '') + p.name) + '</div>' +
        '<div class="po">' + esc(p.occupation) + ' · ' + p.age + ' ans</div>' +
        (avant ? '<p class="pb">' + esc(avant.titre + ' : parti' + (p.sex === 'f' ? 'e' : '') + ' ' + String(avant.quand || '').replace(/^\S+\s/, 'le ').replace(/\s·.*/, '') + ' janvier, ' + avant.indices.length + ' indice' + (avant.indices.length > 1 ? 's' : '') + ' au carnet' + (avant.fin === 'fugitif' ? ', recherché' + (p.sex === 'f' ? 'e' : '') + ' par Scotland Yard' : '') + '.') + '</p>' : '<p class="pb">' + esc(p.bio) + '</p>') +
        '<div class="ps">' + top.map(function (k) { return '<span>' + esc(k) + ' <b>' + p.skills[k] + '</b></span>'; }).join('') + '</div>' +
        '<div class="pst"><span>SAN <b>' + p.san + '</b></span><span>PV <b>' + p.pv + '</b></span><span>Chance <b>' + p.chance + '</b></span></div>';
      card.appendChild(btn((suite ? 'Reprendre ' : 'Incarner ') + esc(p.first), 'act', function () { try { localStorage.removeItem(KEY); } catch (e) {} hideTitle(); mount(null, chap, JSON.parse(JSON.stringify(p))); }));
      box.appendChild(card);
    });
    $('tmain').hidden = true; $('tpick').hidden = false;
    $('tpick').scrollTop = 0;
  }

  // ---------------------------------------------------------------- boucle d'animation
  var lastT = 0, acc = 0;
  function loop(ts) {
    var dt = Math.min(0.1, (ts - lastT) / 1000 || 0); lastT = ts; acc += dt;
    var step = reduce ? 1 : 1 / 24;
    if (acc >= step && !document.hidden) {
      if (!$('title').hidden && titleArt) titleArt.frame(acc);
      else if (art) art.frame(acc);
      acc = 0;
    }
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------- événements
  // deux façons d'envoyer : « Dire » (les paroles du personnage, mot pour mot) et « Agir » (ce qu'il fait).
  // La touche Entrée envoie avec le bouton mis en avant : Dire en conversation, Agir le reste du temps.
  function modeParDefaut() { return game && game.state.talk && !game.state.pending ? 'dire' : 'agir'; }
  function envoyer(mode) {
    var v = $('cmd').value.trim();
    if (!v) { skip(); return; }
    if (busy) return;
    $('cmd').value = '';
    act(function () { game.step(v, mode); });
  }
  $('form').addEventListener('submit', function (ev) { ev.preventDefault(); envoyer(modeParDefaut()); });
  $('go').addEventListener('click', function () { envoyer('agir'); });
  $('goDire').addEventListener('click', function () { envoyer('dire'); });
  logEl.addEventListener('click', function (ev) { if (!ev.target.closest('button')) skip(); });
  $('btnSheet').addEventListener('click', function () { openPanel('ovSheet'); });
  $('btnNotes').addEventListener('click', function () { openPanel('ovNotes'); });
  $('btnMenu').addEventListener('click', function () { openPanel('ovMenu'); });
  document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closePanels); });
  document.querySelectorAll('.overlay').forEach(function (o) { o.addEventListener('click', function (ev) { if (ev.target === o && o.id !== 'ovDice') closePanels(); }); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closePanels(); });
  $('btnSound').addEventListener('click', function () { toggleSound(); if (!soundOn) sound.stop(); });
  $('btnSound').textContent = 'Son : ' + (soundOn ? 'oui' : 'non');
  $('btnSound').setAttribute('aria-pressed', soundOn ? 'true' : 'false');
  $('btnMusic').addEventListener('click', function () { toggleMusic(); });
  $('btnMusic').textContent = 'Musique : ' + (musicOn ? 'oui' : 'non');
  $('btnMusic').setAttribute('aria-pressed', musicOn ? 'true' : 'false');
  // le premier geste sur l'écran-titre lance la musique (les navigateurs l'exigent)
  $('title').addEventListener('pointerdown', function () { if (soundOn && !sound.on && !$('title').hidden) { sound.start(); sound.set('title', 0); } });

  function start(data) {
    art = new window.PixelArt($('art'), $('artBloom'));
    if (art.setWide) art.setWide(true); // l'image du jeu en format cinéma, sur toute la largeur
    titleArt = new window.PixelArt($('titleArt'), $('titleBloom'));
    titleArt.scene = 'brouillard'; titleArt.trans = 0;
    var hotState = data && data.state;
    var saved = hotState || loadSave();
    showTitle();
    $('btnLondres').addEventListener('click', function () { if (CH.londres) showPick('londres'); });
    if ($('btnParis')) $('btnParis').addEventListener('click', function () { var l = enAttente('paris'); if (CH.paris && l.length) showPick('paris', l); });
    $('btnProlo').addEventListener('click', function () { try { localStorage.removeItem(KEY); } catch (e) {} hideTitle(); mount(null, 'prologue'); });
    $('btnBack').addEventListener('click', function () { $('tpick').hidden = true; $('tmain').hidden = false; });
    $('fichierSauvegarde').addEventListener('change', function () {
      var f = this.files && this.files[0], fin = apresChoix; apresChoix = null;
      if (f && fin) lireFichier(f, fin);
    });
    $('btnCharger').addEventListener('click', function () {
      choisirFichier(function (st, info) { var m = $('tmsg'); if (!st) { m.textContent = info; m.hidden = false; return; } m.hidden = true; chargerEtat(st, info); });
    });
    $('btnCont').addEventListener('click', function () { var sv = loadSave() || saved; if (!sv) return; hideTitle(); mount(sv); });
    if (hotState) { $('title').hidden = true; mount(hotState); }
    else mount(saved && saved.v === 1 ? saved : null, saved ? saved.chapter : 'prologue');
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(function () { return { state: game ? game.state : null }; });
    requestAnimationFrame(loop);
  }
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
  else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
})();
