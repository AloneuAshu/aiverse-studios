"""
srt_to_audio.py  —  Convert an SRT subtitle file to a narrated audio file (MP3)
                    with precise timeline synchronization and voice gender assignment.
                    Supports automatic padding to match a video track duration.
Usage:
    python srt_to_audio.py --input path/to/file.srt --output path/to/out.mp3
                           --engine [offline|online] --speed [0.5-2.0]
                           --lang [en|hi|te|...] --sync [true|false]
                           --video_duration [duration_ms]
"""

import sys
import os
import re
import argparse
import tempfile

# ─── Argument parsing ─────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument('--input',   required=True,  help='Path to .srt file')
parser.add_argument('--output',  required=True,  help='Output .mp3 path')
parser.add_argument('--engine',  default='online', choices=['offline', 'online'],
                    help='TTS engine: offline (pyttsx3) or online (gTTS)')
parser.add_argument('--speed',   type=float, default=1.0, help='Speech speed multiplier')
parser.add_argument('--lang',    default='en', help='Language code (e.g. en, hi, te)')
parser.add_argument('--sync',    default='true', choices=['true', 'false'], help='Sync audio with SRT timestamps')
parser.add_argument('--video_duration', type=float, default=None, help='Target video duration in milliseconds to pad audio track to')
args = parser.parse_args()

# ─── Helpers ──────────────────────────────────────────────────────────────────

def timecode_to_ms(tc):
    """Convert SRT timecode (HH:MM:SS,mmm or HH:MM:SS.mmm) to milliseconds."""
    tc = tc.replace(',', '.')
    parts = tc.split(':')
    if len(parts) < 3:
        return 0
    h = int(parts[0])
    m = int(parts[1])
    s_parts = parts[2].split('.')
    s = int(s_parts[0])
    ms = int(s_parts[1]) if len(s_parts) > 1 else 0
    return ((h * 3600) + (m * 60) + s) * 1000 + ms

def parse_srt(path):
    """Parse SRT → list of dicts with start, end, gender, and clean text."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Normalize line endings
    content = content.replace('\r\n', '\n')
    
    # Regex to find SRT blocks matching standard timecodes
    pattern = re.compile(
        r'(\d+)\s*\n'
        r'(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*\n'
        r'(.*?)(?=\n\d+\s*\n|\Z)',
        re.DOTALL
    )
    
    entries = []
    for match in pattern.finditer(content):
        start_tc = match.group(2)
        end_tc = match.group(3)
        raw_text = match.group(4).strip()
        
        # Detect gender tag if present
        gender = 'UNKNOWN'
        gender_match = re.match(r'^\[(MALE|FEMALE|UNKNOWN)\]', raw_text)
        if gender_match:
            gender = gender_match.group(1)
            
        # Clean gender tags like [MALE] / [FEMALE] from clean text
        text = re.sub(r'^\[(MALE|FEMALE|UNKNOWN)\]\s*', '', raw_text)
        text = ' '.join([line.strip() for line in text.split('\n') if line.strip()])
        
        if text:
            entries.append({
                'start': timecode_to_ms(start_tc),
                'end': timecode_to_ms(end_tc),
                'text': text,
                'gender': gender
            })
    return entries

def report(pct, msg=''):
    print(f"PROGRESS: {pct}%")
    if msg:
        print(f"STATUS: {msg}")
    sys.stdout.flush()

# ─── Mix Audio Timeline ───────────────────────────────────────────────────────

def mix_timeline(temp_files, entries, output_path, sync_enabled, gender_pitch_shift, video_duration_ms=None):
    from pydub import AudioSegment
    
    report(88, "Building final audio timeline…")
    combined = AudioSegment.empty()
    current_time_ms = 0
    
    for i, tf in enumerate(temp_files):
        if not tf or not os.path.exists(tf) or os.path.getsize(tf) == 0:
            continue
            
        try:
            # Load segment
            if tf.endswith('.wav'):
                seg = AudioSegment.from_wav(tf)
            else:
                seg = AudioSegment.from_mp3(tf)
                
            entry = entries[i]
            gender = entry['gender']
            
            # Apply pitch shift to differentiate speakers if using a single-voice engine
            if gender_pitch_shift:
                if gender == 'MALE':
                    # Lower pitch (sample rate factor ~0.83)
                    new_rate = int(seg.frame_rate * 0.83)
                    seg = seg._spawn(seg.raw_data, overrides={'frame_rate': new_rate})
                    seg = seg.set_frame_rate(44100)
                elif gender == 'FEMALE':
                    # Raise pitch (sample rate factor ~1.12)
                    new_rate = int(seg.frame_rate * 1.12)
                    seg = seg._spawn(seg.raw_data, overrides={'frame_rate': new_rate})
                    seg = seg.set_frame_rate(44100)
            
            if sync_enabled:
                start_target = entry['start']
                # Insert silence if segment start is further down the timeline
                if start_target > current_time_ms:
                    silence_duration = start_target - current_time_ms
                    combined += AudioSegment.silent(duration=silence_duration)
                    current_time_ms = start_target
                    
                combined += seg
                current_time_ms += len(seg)
            else:
                # Sequential mode: just add a 350ms pause
                silence = AudioSegment.silent(duration=350)
                combined += seg + silence
                
        except Exception as e:
            print(f"[WARN] Could not load/mix segment {i+1}: {e}", file=sys.stderr)

    # Padding to match target video duration if provided (e.g. for YouTube Multi-Language Audio Sync)
    if video_duration_ms and len(combined) < video_duration_ms:
        pad_duration = int(video_duration_ms - len(combined))
        report(95, f"Padding final track with {pad_duration}ms of silence to match video length ({int(video_duration_ms)}ms)…")
        combined += AudioSegment.silent(duration=pad_duration)

    # Cleanup temp wavs/mp3s
    for tf in temp_files:
        if tf:
            try:
                os.remove(tf)
            except:
                pass

    if len(combined) == 0:
        print("ERROR: No audio was generated")
        sys.exit(1)

    combined.export(output_path, format='mp3', bitrate='192k')
    report(100, "Done!")

# ─── TTS engines ──────────────────────────────────────────────────────────────

def generate_offline(entries, output_path, speed, lang, sync_enabled, video_duration_ms=None):
    """Use pyttsx3 (system TTS) to generate audio."""
    try:
        import pyttsx3
    except ImportError as e:
        print(f"ERROR: Missing dependency — {e}. Run: pip install pyttsx3")
        sys.exit(1)

    try:
        import pythoncom
        pythoncom.CoInitialize()
    except:
        pass

    # Pre-scan and group available voices by gender
    male_voices = []
    female_voices = []
    default_lang_voices = []
    
    try:
        test_engine = pyttsx3.init()
        voices = test_engine.getProperty('voices')
        
        # Check matching lang voices
        lang_voices = [v for v in voices if lang.lower() in (v.languages[0].decode() if isinstance(v.languages[0], bytes) else v.languages[0]).lower()]
        if not lang_voices:
            lang_voices = voices # fallback
            
        for v in lang_voices:
            name = v.name.lower()
            if 'david' in name or 'male' in name or 'harid' in name or 'george' in name or 'sean' in name:
                male_voices.append(v.id)
            elif 'zira' in name or 'hazel' in name or 'female' in name or 'heera' in name or 'susan' in name:
                female_voices.append(v.id)
            else:
                default_lang_voices.append(v.id)
                
        del test_engine
    except Exception as e:
        print(f"[WARN] Failed to pre-scan voices: {e}", file=sys.stderr)

    total = len(entries)
    temp_files = []

    for i, entry in enumerate(entries):
        tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        tmp.close()
        
        # Select voice by gender tag
        gender = entry['gender']
        voice_to_use = None
        if gender == 'MALE' and male_voices:
            voice_to_use = male_voices[0]
        elif gender == 'FEMALE' and female_voices:
            voice_to_use = female_voices[0]
        else:
            # fallback
            if default_lang_voices:
                voice_to_use = default_lang_voices[0]
            elif female_voices:
                voice_to_use = female_voices[0]
            elif male_voices:
                voice_to_use = male_voices[0]
        
        try:
            engine = pyttsx3.init()
            default_rate = engine.getProperty('rate')
            engine.setProperty('rate', int(default_rate * speed))
            if voice_to_use:
                engine.setProperty('voice', voice_to_use)
            
            engine.save_to_file(entry['text'], tmp.name)
            engine.runAndWait()
            del engine
            temp_files.append(tmp.name)
        except Exception as e:
            print(f"[WARN] Offline synthesis failed for segment {i+1}: {e}", file=sys.stderr)
            temp_files.append(None)
            
        report(int(((i + 1) / total) * 85), f"Synthesizing segment {i+1}/{total}")

    mix_timeline(temp_files, entries, output_path, sync_enabled, gender_pitch_shift=False, video_duration_ms=video_duration_ms)


def generate_online(entries, output_path, speed, lang, sync_enabled, video_duration_ms=None):
    """Use gTTS (Google TTS) to generate audio."""
    try:
        from gtts import gTTS
        from pydub import AudioSegment
    except ImportError as e:
        print(f"ERROR: Missing dependency — {e}. Run: pip install gTTS pydub")
        sys.exit(1)

    total = len(entries)
    temp_files = []

    for i, entry in enumerate(entries):
        try:
            tts = gTTS(text=entry['text'], lang=lang, slow=False)
            tmp = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
            tmp.close()
            tts.save(tmp.name)
            temp_files.append(tmp.name)
        except Exception as e:
            print(f"[WARN] gTTS failed for segment {i+1}: {e}", file=sys.stderr)
            temp_files.append(None)
        report(int(((i + 1) / total) * 85), f"Synthesizing segment {i+1}/{total}")

    # Process speeds if non-default
    if abs(speed - 1.0) > 0.05:
        report(86, "Adjusting speed of voice segments…")
        for i, tf in enumerate(temp_files):
            if tf and os.path.exists(tf) and os.path.getsize(tf) > 0:
                try:
                    seg = AudioSegment.from_mp3(tf)
                    new_rate = int(seg.frame_rate * speed)
                    seg = seg._spawn(seg.raw_data, overrides={'frame_rate': new_rate})
                    seg = seg.set_frame_rate(44100)
                    seg.export(tf, format='mp3')
                except Exception as e:
                    print(f"[WARN] Speed adjustment failed for segment {i+1}: {e}", file=sys.stderr)

    mix_timeline(temp_files, entries, output_path, sync_enabled, gender_pitch_shift=True, video_duration_ms=video_duration_ms)


# ─── Main ─────────────────────────────────────────────────────────────────────

if not os.path.exists(args.input):
    print(f"ERROR: SRT file not found: {args.input}")
    sys.exit(1)

report(0, "Parsing SRT file…")
entries = parse_srt(args.input)

if not entries:
    print("ERROR: No subtitle text found in SRT file")
    sys.exit(1)

print(f"SEGMENTS: {len(entries)}")
sync_mode = (args.sync.lower() == 'true')
report(5, f"Found {len(entries)} subtitle segments. Starting TTS ({args.engine}, sync={sync_mode})…")
sys.stdout.flush()

if args.engine == 'online':
    generate_online(entries, args.output, args.speed, args.lang, sync_mode, args.video_duration)
else:
    generate_offline(entries, args.output, args.speed, args.lang, sync_mode, args.video_duration)

print("SUCCESS: Audio generated!")
sys.stdout.flush()
