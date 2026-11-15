/* Interface : rendu du récit, dés, fiches, sauvegarde, ambiance. */
(function () {
  'use strict';
  var KEY = 'express-minuit-v1', SKEY = 'express-minuit-son';
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      case 'player': d.textContent = e.x; if (e.said) d.classList.add('said'); break;
      case 'npc': d.dataset.who = e.who; d.innerHTML = '<span class="who">' + esc(e.name) + '</span>' + rich(e.x); break;
      case 'sys': case 'push': case 'item': d.textContent = e.x; break;
      case 'ask': d.textContent = (e.san >= 3 && Math.random() < 0.25) ? 'Qu’avez-vous fait ?' : e.x; break;
      case 'loc': d.textContent = e.name; break;
      case 'doc': d.innerHTML = '<div class="h">' + esc(e.title) + '</div><div class="b">' + esc(e.x) + '</div>'; break;
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
    var b = btn('Rejouer le chapitre', 'act', function () { newGame(); });
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
    $('go').disabled = !!s.ended;
    actions();
  }
  function actions() {
    var s = game.state, bar = $('actions');
    bar.innerHTML = '';
    if (s.ended) { bar.appendChild(btn('Rejouer le chapitre', 'hot', newGame)); return; }
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
      var lab = document.createElement('span'); lab.className = 'label'; lab.textContent = 'Sujets'; bar.appendChild(lab);
      game.topicChips().forEach(function (t) { bar.appendChild(btn(esc(t.label), '', function () { act(function () { game.choose({ label: t.label, topic: t.topic }); }); })); });
      return;
    }
    var ib = btn(ideasOpen ? 'Idées ▾' : 'Idées ▸', '', function () { ideasOpen = !ideasOpen; actions(); });
    ib.setAttribute('aria-pressed', ideasOpen ? 'true' : 'false');
    bar.appendChild(ib);
    if (ideasOpen) game.ideas(4).forEach(function (i) { bar.appendChild(btn(esc(i.label), '', function () { act(function () { game.choose(i); }); })); });
    else { var hint = document.createElement('span'); hint.className = 'label'; hint.textContent = 'Écrivez librement, comme à une table de jeu'; bar.appendChild(hint); }
  }

  function act(fn) {
    if (busy) return;
    skip();
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
    var s = game.state, h = '<h3>Indices</h3><div class="clues">';
    Object.keys(SC.clues).forEach(function (id) {
      var c = SC.clues[id];
      if (SC.clueView && s.clues.indexOf(id) >= 0) c = SC.clueView(s, id, c);
      h += s.clues.indexOf(id) >= 0 ? '<div class="c"><div class="t">' + esc(c.title) + '</div><div class="x">' + esc(c.text) + '</div></div>' : '<div class="c unk">Indice non découvert</div>';
    });
    var scr = SC.notesScrawl ? SC.notesScrawl(s) : [];
    if (scr.length) h += '</div><h3>En marge, de votre écriture</h3><div class="scrawl">' + scr.map(esc).join('<br>');
    h += '</div><h3>Personnes rencontrées</h3><div class="people">';
    var PEOPLE = SC.people || {};
    var met = Object.keys(s.npcs).filter(function (k) { return s.npcs[k].met && PEOPLE[k]; });
    h += met.length ? met.map(function (k) { return '<div>' + esc(PEOPLE[k]) + '</div>'; }).join('') : '<div>Personne pour l’instant.</div>';
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
    var sb = btn('Son : ' + (soundOn ? 'oui' : 'non'), 'ghost', function () { toggleSound(); sb.innerHTML = 'Son : ' + (soundOn ? 'oui' : 'non'); });
    list.appendChild(sb);
    var mb = btn('Musique : ' + (musicOn ? 'oui' : 'non'), 'ghost', function () { toggleMusic(); mb.innerHTML = 'Musique : ' + (musicOn ? 'oui' : 'non'); });
    list.appendChild(mb);
    body.appendChild(list);
    var help = document.createElement('div'); help.className = 'help';
    help.innerHTML = '<h3>Comment jouer</h3><p>Écrivez ce que fait ' + esc(game.state.pc.name) + ', comme vous le diriez à un meneur de jeu : ' + esc(SC.examples || '« j’examine la table », « je parle au serveur »') + '. En conversation, parlez librement : « pourquoi ? », « et ensuite ? ». Les fautes de frappe sont tolérées.</p>' +
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
    var chap = game ? game.state.chapter : 'prologue', key = game && game.state.pc.key;
    try { localStorage.removeItem(KEY); } catch (e) {}
    closePanels(); mount(null, chap, pregen(chap, key));
  }
  function hideTitle() { $('title').hidden = true; if (soundOn) sound.start(); }
  function showTitle() {
    $('title').hidden = false; $('tpick').hidden = true; $('tmain').hidden = false;
    var saved = loadSave();
    $('btnCont').hidden = !(saved && saved.v === 1);
    if (saved && saved.v === 1) $('btnCont').textContent = 'Continuer · ' + ((CH[saved.chapter || 'prologue'] || {}).short || 'partie en cours');
    var has = !!(saved && saved.v === 1);
    $('btnCont').className = has ? 'act' : 'ghost'; $('btnLondres').className = has ? 'ghost' : 'act';
    titleArt.trans = 0;
    if (sound.on) sound.set('title', 0);
  }
  function showPick(chap) {
    var c = CH[chap], box = $('cards');
    box.innerHTML = '';
    c.pregens.forEach(function (p) {
      var card = document.createElement('div'); card.className = 'pcard';
      var top = Object.keys(p.skills).filter(function (k) { return p.skills[k] >= 45 && k !== 'Mythe de Cthulhu'; }).sort(function (a, b) { return p.skills[b] - p.skills[a]; }).slice(0, 5);
      card.innerHTML = (p.key ? '<div class="pimg" style="background-image:url(img/portraits/pj_' + p.key + '.webp)"></div>' : '') + '<div class="pn">' + esc((p.title === 'Dr' ? 'Dr ' : '') + p.name) + '</div>' +
        '<div class="po">' + esc(p.occupation) + ' · ' + p.age + ' ans</div>' +
        '<p class="pb">' + esc(p.bio) + '</p>' +
        '<div class="ps">' + top.map(function (k) { return '<span>' + esc(k) + ' <b>' + p.skills[k] + '</b></span>'; }).join('') + '</div>' +
        '<div class="pst"><span>SAN <b>' + p.san + '</b></span><span>PV <b>' + p.pv + '</b></span><span>Chance <b>' + p.chance + '</b></span></div>';
      card.appendChild(btn('Incarner ' + esc(p.first), 'act', function () { try { localStorage.removeItem(KEY); } catch (e) {} hideTitle(); mount(null, chap, p); }));
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
  $('form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var v = $('cmd').value.trim();
    if (!v) { skip(); return; }
    if (busy) return;
    $('cmd').value = '';
    act(function () { game.step(v); });
  });
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
    $('btnProlo').addEventListener('click', function () { try { localStorage.removeItem(KEY); } catch (e) {} hideTitle(); mount(null, 'prologue'); });
    $('btnBack').addEventListener('click', function () { $('tpick').hidden = true; $('tmain').hidden = false; });
    $('btnCont').addEventListener('click', function () { var sv = loadSave() || saved; if (!sv) return; hideTitle(); mount(sv); });
    if (hotState) { $('title').hidden = true; mount(hotState); }
    else mount(saved && saved.v === 1 ? saved : null, saved ? saved.chapter : 'prologue');
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(function () { return { state: game ? game.state : null }; });
    requestAnimationFrame(loop);
  }
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
  else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
})();
