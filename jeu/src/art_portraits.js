/* Portraits expressionnistes : visage crème coupé en deux par l'ombre, orbites charbonneuses,
   favoris zébrés, ombre portée géante sur le mur peint. Le même peintre sert dans les décors. */
(function (G) {
  'use strict';
  var A = G.PixelArt, P = A.prototype, U = A.util, D = U.D, I = U.INK, W = U.W, H = U.H, rng = U.rng, TAU = U.TAU, clamp = U.clamp;
  var K = I.K, K2 = I.K2, GR = I.GR, R = I.R, DR = I.DR, C = I.C, C2 = I.C2;

  function tone(v, mid) { return v === undefined ? K : v < 70 ? K : v < 150 ? (mid || GR) : v < 200 ? C2 : C; }
  function headPts(fw, jw) {
    return [0, -66, 20 * fw, -63, 36 * fw, -50, 42 * fw, -28, 41 * fw, -8, 44 * fw, 4, 36 * jw, 24, 24 * jw, 44, 8 * jw, 58, -8 * jw, 58, -24 * jw, 44, -36 * jw, 24, -44 * fw, 4, -41 * fw, -8, -42 * fw, -28, -36 * fw, -50, -20 * fw, -63];
  }
  var TERM = [-4, -80, 2, -50, -4, -34, 1, -20, 7, 2, 2, 14, -2, 20, 2, 34, -4, 46, 0, 70, -90, 70, -90, -80];
  function begin(c, o, sp) {
    c.save(); c.translate(o.x, o.y); if (o.rot) c.rotate(o.rot);
    var fx = (o.flip ? -1 : 1) * ((sp.light || 1) < 0 ? -1 : 1) * (o.light === -1 ? -1 : 1);
    c.scale(o.s * fx, o.s);
  }
  function stripes(c, pts, sp2, ang, col, w) { D.hatch(c, D.pp(pts), sp2, ang, w || 1.6, col); }

  // ------------------------------------------------------------------ le peintre
  P.portrait = function (c, sp, o) {
    var fw = sp.fw || 1, jw = sp.jw || fw, hp = headPts(fw, jw), age = sp.age || 0, r = rng(sp.seed || 9);
    begin(c, o, sp);
    // --- le corps : épaules en lame, col, cravate
    if (!o.noBody) {
      var coat = sp.uniform ? K : tone(sp.coat, GR), body = [-30, 66, -92, 94, -126, 240, 126, 240, 92, 94, 30, 66];
      if (sp.dress !== undefined) body = [-26, 66, -80, 92, -112, 240, 112, 240, 80, 92, 26, 66];
      D.poly(c, body, coat);
      D.brush(c, [32, 68, 92, 95, 124, 236], 2.5, 4, coat === C ? C2 : C);
      if (sp.cardigan) D.dots(c, D.pp(body), 7, function () { return 1.6; }, K, -130, 60, 130, 240);
      if (sp.dress !== undefined) {
        D.poly(c, [-22, 70, 22, 70, 0, 104], C);
        if (sp.lace) stripes(c, [-40, 72, 40, 72, 30, 100, -30, 100], 4, 0.8, C2, 0.8);
      } else if (sp.uniform) {
        D.poly(c, [-26, 66, 26, 66, 22, 92, -22, 92], K2); D.line(c, [-26, 66, 26, 66], 2, C2);
        for (var b = 0; b < 4; b++) D.circ(c, 0, 108 + b * 26, 3, C2);
        D.brush(c, [-60, 100, -20, 96], 2, 2, C2);
      } else {
        D.poly(c, [-18, 64, 18, 64, 0, 122], C);
        D.poly(c, [-18, 64, -34, 74, -6, 150, -2, 122], coat === C ? C2 : K);
        D.poly(c, [18, 64, 34, 74, 6, 150, 2, 122], coat === C ? C2 : K);
        D.line(c, [18, 64, 34, 74, 6, 150], 1.4, coat === C ? K : C2);
        if (sp.tie === 'bow') { var bt = tone(sp.tieV); D.poly(c, [-16, 66, -2, 72, -16, 80], bt); D.poly(c, [16, 66, 2, 72, 16, 80], bt); D.circ(c, 0, 73, 3.5, bt); }
        else if (sp.tie === 'long') { var lt = (sp.tieV || 0) < 70 ? R : tone(sp.tieV); D.poly(c, [-5, 70, 5, 70, 7, 116, 0, 128, -7, 116], lt); D.poly(c, [-5, 70, 5, 70, 3, 78, -3, 78], K); }
      }
    }
    // --- le cou
    D.poly(c, [-24, 38, 22, 38, 24, 78, 0, 86, -24, 78], C);
    D.poly(c, [-24, 38, 2, 40, 0, 86, -24, 78], K);
    D.poly(c, [2, 52, 22, 46, 22, 58, 4, 64], K);
    // --- les oreilles
    if (!sp.bandaged && sp.hat !== 'veil') {
      D.poly(c, [40 * fw, -20, 52 * fw, -24, 54 * fw, -4, 46 * fw, 10, 40 * fw, 6], C);
      D.line(c, [46 * fw, -16, 49 * fw, -6, 45 * fw, 4], 1.4, K);
      D.poly(c, [-40 * fw, -20, -52 * fw, -24, -54 * fw, -4, -46 * fw, 10, -40 * fw, 6], K);
      D.line(c, [-52 * fw, -24, -54 * fw, -4, -46 * fw, 10], 1.2, C2);
    }
    // --- la tête : crème, coupée par l'ombre
    D.poly(c, hp, C);
    c.save(); c.beginPath(); D.path(c, hp); c.clip();
    D.poly(c, TERM, K);
    D.dots(c, null, 3.6, function (x) { return 1.7 - x / 13; }, K, -6, -70, 44, 64);
    // pommette creusée, ombre sous la lèvre
    var gw = sp.gaunt ? 1.4 : 1;
    D.poly(c, [16, 9, 40 * fw, 5, 36 * jw, 13 * gw, 24, 17 * gw], K);
    D.poly(c, [-4, 38, 14, 36, 6, 44], K);
    if (sp.gaunt) D.poly(c, [18, 18, 34 * jw, 16, 28 * jw, 30], K);
    if (sp.stubble) D.dots(c, null, 3, function (x, y) { return y > 22 ? 0.75 : 0; }, K, 0, 20, 44, 60);
    if (sp.pale || sp.dead) D.dots(c, null, 5, function (x) { return x > 6 ? 0.9 : 0; }, C2, 0, -60, 44, 60);
    c.restore();
    // le liseré de lumière sur la joue d'ombre
    D.brush(c, [-36 * fw, -40, -42 * fw, -10, -36 * jw, 24, -18 * jw, 50], 0.6, 1.8, C2);
    // --- nez : l'arête éclairée, la narine
    D.brush(c, [1, -32, 4, -12, 9, 4], 1.2, 2.6, C);
    D.poly(c, [3, 6, 14, 8, 10, 12, 2, 12], K);
    D.line(c, [6, -16, 13, 4, 8, 9], 1.2, K);
    // --- bouche
    if (sp.mouthOpen) { D.ell(c, 1, 32, 9, 11, K); D.ell(c, 1, 34, 6, 7, K2); }
    else if (sp.lips) { D.poly(c, [-14, 30, -4, 26, 0, 28, 4, 26, 16, 30, 4, 36, -4, 36], R); D.line(c, [-14, 30, 16, 30], 1.2, K); }
    else if (sp.smile) D.brush(c, [-16, 26, -6, 32, 6, 32, 18, 25], 2, 3, K);
    else D.brush(c, [-15, 30, 0, 31, 17, 29], 3.2, 2.2, K);
    // --- rides
    if (age > 0.35) {
      D.brush(c, [14, 12, 20, 22, 22, 32], 0.6, 1.6, K);
      D.brush(c, [10, -46, 24, -48, 34, -44], 0.5, 1.4, K);
      if (age > 0.7) { D.brush(c, [8, -54, 22, -56, 32, -52], 0.5, 1.2, K); D.brush(c, [32, -18, 38, -14], 0.5, 1.2, K); }
    }
    if (sp.tired || age > 0.8) D.brush(c, [12, -12, 22, -9, 30, -12], 0.6, 1.6, K);
    if (sp.scars) { D.line(c, [14, -40, 22, -30, 18, -24, 26, -16], 1.6, R); D.line(c, [-20, 10, -8, 18], 1.4, R); }
    if (sp.feverish) D.dots(c, D.pp(hp), 9, function (x, y) { return (x * 7 + y * 13) % 5 < 1 ? 1.4 : 0; }, C2, -44, -60, 44, 60);
    // --- sourcils
    var by = sp.brows === 'raised' ? -38 : -32, bw = sp.browW || 4, bc = (sp.browV || 0) > 150 ? C2 : K;
    if (sp.brows === 'frown') { D.poly(c, [8, -30, 36, -40, 38, -35, 10, -25], K); D.poly(c, [-8, -30, -36, -39, -36, -35, -10, -26], (sp.browV || 0) > 150 ? C2 : GR); }
    else { D.poly(c, [8, by + 2, 34, by - 4, 37, by - 4 + bw * 0.8, 10, by + 2 + bw * 0.7], bc); D.poly(c, [-8, by + 2, -34, by - 3, -36, by - 3 + bw * 0.7, -10, by + 2 + bw * 0.6], (sp.browV || 0) > 150 ? C2 : GR); }
    // --- orbites
    if (sp.brows === 'raised' || sp.smile) D.poly(c, [6, -30, 22, -34, 36, -26, 34, -14, 20, -10, 8, -14], K);
    else D.poly(c, [6, -26, 32, -30, 38, -18, 28, -10, 10, -12], K);
    this.ptEyes(c, sp, 0, this.state ? this.state.san | 0 : 0, true);
    // --- poils du visage
    var zebra = function (pts, v) { if ((v || 0) > 150) { D.poly(c, pts, C); stripes(c, pts, 4, -0.9, K, 1.3); } else D.poly(c, pts, K); };
    if (sp.chops !== undefined) {
      zebra([34, -12, 46, -6, 44, 24, 30, 40, 24, 14], sp.chops);
      D.poly(c, [-34, -12, -46, -6, -44, 24, -30, 40, -24, 14], (sp.chops || 0) > 150 ? GR : K);
      if ((sp.chops || 0) > 150) stripes(c, [-34, -12, -46, -6, -44, 24, -30, 40, -24, 14], 4, -0.9, K, 1.3);
    }
    if (sp.beard !== undefined) zebra([-30, 26, -14, 40, 0, 42, 14, 40, 30, 26, 26, 52, 8, 72, -8, 72, -26, 52], sp.beard);
    if (sp.walrus !== undefined) zebra([-28, 24, -10, 13, 1, 17, 12, 13, 30, 24, 24, 38, 12, 27, 1, 30, -10, 27, -24, 38], sp.walrus);
    else if (sp.moustache !== undefined) zebra([-18, 22, -2, 15, 2, 17, 6, 15, 20, 22, 16, 28, 2, 22, -14, 28], sp.moustache);
    else if (sp.thinMoustache !== undefined) D.brush(c, [-14, 21, 0, 18, 16, 21], 1.2, 2.2, K);
    // --- cheveux
    var hc = (sp.hairV || 0) > 150 ? C2 : (sp.hairV || 0) > 100 ? GR : K, hairs = function (pts) { D.poly(c, pts, hc); if (hc !== K) stripes(c, pts, 4, 1.1, K, hc === GR ? 1.6 : 1.1); else { var top = 0; for (var q = 1; q < pts.length; q += 2) top = Math.min(top, pts[q]); D.brush(c, [0, top + 3, 24, top + 9, 40 * fw, -40], 1, 2.6, C2); } };
    var hair = sp.hair;
    if (!sp.bandaged && sp.hat !== 'helmet' && sp.hat !== 'veil') {
      if (hair === 'short') hairs([-44 * fw, -24, -42 * fw, -56, -22, -72, 12, -74, 36, -62, 44 * fw, -26, 36, -46, 18, -60, -12, -62, -34, -48]);
      else if (hair === 'parted') hairs([-44 * fw, -22, -44 * fw, -58, -24, -74, -14, -70, 10, -78, 38, -64, 44 * fw, -24, 34, -50, 10, -62, -14, -62, -34, -46]);
      else if (hair === 'slick') { hairs([-43 * fw, -26, -40 * fw, -58, -16, -72, 16, -72, 38, -60, 43 * fw, -28, 34, -50, 12, -60, -16, -58, -34, -48]); D.brush(c, [-20, -66, 4, -70, 26, -62], 0.8, 2.4, C2); }
      else if (hair === 'messy') hairs([-46 * fw, -20, -48, -50, -36, -62, -40, -74, -18, -70, -10, -84, 6, -72, 22, -84, 28, -66, 46, -70, 44 * fw, -24, 34, -48, 8, -58, -26, -52]);
      else if (hair === 'wild') hairs([-46 * fw, -6, -66, -20, -54, -40, -76, -60, -46, -62, -50, -92, -22, -74, -6, -104, 8, -76, 34, -100, 34, -70, 70, -74, 50, -50, 72, -30, 46 * fw, -6, 38, -40, 10, -60, -30, -52]);
      else if (hair === 'fringe') { hairs([-44 * fw, -6, -46 * fw, -40, -34, -50, -38, -30, -40, -10]); hairs([44 * fw, -6, 46 * fw, -40, 34, -50, 38, -30, 40, -10]); }
      else if (hair === 'curlers') { hairs([-46 * fw, -20, -42 * fw, -58, -20, -72, 16, -72, 40, -58, 46 * fw, -20, 34, -46, 0, -56, -34, -46]); [-30, -12, 6, 24].forEach(function (x, i) { D.poly(c, [x, -66 - i % 2 * 4, x + 14, -68 - i % 2 * 4, x + 14, -58 - i % 2 * 4, x, -56 - i % 2 * 4], i % 2 ? C : C2); }); }
    }
    // --- bandages : la tête emmaillotée, un seul œil, des taches
    if (sp.bandaged) {
      var bh = [0, -70, 30, -66, 46, -40, 48, 0, 40, 30, 24, 52, 0, 62, -24, 52, -40, 30, -48, 0, -46, -40, -30, -66];
      D.poly(c, bh, C);
      stripes(c, bh, 8, 0.32, K, 1.4); stripes(c, bh, 11, -0.5, C2, 1);
      c.save(); c.beginPath(); D.path(c, bh); c.clip(); D.poly(c, TERM, K); stripes(c, [-90, -80, 2, -80, 2, 70, -90, 70], 8, 0.32, GR, 1.4); c.restore();
      D.poly(c, [6, -26, 34, -30, 38, -16, 10, -14], K);
      D.ell(c, 22, -21, 6, 3.6, R); D.circ(c, 22, -21, 2, K);
      [[24, -46, 7], [-14, 8, 5], [30, 22, 4]].forEach(function (q) { D.dots(c, function (cc) { cc.arc(q[0], q[1], q[2] * 1.6, 0, TAU); }, 3, function (x, y) { return 1.3 - Math.hypot(x - q[0], y - q[1]) / (q[2] * 1.6); }, R, q[0] - 14, q[1] - 14, q[0] + 14, q[1] + 14); D.circ(c, q[0], q[1], q[2] * 0.5, R); });
      D.poly(c, [-6, 26, 10, 25, 6, 34, -4, 34], K);
    }
    // --- lunettes
    if (sp.glasses) {
      if (sp.glasses === 'glare') { D.circ(c, 22, -20, 13, C); D.circ(c, -21, -20, 12, C2); D.line(c, [16, -26, 28, -14], 1.2, C2); }
      c.beginPath(); c.arc(22, -20, 13, 0, TAU); c.moveTo(-9, -20); c.arc(-21, -20, 12, 0, TAU); c.moveTo(9, -22); c.lineTo(-9, -22);
      c.moveTo(35, -22); c.lineTo(46, -24); c.lineWidth = 2.4; c.strokeStyle = K; c.stroke();
    }
    // --- chapeaux, et l'ombre de leur bord sur les yeux
    var hat = sp.hat;
    if (hat === 'fez') { D.poly(c, [-32, -50, -24, -98, 24, -100, 34, -52], R); D.poly(c, [-32, -50, 0, -52, -2, -99, -24, -98], DR); D.brush(c, [0, -100, 18, -92, 30, -70], 1.4, 2, K); }
    else if (hat === 'helmet') {
      D.poly(c, [-48, -36, -44, -70, -28, -104, 0, -118, 28, -104, 44, -70, 50, -36, 0, -42], K);
      D.brush(c, [10, -114, 34, -96, 46, -60, 48, -38], 1, 2.4, C2);
      D.star(c, 4, -70, 9, C2); D.circ(c, 4, -70, 3, K);
      D.poly(c, [-48, -36, 50, -36, 46, -28, -44, -28], K);
      D.poly(c, [-44, -28, 46, -28, 40, -18, -40, -18], 'rgba(10,10,11,0.55)');
    } else if (hat === 'cap') {
      D.poly(c, [-44, -40, -40, -72, 40, -76, 46, -42], K); D.rect(c, -42, -52, 86, 7, R);
      D.poly(c, [-46, -40, 50, -42, 60, -30, -36, -28], K); D.star(c, 2, -62, 6, C2);
      D.poly(c, [-40, -28, 54, -30, 44, -20, -36, -18], 'rgba(10,10,11,0.5)');
    } else if (hat === 'fedora' || hat === 'bowler') {
      if (hat === 'fedora') D.poly(c, [-38, -50, -34, -84, -8, -78, 0, -88, 34, -84, 40, -52], K);
      else { c.beginPath(); c.moveTo(-36, -50); c.quadraticCurveTo(-36, -100, 0, -100); c.quadraticCurveTo(36, -100, 38, -50); c.closePath(); c.fillStyle = K; c.fill(); }
      D.rect(c, -36, -60, 74, 6, R);
      D.poly(c, [-66, -46, 68, -52, 62, -40, -60, -38], K);
      D.brush(c, [4, -50, 64, -52], 1, 2, C2);
      D.poly(c, [-44, -40, 46, -42, 40, -24, -40, -24], 'rgba(10,10,11,0.6)');
    } else if (hat === 'veil') {
      D.poly(c, [-40, -50, -30, -82, 30, -86, 42, -52], K); D.poly(c, [-56, -50, 58, -54, 52, -44, -52, -42], K);
      D.brush(c, [20, -84, 40, -96, 52, -90], 1, 3, R);
      var vl = [-48, -46, 50, -48, 46, 12, -46, 12];
      stripes(c, vl, 4, 0.6, K, 0.9); stripes(c, vl, 4, -0.6, K, 0.9);
      D.poly(c, [-50, -46, -44, -10, -56, 80, -70, 80, -60, -10], K); D.poly(c, [52, -48, 48, -10, 60, 80, 72, 80, 62, -10], K);
    }
    if (sp.earrings) { D.poly(c, [46, 6, 50, 6, 52, 18, 48, 22, 44, 18], C); D.circ(c, 48, 18, 2.4, R); }
    // --- pipe, cigarette
    if (sp.pipe) { D.poly(c, [12, 32, 16, 28, 34, 42, 40, 38, 52, 38, 54, 58, 40, 60, 38, 48, 14, 36], K); D.line(c, [40, 38, 52, 38], 1.2, C2); }
    if (sp.cigarette) { D.brush(c, [12, 31, 42, 39], 3, 3, C); D.line(c, [40, 38.4, 43, 39.2], 3, R); }
    c.restore();
  };
  // les yeux, à part : ils clignent, rougissent, se vident
  P.ptEyes = function (c, sp, blink, san, inside) {
    if (sp.bandaged) return;
    if (sp.glasses === 'glare') return;
    if (!inside) return;
    var look = (sp.look || 0) * 3, dead = sp.dead, lids = sp.lids || 0.8;
    var whiteL = [11, -22, 29, -24, 28, -17, 14, -16], whiteS = [-30, -22, -12, -23, -14, -16, -28, -16];
    if (blink > 0.5) { D.line(c, [10, -19, 30, -21], 2.2, C2); D.line(c, [-30, -19, -12, -20], 2, GR); return; }
    D.poly(c, whiteL, C); D.poly(c, whiteS, dead || san >= 3 ? C : C2);
    if (!dead && san < 3) {
      var pc = san >= 2 ? R : K;
      D.circ(c, 20 + look, -20, 3.4, pc); D.circ(c, -21 + look, -19.6, 3, pc);
      D.circ(c, 21 + look, -21, 0.9, C); D.circ(c, -20 + look, -20.6, 0.9, C);
    } else if (san >= 3 && !dead) { D.circ(c, 20, -20, 1.4, R); D.circ(c, -21, -19.6, 1.3, R); }
    // paupières lourdes
    if (lids > 1) { D.poly(c, [10, -26, 30, -28, 29, -21, 11, -20], K); }
  };

  // ------------------------------------------------------------------ les fonds peints
  var BG = {
    blinds: function (c) {
      D.rect(c, 0, 0, W, H, K2);
      D.poly(c, [190, 0, 400, 0, 400, 300, 110, 300], K);
      for (var k = 0; k < 9; k++) D.poly(c, [220 + k * 14, 0, 232 + k * 14, 0, 140 + k * 30, 300, 120 + k * 30, 300], k % 3 === 1 ? R : C);
      D.dots(c, D.pp([0, 0, 190, 0, 110, 300, 0, 300]), 7, function (x, y) { return 2.4 - x / 90 + y / 300; }, K);
    },
    blindsOver: function (c) {
      for (var k = 0; k < 6; k++) D.poly(c, [-40 + k * 30, 120 + k * 30, 400, -30 + k * 30, 400, -18 + k * 30, -40, 132 + k * 30], 'rgba(10,10,11,0.42)');
    },
    candle: function (c, x) {
      D.rect(c, 0, 0, W, H, K);
      D.rays(c, x, 150, 22, 60, 260, 0.05, C2, 77);
      D.rays(c, x, 150, 14, 40, 180, 0.04, C, 78);
      D.poly(c, [x - 7, 160, x + 7, 160, x + 6, 240, x - 6, 240], C);
      D.poly(c, [x - 30, 240, x + 30, 240, x + 24, 252, x - 24, 252], K);
    },
    screen: function (c) {
      D.rect(c, 0, 0, W, H, K);
      var slab = [-20, 70, 420, 10, 420, 250, -20, 290];
      D.poly(c, slab, R); D.dots(c, D.pp(slab), 7, function (x, y) { return clamp(y / 90 - x / 260, 0, 3.6); }, DR);
      c.save(); c.translate(300, 110); c.rotate(-0.07); D.rect(c, -86, -56, 172, 112, C); c.lineWidth = 2.5; c.strokeStyle = K; c.strokeRect(-86, -56, 172, 112);
      D.poly(c, [-60, 30, -10, 30, -8, 6, -20, 6, -22, -10, -34, -10, -34, 6, -60, 8], K); for (var k = 0; k < 2; k++) D.rect(c, -4 + k * 44, 6, 40, 24, K);
      c.restore();
      D.star(c, 70, 40, 12, C, 0.3); D.line(c, [70, 0, 70, 28], 0.8, C2);
    },
    fog: function (c) {
      D.rect(c, 0, 0, W, H, K2);
      D.poly(c, [-20, 40, 420, 0, 420, 120, -20, 170], DR);
      D.house(c, 160, 260, 70, 190, 0.12, 3, K, C2, K2); D.house(c, 240, 260, 60, 150, -0.1, 4, K, R, K2); D.house(c, 310, 260, 90, 210, 0.08, 5, K, C2, K2);
      D.line(c, [356, 300, 350, 120, 340, 110], 4, K); D.star(c, 338, 110, 12, C, 0.2);
    },
    books: function (c) {
      D.rect(c, 0, 0, W, H, K2);
      var r = rng(31);
      for (var s = 0; s < 5; s++) {
        var y = 30 + s * 56, sk = (s - 2) * 0.05;
        for (var x = 150; x < W; x += 6 + r() * 6) { var h = 30 + r() * 18, w = 4 + r() * 5, col = [C2, GR, K, R, C2, GR][(r() * 6) | 0]; D.poly(c, [x, y + 46, x + w, y + 46, x + w + h * sk + (r() - 0.5) * 6, y + 46 - h, x + h * sk, y + 46 - h], col); }
        D.poly(c, [140, y + 46, 400, y + 40, 400, y + 48, 140, y + 52], K);
      }
    },
    jars: function (c) {
      D.rect(c, 0, 0, W, H, K2);
      var r = rng(41);
      for (var s = 0; s < 4; s++) {
        var y = 70 + s * 64;
        D.poly(c, [130, y, 400, y - 8, 400, y, 130, y + 6], K);
        for (var x = 150; x < W - 10; x += 30 + r() * 10) { var h = 26 + r() * 22, w = 14 + r() * 10; D.poly(c, [x, y, x + w, y - 1, x + w - 2, y - h, x + 2, y - h], C2); D.poly(c, [x + 1, y - 1, x + w - 1, y - 2, x + w - 2, y - h * 0.5, x + 2, y - h * 0.45], r() < 0.3 ? R : GR); D.rect(c, x + 2, y - h - 5, w - 4, 5, K); }
      }
    },
    flag: function (c) {
      D.rect(c, 0, 0, W, H, K);
      var fl = [120, 0, 400, 0, 400, 260, 160, 300, 190, 150];
      D.poly(c, fl, R); D.dots(c, D.pp(fl), 7, function (x, y) { return clamp(1.6 + Math.sin(y * 0.04 + x * 0.02) * 1.6, 0, 3.5); }, DR);
      c.beginPath(); c.arc(300, 110, 46, 0, TAU); c.arc(316, 110, 37, 0, TAU, true); c.fillStyle = C; c.fill('evenodd');
      D.star(c, 352, 110, 18, C, 0.4);
    },
    reception: function (c) {
      D.rect(c, 0, 0, W, H, K2);
      for (var r2 = 0; r2 < 5; r2++) for (var k = 0; k < 8; k++) {
        var x = 180 + k * 27 + r2 * 4, y = 30 + r2 * 40 - k * 3;
        D.poly(c, [x, y, x + 22, y - 2, x + 22, y + 30, x, y + 32], K);
        if ((k + r2 * 3) % 4) D.poly(c, [x + 9, y + 6, x + 13, y + 6, x + 12, y + 22, x + 10, y + 22], (k + r2) % 5 ? C2 : R);
      }
      D.star(c, 160, 40, 14, C, 0.1);
    },
    pension: function (c) {
      D.rect(c, 0, 0, W, H, R);
      D.dots(c, null, 14, function (x, y) { return 3 + Math.sin(x * 0.3) * Math.sin(y * 0.3) * 2; }, DR);
      for (var s = 0; s < 8; s++) D.poly(c, [200 + s * 26, 300 - s * 34, 420, 300 - s * 34 - 20, 420, 300 - s * 34 - 12, 200 + s * 26, 300 - s * 34 + 8], K);
      D.line(c, [190, 300, 400, 30], 3, K); for (var b = 0; b < 9; b++) D.line(c, [196 + b * 24, 300 - b * 31, 196 + b * 24, 270 - b * 31], 2, K);
    },
    trains: function (c) {
      D.rect(c, 0, 0, W, H, K2);
      for (var s = 0; s < 3; s++) {
        var y = 80 + s * 80; D.poly(c, [150, y, 400, y - 10, 400, y - 2, 150, y + 8], C2);
        for (var k = 0; k < 4; k++) { var x = 170 + k * 56; D.poly(c, [x, y - 2, x + 44, y - 4, x + 44, y - 24, x + 30, y - 24, x + 28, y - 36, x + 20, y - 36, x + 20, y - 22, x, y - 22], k % 2 ? K : GR); D.circ(c, x + 10, y - 2, 5, K); D.circ(c, x + 34, y - 3, 5, K); }
      }
      D.rays(c, 330, 30, 10, 20, 90, 0.05, 'rgba(243,239,230,0.3)', 5);
    },
    void: function (c) {
      D.rect(c, 0, 0, W, H, K);
      c.beginPath();
      for (var a = 0; a < 40; a += 0.06) { var rr = 4 + a * 7; c.lineTo(250 + Math.cos(a) * rr, 140 + Math.sin(a) * rr * 0.8); }
      c.lineWidth = 9; c.strokeStyle = C2; c.stroke();
      D.rays(c, 250, 140, 18, 30, 300, 0.035, R, 12);
    },
    dining: function (c) {
      D.rect(c, 0, 0, W, H, K2);
      D.poly(c, [0, 0, 400, 0, 400, 90, 0, 120], K);
      [200, 290, 370].forEach(function (x, i) { D.rays(c, x, 70, 12, 14, 70, 0.07, 'rgba(243,239,230,0.35)', 50 + i); D.star(c, x, 70, 10 - i * 2, C); });
      D.poly(c, [150, 230, 400, 216, 400, 300, 150, 300], C2);
      D.poly(c, [160, 120, 230, 116, 228, 200, 158, 204], K); D.poly(c, [260, 112, 330, 108, 330, 196, 258, 200], K);
    },
    corridor: function (c) {
      D.rect(c, 0, 0, W, H, K2);
      for (var k = 0; k < 6; k++) { var x = 170 + k * 40, h = 220 - k * 22; D.poly(c, [x, 40 + k * 10, x + 28, 42 + k * 10, x + 30, 40 + k * 10 + h, x + 2, 40 + k * 10 + h + 4], C2); D.rect(c, x + 8, 70 + k * 10, 12, 10, K); }
      D.star(c, 260, 22, 10, C);
    }
  };
  A.PORTRAIT_BG = BG;

  // ------------------------------------------------------------------ la galerie
  var PT = {
    smith: { light: 1, fw: 1.08, jw: 1.04, age: 0.85, hair: 'fringe', hairV: 226, chops: 232, walrus: 232, browV: 214, browW: 6, coat: 20, tie: 'bow', tieV: 235, pipe: true, bg: { cheapside: 'candle', def: 'screen' }, pos: 130 },
    beddows: { light: -1, fw: 0.88, jw: 0.82, age: 0.9, hair: 'slick', hairV: 120, browW: 2.4, coat: 14, tie: 'bow', tieV: 14, gaunt: true, brows: 'raised', lids: 1.3, bg: { cheapside: 'candle', def: 'screen' }, pos: 270 },
    brule: { light: 1, bandaged: true, scars: true, fw: 1.0, coat: 30, hair: 'none', bg: 'candle', pos: 140 },
    fleming: { light: 1, fw: 0.9, jw: 0.84, age: 0.6, hair: 'parted', hairV: 50, gaunt: true, tired: true, brows: 'frown', coat: 34, tie: 'long', tieV: 22, cigarette: true, bg: 'blinds', pos: 130 },
    rigby: { light: -1, fw: 1.12, jw: 1.12, age: 0.4, hair: 'short', hairV: 140, moustache: 130, coat: 30, tie: 'long', tieV: 40, bg: 'blinds', pos: 270 },
    chelseaclerk: { light: 1, fw: 0.95, jw: 0.9, age: 0.5, hair: 'parted', hairV: 30, thinMoustache: 30, tired: true, coat: 24, tie: 'bow', tieV: 20, bg: 'reception', pos: 120 },
    mustapha: { light: 1, fw: 0.95, jw: 0.92, age: 0.15, hair: 'slick', hairV: 18, thinMoustache: 20, hat: 'fez', coat: 26, tie: 'long', tieV: 40, bg: 'flag', pos: 130, look: 0.5 },
    voisin: { light: -1, fw: 1.02, age: 0.75, hair: 'fringe', hairV: 150, glasses: true, cardigan: true, coat: 90, tie: 'long', tieV: 50, stubble: true, bg: 'jars', pos: 120 },
    atkins: { light: 1, fw: 1.04, jw: 1.02, age: 0.55, hair: 'curlers', hairV: 90, lips: true, earrings: true, dress: 130, coat: 110, brows: 'raised', browW: 2, smile: true, bg: 'pension', pos: 130 },
    sergent: { light: 1, fw: 1.06, jw: 1.08, age: 0.45, hat: 'helmet', moustache: 60, coat: 20, uniform: true, bg: 'fog', pos: 130 },
    butter: { light: -1, fw: 1.16, jw: 1.14, age: 0.6, hair: 'fringe', hairV: 160, coat: 40, tie: 'long', tieV: 70, pipe: true, smile: true, bg: 'trains', pos: 130 },
    alexis: { light: 1, pale: true, fw: 0.96, jw: 0.84, age: 1, hair: 'wild', hairV: 120, gaunt: true, feverish: true, smile: true, coat: 50, tie: 'bow', tieV: 40, bg: 'void', pos: 110 },
    stanley: { light: -1, fw: 0.9, jw: 0.86, age: 0.3, hair: 'messy', hairV: 70, brows: 'raised', lids: 1.3, coat: 40, tie: 'long', tieV: 60, bg: 'void', pos: 110 },
    bibliothecaire: { light: 1, fw: 0.94, age: 0.75, hair: 'parted', hairV: 190, glasses: 'glare', coat: 22, tie: 'bow', tieV: 20, brows: 'frown', bg: 'books', pos: 120 },
    planton: { light: 1, fw: 1.0, age: 0.3, hat: 'helmet', coat: 20, uniform: true, bg: 'fog', pos: 130 },
    serveur: { light: 1, fw: 0.94, jw: 0.9, age: 0.5, hair: 'slick', hairV: 26, thinMoustache: 30, coat: 215, tie: 'bow', tieV: 14, bg: 'dining', pos: 120, brows: 'raised' },
    veuve: { light: -1, fw: 0.96, jw: 0.92, age: 0.9, hair: 'none', hat: 'veil', earrings: true, dress: 16, lace: true, coat: 12, bg: 'dining', pos: 130 },
    conducteur: { light: 1, fw: 1.05, jw: 1.05, age: 0.5, hat: 'cap', moustache: 40, lids: 1.2, coat: 26, uniform: true, bg: 'corridor', pos: 130 },
    mort: { light: 1, pale: true, dead: true, mouthOpen: true, age: 0.5, coat: 20, tie: 'long', tieV: 30, gaunt: true },
    concierge: { light: 1, fw: 1.06, jw: 1.02, age: 0.5, hair: 'slick', hairV: 30, thinMoustache: 30, coat: 26, tie: 'bow', tieV: 230, brows: 'raised', smile: true, bg: 'reception', pos: 130 },
    agentsj: { light: -1, fw: 1.0, age: 0.2, hat: 'helmet', coat: 20, uniform: true, bg: 'fog', pos: 270 },
    laitier: { light: -1, fw: 0.94, jw: 0.9, age: 0.6, hat: 'cap', moustache: 60, stubble: true, coat: 90, tie: 'long', tieV: 50, bg: 'fog', pos: 120 },
    pike: { light: 1, fw: 0.92, jw: 0.84, age: 0.85, hair: 'curlers', hairV: 200, glasses: true, dress: 30, lace: true, coat: 20, brows: 'frown', bg: 'books', pos: 130 }
  };
  A.PORTRAITS = PT;

  // silhouette d'un calque : sert à l'ombre portée géante
  function silhouette(art, src, col) {
    var cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
    var c = cv.getContext('2d'); c.drawImage(src, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, cv.width, cv.height);
    return cv;
  }
  P.portraitScene = function (g, id) {
    var sp = PT[id]; if (!sp) return false;
    var st = this.state || {}, san = st.san | 0, t = this.t, self = this;
    var bgk = typeof sp.bg === 'object' ? (sp.bg[st.loc] || sp.bg.def) : sp.bg;
    var x = sp.pos || 130, flip = x > 200, S = 1.2, Y = 150, cx = x < 200 ? 300 : 100;
    var o = { x: x, y: Y, s: S, flip: flip };
    this.put('ptbg_' + bgk + '_' + x, function (c) { if (bgk === 'candle') BG.candle(c, cx); else if (BG[bgk]) BG[bgk](c); else D.rect(c, 0, 0, W, H, K2); });
    var fig = this.lay('ptfig_' + id + '_' + san + '_' + bgk, function (c) { self.portrait(c, sp, o); });
    var sil = this.cache['ptsil_' + id + '_' + san + '_' + bgk];
    if (!sil) { sil = silhouette(this, fig, 'rgba(10,10,11,0.62)'); this.cache['ptsil_' + id + '_' + san + '_' + bgk] = sil; this.ck.push('ptsil_' + id + '_' + san + '_' + bgk); }
    // l'ombre portée, immense, penchée, qui respire un peu
    var dir = flip ? 1 : -1, sw = Math.sin(t * 0.5) * 0.02 + (san >= 2 ? Math.sin(t * 1.7) * 0.04 : 0);
    g.save(); g.translate(x + dir * 70, 300); g.transform(1.3, 0, dir * 0.35 + sw, 1.45, 0, 0); g.translate(-x, -300);
    g.drawImage(sil, 0, 0, W, H); g.restore();
    if (bgk === 'void') { g.save(); g.globalAlpha = 0.25; g.translate(250, 140); g.rotate(t * 0.15); g.translate(-250, -140); BG.void(g); g.restore(); }
    if (bgk === 'fog') this.fog(g, 150, 150, 12, 'rgba(185,177,164,0.8)', 0.9, 6);
    if (bgk === 'candle') { var fl = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 3.1); D.star(g, cx, 152, 9 * fl, R, t); D.star(g, cx, 152, 5 * fl, C, -t); }
    g.drawImage(fig, 0, 0, W, H);
    // vie : clignements, fumée, braise
    var blink = (((t * 0.37 + (x % 7) * 0.13) % 1) < 0.035) ? 1 : 0;
    if (blink || san >= 2) { begin(g, o, sp); this.ptEyes(g, sp, blink, san, true); g.restore(); }
    if (sp.pipe || sp.cigarette) this.smoke(g, o, sp, t);
    if (bgk === 'blinds') BG.blindsOver(g);
    return true;
  };
  P.smoke = function (g, o, sp, t) {
    var ex = sp.pipe ? 46 : 43, ey = sp.pipe ? 36 : 39, fx = (o.flip ? -1 : 1) * ((sp.light || 1) < 0 ? -1 : 1);
    var px = o.x + ex * o.s * fx, py = o.y + ey * o.s;
    D.circ(g, px, py, (1.6 + Math.sin(t * 5) * 0.5) * o.s, R);
    for (var s = 0; s < 4; s++) {
      var k = ((t * 0.3 + s * 0.25) % 1), y = py - k * 120, x = px + Math.sin(t * 1.2 + s * 2) * 14 * k;
      g.globalAlpha = (1 - k) * 0.85;
      D.brush(g, [x, y + 12, x + 10, y + 4, x - 8, y - 4, x + 2, y - 14], 0.6, 3.2 * (1 - k * 0.5), C);
    }
    g.globalAlpha = 1;
  };
  // ---------------------------------------------------------------- les portraits peints
  var PTF = { smith: ['01_smith_institut', '02_smith_cheapside'], beddows: ['03_beddows_institut', '04_beddows_cheapside'], brule: '05_brule', fleming: '06_fleming', rigby: '07_rigby',
    chelseaclerk: '08_chelseaclerk', mustapha: '09_mustapha', voisin: '10_voisin', atkins: '11_atkins', sergent: '12_sergent', butter: '13_butter', alexis: '14_alexis', stanley: '15_stanley',
    bibliothecaire: '16_bibliothecaire', planton: '17_planton', concierge: '18_concierge', agentsj: '19_agentsj', laitier: '20_laitier', pike: '21_pike', serveur: '22_serveur',
    veuve: '23_veuve', conducteur: '24_conducteur', mort: '25_mort', vane: '26_vane',
    // Paris
    gerant: '27_blain', gaudry: '28_gaudry', remi: '29_remi', brevin: '30_brevin', rogniat: '31_rogniat', leroux: '32_leroux', mandrin: '33_mandrin' };
  Object.keys(PTF).forEach(function (id) { [].concat(PTF[id]).forEach(function (f) { A.PHOTO_LIST.push('portraits/' + f); }); });
  P.photoKeyP = function (id, st) {
    var f = PTF[id]; if (!f) return null;
    return 'portraits/' + (Array.isArray(f) ? f[st.loc === 'cheapside' ? 1 : 0] : f);
  };
  P.ph_portrait = function (g, t, st) {
    var id = this.scene.slice(3), sp = PT[id]; if (!sp) return;
    var bgk = typeof sp.bg === 'object' ? (sp.bg[st.loc] || sp.bg.def) : sp.bg, x = sp.pos || 130, cx = x < 200 ? 300 : 100;
    if (bgk === 'void') { g.save(); g.globalAlpha = 0.12; g.translate(250, 140); g.rotate(t * 0.15); g.translate(-250, -140); BG.void(g); g.restore(); }
    if (bgk === 'fog') this.fog(g, 150, 150, 12, 'rgba(185,177,164,0.45)', 0.9, 6);
    if (bgk === 'candle') { var fl = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 3.1); D.star(g, cx, 152, 9 * fl, R, t); D.star(g, cx, 152, 5 * fl, C, -t); g.globalAlpha = 0.06 * (1 - fl); D.rect(g, 0, 0, W, H, K); g.globalAlpha = 1; }
    if (sp.pipe || sp.cigarette) this.smoke(g, { x: x, y: 150, s: 1.2, flip: x > 200 }, sp, t);
  };
  Object.keys(PT).forEach(function (id) { P['pt_' + id] = function (g) { if (!this.portraitScene(g, id)) this.restaurant(g, this.t, this.state); }; });
  // les personnages de Paris n'ont que leur portrait peint : en attendant qu'il arrive, le brouillard
  Object.keys(PTF).forEach(function (id) { if (!P['pt_' + id]) P['pt_' + id] = function (g) { (this.brouillard || this.restaurant).call(this, g, this.t, this.state); }; });
  // Mrs Vane n'a pas de portrait dessiné : tant que son image n'existe pas, on garde le décor du salon
  P.pt_vane = function (g) { this.bureau(g, this.t, this.state); };
})(typeof window !== 'undefined' ? window : globalThis);
