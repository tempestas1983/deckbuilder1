"""
Batch-Bilderstellung mit der Gemini API (immer gleicher Stil, unterschiedliche Motive).

Vorbereitung:
1. pip install google-genai
2. API-Key besorgen: https://aistudio.google.com -> "Get API key"
3. Key als Umgebungsvariable setzen (empfohlen, statt im Code):
   - macOS/Linux:  export GEMINI_API_KEY="dein-key"
   - Windows PS:   $env:GEMINI_API_KEY="dein-key"

Verwendung:
1. card_artwork_prompts.csv im selben Ordner anlegen (Spalten: Filename, AI Prompt)
2. python gemini_batch_images.py
"""

import csv
import os
import time
from pathlib import Path

from google import genai

# ---------------------------------------------------------------------------
# KONFIGURATION - hier anpassen
# ---------------------------------------------------------------------------

MODEL = "gemini-2.5-flash-image"   # guenstig, ~$0.039 pro Bild
CSV_FILE = "scene_artwork_prompts.csv"   # Spalten: Filename, AI Prompt  
OUTPUT_DIR = Path("output_images")
DELAY_BETWEEN_CALLS_SEC = 1.0      # schont Rate-Limits, bei Bedarf erhoehen
LIMIT = None                       # z.B. 10 zum Testen einer kleinen Charge, None = alle

# ---------------------------------------------------------------------------

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit(
            "Kein API-Key gefunden. Bitte GEMINI_API_KEY als Umgebungsvariable setzen."
        )

    client = genai.Client(api_key=api_key)
    OUTPUT_DIR.mkdir(exist_ok=True)

    rows = read_csv(CSV_FILE)
    if LIMIT is not None:
        rows = rows[:LIMIT]
    total = len(rows)
    print(f"{total} Bilder zu erzeugen.")

    done, skipped, failed = 0, 0, 0

    for i, row in enumerate(rows, start=1):
        filename = row["Filename"].strip()
        prompt = row["AI Prompt"].strip()
        out_path = OUTPUT_DIR / (filename if filename.endswith(".png") else f"{filename}.png")

        if out_path.exists():
            print(f"[{i}/{total}] {out_path.name} existiert bereits - ueberspringe.")
            skipped += 1
            continue

        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=[prompt],
            )
            image_bytes = extract_image_bytes(response)
            if image_bytes is None:
                print(f"[{i}/{total}] KEIN Bild in Antwort fuer '{filename}' - uebersprungen.")
                failed += 1
                continue

            out_path.write_bytes(image_bytes)
            print(f"[{i}/{total}] gespeichert: {out_path.name} (fertig: {done+1}, verbleibend: {total-i})")
            done += 1

        except Exception as exc:
            print(f"[{i}/{total}] FEHLER bei '{filename}': {exc}")
            failed += 1

        time.sleep(DELAY_BETWEEN_CALLS_SEC)

    print(f"\nFertig. Erstellt: {done}, uebersprungen: {skipped}, fehlgeschlagen: {failed}")


def read_csv(path: str) -> list[dict]:
    if not Path(path).exists():
        raise SystemExit(
            f"'{path}' nicht gefunden. Lege eine CSV mit den Spalten 'filename,subject' an."
        )
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def extract_image_bytes(response) -> bytes | None:
    """Holt die Bilddaten aus der Gemini-Antwort."""
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if getattr(part, "inline_data", None) is not None:
                return part.inline_data.data
    return None


if __name__ == "__main__":
    main()