"""Slice generated source atlases, chromakey and quantize to a shared 64-color palette.
No new artwork is drawn here. Coordinates are audited against the source sheets.
"""
from pathlib import Path
from PIL import Image
import json
import argparse
from sprite_frames import silhouettes, pack
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--characters-only', action='store_true', help='Rebuild character animation atlases and portrait only')
options = parser.parse_args()
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'public/assets'
SOURCES=[ASSETS/'spritesheets'/f'source-{i+1}.png' for i in range(6)]

def key(im):
 im=im.convert('RGBA')
 if im.getchannel('A').getextrema()[0]==0:return im
 pixels=[]
 for r,g,b,a in im.getdata():
  pixels.append((r,g,b,0 if r>65 and b>65 and g<min(r,b)*.65 and .74<r/max(b,1)<1.34 else a))
 im.putdata(pixels)
 return im

source=[key(Image.open(p)) for p in SOURCES]
# Freeze the approved material palette so sprite-import fixes do not recolor scenery.
colors=json.loads((ASSETS/'animations/palette.json').read_text())
if len(colors)>63:raise ValueError('Material palette exceeds 63 colors')
palette=Image.new('P',(1,1))
palette.putpalette([channel for color in colors for channel in color]+colors[-1]*(256-len(colors)))

def quantize(im):
 alpha=im.getchannel('A');out=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');out.putalpha(alpha);return out

def cell(im,col,y0,y1,scale,box=(96,112)):
 crop=im.crop((col*128,y0,(col+1)*128,y1));bounds=crop.getbbox()
 if not bounds:raise ValueError('Empty asset')
 crop=crop.crop(bounds);crop=crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))),Image.Resampling.NEAREST)
 out=Image.new('RGBA',box);out.alpha_composite(crop,((box[0]-crop.width)//2,box[1]-crop.height-4));return quantize(out)

_character_rows={}
def character_cell(im,col,y0,y1,scale):
 key=(id(im),y0,y1)
 if key not in _character_rows:
  _character_rows[key]=silhouettes(im.crop((0,y0,im.width,y1)))
 return quantize(pack(_character_rows[key][col],scale))

hero=Image.new('RGBA',(96*12,112*4))
for row,(a,b) in enumerate([(0,162),(162,300),(300,448)]):
 for col in range(12):hero.paste(character_cell(source[0],col,a,b,.57),(col*96,row*112))
for col in range(12):hero.paste(character_cell(source[1],col,0,256,.48),(col*96,3*112))
hero.save(ASSETS/'characters/hero.png')
for row,name in enumerate(['arcanista','assassino','atirador'],1):
 sheet=Image.new('RGBA',(96*12,112))
 for col in range(12):sheet.paste(character_cell(source[1],col,row*256,(row+1)*256,.48),(col*96,0))
 sheet.save(ASSETS/f'characters/{name}.png')
# Directional locomotion sheet for the other classes; real front, back and profile frames.
for row,name in enumerate(['arcanista','assassino','atirador']):
 sheet=Image.new('RGBA',(96*12,112))
 for col in range(12):sheet.paste(character_cell(source[2],col,round(row*1024/3),round((row+1)*1024/3),.37),(col*96,0))
 sheet.save(ASSETS/f'characters/{name}-directions.png')
combat_bounds=[(0,196,.46),(196,390,.46),(390,555,.52),(555,714,.52),(714,884,.54),(884,1024,.54)]
for ci,name in enumerate(['arcanista','assassino','atirador']):
 sheet=Image.new('RGBA',(96*6,112*4))
 for di in range(4):
  a,b,scale=combat_bounds[ci*2+di//2]
  for col in range(6):sheet.paste(character_cell(source[4],col+(di%2)*6,a,b,scale),(col*96,di*112))
 sheet.save(ASSETS/f'characters/{name}-combat.png')
if not options.characters_only:
 enemies=Image.new('RGBA',(96*6,112*2))
 for row in range(2):
  for col in range(6):enemies.paste(cell(source[0],col+row*6,448,590,.57),(col*96,row*112))
 enemies.save(ASSETS/'enemies/enemies.png')
 props=Image.new('RGBA',(128*12,160))
 for col in range(12):props.paste(cell(source[0],col,590,767,.83,(128,160)),(128*col,0))
 props.save(ASSETS/'scenery/props.png')
 # Thin diamonds are trimmed and fitted to a tessellating 80x40 logical tile.
 tiles=Image.new('RGBA',(80*12,40))
 for col in range(12):
  crop=source[0].crop((col*128,767,(col+1)*128,867));crop=crop.crop(crop.getbbox());crop=crop.resize((80,40),Image.Resampling.NEAREST)
  tiles.paste(quantize(crop),(80*col,0))
 tiles.save(ASSETS/'scenery/tiles.png')
 icons=Image.new('RGBA',(48*12,48))
 for col in range(12):
  crop=source[0].crop((col*128,867,(col+1)*128,1024));crop=crop.crop(crop.getbbox());crop.thumbnail((42,42),Image.Resampling.NEAREST)
  out=Image.new('RGBA',(48,48));out.alpha_composite(crop,((48-crop.width)//2,(48-crop.height)//2));icons.paste(quantize(out),(col*48,0))
 icons.save(ASSETS/'icons/icons.png')
 vfx=Image.new('RGBA',(128*8,128*6))
 for row,(a,b) in enumerate([(0,170),(170,324),(324,502),(502,665),(665,842),(842,1024)]):
  for col in range(8):
   crop=source[3].crop((col*192,a,(col+1)*192,b));crop=crop.crop(crop.getbbox());crop=crop.resize((max(1,round(crop.width*.59)),max(1,round(crop.height*.59))),Image.Resampling.NEAREST)
   out=Image.new('RGBA',(128,128));out.alpha_composite(crop,((128-crop.width)//2,(128-crop.height)//2));vfx.paste(quantize(out),(col*128,row*128))
 vfx.save(ASSETS/'effects/effects.png')
 objects=Image.new('RGBA',(128*4,160))
 for i in range(4):
  im=source[5];w,h=im.size
  crop=im.crop(((i%2)*w//2,(i//2)*h//2,(i%2+1)*w//2,(i//2+1)*h//2));crop=crop.crop(crop.getbbox());crop.thumbnail((120,142),Image.Resampling.NEAREST)
  out=Image.new('RGBA',(128,160));out.alpha_composite(crop,((128-crop.width)//2,156-crop.height));objects.paste(quantize(out),(i*128,0))
 objects.save(ASSETS/'objects/objects.png')
 for index,name in enumerate(['steel','fire','lightning','runic']):
  icons.crop((index*48,0,(index+1)*48,48)).save(ASSETS/f'weapons/{name}.png')
 for index,name in [(7,'breastplate'),(8,'amulet')]:
  icons.crop((index*48,0,(index+1)*48,48)).save(ASSETS/f'equipment/{name}.png')
hero.crop((25,32,69,72)).resize((64,64),Image.Resampling.NEAREST).save(ASSETS/'interface/portrait.png')
manifest={'frame':{'width':96,'height':112,'pivot':[48,108]},'hero':{'rows':['front','right','back','left'],'columns':['idle','idle2','walk1','walk2','walk3','walk4','windup','attack','recover','hurt','cast','dead']},'palette':'63 material colors plus transparency; shared across exported art','sources':['source-1.png','source-2.png','source-3.png','source-4.png','source-5.png','source-6.png'],'processing':'nearest-neighbor; chromakey; connected character silhouettes; transparent 2px frame gutters; feet-aligned pivots'}
(ASSETS/'animations/manifest.json').write_text(json.dumps(manifest,indent=2))
print('Compiled character atlases with isolated silhouettes and transparent gutters.' if options.characters_only else 'Compiled all atlases; shared 63-color palette.')
