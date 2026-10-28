import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfileStore} from '../dist/profile.js';
import {revivalPrice} from '../dist/economy.js';
import {runnerState,stepRunner,reviveRunner} from '../dist/simulation.js';
import {buildLevel,obstaclePosition} from '../dist/levels.js';
import {RaceRoom} from '../server/rooms.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};
function funded(){const storage=memory(),p=createProfileStore(storage);p.record(1,100,false,{coins:500});return {storage,p};}
const snapshot=()=>({level:1,mode:'tour',time:40,cp:1,coins:12,collected:[0,1,2],hits:2,falls:1,powers:{speedTime:4}});

test('purchases are affordable, idempotent, persistent and isolated by browser',()=>{
 const {storage,p}=funded();assert(p.purchase('helmet','one').ok);assert.equal(p.get().coins,380);
 assert(!p.purchase('helmet','one').ok);assert(!p.purchase('helmet','two').ok);assert(!p.purchase('missing','three').ok);
 assert(p.equip('helmet'));assert(!p.equip('wings'));const reload=createProfileStore(storage);
 assert.equal(reload.get().coins,380);assert.equal(reload.get().equipped.helmet,'helmet');assert.equal(createProfileStore(memory()).get().coins,0);
 assert(p.purchase('aurora','four').ok);assert(p.purchase('wings','five').ok);const before=p.get();
 assert.equal(p.purchase('trail','six').reason,'insufficient coins');assert.deepEqual(p.get(),before);
});
test('supply chests have four equal reward intervals and do not charge twice',()=>{
 const {p}=funded();for(const [i,value]of[0,.25,.5,.75].entries()){const r=p.purchase('chest','chest-'+i,()=>value);assert(r.ok);assert.equal(r.reward,['shield','speed','jump','magnet'][i]);}
 assert.deepEqual(p.get().inventory,{shield:1,speed:1,jump:1,magnet:1});assert.equal(p.get().coins,400);assert(!p.purchase('chest','chest-0').ok);
});
test('cross-tab stores rebase changes and failed storage retains session progress',()=>{
 const {storage,p}=funded(),other=createProfileStore(storage);p.purchase('helmet','one');other.purchase('wings','two');p.update({name:'Fresh'});
 assert.equal(other.get().coins,230);assert.deepEqual(other.get().owned,['helmet','wings']);
 let fail=false;const flaky={getItem:storage.getItem,setItem(k,v){if(fail)throw Error('quota');storage.setItem(k,v)}};
 const session=createProfileStore(flaky);fail=true;session.purchase('shield','session');assert.equal(session.get().coins,195);assert(!session.isPersistent());
});
test('coins bank once, cap at 500, and finish pays only the uncredited bonus',()=>{
 const p=createProfileStore(memory()),id=p.beginEconomyRun(1,'tour');assert.equal(p.creditRun(id,12),12);assert.equal(p.creditRun(id,12),0);assert.equal(p.creditRun(id,3),0);
 const reward=p.record(1,100,true,{coins:12,runId:id});assert.equal(reward.reward,22);assert.equal(p.get().coins,34);
 assert(!p.record(1,100,true,{coins:12,runId:id}).accepted);assert.equal(p.creditRun(id,100),0);
 const next=p.beginEconomyRun(2,'tour');assert.equal(p.creditRun(next,9999),500);assert.equal(p.record(2,100,true,{coins:9999,runId:next}).reward,0);
 const third=p.beginEconomyRun(1,'tour');assert(!p.record(2,100,true,{runId:third}).accepted);
});
test('revival preserves checkpoint, score, collection IDs and escalating cost across reload',()=>{
 const {storage,p}=funded(),id=p.beginEconomyRun(1,'tour'),s=snapshot();p.creditRun(id,s.coins);
 let offer=p.offerRevival(id,s);assert.deepEqual(p.offerRevival(id,{...s,coins:100}),offer);
 const reload=createProfileStore(storage);assert.deepEqual(reload.getRun(),s);
 const first=reload.revive(id,offer.token);assert(first.ok);assert.equal(first.cost,100);assert.deepEqual(first.snapshot,s);
 assert(!reload.revive(id,offer.token).ok);assert.equal(reload.get().coins,412);
 offer=reload.offerRevival(id,s);assert.equal(reload.revive(id,offer.token).cost,150);
 offer=reload.offerRevival(id,s);assert.equal(reload.revive(id,offer.token).cost,225);
 offer=reload.offerRevival(id,s);assert.equal(offer.cost,338);const before=reload.get();assert(!reload.revive(id,offer.token).ok);assert.deepEqual(reload.get(),before);
 reload.beginEconomyRun(1,'tour');assert(!reload.revive(id,offer.token).ok);assert.deepEqual([0,1,2,3].map(revivalPrice),[100,150,225,338]);
});
test('revival start fallback, protection expiry and checkpoint coins cannot be farmed',()=>{
 const level=2,h=buildLevel(level).hazards.find(h=>h.type==='wheel'),pos=obstaclePosition(h,0,level),b={...runnerState(),cp:0,coins:2,collected:[0,1],eliminated:true,hits:3};
 reviveRunner(b,level);assert.equal(b.z,4);assert.equal(b.invincible,3);assert.equal(b.hits,3);assert.deepEqual(b.collected,[0,1]);
 Object.assign(b,{x:pos.x,z:pos.z});assert(!stepRunner(b,{},1/60,0,level).includes('death'));
 b.invincible=.001;assert(stepRunner(b,{},1/60,0,level).includes('death'));
 const c=buildLevel(1).coins[0],collector={...runnerState(),x:c.x,z:c.z};stepRunner(collector,{},1/60,0,1);const count=collector.coins;assert(count>0);
 reviveRunner(collector,1);Object.assign(collector,{x:c.x,z:c.z});stepRunner(collector,{},1/60,0,1);assert.equal(collector.coins,count);
});
test('shield takes one hit, speed and double jump work, and magnet extends coin collection',()=>{
 const h=buildLevel(2).hazards.find(h=>h.type==='wheel'),pos=obstaclePosition(h,0,2),b={...runnerState(),...pos,shield:true,shieldTime:30};b.y=0;
 assert(stepRunner(b,{},1/60,0,2).includes('shield'));assert(!b.shield);assert(!b.eliminated);b.impactGrace=0;assert(stepRunner(b,{},1/60,0,2).includes('death'));
 const water={...runnerState(),shield:true,shieldTime:30,impactGrace:1.5,y:-4};assert(stepRunner(water,{},1/60,0,1).includes('death'));
 const a={...runnerState(),x:0},fast={...runnerState(),x:0,speedTime:15};stepRunner(a,{dz:-1},.1,0,1);stepRunner(fast,{dz:-1},.1,0,1);assert(Math.abs((4-fast.z)/(4-a.z)-1.4)<.001);
 const jumping={...runnerState(),jumpTime:30};stepRunner(jumping,{jump:true},.1,0,1);assert(stepRunner(jumping,{jump:true},.1,.1,1).includes('jump'));assert(!stepRunner(jumping,{jump:true},.1,.2,1).includes('jump'));
 const coin=buildLevel(1).coins[0],mag={...runnerState(),x:coin.x+3,z:coin.z,magnetTime:30},normal={...runnerState(),x:coin.x+3,z:coin.z};stepRunner(mag,{},1/60,0,1);stepRunner(normal,{},1/60,0,1);assert(mag.collected.includes(coin.id));assert(!normal.collected.includes(coin.id));
});
test('powers consume once and online accepts cosmetics without gameplay advantages',()=>{
 const {p}=funded();p.purchase('speed','buy');const id=p.beginEconomyRun(1,'tour');assert(p.consumePower(id,'speed','use').ok);assert(!p.consumePower(id,'speed','use').ok);assert(!p.consumePower(id,'speed','again').ok);
 const room=new RaceRoom({level:2}),runner=room.add({cosmetics:{helmet:'helmet',trail:'trail',shield:true}});room.start();room.phase='race';room.input(runner.id,{dz:-1,invincible:999,shield:true,speedTime:999,revive:true});room.tick(1/30);
 assert.deepEqual(room.snapshot().players[0].cosmetics,{helmet:'helmet',trail:'trail'});assert.equal(runner.invincible,0);assert.equal(runner.speedTime,0);assert(!runner.shield);
});
