"""Original DSP sound design. Reproducible local assets; no downloaded recordings.
Noise/foley transients and inharmonic resonators, never a renamed bank of beeps.
Mono PCM16/22050Hz; bounded levels and faded tails. Loops use periodic spectra.
"""
from pathlib import Path
from create_machinery import generate as generate_machinery
from create_cover_music import generate as generate_cover_music
import json, wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'public/audio'
RATE=22050
rng=np.random.default_rng(712033)
DURATIONS={'prepare':.22,'blade':.28,'metal':.4,'body':.22,'shot':.3,'mechanism':.25,'fire':.65,'arcane':.65,'void':.85,'rune':.75,'poison':.5,'shield':.6,'dash':.4,'interrupt':.3,'death':.7,'enemy':.4,'step-stone':.18,'step-grass':.22,'step-wood':.22,'coins':.4,'item':.55,'equip':.32,'unequip':.28,'compare':.16,'menu-open':.25,'menu-close':.22,'select':.12,'denied':.2,'dialogue':.3,'quest':1.1,'level':1.2,'supreme':1.3,'potion':.45,'chest':.55}

def band(n,low,high):
    noise=rng.normal(size=n)
    f=np.fft.rfftfreq(n,1/RATE)
    mask=np.exp(-np.square((f-(low+high)/2)/max(80,(high-low)/2)))
    return np.fft.irfft(np.fft.rfft(noise)*mask,n=n)

def design(name,duration,variant=0):
    n=int(duration*RATE);t=np.arange(n)/RATE
    breath=band(n,300,6000);low=band(n,40,750);grit=band(n,1800,9000)
    drift=1+variant*.035
    attack=np.minimum(1,t/.008); decay=np.exp(-t/(duration*.25))
    env=attack*decay
    metal=sum(np.sin(2*np.pi*f*drift*t)*np.exp(-t/(.045+.035*i))*.18 for i,f in enumerate([173,429,911,1741,3203]))
    if name in ['prepare','blade','dash']:x=breath*np.sin(np.pi*np.minimum(1,t/duration))**2+low*.2
    elif name in ['metal','shield','interrupt','equip','unequip','mechanism','chest']:x=metal+grit*env*.65+low*env*.35
    elif name in ['body','death','enemy']:x=low*env*1.4+breath*env*.2+np.sin(2*np.pi*(95*t-34*t*t))*env*.3
    elif name=='shot':x=grit*env+low*env*1.2+metal*.22
    elif name=='fire':x=low*env+grit*env*.6+grit*np.maximum(0,np.sin(2*np.pi*31*t))**24*.4
    elif name in ['poison','potion']:x=low*.45*np.exp(-t*5)+np.sin(2*np.pi*(380*t+80*t*t))*env*.3+breath*env*.2
    elif name.startswith('step-'):x=(grit*.3+low)*env if name=='step-stone' else (breath*env*.7 if name=='step-grass' else low*env+metal*.25)
    elif name in ['coins','item','quest','level']:x=metal*.3+sum(np.sin(2*np.pi*f*t)*np.exp(-np.maximum(0,t-i*.07)*7)*(t>=i*.07)*.13 for i,f in enumerate([293.66,440,587.33] if name!='quest' else [220,293.66,349.23]))+breath*env*.05
    elif name in ['arcane','rune','void','supreme']:x=low*.5*env+sum(np.sin(2*np.pi*f*t+np.sin(t*14)*.2)*env*.15 for f in ([73.42,110,146.83] if name in ['void','rune'] else [293.66,415.3,587.33]))+breath*env*.2
    else:x=band(n,250,1800)*env*.8+metal*.15
    return x

def write(path,x,loop=False):
    x=x-np.mean(x)
    if not loop:
        fade=min(600,len(x)//8);x[:fade]*=np.linspace(0,1,fade);x[-fade:]*=np.linspace(1,0,fade)
    rms=np.sqrt(np.mean(x*x));x*=min(.55/(np.max(np.abs(x)) or 1),(.09 if not loop else .045)/(rms or 1))
    path.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(path),'wb') as w:w.setparams((1,2,RATE,len(x),'NONE','not compressed'));w.writeframes((np.clip(x,-.8,.8)*32767).astype('<i2').tobytes())
    return {'file':str(path.relative_to(ROOT)),'seconds':round(len(x)/RATE,3),'peak':round(float(np.max(np.abs(x))),4),'rms':round(float(np.sqrt(np.mean(x*x))),4),'loop':loop}

manifest=[]
for name,duration in DURATIONS.items():
    for v in range(3 if name in ['blade','metal','body','step-stone','step-grass','step-wood'] else 1):
        manifest.append(write(ROOT/'sfx'/f'{name}-{v}.wav',design(name,duration,v)))
# Seamless ambience: integer FFT periods with seeded random phase.
n=RATE*8;t=np.arange(n)/RATE
for name,low,high in [('wind',30,600),('water',150,3500),('insects',2500,7000),('structure',45,350)]:
    x=band(n,low,high)
    mod=.6+.4*np.cos(2*np.pi*t/8)
    if name=='insects':mod=(.5+.5*np.sin(2*np.pi*t*2))**10
    if name=='structure':x=x*.4+np.sin(2*np.pi*55*t)*.1+np.sin(2*np.pi*110*t)*.04
    manifest.append(write(ROOT/'ambience'/f'{name}.wav',x*mod,True))
# Original 16-second D minor ambient sketch: common transport, three layers.
manifest.append(generate_machinery(ROOT))
n=RATE*16;t=np.arange(n)/RATE
pad=sum(np.sin(2*np.pi*(round(f*16)/16)*t+np.sin(2*np.pi*t/16)*.1)*a for f,a in [(73.42,.3),(110,.16),(146.83,.1),(174.61,.08)])*(.7+.3*np.cos(2*np.pi*t/16))
pulse=np.zeros(n);motif=np.zeros(n)
for i in range(16):
    j=int(i*RATE);u=np.arange(min(RATE,n-j))/RATE
    pulse[j:j+len(u)]+=np.sin(2*np.pi*(72*u-20*u*u))*np.exp(-u*12)*.3
for i,f in enumerate([293.66,220,261.63,174.61,293.66,349.23,220,146.83]):
    j=i*2*RATE;u=np.arange(min(2*RATE,n-j))/RATE
    motif[j:j+len(u)]+=np.sin(2*np.pi*f*u)*np.sin(np.pi*u/2)**2*.15+np.sin(2*np.pi*f*2*u)*np.sin(np.pi*u/2)**2*.03
for name,x in [('pad',pad),('pulse',pulse),('motif',motif)]:manifest.append(write(ROOT/'music'/f'{name}.wav',x,True))
manifest.append(generate_cover_music(ROOT))
(ROOT/'inventory.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'{len(manifest)} assets, {sum(p.stat().st_size for p in ROOT.rglob("*.wav"))/1024/1024:.2f} MiB')
