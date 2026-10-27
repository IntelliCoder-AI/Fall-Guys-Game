import {buildLevel,obstaclePosition,nearby} from './levels.js';
import {groundAt,segmentDistance,checkpointFor,resetPosition} from './physics.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const courseFor=buildLevel;
const collectedCache=new WeakMap();
function collectedSet(b){let cached=collectedCache.get(b);if(!cached||cached.array!==b.collected||cached.set.size!==b.collected.length){cached={array:b.collected,set:new Set(b.collected)};collectedCache.set(b,cached)}return cached.set}
export function visibleCollected(b,level){const taken=collectedSet(b);return nearby(buildLevel(level).coins,b.z,300).filter(c=>taken.has(c.id)).map(c=>c.id)}
export function runnerState(index=0){return {x:(index%4-1.5)*2.4,z:4+Math.floor(index/4)*1.6,y:0,vy:0,vx:0,vz:0,cp:0,hit:0,dive:0,boost:0,spring:0,finished:false,grounded:true,coyote:.1,falls:0,hits:0,coins:0,collected:[],rank:0,finishTime:null,heading:0}}
export function stepRunner(b,input,dt,t,level=1){
 if(b.finished||b.eliminated)return [];
 const c=buildLevel(level),events=[],local=nearby(c.hazards,b.z,24);
 const inPatch=h=>Math.abs(b.x-h.x)<h.w/2&&Math.abs(b.z-h.z)<h.d/2;
 const floor=(x,z)=>groundAt(x,z,c.platforms)&&!local.some(h=>h.type==='trapdoor'&&obstaclePosition(h,t,level).active&&Math.abs(x-h.x)<h.w/2&&Math.abs(z-h.z)<h.d/2);
 let dx=Number.isFinite(input.dx)?clamp(input.dx,-1,1):0,dz=Number.isFinite(input.dz)?clamp(input.dz,-1,1):0;
 const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len}if(len>.1)b.heading=Math.atan2(-dx,-dz);
 b.hit=Math.max(0,b.hit-dt);b.dive=Math.max(0,b.dive-dt);b.boost=Math.max(0,b.boost-dt);b.spring=Math.max(0,(b.spring||0)-dt);
 const grounded=b.y>=-.03&&b.y<=.025&&floor(b.x,b.z)&&b.vy<=0;b.grounded=grounded;b.coyote=grounded?.12:Math.max(0,b.coyote-dt);
 if(input.jump&&b.coyote>0){b.vy=10.6;b.coyote=0;b.grounded=false;events.push('jump')}
 if(input.dive&&b.dive===0){if(!b.grounded&&b.y>.4){b.dive=.65;b.vx+=dx*8;b.vz+=(dz||-1)*8;b.vy=Math.max(b.vy,2);events.push('dive')}else if(b.grounded){b.dive=.75;b.vz+=(dz||-1)*5;events.push('dive')}}
 let friction=4,terrainSpeed=1,forceX=0,forceZ=0;
 for(const h of local){const patch=inPatch(h);if(patch&&b.y<.35){
  if(h.type==='conveyor')forceZ+=4.2;
  if(h.type==='ice'){friction=.65;b.vx+=dx*8*dt;b.vz+=dz*6*dt}
  if(h.type==='mud')terrainSpeed=.48;
  if(h.type==='launchpad'&&b.spring===0){b.vy=15;b.spring=1.5;b.grounded=false;events.push('spring')}
 }
 if(patch&&b.y<5&&h.type==='wind')forceX+=Math.sin(t*1.8+h.phase)*6;
 if(h.type==='magnet'&&Math.abs(b.z-h.z)<6&&b.y<3){const strength=(Math.sin(t*2+h.phase)+1)*2;forceX+=clamp(h.x-b.x,-1,1)*strength}
 }
 const speed=(b.isBot?(b.speed||8.4):10.5)*(b.boost>0?1.4:1)*terrainSpeed,control=b.hit>.5?.35:1;
 b.x+=(dx*speed*control+b.vx+forceX)*dt;b.z+=(dz*speed*control+b.vz+forceZ)*dt;
 b.vx=clamp(b.vx*Math.exp(-friction*dt),-12,12);b.vz=clamp(b.vz*Math.exp(-friction*dt),-12,12);
 const prevY=b.y;b.vy-=23*dt;b.y+=b.vy*dt;
 if(prevY>=-.02&&b.y<=0&&b.vy<0&&floor(b.x,b.z)){b.y=0;b.vy=0;b.grounded=true}
 const platform=nearby(c.platforms,b.z,80).find(p=>Math.abs(b.z-p.z)<p.d/2-.5);
 if(platform&&b.y>=0&&b.y<.5)b.x=clamp(b.x,-platform.w/2+.65,platform.w/2-.65);
 if(b.hit<=0&&b.y>-.5)for(const h of local){
  const p=obstaclePosition(h,t,level);let collides=false;
  if(h.type==='sweeper'){const a=t*h.speed+h.phase;collides=b.y<1.2&&segmentDistance(b.x,b.z,h.x-Math.cos(a)*h.r,h.z+Math.sin(a)*h.r,h.x+Math.cos(a)*h.r,h.z-Math.sin(a)*h.r)<.8}
  else if(['bumper','roller','hammer','boulder'].includes(h.type))collides=b.y<2&&Math.hypot(b.x-p.x,b.z-p.z)<(h.type==='bumper'?1.6:1.8);
  else if(h.type==='hurdle'||h.type==='gate')collides=b.y<h.height+.1&&Math.abs(b.z-h.z)<.8&&Math.abs(b.x-p.x)<h.w/2+.45;
  else if(h.type==='piston')collides=inPatch(h)&&p.y<2.4&&b.y<p.y+1;
  else if(h.type==='laser')collides=p.active&&b.y<1.1&&Math.abs(b.z-h.z)<.5&&Math.abs(b.x)<c.width/2-1;
  else if(h.type==='slalom'){for(let i=0;i<3;i++){const x=(i%2?1:-1)*c.width*.23;if(Math.abs(b.z-(h.z+3-i*3))<.65&&Math.abs(b.x-x)<c.width*.25&&b.y<2.6)collides=true}}
  else if(h.type==='tunnel')collides=Math.abs(b.x-h.x)<h.w/2&&Math.abs(b.z-h.z)<1&&b.dive<=0&&b.y<2.8;
  else if(h.type==='pulse')collides=p.active&&b.y<.8&&Math.abs(Math.hypot(b.x,b.z-h.z)-p.radius)<.55;
  if(collides){b.vx=(b.x-p.x>0?1:-1)*7;b.vz=7;b.vy=4.5;b.hit=1.05;b.hits++;events.push('hit');break}
 }
 if(b.y<-9){const p=resetPosition(b.cp,level);b.x=0;b.z=p.z;b.y=2;b.vy=b.vx=b.vz=0;b.hit=.8;b.falls++;events.push('fall')}
 if(b.grounded){const cp=checkpointFor(b.z,b.cp,level);if(cp>b.cp){b.cp=cp;events.push('checkpoint')}for(const pad of nearby(c.boosts,b.z,4))if(Math.abs(b.z-pad.z)<pad.d/2&&Math.abs(b.x-pad.x)<pad.w/2&&b.boost<.5){b.boost=1.5;events.push('boost')}}
 if(!b.isBot)for(const coin of nearby(c.coins,b.z,2))if(Math.abs(b.z-coin.z)<1.1&&Math.abs(b.x-coin.x)<1.05&&Math.abs(b.y+1-coin.y)<1.6&&!collectedSet(b).has(coin.id)){const taken=collectedSet(b);b.collected.push(coin.id);taken.add(coin.id);b.coins++;events.push('coin')}
 if(b.z<c.finishZ&&b.y>=0&&b.y<3&&floor(b.x,b.z)){b.finished=true;events.push('finish')}
 return events;
}
export function botInput(b,t,level){
 const c=buildLevel(level),local=nearby(c.hazards,b.z,18);let target=(b.lane||0)*.7;
 const ahead=local.find(h=>h.type==='trapdoor'&&h.z<b.z+5&&h.z>b.z-20)||local.find(h=>h.z<b.z+5&&h.z>b.z-16&&h.type!=='sweeper');
 if(ahead){const p=obstaclePosition(ahead,t,level);target=(Math.abs(p.x)<.5?(b.x<0?-1:1):p.x>0?-1:1)*c.width*.29;
  if(ahead.type==='slalom'){const row=clamp(Math.floor((ahead.z+4.2-b.z)/3),0,2);target=(row%2?-1:1)*c.width*.34}
 }
 const surface=nearby(c.platforms,b.z,80).find(p=>Math.abs(b.z-p.z)<=p.d/2+.15);
 const edge=surface?surface.z-surface.d/2:null;
 const approachingGap=edge!==null&&!groundAt(b.x,edge-.4,c.platforms)&&b.z-edge<11;
 const gap=!groundAt(b.x,b.z-1.7,c.platforms);
 const near=local.some(h=>['sweeper','hurdle','gate','laser','trapdoor','pulse'].includes(h.type)&&(h.z<=b.z+.2||h.type==='sweeper'||h.type==='pulse')&&Math.abs(b.z-h.z)<(h.type==='sweeper'||h.type==='pulse'?h.r+1:3));
 const tunnel=local.some(h=>h.type==='tunnel'&&Math.abs(b.z-h.z)<4);
 // Save jumps for the edge, and cross gaps straight rather than losing forward
 // speed while changing lanes. A late dive can rescue an airborne approach.
 const brake=approachingGap&&b.y>.1&&b.vy<0&&b.z-edge>2;
 const dx=brake||approachingGap&&b.z-edge<5?0:clamp((target-b.x)*1.4,-1,1);
 return {dx,dz:brake?0:-1,jump:(b.grounded||b.coyote>0)&&!tunnel&&(gap||near&&!approachingGap&&Math.sin(t*4+(b.seed||0)+b.falls*.7)>.05),dive:tunnel||b.y>.6&&b.dive===0&&gap};
}
