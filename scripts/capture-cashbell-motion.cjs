// Actual Flutter preview interactions; no application source or production data changes.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.USERPROFILE+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const root=path.resolve(__dirname,'..');
const out=path.join(__dirname,'showcase-sources/cashbell-v3');
const ff=process.env.SHOWCASE_FFMPEG;
if(!ff)throw Error('Set SHOWCASE_FFMPEG to the FFmpeg executable.');
fs.mkdirSync(path.join(out,'screens'),{recursive:true});
fs.mkdirSync(path.join(out,'clips'),{recursive:true});
const seed=path.resolve(root,'../../tmp/showcase-capture/cashbell-auth-state.json');
const partial=process.argv.includes('--remaining')||process.argv.includes('--payment-only');
const records=partial?JSON.parse(fs.readFileSync(path.join(out,'capture.json'),'utf8')).records:[];
let browser;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function page(auth=true){
 const ctx=await browser.newContext({viewport:{width:430,height:880},deviceScaleFactor:2,colorScheme:'dark',...(auth?{storageState:seed}:{})});
 const p=await ctx.newPage();p.setDefaultTimeout(5000);
 await p.goto(process.env.CASHBELL_CAPTURE_URL||'http://127.0.0.1:8784/');await wait(2600);
 await p.locator('flt-semantics-placeholder').evaluate(e=>e.click());await wait(200);
 if(!auth){await p.getByRole('button',{name:/Skip|Continue to CashBell/}).first().click();await wait(350);}
 return p;
}
async function save(p,name){await wait(120);await p.screenshot({path:path.join(out,'screens',name+'.png')});}
async function nav(p,name){await p.getByRole('button',{name:name+' '+name,exact:true}).click();await wait(220);}
async function click(p,name){await p.getByRole('button',{name,exact:true}).first().click();await wait(130);}
async function record(p,name,seconds,actions){
 const dir=path.join(out,'clips',name);fs.mkdirSync(dir,{recursive:true});
 const c=await p.context().newCDPSession(p);const frames=[];const events=[];
 let begun=0;
 c.on('Page.screencastFrame',event=>{
  c.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
  const file=String(frames.length).padStart(5,'0')+'.jpg';
  fs.writeFileSync(path.join(dir,file),Buffer.from(event.data,'base64'));
  frames.push({file,time:event.metadata.timestamp});
 });
 const later=async(t,fn)=>{await wait(Math.max(0,begun+t*1000-Date.now()));await fn();};
 const point=async(locator)=>{const b=await locator.boundingBox();return b?{x:b.x+b.width/2,y:b.y+b.height/2}:null;};
 const tap=async(t,locator)=>{await later(t,async()=>{const pt=await point(locator);if(pt)events.push({time:(Date.now()-begun)/1000,...pt,type:'tap'});await locator.click();});};
 await c.send('Page.startScreencast',{format:'jpeg',quality:98,maxWidth:860,maxHeight:1760,everyNthFrame:1});begun=Date.now();
 await actions({later,tap,events,begun});
 await wait(Math.max(0,begun+seconds*1000-Date.now()));const end=Date.now()/1000;
 await c.send('Page.stopScreencast');await c.detach();
 if(!frames.length)throw Error('No native frames: '+name);
 const concat=['ffconcat version 1.0'];
 for(let i=0;i<frames.length;i++)concat.push("file '"+frames[i].file+"'",'duration '+Math.max(.001,(frames[i+1]?.time??end)-frames[i].time));
 concat.push("file '"+frames.at(-1).file+"'");
 fs.writeFileSync(path.join(dir,'source.ffconcat'),concat.join('\n')+'\n');
 execFileSync(ff,['-hide_banner','-loglevel','error','-y','-safe','0','-f','concat','-i',path.join(dir,'source.ffconcat'),'-vf','fps=60','-an','-c:v','libx264','-preset','fast','-crf','15','-pix_fmt','yuv420p',path.join(out,'clips',name+'.mp4')]);
 records.push({name,duration:end-frames[0].time,events,sourceSpeed:1});
 fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({source:'C:/cashbell_flutter',theme:'native-dark',screen:{width:430,height:880,dpr:2},records},null,2));
 console.log('Captured '+name+' ('+frames.length+' native frames)');
}
async function prepareComparison(p){
 await p.getByRole('button',{name:/ELIGIBLE FOR/}).click();await wait(250);await save(p,'need');
 await click(p,'Compare sample options');
 await p.getByRole('checkbox',{name:/I understand this is a simulation/}).click();await wait(120);
 await p.getByRole('checkbox',{name:/Show sample cost comparisons/}).click();await wait(120);
 await click(p,'Continue with sample comparison');await wait(3000);await save(p,'offers');
}
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  if(!partial){
  const login=await page(false);await save(login,'login');
  await record(login,'login',3.2,async({later,tap})=>{
   await later(.12,async()=>{const field=login.getByRole('textbox').first();await field.click();await field.pressSequentially('9000000002',{delay:30});});
   await tap(.9,login.getByRole('button',{name:/Continue/,exact:false}).last());
   await save(login,'otp');
   await tap(1.85,login.getByRole('button',{name:/Verify|Continue/,exact:false}).last());
  });await save(login,'home');
  await record(login,'home',4.0,async({later})=>{
   await later(.7,async()=>{await login.mouse.move(310,540);await login.mouse.wheel(0,230);});
   await later(2.1,async()=>{await login.mouse.wheel(0,-800);});
  });
  await nav(login,'Activity');await save(login,'activity');
  await nav(login,'Profile');await save(login,'profile');
  await nav(login,'Bell AI');await save(login,'bell');
  await record(login,'bell',4.2,async({later})=>{await later(.5,async()=>{await login.mouse.click(86,663);});});await save(login,'bell-answer');
  await nav(login,'Home');await prepareComparison(login);
  await record(login,'offer',5.2,async({tap,later})=>{
   await tap(1.45,login.getByRole('button',{name:'Choose this offer →',exact:true}).first());
   await later(3.0,async()=>{await login.mouse.move(280,565);await login.mouse.wheel(0,230);});
  });await save(login,'review');
  await login.mouse.move(250,550);await login.mouse.wheel(0,2000);await wait(350);
  await login.getByRole('checkbox',{name:/I reviewed the sample terms/}).click();await wait(160);await save(login,'submit-ready');
  await record(login,'submission',6.2,async({tap,later})=>{
   await tap(.12,login.getByRole('button',{name:'Submit sample application',exact:true}));
   await later(4.2,async()=>{await login.mouse.move(280,580);await login.mouse.wheel(0,760);});
   await tap(4.85,login.getByRole('button',{name:'Track application →',exact:true}));
  });await save(login,'tracker');
  }
  if(!process.argv.includes('--payment-only')){
  const need=await page();
  await need.getByRole('button',{name:/ELIGIBLE FOR/}).click();await wait(250);
  await record(need,'need',5.0,async({later})=>{
   await later(.4,async()=>{await need.mouse.click(373,305);});
   await later(1.25,async()=>{await need.mouse.click(57,481);});
   await later(2.3,async()=>{await need.mouse.move(300,620);await need.mouse.wheel(0,210);});
   await later(3.5,async()=>{await need.mouse.wheel(0,-700);});
  });await save(need,'need-selected');
  }
  const payment=await page();await payment.mouse.click(140,305);await wait(280);
  await payment.getByRole('button',{name:/Repay next EMI/}).click();await wait(230);await save(payment,'emi');
  await record(payment,'payment',5.2,async({later,tap,events})=>{
   await later(.6,async()=>{await payment.mouse.move(194,839);await payment.mouse.down();for(let i=1;i<=25;i++){await payment.mouse.move(194+366*i/25,839);await wait(20);}await payment.mouse.up();events.push({type:'drag',time:.6,x:194,y:839,endX:560,endY:839,duration:.6});});
   await tap(2.45,payment.getByRole('button',{name:'Simulate pending confirmation',exact:true}));
  });await save(payment,'payment-pending');
  console.log('All CashBell captures ready.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
