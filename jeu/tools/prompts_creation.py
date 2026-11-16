"""Écrit les 40 prompts des photographies de la création d'investigateur (10 professions × 2 genres × 2 versions)
et les ajoute à illustrations/plan.json. La version « charme » sert quand l'Apparence est de 50 ou plus.
Usage : python3 jeu/tools/prompts_creation.py   (depuis la racine du dépôt ; relançable sans doublons)"""
import json, pathlib
RACINE = pathlib.Path(__file__).resolve().parents[2]
ILL = RACINE / 'illustrations'
modele = (ILL / 'prompts/portraits/pj_doyle.txt').read_text(encoding='utf-8')
REGLES = modele[modele.index('Strict rules:'):modele.index('Style:')].strip()
STYLE = modele[modele.index('Style:'):].strip()

# profession : (titre anglais, décor, geste, élément rouge, tenue d'homme, tenue de femme)
P = {
 'antiquaire': ('antiquarian dealer', 'a cluttered antique shop: shelves of masks, urns, clocks and curios, a hanging lamp, deep shadows',
   'examines a small brass astrolabe through a watchmaker\'s loupe', 'a red silk tassel hanging from a key on the counter',
   'a tweed waistcoat with rolled shirtsleeves and a watch chain', 'a high-collared blouse, a long dark skirt and a cameo brooch'),
 'archeologue': ('archaeologist', 'a museum storeroom crowded with packing crates, a broken carved stone stele and a single hanging bulb',
   'holds a small trowel and a soft brush, dust on the cuffs', 'a red bandana knotted loosely at the throat',
   'a weathered field jacket over a collarless shirt, sun-browned skin, a battered pith helmet resting on a crate', 'a practical belted field jacket, a divided skirt and laced boots, a wide-brimmed felt hat in hand'),
 'avocat': ('barrister', 'wood-panelled chambers: shelves of bound law reports, a green-shaded desk lamp, a tall window',
   'holds a thick legal brief against the chest', 'the red ribbon tying the legal brief',
   'a black barrister\'s gown over a dark suit and a stiff wing collar', 'a black barrister\'s gown over a dark dress with a white collar, hair pinned up severely'),
 'detective': ('private detective', 'a small shabby office above a street at night, rain streaming down a slanted window, a filing cabinet, a desk lamp',
   'holds a magnifying glass and a creased photograph', 'the glowing red tip of a cigarette resting in an ashtray on the desk',
   'a rumpled raincoat, a loosened tie and a trilby hat', 'a belted raincoat, leather gloves and a cloche hat'),
 'dilettante': ('wealthy dilettante', 'an opulent drawing room: a grand piano, tall curtains, a crystal decanter on a silver tray',
   'holds a long cigarette holder and a coupe of champagne', 'a single red carnation in a slim vase on the piano',
   'an immaculate evening suit with white tie', 'a beaded evening dress of the period, long satin gloves and a jewelled headband'),
 'ecrivain': ('novelist', 'a cramped study at night: a typewriter, stacks of manuscripts, bookshelves overflowing onto the floor',
   'holds a fountain pen above a half-typed page', 'the red cover of a single notebook lying on the desk',
   'a shabby cardigan over a shirt, ink-stained fingers', 'a loose knitted cardigan, a long string of beads, ink-stained fingers'),
 'journaliste': ('newspaper reporter', 'a smoky newspaper office at night: typewriters, hanging lamps, piles of newspapers',
   'holds a shorthand notebook and a pencil, a press card tucked in the hatband', 'a red pencil tucked behind the ear',
   'shirtsleeves with arm garters, a waistcoat, a fedora pushed back', 'a tailored jacket and skirt, a cloche hat, a folding camera on a strap'),
 'medecin': ('physician', 'a consulting room: tall glass cabinets of instruments, an anatomical chart, a desk lamp',
   'a stethoscope around the neck, an old leather doctor\'s bag in hand', 'the small red cross painted on the clasp of the doctor\'s bag',
   'a dark three-piece suit', 'a dark tailored suit with a long skirt, a white blouse, hair in a neat chignon'),
 'parapsychologue': ('psychical researcher', 'a darkened room prepared for a séance: a draped table, a box camera on a tripod, a galvanometer trailing wires, candles',
   'holds a glass photographic plate up to the light', 'the red glass of a darkroom safelight lamp on the table',
   'a tweed suit and an intense, searching expression', 'a severe dark dress, spectacles on a chain, an intense, searching expression'),
 'professeur': ('university lecturer', 'an empty lecture hall: a blackboard covered with chalk diagrams, tiers of wooden benches, tall arched windows',
   'holds a piece of chalk and an open book', 'the red leather binding of the open book',
   'an academic gown over a tweed suit', 'an academic gown over a dark dress'),
}
CHARME = ('Striking and self-assured: an attractive, well-proportioned face, a calm direct gaze toward the viewer, a faint confident smile, '
          'impeccably groomed, clothes that fit perfectly, upright graceful posture; the light flatters the face.')
TERNE = ('Plain and unprepossessing: an unremarkable, slightly uneven face, tired eyes that avoid the viewer, a stooped, awkward posture, '
         'untidy hair, clothes slightly ill-fitting and worn at the cuffs; flat, unflattering light on the face. '
         'Ordinary and easily forgotten, yet human and sympathetic, never grotesque, never a caricature.')
plan = json.loads((ILL / 'plan.json').read_text(encoding='utf-8'))
deja = {e['image'] for e in plan['images']}
n = 0
for i, (pid, (titre, decor, geste, rouge, tenue_h, tenue_f)) in enumerate(P.items()):
    tiers = 'left' if i % 2 == 0 else 'right'
    for g, qui, pron, tenue in (('h', 'an English man of about forty', 'He', tenue_h), ('f', 'an English woman of about forty', 'She', tenue_f)):
        for v, air in (('charme', CHARME), ('terne', TERNE)):
            nom = f'creation/{pid}_{g}_{v}'
            texte = (f'Waist-up portrait of {qui}, a {titre} in London in 1923, wearing {tenue}. {air} '
                     f'{pron} {geste}. Placed in the {tiers} third of the frame. The rest: {decor}. The only red: {rouge}.\n\n{REGLES}\n\n{STYLE}\n')
            (ILL / 'prompts' / f'{nom}.txt').write_text(texte, encoding='utf-8')
            if nom not in deja:
                plan['images'].append({'image': nom, 'prompt': f'prompts/{nom}.txt', 'references': []}); n += 1
(ILL / 'plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(P) * 4} prompts écrits, {n} images ajoutées au plan ({len(plan["images"])} en tout)')
