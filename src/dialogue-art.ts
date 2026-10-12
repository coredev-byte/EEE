import type { Game } from "./game";
/** One portrait renderer for ordinary conversations and the shared cinematic layer. */
export function dialoguePortrait(canvas: HTMLCanvasElement, speaker: string, g: Game) {
  const c = canvas.getContext("2d")!;
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.imageSmoothingEnabled = false;
  const name = speaker.toLocaleLowerCase("pt-BR");
  const draw = (id: string, x: number, y: number, w: number, h: number) => {
    const image = g.assets.images[id];
    if (image) c.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
  };
  if (name.includes("lenir")) draw("dialogue-reference", 214, 330, 202, 246);
  else if (name.includes("kharn")) draw("kharn", 115, 60 + ((g.enemies.find(e => e.id === 310)?.phase ?? 1)-1)*256, 170, 135);
  else if (name.includes("bizel")) draw("chapter-enemies", 22, 12, 52, 64);
  else if (name === "eco" || name.includes("protagonista"))
    draw(g.player.classId === "guerreiro" ? "hero" : g.player.classId, 24, 26, 48, 50);
  else if (/guardiã|iria|elcio|nara/.test(name)) draw("arcanista", 24, 26, 48, 50);
  else {
    c.strokeStyle = "#bd9454"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(canvas.width/2,20); c.lineTo(canvas.width-20,canvas.height/2);
    c.lineTo(canvas.width/2,canvas.height-20); c.lineTo(20,canvas.height/2); c.closePath(); c.stroke();
    c.fillStyle="#66cde2"; c.fillRect(canvas.width/2-4,canvas.height/2-4,8,8);
  }
}
