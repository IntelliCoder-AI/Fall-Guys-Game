import {buildLevel,obstaclePosition} from './levels.js';
import {groundAt,segmentDistance,checkpointFor,resetPosition} from './physics.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const courseFor=buildLevel;
export function runnerState(index=0){return {x:(index%4-1.5)*2.4,z:4+Math.floor(index/4)*1.6,y:0,vy:0,vx:0,vz:0,cp:0,hit:0,dive:0,boost:0,finished:false,grounded:true,coyote:.1,falls:0,hits:0,coins:0,collected:[],rank:0,finishTime:null,heading:0}}
export function stepRunner(b,input,dt,t,level=1){
 if(b.finished||b.eliminated)return [];
 const c=buildLevel(level),events=[];let dx=Number.isFinite(input.dx)?clamp(input.dx,-1,1):0,dz=Number.isFinite(input.dz)?clamp(input.dz,-1,1):0;const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len}if(len>.1)b.heading=Math.atan2(-dx,-dz);
 b.hit=Math.max(0,b.hit-dt);b.dive=Math.max(0,b.dive-dt);b.boost=Math.max(0,b.boost-dt);
 const grounded=b.y>=-.03&&b.y<=.025&&groundAt(b.x,b.z,c.platforms)&&b.vy<=0;b.grounded=grounded;b.coyote=grounded?.12:Math.max(0,b.coyote-dt);
 if(input.jump&&b.coyote>0){b.vy=10.6;b.coyote=0;b.grounded=false;events.push('jump')}
 if(input.dive&&b.dive===0&&!b.grounded&&b.y>.4){b.dive=.65;b.vx+=dx*8;b.vz+=(dz||-1)*8;b.vy=Math.max(b.vy,2);events.push('dive')}
 const speed=(b.isBot?(b.speed||8.4):10.5)*(b.boost>0?1.4:1),control=b.hit>.5?.35:1;b.x+=(dx*speed*control+b.vx)*dt;b.z+=(dz*speed*control+b.vz)*dt;b.vx*=Math.exp(-4*dt);b.vz*=Math.exp(-4*dt);
 const prevY=b.y;b.vy-=23*dt;b.y+=b.vy*dt;if(prevY>=-.02&&b.y<=0&&b.vy<0&&groundAt(b.x,b.z,c.platforms)){b.y=0;b.vy=0;b.grounded=true}
 const platform=c.platforms.find(p=>Math.abs(b.z-p.z)<p.d/2-.5);if(platform&&b.y>=0&&b.y<.5)b.x=clamp(b.x,-platform.w/2+.65,platform.w/2-.65);
 if(b.hit<=0&&b.y>-.5)for(const h of c.hazards){if(Math.abs(b.z-h.z)>h.r+3)continue;const p=obstaclePosition(h,t,level);let collides=false;if(h.type==='sweeper'){const a=t*h.speed+h.phase;collides=b.y<1.2&&segmentDistance(b.x,b.z,h.x-Math.cos(a)*h.r,h.z+Math.sin(a)*h.r,h.x+Math.cos(a)*h.r,h.z-Math.sin(a)*h.r)<.8}else if(h.type==='bumper'||h.type==='roller'||h.type==='hammer'){collides=b.y<2&&Math.hypot(b.x-p.x,b.z-p.z)<(h.type==='bumper'?1.6:1.8)}else collides=b.y<h.height+.1&&Math.abs(b.z-h.z)<.8&&Math.abs(b.x-p.x)<h.w/2+.45;
 if(collides){b.vx=(b.x-p.x>0?1:-1)*7;b.vz=7;b.vy=4.5;b.hit=1.05;b.hits++;events.push('hit');break}}
 if(b.y<-9){const p=resetPosition(b.cp,level);b.x=0;b.z=p.z;b.y=2;b.vy=b.vx=b.vz=0;b.hit=.8;b.falls++;events.push('fall')}
 if(b.grounded){const cp=checkpointFor(b.z,b.cp,level);if(cp>b.cp){b.cp=cp;events.push('checkpoint')}for(const pad of c.boosts)if(Math.abs(b.z-pad.z)<pad.d/2&&Math.abs(b.x-pad.x)<pad.w/2&&b.boost<.5){b.boost=1.5;events.push('boost')}}
 if(!b.isBot)for(const coin of c.coins){if(Math.abs(b.z-coin.z)<1.1&&Math.abs(b.x-coin.x)<1.05&&Math.abs(b.y+1-coin.y)<1.6&&!b.collected.includes(coin.id)){b.collected.push(coin.id);b.coins++;events.push('coin')}}
 if(b.z<c.finishZ&&b.y>=0&&b.y<3&&groundAt(b.x,b.z,c.platforms)){b.finished=true;events.push('finish')}
 return events;
}
export function botInput(b,t,level){const c=buildLevel(level);let target=(b.lane||0)*.7;const ahead=c.hazards.find(h=>h.z<b.z+1&&h.z>b.z-8&&h.type!=='sweeper');if(ahead){const p=obstaclePosition(ahead,t,level);target=p.x>0?-c.width*.27:c.width*.27}const dx=clamp((target-b.x)*1.4,-1,1),gap=!groundAt(b.x,b.z-1.5,c.platforms),near=c.hazards.some(h=>Math.abs(b.z-h.z)<(h.type==='sweeper'?h.r+1:3));return {dx,dz:-1,jump:b.grounded&&(gap||near&&Math.sin(t*4+(b.seed||0))>.05),dive:b.y>.7&&b.vy>0&&b.dive===0&&gap}}
