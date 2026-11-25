# Fabrique src/dico.js : les mots français courants (wordfreq, 150 000 formes), sans accents, en minuscules,
# pour qu'un personnage sache si un mot du joueur est du français ordinaire ou un mot qu'il ne connaît pas.
# Codage de mots.js : longueur du préfixe commun avec le mot précédent (un chiffre, 9 au plus), puis la fin.
import unicodedata, wordfreq, re, os
def plat(w):
    w = unicodedata.normalize('NFD', w.lower().replace('œ', 'oe').replace('æ', 'ae'))
    return ''.join(c for c in w if unicodedata.category(c) != 'Mn')
mots = set()
for w in wordfreq.top_n_list('fr', 150000):
    for part in re.split(r"[’'\- ]", plat(w)):
        if re.fullmatch(r'[a-z]{2,}', part): mots.add(part)
mots = sorted(mots)
out, prev = [], ''
for w in mots:
    n = 0
    while n < min(len(w), len(prev), 9) and w[n] == prev[n]: n += 1
    out.append(str(n) + w[n:]); prev = w
js = ("/* Les mots français courants (wordfreq, sans accents) : tools/dico.py. Un mot du joueur qui n'est ni ici ni dans le\n"
      "   lexique du jeu est un mot que les personnages ne connaissent pas (« le zorglub ? »). */\n"
      "(function (G) {\n  'use strict';\n  var D = '" + ' '.join(out) + "';\n"
      "  var set = {}, prev = '';\n  D.split(' ').forEach(function (e) { var w = prev.slice(0, +e.charAt(0)) + e.slice(1); set[w] = 1; prev = w; });\n"
      "  G.RPG_DICO = set;\n})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'dico.js'), 'w').write(js)
print(len(mots), 'mots,', len(js) // 1024, 'Ko')
