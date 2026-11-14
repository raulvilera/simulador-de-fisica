import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import SceneShell from "./SceneShell.jsx";
import { useThrottled } from "./useThrottled.js";
import { Vehicle, RulerTrack } from "./primitives.jsx";
import { Readout } from "../components/ui.jsx";

// Replica o exemplo do material: A (0 m) -> C (10 m) -> volta e para em B (6 m).
const PATH = [0, 10, 6];
const SPEED = 2.5; // m/s

function Walker({ playing, resetKey, onUpdate }) {
  const ref = useRef();
  const turnRef = useRef();
  const legIndex = useRef(0);
  const pos = useRef(PATH[0]);
  const distance = useRef(0);
  const report = useThrottled(onUpdate);

  useFrame((_, delta) => {
    if (!playing || legIndex.current >= PATH.length - 1) return;
    const target = PATH[legIndex.current + 1];
    const dir = target > pos.current ? 1 : -1;

    // Antes de voltar, o carro faz a meia-volta: ele sempre anda de frente.
    const heading = dir > 0 ? 0 : Math.PI;
    const turn = turnRef.current;
    if (turn && Math.abs(turn.rotation.y - heading) > 0.001) {
      const d = heading - turn.rotation.y;
      turn.rotation.y += Math.sign(d) * Math.min(Math.abs(d), 3.5 * delta);
      return;
    }
    const step = SPEED * delta * dir;
    const prev = pos.current;

    if ((dir > 0 && pos.current + step >= target) || (dir < 0 && pos.current + step <= target)) {
      distance.current += Math.abs(target - pos.current);
      pos.current = target;
      legIndex.current += 1;
    } else {
      pos.current += step;
      distance.current += Math.abs(step);
    }

    if (ref.current) ref.current.position.x = pos.current;
    report(
      {
        position: pos.current,
        distance: distance.current,
        displacement: pos.current - PATH[0],
        finished: legIndex.current >= PATH.length - 1,
      },
      pos.current === target
    );
    void prev;
  });

  return (
    <group key={resetKey} ref={ref} position={[PATH[0], 0.3, 0]}>
      <group ref={turnRef}>
        <Vehicle color="#8b5cf6" />
      </group>
    </group>
  );
}

export default function Lesson3Displacement() {
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [stats, setStats] = useState({ position: 0, distance: 0, displacement: 0 });

  const reset = () => {
    setPlaying(false);
    setStats({ position: PATH[0], distance: 0, displacement: 0 });
    setResetKey((k) => k + 1);
  };

  return (
    <div className="lesson__canvas">
      <SceneShell cameraPosition={[3.5, 3.2, 12.5]} controlsTarget={[7, 0.2, 0]}>
        <RulerTrack length={14} start={0} highlight={PATH} />
        <Walker key={resetKey} playing={playing} resetKey={resetKey} onUpdate={setStats} />
      </SceneShell>

      <div className="panel" style={panelOverlayStyle}>
        <p className="panel__eyebrow">Aula 3 · Posição e deslocamento</p>
        <h1>Distância percorrida x deslocamento</h1>
        <div className="controls">
          <div className="btnRow">
            <button className="btn btn--primary" onClick={() => setPlaying(true)}>
              ▶ Ir de A (0m) → C (10m) → B (6m)
            </button>
          </div>
          <div className="btnRow">
            <button className="btn btn--ghost" onClick={reset}>
              ↺ Reiniciar
            </button>
          </div>
          <Readout
            items={[
              { label: "Posição atual", value: `${stats.position.toFixed(1)} m` },
              { label: "Distância percorrida", value: `${stats.distance.toFixed(1)} m` },
              { label: "Deslocamento (ΔS)", value: `${stats.displacement.toFixed(1)} m` },
            ]}
          />
        </div>
        <p style={{ fontSize: "0.82rem", color: "#a6adc9", marginTop: 14 }}>
          ΔS = S<sub>f</sub> − S<sub>0</sub>. Repare que a distância percorrida soma o trajeto todo
          (10 + 4 = 14 m), enquanto o deslocamento considera só a posição final e a inicial
          (6 − 0 = 6 m) — exatamente o exemplo do "Pause e responda" da aula.
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
