import {writeFileSync} from 'node:fs';
import {LEVELS,buildLevel} from '../dist/levels.js';
import {runnerState,stepRunner,botInput} from '../dist/simulation.js';
const times=[],report=[];
for(const l of LEVELS){const attempts=[];for(let i=0;i<3;i++){
 const b={...runnerState(i),isBot:true,speed:10.5,lane:(i-1)*4,seed:i*.9};let time=0;
 while(time<1800&&!b.finished){stepRunner(b,botInput(b,time,l.id),1/30,time,l.id);time+=1/30}
 if(!b.finished)throw Error(`Reference cannot finish L${l.id}, runner ${i}, z=${b.z}, hits=${b.hits}, falls=${b.falls}`);
 attempts.push({time:+time.toFixed(2),hits:b.hits,falls:b.falls});
 }
 attempts.sort((a,b)=>a.time-b.time);times.push(attempts[1].time);report.push({level:l.id,world:l.worldIndex,distance:l.distance,hazards:buildLevel(l.id).hazardCount,reference:attempts[1].time,attempts});
}
writeFileSync('dist/balance.js','// Legal reference runs: three starting lanes, player speed, shared physics. Regenerate with node scripts/calibrate.mjs.\nexport const REFERENCE_TIMES='+JSON.stringify(times)+';\n');
writeFileSync('tests/balance-reference.json',JSON.stringify(report,null,2)+'\n');
for(let world=0;world<5;world++){const rows=report.filter(r=>r.world===world);const distance=rows.reduce((n,r)=>n+r.distance*3,0),time=rows.reduce((n,r)=>n+r.attempts.reduce((a,b)=>a+b.time,0),0),hits=rows.reduce((n,r)=>n+r.attempts.reduce((a,b)=>a+b.hits,0),0),falls=rows.reduce((n,r)=>n+r.attempts.reduce((a,b)=>a+b.falls,0),0);console.log(JSON.stringify({world:world+1,pace:+(distance/time).toFixed(2),hitsPerKm:+(hits/distance*1000).toFixed(2),falls}))}
