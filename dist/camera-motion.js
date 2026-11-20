const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));

// Promote once, paint once, then let one compositor clock move every layer.
// Camera playback never depends on the greeting canvas's JavaScript clock.
export function cameraMotion(definitions,{duration=1850,easing='cubic-bezier(.4,0,.2,1)',diagnostic=null}={}){
  let cancelled=false,animations=[],probe=0,previous=0,gaps=[],resolveDone;
  const finished=new Promise(resolve=>{resolveDone=resolve;});
  for(const {node,from} of definitions){Object.assign(node.style,from);node.style.willChange=Object.keys(from).join(',');}
  function end(success){
    if(cancelled)return;
    cancelled=true;cancelAnimationFrame(probe);
    if(success)for(const {node,to} of definitions)Object.assign(node.style,to);
    animations.forEach(animation=>animation.cancel());
    for(const {node} of definitions)node.style.willChange='auto';
    if(diagnostic&&gaps.length){
      const ordered=[...gaps].sort((a,b)=>a-b);
      diagnostic.node.dataset[diagnostic.key]=JSON.stringify({frames:gaps.length,medianMs:+ordered[Math.floor(ordered.length/2)].toFixed(1),p95Ms:+ordered[Math.floor(ordered.length*.95)].toFixed(1),over32ms:gaps.filter(gap=>gap>32).length});
    }
    resolveDone(success);
  }
  (async()=>{
    await nextFrame();await nextFrame();
    if(cancelled)return;
    const start=document.timeline.currentTime;
    animations=definitions.map(({node,from,to,options={}})=>{
      const animation=node.animate([from,to],{duration,easing,fill:'both',...options});
      animation.startTime=start;
      return animation;
    });
    if(diagnostic){
      const sample=now=>{if(cancelled)return;if(previous)gaps.push(now-previous);previous=now;probe=requestAnimationFrame(sample);};
      probe=requestAnimationFrame(sample);
    }
    try{await Promise.all(animations.map(animation=>animation.finished));end(true);}catch{end(false);}
  })();
  return {finished,cancel:()=>end(false),finish:()=>end(true)};
}

