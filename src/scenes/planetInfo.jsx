import { useRef } from "react";
import { Html } from "@react-three/drei";
import { create } from "zustand";
import { CLASSES, PLANET_INFO, fmtDist } from "../data/planets.js";
import "./planetInfo.css";

// Posição do pop-up escolhida pelo professor (em px dentro da área da cena).
// null = preso ao lado do planeta. Fica guardada enquanto a aula estiver aberta,
// então os próximos planetas abrem no mesmo lugar.
export const usePopupPin = create((set) => ({
  pin: null,
  setPin: (pin) => set({ pin }),
}));

// Pop-up com as características de um planeta. Arraste pela barra de título
// para levá-lo a qualquer parte da tela; "↩ Junto ao planeta" desfaz.
export function PlanetPopup({ name, offset = 0.6, onClose }) {
  const p = PLANET_INFO[name];
  const pin = usePopupPin((s) => s.pin);
  const setPin = usePopupPin((s) => s.setPin);
  const box = useRef(null);
  const drag = useRef(null);
  if (!p) return null;

  const onDown = (e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    const el = box.current;
    const area = (el.closest(".scene-frame") ?? document.body).getBoundingClientRect(); // área da cena
    const r = el.getBoundingClientRect();
    // parte visível: não deixa o quadro ir para baixo do painel lateral/gaveta
    let minX = Math.max(area.left, 0);
    let maxX = Math.min(area.right, window.innerWidth);
    const minY = Math.max(area.top, 0);
    let maxY = Math.min(area.bottom, window.innerHeight);
    const panel = document.querySelector(".panel")?.getBoundingClientRect();
    if (panel) {
      if (panel.left > window.innerWidth / 2) maxX = Math.min(maxX, panel.left);
      else if (panel.top > window.innerHeight / 3) maxY = Math.min(maxY, panel.top);
    }
    drag.current = {
      sx: e.clientX,
      sy: e.clientY,
      x: r.left - area.left,
      y: r.top - area.top,
      lo: { x: minX - area.left, y: minY - area.top },
      hi: { x: maxX - area.left - r.width, y: maxY - area.top - r.height },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    // o quadro fica sempre inteiro dentro da parte visível da cena
    const x = Math.min(Math.max(d.lo.x, d.x + e.clientX - d.sx), Math.max(d.lo.x, d.hi.x));
    const y = Math.min(Math.max(d.lo.y, d.y + e.clientY - d.sy), Math.max(d.lo.y, d.hi.y));
    setPin({ x, y });
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <Html
      position={[0, 0, 0]}
      zIndexRange={[6, 5]}
      style={{ pointerEvents: "none" }}
      calculatePosition={pin ? () => [pin.x, pin.y] : undefined}
    >
      <div
        ref={box}
        className={`ppop${pin ? " ppop--pinned" : ""}`}
        style={{ "--off": `${Math.round(offset * 40) + 18}px` }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className="ppop__head"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
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
          <p className="ppop__foot">⠿ Arraste pelo título para levar o quadro a outra parte da tela.</p>
        )}
      </div>
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
