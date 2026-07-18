# Karten-Artwork-Briefing (für externe Bildgenerierung)

Dieses Dokument dient als Auftragsgrundlage, um die Artworks für alle 300
Karten des Starter-Sets `core` extern (z. B. Gemini/ChatGPT-Bildgenerierung)
erzeugen zu lassen, da die Bildgenerierung nicht Teil dieses Projekts/dieser
Werkzeugkette ist. Jede Zeile der Tabelle liefert einen eindeutigen
Ziel-Dateinamen (1:1 aus der Karten-`id` abgeleitet) sowie eine kurze,
deutschsprachige Bildbeschreibung, damit später jedes extern generierte Bild
wieder eindeutig der richtigen Karte zugeordnet werden kann.

**UI-Anbindung (frontend-engineer, seit `docs/frontend-status.md` v0.1.12):**
Der Ablageort/Workflow ändert sich NICHT — Dateien weiterhin einfach hier in
`docs/cards/artworks/` ablegen, wann immer welche fertig werden (auch
einzeln/nach und nach, nie alle 300 auf einmal nötig). Das UI versucht für
jede Karte automatisch, `docs/cards/artworks/<id-mit-bindestrichen>.png` zu
laden; ist die Datei (noch) nicht vorhanden, bleibt unverändert der
bisherige Farbverlauf-Platzhalter sichtbar — kein manueller Schritt, kein
Registrieren neuer Dateien irgendwo im Code nötig.

## Stilleitfaden (für konsistente Ergebnisse über alle 300 Prompts)

**Allgemeiner Look:** Fantasy-Sammelkartenspiel-Illustration im gemalten,
digital-painterly Stil — kein Foto, kein 3D-Render, kein Comic-/Anime-Stil.
Jedes Bild zeigt **ausschließlich das reine Kunstmotiv**, OHNE Kartenrahmen,
OHNE Namens-/Kosten-/Regeltext, OHNE Mana-Icons oder sonstige UI-Elemente —
der Kartenrahmen samt Farbfläche existiert bereits separat im UI
(`docs/frontend-status.md`, Abschnitt „Klassisches Kartenrahmen-Layout ohne
Artwork", v0.1.10) und wird durch dieses Artwork lediglich befüllt, nicht
ersetzt.

**Seitenverhältnis:** querformatnah/leicht breiter als hoch (empfohlen 4:3
oder 3:2), passend zu einem Kartenrahmen-Bildbereich, der breiter als hoch
ist. Kein Hochformat.

**Farbthemen je Mana-Farbe** (aus der Farbidentität in
`docs/cards/starter-set.md`):

- **flame** — Aggression/Feuer: warme Rot-Orange-Töne, Flammen, Glut, Asche,
  Rauch, aggressive Krieger/Elementarwesen-Motive.
- **tide** — Tempo/Wasser: kühle Blau-Türkis-Töne, Meer/Gezeiten/Strömung,
  Wassergeister, Nebel, fließende Bewegung.
- **wild** — Wachstum/Wald: satte Grün-Braun-Töne, Wurzeln, Ranken, Dornen,
  Moos, Bestien und Baumhüter, dichtes Unterholz.
- **light** — Verteidigung/Heilung: warme Gold-Weiß-Töne, Sonnenlicht,
  Tempel/Heiligtümer, Kleriker/Geister, schützende Ausstrahlung.
- **void** — Opfer/Tod: dunkle Violett-Schwarz-Töne, Verwesung, Untote,
  Dämonen, Flüche, Schatten und fahles Zwielicht.
- **Farblose Relics/Terrains:** neutrale Materialtöne (Stein, Metall, Holz,
  Glas — je nach Untertyp/Motiv), keine Zuordnung zu einer Mana-Farbe.

**Hinweis zu Bildbeschreibungen:** Da praktisch keine Karte einen
Flavortext besitzt, basiert jede Bildidee auf Kartenname, Untertyp,
Regeltext, Typ und Farbthema — nicht auf einer wörtlichen Übersetzung des
Regeltexts, sondern auf einem stimmigen visuellen Motiv.

## Tabelle (300 Karten, alphabetisch nach `id`)

| Dateiname | Kartenname | Farbe(n) | Typ (Untertyp) | Seltenheit | Bildbeschreibung |
|---|---|---|---|---|---|
| core-abyssal-lurker.png | Abgrundlauerer | tide | unit (Krake) | common | Eine schleimige, dunkle Krake mit giftig schimmernden Tentakeln lauert in den trüben Tiefen einer Unterwasserabgrund-Schlucht. |
| core-abyssal-undertow.png | Abgrundsog | tide | enchantment | rare | Ein gewaltiger, düsterer Strudel reißt Trümmer und Licht in die lichtlose Tiefe des Meeres. |
| core-aegis-oath.png | Ägis-Schwur | light | spell | common | Ein goldener Schildschein umhüllt eine Kreatur mit dauerhaftem, leuchtendem Schutzsegen. |
| core-aegis-ward.png | Ägis-Schutz | light | spell | common | Ein kurz aufblitzender goldener Lichtschild schützt eine Kreatur mitten im Kampf. |
| core-aerie-benediction.png | Federsegen | light | unit (Geist) | common | Ein leuchtender, gefiederter Geist schwebt segnend über den Wolken im warmen Gegenlicht der Morgensonne. |
| core-allfield-standard.png | Allfeld-Feldzeichen | farblos | relic (Wunderwerk) | uncommon | Ein schlichtes Feldzeichen aus verwittertem Metall und Stoff weht über einem neutralen Schlachtfeld. |
| core-ash-duelist.png | Aschenduellant | flame | unit (Krieger) | common | Ein aschbedeckter Duellant mit brennender Klinge stürmt blitzschnell in den ersten Angriff. |
| core-ashborn-brand.png | Aschgeborenes Brandmal | flame | enchantment | rare | Ein glühendes Brandzeichen aus Asche und Glut brennt sich in ein Banner aus verkohltem Leder ein. |
| core-ashbound-brazier.png | Aschgebundene Feuerschale | flame | enchantment | common | Eine eiserne Feuerschale voller schwelender Asche und züngelnder Flammen auf einem Ritualaltar. |
| core-ashbound-curse.png | Fluch der Aschenbindung | flame | enchantment | uncommon | Dunkelrote Rauchschwaden winden sich fesselnd um eine verfluchte, aschebedeckte Gestalt. |
| core-ashbrand-vanguard.png | Aschbrand-Vorhut | flame | unit (Krieger) | uncommon | Ein hagerer, narbiger Vorkämpfer mit aschgeschwärzter Rüstung stürmt kopfüber in die feindlichen Reihen. |
| core-ashclaim-shrine.png | Aschanspruch-Schrein | flame | enchantment | rare | Ein Schrein aus geborstenem, rußgeschwärztem Stein, umgeben von ewig glimmender Glut. |
| core-ashen-ledger.png | Aschfahles Kontobuch | farblos | relic (Wunderwerk) | uncommon | Ein vergilbtes, aschgraues Kontobuch mit verbrannten Seitenrändern und geheimnisvollen Einträgen. |
| core-ashfall-plague.png | Aschfall-Seuche | flame | enchantment | rare | Grauer Ascheregen fällt wie Seuchenstaub über ein verbranntes, verödetes Land. |
| core-aureate-caller.png | Goldene Ruferin | light | unit (Kleriker) | uncommon | Eine golden gewandete Klerikerin ruft mit erhobenem Zepter Licht und Segen herbei. |
| core-aureate-wings.png | Goldene Schwingen | light | spell | uncommon | Strahlend goldene Federschwingen wachsen aus Licht und heften sich dauerhaft an eine gesegnete Kreatur. |
| core-aurora-swarm.png | Schwarm der Morgenröte | light | spell | common | Ein Schwarm kleiner, leuchtender Lichtgeister erhebt sich flatternd im rosigen Glanz der Morgenröte. |
| core-banelight-templar.png | Bannlicht-Templerin | light | unit (Kleriker) | common | Eine Templerin in weiß-goldener Rüstung führt eine mit giftig-heiligem Licht schimmernde Klinge. |
| core-banishment-rite.png | Verbannungsritus | light | spell | rare | Ein gleißender Lichtstrahl aus dem Himmel reißt eine feindliche Kreatur in einen strahlenden Riss zwischen den Welten. |
| core-bastion-forgeworks.png | Bastionschmiede | farblos | relic (Wunderwerk) | rare | Eine gewaltige, von Ambossen und Schmiedefeuer erfüllte Bastionshalle aus grauem Stein und Eisen. |
| core-bastionplate-standard.png | Bastionplatten-Feldzeichen | farblos | relic (Wunderwerk) | uncommon | Ein massives Feldzeichen aus geschmiedeten Metallplatten, fest verankert auf dem Schlachtfeld. |
| core-battleforge-idol.png | Kampfschmiede-Idol | farblos | relic (Wunderwerk) | uncommon | Ein aus Kriegsschrott geschmiedetes Idol, gekrönt mit gekreuzten Klingen und Kettengliedern. |
| core-blazing-frenzy.png | Lodernder Rausch | flame | spell | common | Eine Kreatur wird von einem lodernden, roten Feuerrausch erfasst, der Muskeln und Klinge zum Glühen bringt. |
| core-blessed-vigor.png | Gesegnete Kraft | light | spell | common | Ein warmer, goldener Lichtschein durchflutet eine Kreatur und lässt sie im Kampf heilende Kraft ausstrahlen. |
| core-blessing-of-steadfastness.png | Segen der Standhaftigkeit | light | enchantment | common | Ein sanftes, goldenes Symbol der Standhaftigkeit schwebt schützend über einer gepanzerten Gestalt. |
| core-blightmire-shroud.png | Fäulmoor-Schleier | void | enchantment | rare | Ein fauliger, violett-schwarzer Nebelschleier hängt tief über einem toten, verseuchten Moor. |
| core-bloodforge-brand.png | Blutschmiede-Brandmal | farblos | relic (Wunderwerk) | uncommon | Ein aus dunklem Metall geschmiedetes Brandeisen, an dem noch getrocknetes Blut haftet. |
| core-bloodpact-shackle.png | Blutpakt-Fessel | farblos | relic (Wunderwerk) | uncommon | Eine schwere, mit blutroten Runen verzierte Eisenfessel, geschmiedet für einen unheilvollen Pakt. |
| core-bramble-surge.png | Dornenstoß | wild | spell | common | Dicke, splitternde Dornenranken schießen ruckartig aus dem Waldboden und durchbohren alles im Weg. |
| core-bramblecoat-mantle.png | Dornmantel-Umhang | wild | enchantment | uncommon | Ein dichter, aus verflochtenen Dornenranken gewebter Umhang legt sich schützend um eine Kreatur. |
| core-bramblehide-sentinel.png | Dornfellwächter | wild | unit (Bestie, Wächter) | uncommon | Eine massige, dornenbewehrte Bestie mit zottigem Fell wacht reglos am Waldrand. |
| core-bramblewild-shaman.png | Dornwild-Schamanin | wild | unit (Druide) | uncommon | Eine Schamanin in Rindenrüstung, deren Stab mit Dornenranken umwunden ist, steht inmitten wilden Unterholzes. |
| core-brand-of-fury.png | Brandmal der Wut | flame | enchantment | uncommon | Ein grimmiges, feuerrotes Brandsymbol der Wut brennt sich in eine kriegerische Rüstung. |
| core-brandblade-fledgling.png | Brandklinge-Lehrling | flame | unit (Krieger) | common | Ein junger Krieger mit einer noch glühenden, frisch geschmiedeten Klinge stürmt ungeduldig voran. |
| core-brandwatch-mercenary.png | Brandwacht-Söldner | flame | unit (Krieger) | uncommon | Ein zäher Söldner mit brandvernarbtem Schild hält unbeirrt seine Stellung im Flammenschein. |
| core-brandwing-harrier.png | Brandschwingen-Falke | flame | unit (Elementarwesen) | common | Ein feuriges Falkenwesen aus Glut und Rauch zieht seine brennenden Schwingen kreischend durch die Luft. |
| core-brightpath-vision.png | Lichtpfad-Vision | light | spell | common | Ein strahlender Lichtpfad öffnet sich vor einer betenden Gestalt und offenbart eine Vision der nahen Zukunft. |
| core-cataclysm-brand.png | Kataklysmen-Brandmal | flame | spell | uncommon | Ein gewaltiger Feuerpfeiler bricht aus geborstenem Boden hervor und brandmarkt alles ringsum mit Verwüstung. |
| core-chain-manacles.png | Kettenfessel | farblos | relic (Wunderwerk) | uncommon | Schwere, rostige Kettenfesseln liegen aufgerollt auf einem alten Steinsockel. |
| core-cinder-pup.png | Glutpfote | flame | unit (Wolf) | common | Ein kleiner Wolfswelpe mit glühend orangefarbenem Fell und funkensprühenden Pfoten. |
| core-cinderborn-raider.png | Glutgeborener Plünderer | flame | unit (Elementarwesen) | common | Ein aus Glut und Asche geborener Plünderer hetzt mit lodernden Gliedmaßen über das Schlachtfeld. |
| core-cinderbound-mark.png | Aschgebundenes Mal | flame | enchantment | uncommon | Ein glühendes Brandmal aus Asche haftet an einer Kreatur und treibt sie zu hastigem Angriff an. |
| core-cinderclad-raider.png | Aschgewandeter Räuber | flame | unit (Krieger) | common | Ein in aschgraue Fellumhänge gehüllter Räuber walzt mit brutaler Wucht durch feindliche Linien. |
| core-cinderdrift-wing.png | Aschentrift-Schwinge | flame | unit (Elementarwesen) | common | Ein flackerndes Flügelwesen aus treibender Asche gleitet lautlos durch verrauchte Lüfte. |
| core-cinderfall-idol.png | Aschfall-Idol | farblos | relic (Wunderwerk) | common | Ein aschbedecktes, verwittertes Steinidol steht einsam inmitten fallender grauer Flocken. |
| core-cinderforge-charm.png | Glutschmiede-Amulett | flame | enchantment | rare | Ein glühendes Amulett aus geschmiedeter Glut umgibt sich mit einem eigenen, sparsamen Funkenkranz. |
| core-cinderlash-brute.png | Glutpeitschen-Schläger | flame | unit (Elementarwesen) | uncommon | Ein muskulöser Feuerschläger schlägt mit einer aus Glutpeitschen geformten Waffe zurück, sobald er getroffen wird. |
| core-cinderroot-brand.png | Aschwurzel-Brandmal | flame | spell | uncommon | Verkohlte, glimmende Wurzelranken winden sich dauerhaft um die Beine einer Kreatur und treiben sie unaufhaltsam vorwärts. |
| core-cinderwake-marauder.png | Aschwoge-Plünderer | flame | unit (Elementarwesen) | common | Ein Plünderer aus tosender Feuerwoge hinterlässt beim Verlöschen einen letzten, explosiven Funkenregen. |
| core-cinderwatch-raider.png | Aschwacht-Plünderer | flame | unit (Krieger) | common | Ein wachsamer Plünderer mit rußgeschwärztem Speer hält scharfen Ausguck über glühende Ruinen. |
| core-cinderwing-fledgling.png | Glutschwingen-Junges | flame | unit (Elementarwesen) | uncommon | Ein junges Feuerwesen mit noch ungelenken, funkensprühenden Schwingen übt erste Flugversuche. |
| core-cinderwrack-engine.png | Sengende Kriegsmaschine | farblos | relic (Wunderwerk, Belagerungsgerät) | rare | Eine monströse, mit Feuerrohren bestückte Belagerungsmaschine speit auf Kommando sengende Feuerbälle. |
| core-cinderwrath-mantle.png | Aschzorn-Mantel | flame | enchantment | uncommon | Ein zorndurchglühter Umhang aus versengtem Stoff hüllt eine Kreatur in flackernde Wut. |
| core-clockwork-brooch.png | Uhrwerkbrosche | farblos | relic (Wunderwerk) | uncommon | Eine filigrane, tickende Uhrwerkbrosche aus poliertem Messing mit sichtbaren Zahnrädern. |
| core-clockwork-mainspring.png | Uhrwerk-Triebfeder | farblos | relic (Wunderwerk) | uncommon | Eine straff gespannte, glänzende Triebfeder aus Metall im Inneren eines aufgeklappten Uhrwerks. |
| core-corrosive-clamp.png | Zersetzende Klammer | farblos | relic (Wunderwerk) | uncommon | Eine von Rost und ätzender Säure zerfressene Metallklammer mit tropfenden grünlichen Flecken. |
| core-current-diplomat.png | Strömungsdiplomatin | tide | unit (Wassergeist) | uncommon | Eine elegante, aus fließendem Wasser geformte Diplomatin verhandelt gestenreich inmitten strömender Gezeiten. |
| core-current-seer.png | Strömungsseher | tide | unit (Geist) | common | Ein durchscheinender Wassergeist mit leuchtenden Augen blickt tief in eine ruhige Strömung. |
| core-dawn-medic.png | Morgendliche Heilerin | light | unit (Kleriker) | common | Eine sanfte Heilerin in schlichtem, weißem Gewand kniet im Morgenlicht neben einem Verwundeten. |
| core-dawnblade-adept.png | Morgenklingen-Adeptin | light | unit (Kleriker) | common | Eine Adeptin mit einer im Morgenlicht glänzenden Klinge greift mit geübter Schnelligkeit an. |
| core-dawnborn-duelist.png | Morgengeborener Duellant | light | unit (Krieger) | common | Ein im Morgengrauen geborener Duellant tritt mit goldbeschienener Klinge zum ersten Gefecht des Tages an. |
| core-dawncast-shrine.png | Morgenzauber-Schrein | light | enchantment | common | Ein schlichter Schrein aus hellem Marmor fängt die ersten warmen Strahlen der Morgensonne ein. |
| core-dawnfeather-scout.png | Morgenfeder-Kundschafterin | light | unit (Geist) | common | Eine federleichte Geistkundschafterin gleitet mit goldenen Federn durch die aufziehende Morgendämmerung. |
| core-dawnglow-mercy.png | Morgenglanz-Gnade | light | spell | common | Ein warmes, goldenes Glühen strömt heilend über einen erschöpften Kämpfer im ersten Morgenlicht. |
| core-dawnhaven-covenant.png | Morgenhort-Bund | light | enchantment | rare | Ein leuchtender Bundesaltar aus weißem Stein verbindet eine ganze Streitmacht mit heilendem Morgenlicht. |
| core-dawnrise-champion.png | Morgenaufgangs-Champion | light | unit (Krieger) | uncommon | Ein strahlender Champion erhebt sein Schwert hoch über den Kopf, während die Sonne hinter ihm aufgeht. |
| core-dawnrise-sanctuary.png | Morgenaufgangs-Heiligtum | light | enchantment | uncommon | Ein von goldenem Morgenlicht durchflutetes Heiligtum mit hohen, offenen Torbögen. |
| core-dawnroot-blessing.png | Morgenwurzel-Segen | light | spell | uncommon | Goldene Lichtwurzeln wachsen segnend aus dem Boden und stärken zwei nahe Kämpfer zugleich. |
| core-dawnward-standard.png | Morgenwacht-Feldzeichen | light | enchantment | rare | Ein hoch aufragendes, goldbesetztes Feldzeichen wacht leuchtend über einer verteidigten Stellung. |
| core-dawnwell-archive.png | Morgenquell-Archiv | light | enchantment | rare | Ein von einer leuchtenden Quelle gespeistes Archiv mit endlosen, goldverzierten Schriftrollenregalen. |
| core-direbrood-curse.png | Fluch der Unheilsbrut | void | spell | uncommon | Ein schwarz-violetter Fluchnebel kriecht wie lebendige Brut über zwei markierte Kreaturen und zehrt an ihnen. |
| core-direful-clasp.png | Unheilvolle Spange | farblos | relic (Wunderwerk) | uncommon | Eine dunkel schimmernde Metallspange mit eingeätzten, unheilvollen Symbolen. |
| core-direful-siphon.png | Unheilvoller Aderlass | farblos | relic (Wunderwerk) | uncommon | Ein bizarres Instrument aus Glasröhren und dunklem Metall, das langsam Lebenskraft absaugt. |
| core-dominion-collar.png | Bann-Halsband | farblos | relic (Wunderwerk) | uncommon | Ein schweres, mit bannenden Runen versehenes Halsband aus mattem, dunklem Metall. |
| core-doomreap-edict.png | Verhängnisernte | void | spell | uncommon | Eine gespenstische Sense aus violettem Schatten fährt herab und erntet unerbittlich eine feindliche Kreatur. |
| core-doubletide-snare.png | Doppelflutfessel | tide | spell | uncommon | Zwei Ströme aus wirbelndem Wasser schnappen wie Fesseln um die Beine zweier feindlicher Kreaturen. |
| core-duskbound-cairn.png | Dämmerbund-Kairn | farblos | relic (Wunderwerk) | uncommon | Ein aus grauen Steinen aufgeschichteter Grabhügel-Kairn im letzten Licht der Dämmerung, der beim Einsturz einen Schauer entfesselt. |
| core-duskglow-ward.png | Dämmerglut-Schutz | light | enchantment | uncommon | Ein sanft glühender Schutzschein in dämmrigem Gold-Violett umgibt eine wachsame Gestalt. |
| core-ember-briar.png | Glutdorn | flame | spell | common | Ein glühender Dornenranken aus Feuer wächst plötzlich aus dem Boden und durchbohrt alles im Weg der angreifenden Kreatur. |
| core-ember-whelp.png | Glutwelpe | flame | unit (Drache) | common | Ein kleiner, ungestümer Drachenwelpe mit rot glühenden Schuppen schnaubt erste Funken aus den Nüstern. |
| core-emberborn-sprinter.png | Flammengeborener Läufer | flame | unit (Elementarwesen) | common | Ein aus reiner Flamme geborenes Läuferwesen hinterlässt beim Sprinten eine Spur glühender Fußabdrücke. |
| core-emberclad-brand.png | Glutgewandtes Brandmal | flame | enchantment | uncommon | Ein glühendes Brandsymbol umschließt eine Kreatur mit einem Gewand aus flackernder Glut, das sie zu blitzschnellem Zuschlagen antreibt. |
| core-emberflash-bolt.png | Glutblitz-Bolzen | flame | spell | common | Ein greller, funkensprühender Feuerbolzen schießt knisternd durch die Luft und hinterlässt eine erhellende Spur. |
| core-emberglass-ward.png | Glutglas-Schutzsiegel | farblos | relic (Wunderwerk) | common | Ein rot schimmerndes Siegel aus glutverschmolzenem Glas, gefasst in dunklem Metall. |
| core-emberguard-brand.png | Glutwacht-Brandmal | flame | spell | uncommon | Ein dauerhaft eingebranntes Glutsymbol lässt eine Kreatur wachsam-blitzschnell auf jeden Angriff reagieren. |
| core-embermarch-brand.png | Glutmarsch-Brandmal | flame | spell | uncommon | Ein kurz aufflammendes Brandmal treibt eine Kreatur zu einem raschen, alles entscheidenden ersten Hieb. |
| core-emberpaw-cub.png | Glutpranke | flame | unit (Wolf) | common | Ein flinkes Wolfsjunges mit glühenden Pfotenabdrücken jagt hastig über verbranntes Gras. |
| core-emberstride-brand.png | Glutschritt-Brandmal | flame | spell | common | Glühende Fußspuren aus Asche brennen sich dauerhaft in den Schritt einer hastenden Kreatur ein. |
| core-emberwake-rally.png | Glutwach-Aufgebot | flame | spell | common | Zwei kleine, lodernde Lichtgestalten erheben sich fliegend aus einem aufflammenden Ruf zu den Waffen. |
| core-endless-archive.png | Endloses Archiv | farblos | relic (Wunderwerk) | rare | Endlose, in Nebel verschwindende Regalreihen voller Bücher und Schriftrollen in einer weiten Bibliothekshalle. |
| core-entropic-hollow.png | Entropische Leere | void | enchantment | uncommon | Eine formlose, violett-schwarze Leerenhöhle verschlingt langsam alles Licht in ihrer Umgebung. |
| core-farsight-lens.png | Weitsicht-Linse | farblos | relic (Wunderwerk) | common | Eine polierte, in Messing gefasste Linse erlaubt einen klaren Blick in die Ferne. |
| core-fire-jolt.png | Feuerstoß | flame | spell | common | Ein kurzer, scharfer Feuerstoß schießt wie eine Peitsche aus einer geballten Faust. |
| core-flame-lance.png | Feuerlanze | flame | spell | common | Eine lange, lodernde Lanze aus reinem Feuer durchbohrt zischend ihr Ziel. |
| core-flame-ridge.png | Flammenkuppe | farblos | terrain (Gebirge) | common | Eine zerklüftete Bergkuppe mit Lavaströmen und rauchenden Rissen im roten Abendlicht. |
| core-flame-watch.png | Flammenwache | flame | unit (Krieger, Wächter) | common | Ein wachsamer Wächter mit brennender Fackel steht reglos vor einem lodernden Feuertor. |
| core-forgeheart-crucible.png | Schmiedeherz-Tiegel | farblos | relic (Wunderwerk) | rare | Ein glühender Schmelztiegel in Herzform, aus dessen Innerem flüssiges, geschmiedetes Feuer pulsiert. |
| core-forsaken-snare.png | Verlassene Falle | farblos | relic (Wunderwerk) | uncommon | Eine verrostete, halb im Erdreich vergrabene Fangfalle mit gespannten Zähnen. |
| core-foundry-anvil.png | Schmiedeambos | farblos | relic (Wunderwerk) | uncommon | Ein massiver, von Hammerschlägen gezeichneter Amboss in einer funkensprühenden Schmiede. |
| core-gloomweight-idol.png | Trübnisgewicht-Idol | farblos | relic (Wunderwerk) | uncommon | Ein schweres, aus dunklem Stein gehauenes Idol strahlt eine bedrückende, trübe Aura aus. |
| core-grasping-shadows.png | Greifende Schatten | void | enchantment | rare | Zahllose knochige, schattenhafte Hände greifen aus einer violett-schwarzen Finsternis empor. |
| core-grave-legion.png | Grablegion | void | spell | common | Zwei knochenraschelnde Gebeinknechte erheben sich klappernd aus aufgerissenen Gräbern. |
| core-grave-viper.png | Grabotter | void | unit (Schlange, Untoter) | common | Eine verweste Otter mit fauligen, giftig triefenden Reißzähnen gleitet zwischen Grabsteinen hindurch. |
| core-gravebound-oracle.png | Grabgebundene Seherin | void | unit (Untoter, Seherin) | rare | Eine zähe, an ihr Grab gebundene untote Seherin mit leerem Blick, deren Wissen erst im Tod endgültig frei wird. |
| core-gravebound-shrine.png | Grabgebundener Schrein | void | enchantment | uncommon | Ein verfallener, mit Knochen verzierter Schrein strahlt eine unheilvolle Aura aus und birst explosionsartig bei Zerstörung. |
| core-gravebound-warden.png | Grabgebundener Wärter | void | unit (Untoter, Wächter) | uncommon | Ein knochiger, an sein Grab gekettete Wärter steht unbeweglich Wache vor einer Gruft. |
| core-gravecall-summoner.png | Grabruf-Beschwörerin | void | unit (Untoter) | uncommon | Eine untote Beschwörerin ruft mit ausgestreckten, knöchernen Fingern nach den Toten unter der Erde. |
| core-gravetide-obelisk.png | Grabflut-Obelisk | farblos | relic (Wunderwerk) | uncommon | Ein von Gezeitenwasser umspülter, mit Grabinschriften bedeckter Obelisk schlägt bröckelnd Risse in fremde Bauwerke. |
| core-grimspawn-channeler.png | Grimmbrut-Kanalisiererin | void | unit (Untoter) | uncommon | Eine grimmige, untote Kanalisiererin lenkt mit erhobenen Händen dunkle Energie durch verfallene Knochen. |
| core-grove-calf.png | Waldkalb | wild | unit (Bestie) | common | Ein junges, sanftes Waldkalb mit moosgrünem Fell grast friedlich zwischen hohen Farnen. |
| core-grove-elder.png | Hain-Ältester | wild | unit (Baumhüter) | uncommon | Ein uralter, knorriger Baumhüter mit rindenbedeckten Armen ruht tief verwurzelt im Herzen eines Hains. |
| core-growth-totem.png | Wachstumstotem | farblos | relic (Wunderwerk) | uncommon | Ein aus verschlungenen Wurzeln geschnitztes Totem lässt grüne Ranken um sich wachsen. |
| core-harbor-warden.png | Hafenwächter | tide | unit (Wächter) | uncommon | Ein massiger Wassergeist-Wächter steht reglos am Kai eines nebelverhangenen Hafens. |
| core-healing-light.png | Heilendes Licht | light | spell | common | Ein sanftes, warmes Lichtbündel senkt sich heilend über eine erschöpfte Gestalt. |
| core-hearthforge-anvil.png | Herdschmiede-Amboss | farblos | relic (Wunderwerk) | uncommon | Ein warmer, von häuslichem Herdfeuer erleuchteter Schmiedeamboss in einer gemütlichen Werkstatt. |
| core-hexbind-lash.png | Fluchband-Peitsche | void | spell | common | Eine aus schwarzer Fluchenergie geflochtene Peitsche schlägt unsichtbar auf den gegnerischen Willen ein. |
| core-hollow-ravager.png | Hohlwüter | void | unit (Dämon) | uncommon | Ein hohläugiger, muskulöser Dämon walzt brüllend und unaufhaltsam durch alles, was sich ihm in den Weg stellt. |
| core-hollowbanish-verdict.png | Hohlbann-Verdikt | void | spell | rare | Ein violett-schwarzes Portal aus reiner Leere reißt ein feindliches Bauwerk oder Wesen endgültig aus der Welt. |
| core-hollowbind-curse.png | Hohlbann-Fluch | void | enchantment | uncommon | Ein hohler, bindender Fluch aus schwarzem Rauch legt sich würgend um seine verfluchte Beute. |
| core-hollowcurse-brand.png | Hohlfluch-Brandmal | void | enchantment | uncommon | Ein ausgehöhltes, fluchbeladenes Brandzeichen glimmt violett auf verrottendem Holz. |
| core-hollowdepth-warden.png | Hohltiefen-Wächterin | void | unit (Untoter, Wächter) | common | Eine untote Wächterin mit ausgestreckten, klauenartigen Armen bewacht die Tiefen einer hohlen Gruft. |
| core-hollowdrain-oath.png | Hohlsog-Schwur | void | spell | common | Ein dunkler Schwur zieht Lebenskraft aus der Leere und bindet sie dauerhaft an eine Kreatur. |
| core-hollowdusk-shrine.png | Hohldämmerungs-Schrein | void | enchantment | rare | Ein in ewiger Dämmerung liegender, ausgehöhlter Schrein strahlt violettes Zwielicht aus. |
| core-hollowed-locket.png | Ausgehöhltes Medaillon | farblos | relic (Wunderwerk) | uncommon | Ein leeres, ausgehöhltes Medaillon aus angelaufenem Silber baumelt leicht klappernd am Kettchen. |
| core-hollowed-satchel.png | Hohle Satteltasche | farblos | relic (Wunderwerk) | uncommon | Eine abgewetzte, leere Satteltasche aus rissigem Leder liegt achtlos auf staubigem Boden. |
| core-hollowmarch-reaver.png | Hohlmarsch-Plünderer | void | unit (Untoter) | uncommon | Ein ausgezehrter, untoter Plünderer marschiert mit hohlem Blick durch ein verlassenes Schlachtfeld. |
| core-hollowmaw-devourer.png | Hohlrachen-Verschlinger | void | unit (Untoter, Bestie) | rare | Ein gewaltiges, untotes Bestien-Ungetüm mit klaffendem Hohlrachen verschlingt alles, während neue Lebenskraft in seine verfaulten Adern strömt. |
| core-hollowreach-oath.png | Hohlgriff-Schwur | void | spell | common | Ein dunkler Schwur lässt knochige, greifende Arme dauerhaft aus dem Schatten einer Kreatur wachsen. |
| core-hollowreach-stalker.png | Hohlgriff-Pirscher | void | unit (Untoter) | common | Ein hagerer, untoter Pirscher mit übermäßig langen Armen lauert reglos am Rand des Schlachtfelds. |
| core-hollowveil-reaver.png | Hohlschleier-Plünderer | void | unit (Untoter) | uncommon | Ein in einen zerfetzten, hohlen Schleier gehüllter Plünderer schlägt automatisch zurück, sobald er verwundet wird. |
| core-hollowvein-mantle.png | Hohlader-Mantel | void | enchantment | uncommon | Ein Mantel aus pulsierenden, dunklen Adern legt sich wie ein zweites Wesen um seinen Träger. |
| core-husk-crawler.png | Hüllenkriecher | void | unit (Untoter) | common | Eine ausgetrocknete, kriechende Körperhülle bewegt sich ruckartig über den staubigen Boden. |
| core-inferno-surge.png | Feuersturz | flame | spell | uncommon | Eine gewaltige, frei wählbare Feuerwoge stürzt wie eine brennende Lawine auf ihr Ziel herab. |
| core-iron-standard.png | Eisernes Feldzeichen | farblos | relic (Wunderwerk) | uncommon | Ein schlichtes, aus solidem Eisen geschmiedetes Feldzeichen steht fest im Boden verankert. |
| core-ironforge-loom.png | Eisenschmiede-Webstuhl | farblos | relic (Wunderwerk) | rare | Ein gewaltiger, aus Eisen und Kettengliedern gefertigter Webstuhl webt klirrend Rüstungsgewänder. |
| core-ironhide-banner.png | Eisenhaut-Banner | farblos | relic (Wunderwerk) | uncommon | Ein zähes Banner aus gegerbter, eisenharter Tierhaut weht steif im Wind über dem Feld. |
| core-ironhide-bison.png | Eisenhaut-Bison | wild | unit (Bestie) | common | Ein massiger Bison mit dick gepanzerter, eisenharter Haut stampft schwerfällig über die Ebene. |
| core-leaden-toll.png | Bleierner Zoll | farblos | relic (Wunderwerk) | rare | Eine schwere, bleierne Waage mit klirrenden Gewichten fordert unerbittlich ihren Tribut. |
| core-leechspawn.png | Blutbrut | void | unit (Untoter) | common | Eine schleimige, blutgierige Untoten-Brut saugt sich mit zahnbewehrtem Maul an ihrem Opfer fest. |
| core-light-altar.png | Lichtaltar | farblos | terrain (Tempel) | common | Ein von warmem, goldenem Licht durchfluteter Tempelaltar mit hohen, weißen Säulen. |
| core-lucent-retaliator.png | Leuchtende Vergelterin | light | unit (Kleriker) | uncommon | Eine leuchtende Klerikerin mit erhobenem Schild lässt heiliges Licht wie einen Gegenschlag zurückstrahlen. |
| core-mantle-of-thorns.png | Dornenmantel | wild | enchantment | common | Ein dichter, aus scharfen Dornen gewobener Mantel legt sich schützend um eine Kreatur. |
| core-mind-rot.png | Geistesfäule | void | spell | common | Ein fauliger, violetter Nebel kriecht in den Geist des Gegners und lässt Erinnerungen verrotten. |
| core-mistveil-trickster.png | Nebelschleier-Gauklerin | tide | unit (Schurkin, Geist) | uncommon | Eine verschwommene, geisterhafte Gauklerin gleitet lautlos durch dichten Nebel über dem Wasser. |
| core-moltenscale-graft.png | Schmelzschuppen-Veredelung | flame | spell | common | Glühend geschmolzene Schuppen wachsen dauerhaft in die Haut einer Kreatur und verleihen ihr rohe Kraft. |
| core-moonlit-augury.png | Mondlicht-Weissagung | wild | spell | common | Eine Druidin liest im silbernen Mondlicht Zeichen aus Blättern und dem Lauf der Sterne. |
| core-moss-elder.png | Moosältester | wild | unit (Baumhüter) | common | Ein von dickem, grünem Moos überwucherter Baumhüter steht still im schattigen Unterholz. |
| core-mossheart-grove.png | Moosherz-Hain | wild | enchantment | uncommon | Ein von weichem Moos überzogener Hain pulsiert mit dem sanften Herzschlag des Waldes. |
| core-mosswake-drifter.png | Moosweck-Streunerin | wild | unit (Pflanzenwesen) | common | Ein treibendes Pflanzenwesen aus Moos und Ranken hinterlässt beim Vergehen einen neuen, jungen Trieb. |
| core-myriad-cog.png | Vielfaches Zahnrad | farblos | relic (Wunderwerk) | rare | Ein kompliziertes Uhrwerk aus unzähligen ineinandergreifenden Zahnrädern in ständiger Bewegung. |
| core-overgrowth-colossus.png | Wucherkoloss | wild | unit (Bestie) | uncommon | Ein gigantischer, von wucherndem Grün überwachsener Koloss zermalmt mit jedem Schritt den Boden. |
| core-pit-reaver.png | Gruben-Plünderer | void | unit (Räuber) | common | Ein hastiger Räuber klettert flink aus einer dunklen Grube und stürmt sofort zum Angriff. |
| core-plaguebound-wretch.png | Seuchengebundener Wicht | void | unit (Untoter) | common | Ein siecher, von Seuchenpusteln übersäter Wicht schleicht sich humpelnd durch verpestete Gassen. |
| core-pyreblast-cannon.png | Feuerofen-Kanonade | flame | spell | common | Eine gewaltige, glühende Feuerkanone entlädt sich mit einer alles verzehrenden Explosion. |
| core-radiant-insight.png | Strahlende Einsicht | light | spell | common | Ein strahlender Lichtkegel erhellt kurz die Gedanken einer betenden Gestalt mit neuer Einsicht. |
| core-radiant-mercy.png | Strahlende Gnade | light | spell | uncommon | Ein gewaltiger, golden strahlender Lichtschein umhüllt einen erschöpften Kämpfer mit tiefer Heilung. |
| core-raidhorn-berserker.png | Sturmruf-Berserker | flame | unit (Krieger) | uncommon | Ein wild brüllender Berserker bläst in ein Kriegshorn und stürmt kopfüber in die Schlacht. |
| core-reckless-charge.png | Waghalsiger Sturmlauf | flame | spell | common | Ein waghalsiger Krieger stürmt ohne jede Rücksicht mit wehendem Umhang gegen die feindlichen Linien. |
| core-riftfin-duelist.png | Riftflossen-Duellant | tide | unit (Wassergeist) | common | Ein Wassergeist mit klingenscharfen Flossen schießt blitzschnell aus einer Gezeitenspalte hervor. |
| core-riptide-purge.png | Doppelflut | tide | spell | uncommon | Zwei gewaltige, gegenläufige Flutwellen reißen feindliche Kreaturen zurück auf offene See. |
| core-riptide-shackles.png | Flutschellen | tide | enchantment | uncommon | Schwere, tropfnasse Wasserfesseln winden sich klirrend um Handgelenke und Fußknöchel. |
| core-riptide-snare.png | Flutfessel | tide | spell | common | Ein plötzlicher Strömungswirbel schnappt fesselnd um die Beine einer feindlichen Kreatur. |
| core-rootbane-wither.png | Wurzelbann-Fäulnis | wild | spell | uncommon | Braun-schwarze Fäulnis kriecht wie welkende Wurzeln über eine Kreatur und zehrt sie langsam aus. |
| core-rootbound-effigy.png | Wurzelgebundene Effigie | farblos | relic (Wunderwerk) | common | Eine aus verschlungenen Holzwurzeln geschnitzte Effigie steht fest im lehmigen Waldboden verwurzelt. |
| core-rootbound-mark.png | Wurzelgebundenes Mal | wild | spell | uncommon | Ein dauerhaftes Wurzelmal wächst tief in die Haut einer Kreatur und verleiht ihr unaufhaltsame Wucht. |
| core-rootbound-sentinel.png | Wurzelgebundener Wächter | wild | unit (Baumhüter, Wächter) | uncommon | Ein tief im Boden verwurzelter Baumhüter-Wächter steht unbeweglich als lebende Mauer. |
| core-rootgrowth-idol.png | Wurzelwuchs-Idol | farblos | relic (Wunderwerk) | common | Ein von jungen Wurzeltrieben überwuchertes, moosbedecktes Steinidol im Waldschatten. |
| core-rootrot-curse.png | Fluch der Wurzelfäule | wild | enchantment | uncommon | Ein fauliger, brauner Fluch lässt Wurzeln und Ranken einer verhexten Kreatur langsam verrotten. |
| core-rootwake-shrine.png | Wurzelweck-Schrein | wild | enchantment | rare | Ein von uralten, erwachenden Wurzeln umschlungener Schrein tief im Herzen des Waldes. |
| core-rot-touched-stalker.png | Fäulnisberührter Pirscher | void | unit (Untoter) | uncommon | Ein von Verwesung gezeichneter, untoter Pirscher schleicht mit fauligem Atem durch das Unterholz. |
| core-sanctified-remains.png | Geweihte Gebeine | light | enchantment | uncommon | Geweihte, in goldenes Licht gehüllte Gebeine ruhen auf einem schlichten Altarstein. |
| core-sanctum-ward.png | Heiligtums-Schutz | light | enchantment | uncommon | Ein leuchtender Schutzkreis aus goldenem Licht umschließt eine wachsame Kreatur vor einem Heiligtum. |
| core-scorch-bolt.png | Sengender Bolzen | flame | spell | common | Ein sengender, orangeroter Feuerbolzen zischt mit versengender Hitze durch die Luft. |
| core-searing-curse.png | Sengender Fluch | flame | spell | common | Versengende, rote Flammenzungen legen sich kurzzeitig fluchend über eine feindliche Kreatur und schwächen sie. |
| core-second-wind.png | Zweiter Atem | light | spell | common | Ein erschöpfter Kämpfer atmet tief im warmen Licht auf und erhebt sich mit neuer Kraft. |
| core-seedling-swarm.png | Schwarm der Sprösslinge | wild | spell | common | Zwei kleine, grüne Sprösslinge sprießen ruckartig aus dem Waldboden empor. |
| core-shackleweight-idol.png | Fesselgewicht-Idol | farblos | relic (Wunderwerk) | uncommon | Ein schweres Idol mit angeketteten Gewichten drückt jeden Widersacher nieder. |
| core-silence-ban.png | Bann des Schweigens | void | spell | uncommon | Eine violette Stille legt sich würgend über einen wirkenden Zauberspruch und erstickt ihn im Keim. |
| core-silence-veil.png | Schleier des Schweigens | void | spell | rare | Ein weiter, schwarz-violetter Schleier legt sich lähmend über den gesamten magischen Stapel und erstickt jede Wirkung. |
| core-silence-ward.png | Stiller Bann | void | spell | common | Eine gedämpfte, dunkle Stille schluckt eine aktivierte oder getriggerte Fähigkeit im letzten Moment. |
| core-silt-warden.png | Schlickwächterin | tide | unit (Krake) | common | Eine schlickbedeckte, kleine Krake lauert reglos im trüben Bodensatz eines Flussdeltas. |
| core-skyclad-anvil.png | Himmelsgewandter Amboss | farblos | relic (Wunderwerk) | uncommon | Ein auf einer schwebenden Plattform errichteter Amboss ist von Wolken und Wind umgeben. |
| core-skyforge-standard.png | Himmelsschmiede-Feldzeichen | farblos | relic (Wunderwerk) | uncommon | Ein hoch aufragendes Feldzeichen mit Amboss-Symbol flattert im Wind der Höhe. |
| core-skyward-ward.png | Himmelswärts-Schutz | light | spell | common | Ein aufsteigender, goldener Lichtstrahl reckt eine Kreatur schützend dem Himmel entgegen. |
| core-skywatch-lattice.png | Himmelswacht-Gitterwerk | farblos | relic (Wunderwerk) | uncommon | Ein filigranes, metallenes Gitterwerk auf einem Turm blickt wachsam in den weiten Himmel. |
| core-soul-drainer.png | Seelenzehrer | void | unit (Dämon) | uncommon | Ein hagerer, violett schimmernder Dämon zieht mit ausgestreckten Klauen die Seele seiner Opfer heraus. |
| core-soul-siphon.png | Seelenzapfer | void | spell | common | Ein dunkler Energiestrahl zapft Lebenskraft aus einem Ziel und leitet sie zurück zum Zauberwirkenden. |
| core-soulbound-embrace.png | Seelengebundene Umarmung | void | enchantment | uncommon | Zwei schattenhafte, seelengebundene Arme umschlingen eine Kreatur in einer fürsorglich-unheimlichen Umarmung. |
| core-soulforged-censer.png | Seelengeschmiedetes Räuchergefäß | farblos | relic (Wunderwerk) | uncommon | Ein kunstvoll geschmiedetes Räuchergefäß lässt violetten, seelenschweren Rauch aufsteigen. |
| core-sporewing-strider.png | Sporenschwinge | wild | unit (Pflanzenwesen) | common | Ein leichtes Pflanzenwesen mit sporenbestäubten, durchscheinenden Flügeln schwebt über Pilzwiesen. |
| core-stonebark-elder.png | Steinrinden-Ältester | wild | unit (Baumhüter) | uncommon | Ein massiger, steinharter Baumältester mit rissiger Rinde steht Wache wie ein lebender Fels. |
| core-stoneguard-paragon.png | Steinwacht-Musterbild | wild | unit (Golem) | uncommon | Ein aus grauem Fels gehauener Golem wächst mit jedem angesammelten Wachstumsschub weiter an Statur. |
| core-storm-strider.png | Sturmschreiter | flame | unit (Elementarwesen) | common | Ein aus rasendem Feuersturm geformtes Wesen jagt mit Blitzgeschwindigkeit über die Ebene. |
| core-sun-acolyte.png | Sonnenschwester | light | unit (Kleriker) | common | Eine Klerikerin in sonnengelbem Gewand leitet heilendes Licht direkt in ihre eigenen Wunden zurück. |
| core-sunblade-vanguard.png | Sonnenklingen-Vorhut | light | unit (Kleriker) | common | Eine Vorkämpferin mit einer im Sonnenlicht funkelnden Klinge schlägt als Erste zu. |
| core-sunfall-martyr.png | Sonnenfall-Märtyrerin | light | unit (Kleriker) | common | Eine opferbereite Märtyrerin strahlt im Fallen ein letztes, heilendes Sonnenlicht über ihre Verbündeten aus. |
| core-sunforged-colossus.png | Sonnengeschmiedeter Koloss | light | unit (Konstrukt) | uncommon | Ein gewaltiger, aus goldglühendem Metall geschmiedeter Koloss stampft unaufhaltsam durch die Schlachtreihen. |
| core-sunhaven-guard.png | Sonnenhort-Wache | light | unit (Wächter) | common | Eine Wache mit langem Speer steht vor einem sonnenbeschienenen Hort und wehrt Angriffe aus der Ferne ab. |
| core-sunlit-canopy.png | Sonnendach | light | enchantment | rare | Ein von durchscheinendem, goldenem Licht durchflutetes Blätterdach spendet Schutz über einem ganzen Heer. |
| core-sunlit-vigil.png | Sonnenlicht-Wache | light | unit (Wächter) | common | Eine Wache in strahlend weißer Rüstung hält aufrecht und wachsam die Stellung im Sonnenlicht. |
| core-sunveil-mantle.png | Sonnenschleier-Mantel | light | enchantment | uncommon | Ein leicht schimmernder, sonnendurchtränkter Schleiermantel legt sich schützend um eine Gestalt. |
| core-sunward-vanguard.png | Sonnenwärts-Vorkämpferin | light | unit (Kleriker) | common | Eine Vorkämpferin richtet ihre Waffe der Sonne entgegen und leitet heilendes Licht zurück in den eigenen Körper. |
| core-sunwatch-canopy.png | Sonnenwacht-Blätterdach | light | enchantment | uncommon | Ein wachsames, lichtdurchflutetes Blätterdach thront hoch über einem heiligen Hain. |
| core-tariff-spire.png | Zollturm | tide | enchantment | rare | Ein hoher, von Gezeitenwasser umspülter Turm erhebt strengen Zoll von jedem, der vorbeizieht. |
| core-temple-sentinel.png | Tempelwächter | light | unit (Wächter) | uncommon | Ein massiger Wächter aus weißem Stein steht unerschütterlich vor den Toren eines heiligen Tempels. |
| core-thicket-fang.png | Dickichtreißzahn | wild | unit (Schlange) | common | Eine schlanke, giftgrüne Schlange mit tödlich triefenden Reißzähnen windet sich durchs dichte Dickicht. |
| core-thistlehide-healer.png | Distelfell-Heilerin | wild | unit (Bestie, Kleriker) | common | Eine distelfellige Heilerin-Bestie zieht mit sanften Klauen heilende Kraft aus jedem Kampf. |
| core-thornback-warden.png | Dornwächter | wild | unit (Bestie) | common | Eine dornenbewehrte Bestie mit langen, stacheligen Gliedmaßen hält wachsam Ausschau über die Lichtung. |
| core-thornbound-guard.png | Dorngebundene Wächterin | wild | unit (Bestie, Wächter) | uncommon | Eine mit Dornenranken umschlungene Wächterin-Bestie steht reglos am Waldpfad. |
| core-thornclad-ward.png | Dorngewandeter Schutz | wild | enchantment | uncommon | Ein dicht mit Dornen bewachsener Schutzmantel verleiht seinem Träger rohe, durchbrechende Wucht. |
| core-thornhide-brawler.png | Dornhaut-Raufbold | wild | unit (Bestie) | uncommon | Ein grober, dornenhäutiger Raufbold walzt mit brachialer Gewalt durch jedes Hindernis. |
| core-thornrage-boar.png | Dornwut-Keiler | wild | unit (Bestie) | uncommon | Ein wütender, dornenbewehrter Eberkeiler schlägt reflexartig zurück, sobald ihn eine Waffe trifft. |
| core-thornreach-standard.png | Dorngriff-Feldzeichen | wild | enchantment | uncommon | Ein von Dornenranken umwucherter Feldzeichenpfahl steht fest verwurzelt im Schlachtfeld. |
| core-thornreach-strider.png | Dornreich-Wandler | wild | unit (Bestie) | common | Eine langbeinige, dornbewehrte Bestie streift mit weiten Schritten durch dichtes Dorngestrüpp. |
| core-thornrush-sprinter.png | Dornhast-Flitzer | wild | unit (Bestie) | common | Eine flinke, dornengeschützte Bestie hetzt hastig durch das Unterholz. |
| core-thornseed-caller.png | Dornsaat-Ruferin | wild | unit (Druide) | uncommon | Eine Druidin mit einem Kranz aus Dornensaat ruft im Wald leise beschwörende Worte. |
| core-thornviper-skirmisher.png | Dornotter-Plänklerin | wild | unit (Schlange) | common | Eine schnelle Dornotter schießt blitzartig mit vergiftetem Biss aus dem Unterholz hervor. |
| core-thornwarden-ascetic.png | Dornwart-Asket | wild | unit (Druide) | uncommon | Ein in Dornenroben gekleideter Asket meditiert bewegungslos inmitten stachliger Ranken. |
| core-thornwild-forager.png | Dornwild-Sammlerin | wild | unit (Druide) | uncommon | Eine wilde Sammlerin durchstreift mit einem Weidenkorb voller Dornenbeeren das dichte Unterholz. |
| core-tidal-insight.png | Flutweisheit | tide | spell | uncommon | Zwei leuchtende Wasserwirbel formen sich zu Schriftzeichen der Weisheit über einer ruhigen Flutfläche. |
| core-tidal-rebuke.png | Gezeitenschelte | tide | spell | common | Eine plötzliche Flutwelle reißt eine Kreatur zurück und spült sie mühelos in die Hand ihres Besitzers. |
| core-tidal-renewal.png | Gezeitenerneuerung | tide | spell | common | Erfrischendes Gezeitenwasser umspült eine erschöpfte Kreatur und löst ihre Anspannung. |
| core-tidal-serpent.png | Flutschlange | tide | unit (Seeschlange) | common | Eine lange, türkisschimmernde Seeschlange erhebt sich weit aus den Wellen, um Angreifer aus der Ferne abzuwehren. |
| core-tidal-surge.png | Gezeitenschwall | tide | spell | common | Ein kraftvoller Gezeitenschwall umspült kurzzeitig eine Kreatur und verleiht ihr rohe Wucht. |
| core-tidalbound-growth.png | Flutgebundenes Wachstum | tide | spell | common | Türkisfarbenes Flutwasser durchtränkt dauerhaft eine Kreatur und lässt sie stärker wachsen. |
| core-tidalguard-standard.png | Flutwacht-Feldzeichen | tide | enchantment | rare | Ein hohes, von Gischt umspültes Feldzeichen wacht über einer Küstenfestung. |
| core-tide-cove.png | Gezeitenbucht | farblos | terrain (Küste) | common | Eine ruhige, türkisblaue Bucht mit sanft anrollenden Wellen an einem felsigen Ufer. |
| core-tide-scout.png | Gezeitenkundschafter | tide | unit (Späher) | common | Ein leichtfüßiger Kundschafter watet durch seichtes Wasser und hält Ausschau über die Gezeitenbucht. |
| core-tide-warden.png | Gezeitenwächterin | tide | unit (Wächter) | common | Eine türkisgewandete Wächterin steht wachsam am Rand einer ruhigen Flutlagune. |
| core-tidebane-wither.png | Flutbann-Fäulnis | tide | spell | uncommon | Kaltes, fauliges Flutwasser zersetzt langsam die Kraft einer Kreatur. |
| core-tidebind-courser.png | Flutbann-Kurier | tide | unit (Wassergeist) | uncommon | Ein schneller Wassergeist-Kurier gleitet strömungsschnell über die Wellenoberfläche. |
| core-tideborn-remnant.png | Flutgeborenes Überbleibsel | tide | unit (Wassergeist) | common | Ein durchscheinendes Überbleibsel aus Flutgeist zerfließt beim Vergehen in einen letzten, erhellenden Wasserstrahl. |
| core-tidebound-archive.png | Flutgebundenes Archiv | tide | enchantment | common | Ein von Wasser durchtränktes Archiv mit aufgequollenen, doch noch lesbaren Schriftrollen. |
| core-tidebound-elegy.png | Flutgebundene Klage | tide | enchantment | rare | Eine wehmütige, türkisfarbene Klagegestalt schwebt über den ruhigen Wellen einer versunkenen Stadt. |
| core-tidebound-vow.png | Flutgebundener Schwur | tide | spell | uncommon | Ein feierlicher Schwur bindet heilende Flutkraft dauerhaft an eine Kreatur. |
| core-tidecraft-charm.png | Flutwerk-Amulett | tide | enchantment | rare | Ein kunstvoll aus Muscheln und Seetang gefertigtes Amulett schimmert im Wechselspiel der Gezeiten. |
| core-tidecrest-warden.png | Flutkamm-Wächterin | tide | unit (Wächter) | common | Eine Wächterin mit schaumgekröntem Kamm steht wachsam auf einem gischtumspülten Felsen. |
| core-tidefang-sentinel.png | Flutzahn-Wächterin | tide | unit (Wassergeist) | common | Eine Wassergeist-Wächterin mit scharfen, flutgeformten Zähnen schlägt blitzschnell zu. |
| core-tidereader-oracle.png | Gezeitenleserin | tide | unit (Seherin) | common | Eine Seherin liest in den Kräuselungen der Gezeiten kommende Ereignisse voraus. |
| core-tidereave-current.png | Flutraub-Strömung | tide | enchantment | rare | Eine reißende, alles mitnehmende Strömung raubt und trägt fremdes Gut mit sich fort. |
| core-tiderend-wave.png | Flutriss-Woge | tide | spell | uncommon | Eine reißende Woge bricht durch ein feindliches Bauwerk und spült es zurück in die Hand seines Besitzers. |
| core-tideshaper-adept.png | Flutformerin | tide | unit (Wassergeist) | uncommon | Eine geschickte Formerin lenkt mit erhobenen Händen wachsam die Strömungen des Wassers. |
| core-tideshard-rogue.png | Flutscherben-Schleicherin | tide | unit (Schurkin, Geist) | uncommon | Eine geisterhafte Schurkin aus zersplittertem Wasserglas schleicht lautlos zwischen den Wellen hindurch. |
| core-tideshell-warden.png | Flutschalen-Wächterin | tide | unit (Wächter) | uncommon | Eine in eine harte Muschelschale gehüllte Wächterin duckt sich schützend gegen die Brandung. |
| core-tidespawn-caller.png | Flutbrut-Ruferin | tide | unit (Wassergeist) | uncommon | Eine Wassergeist-Ruferin lockt mit klarer Stimme neue Brut aus den tiefen Strömungen. |
| core-tidesurge-crasher.png | Gezeitensturm-Brecher | tide | unit (Krake) | common | Eine gewaltige Krake bricht mit tosender Wucht durch jede Hafenmauer, die sich ihr in den Weg stellt. |
| core-tidewarden-sigil.png | Flutwart-Siegel | tide | enchantment | uncommon | Ein leuchtend türkises Siegel hält seinen Träger stets wachsam über den schwankenden Wellen. |
| core-tidewash-cleanse.png | Flutwäsche | tide | spell | common | Klares Flutwasser spült reinigend über eine geschwächte Kreatur und wäscht die Wunden fort. |
| core-tidewash-veil.png | Flutschleier | tide | enchantment | common | Ein dünner, türkiser Wasserschleier legt sich schimmernd über das Schlachtfeld. |
| core-tidewell-cleric.png | Flutquell-Klerikerin | tide | unit (Kleriker) | common | Eine Klerikerin an einer heiligen Flutquelle zieht Heilkraft direkt aus dem strömenden Wasser. |
| core-tidewhip-skirmisher.png | Flutpeitschen-Plänklerin | tide | unit (Wassergeist) | common | Eine flinke Wassergeist-Plänklerin peitscht mit gischtenden Armen blitzschnell durch die Wellen. |
| core-tidewing-warden.png | Flutschwingen-Wächterin | tide | unit (Wassergeist) | common | Eine geflügelte Wassergeist-Wächterin gleitet mit tropfenden Schwingen über die Brandung. |
| core-tidewrath-guardian.png | Flutzorn-Wächter | tide | unit (Wassergeist) | uncommon | Ein zorniger Wassergeist-Wächter schleudert bei jedem Treffer eine Gegenwelle zurück. |
| core-titanroot-canopy.png | Titanwurzel-Blätterdach | wild | enchantment | uncommon | Ein gewaltiges Blätterdach aus titanischen, uralten Wurzeln überspannt den ganzen Hain. |
| core-tithehall-warden.png | Zehnthallen-Hüterin | light | unit (Kleriker) | rare | Eine strenge Hüterin wacht in einer goldverzierten Zehnthalle über heilige Abgaben. |
| core-twin-cinder.png | Zwillingsglut | flame | spell | uncommon | Zwei kleine, funkensprühende Glutfunken schießen gleichzeitig in verschiedene Richtungen davon. |
| core-twinpath-cog.png | Zwiepfad-Zahnrad | farblos | relic (Wunderwerk) | uncommon | Ein doppeltes, ineinandergreifendes Zahnradpaar dreht sich in entgegengesetzte Richtungen. |
| core-twinroot-blessing.png | Zwillingswurzel-Segen | wild | spell | uncommon | Zwei leuchtend grüne Wurzelsegen wachsen gleichzeitig aus dem Boden und stärken zwei Verbündete. |
| core-vanguard-standard.png | Vorhut-Feldzeichen | farblos | relic (Wunderwerk) | rare | Ein hoch erhobenes Feldzeichen der Vorhut treibt eine ganze Streitmacht zu blitzschnellen Angriffen an. |
| core-venom-brand.png | Giftmal | void | spell | uncommon | Ein violett-schwarzes Giftmal brennt sich kurzzeitig in die Klaue oder Klinge einer Kreatur. |
| core-verdant-return.png | Grüne Wiederkehr | wild | enchantment | rare | Frisches, grünes Leben kehrt kraftvoll aus dem Waldboden zurück und lässt alte Wurzeln neu erblühen. |
| core-verdant-shaman.png | Grünwuchs-Schamanin | wild | unit (Druide) | common | Eine junge Schamanin mit efeuumranktem Stab steht inmitten frisch sprießenden Grüns. |
| core-vigilwave-charm.png | Wachsamkeitswoge | tide | spell | common | Eine sanfte Wasserwoge hält eine Kreatur kurzzeitig hellwach und angriffsbereit zugleich. |
| core-vitalward-sigil.png | Lebenswacht-Siegel | farblos | relic (Wunderwerk) | uncommon | Ein pulsierendes Siegel aus warmem Metall schützt aufmerksam die Lebenskraft seines Trägers. |
| core-void-assassin.png | Leerenassassine | void | unit (Dämon, Attentäter) | rare | Eine schattenhafte Attentäterin aus der Leere schlägt mit tödlich vergifteter Klinge blitzschnell und zuerst zu. |
| core-void-covenant.png | Bund der Leere | void | spell | uncommon | Ein finsterer Pakt mit der Leere bietet dem Rufenden die Wahl zwischen Schaden, Verderben oder Erkenntnis. |
| core-void-marshal.png | Leerenmarschall | void | unit (Untoter, Anführer) | common | Ein untoter Marschall in zerschlissener Rüstung hält mit erhobenem Schwert wachsam Stellung. |
| core-void-rift.png | Leerenspalte | farblos | terrain (Ödnis) | common | Eine öde, rissige Landschaft mit einer klaffenden, violett-schwarzen Spalte ins Nichts. |
| core-voidtoll-shrine.png | Leerenzoll-Schrein | void | enchantment | rare | Ein finsterer Schrein inmitten der Leere fordert von jedem, der ihn passiert, seinen dunklen Zoll. |
| core-wardflame-sentinel.png | Schildglut-Wächterin | light | unit (Wächter) | uncommon | Eine Wächterin mit einem golden glühenden Feuerschild steht unerschütterlich Wache. |
| core-wardglow-censer.png | Schutzglut-Räuchergefäß | farblos | relic (Wunderwerk) | uncommon | Ein warm glühendes Räuchergefäß verströmt schützenden, goldenen Rauch. |
| core-warding-thorns.png | Wehrdorn-Hecke | wild | enchantment | rare | Eine undurchdringliche Hecke aus scharfen, wehrhaften Dornen umschließt schützend ein ganzes Gebiet. |
| core-wardlight-acolyte.png | Schutzlicht-Akolythin | light | unit (Kleriker, Wächter) | uncommon | Eine Akolythin mit leuchtendem Schutzsymbol hält wachsam Stellung vor einem Heiligtum. |
| core-wardsteel-bastion.png | Wardstahl-Bollwerk | farblos | relic (Wunderwerk) | rare | Ein gewaltiges Bollwerk aus mattem Stahl steht wie eine uneinnehmbare Festungsmauer. |
| core-wardstone-idol.png | Wardstein-Idol | farblos | relic (Wunderwerk) | common | Ein schlichtes, aus grauem Wardstein gehauenes Schutzidol steht am Rand eines Lagers. |
| core-warforged-standard.png | Kriegsgeschmiedetes Feldzeichen | farblos | relic (Wunderwerk) | rare | Ein in unzähligen Schlachten geschmiedetes Feldzeichen aus zerbeultem, aber unzerstörtem Metall. |
| core-warhorn-standard.png | Kriegshorn-Feldzeichen | farblos | relic (Wunderwerk) | uncommon | Ein Feldzeichen mit angebrachtem Kriegshorn ist bereit, den Angriff einzuläuten. |
| core-wellhoard-forge.png | Hortquell-Schmiede | farblos | relic (Wunderwerk) | rare | Eine reiche Schmiede an einer sprudelnden Quelle, umgeben von gehorteten Schätzen und Werkzeugen. |
| core-wellspring-charm.png | Quellzauber-Amulett | farblos | relic (Wunderwerk) | common | Ein kleines, klares Amulett schimmert im Licht einer sprudelnden Quelle. |
| core-wellspring-cistern.png | Quellzisterne | farblos | relic (Wunderwerk) | uncommon | Eine steinerne Zisterne sammelt das klare Wasser einer nahen Quelle. |
| core-wild-glade.png | Wildlichtung | farblos | terrain (Wald) | common | Eine sonnendurchflutete Waldlichtung mit hohem Gras und knorrigen alten Bäumen. |
| core-wildfire-boar.png | Wildfeuerkeiler | flame | unit (Bestie) | common | Ein wilder Keiler mit lodernden Borsten walzt brennend durch das trockene Unterholz. |
| core-wildgrowth-field.png | Wildwuchsfeld | wild | enchantment | rare | Ein weites Feld voll überbordend wucherndem, grünem Wildwuchs erstreckt sich bis zum Horizont. |
| core-wildgrowth-surge.png | Wildwuchs-Schub | wild | spell | common | Ein plötzlicher, grüner Wachstumsschub lässt Sehnen und Muskeln einer Kreatur kräftig anschwellen. |
| core-wildheart-surge.png | Wildherz-Schwall | wild | spell | common | Ein wilder, grüner Kraftschwall durchflutet kurzzeitig das Herz einer kämpfenden Kreatur. |
| core-wildroot-banner.png | Wildwurzel-Banner | wild | enchantment | uncommon | Ein aus verflochtenen Wurzeln geformtes Banner steht fest verankert mitten im Wildwuchs. |
| core-wildroot-graft.png | Wildwurzel-Veredelung | wild | spell | common | Kräftige, grüne Wurzelranken veredeln wachsend die Muskulatur einer Kreatur. |
| core-wildseed-grove.png | Wildsaat-Hain | wild | enchantment | rare | Ein uralter Hain voller keimender Wildsaat ist bereit, jederzeit neues Leben hervorzubringen. |
| core-wildwatch-oath.png | Wildwacht-Schwur | wild | spell | common | Ein wilder Schwur lässt eine Kreatur kurzzeitig reglos, aber unerschütterlich Wache halten. |
| core-wings-of-dawn.png | Schwingen der Morgenröte | light | spell | common | Leichte, goldene Schwingen der Morgenröte wachsen kurzzeitig aus dem Rücken einer Kreatur. |
| core-wisproot-cache.png | Wisproot-Cache | farblos | relic (Wunderwerk) | uncommon | Ein verstecktes, mit filigranen Wurzelmustern verziertes Versteck voller kleiner Wisps. |
| core-wither-touch.png | Auszehrender Strom | tide | spell | uncommon | Ein kalter, auszehrender Wasserstrom spült gewachsene Kraft von einer Kreatur fort. |
| core-witherfang-veil.png | Fäulzahn-Schleier | void | enchantment | uncommon | Ein fauliger, violetter Schleier lässt die Zähne einer verhüllten Kreatur giftig triefen. |
| core-witherglass-idol.png | Welkglas-Idol | farblos | relic (Wunderwerk) | common | Ein trübes, angelaufenes Glasidol mit welken, eingeschlossenen Pflanzenresten. |
| core-witherplague-shrine.png | Seuchenwelk-Schrein | void | enchantment | rare | Ein von Seuche und Verwesung befallener Schrein verströmt welkende, violette Fäulnisdämpfe. |
| core-wraithbound-ledger.png | Schattengebundenes Kontobuch | farblos | relic (Wunderwerk) | uncommon | Ein dunkles Kontobuch mit schattenhaften, sich bewegenden Schriftzeichen auf vergilbtem Papier. |
| core-wraithbound-manacle.png | Schattengebundene Fessel | farblos | relic (Wunderwerk) | common | Eine schwere, von Schattenrauch umwobene Eisenfessel liegt kalt auf einem Steinsockel. |
| core-wraithcall-pact.png | Schattenruf-Pakt | void | spell | common | Ein flüsternder Pakt mit schattenhaften Geistern zehrt Lebenskraft vom Gegner und offenbart neues Wissen. |
| core-wraithwing-stalker.png | Schwingenschatten | void | unit (Geist) | common | Ein schattenhafter Geist mit durchscheinenden, dunklen Flügeln gleitet lautlos durch die Nacht. |
| core-zealous-vanguard.png | Eifervorhut | light | unit (Kleriker) | common | Eine eifrige Vorkämpferin mit goldenem Schild stürmt ungeduldig als Erste in die Schlacht. |
