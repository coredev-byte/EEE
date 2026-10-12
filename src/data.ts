export type ClassId = "guerreiro" | "arcanista" | "assassino" | "atirador";
export type SkillKind =
  | "slash"
  | "projectile"
  | "nova"
  | "dash"
  | "guard"
  | "heal";
export interface Skill {
  id: string;
  name: string;
  description: string;
  kind: SkillKind;
  damage: number;
  cost: number;
  cooldown: number;
  range: number;
  color: string;
  icon: number;
}
export interface ClassData {
  name: string;
  subtitle: string;
  description: string;
  hp: number;
  speed: number;
  damage: number;
  basic: SkillKind;
  color: string;
  skills: Skill[];
}
const skill = (
  id: string,
  name: string,
  description: string,
  kind: SkillKind,
  damage: number,
  cost: number,
  cooldown: number,
  range: number,
  color: string,
  icon: number,
): Skill => ({
  id,
  name,
  description,
  kind,
  damage,
  cost,
  cooldown,
  range,
  color,
  icon,
});
export const CLASSES: Record<ClassId, ClassData> = {
  guerreiro: {
    name: "Guerreiro",
    subtitle: "O aço lembra.",
    description:
      "Lâmina, resistência e impacto. Enfrente a escuridão de perto.",
    hp: 248,
    speed: 2.8,
    damage: 30,
    basic: "slash",
    color: "#ed9a56",
    skills: [
      skill(
        "corte",
        "Corte flamejante",
        "Um arco de fogo atinge todos os alvos à frente.",
        "slash",
        56,
        16,
        4,
        1.7,
        "#fa7746",
        9,
      ),
      skill(
        "investida",
        "Investida",
        "Avance pela rua e abra caminho com a lâmina.",
        "dash",
        42,
        20,
        6,
        2.8,
        "#78b9ee",
        10,
      ),
      skill(
        "furia",
        "Fúria de Kharn",
        "Uma explosão rúnica causa dano ao redor.",
        "nova",
        72,
        32,
        10,
        2.6,
        "#b181f2",
        11,
      ),
      skill(
        "baluarte",
        "Baluarte",
        "Reduz o dano recebido em 75% por cinco segundos.",
        "guard",
        0,
        24,
        14,
        0,
        "#e8c269",
        8,
      ),
    ],
  },
  arcanista: {
    name: "Arcanista",
    subtitle: "O vazio responde.",
    description:
      "Projéteis arcanos e explosões elementais. Controle a distância.",
    hp: 180,
    speed: 2.7,
    damage: 24,
    basic: "projectile",
    color: "#9b8de9",
    skills: [
      skill(
        "gelo",
        "Lança glacial",
        "Um projétil rápido que atravessa a noite.",
        "projectile",
        60,
        16,
        3,
        8,
        "#69c5ff",
        10,
      ),
      skill(
        "chama",
        "Estrela de fogo",
        "Dispara energia flamejante contra o alvo.",
        "projectile",
        85,
        26,
        6,
        7,
        "#fc8953",
        9,
      ),
      skill(
        "ruptura",
        "Ruptura arcana",
        "Detona energia ao redor do conjurador.",
        "nova",
        92,
        38,
        10,
        3.2,
        "#c37aff",
        11,
      ),
      skill(
        "restaurar",
        "Restauração",
        "Recupera 70 pontos de vida.",
        "heal",
        70,
        32,
        15,
        0,
        "#80d6b1",
        6,
      ),
    ],
  },
  assassino: {
    name: "Assassino",
    subtitle: "Nenhum rastro.",
    description:
      "Golpes rápidos, aproximação e evasão. A sombra é sua armadura.",
    hp: 195,
    speed: 3.5,
    damage: 26,
    basic: "slash",
    color: "#c587b4",
    skills: [
      skill(
        "duplo",
        "Lâmina oculta",
        "Um corte curto de alto dano.",
        "slash",
        75,
        16,
        3,
        1.3,
        "#f083a9",
        0,
      ),
      skill(
        "passo",
        "Passo das sombras",
        "Avance rapidamente e golpeie os alvos no caminho.",
        "dash",
        68,
        22,
        5,
        3.5,
        "#b089ff",
        11,
      ),
      skill(
        "veneno",
        "Espinhos do vazio",
        "Uma onda de lâminas atinge inimigos próximos.",
        "nova",
        55,
        28,
        8,
        2.5,
        "#92dca0",
        6,
      ),
      skill(
        "evasao",
        "Evasão",
        "Reduz o dano e permite se reposicionar.",
        "guard",
        0,
        18,
        12,
        0,
        "#ba9de8",
        8,
      ),
    ],
  },
  atirador: {
    name: "Atirador",
    subtitle: "Uma chance. Um disparo.",
    description:
      "Precisão à distância e mobilidade. Cada alvo tem seu momento.",
    hp: 205,
    speed: 3.1,
    damage: 28,
    basic: "projectile",
    color: "#9bb98a",
    skills: [
      skill(
        "precisao",
        "Disparo preciso",
        "Um projétil poderoso de longo alcance.",
        "projectile",
        88,
        16,
        4,
        12,
        "#d9d08d",
        0,
      ),
      skill(
        "eletrico",
        "Dardo elétrico",
        "Energia elétrica em um disparo veloz.",
        "projectile",
        62,
        22,
        5,
        10,
        "#64b5ff",
        2,
      ),
      skill(
        "granada",
        "Carga rúnica",
        "Detona uma carga e atinge os alvos ao redor.",
        "nova",
        80,
        32,
        9,
        2.9,
        "#cd92ef",
        11,
      ),
      skill(
        "recuo",
        "Recuo tático",
        "Movimento rápido que causa dano no trajeto.",
        "dash",
        28,
        16,
        8,
        2.8,
        "#9ed494",
        6,
      ),
    ],
  },
};
export interface Item {
  id: string;
  name: string;
  slot: "weapon" | "armor" | "accessory";
  rarity: string;
  description: string;
  attack: number;
  defense: number;
  hp: number;
  icon: number;
  element: string;
}
export const ITEMS: Item[] = [
  {
    id: "selo-vigia",
    name: "Selo do Vigia",
    slot: "accessory",
    rarity: "Rara",
    description:
      "Um fragmento do juramento gravado em pedra. Kharn permanece junto ao selo.",
    attack: 2,
    defense: 3,
    hp: 24,
    icon: 8,
    element: "steel",
  },
  {
    id: "anel-cobre",
    name: "Anel das Caldeiras",
    slot: "accessory",
    rarity: "Rara",
    description:
      "Cobre resfriado da Fornalha. Elcio gravou o nome dos operários na borda.",
    attack: 3,
    defense: 4,
    hp: 18,
    icon: 8,
    element: "steel",
  },
  {
    id: "ferro",
    name: "Lâmina de Pedralta",
    slot: "weapon",
    rarity: "Comum",
    description: "Aço gasto. Uma promessa ainda afiada.",
    attack: 4,
    defense: 0,
    hp: 0,
    icon: 0,
    element: "steel",
  },
  {
    id: "brasa",
    name: "Juramento de brasa",
    slot: "weapon",
    rarity: "Elemental",
    description: "Uma lâmina serrilhada envolta em fogo.",
    attack: 16,
    defense: 0,
    hp: 0,
    icon: 1,
    element: "fire",
  },
  {
    id: "raio",
    name: "Presa da tempestade",
    slot: "weapon",
    rarity: "Rara",
    description: "Pontas elétricas rompem a noite.",
    attack: 13,
    defense: 0,
    hp: 0,
    icon: 2,
    element: "lightning",
  },
  {
    id: "runa",
    name: "Memória de Kharn",
    slot: "weapon",
    rarity: "Rúnica",
    description: "Runas antigas respondem ao portador.",
    attack: 22,
    defense: 0,
    hp: 12,
    icon: 3,
    element: "rune",
  },
  {
    id: "casaco",
    name: "Casaco do errante",
    slot: "armor",
    rarity: "Comum",
    description: "Couro reforçado com aço escurecido.",
    attack: 0,
    defense: 4,
    hp: 0,
    icon: 7,
    element: "none",
  },
  {
    id: "couraça",
    name: "Couraça da vigília",
    slot: "armor",
    rarity: "Rara",
    description: "Forjada para quem permanece de pé.",
    attack: 0,
    defense: 10,
    hp: 25,
    icon: 7,
    element: "none",
  },
  {
    id: "amuleto",
    name: "Olho de Kharn",
    slot: "accessory",
    rarity: "Rúnica",
    description: "Um fragmento do eco que habita as ruínas.",
    attack: 6,
    defense: 2,
    hp: 20,
    icon: 8,
    element: "rune",
  },
];
export const DIRS = ["front", "right", "back", "left"] as const;
export type Direction = (typeof DIRS)[number];
export type Action =
  | "idle"
  | "walk"
  | "attack"
  | "hurt"
  | "cast"
  | "interact"
  | "dead";
export const ANIMATIONS: Record<
  Action,
  { frames: number[]; duration: number; loop: boolean }
> = {
  idle: { frames: [0, 1], duration: 1.1, loop: true },
  walk: { frames: [2, 3, 4, 5], duration: 0.52, loop: true },
  attack: { frames: [6, 7, 8], duration: 0.48, loop: false },
  hurt: { frames: [9], duration: 0.24, loop: false },
  cast: { frames: [6, 10, 8], duration: 0.55, loop: false },
  interact: { frames: [10, 8], duration: 0.5, loop: false },
  dead: { frames: [9, 11], duration: 0.7, loop: false },
};
export const MAP_SIZE = 28;
