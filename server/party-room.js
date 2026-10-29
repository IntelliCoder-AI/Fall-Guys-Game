import {RaceRoom} from './rooms.js';
import {runnerState,stepRunner,botInput,reviveRunner} from '../dist/simulation.js';
import {PARTY,PARTY_COURSES,REMIXES,partySettings} from '../dist/party-rules.js';

/** Room Remix is isolated from competitive qualification and persistent medals. */
export class PartyRoom extends RaceRoom {
 constructor(options={}){super({...options,mode:'tour',privateRoom:true});this.mode='party';this.settings=partySettings(options);this.level=this.settings.level;this.courseId=this.level;this.spectators=[];this.roundIndex=0;this.rounds=this.settings.rounds;this.vote=null;this.remix=null;this.resolvedVotes=0;this.qualify=PARTY.capacity;}
 humans(){return [...this.players,...this.spectators].filter(p=>!p.isBot&&p.connected);}
 findPlayer(id){return [...this.players,...this.spectators].find(p=>p.id===id);}
 canJoin(){return this.humans().length<PARTY.capacity;}
 add(data){if(!this.canJoin())return null;const phase=this.phase,players=this.players;this.phase='waiting';this.players=[];const p=super.add(data);this.players=players;this.phase=phase;p.totalPoints=0;p.roundPoints=0;p.spectator=phase!=='waiting';(p.spectator?this.spectators:this.players).push(p);return p;}
 remove(id){const p=this.findPlayer(id);if(!p)return;p.connected=false;p.eliminated=true;p.input={};if(this.phase==='waiting')this.players=this.players.filter(p=>p.id!==id);this.spectators=this.spectators.filter(p=>p.id!==id);if(this.hostId===id)this.hostId=this.humans()[0]?.id||null;}
 configure(id,data){if(id!==this.hostId||this.phase!=='waiting')return false;this.settings=partySettings(data);this.rounds=this.settings.rounds;this.level=this.courseId=this.settings.level;return true;}
 start(){if(this.phase!=='waiting'||this.humans().length<2)return;this.roundIndex=0;for(const p of this.humans())p.totalPoints=0;this.nextRound();}
 nextRound(){const humans=this.humans(),oldBots=new Map(this.players.filter(p=>p.isBot).map(p=>[p.id,p]));this.players=humans;this.spectators=[];while(this.players.length<PARTY.capacity){const i=this.players.length,id='party-bot-'+i;this.players.push(oldBots.get(id)||{id,name:['Rio','Skye','Jett','Milo','Luna','Rex','Remi','Zara'][i],color:['#ff725e','#9279ff','#44c9b4','#ffcb66'][i%4],outfit:['dash','nova','ace'][i%3],isBot:true,connected:true,totalPoints:0,seed:i*.9,lane:(i%3-1)*6});}
  this.level=PARTY_COURSES[(PARTY_COURSES.indexOf(this.settings.level)+this.roundIndex)%PARTY_COURSES.length];this.courseId=this.level;this.roundIndex++;this.serial++;this.phase='countdown';this.remaining=3;this.elapsed=0;this.clock=0;this.qualified=0;this.vote=null;this.remix=null;this.resolvedVotes=0;
  this.players.forEach((p,i)=>Object.assign(p,runnerState(i),{spectator:false,input:{},lastInput:0,invincible:0,impactGrace:0,deathProgress:undefined,recoverAt:null,roundPoints:0,scored:false,baseSpeed:p.isBot?9.3+(i%3)*.2:10.5,roundLevel:this.level}));
 }
 castVote(id,choice){const p=this.findPlayer(id);if(this.phase!=='race'||!this.vote||this.vote.closed||!p?.connected||p.isBot||typeof choice!=='string'||!Object.hasOwn(REMIXES,choice))return false;this.vote.ballots.set(id,choice);return true;}
 score(p,rank){if(p.scored)return;p.scored=true;p.rank=rank;p.roundPoints=Math.max(0,PARTY.capacity-rank+1);p.totalPoints+=p.roundPoints;}
 finishRound(reason='time'){if(this.phase!=='race')return;let rank=this.qualified;for(const p of this.players.filter(p=>!p.scored&&p.connected).sort((a,b)=>a.z-b.z))this.score(p,++rank);this.reason=reason;this.phase=this.roundIndex<this.rounds?'intermission':'complete';this.remaining=this.phase==='complete'?300:PARTY.intermissionSeconds;this.vote=null;}
 rematch(id){if(id!==this.hostId||this.phase!=='complete')return false;this.players=this.humans();this.spectators=[];this.players.forEach((p,i)=>Object.assign(p,runnerState(i),{spectator:false,input:{},totalPoints:0,roundPoints:0}));this.level=this.courseId=this.settings.level;this.phase='waiting';this.remaining=0;this.vote=null;this.remix=null;return true;}
 tick(dt){const humans=this.humans();this.emptyTime=humans.length?0:this.emptyTime+dt;if(this.phase==='waiting')return;
  if(['countdown','intermission','complete'].includes(this.phase)){this.remaining-=dt;if(this.remaining<=0&&this.phase==='countdown'){this.phase='race';this.elapsed=0;this.clock=0;}else if(this.remaining<=0&&this.phase==='intermission')this.nextRound();return;}
  this.elapsed+=dt;this.remaining=Math.max(0,PARTY.seconds-this.elapsed);
  const start=PARTY.voteStarts[this.resolvedVotes];if(!this.vote&&start!==undefined&&this.elapsed>=start)this.vote={index:this.resolvedVotes+1,endsAt:this.elapsed+PARTY.voteSeconds,ballots:new Map(),closed:false};
  if(this.vote&&!this.vote.closed&&this.elapsed>=this.vote.endsAt){const votes=[...this.vote.ballots].filter(([id])=>this.findPlayer(id)?.connected).map(([,v])=>v);const wild=votes.filter(v=>v==='wild').length;const choice=wild>votes.length-wild?'wild':'calm';this.remix={choice,endsAt:this.elapsed+PARTY.effectSeconds};this.vote.closed=true;this.resolvedVotes++;}
  if(this.vote?.closed&&this.elapsed>this.vote.endsAt+3)this.vote=null;
  if(this.remix&&this.elapsed>=this.remix.endsAt)this.remix=null;const remix=REMIXES[this.remix?.choice];this.clock+=dt*(remix?.hazards||1);
  for(const p of this.players){if(!p.connected||p.finished)continue;if(p.recoverAt!==null){if(this.elapsed>=p.recoverAt){reviveRunner(p,this.courseId);p.recoverAt=null;p.input={};}else continue;}
   p.speed=p.baseSpeed*(remix?.speed||1);const input=p.isBot?botInput(p,this.clock,this.courseId):(this.elapsed-p.lastInput>.5?{}:p.input);const events=stepRunner(p,input,dt,this.clock,this.courseId);if(!p.isBot){p.input.jump=false;p.input.dive=false;}
   if(events.includes('death')){p.recoverAt=this.elapsed+PARTY.recoverySeconds;p.input={};}if(events.includes('finish')){p.finishTime=this.elapsed;this.score(p,++this.qualified);}
  }
  if(this.remaining<=0||this.players.every(p=>!p.connected||p.finished))this.finishRound(this.remaining<=0?'time':'finished');
 }
 snapshot(){const s=super.snapshot();return {...s,mode:'party',capacity:PARTY.capacity,humans:this.humans().length,roundIndex:this.roundIndex,rounds:this.rounds,settings:this.settings,remix:this.remix,vote:this.vote?{index:this.vote.index,endsAt:this.vote.endsAt,closed:this.vote.closed,counts:{calm:[...this.vote.ballots.values()].filter(v=>v==='calm').length,wild:[...this.vote.ballots.values()].filter(v=>v==='wild').length},ballots:Object.fromEntries(this.vote.ballots)}:null,players:[...s.players,...this.spectators.map(p=>({id:p.id,name:p.name,connected:p.connected,isBot:false,spectator:true,x:0,y:0,z:4,cp:0,totalPoints:p.totalPoints,roundPoints:0}))].map(p=>{const original=this.findPlayer(p.id);return {...p,spectator:!!original.spectator,totalPoints:original.totalPoints,roundPoints:original.roundPoints,recoverAt:original.recoverAt,invincible:original.invincible,recoveries:original.recoveries};})};}
}
