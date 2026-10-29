import * as T from './vendor/three.module.js';
import {RELAY,RELAY_NAMES,RELAY_CRYSTALS,relayOffset,mechanismProgress} from './relay-rules.js';

// Uses the existing renderer, lighting, animated wardrobe and camera rig. No second canvas.
export function installRelayView(view){
 if(!view.renderer)return;
 const load=view.load.bind(view),stream=view.stream.bind(view),render=view.render.bind(view);
 let active=false,resources=[],sections=[],state=null,decorateRunner=null;
 const own=value=>(resources.push(value),value);
 const reset=()=>{for(const r of resources)r.dispose();resources=[];sections=[];active=false;state=null;decorateRunner=null;};
 view.load=level=>{reset();view.scene.fog.near=70;view.scene.fog.far=190;load(level);};
 view.stream=z=>{if(!active)stream(z);};
 view.loadRelay=()=>{
  view.load(1);active=true;view.scene.background.set(0xc4d8ed);view.scene.fog.color.set(0xc4d8ed);
  view.scene.fog.near=75;view.scene.fog.far=195;view.sea.position.y=-19;
  for(const part of view.parts.values())view.disposeGroup(part.root);
  view.parts.clear();view.hazards=[];view.coinMeshes=[];view.platformMeshes=[];view.stage.visible=false;
  view.course={...view.course,platforms:[]};
  const grain=document.createElement('canvas');grain.width=grain.height=128;
  const ctx=grain.getContext('2d'),pixels=ctx.createImageData(128,128);
  let seed=73;for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=150+(seed%70);pixels.data.set([v,v,v,255],i);}ctx.putImageData(pixels,0,0);
  const texture=own(new T.CanvasTexture(grain));texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(4,10);
  const material=(color,metalness=0,roughness=.85)=>own(new T.MeshStandardMaterial({color,metalness,roughness,bumpMap:texture,bumpScale:metalness?.018:.1}));
  const stone=material(0xa6a1ab),deck=material(0xe3d4b4),bronze=material(0xb97c49,.68,.32),steel=material(0x526986,.7,.28),wood=material(0xc69a6b),light=own(new T.MeshStandardMaterial({color:0x9cdbff,emissive:0x3679bd,emissiveIntensity:.65,roughness:.2,metalness:.45}));
  const rockCanvas=document.createElement('canvas');rockCanvas.width=rockCanvas.height=256;
  const rockContext=rockCanvas.getContext('2d'),rockPixels=rockContext.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const i=(y*256+x)*4;seed=(seed*1664525+1013904223)>>>0;
   const seam=Math.pow(Math.abs(Math.sin(y*.19+Math.sin(x*.025)*1.4)),14),grain=(seed%35)-17;
   const value=126+grain-36*seam+15*Math.sin(x*.035+y*.04);
   rockPixels.data.set([value+18,value+9,value,255],i);
  }
  rockContext.putImageData(rockPixels,0,0);const rockMap=own(new T.CanvasTexture(rockCanvas));rockMap.colorSpace=T.SRGBColorSpace;rockMap.wrapS=rockMap.wrapT=T.RepeatWrapping;rockMap.repeat.set(3,2);
  stone.map=rockMap;stone.bumpMap=rockMap;stone.bumpScale=.22;stone.color.set(0xb6ac9a);
  const cragGeo=own(new T.IcosahedronGeometry(1,2)),cragPosition=cragGeo.attributes.position;
  for(let i=0;i<cragPosition.count;i++){const x=cragPosition.getX(i),y=cragPosition.getY(i),z=cragPosition.getZ(i),n=1+.13*Math.sin(x*7+y*4)+.08*Math.cos(z*9-y*6);cragPosition.setXYZ(i,x*n,y*n,z*n);}cragGeo.computeVertexNormals();
  const boxGeo=own(new T.BoxGeometry(1,1,1)),cylGeo=own(new T.CylinderGeometry(1,1,1,16)),orbGeo=own(new T.OctahedronGeometry(.42,0)),rimGeo=own(new T.TorusGeometry(1,.055,8,32));
  const add=(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const box=(p,m,x,y,z,w,h,d)=>add(p,boxGeo,m,x,y,z,w,h,d);
  const cyl=(p,m,x,y,z,r,h)=>add(p,cylGeo,m,x,y,z,r,h,r);
  const label=(p,text,x,y,z)=>{
   const c=document.createElement('canvas');c.width=768;c.height=128;const g=c.getContext('2d');g.fillStyle='#fff7e8';g.fillRect(0,0,768,128);g.fillStyle='#334e70';g.font='bold 46px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,384,65,730);
   const tex=own(new T.CanvasTexture(c));tex.colorSpace=T.SRGBColorSpace;
   const m=new T.Mesh(own(new T.PlaneGeometry(5.6,.93)),own(new T.MeshBasicMaterial({map:tex,side:T.DoubleSide})));m.position.set(x,y,z);p.add(m);return m;
  };
  function island(parent,start,end,index){
   const mid=(start+end)/2,length=end-start;
   box(parent,deck,0,-.27,-mid,12,.54,length);
   // Continuous cliff surface, displaced once with recomputed normals; no coplanar shells.
   const rock=own(new T.CylinderGeometry(8,3.5,13,24,7)),positions=rock.attributes.position;
   for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const noise=1+.055*Math.sin(x*2.7+z*1.3+y*.8)+.035*Math.cos(y*3);
    positions.setXYZ(i,x*noise*.83,y,z*noise*length/17);
   }rock.computeVertexNormals();add(parent,rock,stone,0,-7,-mid);
   for(const side of[-1,1]){
    box(parent,bronze,side*5.9,.035,-mid,.16,.08,length);
    for(let d=start+2;d<end;d+=5){cyl(parent,steel,side*5.65,.55,-d,.09,1.1);cyl(parent,light,side*5.65,1.13,-d,.14,.12);}
    for(let i=0;i<4;i++){
     const d=start+2+i*(length-4)/4;const ledge=add(parent,cragGeo,stone,side*(6.1+(i%2)*.5), -2-i*.4,-d,2,2.4,2.8);ledge.rotation.y=i*1.3;
     const shard=add(parent,orbGeo,bronze,side*6.4,.2,-d,.5,1.5,.5);shard.rotation.z=side*.3;
    }
   }
   for(let d=start+2;d<end;d+=2.5)box(parent,stone,0,.006,-d,12,.012,.045);
  }
  // Batch repeated planks, bolts and lamps into GPU instances per island section.
  // Animated assemblies are batched in their own local coordinate systems.
  function batch(group,exclude=[]){
   group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),buckets=new Map();
   function visit(o){if(exclude.includes(o))return;if(o.isMesh){const key=o.geometry.uuid+o.material.uuid;const items=buckets.get(key)||[];items.push(o);buckets.set(key,items);}for(const child of o.children)visit(child);}
   for(const child of group.children)visit(child);
   for(const items of buckets.values())if(items.length>1){const first=items[0],instances=own(new T.InstancedMesh(first.geometry,first.material,items.length));instances.castShadow=true;instances.receiveShadow=true;
    items.forEach((m,i)=>{instances.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld));m.removeFromParent();});instances.computeBoundingSphere();group.add(instances);
   }
  }
  decorateRunner=runner=>{
   if(runner.relayLantern)return;
   const lantern=new T.Group();runner.model.add(lantern);lantern.position.set(.46,1.2,.2);
   box(lantern,bronze,0,0,0,.3,.07,.3);box(lantern,bronze,0,.48,0,.3,.07,.3);
   add(lantern,orbGeo,light,0,.23,0,.3,.45,.3);
   for(const x of[-.12,.12])for(const z of[-.12,.12])box(lantern,bronze,x,.24,z,.025,.48,.025);
   batch(lantern);runner.relayLantern=lantern;
  };
  // Distant suspended geology adds parallax and scale without walkable-looking scenery.
  const backdrop=new T.Group();view.world.add(backdrop);
  for(let i=0;i<18;i++){
   const side=i%2?1:-1,geo=own(new T.IcosahedronGeometry(1,2)),p=geo.attributes.position;
   for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j),n=1+.13*Math.sin(x*8+y*5+z*6);p.setXYZ(j,x*n,y*(y<0?2.7:.55)*n,z*n);}geo.computeVertexNormals();
   const rock=add(backdrop,geo,stone,side*(32+i%4*13),6+i%3*4,20-i*22,5+i%3,6+i%4,8+i%5);rock.rotation.y=i*.8;
  }
  for(let stage=0;stage<RELAY.stages;stage++){
   const root=new T.Group();root.position.z=-relayOffset(stage);view.world.add(root);
   island(root,-7,30,stage);island(root,44,74,stage);island(root,92,112,stage);
   const bridge=new T.Group();bridge.position.set(0,0,-30);root.add(bridge);
   box(bridge,wood,0,-.18,-7,5,.36,14);
   for(let d=0;d<14;d+=.8)box(bridge,bronze,0,.015,-d,5,.03,.06);
   for(const x of[-2.35,2.35]){box(bridge,steel,x,-.4,-7,.22,.4,14);for(let d=1;d<14;d+=3)cyl(bridge,bronze,x,.5,-d,.08,1);box(bridge,bronze,x,1,-7,.08,.08,14);}
   for(const x of[-3.1,3.1]){cyl(root,bronze,x,0,-30,.65,.7).rotation.z=Math.PI/2;box(root,steel,x,.6,-29,1,1.2,1.8);}
   const gate=new T.Group();gate.position.z=-58;root.add(gate);
   for(const x of[-5.9,5.9]){box(root,stone,x,3.7,-58,1,7.4,1.2);box(root,bronze,x,3.7,-57.3,.2,7.4,.2);}
   box(root,bronze,0,7.2,-58,12.8,.45,1.3);
   box(gate,steel,0,2.7,0,12,5.4,.55);
   for(let x=-5.4;x<=5.4;x+=1.2){box(gate,bronze,x,2.7,.32,.13,5.4,.09);for(const y of[.3,5.1])cyl(gate,bronze,x,y,.4,.09,.1).rotation.x=Math.PI/2;}
   box(root,wood,0,-.18,-83,3.4,.36,18);for(let d=75;d<92;d+=1)box(root,bronze,0,.025,-d,3.4,.05,.08);
   for(const x of[-1.63,1.63])box(root,light,x,.03,-83,.09,.06,18);
   const turbines=[];
   for(const d of[78,87]){
    cyl(root,steel,-6,1.7,-d,.22,4);const rotor=new T.Group();rotor.position.set(-6,3.5,-d);rotor.rotation.y=Math.PI/2;root.add(rotor);
    cyl(rotor,bronze,0,0,0,.36,.7).rotation.x=Math.PI/2;
    for(let i=0;i<3;i++){const blade=box(rotor,steel,0,1,0,.45,2,.15);const pivot=new T.Group();rotor.remove(blade);pivot.add(blade);pivot.rotation.z=i*Math.PI*2/3;rotor.add(pivot);}turbines.push(rotor);
   }
   for(const d of[18,102]){box(root,wood,0,.4,-d,12,.8,.6);for(let x=-5;x<6;x+=2)box(root,bronze,x,.45,-d+.32,.5,.6,.04);}
   const crystals=RELAY_CRYSTALS.map(o=>{const g=new T.Group();g.position.set(o.x,1.1,-o.d);root.add(g);add(g,orbGeo,light,0,0,0);const ring=add(g,rimGeo,bronze,0,0,0,.7,.7,.7);ring.rotation.x=Math.PI/2;return g;});
   const beacon=new T.Group();beacon.position.set(0,0,-109);root.add(beacon);
   cyl(beacon,bronze,0,.1,0,2,.2);cyl(beacon,light,0,.22,0,1.7,.1);
   const halo=add(beacon,rimGeo,light,0,3.5,0,1.7,1.7,1.7);
   add(beacon,orbGeo,light,0,3.5,0,1.1,1.8,1.1);
   const beamMat=own(new T.MeshBasicMaterial({color:0x99cbff,transparent:true,opacity:.12,depthWrite:false}));
   cyl(beacon,beamMat,0,5,0,1.5,10);
   // The Shaper's physical control desk anchors their role in the world.
   box(root,steel,-4.5,.6,-2,2.2,1.2,1);box(root,bronze,-4.5,1.25,-2,2.5,.16,1.4);
   for(let i=0;i<3;i++)cyl(root,light,-5.2+i*.7,1.39,-2,.17,.16);
   label(root,RELAY_NAMES[stage].toUpperCase(),-8,2,-7).scale.setScalar(.6);
   label(root,'01  BRIDGE · SHAPER LOWERS',0,4,-27);
   label(root,'02  GATE · SHAPER LIFTS',0,8,-58);
   label(root,'03  WIND · SHAPER STEADIES',0,4,-72);
   label(root,'TEAM BEACON · GATHER HERE',0,6,-109);
   const gusts=new T.Group();root.add(gusts);
   for(let i=0;i<14;i++)box(gusts,light,(i%4)*3-6,.8+(i%3)*.6,-76-(i%9)*1.7,.9,.035,.035);
   batch(bridge);batch(gate);for(const rotor of turbines)batch(rotor);
   batch(root,[bridge,gate,...turbines,...crystals,halo,gusts]);
   sections.push({stage,root,bridge,gate,turbines,crystals,halo,gusts});
  }
  view.snapCamera=true;view.resetCamera?.();
 };
 view.updateRelay=s=>state=s;
 view.render=args=>{
  if(active&&state){
   const {relay,clock}=state,focusZ=args.focus?.z||0;
   const sky=new T.Color(0xc4d8ed).lerp(new T.Color(0x8f9bbe),relay.tutorialDone?(1-relay.storm/RELAY.seconds)*.65:0);
   view.scene.background.copy(sky);view.scene.fog.color.copy(sky);view.sea.position.z=focusZ;
   for(const runner of view.runners.values()){decorateRunner?.(runner);const data=args.states.find(s=>view.runners.get(s.id)===runner);if(runner.relayLantern)runner.relayLantern.visible=data?.role==='runner';}
   for(const part of sections){
    part.root.visible=Math.abs(-relayOffset(part.stage)-56-focusZ)<185;
    const m=part.stage===relay.stage?relay.mechanisms:part.stage<relay.stage?{bridge:-99,gate:-99,wind:-99}:{bridge:null,gate:null,wind:null};
    part.bridge.rotation.x=(1-mechanismProgress(m,'bridge',clock))*Math.PI*.48;
    part.gate.position.y=mechanismProgress(m,'gate',clock)*6;
    const steady=mechanismProgress(m,'wind',clock);
    part.turbines.forEach(rotor=>rotor.rotation.z=clock*(steady>=1?1.1:5));
    part.gusts.visible=steady<1;part.gusts.children.forEach((g,i)=>g.position.x=((clock*6+i*1.7)%13)-6.5);
    part.crystals.forEach((g,i)=>{g.visible=part.stage>=relay.stage&&!(part.stage===relay.stage&&relay.collected.includes(i));g.rotation.y=clock;g.position.y=1.1+Math.sin(clock*2+i)*.15;});
    part.halo.rotation.y=clock*.5;
   }
  }
  render(args);
 };
}
