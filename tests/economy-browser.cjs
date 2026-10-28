const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const {createGameServer}=await import('../server/index.js'),app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(!localStorage.getItem('bean-dash-profile-v3'))localStorage.setItem('bean-dash-profile-v3',JSON.stringify({version:3,courseRevision:7,unlocked:2,selected:2,coins:500,raceMode:'endurance',tutorial:true,quality:'low'}))});
  await page.route('**/game.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('dist/game.js','utf8')+`\nwindow.qa={profile:()=>profile.get(),state:()=>({mode,time,player:structuredClone(player)}),camera:()=>({...view.cameraInput}),begin(){startSolo(false);mode='race';$('countdown').hidden=true;$('level-intro').hidden=true;syncPowers();},kill(){time=45;player.cp=1;player.coins=10;player.collected=[0,1,2,3,4,5,6,7,8,9];player.invincible=0;player.y=-4;soloStep(1/60);},skipCountdown(){mode='race';$('countdown').hidden=true;syncPowers();},online(){online=true;syncPowers();},cosmetics:()=>view.runners.get('you')?.cosmeticKey,pose:()=>view.runners.get('you')?.model.rotation.z,shieldVisible:()=>view.runners.get('you')?.shieldMesh?.visible};` }));
  await page.goto('http://127.0.0.1:'+app.server.address().port);await page.waitForFunction(()=>window.qa);
  await page.locator('#shop-open').click();await page.locator('[data-preview="helmet"]').click();
  await page.mouse.move(220,250);await page.mouse.down();await page.mouse.move(530,390,{steps:8});await page.mouse.up();assert((await page.evaluate(()=>qa.camera())).active);
  await page.waitForFunction(()=>qa.cosmetics()?.includes('helmet'));assert.equal(await page.evaluate(()=>qa.shieldVisible()),false);await page.screenshot({path:'economy-preview.png'});await page.locator('#preview-back').click();
  for(const id of['helmet','shield','speed']){await page.locator('[data-buy="'+id+'"]').click();await page.locator('#purchase-confirm').evaluate(b=>{b.click();b.click()});await page.waitForSelector('#purchase-done');await page.locator('#purchase-done').click();}
  assert.equal((await page.evaluate(()=>qa.profile())).coins,320);await page.locator('[data-equip="helmet"]').click();await page.waitForFunction(()=>qa.profile().equipped.helmet==='helmet');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'economy-shop-mobile.png'});assert(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.locator('#shop-done').click();
  await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>qa.begin());await page.locator('[data-power="speed"]').evaluate(b=>{b.click();b.click()});
  await page.waitForFunction(()=>qa.profile().inventory.speed===0);assert((await page.evaluate(()=>qa.state())).player.speedTime>0);
  await page.evaluate(()=>qa.kill());assert.equal((await page.evaluate(()=>qa.state())).mode,'dying');await page.waitForSelector('#revive',{timeout:30000});
  const before=await page.evaluate(()=>qa.state()),wallet=(await page.evaluate(()=>qa.profile())).coins;assert.equal(wallet,330);await page.screenshot({path:'economy-revival.png'});
  await page.keyboard.press('Escape');assert(await page.locator('#modal').evaluate(e=>e.open));
  await page.locator('#revive').evaluate(b=>{b.click();b.click()});await page.waitForFunction(()=>qa.state().mode==='race');const revived=await page.evaluate(()=>qa.state());
  assert.equal((await page.evaluate(()=>qa.profile())).coins,230);assert.equal(revived.player.cp,1);assert.equal(revived.player.coins,10);assert.equal(revived.player.collected.length,10);assert(revived.player.invincible>0);assert(revived.time>=before.time);assert(!revived.player.eliminated);await page.waitForFunction(()=>qa.pose()===0);
  await page.evaluate(()=>qa.kill());await page.waitForSelector('#revive');assert((await page.locator('#revive').innerText()).includes('125'));
  await page.reload();await page.waitForFunction(()=>window.qa);await page.locator('#play').click();await page.locator('#start-level').click();await page.waitForSelector('#revive');assert.equal((await page.evaluate(()=>qa.state())).mode,'revival');assert((await page.locator('#revive').innerText()).includes('125'));
  await page.locator('#revive').click();await page.waitForFunction(()=>qa.state().mode==='race');assert.equal((await page.evaluate(()=>qa.profile())).coins,105);
  await page.evaluate(()=>qa.kill());await page.waitForSelector('#revive');assert(await page.locator('#revive').isDisabled());assert((await page.locator('#modal-content').innerText()).includes('150'));
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'economy-revival-mobile.png'});assert(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.locator('#end-run').click();await page.waitForSelector('#next-level');assert.equal((await page.evaluate(()=>qa.profile())).coins,105);assert((await page.evaluate(()=>qa.profile())).economyRun.complete);
  await page.evaluate(()=>qa.online());assert(await page.locator('.power-bar').isHidden());assert.deepEqual(errors,[]);
  console.log('Shop, preview orbit, duplicate clicks, powers, paid revival, checkpoint state, pending reload, insufficient funds, mobile layout and online restriction passed.');
 }finally{await browser.close();await app.close()}
})().catch(e=>{console.error(e);process.exit(1)});
