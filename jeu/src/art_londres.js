/* Décors du chapitre de Londres, peints comme des toiles de Caligari : rues qui penchent,
   fenêtres en lame, lumières et ombres peintes, brouillard tramé, et le train fantôme. */
(function (G) {
  'use strict';
  var A = G.PixelArt, P = A.prototype, U = A.util, D = U.D, I = U.INK, W = U.W, H = U.H, rng = U.rng, TAU = U.TAU, clamp = U.clamp, lerp = U.lerp;
  var K = I.K, K2 = I.K2, GR = I.GR, R = I.R, DR = I.DR, C = I.C, C2 = I.C2;
  function hour(st) { return (((st.min === undefined ? 1215 : st.min) / 60) % 24 + 24) % 24; }
  function night(st) { var h = hour(st); return h < 7.5 || h >= 16.5; }
  function pt(id) { return A.PORTRAITS[id]; }

  // ciel : la nuit, une dalle rouge sombre ; le jour, un blanc sale tramé
  function sky(c, nt, y1) {
    if (nt) { D.rect(c, 0, 0, W, y1, K2); D.poly(c, [-20, 30, 420, 0, 420, y1 * 0.6, -20, y1 * 0.85], DR); D.circ(c, 330, 52, 18, C); D.dots(c, function (cc) { cc.arc(330, 52, 18, 0, TAU); }, 4, function (x) { return clamp((x - 322) / 8, 0, 2); }, C2); }
    else { D.rect(c, 0, 0, W, y1, C2); D.dots(c, null, 6, function (x, y) { return clamp(2.6 - y / 50 + Math.sin(x * 0.02) * 0.6, 0, 3); }, GR, 0, 0, W, y1); }
  }
  // rue de Caligari : maisons qui se penchent l'une vers l'autre, pavés, réverbère
  function street(c, nt, seed, opt) {
    sky(c, nt, 200);
    var lit = nt ? C : C2, un = nt ? K2 : GR, wall = nt ? K : K2;
    D.house(c, -20, 230, 90, 210, 0.22, seed, wall, lit, un);
    D.house(c, 62, 222, 70, 160, 0.14, seed + 1, wall, nt ? R : lit, un);
    D.house(c, 280, 222, 70, 170, -0.16, seed + 2, wall, lit, un);
    D.house(c, 336, 232, 90, 220, -0.24, seed + 3, wall, lit, un);
    D.house(c, 150, 196, 40, 110, 0.05, seed + 4, K2, lit, un); D.house(c, 196, 196, 50, 130, -0.06, seed + 5, K2, lit, un);
    // la chaussée qui s'enfuit, pavés tramés
    var road = [0, 300, 150, 198, 250, 198, 400, 300];
    D.poly(c, road, nt ? K2 : GR);
    D.dots(c, D.pp(road), 7, function (x, y) { return clamp((y - 196) / 40, 0, 2.6) * (0.6 + 0.4 * Math.sin(x * 0.7) * Math.sin(y * 0.9)); }, nt ? GR : K);
    D.poly(c, [0, 230, 150, 196, 150, 198, 0, 300], K); D.poly(c, [400, 232, 250, 196, 250, 198, 400, 300], K);
    // lumière peinte sur le pavé, sous le réverbère
    D.poly(c, [180, 300, 230, 230, 268, 236, 330, 300], nt ? 'rgba(243,239,230,0.55)' : 'rgba(243,239,230,0.3)');
    if (opt && opt.shop) {
      D.poly(c, [20, 300, 24, 200, 96, 214, 96, 300], K);
      D.poly(c, [30, 286, 33, 216, 88, 226, 88, 284], R);
      D.dots(c, D.pp([30, 286, 33, 216, 88, 226, 88, 284]), 5, function (x, y) { return 1 + (y - 220) / 40; }, DR);
      [[44, 250], [60, 238], [74, 258]].forEach(function (q) { D.ell(c, q[0], q[1], 6, 8, C2); D.circ(c, q[0] - 2, q[1] - 2, 1.4, K); D.circ(c, q[0] + 2, q[1] - 2, 1.4, K); });
      D.poly(c, [16, 196, 110, 206, 108, 222, 14, 212], C); D.line(c, [24, 208, 100, 216], 2, K);
    }
  }
  P.lamp = function (g, x, y, h, lean, on) {
    D.line(g, [x, y, x + lean * h, y - h, x + lean * h - 10, y - h - 6], 3.4, K);
    if (on !== false) { var f = 0.85 + 0.15 * Math.sin(this.t * 6.1) * Math.sin(this.t * 1.7); D.rays(g, x + lean * h - 10, y - h - 4, 12, 10, 64 * f, 0.07, 'rgba(243,239,230,0.3)', 21); D.star(g, x + lean * h - 10, y - h - 4, 11 * f, C, this.t * 0.1); }
  };

  // ---------------------------------------------------------------- l'Institut impérial (la maquette)
  P.institut = function (g, t, st) {
    var conf = st.flags && st.flags.conference, self = this;
    this.put('inst_back', function (c) {
      D.rect(c, 0, 0, W, H, K);
      var slab = [-30, 60, 430, 10, 430, 236, -30, 282];
      D.poly(c, slab, R);
      D.dots(c, D.pp(slab), 6, function (x, y) { return 2.9 * clamp((y / H) * 1.3 - (x / W) * 0.7 + 0.05, 0, 1); }, DR);
      D.dots(c, null, 7, function (x, y) { return y < 60 ? 1.1 * (1 - y / 60) : 0; }, K2);
      D.line(c, [70, 0, 70, 30], 0.6, C); D.line(c, [306, 0, 306, 14], 0.6, C);
    });
    D.star(g, 70, 40, 13 + 2 * Math.sin(t * 2.3), C, t * 0.2); D.star(g, 306, 22, 9 + 1.5 * Math.sin(t * 2.9 + 1), C, -t * 0.2);
    // le faisceau tramé du projecteur
    var beam = this.lay('inst_beam', function (c) { D.dots(c, D.pp([336, 330, 158, 163, 330, 151]), 5, function (x, y) { return 0.4 + 2.1 * Math.max(0, 1 - (y - 150) / 170); }, C); });
    g.globalAlpha = clamp(0.55 + 0.25 * Math.sin(t * 3) + (this.rnd() - 0.5) * 0.12, 0, 1); g.drawImage(beam, 0, 0, W, H); g.globalAlpha = 1;
    // l'écran : la conférence projette l'Orient-Express
    g.save(); g.translate(241, 105); g.rotate(-0.07);
    D.rect(g, -86, -52, 172, 104, C); g.lineWidth = 2; g.strokeStyle = K; g.strokeRect(-86, -52, 172, 104);
    g.beginPath(); g.rect(-86, -52, 172, 104); g.clip();
    var gx = -130 + ((t * 12) % 250);
    g.globalAlpha = 0.85;
    D.poly(g, [gx, 30, gx + 46, 30, gx + 48, 12, gx + 38, 12, gx + 36, -4, gx + 26, -4, gx + 26, 12, gx, 14], K);
    for (var k = 0; k < 3; k++) { D.rect(g, gx - 44 - k * 42, 10, 40, 20, K); D.rect(g, gx - 40 - k * 42, 14, 32, 6, C2); }
    this.puff(g, gx + 30, -16, 16, 0.9, K);
    if ((st.san | 0) >= 2) { g.globalAlpha = 0.3 + 0.1 * Math.sin(t * 2); D.poly(g, [-40, 0, 0, -28, 40, 0, 0, 28], K); D.circ(g, Math.sin(t * 0.7) * 8, 0, 10, R); }
    g.restore(); g.globalAlpha = 1;
    // premier plan : public, profil de Smith, Beddows, l'homme à la moustache
    this.put('inst_front' + (conf ? 1 : 0), function (c) {
      D.crowd(c, [[256, 10, 34], [278, 12, 40], [302, 15, 48]], 150, W, C);
      // Beddows, droit comme un I, derrière son maître
      D.figure(c, 150, 236, 120, { col: K, rim: C2, wide: 11, flare: 13 });
      var head = [0, 300, 0, 168, 10, 132, 46, 122, 76, 118, 86, 136, 92, 150, 88, 156, 106, 174, 94, 180, 97, 190, 91, 198, 88, 210, 78, 214, 104, 236, 150, 262, 156, 300];
      D.poly(c, head, K);
      D.line(c, [46, 122, 76, 118, 86, 136, 92, 150, 88, 156, 106, 174, 94, 180, 97, 190, 91, 198], 2.2, R);
      var burn = [56, 150, 74, 156, 82, 186, 74, 206, 60, 192, 52, 166];
      D.poly(c, burn, C); D.hatch(c, D.pp(burn), 4, 0.93, 1.3, K);
      D.poly(c, [84, 182, 98, 184, 104, 191, 94, 189, 84, 191], C);
      D.poly(c, [76, 151, 86, 150, 84, 153.5, 77, 153.5], C);
      c.beginPath(); c.moveTo(14, 146); c.quadraticCurveTo(24, 128, 40, 126); c.moveTo(8, 158); c.quadraticCurveTo(16, 140, 30, 134); c.lineWidth = 1; c.strokeStyle = C; c.stroke();
      D.line(c, [97, 193, 124, 199], 5, K);
      D.rect(c, 120, 182, 11, 18, K); D.line(c, [120, 182.5, 131, 182.5], 1.5, R);
      D.rect(c, 352, 190, 48, 110, K); D.circ(c, 372, 176, 12, K); D.rect(c, 352, 162, 40, 4, K); D.rect(c, 360, 146, 24, 17, K);
      D.line(c, [352, 166, 352, 300], 1.2, R);
    });
    // la fumée de la pipe
    for (var s = 0; s < 4; s++) {
      var kk = ((t * 0.35 + s * 0.25) % 1), y = 180 - kk * 120, x = 126 + Math.sin(t * 1.3 + s * 2) * 10 * kk;
      g.globalAlpha = 1 - kk; D.brush(g, [x, y + 10, x + 12, y + 4, x - 12, y - 4, x + 2, y - 12], 0.5, 2.2, C);
    }
    g.globalAlpha = 1;
    D.circ(g, 125.5, 181, 1.6 + Math.sin(t * 4) * 0.4, R);
    if (((t * 0.4) | 0) % 6 !== 0) { D.rect(g, 146, 147, 2, 1.4, C); D.rect(g, 152, 147, 2, 1.4, C); }
    if (Math.floor(t * 2) % 9 !== 0) { D.rect(g, 365, 174, 3, 1.6, C); D.rect(g, 375, 174, 3, 1.6, C); }
    g.beginPath(); g.moveTo(364, 184); g.quadraticCurveTo(371, 180, 371, 182); g.quadraticCurveTo(371, 180, 380, 184); g.lineWidth = 1.6; g.strokeStyle = C; g.stroke();
  };

  // ---------------------------------------------------------------- l'hôtel : hall, escalier en zigzag, ombre qui monte
  P.hotel = function (g, t, st) {
    var nt = night(st), self = this;
    this.put('hotel' + (nt ? 'n' : 'd'), function (c) {
      D.rect(c, 0, 0, W, H, K2);
      D.poly(c, [0, 0, 400, 0, 400, 210, 0, 230], R);
      D.dots(c, D.pp([0, 0, 400, 0, 400, 210, 0, 230]), 8, function (x, y) { return 2 + Math.sin(x * 0.09) * Math.sin(y * 0.11) * 1.6; }, DR);
      // la haute fenêtre sur la rue
      var win = [292, 30, 360, 22, 368, 180, 286, 188];
      D.poly(c, win, nt ? K : C2);
      if (nt) { D.house(c, 290, 190, 30, 90, 0.1, 61, K2, C, K2); D.house(c, 322, 190, 40, 120, -0.08, 62, K2, R, K2); }
      else D.dots(c, D.pp(win), 6, function (x, y) { return 1.2 + y / 120; }, GR);
      D.line(c, [292, 30, 360, 22, 368, 180, 286, 188, 292, 30], 4, K); D.line(c, [326, 26, 327, 184], 3, K); D.line(c, [289, 104, 364, 100], 3, K);
      // l'escalier en zigzag et sa rampe
      var st0 = [], x = 60, y = 230;
      for (var s = 0; s < 9; s++) { st0.push(x, y); x += 14; st0.push(x, y); y -= 18; st0.push(x, y); }
      D.poly(c, [40, 300, 40, 230].concat(st0).concat([x + 6, y, x + 30, 300]), K);
      D.line(c, [46, 196, 190, 30, 214, 22], 3, C2);
      for (var b = 0; b < 9; b++) D.line(c, [60 + b * 14 + 3, 226 - b * 18, 46 + b * 16, 196 - b * 18.6], 1.4, C2);
      // le comptoir de la réception, en biais
      D.poly(c, [190, 210, 290, 200, 300, 262, 182, 276], K);
      D.poly(c, [184, 206, 296, 196, 300, 204, 186, 214], C2);
      D.star(c, 268, 196, 6, C);
      D.figure(c, 236, 206, 64, { col: K, rim: C2, coat: GR });
      // carrelage en losanges qui fuit
      for (var i = 0; i < 6; i++) for (var j = -6; j < 14; j++) {
        var y0 = 262 + i * 8 + i * i * 0.8, y1 = 262 + (i + 1) * 8 + (i + 1) * (i + 1) * 0.8, sc = 1 + i * 0.35;
        var x0 = 200 + (j - 4) * 30 * sc, x1 = 200 + (j - 4) * 30 * (1 + (i + 1) * 0.35);
        if ((i + j) % 2) D.poly(c, [x0, y0, x0 + 30 * sc, y0, x1 + 30 * (1 + (i + 1) * 0.35), y1, x1, y1], C2);
      }
      D.poly(c, [0, 262, 400, 262, 400, 300, 0, 300], 'rgba(10,10,11,0.0)');
    });
    var f = 0.85 + 0.15 * Math.sin(t * 5) * Math.sin(t * 1.3);
    D.line(g, [150, 0, 150, 36], 0.8, C2); D.star(g, 150, 46, 14 * f, C, t * 0.12);
    D.rays(g, 150, 46, 10, 16, 80 * f, 0.05, 'rgba(243,239,230,0.18)', 33);
    // l'ombre qui monte l'escalier, sur le mur rouge
    var cyc = (t * 0.05) % 1, show = (st.san | 0) >= 1 || cyc < 0.35;
    if (show) { var u = (cyc * 2.6) % 1; g.save(); g.globalAlpha = 0.75; D.figure(g, 80 + u * 120, 200 - u * 150, 150, { col: K, lean: -0.45, claw: true, hat: 'top' }); g.restore(); }
    if (nt) this.rain(g, 50, 0.6, 0.3, 300, D.pp([292, 30, 360, 22, 368, 180, 286, 188]));
  };

  // ---------------------------------------------------------------- Cheapside : la mansarde du brûlé
  P.garni = function (g, t, st) {
    var self = this;
    this.put('garni', function (c) {
      D.rect(c, 0, 0, W, H, GR);
      D.dots(c, null, 7, function (x, y) { return 1.4 + Math.abs(x - 200) / 90; }, K);
      D.poly(c, [0, 0, 400, 0, 400, 40, 120, 150, 0, 170], K);
      D.poly(c, [120, 150, 400, 40, 400, 54, 124, 160], C2);
      D.poly(c, [236, 46, 300, 22, 304, 74, 240, 96], K2); D.line(c, [236, 46, 300, 22, 304, 74, 240, 96, 236, 46], 2.5, C2);
      // le lit en biais et ses draps
      D.poly(c, [0, 214, 230, 196, 260, 262, 0, 300], K);
      D.poly(c, [0, 204, 212, 188, 240, 236, 0, 262], C);
      D.hatch(c, D.pp([0, 204, 212, 188, 240, 236, 0, 262]), 9, 0.35, 1, C2);
      D.poly(c, [20, 196, 90, 186, 98, 210, 26, 218], C2);
      D.poly(c, [6, 182, 120, 168, 130, 204, 12, 214], C2);
      self.portrait(c, pt('brule'), { x: 82, y: 178, s: 0.62, rot: -1.38, noBody: true });
      // table de nuit, bougie
      D.poly(c, [262, 220, 304, 216, 306, 300, 266, 300], K);
      D.poly(c, [278, 190, 284, 190, 284, 216, 278, 216], C);
      // Beddows, au pied du lit, et son ombre sur la pente du toit
      self.portrait(c, pt('beddows'), { x: 350, y: 132, s: 0.62, flip: true });
    });
    var f = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 3.1);
    D.rays(g, 281, 186, 16, 14, 150 * f, 0.045, 'rgba(243,239,230,0.22)', 81);
    D.star(g, 281, 186, 7 * f, R, t); D.star(g, 281, 186, 3.6 * f, C, -t);
    g.save(); g.globalAlpha = 0.5; g.translate(181, 0); g.transform(1, 0, -0.5 + Math.sin(t * 2.2) * 0.04 * f, 1, 0, 0); D.figure(g, 0, 230, 210, { col: K, hat: false }); g.restore();
    this.rain(g, 18, 0.7, 0.4, 280, D.pp([236, 46, 300, 22, 304, 74, 240, 96]));
  };

  // ---------------------------------------------------------------- la chambre de Stanley : des trains partout
  P.chambre = function (g, t, st) {
    var nt = night(st);
    this.put('chambre' + (nt ? 'n' : 'd'), function (c) {
      D.rect(c, 0, 0, W, H, C2);
      D.dots(c, null, 6, function (x, y) { return 1 + y / 160; }, GR);
      var r = rng(71);
      for (var k = 0; k < 14; k++) {
        var x = 10 + (k % 7) * 56 + r() * 10, y = 20 + Math.floor(k / 7) * 74 + r() * 10, w = 40 + r() * 10, h = 30 + r() * 10, a = (r() - 0.5) * 0.3;
        c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(a);
        D.rect(c, -w / 2, -h / 2, w, h, C); c.lineWidth = 1.5; c.strokeStyle = K; c.strokeRect(-w / 2, -h / 2, w, h);
        D.poly(c, [-w / 2 + 6, 8, -4, 8, -2, -4, -10, -4, -10, -10, -16, -10, -16, -4, -w / 2 + 6, -2], K); D.rect(c, -2, -2, w / 2 - 6, 10, k % 3 ? K : R);
        c.restore();
      }
      // la fenêtre verrouillée, de travers
      D.poly(c, [290, 160, 360, 152, 366, 250, 286, 258], nt ? K : C); D.line(c, [290, 160, 360, 152, 366, 250, 286, 258, 290, 160], 4, K); D.line(c, [326, 156, 326, 254], 3, K);
      D.circ(c, 326, 210, 5, R);
      // le lit étroit, les piles de revues
      D.poly(c, [0, 240, 200, 232, 220, 290, 0, 300], K); D.poly(c, [0, 230, 190, 222, 206, 250, 0, 262], C);
      for (var p = 0; p < 4; p++) { D.poly(c, [226 + p * 4, 300 - p * 18, 270 + p * 3, 298 - p * 18, 268 + p * 3, 282 - p * 18, 228 + p * 4, 284 - p * 18], p % 2 ? R : K); }
      // la suie au plafond
      D.poly(c, [0, 0, 400, 0, 400, 14, 0, 26], K);
      D.dots(c, null, 9, function (x, y) { return y < 70 ? 3.5 * (1 - y / 70) * (0.5 + 0.5 * Math.sin(x * 0.05)) : 0; }, K);
    });
    var sw = Math.sin(t * 0.9) * 0.15, lx = 140 + Math.sin(sw) * 30;
    D.line(g, [140, 0, lx, 40], 1, K); D.star(g, lx, 44, 8, C, t * 0.3);
    if ((st.san | 0) >= 1) { g.save(); g.globalAlpha = 0.6; D.figure(g, 320, 248, 90, { col: K, lean: 0.2, eyes: R }); g.restore(); }
  };

  // ---------------------------------------------------------------- bureaux : Yard, ambassade, Chelsea, Camberwell
  P.bureau = function (g, t, st) {
    var loc = st.loc || 'yard', who = { yard: 'fleming', ambassade: 'mustapha', chelsea: 'chelseaclerk', camberwell: 'butter', archives: 'pike' }[loc] || 'fleming';
    var sp = pt(who), bgk = typeof sp.bg === 'object' ? sp.bg.def : sp.bg, self = this;
    var o = { x: 236, y: 150, s: 0.62, flip: false };
    this.put('bureau_' + loc + (st.san | 0), function (c) {
      var BG = A.PORTRAIT_BG; if (BG[bgk]) BG[bgk](c); else D.rect(c, 0, 0, W, H, K2);
      if (loc === 'chelsea' || loc === 'camberwell') { var sl = [0, 40, 160, 20, 140, 300, 0, 300]; D.poly(c, sl, R); D.dots(c, D.pp(sl), 7, function (x, y) { return clamp(x / 50 + y / 300, 0, 3.4); }, DR); }
      if (loc === 'yard') { [[30, 60], [80, 50]].forEach(function (q, i) { c.save(); c.translate(q[0], q[1]); c.rotate(-0.1 + i * 0.15); D.rect(c, 0, 0, 40, 52, C); D.ell(c, 20, 22, 10, 13, K); D.rect(c, 4, 40, 32, 6, R); c.restore(); }); }
      if (loc === 'ambassade') { D.poly(c, [20, 300, 30, 60, 60, 20, 90, 60, 100, 300], K2); D.dots(c, D.pp([20, 300, 30, 60, 60, 20, 90, 60, 100, 300]), 6, function (x, y) { return 0.6 + y / 160; }, C2); }
      if (loc === 'vane') { D.circ(c, 200, 150, 9, R); D.rays(c, 200, 150, 10, 12, 90, 0.06, 'rgba(243,239,230,0.12)', 41); } // le salon de Mrs Vane : une bougie sous son globe rouge, en attendant son image
      else self.portrait(c, sp, o);
      // le bureau, au premier plan, en coin
      D.poly(c, [40, 228, 360, 214, 400, 268, 400, 300, 0, 300, 0, 262], K);
      D.poly(c, [40, 228, 360, 214, 372, 230, 30, 246], C2);
      D.poly(c, [120, 222, 170, 218, 176, 236, 118, 240], C); D.poly(c, [190, 216, 226, 214, 230, 228, 196, 232], C);
      D.line(c, [130, 226, 164, 223], 1, K); D.line(c, [130, 230, 158, 228], 1, K);
      D.poly(c, [300, 214, 312, 214, 316, 190, 296, 190], K); D.poly(c, [290, 192, 322, 190, 312, 172, 298, 172], R);
    });
    D.star(g, 306, 198, 6 + Math.sin(t * 7) * 0.6, C, t * 0.3);
    D.rays(g, 306, 198, 8, 10, 70, 0.07, 'rgba(243,239,230,0.2)', 19, Math.PI * 0.2, Math.PI * 1.1);
    var blink = (((t * 0.37) % 1) < 0.035) ? 1 : 0;
    if (blink) { g.save(); g.translate(o.x, o.y); g.scale(o.s * ((sp.light || 1) < 0 ? -1 : 1), o.s); this.ptEyes(g, sp, 1, st.san | 0, true); g.restore(); }
    if (sp.pipe || sp.cigarette) this.smoke(g, o, sp, t);
    if (bgk === 'blinds') A.PORTRAIT_BG.blindsOver(g);
    if (bgk === 'void') { g.save(); g.globalAlpha = 0.2; g.translate(250, 140); g.rotate(t * 0.15); g.translate(-250, -140); A.PORTRAIT_BG.void(g); g.restore(); }
  };

  // ---------------------------------------------------------------- rues : Islington (la boutique), Stoke Newington
  // ---------------------------------------------------------------- St John's Wood : la villa de Smith, puis ses ruines
  P.stjohn = function (g, t, st) {
    var nt = night(st), burnt = (st.min || 0) >= 2820, self = this;
    this.put('stjohn' + (nt ? 'n' : 'd') + (burnt ? 'b' : 'v'), function (c) {
      sky(c, nt, 210);
      if (burnt) { D.poly(c, [-20, 40, 420, 10, 420, 120, -20, 160], 'rgba(92,11,18,0.85)'); }
      D.house(c, -30, 230, 80, 170, 0.18, 801, K, nt ? C2 : GR, K2); D.house(c, 330, 232, 100, 190, -0.2, 802, K, nt ? C2 : GR, K2);
      // la villa, au fond du jardin
      var v = [110, 236, 300, 236, 306, 92, 252, 52, 160, 50, 104, 96];
      if (!burnt) {
        D.poly(c, v, nt ? K2 : GR); D.line(c, [104, 96, 160, 50, 252, 52, 306, 92], 4, K);
        for (var i = 0; i < 2; i++) for (var j = 0; j < 4; j++) D.poly(c, D.jag(126 + j * 42, 110 + i * 56, 22, 34, 810 + i * 4 + j, 0.5), (i === 0 && j === 2) ? (nt ? C : R) : K);
        if (!nt) for (var e = 0; e < 3; e++) D.line(c, [116 + e * 70, 236, 128 + e * 70, 70], 2, C2);
      } else {
        D.poly(c, [110, 236, 300, 236, 304, 130, 282, 150, 270, 96, 240, 132, 220, 70, 196, 120, 170, 84, 150, 140, 124, 110, 106, 160], K);
        for (var k = 0; k < 5; k++) D.poly(c, D.jag(124 + k * 34, 150 + (k % 2) * 30, 18, 26, 820 + k, 0.8), k % 2 ? DR : K2);
        D.line(c, [160, 236, 196, 120, 230, 236], 3, GR); D.line(c, [180, 140, 260, 128], 3, GR);
      }
      // la grille et le jardin
      D.poly(c, [0, 300, 0, 236, 400, 236, 400, 300], nt ? K2 : GR);
      for (var x = 0; x < W; x += 12) D.poly(c, [x, 260, x + 3, 236, x + 6, 260, x + 5, 262, x + 1, 262], K);
      D.rect(c, 0, 250, W, 4, K); D.rect(c, 0, 282, W, 18, K);
      D.dots(c, D.pp([0, 262, 400, 262, 400, 282, 0, 282]), 6, function (x) { return 1 + Math.sin(x * 0.3) * 0.8; }, K);
    });
    if (burnt) {
      for (var s2 = 0; s2 < 6; s2++) { var u = ((t * 0.07 + s2 / 6) % 1); this.puff(g, 190 + Math.sin(s2 * 2) * 40 + u * 30, 120 - u * 130, 14 + u * 40, (1 - u) * 0.9, GR); }
      D.figure(g, 330, 286, 76, { col: K, hat: 'helmet', rim: C2 });
      D.figure(g, 70, 288, 64, { col: K, hat: 'cap', rim: C2, flip: true });
    } else {
      var f = 0.85 + 0.15 * Math.sin(t * 3);
      if (nt) D.rays(g, 222, 127, 8, 10, 60 * f, 0.07, 'rgba(243,239,230,0.25)', 17, Math.PI * 0.1, Math.PI * 0.9);
      if (nt && ((t * 0.5) | 0) % 3 === 0) D.figure(g, 214, 140, 26, { col: K, lean: 0.1 });
    }
    this.lamp(g, 40, 290, 150, 0.1, nt);
    this.fog(g, 180, 100, 7, nt ? 'rgba(185,177,164,0.7)' : 'rgba(243,239,230,0.75)', 0.9, 6);
  };
  P.rue = function (g, t, st) {
    var loc = st.loc || 'islington', nt = night(st);
    if (loc === 'stjohn') return this.stjohn(g, t, st);
    this.put('rue_' + loc + (nt ? 'n' : 'd'), function (c) { street(c, nt, loc === 'islington' ? 101 : 131, { shop: loc === 'islington' }); });
    this.lamp(g, 290, 290, 160, -0.12, nt);
    this.fog(g, 160, 110, 8, nt ? 'rgba(185,177,164,0.75)' : 'rgba(243,239,230,0.8)', 1, 6);
    this.rain(g, 70, nt ? 0.5 : 0.35, 0.35, 320);
    if (loc === 'stoke') { D.figure(g, 214, 232, 70, { col: K, hat: 'helmet', rim: C2 }); }
    if ((st.san | 0) >= 1) { var u = (t * 0.07) % 1; g.save(); g.globalAlpha = 0.85; D.figure(g, 150 + u * 40, 214 + u * 10, 40 + u * 30, { col: K, hat: 'top', lean: 0.15, eyes: (st.san | 0) >= 2 ? R : C }); g.restore(); }
  };

  // ---------------------------------------------------------------- la boutique de Makryat
  P.boutique = function (g, t, st) {
    this.put('boutique', function (c) {
      D.rect(c, 0, 0, W, H, K);
      D.poly(c, [0, 0, 400, 0, 380, 220, 20, 236], K2);
      var r = rng(91);
      // étagères qui penchent, aiguières, carreaux
      for (var s = 0; s < 3; s++) {
        var y = 70 + s * 54, sk = (s - 1) * 0.06;
        D.poly(c, [30, y + 4, 230, y - 6 + sk * 40, 230, y + 2 + sk * 40, 30, y + 12], C2);
        for (var x = 40; x < 220; x += 18 + r() * 10) { var h = 14 + r() * 20; D.poly(c, [x, y + 4, x + 10, y + 3, x + 12, y - h, x + 2, y - h - 2], [GR, C2, R, K][(r() * 4) | 0]); }
      }
      // les lampes ajourées, comme des cages vides
      [[270, 40], [320, 66], [360, 36]].forEach(function (q) { D.line(c, [q[0], 0, q[0], q[1] - 16], 1, C2); D.poly(c, [q[0] - 10, q[1] - 16, q[0] + 10, q[1] - 16, q[0] + 14, q[1] + 6, q[0], q[1] + 18, q[0] - 14, q[1] + 6], GR); D.dots(c, D.pp([q[0] - 10, q[1] - 16, q[0] + 10, q[1] - 16, q[0] + 14, q[1] + 6, q[0], q[1] + 18, q[0] - 14, q[1] + 6]), 4, function () { return 1.2; }, K); });
      // le comptoir et le registre ; l'escalier au fond
      D.poly(c, [240, 210, 400, 196, 400, 300, 230, 300], K); D.poly(c, [244, 206, 400, 192, 400, 202, 246, 216], C2);
      D.poly(c, [300, 186, 340, 182, 344, 194, 302, 198], C); D.line(c, [306, 190, 336, 187], 1, K);
      D.poly(c, [370, 190, 400, 20, 400, 0, 360, 0, 360, 190], K);
      for (var k = 0; k < 8; k++) D.line(c, [362, 180 - k * 22, 400, 172 - k * 22], 2, GR);
      // tapis roulés au sol
      D.poly(c, [0, 260, 150, 240, 240, 300, 0, 300], R); D.dots(c, D.pp([0, 260, 150, 240, 240, 300, 0, 300]), 6, function (x, y) { return 1 + Math.sin(x * 0.2) * Math.sin(y * 0.3) * 1.6; }, DR);
      D.poly(c, [40, 236, 130, 228, 134, 246, 42, 254], C2); D.circ(c, 42, 245, 9, GR);
      // un masque au mur
      D.poly(c, [146, 18, 174, 18, 178, 44, 168, 72, 152, 72, 142, 44], C); D.poly(c, [148, 34, 158, 32, 158, 38, 150, 40], K); D.poly(c, [162, 32, 172, 34, 170, 40, 162, 38], K); D.line(c, [152, 60, 168, 60], 1.6, K); D.line(c, [160, 18, 160, 30], 1, C2);
    });
    // le rai de lumière de la porte
    var a = 0.22 + 0.06 * Math.sin(t * 0.8);
    D.poly(g, [0, 120, 26, 110, 230, 300, 120, 300], 'rgba(243,239,230,' + a + ')');
    D.dots(g, D.pp([0, 120, 26, 110, 230, 300, 120, 300]), 9, function (x, y) { return Math.max(0, Math.sin(x * 0.11 + t * 0.6) * Math.sin(y * 0.09 - t * 0.4)) * 1.2; }, C);
    if ((st.san | 0) >= 2) { D.circ(g, 154, 36, 1.4, R); D.circ(g, 167, 36, 1.4, R); }
  };

  // ---------------------------------------------------------------- la salle de lecture du British Museum
  P.lecture = function (g, t, st) {
    this.put('lecture', function (c) {
      D.rect(c, 0, 0, W, H, K);
      // la coupole : une ogive immense, ses côtes peintes qui convergent vers l'œil du dôme
      var dome = [-30, 200, -10, 120, 60, 50, 150, 10, 200, 2, 250, 10, 340, 50, 410, 120, 430, 200];
      D.poly(c, dome, K2);
      D.dots(c, D.pp(dome), 7, function (x, y) { return 0.6 + y / 90; }, K);
      for (var k = 0; k <= 14; k++) { var u = k / 14, bx = lerp(-30, 430, u), by = 200 - Math.sin(u * Math.PI) * 14; D.brush(c, [200, 2, lerp(200, bx, 0.55), lerp(2, by, 0.5) - Math.sin(u * Math.PI) * 30, bx, by], 0.6, 6, k % 2 ? GR : C2); }
      // la couronne de fenêtres en lame, à la base du dôme
      for (var w2 = 0; w2 < 9; w2++) { var u2 = (w2 + 0.5) / 9, x = lerp(10, 390, u2), y = 150 - Math.sin(u2 * Math.PI) * 26; D.poly(c, [x - 9, y + 26, x - 6, y - 4, x, y - 14, x + 6, y - 4, x + 9, y + 26], C); }
      D.poly(c, [-30, 196, 430, 196, 430, 212, -30, 212], K);
      // les puits de lumière qui tombent sur les pupitres
      for (var s2 = 0; s2 < 5; s2++) { var x0 = 50 + s2 * 75; D.poly(c, [x0 - 6, 160, x0 + 6, 160, x0 + 40 + (s2 - 2) * 14, 300, x0 - 10 + (s2 - 2) * 14, 300], 'rgba(243,239,230,0.13)'); }
      // les pupitres en rayons, autour du bureau central
      D.rect(c, 0, 212, W, 88, K2);
      for (var r2 = 0; r2 < 9; r2++) { var a = Math.PI * (1.08 + r2 / 8 * 0.84); D.brush(c, [200 + Math.cos(a) * 46, 296 + Math.sin(a) * 24, 200 + Math.cos(a) * 240, 296 + Math.sin(a) * 100], 3, 9, K); D.brush(c, [200 + Math.cos(a) * 50, 293 + Math.sin(a) * 24, 200 + Math.cos(a) * 240, 293 + Math.sin(a) * 100], 0.6, 1.6, GR); }
      D.ell(c, 200, 300, 64, 34, K); D.ell(c, 200, 296, 52, 26, C2); D.ell(c, 200, 292, 32, 14, K);
      // un lecteur solitaire, penché sur son livre
      D.figure(c, 310, 270, 64, { col: K, rim: C, lean: 0.3 });
      D.poly(c, [322, 230, 340, 226, 344, 234, 324, 238], C);
    });
    var f = 0.9 + 0.1 * Math.sin(t * 4);
    D.star(g, 200, 8, 9 * f, C, t * 0.1);
    D.dots(g, D.pp([30, 160, 380, 160, 400, 300, 20, 300]), 11, function (x, y) { return Math.max(0, Math.sin(x * 0.05 + y * 0.03 - t * 0.5)) * 0.9; }, C);
    D.star(g, 300, 226, 4 * f, C, t);
    if ((st.san | 0) >= 2) { g.save(); g.globalAlpha = 0.5; D.figure(g, 110, 300, 230, { col: K, lean: -0.3, claw: true }); g.restore(); }
  };

  // ---------------------------------------------------------------- la cave d'Arthur Butter : la maquette en huit
  function eightPt(u) { var a = u * TAU; return [228 + Math.sin(a) * 140, 246 + Math.sin(a * 2) * 22 - Math.cos(a) * 6]; }
  P.cave = function (g, t, st) {
    this.put('cave', function (c) {
      D.rect(c, 0, 0, W, H, K2);
      // mur de briques suintant, tramé
      D.dots(c, null, 7, function (x, y) { return 0.8 + Math.abs(x - 250) / 110 + (Math.sin(y * 0.4) > 0.6 ? 0.8 : 0); }, K);
      // la lumière de l'ampoule, peinte sur le mur en éclats crème
      D.poly(c, [250, 70, 330, 110, 392, 96, 360, 170, 400, 214, 300, 200, 250, 214, 190, 200, 120, 214, 150, 160, 110, 110, 180, 100], C2);
      D.dots(c, D.pp([250, 70, 330, 110, 392, 96, 360, 170, 400, 214, 300, 200, 250, 214, 190, 200, 120, 214, 150, 160, 110, 110, 180, 100]), 6, function (x, y) { return clamp(Math.hypot(x - 250, (y - 120) * 1.4) / 40 - 1, 0, 3.2); }, GR);
      // voûte en ogive, nervures noires, la clé en haut
      D.poly(c, [0, 0, 400, 0, 400, 70, 330, 26, 250, 6, 170, 26, 100, 70, 60, 120, 0, 150], K);
      D.brush(c, [100, 300, 104, 120, 170, 30, 250, 8], 14, 6, K); D.brush(c, [400, 300, 396, 120, 330, 30, 250, 8], 14, 6, K);
      D.brush(c, [104, 120, 170, 30, 250, 8], 2, 1, GR); D.brush(c, [396, 120, 330, 30, 250, 8], 2, 1, GR);
      // l'escalier qui descend de la trappe, à gauche, et sa rampe
      var p = [0, 50];
      for (var s2 = 0; s2 < 9; s2++) p.push(10 + s2 * 12, 50 + s2 * 18, 10 + s2 * 12, 68 + s2 * 18);
      D.poly(c, p.concat([118, 300, 0, 300]), K);
      D.line(c, [0, 20, 120, 168], 2.4, C2);
      D.poly(c, [0, 0, 60, 0, 40, 30, 0, 40], C2);
      // la lourde planche et sa voie en huit tordu, avec des rampes
      D.poly(c, [70, 214, 390, 206, 400, 276, 54, 290], K);
      D.poly(c, [70, 214, 390, 206, 394, 222, 66, 232], GR);
      D.poly(c, [74, 290, 84, 290, 86, 300, 72, 300], K); D.poly(c, [380, 280, 390, 280, 392, 300, 378, 300], K);
      c.beginPath(); for (var i = 0; i <= 160; i++) { var q = eightPt(i / 160); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }
      c.lineWidth = 5; c.strokeStyle = C2; c.stroke(); c.lineWidth = 1.4; c.strokeStyle = K; c.stroke();
      [[140, 246], [312, 238]].forEach(function (q) { D.poly(c, [q[0] - 16, q[1] + 12, q[0] + 16, q[1] + 12, q[0] + 5, q[1] - 8, q[0] - 5, q[1] - 8], C2); D.line(c, [q[0] - 16, q[1] + 12, q[0] - 5, q[1] - 8, q[0] + 5, q[1] - 8, q[0] + 16, q[1] + 12], 1, K); });
    });
    // l'ampoule qui grésille, sa lumière peinte en éclats
    var f = (this.rnd() < 0.06) ? 0.25 : 0.9 + 0.1 * Math.sin(t * 17);
    D.line(g, [250, 8, 250, 70], 1, C2);
    D.rays(g, 250, 76, 16, 10, 240 * f, 0.04, 'rgba(243,239,230,0.2)', 61, Math.PI * 0.12, Math.PI * 0.88);
    D.star(g, 250, 76, 10 * f, C, t * 0.2);
    // le petit train brun et noir qui tourne
    for (var w = 0; w < 5; w++) { var q = eightPt((((t * 0.05) - w * 0.016) % 1 + 1) % 1), q2 = eightPt((((t * 0.05) - w * 0.016 + 0.005) % 1 + 1) % 1); var a = Math.atan2(q2[1] - q[1], q2[0] - q[0]); g.save(); g.translate(q[0], q[1] - 5); g.rotate(a); D.rect(g, -7, -5, 14, 9, w ? (w % 2 ? K : GR) : K); D.rect(g, -7, -5, 14, 2, C2); if (!w) { D.circ(g, 7, -1, 2, R); D.rect(g, 1, -11, 4, 7, K); } g.restore(); }
    // l'ombre qui descend l'escalier, griffes en avant
    var u = (t * 0.05) % 1;
    if ((st.san | 0) >= 1 || u < 0.45) { var v = u / 0.45; g.save(); g.globalAlpha = 0.85; D.figure(g, 120 + v * 50, 150 + v * 90, 190, { col: K, lean: 0.55, claw: true, hat: 'top' }); g.restore(); }
  };

  // ---------------------------------------------------------------- le train fantôme
  P.fantome = function (g, t, st) {
    var loc = st.loc || 'wagon1', self = this, san = st.san | 0;
    if (loc === 'retour') return this.retour(g, t, st);
    this.put('fant_' + loc + san, function (c) {
      D.rect(c, 0, 0, W, H, K);
      // voiture qui fuit vers la droite, voûte en lame
      D.poly(c, [0, 0, 400, 0, 268, 104, 214, 108], K2);
      D.poly(c, [0, 0, 214, 108, 216, 190, 0, 300], GR);
      D.poly(c, [400, 0, 268, 104, 266, 186, 400, 300], K2);
      D.poly(c, [214, 108, 268, 104, 266, 186, 216, 190], loc === 'wagon2' ? R : C2);
      D.poly(c, [0, 300, 216, 190, 266, 186, 400, 300], K);
      // fenêtres : un ciel blême qui ne bouge pas
      [[20, 50, 50, 70], [94, 74, 36, 50], [150, 92, 24, 34], [300, 66, 50, 64], [342, 40, 48, 80]].forEach(function (q, i) { D.poly(c, D.jag(q[0], q[1], q[2], q[3], 300 + i, 0.5), C2); });
      if (loc === 'wagon1') {
        // les passagers morts, assis, du fond vers nous
        var seats = [[230, 186, 0.22], [254, 186, 0.22], [196, 198, 0.3], [286, 198, 0.3], [150, 222, 0.42], [330, 222, 0.42], [70, 262, 0.6]];
        seats.forEach(function (q, i) {
          var sp = Object.assign({}, pt('mort'), { seed: 11 + i * 7, hat: ['bowler', null, 'veil', null, 'bowler', null, 'fedora'][i], hair: ['none', 'short', 'none', 'parted', 'none', 'slick', 'none'][i], fw: 0.9 + (i % 3) * 0.08, light: i % 2 ? -1 : 1 });
          D.poly(c, [q[0] - 40 * q[2], q[1] - 20 * q[2], q[0] + 40 * q[2], q[1] - 22 * q[2], q[0] + 44 * q[2], q[1] + 70 * q[2], q[0] - 44 * q[2], q[1] + 70 * q[2]], K2);
          self.portrait(c, sp, { x: q[0], y: q[1], s: q[2], flip: q[0] > 220 });
        });
      } else {
        // le motif au sol, dans le dernier compartiment : un cœur tracé dans la suie
        D.poly(c, [150, 250, 250, 240, 300, 290, 120, 296], K2);
        c.beginPath(); c.moveTo(206, 288); c.bezierCurveTo(150, 266, 170, 236, 206, 256); c.bezierCurveTo(240, 236, 262, 266, 206, 288); c.lineWidth = 2.5; c.strokeStyle = R; c.stroke();
        for (var k = 0; k < 6; k++) { var a = k / 6 * TAU; D.line(c, [206 + Math.cos(a) * 30, 266 + Math.sin(a) * 14, 206 + Math.cos(a) * 46, 266 + Math.sin(a) * 22], 1.4, C2); }
        // Alexis, cheveux fous, et Stanley, hagard
        self.portrait(c, pt('alexis'), { x: 104, y: 168, s: 0.66 });
        self.portrait(c, pt('stanley'), { x: 330, y: 176, s: 0.56, flip: true });
      }
    });
    // la nuit et la lumière de la lampe qui balance
    var sw = Math.sin(t * 1.6) * 0.3, lx = 240 + Math.sin(sw) * 30;
    D.line(g, [240, 30, lx, 70], 1, C2); D.star(g, lx, 74, 7, loc === 'wagon2' ? R : C, t);
    D.rays(g, lx, 74, 9, 12, 160, 0.05, 'rgba(243,239,230,0.12)', 71, Math.PI * 0.2 + sw, Math.PI * 0.8 + sw);
    if (((t * 0.7) | 0) % 9 === 0) D.rect(g, 0, 0, W, H, 'rgba(243,239,230,0.12)');
    if (san >= 2 && loc === 'wagon1') { var k2 = ((t * 0.5) | 0) % 7; var q = [[230, 186, 0.22], [254, 186, 0.22], [196, 198, 0.3], [286, 198, 0.3], [150, 222, 0.42], [330, 222, 0.42], [70, 262, 0.6]][k2]; D.circ(g, q[0] - 6 * q[2] * 3, q[1] - 20 * q[2], 2 * q[2] * 3, R); }
  };
  P.retour = function (g, t, st) {
    // sur la plate-forme : le vent, la campagne anglaise qui défile, la locomotive devant
    D.rect(g, 0, 0, W, H, C2);
    D.dots(g, null, 6, function (x, y) { return clamp(3 - y / 50, 0, 3); }, GR, 0, 0, W, 160);
    var off = (t * 220) % 400;
    for (var k = -1; k < 3; k++) { var x = k * 200 - off * 0.5; D.poly(g, [x, 170, x + 70, 120, x + 140, 166, x + 200, 140, x + 200, 200, x, 200], K2); }
    for (var p = -1; p < 6; p++) { var x2 = p * 90 - off * 1.4 % 90; D.line(g, [x2, 200, x2 + 10, 100], 3, K); D.line(g, [x2 - 30, 110, x2 + 40, 104], 1.5, K); }
    D.rect(g, 0, 190, W, 110, K);
    D.poly(g, [0, 300, 160, 190, 240, 190, 400, 300], K2);
    for (var s = 0; s < 8; s++) { var u = ((s / 8 + t * 2.2) % 1); D.line(g, [lerp(200, -80, u * u), lerp(190, 300, u * u), lerp(200, 480, u * u), lerp(190, 300, u * u)], 1 + u * 5, GR); }
    // la locomotive, de dos, crachant sa fumée
    D.poly(g, [150, 230, 250, 230, 244, 120, 156, 120], K); D.rect(g, 186, 84, 28, 40, K); D.circ(g, 200, 182, 30, K2); D.circ(g, 200, 182, 12, R);
    for (var f = 0; f < 6; f++) { var v = ((t * 0.9 + f / 6) % 1); this.puff(g, 200 - v * 260, 70 - v * 30, 14 + v * 40, 1 - v, K); }
    D.brush(g, [0, 300, 40, 230, 44, 300], 2, 6, K);
    if (this.rnd() < 0.05) D.rect(g, 0, 0, W, H, 'rgba(227,32,45,0.25)');
  };

  // ---------------------------------------------------------------- l'aube, l'épave dans un champ
  P.campagne = function (g, t, st) {
    this.put('campagne', function (c) {
      D.rect(c, 0, 0, W, H, R);
      D.dots(c, null, 6, function (x, y) { return clamp(y / 60 - 1 + x / 400, 0, 3.4); }, DR, 0, 0, W, 200);
      D.circ(c, 80, 170, 34, C); D.rect(c, 0, 172, W, 40, R);
      D.poly(c, [0, 300, 0, 190, 120, 176, 260, 196, 400, 180, 400, 300], K);
      // arbres morts et poteaux qui penchent
      [[30, 190, -0.3], [330, 186, 0.25]].forEach(function (q, i) { D.brush(c, [q[0], q[1], q[0] + q[2] * 60, q[1] - 90, q[0] + q[2] * 60 + 20, q[1] - 120], 8, 1, K); D.brush(c, [q[0] + q[2] * 40, q[1] - 60, q[0] + q[2] * 40 + 34, q[1] - 84], 4, 0.6, K); D.brush(c, [q[0] + q[2] * 50, q[1] - 74, q[0] + q[2] * 50 - 30, q[1] - 104], 3, 0.6, K); });
      for (var p = 0; p < 4; p++) { var x = 140 + p * 50; D.line(c, [x, 190, x + 12 - p * 6, 120 + p * 8], 2.4, K); D.line(c, [x - 10 + (12 - p * 6), 128 + p * 8, x + 22 - p * 6, 124 + p * 8], 1.4, K); }
      // les rails tordus et la voiture couchée
      D.line(c, [0, 260, 120, 250, 180, 270, 220, 236, 260, 244], 3, C2); D.line(c, [0, 276, 110, 268, 170, 290, 230, 250, 280, 262], 3, C2);
      D.poly(c, [140, 238, 346, 194, 372, 254, 168, 298], K2);
      D.brush(c, [140, 238, 346, 194], 2, 2, C2);
      for (var w = 0; w < 5; w++) D.poly(c, D.jag(166 + w * 38, 236 - w * 8, 24, 20, 400 + w, 0.7), w % 2 ? R : C2);
      D.circ(c, 160, 292, 18, K); D.circ(c, 360, 252, 18, K); D.circ(c, 160, 292, 6, GR); D.circ(c, 360, 252, 6, GR);
    });
    var f = 0.7 + 0.3 * Math.sin(t * 9) * Math.sin(t * 2.3);
    D.rays(g, 300, 214, 14, 10, 110 * f, 0.08, R, 91, Math.PI * 1.08, Math.PI * 1.92);
    D.rays(g, 300, 214, 10, 8, 60 * f, 0.07, C, 92, Math.PI * 1.15, Math.PI * 1.85);
    for (var s = 0; s < 6; s++) { var v = ((t * 0.12 + s / 6) % 1); this.puff(g, 300 + v * 60, 200 - v * 170, 12 + v * 40, 1 - v, K); }
  };

  // ---------------------------------------------------------------- la gare Victoria
  P.gare = function (g, t, st) {
    this.put('gare', function (c) {
      D.rect(c, 0, 0, W, H, K2);
      // la verrière en ogive, ses arcs de fer
      for (var k = 0; k < 6; k++) { var s = 1 - k * 0.13; c.beginPath(); c.moveTo(200 - 230 * s, 300); c.lineTo(200 - 200 * s, 140 * s + 10); c.quadraticCurveTo(200 - 60 * s, -20 * s + 20, 200 + 6, 6 + k * 12); c.quadraticCurveTo(200 + 70 * s, -20 * s + 20, 200 + 200 * s, 140 * s + 10); c.lineTo(200 + 230 * s, 300); c.lineWidth = 6 - k * 0.7; c.strokeStyle = k % 2 ? GR : C2; c.stroke(); }
      for (var p = 0; p < 9; p++) D.poly(c, D.jag(60 + p * 32, 30 + Math.abs(p - 4) * 12, 20, 22, 500 + p, 0.4), 'rgba(243,239,230,0.55)');
      // l'horloge
      D.circ(c, 200, 120, 24, C); c.beginPath(); c.arc(200, 120, 24, 0, TAU); c.lineWidth = 3; c.strokeStyle = K; c.stroke();
      // les quais, la locomotive de face
      D.poly(c, [0, 300, 120, 200, 160, 200, 120, 300], C2); D.poly(c, [400, 300, 280, 200, 240, 200, 280, 300], C2);
      D.poly(c, [160, 270, 160, 190, 176, 170, 224, 170, 240, 190, 240, 270], K);
      D.circ(c, 200, 206, 24, K2); D.circ(c, 200, 206, 9, R); D.rect(c, 192, 150, 16, 22, K);
      D.figure(c, 70, 290, 110, { col: K, hat: 'bowler', rim: C2 }); D.figure(c, 330, 282, 96, { col: K, hat: 'veil', dress: true, rim: R, rimSide: -1 });
      D.figure(c, 300, 230, 50, { col: K, hat: 'cap' });
    });
    var h = hour(st), ang = (h % 12) / 12 * TAU - Math.PI / 2, ang2 = ((st.min || 0) % 60) / 60 * TAU - Math.PI / 2;
    D.line(g, [200, 120, 200 + Math.cos(ang) * 13, 120 + Math.sin(ang) * 13], 3, K); D.line(g, [200, 120, 200 + Math.cos(ang2) * 20, 120 + Math.sin(ang2) * 20], 1.6, K);
    for (var s = 0; s < 7; s++) { var v = ((t * 0.08 + s / 7) % 1); this.puff(g, 200 + Math.sin(s * 3) * 40 * v, 150 - v * 140, 16 + v * 50, 1 - v, C2); }
  };

  // ---------------------------------------------------------------- écran-titre : Londres, minuit, l'express sur le pont
  P.brouillard = function (g, t, st) {
    this.put('brouillard', function (c) {
      D.rect(c, 0, 0, W, H, K);
      var slab = [-20, 50, 420, 0, 420, 200, -20, 236];
      D.poly(c, slab, R); D.dots(c, D.pp(slab), 6, function (x, y) { return clamp(y / 70 - x / 260 + 0.2, 0, 3.4); }, DR);
      D.circ(c, 300, 70, 30, C); D.dots(c, function (cc) { cc.arc(300, 70, 30, 0, TAU); }, 4, function (x) { return clamp((x - 288) / 10, 0, 2.2); }, C2);
      // la tour de l'horloge, tordue, qui marque minuit
      D.poly(c, [92, 230, 96, 90, 88, 84, 104, 30, 120, 84, 112, 90, 118, 230], K);
      D.circ(c, 106, 102, 9, C); D.line(c, [106, 102, 107, 94], 2, K);
      D.house(c, 0, 236, 70, 140, 0.15, 701, K, C, K2); D.house(c, 140, 236, 60, 110, -0.1, 702, K, R, K2); D.house(c, 196, 236, 50, 150, 0.12, 703, K, C, K2); D.house(c, 340, 236, 70, 170, -0.18, 704, K, C, K2);
      D.rect(c, 0, 236, W, 10, K);
      for (var x = 0; x < W; x += 50) D.poly(c, [x, 300, x, 254, x + 25, 244, x + 50, 254, x + 50, 300, x + 44, 300, x + 44, 260, x + 25, 252, x + 6, 260, x + 6, 300], K);
      D.rect(c, 0, 246, W, 8, K2);
    });
    this.fog(g, 180, 80, 10, 'rgba(10,10,11,0.8)', 1, 6);
    var x = ((t * 34) % 820) - 360;
    g.save(); g.translate(x, 0);
    D.poly(g, [0, 246, 64, 246, 66, 224, 54, 224, 52, 208, 40, 208, 40, 224, 0, 226], K);
    for (var k = 0; k < 4; k++) { D.rect(g, -78 - k * 70, 224, 66, 22, K); for (var j = 0; j < 5; j++) D.rect(g, -74 - k * 70 + j * 12, 229, 7, 7, (j + k) % 3 ? C : R); }
    for (var s = 0; s < 5; s++) { var u = ((t * 0.7 + s * 0.2) % 1); this.puff(g, 46 - u * 110, 196 - u * 50, 9 + u * 22, 1 - u, C2); }
    g.restore();
    this.rain(g, 60, 0.3, 0.4, 300);
  };

  // ---------------------------------------------------------------- les images peintes de Londres
  var PL = ['londres/01_institut-imperial', 'londres/02_hotel-chambre_nuit', 'londres/03_hotel-chambre_jour', 'londres/04_cheapside-chambre-meublee', 'londres/05_scotland-yard_bureau-fleming',
    'londres/06_ambassade-de-turquie', 'londres/08_camberwell_salon-butter', 'londres/09_fleet-street_archives', 'londres/10_st-johns-wood_villa_jour', 'londres/11_st-johns-wood_villa_nuit',
    'londres/12_st-johns-wood_ruines', 'londres/13_islington_brophy-lane_jour', 'londres/14_islington_brophy-lane_nuit', 'londres/15_stoke-newington_jour', 'londres/16_stoke-newington_nuit',
    'londres/17_boutique-makryat', 'londres/18_british-museum_salle-de-lecture', 'londres/19_chambre-henry-stanley', 'londres/20_cave-butter_maquette', 'londres/21_train-fantome_voiture-1',
    'londres/22_train-fantome_voiture-2', 'londres/23_train-fantome_retour', 'londres/24_campagne_au-petit-matin', 'londres/25_gare-victoria', 'londres/26_brouillard_trajet', 'londres/27_gordon-square_seance',
    'londres/28_museum-tavern', 'londres/29_eglise-st-george', 'londres/30_quais-de-la-tamise'];
  // l'image de la réception du Chelsea Arms est arrivée abîmée : ce décor reste dessiné en attendant
  var BROKEN = {};
  PL.forEach(function (k) { if (A.PHOTO_LIST.indexOf(k) < 0) A.PHOTO_LIST.push(k); });
  P.photoKeyL = function (scene, st) {
    var loc = st.loc, nt = night(st), burnt = (st.min || 0) >= 2820, k = null;
    // les lieux nés des improvisations ont maintenant leur image ; sur les quais, le ramasseur d'épaves le temps de la rencontre
    var IMPRO = { pub: 'londres/28_museum-tavern', eglise: 'londres/29_eglise-st-george', quais: 'londres/30_quais-de-la-tamise' };
    if (IMPRO[loc] && (scene === 'bureau' || scene === 'rue')) {
      var fl = st.flags || {};
      var kk = loc === 'quais' && fl.mudlarkMin !== undefined && (st.min || 0) - fl.mudlarkMin < 30 ? 'portraits/37_ramasseur' : IMPRO[loc];
      // tant que l'image n'est pas générée, l'ancienne fait l'affaire
      if (this.photo) { this.photo(kk); var im = this.imgs && this.imgs[kk]; if (!(im && im._bad)) return kk; }
    }
    if (scene === 'rue' && loc === 'stjohn') scene = 'stjohn';
    switch (scene) {
      case 'institut': k = 'londres/01_institut-imperial'; break;
      case 'hotel': k = nt ? 'londres/02_hotel-chambre_nuit' : 'londres/03_hotel-chambre_jour'; break;
      case 'garni': k = 'londres/04_cheapside-chambre-meublee'; break;
      case 'bureau': k = { yard: 'londres/05_scotland-yard_bureau-fleming', ambassade: 'londres/06_ambassade-de-turquie', chelsea: 'londres/07_chelsea-arms_reception', camberwell: 'londres/08_camberwell_salon-butter', archives: 'londres/09_fleet-street_archives', vane: 'londres/27_gordon-square_seance' }[loc || 'yard'] || 'londres/05_scotland-yard_bureau-fleming'; break;
      case 'stjohn': k = burnt ? 'londres/12_st-johns-wood_ruines' : nt ? 'londres/11_st-johns-wood_villa_nuit' : 'londres/10_st-johns-wood_villa_jour'; break;
      case 'rue': k = loc === 'stoke' ? (nt ? 'londres/16_stoke-newington_nuit' : 'londres/15_stoke-newington_jour') : (nt ? 'londres/14_islington_brophy-lane_nuit' : 'londres/13_islington_brophy-lane_jour'); break;
      case 'boutique': k = 'londres/17_boutique-makryat'; break;
      case 'lecture': k = 'londres/18_british-museum_salle-de-lecture'; break;
      case 'chambre': k = 'londres/19_chambre-henry-stanley'; break;
      case 'cave': k = 'londres/20_cave-butter_maquette'; break;
      case 'fantome': k = loc === 'wagon2' ? 'londres/22_train-fantome_voiture-2' : 'londres/21_train-fantome_voiture-1'; break;
      case 'retour': k = 'londres/23_train-fantome_retour'; break;
      case 'campagne': k = 'londres/24_campagne_au-petit-matin'; break;
      case 'gare': k = 'londres/25_gare-victoria'; break;
      case 'brouillard': k = 'londres/26_brouillard_trajet'; break;
    }
    return k && !BROKEN[k] ? k : null;
  };
  var prowl = A.prowl;
  P.ph_institut = function (g, t, st) {
    D.star(g, 70, 40, 13 + 2 * Math.sin(t * 2.3), C, t * 0.2); D.star(g, 306, 22, 9 + 1.5 * Math.sin(t * 2.9 + 1), C, -t * 0.2);
    var beam = this.lay('inst_beam', function (c) { D.dots(c, D.pp([336, 330, 158, 163, 330, 151]), 5, function (x, y) { return 0.4 + 2.1 * Math.max(0, 1 - (y - 150) / 170); }, C); });
    g.globalAlpha = clamp(0.3 + 0.2 * Math.sin(t * 3) + (this.rnd() - 0.5) * 0.1, 0, 1); g.drawImage(beam, 0, 0, W, H); g.globalAlpha = 1;
    g.save(); g.translate(241, 105); g.rotate(-0.07);
    g.beginPath(); g.rect(-84, -50, 168, 100); g.clip();
    var gx = -130 + ((t * 12) % 250);
    g.globalAlpha = 0.5;
    D.poly(g, [gx, 30, gx + 46, 30, gx + 48, 12, gx + 38, 12, gx + 36, -4, gx + 26, -4, gx + 26, 12, gx, 14], K);
    for (var k = 0; k < 3; k++) D.rect(g, gx - 44 - k * 42, 10, 40, 20, K);
    this.puff(g, gx + 30, -16, 16, 0.6, K);
    if ((st.san | 0) >= 2) { g.globalAlpha = 0.3 + 0.1 * Math.sin(t * 2); D.circ(g, Math.sin(t * 0.7) * 8, 0, 10, R); }
    g.restore(); g.globalAlpha = 1;
    for (var s = 0; s < 4; s++) {
      var kk = ((t * 0.35 + s * 0.25) % 1), y = 180 - kk * 120, x = 126 + Math.sin(t * 1.3 + s * 2) * 10 * kk;
      g.globalAlpha = (1 - kk) * 0.8; D.brush(g, [x, y + 10, x + 12, y + 4, x - 12, y - 4, x + 2, y - 12], 0.5, 2.2, C);
    }
    g.globalAlpha = 1; D.circ(g, 125.5, 181, 1.6 + Math.sin(t * 4) * 0.4, R);
  };
  P.ph_hotel = function (g, t, st) {
    var f = 0.85 + 0.15 * Math.sin(t * 5) * Math.sin(t * 1.3);
    D.star(g, 150, 46, 14 * f, C, t * 0.12); D.rays(g, 150, 46, 10, 16, 80 * f, 0.05, 'rgba(243,239,230,0.14)', 33);
    var cyc = (t * 0.05) % 1;
    if ((st.san | 0) >= 1 || cyc < 0.35) { var u = (cyc * 2.6) % 1; prowl(g, 80 + u * 120, 200 - u * 150, 150, { col: K, lean: -0.45, claw: true, hat: 'top', a: 0.7 }); }
    if (night(st)) this.rain(g, 50, 0.6, 0.3, 300, D.pp([292, 30, 360, 22, 368, 180, 286, 188]));
  };
  P.ph_garni = function (g, t, st) {
    var f = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 3.1);
    D.rays(g, 281, 186, 16, 14, 150 * f, 0.045, 'rgba(243,239,230,0.18)', 81);
    D.star(g, 281, 186, 7 * f, R, t); D.star(g, 281, 186, 3.6 * f, C, -t);
    g.save(); g.globalAlpha = 0.18 + 0.1 * f; g.translate(181, 0); g.transform(1, 0, -0.5 + Math.sin(t * 2.2) * 0.04 * f, 1, 0, 0); D.figure(g, 0, 230, 210, { col: K, hat: false }); g.restore();
    this.rain(g, 18, 0.7, 0.4, 280, D.pp([236, 46, 300, 22, 304, 74, 240, 96]));
  };
  P.ph_chambre = function (g, t, st) {
    g.globalAlpha = 0.08 + 0.06 * Math.sin(t * 0.9); D.rect(g, 0, 0, W, H, K); g.globalAlpha = 1;
    if ((st.san | 0) >= 1) prowl(g, 320, 248, 90, { col: K, lean: 0.2, eyes: R, a: 0.6 });
  };
  P.ph_bureau = function (g, t, st) {
    var loc = st.loc || 'yard', who = { yard: 'fleming', ambassade: 'mustapha', chelsea: 'chelseaclerk', camberwell: 'butter', archives: 'pike' }[loc] || 'fleming', sp = pt(who);
    D.star(g, 306, 198, 6 + Math.sin(t * 7) * 0.6, C, t * 0.3);
    D.rays(g, 306, 198, 8, 10, 70, 0.07, 'rgba(243,239,230,0.14)', 19, Math.PI * 0.2, Math.PI * 1.1);
    if (sp.pipe || sp.cigarette) this.smoke(g, { x: 236, y: 150, s: 0.62, flip: false }, sp, t);
  };
  P.ph_stjohn = function (g, t, st) {
    var nt = night(st), burnt = (st.min || 0) >= 2820;
    if (burnt) { for (var s2 = 0; s2 < 6; s2++) { var u = ((t * 0.07 + s2 / 6) % 1); this.puff(g, 190 + Math.sin(s2 * 2) * 40 + u * 30, 120 - u * 130, 14 + u * 40, (1 - u) * 0.8, GR); } }
    else if (nt) {
      var f = 0.85 + 0.15 * Math.sin(t * 3);
      D.rays(g, 222, 127, 8, 10, 60 * f, 0.07, 'rgba(243,239,230,0.2)', 17, Math.PI * 0.1, Math.PI * 0.9);
      if (((t * 0.5) | 0) % 3 === 0) D.figure(g, 214, 140, 26, { col: K, lean: 0.1 });
    }
    this.fog(g, 180, 100, 7, nt ? 'rgba(185,177,164,0.5)' : 'rgba(243,239,230,0.5)', 0.9, 6);
  };
  P.ph_rue = function (g, t, st) {
    if (st.loc === 'stjohn') return this.ph_stjohn(g, t, st);
    var nt = night(st);
    this.fog(g, 160, 110, 8, nt ? 'rgba(185,177,164,0.5)' : 'rgba(243,239,230,0.55)', 1, 6);
    this.rain(g, 70, nt ? 0.45 : 0.3, 0.35, 320);
    if ((st.san | 0) >= 1) { var u = (t * 0.07) % 1; prowl(g, 150 + u * 40, 214 + u * 10, 40 + u * 30, { col: K, hat: 'top', lean: 0.15, eyes: (st.san | 0) >= 2 ? R : C, a: 0.85 }); }
  };
  P.ph_boutique = function (g, t, st) {
    var a = 0.08 + 0.06 * Math.sin(t * 0.8);
    D.poly(g, [0, 120, 26, 110, 230, 300, 120, 300], 'rgba(243,239,230,' + a + ')');
    D.dots(g, D.pp([0, 120, 26, 110, 230, 300, 120, 300]), 9, function (x, y) { return Math.max(0, Math.sin(x * 0.11 + t * 0.6) * Math.sin(y * 0.09 - t * 0.4)) * 1.0; }, C);
    if ((st.san | 0) >= 2) { D.circ(g, 154, 36, 1.4, R); D.circ(g, 167, 36, 1.4, R); }
  };
  P.ph_lecture = function (g, t, st) {
    var f = 0.9 + 0.1 * Math.sin(t * 4);
    D.star(g, 200, 8, 9 * f, C, t * 0.1); D.star(g, 300, 226, 4 * f, C, t);
    D.dots(g, D.pp([30, 160, 380, 160, 400, 300, 20, 300]), 11, function (x, y) { return Math.max(0, Math.sin(x * 0.05 + y * 0.03 - t * 0.5)) * 0.7; }, C);
    if ((st.san | 0) >= 2) prowl(g, 110, 300, 230, { col: K, lean: -0.3, claw: true, a: 0.5 });
  };
  P.ph_cave = function (g, t, st) {
    var f = (this.rnd() < 0.06) ? 0.25 : 0.9 + 0.1 * Math.sin(t * 17);
    if (f < 0.5) { D.rect(g, 0, 0, W, H, 'rgba(10,10,11,0.45)'); }
    D.rays(g, 250, 76, 16, 10, 240 * f, 0.04, 'rgba(243,239,230,0.14)', 61, Math.PI * 0.12, Math.PI * 0.88);
    D.star(g, 250, 76, 10 * f, C, t * 0.2);
    for (var w = 0; w < 5; w++) { var q = eightPt((((t * 0.05) - w * 0.016) % 1 + 1) % 1), q2 = eightPt((((t * 0.05) - w * 0.016 + 0.005) % 1 + 1) % 1); var an = Math.atan2(q2[1] - q[1], q2[0] - q[0]); g.save(); g.translate(q[0], q[1] - 5); g.rotate(an); D.rect(g, -7, -5, 14, 9, w ? (w % 2 ? K : GR) : K); D.rect(g, -7, -5, 14, 2, C2); if (!w) { D.circ(g, 7, -1, 2, R); D.rect(g, 1, -11, 4, 7, K); } g.restore(); }
    var u = (t * 0.05) % 1;
    if ((st.san | 0) >= 1 || u < 0.45) { var v = u / 0.45; prowl(g, 120 + v * 50, 150 + v * 90, 190, { col: K, lean: 0.55, claw: true, hat: 'top', a: 0.8 }); }
  };
  P.ph_fantome = function (g, t, st) {
    var loc = st.loc || 'wagon1', san = st.san | 0;
    var sw = Math.sin(t * 1.6) * 0.3, lx = 240 + Math.sin(sw) * 30;
    D.rays(g, lx, 74, 9, 12, 160, 0.05, 'rgba(243,239,230,0.1)', 71, Math.PI * 0.2 + sw, Math.PI * 0.8 + sw);
    if (((t * 0.7) | 0) % 9 === 0) D.rect(g, 0, 0, W, H, 'rgba(243,239,230,0.1)');
    if (san >= 2 && loc === 'wagon1') { var k2 = ((t * 0.5) | 0) % 7; var q = [[230, 186, 0.22], [254, 186, 0.22], [196, 198, 0.3], [286, 198, 0.3], [150, 222, 0.42], [330, 222, 0.42], [70, 262, 0.6]][k2]; D.circ(g, q[0] - 6 * q[2] * 3, q[1] - 20 * q[2], 2 * q[2] * 3, R); }
  };
  P.ph_retour = function (g, t) {
    for (var s = 0; s < 8; s++) { var u = ((s / 8 + t * 2.2) % 1); g.globalAlpha = 0.5; D.line(g, [lerp(200, -80, u * u), lerp(190, 300, u * u), lerp(200, 480, u * u), lerp(190, 300, u * u)], 1 + u * 4, GR); }
    g.globalAlpha = 1;
    for (var f = 0; f < 6; f++) { var v = ((t * 0.9 + f / 6) % 1); this.puff(g, 200 - v * 260, 70 - v * 30, 14 + v * 40, (1 - v) * 0.8, K); }
    if (this.rnd() < 0.05) D.rect(g, 0, 0, W, H, 'rgba(227,32,45,0.22)');
  };
  P.ph_campagne = function (g, t) {
    var f = 0.7 + 0.3 * Math.sin(t * 9) * Math.sin(t * 2.3);
    D.rays(g, 300, 214, 14, 10, 110 * f, 0.08, 'rgba(227,32,45,0.6)', 91, Math.PI * 1.08, Math.PI * 1.92);
    D.rays(g, 300, 214, 10, 8, 60 * f, 0.07, 'rgba(243,239,230,0.6)', 92, Math.PI * 1.15, Math.PI * 1.85);
    for (var s = 0; s < 6; s++) { var v = ((t * 0.12 + s / 6) % 1); this.puff(g, 300 + v * 60, 200 - v * 170, 12 + v * 40, (1 - v) * 0.8, K); }
  };
  P.ph_gare = function (g, t, st) {
    var h = hour(st), ang = (h % 12) / 12 * TAU - Math.PI / 2, ang2 = ((st.min || 0) % 60) / 60 * TAU - Math.PI / 2;
    D.circ(g, 200, 120, 17, C);
    D.line(g, [200, 120, 200 + Math.cos(ang) * 10, 120 + Math.sin(ang) * 10], 3, K); D.line(g, [200, 120, 200 + Math.cos(ang2) * 15, 120 + Math.sin(ang2) * 15], 1.6, K); D.circ(g, 200, 120, 2, R);
    for (var s = 0; s < 7; s++) { var v = ((t * 0.08 + s / 7) % 1); this.puff(g, 200 + Math.sin(s * 3) * 40 * v, 150 - v * 140, 16 + v * 50, (1 - v) * 0.7, C2); }
  };
  P.ph_brouillard = function (g, t) {
    this.fog(g, 180, 80, 10, 'rgba(10,10,11,0.6)', 1, 6);
    this.rain(g, 60, 0.3, 0.4, 300);
  };
})(typeof window !== 'undefined' ? window : globalThis);
