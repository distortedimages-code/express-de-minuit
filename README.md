# L'Express de Minuit — génération des illustrations

Ce dépôt génère les illustrations du jeu (les 56 d'origine, puis les nouvelles : Mrs Vane, la séance, les supports des documents) avec l'API Images d'OpenAI, directement sur les serveurs de GitHub.
Rien ne passe par le navigateur : la clé reste un secret GitHub, lu uniquement par l'étape de génération.

Aucune image n'est jamais affichée. Les rapports ne contiennent que du texte : des noms de fichiers, des contrôles et des coûts.

## Contenu

| Fichier | Rôle |
|---|---|
| `.github/workflows/illustrations.yml` | le workflow « Illustrations », à lancer à la main |
| `illustrations/generer.py` | le générateur : lots, reprise, budget, recadrage, contrôles |
| `illustrations/plan.json` | toutes les images dans l'ordre, avec leurs portraits de référence |
| `illustrations/prompts/…` | un prompt par image, style commun inclus |
| `illustrations/prompt_negatif.txt` | ce qu'il faut éviter, ajouté à chaque prompt |
| `illustrations/personnages.txt`, `style_commun.txt` | les fiches des personnages et le style, pour mémoire |

## Une seule fois : ajouter la clé OpenAI

Sur iPhone, dans Safari, ouvrez le dépôt sur github.com :

1. **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**.
3. Nom : `OPENAI_API_KEY`. Valeur : votre clé OpenAI. Puis **Add secret**.

Si **Settings** n'apparaît pas, touchez **aA** dans la barre d'adresse, puis **Demander le site pour ordinateur**.

GitHub masque la clé dans tous les journaux, et personne ne peut la relire, pas même vous. Le mode simulation n'en a pas besoin.

## Lancer le workflow depuis l'iPhone

Avec l'app **GitHub** :

1. Ouvrez le dépôt → **Actions** → **Illustrations**.
2. Touchez **Run workflow**.
3. Réglez les options, puis validez.

Dans Safari, c'est la même chose : onglet **Actions** → **Illustrations** → bouton **Run workflow**.

| Option | Effet |
|---|---|
| **simulation** | cochée par défaut : **gratuite**, aucun appel à OpenAI. Elle produit des images abstraites factices, sert à tout vérifier et garde son propre état. **Décochez-la pour la vraie génération payante.** |
| **lot** | `5` génère les 5 images suivantes ; `tout` génère tout ce qui reste |
| **plafond** | budget total en dollars, tous lancements confondus (20 par défaut) |
| **qualite** | `high` par défaut ; `medium` est nettement moins cher (environ 0,09 $ estimés par image) |
| **modele** | `gpt-image-2.5-sunburst` par défaut |
| **refaire** | facultatif : un ou plusieurs noms, séparés par des virgules, par exemple `01_smith` ou `01_smith,03_beddows` |

Un seul lancement tourne à la fois. Un second attend la fin du premier.

## Ordre conseillé

1. **Simulation, lot tout.** C'est gratuit et vérifie tout le circuit, jusqu'au ZIP final factice nommé `SIMULATION_…`.
2. **Réel, lot 5.** Coût estimé : environ 1,25 $. Le résumé donne ensuite le vrai coût par image, et les estimations suivantes s'y ajustent.
3. **Réel, lot tout.** Il génère tout le reste, dans la limite du plafond.

## Suivre un lancement

Touchez le lancement dans la liste, puis la page **Summary**. Elle indique :

- l'avancement, sur le nombre total d'images ;
- le coût de chaque image et le total dépensé, comparé au plafond ;
- les échecs et les avertissements des contrôles.

## Le budget

- **Avant un lot :** si la dépense déjà faite plus le coût estimé du lot dépasse le plafond, rien n'est généré.
- **Avant chaque image :** le même calcul est refait. Le lancement s'arrête net s'il ferait dépasser le plafond.
- **Comment le coût est calculé :**
  - Avant la première vraie image, l'estimation est prudente : environ 0,25 $ par image en `high`, plus 0,03 $ par portrait de référence envoyé.
  - Ensuite, le coût réel vient de la consommation renvoyée par OpenAI, aux tarifs publiés : 5 $ par million de jetons de texte, 8 $ par million de jetons d'image en entrée, 30 $ par million de jetons d'image en sortie.
  - L'estimation suit alors la plus chère des images déjà faites.
- **Limite :** le plafond ne peut être dépassé que de l'écart entre l'estimation et le coût réel d'une seule image.

## Reprise

Après chaque image, l'état est sauvegardé : images terminées, coûts, échecs. Il est rangé dans un artifact nommé `etat-illustrations` (`etat-simulation` pour la simulation), et le lancement suivant repart de là.

La reprise fonctionne aussi après :

- une interruption volontaire (**Cancel workflow**) ;
- une panne ;
- la limite de durée d'environ 4 h 45 par lancement.

Une image refusée par OpenAI ou ratée est simplement retentée au lancement suivant.

## Le ZIP final

Quand toutes les images sont prêtes, le lancement joint un artifact **`L_Express_de_Minuit_illustrations`**. Pour le télécharger :

1. Ouvrez le lancement dans Safari, au besoin en version ordinateur.
2. Descendez jusqu'à **Artifacts**.
3. Touchez le nom pour télécharger le ZIP.

Si l'app GitHub n'affiche pas cette section, passez par Safari. Le ZIP reste disponible 30 jours.

Contenu du ZIP : `illustrations-express-de-minuit/` avec `ecran-titre/`, `londres/`, `portraits/` et `prologue/`, plus `documents/` pour les supports des documents. Ce sont tous les PNG, au format cinéma (documents en 1600 × 1200), sous les noms exacts que le jeu attend.

## Comment les images sont faites

- **Une image par appel.** Chaque appel envoie le prompt existant, tel quel, et demande une seule image : pas de planche, pas de collage.
- **Format :** 2304 × 960 (2,4:1), qu'OpenAI accepte directement.
  - Si un modèle refusait ce format, le générateur demanderait du 1536 × 1024.
  - Il recadrerait ensuite au bon format, en coupant la partie la moins détaillée.
  - Enfin, il mettrait l'image à l'échelle uniformément. Elle n'est jamais déformée.
- **Personnages récurrents :** leurs portraits sont générés en premier. Ils sont ensuite joints comme références d'identité aux scènes où ces personnages reviennent : Smith, Beddows, Fleming, Mustapha, le sergent Hobbs, Butter, Pike, etc. (voir `plan.json`).
- **Contrôles automatiques, écrits en texte :**
  - dimensions ;
  - nombre de fichiers ;
  - noms ;
  - doublons ;
  - image vide ;
  - noir et blanc avec une touche de rouge carmin ;
  - bandes du haut et du bas assez calmes pour l'interface du jeu.

  Seuls les vrais défauts (image vide, doublon) rejettent une image. Les autres points sont signalés « à vérifier ».

## Le format des images

Depuis la version 2 du plan, les illustrations sont générées au format cinéma 2,4:1, en **2304 × 960**, comme le cadre du jeu. Les supports de documents restent en 1600 × 1200, parce qu'ils s'affichent en entier dans le dossier de l'enquêteur.

Une image produite dans une version plus ancienne du plan est considérée comme à refaire : il suffit de lancer **lot = tout** pour tout régénérer au nouveau format. L'ancienne version reste en place tant que la nouvelle n'est pas prête.

## Les supports des documents

Les images de `documents/` (coupure de journal, télégramme, lettre, carte de visite…) sont générées **sans aucun texte**. Le jeu compose le texte par-dessus, dans des polices d'époque : il est donc toujours exact, et corrigeable sans rien regénérer.

## Refaire une image

Lancez le workflow en mode réel avec **refaire** = une partie du nom, par exemple `13_butter`.

- L'ancienne version reste en place tant que la nouvelle n'est pas réussie.
- Les scènes qui utilisaient ce portrait comme référence ne sont pas refaites automatiquement. Ajoutez-les à **refaire** si besoin.

## La branche « rendus »

Après chaque vraie génération, le workflow **Rendus** publie les images terminées sur la branche `rendus` du dépôt. C'est gratuit : il n'appelle jamais OpenAI. Claude peut ainsi les récupérer lui-même pour les intégrer au jeu. Les simulations ne sont jamais publiées.

## Stockage GitHub

Un dépôt privé gratuit dispose de 500 Mo pour les artifacts. L'état complet et le ZIP final pèsent chacun environ 200 Mo. Le workflow efface donc automatiquement les anciennes copies : il ne garde que le dernier état et le dernier ZIP.

## Tester en local, sans rien payer

```
cd illustrations
pip install -r requirements.txt
python generer.py --simulation --lot tout
```

## Les mots que le jeu comprend

Le jeu tolère les fautes de frappe : « tabel » devient « table ». Mais un vrai mot français ne doit jamais être pris pour un autre (« je me rends » n’est pas « je prends », « hommes » n’est pas « comment »). La liste `jeu/src/mots.js` contient environ 24 000 vrais mots français qui ressemblent à un mot du jeu sans en être : pour eux, aucun rapprochement. Après avoir ajouté beaucoup de vocabulaire au jeu, on la régénère avec les scripts de `jeu/tools/garde_mots/` (`liste_fr.py`, puis `audit.js`).

## La mémoire du joueur

Le jeu se souvient des quatre dernières personnes ou choses dont il a été question. « Je regarde la vieille dame », puis « je lui parle » : c’est à elle qu’on parle. « Lui », « leur », « avec elle » et les verbes de conversation désignent une personne ; « la », « le », « l’ » peuvent désigner un objet (« j’examine la table », puis « je la fouille »). Une action déjà faite n’est pas redite en entier : le Gardien rappelle qu’on l’a déjà faite et résume ce qu’on avait vu. Vérification : `node jeu/tools/test_pronoms.js`.

## Les idées et les sujets

Les idées (hors conversation) et les sujets (en conversation) sont repliés par défaut, et se replient après chaque geste. Quand on en choisit un, le Gardien reformule l’action (« Vous vous adressez au professeur Smith », « Vous interrogez Mme Vasseur sur son tarot ») : c’est `jeu/src/mj.js`.

Une suggestion de sujet n’apparaît que si ce sujet a déjà été abordé avec ce personnage : vous l’avez nommé devant lui, ou lui-même en a parlé. Les choses qu’on a sous les yeux comptent aussi (la table de Ravel, le serveur), et les gestes restent toujours proposés (prendre congé, glisser un pourboire, l’interroger sur lui-même). Ainsi, la vieille dame ne propose « l’homme qui est venu le chercher » qu’après avoir dit qu’un autre homme était venu. Vérification : `node jeu/tools/test_suggestions.js`.

## Dire et Agir

Deux boutons envoient ce qu'on écrit. **Dire** : les paroles du personnage, mot pour mot ; le moteur n'en tire jamais un geste (« je vous étrangle », dit tout haut, est une menace). Hors conversation, la parole va à la personne qu'on nomme (« Bastien, … »), ou à la seule présente ; sinon le Gardien demande à qui l'on parle. **Agir** : ce que fait le personnage, gestes, déplacements, et aussi « je lui demande… ». La touche Entrée utilise le bouton mis en avant : Dire en conversation, Agir le reste du temps. Dans le code : `game.step(texte, 'dire')` ou `game.step(texte, 'agir')`. Vérification : `node jeu/tools/test_dire.js`.

## Le moteur de dialogue

Plusieurs règles générales évitent qu'un personnage réponde à côté :

- **L'allure.** « J'adore vos moustaches », « joli chapeau », « mon manteau » parlent de l'apparence de quelqu'un, jamais d'un personnage qu'on reconnaît à ce détail (l'homme à la moustache, l'homme au chapeau). Seule une référence définie le désigne : « l'homme au chapeau », « le moustachu ».
- **Le sujet de la phrase.** Un sujet écrit ne se déclenche que s'il porte sur ce que la phrase nomme : « où est Camberwell ? » parle de Camberwell.
- **L'écho juste.** Une réplique qui reprend la question (« Un homme qui nous observe ? ») ne garde cette reprise que si le joueur a dit ces mots. Quand le personnage ne connaît pas un nom, il répète le mot du joueur, pas une étiquette du jeu.
- **Le récit.** « J'ai essayé de l'étrangler », « si je le frappais », « je ne vais pas vous tuer », « il m'a menacé » racontent, supposent ou nient : aucun geste n'est joué. Le personnage réagit à l'aveu ou écoute le récit, selon ce qu'il est (policier, bourgeois, homme du peuple).
- **Oui et non.** Seul un vrai oui ou un vrai non répond à une question qu'un personnage vient de poser.
- **La conversation de tous les jours.** La soirée, le sommeil, les livres, la table, les voyages, la santé ont leurs réponses, par milieu.

**Le fil de l'intrigue** (`fils`, dans `jeu/src/fiches.js`) : quand le joueur s'égare deux fois de suite avec un personnage important, celui-ci revient de lui-même à ce qui compte, par une remarque dans sa voix (« Vous regardez sans cesse la salle, mon ami. Quelqu'un vous inquiète ? »). Une amorce par sujet, jamais deux de suite, jamais sur un sujet déjà abordé, et jamais par-dessus une question qu'il vient de poser.

Vérifications : `node jeu/tools/test_realisme.js` (phrases pièges), `node jeu/tools/test_fil.js` (retours à l'intrigue).

## Les verrous du moteur

Trois protections générales, dans le moteur, évitent d'avoir à corriger les dialogues au cas par cas :

- **Le verrou des faits** (`faits`, dans `jeu/src/londres_circuits.js`). Chaque événement daté de l'intrigue est déclaré une fois : les mots qui en parlent, et la condition pour qu'il existe (l'incendie : samedi 23 h). Tant qu'il n'existe pas, aucune réplique d'aucun personnage ne peut le mentionner. Si le joueur en parle lui-même, le personnage s'étonne (« Quel incendie ? »). Vérification : `node jeu/tools/test_chrono.js`.
- **Le terrain commun.** Un pronom (« je l'ai vu ») ne désigne quelqu'un, pour un personnage, que si on a déjà parlé de cette personne avec lui. La phrase qui ouvre une conversation passe par les mêmes garde-fous que les suivantes. Un mot qui est à la fois un nom et un verbe conjugué (« ne porte-t-il pas plainte ») n'est pas pris pour le nom.
- **Le récit.** Passé, hypothèse, négation, troisième personne : rien n'est joué (voir plus haut).
- **Le discours rapporté.** « Dire qu'on est de la police », « je lui réponds que… », « me faire passer pour un médecin » : ce qui suit est une parole. Elle est dite à l'interlocuteur, ou à la seule personne présente ; sinon le Gardien demande à qui.
- **La question en suspens.** Un personnage qui vient de parler doit pouvoir entendre « oui », « non », « peut-être » ou « d'accord » : plus jamais « je n'ai pas saisi ». Le moteur retient, à chaque réplique, si c'était une question, de quelle sorte, et d'où elle venait. Une amorce du fil de l'intrigue (« Vous avez vu, n'est-ce pas ? ») : la réponse ouvre le sujet que le personnage voulait aborder. Une offre écrite (« cinquante francs la journée ») : le sujet dit quoi faire d'un oui ou d'un non (`oui:` et `non:` sur le sujet). Une réplique écrite : « oui » fait venir la suite du même sujet. Une question ouverte (« Que puis-je pour vous ? ») : « oui » n'y répond pas, on vous demande « Mais encore ? ». Une simple affirmation : on acquiesce ou l'on doute, et le personnage prend acte dans son ton. Sans rien de tout cela, il s'étonne (« À quoi répondez-vous ? »). Une question restée sans réponse s'éteint au tour suivant. Vérification : `node jeu/tools/test_bref.js` (le cas de Smith et de ses photographies, puis oui, non, peut-être et d'accord devant chaque personnage des trois chapitres).
- **Assez de mots compris.** Une longue phrase (quatre vrais mots ou plus) ne déclenche pas un geste sur un seul mot reconnu : le Gardien dit qu'il n'est pas sûr et propose des choix.

## Le chapitre 2 : Paris (première partie)

`jeu/src/paris.js` : la gare du Nord, l'hôtel du Cygne, la Bibliothèque nationale, la bibliothèque de l'Arsenal, la maison de santé de Charenton et un café. On y suit le comte Fenalik de la cour de 1789 jusqu'à une cave de Charenton, puis la mort récente du directeur de l'asile. La partie s'arrête au départ du train pour Poissy ; Poissy fera la seconde partie. La trame suit la campagne ; tous les textes sont écrits pour le jeu.

- **Enchaînement.** La campagne se joue dans l'ordre, avec le même investigateur : le chapitre 2 ne s'ouvre qu'une fois Londres fini (fin normale, ou en fugitif). Le bouton « Continuer : Paris » de la fin de Londres reprend l'investigateur tel quel : santé mentale, points de vie, compétences, Mythe, possessions, argent. L'écran-titre ne propose « Chapitre 2 : Paris » qu'avec les investigateurs qui ont fini Londres sur cet appareil (enregistrés dans le navigateur) ; une sauvegarde en fichier d'une partie de Londres finie le débloque aussi, sur n'importe quel appareil. « Rejouer le chapitre » repart de l'investigateur tel qu'il est arrivé à Paris.
- **Le passé.** La fin de Londres laisse à l'investigateur un passé (`pc.passe.londres`) : la date et l'heure du départ, les indices, les documents, les gens rencontrés et quelques faits (`L.memoire` : le discours de Smith, l'imposteur démasqué, Stanley sauvé ou non, la fin en fugitif…). Paris commence le jour du départ de Victoria, sept heures quarante plus tard ; l'arrivée raconte la liste de Smith telle qu'on l'a obtenue (dictée, ou ramassée dans les cendres), les doutes nés à Londres, les cauchemars de Stanley. Un fugitif est prévenu à l'arrivée, et sa première arrestation à Paris le renvoie à Scotland Yard. L'actualité suit la date : avant le jeudi 11 janvier, on attend l'entrée des troupes françaises dans la Ruhr ; après, on en parle au passé. Le carnet garde les indices, les documents et les gens de Londres, dans leur propre section. Vérification : `node jeu/tools/test_continuite.js`.
- **La recherche.** Il faut une carte de lecteur (jet de Crédit, sinon deux jours d'attente). Chaque séance en salle prend deux à trois heures et un jet de Bibliothèque, difficile si l'on ne lit pas le français (moins de 50 %) et qu'on n'a pas engagé Rémi, l'étudiant traducteur (vingt ou cinquante francs la journée). Trois réussites mènent à l'Arsenal puis à Charenton.
- **Les horaires.** La Nationale ouvre de 9 h à 17 h (plus d'ouvrages après 16 h), l'Arsenal de 10 h à 16 h, tous deux fermés le dimanche ; Charenton de 9 h à 19 h. À la fermeture, on est mis dehors. À l'hôtel, « dormir » mène au lendemain 8 h ; en plein jour, le jeu propose de laisser passer la journée.
- **La conversation.** Les personnages de Paris ont leur fiche (`P.fiches`), leur fil d'intrigue (`P.fils`) et leurs propres répliques sur l'actualité de janvier 1923 (`CULT_PA`, dans `parole.js`).
- **Les images.** En attendant les illustrations de Paris, les décors empruntent celles de Londres (`G.PHOTO_SCENES`, à la fin de `paris.js`). Les prompts de Paris sont prêts : huit portraits (`prompts/portraits/27` à `34`) et onze décors (`prompts/paris/`), ajoutés à la fin de `plan.json`. Les décors où figure un personnage citent son portrait en référence, pour garder le même visage ; le workflow « Illustrations » ne génère que ce qui manque.
- **Vérifications.** `node jeu/tools/test_revue.js paris` (tous les lieux, à quatre moments de la semaine), `node jeu/tools/test_fin_londres.js fichier.json` (joue Londres jusqu'au train et écrit la sauvegarde de la partie finie, pour tester Paris), `node jeu/tools/test_parcours_paris.js` (soixante parties jouées de la gare au train de Poissy), `node jeu/tools/test_fuzz_paris.js` (phrases au hasard).

## Les horaires

Les lieux et les gens ont des heures (`PLACES` et `DISPO`, dans `jeu/src/londres.js`) : le British Museum ferme à 20 h et le dimanche, l'ambassade le week-end, la pension de Stoke Newington dort la nuit ; les inspecteurs rentrent chez eux à 20 h, le buraliste ferme à 20 h et le dimanche, le laitier ne passe qu'à l'aube. Les boutiques sont ouvertes de 8 h à 20 h, sauf le dimanche ; les crieurs de journaux se taisent la nuit ; les billets se réservent de 9 h à 19 h (si l'on insiste, on attend l'ouverture). Vérification : `node jeu/tools/test_horaires.js`.

## Les personnages absents ne parlent pas

Un verrou dans le moteur empêche toute réplique d’un personnage qui n’est pas là. Un personnage est là si on lui parle, si on peut lui parler à cet endroit, s’il fait partie du décor, ou si sa fiche déclare ses lieux (`lieux: ['stoke']`). Quand un personnage entre en scène le temps d’un événement (Beddows qui ouvre la porte, les passagers du train fantôme), le scénario l’annonce avec `api.arrive('beddows')`. Quand on change de lieu, la conversation en cours s’arrête. Si une réplique est bloquée, elle n’est pas affichée ; les tests automatiques comptent ces blocages pour qu’on corrige le scénario.

## Les déplacements et les suites de gestes

En pleine conversation, « je me rends au 31, Gordon Square », « aller chez le professeur Smith » ou « je franchis le soufflet » font quitter la conversation et partir. « Je m’approche de l’agent et lui demande… » ou « j’interroge l’agent » s’adressent à la personne nommée, si elle est là. « Je dors jusqu’à l’aube, puis je prends un taxi pour St John’s Wood » fait les deux gestes, l’un après l’autre. « J’attends jusqu’à 21 h » fait passer le temps. Ce qu’on porte sur soi (la valise de Beddows) est toujours à portée de main.

## L'humeur des personnages

Quand on dit n'importe quoi à un personnage, qu'on l'insulte ou qu'on lui parle d'objets qui n'existent pas encore (un iPhone, Google, des euros…), il réagit selon son caractère (`jeu/src/humeur.js`) :

- **Les absurdités** : il ne comprend pas, cherche une raison (« Vous avez bu ? »), conclut que vous perdez la tête, s'agace, puis passe à l'acte si vous insistez.
- **Les insultes** : il essaie d'abord de vous calmer, vous avertit, vous menace, puis sévit. Un policier vous arrête (au bout de trois arrestations, c'est la prison), un costaud frappe, une dame gifle, un concierge vous fait raccompagner.
- **Les personnages faibles** (serveur, réceptionniste, laitier…) cessent de répondre tant que vous ne redevenez pas raisonnable. Ils menacent ensuite de prévenir un supérieur ou la police, puis le font : une plainte arrive à la police, et un agent finit par vous trouver.
- **Les mots d'un autre siècle** : le personnage répète le mot tel que vous l'avez écrit, s'en étonne, s'en méfie, puis vous croit dérangé.

Plusieurs phrases d’un coup reçoivent plusieurs réponses, dans l’ordre (« T’es con ou quoi ? Où est passé le barman ? »). Un personnage insulté répond du bout des lèvres, puis ne répond plus sans excuses. Un compliment déclenche un jet de Charme : réussi, le personnage vous a à la bonne pour la journée (dé bonus à vos jets sociaux avec lui) ; s’il vous en veut, c’est un dé de malus. Des excuses font retomber la tension. Un même personnage ne dit jamais deux fois la même phrase. La vérification se lance avec `node jeu/tools/test_humeur.js`.

## Les illustrations dans le fil

En plus de la grande image du haut, le fil de la partie montre le décor quand on arrive quelque part, et le portrait d'un personnage quand il prend la parole pour la première fois (ou quand on change d'interlocuteur). Sur téléphone, clavier ouvert, la grande image sort de l'écran : celles du fil restent sous les yeux. L'image choisie est notée sur l'entrée du journal (`img`, `pt`), pour qu'une partie rechargée retrouve les mêmes. C'est dans `jeu/src/ui.js` (`vueDe`). Une image ne s'ajoute dans le fil que si l'image d'en-tête n'est pas à l'écran (sur iPhone, quand le clavier est ouvert) ; sinon, c'est l'en-tête qui change, sans doublon.

## La pluie

La pluie n'est plus un bruit blanc filtré : c'est un enregistrement, `audio/pluie.mp3` (branche `gh-pages`), fait des quatre pluies de « Rain (loopable) » de Ylmir, sur OpenGameArt, sous licence CC0 (aucune obligation, le crédit est une politesse). `jeu/tools/pluie.sh` refait le fichier à partir des quatre MP3 d'origine : niveaux rapprochés, fondus enchaînés, une boucle d'environ deux minutes. Dans le jeu (`jeu/src/audio.js`), la fin de l'enregistrement se fond dans son début, pour une boucle sans couture ; on entre dans la boucle à un endroit pris au hasard ; le volume par lieu est celui d'avant, et le niveau moyen a été réglé sur celui de l'ancien son. Si le fichier manque ou ne se charge pas, l'ancien bruit blanc reste en secours. Le grondement du train et le claquement des rails restent synthétisés.

## La musique

Quatre morceaux, en fondu enchaîné selon le lieu et la santé mentale (`TRACKS` et `MUSIC`, dans `jeu/src/audio.js`) : « Midnight Train Whispers » dans les trains et les gares de Londres, « Mechanical Dissolve » dans les lieux les plus étranges et dès que la raison vacille, « Rumble in the Haze » partout ailleurs, et « The House That Breathes », de Yoann, à la maison de santé de Charenton (il servira aussi à la maison du comte, à Poissy). Les fichiers sont dans `audio/` sur la branche `gh-pages`, en MP3 (lu partout, iPhone compris).

## Les bruitages

Les bruitages passent peu à peu du son synthétisé à l'enregistrement libre de droits. Sont faits : la porte qui se referme quand on change de lieu, et la page qu'on tourne quand un indice entre au carnet (trois variantes chacune, tirées au hasard, jamais deux fois la même de suite, à une hauteur légèrement différente). Ils viennent du lot « RPG Audio » de Kenney (kenney.nl), sous licence CC0. `jeu/tools/bruitages.sh` refait les fichiers `audio/sfx/*.wav` (branche `gh-pages`) à partir des `.ogg` d'origine. Dans `jeu/src/audio.js`, la table `BRUITS` associe un geste à ses fichiers ; un geste sans fichier garde son son synthétisé. Restent synthétisés pour l'instant : les dés, la perte de santé mentale, le grondement et le claquement du train.

## Les sauvegardes

La partie s’enregistre toute seule dans le navigateur après chaque geste (bouton « Continuer » à l’écran titre). Pour garder plusieurs parties ou faire des essais, le menu propose « Enregistrer dans un fichier » (un fichier `.json` nommé d’après le chapitre, l’investigateur et l’heure du jeu) et « Charger un fichier de sauvegarde ». L’écran titre a aussi « Charger une sauvegarde ». Un fichier se recharge sur n’importe quel appareil. Dans la visionneuse de Claude, l’enregistrement passe par sa fenêtre de confirmation.

## La version en ligne (GitHub Pages)

La branche `gh-pages` contient le jeu prêt à jouer : `index.html`, les images et la musique. Une fois GitHub Pages activé sur cette branche, le jeu est à l’adresse https://distortedimages-code.github.io/express-de-minuit/ . Chaque nouvelle version du jeu y est recopiée.

## Le testeur IA

Le workflow **Testeur IA** fait jouer ChatGPT à des parties entières du jeu, qui tourne sans écran sur les serveurs de GitHub (sources dans `jeu/src`). À chaque tour, le modèle lit ce que le jeu vient d'écrire et tape l'action suivante, selon un profil de joueur : méthodique, bavard, absurde, menteur, pressé, ou qui fait des fautes de frappe. À la fin de chaque partie, il relit la transcription et relève ce qui sonne faux. Un filtre automatique gratuit s'ajoute à sa relecture.

- Par défaut, c'est une **simulation gratuite** : des actions tirées au hasard, aucun appel à OpenAI.
- En réel, le **plafond** arrête tout dès que la dépense estimée l'atteint. Avec `gpt-5.6-luna`, une partie de 120 tours coûte quelques centimes.
- Les transcriptions et le rapport sont publiés sur la branche `tests-ia`, où Claude les récupère pour corriger le jeu. Ils sont aussi joints au lancement (section « Artifacts »).
