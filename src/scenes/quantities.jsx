import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import "./quantities.css";

// Grandezas físicas mostradas dentro da cena: etiquetas (HTML) presas a pontos
// 3D e setas pintadas no chão. Cada grandeza tem uma cor, que se repete na
// fórmula do painel, para o aluno ligar o símbolo da equação ao que vê na cena.
// Tocar numa etiqueta oculta aquela grandeza (etiqueta + seta); o painel tem
// os botões para mostrar de novo.

export function useQuantityVisibility(ids) {
  const [hidden, setHidden] = useState(() => new Set());
  return {
    isVisible: (id) => !hidden.has(id),
    hide: (id) => setHidden((h) => new Set(h).add(id)),
    toggle: (id) =>
      setHidden((h) => {
        const n = new Set(h);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    showAll: () => setHidden(new Set()),
    hideAll: () => setHidden(new Set(ids)),
    noneVisible: ids.every((id) => hidden.has(id)),
    allVisible: hidden.size === 0,
  };
}

// Etiqueta clicável presa a um ponto da cena.
export function QuantityTag({ position = [0, 0, 0], color, symbol, name, value, onHide }) {
  return (
    <Html position={position} center zIndexRange={[2, 0]}>
      <button
        type="button"
        className="qtag"
        style={{ "--qc": color }}
        onClick={(e) => {
          e.stopPropagation();
          onHide?.();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title="Toque para ocultar esta grandeza"
      >
        <span className="qtag__head">
          <span className="qtag__symbol">{symbol}</span>
          {value != null && <span className="qtag__value">{value}</span>}
        </span>
        {name && <span className="qtag__name">{name}</span>}
        <span className="qtag__x" aria-hidden="true">
          ×
        </span>
      </button>
    </Html>
  );
}

// Haste vertical que liga um ponto do chão à etiqueta.
export function Pin({ x = 0, z = 0, height = 1.5, color }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, height, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.14, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

const HEAD_LEN = 0.38;
const HEAD_W = 0.36;
const headShape = new THREE.Shape();
headShape.moveTo(0, 0);
headShape.lineTo(-HEAD_LEN, HEAD_W / 2);
headShape.lineTo(-HEAD_LEN, -HEAD_W / 2);
headShape.closePath();

// Seta de `getFrom()` até `getTo()` (em X), lida a cada quadro para acompanhar o
// movimento sem redesenhar o React. Por padrão fica em pé (de frente para a
// câmera); com `flat` fica deitada no chão.
export function SpanArrow({ getFrom, getTo, z = 0, y = 2, color, width = 0.1, flat = false }) {
  const shaft = useRef();
  const head = useRef();
  const tick = useRef();
  const root = useRef();
  const headGeo = useMemo(() => new THREE.ShapeGeometry(headShape), []);

  useFrame(() => {
    const a = getFrom();
    const b = getTo();
    const L = b - a;
    const len = Math.abs(L);
    if (!root.current) return;
    root.current.visible = len > 0.05;
    if (!root.current.visible) return;
    const dir = Math.sign(L);
    const shaftLen = Math.max(0.001, len - Math.min(HEAD_LEN, len));
    shaft.current.scale.x = shaftLen;
    shaft.current.position.x = a + (dir * shaftLen) / 2;
    head.current.position.x = b;
    head.current.rotation.z = dir > 0 ? 0 : Math.PI;
    tick.current.position.x = a;
  });

  return (
    <group ref={root} position={[0, y, z]}>
      <mesh ref={shaft} rotation={[flat ? -Math.PI / 2 : 0, 0, 0]} renderOrder={2}>
        <planeGeometry args={[1, width]} />
        <meshBasicMaterial
          color={color}
          toneMapped={false}
          transparent
          opacity={0.95}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group rotation={[flat ? -Math.PI / 2 : 0, 0, 0]}>
        <mesh ref={head} geometry={headGeo} renderOrder={2}>
          <meshBasicMaterial
            color={color}
            toneMapped={false}
            transparent
            opacity={0.95}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* marca de início da seta */}
        <mesh ref={tick} renderOrder={2}>
          <planeGeometry args={[0.06, HEAD_W]} />
          <meshBasicMaterial
            color={color}
            toneMapped={false}
            transparent
            opacity={0.95}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

// Painel: liga/desliga cada grandeza (as cores são as mesmas da cena).
export function QuantityToggles({ items, vis }) {
  return (
    <div className="panel__section qtoggles">
      <h3>Grandezas na cena</h3>
      <div className="qtoggles__chips">
        {items.map((q) => {
          const on = vis.isVisible(q.id);
          return (
            <button
              key={q.id}
              type="button"
              className={`qchip${on ? " is-on" : ""}`}
              style={{ "--qc": q.color }}
              onClick={() => vis.toggle(q.id)}
              aria-pressed={on}
              title={on ? "Ocultar" : "Mostrar"}
            >
              <span className="qchip__dot" />
              <b>{q.symbol}</b> {q.name}
            </button>
          );
        })}
      </div>
      <div className="btnRow">
        <button type="button" className="btn btn--ghost" onClick={vis.showAll} disabled={vis.allVisible}>
          Mostrar todas
        </button>
        <button type="button" className="btn btn--ghost" onClick={vis.hideAll} disabled={vis.noneVisible}>
          Ocultar todas
        </button>
      </div>
      <p className="qtoggles__hint">Toque numa etiqueta dentro da cena para ocultá-la.</p>
    </div>
  );
}

// Termo colorido de uma fórmula; clicar mostra/oculta a grandeza na cena.
export function Term({ q, vis, children }) {
  const on = vis.isVisible(q.id);
  return (
    <button
      type="button"
      className={`qterm${on ? "" : " is-off"}`}
      style={{ "--qc": q.color }}
      onClick={() => vis.toggle(q.id)}
      title={`${q.name} — ${on ? "ocultar" : "mostrar"} na cena`}
    >
      {children ?? q.symbol}
    </button>
  );
}
