import { useMemo } from "react";
import * as THREE from "three";

// Texturas geradas por canvas em tempo de execução (sem baixar nada da internet):
// dão ao chão um aspecto de asfalto real (grão + variação de rugosidade) em vez
// de uma cor chapada, o que ajuda bastante a sensação de "cena real" sob luz e
// reflexo, mesmo sem usar fotos/HDRs externos.

function makeCanvas(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function useAsphaltTextures({ repeat = [12, 12] } = {}) {
  return useMemo(() => {
    const size = 512;
    const rand = mulberry32(1337);

    // --- mapa de cor (albedo): cinza-azulado com grão sutil ---
    const colorCanvas = makeCanvas(size);
    const cctx = colorCanvas.getContext("2d");
    cctx.fillStyle = "#161c2f";
    cctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 9000; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const v = rand();
      const shade = 18 + v * 22;
      cctx.fillStyle = `rgba(${shade + 150}, ${shade + 160}, ${shade + 185}, ${0.05 + v * 0.07})`;
      cctx.fillRect(x, y, 1 + rand() * 1.6, 1 + rand() * 1.6);
    }
    // leves "manchas" de rodagem
    for (let i = 0; i < 10; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 40 + rand() * 120;
      cctx.fillStyle = "rgba(0,0,0,0.08)";
      cctx.beginPath();
      cctx.ellipse(x, y, w, w * 0.3, rand() * Math.PI, 0, Math.PI * 2);
      cctx.fill();
    }

    // --- mapa de rugosidade: ruído em tons de cinza ---
    const roughCanvas = makeCanvas(size);
    const rctx = roughCanvas.getContext("2d");
    rctx.fillStyle = "#9a9a9a";
    rctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 14000; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const v = Math.floor(120 + rand() * 110);
      rctx.fillStyle = `rgb(${v},${v},${v})`;
      rctx.fillRect(x, y, 1, 1);
    }

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    const roughnessMap = new THREE.CanvasTexture(roughCanvas);
    [colorMap, roughnessMap].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
      t.anisotropy = 8;
      t.needsUpdate = true;
    });

    return { colorMap, roughnessMap };
  }, [repeat[0], repeat[1]]);
}
