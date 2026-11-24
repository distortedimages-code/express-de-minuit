// Lausanne, de la gare à Milan : plusieurs joueurs, plusieurs façons de jouer, des dés ordinaires.
// On vérifie que le chapitre se termine toujours, et que chaque branche (le procès, le sauvetage, le silence,
// le refus, la porte du duc, le rêve à l'hôtel) mène où elle doit.
global.window = global; global.RPG_ABSENTS = []; global.RPG_PROCES = [];
for (const f of ['engine','scene','londres','londres_circuits','londres_combat','parole','fiches','jets','londres_seance','londres_impro','londres_objets','paris','poissy','lausanne','lausanne_reve','idees','folie']) require('../src/' + f + '.js');
const P = CHAPTERS.lausanne, J = 1440;
const ROULEAU = P._h.ROULEAU, FAUX = P._h.FAUX, FIOLE = P._h.FIOLE;
let ok = 0, ko = 0; const fautes = [];
function partie(seed, pi, strat) {
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const pc = JSON.parse(JSON.stringify(P.pregens[pi]));
  pc.passe = { paris: { titre: 'Paris', fin: 'ok', min: 10 * J + 6 * 60 + 40, indices: ['LETTRE', 'MALON'], drapeaux: { lettre: true, billetsScala: true, brasPris: true } } };
  pc.inv = ['Le Bras gauche du Simulacre', 'Deux places pour Aïda, à la Scala'];
  const g = RPG.createGame(P, null, { rng, pc }), s = g.state, A = g.api;
  const roll = () => { let n = 0; while (s.pending && n++ < 8) g.roll(); };
  const dispo = id => g.actionsIci().some(a => a.id === id);
  const act = id => { if (s.ended) return false; for (let k = 0; k < 3; k++) { if (!dispo(id)) return k > 0; const avant = s.log.length; g.choose({ label: id, action: id }); roll(); if (!s.log.slice(avant).some(e => /Vous vouliez|Vous alliez agir|Vos mains frottent/.test(e.x || ''))) return true; } return true; };
  const top = id => { if (s.ended || !s.talk) return; g.choose({ label: id, topic: id }); roll(); };
  const dire = x => { if (s.ended) return; g.step(x, 'dire'); roll(); };
  const agir = x => { if (s.ended) return; g.step(x, 'agir'); roll(); };
  const fin = () => { if (s.talk) A.endTalk(false); };
  const aller = id => { fin(); if (s.loc !== id) act('go_' + id); };
  const h = () => Math.floor((s.min % J) / 60);
  const log = [];
  try {
    act('lg_cafe'); act('lg_hotel'); act('lh_dormir');
    if (strat === 'tard') { act('lh_attendre'); act('lh_gazette'); aller('la_cathedrale'); agir('j’attends'); agir('j’attends'); }
    if (strat !== 'tard') {
      aller('la_rue'); act('lr_sonner');
      if (s.talk === 'edgar') { top('rouleau'); top('rouleau'); top('prix'); top('william'); }
      fin();
    }
    if (strat === 'sauveur') {
      act('vi_quitter'); aller('la_hotel'); act('lh_attendre'); aller('la_rue');
      let n = 0; while (!A.flag('temoin') && n++ < 6 && !s.ended) { if (!act('lr_sonner')) agir('je sonne'); if (s.loc === 'la_boutique') act('lb_attendre'); if (!A.flag('temoin')) agir('j’attends'); }
      if (!A.flag('temoin')) log.push('pas de témoin');
      if (s.loc !== 'la_etage') { act('lb_monter'); }
      act('le_attendre');
      aller('la_hotel'); act('lh_dormir');
    } else if (strat === 'filature') {
      act('vi_suite'); act('vi_suite'); act('vi_suite'); act('vi_suite');
      act('cn_suivre');
      if (A.flag('ducVuEntrer')) act('lr_entrer');
      if (A.flag('interrompu')) { act('le_soigner_w'); act('le_soigner_e'); }
      if (A.flag('edgarSauve')) { if (s.loc !== 'la_etage') { aller('la_rue'); act('lr_sonner'); act('lb_monter'); } act('le_attendre'); aller('la_hotel'); act('lh_dormir'); }
    } else if (strat === 'porte') {
      act('vi_quitter'); aller('la_musee'); act('lm_chappuis'); top('occulte'); fin();
      let n = 0; while (!A.has('KULTEN') && n++ < 8 && h() < 17) act('lm_occulte');
      if (A.has('KULTEN')) { aller('la_pre'); n = 0; while (!A.flag('dedansDuc') && n++ < 6) act('lp_forcer'); act('lp_entrer'); act('lpi_monter'); act('lpi_porte'); act('lpi_franchir'); act('rpr_sortir'); act('rv_errer'); act('rv_errer'); act('rv_maison'); act('rpr_porte'); }
      if (s.loc === 'la_preint') act('lpi_sortir');
    } else {
      act('vi_suite'); act('vi_suite'); act('vi_suite'); act('vi_suite');
    }
    // le soir : le Chat Noir, Max, puis la rue Saint-Étienne
    if (!A.flag('edgarSauve') && !s.ended) {
      if (strat === 'tard') { let k = 0; while (Math.floor((s.min % J) / 60) < 19 && k++ < 30) agir('j’attends'); }
      else { aller('la_chatnoir'); act('cn_diner'); act('cn_attendre'); }
      if (s.talk === 'max') { top('duc'); top('tout'); }
      fin(); let n = 0; while (s.loc === 'la_chatnoir' && n++ < 6) agir('j’attends');
      aller('la_rue'); act('lr_entrer'); act('lb_lumiere'); if (strat !== 'refus2') act('lb_fermer'); act('lb_monter');
      act('le_cuisine'); act('le_chambre'); act('le_corps'); act('le_fouiller'); act('le_souslit'); act('le_journal');
      if (A.flag('policeVenue')) act(strat === 'refus2' ? 'le_police' : 'le_fuir');
      if (strat === 'hotel') { aller('la_hotel'); agir('je bois la fiole verte'); }
      else if (s.loc !== 'la_gare') { aller('la_hotel'); act('lh_dormir'); }
    }
    if (!/^re_/.test(s.loc)) { aller('la_gare'); let n = 0; while (!/^tr_/.test(s.loc) && n++ < 4 && !s.ended) { if (!act('lg_train')) { act('lh_dormir'); aller('la_gare'); } } }
    if (/^tr_/.test(s.loc) && A.item(FIOLE) && !A.flag('reveFait')) agir('je bois la fiole verte');
    // le rêve, et le procès
    if (/^re_/.test(s.loc)) {
      act('rt_porte'); act('rt_sortir'); act('rp_porte'); act('rc_sortir'); act('rb_rue');
      let n = 0; while (s.loc !== 're_palud' && n++ < 6 && /^re_/.test(s.loc)) act('rv_errer');
      if (s.loc === 're_palud') {
        if (strat === 'silence') dire('Non, je me tais.');
        else {
          dire('Moi. Je le défends.'); act('pr_edgar'); act('pr_commencer');
          if (strat === 'chips') { act('pr_c1a'); act('pr_c2a'); act('pr_c3a'); }
          else {
            dire('Il dormait ! Vos hommes l’ont arraché de son lit en pleine nuit, sans lui dire pourquoi. N’importe qui se serait débattu.');
            dire('Vous êtes vous-même français, Prince. Et cette ville a été romaine, burgonde : être né ailleurs n’est pas un crime.');
            dire('Savoir n’est pas un crime. Ce rouleau lui appartient, et vous ne l’accusez que parce que vous le voulez.');
          }
          act('pr_courir'); act('rb_fuir'); act('rp_courir');
        }
      }
    }
    if (s.loc === 'la_hotel' && !s.ended) { aller('la_gare'); act('lg_train'); }
    // le train : le duc
    if (/^tr_/.test(s.loc)) {
      act('tc_restaurant'); act('trr_attendre');
      if (strat === 'refus' || strat === 'refus2') { act('trr_refuser'); act('trr_refuser'); act('trr_refuser'); }
      else if (A.item(FAUX)) act('trr_faux'); else if (A.item(ROULEAU)) act('trr_vrai');
      act('trr_manger');
      let n = 0; while (!s.ended && n++ < 12) agir('j’attends');
    }
  } catch (e) { fautes.push(strat + ' ' + pi + ' : ' + e.stack.split('\n').slice(0, 3).join(' | ')); return null; }
  const queue = s.log.slice(-8).map(e => (e.t === 'npc' ? e.who + ': ' : e.t === 'chips' ? '[' + e.list.map(l => l.label).join('|') + '] ' : e.t === 'roll' ? 'ROLL ' + e.skill + ' ' + e.levelName + ' ' : e.t + ': ') + String(e.x || '').slice(0, 90));
  return { queue: process.env.QUEUE ? queue : undefined, strat, pi, fini: s.ended, fin: A.flag('fin'), milan: A.flag('milan'), gagne: A.flag('procesGagne'), perdu: A.flag('procesPerdu'), sauve: A.flag('edgarSauve'), rouleau: A.item(ROULEAU), faux: A.flag('fauxDonne'), chaise: A.flag('chaise'), loc: s.loc, quand: g.clock(), san: s.pc.san, log };
}
const ATTENDU = {
  classique: r => r.milan && r.chaise && r.gagne !== undefined,
  chips: r => r.milan && r.chaise,
  sauveur: r => r.milan && r.sauve && r.rouleau,
  filature: r => r.milan,
  silence: r => r.milan && r.perdu && !r.rouleau,
  refus: r => r.fin === 'prison' || r.milan,
  refus2: r => r.milan && !r.fin,
  hotel: r => r.milan,
  porte: r => r.milan,
  tard: r => r.milan
};
const stats = {};
for (const strat of Object.keys(ATTENDU)) for (let seed0 = 1; seed0 <= 6; seed0++) for (let pi = 0; pi < 3; pi++) {
  if (process.env.SEUL && process.env.SEUL !== strat) continue;
  const r = partie(seed0 * 7919 + pi * 13 + strat.length, pi, strat);
  if (!r) { ko++; continue; }
  const st = stats[strat] = stats[strat] || { n: 0, ok: 0, gagne: 0, rouleau: 0, sauve: 0, prison: 0 };
  st.n++; if (r.gagne) st.gagne++; if (r.rouleau) st.rouleau++; if (r.sauve) st.sauve++; if (r.fin === 'prison') st.prison++;
  if (r.fini && ATTENDU[strat](r)) { ok++; st.ok++; } else { ko++; fautes.push(JSON.stringify(r)); }
}
for (const k in stats) console.log(k.padEnd(10), JSON.stringify(stats[k]));
if (RPG_ABSENTS.length) console.log('répliques d’absents :', RPG_ABSENTS.length, JSON.stringify(RPG_ABSENTS.slice(0, 4)));
const notes = {}; RPG_PROCES.forEach(p => { notes[p.score] = (notes[p.score] || 0) + 1; });
console.log('plaidoiries notées :', JSON.stringify(notes));
fautes.slice(0, 12).forEach(f => console.log('  ✗', f));
console.log(ok + ' parties conformes, ' + ko + ' en défaut');
process.exit(ko ? 1 : 0);
