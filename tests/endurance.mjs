// Extended check: simulate 800 runners through the complete 50-level campaign.
// Run separately with `node tests/endurance.mjs` (approximately two minutes).
import assert from 'node:assert/strict';
import {RaceRoom} from '../server/rooms.js';
for(let level=1;level<=50;level++){
 const room=new RaceRoom({level});room.start();room.phase='race';
 while(room.phase==='race')room.tick(1/30);
 const finished=room.players.filter(p=>p.finished).length;
 assert.equal(finished,16,`Level ${level}: ${16-finished} bots failed to finish`);
 if(level%5===0||level===1)console.log(JSON.stringify({level,finished,lastFinishSeconds:Math.ceil(room.elapsed)}));
}
