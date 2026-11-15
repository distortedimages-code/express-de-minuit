#!/bin/sh
# Fabrique audio/pluie.mp3 : les quatre pluies de « Rain (loopable) », par Ylmir (OpenGameArt, CC0),
# enchaînées en une seule boucle d'environ deux minutes. https://opengameart.org/content/rain-loopable
# Usage : sh pluie.sh dossier_des_mp3 sortie.mp3      (le dossier contient 1.mp3, 2.mp3, 3.mp3 et 4.mp3)
# Les niveaux sont rapprochés (la plus fine remontée, la plus forte baissée) pour que la pluie respire
# sans jamais disparaître ; ordre : moyenne, soutenue, forte, fine. Le jeu fond ensuite la fin dans le début.
set -e
D="$1"; S="${2:-pluie.mp3}"
ffmpeg -loglevel error -y -i "$D/3.mp3" -i "$D/1.mp3" -i "$D/2.mp3" -i "$D/4.mp3" -filter_complex \
"[0:a]volume=3.5dB[a];[1:a]volume=0.5dB[b];[2:a]volume=-3dB[c];[3:a]volume=10dB[d];\
[a][b]acrossfade=d=3:c1=qsin:c2=qsin[ab];[ab][c]acrossfade=d=3:c1=qsin:c2=qsin[abc];[abc][d]acrossfade=d=5:c1=qsin:c2=qsin[x];\
[x]highpass=f=40,alimiter=limit=0.89:attack=2:release=60:level=false[out]" \
-map "[out]" -c:a libmp3lame -b:a 160k -joint_stereo 1 -id3v2_version 0 "$S"
