import {RaceRoom} from './rooms.js';
import {RELAY,MECHANISMS,relayCrystals,relayLayout,relayBeacon,mechanismTimeLeft,relayOffset,relaySpawn,stepRelayRunner,mechanismProgress} from '../dist/relay-rules.js';

/** Cooperative state is separate from race qualification, wallet and progression. */
export class RelayRoom extends RaceRoom {
 constructor(options={}){
  super({...options,privateRoom:true,level:1});this.mode='relay';this.suspended=new Map();this.stage=0;this.energy=2;
  this.shaperId=null;this.spectators=[];this.mechanisms={bridge:null,gate:null,wind:null};
  this.powered=new Set();this.collected=new Set();this.seals=new Set();this.tutorial={moved:false,jumped:false,energy:false,shaped:false};
  this.tutorialDone=false;this.storm=RELAY.seconds;this.paused=false;this.transition=0;this.event='';
 }
 humans(){return [...this.players,...this.spectators].filter(p=>p.connected&&!p.isBot);}
 active(){return this.players.filter(p=>p.connected);}
 findPlayer(id){return [...this.players,...this.spectators].find(p=>p.id===id);}
 canJoin(){return this.players.length+this.spectators.length<RELAY.capacity;}
 suspend(id,deadline){const p=this.findPlayer(id);if(!p)return;p.connected=false;p.input={};this.suspended.set(id,deadline);this.paused=true;}
 resume(id){const p=this.findPlayer(id);if(!p||!this.suspended.has(id))return null;p.connected=true;p.input={};p.vx=0;p.vz=0;p.lastInput=this.elapsed;this.suspended.delete(id);return p;}
 expireSuspensions(now){for(const[id,deadline]of this.suspended)if(now>=deadline){this.suspended.delete(id);this.remove(id);}}

 add(data){
  if(!this.canJoin())return null;
  const phase=this.phase,players=this.players;this.phase='waiting';this.players=[];
  const p=super.add(data);this.phase=phase;this.players=players;
  p.spectator=phase!=='waiting';(p.spectator?this.spectators:this.players).push(p);
  if(['race','countdown'].includes(this.phase)&&this.active().length<2&&!this.suspended.size)this.promote();
  return p;
 }
 promote(){
  for(const p of this.spectators.filter(p=>p.connected)){p.spectator=false;p.role='runner';this.players.push(p);relaySpawn(p,this.stage,this.players.length-1);}
  this.spectators=[];
  if(!this.active().some(p=>p.id===this.shaperId))this.assignShaper(this.active()[0]?.id);
 }
 assignShaper(id){
  this.shaperId=id||null;
  for(const p of this.active()){p.input={};p.ready=false;p.role=p.id===id?'shaper':'runner';
   if(p.role==='shaper'){relaySpawn(p,this.stage,0);p.x=-4.5;}}
 }
 remove(id){
  const p=this.findPlayer(id);if(!p)return;this.suspended.delete(id);p.connected=false;p.input={};
  this.spectators=this.spectators.filter(p=>p.id!==id);
  this.players=this.players.filter(p=>p.id!==id);
  if(this.hostId===id)this.hostId=this.humans()[0]?.id||null;
  if(['race','countdown'].includes(this.phase)){
   if(this.active().length<2)this.promote();
   if(this.shaperId===id)this.assignShaper(this.active()[0]?.id);
   this.event='A teammate left. Roles have been checked; the team can continue.';
  }
 }
 start({hostRole='shaper'}={}){
  if(this.phase!=='waiting'||this.humans().length<2||this.suspended.size)return;
  this.players=this.humans();this.spectators=[];this.stage=0;this.energy=2;this.storm=RELAY.seconds;
  this.tutorial={moved:false,jumped:false,energy:false,shaped:false};this.tutorialDone=false;
  this.serial++;this.elapsed=0;this.clock=0;this.remaining=3;this.phase='countdown';this.reason=null;
  this.resetStage();for(const p of this.players){p.recoveries=0;p.falls=0;}this.assignShaper(this.players[hostRole==='runner'?1:0].id);
 }
 resetStage(){
  this.mechanisms={bridge:null,gate:null,wind:null};this.powered=new Set();this.collected=new Set();this.seals=new Set();this.transition=0;
  this.players.forEach((p,i)=>{p.spectator=false;relaySpawn(p,this.stage,i);});
 }
 input(id,data){
  const p=this.findPlayer(id);
  if(!p||p.role!=='runner'||p.spectator||p.ready||p.recoverAt!==null||this.paused||this.transition>0)return;
  super.input(id,data);
 }
 activate(id,key,stage){
  if(this.phase!=='race'||this.paused||this.transition>0||stage!==this.stage||id!==this.shaperId||typeof key!=='string'||!Object.hasOwn(MECHANISMS,key)||!relayLayout(this.stage).order.includes(key))return false;
  if(!this.findPlayer(id)?.connected||mechanismTimeLeft(this.mechanisms,key,this.clock)>0||mechanismProgress(this.mechanisms,key,this.clock)>0||(!this.powered.has(key)&&this.energy<MECHANISMS[key].cost))return false;
  const order=relayLayout(this.stage).order,previous=order[order.indexOf(key)-1];
  if(previous&&!this.powered.has(previous))return false;
  if(!this.powered.has(key)){this.energy-=MECHANISMS[key].cost;this.powered.add(key);}this.mechanisms[key]=this.clock;
  if(key==='bridge')this.tutorial.shaped=true;
  this.event=MECHANISMS[key].verb+' activated';return true;
 }
 nextStage(){
  const prior=this.shaperId;this.promote();const active=this.active(),index=active.findIndex(p=>p.id===prior);
  this.stage++;this.energy+=2;this.resetStage();this.assignShaper(active[(index+1)%active.length]?.id);
  this.event='Checkpoint secured. Roles rotated — '+this.findPlayer(this.shaperId)?.name+' shapes next.';
 }
 complete(reason){this.reason=reason;this.phase='complete';this.remaining=300;for(const p of this.players)p.input={};}
 rematch(id){
  if(id!==this.hostId||this.phase!=='complete'||this.suspended.size)return false;
  this.players=this.humans();this.spectators=[];this.phase='waiting';this.players.forEach(p=>p.spectator=false);return true;
 }
 tick(dt){
  this.emptyTime=this.humans().length||this.suspended.size?0:this.emptyTime+dt;
  if(this.phase==='waiting')return;
  if(this.phase==='complete'){this.remaining-=dt;return;}
  this.paused=this.suspended.size>0||this.active().length<2;
  if(this.paused)return;
  if(this.phase==='countdown'){this.remaining-=dt;if(this.remaining<=0)this.phase='race';return;}
  this.elapsed+=dt;this.clock+=dt;
  if(this.transition>0){this.transition-=dt;if(this.transition<=0)this.nextStage();return;}
  if(!this.tutorialDone&&Object.values(this.tutorial).every(Boolean)){this.tutorialDone=true;this.event='Practice complete. Carry the light to all three beacons!';}
  if(this.tutorialDone)this.storm=Math.max(0,this.storm-dt);
  this.remaining=this.storm;if(this.storm<=0){this.complete('storm');return;}
  for(const p of this.active()){
   if(p.role!=='runner'||p.ready)continue;
   if(p.recoverAt!==null){if(this.elapsed>=p.recoverAt){const recoveries=(p.recoveries||0)+1;relaySpawn(p,this.stage,this.players.indexOf(p));p.recoveries=recoveries;}else continue;}
   const input=this.elapsed-p.lastInput>.5?{}:p.input;
   const events=stepRelayRunner(p,input,dt,this.stage,this.mechanisms,this.clock);p.input.jump=false;p.input.dive=false;
   if(events.includes('fall')){p.recoverAt=this.elapsed+RELAY.recovery;continue;}
   if(p.actualSpeed>1)this.tutorial.moved=true;
   if(events.includes('jump'))this.tutorial.jumped=true;
   const d=-p.z-relayOffset(this.stage);
   relayCrystals(this.stage).forEach((orb,i)=>{
    if(!this.collected.has(i)&&Math.hypot(p.x-orb.x,d-orb.d)<1.5&&p.y<2){this.collected.add(i);this.energy+=2;this.tutorial.energy=true;}
   });
   relayLayout(this.stage).seals.forEach((seal,i)=>{
    if(!this.seals.has(i)&&Math.hypot(p.x-seal.x,d-seal.d)<1.5&&p.y<2){this.seals.add(i);this.energy+=2;this.event='Energy seal secured · '+this.seals.size+' / 2';}
   });
   if(d>=relayBeacon()-1&&p.grounded&&this.seals.size===2&&relayLayout(this.stage).order.every(k=>this.powered.has(k))){
    p.ready=true;p.actualSpeed=0;p.input={};this.event=p.name+' reached the beacon. Waiting for the team.';
   }
  }
  const runners=this.active().filter(p=>p.role==='runner');
  if(runners.length&&runners.every(p=>p.ready)){
   if(this.stage===RELAY.stages-1)this.complete('rescued');else this.transition=4;
  }
 }
 snapshot(){
  const base=super.snapshot();return {...base,mode:'relay',capacity:RELAY.capacity,humans:this.humans().length,
   relay:{revision:3,seals:[...this.seals],reconnecting:this.suspended.size,powered:[...this.powered],hostRoleChoice:true,stage:this.stage,energy:this.energy,shaperId:this.shaperId,mechanisms:this.mechanisms,collected:[...this.collected],
    tutorial:this.tutorial,tutorialDone:this.tutorialDone,storm:this.storm,paused:this.paused,transition:this.transition,event:this.event},
   players:[...base.players,...this.spectators.map(p=>({id:p.id,name:p.name,connected:p.connected,x:0,y:0,z:-relayOffset(this.stage),spectator:true}))].map(p=>{
    const original=this.findPlayer(p.id);return {...p,role:original.role,spectator:!!original.spectator,ready:!!original.ready,
     recoverAt:original.recoverAt??null,recoveries:original.recoveries||0,invincible:original.invincible||0};
   })};
 }
}
