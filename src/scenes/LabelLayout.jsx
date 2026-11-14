import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

// Organização automática das etiquetas da cena.
// - Cada etiqueta (QuantityTag) se registra aqui com o seu elemento HTML.
// - Objetos que não podem ser cobertos (carros, caixote, carrinho, esferas...)
//   se registram como "protegidos" (KeepInView faz isso com os que acompanha).
// - Com a cena PARADA, as etiquetas que se sobrepõem a outras ou a um objeto
//   protegido são afastadas para o lugar livre mais próximo, com uma linha
//   fina ligando a etiqueta ao ponto que ela descreve.
// - Com a cena EM MOVIMENTO, nenhuma etiqueta troca de lugar: cada uma segue
//   o seu objeto com o mesmo deslocamento e apenas os valores mudam.

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
  const lastMove = useRef(0);

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
    // Há movimento na cena? (algum ponto de etiqueta mudou de lugar na tela)
    let moved = false;
    for (const it of items) {
      const el = it.el;
      if (el._nx !== undefined && (Math.abs(el._nx - it.x) > 1.5 || Math.abs(el._ny - it.y) > 1.5)) moved = true;
      el._nx = it.x;
      el._ny = it.y;
    }
    if (moved) lastMove.current = now;
    // Enquanto algo se move, as etiquetas NÃO trocam de lugar: seguem o objeto
    // com o mesmo deslocamento e só os valores mudam. A arrumação acontece com
    // a cena parada (início, fim do movimento, depois de girar a câmera).
    const frozen = now - lastMove.current < 700;

    // de cima para baixo (ordem estável); com a cena em movimento, primeiro as
    // que já têm lugar definido
    items.sort((a, b) => {
      if (frozen) {
        const la = a.el.dataset.laid ? 0 : 1;
        const lb = b.el.dataset.laid ? 0 : 1;
        if (la !== lb) return la - lb;
      }
      return a.y - b.y || a.x - b.x;
    });

    const placed = [];
    for (const it of items) {
      if (frozen && it.el.dataset.laid) {
        // única mudança permitida em movimento: uma etiqueta que ficou longe
        // do seu ponto volta para junto dele (uma vez) quando o lugar está
        // livre há mais de 1 s
        const el = it.el;
        const home = { x: it.x - 6, y: it.y - 6, w: it.w + 12, h: it.h + 12 };
        const away = Math.hypot(it.dx, it.dy) > it.h * 1.5;
        const homeFree =
          away &&
          home.x >= canvasRect.left &&
          home.y >= canvasRect.top &&
          home.x + home.w <= canvasRect.right &&
          home.y + home.h <= canvasRect.bottom &&
          !blocked.some((p) => overlaps(p, home)) &&
          !items.some((o) => o !== it && overlaps({ x: o.x + o.dx, y: o.y + o.dy, w: o.w, h: o.h }, home));
        if (!homeFree) el._freeSince = 0;
        else if (!el._freeSince) el._freeSince = now;
        if (homeFree && now - el._freeSince > 1000) {
          el._freeSince = 0;
          it.dx = 0;
          it.dy = 0;
          el.dataset.dx = 0;
          el.dataset.dy = 0;
          el.style.transform = "translate(0px, 0px)";
          el.classList.remove("has-leader");
        }
        placed.push({ x: it.x + it.dx, y: it.y + it.dy, w: it.w, h: it.h });
        continue;
      }
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
      // mantém o lugar atual sempre que ele continua livre
      if (best && it.el.dataset.laid) {
        const keep = free(it.dx, it.dy);
        const far = Math.hypot(it.dx, it.dy) - Math.hypot(best[0], best[1]);
        if (keep && far < it.h * 2.5) best = [it.dx, it.dy, keep];
      }
      if (!best) best = [0, 0, { x: it.x, y: it.y, w: it.w, h: it.h }];
      const [dx, dy, rect] = best;
      placed.push(rect);
      it.el.dataset.laid = "1";
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
