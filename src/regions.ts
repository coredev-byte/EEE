import type { Point } from "./spatial";
import type { Enemy } from "./state";
export type RegionId = "pedralta" | "kharn";
export const REGION_IDS: RegionId[] = ["pedralta", "kharn"];
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
} as const;
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
  regions: { pedralta: emptyRegion(), kharn: emptyRegion() },
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
