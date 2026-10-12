import { framePivot } from "./spatial";
export class Assets {
  images: Record<string, HTMLImageElement> = {};
  async load() {
    await Promise.all(
      Object.entries({
        hero: "characters/hero.png",
        arcanista: "characters/arcanista.png",
        assassino: "characters/assassino.png",
        atirador: "characters/atirador.png",
        "arcanista-directions": "characters/arcanista-directions.png",
        "assassino-directions": "characters/assassino-directions.png",
        "atirador-directions": "characters/atirador-directions.png",
        enemies: "enemies/enemies.png",
        props: "scenery/props.png",
        tiles: "scenery/tiles.png",
        icons: "icons/icons.png",
        effects: "effects/effects.png",
        objects: "objects/objects.png",
        "reference-portrait": "interface/MISSOES.PNG",
        "arcanista-combat": "characters/arcanista-combat.png",
        "assassino-combat": "characters/assassino-combat.png",
        "atirador-combat": "characters/atirador-combat.png",
      }).map(async ([name, path]) => {
        const im = new Image();
        im.src = `/assets/${path}`;
        await im.decode();
        this.images[name] = im;
      }),
    );
  }
  draw(
    ctx: CanvasRenderingContext2D,
    name: string,
    col: number,
    row: number,
    cw: number,
    ch: number,
    x: number,
    y: number,
    scale = 1,
    flip = false,
  ) {
    const im = this.images[name];
    if (!im) return;
    const pivot = framePivot(cw, ch);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(
      im,
      col * cw,
      row * ch,
      cw,
      ch,
      Math.round(-pivot.x * scale),
      Math.round(-pivot.y * scale),
      Math.round(cw * scale),
      Math.round(ch * scale),
    );
    ctx.restore();
  }
  icon(
    ctx: CanvasRenderingContext2D,
    index: number,
    x: number,
    y: number,
    size = 32,
  ) {
    ctx.drawImage(
      this.images.icons,
      index * 48,
      0,
      48,
      48,
      Math.round(x),
      Math.round(y),
      size,
      size,
    );
  }
}
