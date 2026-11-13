import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Panel, Note, Choice, Tag, Sun, Earth, Planet, OrbitRing, ArrowBetween } from "./space.jsx";
import { Readout, Slider, Formulas } from "../components/ui.jsx";

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
        <Formulas list={mode === "law" ? ["F ∝ m1 · m2 / d²", "F = m · g"] : []} />
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
