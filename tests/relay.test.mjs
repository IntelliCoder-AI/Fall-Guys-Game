import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import WebSocket from 'ws';
import {RelayRoom} from '../server/relay-room.js';
import {createGameServer} from '../server/index.js';
import {RELAY,MECHANISMS,relayOffset,stepRelayRunner,relaySpawn,mechanismProgress,relayLayout,relayBeacon,relayCrystals,relayGround,relaySweeperX} from '../dist/relay-rules.js';
import {runnerState} from '../dist/simulation.js';
const setup=(count=2)=>{const room=new RelayRoom();for(let i=0;i<count;i++)room.add({name:'Friend '+i});room.start();room.tick(3.1);return room;};
const tick=(r,seconds)=>{for(let t=0;t<seconds;t+=1/30)r.tick(1/30);};

test('Relay requires real teammates, enforces capacity and isolates economy',()=>{
 const r=new RelayRoom(),a=r.add();r.start();assert.equal(r.phase,'waiting');for(let i=1;i<8;i++)assert(r.add());assert.equal(r.add(),null);r.start();assert.equal(r.players.length,8);assert(r.players.every(p=>!p.isBot));assert.equal(r.mode,'relay');assert.equal(r.energy,2);assert.equal(a.coins,0);
});
test('mechanisms require Shaper authority, stage and energy; duplicate requests charge once',()=>{
 const r=setup(),[a,b]=r.players;
 assert(!r.activate(b.id,'bridge',0));assert(!r.activate(a.id,'bridge',0));r.energy=10;
 assert(!r.activate(a.id,'gate',0));assert(!r.activate(a.id,'bridge',-1));assert(!r.activate(a.id,'__proto__',0));
 assert(r.activate(a.id,'bridge',0));assert.equal(r.energy,7);assert(!r.activate(a.id,'bridge',0));assert.equal(r.energy,7);
 assert.equal(mechanismProgress(r.mechanisms,'bridge',r.clock),0);tick(r,1.7);assert.equal(mechanismProgress(r.mechanisms,'bridge',r.clock),1);
 assert(r.activate(a.id,'gate',0));assert(r.activate(a.id,'wind',0));assert.equal(r.energy,0);
});
test('interactive practice stops storm until move, jump, crystal and Shaper action occur',()=>{
 const r=setup(),p=r.players[1];tick(r,2);assert.equal(r.storm,120);
 Object.assign(p,{x:0,z:-10});r.input(p.id,{dz:-1,jump:true});r.tick(1/30);assert(r.tutorial.energy);assert(r.tutorial.jumped);
 for(let i=0;i<10;i++){r.input(p.id,{dz:-1});r.tick(1/30);}assert(r.tutorial.moved);
 assert(r.activate(r.shaperId,'bridge',0));tick(r,.1);assert(r.tutorialDone);assert(r.storm<120);
});
test('falls recover upright without duplicating shared crystals or wallet rewards',()=>{
 const r=setup(),p=r.players[1];Object.assign(p,{x:0,z:-10});r.tick(1/30);assert.equal(r.energy,4);
 Object.assign(p,{x:20,y:-7});r.tick(1/30);assert(p.eliminated);assert(p.recoverAt>0);tick(r,1.5);
 assert.equal(p.recoveries,1);assert.equal(p.y,0);assert(p.grounded);assert(!p.eliminated);assert.equal(p.deathReason,null);assert(p.invincible>0);
 Object.assign(p,{x:0,z:-10});r.tick(1/30);assert.equal(r.energy,4);assert.equal(p.coins,0);
});
test('actual physics: missing bridge falls, low barriers block until jumping, gates cannot be bypassed',()=>{
 const p=runnerState(),m={bridge:null,gate:null,wind:null};relaySpawn(p,0);p.x=0;p.z=-15;
 for(let i=0;i<90;i++)stepRelayRunner(p,{dz:-1},1/30,0,m,i/30);
 assert(p.z>=-17.31);for(let i=0;i<25;i++)stepRelayRunner(p,{dz:-1,jump:i===0},1/30,0,m,3+i/30);assert(p.z<-18.7);
 p.z=-28;p.x=0;p.y=0;p.vy=0;let fell=false;
 for(let i=0;i<150;i++)if(stepRelayRunner(p,{dz:-1},1/30,0,m,5+i/30).includes('fall')){fell=true;break;}assert(fell);
 relaySpawn(p,0);p.x=0;p.z=-76;for(let i=0;i<100;i++)stepRelayRunner(p,{dz:-1,jump:i%30===0},1/30,0,m,10+i/30);assert(p.z>=-79.31);
});
test('all Runners must arrive; roles rotate, late joiners promote and stale commands fail',()=>{
 const r=setup(3),prior=r.shaperId,late=r.add({name:'Late'});assert(late.spectator);r.energy=10;for(const k of relayLayout(0).order)r.activate(prior,k,0);r.seals=new Set([0,1]);tick(r,2);
 Object.assign(r.players[1],{x:0,z:-relayBeacon(),y:0});r.tick(1/30);assert(r.players[1].ready);assert.equal(r.transition,0);
 Object.assign(r.players[2],{x:0,z:-relayBeacon(),y:0});r.tick(1/30);assert(r.transition>0);tick(r,4.1);
 assert.equal(r.stage,1);assert.notEqual(r.shaperId,prior);assert.equal(r.spectators.length,0);assert(!late.spectator);assert.equal(r.active().length,4);
 assert(!r.activate(prior,'bridge',0));assert(!r.activate(r.shaperId,'bridge',0));assert.equal(r.players[0].role,'runner');
});
test('disconnects transfer host and Shaper; missing teammate pauses storm; arrivals unblock countdown',()=>{
 const r=setup(3),[a,b,third]=r.players;r.tutorialDone=true;r.remove(a.id);assert.equal(r.hostId,b.id);assert.equal(r.shaperId,b.id);tick(r,.1);assert(!r.paused);
 r.remove(third.id);const time=r.storm;tick(r,10);assert(r.paused);assert.equal(r.storm,time);
 const joined=r.add({name:'Replacement'});assert(!joined.spectator);assert.equal(joined.role,'runner');tick(r,.1);assert(!r.paused);assert(r.storm<time);const before=joined.z;r.input(joined.id,{dz:-1});tick(r,.1);assert(joined.z<before);
 const c=new RelayRoom();const x=c.add(),y=c.add();c.start();c.remove(x.id);c.tick(1);assert(c.paused);c.add();tick(c,3.1);assert.equal(c.phase,'race');assert.equal(c.shaperId,y.id);
});
test('real 30Hz inputs complete three islands with 2, 3 and 8 players; timeout and same-code retry work',()=>{
 for(const n of[2,3,8]){
  const r=setup(n),shapers=new Set();
  for(let frame=0;frame<12000&&r.phase==='race';frame++){
   shapers.add(r.shaperId);
   for(const key of relayLayout(r.stage).order)r.activate(r.shaperId,key,r.stage);
   for(const p of r.active().filter(p=>p.role==='runner'&&!p.ready)){
    const d=-p.z-relayOffset(r.stage),x=p.x,l=relayLayout(r.stage);
    const missing=l.seals.find((_,i)=>!r.seals.has(i));
    const target=missing&&d>missing.d-10?missing:{x:0,d:relayBeacon()};
    const wait=(d>l.bridge-3&&d<l.bridge+1&&mechanismProgress(r.mechanisms,'bridge',r.clock)<1)||(l.lift&&d>l.lift-3&&d<l.lift+1&&mechanismProgress(r.mechanisms,'lift',r.clock)<1);
    r.input(p.id,{dz:wait?0:Math.abs(d-target.d)<.25?0:d<target.d?-1:1,dx:Math.abs(x-target.x)>.12?Math.max(-1,Math.min(1,(target.x-x)*1.5)):0,jump:l.hurdles.some(h=>d>h-4&&d<h)||l.sweepers.some(h=>d>h-4&&d<h)});
   }r.tick(1/30);
  }
  assert.equal(r.reason,'rescued',JSON.stringify({n,stage:r.stage,energy:r.energy,players:r.players.map(p=>({z:p.z,x:p.x,y:p.y,ready:p.ready})),phase:r.phase,storm:r.storm}));
  assert.equal(shapers.size,Math.min(n,3));assert(r.storm>0);assert(r.players.every(p=>p.coins===0));
  const id=r.id;assert(!r.rematch('forged'));assert(r.rematch(r.hostId));assert.equal(r.id,id);r.start();r.tick(3.1);r.tutorialDone=true;r.storm=.01;r.tick(1/30);assert.equal(r.reason,'storm');
 }
});
const until=(ws,test)=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{ws.off('message',listener);reject(Error('Timed out'));},5000);function listener(raw){const s=JSON.parse(raw);if(test(s)){clearTimeout(timeout);ws.off('message',listener);resolve(s);}}ws.on('message',listener);});
test('WebSocket Relay: separate clients, synchronized mechanisms, socket-bound authority and late joins',async()=>{
 const app=createGameServer();app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const clients=Array.from({length:3},()=>new WebSocket(`ws://127.0.0.1:${app.server.address().port}/ws`));
 try{
  await Promise.all(clients.map(ws=>once(ws,'open')));
  const join=async(i,data)=>{const reply=until(clients[i],s=>s.type==='joined');clients[i].send(JSON.stringify({type:'join',protocol:5,...data}));return reply;};
  const a=await join(0,{mode:'relay',action:'create'}),b=await join(1,{room:a.room}),r=app.rooms.get(a.room);
  clients[0].send(JSON.stringify({type:'start'}));await until(clients[1],s=>s.phase==='countdown');r.tick(3.1);r.energy=10;
  clients[1].send(JSON.stringify({type:'mechanism',id:a.id,key:'bridge',stage:0}));await until(clients[1],s=>s.phase==='race');assert.equal(r.mechanisms.bridge,null);
  clients[0].send(JSON.stringify({type:'mechanism',key:'bridge',stage:0}));const s=await until(clients[1],s=>s.relay?.mechanisms.bridge!==null&&s.relay?.mechanisms.bridge!==undefined);assert.equal(s.relay.energy,7);
  const outdated=until(clients[2],s=>s.type==='error');clients[2].send(JSON.stringify({type:'join',room:a.room}));assert.match((await outdated).message,/Refresh/);
  const late=await join(2,{room:a.room});assert(r.findPlayer(late.id).spectator);assert.notEqual(a.id,b.id);clients[0].close(1000);await until(clients[1],s=>s.relay?.shaperId===b.id);assert.equal(r.hostId,b.id);
 }finally{clients.forEach(ws=>ws.close());await app.close();}
});

test('repeated arrivals and departures do not accumulate disconnected runner records',()=>{
 const r=setup();for(let i=0;i<100;i++){const p=r.add({name:'Visitor'});r.remove(p.id);}assert.equal(r.players.length,2);assert.equal(r.spectators.length,0);
});

test('host can start as Runner; teammate receives machinery authority',()=>{
 const r=new RelayRoom(),host=r.add({name:'Host'}),friend=r.add({name:'Friend'});assert.equal(r.snapshot().relay.hostRoleChoice,true);r.start({hostRole:'runner'});r.tick(3.1);assert.equal(host.role,'runner');assert.equal(friend.role,'shaper');const z=host.z;r.input(host.id,{dz:-1,jump:true});r.tick(.1);assert(host.z<z);assert(host.y>0);r.energy=4;assert(!r.activate(host.id,'bridge',0));assert(r.activate(friend.id,'bridge',0));
});

test('timed machinery expires, warns and reopens without another energy charge',()=>{
 const r=setup();r.energy=10;assert(r.activate(r.shaperId,'bridge',0));const paid=r.energy;tick(r,1.7);assert.equal(mechanismProgress(r.mechanisms,'bridge',r.clock),1);assert(!r.activate(r.shaperId,'bridge',0));tick(r,9);assert.equal(mechanismProgress(r.mechanisms,'bridge',r.clock),0);assert(r.activate(r.shaperId,'bridge',0));assert.equal(r.energy,paid);
});
test('three stage layouts reorder devices and align ground and gate collision',()=>{
 assert.deepEqual(relayLayout(0).order,['bridge','gate','wind']);assert.deepEqual(relayLayout(1).order,['gate','wind','bridge']);assert.deepEqual(relayLayout(2).order,['wind','bridge','gate','lift']);
 for(let stage=0;stage<3;stage++){const l=relayLayout(stage),p=runnerState();relaySpawn(p,stage);p.x=0;p.z=-relayOffset(stage)-l.gate+4;for(let i=0;i<90;i++)stepRelayRunner(p,{dz:-1},1/30,stage,{bridge:null,gate:null,wind:null},i/30);assert(p.z>=-relayOffset(stage)-l.gate+.69);}
});

test('side-route seals are required, shared once, and recoveries cannot duplicate them',()=>{
 const r=setup(),p=r.players[1],l=relayLayout(0);r.energy=10;for(const key of l.order)r.activate(r.shaperId,key,0);
 Object.assign(p,{x:0,z:-relayBeacon()});r.tick(1/30);assert(!p.ready);assert.equal(r.transition,0);
 for(const seal of l.seals){Object.assign(p,{x:seal.x,y:0,z:-seal.d});r.tick(1/30);}assert.equal(r.seals.size,2);assert.equal(r.energy,4);
 for(const seal of l.seals){Object.assign(p,{x:seal.x,y:0,z:-seal.d});r.tick(1/30);}assert.equal(r.energy,4);
 Object.assign(p,{x:0,z:-relayBeacon()});r.tick(1/30);assert(p.ready);
});
test('final rescue lift has matching timed collision and cannot be purchased on earlier islands',()=>{
 const r=setup();r.energy=20;assert(!r.activate(r.shaperId,'lift',0));
 const l=relayLayout(2);assert(!relayGround(0,l.lift+5,1,2,0));assert(relayGround(0,l.lift+5,1,2,1));assert(!relayGround(4,l.lift+5,1,2,1));
 r.stage=2;for(const key of l.order)assert(r.activate(r.shaperId,key,2));assert.equal(r.energy,8);tick(r,1.6);assert.equal(mechanismProgress(r.mechanisms,'lift',r.clock),1);tick(r,7);assert.equal(mechanismProgress(r.mechanisms,'lift',r.clock),0);
});
test('moving sentinels apply an impact, grace period and no invisible hits above their heads',()=>{
 const p=runnerState(),l=relayLayout(1),clock=2;relaySpawn(p,1);p.invincible=0;p.x=relaySweeperX(clock,0,1);p.z=-relayOffset(1)-l.sweepers[0];
 assert(stepRelayRunner(p,{},1/30,1,{},clock).includes('hit'));assert.equal(p.hits,1);assert(p.invincible>0);
 assert(!stepRelayRunner(p,{},1/30,1,{},clock).includes('hit'));p.invincible=0;p.y=2;p.z=-relayOffset(1)-l.sweepers[0];assert(!stepRelayRunner(p,{},1/30,1,{},clock).includes('hit'));
});
test('transient disconnect freezes timer, machinery and role until authenticated recovery or expiry',()=>{
 const r=setup(),[a,b]=r.players;r.energy=10;r.activate(a.id,'bridge',0);tick(r,2);r.tutorialDone=true;
 const state={storm:r.storm,clock:r.clock,x:b.x,z:b.z,stage:r.stage,energy:r.energy};r.suspend(b.id,5000);tick(r,10);
 assert(r.paused);assert.equal(r.storm,state.storm);assert.equal(r.clock,state.clock);assert.equal(r.shaperId,a.id);assert.equal(r.findPlayer(b.id),b);
 assert.equal(r.resume(b.id),b);tick(r,.1);assert(!r.paused);assert.equal(r.energy,state.energy);assert.equal(b.z,state.z);assert(r.storm<state.storm);
 r.suspend(a.id,100);r.expireSuspensions(101);assert.equal(r.findPlayer(a.id),undefined);assert.equal(r.shaperId,b.id);assert.equal(r.hostId,b.id);
});
test('WebSocket Relay resumes the same identity and state; forged, reused and expired tokens fail',async()=>{
 let clock=1000;const app=createGameServer({now:()=>clock,resumeGraceMs:2000});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const url=`ws://127.0.0.1:${app.server.address().port}/ws`,clients=[];
 const open=async()=>{const ws=new WebSocket(url);clients.push(ws);await once(ws,'open');return ws;};
 const exchange=async(ws,data,type)=>{const promise=until(ws,s=>s.type===type);ws.send(JSON.stringify(data));return promise;};
 try{
  const a=await open(),b=await open();const first=await exchange(a,{type:'join',protocol:5,action:'create',mode:'relay',name:'Host'},'joined');assert.match(first.resumeToken,/^[a-f0-9]{64}$/);
  await exchange(b,{type:'join',protocol:5,room:first.room,name:'Friend'},'joined');const room=app.rooms.get(first.room);room.start({hostRole:'runner'});room.tick(3.1);room.tutorialDone=true;room.energy=19;const player=room.findPlayer(first.id);player.z=-60;room.seals.add(0);
  const attacker=await open();assert.match((await exchange(attacker,{type:'resume',protocol:5,room:first.room,token:'e'.repeat(64)},'error')).message,/could not/);
  const gone=once(a,'close');a.terminate();await gone;await until(b,s=>s.relay?.reconnecting===1);const storm=room.storm;
  const replacement=await open();const resumed=await exchange(replacement,{type:'resume',protocol:5,room:first.room,token:first.resumeToken},'joined');assert.equal(resumed.id,first.id);assert(resumed.resumed);assert.notEqual(resumed.resumeToken,first.resumeToken);assert.match((await exchange(attacker,{type:'resume',protocol:5,room:first.room,token:first.resumeToken},'error')).message,/could not/);assert.equal(room.findPlayer(first.id),player);assert.equal(player.z,-60);assert.equal(room.energy,19);assert(room.seals.has(0));assert.equal(room.storm,storm);assert(!JSON.stringify(room.snapshot()).includes(first.resumeToken));
  assert.match((await exchange(attacker,{type:'resume',protocol:5,room:first.room,token:'f'.repeat(64)},'error')).message,/could not/);
  const closed=once(replacement,'close');replacement.terminate();await closed;await until(b,s=>s.relay?.reconnecting===1);clock+=2100;await new Promise(r=>setTimeout(r,70));assert.equal(room.findPlayer(first.id),undefined);assert.match((await exchange(attacker,{type:'resume',protocol:5,room:first.room,token:resumed.resumeToken},'error')).message,/could not/);
 }finally{clients.forEach(ws=>ws.close(1000));await app.close();}
});

test('authenticated recovery replaces a stalled socket atomically and rotates the token',async()=>{
 const app=createGameServer();app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const url=`ws://127.0.0.1:${app.server.address().port}/ws`,clients=[];
 const open=async()=>{const ws=new WebSocket(url);clients.push(ws);await once(ws,'open');return ws;};
 const exchange=async(ws,data,type)=>{const promise=until(ws,s=>s.type===type);ws.send(JSON.stringify(data));return promise;};
 try{
  const original=await open(),friend=await open();const joined=await exchange(original,{type:'join',protocol:5,mode:'relay',action:'create'},'joined');
  await exchange(friend,{type:'join',protocol:5,room:joined.room},'joined');const room=app.rooms.get(joined.room);room.start({hostRole:'runner'});room.tick(3.1);const p=room.findPlayer(joined.id);p.z=-55;room.energy=12;
  const replacement=await open(),closed=once(original,'close');const recovered=await exchange(replacement,{type:'resume',protocol:5,room:joined.room,token:joined.resumeToken},'joined');await closed;
  assert.equal(room.findPlayer(joined.id),p);assert(p.connected);assert.equal(room.suspended.size,0);assert.equal(room.players.length,2);assert.equal(room.energy,12);assert.equal(p.z,-55);assert.notEqual(recovered.resumeToken,joined.resumeToken);
  const forged=await open();assert.match((await exchange(forged,{type:'resume',protocol:5,room:joined.room,token:joined.resumeToken},'error')).message,/could not/);
  await until(replacement,s=>s.type==='state'&&!s.relay.paused);replacement.send(JSON.stringify({type:'input',dz:-1}));await until(friend,s=>s.players.some(p=>p.id===joined.id&&p.z<-55));
 }finally{clients.forEach(ws=>ws.close(1000));await app.close();}
});
