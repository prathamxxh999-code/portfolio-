import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const site=resolve(root,process.argv.includes('--source')?'src':'dist');
const context={window:{},document:{addEventListener(){}},matchMedia(){return {matches:false}},URL};
vm.createContext(context);
for(const file of ['reference-assets.js','reference-showcase.js','merchant-assets.js','merchant-showcase.js','valet-showcase.js','project-showcases.js','project-cases.js'])vm.runInContext(await readFile(resolve(site,file),'utf8'),context,{filename:file});
const records=context.window.projectCaseRecords;
assert.equal(Object.keys(records).length,15);
assert.equal(records[14],undefined,'The removed poster project must not have a case route.');
const expected=[3,4,3,3,3,0,0,17,0,0,3,0,4,45,12,3];
const paths=new Set();let total=0;
for(const [id,p] of Object.entries(records)){
  const groups=context.window.projectCaseGroups(+id),screens=groups.flatMap(g=>g.screens),html=context.window.renderProjectCaseStudy(+id,p.key,0,'Core Banking');
  assert.equal(screens.length,expected[id],`Wrong screen inventory for ${id}`);
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.equal((html.match(/data-case-screen=/g)||[]).length,expected[id]);
  assert.equal((html.match(/data-case-panel=/g)||[]).length,4);
  assert(!/role="tab"|data-case-flow/.test(html),'Story chapters must be scroll directed, not clickable cards.');
  assert.match(html,/aria-label="Project sections"/);
  assert.match(html,/id="case-gallery"/);
  assert.match(html,/id="case-workflow"/);
  assert(!/href="#case-/.test(html),'Section navigation must not conflict with hash routing.');
  if(p.processOnly){assert.match(html,/Configuration through client delivery/);assert(!/reconstructed\/|concept reconstruction|Recreated visual/i.test(html));assert.equal(screens.length,0);}
  if([0,1,2,3,14].includes(+id))assert.match(html,/Ashlesh Gavas/);
  if(p.film){assert.match(html,/<video autoplay muted loop playsinline/);assert(!/<video[^>]+\scontrols(?:[\s=>])/.test(html));}
  if(p.website){assert.match(html,/<iframe src="https:\/\//);assert(html.includes(p.website));}
  for(const match of html.matchAll(/(?:src|poster|href)="(\.\/[^"#]+)"/g))paths.add(match[1]);
  for(const s of screens){paths.add(s.src);if(s.mockup)paths.add(s.mockup)}
  total+=screens.length;
}
assert.equal(total,88);
for(const path of paths){const info=await stat(resolve(site,path));assert(info.isFile()&&info.size>0,`Missing asset ${path}`)}
const app=await readFile(resolve(site,'app.js'),'utf8');
assert.match(app,/featuredProjects=\[10,4,12,13,7,15\]/);
assert.match(app,/window\.renderProjectCaseStudy/);
assert.match(app,/portfolio:work-filter/);
const cinema=await readFile(resolve(site,'cinema.js'),'utf8');
assert.match(cinema,/portfolio:work-filter/);
assert.match(cinema,/cards = \[\.\.\.track\.querySelectorAll/);
const index=await readFile(resolve(site,'index.html'),'utf8');
assert.equal((index.match(/data-work-filter=/g)||[]).length,4);
assert(!index.includes('data-work-filter="visual"'));
assert.match(index,/data-n="15"/);
assert(!app.includes("['Banner & Poster Design'"));
console.log(`Passed: 15 case studies, 60 scroll chapters, ${total} original views, ${paths.size} local media assets, removed poster route, professional contribution stories, silent films, live website embeds and dynamic horizontal categories.`);
