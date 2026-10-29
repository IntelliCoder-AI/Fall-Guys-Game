import {RELAY,RELAY_NAMES,MECHANISMS,mechanismProgress} from './relay-rules.js';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createRelayUI({modal,send,leave,toast,tone,resetCamera}){
 const $=id=>document.getElementById(id);let key='',lastEnergy=null,lastStage=-1,focusId=null,current=null,myId=null;
 const panel=document.createElement('section');panel.id='relay-ui';panel.hidden=true;
 panel.innerHTML=`<div class="relay-top"><div class="relay-stats"><div><span>YOUR ROLE</span><b id="relay-role"></b></div><div><span>TEAM ENERGY</span><b id="relay-energy"></b></div><div><span>STORM</span><b id="relay-clock"></b></div></div><div class="relay-objective"><b id="relay-progress"></b><span id="relay-instruction" role="status" aria-live="polite"></span></div></div><div id="relay-announcement" role="status" aria-live="polite"></div><div class="relay-dock"><div id="relay-mechanisms">${Object.entries(MECHANISMS).map(([id,m],i)=>`<button data-mechanism="${id}"><span>${i+1} · ${m.name}</span><b>${m.verb}</b><small>${m.cost} energy</small></button>`).join('')}</div><div class="relay-tools"><button id="relay-watch">Follow Runner</button><button id="relay-help">How to play</button></div></div>`;
 $('hud').append(panel);
 panel.querySelectorAll('[data-mechanism]').forEach(b=>b.onclick=()=>{if(current)send({type:'mechanism',key:b.dataset.mechanism,stage:current.relay.stage});});
 $('relay-watch').onclick=()=>{const runners=current?.players.filter(p=>p.connected&&!p.spectator&&p.role==='runner')||[];focusId=runners[(runners.findIndex(p=>p.id===focusId)+1)%runners.length]?.id;resetCamera();};
 function instructions(){modal(`<span class="pill">WORLD RELAY · ONE TEAM</span><h2>Run. Shape. Switch.</h2><p><b>Goal:</b> bring every Runner to three glowing beacons before the storm. The first crossing teaches you the controls; its practice timer is stopped.</p><ol class="relay-rules"><li><b>Runner:</b> WASD / arrows or touch arrows move. Space / JUMP clears low barriers. Collect blue crystals: each adds 2 team energy.</li><li><b>Shaper:</b> use the three labelled buttons, or keys 1–3. Lower the bridge (3), lift the gate (3), steady the wind (4). Activated machinery stays on. Follow Runner changes your camera target.</li><li><b>At the beacon:</b> wait for every Runner. Roles rotate automatically; your new role appears at the top. Falls return you to the last beacon for free.</li></ol><p>Drag the 3D view to look around; scroll to zoom; C resets the view. Online time continues in menus. Energy is shared only in this room; your coins and Tour progress are unchanged.</p><button id="relay-help-close" class="primary-button">BACK TO THE TEAM</button>`);$('relay-help-close').onclick=()=>$('modal').close();}
 $('relay-help').onclick=instructions;
 window.addEventListener('keydown',e=>{if(panel.hidden||$('modal').open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.repeat)return;const k=['Digit1','Digit2','Digit3'].indexOf(e.code);if(k>=0&&current?.players.find(p=>p.id===myId)?.role==='shaper'){e.preventDefault();panel.querySelectorAll('[data-mechanism]')[k].click();}});
 function reset(){panel.hidden=true;document.body.classList.remove('relay-race');key='';lastEnergy=null;lastStage=-1;focusId=null;current=null;}
 function update(s,id){current=s;myId=id;const r=s.relay,own=s.players.find(p=>p.id===id),host=s.hostId===id;
  document.body.classList.add('relay-race');panel.hidden=!['race','countdown'].includes(s.phase);
  const nextKey=[s.room,s.phase,s.round,s.hostId].join(':');
  if(key!==nextKey){key=nextKey;
   if(s.phase==='waiting'){
    modal(`<span class="pill">WORLD RELAY · COOPERATIVE · 2–8 FRIENDS</span><h2>Carry the light. Together.</h2><p>One Shaper controls the world. Runners gather energy and cross it. Reach three beacons before the storm; switch roles at each one.</p><div class="room-code" id="room-code">${escape(s.room)}</div><p id="relay-queue" aria-live="polite"></p><div class="party-actions"><button id="copy-code" class="secondary-button">COPY CODE</button><button id="invite" class="secondary-button">COPY INVITE LINK</button></div>${host?'<button id="start-room" class="primary-button">BEGIN WORLD RELAY</button>':'<p>Your host will start when everyone is here.</p>'}<p>A safe, interactive first crossing teaches both roles. Four minutes of storm time follow. Falls recover for free. No bots, purchases or downloads.</p><button id="cancel-queue" class="secondary-button">Leave room</button>`,{closable:false});
    const copy=async(text,b)=>{try{await navigator.clipboard.writeText(text);b.textContent='COPIED';}catch{toast('Room code: '+s.room);}};
    $('copy-code').onclick=e=>copy(s.room,e.currentTarget);$('invite').onclick=e=>copy(new URL('/?room='+s.room,location.origin).href,e.currentTarget);
    $('cancel-queue').onclick=leave;if(host)$('start-room').onclick=()=>send({type:'start'});
   }else if(s.phase==='complete'){
    modal(`<span class="pill">WORLD RELAY · TEAM RESULT</span><h2>${s.reason==='rescued'?'You carried the light.':'The storm arrived.'}</h2><p>${s.reason==='rescued'?'All three beacons are alive. Everyone wins together.':'Your team reached '+s.relay.stage+' of 3 beacons. Try again with the same crew.'}</p><div class="relay-result"><b>${Math.ceil(s.relay.storm)}s storm time left</b><b>${s.players.reduce((n,p)=>n+(p.recoveries||0),0)} free recoveries</b><b>${s.relay.energy} energy saved</b></div><p>${s.players.filter(p=>p.connected&&!p.spectator).map(p=>escape(p.name)).join(' · ')}</p>${host?'<button id="relay-rematch" class="primary-button">PLAY AGAIN · SAME CODE</button>':'<p>Waiting for the host to start another expedition.</p>'}<button id="relay-leave" class="secondary-button">Back to lobby</button>`,{closable:false});if(host)$('relay-rematch').onclick=()=>send({type:'rematch'});$('relay-leave').onclick=leave;
   }else $('modal').close();
  }
  if($('relay-queue')){$('relay-queue').textContent=`${s.humans} / 8 friends connected · ${host?'You start as Shaper':'You start as Runner'}`;if($('start-room'))$('start-room').disabled=s.humans<2;}
  if(panel.hidden)return;
  const role=own.spectator?'Watching':own.role==='shaper'?'Shaper':'Runner';
  $('relay-role').textContent=role;$('relay-energy').textContent=r.energy+' ◇';
  $('relay-clock').textContent=r.paused?'Paused':!r.tutorialDone?'Practice':`${Math.floor(Math.ceil(r.storm)/60)}:${String(Math.ceil(r.storm)%60).padStart(2,'0')}`;
  $('relay-progress').textContent=`${r.stage+1} / 3 · ${RELAY_NAMES[r.stage]}`;
  let instruction;
  if(r.paused)instruction='Waiting for a teammate. Share the room code '+s.room+' — storm paused.';
  else if(own.spectator)instruction='Watch this crossing. You join at the next beacon.';
  else if(r.transition>0)instruction='Beacon secured! Roles switch in '+Math.ceil(r.transition)+'s.';
  else if(own.recoverAt!==null)instruction='Returning to the last beacon for free…';
  else if(own.ready)instruction='Beacon reached. Wait here for the other Runners.';
  else if(!r.tutorialDone){
   if(own.role==='shaper')instruction=!r.tutorial.shaped?(r.energy<3?'Runners collect blue crystals. Then lower Bridge ① below.':'Press Lower bridge ① below to help your team.'):'Bridge powered! Let Runners practice moving, jumping and collecting.';
   else instruction=!r.tutorial.moved?'Move toward the blue crystal. WASD / arrows or touch arrows.':!r.tutorial.energy?'Walk through a blue crystal to power your Shaper.':!r.tutorial.jumped?'Jump over the low barrier. Space / JUMP.':'Ask your Shaper to lower Bridge ①. Watch it unfold!';
  }else if(own.role==='shaper'){
   const next=Object.keys(MECHANISMS).find(k=>r.mechanisms[k]===null);
   instruction=next?(r.energy<MECHANISMS[next].cost?'Wait for Runners to collect crystals · ':'')+MECHANISMS[next].verb+' for your team.':'All machinery powered. Guide every Runner to the beacon.';
  }else{
   const d=-own.z-r.stage*RELAY.stageLength;
   instruction=d<28?'Collect crystals and jump low barriers. Reach the glowing beacon.':d<46?'Cross Bridge ① when fully lowered.':d<63?'Gate ② needs your Shaper. Collect the crystal before it.':d<94?'Cross Wind ③ carefully. Ask your Shaper to steady the gusts.':'Jump the last barrier. Gather inside the glowing beacon.';
  }
  $('relay-instruction').textContent=instruction;
  const shaper=own.role==='shaper'&&!own.spectator;
  $('relay-mechanisms').hidden=!shaper;$('relay-watch').hidden=!shaper&&!own.spectator;
  panel.classList.toggle('is-shaper',shaper||own.spectator);
  panel.querySelectorAll('[data-mechanism]').forEach((b,i)=>{
   const k=b.dataset.mechanism,m=MECHANISMS[k],done=r.mechanisms[k]!==null,prior=Object.keys(MECHANISMS)[i-1];
   b.disabled=!shaper||r.paused||r.transition>0||s.phase!=='race'||done||r.energy<m.cost||!!(prior&&r.mechanisms[prior]===null);
   b.querySelector('small').textContent=done?(mechanismProgress(r.mechanisms,k,s.clock)>=1?'Powered ✓':'Moving…'):r.energy<m.cost?`Need ${m.cost} · have ${r.energy}`:`${m.cost} energy`;
   b.setAttribute('aria-label',`${m.verb}. ${b.querySelector('small').textContent}`);b.classList.toggle('powered',done);
  });
  if(lastEnergy!==null&&lastEnergy!==r.energy){!matchMedia('(prefers-reduced-motion: reduce)').matches&&$('relay-energy').animate?.([{transform:'scale(1.18)'},{transform:'scale(1)'}],{duration:280});tone(r.energy>lastEnergy?740:390,.09);}
  if(lastStage>=0&&lastStage!==r.stage){$('relay-announcement').textContent=`BEACON SECURED · YOU ARE NOW ${role.toUpperCase()}`;panel.dataset.announcement=String(performance.now()+4000);tone(880,.2);}
  if(performance.now()>Number(panel.dataset.announcement||0))$('relay-announcement').textContent='';
  lastEnergy=r.energy;lastStage=r.stage;
 }
 function focus(s,id){const own=s.players.find(p=>p.id===id);if(own?.role==='runner'&&!own.spectator)return own;
  const runners=s.players.filter(p=>p.connected&&!p.spectator&&p.role==='runner');
  const target=runners.find(p=>p.id===focusId)||runners[0]||own;
  $('relay-watch').textContent=target?`Watching ${target.name} · switch`:'Follow Runner';return target;
 }
 return {update,reset,focus,instructions};
}
