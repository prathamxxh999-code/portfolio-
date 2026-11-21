// Original, synthesized 1980s-inspired loop. No samples or third-party soundtrack.
export function createGameAudio(){
  let context,master,sequence=0,step=0,enabled=false,active=false,generation=0;
  const nodes=new Set(),notes=[45,45,52,55,43,43,50,55,41,41,48,53,43,50,55,52];
  function init(){try{context ||= new (globalThis.AudioContext||globalThis.webkitAudioContext)();if(!master){master=context.createGain();master.gain.value=.12;master.connect(context.destination);}return true;}catch{return false;}}
  function tone(midi,length=.16,type='triangle',gain=.15,offset=0){
    if(!enabled||!active||!context||context.state!=='running')return;
    const at=context.currentTime+offset,osc=context.createOscillator(),env=context.createGain();
    osc.type=type;osc.frequency.value=440*2**((midi-69)/12);env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(gain,at+.009);env.gain.exponentialRampToValueAtTime(.0001,at+length);
    osc.connect(env);env.connect(master);osc.start(at);osc.stop(at+length+.02);nodes.add(osc);osc.onended=()=>{nodes.delete(osc);osc.disconnect();env.disconnect();};
  }
  function beat(){const n=notes[step%notes.length];tone(n,.25,'triangle',.28);if(step%2===0){tone(n+24,.22,'sine',.16);tone(n+31,.3,'sine',.05,.08);}step++;}
  function stop(){clearInterval(sequence);sequence=0;for(const osc of nodes){try{osc.stop();}catch{}}nodes.clear();}
  async function sync(){const run=++generation;stop();if(enabled&&active&&init()){try{await context.resume();}catch{}if(run===generation&&enabled&&active&&context.state==='running'){beat();sequence=setInterval(beat,375);}}else if(context?.state==='running')context.suspend().catch(()=>{});}
  return {get enabled(){return enabled;},set(value){enabled=!!value;void sync();},activate(value){active=!!value;void sync();},unlock(){if(enabled&&active&&context?.state==='suspended')void sync();},effect(kind){if(kind==='hover')tone(76,.035,'sine',.1);else if(kind==='wrong'){tone(42,.14,'sawtooth',.1);tone(40,.16,'triangle',.12,.05);}else if(kind==='correct'){tone(76,.09,'triangle',.16);tone(83,.15,'sine',.15,.07);}else if(kind==='finish'){[69,73,76,81].forEach((n,i)=>tone(n,.3,'triangle',.16,i*.09));}else tone(69,.09,'triangle',.13);},stop};
}
