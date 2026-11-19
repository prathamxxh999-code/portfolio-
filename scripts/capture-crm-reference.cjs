// Capture actual CRM states in an isolated demo browser. No source UI is changed.
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.USERPROFILE+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const out=path.resolve(__dirname,'showcase-sources/crm-v2/screens');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  page.setDefaultTimeout(5000);
  await page.addInitScript(()=>sessionStorage.setItem('idsspl-crm-demo-session','active'));
  await page.goto(process.env.CRM_CAPTURE_URL||'http://127.0.0.1:8781/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>await document.fonts.ready);
  const boxes={};
  const save=async(name,selector)=>{
   await page.waitForTimeout(160);
   if(selector){await page.locator(selector).first().screenshot({path:path.join(out,name+'.png')});}
   else await page.screenshot({path:path.join(out,name+'.png')});
   console.log(name);
  };
  const nav=async(view)=>{await page.keyboard.press('Escape');await page.waitForTimeout(80);await page.locator('.nav-item[data-view="'+view+'"]').click({timeout:4000});await page.waitForTimeout(150)};
  await save('overview');
  await page.screenshot({path:path.join(out,'overview-full.png'),fullPage:true});
  await save('brand','.brand');
  await save('brand-mark','.brand-mark');
  await save('map','.overview-map');
  await save('overview-map');
  await nav('clients');await save('clients');
  await page.locator('.client-open-row').first().click();await save('profile');
  await page.locator('[data-profile-tab="logs"]').first().click();await save('profile-history');
  await nav('prospects');await save('prospects');
  await save('module-prospect','article.prospect-card');
  await page.locator('[data-prospect-action="detail"][data-id="lead1"]').first().click();await save('prospect-detail');
  await save('module-prospect-detail','.ops-drawer');
  await nav('helpdesk');await save('helpdesk');
  await page.getByText('Branch login access review',{exact:true}).first().click();await save('case-detail');
  await save('module-case','section.hd-section:has-text("Next action")');
  await page.locator('section.hd-section').filter({hasText:'Next action'}).locator('select').first().selectOption({label:'In progress'});
  await save('module-case-action','section.hd-section:has-text("Next action")');
  await page.keyboard.press('Escape');
  await nav('tasks');await save('tasks');
  await save('module-task','article:has([data-task-manager-action="edit"][data-id="task-r1"])');
  for(const [id,name] of [['tm-admin','mahesh'],['tm-varshika','varshika'],['tm-sameer','sameer'],['tm-prathamesh','prathamesh']]){
   await save('avatar-'+name,'[data-task-manager-owner="'+id+'"] .admin-member-avatar');
  }
  await page.locator('[data-task-manager-owner="tm-varshika"]').click();await save('tasks-varshika');
  await page.locator('[data-task-manager-owner="all"]').click();
  await page.locator('[data-task-manager-action="edit"][data-id="task-r1"]').click();await save('task-editor');
  for(const id of ['ops-task-owner','ops-task-priority','ops-task-due'])boxes[id]=await page.locator('#'+id).boundingBox();
  boxes.modal=await page.locator('.modal').first().boundingBox();
  await page.locator('#ops-task-owner').selectOption({label:'Prathamesh'});await save('task-assigned');
  await page.locator('#ops-task-priority').selectOption('High');await save('task-priority');
  await page.locator('#ops-task-due').fill('2026-11-23');await save('task-deadline');
  await page.getByRole('button',{name:'Save task',exact:true}).click();await save('task-saved');
  await save('module-task-priority','article:has([data-task-manager-action="edit"][data-id="task-r1"])');
  await page.waitForTimeout(400);
  await page.locator('[data-action="toggle-record-menu"][data-id="task-r1"]').evaluate(e=>e.click());
  await page.waitForTimeout(180);
  if(!await page.getByRole('menuitem',{name:'Mark complete',exact:true}).count())await page.locator('[data-action="toggle-record-menu"][data-id="task-r1"]').evaluate(e=>e.click());
  await save('task-actions');
  await page.getByRole('menuitem',{name:'Mark complete',exact:true}).evaluate(e=>e.click());await page.waitForTimeout(250);await save('task-completed');
  await save('module-task-completed','.task-board-card.is-done');
  await page.locator('select[aria-label="Task status"]').selectOption('completed');await save('completed-focus');
  await nav('roles');await save('roles');
  await page.locator('[data-admin-action="edit-member"][data-id="tm-prathamesh"]').click();await save('member-permissions');
  await page.waitForTimeout(1800);await save('member-panel','.modal');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await nav('insights');await save('reports');
  const symbols={};for(const name of ['users','task','help','chart','note','nav-prospects']){const sym=page.locator('#i-'+name);if(await sym.count())symbols[name]=await sym.innerHTML();}
  fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({width:1440,height:900,scale:2,boxes,metrics:[{label:'Clients',value:50},{label:'Open tasks',value:5},{label:'Active cases',value:2},{label:'Completed tasks',value:0}],source:'Existing IDSSPL CRM local demo',symbols},null,2));
  const iconPage=await browser.newPage({viewport:{width:96,height:96},deviceScaleFactor:2});
  for(const [name,content] of Object.entries(symbols)){
   await iconPage.setContent('<html><body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#174d38" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'+content+'</svg></body></html>');
   await iconPage.screenshot({path:path.join(out,'icon-'+name+'.png'),omitBackground:true});
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
