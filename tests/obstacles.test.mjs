import test from 'node:test';import assert from 'node:assert/strict';
import {LEVELS,OBSTACLES,buildLevel,nearby,obstaclePosition,trapdoorTiles} from '../dist/levels.js';
import {runnerState,stepRunner,botInput} from '../dist/simulation.js';
const fixture=type=>{const h=buildLevel(50).hazards.find(h=>h.type===type);assert(h);return {h,b:{...runnerState(),x:h.x,z:h.z}}};
const timeFor=(h,predicate)=>{for(let t=0;t<30;t+=.02)if(predicate(obstaclePosition(h,t,50)))return t;throw Error('No matching obstacle phase')};
test('new obstacles appear early and later sections combine mechanics',()=>{assert.equal(OBSTACLES.length,24);assert.deepEqual([...new Set(buildLevel(1).hazards.map(h=>h.type))],['hurdle']);assert(buildLevel(2).hazards.some(h=>h.type==='wheel'));assert(buildLevel(3).platforms.some(p=>p.kind==='bridge'));assert(buildLevel(4).hazards.some(h=>h.type==='fireballs'));const c=buildLevel(50);for(const type of['wheel','fireballs','piston','gate','laser','trapdoor'])assert(c.hazards.some(h=>h.type===type),type);assert(c.sections.some(s=>s.title==='Pressure belt'));assert(c.sections.some(s=>s.title==='Finale gauntlet'));assert(c.platforms.some(p=>p.motion==='moving'));assert(c.platforms.some(p=>p.motion==='vanishing'));assert(nearby(c.hazards,-3000,24).length<15)});
test('terrain mechanics change movement rather than only appearance',()=>{
 for(const type of['conveyor','ice','wind','mud','magnet']){const {h,b}=fixture(type);const t=type==='wind'?1:type==='magnet'?(Math.PI/2-h.phase)/2:0;if(type==='magnet')b.x=h.x+2;const x=b.x,z=b.z;stepRunner(b,{dx:0,dz:-1},.1,t,50);
 if(type==='conveyor')assert(b.z-z>-.9);if(type==='ice')assert(b.vz<-.4);if(type==='mud')assert(b.z-z>-.7);if(type==='wind'||type==='magnet')assert(Math.abs(b.x-x)>.01,type);
 }
 const {b}=fixture('launchpad');assert(stepRunner(b,{},.05,0,50).includes('spring'));assert(b.vy>12);
});
test('timed crushers, lasers and trapdoors have different open and active phases',()=>{
 for(const type of['piston','laser']){const {h,b}=fixture(type);const active=timeFor(h,p=>type==='piston'?p.y<1:p.active);assert(stepRunner(b,{},.01,active,50).includes('hit'),type+' active');const safe={...runnerState(),x:h.x,z:h.z};const open=timeFor(h,p=>type==='piston'?p.y>4:!p.active);assert(!stepRunner(safe,{},.01,open,50).includes('hit'),type+' safe')}
 const {h,b}=fixture('trapdoor'),open=timeFor(h,p=>p.active);const tile=trapdoorTiles(h,open,50).find(p=>p.active);b.x=tile.x;b.z=tile.z;for(let i=0;i<10;i++)stepRunner(b,{},.03,open,50);assert(b.y<-.5);const closed=trapdoorTiles(h,open,50).find(p=>!p.active),safe={...runnerState(),x:closed.x,z:closed.z};stepRunner(safe,{},.03,open,50);assert.equal(safe.y,0);
});
test('tunnels require diving, slalom walls alternate, and boulders travel along the course',()=>{
 const {h,b}=fixture('tunnel');assert(stepRunner(b,{},.01,0,50).includes('hit'));const slide={...runnerState(),x:h.x,z:h.z};assert(!stepRunner(slide,{dive:true},.01,0,50).includes('hit'));
 const {h:wall}=fixture('slalom'),c=buildLevel(50);const blocked={...runnerState(),x:-c.width*.23,z:wall.z+3};assert(stepRunner(blocked,{},.01,0,50).includes('hit'));const clear={...runnerState(),x:c.width*.34,z:wall.z+3};assert(!stepRunner(clear,{},.01,0,50).includes('hit'));
 const {h:ball}=fixture('boulder');assert.notEqual(obstaclePosition(ball,0,50).z,obstaclePosition(ball,1,50).z);
 const {h:ring}=fixture('pulse');const t=timeFor(ring,p=>p.active&&p.radius>3&&p.radius<4),p=obstaclePosition(ring,t,50);const runner={...runnerState(),x:p.radius,z:ring.z};assert(stepRunner(runner,{},.01,t,50).includes('hit'));const jumping={...runnerState(),x:p.radius,z:ring.z,y:1.2};assert(!stepRunner(jumping,{},.01,t,50).includes('hit'));
});
test('gold targets accommodate full-speed route finding on late courses',()=>{for(const level of[1,22,36,45,50]){const c=buildLevel(level),b={...runnerState(),isBot:true,speed:10.5,lane:0,seed:1};let t=0;while(t<c.gold&&!b.finished){stepRunner(b,botInput(b,t,level),1/30,t,level);t+=1/30}assert(b.finished,`Level ${level} misses gold at ${t}`)}});
