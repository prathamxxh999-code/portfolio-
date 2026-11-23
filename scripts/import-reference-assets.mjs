import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifestPath=resolve(process.argv[2]||resolve(root,'../../tmp/ashlesh-reference/manifest.json'));
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const allowed=new Set(['core-banking','internet-banking','corporate-banking','mobile-banking','banners-posters']);
const assets=manifest.assets.filter(asset=>allowed.has(asset.group));
if(assets.length!==25)throw new Error('Expected 13 banking screens and 12 visual designs.');
const catalog={};
for(const asset of assets){
  if(!/^[a-z0-9-]+$/.test(asset.key))throw new Error('Invalid asset key');
  const file=basename(asset.path),folder=resolve(root,'src/showcases/references',asset.group);
  await mkdir(folder,{recursive:true});
  await copyFile(resolve(dirname(manifestPath),asset.path),resolve(folder,file));
  catalog[asset.key]={src:`./showcases/references/${asset.group}/${file}`,width:asset.width,height:asset.height};
}
await writeFile(resolve(root,'src/reference-assets.js'),`// Original project images, retained at their supplied resolution.\nwindow.referenceAssets = ${JSON.stringify(catalog,null,2)};\n`);
console.log(`Imported ${assets.length} original images in ${allowed.size} collections.`);
