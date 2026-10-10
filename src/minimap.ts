import { edgeIndicator, objectiveIcon, type Objective } from "./objectives";
import type { Point } from "./spatial";
import { REGIONS, ANCHORS, type Exploration } from "./regions";
import { has } from "./skills";
import { minimapPoint } from "./spatial";
import { distance, PORTAL, type World } from "./world";
import type { Enemy, Player } from "./state";
/** HUD renderer: shares world positions, never world-camera transforms. */
export function drawMinimap(
  canvas: HTMLCanvasElement,
  world: World,
  player: Player,
  enemies: Enemy[],
  exploration?: Exploration,
  objective: Objective | Point | null = PORTAL,
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
  const discovered = exploration
    ? new Set(exploration.regions[world.region].discovered)
    : null;
  for (let y = 0; y < world.size; y++)
    for (let x = 0; x < world.size; x++) {
      if (discovered && !discovered.has(`${x}:${y}`)) continue;
      const tile = world.tile(x, y);
      ctx.fillStyle =
        tile < 3
          ? "#3c4555"
          : tile === 6
            ? "#353146"
            : tile === 7
              ? "#173848"
              : "#182d2b";
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
    if (
      discovered &&
      !discovered.has(`${Math.floor(prop.x)}:${Math.floor(prop.y)}`) &&
      prop.kind !== "portal"
    )
      continue;
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
    if (
      enemy.hp > 0 &&
      (enemy.statusKinds?.includes("mark") ||
        distance(enemy, player) <
          (player.classId === "atirador" && has(player, 2, 1) ? 12 : 6))
    )
      marker(enemy, 3, "#d76475");
  marker(REGIONS[world.region].connection, 6, "#70c8d4");
  if (world.region === "kharn")
    for (const a of ANCHORS)
      marker(
        a,
        4,
        exploration?.campaign.attuned.includes(a.id) ? "#80c393" : "#a48ac8",
      );
  if (objective) {
    const raw = point(objective),
      goal = edgeIndicator(raw, canvas.width, canvas.height, {
        left: padding,
        right: padding,
        top: padding,
        bottom: padding,
      });
    ctx.save();
    ctx.translate(Math.round(goal.x), Math.round(goal.y));
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = "#e8bd68";
    ctx.lineWidth = 2;
    ctx.strokeRect(-4, -4, 8, 8);
    ctx.restore();
    if ("kind" in objective)
      objectiveIcon(ctx, objective.kind, goal.x, goal.y, 5);
    if (goal.outside) {
      ctx.save();
      ctx.translate(goal.x, goal.y);
      ctx.rotate(goal.angle);
      ctx.fillStyle = "#e8bd68";
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(1, -3);
      ctx.lineTo(1, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  const at = point(player);
  const vectors = {
    front: [1, 1],
    back: [-1, -1],
    left: [-1, 1],
    right: [1, -1],
  };
  const [dx, dy] = vectors[player.direction];
  ctx.save();
  ctx.translate(Math.round(at.x), Math.round(at.y));
  ctx.rotate(Math.atan2(dy * cellY, dx * cellX));
  ctx.fillStyle = "#e9edf6";
  ctx.strokeStyle = "#090f19";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(-3, -3);
  ctx.lineTo(-1, 0);
  ctx.lineTo(-3, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
