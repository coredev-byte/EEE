import { paintHudIcon } from "./hud-icons";
import { edgeIndicator, type Objective } from "./objectives";
import type { Point } from "./spatial";
import { REGIONS, ANCHORS, type Exploration } from "./regions";
import { has } from "./skills";
import { minimapPoint, minimapPadding } from "./spatial";
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
  circular = false,
) {
  const ctx = canvas.getContext("2d")!;
  const padding = minimapPadding(canvas.width, canvas.height, circular),
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
  if (circular) {
    ctx.strokeStyle = "#263344";
    ctx.lineWidth = 1;
    for (const radius of [canvas.width * 0.43, canvas.width * 0.32]) {
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.fillStyle = i % 2 ? "#4b4540" : "#8d7151";
      ctx.fillRect(
        Math.round(canvas.width / 2 + Math.cos(a) * (canvas.width / 2 - 12)) -
          1,
        Math.round(canvas.height / 2 + Math.sin(a) * (canvas.height / 2 - 12)) -
          1,
        3,
        3,
      );
    }
  }
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
    ) {
      const at = point(enemy);
      paintHudIcon(ctx, "enemy", at.x, at.y, 8);
    }
  const passage = point(REGIONS[world.region].connection);
  paintHudIcon(ctx, "exit", passage.x, passage.y, 10);
  if (world.region === "kharn")
    for (const a of ANCHORS) {
      const at = point(a);
      if (exploration?.campaign.attuned.includes(a.id)) marker(a, 4, "#80c393");
      else paintHudIcon(ctx, "xp", at.x, at.y, 8);
    }
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
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    paintHudIcon(ctx, "main", goal.x, goal.y, 9);
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
  ctx.fillStyle = "#35bddb";
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
