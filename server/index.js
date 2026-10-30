import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer,WebSocket} from 'ws';
import {RaceRoom} from './rooms.js';
import {PartyRoom} from './party-room.js';
import {RelayRoom} from './relay-room.js';
import {visibleCollected} from '../dist/simulation.js';
import {levelById} from '../dist/levels.js';
const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const hosting=JSON.parse(await readFile(new URL('../hosting.json',import.meta.url),'utf8'));
const commit=/^[a-f0-9]{40}$/i.test(process.env.RENDER_GIT_COMMIT||'')?process.env.RENDER_GIT_COMMIT:null;
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
export function createGameServer({waitSeconds=45,maxRooms=40,allowedOrigins=hosting.vercelOrigins,resumeGraceMs=45000,now=Date.now}={}){
 const trusted=new Set(allowedOrigins);
 const originAllowed=(origin,host)=>{try{const url=new URL(origin);return ['https:','http:'].includes(url.protocol)&&url.origin===origin&&(url.host===host||trusted.has(origin));}catch{return false;}};
 const rooms=new Map(),connections=new Map(),sessions=new Map();
 const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
  if(pathname==='/health'){if(req.headers.origin&&originAllowed(req.headers.origin,req.headers.host)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,version,commit,rooms:rooms.size}))}
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!target.startsWith(root)){res.writeHead(403);return res.end()}
  try{if(!(await stat(target)).isFile())throw Error();const body=await readFile(target);res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('Cache-Control',pathname.includes('/vendor/')?'public, max-age=86400':'no-cache');res.end(req.method==='HEAD'?undefined:body)}catch{res.writeHead(404);res.end('Not found')}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{let valid=false;try{const u=new URL(req.url,'http://localhost');const origin=req.headers.origin;valid=u.pathname==='/ws'&&(!origin||originAllowed(origin,req.headers.host))}catch{}if(!valid||wss.clients.size>=1600){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');return socket.destroy()}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req))});
 const send=(ws,data)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<128000)ws.send(JSON.stringify(data))};
 wss.on('connection',ws=>{ws.openedAt=Date.now();ws.alive=true;ws.rate=0;ws.rateAt=Date.now();ws.on('pong',()=>ws.alive=true);ws.on('error',()=>{});
  ws.on('message',raw=>{if(Date.now()-ws.rateAt>1000){ws.rate=0;ws.rateAt=Date.now()}if(++ws.rate>80)return ws.close(1008,'Too many messages');let data;try{data=JSON.parse(raw)}catch{return send(ws,{type:'error',message:'Invalid message'})}if(!data||typeof data!=='object')return;
   if(data.type==='resume'){
    if(connections.has(ws))return;
    const session=typeof data.token==='string'&&sessions.get(data.token);
    if(!session||data.protocol!==5||session.room.id!==data.room||!rooms.has(data.room)||session.expires<=now())return send(ws,{type:'error',message:'This expedition could not be resumed. Its recovery window expired or the server restarted. Create a new room with your team.'});
    // Possession of the private, single-use token permits replacing a stalled socket.
    // Remove the old binding before closing it so its close event cannot remove the restored player.
    if(!session.room.suspended.has(session.id)){connections.delete(session.ws);session.ws.close(4001,'Session restored on another connection');session.room.suspend(session.id,now()+resumeGraceMs);}
    const p=session.room.resume(session.id);if(!p)return send(ws,{type:'error',message:'This player can no longer rejoin the expedition.'});
    const token=randomBytes(32).toString('hex');sessions.delete(data.token);session.ws=ws;session.expires=Infinity;sessions.set(token,session);connections.set(ws,{room:session.room,id:p.id,token});send(ws,{type:'joined',id:p.id,room:session.room.id,resumeToken:token,resumed:true});send(ws,session.room.snapshot());
   }else if(data.type==='join'){if(connections.has(ws))return;
    if(['name','color','outfit','mode','room','action'].some(k=>data[k]!==undefined&&typeof data[k]!=='string')||(data.level!==undefined&&!Number.isInteger(data.level)))return send(ws,{type:'error',message:'Invalid join fields'});
    let room;
    if(data.room){room=rooms.get(String(data.room).toUpperCase());if(!room||(['party','relay'].includes(room.mode)?!room.canJoin():room.phase!=='waiting'||room.players.length>=16))return send(ws,{type:'error',message:'Room not found, already started, or full. Check the code or ask your friend to generate a new one.'})}
    else if(data.action!=='create'&&!['party','relay'].includes(data.mode))room=[...rooms.values()].find(r=>!r.privateRoom&&r.phase==='waiting'&&r.level===levelById(data.level).number&&r.mode===(data.mode==='endurance'?'endurance':'tour')&&r.players.length<16);
    if((room?.mode==='relay'||!room&&data.mode==='relay')&&data.protocol!==5)return send(ws,{type:'error',message:'World Relay needs the latest game. Refresh this page, then join with the same code.'});
    if(!room){if(rooms.size>=maxRooms)return send(ws,{type:'error',message:'All races are full. Please try again shortly.'});const Room=data.mode==='relay'?RelayRoom:data.mode==='party'?PartyRoom:RaceRoom;room=new Room({waitSeconds,level:data.level,rounds:data.rounds,mode:data.mode,privateRoom:data.action==='create'});rooms.set(room.id,room)}
    const p=room.add({name:data.name,color:data.color,outfit:data.outfit,appearance:data.appearance,cosmetics:data.cosmetics});if(!p)return;const token=room.mode==='relay'?randomBytes(32).toString('hex'):undefined;if(token)sessions.set(token,{room,id:p.id,ws,expires:Infinity});connections.set(ws,{room,id:p.id,token});send(ws,{type:'joined',id:p.id,room:room.id,...(token?{resumeToken:token}:{})});send(ws,room.snapshot());
   }else if(data.type==='mechanism'){const c=connections.get(ws);if(c?.room.mode==='relay')c.room.activate(c.id,data.key,data.stage);}
   else if(data.type==='rematch'&&connections.get(ws)?.room.mode==='relay'){const c=connections.get(ws);c.room.rematch(c.id);}
   else if(['configure','vote','rematch'].includes(data.type)){const c=connections.get(ws);if(c?.room.mode==='party'){if(data.type==='configure')c.room.configure(c.id,data);if(data.type==='vote')c.room.castVote(c.id,data.choice);if(data.type==='rematch')c.room.rematch(c.id);}}
   else if(data.type==='start'){const c=connections.get(ws);if(c&&c.room.privateRoom&&c.room.hostId===c.id&&c.room.phase==='waiting'){const humans=['party','relay'].includes(c.room.mode)?c.room.humans():c.room.players.filter(p=>!p.isBot&&p.connected);if(humans.length<2)return send(ws,{type:'notice',message:'Wait for at least one friend to join.'});c.room.start(c.room.mode==='relay'?{hostRole:data.hostRole}:undefined);}}else if(data.type==='input'){const c=connections.get(ws);if(c)c.room.input(c.id,data)}else if(data.type==='ping')send(ws,{type:'pong',at:data.at});
  });
  ws.on('close',code=>{const c=connections.get(ws);if(c){if(code!==1000&&code!==1001)console.info('Online connection ended: code='+code+' mode='+c.room.mode+' phase='+c.room.phase+' connectedMs='+(Date.now()-ws.openedAt));if(c.token&&sessions.get(c.token)?.ws===ws&&code!==1000){const session=sessions.get(c.token);session.expires=now()+resumeGraceMs;c.room.suspend(c.id,session.expires);}else{c.room.remove(c.id);if(c.token)sessions.delete(c.token);}connections.delete(ws)}});
 });
 let frames=0;const loop=setInterval(()=>{for(const[token,session]of sessions)if(session.expires<=now()||!rooms.has(session.room.id)){session.room.expireSuspensions?.(now());sessions.delete(token);}for(const [id,r]of rooms){r.tick(1/30);if(r.emptyTime>30||(r.phase==='complete'&&r.remaining<-15)){for(const [ws,c]of connections)if(c.room===r)ws.close(1000,'Race complete');rooms.delete(id)}}if(++frames%2===0){const snapshots=new Map();for(const [ws,c]of connections){if(!snapshots.has(c.room))snapshots.set(c.room,c.room.snapshot());const p=['party','relay'].includes(c.room.mode)?c.room.findPlayer(c.id):c.room.players.find(p=>p.id===c.id);send(ws,{...snapshots.get(c.room),self:{collected:p&&!p.spectator&&c.room.mode!=='relay'?visibleCollected(p,c.room.courseId):[]}})}}},1000/30);
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive)ws.terminate();else{ws.alive=false;ws.ping()}}},25000);
 return {server,rooms,wss,async close(){clearInterval(loop);clearInterval(heartbeat);for(const ws of wss.clients)ws.close(1001,'Server restarting');await new Promise(resolve=>{server.close(resolve);setTimeout(()=>{for(const ws of wss.clients)ws.terminate();resolve()},1000).unref()})}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const app=createGameServer();app.server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Bean Dash listening on port '+(process.env.PORT||3000)));process.on('SIGTERM',async()=>{await app.close();process.exit(0)})}
