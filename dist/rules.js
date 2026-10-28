import {levelById} from './levels.js';
export function recoveryRules({online=false,hardcore=false,mode='tour'}={}){
 if(online)return 'Online races have one life. Revivals and purchased power-ups are disabled.';
 if(hardcore)return 'Hardcore has one life, with separate medals and best times. No checkpoint revival.';
 if(mode==='endurance')return 'Endurance saves at flags and offers paid checkpoint revival: 100 coins, then 25 more each time, capped at 250. Revivals grant 3 seconds of protection.';
 return 'Tour returns you to the last flag for free with a 4-second penalty and 3 seconds of protection.';
}
export const cleanRunEligible=({hits=0,impacts=0,falls=0,recoveries=0}={})=>hits===0&&impacts===0&&falls===0&&recoveries===0;
export function earningsCap(level=1,mode='tour'){
 return mode==='endurance'?Math.max(500,Math.ceil(levelById(level+100).distance/1000)*100):500;
}
