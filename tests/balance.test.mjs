import test from 'node:test';import assert from 'node:assert/strict';import{LEVELS,buildLevel,platformPosition,fireballPositions}from'../dist/levels.js';import{runnerState,botInput,stepRunner}from'../dist/simulation.js';
test('live balance: every level finishes, every world slows, and every finale peaks',t=>{
 const worlds=Array.from({length:5},()=>({distance:0,time:0,hits:0,falls:0})),references=[];
 for(const l of LEVELS){const attempts=[];for(let i=0;i<6;i++){const b={...runnerState(i),isBot:true,speed:10.5,seed:i*.9,lane:(i%3-1)*4};let time=0;while(time<l.seconds&&!b.finished){stepRunner(b,botInput(b,time,l.id),1/30,time,l.id);time+=1/30}assert(b.finished,`L${l.id} runner ${i} cannot finish at ${b.z}`);attempts.push(time);const w=worlds[l.worldIndex];w.distance+=l.distance;w.time+=time;w.hits+=b.hits;w.falls+=b.falls}
  const median=attempts.slice(0,3).sort((a,b)=>a-b)[1];references.push(median);
  assert(Math.abs(median-l.measuredReference)<.05,`L${l.id}: calibration is stale; regenerate reference runs`);
 }
 const first=worlds[0],last=worlds[4];assert(last.hits/last.distance>first.hits/first.distance*1.5);assert(last.falls>first.falls+10);
 for(let world=0;world<5;world++){
  const current=worlds[world],pace=current.distance/current.time,finale=references[world*10+9];
  t.diagnostic(JSON.stringify({world:world+1,pace:+pace.toFixed(3),hitsPerKm:+(current.hits/current.distance*1000).toFixed(2),falls:current.falls,finaleSeconds:+finale.toFixed(2)}));
  if(world)assert(pace<worlds[world-1].distance/worlds[world-1].time,`World ${world+1} must have a slower reference pace`);
  for(let i=world*10;i<world*10+9;i++)assert(references[i]<finale,`L${i+1} overtakes its world finale`);
 }
 assert.equal(Math.max(...references),references[49],'L50 must be the peak reference run');
 for(const l of LEVELS){assert.equal(l.gold,Math.ceil(l.referenceTime*1.1));assert.equal(l.silver,Math.ceil(l.gold*1.3));assert(l.referenceTime<=l.measuredReference*1.1,'Smoothing must not hide a difficulty spike');if(l.number%10!==1)assert(l.gold>=LEVELS[l.number-2].gold,'Gold targets may only reset at a new world')}
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
