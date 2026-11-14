import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

// Organização automática das etiquetas da cena.
// - Cada etiqueta (QuantityTag) se registra aqui com o seu elemento HTML.
// - Objetos que não podem ser cobertos (carros, caixote, carrinho, esferas...)
//   se registram como "protegidos" (KeepInView faz isso com os que acompanha).
// - Algumas vezes por segundo, as etiquetas que se sobrepõem a outras ou a um
//   objeto protegido são afastadas para o lugar livre mais próximo, com uma
//   linha fina ligando a etiqueta ao ponto que ela descreve.

export const labelRegistry = new Set(); // elementos .qtag
export const protectedRegistry = new Set(); // refs de Object3D

const box = new THREE.Box3();
const part = new THREE.Box3();
const v = new THREE.Vector3();

// caixa do objeto, ignorando partes marcadas com userData.noProtect (setas de
// força etc.: as etiquetas dessas setas ficam justamente na ponta delas)
function collect(o) {
  if (o.userData?.noProtect || !o.visible) return;
  if (o.isMesh && o.geometry) {
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    part.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    box.union(part);
  }
  for (const c of o.children) collect(c);
}
const GAP = 4; // px entre etiquetas

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// retângulo de um objeto 3D na tela (coordenadas da janela)
function screenRect(obj, camera, canvasRect) {
  box.makeEmpty();
  collect(obj);
  if (box.isEmpty() && obj.parent) collect(obj.parent);
  if (box.isEmpty()) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < 8; i++) {
    v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
    v.project(camera);
    if (v.z > 1) return null; // atrás da câmera
    const sx = canvasRect.left + ((v.x + 1) / 2) * canvasRect.width;
    const sy = canvasRect.top + ((1 - v.y) / 2) * canvasRect.height;
    x0 = Math.min(x0, sx);
    y0 = Math.min(y0, sy);
    x1 = Math.max(x1, sx);
    y1 = Math.max(y1, sy);
  }
  // objetos enormes (ex.: o chão inteiro) não contam
  if (x1 - x0 > canvasRect.width * 0.7 || y1 - y0 > canvasRect.height * 0.7) return null;
  return { x: x0 - 6, y: y0 - 6, w: x1 - x0 + 12, h: y1 - y0 + 12 };
}

// deslocamentos candidatos, do mais perto ao mais longe
function candidates(w, h) {
  const out = [[0, 0]];
  const sy = h + GAP;
  const sx = w * 0.6 + GAP;
  for (let k = 1; k <= 4; k++) {
    out.push([0, -k * sy], [0, k * sy], [k * sx, 0], [-k * sx, 0]);
    out.push([k * sx, -k * sy], [-k * sx, -k * sy], [k * sx, k * sy], [-k * sx, k * sy]);
  }
  return out;
}

// Marca um objeto 3D (ref) como "não pode ser coberto por etiquetas".
export function useProtected(...refs) {
  useEffect(() => {
    for (const r of refs) protectedRegistry.add(r);
    return () => {
      for (const r of refs) protectedRegistry.delete(r);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function LabelLayout() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const last = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (now - last.current < 140) return;
    last.current = now;
    const canvasRect = gl.domElement.getBoundingClientRect();
    if (!canvasRect.width) return;

    const blocked = [];
    for (const r of protectedRegistry) {
      const o = r?.current;
      if (!o || !o.visible) continue;
      const rect = screenRect(o, camera, canvasRect);
      if (rect) blocked.push(rect);
    }

    // posição "natural" de cada etiqueta (sem o deslocamento atual)
    const items = [];
    for (const el of labelRegistry) {
      if (!el.isConnected) {
        labelRegistry.delete(el);
        continue;
      }
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const dx = Number(el.dataset.dx || 0);
      const dy = Number(el.dataset.dy || 0);
      items.push({ el, x: r.left - dx, y: r.top - dy, w: r.width, h: r.height, dx, dy });
    }
    // de cima para baixo (ordem estável)
    items.sort((a, b) => a.y - b.y || a.x - b.x);

    const placed = [];
    for (const it of items) {
      const free = (cx, cy) => {
        const rect = { x: it.x + cx, y: it.y + cy, w: it.w, h: it.h };
        if (rect.x < canvasRect.left || rect.y < canvasRect.top) return null;
        if (rect.x + rect.w > canvasRect.right || rect.y + rect.h > canvasRect.bottom) return null;
        if (placed.some((p) => overlaps(p, rect)) || blocked.some((p) => overlaps(p, rect))) return null;
        return rect;
      };
      // o lugar livre MAIS PRÓXIMO do ponto que a etiqueta descreve
      let best = null;
      for (const [cx, cy] of candidates(it.w, it.h)) {
        const rect = free(cx, cy);
        if (rect) {
          best = [cx, cy, rect];
          break;
        }
      }
      // para não "pular" à toa: mantém o lugar atual se ele ainda está livre e
      // não é muito mais longe que o melhor
      if (best && (it.dx || it.dy)) {
        const keep = free(it.dx, it.dy);
        const far = Math.hypot(it.dx, it.dy) - Math.hypot(best[0], best[1]);
        if (keep && far < it.h * 0.9) best = [it.dx, it.dy, keep];
      }
      if (!best) best = [0, 0, { x: it.x, y: it.y, w: it.w, h: it.h }];
      const [dx, dy, rect] = best;
      placed.push(rect);
      if (dx !== it.dx || dy !== it.dy) {
        it.el.dataset.dx = dx;
        it.el.dataset.dy = dy;
        it.el.style.transform = `translate(${dx}px, ${dy}px)`;
        const len = Math.hypot(dx, dy);
        it.el.classList.toggle("has-leader", len > 2);
        it.el.style.setProperty("--ll", `${len}px`);
        it.el.style.setProperty("--la", `${Math.atan2(-dy, -dx)}rad`);
      }
    }
  });
  return null;
}
