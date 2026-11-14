import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { useMarbleTexture } from "./settings.jsx";
import { Arrow3D, Ball } from "./primitives.jsx";
import { QuantityTag, QuantityToggles, Pin, Concept } from "./quantities.jsx";
import FormulaCard, { num } from "../components/FormulaCard.jsx";
import { Readout } from "../components/ui.jsx";

const TOWER_HEIGHT = 9;
const G = 9.8;

// Conceitos mostrados dentro da cena (tocar na etiqueta oculta)
const Q = {
  m: { id: "m", symbol: "m", name: "massas diferentes", color: "#f87171" },
  h: { id: "h", symbol: "h", name: "altura da queda", color: "#a78bfa" },
  g: { id: "g", symbol: "g", name: "aceleração da gravidade", color: "#fbbf24" },
  ar: { id: "ar", symbol: "ar", name: "resistência do ar", color: "#7dd3fc" },
  t: { id: "t", symbol: "t", name: "tempo de queda", color: "#4ade80" },
};
const Q_LIST = Object.values(Q);

function FallingBalls({ dropping, aristotleMode, onLanded }) {
  const heavyRef = useRef();
  const lightRef = useRef();
  const t = useRef(0);
  const landed = useRef(false);

  useFrame((_, delta) => {
    if (!dropping) return;
    t.current += delta;

    // Galileu: mesma aceleração (g) para ambas as massas, ignorando o ar.
    const yGalileo = TOWER_HEIGHT - 0.5 * G * t.current ** 2;

    // "Visão aristotélica" (incorreta): o corpo mais pesado cairia proporcionalmente mais rápido.
    const yHeavyAristotle = TOWER_HEIGHT - 0.5 * (G * 1.6) * t.current ** 2;

    const yHeavy = aristotleMode ? yHeavyAristotle : yGalileo;
    const yLight = yGalileo;

    if (heavyRef.current) heavyRef.current.position.y = Math.max(yHeavy, 0.3);
    if (lightRef.current) lightRef.current.position.y = Math.max(yLight, 0.3);

    if (!landed.current && yLight <= 0.3) {
      landed.current = true;
      onLanded?.(t.current.toFixed(2));
    }
  });

  return (
    <>
      <group ref={heavyRef} position={[-0.6, TOWER_HEIGHT, 0]}>
        <Ball position={[0, 0, 0]} color="#f87171" radius={0.38} />
        <QuantityTag id="m" position={[-1.1, 0.35, 0]} color="#f87171" symbol="m maior" name="esfera pesada" />
      </group>
      <group ref={lightRef} position={[0.6, TOWER_HEIGHT, 0]}>
        <Ball position={[0, 0, 0]} color="#38bdf8" radius={0.22} />
        <QuantityTag id="m" position={[1.1, 0.35, 0]} color="#38bdf8" symbol="m menor" name="esfera leve" />
      </group>
    </>
  );
}

// Torre no estilo da Torre de Pisa: base, seis galerias com colunatas, campanário
// e a famosa inclinação (as esferas caem do lado "pendurado").
const LEVELS = 6;
const COLS = 22;
function Tower() {
  const columns = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mesh = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.045, 0.05, 0.92, 8),
      new THREE.MeshStandardMaterial({ color: "#f1ece0", roughness: 0.55 }),
      LEVELS * COLS
    );
    let i = 0;
    for (let l = 0; l < LEVELS; l++) {
      for (let c = 0; c < COLS; c++) {
        const ang = (c / COLS) * Math.PI * 2 + (l % 2) * (Math.PI / COLS);
        dummy.position.set(Math.cos(ang) * 1.17, 1.5 + l + 0.5, Math.sin(ang) * 1.17);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.castShadow = true;
    return mesh;
  }, []);
  // Mármore com faixas e arcadas (o mesmo da Catedral ao lado).
  const stone = useMarbleTexture();
  const [baseMap, coreMap] = useMemo(() => {
    const base = stone.clone();
    base.repeat.set(4, 1);
    const core = stone.clone();
    core.repeat.set(5, LEVELS);
    return [base, core];
  }, [stone]);
  const marble = <meshStandardMaterial color="#e7e1d3" roughness={0.62} metalness={0.02} />;
  return (
    <group position={[0, 0, -1.9]} rotation={[0.07, 0, 0]}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[1.26, 1.32, 1.5, 40]} />
        <meshStandardMaterial map={baseMap} roughness={0.62} metalness={0.02} />
      </mesh>
      <mesh position={[0, 1.5 + LEVELS / 2, 0]} castShadow>
        <cylinderGeometry args={[0.98, 0.98, LEVELS, 40]} />
        <meshStandardMaterial map={coreMap} color="#d9d3c6" roughness={0.75} />
      </mesh>
      {Array.from({ length: LEVELS + 1 }, (_, l) => (
        <mesh key={l} position={[0, 1.5 + l, 0]} castShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.09, 40]} />
          {marble}
        </mesh>
      ))}
      <primitive object={columns} />
      <mesh position={[0, 1.5 + LEVELS + 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.86, 0.9, 1.24, 32]} />
        <meshStandardMaterial map={baseMap} roughness={0.62} metalness={0.02} />
      </mesh>
      <mesh position={[0, 1.5 + LEVELS + 1.28, 0]} castShadow>
        <cylinderGeometry args={[0.95, 0.95, 0.08, 32]} />
        {marble}
      </mesh>
    </group>
  );
}

export default function Lesson1History() {
  const [dropping, setDropping] = useState(false);
  const [aristotleMode, setAristotleMode] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [landTime, setLandTime] = useState(null);
  const [hC, setHC] = useState(TOWER_HEIGHT); // calculadora de queda livre
  const [gC, setGC] = useState(G);

  const drop = () => {
    setLandTime(null);
    setDropping(true);
  };
  const reset = () => {
    setDropping(false);
    setLandTime(null);
    setResetKey((k) => k + 1);
  };

  return (
    <div className="lesson__canvas">
      <SceneShell setting="pisa" cameraPosition={[7.5, 3, 15]} controlsTarget={[0, 4.3, -0.6]} maxDistance={22}>
        <Tower />
        <FallingBalls key={resetKey} dropping={dropping} aristotleMode={aristotleMode} onLanded={setLandTime} />

        {/* h: altura de onde as esferas são soltas */}
        <Concept id="h">
          <Pin x={2.1} z={0} height={TOWER_HEIGHT} color={Q.h.color} />
        </Concept>
        <QuantityTag q={Q.h} position={[2.9, TOWER_HEIGHT / 2, 0]} value={`= ${TOWER_HEIGHT} m`} />

        {/* g: aceleração da gravidade, apontando para baixo */}
        <Concept id="g">
          <group position={[-2.3, 7.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <Arrow3D from={[0, 0, 0]} length={2.2} color={Q.g.color} />
          </group>
        </Concept>
        <QuantityTag
          q={Q.g}
          position={[-3.6, 6.3, 0]}
          value="≈ 9,8 m/s²"
          name={aristotleMode ? "Aristóteles: maior para o mais pesado (errado)" : "Galileu: igual para as duas massas"}
        />

        <QuantityTag
          q={Q.ar}
          position={[-2.6, TOWER_HEIGHT + 1.1, 0]}
          value="desprezada"
          name="sem ar, pena e martelo caem juntos"
        />

        {landTime && (
          <QuantityTag
            q={Q.t}
            position={[0, 1.4, 1.4]}
            value={`= ${landTime.replace(".", ",")} s`}
            name={aristotleMode ? "a pesada chegou antes (modelo errado)" : "as duas chegam juntas ao chão"}
          />
        )}
      </SceneShell>

      <div className="panel">
        <p className="panel__eyebrow">Aula 1 · Experimento</p>
        <h1>Torre de Pisa: Galileu x Aristóteles</h1>
        <div className="controls">
          <div className="controls__row">
            <span>Visão aristotélica (incorreta)</span>
            <input
              type="checkbox"
              checked={aristotleMode}
              onChange={(e) => setAristotleMode(e.target.checked)}
            />
          </div>
          <div className="btnRow">
            <button className="btn btn--primary" onClick={drop}>
              ▶ Soltar as esferas
            </button>
            <button className="btn btn--ghost" onClick={reset}>
              ↺ Reiniciar
            </button>
          </div>
          <Readout
            items={[
              { label: "Tempo de queda (leve)", value: landTime ? `${landTime} s` : "—" },
              { label: "Modelo ativo", value: aristotleMode ? "Aristóteles" : "Galileu" },
            ]}
          />
        </div>
        <FormulaCard
          title="Queda livre (sem resistência do ar)"
          formula={<>t = √(2 · h ÷ g)</>}
          terms={[
            { symbol: "t", name: "tempo de queda: não depende da massa", unit: "s", color: Q.t.color },
            { symbol: "h", name: "altura de onde o corpo é solto", unit: "m", color: Q.h.color },
            { symbol: "g", name: "aceleração da gravidade (Terra ≈ 9,8; Lua ≈ 1,6)", unit: "m/s²", color: Q.g.color },
          ]}
          inputs={[
            { key: "h", symbol: "h", unit: "m", value: hC, onChange: setHC, min: 0, max: 100000, color: Q.h.color },
            { key: "g", symbol: "g", unit: "m/s²", value: gC, onChange: setGC, min: 0.01, max: 1000, color: Q.g.color },
          ]}
          steps={
            <>
              t = √(2 × {num(hC)} ÷ {num(gC)}) = <b>{num(Math.sqrt((2 * hC) / gC))} s</b>
              <br />o mesmo tempo para a esfera pesada e para a leve
            </>
          }
          note="A torre da cena tem 9 m. Experimente g = 1,6 (Lua): a queda fica mais lenta, mas pena e martelo continuam chegando juntos."
          onReset={() => {
            setHC(TOWER_HEIGHT);
            setGC(G);
          }}
        />

        <QuantityToggles items={Q_LIST} />
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Desative a "visão aristotélica" para reproduzir o experimento real: desprezando a
          resistência do ar, corpos de massas diferentes caem com a mesma aceleração (g ≈ 9,8 m/s²),
          como Galileu demonstrou — e como foi confirmado no "teste da pena e do martelo" na Lua.
        </p>
      </div>
    </div>
  );
}
