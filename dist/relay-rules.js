// Geometry, interaction costs and movement are shared by the server and renderer.
// Relay energy is room state: it never enters a player's persistent wallet.
export const RELAY = Object.freeze({capacity:8,stages:3,stageLength:160,seconds:120,speed:8.8,recovery:1.4});
export const RELAY_NAMES = ['Dawn Harbor','Copper Passage','Storm Crown'];
export const MECHANISMS = Object.freeze({
 bridge:{name:'Bridge',verb:'Lower bridge',cost:3,at:30,seconds:1.6,hold:8},
 gate:{name:'Gate',verb:'Lift gate',cost:3,at:58,seconds:1.2,hold:7},
 wind:{name:'Wind',verb:'Steady wind',cost:4,at:82,seconds:1.1,hold:9},
 lift:{name:'Rescue lift',verb:'Raise lift',cost:2,at:145,seconds:1.5,hold:6}
});
export const RELAY_CRYSTALS = [{x:0,d:10},{x:0,d:23},{x:0,d:51},{x:0,d:67}];
export const RELAY_LAYOUTS = [
 {bridge:35,gate:80,wind:112,hurdles:[18,68,146],crystals:[10,23,73,106],seals:[{x:-3,d:57},{x:3,d:100}],sweepers:[94],order:['bridge','gate','wind']},
 {bridge:116,gate:34,wind:62,hurdles:[18,98,148],crystals:[10,24,53,107],seals:[{x:3,d:48},{x:-3,d:102}],sweepers:[88,140],order:['gate','wind','bridge']},
 {bridge:82,gate:120,wind:28,lift:145,hurdles:[16,64,110],crystals:[10,20,71,103],seals:[{x:-3,d:56},{x:3,d:108}],sweepers:[70,134],order:['wind','bridge','gate','lift']}
];
export const relayLayout = stage => RELAY_LAYOUTS[stage]||RELAY_LAYOUTS[0];
export const relayBeacon = () => RELAY.stageLength-3;
export const relayCrystals = stage => relayLayout(stage).crystals.map(d=>({x:0,d}));
export const relaySweeperX = (clock,index,stage) => Math.sin(clock*(.8+stage*.12)+index*2)*4.5;
export const mechanismTimeLeft = (mechanisms,key,clock) => mechanisms[key]===null||mechanisms[key]===undefined?0:Math.max(0,MECHANISMS[key].seconds+MECHANISMS[key].hold-(clock-mechanisms[key]));
export const relayOffset = stage => stage*RELAY.stageLength;
export const mechanismProgress = (mechanisms,key,clock) => {
 const started=mechanisms[key];
 if(started===null||started===undefined)return 0;
 const elapsed=clock-started,m=MECHANISMS[key];
 if(elapsed<m.seconds)return Math.max(0,elapsed/m.seconds);
 if(elapsed<=m.seconds+m.hold)return 1;
 return Math.max(0,1-(elapsed-m.seconds-m.hold));
};
export function relayGround(x,d,bridge,stage=0,lift=0){
 const l=relayLayout(stage);
 if(d<-7||d>RELAY.stageLength)return false;
 if(l.lift&&d>l.lift&&d<l.lift+10)return lift>=1&&Math.abs(x)<=2.5;
 if(d>l.bridge&&d<l.bridge+14)return bridge>=1&&Math.abs(x)<=2.5;
 if(d>l.wind&&d<l.wind+18)return Math.abs(x)<=1.7;
 return Math.abs(x)<=6;
}
export function relaySpawn(p,stage,index=0){
 Object.assign(p,{x:(index%3-1)*1.8,z:-relayOffset(stage)-2,y:0,vy:0,vx:0,vz:0,actualSpeed:0,
  heading:0,grounded:true,coyote:.12,jumpBuffer:0,dive:0,eliminated:false,finished:false,
  deathReason:null,deathProgress:undefined,ready:false,input:{},recoverAt:null,invincible:3,cp:stage});
}
export function stepRelayRunner(p,input,dt,stage,mechanisms,clock){
 const l=relayLayout(stage),events=[],offset=relayOffset(stage),oldD=-p.z-offset;
 let dx=Number.isFinite(input.dx)?Math.max(-1,Math.min(1,input.dx)):0;
 let dz=Number.isFinite(input.dz)?Math.max(-1,Math.min(1,input.dz)):0;
 const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len;}
 const bridge=mechanismProgress(mechanisms,'bridge',clock),gate=mechanismProgress(mechanisms,'gate',clock);
 const grounded=relayGround(p.x,oldD,bridge,stage,mechanismProgress(mechanisms,'lift',clock))&&p.y>=-.03&&p.y<=.025&&p.vy<=0;
 p.coyote=grounded?.12:Math.max(0,p.coyote-dt);p.jumpBuffer=input.jump?.13:Math.max(0,(p.jumpBuffer||0)-dt);
 if(p.jumpBuffer>0&&p.coyote>0){p.vy=9.4;p.coyote=0;p.jumpBuffer=0;events.push('jump');}
 p.dive=Math.max(0,p.dive-dt);if(input.dive&&!grounded&&p.dive===0)p.dive=.4;
 const speed=RELAY.speed*(p.dive>0?1.25:1),wind=oldD>l.wind&&oldD<l.wind+18?(mechanismProgress(mechanisms,'wind',clock)>=1?.65:5.5+stage*.7):0;
 p.vx+=(dx*speed+wind-p.vx)*Math.min(1,dt*9);p.vz+=(dz*speed-p.vz)*Math.min(1,dt*9);
 p.x+=p.vx*dt;p.z+=p.vz*dt;p.vy-=22*dt;p.y+=p.vy*dt;
 let d=-p.z-offset;
 // Swept wall tests prevent tunnelling; gates cannot be jumped over or bypassed on the deck edge.
 const walls=[{d:l.gate,h:5.4,active:gate<1},...l.hurdles.map(d=>({d,h:.8,active:true}))];
 for(const wall of walls)if(wall.active&&p.y<wall.h&&Math.abs(p.x)<6.35){
  const near=wall.d-.7,far=wall.d+.7;
  if(oldD<=near+1e-6&&d>near){d=near;p.z=-offset-d;p.vz=0;events.push('blocked');}
  else if(oldD>=far-1e-6&&d<far){d=far;p.z=-offset-d;p.vz=0;events.push('blocked');}
 }
 if(d<0&&p.y>=-.03){p.z=-offset;d=0;p.vz=0;}
 p.grounded=p.y<=0&&p.vy<=0&&relayGround(p.x,d,bridge,stage,mechanismProgress(mechanisms,'lift',clock));
 if(p.grounded){p.y=0;p.vy=0;}
 // Telegraphing arms sweep across deck lanes. Jump or steer around the head.
 for(const [i,at]of l.sweepers.entries())if(p.invincible<=0&&p.y<1.15&&Math.abs(d-at)<.85&&Math.abs(p.x-relaySweeperX(clock,i,stage))<1.1){
  p.z+=2;p.vz=0;p.vx=p.x>=0?3:-3;p.invincible=1.2;p.hits=(p.hits||0)+1;events.push('hit');
 }
 p.invincible=Math.max(0,p.invincible-dt);p.actualSpeed=Math.hypot(p.vx,p.vz);
 if(len>.1)p.heading=Math.atan2(-dx,-dz);
 if(p.y<-6){p.eliminated=true;p.deathReason='water';p.falls++;events.push('fall');}
 return events;
}
