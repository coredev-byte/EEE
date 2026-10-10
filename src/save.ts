import { CLASSES, ITEMS, type ClassId } from "./data";
import { createPlayer, stats, type Player, type Quest } from "./state";
export const SAVE_KEY = "distrito-zero:v1";
export interface Save {
  version: 1;
  player: Player;
  quest: Quest;
  opened: string[];
  killed: number[];
  savedAt: number;
}
export function serialize(
  player: Player,
  quest: Quest,
  opened: string[],
  killed: number[],
): string {
  return JSON.stringify({
    version: 1,
    player,
    quest,
    opened,
    killed,
    savedAt: Date.now(),
  });
}
export function deserialize(raw: string | null): Save | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !s.player ||
      !Object.hasOwn(CLASSES, s.player.classId)
    )
      return null;
    const p = s.player;
    const base = createPlayer(p.classId as ClassId);
    if (
      !["x", "y", "hp", "mp", "level", "xp", "coins"].every((k) =>
        Number.isFinite(p[k]),
      ) ||
      p.level < 1 ||
      p.level > 1000 ||
      p.x < 1 ||
      p.x > 26 ||
      p.y < 1 ||
      p.y > 26 ||
      p.hp < 0 ||
      p.mp < 0 ||
      p.xp < 0 ||
      p.coins < 0
    )
      return null;
    if (
      !Array.isArray(p.inventory) ||
      !Array.isArray(p.potions) ||
      p.potions.length !== 3 ||
      p.potions.some(
        (n: unknown) => typeof n !== "number" || n < 0 || !Number.isInteger(n),
      )
    )
      return null;
    if (
      !Array.isArray(p.cooldowns) ||
      p.cooldowns.length !== 4 ||
      p.cooldowns.some(
        (n: unknown) => typeof n !== "number" || !Number.isFinite(n) || n < 0,
      )
    )
      return null;
    if (
      !p.equipment ||
      !["weapon", "armor", "accessory"].every(
        (k) =>
          p.equipment[k] === null ||
          ITEMS.some((i) => i.id === p.equipment[k] && i.slot === k),
      )
    )
      return null;
    if (
      !s.quest ||
      ![0, 1, 2].includes(s.quest.stage) ||
      !Number.isInteger(s.quest.kills) ||
      s.quest.kills < 0 ||
      typeof s.quest.rewardClaimed !== "boolean"
    )
      return null;
    if (
      !Array.isArray(s.opened) ||
      s.opened.some((v: unknown) => typeof v !== "string") ||
      !Array.isArray(s.killed) ||
      s.killed.some((v: unknown) => !Number.isInteger(v))
    )
      return null;
    if (
      !Number.isInteger(p.unlocked) ||
      p.unlocked < 2 ||
      p.unlocked > 4 ||
      !Number.isInteger(p.skillPoints) ||
      p.skillPoints < 0
    )
      return null;
    const player = {
      ...base,
      ...p,
      action: "idle",
      animTime: 0,
      attackTimer: 0,
      invulnerable: 1,
      guard: 0,
    };
    player.inventory = player.inventory.filter((id: string) =>
      ITEMS.some((i) => i.id === id),
    );
    player.hp = Math.min(player.hp, stats(player).maxHp);
    player.mp = Math.min(player.mp, stats(player).maxMp);
    return { ...s, player };
  } catch {
    return null;
  }
}
export function load(): Save | null {
  try {
    return deserialize(localStorage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}
