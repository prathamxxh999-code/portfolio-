import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const site=resolve(root,'dist');
const context={window:{},document:{addEventListener(){}}};
vm.createContext(context);
for(const name of ['reference-assets.js','reference-showcase.js'])vm.runInContext(await readFile(resolve(site,name),'utf8'),context);
const {referenceAssets:assets,referenceCollections:collections,renderReferenceShowcase:render}=context.window;
assert.deepEqual(Object.keys(collections),['0','1','2','3','14']);
assert.equal(Object.keys(assets).length,25);
let total=0;
for(const [id,collection] of Object.entries(collections)){
  assert.equal(collection.screens.length,id==='1'?4:id==='14'?12:3);
  const html=render(Number(id),'Project title',10,'IDSSPL Website');
  assert.equal((html.match(/data-reference-screen=/g)||[]).length,collection.screens.length);
  assert.ok(html.includes('Ashlesh Gavas'));
  assert.ok(html.includes('data-p="10"'));
  assert.ok(!html.includes('href="#reference-gallery"'),'Gallery navigation must not exit the project hash route');
  for(const screen of collection.screens){
    const asset=assets[screen[0]];
    assert.ok(asset,`Missing original ${screen[0]}`);
    assert.ok(asset.width>0&&asset.height>0);
    assert.ok(html.includes(asset.src));
    total++;
  }
  for(const match of html.matchAll(/(?:src|href)="(\.\/[^"?]+)"/g))await stat(resolve(site,match[1]));
}
assert.equal(total,25);
assert.equal(render(7,'Valet',0,'Banking'),'','Existing showcases stay with their current renderer');
const groups=await readdir(resolve(site,'showcases/references'),{withFileTypes:true});
assert.deepEqual(groups.filter(x=>x.isDirectory()).map(x=>x.name).sort(),['banners-posters','core-banking','corporate-banking','internet-banking','mobile-banking']);
console.log('Passed all 5 showcase routes, 25 original images, credits, navigation and exclusion checks.');
