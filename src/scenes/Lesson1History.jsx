import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { useMarbleTexture } from "./settings.jsx";
import { Ball, Label3D } from "./primitives.jsx";
import { Readout } from "../components/ui.jsx";

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
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          Desative a "visão aristotélica" para reproduzir o experimento real: desprezando a
          resistência do ar, corpos de massas diferentes caem com a mesma aceleração (g ≈ 9,8 m/s²),
          como Galileu demonstrou — e como foi confirmado no "teste da pena e do martelo" na Lua.
        </p>
      </div>
    </div>
  );
}
