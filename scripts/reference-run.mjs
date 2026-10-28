// Offline course feasibility only. Runtime races never use this recovery helper.
import {runnerState,stepRunner,botInput} from '../dist/simulation.js';
import {resetPosition} from '../dist/physics.js';
export function referenceRun(level,index=0,dt=1/30){
 const b={...runnerState(index),isBot:true,speed:10.5};let time=0,retries=0;
 while(time<2400&&!b.finished){stepRunner(b,botInput(b,time,level),dt,time,level);time+=dt;
  if(b.eliminated){const {cp,hits,falls}=b;Object.assign(b,runnerState(index),resetPosition(cp,level),{isBot:true,speed:10.5,cp,hits,falls,y:0});retries++;time+=1;if(retries>300)break;}
 }
 return {finished:b.finished,time:+time.toFixed(2),hits:b.hits,falls:b.falls,retries,z:b.z};
}
