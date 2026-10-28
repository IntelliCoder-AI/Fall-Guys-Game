import test from 'node:test';import assert from 'node:assert/strict';
import {buildLevel} from '../dist/levels.js';import {terrainHeightAt} from '../dist/terrain.js';import {stepRunner,runnerState} from '../dist/simulation.js';
test('hills have continuous landings and shared runner elevation on solid trails',()=>{
 const shapes=new Set();for(let n=3;n<=50;n++){const c=buildLevel(n);for(const p of c.platforms.filter(p=>p.terrain)){shapes.add(p.terrain);assert.equal(p.kind,'track');assert.equal(terrainHeightAt(c,p.z+p.d/2),0);assert(terrainHeightAt(c,p.z-p.d/2)<1e-10);for(let z=p.z-p.d/2;z<p.z+p.d/2;z+=.5)assert(Math.abs(terrainHeightAt(c,z+.01)-terrainHeightAt(c,z))<.015);}}
 assert.deepEqual([...shapes].sort(),['hills','ridge','summit']);
 const c=buildLevel(3),p=c.platforms.find(p=>p.terrain),runner={...runnerState(),x:0,z:p.z,y:4};stepRunner(runner,{},1/60,0,3);assert.equal(runner.elevation,terrainHeightAt(c,p.z));assert(!runner.eliminated);
});
