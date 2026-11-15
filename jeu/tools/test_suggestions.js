// les suggestions de sujets au fil d'une conversation
global.window = global;
require('../src/engine.js'); require('../src/scene.js'); require('../src/londres.js'); require('../src/londres_circuits.js'); require('../src/londres_combat.js'); require('../src/parole.js'); require('../src/fiches.js'); require('../src/jets.js'); require('../src/londres_seance.js'); require('../src/londres_impro.js'); require('../src/londres_objets.js');
const L = CHAPTERS[process.env.CH||'prologue'];
let seed=1; const rng=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
const g=RPG.createGame(L,null,{rng});
for (const c of require('fs').readFileSync(process.argv[2],'utf8').split('\n').filter(Boolean)) {
  if (c.startsWith('!js ')) { eval(c.slice(4)); continue; }
  if (c.startsWith('!go ')) { if (g.state.talk) g.api.endTalk(false); g.api.go(c.slice(4)); continue; }
  const before=g.state.seq; g.step(c);
  console.log('> '+c); g.state.log.filter(e=>e.n>before&&e.t==='npc').forEach(e=>console.log('   '+e.who+': '+e.x.slice(0,140)));
  console.log('   SUJETS: '+g.topicChips().map(t=>t.label).join(' | '));
}
