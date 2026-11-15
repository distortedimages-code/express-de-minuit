/* La série d'illustrations générées (novembre 2026) : ce que le jeu anime par-dessus chacune.
   Coordonnées mesurées sur chaque image, dans un cadre de 400 × 300.
   lamps : [x, y, rayon] · candles : [x, y] · embers : [x, y] · rain : la pluie, seulement dehors (dans un intérieur, elle tomberait dans la pièce) · prowl : l'ombre qui rôde quand la santé mentale baisse. */
(function (G) {
  'use strict';
  var V = G.PixelArt && G.PixelArt.PHOTO_V2; if (!V) return;
  // où centrer le recadrage en format cinéma (0 = haut, 100 = bas), quand le réglage par défaut coupe l'essentiel
  G.PixelArt.PHOTO_FOCUS = { 'portraits/26_vane': 50, 'londres/27_gordon-square_seance': 50, 'portraits/05_brule': 40, 'portraits/25_mort': 18, 'portraits/12_sergent': 18, 'portraits/17_planton': 16, 'portraits/20_laitier': 16, 'portraits/09_mustapha': 14, 'portraits/03_beddows_institut': 16, 'portraits/04_beddows_cheapside': 18, 'londres/06_ambassade-de-turquie': 22, 'portraits/01_smith_institut': 30 };
  function vitre(x0, y0, x1, y1, n) { return { n: n || 22, a: 0.45, pts: [x0, y0, x1, y0, x1, y1, x0, y1] }; }

  // ---------------------------------------------------------------- écran-titre et prologue
  V['ecran-titre/titre'] = { rain: [vitre(0, 0, 400, 300, 70)] };
  V['prologue/01_wagon-restaurant'] = { lamps: [[334, 150, 5], [205, 40, 4]] };
  V['prologue/02_soufflet'] = { lamps: [[238, 90, 3]] };
  V['prologue/03_voitures-lits'] = { lamps: [[231, 46, 4]] };
  V['prologue/04_compartiment-7'] = { lamps: [[320, 85, 5]] };

  // ---------------------------------------------------------------- Londres
  V['londres/01_institut-imperial'] = { candles: [[230, 206]] };
  V['londres/02_hotel-chambre_nuit'] = { prowl: { x: 110, y: 270, h: 150, hat: 'top', lean: -0.4, san: 1 } };
  V['londres/03_hotel-chambre_jour'] = {};
  V['londres/04_cheapside-chambre-meublee'] = { candles: [[140, 150]] };
  V['londres/05_scotland-yard_bureau-fleming'] = { lamps: [[382, 165, 5]] };
  V['londres/06_ambassade-de-turquie'] = {};
  V['londres/07_chelsea-arms_reception'] = { lamps: [[93, 71, 5], [13, 72, 4]] };
  V['londres/08_camberwell_salon-butter'] = { candles: [[311, 106]] };
  V['londres/09_fleet-street_archives'] = { lamps: [[133, 40, 6], [245, 92, 5]] };
  V['londres/10_st-johns-wood_villa_jour'] = {};
  V['londres/11_st-johns-wood_villa_nuit'] = { lamps: [[193, 62, 4]], prowl: { x: 300, y: 285, h: 110, lean: 0.2, san: 1 } };
  V['londres/12_st-johns-wood_ruines'] = { embers: [[263, 180]] };
  V['londres/13_islington_brophy-lane_jour'] = { lamps: [[41, 76, 5]] };
  V['londres/14_islington_brophy-lane_nuit'] = { lamps: [[360, 77, 6], [241, 138, 4]], rain: [vitre(0, 0, 400, 300, 45)] };
  V['londres/15_stoke-newington_jour'] = { lamps: [[366, 82, 4]] };
  V['londres/16_stoke-newington_nuit'] = { lamps: [[37, 66, 6]], rain: [vitre(0, 0, 400, 300, 45)] };
  V['londres/17_boutique-makryat'] = { candles: [[285, 60]] };
  V['londres/18_british-museum_salle-de-lecture'] = { lamps: [[163, 247, 4], [316, 242, 4]] };
  V['londres/19_chambre-henry-stanley'] = { prowl: { x: 330, y: 270, h: 100, lean: 0.2, san: 1 } };
  V['londres/20_cave-butter_maquette'] = { lamps: [[269, 64, 6]] };
  V['londres/21_train-fantome_voiture-1'] = {};
  V['londres/22_train-fantome_voiture-2'] = {};
  V['londres/23_train-fantome_retour'] = { embers: [[185, 176]] };
  V['londres/24_campagne_au-petit-matin'] = {};
  V['londres/25_gare-victoria'] = { lamps: [[119, 144, 5]] };
  V['londres/26_brouillard_trajet'] = { lamps: [[162, 117, 5], [321, 64, 6], [188, 133, 4]] };

  // ---------------------------------------------------------------- portraits
  V['portraits/01_smith_institut'] = { embers: [[106, 118]], prowl: { x: 320, y: 280, h: 150, hat: 'top', lean: 0.3, san: 2 } };
  V['portraits/02_smith_cheapside'] = { candles: [[342, 182]], prowl: { x: 250, y: 260, h: 170, lean: -0.3, san: 2 } };
  V['portraits/03_beddows_institut'] = {};
  V['portraits/04_beddows_cheapside'] = { candles: [[378, 150]] };
  V['portraits/05_brule'] = { candles: [[287, 158]] };
  V['portraits/06_fleming'] = { lamps: [[384, 186, 5]] };
  V['portraits/07_rigby'] = {};
  V['portraits/08_chelseaclerk'] = { lamps: [[193, 130, 5]] };
  V['portraits/09_mustapha'] = {};
  V['portraits/10_voisin'] = {};
  V['portraits/11_atkins'] = {};
  V['portraits/12_sergent'] = { lamps: [[348, 62, 6], [316, 129, 4]] };
  V['portraits/13_butter'] = { candles: [[380, 195]] };
  V['portraits/14_alexis'] = {};
  V['portraits/15_stanley'] = {};
  V['portraits/16_bibliothecaire'] = {};
  V['portraits/17_planton'] = {};
  V['portraits/18_concierge'] = { lamps: [[22, 115, 5]] };
  V['portraits/19_agentsj'] = { embers: [[162, 160]] };
  V['portraits/20_laitier'] = { lamps: [[146, 124, 5]] };
  V['portraits/21_pike'] = {};
  V['portraits/22_serveur'] = { lamps: [[249, 115, 5], [358, 160, 5]] };
  V['portraits/23_veuve'] = { lamps: [[22, 70, 5]] };
  V['portraits/24_conducteur'] = {};
  V['portraits/25_mort'] = {};
})(typeof window !== 'undefined' ? window : globalThis);
