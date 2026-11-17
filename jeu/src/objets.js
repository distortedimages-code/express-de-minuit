// =============================================================================
// Les objets importants de l'enquête : quand on les trouve, qu'on les examine ou qu'on les prend, leur image
// carrée s'affiche en grand, une seule fois par partie ; on les revoit ensuite depuis le carnet et la fiche.
// Seuls les objets qui comptent pour l'enquête sont ici : pas les couteaux à poisson ni les achats du jour.
//
// Une entrée : k (nom court), img (l'image carrée, dans img/), titre, et ce qui la déclenche dans le chapitre :
// les indices (clues, par leur id) et les possessions (items, par leur nom exact). Le chapitre de Paris comprend
// Poissy et le Simplon-Orient. Une image absente (pas encore générée) ne montre rien : le jeu continue sans elle.
// =============================================================================
(function (G) {
  'use strict';
  var OBJETS = {
    prologue: [
      { k: 'serviette', img: 'objets/01_serviette-de-ravel', titre: 'La serviette de Ravel', clues: ['SYMBOLE'], items: ['La serviette de Ravel'] },
      { k: 'billet7', img: 'objets/02_billet-brule', titre: 'Le billet brûlé', clues: ['NOTE7'] },
      { k: 'manchette', img: 'objets/03_bouton-de-manchette', titre: 'Le bouton de manchette', clues: ['MANCHETTE'], items: ['Le bouton de manchette gravé « A.R. »'] }
    ],
    londres: [
      { k: 'carte', img: 'objets/04_carte-de-smith', titre: 'La carte de Smith', clues: ['BILLET'], items: ['La carte de visite de Smith, au cachet de sa chevalière'] },
      { k: 'valise', img: 'objets/05_valise-de-beddows', titre: 'La valise de Beddows', items: ['La valise de Beddows (1 000 £ en billets neufs)'] },
      { k: 'cle14', img: 'objets/06_plaque-de-cle', titre: 'La clé de la chambre 14', clues: ['CLE14'], items: ['Une plaque de clé en cuivre : « Chelsea Arms, 14 »'] },
      { k: 'roussie', img: 'objets/07_lettre-roussie', titre: 'La lettre roussie', clues: ['LETTRE'], items: ['Une lettre roussie, à en-tête de M. Makryat'] },
      { k: 'peau', img: 'objets/08_message-sur-la-peau', titre: 'Le message sur la peau', clues: ['PEAU'] },
      { k: 'maquette', img: 'objets/09_maquette-des-alexis', titre: 'La maquette des Alexis', clues: ['MAQUETTE'], items: ['La maquette des Alexis, dans sa caisse'] },
      { k: 'gueridon', img: 'objets/10_gueridon-truque', titre: 'Le guéridon truqué', clues: ['TRUQUEE'] }
    ],
    paris: [
      { k: 'cahier', img: 'objets/11_cahier-de-delplace', titre: 'Le cahier bleu du docteur Delplace', clues: ['CAHIER'], items: ['Le cahier bleu du docteur Delplace'] },
      { k: 'registre', img: 'objets/12_registre-de-charenton', titre: 'Le registre de Charenton', clues: ['REGISTRE'] },
      { k: 'plans', img: 'objets/13_plans-de-la-villa', titre: 'Les plans de la villa', clues: ['VILLA'] },
      { k: 'actes', img: 'objets/14_actes-de-1789', titre: 'Les actes de 1789', clues: ['ACTES'] },
      { k: 'wellington', img: 'objets/15_lettre-de-wellington', titre: 'La lettre de Lausanne', clues: ['LETTRE'] },
      { k: 'bras', img: 'objets/16_bras-gauche', titre: 'Le Bras gauche du Simulacre', clues: ['BRAS'], items: ['Le Bras gauche du Simulacre'] },
      { k: 'aida', img: 'objets/17_places-pour-aida', titre: 'Deux places pour Aïda', items: ['Deux places pour Aïda, à la Scala'] }
    ]
  };
  // l'objet d'un indice ou d'une possession, dans un chapitre ; null s'il n'en a pas
  function objetDe(chapitre, quoi) {
    var l = OBJETS[chapitre] || [];
    for (var i = 0; i < l.length; i++) {
      var o = l[i];
      if (quoi.clue && (o.clues || []).indexOf(quoi.clue) >= 0) return o;
      if (quoi.item && (o.items || []).indexOf(quoi.item) >= 0) return o;
    }
    return null;
  }
  G.OBJETS = OBJETS;
  G.objetDe = objetDe;
})(typeof window !== 'undefined' ? window : globalThis);
