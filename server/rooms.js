import {randomBytes,randomUUID} from 'node:crypto';
import {runnerState,stepRunner,botInput} from '../dist/simulation.js';
import {levelById} from '../dist/levels.js';
const COLORS=['#ff725e','#9279ff','#44c9b4','#ffcb66'];
export class RaceRoom {
 constructor({id=randomBytes(3).toString('hex').toUpperCase(),waitSeconds=12,level=1}={}){this.id=id;this.phase='waiting';this.level=levelById(level).id;this.players=[];this.elapsed=0;this.clock=0;this.remaining=waitSeconds;this.qualified=0;this.serial=0;this.emptyTime=0}
 add({name,color,outfit}={}){if(this.phase!=='waiting'||this.players.length>=16)return null;const p={...runnerState(this.players.length),id:randomUUID(),name:String(name||'Guest Runner').replace(/[<>\x00-\x1f]/g,'').slice(0,20),color:COLORS.includes(color)?color:COLORS[0],outfit:['dash','nova','ace','gold'].includes(outfit)?outfit:'dash',isBot:false,connected:true,eliminated:false,input:{},lastInput:0};this.players.push(p);return p}
 remove(id){const p=this.players.find(p=>p.id===id);if(!p)return;if(this.phase==='waiting')this.players=this.players.filter(p=>p.id!==id);else{p.connected=false;p.eliminated=true;p.input={}}}
 start(){if(this.phase!=='waiting')return;while(this.players.length<16){const i=this.players.length;this.players.push({...runnerState(i),id:'bot-'+i,name:['Rio','Skye','Jett','Milo','Luna','Rex','Remi','Zara'][i%8],color:COLORS[i%4],outfit:['dash','nova','ace'][i%3],isBot:true,connected:true,eliminated:false,speed:7.9+(i%5)*.22+Math.min(.8,this.level*.016),lane:(i%3-1)*6,seed:i*.9})}this.beginRound(this.level)}
 beginRound(level){this.level=levelById(level).id;this.phase='countdown';this.remaining=3;this.elapsed=0;this.clock=0;this.qualified=0;this.serial++;let index=0;for(const p of this.players)if(!p.eliminated)Object.assign(p,runnerState(index++),{input:{},lastInput:0,roundLevel:this.level})}
 input(id,data){const p=this.players.find(p=>p.id===id&&!p.isBot&&p.connected);if(!p||this.phase!=='race'||p.finished||p.eliminated)return;const n=v=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;p.input={dx:n(data.dx),dz:n(data.dz),jump:p.input.jump||data.jump===true,dive:p.input.dive||data.dive===true};p.lastInput=this.elapsed}
 finishRound(){this.phase='complete';this.remaining=45;for(const p of this.players)if(!p.finished)p.eliminated=true}
 tick(dt){this.clock+=dt;const humans=this.players.filter(p=>!p.isBot&&p.connected);this.emptyTime=humans.length?0:this.emptyTime+dt;
  if(this.phase==='waiting'){if(!humans.length)return;this.remaining-=dt;if(this.remaining<=0||this.players.length===16)this.start();return}
  if(this.phase==='countdown'||this.phase==='complete'){this.remaining-=dt;if(this.remaining<=0&&this.phase==='countdown'){this.phase='race';this.elapsed=0;this.clock=0}return}
  this.elapsed+=dt;this.remaining=Math.max(0,levelById(this.level).seconds-this.elapsed);
  for(const p of this.players){if(p.eliminated||p.finished)continue;const input=p.isBot?botInput(p,this.clock,this.level):(this.elapsed-p.lastInput>.5?{}:p.input);const events=stepRunner(p,input,dt,this.clock,this.level);if(!p.isBot){p.input.jump=false;p.input.dive=false}if(events.includes('finish')){p.rank=++this.qualified;p.finishTime=this.elapsed}}
  if(this.remaining<=0||this.players.every(p=>p.finished||p.eliminated))this.finishRound();
 }
 snapshot(){return {type:'state',room:this.id,phase:this.phase,level:this.level,round:this.serial,time:this.elapsed,clock:this.clock,remaining:this.remaining,qualified:this.qualified,qualify:16,humans:this.players.filter(p=>!p.isBot&&p.connected).length,players:this.players.map(p=>({id:p.id,name:p.name,color:p.color,outfit:p.outfit,isBot:p.isBot,connected:p.connected,eliminated:p.eliminated,x:p.x,y:p.y,z:p.z,cp:p.cp,heading:p.heading,dive:p.dive,boost:p.boost,grounded:p.grounded,finished:p.finished,rank:p.rank,finishTime:p.finishTime,falls:p.falls,hits:p.hits,coins:p.coins,roundLevel:p.roundLevel}))}}
}
