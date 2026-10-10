/** Reusable nearest-neighbor surface; tint retains the atlas's alpha and pixel detail. */
let surface: HTMLCanvasElement | undefined;
export function effectFrame(
  atlas: HTMLImageElement,
  row: number,
  col: number,
  color?: string,
) {
  surface ??= document.createElement("canvas");
  surface.width = 128;
  surface.height = 128;
  const c = surface.getContext("2d")!;
  c.imageSmoothingEnabled = false;
  c.drawImage(atlas, col * 128, row * 128, 128, 128, 0, 0, 128, 128);
  if (color) {
    c.globalCompositeOperation = "source-atop";
    c.globalAlpha = 0.6;
    c.fillStyle = color;
    c.fillRect(0, 0, 128, 128);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
  }
  return surface;
}
