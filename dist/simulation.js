import {getPlatforms,getSweepers,getBumpers,levelById,bumperX,gateX} from './levels.js';
import {groundAt,segmentDistance,checkpointFor,resetPosition} from './physics.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const courses=new Map();
export function courseFor(level){if(!courses.has(level))courses.set(level,{platforms:getPlatforms(level),sweepers:getSweepers(level),bumpers:getBumpers(level),gates:levelById(level).gates});return courses.get(level)}
export function runnerState(index=0){return {x:(index%4-1.5)*2.6,z:4+Math.floor(index/4)*1.6,y:0,vy:0,vx:0,vz:0,cp:0,hit:0,dive:0,finished:false,grounded:true,coyote:.1,falls:0,rank:0,finishTime:null,heading:0}}
export function stepRunner(b,input,dt,t,level=1){
 if(b.finished||b.eliminated)return [];
 const course=courseFor(level),events=[];let dx=Number.isFinite(input.dx)?clamp(input.dx,-1,1):0,dz=Number.isFinite(input.dz)?clamp(input.dz,-1,1):0;
 const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len}if(len>.1)b.heading=Math.atan2(-dx,-dz);
 b.hit=Math.max(0,b.hit-dt);b.dive=Math.max(0,b.dive-dt);
 const grounded=b.y>=-.03&&b.y<=.025&&groundAt(b.x,b.z,course.platforms)&&b.vy<=0;b.grounded=grounded;b.coyote=grounded?.12:Math.max(0,b.coyote-dt);
 if(input.jump&&b.coyote>0){b.vy=10.4;b.coyote=0;b.grounded=false;events.push('jump')}
 if(input.dive&&b.dive===0&&!b.grounded&&b.y>.4){b.dive=.65;b.vx+=dx*8;b.vz+=(dz||-1)*8;b.vy=Math.max(b.vy,2);events.push('dive')}
 const speed=b.isBot?(b.speed||7):8.9,control=b.hit>.5?.3:1;b.x+=(dx*speed*control+b.vx)*dt;b.z+=(dz*speed*control+b.vz)*dt;b.vx*=Math.exp(-4*dt);b.vz*=Math.exp(-4*dt);
 const prevY=b.y;b.vy-=23*dt;b.y+=b.vy*dt;if(prevY>=-.02&&b.y<=0&&b.vy<0&&groundAt(b.x,b.z,course.platforms)){b.y=0;b.vy=0;b.grounded=true}
 const platform=course.platforms.find(p=>p.d>10&&Math.abs(b.z-p.z)<p.d/2-.5);if(platform&&b.y>=0&&b.y<.55)b.x=clamp(b.x,platform.x-platform.w/2+.75,platform.x+platform.w/2-.75);
 if(b.hit<=0&&b.y<1.25&&b.y>-.5)for(const s of course.sweepers){const a=t*s.speed+s.x;if(segmentDistance(b.x,b.z,s.x-Math.cos(a)*s.r,s.z+Math.sin(a)*s.r,s.x+Math.cos(a)*s.r,s.z-Math.sin(a)*s.r)<.83){b.vx=(b.x-s.x)*1.7+(s.speed>0?4:-4);b.vz=5;b.vy=6;b.hit=1;events.push('hit');break}}
 if(b.hit<=0&&b.y<2&&b.y>-.5)for(const ob of course.bumpers){const x=bumperX(ob,t,level),dist=Math.hypot(b.x-x,b.z-ob.z);if(dist<1.75){b.vx=(b.x-x)/(dist||1)*13;b.vz=(b.z-ob.z)/(dist||1)*12;b.vy=5;b.hit=.85;events.push('hit');break}}
 if(b.hit<=0&&b.y<1.5&&b.y>-.5)for(const g of course.gates){if(Math.abs(b.z-g.z)<.9&&Math.abs(b.x-gateX(g,t))<g.w/2+.5){b.vx=(b.x>gateX(g,t)?1:-1)*6;b.vz=9;b.vy=4;b.hit=.9;events.push('hit');break}}
 if(b.y<-9){const p=resetPosition(b.cp);b.x=b.isBot?b.lane||0:p.x;b.z=p.z;b.y=2;b.vy=b.vx=b.vz=0;b.hit=.5;b.falls++;events.push('fall')}
 if(b.grounded){const cp=checkpointFor(b.z,b.cp);if(cp>b.cp){b.cp=cp;events.push('checkpoint')}}
 if(b.z<-127&&b.y>=0&&b.y<3&&groundAt(b.x,b.z,course.platforms)){b.finished=true;events.push('finish')}
 return events;
}
export function botInput(b,t,level){const c=courseFor(level);let target=b.lane||0;if(b.z>-70&&b.z<-40)target+=Math.sin(b.z*.5+(b.seed||0))*2.3;const dx=clamp((target-b.x)*1.8,-1,1),gap=!groundAt(b.x,b.z-1.25,c.platforms),near=c.sweepers.some(s=>Math.abs(b.z-s.z)<s.r+1&&Math.sin(t*3+(b.seed||0))>.6),gate=c.gates.some(g=>Math.abs(b.z-g.z)<2.4);return {dx,dz:-1,jump:b.grounded&&(gap||near||gate),dive:b.y>.7&&b.vy>0&&b.dive===0&&gap}}
