// verrou des absents : lance les fuzzers et liste les répliques bloquées (un PNJ qui parlerait sans être là)
global.RPG_ABSENTS = [];
const which = process.argv[2] || 'fuzzl';
require('./' + which + '.js');
process.on('exit', () => {
  const by = {};
  RPG_ABSENTS.forEach(a => { const k = a.who + ' @' + a.loc + (a.talk ? ' (talk:' + a.talk + ')' : ''); by[k] = by[k] || { n: 0, x: a.x }; by[k].n++; });
  console.error('ABSENTS ' + RPG_ABSENTS.length);
  Object.keys(by).sort((a, b) => by[b].n - by[a].n).slice(0, 40).forEach(k => console.error('  ' + by[k].n + '  ' + k + '  ' + by[k].x));
});
