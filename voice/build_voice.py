#!/usr/bin/env python3
"""Assemble voice.wav + words.json from edge-tts sentence clips.

Each clip is trimmed to its speech, with a 40 ms pre-roll and 80 ms post-roll, then
joined with hand-set gaps. Word timings come from edge-tts WordBoundary events and
are shifted by the trim, so every word is sample-accurate.
"""
import json, re, wave, os, subprocess
from array import array

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = os.path.join(ROOT, "voice", "parts25")
OUT_WAV = os.path.join(ROOT, "voice", "voice.wav")
OUT_JSON = os.path.join(ROOT, "voice", "words.json")
SR = 48000
PRE, POST = 0.040, 0.080

# gap after each sentence (seconds); the hook, the deadpan and the callback get a beat
GAPS = [0.18, 0.10, 0.08, 0.10, 0.12, 0.20, 0.22, 0.10, 0.12, 0.12, 0.10, 0.12, 0.10, 0.12, 0.20]

TOKEN = re.compile(r"[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*")

def read_wav(path):
    with wave.open(path, "rb") as w:
        assert w.getnchannels() == 1 and w.getsampwidth() == 2 and w.getframerate() == SR, path
        frames = w.readframes(w.getnframes())
    return frames, array("h", frames)

def trim(frames, samples):
    n = len(samples)
    thr = 120
    first = next((i for i, s in enumerate(samples) if abs(s) > thr), 0)
    last = next((i for i in range(n - 1, -1, -1) if abs(samples[i]) > thr), n - 1)
    a = max(0, first - int(PRE * SR))
    b = min(n, last + 1 + int(POST * SR))
    return frames[a * 2:b * 2], a / SR

def split_event(ev, tokens):
    """Turn one WordBoundary event into one or more token timings."""
    if len(tokens) == 1:
        return [(tokens[0], ev["start"], ev["start"] + ev["dur"])]
    # split a grouped event by a crude syllable weight
    weights = []
    for t in tokens:
        digits = sum(c.isdigit() for c in t)
        weights.append(1 + digits * 0.75 if digits else max(1, round(len(t) / 3)))
    total = sum(weights)
    out, t0 = [], ev["start"]
    for t, w in zip(tokens, weights):
        d = ev["dur"] * w / total
        out.append((t, t0, t0 + d))
        t0 += d
    return out

def main():
    meta = json.load(open(os.path.join(PARTS, "meta.json")))
    parts = []
    for m in meta:
        frames, samples = read_wav(os.path.join(PARTS, f"{m['i']:02d}.wav"))
        tf, shift = trim(frames, samples)
        parts.append((tf, shift, m))

    out = bytearray()
    words, sentences = [], []
    cursor = 0.0
    for i, (frames, shift, m) in enumerate(parts):
        if i:
            gap = GAPS[i - 1]
            out += b"\x00\x00" * int(round(gap * SR))
            cursor += gap
        start = cursor
        out += frames
        dur = len(frames) / 2 / SR
        cursor += dur

        # flatten events into token timings
        ev_tokens = []
        for ev in m["words"]:
            toks = TOKEN.findall(ev["text"])
            if not toks:
                continue
            ev_tokens += split_event(ev, toks)
        script_tokens = TOKEN.findall(m["text"])
        if len(ev_tokens) != len(script_tokens):
            raise SystemExit(f"sentence {i}: {len(ev_tokens)} event tokens vs {len(script_tokens)} script tokens\n{ev_tokens}\n{script_tokens}")
        for tok, ws, we in ev_tokens:
            s = start + max(0.0, ws - shift)
            e = start + max(0.0, we - shift)
            e = min(e, start + dur)
            words.append({"w": tok, "s": round(s, 3), "e": round(e, 3)})
        sentences.append({"text": m["text"], "s": round(start, 3), "e": round(start + dur, 3)})

    with wave.open(OUT_WAV, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(bytes(out))
    total = len(out) / 2 / SR
    json.dump({"duration": round(total, 3), "words": words, "sentences": sentences}, open(OUT_JSON, "w"), indent=1)
    print(f"voice.wav {total:.3f}s, {len(words)} words, {len(sentences)} sentences")
    print("first", words[:4])
    print("last", words[-3:])

if __name__ == "__main__":
    main()
