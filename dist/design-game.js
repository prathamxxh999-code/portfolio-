import {createRecords} from './design-game-records.js';
import {createGameAudio} from './design-game-audio.js';
import {gameView} from './design-game-view.js';
import {missions,valetPieces} from './design-game-missions.js';
import {renderStage,showRepair} from './design-game-stage.js';
export function createDesignGame(root,{onQuit}={}){
  const content=root.querySelector('.dg-content');content.innerHTML=gameView;content.dataset.view='menu';
  const $=selector=>content.querySelector(selector),all=selector=>[...content.querySelectorAll(selector)];
  const records=createRecords(),audio=createGameAudio(content),grid=$('.dg-grid'),feedback=$('.dc-feedback');
  const clock=$('[data-game-time]'),cash=$('[data-game-score]');
  let view='menu',mode='repair',rankMode='repair',visible=false,playing=false,started=false,remaining=30000,endAt=0,timer=0,score=0,tiles=[],storyTimer=0,storyEpoch=0,pendingDelete=null,runSaved=false,debt=6,step=0,parked=new Set(),selected=null,transitioning=false,advanceTimer=0,roundEpoch=0,rankPage=0,historyPage=0;
  function storageStatus(){$('.dc-storage-note').hidden=records.persistent;}
  function soundStatus(){all('[data-dc="sound"]').forEach(b=>{b.textContent=audio.enabled?'sound on':'sound off';b.setAttribute('aria-pressed',String(audio.enabled));});}
  audio.set(records.sound);soundStatus();storageStatus();
  function cancelStory(){clearTimeout(storyTimer);storyTimer=0;storyEpoch++;}
  function focusFirst(){const panel=$(`[data-view="${view}"]`);const target=view==='name'?$('.dc-name-form input'):panel?.querySelector('button:not([hidden]),input,a');target?.focus({preventScroll:true});}
  function setView(next){
    if(next!=='story'){cancelStory();$('.dc-story-video')?.pause();}view=next;content.dataset.view=next;
    all('.dc-panel').forEach(p=>p.hidden=p.dataset.view!==next);
    const setup=$('.dc-setup-video');if(visible&&!document.hidden&&['name','select'].includes(next)&&!matchMedia('(prefers-reduced-motion:reduce)').matches)setup.play().catch(()=>{});else setup.pause();
    $('[data-dc-section]').textContent=({menu:'main menu',name:'new game',select:'choose a mission',story:'loading',play:'the assignment',result:'mission complete',scores:'high scores',profile:'player file',options:'options',help:'how to play'})[next];
    $('[data-dc="resume"]').hidden=!started||remaining<=0;
    content.scrollTop=0;if(visible)focusFirst();
  }
  function update(){
    const second=Math.ceil(remaining/1000);clock.textContent=`00:${String(second).padStart(2,'0')}`;cash.textContent=String(score).padStart(6,'0');
    $('[data-dc-stars]').textContent='★'.repeat(debt)+'☆'.repeat(6-debt);$('[data-dc-stars]').setAttribute('aria-label',`${debt} of 6 design debt stars`);
    $('[data-dc-level]').textContent=`${debt} star${debt===1?'':'s'} to clear`;content.classList.toggle('dc-time-low',second<=5&&playing);
    const pause=$('.dc-assignment-title [data-dc="pause"]');pause.textContent=playing?'pause':'resume';$('.dc-pause-cover').hidden=playing;
  }
  function stopTimer(){clearInterval(timer);timer=0;}
  function finish(passed=false){
    if(!started||runSaved)return;
    playing=false;stopTimer();clearTimeout(advanceTimer);transitioning=false;runSaved=true;
    if(passed)score+=Math.ceil(remaining/1000)*10;remaining=0;
    records.addRun(mode,score);storageStatus();update();
    $('[data-dc-result-player]').textContent=`${records.active?.name||'Player'} · ${missions[mode].name}`;
    $('[data-dc-result-title]').innerHTML=passed?'mission<br>passed.':'busted.';
    content.classList.toggle('dc-mission-failed',!passed);$('[data-dc-final-score]').textContent=score;
    $('[data-dc-result-copy]').textContent=passed?'Design debt cleared. Respect earned, plus a bonus for the time you saved.':`The clock caught you with ${debt} design-debt star${debt===1?'':'s'}. Your respect is saved. Take another run.`;
    $('.dc-save-status').textContent=records.persistent?'Record saved on this device.':'Record kept for this session only.';
    setView('result');audio.effect(passed?'finish':'wrong');
  }
  function tick(){remaining=Math.max(0,endAt-performance.now());if(remaining===0)finish();else update();}
  function pause(){
    if(!playing)return;remaining=Math.max(0,endAt-performance.now());playing=false;stopTimer();
    if(remaining<=0){finish();return;}
    tiles.forEach(t=>t.disabled=true);feedback.textContent='Paused. Your clock is stopped.';update();
  }
  function board(){
    tiles=renderStage(grid,{mode,step,parked,selected,playing:playing&&!transitioning,onChoose:choose,onSelect:id=>{if(!playing||transitioning)return;selected=id;board();feedback.textContent='Now choose its matching slot.';grid.querySelector('[data-slot]:not(:disabled)')?.focus({preventScroll:true});},onPark:park});
  }
  function wrong(){
    audio.effect('wrong');score=Math.max(0,score-100);endAt-=2000;
    if(mode==='valet'){const last=[...parked].pop();if(last)parked.delete(last);debt=6-parked.size;board();}
    else debt=Math.min(6,debt+1);
    tick();if(playing)feedback.textContent='Design debt added. −100 respect, −2 seconds. Try again.';
  }
  function choose(correct,copy){
    if(!playing||transitioning)return;tick();if(!playing)return;if(!correct){wrong();return;}
    score+=100;debt=Math.max(0,debt-1);step++;audio.effect('correct');feedback.textContent=copy+' +100 respect.';
    transitioning=true;tiles.forEach(t=>t.disabled=true);showRepair(grid);update();const epoch=roundEpoch;
    advanceTimer=setTimeout(()=>{advanceTimer=0;if(epoch!==roundEpoch||runSaved)return;transitioning=false;if(debt===0)finish(true);else board();},650);
  }
  function park(slot,dragged){
    if(!playing||transitioning)return;tick();if(!playing)return;const piece=dragged||selected;
    if(!valetPieces.some(p=>p.id===piece)||parked.has(piece)||parked.has(slot)){feedback.textContent='Choose a component first, then its slot.';return;}
    if(piece!==slot){wrong();return;}
    parked.add(piece);selected=null;score+=100;debt=6-parked.size;audio.effect('correct');feedback.textContent='Parked perfectly. +100 respect.';update();if(debt===0)finish(true);else board();
  }
  function resume(){
    if(!visible||document.hidden||!started||remaining<=0)return;
    $('[data-dc-player]').textContent=records.active?.name||'Player';
    playing=true;endAt=performance.now()+remaining;board();stopTimer();timer=setInterval(tick,100);
    setView('play');feedback.textContent=missions[mode].description;update();grid.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  }
  function startRound(){
    if(!visible)return;cancelStory();clearTimeout(advanceTimer);roundEpoch++;started=true;runSaved=false;score=0;debt=6;step=0;parked=new Set();selected=null;transitioning=false;remaining=missions[mode].duration;playing=true;endAt=performance.now()+remaining;
    $('[data-dc-player]').textContent=records.active?.name||'Player';$('[data-dc-mode]').textContent=missions[mode].name;
    $('[data-dc-mission]').textContent=missions[mode].goal;$('[data-dc-description]').textContent=missions[mode].description;
    board();setView('play');stopTimer();timer=setInterval(tick,100);feedback.textContent='Six stars of design debt. Clear them all.';update();grid.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  }
  function story(){
    pause();cancelStory();setView('story');$('.dc-story-caption .dc-overline').textContent=missions[mode].name;$('.dc-story-caption h2 span').textContent=missions[mode].story;const storyVideo=$('.dc-story-video');storyVideo.currentTime=0;if(!matchMedia('(prefers-reduced-motion:reduce)').matches)storyVideo.play().catch(()=>{});const epoch=storyEpoch;storyTimer=setTimeout(()=>{if(epoch===storyEpoch&&visible&&!document.hidden)startRound();},3800);
  }
  function mainMenu(){pause();setView('menu');}
  function nameEntry(){
    pause();started=false;remaining=missions[mode].duration;score=0;setView('name');const input=$('.dc-name-form input');input.value=records.active?.name||'';$('.dc-form-error').textContent='';
    const list=$('[data-dc-players]');list.replaceChildren();$('.dc-existing').hidden=!records.players.length;
    records.players.forEach(p=>{const button=document.createElement('button');button.type='button';button.className='dc-player-chip';button.textContent=p.name;button.addEventListener('click',()=>{records.select(p.id);input.value=p.name;input.focus();storageStatus();});list.append(button);});
    input.focus({preventScroll:true});
  }
  function pageSize(reserve,rowHeight){return Math.max(1,Math.min(8,Math.floor((content.clientHeight-$('.dc-header').getBoundingClientRect().height-reserve)/rowHeight)));}
  function pager(count,page,size,onPage){
    const pages=Math.max(1,Math.ceil(count/size)),bar=document.createElement('div');bar.className='dc-record-pager';
    const previous=document.createElement('button');previous.type='button';previous.className='dc-text-button';previous.textContent='previous';previous.disabled=page===0;previous.addEventListener('click',()=>onPage(page-1));
    const label=document.createElement('span');label.textContent=`${page+1} / ${pages}`;
    const next=document.createElement('button');next.type='button';next.className='dc-text-button';next.textContent='next';next.disabled=page>=pages-1;next.addEventListener('click',()=>onPage(page+1));bar.append(previous,label,next);return bar;
  }
  function rankTable(){
    const stats=records.stats();$('[data-dc-record-stats]').textContent=`${stats.players} player${stats.players===1?'':'s'} · ${stats.runs} saved round${stats.runs===1?'':'s'} on this device`;
    all('[data-rank-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rankMode===rankMode)));
    const region=$('.dc-ranking');region.replaceChildren();const rows=records.rankings(rankMode);
    if(!rows.length){const p=document.createElement('p');p.textContent='No records yet. The top spot is yours to take.';region.append(p);return;}
    const table=document.createElement('table');const head=document.createElement('thead');head.innerHTML='<tr><th scope="col">rank</th><th scope="col">player</th><th scope="col">best</th><th scope="col">runs</th></tr>';table.append(head);const body=document.createElement('tbody');
    const size=pageSize(340,37);rankPage=Math.min(rankPage,Math.max(0,Math.ceil(rows.length/size)-1));
    rows.slice(rankPage*size,(rankPage+1)*size).forEach((p,i)=>{i+=rankPage*size;const row=document.createElement('tr');if(p.id===records.active?.id)row.className='dc-own-rank';[String(i+1).padStart(2,'0'),p.name,String(p.best),String(p.plays)].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell);});body.append(row);});table.append(body);region.append(table,pager(rows.length,rankPage,size,page=>{rankPage=page;rankTable();}));
  }
  function scores(){pause();rankTable();setView('scores');}
  function profile(){
    pause();if(!records.active){nameEntry();return;}setView('profile');$('.dc-rename-form input').value=records.active.name;$('.dc-profile-status').textContent='';$('.dc-confirm').hidden=true;pendingDelete=null;
    const region=$('.dc-history');region.replaceChildren();const rows=records.history();const heading=document.createElement('h3');heading.textContent=`recent runs · ${rows.length}`;region.append(heading);
    if(!rows.length){const p=document.createElement('p');p.textContent='Your first mission is waiting.';region.append(p);}
    const size=pageSize(345,55);historyPage=Math.min(historyPage,Math.max(0,Math.ceil(rows.length/size)-1));
    rows.slice(historyPage*size,(historyPage+1)*size).forEach(r=>{const row=document.createElement('div');row.className='dc-history-row';const text=document.createElement('span');text.textContent=`${r.score} respect · ${missions[r.mode]?.short||r.mode}`;const date=document.createElement('small');date.textContent=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(r.date);const button=document.createElement('button');button.type='button';button.textContent='delete';button.setAttribute('aria-label',`Delete ${r.score}-point ${r.mode} result from ${date.textContent}`);button.className='dc-text-button';button.addEventListener('click',()=>confirmDelete({kind:'run',id:r.id,playerId:r.playerId},'Delete this game result? This cannot be undone.'));row.append(text,date,button);region.append(row);});
    if(rows.length)region.append(pager(rows.length,historyPage,size,page=>{historyPage=page;profile();}));
  }
  function confirmDelete(target,copy){pendingDelete=target;$('.dc-confirm-copy').textContent=copy;$('.dc-confirm').hidden=false;$('[data-dc="cancel-delete"]').focus({preventScroll:true});$('.dc-confirm').scrollIntoView({block:'nearest'});}
  function reset(){pause();cancelStory();stopTimer();clearTimeout(advanceTimer);roundEpoch++;started=false;playing=false;score=0;remaining=30000;tiles=[];runSaved=false;setView('menu');}
  $('.dc-name-form').addEventListener('submit',event=>{event.preventDefault();try{records.create($('.dc-name-form input').value);storageStatus();setView('select');}catch(error){$('.dc-form-error').textContent=error.message;}});
  $('.dc-rename-form').addEventListener('submit',event=>{event.preventDefault();try{records.rename(records.active?.id,$('.dc-rename-form input').value);storageStatus();$('.dc-profile-status').textContent='Name updated on this device.';}catch(error){$('.dc-profile-status').textContent=error.message;}});
  content.addEventListener('click',event=>{
    const button=event.target.closest('[data-dc]');if(!button)return;event.preventDefault();audio.unlock();const action=button.dataset.dc;
    if(action!=='sound')audio.effect('select');
    if(action==='sound'){audio.set(!audio.enabled);records.setSound(audio.enabled);soundStatus();storageStatus();}
    else if(action==='new'||action==='switch'||action==='name-back')nameEntry();
    else if(action==='menu')mainMenu();else if(action==='resume')resume();
    else if(action==='pause'){if(playing)pause();else resume();}
    else if(action==='skip')startRound();else if(action==='again'){if(records.active)startRound();else nameEntry();}
    else if(action==='scores')scores();else if(action==='profile')profile();
    else if(action==='options'||action==='help'){pause();setView(action);}
    else if(action==='quit'){pause();cancelStory();onQuit?.();}
    else if(action==='delete-player'&&records.active)confirmDelete({kind:'player',id:records.active.id},`Delete ${records.active.name} and all their game records on this device? This cannot be undone.`);
    else if(action==='cancel-delete'){pendingDelete=null;$('.dc-confirm').hidden=true;}
    else if(action==='confirm-delete'&&pendingDelete){const target=pendingDelete;pendingDelete=null;if(target.kind==='player'){records.remove(target.id);reset();nameEntry();}else{records.deleteRun(target.id,target.playerId);profile();}storageStatus();}
  });
  content.addEventListener('pointerover',event=>{const button=event.target.closest('button');if(button&&!button.classList.contains('dg-tile')&&!button.contains(event.relatedTarget))audio.effect('hover');});
  content.addEventListener('pointerdown',()=>audio.unlock());
  all('[data-start-mission]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.startMission;all('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));audio.effect('select');story();}));
  all('[data-mode]').forEach(button=>button.addEventListener('click',()=>{if(mode!==button.dataset.mode){pause();mode=button.dataset.mode;clearTimeout(advanceTimer);roundEpoch++;started=false;remaining=missions[mode].duration;}all('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));audio.effect('select');}));
  all('[data-rank-mode]').forEach(button=>button.addEventListener('click',()=>{rankMode=button.dataset.rankMode;rankPage=0;rankTable();audio.effect('select');}));
  content.addEventListener('keydown',event=>{
    audio.unlock();if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(view==='menu')onQuit?.();else if(view==='story'){cancelStory();mainMenu();}else mainMenu();return;}
    if(view==='menu'&&['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();const items=all('.dc-menu nav button').filter(b=>!b.hidden),i=items.indexOf(document.activeElement);items[event.key==='Home'?0:event.key==='End'?items.length-1:(i+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();audio.effect('hover');}
  });
  window.addEventListener('resize',()=>{if(view==='scores')rankTable();else if(view==='profile')profile();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){$('.dc-setup-video')?.pause();pause();if(view==='story'){cancelStory();mainMenu();}audio.activate(false);}else if(visible){audio.activate(true);if(['name','select'].includes(view)&&!matchMedia('(prefers-reduced-motion:reduce)').matches)$('.dc-setup-video').play().catch(()=>{});}});
  return {show(){visible=true;audio.activate(true);mainMenu();},hide(){visible=false;$('.dc-setup-video')?.pause();$('.dc-story-video')?.pause();pause();if(view==='story'){cancelStory();setView('menu');}audio.activate(false);},reset};
}
