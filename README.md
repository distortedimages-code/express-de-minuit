# L'Express de Minuit — génération des illustrations

Ce dépôt génère les 56 illustrations du jeu avec l'API Images d'OpenAI, directement sur les serveurs de GitHub.
Rien ne passe par le navigateur : la clé reste un secret GitHub, lu uniquement par l'étape de génération.

Aucune image n'est jamais affichée. Les rapports ne contiennent que du texte : des noms de fichiers, des contrôles et des coûts.

## Contenu

| Fichier | Rôle |
|---|---|
| `.github/workflows/illustrations.yml` | le workflow « Illustrations », à lancer à la main |
| `illustrations/generer.py` | le générateur : lots, reprise, budget, recadrage, contrôles |
| `illustrations/plan.json` | les 56 images dans l'ordre, avec leurs portraits de référence |
| `illustrations/prompts/…` | les 56 prompts existants, inchangés, style commun inclus |
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
| **lot** | `5` génère les 5 images suivantes ; `56` génère tout ce qui reste |
| **plafond** | budget total en dollars, tous lancements confondus (20 par défaut) |
| **qualite** | `high` par défaut ; `medium` est nettement moins cher (environ 0,09 $ estimés par image) |
| **modele** | `gpt-image-2.5-sunburst` par défaut |
| **refaire** | facultatif : un ou plusieurs noms, séparés par des virgules, par exemple `01_smith` ou `01_smith,03_beddows` |

Un seul lancement tourne à la fois. Un second attend la fin du premier.

## Ordre conseillé

1. **Simulation, lot 56.** C'est gratuit et vérifie tout le circuit, jusqu'au ZIP final factice nommé `SIMULATION_…`.
2. **Réel, lot 5.** Coût estimé : environ 1,25 $. Le résumé donne ensuite le vrai coût par image, et les estimations suivantes s'y ajustent.
3. **Réel, lot 56.** Il génère tout le reste, dans la limite du plafond.

## Suivre un lancement

Touchez le lancement dans la liste, puis la page **Summary**. Elle indique :

- l'avancement, sur 56 ;
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

Quand les 56 images sont prêtes, le lancement joint un artifact **`L_Express_de_Minuit_56_illustrations`**. Pour le télécharger :

1. Ouvrez le lancement dans Safari, au besoin en version ordinateur.
2. Descendez jusqu'à **Artifacts**.
3. Touchez le nom pour télécharger le ZIP.

Si l'app GitHub n'affiche pas cette section, passez par Safari. Le ZIP reste disponible 30 jours.

Contenu du ZIP : `illustrations-express-de-minuit/` avec `ecran-titre/`, `londres/`, `portraits/` et `prologue/`. Ce sont les 56 PNG en 1600 × 1200, sous les noms exacts que le jeu attend.

## Comment les images sont faites

- **Une image par appel.** Chaque appel envoie le prompt existant, tel quel, et demande une seule image : pas de planche, pas de collage.
- **Format :** 1600 × 1200 (4:3), qu'OpenAI accepte directement.
  - Si un modèle refusait ce format, le générateur demanderait du 1536 × 1024.
  - Il recadrerait ensuite en 4:3, en coupant la partie la moins détaillée.
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

## Refaire une image

Lancez le workflow en mode réel avec **refaire** = une partie du nom, par exemple `13_butter`.

- L'ancienne version reste en place tant que la nouvelle n'est pas réussie.
- Les scènes qui utilisaient ce portrait comme référence ne sont pas refaites automatiquement. Ajoutez-les à **refaire** si besoin.

## Stockage GitHub

Un dépôt privé gratuit dispose de 500 Mo pour les artifacts. L'état complet et le ZIP final pèsent chacun environ 200 Mo. Le workflow efface donc automatiquement les anciennes copies : il ne garde que le dernier état et le dernier ZIP.

## Tester en local, sans rien payer

```
cd illustrations
pip install -r requirements.txt
python generer.py --simulation --lot 56
```
