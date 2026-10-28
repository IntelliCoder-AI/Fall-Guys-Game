import * as T from './vendor/three.module.js';
import {terrainHeightAt} from './terrain.js';

// One camera rig is shared by the lobby, wardrobe and live race.
export function enhanceExperience(view){
 if(!view.renderer)return;
 const canvas=view.renderer.domElement;
 const orbit={yaw:0,pitch:.32,zoom:1,active:false,drag:null};
 const smooth={yaw:0,pitch:.32,zoom:1};
 const reset=()=>{orbit.yaw=0;orbit.pitch=.32;orbit.zoom=1;orbit.active=false;};
 view.cameraInput=orbit;
 const allowed=e=>e.target===canvas;
 const outsideWardrobe=e=>view.customizing&&e.target.tagName==='DIALOG'&&(()=>{const r=e.target.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom})();
 document.addEventListener('pointerdown',e=>{if(e.button!==0||(!allowed(e)&&!outsideWardrobe(e)))return;orbit.drag={x:e.clientX,y:e.clientY,id:e.pointerId};orbit.active=true;e.target.setPointerCapture?.(e.pointerId);e.preventDefault();});
 document.addEventListener('pointermove',e=>{if(!orbit.drag||e.pointerId!==orbit.drag.id)return;orbit.yaw-=(e.clientX-orbit.drag.x)*.007;orbit.pitch+=(e.clientY-orbit.drag.y)*.007;orbit.drag.x=e.clientX;orbit.drag.y=e.clientY;e.preventDefault();});
 const release=()=>orbit.drag=null;document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);window.addEventListener('blur',release);
 document.addEventListener('wheel',e=>{if(!allowed(e)&&!outsideWardrobe(e))return;orbit.active=true;orbit.zoom=T.MathUtils.clamp(orbit.zoom*Math.exp(e.deltaY*.001),.4,2.5);e.preventDefault();},{passive:false});
 canvas.addEventListener('dblclick',reset);canvas.style.touchAction='none';
 window.addEventListener('keydown',e=>{if(e.code==='KeyC'&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))reset();});
 let state=null,lastLobby=null;
 const render=view.render.bind(view);view.render=args=>{state=args;if(lastLobby!==args.lobby){reset();lastLobby=args.lobby;}render(args);};
 const draw=view.renderer.render.bind(view.renderer);
 view.renderer.render=(scene,camera)=>{
  if(state){const {lobby,focus,dt}=state;const weight=1-Math.exp(-dt*12);for(const k of ['yaw','pitch','zoom'])smooth[k]+=(orbit[k]-smooth[k])*weight;
   for(const r of view.runners.values()){
    const parts=[...r.arms,...r.legs];r.pose??=parts.map(p=>p.rotation.x);
    parts.forEach((p,i)=>{r.pose[i]+=(p.rotation.x-r.pose[i])*(1-Math.exp(-dt*18));p.rotation.x=r.pose[i];});
    if(lobby){r.torso.scale.y=1+Math.sin(performance.now()*.0018)*.012;}
   }
   if(lobby||orbit.active){
    const target=lobby?new T.Vector3(2,1.65,4):new T.Vector3(focus.x,focus.y+terrainHeightAt(view.course,focus.z)+1.3,focus.z);
    const radius=(lobby?8:12)*smooth.zoom,pitch=smooth.pitch,yaw=smooth.yaw;
    camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*radius,target.y+Math.sin(pitch)*radius,target.z+Math.cos(yaw)*Math.cos(pitch)*radius);
    // Flip the up vector after passing a pole: a full vertical orbit remains stable.
    camera.up.set(0,Math.cos(pitch)>=0?1:-1,0);camera.lookAt(target);
    if(lobby&&view.customizing&&innerWidth>700){camera.setViewOffset(innerWidth,innerHeight,innerWidth*.2,0,innerWidth,innerHeight);}else if(lobby&&innerWidth>700){camera.setViewOffset(innerWidth,innerHeight,-innerWidth*.16,0,innerWidth,innerHeight);}else if(lobby&&innerWidth<=700){camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.25,innerWidth,innerHeight);}else camera.clearViewOffset();
   }else {camera.up.set(0,1,0);camera.clearViewOffset();}
  }
  draw(scene,camera);
 };
 // Fine fabric grain gives clothes a material surface at close inspection.
 const fabricCanvas=document.createElement('canvas');fabricCanvas.width=fabricCanvas.height=128;const ctx=fabricCanvas.getContext('2d');
 const pixels=ctx.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,v=190+((x%3===0||y%3===0)?35:0);pixels.data.set([v,v,v,255],i);}ctx.putImageData(pixels,0,0);
 const fabric=new T.CanvasTexture(fabricCanvas);fabric.wrapS=fabric.wrapT=T.RepeatWrapping;fabric.repeat.set(5,5);
 const mountain=new T.ConeGeometry(1,1,48,20);const vertices=mountain.attributes.position;
 for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),a=Math.atan2(z,x);const ridges=1+.13*Math.sin(a*5+y*8)+.07*Math.cos(a*11-y*13);vertices.setXYZ(i,x*ridges,y,z*ridges);}mountain.computeVertexNormals();
 const chunk=view.buildChunk.bind(view);view.buildChunk=index=>{const part=chunk(index);part.root.traverse(m=>{if(!m.isMesh)return;if(m.geometry.type==='ConeGeometry'&&m.geometry.parameters.radius===1){m.geometry=mountain;m.material.bumpMap=fabric;m.material.bumpScale=.07;m.material.roughness=1;}if(m.material.isMeshStandardMaterial&&m.material.color.getHex()===view.course.theme.track){m.material.bumpMap=fabric;m.material.bumpScale=.025;m.material.roughness=.88;}});return part;};
 // Rebuild the visible scenery once; subsequent chunks inherit the same detail.
 view.load(view.level);
 const releaseMaterials=r=>r?.model.traverse(m=>{if(m.userData.runnerMaterial)m.material.dispose();if(m.userData.runnerGeometry)m.geometry.dispose();});
 const clear=view.clearRunners.bind(view);view.clearRunners=()=>{for(const r of view.runners.values())releaseMaterials(r);clear();};
 const original=view.setRunner.bind(view);view.setRunner=(...args)=>{const previous=view.runners.get(args[0]);const r=original(...args);if(previous&&previous!==r)releaseMaterials(previous);if(r.detailed)return r;r.detailed=true;
  // Tailored torso silhouette with waist, rib cage and shoulders.
  const contour=[[.23,-.36],[.28,-.33],[.30,-.22],[.29,-.05],[.33,.14],[.36,.25],[.29,.34],[.18,.39]];
  r.torso.geometry=new T.LatheGeometry(contour.map(([x,y])=>new T.Vector2(x,y)),40);r.torso.geometry.computeVertexNormals();r.torso.userData.runnerGeometry=true;
  r.model.traverse(m=>{if(!m.isMesh||!m.material.isMeshStandardMaterial)return;const color=m.material.color;const own=m.material.clone();own.roughness=.76;own.envMapIntensity=.6;
   if(color.b>color.r*.7||color.r>color.g*1.5){own.bumpMap=fabric;own.bumpScale=.025;own.roughnessMap=fabric;}
   m.material=own;m.userData.runnerMaterial=true;
  });
  // Articulated elbows, knees and shoe soles retain the modular outfits.
  for(const limb of r.legs){const seam=new T.Mesh(new T.TorusGeometry(.145,.012,6,20),new T.MeshStandardMaterial({color:0x617585,roughness:1}));seam.rotation.x=Math.PI/2;seam.position.y=-.27;seam.userData.runnerMaterial=true;seam.userData.runnerGeometry=true;limb.add(seam);}
  return r;
 };
 const rim=new T.DirectionalLight(0x9acbff,1.4);rim.position.set(12,9,-10);view.scene.add(rim);
 const fill=new T.DirectionalLight(0xffd7b0,.65);fill.position.set(-8,6,8);view.scene.add(fill);
 const previousRender=view.render.bind(view);view.render=args=>{const z=args.lobby?0:args.focus.z;rim.position.z=z-10;fill.position.z=z+8;previousRender(args);};
}
