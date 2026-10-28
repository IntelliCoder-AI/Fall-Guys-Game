const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const {createGameServer}=await import('../server/index.js'),app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:390,height:700},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('bean-dash-profile-v3',JSON.stringify({version:3,quality:'low',tutorial:true,coins:500,inventory:{shield:1,speed:1,jump:1,magnet:1}})));
 await page.route('**/game.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('dist/game.js','utf8')+`\nwindow.qa={race(){startSolo(false);mode='race';$('countdown').hidden=true;$('level-intro').hidden=true;syncPowers();}};`}));
 await page.goto('http://127.0.0.1:'+app.server.address().port);await page.waitForFunction(()=>window.qa);await page.evaluate(()=>document.fonts.ready);
 for(const size of[{width:320,height:640},{width:390,height:700},{width:412,height:844}]){
  await page.setViewportSize(size);await page.evaluate(()=>document.getElementById('lobby').scrollTop=0);
  const layout=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {header:r('header').bottom,lobby:r('#lobby').top,caption:r('.runner-caption').bottom,hero:r('.hero').top,brand:r('.brand').right,actions:r('.header-right').left,overflow:document.querySelector('#lobby').scrollWidth>innerWidth}});
  await page.screenshot({path:'mobile-preview-'+size.width+'.png'});assert(layout.lobby>=layout.header);assert(layout.hero>=layout.caption+12);assert(layout.brand<layout.actions);assert(!layout.overflow);assert.equal(await page.locator('.camera-guide').count(),0);
  await page.locator('#online').scrollIntoViewIfNeeded();assert((await page.locator('#online').boundingBox()).y>=76);await page.screenshot({path:'mobile-lobby-'+size.width+'.png'});
  await page.evaluate(()=>qa.race());await page.waitForTimeout(400);
  const bad=await page.evaluate(()=>{const selectors=['header','.hud-left','.hud-right','.hud-bottom','.power-bar','.dpad','.touch-actions'];const boxes=selectors.map(s=>[s,document.querySelector(s).getBoundingClientRect()]);const overlaps=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const[a,r]=boxes[i],[b,t]=boxes[j];if(r.left<t.right&&r.right>t.left&&r.top<t.bottom&&r.bottom>t.top)overlaps.push(a+' / '+b);}return overlaps;});assert.deepEqual(bad,[],JSON.stringify(size));await page.screenshot({path:'mobile-race-'+size.width+'.png'});
  await page.locator('#nav-play').evaluate(b=>b.click());
 }
 assert.deepEqual(errors,[]);console.log('Mobile header, scrolling lobby, preview, HUD, power buttons and touch controls do not overlap at 320, 390 and 412 pixels.');
 }finally{await browser.close();await app.close()}})().catch(e=>{console.error(e);process.exit(1)});
