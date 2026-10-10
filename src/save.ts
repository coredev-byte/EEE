import { freshProfiles, syncPoints, validBuild, type Profiles } from "./skills";
import { playableBounds } from "./spatial";
import { CLASSES, ITEMS, DIRS, MAP_SIZE, type ClassId } from "./data";
import { createPlayer, stats, type Player, type Quest } from "./state";
export const SAVE_KEY = "distrito-zero:v1";
export interface Save {
  version: 2;
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
    version: 2,
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
      ![1, 2].includes(s.version) ||
      !s.player ||
      !Object.hasOwn(CLASSES, s.player.classId)
    )
      return null;
    const p = s.player;
    const bounds = playableBounds(MAP_SIZE);
    const base = createPlayer(p.classId as ClassId);
    if (
      !["x", "y", "hp", "mp", "level", "xp", "coins"].every((k) =>
        Number.isFinite(p[k]),
      ) ||
      p.level < 1 ||
      p.level > 1000 ||
      !Number.isInteger(p.level) ||
      p.x < bounds.min ||
      p.x > bounds.max ||
      p.y < bounds.min ||
      p.y > bounds.max ||
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
      p.unlocked < (s.version === 1 ? 2 : 0) ||
      p.unlocked > 4 ||
      !Number.isInteger(p.skillPoints) ||
      p.skillPoints < 0
    )
      return null;
    const trees = s.version === 1 ? freshProfiles() : p.trees;
    if (s.version === 2) {
      if (
        p.level > 60 ||
        !trees ||
        !Object.keys(CLASSES).every((id) => {
          const b = trees[id];
          return (
            validBuild(b, id as ClassId, p.level) &&
            Array.isArray(b.presets) &&
            b.presets.length === 3 &&
            b.presets.every(
              (x: unknown) =>
                x === null || validBuild(x as never, id as ClassId, p.level),
            )
          );
        })
      )
        return null;
      if (
        !p.challenges ||
        !Number.isInteger(p.challenges.kills) ||
        p.challenges.kills < 0 ||
        !Number.isInteger(p.challenges.chests) ||
        p.challenges.chests < 0 ||
        typeof p.challenges.seal !== "boolean"
      )
        return null;
      if (
        !p.skillCooldowns ||
        Object.values(p.skillCooldowns).some(
          (v: unknown) => typeof v !== "number" || !Number.isFinite(v) || v < 0,
        )
      )
        return null;
      if (
        !Number.isFinite(p.resource) ||
        p.resource < 0 ||
        p.resource > (p.classId === "assassino" ? 10 : 100)
      )
        return null;
    } else {
      // Reembolso dos antigos desbloqueios: o orçamento depende do nível.
      const b = trees[p.classId];
      for (let i = 2; i < p.unlocked; i++) {
        b.nodes.push(`${p.classId}-base-${i}`);
        b.bar[i] = `${p.classId}-base-${i}`;
      }
      // Um legado com gasto maior que o nível não pode criar pontos extras.
      if (p.level - 1 < p.unlocked - 2) {
        b.nodes = b.nodes.slice(0, 2);
        b.bar = b.bar.map((id: string | null, i: number) =>
          i < 2 ? id : null,
        );
      }
    }
    const player: Player = {
      ...base,
      ...p,
      trees: trees as Profiles,
      level: Math.min(60, p.level),
      skillCooldowns:
        s.version === 2
          ? p.skillCooldowns
          : Object.fromEntries(
              trees[p.classId].bar.flatMap((id: string | null, i: number) =>
                id ? [[id, p.cooldowns[i]]] : [],
              ),
            ),
      resource: s.version === 2 ? p.resource : 0,
      challenges:
        s.version === 2
          ? p.challenges
          : {
              kills: s.quest.kills,
              chests: s.opened.filter((x: string) => x.startsWith("chest"))
                .length,
              seal: s.quest.rewardClaimed,
            },
      direction: DIRS.includes(p.direction) ? p.direction : base.direction,
      stealth: false,
      action: "idle",
      animTime: 0,
      attackTimer: 0,
      invulnerable: 1,
      guard: 0,
    };
    if (
      s.version === 2 &&
      Object.values(player.trees).some(
        (b) =>
          b.mastery &&
          (player.challenges.kills < 20 ||
            player.challenges.chests < 2 ||
            !player.challenges.seal),
      )
    )
      return null;
    syncPoints(player);
    player.inventory = player.inventory.filter((id: string) =>
      ITEMS.some((i) => i.id === id),
    );
    player.hp = Math.min(player.hp, stats(player).maxHp);
    player.mp = Math.min(player.mp, stats(player).maxMp);
    return { ...s, version: 2, player };
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
