import * as T from './vendor/three.module.js';
import {terrainHeightAt} from './terrain.js';
import {normalizeCosmetics} from './cosmetics-data.js';
export function installCosmetics(view){
 const gold=new T.MeshStandardMaterial({color:0xffcd68,metalness:.65,roughness:.28}),blue=new T.MeshStandardMaterial({color:0x77e6f2,metalness:.5,roughness:.24}),glow=new T.MeshBasicMaterial({color:0x8cf9e5,transparent:true,opacity:.35,wireframe:true});
 const ball=new T.SphereGeometry(.055,8,6),shieldGeo=new T.SphereGeometry(1.1,16,12);
 const add=(group,geometry,material,pos)=>{const m=new T.Mesh(geometry,material);m.position.set(...pos);m.castShadow=true;group.add(m);return m;};
 const helmets=new T.SphereGeometry(.55,24,16,0,Math.PI*2,0,Math.PI*.66),visor=new T.SphereGeometry(.56,24,10,Math.PI*1.22,Math.PI*.56,Math.PI*.34,Math.PI*.25);
 const wingShape=new T.Shape();wingShape.moveTo(0,0);wingShape.lineTo(.95,.75);wingShape.lineTo(.7,-.2);wingShape.lineTo(.2,-.4);wingShape.closePath();const wingGeo=new T.ExtrudeGeometry(wingShape,{depth:.07,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.03,bevelThickness:.03});
 const visorMat=new T.MeshStandardMaterial({color:0x1f526a,metalness:.8,roughness:.15}),patchGeo=new T.BoxGeometry(.09,.65,.06);
 const trail=new T.InstancedMesh(ball,blue,72);trail.instanceMatrix.setUsage(T.DynamicDrawUsage);trail.frustumCulled=false;view.scene.add(trail);let head=0,acc=0;const crumbs=Array.from({length:72},()=>({life:0,pos:new T.Vector3()})),dummy=new T.Object3D();
 let state,fxTime=0;const render=view.render.bind(view);view.render=args=>{state=args;render(args);};
 const draw=view.renderer.render.bind(view.renderer);view.renderer.render=(scene,camera)=>{
  if(state){const {dt,t,lobby,focus}=state;fxTime+=dt;for(const s of state.states){const r=view.runners.get(s.id);if(!r)continue;const c=normalizeCosmetics(s.cosmetics),key=JSON.stringify(c);if(r.cosmeticKey!==key){if(r.cosmeticGroup)r.model.remove(r.cosmeticGroup);r.cosmeticGroup=new T.Group();r.model.add(r.cosmeticGroup);r.cosmeticKey=key;
    if(c.helmet){add(r.cosmeticGroup,helmets,gold,[0,2.4,0]);add(r.cosmeticGroup,visor,visorMat,[0,2.4,0]);}
    if(c.accessory)for(const side of[-1,1]){const wing=add(r.cosmeticGroup,wingGeo,blue,[side*.2,1.5,.45]);wing.scale.x=side;}
    if(c.look)for(const x of[-.2,.2])add(r.cosmeticGroup,patchGeo,c.look==='aurora'?blue:gold,[x,1.4,-.31]);
    if(c.effect)for(let i=0;i<12;i++){const m=add(r.cosmeticGroup,ball,gold,[Math.cos(i)*.7,1.4+Math.sin(i*.7),Math.sin(i)*.7]);m.userData.orbit=i;}
   }
   if(c.effect)for(const m of r.cosmeticGroup.children)if(m.userData.orbit!==undefined){const a=m.userData.orbit+t;m.position.x=Math.cos(a)*.75;m.position.z=Math.sin(a)*.75;}
   if(c.victory&&(s.finished||lobby)){r.model.rotation.y+=fxTime*2;r.model.position.y+=Math.abs(Math.sin(fxTime*2))*.25;}
   if(!r.shieldMesh){r.shieldMesh=new T.Mesh(shieldGeo,glow);r.shieldMesh.position.y=1.3;r.shieldMesh.scale.y=1.45;r.model.add(r.shieldMesh);}r.shieldMesh.visible=!!(s.invincible>0||s.shield);
  }
  acc+=dt;if(acc>.06){acc=0;for(const source of state.states){if(!source.cosmetics?.trail||(!lobby&&!(source.actualSpeed>0)))continue;const p=crumbs[head++%crumbs.length];p.life=1.4;p.pos.set(lobby?2+Math.sin(t*3)*.7:source.x,lobby?.3:source.y+terrainHeightAt(view.course,source.z)+.3,lobby?4+Math.cos(t*3)*.7:source.z);}}
  crumbs.forEach((p,i)=>{p.life=Math.max(0,p.life-dt);dummy.position.copy(p.pos);dummy.scale.setScalar(p.life>0?p.life*2:0);dummy.updateMatrix();trail.setMatrixAt(i,dummy.matrix);});trail.instanceMatrix.needsUpdate=true;
  }draw(scene,camera);
 };
}
