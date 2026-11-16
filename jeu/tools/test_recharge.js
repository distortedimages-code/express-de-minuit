// un jet en attente (et un jet forcé proposé), sauvegardé puis rechargé : le bouton doit marcher
global.window = global; global.RPG_ABSENTS = []; global.RPG_FAITS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','idees','folie']) require('../src/' + f + '.js');
const sc = CHAPTERS.londres; let ko = 0;
for (const [cmd, seed] of [['Réfléchir', 3], ['j’écoute attentivement', 5], ['je fouille la pièce', 7]]) {
  for (const etape of ['jet', 'force']) {
    let v = 0.97; const rng = () => v;  // tout rate : on obtient le jet forcé
    const g = RPG.createGame(sc, null, { rng, pc: JSON.parse(JSON.stringify(sc.pregens[0])) });
    if (cmd === 'Réfléchir') g.choose({ label: 'Réfléchir', reflechir: true }); else g.step(cmd);
    if (!g.state.pending) { console.log('pas de jet pour', cmd); continue; }
    if (etape === 'force') { g.roll(); if (!g.state.pendingPush) { console.log('pas de jet forcé pour', cmd); continue; } g.push(); }
    const id = g.state.pending && g.state.pending.id;
    // la sauvegarde et le rechargement : l'état passe par JSON, les jets improvisés sont oubliés
    const sauve = JSON.parse(JSON.stringify(g.state));
    Object.keys(sc.checks).filter(k => /^jet:/.test(k)).forEach(k => delete sc.checks[k]);
    let w = 0.2; const g2 = RPG.createGame(sc, sauve, { rng: () => w, pc: sauve.pc });
    const n = g2.state.log.length;
    try { g2.roll(); } catch (e) { ko++; console.log('PLANTAGE', cmd, etape, e.message); continue; }
    const ok = !g2.state.pending && g2.state.log.length > n;
    if (!ok) ko++;
    console.log(cmd.padEnd(26), etape.padEnd(5), id.padEnd(22), ok ? 'le jet part' : 'RIEN NE SE PASSE', '|', g2.state.log.slice(n).filter(e => typeof e.x === 'string').map(e => e.x).join(' ').slice(0, 90));
  }
}
console.log('problèmes', ko);
