/* Ambiance sonore : rails et bourdonnement synthétisés, pluie enregistrée (bruit blanc filtré en secours). */
(function (G) {
  'use strict';
  function Sound() { this.on = false; this.ctx = null; this.loc = 'restaurant'; this.san = 0; this.musicOn = true; this.decks = {}; this.track = null; }
  // ---- musique : des morceaux de Yoann, choisis selon le lieu et la santé mentale, en fondu enchaîné.
  // Un morceau peut avoir plusieurs versions : on en tire une au hasard chaque fois qu'il reprend.
  // house : « The House That Breathes », pour la maison de santé de Charenton (puis la maison du comte, à Poissy)
  // deep : « The Deep Ones Sing », et appel : « The Call from the Deep », le chant qu'entend un esprit fragile
  // eau : « Something in the Water », l'eau qui coule dans le train de nuit, et la Tamise
  // attente : « Stillness Before the Surge », les chambres d'hôtel, la nuit, et le champ au petit matin
  // statique : « Static in the Dark », les pièces sombres où quelque chose attend (Cheapside, la boutique, la chambre de Stanley)
  // bourdon : « Gothic Drone », les salles de lecture et les archives
  // gothique : « Gothic Shadows », l'église, le salon de Mrs Vane, la maison de Smith
  // abysse : « Abyssal Static », le train fantôme, et l'investigateur au bord du gouffre
  // salon : « 1920 Wagon », la voiture-salon du Simplon-Orient, la fête autour de la Cavollaro (bouclé sans couture)
  // cave : « Cave Field Recording », la cave sourde : les caves du comte et la salle des roses, à Poissy (bouclé sans couture)
  var TRACKS = { cave: 'audio/cave_field_recording.mp3', salon: 'audio/voiture_salon.mp3', haze: 'audio/rumble_in_the_haze.mp3', train: 'audio/midnight_train_whispers.mp3', dissolve: 'audio/mechanical_dissolve.mp3', house: 'audio/the_house_that_breathes.mp3', deep: 'audio/the_deep_ones_sing.mp3',
    eau: ['audio/something_in_the_water.mp3', 'audio/something_in_the_water_2.mp3'],
    attente: ['audio/stillness_before_the_surge.mp3', 'audio/stillness_before_the_surge_2.mp3'],
    appel: ['audio/the_call_from_the_deep.mp3', 'audio/the_call_from_the_deep_2.mp3', 'audio/the_call_from_the_deep_3.mp3'],
    gothique: ['audio/gothic_shadows.mp3', 'audio/gothic_shadows_2.mp3'],
    statique: ['audio/static_in_the_dark.mp3', 'audio/static_in_the_dark_2.mp3'],
    abysse: ['audio/abyssal_static.mp3', 'audio/abyssal_static_2.mp3'],
    bourdon: ['audio/gothic_drone.mp3', 'audio/gothic_drone_2.mp3'] };
  var TVOL = { haze: 0.5, train: 0.46, dissolve: 0.56, house: 0.48, deep: 0.6, eau: 0.56, attente: 0.42, appel: 0.5, gothique: 0.44, statique: 0.5, abysse: 0.5, bourdon: 0.46, cave: 0.68, salon: 0.5 };
  // une liste de morceaux : on en tire un en arrivant, et l'on s'y tient tant qu'on reste
  // (l'écran d'accueil reste sans musique : le morceau démarre avec la partie)
  var MUSIC = { title: null, restaurant: 'train', couloir: 'eau', lits: 'eau', compartiment: 'dissolve', victoria: 'train', gare: 'train',
    hotel: 'attente', campagne: 'attente',
    cheapside: 'statique', boutique: 'statique', chambre_stanley: 'statique', chelsea: 'statique',
    musee: 'bourdon', archives: 'bourdon', bn: 'bourdon', arsenal: 'bourdon',
    eglise: 'gothique', vane: 'gothique', stjohn: 'gothique',
    wagon1: 'abysse', wagon2: 'abysse', retour: 'appel', cave: 'dissolve', charenton: 'house', quais: ['eau', 'deep'],
    // Poissy : la campagne d'hiver attend son propre son ; les caves et la voiture-salon ont le leur
    po_gare: 'attente', po_ville: 'attente', po_auberge: 'attente', po_mairie: 'bourdon', po_eglise: 'gothique',
    po_lorien: 'house', po_jardin: 'house', po_caves: 'cave', po_salle: 'cave', p_lyon: 'train', oe_compartiment: 'dissolve', oe_salon: 'salon' };
  function tirer(l) { return Array.isArray(l) ? l[Math.floor(Math.random() * l.length)] : l; }
  // un lieu qui a sa musique la garde ; ailleurs, la musique suit la raison : la brume, puis le chant des profondeurs
  // quand l'investigateur devient fragile, puis l'abîme quand il est au bord du gouffre
  Sound.musicFor = function (loc, san, memo) {
    var cle = loc + '|' + (loc === 'title' ? 0 : san >= 3 ? 3 : MUSIC[loc] ? 1 : san >= 2 ? 2 : 1);
    if (memo && memo.cle === cle) return memo.id;
    var id = loc === 'title' ? MUSIC.title : san >= 3 ? 'abysse' : MUSIC[loc] ? tirer(MUSIC[loc]) : san >= 2 ? tirer(['deep', 'appel']) : 'haze';
    if (memo) { memo.cle = cle; memo.id = id; }
    return id;
  };
  Sound.TRACKS = TRACKS;
  Sound.prototype.start = function () {
    if (this.ctx) { this.ctx.resume(); this.on = true; this.master.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.4); this.musicBus.gain.setTargetAtTime(1, this.ctx.currentTime, 0.4); this.pickMusic(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    var ctx = this.ctx = new AC();
    this.on = true;
    this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 1; this.musicBus.connect(ctx.destination);
    var me = this;
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', function () { if (!me.ctx) return; if (document.hidden) me.ctx.suspend(); else if (me.on) me.ctx.resume(); });
    this.master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.6);
    // bruit blanc partagé
    var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    // pluie
    var rain = ctx.createBufferSource(); rain.buffer = buf; rain.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.6;
    this.rainGain = ctx.createGain(); this.rainGain.gain.value = 0.05;
    this.rainSynth = ctx.createGain(); this.rainSynth.gain.value = 1;
    rain.connect(bp); bp.connect(this.rainSynth); this.rainSynth.connect(this.rainGain); this.rainGain.connect(this.master); rain.start();
    this.vraiePluie();
    this.chargerBruits();
    // grondement du train
    var rum = ctx.createBufferSource(); rum.buffer = buf; rum.loop = true;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
    this.rumGain = ctx.createGain(); this.rumGain.gain.value = 0.22;
    rum.connect(lp); lp.connect(this.rumGain); this.rumGain.connect(this.master); rum.start();
    // bourdonnement
    this.drone = ctx.createGain(); this.drone.gain.value = 0.0; this.drone.connect(this.master);
    var self = this;
    [55, 82.4, 110.7].forEach(function (f, k) {
      var o = ctx.createOscillator(); o.type = k === 2 ? 'sine' : 'triangle'; o.frequency.value = f;
      var g = ctx.createGain(); g.gain.value = k === 2 ? 0 : 0.5;
      var lfo = ctx.createOscillator(); lfo.frequency.value = 0.07 + k * 0.03; var lg = ctx.createGain(); lg.gain.value = 1.5; lfo.connect(lg); lg.connect(o.detune); lfo.start();
      o.connect(g); g.connect(self.drone); o.start();
      if (k === 2) self.dissonance = g;
    });
    // claquement des rails
    this.nextClack = ctx.currentTime + 0.5;
    this.timer = setInterval(function () { self.tick(); }, 120);
    this.apply();
    this.pickMusic();
  };
  // ---- la pluie enregistrée : elle remplace le bruit blanc dès qu'elle est chargée ; sans fichier, le bruit blanc reste
  // audio/pluie.mp3 : quatre pluies de Ylmir (OpenGameArt, CC0) enchaînées en une boucle d'environ deux minutes.
  // gain : réglé pour que la pluie enregistrée ait le même niveau moyen (LUFS) que l'ancien bruit blanc filtré.
  var PLUIE = { src: 'audio/pluie.mp3', gain: 4.6, fondu: 2.5 };
  Sound.PLUIE = PLUIE;
  // une boucle sans couture, faite sur place : la fin de l'enregistrement se fond dans son début (fondu à puissance
  // constante), et l'on écarte les quelques millisecondes de silence que le MP3 ajoute aux deux bouts.
  // Renvoie les bornes de la boucle, en secondes ; le tampon lui-même est modifié, sans copie (mémoire des téléphones).
  function boucle(buf, fondu) {
    var sr = buf.sampleRate, bord = Math.floor(0.06 * sr), n = buf.length - 2 * bord;
    if (n < sr * 2) return { debut: 0, fin: buf.duration };
    var f = Math.min(Math.floor(fondu * sr), Math.floor(n / 4)), len = n - f;
    for (var c = 0; c < buf.numberOfChannels; c++) {
      var a = buf.getChannelData(c);
      for (var i = 0; i < f; i++) { var k = i / f * Math.PI / 2; a[bord + i] = a[bord + i] * Math.sin(k) + a[bord + len + i] * Math.cos(k); }
    }
    return { debut: bord / sr, fin: (bord + len) / sr };
  }
  Sound.boucle = boucle;
  Sound.prototype.vraiePluie = function () {
    var self = this, ctx = this.ctx;
    if (this.pluie || typeof fetch !== 'function') return;
    this.pluie = 'chargement';
    fetch(PLUIE.src).then(function (r) { if (!r.ok) throw new Error('absente'); return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (ok, ko) { ctx.decodeAudioData(ab, ok, ko); }); })
      .then(function (buf) {
        var b = boucle(buf, PLUIE.fondu), src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true; src.loopStart = b.debut; src.loopEnd = b.fin;
        var g = ctx.createGain(); g.gain.value = 0; src.connect(g); g.connect(self.rainGain);
        // on n'entre pas toujours au même endroit de la boucle : la pluie ne recommence pas à chaque partie
        src.start(0, b.debut + Math.random() * (b.fin - b.debut));
        var t = ctx.currentTime; g.gain.setTargetAtTime(PLUIE.gain, t, 1.2); self.rainSynth.gain.setTargetAtTime(0, t, 1.2);
        self.pluie = 'ok'; self.pluieDuree = b.fin - b.debut;
      }).catch(function () { self.pluie = 'absente'; });
  };
  // ---- les bruitages enregistrés : chaque geste a quelques variantes, tirées au hasard, jamais deux fois la même de suite.
  // audio/sfx/*.wav : lot « RPG Audio » de Kenney (kenney.nl, CC0). Sans fichier, le son synthétisé de blip() reste.
  var BRUITS = {
    door: { f: ['porte1', 'porte2', 'porte3'], vol: 0.4 },   // on change de lieu : une porte se referme
    clue: { f: ['page1', 'page2', 'page3'], vol: 0.7 },      // un indice au carnet : une page qu'on tourne
    dice: { f: ['des1', 'des2', 'des3'], vol: 0.6 }          // un jet : des dés secs sur une table (fournis par Yoann)
  };
  Sound.BRUITS = BRUITS;
  Sound.prototype.chargerBruits = function () {
    var self = this, ctx = this.ctx;
    if (this.bruits || typeof fetch !== 'function') return;
    this.bruits = {}; this.dernierBruit = {};
    Object.keys(BRUITS).forEach(function (k) {
      BRUITS[k].f.forEach(function (nom) {
        fetch('audio/sfx/' + nom + '.wav').then(function (r) { if (!r.ok) throw new Error('absent'); return r.arrayBuffer(); })
          .then(function (ab) { return new Promise(function (ok, ko) { ctx.decodeAudioData(ab, ok, ko); }); })
          .then(function (buf) { (self.bruits[k] = self.bruits[k] || []).push(buf); })
          .catch(function () {});
      });
    });
  };
  // joue un enregistrement s'il y en a un pour ce geste ; renvoie false sinon (blip() synthétise alors le son)
  Sound.prototype.bruit = function (kind) {
    var l = this.bruits && this.bruits[kind]; if (!l || !l.length) return false;
    var i = Math.floor(Math.random() * l.length);
    if (l.length > 1 && i === this.dernierBruit[kind]) i = (i + 1) % l.length;
    this.dernierBruit[kind] = i;
    var ctx = this.ctx, src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = l[i]; src.playbackRate.value = 0.95 + Math.random() * 0.1; // un rien plus grave ou plus aigu à chaque fois
    g.gain.value = BRUITS[kind].vol; src.connect(g); g.connect(this.master); src.start();
    this.bruitsJoues = (this.bruitsJoues || 0) + 1;
    return true;
  };
  Sound.prototype.stop = function () {
    if (!this.ctx) return; this.on = false;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    this.music(null);
  };
  Sound.prototype.setMusic = function (on) { this.musicOn = on; this.pickMusic(); };
  Sound.prototype.pickMusic = function () { this.memo = this.memo || {}; this.music(this.on && this.musicOn ? Sound.musicFor(this.loc, this.san, this.memo) : null); };
  Sound.prototype.music = function (id) {
    if (!this.ctx) return;
    if (id === this.track) { this.relancer(); return; }
    this.track = id;
    var ctx = this.ctx, t = ctx.currentTime, self = this;
    Object.keys(this.decks).forEach(function (k) {
      var d = self.decks[k]; if (k === id || !d.playing) return;
      d.playing = false; self.fade(d, 0, 1.6);
      clearTimeout(d.to); d.to = setTimeout(function () { if (!d.playing) { try { d.el.pause(); } catch (e) {} } }, 7000);
    });
    // l'ambiance s'efface un peu sous la musique
    if (this.master) this.master.gain.setTargetAtTime(id ? 0.55 : 0.9, t, 1.5);
    if (!id) return;
    var d = this.decks[id];
    if (!d) {
      var el = new Audio(); el.loop = true; el.preload = 'auto'; el.src = tirer(TRACKS[id]);
      d = this.decks[id] = { el: el, playing: false, vol: 0 };
      try { var src = ctx.createMediaElementSource(el); d.g = ctx.createGain(); d.g.gain.value = 0; src.connect(d.g); d.g.connect(this.musicBus); }
      catch (e) { d.g = null; el.volume = 0; }
      el.addEventListener('error', function () { d.broken = true; });
    }
    else if (Array.isArray(TRACKS[id]) && d.el.paused) {
      // une autre version du même morceau, quand il reprend après s'être tu
      var v = tirer(TRACKS[id]); if (d.el.src.indexOf(v) < 0) { d.broken = false; d.el.src = v; }
    }
    if (d.broken) return;
    clearTimeout(d.to); d.playing = true;
    var pr = d.el.play(); if (pr && pr.catch) pr.catch(function () {});
    this.fade(d, TVOL[id], 2.4);
  };
  // un morceau dont la lecture a été refusée (pas encore de geste) repart au premier toucher
  Sound.prototype.relancer = function () {
    var d = this.track && this.decks[this.track]; if (!d || !d.playing || d.broken || !d.el.paused) return;
    var pr = d.el.play(); if (pr && pr.catch) pr.catch(function () {});
  };
  Sound.prototype.joue = function () { var d = this.track && this.decks[this.track]; return !!(d && d.playing && !d.el.paused); };
  Sound.prototype.fade = function (d, target, secs) {
    if (d.g) { var t = this.ctx.currentTime; d.g.gain.cancelScheduledValues(t); d.g.gain.setValueAtTime(d.g.gain.value, t); d.g.gain.linearRampToValueAtTime(target, t + secs); return; }
    clearInterval(d.iv); var from = d.el.volume, n = 0, steps = Math.max(1, Math.round(secs * 20));
    d.iv = setInterval(function () { n++; d.el.volume = Math.max(0, Math.min(1, from + (target - from) * n / steps)); if (n >= steps) clearInterval(d.iv); }, 50);
  };
  Sound.prototype.tick = function () {
    if (!this.on || !this.ctx) return;
    var ctx = this.ctx;
    while (this.nextClack < ctx.currentTime + 0.3) {
      var CL = { restaurant: 0.22, couloir: 0.5, lits: 0.14, compartiment: 0.08, title: 0.22, wagon1: 0.3, wagon2: 0.24, retour: 0.55, gare: 0.1, victoria: 0.1, cave: 0.04 };
      var tt = this.nextClack, vol = CL[this.loc] || 0;
      if (vol) { this.clack(tt, vol); this.clack(tt + 0.13, vol * 0.8); }
      this.nextClack += this.san >= 3 ? (Math.random() < 0.3 ? 0.7 : 1.05) : 1.05;
    }
  };
  Sound.prototype.clack = function (t, vol) {
    var ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = this.noise;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.2;
    var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + 0.12);
    var o = ctx.createOscillator(); o.frequency.value = 70; var og = ctx.createGain();
    og.gain.setValueAtTime(vol * 0.8, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(og); og.connect(this.master); o.start(t); o.stop(t + 0.14);
  };
  Sound.prototype.set = function (loc, san) { this.loc = loc; this.san = san; this.apply(); this.pickMusic(); };
  Sound.prototype.apply = function () {
    if (!this.ctx) return;
    var t = this.ctx.currentTime;
    var rain = { restaurant: 0.04, couloir: 0.14, lits: 0.025, compartiment: 0.2, title: 0.06, institut: 0.01, hotel: 0.05, cheapside: 0.04, chelsea: 0.03, yard: 0.03, ambassade: 0.02, islington: 0.12, boutique: 0.03, musee: 0.1, stoke: 0.12, chambre_stanley: 0.04, camberwell: 0.03, cave: 0, wagon1: 0, wagon2: 0, retour: 0.02, campagne: 0.07, victoria: 0.05,
      gare: 0.09, bn: 0.06, arsenal: 0.045, charenton: 0.1, cafe: 0.05 }[this.loc];
    var rum = { restaurant: 0.2, couloir: 0.38, lits: 0.12, compartiment: 0.1, title: 0.15, institut: 0.06, hotel: 0.08, islington: 0.14, stoke: 0.14, musee: 0.05, cave: 0.05, wagon1: 0.3, wagon2: 0.26, retour: 0.45, campagne: 0.06, victoria: 0.3,
      gare: 0.3, bn: 0.04, arsenal: 0.04, charenton: 0.05, cafe: 0.07 }[this.loc];
    if (rain === undefined) rain = 0.04;
    if (rum === undefined) rum = 0.1;
    this.rainGain.gain.setTargetAtTime(rain, t, 0.8);
    this.rumGain.gain.setTargetAtTime(rum, t, 0.8);
    this.drone.gain.setTargetAtTime([0.012, 0.025, 0.045, 0.07][this.san] + (this.loc === 'compartiment' || this.loc === 'wagon1' || this.loc === 'wagon2' || this.loc === 'cheapside' ? 0.04 : 0), t, 2);
    this.dissonance.gain.setTargetAtTime(this.san >= 2 ? 0.4 : 0, t, 2);
  };
  Sound.prototype.blip = function (kind) {
    if (!this.on || !this.ctx) return;
    if (this.bruit(kind)) return;
    var ctx = this.ctx, t = ctx.currentTime, self = this;
    function tone(f, start, dur, type, vol) {
      var o = ctx.createOscillator(); o.type = type || 'square'; o.frequency.value = f;
      var g = ctx.createGain(); g.gain.setValueAtTime(0, t + start); g.gain.linearRampToValueAtTime(vol || 0.05, t + start + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + start + dur);
      o.connect(g); g.connect(self.master); o.start(t + start); o.stop(t + start + dur + 0.02);
      return o;
    }
    if (kind === 'clue') { tone(659, 0, 0.18); tone(988, 0.12, 0.35); }
    else if (kind === 'dice') { for (var i = 0; i < 7; i++) tone(300 + Math.random() * 500, i * 0.06, 0.04, 'square', 0.03); }
    else if (kind === 'success') { tone(523, 0, 0.12); tone(784, 0.1, 0.25); }
    else if (kind === 'fail') { tone(220, 0, 0.25, 'sawtooth', 0.03); }
    else if (kind === 'san') { var o = tone(196, 0, 1.4, 'sine', 0.12); o.frequency.exponentialRampToValueAtTime(49, t + 1.4); tone(207.6, 0.05, 1.2, 'sine', 0.06); }
    else if (kind === 'key') { tone(1200 + Math.random() * 200, 0, 0.015, 'square', 0.008); }
    else if (kind === 'door') { tone(110, 0, 0.3, 'triangle', 0.08); tone(82, 0.08, 0.4, 'triangle', 0.06); }
  };
  G.Sound = Sound;
})(typeof window !== 'undefined' ? window : globalThis);
