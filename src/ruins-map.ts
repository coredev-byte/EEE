import type { Prop, Point } from "./world";
/** Connected stone platforms, two investigation wings and a separate northern arena. */
export function ruinsFloor(x: number, y: number) {
  const box = (a: number, b: number, c: number, d: number) =>
    x >= a && x <= b && y >= c && y <= d;
  return (
    box(9, 19, 21, 26) ||
    box(10, 18, 10, 22) ||
    box(2, 7, 17, 22) ||
    box(7, 11, 20, 21) ||
    box(21, 25, 12, 17) ||
    box(18, 21, 14, 15) ||
    box(9, 19, 2, 9)
  );
}
export function ruinProps(): Prop[] {
  const props: Prop[] = [];
  const add = (
    kind: Prop["kind"],
    x: number,
    y: number,
    name: string,
    interaction?: string,
    solid = false,
    lock?: string,
    scale = 1,
  ) => {
    props.push({
      id: `${kind}-${x}-${y}`,
      kind,
      x,
      y,
      name,
      interaction,
      solid,
      radius: 0.48,
      scale,
      lock,
    });
    return props.at(-1)!;
  };
  add("portal", 14, 25, "Retorno à Margem de Kharn");
  add(
    "statue",
    12,
    23,
    "Inscrição do Vestíbulo",
    "ruins-record",
    false,
    undefined,
    1.2,
  );
  add("statue", 5, 20, "Prisma Azul · suporte de cristal", "prism-blue");
  add("crate", 6, 21, "Registro dos condutores", "oath");
  add("statue", 23, 15, "Prisma Violeta · suporte de cristal", "prism-violet");
  add("crate", 22, 16, "Registro do Núcleo", "core-record");
  add("fountain", 14, 12, "Fonte de preparação · descansar", "rest");
  add("bench", 14, 11, "Porta monumental · entrar no salão", "arena");
  add("statue", 14, 3, "Selo do fragmento", "fragment", false, undefined, 1.6);
  add("chest", 3, 21, "Baú do condutor");
  add("chest", 25, 16, "Baú do arquivo");
  add("bench", 17, 16, "Guincho do atalho oeste", "ruins-shortcut");
  // Gates span the only openings in masonry. They cannot be bypassed over the void.
  for (const y of [18, 10])
    for (let x = 10; x <= 18; x++) {
      const gap = x >= 13 && x <= 15;
      add(
        "wall",
        x,
        y,
        gap ? "Portão de cristal" : "Muralha antiga",
        undefined,
        true,
        gap ? (y === 18 ? "prism-blue" : "prism-violet") : undefined,
        1.1,
      );
    }
  for (const [x, y] of [
    [9, 9],
    [19, 9],
    [10, 2],
    [18, 2],
    [2, 17],
    [7, 17],
    [21, 12],
    [25, 12],
    [9, 24],
    [19, 24],
  ]) {
    const p = add(
      "statue",
      x,
      y,
      "Coluna do salão",
      undefined,
      true,
      undefined,
      1.1,
    );
    p.radius = 0.36;
  }
  // Shortcut opens a lateral stair physically, after reaching the central hall.
  for (const y of [17, 18, 19])
    add(
      "wall",
      9,
      y,
      "Escadaria lateral fechada",
      undefined,
      true,
      "ruins-shortcut",
    );
  for (const [x, y] of [
    [11, 22],
    [17, 22],
    [4, 18],
    [6, 18],
    [11, 16],
    [17, 16],
    [22, 13],
    [24, 16],
    [10, 8],
    [18, 8],
    [11, 4],
    [17, 4],
  ])
    add("lantern", x, y, "Luz do salão");
  return props;
}
export const ARENA_BOUNDS = { minX: 9.8, maxX: 18.2, minY: 2.8, maxY: 8.2 };
export function arenaPoint(p: Point) {
  return {
    x: Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, p.x)),
    y: Math.max(ARENA_BOUNDS.minY, Math.min(ARENA_BOUNDS.maxY, p.y)),
  };
}
