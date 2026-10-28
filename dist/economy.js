import {earningsCap} from './rules.js';
export const SHOP=[
 {id:'aurora',name:'Aurora suit',kind:'look',price:180,description:'Nova in a violet jacket and matching runners.',appearance:{character:'nova',top:'jacket',shirtColor:'#9279ff',pantsColor:'#263d59',hair:'ponytail',hat:'none'}},
 {id:'ranger',name:'Summit ranger',kind:'look',price:180,description:'Ace with a mint jacket, shorts and backpack.',appearance:{character:'ace',top:'jacket',bottom:'shorts',shirtColor:'#44c9b4',accessory:'backpack'}},
 {id:'helmet',name:'Circuit helmet',kind:'helmet',price:120,description:'A sculpted racing shell and tinted visor.'},
 {id:'wings',name:'Sky wings',kind:'accessory',price:150,description:'A pair of metallic wings for your runner.'},
 {id:'trail',name:'Comet trail',kind:'trail',price:160,description:'Leave a glowing comet trail behind you.'},
 {id:'sparkles',name:'Stardust aura',kind:'effect',price:120,description:'Orbiting particles surround your runner.'},
 {id:'victory',name:'Victory spin',kind:'victory',price:140,description:'Celebrate a finish with a spinning jump.'},
 {id:'shield',name:'Shield',kind:'power',price:35,description:'Absorbs one dangerous impact; lasts 30 seconds. Water still ends the run.'},
 {id:'speed',name:'Sprint boost',kind:'power',price:25,description:'Run 40% faster for 15 seconds.'},
 {id:'jump',name:'Double jump',kind:'power',price:30,description:'One extra jump per airborne arc for 30 seconds.'},
 {id:'magnet',name:'Coin magnet',kind:'power',price:25,description:'Collect coins within 5 metres for 30 seconds.'},
 {id:'chest',name:'Supply chest',kind:'chest',price:25,description:'Equal 25% chance of a shield, sprint boost, double jump or magnet. Every reward is worth at least 25 coins.'}
];
export const revivalPrice=(count,mode)=>mode==='endurance'?Math.min(250,100+25*Math.max(0,Math.floor(count||0))):Math.min(10000,Math.ceil(100*Math.pow(1.5,Math.min(12,Math.max(0,count||0)))));
export function normalizeEconomy(p){
 p.owned=[...new Set(Array.isArray(p.owned)?p.owned:[])].filter(id=>SHOP.some(i=>i.id===id&&!['power','chest'].includes(i.kind)));
 p.inventory=Object.fromEntries(['shield','speed','jump','magnet'].map(id=>[id,Math.min(99,Math.max(0,Math.floor(Number(p.inventory?.[id])||0)))]));
 p.equipped=Object.fromEntries(Object.entries(p.equipped||{}).filter(([kind,id])=>p.owned.includes(id)&&SHOP.some(i=>i.id===id&&i.kind===kind)));
 p.transactions=Array.isArray(p.transactions)?p.transactions.slice(-200):[];
}
export function economyMethods(get,save,refresh){
 const transaction=(id,fn)=>{refresh();const p=get();normalizeEconomy(p);if(!id||p.transactions.includes(id))return {ok:false,reason:'already processed'};const result=fn(p);if(result.ok){p.transactions.push(id);p.transactions=p.transactions.slice(-200);save();}return result;};
 return {
  purchase(itemId,token,random=()=>{const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]/4294967296;}){return transaction(token,p=>{const item=SHOP.find(i=>i.id===itemId);if(!item)return {ok:false,reason:'unknown item'};if(p.owned.includes(itemId))return {ok:false,reason:'already owned'};if(p.coins<item.price)return {ok:false,reason:'insufficient coins'};const reward=item.kind==='chest'?['shield','speed','jump','magnet'][Math.min(3,Math.max(0,Math.floor(random()*4)))]:item.id;if((item.kind==='power'||item.kind==='chest')&&p.inventory[reward]>=99)return {ok:false,reason:'inventory full'};p.coins-=item.price;if(item.kind==='power'||item.kind==='chest')p.inventory[reward]++;else p.owned.push(item.id);return {ok:true,cost:item.price,reward};});},
  equip(id){refresh();const p=get();normalizeEconomy(p);const item=SHOP.find(i=>i.id===id);if(!item||!p.owned.includes(id))return false;if(p.equipped[item.kind]===id)delete p.equipped[item.kind];else p.equipped[item.kind]=id;save();return true;},
  beginEconomyRun(level,mode){refresh();const p=get();const id=crypto.randomUUID();p.economyRun={id,level,mode,credited:0,revivals:0,pending:null,complete:false,snapshot:null};save();return id;},
  recoverTour(id){refresh();const r=get().economyRun;if(!r||r.id!==id||r.mode!=='tour'||r.complete||!r.pending||!r.snapshot||r.snapshot.hardcore)return null;r.pending=null;r.snapshot.time+=4;r.snapshot.powers={...r.snapshot.powers,invincible:3};save();return structuredClone(r.snapshot);},
  creditRun(id,coins){refresh();const p=get(),r=p.economyRun;if(!r||r.id!==id||r.complete||r.level>p.unlocked)return 0;const total=Math.min(earningsCap(r.level,r.mode),Math.max(0,Math.floor(coins||0))),delta=Math.max(0,total-r.credited);r.credited+=delta;p.coins+=delta;save();return delta;},
  saveEconomyRun(id,snapshot){refresh();const r=get().economyRun;if(!r||r.id!==id||r.complete)return false;r.snapshot=structuredClone(snapshot);save();return true;},
  offerRevival(id,snapshot){refresh();const r=get().economyRun;if(!r||r.id!==id||r.complete)return null;if(!r.pending){r.pending=crypto.randomUUID();r.snapshot=structuredClone(snapshot);save();}return {token:r.pending,cost:revivalPrice(r.revivals,r.mode)};},
  revive(id,token){return transaction(token,p=>{const r=p.economyRun;if(!r||r.id!==id||r.complete||r.pending!==token)return {ok:false,reason:'run changed'};const cost=revivalPrice(r.revivals,r.mode);if(p.coins<cost)return {ok:false,reason:'insufficient coins'};p.coins-=cost;r.revivals++;r.pending=null;return {ok:true,cost,snapshot:structuredClone(r.snapshot),revivals:r.revivals};});},
  consumePower(id,power,token){return transaction(token,p=>{const r=p.economyRun;if(!r||r.id!==id||r.complete||r.pending||!p.inventory[power])return {ok:false,reason:'unavailable'};p.inventory[power]--;if(r.snapshot){r.snapshot.powers||={};r.snapshot.powers[{shield:'shieldTime',speed:'speedTime',jump:'jumpTime',magnet:'magnetTime'}[power]]=power==='speed'?15:30;if(power==='shield')r.snapshot.powers.shield=true;}return {ok:true};});},
 };
}
