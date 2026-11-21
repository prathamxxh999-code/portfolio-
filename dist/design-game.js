import {createRecords} from './design-game-records.js';
import {createGameAudio} from './design-game-audio.js';
import {gameView} from './design-game-view.js';
export function createDesignGame(root,{onQuit}={}){
  const content=root.querySelector('.dg-content');content.innerHTML=gameView;content.dataset.view='menu';
  const $=selector=>content.querySelector(selector),all=selector=>[...content.querySelectorAll(selector)];
  const records=createRecords(),audio=createGameAudio(),grid=$('.dg-grid'),feedback=$('.dc-feedback');
  const clock=$('[data-game-time]'),cash=$('[data-game-score]'),best=$('[data-game-best]');
  let view='menu',mode='colour',rankMode='colour',visible=false,playing=false,started=false,remaining=30000,endAt=0,timer=0,score=0,answer=0,columns=3,tiles=[],storyTimer=0,storyEpoch=0,pendingDelete=null,runSaved=false;
  function storageStatus(){$('.dc-storage-note').hidden=records.persistent;}
  function soundStatus(){all('[data-dc="sound"]').forEach(b=>{b.textContent=audio.enabled?'sound on':'sound off';b.setAttribute('aria-pressed',String(audio.enabled));});}
  audio.set(records.sound);soundStatus();storageStatus();
  function cancelStory(){clearTimeout(storyTimer);storyTimer=0;storyEpoch++;}
  function focusFirst(){const panel=$(`[data-view="${view}"]`);const target=view==='name'?$('.dc-name-form input'):panel?.querySelector('button:not([hidden]),input,a');target?.focus({preventScroll:true});}
  function setView(next){
    if(next!=='story')cancelStory();view=next;content.dataset.view=next;
    all('.dc-panel').forEach(p=>p.hidden=p.dataset.view!==next);
    $('[data-dc-section]').textContent=({menu:'main menu',name:'new game',story:'loading',play:'the assignment',result:'mission complete',scores:'high scores',profile:'player file',options:'options',help:'how to play'})[next];
    $('[data-dc="resume"]').hidden=!started||remaining<=0;
    content.scrollTop=0;if(visible)focusFirst();
  }
  function update(){
    const second=Math.ceil(remaining/1000);clock.textContent=`00:${String(second).padStart(2,'0')}`;cash.textContent=String(score).padStart(6,'0');
    best.textContent=records.history().filter(r=>r.mode===mode).reduce((n,r)=>Math.max(n,r.score),0);
    const stars=Math.min(5,Math.floor(score/4));$('[data-dc-stars]').textContent='★'.repeat(stars)+'☆'.repeat(5-stars);$('[data-dc-stars]').setAttribute('aria-label',`${stars} of 5 reputation stars`);
    $('[data-dc-level]').textContent=`level ${String(1+Math.floor(score/5)).padStart(2,'0')}`;
    content.classList.toggle('dc-time-low',second<=5&&playing);
    const pause=$('[data-dc="pause"]');pause.textContent=playing?'pause game':'resume game';$('.dc-pause-cover').hidden=playing;
  }
  function stopTimer(){clearInterval(timer);timer=0;}
  function finish(){
    if(!started||runSaved)return;
    playing=false;remaining=0;stopTimer();runSaved=true;
    records.addRun(mode,score);storageStatus();update();
    $('[data-dc-result-player]').textContent=`${records.active?.name||'Player'} · ${mode} assignment`;
    $('[data-dc-final-score]').textContent=score;
    $('[data-dc-result-copy]').textContent=`${score} detail${score===1?'':'s'} spotted. ${score>=20?'The city has a new creative director.':score>=10?'A sharp eye earns a reputation.':'Every great eye starts somewhere. Take another run.'}`;
    $('.dc-save-status').textContent=records.persistent?'Record saved on this device.':'Record kept for this session only.';
    setView('result');audio.effect('finish');
  }
  function tick(){remaining=Math.max(0,endAt-performance.now());if(remaining===0)finish();else update();}
  function pause(){
    if(!playing)return;remaining=Math.max(0,endAt-performance.now());playing=false;stopTimer();
    if(remaining<=0){finish();return;}
    tiles.forEach(t=>t.disabled=true);feedback.textContent='Paused. Your clock is stopped.';update();
  }
  function focusTile(index){tiles.forEach((t,i)=>t.tabIndex=i===index?0:-1);tiles[index]?.focus({preventScroll:true});}
  function board(focusIndex=null){
    columns=Math.min(5,3+Math.floor(score/5));answer=Math.floor(Math.random()*columns**2);const hue=[26,154,193,223,278,325][Math.floor(Math.random()*6)],delta=Math.max(5,19-score*.65);
    grid.style.setProperty('--dg-columns',columns);const fragment=document.createDocumentFragment();tiles=[];
    for(let i=0;i<columns**2;i++){
      const tile=document.createElement('button');tile.type='button';tile.className='dg-tile';tile.setAttribute('aria-label',`Tile ${i+1} of ${columns**2}`);tile.tabIndex=i===0?0:-1;tile.disabled=!playing;
      if(mode==='colour')tile.style.backgroundColor=`hsl(${hue} 48% ${45+(i===answer?delta:0)}%)`;
      else{tile.classList.add('dg-tile--alignment');for(let l=0;l<3;l++){const bar=document.createElement('span');bar.setAttribute('aria-hidden','true');if(i===answer&&l===1)bar.style.transform=`translateX(${Math.max(3,10-score*.25)}px)`;tile.append(bar);}}
      tile.addEventListener('click',()=>{
        if(!playing)return;tick();if(!playing)return;
        if(i===answer){score++;audio.effect('correct');feedback.textContent='Good eye. Keep moving.';board(document.activeElement===tile?i:null);update();}
        else{audio.effect('wrong');endAt-=2000;tick();if(playing){feedback.textContent='Wrong pick. Two seconds off.';tile.classList.remove('dc-wrong');void tile.offsetWidth;tile.classList.add('dc-wrong');}}
      });
      tile.addEventListener('keydown',event=>{const moves={ArrowRight:1,ArrowLeft:-1,ArrowDown:columns,ArrowUp:-columns};let next;if(event.key in moves)next=(i+moves[event.key]+columns**2)%columns**2;else if(event.key==='Home')next=0;else if(event.key==='End')next=columns**2-1;if(next!==undefined){event.preventDefault();focusTile(next);}});
      tiles.push(tile);fragment.append(tile);
    }
    grid.replaceChildren(fragment);if(focusIndex!==null)focusTile(Math.min(focusIndex,tiles.length-1));
  }
  function resume(){
    if(!visible||document.hidden||!started||remaining<=0)return;
    $('[data-dc-player]').textContent=records.active?.name||'Player';
    playing=true;endAt=performance.now()+remaining;tiles.forEach(t=>t.disabled=false);stopTimer();timer=setInterval(tick,100);
    setView('play');feedback.textContent=mode==='colour'?'Find the different shade.':'Find the misplaced middle line.';update();grid.querySelector('[tabindex="0"]')?.focus({preventScroll:true});
  }
  function startRound(){
    if(!visible)return;cancelStory();started=true;runSaved=false;score=0;remaining=30000;playing=true;endAt=performance.now()+remaining;
    $('[data-dc-player]').textContent=records.active?.name||'Player';$('[data-dc-mode]').textContent=`${mode} assignment`;
    $('[data-dc-mission]').innerHTML=mode==='colour'?'colour <br>confidential.':'perfect <br>alignment.';
    $('[data-dc-description]').textContent=mode==='colour'?'One shade doesn’t belong. Find it before the city clock runs out.':'One middle line is out of place. Track it down before time runs out.';
    board();setView('play');stopTimer();timer=setInterval(tick,100);feedback.textContent='Your assignment starts now.';update();focusTile(0);
  }
  function story(){
    pause();cancelStory();setView('story');const epoch=storyEpoch;storyTimer=setTimeout(()=>{if(epoch===storyEpoch&&visible&&!document.hidden)startRound();},3800);
  }
  function mainMenu(){pause();setView('menu');}
  function nameEntry(){
    pause();started=false;remaining=30000;score=0;setView('name');const input=$('.dc-name-form input');input.value=records.active?.name||'';$('.dc-form-error').textContent='';
    const list=$('[data-dc-players]');list.replaceChildren();$('.dc-existing').hidden=!records.players.length;
    records.players.forEach(p=>{const button=document.createElement('button');button.type='button';button.className='dc-player-chip';button.textContent=p.name;button.addEventListener('click',()=>{records.select(p.id);input.value=p.name;input.focus();storageStatus();});list.append(button);});
    input.focus({preventScroll:true});
  }
  function rankTable(){
    const stats=records.stats();$('[data-dc-record-stats]').textContent=`${stats.players} player${stats.players===1?'':'s'} · ${stats.runs} saved round${stats.runs===1?'':'s'} on this device`;
    all('[data-rank-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rankMode===rankMode)));
    const region=$('.dc-ranking');region.replaceChildren();const rows=records.rankings(rankMode);
    if(!rows.length){const p=document.createElement('p');p.textContent='No records yet. The top spot is yours to take.';region.append(p);return;}
    const table=document.createElement('table');const head=document.createElement('thead');head.innerHTML='<tr><th scope="col">rank</th><th scope="col">player</th><th scope="col">best</th><th scope="col">runs</th></tr>';table.append(head);const body=document.createElement('tbody');
    rows.forEach((p,i)=>{const row=document.createElement('tr');if(p.id===records.active?.id)row.className='dc-own-rank';[String(i+1).padStart(2,'0'),p.name,String(p.best),String(p.plays)].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell);});body.append(row);});table.append(body);region.append(table);
  }
  function scores(){pause();rankTable();setView('scores');}
  function profile(){
    pause();if(!records.active){nameEntry();return;}setView('profile');$('.dc-rename-form input').value=records.active.name;$('.dc-profile-status').textContent='';$('.dc-confirm').hidden=true;pendingDelete=null;
    const region=$('.dc-history');region.replaceChildren();const rows=records.history();const heading=document.createElement('h3');heading.textContent=`recent runs · ${rows.length}`;region.append(heading);
    if(!rows.length){const p=document.createElement('p');p.textContent='Your first mission is waiting.';region.append(p);}
    rows.slice(0,40).forEach(r=>{const row=document.createElement('div');row.className='dc-history-row';const text=document.createElement('span');text.textContent=`${r.score} pts · ${r.mode}`;const date=document.createElement('small');date.textContent=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(r.date);const button=document.createElement('button');button.type='button';button.textContent='delete';button.setAttribute('aria-label',`Delete ${r.score}-point ${r.mode} result from ${date.textContent}`);button.className='dc-text-button';button.addEventListener('click',()=>confirmDelete({kind:'run',id:r.id,playerId:r.playerId},'Delete this game result? This cannot be undone.'));row.append(text,date,button);region.append(row);});
  }
  function confirmDelete(target,copy){pendingDelete=target;$('.dc-confirm-copy').textContent=copy;$('.dc-confirm').hidden=false;$('[data-dc="cancel-delete"]').focus({preventScroll:true});$('.dc-confirm').scrollIntoView({block:'nearest'});}
  function reset(){pause();cancelStory();stopTimer();started=false;playing=false;score=0;remaining=30000;tiles=[];runSaved=false;setView('menu');}
  $('.dc-name-form').addEventListener('submit',event=>{event.preventDefault();try{records.create($('.dc-name-form input').value);storageStatus();story();}catch(error){$('.dc-form-error').textContent=error.message;}});
  $('.dc-rename-form').addEventListener('submit',event=>{event.preventDefault();try{records.rename(records.active?.id,$('.dc-rename-form input').value);storageStatus();$('.dc-profile-status').textContent='Name updated on this device.';}catch(error){$('.dc-profile-status').textContent=error.message;}});
  content.addEventListener('click',event=>{
    const button=event.target.closest('[data-dc]');if(!button)return;event.preventDefault();audio.unlock();const action=button.dataset.dc;
    if(action!=='sound')audio.effect('select');
    if(action==='sound'){audio.set(!audio.enabled);records.setSound(audio.enabled);soundStatus();storageStatus();}
    else if(action==='new'||action==='switch')nameEntry();
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
  all('[data-mode]').forEach(button=>button.addEventListener('click',()=>{if(mode!==button.dataset.mode){mode=button.dataset.mode;pause();started=false;remaining=30000;}all('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));audio.effect('select');}));
  all('[data-rank-mode]').forEach(button=>button.addEventListener('click',()=>{rankMode=button.dataset.rankMode;rankTable();audio.effect('select');}));
  content.addEventListener('keydown',event=>{
    audio.unlock();if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(view==='menu')onQuit?.();else if(view==='story'){cancelStory();mainMenu();}else mainMenu();return;}
    if(view==='menu'&&['ArrowUp','ArrowDown','Home','End'].includes(event.key)){event.preventDefault();const items=all('.dc-menu nav button').filter(b=>!b.hidden),i=items.indexOf(document.activeElement);items[event.key==='Home'?0:event.key==='End'?items.length-1:(i+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();audio.effect('hover');}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();if(view==='story'){cancelStory();mainMenu();}audio.activate(false);}else if(visible)audio.activate(true);});
  return {show(){visible=true;audio.activate(true);mainMenu();},hide(){visible=false;pause();if(view==='story'){cancelStory();setView('menu');}audio.activate(false);},reset};
}
