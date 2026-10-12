"""Failure-path regressions: bad art must never change production files."""
from pathlib import Path
from PIL import Image
from unittest import TestCase, main
from unittest.mock import patch
import copy
import json
import tempfile

from asset_registry import ASSETS, digest, import_native, inspect, publish_compilation, validate


class RegistryTests(TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        color = tuple(json.loads((ASSETS / "animations/palette.json").read_text())[20])
        self.source = self.root / "source.png"
        image = Image.new("RGBA", (16, 8))
        image.putpixel((3, 3), (*color, 255))
        image.putpixel((12, 3), (*color, 255))
        image.save(self.source)
        self.contract = {"path": "characters/test.png", "runtime": True,
            "sourceSize": [16, 8], "sha256": digest(self.source), "material": "native",
            "frame": {"size": [8, 8], "pivot": [4, 6], "gutter": 1},
            "directions": [],
            "animations": {"walk": {"frames": [0, 1], "duration": .5}},
            "provenance": {"kind": "native-drawing"}, "review": {"status": "pending"}}
        self.manifest_path = self.root / "animations/manifest.json"
        self.manifest_path.parent.mkdir()
        self.manifest_path.write_text(json.dumps({"schemaVersion": 1, "assets": {}}))

    def test_success_preserves_source_and_requires_visual_review(self):
        original = self.source.read_bytes()
        entry = import_native("test", self.source, self.contract, self.manifest_path, self.root)
        self.assertEqual(self.source.read_bytes(), original)
        self.assertEqual((self.root / entry["path"]).read_bytes(), original)
        errors, warnings = validate(json.loads(self.manifest_path.read_text()), self.root)
        self.assertFalse(errors)
        self.assertTrue(warnings)
        errors, _ = validate(json.loads(self.manifest_path.read_text()), self.root, release=True)
        self.assertTrue(errors)

    def test_bad_palette_and_soft_alpha_leave_registry_unchanged(self):
        before = self.manifest_path.read_bytes()
        image = Image.open(self.source).convert("RGBA")
        image.putpixel((3, 3), (123, 234, 45, 128))
        image.save(self.source)
        with self.assertRaisesRegex(ValueError, "palette.*partially transparent"):
            import_native("test", self.source, self.contract, self.manifest_path, self.root)
        self.assertEqual(self.manifest_path.read_bytes(), before)
        self.assertFalse((self.root / self.contract["path"]).exists())

    def test_no_escape_no_overwrite(self):
        unsafe = copy.deepcopy(self.contract)
        unsafe["path"] = "../outside.png"
        with self.assertRaisesRegex(ValueError, "escapes"):
            import_native("test", self.source, unsafe, self.manifest_path, self.root)
        import_native("test", self.source, self.contract, self.manifest_path, self.root)
        before = self.manifest_path.read_bytes()
        with self.assertRaisesRegex(ValueError, "Existing"):
            import_native("test", self.source, self.contract, self.manifest_path, self.root)
        self.assertEqual(self.manifest_path.read_bytes(), before)

    def test_empty_duplicate_and_out_of_range_frames_are_rejected(self):
        image = Image.open(self.source).convert("RGBA")
        image.putpixel((12, 3), (0, 0, 0, 0))
        image.putpixel((11, 3), image.getpixel((3, 3)))
        image.save(self.source)
        entry = copy.deepcopy(self.contract)
        entry["path"] = "source.png"
        entry["sha256"] = digest(self.source)
        errors, _ = inspect(entry, self.root)
        self.assertTrue(any("repeated" in e for e in errors))
        entry["animations"]["walk"]["frames"] = [0, 2]
        errors, _ = inspect(entry, self.root)
        self.assertTrue(any("missing frames" in e for e in errors))
        image = Image.new("RGBA", (16, 8))
        image.save(self.source)
        entry["sha256"] = digest(self.source)
        errors, _ = inspect(entry, self.root)
        self.assertTrue(any("empty cell" in e for e in errors))

    def test_manifest_write_failure_rolls_back_import(self):
        before = self.manifest_path.read_bytes()
        with patch("asset_registry.atomic_json", side_effect=OSError("disk failure")):
            with self.assertRaises(OSError):
                import_native("test", self.source, self.contract, self.manifest_path, self.root)
        self.assertEqual(self.manifest_path.read_bytes(), before)
        self.assertFalse((self.root / self.contract["path"]).exists())

    def test_bad_pivot_gutter_and_duplicate_directions_are_rejected(self):
        entry = copy.deepcopy(self.contract)
        entry["path"] = "source.png"
        entry["frame"]["pivot"] = [9, 6]
        errors, _ = inspect(entry, self.root)
        self.assertTrue(any("pivot" in e for e in errors))
        entry["frame"]["pivot"] = [4, 6]
        entry["frame"]["gutter"] = 4
        errors, _ = inspect(entry, self.root)
        self.assertTrue(any("gutter" in e for e in errors))
        entry["frame"]["gutter"] = 1
        entry["directions"] = ["front", "front"]
        errors, _ = inspect(entry, self.root)
        self.assertTrue(any("direction" in e for e in errors))

    def test_renamed_jpeg_is_not_a_native_png(self):
        Image.open(self.source).convert("RGB").save(self.source, format="JPEG")
        entry = copy.deepcopy(self.contract)
        entry["path"] = "source.png"
        entry["sha256"] = digest(self.source)
        errors, _ = inspect(entry, self.root)
        self.assertTrue(any("encoded as PNG" in e for e in errors))

    def test_compiler_preserves_other_registrations_and_rolls_back(self):
        import_native("test", self.source, self.contract, self.manifest_path, self.root)
        manifest = json.loads(self.manifest_path.read_text())
        manifest["assets"]["foreign"] = {"path": "not-rebuilt.png", "sha256": "unchanged"}
        self.manifest_path.write_text(json.dumps(manifest))
        staging = self.root / "staging"
        file = staging / self.contract["path"]
        file.parent.mkdir(parents=True)
        image = Image.open(self.source).convert("RGBA")
        image.putpixel((4, 4), image.getpixel((3, 3)))
        image.save(file)
        before = self.manifest_path.read_bytes()
        original = (self.root / self.contract["path"]).read_bytes()
        with patch("asset_registry.atomic_json", side_effect=OSError("disk failure")):
            with self.assertRaises(OSError):
                publish_compilation(staging, self.root)
        self.assertEqual(self.manifest_path.read_bytes(), before)
        self.assertEqual((self.root / self.contract["path"]).read_bytes(), original)
        publish_compilation(staging, self.root)
        manifest = json.loads(self.manifest_path.read_text())
        self.assertEqual(manifest["assets"]["foreign"]["sha256"], "unchanged")
        self.assertEqual(manifest["assets"]["test"]["review"]["status"], "pending")


if __name__ == "__main__":
    main()
