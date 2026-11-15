#!/usr/bin/env python3
"""Génère les 56 illustrations de L'Express de Minuit avec l'API Images d'OpenAI.

Aucune image n'est jamais affichée : le script n'écrit que des fichiers PNG et des lignes de texte
(noms de fichiers, contrôles, coûts). Il travaille par lots et reprend là où il s'était arrêté.

Exemples :
  python generer.py --simulation --lot 5          # gratuit : aucun appel à l'API
  python generer.py --lot 5 --plafond 15          # 5 images payantes au plus, budget total 15 $
  python generer.py --lot 56 --plafond 15         # tout ce qui reste, dans la limite du budget
  python generer.py --refaire 01_smith --lot 1    # régénère une image précise
"""
import argparse, base64, datetime, hashlib, io, json, os, random, shutil, sys, time
from pathlib import Path

from PIL import Image, ImageFilter, ImageStat

ICI = Path(__file__).resolve().parent
LARGEUR, HAUTEUR = 1600, 1200

# Tarifs de l'API (dollars par million de jetons), d'après la documentation OpenAI de novembre 2026.
# Les modèles GPT Image 2.5 et 2.6 partagent les mêmes tarifs standard.
TARIFS = {
    'gpt-image-2.5-sunburst': {'texte': 5.0, 'image_entree': 8.0, 'image_sortie': 30.0},
    'gpt-image-2.5-flare': {'texte': 5.0, 'image_entree': 8.0, 'image_sortie': 30.0},
    'gpt-image-2.6-sunburst': {'texte': 5.0, 'image_entree': 8.0, 'image_sortie': 30.0},
    'gpt-image-2.6-flare': {'texte': 5.0, 'image_entree': 8.0, 'image_sortie': 30.0},
    'gpt-image-2': {'texte': 5.0, 'image_entree': 8.0, 'image_sortie': 30.0},
}
# Estimation prudente du coût d'une image avant le premier vrai résultat (dollars).
# Dès qu'une image réelle a été facturée, l'estimation suit la moyenne réelle, majorée de 20 %.
ESTIMATION = {'low': 0.03, 'medium': 0.09, 'high': 0.25, 'xhigh': 0.40, 'max': 0.60}
PAR_REFERENCE = 0.03  # chaque portrait de référence envoyé coûte des jetons d'entrée

CONSIGNES = (
    "Generate one single image: one frame, one scene. No collage, no split screen, no grid, no border, no caption."
)
IDENTITE = (
    "The attached images are identity references only: keep exactly the same face, hair, moustache, age and costume "
    "for the recurring character(s) they show. Do not copy their background, framing, pose or lighting; compose the new scene "
    "described above."
)


def lire(p):
    return Path(p).read_text(encoding='utf-8').strip()


def ecrire_json(p, d):
    p = Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix('.tmp'); tmp.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8'); tmp.replace(p)


def maintenant():
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')


# ---------------------------------------------------------------- le plan des 56 images
def charger_plan():
    plan = json.loads((ICI / 'plan.json').read_text(encoding='utf-8'))
    images = plan['images']
    noms = [i['image'] for i in images]
    erreurs = []
    if len(images) != 56: erreurs.append(f'{len(images)} images dans plan.json au lieu de 56')
    if len(set(noms)) != len(noms): erreurs.append('des noms d’images sont en double dans plan.json')
    for i in images:
        f = ICI / i['prompt']
        if not f.is_file() or not lire(f): erreurs.append(f'prompt manquant ou vide : {i["prompt"]}')
        for r in i.get('references', []):
            if r not in noms or noms.index(r) > noms.index(i['image']):
                erreurs.append(f'la référence {r} doit précéder {i["image"]}')
    if erreurs:
        sys.exit('Plan invalide :\n- ' + '\n- '.join(erreurs))
    return plan


def construire_prompt(entree):
    texte = lire(ICI / entree['prompt'])  # le prompt existant, style commun compris, tel quel
    negatif = lire(ICI / 'prompt_negatif.txt')
    morceaux = [texte, 'Avoid: ' + negatif + '.', CONSIGNES]
    if entree.get('references'): morceaux.append(IDENTITE)
    return '\n\n'.join(morceaux)


# ---------------------------------------------------------------- l'état, qui permet la reprise
class Etat:
    def __init__(self, dossier):
        self.dossier = Path(dossier); self.images = self.dossier / 'images'
        self.f_statut = self.dossier / 'statut.json'; self.f_couts = self.dossier / 'couts.json'
        self.statut = json.loads(self.f_statut.read_text(encoding='utf-8')) if self.f_statut.exists() else {}
        self.couts = json.loads(self.f_couts.read_text(encoding='utf-8')) if self.f_couts.exists() else {'total': 0.0, 'appels': []}

    def chemin(self, nom):
        return self.images / (nom + '.png')

    def faite(self, nom):
        s = self.statut.get(nom)
        return bool(s and s.get('etat') == 'ok' and self.chemin(nom).is_file())

    def enregistrer(self):
        ecrire_json(self.f_statut, self.statut); ecrire_json(self.f_couts, self.couts)

    def ajouter_cout(self, nom, cout, jetons, simulation):
        self.couts['total'] = round(self.couts['total'] + cout, 6)
        self.couts['appels'].append({'image': nom, 'cout': round(cout, 6), 'jetons': jetons, 'simulation': simulation, 'date': maintenant()})

    def couts_reels(self):
        return [a['cout'] for a in self.couts['appels'] if a['cout'] > 0 and not a.get('simulation')]


def estimer(entree, qualite, etat):
    """Avant toute image réelle : estimation prudente fixe. Ensuite : la plus haute des deux valeurs
    « moyenne réelle + 20 % » et « image la plus chère + 5 % », pour ne pas sous-estimer."""
    reels = etat.couts_reels()
    base = max(sum(reels) / len(reels) * 1.2, max(reels) * 1.05) if reels else ESTIMATION[qualite]
    return base + PAR_REFERENCE * len(entree.get('references', []))


# ---------------------------------------------------------------- l'image : format, recadrage, contrôles
def recadrage_intelligent(im):
    """Ramène n'importe quel format au 4:3 sans déformation : on coupe ce qui dépasse, à l'endroit où l'image
    a le moins de détails (bords, contrastes), puis on met à l'échelle uniformément en 1600 × 1200."""
    w, h = im.size
    cible = LARGEUR / HAUTEUR
    if abs(w / h - cible) > 0.002:
        gris = im.convert('L').filter(ImageFilter.FIND_EDGES)
        if w / h > cible:  # trop large : on glisse une fenêtre 4:3 de gauche à droite
            cw, ch = round(h * cible), h
            positions = [(x, 0) for x in range(0, w - cw + 1, max(1, (w - cw) // 48 or 1))]
        else:  # trop haute : de haut en bas
            cw, ch = w, round(w / cible)
            positions = [(0, y) for y in range(0, h - ch + 1, max(1, (h - ch) // 48 or 1))]
        petit = gris.resize((max(1, w // 8), max(1, h // 8)))
        def energie(x, y):
            zone = petit.crop((x // 8, y // 8, (x + cw) // 8, (y + ch) // 8))
            centre = 1 - abs((x + cw / 2) / w - 0.5) - abs((y + ch / 2) / h - 0.5)  # léger avantage au centre
            return ImageStat.Stat(zone).mean[0] * (0.85 + 0.15 * centre)
        x, y = max(positions, key=lambda p: energie(*p))
        im = im.crop((x, y, x + cw, y + ch))
    if im.size != (LARGEUR, HAUTEUR):
        im = im.resize((LARGEUR, HAUTEUR), Image.LANCZOS)  # même facteur sur les deux axes : aucun étirement
    return im


def controles(im, sha, deja_vus):
    """Contrôles automatiques. Les « erreurs » rejettent l'image ; les « avertissements » sont seulement notés."""
    erreurs, avert = [], []
    if im.size != (LARGEUR, HAUTEUR): erreurs.append(f'dimensions {im.size[0]}×{im.size[1]}')
    if sha in deja_vus: erreurs.append('doublon exact de ' + deja_vus[sha])
    petit = im.convert('RGB').resize((160, 120))
    ecart = ImageStat.Stat(petit.convert('L')).stddev[0]
    if ecart < 3: erreurs.append('image vide (uniforme)')
    elif ecart < 12: avert.append('image très peu contrastée')
    # noir et blanc avec une touche de rouge. On mesure sur une vignette assez grande pour garder les petits accents,
    # et on ignore les zones très sombres, où la moindre dominante fausse la mesure de saturation.
    moyen = im.convert('RGB').resize((400, 300))
    def pixels(img):  # triplets de pixels, sans dépendre de la version de Pillow
        b = img.tobytes(); return [tuple(b[i:i + 3]) for i in range(0, len(b), 3)]
    rgb = pixels(moyen); n = len(rgb)
    clairs = [p for p in rgb if max(p) > 60]
    sat_moy = (sum((max(p) - min(p)) / max(p) for p in clairs) / len(clairs) * 255) if clairs else 0
    def rouge(p): r, g, b = p; return r > 70 and r > 1.6 * g and r > 1.6 * b and r - min(g, b) > 40
    rouges = sum(1 for p in rgb if rouge(p)) / n
    couleurs = sum(1 for p in rgb if max(p) - min(p) > 45 and not rouge(p)) / n
    if sat_moy > 60: avert.append(f'image peu « noir et blanc » (saturation moyenne {sat_moy:.0f}/255)')
    if couleurs > 0.03: avert.append(f'couleurs autres que le rouge sur {couleurs:.0%} de l’image')
    if rouges == 0: avert.append('aucune touche de rouge détectée')
    elif rouges > 0.12: avert.append(f'rouge très présent ({rouges:.0%} de l’image)')
    # zones réservées à l'interface : les bandes du haut et du bas doivent rester plus calmes que le centre
    bords = petit.convert('L').filter(ImageFilter.FIND_EDGES)
    def det(y0, y1): return ImageStat.Stat(bords.crop((0, y0, 160, y1))).mean[0]
    haut, bas, centre = det(0, 14), det(106, 120), det(30, 90)
    if centre and max(haut, bas) > 1.4 * centre: avert.append('beaucoup de détails dans les bandes du haut ou du bas')
    return erreurs, avert, {'saturation': round(sat_moy, 1), 'rouge': round(rouges, 4)}


# ---------------------------------------------------------------- l'appel à l'API (ou sa simulation)
class Generateur:
    def __init__(self, args):
        self.args = args; self.taille = '1600x1200'; self.client = None
        if not args.simulation:
            if not os.environ.get('OPENAI_API_KEY'):
                sys.exit('La clé OPENAI_API_KEY est absente. Ajoutez le secret dans le dépôt, ou lancez en simulation.')
            from openai import OpenAI
            self.client = OpenAI(timeout=600, max_retries=2)

    def cout(self, usage):
        t = TARIFS.get(self.args.modele, TARIFS['gpt-image-2.5-sunburst'])
        if not usage: return 0.0, {}
        d = getattr(usage, 'input_tokens_details', None)
        txt = getattr(d, 'text_tokens', None) if d else None
        img = getattr(d, 'image_tokens', None) if d else None
        entree = getattr(usage, 'input_tokens', 0) or 0
        if txt is None and img is None: txt, img = entree, 0
        sortie = getattr(usage, 'output_tokens', 0) or 0
        c = ((txt or 0) * t['texte'] + (img or 0) * t['image_entree'] + sortie * t['image_sortie']) / 1e6
        return c, {'texte': txt or 0, 'image_entree': img or 0, 'sortie': sortie}

    def produire(self, entree, prompt, refs):
        """Renvoie (image PIL, coût en dollars, jetons)."""
        if self.args.simulation:
            return self.simuler(entree, refs)
        from openai import BadRequestError
        params = dict(model=self.args.modele, prompt=prompt, size=self.taille, quality=self.args.qualite, output_format='png', n=1)
        for essai in (1, 2):
            fichiers = [open(r, 'rb') for r in refs]
            try:
                rep = (self.client.images.edit(image=fichiers, **params) if fichiers else self.client.images.generate(**params))
                break
            except BadRequestError as e:
                # format non accepté par ce modèle : on se rabat sur le paysage standard, recadré ensuite en 4:3
                if essai == 1 and self.taille != '1536x1024' and 'size' in str(e).lower():
                    print('   Format 1600x1200 refusé par le modèle : repli sur 1536x1024, recadré ensuite en 4:3.')
                    self.taille = params['size'] = '1536x1024'; continue
                raise
            finally:
                for f in fichiers: f.close()
        brut = base64.b64decode(rep.data[0].b64_json)
        im = Image.open(io.BytesIO(brut)); im.load()
        cout, jetons = self.cout(getattr(rep, 'usage', None))
        return im, cout, jetons

    def simuler(self, entree, refs):
        """Image factice abstraite (jamais une illustration) : sert à tester tout le circuit sans rien payer."""
        graine = int(hashlib.sha256(entree['image'].encode()).hexdigest()[:8], 16)
        rnd = random.Random(graine)
        taille = (1536, 1024) if rnd.random() < 0.3 else (LARGEUR, HAUTEUR)  # teste aussi le recadrage
        im = Image.new('RGB', taille, (12, 12, 12))
        px = im.load()
        for _ in range(40):
            x0, y0 = rnd.randrange(taille[0]), rnd.randrange(taille[1]); v = rnd.randrange(60, 230)
            for x in range(x0, min(taille[0], x0 + rnd.randrange(40, 400)), 2):
                for y in range(y0, min(taille[1], y0 + rnd.randrange(4, 30))): px[x, y] = (v, v, v)
        cx, cy = rnd.randrange(300, taille[0] - 300), rnd.randrange(300, taille[1] - 300)
        for x in range(cx - 14, cx + 14):
            for y in range(cy - 14, cy + 14): px[x, y] = (180, 20, 30)
        est = ESTIMATION[self.args.qualite] + PAR_REFERENCE * len(refs)
        return im, est, {'simulation': True}


# ---------------------------------------------------------------- le lot
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--lot', type=int, default=5, help='nombre maximal d’images à générer dans ce lancement (56 = tout ce qui reste)')
    ap.add_argument('--plafond', type=float, default=15.0, help='budget total en dollars, toutes séances confondues')
    ap.add_argument('--qualite', default='high', choices=sorted(ESTIMATION))
    ap.add_argument('--modele', default='gpt-image-2.5-sunburst')
    ap.add_argument('--simulation', action='store_true', help='aucun appel à l’API : images factices, coûts estimés')
    ap.add_argument('--refaire', default='', help='régénérer les images dont le nom contient ce texte (plusieurs : séparez par des virgules)')
    ap.add_argument('--etat', default='', help='dossier de l’état (par défaut etat/ ou etat-simulation/)')
    ap.add_argument('--final', default='', help='dossier où assembler les 56 PNG une fois tout terminé')
    ap.add_argument('--minutes', type=float, default=0, help='durée maximale du lancement ; on s’arrête proprement avant (0 = sans limite)')
    args = ap.parse_args()

    plan = charger_plan()
    etat = Etat(args.etat or ICI / ('etat-simulation' if args.simulation else 'etat'))
    final = Path(args.final or ICI / ('final-simulation' if args.simulation else 'final'))
    images = plan['images']
    resume = []
    def dire(ligne=''):
        print(ligne, flush=True); resume.append(ligne)

    mode = 'SIMULATION (gratuite, aucun appel à l’API)' if args.simulation else f'RÉEL — modèle {args.modele}, qualité {args.qualite}'
    dire(f'## Illustrations de L’Express de Minuit — {mode}')
    dire()

    cibles = []
    if args.refaire:
        termes = [t.strip() for t in args.refaire.split(',') if t.strip()]
        cibles = [e for e in images if any(t in e['image'] for t in termes)]
        if not cibles: sys.exit(f'Aucune image ne contient « {args.refaire} ».')
        dire(f'Images à refaire : {", ".join(e["image"] for e in cibles)} (l’ancienne version reste en place tant que la nouvelle n’est pas réussie)')

    a_faire = [e for e in images if not etat.faite(e['image'])]
    candidates = cibles if args.refaire else a_faire  # avec « refaire », on ne génère que les images demandées
    lot = []
    for e in candidates:
        if len(lot) >= args.lot: break
        if all(etat.faite(r) or r in [x['image'] for x in lot] for r in e.get('references', [])): lot.append(e)

    faites = 56 - len(a_faire)
    dire(f'Avancement : **{faites} / 56** images prêtes avant ce lancement.')

    # le budget : on refuse le lot entier si l'estimation le fait dépasser
    depense = etat.couts['total']
    prevu = sum(estimer(e, args.qualite, etat) for e in lot)
    reste_estime = sum(estimer(e, args.qualite, etat) for e in a_faire)
    dire(f'Dépensé jusqu’ici : **{depense:.2f} $** sur un plafond de **{args.plafond:.2f} $**.')
    dire(f'Coût estimé de ce lot ({len(lot)} images) : {prevu:.2f} $ ; de tout ce qui reste ({len(a_faire)} images) : {reste_estime:.2f} $.')
    gen = None
    if not lot:
        dire('Rien à générer.' if not a_faire else 'Aucune image disponible : leurs portraits de référence ont échoué.')
    elif depense + prevu > args.plafond:
        dire(f'**Arrêt avant le lot** : {depense:.2f} $ + {prevu:.2f} $ dépasseraient le plafond de {args.plafond:.2f} $. '
             'Relevez le plafond ou réduisez le lot.')
        lot = []
    else:
        gen = Generateur(args)

    deja_vus = {s['sha256']: n for n, s in etat.statut.items() if s.get('etat') == 'ok' and s.get('sha256')}

    def noter_echec(nom, msg):
        if etat.faite(nom):  # une version réussie existe déjà (cas de « refaire ») : on la garde
            etat.statut[nom]['derniere_tentative'] = {'erreur': msg, 'date': maintenant()}
        else:
            etat.statut[nom] = {'etat': 'echec', 'erreur': msg, 'date': maintenant()}
        etat.enregistrer()
    nouvelles, echecs = [], []
    depart = time.time()
    for i, e in enumerate(lot, 1):
        nom = e['image']
        if args.minutes and time.time() - depart > args.minutes * 60:
            dire(f'Arrêt : la durée maximale de {args.minutes:.0f} minutes est atteinte. Relancez pour continuer.'); break
        est = estimer(e, args.qualite, etat)
        if etat.couts['total'] + est > args.plafond:
            dire(f'Arrêt : la prochaine image ({est:.2f} $ estimés) ferait dépasser le plafond.'); break
        refs = [etat.chemin(r) for r in e.get('references', [])]
        manquantes = [r for r in e.get('references', []) if not etat.faite(r)]
        if manquantes:
            print(f'[{i}/{len(lot)}] {nom} — reportée : portrait de référence absent ({", ".join(manquantes)})', flush=True)
            continue
        print(f'[{i}/{len(lot)}] {nom}' + (f' (références : {len(refs)})' if refs else ''), flush=True)
        debut = time.time()
        try:
            im, cout, jetons = gen.produire(e, construire_prompt(e), refs)
        except Exception as ex:  # refus de contenu, panne réseau… on note et on continue
            msg = str(ex).replace(os.environ.get('OPENAI_API_KEY') or '\0', '***')[:240]
            noter_echec(nom, msg); echecs.append(nom); print('   échec : ' + msg, flush=True)
            continue
        if not args.simulation and cout <= 0:
            cout = est  # l'API n'a pas renvoyé sa consommation : on compte l'estimation, par prudence
        etat.ajouter_cout(nom, cout, jetons, args.simulation)
        taille_recue = f'{im.size[0]}x{im.size[1]}'
        im = recadrage_intelligent(im.convert('RGB'))
        buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); octets = buf.getvalue()
        sha = hashlib.sha256(octets).hexdigest()
        err, avert, mesures = controles(im, sha, {k: v for k, v in deja_vus.items() if v != nom})
        if err:
            noter_echec(nom, '; '.join(err)); echecs.append(nom); print('   rejetée : ' + '; '.join(err), flush=True)
            continue
        dest = etat.chemin(nom); dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(octets)
        deja_vus[sha] = nom
        etat.statut[nom] = {'etat': 'ok', 'sha256': sha, 'cout': round(cout, 4), 'taille_recue': taille_recue,
                            'avertissements': avert, 'mesures': mesures, 'secondes': round(time.time() - debut), 'date': maintenant()}
        etat.enregistrer(); nouvelles.append(nom)
        print(f'   ok ({cout:.3f} $, reçue en {taille_recue})' + (' — ' + ' ; '.join(avert) if avert else ''), flush=True)

    # le bilan, sans aucune image
    pretes = [e['image'] for e in images if etat.faite(e['image'])]
    dire()
    dire(f'### Ce lancement : {len(nouvelles)} image(s) générée(s), {len(echecs)} échec(s)')
    for n in nouvelles:
        av = etat.statut[n].get('avertissements') or []
        dire(f'- `{n}.png` — {etat.statut[n]["cout"]:.3f} $' + (f' — à vérifier : {"; ".join(av)}' if av else ''))
    for n in echecs:
        st = etat.statut[n]
        if st.get('etat') == 'ok':
            dire(f'- `{n}.png` — **échec de la nouvelle version** : {st["derniere_tentative"]["erreur"]} (l’ancienne est conservée)')
        else:
            dire(f'- `{n}.png` — **échec** : {st["erreur"]}')
    dire()
    dire(f'Total : **{len(pretes)} / 56** images prêtes ; **{etat.couts["total"]:.2f} $** dépensés'
         + (' (estimation de simulation)' if args.simulation else '') + f' sur {args.plafond:.2f} $.')

    complet = len(pretes) == 56
    if complet:
        if final.exists(): shutil.rmtree(final)
        racine = final / plan['archive']
        for e in images:
            dst = racine / (e['image'] + '.png'); dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(etat.chemin(e['image']), dst)
        hashes = {hashlib.sha256((racine / (e['image'] + '.png')).read_bytes()).hexdigest() for e in images}
        assert len(hashes) == 56, 'doublon dans le dossier final'
        (final / 'LISEZMOI.txt').write_text(
            'Les 56 illustrations de L’Express de Minuit, en PNG 1600 × 1200, rangées comme le jeu les attend.\n'
            + ('ATTENTION : ce sont des images FACTICES de simulation.\n' if args.simulation else ''), encoding='utf-8')
        dire('**Les 56 images sont prêtes** : le ZIP final est joint à ce lancement (section « Artifacts »).')
    else:
        dire(f'Il en reste {56 - len(pretes)}. Relancez le workflow pour continuer : la génération reprend là où elle s’est arrêtée.')

    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as f: f.write('\n'.join(resume) + '\n')
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as f: f.write(f'complet={"true" if complet else "false"}\n')


if __name__ == '__main__':
    main()
