/* Chapitre 1 — Le wagon-restaurant. Scénario original pour le prototype. */
(function (G) {
  'use strict';

  var SERVIETTE = 'La serviette de Ravel';
  var MANCHETTE = 'Le bouton de manchette gravé « A.R. »';

  function servLine(api, x) { api.npc('serveur', x); }

  // ---------------------------------------------------------------------------
  // Le serveur lâche ce qu'il sait
  // ---------------------------------------------------------------------------
  function revealServeur(api, intro) {
    if (api.flag('serveurParle')) { servLine(api, '« Je vous ai tout dit, monsieur. Le 7. Et que Dieu me pardonne. »'); return; }
    api.flag('serveurParle', true);
    if (intro) servLine(api, intro);
    servLine(api, 'Il pose son verre et baisse la voix. « Un homme en gris est venu à la table de M. Ravel, vers vingt-deux heures quarante. Il ne s’est pas assis. Il lui a remis un billet. Puis il m’a donné cent francs pour que j’oublie son visage. »');
    servLine(api, 'Il déglutit. « Je n’ai pas pu l’oublier, monsieur. Il avait la peau d’un noyé qu’on vient de repêcher. Ils sont partis ensemble vers les voitures-lits. Le compartiment 7. Il gouttait, monsieur. Sur mon tapis. »');
    api.clue('SERVEUR');
  }
  function shut(api) { return api.npcs('serveur').shut; }
  function guardServ(fn) {
    return function (api, n, p) {
      if (shut(api)) { servLine(api, api.cycle('servShut', ['Il vous tourne le dos et range des verres qui n’en ont pas besoin.', '« Je dois servir, monsieur. »', 'Il fait mine de ne pas vous entendre.'])); return; }
      fn(api, n, p);
    };
  }

  // ---------------------------------------------------------------------------
  // Fin du chapitre : le compartiment 7
  // ---------------------------------------------------------------------------
  function finale(api) {
    if (api.flag('finale')) return;
    api.flag('finale', true);
    api.endTalk(false);
    api.say('Vous posez la main sur la poignée. Elle est glacée, et mouillée. La porte n’est pas verrouillée.');
    api.go('compartiment', true);
    api.fx('flicker');
    api.say('L’eau vous monte aux chevilles. La fenêtre du compartiment est grande ouverte et la pluie entre à l’horizontale. Anselme Ravel est assis sur la banquette, trempé, les yeux fixés sur le vide. Ses lèvres bougent.');
    api.say('Sur ses genoux, il serre une statuette de pierre verte : une chose accroupie, aux yeux trop nombreux, d’où l’eau coule sans s’arrêter.');
    api.npc('ravel', '« Il remonte, murmure-t-il sans vous voir. Sous le lac. Il remonte, Lucien, et il lui faut un train. »');
    api.say('Il n’y a personne d’autre dans le compartiment. Seulement, sur la vitre embuée, l’empreinte de longs doigts. Posés de l’extérieur.');
    api.check('san_final');
  }

  // Les autres compartiments : chacun a son voyageur. On frappe une fois, on se fait rabrouer ;
  // on insiste, et la porte s'entrouvre sur quelqu'un qui a vu ou entendu quelque chose, qui ramène vers le 7.
  var VOISINS = {
    1: ['Au 1, une voix d’homme vous menace du chef de gare, en anglais.',
        'Le 1 s’ouvre sur un major anglais en robe de chambre écossaise, la moustache en bataille. « Look here… » Il baisse la voix malgré lui. « Your neighbour, the chap at number seven. He opened his window at eleven. In this weather! The whole corridor smelled of pond water. Pond water, I tell you. »'],
    2: ['Au 2, un bébé se met à pleurer. Bravo.',
        'Une jeune mère entrebâille le 2, le bébé contre l’épaule, furieuse. Puis, plus bas : « Il ne pleure jamais, vous savez. Il a commencé quand le monsieur mouillé est passé dans le couloir. Il laissait des flaques. Il allait vers le 7, et il ne marchait pas comme on marche. »'],
    3: ['Au 3, une voix ensommeillée vous envoie au diable, en allemand.',
        'Un voyageur de commerce en maillot de corps ouvre le 3, ses échantillons de boutons empilés sur la couchette. « Ach, encore ! » Il se gratte la nuque. « Vous savez, depuis une heure, quelqu’un chante. Très bas. Pas une chanson, plutôt une prière, dans une langue que je ne connais pas. Ça vient du 7. »'],
    4: ['Au 4, la lampe s’éteint aussitôt sous la porte. Personne ne répond.',
        'Vous frappez encore au 4. Rien. Puis, collée à l’acajou de l’autre côté, une voix de femme, à peine un souffle : « Ne frappez pas au 7. Quoi que vous fassiez, ne frappez pas au 7. » Et la lampe reste éteinte.'],
    5: ['Au 5, rien. Puis un rire étouffé, et encore rien.',
        'Un jeune couple entrebâille le 5, rouge jusqu’aux oreilles : des jeunes mariés. « On n’a rien entendu, monsieur, rien du tout ! » Elle lui donne un coup de coude. « Si, enfin… Quelqu’un a frappé au 7, avant vous. Trois coups. Et une voix a dit “Anselme”, depuis la fenêtre. Depuis dehors. »'],
    6: ['Au 6, une dame vous demande si c’est déjà Lausanne. Ce ne l’est pas.',
        'La dame du 6 rouvre, en bigoudis, ravie d’avoir de la compagnie. « Vous cherchez le monsieur à la caisse, peut-être ? Un antiquaire, il me l’a dit. Il a fait porter une caisse au 7, à Dijon. Lourde, lourde, et qui sentait la vase. Le porteur s’est lavé les mains trois fois. »'],
    8: ['Au 8, un ronflement s’interrompt, hésite, puis reprend.',
        'Le 8 s’ouvre sur un vieux prêtre en soutane, qui ne dormait pas du tout. Son chapelet lui a laissé des marques dans la paume. « Mon fils, je prie depuis Dole. Quelque chose a marché sur le toit du wagon. Jusqu’au-dessus du 7. Et ça ne pesait pas comme un homme. »']
  };
  function knock(n, api) {
    var v = VOISINS[n]; if (!v) return null;
    if (!api) return v[0];
    var k = api.count('porte' + n);
    if (k === 0) return v[0];
    if (k === 1) { api.flag('temoins', (api.flag('temoins') || 0) + 1); return v[1]; }
    return 'La porte ' + n + ' reste close. On a assez parlé, de l’autre côté.';
  }
  function autrePorte(api) {
    var essais = [1, 2, 3, 4, 5, 6, 8].filter(function (n) { return !api.flag('k' + n); });
    var n = essais.length ? essais[Math.floor(Math.random() * essais.length)] : [1, 2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 7)];
    api.flag('k' + n, true);
    return n;
  }

  var SCENE = {
    id: 'prologue',
    title: 'L’Express de minuit',
    chapter: 'Chapitre 1 — Le wagon-restaurant',

    investigator: {
      name: 'Lucien Arnaud', occupation: 'Journaliste à « La Gazette du Soir »', age: 34, origin: 'Paris',
      carac: { FOR: 45, CON: 60, TAI: 55, DEX: 60, APP: 55, INT: 75, POU: 60, EDU: 70 },
      pv: 11, pvMax: 11, pm: 12, pmMax: 12, san: 60, sanStart: 60, sanMax: 99, chance: 55, mvt: 8, impact: '0', carrure: 0,
      skills: {
        'Baratin': 45, 'Bibliothèque': 50, 'Charme': 40, 'Crédit': 30, 'Discrétion': 35, 'Écouter': 50, 'Esquive': 30,
        'Intimidation': 25, 'Langue (anglais)': 40, 'Mythe de Cthulhu': 0, 'Occultisme': 15, 'Persuasion': 45,
        'Premiers soins': 30, 'Psychologie': 55, 'Trouver Objet Caché': 55
      }
    },

    start: { loc: 'restaurant', min: 12, money: 42, inv: ['Le télégramme de Ravel', 'Un carnet et un crayon', 'Un étui à cigarettes'] },

    where: function (min) {
      if (min < 48) return 'Entre Dole et Vallorbe';
      if (min < 63) return 'Tunnel du Mont-d’Or';
      return 'Approche de Vallorbe';
    },

    phrases: [
      // frapper aux portes des voitures-lits : « au 4 », « encore », « j'insiste au 6 »…
      [/\binsist\w* (au|a la porte|devant le|devant la porte) ?(numero )?([1-8])\b/g, ' frappe porte $3 encore '],
      [/\brefrapp\w*/g, ' frappe porte encore '],
      [/\b(frapp\w*|toqu\w*|cogn\w*) (encore|plus fort|a nouveau|de nouveau|une deuxieme fois)\b/g, ' $1 porte encore '],
      [/\b(frapp\w*|toqu\w*|cogn\w*) (au|chez le|a la) ?(numero |porte )?([1-8])\b/g, ' $1 porte $4 '],
      [/\bwagon restaurant\b|\bvoiture restaurant\b|\bsalle a manger\b/g, ' wagonrestaurant '],
      [/\b(wagon|wagons|voiture|voitures) (lit|lits|couchette|couchettes)\b|\bwagonlit\b/g, ' wagonlits '],
      [/\bmaitre d hotel\b/g, ' maitredhotel '],
      [/\b(homme|type|monsieur|individu|mec|gars|bonhomme|personnage|silhouette|inconnu|grand) (en |au |a l )?(gris|manteau gris|costume gris|impermeable gris)\b/g, ' hommegris '],
      [/\bboutons? de manchettes?\b/g, ' manchette '],
      [/\btraces? de pas\b|\bempreintes? de pas\b/g, ' traces '],
      [/\bgrand mere\b|\bvieille dame\b|\bdame en noir\b|\bvieille femme\b/g, ' veuve '],
      [/\bporte a soufflet\b|\bporte du fond\b|\bporte du bout\b|\bporte vitree\b/g, ' soufflet '],
      [/\bporte de (l )?office\b|\bporte de (la )?cuisine\b|\bporte battante\b/g, ' cuisine '],
      [/\bpapiers? brules?\b|\bbout de papier\b|\bmorceau de papier\b/g, ' fragment '],
      [/\brendez vous\b/g, ' rendezvous '],
      [/\bl autre\b|\bun autre homme\b/g, ' autrex '],
      [/\b(numero|no|num|porte|compartiment|cabine|chambre) (7|sept)\b/g, ' compartiment n7 '],
      [/\bau (7|sept)\b|\ble (7|sept)\b/g, ' n7 '],
      [/\b(numero|no|num|porte|compartiment|cabine|chambre) ([1-8]|un|deux|trois|quatre|cinq|six|huit)\b/g, ' compartiment $2 '],
      [/\bpierre verte\b/g, ' statuette '],
      [/\bsous la table\b/g, ' table ']
    ],

    lexicon: function (L) {
      L.add('SALLE', 'n', 'salle, piece, alentours, autour, endroit, lieu, lieux, decor, ambiance, environs, voiture, wagon', { label: 'les lieux' });
      L.add('RESTAURANT', 'n', 'wagonrestaurant, restaurant, buvette', { label: 'le wagon-restaurant' });
      L.add('TABLE', 'n', 'table, tables, nappe, couvert, couverts, assiette, assiettes, chaise, chaises, place, banquette', { label: 'la table de Ravel' });
      L.add('VERRE', 'n', 'verre, cognac, ballon, alcool, martell, digestif', { label: 'le verre de cognac' });
      L.add('BOISSON', 'n', 'cafe, the, boisson, boissons, biere, vin, champagne, absinthe, whisky, chartreuse, tisane, liqueur, consommation, rhum, armagnac, calvados, grog, chocolat, infusion, aperitif, pastis', { label: 'une boisson' });
      L.add('SERVIETTE', 'n', 'serviette, dessin, croquis, griffonnage, gribouillis, gribouillage, symbole, symboles, spirale, encre, schema, motif, signe, cercles, yeux', { label: 'la serviette' });
      L.add('CENDRIER', 'n', 'cendrier, cendre, cendres, fragment, papier, papiers, megot, megots, braise, suie', { label: 'le cendrier' });
      L.add('FENETRE', 'n', 'fenetre, fenetres, vitre, vitres, carreau, dehors, exterieur, paysage, nuit, pluie, reflet, reflets, buee', { label: 'la fenêtre' });
      L.add('CUISINE', 'n', 'cuisine, office, cuisinier, chef, hublot, battante, fourneaux, cuistot', { label: 'la porte de l’office' });
      L.add('PORTE', 'n', 'porte, portes, issue, sortie', { label: 'la porte' });
      L.add('SOUFFLET', 'n', 'soufflet, couloir, passage, plateforme, intercirculation, vestibule, sas, coursive, accordeon, jonction', { label: 'la porte à soufflet' });
      L.add('WAGONLITS', 'n', 'wagonlits, couchette, couchettes, compartiments, cabines, dortoir, arriere, chambres, voitures', { label: 'les voitures-lits' });
      L.add('COMPARTIMENT', 'n', 'compartiment, cabine, chambre, numero', { label: 'les compartiments' });
      L.add('SEPT', 'n', 'n7', { label: 'le compartiment 7' });
      L.add('SERVEUR', 'n', 'serveur, garcon, maitredhotel, bastien, steward, personnel, employe, barman, comptoir, bar, serveuse, loufiat', { label: 'le serveur', npc: true });
      L.add('VEUVE', 'n', 'veuve, dame, femme, madame, vieille, vasseur, irene, passagere, mamie, aieule, voyageuse, mamy, duchesse, comtesse, baronne, rombiere', { label: 'la vieille dame', npc: true });
      L.add('CARTES', 'n', 'cartes, carte, tarot, reussite, patience, jeu, lames, arcane, arcanes, divination, voyance, cartomancie, lune, pendu, maisondieu', { label: 'le tarot' });
      L.add('CONDUCTEUR', 'n', 'conducteur, controleur, paolo, cheminot, strapontin, dormeur, endormi, casquette', { label: 'le conducteur', npc: true, sleeper: true });
      L.add('TRACES', 'n', 'traces, trace, empreintes, empreinte, flaque, flaques, eau, sol, plancher, tapis, moquette, mouille, mouillee, humide, sillage, ruisselant, goutte, gouttes, fuite, suintement, mare, aureole, tache, taches', { label: 'les traces mouillées' });
      L.add('MANCHETTE', 'n', 'manchette, bouton, boutons, bijou, jointure, jointures, fente, interstice, rainure, brillant, argente, rivets', { label: 'la jointure du plancher' });
      L.add('RAVEL', 'n', 'ravel, anselme, antiquaire, collectionneur, ami, client, rendezvous, contact, vendeur', { label: 'Ravel' });
      L.add('HOMMEGRIS', 'n', 'hommegris, gris, noye, compagnon, accompagnateur, visiteur, chapeau, manteau, impermeable', { label: 'l’homme en gris' });
      L.add('AUTREX', 'x', 'autrex', { label: 'l’autre' });
      L.add('NOTE', 'n', 'note, billet, mot, message, lettre, missive, pli, enveloppe', { label: 'le message' });
      L.add('TELEGRAMME', 'n', 'telegramme, depeche, telegraphe, convocation', { label: 'le télégramme' });
      L.add('STATUETTE', 'n', 'statuette, statue, idole, figurine, sculpture, relique, artefact, objet', { label: 'la statuette' });
      L.add('BERTIN', 'n', 'bertin, confrere, collegue, charenton, asile', { label: 'Bertin' });
      L.add('TRAIN', 'x', 'train, voyage, trajet, lausanne, dole, vallorbe, milan, paris, destination, meteo, neige, arrivee, gare, frontiere, suisse, compagnie, express, locomotive, rails, tunnel', { label: 'le voyage' });
      L.add('LAC', 'x', 'lac, leman, chillon, geneve, profondeurs, fond, noyade, noyes, abysse, abysses, poisson, poissons, vase, iode, algues, marecage, etang, etangs', { label: 'le lac' });
      L.add('LAMPE', 'n', 'lampe, lampes, lumiere, lumieres, abatjour, eclairage, plafonnier, veilleuse, veilleuses', { label: 'les lampes' });
      L.add('MARQUETERIE', 'n', 'marqueterie, panneaux, panneau, decoration, cygnes, cygne, boiseries, acajou, ebeniste', { label: 'la marqueterie' });
    },

    clues: {
      SYMBOLE: { title: 'La serviette de Ravel', text: 'Une spirale entourée de sept petits cercles, comme des yeux, et ces mots : « il remonte ».' },
      NOTE7: { title: 'Le billet brûlé', text: '« …partiment 7… à minuit… seul… », d’une écriture penchée qui n’est pas celle de Ravel.' },
      SERVEUR: { title: 'Le témoignage de Bastien', text: 'Un homme en gris, à la peau de noyé, a payé le serveur. Il est parti avec Ravel vers le compartiment 7.' },
      VEUVE: { title: 'Le témoignage de Mme Vasseur', text: 'Ravel parlait une langue « mouillée ». L’homme en gris ruisselait et sentait le fond des étangs.' },
      TRACES: { title: 'Les traces mouillées', text: 'Des empreintes gorgées d’eau naissent au milieu du soufflet et mènent aux voitures-lits.' },
      MANCHETTE: { title: 'Le bouton de manchette', text: 'En argent, gravé « A.R. ». Ravel est passé par le soufflet, et pas de son plein gré.' },
      CONDUCTEUR: { title: 'Le témoignage du conducteur', text: 'Ravel est rentré au 7 avec un grand homme qui marchait « comme s’il avait les poumons pleins ».' }
    },

    // -------------------------------------------------------------------------
    // Jets de dés
    // -------------------------------------------------------------------------
    checks: {
      toc_cendrier: {
        skill: 'Trouver Objet Caché', why: 'déchiffrer ce qui reste dans les cendres',
        push: 'Vous pourriez insister : étaler les cendres sur la nappe, une à une, au risque de réduire en poussière ce qui reste.',
        resolve: function (api, r) {
          if (r.success) {
            api.say('Parmi les cendres, un fragment a résisté. Une écriture penchée, trop régulière, qui n’est pas celle de Ravel : « …partiment 7… à minuit… seul… »');
            if (r.level >= 4) api.say('Le papier sent l’iode, comme une plage à marée basse.');
            api.clue('NOTE7'); api.flag('cendrier', 'ok');
          } else if (r.level === 0) {
            api.say('Votre manche accroche le cendrier, qui se renverse. Les cendres s’éparpillent sur la nappe et sur le tapis. Le serveur soupire bruyamment.');
            api.npcs('serveur').att -= 1; api.flag('cendrier', 'detruit');
          } else if (r.pushed) {
            api.say('Le fragment se désagrège entre vos doigts. Il ne reste qu’un peu de suie, et un chiffre, peut-être un 7, qui disparaît sous votre souffle.');
            api.flag('cendrier', 'detruit');
          } else {
            api.say('Des cendres, rien que des cendres, qui s’effritent sous vos doigts.');
            api.flag('cendrier', 'rate');
          }
        }
      },
      ecouter_resto: {
        skill: 'Écouter', why: 'distinguer quelque chose sous le vacarme',
        resolve: function (api, r) {
          if (r.success) {
            api.say('Sous le roulement des boggies et le claquement des cartes de la vieille dame, vous distinguez autre chose : un ruissellement régulier, qui vient de l’autre côté de la porte à soufflet.');
            api.flag('entenduEau', true);
          } else api.say('Le fracas du train, des verres qui tintent, une toux au loin. Rien d’autre.');
        }
      },
      psy_serveur_obs: {
        skill: 'Psychologie', why: 'lire ce que cache le serveur',
        resolve: function (api, r) {
          if (r.success) {
            api.say('Il évite soigneusement de regarder la table de Ravel. Ses mains tremblent sur le torchon. Cet homme a peur, et il a honte d’avoir peur.');
            api.flag('serveurNerveux', true);
          } else api.say('Un serveur fatigué, rien de plus. Du moins, c’est ce qu’il veut que vous voyiez.');
        }
      },
      psy_serveur_talk: {
        skill: 'Psychologie', why: 'savoir s’il dit la vérité',
        resolve: function (api, r) {
          if (r.success) {
            api.say('Il ment. Pas par vice : par peur. Quelqu’un l’a payé pour se taire, et ce quelqu’un l’effraie bien plus que vous.');
            api.flag('serveurMent', true);
          } else api.say('Impossible de lire quoi que ce soit sur ce visage de maître d’hôtel. Dix-sept ans de métier.');
        }
      },
      pers_serveur: {
        skill: 'Persuasion', why: 'le convaincre de parler',
        push: 'Vous pourriez insister : lui décrire ce qui pourrait arriver à Ravel, quitte à le braquer pour de bon.',
        resolve: function (api, r) {
          if (r.success) revealServeur(api, 'Il regarde longtemps la table vide. « Vous avez raison, monsieur. Si quelque chose lui arrive… »');
          else if (r.pushed) {
            servLine(api, '« Monsieur, si vous continuez, j’appelle le chef de train. » Il vous tourne le dos.');
            api.npcs('serveur').shut = true;
          } else servLine(api, 'Il secoue la tête. « Je n’ai rien à ajouter, monsieur. » Mais ses mains tremblent toujours.');
        }
      },
      charme_serveur: {
        skill: 'Charme', why: 'le mettre dans votre poche',
        resolve: function (api, r) {
          if (r.success) revealServeur(api, 'Pour la première fois, il sourit. « Monsieur a de la conversation. C’est rare, à cette heure. Bon. »');
          else { servLine(api, '« Monsieur est trop aimable. » Le ton est glacial.'); api.npcs('serveur').att -= 1; }
        }
      },
      baratin_serveur: {
        skill: 'Baratin', why: 'qu’il avale votre histoire',
        resolve: function (api, r) {
          if (r.success) revealServeur(api, 'Il pâlit. « La police ? Je… Je ne veux pas d’ennuis, monsieur l’inspecteur. »');
          else { servLine(api, 'Il vous détaille de la tête aux pieds. « Les inspecteurs que je connais ont les souliers mieux cirés, monsieur. »'); api.npcs('serveur').att -= 1; }
        }
      },
      intim_serveur: {
        skill: 'Intimidation', why: 'lui faire plus peur que l’homme en gris',
        resolve: function (api, r) {
          if (r.success) revealServeur(api, 'Vous l’attrapez par le gilet. Il se décompose. « D’accord ! D’accord, monsieur… »');
          else {
            servLine(api, '« Lâchez-moi ! » Les têtes se tournent. La vieille dame claque la langue. Bastien rajuste son gilet et ne vous regarde plus.');
            var st = api.npcs('serveur'); st.att -= 3; st.shut = true; api.flag('serveurMenace', true);
          }
        }
      },
      toc_couloir: {
        skill: 'Trouver Objet Caché', why: 'trouver quelque chose entre les jointures',
        push: 'Vous pourriez insister : glisser les doigts dans la jointure du plancher, là où la tôle est coupante.',
        resolve: function (api, r) {
          if (r.success) {
            api.say('Coincé dans une jointure, un éclat d’argent : un bouton de manchette gravé « A.R. ». Celui de Ravel. On ne perd pas un bouton de manchette en marchant. On le perd en se débattant.');
            api.take(MANCHETTE); api.clue('MANCHETTE'); api.flag('couloirFouille', 'ok');
          } else if (r.pushed) {
            api.say('La tôle vous entaille la main. Une goutte de sang tombe dans l’eau du plancher et reste là, ronde, sans se mélanger.');
            api.hp(-1); api.flag('couloirFouille', 'rate');
          } else { api.say('De la tôle froide, de l’eau, des rivets. Rien.'); api.flag('couloirFouille', 'rate'); }
        }
      },
      ecouter_lits: {
        skill: 'Écouter', why: 'entendre ce qui se passe derrière les portes',
        resolve: function (api, r) {
          if (r.success) { api.say('Derrière la porte 7, une voix murmure toujours les mêmes syllabes, mouillées, gutturales. Et sous la voix, un clapotis, comme de l’eau qui monte.'); api.flag('see7', true); }
          else api.say('Des ronflements, le grincement des boiseries. Rien de net.');
        }
      },
      san_fenetre: {
        skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d3'], why: 'garder votre sang-froid',
        resolve: function (api, r) {
          if (r.success) api.say('Un reflet, une lampe, la fatigue. Vous vous le répétez, et ça marche presque.');
          else api.say('Vous reculez d’un pas, le cœur battant. Ce visage avait la bouche ouverte, comme quelqu’un qui crie sous l’eau.');
        }
      },
      san_eau: {
        skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'chasser la vision',
        resolve: function (api, r) {
          if (r.success) api.say('Vous rouvrez les yeux. Le soufflet, la tôle, la pluie. Vous vous essuyez les lèvres du revers de la main, longtemps.');
          else api.say('Vous rouvrez les yeux, mais l’œil, lui, ne s’est pas refermé. Vous le sentez encore, quelque part sous vos pieds, sous les rails, sous la terre.');
        }
      },
      san_tarot: {
        skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'ne pas y croire',
        resolve: function (api, r) {
          if (r.success) api.npc('veuve', '« Vous ne me croyez pas. C’est bien. Ceux qui me croient dorment mal. »');
          else api.npc('veuve', 'Elle range la carte très vite. « Vous me croyez. Dommage. Ceux qui me croient dorment mal. »');
        }
      },
      san_spirale: {
        skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d2'], why: 'soutenir ce que vous comprenez',
        resolve: function (api, r) {
          var n = api.flag('spirale') || 0;
          var insight = [
            'Vous comprenez que la spirale n’est pas un dessin. C’est un plan. Une descente, tour après tour, vers quelque chose qui attend au centre.',
            'Les sept cercles sont des portes. Vous le savez comme on sait son propre nom. Et l’une d’elles, la septième, n’est plus fermée.',
            'Vous comprenez enfin « il remonte ». Ce n’est pas une menace. C’est une promesse. Vous repliez la serviette avant de comprendre le reste, et vos mains tremblent de soulagement.'
          ][Math.min(n, 2)];
          api.say(insight);
          if (n < 3) { api.mythos(1); api.flag('spirale', n + 1); }
          if (n >= 1) api.flag('hint7', true);
          if (!r.success) api.say('Quand vous relevez la tête, le wagon vous paraît étranger, comme une photographie de lui-même.');
        }
      },
      san_nom: {
        skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d3'], why: 'ne pas répondre',
        resolve: function (api, r) {
          if (r.success) api.say('Vous serrez les dents. Vous ne répondrez pas. Une voix qui connaît votre nom n’a pas besoin qu’on lui réponde.');
          else api.say('Vous avez failli répondre. Votre bouche avait déjà formé le « oui ». Vous ne savez pas ce qui serait arrivé si vous l’aviez prononcé.');
        }
      },
      san_tunnel: {
        skill: 'SAN', label: 'Santé mentale', loss: ['0', '1d3'], why: 'garder votre calme dans le noir',
        resolve: function (api, r) {
          if (r.success) api.say('Vous vous répétez que ce n’était rien. Une manche mouillée, un courant d’air. Vous y croyez presque.');
          else api.say('Vous essuyez votre main sur votre pantalon, encore et encore. Elle reste froide. Elle sent la vase.');
        }
      },
      san_vitre: {
        skill: 'SAN', label: 'Santé mentale', loss: ['0', '1'], why: 'détourner le regard',
        resolve: function (api, r) {
          if (r.success) api.say('Vous effacez la spirale d’un revers de manche. La buée revient aussitôt, sans dessin. Pour l’instant.');
          else api.say('Vous effacez la spirale d’un revers de manche. La buée revient aussitôt, et la spirale avec elle, tracée de l’autre côté de la vitre.');
        }
      },
      chance_cartes: {
        skill: 'CHANCE', label: 'Chance', why: 'gagner la partie',
        resolve: function (api, r) {
          if (r.success) api.npc('veuve', 'Vous gagnez. Elle est furieuse, et ravie. « Vous avez de la chance, jeune homme. Gardez-la pour plus tard. Vous allez en avoir besoin. »');
          else api.npc('veuve', 'Elle gagne en quatre plis. « La chance, ça ne se force pas. Ça se ménage. Comme le reste. »');
        }
      },
      san_final: {
        skill: 'SAN', label: 'Santé mentale', loss: ['1', '1d6'], why: 'supporter ce que vous voyez',
        resolve: function (api, r) {
          if (r.success) api.say('Vous tenez bon. Vous fermez la fenêtre d’une main qui ne tremble presque pas, et vous prenez Ravel par les épaules. Il est froid comme un noyé, mais il respire.');
          else api.say('Vos jambes cèdent. Vous vous retrouvez assis dans l’eau glacée, à côté de Ravel, et pendant un long moment vous ne pensez plus à rien du tout.');
          api.say('Le train ralentit. Au loin, derrière la pluie, les lumières de Vallorbe. La statuette, elle, continue de goutter.');
          api.end();
        }
      }
    },

    // -------------------------------------------------------------------------
    // Personnages
    // -------------------------------------------------------------------------
    npcs: {
      ravel: { id: 'ravel', name: 'Anselme Ravel', topics: [], deflect: ['…'] },

      serveur: {
        id: 'serveur', name: 'Bastien, le serveur', short: 'Bastien',
        selfKeys: ['SERVEUR'],
        greet: function (api, first) {
          if (shut(api)) { servLine(api, 'Il fait mine de ne pas vous voir.'); return; }
          if (first) servLine(api, '« Monsieur désire ? » Il a la voix lasse d’un homme qui sert des cognacs depuis Paris. Une plaque de cuivre sur son gilet : BASTIEN.');
          else servLine(api, api.cycle('servGreet', ['« Monsieur ? »', '« Monsieur revient me voir. »', 'Il pose son torchon. « Monsieur ? »']));
          if (api.sanState() >= 2 && api.once('pale:serveur')) servLine(api, 'Il vous regarde à deux fois. « Monsieur se sent bien ? Monsieur est pâle. Je peux apporter un cognac. Sans eau. »');
        },
        bye: 'Il incline la tête. « Monsieur. »',
        deflect: ['« Je crains de ne pas comprendre, monsieur. »', 'Il incline la tête sans répondre, et continue d’essuyer son verre.', '« Monsieur plaisante, sans doute. »', '« Si monsieur veut bien préciser sa pensée… »'],
        topics: [
          { id: 'psy', keys: ['PSY'], chip: 'Observer s’il ment (Psychologie)', chipCond: function (api) { return !api.flag('psyServ') && !api.flag('serveurParle') && (api.npcs('serveur').asked.hommegris || api.npcs('serveur').asked.note || api.flag('serveurNerveux')); },
            run: guardServ(function (api) {
              if (api.flag('serveurParle')) { servLine(api, '« Je vous ai tout dit, monsieur. »'); return; }
              if (api.flag('psyServ')) {
                if (api.flag('serveurMent')) { revealServeur(api, 'Il blêmit. « Monsieur a l’œil. Bon. Bon… »'); return; }
                api.say('Vous l’avez déjà observé. Il reste impénétrable.'); return;
              }
              api.flag('psyServ', true);
              api.say('Vous le laissez parler en guettant ses mains, ses yeux, le pli de sa bouche.');
              api.check('psy_serveur_talk');
            }) },
          { id: 'insister', keys: ['INSISTER', ['PSY', 0.6]], chip: '« Je sais que vous mentez. »', cond: function (api) { return api.flag('serveurMent') && !api.flag('serveurParle'); },
            run: guardServ(function (api) { revealServeur(api, 'Il blêmit. « Monsieur a l’œil. Bon. Bon… »'); }) },
          { id: 'argent', keys: ['ARGENT', ['DONNER', 0.9]], chip: 'Glisser un pourboire', chipCond: function (api) { return !api.flag('serveurParle') && !api.flag('serveurMenace'); },
            run: function (api) {
              if (api.flag('serveurParle')) { servLine(api, '« Gardez votre argent, monsieur. Je vous ai tout dit. »'); return; }
              if (api.flag('serveurMenace')) { servLine(api, 'Il repousse le billet du bout des doigts. « Pas après ce que vous avez fait. »'); return; }
              if (!api.pay(10)) { api.say('Vous fouillez vos poches : il ne vous reste pas de quoi.'); return; }
              api.say('Vous glissez un billet de dix francs sous la soucoupe.');
              api.npcs('serveur').shut = false; api.calm('serveur', 3);
              revealServeur(api, api.npcs('serveur').asked.toimeme ? 'Il regarde le billet longtemps, puis le fait disparaître dans son gilet. « Monsieur est généreux. L’ours aussi l’était. »' : 'Il regarde le billet longtemps, puis le fait disparaître dans son gilet. « Monsieur est généreux. »');
            } },
          { id: 'persuader', keys: ['PERSUADER'], chip: 'Le convaincre que Ravel est en danger', chipCond: function (api) { return !api.flag('serveurParle') && !api.flag('persServ'); },
            run: guardServ(function (api) {
              if (api.flag('serveurParle')) { servLine(api, '« Je vous ai tout dit, monsieur. »'); return; }
              if (api.flag('persServ')) { servLine(api, 'Il secoue la tête. Vos arguments ne prennent plus.'); return; }
              api.flag('persServ', true);
              var hard = api.npcs('serveur').att < 0 && !api.flag('serveurEbranle');
              api.say('Vous lui parlez à voix basse : Ravel, le télégramme, Bertin mort à Charenton, ce qui pourrait arriver cette nuit.');
              api.check('pers_serveur', { diff: hard ? 'difficile' : 'normal' });
            }) },
          { id: 'charme', keys: ['FLATTER'],
            run: guardServ(function (api) {
              if (api.flag('serveurParle')) { servLine(api, '« Monsieur est bien aimable. »'); return; }
              if (api.flag('charmeServ')) { servLine(api, '« Monsieur l’a déjà dit. »'); return; }
              api.flag('charmeServ', true);
              api.check('charme_serveur');
            }) },
          { id: 'baratin', keys: ['BARATIN'],
            run: guardServ(function (api) {
              if (api.flag('serveurParle')) { servLine(api, '« Je vous ai tout dit, monsieur. »'); return; }
              if (api.flag('baratinServ')) { servLine(api, '« Monsieur l’inspecteur se répète. »'); return; }
              api.flag('baratinServ', true);
              api.say('Vous sortez votre carte de presse en la tenant de façon à ce qu’on la lise mal.');
              api.check('baratin_serveur');
            }) },
          { id: 'menacer', keys: ['MENACER'],
            run: function (api) {
              if (api.flag('serveurParle')) { servLine(api, 'Il lève les mains. « Je vous ai tout dit, monsieur ! »'); return; }
              if (api.flag('intimServ')) { servLine(api, 'Il recule, prêt à appeler à l’aide.'); return; }
              api.flag('intimServ', true);
              api.check('intim_serveur');
            } },
          { id: 'ravel', keys: ['RAVEL', 'OUESTIL', ['VU', 0.8], ['TABLE', 0.8]], chip: 'Ravel',
            run: guardServ(function (api, n) {
              if (api.flag('serveurParle')) { servLine(api, '« Au 7, monsieur. Avec l’homme en gris. »'); return; }
              servLine(api, api.pick('servRavel', [
                '« M. Ravel ? Un habitué. Il a dîné seul, très peu. Il regardait sans cesse la porte. Il est parti il y a vingt minutes environ, vers les voitures-lits, je suppose. »',
                '« Je vous l’ai dit, monsieur : parti. Je ne surveille pas les clients. » Son regard glisse vers la porte à soufflet, puis revient.'
              ]));
            }) },
          { id: 'hommegris', keys: ['HOMMEGRIS', ['QUELQUUN', 0.9], ['AUTREX', 0.8]], chip: 'Quelqu’un est venu le voir ?',
            run: guardServ(function (api) {
              if (api.flag('serveurParle')) { servLine(api, '« Grand. Un chapeau rabattu. Je n’ai pas vu ses yeux, et je ne veux pas les voir. »'); return; }
              servLine(api, api.pick('servGris', [
                'Il marque un temps. « Quelqu’un ? Il y a beaucoup de monde dans un train, monsieur. »',
                '« Je ne vois pas de qui monsieur veut parler. » Le torchon s’est arrêté.'
              ]));
            }) },
          { id: 'note', keys: ['NOTE', ['CENDRIER', 0.8]], chip: 'Le message', chipCond: function (api) { return api.has('NOTE7') || api.npcs('serveur').asked.hommegris; },
            run: guardServ(function (api) {
              if (api.flag('serveurParle')) { servLine(api, '« Un billet plié en quatre. M. Ravel l’a lu, l’a brûlé dans le cendrier, et il est devenu tout gris lui-même. »'); return; }
              servLine(api, '« Un message, monsieur ? » Son torchon s’arrête une seconde sur le verre, puis reprend. « Je n’ai rien vu. »');
            }) },
          { id: 'heure', keys: ['HEURE'],
            run: guardServ(function (api) {
              servLine(api, '« M. Ravel est parti vers vingt-trois heures moins dix. Je m’en souviens : nous venions de passer Dole. » Il consulte la pendule. « Il est ' + api.clock() + ', monsieur. »');
            }) },
          { id: 'commande', keys: ['COMMANDER', 'BOISSON', ['VERRE', 0.9]], chip: 'Commander un cognac',
            run: guardServ(function (api, n, p) {
              var order = p && (p.c.COMMANDER !== undefined || p.c.BOISSON !== undefined || /cognac/.test(p.text || ''));
              if (!order && p && p.c.VERRE !== undefined) { servLine(api, '« Le verre de M. Ravel ? Un Martell 1904. Il ne l’a pas fini. Chez M. Ravel, c’est mauvais signe. »'); return; }
              if (api.flag('servi')) { servLine(api, '« Monsieur n’a pas fini le précédent. »'); return; }
              if (!api.pay(3)) { servLine(api, '« Monsieur n’a plus de quoi, je crains. »'); return; }
              api.flag('servi', true);
              api.npcs('serveur').att += 1; api.calm('serveur', 1);
              var t = (p && p.text) || '';
              var what = /cafe/.test(t) ? 'un café noir, brûlant' : /the|tisane|infusion/.test(t) ? 'un thé qui sent le foin' : /champagne/.test(t) ? 'une coupe de champagne tiède' : /absinthe/.test(t) ? 'un verre d’eau. « L’absinthe est interdite depuis 1915, monsieur. » Il vous sert un cognac à la place' : 'un cognac';
              servLine(api, 'Il vous sert ' + what + '. « Trois francs, monsieur. » Il semble apprécier qu’on consomme.');
            }) },
          { id: 'veuve', keys: ['VEUVE', ['CARTES', 0.8]],
            run: guardServ(function (api) { servLine(api, '« Madame Vasseur ? Elle prend ce train tous les mois, pour Lausanne. Elle lit le tarot à qui veut l’entendre, et surtout à qui ne veut pas. »'); }) },
          { id: 'cuisine', keys: ['CUISINE'],
            run: guardServ(function (api) { servLine(api, '« Le personnel uniquement, monsieur. Le chef n’aime pas les visites. Ni les clients. Ni moi. »'); }) },
          { id: 'toimeme', keys: ['TOIMEME'], chip: 'Lui-même',
            run: guardServ(function (api, n) {
              servLine(api, n === 0 ? '« Bastien, monsieur. Dix-sept ans à la Compagnie. J’ai servi un archiduc, deux ministres et un ours savant. L’ours laissait les meilleurs pourboires. »' : '« Il n’y a pas grand-chose à dire, monsieur. Je sers, je me tais. C’est le métier. »');
            }) },
          { id: 'lits', keys: ['WAGONLITS', 'COMPARTIMENT', 'SEPT', ['SOUFFLET', 0.8]],
            run: guardServ(function (api) {
              if (api.flag('serveurParle')) servLine(api, '« Le 7, monsieur. Je n’irais pas, à votre place. »');
              else servLine(api, '« Les voitures-lits sont après le soufflet. Le conducteur pourra vous renseigner, s’il est réveillé. Il l’est rarement. »');
            }) },
          { id: 'symbole', keys: ['SERVIETTE'], cond: function (api) { return api.has('SYMBOLE'); }, chip: 'Lui montrer la serviette',
            run: guardServ(function (api) {
              servLine(api, 'Il regarde la serviette et recule d’un pas. « Rangez ça, monsieur. S’il vous plaît. »');
              api.flag('serveurEbranle', true);
            }) },
          { id: 'manchette', keys: ['MANCHETTE'], cond: function (api) { return api.has('MANCHETTE'); },
            run: guardServ(function (api) {
              servLine(api, '« C’est à M. Ravel. Il les avait fait graver à Londres. » Il pâlit. « Où l’avez-vous trouvé ? »');
              api.flag('serveurEbranle', true);
            }) },
          { id: 'traces', keys: ['TRACES', 'LAC'],
            run: guardServ(function (api) { servLine(api, 'Son regard file vers le tapis, près du soufflet, là où une tache sombre ne sèche pas. « Une fuite, monsieur. La Compagnie a été prévenue. »'); }) },
          { id: 'train', keys: ['TRAIN'],
            run: guardServ(function (api) { servLine(api, '« Pluie jusqu’à Vallorbe, monsieur, puis la neige, peut-être. Nous entrerons dans le tunnel du Mont-d’Or vers minuit. Les lampes vacillent toujours, là-dessous. N’ayez pas peur. »'); }) },
          { id: 'statuette', keys: ['STATUETTE', 'BERTIN', ['TELEGRAMME', 0.8]],
            run: guardServ(function (api) { servLine(api, '« Je ne sais rien de tout ça, monsieur. M. Ravel parlait peu, et jamais de ses affaires. »'); }) },
          { id: 'poli', keys: ['POLI'], run: function (api) { servLine(api, '« Je vous en prie, monsieur. »'); } },
          { id: 'aurevoir', keys: ['AUREVOIR'], chip: 'Prendre congé', run: function (api) { api.endTalk(); } }
        ]
      },

      veuve: {
        id: 'veuve', name: 'Mme Irène Vasseur', short: 'Mme Vasseur',
        selfKeys: ['VEUVE'],
        greet: function (api, first) {
          if (first) {
            api.npc('veuve', 'Elle ne lève pas les yeux de son tarot. « Asseyez-vous, jeune homme, vous me cachez la lumière. Et vous avez une tête à poser des questions. »');
            api.say('Vous prenez la chaise en face d’elle. De près, elle sent la violette et le camphre.');
          } else api.npc('veuve', api.cycle('veuveGreet', ['« Encore vous ? Asseyez-vous, voyons. »', '« Revoilà mon journaliste. »']));
          if (api.sanState() >= 2 && api.once('pale:veuve')) api.npc('veuve', '« Vous êtes blanc comme un linge, jeune homme. Qu’est-ce que vous avez regardé ? Non, ne me le dites pas. »');
        },
        bye: '« Allez, allez. Et méfiez-vous des chiffres impairs. »',
        deflect: ['« Parlez plus fort, jeune homme, ou parlez moins. »', '« Fascinant. Vraiment. » Elle retourne une carte.', '« À votre âge, mon mari posait des questions plus intéressantes. Pas beaucoup, mais quelques-unes. »', 'Elle vous regarde par-dessus ses lunettes et attend que vous disiez quelque chose de sensé.'],
        topics: [
          { id: 'ravel', keys: ['RAVEL', 'OUESTIL', ['TABLE', 0.8], ['VU', 0.8]], chip: 'Le monsieur de la table du fond',
            run: function (api, n) {
              api.npc('veuve', n === 0 ? '« Le petit monsieur nerveux ? Il parlait tout seul en regardant son cognac. Pas en français, ni dans aucune langue que je connaisse, et j’ai fait trois fois le tour du monde. Des sons mouillés, comme quelqu’un qui se noie poliment. » Elle retourne une carte. « Et puis l’autre est venu le chercher. »'
                : '« Je vous l’ai dit : il gargouillait. Puis il est parti avec son grand ami. Vers les voitures-lits. »');
            } },
          { id: 'hommegris', keys: ['HOMMEGRIS', ['QUELQUUN', 0.9], ['AUTREX', 1]], chip: 'L’homme qui est venu le chercher',
            run: function (api, n) {
              if (n > 0) { api.npc('veuve', '« Grand, gris, mouillé. Je ne vais pas vous le dessiner. »'); return; }
              api.npc('veuve', '« Ah, celui-là. Grand, gris, chapeau rabattu. Il est passé à côté de moi, et ma réussite a été trempée. Trempée, jeune homme. Il ne pleut pas dans ce wagon, que je sache. Et il sentait le fond des étangs. »');
              api.say('Elle vous tend une carte gondolée, encore humide : la Lune.');
              api.clue('VEUVE');
            } },
          { id: 'cartes', keys: ['CARTES'], chip: 'Son tarot',
            run: function (api, n) {
              if (n === 0) api.npc('veuve', 'Elle retourne trois lames sur la nappe. « La Lune. Le Pendu. Et {{le Noyé|la Maison-Dieu}}, la tête en bas. » Elle soupire. « Vous allez faire une bêtise avant minuit. Allez-y, je ne vous retiens pas. »');
              else api.npc('veuve', '« Les cartes ne se répètent pas, jeune homme. Moi non plus. »');
            } },
          { id: 'serveur', keys: ['SERVEUR'], chip: 'Le serveur',
            run: function (api) {
              api.npc('veuve', '« Bastien ? Il ment comme il respire. Mais ce soir, il respire mal. Il n’a pas cessé de regarder vers le soufflet. Quelqu’un lui a graissé la patte, ou lui a fait peur. Souvent, c’est les deux. »');
              api.flag('serveurNerveux', true);
            } },
          { id: 'symbole', keys: ['SERVIETTE'], cond: function (api) { return api.has('SYMBOLE'); }, chip: 'Lui montrer la serviette',
            run: function (api, n) {
              if (n > 0) { api.npc('veuve', '« Je vous ai dit de brûler ça. »'); return; }
              api.npc('veuve', 'Elle pose sa main sèche sur la vôtre. Pour la première fois, elle ne sourit pas. « Brûlez ça. » Puis, plus bas : « Sept yeux. Comme les sept portes. Ce soir, jeune homme, tout ce qui porte le chiffre sept, évitez-le. »');
              api.flag('hint7', true);
            } },
          { id: 'toimeme', keys: ['TOIMEME'], chip: 'Elle-même',
            run: function (api, n) {
              api.npc('veuve', n === 0 ? '« Irène Vasseur. Veuve Vasseur, des Fonderies Vasseur. Mon mari est mort en 1911, d’un excès de prudence. Je ne commets pas la même erreur. »' : '« Je vous ai raconté ma vie, jeune homme. La version courte. Pour la longue, il faudrait aller jusqu’à Milan. »');
            } },
          { id: 'lac', keys: ['LAC', 'TRACES'],
            run: function (api) { api.npc('veuve', '« Le Léman ? Il y a des choses au fond de ce lac que les Suisses ne mettent pas dans leurs guides. Ma sœur jure que les cloches de Chillon sonnent toutes seules certaines nuits. Ma sœur jure beaucoup. »'); } },
          { id: 'train', keys: ['TRAIN'],
            run: function (api) { api.npc('veuve', '« Je vais à Lausanne voir ma sœur, qui refuse de mourir. Nous nous disputons l’héritage de notre mère depuis trente ans. C’est ce qui nous garde en vie, toutes les deux. »'); } },
          { id: 'argent', keys: ['ARGENT', ['DONNER', 0.9]],
            run: function (api) { api.npc('veuve', '« Gardez votre argent, jeune homme. Je suis riche : c’est bien la seule chose dont je ne manque pas. »'); } },
          { id: 'flatter', keys: ['FLATTER'],
            run: function (api, n) { if (n === 0) api.calm('veuve', 2); api.npc('veuve', n === 0 ? '« Flatteur. Continuez, je vous arrêterai quand ce sera ridicule. » Elle sourit pour de bon.' : '« Assez. À mon âge, les compliments, ça se digère mal. »'); } },
          { id: 'menacer', keys: ['MENACER'],
            run: function (api) { api.npc('veuve', 'Elle lève un sourcil. « Jeune homme, j’ai enterré un mari, deux notaires et un régiment de prétendants. Asseyez-vous ou disparaissez. »'); } },
          { id: 'social', keys: ['PERSUADER', 'BARATIN', 'PSY', 'INSISTER'],
            run: function (api) { api.npc('veuve', '« Je vous dis tout ce que je sais, jeune homme. C’est mon péché mignon. »'); } },
          { id: 'statuette', keys: ['STATUETTE', 'BERTIN'],
            run: function (api) { api.npc('veuve', '« Une statuette verte ? » Elle coupe son jeu d’un geste sec. « Je n’aime pas ce mot dans votre bouche. N’en parlez plus. »'); } },
          { id: 'heure', keys: ['HEURE'],
            run: function (api) { api.npc('veuve', 'Elle consulte une montre minuscule pendue à son cou. « ' + api.clock() + '. Et vous perdez le vôtre, de temps. »'); } },
          { id: 'poli', keys: ['POLI'], run: function (api) { api.npc('veuve', '« Il n’y a pas de quoi. Il n’y a jamais de quoi. »'); } },
          { id: 'aurevoir', keys: ['AUREVOIR'], chip: 'Prendre congé', run: function (api) { api.endTalk(); } }
        ]
      },

      conducteur: {
        id: 'conducteur', name: 'Paolo, le conducteur', short: 'Paolo',
        selfKeys: ['CONDUCTEUR'],
        greet: function (api, first) {
          if (first) api.npc('conducteur', 'Il sursaute et rajuste sa casquette. « Signore ? Qu’est-ce qu’il y a ? On n’est pas encore à Vallorbe. »');
          else api.npc('conducteur', 'Il soupire sans ouvrir les yeux. « Encore vous, signore ? »');
          if (api.sanState() >= 2 && api.once('pale:cond')) api.npc('conducteur', 'Il vous dévisage. « Signore, vous avez une sale tête. Vous avez vu quelque chose ? Non. Ne me dites pas. »');
        },
        bye: 'Il rabat sa casquette sur ses yeux. « Buona notte, signore. »',
        deflect: ['« Signore, il est tard. »', 'Il bâille. « Comment ? »', '« Moi, je fais les lits. Pas la conversation. »'],
        topics: [
          { id: 'ravel', keys: ['RAVEL', 'SEPT', 'COMPARTIMENT', 'OUESTIL', ['VU', 0.8]], chip: 'Le compartiment de Ravel',
            run: function (api, n) {
              if (n === 0) {
                api.npc('conducteur', '« Le signor Ravel ? C’est le 7. Il est rentré il y a une demi-heure, avec un ami à lui. Un grand. Je leur ai dit pour l’eau sur le tapis, ils m’ont pas répondu. » Il hausse les épaules. « Les clients. »');
                api.clue('CONDUCTEUR'); api.flag('see7', true);
              } else api.npc('conducteur', '« Le 7, signore. Frappez, si vous voulez. Moi, je dors. »');
            } },
          { id: 'hommegris', keys: ['HOMMEGRIS', ['QUELQUUN', 0.9], ['AUTREX', 0.9]], chip: 'L’ami de Ravel',
            run: function (api) {
              api.npc('conducteur', '« Son ami ? Pas vu sa figure. Il marchait… comment dire… comme quelqu’un qui a les poumons pleins. » Il frissonne. « La nuit, je dors. C’est mieux. »');
              api.clue('CONDUCTEUR');
            } },
          { id: 'cle', keys: ['OUVRIR', 'PORTE'],
            run: function (api) { api.npc('conducteur', '« J’ouvre pas les portes des clients, signore. C’est le règlement. Et puis j’ai pas envie. »'); } },
          { id: 'traces', keys: ['TRACES', 'LAC'],
            run: function (api) { api.npc('conducteur', '« Ça fuit depuis Dole. Je ferai un rapport. Demain. Ou après-demain. »'); } },
          { id: 'argent', keys: ['ARGENT', ['DONNER', 0.9]],
            run: function (api, n) {
              if (n === 0 && api.pay(5)) { api.calm('conducteur', 2); api.npc('conducteur', '« Grazie, signore ! » Il empoche le billet. « J’ai rien vu, rien entendu. Comme d’habitude. »'); }
              else if (n === 0) api.npc('conducteur', '« Gardez, gardez. »');
              else api.npc('conducteur', '« Un pourboire, c’est gentil. Deux, c’est louche, signore. »');
            } },
          { id: 'menacer', keys: ['MENACER'],
            run: function (api) {
              api.npc('conducteur', '« Ehi ! Doucement ! » Il lève les mains. « Le 7, c’est ça que vous voulez ? Le signor Ravel et son grand ami ! Allez-y et laissez-moi ! »');
              api.clue('CONDUCTEUR'); api.flag('see7', true);
            } },
          { id: 'toimeme', keys: ['TOIMEME'],
            run: function (api) { api.npc('conducteur', '« Paolo, de Domodossola. Vingt ans de wagons-lits, et jamais vu une nuit pareille. Bon, si, une fois. Mais je préfère pas en parler. »'); } },
          { id: 'train', keys: ['TRAIN', 'HEURE'],
            run: function (api) { api.npc('conducteur', '« Vallorbe vers minuit et demie. Après, la Suisse. Il fera froid. Il fait déjà froid, non ? »'); } },
          { id: 'poli', keys: ['POLI', 'FLATTER'], run: function (api) { api.npc('conducteur', '« Prego. »'); } },
          { id: 'aurevoir', keys: ['AUREVOIR'], chip: 'Le laisser dormir', run: function (api) { api.endTalk(); } }
        ]
      }
    },

    // -------------------------------------------------------------------------
    // Lieux et actions
    // -------------------------------------------------------------------------
    locations: {
      restaurant: {
        name: 'Wagon-restaurant', art: 'restaurant',
        exits: 'la porte à soufflet, vers les voitures-lits',
        enter: function (api, first) {
          if (first) return;
          api.say(api.fresh('enterR', ['Retour dans la chaleur du wagon-restaurant. Le serveur lève les yeux, puis les baisse aussitôt. La vieille dame n’a pas bougé{{. Pas d’un millimètre. Pas même pour respirer|}}.', 'La chaleur du wagon-restaurant vous enveloppe. Les lampes, le cognac, la vieille dame à sa réussite. Rien n’a bougé{{, et c’est bien ce qui vous inquiète|}}.', 'Vous revoilà parmi les nappes blanches. Bastien fait semblant de ne pas vous avoir vu revenir.']));
        },
        things: [
          { label: 'la table de Ravel', ids: ['TABLE', 'VERRE', 'SERVIETTE', 'CENDRIER', 'RAVEL'] },
          { label: 'le serveur', ids: ['SERVEUR'] },
          { label: 'la vieille dame', ids: ['VEUVE', 'CARTES'] },
          { label: 'la fenêtre', ids: ['FENETRE'] },
          { label: 'la porte de l’office', ids: ['CUISINE', 'PORTE'] },
          { label: 'la porte à soufflet', ids: ['SOUFFLET', 'PORTE', 'WAGONLITS'] },
          { label: null, ids: ['SALLE', 'RESTAURANT', 'LAMPE', 'MARQUETERIE', 'BOISSON', 'ARGENT', 'TRACES'] }
        ],
        nudges: [
          { at: 5, cond: function (api) { return !api.has('SYMBOLE'); }, run: function (api) { api.event('Le serveur passe près de vous avec un plateau. « Monsieur attend M. Ravel ? Sa table est restée telle quelle. Je n’ose pas desservir. » Il s’éloigne sans attendre de réponse.'); } },
          { at: 9, cond: function (api) { return !api.npcs('veuve').met; }, run: function (api) { api.event('« Jeune homme ! » La vieille dame en noir vous fait signe avec une carte. « Oui, vous. Cessez donc de tourner en rond et venez me tenir compagnie. »'); } },
          { at: 13, run: function (api) { api.fx('flicker'); api.event('Les lampes du wagon vacillent. Un courant d’air glacé passe sous la porte à soufflet, et avec lui une odeur de vase, lourde, écœurante. Quelqu’un, là-bas, a laissé une porte ouverte.'); } }
        ],
        ambient: [
          'Le train se penche dans une courbe ; les verres tintent sur les étagères.',
          'La vieille dame retourne une carte et claque la langue, mécontente.',
          'Le serveur remonte la mèche d’une lampe. Son reflet tremble dans la vitre.',
          'Un chapelet de lumières passe derrière la pluie : une gare de campagne que le train ne daigne pas saluer.'
        ],
        actions: [
          { id: 'r_look', label: 'Examiner le wagon-restaurant', idea: 'Regarder autour de vous', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['SALLE', 'RESTAURANT'], bare: true,
            run: function (api) {
              api.say('Huit tables nappées de blanc sous des lampes à abat-jour de soie. Aux murs, des panneaux de marqueterie où des cygnes {{plongent sous des|s’envolent au-dessus de}} roseaux d’acajou. Au fond, la table de Ravel, dressée pour deux. Derrière le comptoir, le serveur. Près d’une fenêtre, la vieille dame en noir et son tarot. À l’autre bout, la porte de l’office, et la porte à soufflet qui claque doucement à chaque courbe.');
            } },
          { id: 'r_table', label: 'Examiner la table de Ravel', idea: true, verbs: ['EXAMINER', 'FOUILLER', 'VISITER'], nouns: ['TABLE', 'RAVEL'],
            run: function (api) {
              api.say('Deux couverts. Côté Ravel, la chaise a été repoussée de travers, comme quittée en hâte. Un ballon de cognac à moitié plein. Une serviette froissée, couverte de traits d’encre. Dans le cendrier, un petit tas de papier brûlé. Et sur la nappe, une auréole humide qui {{grandit pendant que vous la regardez|ne sèche pas}}.');
              api.flag('tableVue', true);
              api.chips([{ label: 'Examiner la serviette', action: 'r_serviette' }, { label: 'Fouiller le cendrier', action: 'r_cendrier' }, { label: 'Examiner le verre', action: 'r_verre' }]);
            } },
          { id: 'r_serviette', label: 'Examiner la serviette', idea: true, ideaCond: function (api) { return api.flag('tableVue'); }, verbs: ['EXAMINER', 'FOUILLER', 'UTILISER'], nouns: ['SERVIETTE'],
            run: function (api) {
              if (api.has('SYMBOLE')) { api.say('La spirale, les sept yeux, « il remonte ». Vous avez beau la regarder, elle ne dit rien de plus.'); return; }
              api.say('Ravel a dessiné à l’encre, d’une main qui tremblait : une spirale entourée de sept petits cercles, comme des yeux {{qui vous suivent|ouverts}}. En dessous, trois mots soulignés deux fois : « il remonte ». L’encre a bavé, comme si la serviette avait trempé dans l’eau.');
              api.clue('SYMBOLE');
              if (!api.item(SERVIETTE)) api.chips([{ label: 'Prendre la serviette', action: 'r_prendre_serviette' }]);
            } },
          { id: 'r_prendre_serviette', label: 'Prendre la serviette', verbs: ['PRENDRE'], nouns: ['SERVIETTE'],
            run: function (api) {
              if (api.item(SERVIETTE)) { api.say('Elle est déjà dans votre poche, froide comme une pierre de cave.'); return; }
              api.take(SERVIETTE);
              api.say('Vous pliez la serviette et la glissez dans votre poche. Elle est froide, comme sortie d’une cave.');
              if (!api.has('SYMBOLE')) { api.say('Avant de la ranger, vous y jetez un œil : une spirale entourée de sept cercles, et trois mots, « il remonte ».'); api.clue('SYMBOLE'); }
            } },
          { id: 'r_cendrier', label: 'Fouiller le cendrier', idea: true, ideaCond: function (api) { return api.flag('tableVue') && !api.flag('cendrier'); }, verbs: ['EXAMINER', 'FOUILLER', 'PRENDRE', 'SENTIR'], nouns: ['CENDRIER', 'NOTE'],
            run: function (api) {
              var f = api.flag('cendrier');
              if (f === 'ok') { api.say('Vous avez déjà trouvé ce qu’il y avait à trouver : « …partiment 7… à minuit… seul… ».'); return; }
              if (f) { api.say('Il ne reste rien d’utile dans ces cendres.'); return; }
              api.say('Vous approchez le cendrier de la lampe. Du papier noirci, recroquevillé. Il faudra de bons yeux pour en tirer quelque chose.');
              api.check('toc_cendrier');
            } },
          { id: 'r_verre', label: 'Examiner le verre', verbs: ['EXAMINER', 'SENTIR'], nouns: ['VERRE'],
            run: function (api) { if (api.flag('verreCasse')) { api.say('Il ne reste du verre de Ravel qu’une tache sombre sur le tapis.'); return; } api.say('Un fond de cognac ambré. Vous le portez à votre nez : sous l’alcool, une odeur de vase, d’eau croupie, à peine perceptible. Sur le bord, la trace d’une lèvre, et une goutte d’eau qui n’a rien à faire là.'); } },
          { id: 'r_boire', label: 'Goûter le cognac de Ravel', verbs: ['BOIRE'], nouns: ['VERRE'], bare: true,
            run: function (api) {
              if (!api.once('boire')) { api.say('Une fois suffit.'); return; }
              api.say('Vous trempez les lèvres dans le cognac de Ravel. Le goût est normal, puis, au fond de la gorge, arrive un goût de sel et de vase. Vous reposez le verre un peu trop vite.');
            } },
          { id: 'r_prendre_verre', label: 'Prendre le verre', verbs: ['PRENDRE'], nouns: ['VERRE'],
            run: function (api) { api.say('Le serveur vous fixe. Vous reposez le verre de Ravel là où il était.'); } },
          { id: 'r_tache', label: 'Examiner l’auréole humide', verbs: ['EXAMINER', 'SENTIR', 'FOUILLER'], nouns: ['TRACES'],
            run: function (api) { api.say('L’auréole sur la nappe est froide au toucher. De l’eau, pas du cognac, et elle sent la vase. Une autre tache, plus petite, marque le tapis entre la table et la porte à soufflet.'); } },
          { id: 'r_asseoir', label: 'S’asseoir à la table de Ravel', verbs: ['ASSEOIR'], nouns: ['TABLE', 'RAVEL'], bare: true,
            run: function (api, p) {
              api.say('Vous prenez la chaise face à celle de Ravel. D’ici, vous voyez tout le wagon : le serveur qui fait semblant de ne pas vous regarder, la vieille dame et son tarot, la porte à soufflet au bout. Le serveur s’approche, carnet à la main.');
              api.talk('serveur');
            } },
          { id: 'r_fenetre', label: 'Regarder par la fenêtre', idea: true, verbs: ['EXAMINER'], nouns: ['FENETRE'],
            run: function (api) {
              if (api.once('fenetre')) {
                api.say('Votre reflet se superpose à la nuit : des sapins noirs, la pluie, une lumière de ferme qui file. Un instant, vous croyez voir un second visage derrière le vôtre, pâle, la bouche grande ouverte. Vous vous retournez. Il n’y a personne.');
                api.fx('face');
                api.check('san_fenetre');
                return;
              }
              api.say(api.cycle('fen', ['La pluie, les sapins, votre reflet. Seulement votre reflet.', 'Une gare minuscule passe dans la nuit, sans s’arrêter. Le nom sur le quai est illisible.']));
            } },
          { id: 'r_ouvrir_fenetre', label: 'Ouvrir la fenêtre', verbs: ['OUVRIR'], nouns: ['FENETRE'],
            run: function (api) { api.say('Les fenêtres du wagon-restaurant ne s’abaissent que d’un doigt. Un filet d’air glacé entre, chargé de pluie. La vieille dame claque la langue : « Fermez donc, vous allez nous tuer. »'); } },
          { id: 'r_ecouter', label: 'Écouter', idea: 'Tendre l’oreille', verbs: ['ECOUTER'], nouns: ['SALLE', 'RESTAURANT', 'SOUFFLET'], bare: true,
            run: function (api) {
              if (api.once('ecouterResto')) { api.say('Vous fermez les yeux et laissez venir les bruits du wagon.'); api.check('ecouter_resto'); return; }
              api.say(api.flag('entenduEau') ? 'Le train, les verres, les cartes. Et toujours, venant du soufflet, ce ruissellement.' : 'Le train, les verres, les cartes de la vieille dame. Rien de plus.');
            } },
          { id: 'r_sentir', label: 'Humer l’air', verbs: ['SENTIR'], nouns: ['SALLE', 'RESTAURANT', 'SOUFFLET'], bare: true,
            run: function (api) { api.say('Le cognac, le tabac froid, la cire. Et, quand la porte à soufflet bat, une bouffée d’autre chose : la vase, le fond des étangs.'); } },
          { id: 'r_cuisine_look', label: 'Examiner la porte de l’office', verbs: ['EXAMINER'], nouns: ['CUISINE'],
            run: function (api) { api.say('Une porte battante à hublot, derrière le comptoir. Par le hublot : de la vapeur, des casseroles de cuivre et le dos massif d’un cuisinier.'); } },
          { id: 'r_cuisine_go', label: 'Entrer dans l’office', verbs: ['OUVRIR', 'ALLER', 'FOUILLER'], nouns: ['CUISINE'],
            run: function (api) { api.say('Vous faites un pas vers l’office. Le serveur se glisse aussitôt devant la porte. « Le personnel uniquement, monsieur. » Le ton est poli. Le regard ne l’est pas.'); } },
          { id: 'r_porte', label: 'Ouvrir une porte', verbs: ['OUVRIR', 'EXAMINER', 'ALLER'], nouns: ['PORTE'],
            run: function (api) {
              api.say('Laquelle ? La porte de l’office, derrière le comptoir, ou la porte à soufflet, au bout du wagon ?');
              api.chips([{ label: 'Passer la porte à soufflet', action: 'r_go_couloir' }, { label: 'Entrer dans l’office', action: 'r_cuisine_go' }]);
            } },
          { id: 'r_soufflet_look', label: 'Examiner la porte à soufflet', verbs: ['EXAMINER'], nouns: ['SOUFFLET'],
            run: function (api) { api.say('Une porte vitrée, et derrière, le soufflet de cuir qui relie le wagon-restaurant aux voitures-lits. Il claque à chaque courbe. Sur le tapis, juste devant, une tache sombre ne sèche pas.'); } },
          { id: 'r_go_couloir', label: 'Passer la porte à soufflet', idea: 'Aller vers les voitures-lits', verbs: ['ALLER', 'OUVRIR'], nouns: ['SOUFFLET', 'WAGONLITS', 'COMPARTIMENT', 'SEPT', 'TRACES', 'CONDUCTEUR'],
            repeatable: true,
            run: function (api) { api.say(api.fresh('goC', ['Vous poussez la porte à soufflet. Le vacarme des rails vous saute au visage.', 'La porte à soufflet cède sous votre main. Le froid, le bruit.', 'Vous repassez la porte à soufflet. Le fracas reprend aussitôt, comme s’il vous attendait.'])); api.go('couloir'); } },
          { id: 'r_serveur_look', label: 'Observer le serveur', verbs: ['EXAMINER'], nouns: ['SERVEUR'],
            run: function (api) {
              if (api.once('obsServ')) {
                api.say('Cinquante ans, des favoris gris, un gilet impeccable. Il essuie le même verre depuis {{Paris|cinq minutes}}. Vous l’observez plus attentivement.');
                api.check('psy_serveur_obs'); return;
              }
              api.say('Bastien essuie toujours le même verre. Il évite toujours de regarder la table du fond.');
            } },
          { id: 'r_serveur_talk', label: 'Parler au serveur', idea: true, talkTo: 'serveur', verbs: ['PARLER', 'ALLER', 'DONNER', 'MENACER', 'FLATTER', 'PERSUADER', 'BARATIN', 'PSY', 'INSISTER', 'UTILISER', 'COMMANDER', 'POLI', 'AUREVOIR', 'INSULTE', 'EMBRASSER', 'DANSER', 'CHANTER', 'JOUER', 'MANGER', 'CONTEMPLER'], nouns: ['SERVEUR'],
            extra: ['RAVEL', 'HOMMEGRIS', 'NOTE', 'ARGENT', 'SERVIETTE', 'MANCHETTE', 'HEURE', 'VEUVE', 'CUISINE', 'TRAIN', 'VERRE', 'BOISSON', 'TOIMEME', 'OUESTIL', 'QUELQUUN', 'WAGONLITS', 'COMPARTIMENT', 'SEPT', 'TABLE', 'STATUETTE', 'BERTIN', 'TRACES', 'LAC', 'CARTES', 'VU', 'AUTREX', 'POLICE', 'PASSAGERS', 'GUERRE', 'DOCTEUR', 'OURS', 'ACCOMPAGNER', 'CLOCHE', 'SOEUR', 'MESCARTES', 'ETAT', 'SUITE', 'META'],
            run: function (api, p) { api.talk('serveur', p); } },
          { id: 'r_commander', label: 'Commander à boire', verbs: ['COMMANDER'], nouns: ['BOISSON', 'VERRE'], bare: true,
            run: function (api, p) { api.talk('serveur', p); } },
          { id: 'r_veuve_look', label: 'Observer la vieille dame', verbs: ['EXAMINER'], nouns: ['VEUVE', 'CARTES'],
            run: function (api) { api.say('Soixante-dix ans au moins, une robe noire coupée en 1900, des bagues à chaque doigt. Elle fait une réussite avec un vieux tarot aux couleurs passées, en marmonnant le nom des cartes. Elle sait que vous la regardez{{, et ses cartes aussi|}}.'); } },
          { id: 'r_veuve_talk', label: 'Parler à la vieille dame', idea: true, talkTo: 'veuve', verbs: ['PARLER', 'ALLER', 'ASSEOIR', 'DONNER', 'MENACER', 'FLATTER', 'PERSUADER', 'BARATIN', 'PSY', 'INSISTER', 'UTILISER', 'POLI', 'INSULTE', 'EMBRASSER', 'DANSER', 'CHANTER', 'JOUER', 'MANGER', 'CONTEMPLER'], nouns: ['VEUVE', 'CARTES'],
            extra: ['RAVEL', 'HOMMEGRIS', 'SERVEUR', 'SERVIETTE', 'TRAIN', 'LAC', 'TOIMEME', 'HEURE', 'STATUETTE', 'BERTIN', 'ARGENT', 'OUESTIL', 'QUELQUUN', 'TABLE', 'VU', 'AUTREX', 'TRACES', 'POLICE', 'PASSAGERS', 'GUERRE', 'DOCTEUR', 'OURS', 'ACCOMPAGNER', 'CLOCHE', 'SOEUR', 'MESCARTES', 'ETAT', 'SUITE', 'META'],
            run: function (api, p) { api.talk('veuve', p); } },
          { id: 'r_lampe', label: 'Examiner les lampes', verbs: ['EXAMINER'], nouns: ['LAMPE'],
            run: function (api) { api.say('Des lampes à abat-jour de soie rose, qui se balancent avec le train{{, toutes un peu trop longtemps après chaque cahot|}}. Celle qui surplombe la table de Ravel grésille, comme si quelque chose de mouillé avait touché l’ampoule.'); } },
          { id: 'r_marqueterie', label: 'Examiner la marqueterie', verbs: ['EXAMINER'], nouns: ['MARQUETERIE'],
            run: function (api) { api.say('Des cygnes de bois clair s’envolent au-dessus de roseaux d’acajou. Près du soufflet, pourtant, un des cygnes a le cou tordu vers le bas, comme s’il plongeait. Un caprice de l’ébéniste, sans doute.'); } },
          { id: 'r_attendre', label: 'Attendre Ravel', repeatable: true, verbs: ['ATTENDRE'], nouns: ['RAVEL'], bare: true, time: 5,
            run: function (api) {
              api.s.idle += 2;
              api.say(api.fresh('attResto', ['Vous attendez. Les minutes passent, Ravel ne vient pas. Le serveur change le cendrier d’une table voisine, sans toucher à celui de Ravel.', 'Vous attendez encore. Personne ne viendra, vous le sentez. Si Ravel ne vient pas à vous, il faudra aller à lui.', 'Cinq minutes. Dix. La chaise vide de Ravel vous regarde.', 'Vous comptez les cahots du train pour passer le temps. Vous vous arrêtez quand vous remarquez que vous en êtes toujours à sept.', 'L’attente vous pèse. Le cognac de Ravel, sur la table, ne baisse pas d’un millimètre.']));
            } }
        ]
      },

      couloir: {
        name: 'Le soufflet', art: 'couloir',
        exits: 'le wagon-restaurant derrière vous, les voitures-lits devant',
        enter: function (api, first) {
          if (first) api.say('Le soufflet de cuir grince et se tord sous vos pieds. Il fait froid ; une fente laisse entrer la pluie et le vacarme des rails. Le plancher de tôle est mouillé, et pas seulement par la pluie : de larges traces ruisselantes {{rampent|filent}} vers les voitures-lits. L’air sent la vase.');
          else api.say(api.fresh('enterC', ['Le soufflet, le froid, le vacarme. Les traces mouillées n’ont pas séché.', 'De nouveau le soufflet, qui se tord sous vos pieds. L’eau du plancher frissonne.', 'Le froid du soufflet vous mord la nuque. Les traces sont toujours là{{, plus nombreuses qu’avant|}}.']));
        },
        things: [
          { label: 'les traces mouillées', ids: ['TRACES'] },
          { label: 'les jointures du plancher', ids: ['MANCHETTE'] },
          { label: 'la fente du soufflet', ids: ['FENETRE'] },
          { label: 'la porte du wagon-restaurant', ids: ['RESTAURANT', 'PORTE'] },
          { label: 'la porte des voitures-lits', ids: ['WAGONLITS', 'PORTE', 'COMPARTIMENT', 'SEPT'] },
          { label: null, ids: ['SALLE', 'SOUFFLET'] }
        ],
        nudges: [
          { at: 4, run: function (api) { api.event('Quelque part dans la voiture-lits, une porte claque. Puis plus rien, sinon ce bruit d’eau.'); } }
        ],
        ambient: ['Le soufflet se contracte et se tend comme un poumon.', 'Une gifle de pluie traverse la fente du plancher.', 'Une lampe de secours clignote au-dessus de la porte des voitures-lits.'],
        actions: [
          { id: 'c_look', label: 'Examiner le soufflet', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE', 'SOUFFLET'], bare: true,
            run: function (api) { api.say('Un boyau de cuir et de tôle, secoué en tous sens. Derrière vous, la porte vitrée du wagon-restaurant ; devant, celle des voitures-lits. Entre les deux, le plancher de tôle, ses jointures pleines d’eau, et ces traces.'); } },
          { id: 'c_traces', label: 'Examiner les traces mouillées', idea: true, verbs: ['EXAMINER', 'SENTIR'], nouns: ['TRACES'],
            run: function (api) {
              api.say('Des empreintes de souliers, larges, déformées, comme gorgées d’eau. Elles ne viennent pas du wagon-restaurant : elles commencent au milieu du soufflet, d’un coup, comme si quelqu’un était sorti de nulle part. Puis elles filent vers les voitures-lits.');
              api.clue('TRACES');
            } },
          { id: 'c_suivre', repeatable: true, label: 'Suivre les traces', verbs: ['ALLER'], nouns: ['TRACES'],
            run: function (api) {
              if (!api.has('TRACES')) { api.say('Les empreintes naissent au milieu du soufflet, comme si quelqu’un était sorti de nulle part.'); api.clue('TRACES'); }
              api.say('Vous suivez les traces jusqu’à la porte des voitures-lits, et vous l’ouvrez.');
              api.go('lits');
            } },
          { id: 'c_gouter', label: 'Goûter l’eau', verbs: ['BOIRE'], nouns: ['TRACES'], bare: true,
            run: function (api) {
              if (api.once('gouterEau')) {
                api.say('Vous effleurez l’eau du bout des doigts et la portez à vos lèvres. Douce, glacée, avec un goût de vase et de fer. L’eau d’un lac profond, de ceux où le soleil n’est jamais descendu.');
                api.say('Vous fermez les yeux une seconde, et vous voyez : une eau noire, immense, et loin dessous, quelque chose qui ouvre un œil.');
                api.fx('face');
                api.check('san_eau'); return;
              }
              api.say('Vous n’y retoucherez pas. Le goût est encore là, au fond de votre gorge.');
            } },
          { id: 'c_fouiller', label: 'Fouiller le plancher', idea: true, ideaCond: function (api) { return !api.flag('couloirFouille'); }, verbs: ['FOUILLER', 'EXAMINER'], nouns: ['MANCHETTE'], bare: true,
            run: function (api, p) {
              var f = api.flag('couloirFouille');
              if (f === 'ok') { api.say('Vous avez déjà trouvé le bouton de manchette de Ravel. Il n’y a rien d’autre, que de l’eau.'); return; }
              if (f) { api.say('Vous avez déjà fouillé ces jointures. Rien que de l’eau et de la tôle.'); return; }
              if (p && p.c.EXAMINER !== undefined && p.c.MANCHETTE === undefined) { api.say('Un boyau de cuir et de tôle. Derrière vous, le wagon-restaurant ; devant, les voitures-lits. Le plancher, ses jointures pleines d’eau, et ces traces.'); return; }
              api.say('Vous vous accroupissez et passez les mains sur le plancher, entre les jointures où l’eau s’accumule.');
              api.check('toc_couloir');
            } },
          { id: 'c_fenetre', label: 'Regarder par la fente', verbs: ['EXAMINER', 'OUVRIR'], nouns: ['FENETRE'],
            run: function (api) { api.say('Par la fente du soufflet, la nuit défile : des sapins, des poteaux, la pluie à l’horizontale. Le ballast brille sous les lampes du train. Rien d’autre. Rien que vous puissiez voir.'); } },
          { id: 'c_ecouter', label: 'Écouter', verbs: ['ECOUTER'], nouns: ['SALLE', 'SOUFFLET', 'WAGONLITS'], bare: true,
            run: function (api) { api.say('Le vacarme des rails est assourdissant. Mais du côté des voitures-lits, sous le fracas, vous entendez un bruit d’eau. Comme une baignoire qui déborde, dans un train qui n’a pas de baignoire.'); } },
          { id: 'c_sentir', label: 'Humer l’air', verbs: ['SENTIR'], nouns: ['SALLE', 'SOUFFLET'], bare: true,
            run: function (api) { api.say('La vase. Le fond d’un étang qu’on vient de remuer. L’odeur vient des voitures-lits.'); } },
          { id: 'c_go_rest', label: 'Retourner au wagon-restaurant', idea: true, verbs: ['ALLER', 'OUVRIR', 'PARLER'], nouns: ['RESTAURANT', 'SERVEUR', 'VEUVE', 'TABLE', 'PORTE'],
            repeatable: true,
            run: function (api) { api.go('restaurant'); } },
          { id: 'c_go_lits', label: 'Entrer dans les voitures-lits', idea: true, verbs: ['ALLER', 'OUVRIR'], nouns: ['WAGONLITS', 'COMPARTIMENT', 'SEPT', 'PORTE', 'CONDUCTEUR'],
            repeatable: true,
            run: function (api, p) {
              api.say(api.fresh('goL', ['Vous poussez la porte des voitures-lits. Le bruit retombe d’un coup, comme sous une couverture.', 'La porte des voitures-lits se referme derrière vous. Le silence feutré, le velours, l’eau.', 'Vous entrez de nouveau dans les voitures-lits. L’air y est plus froid, plus humide.']));
              api.go('lits');
              if (p && p.c.SEPT !== undefined) { api.flag('see7', true); api.say('La porte 7 est là, au milieu du couloir. Un filet d’eau suinte dessous.'); api.chips([{ label: 'Ouvrir la porte 7', action: 'w_k7' }, { label: 'Réveiller le conducteur', action: 'w_conducteur_talk' }]); }
            } },
          { id: 'c_attendre', label: 'Attendre', repeatable: true, verbs: ['ATTENDRE'], bare: true, time: 3,
            run: function (api) { api.s.idle += 2; api.say(api.fresh('attC', ['Vous attendez dans le froid. L’eau du plancher frémit à chaque cahot. Elle ne coule pas vers les côtés, comme elle devrait. Elle coule vers les voitures-lits.', 'Le soufflet vous secoue comme un sac. Vous attendez, sans savoir quoi.', 'La pluie entre par la fente, goutte après goutte. Vous finissez par les compter.'])); } }
        ]
      },

      lits: {
        name: 'Voitures-lits', art: 'lits',
        exits: 'le soufflet, vers le wagon-restaurant',
        enter: function (api, first) {
          var trace = api.has('TRACES') || api.flag('see7');
          if (first) {
            api.say('Un couloir étroit, tapissé de velours vert. {{Neuf|Huit}} portes d’acajou aux numéros de cuivre. Au bout, sur un strapontin, le conducteur dort, la casquette sur les yeux. Le tapis est détrempé par endroits.' + (trace ? ' Les traces mouillées longent le couloir… et s’arrêtent devant la porte 7.' : ''));
            if (trace) api.flag('see7', true);
          } else api.say(api.fresh('enterL', ['Le couloir des voitures-lits. Le conducteur dort toujours.', 'Le velours vert, les portes d’acajou, le conducteur qui ronfle.', 'Le couloir feutré, de nouveau. Il fait plus froid que tout à l’heure.']) + (api.flag('see7') ? ' Sous la porte 7, l’eau continue de suinter.' : ' Le tapis est toujours détrempé.'));
        },
        things: [
          { label: 'les huit portes', ids: ['PORTE', 'COMPARTIMENT', 'SEPT', 'WAGONLITS'] },
          { label: 'le conducteur endormi', ids: ['CONDUCTEUR'] },
          { label: 'le tapis détrempé', ids: ['TRACES'] },
          { label: 'la vitre du couloir', ids: ['FENETRE'] },
          { label: null, ids: ['SALLE', 'SOUFFLET', 'RESTAURANT', 'LAMPE', 'RAVEL'] }
        ],
        nudges: [
          { at: 3, cond: function (api) { return !api.flag('see7'); }, run: function (api) { api.flag('see7', true); api.event('Votre regard tombe sur le tapis : un filet d’eau sombre suinte sous la porte du compartiment 7.'); } },
          { at: 7, run: function (api) { api.fx('flicker'); api.event('Derrière la porte 7, quelqu’un prononce votre nom. « Lucien. » Une voix mouillée, qui n’est pas celle de Ravel.'); api.check('san_nom'); } }
        ],
        ambient: ['Le conducteur ronfle, la bouche ouverte.', 'Les veilleuses bourdonnent. Celle qui surplombe la porte 7 grésille.', 'Le train freine dans une courbe. L’eau du tapis se déplace d’une seule vague, puis revient.'],
        actions: [
          { id: 'w_look', label: 'Examiner le couloir', idea: 'Regarder autour de vous', verbs: ['EXAMINER'], nouns: ['SALLE', 'WAGONLITS'], bare: true,
            run: function (api) { api.say('Velours vert, acajou, cuivre. Huit portes, de 1 à 8. Des ronflements derrière la plupart. Le conducteur dort sur son strapontin, les pieds dans un centimètre d’eau. ' + (api.flag('see7') ? 'Et sous la porte 7, l’eau suinte, régulière.' : 'Le tapis est détrempé, surtout vers le milieu du couloir.')); } },
          { id: 'w_portes', label: 'Examiner les portes', idea: true, verbs: ['EXAMINER', 'ECOUTER'], nouns: ['PORTE', 'COMPARTIMENT'],
            run: function (api) {
              api.flag('see7', true);
              api.say('Huit portes, de 1 à 8. Derrière la plupart, des ronflements. Au 4, une lampe est allumée. Et sous la porte 7, un filet d’eau sombre suinte et s’étale sur le tapis.');
              api.chips([{ label: 'Examiner la porte 7', action: 'w_7_look' }, { label: 'Frapper au 7', action: 'w_k7' }, { label: 'Frapper au 3', action: 'w_k3' }]);
            } },
          { id: 'w_7_look', label: 'Examiner la porte 7', verbs: ['EXAMINER', 'SENTIR'], nouns: ['SEPT'],
            run: function (api) {
              api.flag('see7', true);
              api.say('La porte 7. Le numéro de cuivre est couvert de buée, comme si elle venait de l’intérieur. L’eau suinte dessous, régulière. Il fait plus froid ici que partout ailleurs dans le train.');
              api.chips([{ label: 'Ouvrir la porte 7', action: 'w_k7' }]);
            } },
          { id: 'w_traces', label: 'Examiner le tapis détrempé', verbs: ['EXAMINER', 'FOUILLER', 'SENTIR'], nouns: ['TRACES'],
            run: function (api) {
              api.flag('see7', true);
              api.say('Les empreintes mouillées longent le velours, sans hésiter, jusqu’à la porte 7. Là, elles s’arrêtent. Elles n’en ressortent pas.');
              api.clue('TRACES');
            } },
          { id: 'w_frapper', label: 'Frapper à une porte', repeatable: true, verbs: ['FRAPPER', 'OUVRIR', 'ALLER', 'ECOUTER'], nouns: ['PORTE', 'COMPARTIMENT', 'SEPT', 'TRACES'],
            run: function (api, p) {
              var n = p && p.numbers && p.numbers[0];
              if (!n && p && /\b(encore|insiste|insister|nouveau|refrappe|plus fort)\b/.test(p.text || '') && api.flag('dernierePorte')) n = api.flag('dernierePorte');
              if (n && n !== 7) api.flag('dernierePorte', n);
              if ((p && p.c.SEPT !== undefined) || n === 7) { finale(api); return; }
              if (p && p.c.ECOUTER !== undefined && !n) { api.exec('w_ecouter'); return; }
              if (p && p.c.TRACES !== undefined && p.c.ALLER !== undefined) { api.say('Vous suivez les traces sur le velours. Elles vous mènent tout droit à la porte 7.'); api.flag('see7', true); api.chips([{ label: 'Ouvrir la porte 7', action: 'w_k7' }]); return; }
              if (n && knock(n)) { api.flag('k' + n, true); api.say(knock(n, api)); if (api.flag('temoins') >= 2) api.chips([{ label: 'Frapper au 7', action: 'w_k7' }]); return; }
              if (n) { api.say('Il n’y a que huit compartiments, et le 7 est celui de Ravel.'); return; }
              var raw = (p && p.text) || '';
              if (/\b(toutes|chaque|une a une|les unes apres les autres)\b/.test(raw)) {
                [1, 3, 6].forEach(function (k) { api.flag('k' + k, true); api.count('porte' + k); });
                api.say('Vous remontez le couloir en frappant à chaque porte. Au 1, un juron anglais. Au 3, un juron allemand. Au 6, une dame qui demande si c’est Lausanne. Partout, des gens qui dormaient mal, et qui semblent soulagés qu’on vienne frapper chez eux plutôt qu’ailleurs.');
                api.say('Devant le 7, vous n’avez pas frappé. Votre main s’est arrêtée toute seule.');
                api.chips([{ label: 'Frapper au 7', action: 'w_k7' }, { label: 'Insister au 3', action: 'w_k3' }, { label: 'Insister au 6', action: 'w_k6' }]);
                return;
              }
              if (/\b(autre|mauvaise|au hasard|n importe laquelle|une porte)\b/.test(raw)) { var m = autrePorte(api); api.flag('dernierePorte', m); api.say(knock(m, api)); return; }
              api.say('Huit portes d’acajou, de 1 à 8. Sous le 7, l’eau suinte toujours.');
              api.chips([{ label: 'Frapper au 7', action: 'w_k7' }, { label: 'Frapper au 3', action: 'w_k3' }, { label: 'Frapper au 6', action: 'w_k6' }]);
            } },
          { id: 'w_k7', label: 'Ouvrir la porte 7', run: function (api) { finale(api); } },
          { id: 'w_k3', label: 'Frapper au 3', repeatable: true, run: function (api) { api.flag('k3', true); api.say(knock(3, api)); } },
          { id: 'w_k6', label: 'Frapper au 6', repeatable: true, run: function (api) { api.flag('k6', true); api.say(knock(6, api)); } },
          { id: 'w_conducteur_look', label: 'Observer le conducteur', verbs: ['EXAMINER'], nouns: ['CONDUCTEUR'],
            run: function (api) { api.say('Un petit homme rond, la casquette de la Compagnie sur le nez. Il dort la bouche ouverte{{, et un filet d’eau en coule|}}. Ses chaussures, posées sous le strapontin, baignent dans un centimètre d’eau.'); } },
          { id: 'w_conducteur_talk', label: 'Réveiller le conducteur', idea: true, talkTo: 'conducteur', verbs: ['PARLER', 'REVEILLER', 'ALLER', 'MENACER', 'DONNER', 'FLATTER', 'PERSUADER', 'BARATIN', 'POLI', 'FRAPPER', 'INSULTE', 'EMBRASSER', 'DANSER', 'CHANTER', 'JOUER', 'MANGER', 'CONTEMPLER'], nouns: ['CONDUCTEUR'],
            extra: ['RAVEL', 'SEPT', 'COMPARTIMENT', 'HOMMEGRIS', 'TRACES', 'ARGENT', 'PORTE', 'TOIMEME', 'TRAIN', 'HEURE', 'OUESTIL', 'QUELQUUN', 'VU', 'AUTREX', 'POLICE', 'PASSAGERS', 'GUERRE', 'DOCTEUR', 'OURS', 'ACCOMPAGNER', 'CLOCHE', 'SOEUR', 'MESCARTES', 'ETAT', 'SUITE', 'META'],
            run: function (api, p) { api.talk('conducteur', p); } },
          { id: 'w_ecouter', label: 'Écouter aux portes', verbs: ['ECOUTER'], nouns: ['SALLE', 'WAGONLITS'], bare: true,
            run: function (api) {
              if (api.once('ecouterLits')) { api.say('Vous avancez dans le couloir en tendant l’oreille, porte après porte.'); api.check('ecouter_lits'); return; }
              api.say('Des ronflements. Et derrière la porte 7, ce clapotis qui ne s’arrête pas.');
            } },
          { id: 'w_sentir', label: 'Humer l’air', verbs: ['SENTIR'], nouns: ['SALLE', 'WAGONLITS'], bare: true,
            run: function (api) { api.say('La vase, plus forte que jamais. Et quelque chose de plus âcre, comme du poisson oublié au soleil.'); } },
          { id: 'w_fenetre', label: 'Examiner la vitre du couloir', verbs: ['EXAMINER'], nouns: ['FENETRE'],
            run: function (api) {
              if (api.once('vitreLits')) { api.say('La vitre du couloir est couverte de buée. Quelqu’un y a tracé une spirale du bout du doigt, et sept petits ronds autour. Vous approchez la main pour l’effacer.'); api.check('san_vitre'); return; }
              api.say('La buée, la nuit, et derrière, les sapins qui défilent. Vous ne regardez pas trop longtemps.');
            } },
          { id: 'w_go_back', repeatable: true, label: 'Retourner au wagon-restaurant', verbs: ['ALLER', 'OUVRIR'], nouns: ['SOUFFLET', 'RESTAURANT', 'SERVEUR', 'VEUVE', 'TABLE'],
            run: function (api, p) {
              if (p && p.c.SOUFFLET !== undefined && p.c.RESTAURANT === undefined) { api.go('couloir'); return; }
              api.say(api.fresh('goBack', ['Vous retraversez le soufflet en pressant le pas.', 'Vous revenez sur vos pas, à travers le soufflet qui gronde.', 'Le soufflet, encore. Vous ne vous y attardez pas.']));
              api.go('restaurant');
            } },
          { id: 'w_attendre', label: 'Attendre', repeatable: true, verbs: ['ATTENDRE'], bare: true, time: 3,
            run: function (api) { api.s.idle += 2; api.say(api.fresh('attW', ['Vous attendez dans le couloir. Les ronflements, le bourdonnement des veilleuses. Et, sous la porte 7, l’eau qui avance d’un centimètre vers vos chaussures.', 'Vous restez immobile. Derrière la porte 7, le clapotis ne s’arrête pas.', 'Le conducteur ronfle. Les veilleuses grésillent. L’eau, elle, gagne du terrain.'])); } }
        ]
      },

      compartiment: { name: 'Compartiment 7', art: 'compartiment', enter: function () {}, things: [], actions: [] }
    },

    // Actions valables partout
    globalActions: [
      { id: 'g_ravel', label: 'Chercher Ravel', verbs: ['FOUILLER', 'EXAMINER', 'CRIER', 'PARLER', 'ATTENDRE'], nouns: ['RAVEL', 'OUESTIL'],
        cond: function (api) { return api.s.loc !== 'compartiment'; },
        run: function (api) {
          var l = api.s.loc;
          if (l === 'restaurant') { api.say('Ravel n’est pas dans le wagon. Sa chaise vide vous nargue. Le serveur ou la vieille dame l’ont peut-être vu partir.'); api.chips([{ label: 'Parler au serveur', action: 'r_serveur_talk' }, { label: 'Parler à la vieille dame', action: 'r_veuve_talk' }]); }
          else if (l === 'couloir') api.say('Personne dans le soufflet. Seulement ces traces, qui filent vers les voitures-lits.');
          else { api.say('Ravel est forcément derrière l’une de ces huit portes. Le conducteur sait sans doute laquelle.' + (api.flag('see7') ? ' À moins que l’eau sous la porte 7 ne vous l’ait déjà dit.' : '')); }
        } },
      { id: 'g_telegramme', label: 'Relire le télégramme', verbs: ['EXAMINER', 'UTILISER', 'PRENDRE', 'FOUILLER'], nouns: ['TELEGRAMME'],
        run: function (api) { api.doc('J’AI TROUVÉ CE QUE BERTIN CHERCHAIT STOP WAGON-RESTAURANT VINGT-TROIS HEURES STOP VENEZ SEUL STOP RAVEL', 'Télégramme — Paris, bureau de la rue du Louvre'); } },
      { id: 'g_statuette', label: 'Penser à la statuette', verbs: ['EXAMINER', 'FOUILLER', 'PRENDRE', 'ATTENDRE'], nouns: ['STATUETTE'],
        run: function (api) { api.say('Vous ne l’avez jamais vue. Seulement les dessins de Bertin, sur les murs de sa chambre à Charenton : une chose accroupie, aux yeux trop nombreux.'); } },
      { id: 'g_bertin', label: 'Penser à Bertin', verbs: ['EXAMINER', 'ATTENDRE'], nouns: ['BERTIN'],
        run: function (api) { api.say('Bertin. Vingt ans de faits divers, et une enquête de trop. On l’a retrouvé à l’aube sur les quais de Seine, trempé, hurlant qu’« il remonte ». Il est mort à Charenton en février, en dessinant des spirales.'); } },
      { id: 'g_heure', label: 'Regarder l’heure', verbs: ['EXAMINER'], nouns: ['HEURE'],
        run: function (api) { api.say('Votre montre indique ' + api.clock() + '.'); } },
      { id: 'g_serviette', label: 'Examiner la serviette', verbs: ['EXAMINER', 'UTILISER'], nouns: ['SERVIETTE'],
        cond: function (api) { return api.item(SERVIETTE) && api.s.loc !== 'restaurant'; },
        run: function (api) { api.say('Vous dépliez la serviette de Ravel. La spirale, les sept yeux, « il remonte ». Elle est toujours froide.'); } },
      { id: 'g_manchette', label: 'Examiner le bouton de manchette', verbs: ['EXAMINER', 'UTILISER'], nouns: ['MANCHETTE'],
        cond: function (api) { return api.item(MANCHETTE) && api.s.loc !== 'couloir'; },
        run: function (api) { api.say('Un bouton de manchette en argent, gravé « A.R. ». Arraché, pas perdu : la tige est tordue.'); } },
      { id: 'g_fumer', needVerb: true, label: 'Fumer une cigarette', verbs: ['FUMER'], bare: true, nouns: ['SALLE'],
        run: function (api) {
          var l = api.s.loc;
          if (l === 'couloir') api.say('Le vent du soufflet éteint trois allumettes. Vous renoncez.');
          else if (l === 'lits') api.say('Vous allumez une cigarette. La fumée monte, droite, puis se couche brusquement vers la porte 7, comme aspirée.');
          else api.say('Vous allumez une cigarette. Le serveur pose aussitôt un cendrier propre devant vous, sans un mot.');
        } },
      { id: 'g_dormir', label: 'Dormir', verbs: ['DORMIR'], bare: true,
        run: function (api) { api.say('Pas maintenant. Ravel a peut-être besoin de vous.'); } },
      { id: 'g_crier', label: 'Crier', verbs: ['CRIER'], bare: true,
        run: function (api) { api.say('Vous ouvrez la bouche, puis vous vous ravisez. Un journaliste qui crie dans un train, ce n’est qu’un fou qui crie dans un train.'); } }
    ],

    // Réponses génériques, dans la voix du meneur
    generic: {
      absent: ['Vous ne voyez pas {x} ici.', 'Vous cherchez {x} des yeux, en vain.'],
      verbs: {
        EXAMINER: ['Rien de particulier. Ici, votre regard s’arrête sur : {things}.', 'Vous regardez, sans rien remarquer de neuf. Autour de vous : {things}.', 'Rien ne retient vraiment votre attention. Restent {things}.'],
        FOUILLER: ['Vous fouillez un peu au hasard, sans résultat. Mieux vaut chercher quelque chose de précis : {things}.', 'Fouiller, oui, mais quoi ? Il y a {things}.', 'Vos mains cherchent dans le vide. Choisissez : {things}.'],
        PRENDRE: ['Vous n’allez pas emporter ça. Et quelqu’un pourrait vous voir.', 'Ça ne se prend pas, ou ça ne vous servirait à rien.', 'Vous tendez la main, puis vous vous ravisez.'],
        SENTIR: ['L’odeur du train : charbon, cuir, poussière. Et, partout, une note de vase.', 'Vous inspirez. Le tabac froid, la laine mouillée, et cette vase, toujours.', 'Une odeur d’eau stagnante flotte sous toutes les autres.'],
        BOIRE: ['Il n’y a rien à boire de ce côté.', 'Rien à boire ici. Et vous n’avez plus très soif, de toute façon.', 'Pas de quoi boire. Pas ici.'],
        ECOUTER: ['Le train, toujours le train.', 'Les rails, le vent, votre propre souffle.', 'Vous écoutez. Le train vous répond, monotone.'],
        PARLER: function (api) { return api.fresh('genParler:' + api.s.loc, ({ restaurant: ['À qui voulez-vous parler ? Au serveur, ou à la vieille dame ?', 'Le serveur derrière son comptoir, la vieille dame à sa table : à qui vous adressez-vous ?'], couloir: ['Il n’y a personne dans le soufflet. Personne de visible.', 'Vous parlez au vide. Le vacarme avale vos mots.'], lits: ['Il n’y a guère que le conducteur, endormi sur son strapontin. Et ce qui murmure derrière la porte 7.', 'Le conducteur dort au bout du couloir. Les autres sont derrière leurs portes.'] })[api.s.loc] || ['Il n’y a personne à qui parler ici.', 'Personne ne vous écoute ici.']); },
        ALLER: function (api) { return 'Pour aller où ? D’ici, vous pouvez rejoindre ' + (({ restaurant: 'la porte à soufflet, vers les voitures-lits', couloir: 'le wagon-restaurant derrière vous, ou les voitures-lits devant', lits: 'le soufflet, vers le wagon-restaurant' })[api.s.loc] || 'le couloir') + '.'; },
        OUVRIR: ['Ça ne s’ouvre pas, ou pas de cette façon.', 'Rien ne cède.', 'Vous essayez. Ça ne bouge pas.'],
        FRAPPER: ['Vous frappez. Le bois sonne creux. Rien ne se passe.', 'Toc, toc. Personne.', 'Le bruit se perd dans le vacarme du train.'],
        ASSEOIR: ['Il n’y a pas de place pour vous asseoir ici.', 'Pas de siège à portée.', 'Vous resterez debout.'],
        COMMANDER: ['Personne ne prend de commande ici.', 'Il n’y a pas de serveur de ce côté.', 'Commander ? À qui ?'],
        DONNER: ['Donner quoi, et à qui ?', 'Il n’y a personne à qui donner quoi que ce soit.', 'Votre main reste tendue vers personne.'],
        ATTENDRE: ['Vous attendez. Le train file dans la nuit.', 'Les minutes passent, lourdes.', 'Vous attendez. Rien ne vient, sinon le bruit des rails.'],
        UTILISER: ['Vous ne voyez pas comment vous en servir ici.', 'Ça ne servirait à rien ici.', 'Pas ici, pas comme ça.'],
        REVEILLER: ['Il n’y a personne à réveiller ici.', 'Personne ne dort à portée de main.'],
        MENACER: ['Vos poings se serrent, mais il n’y a personne à menacer.', 'Contre qui, exactement ?'],
        FLATTER: ['Vous souriez dans le vide. Ça ne mène à rien.', 'Il n’y a personne pour apprécier.'],
        PERSUADER: ['Vous plaidez votre cause devant personne.', 'Convaincre qui ?'],
        BARATIN: ['Mentir, oui. Mais à qui ?', 'Pas de public pour vos mensonges.'],
        PSY: ['Vous scrutez les visages, mais personne ne vous parle.', 'Il n’y a personne à jauger ici.'],
        INSISTER: ['Insister sur quoi ?', 'Il n’y a rien sur quoi insister pour l’instant.'],
        AUREVOIR: ['Vous ne parlez à personne.', 'Vous saluez le vide.'],
        POLI: ['Personne ne vous répond.', 'Votre politesse se perd dans le bruit du train.'],
        LANCER: ['Lancer quoi, et sur qui ? Le train tangue, et vous gardez vos mains pour vous tenir.', 'Votre bras se lève, puis retombe. Le serveur vous a vu, et il hausse un sourcil.'],
        VISITER: ['Aller voir quoi, ou qui ? Ici, il y a : {things}.', 'Voir quoi ? Il y a {things}.']
      },
      again: ['Vous revenez à {x}. Rien n’a changé depuis tout à l’heure. Sauf peut-être vous.', '{X}, encore. Vous en connaissez chaque détail, maintenant.', 'Vous regardez de nouveau {x}. Les mêmes détails, et cette impression tenace que quelque chose vous échappe.', 'Rien de neuf du côté de {x}. Il faudrait essayer autre chose.'],
      againBare: ['Rien de neuf.', 'Comme tout à l’heure. Rien de plus.', 'Vous recommencez, sans rien apprendre de nouveau.', 'Rien ne change. Vous, peut-être.'],
      againPrefix: ['Vous y revenez. ', 'Une fois encore. ', 'Vous recommencez, plus lentement. ', 'Encore une fois, en détail. '],
      againMad: ['Vous regardez encore {x}. Était-ce déjà comme ça la première fois ? Vous n’en êtes plus sûr.', '{X}. Vous l’avez déjà vu. Vous l’avez toujours vu. Vous le reverrez.', 'Vous revenez à {x}, et pendant une seconde vous avez peur que ce soit lui qui vous regarde.'],
      loop: ['Vous tournez en rond. Le train, lui, avance.', 'Il y a sûrement autre chose à tenter.', 'Lucien se frotte les yeux. Il faut changer d’approche.'],
      dup: ['Même résultat qu’à l’instant.', 'Rien de plus que la dernière fois.', 'Vous insistez. Le monde, lui, ne change pas d’avis.', 'Toujours la même chose. Peut-être faut-il essayer autre chose.'],
      nounOnly: ['{x} ? Que voulez-vous en faire, exactement ?', '{x}, oui. Mais encore ? Examiner, fouiller, prendre, parler… ?'],
      thinkOnly: ['Vous réfléchissez à {x}, sans avancer. Il faudrait poser la question à quelqu’un.', 'Vous notez « {x} » dans votre carnet, avec un point d’interrogation. Quelqu’un, ici, doit savoir.'],
      lost: [
        'Le train cahote et votre idée se perd dans le vacarme des rails. Ravel n’est toujours pas revenu, et la chaise vide vous regarde.',
        'Vous hésitez. La pluie raye les vitres. Quelque part dans ce train, quelqu’un sait où est passé Ravel.',
        'Une seconde, vous ne savez plus très bien ce que vous vouliez faire. Le télégramme, dans votre poche, vous le rappelle : wagon-restaurant, vingt-trois heures, venez seul.'
      ],
      clarify: ['Vous voulez dire :', 'Plus précisément ?']
    },

    timeEvents: [
      { id: 'tunnel', at: 48, cond: function (api) { return !api.flag('finale'); },
        run: function (api) {
          api.fx('blackout');
          api.event('Minuit. Le train s’engouffre dans le tunnel du Mont-d’Or et le vacarme double. Les lampes faiblissent, puis s’éteignent. Dans le noir, quelque chose de froid et de mouillé effleure votre main. Quand la lumière revient, il n’y a rien. Seulement l’odeur de vase, plus forte, qui vient des voitures-lits.');
          api.check('san_tunnel');
        } },
      { id: 'sortie', at: 63, cond: function (api) { return !api.flag('finale'); },
        run: function (api) { api.event('Le train sort du tunnel. Vallorbe n’est plus très loin. Quoi que Ravel ait trouvé, il ne l’aura plus longtemps.'); } }
    ],

    intro: function (api) {
      api.title('L’Express de minuit', 'Chapitre 1 — Le wagon-restaurant');
      api.say('Octobre 1923. Express de nuit Paris – Lausanne, quelque part entre Dole et la frontière suisse.');
      api.doc('J’AI TROUVÉ CE QUE BERTIN CHERCHAIT STOP WAGON-RESTAURANT VINGT-TROIS HEURES STOP VENEZ SEUL STOP RAVEL', 'Télégramme reçu ce matin');
      api.say('Bertin, votre ancien confrère, est mort l’hiver dernier à l’asile de Charenton, en dessinant des spirales sur les murs. Anselme Ravel, antiquaire rue Jacob, est le dernier à lui avoir parlé.');
      api.say('Il est 23 h 12. Le wagon-restaurant sent le cognac et l’acajou ciré ; la pluie raye les vitres. Au fond, une table est dressée pour deux. Une chaise est repoussée de travers. Ravel n’est pas là.');
      api.say('Derrière son comptoir, le serveur essuie un verre sans vous quitter des yeux. Près d’une fenêtre, une vieille dame en noir fait une réussite avec un vieux tarot. Au bout du wagon, une porte à soufflet mène aux voitures-lits.');
      api.sys('Écrivez ce que fait Lucien, comme à une table de jeu : « j’examine la table », « je parle au serveur »… Les fautes de frappe ne gênent pas. Touchez « Idées » si vous séchez.');
    },

    help: function (api) {
      api.sys('Écrivez ce que fait Lucien en phrases simples : « j’examine la table », « je fouille le cendrier », « je parle au serveur », « je vais dans le couloir ». En conversation, posez vos questions librement : « où est parti Ravel ? », « quelqu’un est venu le voir ? ». Mots utiles : inventaire, fiche, carnet, aide. Quand un jet est demandé, lancez les dés. Après certains échecs, vous pourrez insister : c’est un jet forcé, à vos risques.');
    }
  };


  // ===========================================================================
  // Santé mentale : la narration se dérègle avec l'état de Lucien
  // ===========================================================================
  SCENE.sanLabels = ['Lucide', 'Troublé', 'Fragile', 'Au bord du gouffre'];
  // {{fausse perception|vraie perception}} : lucide → la vraie ; fragile → la fausse est barrée puis corrigée ; au bord → souvent la fausse seule
  SCENE.perceive = function (api, x) {
    var st = api.sanState();
    return x.replace(/\{\{([^|}]*)\|([^}]*)\}\}/g, function (m, wrong, right) {
      if (st <= 1) return right;
      if (st === 2) return '⟦' + wrong + '|' + right + '⟧';
      return api.rand() < 0.6 ? wrong : '⟦' + wrong + '|' + right + '⟧';
    });
  };
  SCENE.intrusions = {
    1: [
      'Vous vous surprenez à compter les gouttes sur la vitre. Sept. Toujours sept.',
      'Un instant, l’odeur de vase est si forte que vous en avez la nausée. Puis plus rien.',
      'Vous avez l’impression que quelqu’un vient de prononcer votre nom, très loin.',
      'Vos mains sont froides. Vous ne vous souvenez pas de les avoir mouillées.',
      'Le roulement du train prend un rythme étrange, comme une respiration. Puis redevient un train.'
    ],
    2: [
      'Il remonte. La phrase tourne dans votre tête comme une rengaine. Vous ne savez plus qui l’a prononcée en premier.',
      'Vous clignez des yeux : pendant une seconde, tout était sous l’eau, les lampes flottant comme des méduses.',
      'Votre reflet, dans la vitre, a tourné la tête un instant après vous.',
      'Vous notez quelque chose dans votre carnet. En relisant, vous ne reconnaissez pas votre écriture : elle est penchée, trop régulière.',
      'Le goût de sel vous remonte dans la gorge, alors que vous n’avez rien bu.'
    ],
    3: [
      'Vous comptez les secondes entre deux cahots. Il y en a sept. Il y en a toujours sept. Pourquoi personne ne le remarque ?',
      'Quelqu’un rit doucement, tout près de votre oreille. C’est vous.',
      'Vous savez, sans savoir comment, ce qu’il y a sous le lac. Puis vous l’oubliez, et c’est un soulagement immense.',
      'Vos pensées arrivent avec un léger retard, comme l’écho d’une autre voix.',
      'Vous avez de l’eau jusqu’aux chevilles. Non. Le plancher est sec. Le plancher est sec.'
    ]
  };
  // Au bord du gouffre, Lucien n'obéit plus toujours
  SCENE.beforeAction = function (api, a) {
    if (api.sanState() < 3 || api.s.loc === 'compartiment' || /^w_k|^g_etat|^g_meta/.test(a.id)) return false;
    if (api.rand() > 0.12) return false;
    var what = a.label.charAt(0).toLowerCase() + a.label.slice(1);
    api.say(api.cycle('involontaire', [
      'Vous vouliez ' + what + '. Vous vous retrouvez immobile, le front contre la paroi froide, sans savoir depuis combien de temps.',
      'Vous ouvrez la bouche pour agir, et rien ne vient. Une minute entière s’écoule. Votre montre l’atteste. Vous, vous n’en gardez aucun souvenir.',
      'Vos doigts ont déjà commencé à tracer une spirale, du bout de l’index mouillé. Vous les arrêtez. Vous ne savez plus ce que vous vouliez faire.'
    ]));
    api.time(2);
    return true;
  };
  SCENE.onMadness = function (api) {
    api.fx('madness');
    api.event('Quelque chose cède. Vous vous entendez rire, ou pleurer, vous ne savez plus. Quand vous reprenez vos esprits, vous êtes à genoux et vos mains tracent des spirales dans l’eau, sept tours, toujours sept.');
  };

  // ===========================================================================
  // Dialogues : relances (« pourquoi ? », « et ensuite ? ») et sujets supplémentaires
  // ===========================================================================
  function topic(npc, id) { return SCENE.npcs[npc].topics.find(function (t) { return t.id === id; }); }
  function more(npc, id, lines) { topic(npc, id).more = lines; }
  function add(npc, list) {
    var tl = SCENE.npcs[npc].topics;
    var at = tl.findIndex(function (t) { return t.id === 'poli'; });
    tl.splice.apply(tl, [at, 0].concat(list));
  }
  function L(npc, x) { return function (api, n) { api.npc(npc, typeof x === 'function' ? x(api, n) : Array.isArray(x) ? x[Math.min(n, x.length - 1)] : x); }; }

  // --- Bastien ---
  SCENE.npcs.serveur.noMore = ['« C’est tout ce que je sais, monsieur. »', '« Je n’ai rien à ajouter. »', 'Il hausse les épaules, imperceptiblement.'];
  more('serveur', 'ravel', function (api) { return api.flag('serveurParle') ? ['« Il a lu le billet deux fois. La deuxième fois, il a souri. C’est ça qui m’a fait peur, monsieur. »'] : ['« Il a commandé une truite au bleu, et il n’y a pas touché. Il l’a regardée. Longtemps. »', '« En se levant, il a dit une chose. “Elle était pleine d’eau.” Je n’ai pas compris. Je ne cherche pas à comprendre. »']; });
  more('serveur', 'hommegris', function (api) { return api.flag('serveurParle') ? ['« Il ne parlait pas. Il… gargouillait, comme M. Ravel après lui. »', '« Ses mains, monsieur. Ridées comme celles d’une lavandière. Comme quand on est resté trop longtemps dans l’eau. »'] : ['« Je vous assure, monsieur. »', 'Il ne répond pas. Le torchon s’est arrêté pour de bon.']; });
  more('serveur', 'note', function (api) { return api.flag('serveurParle') ? ['« Le papier gouttait, monsieur. Un billet qui goutte. Dans un wagon sec. »'] : ['« Je n’ai rien vu, je vous dis. »']; });
  more('serveur', 'toimeme', ['« L’archiduc mangeait les arêtes. L’ours, lui, savait se tenir. »', '« Ma femme m’attend à Lausanne. Elle croit que je suis à Milan. C’est une longue histoire, et monsieur n’a pas le temps. »']);
  more('serveur', 'train', ['« Six kilomètres de tunnel, monsieur. Six minutes dans le noir, si les lampes lâchent. On s’habitue. Enfin, on dit qu’on s’habitue. »']);
  more('serveur', 'heure', ['« Le temps passe vite, cette nuit. Ou lentement. Je ne sais plus. »']);
  more('serveur', 'veuve', ['« Elle m’a tiré les cartes, une fois. Je n’ai pas dormi pendant une semaine. Depuis, je lui sers son thé sans la regarder. »']);
  more('serveur', 'cuisine', ['« Le chef s’appelle Gaston. Il a fait la guerre dans les cuisines de l’état-major. Il ne parle qu’aux casseroles. »']);
  more('serveur', 'lits', ['« Le conducteur s’appelle Paolo. Il dort. Il dort toujours. C’est un talent. »']);
  more('serveur', 'traces', ['« La fuite a commencé à Dole. Au moment où M. Ravel est parti, maintenant que j’y pense. » Il se tait, comme s’il en avait trop dit.']);
  more('serveur', 'symbole', ['« Je l’ai déjà vu, voilà. Sur la buée des vitres, ce soir. Plusieurs fois. Je l’efface, et il revient. »']);
  more('serveur', 'commande', ['« Le cognac, c’est la seule chose sèche dans ce train, ce soir. »']);
  add('serveur', [
    { id: 'insulte', keys: ['INSULTE'], run: function (api, n) { api.npcs('serveur').att -= 1; servLine(api, n === 0 ? 'Il ne cille pas. « Monsieur a raison, sans doute. Monsieur désire autre chose ? »' : '« J’ai servi des généraux, monsieur. Ils avaient plus de vocabulaire. »'); } },
    { id: 'embrasser', keys: ['EMBRASSER'], run: L('serveur', 'Il recule d’un pas, très digne. « Monsieur a trop bu. Ou pas assez. »') },
    { id: 'danser', keys: ['DANSER', 'CHANTER', 'JOUER'], run: L('serveur', ['« La Compagnie ne prévoit pas de bal, monsieur. »', '« Monsieur, je vous en prie. Il y a un évêque dans les voitures-lits. »']) },
    { id: 'manger', keys: ['MANGER'], run: L('serveur', ['« Le service est terminé, monsieur. Il reste de la terrine et une tarte aux pommes qui a vu la frontière plusieurs fois. »', 'Il vous apporte une part de tarte. Elle a un vague goût de vase. Tout a un vague goût de vase, ce soir.', '« Il n’y a plus rien, monsieur. Même la terrine est partie se coucher. »']) },
    { id: 'etat', keys: ['ETAT'], run: L('serveur', function (api) { return api.sanState() >= 2 ? '« Monsieur n’est pas le premier à voir des choses dans ce wagon. Je ne dis pas que je les vois aussi. Je ne dis pas le contraire. »' : '« Le train fait cet effet-là, la nuit, monsieur. Un cognac ? Non ? Moi non plus, je n’en prends plus après Dole. »'; }) },
    { id: 'passagers', keys: ['PASSAGERS'], run: L('serveur', '« Une vingtaine, ce soir. Des Suisses qui rentrent, des Anglais qui partent, un évêque, un médecin allemand. Et M. Ravel. »') },
    { id: 'guerre', keys: ['GUERRE'], run: L('serveur', '« Trois ans à Verdun, monsieur, dans les cuisines. J’ai vu l’eau monter dans les tranchées. Je croyais que c’était le pire de ce que l’eau pouvait faire. »') },
    { id: 'docteur', keys: ['DOCTEUR'], run: L('serveur', '« Il y a un médecin au 3, je crois. Un Allemand. Il ne sera pas content d’être réveillé. »') },
    { id: 'police', keys: ['POLICE'], run: L('serveur', '« La police ? Le premier gendarme est à Vallorbe, monsieur. Et je ne suis pas sûr qu’il vous croirait. Je ne suis pas sûr de vous croire moi-même. »') },
    { id: 'ours', keys: ['OURS'], run: L('serveur', ['« L’ours s’appelait Nicolas. Il voyageait avec un dompteur hongrois et buvait du kirsch. L’archiduc, lui, ne buvait que de l’eau. Méfiez-vous des gens qui ne boivent que de l’eau, monsieur. »', '« L’archiduc ? Il a fini au fond d’un lac autrichien, l’année suivante. Un accident de barque, on a dit. Je repense à son eau, parfois. »', '« Je vous ai tout dit sur mes clients illustres, monsieur. Les autres, je les oublie. »']) },
    { id: 'accompagner', keys: ['ACCOMPAGNER'], run: L('serveur', '« Je ne quitte pas mon wagon, monsieur. Jamais. Surtout pas cette nuit. »') },
    { id: 'meta', keys: ['META'], run: L('serveur', '« Je ne connais pas ce mot-là, monsieur. Est-ce que ça se boit ? »') },
    { id: 'contempler', keys: ['CONTEMPLER'], run: L('serveur', '« Monsieur me fixe. Monsieur désire quelque chose ? »') }
  ]);

  // --- Mme Vasseur ---
  SCENE.npcs.veuve.noMore = ['« Je vous ai tout dit, jeune homme. Ou presque. Le presque, je le garde. »', '« Ne soyez pas gourmand. »', '« Pourquoi, pourquoi… Vous avez cinq ans ? »'];
  more('veuve', 'ravel', ['« Il a laissé tomber sa fourchette trois fois. Un homme qui laisse tomber sa fourchette trois fois a peur, ou il est amoureux. Il n’avait pas l’air amoureux. »']);
  more('veuve', 'hommegris', ['« Il ne marchait pas comme vous et moi. Il se déplaçait comme on nage. Lentement, en poussant l’air. »', '« Non, je n’ai pas vu son visage. Et ne me demandez pas si j’aurais voulu. »']);
  more('veuve', 'cartes', ['« La Lune, c’est l’eau qui ment. Le Pendu, c’est celui qui voit le monde à l’envers et qui a raison. La Maison-Dieu, c’est ce qui s’effondre. À l’envers… c’est ce qui remonte. »']);
  more('veuve', 'toimeme', ['« Mon mari fondait des cloches. Des cloches d’église, pour toute la Suisse. Il disait qu’une cloche bien fondue s’entend jusqu’au fond des lacs. Je n’ai jamais su si c’était un compliment. »']);
  more('veuve', 'lac', ['« Ma sœur habite Montreux, face à Chillon. Les nuits sans lune, elle entend des cloches sous l’eau. Des cloches de mon mari, peut-être. Il en a fondu sept pour la région du lac. »']);
  more('veuve', 'train', ['« Nous avons cent cinquante ans à nous deux, ma sœur et moi. Elle en revendique la plus grosse part. »']);
  more('veuve', 'serveur', ['« Il était maître d’hôtel au Ritz, avant la guerre. On ne quitte pas le Ritz pour un wagon. On le quitte parce qu’on a vu quelque chose. »']);
  more('veuve', 'symbole', ['« Mon mari a vu ce signe une fois, gravé à l’intérieur d’une cloche qu’on avait repêchée dans le lac pour qu’il la refonde. Il a refusé. Il est mort la même année. D’un excès de prudence, je vous l’ai dit. »']);
  more('veuve', 'statuette', ['« Je vous ai dit de ne plus en parler. » Elle range ses cartes, les mains un peu moins sûres.']);
  add('veuve', [
    { id: 'mescartes', keys: ['MESCARTES', ['CARTES', 0.5]], chip: 'Lui demander de vous tirer les cartes', chipCond: function (api) { return !api.flag('tarotLucien'); },
      run: function (api, n) {
        if (api.flag('tarotLucien')) { api.npc('veuve', '« Une seule fois par nuit, jeune homme. Les cartes se fatiguent. Moi aussi. »'); return; }
        api.flag('tarotLucien', true);
        api.npc('veuve', 'Elle bat le jeu sans vous quitter des yeux et retourne une seule lame. L’arcane sans nom, le treizième. Mais sur cette carte-là, le squelette n’a pas de faux. Il a des nageoires.');
        api.check('san_tarot');
      } },
    { id: 'jouer', keys: [['JOUER', 1.1]], run: function (api, n) {
        if (api.flag('bataille')) { api.npc('veuve', '« Une partie suffit. Je n’aime pas gagner deux fois, ni perdre une. »'); return; }
        api.flag('bataille', true);
        api.npc('veuve', '« Une bataille, alors. Les jeux d’enfants sont les seuls honnêtes. » Elle distribue le tarot comme un jeu ordinaire.');
        api.check('chance_cartes');
      } },
    { id: 'cloche', keys: ['CLOCHE', 'SOEUR'], run: L('veuve', ['« Les cloches, c’était l’affaire de mon mari. Sept pour le lac, et une qu’il a refusé de refondre. Ne me demandez pas pourquoi. » Elle vous regarde. « Bon. Demandez. »', '« Il disait qu’elle sonnait toute seule, la nuit, dans l’atelier. Qu’elle sonnait de l’intérieur. »']) },
    { id: 'insulte', keys: ['INSULTE'], run: L('veuve', '« Charmant. Mon mari disait pire, et en meilleur français. »') },
    { id: 'embrasser', keys: ['EMBRASSER'], run: L('veuve', ['« Trop tard d’un demi-siècle, jeune homme. Et trop tôt d’un notaire. »', '« Asseyez-vous. Vos mains sont glacées, de toute façon. »']) },
    { id: 'danser', keys: ['DANSER'], run: L('veuve', '« J’ai dansé avec un grand-duc à Saint-Pétersbourg. Vous ne tiendriez pas la comparaison. Asseyez-vous. »') },
    { id: 'chanter', keys: ['CHANTER'], run: L('veuve', '« Si vous chantez, je change de wagon. Et je n’ai pas envie de changer de wagon. »') },
    { id: 'manger', keys: ['MANGER'], run: L('veuve', '« La tarte est infâme. Prenez la terrine. Ou mieux, ne prenez rien. On mange mal quand on a peur. »') },
    { id: 'etat', keys: ['ETAT'], run: L('veuve', function (api) { return api.sanState() >= 2 ? 'Elle vous prend le poignet et compte votre pouls en fronçant les sourcils. « Vous avez regardé quelque chose trop longtemps. Arrêtez de regarder. C’est tout ce qu’il y a à faire. »' : '« La peur, jeune homme ? C’est l’intelligence qui arrive trop tard. Buvez, ça la retarde encore un peu. »'; }) },
    { id: 'passagers', keys: ['PASSAGERS'], run: L('veuve', '« Un évêque, des Anglais qui boivent, des Suisses qui comptent. Et vous. Vous êtes le plus intéressant, ne vous vexez pas, ce n’était pas difficile. »') },
    { id: 'guerre', keys: ['GUERRE'], run: L('veuve', '« Mon neveu est resté au Chemin des Dames. Ne me parlez pas de la guerre, jeune homme. Parlez-moi plutôt de ce qui vous fait peur ce soir. »') },
    { id: 'docteur', keys: ['DOCTEUR'], run: L('veuve', function (api) { return api.sanState() >= 2 ? '« Il y a un médecin allemand au 3. Les nerfs, sa spécialité. À la réflexion, vous devriez peut-être aller le voir. »' : '« Au 3, je crois. Un Allemand. Les nerfs, sa spécialité. »'; }) },
    { id: 'police', keys: ['POLICE'], run: L('veuve', '« La police ? Elle arrive toujours quand c’est fini, jeune homme. C’est son métier. »') },
    { id: 'accompagner', keys: ['ACCOMPAGNER'], run: L('veuve', '« À mon âge, on ne suit plus les hommes dans les couloirs. Plus depuis 1888. »') },
    { id: 'meta', keys: ['META'], run: L('veuve', '« Vous parlez comme mon neveu, celui qui lisait des romans anglais. Il a mal fini. »') },
    { id: 'contempler', keys: ['CONTEMPLER'], run: L('veuve', '« Arrêtez de me fixer comme ça. On dirait mon notaire. »') }
  ]);

  // --- Paolo ---
  SCENE.npcs.conducteur.noMore = ['« C’est tout, signore. »', 'Il bâille à s’en décrocher la mâchoire.'];
  more('conducteur', 'ravel', ['« Il m’a donné cinq francs en montant à Paris, le signor Ravel. Et il m’a dit : “Paolo, si je ne descends pas à Lausanne, ne venez pas me chercher.” Drôle de client. »']);
  more('conducteur', 'hommegris', ['« Il a pas de billet, celui-là. J’ai vérifié la liste deux fois. Au 7, il y a le signor Ravel. Personne d’autre. »']);
  more('conducteur', 'toimeme', ['« L’autre nuit, celle dont je parle pas… C’était en 1919, sur cette ligne. Un compartiment plein d’eau jusqu’au plafond. Fenêtre fermée, porte fermée, et personne dedans. » Il se signe. « Voilà, j’en ai parlé. Content ? Je dors. »']);
  more('conducteur', 'traces', ['« Elle est salée ? Non ? Alors c’est pas la mer. C’est la tuyauterie. Il faut que ce soit la tuyauterie. »']);
  more('conducteur', 'train', ['« À Vallorbe, la douane suisse. Ils regardent les bagages, pas les gens. Heureusement pour certains. »']);
  add('conducteur', [
    { id: 'passagers', keys: ['PASSAGERS', 'DOCTEUR', 'WAGONLITS', ['DORMIR', 0.8]], run: L('conducteur', '« Le 1, des Anglais. Le 2, une dame et son bébé. Le 3, un docteur allemand. Le 4, un évêque qui lit toute la nuit. Le 5, un couple, pas marié, je crois. Le 6, une dame qui veut Lausanne. Le 7, le signor Ravel. Le 8, un monsieur qui ronfle. » Il compte sur ses doigts, recommence. « Il en manque un. Il en manque toujours un, sur cette ligne. »') },
    { id: 'insulte', keys: ['INSULTE'], run: L('conducteur', '« Ehi, signore ! Je suis de Domodossola, pas de Milan. On ne m’insulte pas comme ça. »') },
    { id: 'embrasser', keys: ['EMBRASSER'], run: L('conducteur', '« Signore ! Je suis marié ! Deux fois ! »') },
    { id: 'danser', keys: ['DANSER', 'CHANTER', 'JOUER'], run: L('conducteur', '« Pas de musique dans le couloir. C’est le règlement. Et puis il y a l’évêque. »') },
    { id: 'etat', keys: ['ETAT'], run: L('conducteur', function (api) { return api.sanState() >= 2 ? '« Vous aussi, vous l’entendez ? Le clapotis ? » Il baisse la voix. « Faites comme moi. Dormez. »' : '« Moi aussi, j’ai froid. Tout le monde a froid, ce soir. »'; }) },
    { id: 'guerre', keys: ['GUERRE'], run: L('conducteur', '« L’Isonzo. Douze batailles dans la boue et dans l’eau. Je préfère les wagons-lits. D’habitude. »') },
    { id: 'police', keys: ['POLICE'], run: L('conducteur', '« La police, à Vallorbe. Mais si vous les appelez pour le 7, ils vont me demander mon rapport. Et j’ai pas fait mon rapport. »') },
    { id: 'accompagner', keys: ['ACCOMPAGNER'], run: L('conducteur', '« Moi ? Avec vous ? Au 7 ? » Il rit, sans joie. « Non, grazie. »') },
    { id: 'manger', keys: ['MANGER'], run: L('conducteur', 'Il sort de sa poche un quignon de pain et vous en tend la moitié. « Tenez. Ça fait passer la peur. Un peu. »') },
    { id: 'meta', keys: ['META'], run: L('conducteur', '« Quoi ? Signore, je comprends pas l’anglais. »') }
  ]);

  // ===========================================================================
  // Actions absurdes, extrêmes ou inattendues : le monde répond toujours
  // ===========================================================================
  function here(api) { return api.s.loc; }
  SCENE.globalActions = SCENE.globalActions.concat([
    { id: 'g_etat', label: 'Faire le point sur vous-même', verbs: ['EXAMINER', 'ATTENDRE', 'CONTEMPLER'], nouns: ['ETAT'],
      run: function (api) {
        api.say([
          'Vous allez bien. Fatigué, inquiet pour Ravel, mais lucide. Votre carnet est en ordre, vos mains ne tremblent pas.',
          'Vous allez à peu près bien. Vos mains sont froides, et cette odeur de vase vous colle à la peau. Vous dormirez mal cette nuit, si vous dormez.',
          'Vous n’allez pas bien. Vous vérifiez trois fois que vos poches sont fermées. Vous regardez vos mains, et vous vous demandez depuis quand elles sont mouillées.',
          'Vous ne savez plus très bien ce qui est vrai. Vous vous accrochez à des choses simples : votre nom, la date, le prix du cognac. Lucien Arnaud. Octobre 1923. Trois francs. Lucien Arnaud.'
        ][api.sanState()]);
      } },
    { id: 'g_contempler', label: 'Contempler la spirale', verbs: ['CONTEMPLER', 'EXAMINER'], nouns: ['SERVIETTE'], boost: 0.15,
      cond: function (api) { return api.has('SYMBOLE'); },
      ideaCond: function (api) { return api.has('SYMBOLE'); },
      run: function (api, p) {
        if (p && p.c.CONTEMPLER === undefined && p.c.ETAT === undefined && api.s.loc === 'restaurant') { api.exec('r_serviette'); return; }
        var n = api.flag('spirale') || 0;
        if (n >= 3) { api.say('Vous dépliez la serviette et vous la repliez aussitôt. Vous avez compris tout ce que vous pouviez supporter de comprendre.'); return; }
        api.say(['Vous fixez la spirale. Elle ne bouge pas, bien sûr. Mais plus vous la regardez, plus vous avez l’impression de descendre.', 'Vous recommencez. Vous savez que vous ne devriez pas. La spirale vous attendait.', 'Une dernière fois. Le wagon s’éloigne, les bruits s’éteignent, il ne reste que l’encre et le centre de l’encre.'][n]);
        api.check('san_spirale');
      } },
    { id: 'g_danser', needVerb: true, label: 'Danser', verbs: ['DANSER'], bare: true, nouns: ['SALLE'],
      run: function (api) {
        var t = { restaurant: 'Vous esquissez un pas de fox-trot entre les tables. La vieille dame applaudit sans conviction. Le serveur regarde ailleurs, avec une grande dignité.', couloir: 'Vous dansez dans le soufflet, et le soufflet danse avec vous. C’est presque drôle. Presque.', lits: 'Trois pas de charleston dans le couloir. Le conducteur ouvre un œil, le referme.' }[here(api)] || 'Vous dansez.';
        api.say(t + (api.sanState() >= 2 ? ' Vous vous arrêtez net : dans l’eau du plancher, votre reflet a continué de danser.' : ''));
      } },
    { id: 'g_chanter', label: 'Chanter', verbs: ['CHANTER'], bare: true,
      run: function (api) {
        if (here(api) === 'restaurant') api.say('Vous fredonnez un air de Mistinguett. La vieille dame reprend le refrain, faux, puis s’arrête net, comme si quelqu’un d’autre chantait aussi, quelque part sous le plancher.');
        else api.say('Votre voix sonne étrangement dans le train, étouffée, comme sous une cloche. Vous vous taisez.');
      } },
    { id: 'g_manger', needVerb: true, label: 'Manger quelque chose', verbs: ['MANGER'], bare: true, nouns: ['SERVIETTE', 'CARTES', 'CENDRIER', 'BOISSON', 'TABLE', 'MANCHETTE', 'TELEGRAMME'],
      run: function (api, p) {
        if (p && p.c.SERVIETTE !== undefined) { api.say(api.sanState() >= 3 ? 'Vous mâchez un coin de la serviette avant de vous en rendre compte. Elle a le goût du fond d’un lac. Vous la recrachez, et l’encre a coulé sur votre langue.' : 'Vous portez la serviette à votre bouche. Elle a un goût de vase. Vous vous arrêtez à temps, et vous vous demandez ce qui vous a pris.'); return; }
        if (p && (p.c.CENDRIER !== undefined || p.c.MANCHETTE !== undefined || p.c.TELEGRAMME !== undefined)) { api.say('Non. Même ce soir, non.'); return; }
        if (here(api) === 'restaurant') { api.talk('serveur', p); return; }
        api.say('Vous n’avez pas faim. Vous n’avez plus faim depuis Dole.');
      } },
    { id: 'g_deshabiller', label: 'Se déshabiller', verbs: ['DESHABILLER'], bare: true,
      run: function (api) { api.say('Vous défaites votre cravate, puis le bon sens reprend le dessus. On ne se déshabille pas dans un train de la Compagnie. Pas avant Lausanne.'); } },
    { id: 'g_sauter', needVerb: true, label: 'Sauter du train', verbs: ['SAUTER'], bare: true, nouns: ['FENETRE', 'TRAIN', 'SOUFFLET'],
      run: function (api) { api.say('La nuit défile à quatre-vingts kilomètres à l’heure, noire, pleine de sapins. Vous reculez. L’idée vous a traversé l’esprit une seconde, et c’est cela, plus que tout, qui vous effraie. Ce n’est pas une idée à vous.'); } },
    { id: 'g_alarme', needVerb: true, label: 'Tirer le signal d’alarme', verbs: ['ALARME'], nouns: ['TRAIN'], bare: true, extraVerbs: ['OUVRIR', 'PRENDRE'],
      run: function (api) {
        if (here(api) === 'restaurant') api.say('Vous posez la main sur la poignée rouge du signal d’alarme. « Cent francs d’amende, monsieur », dit le serveur sans se retourner. Et puis, arrêter le train ici, en pleine forêt, dans le noir, avec ce qui marche peut-être le long des voies… Vous lâchez la poignée.');
        else api.say('Vous posez la main sur la poignée rouge du signal d’alarme. Arrêter le train ici, en pleine forêt, avec ce qui marche peut-être le long des voies… Vous lâchez la poignée. Mieux vaut que le train roule.');
      } },
    { id: 'g_casser', needVerb: true, label: 'Casser quelque chose', verbs: ['CASSER'], bare: true, nouns: ['VERRE', 'FENETRE', 'TABLE', 'PORTE', 'LAMPE', 'SEPT', 'COMPARTIMENT', 'CARTES'],
      run: function (api, p) {
        if (p && p.c.VERRE !== undefined && here(api) === 'restaurant' && !api.flag('verreCasse')) {
          api.flag('verreCasse', true);
          api.say('Le ballon de Ravel éclate sur le tapis. Le cognac s’étale, et l’eau qu’il contenait aussi : bien plus d’eau qu’un verre ne peut en contenir. Le serveur, livide, vient éponger sans un mot.');
          api.npcs('serveur').att -= 1; return;
        }
        if (p && (p.c.SEPT !== undefined) && here(api) === 'lits') { api.say('Vous prenez votre élan contre la porte 7. Elle s’ouvre avant que votre épaule ne la touche.'); finale(api); return; }
        if (p && p.c.FENETRE !== undefined) { api.say('Vous levez le coude vers la vitre, puis vous imaginez la pluie entrer, et avec elle ce qui marche dehors. Vous baissez le bras.'); return; }
        if (p && p.c.CARTES !== undefined) { api.say('Vous tendez la main vers le tarot. La vieille dame la tapote d’un éventail fermé, sans lever les yeux. « Non. »'); return; }
        api.say('Vous n’êtes pas venu pour casser, mais pour comprendre. Même si les deux se ressemblent de plus en plus, ce soir.');
      } },
    { id: 'g_bruler', needVerb: true, label: 'Brûler quelque chose', verbs: ['BRULER'], nouns: ['SERVIETTE', 'CARTES', 'TABLE', 'TELEGRAMME', 'TRAIN'], bare: true,
      run: function (api, p) {
        if (p && p.c.SERVIETTE !== undefined && (api.item(SERVIETTE) || here(api) === 'restaurant')) {
          if (api.once('brulerServ')) { api.say('Vous approchez une allumette de la serviette. Le tissu refuse de prendre : il est trempé, toujours, comme s’il sortait de l’eau. L’allumette s’éteint avec un sifflement. Dans votre dos, la vieille dame soupire : « Évidemment. »'); api.fx('flicker'); }
          else api.say('Elle ne brûlera pas. Vous le savez, maintenant.');
          return;
        }
        if (p && p.c.TELEGRAMME !== undefined) { api.say('Vous approchez le télégramme d’une flamme, puis vous vous ravisez. C’est la seule preuve que Ravel vous a appelé.'); return; }
        api.say('Mettre le feu à un train en marche ? Ce n’est pas l’homme en gris qui en souffrirait.');
      } },
    { id: 'g_prier', label: 'Prier', verbs: ['PRIER'], bare: true,
      run: function (api) {
        if (api.sanState() >= 2) api.say('Vous murmurez un Notre Père. Au milieu de la prière, vous vous apercevez que vous récitez autre chose, des syllabes mouillées que vous n’avez jamais apprises. Vous vous taisez.');
        else api.say('Vous murmurez un Notre Père. Les mots vous paraissent minuscules, une bougie dans une cathédrale engloutie. Ça fait du bien, un peu.');
      } },
    { id: 'g_magie', label: 'Tenter un sortilège', verbs: ['MAGIE'], bare: true,
      run: function (api) { api.say('Vous n’êtes qu’un journaliste. Et, pour être honnête, vous n’avez aucune envie de savoir ce qui répondrait si vous appeliez.'); } },
    { id: 'g_arme', label: 'Chercher une arme', verbs: ['PRENDRE', 'FOUILLER', 'UTILISER', 'EXAMINER'], nouns: ['ARME'],
      run: function (api) {
        if (api.item('Un couteau à poisson')) { api.say('Le couteau à poisson est dans votre poche. Ridicule. Et pourtant, vous le serrez.'); return; }
        if (here(api) === 'restaurant') { api.take('Un couteau à poisson'); api.say('Vous empochez discrètement un couteau à poisson sur une table voisine. Il ne vous rassure pas autant que prévu.'); return; }
        api.say('Vous n’avez pas d’arme. Un carnet, un crayon, un étui à cigarettes. Le reste, il faudra le trouver en vous.');
      } },
    { id: 'g_cacher', label: 'Se cacher', verbs: ['CACHER'], bare: true,
      run: function (api) { api.say('Se cacher de quoi, et où ? Dans un train, il n’y a que des couloirs, et ils mènent tous quelque part.'); } },
    { id: 'g_jouer', needVerb: true, label: 'Jouer aux cartes', verbs: ['JOUER'], bare: true, nouns: ['CARTES'],
      run: function (api, p) { if (here(api) === 'restaurant') api.talk('veuve', p); else api.say('Personne ne joue, ici. Pas à un jeu que vous connaissez.'); } },
    { id: 'g_embrasser', label: 'Embrasser quelqu’un', verbs: ['EMBRASSER'], bare: true,
      run: function (api) { api.say('Il n’y a personne à embrasser ici, et c’est peut-être mieux ainsi.'); } },
    { id: 'g_insulte', label: 'Jurer', verbs: ['INSULTE'], bare: true,
      run: function (api) { api.say('Vous jurez entre vos dents. Ça ne fait pas avancer l’enquête, mais ça soulage.'); } },
    { id: 'g_meta', label: 'Question sur le jeu', nouns: ['META'],
      run: function (api) { api.sys('Ce prototype est entièrement scripté : aucune IA ne répond, chaque réplique a été écrite à l’avance. Décrivez ce que fait Lucien, comme à une table de jeu.'); } },
    { id: 'g_police', label: 'Appeler la police', verbs: ['PARLER', 'CRIER', 'EXAMINER', 'FOUILLER'], nouns: ['POLICE'],
      run: function (api) { api.say('Il n’y a pas de téléphone dans un train de 1923, et le premier gendarme vous attend à Vallorbe, avec sa moustache et ses formulaires. D’ici là, vous êtes seul.'); } },
    { id: 'g_docteur', label: 'Chercher un médecin', verbs: ['PARLER', 'CRIER', 'FOUILLER', 'EXAMINER'], nouns: ['DOCTEUR'],
      run: function (api) { api.say(here(api) === 'lits' ? 'Un médecin ? Le conducteur doit savoir qui dort derrière chaque porte.' : 'Un médecin ? Le serveur ou le conducteur des voitures-lits sauront s’il y en a un à bord.'); } },
    { id: 'g_passagers', label: 'Observer les passagers', verbs: ['EXAMINER', 'FOUILLER'], nouns: ['PASSAGERS'],
      run: function (api) { api.say(here(api) === 'restaurant' ? 'À cette heure, il ne reste que vous, la vieille dame et le serveur. Les autres dorment, ou font semblant.' : 'Les autres passagers dorment derrière leurs portes. Ou font semblant.'); } },
    { id: 'g_suite', label: 'Réfléchir', nouns: ['SUITE'],
      run: function (api) { api.say('Vous repassez les faits dans votre tête. ' + (api.s.clues.length ? 'Vous avez ' + api.s.clues.length + ' indice' + (api.s.clues.length > 1 ? 's' : '') + ' dans votre carnet.' : 'Votre carnet est encore vide.') + ' Ravel n’est pas venu. Quelqu’un est venu à sa place.'); api.ui('notes'); } }
  ]);


  // ===========================================================================
  // Patience des PNJ : on ne se répète jamais, on s'agace, puis on ferme la porte
  // ===========================================================================
  Object.assign(SCENE.npcs.serveur, {
    patience: 6, cooldown: 8,
    repeat: [
      ['« Comme je le disais à monsieur… »', '« Je l’ai déjà dit, monsieur. Je peux le redire plus lentement, si monsieur le souhaite. »', 'Il marque une pause polie, de celles qu’on réserve aux clients qui n’écoutent pas. « Je viens de vous le dire, monsieur. »'],
      ['« Monsieur a la mémoire courte, ce soir. »', 'Il soupire par le nez, longuement, comme seuls savent le faire les maîtres d’hôtel.', '« Je ne vais pas vous le répéter une quatrième fois, monsieur. »'],
      ['Il ne répond pas. Le torchon tourne dans le verre, encore et encore.', 'Bastien regarde un point situé quelque part au-dessus de votre épaule.', 'Silence. Il range une cuillère qui n’en avait pas besoin.']
    ],
    deflect2: ['« Monsieur, je ne vous suis pas du tout. »', 'Il cligne des yeux, lentement. « Pardon ? »', '« Si monsieur pouvait parler français… » Il se reprend aussitôt. « Pardon. La fatigue. »'],
    deflect3: ['Il ne fait même plus semblant d’écouter.', '« Hm. »', 'Il hausse un sourcil, puis retourne à ses verres.'],
    close: ['Bastien repose son verre. « Si monsieur veut bien m’excuser, j’ai du service. » Il vous tourne le dos et disparaît derrière son comptoir.', '« Je crois que nous avons fait le tour, monsieur. » Il s’éloigne vers l’office sans attendre votre réponse.'],
    refuse: ['« Pas maintenant, monsieur. »', 'Bastien fait mine de ne pas vous voir.', 'Il ne lève même pas les yeux. Le dos de son gilet est une réponse suffisante.', 'Rien. Bastien a décidé que vous n’existiez plus, pour quelques minutes au moins.'],
    reopen: 'Bastien vous voit revenir et ferme les yeux une demi-seconde. « Monsieur ? »',
    greetAlt: ['Il lève les yeux. « Monsieur. »', '« Monsieur désire autre chose ? »', 'Il pose son torchon sur l’épaule et attend.'],
    byeAlt: ['« Monsieur. »', 'Il se contente d’un signe de tête.', '« À votre service. » Le ton dit le contraire.']
  });
  Object.assign(SCENE.npcs.veuve, {
    patience: 8, cooldown: 10,
    repeat: [
      ['« Je radote, ou c’est vous ? »', '« Je vous l’ai dit. À mon âge, on a le droit de radoter. Au vôtre, non. »', '« Vous m’avez déjà posé la question, jeune homme. Je m’en souviens, moi. »'],
      ['Elle pose une carte, très lentement, sans vous regarder. « Encore ? »', '« Vous tournez en rond comme un cheval de manège. »', 'Elle tapote la table de ses bagues, un rythme agacé.'],
      ['Elle ne répond plus. Elle retourne une carte, puis une autre.', 'Elle fredonne quelque chose, très bas, pour ne pas vous entendre.', 'Silence. Elle a décidé de vous traiter comme un courant d’air.']
    ],
    deflect2: ['« Vous vous fatiguez, jeune homme. Moi aussi. »', '« Hm ? Je n’écoutais pas. Vous non plus, apparemment. »', 'Elle hausse une épaule osseuse.'],
    deflect3: ['Elle ne lève pas les yeux.', '« … »', 'Elle retourne une carte. La Lune, encore.'],
    close: ['« Allez donc vous rendre utile ailleurs, jeune homme. Revenez quand vous aurez une vraie question. » Elle ramasse ses cartes, et c’est terminé.', 'Elle referme son jeu d’un geste sec. « Assez. Allez marcher. Les jeunes gens réfléchissent mieux en marchant. »'],
    refuse: ['« Pas maintenant. Je fais une réussite, et vous me portez malheur. »', 'Elle lève une main baguée, sans un regard : pas maintenant.', 'Mme Vasseur fait comme si vous étiez transparent. Elle a de l’entraînement.', 'Elle ne répond pas. Elle a toute la nuit, et visiblement pas pour vous.'],
    reopen: '« Tiens. Le revenant. Asseyez-vous, et tâchez d’être intéressant, cette fois. »',
    greetAlt: ['« Vous revoilà. »', 'Elle vous désigne la chaise d’un mouvement de menton.', '« Asseyez-vous. Vous faites des courants d’air. »'],
    byeAlt: ['« C’est cela. »', 'Elle agite deux doigts, sans lever les yeux.', '« Méfiez-vous des sept. »']
  });
  Object.assign(SCENE.npcs.conducteur, {
    patience: 4, cooldown: 6,
    repeat: [
      ['« Je vous l’ai dit, signore ! »', '« Mamma mia, encore ? »', '« Signore, je me répète, et je déteste me répéter. »'],
      ['Il se frotte les yeux avec une lenteur exagérée.', '« Vous voulez me rendre fou ? Il y en a assez d’un, ce soir. »', 'Il soupire et regarde sa montre, très ostensiblement.'],
      ['Il ronfle. Il fait semblant, mais il ronfle.', 'Il a rabattu sa casquette sur ses yeux. Pour lui, la conversation est finie.', 'Rien. Paolo s’est changé en statue de la Compagnie.']
    ],
    deflect2: ['« Hein ? »', '« Signore, je dors debout. Assis, même. »', 'Il grommelle quelque chose en piémontais.'],
    deflect3: ['Il ne répond pas.', '« Zzz. » Il le dit, il ne le fait pas.', 'Il vous tourne à moitié le dos sur son strapontin.'],
    close: ['« Basta ! » Il rabat sa casquette sur ses yeux et croise les bras. « Je dors. Je ne suis pas là. Je suis à Domodossola. »', 'Il se lève, s’étire, et va s’asseoir trois mètres plus loin, le dos tourné. La conversation est terminée.'],
    refuse: ['« Non, non, non. Je dors. »', 'Paolo ronfle, d’un ronflement trop régulier pour être honnête.', 'Il ne bouge pas. Même ses paupières ont décidé de vous ignorer.', 'Rien. Le strapontin grince, c’est tout.'],
    reopen: 'Il ouvre un œil. « Encore vous. Bon. Qu’est-ce qu’il y a ? »',
    greetAlt: ['« Signore ? »', 'Il soulève sa casquette d’un doigt. « Quoi encore ? »', 'Il bâille. « Oui ? »'],
    byeAlt: ['« Buona notte. »', 'Il marmonne quelque chose qui ressemble à « enfin ».', '« Ciao, signore. »']
  });

  G.SCENE = SCENE;
  SCENE.short = 'Prologue';
  SCENE.examples = '« j’examine la table », « je fouille le cendrier », « je parle à la vieille dame », « je vais dans le couloir »';
  SCENE.people = {
    serveur: 'Bastien, maître d’hôtel du wagon-restaurant. Dix-sept ans de métier, et peur de quelque chose.',
    veuve: 'Mme Irène Vasseur, veuve d’un fondeur de cloches. Lit le tarot, voit plus qu’elle ne dit.',
    conducteur: 'Paolo, conducteur des voitures-lits, de Domodossola. Dort beaucoup, et pour cause.'
  };
  G.CHAPTERS = G.CHAPTERS || {};
  G.CHAPTERS.prologue = SCENE;
})(typeof window !== 'undefined' ? window : globalThis);
