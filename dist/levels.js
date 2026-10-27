export const MAX_LEVEL=50;
export const WORLDS=[
 {name:'Sunshore',subtitle:'Find your rhythm',sky:0xb8e8ee,slime:0x39abb7,track:0x45c9d0,edge:0xe6f9f4,accent:0xffb264,scenery:0xf7d5ad},
 {name:'Sundown City',subtitle:'Own the streets',sky:0xf6cab6,slime:0xb95e94,track:0xdc8ba9,edge:0xffe7bc,accent:0xffd45c,scenery:0xb67db2},
 {name:'Neon Heights',subtitle:'Chase the lights',sky:0x333856,slime:0x24263e,track:0x586cb4,edge:0x68f8c7,accent:0xf18bd1,scenery:0x555078},
 {name:'Frostline',subtitle:'Keep your cool',sky:0xc7e0fa,slime:0x8bb6dc,track:0x91b9e4,edge:0xf3ffff,accent:0xff9a75,scenery:0xe7eff9},
 {name:'Skyline Summit',subtitle:'Earn your legend',sky:0xb5b7ef,slime:0x7765aa,track:0x9b87ca,edge:0xffeab2,accent:0xffc455,scenery:0xbca7d8}
];
const NAMES=['First Flight','Crosswind','Switchback','Momentum','High Frequency','Side Hustle','Overdrive','No Looking Back','The Long Run','Crown Run'];
export const LEVELS=Array.from({length:50},(_,i)=>{const id=i+1,world=WORLDS[Math.floor(i/10)],distance=320+i*20;return {id,name:NAMES[i%10],world:world.name,worldIndex:Math.floor(i/10),theme:world,tag:i%10===9?'WORLD FINALE':world.subtitle.toUpperCase(),description:`${distance}m of ${world.name}. ${18+i*2} obstacles. Make every jump count.`,distance,finishZ:4-distance,width:22-i*.12,hazardCount:18+i*2,speed:1+i*.018,seconds:Math.ceil(distance/8.9*3+45),runners:16,qualify:16,sky:world.sky,slime:world.slime,colors:[world.track,world.track,world.track,world.accent],gold:Math.ceil(distance/10.5*1.18+9),silver:Math.ceil(distance/10.5*1.55+16),difficulty:Math.min(5,Math.floor(i/10)+1)}});
export function levelById(id){return LEVELS[Math.max(0,Math.min(49,(Math.floor(Number(id))||1)-1))]}
const cache=new Map();
export function buildLevel(id=1){id=levelById(id).id;if(cache.has(id))return cache.get(id);const l=levelById(id),platforms=[],checkpoints=[{x:0,z:4}],hazards=[],coins=[],boosts=[];let front=12,index=0;
 while(front>l.finishZ-14){const remaining=front-(l.finishZ-14),length=remaining<80?remaining:44,back=front-length;platforms.push({x:0,z:(front+back)/2,w:l.width,d:length,color:l.theme.track});if(index>0&&index%2===0&&length>16&&front>l.finishZ+25)checkpoints.push({x:0,z:front-5});front=back-(index%3===1?3.1+id*.018:0);index++}
 const ground=z=>platforms.some(p=>Math.abs(z-p.z)<p.d/2-4);
 const usable=[];for(let z=-15;z>l.finishZ+18;z-=2)if(ground(z)&&!checkpoints.some(p=>Math.abs(p.z-z)<7))usable.push(z);
 const types=['sweeper','hurdle','bumper','gate','hammer','roller'];
 for(let i=0;i<l.hazardCount;i++){const z=usable[Math.min(usable.length-1,Math.floor(i*usable.length/l.hazardCount))];let type=types[(i+Math.floor((id-1)/3))%Math.min(types.length,3+Math.floor(id/3))];const lane=((i*7+id)%3-1)*5;hazards.push({id:i,type,z,x:type==='sweeper'?0:lane,r:Math.min(8,l.width/2-1),w:Math.min(8,5+id*.045),speed:(.95+(i%3)*.18)*l.speed*(i%2?-1:1),phase:i*1.7,height:type==='hurdle'?.85:1.3})}
 let coinId=0;for(let z=-10;z>l.finishZ+10;z-=8){if(ground(z)){const x=Math.sin(coinId*.65)*5;coins.push({id:coinId++,x,y:1.2,z})}}
 for(const p of checkpoints.slice(1)){boosts.push({x:0,z:p.z-9,w:5,d:3})}
 const result={...l,platforms,checkpoints,hazards,coins,boosts};cache.set(id,result);return result;
}
export const getPlatforms=id=>buildLevel(id).platforms;
export const getSweepers=id=>buildLevel(id).hazards.filter(h=>h.type==='sweeper');
export const getBumpers=id=>buildLevel(id).hazards.filter(h=>h.type==='bumper');
export function obstaclePosition(h,t,level){const l=levelById(level);if(h.type==='bumper')return {x:h.x+Math.sin(t*1.4+h.phase)*Math.min(2.2,.8+level*.025),y:.9,z:h.z};if(h.type==='gate'||h.type==='hammer')return {x:Math.sin(t*Math.abs(h.speed)+h.phase)*(l.width/2-h.w/2-1),y:h.type==='hammer'?1.6:.7,z:h.z};if(h.type==='roller')return {x:Math.sin(t*Math.abs(h.speed)+h.phase)*(l.width/2-2),y:1.1,z:h.z};return {x:h.x,y:.7,z:h.z}}
export const bumperX=(h,t,id)=>obstaclePosition(h,t,id).x;
export const gateX=(h,t,id=1)=>obstaclePosition(h,t,id).x;
