import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Subir e descer a vista com o próprio gesto, sem botões:
 * - celular: deslizar UM dedo para cima/baixo sobre a cena;
 * - computador: rolar a roda do mouse (ou arrastar com o botão esquerdo).
 * Arrastar para os lados continua girando a cena; o zoom fica na pinça (dois
 * dedos) ou em Ctrl + roda do mouse.
 * `resetKey` devolve a vista à altura `startY`.
 */
export default function DragHeight({ enabled = true, min = 0, max = 10, startY, resetKey }) {
  const controls = useThree((s) => s.controls);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const on = useRef(enabled);
  const goal = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    on.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (first.current) first.current = false;
    else if (startY != null) goal.current = startY;
  }, [resetKey, startY]);

  useEffect(() => {
    if (!controls) return undefined;
    const el = gl.domElement;
    // o arrasto vertical passa a mover a vista (em vez de inclinar a câmera)
    const polar = controls.getPolarAngle();
    const saved = [controls.minPolarAngle, controls.maxPolarAngle];
    controls.minPolarAngle = polar;
    controls.maxPolarAngle = polar;

    const shift = (dy) => {
      if (!on.current) return;
      goal.current = null;
      const y = Math.min(max, Math.max(min, controls.target.y + dy));
      const d = y - controls.target.y;
      controls.target.y += d;
      camera.position.y += d;
    };
    // quanto vale 1 pixel da tela em unidades da cena, na distância do alvo
    const perPixel = () => {
      const dist = camera.position.distanceTo(controls.target);
      return (2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / el.clientHeight;
    };

    const pointers = new Map();
    const down = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointers.set(e.pointerId, e.clientY);
    };
    const move = (e) => {
      if (!pointers.has(e.pointerId)) return;
      const dy = e.clientY - pointers.get(e.pointerId);
      pointers.set(e.pointerId, e.clientY);
      if (pointers.size === 1) shift(dy * perPixel()); // dedo desce → a cena desce junto
    };
    const up = (e) => pointers.delete(e.pointerId);
    const wheel = (e) => {
      if (e.ctrlKey || e.metaKey) return; // Ctrl + roda = zoom
      e.preventDefault();
      e.stopImmediatePropagation();
      const px = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      shift(-px * perPixel() * 0.6); // rolar para baixo → a vista desce
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { capture: true, passive: false });
    return () => {
      controls.minPolarAngle = saved[0];
      controls.maxPolarAngle = saved[1];
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel, { capture: true });
    };
  }, [controls, camera, gl, min, max]);

  // volta suave à altura inicial depois de "Reiniciar"
  useFrame((_, delta) => {
    if (!controls || goal.current == null) return;
    if (!on.current) {
      goal.current = null;
      return;
    }
    const d = goal.current - controls.target.y;
    if (Math.abs(d) < 0.005) goal.current = null;
    else {
      const step = d * (1 - Math.exp(-Math.min(delta, 0.1) * 9));
      controls.target.y += step;
      camera.position.y += step;
    }
  });
  return null;
}
