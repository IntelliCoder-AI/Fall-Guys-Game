import {getPlatforms} from './levels.js';
export let platforms = getPlatforms(1);
export function configureLevel(id){platforms=getPlatforms(id)}
export function groundAt(x,z,surfaces=platforms){return surfaces.some(p=>Math.abs(x-p.x)<=p.w/2+.12&&Math.abs(z-p.z)<=p.d/2+.12)}
export function segmentDistance(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az;const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-ax-t*dx,z-az-t*dz)}
export function progress(z){return Math.max(0,Math.min(1,(5-z)/132))}
export function checkpointFor(z,current){return z<-98?Math.max(current,2):z<-42?Math.max(current,1):current}
export function resetPosition(checkpoint){return [{x:0,z:5},{x:0,z:-43},{x:0,z:-100}][checkpoint]}
