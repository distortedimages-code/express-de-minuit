#!/usr/bin/env python3
"""Cadrage horizontal de chaque illustration, lu dans son prompt : où se trouve le sujet ?
« Placed in the left third » → 24, « right third » → 76, sinon 50 (en % de la largeur de l'image).
Sert à la disposition « image en fond » (iPad en paysage) : le sujet est centré dans la partie libre de l'écran.
Usage : python3 cadrage.py chemin/vers/illustrations  > écrit l'objet JavaScript sur la sortie."""
import json, re, sys, pathlib
racine = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'illustrations')
plan = json.loads((racine / 'plan.json').read_text(encoding='utf-8'))
out = {}
for im in plan['images']:
    t = (racine / im['prompt']).read_text(encoding='utf-8').split('Strict rules:')[0]
    m = re.search(r'\b(?:placed|standing|seated|sits|stands)?[^.]{0,60}\bin the (left|right) third\b', t, re.I) or re.search(r'\bin the (left|right) third\b', t, re.I)
    if m: out[im['image']] = 24 if m.group(1).lower() == 'left' else 76
print('  G.PixelArt.PHOTO_CADRAGE = ' + json.dumps(out, ensure_ascii=False, sort_keys=True) + ';')
