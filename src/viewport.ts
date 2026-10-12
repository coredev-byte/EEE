import { VIEW, type Point } from "./spatial";
export interface Viewport { width: number; height: number; focus: Point }
/** Base 960×540 at scale 1; other aspect ratios reveal more world, never stretch pixels. */
export function fitViewport(width: number, height: number) {
  const scale = Math.max(1, Math.floor(Math.min(width / VIEW.width, height / VIEW.height)));
  const logicalWidth = Math.max(1, Math.round(width / scale));
  const logicalHeight = Math.max(1, Math.round(height / scale));
  return { width: logicalWidth, height: logicalHeight, scale,
    focus: { x: logicalWidth / 2, y: logicalHeight / 2 + 15 } };
}
export function canvasViewport(canvas: Pick<HTMLCanvasElement, "width" | "height">): Viewport {
  return { width: canvas.width, height: canvas.height,
    focus: { x: canvas.width / 2, y: canvas.height / 2 + 15 } };
}
export function observeViewport(canvas: HTMLCanvasElement) {
  const resize = () => {
    const box = canvas.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    const view = fitViewport(box.width, box.height);
    if (canvas.width !== view.width || canvas.height !== view.height) {
      canvas.width = view.width; canvas.height = view.height;
    }
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas); resize();
  return () => observer.disconnect();
}
