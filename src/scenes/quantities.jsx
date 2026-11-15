import { useCallback, useMemo, useRef, useState } from "react";
import { labelRegistry, anchoredRegistry } from "./LabelLayout.jsx";
import { create } from "zustand";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import "./quantities.css";

// Grandezas físicas mostradas dentro da cena: etiquetas (HTML) presas a pontos
// 3D e setas pintadas no chão. Cada grandeza tem uma cor, que se repete na
// fórmula do painel, para o aluno ligar o símbolo da equação ao que vê na cena.
// Tocar numa etiqueta oculta aquela grandeza (etiqueta + seta); o painel tem
// os botões para mostrar de novo.

// Estado global das etiquetas ocultas (vale para a aula aberta; ao trocar de
// aula tudo volta a aparecer). Assim a etiqueta da cena, os botões do painel e
// o botão "mostrar etiquetas" da barra da caneta ficam sempre de acordo.
export const useConcepts = create((set) => ({
  hidden: new Set(),
  // false = etiquetas compactas (só símbolo e valor; a explicação abre ao
  // tocar/passar o mouse); true = todas mostram a explicação
  detail: false,
  setDetail: (detail) => set({ detail }),
  hide: (id) => set((s) => ({ hidden: new Set(s.hidden).add(id) })),
  toggle: (id) =>
    set((s) => {
      const n = new Set(s.hidden);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return { hidden: n };
    }),
  hideMany: (ids) => set((s) => ({ hidden: new Set([...s.hidden, ...ids]) })),
  showMany: (ids) => set((s) => ({ hidden: new Set([...s.hidden].filter((h) => !ids.includes(h))) })),
  showAll: () => set({ hidden: new Set() }),
}));

export const useConceptVisible = (id) => useConcepts((s) => !s.hidden.has(id));

// Atalho para uma lista de grandezas de uma aula.
export function useQuantityVisibility(ids) {
  const hidden = useConcepts((s) => s.hidden);
  const { hide, toggle, hideMany, showMany } = useConcepts.getState();
  return {
    isVisible: (id) => !hidden.has(id),
    hide,
    toggle,
    showAll: () => showMany(ids),
    hideAll: () => hideMany(ids),
    noneVisible: ids.every((id) => hidden.has(id)),
    allVisible: ids.every((id) => !hidden.has(id)),
  };
}

// Etiqueta clicável presa a um ponto da cena.
// Etiqueta da cena. Fica compacta (símbolo e valor, semitransparente) para não
// esconder o que acontece na simulação; tocar nela (ou passar o mouse) mostra a
// explicação, e o × a apaga. Com `id`, o estado de oculta é global.
// `anchored`: a etiqueta fica SEMPRE no seu ponto (ex.: no meio de uma cota) —
// a organização automática não a move nem desenha linha-guia; ela só serve de
// obstáculo para as outras etiquetas não a cobrirem.
export function QuantityTag({ position = [0, 0, 0], ...props }) {
  const key = props.id ?? props.q?.id;
  const visible = useConcepts((s) => !key || !s.hidden.has(key));
  if (!visible) return null;
  return (
    <Html position={position} center zIndexRange={[2, 0]}>
      <TagBody {...props} />
    </Html>
  );
}

// Etiqueta fora da cena 3D, no quadro fixo do topo (QuantityHud): para
// grandezas que não ocupam um lugar na pista (tempo, velocidade média...).
export function HudTag(props) {
  const key = props.id ?? props.q?.id;
  const visible = useConcepts((s) => !key || !s.hidden.has(key));
  if (!visible) return null;
  return <TagBody {...props} anchored />;
}

// Quadro fixo no topo da cena com as HudTag (não se mexe com a câmera).
export function QuantityHud({ children }) {
  return (
    <div className="qhud" aria-label="Grandezas da viagem inteira">
      {children}
    </div>
  );
}

function TagBody({ id, q, color, symbol, name, value, onHide, anchored = false, elRef }) {
  const key = id ?? q?.id;
  const detail = useConcepts((s) => s.detail);
  const [open, setOpen] = useState(false);
  // registra a etiqueta na organização automática (evita sobreposições)
  const reg = useCallback(
    (el) => {
      const registry = anchored ? anchoredRegistry : labelRegistry;
      if (elRef) elRef.current = el;
      if (el) registry.add(el);
      else
        for (const e of registry) {
          if (!e.isConnected) registry.delete(e);
        }
    },
    [anchored, elRef],
  );
  color = color ?? q?.color;
  symbol = symbol ?? q?.symbol;
  name = name ?? q?.name;
  const hideIt = onHide ?? (key ? () => useConcepts.getState().hide(key) : undefined);
  const expanded = detail || open;
  return (
    <div
        ref={reg}
        className={`qtag${expanded ? " is-open" : ""}${anchored ? " qtag--anchored" : ""}`}
        style={{ "--qc": color }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="qtag__leader" aria-hidden="true" />
        <button
          type="button"
          className="qtag__main"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          title={name ? `${name} — toque para ${expanded ? "recolher" : "ver a explicação"}` : undefined}
        >
          <span className="qtag__head">
            <span className="qtag__symbol">{symbol}</span>
            {value != null && <span className="qtag__value">{value}</span>}
          </span>
          {name && <span className="qtag__name">{name}</span>}
        </button>
        <button
          type="button"
          className="qtag__x"
          onClick={(e) => {
            e.stopPropagation();
            hideIt?.();
          }}
          aria-label="Ocultar esta etiqueta"
          title="Ocultar"
        >
          ×
        </button>
      </div>
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

// Alturas fixas ("faixas") para as cotas acima da pista. Cada grandeza usa uma
// faixa própria, então as setas nunca se cruzam; as etiquetas que andam com o
// carro ficam abaixo da faixa 0.
export const LANE_Y = (i) => 2.05 + i * 0.8;
export const CAR_TAG_Y = 1.0; // etiqueta logo acima do carro (o carro fica em y = 0,3)

// Onde pôr a etiqueta de uma cota: no meio do pedaço da seta que aparece na
// tela (quando a câmera mostra só parte de uma seta comprida, a etiqueta não
// some para fora da tela).
const pv = new THREE.Vector3();
function labelX(a, b, y, z, camera, width, labelW = 140) {
  const margin = labelW / 2 + 8; // px: a etiqueta inteira fica dentro da tela
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const sx = (x) => {
    pv.set(x, y, z).project(camera);
    return ((pv.x + 1) / 2) * width;
  };
  const sLo = sx(lo);
  const sHi = sx(hi);
  if (!(sHi > sLo)) return (a + b) / 2; // câmera de lado/atrás: fica no meio
  const left = Math.max(sLo, margin);
  const right = Math.min(sHi, width - margin);
  if (left > right) return (a + b) / 2;
  const target = (left + right) / 2;
  // a projeção é crescente em x: busca binária do x da cena
  let x0 = lo;
  let x1 = hi;
  for (let i = 0; i < 14; i++) {
    const m = (x0 + x1) / 2;
    if (sx(m) < target) x0 = m;
    else x1 = m;
  }
  return (x0 + x1) / 2;
}

// linha tracejada vertical (linha de chamada da cota)
function DropLine({ height, color, lineRef }) {
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -height, 0)]);
    const m = new THREE.LineDashedMaterial({
      color,
      dashSize: 0.12,
      gapSize: 0.09,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      toneMapped: false,
    });
    const l = new THREE.Line(g, m);
    l.computeLineDistances();
    l.renderOrder = 2;
    return l;
  }, [height, color]);
  return <primitive object={line} ref={lineRef} />;
}

// Cota: seta de `getFrom()` até `getTo()` (em X), lida a cada quadro para
// acompanhar o movimento sem redesenhar o React. Fica em pé (de frente para a
// câmera) na altura `y` (use LANE_Y); com `flat` fica deitada no chão.
// - `drop`: linhas tracejadas descem das pontas até a pista, mostrando de qual
//   marca da régua a qual marca a grandeza vai.
// - `label`: props de uma QuantityTag que fica presa NO MEIO da seta (e a
//   acompanha enquanto ela cresce) — sem linha-guia, sem ser empurrada.
export function SpanArrow({ getFrom, getTo, z = 0, y = 2, color, width = 0.1, flat = false, drop = !flat, label }) {
  const shaft = useRef();
  const head = useRef();
  const tick = useRef();
  const root = useRef();
  const dropA = useRef();
  const dropB = useRef();
  const tag = useRef();
  const tagEl = useRef();
  const headGeo = useMemo(() => new THREE.ShapeGeometry(headShape), []);
  const dropH = Math.max(0.05, y - 0.05);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useFrame(() => {
    const a = getFrom();
    const b = getTo();
    const L = b - a;
    const len = Math.abs(L);
    if (!root.current) return;
    root.current.visible = len > 0.05;
    if (tag.current) tag.current.position.x = labelX(a, b, y, z, camera, size.width, tagEl.current?.offsetWidth);
    if (!root.current.visible) return;
    const dir = Math.sign(L);
    const shaftLen = Math.max(0.001, len - Math.min(HEAD_LEN, len));
    shaft.current.scale.x = shaftLen;
    shaft.current.position.x = a + (dir * shaftLen) / 2;
    head.current.position.x = b;
    head.current.rotation.z = dir > 0 ? 0 : Math.PI;
    tick.current.position.x = a;
    if (dropA.current) dropA.current.position.x = a;
    if (dropB.current) dropB.current.position.x = b;
  });

  return (
    <>
      {label && (
        <group ref={tag} position={[(getFrom() + getTo()) / 2, y, z]}>
          <QuantityTag color={color} {...label} anchored elRef={tagEl} />
        </group>
      )}
      <SpanArrowBody
        root={root}
        shaft={shaft}
        head={head}
        tick={tick}
        headGeo={headGeo}
        y={y}
        z={z}
        color={color}
        width={width}
        flat={flat}
      >
        {drop && (
          <>
            <DropLine height={dropH} color={color} lineRef={dropA} />
            <DropLine height={dropH} color={color} lineRef={dropB} />
          </>
        )}
      </SpanArrowBody>
    </>
  );
}

function SpanArrowBody({ root, shaft, head, tick, headGeo, y, z, color, width, flat, children }) {
  return (
    <group ref={root} position={[0, y, z]} userData={{ noProtect: true }}>
      {children}
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
export function QuantityToggles({ items, vis: given }) {
  const own = useQuantityVisibility(items.map((q) => q.id));
  const vis = given ?? own;
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
      <DetailSwitch />
      <p className="qtoggles__hint">
        Toque numa etiqueta da cena para ver a explicação; no × ela some. O botão 👁 da barra da caneta mostra de novo as
        que foram ocultadas.
      </p>
    </div>
  );
}

// Termo colorido de uma fórmula; clicar mostra/oculta a grandeza na cena.
export function Term({ q, children }) {
  const on = useConceptVisible(q.id);
  return (
    <button
      type="button"
      className={`qterm${on ? "" : " is-off"}`}
      style={{ "--qc": q.color }}
      onClick={() => useConcepts.getState().toggle(q.id)}
      title={`${q.name} — ${on ? "ocultar" : "mostrar"} na cena`}
    >
      {children ?? q.symbol}
    </button>
  );
}

// Mostra os filhos só enquanto a grandeza `id` estiver visível (setas etc.).
export function Concept({ id, children }) {
  return useConceptVisible(id) ? children : null;
}

// Compactas (só símbolo e valor) x completas (com a explicação).
export function DetailSwitch() {
  const detail = useConcepts((s) => s.detail);
  const setDetail = useConcepts((s) => s.setDetail);
  return (
    <div className="qdetail" role="group" aria-label="Tamanho das etiquetas">
      <span>Etiquetas:</span>
      <button type="button" className={!detail ? "is-on" : ""} onClick={() => setDetail(false)} aria-pressed={!detail}>
        compactas
      </button>
      <button type="button" className={detail ? "is-on" : ""} onClick={() => setDetail(true)} aria-pressed={detail}>
        com explicação
      </button>
    </div>
  );
}
