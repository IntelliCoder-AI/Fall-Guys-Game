import {randomBytes,randomUUID} from 'node:crypto';
import {runnerState,stepRunner,botInput} from '../dist/simulation.js';
import {levelById} from '../dist/levels.js';
const COLORS=['#ff5b9d','#8b65ef','#24c8b7','#ffb931','#439aff'];
export class RaceRoom {
 constructor({id=randomBytes(3).toString('hex').toUpperCase(),waitSeconds=18}={}){this.id=id;this.phase='waiting';this.level=1;this.players=[];this.elapsed=0;this.clock=0;this.remaining=waitSeconds;this.waitSeconds=waitSeconds;this.qualified=0;this.serial=0;this.emptyTime=0}
 add({name,color}={}){if(this.phase!=='waiting'||this.players.length>=16)return null;const p={...runnerState(this.players.length),id:randomUUID(),name:String(name||'Guest Bean').replace(/[<>\x00-\x1f]/g,'').slice(0,20),color:COLORS.includes(color)?color:COLORS[0],isBot:false,connected:true,eliminated:false,input:{},lastInput:0};this.players.push(p);return p}
 remove(id){const p=this.players.find(p=>p.id===id);if(!p)return;if(this.phase==='waiting')this.players=this.players.filter(p=>p.id!==id);else{p.connected=false;p.eliminated=true;p.input={}}}
 start(){if(this.phase!=='waiting')return;while(this.players.length<16){const i=this.players.length;this.players.push({...runnerState(i),id:'bot-'+i,name:'Bean Bot '+(i+1),color:COLORS[i%5],isBot:true,connected:true,eliminated:false,speed:6.5+(i%5)*.16,lane:(i%3-1)*7,seed:i*.9})}this.beginRound(1)}
 beginRound(level){this.level=level;this.phase='countdown';this.remaining=3;this.elapsed=0;this.clock=0;this.qualified=0;this.serial++;let index=0;for(const p of this.players){if(!p.eliminated)Object.assign(p,runnerState(index++),{input:{},lastInput:0,roundLevel:level})}}
 input(id,data){const p=this.players.find(p=>p.id===id&&!p.isBot&&p.connected);if(!p||this.phase!=='race'||p.finished||p.eliminated)return;const n=v=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;p.input={dx:n(data.dx),dz:n(data.dz),jump:p.input.jump||data.jump===true,dive:p.input.dive||data.dive===true};p.lastInput=this.elapsed}
 finishRound(){const limit=levelById(this.level).qualify;for(const p of this.players)if(!p.finished||p.rank>limit)p.eliminated=true;this.phase=this.level===3||!this.players.some(p=>!p.eliminated)?'complete':'intermission';this.remaining=this.phase==='complete'?45:9}
 tick(dt){this.clock+=dt;const humans=this.players.filter(p=>!p.isBot&&p.connected);this.emptyTime=humans.length?0:this.emptyTime+dt;
  if(this.phase==='waiting'){if(!humans.length)return;this.remaining-=dt;if(this.remaining<=0||this.players.length===16)this.start();return}
  if(['countdown','intermission','complete'].includes(this.phase)){this.remaining-=dt;if(this.remaining<=0){if(this.phase==='countdown'){this.phase='race';this.elapsed=0;this.clock=0}else if(this.phase==='intermission')this.beginRound(this.level+1)}return}
  this.elapsed+=dt;this.remaining=Math.max(0,levelById(this.level).seconds-this.elapsed);
  for(const p of this.players){if(p.eliminated||p.finished)continue;const input=p.isBot?botInput(p,this.clock,this.level):(this.elapsed-p.lastInput>.5?{}:p.input);const events=stepRunner(p,input,dt,this.clock,this.level);if(!p.isBot){p.input.jump=false;p.input.dive=false}if(events.includes('finish')){p.rank=++this.qualified;p.finishTime=this.elapsed;if(this.qualified>=levelById(this.level).qualify){this.finishRound();break}}}
  if(this.phase==='race'&&this.remaining<=0)this.finishRound();
 }
 snapshot(){return {type:'state',room:this.id,phase:this.phase,level:this.level,round:this.serial,time:this.elapsed,clock:this.clock,remaining:this.remaining,qualified:this.qualified,qualify:levelById(this.level).qualify,humans:this.players.filter(p=>!p.isBot&&p.connected).length,players:this.players.map(p=>({id:p.id,name:p.name,color:p.color,isBot:p.isBot,connected:p.connected,eliminated:p.eliminated,x:p.x,y:p.y,z:p.z,cp:p.cp,heading:p.heading,dive:p.dive,grounded:p.grounded,finished:p.finished,rank:p.rank,finishTime:p.finishTime,falls:p.falls,roundLevel:p.roundLevel}))}}
}
