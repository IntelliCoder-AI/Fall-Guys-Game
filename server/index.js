import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer,WebSocket} from 'ws';
import {RaceRoom} from './rooms.js';
import {visibleCollected} from '../dist/simulation.js';
import {levelById} from '../dist/levels.js';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
export function createGameServer({waitSeconds=12,maxRooms=40}={}){
 const rooms=new Map(),connections=new Map();
 const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
  if(pathname==='/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,version:'4.0.0',rooms:rooms.size}))}
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!target.startsWith(root)){res.writeHead(403);return res.end()}
  try{if(!(await stat(target)).isFile())throw Error();const body=await readFile(target);res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('Cache-Control',pathname.includes('/vendor/')?'public, max-age=86400':'no-cache');res.end(req.method==='HEAD'?undefined:body)}catch{res.writeHead(404);res.end('Not found')}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{let valid=false;try{const u=new URL(req.url,'http://localhost');const origin=req.headers.origin;valid=u.pathname==='/ws'&&(!origin||new URL(origin).host===req.headers.host)}catch{}if(!valid||wss.clients.size>=1600){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');return socket.destroy()}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req))});
 const send=(ws,data)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<128000)ws.send(JSON.stringify(data))};
 wss.on('connection',ws=>{ws.alive=true;ws.rate=0;ws.rateAt=Date.now();ws.on('pong',()=>ws.alive=true);ws.on('error',()=>{});
  ws.on('message',raw=>{if(Date.now()-ws.rateAt>1000){ws.rate=0;ws.rateAt=Date.now()}if(++ws.rate>80)return ws.close(1008,'Too many messages');let data;try{data=JSON.parse(raw)}catch{return send(ws,{type:'error',message:'Invalid message'})}if(!data||typeof data!=='object')return;
   if(data.type==='join'){if(connections.has(ws))return;let room;
    if(data.room){room=rooms.get(String(data.room).toUpperCase());if(!room||room.phase!=='waiting'||room.players.length>=16)return send(ws,{type:'error',message:'That room has already started or is full. Join a new race.'})}
    else room=[...rooms.values()].find(r=>r.phase==='waiting'&&r.level===levelById(data.level).id&&r.players.length<16);
    if(!room){if(rooms.size>=maxRooms)return send(ws,{type:'error',message:'All races are full. Please try again shortly.'});room=new RaceRoom({waitSeconds,level:data.level});rooms.set(room.id,room)}
    const p=room.add({name:data.name,color:data.color,outfit:data.outfit});if(!p)return;connections.set(ws,{room,id:p.id});send(ws,{type:'joined',id:p.id,room:room.id});send(ws,room.snapshot());
   }else if(data.type==='input'){const c=connections.get(ws);if(c)c.room.input(c.id,data)}else if(data.type==='ping')send(ws,{type:'pong',at:data.at});
  });
  ws.on('close',()=>{const c=connections.get(ws);if(c){c.room.remove(c.id);connections.delete(ws)}});
 });
 let frames=0;const loop=setInterval(()=>{for(const [id,r]of rooms){r.tick(1/30);if(r.emptyTime>30||(r.phase==='complete'&&r.remaining<-15)){for(const [ws,c]of connections)if(c.room===r)ws.close(1000,'Race complete');rooms.delete(id)}}if(++frames%2===0){const snapshots=new Map();for(const [ws,c]of connections){if(!snapshots.has(c.room))snapshots.set(c.room,c.room.snapshot());send(ws,{...snapshots.get(c.room),self:{collected:visibleCollected(c.room.players.find(p=>p.id===c.id),c.room.level)}})}}},1000/30);
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive)ws.terminate();else{ws.alive=false;ws.ping()}}},25000);
 return {server,rooms,wss,async close(){clearInterval(loop);clearInterval(heartbeat);for(const ws of wss.clients)ws.close(1001,'Server restarting');await new Promise(resolve=>{server.close(resolve);setTimeout(()=>{for(const ws of wss.clients)ws.terminate();resolve()},1000).unref()})}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const app=createGameServer();app.server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Bean Dash listening on port '+(process.env.PORT||3000)));process.on('SIGTERM',async()=>{await app.close();process.exit(0)})}
