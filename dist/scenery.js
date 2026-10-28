import * as T from './vendor/three.module.js';
// The bundled ConeGeometry skips one triangle of every side quad when the
// top radius is zero, including non-apex rings. A lathed closed profile avoids
// those holes without changing normals, materials, shadows or quality settings.
export function mountainGeometry(){
 const points=[new T.Vector2(0,-.5)];
 for(let i=0;i<=20;i++)points.push(new T.Vector2(1-i/20,i/20-.5));
 const g=new T.LatheGeometry(points,48),v=g.attributes.position;
 for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i),z=v.getZ(i),a=Math.atan2(z,x),ridge=1+.13*Math.sin(a*5+y*8)+.07*Math.cos(a*11-y*13);v.setXYZ(i,x*ridge,y,z*ridge);}
 g.computeVertexNormals();return g;
}
