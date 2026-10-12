import type { Enemy } from "./state";
import type { Scene, Shot } from "./prologue-story";
export const CHAPTER_ID = "shattered-seal";
export interface ChapterState {
  version: 1;
  legacyRoad: boolean;
  scenes: string[];
  arena: "ready" | "intro" | "fight" | "ending" | "cleared";
  checkpoint: boolean;
}
export const freshChapter = (legacyRoad = false): ChapterState => ({
  version: 1,
  legacyRoad,
  scenes: [],
  arena: "ready",
  checkpoint: false,
});
export const CHAPTER_SCENES = [
  "bizel-intro",
  "kharn-intro",
  "kharn-phase-2",
  "kharn-phase-3",
  "kharn-outro",
];
export const KHARN_ID = 310,
  BIZEL_ID = 300;
export function chapterEnemy(
  id: number,
  x: number,
  y: number,
  hp: number,
  appearance: Enemy["appearance"],
  name: string,
  boss = false,
): Enemy {
  return {
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
    appearance,
    name,
    boss,
  };
}
export const ruinEnemies = () => [
  chapterEnemy(301, 5, 19, 155, "sentinel", "Vigia do Prisma Azul"),
  chapterEnemy(302, 23, 13, 185, "sentinel", "Vigia do Prisma Violeta"),
  chapterEnemy(303, 14, 15, 125, "sentinel", "Eco de pedra"),
  chapterEnemy(304, 16, 13, 125, "sentinel", "Eco de pedra"),
  chapterEnemy(KHARN_ID, 14, 5, 720, "kharn", "Kharn", true),
];
export const bizelEnemy = () =>
  chapterEnemy(BIZEL_ID, 23, 19, 260, "bizel", "Bizel", true);
const shot = (
  duration: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
  speaker: string,
  text: string,
  extra: Partial<Shot> = {},
) => ({ duration, from, to, zoom: 1, speaker, text, ...extra });
const defaultHall = { x: 14, y: 6 },
  entrance = { x: 14, y: 8 };
export const chapterScene = (
  id: string,
  player: { x: number; y: number },
  boss?: { x: number; y: number },
  knownFerrugem = false,
): Scene => {
  const hall = boss ? { x: boss.x, y: boss.y } : defaultHall;
  const shots: Record<string, Scene["shots"]> = {
    "bizel-intro": [
      shot(
        3,
        player,
        hall,
        "BIZEL",
        "Você seguiu as marcas até aqui. Volte para a vila.",
        { actor: "idle", music: "narrative" },
      ),
      shot(
        3,
        hall,
        player,
        "ECO",
        "As marcas estavam junto às casas atacadas. Preciso saber onde levam.",
      ),
      shot(
        3,
        player,
        hall,
        "BIZEL",
        "Há uma porta nas ruínas. Ninguém deveria tê-la tocado.",
        { pulse: true },
      ),
    ],
    "kharn-intro": [
      shot(
        5,
        entrance,
        { x: 14, y: 3 },
        "ECO",
        "O salão inteiro foi construído ao redor daquele selo.",
        {
          zoom: 0.85,
          music: "silence",
          actor: "walk",
          actorTo: { x: 14, y: 7 },
          bossPose: "rise",
        },
      ),
      shot(
        4,
        { x: 14, y: 3 },
        hall,
        "NARRAÇÃO",
        "Sob a pedra rachada, a luz ainda pulsa.",
        { zoom: 1.2, pulse: true, bossPose: "rise", music: "threshold" },
      ),
      shot(
        4,
        hall,
        hall,
        "KHARN",
        "Não dê outro passo. Enquanto eu resistir, o selo permanece.",
        { bossPose: "guard", music: "narrative" },
      ),
      shot(
        3,
        hall,
        entrance,
        "ECO",
        "A corrupção chegou a Pedralta. O que você está protegendo?",
      ),
      shot(
        3,
        entrance,
        hall,
        "KHARN",
        "Aquilo que não pode voltar às mãos de quem o procura.",
        { bossPose: "guard", pulse: true },
      ),
      shot(3, hall, player, "NARRAÇÃO", "KHARN · O GUARDIÃO", {
        zoom: 1,
        bossPose: "guard",
        music: "boss",
      }),
    ],
    "kharn-phase-2": [
      shot(2, hall, hall, "KHARN", "A pedra desperta. Meu dever permanece.", {
        pulse: true,
        bossPose: "guard",
        music: "boss2",
      }),
    ],
    "kharn-phase-3": [
      shot(2, hall, hall, "KHARN", "Mesmo partido, o selo não será entregue.", {
        pulse: true,
        bossPose: "guard",
        music: "boss3",
      }),
    ],
    "kharn-outro": [
      shot(4, player, hall, "ECO", "Ele parou de atacar. Ainda está de pé…", {
        music: "silence",
        bossPose: "kneel",
      }),
      shot(
        5,
        hall,
        { x: 14, y: 3 },
        "KHARN",
        "Eu guardava este fragmento. A corrupção não começou nestas ruínas.",
        { pulse: true, bossPose: "kneel", music: "narrative" },
      ),
      shot(
        5,
        { x: 14, y: 3 },
        hall,
        "KHARN",
        "Outros foram retirados. As marcas de transporte levam às caldeiras.",
        { bossPose: "kneel" },
      ),
      shot(
        4,
        hall,
        player,
        "ECO",
        knownFerrugem
          ? "A rota confirma as marcas das caldeiras. Elcio precisa saber o que Kharn guardava."
          : "Ferrugem. Preciso encontrar quem conhece essas máquinas.",
        { bossPose: "kneel", music: "victory" },
      ),
    ],
  };
  return {
    id,
    title: (
      {
        "bizel-intro": "As marcas de Bizel",
        "kharn-intro": "O salão esquecido",
        "kharn-phase-2": "O Despertar",
        "kharn-phase-3": "O Último Dever",
        "kharn-outro": "O selo partido",
      } as Record<string, string>
    )[id],
    shots: shots[id],
  };
};
export const CHAPTER_RECORDS: Record<string, string> = {
  "ash-record":
    "Registro chamuscado: Bizel passou pela trilha leste depois dos ataques.",
  "bizel-record": "Mapa de Bizel: entrada isolada ao norte da Margem de Kharn.",
  "ruins-record":
    "Vestíbulo: os condutores azul e violeta mantêm o salão isolado.",
  oath: "Registro dos condutores: o dever de Kharn está ligado ao selo.",
  "core-record":
    "Registro do Núcleo: um fragmento permanece isolado; a corrupção pressiona a estrutura pelo lado de fora.",
  "kharn-revelation":
    "Kharn guardava o fragmento. Marcas dos carregamentos apontam para as caldeiras de Ferrugem; a corrupção não começou nestas ruínas.",
};
export const CHAPTER_REQUIREMENTS: Record<string, string[]> = {
  "ash-record": ["talk:lenir"],
  "talk:witness": ["ash-record"],
  "defeat:300": ["talk:witness"],
  "bizel-record": ["defeat:300"],
  "report:lenir": ["talk:lenir", "bizel-record"],
  "enter:ruins": ["report:lenir"],
  "ruins-record": ["enter:ruins"],
  "defeat:301": ["enter:ruins"],
  "defeat:302": ["enter:ruins"],
  "prism-blue": ["ruins-record", "defeat:301"],
  oath: ["prism-blue"],
  "prism-violet": ["oath", "defeat:302"],
  "core-record": ["prism-violet"],
  "arena-open": ["core-record", "prism-blue", "prism-violet"],
  "defeat:310": ["arena-open"],
  "kharn-revelation": ["defeat:310"],
  arena: ["core-record", "prism-blue", "prism-violet"],
};
