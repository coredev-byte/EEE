"""Reproduce Ferrugem's original eight-second mechanical ambience (PCM16)."""
from pathlib import Path
import json
import math
import random
import struct
import wave


def generate(root: Path):
    rate = 22050
    rng = random.Random(203)
    samples = []
    for i in range(rate * 8):
        t = i / rate
        envelope = math.exp(-(t % 2) * 24)
        hum = .12 * math.sin(2 * math.pi * 55 * t) + .055 * math.sin(2 * math.pi * 110 * t)
        clank = envelope * (.22 * math.sin(2 * math.pi * 660 * t) + .1 * math.sin(2 * math.pi * 940 * t) + .04 * (rng.random() * 2 - 1))
        samples.append(round((hum + clank) * 11000))
    path = root / 'ambience' / 'machinery.wav'
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(b''.join(struct.pack('<h', value) for value in samples))
    return {'file': 'ambience/machinery.wav', 'seconds': 8.0, 'peak': round(max(abs(value) for value in samples) / 32768, 4), 'rms': round(math.sqrt(sum(value * value for value in samples) / len(samples)) / 32768, 4), 'loop': True}


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1] / 'public/audio'
    entry = generate(root)
    manifest = json.loads((root / 'inventory.json').read_text())
    manifest = [item for item in manifest if item['file'] != entry['file']] + [entry]
    (root / 'inventory.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(entry)
