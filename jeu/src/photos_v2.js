/* Les illustrations au format cinéma (série de novembre 2026, 2304 × 960) : ce que le jeu anime par-dessus.
   Coordonnées mesurées sur chaque image, dans le repère du cadre cinéma : 720 × 300.
   lamps : [x, y, rayon] · candles : [x, y] · embers : [x, y] · rain : la pluie, seulement dehors · prowl : l'ombre qui rôde quand la santé mentale baisse. */
(function (G) {
  'use strict';
  var V = G.PixelArt && G.PixelArt.PHOTO_V2; if (!V) return;
  function dehors(n) { return { n: n || 60, a: 0.45, pts: [0, 0, 720, 0, 720, 300, 0, 300] }; }
  // la pluie derrière une vitre : seulement dans le polygone de la fenêtre
  function vitre(n, pts) { return { n: n || 20, a: 0.4, pts: pts }; }
  // cadrage des anciennes images 4:3, s'il en reste (0 = haut, 100 = bas) ; les images cinéma remplissent le cadre
  G.PixelArt.PHOTO_FOCUS = {};
  // recadrage horizontal d'une image cinéma dans un cadre 4:3 (en %, 50 = centre) : le sujet reste dans le cadre
  G.PixelArt.PHOTO_FOCUSX = { 'ecran-titre/titre': 74, 'londres/26_brouillard_trajet': 50 };
  // où regarder dans chaque image (en % de sa largeur), relevé à la main ou lu dans son prompt (jeu/tools/cadrage.py) :
  // dans la disposition « image en fond » de l'iPad en paysage, ce point tombe au milieu de la partie libre de l'écran
  G.PixelArt.PHOTO_CADRAGE = {"ecran-titre/titre": 45, "londres/01_institut-imperial": 28, "londres/02_hotel-chambre_nuit": 50, "londres/03_hotel-chambre_jour": 55, "londres/04_cheapside-chambre-meublee": 36, "londres/05_scotland-yard_bureau-fleming": 42, "londres/06_ambassade-de-turquie": 58, "londres/07_chelsea-arms_reception": 62, "londres/08_camberwell_salon-butter": 55, "londres/09_fleet-street_archives": 30, "londres/10_st-johns-wood_villa_jour": 58, "londres/11_st-johns-wood_villa_nuit": 60, "londres/12_st-johns-wood_ruines": 70, "londres/13_islington_brophy-lane_jour": 55, "londres/14_islington_brophy-lane_nuit": 50, "londres/15_stoke-newington_jour": 30, "londres/16_stoke-newington_nuit": 32, "londres/17_boutique-makryat": 45, "londres/18_british-museum_salle-de-lecture": 35, "londres/19_chambre-henry-stanley": 50, "londres/20_cave-butter_maquette": 52, "londres/21_train-fantome_voiture-1": 45, "londres/22_train-fantome_voiture-2": 52, "londres/23_train-fantome_retour": 50, "londres/24_campagne_au-petit-matin": 30, "londres/25_gare-victoria": 55, "londres/26_brouillard_trajet": 45, "londres/27_gordon-square_seance": 52, "paris/06_bibliotheque-de-l-arsenal": 76, "paris/08_charenton_secretariat": 24, "paris/10_cafe-de-charenton": 24, "portraits/01_smith_institut": 30, "portraits/02_smith_cheapside": 37, "portraits/03_beddows_institut": 76, "portraits/04_beddows_cheapside": 77, "portraits/05_brule": 26, "portraits/06_fleming": 31, "portraits/07_rigby": 79, "portraits/08_chelseaclerk": 27, "portraits/09_mustapha": 28, "portraits/10_voisin": 25, "portraits/11_atkins": 26, "portraits/12_sergent": 33, "portraits/13_butter": 22, "portraits/14_alexis": 33, "portraits/15_stanley": 30, "portraits/16_bibliothecaire": 27, "portraits/17_planton": 27, "portraits/18_concierge": 27, "portraits/19_agentsj": 77, "portraits/20_laitier": 25, "portraits/21_pike": 25, "portraits/22_serveur": 23, "portraits/23_veuve": 33, "portraits/24_conducteur": 30, "portraits/25_mort": 25, "portraits/26_vane": 74, "portraits/27_blain": 24, "portraits/28_gaudry": 76, "portraits/29_remi": 24, "portraits/30_brevin": 76, "portraits/31_rogniat": 24, "portraits/32_leroux": 76, "portraits/33_mandrin": 24, "portraits/34_guetteur": 24, "portraits/pj_arnaud": 33, "portraits/pj_ashby": 78, "portraits/pj_doyle": 28, "portraits/pj_pemberton": 72, "prologue/01_wagon-restaurant": 35, "prologue/02_soufflet": 48, "prologue/03_voitures-lits": 40, "prologue/04_compartiment-7": 60};

  // ---------------------------------------------------------------- écran-titre et prologue
  V['ecran-titre/titre'] = { rain: [dehors(90)] };
  V['prologue/01_wagon-restaurant'] = { lamps: [[431, 23, 6], [373, 63, 5], [508, 150, 6]], rain: [vitre(22, [0, 0, 104, 0, 96, 172, 0, 178]), vitre(22, [596, 22, 720, 0, 720, 182, 612, 160])] };
  V['prologue/02_soufflet'] = { lamps: [[355, 85, 4]] };
  V['prologue/03_voitures-lits'] = { lamps: [[288, 35, 5]], rain: [vitre(20, [22, 190, 60, 0, 132, 0, 118, 150]), vitre(12, [182, 125, 200, 0, 250, 0, 240, 105])] };
  V['prologue/04_compartiment-7'] = { lamps: [[450, 77, 5]], candles: [[364, 50]] };

  // ---------------------------------------------------------------- Londres
  V['londres/01_institut-imperial'] = {};
  V['londres/02_hotel-chambre_nuit'] = { lamps: [[226, 137, 6], [505, 93, 4]], rain: [vitre(16, [438, 25, 530, 10, 516, 160, 470, 166])], prowl: { x: 160, y: 290, h: 150, hat: 'top', lean: -0.4, san: 1 } };
  V['londres/03_hotel-chambre_jour'] = { lamps: [[110, 135, 5]] };
  V['londres/04_cheapside-chambre-meublee'] = { candles: [[265, 155]] };
  V['londres/05_scotland-yard_bureau-fleming'] = { lamps: [[446, 160, 6]] };
  V['londres/06_ambassade-de-turquie'] = {};
  V['londres/07_chelsea-arms_reception'] = { lamps: [[274, 31, 5]] };
  V['londres/08_camberwell_salon-butter'] = { candles: [[256, 77]] };
  V['londres/09_fleet-street_archives'] = { lamps: [[261, 40, 6]] };
  V['londres/10_st-johns-wood_villa_jour'] = {};
  V['londres/11_st-johns-wood_villa_nuit'] = { lamps: [[630, 40, 4]], prowl: { x: 560, y: 290, h: 110, lean: 0.2, san: 1 } };
  V['londres/12_st-johns-wood_ruines'] = { embers: [[265, 193]] };
  V['londres/13_islington_brophy-lane_jour'] = { lamps: [[139, 54, 5]] };
  V['londres/14_islington_brophy-lane_nuit'] = { lamps: [[191, 121, 6], [511, 94, 4]], rain: [dehors(60)] };
  V['londres/15_stoke-newington_jour'] = {};
  V['londres/16_stoke-newington_nuit'] = { lamps: [[623, 140, 6]], rain: [dehors(60)] };
  V['londres/17_boutique-makryat'] = { candles: [[292, 40]] };
  V['londres/18_british-museum_salle-de-lecture'] = { lamps: [[394, 232, 3], [558, 241, 3], [655, 234, 3]] };
  V['londres/19_chambre-henry-stanley'] = { prowl: { x: 600, y: 290, h: 110, lean: 0.2, san: 1 } };
  V['londres/20_cave-butter_maquette'] = { lamps: [[441, 40, 6]] };
  V['londres/21_train-fantome_voiture-1'] = {};
  V['londres/22_train-fantome_voiture-2'] = {};
  V['londres/23_train-fantome_retour'] = { embers: [[360, 211]] };
  V['londres/24_campagne_au-petit-matin'] = {};
  V['londres/25_gare-victoria'] = { lamps: [[659, 176, 4]] };
  V['londres/26_brouillard_trajet'] = { lamps: [[77, 263, 6]] };
  V['londres/27_gordon-square_seance'] = { candles: [[373, 185]] };

  // ---------------------------------------------------------------- portraits
  V['portraits/01_smith_institut'] = { embers: [[212, 94]], prowl: { x: 560, y: 290, h: 150, hat: 'top', lean: 0.3, san: 2 } };
  V['portraits/02_smith_cheapside'] = { candles: [[491, 189]], prowl: { x: 420, y: 280, h: 170, lean: -0.3, san: 2 } };
  V['portraits/03_beddows_institut'] = {};
  V['portraits/04_beddows_cheapside'] = { candles: [[643, 144]] };
  V['portraits/05_brule'] = { candles: [[495, 171]] };
  V['portraits/06_fleming'] = { lamps: [[592, 185, 6]] };
  V['portraits/07_rigby'] = {};
  V['portraits/08_chelseaclerk'] = {};
  V['portraits/09_mustapha'] = {};
  V['portraits/10_voisin'] = {};
  V['portraits/11_atkins'] = {};
  V['portraits/12_sergent'] = { lamps: [[445, 196, 4], [486, 173, 5], [549, 214, 4]] };
  V['portraits/13_butter'] = { candles: [[526, 227]] };
  V['portraits/14_alexis'] = {};
  V['portraits/15_stanley'] = {};
  V['portraits/16_bibliothecaire'] = {};
  V['portraits/17_planton'] = {};
  V['portraits/18_concierge'] = {};
  V['portraits/19_agentsj'] = { embers: [[266, 207]] };
  V['portraits/20_laitier'] = {};
  V['portraits/21_pike'] = {};
  V['portraits/22_serveur'] = { lamps: [[580, 162, 5]] };
  V['portraits/23_veuve'] = { lamps: [[396, 162, 5]] };
  V['portraits/24_conducteur'] = {};
  V['portraits/25_mort'] = {};
  V['portraits/26_vane'] = { candles: [[675, 189]] };
})(typeof window !== 'undefined' ? window : globalThis);
