"""Original Design City instrumental. All oscillators, percussion and notes synthesized here.
No samples, existing song melodies, or third-party audio. 104 BPM, 32 bars, seamless loop.
"""
from pathlib import Path
import math,wave,subprocess
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SR=44100;BPM=104;BEAT=60/BPM;DURATION=128*BEAT;N=round(DURATION*SR)
rng=np.random.default_rng(9186);mix=np.zeros((N,2),np.float32)
def hz(note):return 440*2**((note-69)/12)
def place(sound,time,gain=1,pan=0):
 sound=np.asarray(sound,dtype=np.float32)*gain;start=round(time*SR)
 # Wrap tails across the loop boundary so the final bar connects to the first.
 for channel,p in enumerate([math.sqrt((1-pan)/2),math.sqrt((1+pan)/2)]):
  idx=(np.arange(len(sound))+start)%N
  np.add.at(mix[:,channel],idx,sound*p)
def env(length,attack=.01,release=.08):
 e=np.ones(length);a=min(length,max(1,round(attack*SR)));r=min(length-a,max(1,round(release*SR)));e[:a]=np.linspace(0,1,a);e[-r:]=np.linspace(1,0,r);return e
roots=[45,41,48,43,45,41,48,43]
melody=[[76,72,74,69,72],[72,69,67,69,72],[76,79,76,74,72],[74,71,67,69,71],[81,76,74,72,76],[77,72,69,72,74],[79,76,72,74,76],[74,71,69,67,71]]
for bar in range(32):
 root=roots[bar%8];minor=bar%8 in [0,4];third=3 if minor else 4
 t=np.arange(round(4.15*BEAT*SR))/SR
 pad=np.zeros(len(t))
 for note in [root+12,root+12+third,root+19,root+26]:
  for detune in [-.11,0,.09]:
   f=hz(note+detune)
   pad+=sum(np.sin(2*np.pi*f*k*t+.17*k)/(k**1.7) for k in range(1,7))/12
 pad*=env(len(t),.18,.35)
 place(pad,bar*4*BEAT,.17,(-.2 if bar%2 else .2))
 # Warm, syncopated bass with a quick analogue-style attack.
 for pos in [0,.75,1.5,2,2.75,3.5]:
  length=.33*BEAT;t=np.arange(round(length*SR))/SR;f=hz(root+(12 if pos==3.5 else 0))
  bass=(np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t)+.1*np.sin(6*np.pi*f*t))*np.exp(-t*4)*env(len(t),.004,.025)
  place(bass,(bar*4+pos)*BEAT,.25)
 # Drum machine: punchy kick, original noise snare, closed/open hats.
 for beat in range(4):
  t=np.arange(round(.31*SR))/SR;freq=47+85*np.exp(-t*42);phase=2*np.pi*np.cumsum(freq)/SR;kick=np.sin(phase)*np.exp(-t*16)+rng.normal(0,.025,len(t))*np.exp(-t*180)
  place(kick,(bar*4+beat)*BEAT,.42)
  if beat%2:
   t=np.arange(round(.19*SR))/SR;noise=rng.normal(0,1,len(t));snare=(.46*np.diff(noise,prepend=0)+.28*np.sin(2*np.pi*185*t))*np.exp(-t*24)
   place(snare,(bar*4+beat)*BEAT,.19,.08)
 for eighth in range(8):
  t=np.arange(round((.16 if eighth==7 else .075)*SR))/SR;noise=rng.normal(0,1,len(t));hat=np.diff(noise,prepend=0)*np.exp(-t*(30 if eighth==7 else 85))
  place(hat,(bar*4+eighth/2)*BEAT,.028 if eighth%2 else .021,.32)
 # Soft electric keys and a stereo-delayed lead enter as a full musical phrase.
 if bar%8>=2 or bar>=8:
  for i,pos in enumerate([.5,1.25,1.75,2.5,3.25]):
   note=melody[bar%8][i];t=np.arange(round(.48*SR))/SR;f=hz(note)
   lead=(np.sin(2*np.pi*f*t+.6*np.sin(2*np.pi*f*2*t)*np.exp(-t*7))+.18*np.sin(2*np.pi*f*2*t))*np.exp(-t*5)*env(len(t),.009,.07)
   place(lead,(bar*4+pos)*BEAT,.10,-.18)
   place(lead,(bar*4+pos+.75)*BEAT,.028,.4)
# Restrained room reflections and soft mastering.
for delay,gain in [(.067,.06),(.113,.04),(.178,.025)]:
 mix+=np.roll(mix,round(delay*SR),axis=0)*gain
mix=np.tanh(mix*1.15);mix*=.87/max(.01,np.max(np.abs(mix)))
# The oscillator phases already resolve at the boundary; a short fade removes edge clicks.
fade=round(.008*SR);mix[:fade]*=np.linspace(0,1,fade)[:,None];mix[-fade:]*=np.linspace(1,0,fade)[:,None]
out=ROOT/'src/game-assets';out.mkdir(exist_ok=True)
wavepath=ROOT/'scripts/showcase-sources/design-city/design-city-after-hours.wav'
with wave.open(str(wavepath),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
ff=ROOT/'../../tmp/video-reference/deps/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe'
subprocess.run([str(ff),'-y','-v','error','-i',str(wavepath),'-c:a','libmp3lame','-b:a','160k',str(out/'after-hours.mp3')],check=True)
print({'seconds':round(DURATION,3),'peak':round(float(np.max(abs(mix))),3),'rms':round(float(np.sqrt(np.mean(mix**2))),3),'bytes':(out/'after-hours.mp3').stat().st_size})
