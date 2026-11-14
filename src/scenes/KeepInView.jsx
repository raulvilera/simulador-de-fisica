import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

const v = new THREE.Vector3();
const c = new THREE.Vector3();
const off = new THREE.Vector3();
const dir = new THREE.Vector3();
const axesV = new THREE.Vector3();

/**
 * Câmera que acompanha a ação: enquanto os objetos de `targets` (refs de
 * Object3D) estiverem bem visíveis, não faz nada; quando algum se aproxima da
 * borda da tela (ou sai dela), a câmera desliza suavemente para trazê-lo de
 * volta e, se forem vários e não couberem, se afasta um pouco.
 * - Não briga com o professor: enquanto a câmera é arrastada/girada, pausa.
 * - `axes` escolhe em quais eixos ela pode deslizar ([1, 0, 1] = só no chão).
 */
export default function KeepInView({ targets, enabled = true, margin = 0.7, axes = [1, 0, 1], maxDistance = 80 }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const busy = useRef(false);

  useEffect(() => {
    if (!controls) return undefined;
    const start = () => (busy.current = true);
    const end = () => (busy.current = false);
    controls.addEventListener("start", start);
    controls.addEventListener("end", end);
    return () => {
      controls.removeEventListener("start", start);
      controls.removeEventListener("end", end);
    };
  }, [controls]);

  useFrame((_, delta) => {
    if (!enabled || !controls || busy.current) return;
    let n = 0;
    let worst = 0;
    c.set(0, 0, 0);
    for (const r of targets) {
      const o = r?.current;
      if (!o || !o.visible) continue;
      o.getWorldPosition(v);
      c.add(v);
      n++;
      v.project(camera);
      // atrás da câmera conta como "fora da tela"
      worst = Math.max(worst, v.z > 1 ? 9 : Math.max(Math.abs(v.x), Math.abs(v.y)));
    }
    if (!n || worst < margin) return;
    c.divideScalar(n);

    const dt = Math.min(delta, 0.1);
    const k = 1 - Math.exp(-dt * (worst > 1 ? 5 : 2.5)); // mais rápido se já saiu da tela
    axesV.set(axes[0], axes[1], axes[2]);
    off.copy(c).sub(controls.target).multiply(axesV).multiplyScalar(k);
    controls.target.add(off);
    camera.position.add(off);

    // vários objetos que não cabem: com o centro já na tela, afasta a câmera
    if (n > 1) {
      v.copy(c).project(camera);
      if (Math.abs(v.x) < 0.25 && Math.abs(v.y) < 0.25 && worst > margin) {
        dir.copy(camera.position).sub(controls.target);
        const len = dir.length();
        const next = Math.min(len * (1 + dt * 0.9), maxDistance, controls.maxDistance ?? Infinity);
        camera.position.copy(controls.target).add(dir.multiplyScalar(next / len));
      }
    }
  });
  return null;
}
