// Original, synthesized 1980s-inspired loop. No samples or third-party soundtrack.
export function createGameAudio(root){
  let context,master,enabled=false,active=false,generation=0,music;
  const nodes=new Set();
  function init(){try{context ||= new (globalThis.AudioContext||globalThis.webkitAudioContext)();if(!master){master=context.createGain();master.gain.value=.12;master.connect(context.destination);}return true;}catch{return false;}}
  function tone(midi,length=.16,type='triangle',gain=.15,offset=0){
    if(!enabled||!active||!context||context.state!=='running')return;
    const at=context.currentTime+offset,osc=context.createOscillator(),env=context.createGain();
    osc.type=type;osc.frequency.value=440*2**((midi-69)/12);env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(gain,at+.009);env.gain.exponentialRampToValueAtTime(.0001,at+length);
    osc.connect(env);env.connect(master);osc.start(at);osc.stop(at+length+.02);nodes.add(osc);osc.onended=()=>{nodes.delete(osc);osc.disconnect();env.disconnect();};
  }
  function stop(){music?.pause();for(const osc of nodes){try{osc.stop();}catch{}}nodes.clear();}
  async function sync(){
    const run=++generation;stop();
    if(enabled&&active){
      if(!music){music=new Audio(new URL('./game-assets/after-hours.mp3',import.meta.url).href);music.loop=true;music.preload='metadata';music.volume=.36;music.dataset.gameBgm='original';music.hidden=true;root?.append(music);}
      if(init())try{await context.resume();}catch{}
      if(run===generation&&enabled&&active)try{await music.play();}catch{}
      if(run!==generation||!enabled||!active)music.pause();
    }else if(context?.state==='running')context.suspend().catch(()=>{});
  }
  return {get enabled(){return enabled;},set(value){enabled=!!value;void sync();},activate(value){active=!!value;void sync();},unlock(){if(enabled&&active&&(context?.state==='suspended'||music?.paused))void sync();},effect(kind){if(kind==='hover')tone(76,.035,'sine',.1);else if(kind==='wrong'){tone(42,.14,'sawtooth',.1);tone(40,.16,'triangle',.12,.05);}else if(kind==='correct'){tone(76,.09,'triangle',.16);tone(83,.15,'sine',.15,.07);}else if(kind==='finish'){[69,73,76,81].forEach((n,i)=>tone(n,.3,'triangle',.16,i*.09));}else tone(69,.09,'triangle',.13);},stop};
}
