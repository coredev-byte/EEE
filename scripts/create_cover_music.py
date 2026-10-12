"""Original 48-second dark-fantasy title theme, synthesized locally and loopable.

Eight D-minor harmonic phrases, bowed-string pads, a plucked bell melody,
low drum pulses and a quiet answering voice. No third-party recordings.
"""
from pathlib import Path
import json
import wave
import numpy as np

RATE = 22050


def generate(root):
    seconds = 48
    n = RATE * seconds
    t = np.arange(n) / RATE
    music = np.zeros(n)
    chords = [(38, 45, 53), (34, 41, 50), (36, 43, 52), (33, 40, 49),
              (38, 45, 53), (41, 48, 57), (36, 43, 52), (33, 40, 49)]
    melody = [74, 69, 72, 65, 74, 77, 72, 69, 70, 65, 69, 62, 67, 69, 73, 69]

    def frequency(note):
        return 440 * 2 ** ((note - 69) / 12)

    def add(start, samples):
        indices = (int(start * RATE) + np.arange(len(samples))) % n
        np.add.at(music, indices, samples)

    for bar, chord in enumerate(chords):
        u = np.arange(RATE * 7) / RATE
        envelope = np.minimum(1, u / 1.4) * np.minimum(1, (7 - u) / 1.4)
        pad = np.zeros(len(u))
        for note in chord:
            f = frequency(note)
            for harmonic, weight in [(1, .045), (2, .018), (3, .006)]:
                pad += np.sin(2 * np.pi * f * harmonic * u + .08 * np.sin(u * 3)) * weight
        add(bar * 6, pad * envelope)
        for beat in range(8):
            if beat % 2 == 0:
                v = np.arange(int(RATE * .55)) / RATE
                drum = np.sin(2 * np.pi * (55 * v - 17 * v * v)) * np.exp(-v * 12)
                add(bar * 6 + beat * .75, drum * .065)
            v = np.arange(int(RATE * 2.4)) / RATE
            f = frequency(melody[(bar * 2 + beat // 4) % len(melody)] - (12 if beat % 4 else 0))
            env = (1 - np.exp(-v * 75)) * np.exp(-v * 2.2)
            pluck = np.sin(2 * np.pi * f * v) + .3 * np.sin(2 * np.pi * f * 2 * v)
            add(bar * 6 + beat * .75, pluck * env * (.07 if beat % 4 == 0 else .022))
        if bar >= 4:
            v = np.arange(RATE * 4) / RATE
            f = frequency(chord[2] + 12)
            answer = np.sin(2 * np.pi * f * v + .05 * np.sin(v * 4)) * np.sin(np.pi * v / 4) ** 2
            add(bar * 6 + 1.5, answer * .04)

    music -= music.mean()
    music *= min(.48 / np.max(np.abs(music)), .09 / np.sqrt(np.mean(music * music)))
    path = root / 'music' / 'title-theme.wav'
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as out:
        out.setparams((1, 2, RATE, n, 'NONE', 'not compressed'))
        out.writeframes((music * 32767).astype('<i2').tobytes())
    return {'file': 'music/title-theme.wav', 'seconds': seconds,
            'peak': round(float(np.max(np.abs(music))), 4),
            'rms': round(float(np.sqrt(np.mean(music * music))), 4), 'loop': True}


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1] / 'public/audio'
    entry = generate(root)
    manifest_path = root / 'inventory.json'
    manifest = json.loads(manifest_path.read_text())
    manifest = [item for item in manifest if item['file'] != entry['file']] + [entry]
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    print('Generated original 48-second title theme; inventory updated.')
