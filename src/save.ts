import { freshChapter, CHAPTER_SCENES } from "./chapter-data";
import { emptyRegion } from "./regions";
import { restorePrologue, type PrologueSave } from "./prologue";
import { World } from "./world";
import { validJournal } from "./missions";
import {
  REGIONS,
  REGION_IDS,
  ANCHORS,
  freshExploration,
  PASSAGES,
  type Exploration,
} from "./regions";
import { freshProfiles, syncPoints, validBuild, type Profiles } from "./skills";
import { playableBounds } from "./spatial";
import { CLASSES, ITEMS, DIRS, type ClassId } from "./data";
import { createPlayer, stats, type Player, type Quest } from "./state";
export const SAVE_KEY = "distrito-zero:v1";
export interface Save {
  version: 4;
  prologue: PrologueSave | null;
  exploration: Exploration;
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
  exploration?: Exploration,
  prologue: PrologueSave | null = null,
): string {
  return JSON.stringify({
    version: 4,
    prologue,
    exploration: exploration ?? {
      ...freshExploration(),
      regions: {
        ...freshExploration().regions,
        pedralta: { ...freshExploration().regions.pedralta, opened, killed },
      },
    },
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
      ![1, 2, 3, 4].includes(s.version) ||
      !s.player ||
      !Object.hasOwn(CLASSES, s.player.classId)
    )
      return null;
    const p = s.player;
    if (s.version === 3 && s.exploration) {
      const old = s.exploration;
      s.exploration = {
        ...freshExploration(),
        ...old,
        regions: { ...freshExploration().regions, ...old.regions },
        visited: old.campaign?.entered ? ["pedralta", "kharn"] : ["pedralta"],
      };
    }
    if (
      s.version >= 3 &&
      s.exploration?.regions &&
      !s.exploration.regions.ruins
    )
      s.exploration.regions.ruins = emptyRegion();
    if (s.version >= 3 && s.exploration && !s.exploration.chapter)
      s.exploration.chapter = freshChapter(
        !!s.exploration.campaign?.rewardClaimed,
      );
    if (s.version >= 3 && !validExploration(s.exploration, s.quest))
      return null;
    const exploration: Exploration =
      s.version >= 3 ? s.exploration : freshExploration();
    if (s.version < 3) {
      exploration.regions.pedralta.opened = [...(s.opened ?? [])];
      exploration.regions.pedralta.killed = [...(s.killed ?? [])];
    }
    const bounds = playableBounds(REGIONS[exploration.region].size);
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
      typeof s.quest.rewardClaimed !== "boolean" ||
      (s.quest.accepted !== undefined && typeof s.quest.accepted !== "boolean")
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
    if (s.version !== 1) {
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
        s.version !== 1
          ? p.skillCooldowns
          : Object.fromEntries(
              trees[p.classId].bar.flatMap((id: string | null, i: number) =>
                id ? [[id, p.cooldowns[i]]] : [],
              ),
            ),
      resource: s.version !== 1 ? p.resource : 0,
      challenges:
        s.version !== 1
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
      s.version !== 1 &&
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
    const world = new World(exploration.region);
    world.applyChanges(exploration.changes);
    Object.assign(player, world.nearestFree(player));
    exploration.regions[exploration.region].discovered = world.discover(
      player,
      exploration.regions[exploration.region].discovered,
    );
    return {
      ...s,
      version: 4,
      player,
      exploration,
      prologue: restorePrologue(s.prologue),
    };
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

function validExploration(value: unknown, quest: Quest): value is Exploration {
  const e = value as Exploration;
  if (!e || !REGION_IDS.includes(e.region) || !e.campaign || !e.regions)
    return false;
  if (
    !Array.isArray(e.visited) ||
    !e.visited.includes("pedralta") ||
    e.visited.some((id) => !REGION_IDS.includes(id)) ||
    ![e.knownPassages, e.unlocked].every(
      (list) =>
        Array.isArray(list) &&
        list.every((id) => PASSAGES.some((p) => `${p.region}:${p.id}` === id)),
    ) ||
    ![e.bosses, e.changes].every(
      (list) =>
        Array.isArray(list) && list.every((id) => typeof id === "string"),
    ) ||
    !e.journal ||
    ![e.journal.events, e.journal.accepted, e.journal.completed].every(
      (list) =>
        Array.isArray(list) && list.every((id) => typeof id === "string"),
    ) ||
    !(e.journal.tracked === null || typeof e.journal.tracked === "string")
  )
    return false;
  const c = e.campaign;
  if (
    ![c.accepted, c.entered, c.rewardClaimed].every(
      (v) => typeof v === "boolean",
    ) ||
    !Array.isArray(c.attuned) ||
    new Set(c.attuned).size !== c.attuned.length ||
    c.attuned.some((id) => !ANCHORS.some((a) => a.id === id))
  )
    return false;
  if (
    (e.region === "kharn" ||
      c.entered ||
      c.accepted ||
      c.attuned.length ||
      c.rewardClaimed) &&
    (!quest?.rewardClaimed || quest.stage !== 2)
  )
    return false;
  if (c.rewardClaimed && c.attuned.length !== ANCHORS.length) return false;
  if (e.region === "ferrugem" && !c.rewardClaimed) return false;
  if (!validJournal(e)) return false;
  const chapter = e.chapter;
  if (
    chapter &&
    (chapter.version !== 1 ||
      typeof chapter.legacyRoad !== "boolean" ||
      typeof chapter.checkpoint !== "boolean" ||
      !["ready", "intro", "fight", "ending", "cleared"].includes(
        chapter.arena,
      ) ||
      !Array.isArray(chapter.scenes) ||
      new Set(chapter.scenes).size !== chapter.scenes.length ||
      chapter.scenes.some((id) => !CHAPTER_SCENES.includes(id)))
  )
    return false;
  if (e.region === "ruins" && !e.journal.events.includes("report:lenir"))
    return false;
  if (
    chapter &&
    ["intro", "fight", "ending"].includes(chapter.arena) &&
    !e.journal.events.includes("arena-open")
  )
    return false;
  if (
    chapter?.arena === "cleared" &&
    !e.journal.completed.includes("shattered-seal")
  )
    return false;
  if (chapter?.arena === "ending" && !e.journal.events.includes("defeat:310"))
    return false;
  for (const id of REGION_IDS) {
    const r = e.regions[id];
    if (
      !r ||
      !Array.isArray(r.opened) ||
      r.opened.some((x) => typeof x !== "string") ||
      !Array.isArray(r.killed) ||
      r.killed.some((x) => !Number.isInteger(x)) ||
      !Array.isArray(r.discovered) ||
      r.discovered.length > REGIONS[id].size ** 2
    )
      return false;
    if (
      r.discovered.some(
        (k) =>
          typeof k !== "string" ||
          !/^\d+:\d+$/.test(k) ||
          k.split(":").some((v) => Number(v) >= REGIONS[id].size),
      )
    )
      return false;
    if (
      !Array.isArray(r.encounters) ||
      r.encounters.length > 30 ||
      new Set(r.encounters.map((x) => x.id)).size !== r.encounters.length
    )
      return false;
    if (
      r.encounters.some(
        (x) =>
          !Number.isInteger(x.id) ||
          ![x.x, x.y, x.hp, x.maxHp].every(Number.isFinite) ||
          x.x < 1 ||
          x.y < 1 ||
          x.x > REGIONS[id].size - 2 ||
          x.y > REGIONS[id].size - 2 ||
          x.hp < 0 ||
          x.maxHp <= 0 ||
          x.maxHp > 1000 ||
          x.hp > x.maxHp ||
          typeof x.rewarded !== "boolean" ||
          (x.rewarded && x.hp > 0),
      )
    )
      return false;
  }
  return true;
}
