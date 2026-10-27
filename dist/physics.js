import {buildLevel,nearby} from './levels.js';
export let platforms=buildLevel(1).platforms;
export function configureLevel(id){platforms=buildLevel(id).platforms}
export function groundAt(x,z,surfaces=platforms){return nearby(surfaces,z,80).some(p=>Math.abs(x-p.x)<=p.w/2+.12&&Math.abs(z-p.z)<=p.d/2+.12)}
export function segmentDistance(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az;const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-ax-t*dx,z-az-t*dz)}
export function progress(z,level=1){return Math.max(0,Math.min(1,(4-z)/buildLevel(level).distance))}
export function checkpointFor(z,current,level=1){const cps=buildLevel(level).checkpoints;let cp=current;for(let i=current+1;i<cps.length&&z<=cps[i].z;i++)cp=i;return cp}
export function resetPosition(checkpoint,level=1){const cps=buildLevel(level).checkpoints;return cps[Math.min(checkpoint,cps.length-1)]||cps[0]}
