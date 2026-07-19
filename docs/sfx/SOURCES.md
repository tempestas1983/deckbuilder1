# Soundeffekt-Quellen

Alle Dateien in diesem Ordner stammen von [freesound.org](https://freesound.org),
Lizenz **CC0** (gemeinfrei, keine Namensnennung nötig) — heruntergeladen als
Vorschau-Qualität (`-hq.mp3`, i. d. R. ausreichend für kurze Spiel-SFX). Diese
Tabelle dient nur der Nachvollziehbarkeit, ist rechtlich nicht erforderlich.

| Datei | Trigger im Spiel | Originaltitel | Autor | Quelle |
|---|---|---|---|---|
| card-play.mp3 | Karte legen/spielen | flipCard.wav | Splashdust | https://freesound.org/people/Splashdust/sounds/84322/ |
| card-draw.mp3 | Karte ziehen | draw_card.mp3 | eggdeng | https://freesound.org/people/eggdeng/sounds/502659/ |
| spell-cast.mp3 | Zauber wirken | Teleport - Rpg | colorsCrimsonTears | https://freesound.org/people/colorsCrimsonTears/sounds/563542/ |
| attack-swing.mp3 | Angriff erklärt | Sword Swing 3 | Nomagician | https://freesound.org/people/Nomagician/sounds/840717/ |
| combat-hit.mp3 | Kampf-Treffer/Schaden | FX - HIT IMPACT - Retro Videogame | bolkmar | https://freesound.org/people/bolkmar/sounds/442325/ |
| creature-death.mp3 | Kreatur stirbt | monster_sound_medium_death.wav | Leadstarson | https://freesound.org/people/Leadstarson/sounds/559621/ |
| life-loss.mp3 | Lebenspunkte verlieren | Error Signal 2 | Breviceps | https://freesound.org/people/Breviceps/sounds/445978/ |
| life-gain.mp3 | Lebenspunkte gewinnen | victory chime | 1bob | https://freesound.org/people/1bob/sounds/717771/ |
| victory.mp3 | Sieg | Fanfare 2 - Rpg | colorsCrimsonTears | https://freesound.org/people/colorsCrimsonTears/sounds/580310/ |
| defeat.mp3 | Niederlage | j1game_over_mono.wav | jivatma07 | https://freesound.org/people/jivatma07/sounds/173859/ |
| ui-click.mp3 | Button/UI-Klick | UI Button Click | el_boss | https://freesound.org/people/el_boss/sounds/677861/ |
| deck-shuffle.mp3 | Mischen/Mulligan | Card Shuffle.wav | CaptainYulef | https://freesound.org/people/CaptainYulef/sounds/638698/ |

## Status

Ins UI eingebunden: `vite.config.ts#sfxPlugin` liefert die Dateien unter
`/sfx/<name>.mp3` aus, `src/ui/sfxPlayer.ts` spielt sie ab
(`store.ts#playSfxForEvent` übersetzt `GameEvent`s aus der Engine in
`playSfx()`-Aufrufe, exakt parallel zu `describeEvent`/dem Log). Eigener
Mute-Zustand (`store.ts#isSfxEnabled`/`toggleSfxEnabled`,
`components/sfxToggle.ts`), unabhängig vom Musik-Mute.
