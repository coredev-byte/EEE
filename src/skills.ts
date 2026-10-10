import { CLASSES, type ClassId, type Skill } from "./data";
import { CATALOG } from "./skill-catalog";
import type { Player } from "./state";
export type Mechanic =
  | "strike"
  | "projectile"
  | "dash"
  | "guard"
  | "buff"
  | "stealth"
  | "mark"
  | "zone"
  | "trap"
  | "turret"
  | "detonate"
  | "duplicate"
  | "cleanse"
  | "pull"
  | "channel"
  | "multi";
export interface Node {
  id: string;
  classId: ClassId;
  branch: number;
  index: number;
  name: string;
  description: string;
  type: "active" | "passive" | "ultimate" | "upgrade" | "hybrid" | "mastery";
  level: number;
  cost: number;
  parents: string[];
  investment: number;
  color: string;
  icon: number;
  skill?: Skill;
  mechanic?: Mechanic;
  element: string;
}
export interface Build {
  nodes: string[];
  bar: (string | null)[];
  mastery: string | null;
}
export interface Profile extends Build {
  presets: (Build | null)[];
}
export type Profiles = Record<ClassId, Profile>;
export const RESOURCES = {
  guerreiro: "Ímpeto",
  arcanista: "Essência",
  assassino: "Combo",
  atirador: "Foco",
};
export const BRANCHES = CATALOG.map((b, i) => ({
  ...b,
  index: i % 3,
  color: ["#d9b577", "#ec7376", "#859ffa"][i % 3],
}));
const mechanics: Mechanic[][] = [
  [
    "strike",
    "buff",
    "mark",
    "buff",
    "dash",
    "buff",
    "guard",
    "buff",
    "strike",
    "buff",
    "buff",
    "strike",
    "buff",
    "dash",
    "zone",
  ],
  [
    "strike",
    "buff",
    "buff",
    "strike",
    "buff",
    "dash",
    "buff",
    "multi",
    "buff",
    "buff",
    "buff",
    "channel",
    "buff",
    "buff",
    "buff",
  ],
  [
    "buff",
    "buff",
    "zone",
    "buff",
    "strike",
    "buff",
    "dash",
    "buff",
    "mark",
    "buff",
    "buff",
    "turret",
    "buff",
    "detonate",
    "zone",
  ],
  [
    "projectile",
    "buff",
    "buff",
    "projectile",
    "buff",
    "zone",
    "buff",
    "zone",
    "buff",
    "buff",
    "buff",
    "channel",
    "buff",
    "buff",
    "pull",
  ],
  [
    "projectile",
    "buff",
    "zone",
    "buff",
    "mark",
    "buff",
    "dash",
    "buff",
    "pull",
    "buff",
    "buff",
    "zone",
    "buff",
    "detonate",
    "pull",
  ],
  [
    "projectile",
    "buff",
    "guard",
    "buff",
    "zone",
    "buff",
    "duplicate",
    "buff",
    "guard",
    "buff",
    "strike",
    "buff",
    "zone",
    "buff",
    "zone",
  ],
  [
    "strike",
    "buff",
    "stealth",
    "buff",
    "dash",
    "buff",
    "mark",
    "buff",
    "stealth",
    "buff",
    "projectile",
    "buff",
    "channel",
    "buff",
    "multi",
  ],
  [
    "buff",
    "buff",
    "projectile",
    "buff",
    "zone",
    "buff",
    "mark",
    "buff",
    "projectile",
    "buff",
    "buff",
    "strike",
    "cleanse",
    "buff",
    "zone",
  ],
  [
    "strike",
    "buff",
    "dash",
    "buff",
    "strike",
    "buff",
    "multi",
    "buff",
    "dash",
    "buff",
    "strike",
    "buff",
    "multi",
    "buff",
    "multi",
  ],
  [
    "projectile",
    "buff",
    "mark",
    "buff",
    "projectile",
    "buff",
    "buff",
    "buff",
    "projectile",
    "buff",
    "projectile",
    "buff",
    "channel",
    "buff",
    "channel",
  ],
  [
    "trap",
    "buff",
    "turret",
    "buff",
    "trap",
    "buff",
    "mark",
    "buff",
    "zone",
    "buff",
    "turret",
    "buff",
    "detonate",
    "buff",
    "zone",
  ],
  [
    "projectile",
    "buff",
    "trap",
    "buff",
    "projectile",
    "buff",
    "trap",
    "buff",
    "dash",
    "buff",
    "projectile",
    "buff",
    "mark",
    "buff",
    "mark",
  ],
];
const levels = [1, 1, 5, 5, 5, 15, 15, 15, 25, 25, 35, 35, 45, 45, 60];
export const NODES: Node[] = CATALOG.flatMap((b, bi) =>
  b.nodes.map(([name, type, description], i) => {
    const branch = bi % 3,
      element = [
        "steel",
        "blood",
        "rune",
        "fire",
        "void",
        "arcane",
        "shadow",
        "poison",
        "steel",
        "precision",
        "device",
        "hunt",
      ][bi];
    const color = [
        "#d9b577",
        "#ec7376",
        "#859ffa",
        "#ff8748",
        "#b887e9",
        "#76cde4",
        "#a893dd",
        "#8ec887",
        "#e0bbcb",
        "#e7d58c",
        "#78bce8",
        "#a8cb90",
      ][bi],
      mechanic = mechanics[bi][i];
    const id = `${b.classId}-${branch}-${i}`,
      ultimate = type === "Suprema";
    const kind =
      mechanic === "projectile" ||
      (mechanic === "channel" &&
        !["guerreiro", "assassino"].includes(b.classId))
        ? "projectile"
        : mechanic === "dash"
          ? "dash"
          : mechanic === "guard"
            ? "guard"
            : [
                  "zone",
                  "pull",
                  "trap",
                  "turret",
                  "detonate",
                  "mark",
                  "buff",
                  "duplicate",
                  "cleanse",
                  "stealth",
                ].includes(mechanic)
              ? "nova"
              : "slash";
    return {
      id,
      classId: b.classId,
      branch,
      index: i,
      name,
      description,
      type: type === "Passiva" ? "passive" : ultimate ? "ultimate" : "active",
      level: levels[i],
      cost: 1,
      parents: i >= 3 ? [`${b.classId}-${branch}-${i - 3}`] : [],
      investment: ultimate ? 12 : Math.floor(i / 3) * 2,
      color,
      icon: branch === 0 ? 9 : branch === 1 ? 11 : 10,
      mechanic,
      element,
      skill:
        type === "Passiva"
          ? undefined
          : {
              id,
              name,
              description,
              kind,
              damage: ultimate ? 180 : 35 + i * 5,
              cost: ultimate ? 60 : 10 + Math.floor(i / 3) * 4,
              cooldown: ultimate ? 75 : 3 + Math.floor(i / 3) * 2,
              range:
                kind === "projectile" || mechanic === "mark"
                  ? 10
                  : kind === "dash"
                    ? 3
                    : 2.3,
              color,
              icon: branch === 0 ? 9 : branch === 1 ? 11 : 10,
            },
    } as Node;
  }),
);
// Os quatro poderes já existentes continuam disponíveis como fundamentos.
for (const classId of Object.keys(CLASSES) as ClassId[])
  CLASSES[classId].skills.forEach((skill, index) =>
    NODES.push({
      id: `${classId}-base-${index}`,
      classId,
      branch: -1,
      index,
      name: skill.name,
      description: skill.description,
      type: "active",
      level: index < 2 ? 1 : index,
      parents: [],
      investment: 0,
      cost: index < 2 ? 0 : 1,
      color: CLASSES[classId].color,
      icon: skill.icon,
      skill: { ...skill, id: `${classId}-base-${index}` },
      element: "base",
    }),
  );
const hybrids = [
  ["Contra-Ataque Sanguinário", "Muralha Gravada", "Runa de Carnificina"],
  ["Chama do Abismo", "Catalisador Solar", "Dobra Dimensional"],
  ["Toxina Silenciosa", "Passo Fantasma", "Lâmina Contaminada"],
  ["Mira Automatizada", "Execução da Presa", "Zona de Caça"],
];
(Object.keys(CLASSES) as ClassId[]).forEach((classId, ci) => {
  hybrids[ci].forEach((name, i) =>
    NODES.push({
      id: `${classId}-hybrid-${i}`,
      classId,
      branch: -2,
      index: i,
      name,
      description: [
        [
          "Bloquear fortalece o próximo golpe em 40%.",
          "Bloquear aplica enfraquecimento rúnico ao agressor.",
          "Golpes fortes detonam cinco marcas rúnicas.",
        ],
        [
          "Fogo causa dano extra contra alvos corrompidos.",
          "Alternar elementos fortalece a explosão seguinte.",
          "Passagem Sombria prepara um projétil duplicado.",
        ],
        [
          "A abertura furtiva aplica duas toxinas.",
          "Esquivas ofensivas permitem voltar à furtividade por 2s.",
          "Combos prolongam o veneno, até 12s.",
        ],
        [
          "Dispositivos revelam pontos fracos dos alvos atingidos.",
          "Acertos sucessivos aumentam o dano contra a presa marcada.",
          "Armadilhas aplicam marcas e revelam suas presas.",
        ],
      ][ci][i],
      type: "hybrid",
      level: 25,
      cost: 1,
      parents: [],
      investment: 4,
      color: "#d3a2e5",
      icon: 11,
      element: "hybrid",
    }),
  );
  for (let branch = 0; branch < 3; branch++) {
    const first = NODES.find(
      (n) =>
        n.classId === classId && n.branch === branch && n.type === "active",
    )!;
    ["Impacto Brutal", "Guarda Reforçada", "Ruptura de Defesa"].forEach(
      (name, i) =>
        NODES.push({
          id: `${first.id}-up-${i}`,
          classId,
          branch,
          index: i,
          name,
          description: [
            "+25% de dano e interrupção prolongada.",
            "Acertar concede escudo de 12% da vida por 3s.",
            "Acertar reduz defesa em 20% por 4s.",
          ][i],
          type: "upgrade",
          level: 5,
          cost: 1,
          parents: [first.id],
          investment: 1,
          color: first.color,
          icon: first.icon,
          element: first.element,
        }),
    );
    NODES.push({
      id: `${classId}-mastery-${branch}`,
      classId,
      branch,
      index: 15,
      name: [
        "Proteção superior",
        "Fúria controlada",
        "Runas ancestrais",
        "Explosão elemental",
        "Controle dimensional",
        "Eficiência mágica",
        "Emboscadas",
        "Toxinas",
        "Combos técnicos",
        "Precisão extrema",
        "Engenharia de combate",
        "Caça especializada",
      ][ci * 3 + branch],
      description:
        "Maestria: transforma o ramo após 20 abates, 2 baús e o selo de Kharn. Uma escolha por classe; não consome pontos.",
      type: "mastery",
      level: 60,
      cost: 0,
      parents: [],
      investment: 8,
      color: first.color,
      icon: 11,
      element: first.element,
    });
  }
});
export const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));
export function freshProfiles(): Profiles {
  return Object.fromEntries(
    (Object.keys(CLASSES) as ClassId[]).map((id) => [
      id,
      {
        nodes: [`${id}-base-0`, `${id}-base-1`],
        bar: [`${id}-base-0`, `${id}-base-1`, null, null],
        mastery: null,
        presets: [null, null, null],
      },
    ]),
  ) as Profiles;
}
export const profile = (p: Player) => p.trees[p.classId];
export const owns = (p: Player, id: string) =>
  profile(p).nodes.includes(id) || profile(p).mastery === id;
export const has = (p: Player, branch: number, index: number) =>
  owns(p, `${p.classId}-${branch}-${index}`);
export const hybrid = (p: Player, index: number) =>
  owns(p, `${p.classId}-hybrid-${index}`);
export function spent(build: Build) {
  return build.nodes.reduce(
    (sum, id) => sum + (NODE_BY_ID.get(id)?.cost ?? 0),
    0,
  );
}
export const points = (p: Player) =>
  Math.max(0, Math.min(59, p.level - 1) - spent(profile(p)));
export function investment(p: Player, branch: number) {
  return profile(p).nodes.filter((id) => {
    const n = NODE_BY_ID.get(id);
    return n?.branch === branch && n.type !== "upgrade";
  }).length;
}
export function requirements(p: Player, n: Node): string[] {
  const errors: string[] = [];
  if (n.classId !== p.classId) errors.push("Classe incompatível");
  if (p.level < n.level) errors.push(`Nível ${n.level}`);
  for (const parent of n.parents)
    if (!owns(p, parent)) errors.push(NODE_BY_ID.get(parent)!.name);
  if (n.branch >= 0 && investment(p, n.branch) < n.investment)
    errors.push(
      `${n.investment} nós no ramo (${investment(p, n.branch)}/${n.investment})`,
    );
  if (n.type === "hybrid")
    for (const b of [
      [0, 1],
      [0, 2],
      [1, 2],
    ][n.index])
      if (investment(p, b) < 4)
        errors.push(
          `4 nós em ${BRANCHES.find((x) => x.classId === p.classId && x.index === b)!.name}`,
        );
  if (
    n.type === "mastery" &&
    (p.challenges.kills < 20 || p.challenges.chests < 2 || !p.challenges.seal)
  )
    errors.push(
      `Desafios: ${p.challenges.kills}/20 abates · ${p.challenges.chests}/2 baús · selo ${p.challenges.seal ? "concluído" : "pendente"}`,
    );
  if (
    n.type === "upgrade" &&
    profile(p).nodes.filter((id) => id.startsWith(n.parents[0] + "-up-"))
      .length >= 2
  )
    errors.push("Máximo de duas melhorias por habilidade");
  if (!owns(p, n.id) && points(p) < n.cost) errors.push("Pontos insuficientes");
  return errors;
}
export function syncPoints(p: Player) {
  p.skillPoints = points(p);
  p.unlocked = profile(p).bar.filter(Boolean).length;
}
export function learn(p: Player, id: string) {
  const n = NODE_BY_ID.get(id);
  if (!n || owns(p, id) || requirements(p, n).length) return false;
  if (n.type === "mastery") profile(p).mastery = id;
  else profile(p).nodes.push(id);
  syncPoints(p);
  return true;
}
export function assign(p: Player, id: string, slot: number) {
  const n = NODE_BY_ID.get(id),
    b = profile(p);
  if (
    !n?.skill ||
    !owns(p, id) ||
    slot < 0 ||
    slot > 3 ||
    !Number.isInteger(slot)
  )
    return false;
  if (n.type === "ultimate")
    b.bar = b.bar.map((x) =>
      NODE_BY_ID.get(x ?? "")?.type === "ultimate" ? null : x,
    );
  b.bar = b.bar.map((x) => (x === id ? null : x));
  b.bar[slot] = id;
  syncPoints(p);
  return true;
}
export function equippedSkills(p: Player): (Skill | null)[] {
  return profile(p).bar.map((id) => (id ? effectiveSkill(p, id) : null));
}
export function effectiveSkill(p: Player, id: string): Skill | null {
  const n = NODE_BY_ID.get(id);
  if (!n?.skill) return null;
  const s = { ...n.skill };
  if (owns(p, `${id}-up-0`)) s.damage *= 1.25;
  if (p.classId === "arcanista" && has(p, 2, 1)) s.cost *= 0.85;
  if (p.classId === "arcanista" && has(p, 2, 13)) s.cost *= 0.9;
  if (
    p.classId === "arcanista" &&
    n.branch >= 0 &&
    profile(p).mastery === `${p.classId}-mastery-2`
  )
    s.cost *= 0.8;
  if (p.classId === "atirador" && n.element === "device" && has(p, 1, 1))
    s.cooldown *= 0.8;
  if (
    n.branch >= 0 &&
    profile(p).mastery === `${p.classId}-mastery-${n.branch}`
  ) {
    s.range *= 1.25;
    s.cooldown *= 0.85;
  }
  s.cost = Math.ceil(s.cost);
  return s;
}
export const respecCost = (p: Player) => 25 + p.level * 5;
export function respec(p: Player) {
  if (p.coins < respecCost(p)) return false;
  p.coins -= respecCost(p);
  const b = profile(p),
    fresh = freshProfiles()[p.classId];
  b.nodes = fresh.nodes;
  b.bar = fresh.bar;
  b.mastery = null;
  syncPoints(p);
  return true;
}
export function saveBuild(p: Player, slot: number) {
  if (slot < 0 || slot > 2) return false;
  const b = profile(p);
  b.presets[slot] = structuredClone({
    nodes: b.nodes,
    bar: b.bar,
    mastery: b.mastery,
  });
  return true;
}
export function restoreBuild(p: Player, slot: number) {
  const b = profile(p),
    saved = b.presets[slot];
  if (
    !saved ||
    p.coins < respecCost(p) ||
    !validBuild(saved, p.classId, p.level) ||
    (saved.mastery &&
      (p.challenges.kills < 20 ||
        p.challenges.chests < 2 ||
        !p.challenges.seal))
  )
    return false;
  p.coins -= respecCost(p);
  Object.assign(b, structuredClone(saved));
  syncPoints(p);
  return true;
}
export function validBuild(b: Build, id: ClassId, level: number): boolean {
  if (
    !b ||
    !Array.isArray(b.nodes) ||
    !Array.isArray(b.bar) ||
    b.bar.length !== 4 ||
    new Set(b.nodes).size !== b.nodes.length
  )
    return false;
  if (
    b.nodes.some(
      (x) =>
        typeof x !== "string" ||
        NODE_BY_ID.get(x)?.classId !== id ||
        NODE_BY_ID.get(x)!.type === "mastery",
    )
  )
    return false;
  if (spent(b) > Math.min(59, level - 1)) return false;
  if (
    b.bar.some(
      (x) => x !== null && (!b.nodes.includes(x) || !NODE_BY_ID.get(x)?.skill),
    ) ||
    new Set(b.bar.filter(Boolean)).size !== b.bar.filter(Boolean).length
  )
    return false;
  if (
    b.bar.filter((x) => NODE_BY_ID.get(x ?? "")?.type === "ultimate").length > 1
  )
    return false;
  if (
    b.mastery !== null &&
    (NODE_BY_ID.get(b.mastery)?.type !== "mastery" ||
      NODE_BY_ID.get(b.mastery)?.classId !== id ||
      level < 60)
  )
    return false;
  for (const x of b.nodes) {
    const n = NODE_BY_ID.get(x)!;
    if (level < n.level || n.parents.some((x) => !b.nodes.includes(x)))
      return false;
    const count = (branch: number) =>
      b.nodes.filter((x) => {
        const a = NODE_BY_ID.get(x)!;
        return a.branch === branch && a.type !== "upgrade";
      }).length;
    if (
      n.branch >= 0 &&
      count(n.branch) - (n.type === "upgrade" ? 0 : 1) < n.investment
    )
      return false;
    if (
      n.type === "hybrid" &&
      [
        [0, 1],
        [0, 2],
        [1, 2],
      ][n.index].some((branch) => count(branch) < 4)
    )
      return false;
    if (
      n.type === "upgrade" &&
      b.nodes.filter((x) => x.startsWith(n.parents[0] + "-up-")).length > 2
    )
      return false;
  }
  return true;
}
