import pathlib
src = pathlib.Path('/home/claude/express/src')
html = (src/'index.html').read_text()
for tag, f in [('/*STYLE*/','style.css'),('/*ENGINE*/','engine.js'),('/*SCENE*/','scene.js'),('/*LONDRES*/','londres.js'),('/*LONDRESX*/','londres_circuits.js'),('/*LONDRESC*/','londres_combat.js'),('/*MOTS*/','mots.js'),('/*MJ*/','mj.js'),('/*HUMEUR*/','humeur.js'),('/*PAROLE*/','parole.js'),('/*FICHES*/','fiches.js'),('/*JETS*/','jets.js'),('/*SEANCE*/','londres_seance.js'),('/*IMPRO*/','londres_impro.js'),('/*OBJETS*/','londres_objets.js'),('/*PARIS*/','paris.js'),('/*POISSY*/','poissy.js'), ('/*LAUSANNE*/','lausanne.js'), ('/*LAUSANNER*/','lausanne_reve.js'), ('/*OBJETSCLES*/','objets.js'),('/*IDEES*/','idees.js'),('/*FOLIE*/','folie.js'),('/*ART*/','art.js'),('/*ARTL*/','art_londres.js'),('/*ARTP*/','art_portraits.js'),('/*PHOTOS2*/','photos_v2.js'),('/*AUDIO*/','audio.js'),('/*CREATION*/','creation.js'),('/*UI*/','ui.js')]:
    code = (src/f).read_text()
    assert '</script' not in code.lower(), f
    html = html.replace(tag, code)
out = pathlib.Path('/home/claude/express/dist'); out.mkdir(exist_ok=True)
(out/'index.html').write_text(html)
print(len(html), 'bytes')
