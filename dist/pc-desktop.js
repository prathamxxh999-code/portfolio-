export function createDesktop(splash, { onModeChange, onOpen, onClose, onRestart } = {}) {
  const root=splash.querySelector('.pc-os'), desktop=splash.querySelector('.pc-desktop');
  const folder=splash.querySelector('.pc-folder'), app=splash.querySelector('.pc-window');
  const resumeFolder=splash.querySelector('.pc-folder--resume'),resume=splash.querySelector('.pc-resume-window');
  const frame=splash.querySelector('.pc-portfolio-frame'), loading=splash.querySelector('.pc-loading');
  const task=splash.querySelector('.pc-task'), clock=splash.querySelector('.pc-clock');
  const boot=splash.querySelector('.pc-boot'),bootTitle=splash.querySelector('.pc-boot-title');
  const start=splash.querySelector('.pc-start'),menu=splash.querySelector('.pc-start-menu');
  const taskbar=splash.querySelector('.pc-taskbar');
  let loaded=false,started=false,mode='closed',opening=false,openRun=0;
  let clockTimer=0;
  function showBoot(visible){
    boot.hidden=!visible;
    for(const node of [desktop,app,resume,taskbar])node.style.visibility=visible?'hidden':'';
  }
  function updateClock(){
    clearTimeout(clockTimer);const now=new Date();
    const time=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(now);
    const date=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'}).format(now);
    clock.querySelector('.pc-clock-time').textContent=time;clock.querySelector('.pc-clock-date').textContent=date;
    clock.dateTime=now.toISOString();clock.title=`${date} · ${time}`;clock.setAttribute('aria-label',`${date}, ${time}`);
    if(!document.hidden)clockTimer=setTimeout(updateClock,60010-Date.now()%60000);
  }
  updateClock();document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(clockTimer);else updateClock();});
  function closeMenu(){menu.hidden=true;start.setAttribute('aria-expanded','false');}
  start.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;start.setAttribute('aria-expanded',String(open));if(open)menu.querySelector('[role="menuitem"]').focus();});
  menu.querySelector('.pc-restart').addEventListener('click',()=>{closeMenu();onRestart?.();});
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!start.contains(event.target))closeMenu();});
  document.addEventListener('keydown',event=>{
    if(menu.hidden)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeMenu();start.focus();}
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();const items=[...menu.querySelectorAll('[role="menuitem"]')],current=items.indexOf(document.activeElement);
      const next=event.key==='Home'?0:event.key==='End'?items.length-1:(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
      items[next].focus();
    }
  },true);

  function setMode(next){mode=next;root.dataset.mode=next;onModeChange?.(next);}
  function show(){
    closeMenu();start.disabled=false;
    const returning=(['portfolio','resume'].includes(mode)||opening)?onClose?.():null;
    const run=++openRun;opening=false;folder.disabled=Boolean(returning);resumeFolder.disabled=Boolean(returning);
    root.hidden=false;desktop.hidden=false;app.hidden=true;resume.hidden=true;task.hidden=true;showBoot(false);
    setMode('desktop');
    Promise.resolve(returning).then(()=>{if(run===openRun&&mode==='desktop'){folder.disabled=false;resumeFolder.disabled=false;folder.focus({preventScroll:true});}});
    updateClock();
  }
  function ready(){
    if(!started||loaded)return;
    loaded=true;loading.hidden=true;frame.setAttribute('aria-busy','false');
    if(mode==='portfolio'){showBoot(false);start.disabled=false;frame.focus({preventScroll:true});}
  }
  async function open(kind='portfolio'){
    if(opening||mode===kind)return;
    closeMenu();start.disabled=true;
    opening=true;folder.disabled=true;resumeFolder.disabled=true;const run=++openRun;
    bootTitle.textContent=kind==='resume'?'Opening Résumé':'Opening Portfolio';showBoot(true);
    // Keep app initialization and iframe layout off the zoom's critical path.
    const completed=await onOpen?.();
    if(run!==openRun||completed===false)return;
    if(kind==='portfolio'&&!started){
      loading.hidden=false;frame.setAttribute('aria-busy','true');started=true;
      const destination=new URL(location.href);destination.search='?pc-screen=1';destination.hash=/^#\/p\/\d+$/.test(location.hash)?location.hash:'';
      frame.src=destination.href;
    }
    root.hidden=false;desktop.hidden=true;app.hidden=kind!=='portfolio';resume.hidden=kind!=='resume';task.hidden=false;task.querySelector('span').textContent=kind==='resume'?'Résumé':'Portfolio';setMode(kind);
    showBoot(kind==='portfolio'&&!loaded);
    start.disabled=kind==='portfolio'&&!loaded;
    opening=false;folder.disabled=false;resumeFolder.disabled=false;
    if(kind==='portfolio'&&loaded)frame.focus({preventScroll:true});
    if(kind==='resume')resume.querySelector('.pc-resume-download').focus({preventScroll:true});
  }
  folder.addEventListener('click',()=>open('portfolio'));
  resumeFolder.addEventListener('click',()=>open('resume'));
  task.addEventListener('click',()=>open(mode==='resume'?'resume':'portfolio'));
  splash.querySelector('.pc-window-close').addEventListener('click',show);
  splash.querySelector('.pc-resume-close').addEventListener('click',show);
  let zoom=100;
  splash.querySelectorAll('[data-resume-zoom]').forEach(button=>button.addEventListener('click',()=>{
    zoom=Math.max(100,Math.min(200,zoom+Number(button.dataset.resumeZoom)));
    resume.style.setProperty('--resume-zoom',`${zoom}%`);
    resume.style.setProperty('--resume-scale',zoom/100);
    splash.querySelector('.pc-resume-zoom').textContent=`${zoom}%`;
    splash.querySelector('[data-resume-zoom="-25"]').disabled=zoom===100;
    splash.querySelector('[data-resume-zoom="25"]').disabled=zoom===200;
  }));
  frame.addEventListener('load',ready);
  window.addEventListener('message',event=>{
    if(event.origin===location.origin&&event.source===frame.contentWindow&&event.data?.type==='pc:ready')ready();
    if(event.origin===location.origin&&event.source===frame.contentWindow&&event.data?.type==='pc:desktop')show();
  });
  return {
    show,open,
    get mode(){return mode;},
    resize(width,height){
      // Match the glass in CSS pixels, without a second nested scale.
      width=Math.max(1,width);height=Math.max(1,height);
      root.classList.toggle('pc-compact',width<600||height<360);
      root.classList.toggle('pc-narrow',width<320);
      root.classList.toggle('pc-short',height<250);
      root.classList.toggle('pc-mini',height<180);
      root.style.width=`${width}px`;root.style.height=`${height}px`;
    },
    hide(){closeMenu();openRun++;opening=false;loaded=false;started=false;root.hidden=true;mode='closed';showBoot(false);app.hidden=true;resume.hidden=true;frame.removeAttribute('src');start.disabled=false;},
  };
}
