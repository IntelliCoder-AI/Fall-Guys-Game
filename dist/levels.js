import {REFERENCE_TIMES} from './balance.js';
export const MAX_LEVEL=50;
export const WORLDS=[
 {name:'Sunshore',subtitle:'Find your rhythm',sky:0xb8e8ee,slime:0x39abb7,track:0xe2bc7e,edge:0xe6f9f4,accent:0xffb264,scenery:0xf7d5ad},
 {name:'Sundown City',subtitle:'Own the streets',sky:0xf6cab6,slime:0xb95e94,track:0xdc8ba9,edge:0xffe7bc,accent:0xffd45c,scenery:0xb67db2},
 {name:'Neon Heights',subtitle:'Chase the lights',sky:0x333856,slime:0x24263e,track:0x586cb4,edge:0x68f8c7,accent:0xf18bd1,scenery:0x555078},
 {name:'Frostline',subtitle:'Keep your cool',sky:0xc7e0fa,slime:0x8bb6dc,track:0xdde6ee,edge:0xf3ffff,accent:0xff9a75,scenery:0xe7eff9},
 {name:'Skyline Summit',subtitle:'Earn your legend',sky:0xb5b7ef,slime:0x7765aa,track:0x9b87ca,edge:0xffeab2,accent:0xffc455,scenery:0xbca7d8}
];
const NAMES=['First Flight','Wheel Works','Island Hopping','Fireball Run','Gate Runner','Switchback','Tidal Rush','Pressure Point','Overdrive','Crown Gauntlet'];
export const OBSTACLES=[
 ['hurdle',1,'Jump school','Jump the striped barriers. They span the entire track.'],
 ['wheel',2,'Roaming wheels','Huge spoked wheels roll all the way from one edge to the other.'],
 ['bridge',3,'Sea bridges','Center yourself before the narrow bridge. Open sides mean real falls.'],
 ['fireballs',4,'Fireball volleys','Watch the launchers. Dodge the orange volleys crossing three lanes.'],
 ['gate',5,'Moving openings','Follow the opening. The panels block both edges.'],
 ['sweeper',6,'Rotating arms','Jump the low arm; stay clear of its return swing.'],
 ['bumper',7,'Bumper lanes','Drums guard the outside lanes. Weave between them.'],
 ['conveyor',8,'Reverse belts','Jump or sprint against the belt.'],
 ['roller',9,'Crossing rollers','Dodge the balls rolling across the full track.'],
 ['hammer',10,'Hammer gauntlet','Time your pass under the swinging hammers.'],
 ['ice',11,'Ice run-ups','Brake early. Ice leads directly toward a jump.'],
 ['wind',12,'Wind bridges','Counter the wind on the narrow, unguarded bridge.'],
 ['piston',14,'Timed crushers','Wait for the press to rise, then sprint underneath.'],
 ['laser',16,'Laser fences','Jump the beam or wait for the green signal.'],
 ['launchpad',18,'Spring islands','Use the spring to vault the next obstacle.'],
 ['trapdoor',20,'Checkerboard floors','Orange tiles warn before opening. Stay on the closed tiles.'],
 ['slalom',22,'Slalom walls','Weave through alternating openings.'],
 ['tunnel',24,'Dive tunnels','Slide beneath the arch. Both edges are blocked.'],
 ['mud',26,'Sticky run-ups','Jump off the slime before it steals your momentum.'],
 ['moving',28,'Moving platforms','Ride the drifting platform and line up your next landing.'],
 ['magnet',30,'Magnet fields','Steer away from the pull near an exposed edge.'],
 ['vanishing',32,'Vanishing islands','Wait for the platform to return, then cross before it fades.'],
 ['pulse',34,'Shockwave rings','Jump the expanding ring while weaving through the walls.'],
 ['boulder',38,'Boulder chutes','Dodge incoming boulders and find the next opening.']
].map(([type,unlock,name,tip])=>({type,unlock,name,tip}));
function metadata(id,endurance=false){
 const i=id-1,w=Math.floor(i/10),stage=i%10,theme=WORLDS[w],newObstacles=OBSTACLES.filter(o=>o.unlock===id);
 const challenge=Math.min(1,.15+w*.15+stage*.022+(stage===9?.12:0))*(newObstacles.length&&id>1?.94:1);
 const tourDistance=1000+75*i+(stage===9?150+w*75+(w===4?700:0):0);
 const distance=endurance?1000+Math.round(59000*Math.pow(i/49,1.3)/100)*100:tourDistance;
 const measuredReference=REFERENCE_TIMES[i]||tourDistance/7.5+20;
 // Preserve the measured runs, but prevent medal targets stepping backward
 // inside a world. World openings deliberately reset after a finale.
 const reference=Math.max(measuredReference,...REFERENCE_TIMES.slice(w*10,i+1));
 const gold=Math.ceil((endurance?reference*distance/tourDistance:reference)*1.1),silver=Math.ceil(gold*1.3);
 return {id:id+(endurance?100:0),number:id,mode:endurance?'endurance':'tour',name:NAMES[stage],world:theme.name,worldIndex:w,theme,tag:stage===9?'WORLD FINALE':newObstacles.length?'NEW CHALLENGE':theme.subtitle.toUpperCase(),distance,finishZ:4-distance,width:20-w*2.1-stage*.14,challenge,spacing:32-23*challenge,speed:.8+challenge*1.1,gap:3+challenge*4.8,qualify:endurance?16:stage===9?8:12,runners:16,gold,silver,referenceTime:reference,measuredReference,seconds:Math.ceil(silver*1.65+30),difficulty:w+1,newObstacles,obstacleTypes:OBSTACLES.filter(o=>o.unlock<=id).map(o=>o.type),sky:theme.sky,slime:theme.slime};
}
export const LEVELS=Array.from({length:50},(_,i)=>metadata(i+1));
export const ENDURANCE_LEVELS=Array.from({length:50},(_,i)=>metadata(i+1,true));
export function levelById(value){const n=Math.floor(Number(value))||1;return n>=101&&n<=150?ENDURANCE_LEVELS[n-101]:LEVELS[Math.max(0,Math.min(49,n-1))]}
export function nearby(items,z,radius=24){let lo=0,hi=items.length;while(lo<hi){const m=(lo+hi)>>>1;if(items[m].z>z+radius)lo=m+1;else hi=m}const start=lo;while(lo<items.length&&items[lo].z>=z-radius)lo++;return items.slice(start,lo)}
const cache=new Map();
export function buildLevel(value=1){
 const l=levelById(value);if(cache.has(l.id))return cache.get(l.id);
 const platforms=[],hazards=[],checkpoints=[{x:0,z:4}],coins=[],boosts=[],sections=[];
 const has=t=>l.obstacleTypes.includes(t),types=l.obstacleTypes.filter(t=>!['bridge','moving','vanishing'].includes(t));
 let front=12,index=0,serial=0;
 const addPlatform=(a,b,width,kind='track',phase=0)=>platforms.push({x:0,z:(a+b)/2,w:width,d:a-b,kind,rails:kind==='track'&&l.number<6,motion:kind==='moving'?'moving':kind==='vanishing'?'vanishing':null,phase,period:8,activeFraction:.82-l.challenge*.17,color:l.theme.track});
 function hazard(type,z,x=0,extra={}){const full=['hurdle','gate','conveyor','ice','piston','laser','tunnel','mud'].includes(type);const h={id:serial++,type,z,x,r:l.width/2-.45,w:type==='piston'?l.width*.65:full?l.width:Math.min(6,l.width*.48),trackWidth:l.width,d:6,speed:l.speed*(1+(serial%3)*.08)*(serial%2?1:-1),phase:(serial*.37)%1,height:type==='hurdle'?.65+l.challenge*.65:2.8,opening:Math.max(3,5-l.challenge*1.7),challenge:l.challenge,...extra};hazards.push(h);return h}
 while(front>l.finishZ-14){
  const length=Math.min(100,front-(l.finishZ-14)),back=front-length,last=back<=l.finishZ-14,finale=l.number%10===0;
  let kind='track';if(index>0&&length>80&&!last){if(has('bridge')&&index%3===1)kind='bridge';if(has('moving')&&index%7===3)kind='moving';if(has('vanishing')&&index%7===5)kind='vanishing'}
  if(index>0&&front>l.finishZ+30)checkpoints.push({x:0,z:front-6});
  const narrow=Math.max(3.2,(l.number>=8?5.4:6.4)-l.challenge*1.7-(l.worldIndex===4&&kind==='bridge'?.35:0));
  if(kind==='track'){addPlatform(front,back,l.width);if(l.number>=3&&index%3===2&&length>85&&!last){const p=platforms.at(-1);p.terrain=['hills','ridge','summit'][(Math.floor(index/3)+l.worldIndex)%3];p.height=p.terrain==='hills'?1.7+l.worldIndex*.25:3+l.worldIndex*.7;}}
  else{addPlatform(front,front-32,l.width);if(kind==='vanishing'){for(let j=0;j<3;j++)addPlatform(front-32-j*17,front-46-j*17,narrow,'vanishing',-j*.22+index*.11);addPlatform(front-83,back,l.width)}else{addPlatform(front-32,front-76,narrow,kind,index*.7);addPlatform(front-76,back,l.width)}}
  const section={index,front,back,z:(front+back)/2,kind,title:kind==='track'?'Obstacle arena':kind==='bridge'?'Sea crossing':kind==='moving'?'Drifting island':'Vanishing islands'};sections.push(section);
  if(kind!=='track'){
   hazard(kind,front-48,0,{w:narrow,d:40});
   if(has('wind')&&kind==='bridge'){hazard('wind',front-44,0,{w:narrow,d:16});section.title='Crosswind crossing'}
   // Crossing hazards occupy stable decks and bridge spans. Drifting and
   // disappearing floors remain readable, with hazards on their approaches.
   hazard('hurdle',front-16);
   if(l.worldIndex>=1)hazard('hurdle',front-86);
   if(kind==='bridge'){
    hazard('hurdle',front-35,0,{w:narrow,height:.65+l.challenge*.35});
    if(has('fireballs')&&index%2===0)hazard('fireballs',front-62,0,{w:narrow});
    else hazard('hurdle',front-62,0,{w:narrow,height:.65+l.challenge*.35});
    if(has('laser'))hazard('laser',front-75);
    if(l.worldIndex>=2)hazard('ice',front-53,0,{w:narrow,d:8});
    if(has('magnet')&&index%2)hazard('magnet',front-53,(index%4===1?-1:1)*narrow*.6,{w:3,d:6});
   }
   if(l.worldIndex>=2){for(const x of[-l.width/2+1.4,l.width/2-1.4])hazard('bumper',front-10,x)}
   if(l.worldIndex>=1)hazard('conveyor',front-12,0,{d:5});
   if(l.worldIndex>=3){for(const x of[-l.width/2+1.4,l.width/2-1.4])hazard('bumper',front-80,x)}
  }else{
   const sectionStart=hazards.length;
   const rows=Math.max(1,Math.min(8,Math.round((length-20)/l.spacing)));
   for(let j=0;j<rows;j++){
    const z=front-16-j*(length-28)/Math.max(1,rows-1);
    // After the recovery opener, retain active challenges from the previous
    // world instead of filling the second/third course with passive terrain.
    const pool=l.worldIndex>0&&[1,2].includes((l.number-1)%10)?types.filter(t=>!['ice','wind','mud','conveyor','launchpad','magnet'].includes(t)):types;
    let type=pool[(index*5+j*3+Math.floor(index/3))%pool.length];
    if(l.number===1)type='hurdle';
    if(index===0&&j===0&&l.newObstacles.length)type=l.newObstacles.at(-1).type;
    if(type==='sweeper'&&(index+j)%3!==0)type=has('wheel')?'wheel':'hurdle';
    // The outside lanes are part of the course, not a permanent bypass.
    const lane=['bumper','hammer','boulder'].includes(type)?(j%2?1:-1)*(l.width/2-1.2):0;
    hazard(type,z,lane);
    if(type==='bumper'&&l.worldIndex>=1)hazard('bumper',z,-lane);
    if(l.worldIndex>=3&&j===1&&['hurdle','laser','tunnel'].includes(type))hazard('conveyor',z,0,{d:5});
   }
   // A section has one authored combo; replace its generic rows so unrelated
   // barriers cannot accidentally seal the intended route.
   let combo=null;
   if(l.worldIndex>=1&&length>85){if(has('laser')&&index%5===0)combo='gate';else if(has('piston')&&index%5===2)combo='press';else if(has('pulse')&&index%5===4)combo='pulse'}
   if(finale&&index%2===0&&length>85)combo='finale';
   if(combo){hazards.splice(sectionStart);hazard('hurdle',front-16);
    if(l.worldIndex>=1)for(const x of[-l.width/2+1.4,l.width/2-1.4])hazard('bumper',front-25,x);
    if(combo==='gate'){hazard('gate',front-35);hazard('laser',front-46);hazard('wheel',front-68);section.title='Gate + laser'}
    if(combo==='press'){hazard('conveyor',front-46);hazard('piston',front-46);hazard('wheel',front-70);section.title='Pressure belt'}
    if(combo==='pulse'){hazard('slalom',front-40);hazard('pulse',front-53);hazard('fireballs',front-72);section.title='Shockwave slalom'}
    if(combo==='finale'){hazard('wheel',front-34);hazard('gate',front-53);hazard('fireballs',front-72);section.title='Finale gauntlet'}
    hazard('hurdle',front-87);
    if(l.worldIndex>=2)hazard('conveyor',front-87,0,{d:5});
    if(l.worldIndex>=3)hazard('laser',front-78);
   }

  }
  const gap=!last&&back>l.finishZ+28&&index%3===1?l.gap:0;
  if(gap&&has('ice'))hazard(index%2&&has('mud')?'mud':'ice',back+5,0,{d:8});
  front=back-gap;index++;
 }
 // Reserve a clear finish apron: timed floors and impacts must not obscure
 // the finish trigger or push a crossing runner back out of the result.
 for(let i=hazards.length-1;i>=0;i--)if(hazards[i].z<l.finishZ+10)hazards.splice(i,1);
 // Keep first introductions legible and preserve safe checkpoint landing areas.
 hazards.sort((a,b)=>b.z-a.z);for(const p of checkpoints.slice(1))boosts.push({x:0,z:p.z-6,w:3,d:2});
 let coinId=0;for(let z=-12;z>l.finishZ+12;z-=9){const p=nearby(platforms,z,100).find(p=>Math.abs(z-p.z)<p.d/2-2);if(p)coins.push({id:coinId++,x:Math.sin(coinId*.7)*Math.min(3,p.w*.25),y:1.2,z})}
 const result={...l,hazardCount:hazards.length,platforms,hazards,checkpoints,coins,boosts,sections};cache.set(l.id,result);return result;
}
// Populate lobby counts from the same section generator used by physics.
for(const l of[...LEVELS,...ENDURANCE_LEVELS])l.hazardCount=buildLevel(l.id).hazardCount;
export function platformPosition(p,t=0){if(p.motion==='moving')return {x:Math.sin(t*.8+p.phase)*2.1,active:true};if(p.motion==='vanishing'){const cycle=((t/(p.period||8)+p.phase)%1+1)%1,active=p.activeFraction||.82;return {x:0,active:cycle<active,warning:cycle>active-.18}}return {x:p.x,active:true}}
export function obstaclePosition(h,t,level){
 const l=levelById(level),cycle=((t*Math.abs(h.speed)*.22+h.phase)%1+1)%1,width=h.trackWidth||l.width;
 if(h.type==='wheel'||h.type==='roller')return {x:Math.sin(t*Math.abs(h.speed)+h.phase)*(width/2-.3),y:h.type==='wheel'?1.8:1.1,z:h.z};
 if(h.type==='bumper')return {x:h.x+Math.sin(t*1.4+h.phase)*.6,y:.9,z:h.z};
 if(h.type==='gate')return {x:Math.sin(t*Math.abs(h.speed)*.6+h.phase)*(width/2-h.opening/2-.3),y:1.4,z:h.z};
 if(h.type==='hammer')return {x:Math.sin(t*Math.abs(h.speed)+h.phase)*(width/2-.5),y:1.6,z:h.z};
 if(h.type==='piston'){const safe=.46-l.challenge*.15;return {x:h.x,y:cycle<safe?4.5:cycle<safe+.12?4.5-(cycle-safe)/.12*4:cycle<.86?.5:.5+(cycle-.86)/.14*4,z:h.z,active:cycle>=safe&&cycle<.86}}
 if(h.type==='laser')return {x:0,y:.7,z:h.z,active:cycle<.6+l.challenge*.15};
 if(h.type==='trapdoor')return {x:h.x,y:0,z:h.z,active:cycle>.54,warning:cycle>.38};
 if(h.type==='pulse')return {x:0,y:.3,z:h.z,radius:cycle*(width*.75),active:cycle<.9};
 if(h.type==='boulder')return {x:h.x,y:1.2,z:h.z-8+cycle*16,active:true};
 return {x:h.x,y:.7,z:h.z,cycle};
}
export function fireballPositions(h,t){return Array.from({length:3},(_,i)=>{const cycle=((t*(.24+Math.abs(h.speed)*.1)+i*.31+h.phase)%1+1)%1;return {x:(cycle-.5)*(h.trackWidth+6)*(i%2?-1:1),y:1.1+i%2*.4,z:h.z+(i-1)*3,active:cycle>.07&&cycle<.93}})}
export const getPlatforms=id=>buildLevel(id).platforms;
export const getSweepers=id=>buildLevel(id).hazards.filter(h=>h.type==='sweeper');
export const getBumpers=id=>buildLevel(id).hazards.filter(h=>h.type==='bumper');
export const bumperX=(h,t,id)=>obstaclePosition(h,t,id).x;
export const gateX=(h,t,id=1)=>obstaclePosition(h,t,id).x;
export function trapdoorTiles(h,t,level){const width=h.trackWidth/3;return Array.from({length:6},(_,i)=>{const col=i%3,row=Math.floor(i/3),state=obstaclePosition({...h,phase:h.phase+(col+row)*.5},t,level);return {x:(col-1)*width,z:h.z+(row-.5)*4,w:width-.08,d:3.92,active:state.active,warning:state.warning}})}
