import pathlib
src = pathlib.Path('/home/claude/express/src')
html = (src/'index.html').read_text()
for tag, f in [('/*STYLE*/','style.css'),('/*ENGINE*/','engine.js'),('/*SCENE*/','scene.js'),('/*LONDRES*/','londres.js'),('/*LONDRESX*/','londres_circuits.js'),('/*LONDRESC*/','londres_combat.js'),('/*MOTS*/','mots.js'),('/*DICO*/','dico.js'),('/*MJ*/','mj.js'),('/*HUMEUR*/','humeur.js'),('/*PAROLE*/','parole.js'),('/*FICHES*/','fiches.js'),('/*JETS*/','jets.js'),('/*SEANCE*/','londres_seance.js'),('/*IMPRO*/','londres_impro.js'),('/*OBJETS*/','londres_objets.js'),('/*PARIS*/','paris.js'),('/*POISSY*/','poissy.js'), ('/*LAUSANNE*/','lausanne.js'), ('/*LAUSANNER*/','lausanne_reve.js'), ('/*OBJETSCLES*/','objets.js'),('/*IDEES*/','idees.js'),('/*FOLIE*/','folie.js'),('/*ART*/','art.js'),('/*ARTL*/','art_londres.js'),('/*ARTP*/','art_portraits.js'),('/*PHOTOS2*/','photos_v2.js'),('/*AUDIO*/','audio.js'),('/*CREATION*/','creation.js'),('/*UI*/','ui.js')]:
    code = (src/f).read_text()
    assert '</script' not in code.lower(), f
    html = html.replace(tag, code)
out = pathlib.Path('/home/claude/express/dist'); out.mkdir(exist_ok=True)
(out/'index.html').write_text(html)
print(len(html), 'bytes')
# le registre des savoirs : un sujet qui ne dit pas ce qu'il exige, un savoir inconnu, et la compilation s'arrête
import subprocess, sys
lint = next(p for p in [src.parent / 'test' / 'registre.js', src.parent / 'tools' / 'test_registre.js'] if p.exists())  # ici, ou dans le dépôt (jeu/tools)
r = subprocess.run(['node', str(lint)], capture_output=True, text=True)
print(r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr.strip()[:300])
if r.returncode != 0:
    print(r.stdout)
    sys.exit('Compilation refusée : le registre des savoirs est incomplet.')
