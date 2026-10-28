import * as T from './vendor/three.module.js';
import {terrainHeightAt} from './terrain.js';
import {buildLevel,obstaclePosition,nearby,platformPosition,fireballPositions,trapdoorTiles} from './levels.js';
import {CHARACTERS,normalizeAppearance,legacyAppearance} from './appearance.js';
const materials=new Map(),geometries=new Map();
function mat(color,metal=0){const key=color+':'+metal;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:metal?.28:.72,metalness:metal}));return materials.get(key)}
function geometry(key,fn){if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key)}
function mesh(g,c,p,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(g,mat(c));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;p.add(m);return m}
const box=(w,h,d,c,x,y,z,p)=>mesh(geometry('box',()=>new T.BoxGeometry(1,1,1)),c,p,[x,y,z],[w,h,d]);
const sphere=(r,c,x,y,z,p,sx=1,sy=1,sz=1)=>mesh(geometry('sphere',()=>new T.SphereGeometry(1,16,12)),c,p,[x,y,z],[r*sx,r*sy,r*sz]);
const cyl=(r,h,c,x,y,z,p)=>mesh(geometry('cyl',()=>new T.CylinderGeometry(1,1,1,20)),c,p,[x,y,z],[r,h,r]);
const cap=(r,h,c,x,y,z,p)=>mesh(geometry('cap-'+r+'-'+h,()=>new T.CapsuleGeometry(r,h,4,12)),c,p,[x,y,z]);
function canvasTexture(draw,w=512,h=256){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;return t}
function sign(text,w,h,bg,fg='#ffffff'){const texture=canvasTexture((ctx,cw,ch)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,cw,ch);ctx.fillStyle=fg;ctx.font='900 95px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,cw/2,ch/2,cw-35)});const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));m.userData.disposable=true;return m}
const face=canvasTexture(ctx=>{ctx.clearRect(0,0,512,256);for(const x of [150,362]){ctx.fillStyle='white';ctx.beginPath();ctx.ellipse(x,96,63,75,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#29413d';ctx.beginPath();ctx.ellipse(x,103,30,50,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17292f';ctx.beginPath();ctx.ellipse(x,107,18,35,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.beginPath();ctx.arc(x-9,84,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#40302b';ctx.lineWidth=19;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-50,18);ctx.lineTo(x+43,10);ctx.stroke()}ctx.strokeStyle='#9b5746';ctx.lineWidth=9;ctx.beginPath();ctx.arc(256,170,36,.15,Math.PI-.15);ctx.stroke()});
const faceMat=new T.MeshBasicMaterial({map:face,transparent:true,depthWrite:false});
export function createRunner(color='#ff725e',outfit='dash',appearance){
 const a=normalizeAppearance(appearance||legacyAppearance(outfit)),character=CHARACTERS.find(c=>c.id===a.character),root=new T.Group(),model=new T.Group();root.add(model);
 const skin=a.skin,fabric=a.shirtColor,pants=a.pantsColor,shoe=a.shoeColor,hairColor=a.hairColor,shoulder=character.shoulder,hip=character.hip;
 const torso=cap(shoulder*.8,.45,fabric,0,1.38,0,model);torso.scale.z=.8;
 if(a.top==='hoodie'){sphere(.36,0xe9e5dc,0,1.68,.14,model,1,.7,.75);box(.36,.16,.04,fabric,0,1.14,-.29,model);for(const x of[-.12,.12])cap(.018,.22,0xf8f1d9,x,1.58,-.31,model)}
 if(a.top==='jacket'){box(.06,.65,.055,0xf5e8c9,0,1.38,-.3,model);for(const x of[-.23,.23])box(.14,.1,.04,0xf1e5ce,x,1.2,-.3,model);for(let y=1.1;y<1.7;y+=.13)sphere(.025,0x243e4c,.06,y,-.32,model);cyl(.31,.1,0xeee5ce,0,1.03,0,model)}
 if(a.top==='tee'){const emblem=sign(a.character==='ace'?'A':'B',.22,.22,fabric);emblem.position.set(.16,1.55,-.29);emblem.rotation.y=Math.PI;model.add(emblem)}
 if(a.accessory==='backpack'){const pack=cap(.24,.24,0x283f50,0,1.4,.36,model);pack.scale.set(1,.95,.5);box(.27,.16,.12,0x547781,0,1.32,.51,model);for(const x of[-.22,.22])box(.06,.58,.08,0x304f5b,x,1.46,-.3,model)}
 cyl(.13,.18,skin,0,1.85,0,model);sphere(character.head,skin,0,2.2,0,model,1,character.id==='ace'?1:1.08,.92);sphere(.075,skin,0,2.16,-character.head*.96,model,1,.8,1.1);for(const x of[-character.head,character.head])sphere(.085,skin,x,2.18,0,model,.7,1,.8);
 const eyes=new T.Mesh(geometry('eyes-plane',()=>new T.PlaneGeometry(.65,.42)),faceMat);eyes.position.set(0,2.23,-character.head*.92);eyes.rotation.y=Math.PI;model.add(eyes);
 if(character.id==='nova')for(const x of[-.2,.2]){const lash=box(.1,.02,.02,0x392e33,x,2.4,-character.head*.95,model);lash.rotation.z=x>0?.3:-.3}
 if(character.id==='ace'){for(const x of[-.26,.26])cap(.045,.15,hairColor,x,2.02,-.31,model);box(.26,.07,.02,hairColor,0,1.98,-.33,model)}
 if(character.id==='ari')for(const x of[-.23,.23])for(let i=0;i<3;i++)sphere(.012,0xa6644f,x+i*.025,2.13,-.37,model);
 const mouth=new T.Mesh(geometry('smile',()=>new T.TorusGeometry(.085,.014,6,16,Math.PI)),mat(0x8b4a3d));mouth.position.set(0,2.06,-character.head*.95);mouth.rotation.z=Math.PI;model.add(mouth);
 mesh(geometry('hair',()=>new T.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI*.57)),hairColor,model,[0,2.29,.04],[character.head*1.04,.42,.4]);
 if(a.hair==='ponytail'){for(let i=0;i<3;i++)sphere(.22-i*.025,hairColor,.08,2.42-i*.25,.42+i*.04,model,.8,1.2,1);cyl(.12,.08,fabric,.08,2.4,.42,model)}
 if(a.hair==='bob'){for(const x of[-.35,.35])cap(.15,.4,hairColor,x,2.18,.12,model);sphere(.35,hairColor,0,2.2,.27,model,1,1.2,.6)}
 if(a.hair==='curly')for(let i=0;i<13;i++){const angle=i*Math.PI*2/13;sphere(.14,hairColor,Math.cos(angle)*.35,2.49+(i%3)*.04,Math.sin(angle)*.32,model)}
 if(a.hat==='cap'){mesh(geometry('hat',()=>new T.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI*.49)),a.hatColor,model,[0,2.49,.03],[character.head+ .03,.27,.43]);box(.62,.065,.4,a.hatColor,0,2.49,.41,model);box(.19,.09,.035,0xf6eee0,0,2.51,-.407,model)}
 if(a.hat==='beanie'){sphere(character.head*1.06,a.hatColor,0,2.5,.02,model,1,.75,1);cyl(character.head*1.07,.12,a.hatColor,0,2.4,.02,model);sphere(.11,0xf4edda,0,2.87,0,model)}
 if(a.accessory==='glasses'){for(const x of[-.15,.15]){const rim=new T.Mesh(geometry('glasses',()=>new T.TorusGeometry(.125,.018,6,18)),mat(0x263544));rim.position.set(x,2.26,-character.head-.02);model.add(rim)}box(.07,.02,.02,0x263544,0,2.27,-character.head-.02,model)}
 const arms=[],legs=[];
 for(const side of[-1,1]){const arm=new T.Group();arm.position.set(side*shoulder,1.67,0);model.add(arm);cap(.14,a.top==='tee'?.08:.32,a.top==='jacket'?0xf4e6d2:fabric,0,a.top==='tee'?-.1:-.22,0,arm);cap(.105,.31,skin,0,-.48,0,arm);sphere(.12,skin,0,-.72,0,arm);arms.push(arm);
 const leg=new T.Group();leg.position.set(side*hip,.98,0);model.add(leg);cap(.145,a.bottom==='shorts'?.12:.44,pants,0,a.bottom==='shorts'?-.13:-.28,0,leg);if(a.bottom==='shorts')cap(.105,.31,skin,0,-.43,0,leg);if(a.bottom==='jeans')box(.12,.12,.025,0x54738b,side*.05,-.34,-.14,leg);box(.29,.19,.5,shoe,0,-.76,-.13,leg);box(.3,.06,.52,0x243b4a,0,-.87,-.13,leg);box(.24,.15,.25,fabric,0,-.73,.04,leg);for(let i=0;i<2;i++)box(.17,.02,.025,0x344d5a,0,-.66,-.15-i*.07,leg);legs.push(leg)}
 if(a.bottom==='skirt')mesh(geometry('skirt',()=>new T.CylinderGeometry(.30,.49,.45,12)),pants,model,[0,.88,0]);
 const ring=new T.Mesh(geometry('shadow',()=>new T.CircleGeometry(.65,24)),new T.MeshBasicMaterial({color:0x20384d,transparent:true,opacity:.16,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;root.add(ring);
 return {root,model,arms,legs,torso,ring,outfit,color,appearance:JSON.stringify(a),heading:0};
}
export function animateRunner(r,state,t,dt,{lobby=false,interpolate=false}={}){const target=new T.Vector3(state.x||0,state.y||0,state.z||0);r.root.position.lerp(target,interpolate?1-Math.exp(-dt*20):1);const moving=lobby?false:state.moving!==false&&!state.finished&&state.grounded;const stride=moving?Math.sin(t*16)*.7:Math.sin(t*2)*.035;r.legs[0].rotation.x=stride;r.legs[1].rotation.x=-stride;r.arms[0].rotation.x=-stride*.85-(state.grounded?0:.9);r.arms[1].rotation.x=stride*.85-(state.grounded?0:.9);r.arms[0].rotation.z=.08;r.arms[1].rotation.z=-.08;r.model.rotation.y=lobby?Math.PI+.3:state.heading||0;r.model.rotation.x=state.dive>0?-1.1:0;r.model.rotation.z=0;r.model.position.y=moving?Math.abs(Math.sin(t*16))*.045:Math.sin(t*2)*.025;r.ring.visible=state.y<.6;r.ring.scale.setScalar(Math.max(.45,1-state.y*.1));if(state.deathProgress!==undefined){const d=state.deathProgress;r.model.rotation.z=-d*1.35;r.model.rotation.x=d*.45;r.model.position.y=state.deathReason==='water'?-.5*d:Math.sin(d*Math.PI)*1.2;r.arms[0].rotation.z=1;r.arms[1].rotation.z=-1;r.ring.visible=false;}}
export class GameView{
 constructor(container){this.scene=new T.Scene();this.scene.background=new T.Color(0xb8e8ee);this.scene.fog=new T.Fog(0xb8e8ee,70,190);this.camera=new T.PerspectiveCamera(49,innerWidth/innerHeight,.1,260);this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;container.appendChild(this.renderer.domElement);this.scene.add(new T.HemisphereLight(0xf5fcff,0x8f8eac,2.2));this.sun=new T.DirectionalLight(0xffedd5,2.4);this.sun.position.set(-20,40,20);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-30,right:30,top:45,bottom:-45,near:1,far:100});this.sun.shadow.normalBias=.08;this.scene.add(this.sun,this.sun.target);this.runners=new Map();this.effects=[];this.lobby=true;this.camera.position.set(6,4,9);this.target=new T.Vector3(-2,1.5,0);this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight)};window.addEventListener('resize',this.resize)}
 quality(value){this.renderer.setPixelRatio(value==='low'?1:Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=value!=='low'}
 setRunner(id,color,outfit,appearance){const signature=JSON.stringify(normalizeAppearance(appearance||legacyAppearance(outfit)));let r=this.runners.get(id);if(r&&(r.color!==color||r.outfit!==outfit||r.appearance!==signature)){this.scene.remove(r.root);r.root.traverse(o=>{if(o.userData.disposable){o.geometry.dispose();o.material.map?.dispose();o.material.dispose()}});r.ring.material.dispose();if(r.label){r.label.geometry.dispose();r.label.material.map.dispose();r.label.material.dispose()}this.runners.delete(id);r=null}if(!r){r=createRunner(color,outfit,appearance);this.scene.add(r.root);this.runners.set(id,r)}return r}
 clearRunners(){for(const r of this.runners.values()){this.scene.remove(r.root);r.root.traverse(o=>{if(o.userData.disposable){o.geometry.dispose();o.material.map?.dispose();o.material.dispose()}});r.ring.material.dispose();if(r.label){r.label.geometry.dispose();r.label.material.map.dispose();r.label.material.dispose()}}this.runners.clear()}
 disposeGroup(group){group.traverse(o=>{if(o.userData.ownedGeometry)o.geometry.dispose();if(o.userData.disposable){o.geometry.dispose();o.material.map?.dispose();o.material.dispose()}});this.world?.remove(group)}
 load(level){
  this.snapCamera=true;this.level=level;this.course=buildLevel(level);
  if(this.world){this.disposeGroup(this.world);this.scene.remove(this.world)}
  this.world=new T.Group();this.scene.add(this.world);const c=this.course;
  this.scene.background.set(c.theme.sky);this.scene.fog.color.set(c.theme.sky);
  this.parts=new Map();this.streamCenter=null;this.hazards=[];this.coinMeshes=[];
  const waterMat=new T.ShaderMaterial({uniforms:{clock:{value:0}},vertexShader:`varying vec3 world;uniform float clock;void main(){vec3 p=position;p.z+=sin(p.x*.16+clock*1.4)*.12+sin(p.y*.2-clock*2.)*.08;vec4 w=modelMatrix*vec4(p,1.);world=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`varying vec3 world;uniform float clock;void main(){vec2 p=world.xz;float flow=p.y*.36+clock*2.5+sin(p.x*.23+clock*.7)*1.7;float ripple=sin(flow)*.5+.5;float small=sin(p.x*.85+p.y*.65-clock*3.)*.5+.5;float foam=smoothstep(.94,1.,sin(flow+small*.6))*smoothstep(.2,.8,small);vec3 water=mix(vec3(.018,.16,.29),vec3(.025,.42,.56),ripple*.55+small*.15);water=mix(water,vec3(.65,.9,.96),foam*.65);gl_FragColor=vec4(water,1.);}`});
  this.sea=new T.Mesh(new T.PlaneGeometry(350,700,48,96),waterMat);this.sea.rotation.x=-Math.PI/2;this.sea.position.y=-3;this.sea.userData.disposable=true;this.world.add(this.sea);
  this.stage=new T.Group();this.stage.position.set(2,-.2,4);this.world.add(this.stage);
  cyl(2.6,.35,0xf3e7d5,0,.05,0,this.stage);cyl(2.7,.12,c.theme.accent,0,-.18,0,this.stage);
  this.stream(0);
 }
 stream(z){
  const center=Math.floor(-z/100);if(center===this.streamCenter)return;this.streamCenter=center;
  const wanted=new Set();for(let i=center-2;i<=center+2;i++)wanted.add(i);
  for(const [i,part]of this.parts)if(!wanted.has(i)){this.disposeGroup(part.root);this.parts.delete(i)}
  for(const i of wanted)if(!this.parts.has(i))this.parts.set(i,this.buildChunk(i));
  this.hazards=[...this.parts.values()].flatMap(p=>p.hazards);this.coinMeshes=[...this.parts.values()].flatMap(p=>p.coins);this.platformMeshes=[...this.parts.values()].flatMap(p=>p.platforms);
  this.sea.position.z=-center*100;
 }
 buildChunk(index){
  const c=this.course,hi=-index*100+50,lo=hi-100,root=new T.Group(),part={root,hazards:[],coins:[],platforms:[]};this.world.add(root);
  const section=items=>nearby(items,(hi+lo)/2,50).filter(p=>p.z<=hi&&p.z>lo);
 for(const p of section(c.platforms)){const g=new T.Group();root.add(g);g.position.z=p.z;const wood=p.kind==='bridge',color=wood?0xc79157:p.motion?0xd6b75f:c.theme.track;box(p.w,.7,p.d,color,0,-.4,0,g);const deck=box(p.w,.1,p.d,color,0,-.04,0,g);
 if(p.terrain){for(const m of [...g.children]){m.geometry=new T.BoxGeometry(1,1,1,1,1,48);const a=m.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)+terrainHeightAt(c,p.z+a.getZ(i)*p.d)/m.scale.y);m.geometry.computeVertexNormals();m.userData.ownedGeometry=true;}}

 if(wood){for(let z=-p.d/2+1;z<p.d/2;z+=1.4)box(p.w,.08,.09,0x704b39,0,.025,z,g);for(const x of[-p.w/2+.2,p.w/2-.2])box(.18,3,.25,0x775241,x,-1.2,0,g)}
 for(const x of[-p.w/2+.1,p.w/2-.1]){if(p.rails){if(!p.terrain)box(.22,.45,p.d,c.theme.edge,x,.2,0,g);else for(let z=-p.d/2+1;z<p.d/2;z+=2)box(.22,.45,2,c.theme.edge,x,terrainHeightAt(c,p.z+z)+.2,z,g);}else if(!p.terrain)box(.12,.03,p.d,0xffc264,x,.03,0,g);else for(let z=-p.d/2+1;z<p.d/2;z+=2)box(.16,.06,2,0xffc264,x,terrainHeightAt(c,p.z+z)+.04,z,g)}
 if(!wood)for(let z=-p.d/2+3;z<p.d/2;z+=8)box(.1,.02,2,0xffffff,0,terrainHeightAt(c,p.z+z)+.023,z,g);if(p.terrain){const label=sign(p.terrain==='hills'?'ROLLING HILLS':p.terrain==='ridge'?'RIDGE CLIMB':'SUMMIT TRAIL',4,.6,'#65492d');label.position.set(p.w/2+2.2,2,p.d/2-3);g.add(label);}part.platforms.push({spec:p,group:g,deck});}

 for(const h of section(c.hazards)){const g=new T.Group();g.position.set(h.x,terrainHeightAt(c,h.z),h.z);root.add(g);let arm;
 if(h.type==='wheel'){arm=new T.Group();arm.position.y=1.8;g.add(arm);const rim=new T.Mesh(geometry('wheel-rim',()=>new T.TorusGeometry(1.55,.28,10,28)),mat(0x294352));arm.add(rim);const inner=new T.Mesh(geometry('wheel-inner',()=>new T.TorusGeometry(1.2,.08,6,24)),mat(0xffc355));arm.add(inner);for(let i=0;i<8;i++){const spoke=box(2.8,.13,.2,0xffc355,0,0,0,arm);spoke.rotation.z=i*Math.PI/8}sphere(.38,0xf6775f,0,0,0,arm)}
 else if(h.type==='fireballs'){arm=[];for(const x of[-c.width/2-.7,c.width/2+.7]){cyl(.6,1.5,0x324252,x,.75,0,g);const barrel=cyl(.32,1.5,0xeea84c,x,1.5,0,g);barrel.rotation.z=Math.PI/2}for(let i=0;i<3;i++){const ball=new T.Group();g.add(ball);sphere(.65,0xff651f,0,0,0,ball);sphere(.43,0xffd460,0,0,-.22,ball);const tail=mesh(geometry('flame',()=>new T.ConeGeometry(.5,1.5,8)),0xffa32e,ball,[.8,0,0]);tail.rotation.z=-Math.PI/2;arm.push(ball)}}
 else if(['bridge','moving','vanishing'].includes(h.type)){const label=sign(h.type==='bridge'?'NARROW BRIDGE':h.type==='moving'?'MOVING ISLAND':'WATCH THE FLOOR',2.8,.45,'#244452');label.position.set(-h.w/2-1.6,1.8,20);g.add(label)}
 else if(h.type==='gate'){arm=[box(c.width,2.8,.65,0x9676d0,-c.width/2-h.opening/2,1.4,0,g),box(c.width,2.8,.65,0x9676d0,c.width/2+h.opening/2,1.4,0,g)];for(const x of[-h.opening/2,h.opening/2])box(.18,3,.8,0xffd572,x,1.5,0,g)}
 else if(h.type==='sweeper'){cyl(.65,1.2,c.theme.accent,0,.6,0,g);cyl(.8,.13,0xffedb9,0,1.22,0,g);arm=new T.Group();arm.position.y=.8;g.add(arm);const b=cap(.27,h.r*2-.54,0xff796c,0,0,0,arm);b.rotation.z=Math.PI/2;for(const x of [-h.r,h.r])sphere(.34,0xffe0a5,x,0,0,arm)}
 else if(h.type==='bumper'){cyl(1.05,1.3,0xff796c,0,.75,0,g);cyl(1.12,.2,c.theme.accent,0,1.4,0,g);cyl(1.12,.18,0xf6eed6,0,.2,0,g)}
 else if(h.type==='roller'){const m=sphere(1.15,0xff986f,0,1.15,0,g);const ring=new T.Mesh(geometry('roll-ring',()=>new T.TorusGeometry(1.15,.13,8,20)),mat(0xffe6ad));ring.position.y=1.15;g.add(ring);arm=ring}
 else if(h.type==='hammer'){sphere(1.25,0x8f75cc,0,1.6,0,g,1.2,1,.7);box(.22,5,.22,0xe0c8e4,0,4.5,0,g);box(1.8,.3,1.6,0xffc57c,0,1.7,0,g)}
 else if(h.type==='trapdoor'){arm=trapdoorTiles(h,0,this.level).map(tile=>{box(tile.w,.02,tile.d,0x162a39,tile.x,.02,tile.z-h.z,g);return box(tile.w,.1,tile.d,0xffad47,tile.x,.08,tile.z-h.z,g)})}
 else if(['conveyor','ice','wind','launchpad','mud','magnet'].includes(h.type)){
 const colors={conveyor:0xf0a34e,ice:0xb0f2ff,wind:0x93dcdf,launchpad:0x61d09a,trapdoor:0xffad47,mud:0x8254ac,magnet:0xf580b1};
 if(h.type==='trapdoor')box(h.w,.02,h.d,0x172838,0,.02,0,g);arm=h.type==='wind'?new T.Group():box(h.w,.08,h.d,colors[h.type],0,.06,0,g);if(h.type==='wind')g.add(arm);
 if(h.type==='conveyor')for(let z=-3;z<=3;z+=1)box(h.w,.035,.15,0x263d50,0,.12,z,g);
 if(h.type==='ice')for(let i=-1;i<=1;i++){const crack=box(.08,.02,4,0xffffff,i*1.3,.12,0,g);crack.rotation.y=i*.5}
 if(h.type==='wind'){cyl(.14,3.5,0xeefcff,h.w/2,1.75,0,g);for(let z=-2;z<=2;z+=2)box(1.5,.1,.1,0xffffff,0,1.2,z,arm)}
 if(h.type==='launchpad'){cyl(.9,.5,0x2e6b52,0,.25,0,g);cyl(1.15,.15,0xefff95,0,.6,0,g)}
 if(h.type==='trapdoor')for(const x of[-h.w/2,h.w/2])box(.2,.15,h.d,0xffdba4,x,.1,0,g);
 if(h.type==='magnet'){for(const x of[-.9,.9])box(.5,2,.6,0xf64b82,x,1,0,g);box(2.3,.5,.6,0xdddde5,0,2,0,g)}
 const label=sign(h.type.toUpperCase(),2.3,.4,'#263d50');label.position.set(h.w/2+1.4,1.8,-h.d/2);g.add(label);
 }
 else if(h.type==='piston'){for(const x of[-h.w/2,h.w/2])box(.3,6,.4,0x334657,x,3,0,g);box(h.w,.4,2,0xf4b351,0,6,0,g);arm=box(h.w-.5,1,h.d,0xec6b61,0,4.5,0,g)}
 else if(h.type==='laser'){for(const x of[-c.width/2+1,c.width/2-1])cyl(.2,2,0x334657,x,1,0,g);arm=box(c.width-2,.14,.14,0xff547b,0,.7,0,g)}
 else if(h.type==='slalom'){for(let i=0;i<3;i++){const x=(i%2?1:-1)*c.width*.23;box(c.width*.5,2.6,.4,i%2?0xffbf61:0x9279cf,x,1.3,3-i*3,g)}}
 else if(h.type==='tunnel'){box(h.w,.65,2,0x6d82cf,0,1.5,0,g);for(const x of[-h.w/2,h.w/2])box(.3,1.5,2,0xb7c5f5,x,.75,0,g);const label=sign('DIVE',3,.6,'#30425d');label.position.set(0,2.2,.9);g.add(label)}
 else if(h.type==='pulse'){cyl(.4,.7,0xf9c55f,0,.35,0,g);arm=new T.Mesh(geometry('shockwave',()=>new T.TorusGeometry(1,.08,6,40)),mat(0xff68ae));arm.rotation.x=Math.PI/2;arm.position.y=.3;g.add(arm)}
 else if(h.type==='boulder'){arm=sphere(1.2,0x8a7ca0,0,1.2,0,g);for(const x of[-2,2])box(.18,.3,12,0xffc163,x,.15,0,g)}
 else{box(h.w,h.height,.6,h.type==='gate'?0x927ac3:0xffae67,0,h.height/2,0,g);for(let x=-h.w/2+.4;x<h.w/2;x+=1.3){const stripe=box(.5,h.height+.015,.63,0xffe7ad,x,h.height/2,0,g);stripe.rotation.z=-.2}for(const x of [-h.w/2,h.w/2])cyl(.15,h.height+.2,0xf8f2dd,x,(h.height+.2)/2,0,g)}part.hazards.push({spec:h,group:g,arm})}
 for(const p of section(c.checkpoints)){for(const x of [-c.width/2+1,c.width/2-1]){cyl(.09,3.2,0xf6f5e6,x,1.6,p.z,root);const flag=box(1,.65,.04,0x42c8ad,x+(x<0?.5:-.5),2.75,p.z,root)}box(c.width,.02,.12,0xeffffc,0,.02,p.z,root)}
 const coinGeo=geometry('coin',()=>new T.CylinderGeometry(.3,.3,.1,16));for(const coin of section(c.coins)){const m=new T.Mesh(coinGeo,mat(0xffc444,.6));m.position.set(coin.x,coin.y,coin.z);m.rotation.x=Math.PI/2;root.add(m);part.coins.push({spec:coin,mesh:m})}
 for(const pad of section(c.boosts)){box(pad.w,.025,pad.d,0x4ce5b3,pad.x,.035,pad.z,root);for(let i=-1;i<=1;i++){const mark=sign('»',2,.9,'#4ce5b3','#153f48');mark.rotation.x=-Math.PI/2;mark.rotation.z=Math.PI/2;mark.position.set(i*1.3,.055,pad.z);root.add(mark)}}
 if(c.finishZ<=hi&&c.finishZ>lo){const z=c.finishZ;for(const x of [-c.width/2,c.width/2]){box(.7,7,.7,c.theme.accent,x,3.5,z-1,root)}box(c.width+1,1.7,.75,0x233749,0,6.5,z-1,root);const finish=sign('FINISH',c.width*.8,1.35,'#233749');finish.position.set(0,6.5,z-.6);root.add(finish);for(let x=-Math.floor(c.width/2);x<Math.floor(c.width/2);x++)for(let row=0;row<4;row++)box(1,.02,.7,(x+row)%2?0xf9f4e7:0x263e4d,x,.035,z+1-row*.7,root);
}
 for(let i=Math.max(0,Math.floor((25-hi)/35));i<Math.ceil((25-lo)/35);i++){const z=25-i*35;for(const side of [-1,1]){const g=new T.Group();g.position.set(side*(23+(i%4)*8),-5,z);root.add(g);if(c.worldIndex===1||c.worldIndex===2){const height=8+(i*7%17);box(8,height,9,c.theme.scenery,0,height/2,0,g);for(let y=2;y<height;y+=3)for(let x=-2;x<=2;x+=2)box(.6,1.1,.04,c.theme.edge,x,y,4.52,g)}else{const h=10+i%5*3;mesh(geometry('mountain',()=>new T.ConeGeometry(1,1,6)),c.theme.scenery,g,[0,h/2-2,0],[9+i%4,h,9]);mesh(geometry('snowcap',()=>new T.ConeGeometry(1,1,6)),c.theme.edge,g,[0,h*.85-2,0],[(9+i%4)*.31,h*.3+.04,2.79]);}}}
 return part;
 }
 burst(x,y,z){for(let i=0;i<42;i++){const m=box(.13,.05,.2,[0xffc555,0x52cfaf,0xff7d75,0x9a80df][i%4],x+(Math.random()-.5)*3,y+2+Math.random()*3,z,this.scene);this.effects.push({m,life:2,v:new T.Vector3((Math.random()-.5)*5,Math.random()*4,(Math.random()-.5)*5)})}}
 render({t,dt,lobby,focus,states,collected=[],shake=0}){this.sea.material.uniforms.clock.value=t;if(!lobby){states=states.map(s=>({...s,y:s.y+terrainHeightAt(this.course,s.z)}));focus={...focus,y:focus.y+terrainHeightAt(this.course,focus.z)};}if(this.lobby!==lobby)this.snapCamera=true;this.lobby=lobby;this.stage.visible=lobby;const visibleIds=new Set(states.map(s=>s.id));for(const [id,r] of this.runners)r.root.visible=visibleIds.has(id);for(const s of states){const r=this.setRunner(s.id,s.color,s.outfit,s.appearance);r.root.visible=(!s.eliminated||s.deathProgress!==undefined)&&(!focus||Math.abs(s.z-focus.z)<100||s.id===focus.id);r.root.scale.setScalar(lobby?(this.customizing?(innerWidth<700?1:1.35):innerWidth<700?.9:1.4):1);animateRunner(r,lobby?{x:2,y:0,z:4,grounded:true}:s,t,dt,{lobby,interpolate:!lobby&&s.remote});if(!lobby&&!r.label){r.label=sign(s.id===focus?.id?'YOU':s.isBot?'BOT':s.name||'RUNNER',s.isBot?.65:1.3,.27,s.id===focus?.id?'#eb8963':s.isBot?'#738995':'#305363');r.label.position.y=3.05;r.root.add(r.label)}if(r.label){r.label.visible=!lobby;r.label.quaternion.copy(this.camera.quaternion)}}
 if(focus?.deathProgress!==undefined&&focus.deathReason==='water'){if(!this.splash){this.splash=new T.Mesh(geometry('splash',()=>new T.TorusGeometry(1,.1,6,32)),mat(0xb9edf4));this.splash.rotation.x=-Math.PI/2;this.scene.add(this.splash);}this.splash.visible=true;this.splash.position.set(focus.x,-2.75,focus.z);this.splash.scale.setScalar(1+focus.deathProgress*3);}else if(this.splash)this.splash.visible=false;
 const cam=this.camera;const fov=lobby?49:focus?.boost>0?55:49;if(Math.abs(cam.fov-fov)>.01){cam.fov+=(fov-cam.fov)*Math.min(1,dt*5);cam.updateProjectionMatrix()}let goal,look;if(lobby){const mobile=innerWidth<700;goal=new T.Vector3(mobile?6:7,mobile?4.4:4.1,mobile?(this.customizing?17:11):10);look=new T.Vector3(this.customizing?(mobile?2:3.5):mobile?.5:-1.5,this.customizing&&mobile?-1.6:1.8,3.5)}else{goal=new T.Vector3((focus?.x||0)*.65,Math.max(0,focus?.y||0)+6.8,(focus?.z||0)+10.5);look=new T.Vector3((focus?.x||0)*.8,Math.max(0,focus?.y||0)+1,(focus?.z||0)-(focus?.deathProgress!==undefined?0:innerWidth<=700?1.5:8))}if(this.snapCamera||cam.position.distanceTo(goal)>100){cam.position.copy(goal);this.snapCamera=false}else cam.position.lerp(goal,1-Math.exp(-dt*(lobby?3:6)));if(shake>0)cam.position.x+=Math.sin(t*65)*shake*.1;cam.lookAt(look);this.sun.position.set(look.x-20,40,look.z+20);this.sun.target.position.set(look.x,0,look.z-15);
 const z=lobby?0:focus?.z||0;this.stream(z);for(const item of this.platformMeshes){const state=platformPosition(item.spec,t);item.group.position.x=state.x;item.group.visible=state.active;item.deck.material=mat(state.warning?0xff8a58:item.spec.kind==='bridge'?0xc79157:item.spec.motion?0xd6b75f:this.course.theme.track);}for(const h of this.hazards){h.group.visible=Math.abs(h.spec.z-z)<155;if(!h.group.visible)continue;if(h.spec.type==='sweeper')h.arm.rotation.y=t*h.spec.speed+h.spec.phase;else{const p=obstaclePosition(h.spec,t,this.level);h.group.position.x=p.x;
 if(h.spec.type==='wheel')h.arm.rotation.z=-t*Math.abs(h.spec.speed)*2;
 else if(h.spec.type==='fireballs'){const balls=fireballPositions(h.spec,t);h.arm.forEach((ball,i)=>{ball.position.set(balls[i].x,balls[i].y,balls[i].z-h.spec.z);ball.visible=balls[i].active})}
 else if(h.spec.type==='piston')h.arm.position.y=p.y;
 else if(h.spec.type==='laser')h.arm.visible=p.active;
 else if(h.spec.type==='trapdoor'){const tiles=trapdoorTiles(h.spec,t,this.level);h.arm.forEach((tile,i)=>{tile.visible=!tiles[i].active;tile.material=mat(tiles[i].warning?0xff655b:0xffad47)})}
 else if(h.spec.type==='pulse'){h.arm.scale.setScalar(Math.max(.01,p.radius));h.arm.visible=p.active}
 else if(h.spec.type==='boulder'){h.arm.position.z=p.z-h.spec.z;h.arm.rotation.x=t*4}
 else if(h.spec.type==='conveyor')h.arm.position.y=.06+Math.sin(t*8)*.015;
 else if(h.spec.type==='wind')h.arm.position.x=Math.sin(t*1.8+h.spec.phase)*.3;
 else if(h.spec.type==='roller')h.arm.rotation.z=t*3}}
 const taken=new Set(collected);for(const coin of this.coinMeshes){coin.mesh.visible=Math.abs(coin.spec.z-z)<135&&!taken.has(coin.spec.id);if(coin.mesh.visible){coin.mesh.rotation.z=t*2;coin.mesh.position.y=terrainHeightAt(this.course,coin.spec.z)+coin.spec.y+Math.sin(t*3+coin.spec.id)*.12}}
 for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.life-=dt;e.v.y-=dt*6;e.m.position.addScaledVector(e.v,dt);e.m.rotation.x+=dt*3;if(e.life<0){this.scene.remove(e.m);this.effects.splice(i,1)}}this.renderer.render(this.scene,cam);
 }
}
