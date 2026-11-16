#!/usr/bin/env python3
"""Où regarder dans chaque illustration (en % de sa largeur) : le personnage, ou ce qui compte dans la scène.
Sert à la disposition « image en fond » (iPad en paysage) : ce point tombe au milieu de la partie libre de l'écran.
1. illustrations/cadrage.json : relevé à la main, image par image (il prime) ;
2. sinon, le prompt : « in the left third » → 24, « in the right third » → 76 ;
3. sinon, le milieu (rien n'est écrit : le jeu prend 50).
Usage : python3 cadrage.py chemin/vers/illustrations  → écrit la ligne JavaScript de photos_v2.js."""
import json, re, sys, pathlib
racine = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'illustrations')
plan = json.loads((racine / 'plan.json').read_text(encoding='utf-8'))
main = json.loads((racine / 'cadrage.json').read_text(encoding='utf-8')) if (racine / 'cadrage.json').exists() else {}
out = {}
for im in plan['images']:
    k = im['image']
    if k in main: out[k] = main[k]; continue
    t = (racine / im['prompt']).read_text(encoding='utf-8').split('Strict rules:')[0]
    m = re.search(r'\bin the (left|right) third\b', t, re.I)
    if m: out[k] = 24 if m.group(1).lower() == 'left' else 76
for k, v in main.items(): out.setdefault(k, v)
print('  G.PixelArt.PHOTO_CADRAGE = ' + json.dumps(out, ensure_ascii=False, sort_keys=True) + ';')
