import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const site=resolve(root,process.argv.includes('--source')?'src':'dist');
const listeners=new Map();
const groups=Array.from({length:8},(_,i)=>({open:i===0}));
const button={textContent:'Expand all groups',attrs:{},setAttribute(k,v){this.attrs[k]=v}};
const galleryRoot={querySelectorAll:()=>groups,querySelector:()=>button};
const document={
  addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn)},
  querySelector:()=>galleryRoot,querySelectorAll:()=>groups
};
const context={window:{},document};vm.createContext(context);
for(const file of ['merchant-assets.js','merchant-showcase.js','project-showcases.js'])vm.runInContext(await readFile(resolve(site,file),'utf8'),context);
const data=context.window.merchantShowcaseAssets;
assert.equal(data.screenCount,45);assert.equal(data.groups.length,8);
const screens=data.groups.flatMap(g=>g.screens);
assert.equal(screens.length,45);assert.equal(new Set(screens.map(s=>s.key)).size,45);
const html=context.window.projectShowcase(13,'Merchant Management Portal',14,'Banner & Poster Design');
assert.equal((html.match(/data-merchant-screen=/g)||[]).length,45);
assert.equal((html.match(/class="merchant-group"/g)||[]).length,8);
assert.equal((html.match(/class="merchant-group" open/g)||[]).length,1);
assert.ok(html.includes('autoplay muted loop playsinline'));
assert.ok(!/\bcontrols(?:[=\s>])/.test(html.match(/<video\b[^>]*>/)[0]));
assert.ok(html.includes('data-p="14"'));
assert.ok(html.includes('Teddy GR / Unsplash'));
assert.ok(html.includes('sample records'));
assert.ok(!html.includes('href="#'),'Gallery controls must preserve the SPA project route');
const capture=JSON.parse(await readFile(resolve(root,'scripts/showcase-sources/merchant-v1/screens/capture.json'),'utf8'));
assert.equal(capture.screens.length,45);
for(const screen of screens){
  assert.ok(screen.description.length>20);
  await stat(resolve(site,screen.mockup));
  const original=await readFile(resolve(site,screen.src));
  const evidence=capture.screens.find(s=>s.key===screen.key);
  assert.equal(createHash('sha256').update(original).digest('hex'),evidence.sha256,`Changed original UI capture: ${screen.key}`);
}
const click=listeners.get('click')[0];
const event={target:{closest(selector){return selector==='[data-merchant-expand]'?button:null}}};
click(event);assert.ok(groups.every(g=>g.open));assert.equal(button.attrs['aria-expanded'],'true');assert.equal(button.textContent,'Collapse groups');
click(event);assert.ok(groups.every(g=>!g.open));assert.equal(button.attrs['aria-expanded'],'false');
assert.ok(context.window.projectShowcase(4,'CashBell',12,'CRM').includes('cashbell-motion-film.mp4'));
assert.ok(context.window.projectShowcase(12,'CRM',13,'Merchant').includes('crm-reference-mint-film.mp4'));
if(!process.argv.includes('--source')){
  const film=JSON.parse(await readFile(resolve(site,'showcases/merchant-showcase-film.json'),'utf8'));
  assert.equal(film.width,1440);assert.equal(film.height,1080);assert.equal(film.fps,60);
  assert.equal(film.frames,1581);assert.equal(film.duration,26.35);assert.equal(film.audio,false);
  const file=await stat(resolve(site,'showcases/merchant-showcase-film.mp4'));
  assert.ok(file.size>1000000&&file.size<100000000);
}
console.log('Passed Merchant route, 45 original-capture hashes, 8 gallery groups, expand/collapse, source credits and existing film integration checks.');
