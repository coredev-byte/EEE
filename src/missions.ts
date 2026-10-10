import type { Exploration, RegionId } from "./regions";
import type { Quest } from "./state";
import type { ObjectiveKind } from "./objectives";

export type MissionStatus = "bloqueada" | "disponível" | "ativa" | "concluída";
export interface MissionStep {
  text: string;
  events: string[];
  region: RegionId;
  target: string;
  kind: ObjectiveKind;
}
export interface MissionDefinition {
  id: string;
  name: string;
  description: string;
  context: string;
  origin: RegionId;
  starter: string;
  chapter: string;
  main: boolean;
  prerequisites: string[];
  steps: MissionStep[];
  reward: {
    xp: number;
    coins: number;
    item?: string;
    potions?: number;
    consequence?: string;
  };
}
const step = (
  text: string,
  events: string[],
  target: string,
  kind: ObjectiveKind,
  region: RegionId = "ferrugem",
): MissionStep => ({ text, events, target, kind, region });
export const MISSIONS: MissionDefinition[] = [
  {
    id: "eco",
    name: "O Eco de Kharn",
    description: "Investigue o selo e proteja Pedralta.",
    context: "Um eco sob as ruínas responde aos ataques na vila.",
    origin: "pedralta",
    starter: "Guardiã do Eco",
    chapter: "I · O Selo Partido",
    main: true,
    prerequisites: [],
    steps: [
      step(
        "Encontrar a entrada das ruínas",
        [],
        "portal-22-7",
        "investigate",
        "pedralta",
      ),
      step("Derrotar três ameaças da vila", [], "enemy", "defeat", "pedralta"),
      step(
        "Interagir com o selo de Kharn",
        [],
        "portal-22-7",
        "interact",
        "pedralta",
      ),
    ],
    reward: { xp: 200, coins: 250, item: "runa" },
  },
  {
    id: "memories",
    name: "As Memórias da Margem",
    description: "Restaure os três marcos e entregue as memórias.",
    context:
      "Iria revela que o selo era uma ponte, e não uma prisão. Os vigias protegem memórias anteriores à Ruptura.",
    origin: "kharn",
    starter: "Iria · cartógrafa",
    chapter: "I · As memórias do selo",
    main: true,
    prerequisites: ["eco"],
    steps: [
      step("Entrar na Margem de Kharn", [], "portal-22-7", "reach", "pedralta"),
      step("Conversar com Iria", [], "npc-6-20", "talk", "kharn"),
      ...["Vigia", "Canal", "Memória"].map((name, i) =>
        step(
          `Marco da ${name}`,
          [],
          ["statue-8-16", "statue-18-15", "statue-22-7"][i],
          "interact",
          "kharn",
        ),
      ),
      step(
        "Entregar as memórias à Guardiã",
        [],
        "npc-10-14",
        "talk",
        "pedralta",
      ),
    ],
    reward: { xp: 300, coins: 180, item: "amuleto" },
  },
  {
    id: "machines",
    name: "Máquinas Mortas",
    description:
      "Investigue as caldeiras e o transporte de fragmentos do Núcleo.",
    context:
      "As memórias contêm uma rota de transporte. Elcio reconhece máquinas que ainda obedecem a ordens da Ruptura; a Fornalha impede o acesso aos registros.",
    origin: "ferrugem",
    starter: "Estrada das Caldeiras / Elcio",
    chapter: "II · Máquinas Mortas",
    main: true,
    prerequisites: ["memories"],
    steps: [
      step(
        "Siga a Estrada das Caldeiras até Ferrugem · F",
        ["enter:ferrugem"],
        "portal-24-18",
        "reach",
      ),
      step(
        "Converse com Elcio no pátio sul · F",
        ["talk:elcio"],
        "npc-6-20",
        "talk",
      ),
      step(
        "Recupere a engrenagem no pátio de sucata · F",
        ["gear"],
        "crate-8-18",
        "collect",
      ),
      step(
        "Recupere o fusível no canal leste · F",
        ["fuse"],
        "crate-17-16",
        "collect",
      ),
      step(
        "Conserte a bomba e resfrie o portão · F",
        ["pump"],
        "fountain-17-12",
        "interact",
      ),
      step(
        "Leia o manifesto junto ao portão térmico · F",
        ["manifest"],
        "crate-20-11",
        "investigate",
      ),
      step(
        "Derrote o Mestre da Fornalha",
        ["defeat:203"],
        "enemy:203",
        "defeat",
      ),
      step(
        "Entregue o manifesto a Elcio · F",
        ["report:machines"],
        "npc-6-20",
        "talk",
      ),
    ],
    reward: {
      xp: 420,
      coins: 240,
      item: "anel-cobre",
      consequence: "furnace-safe",
    },
  },
  {
    id: "workers",
    name: "Vozes no Depósito",
    description: "Encontre Nara, desaparecida durante o último turno.",
    context:
      "Elcio ouviu batidas no depósito abandonado. Um diário pode revelar quem ficou preso quando o Sucateiro Voraz tomou o pátio.",
    origin: "ferrugem",
    starter: "Elcio",
    chapter: "SECUNDÁRIA",
    main: false,
    prerequisites: ["talk:elcio"],
    steps: [
      step(
        "Leia o diário no depósito oeste · F",
        ["worker-log"],
        "crate-9-14",
        "investigate",
      ),
      step(
        "Elimine o Sucateiro Voraz do depósito",
        ["defeat:204"],
        "enemy:204",
        "defeat",
      ),
      step(
        "Encontre Nara junto ao depósito · F",
        ["talk:nara"],
        "npc-11-11",
        "talk",
      ),
      step(
        "Conte a Elcio que Nara está segura · F",
        ["report:workers"],
        "npc-6-20",
        "talk",
      ),
    ],
    reward: { xp: 180, coins: 100, item: "couraça", consequence: "merchant" },
  },
  {
    id: "bridge",
    name: "Uma Ponte para Casa",
    description: "Restaure a passarela sobre o canal de refrigeração.",
    context:
      "O caminho longo separa o abrigo das oficinas. Uma manivela perdida permite recolocar a passarela e reduzir o percurso de retorno.",
    origin: "ferrugem",
    starter: "Elcio",
    chapter: "SECUNDÁRIA",
    main: false,
    prerequisites: ["talk:elcio"],
    steps: [
      step(
        "Recupere a manivela no armazém sul · F",
        ["crank"],
        "crate-7-16",
        "collect",
      ),
      step(
        "Acione o guincho da passarela · F",
        ["bridge"],
        "bench-13-20",
        "interact",
      ),
    ],
    reward: { xp: 100, coins: 60, potions: 1, consequence: "bridge" },
  },
];
export const EVENT_IDS = [
  "enter:ferrugem",
  "talk:elcio",
  "gear",
  "fuse",
  "pump",
  "manifest",
  "defeat:203",
  "defeat:204",
  "report:machines",
  "worker-log",
  "talk:nara",
  "report:workers",
  "crank",
  "bridge",
  "site:depot",
  "site:canal",
  "site:furnace",
  "site:cache",
];
export interface MissionView {
  definition: MissionDefinition;
  status: MissionStatus;
  stage: number;
  done: boolean[];
}
export function missionViews(e: Exploration, q: Quest): MissionView[] {
  const completed = new Set(e.journal.completed);
  if (q.rewardClaimed) completed.add("eco");
  if (e.campaign.rewardClaimed) completed.add("memories");
  return MISSIONS.map((definition) => {
    let done = definition.steps.map((s) =>
      s.events.every((id) => e.journal.events.includes(id)),
    );
    if (definition.id === "eco")
      done = [q.stage >= 1, q.kills >= 3, q.rewardClaimed];
    if (definition.id === "memories")
      done = [
        e.campaign.entered,
        e.campaign.accepted,
        ...["vigia", "canal", "memoria"].map((id) =>
          e.campaign.attuned.includes(id),
        ),
        e.campaign.rewardClaimed,
      ];
    const first = done.findIndex((yes) => !yes),
      stage = first === -1 ? done.length : first;
    const unlocked = definition.prerequisites.every(
      (id) => completed.has(id) || e.journal.events.includes(id),
    );
    const active =
      definition.id === "eco"
        ? q.stage > 0 || q.accepted
        : definition.id === "memories"
          ? e.campaign.entered
          : e.journal.accepted.includes(definition.id);
    return {
      definition,
      done,
      stage,
      status: completed.has(definition.id)
        ? "concluída"
        : !unlocked
          ? "bloqueada"
          : active
            ? "ativa"
            : "disponível",
    };
  });
}
export function selectedMission(
  e: Exploration,
  q: Quest,
): MissionView | undefined {
  const views = missionViews(e, q);
  return (
    views.find(
      (v) => v.definition.id === e.journal.tracked && v.status === "ativa",
    ) ??
    views.find(
      (v) => v.definition.main && ["ativa", "disponível"].includes(v.status),
    )
  );
}
export function acceptMission(e: Exploration, q: Quest, id: string) {
  const v = missionViews(e, q).find((v) => v.definition.id === id);
  if (!v || v.status !== "disponível" || ["eco", "memories"].includes(id))
    return false;
  e.journal.accepted.push(id);
  return true;
}
export function recordMissionEvent(e: Exploration, event: string) {
  if (!EVENT_IDS.includes(event) || e.journal.events.includes(event))
    return false;
  e.journal.events.push(event);
  return true;
}
export function validJournal(e: Exploration) {
  const j = e.journal;
  if (
    (e.changes.includes("pump") && !j.events.includes("pump")) ||
    (e.changes.includes("bridge") && !j.events.includes("bridge")) ||
    (e.changes.includes("nara-safe") && !j.events.includes("talk:nara"))
  )
    return false;
  if (e.changes.includes("merchant") && !j.completed.includes("workers"))
    return false;
  if (e.changes.includes("furnace-safe") && !j.completed.includes("machines"))
    return false;
  if (
    !j ||
    ![j.events, j.accepted, j.completed].every(
      (l) => Array.isArray(l) && new Set(l).size === l.length,
    )
  )
    return false;
  if (j.events.some((id) => !EVENT_IDS.includes(id))) return false;
  const ids = MISSIONS.filter((m) => !["eco", "memories"].includes(m.id)).map(
    (m) => m.id,
  );
  if ([...j.accepted, ...j.completed].some((id) => !ids.includes(id)))
    return false;
  if (!(j.tracked === null || ids.includes(j.tracked))) return false;
  if (j.accepted.length && !e.campaign.rewardClaimed) return false;
  if (
    j.completed.some(
      (id) =>
        !j.accepted.includes(id) ||
        !MISSIONS.find((m) => m.id === id)!.steps.every((s) =>
          s.events.every((event) => j.events.includes(event)),
        ),
    )
  )
    return false;
  if (
    j.events.includes("pump") &&
    !["talk:elcio", "gear", "fuse"].every((id) => j.events.includes(id))
  )
    return false;
  if (j.events.includes("bridge") && !j.events.includes("crank")) return false;
  if (e.bosses.some((id) => !["ferrugem:203", "ferrugem:204"].includes(id)))
    return false;
  if (
    e.changes.some(
      (id) =>
        !["pump", "bridge", "merchant", "furnace-safe", "nara-safe"].includes(
          id,
        ),
    )
  )
    return false;
  return true;
}
