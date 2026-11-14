import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Choice, Tag, Sun, Earth, Planet, OrbitRing, ArrowBetween } from "./space.jsx";
import { Readout, Slider } from "../components/ui.jsx";
import { QuantityTag, QuantityToggles } from "./quantities.jsx";
import FormulaCard, { num } from "../components/FormulaCard.jsx";

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  f: { id: "f", symbol: "F", name: "força de atração (igual nos dois corpos)", color: "#f87171" },
  par: { id: "par", symbol: "Ação e reação", name: "um puxa o outro com a mesma força", color: "#f472b6" },
  mare: { id: "mare", symbol: "Maré alta", name: "oceano puxado na direção da Lua", color: "#38bdf8" },
  lua: { id: "lua", symbol: "Atração da Lua", name: "força gravitacional sobre a Terra", color: "#f87171" },
  alinh: { id: "alinh", symbol: "Alinhamento", name: "Sol, Terra e Lua", color: "#facc15" },
};
const Q_LAW = [Q.f, Q.par];
const Q_TIDES = [Q.mare, Q.lua, Q.alinh];

// --- Modo 1: dois corpos e a Lei da Gravitação Universal -------------------
function TwoBodies({ m1, m2, d, force }) {
  const r1 = 0.35 + Math.cbrt(m1) * 0.28;
  const r2 = 0.35 + Math.cbrt(m2) * 0.28;
  const x1 = -d / 2;
  const x2 = d / 2;
  // As duas forças têm a MESMA intensidade (ação e reação), em sentidos opostos.
  const len = Math.min(0.5 + force * 0.35, d / 2 - 0.1);
  return (
    <>
      <pointLight position={[0, 8, 8]} intensity={2.4} decay={0} />
      <group position={[x1, 0, 0]}>
        <Planet radius={r1} color="#3b82f6" />
        <Tag position={[0, r1 + 0.45, 0]} color="#93c5fd">{`m1 = ${m1}`}</Tag>
      </group>
      <group position={[x2, 0, 0]}>
        <Planet radius={r2} color="#f59e0b" />
        <Tag position={[0, r2 + 0.45, 0]} color="#fcd34d">{`m2 = ${m2}`}</Tag>
      </group>
      <ArrowBetween from={[x1, -r1 - 0.35, 0]} to={[x1 + len, -r1 - 0.35, 0]} color="#f87171" />
      <ArrowBetween from={[x2, -r2 - 0.35, 0]} to={[x2 - len, -r2 - 0.35, 0]} color="#f87171" />
      <ArrowBetween from={[x1, 2.6, 0]} to={[x2, 2.6, 0]} color="#64748b" thickness={0.02} />
      <Tag position={[0, 3.0, 0]} color="#aab3cf">{`d = ${d}`}</Tag>
      <QuantityTag q={Q.f} position={[0, -1.9, 0]} value={`= ${m1} × ${m2} ÷ ${d}² = ${force.toFixed(2).replace(".", ",")}`} />
      <QuantityTag q={Q.par} position={[0, -2.9, 0]} />
    </>
  );
}

// --- Modo 2: a Lua e as marés ---------------------------------------------
function Tides({ moonAngle, playing, setMoonAngle }) {
  const water = useRef();
  const a = (moonAngle * Math.PI) / 180;
  // Alinhados com o Sol (0° e 180°) → efeitos se somam; em ângulo reto → menor.
  const stretch = 0.2 + 0.11 * Math.cos(2 * a);

  useFrame((_, delta) => {
    if (playing) setMoonAngle((v) => (v + delta * 25) % 360);
  });

  return (
    <>
      <Sun position={[-9, 0, 0]} radius={1.3} />
      <Tag position={[-9, 1.9, 0]} color="#ffc94d">Sol</Tag>
      <Earth radius={1} />
      {/* "capa" de oceano esticada na direção da Lua (exagerada para dar para ver) */}
      <group rotation={[0, -a, 0]}>
        <mesh ref={water} scale={[1.06 + stretch, 1.03, 1.03]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.45} roughness={0.2} />
        </mesh>
      </group>
      <OrbitRing radius={4} />
      <group position={[Math.cos(a) * 4, 0, Math.sin(a) * 4]}>
        <Planet radius={0.3} color="#cbd5e1" />
        <Tag position={[0, 0.65, 0]}>Lua</Tag>
      </group>
      <ArrowBetween from={[Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5]} to={[Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2]} color="#f87171" />
      <QuantityTag q={Q.lua} position={[Math.cos(a) * 2.4, 0.6, Math.sin(a) * 2.4]} />
      <QuantityTag q={Q.mare} position={[-Math.cos(a) * 1.9, -0.9, -Math.sin(a) * 1.9]} name="dois bojos: do lado da Lua e do lado oposto" />
      <QuantityTag
        q={Q.alinh}
        position={[-4.5, 2.2, 0]}
        value={Math.abs(Math.cos(a)) > 0.85 ? "alinhados → marés mais altas" : Math.abs(Math.cos(a)) < 0.5 ? "ângulo reto → marés menores" : "intermediário"}
      />
    </>
  );
}

export default function Lesson17Gravitation() {
  const [mode, setMode] = useState("law");
  const [m1, setM1] = useState(6);
  const [m2, setM2] = useState(2);
  const [d, setD] = useState(6);
  const [moonAngle, setMoonAngle] = useState(0);
  const [playing, setPlaying] = useState(false);

  const [mP, setMP] = useState(50); // F = m·g: massa de uma pessoa (kg)
  const [gP, setGP] = useState(9.8);
  const force = (m1 * m2) / (d * d);
  const a = (moonAngle * Math.PI) / 180;
  const align = Math.abs(Math.cos(a)); // 1 = alinhados, 0 = ângulo reto
  const tide = align > 0.85 ? "Mais altas" : align < 0.5 ? "Menores" : "Intermediárias";
  const config = align > 0.85 ? "Alinhados" : align < 0.5 ? "Ângulo reto" : "Intermediária";

  return (
    <div className="lesson__canvas">
      <SceneShell space cameraPosition={[-2, 8, 17]} controlsTarget={[-2, 0, 0]}>
        {mode === "law" ? (
          <group position={[-2, 0, 0]}>
            <TwoBodies m1={m1} m2={m2} d={d} force={force} />
          </group>
        ) : (
          <Tides moonAngle={moonAngle} playing={playing} setMoonAngle={setMoonAngle} />
        )}
      </SceneShell>

      <Panel eyebrow="Aula 17 · Gravitação" title="Força gravitacional">
        <div className="controls">
          <Choice
            value={mode}
            onChange={setMode}
            options={[
              { value: "law", label: "Lei da Gravitação" },
              { value: "tides", label: "A Lua e as marés" },
            ]}
          />
          {mode === "law" ? (
            <>
              <Slider label="Massa 1" value={m1} onChange={setM1} min={1} max={10} step={1} />
              <Slider label="Massa 2" value={m2} onChange={setM2} min={1} max={10} step={1} />
              <Slider label="Distância" value={d} onChange={setD} min={3} max={10} step={1} />
              <Readout
                items={[
                  { label: "Força (m1·m2 / d²)", value: force.toFixed(2).replace(".", ",") },
                  { label: "Dobrando a distância", value: "Força ÷ 4" },
                ]}
              />
            </>
          ) : (
            <>
              <Slider label="Posição da Lua" value={Math.round(moonAngle)} onChange={(v) => { setPlaying(false); setMoonAngle(v); }} min={0} max={359} step={1} unit="°" />
              <div className="btnRow">
                <button className="btn btn--primary" onClick={() => setPlaying((p) => !p)}>
                  {playing ? "⏸ Pausar" : "▶ Girar a Lua"}
                </button>
              </div>
              <Readout
                items={[
                  { label: "Sol, Terra e Lua", value: config },
                  { label: "Marés", value: tide },
                ]}
              />
            </>
          )}
        </div>
        {mode === "law" && (
          <>
            <FormulaCard
              title="Lei da Gravitação Universal"
              formula={<>F ∝ m<sub>1</sub> · m<sub>2</sub> ÷ d²</>}
              terms={[
                { symbol: "F", name: "força de atração gravitacional (igual nos dois corpos)", unit: "unid. relativas", color: "#f87171" },
                { symbol: "m₁", name: "massa do corpo 1", color: "#93c5fd" },
                { symbol: "m₂", name: "massa do corpo 2", color: "#fcd34d" },
                { symbol: "d", name: "distância entre os centros dos corpos", color: "#aab3cf" },
              ]}
              inputs={[
                { key: "m1", symbol: "m₁", value: m1, onChange: setM1, min: 1, max: 10, color: "#93c5fd" },
                { key: "m2", symbol: "m₂", value: m2, onChange: setM2, min: 1, max: 10, color: "#fcd34d" },
                { key: "d", symbol: "d", value: d, onChange: setD, min: 3, max: 10, color: "#aab3cf" },
              ]}
              steps={
                <>
                  F = {num(m1)} × {num(m2)} ÷ {num(d)}² = <b>{num(force)}</b>
                  <br />
                  com d = {num(2 * d)} (o dobro): F = <b>{num(force / 4)}</b> (÷ 4)
                </>
              }
              note="Na cena, massas de 1 a 10 e distância de 3 a 10 (unidades relativas)."
              onReset={() => {
                setM1(6);
                setM2(2);
                setD(6);
              }}
            />
            <FormulaCard
              title="Peso (força da gravidade perto da superfície)"
              formula={<>F = m · g</>}
              terms={[
                { symbol: "F", name: "peso: força com que o planeta atrai o corpo", unit: "N", color: "#f87171" },
                { symbol: "m", name: "massa do corpo", unit: "kg", color: "#93c5fd" },
                { symbol: "g", name: "aceleração da gravidade (Terra ≈ 9,8; Lua ≈ 1,6)", unit: "m/s²", color: "#fbbf24" },
              ]}
              inputs={[
                { key: "m", symbol: "m", unit: "kg", value: mP, onChange: setMP, min: 0, max: 1000000, color: "#93c5fd" },
                { key: "g", symbol: "g", unit: "m/s²", value: gP, onChange: setGP, min: 0, max: 1000, color: "#fbbf24" },
              ]}
              steps={
                <>
                  F = {num(mP)} × {num(gP)} = <b>{num(mP * gP)} N</b>
                </>
              }
              onReset={() => {
                setMP(50);
                setGP(9.8);
              }}
            />
          </>
        )}
        <QuantityToggles items={mode === "law" ? Q_LAW : Q_TIDES} />
        {mode === "law" ? (
          <Note>
            <b>Lei da Gravitação Universal</b> (Newton, 1687): dois corpos se atraem com uma força
            proporcional ao produto das massas e inversamente proporcional ao quadrado da
            distância. As duas setas têm sempre o mesmo tamanho: a Terra nos atrai e nós também a
            atraímos. Perto da superfície a conta simplifica para F = m·g, com g ≈ 9,8 m/s² na
            Terra. Valores em unidades relativas.
          </Note>
        ) : (
          <Note>
            A força gravitacional da Lua interfere diretamente nas marés. Quando Terra, Lua e Sol
            estão <b>alinhados</b>, a atração se intensifica e as marés são mais altas; quando
            formam um <b>ângulo reto</b>, as forças atuam em direções diferentes e as marés são
            menores. A deformação do oceano está exagerada para ficar visível.
          </Note>
        )}
      </Panel>
    </div>
  );
}
