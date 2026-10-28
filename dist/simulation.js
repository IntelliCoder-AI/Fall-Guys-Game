import {buildLevel,obstaclePosition,nearby,platformPosition,fireballPositions,trapdoorTiles} from './levels.js';
import {groundAt,segmentDistance,checkpointFor,resetPosition} from './physics.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const courseFor=buildLevel;
const collectedCache=new WeakMap();
function collectedSet(b){let cached=collectedCache.get(b);if(!cached||cached.array!==b.collected||cached.set.size!==b.collected.length){cached={array:b.collected,set:new Set(b.collected)};collectedCache.set(b,cached)}return cached.set}
export function visibleCollected(b,level){const taken=collectedSet(b);return nearby(buildLevel(level).coins,b.z,300).filter(c=>taken.has(c.id)).map(c=>c.id)}
export function runnerState(index=0){return {x:(index%4-1.5)*2.4,z:4+Math.floor(index/4)*1.6,y:0,vy:0,vx:0,vz:0,actualSpeed:0,cp:0,hit:0,dive:0,boost:0,spring:0,finished:false,eliminated:false,deathReason:null,grounded:true,coyote:.1,falls:0,hits:0,coins:0,collected:[],rank:0,finishTime:null,heading:0}}
export function stepRunner(b,input,dt,t,level=1){
 if(b.finished||b.eliminated)return [];
 const c=buildLevel(level),events=[],local=nearby(c.hazards,b.z,24);
 const inPatch=h=>Math.abs(b.x-h.x)<h.w/2&&Math.abs(b.z-h.z)<h.d/2;
 const floor=(x,z)=>groundAt(x,z,c.platforms,t)&&!local.some(h=>h.type==='trapdoor'&&trapdoorTiles(h,t,level).some(tile=>tile.active&&Math.abs(x-tile.x)<tile.w/2&&Math.abs(z-tile.z)<tile.d/2));
 let dx=Number.isFinite(input.dx)?clamp(input.dx,-1,1):0,dz=Number.isFinite(input.dz)?clamp(input.dz,-1,1):0;
 const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len}if(len>.1)b.heading=Math.atan2(-dx,-dz);
 b.hit=Math.max(0,b.hit-dt);b.dive=Math.max(0,b.dive-dt);b.boost=Math.max(0,b.boost-dt);b.spring=Math.max(0,(b.spring||0)-dt);
 const riding=nearby(c.platforms,b.z,100).find(p=>p.motion==='moving'&&Math.abs(b.z-p.z)<p.d/2&&Math.abs(b.x-platformPosition(p,t-dt).x)<p.w/2&&b.y===0);if(riding)b.x+=platformPosition(riding,t).x-platformPosition(riding,t-dt).x;
 const grounded=b.y>=-.03&&b.y<=.025&&floor(b.x,b.z)&&b.vy<=0;b.grounded=grounded;b.coyote=grounded?.12:Math.max(0,b.coyote-dt);
 if(input.jump&&b.coyote>0){b.vy=10.6;b.coyote=0;b.grounded=false;events.push('jump')}
 if(input.dive&&b.dive===0){if(!b.grounded&&b.y>.4){b.dive=.65;b.vx+=dx*8;b.vz+=(dz||-1)*8;b.vy=Math.max(b.vy,2);events.push('dive')}else if(b.grounded){b.dive=.75;b.vz+=(dz||-1)*5;events.push('dive')}}
 let friction=4,terrainSpeed=1,forceX=0,forceZ=0;
 for(const h of local){const patch=inPatch(h);if(patch&&b.y<.35){
  if(h.type==='conveyor')forceZ+=5+c.challenge*2;
  if(h.type==='ice'){friction=.65;b.vx+=dx*8*dt;b.vz+=dz*6*dt}
  if(h.type==='mud')terrainSpeed=.48;
  if(h.type==='launchpad'&&b.spring===0){b.vy=15;b.spring=1.5;b.grounded=false;events.push('spring')}
 }
 if(patch&&b.y<5&&h.type==='wind')forceX+=Math.sin(t*1.8+h.phase)*(6+c.challenge*3);
 if(h.type==='magnet'&&Math.abs(b.z-h.z)<6&&b.y<3){const strength=(Math.sin(t*2+h.phase)+1)*2;forceX+=clamp(h.x-b.x,-1,1)*strength}
 }
 const speed=(b.isBot?(b.speed||8.4):10.5)*(b.boost>0?1.4:1)*terrainSpeed,control=b.hit>.5?.35:1;
 const previousX=b.x,previousZ=b.z;
 b.x+=(dx*speed*control+b.vx+forceX)*dt;b.z+=(dz*speed*control+b.vz+forceZ)*dt;
 b.vx=clamp(b.vx*Math.exp(-friction*dt),-12,12);b.vz=clamp(b.vz*Math.exp(-friction*dt),-12,12);
 const prevY=b.y;b.vy-=23*dt;b.y+=b.vy*dt;
 if(prevY>=-.02&&b.y<=0&&b.vy<0&&floor(b.x,b.z)){b.y=0;b.vy=0;b.grounded=true}
 const platform=nearby(c.platforms,b.z,80).find(p=>Math.abs(b.z-p.z)<p.d/2-.5);
 if(platform?.rails&&b.y>=0&&b.y<.5)b.x=clamp(b.x,-platform.w/2+.65,platform.w/2-.65);
 // Solids resolve on every step; impact cooldown never permits phasing.
 const block=(x,z,w,d)=>{
  const left=x-w/2-.35,right=x+w/2+.35,back=z-d/2-.35,front=z+d/2+.35;
  if(Math.max(previousX,b.x)<left||Math.min(previousX,b.x)>right||Math.max(previousZ,b.z)<back||Math.min(previousZ,b.z)>front)return false;
  if(previousZ>=front){b.z=front+.001;b.vz=0}
  else if(previousZ<=back){b.z=back-.001;b.vz=0}
  else if(previousX<=left){b.x=left-.001;b.vx=0}
  else if(previousX>=right){b.x=right+.001;b.vx=0}
  else {b.z=previousZ>=z?front+.001:back-.001;b.vz=0}
  return true;
 };
 const previousContact=b.blockedBy;b.blockedBy=null;
 const die=reason=>{b.eliminated=true;b.deathReason=reason;b.actualSpeed=0;b.vx=b.vz=b.vy=0;events.push('death');};
 if(b.y>-.5)for(const h of local){
  const p=obstaclePosition(h,t,level);let collides=false;
  if(['hurdle','gate','slalom','tunnel','bumper'].includes(h.type)){
   let blocked=false;
   if(h.type==='hurdle'&&b.y<h.height+.1)blocked=block(h.x,h.z,h.w,.6);
   if(h.type==='gate'&&b.y<2.8){for(const side of[-1,1])blocked=block(p.x+side*(h.opening/2+c.width/2),h.z,c.width,.65)||blocked;}
   if(h.type==='slalom'&&b.y<2.6)for(let i=0;i<3;i++)blocked=block((i%2?1:-1)*c.width*.23,h.z+3-i*3,c.width*.5,.4)||blocked;
   if(h.type==='tunnel'&&b.y<2.8&&b.dive<=0)blocked=block(h.x,h.z,h.w,2);
   if(h.type==='bumper'&&b.y<2)blocked=block(p.x,h.z,2.1,2.1);
   if(blocked){b.blockedBy=h.id;events.push('blocked');if(previousContact!==h.id){b.hit=.4;b.hits++;events.push('hit')}}
   continue;
  }
  if(h.type==='sweeper'){const a=t*h.speed+h.phase;collides=b.y<1.2&&segmentDistance(b.x,b.z,h.x-Math.cos(a)*h.r,h.z+Math.sin(a)*h.r,h.x+Math.cos(a)*h.r,h.z-Math.sin(a)*h.r)<.8}
  else if(h.type==='wheel')collides=b.y<3.8&&Math.hypot(b.x-p.x,b.z-p.z)<2.15;
  else if(h.type==='fireballs')collides=fireballPositions(h,t).some(f=>f.active&&Math.hypot(b.x-f.x,b.z-f.z)<1.05&&Math.abs(b.y+1-f.y)<1.15);
  else if(['bumper','roller','hammer','boulder'].includes(h.type))collides=b.y<2&&Math.hypot(b.x-p.x,b.z-p.z)<(h.type==='bumper'?1.6:1.8);
  else if(h.type==='gate')collides=b.y<2.8&&Math.abs(b.z-h.z)<.75&&Math.abs(b.x-p.x)>h.opening/2-.4;
  else if(h.type==='hurdle')collides=b.y<h.height+.1&&Math.abs(b.z-h.z)<.8&&Math.abs(b.x-p.x)<h.w/2+.45;
  else if(h.type==='piston')collides=inPatch(h)&&p.y<2.4&&b.y<p.y+1;
  else if(h.type==='laser')collides=p.active&&b.y<1.1&&Math.abs(b.z-h.z)<.5&&Math.abs(b.x)<c.width/2+.1;
  else if(h.type==='slalom'){for(let i=0;i<3;i++){const x=(i%2?1:-1)*c.width*.23;if(Math.abs(b.z-(h.z+3-i*3))<.65&&Math.abs(b.x-x)<c.width*.25&&b.y<2.6)collides=true}}
  else if(h.type==='tunnel')collides=Math.abs(b.x-h.x)<h.w/2&&Math.abs(b.z-h.z)<1&&b.dive<=0&&b.y<2.8;
  else if(h.type==='pulse')collides=p.active&&b.y<.8&&Math.abs(Math.hypot(b.x,b.z-h.z)-p.radius)<.55;
  if(collides){b.hits++;events.push('hit');die(h.type);return events}
 }
 if(b.y<-3||Math.abs(b.x)>c.width+8){b.falls++;events.push('fall');die('water');return events}
 b.actualSpeed=Math.hypot(b.x-previousX,b.z-previousZ)/dt;
 if(b.grounded){const cp=checkpointFor(b.z,b.cp,level);if(cp>b.cp){b.cp=cp;events.push('checkpoint')}for(const pad of nearby(c.boosts,b.z,4))if(Math.abs(b.z-pad.z)<pad.d/2&&Math.abs(b.x-pad.x)<pad.w/2&&b.boost<.5){b.boost=1.5;events.push('boost')}}
 if(!b.isBot)for(const coin of nearby(c.coins,b.z,2))if(Math.abs(b.z-coin.z)<1.1&&Math.abs(b.x-coin.x)<1.05&&Math.abs(b.y+1-coin.y)<1.6&&!collectedSet(b).has(coin.id)){const taken=collectedSet(b);b.collected.push(coin.id);taken.add(coin.id);b.coins++;events.push('coin')}
 if(b.z<c.finishZ&&b.y>=0&&b.y<3&&floor(b.x,b.z)){b.finished=true;events.push('finish')}
 return events;
}
function suggestedInput(b,t,level){
 const c=buildLevel(level),local=nearby(c.hazards,b.z,22),surfaces=nearby(c.platforms,b.z,110);
 const surface=surfaces.find(p=>Math.abs(b.z-p.z)<=p.d/2+.15),next=surfaces.find(p=>p.z<b.z&&p.z+p.d/2<b.z+1);
 const aheadSurface=surfaces.find(p=>b.z-7<=p.z+p.d/2&&b.z-7>=p.z-p.d/2)||next||surface;
 let target=0,wait=false,jump=false,dive=false;
 if(aheadSurface)target=platformPosition(aheadSurface,t+.5).x;
 const h=local.find(h=>h.z<b.z+(h.type==='slalom'?6:['piston','trapdoor','tunnel'].includes(h.type)?4:1.2)&&h.z>b.z-18&&!['bridge','moving','vanishing','ice','mud','conveyor','wind','launchpad','magnet'].includes(h.type));
 const width=aheadSurface?.w||c.width,limit=Math.min(c.width,width)/2-.8;
 if(h){const arrival=Math.max(0,(b.z-h.z)/(b.speed||10.5)),p=obstaclePosition(h,t+Math.min(.5,arrival),level),delta=b.z-h.z;
  if(h.type==='gate')target=p.x;
  else if(['wheel','bumper','roller','hammer','boulder'].includes(h.type)){const row=local.filter(other=>['wheel','bumper','roller','hammer','boulder'].includes(other.type)&&Math.abs(other.z-h.z)<3).map(other=>({...obstaclePosition(other,t+Math.min(.5,arrival),level),radius:other.type==='wheel'?2.5:2}));const options=[-limit,0,limit];target=options.filter(x=>row.every(p=>Math.abs(x-p.x)>p.radius)).sort((a,d)=>Math.abs(a-b.x)-Math.abs(d-b.x))[0]??(p.x>0?-limit:limit);if(delta<4&&row.some(p=>Math.abs(b.x-p.x)<p.radius))wait=true}
  else if(h.type==='slalom'){const row=Math.max(0,Math.min(2,Math.floor((h.z+4-b.z)/3)));target=(row%2?-1:1)*.9}
  else if(h.type==='trapdoor'){const tiles=trapdoorTiles(h,t+.35,level).filter(tile=>!tile.active&&(b.z>h.z?tile.z>h.z:tile.z<h.z));target=tiles.sort((a,d)=>Math.abs(a.x-b.x)-Math.abs(d.x-b.x))[0]?.x||0;jump=delta<4.6&&delta>-5;}
  else if(h.type==='fireballs'){const balls=fireballPositions(h,t+.3);const options=[-limit*.8,0,limit*.8];target=options.sort((a,d)=>Math.min(...balls.map(f=>Math.abs(d-f.x)))-Math.min(...balls.map(f=>Math.abs(a-f.x))))[0];jump=delta<5&&delta>-4}
  if(['hurdle','laser','pulse'].includes(h.type))jump=delta<3.2&&delta>-.8;
  if(h.type==='sweeper'){const a=t*h.speed+h.phase;const distance=segmentDistance(b.x,b.z,-Math.cos(a)*h.r,h.z+Math.sin(a)*h.r,Math.cos(a)*h.r,h.z-Math.sin(a)*h.r);jump=distance<3.2;if(distance<1.5&&b.y<.2&&!b.grounded)wait=true;}
  if(h.type==='piston'){target=(b.x<0?-1:1)*Math.min(limit,h.w/2+.75);if(delta<6&&delta>3&&p.y<3.5&&Math.abs(b.x)<h.w/2+.4)wait=true;}
  if(h.type==='tunnel'&&delta<4&&delta>-2)dive=true;
 }
 if(aheadSurface&&width<c.width*.7)target=platformPosition(aheadSurface,t+.4).x;
 // Follow a drifting deck until its actual exit, rather than steering off
 // its open side when the wide landing comes into the look-ahead window.
 if(surface?.motion==='moving'&&b.z>surface.z-surface.d/2+.5)target=platformPosition(surface,t+.15).x;
 const edge=surface?surface.z-surface.d/2:null;
 const gap=edge!==null&&!groundAt(b.x,edge-.4,c.platforms,t);
 const gapDistance=edge===null?0:b.z-edge;
 const future=next&&platformPosition(next,t+.7);
 if(next?.motion==='vanishing'&&gapDistance<4){const landing=platformPosition(next,t+.5),exit=platformPosition(next,t+2.5);if(!landing.active||!exit.active)wait=true;}
 if(gap&&gapDistance<2.2&&!wait)jump=true;
 if(gap&&gapDistance<10&&gapDistance>2.2){jump=false;if(b.y>.1&&b.vy<0)wait=true}
 if(b.y>.65&&!b.dive&&gapDistance<1.5&&!groundAt(b.x,b.z-2,c.platforms,t))dive=true;
 const dx=Math.max(-1,Math.min(1,(target-b.x)*1.6));
 return {dx:gap&&gapDistance<3&&Math.abs(b.x-target)<.6?0:dx,dz:wait&&b.grounded?0:-1,jump:(b.grounded||b.coyote>0)&&jump,dive};
}

// Bots use the same collisions as people. Predict a few legal inputs before
// committing, so an old knockback-era route cannot walk through lethal hazards.
const decisions=new WeakMap();
export function botInput(b,t,level){
 const old=decisions.get(b);if(old&&t>=old.at&&t-old.at<.15)return old.input;
 const suggested=suggestedInput(b,t,level),options=[suggested];
 for(const dx of[-1,0,1])for(const dz of[-1,0])for(const jump of[false,true])options.push({dx,dz,jump,dive:false});
 options.push({...suggested,jump:true,dive:true},{...suggested,dive:true});
 const horizon=groundAt(b.x,b.z-8,buildLevel(level).platforms,t+.8)?12:22;
 let best=suggested,score=-Infinity;
 for(const input of options){const trial={...b,collected:[],isBot:true},originZ=b.z;let blocked=0;
  for(let i=1;i<=horizon;i++){const e=stepRunner(trial,input,.05,t+i*.05,level);if(e.includes('blocked'))blocked++;if(trial.eliminated)break;}
  const value=(trial.eliminated?-10000:0)+(trial.y<-.1?-2000:0)+(originZ-trial.z)*5-Math.abs(trial.x)*.08+(input===suggested?.4:0);
  if(value>score){score=value;best=input;}
 }
 decisions.set(b,{at:t,input:best});return best;
}
