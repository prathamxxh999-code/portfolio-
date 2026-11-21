import { createDesktop } from './pc-desktop.js';
import { cameraMotion } from './camera-motion.js';

const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{value=clamp(value);return value*value*(3-2*value);};
const between=(time,from,to)=>ease((time-from)/(to-from));
// Screen coordinates in the 1920 x 1080 room master. The PC is a fixed plate.
const SOURCE={width:1920,height:1080,glassWidth:455,glassHeight:324,caseWidth:519,glass:[[738,300],[1193,300],[1193,624],[738,624]]};

export function createRetroIntro(splash,{onEnter,onRestart,motion}={}){
  const world=splash.querySelector('.retro-world'),video=splash.querySelector('.retro-video');
  const frameArt=splash.querySelector('.retro-frame-art');
  const screen=splash.querySelector('.retro-screen'),greeting=splash.querySelector('.greeting-window');
  const welcome=splash.querySelector('.retro-welcome'),typed=splash.querySelector('.retro-typed');
  const button=splash.querySelector('.retro-enter');
  if(!world||!video||!screen||!welcome||!button)return null;
  if(matchMedia('(max-width:650px)').matches||navigator.connection?.saveData){video.src='./intro/room-ambient-centred-mobile.mp4';video.load();}
  const message='Welcome to my\nportfolio.';
  let width=1,height=1,worldWidth=1,worldHeight=1,centerX=0,centerY=0,heldX=0,heldY=0;
  let closeScale=1.3,cameraScale=1.02,count=-1,phase='',failed=false;
  let ratio=1,localX=0,localY=0;
  let expanded=false,lastLayout='',entryRun=0,entryTimer=0,entryResolve=null,entryPromise=null;
  let welcomeRun=0,welcomeMotion=null,typingTimer=0,finishTyping=null;
  // The live OS switches to native viewport size behind an opaque black
  // curtain. Only the blue Windows frame remains after folder entry.
  const backdrop=document.createElement('div'),surface=document.createElement('div'),curtain=document.createElement('div');
  backdrop.className='pc-focus-backdrop';surface.className='pc-focus-surface';curtain.className='pc-entry-curtain';
  for(const node of [backdrop,curtain])node.setAttribute('aria-hidden','true');
  curtain.hidden=true;
  surface.append(screen);splash.append(backdrop,surface,curtain);
  const desktop=createDesktop(splash,{onModeChange:next=>setPhase(next),onOpen:openScreen,onRestart});
  const poster=new Image();poster.src='./intro/room-poster.webp';
  function setPhase(next){if(next!==phase){phase=next;splash.dataset.retroPhase=next;}}
  function play(){if(splash.open&&!document.hidden&&!motion?.matches&&!expanded&&!welcomeMotion)video.play().catch(()=>{});else video.pause();}
  function roomRect(scale){
    return {left:centerX+heldX+(SOURCE.glass[0][0]*ratio-localX)*scale,top:centerY+heldY+(SOURCE.glass[0][1]*ratio-localY)*scale,width:SOURCE.glassWidth*ratio*scale,height:SOURCE.glassHeight*ratio*scale};
  }
  function viewportRect(){return {left:0,top:0,width,height};}
  function camera(scale){
    cameraScale=scale;
    world.style.transform=`translate3d(${heldX.toFixed(2)}px,${heldY.toFixed(2)}px,0) scale(${scale.toFixed(5)})`;
    const rect=expanded?viewportRect():roomRect(closeScale);
    const key=[expanded,rect.left,rect.top,rect.width,rect.height].join(':');
    if(key!==lastLayout){
      lastLayout=key;
      Object.assign(screen.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,borderRadius:expanded?'0px':`${Math.min(rect.width,rect.height)*.022}px`});
      desktop.resize(rect.width,rect.height);
    }
    surface.style.transform='none';
    backdrop.style.opacity=expanded?1:0;
    world.style.visibility=expanded?'hidden':'visible';
  }
  function waitForEntry(duration,run){
    return new Promise(resolve=>{
      entryResolve=resolve;
      entryTimer=setTimeout(()=>{entryTimer=0;entryResolve=null;resolve(run===entryRun);},duration);
    });
  }
  function cancelEntry(){
    entryRun++;clearTimeout(entryTimer);entryTimer=0;
    const resolve=entryResolve;entryResolve=null;entryPromise=null;
    curtain.hidden=true;resolve?.(false);
  }
  function openScreen(){
    if(entryPromise)return entryPromise;
    const run=++entryRun;
    curtain.hidden=false;setPhase('blackout');
    video.pause();
    entryPromise=(async()=>{
      if(!await waitForEntry(180,run))return false;
      expanded=true;camera(closeScale);setPhase('loading');curtain.hidden=true;
      // Keep the Windows loader readable, including for cached résumé/page
      // openings. The app remains hidden until this minimum hold is over.
      return waitForEntry(500,run);
    })().finally(()=>{if(run===entryRun){entryPromise=null;curtain.hidden=true;}});
    return entryPromise;
  }
  function cancelWelcome(){
    welcomeRun++;welcomeMotion?.cancel();welcomeMotion=null;
    clearTimeout(typingTimer);finishTyping?.(false);finishTyping=null;
  }
  async function revealWelcome(){
    cancelWelcome();const run=welcomeRun;
    setPhase('welcome');
    // The room stays completely stationary until a desktop folder is opened.
    welcomeMotion=cameraMotion([
      {node:greeting,from:{opacity:'1'},to:{opacity:'0'}},
      {node:welcome,from:{opacity:'0'},to:{opacity:'1'}},
    ],{duration:260,easing:'ease-in-out'});
    if(!await welcomeMotion.finished||run!==welcomeRun)return false;
    welcomeMotion=null;camera(closeScale);greeting.style.opacity='0';greeting.hidden=true;
    welcome.style.opacity='1';setPhase('typing');play();
    return new Promise(resolve=>{
      finishTyping=resolve;
      function type(){
        if(run!==welcomeRun){resolve(false);return;}
        count++;typed.textContent=message.slice(0,count);
        if(count<message.length){typingTimer=setTimeout(type,57);return;}
        finishTyping=null;resolve(true);
      }
      count=0;type();
    });
  }
  function resize(){
    width=splash.clientWidth||innerWidth;height=splash.clientHeight||innerHeight;
    worldWidth=Math.max(width,height*16/9);worldHeight=worldWidth*9/16;
    ratio=worldWidth/SOURCE.width;
    if(frameArt)frameArt.style.transform=`scale(${ratio})`;
    const left=(width-worldWidth)/2,top=(height-worldHeight)/2;
    const points=SOURCE.glass.map(([x,y])=>[x*ratio,y*ratio]);
    localX=points.reduce((n,p)=>n+p[0]/4,0);localY=points.reduce((n,p)=>n+p[1]/4,0);
    centerX=left+localX;centerY=top+localY;
    // One fixed room composition throughout Hello, welcome and the desktop.
    closeScale=width<=650?Math.min(1.02,(width-16)/(SOURCE.caseWidth*ratio)):1.02;
    closeScale=Math.max(.35,closeScale);
    heldX=width/2-centerX;heldY=height*.44-centerY;
    Object.assign(world.style,{width:`${worldWidth}px`,height:`${worldHeight}px`,left:`${left}px`,top:`${top}px`,transformOrigin:`${localX}px ${localY}px`});
    const physicalWidth=SOURCE.glassWidth*ratio*closeScale;
    welcome.style.fontSize=`${Math.min(29,Math.max(18,physicalWidth*.045))}px`;
    Object.assign(button.style,{fontSize:`${Math.min(23,Math.max(16,physicalWidth*.036))}px`,minHeight:'44px',width:'auto',padding:'8px 0'});
    if(welcomeMotion)welcomeMotion.finish();
    if(phase==='desktop'&&(width<=650||(width<=950&&height<=500)))expanded=true;
    camera(closeScale);
  }
  function update(milliseconds){
    if(cameraScale!==closeScale||!lastLayout)camera(closeScale);
    screen.style.setProperty('--crt-power',between(milliseconds,100,600));
    setPhase(milliseconds<550?'wide':'greeting');
  }
  function wait(){camera(closeScale);setPhase('waiting');button.hidden=false;button.disabled=false;button.focus({preventScroll:true});}
  function beginEntry(){button.disabled=true;splash.setAttribute('aria-busy','true');setPhase('entering');}
  function enter(milliseconds){welcome.style.opacity=1-between(milliseconds,0,260);camera(closeScale);}
  function showDesktop(){
    cancelEntry();cancelWelcome();
    // On phones, keep the room for the intro and give the desktop native space.
    if(width<=650||(width<=950&&height<=500))expanded=true;
    camera(closeScale);greeting.hidden=true;welcome.hidden=true;button.hidden=true;
    screen.style.setProperty('--crt-power','1');splash.removeAttribute('aria-busy');desktop.show();play();
  }
  button.addEventListener('click',()=>{if(!button.disabled)onEnter?.();});
  splash.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&!event.repeat&&phase==='waiting'){event.preventDefault();onEnter?.();}
  });
  document.addEventListener('visibilitychange',play);
  video.addEventListener('error',()=>video.pause());
  resize();
  return {
    persistent:true,greetingEndAt:5400,entryDuration:350,greetingStart:550,
    ready:Promise.race([poster.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Room poster unavailable')),3000))]).then(()=>true).catch(()=>{failed=true;splash.classList.add('retro-unavailable');return false;}),
    resize,update,wait,revealWelcome,beginEntry,enter,showDesktop,start:play,
    wordScale:()=>1,logicalSize:()=>failed?null:{width:1280,height:1000},
    escape(){showDesktop();},
    reset(){cancelWelcome();cancelEntry();expanded=false;lastLayout='';count=-1;typed.textContent='';phase='';desktop.hide();greeting.hidden=false;welcome.hidden=false;welcome.style.opacity='0';button.hidden=true;button.disabled=true;greeting.style.opacity=1;cameraScale=1.02;splash.removeAttribute('aria-busy');resize();update(0);video.currentTime=0;},
    stop(){cancelEntry();video.pause();splash.removeAttribute('aria-busy');},
  };
}
