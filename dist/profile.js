import {MAX_LEVEL,levelById,buildLevel} from './levels.js';
import {normalizeAppearance,legacyAppearance} from './appearance.js';
const KEY='bean-dash-profile-v3',RUN_KEY='bean-dash-run-v6',COURSE_REVISION=6;
export const OUTFITS=[{id:'dash',name:'Dash',description:'The original street runner',unlock:1,color:'#ff725e'},{id:'nova',name:'Nova',description:'A fresh perspective',unlock:5,color:'#9279ff'},{id:'ace',name:'Ace',description:'Built for the podium',unlock:15,color:'#44c9b4'},{id:'gold',name:'Gold Rush',description:'For the long-distance legends',unlock:30,color:'#ffcb66'}];
const cleanName=value=>String(value??'').trim().slice(0,20)||'Guest Runner';
const bounded=(v,max=Number.MAX_SAFE_INTEGER)=>Math.min(max,Math.max(0,Number.isFinite(Number(v))?Math.floor(Number(v)):0));
const blank=()=>({version:3,courseRevision:COURSE_REVISION,id:globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2),name:'Guest Runner',color:'#ff725e',outfit:'dash',appearance:legacyAppearance('dash'),raceMode:'tour',enduranceBests:{},unlocked:1,selected:1,crowns:0,races:0,coins:0,xp:0,bests:{},medals:{},sound:true,quality:'auto',tutorial:false});
export function medalFor(level,seconds){if(!Number.isFinite(seconds)||seconds<=0)return 0;const l=levelById(level);return seconds<=l.gold?3:seconds<=l.silver?2:1}
export function createProfileStore(storage){
 let persistent=true,p=blank(),raw;
 try{raw=storage.getItem(KEY)||storage.getItem('bean-dash-profile-v2')}catch{persistent=false}
 if(raw){let saved;try{saved=JSON.parse(raw)}catch{
  // A malformed JSON value is recoverable. Failure to back it up must not block
  // replacing it with a usable profile (for example when storage is nearly full).
  try{storage.setItem(KEY+'-corrupt-backup',raw)}catch{}
 }
 if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
  p={...p,...saved,version:3,courseRevision:COURSE_REVISION};
  if(saved.courseRevision!==COURSE_REVISION){p.legacyBests={...(saved.legacyBests||{}),...(saved.bests||{})};p.bests={};p.legacyEnduranceBests={...(saved.legacyEnduranceBests||{}),...(saved.enduranceBests||{})};p.enduranceBests={}}
  p.appearance=normalizeAppearance(saved.appearance||legacyAppearance(saved.outfit));p.raceMode=saved.raceMode==='endurance'?'endurance':'tour';p.name=cleanName(p.name);p.unlocked=Math.max(1,bounded(p.unlocked,MAX_LEVEL));p.selected=Math.max(1,bounded(p.selected,p.unlocked));
  for(const key of ['crowns','races','coins','xp'])p[key]=bounded(p[key]);
  const scores=(value,max)=>Object.fromEntries(Object.entries(value&&typeof value==='object'&&!Array.isArray(value)?value:{}).filter(([k,v])=>/^\d+$/.test(k)&&+k>=1&&+k<=50&&Number.isFinite(v)&&v>0&&v<=max));
  p.bests=scores(p.bests,86400);p.enduranceBests=scores(p.enduranceBests,86400);p.medals=scores(p.medals,3);
  if(!OUTFITS.some(o=>o.id===p.outfit&&o.unlock<=p.unlocked))p.outfit='dash';
 }}
 const save=()=>{try{storage.setItem(KEY,JSON.stringify(p));persistent=true}catch{persistent=false}};save();
 const clearRun=()=>{try{storage.setItem(RUN_KEY,'null')}catch{}};
 return {
  get:()=>structuredClone(p),isPersistent:()=>persistent,
  update(patch){for(const k of ['name','color','sound','selected','outfit','quality','tutorial','appearance','raceMode'])if(k in patch)p[k]=patch[k];p.appearance=normalizeAppearance(p.appearance);p.raceMode=p.raceMode==='endurance'?'endurance':'tour';p.name=cleanName(p.name);p.selected=Math.max(1,bounded(p.selected,p.unlocked));if(!OUTFITS.some(o=>o.id===p.outfit&&o.unlock<=p.unlocked))p.outfit='dash';save()},
  record(level,seconds,win,{coins=0,rank=0,falls=0,raceMode='tour'}={}){
   if(!Number.isInteger(level)||level<1||level>MAX_LEVEL||level>p.unlocked||!Number.isFinite(seconds)||seconds<=0)return {accepted:false,reason:level>p.unlocked?'locked':'invalid',medal:0,reward:0,xp:0,newBest:false,first:false,newOutfit:null};
   level=levelById(level).id;const records=raceMode==='endurance'?p.enduranceBests:p.bests;const oldUnlocked=p.unlocked,previous=records[level],medal=win?medalFor(level+(raceMode==='endurance'?100:0),seconds):0,first=win&&!previous;
   p.races++;const reward=Math.min(500,bounded(coins,500)+(win?20+level*2:0));p.coins+=reward;
   const xp=win?100+level*5+medal*25+(falls===0?50:0):20;p.xp+=xp;
   if(win){p.unlocked=Math.max(p.unlocked,Math.min(MAX_LEVEL,level+1));records[level]=Math.min(previous||Infinity,seconds);if(raceMode!=='endurance')p.medals[level]=Math.max(p.medals[level]||0,medal);if(rank===1)p.crowns++}
   save();return {accepted:true,medal,reward,xp,newBest:win&&(!previous||seconds<previous),first,newOutfit:OUTFITS.find(o=>o.unlock>oldUnlocked&&o.unlock<=p.unlocked)||null};
  },
  saveRun(run){try{storage.setItem(RUN_KEY,JSON.stringify({...run,revision:COURSE_REVISION}));return true}catch{return false}},
  getRun(){try{const r=JSON.parse(storage.getItem(RUN_KEY)||'null');if(!r||r.revision!==COURSE_REVISION||!Number.isInteger(r.level)||r.level<1||r.level>p.unlocked)return null;
   const raceMode=r.mode==='endurance'?'endurance':'tour',c=buildLevel(r.level+(raceMode==='endurance'?100:0));if(!Number.isFinite(r.time)||r.time<=0||r.time>=c.seconds||!Number.isInteger(r.cp)||r.cp<1||r.cp>=c.checkpoints.length)return null;
   return {level:r.level,mode:raceMode,time:r.time,cp:r.cp,coins:bounded(r.coins,c.coins.length),falls:bounded(r.falls),hits:bounded(r.hits),collected:[...new Set(Array.isArray(r.collected)?r.collected:[])].filter(i=>Number.isInteger(i)&&i>=0&&i<c.coins.length)};
  }catch{return null}},clearRun,
  reset(){p=blank();clearRun();save()}
 };
}
