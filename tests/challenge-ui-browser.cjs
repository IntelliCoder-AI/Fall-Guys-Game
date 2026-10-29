const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const sizes=[{width:821,height:462},{width:907,height:510},{width:1280,height:720},{width:800,height:450}];
const out=process.env.BEAN_DASH_UI_REPORT||path.join(os.tmpdir(),'bean-dash-challenge-ui');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const {createGameServer}=await import('../server/index.js');const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const findings=[],checked=[];
 try{for(const viewport of sizes)for(const hasTouch of[false,true]){
  const context=await browser.newContext({viewport,hasTouch}),p=await context.newPage(),tag=`${viewport.width}x${viewport.height}-${hasTouch?'touch':'mouse'}`,errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>localStorage.setItem('bean-dash-profile-v3',JSON.stringify({version:3,courseRevision:7,quality:'low',tutorial:true,unlocked:50,selected:50,name:'Twenty Letter Runner',coins:500,inventory:{shield:1,speed:1,jump:1,magnet:1}})));
  await p.route('**/game.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('dist/game.js','utf8')+`\nwindow.qa={help:showHelp,settings:showSettings,map:showMap,crew:showCrew,shop:()=>shopUI.shop(),brief:()=>intro(level),online:onlineMenu,close:closeModal,race(){startSolo(false,true);mode='race';$('countdown').hidden=true;$('level-intro').hidden=true;syncPowers();syncHUD();},pause,loss(){time=123;finish(false,{reason:'wheel'});},revival(){raceMode='endurance';startSolo(false,true);time=123;player.eliminated=true;showRevival();}};`}));
  await p.goto('http://127.0.0.1:'+app.server.address().port);await p.waitForFunction(()=>window.qa);await p.evaluate(()=>document.fonts.ready);
  async function inspect(screen,root){const result=await p.evaluate(({root})=>{
   const node=document.querySelector(root),bad=[];if(node.scrollWidth>node.clientWidth+2)bad.push('horizontal overflow');
   const buttons=[...node.querySelectorAll('button,input,select,a')].filter(e=>e.checkVisibility({visibilityProperty:true}));
   const name=e=>e.id||e.textContent.trim().slice(0,35)||e.tagName;
   for(const e of buttons){if(e.scrollWidth>e.clientWidth+3&&e.tagName!=='SELECT')bad.push('clipped content: '+name(e));const r=e.getBoundingClientRect();for(const q of buttons.slice(buttons.indexOf(e)+1)){if(e.contains(q)||q.contains(e))continue;const b=q.getBoundingClientRect();if(Math.min(r.right,b.right)-Math.max(r.left,b.left)>2&&Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top)>2)bad.push('overlap: '+name(e)+' / '+name(q));}}
   return bad;
  },{root});findings.push(...result.map(issue=>({tag,screen,issue})));checked.push({tag,screen});}
  await inspect('lobby','#lobby');for(const id of['friends','online','shop-open']){const r=await p.locator('#'+id).boundingBox();if(!r||r.y<58||r.y+r.height>viewport.height)findings.push({tag,screen:'lobby',issue:id+' not fully visible on entry'});}await p.screenshot({path:path.join(out,tag+'-lobby.png')});
  for(const screen of['help','settings','map','crew','shop','brief','online']){
   await p.evaluate(name=>qa[name](),screen);if(['crew','online'].includes(screen))await p.locator('#modal details').evaluateAll(es=>es.forEach(e=>e.open=true));await inspect(screen,'#modal');
   const buttons=p.locator('#modal-content button');if(await buttons.count()){const last=buttons.last();await last.scrollIntoViewIfNeeded();const r=await last.boundingBox();assert(r&&r.y>=0&&r.y+r.height<=viewport.height+1,tag+' '+screen+' last action unreachable');}
   await p.screenshot({path:path.join(out,tag+'-'+screen+'.png')});await p.evaluate(()=>qa.close());
  }
  await p.locator('#about').scrollIntoViewIfNeeded();await p.locator('#about').click();assert.equal(await p.locator('#modal a[href^="http"]').count(),0,'About must not link to other games');assert(!/Subway Surfers|Trackmania|Fall Guys/i.test(await p.locator('#modal-content').innerText()));await inspect('about','#modal');await p.evaluate(()=>qa.close());
  await p.evaluate(()=>qa.race());await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));
  const overlap=await p.evaluate(()=>{const selectors=['header','.hud-left','.hud-right','.hud-bottom','.power-bar','.dpad','.touch-actions'];const boxes=selectors.map(s=>[s,document.querySelector(s).getBoundingClientRect()]);return boxes.flatMap(([s,a],i)=>boxes.slice(i+1).filter(([t,b])=>a.width&&b.width&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2).map(([t])=>s+' / '+t));});
  findings.push(...overlap.map(issue=>({tag,screen:'HUD',issue})));await inspect('HUD','#hud');await p.screenshot({path:path.join(out,tag+'-race.png')});
  await p.evaluate(()=>qa.pause());await inspect('pause','#modal');await p.evaluate(()=>qa.close());
  for(const screen of['loss','revival']){await p.evaluate(name=>qa[name](),screen);await inspect(screen,'#modal');const last=p.locator('#modal-content button').last();await last.scrollIntoViewIfNeeded();const r=await last.boundingBox();assert(r&&r.y>=0&&r.y+r.height<=viewport.height+1,tag+' '+screen+' action unreachable');await p.screenshot({path:path.join(out,tag+'-'+screen+'.png')});await p.evaluate(()=>qa.close());}
  assert.deepEqual(errors,[],tag+' page errors');await context.close();console.log('Checked',tag);
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checked,findings},null,2));assert.deepEqual(findings,[],'UI findings: '+JSON.stringify(findings));console.log('All requested viewports passed; evidence: '+out);
 }finally{await browser.close();await app.close();}
})().catch(e=>{console.error(e);process.exit(1)});
