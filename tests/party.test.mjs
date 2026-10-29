import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import WebSocket from 'ws';
import {PartyRoom} from '../server/party-room.js';
import {createGameServer} from '../server/index.js';
import {PARTY,partySettings} from '../dist/party-rules.js';
import {botInput} from '../dist/simulation.js';
const setup=(options={})=>{const r=new PartyRoom(options),a=r.add({name:'Host'}),b=r.add({name:'Friend'});return {r,a,b};};
test('party settings, capacity, host authority and one-friend minimum are enforced',()=>{
 assert.deepEqual(partySettings({level:50,rounds:999}),{level:2,rounds:1});const r=new PartyRoom(),host=r.add();r.start();assert.equal(r.phase,'waiting');const friend=r.add();assert.equal(r.configure(friend.id,{level:6,rounds:3}),false);assert(r.configure(host.id,{level:6,rounds:3}));for(let i=2;i<8;i++)assert(r.add());assert.equal(r.add(),null);r.start();assert.equal(r.level,6);assert.equal(r.rounds,3);assert.equal(r.players.length,8);assert.equal(r.configure(host.id,{level:1}),false);
});
test('party recovery restores a checkpoint upright, retains coins and protects for three seconds',()=>{
 const {r,a}=setup();r.start();r.tick(3.1);Object.assign(a,{cp:1,x:999,y:0,grounded:true,z:-160,coins:7});r.tick(1/30);assert(a.recoverAt>0);assert(a.eliminated);for(let i=0;i<38;i++)r.tick(1/30);assert(!a.eliminated);assert.equal(a.cp,1);assert.equal(a.recoveries,1);assert.equal(a.coins,7);assert(a.invincible>2.8);assert(Math.abs(a.x)<1);assert(a.grounded);assert.equal(a.deathReason,null);assert.equal(a.deathProgress,undefined);
});
test('vote is identity-bound, duplicate-safe, shared and temporary; ties choose Calm',()=>{
 const {r,a,b}=setup();r.start();r.tick(3.1);r.elapsed=12;r.tick(.01);assert(!r.castVote('forged','wild'));assert(!r.castVote(a.id,'__proto__'));assert(!r.castVote(a.id,{toString:null,valueOf:null}));assert(r.castVote(a.id,'wild'));assert(r.castVote(a.id,'wild'));assert.equal(r.vote.ballots.size,1);assert(r.castVote(b.id,'calm'));r.elapsed=r.vote.endsAt;r.tick(.01);assert.equal(r.remix.choice,'calm');assert(!r.castVote(a.id,'wild'));const before=r.clock;r.tick(.1);assert(Math.abs(r.clock-before-.06)<1e-6);r.elapsed=r.remix.endsAt;r.tick(.01);assert.equal(r.remix,null);
});
test('late arrivals watch and vote, cannot move, then replace a bot in the next round',()=>{
 const {r,a,b}=setup({rounds:3});r.start();r.tick(3.1);const late=r.add({name:'Late'});assert(late.spectator);const z=late.z;r.input(late.id,{dz:-1});assert.equal(late.z,z);r.elapsed=12;r.tick(.01);assert(r.castVote(late.id,'wild'));r.remove(a.id);assert.equal(r.hostId,b.id);r.finishRound();r.tick(PARTY.intermissionSeconds+.1);assert.equal(r.phase,'countdown');assert.equal(r.roundIndex,2);assert(!late.spectator);assert(r.players.includes(late));assert.equal(r.players.length,8);assert.equal(r.spectators.length,0);
});
test('finish scoring is exactly once; timeout uses progress, ties and rematch preserve room code',()=>{
 const {r,a,b}=setup();r.start();r.tick(3.1);a.z=-500;b.z=-600;r.score(a,1);const earned=a.totalPoints;r.score(a,1);assert.equal(a.totalPoints,earned);r.qualified=1;r.finishRound();assert.equal(a.roundPoints,8);assert.equal(b.roundPoints,7);assert.equal(r.phase,'complete');assert(!r.rematch(b.id));const code=r.id;assert(r.rematch(a.id));assert.equal(r.id,code);assert.equal(r.phase,'waiting');assert.equal(r.players.length,2);assert.equal(a.totalPoints,0);r.start();assert.equal(r.roundIndex,1);
});
test('real physics: both remix choices and eight runners complete all three short rounds',()=>{
 const {r,a,b}=setup({level:4,rounds:3});r.start();const summary=[];let last=0;
 for(let frames=0;frames<22000&&r.phase!=='complete';frames++){
  if(r.phase==='race'){
   for(const p of[a,b])if(!p.finished&&!p.eliminated)r.input(p.id,botInput(p,r.clock,r.courseId));
   if(r.vote&&!r.vote.closed)for(const p of[a,b])r.castVote(p.id,r.vote.index===1?'wild':'calm');
  }
  r.tick(1/30);if(['intermission','complete'].includes(r.phase)&&last!==r.roundIndex){last=r.roundIndex;summary.push({level:r.level,time:r.elapsed,finished:r.players.filter(p=>p.finished).length,recoveries:r.players.reduce((n,p)=>n+(p.recoveries||0),0)});}
 }
 assert.equal(r.phase,'complete');assert.equal(summary.length,3);for(const round of summary){assert(round.time<=180.1);assert(round.finished>=6,JSON.stringify(summary));}assert(a.totalPoints>0&&b.totalPoints>0);console.log('Party reference runs:',summary);
});
const until=(ws,predicate)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',listener);reject(Error('message timeout'));},4000);function listener(raw){const s=JSON.parse(raw);if(predicate(s)){clearTimeout(timer);ws.off('message',listener);resolve(s);}}ws.on('message',listener);});
test('WebSocket party: separate clients share votes and spectator state; spoofed host commands fail',async()=>{
 const app=createGameServer();app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const url=`ws://127.0.0.1:${app.server.address().port}/ws`,clients=[new WebSocket(url),new WebSocket(url),new WebSocket(url)];
 try{await Promise.all(clients.map(ws=>once(ws,'open')));const join=async(ws,data)=>{const reply=until(ws,s=>s.type==='joined');ws.send(JSON.stringify({type:'join',...data}));return reply;};const host=await join(clients[0],{mode:'party',action:'create',rounds:3}),friend=await join(clients[1],{room:host.room}),r=app.rooms.get(host.room);
  clients[1].send(JSON.stringify({type:'configure',id:host.id,level:6,rounds:1}));await until(clients[1],s=>s.type==='state');assert.equal(r.level,2);assert.equal(r.rounds,3);
  clients[0].send(JSON.stringify({type:'start'}));await until(clients[0],s=>s.phase==='countdown');r.phase='race';r.elapsed=12;r.tick(.01);const late=await join(clients[2],{room:host.room});assert(r.findPlayer(late.id).spectator);clients[2].send(JSON.stringify({type:'vote',choice:'wild',id:host.id}));const state=await until(clients[0],s=>s.vote?.ballots[late.id]==='wild');assert.equal(state.vote.ballots[host.id],undefined);const stateB=await until(clients[1],s=>s.vote?.ballots[late.id]==='wild');assert.equal(stateB.room,state.room);assert(stateB.players.find(p=>p.id===late.id).spectator);assert.notEqual(friend.id,host.id);
 }finally{clients.forEach(ws=>ws.close());await app.close();}
});
