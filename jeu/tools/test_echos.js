// l'écho juste : lance un banc d'essai et liste les reprises que le joueur n'avait pas dites
global.RPG_ECHOS = [];
require('./' + (process.argv[2] || 'fuzzparole') + '.js');
process.on('exit', () => {
  console.error('ECHOS corrigés ' + RPG_ECHOS.length);
  const seen = new Set();
  RPG_ECHOS.forEach(e => { const k = e.who + e.echo; if (seen.has(k)) return; seen.add(k); if (seen.size <= (+process.env.N || 40)) console.error('  [' + e.who + '] « ' + e.dit + ' » → ' + e.x); });
});
