import test from 'node:test';import assert from 'node:assert/strict';import {RaceRoom} from '../server/rooms.js';
test('representative races retain meaningful bot competition through the finale',t=>{
 for(const level of [1,10,25,40,50]){const r=new RaceRoom({level});r.start();r.phase='race';while(r.phase==='race')r.tick(1/30);const finishers=r.players.filter(p=>p.finished).length,deaths=r.players.filter(p=>p.deathReason).length;
 t.diagnostic(JSON.stringify({level,finishers,deaths,seconds:r.elapsed}));assert(finishers>=(level===1?8:4),`L${level}: only ${finishers}/16 finished`);assert(deaths<=12,`L${level}: bot population wiped out`);
 for(const p of r.players){assert.equal(p.invincible,0);assert.equal(p.shield,false);assert.equal(p.recoveries,0);assert(p.finished||p.eliminated);}
 }
});
