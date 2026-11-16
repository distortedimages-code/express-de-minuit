"""Écrit les prompts des gros plans paranoïaques (un par investigateur jouable : les quatre prédéfinis et les 40 photos
de la création, chacun avec son portrait en référence d'identité) et ceux des situations qui n'avaient pas d'image
(le pub, l'église, les quais, leurs trois personnages, les deux postes de police), puis les ajoute à illustrations/plan.json.
Usage : python3 jeu/tools/prompts_paranoia.py   (depuis la racine du dépôt ; relançable sans doublons)"""
import json, pathlib
RACINE = pathlib.Path(__file__).resolve().parents[2]
ILL = RACINE / 'illustrations'
modele = (ILL / 'prompts/portraits/pj_doyle.txt').read_text(encoding='utf-8')
REGLES = modele[modele.index('Strict rules:'):modele.index('Style:')].strip()
STYLE = modele[modele.index('Style:'):].strip()
plan = json.loads((ILL / 'plan.json').read_text(encoding='utf-8'))
deja = {e['image'] for e in plan['images']}
ajouts = []
def ecrire(nom, texte, refs=()):
    (ILL / 'prompts' / f'{nom}.txt').write_text(texte.strip() + f'\n\n{REGLES}\n\n{STYLE}\n', encoding='utf-8')
    if nom not in deja: plan['images'].append({'image': nom, 'prompt': f'prompts/{nom}.txt', 'references': list(refs)}); ajouts.append(nom)

# ---- les gros plans : le visage de l'investigateur, quand sa raison lâche
GROS = ('Extreme close-up of the face of the person shown in the reference image, the same face, hair and age, in the grip of paranoia, alone in the dark. '
        'Eyes wide open and bloodshot, the pupils darting toward the edge of the frame as if something stood just behind the viewer; '
        'cold sweat on the forehead and upper lip, a sleepless greyish skin, a jaw clenched so hard the cheek muscles show, a few strands of hair stuck to the temple. '
        'Hard light from below, like a candle held under the chin, throwing distorted shadows upward. '
        'The face fills the middle of the panoramic frame, the eyes on its horizontal centre line; on both sides, nothing but darkness and long jagged painted shadows that lean toward the face like fingers. '
        'No other person, no hands, no text. The only red: a faint red reflection glinting in both pupils, as if something red were burning behind the viewer.')
for k in ['pemberton', 'doyle', 'ashby', 'arnaud']:
    ecrire(f'paranoia/pj_{k}', GROS, [f'portraits/pj_{k}'])
for e in [e for e in plan['images'] if e['image'].startswith('creation/')]:
    ecrire('paranoia/' + e['image'].split('/', 1)[1], GROS, [e['image']])

# ---- les lieux et les gens des improvisations, les nuits au poste
S = {
 'londres/28_museum-tavern': 'Interior of the Museum Tavern, a Victorian pub facing the British Museum in London in January 1923: mahogany and polished brass, engraved mirrors behind the bar, a coal fire, gas lamps, tobacco haze. At the bar, two clerks and two students in scarves; in a corner, an old soldier with medals on a threadbare coat, talking to himself. Behind the bar, a huge landlord with red side-whiskers wipes a glass. The only red: the glowing coals of the fire.',
 'londres/29_eglise-st-george': 'Interior of St George\'s church in Bloomsbury, London, January 1923: a white Georgian nave, tall clear windows letting in a grey winter light, box pews, a pulpit, cold stone. A gaunt clergyman in a white surplice puts hymn books back along the pews, alone. Hard light from the tall windows, long slanted shadows of the window bars across the floor. The only red: the red altar cloth.',
 'londres/30_quais-de-la-tamise': 'The Victoria Embankment in London at night, January 1923, in thick fog: a granite parapet, a row of gas lamps whose halos float in the fog, an iron bench, the river invisible below, only guessed at; far off, a bridge arch half swallowed by fog. Nobody in sight. The only red: the small red lamp of an unseen barge, out on the river.',
 'portraits/35_patron': 'Waist-up portrait of Barnaby Rudd, landlord of the Museum Tavern in London in 1923: a colossus with huge ginger side-whiskers, a bald head, rolled shirtsleeves on forearms like hams, a striped waistcoat, a cloth over his shoulder. He leans both fists on the mahogany bar and looks straight at the viewer, sizing them up. Placed in the right third of the frame. The rest: engraved mirrors, rows of bottles, brass beer pumps, a coal fire. The only red: his ginger side-whiskers.',
 'portraits/36_hollis': 'Waist-up portrait of the Reverend Ambrose Hollis, an Anglican clergyman in London in 1923: very thin, a long pale face, sparse grey hair, tired kind eyes, a black cassock under a white surplice. He holds a pile of hymn books against his chest and looks at the viewer as if listening to a confession. Placed in the left third of the frame, in a white church nave with tall grey windows. The only red: the ribbon bookmark of the top hymn book.',
 'portraits/37_ramasseur': 'Waist-up portrait of a mudlark, a ragged boy of about twelve scavenging the Thames foreshore in London in 1923: a cap too big for him, a face streaked with mud, sharp distrustful eyes, a torn jacket, a sack over his shoulder and an iron hook in his hand. He stands in the black mud at low tide under a stone bridge arch, in the fog. Placed in the right third of the frame. The only red: a red rag tied around his wrist.',
 'situations/01_poste-de-bow-street': 'A police cell at Bow Street police station in London, at night in January 1923: whitewashed brick walls, an iron-barred door, a long wooden bench. On the bench, a pickpocket asleep with his cap over his eyes, and a sailor singing with his eyes closed. In the foreground, an empty place on the bench, as if waiting for the viewer. A single caged gas lamp in the corridor throws the shadow of the bars across the floor. The only red: the sailor\'s red neckerchief.',
 'situations/02_poste-de-la-rue-de-la-banque': 'A police holding room at the rue de la Banque station in Paris, at night in January 1923: a plank bed against a peeling wall, a barred window, a bucket. A street hawker sleeps sitting up, his tray of shoelaces at his feet; a drunk in a dented top hat declaims verse with one arm raised. A harsh electric bulb in a wire cage. The only red: the drunk man\'s red waistcoat.',
}
for nom, t in S.items(): ecrire(nom, t)

# ---- les visions éclair : des images du Mythe qui ne restent à l'écran qu'une fraction de seconde
V = [
 ('01_dents-a-la-place-des-yeux', 'A calm, well-groomed 1920s gentleman in a high collar, seen face on; where his eyes should be, two neat rows of human teeth, slightly parted. He seems untroubled.', 'a red tie pin'),
 ('02_dents-qui-transpirent', 'Extreme close-up of an open human mouth: the teeth are sweating, beads of black water running down their enamel as if they were alive and afraid.', 'the gums'),
 ('03_spirale-dans-la-buee', 'A fogged window at night with a spiral of seven turns traced by a wet finger; on the other side of the glass, many pale palms pressed flat against it.', 'a single red fingerprint at the centre of the spiral'),
 ('04_fideles-noyes', 'Rows of drowned people sitting in church pews at the bottom of a black lake, hair floating, all turned toward the viewer in the same instant; weak light falling from far above.', 'one drowned woman\'s red hat'),
 ('05_cite-engloutie', 'A colossal city of green-black stone under deep water, with impossible angles: staircases that climb and descend at once, doors lying flat, a monolith covered in carvings; tiny fish like dust.', 'a red glow behind a vast door left ajar'),
 ('06_forme-sur-la-mer', 'A night sea under low clouds; on the horizon, rising from the water, the outline of an immense winged shape with a head crowned by tentacles, larger than the clouds, seen only as a silhouette.', 'a red light on a tiny steamship in the foreground'),
 ('07_yeux-dans-le-papier-peint', 'A hotel room wall covered with floral wallpaper; dozens of human eyes have opened in the pattern, all looking at the viewer.', 'the iris of one single eye'),
 ('08_main-trop-articulee', 'A human hand with far too many joints, fingers bending backward like the legs of a spider, delicately holding a pocket watch whose hands spin wildly.', 'the watch\'s second hand'),
 ('09_visage-de-poisson', 'A man in a bowler hat on a foggy railway platform; his face is halfway to becoming a fish: bulging unblinking eyes set too far apart, a flattened nose, gills opening at his starched collar.', 'a red carnation in his buttonhole'),
 ('10_bouche-dans-la-paume', 'An open human palm held toward the viewer; in its centre, a small mouth with thin lips is whispering.', 'the inside of the tiny mouth'),
 ('11_peau-sur-un-cintre', 'Inside an open wardrobe, an empty, hollow human skin hangs neatly from a coat hanger like a suit, next to real suits; no blood, only the wrongness of its shape.', 'a red silk lining in the wardrobe door'),
 ('12_voiture-des-morts', 'The corridor of an old railway carriage full of seated passengers in 1890s clothes, every head turned completely backward to face the viewer, smiling.', 'a red tassel on the window blind'),
 ('13_statue-qui-ouvre-l-oeil', 'A broken ancient statue of a seated man, cracked and missing an arm, in a dark museum storeroom; one stone eye has opened, wet and alive.', 'a red wax seal on the crate beneath it'),
 ('14_foule-sans-visage', 'A London crowd in thick fog, men and women in coats and hats, all of them with smooth blank skin where their faces should be, all turned toward the viewer.', 'a red umbrella in the crowd'),
 ('15_visage-dans-l-eau-noire', 'A white porcelain washbasin filling with black water that rises by itself; on its surface, a face is forming, mouth open.', 'a red bar of soap'),
 ('16_sigle-grave', 'A strange angular sigil of three hooked lines and a broken circle, burned deep into the wood of an old door, still smoking slightly; dark liquid seeps from the grooves.', 'the embers glowing inside the burned grooves'),
 ('17_etoile-et-oeil', 'A five-pointed star carved into an ancient grey stone slab, with a flaming eye at its centre; the stone is wet and cracked.', 'the flame inside the eye'),
 ('18_sous-la-porte', 'The bottom of a hotel room door seen from the floor at night: from the gap underneath, dark wet tentacles slide slowly into the room across the carpet.', 'the light from the corridor seeping under the door'),
 ('19_reflet-qui-sourit', 'A mirror over a washstand in an empty room; in the mirror, a reflection of someone smiling with far too many teeth, although nobody stands in front of it.', 'a red toothbrush in a glass'),
 ('20_etoiles-en-oeil', 'A night sky over dark rooftops and chimneys; the stars have arranged themselves into the shape of a single gigantic eye looking down at the city.', 'the pupil of the star-eye'),
]
for nom, t, rouge in V:
    ecrire('visions/' + nom, f'A nightmare vision, a single frozen image. {t} No text, no letters. The only red: {rouge}.')
(ILL / 'plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(ajouts)} images ajoutées au plan ({len(plan["images"])} en tout)')
