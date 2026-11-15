# Liste des mots français courants (wordfreq), normalisés comme le jeu, avec leur lemme (simplemma).
# pip install wordfreq simplemma ; python3 liste_fr.py > fr.json ; puis node audit.js (voir README)
from wordfreq import top_n_list
import simplemma, unicodedata, json, re, sys
def norm(w):
    w = w.lower().replace('œ', 'oe').replace('æ', 'ae')
    return ''.join(c for c in unicodedata.normalize('NFD', w) if unicodedata.category(c) != 'Mn')
out = {}
for w in top_n_list('fr', 60000):
    if not re.fullmatch(r"[a-zàâäçéèêëîïôöùûüÿœæ]+", w): continue
    n = norm(w)
    if len(n) < 3 or n in out: continue
    out[n] = norm(simplemma.lemmatize(w, lang='fr'))
json.dump(out, sys.stdout)
