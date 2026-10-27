import test from 'node:test';import assert from 'node:assert/strict';import{LEVELS,buildLevel,platformPosition,fireballPositions}from'../dist/levels.js';import{runnerState,botInput,stepRunner}from'../dist/simulation.js';
test('six reference runners finish all levels; late-world pace, impacts and falls demand more',()=>{
 const worlds=Array.from({length:5},()=>({distance:0,time:0,hits:0,falls:0}));
 for(const l of LEVELS)for(let i=0;i<6;i++){const b={...runnerState(i),isBot:true,speed:10.5,seed:i*.9,lane:(i%3-1)*4};let t=0;while(t<l.seconds&&!b.finished){stepRunner(b,botInput(b,t,l.id),1/30,t,l.id);t+=1/30}assert(b.finished,`L${l.id} runner ${i} cannot finish at ${b.z}`);const w=worlds[l.worldIndex];w.distance+=l.distance;w.time+=t;w.hits+=b.hits;w.falls+=b.falls}
 const first=worlds[0],last=worlds[4];assert(last.distance/last.time<first.distance/first.time*.92);assert(last.hits/last.distance>first.hits/first.distance*1.5);assert(last.falls>first.falls+10);
 // World openings intentionally ease off; a strict per-level monotonic curve
 // would erase that recovery. Check the overall curve and every finish instead.
 for(const l of LEVELS){assert.equal(l.gold,Math.ceil(l.referenceTime*1.1));assert.equal(l.silver,Math.ceil(l.gold*1.3))}
});
test('edge-running is not a clean bypass and open bridges permit real falls',()=>{
 for(const level of[1,3,20,50])for(const side of[-1,1]){const c=buildLevel(level),b={...runnerState(),x:side*(c.width/2-.7)};for(let t=0;t<90&&!b.finished;t+=1/30)stepRunner(b,{dx:side*.2,dz:-1},1/30,t,level);assert(b.hits+b.falls>0,`Clean edge lane L${level}`)}
 const c=buildLevel(20),bridge=c.platforms.find(p=>p.kind==='bridge'),b={...runnerState(),x:bridge.w/2+1,z:bridge.z};for(let t=0;t<2;t+=1/30)stepRunner(b,{},1/30,t,20);assert(b.falls>0);
});
test('moving and disappearing platforms affect the floor; fireballs cover both edges',()=>{const c=buildLevel(50),moving=c.platforms.find(p=>p.motion==='moving'),b={...runnerState(),x:platformPosition(moving,0).x,z:moving.z+20};stepRunner(b,{},.05,.05,50);assert(Math.abs(b.x-platformPosition(moving,.05).x)<.05);const p=c.platforms.find(p=>p.motion==='vanishing');let t=0;while(platformPosition(p,t).active)t+=.1;const falling={...runnerState(),x:0,z:p.z};for(let i=0;i<8;i++)stepRunner(falling,{},.03,t,50);assert(falling.y<-.3);const fire=c.hazards.find(h=>h.type==='fireballs'),xs=[];for(let t=0;t<10;t+=.1)xs.push(...fireballPositions(fire,t).filter(f=>f.active).map(f=>f.x));assert(Math.min(...xs)<-c.width/2+.5);assert(Math.max(...xs)>c.width/2-.5)});
