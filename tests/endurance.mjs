// Full-room balance check. Runs ordinary bot input through server physics.
import assert from 'node:assert/strict';
import {RaceRoom} from '../server/rooms.js';
for(const mode of ['tour','endurance'])for(const level of mode==='tour'?Array.from({length:50},(_,i)=>i+1):[1,25,50]){
 const room=new RaceRoom({level,mode});room.start();room.phase='race';
 while(room.phase==='race')room.tick(1/30);
 const finished=room.players.filter(p=>p.finished).length;
 assert(room.players.every(p=>p.finished||p.eliminated));
 assert(finished<=room.qualify);
 for(const p of room.players.filter(p=>p.deathReason)){const z=p.z;room.tick(1/30);assert.equal(p.z,z);assert(p.eliminated)}
 if(mode==='endurance'||level%10===0)console.log(JSON.stringify({mode,level,finished,seconds:Math.ceil(room.elapsed)}));
}
