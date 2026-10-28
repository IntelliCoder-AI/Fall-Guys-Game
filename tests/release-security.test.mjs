import test from 'node:test';import assert from 'node:assert/strict';import {once} from 'node:events';import WebSocket from 'ws';import {createGameServer} from '../server/index.js';import {normalizeCosmetics} from '../dist/cosmetics-data.js';
test('cosmetic input ignores prototype names and non-record values',()=>{for(const key of['__proto__','toString','constructor'])assert.deepEqual(normalizeCosmetics(JSON.parse('{"'+key+'":"x","helmet":"helmet"}')),{helmet:'helmet'});for(const v of[null,5,'x',[]])assert.deepEqual(normalizeCosmetics(v),{});});
test('malformed anonymous joins cannot crash the server; private files remain inaccessible',async()=>{
 const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port,ws=new WebSocket(base.replace('http','ws')+'/ws');
 const reply=()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('response timeout')),3000);ws.once('message',raw=>{clearTimeout(timer);resolve(JSON.parse(raw));});});
 try{await once(ws,'open');for(const fields of[{name:{toString:null}},{room:{toString:null}},{level:{valueOf:null}}]){const pending=reply();ws.send(JSON.stringify({type:'join',...fields}));assert.equal((await pending).type,'error');}
 const pending=reply();ws.send('{"type":"join","name":"Safe guest","cosmetics":{"__proto__":"x","toString":"x","constructor":"x","helmet":"helmet"}}');assert.equal((await pending).type,'joined');assert.equal((await(await fetch(base+'/health')).json()).ok,true);
 for(const p of['/.git/config','/server/index.js','/package.json','/../server/index.js'])assert([403,404].includes((await fetch(base+p)).status));
 const asset=await fetch(base+'/rules.js');assert.equal(asset.status,200);assert.match(asset.headers.get('content-type'),/javascript/);assert.match(asset.headers.get('content-security-policy'),/script-src 'self'/);assert.equal((await fetch(base,{method:'POST'})).status,405);
 }finally{ws.close();await app.close();}
});
