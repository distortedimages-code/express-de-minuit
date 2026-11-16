// La réponse brève : « oui », « non », « peut-être », « d'accord ». Aucun personnage ne doit répondre
// « je n'ai pas saisi » à un oui ; et quand il vient d'amorcer un sujet par une question, le oui ouvre ce sujet.
global.window = global; global.RPG_FILS = []; global.RPG_BREFS = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','idees','folie']) require('../src/' + f + '.js');
let rates = 0, vus = 0; const notes = [];
function partie(ch, pc) { let seed = 5; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; const sc = CHAPTERS[ch]; return RPG.createGame(sc, null, sc.pregens ? { rng, pc: sc.pregens[pc || 0] } : { rng }); }
const roll = g => { let n = 0; while (g.state.pending && n++ < 6) g.roll(); };
const dernier = (g, b) => g.state.log.filter(e => e.n > b && e.t === 'npc').map(e => e.x);

// 1. le cas signalé : Smith amorce les photographies, on répond « Oui »
for (const mot of ['Oui', 'oui professeur', 'Non', 'je ne sais pas', 'bien sûr']) {
  const g = partie('londres'), s = g.state; g.api.flag('conference', true);
  g.choose({ label: 'x', action: Object.values(CHAPTERS.londres.locations.institut.actions).find(a => a.talkTo === 'smith').id }); roll(g);
  let amorce = null, garde = 0;
  while (!amorce && garde++ < 12 && s.talk === 'smith') { const b = s.seq, n0 = RPG_FILS.length; g.step(['quel temps fait-il', 'vous aimez le thé', 'belle soirée', 'il fait chaud ici'][garde % 4], 'dire'); roll(g); if (RPG_FILS.length > n0) amorce = RPG_FILS[RPG_FILS.length - 1]; }
  if (!amorce) { rates++; notes.push('Smith : aucune amorce'); continue; }
  const b = s.seq, avant = s.npcs.smith.asked[amorce.t] || 0; g.step(mot, 'dire'); roll(g);
  const rep = dernier(g, b), ouvert = (s.npcs.smith.asked[amorce.t] || 0) > avant;
  vus++;
  if (!ouvert || rep.some(x => /pas saisi|Pardon \?|Hm \?/.test(x))) { rates++; notes.push('Smith « ' + mot + ' » après « ' + amorce.x.slice(0, 50) + '… » → ' + rep.join(' / ').slice(0, 120)); }
  else if (mot === 'Oui') console.log('  amorce : ' + amorce.x.slice(0, 90) + '\n  « Oui » → ' + rep.join(' ').slice(0, 150));
}

// 2. partout : aucun « oui » ne tombe dans les répliques d'incompréhension
for (const ch of ['prologue', 'londres', 'paris']) {
  const sc = CHAPTERS[ch];
  for (const loc of Object.keys(sc.locations)) for (const a of (sc.locations[loc].actions || []).filter(x => x.talkTo)) {
    const npc = sc.npcs[a.talkTo]; if (!npc) continue;
    const perdu = new Set([].concat(npc.deflect || [], npc.deflect2 || [], npc.deflect3 || []));
    for (const suite of [['oui'], ['non'], ['peut-être'], ['d’accord'], ['SUJET', 'oui'], ['SUJET', 'non'], ['SUJET', 'SUJET', 'oui', 'oui']]) {
      const g = partie(ch), s = g.state;
      Object.keys(sc.locations).forEach(k => { g.api.flag('known:' + k, true); g.api.flag('connu:' + k, true); });
      if (ch === 'londres') { s.min = 3 * 1440 + 630; ['conference', 'discours'].forEach(k => g.api.flag(k, true)); }
      if (ch === 'paris') { s.min = 8 * 1440 + 630; ['carteBN', 'mandrinVu'].forEach(k => g.api.flag(k, true)); }
      try { if (s.loc !== loc) g.api.go(loc); g.choose({ label: a.label || a.id, action: a.id }); roll(g); } catch (e) { continue; }
      if (s.talk !== a.talkTo) continue;
      let ti = 0;
      for (const m of suite) {
        if (s.talk !== a.talkTo || s.ended) break;
        const b = s.seq;
        try {
          if (m === 'SUJET') { const t = (npc.topics || []).filter(t => t.chip && (!t.cond || t.cond(g.api)))[ti++]; if (!t) break; g.choose({ label: t.chip, topic: t.id }); roll(g); continue; }
          g.step(m, 'dire'); roll(g);
        } catch (e) { rates++; notes.push('PLANTAGE ' + ch + '/' + a.talkTo + ' « ' + m + ' » : ' + e.message); break; }
        const rep = dernier(g, b); vus++;
        if (!rep.length && s.talk === a.talkTo) { rates++; notes.push(ch + '/' + a.talkTo + ' « ' + m + ' » → silence'); }
        rep.forEach(x => { if (perdu.has(x) || /pas saisi|ne (vous )?comprends pas|pas sûr de vous suivre/.test(x)) { rates++; notes.push(ch + '/' + a.talkTo + ' [' + suite.join(',') + '] « ' + m + ' » → ' + x.slice(0, 100)); } });
      }
    }
  }
}
[...new Set(notes)].slice(0, 25).forEach(n => console.log(n));
console.log('réponses brèves vérifiées ' + vus + ' | prises par la règle ' + RPG_BREFS.length + ' | ratées ' + rates);
