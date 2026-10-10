"""Regression tests for neighboring-sprite contamination and clipped atlas borders."""
import unittest
from pathlib import Path
from PIL import Image
from sprite_frames import silhouettes, pack


class SpriteExtractionTests(unittest.TestCase):
    def test_weapon_crossing_nominal_column_does_not_leak_into_neighbor(self):
        sheet=Image.new('RGBA',(256,112))
        # Two connected opaque test shapes; the first crosses the old 128px cut.
        sheet.paste((100,120,140,255),(30,10,60,95))
        sheet.paste((200,210,220,255),(50,20,148,26))
        sheet.paste((80,90,100,255),(170,15,202,95))
        sheet.putpixel((125,100),(255,0,255,255))  # Detached background remnant.
        frames=silhouettes(sheet,expected=2)
        self.assertEqual(frames[0].width,118)
        self.assertEqual(frames[1].size,(32,80))
        self.assertEqual(set(frames[1].getdata()),{(80,90,100,255)})

    def test_long_action_has_transparent_gutter_and_no_cut_pixels(self):
        pose=Image.new('RGBA',(180,130),(120,130,150,255))
        frame=pack(pose,.8)
        alpha=frame.getchannel('A')
        bounds=alpha.getbbox()
        self.assertGreaterEqual(bounds[0],2)
        self.assertGreaterEqual(bounds[1],2)
        self.assertLessEqual(bounds[2],94)
        self.assertEqual(bounds[3],108)
        self.assertEqual(set(alpha.getdata()),{0,255})

    def test_exported_character_frames_have_clean_transparent_edges(self):
        assets=Path(__file__).resolve().parents[1]/'public/assets/characters'
        count=0
        for path in assets.glob('*.png'):
            with Image.open(path) as image:
                self.assertEqual(image.width % 96,0)
                self.assertEqual(image.height % 112,0)
                for y in range(0,image.height,112):
                    for x in range(0,image.width,96):
                        with self.subTest(atlas=path.name,x=x,y=y):
                            alpha=image.crop((x,y,x+96,y+112)).getchannel('A')
                            bounds=alpha.getbbox()
                            self.assertIsNotNone(bounds)
                            self.assertGreaterEqual(bounds[0],2)
                            self.assertGreaterEqual(bounds[1],2)
                            self.assertLessEqual(bounds[2],94)
                            self.assertLessEqual(bounds[3],108)
                            self.assertLessEqual(set(alpha.tobytes()),{0,255})
                            count+=1
        self.assertEqual(count,192)

    def test_touching_figures_fail_instead_of_exporting_mixed_sprite(self):
        with self.assertRaisesRegex(ValueError,'separated sprites'):
            silhouettes(Image.new('RGBA',(180,130),(100,110,120,255)),expected=2)


if __name__=='__main__':unittest.main()
