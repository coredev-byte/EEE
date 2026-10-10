"""Validate the shipped PCM assets independently of their generator."""
import hashlib, json, unittest, wave
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1] / 'public/audio'

class AudioAssets(unittest.TestCase):
    def test_inventory_and_decode(self):
        manifest = json.loads((ROOT / 'inventory.json').read_text())
        self.assertEqual(len(manifest), 53)
        self.assertEqual({x['file'] for x in manifest}, {str(p.relative_to(ROOT)) for p in ROOT.rglob('*.wav')})
        for item in manifest:
            with self.subTest(file=item['file']), wave.open(str(ROOT / item['file'])) as f:
                self.assertEqual((f.getnchannels(), f.getsampwidth(), f.getframerate()), (1, 2, 22050))
                self.assertAlmostEqual(f.getnframes() / f.getframerate(), item['seconds'], delta=.001)
                x = np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').astype(float) / 32768
                self.assertTrue(np.isfinite(x).all())
                self.assertLessEqual(np.max(np.abs(x)), .551)
                self.assertGreater(np.sqrt(np.mean(x*x)), .02)
                if not item['loop']:
                    self.assertEqual((x[0], x[-1]), (0, 0))
                else:
                    self.assertLess(abs(x[-1]-x[0]), .06)

    def test_repetition_uses_distinct_assets(self):
        for family in ['blade', 'metal', 'body', 'step-stone', 'step-grass', 'step-wood']:
            hashes = {hashlib.sha256((ROOT / 'sfx' / f'{family}-{i}.wav').read_bytes()).hexdigest() for i in range(3)}
            self.assertEqual(len(hashes), 3)

if __name__ == '__main__':
    unittest.main()
