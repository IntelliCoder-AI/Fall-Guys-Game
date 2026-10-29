import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {serverOrigin} from '../dist/connection.js';
export async function buildVercel({output=new URL('../vercel-dist/',import.meta.url),commit=process.env.VERCEL_GIT_COMMIT_SHA||''}={}){
const {raceServerOrigin}=JSON.parse(await readFile(new URL('../hosting.json',import.meta.url),'utf8'));
const origin=serverOrigin(raceServerOrigin),out=output;
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(new URL('../dist/',import.meta.url),out,{recursive:true});
const marker='<meta name="bean-dash-race-server" content="">',html=await readFile(new URL('index.html',out),'utf8');
if(!html.includes(marker))throw Error('Missing deployment configuration marker');
await writeFile(new URL('index.html',out),html.replace(marker,'<meta name="bean-dash-race-server" content="'+origin+'">'));
const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')),sha=commit;
await writeFile(new URL('health.json',out),JSON.stringify({ok:true,role:'frontend',version,commit:/^[a-f0-9]{40}$/i.test(sha)?sha:null,raceServerOrigin:origin}));
console.log('Vercel static build ready; multiplayer uses the configured shared race server.');
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildVercel();
