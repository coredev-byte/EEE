import { ITEMS, CLASSES } from "./data";
import { stats } from "./state";
import type { Game } from "./game";
const icon = (index: number) =>
  `<span class="item-icon" style="background-position:-${index * 48}px 0" aria-hidden="true"></span>`;
const labels = { weapon: "Arma", armor: "Armadura", accessory: "Acessório" };
const elementNames: Record<string, string> = {
  steel: "Físico",
  fire: "Fogo",
  lightning: "Elétrico",
  rune: "Rúnico",
  none: "Sem elemento",
};
const signed = (n: number) => `${n >= 0 ? "+" : ""}${n}`;
export function inventoryPanel(
  g: Game,
  selected: string,
  filter: string,
  compare: boolean,
  discard: boolean,
  equipmentTab: boolean,
) {
  const p = g.player,
    s = stats(p);
  const owned = p.inventory
    .map((id) => ITEMS.find((item) => item.id === id))
    .filter((item) => !!item);
  const visible = owned.filter(
    (item) =>
      (!equipmentTab || Object.values(p.equipment).includes(item.id)) &&
      (filter === "all" || item.slot === filter),
  );
  const potions = ["Poção de vida", "Poção de mana", "Elixir"];
  const cells = visible.map(
    (item) =>
      `<button class="bag-slot ${selected === item.id ? "selected" : ""} ${Object.values(p.equipment).includes(item.id) ? "equipped" : ""}" data-item="${item.id}" aria-label="${item.name}" aria-pressed="${selected === item.id}" title="${item.name}">${icon(item.icon)}${Object.values(p.equipment).includes(item.id) ? '<span class="equipped-mark">◆</span>' : ""}</button>`,
  );
  if (!equipmentTab && ["all", "potions"].includes(filter))
    p.potions.forEach((count, i) => {
      if (count)
        cells.push(
          `<button class="bag-slot ${selected === `potion-${i}` ? "selected" : ""}" data-item="potion-${i}" aria-label="${potions[i]}">${icon(4 + i)}<span class="bag-count">${count}</span></button>`,
        );
    });
  const occupied = owned.length + p.potions.filter(Boolean).length;
  const item = owned.find((item) => item.id === selected);
  const potionIndex = selected.startsWith("potion-")
    ? Number(selected.slice(7))
    : -1;
  const current =
    item && ITEMS.find((other) => other.id === p.equipment[item.slot]);
  const rarity = item?.rarity ?? "Consumível";
  const color =
    rarity === "Elemental"
      ? "#ef794b"
      : rarity === "Rara"
        ? "#72caff"
        : rarity === "Rúnica"
          ? "#c58aea"
          : "#c6d0e2";
  const detail = item
    ? `<div class="item-heading">${icon(item.icon)}<div><h3>${item.name}</h3><span>${rarity}</span><p>${labels[item.slot]} · ${Object.values(p.equipment).includes(item.id) ? "Equipado" : "Na mochila"}</p></div></div>
    <dl class="item-values"><div><dt>Ataque</dt><dd>+${item.attack}</dd></div><div><dt>Defesa</dt><dd>+${item.defense}</dd></div><div><dt>Vida máxima</dt><dd>+${item.hp}</dd></div></dl>
    <div class="item-element">${icon(item.icon)} Elemento · ${elementNames[item.element]}</div>
    ${compare ? `<div class="item-comparison"><h4>COMPARAÇÃO COM ${current?.name ?? "ESPAÇO VAZIO"}</h4><p class="comparison">ATAQUE ${signed(item.attack - (current?.attack ?? 0))}</p><p class="comparison">DEFESA ${signed(item.defense - (current?.defense ?? 0))}</p><p class="comparison">VIDA ${signed(item.hp - (current?.hp ?? 0))}</p></div>` : '<div class="item-note">Selecione Comparar para ver a diferença em relação ao equipamento atual.</div>'}
    <blockquote>“${item.description}”</blockquote><div class="item-actions"><button data-equip="${item.id}"><kbd>E</kbd> Equipar</button><button data-action="compare" aria-pressed="${compare}"><kbd>C</kbd> Comparar</button><button data-action="discard"><kbd>R</kbd> ${discard ? "Confirmar" : "Descartar"}</button></div>${discard ? '<p class="discard-note" role="status">Clique novamente em Confirmar para remover este item da mochila.</p>' : ""}`
    : potionIndex >= 0 && p.potions[potionIndex]
      ? `<div class="item-heading">${icon(4 + potionIndex)}<div><h3>${potions[potionIndex]}</h3><span>Consumível</span><p>${p.potions[potionIndex]} unidades</p></div></div><p class="potion-description">${["Restaura 100 pontos de vida.", "Restaura 70 pontos de mana.", "Restaura 50 pontos de vida e 40 de mana."][potionIndex]}</p><div class="item-actions"><button data-action="use-potion"><kbd>E</kbd> Usar</button></div>`
      : '<div class="empty-detail"><span>◇</span><h3>Selecione um item</h3><p>Inspecione os detalhes, compare os atributos e prepare seu equipamento.</p></div>';
  const equipment = (["weapon", "armor", "accessory"] as const)
    .map((slot) => {
      const equipped = ITEMS.find((item) => item.id === p.equipment[slot]);
      return `<div class="gear-position gear-${slot}"><button class="gear-slot" ${equipped ? `data-item="${equipped.id}"` : "disabled"} aria-label="${labels[slot]}: ${equipped?.name ?? "vazio"}">${equipped ? icon(equipped.icon) : '<span class="empty-gear">◇</span>'}</button><small>${labels[slot]}</small>${equipped ? `<button class="gear-remove" data-unequip="${slot}" aria-label="Remover ${equipped.name}">×</button>` : ""}</div>`;
    })
    .join("");
  const tabPaths: Record<string, string> = {
    inventory:
      '<rect x="6" y="7" width="12" height="14" rx="2"/><path d="M9 7V4h6v3M9 12h6v6H9zM4 10v8m16-8v8"/>',
    equipment: '<path d="m5 20 3-3m-3-3 5 5m-3-4L18 3l3 3L10 17M15 6l3 3"/>',
    skills:
      '<path d="m12 2 2 7 7 3-7 2-2 8-2-8-8-2 8-3zM4 3v3m-1-1h3m14 13v4m-2-2h4"/>',
    quests: '<path d="M6 3h13v4H8v12h10V7m-4 12v3H3v-3h3M10 11h5m-5 3h5"/>',
    classes:
      '<path d="M5 16V9a7 7 0 0 1 14 0v7l-4 5-3-3-3 3zM5 11l5 3v3m9-6-5 3v3M12 3v8"/>',
    settings:
      '<path d="m10 2 4 0 1 3 3 1 3-1 2 4-2 3 1 3-3 3-3-1-3 2-3-1-1-3-3-1-1-4 3-2V7l3-1z"/><circle cx="12" cy="12" r="3"/>',
  };
  const tabs = [
    ["inventory", "Inventário"],
    ["equipment", "Equipamento"],
    ["skills", "Habilidades"],
    ["quests", "Missões"],
    ["classes", "Classe"],
    ["settings", "Configurações"],
  ] as const;
  return `<section class="inventory-screen" role="dialog" aria-modal="true" aria-label="Inventário & equipamentos">
    <aside class="character-pane ornate"><div class="character-stage">${equipment}<div class="paperdoll ${p.classId}" aria-label="Personagem ${CLASSES[p.classId].name}"></div><span class="character-caption">${CLASSES[p.classId].name} · Nível ${p.level}</span></div><div class="character-stats"><section class="stat-block attributes"><h3>ATRIBUTOS</h3><span>Ataque <b>${s.attack}</b></span><span>Defesa <b>${s.defense}</b></span><span>Vida <b>${s.maxHp}</b></span><span>Mana <b>${s.maxMp}</b></span></section><section class="stat-block"><h3>PERSONAGEM</h3><span>Nível <b>${p.level}</b></span><span>Velocidade <b>${s.speed.toFixed(1)}</b></span><span>Pontos <b>${p.skillPoints}</b></span><span>Classe <b>${CLASSES[p.classId].name}</b></span></section></div></aside>
    <nav class="inventory-tabs" aria-label="Menus do personagem">${tabs.map(([panel, name]) => `<button data-panel="${panel}" class="${panel === (equipmentTab ? "equipment" : "inventory") ? "active" : ""}">${`<svg class="inventory-tab-icon" viewBox="0 0 24 24" aria-hidden="true">${tabPaths[panel]}</svg>`}<span>${name}</span></button>`).join("")}</nav>
    <section class="bag-pane ornate"><nav class="bag-filters" aria-label="Filtrar itens">${[
      ["all", -1, "Todos"],
      ["weapon", 0, "Armas"],
      ["armor", 7, "Armaduras"],
      ["potions", 4, "Poções"],
      ["accessory", 8, "Acessórios"],
    ]
      .map(
        ([value, index, name]) =>
          `<button data-filter="${value}" class="${value === filter ? "active" : ""}" aria-label="${name}" aria-pressed="${value === filter}">${index === -1 ? name.toString().toUpperCase() : icon(Number(index))}</button>`,
      )
      .join(
        "",
      )}</nav><div class="bag-grid" aria-label="Itens da mochila">${cells.join("")}${Array.from({ length: Math.max(0, 60 - cells.length) }, () => '<div class="bag-slot empty" aria-hidden="true"></div>').join("")}</div><footer class="bag-footer"><span>♙ ${occupied} / 60</span><span class="bag-gold">◈ ${p.coins.toLocaleString("pt-BR")}</span></footer></section>
    <aside class="item-pane ornate" style="--item-color:${color}" aria-label="Detalhes do item">${detail}</aside>
    <button class="inventory-close" data-action="close"><kbd>ESC</kbd> Fechar</button>
  </section>`;
}
