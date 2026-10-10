import type { Game } from "./game";
import { missionViews, selectedMission } from "./missions";
import {
  REGIONS,
  WORLD_DISTRICTS,
  PASSAGES,
  passageKey,
  passageOpen,
} from "./regions";
import { ITEMS } from "./data";
const action = (label: string, name: string) =>
  `<button class="secondary" data-action="${name}">${label}</button>`;
export function missionJournal(g: Game) {
  const selected = selectedMission(g.exploration, g.quest);
  return (
    `<div class="journal-summary"><p>${g.objective()}</p><small>Escolha uma missão ativa para rastrear. As secundárias são opcionais.</small></div>` +
    missionViews(g.exploration, g.quest)
      .map((v) => {
        const m = v.definition;
        const legacy = ["eco", "memories"].includes(m.id);
        return `<article class="quest-detail ${m.id === "memories" ? "campaign-detail" : ""} mission-card" data-mission="${m.id}"><div class="quest-stamp">${m.chapter} · ${v.status.toUpperCase()} ${selected?.definition.id === m.id ? "· RASTREADA" : ""}</div><h3>${m.name}</h3><p>${m.description}</p><p>${m.context}</p><small>Origem: ${REGIONS[m.origin].name} · ${m.starter}</small>${v.status === "bloqueada" ? `<p class="subtle">Pré-requisito: ${m.prerequisites.map((id) => (id === "talk:elcio" ? "Conversar com Elcio" : (missionViews(g.exploration, g.quest).find((x) => x.definition.id === id)?.definition.name ?? id))).join(", ")}</p>` : `<ol class="quest-steps">${m.steps.map((s, i) => `<li class="${v.done[i] ? "done" : i === v.stage ? "active" : ""}">${s.text}<span>${v.done[i] ? "CONCLUÍDO" : i === v.stage ? "EM ANDAMENTO" : "PENDENTE"}</span></li>`).join("")}</ol>`}<div class="rewards"><span>${m.reward.xp} XP</span><span>${m.reward.coins} MOEDAS</span>${m.reward.item ? `<span>${ITEMS.find((i) => i.id === m.reward.item)!.name}</span>` : ""}${m.reward.potions ? `<span>${m.reward.potions} POÇÃO</span>` : ""}</div>${v.status === "disponível" && !legacy ? action("ACEITAR MISSÃO", `mission-accept:${m.id}`) : v.status === "ativa" && !legacy ? action("RASTREAR MISSÃO", `mission-track:${m.id}`) : ""}${v.status === "concluída" ? '<p class="completed-banner">MISSÃO CONCLUÍDA · RECOMPENSA RECEBIDA</p>' : ""}</article>`;
      })
      .join("") +
    `<section class="world-journal"><h3>Regiões e caminhos</h3>${WORLD_DISTRICTS.map((r) => `<p>${r.name} <small>${!r.playable ? "SEM PASSAGEM DISPONÍVEL" : g.exploration.visited.includes(r.id) ? "DESCOBERTA" : "NÃO VISITADA"}</small></p>`).join("")}${PASSAGES.filter(
      (p) => g.exploration.knownPassages.includes(passageKey(p)),
    )
      .map(
        (p) =>
          `<p>${p.name} → ${REGIONS[p.destination].name}<small>${passageOpen(p, g.exploration, g.quest.rewardClaimed) ? "ABERTA" : p.blocked}</small></p>`,
      )
      .join(
        "",
      )}</section><section class="world-journal"><h3>Registros e componentes</h3>${
      g.exploration.journal.events
        .filter((id) =>
          ["gear", "fuse", "crank", "worker-log", "manifest"].includes(id),
        )
        .map(
          (id) =>
            `<p>${({ gear: "Engrenagem intacta", fuse: "Fusível de cobre", crank: "Manivela da ponte", "worker-log": "Diário de Nara", manifest: "Manifesto: fragmentos do Núcleo enviados ao Jardim do Véu" } as Record<string, string>)[id]}<small>${(["gear", "fuse"].includes(id) && g.exploration.changes.includes("pump")) || (id === "crank" && g.exploration.changes.includes("bridge")) ? "INSTALADO" : "RECUPERADO"}</small></p>`,
        )
        .join("") || "<p>Nenhum registro industrial encontrado.</p>"
    }</section>`
  );
}
export function ferrugemDialogue(g: Game) {
  const views = missionViews(g.exploration, g.quest);
  if (g.dialogueNPC === "nara")
    return `<div class="dialogue-panel"><p>As máquinas ainda obedeciam aos carregamentos do Núcleo. Eu vi caixas partindo para o Jardim do Véu. Obrigada por abrir a saída; vou ajudar Elcio no abrigo.</p>${action("VOLTAR AO PÁTIO", "close")}</div>`;
  const main = views.find((v) => v.definition.id === "machines")!;
  const text =
    main.status === "concluída"
      ? "A Fornalha calou. O manifesto não deixa dúvida: os fragmentos do Núcleo saíram daqui rumo ao Jardim do Véu. Não sabemos quem assinou as ordens — o nome foi apagado. Vou manter o abrigo e a bomba funcionando enquanto você investiga."
      : main.stage === 7
        ? "A Fornalha silenciou. Mostre o manifesto: precisamos saber o que estas máquinas carregavam."
        : "As máquinas não morreram com a cidade: continuam executando as ordens da Ruptura. Recupere a engrenagem no pátio oeste e o fusível do canal leste. Instale ambos na bomba ao norte: ela resfria o portão da Fornalha. Leia o manifesto junto ao portão antes de enfrentar o Mestre. Há gente desaparecida no depósito e uma passarela quebrada ao sul, se puder ajudar.";
  return `<div class="dialogue-panel"><p>${text}</p><div class="mission-offers">${views
    .filter(
      (v) => !v.definition.main && ["disponível", "ativa"].includes(v.status),
    )
    .map(
      (v) =>
        `<p><strong>${v.definition.name}</strong> · ${v.definition.description}</p>${action(v.status === "disponível" ? "ACEITAR: " + v.definition.name : "RASTREAR: " + v.definition.name, `${v.status === "disponível" ? "mission-accept" : "mission-track"}:${v.definition.id}`)}`,
    )
    .join(
      "",
    )}</div>${g.exploration.changes.includes("merchant") ? `<p>Nara trouxe as provisões do depósito. Poção de vida: 50 moedas.</p>${action("COMPRAR POÇÃO · 50 MOEDAS", "mission-buy")}` : ""}${action("VOLTAR AO PÁTIO", "close")}</div>`;
}
