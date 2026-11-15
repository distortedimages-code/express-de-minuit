# les documents remis au joueur : un de chaque sorte, dans le fil et dans le carnet (iPhone et Mac)
import asyncio
from playwright.async_api import async_playwright
DOCS = [
 ("J’AI TROUVÉ CE QUE BERTIN CHERCHAIT STOP WAGON-RESTAURANT VINGT-TROIS HEURES STOP VENEZ SEUL STOP RAVEL", "Télégramme reçu"),
 ("SÛRETÉ GÉNÉRALE À M. ASHBY — TROIS TÉLÉGRAMMES SIGNÉS M. DÉPOSÉS BUREAU GARE DE LYON LE 2 JANVIER STOP EXPÉDITEUR INCONNU STOP", "Télégramme de Paris"),
 ("Cher Monsieur, chère Madame, votre annonce m’a fait bondir. Passez donc me voir à Camberwell. Votre dévoué, Arthur Butter, président.", "Une lettre de Camberwell"),
 ("Très honoré Professeur, un objet est entré en ma possession, une tête de statue d’un travail très ancien…", ""),
 ("LE CADAVRE DU BRITISH MUSEUM — Un lecteur retrouvé sans vie dans la salle de lecture. La police ne fait aucun commentaire. Le personnel du musée se dit bouleversé et la salle restera fermée jusqu’à nouvel ordre.", ""),
 ("DÉRAILLEMENT DE L’EXPRESS DE LIVERPOOL — Quarante-trois morts. Parmi eux, M. Randolph Alexis, de Hampstead.", ""),
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for nom, w, h, dpr, mob in [('iphone', 390, 844, 3, True), ('mac', 1440, 900, 2, False)]:
            pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=dpr, has_touch=mob, is_mobile=mob)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(500)
            await pg.evaluate("localStorage.clear()"); await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(900)
            await pg.mouse.click(w // 2, h // 2); await pg.wait_for_timeout(500)
            await pg.click('#btnLondres'); await pg.wait_for_timeout(400)
            await pg.click('#cards .act'); await pg.wait_for_timeout(3500)
            kinds = await pg.evaluate("(docs) => docs.map(d => window.__docHTML({x: d[0], title: d[1]}).cls)", DOCS)
            print(nom, kinds)
            await pg.evaluate("(docs) => { const g = window.__partie; docs.forEach(d => g.api.doc(d[0], d[1])); g.api.say('—'); }", DOCS)
            await pg.fill('#cmd', 'regarder'); await pg.press('#cmd', 'Enter'); await pg.wait_for_timeout(2500)
            n = await pg.evaluate("document.querySelectorAll('#log .e-doc').length")
            el = await pg.query_selector_all('#log .e-doc')
            for i, e in enumerate(el[:6]):
                await e.scroll_into_view_if_needed(); await e.screenshot(path=f'/tmp/doc_{nom}_{i}.png')
            await pg.click('#btnNotes'); await pg.wait_for_timeout(600)
            nd = await pg.evaluate("document.querySelectorAll('#notesBody .docs .e-doc').length")
            over = await pg.evaluate("document.documentElement.scrollWidth > window.innerWidth")
            await pg.screenshot(path=f'/tmp/docs_carnet_{nom}.png')
            print(nom, '| dans le fil :', n, '| dans le carnet :', nd, '| débordement :', over, '| erreurs :', errs[:2])
            await pg.close()
        await b.close()
asyncio.run(main())
