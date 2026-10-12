import { iso, type Point } from "./spatial";
import type { World } from "./world";
import type { Assets } from "./assets";
/** Stone islands, suspended masonry and the engraved circles in the uploaded map. */
export function paintRuinsFloor(c: CanvasRenderingContext2D, world: World, assets: Assets, origin: number, offset: number) {
  const at = (p: Point) => { const s=iso(p);return {x:s.x+origin,y:s.y+offset}; };
  c.fillStyle="#030611"; c.fillRect(0,0,c.canvas.width,c.canvas.height);
  // The abyss has no walkable grid. Dim violet mist sits beneath the islands.
  for (let i=0;i<30;i++) {
    const x=(i*281+170)%c.canvas.width,y=(i*197+90)%c.canvas.height;
    const glow=c.createRadialGradient(x,y,0,x,y,125);
    glow.addColorStop(0,"rgba(58,28,126,.24)");glow.addColorStop(1,"rgba(12,7,30,0)");
    c.fillStyle=glow;c.fillRect(x-125,y-125,250,250);
  }
  const floor=(x:number,y:number)=>world.tile(x,y)!==7 && x>=0 && y>=0 && x<world.size && y<world.size;
  const polygon=(points:Point[],color:string)=> {c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();};
  for (let depth=0;depth<world.size*2;depth++) for(let x=0;x<world.size;x++) {
    const y=depth-x;if(y<0 || y>=world.size || !floor(x,y)) continue;
    const top=at({x:x+.5,y:y+.5}),height=65+((x*7+y*3)%4)*9;
    for(const edge of [0,1]) {
      if(edge===0?floor(x+1,y):floor(x,y+1))continue;
      const a=at(edge===0?{x:x+1,y}:{x,y:y+1}),b=at({x:x+1,y:y+1});
      polygon([a,b,{x:b.x,y:b.y+height},{x:a.x,y:a.y+height}],edge===0?"#131629":"#0b1021");
      c.save(); c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y); c.lineTo(b.x,b.y+height); c.lineTo(a.x,a.y+height); c.closePath(); c.clip();
      c.globalAlpha=.52;
      for(let h=0;h<height+20;h+=28) c.drawImage(assets.images["ruin-props"],4*128+38,105,52,32,Math.min(a.x,b.x),Math.min(a.y,b.y)+h,Math.abs(b.x-a.x),35);
      c.restore();
      c.strokeStyle="#34314f";c.lineWidth=1;
      for(let h=9;h<height;h+=11) {c.beginPath();c.moveTo(a.x,a.y+h);c.lineTo(b.x,b.y+h);c.stroke();}
      for(let n=1;n<4;n++){const t=n/4,px=a.x+(b.x-a.x)*t,py=a.y+(b.y-a.y)*t;c.strokeStyle=n%2?"#24253c":"#101528";c.beginPath();c.moveTo(px,py+9);c.lineTo(px,py+height-4);c.stroke();}
      c.fillStyle="#4676a5";for(let n=0;n<4;n++)c.fillRect(Math.round(a.x+(b.x-a.x)*n/4),Math.round(a.y+(b.y-a.y)*n/4+height-5),2,5);
    }
    c.drawImage(assets.images.tiles,160,0,80,40,top.x-40,top.y-20,80,40);
    polygon([{x:top.x,y:top.y-20},{x:top.x+40,y:top.y},{x:top.x,y:top.y+20},{x:top.x-40,y:top.y}],"rgba(36,26,70,.28)");
    c.strokeStyle=((x+y)%4===0)?"#776744":"#363044";c.lineWidth=1;
    c.beginPath();c.moveTo(top.x-39,top.y);c.lineTo(top.x,top.y+19);c.lineTo(top.x+39,top.y);c.stroke();
  }
  const circle=(p:Point,r:number,color:string,star=false)=> {
    const center=at(p);c.strokeStyle=color;c.lineWidth=1.5;
    for(const k of [1,.9,.69]) {c.beginPath();c.ellipse(center.x,center.y,r*40*k,r*20*k,0,0,Math.PI*2);c.stroke();}
    for(let i=0;i<16;i++) {const a=i*Math.PI/8;const u={x:center.x+Math.cos(a)*r*38,y:center.y+Math.sin(a)*r*19};c.fillStyle=color;c.fillRect(Math.round(u.x)-1,Math.round(u.y)-1,3,2);}
    if(star){c.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,rr=i%2?r*.27:r*.62;const q={x:center.x+Math.cos(a)*rr*40,y:center.y+Math.sin(a)*rr*20};i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);}c.closePath();c.stroke();}
  };
  circle({x:14,y:5},2.65,"#b8934c",true);
  circle({x:14,y:15.5},2.5,"#635bb1",true);
  circle({x:4.8,y:19.5},2.05,"#9473cf",true);
  circle({x:23,y:14.8},1.6,"#9570bc",true);
  circle({x:14,y:23.3},1.45,"#b8934c",true);
  // Physical corridor tiles carry stair treads; their tops remain walkable.
  for(const [x,y] of [[14,10.5],[14,18.5],[8.5,20.5],[19.5,14.5],[14,25.5]]) {
    const q=at({x,y});for(let i=-3;i<=3;i++) {const yy=q.y+i*4;c.strokeStyle=i%2?"#747082":"#26243d";c.beginPath();c.moveTo(q.x-34,yy-14);c.lineTo(q.x+34,yy+14);c.stroke();}
  }
}
