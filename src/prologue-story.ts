import type { Point } from "./world";
export interface Shot {
  duration: number;
  from: Point;
  to: Point;
  zoom: number;
  speaker: string;
  text: string;
  pulse?: boolean;
  fade?: boolean;
}
export interface Scene {
  id: string;
  title: string;
  shots: Shot[];
}
const spawn = { x: 12, y: 12 },
  seal = { x: 22, y: 7 },
  village = { x: 10, y: 14 };
export const SCENES: Scene[] = [
  {
    id: "silence",
    title: "Antes do silêncio",
    shots: [
      {
        duration: 5,
        from: seal,
        to: { x: 19, y: 8 },
        zoom: 0.85,
        speaker: "NARRAÇÃO",
        text: "As pedras ficaram. As vozes, não.",
        fade: true,
      },
      {
        duration: 4,
        from: { x: 19, y: 8 },
        to: seal,
        zoom: 1,
        speaker: "NARRAÇÃO",
        text: "Pedralta aprendeu a escutar o silêncio.",
      },
    ],
  },
  {
    id: "signal",
    title: "O sinal",
    shots: [
      {
        duration: 5,
        from: seal,
        to: seal,
        zoom: 1.15,
        speaker: "ECO",
        text: "Alguma coisa ainda responde.",
        pulse: true,
      },
    ],
  },
  {
    id: "awakening",
    title: "Despertar",
    shots: [
      {
        duration: 6,
        from: seal,
        to: spawn,
        zoom: 1,
        speaker: "ECO",
        text: "Primeiro, preciso encontrar quem ainda vive aqui.",
      },
    ],
  },
  {
    id: "anomaly",
    title: "Algo fora do lugar",
    shots: [
      {
        duration: 5,
        from: village,
        to: seal,
        zoom: 1,
        speaker: "ECO",
        text: "O vento parou. O eco continuou.",
        pulse: true,
      },
    ],
  },
  {
    id: "threat",
    title: "Primeiro Eco",
    shots: [
      {
        duration: 4,
        from: seal,
        to: { x: 19, y: 10 },
        zoom: 1,
        speaker: "ECO",
        text: "Ainda há uma ameaça entre a vila e o selo.",
      },
    ],
  },
  {
    id: "evidence",
    title: "A memória",
    shots: [
      {
        duration: 6,
        from: seal,
        to: seal,
        zoom: 1.1,
        speaker: "ECO",
        text: "Uma memória. Não uma resposta.",
        pulse: true,
      },
    ],
  },
  {
    id: "handover",
    title: "Além do selo",
    shots: [
      {
        duration: 5,
        from: seal,
        to: spawn,
        zoom: 1,
        speaker: "ECO",
        text: "Kharn está além do selo. A Guardiã ainda espera notícias.",
      },
    ],
  },
];
export const GUARDIAN_PROLOGUE = [
  "Você também ouviu? Pensei que fosse só o vento nas pedras.",
  "O selo de Kharn voltou a responder. Há três ameaças no caminho. Ajude a manter a vila segura antes de tocá-lo.",
  "Procure o baú perto da trilha. Leve o que lhe servir. E volte vivo: eu ainda preciso saber o que há do outro lado.",
];

/** Revisits respond to the actual official quest, never to tutorial-only kills. */
export function guardianPrologueLine(
  step: number,
  kills: number,
  chests: number,
) {
  if (step === 0 && kills >= 3)
    return "A trilha está mais silenciosa. As três ameaças caíram; veja se o selo responde ao seu toque.";
  if (step === 0 && kills > 0)
    return "Ouvi o confronto. Você abriu parte do caminho, mas ainda há ameaças na vila.";
  if (step === 2 && chests > 0)
    return "Vejo que encontrou os suprimentos. Escolha o que lhe servir e volte vivo. Ainda precisamos de notícias de Kharn.";
  return GUARDIAN_PROLOGUE[Math.min(2, step)];
}
