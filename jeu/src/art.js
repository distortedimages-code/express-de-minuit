/* Illustrations : décors peints façon cinéma expressionniste allemand (Caligari, Nosferatu),
   en aplats noir, crème et rouge, trames à gros points, lumières et ombres peintes sur les murs.
   Les scènes se dessinent en 400 × 300 (le 4:3 du muet) ; le rendu suit la finesse de l'écran. */
(function (G) {
  'use strict';
  var W = 400, H = 300;
  var K = '#0a0a0b', K2 = '#1e1b1c', GR = '#3b3536', R = '#e3202d', DR = '#5c0b12', C = '#f3efe6', C2 = '#b9b1a4';
  var INK = { K: K, K2: K2, GR: GR, R: R, DR: DR, C: C, C2: C2 };
  var TAU = Math.PI * 2;

  function rng(seed) { var s = (seed | 0) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  // ------------------------------------------------------------------ boîte à outils du décorateur
  var D = {};
  D.path = function (c, p) { c.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); };
  D.pp = function (p) { return function (c) { D.path(c, p); }; };
  D.poly = function (c, p, col) { c.beginPath(); D.path(c, p); c.fillStyle = col; c.fill(); };
  D.rect = function (c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); };
  D.line = function (c, p, w, col, cap) {
    c.beginPath(); c.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
    c.lineWidth = w; c.strokeStyle = col; c.lineCap = cap || 'butt'; c.lineJoin = 'miter'; c.stroke();
  };
  D.ell = function (c, x, y, rx, ry, col, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); c.fillStyle = col; c.fill(); };
  D.circ = function (c, x, y, r, col) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); c.fillStyle = col; c.fill(); };
  // trait de pinceau effilé le long d'une ligne brisée
  D.brush = function (c, p, w0, w1, col) {
    var n = p.length / 2, L = [], Rr = [];
    for (var i = 0; i < n; i++) {
      var a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      var dx = p[b * 2] - p[a * 2], dy = p[b * 2 + 1] - p[a * 2 + 1], d = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / ((n - 1) || 1)) / 2;
      L.push(p[i * 2] - dy / d * w, p[i * 2 + 1] + dx / d * w); Rr.unshift(p[i * 2] + dy / d * w, p[i * 2 + 1] - dx / d * w);
    }
    D.poly(c, L.concat(Rr), col);
  };
  // éclats peints qui rayonnent (les lumières de Caligari)
  D.rays = function (c, cx, cy, n, r0, r1, wd, col, seed, a0, a1) {
    var r = rng(seed || 3); if (a0 === undefined) { a0 = 0; a1 = TAU; }
    c.beginPath();
    for (var i = 0; i < n; i++) {
      var a = lerp(a0, a1, (i + 0.2 + r() * 0.6) / n), len = lerp(r0, r1, r()), w = wd * (0.4 + r() * 0.9);
      c.moveTo(cx + Math.cos(a - w) * r0 * 0.35, cy + Math.sin(a - w) * r0 * 0.35);
      c.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      c.lineTo(cx + Math.cos(a + w) * r0 * 0.35, cy + Math.sin(a + w) * r0 * 0.35);
      c.closePath();
    }
    c.fillStyle = col; c.fill();
  };
  // trame de points : rf(x, y) donne le rayon ; rangées décalées comme une vraie trame d'imprimerie
  D.dots = function (c, clip, cell, rf, col, x0, y0, x1, y1) {
    x0 = x0 === undefined ? 0 : x0; y0 = y0 === undefined ? 0 : y0; x1 = x1 === undefined ? W : x1; y1 = y1 === undefined ? H : y1;
    c.save(); if (clip) { c.beginPath(); clip(c); c.clip(); }
    c.beginPath();
    var dy = cell * 0.866, row = 0;
    for (var y = y0; y <= y1 + cell; y += dy, row++) {
      for (var x = x0 + (row % 2) * cell / 2; x <= x1 + cell; x += cell) {
        var rr = rf(x, y); if (rr > 0.18) { rr = Math.min(rr, cell * 0.62); c.moveTo(x + rr, y); c.arc(x, y, rr, 0, TAU); }
      }
    }
    c.fillStyle = col; c.fill(); c.restore();
  };
  D.hatch = function (c, clip, sp, ang, w, col) {
    c.save(); c.beginPath(); clip(c); c.clip(); c.beginPath();
    var dx = Math.cos(ang), dy = Math.sin(ang);
    for (var k = -520; k < 520; k += sp) { var ox = 200 - dy * k, oy = 150 + dx * k; c.moveTo(ox - dx * 600, oy - dy * 600); c.lineTo(ox + dx * 600, oy + dy * 600); }
    c.lineWidth = w; c.strokeStyle = col; c.stroke(); c.restore();
  };
  D.star = function (c, x, y, r, col, rot) {
    c.beginPath();
    for (var i = 0; i < 16; i++) { var a = i / 16 * TAU + (rot || 0), rr = i % 2 ? r * 0.26 : (i % 4 ? r * 0.58 : r); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = col; c.fill();
  };
  // fenêtre de guingois
  D.jag = function (x, y, w, h, seed, k) {
    var r = rng(seed), j = function (v) { return (r() - 0.5) * v * (k === undefined ? 1 : k); };
    return [x + j(w * 0.3), y + j(h * 0.25), x + w + j(w * 0.3), y + h * 0.12 + j(h * 0.25), x + w * 0.9 + j(w * 0.25), y + h + j(h * 0.15), x + w * 0.08 + j(w * 0.25), y + h * 0.92 + j(h * 0.15)];
  };
  // maison penchée, toit pointu, fenêtres tordues
  D.house = function (c, x, by, w, h, lean, seed, wall, lit, unlit) {
    var r = rng(seed), top = by - h, sk = lean * h;
    var roofH = h * (0.22 + r() * 0.4), peak = x + w * (0.25 + r() * 0.5) + sk * 1.25;
    D.poly(c, [x, by, x + w, by, x + w + sk, top, peak, top - roofH, x + sk, top], wall);
    if (r() < 0.75) { var cx0 = x + sk + w * (0.15 + r() * 0.55), ch = 12 + r() * 14; D.poly(c, [cx0, top - roofH * 0.2, cx0 + 6, top - roofH * 0.2, cx0 + 8 + lean * 18, top - roofH * 0.6 - ch, cx0 + 2 + lean * 18, top - roofH * 0.6 - ch], wall); }
    var rows = Math.max(1, Math.floor(h / 30)), cols = Math.max(1, Math.floor(w / 20));
    for (var i = 0; i < rows; i++) for (var j = 0; j < cols; j++) {
      var pick = r(); if (pick < 0.2) continue;
      var wy = top + 8 + i * (h - 14) / rows, ww = w / cols * 0.5, hh = (h - 14) / rows * 0.55, wx = x + (j + 0.25) * w / cols + lean * (by - wy);
      D.poly(c, D.jag(wx, wy, ww, hh, seed * 31 + i * 7 + j, 1.2), pick > 0.72 ? lit : unlit);
    }
  };
  // silhouette allongée, penchée, au chapeau ; pieds en (x, y), hauteur h
  D.figure = function (c, x, y, h, o) {
    o = o || {};
    var col = o.col || K, s = h / 100;
    c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); c.transform(1, 0, -(o.lean || 0), 1, 0, 0);
    var shape = function () {
      c.beginPath();
      var sw = o.wide || 15, fl = o.flare === undefined ? 19 : o.flare;
      if (o.dress) { c.moveTo(-4, -80); c.lineTo(-sw + 2, -71); c.lineTo(-sw - 2, -40); c.lineTo(-fl - 6, 0); c.lineTo(fl + 6, 0); c.lineTo(sw + 2, -40); c.lineTo(sw - 2, -71); c.lineTo(4, -80); }
      else {
        c.moveTo(-4, -80); c.lineTo(-sw, -71); c.lineTo(-sw - 1, -40); c.lineTo(-fl, -12); c.lineTo(-7, -12); c.lineTo(-6, 0); c.lineTo(-2, 0); c.lineTo(-1, -12);
        c.lineTo(1, -12); c.lineTo(2, 0); c.lineTo(6, 0); c.lineTo(7, -12); c.lineTo(fl, -12); c.lineTo(sw + 1, -40); c.lineTo(sw, -71); c.lineTo(4, -80);
      }
      c.closePath();
      c.moveTo(7.5, -88); c.arc(0, -88, 7.5, 0, TAU);
      if (o.claw) { c.moveTo(sw - 2, -66); c.lineTo(sw + 24, -58); c.lineTo(sw + 42, -66); c.lineTo(sw + 30, -54); c.lineTo(sw + 44, -52); c.lineTo(sw + 28, -49); c.lineTo(sw + 40, -42); c.lineTo(sw + 20, -48); c.lineTo(sw, -52); c.closePath(); }
      var hat = o.hat;
      if (hat === 'top') { c.rect(-13, -98, 26, 3); c.rect(-8, -122, 16, 25); }
      else if (hat === 'bowler') { c.rect(-13, -97, 26, 3); c.moveTo(8, -96); c.arc(0, -96, 8, Math.PI, 0); }
      else if (hat === 'fedora') { c.moveTo(-15, -95); c.lineTo(15, -97); c.lineTo(15, -94); c.lineTo(-15, -92); c.closePath(); c.moveTo(-8, -95); c.lineTo(-7, -106); c.lineTo(0, -103); c.lineTo(7, -107); c.lineTo(8, -96); c.closePath(); }
      else if (hat === 'helmet') { c.moveTo(-10, -92); c.quadraticCurveTo(-10, -112, 0, -116); c.quadraticCurveTo(10, -112, 10, -92); c.lineTo(13, -90); c.lineTo(-13, -90); c.closePath(); }
      else if (hat === 'cap') { c.moveTo(-9, -93); c.lineTo(-9, -101); c.lineTo(9, -102); c.lineTo(10, -93); c.lineTo(16, -91); c.lineTo(-9, -92); c.closePath(); }
      else if (hat === 'veil') { c.moveTo(-12, -94); c.lineTo(12, -96); c.lineTo(8, -104); c.lineTo(-8, -103); c.closePath(); c.moveTo(-10, -94); c.lineTo(-14, -70); c.lineTo(14, -70); c.lineTo(10, -95); c.closePath(); }
    };
    if (o.rim) { c.save(); c.translate(o.rimSide === -1 ? -2.2 : 2.2, -0.6); shape(); c.fillStyle = o.rim; c.fill(); c.restore(); }
    shape(); c.fillStyle = col; c.fill();
    if (o.coat) { c.beginPath(); c.moveTo(-5, -78); c.lineTo(-13, -70); c.lineTo(-14, -40); c.lineTo(-11, -30); c.lineTo(11, -30); c.lineTo(14, -40); c.lineTo(13, -70); c.lineTo(5, -78); c.closePath(); c.fillStyle = o.coat; c.fill(); }
    if (o.eyes) { c.fillStyle = o.eyes; c.fillRect(-4.5, -90, 3, 1.6); c.fillRect(1.5, -90, 3, 1.6); }
    c.restore();
  };
  // rangées de spectateurs, des nuques et des épaules
  D.crowd = function (c, rows, x0, x1, rim) {
    rows.forEach(function (rw, k) {
      for (var x = x0 + (k % 2) * rw[2] / 2; x < x1 + 10; x += rw[2]) {
        var r = rw[1];
        D.ell(c, x, rw[0] + r * 1.7, r * 1.8, r * 1.3, K); D.circ(c, x, rw[0], r, K);
        if (rim) { c.beginPath(); c.arc(x, rw[0], r, Math.PI * 1.3, Math.PI * 1.95); c.lineWidth = 1.1; c.strokeStyle = rim; c.stroke(); }
      }
    });
  };

  // ------------------------------------------------------------------ le projecteur
  function Art(canvas, bloom) {
    this.out = canvas; this.o = canvas.getContext('2d');
    if (bloom && bloom.style) bloom.style.display = 'none';
    this.buf = document.createElement('canvas'); this.g = this.buf.getContext('2d');
    this.prevC = document.createElement('canvas'); this.pg = this.prevC.getContext('2d');
    this.hasPrev = false; this.cache = {}; this.ck = []; this.RS = 0; this.chk = 0;
    this.scene = 'title'; this.trans = 1; this.t = 0; this.fx = {};
    this.state = { san: 0, flags: {}, min: 720 };
    this.seed = 7; this.style = 'expr';
    this.CW = W; // largeur logique du cadre : 400 (4:3), ou 720 en format cinéma 2,4:1 (setWide)
    this.resize(true);
    var self0 = this; if (typeof setTimeout !== 'undefined' && G.PHOTO_PRELOAD !== false) setTimeout(function () { self0.preloadPhotos(); }, 1500);
  }
  var P = Art.prototype;
  P.setWide = function (on) { this.CW = on ? 720 : W; this.cache = {}; this.ck = []; this._focusKey = undefined; this.resize(true); };
  P.resize = function (force) {
    var CWd = this.CW || W, cw = this.out.clientWidth || CWd, dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    var rs = clamp(Math.round(cw * dpr / CWd * 4) / 4, 1, 3);
    if (!force && rs === this.RS) return;
    this.RS = rs; var pw = Math.round(CWd * rs), ph = Math.round(H * rs);
    [this.out, this.buf, this.prevC].forEach(function (cv) { cv.width = pw; cv.height = ph; });
    this.cache = {}; this.ck = []; this.hasPrev = false;
  };
  P.set = function (scene) {
    if (scene === this.scene) return;
    this.pg.setTransform(1, 0, 0, 1, 0, 0); this.pg.drawImage(this.out, 0, 0); this.hasPrev = true;
    this.scene = scene; this.trans = 0;
  };
  P.trigger = function (name, dur) { this.fx[name] = this.t + (dur || 1.2); };
  P.on = function (name) { return this.fx[name] && this.fx[name] > this.t; };
  P.rnd = function () { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 2147483647; };
  // calques mis en cache : tout ce qui ne bouge pas se peint une seule fois
  P.lay = function (key, fn) {
    var cv = this.cache[key];
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = this.buf.width; cv.height = this.buf.height;
      var c = cv.getContext('2d'); c.setTransform(this.RS, 0, 0, this.RS, 0, 0); fn.call(this, c);
      this.cache[key] = cv; this.ck.push(key);
      if (this.ck.length > 40) delete this.cache[this.ck.shift()];
    }
    return cv;
  };
  P.put = function (key, fn) { this.g.drawImage(this.lay(key, fn), 0, 0, W, H); };
  // pluie : de fines hachures crème qui tombent en biais
  P.rain = function (g, n, alpha, slant, speed, clip) {
    var t = this.t, r = rng(11); g.save(); if (clip) { g.beginPath(); clip(g); g.clip(); }
    g.beginPath();
    for (var i = 0; i < n; i++) {
      var x0 = r() * (W + 80), y0 = r() * H, sp = (0.7 + r() * 0.6) * (speed || 300), l = 7 + r() * 12;
      var y = ((y0 + t * sp) % (H + 30)) - 15, x = (((x0 - y * slant) % (W + 80)) + W + 80) % (W + 80) - 40;
      g.moveTo(x, y); g.lineTo(x - slant * l, y + l);
    }
    g.lineWidth = 0.7; g.strokeStyle = C; g.globalAlpha = alpha; g.stroke(); g.restore();
  };
  // nappe de brouillard tramée qui dérive (motif qui boucle sur 400 de large)
  P.fog = function (g, y, h, speed, col, dens, cell) {
    var key = 'fog' + y + '_' + h + col + dens + (cell || 5);
    var cv = this.lay(key, function (c) {
      var k = TAU / W;
      D.dots(c, null, cell || 5, function (x, yy) {
        var u = (yy - y) / h; if (u < 0 || u > 1) return 0;
        var v = Math.sin(u * Math.PI) * (0.55 + 0.45 * Math.sin(x * k * 3 + yy * 0.05) * Math.sin(x * k * 7 + 1.3));
        return (cell || 5) * 0.5 * dens * Math.max(0, v);
      }, col);
    });
    var off = ((this.t * speed) % W + W) % W;
    g.drawImage(cv, -off, 0, W, H); g.drawImage(cv, W - off, 0, W, H);
  };
  // bouffée de fumée tramée (sprite en cache, mis à l'échelle)
  P.puff = function (g, x, y, r, a, col) {
    if (a <= 0.02 || r <= 0) return;
    var key = 'puff' + (col || C2), cv = this.cache[key];
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = cv.height = 96; var c = cv.getContext('2d');
      D.dots(c, function (cc) { cc.arc(48, 48, 47, 0, TAU); }, 9, function (xx, yy) { var d = Math.hypot(xx - 48, yy - 48) / 48; return 4.6 * (1 - d * d); }, col || C2, 0, 0, 96, 96);
      this.cache[key] = cv;
    }
    g.globalAlpha = a; g.drawImage(cv, x - r, y - r, r * 2, r * 2); g.globalAlpha = 1;
  };
  // l'iris du cinéma muet
  P.iris = function (g, r) {
    var CWd = this.CW || W;
    g.save(); g.beginPath(); g.rect(-20, -20, CWd + 40, H + 40);
    if (r > 0.001) g.ellipse(CWd / 2, H / 2, CWd * 0.75 * r, H * 0.75 * r, 0, 0, TAU);
    g.fillStyle = K; g.fill('evenodd');
    if (r > 0.02 && r < 1.2) { g.beginPath(); g.ellipse(CWd / 2, H / 2, CWd * 0.75 * r, H * 0.75 * r, 0, 0, TAU); g.lineWidth = 2; g.strokeStyle = R; g.stroke(); }
    g.restore();
  };
  function vign(c) {
    D.dots(c, null, 6, function (x, y) {
      var dx = (x - W / 2) / (W * 0.58), dy = (y - H / 2) / (H * 0.6), d = Math.sqrt(dx * dx + dy * dy);
      return clamp((d - 0.93) * 12, 0, 3.4);
    }, K);
  }

  // ======================================================================= le prologue : l'Orient-Express
  // murs du wagon-restaurant en perspective tordue
  function lw(x, v) { return [x, lerp(0.29 * x, 300 - 0.62 * x, v)]; }
  function rw(x, v) { var d = 400 - x; return [x, lerp(d * 0.38, 300 - d * 0.78, v)]; }
  var RWIN = [[10, 74, 0.17, 0.5, 11], [104, 146, 0.2, 0.5, 12], [168, 190, 0.24, 0.5, 13], [322, 386, 0.16, 0.48, 14], [282, 304, 0.22, 0.5, 15]];
  function winPts(wd) {
    var a = wd[0], b = wd[1], f = a > 250 ? rw : lw, j = rng(wd[4]), s = function () { return (j() - 0.5) * 8; };
    var p1 = f(a, wd[2]), p2 = f(b, wd[2] + 0.04), p3 = f(b, wd[3]), p4 = f(a, wd[3] + 0.03);
    return [p1[0] + s(), p1[1] + s(), p2[0] + s(), p2[1] + s(), p3[0] + s(), p3[1] + s(), p4[0] + s(), p4[1] + s()];
  }
  function restBg(c, f) {
      D.rect(c, 0, 0, W, H, K);
      // plafond voûté aux nervures peintes
      D.poly(c, [0, 0, 400, 0, 272, 102, 194, 108], K2);
      for (var k = 0; k < 9; k++) { var x = lerp(-30, 430, k / 8); D.brush(c, [x, 0, lerp(194, 272, k / 8), lerp(108, 102, k / 8)], 7, 0.6, k % 2 ? GR : DR); }
      // murs
      D.poly(c, [0, 0, 194, 108, 198, 176, 0, 300], GR);
      D.dots(c, D.pp([0, 0, 194, 108, 198, 176, 0, 300]), 6, function (x, y) { return 3.2 - x / 70 + Math.sin(y * 0.05) * 0.4; }, K);
      D.poly(c, [400, 0, 272, 102, 268, 172, 400, 300], K2);
      // fond : la porte du soufflet, rouge
      D.poly(c, [194, 108, 272, 102, 268, 172, 198, 176], R);
      D.dots(c, D.pp([194, 108, 272, 102, 268, 172, 198, 176]), 4, function (x, y) { return (y - 100) / 40; }, DR);
      D.poly(c, [222, 118, 244, 116, 246, 170, 220, 172], K);
      D.poly(c, [229, 122, 238, 121, 238, 168, 230, 169], C);
      // sol et tapis
      D.poly(c, [0, 300, 198, 176, 268, 172, 400, 300], K);
      D.poly(c, [128, 300, 222, 175, 246, 174, 286, 300], R);
      D.dots(c, D.pp([128, 300, 222, 175, 246, 174, 286, 300]), 6, function (x, y) { return clamp((260 - y) / 30, 0, 3.2); }, DR);
      for (var s = 0; s < 6; s++) { var u = s / 6; D.line(c, [lerp(128, 222, u * u), lerp(300, 175, u * u), lerp(286, 246, u * u), lerp(300, 175, u * u)], 1.2, K); }
      // fenêtres : cadres crème
      RWIN.forEach(function (wd) { var p = winPts(wd); D.poly(c, p, K2); c.beginPath(); D.path(c, p); c.lineWidth = 2; c.strokeStyle = C2; c.stroke(); });
      // ombres peintes en dents de scie sur les murs
      // lumière peinte sur le sol, sous les lampes
      D.dots(c, D.pp([40, 262, 116, 236, 170, 252, 120, 266, 190, 284, 60, 290]), 6, function () { return 1.8; }, C2);
      D.dots(c, D.pp([250, 248, 318, 230, 372, 250, 330, 258, 380, 278, 268, 272]), 6, function () { return 1.5; }, C2);
      // la table de Ravel, au premier plan
      D.poly(c, [26, 206, 132, 196, 150, 232, 14, 244], C);
      D.poly(c, [14, 244, 150, 232, 150, 246, 14, 260], C2);
      D.line(c, [14, 244, 150, 232], 1.4, K);
      D.poly(c, [6, 300, 18, 252, 24, 252, 16, 300], K); D.poly(c, [140, 300, 144, 248, 150, 248, 148, 300], K);
      // chaise vide, au dossier tordu
      D.poly(c, [150, 170, 162, 166, 170, 236, 160, 240], K); D.poly(c, [146, 232, 196, 226, 200, 236, 150, 244], K); D.poly(c, [190, 236, 196, 236, 202, 300, 194, 300], K);
      if (!f.verreCasse) { D.poly(c, [92, 190, 104, 190, 102, 210, 94, 210], C2); D.poly(c, [93, 202, 103, 202, 102, 210, 94, 210], GR); D.line(c, [92, 190, 104, 190], 1, K); }
      else { D.poly(c, [60, 262, 90, 256, 104, 268, 70, 274], K2); }
      if (!f.servietteTaken) { D.poly(c, [44, 214, 74, 208, 66, 226], R); D.line(c, [44, 214, 74, 208, 66, 226, 44, 214], 1, K); }
      // la table de la veuve, à droite : la veuve, voilée, à sa réussite
      D.rays(c, 300, 196, 14, 20, 110, 0.06, DR, 44, Math.PI * 1.05, Math.PI * 1.95);
      D.figure(c, 334, 250, 112, { hat: 'veil', dress: true, rim: C2, rimSide: -1, flip: true });
      D.poly(c, [262, 202, 376, 208, 396, 236, 252, 228], C);
      D.poly(c, [252, 228, 396, 236, 396, 250, 252, 242], C2); D.line(c, [252, 228, 396, 236], 1.4, K);
      [[284, 214], [298, 212], [312, 215], [330, 214], [344, 218]].forEach(function (q, i) { D.poly(c, [q[0], q[1], q[0] + 9, q[1] - 1, q[0] + 10, q[1] + 6, q[0] + 1, q[1] + 7], i % 2 ? K : R); });
      // le serveur, raide comme un piquet, veste blanche
      if (!f.serveurPart) { D.figure(c, 214, 214, 78, { coat: C, rim: C2, lean: 0.06 }); D.poly(c, [222, 160, 232, 158, 230, 178, 224, 176], C); }
      }
  // nuit qui défile derrière les vitres
  P.nightWin = function (g, pts, speed) {
    var t = this.t, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (var i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    var hgt = y1 - y0, hz = y0 + hgt * 0.62;
    g.save(); g.beginPath(); D.path(g, pts); g.clip();
    D.rect(g, x0, y0, x1 - x0, hgt, K2);
    D.rect(g, x0, hz - hgt * 0.12, x1 - x0, hgt * 0.16, DR);
    var off = (t * speed) % 60;
    g.beginPath();
    for (var x = x0 - 60 + off; x < x1 + 30; x += 15) { var hh = (0.25 + ((Math.abs(Math.round(x - off)) * 13) % 23) / 40) * hgt * 0.5; g.moveTo(x, y1); g.lineTo(x + 7, hz - hh); g.lineTo(x + 14, y1); }
    g.fillStyle = K; g.fill();
    var lx = x1 - ((t * speed * 1.7) % ((x1 - x0) + 160));
    D.star(g, lx, hz - hgt * 0.1, Math.max(2, hgt * 0.05), C, t); D.circ(g, lx - 90, hz - hgt * 0.2, Math.max(1.4, hgt * 0.025), R);
    g.restore();
    this.rain(g, 40, 0.5, 0.5, 260, D.pp(pts));
  };
  P.restaurant = function (g, t, st) {
    var f = st.flags || {}, self = this;
    var key = 'rest' + (f.servietteTaken ? 1 : 0) + (f.verreCasse ? 1 : 0) + (f.serveurPart ? 1 : 0);
    var bg = this.lay(key, function (c) { restBg(c, f); });
    g.drawImage(bg, 0, 0, W, H);
    // la nuit qui file aux fenêtres
    RWIN.forEach(function (wd, i) { self.nightWin(g, winPts(wd), i < 3 ? 140 : 110); });
    if (this.on('face')) {
      var p = winPts(RWIN[0]); g.save(); g.beginPath(); D.path(g, p); g.clip();
      D.ell(g, 44, 132, 15, 21, C); D.ell(g, 37, 126, 4, 5.5, K); D.ell(g, 51, 126, 4, 5.5, K); D.ell(g, 44, 145, 4, 7, K);
      g.restore();
    }
    // lampes en étoile, qui vacillent
    var fl = this.on('flicker') ? (this.rnd() < 0.5 ? 0.2 : 1) : 0.9 + 0.1 * Math.sin(t * 9) * Math.sin(t * 2.3);
    [[150, 40, 15], [212, 76, 9], [244, 92, 5]].forEach(function (l, i) {
      D.line(g, [l[0], 0, l[0], l[1] - l[2] * 0.3], 0.8, C2);
      D.star(g, l[0], l[1], l[2] * fl, C, t * 0.15 + i);
    });
    [[112, 186], [300, 196]].forEach(function (l, i) {
      D.rays(g, l[0], l[1], 9, 18, 52 * fl, 0.06, 'rgba(243,239,230,' + (0.22 * fl) + ')', 40 + i, Math.PI * 1.05, Math.PI * 1.95);
      D.poly(g, [l[0] - 9, l[1], l[0] + 9, l[1], l[0] + 4, l[1] - 9, l[0] - 4, l[1] - 9], R);
      D.star(g, l[0], l[1] + 2, 5 * fl, C, t * 0.4);
    });
    // l'ombre qui rôde sur la paroi
    if (st.san >= 2 || this.on('madness')) {
      var sx = 300 + Math.sin(t * 0.25) * 30;
      g.save(); g.globalAlpha = 0.8; D.figure(g, sx, 190, 150, { col: K, lean: 0.35, claw: true, hat: 'top' }); g.restore();
    }
  };

  P.couloir = function (g, t, st) {
    // le soufflet : des cadres de cuir emboîtés, de travers, qui respirent
    var b = 1 + 0.018 * Math.sin(t * 1.7), vx = 214, vy = 150;
    for (var k = 0; k < 9; k++) {
      var s = Math.pow(0.8, k) * b, a = Math.sin(k * 1.9 + t * 0.4) * 0.05 + (k % 2 ? 0.05 : -0.04);
      var w = 236 * s, h = 168 * s, cx = vx + (k * 3 - 6), cy = vy - k * 2;
      var p = [];
      [[-1, -1.08], [1.04, -1], [0.97, 1.02], [-1.02, 0.95]].forEach(function (q) {
        var x = q[0] * w, y = q[1] * h; p.push(cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a));
      });
      D.poly(g, p, k === 8 ? R : (k % 2 ? K2 : K));
      g.beginPath(); D.path(g, p); g.lineWidth = Math.max(0.6, 2.4 * s); g.strokeStyle = k % 2 ? C2 : GR; g.stroke();
    }
    // au bout, la porte des voitures-lits, entrouverte
    D.poly(g, [206, 128, 222, 127, 223, 166, 205, 167], K); D.poly(g, [212, 130, 218, 130, 218, 164, 212, 165], C);
    // la fente dans le cuir, par où entre la pluie
    var slit = [318, 52, 334, 60, 330, 200, 312, 214, 322, 120];
    D.poly(g, slit, K2); this.rain(g, 30, 0.8, 0.35, 340, D.pp(slit));
    if (((t * 2) | 0) % 7 === 0) D.poly(g, slit, 'rgba(243,239,230,0.35)');
    // les traces mouillées qui rampent vers les voitures-lits
    var r = rng(5);
    for (var i = 0; i < 6; i++) {
      var x0 = 90 + r() * 220, p = [x0, 300];
      for (var s2 = 1; s2 <= 6; s2++) { var u = s2 / 6; p.push(lerp(x0, 214 + (r() - 0.5) * 12, u) + Math.sin(u * 9 + i) * 8 * (1 - u), lerp(300, 168, u)); }
      D.brush(g, p, 9 - i % 3 * 2, 0.6, i % 2 ? C2 : C);
    }
    D.dots(g, D.pp([60, 300, 200, 168, 230, 168, 360, 300]), 7, function (x, y) { return Math.max(0, Math.sin(x * 0.3 + y * 0.2 + t * 3)) * 1.3; }, C);
    if (st.san >= 2) { g.save(); g.globalAlpha = 0.85; D.figure(g, 120, 236, 170, { col: K, lean: -0.3, claw: true, flip: true }); g.restore(); }
  };

  P.lits = function (g, t, st) {
    var self = this;
    this.put('lits', function (c) {
      D.rect(c, 0, 0, W, H, K);
      // couloir qui file vers la gauche, de guingois
      D.poly(c, [0, 0, 400, 0, 130, 112, 92, 116], K2);
      D.poly(c, [400, 0, 400, 300, 128, 178, 130, 112], GR);
      D.dots(c, D.pp([400, 0, 400, 300, 128, 178, 130, 112]), 6, function (x) { return (400 - x) / 80; }, K);
      D.poly(c, [0, 0, 92, 116, 90, 184, 0, 300], K2);
      D.poly(c, [92, 116, 130, 112, 128, 178, 90, 184], R);
      D.poly(c, [0, 300, 90, 184, 128, 178, 400, 300], K);
      D.poly(c, [70, 300, 104, 182, 116, 181, 230, 300], R);
      D.dots(c, D.pp([70, 300, 104, 182, 116, 181, 230, 300]), 6, function (x, y) { return clamp((250 - y) / 25, 0, 3); }, DR);
      // portes des compartiments, hautes et penchées
      for (var k = 0; k < 5; k++) {
        var u = [0, 0.32, 0.55, 0.72, 0.84][k], u2 = u + 0.13 * (1 - u);
        var x0 = lerp(380, 130, u), x1 = lerp(380, 130, u2), top0 = lerp(30, 118, u), top1 = lerp(30, 118, u2), b0 = lerp(286, 176, u), b1 = lerp(286, 176, u2);
        var p = [x0, top0 + 6, x1, top1 + 4, x1 + 2, b1 - 2, x0 + 4, b0 - 4];
        D.poly(c, p, k === 1 ? K : C2);
        c.beginPath(); D.path(c, p); c.lineWidth = 1.5; c.strokeStyle = K; c.stroke();
        var mx = lerp(x0, x1, 0.5), my = lerp(top0, b0, 0.33);
        D.poly(c, [mx - 6 * (1 - u), my - 4 * (1 - u), mx + 6 * (1 - u), my - 5 * (1 - u), mx + 6 * (1 - u), my + 4 * (1 - u), mx - 6 * (1 - u), my + 5 * (1 - u)], k === 1 ? R : K);
      }
      // la porte 7, entrebâillée : un rai de lumière rouge
      D.poly(c, [318, 52, 326, 54, 330, 252, 316, 262], R);
      D.poly(c, [316, 262, 330, 252, 250, 300, 200, 300], 'rgba(227,32,45,0.55)');
      // fenêtres du côté gauche
      [[8, 70, 40, 90, 21], [52, 96, 26, 50, 22]].forEach(function (q) { D.poly(c, D.jag(q[0], q[1], q[2], q[3], q[4], 0.7), K); });
    });
    [[8, 70, 40, 90, 21], [52, 96, 26, 50, 22]].forEach(function (q) { self.nightWin(g, D.jag(q[0], q[1], q[2], q[3], q[4], 0.7), 120); });
    // traces luisantes vers la porte 7
    D.dots(g, D.pp([110, 300, 250, 236, 320, 262, 220, 300]), 6, function (x, y) { return Math.max(0, Math.sin(x * 0.25 - y * 0.3 + t * 2.4)) * 1.6; }, C);
    var lit = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 1.3);
    D.star(g, 250, 40, 9 * lit, C, t * 0.2); D.star(g, 150, 98, 4 * lit, C, t * 0.3);
    if (st.san >= 1) { var a = 0.55 + 0.35 * Math.sin(t * 0.7); g.save(); g.globalAlpha = a; D.figure(g, 112, 182, 62, { col: K, eyes: st.san >= 2 ? R : C }); g.restore(); }
  };

  P.compartiment = function (g, t, st) {
    var win = [118, 62, 296, 50, 306, 172, 108, 184];
    this.put('compart', function (c) {
      D.rect(c, 0, 0, W, H, K2);
      D.dots(c, null, 7, function (x, y) { return 1 + Math.abs(x - 200) / 100; }, K);
      D.poly(c, [0, 0, 400, 0, 380, 36, 20, 48], K);
      D.poly(c, win, K); c.beginPath(); D.path(c, win); c.lineWidth = 5; c.strokeStyle = C2; c.stroke();
      // le rideau rouge, tiré de travers
      D.poly(c, [300, 40, 350, 36, 344, 200, 320, 214, 306, 120], R);
      D.dots(c, D.pp([300, 40, 350, 36, 344, 200, 320, 214, 306, 120]), 5, function (x) { return clamp((x - 300) / 14, 0, 2.6); }, DR);
      // la couchette ; sous le drap, une forme humaine, trempée
      D.poly(c, [0, 214, 330, 204, 360, 252, 0, 268], GR);
      var sheet = [0, 206, 40, 190, 70, 176, 96, 172, 112, 184, 150, 186, 210, 180, 260, 186, 300, 176, 320, 196, 330, 214, 0, 232];
      D.poly(c, sheet, C);
      D.hatch(c, D.pp(sheet), 7, 0.25, 0.9, C2);
      D.poly(c, [70, 176, 96, 172, 112, 184, 84, 190], C2);
      // l'eau noire au sol
      D.poly(c, [0, 268, 360, 252, 400, 300, 0, 300], K);
    });
    this.nightWin(g, win, 170);
    if (((t * 1.3) | 0) % 5 === 0) D.poly(g, win, 'rgba(227,32,45,0.45)');
    // l'eau qui goutte du drap
    for (var d = 0; d < 5; d++) { var u = ((t * 0.7 + d * 0.21) % 1), dx = 60 + d * 56; D.rect(g, dx, 228 + u * 34, 1.6, 4, C); }
    D.dots(g, D.pp([0, 268, 360, 252, 400, 300, 0, 300]), 7, function (x, y) { return Math.max(0, Math.sin(x * 0.08 + Math.sin(y * 0.3 + t) * 2 + t)) * 2.2 * (x > 100 && x < 320 ? 1 : 0.3); }, C);
    // la lampe qui balance
    var sw = Math.sin(t * 1.4) * 0.35, lx = 200 + Math.sin(sw) * 40, ly = 20 + Math.cos(sw) * 30;
    D.line(g, [200, 0, lx, ly], 1, C2);
    D.rays(g, lx, ly, 7, 20, 150, 0.05, 'rgba(243,239,230,0.16)', 9, Math.PI * 0.3 + sw, Math.PI * 0.7 + sw);
    D.star(g, lx, ly, 6, C, t);
    if ((st.san | 0) >= 2 || this.on('madness')) { D.circ(g, 84, 181, 1.6, R); D.circ(g, 96, 180, 1.6, R); }
  };

  P.title = function (g, t, st) {
    // la nuit, un viaduc, l'express qui passe
    this.put('ptitle', function (c) {
      D.rect(c, 0, 0, W, H, K);
      D.poly(c, [-20, 40, 420, 0, 420, 170, -20, 210], R);
      D.dots(c, D.pp([-20, 40, 420, 0, 420, 170, -20, 210]), 6, function (x, y) { return clamp(y / 60 - x / 300, 0, 3.3); }, DR);
      D.circ(c, 300, 60, 26, C); D.dots(c, function (cc) { cc.arc(300, 60, 26, 0, TAU); }, 4, function (x, y) { return clamp((x - 290) / 10, 0, 2); }, C2);
      D.poly(c, [0, 300, 0, 200, 70, 150, 120, 190, 190, 140, 260, 196, 330, 150, 400, 186, 400, 300], K2);
      D.rect(c, 0, 200, W, 12, K);
      for (var x = 10; x < W; x += 44) D.poly(c, [x, 300, x, 230, x + 20, 214, x + 40, 230, x + 40, 300, x + 34, 300, x + 34, 236, x + 20, 224, x + 6, 236, x + 6, 300], K);
    });
    var x = ((t * 40) % 760) - 340;
    g.save(); g.translate(x, 0);
    D.poly(g, [0, 200, 70, 200, 72, 176, 60, 176, 58, 160, 46, 160, 46, 176, 0, 178], K);
    for (var k = 0; k < 4; k++) { D.rect(g, -80 - k * 74, 176, 70, 24, K); for (var j = 0; j < 5; j++) D.rect(g, -76 - k * 74 + j * 13, 181, 8, 8, (j + k) % 3 ? C : R); }
    for (var s = 0; s < 5; s++) { var u = ((t * 0.8 + s * 0.2) % 1); this.puff(g, 52 - u * 120, 150 - u * 40, 10 + u * 22, 1 - u, C2); }
    g.restore();
    this.rain(g, 80, 0.35, 0.4, 320);
  };

  P.blackout = function (g, t) {
    D.rect(g, 0, 0, W, H, K);
    var lx = W - ((t * 520) % (W + 300));
    D.poly(g, [lx, 0, lx + 40, 0, lx - 60, H, lx - 110, H], 'rgba(243,239,230,0.85)');
    D.poly(g, [lx + 70, 0, lx + 80, 0, lx - 20, H, lx - 34, H], R);
    if (((t * 3) | 0) % 5 === 0) { D.rect(g, 190, 150, 3, 2, C); D.rect(g, 205, 150, 3, 2, C); }
  };

  // ======================================================================= rendu
  // ------------------------------------------------------------------ les images peintes
  // Chaque décor peut avoir son image ; le code ne dessine plus alors que ce qui bouge par-dessus.
  var PHOTO_LIST = ['ecran-titre/titre', 'prologue/01_wagon-restaurant', 'prologue/02_soufflet', 'prologue/03_voitures-lits', 'prologue/04_compartiment-7'];
  Art.PHOTO_LIST = PHOTO_LIST;
  // au bord du gouffre, l'investigateur ne voit plus que son propre visage (le gros plan paranoïaque de sa fiche),
  // quand l'image existe et qu'elle est arrivée ; sinon, les décors comme avant
  var VISAGE_FX = { prowl: { x: 110, y: 300, h: 210, lean: 0.45, san: 3, sway: 30 } };
  P.photoKey = function (scene, st) {
    var f = st.flags || {};
    if (st.visage && (st.san | 0) >= 3 && scene !== 'title') {
      if (this.photo(st.visage)) { if (!PHOTO_V2[st.visage]) PHOTO_V2[st.visage] = VISAGE_FX; return st.visage; }
    }
    // un chapitre peut désigner lui-même l'image d'un décor (G.PHOTO_SCENES[décor] = clé, ou fonction de l'état)
    var ps = G.PHOTO_SCENES && G.PHOTO_SCENES[scene];
    if (ps) return typeof ps === 'function' ? ps(st) : ps;
    switch (scene) {
      case 'title': return 'ecran-titre/titre';
      case 'restaurant': return 'prologue/01_wagon-restaurant';
      case 'couloir': return 'prologue/02_soufflet';
      case 'lits': return 'prologue/03_voitures-lits';
      case 'compartiment': return 'prologue/04_compartiment-7';
    }
    if (scene.indexOf('pt_') === 0 && this.photoKeyP) return this.photoKeyP(scene.slice(3), st);
    return this.photoKeyL ? this.photoKeyL(scene, st) : null;
  };
  P.photo = function (key) {
    var imgs = this.imgs || (this.imgs = {}), im = imgs[key];
    if (!im) {
      im = new Image(); im.decoding = 'async';
      im.onload = function () { im._ok = true; }; im.onerror = function () { im._bad = true; };
      im.src = (G.PHOTO_BASE || 'img/') + key + '.webp'; imgs[key] = im;
    }
    return im._ok ? im : null;
  };
  P.photoPending = function (key) { var im = this.imgs && this.imgs[key]; return !!(im && !im._ok && !im._bad); };
  // on charge tout, une image après l'autre, sans gêner le reste
  P.preloadPhotos = function () {
    var self = this, keys = PHOTO_LIST.slice(), i = 0;
    (function next() {
      if (i >= keys.length) return;
      self.photo(keys[i]); var im = self.imgs[keys[i++]];
      if (im._ok || im._bad) { setTimeout(next, 20); return; }
      im.addEventListener('load', function () { setTimeout(next, 20); }); im.addEventListener('error', function () { setTimeout(next, 20); });
    })();
  };
  // ce qui diffère entre deux états d'un même décor dessiné, posé par-dessus l'image peinte
  P.patch = function (g, key0, key1, fn0, fn1, gray) {
    if (key0 === key1) return;
    var id = 'patch:' + key0 + '>' + key1 + (gray || ''), cv = this.cache[id];
    if (!cv) {
      var a = this.lay(key0, fn0), b = this.lay(key1, fn1), w = b.width, h = b.height;
      cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      try {
        var da = a.getContext('2d').getImageData(0, 0, w, h).data, bi = b.getContext('2d').getImageData(0, 0, w, h), db = bi.data;
        for (var i = 0; i < db.length; i += 4) {
          if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) < 24) { db[i + 3] = 0; continue; }
          // ramené aux gris de l'image peinte, pour que la retouche ne se voie pas
          if (gray) { var l = (0.3 * db[i] + 0.59 * db[i + 1] + 0.11 * db[i + 2]) * gray; db[i] = db[i + 1] = db[i + 2] = l; }
        }
        cv.getContext('2d').putImageData(bi, 0, 0);
      } catch (e) { cv.getContext('2d').drawImage(b, 0, 0); }
      this.cache[id] = cv; this.ck.push(id);
    }
    g.drawImage(cv, 0, 0, W, H);
  };
  // la nouvelle série d'images : chacune déclare ses points d'animation (bougie, braise, lampe, fumée, pluie…),
  // mesurés sur l'image elle-même, en coordonnées 400 × 300
  var PHOTO_V2 = {};
  Art.PHOTO_V2 = PHOTO_V2;
  P.ph_v2 = function (g, t, st, sp) {
    var self = this;
    (sp.rain || []).forEach(function (r) { self.rain(g, r.n || 30, r.a || 0.5, 0.35, 300, D.pp(r.pts)); });
    if (sp.fog) this.fog(g, sp.fog[0], sp.fog[1], 8, 'rgba(185,177,164,0.35)', 0.9, 6);
    (sp.lamps || []).forEach(function (l, i) { var f = self.on('flicker') ? (self.rnd() < 0.5 ? 0.2 : 1) : 0.88 + 0.12 * Math.sin(t * (5 + i)) * Math.sin(t * 1.3 + i); D.star(g, l[0], l[1], (l[2] || 6) * f, C, t * 0.15 + i); });
    (sp.candles || []).forEach(function (c, i) {
      var f = 0.75 + 0.25 * Math.sin(t * 13 + i) * Math.sin(t * 3.1 + i);
      g.globalAlpha = 0.07 * (1 - f); D.rect(g, 0, 0, W, H, K); g.globalAlpha = 0.35 * f;
      D.star(g, c[0], c[1], 7 * f, R, t); D.star(g, c[0], c[1] + 1, 3 * f, C, -t); g.globalAlpha = 1;
    });
    (sp.embers || []).forEach(function (e) {
      var f = 0.6 + 0.4 * Math.sin(t * 2.2);
      g.globalAlpha = 0.6 * f; D.circ(g, e[0], e[1], 1.4 + f, R); g.globalAlpha = 1;
      for (var k = 0; k < 3; k++) { var u = ((t * 0.3 + k / 3) % 1), x = e[0] + Math.sin(t * 1.2 + k * 2) * 8 * u, y = e[1] - 6 - u * 70; g.globalAlpha = (1 - u) * 0.35; D.brush(g, [x, y + 8, x + 8, y + 3, x - 8, y - 3, x + 2, y - 9], 0.5, 1.8, C); }
      g.globalAlpha = 1;
    });
    if (sp.prowl && ((st.san | 0) >= (sp.prowl.san || 2) || this.on('madness'))) { var q = sp.prowl; prowl(g, q.x + Math.sin(t * 0.25) * (q.sway || 20), q.y, q.h, { col: K, lean: q.lean || 0.3, claw: true, hat: q.hat, a: 0.55 }); }
    if (sp.eyes && ((st.san | 0) >= 2 || this.on('madness'))) sp.eyes.forEach(function (e) { D.circ(g, e[0], e[1], 1.1, R); });
  };
  // une ombre qui rôde, commune à plusieurs décors
  function prowl(g, x, y, h, o) { g.save(); g.globalAlpha = o.a || 0.8; D.figure(g, x, y, h, o); g.restore(); }
  Art.prowl = prowl;
  P.ph_title = function (g, t) { this.rain(g, 80, 0.35, 0.4, 320); };
  P.ph_restaurant = function (g, t, st) {
    var f = st.flags || {}, self = this, key = 'rest' + (f.servietteTaken ? 1 : 0) + (f.verreCasse ? 1 : 0) + (f.serveurPart ? 1 : 0);
    this.patch(g, 'rest000', key, function (c) { restBg(c, {}); }, function (c) { restBg(c, f); }, 0.7);
    RWIN.forEach(function (wd, i) { self.nightWin(g, winPts(wd), i < 3 ? 140 : 110); });
    if (this.on('face')) {
      var p = winPts(RWIN[0]); g.save(); g.beginPath(); D.path(g, p); g.clip();
      D.ell(g, 44, 132, 15, 21, C); D.ell(g, 37, 126, 4, 5.5, K); D.ell(g, 51, 126, 4, 5.5, K); D.ell(g, 44, 145, 4, 7, K);
      g.restore();
    }
    var fl = this.on('flicker') ? (this.rnd() < 0.5 ? 0.2 : 1) : 0.9 + 0.1 * Math.sin(t * 9) * Math.sin(t * 2.3);
    [[150, 40, 15], [212, 76, 9], [244, 92, 5]].forEach(function (l, i) { D.star(g, l[0], l[1], l[2] * fl, C, t * 0.15 + i); });
    [[112, 186], [300, 196]].forEach(function (l) { D.rays(g, l[0], l[1], 9, 18, 52 * fl, 0.06, 'rgba(243,239,230,' + (0.16 * fl) + ')', 40, Math.PI * 1.05, Math.PI * 1.95); D.star(g, l[0], l[1] + 2, 5 * fl, C, t * 0.4); });
    if (st.san >= 2 || this.on('madness')) prowl(g, 300 + Math.sin(t * 0.25) * 30, 190, 150, { col: K, lean: 0.35, claw: true, hat: 'top' });
  };
  P.ph_couloir = function (g, t, st) {
    var slit = [318, 52, 334, 60, 330, 200, 312, 214, 322, 120];
    this.rain(g, 30, 0.8, 0.35, 340, D.pp(slit));
    if (((t * 2) | 0) % 7 === 0) D.poly(g, slit, 'rgba(243,239,230,0.3)');
    D.dots(g, D.pp([60, 300, 200, 168, 230, 168, 360, 300]), 7, function (x, y) { return Math.max(0, Math.sin(x * 0.3 + y * 0.2 + t * 3)) * 1.1; }, C);
    if (st.san >= 2) prowl(g, 120, 236, 170, { col: K, lean: -0.3, claw: true, flip: true, a: 0.85 });
  };
  P.ph_lits = function (g, t, st) {
    var self = this;
    [[8, 70, 40, 90, 21], [52, 96, 26, 50, 22]].forEach(function (q) { self.nightWin(g, D.jag(q[0], q[1], q[2], q[3], q[4], 0.7), 120); });
    D.dots(g, D.pp([110, 300, 250, 236, 320, 262, 220, 300]), 6, function (x, y) { return Math.max(0, Math.sin(x * 0.25 - y * 0.3 + t * 2.4)) * 1.4; }, C);
    var lit = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 1.3);
    D.star(g, 250, 40, 9 * lit, C, t * 0.2); D.star(g, 150, 98, 4 * lit, C, t * 0.3);
    if (st.san >= 1) prowl(g, 112, 182, 62, { col: K, eyes: st.san >= 2 ? R : C, a: 0.55 + 0.35 * Math.sin(t * 0.7) });
  };
  P.ph_compartiment = function (g, t, st) {
    var win = [118, 62, 296, 50, 306, 172, 108, 184];
    if (win) { this.nightWin(g, win, 170); if (((t * 1.3) | 0) % 5 === 0) D.poly(g, win, 'rgba(227,32,45,0.4)'); }
    for (var d = 0; d < 5; d++) { var u = ((t * 0.7 + d * 0.21) % 1), dx = 60 + d * 56; D.rect(g, dx, 228 + u * 34, 1.6, 4, C); }
    D.dots(g, D.pp([0, 268, 360, 252, 400, 300, 0, 300]), 7, function (x, y) { return Math.max(0, Math.sin(x * 0.08 + Math.sin(y * 0.3 + t) * 2 + t)) * 1.8 * (x > 100 && x < 320 ? 1 : 0.3); }, C);
    var sw = Math.sin(t * 1.4) * 0.35;
    D.rays(g, 200 + Math.sin(sw) * 40, 20 + Math.cos(sw) * 30, 7, 20, 150, 0.05, 'rgba(243,239,230,0.12)', 9, Math.PI * 0.3 + sw, Math.PI * 0.7 + sw);
    if ((st.san | 0) >= 2 || this.on('madness')) { D.circ(g, 84, 181, 1.6, R); D.circ(g, 96, 180, 1.6, R); }
  };

  P.frame = function (dt) {
    this.t += dt;
    if (++this.chk % 24 === 1) this.resize(false);
    var g = this.g, st = this.state || {}, RS = this.RS, san = st.san | 0, t = this.t;
    g.setTransform(RS, 0, 0, RS, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    var CWd = this.CW || W;
    D.rect(g, 0, 0, CWd, H, K);
    var pk = this.photos !== false ? this.photoKey(this.scene, st) : null, ph = pk ? this.photo(pk) : null;
    // cadrage du recadrage plein écran : les portraits gardent le haut (les visages), les décors le milieu
    if (pk !== this._focusKey) {
      this._focusKey = pk;
      var fy = !pk ? 46 : (Art.PHOTO_FOCUS && Art.PHOTO_FOCUS[pk] !== undefined) ? Art.PHOTO_FOCUS[pk] : /^portraits\//.test(pk) ? 24 : 46;
      this._fy = fy;
      var host = this.out && this.out.parentNode; if (host && host.style) host.style.setProperty('--focus', (CWd > W ? 50 : fy) + '%');
      // où est le sujet, de gauche à droite (0 à 1) : la disposition « image en fond » s'en sert pour cadrer
      var fxc = pk && Art.PHOTO_CADRAGE && Art.PHOTO_CADRAGE[pk] !== undefined ? Art.PHOTO_CADRAGE[pk] : 50;
      if (host && host.style) host.style.setProperty('--fx', String(fxc / 100));
      if (this.onCadre) this.onCadre(pk, fxc / 100);
    }
    // en format cinéma, un dessin ou une image 4:3 est agrandi(e) à la largeur du cadre et recadré(e) en hauteur
    var kx = CWd / W, top = (H - H / kx) * ((this._fy === undefined ? 46 : this._fy) / 100);
    var wideImg = ph && ph.naturalWidth && ph.naturalWidth / ph.naturalHeight > 1.6;
    if (this.on('blackout')) { if (CWd > W) { g.save(); g.scale(kx, kx); g.translate(0, -top); this.blackout(g, t); g.restore(); } else this.blackout(g, t); }
    // l'image peinte n'est pas encore arrivée : du noir, jamais l'ancien dessin (il ne reste qu'en secours, si l'image manque)
    else if (pk && !ph && !(this.imgs && this.imgs[pk] && this.imgs[pk]._bad)) { (this._attendu || (this._attendu = {}))[pk] = true; }
    else if (ph) {
      // une respiration de caméra, très lente : l'image et ce qui bouge dessus restent solidaires
      var zs = 1.012 + 0.006 * Math.sin(t * 0.11), zx = (W * (zs - 1)) * (0.5 + 0.4 * Math.sin(t * 0.07)), zy = (H * (zs - 1)) * (0.5 + 0.4 * Math.cos(t * 0.05));
      zx = (CWd * (zs - 1)) * (0.5 + 0.4 * Math.sin(t * 0.07));
      g.save(); g.translate(-zx, -zy); g.scale(zs, zs);
      var imgW = ph.naturalWidth ? H * ph.naturalWidth / ph.naturalHeight : CWd;
      if (wideImg && imgW > CWd + 2) {
        // image cinéma dans un cadre 4:3 (l'écran titre) : on la recadre sans la déformer, autour de son sujet
        var fx = (Art.PHOTO_FOCUSX && Art.PHOTO_FOCUSX[pk] !== undefined) ? Art.PHOTO_FOCUSX[pk] : 50;
        g.translate(-(imgW - CWd) * fx / 100, 0);
        g.drawImage(ph, 0, 0, imgW, H);
        if (PHOTO_V2[pk]) this.ph_v2(g, t, st, PHOTO_V2[pk]);
        else { var ov0 = this['ph_' + (this.scene.indexOf('pt_') === 0 ? 'portrait' : this.scene)]; if (ov0) ov0.call(this, g, t, st); }
      } else if (wideImg || CWd === W) {
        // image au format du cadre : elle le remplit, ses animations sont mesurées dans le même repère
        g.drawImage(ph, 0, 0, CWd, H);
        if (PHOTO_V2[pk]) this.ph_v2(g, t, st, PHOTO_V2[pk]);
        else { var ov = this['ph_' + (this.scene.indexOf('pt_') === 0 ? 'portrait' : this.scene)]; if (ov) ov.call(this, g, t, st); }
      } else {
        g.scale(kx, kx); g.translate(0, -top);
        g.drawImage(ph, 0, 0, W, H);
        if (PHOTO_V2[pk]) this.ph_v2(g, t, st, PHOTO_V2[pk]);
        else { var ov2 = this['ph_' + (this.scene.indexOf('pt_') === 0 ? 'portrait' : this.scene)]; if (ov2) ov2.call(this, g, t, st); }
      }
      g.restore();
      // arrivée d'une image qu'on attendait : elle sort du noir, au lieu d'apparaître d'un coup
      if (this._attendu && this._attendu[pk]) { this._attendu[pk] = false; (this._fondu || (this._fondu = {}))[pk] = this.t; }
      var f0 = this._fondu && this._fondu[pk];
      if (f0 !== undefined) { var fa = (this.t - f0) / 0.9; if (fa < 1) D.rect(g, 0, 0, CWd, H, 'rgba(10,10,11,' + (1 - fa).toFixed(3) + ')'); else delete this._fondu[pk]; }
    }
    else if (CWd > W) { g.save(); g.scale(kx, kx); g.translate(0, -top); (this[this.scene] || this.restaurant).call(this, g, t, st); g.restore(); }
    else (this[this.scene] || this.restaurant).call(this, g, t, st);
    if (this.on('flicker') && this.rnd() < 0.35) D.rect(g, 0, 0, CWd, H, 'rgba(10,10,11,0.72)');
    // la folie : tout rougit, et parfois s'inverse
    var m = [0, 0, 0.14, 0.28][san] || 0; if (this.on('madness')) m = 0.55;
    if (m) { g.globalCompositeOperation = 'multiply'; D.rect(g, 0, 0, CWd, H, 'rgba(227,32,45,' + m + ')'); g.globalCompositeOperation = 'source-over'; }
    if ((san >= 3 && this.rnd() < 0.012) || (this.on('madness') && this.rnd() < 0.18)) { g.globalCompositeOperation = 'difference'; D.rect(g, 0, 0, CWd, H, C); g.globalCompositeOperation = 'source-over'; }
    if (ph) g.globalAlpha = 0.55;
    g.drawImage(this.lay('vign', vign), 0, 0, CWd, H); g.globalAlpha = 1;
    // tirage à l'écran, avec la houle de la santé mentale
    var o = this.o, pw = this.buf.width, ph = this.buf.height;
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1;
    var shake = this.on('shudder') ? 3 * RS : 0, sx = shake ? (this.rnd() - 0.5) * shake * 2 : 0, sy = shake ? (this.rnd() - 0.5) * shake : 0;
    var amp = ([0, 0.5, 1.5, 3][san] || 0) + (this.on('madness') ? 7 : 0);
    if (!amp) { if (shake) { o.fillStyle = K; o.fillRect(0, 0, pw, ph); } o.drawImage(this.buf, sx, sy); }
    else {
      o.fillStyle = K; o.fillRect(0, 0, pw, ph);
      var band = Math.max(2, Math.round(3 * RS));
      for (var y = 0; y < ph; y += band) o.drawImage(this.buf, 0, y, pw, band, Math.round(Math.sin(y / RS * 0.07 + t * 2.4) * amp * RS + sx), y + sy, pw, band);
    }
    // parasites : des bandes qui glissent, un trait rouge
    var gl = san >= 2 ? 0.035 * (san - 1) : 0; if (this.on('madness')) gl = 0.5; if (this.on('shudder')) gl = Math.max(gl, 0.3);
    if (gl && this.rnd() < gl) {
      for (var k = 0; k < 3 + san; k++) {
        var gy = Math.floor(this.rnd() * ph), gh = Math.floor((6 + this.rnd() * 26) * RS / 2), off = Math.round((this.rnd() - 0.5) * (14 + san * 10) * RS);
        o.drawImage(this.out, 0, gy, pw, gh, off, gy, pw, gh);
        if (k % 2 === 0) { o.fillStyle = 'rgba(227,32,45,0.6)'; o.fillRect(0, gy, pw, Math.max(1, Math.round(RS))); }
      }
    }
    // changement de plan : l'iris se ferme sur l'ancien décor, s'ouvre sur le nouveau
    if (this.trans < 1) {
      // l'iris attend, fermé, que l'image du nouveau décor soit arrivée (deux secondes au plus)
      var hold = pk && !ph && this.photoPending(pk) && this.trans >= 0.45 && (this.phWait = (this.phWait || 0) + dt) < 6;
      if (!hold) this.trans = Math.min(1, this.trans + dt * 1.3);
      var tr = this.trans;
      o.save(); o.setTransform(RS, 0, 0, RS, 0, 0);
      if (tr < 0.5) { if (this.hasPrev) o.drawImage(this.prevC, 0, 0, CWd, H); this.iris(o, this.hasPrev ? 1.3 * smooth(1 - tr * 2) : 0); }
      else this.iris(o, 1.3 * smooth((tr - 0.5) * 2));
      o.restore();
    } else this.phWait = 0;
    // les visions : une image du Mythe, le temps d'une ou deux images seulement, au hasard, quand la raison lâche.
    // Préchargées dès que l'investigateur est troublé, pour qu'elles tombent sans délai ; coupées par le menu et
    // quand l'appareil demande moins d'animations.
    var VIS = Art.VISIONS, self = this;
    if (VIS && VIS.length && this.visions !== false && san >= 1) {
      if (!this._visPre) { this._visPre = true; VIS.forEach(function (k) { self.photo(k); }); }
      if (this.flashN > 0) {
        var fim = this.photo(this.flashK);
        if (fim) { o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.drawImage(fim, 0, 0, pw, ph); o.restore(); }
        this.flashN--;
      } else if (san >= 2 && this.trans >= 1 && this.rnd() < dt / (san >= 3 ? 12 : 40)) {
        var prets = VIS.filter(function (k) { return self.imgs && self.imgs[k] && self.imgs[k]._ok; });
        if (prets.length) { this.flashK = prets[Math.floor(this.rnd() * prets.length)]; this.flashN = this.rnd() < 0.5 ? 1 : 2; }
      }
    }
  };

  Art.INK = INK; Art.D = D;
  Art.util = { W: W, H: H, lerp: lerp, clamp: clamp, rng: rng, smooth: smooth, INK: INK, D: D, TAU: TAU };
  G.PixelArt = Art;
})(typeof window !== 'undefined' ? window : globalThis);
