// Geometry, interaction costs and movement are shared by the server and renderer.
// Relay energy is room state: it never enters a player's persistent wallet.
export const RELAY = Object.freeze({capacity:8,stages:3,stageLength:112,seconds:240,speed:8.8,recovery:1.4});
export const RELAY_NAMES = ['Dawn Harbor','Copper Passage','Storm Crown'];
export const MECHANISMS = Object.freeze({
 bridge:{name:'Bridge',verb:'Lower bridge',cost:3,at:30,seconds:1.6},
 gate:{name:'Gate',verb:'Lift gate',cost:3,at:58,seconds:1.2},
 wind:{name:'Wind',verb:'Steady wind',cost:4,at:82,seconds:1.1}
});
export const RELAY_CRYSTALS = [{x:0,d:10},{x:0,d:23},{x:0,d:51},{x:0,d:67}];
export const relayOffset = stage => stage*RELAY.stageLength;
export const mechanismProgress = (mechanisms,key,clock) => {
 const started=mechanisms[key];
 return started===null||started===undefined?0:Math.min(1,Math.max(0,(clock-started)/MECHANISMS[key].seconds));
};
export function relayGround(x,d,bridge){
 if(d>=-7&&d<=30||d>=44&&d<=74||d>=92&&d<=112)return Math.abs(x)<=6;
 if(d>30&&d<44)return bridge>=1&&Math.abs(x)<=2.5;
 if(d>74&&d<92)return Math.abs(x)<=1.7;
 return false;
}
export function relaySpawn(p,stage,index=0){
 Object.assign(p,{x:(index%3-1)*1.8,z:-relayOffset(stage)-2,y:0,vy:0,vx:0,vz:0,actualSpeed:0,
  heading:0,grounded:true,coyote:.12,jumpBuffer:0,dive:0,eliminated:false,finished:false,
  deathReason:null,deathProgress:undefined,ready:false,input:{},recoverAt:null,invincible:3,cp:stage});
}
export function stepRelayRunner(p,input,dt,stage,mechanisms,clock){
 const events=[],offset=relayOffset(stage),oldD=-p.z-offset;
 let dx=Number.isFinite(input.dx)?Math.max(-1,Math.min(1,input.dx)):0;
 let dz=Number.isFinite(input.dz)?Math.max(-1,Math.min(1,input.dz)):0;
 const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len;}
 const bridge=mechanismProgress(mechanisms,'bridge',clock),gate=mechanismProgress(mechanisms,'gate',clock);
 const grounded=relayGround(p.x,oldD,bridge)&&p.y>=-.03&&p.y<=.025&&p.vy<=0;
 p.coyote=grounded?.12:Math.max(0,p.coyote-dt);p.jumpBuffer=input.jump?.13:Math.max(0,(p.jumpBuffer||0)-dt);
 if(p.jumpBuffer>0&&p.coyote>0){p.vy=9.4;p.coyote=0;p.jumpBuffer=0;events.push('jump');}
 p.dive=Math.max(0,p.dive-dt);if(input.dive&&!grounded&&p.dive===0)p.dive=.4;
 const speed=RELAY.speed*(p.dive>0?1.25:1),wind=oldD>74&&oldD<92?(mechanismProgress(mechanisms,'wind',clock)>=1?.65:5.5+stage*.7):0;
 p.vx+=(dx*speed+wind-p.vx)*Math.min(1,dt*9);p.vz+=(dz*speed-p.vz)*Math.min(1,dt*9);
 p.x+=p.vx*dt;p.z+=p.vz*dt;p.vy-=22*dt;p.y+=p.vy*dt;
 let d=-p.z-offset;
 // Swept wall tests prevent tunnelling; gates cannot be jumped over or bypassed on the deck edge.
 const walls=[{d:58,h:5.4,active:gate<1},{d:18,h:.8,active:true},{d:102,h:.8,active:true}];
 for(const wall of walls)if(wall.active&&p.y<wall.h&&Math.abs(p.x)<6.35){
  const near=wall.d-.7,far=wall.d+.7;
  if(oldD<=near&&d>near){d=near;p.z=-offset-d;p.vz=0;events.push('blocked');}
  else if(oldD>=far&&d<far){d=far;p.z=-offset-d;p.vz=0;events.push('blocked');}
 }
 if(d<0&&p.y>=-.03){p.z=-offset;d=0;p.vz=0;}
 p.grounded=p.y<=0&&p.vy<=0&&relayGround(p.x,d,bridge);
 if(p.grounded){p.y=0;p.vy=0;}
 p.invincible=Math.max(0,p.invincible-dt);p.actualSpeed=Math.hypot(p.vx,p.vz);
 if(len>.1)p.heading=Math.atan2(-dx,-dz);
 if(p.y<-6){p.eliminated=true;p.deathReason='water';p.falls++;events.push('fall');}
 return events;
}
