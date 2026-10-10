import { minimapPoint } from "./spatial";
import { distance, PORTAL, type World } from "./world";
import type { Enemy, Player } from "./state";
/** HUD renderer: shares world positions, never world-camera transforms. */
export function drawMinimap(
  canvas: HTMLCanvasElement,
  world: World,
  player: Player,
  enemies: Enemy[],
) {
  const ctx = canvas.getContext("2d")!;
  const padding = 7,
    cellX = (canvas.width - padding * 2) / world.size,
    cellY = (canvas.height - padding * 2) / world.size;
  const point = (p: { x: number; y: number }) =>
    minimapPoint(p, world.size, canvas.width, canvas.height, padding);
  const marker = (p: { x: number; y: number }, size: number, color: string) => {
    const at = point(p);
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(at.x - size / 2),
      Math.round(at.y - size / 2),
      size,
      size,
    );
  };
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#090f19";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < world.size; y++)
    for (let x = 0; x < world.size; x++) {
      const tile = world.tile(x, y);
      ctx.fillStyle = tile < 3 ? "#3c4555" : tile === 6 ? "#353146" : "#182d2b";
      const x0 = Math.round(padding + x * cellX),
        y0 = Math.round(padding + y * cellY);
      ctx.fillRect(
        x0,
        y0,
        Math.round(padding + (x + 1) * cellX) - x0,
        Math.round(padding + (y + 1) * cellY) - y0,
      );
    }
  for (const prop of world.props) {
    const color =
      prop.kind === "portal"
        ? "#b886de"
        : prop.kind === "npc"
          ? "#c9d5db"
          : prop.kind === "chest" && !prop.opened
            ? "#cb9c52"
            : prop.solid
              ? "#101925"
              : null;
    if (color) marker(prop, 4, color);
  }
  for (const enemy of enemies)
    if (enemy.hp > 0 && distance(enemy, player) < 6)
      marker(enemy, 3, "#d76475");
  const goal = point(PORTAL);
  ctx.save();
  ctx.translate(Math.round(goal.x), Math.round(goal.y));
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = "#e8bd68";
  ctx.strokeRect(-3, -3, 6, 6);
  ctx.restore();
  marker(player, 4, "#e9edf6");
}
