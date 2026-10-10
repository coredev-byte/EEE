import { NODES, NODE_BY_ID } from "./skills";
import { ITEMS, type ClassId } from "./data";
import type { Point } from "./spatial";
export type AudioBus = "music" | "ambience" | "combat" | "ui" | "voices";
export type MusicState =
  | "menu"
  | "safe"
  | "danger"
  | "combat"
  | "elite"
  | "boss"
  | "victory"
  | "defeat"
  | "narrative";
export type Soundscape = "village" | "forest" | "ruins" | "industrial";
export type AudioEvent =
  | "attack.prepare"
  | "attack.swing"
  | "attack.miss"
  | "impact.hit"
  | "impact.world"
  | "impact.critical"
  | "player.hurt"
  | "defense.block"
  | "defense.dodge"
  | "defense.break"
  | "enemy.alert"
  | "enemy.attack"
  | "enemy.death"
  | "enemy.step"
  | "skill.activate"
  | "skill.sustain"
  | "skill.end"
  | "skill.denied"
  | "skill.ready"
  | "status.apply"
  | "step"
  | "loot.coins"
  | "loot.item"
  | "loot.material"
  | "loot.common"
  | "loot.rare"
  | "loot.epic"
  | "loot.legendary"
  | "loot.quest"
  | "loot.denied"
  | "equipment.equip"
  | "equipment.remove"
  | "equipment.compare"
  | "ui.open"
  | "ui.close"
  | "ui.select"
  | "ui.notify"
  | "dialogue.open"
  | "dialogue.close"
  | "dialogue.next"
  | "dialogue.choice"
  | "quest.accept"
  | "quest.complete"
  | "area.discover"
  | "level.up"
  | "object.chest"
  | "object.portal"
  | "potion.use";
export interface AudioCue {
  position?: Point;
  classId?: ClassId;
  skillId?: string;
  weaponId?: string | null;
  itemId?: string | null;
  armorId?: string | null;
  element?: string;
  status?: string;
  terrain?: "stone" | "grass" | "wood";
  material?: "flesh" | "metal" | "stone";
  enemy?: "bandit" | "wolf";
  rarity?: string;
  owner?: string;
  group?: string;
  duration?: number;
  preview?: boolean;
  upgraded?: boolean;
  stealth?: boolean;
}
export interface SoundSpec {
  bus: AudioBus;
  families: string[];
  gain: number;
  priority: number;
  interval: number;
  spatial: boolean;
  key: string;
  rate: number;
  loop?: boolean;
}
const families = [
  "prepare",
  "blade",
  "metal",
  "body",
  "shot",
  "mechanism",
  "fire",
  "arcane",
  "void",
  "rune",
  "poison",
  "shield",
  "dash",
  "interrupt",
  "death",
  "enemy",
  "step-stone",
  "step-grass",
  "step-wood",
  "coins",
  "item",
  "equip",
  "unequip",
  "compare",
  "menu-open",
  "menu-close",
  "select",
  "denied",
  "dialogue",
  "quest",
  "level",
  "supreme",
  "potion",
  "chest",
];
const variants = new Set([
  "blade",
  "metal",
  "body",
  "step-stone",
  "step-grass",
  "step-wood",
]);
export const AUDIO_FILES: Record<string, string[]> = Object.fromEntries(
  families.map((id) => [
    id,
    Array.from(
      { length: variants.has(id) ? 3 : 1 },
      (_, i) => `/audio/sfx/${id}-${i}.wav`,
    ),
  ]),
);
for (const id of ["wind", "water", "insects", "structure", "machinery"])
  AUDIO_FILES[id] = [`/audio/ambience/${id}.wav`];
for (const id of ["pad", "pulse", "motif"])
  AUDIO_FILES[id] = [`/audio/music/${id}.wav`];
const elementFamily: Record<string, string> = {
  steel: "blade",
  blood: "blade",
  rune: "rune",
  fire: "fire",
  void: "void",
  arcane: "arcane",
  shadow: "dash",
  poison: "poison",
  precision: "shot",
  device: "mechanism",
  hunt: "shot",
  lightning: "arcane",
};
export const SKILL_AUDIO = Object.fromEntries(
  NODES.map((n) => [
    n.id,
    {
      prepare: n.type === "ultimate" ? "supreme" : "prepare",
      activate:
        elementFamily[n.element] ??
        (n.skill?.kind === "projectile" ? "arcane" : "blade"),
      sustain: ["zone", "pull", "turret", "guard", "buff", "stealth"].includes(
        n.mechanic ?? "",
      )
        ? (elementFamily[n.element] ?? "rune")
        : null,
      end: n.type === "ultimate" ? "supreme" : "rune",
      variation: n.index * 3 + n.branch,
    },
  ]),
);
export function soundSpec(event: AudioEvent, cue: AudioCue = {}): SoundSpec {
  const node = NODE_BY_ID.get(cue.skillId ?? ""),
    skill = SKILL_AUDIO[cue.skillId ?? ""];
  const weapon = ITEMS.find((i) => i.id === cue.weaponId),
    element =
      cue.element ??
      node?.element ??
      (cue.classId === "arcanista"
        ? "arcane"
        : cue.classId === "atirador"
          ? "precision"
          : "steel");
  const identity = elementFamily[element] ?? "blade";
  const spec: SoundSpec = {
    bus: "combat",
    families: ["body"],
    gain: 0.45,
    priority: 3,
    interval: 55,
    spatial: !!cue.position,
    key: event,
    rate: 1,
  };
  if (event === "attack.prepare") {
    spec.families = [skill?.prepare ?? "prepare"];
    spec.gain = node?.type === "ultimate" ? 0.6 : 0.2;
    spec.priority = node?.type === "ultimate" ? 9 : 2;
  } else if (event === "attack.swing" || event === "skill.activate") {
    spec.families = [
      cue.element
        ? identity
        : node?.mechanic === "guard"
          ? cue.classId === "arcanista"
            ? "shield"
            : "metal"
          : (skill?.activate ?? identity),
    ];
    if (["fire", "arcane", "void", "rune", "poison"].includes(identity))
      spec.families.push("shot");
    spec.priority = node?.type === "ultimate" ? 9 : 4;
    spec.gain = 0.5;
    if (node?.type === "ultimate") spec.families.push("supreme");
    if (
      weapon?.element &&
      ["fire", "lightning", "rune"].includes(weapon.element) &&
      weapon.element !== element
    )
      spec.families.push(elementFamily[weapon.element]);
    if (cue.upgraded) spec.families.push("metal");
  } else if (event === "skill.sustain") {
    spec.families = [skill?.sustain ?? identity];
    spec.loop = true;
    spec.gain = 0.1;
    spec.priority = 1;
    spec.interval = 0;
  } else if (event === "skill.end") {
    spec.families = [skill?.end ?? "rune"];
    spec.gain = 0.15;
    spec.priority = 2;
  } else if (event === "attack.miss") {
    spec.families = ["blade"];
    spec.gain = 0.09;
    spec.priority = 1;
  } else if (event.startsWith("impact.")) {
    spec.families = [
      ["fire", "arcane", "void", "rune", "poison"].includes(identity)
        ? identity
        : cue.material === "metal"
          ? "metal"
          : cue.material === "stone"
            ? "metal"
            : "body",
    ];
    if (
      weapon?.element &&
      ["fire", "lightning", "rune"].includes(weapon.element) &&
      weapon.element !== element
    )
      spec.families.push(elementFamily[weapon.element]);
    spec.interval = 85;
    spec.key = `impact:${identity}:${cue.material ?? "flesh"}`;
    if (event === "impact.critical") {
      spec.families.push("interrupt");
      spec.priority = 7;
      spec.gain = 0.65;
    }
  } else if (event === "player.hurt") {
    spec.families = ["body"];
    spec.priority = 7;
    spec.gain = 0.65;
    spec.interval = 200;
  } else if (event === "defense.block") {
    spec.families = [cue.classId === "arcanista" ? "shield" : "metal"];
    spec.priority = 6;
  } else if (event === "defense.dodge") {
    spec.families = ["dash"];
    spec.gain = 0.25;
  } else if (event === "defense.break") {
    spec.families = ["interrupt"];
    spec.priority = 6;
    spec.interval = 180;
  } else if (event === "status.apply") {
    spec.families = [
      {
        burn: "fire",
        poison: "poison",
        bleed: "body",
        corruption: "void",
        rune: "rune",
        root: "shield",
        stun: "interrupt",
        exposed: "metal",
      }[cue.status ?? ""] ?? "rune",
    ];
    spec.gain = 0.18;
    spec.interval = 300;
    spec.key = `status:${cue.status}`;
    spec.priority = 2;
  } else if (event === "enemy.alert") {
    spec.families = ["enemy"];
    spec.priority = 6;
    spec.interval = 500;
  } else if (event === "enemy.attack") {
    spec.families = [cue.enemy === "wolf" ? "body" : "blade"];
    spec.gain = 0.24;
    spec.interval = 180;
  } else if (event === "enemy.death") {
    spec.families = ["death"];
    spec.priority = 5;
    spec.interval = 160;
    spec.key = "death-batch";
  } else if (event === "step" || event === "enemy.step") {
    spec.families = [`step-${cue.terrain ?? "stone"}`];
    spec.gain =
      cue.classId === "guerreiro"
        ? 0.33
        : cue.classId === "assassino"
          ? 0.13
          : 0.22;
    if (cue.armorId === "couraça") spec.families.push("equip");
    if (cue.stealth) spec.gain *= 0.45;
    spec.priority = 1;
    spec.interval = 120;
    spec.key = `step:${cue.owner ?? "player"}`;
  } else {
    spec.bus = "ui";
    spec.spatial = false;
    spec.gain = 0.22;
    spec.priority = 4;
    spec.interval = 100;
    const ui: Partial<Record<AudioEvent, string>> = {
      "loot.coins": "coins",
      "loot.item": "item",
      "loot.material": "item",
      "loot.common": "item",
      "loot.rare": "metal",
      "loot.epic": "rune",
      "loot.legendary": "supreme",
      "loot.quest": "quest",
      "loot.denied": "denied",
      "equipment.equip": "equip",
      "equipment.remove": "unequip",
      "equipment.compare": "compare",
      "ui.open": "menu-open",
      "ui.close": "menu-close",
      "ui.select": "select",
      "ui.notify": "select",
      "dialogue.open": "dialogue",
      "dialogue.close": "menu-close",
      "dialogue.next": "dialogue",
      "dialogue.choice": "select",
      "quest.accept": "quest",
      "quest.complete": "quest",
      "area.discover": "rune",
      "level.up": "level",
      "object.chest": "chest",
      "object.portal": "rune",
      "potion.use": "potion",
      "skill.denied": "denied",
      "skill.ready": "select",
    };
    spec.families = [ui[event] ?? "select"];
    if (event === "equipment.equip" || event === "equipment.remove") {
      const item = ITEMS.find((i) => i.id === cue.itemId);
      if (item?.id === "casaco" && event === "equipment.equip")
        spec.families = ["body"];
      if (item?.element && ["fire", "lightning", "rune"].includes(item.element))
        spec.families.push(elementFamily[item.element]);
    }
    if (event.startsWith("object.")) {
      spec.bus = "combat";
      spec.spatial = !!cue.position;
      spec.priority = 5;
    }
    if (["quest.complete", "level.up", "area.discover"].includes(event)) {
      spec.priority = 8;
      spec.gain = 0.4;
    }
    if (event.startsWith("loot.") && event !== "loot.denied") {
      spec.interval = 350;
      spec.key = "loot-batch";
      if (cue.rarity && cue.rarity !== "Comum")
        spec.families.push(cue.rarity === "Rúnica" ? "rune" : "metal");
    }
    if (event.startsWith("dialogue.")) {
      spec.priority = 7;
      spec.gain = 0.14;
    }
  }
  const variant = skill?.variation ?? 0;
  spec.rate =
    cue.classId === "assassino" ? 1.08 : cue.classId === "guerreiro" ? 0.93 : 1;
  spec.rate *= 1 + ((variant % 7) - 3) * 0.008;
  if (cue.preview) {
    spec.bus = "ui";
    spec.spatial = false;
  }
  if (cue.group) spec.key = cue.group;
  return spec;
}
export interface AudioSettings {
  master: number;
  music: number;
  ambience: number;
  combat: number;
  ui: number;
  voices: number;
  muted: boolean;
}
export const AUDIO_SETTINGS_KEY = "distrito-zero:audio:v2";
export const DEFAULT_AUDIO: AudioSettings = {
  master: 0.7,
  music: 0.45,
  ambience: 0.5,
  combat: 0.8,
  ui: 0.6,
  voices: 0.7,
  muted: false,
};
export function readSettings(
  storage?: Pick<Storage, "getItem">,
): AudioSettings {
  try {
    const saved = JSON.parse(storage?.getItem(AUDIO_SETTINGS_KEY) ?? "null");
    if (
      !saved ||
      typeof saved.muted !== "boolean" ||
      !["master", "music", "ambience", "combat", "ui", "voices"].every(
        (k) =>
          typeof saved[k] === "number" &&
          Number.isFinite(saved[k]) &&
          saved[k] >= 0 &&
          saved[k] <= 1,
      )
    )
      return { ...DEFAULT_AUDIO };
    return { ...DEFAULT_AUDIO, ...saved };
  } catch {
    return { ...DEFAULT_AUDIO };
  }
}
export function spatialMix(source: Point | undefined, listener: Point) {
  if (!source) return { gain: 1, pan: 0 };
  const dx = source.x - listener.x,
    dy = source.y - listener.y,
    d = Math.hypot(dx, dy);
  return {
    gain: d >= 14 ? 0 : 1 / (1 + (d / 4) ** 2),
    pan: Math.max(-0.85, Math.min(0.85, (dx - dy) / 8)),
  };
}
export const MUSIC_LEVELS: Record<MusicState, [number, number, number]> = {
  menu: [0.45, 0, 0.25],
  safe: [0.6, 0, 0.15],
  danger: [0.6, 0.2, 0.2],
  combat: [0.5, 0.65, 0.35],
  elite: [0.5, 0.85, 0.4],
  boss: [0.6, 1, 0.5],
  victory: [0.5, 0.15, 0.6],
  defeat: [0.25, 0, 0.08],
  narrative: [0.45, 0, 0.35],
};
