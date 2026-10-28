// Height above the river deck. Runner.y remains height above the local trail,
// so jumps, hazards and moving platforms share the same surface coordinates.
import {nearby} from './levels.js';
export function terrainHeightAt(course,z){
 const p=nearby(course.platforms,z,100).find(p=>p.terrain&&Math.abs(z-p.z)<p.d/2);
 if(!p)return 0;
 const u=(z-(p.z-p.d/2))/p.d;
 // Flat landing/checkpoint areas at both ends; smooth ascent and descent.
 if(u<=.16||u>=.84)return 0;
 const v=(u-.16)/.68;
 if(p.terrain==='ridge')return p.height*Math.pow(Math.sin(Math.PI*v),2);
 if(p.terrain==='hills')return p.height*Math.pow(Math.sin(2*Math.PI*v),2);
 return p.height*Math.pow(Math.sin(Math.PI*v),4);
}
