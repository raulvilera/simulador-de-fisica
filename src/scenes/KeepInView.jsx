import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

const v = new THREE.Vector3();
const c = new THREE.Vector3();
const off = new THREE.Vector3();
const dir = new THREE.Vector3();
const axesV = new THREE.Vector3();

/**
 * Câmera que acompanha a ação, mantendo os objetos de `targets` (refs de
 * Object3D) SEMPRE NO CENTRO da tela — antes, durante e depois do movimento.
 * A câmera desliza suavemente (sem trancos); se forem vários objetos e não
 * couberem, ela se afasta, e volta a se aproximar quando eles se juntam.
 * - Não briga com o professor: enquanto a câmera é arrastada/girada, pausa.
 * - `axes` escolhe em quais eixos ela pode deslizar ([1, 0, 1] = só no chão).
 * - `edgesOnly` (opcional): só age quando um objeto chega perto da borda.
 */
export default function KeepInView({ targets, enabled = true, edgesOnly = false, margin = 0.7, axes = [1, 0, 1], maxDistance = 80 }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const busy = useRef(false);
  const baseDist = useRef(null); // distância inicial da câmera (para voltar a ela)

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
    if (!n || (edgesOnly && worst < margin)) return;
    c.divideScalar(n);
    if (baseDist.current == null) baseDist.current = camera.position.distanceTo(controls.target);

    const dt = Math.min(delta, 0.1);
    // segue o centro com suavidade; mais rápido se algo já saiu da tela
    const k = 1 - Math.exp(-dt * (worst > 1 ? 6 : 3.5));
    axesV.set(axes[0], axes[1], axes[2]);
    off.copy(c).sub(controls.target).multiply(axesV).multiplyScalar(k);
    controls.target.add(off);
    camera.position.add(off);

    // vários objetos: afasta se não cabem; aproxima de novo (até a distância
    // inicial) quando eles voltam a ficar juntos
    if (n > 1) {
      v.copy(c).project(camera);
      if (Math.abs(v.x) < 0.3 && Math.abs(v.y) < 0.3) {
        dir.copy(camera.position).sub(controls.target);
        const len = dir.length();
        let next = len;
        if (worst > 0.72) next = Math.min(len * (1 + dt * 0.9), maxDistance, controls.maxDistance ?? Infinity);
        else if (worst < 0.4 && len > baseDist.current) next = Math.max(len * (1 - dt * 0.6), baseDist.current);
        if (next !== len) camera.position.copy(controls.target).add(dir.multiplyScalar(next / len));
      }
    }
  });
  return null;
}
