#!/usr/bin/env python3
"""Intègre les rendus PNG (branche « rendus ») au jeu : WebP 1200 × 900 sous les mêmes noms,
points lumineux détectés automatiquement pour les animations, planches-contact de contrôle (usage interne).

  python integrer_rendus.py <dossier rendus> <dossier dist/img> <sortie anchors.json> <dossier planches>
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

src, dst, out_json, planches = map(Path, sys.argv[1:5])
imgs = sorted((src / 'images').rglob('*.png'))
statut = json.loads((src / 'statut.json').read_text()) if (src / 'statut.json').exists() else {}
VMIN = int(sys.argv[5]) if len(sys.argv) > 5 else 1  # n'intégrer que les images de cette version du plan ou plus récentes
anchors = {}
for f in imgs:
    key = str(f.relative_to(src / 'images'))[:-4]
    if statut.get(key, {}).get('version', 1) < VMIN: continue
    im = Image.open(f).convert('RGB')
    large = im.width / im.height > 1.6  # format cinéma 2,4:1 : repère 720 × 300 dans le jeu
    if im.size not in ((1600, 1200), (2304, 960)):
        print('taille inattendue', key, im.size); continue
    d = dst / (key + '.webp'); d.parent.mkdir(parents=True, exist_ok=True)
    im.resize((1728, 720) if large else (1200, 900), Image.LANCZOS).save(d, 'WEBP', quality=82, method=6)
    # points lumineux : petites zones très claires, dans le repère du jeu (400 × 300, ou 720 × 300 en cinéma)
    small = im.resize((720, 300) if large else (400, 300), Image.LANCZOS)
    L = small.convert('L').filter(ImageFilter.GaussianBlur(1.2))
    px = L.load(); w, h = L.size
    cand = []
    for y in range(12, h - 12):
        for x in range(4, w - 4):  # w = 400 ou 720
            v = px[x, y]
            if v < 225: continue
            if all(v >= px[x + dx, y + dy] for dx in (-3, 0, 3) for dy in (-3, 0, 3)):
                # compacité : la lumière doit retomber vite autour (une flamme, une ampoule, pas un mur clair)
                ring = [px[min(w - 1, max(0, x + dx)), min(h - 1, max(0, y + dy))] for dx, dy in ((-10, 0), (10, 0), (0, -10), (0, 10), (-7, -7), (7, 7), (-7, 7), (7, -7))]
                drop = v - sum(ring) / len(ring)
                if drop > 70: cand.append((drop, x, y))
    cand.sort(reverse=True)
    lamps = []
    for drop, x, y in cand:
        if all((x - a) ** 2 + (y - b) ** 2 > 30 ** 2 for a, b, _ in lamps):
            lamps.append((x, y, 4 if drop < 110 else 6))
        if len(lamps) >= 3: break
    # l'accent rouge : son centre, utile pour une lueur ou une braise
    rgb = small.load(); reds = [(x, y) for y in range(h) for x in range(w) if rgb[x, y][0] > 90 and rgb[x, y][0] > 1.7 * rgb[x, y][1] and rgb[x, y][0] > 1.7 * rgb[x, y][2]]
    rouge = [round(sum(p[0] for p in reds) / len(reds)), round(sum(p[1] for p in reds) / len(reds)), len(reds)] if reds else None
    anchors[key] = {'lamps': lamps, 'rouge': rouge, 'large': large}
out_json.write_text(json.dumps(anchors, ensure_ascii=False, indent=1))
# planches-contact 4 × 4, avec les points détectés (contrôle interne, jamais montré au joueur)
planches.mkdir(parents=True, exist_ok=True)
keys = sorted(anchors)
for n in range(0, len(keys), 16):
    sheet = Image.new('RGB', (1600, 1200), (20, 20, 20)); dr = ImageDraw.Draw(sheet)
    for i, k in enumerate(keys[n:n + 16]):
        lg = anchors[k]['large']; sc = 400 / 720 if lg else 1
        t = Image.open(dst / (k + '.webp')).convert('RGB').resize((400, 167) if lg else (400, 300))
        ox, oy = (i % 4) * 400, (i // 4) * 300
        sheet.paste(t, (ox, oy))
        for x, y, r in anchors[k]['lamps']: x, y = x * sc, y * sc; dr.ellipse((ox + x - 6, oy + y - 6, ox + x + 6, oy + y + 6), outline=(0, 255, 0), width=2)
        if anchors[k]['rouge']: x, y, _ = anchors[k]['rouge']; x, y = x * sc, y * sc; dr.rectangle((ox + x - 5, oy + y - 5, ox + x + 5, oy + y + 5), outline=(0, 160, 255), width=2)
        if lg: dr.text((ox + 6, oy + 172), '(coordonnées × 1,8 dans le jeu)', fill=(150, 150, 150))
        dr.rectangle((ox, oy, ox + 399, oy + 299), outline=(80, 80, 80)); dr.text((ox + 6, oy + 4), k.split('/')[-1][:40], fill=(255, 255, 0))
    sheet.save(planches / f'planche_{n // 16 + 1}.jpg', quality=85)
print(len(anchors), 'images intégrées')
