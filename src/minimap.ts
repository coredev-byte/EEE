import { paintHudIcon } from "./hud-icons";
import { edgeIndicator, type Objective } from "./objectives";
import type { Point } from "./spatial";
import {
  REGIONS,
  ANCHORS,
  PASSAGES,
  passageKey,
  passageOpen,
  type Exploration,
} from "./regions";
import { has } from "./skills";
import { minimapPoint, minimapIsoPoint, minimapPadding } from "./spatial";
import type { Assets } from "./assets";
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
  isometric = false,
  assets?: Assets,
) {
  const ctx = canvas.getContext("2d")!;
  const padding = minimapPadding(canvas.width, canvas.height, circular),
    cellX = (canvas.width - padding * 2) / world.size / (isometric ? 2 : 1),
    cellY = (canvas.height - padding * 2) / world.size / (isometric ? 2 : 1);
  const point = (p: { x: number; y: number }) =>
    isometric ? minimapIsoPoint(p, world.size, canvas.width, canvas.height, padding)
      : minimapPoint(p, world.size, canvas.width, canvas.height, padding);
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
      if (isometric) {
        const at = point({ x, y });
        ctx.beginPath();
        ctx.moveTo(at.x, at.y - cellY);
        ctx.lineTo(at.x + cellX, at.y);
        ctx.lineTo(at.x, at.y + cellY);
        ctx.lineTo(at.x - cellX, at.y);
        ctx.closePath();
        ctx.fill();
        continue;
      }
      const x0 = Math.round(padding + x * cellX),
        y0 = Math.round(padding + y * cellY);
      ctx.fillRect(
        x0,
        y0,
        Math.round(padding + (x + 1) * cellX) - x0,
        Math.round(padding + (y + 1) * cellY) - y0,
      );
    }
  for (const prop of [...world.props].sort((a, b) => a.x + a.y - b.x - b.y)) {
    const passage = PASSAGES.find(
      (p) => p.region === world.region && p.id === prop.id,
    );
    if (
      passage?.requirement === "memories" &&
      exploration &&
      !exploration.knownPassages.includes(passageKey(passage))
    )
      continue;
    if (
      discovered &&
      !discovered.has(`${Math.floor(prop.x)}:${Math.floor(prop.y)}`) &&
      prop.kind !== "portal"
    )
      continue;
    if (isometric && assets) {
      const columns: Record<string, number> = { house: 0, ruinHouse: 1, portal: 2, wall: 3, tree: 4, deadTree: 5, pine: 6, rock: 7, lantern: 8, barrel: 9, crate: 10, chest: 11 };
      if (prop.kind in columns) {
        const at = point(prop);
        assets.draw(ctx, "props", columns[prop.kind], 0, 128, 160, at.x, at.y, prop.scale * cellX / 40);
      }
    }
    const color =
      prop.kind === "portal"
        ? prop.locked
          ? "#b76c43"
          : "#51caa0"
        : prop.kind === "npc"
          ? "#c9d5db"
          : prop.kind === "chest" && !prop.opened
            ? "#cb9c52"
            : prop.solid
              ? "#101925"
              : null;
    if (color) marker(prop, 4, color);
    if (prop.interaction && prop.kind !== "npc" && !prop.opened) {
      const at = point(prop);
      paintHudIcon(ctx, "xp", at.x, at.y, 6);
    }
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
  for (const p of PASSAGES.filter((p) => p.region === world.region)) {
    if (
      p.requirement === "memories" &&
      exploration &&
      !exploration.knownPassages.includes(passageKey(p))
    )
      continue;
    const at = point(p);
    paintHudIcon(
      ctx,
      exploration &&
        !passageOpen(
          p,
          exploration,
          exploration.unlocked.includes(passageKey(p)),
        )
        ? "secondary"
        : "exit",
      at.x,
      at.y,
      10,
    );
  }
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
    paintHudIcon(
      ctx,
      "category" in objective && objective.category === "secondary"
        ? "secondary"
        : "main",
      goal.x,
      goal.y,
      9,
    );
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
  ctx.rotate(Math.atan2((isometric ? dx + dy : dy) * cellY, (isometric ? dx - dy : dx) * cellX));
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
