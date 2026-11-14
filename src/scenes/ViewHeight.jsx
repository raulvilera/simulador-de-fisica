import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import "./ViewHeight.css";

/**
 * Dentro do Canvas: leva a câmera (suavemente) até a altura `y` sempre que
 * `y` muda — sobe e desce pela cena sem girar nem mudar o zoom.
 * `onMove(y)` avisa a altura atual do ponto observado (para a barra acompanhar
 * quando a câmera se move por outro motivo, como seguir a queda).
 */
export function ViewHeight({ y, enabled = true, onMove }) {
  const controls = useThree((s) => s.controls);
  const goal = useRef(null);
  const lastSent = useRef(null);
  const clock = useRef(0);

  useEffect(() => {
    // valor que veio da própria câmera (sincronização da barra) não é pedido
    if (y !== lastSent.current) goal.current = y;
  }, [y]);

  useEffect(() => {
    if (!controls) return undefined;
    // o professor pegou a câmera com o dedo/mouse: a barra para de conduzir
    const start = () => (goal.current = null);
    controls.addEventListener("start", start);
    return () => controls.removeEventListener("start", start);
  }, [controls]);

  useFrame(({ camera }, delta) => {
    if (!controls) return;
    if (!enabled) goal.current = null;
    if (enabled && goal.current != null) {
      const d = goal.current - controls.target.y;
      if (Math.abs(d) < 0.005) goal.current = null;
      else {
        const step = d * (1 - Math.exp(-Math.min(delta, 0.1) * 9));
        controls.target.y += step;
        camera.position.y += step;
      }
    }
    clock.current += delta;
    if (onMove && clock.current > 0.15 && goal.current == null) {
      clock.current = 0;
      const ty = controls.target.y;
      if (lastSent.current == null || Math.abs(ty - lastSent.current) > 0.05) {
        lastSent.current = ty;
        onMove(ty);
      }
    }
  });
  return null;
}

/** Barra vertical (fora do Canvas) para subir e descer a vista. */
export function HeightBar({ value, min, max, onChange, topLabel = "Topo", bottomLabel = "Base", disabled = false }) {
  const step = (max - min) / 8;
  const clamp = (v) => Math.min(max, Math.max(min, v));
  return (
    <div className={`vbar${disabled ? " is-off" : ""}`} role="group" aria-label="Subir e descer a vista">
      <button type="button" className="vbar__btn" onClick={() => onChange(max)} disabled={disabled} title={`Ver o ${topLabel.toLowerCase()}`}>
        {topLabel}
      </button>
      <button type="button" className="vbar__arrow" onClick={() => onChange(clamp(value + step))} disabled={disabled} aria-label="Subir a vista">
        ▲
      </button>
      <div className="vbar__track">
        <input
          type="range"
          min={min}
          max={max}
          step="0.01"
          value={clamp(value)}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Altura da vista"
        />
      </div>
      <button type="button" className="vbar__arrow" onClick={() => onChange(clamp(value - step))} disabled={disabled} aria-label="Descer a vista">
        ▼
      </button>
      <button type="button" className="vbar__btn" onClick={() => onChange(min)} disabled={disabled} title={`Ver a ${bottomLabel.toLowerCase()}`}>
        {bottomLabel}
      </button>
    </div>
  );
}
