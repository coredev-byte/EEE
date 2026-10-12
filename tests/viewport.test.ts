import { expect, it } from "vitest";
import { fitViewport } from "../src/viewport";
import { clientToScreen, iso, worldToScreen, screenToWorld } from "../src/spatial";
it.each([[960,540],[1920,1080],[1440,1000],[390,844],[1024,768]])("pixels quadrados e mira invertível em %dx%d",(width,height)=> {
 const v=fitViewport(width,height);expect(width/v.width).toBeCloseTo(height/v.height,2);
 expect(v.scale).toBeGreaterThanOrEqual(1);expect(Number.isInteger(v.scale)).toBe(true);
 const camera=iso({x:14,y:12}),p={x:16,y:9},screen=worldToScreen(p,camera,v);
 const client={x:screen.x*width/v.width,y:screen.y*height/v.height};
 const point=clientToScreen(client,{left:0,top:0,width,height},v);
 const world=screenToWorld(point,camera,v);expect(world.x).toBeCloseTo(p.x);expect(world.y).toBeCloseTo(p.y);
});
it("a referência 960×540 mantém câmera, resolução e escala",()=>expect(fitViewport(960,540)).toEqual({width:960,height:540,scale:1,focus:{x:480,y:285}}));
