import {repairCases,patternCases,valetPieces} from './design-game-missions.js';
export function renderStage(grid,{mode,step,parked,selected,playing,onChoose,onSelect,onPark}){
  grid.replaceChildren();grid.className=`dg-grid dc-stage dc-stage--${mode}`;
  if(mode==='valet'){
    const layout=document.createElement('div');layout.className='dc-valet-layout';layout.setAttribute('role','group');layout.setAttribute('aria-label','Parking dashboard layout slots');
    valetPieces.forEach(piece=>{const slot=document.createElement('button');slot.type='button';slot.className=`dc-valet-slot dc-slot--${piece.id}`;slot.dataset.slot=piece.id;slot.setAttribute('aria-label',`${piece.slot}${parked.has(piece.id)?', parked':', empty slot'}`);slot.disabled=!playing||parked.has(piece.id);const label=document.createElement('span');label.textContent=parked.has(piece.id)?piece.name:piece.slot;const icon=document.createElement('i');icon.setAttribute('aria-hidden','true');icon.textContent=parked.has(piece.id)?'✓':'+';slot.append(icon,label);slot.addEventListener('click',()=>onPark(piece.id));slot.addEventListener('dragover',e=>{e.preventDefault();if(!slot.disabled)slot.classList.add('dc-drag-over');});slot.addEventListener('dragleave',()=>slot.classList.remove('dc-drag-over'));slot.addEventListener('drop',e=>{e.preventDefault();slot.classList.remove('dc-drag-over');if(!slot.disabled)onPark(piece.id,e.dataTransfer.getData('text/plain'));});if(parked.has(piece.id))slot.classList.add('dc-parked');layout.append(slot);});
    const tray=document.createElement('div');tray.className='dc-component-tray';tray.setAttribute('role','group');tray.setAttribute('aria-label','Components to park');
    const title=document.createElement('h3');title.textContent=selected?'Choose its matching slot.':'Choose a component to park.';tray.append(title);
    valetPieces.filter(p=>!parked.has(p.id)).forEach(piece=>{const button=document.createElement('button');button.type='button';button.draggable=true;button.className='dc-component';button.textContent=piece.name;button.setAttribute('aria-pressed',String(selected===piece.id));button.disabled=!playing;button.addEventListener('click',()=>onSelect(piece.id));button.addEventListener('dragstart',event=>{if(!playing){event.preventDefault();return;}event.dataTransfer.setData('text/plain',piece.id);event.dataTransfer.effectAllowed='move';});tray.append(button);});grid.append(layout,tray);
  }else{
    const data=(mode==='repair'?repairCases:patternCases)[step%6];
    const preview=document.createElement('div');preview.className=`dc-demo dc-demo--${data.type}`;
    const status=document.createElement('small');status.className='dc-demo-label';status.textContent='game demo · before repair';preview.append(status);
    const screen=document.createElement('div');screen.className='dc-demo-screen';
    const chrome=document.createElement('div');chrome.className='dc-demo-chrome';chrome.innerHTML='<i></i><i></i><i></i><span>design city / workspace</span>';
    const body=document.createElement('div');body.className='dc-demo-body';
    const tag=document.createElement('small');tag.textContent=data.tag;
    const heading=document.createElement('h3');heading.textContent=data.heading;
    const copy=document.createElement('p');copy.textContent=data.body;copy.className='dc-demo-copy';
    const action=document.createElement('span');action.className='dc-demo-action';action.textContent=data.action;
    if(data.type==='spacing'){copy.classList.add('dc-fake-input');const field=document.createElement('span');field.className='dc-field-label';field.textContent='Registration number';body.append(field);}
    body.append(tag,heading,copy,action);
    if(data.type==='hierarchy'){const more=document.createElement('div');more.className='dc-demo-secondary';more.innerHTML='<span>Tell a friend</span><span>Discover more</span>';body.append(more);}
    if(data.type==='clutter'){const extras=document.createElement('div');extras.className='dc-demo-noise';extras.innerHTML='<span>SALE!</span><span>New offers</span><span>Upgrade</span><span>Trending now</span>';body.prepend(extras);}
    screen.append(chrome,body);preview.append(screen);
    const choices=document.createElement('div');choices.className='dc-choices';const kicker=document.createElement('small');kicker.textContent='make the fix';const title=document.createElement('h3');title.textContent=data.title;choices.append(kicker,title);
    // Choice order varies, while each answer keeps its original identity.
    const answers=data.options.map((label,index)=>({label,index}));for(let i=answers.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[answers[i],answers[j]]=[answers[j],answers[i]];}
    answers.forEach((choice,i)=>{const button=document.createElement('button');button.type='button';button.className='dc-choice';button.disabled=!playing;const mark=document.createElement('span');mark.textContent=String(i+1).padStart(2,'0');const text=document.createElement('strong');text.textContent=choice.label;button.append(mark,text);button.addEventListener('click',()=>onChoose(choice.index===data.answer,data.fix));choices.append(button);});
    grid.append(preview,choices);
  }
  return [...grid.querySelectorAll('button')];
}
export function showRepair(grid){
  const preview=grid.querySelector('.dc-demo');if(!preview)return;preview.classList.add('dc-demo--fixed');preview.querySelector('.dc-demo-label').textContent='game demo · repaired';
  const type=preview.className;
  if(type.includes('error'))preview.querySelector('.dc-demo-copy').textContent='Connection lost. Check your network, then try again.';
  if(type.includes('urgency')){preview.querySelector('h3').textContent='Your offer';preview.querySelector('.dc-demo-copy').textContent='Take your time. Choose what works for you.';}
  if(type.includes('shame'))preview.querySelector('.dc-demo-copy').textContent='No thanks';
  if(type.includes('fees')){preview.querySelector('h3').textContent='₹799 total';preview.querySelector('.dc-demo-copy').textContent='Includes all taxes and fees.';}
  if(type.includes('extras'))preview.querySelector('.dc-demo-copy').textContent='□ Add protection for ₹149 (optional)';
  if(type.includes('cancel')){preview.querySelector('.dc-demo-copy').textContent='Cancel your subscription in one step.';preview.querySelector('.dc-demo-action').textContent='Cancel subscription';}
  if(type.includes('--ad')){preview.querySelector('h3').textContent='Sponsored advertisement';preview.querySelector('.dc-demo-copy').textContent='Optional software from an external advertiser.';}
}
