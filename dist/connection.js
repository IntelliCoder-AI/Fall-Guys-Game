export function serverOrigin(pageOrigin, configuredOrigin=''){
 const url=new URL(configuredOrigin||pageOrigin);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Invalid race server origin');
 return url.origin;
}
export function raceSocketUrl(pageOrigin,configuredOrigin=''){
 const url=new URL('/ws',serverOrigin(pageOrigin,configuredOrigin));url.protocol=url.protocol==='https:'?'wss:':'ws:';return url.href;
}
// A suspended tab or a long graphics frame must get time to drain queued
// WebSocket messages before it is treated as a stalled race connection.
export function createConnectionWatchdog({timeout=10000,resumeGrace=5000}={}){
 let lastFrame=0,graceUntil=0;
 return {reset(){lastFrame=0;graceUntil=0;},expired(now,lastMessage,visible=true){
  if(!visible||!lastFrame||now-lastFrame>2000)graceUntil=now+resumeGrace;
  lastFrame=now;
  return visible&&lastMessage>0&&now>=graceUntil&&now-lastMessage>timeout;
 }};
}
function pause(ms,signal){return new Promise((resolve,reject)=>{if(signal?.aborted)return reject(signal.reason);const abort=()=>{clearTimeout(timer);reject(signal.reason);},timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);signal?.addEventListener('abort',abort,{once:true});});}
// Retry only while the player is waiting; cancel immediately on leaving the queue.
export async function waitForRaceServer(origin,{signal,fetcher=globalThis.fetch,now=Date.now,delay=pause,timeout=90000,onWait=()=>{}}={}){
 const start=now();
 while(now()-start<timeout){
  if(signal?.aborted)throw signal.reason;
  const controller=new AbortController(),abort=()=>controller.abort(signal.reason);signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>controller.abort(),Math.min(15000,timeout-(now()-start)));
  try{const response=await fetcher(new URL('/health',origin),{signal:controller.signal,credentials:'omit',cache:'no-store'});if(response.ok&&(await response.json()).ok===true)return;}
  catch(error){if(signal?.aborted)throw signal.reason;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  onWait(now()-start);await delay(Math.min(2500,Math.max(0,timeout-(now()-start))),signal);
 }
 throw Error('The online server is still starting. Try again shortly, or play a solo race.');
}
// A single page-load request starts an idle backend without delaying the game.
export function wakeRaceServer(origin,{fetcher=globalThis.fetch,timeout=10000}={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
 return fetcher(new URL('/health',origin),{mode:'no-cors',credentials:'omit',cache:'no-store',signal:controller.signal}).catch(()=>{}).finally(()=>clearTimeout(timer));
}
