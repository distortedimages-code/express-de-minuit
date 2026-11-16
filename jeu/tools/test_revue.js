// revue d'un chapitre : tous les lieux, à plusieurs heures, toutes les actions et tous les sujets, une fois chacun.
// On cherche les plantages et les textes abîmés (jeton oublié, « undefined », réplique vide).
global.window = global; global.RPG_ABSENTS = []; global.RPG_FAITS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','idees','folie']) require('../src/' + f + '.js');
const ch = process.argv[2] || 'londres', sc = CHAPTERS[ch], J = 1440;
const MAUVAIS = /undefined|NaN|\[object|\{[A-Za-z]{1,8}\}|\bnull\b|  +«|«\s*»/;
const temps = ch === 'londres' ? [['lundi 10 h', 3 * J + 600], ['samedi 23 h 30', J + 23 * 60 + 30], ['dimanche 15 h', 2 * J + 900], ['mardi 9 h', 4 * J + 540]] : ch === 'paris' ? [['jeudi 10 h 30', 6 * J + 630], ['samedi 17 h 30', 8 * J + 1050], ['dimanche 11 h', 9 * J + 660], ['lundi 23 h', 10 * J + 1380]] : [['début', null]];
const profils = [['débutant', g => {}], ['avancé', g => { Object.keys(sc.clues || {}).forEach(k => { try { if (!g.api.has(k)) g.state.clues.push(k); } catch (e) {} }); ['conference', 'discours', 'cheapsideVu', 'stanleyDispo', 'presse1', 'tableVue', 'carteBN', 'registresOuverts', 'caissesVues', 'cahierVu', 'remiVu', 'journalParis'].forEach(k => g.api.flag(k, true)); }]];
let actions = 0, sujets = 0, plantages = 0, abimes = 0, lignes = 0; const vus = new Set(), notes = [];
function scan(g, b, ctx) {
  g.state.log.filter(e => e.n > b && typeof e.x === 'string').forEach(e => {
    lignes++;
    if (!e.x.trim() || MAUVAIS.test(e.x)) { const k = e.x.slice(0, 60); if (!vus.has(k)) { vus.add(k); abimes++; notes.push('TEXTE ' + ctx + ' → ' + e.x.slice(0, 140)); } }
  });
}
for (const loc of Object.keys(sc.locations)) for (const [tn, tm] of temps) for (const [pn, prep] of profils) {
  const base = () => { let seed = 11; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; const g = RPG.createGame(sc, null, sc.pregens ? { rng, pc: sc.pregens[0] } : { rng }); if (tm !== null) g.state.min = tm; Object.keys(sc.locations).forEach(k => { g.api.flag('known:' + k, true); g.api.flag('connu:' + k, true); }); g.api.flag('connu:poissy', true); prep(g); try { if (g.state.loc !== loc) g.api.go(loc); } catch (e) { plantages++; notes.push('PLANTAGE arrivée ' + loc + ' ' + tn + ' : ' + e.message); } return g; };
  const liste = (sc.locations[loc].actions || []).concat(sc.globalActions || []);
  for (const a of liste) {
    const g = base(); if (g.state.ended) continue;
    const ctx = loc + ' · ' + tn + ' · ' + pn + ' · ' + a.id;
    let b = g.state.seq;
    try { g.choose({ label: a.label || a.id, action: a.id }); let gd = 0; while (g.state.pending && gd++ < 5) g.roll(); if (g.state.seq > b) actions++; } catch (e) { plantages++; notes.push('PLANTAGE ' + ctx + ' : ' + e.message); continue; }
    scan(g, b, ctx);
    if (g.state.talk) {
      const id = g.state.talk;
      for (const t of (sc.npcs[id].topics || [])) {
        if (g.state.talk !== id || g.state.ended) break;
        b = g.state.seq;
        try { g.choose({ label: t.chip || t.id, topic: t.id }); let gd = 0; while (g.state.pending && gd++ < 5) g.roll(); sujets++; } catch (e) { plantages++; notes.push('PLANTAGE ' + ctx + ' sujet ' + t.id + ' : ' + e.message); }
        scan(g, b, ctx + ' sujet ' + t.id);
      }
    }
  }
}
notes.slice(0, 25).forEach(n => console.log(n));
console.log(ch + ' : ' + Object.keys(sc.locations).length + ' lieux, ' + actions + ' actions jouées, ' + sujets + ' sujets, ' + lignes + ' textes lus | plantages ' + plantages + ' | textes abîmés ' + abimes + ' | répliques d’absents ' + RPG_ABSENTS.length + ' | faits prématurés arrêtés ' + RPG_FAITS.length);
