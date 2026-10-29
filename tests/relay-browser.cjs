const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out='/workspace/bean-dash-relay';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const {createGameServer}=await import('../server/index.js');const {relayLayout}=await import('../dist/relay-rules.js');const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const waitFor=async test=>{const end=Date.now()+15000;while(!test()){if(Date.now()>end)throw Error('server condition timed out');await new Promise(r=>setTimeout(r,30));}};
 const url='http://127.0.0.1:'+app.server.address().port;let pages=[];
 try{
  const contexts=await Promise.all([browser.newContext({viewport:{width:1280,height:720}}),browser.newContext({viewport:{width:390,height:700},hasTouch:true}),browser.newContext({viewport:{width:821,height:462},hasTouch:true})]);
  pages=await Promise.all(contexts.map(c=>c.newPage()));const[a,b,c]=pages,errors=[];
  for(const [i,p]of pages.entries()){
   p.setDefaultTimeout(60000);p.setDefaultNavigationTimeout(120000);p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(name=>localStorage.setItem('bean-dash-profile-v3',JSON.stringify({quality:'low',tutorial:true,name,coins:300,unlocked:1,selected:1})),['Alex','Sam','Jules'][i]);
   await p.route('**/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('dist/game.js','utf8')+'\nwindow.relayQA={camera:()=>({z:view.camera.position.z,pose:view.runners.get(myId)?.model.rotation.z}),quality:q=>view.quality(q),draws:()=>view.renderer.info.render.calls};'}));
   await p.goto(url);await p.waitForFunction(()=>window.beanDash);
  }
  console.log('3 browser clients initialized');
  await a.locator('#friends').click();await a.locator('#create-relay').click();await a.waitForSelector('#room-code');
  const code=await a.locator('#room-code').innerText(),room=app.rooms.get(code),tick=room.tick.bind(room);room.tick=()=>{};
  await b.locator('#friends').click();await b.locator('#join-code').fill(code);await b.locator('#join-room-form button').click();await b.waitForSelector('#room-code');
  await a.waitForFunction(()=>!document.querySelector('#start-room').disabled);await a.locator('#relay-start-role').selectOption('shaper');await a.locator('#start-room').click();await a.waitForFunction(()=>beanDash.getState().phase==='countdown');tick(3.1);
  await b.waitForFunction(()=>beanDash.getState().mode==='race');await a.waitForSelector('#relay-mechanisms:not([hidden])');assert.equal(await a.locator('#relay-role').innerText(),'Shaper');assert.equal(await b.locator('#relay-role').innerText(),'Runner');assert.equal(await b.locator('#relay-clock').innerText(),'Practice');
  assert(await a.locator('[data-mechanism=bridge]').isDisabled());
  const runner=room.players.find(p=>p.name==='Sam');Object.assign(runner,{x:0,z:-10});tick(1/30);await a.waitForFunction(()=>beanDash.getState().relay.energy===4);
  await a.locator('[data-mechanism=bridge]').click();await b.waitForFunction(()=>beanDash.getState().relay.mechanisms.bridge!==null);assert.equal(room.energy,1);
  // Real touch input travels through the client socket to the authoritative simulation.
  const jump=await b.locator('[data-key=Space]').boundingBox();await b.touchscreen.tap(jump.x+jump.width/2,jump.y+jump.height/2);await waitFor(()=>runner.input.jump);tick(1/30);assert(room.tutorial.jumped);
  const forward=await b.locator('[data-key=KeyW]').boundingBox();await b.mouse.move(forward.x+forward.width/2,forward.y+forward.height/2);await b.mouse.down();await waitFor(()=>runner.input.dz<0);tick(.06);await b.mouse.up();assert(runner.z<-10);
  console.log('Roles, crystal, Shaper command and mobile input passed');
  Object.assign(runner,{x:20,y:-7});tick(1/30);await b.waitForFunction(()=>beanDash.getState().mode==='recovering');tick(1.5);await b.waitForFunction(()=>beanDash.getState().mode==='race');assert.equal(runner.recoveries,1);await b.waitForFunction(()=>Math.abs(relayQA.camera().pose||0)<.01);
  // Late joiners watch; they can neither collect nor operate machinery.
  await c.goto(url+'/?room='+code);await c.waitForSelector('#join-code');await c.locator('#join-room-form button').click();await c.waitForFunction(()=>beanDash.getState().mode==='spectating');assert(room.spectators.some(p=>p.name==='Jules'));
  await a.screenshot({path:out+'/shaper-desktop.png'});await b.screenshot({path:out+'/runner-mobile.png'});await c.screenshot({path:out+'/spectator-landscape.png'});
  // Check bounds and disjoint reserved UI bands at each requested viewport.
  const sizes=[[320,568],[390,700],[412,844],[568,320],[821,462],[907,510],[1280,720],[800,450],[1024,768]];
  const layouts=[];for(const p of[a,b])for(const[width,height]of sizes){await p.setViewportSize({width,height});const result=await p.evaluate(()=>{
   const rect=s=>{const e=document.querySelector(s);if(!e||!e.getClientRects().length||getComputedStyle(e).display==='none')return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};
   return {top:rect('.relay-top'),dock:rect('.relay-dock'),pause:rect('#pause'),touch:rect('#touch'),dpad:rect('.dpad'),actions:rect('.touch-actions'),buttons:[...document.querySelectorAll('#relay-ui button')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent,clipped:e.scrollWidth>e.clientWidth+2};})};
  });
   for(const r of[result.top,result.dock,result.pause,...result.buttons].filter(Boolean)){assert(r.x>=-1&&r.y>=-1&&r.x+r.w<=width+1&&r.y+r.h<=height+1,JSON.stringify({width,height,r}));assert(!r.clipped,JSON.stringify(r));}
   assert(result.top.y+result.top.h<result.dock.y,JSON.stringify({width,height,result}));
   if(result.touch&&p===b)for(const control of[result.dpad,result.actions]){const d=result.dock;assert(d.x+d.w<=control.x+1||control.x+control.w<=d.x+1||d.y+d.h<=control.y+1||control.y+control.h<=d.y+1,JSON.stringify({width,height,result}));}layouts.push({width,height,role:p===a?'Shaper':'Runner',...result});
  }
  fs.writeFileSync(out+'/layouts.json',JSON.stringify(layouts,null,2));await a.setViewportSize({width:1280,height:720});await b.setViewportSize({width:390,height:700});
  // Advance all three checkpoint transitions using server state; physics traversal is tested separately.
  for(let stage=0;stage<3;stage++){
   room.energy=20;for(const key of relayLayout(stage).order)room.activate(room.shaperId,key,stage);tick(2);
   for(const p of room.active().filter(p=>p.role==='runner'))Object.assign(p,{x:0,y:0,vy:0,z:-stage*112-109});tick(1/30);
   if(stage<2){tick(4.1);await a.waitForFunction(n=>beanDash.getState().relay.stage===n,stage+1);await b.waitForFunction(n=>beanDash.getState().relay.stage===n,stage+1);}
  }
  await a.waitForSelector('#relay-rematch');await b.waitForSelector('#relay-leave');assert.equal(room.reason,'rescued');assert(!room.spectators.length);await a.screenshot({path:out+'/team-result.png'});
  await a.locator('#relay-rematch').click();await a.waitForSelector('#room-code');assert.equal(await a.locator('#room-code').innerText(),code);
  await a.locator('#relay-start-role').selectOption('shaper');await a.locator('#start-room').click();await a.waitForFunction(()=>beanDash.getState().phase==='countdown');tick(3.1);await b.waitForFunction(()=>beanDash.getState().mode==='race');
  // Shaper leaves: authority moves to an actual connected player and UI reflects it.
  await a.locator('#pause').click();await a.locator('#quit').click();await b.waitForFunction(()=>beanDash.getState().mode==='spectating');assert.equal(room.shaperId,room.players.find(p=>p.name==='Sam').id);assert.equal(await b.locator('#relay-role').innerText(),'Shaper');
  assert.equal(await a.locator('#wallet').innerText(),'300');assert.equal((await a.evaluate(()=>beanDash.getState())).level,1);assert.equal(await a.locator('#relay-ui').isVisible(),false);
  // Both graphics settings use the same valid geometry and restored camera.
  for(const q of['auto','low']){await b.evaluate(q=>relayQA.quality(q),q);await b.screenshot({path:out+'/quality-'+q+'.png'});}
  await b.locator('#relay-help').click();assert((await b.locator('#modal-content').innerText()).includes('three glowing beacons'));await b.locator('#relay-help-close').click();
  assert.deepEqual(errors,[]);console.log({multiClient:true,mobileControls:true,roles:true,recovery:true,lateJoin:true,threeBeacons:true,disconnect:true,rematch:true,walletPreserved:true,layouts:layouts.length,drawCalls:await b.evaluate(()=>relayQA.draws()),pageErrors:errors,evidence:out});
 }catch(e){for(const[i,p]of pages.entries()){try{console.log('Client',i,await p.evaluate(()=>({state:window.beanDash?.getState(),modal:document.querySelector('#modal-content')?.innerText})));await p.screenshot({path:out+'/failure-'+i+'.png'});}catch{}}throw e;
 }finally{await browser.close();await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
