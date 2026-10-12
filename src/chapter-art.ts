import type { Enemy } from "./state";
import type { Point } from "./world";
import type { BossAttack } from "./chapter-boss";
/** Pixel rig authored for the stone/cyan reference. Joints drive distinct combat poses. */
export function paintChapterEnemy(
  c: CanvasRenderingContext2D,
  e: Enemy,
  s: Point,
  pose?: string,
) {
  c.save();
  c.translate(Math.round(s.x), Math.round(s.y));
  if (e.appearance !== "kharn") {
    const sentinel = e.appearance === "sentinel",
      bob = Math.round(Math.sin(e.animTime * 8) * 2);
    c.translate(0, bob);
    polygon(
      c,
      [
        [-14, 0],
        [-10, -26],
        [-14, -52],
        [0, -67],
        [14, -52],
        [10, -26],
        [14, 0],
      ],
      sentinel ? "#252948" : "#30212d",
    );
    polygon(
      c,
      [
        [-11, -40],
        [-10, -57],
        [0, -68],
        [11, -58],
        [9, -40],
        [0, -48],
      ],
      sentinel ? "#555072" : "#742b36",
    );
    rect(c, -6, -54, 12, 3, sentinel ? "#b6a4ff" : "#eda385");
    polygon(
      c,
      [
        [-8, -43],
        [8, -43],
        [12, -24],
        [0, -16],
        [-12, -24],
      ],
      sentinel ? "#3e425a" : "#503139",
    );
    rect(c, -1, -42, 3, 17, sentinel ? "#8ce3ff" : "#c38b56");
    const swing = e.state === "attack" ? Math.sin(e.animTime * 10) * 0.8 : 0;
    c.save();
    c.translate(12, -35);
    c.rotate(swing);
    rect(c, 0, 0, 4, 22, "#444858");
    rect(c, 1, -22, 3, 24, sentinel ? "#74d7eb" : "#e4bd9c");
    c.restore();
    rect(c, -12, -4, 9, 5, "#121526");
    rect(c, 4, -4, 9, 5, "#121526");
    c.restore();
    return;
  }
  const kneel = pose === "kneel" || e.hp <= 0,
    walk = e.state === "chase",
    strike = e.state === "attack";
  const cycle = Math.floor(e.animTime * 8) % 4,
    bob = kneel
      ? 12
      : walk
        ? cycle % 2
          ? 1
          : -1
        : Math.round(Math.sin(e.animTime * 2));
  c.translate(0, bob);
  if (e.direction === "left") c.scale(-1, 1);
  const phase = e.phase ?? 1,
    light = phase === 3 ? "#be8cff" : phase === 2 ? "#6efff5" : "#4bcfe8";
  // Feet, hinged greaves and tabard remain anchored to the actor's world foot.
  for (const [x, step] of [
    [-24, kneel ? -12 : walk && cycle < 2 ? -3 : 0],
    [10, kneel ? -12 : walk && cycle >= 2 ? -3 : 0],
  ]) {
    polygon(
      c,
      [
        [x, -35],
        [x + 20, -38],
        [x + 24, -12 + step],
        [x + 29, 0 + step],
        [x - 3, 0 + step],
        [x - 4, -12 + step],
      ],
      "#162934",
    );
    polygon(
      c,
      [
        [x + 1, -31],
        [x + 17, -33],
        [x + 21, -15 + step],
        [x + 3, -13 + step],
      ],
      "#314c56",
    );
    rect(c, x + 3, -12 + step, 15, 3, "#47636a");
    rect(c, x + 5, -24 + step, 2, 10, light);
  }
  polygon(
    c,
    [
      [-10, -44],
      [13, -44],
      [16, kneel ? -20 : -8],
      [4, kneel ? -24 : -12],
      [-5, kneel ? -17 : -5],
      [-14, kneel ? -25 : -13],
    ],
    "#101c28",
  );
  // Broad carved stone torso, separate shoulder plates and cyan core fractures.
  polygon(
    c,
    [
      [-25, -102],
      [-14, -115],
      [15, -115],
      [28, -99],
      [24, -54],
      [10, -40],
      [-13, -40],
      [-29, -60],
    ],
    "#18323d",
  );
  polygon(
    c,
    [
      [-24, -95],
      [-10, -108],
      [15, -105],
      [25, -92],
      [17, -59],
      [5, -51],
      [-17, -57],
    ],
    "#365864",
  );
  polygon(
    c,
    [
      [-19, -91],
      [-3, -100],
      [12, -93],
      [16, -67],
      [2, -53],
      [-19, -67],
    ],
    "#102a37",
  );
  for (const [x, y] of [
    [-13, -89],
    [-8, -79],
    [-4, -67],
    [2, -61],
    [8, -84],
    [10, -73],
  ]) {
    rect(c, x, y, 3, 8, light);
    rect(c, x + 3, y + 6, 5, 2, light);
  }
  polygon(
    c,
    [
      [-5, -60],
      [2, -68],
      [9, -58],
      [2, -48],
    ],
    light,
  );
  rect(c, -1, -59, 5, 5, "#d4ffff");
  for (const x of [-43, 26]) {
    polygon(
      c,
      [
        [x, -95],
        [x + 9, -110],
        [x + 28, -103],
        [x + 33, -84],
        [x + 24, -73],
        [x, -75],
      ],
      "#294650",
    );
    polygon(
      c,
      [
        [x + 3, -94],
        [x + 10, -106],
        [x + 23, -100],
        [x + 27, -86],
        [x + 19, -80],
        [x + 2, -83],
      ],
      "#49636a",
    );
    for (let i = 0; i < 3; i++)
      rect(c, x + 6 + i * 7, -97 + (i % 2) * 6, 3, 3, "#182c38");
  }
  // Helmet and twin crystal conduits from the supplied guardian silhouette.
  polygon(
    c,
    [
      [-12, -128],
      [0, -138],
      [13, -129],
      [16, -112],
      [7, -103],
      [-10, -111],
    ],
    "#1f3945",
  );
  polygon(
    c,
    [
      [-8, -125],
      [2, -131],
      [10, -123],
      [9, -112],
      [-7, -112],
    ],
    "#112333",
  );
  rect(c, -6, -121, 14, 3, light);
  rect(c, 0, -119, 3, 8, light);
  for (const x of [-25, 17]) {
    rect(c, x, -139, 12, 25, "#183744");
    rect(c, x + 3, -136, 6, 17, light);
    rect(c, x - 2, -140, 16, 4, "#55747a");
    rect(c, x - 1, -114, 14, 4, "#294956");
  }
  // Sword arm swings about the shoulder; the other hand opens during resonant attacks.
  const angle = kneel
    ? 1
    : strike
      ? Math.sin(Math.min(1, e.animTime / 1.1) * Math.PI) * 1.1
      : pose === "rise"
        ? -1.3
        : walk
          ? Math.sin(e.animTime * 7) * 0.1 - 0.8
          : -0.8;
  c.save();
  c.translate(-37, -79);
  c.rotate(angle);
  polygon(
    c,
    [
      [-6, 0],
      [10, -1],
      [14, 22],
      [10, 36],
      [-8, 33],
      [-14, 20],
    ],
    "#2f4d59",
  );
  rect(c, -7, 20, 17, 9, "#47626b");
  rect(c, -3, 25, 3, 7, light);
  rect(c, -4, 27, 5, 23, "#b39865");
  rect(c, -16, 45, 29, 4, "#8b805e");
  polygon(
    c,
    [
      [-9, 47],
      [6, 47],
      [7, 86],
      [-4, 105],
      [-17, 85],
    ],
    "#213b4d",
  );
  polygon(
    c,
    [
      [-7, 50],
      [2, 50],
      [3, 84],
      [-4, 97],
      [-12, 81],
    ],
    "#396175",
  );
  rect(c, -4, 52, 3, 37, light);
  c.restore();
  polygon(
    c,
    [
      [37, -75],
      [53, -67],
      [52, -43],
      [42, -29],
      [27, -33],
      [27, -55],
    ],
    "#284958",
  );
  rect(c, 33, -49, 16, 5, "#49676d");
  for (let i = 0; i < 4; i++)
    rect(c, 27 + i * 6, -34, 5, strike ? 16 : 10, "#355564");
  c.restore();
}
const rect = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const polygon = (
  c: CanvasRenderingContext2D,
  points: number[][],
  color: string,
) => {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
};
export function paintTelegraph(
  c: CanvasRenderingContext2D,
  a: BossAttack,
  project: (p: Point) => Point,
) {
  c.save();
  c.lineWidth = 2;
  c.strokeStyle = a.kind === "oath" ? "#c997ff" : "#efb465";
  c.fillStyle = "rgba(158,75,129,.27)";
  const circle = (p: Point, r: number) => {
    const s = project(p);
    c.beginPath();
    c.ellipse(s.x, s.y, r * 56, r * 28, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  };
  const beam = (at: Point, dir: Point, width: number, length: number) => {
    const n = { x: -dir.y * width, y: dir.x * width };
    const pts = [
      { x: at.x + n.x, y: at.y + n.y },
      { x: at.x + dir.x * length + n.x, y: at.y + dir.y * length + n.y },
      { x: at.x + dir.x * length - n.x, y: at.y + dir.y * length - n.y },
      { x: at.x - n.x, y: at.y - n.y },
    ].map(project);
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fill();
    c.stroke();
  };
  if (a.kind === "cross") {
    beam({ x: a.origin.x - 5, y: a.origin.y }, { x: 1, y: 0 }, 0.48, 10);
    beam({ x: a.origin.x, y: a.origin.y - 5 }, { x: 0, y: 1 }, 0.48, 10);
  } else if (a.kind === "knife" || a.kind === "rush")
    beam(
      a.origin,
      { x: Math.cos(a.angle), y: Math.sin(a.angle) },
      a.kind === "rush" ? 0.7 : 0.4,
      a.kind === "rush" ? 4 : 6,
    );
  else if (a.kind === "cleave") {
    const pts = [
      a.origin,
      ...Array.from({ length: 19 }, (_, i) => ({
        x:
          a.origin.x +
          Math.cos(a.angle - Math.PI * 0.4 + (i * Math.PI * 0.8) / 18) * 2,
        y:
          a.origin.y +
          Math.sin(a.angle - Math.PI * 0.4 + (i * Math.PI * 0.8) / 18) * 2,
      })),
    ].map(project);
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fill();
    c.stroke();
  } else if (a.kind === "oath") {
    const s = project(a.origin);
    c.beginPath();
    c.ellipse(s.x, s.y, 4.2 * 56, 4.2 * 28, 0, 0, Math.PI * 2);
    c.ellipse(s.x, s.y, 1.3 * 56, 1.3 * 28, 0, 0, Math.PI * 2);
    c.fill("evenodd");
    c.stroke();
  } else if (a.kind === "shards" || a.kind === "embers")
    a.areas.forEach((p) => circle(p, 1.1));
  else circle(a.target, 1.6);
  const at = project(a.origin);
  c.fillStyle = "#f0dbac";
  c.font = "10px monospace";
  c.textAlign = "center";
  c.fillText(
    `${a.kind === "oath" ? "ANEL · CENTRO SEGURO" : a.kind === "cross" ? "CRUZ · SAIA DAS LINHAS" : a.kind === "rush" ? "INVESTIDA" : "GOLPE"} · ${Math.max(0, a.remaining).toFixed(1)}`,
    at.x,
    at.y - 150,
  );
  c.restore();
}
export function paintRune(
  c: CanvasRenderingContext2D,
  s: Point,
  color = "#9580ef",
  radius = 45,
) {
  c.save();
  c.translate(Math.round(s.x), Math.round(s.y));
  c.strokeStyle = color;
  c.lineWidth = 1;
  for (const r of [radius, radius * 0.8]) {
    c.beginPath();
    c.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2);
    c.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x = Math.round(Math.cos(a) * radius * 0.7),
      y = Math.round(Math.sin(a) * radius * 0.35);
    rect(c, x, y, 3, 3, color);
  }
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 4) / 5;
    const x = Math.cos(a) * radius * 0.6,
      y = Math.sin(a) * radius * 0.3;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.stroke();
  c.restore();
}
