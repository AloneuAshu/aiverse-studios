import sys
import os
import argparse
import subprocess
from pydub import AudioSegment
import speech_recognition as sr

# Arguments parsing
parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True)
parser.add_argument('--lang', default='en-US')
parser.add_argument('--output_srt', required=True)
parser.add_argument('--detect_gender', action='store_true', default=False)
args = parser.parse_args()

# Extract WAV audio using FFmpeg
temp_wav = "temp_audio_extract.wav"
if os.path.exists(temp_wav):
    try:
        os.remove(temp_wav)
    except:
        pass

print("Extracting audio from video...")
sys.stdout.flush()
cmd = ['ffmpeg', '-i', args.input, '-ac', '1', '-ar', '16000', temp_wav, '-y']
subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

if not os.path.exists(temp_wav):
    print("ERROR: Failed to extract audio")
    sys.exit(1)

# Load audio
audio = AudioSegment.from_wav(temp_wav)
duration_ms = len(audio)
chunk_len_ms = 6000

lang_code = args.lang
if lang_code == 'auto':
    print("Detecting language...")
    sys.stdout.flush()
    snippet = audio[0:min(25000, duration_ms)]
    snippet_wav = "temp_snippet.wav"
    snippet.export(snippet_wav, format="wav")
    candidates = ['en-US', 'hi-IN', 'te-IN', 'ta-IN', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ar-SA', 'pt-BR', 'ja-JP', 'ko-KR', 'ru-RU']
    best_lang = 'en-US'
    best_words = 0
    r = sr.Recognizer()
    try:
        with sr.AudioFile(snippet_wav) as source:
            audio_data = r.record(source)
            for cand in candidates:
                try:
                    text = r.recognize_google(audio_data, language=cand)
                    words = len(text.split())
                    if words > best_words:
                        best_words = words
                        best_lang = cand
                except:
                    pass
    except Exception as e:
        print(f"Warning during detection: {e}")
    if os.path.exists(snippet_wav):
        try:
            os.remove(snippet_wav)
        except:
            pass
    lang_code = best_lang
    print(f"Detected language: {lang_code}")
    sys.stdout.flush()

# ----------------------------------------------------------------------------
# Gender detection helper (pitch-based via librosa)
# ----------------------------------------------------------------------------
def detect_gender_from_wav(wav_path):
    """
    Estimate voice gender from a mono WAV file using fundamental frequency (F0).
    Male voices: ~85-165 Hz  |  Female voices: ~165-255 Hz
    Returns 'MALE', 'FEMALE', or 'UNKNOWN'
    """
    try:
        import librosa
        import numpy as np
        y, sr_lib = librosa.load(wav_path, sr=None, mono=True)
        if len(y) < sr_lib * 0.3:   # too short
            return 'UNKNOWN'
        # Use PYIN for robust F0 estimation
        f0, voiced_flag, _ = librosa.pyin(
            y,
            fmin=librosa.note_to_hz('C2'),   # ~65 Hz
            fmax=librosa.note_to_hz('C6'),   # ~1047 Hz
            sr=sr_lib
        )
        voiced_f0 = f0[voiced_flag & ~np.isnan(f0)] if f0 is not None else []
        if len(voiced_f0) == 0:
            return 'UNKNOWN'
        median_f0 = float(np.median(voiced_f0))
        # Threshold: below 165 Hz → male, above → female
        if median_f0 < 165:
            return 'MALE'
        else:
            return 'FEMALE'
    except Exception as e:
        print(f"[GENDER] Warning: {e}", file=sys.stderr)
        return 'UNKNOWN'

# Transcribe chunks to SRT
r = sr.Recognizer()
srt_entries = []
num_chunks = (duration_ms + chunk_len_ms - 1) // chunk_len_ms

print(f"Transcribing {num_chunks} chunks in language: {lang_code}...")
if args.detect_gender:
    print("Gender detection: ENABLED")
sys.stdout.flush()

def format_srt_time(ms):
    s = ms // 1000
    m = s // 60
    h = m // 60
    return f"{h:02d}:{m%60:02d}:{s%60:02d},{ms%1000:03d}"

for idx in range(num_chunks):
    start_ms = idx * chunk_len_ms
    end_ms = min(start_ms + chunk_len_ms, duration_ms)
    chunk = audio[start_ms:end_ms]
    chunk_wav = f"temp_chunk_{idx}.wav"
    chunk.export(chunk_wav, format="wav")
    text = ""
    gender = "UNKNOWN"
    try:
        with sr.AudioFile(chunk_wav) as source:
            audio_data = r.record(source)
            text = r.recognize_google(audio_data, language=lang_code)
    except sr.UnknownValueError:
        pass
    except Exception:
        pass

    # Gender detection on same chunk WAV
    if args.detect_gender and os.path.exists(chunk_wav):
        gender = detect_gender_from_wav(chunk_wav)

    if os.path.exists(chunk_wav):
        try:
            os.remove(chunk_wav)
        except:
            pass

    if text.strip():
        entry_text = text.strip()
        entry_idx = len(srt_entries) + 1

        # Prepend gender tag if detected
        if args.detect_gender and gender != 'UNKNOWN':
            entry_text = f"[{gender}] {entry_text}"

        srt_entries.append({
            'idx': entry_idx,
            'start': start_ms,
            'end': end_ms,
            'text': entry_text,
            'gender': gender
        })

        # Emit gender info for server to parse
        if args.detect_gender:
            print(f"GENDER: {entry_idx}:{gender}")
            sys.stdout.flush()

    progress_pct = int(((idx + 1) / num_chunks) * 100)
    print(f"PROGRESS: {progress_pct}%")
    sys.stdout.flush()

# Write SRT
def write_srt(entries, path):
    lines = []
    for e in entries:
        lines.append(str(e['idx']))
        lines.append(f"{format_srt_time(e['start'])} --> {format_srt_time(e['end'])}")
        lines.append(e['text'])
        lines.append("")
    with open(path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))

write_srt(srt_entries, args.output_srt)

# Print gender summary if detection was enabled
if args.detect_gender:
    male_count = sum(1 for e in srt_entries if e.get('gender') == 'MALE')
    female_count = sum(1 for e in srt_entries if e.get('gender') == 'FEMALE')
    unknown_count = sum(1 for e in srt_entries if e.get('gender') == 'UNKNOWN')
    print(f"GENDER_SUMMARY: MALE={male_count},FEMALE={female_count},UNKNOWN={unknown_count}")
    sys.stdout.flush()

# Cleanup
if os.path.exists(temp_wav):
    try:
        os.remove(temp_wav)
    except:
        pass

print("SUCCESS: Subtitles generated!")
sys.stdout.flush()
