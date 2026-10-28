const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const {createGameServer}=await import('../server/index.js');const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('bean-dash-profile-v3',JSON.stringify({version:3,tutorial:true,quality:'low'})));
 await page.route('**/game.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('dist/game.js','utf8')+'\nwindow.qa={camera:()=>({...view.cameraInput,position:view.camera.position.toArray()}),input:()=>readInput()};'}));
 await page.goto('http://127.0.0.1:'+app.server.address().port);await page.waitForFunction(()=>window.qa);await page.evaluate(()=>document.fonts.ready);
 for(const size of[{width:1440,height:900},{width:1280,height:720},{width:1040,height:414},{width:390,height:844}]){
  await page.setViewportSize(size);await page.waitForTimeout(200);
  const layout=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {gap:r('.guest-strip').top-r('.play-caption').bottom,buttonFont:parseFloat(getComputedStyle(document.querySelector('#online')).fontSize),overflow:document.querySelector('.hero').scrollWidth>document.querySelector('.hero').clientWidth};});assert(layout.gap>=16&&layout.gap<30,JSON.stringify(layout));assert(layout.buttonFont>=14);assert(!layout.overflow);
 }
 await page.setViewportSize({width:1440,height:900});await page.screenshot({path:'v9-lobby.png'});
 await page.mouse.move(760,340);await page.mouse.down();await page.mouse.move(1200,620,{steps:12});await page.mouse.up();let state=await page.evaluate(()=>qa.camera());assert(state.active);assert(Math.abs(state.yaw)>2);assert(state.pitch>1.5);
 const zoom=state.zoom;await page.mouse.wheel(0,-300);await page.waitForTimeout(300);assert((await page.evaluate(()=>qa.camera())).zoom<zoom);
 await page.keyboard.press('KeyC');assert(!(await page.evaluate(()=>qa.camera())).active);
 await page.locator('#customize').click();await page.mouse.move(300,240);await page.mouse.down();await page.mouse.move(650,420,{steps:8});await page.mouse.up();assert((await page.evaluate(()=>qa.camera())).active,'wardrobe backdrop must accept orbit');await page.screenshot({path:'v9-wardrobe.png'});await page.locator('#custom-done').click();
 await page.locator('#play').click();await page.locator('#start-level').click();await page.waitForFunction(()=>beanDash.getState().mode==='race',null,{timeout:120000});
 await page.mouse.move(700,360);await page.mouse.down();await page.mouse.move(900,360,{steps:8});await page.mouse.up();await page.keyboard.down('KeyW');const movement=await page.evaluate(()=>qa.input());await page.keyboard.up('KeyW');assert(Math.abs(movement.dx)>.5,'movement must follow camera yaw');assert.deepEqual(errors,[]);console.log('Flow layout, typography, full orbit, zoom, reset, wardrobe drag, and camera-relative movement passed.');
 }finally{await browser.close();await app.close()}})().catch(e=>{console.error(e);process.exit(1)});
