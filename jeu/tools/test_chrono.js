// chronologie : avant l'incendie (samedi 23 h), personne ne doit en parler
global.window = global; global.RPG_FAITS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets']) require('../src/' + f + '.js');
const L = CHAPTERS.londres, FEU = 1440 + 23 * 60;
const Q = ['parlez-moi de Smith', 'et Beddows ?', 'la maison de Smith ?', 'St John’s Wood ?', 'que savez-vous du professeur ?', 'et Rigby ?', 'et Fleming ?', 'Scotland Yard ?', 'quoi de neuf ?', 'que se passe-t-il à Londres ?', 'où est Smith ?', 'vous connaissez le domestique ?', 'il s’est passé quelque chose ?', 'et lui ?', 'pourquoi ?', 'racontez', 'que disent les journaux ?', 'je l’ai vu hier', 'j’ai essayé de l’étrangler', 'la police ?', 'et le sergent ?', 'un témoin ?', 'qu’avez-vous vu ?'];
const RX = /incendie de|l’incendie|un incendie|a brûlé|ont brûlé|maison brûl|ruines|cendres|flammes|le feu\b|du feu\b|essence|flambait|carcasse|parti du bureau/i;
let seed = 3; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const vus = {}; let n = 0;
for (const id of Object.keys(L.npcs)) {
  if (!L.npcs[id].topics || !L.npcs[id].topics.length) continue;
  for (let run = 0; run < 2; run++) {
    L.pnjIci = (api, who) => who === id;
    const g = RPG.createGame(L, null, { rng, pc: L.pregens[run] });
    g.state.min = 1440 + 10 * 60; g.api.flag('conference', true);
    for (let k = 0; k < Q.length; k++) {
      if (!g.state.talk) { try { g.api.npcs(id).closedUntil = -1; g.api.npcs(id).patience = 6; g.api.talk(id); } catch (e) { break; } }
      const b = g.state.seq; try { g.step(Q[(k + run * 7) % Q.length]); } catch (e) { console.log('ERR', id, e.message); break; }
      let gd = 0; while (g.state.pending && gd++ < 4) g.roll();
      if (g.state.min >= FEU) break;
      g.state.log.filter(e => e.n > b && (e.t === 'npc' || e.t === 'narr') && RX.test(e.x)).forEach(e => { const k2 = id + e.x.slice(0, 40); if (!vus[k2]) { vus[k2] = 1; n++; console.log('[' + id + '] « ' + Q[(k + run * 7) % Q.length] + ' » → ' + e.x.slice(0, 150)); } });
    }
  }
}
delete L.pnjIci;
const par = {}; RPG_FAITS.forEach(f => { par[f.who] = (par[f.who] || 0) + 1; });
console.log('répliques qui parlent de l’incendie avant l’incendie : ' + n + ' | arrêtées par le verrou des faits : ' + RPG_FAITS.length + ' ' + JSON.stringify(par));
