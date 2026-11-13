import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { Ball, Label3D } from "./primitives.jsx";
import { Slider, Readout } from "../components/ui.jsx";

const TOWER_HEIGHT = 9;
const G = 9.8;

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
      </group>
      <group ref={lightRef} position={[0.6, TOWER_HEIGHT, 0]}>
        <Ball position={[0, 0, 0]} color="#38bdf8" radius={0.22} />
      </group>
      <Label3D position={[-0.6, TOWER_HEIGHT + 0.6, 0]} fontSize={0.3} color="#f87171">
        pesada
      </Label3D>
      <Label3D position={[0.6, TOWER_HEIGHT + 0.6, 0]} fontSize={0.3} color="#38bdf8">
        leve
      </Label3D>
    </>
  );
}

function Tower() {
  return (
    <mesh position={[0, TOWER_HEIGHT / 2, -1.2]} castShadow receiveShadow>
      <cylinderGeometry args={[1.1, 1.3, TOWER_HEIGHT, 16]} />
      <meshPhysicalMaterial color="#aa9f82" roughness={0.88} metalness={0.02} clearcoat={0.08} />
    </mesh>
  );
}

export default function Lesson1History() {
  const [dropping, setDropping] = useState(false);
  const [aristotleMode, setAristotleMode] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [landTime, setLandTime] = useState(null);

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
      <SceneShell cameraPosition={[14, 7, 16]} controlsTarget={[0, 4.5, 0]}>
        <Tower key={resetKey} />
        <FallingBalls dropping={dropping} aristotleMode={aristotleMode} onLanded={setLandTime} />
      </SceneShell>

      <div className="panel" style={panelOverlayStyle}>
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
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Desative a "visão aristotélica" para reproduzir o experimento real: desprezando a
          resistência do ar, corpos de massas diferentes caem com a mesma aceleração (g ≈ 9,8 m/s²),
          como Galileu demonstrou — e como foi confirmado no "teste da pena e do martelo" na Lua.
        </p>
      </div>
    </div>
  );
}

const panelOverlayStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  width: 340,
  height: "100%",
  background: "rgba(10,14,26,0.72)",
  backdropFilter: "blur(8px)",
  borderLeft: "1px solid rgba(255,255,255,0.08)",
};
