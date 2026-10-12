export interface Hint {
  id: string;
  text: string;
  priority: number;
  min: number;
  max: number;
  target: string;
}
export const HINTS: Hint[] = [
  {
    id: "move",
    text: "W A S D · Caminhe pela trilha. Shift permite correr.",
    target: "",
    priority: 10,
    min: 3,
    max: 12,
  },
  {
    id: "guardian",
    text: "Procure a Guardiã junto à trilha. Aproxime-se e pressione F para conversar.",
    target: ".minimap-box",
    priority: 10,
    min: 3,
    max: 12,
  },
  {
    id: "explore",
    text: "O marcador no minimapa aponta para as ruínas. Explore a trilha até encontrar o selo.",
    target: ".minimap-box",
    priority: 10,
    min: 3,
    max: 12,
  },
  {
    id: "combat",
    text: "Clique para atacar. Leia o movimento do inimigo e saia do alcance antes do golpe.",
    target: "",
    priority: 20,
    min: 3,
    max: 12,
  },
  {
    id: "skills",
    text: "Use habilidades com 1 e 2. Observe a mana e aguarde a recarga de cada habilidade.",
    target: "#skillbar",
    priority: 20,
    min: 3,
    max: 12,
  },
  {
    id: "potions",
    text: "Z recupera vida, X recupera mana e V recupera ambas. Use somente quando precisar.",
    target: "#quickbar",
    priority: 20,
    min: 3,
    max: 12,
  },
  {
    id: "chest",
    text: "Aproxime-se de um baú e use F. Os itens entram na mochila.",
    target: ".minimap-box",
    priority: 10,
    min: 3,
    max: 12,
  },
  {
    id: "inventory",
    text: "I abre a mochila. Selecione e compare um equipamento; você decide se deve equipá-lo.",
    target: "#quickbar",
    priority: 10,
    min: 3,
    max: 12,
  },
  {
    id: "journal",
    text: "J abre o diário: acompanhe O Eco de Kharn e seu próximo objetivo.",
    target: ".quest-hud",
    priority: 10,
    min: 3,
    max: 12,
  },
  {
    id: "classes",
    text: "C mostra seu caminho e as outras classes. Não é preciso mudar de classe.",
    target: ".portrait-frame",
    priority: 10,
    min: 3,
    max: 12,
  },
  {
    id: "tree",
    text: "K mostra as habilidades. Os pontos vêm da progressão real; não é preciso gastar agora.",
    target: "#skillbar",
    priority: 10,
    min: 3,
    max: 12,
  },
  {
    id: "threats",
    text: "Proteja Pedralta: derrote as três ameaças da missão. Elas contam para o selo existente.",
    target: ".quest-hud",
    priority: 10,
    min: 3,
    max: 12,
  },
  {
    id: "seal",
    text: "Com as três ameaças silenciadas, aproxime-se do selo e pressione F.",
    target: ".minimap-box",
    priority: 10,
    min: 3,
    max: 12,
  },
];
/** One visible hint, temporary dwell, quiet interval and replay without erasing history. */
export class TutorialHints {
  active: Hint | null = null;
  elapsed = 0;
  quiet = 0;
  update(dt: number, candidates: Hint[], seen: string[], replay = false) {
    this.elapsed += dt;
    this.quiet = Math.max(0, this.quiet - dt);
    if (
      this.active &&
      (this.elapsed >= this.active.max ||
        (!candidates.some((h) => h.id === this.active!.id) &&
          this.elapsed >= this.active.min))
    ) {
      this.active = null;
      this.elapsed = 0;
      this.quiet = 10;
    }
    if (!this.active && !this.quiet) {
      this.active =
        [...candidates]
          .sort((a, b) => b.priority - a.priority)
          .find((h) => replay || !seen.includes(h.id)) ?? null;
      this.elapsed = 0;
      if (this.active && !seen.includes(this.active.id))
        seen.push(this.active.id);
    }
  }
  reset() {
    this.active = null;
    this.elapsed = 0;
    this.quiet = 0;
  }
}
