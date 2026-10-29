import test from 'node:test';import assert from 'node:assert/strict';import {once} from 'node:events';import {mkdtemp,readFile,rm,stat} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {pathToFileURL} from 'node:url';import WebSocket from 'ws';
import {serverOrigin,raceSocketUrl,waitForRaceServer,wakeRaceServer} from '../dist/connection.js';import {createGameServer} from '../server/index.js';import {buildVercel} from '../scripts/build-vercel.mjs';
test('race endpoint stays same-origin on Render and uses the configured backend on static hosts',()=>{
 assert.equal(raceSocketUrl('https://render.example'),'wss://render.example/ws');assert.equal(raceSocketUrl('http://127.0.0.1:1234'),'ws://127.0.0.1:1234/ws');assert.equal(raceSocketUrl('https://owned.vercel.app','https://race.example'),'wss://race.example/ws');
 for(const value of['javascript:alert(1)','https://user:pass@example.com','https://example.com/path','https://example.com/?x=1'])assert.throws(()=>serverOrigin(value));
});
test('idle-backend readiness retries, times out and cancels without an infinite wait',async()=>{
 let now=0,calls=0,waits=0;await waitForRaceServer('https://race.example',{now:()=>now,delay:async ms=>now+=ms,onWait:()=>waits++,fetcher:async()=>({ok:++calls===3,json:async()=>({ok:true})})});assert.equal(calls,3);assert.equal(waits,2);
 now=0;await assert.rejects(waitForRaceServer('https://race.example',{timeout:5000,now:()=>now,delay:async ms=>now+=ms,fetcher:async()=>{throw Error('sleeping')}}),/still starting/);
 const controller=new AbortController();calls=0;await assert.rejects(waitForRaceServer('https://race.example',{signal:controller.signal,fetcher:async()=>{calls++;return {ok:false}},delay:async()=>controller.abort()}),{name:'AbortError'});assert.equal(calls,1);
});
test('page-load warmup is one anonymous request and never blocks on a failed backend',async()=>{
 let calls=0;await wakeRaceServer('https://race.example',{fetcher:async(url,options)=>{calls++;assert.equal(url.pathname,'/health');assert.equal(options.mode,'no-cors');assert.equal(options.credentials,'omit');throw Error('offline')}});assert.equal(calls,1);
});
test('explicit frontend origins can share private rooms; unrelated origins remain denied',async()=>{
 const origin='https://owned.vercel.app',app=createGameServer({allowedOrigins:[origin]});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port,clients=[];
 const reply=ws=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('join timeout')),3000);ws.once('message',v=>{clearTimeout(t);resolve(JSON.parse(v))})});
 try{const health=await fetch(base+'/health',{headers:{Origin:origin}});assert.equal(health.headers.get('access-control-allow-origin'),origin);assert.equal(health.headers.get('vary'),'Origin');assert.equal(health.headers.get('access-control-allow-credentials'),null);
 assert.equal((await fetch(base+'/health',{headers:{Origin:'https://unrelated.vercel.app'}})).headers.get('access-control-allow-origin'),null);
 const a=new WebSocket(base.replace('http','ws')+'/ws',{origin}),b=new WebSocket(base.replace('http','ws')+'/ws',{origin:base});clients.push(a,b);await Promise.all([once(a,'open'),once(b,'open')]);let first=reply(a);a.send(JSON.stringify({type:'join',action:'create',name:'Static host'}));first=await first;const second=reply(b);b.send(JSON.stringify({type:'join',room:first.room,name:'Render host'}));assert.equal((await second).room,first.room);
 const denied=new WebSocket(base.replace('http','ws')+'/ws',{origin:'https://unrelated.vercel.app'});clients.push(denied);await new Promise((resolve,reject)=>{denied.on('error',()=>{});denied.on('unexpected-response',(req,res)=>{try{assert.equal(res.statusCode,403);res.resume();denied.terminate();resolve()}catch(e){reject(e)}});denied.on('open',()=>reject(Error('untrusted origin connected')))});
 }finally{for(const ws of clients)ws.close();await app.close();}
});
test('Vercel build publishes frontend assets and release metadata, preserving the Render entrypoint',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'bean-build-'));try{await buildVercel({output:pathToFileURL(temp+'/'),commit:'a'.repeat(40)});const html=await readFile(join(temp,'index.html'),'utf8');assert.match(html,/name="bean-dash-race-server" content="https:\/\/bean-dash-online.onrender.com"/);assert.match(await readFile('dist/index.html','utf8'),/name="bean-dash-race-server" content=""/);
 const health=JSON.parse(await readFile(join(temp,'health.json'),'utf8'));assert.equal(health.role,'frontend');assert.equal(health.commit,'a'.repeat(40));assert.equal(health.raceServerOrigin,'https://bean-dash-online.onrender.com');await stat(join(temp,'connection.js'));await assert.rejects(stat(join(temp,'server/index.js')));await assert.rejects(stat(join(temp,'package.json')));
 }finally{await rm(temp,{recursive:true,force:true});}
});
