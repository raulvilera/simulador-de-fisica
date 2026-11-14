import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Html } from "@react-three/drei";
import { create } from "zustand";
import { CLASSES, PLANET_INFO, fmtDist } from "../data/planets.js";
import "./planetInfo.css";

// Posição do pop-up escolhida pelo professor (px na janela). null = preso ao
// lado do planeta. Fica guardada enquanto a aula estiver aberta, então os
// próximos planetas abrem no mesmo lugar.
export const usePopupPin = create((set) => ({
  pin: null,
  setPin: (pin) => set({ pin }),
}));

// Mantém pelo menos a barra de título dentro da janela (para poder pegar de novo).
function clampPin(x, y, w) {
  const maxX = window.innerWidth - Math.min(w, 120);
  const maxY = window.innerHeight - 44;
  return { x: Math.min(Math.max(-(w - 120), x), maxX), y: Math.min(Math.max(0, y), maxY) };
}

// Pop-up com as características de um planeta. Arraste pela barra de título
// para levá-lo a qualquer parte da tela (inclusive por cima do painel);
// "↩ Junto ao planeta" ou duplo clique no título desfaz.
export function PlanetPopup({ name, offset = 0.6, onClose }) {
  const p = PLANET_INFO[name];
  const pin = usePopupPin((s) => s.pin);
  const setPin = usePopupPin((s) => s.setPin);
  const box = useRef(null);

  // se a janela mudar de tamanho, o quadro solto continua visível
  useEffect(() => {
    if (!pin) return;
    const fit = () => {
      const w = box.current?.offsetWidth ?? 250;
      setPin(clampPin(pin.x, pin.y, w));
    };
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [pin, setPin]);

  if (!p) return null;

  // Arraste com eventos da janela: funciona com mouse, caneta e dedo, e não se
  // perde se o quadro trocar de lugar na página no meio do movimento.
  const onDown = (e) => {
    if (e.button > 0 || e.target.closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    const r = box.current.getBoundingClientRect();
    const start = { sx: e.clientX, sy: e.clientY, x: r.left, y: r.top, w: r.width };
    setPin({ x: r.left, y: r.top }); // solta do planeta já no toque
    const move = (ev) => {
      ev.preventDefault();
      setPin(clampPin(start.x + ev.clientX - start.sx, start.y + ev.clientY - start.sy, start.w));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const card = (
    <div
      ref={box}
      className={`ppop${pin ? " ppop--pinned" : ""}`}
      style={pin ? { left: pin.x, top: pin.y } : { "--off": `${Math.round(offset * 40) + 18}px` }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="ppop__head"
        onPointerDown={onDown}
        onDoubleClick={() => setPin(null)}
        title="Arraste para mover o quadro (duplo clique: volta para junto do planeta)"
      >
        <span className="ppop__grip" aria-hidden="true">⠿</span>
        <b>{name}</b>
        <span className={`ppop__class ppop__class--${p.type === "Rochoso" ? "rock" : "gas"}`}>{p.type}</span>
        <button type="button" className="ppop__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
      </div>
      <p className="ppop__classText">{CLASSES[p.type]}</p>
      <dl className="ppop__list">
        <dt>🌡️ Temperatura</dt>
        <dd>{p.temp}</dd>
        <dt>☀️ Translação</dt>
        <dd>{p.translation} (uma volta ao redor do Sol)</dd>
        <dt>🔄 Rotação</dt>
        <dd>{p.rotation} (uma volta em torno de si)</dd>
        <dt>🌙 Satélites naturais</dt>
        <dd>{p.moons}</dd>
        <dt>📏 Distância ao Sol</dt>
        <dd>{fmtDist(p)}</dd>
      </dl>
      {pin ? (
        <button type="button" className="ppop__unpin" onClick={() => setPin(null)}>
          ↩ Junto ao planeta
        </button>
      ) : (
        <p className="ppop__foot">⠿ Arraste pelo título para levar o quadro a qualquer parte da tela.</p>
      )}
    </div>
  );

  return (
    <Html position={[0, 0, 0]} zIndexRange={[6, 5]} style={{ pointerEvents: "none" }}>
      {/* solto: vai para a página inteira (por cima de tudo); preso: ao lado do planeta */}
      {pin ? createPortal(card, document.body) : card}
    </Html>
  );
}

// Seta do Sol até o planeta, ao longo do eixo +X do grupo onde é colocada
// (o grupo é girado para apontar para o planeta). Começa na borda do Sol e
// termina na borda do planeta, com o rótulo da distância no meio.
export function SunDistanceArrow({ name, from, to, color = "#fbbf24" }) {
  const p = PLANET_INFO[name];
  const len = Math.max(0.2, to - from);
  const head = Math.min(0.35, len * 0.4);
  return (
    <group>
      <mesh position={[from + (len - head) / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, len - head, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[to - head / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.12, head, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[from + head / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.12, head, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {p && (
        <Html position={[from + len / 2, 0.25, 0]} center zIndexRange={[2, 0]} style={{ pointerEvents: "none" }}>
          <div className="pdist" style={{ "--c": color }}>
            <b>d</b> = {fmtDist(p)}
          </div>
        </Html>
      )}
    </group>
  );
}
