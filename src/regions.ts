import type { Point } from "./spatial";
import type { Enemy } from "./state";
export type RegionId = "pedralta" | "kharn" | "ferrugem";
export const REGION_IDS: RegionId[] = ["pedralta", "kharn", "ferrugem"];
// Future districts are world metadata, never selectable empty maps.
export const WORLD_DISTRICTS = [
  { id: "pedralta", name: "Vila Pedralta", playable: true },
  { id: "kharn", name: "Ruínas Esquecidas · Margem de Kharn", playable: true },
  { id: "ferrugem", name: "Bairro da Ferrugem", playable: true },
  { id: "veu", name: "Jardim do Véu", playable: false },
  { id: "afogada", name: "Cidade Afogada", playable: false },
  { id: "cinzas", name: "Distrito das Cinzas", playable: false },
  { id: "zero", name: "Distrito Zero", playable: false },
] as const;
export const REGIONS = {
  pedralta: {
    name: "Vila Pedralta",
    short: "PEDRALTA",
    subtitle: "Setor Leste",
    size: 28,
    spawn: { x: 12, y: 12 },
    arrival: { x: 22, y: 8.2 },
    connection: { x: 22, y: 7 },
    destination: "kharn" as RegionId,
  },
  kharn: {
    name: "Margem de Kharn",
    short: "KHARN",
    subtitle: "Aqueduto das Memórias",
    size: 28,
    spawn: { x: 5, y: 22 },
    arrival: { x: 5, y: 22 },
    connection: { x: 4, y: 22 },
    destination: "pedralta" as RegionId,
  },
  ferrugem: {
    name: "Bairro da Ferrugem",
    short: "FERRUGEM",
    subtitle: "Pátio das Caldeiras",
    size: 28,
    spawn: { x: 5, y: 22 },
    arrival: { x: 5, y: 22 },
    connection: { x: 4, y: 22 },
    destination: "kharn" as RegionId,
  },
} as const;
export interface Passage extends Point {
  id: string;
  region: RegionId;
  destination: RegionId;
  arrival: Point;
  name: string;
  requirement: "seal" | "memories";
  blocked: string;
}
export const PASSAGES: Passage[] = [
  {
    id: "portal-22-7",
    region: "pedralta",
    destination: "kharn",
    x: 22,
    y: 7,
    arrival: { x: 5, y: 22 },
    name: "Selo de Kharn",
    requirement: "seal",
    blocked: "Silencie três ameaças e abra o selo · F",
  },
  {
    id: "portal-4-22",
    region: "kharn",
    destination: "pedralta",
    x: 4,
    y: 22,
    arrival: { x: 22, y: 8.2 },
    name: "Retorno a Pedralta",
    requirement: "seal",
    blocked: "Abra o selo de Pedralta",
  },
  {
    id: "portal-24-18",
    region: "kharn",
    destination: "ferrugem",
    x: 24,
    y: 18,
    arrival: { x: 5, y: 22 },
    name: "Estrada das Caldeiras",
    requirement: "memories",
    blocked: "Entregue as três memórias à Guardiã de Pedralta",
  },
  {
    id: "portal-4-22",
    region: "ferrugem",
    destination: "kharn",
    x: 4,
    y: 22,
    arrival: { x: 23, y: 18 },
    name: "Estrada para Kharn",
    requirement: "memories",
    blocked: "Restabeleça a estrada das Caldeiras",
  },
];
export const passageKey = (p: Passage) => `${p.region}:${p.id}`;
export function passageOpen(
  p: Passage,
  exploration: Exploration,
  seal: boolean,
) {
  return p.requirement === "seal" ? seal : exploration.campaign.rewardClaimed;
}
export const ANCHORS = [
  { id: "vigia", name: "Marco da Vigia", x: 8, y: 16, guardian: 100 },
  { id: "canal", name: "Marco do Canal", x: 18, y: 15, guardian: 102 },
  { id: "memoria", name: "Marco da Memória", x: 22, y: 7, guardian: 104 },
] as const;
export interface Campaign {
  accepted: boolean;
  entered: boolean;
  attuned: string[];
  rewardClaimed: boolean;
}
export interface Encounter extends Point {
  id: number;
  hp: number;
  maxHp: number;
  rewarded: boolean;
}
export interface RegionProgress {
  opened: string[];
  killed: number[];
  discovered: string[];
  encounters: Encounter[];
}
export interface Exploration {
  region: RegionId;
  campaign: Campaign;
  regions: Record<RegionId, RegionProgress>;
  visited: RegionId[];
  knownPassages: string[];
  unlocked: string[];
  bosses: string[];
  changes: string[];
  journal: {
    events: string[];
    accepted: string[];
    completed: string[];
    tracked: string | null;
  };
}
export const emptyRegion = (): RegionProgress => ({
  opened: [],
  killed: [],
  discovered: [],
  encounters: [],
});
export const freshExploration = (): Exploration => ({
  region: "pedralta",
  campaign: {
    accepted: false,
    entered: false,
    attuned: [],
    rewardClaimed: false,
  },
  regions: {
    pedralta: emptyRegion(),
    kharn: emptyRegion(),
    ferrugem: emptyRegion(),
  },
  visited: ["pedralta"],
  knownPassages: [],
  unlocked: [],
  bosses: [],
  changes: [],
  journal: { events: [], accepted: [], completed: [], tracked: null },
});
export function kharnEnemies(): Enemy[] {
  return [
    [100, 10, 16, "bandit", 140],
    [101, 11, 18, "wolf", 100],
    [102, 18, 13, "bandit", 160],
    [103, 16, 14, "wolf", 110],
    [104, 22, 9, "bandit", 180],
    [105, 23, 10, "wolf", 120],
  ].map(([id, x, y, type, hp]) => ({
    id: Number(id),
    x: Number(x),
    y: Number(y),
    home: { x: Number(x), y: Number(y) },
    type: type as Enemy["type"],
    hp: Number(hp),
    maxHp: Number(hp),
    state: "patrol",
    timer: 0,
    direction: "front",
    animTime: 0,
    attackHit: false,
    rewarded: false,
  }));
}
export function ferrugemEnemies(): Enemy[] {
  return [
    [200, 10, 19, 105],
    [201, 16, 14, 115],
    [202, 20, 13, 125],
    [203, 21, 7, 300],
    [204, 10, 10, 180],
  ].map(([id, x, y, hp]) => ({
    id,
    x,
    y,
    home: { x, y },
    type: "bandit",
    hp,
    maxHp: hp,
    state: "patrol",
    timer: 0,
    direction: "front",
    animTime: 0,
    attackHit: false,
    rewarded: false,
    appearance: "machine",
    name:
      id === 203
        ? "Mestre da Fornalha"
        : id === 204
          ? "Sucateiro Voraz"
          : "Autômato descontrolado",
    boss: id === 203,
    optional: id === 204,
  }));
}
