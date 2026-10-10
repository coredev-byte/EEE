/** Shared pictograms for the HUD, its legend and the circular minimap. */
export const HUD_ICONS = {
  life: { color: "#ec3f49", path: "M8 14 1 7V4L3 2H6L8 4 10 2H13L15 4V7Z" },
  mana: {
    color: "#22b8df",
    path: "M8 1 3 8V12L5 15H11L13 12V8Z M8 6 5 10V12H8",
  },
  xp: {
    color: "#b761df",
    path: "M8 1 10 6H15L11 10 13 15 8 12 3 15 5 10 1 6H6Z",
  },
  inventory: {
    color: "#c4bbb2",
    path: "M3 5H13V14H3Z M5 5V2H11V5 M2 8H14 M7 7V10H9V7",
  },
  quests: {
    color: "#b8a99b",
    path: "M3 2H13V4H11V12H14V14H2V12H4V4H2V2Z M6 6H9 M6 9H9",
  },
  settings: {
    color: "#b6bac1",
    path: "M6 1H10V3L12 4 14 3 16 7 13 8V10L15 11 13 15 11 13 9 14V16H5V13L3 12 1 13 0 9 3 8V6L1 5 3 1 5 3Z M6 6H10V10H6Z",
  },
  player: { color: "#35bddb", path: "M8 1 15 14 8 10 1 14Z" },
  main: { color: "#e8bd68", path: "M8 1 15 14 8 10 1 14Z" },
  secondary: { color: "#efb74e", path: "M8 1 15 8 8 15 1 8Z" },
  exit: { color: "#51caa0", path: "M2 15V6L5 2H11L14 6V15H10V8H6V15Z" },
  enemy: {
    color: "#e64650",
    path: "M4 2H12L15 5V10L12 12V15H4V12L1 10V5Z M4 6V8H6V6Z M10 6V8H12V6Z M7 10V12H9V10Z",
  },
} as const;
export type HudIcon = keyof typeof HUD_ICONS;
export function hudIcon(name: HudIcon) {
  const icon = HUD_ICONS[name];
  return `<svg class="hud-pictogram hud-${name}" viewBox="0 0 16 16" aria-hidden="true" style="color:${icon.color}"><path d="${icon.path}" fill="currentColor" fill-rule="evenodd" stroke="#121622" stroke-width=".6"/></svg>`;
}
export function paintHudIcon(
  ctx: CanvasRenderingContext2D,
  name: HudIcon,
  x: number,
  y: number,
  size = 9,
) {
  const icon = HUD_ICONS[name];
  ctx.save();
  ctx.translate(Math.round(x) - size / 2, Math.round(y) - size / 2);
  ctx.scale(size / 16, size / 16);
  ctx.fillStyle = icon.color;
  ctx.fill(new Path2D(icon.path), "evenodd");
  ctx.restore();
}
