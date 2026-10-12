import { paintRune } from "./chapter-art";
export function makeRuinAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = 128 * 8;
  canvas.height = 160;
  const c = canvas.getContext("2d")!;
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  const poly = (pts: number[][], color: string) => {
    c.fillStyle = color;
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  };
  for (let index = 0; index < 8; index++) {
    c.save();
    c.translate(index * 128 + 64, 156);
    poly(
      [
        [-46, -12],
        [0, -34],
        [46, -12],
        [0, 10],
      ],
      "#181b3c",
    );
    poly(
      [
        [-42, -13],
        [0, -32],
        [42, -13],
        [0, 6],
      ],
      "#343255",
    );
    for (let i = 0; i < 5; i++)
      rect(-21 + i * 9, -18 + (i % 2) * 3, 8, 2, "#726374");
    const light = index === 1 ? "#54d9ed" : "#9961e4";
    if (index === 0) {
      poly(
        [
          [-18, -13],
          [-18, -119],
          [4, -130],
          [23, -119],
          [23, -11],
          [1, 1],
        ],
        "#302e50",
      );
      rect(-15, -116, 18, 98, "#49435c");
      rect(5, -122, 13, 100, "#242a46");
      for (const y of [-113, -82, -45, -20]) {
        rect(-23, y, 50, 4, "#958164");
        rect(-23, y + 4, 49, 3, "#41374c");
      }
      for (let i = 0; i < 5; i++)
        rect(-10 + i * 3, -95 + i * 14, 2, 11, "#677187");
    } else if (index === 1 || index === 2) {
      poly(
        [
          [-13, -30],
          [-18, -77],
          [0, -115],
          [17, -80],
          [11, -29],
          [0, -17],
        ],
        light,
      );
      poly(
        [
          [0, -110],
          [12, -78],
          [3, -34],
          [0, -22],
        ],
        "#cdfcff",
      );
      poly(
        [
          [-12, -78],
          [0, -110],
          [0, -22],
        ],
        index === 1 ? "#148cbd" : "#5c3592",
      );
      rect(-22, -31, 44, 5, "#c29e56");
      rect(-23, -26, 46, 5, "#5b5165");
      paintRune(c, { x: 0, y: -3 }, light, 40);
    } else if (index === 3) {
      for (const x of [-39, 22]) {
        rect(x, -111, 17, 107, "#35334f");
        rect(x + 2, -108, 4, 100, "#81705f");
      }
      poly(
        [
          [-40, -112],
          [-29, -130],
          [0, -147],
          [30, -130],
          [39, -112],
          [25, -112],
          [0, -130],
          [-26, -112],
        ],
        "#55506d",
      );
      for (const x of [-33, 30]) rect(x, -112, 3, 83, "#ceaa66");
      rect(-22, -103, 44, 85, "#251939");
      for (const x of [-16, -6, 5, 15]) rect(x, -102, 2, 80, light);
      paintRune(c, { x: 0, y: -3 }, "#ba9b58", 42);
    } else if (index === 4) {
      poly(
        [
          [-40, -9],
          [-40, -67],
          [0, -86],
          [40, -67],
          [40, -9],
          [0, 11],
        ],
        "#30314c",
      );
      for (let y = -63; y < -8; y += 14)
        for (let x = -34; x < 34; x += 18)
          rect(x, y, 16, 12, (x + y) % 3 ? "#4c465f" : "#666077");
      poly(
        [
          [-41, -67],
          [0, -87],
          [41, -67],
          [0, -47],
        ],
        "#756a7e",
      );
      rect(-24, -47, 48, 3, "#a78a59");
    } else if (index === 5) {
      paintRune(c, { x: 0, y: -1 }, "#b8a25f", 45);
      poly(
        [
          [-10, -22],
          [-12, -59],
          [0, -92],
          [12, -61],
          [9, -22],
        ],
        "#745add",
      );
      rect(-2, -85, 4, 56, "#bceeff");
    } else if (index === 6) {
      paintRune(c, { x: 0, y: -5 }, "#5dd1ef", 40);
      poly(
        [
          [-29, -19],
          [0, -34],
          [29, -19],
          [24, -2],
          [0, 7],
          [-24, -2],
        ],
        "#525475",
      );
      poly(
        [
          [-24, -19],
          [0, -30],
          [24, -19],
          [0, -7],
        ],
        "#61c9ee",
      );
      rect(-2, -68, 4, 43, "#8ddbfa");
    } else {
      for (let i = 0; i < 4; i++) {
        const y = -8 - i * 11;
        poly(
          [
            [-42 + i * 5, y],
            [0, y - 20],
            [42 - i * 5, y],
            [0, y + 18],
          ],
          i % 2 ? "#534965" : "#413b57",
        );
        rect(-8, y - 14, 16, 3, "#a79865");
      }
    }
    c.restore();
  }
  return canvas;
}
