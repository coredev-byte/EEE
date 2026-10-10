import { CLASSES } from "./data";
import {
  BRANCHES,
  NODES,
  NODE_BY_ID,
  profile,
  owns,
  points,
  investment,
  requirements,
  effectiveSkill,
  respecCost,
  spent,
  RESOURCES,
  type Node,
} from "./skills";
import type { Game } from "./game";
const icon = (n: Node) =>
  `<span class="item-icon" style="background-position:-${n.icon * 48}px 0" aria-hidden="true"></span>`;
const control = (label: string, action: string, disabled = false) =>
  `<button data-tree-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>`;
export function skillPanel(g: Game, selected: string, preview = false) {
  const p = g.player,
    b = profile(p),
    nodes = NODES.filter((n) => n.classId === p.classId),
    n =
      NODE_BY_ID.get(selected)?.classId === p.classId
        ? NODE_BY_ID.get(selected)!
        : nodes.find((n) => n.branch === 0)!;
  const skill = n.skill ? effectiveSkill(p, n.id) : null,
    errors = requirements(p, n),
    learned = owns(p, n.id);
  const button = (node: Node) =>
    `<button data-node="${node.id}" class="tree-node ${owns(p, node.id) ? "learned" : requirements(p, node).length ? "blocked" : "available"} ${node.id === n.id ? "selected" : ""} ${node.type === "ultimate" ? "ultimate" : ""}" style="--node-color:${node.color}" aria-label="${node.name}" aria-pressed="${node.id === n.id}" title="${node.name} · ${owns(p, node.id) ? "Aprendida" : requirements(p, node).join(" · ") || "Disponível"}">${icon(node)}<span>${node.name}</span><small>${node.type === "passive" ? "PASSIVA" : node.type === "ultimate" ? "SUPREMA" : node.type === "mastery" ? "MAESTRIA" : node.type === "hybrid" ? "CONEXÃO" : "ATIVA"} · N${node.level}</small></button>`;
  const buildDiff = (slot: number) => {
    const saved = b.presets[slot];
    if (!saved) return "Espaço vazio";
    const add = saved.nodes.filter((x) => !b.nodes.includes(x)).length,
      remove = b.nodes.filter((x) => !saved.nodes.includes(x)).length;
    return `${spent(saved)} pontos · +${add} nós / −${remove} nós · entra: ${
      saved.nodes
        .filter((x) => !b.nodes.includes(x))
        .map((x) => NODE_BY_ID.get(x)!.name)
        .join(", ") || "nenhum"
    } · sai: ${
      b.nodes
        .filter((x) => !saved.nodes.includes(x))
        .map((x) => NODE_BY_ID.get(x)!.name)
        .join(", ") || "nenhum"
    } · ${saved.bar
      .filter(Boolean)
      .map((x) => NODE_BY_ID.get(x!)!.name)
      .join(", ")}`;
  };
  return `<div class="tree-summary"><div class="class-art ${p.classId}"></div><div><small>SEU CAMINHO</small><h3>${CLASSES[p.classId].name} · Nível ${p.level}/60</h3><p>${points(p)} pontos disponíveis · ${spent(b)}/${Math.min(59, p.level - 1)} investidos · ${RESOURCES[p.classId]} ${Math.floor(p.classId === "arcanista" ? p.mp : p.resource)}</p></div><div class="tree-slots">${b.bar.map((id, i) => `<span><kbd>${i + 1}</kbd>${id ? NODE_BY_ID.get(id)!.name : "Vazio"}</span>`).join("")}</div></div>
 <div class="tree-layout"><div class="tree-explorer"><div class="foundation"><h4>FUNDAMENTOS · seus poderes anteriores</h4><div>${nodes
   .filter((n) => n.branch === -1)
   .map(button)
   .join("")}</div></div>
 <div class="tree-branches">${BRANCHES.filter((b) => b.classId === p.classId)
   .map((branch) => {
     const main = nodes.filter(
       (n) =>
         n.branch === branch.index &&
         ["active", "passive", "ultimate"].includes(n.type),
     );
     return `<section class="tree-branch" style="--branch-color:${branch.color}"><h3><span>${["◆", "✦", "⌘"][branch.index]}</span> ${branch.name}</h3><p>${branch.role}</p><small>${investment(p, branch.index)} NÓS INVESTIDOS</small><div class="branch-paths"><svg viewBox="0 0 300 570" preserveAspectRatio="none" aria-hidden="true">${main
       .flatMap((node) =>
         node.parents.map((parent) => {
           const a = NODE_BY_ID.get(parent)!;
           return `<line x1="${(a.index % 3) * 100 + 50}" y1="${Math.floor(a.index / 3) * 110 + 45}" x2="${(node.index % 3) * 100 + 50}" y2="${Math.floor(node.index / 3) * 110 + 45}" class="${owns(p, parent) ? "lit" : ""}"/>`;
         }),
       )
       .join(
         "",
       )}</svg><div class="branch-grid">${main.map(button).join("")}</div></div><div class="branch-mastery">${nodes
       .filter((n) => n.branch === branch.index && n.type === "mastery")
       .map(button)
       .join("")}</div></section>`;
   })
   .join(
     "",
   )}</div><section class="tree-hybrids"><svg viewBox="0 0 300 45" aria-hidden="true"><path d="M50 0 L50 10 L50 40 M150 0 L50 40 M50 0 L150 40 M250 0 L150 40 M150 0 L250 40 M250 0 L250 40"/></svg><h4>CONEXÕES ENTRE RAMOS · quatro nós em cada ramo envolvido</h4><div>${nodes
   .filter((n) => n.type === "hybrid")
   .map(button)
   .join("")}</div></section></div>
 <aside class="tree-detail"><small>${{ active: "ATIVA", passive: "PASSIVA", ultimate: "SUPREMA", upgrade: "MELHORIA", hybrid: "CONEXÃO", mastery: "MAESTRIA" }[n.type]} / ${n.branch >= 0 ? BRANCHES.find((x) => x.classId === p.classId && x.index === n.branch)!.name : "FUNDAMENTOS & CONEXÕES"}</small><h3>${n.name}</h3><p>${n.description}</p>${skill ? `<div class="tree-numbers"><span>${skill.cost} MP / Essência</span><span>${skill.cooldown.toFixed(1)}s recarga</span>${!["buff", "guard", "stealth", "mark", "duplicate", "cleanse"].includes(n.mechanic ?? skill.kind) ? `<span>${Math.round(skill.damage)} ${skill.kind === "heal" ? "cura" : `dano base + ${skill.kind === "projectile" ? 35 : 30}% ataque`}</span>` : ""}<span>${skill.range.toFixed(1)} alcance</span><span>Animação: ${skill.kind === "dash" || skill.kind === "slash" ? "golpe" : "conjuração"} · ${{ strike: "impacto", projectile: "projétil", dash: "investida", guard: "proteção", buff: "fortalecimento", stealth: "furtividade", mark: "marca", zone: "campo", trap: "armadilha", turret: "dispositivo", detonate: "detonação", duplicate: "duplicação", cleanse: "purificação", pull: "atração", channel: "canalização", multi: "sequência", slash: "corte", nova: "área", heal: "cura" }[n.mechanic ?? skill.kind]}</span>${n.type === "ultimate" ? `<span>Suprema: ${p.classId === "assassino" ? 8 : 60} ${RESOURCES[p.classId]} · uma equipada</span>` : ""}</div>` : '<p class="subtle">Efeito automático ao cumprir as condições descritas. Permanece ativo nesta build.</p>'}
 <div class="tree-requirements"><strong>${learned ? "APRENDIDA" : errors.length ? "REQUISITOS PENDENTES" : "DISPONÍVEL"}</strong><span>Nível ${n.level} · ${n.cost} ponto${n.cost === 1 ? "" : "s"}</span>${errors.map((x) => `<span>◇ ${x}</span>`).join("")}</div>
 ${control(n.type === "mastery" ? "ESCOLHER MAESTRIA" : "APRENDER HABILIDADE", "learn", learned || errors.length > 0)}
 ${skill && learned ? `<div class="tree-equip"><small>EQUIPAR NO ATALHO</small>${[0, 1, 2, 3].map((i) => control(`${i + 1}${b.bar[i] === n.id ? " ✓" : ""}`, `assign-${i}`)).join("")}</div>` : ""}
 ${skill ? control("PRÉ-VISUALIZAR SEM GASTAR PONTOS", "preview") : ""}${preview && skill ? `<div class="skill-preview" style="--preview-color:${skill.color}"><canvas id="skill-preview-canvas" width="240" height="120" aria-label="Animação de pré-visualização da habilidade"></canvas><small>PRÉVIA VISUAL · ${skill.name}</small></div>` : ""}
 ${
   nodes.some((x) => x.parents.includes(n.id) && x.type === "upgrade")
     ? `<div class="tree-upgrades"><h4>MELHORIAS · escolha até duas</h4>${nodes
         .filter((x) => x.parents.includes(n.id) && x.type === "upgrade")
         .map(button)
         .join("")}</div>`
     : ""
 }
 <p class="tree-synergy">${synergy(n)}</p><p class="subtle">Arma: ${p.equipment.weapon ?? "nenhuma"} · ataque ${g.snapshot().stats.attack}. Efeitos periódicos: máximo 5 acúmulos, 12s. Controles respeitam colisões.</p></aside></div>
 <div class="tree-builds"><section><h4>REDISTRIBUIR PONTOS</h4><p>Recupera os pontos desta classe, preserva nível e builds salvas.</p>${control(`RECONFIGURAR · ${respecCost(p)} MOEDAS`, "respec", g.inCombat() || p.coins < respecCost(p))}<small>${g.inCombat() ? "Saia de combate para trocar a build." : "Fora de combate · custo também se aplica ao carregar builds."}</small></section><section><h4>BUILDS SALVAS · ${CLASSES[p.classId].name}</h4><div class="build-presets">${[0, 1, 2].map((i) => `<div><strong>CONFIGURAÇÃO ${i + 1}</strong><p>${buildDiff(i)}</p>${control("GUARDAR", `save-${i}`)}${control("CARREGAR", `load-${i}`, !b.presets[i] || g.inCombat() || p.coins < respecCost(p))}</div>`).join("")}</div></section></div>`;
}
function synergy(n: Node) {
  if (n.type === "hybrid")
    return [
      "Exige Vanguarda/Sombra/Piromancia/Precisão e o segundo ramo: quatro nós em cada.",
      "Exige o primeiro e o terceiro ramo: quatro nós em cada.",
      "Exige o segundo e o terceiro ramo: quatro nós em cada.",
    ][n.index];
  return (
    {
      steel: "Sinergia: Muralha + Retaliação; Provocação + Comandante.",
      blood: "Sinergia: Frenesi + Sangue por Sangue; sangramento + Execução.",
      rune: "Sinergia: Inscrição de Guerra + Sobrecarga Rúnica.",
      fire: "Sinergia: Combustão + Ignição Encadeada.",
      void: "Sinergia: Corrupção + Colapso; Buraco Negro + Ruptura.",
      arcane: "Sinergia: Duplicação + Dardo Arcano; Escudo + Desvio.",
      shadow: "Sinergia: Véu Sombrio + Ataque Oportuno; Marca + Execução.",
      poison: "Sinergia: Nuvem Venenosa + Transmissão; Frasco + Dose Letal.",
      precision: "Sinergia: Marcação Óptica + Alvo Exposto.",
      device: "Sinergia: Mina de Impacto + Carga Remota; Torreta + Sobrecarga.",
      hunt: "Sinergia: Laço + Disparo de Caça; Passo + Isca Tática.",
      base: "Fundamento preservado do seu caminho anterior.",
    }[n.element] ??
    "Sinergia: Combo Fluido + Cadência Mortal; esquiva + Contra-ataque."
  );
}
