import {
  CLASSES,
  ITEMS,
  type ClassId,
  type Direction,
  type Action,
  type Item,
} from "./data";
import type { Point } from "./world";
export interface Player extends Point {
  hp: number;
  mp: number;
  level: number;
  xp: number;
  coins: number;
  classId: ClassId;
  direction: Direction;
  action: Action;
  animTime: number;
  attackTimer: number;
  invulnerable: number;
  guard: number;
  cooldowns: number[];
  potions: number[];
  inventory: string[];
  equipment: Record<Item["slot"], string | null>;
  skillPoints: number;
  unlocked: number;
}
export interface Enemy extends Point {
  id: number;
  type: "bandit" | "wolf";
  hp: number;
  maxHp: number;
  state: "patrol" | "alert" | "chase" | "attack" | "recover" | "hurt" | "dead";
  timer: number;
  home: Point;
  direction: Direction;
  animTime: number;
  attackHit: boolean;
  rewarded: boolean;
}
export interface Effect extends Point {
  kind: "slash" | "nova" | "impact" | "heal" | "death" | "dash";
  time: number;
  duration: number;
  angle: number;
  color: string;
  range: number;
}
export interface Projectile extends Point {
  vx: number;
  vy: number;
  damage: number;
  range: number;
  traveled: number;
  color: string;
}
export interface DamageText extends Point {
  text: string;
  color: string;
  time: number;
}
export interface Quest {
  stage: 0 | 1 | 2;
  kills: number;
  rewardClaimed: boolean;
}
export interface Stats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  xpGoal: number;
}
export function createPlayer(classId: ClassId = "guerreiro"): Player {
  return {
    x: 12,
    y: 12,
    hp: CLASSES[classId].hp,
    mp: 120,
    level: 1,
    xp: 0,
    coins: 125,
    classId,
    direction: "front",
    action: "idle",
    animTime: 0,
    attackTimer: 0,
    invulnerable: 0,
    guard: 0,
    cooldowns: [0, 0, 0, 0],
    potions: [3, 3, 2],
    inventory: ["ferro", "casaco", "brasa", "raio"],
    equipment: { weapon: "ferro", armor: "casaco", accessory: null },
    skillPoints: 0,
    unlocked: 2,
  };
}
export function stats(p: Player): Stats {
  const c = CLASSES[p.classId];
  const items = Object.values(p.equipment)
    .map((id) => ITEMS.find((i) => i.id === id))
    .filter((i): i is Item => !!i);
  return {
    maxHp: c.hp + (p.level - 1) * 18 + items.reduce((s, i) => s + i.hp, 0),
    maxMp: 120 + (p.level - 1) * 8,
    attack:
      c.damage + (p.level - 1) * 3 + items.reduce((s, i) => s + i.attack, 0),
    defense: items.reduce((s, i) => s + i.defense, 0),
    speed: c.speed,
    xpGoal: 100 + p.level * 50,
  };
}
export function gainXp(p: Player, value: number) {
  p.xp += value;
  let levels = 0;
  while (p.xp >= stats(p).xpGoal) {
    p.xp -= stats(p).xpGoal;
    p.level++;
    p.skillPoints++;
    levels++;
    p.hp = stats(p).maxHp;
    p.mp = stats(p).maxMp;
  }
  return levels;
}
export function equip(p: Player, id: string | null, slot?: Item["slot"]) {
  if (id === null && slot) {
    p.equipment[slot] = null;
    p.hp = Math.min(p.hp, stats(p).maxHp);
    return true;
  }
  const item = ITEMS.find((i) => i.id === id);
  if (!item || !p.inventory.includes(item.id)) return false;
  p.equipment[item.slot] = item.id;
  p.hp = Math.min(p.hp, stats(p).maxHp);
  return true;
}
export function createEnemies(): Enemy[] {
  return [
    [15, 12, "bandit"],
    [13, 16, "wolf"],
    [17, 14, "bandit"],
    [19, 9, "wolf"],
    [22, 10, "bandit"],
    [20, 7, "bandit"],
    [16, 17, "wolf"],
    [9, 9, "bandit"],
    [23, 12, "wolf"],
  ].map(([x, y, type], id) => ({
    id,
    x: Number(x),
    y: Number(y),
    home: { x: Number(x), y: Number(y) },
    type: type as Enemy["type"],
    hp: type === "wolf" ? 75 : 100,
    maxHp: type === "wolf" ? 75 : 100,
    state: "patrol",
    timer: 0,
    direction: "front",
    animTime: 0,
    attackHit: false,
    rewarded: false,
  }));
}
