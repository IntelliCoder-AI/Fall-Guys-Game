export const MAX_LEVEL=50;
export const WORLDS=[
 {name:'Sunshore',subtitle:'Find your rhythm',sky:0xb8e8ee,slime:0x39abb7,track:0x45c9d0,edge:0xe6f9f4,accent:0xffb264,scenery:0xf7d5ad},
 {name:'Sundown City',subtitle:'Own the streets',sky:0xf6cab6,slime:0xb95e94,track:0xdc8ba9,edge:0xffe7bc,accent:0xffd45c,scenery:0xb67db2},
 {name:'Neon Heights',subtitle:'Chase the lights',sky:0x333856,slime:0x24263e,track:0x586cb4,edge:0x68f8c7,accent:0xf18bd1,scenery:0x555078},
 {name:'Frostline',subtitle:'Keep your cool',sky:0xc7e0fa,slime:0x8bb6dc,track:0x91b9e4,edge:0xf3ffff,accent:0xff9a75,scenery:0xe7eff9},
 {name:'Skyline Summit',subtitle:'Earn your legend',sky:0xb5b7ef,slime:0x7765aa,track:0x9b87ca,edge:0xffeab2,accent:0xffc455,scenery:0xbca7d8}
];
const NAMES=['First Flight','Crosswind','Switchback','Momentum','High Frequency','Side Hustle','Overdrive','No Looking Back','The Long Run','Crown Run'];
// New mechanics are introduced throughout the tour, not just in its opening world.
export const OBSTACLES=[
 ['sweeper',1,'Sweepers','Jump over the rotating arms.'],['hurdle',1,'Hurdles','Jump the striped barriers.'],
 ['bumper',2,'Bumpers','Dodge the bouncing drums.'],['gate',3,'Sliding gates','Follow the opening as it moves sideways.'],
 ['hammer',4,'Hammers','Watch the swinging head and pass behind it.'],['roller',5,'Crossing rollers','Dodge the balls rolling across your lane.'],
 ['conveyor',7,'Conveyors','Run against the belt or jump to escape its pull.'],['ice',10,'Ice lanes','Steer early: momentum carries you across the ice.'],
 ['wind',13,'Crosswinds','Lean into the wind or choose the sheltered lane.'],['piston',16,'Crushers','Pass when the overhead press is raised.'],
 ['laser',19,'Laser fences','Jump the active beam or wait for green.'],['launchpad',22,'Launch pads','Use the spring to vault the course.'],
 ['trapdoor',25,'Trapdoors','Orange warns you: jump before the floor opens.'],['slalom',28,'Slalom walls','Weave through three alternating openings.'],
 ['tunnel',31,'Low tunnels','Dive through the low arch or take the outside lane.'],['mud',34,'Sticky slime','Jump across the purple patch to keep your speed.'],
 ['magnet',38,'Magnet fields','Steer away from the pulsing magnet.'],['pulse',42,'Shockwave rings','Jump the expanding ring when it reaches you.'],
 ['boulder',46,'Boulder chutes','Move sideways to avoid balls rolling toward you.']
].map(([type,unlock,name,tip])=>({type,unlock,name,tip}));
export const LEVELS=Array.from({length:50},(_,i)=>{
 const id=i+1,world=WORLDS[Math.floor(i/10)],distance=1000+Math.round(59000*Math.pow(i/49,1.3)/100)*100;
 const hazardCount=Math.floor(distance/(32-i*.25)),obstacleTypes=OBSTACLES.filter(o=>o.unlock<=id).map(o=>o.type);
 // Allow time for steering, waiting for cycles and recovering from dense late-course hazards.
 const gold=Math.ceil(distance/10.5*1.25+hazardCount*(1.1+i*.025)+15),silver=Math.ceil(gold*1.35);
 return {id,name:NAMES[i%10],world:world.name,worldIndex:Math.floor(i/10),theme:world,tag:i%10===9?'WORLD FINALE':world.subtitle.toUpperCase(),description:`${distance.toLocaleString()}m. ${hazardCount} obstacles across ${obstacleTypes.length} mechanics.`,distance,finishZ:4-distance,width:22-i*.12,hazardCount,obstacleTypes,newObstacles:OBSTACLES.filter(o=>o.unlock===id),speed:1+i*.014,seconds:Math.ceil(silver*2+120),runners:16,qualify:16,sky:world.sky,slime:world.slime,colors:[world.track,world.track,world.track,world.accent],gold,silver,difficulty:Math.min(5,Math.floor(i/10)+1)};
});
export function levelById(id){return LEVELS[Math.max(0,Math.min(49,(Math.floor(Number(id))||1)-1))]}
// All course arrays are ordered from start to finish. Binary range queries keep the
// cost per physics step independent of course length.
export function nearby(items,z,radius=24){let lo=0,hi=items.length;while(lo<hi){const m=(lo+hi)>>>1;if(items[m].z>z+radius)lo=m+1;else hi=m}const start=lo;while(lo<items.length&&items[lo].z>=z-radius)lo++;return items.slice(start,lo)}
const cache=new Map();
export function buildLevel(id=1){
 id=levelById(id).id;if(cache.has(id))return cache.get(id);
 const l=levelById(id),platforms=[],checkpoints=[{x:0,z:4}],hazards=[],coins=[],boosts=[];let front=12,index=0;
 while(front>l.finishZ-14){const remaining=front-(l.finishZ-14),length=remaining<80?remaining:44,back=front-length;platforms.push({x:0,z:(front+back)/2,w:l.width,d:length,color:l.theme.track});if(index>0&&index%2===0&&length>16&&front>l.finishZ+25)checkpoints.push({x:0,z:front-5});front=back-(index%3===1?3.1+id*.018:0);index++}
 const ground=z=>nearby(platforms,z,80).some(p=>Math.abs(z-p.z)<p.d/2-9);
 const usable=[];for(let z=-18;z>l.finishZ+25;z-=2)if(ground(z)&&!nearby(checkpoints,z,10).length)usable.push(z);
 for(let i=0;i<l.hazardCount;i++){
  const z=usable[Math.min(usable.length-1,Math.floor(i*usable.length/l.hazardCount))];
  // Lead with the latest mechanic; later sectors remix every unlocked type.
  const type=l.obstacleTypes[(i+l.obstacleTypes.length-1)%l.obstacleTypes.length],lane=((i*7+id)%3-1)*4;
  hazards.push({id:i,type,z,x:['sweeper','slalom','laser','pulse'].includes(type)?0:lane,r:Math.min(8,l.width/2-1),w:Math.min(8,5+id*.045),d:8,speed:(.95+(i%3)*.18)*l.speed*(i%2?-1:1),phase:i*1.7,height:type==='hurdle'?.85:1.3});
 }
 let coinId=0;for(let z=-10;z>l.finishZ+10;z-=8)if(nearby(platforms,z,80).some(p=>Math.abs(z-p.z)<p.d/2-4))coins.push({id:coinId++,x:Math.sin(coinId*.65)*5,y:1.2,z});
 for(const p of checkpoints.slice(1))boosts.push({x:0,z:p.z-9,w:5,d:3});
 const result={...l,platforms,checkpoints,hazards,coins,boosts};cache.set(id,result);return result;
}
export const getPlatforms=id=>buildLevel(id).platforms;
export const getSweepers=id=>buildLevel(id).hazards.filter(h=>h.type==='sweeper');
export const getBumpers=id=>buildLevel(id).hazards.filter(h=>h.type==='bumper');
export function obstaclePosition(h,t,level){
 const l=levelById(level),cycle=((t*Math.abs(h.speed)*.22+h.phase)%1+1)%1;
 if(h.type==='bumper')return {x:h.x+Math.sin(t*1.4+h.phase)*Math.min(2.2,.8+level*.025),y:.9,z:h.z};
 if(h.type==='gate'||h.type==='hammer')return {x:Math.sin(t*Math.abs(h.speed)+h.phase)*(l.width/2-h.w/2-1),y:h.type==='hammer'?1.6:.7,z:h.z};
 if(h.type==='roller')return {x:Math.sin(t*Math.abs(h.speed)+h.phase)*(l.width/2-2),y:1.1,z:h.z};
 if(h.type==='piston')return {x:h.x,y:cycle<.45?4.5:cycle<.6?4.5-(cycle-.45)/.15*4:cycle<.82?.5:.5+(cycle-.82)/.18*4,z:h.z,active:cycle>=.45&&cycle<.82};
 if(h.type==='laser')return {x:0,y:.7,z:h.z,active:cycle<.6};
 if(h.type==='trapdoor')return {x:h.x,y:0,z:h.z,active:cycle>.64,warning:cycle>.45};
 if(h.type==='pulse')return {x:0,y:.3,z:h.z,radius:cycle*9,active:cycle<.85};
 if(h.type==='boulder')return {x:h.x,y:1.2,z:h.z-6+cycle*12,active:true};
 return {x:h.x,y:.7,z:h.z,cycle};
}
export const bumperX=(h,t,id)=>obstaclePosition(h,t,id).x;
export const gateX=(h,t,id=1)=>obstaclePosition(h,t,id).x;
