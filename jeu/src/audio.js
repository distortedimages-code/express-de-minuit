/* Ambiance sonore synthétisée : rails, pluie, bourdonnement qui se dérègle avec la santé mentale. */
(function (G) {
  'use strict';
  function Sound() { this.on = false; this.ctx = null; this.loc = 'restaurant'; this.san = 0; this.musicOn = true; this.decks = {}; this.track = null; }
  // ---- musique : trois morceaux, choisis selon le lieu et la santé mentale, en fondu enchaîné
  var TRACKS = { haze: 'audio/rumble_in_the_haze.mp3', train: 'audio/midnight_train_whispers.mp3', dissolve: 'audio/mechanical_dissolve.mp3' };
  var TVOL = { haze: 0.5, train: 0.46, dissolve: 0.56 };
  var MUSIC = { title: 'train', restaurant: 'train', couloir: 'train', lits: 'train', compartiment: 'dissolve', victoria: 'train',
    wagon1: 'dissolve', wagon2: 'dissolve', retour: 'dissolve', cave: 'dissolve' };
  Sound.musicFor = function (loc, san) { if (san >= 3 && loc !== 'title') return 'dissolve'; return MUSIC[loc] || 'haze'; };
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
    rain.connect(bp); bp.connect(this.rainGain); this.rainGain.connect(this.master); rain.start();
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
  Sound.prototype.stop = function () {
    if (!this.ctx) return; this.on = false;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    this.music(null);
  };
  Sound.prototype.setMusic = function (on) { this.musicOn = on; this.pickMusic(); };
  Sound.prototype.pickMusic = function () { this.music(this.on && this.musicOn ? Sound.musicFor(this.loc, this.san) : null); };
  Sound.prototype.music = function (id) {
    if (!this.ctx) return;
    if (id === this.track) return;
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
      var el = new Audio(); el.loop = true; el.preload = 'auto'; el.src = TRACKS[id];
      d = this.decks[id] = { el: el, playing: false, vol: 0 };
      try { var src = ctx.createMediaElementSource(el); d.g = ctx.createGain(); d.g.gain.value = 0; src.connect(d.g); d.g.connect(this.musicBus); }
      catch (e) { d.g = null; el.volume = 0; }
      el.addEventListener('error', function () { d.broken = true; });
    }
    if (d.broken) return;
    clearTimeout(d.to); d.playing = true;
    var pr = d.el.play(); if (pr && pr.catch) pr.catch(function () {});
    this.fade(d, TVOL[id], 2.4);
  };
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
    var rain = { restaurant: 0.04, couloir: 0.14, lits: 0.025, compartiment: 0.2, title: 0.06, institut: 0.01, hotel: 0.05, cheapside: 0.04, chelsea: 0.03, yard: 0.03, ambassade: 0.02, islington: 0.12, boutique: 0.03, musee: 0.1, stoke: 0.12, chambre_stanley: 0.04, camberwell: 0.03, cave: 0, wagon1: 0, wagon2: 0, retour: 0.02, campagne: 0.07, victoria: 0.05 }[this.loc];
    var rum = { restaurant: 0.2, couloir: 0.38, lits: 0.12, compartiment: 0.1, title: 0.15, institut: 0.06, hotel: 0.08, islington: 0.14, stoke: 0.14, musee: 0.05, cave: 0.05, wagon1: 0.3, wagon2: 0.26, retour: 0.45, campagne: 0.06, victoria: 0.3 }[this.loc];
    if (rain === undefined) rain = 0.04;
    if (rum === undefined) rum = 0.1;
    this.rainGain.gain.setTargetAtTime(rain, t, 0.8);
    this.rumGain.gain.setTargetAtTime(rum, t, 0.8);
    this.drone.gain.setTargetAtTime([0.012, 0.025, 0.045, 0.07][this.san] + (this.loc === 'compartiment' || this.loc === 'wagon1' || this.loc === 'wagon2' || this.loc === 'cheapside' ? 0.04 : 0), t, 2);
    this.dissonance.gain.setTargetAtTime(this.san >= 2 ? 0.4 : 0, t, 2);
  };
  Sound.prototype.blip = function (kind) {
    if (!this.on || !this.ctx) return;
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
