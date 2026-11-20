import assert from 'node:assert/strict';
import { createDesktop } from '../src/pc-desktop.js';

// Exercise the desktop state machine without a browser. These checks cover
// asynchronous cancellation, iframe readiness and résumé controls; visual
// layout is checked separately in the browser when it is available.
class Element {
  hidden=true; disabled=false; dataset={}; attributes=new Map(); listeners=new Map();
  style={setProperty:(key,value)=>{this.style[key]=value;}};
  classList={toggle:()=>{}};
  children=new Map(); focused=false;
  querySelector(selector){
    if(!this.children.has(selector))this.children.set(selector,new Element());
    return this.children.get(selector);
  }
  querySelectorAll(selector){const prefix=selector==='[data-resume-zoom]'?'[data-resume-zoom=':selector;return [...this.children.entries()].filter(([key])=>key.startsWith(prefix)).map(([,node])=>node);}
  addEventListener(name,fn){this.listeners.set(name,fn);}
  emit(name,event={}){this.listeners.get(name)?.(event);}
  setAttribute(key,value){this.attributes.set(key,value);}
  removeAttribute(key){this.attributes.delete(key);if(key==='src')delete this.src;}
  focus(){this.focused=true;}
  contains(node){return node===this;}
}
const realSetTimeout=globalThis.setTimeout,realClearTimeout=globalThis.clearTimeout;
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};
let checks=0;
try {
  function fixture(onOpen=async()=>true){
    const splash=new Element(),doc=new Element(),win=new Element();
    globalThis.document=doc;globalThis.window=win;
    globalThis.location=new URL('https://example.test/?preview=pc#/p/12');
    for(const value of [-25,25])splash.querySelector(`[data-resume-zoom="${value}"]`).dataset.resumeZoom=String(value);
    const frame=splash.querySelector('.pc-portfolio-frame');frame.contentWindow={};
    let restarts=0;
    const desktop=createDesktop(splash,{onOpen,onRestart:()=>restarts++});
    const node=selector=>splash.querySelector(selector);
    return {desktop,node,frame,win,restarts:()=>restarts};
  }
  let release;
  const pending=fixture(()=>new Promise(resolve=>release=resolve));
  pending.desktop.show();
  const opening=pending.desktop.open();
  assert.equal(pending.node('.pc-boot').hidden,false);
  assert.equal(pending.node('.pc-folder').disabled,true);
  pending.desktop.show();release(true);await opening;
  assert.equal(pending.desktop.mode,'desktop');
  assert.equal(pending.frame.src,undefined);
  assert.equal(pending.node('.pc-folder').disabled,false);checks++;

  const live=fixture();live.desktop.show();
  live.frame.emit('load');
  await live.desktop.open();
  assert.equal(live.desktop.mode,'portfolio');
  assert.equal(new URL(live.frame.src).search,'?pc-screen=1');
  assert.equal(new URL(live.frame.src).hash,'#/p/12');
  assert.equal(live.node('.pc-boot').hidden,false);
  live.win.emit('message',{origin:'https://untrusted.test',source:live.frame.contentWindow,data:{type:'pc:ready'}});
  assert.equal(live.node('.pc-boot').hidden,false);
  live.win.emit('message',{origin:location.origin,source:{},data:{type:'pc:ready'}});
  assert.equal(live.node('.pc-boot').hidden,false);checks++;

  live.win.emit('message',{origin:location.origin,source:live.frame.contentWindow,data:{type:'pc:ready'}});
  assert.equal(live.node('.pc-boot').hidden,true);
  assert.equal(live.node('.pc-start').disabled,false);
  assert.equal(live.frame.focused,true);checks++;

  live.desktop.show();await live.desktop.open('resume');
  assert.equal(live.node('.pc-resume-window').hidden,false);
  assert.equal(live.node('.pc-window').hidden,true);
  const plus=live.node('[data-resume-zoom="25"]'),minus=live.node('[data-resume-zoom="-25"]');
  for(let i=0;i<8;i++)plus.emit('click');
  assert.equal(live.node('.pc-resume-zoom').textContent,'200%');assert.equal(plus.disabled,true);
  for(let i=0;i<8;i++)minus.emit('click');
  assert.equal(live.node('.pc-resume-zoom').textContent,'100%');assert.equal(minus.disabled,true);checks++;

  live.node('.pc-resume-close').emit('click');
  assert.equal(live.desktop.mode,'desktop');
  live.node('.pc-start-menu').querySelector('.pc-restart').emit('click');
  assert.equal(live.restarts(),1);
  live.desktop.hide();assert.equal(live.frame.src,undefined);
  assert.equal(live.node('.pc-os').hidden,true);checks++;

  const cancelled=fixture(()=>new Promise(resolve=>release=resolve));
  cancelled.desktop.show();const stopped=cancelled.desktop.open('resume');
  cancelled.desktop.hide();release(true);await stopped;
  assert.equal(cancelled.desktop.mode,'closed');
  assert.equal(cancelled.node('.pc-resume-window').hidden,true);checks++;
  console.log(`Passed ${checks} desktop state checks.`);
} finally {
  globalThis.setTimeout=realSetTimeout;globalThis.clearTimeout=realClearTimeout;
}
