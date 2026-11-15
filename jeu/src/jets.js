/* Les jets demandés par le joueur : ce qu'on trouve en cherchant bien, ce qu'on lit sur un visage,
   ce qu'un personnage confie quand on a su le prendre. Le moteur s'en sert quand le scénario n'a rien prévu. */
(function (G) {
  'use strict';
  var CH = G.CHAPTERS || {}, L = CH.londres, PR = CH.prologue || G.SCENE;
  function brule(api) { return api.s.min >= 2820; }
  function set(sc, id, k, v) { if (sc && sc.fiches && sc.fiches[id]) sc.fiches[id][k] = v; }

  var SOCIAL = {
    Persuasion: { ok: ['Vos arguments portent. En face de vous, on hésite, puis on cède un peu.', 'Vous trouvez les mots justes, posément. La méfiance tombe d’un cran.'], ko: ['Vos arguments glissent sans prise. On vous écoute poliment, et c’est tout.', 'Ça ne prend pas. Vous avez trop insisté, et ça se voit.'] },
    Baratin: { ok: ['Votre histoire passe comme une lettre à la poste. On vous croit, et même un peu plus que ça.'], ko: ['Votre histoire sonne faux. Un silence, un regard : on n’y croit pas une seconde.'] },
    Charme: { ok: ['Un sourire, le bon mot au bon moment : on se détend en face de vous.', 'Le courant passe. On se surprend à vous parler comme à une vieille connaissance.'], ko: ['Votre sourire tombe à plat. On vous trouve, au mieux, un peu insistant{e}.'] },
    Intimidation: { ok: ['Votre voix baisse, votre regard se durcit. On a peur de vous, maintenant, et on parle.'], ko: ['On ne se laisse pas impressionner. Pire : on se méfie de vous, désormais.'] },
    'Crédit': { ok: ['Votre nom, votre mise, votre assurance : on vous traite enfin en personne de qualité.'], ko: ['Votre rang ne pèse rien ici. On vous le fait sentir.'] }
  };

  // ================================================================ Londres
  if (L) {
    L.jets = {
      social: SOCIAL,
      idee: function (api) {
        var c = (L._conseils || []).filter(function (k) { try { return k.cond(api); } catch (e) { return false; } })[0];
        return c ? { x: c.x } : null;
      },
      lieux: {
        institut: { toc: ['Sous une table, une carte d’invitation tombée d’une poche, au nom d’un baronet qui n’est pas venu. Un serveur la ramasse avant vous.', 'Les rideaux de velours sont reprisés en trois endroits. L’Empire, de près, s’use comme le reste.'], ecouter: ['Des bribes : un amiral qui parle de Jutland, une dame qui trouve Smith « un peu vulgaire », un jeune homme qui parie qu’il ne passera pas l’année.'] },
        hotel: { toc: ['Dans le tiroir de la table de nuit, une bible et un indicateur des chemins de fer de 1911, annoté au crayon par un client oublié.', 'Une brûlure de cigarette sur le rebord de la fenêtre, et, gravées dessous, deux initiales et une date : 1916.'], ecouter: ['Le radiateur cogne, la chambre voisine ronfle, l’ascenseur grince. Et, plus bas, la voix de Mr Pratt qui dicte un télégramme.'] },
        cheapside: { toc: function (api) { return api.flag('demasque') ? ['Sous le lit calciné, une épingle de cravate en or, tordue par la chaleur.', 'Sur le rebord de la fenêtre, une traînée grasse, comme si quelqu’un s’y était hissé sans précaution.'] : ['Le papier peint se décolle par plaques ; dessous, un autre papier, plus ancien, à motif de lierre.', 'Une odeur douceâtre flotte sous celle de la suie. On a brûlé de l’encens pour la couvrir.']; }, ecouter: ['La rue, le marché, une charrette. Et dans la pièce, une respiration sifflante, régulière, qui ne s’arrête jamais tout à fait.'] },
        chelsea: { toc: ['Le registre est ouvert à la bonne page ; quelqu’un a passé le doigt sur la ligne des trois Turcs si souvent que l’encre a bavé.', 'Au pied de l’escalier, du sel répandu en ligne droite. Superstition de la femme de chambre, sans doute.'], ecouter: ['Au-dessus, le troisième étage est silencieux. Trop silencieux pour un hôtel.'] },
        yard: { toc: ['Sur un banc, un journal oublié, plié à la page des faits divers. Quelqu’un a entouré au crayon le mot « Turcs ».', 'Un tableau noir couvert de noms de rues, à moitié effacé. Chelsea y figure deux fois.'], ecouter: ['Un sergent râle contre le brouillard, un autre contre les journaux. Le nom de Fleming revient souvent, et jamais avec tendresse.'] },
        ambassade: { toc: ['Sous le portrait poussiéreux, un rectangle plus clair sur le papier peint : on a décroché un autre portrait, récemment.', 'Une tasse de café turc refroidit sur un guéridon. Le marc dessine une spirale.'], ecouter: ['Derrière une porte, deux voix en turc, basses et rapides. Le ton d’une dispute qu’on veut garder discrète.'] },
        islington: { toc: ['Le volet de la boutique a été forcé puis remis en place avec soin. Les éraflures sont fraîches.', 'Dans le caniveau, une étiquette de colis à moitié dissoute : « …ryat, Brophy Lane ».'], ecouter: ['Le marché, les cris des marchands. Et, quand le vent tourne, le grincement d’une enseigne qui n’a plus personne à annoncer.'] },
        boutique: { toc: ['Derrière le comptoir, la poussière dessine le contour d’un objet long et étroit qu’on a emporté.', 'Un carnet de reçus dont on a arraché les dernières pages. Le crayon a marqué la feuille suivante : un chiffre, « 1 £ ».'], ecouter: ['Le plancher craque sous vos pas, puis, une seconde trop tard, au fond de la boutique.'] },
        musee: { toc: ['Au rang K, une place vide, la lampe éteinte. Le lecteur qui s’y asseyait n’est pas revenu depuis une semaine.', 'Sur le bureau du conservateur, une pile de fiches de prêt en retard, la plus haute au nom du professeur J. A. Smith.'], ecouter: ['Des pages qu’on tourne, une toux étouffée, le grattement des plumes. Et le « chut » du conservateur, toutes les quatre minutes, réglé comme une horloge.'] },
        stoke: { toc: ['Les rideaux de toute la rue sont tirés, sauf un : celui de Mrs Atkins, qui guette les visiteurs à six pence.', 'Une affiche de la police, décolorée par la pluie : on recherche quiconque aurait aperçu Henry Stanley.'], ecouter: ['Un piano mal accordé, deux maisons plus loin, qui joue toujours le même air.'] },
        chambre_stanley: { toc: ['Au mur, des gravures de locomotives, toutes de travers, comme si quelque chose les avait secouées d’un coup.', 'Sous l’oreiller, un carnet d’horaires de chemin de fer, cornés à des pages qui ne correspondent à aucune ligne existante.'], ecouter: ['Rien. Puis, à la limite de l’audible, un sifflet très lointain, que la rue ne peut pas expliquer.'] },
        camberwell: { toc: ['Sur la cheminée, la cloche de locomotive est fêlée. Une étiquette dit : « Rugby, 1897 ».', 'Les gravures du salon sont parfaitement alignées. Sauf une, retournée face au mur.'], ecouter: ['Sous la maison, le grondement régulier du métro. Et, entre deux rames, autre chose : un cliquetis métallique, en bas.'] },
        cave: { toc: ['Sur l’établi, des outils d’horloger rangés avec un soin maniaque. L’un d’eux est couvert de suie.', 'Les rails du grand circuit sont polis comme si on y faisait rouler des trains toutes les nuits.'], ecouter: ['La cave est silencieuse. Si silencieuse que vous entendez la maquette refroidir, ou chauffer, vous ne savez pas.'] },
        wagon1: { toc: ['Les sièges de velours ont gardé la forme de ceux qui s’y sont assis. Certaines formes ne sont pas humaines.'], ecouter: ['Le roulement du train. Mais le rythme est faux : il manque un temps, toujours le même.'] },
        wagon2: { toc: ['Dans le filet à bagages, un billet de 1897, poinçonné à Liverpool. L’encre est encore fraîche.'], ecouter: ['Quelqu’un pleure, quelque part en avant. Un enfant, ou quelque chose qui imite un enfant.'] },
        retour: { toc: ['Par la vitre, des haies anglaises, des clochers. Et le reflet de votre visage, qui met un instant de trop à suivre vos mouvements.'], ecouter: ['Le sifflet de la locomotive, enfin normal. Vous ne vous étiez pas rendu compte à quel point il ne l’était pas.'] },
        campagne: { toc: ['Dans l’herbe gelée, deux sillons parallèles qui commencent nulle part et s’arrêtent net.'], ecouter: ['Des corbeaux. Un chien, très loin. Et le silence des champs, énorme, après le vacarme du train.'] },
        victoria: { toc: ['Au quai 8, un panneau d’horaires où l’on a corrigé à la main l’heure du train du ferry.', 'Un porteur vous dévisage, puis détourne les yeux. Vous avez une tête à avoir des bagages, et pas de bagages.'], ecouter: ['Des annonces, des sifflets, des adieux. Et, quelque part, une voix qui prononce votre nom. Puis plus rien.'] },
        stjohn: { toc: function (api) { return brule(api) ? ['Dans les cendres du perron, une clé noircie, tordue, que la police n’a pas ramassée.', 'Les pigeons de Beddows sont revenus. Ils tournent au-dessus des ruines, sans trouver où se poser.'] : ['Les volets du bureau sont fermés en plein jour, et on les a cloués de l’intérieur.', 'Au fond du jardin, un pigeonnier impeccable. Onze pigeons, et un perchoir vide.']; }, ecouter: function (api) { return brule(api) ? ['Les poutres craquent en refroidissant. On dirait que la maison soupire.'] : ['Une pendule, à l’intérieur, qui sonne avec une minute d’avance sur toutes les autres de la rue.']; } },
        archives: { toc: ['Entre deux volumes reliés, une coupure glissée là par un archiviste distrait : une annonce de médium, datée de 1919.', 'Les volumes de 1897 sont plus usés que les autres. Quelqu’un les a beaucoup consultés.'], ecouter: ['Les rotatives, à l’étage du dessous, font trembler les étagères. Les archives entières vibrent comme un ventre.'] }
      },
      text: {}
    };
    var F = L.fiches || {};
    var PSY = {
      smith: 'Derrière la bonne humeur, une vraie peur. Il guette la salle par-dessus votre épaule, comme un homme qui attend quelqu’un et espère qu’il ne viendra pas.',
      beddows: function (api) { return api.flag('cheapsideVu') ? 'Une terreur physique, qui ne joue pas la comédie. Mais ce n’est pas pour son maître qu’il a peur : c’est de lui. Ses yeux reviennent sans cesse vers le lit.' : 'Inquiet pour son maître, sincèrement. Et autre chose : il retient une phrase depuis le début, sans oser la dire.'; },
      fleming: 'Épuisé, honnête, et beaucoup moins sûr de lui qu’il ne le montre. Il vous jauge autant que vous le jaugez, et il sait des choses qu’il ne donnera pas sans contrepartie.',
      rigby: 'Il ne croit pas à la culpabilité du domestique. Ça se lit dans la façon dont il prononce « suspect », du bout des lèvres.',
      chelseaclerk: 'Il a raconté son histoire cent fois, et l’enjolive un peu plus à chaque fois. Mais sa peur du troisième étage, elle, n’a rien de joué.',
      mustapha: 'Il porte un deuil sincère, et une honte qu’il cache sous la politesse. Il voudrait parler. Il attend qu’on lui en donne une bonne raison.',
      voisin: 'Il en sait plus qu’il n’en dit, et il aimerait qu’on le lui demande avec quelques pièces.',
      atkins: 'Elle exploite le malheur avec une candeur désarmante. Mais elle a peur, la nuit, et ce n’est pas du théâtre.',
      sergent: 'Il s’accroche à l’idée que Stanley a organisé sa disparition. Pas parce qu’il y croit : parce que l’autre possibilité l’empêcherait de dormir.',
      butter: 'Jovial en surface. Mais dès qu’on approche de la maquette, sa voix monte d’un ton. Il voudrait qu’on l’en débarrasse.',
      alexis: 'Il ment. Pas tout le temps, mais il ment. Derrière la fièvre, quelque chose calcule, froidement.',
      stanley: 'Il est sincère. Terrifié, épuisé, et sincère. Il n’a plus la force de mentir.',
      bibliothecaire: 'Rigide, mais pas hostile. Il respecte ceux qui respectent les livres, et méprise tous les autres avec la même application.',
      concierge: 'Un homme qui sait tout de ses clients, et qui adore qu’on le sache. Un pourboire bien placé lui délierait la langue.',
      agentsj: 'Un gamin gelé, qui s’ennuie et qui a un peu peur. Il ne demande qu’à bavarder.',
      laitier: 'Il a vu quelque chose, la nuit de l’incendie, et ça le travaille. Il n’attend qu’une oreille.',
      pike: 'Revêche, mais fière de son travail. Admirez ses archives, et elle vous ouvrira tout.'
    };
    var CONF = {
      smith: ['« Entre nous… je reçois des lettres depuis un mois. Des lettres que je ne montrerai pas à la police. S’il m’arrivait quelque chose, cherchez du côté des antiquaires. »'],
      beddows: function (api) { return api.flag('cheapsideVu') ? ['« La nuit, {m}, il ne dort pas. Il parle. Et ce n’est pas sa voix. » Il se tait, horrifié d’avoir parlé.'] : ['« Monsieur brûle des lettres sans les ouvrir, depuis un mois. Je les ramasse dans la cheminée. Sur l’une, il restait un timbre turc. »']; },
      fleming: ['« Officieusement ? Les trois hommes du Chelsea Arms avaient reçu un télégramme de Paris, signé d’une seule lettre. M. Ne me faites pas regretter de vous l’avoir dit. »'],
      rigby: ['« Entre nous, je ne crois pas que le domestique ait mis le feu. Un homme qui fuit ne prend pas le temps d’arroser méthodiquement un bureau d’essence. »'],
      chelseaclerk: ['« Ce que j’ai pas dit aux flics : cette nuit-là, longtemps après que les trois sont montés, j’ai entendu marcher au troisième. Un pas traînant. Et personne n’est jamais redescendu. »'],
      mustapha: ['« Entre nous, docteur : mon gouvernement voudrait que cette affaire disparaisse des journaux. Moi, je voudrais qu’on trouve le coupable. Ce n’est pas la même chose. »'],
      voisin: ['« Le vieux d’à côté, l’antiquaire ? Il recevait des visites, la nuit. Des gens qui frappaient trois coups. Toujours trois. »'],
      atkins: ['« M. Stanley, la dernière semaine, il parlait tout seul, la nuit. Il comptait. Comme on compte les gares. »'],
      sergent: ['« Trente ans de métier. Les gens qui disparaissent laissent toujours quelque chose : une dette, une femme, une lettre. Stanley n’a rien laissé. Ça m’empêche de dormir. »'],
      butter: ['« Je ne l’ai pas dit à la police : la nuit, quand je descends à la cave, la maquette n’est jamais tout à fait à l’endroit où je l’ai laissée. »'],
      alexis: ['« Un secret, puisque vous êtes gentil : on peut descendre de ce train. Mais jamais les mains vides. »'],
      stanley: ['« Dites à M. Butter que je regrette. Et dites à Mrs Atkins que le loyer est sous le parquet, près du radiateur. »'],
      bibliothecaire: ['« Le professeur Smith a passé ses trois dernières semaines au rang K. Toujours les mêmes volumes : des histoires de trains, et un vieux traité qu’il avait fait sortir de la réserve. »'],
      concierge: ['« Puisque vous me le demandez si aimablement, {m} : en vingt-cinq ans, je n’avais jamais vu les clients fermer leur porte à double tour. Cette semaine, tous le font. »'],
      agentsj: ['« Je vais vous dire, {m} : j’ai pas envie de rester ici cette nuit. Les ruines craquent, et ce matin, la cendre avait bougé, comme si quelqu’un avait marché dedans. »'],
      laitier: ['« Je l’ai dit à personne, mais ce soir-là, avant le feu, j’ai vu quelqu’un sortir par-derrière avec le manteau de M. Beddows. Il marchait pas comme lui. »'],
      pike: ['« J’ai un faible pour les affaires que personne n’a résolues. L’express de Liverpool de 97, j’ai toujours pensé que la police avait mal cherché. »']
    };
    // ce qu'une fausse identité, une fois crue, fait dire aux gens
    var ROLES = {
      atkins: { presse: '« La presse ! Enfin quelqu’un de sérieux. Écrivez bien « Mrs Atkins », avec un s. » Elle baisse la voix. « M. Stanley avait acheté un train miniature, la semaine d’avant. Il le montrait à tout le monde. Il disait qu’il n’en aurait jamais de plus beau. Il avait raison, le pauvre. »', police: '« Encore la police ? J’ai tout dit à votre sergent. Mais pour vous, je recommence, mon chou : la fumée, le grondement, et plus personne. »', medecin: '« Un docteur ! Vous allez me dire que c’est la combustion spontanée, vous aussi ? Pour la science, je vous fais la chambre à quatre pence. »' },
      chelseaclerk: { police: '« Encore la police ? Bon. Je redis ce que j’ai dit à vos collègues : arrivés séparément, chacun sa valise, et tous les trois voulaient la même chambre. La 14. Ils se parlaient pas. »', presse: '« Un journaliste ? Le patron veut pas que je parle aux journaux. » Il regarde autour de lui. « Mais si vous mettez pas mon nom : ils avaient peur, tous les trois. Ils fermaient à double tour, en plein jour. »' },
      voisin: { police: '« La police ? Bon. Le vieux d’à côté, ça fait des jours qu’on l’a pas vu. Le volet a été forcé, et c’est pas moi qui vais aller voir ce qu’il y a derrière. »', presse: '« Un journaliste ? Les renseignements, ça se paie, dans le quartier. »' },
      laitier: { police: '« Je l’ai dit au jeune, là, votre agent : ce soir-là, avant le feu, j’ai vu quelqu’un sortir par-derrière avec le manteau de M. Beddows. Mais il marchait pas comme lui. »', presse: 'Il se recoiffe avec les doigts. « Dans le journal ? Moi ? Tom Haskins, de la United Dairies. Mettez que j’ai tout vu. Enfin… presque tout. »' },
      agentsj: { police: '« Ah, vous êtes du Yard ? Pardon, {m}, on m’avait pas prévenu. Le sergent Rigby a dit : essence, et personne dans la maison. C’est tout ce que je sais, juré. »', presse: '« Pas de journalistes, {m}. Ordre du sergent Rigby. » Il hésite. « Mais si vous parlez de moi, mettez que j’ai pas bougé de la nuit. »' },
      sergent: { police: '« Du Yard ? On m’a rien dit, comme d’habitude. Bon. Entre collègues : pas de dettes, pas de femme, pas d’ennemis. Juste des trains. Et une chambre pleine de suie. »', presse: '« Les journalistes, je leur dis rien. Lisez le rapport, comme tout le monde. »' },
      mustapha: { police: '« La police anglaise ? Alors vous savez déjà tout ce que je pourrais vous dire, et vous n’avez nul besoin de moi. »', diplomate: '« Un collègue ? De quelle chancellerie, je vous prie ? » Il attend la réponse, poliment. Trop poliment.', presse: '« La presse ? Je n’ai aucune déclaration à faire. Mon gouvernement non plus. »' },
      concierge: { police: '« La police, {m} ? Dans ce cas, je n’ai rien vu, rien entendu, et votre note est réglée jusqu’à vendredi. » Il sourit. « Ce qui est d’ailleurs la vérité. »', presse: '« La presse, {m} ? Ici, nous ne parlons jamais de nos clients. Sauf à ceux qui savent remercier. »' },
      butter: { presse: '« Un journaliste ! Vous écrirez un mot sur l’Association ? Nous avons tellement besoin de nouveaux membres. »', police: '« Encore la police ? J’ai déjà montré la maquette à votre collègue. Il n’y connaissait rien. Rien du tout. »' },
      bibliothecaire: { savant: '« Un universitaire ? Vous n’avez pourtant pas l’air de quelqu’un qui corne les pages. Soit. »', police: '« La police, dans la salle de lecture ? Parlez moins fort, au moins. »' },
      pike: { presse: '« Un confrère du Courier ? Je ne vous ai jamais vu. » Elle plisse les yeux. « Bon. Les archives sont à tout le monde, ici, du moment qu’on range. »', police: '« La police ? Il vous faut la permission du rédacteur en chef. Ou un sourire, à la rigueur. »' },
      fleming: { presse: '« Un journaliste ? Alors vous n’aurez rien. Lisez les communiqués, comme vos confrères. »' },
      rigby: { presse: '« Un journaliste ? Je dis rien aux journaux. Enfin… le feu est parti du bureau. Ça, tout le monde le sait déjà. »' },
      beddows: { medecin: '« Un médecin ! Dieu soit loué. Monsieur ne veut voir personne, mais un médecin, il ne pourra pas le refuser. »', police: '« La police ? Non… Monsieur ne veut pas de la police. Je vous en supplie, {m}. »' }
    };
    Object.keys(ROLES).forEach(function (id) { set(L, id, 'roles', ROLES[id]); });
    set(L, 'smith', 'connait', true); set(L, 'smith', 'connaitLine', ['« Allons, mon cher, je vous connais depuis vingt ans ! Gardez vos déguisements pour les médiums. »']);
    set(L, 'beddows', 'connait', true); set(L, 'beddows', 'connaitLine', ['« Pardon, {m}… Je vous connais. Vous êtes un ami de Monsieur. »']);
    Object.keys(PSY).forEach(function (id) { set(L, id, 'psy', PSY[id]); });
    Object.keys(CONF).forEach(function (id) { set(L, id, 'confie', CONF[id]); });
  }

  // ================================================================ le prologue
  if (PR) {
    PR.jets = {
      social: SOCIAL,
      idee: function (api) {
        var x = !api.has('NOTE7') ? 'La table de Ravel est restée telle quelle. Le cendrier, surtout : on y a brûlé quelque chose.'
          : !api.has('SERVEUR') ? 'Le serveur était là toute la soirée. Il a forcément vu qui est venu chercher Ravel.'
          : !api.has('VEUVE') ? 'La vieille dame en noir n’a pas quitté sa table de la soirée. Elle a tout vu, et elle aime parler.'
          : !api.has('CONDUCTEUR') ? 'Le conducteur des voitures-lits connaît chaque compartiment et chaque passager.'
          : 'Le compartiment 7. Tout ramène au compartiment 7.';
        return { x: x };
      },
      lieux: {
        restaurant: { toc: ['Sous la table voisine, une allumette suédoise, d’une marque qu’on ne vend qu’en Suisse.', 'Sur la vitre, du côté de la table de Ravel, une trace de doigt mouillée qui ne sèche pas.'], ecouter: ['Le cliquetis des verres, le vacarme des rails. Et, sous le plancher, un bruit d’eau qui ne devrait pas être là.'] },
        couloir: { toc: ['Le soufflet de cuir est trempé à hauteur de main, comme si quelqu’un s’y était tenu avec des doigts ruisselants.'], ecouter: ['Le vent hurle entre les deux voitures. Entre deux rafales, un clapotis.'] },
        lits: { toc: ['Sur la moquette du couloir, l’usure dessine une piste qui mène tout droit au 7, plus sombre que le reste.'], ecouter: ['Des ronflements, une toux, une montre qui tictaque derrière une porte. Rien derrière celle du 7. Rien du tout, et c’est pire.'] },
        compartiment: { toc: ['Le lavabo est plein jusqu’au bord. L’eau est trouble, et quelque chose y a laissé des filaments verts.'], ecouter: ['Un égouttement, lent, régulier. Il vient de partout à la fois.'] }
      },
      text: {}
    };
    var PSYP = {
      serveur: 'Il a peur. Il a vu quelque chose ce soir, et il voudrait ne pas l’avoir vu. L’argent qu’il a reçu lui brûle la poche.',
      veuve: 'Elle s’ennuie, c’est vrai. Mais elle observe tout, et rien de ce qui s’est passé dans ce wagon ne lui a échappé.',
      conducteur: 'Une peur superstitieuse, et sincère. Il se signe sans s’en rendre compte chaque fois qu’on parle du 7.'
    };
    var CONFP = {
      serveur: ['« Je vais dire à monsieur une chose que je n’ai pas dite au chef de train : la carafe de M. Ravel sentait l’étang. Je l’ai changée trois fois. Trois fois, monsieur. »'],
      veuve: ['« Je vais vous confier une chose, jeune homme : depuis Dijon, mon tarot ne sort plus que des cartes d’eau. La Lune, l’Étoile, et la Lune encore. »'],
      conducteur: ['« Je vous le dis à vous, monsieur : la moquette devant le 7, je l’ai épongée deux fois. L’eau revient. Et elle est froide comme au fond d’un lac. »']
    };
    var ROLESP = {
      serveur: { police: function (api) { api.clue('SERVEUR'); return 'Bastien blêmit. « La police, monsieur ? Je… je n’ai rien fait de mal. Un homme en gris est venu chercher M. Ravel. Il m’a donné cent francs pour que j’oublie. Il avait la peau d’un noyé, monsieur. Ils sont partis vers le 7. »'; } },
      conducteur: { police: function (api) { api.clue('CONDUCTEUR'); return '« La police ? Madonna, je n’ai rien fait ! Le signor Ravel est rentré au 7 il y a une demi-heure, avec son ami, le grand. Il y avait de l’eau sur le tapis. Je leur ai dit, ils m’ont pas répondu. »'; } },
      veuve: { police: '« La police ? Enfin quelqu’un qui va s’occuper de cet homme en gris. Il sentait la vase, jeune homme. La vase ! »' }
    };
    Object.keys(ROLESP).forEach(function (id) { set(PR, id, 'roles', ROLESP[id]); });
    Object.keys(PSYP).forEach(function (id) { set(PR, id, 'psy', PSYP[id]); });
    Object.keys(CONFP).forEach(function (id) { set(PR, id, 'confie', CONFP[id]); });
  }
})(typeof window !== 'undefined' ? window : globalThis);
