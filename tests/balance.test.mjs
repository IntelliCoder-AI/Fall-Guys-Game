import {readFileSync} from 'node:fs';
const navigationReference=JSON.parse(readFileSync(new URL('./balance-reference.json',import.meta.url)));
import {referenceRun} from '../scripts/reference-run.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import{LEVELS,buildLevel,platformPosition,fireballPositions}from'../dist/levels.js';import{runnerState,botInput,stepRunner}from'../dist/simulation.js';
test('all 50 navigation routes are traversable; finale pacing and challenge parameters rise',t=>{
 const worlds=Array.from({length:5},()=>({distance:0,time:0,hits:0,falls:0,retries:0})),references=[];
 for(const l of LEVELS){const attempts=Array.from({length:1},(_,i)=>referenceRun(l.id,i));for(const r of attempts){assert(r.finished,`L${l.id} has no traversable training route at ${r.z}`);const w=worlds[l.worldIndex];w.distance+=l.distance;w.time+=r.time;w.hits+=r.hits;w.falls+=r.falls;w.retries+=r.retries}const median=attempts.map(r=>r.time).sort((a,b)=>a-b)[0];references.push(median);assert(Math.abs(median-navigationReference[l.id-1].reference)<.05,'Stale training reference L'+l.id)}
 for(let w=0;w<5;w++){const a=worlds[w];t.diagnostic(JSON.stringify({world:w+1,hitsPerKm:a.hits/a.distance*1000,fallsPerKm:a.falls/a.distance*1000,retries:a.retries}));if(w){const p=worlds[w-1];assert(a.hits/a.distance>p.hits/p.distance,'Hits/km must increase every world');assert(LEVELS[w*10].challenge>LEVELS[(w-1)*10].challenge);assert(LEVELS[w*10].width<LEVELS[(w-1)*10].width)}
  for(let i=w*10;i<w*10+9;i++)assert(references[i]<references[w*10+9],`L${i+1} is harder than its finale`);
 }
 // Bot survival is tested separately: fewer AI water deaths must not fail balance.
 assert(LEVELS[49].gap>LEVELS[0].gap*1.5);assert(LEVELS[49].width<LEVELS[0].width*.6);
 assert.equal(Math.max(...references),references[49]);
 for(const l of LEVELS)if(l.number%10!==1)assert(l.gold>=LEVELS[l.number-2].gold);
});
test('density grows on crossings and arenas without counting floor labels as hazards',()=>{
 const density=l=>buildLevel(l.id).hazards.filter(h=>!['bridge','moving','vanishing'].includes(h.type)).length/l.distance*100;
 const means=Array.from({length:5},(_,w)=>LEVELS.slice(w*10,w*10+10).reduce((n,l)=>n+density(l),0)/10);
 for(let w=1;w<5;w++)assert(means[w]>means[w-1]);assert(density(LEVELS[49])>=8);assert(density(LEVELS[49])<=10.5);
 assert(buildLevel(5).platforms.some(p=>p.rails));assert(buildLevel(6).platforms.every(p=>!p.rails));
 for(const s of buildLevel(50).sections.filter(s=>s.kind!=='track'))assert(buildLevel(50).hazards.filter(h=>h.z<s.front&&h.z>s.back&&!['bridge','moving','vanishing'].includes(h.type)).length>=5);
});
test('edge-running is not a clean bypass and open bridges permit real falls',()=>{
 for(const level of[1,3,20,50])for(const side of[-1,1]){const c=buildLevel(level),b={...runnerState(),x:side*(c.width/2-.7)};for(let t=0;t<90&&!b.finished;t+=1/30)stepRunner(b,{dx:side*.2,dz:-1},1/30,t,level);assert(b.hits+b.falls>0,`Clean edge lane L${level}`)}
 const c=buildLevel(20),bridge=c.platforms.find(p=>p.kind==='bridge'),b={...runnerState(),x:bridge.w/2+1,z:bridge.z};for(let t=0;t<2;t+=1/30)stepRunner(b,{},1/30,t,20);assert(b.falls>0);
});
test('moving and disappearing platforms affect the floor; fireballs cover both edges',()=>{const c=buildLevel(50),moving=c.platforms.find(p=>p.motion==='moving'),b={...runnerState(),x:platformPosition(moving,0).x,z:moving.z+20};stepRunner(b,{},.05,.05,50);assert(Math.abs(b.x-platformPosition(moving,.05).x)<.05);const p=c.platforms.find(p=>p.motion==='vanishing');let t=0;while(platformPosition(p,t).active)t+=.1;const falling={...runnerState(),x:0,z:p.z};for(let i=0;i<8;i++)stepRunner(falling,{},.03,t,50);assert(falling.y<-.3);const fire=c.hazards.find(h=>h.type==='fireballs'),xs=[];for(let t=0;t<10;t+=.1)xs.push(...fireballPositions(fire,t).filter(f=>f.active).map(f=>f.x));assert(Math.min(...xs)<-c.width/2+.5);assert(Math.max(...xs)>c.width/2-.5)});
