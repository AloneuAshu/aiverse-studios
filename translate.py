import sys
import os
import argparse
import re

parser = argparse.ArgumentParser()
parser.add_argument('--input_srt', required=True)
parser.add_argument('--output_srt', required=True)
parser.add_argument('--target_lang', required=True)
args = parser.parse_args()

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("ERROR: deep-translator not installed. Run: pip install deep-translator")
    sys.exit(1)

def parse_srt(path):
    """Parse SRT file into list of (idx, time_line, text) tuples."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    blocks = re.split(r'\n\n+', content.strip())
    entries = []
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) >= 3:
            idx = lines[0].strip()
            time_line = lines[1].strip()
            text = ' '.join(lines[2:]).strip()
            entries.append({'idx': idx, 'time': time_line, 'text': text})
    return entries

def translate_entries(entries, target):
    translator = GoogleTranslator(source='auto', target=target)
    total = len(entries)
    for i, entry in enumerate(entries):
        try:
            # Translate in chunks of max 500 chars
            translated = translator.translate(entry['text'])
            entry['translated'] = translated if translated else entry['text']
        except Exception as e:
            print(f"Warning: Translation failed for entry {entry['idx']}: {e}", file=sys.stderr)
            entry['translated'] = entry['text']
        pct = int(((i + 1) / total) * 100)
        print(f"PROGRESS: {pct}%")
        sys.stdout.flush()
    return entries

def write_srt(entries, path):
    lines = []
    for e in entries:
        lines.append(str(e['idx']))
        lines.append(e['time'])
        lines.append(e.get('translated', e['text']))
        lines.append("")
    with open(path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))

print(f"Translating SRT to language: {args.target_lang}")
sys.stdout.flush()

entries = parse_srt(args.input_srt)
if not entries:
    print("ERROR: No subtitle entries found in input SRT")
    sys.exit(1)

print(f"Found {len(entries)} subtitle entries to translate...")
sys.stdout.flush()

translated = translate_entries(entries, args.target_lang)
write_srt(translated, args.output_srt)

print("SUCCESS: Translation complete!")
sys.stdout.flush()
