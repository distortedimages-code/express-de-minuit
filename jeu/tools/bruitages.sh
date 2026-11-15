#!/bin/sh
# Fabrique les bruitages du jeu (audio/sfx/*.wav) à partir du lot « RPG Audio » de Kenney (kenney.nl, CC0).
# Usage : sh bruitages.sh "dossier des .ogg de Kenney" dossier_de_sortie
# Chaque son : mono, 44,1 kHz, crête ramenée à -3 dB, entrée et sortie adoucies. Le WAV se lit partout, sans décalage.
set -e
SRC="$1"; OUT="$2"; mkdir -p "$OUT"
un() { # source, sortie
  pic=$(ffmpeg -hide_banner -nostats -i "$SRC/$1.ogg" -af "pan=mono|c0=0.5*c0+0.5*c1,volumedetect" -f null - 2>&1 | grep max_volume | sed 's/.*max_volume: \(.*\) dB/\1/')
  gain=$(python3 -c "print(round(-3 - ($pic), 2))")
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC/$1.ogg")
  fin=$(python3 -c "print(max(0, round($dur - 0.03, 3)))")
  # $3 : décibels en plus pour les sons très doux (une page qu'on tourne), retenus par un limiteur
  plus="${3:-0}"
  ffmpeg -loglevel error -y -i "$SRC/$1.ogg" -af "pan=mono|c0=0.5*c0+0.5*c1,volume=${gain}dB,volume=${plus}dB,alimiter=limit=0.7:attack=1:release=40:level=false,afade=t=in:d=0.002,afade=t=out:st=${fin}:d=0.03" -ar 44100 -c:a pcm_s16le "$OUT/$2.wav"
}
un door_close_1 porte1; un door_close_2 porte2; un door_close_4 porte3
un book_flip_1 page1 10; un book_flip_2 page2 8; un book_flip_3 page3 7
