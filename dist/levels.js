export const LEVELS = [
 {id:1,name:'Whirly Rush',tag:'SPIN TO WIN',description:'Jump the sweepers. Dodge the bumps. Make the first cut.',runners:16,qualify:8,seconds:100,sky:0xa5e4f3,slime:0xc5a2ed,colors:[0x40c9e3,0x9c79e9,0x46cbd9,0xffbe4e],speed:1,bumperMotion:1.4,gates:[]},
 {id:2,name:'Bumper Boulevard',tag:'KEEP YOUR BALANCE',description:'Moving gates and a bumper maze. Only four go through.',runners:8,qualify:4,seconds:90,sky:0xffd4aa,slime:0xffa6b9,colors:[0xffbd64,0xf582a6,0x65d8bd,0x8fa5fa],speed:1.2,bumperMotion:2.3,gates:[{z:-17,w:8,phase:0},{z:-33,w:8,phase:2},{z:-115,w:7,phase:1}]},
 {id:3,name:'Crown Circuit',tag:'ONE BEAN. ONE CROWN.',description:'Narrow runways, double spins, and one final dash for the crown.',runners:4,qualify:1,seconds:85,sky:0xbac6fa,slime:0xa79ae0,colors:[0x8795ec,0xb18be6,0x6edbdf,0xffcf5d],speed:1.4,bumperMotion:1.8,gates:[{z:-120,w:6,phase:0}]}
];
export function levelById(id){return LEVELS[Math.max(0,Math.min(2,Number(id)-1))]||LEVELS[0]}
export function getPlatforms(id=1){const c=levelById(id).colors;return [
 {x:0,z:1,w:22,d:22,color:c[0]},
 {x:0,z:-23,w:id===3?16:22,d:26,color:c[1]},
 {x:0,z:-55,w:id===3?18:22,d:30,color:c[2]},
 ...[-80,-90].flatMap(z=>[-7,0,7].map(x=>({x,z,w:id===3?5:6,d:7,color:c[3]}))),
 {x:0,z:-115,w:id===3?16:22,d:36,color:c[1]}
]}
export function getSweepers(id=1){const specs=id===2?[[-4,-25,5,1.3],[4,-105,6,-1.7]]:id===3?[[0,-18,7,1.5],[0,-29,7,-1.6],[-3,-106,5,1.8],[3,-114,5,-1.8]]:[[-4.4,-20,6.2,1.25],[4.4,-29,6.2,-1.5],[0,-110,10,1.6]];return specs.map(([x,z,r,speed])=>({x,z,r,speed:speed*levelById(id).speed}))}
export function getBumpers(id=1){const cols=id===3?[-5,5]:[-6.8,0,6.8];return [-47,-55,-63].flatMap((z,row)=>cols.map((x,col)=>({x,z,phase:(row*cols.length+col)*1.3})))}
export const bumperX=(b,t,id)=>b.x+Math.sin(t*1.6+b.phase)*levelById(id).bumperMotion;
export const gateX=(g,t)=>Math.sin(t*1.2+g.phase)*6;
