import assert from 'node:assert/strict';
import { readFile,readdir,stat } from 'node:fs/promises';
import { resolve,dirname,extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const missing=[];let checks=0;
async function verify(file,url){
  if(!url||/^(data:|https?:|mailto:|tel:|#|\/\/)/i.test(url))return;
  const clean=url.split(/[?#]/)[0];if(!clean)return;
  const target=clean.startsWith('/')?resolve(root,`.${clean}`):resolve(dirname(file),clean);
  checks++;try{await stat(target);}catch{missing.push({file:file.slice(root.length+1),url});}
}
async function walk(folder){
  for(const entry of await readdir(folder,{withFileTypes:true})){
    const file=resolve(folder,entry.name);if(entry.isDirectory()){await walk(file);continue;}
    const extension=extname(file);if(!['.html','.css','.js'].includes(extension))continue;
    const content=await readFile(file,'utf8');
    const patterns=extension==='.html'?[/\b(?:src|href|poster)=["']([^"']+)["']/g]:
      extension==='.css'?[/url\(\s*["']?([^\s"')]+)["']?\s*\)/g]:
      [/(?:from\s*|import\s*)["'](\.\.?\/[^"']+)["']/g,/import\(\s*["'](\.\.?\/[^"']+)["']/g,/["'](\.\/[^"']+\.(?:webp|png|jpg|mp4|pdf|ttf))["']/g];
    for(const pattern of patterns)for(const match of content.matchAll(pattern))await verify(file,match[1]);
  }
}
await walk(root);assert.deepEqual(missing,[],`Missing assets: ${JSON.stringify(missing)}`);
console.log(`Passed ${checks} built-site asset reference checks.`);
